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
// Tablo yok bayrağı modül düzeyinde (isolate başına); onu düşüren test sonunda sıfırlar
const { MISSING } = await import("./oauth.js");

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const SCHEMA = read("../schema.sql");
const MIGRATIONS = ["0001_metrics", "0002_oauth", "0003_sync", "0004_sync_changes", "0005_notify"].map(n => read(`../migrations/${n}.sql`));
const POSTS_SQL = read("../migrations/0006_posts.sql") + read("../migrations/0007_post_source.sql"), POST_AUD_SQL = read("../migrations/0010_post_audience.sql");

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

// posts=false: 0006 uygulanmamış canlı D1 gibi (posts=true 0007'yi de uygular; liste ve kapı account_id okur); audience=false: 0010 uygulanmamış
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
  return { db, env, call, join };
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

test("bağlantı tek biçime çevrilir: paylaşım sorgusu ve kısa biçimler aynı satıra düşer; eski biçimle kayıtlı satır korunur", async () => {
  const { db, call, join } = await setup();
  const token = await join();
  const uid = db.prepare("SELECT id FROM users").get().id;
  const YT = "https://www.youtube.com/watch?v=Ab_c-1";
  let r = await call("POST", "/app/posts/manual", { token, body: { url: "https://youtu.be/Ab_c-1?si=paylas", views: 10, at: "2026-01-01" } });
  ok200(r);
  assert.deepEqual([r.body.post.url, r.body.added], [YT, true]);
  r = await call("POST", "/app/posts/manual", { token, body: { url: "https://m.youtube.com/watch?v=Ab_c-1&t=30s", views: 20, at: "2026-01-02" } });
  assert.deepEqual([r.body.post.url, r.body.added], [YT, false]);
  r = await call("POST", "/app/posts/import", { token, body: { rows: [
    { url: "https://www.youtube.com/shorts/Ab_c-1", views: 30, at: "2026-01-03" },
    { url: "https://m.tiktok.com/@ad.1/video/7301?is_from_webapp=1&sender_device=pc", likes: 1 },
    { url: "https://instagram.com/kullanici/reels/C0d-E?igsh=x#yorum", likes: 2 },
    { url: "https://www.instagram.com/p/C0d-E/?img_index=2", likes: 3 },
    { url: "https://vm.tiktok.com/ZMabc/", likes: 4 },
    { url: "https://www.youtube.com/@kanal", views: 5 },
  ] } });
  assert.deepEqual([r.body.added, r.body.updated], [5, 1]);
  const posts = (await call("GET", "/app/posts", { token })).body.posts;
  assert.deepEqual(posts.map(p => p.url).sort(), [
    "https://vm.tiktok.com/ZMabc/", "https://www.instagram.com/p/C0d-E/", "https://www.instagram.com/reel/C0d-E/",
    "https://www.tiktok.com/@ad.1/video/7301", "https://www.youtube.com/@kanal", YT,
  ]);
  assert.deepEqual(posts.find(p => p.url === YT).snaps.map(s => s.views), [10, 20, 30]);

  // Bu değişiklikten önce girilen haliyle kaydedilmiş satır: ölçüm ona yazılır, tek biçimli ikinci satır açılmaz
  const OLD = "https://youtu.be/Eski1";
  db.prepare("INSERT INTO posts (user_id, url, platform, type, date) VALUES (?, ?, 'youtube', 'video', '2026-01-01')").run(uid, OLD);
  r = await call("POST", "/app/posts/manual", { token, body: { url: OLD, views: 7, at: "2026-01-04" } });
  assert.deepEqual([r.body.post.url, r.body.added, r.body.post.snaps.length], [OLD, false, 1]);
  r = await call("POST", "/app/posts/import", { token, body: { rows: [{ url: OLD, views: 8, at: "2026-01-05" }] } });
  assert.deepEqual([r.body.added, r.body.updated], [0, 1]);
  const old = db.prepare("SELECT url FROM posts WHERE user_id = ? AND url LIKE '%Eski1%'").all(uid).map(p => p.url);
  assert.deepEqual(old, [OLD]);
});

