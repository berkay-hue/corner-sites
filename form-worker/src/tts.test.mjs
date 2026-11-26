// node --test src/tts.test.mjs — W2 (26.11): POST /gen/tts (Azure Speech seslendirme vekili) ve GET /gen/tts/sesler.
// Gerçek ağ çağrısı yok: fetch sahte verilir, Azure TTS ucu dışında bir URL gelirse hata fırlatır. D1 yerine node:sqlite.
// Sayaçlar gen_usage'ta (göç yok): tu (kullanıcı/gün), ta (global/gün), tc (global/ay karakter, day "tts:YYYY-MM").
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "cloudflare:sockets") return { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true };
    if (spec === "cloudflare:email") return { url: "data:text/javascript,export class EmailMessage{}", shortCircuit: true };
    return next(spec, ctx);
  },
});

const { generate, genDay, xmlEscape, TTS_VOICES, TTS_MAX } = await import("./generate.js");
const { APP_ROUTES, SITES } = await import("./sites.js");

const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const MIG18 = readFileSync(new URL("../migrations/0018_plans.sql", import.meta.url), "utf8");
const hash = t => createHash("sha256").update(t).digest("hex");
const TOK = { pro: "P".repeat(43), basic: "B".repeat(43) };
const BEARER = plan => `Bearer ${TOK[plan]}`;
function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  db.exec(MIG18);
  for (const plan of Object.keys(TOK)) {
    const uid = Number(db.prepare("INSERT INTO users (site, email, name, role, pass, plan) VALUES ('app.socialmediacorner.co', ?, 'Ad', 'brand', 'x', ?)").run(`${plan}@ornek.test`, plan).lastInsertRowid);
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(hash(TOK[plan]), uid);
  }
  return db;
}
function d1(db) {
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })), success: true }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes) } }; },
  });
  const batch = async list => {
    db.exec("BEGIN");
    try {
      const out = list.map(s => ({ results: db.prepare(s.sql).all(...s.args).map(r => ({ ...r })), success: true, meta: {} }));
      db.exec("COMMIT");
      return out;
    } catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  return { prepare: sql => stmt(sql), batch };
}

const ORIGIN = "https://app.socialmediacorner.co";
const KEY = "azure-test-key";
const REGION = "westeurope";
const AZURE = `https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
const MP3 = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0xff, 0xfb]);

function fakeFetch(reply = () => ({ status: 200, body: MP3 })) {
  const calls = [];
  // Workers gibi: fetch nesne metodu olarak (this dolu) çağrılırsa TypeError: Illegal invocation
  const f = async function (url, init) {
    if (this !== undefined) throw new TypeError("Illegal invocation");
    if (!String(url).startsWith(`https://${REGION}.tts.speech.microsoft.com/`)) throw new Error("beklenmeyen fetch " + url);
    calls.push({ url: String(url), init });
    const r = await reply(calls.length);
    if (r instanceof Error) throw r;
    return new Response(r.body, { status: r.status, headers: { "content-type": r.status === 200 ? "audio/mpeg" : "text/plain" } });
  };
  return { f, calls };
}

function setup({ env: extra = {}, fetch: ff = fakeFetch(), db = freshDb() } = {}) {
  const env = { DB: d1(db), GEN_ENABLED: "1", ACCOUNTS_ENABLED: "1", ANTHROPIC_API_KEY: "k", GEN_SALT: "salt", TURNSTILE_SECRET: "t", AZURE_SPEECH_KEY: KEY, AZURE_SPEECH_REGION: REGION, ...extra };
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete env[k];
  const ctx = { waitUntil() {} };
  // varsayılan: pro oturum; auth null → başlık yok (anonim)
  const tts = async (body = { metin: "Merhaba dünya", ses: "tr-TR-EmelNeural" }, { auth = BEARER("pro"), origin = ORIGIN } = {}) => {
    const b = JSON.stringify(body);
    const headers = { "content-type": "application/json", "content-length": String(Buffer.byteLength(b)), "cf-connecting-ip": "203.0.113.7" };
    if (auth) headers.authorization = auth;
    const req = new Request("https://forms.test/gen/tts", { method: "POST", headers, body: b });
    const res = await generate(req, new URL(req.url), env, origin, ctx, { fetch: ff.f });
    const buf = new Uint8Array(await res.arrayBuffer());
    const isJson = (res.headers.get("content-type") || "").includes("json");
    return { status: res.status, headers: res.headers, bytes: buf, body: isJson ? JSON.parse(new TextDecoder().decode(buf)) : null };
  };
  const voices = async ({ auth = null } = {}) => {
    const headers = {};
    if (auth) headers.authorization = auth;
    const req = new Request("https://forms.test/gen/tts/sesler", { method: "GET", headers });
    const res = await generate(req, new URL(req.url), env, ORIGIN, ctx, { fetch: ff.f });
    const text = await res.text();
    return { status: res.status, headers: res.headers, text, body: text ? JSON.parse(text) : null };
  };
  const usage = kind => db.prepare("SELECT day, n FROM gen_usage WHERE kind = ?").all(kind).map(r => ({ day: r.day, n: Number(r.n) }));
  return { env, db, tts, voices, usage, calls: ff.calls };
}

