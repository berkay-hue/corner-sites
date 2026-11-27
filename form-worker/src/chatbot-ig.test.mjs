// node --test src/chatbot-ig.test.mjs — chatbot-ig.js (§8): webhook imzası, hub doğrulama, olay süzme (echo/tekrar),
// 24 saat penceresi, quick_reply kırpma, Graph gönderim gövdesi (sahte fetch) ve §8.1 kanal ucu. D1 yerine node:sqlite; ağ yok.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";
import { createHash, createHmac } from "node:crypto";

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "cloudflare:sockets") return { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true };
    if (spec === "cloudflare:email") return { url: "data:text/javascript,export class EmailMessage{}", shortCircuit: true };
    return next(spec, ctx);
  },
});
globalThis.fetch = async () => { throw new Error("gerçek ağ çağrısı yasak"); };

const ig = await import("./chatbot-ig.js");
const { chatbot, chatbotRoute } = await import("./chatbot.js");
const { encrypt } = await import("./oauth.js");
const { keyOf, genDay } = await import("./generate.js");

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
    _b: () => {
      const results = db.prepare(sql).all(...args).map(r => ({ ...r }));
      const c = Number(db.prepare("SELECT changes() AS c").get().c);
      const last = Number(db.prepare("SELECT last_insert_rowid() AS r").get().r);
      return { success: true, results, meta: { changes: c, last_row_id: last } };
    },
  });
  const batch = async ss => {
    db.exec("BEGIN");
    try { const out = []; for (const s of ss) out.push(s._b()); db.exec("COMMIT"); return out; }
    catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  return { prepare: sql => stmt(sql), batch };
}

const APP = "https://app.socialmediacorner.co", SMC = "app.socialmediacorner.co";
const NOW = Date.UTC(2026, 10, 27, 9, 0, 0);
const IGID = "17841400000000001", IGSID = "990011223344";
const SECRET = "test-app-secret", VTOKEN = "test-verify-token", ERISIM = "IGAA-sahte-erisim";
const hash = t => createHash("sha256").update(t).digest("hex");
const tok = ch => ch.repeat(43);
const imza = (body, secret = SECRET) => "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
const ENV = {
  ACCOUNTS_ENABLED: "1", BOT_ENABLED: "1", BOT_IG_ENABLED: "1", GEN_SALT: "salt", PBKDF2_ITER: "10000",
  OAUTH_TOKEN_KEY: Buffer.alloc(32, 7).toString("base64url"), BOT_IG_APP_SECRET: SECRET, BOT_IG_VERIFY_TOKEN: VTOKEN,
};

function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  for (const m of BASE) db.exec(m);
  db.exec(BOT);
  return db;
}
function kullanici(db, email, plan, ch) {
  const id = Number(db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, ?, ?, 'brand', 'x')").run(SMC, email, email.split("@")[0]).lastInsertRowid);
  if (plan) db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, id);
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(hash(tok(ch)), id);
  return id;
}

const NIYET = [{ k: "kargo", ad: "Kargo", ornekler: ["kargom nerede", "kargo takip"], cevap: "Kargonuz 2 günde gelir." }];

