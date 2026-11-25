// node --test src/publish.test.mjs — A7-1 yayın kuyruğu (A7 TEKNIK-PLAN §8): kapılar, durum makinesi, kira, bütçe, bekleme,
// sağlayıcı sonuçları, Europe/Istanbul saati, migration ve index.js scheduled dallanması. Dış istekler yalnız fakeProvider ile;
// gerçek LinkedIn/Meta API'sine hiç gidilmez.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "cloudflare:sockets") return { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true };
    if (spec === "cloudflare:email") return { url: "data:text/javascript,export class EmailMessage{}", shortCircuit: true };
    return next(spec, ctx);
  },
});

const { publish, publishTick, gates, backoff, parseRunAt, toSql, canMove, PUBLISH_CRON, WRITE_SCOPE, MAX_ATTEMPTS } = await import("./publish.js");
const { fakeProvider, COST, LI, IG_API, liEscape, retryAfter } = await import("./publish-providers.js");
const { encrypt, decrypt } = await import("./oauth.js");
const worker = (await import("./index.js")).default;

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const SCHEMA = read("../schema.sql");
const MIGRATIONS = ["0001_metrics", "0002_oauth", "0003_sync", "0004_sync_changes"].map(n => read(`../migrations/${n}.sql`));
const PUBLISH_SQL = read("../migrations/0016_publish.sql");
const TOML = read("../wrangler.toml");

// D1 sahtesi. batch tek işlem ve kesintisiz (BEGIN … COMMIT arasında await yok): D1 gibi eşzamanlı turlar araya giremez.
function d1(db) {
  const runSync = (sql, args) => {
    const i = db.prepare(sql).run(...args);
    return { success: true, meta: { changes: Number(i.changes), last_row_id: Number(i.lastInsertRowid) } };
  };
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })) }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => runSync(sql, args),
  });
  const batch = async list => {
    db.exec("BEGIN");
    try { const out = list.map(s => runSync(s.sql, s.args)); db.exec("COMMIT"); return out; } catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  return { prepare: sql => stmt(sql), batch, exec: async sql => db.exec(sql) };
}
// Sayan sarmalayıcı: "0 D1" iddiaları için prepare ve batch çağrıları
function counted(inner) {
  const n = { prepare: 0, batch: 0, sql: [] };
  return { n, db: { prepare: sql => { n.prepare++; n.sql.push(sql); return inner.prepare(sql); }, batch: async l => { n.batch++; return inner.batch(l); }, exec: inner.exec } };
}
function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  for (const m of MIGRATIONS) db.exec(m);
  db.exec(PUBLISH_SQL);
  return db;
}

const ORIGIN = "http://localhost:8788", SITE = "brandcorner.co";
const KEY = Buffer.alloc(32, 7).toString("base64url");
const ON = { PUBLISH_ENABLED: "1", PUBLISH_SITES: SITE, PUBLISH_PLATFORMS: "linkedin,instagram", PUBLISH_PER_RUN: "3" };
const quiet = () => {};
const ok = (r, msg) => { assert.equal(r.status, 200, msg || JSON.stringify(r.body)); return r; };
const fails = (r, status, error) => { assert.equal(r.status, status, JSON.stringify(r.body)); assert.equal(r.body.error, error); };
const isoAgo = sec => new Date(Date.now() - sec * 1000).toISOString();

// Sahte yanıtlar (biçimler DOĞRULANMALI; yalnız bağdaştırıcının beklediği alanlar)
const LI_OK = (id = "urn:li:share:7001") => ({ status: 201, headers: { "x-restli-id": id } });
const IG_LIMIT = (used = 0) => ({ body: { data: [{ quota_usage: used, config: { quota_total: 50 } }] } });
const IG_OK = (container = "C1", media = "M1") => [IG_LIMIT(), { body: { id: container } }, { body: { status_code: "FINISHED" } }, { body: { id: media } }];

function setup(extra = {}) {
  const db = freshDb();
  const c = counted(d1(db));
  const env = { DB: c.db, DEV_ORIGINS: ORIGIN, ALLOWED_HOSTS: SITE, OAUTH_TOKEN_KEY: KEY, ...ON, ...extra };
  let seq = 0;
  const call = async (method, path, { token, body, origin = ORIGIN, e = env } = {}) => {
    const headers = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const res = await publish(req, new URL(req.url), e, origin);
    return { status: res.status, body: await res.json(), headers: res.headers };
  };
  const user = (email, site = SITE) => {
    const id = Number(db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, ?, ?, 'brand', 'x')").run(site, email, email.split("@")[0]).lastInsertRowid);
    const token = randomBytes(32).toString("base64url");
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+1 day'))")
      .run(createHash("sha256").update(token).digest("hex"), id);
    return { id, token };
  };
  const connect = async (u, platform, ext, o = {}) => {
    const acc = Number(db.prepare("INSERT INTO social_accounts (user_id, platform, handle, external_id, status) VALUES (?, ?, 'hesap', ?, 'connected')")
      .run(u.id, platform, ext).lastInsertRowid);
    db.prepare("INSERT INTO oauth_tokens (user_id, platform, access_token, scope, expires_at) VALUES (?, ?, ?, ?, datetime('now', ?))")
      .run(u.id, platform, await encrypt(env, o.token ?? `tok-${platform}-${u.id}`), o.scope ?? `r_basicprofile ${WRITE_SCOPE[platform]}`, o.expires ?? "+30 days");
    return acc;
  };
  // İş oluşturur; approve false değilse gönderir ve onaylar (varsayılan run_at 1 dk önce: hemen kiralanabilir)
  const job = async (u, platform, o = {}) => {
    const n = ++seq;
    const media = "media_url" in o ? o.media_url : platform === "instagram" ? "https://cdn.example.com/a.jpg" : undefined;
    const r = ok(await call("POST", "/publish/jobs", { token: u.token, body: { rid: o.rid ?? `rid-${n}`, platform, body: o.body ?? `Gönderi ${n}`, media_url: media } }));
    const id = r.body.job.id;
    if (o.approve === false) return id;
    ok(await call("POST", `/publish/jobs/${id}/submit`, { token: u.token }));
    ok(await call("POST", `/publish/jobs/${id}/approve`, { token: u.token, body: { run_at: o.run_at ?? isoAgo(60) } }));
    return id;
  };
  const row = id => ({ ...db.prepare("SELECT * FROM publish_jobs WHERE id = ?").get(id) });
  const events = id => db.prepare("SELECT from_state, to_state, note, actor FROM publish_events WHERE job_id = ? ORDER BY id").all(id).map(r => ({ ...r }));
  const lastEvent = id => events(id).at(-1);
  const inSec = (id, col = "next_try_at") => db.prepare(`SELECT (julianday(${col}) - julianday('now')) * 86400 AS d FROM publish_jobs WHERE id = ?`).get(id).d;
  const tick = (f, o = {}, e = env) => publishTick(e, f, { pollWait: 0, log: quiet, ...o });
  return { db, env, n: c.n, call, user, connect, job, row, events, lastEvent, inSec, tick };
}
const near = (v, want, tol = 3) => assert.ok(Math.abs(v - want) <= tol, `${v} ≈ ${want}`);

// ---- migration, yapılandırma, kapılar ----

test("migration: 0016 iki kez uygulanır, schema.sql ile aynı tablo ve indeksler", () => {
  const a = new DatabaseSync(":memory:");
  a.exec(SCHEMA);
  const b = new DatabaseSync(":memory:");
  b.exec(PUBLISH_SQL);
  b.exec(PUBLISH_SQL);
  const info = (db, t) => db.prepare(`PRAGMA table_info(${t})`).all().map(r => ({ ...r }));
  const idx = (db, t) => db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND sql IS NOT NULL ORDER BY name").all(t).map(r => r.name);
  for (const t of ["publish_jobs", "publish_events"]) {
    assert.ok(info(b, t).length > 0, t);
    assert.deepEqual(info(b, t), info(a, t), t);
    assert.deepEqual(idx(b, t), idx(a, t), t);
  }
  assert.match(SCHEMA, /CREATE TABLE IF NOT EXISTS publish_jobs/);
  assert.match(SCHEMA, /0016_publish\.sql/);
  assert.doesNotMatch(PUBLISH_SQL.replace(/--.*$/gm, ""), /\b(DROP|ALTER)\b|\bDELETE\s+FROM\b|\bINSERT\b|\bUPDATE\s+\w+\s+SET\b/i);
});

test("wrangler.toml: saatlik cron aynen + 5 dk yayın cron'u, bayraklar kapalı", () => {
  assert.match(TOML, /^crons = \["17 \* \* \* \*", "\*\/5 \* \* \* \*"\]$/m);
  assert.equal(PUBLISH_CRON, "*/5 * * * *");
  const v = k => TOML.match(new RegExp(`^${k} = "([^"]*)"$`, "m"))?.[1];
  assert.equal(v("PUBLISH_ENABLED"), "0");
  assert.equal(v("PUBLISH_SITES"), "");
  assert.equal(v("PUBLISH_PLATFORMS"), "");
  assert.equal(v("PUBLISH_PER_RUN"), "3");
  assert.equal(gates({ PUBLISH_ENABLED: v("PUBLISH_ENABLED"), PUBLISH_SITES: v("PUBLISH_SITES"), PUBLISH_PLATFORMS: v("PUBLISH_PLATFORMS") }), null);
});

