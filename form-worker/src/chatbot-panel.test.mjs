// node --test src/chatbot-panel.test.mjs — chatbot.js panel uçları: test sohbeti (§7.4), konuşmalar/devir, leadler, istatistik (§7.3, §7.6, §7.7).
// D1 yerine node:sqlite; ağ yok. Düzen chatbot-crud.test.mjs ile aynı.
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

const { chatbot, botAy, istatGunler, cevapla } = await import("./chatbot.js");

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
    // D1 batch gibi: her ifade için results (RETURNING / SELECT satırları) + meta.changes
    _b: () => { const results = db.prepare(sql).all(...args).map(r => ({ ...r })); const c = Number(db.prepare("SELECT changes() AS c").get().c); return { success: true, results, meta: { changes: c } }; },
  });
  const batch = async ss => {
    db.exec("BEGIN");
    try { const out = []; for (const s of ss) out.push(s._b()); db.exec("COMMIT"); return out; }
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

const NIYET = [{ k: "kargo", ad: "Kargo", ornekler: ["kargom nerede", "kargo takip"], cevap: "Kargonuz 2 günde gelir." }];
async function botKur(s, ek = {}) {
  const b = (await s.call("POST", "/gen/bot", { body: { ad: "Test", sablon: "bos" } })).body.bot;
  const u = await s.call("POST", `/gen/bot/${b.id}`, { body: { surum: b.surum ?? 1, niyetler: NIYET, ...ek } });
  assert.equal(u.status, 200, JSON.stringify(u.body));
  return u.body.bot;
}
const sayi = (db, sql, ...a) => Number(db.prepare(sql).get(...a).n);
function konusmaEkle(db, botId, { kanal = "web", dis = "s_1", devir = 0, okunmadi = 0, son = "" } = {}) {
  return Number(db.prepare("INSERT INTO bot_conversations (bot_id, kanal, dis_id, devir, okunmadi, son_mesaj, mesaj_sayisi) VALUES (?, ?, ?, ?, ?, ?, 0)")
    .run(botId, kanal, dis, devir, okunmadi, son).lastInsertRowid);
}
function mesajEkle(db, kid, botId, rol, metin, kaynak = null, niyet = null) {
  return Number(db.prepare("INSERT INTO bot_messages (konusma_id, bot_id, rol, metin, kaynak, niyet, butonlar) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(kid, botId, rol, metin, kaynak, niyet, rol === "bot" ? JSON.stringify([{ etiket: "A", hedef: "menu" }]) : null).lastInsertRowid);
}
function leadEkle(db, botId, kid, eposta = "x@y.co") {
  return Number(db.prepare("INSERT INTO bot_leads (bot_id, konusma_id, kanal, ad, eposta) VALUES (?, ?, 'web', 'Ali', ?)")
    .run(botId, kid, eposta).lastInsertRowid);
}

test("test sohbeti: hazır eşleşme, geri dönüş, butonlar, kota + bt, DB'ye mesaj yazılmaz", async () => {
  const s = setup();
  const b = await botKur(s);
  const t = (body) => s.call("POST", `/gen/bot/${b.id}/test`, { body });
  const r = await t({ metin: "kargom nerede" });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.cevaplar.length, 1);
  assert.equal(r.body.cevaplar[0].kaynak, "hazir");
  assert.equal(r.body.cevaplar[0].metin, "Kargonuz 2 günde gelir.");
  assert.equal(r.body.eslesme.k, "kargo");
  assert.equal(r.body.devir, false);
  assert.equal(r.body.lead_iste, false);
  assert.equal(r.body.kota.hazir.used, 1);
  assert.equal(r.body.kota.test.used, 1);
  assert.equal("eslesmedi" in r.body, false);

  const g = await t({ metin: "uzay gemisi fiyatı" });
  assert.equal(g.body.cevaplar[0].kaynak, "geri");
  assert.ok(Array.isArray(g.body.cevaplar[0].butonlar));
  assert.equal(g.body.eslesme, null);
  assert.equal(g.body.kota.hazir.used, 1, "geri sayılmaz");
  assert.equal(g.body.kota.test.used, 2);

  const n = await t({ buton: "n:kargo" });
  assert.equal(n.body.cevaplar[0].kaynak, "hazir");
  assert.equal(n.body.eslesme.puan, 1);
  const i = await t({ buton: "insan" });
  assert.equal(i.body.devir, true);
  assert.equal(i.body.cevaplar[0].kaynak, "devir");
  const l = await t({ buton: "lead" });
  assert.equal(l.body.lead_iste, true);
  assert.equal(l.body.cevaplar[0].kaynak, "lead");
  const m = await t({ buton: "menu" });
  assert.equal(m.body.cevaplar[0].kaynak, "menu");

  assert.equal(sayi(s.db, "SELECT COUNT(*) AS n FROM bot_messages"), 0);
  assert.equal(sayi(s.db, "SELECT COUNT(*) AS n FROM bot_conversations"), 0);
  assert.equal(sayi(s.db, "SELECT COUNT(*) AS n FROM bot_leads"), 0);
});

test("test sohbeti: taslak bindirme, doğrulama hataları, sahiplik", async () => {
  const s = setup();
  const b = await botKur(s);
  const t = (body, o) => s.call("POST", `/gen/bot/${b.id}/test`, { body, ...o });
  const d = await t({ metin: "iade nasıl yapılır", taslak: { niyetler: [{ k: "iade", ad: "İade", ornekler: ["iade nasıl yapılır"], cevap: "14 gün." }] } });
  assert.equal(d.status, 200, JSON.stringify(d.body));
  assert.equal(d.body.eslesme?.k, "iade");
  assert.equal(d.body.cevaplar[0].metin, "14 gün.");
  // kayıtlı bot değişmedi
  const k = await t({ metin: "iade nasıl yapılır" });
  assert.equal(k.body.cevaplar[0].kaynak, "geri");

  const iki = await t({ metin: "a", buton: "menu" });
  assert.equal(iki.status, 400); assert.equal(iki.body.error, "invalid");
  assert.equal((await t({})).status, 400);
  assert.equal((await t({ metin: "   " })).body.alan, "metin");
  const gm = await t({ metin: "a", gecmis: Array.from({ length: 11 }, () => ({ rol: "kullanici", metin: "x" })) });
  assert.equal(gm.status, 400); assert.equal(gm.body.alan, "gecmis"); assert.equal(gm.body.neden, "fazla");
  assert.equal((await t({ metin: "a", gecmis: [{ rol: "x", metin: "y" }] })).body.alan, "gecmis.0");
  assert.equal((await t({ metin: "a", taslak: { mod: "uçan" } })).status, 400);
  assert.equal((await t({ metin: "a" }, { token: tok("B") })).status, 404);
  assert.equal((await s.call("POST", "/gen/bot/99999/test", { body: { metin: "a" } })).status, 404);
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/test`)).status, 404);
});

test("test sohbeti: dakikalık hız sınırı → 429 hiz", async () => {
  const s = setup();
  const b = await botKur(s);
  let hiz = null;
  for (let i = 0; i < 45 && !hiz; i++) {
    const r = await s.call("POST", `/gen/bot/${b.id}/test`, { body: { metin: "merhaba" } });
    if (r.status === 429) hiz = r;
  }
  assert.ok(hiz, "429 bekleniyordu");
  assert.equal(hiz.body.error, "hiz");
  assert.equal(hiz.body.retry_after, 60);
});

test("konuşmalar: liste, filtre, ofset, detay okundu, devir, sil", async () => {
  const s = setup();
  const b = await botKur(s), b2 = await botKur(s);
  const k1 = konusmaEkle(s.db, b.id, { dis: "s_1", okunmadi: 3, son: "selam" });
  const k2 = konusmaEkle(s.db, b.id, { kanal: "ig", dis: "123", devir: 1 });
  const kx = konusmaEkle(s.db, b2.id, { dis: "s_x" });
  mesajEkle(s.db, k1, b.id, "kullanici", "selam", "eslesmedi");
  mesajEkle(s.db, k1, b.id, "bot", "Merhaba", "geri");
  const lid = leadEkle(s.db, b.id, k1);

  const l = await s.call("GET", `/gen/bot/${b.id}/konusmalar`);
  assert.equal(l.status, 200, JSON.stringify(l.body));
  assert.equal(l.body.konusmalar.length, 2);
  assert.equal(l.body.devam, null);
  const o1 = l.body.konusmalar.find(x => x.id === k1);
  assert.deepEqual(Object.keys(o1).sort(), ["ad", "created_at", "devir", "dil", "id", "kanal", "lead", "mesaj_sayisi", "okunmadi", "son_mesaj", "updated_at"]);
  assert.equal(o1.lead, true); assert.equal(o1.okunmadi, 3); assert.equal(o1.devir, false);
  assert.equal(l.body.konusmalar.find(x => x.id === k2).lead, false);
  assert.equal("dis_id" in o1, false);
  assert.deepEqual((await s.call("GET", `/gen/bot/${b.id}/konusmalar?filtre=devir`)).body.konusmalar.map(x => x.id), [k2]);
  assert.deepEqual((await s.call("GET", `/gen/bot/${b.id}/konusmalar?filtre=okunmadi`)).body.konusmalar.map(x => x.id), [k1]);
  assert.deepEqual((await s.call("GET", `/gen/bot/${b.id}/konusmalar?kanal=ig`)).body.konusmalar.map(x => x.id), [k2]);
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/konusmalar?kanal=sms`)).body.alan, "kanal");
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/konusmalar?filtre=x`)).body.alan, "filtre");
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/konusmalar?ofset=abc`)).body.alan, "ofset");
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/konusmalar?ofset=1001`)).status, 400);
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/konusmalar?ofset=1`)).body.konusmalar.length, 1);
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/konusmalar`, { token: tok("B") })).status, 404);

  const d = await s.call("GET", `/gen/bot/${b.id}/konusma/${k1}`);
  assert.equal(d.status, 200, JSON.stringify(d.body));
  assert.equal(d.body.konusma.okunmadi, 0);
  assert.deepEqual(d.body.mesajlar.map(m => m.rol), ["kullanici", "bot"]);
  assert.deepEqual(d.body.mesajlar[1].butonlar, [{ etiket: "A", hedef: "menu" }]);
  assert.deepEqual(d.body.mesajlar[0].butonlar, []);
  assert.equal(d.body.lead.id, lid);
  assert.equal(sayi(s.db, "SELECT okunmadi AS n FROM bot_conversations WHERE id = ?", k1), 0);
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/konusma/${kx}`)).status, 404, "başka botun konuşması");
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/konusma/abc`)).status, 404);

  const dv = await s.call("POST", `/gen/bot/${b.id}/konusma/${k1}/devir`, { body: { devir: true } });
  assert.equal(dv.status, 200, JSON.stringify(dv.body));
  assert.equal(dv.body.konusma.devir, true);
  assert.equal(sayi(s.db, "SELECT COUNT(*) AS n FROM bot_messages WHERE konusma_id = ? AND rol = 'sistem' AND metin = 'devir_acildi'", k1), 1);
  await s.call("POST", `/gen/bot/${b.id}/konusma/${k1}/devir`, { body: { devir: true } });
  assert.equal(sayi(s.db, "SELECT COUNT(*) AS n FROM bot_messages WHERE konusma_id = ? AND rol = 'sistem'", k1), 1, "değişmeyince yeni olay yok");
  const kp = await s.call("POST", `/gen/bot/${b.id}/konusma/${k1}/devir`, { body: { devir: false } });
  assert.equal(kp.body.konusma.devir, false);
  assert.equal(sayi(s.db, "SELECT COUNT(*) AS n FROM bot_messages WHERE konusma_id = ? AND kaynak = 'devir_kapandi'", k1), 1);
  assert.equal((await s.call("POST", `/gen/bot/${b.id}/konusma/${k1}/devir`, { body: { devir: "evet" } })).body.alan, "devir");

  const sl = await s.call("POST", `/gen/bot/${b.id}/konusma/${k1}/sil`, { body: {} });
  assert.equal(sl.status, 200);
  assert.equal(sayi(s.db, "SELECT COUNT(*) AS n FROM bot_conversations WHERE id = ?", k1), 0);
  assert.equal(sayi(s.db, "SELECT COUNT(*) AS n FROM bot_messages WHERE konusma_id = ?", k1), 0);
  assert.equal(s.db.prepare("SELECT konusma_id FROM bot_leads WHERE id = ?").get(lid).konusma_id, null);
  assert.equal((await s.call("POST", `/gen/bot/${b.id}/konusma/${k1}/sil`, { body: {} })).status, 404);
});

test("konuşmalar: 50'den fazla → devam", async () => {
  const s = setup();
  const b = await botKur(s);
  for (let i = 0; i < 53; i++) konusmaEkle(s.db, b.id, { dis: "s_" + i });
  const a = await s.call("GET", `/gen/bot/${b.id}/konusmalar`);
  assert.equal(a.body.konusmalar.length, 50); assert.equal(a.body.devam, 50);
  const c = await s.call("GET", `/gen/bot/${b.id}/konusmalar?ofset=50`);
  assert.equal(c.body.konusmalar.length, 3); assert.equal(c.body.devam, null);
});

test("leadler: liste, toplam, durum filtresi, durum güncelle, sil", async () => {
  const s = setup();
  const b = await botKur(s);
  const k = konusmaEkle(s.db, b.id);
  const l1 = leadEkle(s.db, b.id, k, "a@b.co"), l2 = leadEkle(s.db, b.id, null, "c@d.co");
  const r = await s.call("GET", `/gen/bot/${b.id}/leadler`);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.toplam, 2); assert.equal(r.body.devam, null);
  assert.deepEqual(r.body.leadler.map(x => x.id), [l2, l1]);
  assert.deepEqual(Object.keys(r.body.leadler[0]).sort(), ["ad", "created_at", "durum", "eposta", "id", "kanal", "konusma_id", "notu", "telefon"]);
  assert.equal(r.body.leadler[0].konusma_id, null); assert.equal(r.body.leadler[1].konusma_id, k);
  const u = await s.call("POST", `/gen/bot/${b.id}/lead/${l1}`, { body: { durum: "islendi" } });
  assert.equal(u.status, 200); assert.equal(u.body.lead.durum, "islendi");
  const f = await s.call("GET", `/gen/bot/${b.id}/leadler?durum=yeni`);
  assert.equal(f.body.toplam, 1); assert.deepEqual(f.body.leadler.map(x => x.id), [l2]);
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/leadler?durum=x`)).body.alan, "durum");
  assert.equal((await s.call("POST", `/gen/bot/${b.id}/lead/${l1}`, { body: { durum: "bitti" } })).status, 400);
  assert.equal((await s.call("POST", `/gen/bot/${b.id}/lead/${l1}`, { body: { durum: "yeni" }, token: tok("B") })).status, 404);
  assert.equal((await s.call("POST", `/gen/bot/${b.id}/lead/99999`, { body: { durum: "yeni" } })).status, 404);
  assert.equal((await s.call("POST", `/gen/bot/${b.id}/lead/${l2}/sil`, { body: {} })).status, 200);
  assert.equal((await s.call("POST", `/gen/bot/${b.id}/lead/${l2}/sil`, { body: {} })).status, 404);
  assert.equal(sayi(s.db, "SELECT COUNT(*) AS n FROM bot_leads"), 1);
});

