// app.socialmediacorner.co taslak üretimi (A0-KARAR §1, §3-§5): POST /gen/linkedin, /gen/instagram, /gen/blog, /gen/video,
// /gen/refine, /gen/quota, /gen/event.
// /gen/instagram (A4 ISTEM-IG): kind caption|reels, isteğe bağlı marka sesi; kota, Turnstile, harcama, iade ve gen_daily
// /gen/linkedin ile ortak yoldan (produce). /gen/refine kind li|caption|reels (yoksa li).
// Bayrak GEN_ENABLED="1" + ANTHROPIC_API_KEY, GEN_SALT, TURNSTILE_SECRET + migrations/0014_gen.sql; biri yoksa 503 not_ready.
// Sayaçlar gen_usage'ta (gün Europe/Istanbul, sabit UTC+3; anahtar sha256(salt|gün|tür|değer), global 'all'), ölçüm gen_daily'de.
// Her yanıt `charged` (anon üretim hakkı düştü mü) taşır; sayaç okunduysa {left, cap, reset_at, scope} de.
// LLM sonrası yazımlar (gen_daily, iade) ctx.waitUntil ile. io.fetch testlerde sahte verilir.
// A8 stüdyo (Desktop/app-smc/A8/SOZLESME.md): POST /gen/blog (tek Markdown yazı; length short|medium|long) ve POST /gen/video
// (kind video|carousel; sahne listesi + açıklama) aynı produce yolundan, 1 anon hak. /gen/linkedin, /gen/blog, /gen/video
// isteğe bağlı `style` (0..3000, örnek metin: yalnız ses taklit edilir) alır; temizlenir, nötrlenir, <stil> bloğunda gider.
// Blog/video için refine yok. Çıktı llm.js SPECS.blog / videoSpec ile sıkı denetlenir; tutmazsa llm_fail.
// A5-4: ACCOUNTS_ENABLED="1" iken app sitesinde geçerli Bearer oturumu varsa başarılı üretim drafts'a da yazılır (saveDrafts);
// oturum yoksa/geçersizse yanıt anonimle bire bir aynı (401 yok), drafts hatası yutulur.
// A9b plan: aynı koşullarla girişli kullanıcı (account) ve users.plan varsa (migrations/0018_plans.sql) üretim aylık plan
// sayacından (gen_month, src/plans.js) düşer; anon/IP günlük hakları yerine kullanıcı günlük tavanı (GEN_USER_PER_DAY) ve global
// tavan. /gen/stock pro|enterprise'da sınırsız; demo/basic'te ömür boyu stock_trial (1) deneme görseli: arama hak kullanılana
// dek açık, hak POST /gen/stock/use ile düşer (gen_usage day STOCK_TRIAL_DAY, kind 'pt'; foto başına tekrar kaydı 'pi'). /gen/quota plan, month, stock (anahtar +
// plan ya da kullanılmamış deneme) ve deneme planında stock_trial {limit, used} taşır. 0018 yoksa anonim akış.
// A15: GEN_LOGIN_REQUIRED="1" (wrangler.toml) → oturumsuz /gen/* 401 login_required, /gen/quota plan "anon" left 0; anon/IP
// günlük hakları (GEN_PER_DAY) bu bayrakla fiilen kullanılmaz. demo planı (src/plans.js): aylık değil deneme boyunca TOPLAM
// (planCounts: created_at ayından bu yana gen_month toplamı, ay dönümünde sıfırlanmaz); deneme bitince üretim/refine
// 403 trial_ended; /gen/quota demo'da trial_ends_at + trial_ended taşır (bittiyse left 0).
// W2 (26.11) + 27.11: POST /gen/tts (ElevenLabs seslendirme, audio/mpeg; hak/rid/örnek) + GET /gen/tts/sesler; ayrıntı ttsRoute üstünde.
import {
  SYSTEM_GEN, SYSTEM_REFINE, SYSTEM_IG_CAPTION, SYSTEM_IG_REELS, SYSTEM_IG_CAPTION_REFINE, SYSTEM_IG_REELS_REFINE, SCHEMA, SCHEMA_REELS,
  SYSTEM_BLOG, SYSTEM_VIDEO, SCHEMA_BLOG, SCHEMA_VIDEO, BLOG_LENGTHS, VIDEO_KINDS, VIDEO_LENGTHS, STUDIO_MAX, withStyle, userBlog, userVideo,
  SECTORS, TONES, LANGS, OPS, ANGLES, MAX, IG_KINDS, FORMATS, CTAS, VIDEOS, ADJECTIVES, ADDRESS, EMOJI, REELS_ANGLES, IG_OPS, IG_MAX,
  clean, fold, neutralize, banMatch, userGen, userRefine, userIg, userIgRefine,
} from "./gen-prompt.js";
import { makeLlm, LlmError, SPECS, videoSpec } from "./llm.js";
import { seoRoute } from "./seo.js";
import { platformSite, bearerToken, sessionUser } from "./platform.js";
import { siteConf } from "./sites.js";
import { MONTH_KIND, KIND_NAME, planLimits, trialMonth, SES_EK } from "./plans.js";

export const genEnabled = env => env?.GEN_ENABLED === "1" && Boolean(env.ANTHROPIC_API_KEY && env.GEN_SALT && env.TURNSTILE_SECRET);

const UUID = /^[0-9a-f-]{36}$/;
const RET = ["ret0", "ret1", "ret2_7", "ret8"];
const EVENTS = ["copy_ok", "copy_fb", "share", "quote_click"];
const SRCS = ["limit", "result", "error", "cap", "top", "footer", "calendly"];
const DAILY = new Set(["ok", "fail", "refused", "busy", "refine_ok", "tok_in", "tok_out", "uniq_anon", "anon_full", "ip_full", "cap_hit",
  ...RET, "copy_ok", "copy_fb", "share", ...SRCS.map(s => "qc_" + s)]);
export const GEN_UNITS = 3, REFINE_UNITS = 1, MIN_T = 1500, EV_PER_DAY = 30;
// ISTEM-IG §3.2 madde 1: /gen/instagram gövdesi 8 KB (marka sesi)
// A8: linkedin/blog/video 12 KB (3000 karakterlik style, Türkçe 2 bayt/karakter + öbür alanlar sığsın)
const BODY_MAX = { linkedin: 12288, blog: 12288, video: 12288, instagram: 8192, refine: 16384, quota: 4096, event: 4096, stock_use: 1024, tts: 8192, seo: 4096 };
const LLM_ERR = { busy: ["llm_busy", 503], limit: ["llm_limit", 503], fail: ["llm_fail", 502], refusal: ["refused", 422] };

const json = (body, status, origin) => new Response(status === 204 ? null : JSON.stringify(body), {
  status,
  headers: { ...(status !== 204 && { "content-type": "application/json" }), ...(origin && { "access-control-allow-origin": origin, vary: "Origin" }) },
});
const fail = (error, status, origin, extra) => json({ ok: false, error, charged: false, ...extra }, status, origin);

const int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; };
export const limits = env => ({
  anon: int(env.GEN_PER_DAY, 3), ip: int(env.GEN_IP_PER_DAY, 10), cap: int(env.GEN_DAILY_CAP, 300),
  ra: int(env.GEN_REFINE_PER_DAY, 9), ri: int(env.GEN_REFINE_IP_PER_DAY, 30),
});

// Europe/Istanbul günü (sabit UTC+3) ve bir sonraki gece yarısı (21:00 UTC)
const OFFSET = 3 * 3600e3;
export const genDay = (now = Date.now()) => new Date(now + OFFSET).toISOString().slice(0, 10);
export function resetAt(now = Date.now()) {
  const d = new Date(now + OFFSET);
  d.setUTCHours(24, 0, 0, 0);
  return new Date(d.getTime() - OFFSET).toISOString();
}

// IPv6'da /64 öneki, IPv4 olduğu gibi; ham IP saklanmaz, yalnız özetin girdisi
export function ipPrefix(ip) {
  ip = String(ip || "").trim().toLowerCase();
  if (!ip.includes(":")) return ip;
  if (ip.includes(".")) return ip.slice(ip.lastIndexOf(":") + 1);
  const [h, t] = ip.split("::");
  const head = h ? h.split(":") : [], tail = t !== undefined && t ? t.split(":") : [];
  const g = t === undefined ? head : [...head, ...Array(Math.max(0, 8 - head.length - tail.length)).fill("0"), ...tail];
  return g.slice(0, 4).map(x => x.replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
export const keyOf = (env, day, kind, value) => kind === "all" ? Promise.resolve("all") : sha(`${env.GEN_SALT}|${day}|${kind}|${value}`);

// content-length yoksa ya da sınırı aşıyorsa okumadan 413; gövde bayt sayılarak okunur
async function readBody(req, max) {
  const cl = Number(req.headers.get("content-length"));
  if (!req.headers.has("content-length") || !Number.isFinite(cl) || cl > max) return { tooLarge: true };
  if (!req.body) return { body: null };
  const reader = req.body.getReader(), parts = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { try { await reader.cancel(); } catch {} return { tooLarge: true }; }
    parts.push(value);
  }
  const buf = new Uint8Array(size);
  let o = 0;
  for (const p of parts) { buf.set(p, o); o += p.byteLength; }
  try { return { body: JSON.parse(new TextDecoder().decode(buf)) }; } catch { return { body: null }; }
}

// kalan üretim: min(anon, IP, global/3); cap = günlük anon hakkı
function quota(L, n) {
  const a = L.anon - (n.anon || 0), i = L.ip - (n.ip || 0), g = Math.floor((L.cap - (n.all || 0)) / GEN_UNITS);
  const scope = a <= i && a <= g ? "anon" : i <= g ? "ip" : "global";
  return { left: Math.max(0, Math.min(a, i, g)), cap: L.anon, reset_at: resetAt(), scope };
}

async function counts(db, day, keys) {
  const ks = Object.values(keys);
  const { results } = await db.prepare(`SELECT key, n FROM gen_usage WHERE day = ? AND key IN (${ks.map(() => "?").join(", ")})`).bind(day, ...ks).all();
  const byKey = Object.fromEntries((results || []).map(r => [r.key, Number(r.n) || 0]));
  return Object.fromEntries(Object.entries(keys).map(([name, k]) => [name, byKey[k] || 0]));
}

export const UPSERT = "INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, ?, ?) ON CONFLICT(day, key) DO UPDATE SET n = gen_usage.n + excluded.n WHERE gen_usage.n + excluded.n <= ? RETURNING n";
export const DECR = "UPDATE gen_usage SET n = MAX(0, n - ?) WHERE day = ? AND key = ?";
// A9b aylık plan sayacı (0018 gen_month): aynı koşullu artış deseni; item'da month varsa bu tabloya gider
export const M_UPSERT = "INSERT INTO gen_month (month, user_id, kind, n) VALUES (?, ?, ?, ?) ON CONFLICT(month, user_id, kind) DO UPDATE SET n = gen_month.n + excluded.n WHERE gen_month.n + excluded.n <= ? RETURNING n";
export const M_DECR = "UPDATE gen_month SET n = MAX(0, n - ?) WHERE month = ? AND user_id = ? AND kind = ?";
// item.day verilirse o satır çağrının gününü değil kendi gününü kullanır (W2 /gen/tts aylık karakter bütçesi "tts:YYYY-MM")
const up = (db, day, i) => i.month ? db.prepare(M_UPSERT).bind(i.month, i.user, i.kind, i.inc, i.max) : db.prepare(UPSERT).bind(i.day || day, i.key, i.kind, i.inc, i.max);
const down = (db, day, i) => i.month ? db.prepare(M_DECR).bind(i.inc, i.month, i.user, i.kind) : db.prepare(DECR).bind(i.inc, i.day || day, i.key);

// Koşullu artışlar tek db.batch'te; satır dönmeyen varsa artanlar aynı day/key ile geri alınır.
// items: [{name, kind, key, inc, max}] (aylık: {name, month, user, kind, inc, max}) → { ok, n:{name:yeni değer}, failed:[name] }
export async function reserve(db, day, items) {
  const res = await db.batch(items.map(i => up(db, day, i)));
  const n = {}, failed = [];
  items.forEach((i, x) => { const row = res[x]?.results?.[0]; if (row) n[i.name] = Number(row.n); else failed.push(i.name); });
  if (failed.length) {
    const back = items.filter(i => n[i.name] !== undefined);
    if (back.length) await db.batch(back.map(i => down(db, day, i)));
  }
  return { ok: !failed.length, n, failed };
}

const decr = (db, day, items) => items.map(i => down(db, day, i));

// Girişli kullanıcının bu ayki sayaçları {lb, vg}; 0018 yoksa "no such table" atar
async function monthCounts(db, month, uid) {
  const { results } = await db.prepare("SELECT kind, n FROM gen_month WHERE month = ? AND user_id = ?").bind(month, uid).all();
  const m = { lb: 0, vg: 0 };
  for (const r of results || []) if (Object.hasOwn(m, r.kind)) m[r.kind] = Number(r.n) || 0;
  return m;
}
const noTable = e => /no such table/i.test(e?.message || "");

// A15 plan sayaçları: { m, off }. m = sayılan kullanım {lb, vg}; off = m'nin bu ay dışındaki payı. Demo'da deneme boyunca toplam
// (trialMonth(created_at) .. bu ay; deneme 14 gün, en çok iki ay) → ay dönümünde sıfırlanmaz; bu ayın gen_month satırının rezerv
// tavanı limit - off olur. Öbür planlarda (ya da created_at okunamazsa) yalnız bu ay, off 0. 0018 yoksa "no such table" atar.
export async function planCounts(db, month, uid, user, P) {
  const since = P?.plan === "demo" ? trialMonth(user) : null;
  if (!since || since >= month) return { m: await monthCounts(db, month, uid), off: { lb: 0, vg: 0 } };
  const { results } = await db.prepare("SELECT month, kind, n FROM gen_month WHERE user_id = ? AND month >= ? AND month <= ?").bind(uid, since, month).all();
  const m = { lb: 0, vg: 0 }, off = { lb: 0, vg: 0 };
  for (const r of results || []) {
    if (!Object.hasOwn(m, r.kind)) continue;
    const k = Number(r.n) || 0;
    m[r.kind] += k;
    if (r.month !== month) off[r.kind] += k;
  }
  return { m, off };
}
// demo deneme alanları (yalnız demo'da; öbür planların yanıtı aynen)
const trialOut = P => P?.plan === "demo" ? { trial_ends_at: P.trial_ends_at, trial_ended: P.trial_ended } : {};

// Girişli kalan: min(bu türün aylık kalanı (tür yoksa iki türün büyüğü), kullanıcı günlük tavanı, global/3).
// cap = kullanıcı günlük tavanı (reset_at günlük); aylık sayılar month'ta.
function planQuota(L, U, P, n, m, mk) {
  const rem = k => P[KIND_NAME[k]] - (m[k] || 0);
  const p = P.trial_ended ? 0 : mk ? rem(mk) : Math.max(rem("lb"), rem("vg"));
  const d = U - (n.u || 0), g = Math.floor((L.cap - (n.all || 0)) / GEN_UNITS);
  const scope = p <= d && p <= g ? "plan" : d <= g ? "user" : "global";
  return {
    left: Math.max(0, Math.min(p, d, g)), cap: U, reset_at: resetAt(), scope, plan: P.plan,
    month: { linkedin_blog: { used: m.lb || 0, limit: P.linkedin_blog }, video_gorsel: { used: m.vg || 0, limit: P.video_gorsel } },
    ...trialOut(P),
  };
}

// gen_daily tek upsert; sütun adları DAILY sabit listesinden
function daily(db, day, inc) {
  const cols = Object.keys(inc).filter(c => DAILY.has(c) && inc[c]);
  if (!cols.length) return null;
  return db.prepare(`INSERT INTO gen_daily (day, ${cols.join(", ")}) VALUES (?${", ?".repeat(cols.length)}) ON CONFLICT(day) DO UPDATE SET ${cols.map(c => `${c} = ${c} + excluded.${c}`).join(", ")}`)
    .bind(day, ...cols.map(c => inc[c]));
}

function later(ctx, p) {
  const q = p.catch(e => console.log("gen later", e?.message?.slice(0, 80)));
  if (ctx?.waitUntil) ctx.waitUntil(q); else return q;
}
const batchLater = (ctx, db, stmts) => { const s = stmts.filter(Boolean); return s.length ? later(ctx, db.batch(s)) : undefined; };

async function turnstile(env, f, token, ip) {
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const r = await f("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, ...(ip && { remoteip: ip }) }),
      signal: AbortSignal.timeout(5000),
    });
    const d = await r.json();
    if (d?.success !== true) console.log("gen bot", (d?.["error-codes"] || []).join(",").slice(0, 80));
    return d?.success === true;
  } catch (e) {
    console.log("gen siteverify", e?.name);
    return false;
  }
}

