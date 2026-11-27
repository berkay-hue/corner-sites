// node --test src/chatbot.test.mjs — chatbot.js uç güvenliği: girişsiz 401, CRUD akışı, IDOR (başka kullanıcının botu → 404),
// plan bot sayısı sınırı, 413 gövde, 400 bad_json, botCleanup sorguları. D1 yerine node:sqlite (+ SQL kaydı); ağ yok.
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
globalThis.fetch = async () => { throw new Error("gerçek ağ çağrısı yasak"); };

const { chatbot, chatbotRoute, botCleanup, BOT_PLANS, BOT_BODY_MAX } = await import("./chatbot.js");

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const SCHEMA = read("../schema.sql");
const BASE = ["0001_metrics", "0002_oauth", "0018_plans"].map(n => read(`../migrations/${n}.sql`));
const BOT = read("../migrations/0022_chatbot.sql");

// D1 sahtesi: her çalışan SQL `log`a düşer (yazma sorgularını denetlemek için).
function d1(db, log = []) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    all: async () => { log.push(sql); return { results: db.prepare(sql).all(...args).map(r => ({ ...r })) }; },
    first: async () => { log.push(sql); const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => {
      log.push(sql);
      const i = db.prepare(sql).run(...args);
      return { success: true, results: [], meta: { changes: Number(i.changes), last_row_id: Number(i.lastInsertRowid) } };
    },
  });
  const batch = async ss => {
    db.exec("BEGIN");
    try { const out = []; for (const s of ss) out.push(await s.run()); db.exec("COMMIT"); return out; }
    catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  return { prepare: sql => stmt(sql), batch };
}

const APP = "https://app.socialmediacorner.co", SMC = "app.socialmediacorner.co";
const hash = t => createHash("sha256").update(t).digest("hex");
const tok = ch => ch.repeat(43);
const ENV = { ACCOUNTS_ENABLED: "1", BOT_ENABLED: "1", GEN_SALT: "salt", PBKDF2_ITER: "10000" };

