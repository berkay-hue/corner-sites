// node --test src/smc-admin.test.mjs — A13: app.socialmediacorner.co yönetim uçları (src/platform.js smcAdmin*, src/sites.js APP_ROUTES).
// Kapı: yönetici olmayana 404, brandcorner.co yöneticisi smc'de oturum açamaz, tablo yoksa 503 not_ready; veri c.site ile süzülür;
// plan ucu doğrulaması ve perm_log. brandcorner.co'nun GET /app/admin'i değişmeden çalışır. D1 yerine node:sqlite.
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

const { platform, maskIp } = await import("./platform.js");
const { MISSING } = await import("./oauth.js");
const { APP_ROUTES } = await import("./sites.js");

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const SCHEMA = read("../schema.sql");
const MIGRATIONS = ["0001_metrics", "0002_oauth", "0003_sync", "0004_sync_changes", "0006_posts", "0018_plans"].map(n => read(`../migrations/${n}.sql`));

function d1(db) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })) }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes), last_row_id: Number(i.lastInsertRowid) } }; },
  });
  const batch = async list => { db.exec("BEGIN"); try { const out = []; for (const s of list) out.push(await s.run()); db.exec("COMMIT"); return out; } catch (e) { db.exec("ROLLBACK"); throw e; } };
  return { prepare: sql => stmt(sql), batch };
}

const APP = "https://app.socialmediacorner.co", BC = "https://brandcorner.co", SMC = "app.socialmediacorner.co";
const hash = t => createHash("sha256").update(t).digest("hex");
const tok = ch => ch.repeat(43);
const MONTH = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 7);
const TODAY = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

// smc: yönetici (1, A), üye (2, M), ikinci üye (3); brandcorner.co: yönetici (4, B), üye (5)
function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  for (const m of MIGRATIONS) db.exec(m);
  const u = (site, email, name = email.split("@")[0]) => Number(db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, ?, ?, 'brand', 'x')").run(site, email, name).lastInsertRowid);
  const s = (t, uid) => db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(hash(t), uid);
  s(tok("A"), u(SMC, "yonetici@ornek.test"));
  s(tok("M"), u(SMC, "uye@ornek.test"));
  u(SMC, "ikinci@ornek.test");
  s(tok("B"), u("brandcorner.co", "bcyonetici@ornek.test"));
  u("brandcorner.co", "bcuye@ornek.test");
  db.prepare("INSERT INTO user_perms (user_id, perm) VALUES (1, 'admin'), (4, 'admin')").run();
  return db;
}