async function setup({ extra = {}, bagla = true, scope = "instagram_business_basic,instagram_business_manage_messages" } = {}) {
  const db = freshDb();
  const A = kullanici(db, "a@x.co", "basic", "A");
  const env = { DB: d1(db), ...ENV, ...extra };
  const s = { db, env, A, gonderim: [], abone: [], bekle: [] };
  s.igYanit = () => new Response(JSON.stringify({ recipient_id: IGSID, message_id: "m_ok" }), { status: 200 });
  s.aboneYanit = () => new Response(JSON.stringify({ success: true }), { status: 200 });
  s.fetch = async (url, init) => {
    if (url.startsWith(`${ig.IG_API}/me/subscribed_apps`)) { s.abone.push({ url, init }); return s.aboneYanit(); }
    if (url.startsWith(`${ig.IG_API}/`) && url.endsWith("/messages")) {
      s.gonderim.push({ url, headers: init.headers, govde: JSON.parse(init.body) });
      return s.igYanit(s.gonderim.length);
    }
    throw new Error("beklenmeyen fetch " + url);
  };
  s.call = async (method, path, { body } = {}) => {
    const headers = { "content-type": "application/json", authorization: `Bearer ${tok("A")}` };
    const text = body === undefined ? undefined : JSON.stringify(body);
    if (text !== undefined) headers["content-length"] = String(Buffer.byteLength(text));
    const req = new Request(`https://forms.test${path}`, { method, headers, body: text });
    const res = await chatbot(req, new URL(req.url), env, APP, {}, { rotaAcik: () => true, now: NOW, fetch: s.fetch });
    return { status: res.status, body: await res.json() };
  };
  // webhook POST; ctx.waitUntil vaatleri s.bekle'ye
  s.hook = async (govde, { sig, raw, len, via = "chatbot", now = NOW } = {}) => {
    const text = raw !== undefined ? raw : JSON.stringify(govde);
    const headers = { "content-type": "application/json" };
    if (len !== null) headers["content-length"] = len ?? String(Buffer.byteLength(text));
    if (sig !== null) headers["x-hub-signature-256"] = sig ?? imza(text);
    const req = new Request("https://forms.test/bot/ig/webhook", { method: "POST", headers, body: text });
    const ctx = { waitUntil: p => s.bekle.push(p) };
    const io = { now, fetch: s.fetch };
    const res = via === "route" ? await chatbotRoute(req, env, ctx, io) : await chatbot(req, new URL(req.url), env, null, ctx, io);
    const out = { status: res.status, text: await res.text() };
    out.ozet = (await Promise.all(s.bekle.splice(0))).flat();
    return out;
  };
  s.mesajlar = () => db.prepare("SELECT rol, metin, kaynak, dis_mid, hata FROM bot_messages ORDER BY id").all().map(r => ({ ...r }));
  if (bagla) {
    db.prepare("INSERT INTO social_accounts (user_id, platform, handle, external_id, status) VALUES (?, 'instagram', 'ornekmarka', ?, 'connected')").run(A, IGID);
    db.prepare("INSERT INTO oauth_tokens (user_id, platform, access_token, scope) VALUES (?, 'instagram', ?, ?)").run(A, await encrypt(env, ERISIM), scope);
  }
  return s;
}

async function botKur(s, { igAktif = true } = {}) {
  const b = (await s.call("POST", "/gen/bot", { body: { ad: "Test", sablon: "bos" } })).body.bot;
  const u = await s.call("POST", `/gen/bot/${b.id}`, { body: { surum: b.surum ?? 1, niyetler: NIYET } });
  assert.equal(u.status, 200, JSON.stringify(u.body));
  s.db.prepare("UPDATE chatbots SET aktif = 1 WHERE id = ?").run(b.id);
  if (igAktif) s.db.prepare("UPDATE chatbots SET ig_aktif = 1, ig_hesap = ? WHERE id = ?").run(IGID, b.id);
  return b.id;
}

const olay = (ev, entryId = IGID) => ({ object: "instagram", entry: [{ id: entryId, time: NOW, messaging: [ev] }] });
const metinOlay = (text, mid = "mid.1", ts = NOW - 1000) => ({ sender: { id: IGSID }, recipient: { id: IGID }, timestamp: ts, message: { mid, text } });

// ---------- imza ----------
test("igImzaDogru: geçerli / geçersiz / eksik / bozuk / secret yok", async () => {
  const body = '{"object":"instagram","entry":[]}';
  const buf = new TextEncoder().encode(body);
  assert.equal(await ig.igImzaDogru(SECRET, buf, imza(body)), true);
  assert.equal(await ig.igImzaDogru(SECRET, buf, imza(body).toUpperCase().replace("SHA256=", "sha256=")), true, "büyük harf hex kabul");
  assert.equal(await ig.igImzaDogru(SECRET, buf, imza(body, "baska")), false);
  assert.equal(await ig.igImzaDogru(SECRET, new TextEncoder().encode(body + " "), imza(body)), false, "gövde değişti");
  assert.equal(await ig.igImzaDogru(SECRET, buf, null), false);
  assert.equal(await ig.igImzaDogru(SECRET, buf, "sha1=" + "a".repeat(40)), false);
  assert.equal(await ig.igImzaDogru(SECRET, buf, "sha256=" + "z".repeat(64)), false);
  assert.equal(await ig.igImzaDogru("", buf, imza(body, "")), false, "secret yoksa reddet");
});

