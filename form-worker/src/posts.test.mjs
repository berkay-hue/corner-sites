// node --test src/posts.test.mjs — F2 PR1: GET /app/posts, POST /app/posts/manual, POST /app/posts/import (migrations/0006_posts.sql)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "cloudflare:sockets") return { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true };
    if (spec === "cloudflare:email") return { url: "data:text/javascript,export class EmailMessage{}", shortCircuit: true };
    return next(spec, ctx);
  },
});

const { platform } = await import("./platform.js");

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const SCHEMA = read("../schema.sql");
const MIGRATIONS = ["0001_metrics", "0002_oauth", "0003_sync", "0004_sync_changes", "0005_notify"].map(n => read(`../migrations/${n}.sql`));
const POSTS_SQL = read("../migrations/0006_posts.sql"), POST_AUD_SQL = read("../migrations/0010_post_audience.sql");

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

// posts=false: 0006 uygulanmamış canlı D1 gibi; audience=false: 0010 uygulanmamış
function freshDb(posts = true, audience = posts) {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  for (const m of MIGRATIONS) db.exec(m);
  if (posts) db.exec(POSTS_SQL);
  if (audience) db.exec(POST_AUD_SQL);
  return db;
}

const ORIGIN = "http://localhost:8788";
async function setup({ db = freshDb(), enabled = "1" } = {}) {
  const env = { DB: d1(db), DEV_ORIGINS: ORIGIN, PBKDF2_ITER: "10000", POSTS_ENABLED: enabled };
  const call = async (method, path, { token, body, raw } = {}) => {
    const headers = { "cf-connecting-ip": "10.0.0.1", "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method, headers, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
    const res = await platform(req, new URL(req.url), env, ORIGIN, async () => {});
    return { status: res.status, body: await res.json() };
  };
  let n = 0;
  const join = async (role = "influencer") => {
    const email = `u${++n}@ornek.test`;
    const r = await call("POST", "/auth/register", { body: { name: "Ad", email, password: "sifre-12345", role, consent: true, hp: "", t: 2000 } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.body.token;
  };
  return { db, call, join };
}

const ok200 = r => assert.equal(r.status, 200, JSON.stringify(r.body));
const fails = (r, status, error) => { assert.equal(r.status, status, JSON.stringify(r.body)); assert.deepEqual(r.body, { ok: false, error }); };
const today = new Date().toISOString().slice(0, 10);
const IG = "https://www.instagram.com/p/abc/";

test("bayrak kapalı: üç uç da 404 not_found (panel tarayıcı kaydına düşer)", async () => {
  const { call, join } = await setup({ enabled: "0" });
  const token = await join();
  fails(await call("GET", "/app/posts", { token }), 404, "not_found");
  fails(await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 1 } }), 404, "not_found");
  fails(await call("POST", "/app/posts/import", { token, body: { rows: [{ url: IG, likes: 1 }] } }), 404, "not_found");
});

test("0006 ya da 0010 uygulanmamış: 503 not_ready", async () => {
  const { call, join } = await setup({ db: freshDb(false) });
  const token = await join();
  fails(await call("GET", "/app/posts", { token }), 503, "not_ready");
  fails(await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 1 } }), 503, "not_ready");
  const b = await setup({ db: freshDb(true, false) });
  fails(await b.call("GET", "/app/posts", { token: await b.join() }), 503, "not_ready");
});

test("oturumsuz 401", async () => {
  const { call } = await setup();
  fails(await call("GET", "/app/posts"), 401, "auth");
});

test("manual: #217 alanlarıyla kayıt; aynı url yeni gün ölçümü ekler, aynı gün üzerine yazar, bilgiler korunur", async () => {
  const { call, join } = await setup();
  const token = await join();
  ok200(await call("GET", "/app/posts", { token }));
  let r = await call("POST", "/app/posts/manual", { token, body: { url: IG, type: "reel", date: "2026-01-02", caption: "merhaba", thumb: "https://cdn.ornek.test/a.jpg", likes: 10, comments: "3", views: "", reach: 200, at: "2026-01-03" } });
  ok200(r);
  assert.equal(r.body.added, true);
  assert.deepEqual(r.body.post, { id: r.body.post.id, url: IG, platform: "instagram", type: "reel", date: "2026-01-02", caption: "merhaba", thumb: "https://cdn.ornek.test/a.jpg",
    audience: null, snaps: [{ at: "2026-01-03", likes: 10, comments: 3, views: null, reach: 200 }] });
  assert.match(r.body.post.id, /^[a-z0-9]{1,24}$/);
  r = await call("POST", "/app/posts/manual", { token, body: { url: IG, type: "photo", caption: "değişmez", likes: 12, at: "2026-01-04" } });
  ok200(r);
  assert.equal(r.body.added, false);
  assert.equal(r.body.post.type, "reel");
  assert.equal(r.body.post.caption, "merhaba");
  r = await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 15, at: "2026-01-04" } });
  assert.deepEqual(r.body.post.snaps.map(s => [s.at, s.likes]), [["2026-01-03", 10], ["2026-01-04", 15]]);
  r = await call("GET", "/app/posts", { token });
  assert.equal(r.body.posts.length, 1);
  assert.equal(r.body.posts[0].snaps.length, 2);
});