// ---- yönetim paneli ve edit_metrics kapısı (migrations/0012_admin.sql; schema.sql aynı tabloları da kurar) ----
const ADMIN_SQL = read("../migrations/0012_admin.sql");
const IG2 = "https://www.instagram.com/p/def/";
const idOf = async (call, token) => (await call("GET", "/auth/me", { token })).body.user.id;
const grant = (db, id, perm) => db.prepare("INSERT INTO user_perms (user_id, perm) VALUES (?, ?)").run(id, perm);
const syncIt = (db, url) => db.prepare("UPDATE posts SET account_id = 1 WHERE url = ?").run(url);
const editRows = db => db.prepare("SELECT actor_id, user_id, post_id, url, snap_at, field, before, after, source FROM post_edits ORDER BY id").all().map(r => ({ ...r }));
const postId = (db, url) => db.prepare("SELECT id FROM posts WHERE url = ?").get(url).id;
// Başka sitenin kullanıcısı ve gönderisi (yönetici görmemeli)
function otherSite(db) {
  const uid = Number(db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES ('baska.test', 'b@baska.test', 'B', 'brand', 'x')").run().lastInsertRowid);
  const pid = Number(db.prepare("INSERT INTO posts (user_id, url, platform, type, date) VALUES (?, ?, 'instagram', 'photo', '2026-01-01')").run(uid, IG).lastInsertRowid);
  db.prepare("INSERT INTO post_snaps (post_id, at, likes) VALUES (?, '2026-01-01', 1)").run(pid);
  db.prepare("INSERT INTO post_edits (actor_id, user_id, post_id, url, snap_at, field, before, after, source) VALUES (?, ?, ?, ?, '2026-01-01', 'likes', NULL, 1, 'manual')").run(uid, uid, pid, IG);
  db.prepare("INSERT INTO social_accounts (user_id, platform, handle, status) VALUES (?, 'tiktok', 'baska', 'connected')").run(uid);
  return { uid, pid };
}

test("0012: migration şemadaki tablolarla aynı, tekrar uygulanabilir; yetki yalnız admin | edit_metrics", () => {
  const T = ["user_perms", "post_edits", "perm_log", "meta_events"];
  const cols = db => T.map(t => db.prepare(`PRAGMA table_info(${t})`).all().map(r => `${r.name} ${r.type} ${r.notnull} ${r.dflt_value} ${r.pk}`));
  const db = freshDb(), want = cols(db);
  for (const t of T) db.exec(`DROP TABLE ${t}`);
  db.exec(ADMIN_SQL);
  db.exec(ADMIN_SQL);
  assert.deepEqual(cols(db), want);
  const uid = db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES ('brandcorner.co', 'a@b.test', 'A', 'brand', 'x')").run().lastInsertRowid;
  grant(db, uid, "admin");
  grant(db, uid, "edit_metrics");
  assert.throws(() => grant(db, uid, "owner"), /CHECK/);
  assert.throws(() => grant(db, uid, "admin"), /UNIQUE|PRIMARY/);
});

test("auth/me: yönetici admin: true, kendi yetkileri perms (admin hariç); yetkisiz ya da tablo yoksa iki alan da yok", async () => {
  const { db, call, join } = await setup();
  const t = [await join(), await join(), await join(), await join()];
  const ids = [];
  for (const x of t) ids.push(await idOf(call, x));
  grant(db, ids[0], "admin"); grant(db, ids[0], "edit_metrics"); grant(db, ids[1], "edit_metrics"); grant(db, ids[2], "admin");
  const me = async x => { const r = await call("GET", "/auth/me", { token: x }); ok200(r); return r.body.user; };
  const shape = u => [u.admin, u.perms, "admin" in u, "perms" in u];
  assert.deepEqual(shape(await me(t[0])), [true, ["edit_metrics"], true, true]);
  assert.deepEqual(shape(await me(t[1])), [undefined, ["edit_metrics"], false, true]);
  assert.deepEqual(shape(await me(t[2])), [true, undefined, true, false]);
  assert.deepEqual(shape(await me(t[3])), [undefined, undefined, false, false]);
  db.exec("DROP TABLE user_perms");
  assert.deepEqual(shape(await me(t[0])), [undefined, undefined, false, false]);
});

test("kapı: bağlı hesaptan gelen gönderiyi manual ile değiştirmek edit_metrics ya da admin ister (403 no_perm); elle girilen serbest; tablo yoksa kapı yok", async () => {
  const { db, call, join } = await setup();
  const token = await join(), id = await idOf(call, token);
  ok200(await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 1, at: "2026-01-01" } }));
  ok200(await call("POST", "/app/posts/manual", { token, body: { url: IG2, views: 1, at: "2026-01-01" } }));
  syncIt(db, IG);
  const likes = async () => (await call("GET", "/app/posts", { token })).body.posts.find(p => p.url === IG).snaps.map(s => s.likes);
  fails(await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 2, at: "2026-01-01" } }), 403, "no_perm");
  fails(await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 2, at: "2026-01-02" } }), 403, "no_perm");
  assert.deepEqual(await likes(), [1]);
  ok200(await call("POST", "/app/posts/manual", { token, body: { url: IG2, views: 2, at: "2026-01-01" } }));
  // GET posts: yalnız bağlı hesaptan gelen gönderide synced: true
  const posts = (await call("GET", "/app/posts", { token })).body.posts;
  assert.deepEqual(posts.map(p => [p.url, p.synced, "synced" in p]).sort(), [[IG, true, true], [IG2, undefined, false]]);
  grant(db, id, "edit_metrics");
  let r = await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 2, at: "2026-01-01" } });
  ok200(r);
  assert.deepEqual([r.body.added, r.body.post.synced, r.body.post.snaps.map(s => s.likes)], [false, true, [2]]);
  db.prepare("DELETE FROM user_perms").run();
  grant(db, id, "admin");
  ok200(await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 3, at: "2026-01-01" } }));
  db.exec("DROP TABLE user_perms");
  ok200(await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 4, at: "2026-01-01" } }));
  assert.deepEqual(await likes(), [4]);
});

