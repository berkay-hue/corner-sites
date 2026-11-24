// A14 — app.socialmediacorner.co otomatik blog yazarı: HTTP uçları (K1). Bağlantı/ayar/elle çalıştırma/duraklat/kaldır/yeniden dene.
// Yönlendirici (platform.js) /app/<seg>[/<id>][/<alt>] biçimini eşler; anahtarlar "METHOD seg[/:id][/alt]" (platform.js ACCT ile aynı),
// işleyici (c, id). Regex'e uymayan yollar tek parçaya indirildi: /app/cmsposts/:id/retry, /app/cmsoauth/start (K2).
// Güvenlik: secret_box/token_box/creds hiçbir yanıtta ve logda yok; tek iz hint (son 4 karakter). last_error yalnız kısa kod.
// CMS_ENABLED !== "1" ya da 0019 uygulanmamışsa her uç 503 not_ready. Üretim (LLM) ve gönderim (push) cmsTick'te (K2):
// elle çalıştırma kotayı burada önden düşer (charged=1, month/day yazılı); cmsTick bu satırda yeniden düşmez, LLM hatasında iade eder.
import { PROVIDERS, UNSUPPORTED, ERROR_HELP, slugify } from "./cms-providers.js";
import { encrypt, decrypt, redirectUri, returnBase } from "./oauth.js";
import { planLimits, PLANS } from "./plans.js";
import { genDay, genEnabled, keyOf, reserve, UPSERT, blogRequest, STOCK_URL, STOCK_TIMEOUT, stockPhoto } from "./generate.js";
import { TONES, SECTORS, STUDIO_MAX } from "./gen-prompt.js";
import { makeLlm, LlmError } from "./llm.js";
import { backPath } from "./sites.js";

export class CmsError extends Error {
  constructor(code, status = 400, extra = null) { super(code); this.code = code; this.status = status; this.extra = extra; }
}
const fail = (code, status = 400, extra = null) => { throw new CmsError(code, status, extra); };

// platform.js reply ile aynı başlıklar (orada dışa aktarılmıyor)
function reply(body, status, origin) {
  const h = { "content-type": "application/json", "cache-control": "no-store" };
  if (origin) { h["access-control-allow-origin"] = origin; h.vary = "Origin"; }
  return new Response(JSON.stringify(body), { status, headers: h });
}
const ok = (c, body) => reply({ ok: true, ...body }, 200, c.origin);

const NO_TABLE = /no such (table|column)/i;
const LIST_POSTS = 30, PROBE_PER_DAY = 20, MAX_INPUT = 4000, MAX_ITEMS = 500;
const LANGS = ["tr", "en"], LENGTHS = ["short", "medium", "long"];
const RID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPTS = "_opts"; // config içinde probe seçeneklerinin anlık görüntüsü (ayar değişikliğinde seçim yeniden denetlenir)

// Kapı: bayrak, id biçimi, CmsError → yanıt, tablo/kolon yok → not_ready; diğer hatalar platform'a (500 server)
const gate = fn => async (c, id) => {
  if (c.env?.CMS_ENABLED !== "1") return reply({ ok: false, error: "not_ready" }, 503, c.origin);
  if (id !== undefined && id !== 0 && !Number.isSafeInteger(id)) return reply({ ok: false, error: "not_found" }, 404, c.origin);
  try {
    return await fn(c, id);
  } catch (e) {
    if (e instanceof CmsError) return reply({ ok: false, error: e.code, ...(e.extra || {}) }, e.status, c.origin);
    if (NO_TABLE.test(String(e?.message || ""))) return reply({ ok: false, error: "not_ready" }, 503, c.origin);
    throw e;
  }
};

const jsonOr = (s, d) => { try { const v = JSON.parse(s ?? "null"); return v ?? d; } catch { return d; } };
const str = v => (typeof v === "string" ? v : v == null ? "" : String(v));

// ---- çıktı (beyaz liste: config toptan, secret_box, token_box asla) ----
export function siteOut(r) {
  const cfg = jsonOr(r.config, {}), opts = cfg && typeof cfg[OPTS] === "object" ? cfg[OPTS] : {};
  const choices = {};
  for (const k of Object.keys(opts || {})) if (cfg[k] != null) choices[k] = cfg[k];
  return {
    id: r.id, platform: r.platform, label: r.label, base_url: r.base_url, hint: r.hint, state: r.state, last_error: r.last_error,
    auto_publish: r.auto_publish ? 1 : 0, per_week: r.per_week, days: jsonOr(r.days, []), hour: r.hour, lang: r.lang, length: r.length,
    tone: r.tone, brief: r.brief, topics: jsonOr(r.topics, []), choices, next_run_at: r.next_run_at, created_at: r.created_at, updated_at: r.updated_at,
  };
}
export const postOut = p => ({
  id: p.id, cms_site_id: p.cms_site_id, title: p.title, state: p.state, mode: p.mode, remote_url: p.remote_url, last_error: p.last_error, created_at: p.created_at,
});

// ---- zamanlama: İstanbul sabit UTC+3; days ISO (1=Pzt..7=Paz), hour İstanbul saati; from'dan kesin sonraki ilk an ----
const IST = 3 * 3600 * 1000, DAY = 86400 * 1000;
const sqlTime = ms => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
export function nextRunAt(days, hour, from = Date.now()) {
  const set = new Set((Array.isArray(days) ? days : []).map(Number));
  if (!set.size || !Number.isInteger(hour)) return null;
  const local = from + IST, midnight = local - (local % DAY);
  for (let d = 0; d <= 8; d++) {
    const at = midnight + d * DAY + hour * 3600 * 1000, iso = new Date(at).getUTCDay() || 7;
    if (set.has(iso) && at - IST > from) return sqlTime(at - IST);
  }
  return null;
}

// ---- doğrulama ----
const bad = field => fail("bad_input", 400, { field });
// Ayarlar: base (mevcut satır ya da varsayılan) üstüne gövde; tamamı denetlenir
function settingsOf(body, base) {
  const b = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const pick = k => (b[k] !== undefined ? b[k] : base[k]);
  const label = str(pick("label")).trim();
  if (label.length > 80) bad("label");
  const per_week = Number(pick("per_week"));
  if (!Number.isInteger(per_week) || per_week < 1 || per_week > 3) bad("per_week");
  const rawDays = pick("days");
  if (!Array.isArray(rawDays)) bad("days");
  const days = rawDays.map(Number);
  if (days.some(d => !Number.isInteger(d) || d < 1 || d > 7) || new Set(days).size !== days.length || days.length !== per_week) bad("days");
  days.sort((x, y) => x - y);
  const hour = Number(pick("hour"));
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) bad("hour");
  const lang = str(pick("lang"));
  if (!LANGS.includes(lang)) bad("lang");
  const length = str(pick("length") || "medium");
  if (!LENGTHS.includes(length)) bad("length");
  const tone = str(pick("tone") || "samimi");
  if (!TONES.includes(tone)) bad("tone");
  const brief = str(pick("brief")).trim();
  if (brief.length > 1000) bad("brief");
  const rawTopics = pick("topics") ?? [];
  if (!Array.isArray(rawTopics)) bad("topics");
  const topics = rawTopics.map(t => str(t).trim()).filter(Boolean);
  if (topics.length > 30 || topics.some(t => t.length > 160)) bad("topics");
  const ap = pick("auto_publish");
  return { label, auto_publish: ap === true || ap === 1 || ap === "1" ? 1 : 0, per_week, days, hour, lang, length, tone, brief, topics };
}
const DEFAULTS = { label: "", auto_publish: 0, per_week: 1, days: [2], hour: 10, lang: "tr", length: "medium", tone: "samimi", brief: "", topics: [] };
const rowSettings = r => ({
  label: r.label ?? "", auto_publish: r.auto_publish, per_week: r.per_week, days: jsonOr(r.days, [2]), hour: r.hour, lang: r.lang,
  length: r.length, tone: r.tone || "samimi", brief: r.brief ?? "", topics: jsonOr(r.topics, []),
});