test("gates: liste normalize, bilinmeyen platform atılır, PUBLISH_PER_RUN 1..6", () => {
  assert.deepEqual(gates({ PUBLISH_ENABLED: "1", PUBLISH_SITES: " BrandCorner.co ,x.co,", PUBLISH_PLATFORMS: "linkedin, tiktok", PUBLISH_PER_RUN: "99" }),
    { sites: ["brandcorner.co", "x.co"], platforms: ["linkedin"], perRun: 6 });
  for (const [v, want] of [["0", 3], ["abc", 3], [undefined, 3], ["2", 2], ["6", 6]]) {
    assert.equal(gates({ ...ON, PUBLISH_PER_RUN: v }).perRun, want, String(v));
  }
  for (const off of [{ PUBLISH_ENABLED: "0" }, { PUBLISH_ENABLED: "true" }, { PUBLISH_SITES: "" }, { PUBLISH_PLATFORMS: "" }, { PUBLISH_PLATFORMS: "tiktok" }]) {
    assert.equal(gates({ ...ON, ...off }), null, JSON.stringify(off));
  }
});

test("kapı kapalıyken: cron 0 D1 + 0 dış istek, uçlar 503 not_ready (D1'e dokunmadan)", async () => {
  for (const off of [{ PUBLISH_ENABLED: "0" }, { PUBLISH_ENABLED: undefined }, { PUBLISH_SITES: "" }, { PUBLISH_PLATFORMS: "" }, { PUBLISH_PLATFORMS: "tiktok" }]) {
    const s = setup(off);
    const u = s.user("a@x.co");
    const f = fakeProvider([]);
    assert.deepEqual(await publishTick(s.env, f), { skipped: true });
    for (const [m, p] of [["GET", "/publish/jobs"], ["POST", "/publish/jobs"], ["POST", "/publish/jobs/1/approve"], ["GET", "/publish/nope"]]) {
      fails(await s.call(m, p, { token: u.token, body: m === "POST" ? { rid: "x" } : undefined }), 503, "not_ready");
    }
    assert.equal(f.calls.length, 0);
    assert.deepEqual([s.n.prepare, s.n.batch], [0, 0], JSON.stringify(off));
  }
  // Site listede değil: uç 503, D1 yok; Origin yok: 403
  const s = setup({ PUBLISH_SITES: "saascorner.co" });
  fails(await s.call("GET", "/publish/jobs", { token: "x".repeat(43) }), 503, "not_ready");
  fails(await s.call("GET", "/publish/jobs", { origin: null }), 403, "origin");
  assert.equal(s.n.prepare + s.n.batch, 0);
});

// ---- uçlar ----