// serbest metin: §3.3 adım 2-6 (temizle, ölç); sınır aşılırsa kesilmez, null döner
function text(v, min, max) {
  if (v === undefined || v === null) v = "";
  if (typeof v !== "string") return null;
  const s = clean(v);
  return s.length >= min && s.length <= max ? s : null;
}
const pick = (v, list) => typeof v === "string" && list.includes(v.normalize("NFC")) ? v.normalize("NFC") : null;
const has = v => v !== undefined && v !== null && v !== "";
const cp = s => [...s].length;

// /gen/linkedin, /gen/blog, /gen/video ortak gövdesi. goalMax 0 ise goal okunmaz (video). style A8: 0..3000 UTF-16
// (temizlikten sonra), boş = yok. Alan sırası hata önceliğidir: json, hp, anon, topic, sector, tone, goal, lang, style, rid.
function validateGen(b, goalMax = MAX.goal) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return { field: "json" };
  if (b.hp !== undefined && b.hp !== null && b.hp !== "") return { field: "hp" };
  if (typeof b.anon !== "string" || !UUID.test(b.anon)) return { field: "anon" };
  const topic = text(b.topic, 1, MAX.topic);
  if (topic === null) return { field: "topic" };
  const sector = pick(b.sector, Object.keys(SECTORS));
  if (!sector) return { field: "sector" };
  const tone = pick(b.tone, TONES);
  if (!tone) return { field: "tone" };
  const goal = goalMax ? text(b.goal, 0, goalMax) : "";
  if (goal === null) return { field: "goal" };
  if (topic.length + goal.length > MAX.total) return { field: "topic" };
  const lang = pick(b.lang, LANGS);
  if (!lang) return { field: "lang" };
  const style = text(b.style, 0, STUDIO_MAX.style);
  if (style === null) return { field: "style" };
  if (typeof b.rid !== "string" || !UUID.test(b.rid)) return { field: "rid" };
  return { v: { anon: b.anon, topic, sector, tone, goal, lang, style, rid: b.rid, ret: RET.includes(b.ret) ? b.ret : null, t: b.t, ts: b.ts } };
}

// A8 /gen/blog: goal 0..300, length short|medium|long
function validateBlog(b) {
  const r = validateGen(b, STUDIO_MAX.blogGoal);
  if (r.field) return r;
  const length = pick(b.length, BLOG_LENGTHS);
  return length ? { v: { ...r.v, length } } : { field: "length" };
}

// A8 /gen/video: kind video|carousel, length kind'a göre ("15"|"30"|"60" saniye ya da "5"|"7"|"10" slayt); goal yok
function validateVideo(b) {
  const r = validateGen(b, 0);
  if (r.field) return r;
  const kind = pick(b.kind, VIDEO_KINDS);
  if (!kind) return { field: "kind" };
  const length = pick(b.length, VIDEO_LENGTHS[kind]);
  return length ? { v: { ...r.v, kind, length } } : { field: "length" };
}

function validateRefine(b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return { field: "json" };
  if (typeof b.anon !== "string" || !UUID.test(b.anon)) return { field: "anon" };
  // ISTEM-IG §4.1: kind yoksa li (A2 geriye uyumlu)
  const kind = has(b.kind) ? pick(b.kind, ["li", ...IG_KINDS]) : "li";
  if (!kind) return { field: "kind" };
  if (kind !== "li") return validateIgRefine(b, kind);
  const op = pick(b.op, OPS);
  if (!op) return { field: "op" };
  const tone = op === "tone" ? pick(b.tone, TONES) : null;
  if (op === "tone" && !tone) return { field: "tone" };
  const t = text(b.text, 1, MAX.text);
  if (t === null) return { field: "text" };
  const lang = pick(b.lang, LANGS);
  if (!lang) return { field: "lang" };
  let angle = null;
  if (b.angle !== undefined && b.angle !== null && b.angle !== "") { angle = pick(b.angle, ANGLES); if (!angle) return { field: "angle" }; }
  return { v: { kind, anon: b.anon, op, tone, text: t, lang, angle } };
}

// ISTEM-IG §1.2 marka sesi: serbest alanlar §3.3 adım 2-6'dan geçer ve UTF-16 ile ölçülür; aşımda kesilmez, 400 alan
// adıyla döner (ör. voice.sample). Bütün alt alanlar boşsa voice null (blok yazılmaz). filled yalnız loga gider.
const ONE_LINE = s => s.replace(/\s*\n\s*/g, " ");
const BRAND = /social[\s._-]*media[\s._-]*corner/;
function validateVoice(x) {
  if (x === undefined || x === null) return { voice: null, filled: [], size: 0 };
  if (typeof x !== "object" || Array.isArray(x)) return { field: "voice" };
  const name = text(x.name, 0, IG_MAX.name);
  // S7 önerisi: anonim modda ürün adı marka adı olarak kullanılamaz (katlanmış karşılaştırma)
  if (name === null || BRAND.test(fold(name).f)) return { field: "voice.name" };
  const audience = text(x.audience, 0, IG_MAX.audience);
  if (audience === null) return { field: "voice.audience" };
  const adjectives = [];
  if (has(x.adjectives)) {
    if (!Array.isArray(x.adjectives) || x.adjectives.length > IG_MAX.adjectives) return { field: "voice.adjectives" };
    for (const a of x.adjectives) {
      const p = pick(a, ADJECTIVES);
      if (!p) return { field: "voice.adjectives" };
      if (!adjectives.includes(p)) adjectives.push(p);
    }
  }
  const banned = [];
  if (has(x.banned)) {
    if (!Array.isArray(x.banned) || x.banned.length > IG_MAX.banned) return { field: "voice.banned" };
    for (const raw of x.banned) {
      // §3.2 madde 4: ayırıcıyla ya da satır sonuyla sahte alan kurulamaz
      if (typeof raw !== "string" || /[|\n\r\u0085\u2028\u2029]/.test(raw)) return { field: "voice.banned" };
      const s = text(raw, 1, IG_MAX.bannedItem);
      if (s === null) return { field: "voice.banned" };
      banned.push(s);
    }
  }
  const sample = text(x.sample, 0, IG_MAX.sample);
  if (sample === null) return { field: "voice.sample" };
  const address = has(x.address) ? pick(x.address, ADDRESS) : "";
  if (address === null) return { field: "voice.address" };
  const emoji = has(x.emoji) ? pick(x.emoji, EMOJI) : "";
  if (emoji === null) return { field: "voice.emoji" };
  const size = name.length + audience.length + banned.reduce((a, s) => a + s.length, 0) + sample.length;
  if (size > IG_MAX.voiceTotal) return { field: "voice" };
  const voice = { name: ONE_LINE(name), audience: ONE_LINE(audience), adjectives, banned, sample, address, emoji };
  const filled = Object.keys(voice).filter(k => voice[k].length > 0);
  return { voice: filled.length ? voice : null, filled, size };
}

// ISTEM-IG §1.1: türüne ait olmayan alan (reels + format/cta, caption + video) ve bilinmeyen sabit değer 400
function validateIg(b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return { field: "json" };
  if (has(b.hp)) return { field: "hp" };
  if (typeof b.anon !== "string" || !UUID.test(b.anon)) return { field: "anon" };
  const kind = pick(b.kind, IG_KINDS);
  if (!kind) return { field: "kind" };
  const topic = text(b.topic, 1, IG_MAX.topic);
  if (topic === null) return { field: "topic" };
  const sector = pick(b.sector, Object.keys(SECTORS));
  if (!sector) return { field: "sector" };
  const tone = pick(b.tone, TONES);
  if (!tone) return { field: "tone" };
  const lang = pick(b.lang, LANGS);
  if (!lang) return { field: "lang" };
  const cap = kind === "caption";
  if (!cap && has(b.format)) return { field: "format" };
  if (!cap && has(b.cta)) return { field: "cta" };
  if (cap && has(b.video)) return { field: "video" };
  const format = cap ? pick(b.format, FORMATS) : null;
  if (cap && !format) return { field: "format" };
  const cta = cap && has(b.cta) ? pick(b.cta, CTAS) : null;
  if (cap && has(b.cta) && !cta) return { field: "cta" };
  const video = !cap && has(b.video) ? pick(b.video, VIDEOS) : null;
  if (!cap && has(b.video) && !video) return { field: "video" };
  const { field, voice, filled, size } = validateVoice(b.voice);
  if (field) return { field };
  if (topic.length + size > IG_MAX.total) return { field: "topic" };
  if (typeof b.rid !== "string" || !UUID.test(b.rid)) return { field: "rid" };
  return { v: { anon: b.anon, kind, topic, sector, tone, lang, format, cta, video, voice, filled, rid: b.rid, ret: RET.includes(b.ret) ? b.ret : null, t: b.t, ts: b.ts } };
}

// ISTEM-IG §4.1: text ve say kod noktasıyla (üretimin §1.7 sayımı; emojili 2200'lük caption 400 almaz).
// Reels'te lengthen yok, say zorunlu; caption'da say, reels'te format gelirse 400.
function cpText(x, max) {
  const s = text(x, 1, Infinity);
  return s !== null && cp(s) <= max ? s : null;
}
function validateIgRefine(b, kind) {
  const cap = kind === "caption";
  const op = pick(b.op, IG_OPS[kind]);
  if (!op) return { field: "op" };
  const tone = op === "tone" ? pick(b.tone, TONES) : null;
  if (op === "tone" && !tone) return { field: "tone" };
  const t = cpText(b.text, cap ? IG_MAX.caption : IG_MAX.hook);
  if (t === null) return { field: "text" };
  if (cap && has(b.say)) return { field: "say" };
  const say = cap ? null : cpText(b.say, IG_MAX.say);
  if (!cap && say === null) return { field: "say" };
  if (!cap && has(b.format)) return { field: "format" };
  const format = cap && has(b.format) ? pick(b.format, FORMATS) : null;
  if (cap && has(b.format) && !format) return { field: "format" };
  const lang = pick(b.lang, LANGS);
  if (!lang) return { field: "lang" };
  let angle = null;
  if (has(b.angle)) { angle = pick(b.angle, cap ? ANGLES : REELS_ANGLES); if (!angle) return { field: "angle" }; }
  const { field, voice, filled, size } = validateVoice(b.voice);
  if (field) return { field };
  if (cp(t) + (say ? cp(say) : 0) + size > IG_MAX.refineTotal) return { field: "text" };
  return { v: { kind, anon: b.anon, op, tone, text: t, say, format, lang, angle, voice, filled } };
}

// §3.2 madde 2: marka sesinin her serbest alanı ayrı etkisizleştirilir; sabit kodlar (sıfat, hitap, emoji) dokunulmaz
const neutralVoice = x => x && { ...x, name: neutralize(x.name), audience: neutralize(x.audience), banned: x.banned.map(neutralize), sample: neutralize(x.sample) };
// §1.2: logda yalnız voice:true/false ve doldurulan alt alanların adları
const voiceLog = v => (v.voice ? "voice:true " + v.filled.join(",") : "voice:false");