// Seçenek ebeveyni (istemcideki ebeveynler() ile aynı kural): k'nin dolu parent'larının hepsi p'nin item id'lerindeyse p ebeveyndir
function parentKeys(opts) {
  const out = {};
  for (const [k, o] of Object.entries(opts)) {
    const ps = o.items.map(i => i[1]).filter(v => v != null && v !== "").map(String);
    if (!ps.length) continue;
    for (const [p, po] of Object.entries(opts)) {
      if (p === k) continue;
      const ids = new Set(po.items.map(i => String(i[0])));
      if (ps.every(v => ids.has(v))) { out[k] = p; break; }
    }
  }
  return out;
}
// probe options → saklanan anlık görüntü { key: { required, items:[[id, parent]] } }
function snapOptions(options) {
  const out = {};
  for (const [k, o] of Object.entries(options && typeof options === "object" ? options : {})) {
    if (k === OPTS || !Array.isArray(o?.items)) continue;
    out[k] = { required: Boolean(o.required), items: o.items.slice(0, MAX_ITEMS).filter(i => i && i.id != null).map(i => [i.id, i.parent ?? null]) };
  }
  return out;
}
// Seçimleri anlık görüntüye karşı denetle → { key: id } (asıl tip korunur)
function checkChoices(choices, opts) {
  const ch = choices && typeof choices === "object" && !Array.isArray(choices) ? choices : {};
  const parents = parentKeys(opts), out = {}, items = {};
  for (const [k, o] of Object.entries(opts)) {
    const v = ch[k];
    if (v == null || v === "") { if (o.required) bad(k); continue; }
    const it = o.items.find(i => String(i[0]) === String(v));
    if (!it) bad(k);
    out[k] = it[0]; items[k] = it;
  }
  for (const [k, p] of Object.entries(parents)) {
    const par = items[k]?.[1];
    if (items[k] && par != null && par !== "" && (!items[p] || String(items[p][0]) !== String(par))) bad(k);
  }
  return out;
}

// Gövdedeki girdiler: yalnız sağlayıcının tanımlı alanları, dize, kırpılmış, sınırlı
function inputsOf(prov, raw) {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}, out = {};
  for (const f of prov.fields || []) {
    const v = r[f.key];
    if (v == null) continue;
    if (typeof v !== "string" && typeof v !== "number") bad(f.key);
    const s = String(v).trim();
    if (s.length > MAX_INPUT) bad(f.key);
    if (s) out[f.key] = s;
  }
  return out;
}
function providerOf(id) {
  const p = Object.hasOwn(PROVIDERS, str(id)) ? PROVIDERS[id] : null;
  if (!p) bad("platform");
  if (p.auth !== "key") fail("not_ready", 503); // OAuth sağlayıcıları /app/cmsoauth/start ile (K2)
  return p;
}
// OAuth sağlayıcısı da gereken env'leri (wpcom: WPCOM_CLIENT_ID/SECRET) tanımlıysa hazır; bağlantı /app/cmsoauth/start ile
const readyOf = (env, p) => (p.requires || []).every(k => env?.[k]) ? { ready: true } : { ready: false, reason: "not_ready" };

// Dış istek yapan uçlarda (probe/connect) kullanıcı başına günlük sınır (gen_usage, kind "cp")
async function probeLimit(c) {
  const day = genDay(), key = await keyOf(c.env, day, "cp", `u:${c.user.id}`);
  const row = await c.env.DB.prepare(UPSERT).bind(day, key, "cp", 1, PROBE_PER_DAY).first();
  if (!row) fail("rate", 429);
}
// Sağlayıcı probe'u; log yalnız kısa kod (cms-providers note); creds yalnız bellekte
async function runProbe(c, prov, inputs) {
  const io = { fetch: (...a) => fetch(...a), now: () => Date.now(), log: m => console.log(m), env: c.env };
  let r;
  try { r = await prov.probe(inputs, io); } catch { r = { ok: false, error: "server" }; }
  if (!r?.ok) fail(Object.hasOwn(ERROR_HELP, str(r?.error)) ? r.error : "server", 400);
  return r;
}
const account = r => ({ name: str(r.account?.name), url: str(r.account?.url) });

const userSite = (c, id) => c.env.DB.prepare("SELECT * FROM cms_sites WHERE id = ? AND user_id = ? AND site = ?").bind(id, c.user.id, c.site).first();
async function mySite(c, id) {
  const s = await userSite(c, id);
  if (!s) fail("not_found", 404);
  return s;
}
const activeCount = async c => Number((await c.env.DB.prepare("SELECT COUNT(*) AS n FROM cms_sites WHERE user_id = ? AND site = ? AND state != 'kaldirildi'")
  .bind(c.user.id, c.site).first())?.n) || 0;
const siteLimit = user => planLimits(user)?.cms_sites ?? PLANS.basic.cms_sites;
const userPosts = c => c.env.DB.prepare(
  "SELECT p.* FROM cms_posts p JOIN cms_sites s ON s.id = p.cms_site_id WHERE p.user_id = ? AND s.site = ? ORDER BY p.created_at DESC, p.id DESC LIMIT ?",
).bind(c.user.id, c.site, LIST_POSTS).all();

// ---- uçlar ----
async function list(c) {
  const env = c.env, uid = c.user.id;
  const [{ results: sites }, { results: posts }] = await Promise.all([
    env.DB.prepare("SELECT * FROM cms_sites WHERE user_id = ? AND site = ? ORDER BY id DESC").bind(uid, c.site).all(),
    userPosts(c),
  ]);
  const P = planLimits(c.user), month = genDay().slice(0, 7);
  let lb_used = 0;
  try { lb_used = Number((await env.DB.prepare("SELECT n FROM gen_month WHERE month = ? AND user_id = ? AND kind = 'lb'").bind(month, uid).first())?.n) || 0; }
  catch (e) { if (!NO_TABLE.test(String(e?.message || ""))) throw e; }
  const providers = Object.values(PROVIDERS).map(p => ({
    id: p.id, name: p.name, auth: p.auth, ...readyOf(env, p), notes_tr: p.notes_tr || "", notes_en: p.notes_en || "", fields: p.fields || [],
  }));
  return ok(c, {
    providers, unsupported: UNSUPPORTED, error_help: ERROR_HELP,
    sites: (sites || []).map(siteOut), posts: (posts || []).map(postOut),
    limits: { sites: siteLimit(c.user), used: (sites || []).filter(s => s.state !== "kaldirildi").length },
    quota: { lb_used, lb_limit: P?.linkedin_blog ?? 0 },
  });
}