test("oluşturma, liste, ayrıntı: oturum, sahiplik, CORS ve ISO saatler", async () => {
  const s = setup();
  const u = s.user("a@x.co");
  fails(await s.call("GET", "/publish/jobs"), 401, "auth");
  fails(await s.call("POST", "/publish/jobs", { token: u.token, body: { rid: "a1", platform: "linkedin", body: "x" } }), 404, "not_found"); // bağlı hesap yok
  await s.connect(u, "linkedin", "abc123");
  const id = await s.job(u, "linkedin", { body: "Merhaba" });
  const l = ok(await s.call("GET", "/publish/jobs", { token: u.token }));
  assert.equal(l.body.enabled, true);
  assert.equal(l.body.jobs.length, 1);
  assert.equal(l.headers.get("access-control-allow-origin"), ORIGIN);
  const j = l.body.jobs[0];
  assert.equal(j.state, "planlandi");
  assert.match(j.run_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  assert.equal("account_external_id" in j || "idem_key" in j || "body_hash" in j, false);
  const d = ok(await s.call("GET", `/publish/jobs/${id}`, { token: u.token }));
  assert.deepEqual(d.body.events.map(e => [e.from_state, e.to_state, e.note, e.by]),
    [["onay_bekliyor", "planlandi", "approved", "user"], ["taslak", "onay_bekliyor", "submitted", "user"], [null, "taslak", "created", "user"]]);
  fails(await s.call("GET", "/publish/jobs/999", { token: u.token }), 404, "not_found");
  fails(await s.call("DELETE", "/publish/jobs", { token: u.token }), 404, "not_found");
  fails(await s.call("POST", "/publish/jobs", { token: u.token, body: { rid: "z", platform: "tiktok", body: "x" } }), 400, "platform");
  fails(await s.call("POST", "/publish/jobs", { token: u.token, body: { rid: "z", platform: "linkedin", body: "  " } }), 400, "body");
  fails(await s.call("POST", "/publish/jobs", { token: u.token, body: { rid: "z", platform: "linkedin", body: "x", media_url: "http://a.co/x.jpg" } }), 400, "media_url");
  fails(await s.call("POST", "/publish/jobs", { token: u.token, body: { rid: "z", platform: "linkedin", body: "x", run_at: "yarın" } }), 400, "run_at");
  fails(await s.call("POST", "/publish/jobs", { token: u.token, body: { rid: "z", platform: "linkedin", body: "x".repeat(17000) } }), 413, "size");
  const bad = new Request("https://forms.test/publish/jobs", { method: "POST", headers: { authorization: `Bearer ${u.token}` }, body: "{" });
  assert.equal((await publish(bad, new URL(bad.url), s.env, ORIGIN)).status, 400);
});

test("metin sınırları: IG 2200 geçer, 2201 400 too_long; LinkedIn 3001 400; kod noktası sayılır; DB CHECK", async () => {
  const s = setup();
  const u = s.user("a@x.co");
  await s.connect(u, "instagram", "1789");
  await s.connect(u, "linkedin", "abc");
  const post = (rid, platform, body) => s.call("POST", "/publish/jobs", { token: u.token, body: { rid, platform, body, media_url: "https://cdn.example.com/a.jpg" } });
  fails(await post("i1", "instagram", "a".repeat(2201)), 400, "too_long");
  ok(await post("i2", "instagram", "a".repeat(2200)));
  ok(await post("i3", "instagram", "ğ".repeat(2200)));
  fails(await post("i4", "instagram", "😀".repeat(2201)), 400, "too_long");
  ok(await post("l1", "linkedin", "a".repeat(3000)));
  fails(await post("l2", "linkedin", "a".repeat(3001)), 400, "too_long");
  const acc = s.db.prepare("SELECT id FROM social_accounts WHERE platform = 'instagram'").get().id;
  assert.throws(() => s.db.prepare("INSERT INTO publish_jobs (user_id, site, account_id, account_external_id, platform, body, body_hash) VALUES (?, ?, ?, '1789', 'instagram', ?, 'h')")
    .run(u.id, SITE, acc, "a".repeat(2201)), /CHECK/);
});

test("çift rid: aynı kullanıcıya aynı iş (dup), başka kullanıcıya 409", async () => {
  const s = setup();
  const a = s.user("a@x.co"), b = s.user("b@x.co");
  await s.connect(a, "linkedin", "aa");
  await s.connect(b, "linkedin", "bb");
  const body = { rid: "ayni-istek", platform: "linkedin", body: "Merhaba" };
  const r1 = ok(await s.call("POST", "/publish/jobs", { token: a.token, body }));
  const r2 = ok(await s.call("POST", "/publish/jobs", { token: a.token, body }));
  assert.equal(r2.body.dup, true);
  assert.equal(r2.body.job.id, r1.body.job.id);
  fails(await s.call("POST", "/publish/jobs", { token: b.token, body }), 409, "rid");
  fails(await s.call("POST", "/publish/jobs", { token: a.token, body: { ...body, rid: "a b" } }), 400, "rid");
  assert.equal(s.db.prepare("SELECT count(*) n FROM publish_jobs").get().n, 1);
});

test("başka kullanıcının işi ve hesabı 404; başka sitenin oturumu 401", async () => {
  const s = setup();
  const a = s.user("a@x.co"), b = s.user("b@x.co"), other = s.user("c@x.co", "saascorner.co");
  const accA = await s.connect(a, "linkedin", "aa");
  await s.connect(b, "linkedin", "bb");
  const id = await s.job(a, "linkedin");
  for (const [m, p, body] of [["GET", `/publish/jobs/${id}`], ["PUT", `/publish/jobs/${id}`, { body: "x" }], ["POST", `/publish/jobs/${id}/approve`],
    ["POST", `/publish/jobs/${id}/cancel`], ["POST", `/publish/jobs/${id}/retry`], ["POST", `/publish/jobs/${id}/done`]]) {
    fails(await s.call(m, p, { token: b.token, body }), 404, "not_found");
  }
  assert.deepEqual(ok(await s.call("GET", "/publish/jobs", { token: b.token })).body.jobs, []);
  fails(await s.call("POST", "/publish/jobs", { token: b.token, body: { rid: "b1", platform: "linkedin", body: "x", account_id: accA } }), 404, "not_found");
  fails(await s.call("POST", "/publish/jobs", { token: b.token, body: { rid: "b2", platform: "instagram", body: "x" } }), 404, "not_found");
  fails(await s.call("GET", "/publish/jobs", { token: other.token }), 401, "auth");
  assert.equal(s.row(id).state, "planlandi");
});

test("rolü sitede kabul edilmeyen (pasif) hesabın oturumu 401 auth (platform.js sessionUser ile aynı); brand geri dönünce açılır", async () => {
  const APP = "https://app.socialmediacorner.co";
  const s = setup({ ACCOUNTS_ENABLED: "1", PUBLISH_SITES: `${SITE},app.socialmediacorner.co` });
  s.db.exec(read("../migrations/0018_plans.sql")); // smc'de kuyruk planlıdır (pro): plan sütunu
  const a = s.user("a@x.co", "app.socialmediacorner.co"), bc = s.user("b@x.co");
  s.db.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").run(a.id);
  await s.connect(a, "linkedin", "aa");
  const id = ok(await s.call("POST", "/publish/jobs", { token: a.token, origin: APP, body: { rid: "app-1", platform: "linkedin", body: "Merhaba" } })).body.job.id;
  for (const role of ["influencer", "agency", "Brand", ""]) {
    s.db.prepare("UPDATE users SET role = ? WHERE id IN (?, ?)").run(role, a.id, bc.id);
    for (const [m, p, body] of [["GET", "/publish/jobs"], ["GET", `/publish/jobs/${id}`], ["PUT", `/publish/jobs/${id}`, { body: "x" }],
      ["POST", "/publish/jobs", { rid: `r-${role}`, platform: "linkedin", body: "x" }], ["POST", `/publish/jobs/${id}/cancel`]])
      fails(await s.call(m, p, { token: a.token, body, origin: APP }), 401, "auth");
    // brandcorner.co'da rol kısıtı yok: oturum her rolde geçer (bugünkü davranış)
    ok(await s.call("GET", "/publish/jobs", { token: bc.token }));
  }
  assert.equal(s.row(id).state, "taslak");
  s.db.prepare("UPDATE users SET role = 'brand' WHERE id = ?").run(a.id);
  assert.equal(ok(await s.call("GET", "/publish/jobs", { token: a.token, origin: APP })).body.jobs.length, 1);
});

test("durum makinesi: tablo dışı geçiş 409; onay kuralları (run_at, IG görseli)", async () => {
  assert.equal(canMove("onay_bekliyor", "planlandi"), true);
  assert.equal(canMove("taslak", "planlandi"), false);
  assert.equal(canMove("yayinlandi", "planlandi"), false);
  assert.equal(canMove("iptal", "onay_bekliyor"), false);
  assert.equal(canMove("kontrol", "yayinlandi"), true);
  const s = setup();
  const u = s.user("a@x.co");
  await s.connect(u, "linkedin", "abc");
  await s.connect(u, "instagram", "1789");
  const id = await s.job(u, "linkedin", { approve: false });
  const act = (a, body) => s.call("POST", `/publish/jobs/${id}/${a}`, { token: u.token, body });
  fails(await act("approve", { run_at: isoAgo(0) }), 409, "state");
  fails(await act("done"), 409, "state");
  fails(await act("retry"), 409, "state");
  ok(await act("submit"));
  fails(await act("submit"), 409, "state");
  fails(await act("approve"), 400, "run_at");
  fails(await act("approve", { run_at: isoAgo(600) }), 400, "run_at");
  fails(await act("approve", { run_at: new Date(Date.now() + 181 * 86400000).toISOString() }), 400, "run_at");
  ok(await act("approve", { run_at: new Date(Date.now() + 3600000).toISOString() }));
  fails(await act("approve", { run_at: new Date(Date.now() + 3600000).toISOString() }), 409, "state");
  fails(await act("submit"), 409, "state"); // planlandi → onay_bekliyor yalnız düzenlemeyle
  assert.equal(ok(await act("cancel")).body.job.state, "iptal");
  assert.equal(s.row(id).idem_key, null);
  fails(await act("cancel"), 409, "state");
  fails(await s.call("PUT", `/publish/jobs/${id}`, { token: u.token, body: { body: "x" } }), 409, "state");
  // IG: görselsiz iş oluşur ama onaylanamaz
  const ig = await s.job(u, "instagram", { approve: false, media_url: null });
  ok(await s.call("POST", `/publish/jobs/${ig}/submit`, { token: u.token }));
  fails(await s.call("POST", `/publish/jobs/${ig}/approve`, { token: u.token, body: { run_at: isoAgo(0) } }), 400, "media_url");
});

test("onaydan sonra metin değişti → onay_bekliyor; onaysız metin kiralanmaz, yeni onayla yeni metin gider", async () => {
  const s = setup();
  const u = s.user("a@x.co");
  await s.connect(u, "linkedin", "abc");
  const id = await s.job(u, "linkedin", { body: "eski metin" });
  const r = ok(await s.call("PUT", `/publish/jobs/${id}`, { token: u.token, body: { body: "yeni metin" } }));
  assert.equal(r.body.job.state, "onay_bekliyor");
  const j = s.row(id);
  assert.deepEqual([j.approved_at, j.approved_hash, j.approved_by, j.idem_key], [null, null, null, null]);
  assert.deepEqual(s.lastEvent(id), { from_state: "planlandi", to_state: "onay_bekliyor", note: "edited", actor: u.id });
  const f = fakeProvider(() => LI_OK());
  assert.equal((await s.tick(f)).leased, 0);
  assert.equal(f.calls.length, 0);
  ok(await s.call("POST", `/publish/jobs/${id}/approve`, { token: u.token }));
  assert.equal((await s.tick(f)).done[0].to, "yayinlandi");
  assert.equal(JSON.parse(f.calls[0].body).commentary, "yeni metin");
  fails(await s.call("PUT", `/publish/jobs/${id}`, { token: u.token, body: { body: "x" } }), 409, "state");
});

test("aynı idem_key (hesap + metin + saat) ikinci onayda 409 duplicate; iptal anahtarı bırakır", async () => {
  const s = setup();
  const u = s.user("a@x.co");
  await s.connect(u, "linkedin", "abc");
  const runAt = new Date(Math.floor(Date.now() / 1000) * 1000 + 86400000).toISOString();
  const a = await s.job(u, "linkedin", { body: "Aynı metin", run_at: runAt });
  const b = await s.job(u, "linkedin", { body: "Aynı metin", approve: false });
  ok(await s.call("POST", `/publish/jobs/${b}/submit`, { token: u.token }));
  fails(await s.call("POST", `/publish/jobs/${b}/approve`, { token: u.token, body: { run_at: runAt } }), 409, "duplicate");
  assert.equal(s.row(b).state, "onay_bekliyor");
  ok(await s.call("POST", `/publish/jobs/${a}/cancel`, { token: u.token }));
  ok(await s.call("POST", `/publish/jobs/${b}/approve`, { token: u.token, body: { run_at: runAt } }));
  assert.equal(s.row(b).state, "planlandi");
});

// ---- kira (kapılar 4-6) ----

test("kira seçmez: yazma kapsamı yok, onaysız, approved_hash ≠ body_hash, site ya da platform listede değil", async () => {
  const s = setup();
  const u1 = s.user("1@x.co"), u2 = s.user("2@x.co"), u3 = s.user("3@x.co"), u4 = s.user("4@x.co"), u5 = s.user("5@x.co");
  await s.connect(u1, "linkedin", "l1");
  await s.connect(u2, "linkedin", "l2");
  await s.connect(u3, "linkedin", "l3");
  await s.connect(u4, "instagram", "i4");
  await s.connect(u5, "linkedin", "l5");
  const j1 = await s.job(u1, "linkedin");
  // Onaydan sonra kapsam geri alınmış (onay artık kapsamsız token'ı reconnect_required ile reddeder; kira kapısı yine durur)
  s.db.prepare("UPDATE oauth_tokens SET scope = 'r_basicprofile' WHERE user_id = ?").run(u1.id);
  const j2 = await s.job(u2, "linkedin", { approve: false });
  ok(await s.call("POST", `/publish/jobs/${j2}/submit`, { token: u2.token }));
  const j3 = await s.job(u3, "linkedin");
  s.db.prepare("UPDATE publish_jobs SET body_hash = 'baska' WHERE id = ?").run(j3);
  const j4 = await s.job(u4, "instagram");
  const j5 = await s.job(u5, "linkedin");
  s.db.prepare("UPDATE publish_jobs SET site = 'saascorner.co' WHERE id = ?").run(j5);
  const f = fakeProvider(() => LI_OK());
  const r = await s.tick(f, {}, { ...s.env, PUBLISH_PLATFORMS: "linkedin" });
  assert.equal(r.leased, 0);
  assert.equal(f.calls.length, 0);
  for (const id of [j1, j3, j4, j5]) assert.equal(s.row(id).state, "planlandi");
  // Kapsam virgüllü de okunur; platform listesine instagram eklenince IG işi de gelir
  s.db.prepare("UPDATE oauth_tokens SET scope = 'r_basicprofile,w_member_social' WHERE user_id = ?").run(u1.id);
  const f2 = fakeProvider(url => (url.startsWith(LI) ? LI_OK() : IG_OK().shift()));
  const g = fakeProvider([...IG_OK()]);
  const r2 = await s.tick((url, init) => (url.startsWith(LI) ? f2(url, init) : g(url, init)));
  assert.deepEqual(r2.done.map(d => [d.id, d.to]).sort(), [[j1, "yayinlandi"], [j4, "yayinlandi"]].sort());
  assert.equal(s.row(j2).state, "onay_bekliyor");
  assert.equal(s.row(j3).state, "planlandi");
  assert.equal(s.row(j5).state, "planlandi");
});

test("aynı hesapta iki iş → turda 1 (önce erken saatli); hesapta yayinlaniyor varken yenisi yok", async () => {
  const s = setup();
  const u = s.user("a@x.co");
  await s.connect(u, "linkedin", "abc");
  const late = await s.job(u, "linkedin", { run_at: isoAgo(60) });
  const early = await s.job(u, "linkedin", { run_at: isoAgo(120) });
  const f = fakeProvider(() => LI_OK());
  const r1 = await s.tick(f);
  assert.deepEqual([r1.leased, r1.done[0].id], [1, early]);
  assert.equal(s.row(late).state, "planlandi");
  const r2 = await s.tick(f);
  assert.deepEqual([r2.leased, r2.done[0].id], [1, late]);
  // Hesapta kirası süren iş varken yenisi kiralanmaz
  const third = await s.job(u, "linkedin");
  s.db.prepare("UPDATE publish_jobs SET state = 'yayinlaniyor', lease_until = datetime('now', '+3 minutes') WHERE id = ?").run(late);
  assert.equal((await s.tick(f)).leased, 0);
  assert.equal(s.row(third).state, "planlandi");
});

test("iki eşzamanlı tur: her iş bir kez kiralanır ve bir kez gönderilir", async () => {
  const s = setup();
  const ids = [];
  for (const e of ["a", "b", "c"]) {
    const u = s.user(`${e}@x.co`);
    await s.connect(u, "linkedin", `ext-${e}`);
    ids.push(await s.job(u, "linkedin"));
  }
  const f = fakeProvider(() => LI_OK());
  const [r1, r2] = await Promise.all([s.tick(f), s.tick(f)]);
  assert.equal(r1.leased + r2.leased, 3);
  assert.equal(f.calls.length, 3);
  for (const id of ids) {
    assert.equal(s.row(id).state, "yayinlandi");
    assert.equal(s.events(id).filter(e => e.to_state === "yayinlandi").length, 1);
  }
});

test("hazırlık: kira süresi doldu → kontrol, 24 sa bayat → basarisiz, hesap başka kimlikle bağlandı → onay_bekliyor (istek yok)", async () => {
  const s = setup();
  const a = s.user("a@x.co"), b = s.user("b@x.co"), c = s.user("c@x.co");
  await s.connect(a, "linkedin", "aa");
  await s.connect(b, "linkedin", "bb");
  const accC = await s.connect(c, "linkedin", "cc");
  const lease = await s.job(a, "linkedin");
  s.db.prepare("UPDATE publish_jobs SET state = 'yayinlaniyor', lease_until = datetime('now', '-1 minute') WHERE id = ?").run(lease);
  const stale = await s.job(b, "linkedin");
  s.db.prepare("UPDATE publish_jobs SET run_at = datetime('now', '-25 hours') WHERE id = ?").run(stale);
  const moved = await s.job(c, "linkedin");
  s.db.prepare("UPDATE social_accounts SET external_id = 'cc-yeni' WHERE id = ?").run(accC);
  const f = fakeProvider(() => LI_OK());
  const r = await s.tick(f);
  assert.equal(r.leased, 0);
  assert.equal(f.calls.length, 0);
  assert.deepEqual([s.row(lease).state, s.row(lease).last_error, s.row(lease).lease_until], ["kontrol", "lease_expired", null]);
  assert.deepEqual(s.lastEvent(lease), { from_state: "yayinlaniyor", to_state: "kontrol", note: "lease_expired", actor: null });
  assert.deepEqual([s.row(stale).state, s.row(stale).last_error], ["basarisiz", "stale"]);
  assert.equal(s.lastEvent(stale).note, "stale");
  const m = s.row(moved);
  assert.deepEqual([m.state, m.approved_hash, m.idem_key, m.last_error], ["onay_bekliyor", null, null, "account_changed"]);
  // kontrol: kullanıcı "yayınlandı" işaretler ya da yeniden dener; yeni onay yeni hesap kimliğini yazar
  assert.equal(ok(await s.call("POST", `/publish/jobs/${lease}/done`, { token: a.token })).body.job.state, "yayinlandi");
  fails(await s.call("POST", `/publish/jobs/${lease}/done`, { token: a.token }), 409, "state");
  ok(await s.call("POST", `/publish/jobs/${stale}/retry`, { token: b.token }));
  ok(await s.call("POST", `/publish/jobs/${moved}/approve`, { token: c.token }));
  const r2 = await s.tick(f);
  assert.equal(r2.leased, 2);
  assert.ok(f.calls.some(x => JSON.parse(x.body).author === "urn:li:person:cc-yeni"));
});

test("art arda 3 başarısızlık: önce onaylanmış iş kiralanmaz, taze onay açar; bayat sayılmaz", async () => {
  const s = setup();
  const u = s.user("a@x.co");
  const acc = await s.connect(u, "linkedin", "abc");
  const fail = (note, ago = "-1 hours", state = "basarisiz") => s.db.prepare(`INSERT INTO publish_jobs (user_id, site, account_id, account_external_id, platform,
    body, body_hash, state, last_error, updated_at) VALUES (?, ?, ?, 'abc', 'linkedin', 'x', 'h', ?, ?, datetime('now', ?))`).run(u.id, SITE, acc, state, note, ago);
  fail("li_forbidden", "-3 hours");
  fail("li_400", "-2 hours");
  fail("stale", "-90 minutes");
  const id = await s.job(u, "linkedin");
  s.db.prepare("UPDATE publish_jobs SET approved_at = datetime('now', '-4 hours') WHERE id = ?").run(id);
  const f = fakeProvider(() => LI_OK());
  assert.equal((await s.tick(f)).leased, 1, "bayat hata kesiciye sayılmaz");
  const id2 = await s.job(u, "linkedin");
  fail("reconnect", "-1 hours");
  s.db.prepare("UPDATE publish_jobs SET approved_at = datetime('now', '-4 hours') WHERE id = ?").run(id2);
  // son 3 sonuç: reconnect (basarisiz), yayinlandi (id), li_400 → kesici kapalı
  assert.equal((await s.tick(f)).leased, 1);
  const id3 = await s.job(u, "linkedin");
  // Önceki başarılar daha eski olsun: son 3 sonuç aşağıdaki 3 hata
  s.db.prepare("UPDATE publish_jobs SET updated_at = datetime('now', '-10 minutes') WHERE state = 'yayinlandi'").run();
  fail("li_500", "-1 minutes");
  fail("li_forbidden", "-1 minutes");
  fail("li_400", "-1 minutes");
  s.db.prepare("UPDATE publish_jobs SET approved_at = datetime('now', '-2 hours') WHERE id = ?").run(id3);
  assert.equal((await s.tick(f)).leased, 0);
  assert.equal(s.row(id3).state, "planlandi");
  s.db.prepare("UPDATE publish_jobs SET approved_at = datetime('now') WHERE id = ?").run(id3);
  assert.equal((await s.tick(f)).leased, 1);
  assert.equal(f.calls.length, 3);
});

// ---- sağlayıcı sonuçları ----

test("LinkedIn 201 → yayinlandi + remote_id; tek istek, kaçışlı metin, sayaçlar, token log'a/olaya yazılmaz", async () => {
  const s = setup();
  const u = s.user("a@x.co");
  await s.connect(u, "linkedin", "abc123");
  const id = await s.job(u, "linkedin", { body: "Merhaba @ad (test) #etiket" });
  const f = fakeProvider([LI_OK()]);
  const logs = [];
  const r = await s.tick(f, { log: l => logs.push(l) });
  assert.deepEqual(r, { leased: 1, done: [{ id, to: "yayinlandi", code: null }], released: 0, sub: 1, d1: 13 });
  const j = s.row(id);
  assert.deepEqual([j.state, j.remote_id, j.lease_until, j.attempts, j.next_try_at], ["yayinlandi", "urn:li:share:7001", null, 0, null]);
  assert.equal(f.calls.length, 1);
  const c = f.calls[0];
  assert.equal(c.url, `${LI}/rest/posts`);
  assert.equal(c.method, "POST");
  assert.equal(c.headers.authorization, `Bearer tok-linkedin-${u.id}`);
  assert.match(c.headers["linkedin-version"], /^\d{6}$/);
  const b = JSON.parse(c.body);
  assert.equal(b.author, "urn:li:person:abc123");
  assert.equal(b.commentary, "Merhaba \\@ad \\(test\\) \\#etiket");
  assert.equal(b.lifecycleState, "PUBLISHED");
  assert.deepEqual(s.lastEvent(id), { from_state: "yayinlaniyor", to_state: "yayinlandi", note: null, actor: null });
  assert.equal(logs.length, 1);
  const log = JSON.parse(logs[0]);
  assert.deepEqual({ ...log, ms: 0 }, { ev: "publish", job: id, platform: "linkedin", from: "yayinlaniyor", to: "yayinlandi", ms: 0, code: null });
  const dump = JSON.stringify([s.db.prepare("SELECT * FROM publish_jobs").all(), s.db.prepare("SELECT * FROM publish_events").all(), logs]);
  assert.equal(dump.includes("tok-linkedin"), false);
  const f2 = fakeProvider([]);
  assert.equal((await s.tick(f2)).leased, 0);
  assert.equal(f2.calls.length, 0);
});

test("IG: konteyner IN_PROGRESS → planlandi (60 sn, deneme değil); sonraki tur aynı konteynerle yayınlar", async () => {
  const s = setup();
  const u = s.user("a@x.co");
  await s.connect(u, "instagram", "1789");
  const id = await s.job(u, "instagram", { body: "Yeni ürün #yeni" });
  const f1 = fakeProvider([IG_LIMIT(), { body: { id: "C77" } }, { body: { status_code: "IN_PROGRESS" } }, { body: { status_code: "IN_PROGRESS" } }]);
  const r1 = await s.tick(f1);
  assert.deepEqual(r1.done, [{ id, to: "planlandi", code: "ig_in_progress" }]);
  assert.equal(r1.d1, 14);
  assert.deepEqual([s.row(id).container_id, s.row(id).attempts], ["C77", 0]);
  near(s.inSec(id), 60);
  assert.equal(f1.calls[0].url.startsWith(`${IG_API}/1789/content_publishing_limit?`), true);
  assert.deepEqual([f1.calls[1].url, f1.calls[1].method], [`${IG_API}/1789/media`, "POST"]);
  const form = new URLSearchParams(f1.calls[1].body);
  assert.deepEqual([form.get("image_url"), form.get("caption")], ["https://cdn.example.com/a.jpg", "Yeni ürün #yeni"]);
  assert.equal((await s.tick(fakeProvider([]))).leased, 0, "bekleme dolmadan kiralanmaz");
  s.db.prepare("UPDATE publish_jobs SET next_try_at = datetime('now', '-1 minute') WHERE id = ?").run(id);
  const f2 = fakeProvider([IG_LIMIT(), { body: { status_code: "FINISHED" } }, { body: { id: "M9" } }]);
  const r2 = await s.tick(f2);
  assert.deepEqual(r2.done, [{ id, to: "yayinlandi", code: null }]);
  assert.equal(f2.calls.some(c => c.url.endsWith("/media")), false);
  assert.equal(f2.calls[2].url, `${IG_API}/1789/media_publish`);
  assert.equal(new URLSearchParams(f2.calls[2].body).get("creation_id"), "C77");
  assert.deepEqual([s.row(id).state, s.row(id).remote_id], ["yayinlandi", "M9"]);
});

test("429 Retry-After: deneme sayılmaz, bekleme başlıktan; IG yayın sınırı dolu → 1 sa", async () => {
  const s = setup();
  const a = s.user("a@x.co"), b = s.user("b@x.co");
  await s.connect(a, "linkedin", "aa");
  await s.connect(b, "instagram", "1789");
  const li = await s.job(a, "linkedin");
  const ig = await s.job(b, "instagram");
  const f = fakeProvider(url => (url.startsWith(LI) ? { status: 429, headers: { "retry-after": "120" } } : IG_LIMIT(50)));
  const r = await s.tick(f);
  assert.deepEqual(r.done.map(d => [d.id, d.to, d.code]).sort(), [[li, "planlandi", "li_429"], [ig, "planlandi", "ig_quota"]].sort());
  assert.equal(f.calls.length, 2);
  assert.deepEqual([s.row(li).attempts, s.row(ig).attempts], [0, 0]);
  near(s.inSec(li), 120);
  near(s.inSec(ig), 3600);
  // Retry-After yoksa üstel bekleme (deneme sayılmadan)
  s.db.prepare("UPDATE publish_jobs SET next_try_at = datetime('now', '-1 minute') WHERE id = ?").run(li);
  await s.tick(fakeProvider([{ status: 429 }]), {}, { ...s.env, PUBLISH_PLATFORMS: "linkedin" });
  assert.equal(s.row(li).attempts, 0);
  near(s.inSec(li), backoff(0, li));
});

test("IG 401 → tek yenileme (CAS ile yazılır) → başarı; ikinci 401 → basarisiz", async () => {
  const s = setup();
  const u = s.user("a@x.co");
  await s.connect(u, "instagram", "1789", { token: "eski-ig" });
  const id = await s.job(u, "instagram");
  const f = fakeProvider(url => {
    if (url.includes("/refresh_access_token?")) return { body: { access_token: "yeni-ig", expires_in: 5184000 } };
    if (url.includes("/content_publishing_limit?")) return url.includes("access_token=eski-ig") ? { status: 401, body: { error: { code: 190, message: "x" } } } : IG_LIMIT();
    if (url.endsWith("/media")) return { body: { id: "C5" } };
    if (url.endsWith("/media_publish")) return { body: { id: "M5" } };
    return { body: { status_code: "FINISHED" } };
  });
  const r = await s.tick(f);
  assert.deepEqual(r.done, [{ id, to: "yayinlandi", code: null }]);
  assert.equal(r.sub, 6);
  assert.equal(f.calls.filter(c => c.url.includes("refresh_access_token")).length, 1);
  assert.equal(f.calls[1].url, "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=eski-ig");
  assert.equal(new URLSearchParams(f.calls.at(-1).body).get("access_token"), "yeni-ig");
  const t = s.db.prepare("SELECT access_token, expires_at > datetime('now', '+59 days') AS fresh FROM oauth_tokens WHERE user_id = ?").get(u.id);
  assert.equal(await decrypt(s.env, t.access_token), "yeni-ig");
  assert.equal(t.fresh, 1);

  // Yenilemeden sonra yine 401: ikinci yenileme yok, basarisiz
  const s2 = setup();
  const u2 = s2.user("b@x.co");
  await s2.connect(u2, "instagram", "1790");
  const id2 = await s2.job(u2, "instagram");
  const g = fakeProvider(url => (url.includes("/refresh_access_token?") ? { body: { access_token: "yeni", expires_in: 100 } } : { status: 401, body: {} }));
  assert.deepEqual((await s2.tick(g)).done, [{ id: id2, to: "basarisiz", code: "reconnect" }]);
  assert.equal(g.calls.length, 3);
  assert.equal(g.calls.filter(c => c.url.includes("refresh_access_token")).length, 1);
});

test("IG token 7 günden az kaldıysa yayından önce yenilenir", async () => {
  const s = setup();
  const u = s.user("a@x.co");
  await s.connect(u, "instagram", "1789", { token: "eski-ig", expires: "+2 days" });
  const id = await s.job(u, "instagram");
  const f = fakeProvider([{ body: { access_token: "yeni-ig", expires_in: 5184000 } }, ...IG_OK()]);
  assert.deepEqual((await s.tick(f)).done, [{ id, to: "yayinlandi", code: null }]);
  assert.match(f.calls[0].url, /refresh_access_token/);
  assert.match(f.calls[1].url, /access_token=yeni-ig/);
  assert.equal(f.calls.length, 5);
});

test("LinkedIn 401 → basarisiz, yenileme çağrısı yok; süresi dolmuş token → istek yok", async () => {
  const s = setup();
  const a = s.user("a@x.co"), b = s.user("b@x.co");
  await s.connect(a, "linkedin", "aa");
  await s.connect(b, "linkedin", "bb", { expires: "-1 hours" });
  const ja = await s.job(a, "linkedin");
  const jb = await s.job(b, "linkedin");
  const f = fakeProvider([{ status: 401, body: { message: "x" } }]);
  const r = await s.tick(f);
  assert.deepEqual(r.done.map(d => [d.id, d.to, d.code]).sort(), [[ja, "basarisiz", "reconnect"], [jb, "basarisiz", "reconnect"]].sort());
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, `${LI}/rest/posts`);
});

