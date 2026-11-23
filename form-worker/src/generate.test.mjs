// node --test src/generate.test.mjs — A2-2: /gen/* (generate.js, llm.js, gen-prompt.js). Gerçek Anthropic/Turnstile
// çağrısı yok: fetch 6. parametreyle sahte verilir. D1 yerine node:sqlite; 0014_gen.sql aşağıda gömülü.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "cloudflare:sockets") return { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true };
    if (spec === "cloudflare:email") return { url: "data:text/javascript,export class EmailMessage{}", shortCircuit: true };
    return next(spec, ctx);
  },
});

const { generate, genCleanup, ipPrefix, resetAt, genDay } = await import("./generate.js");
const { parse, LlmError } = await import("./llm.js");
const { neutralize, ANGLES } = await import("./gen-prompt.js");
const worker = (await import("./index.js")).default;

const SQL_0014 = `
CREATE TABLE IF NOT EXISTS gen_usage (day TEXT NOT NULL, key TEXT NOT NULL, kind TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, key)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS gen_daily (day TEXT PRIMARY KEY,
  ok INTEGER NOT NULL DEFAULT 0, fail INTEGER NOT NULL DEFAULT 0, refused INTEGER NOT NULL DEFAULT 0, busy INTEGER NOT NULL DEFAULT 0,
  refine_ok INTEGER NOT NULL DEFAULT 0, tok_in INTEGER NOT NULL DEFAULT 0, tok_out INTEGER NOT NULL DEFAULT 0,
  uniq_anon INTEGER NOT NULL DEFAULT 0, anon_full INTEGER NOT NULL DEFAULT 0, ip_full INTEGER NOT NULL DEFAULT 0, cap_hit INTEGER NOT NULL DEFAULT 0,
  ret0 INTEGER NOT NULL DEFAULT 0, ret1 INTEGER NOT NULL DEFAULT 0, ret2_7 INTEGER NOT NULL DEFAULT 0, ret8 INTEGER NOT NULL DEFAULT 0,
  copy_ok INTEGER NOT NULL DEFAULT 0, copy_fb INTEGER NOT NULL DEFAULT 0, share INTEGER NOT NULL DEFAULT 0,
  qc_limit INTEGER NOT NULL DEFAULT 0, qc_result INTEGER NOT NULL DEFAULT 0, qc_error INTEGER NOT NULL DEFAULT 0, qc_cap INTEGER NOT NULL DEFAULT 0,
  qc_top INTEGER NOT NULL DEFAULT 0, qc_footer INTEGER NOT NULL DEFAULT 0, qc_calendly INTEGER NOT NULL DEFAULT 0) WITHOUT ROWID;
`;

// D1 benzeri: batch tek işlem, her ifade için RETURNING satırları results'ta döner
function d1(db) {
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })), success: true }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes) } }; },
  });
  // senkron gövde: araya başka istek giremez (D1 batch'i gibi atomik)
  const batch = async list => {
    db.exec("BEGIN");
    try {
      const out = list.map(s => ({ results: db.prepare(s.sql).all(...s.args).map(r => ({ ...r })), success: true, meta: {} }));
      db.exec("COMMIT");
      return out;
    } catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  return { prepare: sql => stmt(sql), batch };
}

function freshDb(tables = true) {
  const db = new DatabaseSync(":memory:");
  if (tables) db.exec(SQL_0014);
  return db;
}

const ORIGIN = "https://app.socialmediacorner.co";
const ANON = "11111111-2222-4333-8444-555555555555";
const ANON2 = "66666666-7777-4888-9999-aaaaaaaaaaaa";
let ridN = 0;
const rid = () => `00000000-0000-4000-8000-${String(++ridN).padStart(12, "0")}`;

const okDrafts = (order = ANGLES) => order.map(a => ({ angle: a, text: `Taslak ${a}` }));
const llmBody = (drafts, extra = {}) => ({ id: "msg_x", model: "claude-sonnet-5-5", stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ drafts }) }], usage: { input_tokens: 100, output_tokens: 200 }, ...extra });