// ISTEM-IG §1.7 deterministik düzeltme ve işaretler. Caption: son satırdaki hashtag'lerden yasak ifade içerenler
// silinir, kalanların 5'ten fazlası sondan silinir; gövdede yasak ifade → flags:["banned"]. Reels: text >60 ya da
// say >140 kod noktası → flags:["long_hook"] (>80/>200 llm.js'te llm_fail). Kalite sinyalleri yalnız sayı olarak loglanır.
const TAG_RE = /#[\p{L}\p{N}_]+/gu;
const PROMISE = /ucretsiz|bedava|sinirsiz|garanti|(?<!feel )\bfree\b|unlimited|guarantee/;
const URL_AT = /https?:\/\/|www\.|@[\p{L}\p{N}_.]+/u;
function fixTags(s, banned, sig) {
  const i = s.lastIndexOf("\n"), last = s.slice(i + 1);
  let keep = 0, line = "", pos = 0;
  for (const m of last.matchAll(TAG_RE)) {
    const ban = banned.length > 0 && banMatch(m[0], banned);
    if (!ban && keep < IG_MAX.hashtags) { keep++; continue; }
    sig[ban ? "tags_ban" : "tags_cut"]++;
    line += last.slice(pos, m.index);
    pos = m.index + m[0].length;
  }
  if (keep < 3) sig.few_tags++;
  if (!pos) return s;
  line = (line + last.slice(pos)).replace(/[ \t ]{2,}/g, " ").trim();
  return (s.slice(0, i + 1) + line).trimEnd() || s;
}
function igPost(drafts, v) {
  const banned = v.voice?.banned || [];
  const sig = { tags_ban: 0, tags_cut: 0, few_tags: 0, banned: 0, long_hook: 0, first_long: 0, promise: 0, brand: 0, url: 0 };
  const out = drafts.map(d => {
    const o = { ...d }, flags = [];
    if (v.kind === "caption") {
      o.text = fixTags(o.text, banned, sig);
      if (cp(o.text.split("\n")[0]) > 125) sig.first_long++;
    } else if (cp(o.text) > IG_MAX.hookTarget || cp(o.say) > IG_MAX.sayTarget) flags.push("long_hook");
    const all = v.kind === "caption" ? o.text : o.text + "\n" + o.say;
    if (banned.length && banMatch(all, banned)) flags.push("banned");
    const f = fold(all).f;
    if (PROMISE.test(f)) sig.promise++;
    if (BRAND.test(f)) sig.brand++;
    if (URL_AT.test(all)) sig.url++;
    for (const x of flags) sig[x]++;
    if (flags.length) o.flags = flags;
    return o;
  });
  console.log("gen ig post", v.kind, Object.entries(sig).filter(([, n]) => n).map(([k, n]) => k + ":" + n).join(" ") || "-");
  return out;
}

// ISTEM-IG §5.1: refine max_tokens li 1200, caption 1500, reels 800
function refineReq(v) {
  if (v.kind === "li") return {
    system: SYSTEM_REFINE, schema: SCHEMA, maxTokens: 1200, count: 1, angle: v.angle,
    user: userRefine({ op: v.op, angle: v.angle, tone: v.tone, lang: v.lang, text: neutralize(v.text) }),
  };
  const cap = v.kind === "caption";
  return {
    system: cap ? SYSTEM_IG_CAPTION_REFINE : SYSTEM_IG_REELS_REFINE, schema: cap ? SCHEMA : SCHEMA_REELS,
    maxTokens: cap ? 1500 : 800, count: 1, angle: v.angle, spec: SPECS[v.kind],
    user: userIgRefine({
      kind: v.kind, op: v.op, angle: v.angle, tone: v.tone, format: v.format, lang: v.lang, voice: neutralVoice(v.voice),
      text: neutralize(v.text), say: v.say === null ? null : neutralize(v.say),
    }),
  };
}

// style yoksa system ve user A2 ile bit bit aynı (stil bloğu ve <stil> etiketi yalnız doluysa)
const styleOf = v => (v.style ? neutralize(v.style) : "");
async function linkedin(c) {
  const { field, v } = validateGen(c.body);
  if (field) return fail("bad_input", 400, c.origin, { field });
  return produce(c, v, {
    system: withStyle(SYSTEM_GEN, v.style), schema: SCHEMA, maxTokens: 3500, count: 3,
    user: userGen({ topic: neutralize(v.topic), sector: v.sector, tone: v.tone, goal: v.goal ? neutralize(v.goal) : "", lang: v.lang, style: styleOf(v) }),
  }, undefined, { platform: "linkedin", topic: v.topic, max: MAX.topic, meta: pickMeta({ kind: "li", tone: v.tone, sector: v.sector, lang: v.lang, style: v.style ? true : null }) });
}

// A8 blog: tek yazı. max_tokens/timeout uzunluğa göre (Türkçe ~2 token/kelime + JSON kaçışları + pay); 120 sn tavan
// Worker'ın istemci beklemesinin içinde. Model kotası sayacı yok: produce'un gen_daily ok/tok_in/tok_out'u yeter.
export const BLOG_RUN = { short: { maxTokens: 3000, timeout: 60000 }, medium: { maxTokens: 4500, timeout: 90000 }, long: { maxTokens: 6500, timeout: 120000 } };
// Ortak blog isteği (/gen/blog ve A14 cms.js aynı istemi kullanır; kopya istem yok). v: {topic, sector, tone, goal?, length, lang, style?}
export const blogRequest = v => ({
  system: withStyle(SYSTEM_BLOG, v.style), schema: SCHEMA_BLOG, count: 1, spec: SPECS.blog, ...BLOG_RUN[v.length],
  user: userBlog({ topic: neutralize(v.topic), sector: v.sector, tone: v.tone, goal: v.goal ? neutralize(v.goal) : "", length: v.length, lang: v.lang, style: styleOf(v) }),
});
async function blog(c) {
  const { field, v } = validateBlog(c.body);
  if (field) return fail("bad_input", 400, c.origin, { field });
  return produce(c, v, blogRequest(v), undefined, { platform: "blog", topic: v.topic, max: MAX.topic, meta: pickMeta({ kind: "blog", tone: v.tone, sector: v.sector, lang: v.lang, length: v.length, style: v.style ? true : null }) });
}

// A8 video/carousel: tek taslak, en çok 14 sahne × (70+120+~15 q) + 700 açıklama ≈ 1700 token; 2500 pay bırakır
async function video(c) {
  const { field, v } = validateVideo(c.body);
  if (field) return fail("bad_input", 400, c.origin, { field });
  return produce(c, v, {
    system: withStyle(SYSTEM_VIDEO, v.style), schema: SCHEMA_VIDEO, count: 1, spec: videoSpec(v.kind, v.length), maxTokens: 2500, timeout: 60000,
    user: userVideo({ kind: v.kind, topic: neutralize(v.topic), sector: v.sector, tone: v.tone, length: v.length, lang: v.lang, style: styleOf(v) }),
  }, undefined, { platform: "video", topic: v.topic, max: MAX.topic, meta: pickMeta({ kind: v.kind, tone: v.tone, sector: v.sector, lang: v.lang, length: v.length, style: v.style ? true : null }) });
}

// ISTEM-IG §5.1: caption max_tokens 3000 (SCHEMA, A2 ile aynı), reels 1200 (SCHEMA_REELS)
async function instagram(c) {
  const { field, v } = validateIg(c.body);
  if (field) return fail("bad_input", 400, c.origin, { field });
  const cap = v.kind === "caption";
  console.log("gen ig", v.kind, voiceLog(v));
  return produce(c, v, {
    system: cap ? SYSTEM_IG_CAPTION : SYSTEM_IG_REELS, schema: cap ? SCHEMA : SCHEMA_REELS,
    maxTokens: cap ? 3000 : 1200, count: 3, spec: SPECS[v.kind],
    user: userIg({
      kind: v.kind, topic: neutralize(v.topic), sector: v.sector, tone: v.tone, format: v.format, cta: v.cta, video: v.video,
      lang: v.lang, voice: neutralVoice(v.voice),
    }),
  }, d => igPost(d, v), {
    platform: "instagram", topic: v.topic, max: IG_MAX.topic,
    meta: pickMeta({ kind: v.kind, tone: v.tone, sector: v.sector, lang: v.lang, format: v.format, cta: v.cta, video: v.video, voice: Boolean(v.voice) }),
  });
}

// A5-4 taslak geçmişi (migrations/0017_accounts.sql drafts; okuma/silme/dışa aktarma src/platform.js ACCT). Başarılı üretim
// yalnız şu üçü birlikteyse yazılır: ACCOUNTS_ENABLED "1"; origin'in hesap sitesinin uç listesinde GET /app/drafts var
// (src/sites.js APP_ROUTES: yalnız app.socialmediacorner.co); Authorization: Bearer geçerli oturum (platform.js sessionUser).
// Biri eksikse ya da jeton geçersizse anonim akış bit bit aynı: 401 yok, yanıtta draft_ids yok. Üretim bir satır başına
// bir varyant (linkedin/instagram 3, refine/blog/video 1); reels gövdesi "kanca\n\nsöz", blog "başlık\n\nMarkdown",
// video/carousel sahne satırları ("metin — alt yazı") + "\n\n" + açıklama; meta'ya başlık/sahne/style metni girmez. meta yalnız sabit listeli kodlar (tür, açı,
// ton, dil, sektör, biçim, işaretler); jeton, IP, e-posta, anon kimliği ve marka sesi metni girmez. Yazım hatası (0017 yok,
// D1) yutulur, konsola tek satır; üretim yanıtı yine 200.
const DRAFT_SQL = "INSERT INTO drafts (user_id, site, platform, topic, body, meta) VALUES (?, ?, ?, ?, ?, ?) RETURNING id";
// CHECK migrations/0020_drafts_3gun.sql ile blog/video'yu da kabul eder (karusel video, reels instagram satırı; ayrım meta.kind).
// 0020 uygulanmadan blog/video INSERT'i CHECK'e takılır, aşağıdaki catch yutar (draft_ids yok). Liste platform.js DRAFT_PLATFORMS ile aynı.
// Satırlar 3 gün saklanır (platform.js DRAFT_KEEP_DAYS; saatlik cron siler).
const DRAFT_DB = ["linkedin", "instagram", "blog", "video"];
// Sahne satırı tek satır: ilk "\n\n" sahnelerle açıklamayı ayırır (kuyruk ?taslak= açıklamayı bu ayraçtan alır, studyo-kuyruk.js taslakOn).
const oneLine = v => String(v ?? "").replace(/\s+/g, " ").trim();
const sceneLine = x => (oneLine(x.sub) ? `${oneLine(x.text)} — ${oneLine(x.sub)}` : oneLine(x.text));
export const draftBody = d => Array.isArray(d.scenes) ? `${d.scenes.map(sceneLine).join("\n")}\n\n${d.caption}`
  : typeof d.meta === "string" ? `${d.title}\n\n${d.text}` : typeof d.say === "string" ? `${d.text}\n\n${d.say}` : d.text;
// Girişli kullanıcı: yukarıdaki üç koşul + sessionUser. { user, site, P } (P = planLimits: 0018 yoksa null) ya da null.
// İstek başına bir kez sorulur (c.acct); oturum sorgusu hatası yutulur → anonim.
async function account(c) {
  if (c.acct !== undefined) return c.acct;
  c.acct = null;
  const { env, origin, token } = c;
  if (env.ACCOUNTS_ENABLED !== "1" || !token) return null;
  try {
    const site = platformSite(env, origin);
    if (!site || !siteConf(site).routes?.includes("GET /app/drafts")) return null;
    const user = await sessionUser(env, token, site);
    if (user) c.acct = { user, site, P: planLimits(user) };
  } catch (e) {
    console.log("gen acct", e?.message?.slice(0, 80));
  }
  return c.acct;
}

async function saveDrafts(c, save, drafts) {
  const { env, db, token } = c;
  if (!save || env.ACCOUNTS_ENABLED !== "1" || !token || !DRAFT_DB.includes(save.platform)) return null;
  try {
    const a = await account(c);
    if (!a) return null;
    const { user, site } = a;
    const topic = String(save.topic || "").slice(0, save.max);
    const res = await db.batch(drafts.map(d => db.prepare(DRAFT_SQL).bind(user.id, site, save.platform, topic, draftBody(d),
      JSON.stringify({ ...save.meta, angle: d.angle, ...(d.flags && { flags: d.flags }) }))));
    return res.map(r => Number(r.results[0].id));
  } catch (e) {
    console.log("gen drafts", e?.message?.slice(0, 80));
    return null;
  }
}
const pickMeta = o => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== null && x !== undefined && x !== ""));

// Üretim uçlarının ortak yolu (A0 §3-§5): yavaşlık, sayaç okuma, Turnstile, ayırma, LLM, gen_daily, iade. Sayaçlar
// (anon/ip/all/rid, GEN_UNITS) ve gen_daily sütunları iki uçta ortak. req makeLlm().generate'e aynen gider; post
// başarılı taslakları yanıttan önce işler (atarsa llm_fail yoluna düşer).
async function produce(c, v, req, post = d => d, save) {
  const { env, db, origin, ctx, io, ip } = c;
  if (!Number.isFinite(v.t) || v.t < MIN_T) return fail("slow_down", 429, origin);
  const a = MONTH_KIND[save?.platform] ? await account(c) : null;
  if (a?.P) {
    const res = await producePlan(c, v, req, post, save, a);
    if (res) return res;
  }

  const L = limits(env), day = genDay();
  const [anonK, ipK, allK, ridK] = await Promise.all([
    keyOf(env, day, "anon", v.anon), keyOf(env, day, "ip", ipPrefix(ip)), keyOf(env, day, "all"), keyOf(env, day, "rid", `${v.anon}:${v.rid}`),
  ]);
  const n = await counts(db, day, { anon: anonK, ip: ipK, all: allK, rid: ridK });
  // aynı rid ile 1 tekrar: anon ve IP'den düşmez, global'den düşer
  const retry = n.rid === 1;
  const full = !retry && n.anon + 1 > L.anon ? "anon" : !retry && n.ip + 1 > L.ip ? "ip" : n.all + GEN_UNITS > L.cap ? "global" : null;
  if (full) return fail("limit", 429, origin, { ...quota(L, n), scope: full });

  if (!(await turnstile(env, io.fetch, v.ts, ip))) return fail("bot", 403, origin);

  const it = {
    anon: { name: "anon", kind: "anon", key: anonK, inc: 1, max: L.anon },
    ip: { name: "ip", kind: "ip", key: ipK, inc: 1, max: L.ip },
    all: { name: "all", kind: "all", key: allK, inc: GEN_UNITS, max: L.cap },
    rid: { name: "rid", kind: "rid", key: ridK, inc: 1, max: 2 },
  };
  let mode = retry ? "retry" : "normal";
  const plan = m => m === "retry" ? [it.all, it.rid] : [it.anon, it.ip, it.all, ...(n.rid < 2 ? [it.rid] : [])];
  let r = await reserve(db, day, plan(mode));
  // eşzamanlı aynı rid hakkını başkası aldıysa rid'siz, normal ücretle bir kez daha dene
  if (!r.ok && r.failed.length === 1 && r.failed[0] === "rid") { mode = "normal"; n.rid = 2; r = await reserve(db, day, plan(mode)); }
  if (!r.ok) {
    const top = { anon: L.anon, ip: L.ip, all: L.cap };
    const cur = name => r.failed.includes(name) ? top[name] : r.n[name] !== undefined ? r.n[name] - it[name].inc : n[name];
    const scope = r.failed.includes("anon") ? "anon" : r.failed.includes("ip") ? "ip" : "global";
    return fail("limit", 429, origin, { ...quota(L, { anon: cur("anon"), ip: cur("ip"), all: cur("all") }), scope });
  }
  const charged = mode === "normal";
  const after = { anon: charged ? r.n.anon : n.anon, ip: charged ? r.n.ip : n.ip, all: r.n.all };
  const reserved = plan(mode);

  let out, err;
  try {
    const o = await makeLlm(env, io.fetch).generate(req);
    out = { ...o, drafts: post(o.drafts) };
  } catch (e) {
    err = e instanceof LlmError ? e : new LlmError("fail", e?.message?.slice(0, 60) || "error");
  }

  if (out) {
    const inc = { ok: 1, tok_in: out.usage.input_tokens, tok_out: out.usage.output_tokens };
    if (charged && after.anon === 1) { inc.uniq_anon = 1; if (v.ret) inc[v.ret] = 1; }
    if (charged && after.anon === L.anon) inc.anon_full = 1;
    if (charged && after.ip === L.ip) inc.ip_full = 1;
    if (L.cap - (after.all - GEN_UNITS) >= GEN_UNITS && L.cap - after.all < GEN_UNITS) inc.cap_hit = 1;
    await batchLater(ctx, db, [daily(db, day, inc)]);
    const ids = await saveDrafts(c, save, out.drafts);
    return json({ ok: true, drafts: out.drafts, charged, ...quota(L, after), ...(ids && { draft_ids: ids }) }, 200, origin);
  }

  const [code, status] = LLM_ERR[err.kind] || LLM_ERR.fail;
  const inc = { [err.kind === "refusal" ? "refused" : err.kind === "fail" ? "fail" : "busy"]: 1, tok_in: err.usage?.input_tokens || 0, tok_out: err.usage?.output_tokens || 0 };
  let refund = [];
  if (err.kind === "busy" || err.kind === "limit") {
    // faturalanmamış: ayrılan her şey (rid dahil) iade
    refund = reserved;
  } else if (charged) {
    // faturalanmış olabilir: global ve IP iade edilmez; anon yalnız günün ilk böyle olayında (rf satırı)
    try {
      const rfK = await keyOf(env, day, "rf", v.anon);
      const res = await db.prepare(UPSERT).bind(day, rfK, "rf", 1, 1).all();
      if (res?.results?.length) refund = [it.anon];
    } catch (e) { console.log("gen rf", e?.message?.slice(0, 80)); }
  }
  for (const i of refund) if (after[i.name] !== undefined) after[i.name] = Math.max(0, after[i.name] - i.inc);
  await batchLater(ctx, db, [...decr(db, day, refund), daily(db, day, inc)]);
  const stillCharged = charged && !refund.includes(it.anon);
  return json({ ok: false, error: code, charged: stillCharged, ...quota(L, after) }, status, origin);
}

