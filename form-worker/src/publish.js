// Yayın kuyruğu (A7 TEKNIK-PLAN §2, §3, §6, §7): onaylı LinkedIn/Instagram gönderilerinin zamanlanmış yayını.
// KAPALI başlar: PUBLISH_ENABLED "1" değilse /publish/* uçları 503 not_ready döner, 5 dakikalık cron dalı (publishTick)
// D1'e ve dışarıya hiç dokunmaz. Kapılar: 1-3 kodda (bayrak, PUBLISH_SITES, PUBLISH_PLATFORMS), 4-6 kira SQL'inde (yazma
// kapsamı, onay + aynı metin özeti, bağlı ve aynı hesap). Ekip modu yok: işi onaylayan sahibidir.
// Durum geçişleri yalnız bu dosyada: koşullu UPDATE + aynı batch'te publish_events (changes() > 0 ise). Tablo dışı geçiş 409.
// Saatler UTC, SQLite biçimi ('YYYY-MM-DD HH:MM:SS'); API ISO (…Z) döner, yerel saat girişi Europe/Istanbul sayılır.
// Token, metin ve sağlayıcı yanıtı log'a ve olaylara yazılmaz; yalnız kısa kodlar.

import { decrypt, encrypt, refreshToken, ProviderError, errText, WRITE_SCOPE, hasWriteScope } from "./oauth.js";
import { platformSite, sessionUser } from "./platform.js";
import { queueAllowed, QUEUE_PLANS } from "./plans.js";
import { PROVIDERS, COST, PREP_TIMEOUT } from "./publish-providers.js";

export const PUBLISH_CRON = "*/5 * * * *"; // wrangler.toml ikinci cron; saatlik iş "17 * * * *" aynen kalır
export const PLATFORMS = ["linkedin", "instagram"];
export const LIMITS = { linkedin: 3000, instagram: 2200 }; // DOĞRULANMALI: LinkedIn commentary 3000, IG caption 2200
// Yazma kapsamları (kapı 4) oauth.js'te: OAuth onları yalnız kuyruk o site/platform için açıkken ister (writeScope).
// Kapsamsız token'la onay/yeniden deneme 409 reconnect_required (hesap yeniden bağlanmalı). DOĞRULANMALI: kapsam adları.
export { WRITE_SCOPE };
// Planlı sitelerde (app.socialmediacorner.co; src/plans.js QUEUE_PLANS) kuyruğa iş açma, gönderme, onay ve yeniden deneme
// yalnız pro/enterprise'ta: değilse 403 plan_required {plan:"pro"}. Liste, görüntüleme, düzenleme, iptal ve "yayınlandı"
// işareti her planda açık (eski işler görülür ve iptal edilebilir). brandcorner.co'da plan yok, davranış değişmez.
// Cron'da da (planDropBatch): plan düşünce planlandi işler kiralanmaz, onay_bekliyor'a döner (onay silinir, plan_required).
const PLAN_SITES = ["app.socialmediacorner.co"], UPGRADE_PLAN = "pro";
const planGated = c => PLAN_SITES.includes(c.site) && !queueAllowed(c.user);
const needPlan = c => { if (planGated(c)) throw new Bad("plan_required", 403, { plan: UPGRADE_PLAN }); };
export const MAX_PER_RUN = 6, MAX_ATTEMPTS = 5;
// Çağrı başına D1 ifadesi (her batch ifadesi ayrı sayılır): hazırlık 9 (batch 7 + plan düşüşü batch'i 2), kira 1, iş başına
// en çok 6 (token oku, yenileme yazımı ×2 (eskimiş + 401 sonrası), konteyner, sonuç + olay), bırakma batch'i 2.
// 9 + 1 + 6×6 + 2 = 48 ≤ 50.
export const PREP_D1 = 9, JOB_D1 = 6, RELEASE_D1 = 2;
// Yeni işe yalnız turun ilk 20 sn'sinde başlanır (IG yoklama beklemesi iş başına ~3 sn). DOĞRULANMALI: cron duvar süresi.
export const DEADLINE_MS = 20000;
const MAX_BODY = 16000, MAX_OPEN = 100, MAX_MEDIA = 1000, MAX_DAYS = 180, PAST_GRACE_MS = 5 * 60 * 1000;
const OPEN_STATES = ["taslak", "onay_bekliyor", "planlandi", "yayinlaniyor"];
const EDITABLE = ["taslak", "onay_bekliyor", "planlandi"];

// İzinli geçişler (§2). Sistem geçişleri (kira, sonuç, hazırlık) aşağıda kendi koşullu SQL'leriyle.
const MOVES = {
  taslak: ["onay_bekliyor", "iptal"],
  onay_bekliyor: ["planlandi", "iptal"],
  planlandi: ["onay_bekliyor", "iptal", "yayinlaniyor", "basarisiz"],
  yayinlaniyor: ["yayinlandi", "basarisiz", "kontrol", "planlandi"],
  basarisiz: ["planlandi"],
  kontrol: ["planlandi", "yayinlandi"],
};
export const canMove = (from, to) => !!MOVES[from]?.includes(to);