test("başarılı: Azure'a anahtar/biçim/SSML doğru gider; yanıt audio/mpeg ikili, CORS; üç sayaç artar", async () => {
  const s = setup();
  const r = await s.tts({ metin: "  Merhaba dünya  ", ses: "tr-TR-EmelNeural" });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "audio/mpeg");
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal(r.headers.get("vary"), "Origin");
  assert.deepEqual([...r.bytes], [...MP3]);
  assert.equal(s.calls.length, 1);
  const { url, init } = s.calls[0];
  assert.equal(url, AZURE);
  assert.equal(init.method, "POST");
  assert.equal(init.headers["Ocp-Apim-Subscription-Key"], KEY);
  assert.equal(init.headers["Content-Type"], "application/ssml+xml");
  assert.equal(init.headers["X-Microsoft-OutputFormat"], "audio-24khz-48kbitrate-mono-mp3");
  assert.ok(init.headers["User-Agent"] && !/berkay|corner\.co|@/i.test(init.headers["User-Agent"]));
  assert.ok(init.signal instanceof AbortSignal);
  assert.equal(init.body, "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='tr-TR'><voice name='tr-TR-EmelNeural'>Merhaba dünya</voice></speak>");
  const day = genDay();
  assert.deepEqual(s.usage("tu"), [{ day, n: 1 }]);
  assert.deepEqual(s.usage("ta"), [{ day, n: 1 }]);
  assert.deepEqual(s.usage("tc"), [{ day: "tts:" + day.slice(0, 7), n: "Merhaba dünya".length }]);
});

test("xml:lang sesten türetilir: dört beyaz liste sesi; en-US sesler en-US", async () => {
  const s = setup();
  assert.deepEqual(TTS_VOICES.map(v => v.id), ["tr-TR-EmelNeural", "tr-TR-AhmetNeural", "en-US-JennyNeural", "en-US-GuyNeural"]);
  for (const v of TTS_VOICES) assert.equal((await s.tts({ metin: "Hello", ses: v.id })).status, 200, v.id);
  assert.deepEqual(s.calls.map(c => c.init.body.match(/xml:lang='([^']+)'><voice name='([^']+)'/).slice(1)),
    [["tr-TR", "tr-TR-EmelNeural"], ["tr-TR", "tr-TR-AhmetNeural"], ["en-US", "en-US-JennyNeural"], ["en-US", "en-US-GuyNeural"]]);
});

test("tts_kapali: AZURE_SPEECH_KEY ya da REGION yoksa (ya da bölge geçersizse) 503, Azure'a gidilmez, sayaç yok", async () => {
  for (const env of [{ AZURE_SPEECH_KEY: undefined }, { AZURE_SPEECH_REGION: undefined }, { AZURE_SPEECH_REGION: "evil.example/x?" }, { AZURE_SPEECH_REGION: "West Europe" }]) {
    const s = setup({ env });
    const r = await s.tts();
    assert.equal(r.status, 503, JSON.stringify(env));
    assert.equal(r.body.hata, "tts_kapali");
    assert.equal(r.body.ok, false);
    assert.equal(s.calls.length, 0);
    assert.deepEqual(s.usage("tu"), []);
    assert.ok(!JSON.stringify(r.body).includes(KEY));
  }
});