function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  for (const m of BASE) db.exec(m);
  db.exec(BOT);
  return db;
}
function kullanici(db, email, plan, ch, { sure = "+30 days" } = {}) {
  const id = Number(db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, ?, ?, 'brand', 'x')").run(SMC, email, email.split("@")[0]).lastInsertRowid);
  if (plan) db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, id);
  db.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '${sure}'))`).run(hash(tok(ch)), id);
  return id;
}

function setup() {
  const db = freshDb(), log = [];
  const A = kullanici(db, "a@x.co", "basic", "A");
  const B = kullanici(db, "b@x.co", "pro", "B");
  const env = { DB: d1(db, log), ...ENV };
  const io = { rotaAcik: () => true };
  // raw: gövde metni olduğu gibi; cl: content-length (null → başlık yok)
  const call = async (method, path, { token = tok("A"), body, raw, cl } = {}) => {
    const headers = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const text = raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body);
    if (text !== undefined && cl !== null) headers["content-length"] = String(cl ?? Buffer.byteLength(text));
    const req = new Request(`https://forms.test${path}`, { method, headers, body: text });
    const res = await chatbot(req, new URL(req.url), env, APP, {}, io);
    return { status: res.status, body: await res.json() };
  };
  const yeniBot = async (token, ad = "Bot") => {
    const r = await call("POST", "/gen/bot", { token, body: { ad } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.body.bot;
  };
  return { db, env, log, call, yeniBot, A, B };
}

// ---------------------------------------------------------------------------------------------------
test("girişsiz / geçersiz / süresi dolmuş oturum → her uçta 401 login_required", async () => {
  const { db, call, yeniBot } = setup();
  kullanici(db, "c@x.co", "basic", "C", { sure: "-1 days" });
  const b = await yeniBot(tok("A"));
  const uclar = [
    ["GET", "/gen/bot"], ["POST", "/gen/bot", { ad: "X" }],
    ["GET", `/gen/bot/${b.id}`], ["POST", `/gen/bot/${b.id}`, { surum: 1, ad: "X" }],
    ["POST", `/gen/bot/${b.id}/sil`, {}], ["POST", `/gen/bot/${b.id}/anahtar`, {}],
    ["POST", `/gen/bot/${b.id}/test`, { metin: "selam" }],
    ["GET", `/gen/bot/${b.id}/konusmalar`], ["GET", `/gen/bot/${b.id}/leadler`], ["GET", `/gen/bot/${b.id}/istatistik`],
  ];
  for (const token of [null, tok("Z"), tok("C"), "kisa"]) {
    for (const [m, p, body] of uclar) {
      const r = await call(m, p, { token, body });
      assert.equal(r.status, 401, `${m} ${p} token=${String(token).slice(0, 3)}`);
      assert.deepEqual(r.body, { ok: false, error: "login_required" });
    }
  }
  // girişsiz denemeler hiçbir şey değiştirmedi
  const row = db.prepare("SELECT ad, surum FROM chatbots WHERE id = ?").get(b.id);
  assert.equal(row.ad, "Bot"); assert.equal(Number(row.surum), 1);
  assert.equal(Number(db.prepare("SELECT COUNT(*) AS n FROM chatbots").get().n), 1);
});

test("CRUD: oluştur → liste → getir → güncelle → anahtar → sil", async () => {
  const { db, call, yeniBot } = setup();
  const b = await yeniBot(tok("A"), "Destek");
  assert.equal(b.ad, "Destek"); assert.equal(b.surum, 1);

  const l = await call("GET", "/gen/bot");
  assert.equal(l.status, 200);
  assert.deepEqual(l.body.botlar.map(x => x.id), [b.id]);

  const g = await call("GET", `/gen/bot/${b.id}`);
  assert.equal(g.status, 200); assert.equal(g.body.bot.id, b.id); assert.equal(g.body.bot.ad, "Destek");

  const u = await call("POST", `/gen/bot/${b.id}`, { body: { surum: 1, ad: "Destek 2" } });
  assert.equal(u.status, 200, JSON.stringify(u.body));
  assert.equal(u.body.bot.ad, "Destek 2"); assert.equal(u.body.bot.surum, 2);
  const eski = await call("POST", `/gen/bot/${b.id}`, { body: { surum: 1, ad: "Geç kalan" } });
  assert.equal(eski.status, 409); assert.equal(eski.body.error, "cakisma"); assert.equal(eski.body.surum, 2);

  const once = db.prepare("SELECT web_anahtar FROM chatbots WHERE id = ?").get(b.id).web_anahtar;
  const k = await call("POST", `/gen/bot/${b.id}/anahtar`, { body: {} });
  assert.equal(k.status, 200); assert.match(k.body.anahtar, /^wk_/); assert.notEqual(k.body.anahtar, once);

  const s = await call("POST", `/gen/bot/${b.id}/sil`, { body: {} });
  assert.equal(s.status, 200); assert.equal(s.body.ok, true);
  assert.equal((await call("GET", `/gen/bot/${b.id}`)).status, 404);
  assert.equal((await call("POST", `/gen/bot/${b.id}/sil`, { body: {} })).status, 404);
  assert.deepEqual((await call("GET", "/gen/bot")).body.botlar, []);
});

test("IDOR: başka kullanıcının botuna her uç 404, B'nin botu değişmez, yazma sorgusu çalışmaz", async () => {
  const { db, log, call, yeniBot } = setup();
  const bb = await yeniBot(tok("B"), "B botu");
  const ab = await yeniBot(tok("A"), "A botu");
  const anahtar0 = db.prepare("SELECT web_anahtar FROM chatbots WHERE id = ?").get(bb.id).web_anahtar;
  const id = bb.id;
  const uclar = [
    ["GET", `/gen/bot/${id}`], ["POST", `/gen/bot/${id}`, { surum: 1, ad: "Ele geçirildi" }],
    ["POST", `/gen/bot/${id}/sil`, {}], ["POST", `/gen/bot/${id}/anahtar`, {}],
    ["POST", `/gen/bot/${id}/test`, { metin: "merhaba" }],
    ["GET", `/gen/bot/${id}/konusmalar`], ["GET", `/gen/bot/${id}/konusma/1`],
    ["POST", `/gen/bot/${id}/konusma/1/devir`, { devir: true }], ["POST", `/gen/bot/${id}/konusma/1/sil`, {}],
    ["GET", `/gen/bot/${id}/leadler`], ["POST", `/gen/bot/${id}/lead/1`, { durum: "islendi" }],
    ["POST", `/gen/bot/${id}/lead/1/sil`, {}], ["GET", `/gen/bot/${id}/istatistik`],
  ];
  log.length = 0;
  for (const [m, p, body] of uclar) {
    const r = await call(m, p, { body });
    assert.equal(r.status, 404, `${m} ${p} → ${r.status} ${JSON.stringify(r.body)}`);
    assert.equal(r.body.ok, false);
    assert.ok(!JSON.stringify(r.body).includes("B botu"), "B'nin verisi sızmamalı");
  }
  const yazma = log.filter(s => /^\s*(UPDATE|DELETE|INSERT)/i.test(s) && !/sessions|gen_usage/i.test(s));
  // sahiplik denetimi önce yapılmayan tek yazma (anahtar yenile) WHERE'de user_id koşulu taşımalı (0 satır değişir)
  for (const s of yazma) assert.match(s, /\buser_id = \?/, `sahiplik koşulsuz yazma: ${s}`);
  assert.ok(yazma.length <= 1, JSON.stringify(yazma));
  const row = db.prepare("SELECT ad, surum, web_anahtar FROM chatbots WHERE id = ?").get(id);
  assert.equal(row.ad, "B botu"); assert.equal(Number(row.surum), 1); assert.equal(row.web_anahtar, anahtar0);
  // liste yalnız kendi botunu gösterir
  assert.deepEqual((await call("GET", "/gen/bot")).body.botlar.map(x => x.id), [ab.id]);
  assert.deepEqual((await call("GET", "/gen/bot", { token: tok("B") })).body.botlar.map(x => x.id), [bb.id]);
  // B kendi botuna erişebilir
  assert.equal((await call("GET", `/gen/bot/${id}`, { token: tok("B") })).status, 200);
});

test("id biçimi: 0, eksi, harf, çok uzun → 404 not_found (SQL'e gitmeden)", async () => {
  const { call } = setup();
  for (const id of ["0", "-1", "abc", "1e3", "01", "12345678901", "1;DROP"]) {
    const r = await call("GET", `/gen/bot/${encodeURIComponent(id)}`);
    assert.equal(r.status, 404, id); assert.equal(r.body.error, "not_found");
  }
});

test("plan bot sayısı sınırı: demo/basic/pro sınırda 403 bot_limit {limit}; silince yer açılır", async () => {
  for (const plan of ["demo", "basic", "pro"]) {
    const { db, env } = setup();
    const ch = plan[0].toUpperCase() === "B" ? "Q" : plan[0].toUpperCase() === "P" ? "R" : "S";
    kullanici(db, `${plan}@x.co`, plan, ch);
    const call = async (method, path, body) => {
      const text = body === undefined ? undefined : JSON.stringify(body);
      const headers = { authorization: `Bearer ${tok(ch)}`, "content-type": "application/json" };
      if (text) headers["content-length"] = String(Buffer.byteLength(text));
      const req = new Request(`https://forms.test${path}`, { method, headers, body: text });
      const res = await chatbot(req, new URL(req.url), env, APP, {}, { rotaAcik: () => true });
      return { status: res.status, body: await res.json() };
    };
    const lim = BOT_PLANS[plan].bot;
    const ids = [];
    for (let i = 0; i < lim; i++) {
      const r = await call("POST", "/gen/bot", { ad: `${plan}${i}` });
      assert.equal(r.status, 200, `${plan} #${i} ${JSON.stringify(r.body)}`);
      ids.push(r.body.bot.id);
    }
    const fazla = await call("POST", "/gen/bot", { ad: "fazla" });
    assert.equal(fazla.status, 403, plan); assert.equal(fazla.body.error, "bot_limit"); assert.equal(fazla.body.limit, lim);
    assert.equal((await call("GET", "/gen/bot")).body.botlar.length, lim);
    assert.equal((await call("POST", `/gen/bot/${ids[0]}/sil`, {})).status, 200);
    assert.equal((await call("POST", "/gen/bot", { ad: "yeniden" })).status, 200, `${plan} silince yer açılmalı`);
  }
});

test("plan sınırı kullanıcı başına: A'nın dolu kotası B'yi etkilemez", async () => {
  const { call } = setup();
  for (let i = 0; i < BOT_PLANS.basic.bot; i++) assert.equal((await call("POST", "/gen/bot", { body: { ad: "A" + i } })).status, 200);
  assert.equal((await call("POST", "/gen/bot", { body: { ad: "A+" } })).status, 403);
  assert.equal((await call("POST", "/gen/bot", { token: tok("B"), body: { ad: "B0" } })).status, 200);
});

test("413 too_large: content-length yok / sınır üstü / yalan başlık + büyük gövde (bayt sayımı)", async () => {
  const { db, call, yeniBot } = setup();
  const b = await yeniBot(tok("A"));
  const kucuk = JSON.stringify({ ad: "X" });
  // başlık yok
  for (const [p, raw] of [["/gen/bot", kucuk], [`/gen/bot/${b.id}`, JSON.stringify({ surum: 1, ad: "Y" })], [`/gen/bot/${b.id}/sil`, "{}"], [`/gen/bot/${b.id}/anahtar`, "{}"]]) {
    const r = await call("POST", p, { raw, cl: null });
    assert.equal(r.status, 413, `başlıksız ${p}`); assert.equal(r.body.error, "too_large");
  }
  // başlık sınır üstü / sayı değil
  assert.equal((await call("POST", "/gen/bot", { raw: kucuk, cl: BOT_BODY_MAX.olustur + 1 })).status, 413);
  assert.equal((await call("POST", "/gen/bot", { raw: kucuk, cl: "abc" })).status, 413);
  assert.equal((await call("POST", `/gen/bot/${b.id}/sil`, { raw: "{}", cl: BOT_BODY_MAX.kucuk + 1 })).status, 413);
  // tam sınırda kabul
  const tam = JSON.stringify({ ad: "Z", x: "a".repeat(BOT_BODY_MAX.olustur - 20) });
  const pad = tam.slice(0, -2) + "a".repeat(BOT_BODY_MAX.olustur - Buffer.byteLength(tam)) + '"}';
  assert.equal(Buffer.byteLength(pad), BOT_BODY_MAX.olustur);
  assert.notEqual((await call("POST", "/gen/bot", { raw: pad })).status, 413);
  // yalan küçük başlık, gerçek gövde büyük (çok baytlı harf: length < sınır ama bayt > sınır)
  const ğ = JSON.stringify({ ad: "Ğ", x: "ğ".repeat(BOT_BODY_MAX.olustur / 2 + 10) });
  assert.ok(ğ.length < BOT_BODY_MAX.olustur && Buffer.byteLength(ğ) > BOT_BODY_MAX.olustur);
  const r = await call("POST", "/gen/bot", { raw: ğ, cl: 100 });
  assert.equal(r.status, 413); assert.equal(r.body.error, "too_large");
  // güncelleme sınırı
  const buyuk = JSON.stringify({ surum: 1, ai: { bilgi: "x".repeat(BOT_BODY_MAX.guncelle) } });
  assert.equal((await call("POST", `/gen/bot/${b.id}`, { raw: buyuk })).status, 413);
  // hiçbiri yazmadı
  assert.equal(Number(db.prepare("SELECT COUNT(*) AS n FROM chatbots WHERE ad = 'Ğ'").get().n), 0);
  assert.equal(db.prepare("SELECT ad FROM chatbots WHERE id = ?").get(b.id).ad, "Bot");
});

test("400 bad_json: bozuk / dizi / null / dize / sayı gövde", async () => {
  const { call, yeniBot } = setup();
  const b = await yeniBot(tok("A"));
  const yollar = ["/gen/bot", `/gen/bot/${b.id}`, `/gen/bot/${b.id}/sil`, `/gen/bot/${b.id}/anahtar`, `/gen/bot/${b.id}/test`];
  for (const raw of ["{bozuk", "[1,2]", "null", '"metin"', "42", "", "{\"ad\":\"x\""]) {
    for (const p of yollar) {
      const r = await call("POST", p, { raw });
      assert.equal(r.status, 400, `${p} ${JSON.stringify(raw)} → ${r.status}`);
      assert.deepEqual(r.body, { ok: false, error: "bad_json" });
    }
  }
  assert.equal((await call("GET", `/gen/bot/${b.id}`)).body.bot.surum, 1);
});

test("yöntem / kapı: PUT·DELETE 405, rota kapalı 404, chatbotRoute başka yol ve OPTIONS null", async () => {
  const { env, call } = setup();
  assert.equal((await call("PUT", "/gen/bot", { body: {} })).status, 405);
  assert.equal((await call("DELETE", "/gen/bot/1")).status, 405);
  const req = new Request("https://forms.test/gen/bot", { headers: { authorization: `Bearer ${tok("A")}` } });
  const kapali = await chatbot(req, new URL(req.url), env, APP, {}, { rotaAcik: () => false });
  assert.equal(kapali.status, 404);
  for (const p of ["/gen/botlar", "/gen/bo", "/gen/tts", "/"]) assert.equal(await chatbotRoute(new Request(`https://forms.test${p}`), env, {}), null, p);
  assert.equal(await chatbotRoute(new Request("https://forms.test/gen/bot", { method: "OPTIONS" }), env, {}), null);
  // tanınmayan Origin → 403
  const yabanci = await chatbotRoute(new Request("https://forms.test/gen/bot", { headers: { origin: "https://kotu.example", authorization: `Bearer ${tok("A")}` } }), env, {}, { rotaAcik: () => true });
  assert.equal(yabanci.status, 403);
});

// ---------------------------------------------------------------------------------------------------
test("botCleanup: 4 sorgu sırayla, doğru tablolar ve süreler, toplam changes", async () => {
  const kayit = [];
  const env = { DB: { prepare: sql => ({ bind() { throw new Error("bind beklenmez"); }, run: async () => { kayit.push(sql); return { meta: { changes: 3 } }; } }) } };
  assert.equal(await botCleanup(env), 12);
  assert.equal(kayit.length, 4);
  assert.match(kayit[0], /^DELETE FROM bot_messages\b/); assert.match(kayit[0], /-90 days/); assert.match(kayit[0], /LIMIT \d+/);
  assert.match(kayit[1], /^DELETE FROM bot_conversations\b/); assert.match(kayit[1], /updated_at < datetime\('now', '-90 days'\)/); assert.match(kayit[1], /LIMIT \d+/);
  assert.match(kayit[2], /^DELETE FROM bot_leads\b/); assert.match(kayit[2], /-365 days/);
  assert.match(kayit[3], /^DELETE FROM gen_usage\b/); assert.match(kayit[3], /GLOB 'bot:\*'/); assert.match(kayit[3], /-13 months/);
  // gen_usage silmesi yalnız bot: satırlarına dokunur
  for (const s of kayit) assert.ok(!/DELETE FROM (chatbots|users|sessions)\b/.test(s));
});

test("botCleanup: DB yok → 0; tablo yok sessiz; başka hata loglanır ama sonraki sorgular sürer", async () => {
  assert.equal(await botCleanup({}), 0);
  assert.equal(await botCleanup(undefined), 0);
  const kayit = [], loglar = [];
  let n = 0;
  const env = { DB: { prepare: sql => ({ run: async () => {
    kayit.push(sql); n++;
    if (n === 1) throw new Error("D1_ERROR: no such table: bot_messages");
    if (n === 2) throw new Error("D1_ERROR: database is locked");
    return { meta: { changes: 2 } };
  } }) } };
  const eski = console.log;
  console.log = (...a) => loglar.push(a.join(" "));
  try { assert.equal(await botCleanup(env), 4); }
  finally { console.log = eski; }
  assert.equal(kayit.length, 4);
  assert.equal(loglar.length, 1); assert.match(loglar[0], /database is locked/);
});

test("botCleanup: gerçek şemada sorgular geçerli; eski satırlar gider, yeniler kalır", async () => {
  const { db, env, yeniBot } = setup();
  const b = await yeniBot(tok("A"));
  const loglar = [];
  const eski = console.log;
  console.log = (...a) => loglar.push(a.join(" "));
  try { assert.equal(await botCleanup(env), 0); }
  finally { console.log = eski; }
  assert.deepEqual(loglar, [], "şemaya karşı SQL hatası olmamalı");
  // bot satırı temizlikte silinmez
  assert.ok(db.prepare("SELECT id FROM chatbots WHERE id = ?").get(b.id));
});
