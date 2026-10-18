// node --test src/metrics.test.mjs — D1 yerine node:sqlite; ağ, wrangler ve deploy yok.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";

// smtp.js "cloudflare:sockets" içe aktarır; Node'da yok, testte sahte modül verilir
registerHooks({
  resolve(spec, ctx, next) {
    return spec === "cloudflare:sockets"
      ? { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true }
      : next(spec, ctx);
  },
});
const { SAMPLE, NO_DATA, metricsEnabled, sampleAccount, sampleLink, platformOf, accountMetrics, linkMetrics } = await import("./metrics.js");
const { platform } = await import("./platform.js");

const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const MIGRATION = readFileSync(new URL("../migrations/0001_metrics.sql", import.meta.url), "utf8");

// Testin ihtiyacı kadar D1: prepare().bind().all/first/run, batch, exec
function d1(db) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })) }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => {
      const i = db.prepare(sql).run(...args);
      return { success: true, meta: { changes: Number(i.changes), last_row_id: Number(i.lastInsertRowid) } };
    },
  });
  return { prepare: sql => stmt(sql), batch: async list => Promise.all(list.map(s => s.run())), exec: async sql => db.exec(sql) };
}

function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  db.exec(MIGRATION);
  return db;
}

const insert = (db, sql, ...args) => Number(db.prepare(sql).run(...args).lastInsertRowid);
const user = (db, email, role = "influencer", profile = {}) =>
  insert(db, "INSERT INTO users (site, email, name, role, lang, pass, consent_at, profile) VALUES ('brandcorner.co', ?, 'Ad', ?, 'tr', 'x', datetime('now'), ?)", email, role, JSON.stringify(profile));
const social = (db, userId, platformName, handle, status = "connected") =>
  insert(db, "INSERT INTO social_accounts (user_id, platform, handle, status) VALUES (?, ?, ?, ?)", userId, platformName, handle, status);
const snapshot = (db, accountId, takenAt, followers, views = 100, likes = 10, comments = 1) =>
  insert(db, "INSERT INTO metric_snapshots (account_id, taken_at, followers, avg_views, avg_likes, avg_comments) VALUES (?, ?, ?, ?, ?, ?)",
    accountId, takenAt, followers, views, likes, comments);

// ---- örnek veri ----

test("metricsEnabled yalnızca \"1\" ile açılır", () => {
  assert.equal(metricsEnabled({ METRICS_ENABLED: "1" }), true);
  for (const v of ["0", "", "true", 1, undefined]) assert.equal(metricsEnabled({ METRICS_ENABLED: v }), false);
  assert.equal(metricsEnabled(undefined), false);
});

test("sampleAccount: aynı girdi aynı sayı, aralıklar tutarlı", () => {
  for (const p of ["instagram", "tiktok", "youtube"]) {
    for (const h of ["ayse", "mehmet", "", undefined]) {
      const a = sampleAccount(p, h);
      assert.deepEqual(sampleAccount(p, h), a);
      assert.ok(a.followers >= 2000 && a.followers <= 250000, `${p}/${h} takipçi ${a.followers}`);
      assert.ok(a.avg_views > 0 && a.avg_views <= a.followers * 1.2);
      assert.ok(a.avg_likes > 0 && a.avg_likes < a.avg_views);
      assert.ok(a.avg_comments >= 0 && a.avg_comments < a.avg_likes);
      for (const v of Object.values(a)) assert.ok(Number.isInteger(v));
    }
  }
  assert.notDeepEqual(sampleAccount("instagram", "ayse"), sampleAccount("instagram", "mehmet"));
  assert.notDeepEqual(sampleAccount("instagram", "ayse"), sampleAccount("tiktok", "ayse"));
});

test("sampleAccount: resmi API'si olmayan platformda sayı yok", () => {
  for (const p of ["linkedin", "x", "twitch", "bilinmeyen"]) {
    assert.deepEqual(sampleAccount(p, "ayse"), { followers: null, avg_views: null, avg_likes: null, avg_comments: null });
  }
});