// A9b girişli üretim (account + users.plan). Anon/IP günlük deneme sayaçları UYGULANMAZ (ofis IP'si planı kilitlemesin);
// yerine aylık plan sayacı (gen_month lb|vg, src/plans.js) + kullanıcı başına günlük kötüye kullanım tavanı (gen_usage kind 'u',
// GEN_USER_PER_DAY, varsayılan 40) + global tavan (all, GEN_DAILY_CAP) aynen. Turnstile, rid tekrarı (rid anahtarı kullanıcıya
// bağlı) ve iade kuralları anonimle aynı; aylık sayaç iadeye dahil. charged = aylık hak düştü mü. 0018 yarım (gen_month yok)
// ise null döner, çağıran anonim akışa düşer (üretim kırılmaz). gen_daily'de anon'a özgü ölçümler (uniq_anon, anon/ip_full) yazılmaz.
async function producePlan(c, v, req, post, save, a) {
  const { env, db, origin, ctx, io, ip } = c;
  const L = limits(env), U = int(env.GEN_USER_PER_DAY, 40), day = genDay(), month = day.slice(0, 7);
  const uid = a.user.id, P = a.P, mk = MONTH_KIND[save.platform], mmax = P[KIND_NAME[mk]];
  // A15: demo süresi dolduysa sayaç/Turnstile/LLM yok
  if (P.trial_ended) return fail("trial_ended", 403, origin, { plan: P.plan, ...trialOut(P) });
  let m, off;
  try { ({ m, off } = await planCounts(db, month, uid, a.user, P)); } catch (e) { if (noTable(e)) return null; throw e; }
  const [uK, allK, ridK] = await Promise.all([keyOf(env, day, "u", uid), keyOf(env, day, "all"), keyOf(env, day, "rid", `u:${uid}:${v.rid}`)]);
  const n = await counts(db, day, { u: uK, all: allK, rid: ridK });
  const pq = (nn, mo) => planQuota(L, U, P, nn, { ...m, [mk]: mo }, mk);
  const limit = (scope, nn, mo) => fail("limit", 429, origin, { ...pq(nn, mo), scope, ...(scope === "plan" && { kind: KIND_NAME[mk] }) });
  // aynı rid ile 1 tekrar: aylık hak ve kullanıcı günlük tavanından düşmez, global'den düşer
  const retry = n.rid === 1;
  const full = !retry && m[mk] + 1 > mmax ? "plan" : !retry && n.u + 1 > U ? "user" : n.all + GEN_UNITS > L.cap ? "global" : null;
  if (full) return limit(full, n, m[mk]);

  if (!(await turnstile(env, io.fetch, v.ts, ip))) return fail("bot", 403, origin);

  const it = {
    mo: { name: "mo", month, user: uid, kind: mk, inc: 1, max: mmax - off[mk] },
    u: { name: "u", kind: "u", key: uK, inc: 1, max: U },
    all: { name: "all", kind: "all", key: allK, inc: GEN_UNITS, max: L.cap },
    rid: { name: "rid", kind: "rid", key: ridK, inc: 1, max: 2 },
  };
  let mode = retry ? "retry" : "normal";
  const tasi = md => md === "retry" ? [it.all, it.rid] : [it.mo, it.u, it.all, ...(n.rid < 2 ? [it.rid] : [])];
  let r = await reserve(db, day, tasi(mode));
  if (!r.ok && r.failed.length === 1 && r.failed[0] === "rid") { mode = "normal"; n.rid = 2; r = await reserve(db, day, tasi(mode)); }
  if (!r.ok) {
    const top = { mo: mmax, u: U, all: L.cap }, base = { mo: m[mk], u: n.u, all: n.all };
    const cur = name => r.failed.includes(name) ? top[name] : r.n[name] !== undefined ? r.n[name] - it[name].inc + (name === "mo" ? off[mk] : 0) : base[name];
    const scope = r.failed.includes("mo") ? "plan" : r.failed.includes("u") ? "user" : "global";
    return limit(scope, { u: cur("u"), all: cur("all") }, cur("mo"));
  }
  const charged = mode === "normal";
  const after = { mo: charged ? r.n.mo + off[mk] : m[mk], u: charged ? r.n.u : n.u, all: r.n.all };
  const reserved = tasi(mode);

  let out, err;
  try {
    const o = await makeLlm(env, io.fetch).generate(req);
    out = { ...o, drafts: post(o.drafts) };
  } catch (e) {
    err = e instanceof LlmError ? e : new LlmError("fail", e?.message?.slice(0, 60) || "error");
  }

  if (out) {
    const inc = { ok: 1, tok_in: out.usage.input_tokens, tok_out: out.usage.output_tokens };
    if (L.cap - (after.all - GEN_UNITS) >= GEN_UNITS && L.cap - after.all < GEN_UNITS) inc.cap_hit = 1;
    await batchLater(ctx, db, [daily(db, day, inc)]);
    const ids = await saveDrafts(c, save, out.drafts);
    return json({ ok: true, drafts: out.drafts, charged, ...pq(after, after.mo), ...(ids && { draft_ids: ids }) }, 200, origin);
  }

  const [code, status] = LLM_ERR[err.kind] || LLM_ERR.fail;
  const inc = { [err.kind === "refusal" ? "refused" : err.kind === "fail" ? "fail" : "busy"]: 1, tok_in: err.usage?.input_tokens || 0, tok_out: err.usage?.output_tokens || 0 };
  let refund = [];
  if (err.kind === "busy" || err.kind === "limit") {
    // faturalanmamış: ayrılan her şey (aylık, rid dahil) iade
    refund = reserved;
  } else if (charged) {
    // faturalanmış olabilir: global iade edilmez; aylık hak + kullanıcı günlük yalnız günün ilk böyle olayında (rf satırı, kullanıcıya bağlı)
    try {
      const rfK = await keyOf(env, day, "rf", `u:${uid}`);
      const res = await db.prepare(UPSERT).bind(day, rfK, "rf", 1, 1).all();
      if (res?.results?.length) refund = [it.mo, it.u];
    } catch (e) { console.log("gen rf", e?.message?.slice(0, 80)); }
  }
  for (const i of refund) if (after[i.name] !== undefined) after[i.name] = Math.max(0, after[i.name] - i.inc);
  await batchLater(ctx, db, [...decr(db, day, refund), daily(db, day, inc)]);
  const stillCharged = charged && !refund.includes(it.mo);
  return json({ ok: false, error: code, charged: stillCharged, ...pq(after, after.mo) }, status, origin);
}

async function refine(c) {
  const { env, db, body, origin, ctx, io, ip } = c;
  const { field, v } = validateRefine(body);
  if (field) return fail("bad_input", 400, origin, { field });
  if (v.kind !== "li") console.log("gen ig refine", v.kind, voiceLog(v));

  const a = await account(c);
  if (a?.P) {
    const res = await refinePlan(c, v, a);
    if (res) return res;
  }
  const L = limits(env), day = genDay(), ipv = ipPrefix(ip);
  const [anonK, ipK, allK, raK, riK] = await Promise.all([
    keyOf(env, day, "anon", v.anon), keyOf(env, day, "ip", ipv), keyOf(env, day, "all"), keyOf(env, day, "ra", v.anon), keyOf(env, day, "ri", ipv),
  ]);
  const n = await counts(db, day, { anon: anonK, ip: ipK, all: allK, ra: raK, ri: riK });
  // o gün en az 1 üretim şartı
  if (n.anon < 1) return fail("bad_input", 400, origin, { field: "anon", ...quota(L, n) });
  const full = n.ra + 1 > L.ra ? "anon" : n.ri + 1 > L.ri ? "ip" : n.all + REFINE_UNITS > L.cap ? "global" : null;
  if (full) return fail("limit", 429, origin, { ...quota(L, n), scope: full });

  const items = [
    { name: "ra", kind: "ra", key: raK, inc: 1, max: L.ra },
    { name: "ri", kind: "ri", key: riK, inc: 1, max: L.ri },
    { name: "all", kind: "all", key: allK, inc: REFINE_UNITS, max: L.cap },
  ];
  const r = await reserve(db, day, items);
  if (!r.ok) {
    const scope = r.failed.includes("ra") ? "anon" : r.failed.includes("ri") ? "ip" : "global";
    return fail("limit", 429, origin, { ...quota(L, n), scope });
  }
  const after = { anon: n.anon, ip: n.ip, all: r.n.all };

  let out, err;
  try {
    const o = await makeLlm(env, io.fetch).generate(refineReq(v));
    out = v.kind === "li" ? o : { ...o, drafts: igPost(o.drafts, v) };
  } catch (e) {
    err = e instanceof LlmError ? e : new LlmError("fail", e?.message?.slice(0, 60) || "error");
  }
  if (out) {
    const inc = { refine_ok: 1, tok_in: out.usage.input_tokens, tok_out: out.usage.output_tokens };
    if (L.cap - (after.all - REFINE_UNITS) >= GEN_UNITS && L.cap - after.all < GEN_UNITS) inc.cap_hit = 1;
    await batchLater(ctx, db, [daily(db, day, inc)]);
    // Refine sonucu da geçmişe yeni satır olur (kullanıcının kopyaladığı çoğu zaman son hâli); konu gövdede yok, boş kalır
    const ids = await saveDrafts(c, {
      platform: v.kind === "li" ? "linkedin" : "instagram", topic: "", max: 0,
      meta: pickMeta({ kind: v.kind, op: v.op, tone: v.tone, format: v.format, lang: v.lang }),
    }, out.drafts);
    return json({ ok: true, drafts: out.drafts, charged: false, ...quota(L, after), ...(ids && { draft_ids: ids }) }, 200, origin);
  }
  const [code, status] = LLM_ERR[err.kind] || LLM_ERR.fail;
  // refine üretim hakkı düşürmez; faturalanmamış hatada üç sayaç iade, diğerinde iade yok
  const refund = err.kind === "busy" || err.kind === "limit" ? items : [];
  if (refund.length) after.all = Math.max(0, after.all - REFINE_UNITS);
  await batchLater(ctx, db, [...decr(db, day, refund), daily(db, day, { tok_in: err.usage?.input_tokens || 0, tok_out: err.usage?.output_tokens || 0 })]);
  return json({ ok: false, error: code, charged: false, ...quota(L, after) }, status, origin);
}