async function postList(c) {
  const { results } = await userPosts(c);
  return ok(c, { posts: (results || []).map(postOut) });
}

async function probe(c) {
  const prov = providerOf(c.body.platform), inputs = inputsOf(prov, c.body.inputs);
  await probeLimit(c);
  const r = await runProbe(c, prov, inputs);
  return ok(c, { account: account(r), options: r.options || {} });
}

async function connect(c) {
  const prov = providerOf(c.body.platform), inputs = inputsOf(prov, c.body.inputs);
  const set = settingsOf(c.body.settings, DEFAULTS);
  if (await activeCount(c) >= siteLimit(c.user)) fail("site_limit", 403);
  await probeLimit(c);
  const r = await runProbe(c, prov, inputs);
  const opts = snapOptions(r.options), choices = checkChoices(c.body.choices, opts);
  const config = { ...(r.config || {}), ...choices, [OPTS]: opts };
  let box;
  try { box = await encrypt(c.env, JSON.stringify(r.creds || {})); } catch { fail("not_ready", 503); }
  const secret = (prov.fields || []).find(f => f.type === "secret" && inputs[f.key]);
  const sv = secret ? inputs[secret.key] : "", hint = sv.length >= 12 ? sv.slice(-4) : null;
  const acc = account(r), label = set.label || acc.name || prov.name;
  // Sınır yarışında (iki eşzamanlı bağlantı) ekleme koşulu sayacı yeniden denetler
  const row = await c.env.DB.prepare(
    `INSERT INTO cms_sites (user_id, site, platform, label, base_url, config, secret_box, hint, state, auto_publish, per_week, days, hour, lang, length, tone, brief, topics, next_run_at)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
     WHERE (SELECT COUNT(*) FROM cms_sites WHERE user_id = ? AND site = ? AND state != 'kaldirildi') < ? RETURNING *`,
  ).bind(c.user.id, c.site, prov.id, label, acc.url || null, JSON.stringify(config), box, hint, set.auto_publish, set.per_week, JSON.stringify(set.days),
    set.hour, set.lang, set.length, set.tone, set.brief || null, JSON.stringify(set.topics), nextRunAt(set.days, set.hour),
    c.user.id, c.site, siteLimit(c.user)).first();
  if (!row) fail("site_limit", 403);
  return ok(c, { site: siteOut(row) });
}

async function settings(c, id) {
  const s = await mySite(c, id);
  if (s.state === "kaldirildi") fail("not_found", 404);
  const set = settingsOf(c.body, rowSettings(s));
  let config = s.config;
  if (c.body.choices !== undefined) {
    const cfg = jsonOr(s.config, {}), opts = cfg[OPTS] && typeof cfg[OPTS] === "object" ? cfg[OPTS] : {};
    const choices = checkChoices(c.body.choices, opts);
    for (const k of Object.keys(opts)) delete cfg[k];
    config = JSON.stringify({ ...cfg, ...choices });
  }
  const next = s.state === "aktif" ? nextRunAt(set.days, set.hour) : s.next_run_at;
  const row = await c.env.DB.prepare(
    `UPDATE cms_sites SET label = ?, auto_publish = ?, per_week = ?, days = ?, hour = ?, lang = ?, length = ?, tone = ?, brief = ?, topics = ?, config = ?,
     next_run_at = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ? AND state != 'kaldirildi' RETURNING *`,
  ).bind(set.label || s.label, set.auto_publish, set.per_week, JSON.stringify(set.days), set.hour, set.lang, set.length, set.tone, set.brief || null,
    JSON.stringify(set.topics), config, next, s.id, c.user.id).first();
  if (!row) fail("not_found", 404);
  return ok(c, { site: siteOut(row) });
}

// Elle çalıştırma: aynı rid tekrarı aynı yazıyı döner (slot UNIQUE). Kota önden düşülür; üretim cmsTick'te (K2).
async function run(c, id) {
  const env = c.env, uid = c.user.id, rid = str(c.body.rid);
  if (!RID.test(rid)) bad("rid");
  const s = await mySite(c, id);
  const slot = `manual:${rid.toLowerCase()}`;
  const prev = await env.DB.prepare("SELECT * FROM cms_posts WHERE cms_site_id = ? AND slot = ?").bind(s.id, slot).first();
  if (prev) return ok(c, { post: postOut(prev) });
  if (s.state !== "aktif") bad("state");
  if (!genEnabled(env)) fail("not_ready", 503);
  const P = planLimits(c.user);
  if (!P) fail("not_ready", 503);
  const day = genDay(), month = day.slice(0, 7), U = parseInt(env.GEN_USER_PER_DAY, 10) > 0 ? parseInt(env.GEN_USER_PER_DAY, 10) : 40;
  const items = [
    { name: "mo", month, user: uid, kind: "lb", inc: 1, max: P.linkedin_blog },
    { name: "u", kind: "u", key: await keyOf(env, day, "u", uid), inc: 1, max: U },
  ];
  const r = await reserve(env.DB, day, items);
  if (!r.ok) fail(r.failed.includes("mo") ? "quota" : "rate", r.failed.includes("mo") ? 402 : 429);
  const row = await env.DB.prepare(
    `INSERT INTO cms_posts (cms_site_id, user_id, slot, state, mode, charged, month, day, next_try_at)
     VALUES (?, ?, ?, 'uretiliyor', ?, 1, ?, ?, datetime('now')) ON CONFLICT(cms_site_id, slot) DO NOTHING RETURNING *`,
  ).bind(s.id, uid, slot, s.auto_publish ? "publish" : "draft", month, day).first();
  if (row) return ok(c, { post: postOut(row) });
  // Eşzamanlı aynı rid: öteki istek ekledi; bu rezervasyonu geri al
  await env.DB.batch([
    env.DB.prepare("UPDATE gen_month SET n = MAX(0, n - 1) WHERE month = ? AND user_id = ? AND kind = 'lb'").bind(month, uid),
    env.DB.prepare("UPDATE gen_usage SET n = MAX(0, n - 1) WHERE day = ? AND key = ?").bind(day, items[1].key),
  ]);
  const again = await env.DB.prepare("SELECT * FROM cms_posts WHERE cms_site_id = ? AND slot = ?").bind(s.id, slot).first();
  return ok(c, { post: postOut(again) });
}

async function setState(c, id, from, to) {
  const s = await mySite(c, id);
  if (s.state === "kaldirildi") fail("not_found", 404);
  if (!from.includes(s.state)) return ok(c, { site: siteOut(s) }); // zaten o durumda: idempotent
  const next = to === "aktif" ? nextRunAt(jsonOr(s.days, [2]), s.hour) : null;
  const row = await c.env.DB.prepare(
    "UPDATE cms_sites SET state = ?, next_run_at = ?, last_error = CASE WHEN ? = 'aktif' THEN NULL ELSE last_error END, updated_at = datetime('now') WHERE id = ? AND user_id = ? RETURNING *",
  ).bind(to, next, to, s.id, c.user.id).first();
  return ok(c, { site: siteOut(row || s) });
}
const pause = (c, id) => setState(c, id, ["aktif", "hata"], "duraklatildi");
const resume = (c, id) => setState(c, id, ["duraklatildi", "hata"], "aktif");