function setup(db = freshDb(), extra = {}) {
  const env = { DB: d1(db), PBKDF2_ITER: "10000", ACCOUNTS_ENABLED: "1", ...extra };
  const call = async (method, path, { token, body, origin = APP } = {}) => {
    const headers = { "cf-connecting-ip": "10.0.0.1", "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const res = await platform(req, new URL(req.url), env, origin, async () => {});
    return { status: res.status, body: await res.json() };
  };
  return { db, env, call };
}

const fail = r => [r.status, r.body.error];
const ROUTES = [["GET", "/app/admin"], ["GET", "/app/admin/users"], ["GET", "/app/admin/submissions"], ["GET", "/app/admin/drafts"],
  ["GET", "/app/admin/jobs"], ["POST", "/app/admin/2/plan"]];

test("A13: izin listesinde yönetim uçları var; brandcorner'ın admin/:id/* uçları yok", () => {
  for (const [m, p] of ROUTES) assert.ok(APP_ROUTES.includes(`${m} ${p.replace("/2/", "/:id/")}`), p);
  for (const k of ["GET /app/admin/:id/posts", "POST /app/admin/:id/perm", "POST /app/admin/:id/snap"]) assert.ok(!APP_ROUTES.includes(k), k);
});

test("A13: yönetici olmayana, oturumsuza ve brandcorner yöneticisinin token'ına her uç 404 (gövde bozuk ya da büyük olsa da)", async () => {
  const { env, call } = setup();
  for (const [method, path] of ROUTES) {
    const body = method === "POST" ? { plan: "pro" } : undefined;
    assert.deepEqual(fail(await call(method, path, { token: tok("M"), body })), [404, "not_found"], path);
    assert.deepEqual(fail(await call(method, path, { body })), [404, "not_found"], path);
    assert.deepEqual(fail(await call(method, path, { token: tok("B"), body })), [404, "not_found"], path);
  }
  // Ham gövde: bozuk JSON ve MAX_BODY üstü, yönetici olmayana 400/413 değil 404; yöneticiye 400 json / 413 size
  const raw = async (token, text) => {
    const headers = { "cf-connecting-ip": "10.0.0.1", "content-type": "application/json", ...(token && { authorization: `Bearer ${token}` }) };
    const req = new Request("https://forms.test/app/admin/2/plan", { method: "POST", headers, body: text });
    const res = await platform(req, new URL(req.url), env, APP, async () => {});
    return [res.status, (await res.json()).error];
  };
  for (const text of ["{bozuk", "x".repeat(25000)]) for (const t of [undefined, tok("M"), tok("B")]) assert.deepEqual(await raw(t, text), [404, "not_found"]);
  assert.deepEqual(await raw(tok("A"), "{bozuk"), [400, "json"]);
  assert.deepEqual(await raw(tok("A"), "x".repeat(25000)), [413, "size"]);
  // Oturum gerektiren diğer smc uçları eskisi gibi 401
  assert.deepEqual(fail(await call("GET", "/app/profile")), [401, "auth"]);
  // brandcorner'ın uçları smc'de izin listesi dışı (yöneticiye de)
  for (const [m, p] of [["GET", "/app/admin/2/posts"], ["POST", "/app/admin/2/perm"], ["POST", "/app/admin/2/snap"]])
    assert.deepEqual(fail(await call(m, p, { token: tok("A"), body: m === "POST" ? {} : undefined })), [404, "not_found"], p);
  // Plan değişmedi
  assert.equal(setup().db.prepare("SELECT plan FROM users WHERE id = 2").get().plan, "basic");
});

test("A13: /auth/me smc yöneticisinde admin: true, üyede alan yok", async () => {
  const { call } = setup();
  assert.equal((await call("GET", "/auth/me", { token: tok("A") })).body.user.admin, true);
  assert.equal((await call("GET", "/auth/me", { token: tok("M") })).body.user.admin, undefined);
});

test("A13: brandcorner.co GET /app/admin değişmedi; smc uçları orada 404", async () => {
  const { call } = setup();
  const r = await call("GET", "/app/admin", { token: tok("B"), origin: BC });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(Object.keys(r.body).sort(), ["edits", "meta", "ok", "perm_log", "syncs", "users"]);
  assert.deepEqual(r.body.users.map(u => u.email).sort(), ["bcuye@ornek.test", "bcyonetici@ornek.test"]);
  for (const [method, path] of ROUTES.slice(1)) {
    const res = await call(method, path, { token: tok("B"), origin: BC, body: method === "POST" ? { plan: "pro" } : undefined });
    assert.deepEqual(fail(res), [404, "not_found"], path);
  }
  // smc yöneticisinin token'ı brandcorner'da 401
  assert.deepEqual(fail(await call("GET", "/app/admin", { token: tok("A"), origin: BC })), [401, "auth"]);
});

test("A13: özet yalnız smc kullanıcıları; taslak sayısı, bu ayın sayacı, plan dağılımı, gen_daily, plan geçmişi", async () => {
  const { db, call } = setup();
  db.prepare("INSERT INTO drafts (user_id, site, platform, topic, body) VALUES (2, ?, 'linkedin', 'k', 'g'), (2, ?, 'instagram', 'k', 'g')").run(SMC, SMC);
  db.prepare("INSERT INTO gen_month (month, user_id, kind, n) VALUES (?, 2, 'lb', 3), (?, 2, 'vg', 1), ('2000-01', 2, 'lb', 9), (?, 5, 'lb', 7)").run(MONTH, MONTH, MONTH);
  db.prepare("INSERT INTO gen_daily (day, ok, fail) VALUES (?, 5, 1), ('2000-01-01', 9, 9)").run(TODAY);
  db.prepare("INSERT INTO perm_log (actor_id, user_id, perm, granted) VALUES (4, 5, 'plan:pro', 1), (4, 5, 'edit_metrics', 1)").run();
  const r = await call("GET", "/app/admin", { token: tok("A") });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.month, MONTH);
  assert.deepEqual(r.body.users.map(u => u.email), ["ikinci@ornek.test", "uye@ornek.test", "yonetici@ornek.test"]);
  const uye = r.body.users.find(u => u.id === 2);
  assert.deepEqual([uye.drafts, uye.month, uye.plan, uye.plan_limits, uye.limits.linkedin_blog, uye.admin], [2, { linkedin_blog: 3, video_gorsel: 1 }, "basic", null, r.body.users[0].limits.linkedin_blog, undefined]);
  assert.equal(r.body.users.find(u => u.id === 1).admin, true);
  for (const u of r.body.users) for (const k of ["pass", "profile", "role"]) assert.ok(!(k in u), k);
  assert.deepEqual(r.body.plans, { basic: 3 });
  assert.deepEqual(r.body.gen_month, { linkedin_blog: { n: 3, users: 1 }, video_gorsel: { n: 1, users: 1 } });
  assert.deepEqual(r.body.gen_daily.map(d => [d.day, d.ok]), [[TODAY, 5]]);
  assert.deepEqual(r.body.plan_log, []); // brandcorner kullanıcısının satırı görünmez
  assert.equal(r.body.next, null);
});