test("sabitEsit", async () => {
  assert.equal(await ig.sabitEsit("abc", "abc"), true);
  assert.equal(await ig.sabitEsit("abc", "abd"), false);
  assert.equal(await ig.sabitEsit("abc", "abcd"), false);
  assert.equal(await ig.sabitEsit("", ""), true);
});

test("webhook POST: imza eksik/geçersiz 401, secret yok 401, geçerli 200 EVENT_RECEIVED", async () => {
  const s = await setup();
  await botKur(s);
  const g = olay(metinOlay("kargom nerede"));
  assert.equal((await s.hook(g, { sig: null })).status, 401);
  assert.equal((await s.hook(g, { sig: imza(JSON.stringify(g), "yanlis") })).status, 401);
  assert.equal((await s.hook(g, { sig: "sha256=kisa" })).status, 401);
  assert.equal(s.gonderim.length, 0);
  assert.equal(s.mesajlar().length, 0, "imzasız olay işlenmez");
  const ok = await s.hook(g);
  assert.equal(ok.status, 200);
  assert.equal(ok.text, "EVENT_RECEIVED");
  assert.equal(s.gonderim.length, 1);

  const s2 = await setup({ extra: { BOT_IG_APP_SECRET: undefined } });
  assert.equal((await s2.hook(g)).status, 401, "secret yok → imza doğrulanamaz");
  const s3 = await setup({ extra: { BOT_IG_APP_SECRET: undefined, INSTAGRAM_CLIENT_SECRET: SECRET } });
  assert.equal((await s3.hook(olay({ sender: { id: IGSID }, message: { mid: "x", is_echo: true } }))).status, 200, "INSTAGRAM_CLIENT_SECRET yedeği");
});

test("webhook POST: content-length yok / büyük → 413; GET/POST dışı 405", async () => {
  const s = await setup();
  const g = olay(metinOlay("selam"));
  assert.equal((await s.hook(g, { len: null })).status, 413);
  assert.equal((await s.hook(g, { len: String(262145) })).status, 413);
  const req = new Request("https://forms.test/bot/ig/webhook", { method: "PUT" });
  assert.equal((await chatbot(req, new URL(req.url), s.env, null, {}, {})).status, 405);
});

test("webhook POST: BOT_IG_ENABLED kapalı → 200 ama işlem yok", async () => {
  const s = await setup({ extra: { BOT_IG_ENABLED: "0" } });
  await botKur(s);
  const r = await s.hook(olay(metinOlay("kargom nerede")));
  assert.equal(r.status, 200);
  assert.equal(r.text, "EVENT_RECEIVED");
  assert.equal(s.gonderim.length, 0);
  assert.equal(s.mesajlar().length, 0);
});

// ---------- hub doğrulama ----------
test("webhook GET: verify token", async () => {
  const s = await setup();
  const get = async (q, env = s.env, via = "chatbot") => {
    const req = new Request(`https://forms.test/bot/ig/webhook?${q}`);
    const res = via === "route" ? await chatbotRoute(req, env, {}, {}) : await chatbot(req, new URL(req.url), env, null, {}, {});
    return { status: res.status, text: await res.text(), ct: res.headers.get("content-type") };
  };
  const ok = await get(`hub.mode=subscribe&hub.verify_token=${VTOKEN}&hub.challenge=1158201444`);
  assert.equal(ok.status, 200);
  assert.equal(ok.text, "1158201444");
  assert.match(ok.ct, /^text\/plain/);
  assert.equal((await get(`hub.mode=subscribe&hub.verify_token=${VTOKEN}&hub.challenge=abc`, s.env, "route")).text, "abc", "chatbotRoute da yönlendirir");
  assert.deepEqual(await get(`hub.mode=subscribe&hub.verify_token=yanlis&hub.challenge=1`), { status: 403, text: "", ct: "text/plain; charset=utf-8" });
  assert.equal((await get(`hub.mode=unsubscribe&hub.verify_token=${VTOKEN}&hub.challenge=1`)).status, 403);
  assert.equal((await get(`hub.mode=subscribe&hub.verify_token=${VTOKEN}&hub.challenge=<script>`)).status, 403, "challenge biçimi");
  assert.equal((await get(`hub.mode=subscribe&hub.verify_token=${VTOKEN}`)).status, 403);
  assert.equal((await get(`hub.mode=subscribe&hub.verify_token=&hub.challenge=1`, { ...s.env, BOT_IG_VERIFY_TOKEN: undefined })).status, 403, "secret yok → 403");
  assert.equal((await get(`hub.mode=subscribe&hub.verify_token=alt&hub.challenge=7`, { ...s.env, BOT_IG_VERIFY_TOKEN: undefined, IG_WEBHOOK_VERIFY_TOKEN: "alt" })).text, "7");
});