test("403 → basarisiz, tekrar yok; IG izin hatası (code 10) → basarisiz", async () => {
  const s = setup();
  const a = s.user("a@x.co"), b = s.user("b@x.co");
  await s.connect(a, "linkedin", "aa");
  await s.connect(b, "instagram", "1789");
  const li = await s.job(a, "linkedin");
  const ig = await s.job(b, "instagram");
  const f = fakeProvider(url => (url.startsWith(LI) ? { status: 403, body: {} } : url.endsWith("/media") ? { status: 400, body: { error: { code: 10 } } } : IG_LIMIT()));
  const r = await s.tick(f);
  assert.deepEqual(r.done.map(d => [d.id, d.to, d.code]).sort(), [[li, "basarisiz", "li_forbidden"], [ig, "basarisiz", "ig_forbidden"]].sort());
  const n = f.calls.length;
  assert.equal((await s.tick(f)).leased, 0);
  assert.equal(f.calls.length, n);
});

test("yazmada 5xx / zaman aşımı / fetch istisnası → kontrol, ikinci çağrı yok", async () => {
  for (const [resp, code] of [[{ status: 503 }, "li_503"], [{ throw: "timeout" }, "li_network"], [{ throw: "network" }, "li_network"]]) {
    const s = setup();
    const u = s.user("a@x.co");
    await s.connect(u, "linkedin", "aa");
    const id = await s.job(u, "linkedin");
    const f = fakeProvider([resp]);
    assert.deepEqual((await s.tick(f)).done, [{ id, to: "kontrol", code }]);
    assert.equal(f.calls.length, 1);
    assert.equal((await s.tick(f)).leased, 0);
    assert.equal(f.calls.length, 1);
    assert.equal(s.row(id).attempts, 0);
  }
  for (const [resp, code] of [[{ status: 500, body: {} }, "ig_500"], [{ throw: "timeout" }, "ig_network"]]) {
    const s = setup();
    const u = s.user("a@x.co");
    await s.connect(u, "instagram", "1789");
    const id = await s.job(u, "instagram");
    const f = fakeProvider([...IG_OK().slice(0, 3), resp]);
    assert.deepEqual((await s.tick(f)).done, [{ id, to: "kontrol", code }]);
    assert.equal(f.calls.filter(c => c.url.endsWith("/media_publish")).length, 1);
    assert.equal((await s.tick(fakeProvider([]))).leased, 0);
    // Kullanıcı yeniden denerse konteyner yeniden kullanılır (yeni /media yok)
    ok(await s.call("POST", `/publish/jobs/${id}/retry`, { token: u.token }));
    const g = fakeProvider([IG_LIMIT(), { body: { status_code: "FINISHED" } }, { body: { id: "M2" } }]);
    assert.deepEqual((await s.tick(g)).done, [{ id, to: "yayinlandi", code: null }]);
  }
});

