// node --test src/gen-plans.test.mjs — A9b: girişli kullanıcı plan kotaları (gen_month aylık lb|vg, kullanıcı günlük tavanı 'u',
// global tavan), iade, refine, /gen/quota plan alanları, ACCOUNTS kapalı / 0018 yok → anonim akış.
// Gerçek Anthropic/Turnstile çağrısı yok: fetch sahte (Workers gibi nesne metodu olarak çağrılırsa Illegal invocation).
// D1 yerine node:sqlite; şema schema.sql + migrations/0018_plans.sql.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "cloudflare:sockets") return { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true };
    if (spec === "cloudflare:email") return { url: "data:text/javascript,export class EmailMessage{}", shortCircuit: true };
    return next(spec, ctx);
  },
});

const { generate, genCleanup, genDay } = await import("./generate.js");
const { ANGLES, SYSTEM_REFINE, SYSTEM_BLOG, SYSTEM_VIDEO } = await import("./gen-prompt.js");

const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const MIG18 = readFileSync(new URL("../migrations/0018_plans.sql", import.meta.url), "utf8");

function d1(db) {
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })), success: true }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes) } }; },
  });
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

const APP = "https://app.socialmediacorner.co";
const ANON = "11111111-2222-4333-8444-555555555555";
const ANON2 = "66666666-7777-4888-8999-aaaaaaaaaaaa";
const IP = "203.0.113.7";
const hash = t => createHash("sha256").update(t).digest("hex");
// kullanıcılar (id sırasıyla): 1 basic, 2 pro, 3 enterprise (sözleşme 5/2), 4 enterprise (plan_limits bozuk → pro sayıları)
const TOK = { basic: "B".repeat(43), pro: "P".repeat(43), ent: "E".repeat(43), ent0: "F".repeat(43) };
const auth = who => ({ auth: `Bearer ${TOK[who]}` });
let ridN = 0;
const rid = () => `00000000-0000-4000-8000-${String(++ridN).padStart(12, "0")}`;

const llmBody = drafts => ({ id: "msg_x", model: "claude-sonnet-5-5", stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ drafts }) }], usage: { input_tokens: 100, output_tokens: 200 } });
const drafts = system => system === SYSTEM_REFINE ? [{ angle: ANGLES[0], text: "Kısa hali" }]
  : system.startsWith(SYSTEM_BLOG) ? [{ angle: "blog", title: "Başlık", meta: "Açıklama", text: "## Bölüm\n\nParagraf." }]
  : system.startsWith(SYSTEM_VIDEO) ? [{ angle: "video", title: "Başlık", scenes: Array.from({ length: 6 }, (_, i) => ({ text: `Sahne ${i}`, sub: "", secs: 5 })), caption: "Açıklama" }]
  : ANGLES.map(a => ({ angle: a, text: `Taslak ${a}` }));

// llm(n, body) → {status, body, headers?}; varsayılan başarılı yanıt
function fakeFetch({ bot = true, llm } = {}) {
  const calls = { verify: 0, llm: 0 };
  const f = async function (url, init) {
    if (this !== undefined) throw new TypeError("Illegal invocation");
    if (url.startsWith("https://challenges.cloudflare.com/")) { calls.verify++; return Response.json({ success: bot }); }
    if (url === "https://api.anthropic.com/v1/messages") {
      const body = JSON.parse(init.body);
      calls.llm++;
      const r = llm ? llm(calls.llm, body) : { status: 200, body: llmBody(drafts(body.system)) };
      return new Response(typeof r.body === "string" ? r.body : JSON.stringify(r.body), { status: r.status, headers: r.headers || {} });
    }
    throw new Error("beklenmeyen fetch " + url);
  };
  return { f, calls };
}

function freshDb({ mig18 = true } = {}) {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  if (mig18) db.exec(MIG18);
  const users = [["basic", "basic", null], ["pro", "pro", null], ["ent", "enterprise", '{"linkedin_blog":5,"video_gorsel":2}'], ["ent0", "enterprise", "{bozuk"]];
  for (const [who, plan, lim] of users) {
    const uid = mig18
      ? db.prepare("INSERT INTO users (site, email, name, role, pass, plan, plan_limits) VALUES ('app.socialmediacorner.co', ?, 'Ad', 'brand', 'x', ?, ?)").run(`${who}@ornek.test`, plan, lim).lastInsertRowid
      : db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES ('app.socialmediacorner.co', ?, 'Ad', 'brand', 'x')").run(`${who}@ornek.test`).lastInsertRowid;
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(hash(TOK[who]), Number(uid));
  }
  return db;
}