// ---------- olay süzme ----------
test("igGirdi: echo/silinen/okundu/tepki/düzenleme/kendi gönderimi yok sayılır; öncelik quick_reply → postback → metin", () => {
  const b = { sender: { id: IGSID }, timestamp: NOW };
  assert.equal(ig.igGirdi({ ...b, message: { mid: "a", text: "x", is_echo: true } }, IGID), null);
  assert.equal(ig.igGirdi({ ...b, message: { mid: "a", is_deleted: true } }, IGID), null);
  assert.equal(ig.igGirdi({ ...b, message: { mid: "a", is_unsupported: true } }, IGID), null);
  assert.equal(ig.igGirdi({ ...b, read: { mid: "a" } }, IGID), null);
  assert.equal(ig.igGirdi({ ...b, reaction: { mid: "a", action: "react" } }, IGID), null);
  assert.equal(ig.igGirdi({ ...b, message_edit: { mid: "a" } }, IGID), null);
  assert.equal(ig.igGirdi({ sender: { id: IGID }, message: { mid: "a", text: "x" } }, IGID), null, "sender = entry");
  assert.deepEqual(ig.igGirdi({ ...b, message: { mid: "a", text: "selam", quick_reply: { payload: "n:kargo" } } }, IGID).girdi, { buton: "n:kargo" });
  assert.deepEqual(ig.igGirdi({ ...b, postback: { mid: "p", payload: "menu", title: "Menü" } }, IGID), { sid: IGSID, mid: "p", ts: NOW, girdi: { buton: "menu" } });
  assert.deepEqual(ig.igGirdi({ ...b, message: { mid: "a", text: "  " + "ç".repeat(600) } }, IGID).girdi.metin.length, 500);
  assert.deepEqual(ig.igGirdi({ ...b, message: { mid: "a", attachments: [{ type: "image" }] } }, IGID).girdi, { metin: "" });
});

test("igOlaylar: object !== instagram yok; en çok 10 olay", () => {
  assert.equal(ig.igOlaylar({ object: "page", entry: [{ id: "1", messaging: [{}] }] }).olaylar.length, 0);
  const ev = Array.from({ length: 7 }, () => ({}));
  const r = ig.igOlaylar({ object: "instagram", entry: [{ id: "1", messaging: ev }, { id: "2", messaging: ev }] });
  assert.equal(r.olaylar.length, 10);
  assert.equal(r.fazla, 4);
  assert.equal(r.olaylar[9].entryId, "2");
});