test("A13: kullanıcı sayfası 50'lik, ?before imleci; bozuk imleç 400", async () => {
  const { db, call } = setup();
  for (let i = 0; i < 55; i++) db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, ?, 'x', 'brand', 'x')").run(SMC, `u${i}@ornek.test`);
  const a = await call("GET", "/app/admin/users", { token: tok("A") });
  assert.equal(a.body.users.length, 50);
  const b = await call("GET", `/app/admin/users?before=${a.body.next}`, { token: tok("A") });
  assert.equal(b.body.users.length, 8);
  assert.equal(b.body.next, null);
  assert.ok(b.body.users.every(u => u.id < a.body.next));
  assert.ok(![...a.body.users, ...b.body.users].some(u => u.email.startsWith("bc")));
  for (const bad of ["0", "-1", "1.5", "abc", "99999999999999999"])
    assert.deepEqual(fail(await call("GET", `/app/admin/users?before=${bad}`, { token: tok("A") })), [400, "before"], bad);
});

test("A13: form gönderileri smc'nin iki alanından, IP maskeli, user agent yok", async () => {
  const { db, call } = setup();
  const ins = db.prepare("INSERT INTO submissions (site, page, fields, ip, ua, emailed) VALUES (?, ?, ?, ?, 'Mozilla/5.0 gizli', ?)");
  ins.run("socialmediacorner.co", "/iletisim", JSON.stringify([["Ad", "Ali"]]), "203.0.113.45", 1);
  ins.run("app.socialmediacorner.co", "/kayit", JSON.stringify([["E-posta", "x@y.z"]]), "2001:db8:1:2::9", 0);
  ins.run("brandcorner.co", "/iletisim", "[]", "198.51.100.1", 0);
  ins.run("saascorner.co", "/", "[]", "198.51.100.2", 0);
  const r = await call("GET", "/app/admin/submissions", { token: tok("A") });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(r.body.submissions.map(s => [s.site, s.page, s.ip, s.emailed]), [
    ["app.socialmediacorner.co", "/kayit", "2001:db8:…", false],
    ["socialmediacorner.co", "/iletisim", "203.0.x.x", true],
  ]);
  assert.deepEqual(r.body.submissions[1].fields, [["Ad", "Ali"]]);
  assert.ok(!JSON.stringify(r.body).includes("Mozilla") && !JSON.stringify(r.body).includes("113.45"));
  assert.deepEqual([maskIp(""), maskIp(null), maskIp("garip")], ["", "", "x"]);
});

