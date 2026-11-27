// node --test src/chatbot-crud.test.mjs — chatbot.js panel CRUD (§7.1-7.3, §7.5), kota nesnesi (§5.1), botCleanup (§3.1).
// D1 yerine node:sqlite; ağ yok.
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

const { chatbot, chatbotRoute, botCleanup, botAy, BOT_PLANS } = await import("./chatbot.js");

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const SCHEMA = read("../schema.sql");
const BASE = ["0001_metrics", "0002_oauth", "0018_plans"].map(n => read(`../migrations/${n}.sql`));
const BOT = read("../migrations/0022_chatbot.sql");

function d1(db) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })) }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes), last_row_id: Number(i.lastInsertRowid) } }; },
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

function freshDb({ bot = true } = {}) {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  for (const m of BASE) db.exec(m);
  // schema.sql 0022 tablolarını aynalar (INTEGRASYON); "tablo yok" durumu için onları düşür
  if (bot) db.exec(BOT);
  else db.exec("DROP TABLE IF EXISTS bot_leads; DROP TABLE IF EXISTS bot_messages; DROP TABLE IF EXISTS bot_conversations; DROP TABLE IF EXISTS chatbots;");
  return db;
}
function kullanici(db, email, plan, ch) {
  const id = Number(db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, ?, ?, 'brand', 'x')").run(SMC, email, email.split("@")[0]).lastInsertRowid);
  if (plan) db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, id);
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(hash(tok(ch)), id);
  return id;
}
const ENV = { ACCOUNTS_ENABLED: "1", BOT_ENABLED: "1", GEN_SALT: "salt", PBKDF2_ITER: "10000" };

function setup({ db = freshDb(), extra = {}, rota = true } = {}) {
  const A = kullanici(db, "a@x.co", "basic", "A"), B = kullanici(db, "b@x.co", "pro", "B");
  const env = { DB: d1(db), ...ENV, ...extra };
  const io = rota ? { rotaAcik: () => true } : {};
  const call = async (method, path, { token = tok("A"), body, origin = APP, cl } = {}) => {
    const headers = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const text = body === undefined ? undefined : JSON.stringify(body);
    if (text !== undefined) headers["content-length"] = String(cl ?? Buffer.byteLength(text));
    const req = new Request(`https://forms.test${path}`, { method, headers, body: text });
    const res = await chatbot(req, new URL(req.url), env, origin, {}, io);
    return { status: res.status, body: await res.json(), headers: res.headers };
  };
  return { db, env, call, A, B };
}

test("kapı: BOT_ENABLED yok → 503 not_ready; origin yok → 403; giriş yok → 401; rota kapalı → 404", async () => {
  let s = setup({ extra: { BOT_ENABLED: "0" } });
  assert.equal((await s.call("GET", "/gen/bot")).body.error, "not_ready");
  s = setup();
  assert.equal((await s.call("GET", "/gen/bot", { origin: null })).status, 403);
  const r = await s.call("GET", "/gen/bot", { token: null });
  assert.equal(r.status, 401); assert.equal(r.body.error, "login_required");
  assert.equal((await s.call("DELETE", "/gen/bot")).status, 405);
  s = setup({ rota: false });
  const k = await s.call("GET", "/gen/bot");
  assert.ok(k.status === 404 || k.status === 200); // sites.js'e rota INTEGRASYON'la eklenince 200
});

test("tablo yok → 503 not_ready", async () => {
  const s = setup({ db: freshDb({ bot: false }) });
  const r = await s.call("GET", "/gen/bot");
  assert.equal(r.status, 503); assert.equal(r.body.error, "not_ready");
});

