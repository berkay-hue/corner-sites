// node --test src/demo.test.mjs — A15 demo planı (14 günlük deneme): oturumsuz /gen/* 401, smc kaydı plan demo (brandcorner.co
// değişmez), demo toplam hakları (4 LinkedIn+Blog, 1 video+görsel), 14 gün sonra trial_ended (üretim/refine 403, quota ve
// /auth/me trial_ended), ay dönümünde demo sayacı sıfırlanmaz, admin demo→basic sonrası basic kotası, CMS run demo kotası.
// D1 yerine node:sqlite; gerçek ağ yok: Anthropic/Turnstile fetch sahte (genel fetch çağrılırsa test düşer).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";
import { createHash } from "node:crypto";

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "cloudflare:sockets") return { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true };
    if (spec === "cloudflare:email") return { url: "data:text/javascript,export class EmailMessage{}", shortCircuit: true };
    return next(spec, ctx);
  },
});

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
// Genel fetch yalnız platform.js kayıt Turnstile'ı için (sahte başarılı); başka her çağrı test hatası
globalThis.fetch = async u => {
  if (String(u) === SITEVERIFY) return Response.json({ success: true });
  throw new Error("gerçek ağ çağrısı yasak: " + u);
};

const { generate, genDay } = await import("./generate.js");
const { platform } = await import("./platform.js");
const { PROVIDERS } = await import("./cms-providers.js");
const { ANGLES, SYSTEM_REFINE, SYSTEM_BLOG, SYSTEM_VIDEO } = await import("./gen-prompt.js");
const { PLANS, TRIAL_DAYS } = await import("./plans.js");

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const SCHEMA = read("../schema.sql");
const MIGS = ["0001_metrics", "0002_oauth", "0003_sync", "0004_sync_changes", "0006_posts", "0018_plans", "0019_cms"].map(n => read(`../migrations/${n}.sql`));

// D1 taklidi: generate.js (batch sonuçları results), platform.js ve cms.js (meta.changes) için ortak
function d1(db) {
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })), success: true }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes), last_row_id: Number(i.lastInsertRowid) } }; },
    raw: () => ({ sql, args }),
  });
  const batch = async list => {
    db.exec("BEGIN");
    try {
      const out = list.map(s => {
        const p = db.prepare(s.sql);
        if (p.columns().length) return { results: p.all(...s.args).map(r => ({ ...r })), success: true, meta: {} };
        const i = p.run(...s.args);
        return { results: [], success: true, meta: { changes: Number(i.changes) } };
      });
      db.exec("COMMIT");
      return out;
    } catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  return { prepare: sql => stmt(sql), batch };
}

const APP = "https://app.socialmediacorner.co", BC = "https://brandcorner.co", SMC = "app.socialmediacorner.co";
const ANON = "11111111-2222-4333-8444-555555555555";
const hash = t => createHash("sha256").update(t).digest("hex");
const tok = ch => ch.repeat(43);
const sqlTime = ms => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
const DAY = 864e5;
let ridN = 0;
const rid = () => `00000000-0000-4000-8000-${String(++ridN).padStart(12, "0")}`;

// 1 (A): smc yöneticisi, basic. Demo kullanıcıları addDemo ile.
function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  for (const m of MIGS) db.exec(m);
  const uid = Number(db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, 'yonetici@ornek.test', 'Yönetici', 'brand', 'x')").run(SMC).lastInsertRowid);
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(hash(tok("A")), uid);
  db.prepare("INSERT INTO user_perms (user_id, perm) VALUES (?, 'admin')").run(uid);
  return db;
}
// demo kullanıcı: created_at = createdMs (varsayılan şimdi − 1 saat); döner {id, token}
function addDemo(db, ch, createdMs = Date.now() - 3600e3) {
  const id = Number(db.prepare("INSERT INTO users (site, email, name, role, pass, plan, created_at) VALUES (?, ?, 'Demo', 'brand', 'x', 'demo', ?)")
    .run(SMC, `${ch.toLowerCase()}@ornek.test`, sqlTime(createdMs)).lastInsertRowid);
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(hash(tok(ch)), id);
  return { id, token: tok(ch) };
}

const llmBody = drafts => ({ id: "msg_x", model: "claude-sonnet-5-5", stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ drafts }) }], usage: { input_tokens: 100, output_tokens: 200 } });
const drafts = system => system === SYSTEM_REFINE ? [{ angle: ANGLES[0], text: "Kısa hali" }]
  : system.startsWith(SYSTEM_BLOG) ? [{ angle: "blog", title: "Başlık", meta: "Açıklama", text: "## Bölüm\n\nParagraf." }]
  : system.startsWith(SYSTEM_VIDEO) ? [{ angle: "video", title: "Başlık", scenes: Array.from({ length: 6 }, (_, i) => ({ text: `Sahne ${i}`, sub: "", secs: 5 })), caption: "Açıklama" }]
  : ANGLES.map(a => ({ angle: a, text: `Taslak ${a}` }));