test("kapı: import'ta bağlı gönderiye yazan satır yetki yoksa {i, error: \"perm\"} ile atlanır, diğerleri yazılır", async () => {
  const { db, call, join } = await setup();
  const token = await join(), id = await idOf(call, token);
  ok200(await call("POST", "/app/posts/manual", { token, body: { url: IG, likes: 1, at: "2026-01-01" } }));
  syncIt(db, IG);
  const imp = rows => call("POST", "/app/posts/import", { token, body: { rows } });
  let r = await imp([{ url: IG2, likes: 5, at: "2026-01-01" }, { url: IG, likes: 9, at: "2026-01-01" }, { url: "https://ftp.ornek.test/x", likes: 1 }, { url: IG, likes: 7, at: "2026-01-02" }]);
  ok200(r);
  assert.deepEqual(r.body, { ok: true, added: 1, updated: 0, skipped: [{ i: 1, error: "perm" }, { i: 2, error: "url" }, { i: 3, error: "perm" }] });
  r = await imp([{ url: IG, likes: 9 }]);
  assert.deepEqual(r.body, { ok: true, added: 0, updated: 0, skipped: [{ i: 0, error: "perm" }] });
  assert.deepEqual(db.prepare("SELECT likes FROM post_snaps WHERE post_id = ?").all(postId(db, IG)).map(s => s.likes), [1]);
  grant(db, id, "edit_metrics");
  r = await imp([{ url: IG, likes: 9, at: "2026-01-01" }]);
  assert.deepEqual(r.body, { ok: true, added: 0, updated: 1, skipped: [] });
  // Günlük: elle girilen IG2 (yeni, before null) ve yetkiyle yazılan IG; atlanan satırlar günlüğe yazılmaz
  assert.deepEqual(editRows(db).filter(e => e.source === "import").map(e => [e.url, e.field, e.before, e.after]), [[IG2, "likes", null, 5], [IG, "likes", 1, 9]]);
});

test("günlük: değişen her alan bir satır (manual/import, aynı batch); değişmeyen yazım satır eklemez; tablo yoksa yazım yine olur", async t => {
  const { db, env, call, join } = await setup();
  const token = await join(), id = await idOf(call, token);
  const manual = body => call("POST", "/app/posts/manual", { token, body: { url: IG, at: "2026-01-01", ...body } });
  ok200(await manual({ likes: 10, comments: 3 }));
  const pid = postId(db, IG), row = (field, before, after, source = "manual") => ({ actor_id: id, user_id: id, post_id: pid, url: IG, snap_at: "2026-01-01", field, before, after, source });
  assert.deepEqual(editRows(db), [row("likes", null, 10), row("comments", null, 3)]);
  // Aynı günün ölçümü üzerine yazılır: boş bırakılan comments silinir (3 → null), views eklenir
  ok200(await manual({ likes: 10, views: 5 }));
  ok200(await manual({ likes: 10, views: 5 }));
  assert.deepEqual(editRows(db).slice(2), [row("comments", 3, null), row("views", null, 5)]);
  // Aynı url ve gün iki satırda: önceki hal sırayla izlenir
  const r = await call("POST", "/app/posts/import", { token, body: { rows: [{ url: IG, likes: 11, at: "2026-01-01" }, { url: IG, likes: 12, at: "2026-01-01" }] } });
  assert.deepEqual([r.body.added, r.body.updated], [0, 2]);
  assert.deepEqual(editRows(db).slice(4), [row("likes", 10, 11, "import"), row("views", 5, null, "import"), row("likes", 11, 12, "import")]);
  assert.equal(db.prepare("SELECT likes FROM post_snaps WHERE post_id = ? AND at = '2026-01-01'").get(pid).likes, 12);
  db.exec("DROP TABLE post_edits");
  t.after(() => { MISSING.post_edits = false; });
  const batches = [], batch = env.DB.batch;
  env.DB.batch = list => (batches.push(list.length), batch(list));
  ok200(await manual({ likes: 13 }));
  ok200(await call("POST", "/app/posts/import", { token, body: { rows: [{ url: IG2, likes: 1 }] } }));
  assert.equal(db.prepare("SELECT likes FROM post_snaps WHERE post_id = ? AND at = '2026-01-01'").get(pid).likes, 13);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM posts").get().n, 2);
  // İlk yazım bir kez günlüksüz tekrarlandı (günlüklü + günlüksüz batch); sonra bu isolate'te doğrudan günlüksüz, tekrar yok
  ok200(await manual({ likes: 14 }));
  assert.equal(db.prepare("SELECT likes FROM post_snaps WHERE post_id = ? AND at = '2026-01-01'").get(pid).likes, 14);
  assert.deepEqual([MISSING.post_edits, batches.length, batches[0] - batches[1], batches[3]], [true, 4, 1, batches[1]]);
});