test("sampleLink: aynı link aynı sayı, 1 bin – 200 bin izlenme", () => {
  const url = "https://www.instagram.com/p/abc/";
  const l = sampleLink("instagram", url);
  assert.deepEqual(sampleLink("instagram", url), l);
  assert.ok(l.views >= 1000 && l.views <= 200000);
  assert.ok(l.likes > 0 && l.likes < l.views && l.comments < l.likes);
  assert.notDeepEqual(sampleLink("instagram", url + "x"), l);
  assert.deepEqual(sampleLink("linkedin", "https://www.linkedin.com/posts/a"), { views: null, likes: null, comments: null });
});

test("platformOf: alan adı ve alt alan adı eşleşir, benzer adlar eşleşmez", () => {
  const cases = [
    ["https://www.instagram.com/p/abc/", "instagram"], ["https://instagr.am/p/abc", "instagram"],
    ["https://vm.tiktok.com/ZM123/", "tiktok"], ["https://www.tiktok.com/@a/video/1", "tiktok"],
    ["https://youtu.be/abc", "youtube"], ["https://m.youtube.com/watch?v=1", "youtube"], ["HTTPS://WWW.YOUTUBE.COM/shorts/x", "youtube"],
    ["https://www.linkedin.com/posts/a", "linkedin"], ["https://lnkd.in/x", "linkedin"],
    ["https://twitter.com/a/status/1", "x"], ["https://x.com/a", "x"], ["https://www.twitch.tv/a", "twitch"],
    ["https://notinstagram.com/p", null], ["https://instagram.com.evil.io/p", null], ["https://example.com/instagram.com", null],
    ["instagram.com/p/abc", null], ["bir link değil", null], ["", null], [null, null], [undefined, null],
  ];
  for (const [url, want] of cases) assert.equal(platformOf(url), want, String(url));
});

test("accountMetrics örnek mod: D1'e dokunmaz, örnek ve veri yok etiketleri", async () => {
  const env = { METRICS_ENABLED: "0" }; // DB yok: tabloya dokunursa hata verir
  const profile = { platforms: [{ platform: "instagram", handle: "ayse" }, { platform: "linkedin", handle: "ayse-li" }, null, { handle: "eksik" }] };
  const m = await accountMetrics(env, 1, profile);
  assert.equal(m.mode, "sample");
  assert.equal(m.label, SAMPLE);
  assert.equal(m.accounts.length, 2);
  assert.deepEqual(m.accounts[0], { platform: "instagram", handle: "ayse", source: "sample", label: SAMPLE, ...sampleAccount("instagram", "ayse"), taken_at: null });
  assert.deepEqual(m.accounts[1], {
    platform: "linkedin", handle: "ayse-li", source: "none", label: NO_DATA,
    followers: null, avg_views: null, avg_likes: null, avg_comments: null, taken_at: null,
  });
  for (const p of [undefined, null, {}, { platforms: "x" }]) assert.deepEqual((await accountMetrics(env, 1, p)).accounts, []);
});

test("linkMetrics örnek mod: link yoksa ya da platform resmi değilse veri yok", async () => {
  const env = {};
  const none = { source: "none", label: NO_DATA, views: null, likes: null, comments: null, taken_at: null };
  assert.deepEqual(await linkMetrics(env, { id: 1, content_url: null }), { mode: "sample", url: null, platform: null, ...none });
  assert.deepEqual(await linkMetrics(env, undefined), { mode: "sample", url: null, platform: null, ...none });
  const li = "https://www.linkedin.com/posts/a";
  assert.deepEqual(await linkMetrics(env, { id: 1, content_url: li }), { mode: "sample", url: li, platform: "linkedin", ...none });
  const ig = "https://www.instagram.com/p/abc/";
  assert.deepEqual(await linkMetrics(env, { id: 1, content_url: ig }), {
    mode: "sample", url: ig, platform: "instagram", source: "sample", label: SAMPLE, ...sampleLink("instagram", ig), taken_at: null,
  });
});