test("üstel bekleme: değerler, hazırlık 5xx deneme sayar, 5. denemede basarisiz", async () => {
  assert.equal(backoff(0, 0), 60);
  assert.equal(backoff(1, 0), 120);
  assert.equal(backoff(5, 0), 1920);
  assert.equal(backoff(9, 0), 21600);
  assert.equal(backoff(30, 0), 21600);
  assert.equal(backoff(0, 1), 97);
  assert.equal(backoff(2, 2), 254);
  for (let id = 0; id < 200; id++) assert.ok(backoff(0, id) >= 60 && backoff(0, id) < 120);
  const s = setup();
  const u = s.user("a@x.co");
  await s.connect(u, "instagram", "1789");
  const id = await s.job(u, "instagram");
  assert.deepEqual((await s.tick(fakeProvider([{ status: 502, body: {} }]))).done, [{ id, to: "planlandi", code: "ig_502" }]);
  assert.equal(s.row(id).attempts, 1);
  near(s.inSec(id), backoff(0, id));
  s.db.prepare("UPDATE publish_jobs SET attempts = ?, next_try_at = datetime('now', '-1 minute') WHERE id = ?").run(MAX_ATTEMPTS - 1, id);
  assert.deepEqual((await s.tick(fakeProvider([{ throw: "network" }]))).done, [{ id, to: "basarisiz", code: "max_attempts:ig_network" }]);
});