// sahte fetch: siteverify ve api.anthropic.com; çağrılar kaydedilir. llm: dizi ise sırayla tüketilir
function fakeFetch({ bot = true, llm = () => ({ status: 200, body: llmBody(okDrafts()) }) } = {}) {
  const calls = { verify: [], llm: [] };
  const queue = Array.isArray(llm) ? [...llm] : null;
  const f = async (url, init) => {
    if (url.startsWith("https://challenges.cloudflare.com/")) {
      calls.verify.push(Object.fromEntries(new URLSearchParams(String(init.body))));
      return Response.json({ success: bot });
    }
    if (url === "https://api.anthropic.com/v1/messages") {
      calls.llm.push({ headers: init.headers, body: JSON.parse(init.body) });
      const r = queue ? queue.shift() : llm(calls.llm.length);
      return new Response(typeof r.body === "string" ? r.body : JSON.stringify(r.body), { status: r.status, headers: r.headers || {} });
    }
    throw new Error("beklenmeyen fetch " + url);
  };
  return { f, calls };
}

function setup({ db = freshDb(), env: extra = {}, fetch: ff = fakeFetch() } = {}) {
  const env = { DB: d1(db), GEN_ENABLED: "1", ANTHROPIC_API_KEY: "test-key", GEN_SALT: "test-salt", TURNSTILE_SECRET: "test-secret", GEN_MODEL: "claude-sonnet-5-5", GEN_PER_DAY: "3", GEN_IP_PER_DAY: "10", GEN_DAILY_CAP: "300", ...extra };
  const pending = [];
  const ctx = { waitUntil: p => pending.push(p) };
  const call = async (path, body, { ip = "203.0.113.7", origin = ORIGIN, method = "POST", raw, cl } = {}) => {
    const s = raw ?? (body === undefined ? "" : JSON.stringify(body));
    const headers = { "content-type": "application/json", "cf-connecting-ip": ip };
    if (cl !== null) headers["content-length"] = cl ?? String(Buffer.byteLength(s));
    const req = new Request(`https://forms.test${path}`, { method, headers, body: method === "GET" ? undefined : s });
    const res = await generate(req, new URL(req.url), env, origin, ctx, { fetch: ff.f });
    await Promise.all(pending.splice(0));
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
  };
  const gen = (o = {}, opts) => call("/gen/linkedin", { anon: ANON, topic: "Yeni ürün lansmanı", sector: "Yazılım", tone: "samimi", goal: "", lang: "tr", rid: rid(), t: 4000, ts: "tok", hp: "", ...o }, opts);
  const usage = kind => db.prepare("SELECT key, n FROM gen_usage WHERE kind = ? ORDER BY n DESC").all(kind).map(r => Number(r.n));
  const daily = () => { const r = db.prepare("SELECT * FROM gen_daily").get(); return r ? { ...r } : null; };
  return { db, env, ctx, call, gen, usage, daily, calls: ff.calls };
}

test("bayrak kapalı ya da secret eksik → 503 not_ready, LLM çağrısı yok", async () => {
  for (const extra of [{ GEN_ENABLED: "0" }, { GEN_ENABLED: undefined }, { ANTHROPIC_API_KEY: "" }, { GEN_SALT: undefined }, { TURNSTILE_SECRET: "" }]) {
    const s = setup({ env: extra });
    const r = await s.gen();
    assert.equal(r.status, 503);
    assert.deepEqual([r.body.error, r.body.charged], ["not_ready", false]);
    assert.equal(s.calls.verify.length + s.calls.llm.length, 0);
  }
});