test("metin uzunluğu: 1500 karakter (Türkçe harf kod noktası sayılır) geçer, 1501 → 400 metin_uzun; boş → 400 metin_bos", async () => {
  const s = setup();
  assert.equal(TTS_MAX, 1500);
  assert.equal((await s.tts({ metin: "ş".repeat(1500), ses: "tr-TR-AhmetNeural" })).status, 200);
  const long = await s.tts({ metin: "ş".repeat(1501), ses: "tr-TR-AhmetNeural" });
  assert.deepEqual([long.status, long.body.hata, long.body.max], [400, "metin_uzun", 1500]);
  for (const metin of ["", "   ", null, 42, ["a"]]) {
    const r = await s.tts({ metin, ses: "tr-TR-EmelNeural" });
    assert.deepEqual([r.status, r.body.hata], [400, "metin_bos"], JSON.stringify(metin));
  }
  assert.equal(s.calls.length, 1);
  assert.equal(s.usage("tu")[0].n, 1);
});

test("geçersiz ses → 400 ses_gecersiz (beyaz liste dışı, büyük/küçük harf farkı, eksik); Azure'a gidilmez", async () => {
  const s = setup();
  for (const ses of ["tr-TR-SedaNeural", "TR-tr-EmelNeural", "en-US-JennyNeural' xml:lang='x", undefined, 1]) {
    const r = await s.tts({ metin: "Merhaba", ses });
    assert.deepEqual([r.status, r.body.hata], [400, "ses_gecersiz"], String(ses));
  }
  assert.equal(s.calls.length, 0);
  assert.deepEqual(s.usage("tu"), []);
});

test("oturumsuz → 401 (GEN_LOGIN_REQUIRED açık da kapalı da; geçersiz jeton da); Azure'a gidilmez", async () => {
  for (const env of [{}, { GEN_LOGIN_REQUIRED: "1" }]) {
    const s = setup({ env });
    for (const auth of [null, "Bearer " + "Z".repeat(43)]) {
      const r = await s.tts(undefined, { auth });
      assert.equal(r.status, 401, JSON.stringify({ env, auth }));
      assert.equal(r.body.error, "login_required");
    }
    assert.equal(s.calls.length, 0);
  }
  // ACCOUNTS_ENABLED kapalı: oturum okunmaz → 401
  const s = setup({ env: { ACCOUNTS_ENABLED: "0" } });
  assert.equal((await s.tts()).status, 401);
});

test("Azure hatası (5xx, 401, 429, ağ hatası, boş gövde) → 502 tts_hata ve üç sayaç iade edilir", async () => {
  const replies = [{ status: 500, body: "x" }, { status: 401, body: "x" }, { status: 429, body: "x" }, new Error("ağ"), { status: 200, body: new Uint8Array(0) }];
  for (const rep of replies) {
    const s = setup({ fetch: fakeFetch(() => rep) });
    const r = await s.tts();
    assert.equal(r.status, 502, String(rep.status || rep.message));
    assert.equal(r.body.hata, "tts_hata");
    assert.equal(r.body.charged, false);
    assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
    assert.equal(s.calls.length, 1);
    for (const k of ["tu", "ta", "tc"]) assert.deepEqual(s.usage(k).map(x => x.n), [0], k);
  }
  // iade sonrası hak geri gelmiş: tavan 1 iken hatadan sonra başarılı istek geçer
  let n = 0;
  const s = setup({ env: { GEN_TTS_USER_PER_DAY: "1" }, fetch: fakeFetch(() => (++n === 1 ? { status: 503, body: "x" } : { status: 200, body: MP3 })) });
  assert.equal((await s.tts()).status, 502);
  assert.equal((await s.tts()).status, 200);
  assert.equal(s.usage("tu")[0].n, 1);
});

