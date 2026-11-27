// node --test src/drafts-keep.test.mjs — A15 taslak geçmişi 3 gün: keepDays (src/platform.js) eski taslakları siler, son
// durumdaki blog yazılarının gövdesini boşaltır (satır kalır), 0020 tablo yeniden kurulumu satırları ve kimlikleri korur,
// saatlik cron'un D1 bütçesi 50'yi aşmaz. D1 yerine node:sqlite; ağ yok.
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
globalThis.fetch = async () => { throw new Error("gerçek ağ çağrısı yasak"); };

const { keepDays, cleanup, DRAFT_KEEP_DAYS, CMS_DONE_STATES } = await import("./platform.js");
const { genCleanup } = await import("./generate.js");
const { ytRetention } = await import("./oauth.js");
const { botCleanup } = await import("./chatbot.js");

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const SCHEMA = read("../schema.sql");
const MIG = ["0001_metrics", "0002_oauth", "0003_sync", "0004_sync_changes", "0006_posts", "0014_gen", "0018_plans", "0019_cms", "0021_cms_send_now"].map(n => read(`../migrations/${n}.sql`));
const M0017 = read("../migrations/0017_accounts.sql");
const M0020 = read("../migrations/0020_drafts_3gun.sql");

// prepare sayacıyla D1 taklidi (batch içindeki her ifade de bir prepare sayılır)
function d1(db, count = { n: 0 }) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })) }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes) } }; },
    raw: () => ({ sql, args }),
  });
  const batch = async list => {
    db.exec("BEGIN");
    try {
      const out = list.map(s => { const { sql, args } = s.raw(), i = db.prepare(sql).run(...args); return { results: [], meta: { changes: Number(i.changes) } }; });
      db.exec("COMMIT");
      return out;
    } catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  return { prepare: sql => { count.n++; return stmt(sql); }, batch };
}

function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  for (const m of MIG) db.exec(m);
  db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES ('app.socialmediacorner.co', 'a@ornek.test', 'a', 'brand', 'x')").run();
  return db;
}
const draft = (db, platform, age, meta = "{}") => Number(db.prepare(
  "INSERT INTO drafts (user_id, site, created_at, platform, topic, body, meta) VALUES (1, 'app.socialmediacorner.co', datetime('now', ?), ?, 'k', 'g', ?)",
).run(age, platform, meta).lastInsertRowid);

test("A15: keepDays 3 günden eski taslakları siler, yenileri bırakır; tam 2 ifade", async () => {
  assert.equal(DRAFT_KEEP_DAYS, 3);
  const db = freshDb();
  const eski = [draft(db, "linkedin", "-4 days"), draft(db, "blog", "-75 hours", '{"kind":"blog"}'), draft(db, "video", "-73 hours", '{"kind":"carousel"}')];
  const yeni = [draft(db, "instagram", "-71 hours", '{"kind":"reels"}'), draft(db, "video", "-1 hours"), draft(db, "blog", "+0 seconds")];
  const count = { n: 0 };
  const out = await keepDays({ DB: d1(db, count) });
  assert.equal(count.n, 2);
  assert.equal(out.drafts, eski.length);
  assert.deepEqual(db.prepare("SELECT id FROM drafts ORDER BY id").all().map(r => r.id), yeni);
});

test("A15: keepDays son durumdaki eski blog yazılarının gövdesini boşaltır, satırı ve süren işleri bırakır", async () => {
  const db = freshDb();
  db.prepare("INSERT INTO cms_sites (user_id, site, platform) VALUES (1, 'app.socialmediacorner.co', 'wordpress')").run();
  const post = (state, age, md = "# Yazı") => Number(db.prepare(
    "INSERT INTO cms_posts (cms_site_id, user_id, slot, title, markdown, state, updated_at) VALUES (1, 1, ?, 'Başlık', ?, ?, datetime('now', ?))",
  ).run(`${state}${age}`, md, state, age).lastInsertRowid);
  const bos = CMS_DONE_STATES.map(s => post(s, "-4 days"));
  const kalan = [
    post("hazir", "-10 days"), post("uretiliyor", "-10 days"), post("gonderiliyor", "-10 days"),
    post("yayinlandi", "-2 days"), post("basarisiz", "-1 hours"),
  ];
  post("iptal", "-5 days", null); // zaten boş: değişiklik sayılmaz
  const out = await keepDays({ DB: d1(db) });
  assert.equal(out.cms_posts, bos.length);
  const rows = Object.fromEntries(db.prepare("SELECT id, markdown, title FROM cms_posts").all().map(r => [r.id, r]));
  assert.equal(Object.keys(rows).length, bos.length + kalan.length + 1, "satır silinmez");
  for (const id of bos) { assert.equal(rows[id].markdown, null); assert.equal(rows[id].title, "Başlık"); }
  for (const id of kalan) assert.equal(rows[id].markdown, "# Yazı");
  // updated_at ilerlemez: boşaltma saklama süresini uzatmaz, cmsPurge 90 gün sayımı bozulmaz
  assert.equal(db.prepare("SELECT count(*) n FROM cms_posts WHERE updated_at > datetime('now', '-3 days') AND id IN (" + bos.join(",") + ")").get().n, 0);
});