// Kaldır: anahtarlar silinir, yazı kayıtları kalır. Gönderilmeyi bekleyen 'hazir' yazılar iptal; 'uretiliyor' (kota düşülmüş) satırları
// cmsTick (K2) site kaldırıldı diye iade edip iptal eder (burada iade, eşzamanlı üretimle yarışırdı).
async function disconnect(c, id) {
  const s = await mySite(c, id);
  if (s.state === "kaldirildi") return ok(c, { site: siteOut(s) });
  const [, { results }] = await c.env.DB.batch([
    c.env.DB.prepare("UPDATE cms_posts SET state = 'iptal', updated_at = datetime('now') WHERE cms_site_id = ? AND state = 'hazir'").bind(s.id),
    c.env.DB.prepare(
      "UPDATE cms_sites SET secret_box = NULL, token_box = NULL, hint = NULL, state = 'kaldirildi', next_run_at = NULL, lease_until = NULL, updated_at = datetime('now') WHERE id = ? AND user_id = ? RETURNING *",
    ).bind(s.id, c.user.id),
  ]);
  return ok(c, { site: siteOut(results?.[0] || { ...s, hint: null, state: "kaldirildi", next_run_at: null }) });
}

// Yeniden dene: yalnız gönderimi başarısız ve içeriği duran yazı; yeniden üretim ve kota yok, cmsTick gönderir
async function retry(c, id) {
  const p = await c.env.DB.prepare(
    "SELECT p.*, s.state AS site_state FROM cms_posts p JOIN cms_sites s ON s.id = p.cms_site_id WHERE p.id = ? AND p.user_id = ? AND s.site = ?",
  ).bind(id, c.user.id, c.site).first();
  if (!p) fail("not_found", 404);
  if (p.state !== "basarisiz" || p.site_state === "kaldirildi" || !p.markdown) bad("state");
  const row = await c.env.DB.prepare(
    "UPDATE cms_posts SET state = 'hazir', attempts = 0, next_try_at = datetime('now'), lease_until = NULL, last_error = NULL, updated_at = datetime('now') WHERE id = ? AND user_id = ? AND state = 'basarisiz' RETURNING *",
  ).bind(p.id, c.user.id).first();
  return ok(c, { post: postOut(row || p) });
}

// ======================================================================================================================
// K2 — OAuth bağlantısı (IdeaSoft, WordPress.com). oauth.js'in state deseni: 32 bayt rastgele state, D1'de yalnız sha256'sı,
// tek kullanımlık (DELETE … RETURNING), 10 dk. platform sütunu "cms/<p>": mevcut OAUTH listesi bu satırlara dokunmaz.
// Kullanıcının girdileri (IdeaSoft client_secret dahil) ve ayarlar şifreli olarak code_verifier sütununda.
// Callback oturum/Origin görmez (oturum Authorization: Bearer ile taşınır): token takası ve probe callback'te yapılır ama site
// BAĞLANMAZ. Sonuç (creds dahil) şifreli olarak aynı tabloda bekleyen bir satıra (ticket_hash = sha256(bilet), code = şifreli
// yük, 10 dk) yazılır; kullanıcı <return_to>?cms_bilet=<bilet> adresine döner ve panel bileti oturumla POST /app/cmsoauth/finish'e
// gönderir. Bileti getiren oturum akışı başlatan kullanıcı değilse bilet yine yanar, hiçbir şey bağlanmaz (403 forbidden).
// Böylece saldırganın başlattığı onay bağlantısı kurbana açtırılsa da kurbanın blogu saldırganın hesabına bağlanamaz.
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/; // oauth.js'teki gibi (dışa aktarılmıyor)
const enc = new TextEncoder();
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)))].map(b => b.toString(16).padStart(2, "0")).join("");
const page = (body, status) => new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
const redirect = to => new Response(null, { status: 302, headers: { location: to, "cache-control": "no-store", "referrer-policy": "no-referrer" } });
const STATE_MINUTES = 10, TICKET_MINUTES = 10;
const EXPIRED = "Bağlantı geçersiz ya da süresi dolmuş. Panelden yeniden bağlanmayı deneyin.";
const CODE_RE = /^[a-z_]{1,40}$/;
const code = e => (CODE_RE.test(str(e)) ? e : "server");
const oauthProv = id => (Object.hasOwn(PROVIDERS, str(id)) && PROVIDERS[id].auth === "oauth" && PROVIDERS[id].oauth ? PROVIDERS[id] : null);
const oauthReady = (env, p) => (p.requires || []).every(k => env?.[k]);
const clientIdOf = (env, p, inputs) => (p.id === "wpcom" ? env.WPCOM_CLIENT_ID : inputs.client_id);
const cmsIo = (env, f = fetch, now = () => Date.now(), log = m => console.log(m)) => ({ fetch: (...a) => f(...a), now, log, env });
// Probe'un zorunlu seçeneklerinde ilk öğe (kullanıcı sonra ayarlardan değiştirir); zorunlu ve boşsa hata
function autoChoices(opts) {
  const out = {};
  for (const [k, o] of Object.entries(opts || {})) {
    const items = Array.isArray(o?.items) ? o.items : [];
    if (!o?.required) continue;
    const first = items.find(i => !i.parent || out[i.parent] === undefined || Object.values(out).includes(i.parent)) || items[0];
    if (!first) fail("bad_input", 400, { field: k });
    out[k] = first.id;
  }
  return out;
}

async function oauthStart(c) {
  const env = c.env, prov = oauthProv(c.body.platform);
  if (!prov) bad("platform");
  if (!oauthReady(env, prov)) fail("not_configured", 503);
  const inputs = inputsOf(prov, c.body.inputs);
  for (const f of prov.fields || []) if (f.required && !inputs[f.key]) bad(f.key);
  const set = settingsOf(c.body.settings, DEFAULTS);
  if (await activeCount(c) >= siteLimit(c.user)) fail("site_limit", 403);
  await probeLimit(c);
  const state = b64u(crypto.getRandomValues(new Uint8Array(32))), p = `cms/${prov.id}`, redirectTo = redirectUri(env, c.api, p);
  const url = prov.oauth.authorizeUrl(inputs, { redirectUri: redirectTo, state, clientId: clientIdOf(env, prov, inputs) });
  if (!url || !/^https:\/\//.test(url)) bad(prov.id === "ideasoft" ? "store" : "platform");
  let box;
  try { box = await encrypt(env, JSON.stringify({ site: c.site, inputs, settings: set })); } catch { fail("not_ready", 503); }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM oauth_states WHERE platform LIKE 'cms/%' AND expires_at <= datetime('now')"),
    env.DB.prepare(
      "INSERT INTO oauth_states (state_hash, user_id, platform, return_to, redirect_uri, code_verifier, expires_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))",
    ).bind(await sha256(state), c.user.id, p, `${returnBase(env, c.origin, c.site)}${backPath(c.site, c.user?.lang)}`, redirectTo, box, `+${STATE_MINUTES} minutes`),
  ]);
  return ok(c, { url });
}