// ---- bütçe ve süre ----

test("bütçe: LIMIT alt istek ve D1'den hesaplanır (sub 14 → 2, d1 21 → 1, sub 5 → kira yok)", async () => {
  const mk = async () => {
    const s = setup();
    for (const e of ["a", "b", "c"]) {
      const u = s.user(`${e}@x.co`);
      await s.connect(u, "linkedin", `ext-${e}`);
      await s.job(u, "linkedin");
    }
    return s;
  };
  let s = await mk();
  let f = fakeProvider(() => LI_OK());
  let r = await s.tick(f, { sub: 14 });
  assert.deepEqual([r.leased, r.sub, f.calls.length], [2, 2, 2]);
  assert.equal(s.db.prepare("SELECT count(*) n FROM publish_jobs WHERE state = 'planlandi'").get().n, 1);
  s = await mk();
  r = await s.tick(fakeProvider(() => LI_OK()), { d1: 21 });
  assert.equal(r.leased, 1);
  assert.ok(r.d1 <= 21);
  s = await mk();
  f = fakeProvider(() => LI_OK());
  r = await s.tick(f, { sub: 5 });
  assert.deepEqual(r, { leased: 0, done: [], released: 0, sub: 0, d1: 9 });
  assert.equal(f.calls.length, 0);
  // Varsayılan bütçede en kötü durum 50'yi aşmaz: 6 IG işi
  s = setup({ PUBLISH_PER_RUN: "6", PUBLISH_PLATFORMS: "instagram" });
  for (let i = 0; i < 8; i++) {
    const u = s.user(`ig${i}@x.co`);
    await s.connect(u, "instagram", `ig${i}`, { expires: "+1 days" });
    await s.job(u, "instagram");
  }
  f = fakeProvider(url => (url.includes("refresh_access_token") ? { body: { access_token: "n", expires_in: 100 } }
    : url.includes("content_publishing_limit") ? IG_LIMIT() : url.endsWith("/media") ? { body: { id: "C" } }
      : url.endsWith("/media_publish") ? { body: { id: "M" } } : { body: { status_code: "FINISHED" } }));
  r = await s.tick(f);
  assert.equal(r.leased, 6);
  assert.ok(r.sub <= 50 && r.d1 <= 50, JSON.stringify(r));
});

test("kirası alınıp işlenmeyen iş planlandi'ya döner: süre (deadline) ve bütçe (budget)", async () => {
  const mk = async (extra) => {
    const s = setup(extra);
    const ids = [];
    for (const e of ["a", "b", "c"]) {
      const u = s.user(`${e}@x.co`);
      await s.connect(u, "linkedin", `ext-${e}`);
      ids.push(await s.job(u, "linkedin", { run_at: isoAgo(200 - ids.length * 60) }));
    }
    return { s, ids };
  };
  let { s, ids } = await mk();
  let t = 1000;
  const f = fakeProvider(() => { t += 25000; return LI_OK(); });
  const r = await s.tick(f, { clock: () => t });
  assert.deepEqual([r.leased, r.released, r.done.map(d => d.id)], [3, 2, [ids[0]]]);
  assert.equal(r.d1, 9 + 1 + 1 + 2 + 2);
  for (const id of ids.slice(1)) {
    assert.deepEqual([s.row(id).state, s.row(id).lease_until, s.row(id).attempts], ["planlandi", null, 0]);
    assert.deepEqual(s.lastEvent(id), { from_state: "yayinlaniyor", to_state: "planlandi", note: "deadline", actor: null });
  }
  const r2 = await s.tick(fakeProvider(() => LI_OK()));
  assert.equal(r2.done.length, 2);

  // Bütçe ağı: tur ortasında maliyet bütçeyi aşarsa kalan iş istek göndermeden bırakılır
  ({ s, ids } = await mk({ PUBLISH_PLATFORMS: "linkedin" }));
  const g = fakeProvider(() => { COST.linkedin = 100; return LI_OK(); });
  let r3;
  try { r3 = await s.tick(g); } finally { COST.linkedin = 1; }
  assert.deepEqual([r3.leased, r3.released, g.calls.length], [3, 2, 1]);
  assert.equal(s.lastEvent(ids[2]).note, "budget");
});

// ---- saat ----

test("Europe/Istanbul → UTC çevirisi ve run_at doğrulaması", () => {
  assert.equal(parseRunAt("2026-11-24T10:00"), "2026-11-24 07:00:00");
  assert.equal(parseRunAt("2026-11-24 10:00:30"), "2026-11-24 07:00:30");
  assert.equal(parseRunAt("2015-07-01T12:00"), "2015-07-01 09:00:00"); // eski yaz saati (+03)
  assert.equal(parseRunAt("2015-01-15T12:00"), "2015-01-15 10:00:00"); // eski kış saati (+02)
  assert.equal(parseRunAt("2026-11-24T10:00:00Z"), "2026-11-24 10:00:00");
  assert.equal(parseRunAt("2026-11-24T10:00:00.999Z"), "2026-11-24 10:00:00");
  assert.equal(parseRunAt("2026-11-24T10:00+01:00"), "2026-11-24 09:00:00");
  assert.equal(parseRunAt("2026-11-24T00:30"), "2026-11-23 21:30:00");
  for (const bad of ["2026-02-30T10:00", "2026-11-24", "2026-11-24T24:00", "2026-11-24T10:60", "yarın", 1764000000000, null, "2026-11-24T10:00+3"]) {
    assert.throws(() => parseRunAt(bad), /run_at/, String(bad));
  }
  assert.equal(toSql(Date.UTC(2026, 10, 24, 7, 0, 0)), "2026-11-24 07:00:00");
});