// A9b girişli refine: aylık plandan DÜŞMEZ (plan "taslak üretimi" sayar; refine var olan taslağı düzeltir, A9.md'de ayrı hak
// yok, ayrıca düşseydi kullanıcı düzeltmekten kaçınırdı). Sınırlar aynen: GEN_REFINE_PER_DAY ('ra') + global (REFINE_UNITS).
// Fark: 'ra' anahtarı anon kimliği yerine kullanıcıya bağlı (cihaz değiştirince sıfırlanmasın) ve IP sayacı ('ri') uygulanmaz
// (üretimdeki gibi ofis IP'si planı kilitlemesin; kötüye kullanımı kullanıcı başına 'ra' sınırlar). Ön şart: o gün en az bir
// üretim (girişli 'u' ya da aynı tarayıcıdan anonim). 0018 yarımsa null → anonim refine.
async function refinePlan(c, v, a) {
  const { env, db, origin, ctx, io } = c;
  const L = limits(env), U = int(env.GEN_USER_PER_DAY, 40), day = genDay(), uid = a.user.id;
  if (a.P.trial_ended) return fail("trial_ended", 403, origin, { plan: a.P.plan, ...trialOut(a.P) });
  let m;
  try { ({ m } = await planCounts(db, day.slice(0, 7), uid, a.user, a.P)); } catch (e) { if (noTable(e)) return null; throw e; }
  const [uK, anonK, allK, raK] = await Promise.all([
    keyOf(env, day, "u", uid), keyOf(env, day, "anon", v.anon), keyOf(env, day, "all"), keyOf(env, day, "ra", `u:${uid}`),
  ]);
  const n = await counts(db, day, { u: uK, anon: anonK, all: allK, ra: raK });
  const pq = nn => planQuota(L, U, a.P, nn, m);
  if (n.u < 1 && n.anon < 1) return fail("bad_input", 400, origin, { field: "anon", ...pq(n) });
  const full = n.ra + 1 > L.ra ? "user" : n.all + REFINE_UNITS > L.cap ? "global" : null;
  if (full) return fail("limit", 429, origin, { ...pq(n), scope: full });

  const items = [
    { name: "ra", kind: "ra", key: raK, inc: 1, max: L.ra },
    { name: "all", kind: "all", key: allK, inc: REFINE_UNITS, max: L.cap },
  ];
  const r = await reserve(db, day, items);
  if (!r.ok) return fail("limit", 429, origin, { ...pq(n), scope: r.failed.includes("ra") ? "user" : "global" });
  const after = { u: n.u, all: r.n.all };

  let out, err;
  try {
    const o = await makeLlm(env, io.fetch).generate(refineReq(v));
    out = v.kind === "li" ? o : { ...o, drafts: igPost(o.drafts, v) };
  } catch (e) {
    err = e instanceof LlmError ? e : new LlmError("fail", e?.message?.slice(0, 60) || "error");
  }
  if (out) {
    const inc = { refine_ok: 1, tok_in: out.usage.input_tokens, tok_out: out.usage.output_tokens };
    if (L.cap - (after.all - REFINE_UNITS) >= GEN_UNITS && L.cap - after.all < GEN_UNITS) inc.cap_hit = 1;
    await batchLater(ctx, db, [daily(db, day, inc)]);
    const ids = await saveDrafts(c, {
      platform: v.kind === "li" ? "linkedin" : "instagram", topic: "", max: 0,
      meta: pickMeta({ kind: v.kind, op: v.op, tone: v.tone, format: v.format, lang: v.lang }),
    }, out.drafts);
    return json({ ok: true, drafts: out.drafts, charged: false, ...pq(after), ...(ids && { draft_ids: ids }) }, 200, origin);
  }
  const [code, status] = LLM_ERR[err.kind] || LLM_ERR.fail;
  const refund = err.kind === "busy" || err.kind === "limit" ? items : [];
  if (refund.length) after.all = Math.max(0, after.all - REFINE_UNITS);
  await batchLater(ctx, db, [...decr(db, day, refund), daily(db, day, { tok_in: err.usage?.input_tokens || 0, tok_out: err.usage?.output_tokens || 0 })]);
  return json({ ok: false, error: code, charged: false, ...pq(after) }, status, origin);
}

async function quotaRoute(c) {
  const { env, db, body, origin, ip } = c;
  if (!body || typeof body.anon !== "string" || !UUID.test(body.anon)) return fail("bad_input", 400, origin, { field: "anon" });
  const L = limits(env), day = genDay();
  // A9b: girişli + plan → kullanıcı sayaçları, plan, month; stock = anahtar var VE plan izin veriyor (anonimde false)
  const a = await account(c);
  if (a?.P) {
    let m = null;
    try { ({ m } = await planCounts(db, day.slice(0, 7), a.user.id, a.user, a.P)); } catch (e) { if (!noTable(e)) throw e; }
    if (m) {
      const [uK, allK] = await Promise.all([keyOf(env, day, "u", a.user.id), keyOf(env, day, "all")]);
      const n = await counts(db, day, { u: uK, all: allK });
      const t = await stockTrial(c, a);
      const stock = Boolean(env.PEXELS_API_KEY) && (a.P.stock || Boolean(t && t.used < t.limit));
      // 27.11 seslendirme hakkı {limit, used, ek, kalan, reset_at}: yalnız POST /gen/tts uç listesinde olan sitede
      let ses = null;
      if (siteConf(a.site).routes?.includes("POST /gen/tts")) {
        try { ses = await sesDurum(db, a.user.id, a.P); } catch (e) { if (!noTable(e)) throw e; }
      }
      return json({ ok: true, charged: false, ...planQuota(L, int(env.GEN_USER_PER_DAY, 40), a.P, n, m), stock, ...(t && { stock_trial: trialView(t) }), ...(ses && { seslendirme: ses }) }, 200, origin);
    }
  }
  const [anonK, ipK, allK] = await Promise.all([keyOf(env, day, "anon", body.anon), keyOf(env, day, "ip", ipPrefix(ip)), keyOf(env, day, "all")]);
  const n = await counts(db, day, { anon: anonK, ip: ipK, all: allK });
  return json({ ok: true, charged: false, ...quota(L, n), plan: "anon", stock: false }, 200, origin);
}

async function event(c) {
  const { env, db, body, origin } = c;
  if (!body || typeof body.anon !== "string" || !UUID.test(body.anon)) return fail("bad_input", 400, origin, { field: "anon" });
  if (!EVENTS.includes(body.kind)) return fail("bad_input", 400, origin, { field: "kind" });
  const src = body.src === undefined || body.src === null || body.src === "" ? null : SRCS.includes(body.src) ? body.src : false;
  if (src === false || (body.kind === "quote_click" && !src)) return fail("bad_input", 400, origin, { field: "src" });
  const day = genDay(), qc = body.kind === "quote_click";
  const keys = { anon: await keyOf(env, day, "anon", body.anon), ev: await keyOf(env, day, "ev", body.anon) };
  if (qc) keys.qc = await keyOf(env, day, "qc", `${body.anon}:${src}`);
  const n = await counts(db, day, keys);
  // yalnız o gün üretim yapmış anon; günde ≤30 olay; quote_click anon+src başına günde 1
  if (n.anon < 1 || n.ev >= EV_PER_DAY || (qc && n.qc >= 1)) return json(null, 204, origin);
  const items = [{ name: "ev", kind: "ev", key: keys.ev, inc: 1, max: EV_PER_DAY }, ...(qc ? [{ name: "qc", kind: "qc", key: keys.qc, inc: 1, max: 1 }] : [])];
  const res = await db.batch(items.map(i => db.prepare(UPSERT).bind(day, i.key, i.kind, i.inc, i.max)));
  if (res.every(x => x?.results?.length)) {
    const stmt = daily(db, day, { [qc ? "qc_" + src : body.kind]: 1 });
    if (stmt) await stmt.run();
  }
  return json(null, 204, origin);
}

// /gen/stock (GET): Pexels fotoğraf araması; kullanıcı Stüdyo'da sahneye görseli kendi seçer. Anahtar yalnız sunucuda
// (PEXELS_API_KEY secret); yoksa 503 not_ready. Oturumsuz (Bearer yok/geçersiz, ACCOUNTS kapalı) → 401 login_required;
// A9b: girişli ama plan pro|enterprise değil (ya da 0018 yok) → 403 plan {need:"pro"}; 25.11: demo/basic deneme hakkı
// (stock_trial) kullanılmamışsa arama açık, kullanıldıysa 403 plan {need:"pro", trial_used:true}. Arama hak düşürmez; kullanıcı, IP ve günlük
// toplam sayaçla sınırlı (su / st / sa). lang=tr|en → Pexels locale (tr-TR / en-US): Türkçe konularda daha iyi sonuç.
// Yanıt ince: yalnız kimlik, boyut, alt, fotoğrafçı, Pexels sayfası ve src.medium/large/large2x (yalnız images.pexels.com);
// üst akış hatası ayrıntısız 502; Pexels'in kendi oran sınırı (429) → 429 limit {scope:"global"}. Üst akış başarısızsa sayaçlar
// iade edilir ("Tekrar dene" hak yemez). Günlük toplam varsayılanı STOCK_DAY_MAX: Pexels varsayılan kotası 200/saat, 20.000/ay
// (27.11: saatlik sh/sk sayaçları da var, bkz. stockRoute; 429 yanıtında saatlik tavansa per:"hour");
// cms blog kapakları da aynı anahtar ve aynı "sa" sayacıyla çalışır (600 × 30 = 18.000 < 20.000).
export const STOCK_URL = "https://api.pexels.com/v1/search";
const STOCK_ORIENT = ["landscape", "portrait", "square"];
const STOCK_SRC = ["large2x", "large", "medium"];
const STOCK_LOCALE = { tr: "tr-TR", en: "en-US" };
export const STOCK_PER_PAGE = 15, STOCK_TIMEOUT = 8000, STOCK_DAY_MAX = 600;
const stockSrc = u => typeof u === "string" && /^https:\/\/images\.pexels\.com\//.test(u) ? u : null;
const stockLink = u => typeof u === "string" && /^https:\/\/(www\.)?pexels\.com\//.test(u) ? u : null;
export function stockPhoto(p) {
  if (!p || typeof p !== "object" || !Number.isFinite(p.id) || !p.src || typeof p.src !== "object") return null;
  const src = {};
  for (const k of STOCK_SRC) { const u = stockSrc(p.src[k]); if (u) src[k] = u; }
  if (!src.medium && !src.large) return null;
  const str = (v, m) => typeof v === "string" ? v.slice(0, m) : "";
  return {
    id: p.id, width: Number(p.width) || 0, height: Number(p.height) || 0, alt: str(p.alt, 300),
    photographer: str(p.photographer, 120), photographer_url: stockLink(p.photographer_url), url: stockLink(p.url), src,
  };
}
// 26.11 ?type=video → Pexels video araması (STOCK_VIDEO_URL; aynı anahtar, aynı plan kapısı, aynı su/st/sa sayaçları ve iade).
// stockVideo yalnız videos.pexels.com mp4 dosyalarını geçirir; 720p/1080p (kısa kenar) içinden hedef orana (orientation;
// yoksa videonun kendi oranı) en yakın olan seçilir, eşitlikte 1080p. Poster yalnız images.pexels.com. Yanıt {videos} döner.
export const STOCK_VIDEO_URL = "https://api.pexels.com/videos/search";
const STOCK_TYPES = ["photo", "video"];
const STOCK_RATIO = { landscape: 16 / 9, portrait: 9 / 16, square: 1 };
const stockVidSrc = u => typeof u === "string" && /^https:\/\/videos\.pexels\.com\/[^\s"'<>\\]+$/.test(u) ? u : null;
export function stockVideo(v, orientation) {
  if (!v || typeof v !== "object" || !Number.isFinite(v.id) || !Array.isArray(v.video_files)) return null;
  const W = Number(v.width) || 0, H = Number(v.height) || 0;
  const want = STOCK_RATIO[orientation] || (W && H ? W / H : 9 / 16);
  const files = v.video_files.filter(f => f && typeof f === "object" && stockVidSrc(f.link)
    && (!f.file_type || f.file_type === "video/mp4") && Number(f.width) > 0 && Number(f.height) > 0);
  const short = f => Math.min(Number(f.width), Number(f.height));
  const off = f => Math.abs(Math.log(Number(f.width) / Number(f.height) / want));
  const hd = files.filter(f => short(f) === 720 || short(f) === 1080);
  // 720/1080 yoksa kısa kenarı ≤ 1080 olan en büyük dosya (4K indirmesi tarayıcıyı yorar), o da yoksa video düşer
  const pool = hd.length ? hd : files.filter(f => short(f) <= 1080).sort((a, b) => short(b) - short(a)).slice(0, 1);
  const f = pool.sort((a, b) => off(a) - off(b) || short(b) - short(a))[0];
  if (!f) return null;
  const str = (x, m) => typeof x === "string" ? x.slice(0, m) : "";
  const user = v.user && typeof v.user === "object" ? v.user : {};
  return {
    id: v.id, width: W, height: H, duration: Number(v.duration) || 0, poster: stockSrc(v.image), url: stockLink(v.url),
    user: str(user.name, 120), user_url: stockLink(user.url),
    src: f.link, file: { width: Number(f.width), height: Number(f.height), quality: str(f.quality, 10), fps: Number(f.fps) || 0 },
  };
}
async function stockRoute(c) {
  const { env, db, origin, ip, query, io } = c;
  const type = query.get("type") || "photo";
  if (!STOCK_TYPES.includes(type)) return fail("bad_input", 400, origin, { field: "type" });
  const q = (query.get("q") || "").normalize("NFC").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!q || cp(q) > 100) return fail("bad_input", 400, origin, { field: "q" });
  const o = query.get("orientation");
  if (o && !STOCK_ORIENT.includes(o)) return fail("bad_input", 400, origin, { field: "orientation" });
  const pg = query.get("page");
  const page = pg == null || pg === "" ? 1 : /^\d{1,3}$/.test(pg) && +pg >= 1 && +pg <= 100 ? +pg : 0;
  if (!page) return fail("bad_input", 400, origin, { field: "page" });
  const lg = query.get("lang");
  if (lg && !Object.hasOwn(STOCK_LOCALE, lg)) return fail("bad_input", 400, origin, { field: "lang" });
  if (!env.PEXELS_API_KEY) return fail("not_ready", 503, origin);
  // Oturum şart (Bearer); A9b: pro|enterprise sınırsız (0018). 0018 yok → 403 plan; demo/basic yalnız deneme hakkı kullanılmamışken.
  const a = await account(c);
  if (!a) return fail("login_required", 401, origin);
  let trial = null;
  if (!a.P?.stock) {
    trial = a.P ? await stockTrial(c, a) : null;
    if (!trial) return fail("plan", 403, origin, { need: "pro", ...(a.P?.trial_ended && { trial_ended: true }) });
    if (trial.used >= trial.limit) return fail("plan", 403, origin, { need: "pro", trial_used: true, stock_trial: trialView(trial) });
  }
  const day = genDay();
  // 27.11 E5: sahne başına İngilizce q ile arama sayısı artar → saatlik global 'sh' (GEN_STOCK_PER_HOUR, 180) ve kullanıcı başı
  // saatlik 'sk' (GEN_STOCK_USER_PER_HOUR, 40) tavanı; saat İstanbul saatine göre "00".."23", günlük sayaçlar aynen kalır.
  // Deneme aramaları ayrıca hepsi birlikte saatlik 'sd' (GEN_STOCK_TRIAL_PER_HOUR, 40) alt tavanında: demo hesaplar 'sh'yi
  // doldurup Pro'nun sahne aramasını o saat durduramaz (aşım 429 scope "trial", per "hour").
  const hour = new Date(Date.now() + OFFSET).toISOString().slice(11, 13);
  const [uK, ipK, allK, hK, ukK, tdK] = await Promise.all([keyOf(env, day, "su", String(a.user.id)), keyOf(env, day, "st", ipPrefix(ip)), keyOf(env, day, "sa", "global"),
    keyOf(env, day, "sh", "global|" + hour), keyOf(env, day, "sk", `${a.user.id}|${hour}`), trial ? keyOf(env, day, "sd", "trial|" + hour) : null]);
  const items = [
    // deneme kullanıcısı (demo/basic) hak harcanana kadar arayabilir; ücretsiz hesaplar Pro'nun paylaştığı günlük toplamı
    // tüketmesin diye günlük arama tavanı GEN_STOCK_TRIAL_PER_DAY (varsayılan 20) ile daraltılır
    { name: "user", kind: "su", key: uK, inc: 1, max: trial ? Math.min(int(env.GEN_STOCK_USER_PER_DAY, 100), int(env.GEN_STOCK_TRIAL_PER_DAY, 20)) : int(env.GEN_STOCK_USER_PER_DAY, 100) },
    { name: "ip", kind: "st", key: ipK, inc: 1, max: int(env.GEN_STOCK_IP_PER_DAY, 120) },
    { name: "all", kind: "sa", key: allK, inc: 1, max: int(env.GEN_STOCK_PER_DAY, STOCK_DAY_MAX) },
    { name: "hour", kind: "sh", key: hK, inc: 1, max: int(env.GEN_STOCK_PER_HOUR, 180) },
    { name: "uhour", kind: "sk", key: ukK, inc: 1, max: int(env.GEN_STOCK_USER_PER_HOUR, 40) },
    ...(trial ? [{ name: "trial_hour", kind: "sd", key: tdK, inc: 1, max: int(env.GEN_STOCK_TRIAL_PER_HOUR, 40) }] : []),
  ];
  const r = await reserve(db, day, items);
  if (!r.ok) {
    const f = r.failed;
    return fail("limit", 429, origin, { scope: f.includes("user") || f.includes("uhour") ? "user" : f.includes("ip") ? "ip" : f.includes("trial_hour") ? "trial" : "global",
      ...(f.includes("hour") || f.includes("uhour") || f.includes("trial_hour") ? { per: "hour" } : {}) });
  }
  const u = new URL(type === "video" ? STOCK_VIDEO_URL : STOCK_URL);
  u.searchParams.set("query", q);
  u.searchParams.set("per_page", String(STOCK_PER_PAGE));
  u.searchParams.set("page", String(page));
  if (o) u.searchParams.set("orientation", o);
  if (lg) u.searchParams.set("locale", STOCK_LOCALE[lg]);
  // üst akış başarısız: tüm sayaçlar iade (iade yazılamazsa yanıt değişmez), sonra hata
  const iade = async (code, status, extra) => {
    try { await db.batch(decr(db, day, items)); } catch (e) { console.log("stock iade", e?.message?.slice(0, 80)); }
    return fail(code, status, origin, extra);
  };
  let data;
  try {
    const get = io.fetch; // ayrık çağrı: Workers fetch'i nesne metodu olarak çağrılınca "Illegal invocation" (TypeError) verir
    const res = await get(u.toString(), { method: "GET", headers: { authorization: env.PEXELS_API_KEY, accept: "application/json" }, signal: AbortSignal.timeout(STOCK_TIMEOUT) });
    if (!res.ok) {
      console.log("stock", res.status);
      // Pexels kotası doldu: istemci "çok yoğun, biraz sonra" der (bağlantı hatası değil)
      return res.status === 429 ? iade("limit", 429, { scope: "global" }) : iade("upstream", 502);
    }
    data = await res.json();
  } catch (e) {
    console.log("stock", e?.name || "error");
    return iade("upstream", 502);
  }
  if (type === "video") {
    if (!data || !Array.isArray(data.videos)) return iade("upstream", 502);
    const videos = data.videos.slice(0, STOCK_PER_PAGE).map(v => stockVideo(v, o)).filter(Boolean);
    const total = Number.isFinite(data.total_results) ? data.total_results : videos.length;
    return json({ ok: true, type, videos, page, per_page: STOCK_PER_PAGE, total_results: total, next: Boolean(data.next_page) && page < 100, ...(trial && { stock_trial: trialView(trial) }) }, 200, origin);
  }
  if (!data || !Array.isArray(data.photos)) return iade("upstream", 502);
  const photos = data.photos.slice(0, STOCK_PER_PAGE).map(stockPhoto).filter(Boolean);
  const total = Number.isFinite(data.total_results) ? data.total_results : photos.length;
  return json({ ok: true, photos, page, per_page: STOCK_PER_PAGE, total_results: total, next: Boolean(data.next_page) && page < 100, ...(trial && { stock_trial: trialView(trial) }) }, 200, origin);
}