function setup({ db = freshDb(), env: extra = {}, fetch: ff = fakeFetch() } = {}) {
  const env = { DB: d1(db), GEN_ENABLED: "1", ACCOUNTS_ENABLED: "1", ANTHROPIC_API_KEY: "test-key", GEN_SALT: "test-salt", TURNSTILE_SECRET: "test-secret", GEN_MODEL: "claude-sonnet-5-5", GEN_PER_DAY: "3", GEN_IP_PER_DAY: "10", GEN_DAILY_CAP: "3000", GEN_USER_PER_DAY: "1000", ...extra };
  const pending = [];
  const ctx = { waitUntil: p => pending.push(p) };
  const call = async (path, body, { auth: a, ip = IP } = {}) => {
    const s = JSON.stringify(body);
    const headers = { "content-type": "application/json", "cf-connecting-ip": ip, "content-length": String(Buffer.byteLength(s)) };
    if (a) headers.authorization = a;
    const req = new Request(`https://forms.test${path}`, { method: "POST", headers, body: s });
    const res = await generate(req, new URL(req.url), env, APP, ctx, { fetch: ff.f });
    await Promise.all(pending.splice(0));
    return { status: res.status, body: JSON.parse(await res.text()) };
  };
  const month = (uid, kind, m = genDay().slice(0, 7)) => Number(db.prepare("SELECT n FROM gen_month WHERE month = ? AND user_id = ? AND kind = ?").get(m, uid, kind)?.n ?? 0);
  const usage = kind => db.prepare("SELECT n FROM gen_usage WHERE kind = ? ORDER BY n").all(kind).map(r => Number(r.n));
  const seed = (uid, kind, n, m = genDay().slice(0, 7)) => db.prepare("INSERT INTO gen_month (month, user_id, kind, n) VALUES (?, ?, ?, ?)").run(m, uid, kind, n);
  return { db, env, call, month, usage, seed, calls: ff.calls };
}

const common = o => ({ anon: ANON, topic: "Yeni ürün lansmanı", sector: "Yazılım", tone: "samimi", lang: "tr", rid: rid(), t: 4000, ts: "tok", hp: "", ...o });
const GEN = {
  linkedin: () => ["/gen/linkedin", common()],
  blog: () => ["/gen/blog", common({ length: "short" })],
  video: () => ["/gen/video", common({ kind: "video", length: "30" })],
  instagram: () => ["/gen/instagram", common({ kind: "caption", sector: "E-ticaret", format: "post" })],
};
const gen = (s, platform, opt) => { const [p, b] = GEN[platform](); return s.call(p, b, opt); };

test("basic: 8. LinkedIn+Blog üretimi geçer, 9. → 429 limit scope plan kind linkedin_blog; LLM çağrılmaz; video_gorsel ayrı (2)", async () => {
  const s = setup();
  for (let i = 1; i <= 8; i++) {
    const r = await gen(s, i % 4 === 0 ? "blog" : "linkedin", auth("basic"));
    assert.equal(r.status, 200, `üretim ${i}`);
    assert.equal(r.body.charged, true);
    assert.deepEqual(r.body.month.linkedin_blog, { used: i, limit: 8 });
    assert.equal(r.body.plan, "basic");
  }
  assert.equal(s.month(1, "lb"), 8);
  const llm = s.calls.llm;
  const r = await gen(s, "linkedin", auth("basic"));
  assert.equal(r.status, 429);
  assert.deepEqual([r.body.error, r.body.scope, r.body.kind, r.body.left, r.body.charged], ["limit", "plan", "linkedin_blog", 0, false]);
  assert.deepEqual(r.body.month, { linkedin_blog: { used: 8, limit: 8 }, video_gorsel: { used: 0, limit: 2 } });
  assert.equal((await gen(s, "blog", auth("basic"))).body.kind, "linkedin_blog");
  assert.equal(s.calls.llm, llm);
  // görsel + video aynı 'vg' sayacından
  for (let i = 1; i <= 2; i++) assert.equal((await gen(s, i % 2 ? "video" : "instagram", auth("basic"))).status, 200, `vg ${i}`);
  const v = await gen(s, "instagram", auth("basic"));
  assert.deepEqual([v.status, v.body.scope, v.body.kind], [429, "plan", "video_gorsel"]);
  assert.equal(s.month(1, "vg"), 2);
  // girişli yol anon/IP sayaçlarına dokunmaz
  assert.deepEqual([s.usage("anon"), s.usage("ip")], [[], []]);
  assert.deepEqual(s.usage("u"), [10]);
});