test("yönetim uçları: yönetici olmayana (edit_metrics olsa da) ve user_perms yoksa 404 not_found; oturumsuz 401", async () => {
  const { db, call, join } = await setup();
  const a = await join(), u = await join(), ia = await idOf(call, a), iu = await idOf(call, u);
  grant(db, ia, "admin"); grant(db, iu, "edit_metrics");
  ok200(await call("POST", "/app/posts/manual", { token: u, body: { url: IG, likes: 1 } }));
  const pid = postId(db, IG);
  // Sırayla (sahte D1'in batch'i eşzamanlı istekle iç içe geçmesin)
  const all = async token => [
    await call("GET", "/app/admin", { token }), await call("GET", `/app/admin/${iu}/posts`, { token }),
    await call("POST", `/app/admin/${iu}/perm`, { token, body: { perm: "edit_metrics", on: true } }), await call("POST", `/app/admin/${pid}/snap`, { token, body: { likes: 2 } }),
  ];
  for (const r of await all(u)) fails(r, 404, "not_found");
  for (const r of await all(undefined)) fails(r, 401, "auth");
  for (const r of await all(a)) ok200(r);
  fails(await call("GET", "/app/admin/99999999999999999999/posts", { token: a }), 404, "not_found");
  fails(await call("GET", "/app/admin/1/foo", { token: a }), 404, "not_found");
  db.exec("DROP TABLE user_perms");
  for (const r of await all(a)) fails(r, 404, "not_found");
});