test("manual: varsayılanlar (date/at bugün, tiktok video, geçersiz thumb boş, açıklama 2200'e kırpılır)", async () => {
  const { call, join } = await setup();
  const token = await join();
  const r = await call("POST", "/app/posts/manual", { token, body: { url: "https://vm.tiktok.com/xyz", views: 5, thumb: "http://a.test/x.jpg", caption: "a".repeat(3000) } });
  ok200(r);
  const p = r.body.post;
  assert.deepEqual([p.platform, p.type, p.date, p.thumb, p.caption.length, p.snaps[0].at], ["tiktok", "video", today, "", 2200, today]);
});

test("manual: doğrulama hataları", async () => {
  const { call, join } = await setup();
  const token = await join();
  const bad = async (body, error) => fails(await call("POST", "/app/posts/manual", { token, body }), 400, error);
  await bad({ url: "http://instagram.com/p/a", likes: 1 }, "url");
  await bad({ url: "https://example.com/p/a", likes: 1 }, "url");
  await bad({ url: IG }, "metrics");
  await bad({ url: IG, likes: -1 }, "likes");
  await bad({ url: IG, likes: 1.5 }, "likes");
  await bad({ url: IG, views: "1".repeat(13) }, "views");
  await bad({ url: IG, likes: 1, date: "2026-02-30" }, "date");
  await bad({ url: IG, likes: 1, date: "2999-01-01" }, "date");
  await bad({ url: IG, likes: 1, at: "dün" }, "at");
});

test("kullanıcılar birbirinin gönderisini görmez", async () => {
  const { call, join } = await setup();
  const a = await join(), b = await join("brand");
  ok200(await call("POST", "/app/posts/manual", { token: a, body: { url: IG, likes: 1 } }));
  ok200(await call("POST", "/app/posts/manual", { token: b, body: { url: IG, likes: 9 } }));
  const ra = await call("GET", "/app/posts", { token: a }), rb = await call("GET", "/app/posts", { token: b });
  assert.deepEqual([ra.body.posts.length, ra.body.posts[0].snaps[0].likes, rb.body.posts[0].snaps[0].likes], [1, 1, 9]);
});

test("import: en çok 50 satır; geçersizler atlanıp sırasıyla bildirilir; var olan url güncellenir", async () => {
  const { call, join } = await setup();
  const token = await join();
  fails(await call("POST", "/app/posts/import", { token, body: { rows: [] } }), 400, "rows");
  fails(await call("POST", "/app/posts/import", { token, body: { rows: Array.from({ length: 51 }, (_, i) => ({ url: `https://youtu.be/v${i}`, views: i })) } }), 400, "rows");
  fails(await call("POST", "/app/posts/import", { token, body: {} }), 400, "rows");
  ok200(await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 1, at: "2026-01-01" } }));
  const r = await call("POST", "/app/posts/import", { token, body: { rows: [
    { url: IG, likes: 2, at: "2026-01-02" },
    { url: "https://youtu.be/a", views: "1000", date: "2026-01-01", type: "bilinmez" },
    { url: "https://ftp.ornek.test/x", likes: 1 },
    { url: "https://x.com/u/status/1", likes: 3 },
    "satır değil",
  ] } });
  ok200(r);
  assert.deepEqual(r.body, { ok: true, added: 2, updated: 1, skipped: [{ i: 2, error: "url" }, { i: 4, error: "row" }] });
  const posts = (await call("GET", "/app/posts", { token })).body.posts;
  assert.equal(posts.length, 3);
  assert.deepEqual(posts.find(p => p.url === IG).snaps.map(s => s.likes), [1, 2]);
  assert.equal(posts.find(p => p.platform === "youtube").type, "video");
});

test("import: 50 satır x 2200 karakter açıklama sığar (MAX_BODY yalnız bu uçta büyük); diğer uçlar 20000'de kalır", async () => {
  const { call, join } = await setup();
  const token = await join();
  const rows = Array.from({ length: 50 }, (_, i) => ({ url: `https://www.instagram.com/p/${i}/`, likes: i, caption: "ç".repeat(2200), thumb: `https://cdn.ornek.test/${"t".repeat(1500)}${i}.jpg` }));
  const r = await call("POST", "/app/posts/import", { token, body: { rows } });
  ok200(r);
  assert.equal(r.body.added, 50);
  fails(await call("POST", "/app/posts/manual", { token, raw: JSON.stringify({ url: IG, likes: 1, caption: "a".repeat(20001) }) }), 413, "size");
});

test("en çok 1000 gönderi: aşan ekleme 409 posts_full, var olana ölçüm eklenir", async () => {
  const { db, call, join } = await setup();
  const token = await join();
  const uid = db.prepare("SELECT id FROM users").get().id;
  const ins = db.prepare("INSERT INTO posts (user_id, url, platform, type, date) VALUES (?, ?, 'instagram', 'photo', '2026-01-01')");
  for (let i = 0; i < 1000; i++) ins.run(uid, `https://instagram.com/p/${i}`);
  fails(await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 1 } }), 409, "posts_full");
  fails(await call("POST", "/app/posts/import", { token, body: { rows: [{ url: IG, likes: 1 }] } }), 409, "posts_full");
  ok200(await call("POST", "/app/posts/manual", { token, body: { url: "https://instagram.com/p/5", likes: 1 } }));
  const r = await call("POST", "/app/posts/import", { token, body: { rows: [{ url: "https://instagram.com/p/6", likes: 2 }] } });
  assert.deepEqual([r.body.added, r.body.updated], [0, 1]);
});