test("A13: taslaklar ve yayın kuyruğu yalnız smc; metin kısaltılmış, token/hesap kimliği yok", async () => {
  const { db, call } = setup();
  db.prepare("INSERT INTO drafts (user_id, site, platform, topic, body) VALUES (2, ?, 'linkedin', 'Konu', ?), (5, 'brandcorner.co', 'linkedin', 'BC', 'bc')").run(SMC, "ç".repeat(400));
  const d = await call("GET", "/app/admin/drafts", { token: tok("A") });
  assert.equal(d.status, 200, JSON.stringify(d.body));
  assert.deepEqual(d.body.drafts.map(x => [x.email, x.platform, x.topic, x.body.length, x.len]), [["uye@ornek.test", "linkedin", "Konu", 280, 400]]);
  db.prepare("INSERT INTO social_accounts (user_id, platform, external_id, status) VALUES (2, 'linkedin', 'gizli-ext', 'connected'), (5, 'linkedin', 'bc-ext', 'connected')").run();
  const job = db.prepare(`INSERT INTO publish_jobs (user_id, site, account_id, account_external_id, platform, body, body_hash, state)
    VALUES (?, ?, ?, ?, 'linkedin', 'Metin', 'h', 'planlandi')`);
  job.run(2, SMC, 1, "gizli-ext");
  job.run(5, "brandcorner.co", 2, "bc-ext");
  db.prepare("INSERT INTO publish_events (job_id, from_state, to_state) VALUES (1, 'taslak', 'planlandi'), (2, 'taslak', 'planlandi')").run();
  const j = await call("GET", "/app/admin/jobs", { token: tok("A") });
  assert.equal(j.status, 200, JSON.stringify(j.body));
  assert.deepEqual(j.body.jobs.map(x => [x.id, x.email, x.state]), [[1, "uye@ornek.test", "planlandi"]]);
  assert.deepEqual(j.body.events.map(e => [e.job_id, e.to_state]), [[1, "planlandi"]]);
  assert.ok(!JSON.stringify(j.body).includes("gizli-ext"));
});

test("A13: plan ucu doğrulaması, site kapsamı ve perm_log (yalnız değişince)", async () => {
  const { db, call } = setup();
  const post = (id, body) => call("POST", `/app/admin/${id}/plan`, { token: tok("A"), body });
  for (const b of [{}, { plan: "" }, { plan: "gold" }, { plan: "Pro" }, { plan: "__proto__" }, { plan: "toString" }, { plan: ["pro"] }])
    assert.deepEqual(fail(await post(2, b)), [400, "bad_plan"], JSON.stringify(b));
  const L = (lb, vg) => ({ linkedin_blog: lb, video_gorsel: vg });
  for (const limits of [undefined, null, [], "{}", L(0, 5), L(-1, 5), L(1.5, 5), L("5", 5), L(100001, 5), { linkedin_blog: 5 }, { ...L(5, 5), extra: 1 }])
    assert.deepEqual(fail(await post(2, { plan: "enterprise", limits })), [400, "bad_limits"], JSON.stringify(limits));
  assert.deepEqual(fail(await post(2, { plan: "pro", limits: L(5, 5) })), [400, "bad_limits"]);
  // Başka sitenin ya da olmayan kullanıcı 404
  assert.deepEqual(fail(await post(5, { plan: "pro" })), [404, "not_found"]);
  assert.deepEqual(fail(await post(999, { plan: "pro" })), [404, "not_found"]);
  assert.equal(db.prepare("SELECT plan FROM users WHERE id = 5").get().plan, "basic");
  const logs = () => db.prepare("SELECT actor_id, user_id, perm, granted FROM perm_log ORDER BY id").all().map(r => ({ ...r }));
  assert.deepEqual(logs(), []);

  let r = await post(2, { plan: "pro" });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual([r.body.user_id, r.body.plan, r.body.plan_limits, r.body.limits.plan], [2, "pro", null, "pro"]);
  await post(2, { plan: "pro" }); // aynı plan: günlük satırı yok
  r = await post(2, { plan: "enterprise", limits: L(500, 60) });
  assert.deepEqual([r.body.plan, r.body.plan_limits, r.body.limits.linkedin_blog, r.body.limits.video_gorsel], ["enterprise", L(500, 60), 500, 60]);
  await post(2, { plan: "enterprise", limits: L(500, 60) }); // aynı: satır yok
  await post(2, { plan: "enterprise", limits: L(500, 61) }); // sayı değişti: satır
  r = await post(2, { plan: "basic", limits: null });
  assert.deepEqual([r.body.plan, r.body.plan_limits], ["basic", null]);
  assert.deepEqual({ ...db.prepare("SELECT plan, plan_limits FROM users WHERE id = 2").get() }, { plan: "basic", plan_limits: null });
  assert.deepEqual(logs().map(l => l.perm), ["plan:pro", "plan:enterprise", "plan:enterprise", "plan:basic"]);
  assert.ok(logs().every(l => l.actor_id === 1 && l.user_id === 2 && l.granted === 1));
  // Panel geçmişi
  const h = await call("GET", "/app/admin", { token: tok("A") });
  assert.deepEqual(h.body.plan_log.map(l => [l.plan, l.email, l.actor_email]).slice(0, 2), [["basic", "uye@ornek.test", "yonetici@ornek.test"], ["enterprise", "uye@ornek.test", "yonetici@ornek.test"]]);
  // id biçimi
  assert.deepEqual(fail(await call("POST", "/app/admin/99999999999999999999/plan", { token: tok("A"), body: { plan: "pro" } })), [404, "not_found"]);
});