// generate.js io.fetch sahtesi (Workers gibi nesne metodu olarak çağrılırsa Illegal invocation)
function fakeFetch() {
  const calls = { verify: 0, llm: 0 };
  const f = async function (url, init) {
    if (this !== undefined) throw new TypeError("Illegal invocation");
    if (url.startsWith("https://challenges.cloudflare.com/")) { calls.verify++; return Response.json({ success: true }); }
    if (url === "https://api.anthropic.com/v1/messages") { calls.llm++; return Response.json(llmBody(drafts(JSON.parse(init.body).system))); }
    throw new Error("beklenmeyen fetch " + url);
  };
  return { f, calls };
}

function setup(db = freshDb(), extra = {}) {
  const env = {
    DB: d1(db), PBKDF2_ITER: "10000", ACCOUNTS_ENABLED: "1", GEN_LOGIN_REQUIRED: "1", GEN_ENABLED: "1", ANTHROPIC_API_KEY: "test-key",
    GEN_SALT: "test-salt", TURNSTILE_SECRET: "test-secret", GEN_MODEL: "claude-sonnet-5-5", GEN_PER_DAY: "3", GEN_IP_PER_DAY: "10",
    GEN_DAILY_CAP: "3000", GEN_USER_PER_DAY: "1000", CMS_ENABLED: "1", OAUTH_TOKEN_KEY: Buffer.alloc(32, 7).toString("base64"), ...extra,
  };
  const ff = fakeFetch(), pending = [], ctx = { waitUntil: p => pending.push(p) };
  const gcall = async (path, body, token) => {
    const s = JSON.stringify(body);
    const headers = { "content-type": "application/json", "cf-connecting-ip": "203.0.113.7", "content-length": String(Buffer.byteLength(s)) };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method: "POST", headers, body: s });
    const res = await generate(req, new URL(req.url), env, APP, ctx, { fetch: ff.f });
    await Promise.all(pending.splice(0));
    return { status: res.status, body: JSON.parse(await res.text()) };
  };
  const pcall = async (method, path, { token, body, origin = APP, ip = "10.0.0.1" } = {}) => {
    const headers = { "cf-connecting-ip": ip, "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const res = await platform(req, new URL(req.url), env, origin, async () => {});
    return { status: res.status, body: await res.json() };
  };
  const seed = (uid, kind, n, m = genDay().slice(0, 7)) => db.prepare("INSERT INTO gen_month (month, user_id, kind, n) VALUES (?, ?, ?, ?)").run(m, uid, kind, n);
  const month = (uid, kind, m = genDay().slice(0, 7)) => Number(db.prepare("SELECT n FROM gen_month WHERE month = ? AND user_id = ? AND kind = ?").get(m, uid, kind)?.n ?? 0);
  return { db, env, gcall, pcall, seed, month, calls: ff.calls };
}

const common = o => ({ anon: ANON, topic: "Yeni ürün lansmanı", sector: "Yazılım", tone: "samimi", lang: "tr", rid: rid(), t: 4000, ts: "tok", hp: "", ...o });
const GEN = {
  linkedin: () => ["/gen/linkedin", common()],
  blog: () => ["/gen/blog", common({ length: "short" })],
  video: () => ["/gen/video", common({ kind: "video", length: "30" })],
  instagram: () => ["/gen/instagram", common({ kind: "caption", sector: "E-ticaret", format: "post" })],
};
const gen = (s, platformName, token) => { const [p, b] = GEN[platformName](); return s.gcall(p, b, token); };
const quota = (s, token) => s.gcall("/gen/quota", { anon: ANON }, token);
const refineBody = () => ({ anon: ANON, text: "Uzun bir taslak metni", op: "shorten", lang: "tr", angle: ANGLES[0] });

// Date.now'ı geçici sabitle
async function at(iso, fn) {
  const real = Date.now;
  Date.now = () => Date.parse(iso);
  try { return await fn(); } finally { Date.now = real; }
}

// ---- oturumsuz ----