// /oauth/cms/<platform>/callback (index.js K3 bağlar). Kod hemen takas edilir (IdeaSoft kodu ~30 sn geçerli), probe, ilk
// zorunlu seçimler → bekleyen bilet satırı; dönüş <return_to>?cms_bilet=<bilet> | ?cms=<kısa kod>. Token yalnız şifreli yükte.
export async function cmsOAuthCallback(request, env, platform) {
  const prov = oauthProv(platform);
  if (request.method !== "GET" || !prov) return page("Bulunamadı", 404);
  if (env?.CMS_ENABLED !== "1") return page("Hizmet hazır değil.", 503);
  if (!oauthReady(env, prov)) return page("yapılandırılmadı", 503);
  const url = new URL(request.url), state = url.searchParams.get("state") || "";
  if (!TOKEN_RE.test(state)) return page(EXPIRED, 400);
  let st;
  try {
    st = await env.DB.prepare(
      `DELETE FROM oauth_states WHERE state_hash = ? AND platform = ? AND ticket_hash IS NULL AND expires_at > datetime('now')
       RETURNING user_id, return_to, redirect_uri, code_verifier`,
    ).bind(await sha256(state), `cms/${prov.id}`).first();
  } catch (e) {
    if (NO_TABLE.test(String(e?.message || ""))) return page("Hizmet hazır değil.", 503);
    throw e;
  }
  if (!st) return page(EXPIRED, 400);
  const back = result => redirect(`${st.return_to}?${new URLSearchParams({ cms: result })}`);
  const authCode = url.searchParams.get("code");
  if (url.searchParams.get("error") || !authCode) return back("denied");
  try {
    let pl;
    try { pl = JSON.parse(await decrypt(env, st.code_verifier)); } catch { return back("not_ready"); }
    const inputs = pl?.inputs && typeof pl.inputs === "object" ? pl.inputs : {}, site = str(pl?.site);
    const set = settingsOf(pl?.settings, DEFAULTS);
    if (!site) return back("not_found");
    const io = cmsIo(env);
    let ex;
    try { ex = await prov.oauth.exchange(authCode, inputs, {}, { redirectUri: st.redirect_uri }, io); } catch { ex = { ok: false, error: "server" }; }
    if (!ex?.ok) return back(code(ex?.error));
    let pr;
    try { pr = await prov.probe({ ...inputs, ...(ex.config || {}), ...(ex.creds || {}) }, io); } catch { pr = { ok: false, error: "server" }; }
    if (!pr?.ok) return back(code(pr?.error));
    const opts = snapOptions(pr.options), choices = autoChoices(opts);
    const config = { ...(ex.config || {}), ...(pr.config || {}), ...choices, [OPTS]: opts };
    const sec = str(inputs.client_secret), hint = sec.length >= 12 ? sec.slice(-4) : null;
    const acc = account(pr), label = set.label || acc.name || prov.name;
    const box = await encrypt(env, JSON.stringify({
      site, platform: prov.id, label, base_url: acc.url || null, config, hint, settings: set, creds: { ...(ex.creds || {}), ...(pr.creds || {}) },
    }));
    // Bekleyen satır: state özetiyle yeniden yazılır (eski satır yukarıda silindi; ticket_hash dolu olduğu için state tekrar kullanılamaz)
    const ticket = b64u(crypto.getRandomValues(new Uint8Array(32)));
    await env.DB.prepare(
      `INSERT INTO oauth_states (state_hash, user_id, platform, return_to, redirect_uri, ticket_hash, code, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`,
    ).bind(await sha256(state), st.user_id, `cms/${prov.id}`, st.return_to, st.redirect_uri, await sha256(ticket), box, `+${TICKET_MINUTES} minutes`).run();
    return redirect(`${st.return_to}?${new URLSearchParams({ cms_bilet: ticket })}`);
  } catch (e) {
    if (e instanceof CmsError) return back(code(e.code));
    console.log(JSON.stringify({ cms: "oauth_callback", platform: prov.id, err: str(e?.name).slice(0, 40) }));
    return back("server");
  }
}

// POST /app/cmsoauth/finish {ticket}: bilet tek kullanımlıktır, her durumda silinir. Bilet yok / süresi geçmiş / akışı başka
// kullanıcı ya da başka site başlatmış → 403 forbidden, hiçbir şey bağlanmaz. Aksi hâlde connect ile aynı kurallar (site sınırı).
async function oauthFinish(c) {
  const ticket = str(c.body.ticket);
  if (!TOKEN_RE.test(ticket)) fail("forbidden", 403);
  const st = await c.env.DB.prepare(
    `DELETE FROM oauth_states WHERE ticket_hash = ? AND platform LIKE 'cms/%'
     RETURNING user_id, platform, code, CASE WHEN expires_at > datetime('now') THEN 1 ELSE 0 END AS live`,
  ).bind(await sha256(ticket)).first();
  if (!st || !Number(st.live) || Number(st.user_id) !== Number(c.user.id)) fail("forbidden", 403);
  const prov = oauthProv(str(st.platform).slice(4));
  if (!prov) fail("forbidden", 403);
  let pl;
  try { pl = JSON.parse(await decrypt(c.env, st.code)); } catch { fail("not_ready", 503); }
  if (!pl || pl.platform !== prov.id || str(pl.site) !== c.site) fail("forbidden", 403);
  const set = settingsOf(pl.settings, DEFAULTS);
  if (await activeCount(c) >= siteLimit(c.user)) fail("site_limit", 403);
  let box;
  try { box = await encrypt(c.env, JSON.stringify(pl.creds || {})); } catch { fail("not_ready", 503); }
  const row = await c.env.DB.prepare(
    `INSERT INTO cms_sites (user_id, site, platform, label, base_url, config, secret_box, hint, state, auto_publish, per_week, days, hour, lang, length, tone, brief, topics, next_run_at)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
     WHERE (SELECT COUNT(*) FROM cms_sites WHERE user_id = ? AND site = ? AND state != 'kaldirildi') < ? RETURNING *`,
  ).bind(c.user.id, c.site, prov.id, str(pl.label) || prov.name, pl.base_url || null, JSON.stringify(pl.config || {}), box, pl.hint || null,
    set.auto_publish, set.per_week, JSON.stringify(set.days), set.hour, set.lang, set.length, set.tone, set.brief || null, JSON.stringify(set.topics),
    nextRunAt(set.days, set.hour), c.user.id, c.site, siteLimit(c.user)).first();
  if (!row) fail("site_limit", 403);
  return ok(c, { site: siteOut(row) });
}