test("webhook: echo ve tekrar mid gönderilmez, tek kullanıcı mesajı yazılır", async () => {
  const s = await setup();
  await botKur(s);
  await s.hook(olay({ sender: { id: IGID }, recipient: { id: IGSID }, timestamp: NOW, message: { mid: "echo1", text: "bizden", is_echo: true } }));
  assert.equal(s.gonderim.length, 0);
  assert.equal(s.mesajlar().length, 0);
  const g = olay(metinOlay("kargom nerede", "mid.tekrar"));
  const r1 = await s.hook(g);
  assert.equal(r1.ozet[0].durum, "gonderildi");
  const r2 = await s.hook(g);
  assert.equal(r2.ozet[0].durum, "tekrar");
  assert.equal(s.gonderim.length, 1, "Meta yeniden denemesi ikinci gönderim yapmaz");
  const kul = s.mesajlar().filter(m => m.rol === "kullanici");
  assert.equal(kul.length, 1);
  assert.equal(kul[0].dis_mid, "mid.tekrar");
  // eşzamanlı yarış: SELECT kaçırılsa da bot_msg_mid UNIQUE batch'i geri alır
  s.db.prepare("UPDATE bot_messages SET dis_mid = NULL").run();
  const kid = s.db.prepare("SELECT id FROM bot_conversations").get().id;
  s.db.prepare("INSERT INTO bot_messages (konusma_id, bot_id, rol, metin, dis_mid) VALUES (?, 1, 'kullanici', 'x', 'mid.yaris')").run(kid);
  const ilk = s.mesajlar().length;
  const sahte = { ...s.env, DB: { ...s.env.DB, prepare: sql => (/SELECT 1 AS x FROM bot_messages/.test(sql) ? { bind: () => ({ first: async () => null }) } : s.env.DB.prepare(sql)) } };
  const oz = await ig.igIsle(sahte, olay(metinOlay("kargom nerede", "mid.yaris")), { now: NOW, fetch: s.fetch });
  assert.equal(oz[0].durum, "tekrar");
  assert.equal(s.mesajlar().length, ilk, "batch geri alındı");
  assert.equal(s.gonderim.length, 1);
});

test("webhook: bot yok / ig_aktif değil / hesap bağlı değil → yok sayılır", async () => {
  const s = await setup();
  await botKur(s, { igAktif: false });
  const r = await s.hook(olay(metinOlay("kargom nerede")));
  assert.equal(r.ozet[0].durum, "bot_yok");
  s.db.prepare("UPDATE chatbots SET ig_aktif = 1, ig_hesap = ?").run(IGID);
  s.db.prepare("UPDATE social_accounts SET status = 'revoked'").run();
  assert.equal((await s.hook(olay(metinOlay("kargom nerede", "mid.2")))).ozet[0].durum, "bot_yok");
  assert.equal(s.gonderim.length, 0);
});

// ---------- 24 saat ----------
test("igPencereAcik + webhook: 24 saat dışı olay gönderilmez, hata 'pencere'", async () => {
  assert.equal(ig.igPencereAcik(NOW - 1000, NOW), true);
  assert.equal(ig.igPencereAcik(NOW - 24 * 3600e3, NOW), true);
  assert.equal(ig.igPencereAcik(NOW - 24 * 3600e3 - 1, NOW), false);
  assert.equal(ig.igPencereAcik(undefined, NOW), true);
  const s = await setup();
  await botKur(s);
  const r = await s.hook(olay(metinOlay("kargom nerede", "mid.eski", NOW - 25 * 3600e3)));
  assert.equal(r.status, 200);
  assert.equal(s.gonderim.length, 0);
  const bot = s.mesajlar().filter(m => m.rol === "bot");
  assert.equal(bot.length, 1);
  assert.equal(bot[0].hata, "pencere");
});

// ---------- quick_reply ----------
test("igQuickReplies: url: atılır, en çok 13, başlık ≤20; boşsa null", () => {
  const b = Array.from({ length: 16 }, (_, i) => ({ etiket: `Seçenek numara ${i} uzun etiket`, hedef: i === 0 ? "url:https://ornek.com" : `n:k${i}` }));
  const q = ig.igQuickReplies(b);
  assert.equal(q.length, 13);
  assert.ok(q.every(x => x.content_type === "text" && [...x.title].length <= 20));
  assert.equal(q[0].payload, "n:k1", "url: butonu IG'de yok");
  assert.equal(q[0].title, "Seçenek numara 1 uzu");
  assert.equal(ig.igQuickReplies([{ etiket: "Site", hedef: "url:https://a.co" }]), null);
  assert.equal(ig.igQuickReplies([]), null);
  assert.equal(ig.igQuickReplies(undefined), null);
  assert.equal([...ig.igQuickReplies([{ etiket: "😀".repeat(25), hedef: "menu" }])[0].title].length, 20, "kod noktası bazında kırpma");
});