test("A13: perm_log yoksa plan yine değişir (günlüksüz)", async () => {
  const db = freshDb();
  db.exec("DROP TABLE perm_log");
  const { call } = setup(db);
  try {
    const r = await call("POST", "/app/admin/2/plan", { token: tok("A"), body: { plan: "pro" } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(db.prepare("SELECT plan FROM users WHERE id = 2").get().plan, "pro");
    const h = await call("GET", "/app/admin", { token: tok("A") });
    assert.deepEqual([h.status, h.body.plan_log], [200, []]);
  } finally { delete MISSING.perm_log; }
});

test("A13: tablo/sütun yoksa yöneticiye 503 not_ready, üyeye yine 404; user_perms yoksa herkese 404", async () => {
  for (const [drop, routes] of [["DROP TABLE drafts", ["/app/admin", "/app/admin/users", "/app/admin/drafts"]], ["DROP TABLE publish_events; DROP TABLE publish_jobs", ["/app/admin/jobs"]], ["DROP TABLE gen_month", ["/app/admin"]]]) {
    const db = freshDb();
    db.exec(drop);
    const { call } = setup(db);
    for (const p of routes) {
      assert.deepEqual(fail(await call("GET", p, { token: tok("A") })), [503, "not_ready"], `${drop} ${p}`);
      assert.deepEqual(fail(await call("GET", p, { token: tok("M") })), [404, "not_found"], `${drop} ${p}`);
    }
  }
  // 0018 yok (plan sütunu yok)
  const db0 = new DatabaseSync(":memory:");
  db0.exec(SCHEMA);
  for (const m of MIGRATIONS.slice(0, -1)) db0.exec(m);
  db0.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, 'a@ornek.test', 'a', 'brand', 'x')").run(SMC);
  db0.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, 1, datetime('now', '+1 day'))").run(hash(tok("A")));
  db0.prepare("INSERT INTO user_perms (user_id, perm) VALUES (1, 'admin')").run();
  const s0 = setup(db0);
  assert.deepEqual(fail(await s0.call("GET", "/app/admin", { token: tok("A") })), [503, "not_ready"]);
  assert.deepEqual(fail(await s0.call("POST", "/app/admin/1/plan", { token: tok("A"), body: { plan: "pro" } })), [503, "not_ready"]);
  // user_perms yok: yönetici yok
  const db1 = freshDb();
  db1.exec("DROP TABLE user_perms");
  const s1 = setup(db1);
  assert.deepEqual(fail(await s1.call("GET", "/app/admin", { token: tok("A") })), [404, "not_found"]);
});

test("A13: hesaplar kapalıyken ya da yabancı origin'de 403 origin", async () => {
  const { call } = setup(undefined, { ACCOUNTS_ENABLED: "0" });
  assert.deepEqual(fail(await call("GET", "/app/admin", { token: tok("A") })), [403, "origin"]);
  const s = setup();
  assert.deepEqual(fail(await s.call("GET", "/app/admin", { token: tok("A"), origin: "https://socialmediacorner.co" })), [403, "origin"]);
});