test("GET admin: bu sitenin kullanıcıları, günlük, bağlı hesaplar (token/scope yok) ve Meta kayıtları; yeni önce; tablo yoksa liste boş", async () => {
  const { db, call, join } = await setup();
  const a = await join(), u = await join("brand"), ia = await idOf(call, a), iu = await idOf(call, u);
  grant(db, ia, "admin"); grant(db, ia, "edit_metrics"); grant(db, iu, "edit_metrics");
  ok200(await call("POST", "/app/posts/manual", { token: u, body: { url: IG, likes: 1, at: "2026-01-01" } }));
  const upid = postId(db, IG);
  db.prepare("INSERT INTO social_accounts (user_id, platform, handle, external_id, status) VALUES (?, 'instagram', 'ad', '17841', 'connected')").run(iu);
  db.prepare("INSERT INTO social_accounts (user_id, platform, handle, status) VALUES (?, 'youtube', 'kanal', 'error')").run(iu);
  db.prepare("INSERT INTO meta_events (kind, code, matched) VALUES ('deauthorize', NULL, 0), ('delete', 'kod1', 1)").run();
  const other = otherSite(db);
  const r = await call("GET", "/app/admin", { token: a });
  ok200(r);
  const { users, edits, syncs, meta } = r.body;
  assert.deepEqual(Object.keys(r.body).sort(), ["edits", "meta", "ok", "perm_log", "syncs", "users"]);
  assert.deepEqual(users.map(x => x.id), [iu, ia]);
  const U = ["conns", "created_at", "email", "id", "lang", "last_login", "name", "perms", "posts", "role"];
  assert.deepEqual(Object.keys(users[0]).sort(), U);
  assert.deepEqual(Object.keys(users[1]).sort(), [...U, "admin"].sort());
  assert.deepEqual([users[0].role, users[0].posts, users[0].conns, users[0].perms, users[1].perms, users[1].admin, users[1].posts], ["brand", 1, 1, ["edit_metrics"], ["edit_metrics"], true, 0]);
  assert.match(users[0].last_login, /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
  assert.deepEqual(edits.map(e => ({ ...e, id: 0, at: "" })), [{ id: 0, at: "", actor_id: iu, actor_email: users[0].email, user_id: iu, owner_email: users[0].email,
    post_id: upid, platform: "instagram", url: IG, snap_at: "2026-01-01", field: "likes", before: null, after: 1, source: "manual" }]);
  assert.deepEqual(syncs.map(s => Object.keys(s).sort()), Array(2).fill(["connected_at", "email", "error", "handle", "id", "next_sync_at", "platform", "status", "sync_changes", "updated_at", "user_id"]));
  assert.deepEqual(syncs.map(s => [s.user_id, s.email, s.platform, s.status]).sort(), [[iu, users[0].email, "instagram", "connected"], [iu, users[0].email, "youtube", "error"]]);
  assert.deepEqual(meta.map(m => [m.kind, m.code, m.matched]), [["delete", "kod1", 1], ["deauthorize", null, 0]]);
  assert.deepEqual(Object.keys(meta[0]).sort(), ["at", "code", "id", "kind", "matched"]);
  assert.ok(!JSON.stringify(r.body).includes("baska") && !JSON.stringify(r.body).includes("17841"));
  // Gönderi silinse de günlük kalır (post_id ve platform null, url günlükten)
  db.prepare("DELETE FROM posts WHERE user_id = ?").run(iu);
  db.exec("DROP TABLE meta_events");
  const r2 = await call("GET", "/app/admin", { token: a });
  ok200(r2);
  assert.deepEqual([r2.body.meta, r2.body.edits[0].post_id, r2.body.edits[0].platform, r2.body.edits[0].url, r2.body.users[0].posts], [[], null, null, IG, 0]);
});

test("GET admin/:id/posts: kullanıcının GET posts ile aynı listesi; başka site ya da olmayan kullanıcı 404", async () => {
  const { db, call, join } = await setup();
  const a = await join(), u = await join(), ia = await idOf(call, a), iu = await idOf(call, u);
  grant(db, ia, "admin");
  ok200(await call("POST", "/app/posts/manual", { token: u, body: { url: IG, likes: 1, at: "2026-01-01" } }));
  ok200(await call("POST", "/app/posts/manual", { token: u, body: { url: IG2, views: 3 } }));
  syncIt(db, IG);
  const own = (await call("GET", "/app/posts", { token: u })).body.posts;
  const r = await call("GET", `/app/admin/${iu}/posts`, { token: a });
  ok200(r);
  assert.deepEqual(r.body, { ok: true, posts: own });
  assert.equal(own.filter(p => p.synced).length, 1);
  assert.deepEqual((await call("GET", `/app/admin/${ia}/posts`, { token: a })).body, { ok: true, posts: [] });
  const other = otherSite(db);
  fails(await call("GET", `/app/admin/${other.uid}/posts`, { token: a }), 404, "not_found");
  fails(await call("GET", "/app/admin/999999/posts", { token: a }), 404, "not_found");
});

test("POST admin/:id/perm: yalnız edit_metrics açılır/kapanır (admin 400 bad_perm); yanıt {user_id, perms}; başka site 404", async () => {
  const { db, call, join } = await setup();
  const a = await join(), u = await join(), ia = await idOf(call, a), iu = await idOf(call, u);
  grant(db, ia, "admin");
  const perm = (id, body) => call("POST", `/app/admin/${id}/perm`, { token: a, body });
  for (const body of [{ perm: "admin", on: true }, { perm: "admin", on: false }, { perm: "edit_metrics" }, { perm: "edit_metrics", on: "true" }, { perm: "owner", on: true }, {}])
    fails(await perm(iu, body), 400, "bad_perm");
  fails(await perm(ia, { perm: "admin", on: false }), 400, "bad_perm");
  assert.deepEqual(db.prepare("SELECT perm FROM user_perms WHERE user_id = ?").all(ia).map(r => r.perm), ["admin"]);
  let r = await perm(iu, { perm: "edit_metrics", on: true });
  assert.deepEqual(r.body, { ok: true, user_id: iu, perms: ["edit_metrics"] });
  assert.deepEqual((await perm(iu, { perm: "edit_metrics", on: true })).body, { ok: true, user_id: iu, perms: ["edit_metrics"] });
  assert.equal(db.prepare("SELECT granted_by FROM user_perms WHERE user_id = ?").get(iu).granted_by, ia);
  const me = (await call("GET", "/auth/me", { token: u })).body.user;
  assert.deepEqual([me.perms, "admin" in me], [["edit_metrics"], false]);
  r = await perm(iu, { perm: "edit_metrics", on: false });
  assert.deepEqual(r.body, { ok: true, user_id: iu, perms: [] });
  assert.deepEqual((await perm(iu, { perm: "edit_metrics", on: false })).body, { ok: true, user_id: iu, perms: [] });
  // Yönetici kendine edit_metrics açabilir; yanıtta admin görünmez
  assert.deepEqual((await perm(ia, { perm: "edit_metrics", on: true })).body, { ok: true, user_id: ia, perms: ["edit_metrics"] });
  const other = otherSite(db);
  fails(await perm(other.uid, { perm: "edit_metrics", on: true }), 404, "not_found");
  fails(await perm(999999, { perm: "edit_metrics", on: true }), 404, "not_found");
  assert.equal(db.prepare("SELECT COUNT(*) n FROM user_perms WHERE user_id = ?").get(other.uid).n, 0);
});

test("POST admin/:id/snap: o günün ölçümüne yazar, gövdede olmayan alan korunur; changed günlük satırı; source admin; doğrulama ve 404", async () => {
  const { db, call, join } = await setup();
  const a = await join(), u = await join(), ia = await idOf(call, a), iu = await idOf(call, u);
  grant(db, ia, "admin");
  ok200(await call("POST", "/app/posts/manual", { token: u, body: { url: IG, likes: 10, comments: 3, at: "2026-01-01" } }));
  syncIt(db, IG);
  const pid = postId(db, IG), snap = body => call("POST", `/app/admin/${pid}/snap`, { token: a, body });
  let r = await snap({ at: "2026-01-01", likes: 12 });
  assert.deepEqual(r.body, { ok: true, snap: { post_id: String(pid), at: "2026-01-01", likes: 12, comments: 3, views: null, reach: null }, changed: 1 });
  assert.deepEqual((await snap({ at: "2026-01-01", likes: "12", reach: "" })).body.changed, 0);
  r = await snap({ at: "2026-01-02", views: 100 });
  assert.deepEqual(r.body, { ok: true, snap: { post_id: String(pid), at: "2026-01-02", likes: null, comments: null, views: 100, reach: null }, changed: 1 });
  r = await snap({ likes: 1 });
  assert.deepEqual([r.body.snap.at, r.body.changed], [today, 1]);
  const own = (await call("GET", "/app/posts", { token: u })).body.posts[0];
  assert.deepEqual([own.synced, own.snaps.map(s => [s.at, s.likes, s.comments, s.views])], [true, [["2026-01-01", 12, 3, null], ["2026-01-02", null, null, 100], [today, 1, null, null]]]);
  assert.deepEqual(editRows(db).filter(e => e.source === "admin").map(e => [e.actor_id, e.user_id, e.post_id, e.snap_at, e.field, e.before, e.after]),
    [[ia, iu, pid, "2026-01-01", "likes", 10, 12], [ia, iu, pid, "2026-01-02", "views", null, 100], [ia, iu, pid, today, "likes", null, 1]]);
  const bad = async (body, error) => fails(await snap(body), 400, error);
  await bad({ at: "dün", likes: 1 }, "at");
  await bad({ at: "2999-01-01", likes: 1 }, "at");
  await bad({ at: "2026-01-01" }, "metrics");
  await bad({ likes: "", views: null }, "metrics");
  await bad({ likes: -1 }, "likes");
  await bad({ comments: 1.5 }, "comments");
  await bad({ views: "1".repeat(13) }, "views");
  await bad({ reach: "çok" }, "reach");
  const other = otherSite(db);
  fails(await call("POST", `/app/admin/${other.pid}/snap`, { token: a, body: { likes: 5 } }), 404, "not_found");
  fails(await call("POST", "/app/admin/999999/snap", { token: a, body: { likes: 5 } }), 404, "not_found");
  assert.equal(db.prepare("SELECT likes FROM post_snaps WHERE post_id = ?").get(other.pid).likes, 1);
});

test("POST admin/:id/snap: gönderi önce aranır (başka site ya da yok: gövde ne olursa olsun 404); post_edits yoksa yazar, changed null", async t => {
  const { db, call, join } = await setup();
  const a = await join(), u = await join(), ia = await idOf(call, a);
  grant(db, ia, "admin");
  ok200(await call("POST", "/app/posts/manual", { token: u, body: { url: IG, likes: 10, at: "2026-01-01" } }));
  const pid = postId(db, IG), other = otherSite(db);
  const snap = (id, body) => call("POST", `/app/admin/${id}/snap`, { token: a, body });
  for (const id of [other.pid, 999999])
    for (const body of [{ at: "dün", likes: 1 }, {}, { likes: -1 }, { at: "2026-01-01", reach: "çok" }, { likes: 5 }]) fails(await snap(id, body), 404, "not_found");
  fails(await snap(pid, { at: "dün", likes: 1 }), 400, "at");
  fails(await snap(pid, {}), 400, "metrics");
  assert.equal(db.prepare("SELECT likes FROM post_snaps WHERE post_id = ?").get(other.pid).likes, 1);
  db.exec("DROP TABLE post_edits");
  t.after(() => { MISSING.post_edits = false; });
  for (const likes of [11, 12]) {
    const r = await snap(pid, { at: "2026-01-01", likes });
    assert.deepEqual([r.status, r.body.changed, r.body.snap.likes], [200, null, likes]);
  }
  assert.equal(db.prepare("SELECT likes FROM post_snaps WHERE post_id = ? AND at = '2026-01-01'").get(pid).likes, 12);
});

test("GET admin: günlük tabloları (post_edits, perm_log, meta_events) yoksa liste boş; kullanıcı ya da hesap sorgusunda tablo yoksa 503 not_ready", async () => {
  for (const drop of ["posts", "social_accounts"]) {
    const { db, call, join } = await setup();
    const a = await join(), ia = await idOf(call, a);
    grant(db, ia, "admin");
    ok200(await call("POST", "/app/posts/manual", { token: a, body: { url: IG, likes: 1, at: "2026-01-01" } }));
    ok200(await call("POST", `/app/admin/${ia}/perm`, { token: a, body: { perm: "edit_metrics", on: true } }));
    db.prepare("INSERT INTO meta_events (kind, code, matched) VALUES ('deauthorize', NULL, 0)").run();
    let r = await call("GET", "/app/admin", { token: a });
    assert.deepEqual([r.status, r.body.edits.length, r.body.perm_log.length, r.body.meta.length], [200, 1, 1, 1]);
    for (const x of ["post_edits", "perm_log", "meta_events"]) db.exec(`DROP TABLE ${x}`);
    r = await call("GET", "/app/admin", { token: a });
    ok200(r);
    assert.deepEqual([r.body.edits, r.body.perm_log, r.body.meta, r.body.users.map(x => x.id)], [[], [], [], [ia]]);
    db.exec(`DROP TABLE ${drop}`);
    fails(await call("GET", "/app/admin", { token: a }), 503, "not_ready");
  }
});

test("POST admin/:id/perm: yalnız gerçek değişiklik perm_log'a bir satır (aynı batch; granted 1/0, actor); GET admin perm_log bu siteden, yeni önce, en çok 100; tablo yoksa değişiklik yine olur", async t => {
  const { db, env, call, join } = await setup();
  const a = await join(), u = await join(), ia = await idOf(call, a), iu = await idOf(call, u);
  grant(db, ia, "admin");
  const perm = async (id, on) => (await call("POST", `/app/admin/${id}/perm`, { token: a, body: { perm: "edit_metrics", on } })).body;
  const logRows = () => db.prepare("SELECT actor_id, user_id, perm, granted FROM perm_log ORDER BY id").all().map(r => [r.actor_id, r.user_id, r.perm, r.granted]);
  const batches = [], batch = env.DB.batch;
  env.DB.batch = list => (batches.push(list.length), batch(list));
  assert.deepEqual(await perm(iu, false), { ok: true, user_id: iu, perms: [] });
  assert.deepEqual(await perm(iu, true), { ok: true, user_id: iu, perms: ["edit_metrics"] });
  assert.deepEqual(await perm(iu, true), { ok: true, user_id: iu, perms: ["edit_metrics"] });
  assert.deepEqual(await perm(iu, false), { ok: true, user_id: iu, perms: [] });
  assert.deepEqual(await perm(ia, true), { ok: true, user_id: ia, perms: ["edit_metrics"] });
  assert.deepEqual(batches, [2, 2, 2, 2, 2]);
  assert.deepEqual(logRows(), [[ia, iu, "edit_metrics", 1], [ia, iu, "edit_metrics", 0], [ia, ia, "edit_metrics", 1]]);
  // Başka sitenin kullanıcısına yazılmaz, onun günlüğü listede görünmez
  const other = otherSite(db);
  db.prepare("INSERT INTO perm_log (actor_id, user_id, perm, granted) VALUES (?, ?, 'edit_metrics', 1)").run(other.uid, other.uid);
  fails(await call("POST", `/app/admin/${other.uid}/perm`, { token: a, body: { perm: "edit_metrics", on: true } }), 404, "not_found");
  let r = await call("GET", "/app/admin", { token: a });
  ok200(r);
  const em = Object.fromEntries(r.body.users.map(x => [x.id, x.email]));
  const row = (user_id, granted) => ({ id: 0, at: "", actor_id: ia, actor_email: em[ia], user_id, email: em[user_id], perm: "edit_metrics", granted });
  assert.deepEqual(r.body.perm_log.map(l => ({ ...l, id: 0, at: "" })), [row(ia, 1), row(iu, 0), row(iu, 1)]);
  assert.deepEqual(Object.keys(r.body.perm_log[0]).sort(), ["actor_email", "actor_id", "at", "email", "granted", "id", "perm", "user_id"]);
  assert.match(r.body.perm_log[0].at, /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
  assert.ok(!JSON.stringify(r.body).includes("baska"));
  // Silinen yönetici: actor_email null, satır kalır; en çok 100, en yeni önce
  const add = db.prepare("INSERT INTO perm_log (actor_id, user_id, perm, granted) VALUES (999999, ?, 'edit_metrics', ?)");
  for (let i = 0; i < 110; i++) add.run(iu, i % 2);
  r = await call("GET", "/app/admin", { token: a });
  const ids = r.body.perm_log.map(l => l.id);
  assert.deepEqual([ids.length, ids[0], [...ids].sort((x, y) => y - x).join(), r.body.perm_log[0].actor_email, r.body.perm_log[0].granted],
    [100, db.prepare("SELECT MAX(id) n FROM perm_log").get().n, ids.join(), null, 1]);
  // Tablo yoksa: değişiklik günlüksüz yapılır (ilk istekte bir kez tekrar, sonra doğrudan), liste boş
  db.exec("DROP TABLE perm_log");
  t.after(() => { MISSING.perm_log = false; });
  batches.length = 0;
  assert.deepEqual(await perm(iu, true), { ok: true, user_id: iu, perms: ["edit_metrics"] });
  assert.deepEqual(await perm(iu, false), { ok: true, user_id: iu, perms: [] });
  assert.deepEqual([MISSING.perm_log, batches], [true, [2, 1, 1]]);
  r = await call("GET", "/app/admin", { token: a });
  assert.deepEqual([r.status, r.body.perm_log], [200, []]);
});

// D1 ifade sayacı: batch içindekiler tek tek sayılır (ücretsiz planda istek başına 50)
function counted(env) {
  const db = env.DB, n = { q: 0 };
  const wrap = s => ({ s, bind: (...a) => wrap(s.bind(...a)), all: () => (n.q++, s.all()), first: () => (n.q++, s.first()), run: () => (n.q++, s.run()) });
  env.DB = { prepare: sql => wrap(db.prepare(sql)), batch: list => (n.q += list.length, db.batch(list.map(x => x.s))) };
  return n;
}

test("D1: istek başına ifade (GET admin, perm, snap); tablo yokken ilk istek bir fazla, sonra bir eksik", async t => {
  const { db, env, call, join } = await setup();
  const a = await join(), u = await join(), ia = await idOf(call, a), iu = await idOf(call, u);
  grant(db, ia, "admin");
  ok200(await call("POST", "/app/posts/manual", { token: u, body: { url: IG, likes: 1, at: "2026-01-01" } }));
  const pid = postId(db, IG), n = counted(env);
  const count = async (...args) => { n.q = 0; ok200(await call(...args)); return n.q; };
  const perm = on => count("POST", `/app/admin/${iu}/perm`, { token: a, body: { perm: "edit_metrics", on } });
  const snap = likes => count("POST", `/app/admin/${pid}/snap`, { token: a, body: { at: "2026-01-01", likes } });
  assert.deepEqual([await count("GET", "/app/admin", { token: a }), await perm(true), await snap(2)], [7, 6, 6]);
  for (const x of ["perm_log", "post_edits"]) db.exec(`DROP TABLE ${x}`);
  t.after(() => { MISSING.perm_log = MISSING.post_edits = false; });
  assert.deepEqual([await perm(false), await snap(3), await perm(true), await snap(4)], [7, 7, 5, 5]);
});