test("sağlayıcı yardımcıları: liEscape, retryAfter", () => {
  assert.equal(liEscape("a_b*c ~ <x> [y] {z} | \\"), "a\\_b\\*c \\~ \\<x\\> \\[y\\] \\{z\\} \\| \\\\");
  const now = Math.floor(Date.now() / 1000) * 1000;
  const ra = v => retryAfter(new Response(null, { headers: v == null ? {} : { "retry-after": v } }), now);
  assert.equal(ra("30"), 30);
  assert.equal(ra("0"), 1);
  assert.equal(ra("99999"), 21600);
  assert.equal(ra("x"), null);
  assert.equal(ra(null), null);
  assert.equal(ra(new Date(now + 90000).toUTCString()), 90);
});

// ---- index.js ----

test("scheduled: '*/5' yalnız yayın dalı (kapalıyken 0 D1), '17 * * * *' ve olaysız çağrı yalnız mevcut saatlik iş", async t => {
  t.mock.method(console, "log", () => {});
  const run = async (event, extra = {}) => {
    const c = counted(d1(freshDb()));
    await worker.scheduled(event, { DB: c.db, PUBLISH_ENABLED: "0", PUBLISH_SITES: "", PUBLISH_PLATFORMS: "", PUBLISH_PER_RUN: "3", ...extra });
    return c.n;
  };
  let n = await run({ cron: "*/5 * * * *" });
  assert.deepEqual([n.prepare, n.batch], [0, 0]);
  n = await run({ cron: "*/5 * * * *" }, ON);
  assert.ok(n.sql.some(q => /publish_jobs/.test(q)));
  assert.equal(n.sql.some(q => /submissions/.test(q)), false);
  for (const ev of [{ cron: "17 * * * *" }, undefined, {}]) {
    for (const extra of [{}, ON]) {
      n = await run(ev, extra);
      assert.match(n.sql[0], /FROM submissions WHERE emailed = 0/);
      assert.equal(n.sql.some(q => /publish_/.test(q)), false, JSON.stringify(ev));
    }
  }
});

test("index.js /publish/ rotası: bayrak kapalıyken 503 not_ready (CORS ile, D1 yok), Origin yoksa 403", async () => {
  const c = counted(d1(freshDb()));
  const env = { DB: c.db, DEV_ORIGINS: ORIGIN, ALLOWED_HOSTS: SITE, PUBLISH_ENABLED: "0", PUBLISH_SITES: "", PUBLISH_PLATFORMS: "" };
  let res = await worker.fetch(new Request("https://forms.test/publish/jobs", { headers: { origin: ORIGIN } }), env, {});
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { ok: false, error: "not_ready" });
  assert.equal(res.headers.get("access-control-allow-origin"), ORIGIN);
  res = await worker.fetch(new Request("https://forms.test/publish/jobs"), env, {});
  assert.equal(res.status, 403);
  assert.deepEqual([c.n.prepare, c.n.batch], [0, 0]);
});

test("düşük not 5: izinli ama hesap sitesi olmayan origin'in 403 origin yanıtı CORS'lu (istemci okur); izinsiz/yok origin CORS'suz", async () => {
  const c = counted(d1(freshDb()));
  const env = { DB: c.db, ALLOWED_HOSTS: `${SITE},saascorner.co,app.socialmediacorner.co`, ACCOUNTS_ENABLED: "0", ...ON };
  const get = (path, origin) => worker.fetch(new Request(`https://forms.test${path}`, { headers: origin ? { origin } : {} }), env, {});
  for (const path of ["/publish/jobs", "/auth/me", "/app/profile"]) {
    for (const o of ["https://saascorner.co", "https://app.socialmediacorner.co"]) {
      const res = await get(path, o);
      assert.deepEqual([res.status, (await res.json()).error, res.headers.get("access-control-allow-origin")], [403, "origin", o], `${path} ${o}`);
    }
    for (const o of ["https://evil.example", null]) {
      const res = await get(path, o);
      assert.deepEqual([res.status, res.headers.get("access-control-allow-origin")], [403, null], `${path} ${o}`);
    }
  }
  assert.deepEqual([c.n.prepare, c.n.batch], [0, 0]);
});

// ---- 25.11: plan kapısı (smc), yazma kapsamı onayda, OAuth yazma kapsamı yalnız kuyruk açıkken ----

test("smc kuyruk planı: demo/basic/plan yok 403 plan_required {plan:'pro'}; pro/enterprise açar; eski işler görülür, düzenlenir, iptal edilir; brandcorner değişmez", async () => {
  const APP = "https://app.socialmediacorner.co", SMC = "app.socialmediacorner.co";
  // 0018 yok (plan sütunu yok): planOf null, kapalı kalır
  const s0 = setup({ ACCOUNTS_ENABLED: "1", PUBLISH_SITES: `${SITE},${SMC}` });
  const z = s0.user("z@x.co", SMC);
  await s0.connect(z, "linkedin", "zz");
  const r0 = await s0.call("POST", "/publish/jobs", { token: z.token, origin: APP, body: { rid: "z1", platform: "linkedin", body: "x" } });
  fails(r0, 403, "plan_required");
  assert.equal(r0.body.plan, "pro");

  const s = setup({ ACCOUNTS_ENABLED: "1", PUBLISH_SITES: `${SITE},${SMC}` });
  s.db.exec(read("../migrations/0018_plans.sql"));
  const as = (u, plan) => s.db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, u.id);
  const call = (u, m, p, body) => s.call(m, p, { token: u.token, origin: APP, body });
  const users = {};
  for (const plan of ["demo", "basic", "bilinmeyen", "pro", "enterprise"]) {
    users[plan] = s.user(`${plan}@x.co`, SMC);
    as(users[plan], plan);
    await s.connect(users[plan], "linkedin", `li-${plan}`);
  }
  for (const plan of ["demo", "basic", "bilinmeyen"]) {
    const u = users[plan];
    const r = await call(u, "POST", "/publish/jobs", { rid: `r-${plan}`, platform: "linkedin", body: "Merhaba" });
    fails(r, 403, "plan_required");
    assert.equal(r.body.plan, "pro");
    const l = ok(await call(u, "GET", "/publish/jobs"));
    assert.deepEqual([l.body.jobs, l.body.plan_required], [[], "pro"]);
  }
  const planned = {};
  for (const plan of ["pro", "enterprise"]) {
    const u = users[plan];
    const id = ok(await call(u, "POST", "/publish/jobs", { rid: `r-${plan}`, platform: "linkedin", body: "Merhaba" })).body.job.id;
    ok(await call(u, "POST", `/publish/jobs/${id}/submit`));
    ok(await call(u, "POST", `/publish/jobs/${id}/approve`, { run_at: isoAgo(60) }));
    assert.equal(s.row(id).state, "planlandi");
    planned[plan] = id;
    assert.equal(ok(await call(u, "GET", "/publish/jobs")).body.plan_required, null);
  }
  // pro → basic: açık işler kalır; görme, düzenleme, iptal açık; gönderme/onay/yeniden deneme 403
  const u = users.pro;
  const a = ok(await call(u, "POST", "/publish/jobs", { rid: "pro-a", platform: "linkedin", body: "Taslak" })).body.job.id;
  const b = ok(await call(u, "POST", "/publish/jobs", { rid: "pro-b", platform: "linkedin", body: "Onay bekleyen" })).body.job.id;
  ok(await call(u, "POST", `/publish/jobs/${b}/submit`));
  const c = ok(await call(u, "POST", "/publish/jobs", { rid: "pro-c", platform: "linkedin", body: "Başarısız" })).body.job.id;
  s.db.prepare("UPDATE publish_jobs SET state = 'basarisiz' WHERE id = ?").run(c);
  as(u, "basic");
  assert.equal(ok(await call(u, "GET", "/publish/jobs")).body.jobs.length, 4);
  ok(await call(u, "GET", `/publish/jobs/${a}`));
  ok(await call(u, "PUT", `/publish/jobs/${a}`, { body: "Düzeltilmiş" }));
  for (const [id, act] of [[a, "submit"], [b, "approve"], [c, "retry"]]) {
    const r = await call(u, "POST", `/publish/jobs/${id}/${act}`, { run_at: isoAgo(60) });
    fails(r, 403, "plan_required");
    assert.equal(r.body.plan, "pro");
  }
  assert.deepEqual([a, b, c].map(id => s.row(id).state), ["taslak", "onay_bekliyor", "basarisiz"]);
  ok(await call(u, "POST", `/publish/jobs/${b}/cancel`));
  assert.equal(s.row(b).state, "iptal");
  // brandcorner.co'da plan kapısı yok: basic (0018 varsayılanı) kullanıcı da kuyruğu kullanır, listede plan alanı yok
  const bc = s.user("bc@x.co");
  await s.connect(bc, "linkedin", "bc1");
  const id = await s.job(bc, "linkedin");
  assert.equal(s.row(id).state, "planlandi");
  assert.equal("plan_required" in ok(await s.call("GET", "/publish/jobs", { token: bc.token })).body, false);

  // Cron: plan düşen kullanıcının planlandi işi kiralanmaz; onay_bekliyor'a döner, onay silinir, last_error plan_required.
  // enterprise (smc) ve brandcorner basic işleri yayınlanır.
  const p = planned.pro;
  assert.ok(s.row(p).approved_at && s.row(p).idem_key);
  let f = fakeProvider(() => LI_OK());
  let r = await s.tick(f);
  assert.deepEqual(r.done.map(d => d.id).sort((x, y) => x - y), [planned.enterprise, id].sort((x, y) => x - y));
  assert.equal(f.calls.length, 2);
  const j = s.row(p);
  assert.deepEqual([j.state, j.last_error, j.approved_by, j.approved_at, j.approved_hash, j.idem_key, j.lease_until],
    ["onay_bekliyor", "plan_required", null, null, null, null, null]);
  assert.deepEqual(s.lastEvent(p), { from_state: "planlandi", to_state: "onay_bekliyor", note: "plan_required", actor: null });
  assert.deepEqual([s.row(planned.enterprise).state, s.row(id).state], ["yayinlandi", "yayinlandi"]);
  // basic'te yeniden onay 403; sonraki tur bir şey yapmaz
  fails(await call(u, "POST", `/publish/jobs/${p}/approve`, { run_at: isoAgo(60) }), 403, "plan_required");
  r = await s.tick(f);
  assert.equal(r.leased, 0);
  assert.equal(s.events(p).filter(e => e.note === "plan_required").length, 1);
  // Pro'ya dönünce yeniden onaylanır ve yayınlanır
  as(u, "pro");
  ok(await call(u, "POST", `/publish/jobs/${p}/approve`, { run_at: isoAgo(60) }));
  f = fakeProvider(() => LI_OK());
  r = await s.tick(f);
  assert.deepEqual(r.done, [{ id: p, to: "yayinlandi", code: null }]);
  // Deneme bitti (demo) ya da bilinmeyen plan da düşüş sayılır
  for (const plan of ["demo", "bilinmeyen"]) {
    as(u, "pro");
    const q = ok(await call(u, "POST", "/publish/jobs", { rid: `cron-${plan}`, platform: "linkedin", body: `Plan ${plan}` })).body.job.id;
    ok(await call(u, "POST", `/publish/jobs/${q}/submit`));
    ok(await call(u, "POST", `/publish/jobs/${q}/approve`, { run_at: isoAgo(60) }));
    as(u, plan);
    assert.equal((await s.tick(fakeProvider(() => LI_OK()))).leased, 0);
    assert.deepEqual([s.row(q).state, s.row(q).last_error], ["onay_bekliyor", "plan_required"]);
  }
});