test("igGonderGovde: metin ≤1000, quick_replies yoksa alan yok, metin boşsa null", () => {
  const g = ig.igGonderGovde(IGSID, { metin: "a".repeat(1200), butonlar: [] });
  assert.deepEqual(Object.keys(g.message), ["text"]);
  assert.equal(g.message.text.length, 1000);
  assert.deepEqual(g.recipient, { id: IGSID });
  assert.equal(ig.igGonderGovde(IGSID, { metin: "  ", butonlar: [{ etiket: "x", hedef: "menu" }] }), null);
  const q = ig.igGonderGovde(IGSID, { metin: "Merhaba", butonlar: [{ etiket: "Menü", hedef: "menu" }] });
  assert.deepEqual(q.message.quick_replies, [{ content_type: "text", title: "Menü", payload: "menu" }]);
});

// ---------- gönderim gövdesi ----------
test("webhook: ilk mesaj karşılama + menü quick_replies; Graph URL, Bearer token, gövde", async () => {
  const s = await setup();
  const id = await botKur(s);
  const menu = [{ etiket: "Kargo durumu öğrenmek istiyorum", hedef: "n:kargo" }, { etiket: "Web", hedef: "url:https://ornek.com" },
    ...Array.from({ length: 14 }, (_, i) => ({ etiket: `B${i}`, hedef: "menu" }))];
  s.db.prepare("UPDATE chatbots SET menu = ?, karsilama = 'Hoş geldiniz!' WHERE id = ?").run(JSON.stringify(menu), id);
  const r = await s.hook(olay(metinOlay("merhabalar", "mid.k1")), { via: "route" });
  assert.equal(r.status, 200);
  assert.equal(s.gonderim.length, 1);
  const g = s.gonderim[0];
  assert.equal(g.url, `https://graph.instagram.com/v23.0/${IGID}/messages`);
  assert.equal(g.headers.authorization, `Bearer ${ERISIM}`, "oauth_tokens'tan çözülmüş token");
  assert.equal(g.headers["content-type"], "application/json");
  assert.deepEqual(g.govde.recipient, { id: IGSID });
  assert.equal(g.govde.message.text, "Hoş geldiniz!");
  assert.equal(g.govde.message.quick_replies.length, 13);
  assert.deepEqual(g.govde.message.quick_replies[0], { content_type: "text", title: "Kargo durumu öğrenme", payload: "n:kargo" });
  assert.ok(!g.govde.message.quick_replies.some(q => q.payload.startsWith("url:")));
  const k = s.db.prepare("SELECT kanal, dis_id, mesaj_sayisi, son_kullanici_at FROM bot_conversations").get();
  assert.equal(k.kanal, "ig");
  assert.equal(k.dis_id, IGSID);
  assert.equal(k.mesaj_sayisi, 2);
  assert.ok(k.son_kullanici_at);
  assert.equal(s.mesajlar().find(m => m.rol === "bot").kaynak, "karsilama");
  // quick_reply payload → buton → hazır niyet cevabı, aynı konuşma
  await s.hook(olay({ sender: { id: IGSID }, timestamp: NOW, message: { mid: "mid.k2", text: "Kargo durumu öğrenme", quick_reply: { payload: "n:kargo" } } }));
  assert.equal(s.gonderim.length, 2);
  assert.equal(s.gonderim[1].govde.message.text, "Kargonuz 2 günde gelir.");
  assert.equal(s.gonderim[1].govde.message.quick_replies, undefined, "butonsuz cevapta alan yok");
  assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM bot_conversations").get().n, 1);
  assert.equal(s.mesajlar().filter(m => m.rol === "kullanici").at(-1).metin, "Kargo durumu öğrenmek istiyorum", "menüdeki tam buton etiketi saklanır");
});

test("webhook: Graph hatası bot mesajına yazılır (ig_<kod>, token, ig_<status>)", async () => {
  const s = await setup();
  await botKur(s);
  s.igYanit = () => new Response(JSON.stringify({ error: { code: 551, message: "x" } }), { status: 400 });
  await s.hook(olay(metinOlay("kargom nerede", "mid.h1")));
  s.igYanit = () => new Response(JSON.stringify({ error: { code: 190 } }), { status: 401 });
  await s.hook(olay(metinOlay("kargom nerede", "mid.h2")));
  s.igYanit = () => new Response("bozuk", { status: 503 });
  await s.hook(olay(metinOlay("kargom nerede", "mid.h3")));
  assert.deepEqual(s.mesajlar().filter(m => m.rol === "bot").map(m => m.hata), ["ig_551", "token", "ig_503"]);
  assert.equal(ig.igHataKodu(500, null), "ig_500");
});