test("istatistik: günlük dizi, toplamlar, oran, niyetler, eşleşmeyen, gun doğrulama", async () => {
  const s = setup();
  const b = await botKur(s);
  const k = konusmaEkle(s.db, b.id);
  mesajEkle(s.db, k, b.id, "kullanici", "kargom nerede", null);
  mesajEkle(s.db, k, b.id, "bot", "Kargo…", "hazir", "kargo");
  mesajEkle(s.db, k, b.id, "kullanici", "kargo takip", null);
  mesajEkle(s.db, k, b.id, "bot", "Kargo…", "hazir", "kargo");
  mesajEkle(s.db, k, b.id, "kullanici", "x".repeat(300), "eslesmedi");
  mesajEkle(s.db, k, b.id, "bot", "Anlamadım", "geri");
  mesajEkle(s.db, k, b.id, "sistem", "devir_acildi", "devir_acildi");
  leadEkle(s.db, b.id, k);
  // aralık dışı (eski) kayıt sayılmaz
  s.db.prepare("INSERT INTO bot_messages (konusma_id, bot_id, rol, metin, kaynak, created_at) VALUES (?, ?, 'kullanici', 'eski', 'eslesmedi', datetime('now', '-60 days'))").run(k, b.id);

  const r = await s.call("GET", `/gen/bot/${b.id}/istatistik?gun=7`);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.gun, 7);
  assert.equal(r.body.gunluk.length, 7);
  const son = r.body.gunluk.at(-1);
  assert.deepEqual(son, { gun: son.gun, gelen: 3, hazir: 2, ai: 0, geri: 1, lead: 1 });
  assert.ok(r.body.gunluk.slice(0, 6).every(g => g.gelen === 0 && g.lead === 0));
  assert.ok(r.body.gunluk[0].gun < son.gun);
  assert.deepEqual(r.body.toplam, { konusma: 1, gelen: 3, hazir: 2, ai: 0, geri: 1, kota: 0, devir: 1, lead: 1, eslesme_orani: 0.667 });
  assert.deepEqual(r.body.niyetler, [{ k: "kargo", ad: "Kargo", n: 2 }]);
  assert.equal(r.body.eslesmeyen.length, 1);
  assert.equal(r.body.eslesmeyen[0].metin.length, 200);
  assert.ok(r.body.kota && r.body.kota.ai);
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/istatistik`)).body.gun, 30);
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/istatistik?gun=90`)).body.gunluk.length, 90);
  const g5 = await s.call("GET", `/gen/bot/${b.id}/istatistik?gun=5`);
  assert.equal(g5.status, 400); assert.equal(g5.body.alan, "gun");
  assert.equal((await s.call("GET", `/gen/bot/${b.id}/istatistik`, { token: tok("B") })).status, 404);
});

test("istatGunler: UTC+3 gün sınırı ve alt zaman", () => {
  const now = Date.parse("2026-11-27T22:30:00Z"); // UTC+3 → 28 Kasım 01:30
  const { gunler, alt } = istatGunler(now, 7);
  assert.equal(gunler.length, 7);
  assert.equal(gunler.at(-1), "2026-11-28");
  assert.equal(gunler[0], "2026-11-22");
  assert.equal(alt, "2026-11-21 21:00:00");
});

test("yol: bilinmeyen alt yollar → 404 not_found", async () => {
  const s = setup();
  const b = await botKur(s);
  for (const p of ["konusma", "konusma/1/x/y", "lead/abc", "istatistikler", "konusma/0"])
    assert.equal((await s.call("GET", `/gen/bot/${b.id}/${p}`)).status, 404, p);
  assert.equal((await s.call("POST", `/gen/bot/${b.id}/konusmalar`, { body: {} })).status, 404);
});