// ---- D1 tabloları ----

test("migration tekrar uygulanabilir ve tabloları kurar", () => {
  const db = freshDb();
  db.exec(MIGRATION);
  db.exec(SCHEMA);
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table', 'index') ORDER BY name").all().map(r => r.name);
  for (const n of ["social_accounts", "metric_snapshots", "link_snapshots"]) assert.ok(names.includes(n), n);
  const u = user(db, "a@x.co");
  insert(db, "INSERT INTO social_accounts (user_id, platform) VALUES (?, 'instagram')", u);
  assert.throws(() => social(db, u, "instagram", "b"), /UNIQUE/);
  const row = { ...db.prepare("SELECT status, connected_at FROM social_accounts").get() };
  assert.deepEqual(row, { status: "pending", connected_at: null });
});

test("accountMetrics canlı mod: beyan sırası, son ölçüm, bağlı platform bir kez", async () => {
  const db = freshDb(), env = { DB: d1(db), METRICS_ENABLED: "1" };
  const a = user(db, "a@x.co"), b = user(db, "b@x.co");
  const ig = social(db, a, "instagram", "ig_real");
  snapshot(db, ig, "2026-10-01 10:00:00", 1000);
  snapshot(db, ig, "2026-10-05 10:00:00", 1500, 300, 30, 3);
  snapshot(db, ig, "2026-09-01 10:00:00", 900);
  social(db, a, "tiktok", "tt_real"); // ölçümü yok
  snapshot(db, social(db, a, "youtube", "yt_real"), "2026-10-02 08:00:00", 7000, 700, 70, 7); // beyan edilmemiş
  snapshot(db, social(db, a, "linkedin", "li_real"), "2026-10-02 08:00:00", 5000); // resmi değil: sayı gösterilmez
  social(db, a, "x", "x_rev", "revoked");
  snapshot(db, social(db, b, "instagram", "b_ig"), "2026-10-06 10:00:00", 99); // başka kullanıcı
  db.prepare("UPDATE social_accounts SET status = 'connected' WHERE user_id = ? AND status = 'pending'").run(a);
  db.prepare("UPDATE social_accounts SET status = 'connected' WHERE user_id = ?").run(b);

  const profile = { platforms: [
    { platform: "linkedin", handle: "li_profil" }, { platform: "instagram", handle: "ig_profil" },
    { platform: "tiktok", handle: "tt_profil" }, { platform: "instagram", handle: "ig_tekrar" }, { platform: "x", handle: "x_profil" },
  ] };
  const m = await accountMetrics(env, a, profile);
  assert.equal(m.mode, "live");
  assert.equal(m.label, null);
  const empty = { source: "none", label: NO_DATA, followers: null, avg_views: null, avg_likes: null, avg_comments: null, taken_at: null };
  assert.deepEqual(m.accounts, [
    { platform: "linkedin", handle: "li_real", ...empty },
    { platform: "instagram", handle: "ig_real", source: "oauth", label: null, followers: 1500, avg_views: 300, avg_likes: 30, avg_comments: 3, taken_at: "2026-10-05 10:00:00" },
    { platform: "tiktok", handle: "tt_real", ...empty },
    { platform: "x", handle: "x_profil", ...empty },
    { platform: "youtube", handle: "yt_real", source: "oauth", label: null, followers: 7000, avg_views: 700, avg_likes: 70, avg_comments: 7, taken_at: "2026-10-02 08:00:00" },
  ]);
  assert.deepEqual((await accountMetrics(env, 999, profile)).accounts.map(x => [x.platform, x.handle, x.label]), [
    ["linkedin", "li_profil", NO_DATA], ["instagram", "ig_profil", NO_DATA], ["tiktok", "tt_profil", NO_DATA],
    ["instagram", "ig_tekrar", NO_DATA], ["x", "x_profil", NO_DATA],
  ]);
});

