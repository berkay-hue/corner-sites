// node --test src/drafts-media.test.mjs — POST /app/drafts/:id/media (taslağın görsel kurgusu meta.media'ya) ve GET /app/drafts
// ?kind= süzgeci: sahiplik, site, süre, Pexels host kilidi, boyut ve şema sınırları. D1 yerine node:sqlite; ağ yok.
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
// Kayıt Turnstile siteverify'ı dışında ağ yok
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
globalThis.fetch = async u => {
  if (String(u) === SITEVERIFY) return Response.json({ success: true });
  throw new Error("gerçek ağ çağrısı yasak");
};

const { platform, mediaIn } = await import("./platform.js");

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const MIG = ["0001_metrics", "0002_oauth", "0003_sync", "0004_sync_changes", "0005_notify", "0006_posts", "0007_post_source",
  "0008_linkedin", "0009_audience", "0010_post_audience", "0011_meta_scoped", "0013_linkedin_posts"].map(n => read(`../migrations/${n}.sql`));

function d1(db) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })) }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes), last_row_id: Number(i.lastInsertRowid) } }; },
  });
  const batch = async list => {
    db.exec("BEGIN");
    try { const out = []; for (const s of list) out.push(await s.run()); db.exec("COMMIT"); return out; } catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  return { prepare: sql => stmt(sql), batch, exec: async sql => db.exec(sql) };
}

