// A14 — app.socialmediacorner.co otomatik blog yazarı: HTTP uçları (K1). Bağlantı/ayar/elle çalıştırma/duraklat/kaldır/yeniden dene.
// Yönlendirici (platform.js) /app/<seg>[/<id>][/<alt>] biçimini eşler; anahtarlar "METHOD seg[/:id][/alt]" (platform.js ACCT ile aynı),
// işleyici (c, id). Regex'e uymayan yollar tek parçaya indirildi: /app/cmsposts/:id/retry, /app/cmsoauth/start (K2).
// Güvenlik: secret_box/token_box/creds hiçbir yanıtta ve logda yok; tek iz hint (son 4 karakter). last_error yalnız kısa kod.
// CMS_ENABLED !== "1" ya da 0019 uygulanmamışsa her uç 503 not_ready. Üretim (LLM) ve gönderim (push) cmsTick'te (K2):
// elle çalıştırma kotayı burada önden düşer (charged=1, month/day yazılı); cmsTick bu satırda yeniden düşmez, LLM hatasında iade eder.
import { PROVIDERS, UNSUPPORTED, ERROR_HELP, slugify, escHtml } from "./cms-providers.js";
import { encrypt, decrypt, redirectUri, returnBase } from "./oauth.js";
import { planLimits, PLANS, CMS_FREQS } from "./plans.js";
import { genDay, resetAt, genEnabled, keyOf, reserve, UPSERT, blogRequest, STOCK_URL, STOCK_TIMEOUT, STOCK_DAY_MAX, stockPhoto, planCounts } from "./generate.js";
import { TONES, SECTORS, STUDIO_MAX } from "./gen-prompt.js";
import { makeLlm, LlmError } from "./llm.js";
import { cmsBackPath, siteConf } from "./sites.js";
import { smtpReady, smtpSend, smtpFrom } from "./smtp.js";

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

// ---- sıklık (blog otomatiği, Desktop/app-smc/BLOG-OTOMATIK.md): per_week ∈ CMS_FREQS (1/2/3/7; 7 = günde 1), plan tavanı cms_per_week ----
// 0019'daki CHECK (per_week BETWEEN 1 AND 3) D1'de tablo yeniden kurulmadan gevşetilemez (cms_posts ON DELETE CASCADE ile bağlı):
// sütuna en çok 3 yazılır (dbWeek), gerçek sıklık days uzunluğudur (settingsOf days.length === per_week'i zorlar) → weekOf.
const dbWeek = n => Math.min(n, 3);
export function weekOf(r) {
  const d = jsonOr(r?.days, null);
  return Array.isArray(d) && d.length ? d.length : Number(r?.per_week) || 1;
}
const freqMax = user => planLimits(user)?.cms_per_week ?? PLANS.basic.cms_per_week;

// ---- çıktı (beyaz liste: config toptan, secret_box, token_box asla) ----
export function siteOut(r) {
  const cfg = jsonOr(r.config, {}), opts = cfg && typeof cfg[OPTS] === "object" ? cfg[OPTS] : {};
  const choices = {};
  for (const k of Object.keys(opts || {})) if (cfg[k] != null) choices[k] = cfg[k];
  return {
    // provider: istemcinin kart/ad için kullandığı sağlayıcı id'si (Cloudflare Pages satırı platform "github" + config.host "cloudflare")
    id: r.id, platform: r.platform, provider: r.platform === "github" && cfg?.host === "cloudflare" ? "cloudflare" : r.platform, label: r.label, base_url: r.base_url, hint: r.hint, state: r.state, last_error: r.last_error,
    auto_publish: r.auto_publish ? 1 : 0, per_week: weekOf(r), days: jsonOr(r.days, []), hour: r.hour, lang: r.lang, length: r.length,
    tone: r.tone, brief: r.brief, topics: jsonOr(r.topics, []), choices, next_run_at: r.next_run_at, created_at: r.created_at, updated_at: r.updated_at,
  };
}
export const postOut = p => ({
  id: p.id, cms_site_id: p.cms_site_id, title: p.title, state: p.state, mode: p.mode, remote_url: p.remote_url, last_error: p.last_error, created_at: p.created_at,
  // publish_at (UTC 'YYYY-MM-DD HH:MM:SS'): 'hazir' yazının gönderileceği an; zamanlanmış 'uretiliyor' yazının hedef slotu. Elle tetikte null.
  slot: str(p.slot).startsWith("manual:") ? null : p.slot || null,
  publish_at: p.state === "hazir" ? p.next_try_at || null : p.state === "uretiliyor" && Number.isFinite(slotMs(p.slot)) ? p.slot : null,
  has_content: !!p.markdown,
  // içerik vardı ama saklama süresi doldu (platform.js keepDays 3 gün, cmsPurge 90 gün): istemci "silindi" yazar, yeniden göndermeyi gizler
  content_deleted: !p.markdown && ["gonderildi", "yayinlandi", "basarisiz"].includes(p.state),
});

