// app.socialmediacorner.co taslak üretimi (A0-KARAR §1, §3-§5): POST /gen/linkedin, /gen/instagram, /gen/refine, /gen/quota, /gen/event.
// /gen/instagram (A4 ISTEM-IG): kind caption|reels, isteğe bağlı marka sesi; kota, Turnstile, harcama, iade ve gen_daily
// /gen/linkedin ile ortak yoldan (produce). /gen/refine kind li|caption|reels (yoksa li).
// Bayrak GEN_ENABLED="1" + ANTHROPIC_API_KEY, GEN_SALT, TURNSTILE_SECRET + migrations/0014_gen.sql; biri yoksa 503 not_ready.
// Sayaçlar gen_usage'ta (gün Europe/Istanbul, sabit UTC+3; anahtar sha256(salt|gün|tür|değer), global 'all'), ölçüm gen_daily'de.
// Her yanıt `charged` (anon üretim hakkı düştü mü) taşır; sayaç okunduysa {left, cap, reset_at, scope} de.
// LLM sonrası yazımlar (gen_daily, iade) ctx.waitUntil ile. io.fetch testlerde sahte verilir.
// A5-4: ACCOUNTS_ENABLED="1" iken app sitesinde geçerli Bearer oturumu varsa başarılı üretim drafts'a da yazılır (saveDrafts);
// oturum yoksa/geçersizse yanıt anonimle bire bir aynı (401 yok), drafts hatası yutulur.
import {
  SYSTEM_GEN, SYSTEM_REFINE, SYSTEM_IG_CAPTION, SYSTEM_IG_REELS, SYSTEM_IG_CAPTION_REFINE, SYSTEM_IG_REELS_REFINE, SCHEMA, SCHEMA_REELS,
  SECTORS, TONES, LANGS, OPS, ANGLES, MAX, IG_KINDS, FORMATS, CTAS, VIDEOS, ADJECTIVES, ADDRESS, EMOJI, REELS_ANGLES, IG_OPS, IG_MAX,
  clean, fold, neutralize, banMatch, userGen, userRefine, userIg, userIgRefine,
} from "./gen-prompt.js";
import { makeLlm, LlmError, SPECS } from "./llm.js";
import { platformSite, bearerToken, sessionUser } from "./platform.js";
import { siteConf } from "./sites.js";

export const genEnabled = env => env?.GEN_ENABLED === "1" && Boolean(env.ANTHROPIC_API_KEY && env.GEN_SALT && env.TURNSTILE_SECRET);

const UUID = /^[0-9a-f-]{36}$/;
const RET = ["ret0", "ret1", "ret2_7", "ret8"];
const EVENTS = ["copy_ok", "copy_fb", "share", "quote_click"];
const SRCS = ["limit", "result", "error", "cap", "top", "footer", "calendly"];
const DAILY = new Set(["ok", "fail", "refused", "busy", "refine_ok", "tok_in", "tok_out", "uniq_anon", "anon_full", "ip_full", "cap_hit",
  ...RET, "copy_ok", "copy_fb", "share", ...SRCS.map(s => "qc_" + s)]);
const GEN_UNITS = 3, REFINE_UNITS = 1, MIN_T = 1500, EV_PER_DAY = 30;
// ISTEM-IG §3.2 madde 1: /gen/instagram gövdesi 8 KB (marka sesi)
const BODY_MAX = { linkedin: 4096, instagram: 8192, refine: 16384, quota: 4096, event: 4096 };
const LLM_ERR = { busy: ["llm_busy", 503], limit: ["llm_limit", 503], fail: ["llm_fail", 502], refusal: ["refused", 422] };

const json = (body, status, origin) => new Response(status === 204 ? null : JSON.stringify(body), {
  status,
  headers: { ...(status !== 204 && { "content-type": "application/json" }), ...(origin && { "access-control-allow-origin": origin, vary: "Origin" }) },
});
const fail = (error, status, origin, extra) => json({ ok: false, error, charged: false, ...extra }, status, origin);