test("A15: keepDays tablo yoksa sessiz geçer (0017/0019 uygulanmamış)", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA.replace(/CREATE TABLE IF NOT EXISTS drafts[\s\S]*?\);/, "").replace(/CREATE INDEX IF NOT EXISTS drafts_\w+ ON drafts[^;]*;/g, ""));
  const logs = [], log = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  try { assert.deepEqual(await keepDays({ DB: d1(db) }), { drafts: 0, cms_posts: 0 }); } finally { console.log = log; }
  assert.deepEqual(logs, []);
});

test("A15: 0020 0017 tablosunu yeniden kurar: satırlar ve kimlikler korunur, blog/video kabul, başkası red, yeni kimlik var olan en büyüğün üstünde (sqlite_sequence'e yazılmaz)", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, site TEXT, email TEXT)");
  db.prepare("INSERT INTO users (site, email) VALUES ('s', 'e')").run();
  db.exec(M0017.match(/CREATE TABLE IF NOT EXISTS drafts[\s\S]*?\);/)[0]);
  db.exec("CREATE INDEX drafts_user ON drafts (user_id, id DESC)");
  const ins = (p, id) => db.prepare(`INSERT INTO drafts (${id ? "id, " : ""}user_id, site, platform, body, meta) VALUES (${id ? "?, " : ""}1, 's', ?, 'g', '{"a":1}')`).run(...(id ? [id, p] : [p]));
  ins("linkedin"); ins("instagram", 41); ins("linkedin");
  db.exec("DELETE FROM drafts WHERE id = 42"); // AUTOINCREMENT: silinen en büyük kimlik yeniden verilmez
  assert.throws(() => ins("blog"), /CHECK/);
  const once = db.prepare("SELECT * FROM drafts ORDER BY id").all().map(r => ({ ...r }));
  db.exec(M0020);
  assert.deepEqual(db.prepare("SELECT * FROM drafts ORDER BY id").all().map(r => ({ ...r })), once);
  // sayaç taşınmaz (canlıda drafts hiç satır almamıştı): yeni kimlik var olan en büyük kimliğin (41) üstünden sürer
  assert.ok(Number(ins("blog").lastInsertRowid) > 41);
  assert.ok(Number(ins("video").lastInsertRowid) > 41);
  assert.throws(() => ins("tiktok"), /CHECK/);
  const idx = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'drafts' ORDER BY name").all().map(r => r.name);
  assert.ok(idx.includes("drafts_user") && idx.includes("drafts_age"));
  // kullanıcı silinince taslakları gider (ON DELETE CASCADE yeni tabloda da)
  db.exec("DELETE FROM users WHERE id = 1");
  assert.equal(db.prepare("SELECT count(*) n FROM drafts").get().n, 0);
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("A15: saatlik cron D1 bütçesi: sabit ifadeler index.js'deki düşümle aynı, toplam 50'yi aşmaz", async () => {
  const src = read("./index.js");
  const m = src.match(/const d1 = 50 - 1 - results\.length((?: - \d+)+);/);
  assert.ok(m, "index.js d1 bütçe satırı");
  const dusum = m[1].match(/\d+/g).map(Number);
  const db = freshDb();
  const say = async fn => { const c = { n: 0 }; await fn({ DB: d1(db, c) }); return c.n; };
  const gercek = [await say(cleanup), await say(ytRetention), await say(genCleanup), await say(keepDays), await say(botCleanup)];
  assert.deepEqual(dusum, gercek, "index.js düşümü: cleanup, ytRetention, genCleanup, keepDays, botCleanup");
  const sabit = 1 + gercek.reduce((a, b) => a + b, 0);
  assert.equal(sabit, 18);
  // bekleyen e-posta yokken senkrona kalan pay + sabitler = 50
  assert.equal(sabit + (50 - sabit), 50);
  assert.ok(50 - sabit > 0);
});

test("A15: postOut content_deleted yalnız içeriği olmuş ve boşaltılmış yazıda; istemci yeniden göndermeyi gizler", async () => {
  const { postOut } = await import("./cms.js");
  const p = (state, markdown) => postOut({ id: 1, state, markdown }).content_deleted;
  for (const s of ["gonderildi", "yayinlandi", "basarisiz"]) { assert.equal(p(s, null), true, s); assert.equal(p(s, "# m"), false, s); }
  for (const s of ["uretiliyor", "hazir", "gonderiliyor", "kota", "iptal"]) assert.equal(p(s, null), false, s);
  assert.equal("markdown" in postOut({ id: 1, state: "gonderildi", markdown: "# m" }), false, "gövde istemciye gitmez");
});