test("pro: 40 LinkedIn+Blog ve 12 video+görsel; sonrası 429 plan; başka kullanıcının sayacı ayrı", async () => {
  const s = setup();
  for (let i = 1; i <= 40; i++) assert.equal((await gen(s, i % 2 ? "linkedin" : "blog", auth("pro"))).status, 200, `lb ${i}`);
  const r = await gen(s, "linkedin", auth("pro"));
  assert.deepEqual([r.status, r.body.scope, r.body.kind, r.body.plan], [429, "plan", "linkedin_blog", "pro"]);
  s.seed(2, "vg", 11);
  const ok = await gen(s, "video", auth("pro"));
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body.month.video_gorsel, { used: 12, limit: 12 });
  assert.equal((await gen(s, "instagram", auth("pro"))).body.scope, "plan");
  assert.equal((await gen(s, "linkedin", auth("basic"))).status, 200);
  assert.deepEqual([s.month(2, "lb"), s.month(2, "vg"), s.month(1, "lb")], [40, 12, 1]);
});

test("enterprise: plan_limits sözleşme sayıları; JSON bozuksa pro sayıları; stock açık", async () => {
  const s = setup({ env: { PEXELS_API_KEY: "k" } });
  for (let i = 1; i <= 5; i++) assert.equal((await gen(s, "linkedin", auth("ent"))).status, 200);
  const r = await gen(s, "blog", auth("ent"));
  assert.deepEqual([r.status, r.body.scope, r.body.plan], [429, "plan", "enterprise"]);
  assert.deepEqual(r.body.month, { linkedin_blog: { used: 5, limit: 5 }, video_gorsel: { used: 0, limit: 2 } });
  const q = await s.call("/gen/quota", { anon: ANON }, auth("ent0"));
  assert.deepEqual([q.body.plan, q.body.month.linkedin_blog.limit, q.body.month.video_gorsel.limit, q.body.stock], ["enterprise", 40, 12, true]);
});

test("ay dönümü (Europe/Istanbul): 30 Kasım 23:59'da dolu hak 1 Aralık 00:00'da sıfırdan başlar", async () => {
  const real = Date.now;
  try {
    Date.now = () => Date.parse("2026-11-30T20:59:00Z"); // İstanbul 23:59
    const s = setup();
    s.seed(1, "lb", 8, "2026-11");
    const a = await gen(s, "linkedin", auth("basic"));
    assert.deepEqual([a.status, a.body.scope], [429, "plan"]);
    Date.now = () => Date.parse("2026-11-30T21:00:00Z"); // İstanbul 1 Aralık 00:00
    const b = await gen(s, "linkedin", auth("basic"));
    assert.equal(b.status, 200);
    assert.deepEqual(b.body.month.linkedin_blog, { used: 1, limit: 8 });
    assert.deepEqual([s.month(1, "lb", "2026-11"), s.month(1, "lb", "2026-12")], [8, 1]);
  } finally {
    Date.now = real;
  }
});

test("girişliyken anon/IP günlük sınırı uygulanmaz: aynı IP ve anon kimliği dolu olsa da üretim sürer", async () => {
  const s = setup({ env: { GEN_PER_DAY: "1", GEN_IP_PER_DAY: "2" } });
  assert.equal((await gen(s, "linkedin")).status, 200);
  const anon2 = await s.call("/gen/linkedin", common({ anon: ANON2 }));
  assert.equal(anon2.status, 200);
  const blocked = await s.call("/gen/linkedin", common({ anon: "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff" }));
  assert.deepEqual([blocked.status, blocked.body.scope], [429, "ip"]);
  assert.deepEqual([(await gen(s, "linkedin")).status, (await gen(s, "linkedin")).body.scope], [429, "anon"]);
  for (let i = 0; i < 5; i++) assert.equal((await gen(s, "linkedin", auth("basic"))).status, 200, `girişli ${i}`);
  assert.deepEqual(s.usage("ip"), [2]);
});