test("A15 anon: /gen/* 401 login_required (LLM/Turnstile yok, sayaç yok); /gen/quota left 0 plan anon", async () => {
  const s = setup();
  for (const p of Object.keys(GEN)) {
    const r = await gen(s, p);
    assert.deepEqual([r.status, r.body.ok, r.body.error], [401, false, "login_required"], p);
  }
  const rf = await s.gcall("/gen/refine", refineBody());
  assert.deepEqual([rf.status, rf.body.error], [401, "login_required"]);
  assert.deepEqual(s.calls, { verify: 0, llm: 0 });
  assert.equal(s.db.prepare("SELECT COUNT(*) AS c FROM gen_usage").get().c, 0);
  const q = await quota(s);
  assert.equal(q.status, 200);
  assert.deepEqual([q.body.left, q.body.plan, q.body.login_required, q.body.trial_ended], [0, "anon", true, undefined]);
});

// ---- kayıt ----

test("A15 kayıt: smc → plan demo, /auth/me plan demo + trial_ends_at (created_at + 14 gün), trial_ended false; brandcorner.co → değişmez", async () => {
  const s = setup();
  const body = { name: "Yeni", email: "yeni@ornek.test", password: "sifre-12345", consent: true, ai_consent: true, ts: "ts-ok", hp: "", t: 2000 };
  const r = await s.pcall("POST", "/auth/register", { body, ip: "10.0.5.1" });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const row = s.db.prepare("SELECT plan, created_at FROM users WHERE id = ?").get(r.body.user.id);
  assert.equal(row.plan, "demo");
  const me = await s.pcall("GET", "/auth/me", { token: r.body.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.plan, "demo");
  assert.equal(me.body.user.trial_ended, false);
  assert.equal(Date.parse(me.body.user.trial_ends_at), Date.parse(row.created_at.replace(" ", "T") + "Z") + TRIAL_DAYS * DAY);
  // yeni demo kullanıcının kotası: 4 / 1
  const q = await quota(s, r.body.token);
  assert.deepEqual([q.body.plan, q.body.month.linkedin_blog.limit, q.body.month.video_gorsel.limit, q.body.trial_ended], ["demo", 4, 1, false]);

  // brandcorner.co: sütun varsayılanı (basic), /auth/me'de plan alanı yok
  const b = await s.pcall("POST", "/auth/register", { origin: BC, ip: "10.0.5.2", body: { name: "Marka", email: "marka@ornek.test", password: "sifre-12345", role: "brand", consent: true, hp: "", t: 2000 } });
  assert.equal(b.status, 200, JSON.stringify(b.body));
  assert.equal(s.db.prepare("SELECT plan FROM users WHERE id = ?").get(b.body.user.id).plan, "basic");
  const bme = await s.pcall("GET", "/auth/me", { token: b.body.token, origin: BC });
  assert.equal(bme.status, 200);
  for (const k of ["plan", "trial_ends_at", "trial_ended"]) assert.equal(bme.body.user[k], undefined, k);
});

// ---- demo kotası ----

test("A15 demo: 4 LinkedIn+Blog geçer, 5. → 429 plan (LLM yok); 1 video geçer, 2. (görsel) → 429 plan", async () => {
  const s = setup();
  const d = addDemo(s.db, "D");
  for (let i = 1; i <= 4; i++) {
    const r = await gen(s, i === 3 ? "blog" : "linkedin", d.token);
    assert.equal(r.status, 200, `lb ${i}: ${JSON.stringify(r.body)}`);
    assert.equal(r.body.plan, "demo");
    assert.deepEqual(r.body.month.linkedin_blog, { used: i, limit: 4 });
    assert.equal(r.body.trial_ended, false);
  }
  const llm = s.calls.llm;
  const r5 = await gen(s, "linkedin", d.token);
  assert.equal(r5.status, 429);
  assert.deepEqual([r5.body.error, r5.body.scope, r5.body.kind, r5.body.left], ["limit", "plan", "linkedin_blog", 0]);
  assert.equal((await gen(s, "blog", d.token)).status, 429);
  assert.equal(s.calls.llm, llm);
  assert.equal(s.month(d.id, "lb"), 4);

  const v = await gen(s, "video", d.token);
  assert.equal(v.status, 200, JSON.stringify(v.body));
  assert.deepEqual(v.body.month.video_gorsel, { used: 1, limit: 1 });
  const v2 = await gen(s, "instagram", d.token);
  assert.deepEqual([v2.status, v2.body.scope, v2.body.kind], [429, "plan", "video_gorsel"]);
  assert.equal((await gen(s, "video", d.token)).status, 429);
  assert.equal(s.month(d.id, "vg"), 1);
  const q = await quota(s, d.token);
  assert.deepEqual([q.body.left, q.body.plan, q.body.trial_ended], [0, "demo", false]);
  assert.ok(q.body.trial_ends_at);
});

// ---- 14 gün ----

test("A15 demo 14 gün: 13. günde üretir; 14 gün dolunca üretim/refine 403 trial_ended (sayaç/LLM yok), quota ve /auth/me trial_ended true", async () => {
  const s = setup();
  const now = Date.now();
  const fresh = addDemo(s.db, "F", now - (TRIAL_DAYS * DAY - 3600e3)); // bitişe 1 saat var
  const old = addDemo(s.db, "O", now - (TRIAL_DAYS * DAY + 60e3)); // 1 dakika önce bitti
  assert.equal((await gen(s, "linkedin", fresh.token)).status, 200);

  const before = { ...s.calls };
  for (const p of Object.keys(GEN)) {
    const r = await gen(s, p, old.token);
    assert.deepEqual([r.status, r.body.error, r.body.plan, r.body.trial_ended], [403, "trial_ended", "demo", true], p);
    assert.ok(r.body.trial_ends_at, p);
  }
  const rf = await s.gcall("/gen/refine", refineBody(), old.token);
  assert.deepEqual([rf.status, rf.body.error], [403, "trial_ended"]);
  assert.deepEqual(s.calls, before);
  assert.equal(s.db.prepare("SELECT COUNT(*) AS c FROM gen_month WHERE user_id = ?").get(old.id).c, 0);

  const q = await quota(s, old.token);
  assert.equal(q.status, 200);
  assert.deepEqual([q.body.plan, q.body.left, q.body.trial_ended], ["demo", 0, true]);
  assert.equal(Date.parse(q.body.trial_ends_at), Date.parse(sqlTime(now - (TRIAL_DAYS * DAY + 60e3)).replace(" ", "T") + "Z") + TRIAL_DAYS * DAY);
  const me = await s.pcall("GET", "/auth/me", { token: old.token });
  assert.deepEqual([me.body.user.plan, me.body.user.trial_ended], ["demo", true]);
  const fq = await quota(s, fresh.token);
  assert.deepEqual([fq.body.trial_ended, fq.body.left], [false, 3]);
});

// ---- ay dönümü ----

test("A15 demo ay dönümü (Europe/Istanbul): Kasım'da harcanan hak 1 Aralık'ta sıfırlanmaz; toplam 4/1 sürer", async () => {
  await at("2026-11-30T20:59:00Z", async () => { // İstanbul 30 Kasım 23:59
    const s = setup();
    const d = addDemo(s.db, "D", Date.parse("2026-11-25T09:00:00Z"));
    s.seed(d.id, "lb", 3, "2026-11");
    s.seed(d.id, "vg", 1, "2026-11");
    const q0 = await quota(s, d.token);
    assert.deepEqual(q0.body.month, { linkedin_blog: { used: 3, limit: 4 }, video_gorsel: { used: 1, limit: 1 } });

    Date.now = () => Date.parse("2026-11-30T21:00:00Z"); // İstanbul 1 Aralık 00:00
    assert.equal(genDay().slice(0, 7), "2026-12");
    const q1 = await quota(s, d.token);
    assert.deepEqual(q1.body.month, { linkedin_blog: { used: 3, limit: 4 }, video_gorsel: { used: 1, limit: 1 } });
    assert.equal(q1.body.left, 1);
    const a = await gen(s, "linkedin", d.token);
    assert.equal(a.status, 200, JSON.stringify(a.body));
    assert.deepEqual(a.body.month.linkedin_blog, { used: 4, limit: 4 });
    const b = await gen(s, "linkedin", d.token);
    assert.deepEqual([b.status, b.body.scope, b.body.kind], [429, "plan", "linkedin_blog"]);
    assert.deepEqual(b.body.month.linkedin_blog, { used: 4, limit: 4 });
    const v = await gen(s, "video", d.token);
    assert.deepEqual([v.status, v.body.kind], [429, "video_gorsel"]);
    assert.deepEqual([s.month(d.id, "lb", "2026-11"), s.month(d.id, "lb", "2026-12"), s.month(d.id, "vg", "2026-12")], [3, 1, 0]);
    // basic kullanıcı aynı durumda yeni ayda sıfırdan başlar (karşılaştırma)
    s.seed(1, "lb", 8, "2026-11");
    assert.equal((await gen(s, "linkedin", tok("A"))).status, 200);
  });
});

// ---- admin demo → basic ----

test("A15 admin: demo (bitmiş) → basic sonrası deneme sınırı kalkar, basic aylık kotası (8/2) geçerli; basic → demo deneme süresini uzatmaz", async () => {
  const s = setup();
  const d = addDemo(s.db, "D", Date.now() - 20 * DAY);
  s.seed(d.id, "lb", 4);
  assert.equal((await gen(s, "linkedin", d.token)).body.error, "trial_ended");

  const r = await s.pcall("POST", `/app/admin/${d.id}/plan`, { token: tok("A"), body: { plan: "basic" } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual([r.body.plan, r.body.limits.plan, r.body.limits.linkedin_blog, r.body.limits.trial_ended], ["basic", "basic", PLANS.basic.linkedin_blog, undefined]);
  const me = await s.pcall("GET", "/auth/me", { token: d.token });
  assert.deepEqual([me.body.user.plan, me.body.user.trial_ended, me.body.user.trial_ends_at], ["basic", undefined, undefined]);
  const q = await quota(s, d.token);
  assert.deepEqual([q.body.plan, q.body.trial_ended, q.body.month.linkedin_blog, q.body.month.video_gorsel], ["basic", undefined, { used: 4, limit: 8 }, { used: 0, limit: 2 }]);
  for (let i = 5; i <= 8; i++) {
    const g = await gen(s, "linkedin", d.token);
    assert.equal(g.status, 200, `lb ${i}: ${JSON.stringify(g.body)}`);
    assert.deepEqual(g.body.month.linkedin_blog, { used: i, limit: 8 });
  }
  assert.deepEqual([(await gen(s, "linkedin", d.token)).body.scope], ["plan"]);
  for (let i = 1; i <= 2; i++) assert.equal((await gen(s, "video", d.token)).status, 200, `vg ${i}`);
  assert.equal((await gen(s, "instagram", d.token)).status, 429);

  // geri demo: deneme created_at'ten sayılır → hemen bitmiş
  const back = await s.pcall("POST", `/app/admin/${d.id}/plan`, { token: tok("A"), body: { plan: "demo" } });
  assert.equal(back.status, 200, JSON.stringify(back.body));
  assert.deepEqual([back.body.plan, back.body.limits.trial_ended], ["demo", true]);
  assert.ok(back.body.limits.trial_ends_at);
  assert.equal((await gen(s, "linkedin", d.token)).body.error, "trial_ended");
});

// ---- CMS (otomatik blog) demo ----

// C1 (24.11): blog otomatiği Pro'dan itibaren; demo cms_sites 0 → connect/run 403 plan_required {plan:"pro"}, sayaç düşmez
test("A15 CMS demo: connect ve run 403 plan_required (pro); liste limits kilitli + quota trial alanları; disconnect serbest", async t => {
  const hp = PROVIDERS.hubspot, orig = hp.probe;
  hp.probe = async inputs => ({ ok: true, account: { name: "Blog", url: "https://blog.example.test" }, options: {}, config: {}, creds: { api_key: inputs.api_key } });
  t.after(() => { hp.probe = orig; });
  const RID = "123e4567-e89b-42d3-a456-426614174000";
  await at("2026-12-02T09:00:00Z", async () => {
    const s = setup();
    const d = addDemo(s.db, "D", Date.parse("2026-11-25T09:00:00Z"));
    const body = { platform: "hubspot", inputs: { api_key: "x".repeat(16) + "ABCD" } };
    const c = await s.pcall("POST", "/app/cms/connect", { token: d.token, body });
    assert.deepEqual([c.status, c.body.ok, c.body.error, c.body.plan], [403, false, "plan_required", "pro"]);
    assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM cms_sites").get().n, 0);
    // pro iken bağlanmış site, demoya düşünce üretmez
    s.db.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").run(d.id);
    const ok = await s.pcall("POST", "/app/cms/connect", { token: d.token, body });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    s.db.prepare("UPDATE users SET plan = 'demo' WHERE id = ?").run(d.id);
    const id = ok.body.site.id;
    const run = await s.pcall("POST", `/app/cms/${id}/run`, { token: d.token, body: { rid: RID } });
    assert.deepEqual([run.status, run.body.error, run.body.plan], [403, "plan_required", "pro"]);
    assert.equal(s.month(d.id, "lb", "2026-12"), 0);
    const l = await s.pcall("GET", "/app/cms", { token: d.token });
    assert.equal(l.status, 200);
    assert.deepEqual(l.body.limits, { sites: 0, used: 1, per_week_max: 0, plan_required: "pro" });
    assert.deepEqual([l.body.quota.lb_limit, l.body.quota.trial_ended], [4, false]);
    assert.ok(l.body.quota.trial_ends_at);
    const dis = await s.pcall("POST", `/app/cms/${id}/disconnect`, { token: d.token, body: {} });
    assert.equal(dis.status, 200, JSON.stringify(dis.body));
  });
});