test("linkMetrics canlı mod: aynı başvuru ve linkin son ölçümü", async () => {
  const db = freshDb(), env = { DB: d1(db), METRICS_ENABLED: "1" };
  const url = "https://www.tiktok.com/@a/video/1";
  const link = (appId, u, takenAt, views) => insert(db,
    "INSERT INTO link_snapshots (application_id, url, platform, taken_at, views, likes, comments) VALUES (?, ?, 'tiktok', ?, ?, 5, 1)", appId, u, takenAt, views);
  const none = { source: "none", label: NO_DATA, views: null, likes: null, comments: null, taken_at: null };
  assert.deepEqual(await linkMetrics(env, { id: 7, content_url: url }), { mode: "live", url, platform: "tiktok", ...none });
  assert.deepEqual(await linkMetrics(env, { id: 7, content_url: "" }), { mode: "live", url: null, platform: null, ...none });
  link(7, url, "2026-10-01 00:00:00", 100);
  link(7, url, "2026-10-03 00:00:00", 300);
  link(7, "https://www.tiktok.com/@a/video/eski", "2026-10-09 00:00:00", 999); // link değişti: eski ölçüm sayılmaz
  link(8, url, "2026-10-09 00:00:00", 888); // başka başvuru
  assert.deepEqual(await linkMetrics(env, { id: 7, content_url: url }), {
    mode: "live", url, platform: "tiktok", source: "oauth", label: null, views: 300, likes: 5, comments: 1, taken_at: "2026-10-03 00:00:00",
  });
});

// ---- API uçları ----