test("SSML kaçışı: & < > \" ' kaçar, kontrol karakteri atılır; enjeksiyon voice/speak dışına çıkamaz", async () => {
  assert.equal(xmlEscape(`<b>"Tom" & 'Jerry'</b>`), "&lt;b&gt;&quot;Tom&quot; &amp; &apos;Jerry&apos;&lt;/b&gt;");
  const s = setup();
  const evil = `</voice><voice name='en-US-GuyNeural'>x</voice><break time="9s"/> A & B\u0000\u0007 son`;
  assert.equal((await s.tts({ metin: evil, ses: "en-US-JennyNeural" })).status, 200);
  const body = s.calls[0].init.body;
  assert.equal(body, "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='en-US-JennyNeural'>"
    + "&lt;/voice&gt;&lt;voice name=&apos;en-US-GuyNeural&apos;&gt;x&lt;/voice&gt;&lt;break time=&quot;9s&quot;/&gt; A &amp; B   son</voice></speak>");
  assert.equal((body.match(/<voice /g) || []).length, 1);
  assert.ok(!/[\u0000-\u0008]/.test(body));
});

test("sınırlar: kullanıcı günlük tavanı → 429 tts_limit scope user; aylık karakter bütçesi → scope month; başka kullanıcı etkilenmez", async () => {
  const s = setup({ env: { GEN_TTS_USER_PER_DAY: "2" } });
  assert.equal((await s.tts()).status, 200);
  assert.equal((await s.tts()).status, 200);
  const l = await s.tts();
  assert.deepEqual([l.status, l.body.hata, l.body.scope], [429, "tts_limit", "user"]);
  assert.equal((await s.tts(undefined, { auth: BEARER("basic") })).status, 200);
  assert.equal(s.calls.length, 3);
  // reddedilen istek sayaçları şişirmez (reserve geri alır)
  assert.deepEqual(s.usage("ta").map(x => x.n), [3]);

  const m = setup({ env: { GEN_TTS_CHARS_PER_MONTH: "20" } });
  assert.equal((await m.tts({ metin: "a".repeat(15), ses: "tr-TR-EmelNeural" })).status, 200);
  const over = await m.tts({ metin: "a".repeat(6), ses: "tr-TR-EmelNeural" });
  assert.deepEqual([over.status, over.body.scope], [429, "month"]);
  assert.equal((await m.tts({ metin: "a".repeat(5), ses: "tr-TR-EmelNeural" })).status, 200);
  assert.deepEqual(m.usage("tu").map(x => x.n), [2]);

  const g = setup({ env: { GEN_TTS_PER_DAY: "1" } });
  assert.equal((await g.tts()).status, 200);
  assert.equal((await g.tts(undefined, { auth: BEARER("basic") })).body.scope, "global");
});

test("GET /gen/tts/sesler: oturumsuz 200 (GEN_LOGIN_REQUIRED=1 iken de); acik yalnız secret var mı, değer dönmez", async () => {
  const s = setup({ env: { GEN_LOGIN_REQUIRED: "1" } });
  const r = await s.voices();
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal(r.body.ok, true);
  assert.equal(r.body.acik, true);
  assert.deepEqual(r.body.sesler.map(v => v.id), TTS_VOICES.map(v => v.id));
  assert.deepEqual(Object.keys(r.body.sesler[0]).sort(), ["ad", "cinsiyet", "dil", "id"]);
  assert.ok(!r.text.includes(KEY) && !r.text.includes(REGION));
  const off = await setup({ env: { AZURE_SPEECH_KEY: undefined } }).voices();
  assert.deepEqual([off.status, off.body.acik, off.body.sesler.length], [200, false, 4]);
  assert.equal(s.calls.length, 0);
  // yanlış yöntem 404
  const req = new Request("https://forms.test/gen/tts", { method: "GET" });
  assert.equal((await generate(req, new URL(req.url), s.env, ORIGIN, {}, {})).status, 404);
});

test("APP_ROUTES: iki uç yalnız app.socialmediacorner.co listesinde; brandcorner.co'da uç listesi yok", () => {
  assert.ok(APP_ROUTES.includes("POST /gen/tts"));
  assert.ok(APP_ROUTES.includes("GET /gen/tts/sesler"));
  assert.equal(SITES["app.socialmediacorner.co"].routes, APP_ROUTES);
  assert.equal(SITES["brandcorner.co"].routes, undefined);
});