test("cron plan kapısı: users.plan okunamazsa (0018 yok) smc işleri kiralanmaz, brandcorner sürer", async () => {
  const APP = "https://app.socialmediacorner.co", SMC = "app.socialmediacorner.co";
  const s = setup({ ACCOUNTS_ENABLED: "1", PUBLISH_SITES: `${SITE},${SMC}` });
  s.db.exec(read("../migrations/0018_plans.sql"));
  const u = s.user("p@x.co", SMC);
  s.db.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").run(u.id);
  await s.connect(u, "linkedin", "p1");
  const call = (m, p, body) => s.call(m, p, { token: u.token, origin: APP, body });
  const a = ok(await call("POST", "/publish/jobs", { rid: "p-1", platform: "linkedin", body: "Merhaba" })).body.job.id;
  ok(await call("POST", `/publish/jobs/${a}/submit`));
  ok(await call("POST", `/publish/jobs/${a}/approve`, { run_at: isoAgo(60) }));
  const bc = s.user("bc@x.co");
  await s.connect(bc, "linkedin", "bc1");
  const b = await s.job(bc, "linkedin");
  s.db.exec("ALTER TABLE users DROP COLUMN plan");
  const logs = [];
  const r = await s.tick(fakeProvider(() => LI_OK()), { log: l => logs.push(l) });
  assert.deepEqual(r.done, [{ id: b, to: "yayinlandi", code: null }]);
  assert.equal(s.row(a).state, "planlandi");
  assert.ok(logs.some(l => JSON.parse(l).ev === "publish_plan_check"));
});

test("onay ve yeniden deneme yazma kapsamını ister: yoksa 409 reconnect_required, iş yerinde kalır; virgüllü IG kapsamı okunur", async () => {
  const s = setup();
  const u = s.user("a@x.co"), t = s.user("t@x.co");
  await s.connect(u, "linkedin", "l1", { scope: "r_basicprofile r_organization_social" });
  await s.connect(u, "instagram", "i1", { scope: "instagram_business_basic,instagram_business_content_publish" });
  const li = await s.job(u, "linkedin", { approve: false });
  const act = (id, a, body) => s.call("POST", `/publish/jobs/${id}/${a}`, { token: u.token, body });
  ok(await act(li, "submit"));
  fails(await act(li, "approve", { run_at: isoAgo(60) }), 409, "reconnect_required");
  assert.equal(s.row(li).state, "onay_bekliyor");
  assert.deepEqual(s.events(li).map(e => e.note), ["created", "submitted"]);
  // kapsam bir metnin parçası olarak sayılmaz
  s.db.prepare("UPDATE oauth_tokens SET scope = 'r_basicprofile xw_member_social' WHERE user_id = ? AND platform = 'linkedin'").run(u.id);
  fails(await act(li, "approve", { run_at: isoAgo(60) }), 409, "reconnect_required");
  // yeniden bağlanınca (yazma kapsamı geldi) onay geçer
  s.db.prepare("UPDATE oauth_tokens SET scope = 'r_basicprofile w_member_social' WHERE user_id = ? AND platform = 'linkedin'").run(u.id);
  ok(await act(li, "approve", { run_at: isoAgo(60) }));
  const ig = await s.job(u, "instagram");
  assert.equal(s.row(ig).state, "planlandi");
  // yeniden deneme: kapsam geri alınmış token'la 409, iş basarisiz'da kalır
  s.db.prepare("UPDATE publish_jobs SET state = 'basarisiz' WHERE id = ?").run(ig);
  s.db.prepare("UPDATE oauth_tokens SET scope = 'instagram_business_basic' WHERE user_id = ? AND platform = 'instagram'").run(u.id);
  fails(await act(ig, "retry"), 409, "reconnect_required");
  assert.equal(s.row(ig).state, "basarisiz");
  // token satırı hiç yoksa da yeniden bağlanmalı
  await s.connect(t, "linkedin", "t1");
  const tj = await s.job(t, "linkedin", { approve: false });
  ok(await s.call("POST", `/publish/jobs/${tj}/submit`, { token: t.token }));
  s.db.prepare("DELETE FROM oauth_tokens WHERE user_id = ?").run(t.id);
  fails(await s.call("POST", `/publish/jobs/${tj}/approve`, { token: t.token, body: { run_at: isoAgo(60) } }), 409, "reconnect_required");
});

test("OAuth yazma kapsamını yalnız kuyruk o site ve platform için açıkken ister (IG virgülle, LinkedIn boşlukla); kapalıyken izin ekranı aynı", async () => {
  const { authorizeUrl, startOAuth, writeScope, hasWriteScope } = await import("./oauth.js");
  const scopeOf = url => new URL(url).searchParams.get("scope");
  const off = { LINKEDIN_CLIENT_ID: "li", INSTAGRAM_CLIENT_ID: "ig" };
  const base = { li: scopeOf(authorizeUrl(off, "linkedin", "s", "https://r")), ig: scopeOf(authorizeUrl(off, "instagram", "s", "https://r")) };
  assert.equal(base.li.includes("w_member_social"), false);
  assert.equal(base.ig.includes("content_publish"), false);
  const on = { ...off, ...ON };
  assert.equal(writeScope(on, SITE, "linkedin"), "w_member_social");
  assert.equal(writeScope(on, SITE, "instagram"), "instagram_business_content_publish");
  for (const [env, site, p] of [[off, SITE, "linkedin"], [{ ...on, PUBLISH_ENABLED: "0" }, SITE, "linkedin"], [on, "saascorner.co", "linkedin"],
    [{ ...on, PUBLISH_PLATFORMS: "linkedin" }, SITE, "instagram"], [on, SITE, "youtube"], [on, SITE, "tiktok"]])
    assert.equal(writeScope(env, site, p), null, `${site} ${p}`);
  assert.equal(scopeOf(authorizeUrl(on, "linkedin", "s", "https://r", null, writeScope(on, SITE, "linkedin"))), `${base.li} w_member_social`);
  assert.equal(scopeOf(authorizeUrl(on, "instagram", "s", "https://r", null, writeScope(on, SITE, "instagram"))), `${base.ig},instagram_business_content_publish`);
  assert.deepEqual(["w_member_social", "a,w_member_social", "a w_member_social b", "xw_member_social", "", null].map(x => hasWriteScope(x, "linkedin")),
    [true, true, true, false, false, false]);
  assert.equal(hasWriteScope("w_member_social", "youtube"), false);
  // startOAuth siteyi geçirir: açık sitede kapsam eklenir, başka sitede eklenmez
  const s = setup(off);
  const u = s.user("a@x.co");
  const go = async site => scopeOf(await startOAuth(s.env, u.id, "linkedin", { api: "https://forms.test", origin: ORIGIN, site, user: {} }));
  assert.equal(await go(SITE), `${base.li} w_member_social`);
  assert.equal(await go("saascorner.co"), base.li);
});