// ======================================================================================================================
// K2 — cmsTick: cron (*/5, publishTick'ten sonra). Sıra: temizlik → gönderim → zamanlama → üretim. Ücretsiz plan 10 ms CPU,
// çağrı başına ~50 D1 sorgusu / ~50 alt istek: publishTick'ten kalanı { d1, sub } ile verir; her adım maliyetini önden düşer,
// bütçe yetmezse adım bir sonraki tike kalır. Her adım kendi kirası (lease_until) ile tekrar/eşzamanlılığa dayanıklı.
const LEASE_MS = 4 * 60 * 1000, PURGE_DAYS = 90, PURGE_BATCH = 200;
const PUSH_PER_TICK = 2, SCHEDULE_PER_TICK = 2, PRODUCE_PER_TICK = 1, CANCEL_PER_TICK = 2;
const PUSH_MAX = 5, PRODUCE_MAX = 3; // publish.js MAX_ATTEMPTS ile aynı gönderim tavanı; üretim (LLM) 3 deneme
const TOPIC_MAX = 300, GOAL_MAX = 1500, AVOID_TITLES = 20, EXCERPT_MAX = 160;
const RETRYABLE = new Set(["rate", "server", "timeout", "network"]);
const SITE_FATAL = new Set(["auth", "forbidden"]);
// publish.js backoff'un kopyası (saniye; döngüsel import riskine karşı yerel)
const backoff = (attempts, id) => Math.min(60 * 2 ** attempts, 21600) + (Number(id) * 37) % 60;
const intEnv = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; };
const userCap = env => intEnv(env.GEN_USER_PER_DAY, 40);
// brand_voice.sector (platform.js VOICE_SECTORS) → gen-prompt SECTORS anahtarı
const SECTOR_MAP = { ecom: "E-ticaret", tech: "Yazılım", services: "Danışmanlık", agency: "Danışmanlık", fin: "Danışmanlık", edu: "Eğitim", health: "Sağlık", estate: "Gayrimenkul", industry: "Üretim" };
const sectorOf = v => { const k = SECTOR_MAP[str(v)]; return k && Object.hasOwn(SECTORS, k) ? k : "Genel"; };
const styleFrom = samples => { const a = jsonOr(samples, []); return (Array.isArray(a) ? a.filter(x => typeof x === "string") : []).join("\n\n").slice(0, STUDIO_MAX.style); };

// İade: aylık (lb) + günlük kullanıcı (u) sayacı. Atomik ve idempotent: sayaç yalnız satır hâlâ charged=1 ve 'uretiliyor' iken düşer,
// aynı batch satırı charged=0 + son duruma çeker (iki tik aynı satırı iade edemez).
async function refundBatch(env, p, state, err) {
  const db = env.DB, ukey = await keyOf(env, p.day, "u", p.user_id), still = "EXISTS (SELECT 1 FROM cms_posts WHERE id = ? AND charged = 1 AND state = 'uretiliyor')";
  return db.batch([
    db.prepare(`UPDATE gen_month SET n = MAX(0, n - 1) WHERE month = ? AND user_id = ? AND kind = 'lb' AND ${still}`).bind(p.month, p.user_id, p.id),
    db.prepare(`UPDATE gen_usage SET n = MAX(0, n - 1) WHERE day = ? AND key = ? AND ${still}`).bind(p.day, ukey, p.id),
    db.prepare("UPDATE cms_posts SET charged = 0, state = ?, last_error = ?, lease_until = NULL, updated_at = datetime('now') WHERE id = ? AND state = 'uretiliyor'")
      .bind(state, err, p.id),
  ]);
}