// 25.11 Pexels deneme hakkı: stock false olan planda (demo/basic) hesap başına ÖMÜR BOYU P.stock_trial görsel. Sayaç gen_usage'ta
// sabit day STOCK_TRIAL_DAY ('stock_trial'; tarih değil → genCleanup silmez), kind 'pt', anahtar keyOf(salt|stock_trial|pt|uid);
// göç gerekmez. Demo denemesi bittiyse (trial_ended) hak yok. Dönüş {limit, used, key} ya da null (deneme yok / sınırsız plan).
export const STOCK_TRIAL_DAY = "stock_trial";
// pid verilirse (Pexels fotoğraf kimliği) aynı sorguda o fotoğrafın "harcandı" kaydı da okunur: {pkey, pdone} (bkz. stockUseRoute).
async function stockTrial(c, a, pid) {
  const limit = Number(a?.P?.stock_trial) || 0;
  if (!a?.P || a.P.stock || limit <= 0 || a.P.trial_ended) return null;
  const uid = String(a.user.id);
  const key = await keyOf(c.env, STOCK_TRIAL_DAY, "pt", uid);
  const pkey = pid ? await keyOf(c.env, STOCK_TRIAL_DAY, "pi", `${uid}|${pid}`) : null;
  const n = await counts(c.db, STOCK_TRIAL_DAY, pkey ? { t: key, p: pkey } : { t: key });
  return { limit, used: Math.min(limit, n.t), key, ...(pkey && { pkey, pdone: n.p > 0 }) };
}
const trialView = t => ({ limit: t.limit, used: t.used });

// POST /gen/stock/use: kullanıcı görseli sahneye EKLEDİĞİ an çağrılır. pro|enterprise → {ok, unlimited:true} (sayaç yok);
// deneme planı → koşullu tek UPSERT (n + 1 <= limit) ile atomik düşüm: iki eşzamanlı çağrıdan yalnız biri geçer; hak bittiyse
// 403 plan {need:"pro", trial_used:true}. Gövde isteğe bağlı ({id}: Pexels fotoğraf kimliği).
// 25.11 tekrar güvenliği (göçsüz): id verilirse hak düşümüyle AYNI db.batch'te gen_usage'a "harcandı" kaydı yazılır
// (day STOCK_TRIAL_DAY, kind 'pi', anahtar keyOf(salt|stock_trial|pi|uid|id), tavan 1; ham id saklanmaz). Yanıtı zaman aşımına
// uğrayan istemci aynı id ile yeniden denerse hak bitmiş olsa da {ok, charged:false, repeat:true, stock_trial} döner, ikinci
// düşüm olmaz. Eşzamanlı aynı-id iki çağrı: biri düşer, öbürününki geri alınır → kayıt görülür, repeat. Farklı id ile hak
// bittiyse 403 (eskisi gibi). id'siz çağrı eskisi gibi (kayıt yok, tekrar 403).
// "Harcandı" kaydı YALNIZ hak düşümü (pt) aynı batch'te başarılıysa yazılır (PI_UPSERT: changes() > 0 koşulu; batch tek işlem,
// bir önceki deyim pt). Böylece hak düşmeyen bir istek kısa süre de olsa 'pi' kaydı bırakmaz; aynı anda aynı id ile gelen
// başka istek onu "tekrar" sayıp hak düşmeden 200 alamaz.
export const PI_UPSERT = "INSERT INTO gen_usage (day, key, kind, n) SELECT ?, ?, ?, ? WHERE changes() > 0 ON CONFLICT(day, key) DO UPDATE SET n = gen_usage.n + excluded.n WHERE gen_usage.n + excluded.n <= ? RETURNING n";
async function stockUseRoute(c) {
  const { env, db, origin, body } = c;
  if (body && body.id !== undefined && !(Number.isSafeInteger(body.id) && body.id > 0)) return fail("bad_input", 400, origin, { field: "id" });
  if (!env.PEXELS_API_KEY) return fail("not_ready", 503, origin);
  const a = await account(c);
  if (!a) return fail("login_required", 401, origin);
  if (a.P?.stock) return json({ ok: true, charged: false, unlimited: true }, 200, origin);
  const pid = body?.id;
  const t = a.P ? await stockTrial(c, a, pid) : null;
  if (!t) return fail("plan", 403, origin, { need: "pro", ...(a.P?.trial_ended && { trial_ended: true }) });
  const used = { need: "pro", trial_used: true, stock_trial: { limit: t.limit, used: t.limit } };
  const repeat = async () => {
    const n = await counts(db, STOCK_TRIAL_DAY, { t: t.key });
    return json({ ok: true, charged: false, repeat: true, stock_trial: { limit: t.limit, used: Math.min(t.limit, Math.max(1, n.t)) } }, 200, origin);
  };
  if (t.pdone) return repeat();
  if (t.used >= t.limit) return fail("plan", 403, origin, used);
  if (!t.pkey) {
    const r = await reserve(db, STOCK_TRIAL_DAY, [{ name: "t", kind: "pt", key: t.key, inc: 1, max: t.limit }]);
    if (!r.ok) return fail("plan", 403, origin, used);
    return json({ ok: true, charged: false, stock_trial: { limit: t.limit, used: r.n.t } }, 200, origin);
  }
  const pdone = async () => (await counts(db, STOCK_TRIAL_DAY, { p: t.pkey })).p > 0;
  const res = await db.batch([
    db.prepare(UPSERT).bind(STOCK_TRIAL_DAY, t.key, "pt", 1, t.limit),
    db.prepare(PI_UPSERT).bind(STOCK_TRIAL_DAY, t.pkey, "pi", 1, 1),
  ]);
  const ptRow = res[0]?.results?.[0], piRow = res[1]?.results?.[0];
  // hak düşmedi (pi de yazılmadı): eşzamanlı aynı-id çağrı önce düşürdüyse kayıt var → repeat; yoksa hak bitmiş
  if (!ptRow) return (await pdone()) ? repeat() : fail("plan", 403, origin, used);
  if (!piRow) {
    // hak düştü ama kayıt yazılamadı: eşzamanlı aynı-id çağrı önce işaretledi → bizim düşümümüzü geri al, repeat
    const back = () => db.prepare(DECR).bind(1, STOCK_TRIAL_DAY, t.key).run().then(repeat);
    if (await pdone()) return back();
    // kayıt yok (changes() beklenmedik 0 döndü): hak düşmüş kalsın, kaydı ayrıca yaz; arada aynı id işaretlediyse geri al
    if (!(await db.prepare(UPSERT).bind(STOCK_TRIAL_DAY, t.pkey, "pi", 1, 1).first())) return back();
  }
  return json({ ok: true, charged: false, stock_trial: { limit: t.limit, used: Number(ptRow.n) } }, 200, origin);
}