test("global tavan girişliyken de geçerli: dolunca 429 scope global, aylık hak düşmez", async () => {
  const s = setup({ env: { GEN_DAILY_CAP: "9" } });
  for (let i = 0; i < 3; i++) assert.equal((await gen(s, "linkedin", auth("pro"))).status, 200);
  const r = await gen(s, "linkedin", auth("pro"));
  assert.deepEqual([r.status, r.body.error, r.body.scope, r.body.left], [429, "limit", "global", 0]);
  assert.equal(s.month(2, "lb"), 3);
  assert.deepEqual(s.usage("all"), [9]);
});

test("kullanıcı günlük tavanı (GEN_USER_PER_DAY) → 429 scope user; varsayılan 40", async () => {
  const s = setup({ env: { GEN_USER_PER_DAY: "2" } });
  assert.equal((await gen(s, "linkedin", auth("pro"))).status, 200);
  const b = await gen(s, "video", auth("pro"));
  assert.deepEqual([b.status, b.body.cap, b.body.left], [200, 2, 0]);
  const r = await gen(s, "blog", auth("pro"));
  assert.deepEqual([r.status, r.body.scope, r.body.cap], [429, "user", 2]);
  assert.equal(r.body.kind, undefined);
  assert.deepEqual([s.month(2, "lb"), s.month(2, "vg"), s.usage("u")[0]], [1, 1, 2]);
  // başka kullanıcı etkilenmez
  assert.equal((await gen(s, "linkedin", auth("basic"))).status, 200);
  // varsayılan 40 (A13: pro aylık 40 olduğundan günlük tavanı görmek için 1 günlük kullanım tohumlanır)
  const d = setup({ env: { GEN_USER_PER_DAY: undefined } });
  d.db.prepare("INSERT INTO gen_month (month, user_id, kind, n) VALUES (?, 2, 'lb', 0)").run(genDay().slice(0, 7));
  const q0 = await d.call("/gen/quota", { anon: ANON }, auth("pro"));
  assert.deepEqual([q0.body.cap, q0.body.left, q0.body.scope], [40, 40, "plan"]);
  assert.equal((await gen(d, "video", auth("pro"))).status, 200);
  const q = await d.call("/gen/quota", { anon: ANON }, auth("pro"));
  assert.deepEqual([q.body.cap, q.body.left, q.body.scope], [40, 39, "user"]);
});

test("aynı rid tekrarı: aylık hak ve kullanıcı tavanından düşmez (charged false), global düşer", async () => {
  const s = setup();
  const [p, b] = GEN.linkedin();
  assert.equal((await s.call(p, b, auth("basic"))).body.charged, true);
  const r = await s.call(p, b, auth("basic"));
  assert.deepEqual([r.status, r.body.charged], [200, false]);
  assert.deepEqual([s.month(1, "lb"), s.usage("u"), s.usage("all")], [1, [1], [6]]);
});

test("iade: llm_busy → aylık + günlük + global + rid tam iade; llm_fail günün ilki aylık+günlük iade, ikincisi charged true", async () => {
  const busy = { status: 529, body: { type: "error", error: { type: "overloaded_error" } }, headers: { "retry-after": "0" } };
  const s = setup({ fetch: fakeFetch({ llm: () => busy }) });
  const r = await gen(s, "linkedin", auth("basic"));
  assert.deepEqual([r.status, r.body.error, r.body.charged, r.body.left], [503, "llm_busy", false, 8]);
  assert.deepEqual(r.body.month.linkedin_blog, { used: 0, limit: 8 });
  assert.deepEqual([s.month(1, "lb"), s.usage("u"), s.usage("all"), s.usage("rid")], [0, [0], [0], [0]]);

  const bad = { status: 200, body: { ...llmBody(drafts("")), stop_reason: "max_tokens" } };
  const f = setup({ fetch: fakeFetch({ llm: () => bad }) });
  const a = await gen(f, "video", auth("basic"));
  assert.deepEqual([a.status, a.body.error, a.body.charged], [502, "llm_fail", false]);
  assert.deepEqual(a.body.month.video_gorsel, { used: 0, limit: 2 });
  assert.deepEqual([f.month(1, "vg"), f.usage("u"), f.usage("all")], [0, [0], [3]]);
  const b = await gen(f, "video", auth("basic"));
  assert.deepEqual([b.status, b.body.error, b.body.charged], [502, "llm_fail", true]);
  assert.deepEqual([f.month(1, "vg"), f.usage("u"), f.usage("all")], [1, [1], [6]]);
  // rf satırı kullanıcıya bağlı: başka kullanıcının günün ilki yine iade
  const c = await gen(f, "video", auth("pro"));
  assert.equal(c.body.charged, false);
});