const APP = "https://app.socialmediacorner.co";
async function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(read("../schema.sql"));
  for (const m of MIG) db.exec(m);
  const env = { DB: d1(db), PBKDF2_ITER: "10000", ACCOUNTS_ENABLED: "1", TURNSTILE_SECRET: "ts-gizli" };
  const call = async (method, path, { token, body, raw, origin = APP } = {}) => {
    const headers = { "cf-connecting-ip": "10.0.9.1", "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method, headers, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
    const res = await platform(req, new URL(req.url), env, origin, async () => {});
    return { status: res.status, body: await res.json() };
  };
  let n = 0;
  const join = async email => {
    const r = await call("POST", "/auth/register", { body: { name: email, email, password: "sifre-12345", consent: true, ai_consent: true, ts: "ts-ok", hp: "", t: 2000 } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    n++;
    return { token: r.body.token, id: r.body.user.id };
  };
  const add = (userId, { site = "app.socialmediacorner.co", platform = "video", meta = { kind: "carousel", tone: "net" }, age = 0 } = {}) =>
    Number(db.prepare(`INSERT INTO drafts (user_id, site, platform, topic, body, meta, created_at) VALUES (?, ?, ?, 'konu', 'metin', ?, datetime('now', ?))`)
      .run(userId, site, platform, typeof meta === "string" ? meta : JSON.stringify(meta), `-${age} days`).lastInsertRowid);
  const metaOf = id => JSON.parse(db.prepare("SELECT meta FROM drafts WHERE id = ?").get(id).meta);
  return { db, call, join, add, metaOf };
}
const fail = r => [r.status, r.body.error];

const PHOTO = (k, id = 1000 + k) => ({ k, id, src: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&w=1080`, w: 1080, h: 1350,
  alt: "Ofiste toplantı", photographer: "Ayşe Ç.", url: `https://www.pexels.com/photo/${id}/` });
const VIDEO = (k, id = 2000 + k) => ({ k, id, src: `https://videos.pexels.com/video-files/${id}/${id}-hd_1080_1920_25fps.mp4`,
  poster: `https://images.pexels.com/videos/${id}/pictures/preview-0.jpg`, w: 1080, h: 1920, dur: 12, user: "Ali", url: `https://www.pexels.com/video/${id}/` });
const MEDIA = () => ({
  template: "duz", aspect: "4:5", palette: { id: "gece", accent: "#8a63f2" }, vurgu: "#8a63f2", brand: { name: "Corner", handle: "@corner" },
  scenes: [{ text: "Başlık", sub: "Alt yazı", secs: 3.5, foto: 1 }, { text: "İkinci", sub: "", secs: 4, video: 1 }],
  photos: [PHOTO(1)], videos: [VIDEO(1)], blog: { yer: [{ k: 1, fotoId: 1001 }], tek: false },
});

test("media: sahibi kaydeder; meta'nın öteki alanları kalır; GET /app/drafts/:id ve liste meta.media'yı döndürür; ikinci kayıt tamamen değiştirir; null siler", async () => {
  const { call, join, add, metaOf } = await setup();
  const a = await join("a@x.co");
  const id = add(a.id);
  const m = MEDIA();
  const r = await call("POST", `/app/drafts/${id}/media`, { token: a.token, body: { media: m } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(r.body, { ok: true, media: m });
  assert.deepEqual(metaOf(id), { kind: "carousel", tone: "net", media: m });
  const one = await call("GET", `/app/drafts/${id}`, { token: a.token });
  assert.deepEqual(one.body.draft.meta.media, m);
  assert.equal(one.body.draft.meta.kind, "carousel");
  const list = await call("GET", "/app/drafts", { token: a.token });
  assert.deepEqual(list.body.drafts.find(x => x.id === id).meta.media, m);
  // ikinci kayıt birleştirmez, yerine geçer (eski foto listesi kalmaz)
  const m2 = { template: "kalin", aspect: "9:16", scenes: [{ text: "Tek", secs: 5 }] };
  assert.equal((await call("POST", `/app/drafts/${id}/media`, { token: a.token, body: { media: m2 } })).status, 200);
  assert.deepEqual(metaOf(id), { kind: "carousel", tone: "net", media: m2 });
  // null → meta.media silinir, öteki alanlar kalır
  const del = await call("POST", `/app/drafts/${id}/media`, { token: a.token, body: { media: null } });
  assert.deepEqual([del.status, del.body], [200, { ok: true, media: null }]);
  assert.deepEqual(metaOf(id), { kind: "carousel", tone: "net" });
  // boş meta ('{}') olan satıra da yazılır
  const bare = add(a.id, { meta: "{}" });
  assert.equal((await call("POST", `/app/drafts/${bare}/media`, { token: a.token, body: { media: m2 } })).status, 200);
  assert.deepEqual(metaOf(bare), { media: m2 });
});

test("media sahiplik/site/süre: başkasının, başka sitenin, süresi dolmuş ya da olmayan taslağı 404; satır değişmez; oturumsuz 401", async () => {
  const { call, join, add, metaOf } = await setup();
  const a = await join("a@x.co"), b = await join("b@x.co");
  const theirs = add(b.id), otherSite = add(a.id, { site: "brandcorner.co" }), old = add(a.id, { age: 4 }), fresh = add(a.id, { age: 2 });
  const body = { media: MEDIA() };
  for (const id of [theirs, otherSite, old, 999999])
    assert.deepEqual(fail(await call("POST", `/app/drafts/${id}/media`, { token: a.token, body })), [404, "not_found"], String(id));
  for (const id of [theirs, otherSite, old]) assert.equal(metaOf(id).media, undefined);
  assert.equal((await call("POST", `/app/drafts/${fresh}/media`, { token: a.token, body })).status, 200);
  // b kendi taslağına yazabilir; a'nınkine yazamaz
  assert.equal((await call("POST", `/app/drafts/${theirs}/media`, { token: b.token, body })).status, 200);
  assert.deepEqual(fail(await call("POST", `/app/drafts/${fresh}/media`, { token: b.token, body: { media: { template: "x" } } })), [404, "not_found"]);
  assert.equal(metaOf(fresh).media.template, "duz");
  assert.deepEqual(fail(await call("POST", `/app/drafts/${fresh}/media`, { body })), [401, "auth"]);
  // yanlış yöntem / kimliksiz yol izin listesinde yok
  assert.deepEqual(fail(await call("GET", `/app/drafts/${fresh}/media`, { token: a.token })), [404, "not_found"]);
  assert.deepEqual(fail(await call("POST", "/app/drafts/media", { token: a.token, body })), [404, "not_found"]);
});

test("media host kilidi: foto yalnız images.pexels.com, video yalnız videos.pexels.com, poster images, sayfa www.pexels.com; adres anahtarları her katta", async () => {
  const { call, join, add, metaOf } = await setup();
  const a = await join("a@x.co");
  const id = add(a.id);
  const bad = [
    m => { m.photos[0].src = "https://evil.example/x.jpg"; },
    m => { m.photos[0].src = "http://images.pexels.com/photos/1/x.jpeg"; },
    m => { m.photos[0].src = "https://images.pexels.com.evil.example/x.jpeg"; },
    m => { m.photos[0].src = "https://images.pexels.com/x\".jpeg"; },
    m => { m.photos[0].src = "https://videos.pexels.com/video-files/1/a.mp4"; },
    m => { delete m.photos[0].src; },
    m => { m.photos[0].url = "https://evil.example/"; },
    m => { m.videos[0].src = "https://images.pexels.com/videos/1/a.mp4"; },
    m => { m.videos[0].src = "https://player.vimeo.com/external/1.hd.mp4"; },
    m => { m.videos[0].poster = "https://videos.pexels.com/x.jpg"; },
    m => { m.videos[0].url = "javascript:alert(1)"; },
    m => { m.scenes[0].image = "data:image/png;base64,AAAA"; },
    m => { m.scenes[0].src = "https://evil.example/a.png"; },
    m => { m.logo = "blob:https://app.socialmediacorner.co/1"; },
    m => { m.bgImage = "https://evil.example/bg.jpg"; },
    m => { m.blog.yer[0].href = "https://evil.example/"; },
    m => { m.photos[0].photographer_url = "javascript:alert(1)"; },
    m => { m.videos[0].user_url = "https://evil.example/@x"; },
    m => { m.brand.logoUrl = "data:image/svg+xml,<svg onload=alert(1)>"; },
  ];
  for (const [i, f] of bad.entries()) {
    const m = MEDIA();
    f(m);
    assert.deepEqual(fail(await call("POST", `/app/drafts/${id}/media`, { token: a.token, body: { media: m } })), [400, "host"], `#${i}`);
  }
  assert.equal(metaOf(id).media, undefined);
  // pexels.com (www'suz) sayfa bağlantısı ve boş adres (seçilmemiş görsel) geçer; metin içindeki adres (anahtar adres değil) serbest
  const m = MEDIA();
  m.photos[0].url = "https://pexels.com/photo/1/";
  m.scenes[0].image = "";
  m.scenes[0].text = "Ayrıntı: https://socialmediacorner.co";
  assert.equal((await call("POST", `/app/drafts/${id}/media`, { token: a.token, body: { media: m } })).status, 200);
});

test("media boyut ve şema: ≤12 foto/video, ≤30 sahne, ≤8192 bayt (413), en çok 4 kat, düz JSON; gövdesiz/dizi 400 media", async () => {
  const { call, join, add, metaOf } = await setup();
  const a = await join("a@x.co");
  const id = add(a.id);
  const post = media => call("POST", `/app/drafts/${id}/media`, { token: a.token, body: { media } });
  const twelve = MEDIA();
  twelve.photos = Array.from({ length: 12 }, (_, i) => ({ k: i, src: `https://images.pexels.com/photos/${i}/p.jpeg` }));
  twelve.videos = [];
  assert.equal((await post(twelve)).status, 200);
  assert.deepEqual(fail(await post({ ...twelve, photos: [...twelve.photos, twelve.photos[0]] })), [400, "photos"]);
  assert.deepEqual(fail(await post({ videos: Array.from({ length: 13 }, (_, i) => ({ k: i, src: `https://videos.pexels.com/v/${i}.mp4` })) })), [400, "videos"]);
  assert.deepEqual(fail(await post({ scenes: Array.from({ length: 31 }, () => ({ text: "a" })) })), [400, "scenes"]);
  assert.deepEqual(fail(await post({ photos: {} })), [400, "photos"]);
  assert.deepEqual(fail(await post({ photos: ["https://images.pexels.com/a.jpg"] })), [400, "media"]);
  assert.deepEqual(fail(await post({ scenes: ["metin"] })), [400, "media"]);
  assert.deepEqual(fail(await post({ brand: "Corner" })), [400, "media"]);
  // boyut UTF-8 bayt üzerinden: 30 sahne × Türkçe metin 8 KB'yi aşar → 413 size; sınırın altı geçer
  const big = { scenes: Array.from({ length: 30 }, () => ({ text: "ğ".repeat(70), sub: "ş".repeat(70), secs: 3 })) };
  assert.ok(Buffer.byteLength(JSON.stringify(big)) > 8192 && JSON.stringify(big).length < 20000);
  assert.deepEqual(fail(await post(big)), [413, "size"]);
  const fits = { scenes: Array.from({ length: 30 }, () => ({ text: "Kısa başlık metni", sub: "alt yazı", secs: 3 })) };
  assert.equal((await post(fits)).status, 200);
  assert.deepEqual(metaOf(id).media, fits);
  // genel sınırlar: derinlik, uzun metin, çok anahtar, uygunsuz anahtar adı, uzun dizi
  for (const m of [
    { a: { b: { c: { d: { e: 1 } } } } },
    { scenes: [{ text: "x".repeat(2001) }] },
    Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`k${i}`, 1])),
    { "kötü-anahtar": 1 },
    { list: Array.from({ length: 41 }, () => 1) },
  ]) assert.deepEqual(fail(await post(m)), [400, "media"], JSON.stringify(m).slice(0, 60));
  for (const body of [{}, { media: [] }, { media: "x" }, { media: 1 }, { foto: MEDIA() }])
    assert.deepEqual(fail(await call("POST", `/app/drafts/${id}/media`, { token: a.token, body })), [400, "media"], JSON.stringify(body).slice(0, 40));
  assert.deepEqual(fail(await call("POST", `/app/drafts/${id}/media`, { token: a.token, raw: "{" })), [400, "json"]);
  assert.deepEqual(fail(await call("POST", `/app/drafts/${id}/media`, { token: a.token, raw: JSON.stringify({ media: { t: "x".repeat(20001) } }) })), [413, "size"]);
  assert.deepEqual(metaOf(id).media, fits);
});

test("mediaIn: sözleşme örneği geçer, normalleşmiş JSON döner; 6 KB'lık tipik karusel sınırın altında", () => {
  const m = MEDIA();
  m.photos = Array.from({ length: 12 }, (_, i) => PHOTO(i));
  m.videos = Array.from({ length: 3 }, (_, i) => VIDEO(i));
  m.scenes = Array.from({ length: 10 }, (_, i) => ({ text: `Sahne ${i} başlığı`, sub: "Kısa açıklama", secs: 3, foto: i }));
  const json = mediaIn(m);
  assert.deepEqual(JSON.parse(json), m);
  assert.ok(Buffer.byteLength(json) < 8192, String(Buffer.byteLength(json)));
  assert.throws(() => mediaIn(null), { code: "media" });
  // prototip anahtarları (istemci Object.assign ile birleştirirse nesnenin prototipini değiştirir) 400 media
  assert.throws(() => mediaIn(JSON.parse('{"__proto__":{"x":1}}')), { code: "media" });
  assert.throws(() => mediaIn({ scenes: [{ constructor: "x" }] }), { code: "media" });
  // Pexels sayfası olan photographer_url / user_url geçer
  assert.ok(mediaIn({ photos: [{ ...PHOTO(0), photographer_url: "https://www.pexels.com/@ayse" }] }));
  assert.throws(() => mediaIn({ photos: [{ k: 1, src: "https://evil.example/a.jpg" }] }), { code: "host" });
});

test("GET /app/drafts ?kind=: meta.kind süzgeci; li eski kind'sız LinkedIn satırlarını da kapsar, linkedin = li; geçersiz 400 kind", async () => {
  const { call, join, add } = await setup();
  const a = await join("a@x.co"), b = await join("b@x.co");
  const car = add(a.id, { platform: "video", meta: { kind: "carousel" } });
  const vid = add(a.id, { platform: "video", meta: { kind: "video" } });
  const li = add(a.id, { platform: "linkedin", meta: { kind: "li" } });
  const legacy = add(a.id, { platform: "linkedin", meta: { tone: "net" } });
  const blog = add(a.id, { platform: "blog", meta: { kind: "blog" } });
  const reels = add(a.id, { platform: "instagram", meta: { kind: "reels" } });
  const cap = add(a.id, { platform: "instagram", meta: { kind: "caption" } });
  add(b.id, { platform: "video", meta: { kind: "carousel" } });
  add(a.id, { site: "brandcorner.co", platform: "video", meta: { kind: "carousel" } });
  const ids = async qs => (await call("GET", `/app/drafts?${qs}`, { token: a.token })).body.drafts.map(x => x.id);
  assert.deepEqual(await ids("kind=carousel"), [car]);
  assert.deepEqual(await ids("kind=video"), [vid]);
  assert.deepEqual(await ids("kind=li"), [legacy, li]);
  assert.deepEqual(await ids("kind=linkedin"), [legacy, li]);
  assert.deepEqual(await ids("kind=blog"), [blog]);
  assert.deepEqual(await ids("kind=reels"), [reels]);
  assert.deepEqual(await ids("kind=caption"), [cap]);
  assert.deepEqual(await ids("kind=carousel&platform=video"), [car]);
  assert.deepEqual(await ids("kind=carousel&platform=instagram"), []);
  assert.deepEqual(await ids("kind=reels&q=konu"), [reels]);
  assert.deepEqual(await ids(""), [cap, reels, blog, legacy, li, vid, car]);
  for (const k of ["tiktok", "LI", "media", "__proto__"])
    assert.deepEqual(fail(await call("GET", `/app/drafts?kind=${k}`, { token: a.token })), [400, "kind"], k);
});