// W2 (26.11) + 27.11 seslendirme: POST /gen/tts → ElevenLabs REST, yanıt audio/mpeg.
// Secret ELEVENLABS_API_KEY (wrangler secret; yoksa 503 {hata:"tts_kapali"}); anahtar yalnız "Text to Speech" izinli olmalı.
// Model ELEVENLABS_MODEL (var, isteğe bağlı; varsayılan eleven_multilingual_v2 = Türkçe destekli, karakter başına 1 kredi).
// Biçim ELEVENLABS_FORMAT yalnız TTS_FORMATS'tan (yoksa mp3_44100_192: Creator planı; 128'e var ile geri alınır). Gövde JSON (kaçış derdi yok),
// language_code sesin dilinden (multilingual_v2 desteklemez → o modelde gönderilmez), voice_settings sabit (TTS_SETTINGS),
// apply_text_normalization "on". Metin en çok TTS_MAX (1500) karakter (aşarsa 400 metin_uzun).
// Ses yuvaları TTS_TABLE: dışarıya {id, dil, ad, cinsiyet, yerel} gider, ElevenLabs voice_id ('el' / override) yalnız sunucuda.
// 'el' = SESLER.md (27.11) ile seçilip hesabın My Voices'ına eklenmiş Voice Library sesleri (yerel: true = sesin ana dili yuvanın
// dili) + en-US-Anlatici (Alicia, varsayılan sesler, çok dilli); el null olan yuva ELEVENLABS_VOICES ile açılana dek listede GİZLİ. ELEVENLABS_VOICES (secret; deploy gerekmez) JSON: {"<yuva>":"<voice_id>"} ya da {"<yuva>":{"id":"<voice_id>",
// "ad":"Ayşe"}}; id biçimi bozuk girdi tümden, ad bozuksa yalnız ad yok sayılır; JSON bozuksa hiçbiri. Eski kimlikler (TTS_ALIAS:
// tr-TR-Sarah …, fr-FR-Kadin, SESLER.md adları tr-TR-Kadin1 / de-DE …) istekte ve ELEVENLABS_VOICES'ta yuvaya çevrilir (aynı yuvada
// yeni anahtar kazanır); tanınmayan anahtar atlanır ve loglanır. yerel = tabloda yerel ya da override var.
// Oturum şart (Bearer; GEN_LOGIN_REQUIRED=1 iken yönlendirici zaten 401 verir, kapalıyken de burada 401). Göç yok: sayaçlar
// gen_usage'ta — kullanıcı/gün istek 'tu' (GEN_TTS_USER_PER_DAY 60), global/gün istek 'ta' (GEN_TTS_PER_DAY 600), global AYLIK
// karakter 'tc' (GEN_TTS_CHARS_PER_MONTH, varsayılan 108000: ElevenLabs Creator 121k kredi/ay, multilingual 1 kredi/karakter,
// %10 pay; day "tts:YYYY-MM"); kullanıcı başına AYLIK karakter 'sc' (day "ses:YYYY-MM", key "c:u:<id>", tavan
// GEN_TTS_USER_CHARS_PER_MONTH ya da (plan seslendirme + ek bakiye, en az 1) × GEN_TTS_CHARS_PER_HAK (2500); aşım 429 scope
// "user_month").
// Hak sistemi (27.11, plans.js seslendirme): 1 hak = bir videonun tüm sahneleri. Gövde {metin, ses, rid?, yeni?} ya da
// {ornek:true, ses}.
//  - ornek:true → "Dinle": metin sunucudaki TTS_ORNEK[dil] (gövdedeki metin yok sayılır), hak harcanmaz, rid yok; günlük
//    kullanıcı başına GEN_TTS_SAMPLE_PER_DAY (30) 'to' sayacı (aşım 429 tts_limit scope "ornek"). Örnekler ödenmiş işin global
//    'ta' sayacını yemez: ayrı global/gün 'tg' (GEN_TTS_SAMPLE_GLOBAL_PER_DAY 150, aşım scope "ornek_global") ve aylık örnek
//    karakter alt tavanı 'tk' (GEN_TTS_SAMPLE_CHARS_PER_MONTH 10000, day "tts:YYYY-MM"; aşım scope "ornek_global"); karakterleri
//    yine 'tc'ye sayılır (gerçek kredi), ama tc'nin en çok ~%9'unu yiyebilir. Demo da dinleyebilir (BRIEF kararı).
//  - rid yok + yeni:true → hak düşer (önce aylık: day "ses:YYYY-MM" key "u:<id>" kind 'ss' koşullu artış ≤ plan seslendirme;
//    bitmişse ek bakiye: day "ses_ek" key "u:<id>" kind 'se' n-1), yeni imzalı rid (24 saat) üretilir. İkisi de yoksa 402
//    ses_hak_yok {kalan:0, plan, ek_paket}. rid yok + yeni yok → 400 hak_onay_gerek (yanlışlıkla hak yakmayı önler).
//  - rid var → hak düşmez; rid HMAC(GEN_SALT) imzalı, kullanıcıya bağlı (başka uid / bozuk → 400 rid_gecersiz; süresi geçti →
//    409 ses_oturum_bitti {neden:"sure"}); rid başına en çok GEN_TTS_RID_CHARS (6000) karakter 'sr' (aşım 409 {neden:"karakter"}).
//  ElevenLabs hatası/zaman aşımı → sayaçlar ve bu istekte düşen hak iade, yeni rid verilmez, 502 {hata:"tts_hata", neden?}.
//  Hak düşerken D1 hatası → sayaçlar iade, 503 {hata:"tts_hata", neden:"diger"} (402 ses_hak_yok DEĞİL; satın almaya yönlendirmez).
//  Başarı başlıkları: x-ses-rid (yeni ya da mevcut rid), x-ses-kalan (aylık kalan + ek), access-control-expose-headers.
// GET /gen/tts/sesler oturumsuz: {ok, acik, sesler}; acik yalnız secret'ın VAR olup olmadığı (değer dönmez). İki uç src/sites.js
// APP_ROUTES'ta; POST /gen/tts yalnız uç listesinde "POST /gen/tts" olan sitenin oturumuyla çalışır.
const TTS_TABLE = [
  { id: "tr-TR-Kadin", dil: "tr-TR", ad: "Derya", cinsiyet: "kadin", el: "NNn9dv8zq2kUo7d3JSGG", yerel: true },
  { id: "tr-TR-Erkek", dil: "tr-TR", ad: "Adam", cinsiyet: "erkek", el: "J17lijyP1BHYcM7ld0Rg", yerel: true },
  { id: "tr-TR-KadinB", dil: "tr-TR", ad: "Duygu", cinsiyet: "kadin", el: "MzfWWOj9g3sIKex1YFMV", yerel: true },
  { id: "tr-TR-ErkekB", dil: "tr-TR", ad: "Doğa", cinsiyet: "erkek", el: "IuRRIAcbQK5AQk1XevPj", yerel: true },
  { id: "en-US-Kadin", dil: "en-US", ad: "Hope", cinsiyet: "kadin", el: "tnSpp4vdxKPjI9w0GnoV", yerel: true },
  { id: "en-US-Erkek", dil: "en-US", ad: "Mark", cinsiyet: "erkek", el: "UgBBYS2sOqTuMpoF3BR0", yerel: true },
  { id: "en-US-Anlatici", dil: "en-US", ad: "Alicia", cinsiyet: "kadin", el: "BFd5oBc2DDna33pSi4Gf" },
  { id: "en-GB-Erkek", dil: "en-GB", ad: "Christopher", cinsiyet: "erkek", el: "G17SuINrv2H9FC6nvetn", yerel: true },
  { id: "de-DE-Kadin", dil: "de-DE", ad: "Lea", cinsiyet: "kadin", el: "7eVMgwCnXydb3CikjV7a", yerel: true },
  { id: "es-ES-Erkek", dil: "es-ES", ad: "David", cinsiyet: "erkek", el: "Nh2zY9kknu6z4pZy6FhD", yerel: true },
  { id: "fr-FR-Erkek", dil: "fr-FR", ad: "Nicolas", cinsiyet: "erkek", el: "aQROLel5sQbj1vuIVi6B", yerel: true },
  { id: "ar-SA-Erkek", dil: "ar-SA", ad: "Mazen", cinsiyet: "erkek", el: "rPNcQ53R703tTmtue1AT", yerel: true },
];
// eski kayıtlı projelerin ses kimlikleri ve SESLER.md'deki ELEVENLABS_VOICES anahtarları → yuva (istemcide de aynı tablo)
export const TTS_ALIAS = Object.freeze({
  "tr-TR-Sarah": "tr-TR-Kadin", "tr-TR-Adam": "tr-TR-Erkek", "en-US-Alice": "en-US-Kadin", "en-US-George": "en-GB-Erkek", "fr-FR-Kadin": "fr-FR-Erkek",
  "tr-TR-Kadin1": "tr-TR-Kadin", "tr-TR-Kadin2": "tr-TR-KadinB", "tr-TR-Erkek1": "tr-TR-Erkek", "tr-TR-Erkek2": "tr-TR-ErkekB",
  "de-DE": "de-DE-Kadin", "es-ES": "es-ES-Erkek", "fr-FR": "fr-FR-Erkek", "ar-SA": "ar-SA-Erkek",
});
// bütün yuvalar (gizliler dahil), yalnız dışa açık alanlar
export const TTS_VOICES = Object.freeze(TTS_TABLE.map(({ el, yerel, ...v }) => Object.freeze(v)));
const TTS_SLOT = new Map(TTS_TABLE.map(v => [v.id, v]));
const TTS_VID = /^[A-Za-z0-9]{10,40}$/;
const TTS_AD = /^[\p{L} .'-]{1,24}$/u;
const ttsAlias = id => typeof id === "string" && Object.hasOwn(TTS_ALIAS, id) ? TTS_ALIAS[id] : id;
// ELEVENLABS_VOICES'ta tanınmayan anahtar / bozuk id: isolate başına bir kez log (değer yazılmaz, yalnız anahtar adı)
const ttsUyarildi = new Set();
const ttsUyar = (k, neden) => { const m = neden + ":" + String(k).slice(0, 40); if (ttsUyarildi.has(m) || ttsUyarildi.size > 50) return; ttsUyarildi.add(m); console.log("ELEVENLABS_VOICES atlandı", m); };
// ELEVENLABS_VOICES → Map(yuva → {id, ad?}); eski anahtarlar önce, yeni anahtar aynı yuvada üstüne yazar
export function ttsOverrides(env) {
  const out = new Map();
  let o = null;
  try { o = env?.ELEVENLABS_VOICES ? JSON.parse(String(env.ELEVENLABS_VOICES)) : null; } catch { o = null; }
  if (!o || typeof o !== "object" || Array.isArray(o)) return out;
  const keys = Object.keys(o).sort((a, b) => Number(Object.hasOwn(TTS_ALIAS, b)) - Number(Object.hasOwn(TTS_ALIAS, a)));
  for (const k of keys) {
    const slot = ttsAlias(k);
    if (!TTS_SLOT.has(slot)) { ttsUyar(k, "yuva_yok"); continue; }
    const x = o[k];
    const id = typeof x === "string" ? x : x && typeof x === "object" && !Array.isArray(x) ? x.id : null;
    if (typeof id !== "string" || !TTS_VID.test(id)) { ttsUyar(k, "id_bozuk"); continue; }
    const ad = x && typeof x === "object" && typeof x.ad === "string" && TTS_AD.test(x.ad.normalize("NFC").trim()) ? x.ad.normalize("NFC").trim() : null;
    out.set(slot, { id, ...(ad && { ad }) });
  }
  return out;
}
// açık yuvalar (voice_id'si olan) + sunucu içi vid; dışarıya vid'siz ttsSesler gider
function ttsSlots(env) {
  const ov = ttsOverrides(env);
  return TTS_TABLE.map(t => {
    const o = ov.get(t.id);
    const vid = o?.id || t.el;
    return vid ? { id: t.id, dil: t.dil, ad: o?.ad || t.ad, cinsiyet: t.cinsiyet, yerel: Boolean(o) || t.yerel === true, vid } : null;
  }).filter(Boolean);
}
export const ttsSesler = env => ttsSlots(env).map(({ vid, ...v }) => v);
// yuva (ya da eski kimlik) → voice_id; bilinmeyen yuva undefined, kapalı yuva null
export const ttsVoiceId = (env, id) => {
  const slot = ttsAlias(id);
  if (typeof slot !== "string" || !TTS_SLOT.has(slot)) return undefined;
  return ttsOverrides(env).get(slot)?.id ?? TTS_SLOT.get(slot).el;
};
// ElevenLabs hata kodu → kısa neden (yanıtta "neden"; anahtar/kimlik dönmez): ses_yok = voice_id kalktı (ELEVENLABS_VOICES ile
// değiştir), kredi = kredi/kota bitti, anahtar = geçersiz/izinsiz anahtar, yogun = 429, diger = geri kalanı.
export const ttsNeden = (status, code) => {
  const k = String(code || "");
  if (status === 404 || /voice_not_found/.test(k)) return "ses_yok";
  if (status === 402 || /insufficient_credits|quota_exceeded/.test(k)) return "kredi";
  if (status === 401 || status === 403) return "anahtar";
  if (status === 429) return "yogun";
  return "diger";
};
export const TTS_MAX = 1500;
const TTS_TIMEOUT = 20000;
export const TTS_FORMATS = Object.freeze(["mp3_44100_128", "mp3_44100_192"]);
export const TTS_FORMAT_DEFAULT = "mp3_44100_192";
export const ttsFormat = env => TTS_FORMATS.includes(env?.ELEVENLABS_FORMAT) ? env.ELEVENLABS_FORMAT : TTS_FORMAT_DEFAULT;
export const TTS_MODEL_DEFAULT = "eleven_multilingual_v2";
// model adı URL'ye değil gövdeye girer; yine de yalnız eleven_* biçimi (yanlış var → varsayılan)
export const ttsModel = env => /^eleven_[a-z0-9_]{2,40}$/.test(String(env.ELEVENLABS_MODEL || "")) ? env.ELEVENLABS_MODEL : TTS_MODEL_DEFAULT;
export const TTS_SETTINGS = Object.freeze({ stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true });
// "Dinle" örnek metni (dil öneki → metin); istemci metin göndermez
export const TTS_ORNEK = Object.freeze({
  tr: "Merhaba! Bu ses videonuzdaki sahneleri böyle seslendirecek.",
  en: "Hi! This is how this voice will narrate the scenes in your video.",
  de: "Hallo! So wird diese Stimme die Szenen in Ihrem Video sprechen.",
  es: "¡Hola! Así narrará esta voz las escenas de tu vídeo.",
  fr: "Bonjour ! Voici comment cette voix racontera les scènes de votre vidéo.",
  ar: "مرحبًا! هكذا سيقرأ هذا الصوت مشاهد الفيديو الخاص بك.",
});
const ttsOn = env => Boolean(env.ELEVENLABS_API_KEY);
const ttsFail = (hata, status, origin, extra) => fail(hata, status, origin, { hata, ...extra });
export const ttsBody = (metin, v, model) => ({
  text: metin,
  model_id: model,
  ...(model !== "eleven_multilingual_v2" && { language_code: v.dil.slice(0, 2) }),
  voice_settings: { ...TTS_SETTINGS },
  apply_text_normalization: "on",
});
// Metin: NFC; kontrol karakterleri (satır sonu ve sekme dışı) boşluk; kenar boşluğu kırpılır.
const ttsText = v => typeof v === "string" ? v.normalize("NFC").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f￾￿]/g, " ").trim() : null;

// Seslendirme oturumu (rid): b64u("uid.verildiGun.exp.rastgele16") + "." + b64u(HMAC-SHA256(GEN_SALT, "ses-rid|"+payload)) ilk 22.
// exp saniye (verildiği an + 24 saat). Kişisel veri taşımaz (uid sayı); istemci proje kaydında saklar.
export const RID_TTL = 24 * 3600;
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => { try { return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0))); } catch { return null; } };
async function ridSig(env, payload) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(env.GEN_SALT)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode("ses-rid|" + payload)))).slice(0, 22);
}
const sameStr = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
export async function ridYap(env, uid, now = Date.now()) {
  const r = [...crypto.getRandomValues(new Uint8Array(8))].map(x => x.toString(16).padStart(2, "0")).join("");
  const day = genDay(now);
  const payload = b64u(new TextEncoder().encode(`${uid}.${day}.${Math.floor(now / 1000) + RID_TTL}.${r}`));
  return { rid: payload + "." + await ridSig(env, payload), day };
}
// → {ok:true, day, exp} | {hata:"rid_gecersiz"} | {hata:"sure"}
export async function ridCoz(env, rid, uid, now = Date.now()) {
  const bad = { hata: "rid_gecersiz" };
  if (typeof rid !== "string" || rid.length > 200 || !/^[A-Za-z0-9_-]{8,160}\.[A-Za-z0-9_-]{22}$/.test(rid)) return bad;
  const [payload, sig] = rid.split(".");
  if (!sameStr(await ridSig(env, payload), sig)) return bad;
  const p = unb64u(payload)?.split(".");
  if (!p || p.length !== 4 || p[0] !== String(uid) || !/^\d{4}-\d{2}-\d{2}$/.test(p[1]) || !/^\d{1,12}$/.test(p[2]) || !/^[0-9a-f]{16}$/.test(p[3])) return bad;
  if (Number(p[2]) * 1000 <= now) return { hata: "sure" };
  return { ok: true, day: p[1], exp: Number(p[2]) };
}