const int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; };
const limits = env => ({
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
const keyOf = (env, day, kind, value) => kind === "all" ? Promise.resolve("all") : sha(`${env.GEN_SALT}|${day}|${kind}|${value}`);

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

const UPSERT = "INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, ?, ?) ON CONFLICT(day, key) DO UPDATE SET n = gen_usage.n + excluded.n WHERE gen_usage.n + excluded.n <= ? RETURNING n";
const DECR = "UPDATE gen_usage SET n = MAX(0, n - ?) WHERE day = ? AND key = ?";

// Koşullu artışlar tek db.batch'te; satır dönmeyen varsa artanlar aynı day/key ile geri alınır.
// items: [{name, kind, key, inc, max}] → { ok, n:{name:yeni değer}, failed:[name] }
async function reserve(db, day, items) {
  const res = await db.batch(items.map(i => db.prepare(UPSERT).bind(day, i.key, i.kind, i.inc, i.max)));
  const n = {}, failed = [];
  items.forEach((i, x) => { const row = res[x]?.results?.[0]; if (row) n[i.name] = Number(row.n); else failed.push(i.name); });
  if (failed.length) {
    const back = items.filter(i => n[i.name] !== undefined);
    if (back.length) await db.batch(back.map(i => db.prepare(DECR).bind(i.inc, day, i.key)));
  }
  return { ok: !failed.length, n, failed };
}

const decr = (db, day, items) => items.map(i => db.prepare(DECR).bind(i.inc, day, i.key));

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

function validateGen(b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return { field: "json" };
  if (b.hp !== undefined && b.hp !== null && b.hp !== "") return { field: "hp" };
  if (typeof b.anon !== "string" || !UUID.test(b.anon)) return { field: "anon" };
  const topic = text(b.topic, 1, MAX.topic);
  if (topic === null) return { field: "topic" };
  const sector = pick(b.sector, Object.keys(SECTORS));
  if (!sector) return { field: "sector" };
  const tone = pick(b.tone, TONES);
  if (!tone) return { field: "tone" };
  const goal = text(b.goal, 0, MAX.goal);
  if (goal === null) return { field: "goal" };
  if (topic.length + goal.length > MAX.total) return { field: "topic" };
  const lang = pick(b.lang, LANGS);
  if (!lang) return { field: "lang" };
  if (typeof b.rid !== "string" || !UUID.test(b.rid)) return { field: "rid" };
  return { v: { anon: b.anon, topic, sector, tone, goal, lang, rid: b.rid, ret: RET.includes(b.ret) ? b.ret : null, t: b.t, ts: b.ts } };
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

async function linkedin(c) {
  const { field, v } = validateGen(c.body);
  if (field) return fail("bad_input", 400, c.origin, { field });
  return produce(c, v, {
    system: SYSTEM_GEN, schema: SCHEMA, maxTokens: 3500, count: 3,
    user: userGen({ topic: neutralize(v.topic), sector: v.sector, tone: v.tone, goal: v.goal ? neutralize(v.goal) : "", lang: v.lang }),
  }, undefined, { platform: "linkedin", topic: v.topic, max: MAX.topic, meta: { kind: "li", tone: v.tone, sector: v.sector, lang: v.lang } });
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
// bir varyant (linkedin/instagram 3, refine 1); reels gövdesi "kanca\n\nsöz". meta yalnız sabit listeli kodlar (tür, açı,
// ton, dil, sektör, biçim, işaretler); jeton, IP, e-posta, anon kimliği ve marka sesi metni girmez. Yazım hatası (0017 yok,
// D1) yutulur, konsola tek satır; üretim yanıtı yine 200.
const DRAFT_SQL = "INSERT INTO drafts (user_id, site, platform, topic, body, meta) VALUES (?, ?, ?, ?, ?, ?) RETURNING id";
const draftBody = d => (typeof d.say === "string" ? `${d.text}\n\n${d.say}` : d.text);
async function saveDrafts(c, save, drafts) {
  const { env, db, origin, token } = c;
  if (!save || env.ACCOUNTS_ENABLED !== "1" || !token) return null;
  try {
    const site = platformSite(env, origin);
    if (!site || !siteConf(site).routes?.includes("GET /app/drafts")) return null;
    const user = await sessionUser(env, token, site);
    if (!user) return null;
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

async function refine(c) {
  const { env, db, body, origin, ctx, io, ip } = c;
  const { field, v } = validateRefine(body);
  if (field) return fail("bad_input", 400, origin, { field });
  if (v.kind !== "li") console.log("gen ig refine", v.kind, voiceLog(v));

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

async function quotaRoute(c) {
  const { env, db, body, origin, ip } = c;
  if (!body || typeof body.anon !== "string" || !UUID.test(body.anon)) return fail("bad_input", 400, origin, { field: "anon" });
  const L = limits(env), day = genDay();
  const [anonK, ipK, allK] = await Promise.all([keyOf(env, day, "anon", body.anon), keyOf(env, day, "ip", ipPrefix(ip)), keyOf(env, day, "all")]);
  const n = await counts(db, day, { anon: anonK, ip: ipK, all: allK });
  return json({ ok: true, charged: false, ...quota(L, n) }, 200, origin);
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

const ROUTES = { "/gen/linkedin": ["linkedin", linkedin], "/gen/instagram": ["instagram", instagram], "/gen/refine": ["refine", refine], "/gen/quota": ["quota", quotaRoute], "/gen/event": ["event", event] };

export async function generate(req, url, env, origin, ctx, io = {}) {
  const route = ROUTES[url.pathname];
  if (!route || req.method !== "POST") return fail("not_found", 404, origin);
  if (!genEnabled(env) || !env.DB) return fail("not_ready", 503, origin);
  if (!origin) return fail("origin", 403, null);
  const [name, handler] = route;
  const { tooLarge, body } = await readBody(req, BODY_MAX[name]);
  if (tooLarge) return fail("too_large", 413, origin);
  try {
    return await handler({ env, db: env.DB, body, origin, ctx, io: { fetch: io.fetch || fetch }, ip: req.headers.get("cf-connecting-ip") || "", token: bearerToken(req) });
  } catch (e) {
    // 0014 uygulanmadıysa tablo yok
    if (/no such (table|column)/i.test(e?.message || "")) return fail("not_ready", 503, origin);
    console.log("gen", name, e?.message?.slice(0, 120));
    return fail("server", 500, origin);
  }
}

// Saatlik cron (index.js scheduled): 2 günden eski sayaç satırları silinir; gen_daily süresiz kalır. 1 D1 ifadesi.
export async function genCleanup(env) {
  if (!env?.DB) return;
  try {
    await env.DB.prepare("DELETE FROM gen_usage WHERE day < date('now', '-2 days')").run();
  } catch (e) {
    if (!/no such table/i.test(e?.message || "")) throw e;
  }
}