test("Turnstile başarısız → 403 bot, hiçbir sayaç artmaz; slow_down hâlâ geçerli", async () => {
  const s = setup({ fetch: fakeFetch({ bot: false }) });
  const r = await gen(s, "linkedin", auth("pro"));
  assert.deepEqual([r.status, r.body.error], [403, "bot"]);
  assert.deepEqual([s.month(2, "lb"), s.usage("u"), s.usage("all")], [0, [], []]);
  const t = setup();
  const [p, b] = GEN.linkedin();
  assert.deepEqual([(await t.call(p, { ...b, t: 100 }, auth("pro"))).body.error, t.calls.llm], ["slow_down", 0]);
});

test("refine girişli: aylık plandan düşmez, IP sayacı yok, kullanıcıya bağlı ra sınırı; o gün üretim şartı", async () => {
  const s = setup({ env: { GEN_REFINE_PER_DAY: "2", GEN_REFINE_IP_PER_DAY: "1" } });
  const ref = { anon: ANON2, op: "shorten", text: "Uzun bir taslak metni", lang: "tr", angle: ANGLES[0] };
  const pre = await s.call("/gen/refine", ref, auth("basic"));
  assert.deepEqual([pre.status, pre.body.field], [400, "anon"]);
  assert.equal((await gen(s, "linkedin", auth("basic"))).status, 200);
  const a = await s.call("/gen/refine", ref, auth("basic"));
  assert.deepEqual([a.status, a.body.charged, a.body.plan], [200, false, "basic"]);
  assert.deepEqual(a.body.month.linkedin_blog, { used: 1, limit: 8 });
  assert.equal((await s.call("/gen/refine", ref, auth("basic"))).status, 200); // ri=1 olsaydı burada takılırdı
  const c = await s.call("/gen/refine", ref, auth("basic"));
  assert.deepEqual([c.status, c.body.scope], [429, "user"]);
  assert.deepEqual([s.month(1, "lb"), s.usage("ri")], [1, []]);
  assert.deepEqual(s.usage("ra"), [2]);
});

test("/gen/quota: girişli plan + month + cap (kullanıcı günlük); anonimde plan anon, month yok, alanlar eskisi gibi", async () => {
  const s = setup({ env: { GEN_USER_PER_DAY: "40", PEXELS_API_KEY: "k" } });
  for (let i = 0; i < 3; i++) await gen(s, "linkedin", auth("basic"));
  await gen(s, "video", auth("basic"));
  const q = await s.call("/gen/quota", { anon: ANON }, auth("basic"));
  assert.equal(q.status, 200);
  assert.deepEqual(Object.keys(q.body).sort(), ["cap", "charged", "left", "month", "ok", "plan", "reset_at", "scope", "stock"]);
  // A13: basic aylık 8/2 günlük 40'tan dar → left = iki türün büyük kalanı (8-3=5), scope plan; cap yine günlük tavan
  assert.deepEqual([q.body.plan, q.body.stock, q.body.cap, q.body.left, q.body.scope], ["basic", false, 40, 5, "plan"]);
  assert.deepEqual(q.body.month, { linkedin_blog: { used: 3, limit: 8 }, video_gorsel: { used: 1, limit: 2 } });
  const p = await s.call("/gen/quota", { anon: ANON }, auth("pro"));
  assert.deepEqual([p.body.plan, p.body.stock, p.body.month.linkedin_blog.limit, p.body.month.video_gorsel.limit], ["pro", true, 40, 12]);
  const n = await s.call("/gen/quota", { anon: ANON });
  assert.deepEqual(Object.keys(n.body).sort(), ["cap", "charged", "left", "ok", "plan", "reset_at", "scope", "stock"]);
  assert.deepEqual([n.body.plan, n.body.stock, n.body.left, n.body.cap, n.body.scope], ["anon", false, 3, 3, "anon"]);
});