const ORIGIN = "http://localhost:8788";
function api(env) {
  return async (method, path, { token, body, ip = "10.0.0.1" } = {}) => {
    const headers = { "cf-connecting-ip": ip, "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const res = await platform(req, new URL(req.url), env, ORIGIN, async () => {});
    return { status: res.status, body: await res.json() };
  };
}

test("metrik uçları: yetki, görünürlük ve örnek/canlı mod", async () => {
  const db = freshDb();
  const env = { DB: d1(db), DEV_ORIGINS: ORIGIN, PBKDF2_ITER: "10000", METRICS_ENABLED: "0" };
  const call = api(env);
  let ip = 0;
  const join = async (role, email) => {
    const r = await call("POST", "/auth/register", {
      ip: `10.0.1.${++ip}`, body: { name: email, email, password: "sifre-12345", role, consent: true, hp: "", t: 2000 },
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return { token: r.body.token, id: r.body.user.id };
  };
  const brand = await join("brand", "marka@x.co"), other = await join("agency", "ajans@x.co");
  const inf = await join("influencer", "inf@x.co"), listed = await join("influencer", "liste@x.co");

  assert.equal((await call("GET", "/app/metrics")).status, 401);
  const p = await call("POST", "/app/profile", { token: inf.token, body: { profile: { platforms: [
    { platform: "instagram", handle: "inf_ig", followers: 5000 }, { platform: "linkedin", handle: "inf_li" },
  ], listed: false } } });
  assert.equal(p.status, 200);
  await call("POST", "/app/profile", { token: listed.token, body: { profile: { platforms: [{ platform: "tiktok", handle: "lt" }], listed: true } } });

  const mine = await call("GET", "/app/metrics", { token: inf.token });
  assert.equal(mine.status, 200);
  assert.equal(mine.body.metrics.mode, "sample");
  assert.deepEqual(mine.body.metrics.accounts.map(a => [a.platform, a.handle, a.label]), [["instagram", "inf_ig", SAMPLE], ["linkedin", "inf_li", NO_DATA]]);
  assert.equal(mine.body.metrics.accounts[0].followers, sampleAccount("instagram", "inf_ig").followers);

  // Listelenmemiş influencer: başvuru/davet yoksa marka göremez
  assert.equal((await call("GET", `/app/metrics/${inf.id}`, { token: brand.token })).status, 404);
  assert.equal((await call("GET", `/app/metrics/${listed.id}`, { token: brand.token })).status, 200);
  assert.equal((await call("GET", `/app/metrics/${listed.id}`, { token: inf.token })).status, 403);
  assert.equal((await call("GET", `/app/metrics/${brand.id}`, { token: other.token })).status, 404);
  assert.equal((await call("GET", "/app/metrics/999999", { token: brand.token })).status, 404);

  const camp = await call("POST", "/app/campaigns", { token: brand.token, body: { title: "Kış kampanyası" } });
  assert.equal(camp.status, 200);
  const app = await call("POST", `/app/campaigns/${camp.body.campaign.id}/apply`, { token: inf.token, body: {} });
  assert.equal(app.status, 200);
  const appId = app.body.application.id;
  const seen = await call("GET", `/app/metrics/${inf.id}`, { token: brand.token });
  assert.equal(seen.status, 200);
  assert.deepEqual(seen.body.metrics, mine.body.metrics);
  assert.equal((await call("GET", `/app/metrics/${inf.id}`, { token: other.token })).status, 404);

  // İçerik linki: sahibi ve başvuran görür, başkası göremez
  const linkFor = async (token, status = 200) => {
    const r = await call("GET", `/app/applications/${appId}/metrics`, { token });
    assert.equal(r.status, status);
    return r.body.metrics;
  };
  assert.equal((await linkFor(brand.token)).label, NO_DATA);
  assert.equal((await linkFor(inf.token)).label, NO_DATA);
  await linkFor(other.token, 404);
  await linkFor(listed.token, 404);
  assert.equal((await call("GET", "/app/applications/999999/metrics", { token: brand.token })).status, 404);

  const url = "https://www.instagram.com/p/kis123/";
  assert.equal((await call("POST", `/app/applications/${appId}`, { token: brand.token, body: { status: "accepted" } })).status, 200);
  assert.equal((await call("POST", `/app/applications/${appId}`, { token: inf.token, body: { status: "submitted", content_url: url } })).status, 200);
  const sample = await linkFor(brand.token);
  assert.deepEqual(sample, { mode: "sample", url, platform: "instagram", source: "sample", label: SAMPLE, ...sampleLink("instagram", url), taken_at: null });

  // Canlı mod: bağlı hesap/ölçüm yoksa "veri yok", ölçüm gelince gerçek sayı
  env.METRICS_ENABLED = "1";
  assert.deepEqual((await call("GET", "/app/metrics", { token: inf.token })).body.metrics.accounts.map(a => [a.platform, a.label]),
    [["instagram", NO_DATA], ["linkedin", NO_DATA]]);
  assert.equal((await linkFor(inf.token)).label, NO_DATA);
  insert(db, "INSERT INTO link_snapshots (application_id, url, platform, taken_at, views, likes, comments) VALUES (?, ?, 'instagram', '2026-10-10 12:00:00', 4200, 310, 12)", appId, url);
  const live = await linkFor(brand.token);
  assert.deepEqual([live.mode, live.label, live.views, live.likes, live.comments], ["live", null, 4200, 310, 12]);
  const acc = social(db, inf.id, "instagram", "inf_ig");
  db.prepare("UPDATE social_accounts SET status = 'connected' WHERE id = ?").run(acc);
  snapshot(db, acc, "2026-10-10 12:00:00", 5100, 900, 80, 6);
  const brandView = await call("GET", `/app/metrics/${inf.id}`, { token: brand.token });
  assert.deepEqual(brandView.body.metrics.accounts[0], {
    platform: "instagram", handle: "inf_ig", source: "oauth", label: null,
    followers: 5100, avg_views: 900, avg_likes: 80, avg_comments: 6, taken_at: "2026-10-10 12:00:00",
  });
});