test("hesap/admin.html ve smc-admin.js: noindex, kabuk, Bulunamadı ekranı; veri yalnız textContent ile", () => {
  const site = new URL("../../sites/app.socialmediacorner.co/", import.meta.url);
  const html = readFileSync(new URL("hesap/admin.html", site), "utf8");
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/); // tools/dist.mjs bunu sitemap'e almaz
  assert.match(html, /<body[^>]*data-sayfa="admin"[^>]*data-korumali/);
  assert.match(html, /data-ekran="yok"[\s\S]*?>Bulunamadı</);
  assert.match(html, /id="f-plan"[\s\S]*?value="enterprise"/);
  assert.ok(html.indexOf("/assets/smc-admin.js") < html.indexOf("/assets/smc-hesap.js"), "smc-admin.js smc-hesap.js'ten önce");
  assert.doesNotMatch(html, /<script>|style="/); // CSP: satır içi betik/stil yok
  const js = readFileSync(new URL("assets/smc-admin.js", site), "utf8");
  assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
  const kabuk = readFileSync(new URL("assets/smc-hesap.js", site), "utf8"), ust = readFileSync(new URL("assets/ust-hesap.js", site), "utf8");
  assert.match(kabuk, /SAYFA==='admin'\)\{if\(ORNEK\|\|!KULLANICI\|\|KULLANICI\.admin!==true/);
  for (const s of [kabuk, ust]) assert.match(s, /\.admin===true&&m&&!\$\('#hesap-admin'\)/);
});

test("27.11 seslendirme: enterprise limits.seslendirme 0..100 tam sayı (isteğe bağlı); dışı 400 bad_limits; limits JSON'una yazılır", async () => {
  const { db, call } = setup();
  const post = body => call("POST", "/app/admin/2/plan", { token: tok("A"), body });
  const L = ses => ({ linkedin_blog: 5, video_gorsel: 5, seslendirme: ses });
  for (const ses of [-1, 101, "3", 1.5, null, true])
    assert.deepEqual(fail(await post({ plan: "enterprise", limits: L(ses) })), [400, "bad_limits"], JSON.stringify(ses));
  assert.equal(db.prepare("SELECT plan FROM users WHERE id = 2").get().plan, "basic");
  for (const ses of [0, 10, 100]) {
    const r = await post({ plan: "enterprise", limits: L(ses) });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual(r.body.plan_limits, L(ses));
    assert.equal(r.body.limits.seslendirme, ses);
    assert.deepEqual(JSON.parse(db.prepare("SELECT plan_limits FROM users WHERE id = 2").get().plan_limits), L(ses));
  }
  // verilmezse JSON'da alan yok; plans.js varsayılanı (Pro'nun 6'sı)
  const r = await post({ plan: "enterprise", limits: { linkedin_blog: 5, video_gorsel: 5 } });
  assert.deepEqual([r.status, r.body.plan_limits, r.body.limits.seslendirme], [200, { linkedin_blog: 5, video_gorsel: 5 }, 6]);
  assert.deepEqual(fail(await post({ plan: "pro", limits: { seslendirme: 3 } })), [400, "bad_limits"]);
});

test("27.11 deleteAccount: kullanıcının ses:YYYY-MM ve ses_ek satırları silinir; başkasının ve günlük sayaçlar kalır", async () => {
  const { pbkdf2Sync } = await import("node:crypto");
  const db = freshDb();
  db.exec("CREATE TABLE IF NOT EXISTS gen_usage (day TEXT NOT NULL, key TEXT NOT NULL, kind TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, key)) WITHOUT ROWID");
  const salt = Buffer.alloc(16, 7), pw = "parola-12345";
  db.prepare("UPDATE users SET pass = ? WHERE id = 2").run(`pbkdf2$10000$${salt.toString("base64url")}$${pbkdf2Sync(pw, salt, 10000, 32, "sha256").toString("base64url")}`);
  const ins = db.prepare("INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, ?, ?)");
  for (const [d, k, kind, n] of [[`ses:${MONTH}`, "u:2", "ss", 2], ["ses:2026-10", "u:2", "ss", 6], ["ses_ek", "u:2", "se", 4],
    [`ses:${MONTH}`, "u:3", "ss", 1], ["ses_ek", "u:3", "se", 6], ["ses_ek", "u:22", "se", 5], [TODAY, "u:2", "u", 3]]) ins.run(d, k, kind, n);
  const { call } = setup(db);
  const r = await call("POST", "/app/account/delete", { token: tok("M"), body: { password: pw } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const rows = db.prepare("SELECT day, key FROM gen_usage").all().map(x => `${x.day}|${x.key}`).sort();
  assert.deepEqual(rows, [`${TODAY}|u:2`, `ses:${MONTH}|u:3`, "ses_ek|u:3", "ses_ek|u:22"].sort());
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users WHERE id = 2").get().n, 0);
});