test("webhook: token çözülemezse gönderim yok, hata 'token'", async () => {
  const s = await setup();
  await botKur(s);
  s.db.prepare("UPDATE oauth_tokens SET access_token = 'bozuk'").run();
  await s.hook(olay(metinOlay("kargom nerede", "mid.t1")));
  assert.equal(s.gonderim.length, 0);
  assert.equal(s.mesajlar().find(m => m.rol === "bot").hata, "token");
});

test("webhook: gönderen günlük hız sınırı (60) aşılınca sessiz", async () => {
  const s = await setup();
  await botKur(s);
  const day = genDay(NOW);
  s.db.prepare("INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, 'gs', 60)").run(day, await keyOf(s.env, day, "bgs", IGSID));
  const r = await s.hook(olay(metinOlay("kargom nerede", "mid.hz")));
  assert.equal(r.ozet[0].durum, "hiz");
  assert.equal(s.gonderim.length, 0);
  assert.equal(s.mesajlar().length, 0);
});

test("webhook: lead butonu → IG lead isteği, sonraki metindeki e-posta lead olur", async () => {
  const s = await setup();
  await botKur(s);
  s.db.prepare("UPDATE bot_conversations SET mesaj_sayisi = 0").run();
  await s.hook(olay({ sender: { id: IGSID }, timestamp: NOW, postback: { mid: "pb.1", payload: "lead", title: "İletişim" } }));
  assert.equal(s.db.prepare("SELECT bekleyen FROM bot_conversations").get().bekleyen, "lead");
  await s.hook(olay(metinOlay("Ali Veli ali@ornek.com", "mid.l2")));
  const l = s.db.prepare("SELECT kanal, eposta FROM bot_leads").get();
  assert.deepEqual({ ...l }, { kanal: "ig", eposta: "ali@ornek.com" });
  assert.equal(s.db.prepare("SELECT bekleyen FROM bot_conversations").get().bekleyen, null);
  assert.equal(s.gonderim.length, 2);
});

// ---------- §8.1 kanal ucu ----------
test("kanal/ig: açma — bayrak kapalı 503, hesap yok 409, izin yok 409, abone ok 200", async () => {
  const kapali = await setup({ extra: { BOT_IG_ENABLED: "0" } });
  const k0 = await botKur(kapali, { igAktif: false });
  assert.equal((await kapali.call("POST", `/gen/bot/${k0}/kanal/ig`, { body: { aktif: true } })).body.error, "ig_kapali");

  const yok = await setup({ bagla: false });
  const y0 = await botKur(yok, { igAktif: false });
  const r1 = await yok.call("POST", `/gen/bot/${y0}/kanal/ig`, { body: { aktif: true } });
  assert.deepEqual([r1.status, r1.body.error], [409, "ig_bagli_degil"]);

  const izin = await setup({ scope: "instagram_business_basic" });
  const i0 = await botKur(izin, { igAktif: false });
  const r2 = await izin.call("POST", `/gen/bot/${i0}/kanal/ig`, { body: { aktif: true } });
  assert.deepEqual([r2.status, r2.body.error], [409, "ig_izin_yok"]);
  assert.equal(izin.abone.length, 0);

  const s = await setup();
  const id = await botKur(s, { igAktif: false });
  assert.equal((await s.call("POST", `/gen/bot/${id}/kanal/ig`, { body: {} })).status, 400);
  assert.equal((await s.call("POST", `/gen/bot/999/kanal/ig`, { body: { aktif: true } })).status, 404);
  const once = s.db.prepare("SELECT surum FROM chatbots WHERE id = ?").get(id).surum;
  const r3 = await s.call("POST", `/gen/bot/${id}/kanal/ig`, { body: { aktif: true } });
  assert.equal(r3.status, 200, JSON.stringify(r3.body));
  assert.equal(r3.body.bot.ig.aktif, true);
  assert.equal(r3.body.bot.ig.durum, "aktif");
  assert.equal(r3.body.bot.ig.hesap, "ornekmarka");
  assert.equal(s.abone.length, 1);
  assert.equal(s.abone[0].url, "https://graph.instagram.com/v23.0/me/subscribed_apps?subscribed_fields=messages,messaging_postbacks");
  assert.equal(s.abone[0].init.method, "POST");
  assert.equal(s.abone[0].init.headers.authorization, `Bearer ${ERISIM}`);
  const row = s.db.prepare("SELECT ig_aktif, ig_hesap, surum FROM chatbots WHERE id = ?").get(id);
  assert.deepEqual({ ...row }, { ig_aktif: 1, ig_hesap: IGID, surum: once + 1 });

  // kapatma (bayrak kapalıyken de serbest)
  s.env.BOT_IG_ENABLED = "0";
  const r4 = await s.call("POST", `/gen/bot/${id}/kanal/ig`, { body: { aktif: false } });
  assert.equal(r4.status, 200);
  assert.deepEqual({ ...s.db.prepare("SELECT ig_aktif, ig_hesap FROM chatbots WHERE id = ?").get(id) }, { ig_aktif: 0, ig_hesap: null });
});

