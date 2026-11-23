// app.socialmediacorner.co taslak üretimi (A0-KARAR §1, §3-§5): POST /gen/linkedin, /gen/refine, /gen/quota, /gen/event.
// Bayrak GEN_ENABLED="1" + ANTHROPIC_API_KEY, GEN_SALT, TURNSTILE_SECRET + migrations/0014_gen.sql; biri yoksa 503 not_ready.
// Sayaçlar gen_usage'ta (gün Europe/Istanbul, sabit UTC+3; anahtar sha256(salt|gün|tür|değer), global 'all'), ölçüm gen_daily'de.
// Her yanıt `charged` (anon üretim hakkı düştü mü) taşır; sayaç okunduysa {left, cap, reset_at, scope} de.
// LLM sonrası yazımlar (gen_daily, iade) ctx.waitUntil ile. io.fetch testlerde sahte verilir.
import { SYSTEM_GEN, SYSTEM_REFINE, SCHEMA, SECTORS, TONES, LANGS, OPS, ANGLES, MAX, clean, neutralize, userGen, userRefine } from "./gen-prompt.js";
import { makeLlm, LlmError } from "./llm.js";

export const genEnabled = env => env?.GEN_ENABLED === "1" && Boolean(env.ANTHROPIC_API_KEY && env.GEN_SALT && env.TURNSTILE_SECRET);

const UUID = /^[0-9a-f-]{36}$/;
const RET = ["ret0", "ret1", "ret2_7", "ret8"];
const EVENTS = ["copy_ok", "copy_fb", "share", "quote_click"];
const SRCS = ["limit", "result", "error", "cap", "top", "footer", "calendly"];
const DAILY = new Set(["ok", "fail", "refused", "busy", "refine_ok", "tok_in", "tok_out", "uniq_anon", "anon_full", "ip_full", "cap_hit",
  ...RET, "copy_ok", "copy_fb", "share", ...SRCS.map(s => "qc_" + s)]);
const GEN_UNITS = 3, REFINE_UNITS = 1, MIN_T = 1500, EV_PER_DAY = 30;
const BODY_MAX = { linkedin: 4096, refine: 16384, quota: 4096, event: 4096 };
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
  return { v: { anon: b.anon, op, tone, text: t, lang, angle } };
}

async function linkedin(c) {
  const { env, db, body, origin, ctx, io, ip } = c;
  const { field, v } = validateGen(body);
  if (field) return fail("bad_input", 400, origin, { field });
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
    out = await makeLlm(env, io.fetch).generate({
      system: SYSTEM_GEN, schema: SCHEMA, maxTokens: 3500, count: 3,
      user: userGen({ topic: neutralize(v.topic), sector: v.sector, tone: v.tone, goal: v.goal ? neutralize(v.goal) : "", lang: v.lang }),
    });
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
    return json({ ok: true, drafts: out.drafts, charged, ...quota(L, after) }, 200, origin);
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
    out = await makeLlm(env, io.fetch).generate({
      system: SYSTEM_REFINE, schema: SCHEMA, maxTokens: 1200, count: 1, angle: v.angle,
      user: userRefine({ op: v.op, angle: v.angle, tone: v.tone, lang: v.lang, text: neutralize(v.text) }),
    });
  } catch (e) {
    err = e instanceof LlmError ? e : new LlmError("fail", e?.message?.slice(0, 60) || "error");
  }
  if (out) {
    const inc = { refine_ok: 1, tok_in: out.usage.input_tokens, tok_out: out.usage.output_tokens };
    if (L.cap - (after.all - REFINE_UNITS) >= GEN_UNITS && L.cap - after.all < GEN_UNITS) inc.cap_hit = 1;
    await batchLater(ctx, db, [daily(db, day, inc)]);
    return json({ ok: true, drafts: out.drafts, charged: false, ...quota(L, after) }, 200, origin);
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

const ROUTES = { "/gen/linkedin": ["linkedin", linkedin], "/gen/refine": ["refine", refine], "/gen/quota": ["quota", quotaRoute], "/gen/event": ["event", event] };

export async function generate(req, url, env, origin, ctx, io = {}) {
  const route = ROUTES[url.pathname];
  if (!route || req.method !== "POST") return fail("not_found", 404, origin);
  if (!genEnabled(env) || !env.DB) return fail("not_ready", 503, origin);
  if (!origin) return fail("origin", 403, null);
  const [name, handler] = route;
  const { tooLarge, body } = await readBody(req, BODY_MAX[name]);
  if (tooLarge) return fail("too_large", 413, origin);
  try {
    return await handler({ env, db: env.DB, body, origin, ctx, io: { fetch: io.fetch || fetch }, ip: req.headers.get("cf-connecting-ip") || "" });
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