test("index.js /gen/* yönlendirmesi: canlı varsayılan (GEN_ENABLED 0) → 503, app alt alanı izinli", async () => {
  const env = { DB: d1(freshDb()), ALLOWED_HOSTS: "socialmediacorner.co,app.socialmediacorner.co", GEN_ENABLED: "0" };
  const s = JSON.stringify({ anon: ANON });
  const req = new Request("https://forms.test/gen/quota", { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json", "content-length": String(Buffer.byteLength(s)) }, body: s });
  const res = await worker.fetch(req, env, { waitUntil() {} });
  assert.equal(res.status, 503);
  assert.equal(res.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal((await res.json()).error, "not_ready");
});

test("index.js önizleme origin'i yalnız harfli web-*.pages.dev (A0 §2); canlı ALLOWED_HOSTS'la app izinli değil", async () => {
  const env = { DB: d1(freshDb()), ALLOWED_HOSTS: "socialmediacorner.co", GEN_ENABLED: "0" };
  const acao = async o => (await worker.fetch(new Request("https://forms.test/submit", { method: "OPTIONS", headers: { origin: o } }), env, { waitUntil() {} })).headers.get("access-control-allow-origin");
  assert.equal(await acao("https://web-smcapp.pages.dev"), "https://web-smcapp.pages.dev");
  assert.equal(await acao("https://abc123.web-smcapp.pages.dev"), "https://abc123.web-smcapp.pages.dev");
  assert.equal(await acao("https://web-smc-app.pages.dev"), null);
  assert.equal(await acao("https://x.web-smcapp-1a2.pages.dev"), null);
  assert.equal(await acao("https://app.socialmediacorner.co"), null);
  assert.equal(await (async () => { env.ALLOWED_HOSTS = (await import("node:fs")).readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8").match(/^ALLOWED_HOSTS\s*=\s*"([^"]*)"/m)[1]; return acao("https://app.socialmediacorner.co"); })(), "https://app.socialmediacorner.co"); // A3-1: wrangler.toml ALLOWED_HOSTS'ta app izinli
});

test("0014 uygulanmadıysa → 503 not_ready; genCleanup tablo yokken sessiz", async () => {
  const s = setup({ db: freshDb(false) });
  const r = await s.gen();
  assert.equal(r.status, 503);
  assert.equal(r.body.error, "not_ready");
  assert.equal(s.calls.llm.length, 0);
  await genCleanup(s.env);
});

test("yol, yöntem, origin", async () => {
  const s = setup();
  assert.equal((await s.call("/gen/nope", {})).status, 404);
  assert.equal((await s.call("/gen/linkedin", undefined, { method: "GET" })).status, 404);
  const r = await s.gen({}, { origin: null });
  assert.equal(r.status, 403);
  assert.equal(r.body.error, "origin");
  assert.equal(r.headers.get("access-control-allow-origin"), null);
});

test("413: content-length yok, büyük ya da yalan; okumadan reddedilir", async () => {
  const s = setup();
  const big = JSON.stringify({ anon: ANON, topic: "x".repeat(5000) });
  for (const opts of [{ cl: null }, { raw: big }, { raw: big, cl: "100" }]) {
    const r = await s.call("/gen/linkedin", undefined, opts);
    assert.equal(r.status, 413, JSON.stringify(opts.cl));
    assert.deepEqual([r.body.error, r.body.charged], ["too_large", false]);
  }
  // refine sınırı 16 KB: 5 KB gövde geçer (doğrulamaya kadar)
  const r = await s.call("/gen/refine", undefined, { raw: big });
  assert.notEqual(r.status, 413);
  assert.equal(s.calls.verify.length + s.calls.llm.length, 0);
  assert.equal(s.usage("anon").length, 0);
});

test("bal küpü dolu → 400 hp; Turnstile ve LLM çağrılmaz, sayaç yazılmaz", async () => {
  const s = setup();
  const r = await s.gen({ hp: "http://spam" });
  assert.equal(r.status, 400);
  assert.deepEqual([r.body.error, r.body.field, r.body.charged], ["bad_input", "hp", false]);
  assert.equal(s.calls.verify.length + s.calls.llm.length, 0);
  assert.equal(s.db.prepare("SELECT count(*) c FROM gen_usage").get().c, 0);
});

test("doğrulama: alan adlı 400, kısa süre 429 slow_down", async () => {
  const s = setup();
  const cases = [
    [{ anon: "x" }, "anon"], [{ topic: "   " }, "topic"], [{ topic: "a".repeat(301) }, "topic"], [{ sector: "Bilinmez" }, "sector"],
    [{ tone: "kızgın" }, "tone"], [{ goal: "g".repeat(201) }, "goal"], [{ lang: "de" }, "lang"], [{ rid: undefined }, "rid"], [{ rid: "abc" }, "rid"],
  ];
  for (const [o, field] of cases) {
    const r = await s.gen(o);
    assert.equal(r.status, 400, field);
    assert.equal(r.body.field, field);
  }
  // NFC dışı sektör adı normalize edilip kabul edilir; kontrol karakteri temizlenir
  assert.equal((await s.gen({ sector: "Yazılım".normalize("NFD"), topic: "\u0000Konu​" })).status, 200);
  for (const t of [undefined, 900, "4000", Infinity]) {
    const r = await s.gen({ t });
    assert.equal(r.status, 429);
    assert.equal(r.body.error, "slow_down");
  }
  const bad = await s.call("/gen/linkedin", undefined, { raw: "{bozuk" });
  assert.deepEqual([bad.status, bad.body.error], [400, "bad_input"]);
});

test("Turnstile başarısız → 403 bot; sayaç yazılmaz, Anthropic çağrılmaz", async () => {
  const s = setup({ fetch: fakeFetch({ bot: false }) });
  const r = await s.gen({}, { ip: "198.51.100.4" });
  assert.equal(r.status, 403);
  assert.deepEqual([r.body.error, r.body.charged], ["bot", false]);
  assert.deepEqual(s.calls.verify, [{ secret: "test-secret", response: "tok", remoteip: "198.51.100.4" }]);
  assert.equal(s.calls.llm.length, 0);
  assert.equal(s.db.prepare("SELECT count(*) c FROM gen_usage").get().c, 0);
  // ts yoksa siteverify'a gidilmeden bot
  const s2 = setup();
  assert.equal((await s2.gen({ ts: undefined })).body.error, "bot");
  assert.equal(s2.calls.verify.length, 0);
});

test("başarı: 3 taslak açı sırasında, istek gövdesi sözleşmesi, sayaçlar ve gen_daily", async () => {
  const s = setup({ fetch: fakeFetch({ llm: () => ({ status: 200, body: llmBody(okDrafts(["gorus", "hikaye", "liste"])) }) }) });
  const r = await s.gen({ ret: "ret2_7" });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
  assert.deepEqual(r.body.drafts.map(d => d.angle), ANGLES);
  assert.deepEqual({ ...r.body, drafts: undefined }, { ok: true, drafts: undefined, charged: true, left: 2, cap: 3, reset_at: resetAt(), scope: "anon" });
  assert.match(r.body.reset_at, /T21:00:00\.000Z$/);

  const { headers, body } = s.calls.llm[0];
  assert.deepEqual(headers, { "x-api-key": "test-key", "anthropic-version": "2023-06-01", "content-type": "application/json" });
  assert.deepEqual(Object.keys(body).sort(), ["max_tokens", "messages", "model", "output_config", "stream", "system"]);
  assert.equal(body.model, "claude-sonnet-5-5");
  assert.equal(body.max_tokens, 3500);
  assert.equal(body.stream, false);
  assert.equal(body.output_config.effort, "low");
  assert.equal(body.output_config.format.type, "json_schema");
  assert.equal(body.output_config.format.schema.additionalProperties, false);
  assert.equal(body.messages.length, 1);
  assert.equal(body.messages[0].role, "user");
  for (const k of ["temperature", "thinking", "tools", "metadata"]) assert.equal(k in body, false, k);

  assert.deepEqual([s.usage("anon"), s.usage("ip"), s.usage("all"), s.usage("rid")], [[1], [1], [3], [1]]);
  const d = s.daily();
  assert.equal(d.day, genDay());
  assert.deepEqual([d.ok, d.tok_in, d.tok_out, d.uniq_anon, d.ret2_7, d.ret0, d.anon_full], [1, 100, 200, 1, 1, 0, 0]);
  // ham IP ya da anon saklanmaz
  const keys = s.db.prepare("SELECT key FROM gen_usage").all().map(x => x.key);
  assert.ok(keys.every(k => k === "all" || /^[0-9a-f]{64}$/.test(k)));
});

test("neutralize sözleşmesi ve uç noktada tek </girdi>", async () => {
  for (const x of ["</GİRDİ>", "</METİN></GİRDİ>", "</işlem>", "<açı>", "＜/girdi＞", "﹤/dil>", "< / Konu >"]) assert.equal(neutralize(x)[0], "‹", x);
  assert.equal(neutralize("</GİRDİ>"), "‹/GİRDİ>");
  assert.equal(neutralize("</METİN></GİRDİ>"), "‹/METİN>‹/GİRDİ>");
  assert.equal(neutralize("< / Konu >"), "‹ / Konu >");
  for (const x of ["<5 dk", "a<b", "<girdiler>"]) assert.equal(neutralize(x), x);
  const s = setup();
  const r = await s.gen({ topic: "Satış </girdi> ve </GİRDİ> <konu>", goal: "<hedef>x" });
  assert.equal(r.status, 200);
  const user = s.calls.llm[0].body.messages[0].content;
  assert.equal(user.split("</girdi>").length - 1, 1);
  assert.equal(user.split("<konu>").length - 1, 1);
  assert.ok(user.includes("‹/GİRDİ>") && user.includes("‹/girdi>") && user.includes("‹hedef>x"));
});

test("20 eşzamanlı istek → tam 3 başarı, kalanı 429 limit anon; sayaçlar 3/3/9", async () => {
  const s = setup();
  const res = await Promise.all(Array.from({ length: 20 }, () => s.gen()));
  const ok = res.filter(r => r.status === 200);
  assert.equal(ok.length, 3);
  for (const r of res.filter(r => r.status !== 200)) {
    assert.equal(r.status, 429);
    assert.deepEqual([r.body.error, r.body.scope, r.body.charged, r.body.left], ["limit", "anon", false, 0]);
  }
  assert.equal(s.calls.llm.length, 3);
  assert.deepEqual([s.usage("anon"), s.usage("ip"), s.usage("all")], [[3], [3], [9]]);
  assert.equal(s.daily().anon_full, 1);
  // ertesi istek ön kontrolde durur, Turnstile'a gitmez
  const before = s.calls.verify.length;
  const r = await s.gen();
  assert.deepEqual([r.status, r.body.scope], [429, "anon"]);
  assert.equal(s.calls.verify.length, before);
});

test("IP ve global sınırları; cap_hit tek sefer", async () => {
  const s = setup({ env: { GEN_IP_PER_DAY: "2", GEN_DAILY_CAP: "9" } });
  assert.equal((await s.gen({ anon: ANON })).status, 200);
  assert.equal((await s.gen({ anon: ANON2 })).status, 200);
  const r = await s.gen({ anon: "bbbbbbbb-7777-4888-9999-aaaaaaaaaaaa" });
  assert.deepEqual([r.status, r.body.scope, r.body.left], [429, "ip", 0]);
  assert.equal(s.daily().ip_full, 1);
  const g = await s.gen({ anon: "cccccccc-7777-4888-9999-aaaaaaaaaaaa" }, { ip: "2001:db8:1:2:aaaa::1" });
  assert.equal(g.status, 200);
  assert.equal(g.body.left, 0);
  assert.equal(g.body.scope, "global");
  assert.equal(s.daily().cap_hit, 1);
  const h = await s.gen({ anon: "dddddddd-7777-4888-9999-aaaaaaaaaaaa" }, { ip: "2001:db8:9::1" });
  assert.deepEqual([h.status, h.body.scope], [429, "global"]);
  assert.equal(s.daily().cap_hit, 1);
});

test("ipPrefix: IPv6 /64, IPv4 aynen; resetAt İstanbul gece yarısı", () => {
  assert.equal(ipPrefix("1.2.3.4"), "1.2.3.4");
  assert.equal(ipPrefix("2001:db8:1:2:3:4:5:6"), "2001:db8:1:2::/64");
  assert.equal(ipPrefix("2001:0DB8:0001:0002::9"), "2001:db8:1:2::/64");
  assert.equal(ipPrefix("2001:db8::1"), "2001:db8:0:0::/64");
  assert.equal(ipPrefix("::ffff:10.0.0.1"), "10.0.0.1");
  assert.equal(resetAt(Date.parse("2026-11-23T20:59:00Z")), "2026-11-23T21:00:00.000Z");
  assert.equal(resetAt(Date.parse("2026-11-23T21:00:00Z")), "2026-11-24T21:00:00.000Z");
  assert.equal(genDay(Date.parse("2026-11-23T21:30:00Z")), "2026-11-24");
});

test("llm_busy (529 iki kez) → 503, rid dahil tam iade, charged false", async () => {
  const busy = { status: 529, body: { type: "error", error: { type: "overloaded_error" } }, headers: { "retry-after": "0" } };
  const s = setup({ fetch: fakeFetch({ llm: [busy, busy] }) });
  const r = await s.gen();
  assert.equal(r.status, 503);
  assert.deepEqual([r.body.error, r.body.charged, r.body.left], ["llm_busy", false, 3]);
  assert.equal(s.calls.llm.length, 2);
  assert.deepEqual([s.usage("anon"), s.usage("ip"), s.usage("all"), s.usage("rid")], [[0], [0], [0], [0]]);
  assert.equal(s.daily().busy, 1);
  // harcama sınırı: yeniden denenmez, llm_limit, tam iade
  const s2 = setup({ fetch: fakeFetch({ llm: [{ status: 429, body: { error: { type: "rate_limit_error", message: "You have reached your spend limit" } } }] }) });
  const r2 = await s2.gen();
  assert.deepEqual([r2.status, r2.body.error, r2.body.charged], [503, "llm_limit", false]);
  assert.equal(s2.calls.llm.length, 1);
  assert.deepEqual(s2.usage("anon"), [0]);
});

test("busy sonra başarı: tek yeniden deneme yeter", async () => {
  const s = setup({ fetch: fakeFetch({ llm: [{ status: 500, body: "x", headers: { "retry-after": "0" } }, { status: 200, body: llmBody(okDrafts()) }] }) });
  const r = await s.gen();
  assert.equal(r.status, 200);
  assert.equal(s.calls.llm.length, 2);
});

test("bağlantı hatası denenmez (çift fatura riski) → 503 llm_busy tam iade; zaman aşımı denenmez → llm_fail", async () => {
  const s = setup({ fetch: fakeFetch({ llm: () => { throw new TypeError("Network connection lost"); } }) });
  const r = await s.gen();
  assert.deepEqual([r.status, r.body.error, r.body.charged, r.body.left], [503, "llm_busy", false, 3]);
  assert.equal(s.calls.llm.length, 1);
  assert.deepEqual([s.usage("anon"), s.usage("ip"), s.usage("all"), s.usage("rid")], [[0], [0], [0], [0]]);
  assert.equal(s.daily().busy, 1);
  const t = setup({ fetch: fakeFetch({ llm: () => { throw new DOMException("zaman aşımı", "TimeoutError"); } }) });
  const u = await t.gen();
  assert.deepEqual([u.status, u.body.error, u.body.charged], [502, "llm_fail", false]);
  assert.equal(t.calls.llm.length, 1);
});

test("llm_fail: günün ilki anon iadesi (charged false), ikincisi charged true; IP ve global iade edilmez", async () => {
  const s = setup({ fetch: fakeFetch({ llm: () => ({ status: 200, body: llmBody(okDrafts(), { stop_reason: "max_tokens" }) }) }) });
  const a = await s.gen();
  assert.deepEqual([a.status, a.body.error, a.body.charged, a.body.left], [502, "llm_fail", false, 3]);
  assert.deepEqual([s.usage("anon"), s.usage("ip"), s.usage("all")], [[0], [1], [3]]);
  const b = await s.gen();
  assert.deepEqual([b.status, b.body.error, b.body.charged, b.body.left], [502, "llm_fail", true, 2]);
  assert.deepEqual([s.usage("anon"), s.usage("ip"), s.usage("all")], [[1], [2], [6]]);
  const d = s.daily();
  assert.deepEqual([d.fail, d.tok_in, d.tok_out, d.ok], [2, 200, 400, 0]);
});

test("ret (stop_reason refusal) → 422 refused; 400 parametre hatası → llm_fail", async () => {
  const s = setup({ fetch: fakeFetch({ llm: [{ status: 200, body: llmBody([], { stop_reason: "refusal", content: [] }) }, { status: 400, body: { error: { type: "invalid_request_error" } } }] }) });
  const r = await s.gen();
  assert.deepEqual([r.status, r.body.error, r.body.charged], [422, "refused", false]);
  const f = await s.gen();
  assert.deepEqual([f.status, f.body.error, f.body.charged], [502, "llm_fail", true]);
  assert.equal(s.calls.llm.length, 2);
  assert.deepEqual([s.daily().refused, s.daily().fail], [1, 1]);
});

test("şema sözleşmesi (parse)", () => {
  const kind = (data, count = 3, angle) => { try { parse(data, count, angle); return "ok"; } catch (e) { assert.ok(e instanceof LlmError); return e.kind; } };
  const raw = text => ({ stop_reason: "end_turn", content: [{ type: "text", text }], usage: {} });
  assert.equal(kind(llmBody(okDrafts())), "ok");
  assert.equal(kind(raw("{bozuk")), "fail");
  assert.equal(kind(raw(JSON.stringify({ nope: [] }))), "fail");
  assert.equal(kind(llmBody(okDrafts().slice(0, 2))), "fail");
  assert.equal(kind(llmBody([...okDrafts(), { angle: "liste", text: "fazla" }])), "fail");
  assert.equal(kind(llmBody([{ angle: "hikaye", text: "a" }, { angle: "hikaye", text: "b" }, { angle: "liste", text: "c" }])), "fail");
  assert.equal(kind(llmBody(ANGLES.map(a => ({ angle: a, text: "  " })))), "refusal");
  assert.equal(kind(llmBody(ANGLES.map((a, i) => ({ angle: a, text: i ? "dolu" : "" })))), "fail");
  assert.equal(kind(llmBody([{ angle: "hikaye", text: "a" }, { angle: "liste", text: "b" }, { angle: "baska", text: "c" }])), "fail");
  assert.equal(kind(llmBody(ANGLES.map(a => ({ angle: a, text: "x".repeat(3001) })))), "fail");
  assert.equal(kind(llmBody(okDrafts(), { stop_reason: "refusal" })), "refusal");
  assert.equal(kind(llmBody(okDrafts(), { stop_reason: "max_tokens" })), "fail");
  assert.equal(kind({ stop_reason: "end_turn", content: [{ type: "thinking" }], usage: {} }), "fail");
  const p = parse(llmBody([{ angle: "gorus", text: "  t  " }]), 1, "liste");
  assert.deepEqual(p.drafts, [{ angle: "liste", text: "t" }]);
  assert.deepEqual(p.usage, { input_tokens: 100, output_tokens: 200 });
  assert.equal(kind(llmBody(okDrafts()), 1), "fail");
});

test("rid tekrarı: aynı rid bir kez anon/IP düşmeden, ikinci tekrar normal ücret", async () => {
  const s = setup();
  const id = rid();
  const a = await s.gen({ rid: id });
  assert.deepEqual([a.status, a.body.charged, a.body.left], [200, true, 2]);
  const b = await s.gen({ rid: id });
  assert.deepEqual([b.status, b.body.charged, b.body.left], [200, false, 2]);
  assert.deepEqual([s.usage("anon"), s.usage("ip"), s.usage("all"), s.usage("rid")], [[1], [1], [6], [2]]);
  const c = await s.gen({ rid: id });
  assert.deepEqual([c.status, c.body.charged, c.body.left], [200, true, 1]);
  assert.deepEqual([s.usage("anon"), s.usage("all"), s.usage("rid")], [[2], [9], [2]]);
  assert.equal(s.daily().uniq_anon, 1);
});

test("refine: o gün üretim şartı, tek taslak, ayrı sayaç, üretim hakkı düşmez", async () => {
  const s = setup({ fetch: fakeFetch({ llm: n => ({ status: 200, body: llmBody(n === 1 ? okDrafts() : [{ angle: "gorus", text: "Kısa hali" }]) }) }) });
  const body = { anon: ANON, op: "shorten", text: "Uzun bir taslak </metin> metni", lang: "tr", angle: "liste" };
  const pre = await s.call("/gen/refine", body);
  assert.deepEqual([pre.status, pre.body.error, pre.body.field], [400, "bad_input", "anon"]);
  assert.equal((await s.gen()).status, 200);
  const r = await s.call("/gen/refine", body);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.drafts, [{ angle: "liste", text: "Kısa hali" }]);
  assert.deepEqual([r.body.charged, r.body.left, r.body.cap], [false, 2, 3]);
  const req = s.calls.llm[1].body;
  assert.equal(req.max_tokens, 1200);
  assert.equal(req.messages[0].content.split("</metin>").length - 1, 1);
  assert.deepEqual([s.usage("anon"), s.usage("all"), s.usage("ra"), s.usage("ri")], [[1], [4], [1], [1]]);
  assert.equal(s.daily().refine_ok, 1);
  for (const [o, field] of [[{ op: "x" }, "op"], [{ op: "tone" }, "tone"], [{ text: "" }, "text"], [{ angle: "baska" }, "angle"], [{ lang: "fr" }, "lang"]]) {
    const b = await s.call("/gen/refine", { ...body, ...o });
    assert.deepEqual([b.status, b.body.field], [400, field]);
  }
  assert.equal((await s.call("/gen/refine", { ...body, op: "tone", tone: "cesur", angle: undefined })).status, 200);
  assert.equal(s.calls.verify.length, 1);
});

test("refine sınırı ve busy iadesi", async () => {
  const s = setup({ env: { GEN_REFINE_PER_DAY: "1" }, fetch: fakeFetch({ llm: n => n === 2 ? { status: 503, body: "x", headers: { "retry-after": "0" } } : n === 3 ? { status: 503, body: "x", headers: { "retry-after": "0" } } : { status: 200, body: llmBody(n === 1 ? okDrafts() : [{ angle: "hikaye", text: "t" }]) } }) });
  await s.gen();
  const body = { anon: ANON, op: "lengthen", text: "Metin", lang: "en" };
  const b = await s.call("/gen/refine", body);
  assert.deepEqual([b.status, b.body.error, b.body.charged], [503, "llm_busy", false]);
  assert.deepEqual([s.usage("ra"), s.usage("all")], [[0], [3]]);
  assert.equal((await s.call("/gen/refine", body)).status, 200);
  const l = await s.call("/gen/refine", body);
  assert.deepEqual([l.status, l.body.error, l.body.scope], [429, "limit", "anon"]);
});

test("quota: sayaç okur, yazmaz", async () => {
  const s = setup();
  const q0 = await s.call("/gen/quota", { anon: ANON });
  assert.deepEqual(q0.body, { ok: true, charged: false, left: 3, cap: 3, reset_at: resetAt(), scope: "anon" });
  await s.gen();
  const q1 = await s.call("/gen/quota", { anon: ANON });
  assert.equal(q1.body.left, 2);
  assert.equal((await s.call("/gen/quota", { anon: "x" })).status, 400);
  assert.equal(s.calls.verify.length, 1);
});

test("event: yalnız üretim yapmış anon, quote_click anon+src başına 1, 204 CORS", async () => {
  const s = setup();
  const e0 = await s.call("/gen/event", { anon: ANON, kind: "copy_ok" });
  assert.equal(e0.status, 204);
  assert.equal(e0.body, null);
  assert.equal(s.daily(), null);
  await s.gen();
  const e1 = await s.call("/gen/event", { anon: ANON, kind: "copy_ok" });
  assert.equal(e1.status, 204);
  assert.equal(e1.headers.get("access-control-allow-origin"), ORIGIN);
  await s.call("/gen/event", { anon: ANON, kind: "share" });
  await s.call("/gen/event", { anon: ANON, kind: "quote_click", src: "top" });
  await s.call("/gen/event", { anon: ANON, kind: "quote_click", src: "top" });
  await s.call("/gen/event", { anon: ANON, kind: "quote_click", src: "calendly" });
  const d = s.daily();
  assert.deepEqual([d.copy_ok, d.share, d.qc_top, d.qc_calendly, d.copy_fb], [1, 1, 1, 1, 0]);
  for (const [b, field] of [[{ kind: "x" }, "kind"], [{ kind: "quote_click" }, "src"], [{ kind: "copy_ok", src: "nope" }, "src"]]) {
    const r = await s.call("/gen/event", { anon: ANON, ...b });
    assert.deepEqual([r.status, r.body.field], [400, field]);
  }
});

test("event günde 30 ile sınırlı", async () => {
  const s = setup();
  await s.gen();
  for (let i = 0; i < 32; i++) await s.call("/gen/event", { anon: ANON, kind: "copy_fb" });
  assert.equal(s.daily().copy_fb, 30);
});

test("genCleanup 2 günden eski satırları siler", async () => {
  const s = setup();
  s.db.prepare("INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, ?, ?)").run("2000-01-01", "k1", "anon", 1);
  s.db.prepare("INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, ?, ?)").run(genDay(), "k2", "anon", 1);
  await genCleanup(s.env);
  assert.deepEqual(s.db.prepare("SELECT key FROM gen_usage").all().map(r => r.key), ["k2"]);
});