// Seslendirme hakkı durumu: {limit, used, ek, kalan, reset_at}. limit = plan seslendirme (demo denemesi bittiyse 0).
// reset_at = sonraki ayın 1'i 00:00 Europe/Istanbul (UTC+3 sabit).
const sesLimit = P => P?.trial_ended ? 0 : P?.seslendirme ?? 0;
export const sesAy = (now = Date.now()) => "ses:" + genDay(now).slice(0, 7);
export function sesResetAt(now = Date.now()) {
  const d = genDay(now);
  return new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7), 1) - OFFSET).toISOString();
}
export async function sesDurum(db, uid, P, now = Date.now()) {
  const ay = sesAy(now);
  const { results } = await db.prepare("SELECT day, n FROM gen_usage WHERE key = ? AND day IN (?, 'ses_ek')").bind("u:" + uid, ay).all();
  let used = 0, ek = 0;
  for (const r of results || []) { if (r.day === ay) used = Number(r.n) || 0; else ek = Number(r.n) || 0; }
  const limit = sesLimit(P);
  return { limit, used, ek, kalan: Math.max(0, limit - used) + ek, reset_at: sesResetAt(now) };
}
const SES_AY_UP = "INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, 'ss', 1) ON CONFLICT(day, key) DO UPDATE SET n = gen_usage.n + 1 WHERE gen_usage.n + 1 <= ? RETURNING n";
const SES_EK_DOWN = "UPDATE gen_usage SET n = n - 1 WHERE day = 'ses_ek' AND key = ? AND n >= 1 RETURNING n";
const SES_AY_IADE = "UPDATE gen_usage SET n = n - 1 WHERE day = ? AND key = ? AND n >= 1";
const SES_EK_IADE = "INSERT INTO gen_usage (day, key, kind, n) VALUES ('ses_ek', ?, 'se', 1) ON CONFLICT(day, key) DO UPDATE SET n = gen_usage.n + 1";
// bu ay harcanan ek hak sayısı (kullanıcı/ay karakter tavanını ek hak harcandıkça küçültmemek için): day "ses:YYYY-MM", key "e:u:<id>"
const SES_EK_SAY = "INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, 'sx', 1) ON CONFLICT(day, key) DO UPDATE SET n = gen_usage.n + 1";
// kullanıcı/ay karakter tavanı: env sabiti ya da (plan seslendirme + ek bakiye + bu ay harcanan ek) × GEN_TTS_CHARS_PER_HAK; en az 1 hak.
// Okuma hatasında ek 0 sayılır (tavan küçük kalır; yalnız ek alanı etkiler) ve loglanır.
async function sesKarakterTavan(env, db, uid, P, ay) {
  if (env.GEN_TTS_USER_CHARS_PER_MONTH) return int(env.GEN_TTS_USER_CHARS_PER_MONTH, 15000);
  const perHak = int(env.GEN_TTS_CHARS_PER_HAK, 2500);
  let ek = 0;
  try {
    const { results } = await db.prepare("SELECT day, key, n FROM gen_usage WHERE (key = ? AND day = 'ses_ek') OR (key = ? AND day = ?)").bind("u:" + uid, "e:u:" + uid, ay).all();
    for (const r of results || []) ek += Number(r.n) || 0;
  } catch (e) { console.log("tts tavan", e?.message?.slice(0, 80)); }
  return Math.max(1, sesLimit(P) + ek) * perHak;
}

function ttsVoicesRoute(c) {
  return json({ ok: true, acik: ttsOn(c.env), sesler: ttsSesler(c.env) }, 200, c.origin);
}

async function ttsRoute(c) {
  const { env, db, origin, body, io } = c;
  if (!ttsOn(env)) return ttsFail("tts_kapali", 503, origin);
  const a = await account(c);
  if (!a || !siteConf(a.site).routes?.includes("POST /gen/tts")) return ttsFail("login_required", 401, origin);
  const ornek = body?.ornek === true;
  let metin = null;
  if (!ornek) {
    metin = ttsText(body?.metin);
    if (!metin) return ttsFail("metin_bos", 400, origin, { field: "metin" });
    if (cp(metin) > TTS_MAX) return ttsFail("metin_uzun", 400, origin, { field: "metin", max: TTS_MAX });
  }
  const sid = ttsAlias(body?.ses);
  const v = typeof sid === "string" ? ttsSlots(env).find(x => x.id === sid) : null;
  if (!v) return ttsFail("ses_gecersiz", 400, origin, { field: "ses" });
  if (ornek) metin = TTS_ORNEK[v.dil.slice(0, 2)] || TTS_ORNEK.en;
  const n = cp(metin);
  const uid = a.user.id;
  const day = genDay(), month = "tts:" + day.slice(0, 7);
  // seslendirme oturumu: mevcut rid doğrulanır ya da (yalnız yeni:true) yeni rid; örnek dinlemede rid yok
  let rid = null, ridDay = null, yeni = false;
  if (!ornek) {
    const given = body?.rid;
    if (given !== undefined && given !== null && given !== "") {
      const r = await ridCoz(env, given, uid);
      if (r.hata === "sure") return ttsFail("ses_oturum_bitti", 409, origin, { neden: "sure" });
      if (!r.ok) return ttsFail("rid_gecersiz", 400, origin, { field: "rid" });
      rid = given; ridDay = r.day;
    } else if (body?.yeni === true) {
      ({ rid, day: ridDay } = await ridYap(env, uid));
      yeni = true;
    } else return ttsFail("hak_onay_gerek", 400, origin);
  }
  const uKey = "u:" + uid, ay = sesAy();
  const [uK, allK, cK, oK, gK, kK] = await Promise.all([keyOf(env, day, "tu", String(uid)), ornek ? null : keyOf(env, day, "ta", "global"), keyOf(env, month, "tc", "global"),
    ornek ? keyOf(env, day, "to", String(uid)) : rid ? sha(rid).then(h => "r:" + h.slice(0, 32)) : null,
    ornek ? keyOf(env, day, "tg", "global") : null, ornek ? keyOf(env, month, "tk", "global") : null]);
  const items = [
    { name: "user", kind: "tu", key: uK, inc: 1, max: int(env.GEN_TTS_USER_PER_DAY, 60) },
    { name: "chars", kind: "tc", key: cK, inc: n, max: int(env.GEN_TTS_CHARS_PER_MONTH, 108000), day: month },
    // örnek ("Dinle") ödenmiş işin global günlük 'ta' sayacını yemez; kendi global/gün ve aylık karakter alt tavanı var
    ...(ornek ? [
      { name: "ornek", kind: "to", key: oK, inc: 1, max: int(env.GEN_TTS_SAMPLE_PER_DAY, 30) },
      { name: "ornek_global", kind: "tg", key: gK, inc: 1, max: int(env.GEN_TTS_SAMPLE_GLOBAL_PER_DAY, 150) },
      { name: "ornek_ay", kind: "tk", key: kK, inc: n, max: int(env.GEN_TTS_SAMPLE_CHARS_PER_MONTH, 10000), day: month },
    ] : [
      { name: "all", kind: "ta", key: allK, inc: 1, max: int(env.GEN_TTS_PER_DAY, 600) },
      { name: "rid", kind: "sr", key: oK, inc: n, max: int(env.GEN_TTS_RID_CHARS, 6000), day: ridDay },
      { name: "user_month", kind: "sc", key: "c:" + uKey, inc: n, max: await sesKarakterTavan(env, db, uid, a.P, ay), day: ay },
    ]),
  ];
  const r = await reserve(db, day, items);
  if (!r.ok) {
    const f = r.failed;
    if (f.includes("rid")) return ttsFail("ses_oturum_bitti", 409, origin, { neden: "karakter" });
    const scope = f.includes("user") ? "user" : f.includes("user_month") ? "user_month" : f.includes("ornek") ? "ornek"
      : f.includes("ornek_global") || f.includes("ornek_ay") ? "ornek_global" : f.includes("chars") ? "month" : "global";
    return ttsFail("tts_limit", 429, origin, { scope });
  }
  // hak düşme (yalnız yeni oturum): önce aylık (koşullu artış, eşzamanlı isteklerde tavanı aşmaz), yoksa ek bakiye.
  // D1 hatası "hakkın bitti" (402) diye gösterilmez: sayaçlar iade, 503 tts_hata (yeniden dene).
  let kaynak = null, hakHata = false;
  if (yeni) {
    try {
      const lim = sesLimit(a.P);
      if (lim > 0 && await db.prepare(SES_AY_UP).bind(ay, uKey, lim).first()) kaynak = "ay";
      else if (await db.prepare(SES_EK_DOWN).bind(uKey).first()) kaynak = "ek";
    } catch (e) { hakHata = true; console.log("tts hak", e?.message?.slice(0, 80)); }
    if (kaynak === "ek") { try { await db.prepare(SES_EK_SAY).bind(ay, "e:" + uKey).run(); } catch (e) { console.log("tts ek say", e?.message?.slice(0, 80)); } }
    if (!kaynak) {
      try { await db.batch(decr(db, day, items)); } catch (e) { console.log("tts iade", e?.message?.slice(0, 80)); }
      if (hakHata) return ttsFail("tts_hata", 503, origin, { neden: "diger" });
      return ttsFail("ses_hak_yok", 402, origin, { kalan: 0, plan: a.P?.plan ?? null, ek_paket: { ...SES_EK } });
    }
  }
  // ElevenLabs başarısız: sayaçlar + bu istekte düşen hak iade (iade yazılamazsa yanıt değişmez); yeni rid verilmez
  const iade = async neden => {
    const back = decr(db, day, items);
    if (kaynak === "ay") back.push(db.prepare(SES_AY_IADE).bind(ay, uKey));
    if (kaynak === "ek") back.push(db.prepare(SES_EK_IADE).bind(uKey), db.prepare(SES_AY_IADE).bind(ay, "e:" + uKey));
    try { await db.batch(back); } catch (e) { console.log("tts iade", e?.message?.slice(0, 80)); }
    return ttsFail("tts_hata", 502, origin, neden ? { neden } : undefined);
  };
  let audio;
  try {
    const get = io.fetch; // ayrık çağrı (Illegal invocation)
    const res = await get(`https://api.elevenlabs.io/v1/text-to-speech/${v.vid}?output_format=${ttsFormat(env)}`, {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg", "User-Agent": "corner-forms-tts" },
      body: JSON.stringify(ttsBody(metin, v, ttsModel(env))),
      signal: AbortSignal.timeout(TTS_TIMEOUT),
    });
    if (!res.ok) {
      let code = "";
      try { const j = await res.json(); code = j?.detail?.code || j?.detail?.status || j?.detail?.type || ""; } catch { /* gövde JSON değil */ }
      const neden = ttsNeden(res.status, code);
      console.log("tts", res.status, String(code).slice(0, 40), neden);
      return iade(neden);
    }
    audio = await res.arrayBuffer();
  } catch (e) {
    console.log("tts", e?.name || "error");
    return iade();
  }
  if (!audio || !audio.byteLength) return iade();
  const headers = { "content-type": "audio/mpeg", "cache-control": "no-store", ...(origin && { "access-control-allow-origin": origin, vary: "Origin" }) };
  if (rid) {
    headers["x-ses-rid"] = rid;
    try { headers["x-ses-kalan"] = String((await sesDurum(db, uid, a.P)).kalan); } catch (e) { console.log("tts kalan", e?.message?.slice(0, 80)); }
    headers["access-control-expose-headers"] = "x-ses-rid, x-ses-kalan";
  }
  return new Response(audio, { status: 200, headers });
}

// [ad, işleyici, yöntem (yoksa POST)]
const ROUTES = { "/gen/stock": ["stock", stockRoute, "GET"], "/gen/stock/use": ["stock_use", stockUseRoute], "/gen/tts": ["tts", ttsRoute], "/gen/tts/sesler": ["tts_voices", ttsVoicesRoute, "GET"], "/gen/linkedin": ["linkedin", linkedin], "/gen/instagram": ["instagram", instagram], "/gen/blog": ["blog", blog], "/gen/video": ["video", video], "/gen/refine": ["refine", refine], "/gen/quota": ["quota", quotaRoute], "/gen/event": ["event", event], "/gen/seo": ["seo", seoRoute] };

export async function generate(req, url, env, origin, ctx, io = {}) {
  const route = ROUTES[url.pathname];
  const isGet = route?.[2] === "GET";
  if (!route || req.method !== (isGet ? "GET" : "POST")) return fail("not_found", 404, origin);
  if (!genEnabled(env) || !env.DB) return fail("not_ready", 503, origin);
  if (!origin) return fail("origin", 403, null);
  const [name, handler] = route;
  const { tooLarge, body } = isGet ? { tooLarge: false, body: null } : await readBody(req, BODY_MAX[name]);
  if (tooLarge) return fail("too_large", 413, origin);
  try {
    const c = { env, db: env.DB, body, query: url.searchParams, origin, ctx, io: { fetch: io.fetch || ((u, i) => fetch(u, i)) }, ip: req.headers.get("cf-connecting-ip") || "", token: bearerToken(req) };
    // A15: GEN_LOGIN_REQUIRED=1 → ziyaretçi (oturumsuz) üretim yok; /gen/event ölçümü ve W2 ses listesi açık kalır.
    if (env.GEN_LOGIN_REQUIRED === "1" && name !== "event" && name !== "tts_voices" && !(await account(c))) {
      if (name === "quota") return json({ ok: true, charged: false, left: 0, cap: 0, plan: "anon", stock: false, login_required: true }, 200, origin);
      return fail("login_required", 401, origin);
    }
    return await handler(c);
  } catch (e) {
    // 0014 uygulanmadıysa tablo yok
    if (/no such (table|column)/i.test(e?.message || "")) return fail("not_ready", 503, origin);
    console.log("gen", name, e?.message?.slice(0, 120));
    return fail("server", 500, origin);
  }
}

// Saatlik cron (index.js scheduled): 2 günden eski sayaç satırları ve 13 aydan eski aylık plan sayaçları (0018 gen_month)
// silinir; gen_daily süresiz kalır. 2 D1 ifadesi; tablo yoksa sessiz. Pexels deneme sayacı (day STOCK_TRIAL_DAY, tarih değil)
// ömür boyu kalır: yalnız tarih biçimli günler silinir.
export async function genCleanup(env) {
  if (!env?.DB) return;
  for (const sql of ["DELETE FROM gen_usage WHERE day GLOB '[0-9]*' AND day < date('now', '-2 days')", "DELETE FROM gen_month WHERE month < strftime('%Y-%m', 'now', '-13 months')"]) {
    try {
      await env.DB.prepare(sql).run();
    } catch (e) {
      if (!noTable(e)) throw e;
    }
  }
}