test("ACCOUNTS kapalı, jeton geçersiz ya da 0018 yok → anonim akış (anon/IP günlük sayaçlar, gen_month yok)", async () => {
  for (const [name, o, opt] of [
    ["kapalı", { env: { ACCOUNTS_ENABLED: "0" } }, auth("pro")],
    ["geçersiz jeton", {}, { auth: `Bearer ${"Z".repeat(43)}` }],
    ["0018 yok", { db: freshDb({ mig18: false }) }, auth("pro")],
  ]) {
    const s = setup(o);
    for (let i = 1; i <= 3; i++) {
      const r = await gen(s, "linkedin", opt);
      assert.deepEqual([r.status, r.body.left, r.body.cap, r.body.plan, r.body.month], [200, 3 - i, 3, undefined, undefined], name);
    }
    const r = await gen(s, "linkedin", opt);
    assert.deepEqual([r.status, r.body.scope], [429, "anon"], name);
    assert.deepEqual([s.usage("anon"), s.usage("u")], [[3], []], name);
    const q = await s.call("/gen/quota", { anon: ANON }, opt);
    assert.deepEqual([q.body.plan, q.body.month, q.body.stock], ["anon", undefined, false], name);
    if (name !== "0018 yok") assert.equal(s.db.prepare("SELECT COUNT(*) AS c FROM gen_month").get().c, 0, name);
  }
});

test("genCleanup 13 aydan eski aylık sayaçları siler, yenileri kalır; 0018 yoksa sessiz", async () => {
  const s = setup();
  s.seed(1, "lb", 5, "2020-01");
  s.seed(1, "lb", 7, genDay().slice(0, 7));
  await genCleanup(s.env);
  assert.deepEqual(s.db.prepare("SELECT month, n FROM gen_month").all().map(r => [r.month, Number(r.n)]), [[genDay().slice(0, 7), 7]]);
  const old = new DatabaseSync(":memory:");
  old.exec("CREATE TABLE gen_usage (day TEXT NOT NULL, key TEXT NOT NULL, kind TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, key)) WITHOUT ROWID;");
  await genCleanup({ DB: d1(old) });
});

test("A15 GEN_LOGIN_REQUIRED=1: oturumsuz /gen/* 401 login_required (LLM/Turnstile çağrılmaz), /gen/quota left 0 + login_required, /gen/event 401 değil; girişli geçer; bayrak yoksa anonim akış aynen", async () => {
  const s = setup({ env: { GEN_LOGIN_REQUIRED: "1" } });
  for (const p of Object.keys(GEN)) {
    const r = await gen(s, p);
    assert.equal(r.status, 401, p);
    assert.deepEqual([r.body.ok, r.body.error], [false, "login_required"], p);
  }
  for (const [path, body] of [["/gen/refine", { anon: ANON, text: "Metin", op: "shorter", lang: "tr", rid: rid() }]]) {
    const r = await s.call(path, body);
    assert.equal(r.status, 401, path);
    assert.equal(r.body.error, "login_required", path);
  }
  // bozuk/bilinmeyen jeton da oturumsuz sayılır
  assert.equal((await gen(s, "linkedin", { auth: `Bearer ${"Z".repeat(43)}` })).status, 401);
  assert.deepEqual(s.calls, { verify: 0, llm: 0 });
  assert.deepEqual(s.usage("anon"), []);
  const q = await s.call("/gen/quota", { anon: ANON });
  assert.equal(q.status, 200);
  assert.deepEqual([q.body.ok, q.body.left, q.body.plan, q.body.login_required, q.body.charged], [true, 0, "anon", true, false]);
  const req = new Request("https://forms.test/gen/event", { method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": IP }, body: JSON.stringify({ anon: ANON, kind: "copy_ok" }) });
  const ev = await generate(req, new URL(req.url), s.env, APP, { waitUntil() {} }, { fetch: fakeFetch().f });
  assert.notEqual(ev.status, 401);
  // girişli kullanıcı etkilenmez
  const ok = await gen(s, "linkedin", auth("basic"));
  assert.equal(ok.status, 200);
  assert.equal(ok.body.plan, "basic");
  const qb = await s.call("/gen/quota", { anon: ANON }, auth("basic"));
  assert.equal(qb.body.plan, "basic");
  assert.equal(qb.body.login_required, undefined);
  // bayrak kapalı: ziyaretçi eskisi gibi üretir
  const t = setup();
  assert.equal((await gen(t, "linkedin")).status, 200);
});