// ---- zamanlama: İstanbul sabit UTC+3; days ISO (1=Pzt..7=Paz), hour İstanbul saati; from'dan kesin sonraki ilk an ----
const IST = 3 * 3600 * 1000, DAY = 86400 * 1000;
const sqlTime = ms => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
// Zamanlanmış slot (sqlTime biçimi) → ms; elle tetik ('manual:…') ve bozuk değer NaN
const slotMs = v => (/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(str(v)) ? Date.parse(`${str(v).replace(" ", "T")}Z`) : NaN);
// Önden hazırlama (25.11): yazı yayın saatinden CMS_LEAD_HOURS (varsayılan 24, 0–72) önce üretilir, 'hazir' olarak slotu bekler;
// kullanıcı arada önizler, düzenler, erteler ya da atlar. 0 = eski davranış (slot gelince üret, hemen gönder).
const leadMs = env => { const v = env?.CMS_LEAD_HOURS; const n = v === undefined || v === "" ? 24 : Number(v); return (Number.isInteger(n) && n >= 0 && n <= 72 ? n : 24) * 3600 * 1000; };
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
// Saat/gün değişince ya da yeniden başlatınca: önden hazırlanmış/üretimdeki planlı yazının İstanbul gününde ikinci yuva açılmaz
// (aynı güne çift yazı olmasın); sonraki yuva o günün bitiminden sonra aranır
async function nextAfterPending(db, siteId, days, hour) {
  const m = await db.prepare("SELECT MAX(slot) m FROM cms_posts WHERE cms_site_id = ? AND state IN ('uretiliyor', 'hazir') AND slot NOT LIKE 'manual:%'")
    .bind(siteId).first();
  const sm = slotMs(m?.m);
  let from = Date.now();
  if (Number.isFinite(sm)) { const local = sm + IST; from = Math.max(from, local - (local % DAY) + DAY - IST - 1); }
  return nextRunAt(days, hour, from);
}

// ---- doğrulama ----
const bad = field => fail("bad_input", 400, { field });
// Ayarlar: base (mevcut satır ya da varsayılan) üstüne gövde; tamamı denetlenir. max (planın cms_per_week) verilmişse
// per_week > max → 403 plan_frequency {max} (OAuth geri çağrısında kullanıcı yok: max verilmez, finish yeniden denetler).
function settingsOf(body, base, max) {
  const b = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const pick = k => (b[k] !== undefined ? b[k] : base[k]);
  const label = str(pick("label")).trim();
  if (label.length > 80) bad("label");
  const per_week = Number(pick("per_week"));
  if (!CMS_FREQS.includes(per_week)) bad("per_week");
  if (max != null && per_week > max) fail("plan_frequency", 403, { max });
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
  label: r.label ?? "", auto_publish: r.auto_publish, per_week: weekOf(r), days: jsonOr(r.days, [2]), hour: r.hour, lang: r.lang,
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
// C1 (24.11): blog otomatiği Pro'dan itibaren. cms_sites 0 olan planda (demo, basic, plan yok) kullanım uçları 403 plan_required
// {plan:"pro"}; GET cms/cmsposts, pause ve disconnect açık kalır (kullanıcı görebilsin, durdurabilsin, silebilsin).
const UPGRADE_PLAN = "pro";
const cmsAllowed = user => siteLimit(user) > 0;
const needPlan = c => { if (!cmsAllowed(c.user)) fail("plan_required", 403, { plan: UPGRADE_PLAN }); };
// A15 demo: blog hakkı deneme boyunca TOPLAM (generate.js planCounts). Bu ayın gen_month 'lb' satırı için rezerv tavanı:
// { max } (öbür planlarda aynen P.linkedin_blog), deneme bittiyse { ended: true }, toplam hak dolduysa { max: null }.
async function lbCap(db, user, P, month) {
  if (P.plan !== "demo") return { max: P.linkedin_blog };
  if (P.trial_ended) return { ended: true, max: null };
  const { off } = await planCounts(db, month, user.id, user, P);
  const max = P.linkedin_blog - off.lb;
  return { max: max > 0 ? max : null };
}
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
  try { lb_used = (await planCounts(env.DB, month, uid, c.user, P)).m.lb; } // demo'da deneme toplamı, öbürlerinde bu ay
  catch (e) { if (!NO_TABLE.test(String(e?.message || ""))) throw e; }
  const providers = Object.values(PROVIDERS).map(p => ({
    id: p.id, name: p.name, auth: p.auth, stored_as: p.stored_as || p.id, ...readyOf(env, p),
    notes_tr: p.notes_tr || "", notes_en: p.notes_en || "", fields: p.fields || [],
  }));
  return ok(c, {
    providers, unsupported: UNSUPPORTED, error_help: ERROR_HELP,
    sites: (sites || []).map(siteOut), posts: (posts || []).map(postOut),
    limits: {
      sites: siteLimit(c.user), used: (sites || []).filter(s => s.state !== "kaldirildi").length, per_week_max: freqMax(c.user),
      plan_required: cmsAllowed(c.user) ? null : UPGRADE_PLAN,
    },
    quota: { lb_used, lb_limit: P?.linkedin_blog ?? 0, ...(P?.plan === "demo" && { trial_ends_at: P.trial_ends_at, trial_ended: P.trial_ended }) },
  });
}

async function postList(c) {
  const { results } = await userPosts(c);
  return ok(c, { posts: (results || []).map(postOut) });
}

async function probe(c) {
  needPlan(c);
  const prov = providerOf(c.body.platform), inputs = inputsOf(prov, c.body.inputs);
  await probeLimit(c);
  const r = await runProbe(c, prov, inputs);
  return ok(c, { account: account(r), options: r.options || {} });
}

async function connect(c) {
  needPlan(c);
  const prov = providerOf(c.body.platform), inputs = inputsOf(prov, c.body.inputs);
  const set = settingsOf(c.body.settings, DEFAULTS, freqMax(c.user));
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
  // Sınır yarışında (iki eşzamanlı bağlantı) ekleme koşulu sayacı yeniden denetler. Saklanan platform stored_as (cloudflare →
  // github; 0019 CHECK listesinde cloudflare yok, ayrım config.host'ta)
  const row = await c.env.DB.prepare(
    `INSERT INTO cms_sites (user_id, site, platform, label, base_url, config, secret_box, hint, state, auto_publish, per_week, days, hour, lang, length, tone, brief, topics, next_run_at)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
     WHERE (SELECT COUNT(*) FROM cms_sites WHERE user_id = ? AND site = ? AND state != 'kaldirildi') < ? RETURNING *`,
  ).bind(c.user.id, c.site, prov.stored_as || prov.id, label, acc.url || null, JSON.stringify(config), box, hint, set.auto_publish, dbWeek(set.per_week), JSON.stringify(set.days),
    set.hour, set.lang, set.length, set.tone, set.brief || null, JSON.stringify(set.topics), nextRunAt(set.days, set.hour),
    c.user.id, c.site, siteLimit(c.user)).first();
  if (!row) fail("site_limit", 403);
  return ok(c, { site: siteOut(row) });
}