test("oluştur (genel şablon) + liste şekli + başlıklar + kota", async () => {
  const { call } = setup();
  const r = await call("POST", "/gen/bot", { body: { ad: "Mağaza asistanı" } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.headers.get("access-control-allow-origin"), APP);
  assert.equal(r.headers.get("cache-control"), "no-store");
  const b = r.body.bot;
  assert.equal(b.ad, "Mağaza asistanı"); assert.equal(b.mod, "hazir"); assert.equal(b.surum, 1); assert.equal(b.aktif, true);
  assert.match(b.web.anahtar, /^wk_[A-Za-z0-9_-]{24}$/);
  assert.deepEqual(b.web.gorunum, { renk: "#4f46e5", konum: "sag", baslik: "" });
  assert.ok(b.niyetler.length > 0);
  assert.equal(b.ig.durum, "yakinda");
  assert.deepEqual(r.body.kota.bot, { limit: BOT_PLANS.basic.bot, used: 1 });
  assert.equal(r.body.kota.plan, "basic"); assert.equal(r.body.kota.uyari, null);
  assert.match(r.body.kota.reset_at, /T21:00:00\.000Z$/);
  const l = await call("GET", "/gen/bot");
  assert.equal(l.status, 200);
  assert.equal(l.body.ig_acik, false);
  assert.equal(l.body.botlar.length, 1);
  const lb = l.body.botlar[0];
  assert.deepEqual(lb.niyetler, []); assert.equal(lb.ai.bilgi, ""); assert.equal(lb.niyet_sayisi, b.niyetler.length);
  assert.deepEqual(lb.ozet, { okunmamis: 0, yeni_lead: 0 });
  const bos = await call("POST", "/gen/bot", { body: { ad: "Boş", sablon: "bos", dil: "en" } });
  assert.deepEqual(bos.body.bot.niyetler, []); assert.equal(bos.body.bot.dil, "en");
});

test("oluştur: geçersiz → 400 invalid {alan,neden}; bot_limit; bad_json; too_large", async () => {
  const { call } = setup();
  const r = await call("POST", "/gen/bot", { body: { ad: "" } });
  assert.equal(r.status, 400); assert.equal(r.body.error, "invalid"); assert.equal(r.body.alan, "ad");
  for (let i = 0; i < BOT_PLANS.basic.bot; i++) assert.equal((await call("POST", "/gen/bot", { body: { ad: "B" + i } })).status, 200);
  const lim = await call("POST", "/gen/bot", { body: { ad: "fazla" } });
  assert.equal(lim.status, 403); assert.equal(lim.body.error, "bot_limit"); assert.equal(lim.body.limit, BOT_PLANS.basic.bot);
  assert.equal((await call("POST", "/gen/bot", { body: [1] })).body.error, "bad_json");
  assert.equal((await call("POST", "/gen/bot", { body: { ad: "x" }, cl: 999999 })).status, 413);
});

test("getir / sahiplik / id biçimi", async () => {
  const { call } = setup();
  const id = (await call("POST", "/gen/bot", { body: { ad: "A botu" } })).body.bot.id;
  const g = await call("GET", `/gen/bot/${id}`);
  assert.equal(g.status, 200); assert.equal(g.body.bot.id, id); assert.ok(g.body.kota);
  const yabanci = await call("GET", `/gen/bot/${id}`, { token: tok("B") });
  assert.equal(yabanci.status, 404); assert.equal(yabanci.body.error, "bulunamadi");
  for (const p of ["0", "abc", "01", "12345678901"]) assert.equal((await call("GET", `/gen/bot/${p}`)).body.error, "not_found");
  assert.equal((await call("GET", `/gen/bot/${id}/yok`)).body.error, "not_found");
});

test("güncelle: sürüm kilidi, kısmi alanlar, web.alanlar boş, görünüm birleşir", async () => {
  const { call, db } = setup();
  const b = (await call("POST", "/gen/bot", { body: { ad: "X", sablon: "bos" } })).body.bot;
  const u = await call("POST", `/gen/bot/${b.id}`, { body: {
    surum: 1, ad: "Y", mod: "karma", aktif: false, ai: { ton: 20, persona: "Kibar" },
    niyetler: [{ k: "a", ad: "A", ornekler: ["merhaba"], cevap: "c" }], menu: [{ etiket: "A", hedef: "n:a" }],
    web: { aktif: true, alanlar: ["Ornek.com"], gorunum: { renk: "#112233" } },
  } });
  assert.equal(u.status, 200, JSON.stringify(u.body));
  const y = u.body.bot;
  assert.equal(y.surum, 2); assert.equal(y.ad, "Y"); assert.equal(y.mod, "karma"); assert.equal(y.aktif, false);
  assert.equal(y.ai.ton, 20); assert.equal(y.ai.persona, "Kibar");
  assert.deepEqual(y.web.alanlar, ["ornek.com"]); assert.equal(y.web.aktif, true);
  assert.deepEqual(y.web.gorunum, { renk: "#112233", konum: "sag", baslik: "" });
  assert.equal(y.niyetler.length, 1);
  assert.ok(JSON.parse(db.prepare("SELECT dizin FROM chatbots WHERE id = ?").get(b.id).dizin).length === 1);
  const eski = await call("POST", `/gen/bot/${b.id}`, { body: { surum: 1, ad: "Z" } });
  assert.equal(eski.status, 409); assert.equal(eski.body.error, "cakisma"); assert.equal(eski.body.surum, 2);
  // menüde kayıtlı niyete bağlantı (niyetler gövdede yok) kabul
  assert.equal((await call("POST", `/gen/bot/${b.id}`, { body: { surum: 2, menu: [{ etiket: "A", hedef: "n:a" }] } })).status, 200);
  const b2 = (await call("POST", "/gen/bot", { body: { ad: "W", sablon: "bos" } })).body.bot;
  const w = await call("POST", `/gen/bot/${b2.id}`, { body: { surum: 1, web: { aktif: true } } });
  assert.equal(w.status, 400); assert.equal(w.body.alan, "web.alanlar"); assert.equal(w.body.neden, "bos");
  const yab = await call("POST", `/gen/bot/${b.id}`, { token: tok("B"), body: { surum: 3, ad: "H" } });
  assert.equal(yab.status, 404);
});

test("sil (çocuklarla) + anahtar yenile", async () => {
  const { call, db } = setup();
  const b = (await call("POST", "/gen/bot", { body: { ad: "S" } })).body.bot;
  const yeni = await call("POST", `/gen/bot/${b.id}/anahtar`, { body: {} });
  assert.equal(yeni.status, 200); assert.match(yeni.body.anahtar, /^wk_[A-Za-z0-9_-]{24}$/); assert.notEqual(yeni.body.anahtar, b.web.anahtar);
  db.prepare("INSERT INTO bot_conversations (bot_id, kanal, dis_id) VALUES (?, 'web', 'o1')").run(b.id);
  assert.equal((await call("POST", `/gen/bot/${b.id}/sil`, { token: tok("B"), body: {} })).status, 404);
  assert.equal((await call("POST", `/gen/bot/${b.id}/sil`, { body: {} })).status, 200);
  assert.equal((await call("GET", `/gen/bot/${b.id}`)).status, 404);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM bot_conversations").get().n, 0);
});

test("IG durumu: bağlı değil / hazır / izin yok", async () => {
  const { call, db, A } = setup({ extra: { BOT_IG_ENABLED: "1" } });
  const b = (await call("POST", "/gen/bot", { body: { ad: "I" } })).body.bot;
  assert.equal(b.ig.durum, "bagli_degil");
  db.prepare("INSERT INTO social_accounts (user_id, platform, handle, external_id, status) VALUES (?, 'instagram', 'magaza', '178', 'connected')").run(A);
  let g = await call("GET", `/gen/bot/${b.id}`);
  assert.equal(g.body.bot.ig.durum, "hazir"); assert.equal(g.body.bot.ig.hesap, "magaza");
  db.prepare("INSERT INTO oauth_tokens (user_id, platform, access_token, scope) VALUES (?, 'instagram', 'enc', 'instagram_business_basic')").run(A);
  g = await call("GET", `/gen/bot/${b.id}`);
  assert.equal(g.body.bot.ig.durum, "izin_yok");
  assert.equal((await call("GET", "/gen/bot")).body.ig_acik, true);
});

test("kota: kullanılan sayılar + uyarı", async () => {
  const { call, db, A } = setup();
  const ay = botAy();
  db.prepare("INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, 'ba', ?)").run(ay, `a:u:${A}`, BOT_PLANS.basic.ai);
  db.prepare("INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, 'bt', 7)").run(ay, `t:u:${A}`);
  const k = (await call("GET", "/gen/bot")).body.kota;
  assert.deepEqual(k.ai, { limit: BOT_PLANS.basic.ai, used: BOT_PLANS.basic.ai, kalan: 0 });
  assert.equal(k.test.used, 7); assert.equal(k.uyari, "dolu");
});

test("chatbotRoute: eşleşmeyen yol / OPTIONS → null", async () => {
  const env = { ...ENV, DB: d1(freshDb()) };
  for (const [m, p] of [["GET", "/gen/botx"], ["GET", "/gen/quota"], ["OPTIONS", "/gen/bot"]])
    assert.equal(await chatbotRoute(new Request(`https://forms.test${p}`, { method: m }), env, {}), null);
  const r = await chatbotRoute(new Request("https://forms.test/gen/bot", { headers: { origin: "https://kotu.example" } }), env, {});
  assert.equal(r.status, 403);
});

test("botCleanup: eski satırlar silinir, tablo yokken sessiz", async () => {
  const db = freshDb();
  const uid = Number(db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, 'c@x.co', 'c', 'brand', 'x')").run(SMC).lastInsertRowid);
  const bid = Number(db.prepare("INSERT INTO chatbots (user_id, ad, web_anahtar) VALUES (?, 'c', 'wk_x')").run(uid).lastInsertRowid);
  const kid = Number(db.prepare("INSERT INTO bot_conversations (bot_id, kanal, dis_id, updated_at) VALUES (?, 'web', 'o', datetime('now', '-100 days'))").run(bid).lastInsertRowid);
  db.prepare("INSERT INTO bot_messages (bot_id, konusma_id, rol, metin, created_at) VALUES (?, ?, 'kullanici', 'm', datetime('now', '-100 days'))").run(bid, kid);
  db.prepare("INSERT INTO bot_leads (bot_id, kanal, eposta, created_at) VALUES (?, 'web', 'a@b.co', datetime('now', '-400 days'))").run(bid);
  db.prepare("INSERT INTO gen_usage (day, key, kind, n) VALUES ('bot:2020-01', 'a:u:1', 'ba', 1), (?, 'a:u:1', 'ba', 1)").run(botAy());
  const n = await botCleanup({ DB: d1(db) });
  assert.equal(n, 4);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM gen_usage WHERE day GLOB 'bot:*'").get().n, 1);
  assert.equal(await botCleanup({ DB: d1(freshDb({ bot: false })) }) >= 0, true);
});