// Kapılar 1-3. Biri kapalıysa null: çağıran hiçbir şeye dokunmaz.
export function gates(env) {
  if (String(env?.PUBLISH_ENABLED ?? "") !== "1") return null;
  const list = v => String(v ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const sites = list(env.PUBLISH_SITES), platforms = list(env.PUBLISH_PLATFORMS).filter(p => PLATFORMS.includes(p));
  if (!sites.length || !platforms.length) return null;
  const n = Math.floor(Number(env.PUBLISH_PER_RUN));
  return { sites, platforms, perRun: Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_PER_RUN) : 3 };
}

// Üstel bekleme (sn): 60 × 2^deneme, en çok 6 sa, + iş kimliğinden sabit 0-59 sn sapma (işler aynı anda dönmesin)
export const backoff = (attempts, id) => Math.min(60 * 2 ** attempts, 21600) + (Number(id) * 37) % 60;

// ---- saat ----
const IST = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const wall = ms => {
  const p = Object.fromEntries(IST.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
};
export const toSql = ms => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
const fromSql = s => Date.parse(String(s).replace(" ", "T") + "Z");
const iso = s => (s ? String(s).replace(" ", "T") + "Z" : null);

// run_at: mutlak ISO (Z ya da ±hh:mm) ya da bölgesiz yerel saat (Europe/Istanbul) → SQLite UTC metni. Olmayan saat 400.
export function parseRunAt(v) {
  const m = typeof v === "string" && v.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/);
  if (!m) throw new Bad("run_at");
  const [y, mo, d, h, mi, s] = m.slice(1, 7).map(x => Number(x || 0));
  const target = Date.UTC(y, mo - 1, d, h, mi, s);
  const t0 = new Date(target);
  if (t0.getUTCFullYear() !== y || t0.getUTCMonth() !== mo - 1 || t0.getUTCDate() !== d || h > 23 || mi > 59 || s > 59) throw new Bad("run_at");
  let t;
  if (m[7]) t = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || "00"}${m[7]}`);
  else {
    t = target;
    for (let i = 0; i < 3; i++) t = target - (wall(t) - t); // yerel = UTC + fark; fark yaz saatine göre değişir
    if (wall(t) !== target) throw new Bad("run_at"); // yaz saati geçişinde olmayan yerel saat
  }
  if (!Number.isFinite(t)) throw new Bad("run_at");
  return toSql(Math.floor(t / 1000) * 1000);
}

// ---- HTTP ----
class Bad extends Error {
  constructor(code, status = 400, extra = null) { super(code); this.code = code; this.status = status; this.extra = extra; }
}
const reply = (body, status, origin) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store", ...(origin && { "access-control-allow-origin": origin, vary: "Origin" }) },
});
const enc = new TextEncoder();
const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)))].map(b => b.toString(16).padStart(2, "0")).join("");
const bodyHash = (platform, body, media) => sha256(`${platform}\n${body}\n${media ?? ""}`);

const view = j => ({
  id: j.id, rid: j.rid, platform: j.platform, state: j.state, body: j.body, media_url: j.media_url, run_at: iso(j.run_at),
  approved_at: iso(j.approved_at), attempts: j.attempts, next_try_at: iso(j.next_try_at), last_error: j.last_error,
  remote_id: j.remote_id, created_at: iso(j.created_at), updated_at: iso(j.updated_at),
});

function cleanBody(v, platform) {
  if (typeof v !== "string" || !v.trim()) throw new Bad("body");
  if ([...v].length > LIMITS[platform]) throw new Bad("too_long"); // SQLite length() gibi kod noktası sayar
  return v;
}
function cleanMedia(v) {
  if (v == null || v === "") return null;
  if (typeof v !== "string" || v.length > MAX_MEDIA) throw new Bad("media_url");
  let u;
  try { u = new URL(v); } catch { throw new Bad("media_url"); }
  if (u.protocol !== "https:") throw new Bad("media_url"); // IG image_url herkese açık https olmalı (DOĞRULANMALI)
  return v;
}
const optRunAt = v => (v == null || v === "" ? null : parseRunAt(v));

// /publish/jobs, /publish/jobs/:id, /publish/jobs/:id/(submit|approve|cancel|retry|done)
const ROUTE = /^\/publish\/jobs(?:\/(\d{1,12}))?(?:\/(submit|approve|cancel|retry|done))?$/;

export async function publish(req, url, env, origin) {
  const site = platformSite(env, origin);
  if (!site) return reply({ ok: false, error: "origin" }, 403, origin); // origin index.js süzgecinden: izinli değilse null
  const g = gates(env);
  if (!g || !g.sites.includes(site)) return reply({ ok: false, error: "not_ready" }, 503, origin); // 0 D1
  try {
    let body = {};
    if (req.method === "POST" || req.method === "PUT") {
      const text = await req.text();
      if (text.length > MAX_BODY) throw new Bad("size", 413);
      try { body = text ? JSON.parse(text) : {}; } catch { throw new Bad("json"); }
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Bad("json");
    }
    const token = (req.headers.get("authorization") || "").match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    // Oturum platform.js ile aynı yoldan: rolü sitede kabul edilmeyen (pasif) hesap 401 auth (src/sites.js roles)
    const user = await sessionUser(env, token, site);
    if (!user) throw new Bad("auth", 401);
    const m = url.pathname.replace(/\/+$/, "").match(ROUTE);
    if (!m) throw new Bad("not_found", 404);
    const c = { env, origin, site, g, user, body };
    const id = m[1] ? Number(m[1]) : null, act = m[2];
    if (!id) {
      if (act) throw new Bad("not_found", 404);
      if (req.method === "GET") return await list(c);
      if (req.method === "POST") { needPlan(c); return await create(c); }
      throw new Bad("not_found", 404);
    }
    const job = await own(c, id);
    if (!act) {
      if (req.method === "GET") return await show(c, job);
      if (req.method === "PUT") return await edit(c, job);
      throw new Bad("not_found", 404);
    }
    if (req.method !== "POST") throw new Bad("not_found", 404);
    if (act === "submit" || act === "approve" || act === "retry") needPlan(c);
    // Kullanıcı eylemleri tablonun yalnız kendi kısmını kullanır: gönder yalnız taslaktan, "yayınlandı" işareti yalnız
    // kontrol'den (yayinlaniyor'daki iş cron'undur; planlandi → onay_bekliyor yalnız düzenlemeyle, onay silinerek)
    if (act === "submit") await move(env, job.state === "taslak" ? job : { ...job, state: "-" }, "onay_bekliyor", user.id, "submitted");
    else if (act === "approve") await approve(c, job, false);
    else if (act === "retry") await approve(c, job, true);
    else if (act === "cancel") await move(env, job, "iptal", user.id, "cancelled", ", idem_key = NULL");
    else if (act === "done") await move(env, job.state === "kontrol" ? job : { ...job, state: "-" }, "yayinlandi", user.id, "user_done");
    return ok(c, { job: view(await own(c, id)) });
  } catch (e) {
    if (e instanceof Bad) return reply({ ...e.extra, ok: false, error: e.code }, e.status, origin);
    console.error(errText(e));
    return reply({ ok: false, error: "server" }, 500, origin);
  }
}

const ok = (c, body) => reply({ ok: true, ...body }, 200, c.origin);

// Başkasının işi yokmuş gibi: 404
async function own(c, id) {
  const job = await c.env.DB.prepare("SELECT * FROM publish_jobs WHERE id = ? AND user_id = ?").bind(id, c.user.id).first();
  if (!job) throw new Bad("not_found", 404);
  return job;
}

async function list(c) {
  const { results } = await c.env.DB.prepare("SELECT * FROM publish_jobs WHERE user_id = ? ORDER BY id DESC LIMIT 100").bind(c.user.id).all();
  return ok(c, { jobs: results.map(view), enabled: true, ...(PLAN_SITES.includes(c.site) && { plan_required: planGated(c) ? UPGRADE_PLAN : null }) });
}

async function show(c, job) {
  const { results } = await c.env.DB.prepare(
    "SELECT at, actor, from_state, to_state, note FROM publish_events WHERE job_id = ? ORDER BY id DESC LIMIT 50",
  ).bind(job.id).all();
  return ok(c, { job: view(job), events: results.map(e => ({ ...e, at: iso(e.at), by: e.actor == null ? "system" : "user", actor: undefined })) });
}

// Hesap sunucuda çözülür: kullanıcının o platformdaki bağlı hesabı. Verilen account_id başkasınınsa ya da farklıysa 404.
async function create(c) {
  const { env, user, body, g } = c;
  const rid = typeof body.rid === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(body.rid) ? body.rid : null;
  if (!rid) throw new Bad("rid");
  if (!g.platforms.includes(body.platform)) throw new Bad("platform");
  const platform = body.platform;
  const text = cleanBody(body.body, platform), media = cleanMedia(body.media_url), runAt = optRunAt(body.run_at);
  const dup = await env.DB.prepare("SELECT * FROM publish_jobs WHERE rid = ?").bind(rid).first();
  if (dup) {
    if (dup.user_id !== user.id) throw new Bad("rid", 409);
    return ok(c, { job: view(dup), dup: true });
  }
  const open = await env.DB.prepare(`SELECT count(*) AS n FROM publish_jobs WHERE user_id = ? AND state IN (${OPEN_STATES.map(() => "?").join(", ")})`)
    .bind(user.id, ...OPEN_STATES).first();
  if ((open?.n || 0) >= MAX_OPEN) throw new Bad("limit", 409);
  const acc = await env.DB.prepare("SELECT id, external_id FROM social_accounts WHERE user_id = ? AND platform = ? AND status = 'connected'")
    .bind(user.id, platform).first();
  if (!acc || (body.account_id != null && Number(body.account_id) !== acc.id)) throw new Bad("not_found", 404);
  if (!acc.external_id) throw new Bad("not_connected", 409);
  const row = await env.DB.prepare(
    `INSERT INTO publish_jobs (user_id, site, account_id, account_external_id, platform, body, media_url, body_hash, run_at, rid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (rid) DO NOTHING RETURNING *`,
  ).bind(user.id, c.site, acc.id, acc.external_id, platform, text, media, await bodyHash(platform, text, media), runAt, rid).first();
  if (!row) { // aynı rid ile eşzamanlı istek
    const again = await env.DB.prepare("SELECT * FROM publish_jobs WHERE rid = ? AND user_id = ?").bind(rid, user.id).first();
    if (!again) throw new Bad("rid", 409);
    return ok(c, { job: view(again), dup: true });
  }
  await env.DB.prepare("INSERT INTO publish_events (job_id, actor, from_state, to_state, note) VALUES (?, ?, NULL, 'taslak', 'created')").bind(row.id, user.id).run();
  return ok(c, { job: view(row) });
}

// Düzenleme yalnız taslak/onay_bekliyor/planlandi'da; özet yeniden hesaplanır, konteyner atılır. planlandi → onay_bekliyor
// (onay ve idem_key silinir): onaylanmamış metin yayınlanmaz.
async function edit(c, job) {
  const { env, user, body: b } = c;
  if (!EDITABLE.includes(job.state)) throw new Bad("state", 409);
  const text = "body" in b ? cleanBody(b.body, job.platform) : job.body;
  const media = "media_url" in b ? cleanMedia(b.media_url) : job.media_url;
  const runAt = "run_at" in b ? optRunAt(b.run_at) : job.run_at;
  const to = job.state === "planlandi" ? "onay_bekliyor" : job.state;
  const [u] = await env.DB.batch([
    env.DB.prepare(
      `UPDATE publish_jobs SET body = ?, media_url = ?, run_at = ?, body_hash = ?, container_id = NULL, state = ?, approved_by = NULL,
         approved_at = NULL, approved_hash = NULL, idem_key = NULL, updated_at = datetime('now') WHERE id = ? AND user_id = ? AND state = ?`,
    ).bind(text, media, runAt, await bodyHash(job.platform, text, media), to, job.id, user.id, job.state),
    env.DB.prepare("INSERT INTO publish_events (job_id, actor, from_state, to_state, note) SELECT ?, ?, ?, ?, 'edited' WHERE changes() > 0")
      .bind(job.id, user.id, job.state, to),
  ]);
  if (!u.meta.changes) throw new Bad("state", 409);
  return ok(c, { job: view(await own(c, job.id)) });
}

// Tek geçiş yolu (kullanıcı eylemleri): tablo dışı 409; koşullu UPDATE 0 satırsa (yarış) 409.
async function move(env, job, to, actor, note, set = "", args = [], where = "", whereArgs = []) {
  if (!canMove(job.state, to)) throw new Bad("state", 409);
  const [u] = await env.DB.batch([
    env.DB.prepare(`UPDATE publish_jobs SET state = ?, updated_at = datetime('now')${set} WHERE id = ? AND user_id = ? AND state = ?${where}`)
      .bind(to, ...args, job.id, job.user_id, job.state, ...whereArgs),
    env.DB.prepare("INSERT INTO publish_events (job_id, actor, from_state, to_state, note) SELECT ?, ?, ?, ?, ? WHERE changes() > 0")
      .bind(job.id, actor, job.state, to, note),
  ]);
  if (!u.meta.changes) throw new Bad("state", 409);
}

// Onay (onay_bekliyor → planlandi) ve yeniden deneme (basarisiz/kontrol → planlandi) taze onaydır: okunan özet onaylanır
// (body_hash = ? koşulu), hesap kimliği o anki bağlı hesaptan yazılır, deneme sayacı sıfırlanır. idem_key çakışırsa 409.
async function approve(c, job, retry) {
  const { env, user, body: b, g } = c;
  if (retry ? !["basarisiz", "kontrol"].includes(job.state) : job.state !== "onay_bekliyor") throw new Bad("state", 409);
  if (!g.platforms.includes(job.platform)) throw new Bad("platform");
  if (!job.body) throw new Bad("body");
  if (job.platform === "instagram" && !job.media_url) throw new Bad("media_url");
  const now = Date.now();
  let runAt = optRunAt(b.run_at) || job.run_at;
  if (retry && !optRunAt(b.run_at)) runAt = job.run_at && fromSql(job.run_at) > now ? job.run_at : toSql(now);
  if (!runAt) throw new Bad("run_at");
  const at = fromSql(runAt);
  if (!(at >= now - PAST_GRACE_MS && at <= now + MAX_DAYS * 86400000)) throw new Bad("run_at");
  const acc = await env.DB.prepare("SELECT external_id FROM social_accounts WHERE id = ? AND user_id = ? AND platform = ? AND status = 'connected'")
    .bind(job.account_id, user.id, job.platform).first();
  if (!acc?.external_id) throw new Bad("not_connected", 409);
  // Kapı 4 onayda da: yazma kapsamı olmayan token'la planlanan iş kiralanmaz ve 24 sa sonra bayatlardı; şimdiden söylenir
  const tok = await env.DB.prepare("SELECT scope FROM oauth_tokens WHERE user_id = ? AND platform = ?").bind(user.id, job.platform).first();
  if (!hasWriteScope(tok?.scope, job.platform)) throw new Bad("reconnect_required", 409);
  const idem = await sha256(`${job.account_id}|${job.body_hash}|${runAt}`);
  try {
    await move(env, job, "planlandi", user.id, retry ? "retry" : "approved",
      `, run_at = ?, approved_by = ?, approved_at = datetime('now'), approved_hash = body_hash, idem_key = ?, account_external_id = ?,
         attempts = 0, next_try_at = NULL, last_error = NULL, lease_until = NULL`,
      [runAt, user.id, idem, acc.external_id], " AND body_hash = ?", [job.body_hash]);
  } catch (e) {
    if (/UNIQUE/i.test(e?.message || "")) throw new Bad("duplicate", 409);
    throw e;
  }
}

// ---- cron: publishTick ----

// Hazırlık (kiradan önce; tek batch 7 ifade, ardından plan düşüşü batch'i 2 ifade, toplam PREP_D1): süresi geçen kira →
// kontrol (istek gitmiş olabilir); 24 sa bayat planlandi → basarisiz; hesap başka kimlikle yeniden bağlandıysa planlandi →
// onay_bekliyor (onay silinir); 90 gün saklama. Her geçiş önce olayını yazar (aynı koşul, aynı işlem).
const EXPIRED = "state = 'yayinlaniyor' AND lease_until <= datetime('now')";
const STALE = "state = 'planlandi' AND run_at <= datetime('now', '-24 hours')";
const CHANGED = `state = 'planlandi' AND id IN (SELECT j.id FROM publish_jobs j JOIN social_accounts a ON a.id = j.account_id
  WHERE j.state = 'planlandi' AND a.status = 'connected' AND a.external_id IS NOT j.account_external_id)`;
const prepBatch = DB => [
  DB.prepare(`INSERT INTO publish_events (job_id, actor, from_state, to_state, note) SELECT id, NULL, 'yayinlaniyor', 'kontrol', 'lease_expired' FROM publish_jobs WHERE ${EXPIRED}`),
  DB.prepare(`UPDATE publish_jobs SET state = 'kontrol', lease_until = NULL, last_error = 'lease_expired', updated_at = datetime('now') WHERE ${EXPIRED}`),
  DB.prepare(`INSERT INTO publish_events (job_id, actor, from_state, to_state, note) SELECT id, NULL, 'planlandi', 'basarisiz', 'stale' FROM publish_jobs WHERE ${STALE}`),
  DB.prepare(`UPDATE publish_jobs SET state = 'basarisiz', last_error = 'stale', updated_at = datetime('now') WHERE ${STALE}`),
  DB.prepare(`INSERT INTO publish_events (job_id, actor, from_state, to_state, note) SELECT id, NULL, 'planlandi', 'onay_bekliyor', 'account_changed' FROM publish_jobs WHERE ${CHANGED}`),
  DB.prepare(`UPDATE publish_jobs SET state = 'onay_bekliyor', approved_by = NULL, approved_at = NULL, approved_hash = NULL, idem_key = NULL,
    last_error = 'account_changed', updated_at = datetime('now') WHERE ${CHANGED}`),
  DB.prepare("UPDATE publish_jobs SET body = '' WHERE state IN ('yayinlandi', 'iptal') AND body <> '' AND updated_at <= datetime('now', '-90 days')"),
];
// Plan düşüşü (HTTP plan kapısının cron karşılığı; cms.js plan_required emsali): planlı sitede sahibinin planı artık
// QUEUE_PLANS'ta değilse (admin düşürdü, deneme bitti, bilinmeyen değer) planlandi iş onay_bekliyor'a döner, onay ve
// idem_key silinir, last_error 'plan_required'. İş yayınlanmaz, kullanıcı görür; Pro'ya geçince yeniden onaylar (onay
// HTTP'de planlıdır). users.plan 0018'de: ayrı batch, çünkü 0018'siz ortamda hata ana hazırlığı (brandcorner) düşürmesin.
const sqlList = a => a.map(v => `'${v}'`).join(", ");
const PLAN_DROP = `state = 'planlandi' AND site IN (${sqlList(PLAN_SITES)})
  AND user_id IN (SELECT id FROM users WHERE COALESCE(plan, '') NOT IN (${sqlList(QUEUE_PLANS)}))`;
const planDropBatch = DB => [
  DB.prepare(`INSERT INTO publish_events (job_id, actor, from_state, to_state, note) SELECT id, NULL, 'planlandi', 'onay_bekliyor', 'plan_required' FROM publish_jobs WHERE ${PLAN_DROP}`),
  DB.prepare(`UPDATE publish_jobs SET state = 'onay_bekliyor', approved_by = NULL, approved_at = NULL, approved_hash = NULL, idem_key = NULL,
    last_error = 'plan_required', updated_at = datetime('now') WHERE ${PLAN_DROP}`),
];

// Kira (TEKNIK-PLAN §3 SQL'i + platform eşleşmesi, yazma kapsamı ve art arda 3 başarısızlık kesicisi). Kapılar 4-6 burada;
// hesap başına turda en çok 1 iş ve hesapta yayinlaniyor iş varken yenisi yok. Kesici: hesabın son 3 sonuçlanmış işi
// (bayat hariç) basarisiz ise, o son hatadan önce onaylanmış işler beklemede kalır; sahibin yeni onayı/yeniden denemesi açar.
// Bağlar: ?1 siteler (JSON), ?2 platformlar (JSON), ?3 LIMIT.
const FAILED = "c.state = 'basarisiz' AND COALESCE(c.last_error, '') <> 'stale'";
export const LEASE_SQL = `UPDATE publish_jobs SET state = 'yayinlaniyor', lease_until = datetime('now', '+4 minutes'), updated_at = datetime('now')
WHERE state = 'planlandi' AND id IN (SELECT id FROM (SELECT j.id, j.run_at, ROW_NUMBER() OVER (PARTITION BY j.account_id ORDER BY j.run_at, j.id) AS rn
  FROM publish_jobs j
  JOIN social_accounts a ON a.id = j.account_id AND a.user_id = j.user_id AND a.platform = j.platform
  JOIN oauth_tokens t ON t.user_id = j.user_id AND t.platform = j.platform
  WHERE j.state = 'planlandi' AND j.approved_at IS NOT NULL AND j.approved_hash = j.body_hash
    AND a.status = 'connected' AND a.external_id = j.account_external_id
    AND instr(' ' || replace(COALESCE(t.scope, ''), ',', ' ') || ' ',
      ' ' || CASE j.platform WHEN 'linkedin' THEN '${WRITE_SCOPE.linkedin}' ELSE '${WRITE_SCOPE.instagram}' END || ' ') > 0
    AND j.site IN (SELECT value FROM json_each(?)) AND j.platform IN (SELECT value FROM json_each(?))
    AND COALESCE(j.next_try_at, j.run_at) <= datetime('now') AND j.run_at > datetime('now', '-24 hours')
    AND NOT EXISTS (SELECT 1 FROM publish_jobs b WHERE b.account_id = j.account_id AND b.state = 'yayinlaniyor')
    AND NOT ((SELECT count(*) FROM publish_jobs c WHERE ${FAILED} AND c.id IN (SELECT c2.id FROM publish_jobs c2
          WHERE c2.account_id = j.account_id AND c2.state IN ('yayinlandi', 'basarisiz') AND COALESCE(c2.last_error, '') <> 'stale'
          ORDER BY c2.updated_at DESC, c2.id DESC LIMIT 3)) >= 3
      AND j.approved_at <= (SELECT max(c.updated_at) FROM publish_jobs c WHERE c.account_id = j.account_id AND ${FAILED})))
  WHERE rn = 1 ORDER BY run_at LIMIT ?) RETURNING *`;

// Token: kiradaki hesapla aynı kişi ve aynı platform kimliği (yeniden bağlama yarışında eski token kullanılmaz)
const TOKEN_SQL = `SELECT t.access_token, t.refresh_token,
  (t.expires_at IS NOT NULL AND t.expires_at <= datetime('now')) AS expired,
  (t.expires_at IS NOT NULL AND t.expires_at <= datetime('now', '+7 days')) AS stale
  FROM oauth_tokens t JOIN social_accounts a ON a.user_id = t.user_id AND a.platform = t.platform
  WHERE a.id = ? AND a.user_id = ? AND a.status = 'connected' AND a.external_id = ?`;
// Yenilenen token karşılaştır-yaz (oauth.js düzeni): okunan şifreli token değiştiyse 0 satır → "token_changed"
const CAS_SQL = `UPDATE oauth_tokens SET access_token = ?, refresh_token = COALESCE(?, refresh_token), expires_at = datetime('now', ?),
  updated_at = datetime('now') WHERE user_id = ? AND platform = ? AND access_token = ?`;
const expiry = t => { const n = Number(t?.expires_in); return t?.expires_in != null && Number.isFinite(n) && n >= 0 ? `+${Math.floor(n)} seconds` : null; };

// Bir işi dener; sonuç nesnesi döner (publish-providers.js biçimi), istisna atmaz.
async function runJob(env, job, f, st, pollWait, log) {
  let wrote = false, refreshed = false, token;
  const onWrite = () => { wrote = true; };
  try {
    st.d1++;
    const tok = await env.DB.prepare(TOKEN_SQL).bind(job.account_id, job.user_id, job.account_external_id).first();
    if (!tok) return { to: "planlandi", after: null, code: "not_connected", attempt: true };
    try { token = await decrypt(env, tok.access_token); } catch { return { to: "planlandi", after: null, code: "token", attempt: true }; }
    if (!token) return { to: "planlandi", after: null, code: "token", attempt: true };
    if (job.platform === "linkedin" && tok.expired) return { to: "basarisiz", code: "reconnect" }; // LinkedIn'de yenileme yok (§5)

    // IG uzun ömürlü token yenilemesi (yalnız IG; oauth.js refreshToken). null: devam, nesne: iş sonucu.
    const refresh = async afterAuth => {
      refreshed = true;
      let t;
      try {
        t = await refreshToken(env, "instagram", { access_token: token, refresh_token: null }, f);
        if (!t?.access_token) throw new ProviderError("token");
      } catch (e) {
        const hard = e instanceof ProviderError && /^4\d\d/.test(e.code);
        if (afterAuth || tok.expired) return hard ? { to: "basarisiz", code: "reconnect" } : { to: "planlandi", after: null, code: "ig_refresh", attempt: true };
        return null; // eski token hâlâ geçerli
      }
      const box = await encrypt(env, t.access_token);
      st.d1++;
      const r = await env.DB.prepare(CAS_SQL).bind(box, await encrypt(env, t.refresh_token), expiry(t), job.user_id, "instagram", tok.access_token).run();
      if (!r?.meta?.changes) return { to: "planlandi", after: 60, code: "token_changed", attempt: false };
      tok.access_token = box;
      token = t.access_token;
      return null;
    };
    if (job.platform === "instagram" && tok.stale) {
      const o = await refresh(false);
      if (o) return o;
    }
    const saveContainer = async id => {
      st.d1++;
      await env.DB.prepare("UPDATE publish_jobs SET container_id = ? WHERE id = ? AND state = 'yayinlaniyor' AND lease_until = ?").bind(id, job.id, job.lease_until).run();
      job.container_id = id;
    };
    const call = () => PROVIDERS[job.platform]({ job, token, f, saveContainer, pollWait, onWrite });
    let out = await call();
    if (out.auth) {
      if (job.platform !== "instagram" || refreshed) return { to: "basarisiz", code: "reconnect" };
      if (st.sub - st.used < COST.instagram) return { to: "planlandi", after: null, code: "ig_auth_budget", attempt: false };
      const o = await refresh(true);
      if (o) return o;
      out = await call();
      if (out.auth) return { to: "basarisiz", code: "reconnect" };
    }
    return out;
  } catch (e) {
    log(JSON.stringify({ ev: "publish_error", job: job.id, err: errText(e) }));
    return wrote ? { to: "kontrol", code: "error" } : { to: "planlandi", after: null, code: "error", attempt: true };
  }
}

// Sonucu yazar: yalnız kira hâlâ bizdeyse (state + lease_until). planlandi: deneme sayılırsa attempts+1, 5'te basarisiz.
async function finish(env, job, out) {
  let to = out.to, code = out.code ?? null, attempts = job.attempts, wait = null;
  if (!["yayinlandi", "planlandi", "basarisiz", "kontrol"].includes(to)) { to = "kontrol"; code = "bad_result"; }
  if (to === "planlandi") {
    if (out.attempt) attempts++;
    if (attempts >= MAX_ATTEMPTS) { to = "basarisiz"; code = `max_attempts:${code}`; }
    else wait = `+${out.after ?? backoff(job.attempts, job.id)} seconds`;
  }
  code = code == null ? null : String(code).slice(0, 80);
  const [u] = await env.DB.batch([
    env.DB.prepare(`UPDATE publish_jobs SET state = ?, lease_until = NULL, updated_at = datetime('now'), last_error = ?, remote_id = COALESCE(?, remote_id),
      attempts = ?, next_try_at = datetime('now', ?) WHERE id = ? AND state = 'yayinlaniyor' AND lease_until = ?`)
      .bind(to, code, out.remote_id ?? null, attempts, wait, job.id, job.lease_until),
    env.DB.prepare("INSERT INTO publish_events (job_id, actor, from_state, to_state, note) SELECT ?, NULL, 'yayinlaniyor', ?, ? WHERE changes() > 0")
      .bind(job.id, to, code),
  ]);
  return { to, code, written: !!u?.meta?.changes };
}

// 5 dakikalık cron. sub/d1: bu çağrıya kalan alt istek ve D1 bütçesi. Kapı kapalıysa 0 D1, 0 istek.
export async function publishTick(env, f = fetch, { sub = 50, d1 = 50, clock = Date.now, deadlineMs = DEADLINE_MS, pollWait = 3000, log = console.log } = {}) {
  const g = gates(env);
  if (!g) return { skipped: true };
  const t0 = clock();
  const st = { sub, used: 0, d1: 0 };
  await env.DB.batch(prepBatch(env.DB));
  // Plan düşüşü okunamazsa (0018 yok ya da hata) planlı siteler bu tur kiralanmaz: HTTP kapısı gibi kapalı kalır
  let sites = g.sites;
  try { await env.DB.batch(planDropBatch(env.DB)); } catch (e) {
    sites = sites.filter(s => !PLAN_SITES.includes(s));
    if (sites.length < g.sites.length) log(JSON.stringify({ ev: "publish_plan_check", err: errText(e) }));
  }
  st.d1 += PREP_D1;
  const maxCost = Math.max(...g.platforms.map(p => COST[p]));
  const limit = Math.min(g.perRun, Math.floor(sub / maxCost), Math.floor((d1 - PREP_D1 - 1 - RELEASE_D1) / JOB_D1));
  if (limit < 1) return { leased: 0, done: [], released: 0, sub: 0, d1: st.d1 };
  st.d1++;
  const { results: jobs } = await env.DB.prepare(LEASE_SQL).bind(JSON.stringify(sites), JSON.stringify(g.platforms), limit).all();
  // RETURNING sırası tanımsız: en erken saatli iş önce denensin (süre/bütçe yetmezse geri bırakılan sonrakiler olur)
  jobs.sort((a, b) => (a.run_at === b.run_at ? a.id - b.id : a.run_at < b.run_at ? -1 : 1));
  // Sayan fetch: her dış istek bütçeden düşer; sinyal verilmemişse hazırlık zaman aşımı
  const cf = (url, init = {}) => {
    if (st.used >= st.sub) throw new Error("subrequest_budget");
    st.used++;
    return f(url, init.signal ? init : { ...init, signal: AbortSignal.timeout(PREP_TIMEOUT) });
  };
  const done = [];
  let rest = [], why = null;
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    why = clock() - t0 > deadlineMs ? "deadline"
      : st.sub - st.used < COST[job.platform] || d1 - st.d1 - RELEASE_D1 < JOB_D1 ? "budget" : null;
    if (why) { rest = jobs.slice(i); break; }
    const t1 = clock();
    const out = await runJob(env, job, cf, st, pollWait, log);
    st.d1 += 2;
    const r = await finish(env, job, out);
    log(JSON.stringify({ ev: "publish", job: job.id, platform: job.platform, from: "yayinlaniyor", to: r.to, ms: clock() - t1, code: r.code }));
    done.push({ id: job.id, to: r.to, code: r.code });
  }
  // Kirası alınıp hiç istek gitmemiş işler planlandi'ya döner (deneme sayılmaz)
  if (rest.length) {
    const ids = JSON.stringify(rest.map(j => j.id)), lease = rest[0].lease_until;
    st.d1 += RELEASE_D1;
    await env.DB.batch([
      env.DB.prepare("INSERT INTO publish_events (job_id, actor, from_state, to_state, note) SELECT id, NULL, 'yayinlaniyor', 'planlandi', ? FROM publish_jobs WHERE id IN (SELECT value FROM json_each(?)) AND state = 'yayinlaniyor' AND lease_until = ?")
        .bind(why, ids, lease),
      env.DB.prepare("UPDATE publish_jobs SET state = 'planlandi', lease_until = NULL, updated_at = datetime('now') WHERE id IN (SELECT value FROM json_each(?)) AND state = 'yayinlaniyor' AND lease_until = ?")
        .bind(ids, lease),
    ]);
  }
  return { leased: jobs.length, done, released: rest.length, sub: st.used, d1: st.d1 };
}