async function settings(c, id) {
  needPlan(c);
  const s = await mySite(c, id);
  if (s.state === "kaldirildi") fail("not_found", 404);
  const set = settingsOf(c.body, rowSettings(s), freqMax(c.user));
  let config = s.config;
  if (c.body.choices !== undefined) {
    const cfg = jsonOr(s.config, {}), opts = cfg[OPTS] && typeof cfg[OPTS] === "object" ? cfg[OPTS] : {};
    const choices = checkChoices(c.body.choices, opts);
    for (const k of Object.keys(opts)) delete cfg[k];
    config = JSON.stringify({ ...cfg, ...choices });
  }
  const next = s.state === "aktif" ? await nextAfterPending(c.env.DB, s.id, set.days, set.hour) : s.next_run_at;
  const row = await c.env.DB.prepare(
    `UPDATE cms_sites SET label = ?, auto_publish = ?, per_week = ?, days = ?, hour = ?, lang = ?, length = ?, tone = ?, brief = ?, topics = ?, config = ?,
     next_run_at = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ? AND state != 'kaldirildi' RETURNING *`,
  ).bind(set.label || s.label, set.auto_publish, dbWeek(set.per_week), JSON.stringify(set.days), set.hour, set.lang, set.length, set.tone, set.brief || null,
    JSON.stringify(set.topics), config, next, s.id, c.user.id).first();
  if (!row) fail("not_found", 404);
  return ok(c, { site: siteOut(row) });
}

// Elle çalıştırma: aynı rid tekrarı aynı yazıyı döner (slot UNIQUE). Kota önden düşülür; üretim cmsTick'te (K2).
// "Şimdi bir yazı yaz" (25.11): istek içinde üretim yok (10 ms CPU); 'uretiliyor' satırı next_try_at=now ile eklenir, cmsTick (*/5)
// ilk turda üretir. Site takvimine (next_run_at) dokunulmaz. Sınırlar: aylık blog hakkı (gen_month lb, lbCap) + günlük kullanıcı (u)
// + site başına günde 1 elle tetik (gen_usage kind 'cm', anahtar keyOf(salt|gün|cm|site_id), max 1; göç yok) + kullanıcı başına günde
// en çok plan site sınırı kadar elle tetik (kind 'cu', anahtar keyOf(salt|gün|cu|user_id), max siteLimit): site kaldırılıp yeniden
// bağlanınca yeni site_id ile 'cm' sıfırlanır, 'cu' sıfırlanmaz. Tetik doluysa 429 daily_limit {reset_at}; site aktif değilse 409
// site_state {state}. Üretim başarısız olursa refundBatch hepsini iade eder.
const MANUAL_PER_DAY = 1;
const manualKey = (env, day, siteId) => keyOf(env, day, "cm", String(siteId));
const manualUserKey = (env, day, uid) => keyOf(env, day, "cu", String(uid));
async function run(c, id) {
  needPlan(c);
  const env = c.env, uid = c.user.id, rid = str(c.body.rid);
  if (!RID.test(rid)) bad("rid");
  const s = await mySite(c, id);
  const slot = `manual:${rid.toLowerCase()}`;
  const prev = await env.DB.prepare("SELECT * FROM cms_posts WHERE cms_site_id = ? AND slot = ?").bind(s.id, slot).first();
  if (prev) return ok(c, { post: postOut(prev) });
  if (s.state !== "aktif") fail("site_state", 409, { state: s.state });
  if (!genEnabled(env)) fail("not_ready", 503);
  const P = planLimits(c.user);
  if (!P) fail("not_ready", 503);
  const day = genDay(), month = day.slice(0, 7), U = parseInt(env.GEN_USER_PER_DAY, 10) > 0 ? parseInt(env.GEN_USER_PER_DAY, 10) : 40;
  const cap = await lbCap(env.DB, c.user, P, month);
  if (cap.ended) fail("trial_ended", 403);
  if (cap.max === null) fail("quota", 402);
  const items = [
    { name: "mo", month, user: uid, kind: "lb", inc: 1, max: cap.max },
    { name: "u", kind: "u", key: await keyOf(env, day, "u", uid), inc: 1, max: U },
    { name: "cm", kind: "cm", key: await manualKey(env, day, s.id), inc: 1, max: MANUAL_PER_DAY },
    { name: "cu", kind: "cu", key: await manualUserKey(env, day, uid), inc: 1, max: Math.max(1, siteLimit(c.user)) },
  ];
  const r = await reserve(env.DB, day, items);
  if (!r.ok) {
    // Eşzamanlı aynı rid: öteki istek tetik hakkını aldı ve yazıyı ekledi (ya da eklemek üzere) → hata değil, o yazı döner
    const won = await env.DB.prepare("SELECT * FROM cms_posts WHERE cms_site_id = ? AND slot = ?").bind(s.id, slot).first();
    if (won) return ok(c, { post: postOut(won) });
    if (r.failed.includes("cm") || r.failed.includes("cu")) fail("daily_limit", 429, { reset_at: resetAt() });
    fail(r.failed.includes("mo") ? "quota" : "rate", r.failed.includes("mo") ? 402 : 429);
  }
  const row = await env.DB.prepare(
    `INSERT INTO cms_posts (cms_site_id, user_id, slot, state, mode, charged, month, day, next_try_at)
     VALUES (?, ?, ?, 'uretiliyor', ?, 1, ?, ?, datetime('now')) ON CONFLICT(cms_site_id, slot) DO NOTHING RETURNING *`,
  ).bind(s.id, uid, slot, s.auto_publish ? "publish" : "draft", month, day).first();
  if (row) return ok(c, { post: postOut(row) });
  // Eşzamanlı aynı rid, iki rezervasyon da geçtiyse (ör. öteki isteğin hakkı arada iade edildi): öteki ekledi; bu rezervasyonu geri al
  await env.DB.batch([
    env.DB.prepare("UPDATE gen_month SET n = MAX(0, n - 1) WHERE month = ? AND user_id = ? AND kind = 'lb'").bind(month, uid),
    ...items.slice(1).map(i => env.DB.prepare("UPDATE gen_usage SET n = MAX(0, n - 1) WHERE day = ? AND key = ?").bind(day, i.key)),
  ]);
  const again = await env.DB.prepare("SELECT * FROM cms_posts WHERE cms_site_id = ? AND slot = ?").bind(s.id, slot).first();
  return ok(c, { post: postOut(again) });
}