test("kanal/ig: abone hatası — kod 190/10/200 → ig_izin_yok, diğer → 502 ig_abone_hata", async () => {
  const s = await setup();
  const id = await botKur(s, { igAktif: false });
  for (const code of [190, 10, 200]) {
    s.aboneYanit = () => new Response(JSON.stringify({ error: { code } }), { status: 400 });
    const r = await s.call("POST", `/gen/bot/${id}/kanal/ig`, { body: { aktif: true } });
    assert.deepEqual([r.status, r.body.error], [409, "ig_izin_yok"], String(code));
  }
  s.aboneYanit = () => new Response(JSON.stringify({ error: { code: 2 } }), { status: 500 });
  assert.deepEqual(Object.values((await s.call("POST", `/gen/bot/${id}/kanal/ig`, { body: { aktif: true } })).body).slice(0, 2), [false, "ig_abone_hata"]);
  s.aboneYanit = () => new Response(JSON.stringify({ success: false }), { status: 200 });
  assert.equal((await s.call("POST", `/gen/bot/${id}/kanal/ig`, { body: { aktif: true } })).status, 502);
  s.aboneYanit = () => { throw new Error("ağ"); };
  assert.equal((await s.call("POST", `/gen/bot/${id}/kanal/ig`, { body: { aktif: true } })).status, 502);
  assert.equal(s.db.prepare("SELECT ig_aktif FROM chatbots WHERE id = ?").get(id).ig_aktif, 0);
});

test("kanal/ig: hesap kendi başka botunda → 409 ig_baska_botta {id,ad}; başka hesabın botunda → 409 ig_kullanilamiyor, ayrıntısız", async () => {
  const s = await setup();
  s.db.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").run(s.A);
  const b1 = await botKur(s);
  const b2 = await botKur(s, { igAktif: false });
  const r = await s.call("POST", `/gen/bot/${b2}/kanal/ig`, { body: { aktif: true } });
  assert.equal(r.status, 409);
  assert.equal(r.body.error, "ig_baska_botta");
  assert.deepEqual(r.body.bot, { id: b1, ad: "Test" });
  assert.equal(s.abone.length, 0);
  // başka kullanıcının botu
  const B = kullanici(s.db, "b@x.co", "basic", "B");
  s.db.prepare("UPDATE chatbots SET user_id = ? WHERE id = ?").run(B, b1);
  const r2 = await s.call("POST", `/gen/bot/${b2}/kanal/ig`, { body: { aktif: true } });
  // inceleme #2: hesabın başka kullanıcıda bağlı olduğu ig_baska_botta ile ayırt edilemez, bot alanı yok
  assert.deepEqual([r2.status, r2.body.error, "bot" in r2.body], [409, "ig_kullanilamiyor", false]);
  assert.equal(s.abone.length, 0);
  assert.equal(s.db.prepare("SELECT ig_aktif FROM chatbots WHERE id = ?").get(b2).ig_aktif, 0);
});