// Markdown'dan düz özet (cms_posts'ta meta sütunu yok): başlık olmayan ilk paragraf, biçim işaretleri atılır
function excerptOf(md) {
  const para = str(md).split(/\n\s*\n/).map(s => s.trim()).find(s => s && !/^(#|```|[-*+] |\d+\. |>|\|)/.test(s)) || "";
  const t = para.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`#>]+/g, "").replace(/\s+/g, " ").trim();
  return t.length > EXCERPT_MAX ? `${t.slice(0, EXCERPT_MAX - 1).replace(/\s+\S*$/, "")}…` : t;
}

// 90 günden eski yazıların gövdesi (markdown) boşaltılır, satır kalır (liste/kota geçmişi). Gönderilmemiş eski 'hazir' iptal.
export async function cmsPurge(env) {
  const r = await env.DB.prepare(
    `UPDATE cms_posts SET markdown = NULL, state = CASE WHEN state = 'hazir' THEN 'iptal' ELSE state END, updated_at = datetime('now')
     WHERE id IN (SELECT id FROM cms_posts WHERE created_at < datetime('now', ?) AND markdown IS NOT NULL AND state NOT IN ('uretiliyor', 'gonderiliyor') LIMIT ?)`,
  ).bind(`-${PURGE_DAYS} days`, PURGE_BATCH).run();
  return Number(r?.meta?.changes) || 0;
}

export async function cmsTick(env, f = fetch, { d1 = 30, sub = 20, log = m => console.log(m), now = () => Date.now() } = {}) {
  const out = { stale: 0, cancelled: 0, purged: 0, pushed: 0, push_failed: 0, scheduled: 0, quota: 0, produced: 0, produce_failed: 0 };
  if (env?.CMS_ENABLED !== "1" || !env.DB) return out;
  const B = { d1, sub };
  const take = (q, s = 0) => { if (B.d1 < q || B.sub < s) return false; B.d1 -= q; B.sub -= s; return true; };
  const db = env.DB, io = cmsIo(env, f, now, log), gen = genEnabled(env);
  const T = () => sqlTime(now()), lease = () => sqlTime(now() + LEASE_MS);
  const step = async (phase, fn) => {
    try { await fn(); return true; } catch (e) {
      if (NO_TABLE.test(String(e?.message || ""))) return false; // 0019 uygulanmamış: sessizce çık
      log(JSON.stringify({ cms: "tick", phase, err: str(e?.name).slice(0, 40) }));
      return true;
    }
  };

  // 1) temizlik: kirası dolmuş gönderim → sonucu bilinmiyor (körlemesine tekrar çift yazı olur; kullanıcı "yeniden dene" ile seçer)
  if (!(await step("stale", async () => {
    if (!take(1)) return;
    const r = await db.prepare(
      "UPDATE cms_posts SET state = 'basarisiz', last_error = 'unknown_result', lease_until = NULL, updated_at = datetime('now') WHERE state = 'gonderiliyor' AND lease_until < ?",
    ).bind(T()).run();
    out.stale = Number(r?.meta?.changes) || 0;
  }))) return out;
  // kaldırılmış sitenin üretim bekleyen (kotası düşülmüş) yazıları: iade + iptal
  await step("cancel", async () => {
    if (!take(1)) return;
    const { results } = await db.prepare(
      "SELECT p.id, p.user_id, p.month, p.day FROM cms_posts p JOIN cms_sites s ON s.id = p.cms_site_id WHERE p.state = 'uretiliyor' AND s.state = 'kaldirildi' LIMIT ?",
    ).bind(CANCEL_PER_TICK).all();
    for (const p of results || []) {
      if (!take(3)) break;
      await refundBatch(env, p, "iptal", "site_removed");
      out.cancelled++;
    }
  });
  if (new Date(now()).getUTCMinutes() < 5) await step("purge", async () => { if (take(1)) out.purged = await cmsPurge(env); });

  // 2) gönderim: 'hazir' + site aktif; kira + attempts önce yazılır
  for (let i = 0; i < PUSH_PER_TICK; i++) {
    let more = false;
    await step("push", async () => {
      if (!take(5, 8)) return;
      const t = T();
      const p = await db.prepare(
        `UPDATE cms_posts SET state = 'gonderiliyor', lease_until = ?, attempts = attempts + 1, updated_at = datetime('now')
         WHERE id = (SELECT p.id FROM cms_posts p JOIN cms_sites s ON s.id = p.cms_site_id
                     WHERE p.state = 'hazir' AND (p.next_try_at IS NULL OR p.next_try_at <= ?) AND s.state = 'aktif' ORDER BY p.next_try_at LIMIT 1)
           AND state = 'hazir' RETURNING *`,
      ).bind(lease(), t).first();
      if (!p) return;
      more = true;
      const s = await db.prepare("SELECT * FROM cms_sites WHERE id = ?").bind(p.cms_site_id).first();
      const prov = s && Object.hasOwn(PROVIDERS, str(s.platform)) ? PROVIDERS[s.platform] : null;
      let res, creds = null;
      if (!s || s.state !== "aktif" || !prov) res = { ok: false, error: "not_ready", retry: false };
      else {
        try { creds = JSON.parse(await decrypt(env, s.secret_box) || "{}"); } catch { creds = null; }
        if (!creds) res = { ok: false, error: "auth", retry: false };
      }
      if (!res) {
        const config = jsonOr(s.config, {});
        delete config[OPTS];
        const post = {
          title: str(p.title), slug: p.slug || slugify(p.title), markdown: str(p.markdown), excerpt: excerptOf(p.markdown), lang: s.lang || "tr",
          ...(p.cover_url ? { cover: { url: p.cover_url, alt: str(p.title).slice(0, 200), credit: str(p.cover_credit) } } : {}),
        };
        try { res = await prov.push(post, { config, creds, mode: p.mode === "publish" ? "publish" : "draft" }, io); }
        catch { res = { ok: false, error: "unknown_result", retry: false }; }
        res ||= { ok: false, error: "unknown_result", retry: false };
      }
      const err = res.ok ? null : code(res.error), st = [];
      // Yeni creds (IdeaSoft refresh token her kullanımda değişir) başarısız sonuçta da yazılır; kaldırılmış siteye asla
      if (res.creds && s) st.push(db.prepare("UPDATE cms_sites SET secret_box = ?, updated_at = datetime('now') WHERE id = ? AND state != 'kaldirildi'")
        .bind(await encrypt(env, JSON.stringify(res.creds)), s.id));
      if (res.ok) {
        st.push(db.prepare(
          "UPDATE cms_posts SET state = ?, remote_id = ?, remote_url = ?, last_error = NULL, lease_until = NULL, updated_at = datetime('now') WHERE id = ? AND state = 'gonderiliyor'",
        ).bind(p.mode === "publish" ? "yayinlandi" : "gonderildi", res.remote_id == null ? null : str(res.remote_id).slice(0, 200),
          /^https:\/\//.test(str(res.url)) ? str(res.url).slice(0, 2000) : null, p.id));
        out.pushed++;
      } else if (res.retry && RETRYABLE.has(err) && p.attempts < PUSH_MAX) {
        st.push(db.prepare("UPDATE cms_posts SET state = 'hazir', last_error = ?, next_try_at = ?, lease_until = NULL, updated_at = datetime('now') WHERE id = ? AND state = 'gonderiliyor'")
          .bind(err, sqlTime(now() + backoff(p.attempts, p.id) * 1000), p.id));
      } else {
        st.push(db.prepare("UPDATE cms_posts SET state = 'basarisiz', last_error = ?, lease_until = NULL, updated_at = datetime('now') WHERE id = ? AND state = 'gonderiliyor'")
          .bind(err, p.id));
        if (s && SITE_FATAL.has(err)) st.push(db.prepare("UPDATE cms_sites SET state = 'hata', last_error = ?, updated_at = datetime('now') WHERE id = ? AND state = 'aktif'").bind(err, s.id));
        out.push_failed++;
      }
      await db.batch(st);
    });
    if (!more) break;
  }

  if (!gen) return out; // üretim kapalı (GEN_ENABLED/anahtarlar): zamanlama ve üretim yok, gönderim sürer

  // 3) zamanlama: vakti gelen aktif site → kota (aylık lb + günlük u) → 'uretiliyor' (charged=1) ya da 'kota' satırı; next_run_at ilerler
  for (let i = 0; i < SCHEDULE_PER_TICK; i++) {
    let more = false;
    await step("schedule", async () => {
      if (!take(9)) return;
      const t = T();
      const s = await db.prepare(
        `UPDATE cms_sites SET lease_until = ? WHERE id = (SELECT id FROM cms_sites WHERE state = 'aktif' AND next_run_at IS NOT NULL AND next_run_at <= ?
           AND (lease_until IS NULL OR lease_until < ?) ORDER BY next_run_at LIMIT 1) AND (lease_until IS NULL OR lease_until < ?) RETURNING *`,
      ).bind(lease(), t, t, t).first();
      if (!s) return;
      more = true;
      const slot = s.next_run_at, next = nextRunAt(jsonOr(s.days, []), Number(s.hour), now());
      const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(s.user_id).first();
      const P = user ? planLimits(user) : null;
      if (P) {
        const day = genDay(now()), month = day.slice(0, 7), ukey = await keyOf(env, day, "u", s.user_id);
        const r = await reserve(db, day, [
          { name: "mo", month, user: s.user_id, kind: "lb", inc: 1, max: P.linkedin_blog },
          { name: "u", kind: "u", key: ukey, inc: 1, max: userCap(env) },
        ]);
        const mode = s.auto_publish ? "publish" : "draft";
        if (!r.ok) {
          await db.prepare(
            `INSERT INTO cms_posts (cms_site_id, user_id, slot, state, mode, charged, month, day, last_error) VALUES (?, ?, ?, 'kota', ?, 0, ?, ?, ?)
             ON CONFLICT(cms_site_id, slot) DO NOTHING`,
          ).bind(s.id, s.user_id, slot, mode, month, day, r.failed.includes("mo") ? "quota" : "rate").run();
          out.quota++;
        } else {
          const row = await db.prepare(
            `INSERT INTO cms_posts (cms_site_id, user_id, slot, state, mode, charged, month, day, next_try_at) VALUES (?, ?, ?, 'uretiliyor', ?, 1, ?, ?, ?)
             ON CONFLICT(cms_site_id, slot) DO NOTHING RETURNING id`,
          ).bind(s.id, s.user_id, slot, mode, month, day, t).first();
          if (row) out.scheduled++;
          else await db.batch([ // slot zaten var (önceki tik yarıda kaldı): bu rezervasyonu geri al
            db.prepare("UPDATE gen_month SET n = MAX(0, n - 1) WHERE month = ? AND user_id = ? AND kind = 'lb'").bind(month, s.user_id),
            db.prepare("UPDATE gen_usage SET n = MAX(0, n - 1) WHERE day = ? AND key = ?").bind(day, ukey),
          ]);
        }
      }
      // Ayar bu arada değiştiyse (next_run_at farklı) onunkini koru
      await db.prepare(
        "UPDATE cms_sites SET next_run_at = CASE WHEN next_run_at = ? THEN ? ELSE next_run_at END, lease_until = NULL, updated_at = datetime('now') WHERE id = ?",
      ).bind(slot, next, s.id).run();
    });
    if (!more) break;
  }

  // 4) üretim: 'uretiliyor' (zamanlanmış ya da elle; kota önden düşülmüş) → LLM → isteğe bağlı Pexels kapak → 'hazir'
  for (let i = 0; i < PRODUCE_PER_TICK; i++) {
    await step("produce", async () => {
      if (!take(10, 3)) return;
      const t = T();
      const p = await db.prepare(
        `UPDATE cms_posts SET lease_until = ?, attempts = attempts + 1, updated_at = datetime('now')
         WHERE id = (SELECT id FROM cms_posts WHERE state = 'uretiliyor' AND (next_try_at IS NULL OR next_try_at <= ?) AND (lease_until IS NULL OR lease_until < ?)
                     ORDER BY next_try_at LIMIT 1)
           AND state = 'uretiliyor' AND (lease_until IS NULL OR lease_until < ?) RETURNING *`,
      ).bind(lease(), t, t, t).first();
      if (!p) return;
      if (p.attempts > PRODUCE_MAX) { await refundBatch(env, p, "basarisiz", "llm_fail"); out.produce_failed++; return; }
      const s = await db.prepare("SELECT * FROM cms_sites WHERE id = ?").bind(p.cms_site_id).first();
      if (!s || s.state === "kaldirildi") { await refundBatch(env, p, "iptal", "site_removed"); out.cancelled++; return; }
      let voice = null;
      try { voice = await db.prepare("SELECT sector, samples FROM brand_voice WHERE user_id = ? AND site = ?").bind(s.user_id, s.site).first(); }
      catch (e) { if (!NO_TABLE.test(String(e?.message || ""))) throw e; }
      const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(s.user_id).first();
      const P = user ? planLimits(user) : null;
      const { results: prev } = await db.prepare("SELECT title FROM cms_posts WHERE cms_site_id = ? AND title IS NOT NULL ORDER BY id DESC LIMIT ?")
        .bind(s.id, AVOID_TITLES).all();
      const lang = s.lang === "en" ? "en" : "tr", topics = jsonOr(s.topics, []), queued = Array.isArray(topics) && topics.length ? str(topics[0]) : "";
      const brief = str(s.brief).trim();
      const topic = (queued || (lang === "en"
        ? `A new, useful blog topic for our audience${brief ? `: ${brief}` : ""}`
        : `Hedef kitlemiz için yeni ve faydalı bir blog konusu${brief ? `: ${brief}` : ""}`)).slice(0, TOPIC_MAX);
      const titles = (prev || []).map(r => str(r.title)).filter(Boolean);
      const avoid = titles.length ? (lang === "en" ? `Do not repeat these earlier titles: ${titles.join(" | ")}` : `Şu önceki başlıkları tekrarlama: ${titles.join(" | ")}`) : "";
      const goal = [queued ? brief : "", avoid].filter(Boolean).join("\n").slice(0, GOAL_MAX);
      const req = blogRequest({
        topic, sector: sectorOf(voice?.sector), tone: TONES.includes(s.tone) ? s.tone : "samimi", goal,
        length: ["short", "medium", "long"].includes(s.length) ? s.length : "medium", lang, style: styleFrom(voice?.samples),
      });
      let d;
      try {
        const r = await makeLlm(env, (...a) => f(...a)).generate(req);
        d = r?.drafts?.[0];
        if (!d || !str(d.title).trim() || !str(d.text).trim()) throw new LlmError("fail", "empty");
      } catch (e) {
        const kind = e instanceof LlmError ? e.kind : "busy"; // ağ/beklenmeyen hata geçici sayılır
        if ((kind === "busy" || kind === "limit") && p.attempts < PRODUCE_MAX) {
          await db.prepare("UPDATE cms_posts SET lease_until = NULL, last_error = 'busy', next_try_at = ?, updated_at = datetime('now') WHERE id = ? AND state = 'uretiliyor'")
            .bind(sqlTime(now() + backoff(p.attempts, p.id) * 1000), p.id).run();
        } else {
          await refundBatch(env, p, "basarisiz", kind === "refusal" ? "refused" : "llm_fail");
          out.produce_failed++;
        }
        return;
      }
      const title = str(d.title).trim().slice(0, 300);
      let cover = null;
      if (P?.stock && env.PEXELS_API_KEY && take(1, 1)) {
        try {
          const day = genDay(now());
          const rs = await reserve(db, day, [{ name: "all", kind: "sa", key: await keyOf(env, day, "sa", "global"), inc: 1, max: intEnv(env.GEN_STOCK_PER_DAY, 2000) }]);
          if (rs.ok) {
            const q = new URLSearchParams({ query: (queued || title).slice(0, 100), per_page: "5", orientation: "landscape" });
            const res = await f(`${STOCK_URL}?${q}`, { headers: { authorization: env.PEXELS_API_KEY, accept: "application/json" }, signal: AbortSignal.timeout(STOCK_TIMEOUT) });
            if (res.ok) {
              const ph = ((await res.json())?.photos || []).map(stockPhoto).find(Boolean);
              const u = ph && (ph.src.large || ph.src.medium);
              if (u) cover = { url: u, credit: lang === "en" ? `Photo: ${ph.photographer || "Pexels"} / Pexels` : `Fotoğraf: ${ph.photographer || "Pexels"} / Pexels` };
            }
          }
        } catch { cover = null; } // kapak isteğe bağlı: hata yazıyı durdurmaz
      }
      const st = [db.prepare(
        `UPDATE cms_posts SET state = 'hazir', title = ?, slug = ?, markdown = ?, cover_url = ?, cover_credit = ?, attempts = 0, next_try_at = ?, lease_until = NULL,
         last_error = NULL, updated_at = datetime('now') WHERE id = ? AND state = 'uretiliyor'`,
      ).bind(title, slugify(title) || null, str(d.text).slice(0, STUDIO_MAX.blogText * 2), cover?.url || null, cover?.credit || null, T(), p.id)];
      // Kuyruktaki konu yalnız başarıda düşülür; kullanıcı listeyi bu arada değiştirdiyse (CAS) dokunulmaz
      if (queued) st.push(db.prepare("UPDATE cms_sites SET topics = ?, updated_at = datetime('now') WHERE id = ? AND topics = ?")
        .bind(JSON.stringify(topics.slice(1)), s.id, s.topics));
      await db.batch(st);
      out.produced++;
    });
  }
  return out;
}

export const CMS_ROUTES = {
  "GET cms": gate(list),
  "GET cmsposts": gate(postList),
  "POST cms/probe": gate(probe),
  "POST cms/connect": gate(connect),
  "POST cms/:id/settings": gate(settings),
  "POST cms/:id/run": gate(run),
  "POST cms/:id/pause": gate(pause),
  "POST cms/:id/resume": gate(resume),
  "POST cms/:id/disconnect": gate(disconnect),
  "POST cmsposts/:id/retry": gate(retry),
  "POST cmsoauth/start": gate(oauthStart),
  "POST cmsoauth/finish": gate(oauthFinish),
};