async function setState(c, id, from, to) {
  if (to === "aktif") needPlan(c); // durdurma her planda açık
  const s = await mySite(c, id);
  if (s.state === "kaldirildi") fail("not_found", 404);
  if (!from.includes(s.state)) return ok(c, { site: siteOut(s) }); // zaten o durumda: idempotent
  // Plan düştüyse (cmsTick duraklattı) sıklık düşürülmeden yeniden başlamaz
  if (to === "aktif" && weekOf(s) > freqMax(c.user)) fail("plan_frequency", 403, { max: freqMax(c.user) });
  const next = to === "aktif" ? await nextAfterPending(c.env.DB, s.id, jsonOr(s.days, [2]), s.hour) : null;
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
  needPlan(c);
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

// ---- Yaklaşan yazı yönetimi (25.11): önden hazırlanan ('hazir') yazıyı önizle/düzenle/şimdi gönder/ertele; 'uretiliyor' ya da 'hazir'
// yazıyı atla. Hepsi sahiplik (user + site) JOIN'iyle; durum değişikliği CAS (aynı anda tik gönderime aldıysa 400 state).
const RESCHEDULE_MAX = 30 * DAY;
const ownPost = async (c, id) => {
  const p = await c.env.DB.prepare(
    "SELECT p.*, s.state AS site_state FROM cms_posts p JOIN cms_sites s ON s.id = p.cms_site_id WHERE p.id = ? AND p.user_id = ? AND s.site = ?",
  ).bind(id, c.user.id, c.site).first();
  if (!p) fail("not_found", 404);
  return p;
};
async function view(c, id) {
  const p = await ownPost(c, id);
  return ok(c, { post: postOut(p), title: p.title, markdown: p.markdown || "", cover_url: p.cover_url, cover_credit: p.cover_credit });
}
async function edit(c, id) {
  needPlan(c);
  const b = c.body && typeof c.body === "object" ? c.body : {};
  const title = typeof b.title === "string" ? b.title.replace(/\s+/g, " ").trim() : "", md = typeof b.markdown === "string" ? b.markdown.trim() : "";
  if (!title || title.length > 300) bad("title");
  if (!md || md.length > STUDIO_MAX.blogText * 2) bad("markdown");
  const p = await ownPost(c, id);
  if (p.state !== "hazir" || p.site_state === "kaldirildi") bad("state");
  const row = await c.env.DB.prepare(
    "UPDATE cms_posts SET title = ?, slug = ?, markdown = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ? AND state = 'hazir' RETURNING *",
  ).bind(title, slugify(title) || null, md, p.id, c.user.id).first();
  if (!row) bad("state");
  return ok(c, { post: postOut(row) });
}
// Atla: üretimi başlamamış/sürüyorsa hak iade edilir; hazırlanmış yazıda hak harcanmıştır (iade yok), yalnız gönderilmez
async function skip(c, id) {
  const p = await ownPost(c, id);
  if (p.state === "uretiliyor") {
    const br = await refundBatch(c.env, p, "iptal", "skipped", { manual: false }); // tetik→atla döngüsü bedava üretim olmasın
    if (!(Number(br?.[br.length - 1]?.meta?.changes) > 0)) bad("state");
    return ok(c, { post: postOut({ ...p, state: "iptal", last_error: "skipped" }) });
  }
  if (p.state !== "hazir") bad("state");
  const row = await c.env.DB.prepare(
    "UPDATE cms_posts SET state = 'iptal', last_error = 'skipped', updated_at = datetime('now') WHERE id = ? AND user_id = ? AND state = 'hazir' RETURNING *",
  ).bind(p.id, c.user.id).first();
  if (!row) bad("state");
  return ok(c, { post: postOut(row) });
}
async function sendNow(c, id) {
  needPlan(c);
  const p = await ownPost(c, id);
  if (p.state !== "hazir") bad("state");
  if (p.site_state !== "aktif") fail("site_state", 409, { state: p.site_state });
  const row = await c.env.DB.prepare(
    "UPDATE cms_posts SET next_try_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ? AND state = 'hazir' RETURNING *",
  ).bind(p.id, c.user.id).first();
  if (!row) bad("state");
  return ok(c, { post: postOut(row) });
}
async function reschedule(c, id) {
  needPlan(c);
  const at = Date.parse(str(c.body?.at)), t = Date.now();
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?(Z|[+-]\d\d:\d\d)$/.test(str(c.body?.at)) || !Number.isFinite(at) || at < t - 60 * 1000 || at > t + RESCHEDULE_MAX) bad("at");
  const p = await ownPost(c, id);
  if (p.state !== "hazir" || p.site_state === "kaldirildi") bad("state");
  const row = await c.env.DB.prepare(
    "UPDATE cms_posts SET next_try_at = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ? AND state = 'hazir' RETURNING *",
  ).bind(sqlTime(Math.max(at, t)), p.id, c.user.id).first();
  if (!row) bad("state");
  return ok(c, { post: postOut(row) });
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
  needPlan(c);
  const env = c.env, prov = oauthProv(c.body.platform);
  if (!prov) bad("platform");
  if (!oauthReady(env, prov)) fail("not_configured", 503);
  const inputs = inputsOf(prov, c.body.inputs);
  for (const f of prov.fields || []) if (f.required && !inputs[f.key]) bad(f.key);
  const set = settingsOf(c.body.settings, DEFAULTS, freqMax(c.user));
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
    ).bind(await sha256(state), c.user.id, p, `${returnBase(env, c.origin, c.site)}${cmsBackPath(c.site, c.user?.lang, c.body.back)}`, redirectTo, box, `+${STATE_MINUTES} minutes`),
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
  needPlan(c); // bilet yakılmadan (plan yükseltilince 10 dk içinde yeniden denenebilir)
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
  const set = settingsOf(pl.settings, DEFAULTS, freqMax(c.user));
  if (await activeCount(c) >= siteLimit(c.user)) fail("site_limit", 403);
  let box;
  try { box = await encrypt(c.env, JSON.stringify(pl.creds || {})); } catch { fail("not_ready", 503); }
  const row = await c.env.DB.prepare(
    `INSERT INTO cms_sites (user_id, site, platform, label, base_url, config, secret_box, hint, state, auto_publish, per_week, days, hour, lang, length, tone, brief, topics, next_run_at)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
     WHERE (SELECT COUNT(*) FROM cms_sites WHERE user_id = ? AND site = ? AND state != 'kaldirildi') < ? RETURNING *`,
  ).bind(c.user.id, c.site, prov.id, str(pl.label) || prov.name, pl.base_url || null, JSON.stringify(pl.config || {}), box, pl.hint || null,
    set.auto_publish, dbWeek(set.per_week), JSON.stringify(set.days), set.hour, set.lang, set.length, set.tone, set.brief || null, JSON.stringify(set.topics),
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

// İade: aylık (lb) + günlük kullanıcı (u) sayacı; elle tetikte (slot manual:…) günlük tetik hakları (site cm + kullanıcı cu) da. Atomik ve
// idempotent: sayaç yalnız satır hâlâ charged=1 ve 'uretiliyor' iken düşer, aynı batch satırı charged=0 + son duruma çeker.
async function refundBatch(env, p, state, err, { manual: withManual = true } = {}) {
  const db = env.DB, ukey = await keyOf(env, p.day, "u", p.user_id), still = "EXISTS (SELECT 1 FROM cms_posts WHERE id = ? AND charged = 1 AND state = 'uretiliyor')";
  const manual = withManual && String(p.slot || "").startsWith("manual:") ? [
    db.prepare(`UPDATE gen_usage SET n = MAX(0, n - 1) WHERE day = ? AND key = ? AND ${still}`).bind(p.day, await manualKey(env, p.day, p.cms_site_id), p.id),
    db.prepare(`UPDATE gen_usage SET n = MAX(0, n - 1) WHERE day = ? AND key = ? AND ${still}`).bind(p.day, await manualUserKey(env, p.day, p.user_id), p.id),
  ] : [];
  return db.batch([
    db.prepare(`UPDATE gen_month SET n = MAX(0, n - 1) WHERE month = ? AND user_id = ? AND kind = 'lb' AND ${still}`).bind(p.month, p.user_id, p.id),
    db.prepare(`UPDATE gen_usage SET n = MAX(0, n - 1) WHERE day = ? AND key = ? AND ${still}`).bind(p.day, ukey, p.id),
    ...manual,
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

// Bildirim e-postası (25.11): gönderim/yayın başarısı ve hata (gönderilemedi, sonucu bilinmiyor, üretilemedi) sonrası kullanıcıya kısa
// TR/EN e-posta (dil users.lang), Gmail SMTP (src/smtp.js; SMTP_USER/SMTP_PASS yoksa hiç gönderilmez). Ayar yok: varsayılan açık.
// Hata e-postası kullanıcı başına günde en çok 1 (gen_usage kind 'ne', göç yok; genCleanup 2 gün sonra siler). Tik başına en çok
// MAIL_PER_TICK e-posta (CPU/alt istek bütçesi); sığmayan bildirim düşer (kalıcı kuyruk yok; yazının durumu panelde zaten görünür).
const MAIL_PER_TICK = 2, NOTE_MAX = 8, MAIL_TITLE = 120, READY_MAIL_MIN = 2 * 3600 * 1000;
// İstanbul saatiyle tarih-saat (e-posta metni; yerel ayar/Intl'e bağlı değil)
const istParts = ms => { const d = new Date(ms + IST), p = n => String(n).padStart(2, "0"); return { y: d.getUTCFullYear(), m: p(d.getUTCMonth() + 1), d: p(d.getUTCDate()), hm: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` }; };
const MAIL_TEXT = {
  tr: {
    hi: n => `Merhaba ${n},`,
    publish: { subject: t => `Yazın yayınlandı: ${t}`, body: (t, w) => `“${t}” ${w} sitende yayınlandı.` },
    draft: { subject: t => `Yeni taslak sitende: ${t}`, body: (t, w) => `“${t}” ${w} sitene taslak olarak gönderildi. Göz atıp yayınlayabilirsin.` },
    push_err: { subject: () => "Blog otomatiği: bir yazı gönderilemedi", body: (t, w) => `“${t}” ${w} sitene gönderilemedi.` },
    produce_err: { subject: () => "Blog otomatiği: bir yazı üretilemedi", body: (t, w) => `${w} için planlanan yazı üretilemedi. Bu yazının hakkı iade edildi.` },
    ready: {
      subject: t => `Sıradaki yazın hazır: ${t}`,
      body: (t, w, n) => { const a = istParts(n.at); return `“${t}” hazır. Gönderim zamanı: ${a.d}.${a.m}.${a.y}, saat ${a.hm}. Yazı ${w} sitene ${n.mode === "publish" ? "yayınlanacak" : "taslak olarak gönderilecek"}.`; },
    },
    manage: "Panelden önizleyebilir, düzenleyebilir, erteleyebilir ya da atlayabilirsin. Bir şey yapmazsan zamanında kendiliğinden gider.",
    open: "Yazıyı aç",
    panel: "Blog otomatiğine git",
    share: "Panelden yazıyı tek tıkla LinkedIn ya da Instagram gönderisine uyarlayabilirsin.",
    retry: "Ayrıntı ve yeniden deneme panelde. Bugün başka hata e-postası gönderilmez.",
    why: b => `Bu e-postayı ${b} blog otomatiğin bir siteye bağlı olduğu için aldın.`,
    untitled: "Başlıksız yazı", site: "bağlı",
    err: { llm_fail: "Yazı üretimi birkaç denemede de tamamlanamadı.", refused: "Yazı bu konu için üretilemedi; konuyu ya da açıklamayı değiştirmeyi dene." },
  },
  en: {
    hi: n => `Hi ${n},`,
    publish: { subject: t => `Your post is live: ${t}`, body: (t, w) => `“${t}” was published on your ${w} site.` },
    draft: { subject: t => `New draft on your site: ${t}`, body: (t, w) => `“${t}” was sent to your ${w} site as a draft. Review it and publish when ready.` },
    push_err: { subject: () => "Blog autopilot: a post could not be sent", body: (t, w) => `“${t}” could not be sent to your ${w} site.` },
    produce_err: { subject: () => "Blog autopilot: a post could not be written", body: (t, w) => `The post scheduled for ${w} could not be written. Its credit was refunded.` },
    ready: {
      subject: t => `Your next post is ready: ${t}`,
      body: (t, w, n) => { const a = istParts(n.at); return `“${t}” is ready. It will be ${n.mode === "publish" ? "published on" : "sent as a draft to"} your ${w} site on ${a.y}-${a.m}-${a.d} at ${a.hm} (Istanbul time).`; },
    },
    manage: "From the panel you can preview, edit, reschedule or skip it. If you do nothing, it goes out on time.",
    open: "Open the post",
    panel: "Go to blog autopilot",
    share: "From the panel you can adapt the post into a LinkedIn or Instagram post in one click.",
    retry: "Details and retry are in the panel. No other error email will be sent today.",
    why: b => `You got this email because your ${b} blog autopilot is connected to a site.`,
    untitled: "Untitled post", site: "connected",
    err: { llm_fail: "Writing the post did not finish after several tries.", refused: "The post could not be written for this topic; try changing the topic or the brief." },
  },
};
const oneLine = (v, max) => { const t = str(v).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim(); return t.length > max ? `${t.slice(0, max - 1).trim()}…` : t; };
const siteWord = (row, T) => {
  const l = oneLine(row.label, 60);
  if (l) return l;
  try { return new URL(str(row.base_url)).hostname || T.site; } catch { return T.site; }
};

// n: { kind: 'publish'|'draft'|'push_err'|'produce_err'|'ready', title, url, err, at (ready: ms), mode }; row: users + cms_sites birleşimi
export function cmsMail(env, n, row) {
  const lang = row.lang === "en" ? "en" : "tr", T = MAIL_TEXT[lang], K = T[n.kind], site = str(row.site);
  const brand = siteConf(site).name, title = oneLine(n.title, MAIL_TITLE) || T.untitled, where = siteWord(row, T);
  const panel = `https://${site}${cmsBackPath(site, lang)}`, url = /^https:\/\/[^\s"'<>]+$/.test(str(n.url)) ? str(n.url).slice(0, 2000) : "";
  const isErr = n.kind.endsWith("_err"), help = isErr ? (ERROR_HELP[n.err]?.[lang] || T.err[n.err] || "") : "";
  const hi = T.hi(oneLine(row.name, 80) || (lang === "en" ? "there" : "")).replace(" ,", ","), body = K.body(title, where, n), extra = isErr ? T.retry : n.kind === "ready" ? T.manage : T.share;
  const lines = [hi, "", body, ...(help ? [help] : []), "", ...(url ? [`${T.open}: ${url}`] : []), `${T.panel}: ${panel}`, "", extra, "", T.why(brand), brand];
  const btn = (href, txt, dark) => `<a href="${escHtml(href)}" style="display:inline-block;${dark ? "background:#111;color:#fff;" : "color:#111;border:1px solid #111;"}padding:10px 16px;border-radius:8px;text-decoration:none;margin:0 8px 8px 0">${escHtml(txt)}</a>`;
  return {
    to: str(row.email),
    from: { email: smtpFrom(env), name: brand },
    subject: oneLine(K.subject(title), 160),
    text: `${lines.join("\n")}\n`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:520px">
<p>${escHtml(hi)}</p><p>${escHtml(body)}${help ? `<br>${escHtml(help)}` : ""}</p>
<p>${url ? btn(url, T.open, true) : ""}${btn(panel, T.panel, !url)}</p>
<p style="font-size:13px;color:#555">${escHtml(extra)}</p><p style="font-size:13px;color:#555">${escHtml(T.why(brand))}</p><p>${escHtml(brand)}</p></div>`,
  };
}

// 90 günden eski yazıların gövdesi (markdown) boşaltılır, satır kalır (liste/kota geçmişi). Gönderilmemiş eski 'hazir' iptal.
export async function cmsPurge(env) {
  const r = await env.DB.prepare(
    `UPDATE cms_posts SET markdown = NULL, state = CASE WHEN state = 'hazir' THEN 'iptal' ELSE state END, updated_at = datetime('now')
     WHERE id IN (SELECT id FROM cms_posts WHERE created_at < datetime('now', ?) AND markdown IS NOT NULL AND state NOT IN ('uretiliyor', 'gonderiliyor') LIMIT ?)`,
  ).bind(`-${PURGE_DAYS} days`, PURGE_BATCH).run();
  return Number(r?.meta?.changes) || 0;
}

export async function cmsTick(env, f = fetch, { d1 = 30, sub = 20, log = m => console.log(m), now = () => Date.now(), mail = smtpSend } = {}) {
  const out = { stale: 0, cancelled: 0, purged: 0, pushed: 0, push_failed: 0, scheduled: 0, quota: 0, plan_paused: 0, produced: 0, produce_failed: 0, mailed: 0, mail_skipped: 0 };
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
  // Bildirimler tik boyunca toplanır, gönderim adımından sonra ve tik sonunda gönderilir (en çok MAIL_PER_TICK). Satır CAS ile gerçekten
  // değiştiyse eklenir (yarışta iki tik aynı yazı için yazmaz). n: { kind, post_id, user_id, site_id, title, url, err }
  const notes = [], mailOn = smtpReady(env);
  const note = n => { if (mailOn && notes.length < NOTE_MAX) notes.push(n); else if (mailOn) out.mail_skipped++; };
  const changed = r => Number(r?.meta?.changes) > 0;
  const flush = () => step("mail", async () => {
    while (notes.length) {
      const n = notes.shift();
      if (out.mailed >= MAIL_PER_TICK || !take(2, 1)) { out.mail_skipped += 1 + notes.length; notes.length = 0; return; }
      const row = await db.prepare(
        "SELECT u.email, u.name, u.lang, s.site, s.label, s.base_url FROM cms_sites s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.user_id = ?",
      ).bind(n.site_id, n.user_id).first();
      if (!row || !str(row.email).includes("@")) { out.mail_skipped++; continue; }
      let ne = null; // hata e-postası kullanıcı başına günde 1; gönderilemezse hak iade edilir (o günün sonraki hatası yine e-posta alır)
      if (n.kind.endsWith("_err")) {
        const day = genDay(now());
        ne = { name: "ne", kind: "ne", key: await keyOf(env, day, "ne", String(n.user_id)), inc: 1, max: 1, day };
        const r = await reserve(db, day, [ne]);
        if (!r.ok) { out.mail_skipped++; continue; }
      }
      try { await mail(env, cmsMail(env, n, row)); out.mailed++; }
      catch (e) {
        out.mail_skipped++; log(JSON.stringify({ cms: "tick", phase: "mail", err: str(e?.name).slice(0, 40) }));
        if (ne) await db.prepare("UPDATE gen_usage SET n = MAX(0, n - 1) WHERE day = ? AND key = ?").bind(ne.day, ne.key).run();
      }
    }
  });

  // 1) temizlik: kirası dolmuş gönderim → sonucu bilinmiyor (körlemesine tekrar çift yazı olur; kullanıcı "yeniden dene" ile seçer)
  if (!(await step("stale", async () => {
    if (!take(1)) return;
    const { results } = await db.prepare(
      `UPDATE cms_posts SET state = 'basarisiz', last_error = 'unknown_result', lease_until = NULL, updated_at = datetime('now') WHERE state = 'gonderiliyor' AND lease_until < ?
       RETURNING id, user_id, cms_site_id, title`,
    ).bind(T()).all();
    out.stale = (results || []).length;
    for (const p of results || []) note({ kind: "push_err", post_id: p.id, user_id: p.user_id, site_id: p.cms_site_id, title: p.title, err: "unknown_result" });
  }))) return out;
  // kaldırılmış sitenin üretim bekleyen (kotası düşülmüş) yazıları: iade + iptal
  await step("cancel", async () => {
    if (!take(1)) return;
    const { results } = await db.prepare(
      "SELECT p.id, p.user_id, p.cms_site_id, p.slot, p.month, p.day FROM cms_posts p JOIN cms_sites s ON s.id = p.cms_site_id WHERE p.state = 'uretiliyor' AND s.state = 'kaldirildi' LIMIT ?",
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
      const at = st.length; // aşağıdaki yazı satırı güncellemesinin batch'teki yeri (CAS sonucu bildirim için)
      let n = null;
      if (res.ok) {
        st.push(db.prepare(
          "UPDATE cms_posts SET state = ?, remote_id = ?, remote_url = ?, last_error = NULL, lease_until = NULL, updated_at = datetime('now') WHERE id = ? AND state = 'gonderiliyor'",
        ).bind(p.mode === "publish" ? "yayinlandi" : "gonderildi", res.remote_id == null ? null : str(res.remote_id).slice(0, 200),
          /^https:\/\//.test(str(res.url)) ? str(res.url).slice(0, 2000) : null, p.id));
        out.pushed++;
        n = { kind: p.mode === "publish" ? "publish" : "draft", url: /^https:\/\//.test(str(res.url)) ? str(res.url) : "" };
      } else if (res.retry && RETRYABLE.has(err) && p.attempts < PUSH_MAX) {
        st.push(db.prepare("UPDATE cms_posts SET state = 'hazir', last_error = ?, next_try_at = ?, lease_until = NULL, updated_at = datetime('now') WHERE id = ? AND state = 'gonderiliyor'")
          .bind(err, sqlTime(now() + backoff(p.attempts, p.id) * 1000), p.id));
      } else {
        st.push(db.prepare("UPDATE cms_posts SET state = 'basarisiz', last_error = ?, lease_until = NULL, updated_at = datetime('now') WHERE id = ? AND state = 'gonderiliyor'")
          .bind(err, p.id));
        if (s && SITE_FATAL.has(err)) st.push(db.prepare("UPDATE cms_sites SET state = 'hata', last_error = ?, updated_at = datetime('now') WHERE id = ? AND state = 'aktif'").bind(err, s.id));
        out.push_failed++;
        n = { kind: "push_err", err };
      }
      const br = await db.batch(st);
      if (n && changed(br?.[at])) note({ ...n, post_id: p.id, user_id: p.user_id, site_id: p.cms_site_id, title: p.title });
    });
    if (!more) break;
  }
  await flush(); // gönderim bildirimleri üretimden önce: üretim bütçeyi bitirse de kaybolmasın

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
      ).bind(lease(), sqlTime(now() + leadMs(env)), t, t).first();
      if (!s) return;
      more = true;
      // Slot önden alındığı için sıradaki slot slotun kendisinden sonra aranır (now'dan değil; yoksa aynı slot tekrar gelir)
      const slot = s.next_run_at, sm = slotMs(slot), next = nextRunAt(jsonOr(s.days, []), Number(s.hour), Number.isFinite(sm) ? Math.max(sm, now()) : now());
      const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(s.user_id).first();
      const P = user ? planLimits(user) : null;
      // Plan düştü: blog otomatiği yok (cms_sites 0 → plan_required) ya da site sıklığı > planın cms_per_week (plan_frequency).
      // Bu slotta üretim yok, site duraklatılır (istemci last_error'u açıklar)
      const why = P && !((P.cms_sites ?? PLANS.basic.cms_sites) > 0) ? "plan_required"
        : P && weekOf(s) > (P.cms_per_week ?? PLANS.basic.cms_per_week) ? "plan_frequency" : null;
      if (why) {
        await db.prepare(
          "UPDATE cms_sites SET state = 'duraklatildi', last_error = ?, next_run_at = NULL, lease_until = NULL, updated_at = datetime('now') WHERE id = ? AND state = 'aktif'",
        ).bind(why, s.id).run();
        out.plan_paused++;
        return;
      }
      if (P) {
        const day = genDay(now()), month = day.slice(0, 7), ukey = await keyOf(env, day, "u", s.user_id);
        const cap = await lbCap(db, user, P, month);
        const r = cap.max === null ? { ok: false, failed: ["mo"] } : await reserve(db, day, [
          { name: "mo", month, user: s.user_id, kind: "lb", inc: 1, max: cap.max },
          { name: "u", kind: "u", key: ukey, inc: 1, max: userCap(env) },
        ]);
        const mode = s.auto_publish ? "publish" : "draft";
        if (!r.ok) {
          await db.prepare(
            `INSERT INTO cms_posts (cms_site_id, user_id, slot, state, mode, charged, month, day, last_error) VALUES (?, ?, ?, 'kota', ?, 0, ?, ?, ?)
             ON CONFLICT(cms_site_id, slot) DO NOTHING`,
          ).bind(s.id, s.user_id, slot, mode, month, day, cap.ended ? "trial_ended" : r.failed.includes("mo") ? "quota" : "rate").run();
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
      const produceErr = async e => { // iade + basarisiz; yazı satırı gerçekten değiştiyse bildirim
        const br = await refundBatch(env, p, "basarisiz", e);
        out.produce_failed++;
        if (changed(br?.[br.length - 1])) note({ kind: "produce_err", post_id: p.id, user_id: p.user_id, site_id: p.cms_site_id, title: p.title, err: e });
      };
      if (p.attempts > PRODUCE_MAX) { await produceErr("llm_fail"); return; }
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
          await produceErr(kind === "refusal" ? "refused" : "llm_fail");
        }
        return;
      }
      const title = str(d.title).trim().slice(0, 300);
      let cover = null;
      if (P?.stock && env.PEXELS_API_KEY && take(1, 1)) {
        try {
          const day = genDay(now());
          const rs = await reserve(db, day, [{ name: "all", kind: "sa", key: await keyOf(env, day, "sa", "global"), inc: 1, max: intEnv(env.GEN_STOCK_PER_DAY, STOCK_DAY_MAX) }]);
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
      // Gönderim anı: zamanlanmış yazıda slot (geçmişteyse şimdi), elle tetikte şimdi
      const sm = slotMs(p.slot), pubMs = Number.isFinite(sm) ? Math.max(sm, now()) : now(), pub = sqlTime(pubMs);
      const st = [db.prepare(
        `UPDATE cms_posts SET state = 'hazir', title = ?, slug = ?, markdown = ?, cover_url = ?, cover_credit = ?, attempts = 0, next_try_at = ?, lease_until = NULL,
         last_error = NULL, updated_at = datetime('now') WHERE id = ? AND state = 'uretiliyor'`,
      ).bind(title, slugify(title) || null, str(d.text).slice(0, STUDIO_MAX.blogText * 2), cover?.url || null, cover?.credit || null, pub, p.id)];
      // Kuyruktaki konu yalnız başarıda düşülür; kullanıcı listeyi bu arada değiştirdiyse (CAS) dokunulmaz
      if (queued) st.push(db.prepare(`UPDATE cms_sites SET topics = ?, updated_at = datetime('now') WHERE id = ? AND topics = ?
        AND EXISTS (SELECT 1 FROM cms_posts WHERE id = ? AND state = 'hazir')`).bind(JSON.stringify(topics.slice(1)), s.id, s.topics, p.id));
      const br = await db.batch(st);
      out.produced++;
      // Önden hazırlandıysa (yayına 2 saatten çok var) "yazın hazır" e-postası: kullanıcı panelden önizler/düzenler/erteler/atlar
      if (pubMs - now() > READY_MAIL_MIN && changed(br?.[0])) note({ kind: "ready", post_id: p.id, user_id: p.user_id, site_id: p.cms_site_id, title, at: pubMs, mode: p.mode });
    });
  }
  await flush();
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
  "POST cmsposts/:id/view": gate(view),
  "POST cmsposts/:id/edit": gate(edit),
  "POST cmsposts/:id/skip": gate(skip),
  "POST cmsposts/:id/now": gate(sendNow),
  "POST cmsposts/:id/reschedule": gate(reschedule),
  "POST cmsoauth/start": gate(oauthStart),
  "POST cmsoauth/finish": gate(oauthFinish),
};
