// node --test src/tts.test.mjs — W2 (26.11): POST /gen/tts (ElevenLabs seslendirme vekili) ve GET /gen/tts/sesler.
// Gerçek ağ çağrısı yok: fetch sahte verilir, ElevenLabs TTS ucu dışında bir URL gelirse hata fırlatır. D1 yerine node:sqlite.
// Sayaçlar gen_usage'ta (göç yok): tu (kullanıcı/gün), ta (global/gün), tc (global/ay karakter, day "tts:YYYY-MM"); 27.11 hak
// sistemi: ss (aylık hak, day "ses:YYYY-MM", key "u:<id>"), se (ek bakiye, day "ses_ek"), sr (rid başına karakter), to (örnek/gün).
// 27.11 düzeltme: sc (kullanıcı/ay karakter, key "c:u:<id>"), sx (bu ay harcanan ek, key "e:u:<id>"), tg (örnek global/gün),
// tk (örnek global/ay karakter, day "tts:YYYY-MM"); örnek 'ta' yemez.
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

const { generate, genDay, TTS_VOICES, TTS_ALIAS, TTS_MAX, TTS_MODEL_DEFAULT, TTS_FORMATS, TTS_SETTINGS, TTS_ORNEK, ttsModel, ttsFormat, TTS_FORMAT_DEFAULT, ttsBody, ttsVoiceId, ttsSesler, ttsNeden,
  ridYap, ridCoz, RID_TTL, sesAy, sesResetAt } = await import("./generate.js");
const { SES_EK } = await import("./plans.js");
const { APP_ROUTES, SITES } = await import("./sites.js");

const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const MIG18 = readFileSync(new URL("../migrations/0018_plans.sql", import.meta.url), "utf8");
const hash = t => createHash("sha256").update(t).digest("hex");
const TOK = { pro: "P".repeat(43), basic: "B".repeat(43), demo: "D".repeat(43), ent: "E".repeat(43), ent0: "F".repeat(43) };
// [plan, plan_limits]
const PLAN = { pro: ["pro", null], basic: ["basic", null], demo: ["demo", null], ent: ["enterprise", '{"linkedin_blog":5,"video_gorsel":2,"seslendirme":0}'], ent0: ["enterprise", null] };
const BEARER = plan => `Bearer ${TOK[plan]}`;
function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  db.exec(MIG18);
  for (const [who, [plan, lim]] of Object.entries(PLAN)) {
    const uid = Number(db.prepare("INSERT INTO users (site, email, name, role, pass, plan, plan_limits) VALUES ('app.socialmediacorner.co', ?, 'Ad', 'brand', 'x', ?, ?)").run(`${who}@ornek.test`, plan, lim).lastInsertRowid);
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(hash(TOK[who]), uid);
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
const KEY = "el-test-key";
const EL = "https://api.elevenlabs.io/v1/text-to-speech/";
// kodda gömülü yuva kimlikleri (SESLER.md, Berkay'ın seçtiği ElevenLabs sesleri; Alicia belgeli varsayılan); 12 yuvanın hepsi açık
const VID = {
  "tr-TR-Kadin": "NNn9dv8zq2kUo7d3JSGG", "tr-TR-Erkek": "J17lijyP1BHYcM7ld0Rg", "tr-TR-KadinB": "MzfWWOj9g3sIKex1YFMV", "tr-TR-ErkekB": "IuRRIAcbQK5AQk1XevPj",
  "en-US-Kadin": "tnSpp4vdxKPjI9w0GnoV", "en-US-Erkek": "UgBBYS2sOqTuMpoF3BR0", "en-US-Anlatici": "BFd5oBc2DDna33pSi4Gf", "en-GB-Erkek": "G17SuINrv2H9FC6nvetn",
  "de-DE-Kadin": "7eVMgwCnXydb3CikjV7a", "es-ES-Erkek": "Nh2zY9kknu6z4pZy6FhD", "fr-FR-Erkek": "aQROLel5sQbj1vuIVi6B", "ar-SA-Erkek": "rPNcQ53R703tTmtue1AT",
};
const ACIK = Object.keys(VID);
// dile özgü (yerel) olmayan tek yuva: Alicia (çok dilli varsayılan)
const YEREL = id => id !== "en-US-Anlatici";
// test değeri: ELEVENLABS_VOICES biçim denetimi için (gerçek bir ElevenLabs sesi değil, ağa gitmez)
const TEST_VID = "TESTvoice0123456789ab";
const MP3 = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0xff, 0xfb]);

function fakeFetch(reply = () => ({ status: 200, body: MP3 })) {
  const calls = [];
  // Workers gibi: fetch nesne metodu olarak (this dolu) çağrılırsa TypeError: Illegal invocation
  const f = async function (url, init) {
    if (this !== undefined) throw new TypeError("Illegal invocation");
    if (!String(url).startsWith(EL)) throw new Error("beklenmeyen fetch " + url);
    calls.push({ url: String(url), init, json: JSON.parse(init.body) });
    const r = await reply(calls.length);
    if (r instanceof Error) throw r;
    return new Response(r.body, { status: r.status, headers: { "content-type": r.status === 200 ? "audio/mpeg" : "application/json" } });
  };
  return { f, calls };
}

function setup({ env: extra = {}, fetch: ff = fakeFetch(), db = freshDb() } = {}) {
  const env = { DB: d1(db), GEN_ENABLED: "1", ACCOUNTS_ENABLED: "1", ANTHROPIC_API_KEY: "k", GEN_SALT: "salt", TURNSTILE_SECRET: "t", ELEVENLABS_API_KEY: KEY, ...extra };
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete env[k];
  const ctx = { waitUntil() {} };
  // varsayılan: pro oturum, yeni seslendirme (hak düşer); auth null → başlık yok (anonim)
  const tts = async (body = { metin: "Merhaba dünya", ses: "tr-TR-Kadin", yeni: true }, { auth = BEARER("pro"), origin = ORIGIN } = {}) => {
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
  const uid = who => Number(db.prepare("SELECT id FROM users WHERE email = ?").get(`${who}@ornek.test`).id);
  // hak satırları: {ay, ek} (yoksa 0)
  const hak = who => {
    const k = "u:" + uid(who);
    const g = day => Number(db.prepare("SELECT n FROM gen_usage WHERE day = ? AND key = ?").get(day, k)?.n ?? 0);
    return { ay: g(sesAy()), ek: g("ses_ek") };
  };
  const setHak = (who, { ay, ek }) => {
    const k = "u:" + uid(who);
    const put = (day, kind, n) => db.prepare("INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, ?, ?) ON CONFLICT(day, key) DO UPDATE SET n = excluded.n").run(day, k, kind, n);
    if (ay !== undefined) put(sesAy(), "ss", ay);
    if (ek !== undefined) put("ses_ek", "se", ek);
  };
  return { env, db, tts, voices, usage, uid, hak, setHak, calls: ff.calls };
}

const T = (metin = "Merhaba dünya", extra = {}) => ({ metin, ses: "tr-TR-Kadin", ...extra });
const Y = (metin, extra) => T(metin, { yeni: true, ...extra });

test("başarılı: ElevenLabs'e anahtar/biçim/JSON doğru gider; yanıt audio/mpeg ikili, CORS, rid başlıkları; sayaçlar ve hak artar", async () => {
  const s = setup();
  const r = await s.tts(Y("  Merhaba dünya  "));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "audio/mpeg");
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal(r.headers.get("vary"), "Origin");
  assert.equal(r.headers.get("access-control-expose-headers"), "x-ses-rid, x-ses-kalan");
  assert.match(r.headers.get("x-ses-rid"), /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$/);
  assert.equal(r.headers.get("x-ses-kalan"), "5");
  assert.deepEqual([...r.bytes], [...MP3]);
  assert.equal(s.calls.length, 1);
  const { url, init, json } = s.calls[0];
  assert.equal(url, EL + VID["tr-TR-Kadin"] + "?output_format=mp3_44100_192");
  assert.equal(init.method, "POST");
  assert.equal(init.headers["xi-api-key"], KEY);
  assert.equal(init.headers["Content-Type"], "application/json");
  assert.equal(init.headers.Accept, "audio/mpeg");
  assert.ok(init.headers["User-Agent"] && !/berkay|corner\.co|@/i.test(init.headers["User-Agent"]));
  assert.ok(init.signal instanceof AbortSignal);
  assert.deepEqual(json, { text: "Merhaba dünya", model_id: "eleven_multilingual_v2", voice_settings: { ...TTS_SETTINGS }, apply_text_normalization: "on" });
  const day = genDay();
  assert.deepEqual(s.usage("tu"), [{ day, n: 1 }]);
  assert.deepEqual(s.usage("ta"), [{ day, n: 1 }]);
  assert.deepEqual(s.usage("tc"), [{ day: "tts:" + day.slice(0, 7), n: "Merhaba dünya".length }]);
  assert.deepEqual(s.usage("sr"), [{ day, n: "Merhaba dünya".length }]);
  assert.deepEqual(s.usage("ss"), [{ day: sesAy(), n: 1 }]);
  assert.deepEqual(s.usage("sc"), [{ day: sesAy(), n: "Merhaba dünya".length }]);
  assert.deepEqual(s.usage("sx"), []);
  assert.deepEqual(s.hak("pro"), { ay: 1, ek: 0 });
});

test("yuvalar: 12 yuva tanımlı, hepsi açık (SESLER kimlikleri), Alicia dışı yerel; language_code multilingual'da yok", async () => {
  const s = setup();
  assert.deepEqual(TTS_VOICES.map(v => v.id), ["tr-TR-Kadin", "tr-TR-Erkek", "tr-TR-KadinB", "tr-TR-ErkekB", "en-US-Kadin", "en-US-Erkek", "en-US-Anlatici", "en-GB-Erkek", "de-DE-Kadin", "es-ES-Erkek", "fr-FR-Erkek", "ar-SA-Erkek"]);
  assert.deepEqual(TTS_VOICES.map(v => v.ad), ["Derya", "Adam", "Duygu", "Doğa", "Hope", "Mark", "Alicia", "Christopher", "Lea", "David", "Nicolas", "Mazen"]);
  assert.deepEqual(ttsSesler({}).map(v => [v.id, v.yerel]), ACIK.map(id => [id, YEREL(id)]));
  for (const v of TTS_VOICES) {
    assert.deepEqual(Object.keys(v).sort(), ["ad", "cinsiyet", "dil", "id"]);
    assert.ok(Object.isFrozen(v));
  }
  assert.deepEqual(ttsSesler({}).map(v => v.id), ACIK);
  for (const id of ACIK) assert.equal(ttsVoiceId({}, id), VID[id], id);
  // tek hak, aynı rid ile 12 açık yuva
  let rid = null;
  for (const id of ACIK) {
    const r = await s.tts({ metin: "Hello", ses: id, ...(rid ? { rid } : { yeni: true }) });
    assert.equal(r.status, 200, id);
    rid = r.headers.get("x-ses-rid");
  }
  assert.deepEqual(s.calls.map(c => c.url.slice(EL.length).split("?")[0]), ACIK.map(id => VID[id]));
  for (const c of s.calls) assert.equal(c.json.language_code, undefined);
  assert.equal(s.calls.length, ACIK.length);
  assert.deepEqual(s.hak("pro"), { ay: 1, ek: 0 });
});

test("ALIAS: eski kimlikler (tr-TR-Sarah …) yeni yuvaya çevrilir", async () => {
  assert.ok(Object.isFrozen(TTS_ALIAS));
  assert.deepEqual(TTS_ALIAS, {
    "tr-TR-Sarah": "tr-TR-Kadin", "tr-TR-Adam": "tr-TR-Erkek", "en-US-Alice": "en-US-Kadin", "en-US-George": "en-GB-Erkek", "fr-FR-Kadin": "fr-FR-Erkek",
    "tr-TR-Kadin1": "tr-TR-Kadin", "tr-TR-Kadin2": "tr-TR-KadinB", "tr-TR-Erkek1": "tr-TR-Erkek", "tr-TR-Erkek2": "tr-TR-ErkekB",
    "de-DE": "de-DE-Kadin", "es-ES": "es-ES-Erkek", "fr-FR": "fr-FR-Erkek", "ar-SA": "ar-SA-Erkek",
  });
  for (const yuva of Object.values(TTS_ALIAS)) assert.ok(ACIK.includes(yuva), yuva);
  const s = setup();
  const r = await s.tts({ metin: "Merhaba", ses: "tr-TR-Sarah", yeni: true });
  assert.equal(r.status, 200);
  const rid = r.headers.get("x-ses-rid");
  for (const ses of ["tr-TR-Adam", "en-US-Alice", "en-US-George", "fr-FR-Kadin"]) assert.equal((await s.tts({ metin: "Hi", ses, rid })).status, 200, ses);
  assert.deepEqual(s.calls.map(c => c.url.slice(EL.length).split("?")[0]), [VID["tr-TR-Kadin"], VID["tr-TR-Erkek"], VID["en-US-Kadin"], VID["en-GB-Erkek"], VID["fr-FR-Erkek"]]);
  for (const [eski, yeni] of Object.entries(TTS_ALIAS)) assert.equal(ttsVoiceId({}, eski), VID[yeni], eski);
});

test("model/biçim/gövde: varsayılan multilingual_v2 (language_code yok), flash'ta var; voice_settings 4 alan; biçim izin listesi", async () => {
  assert.equal(TTS_MODEL_DEFAULT, "eleven_multilingual_v2");
  assert.equal(ttsModel({}), "eleven_multilingual_v2");
  for (const bad of ["gpt-4", "eleven_flash v2", "eleven_" + "a".repeat(60), "../x"]) assert.equal(ttsModel({ ELEVENLABS_MODEL: bad }), "eleven_multilingual_v2", bad);
  const ml = ttsBody("x", { dil: "tr-TR" }, "eleven_multilingual_v2");
  assert.deepEqual(ml, { text: "x", model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true }, apply_text_normalization: "on" });
  assert.notEqual(ml.voice_settings, TTS_SETTINGS);
  assert.equal(ttsBody("x", { dil: "en-GB" }, "eleven_flash_v2_5").language_code, "en");
  assert.deepEqual(TTS_FORMATS, ["mp3_44100_128", "mp3_44100_192"]);
  // Creator+ planında 192 kbps varsayılan; ELEVENLABS_FORMAT=mp3_44100_128 ile geri alınır
  assert.equal(TTS_FORMAT_DEFAULT, "mp3_44100_192");
  assert.equal(ttsFormat({}), "mp3_44100_192");
  assert.equal(ttsFormat({ ELEVENLABS_FORMAT: "mp3_44100_128" }), "mp3_44100_128");
  for (const bad of ["pcm_44100", "mp3_44100_128&x=1", "mp3_22050_32", ""]) assert.equal(ttsFormat({ ELEVENLABS_FORMAT: bad }), "mp3_44100_192", bad);
  const s = setup({ env: { ELEVENLABS_MODEL: "eleven_flash_v2_5", ELEVENLABS_FORMAT: "mp3_44100_128" } });
  assert.equal((await s.tts()).status, 200);
  assert.equal(s.calls[0].url, EL + VID["tr-TR-Kadin"] + "?output_format=mp3_44100_128");
  assert.deepEqual(s.calls[0].json, { text: "Merhaba dünya", model_id: "eleven_flash_v2_5", language_code: "tr", voice_settings: { ...TTS_SETTINGS }, apply_text_normalization: "on" });
  const v3 = setup({ env: { ELEVENLABS_MODEL: "eleven_v3", ELEVENLABS_FORMAT: "pcm_44100" } });
  assert.equal((await v3.tts({ metin: "Hi", ses: "en-US-Erkek", yeni: true })).status, 200);
  assert.deepEqual([v3.calls[0].json.model_id, v3.calls[0].json.language_code], ["eleven_v3", "en"]);
  assert.ok(v3.calls[0].url.endsWith("?output_format=mp3_44100_192"));
});

test("tts_kapali: ELEVENLABS_API_KEY yoksa ya da boşsa 503, ElevenLabs'e gidilmez, sayaç ve hak yok", async () => {
  for (const env of [{ ELEVENLABS_API_KEY: undefined }, { ELEVENLABS_API_KEY: "" }]) {
    const s = setup({ env });
    const r = await s.tts();
    assert.equal(r.status, 503, JSON.stringify(env));
    assert.equal(r.body.hata, "tts_kapali");
    assert.equal(r.body.ok, false);
    assert.equal(s.calls.length, 0);
    assert.deepEqual(s.usage("tu"), []);
    assert.deepEqual(s.hak("pro"), { ay: 0, ek: 0 });
  }
});

test("metin uzunluğu: 1500 karakter (Türkçe harf kod noktası sayılır) geçer, 1501 → 400 metin_uzun; boş → 400 metin_bos; hak yanmaz", async () => {
  const s = setup();
  assert.equal(TTS_MAX, 1500);
  assert.equal((await s.tts(Y("ş".repeat(1500), { ses: "tr-TR-Erkek" }))).status, 200);
  const long = await s.tts(Y("ş".repeat(1501), { ses: "tr-TR-Erkek" }));
  assert.deepEqual([long.status, long.body.hata, long.body.max], [400, "metin_uzun", 1500]);
  for (const metin of ["", "   ", null, 42, ["a"]]) {
    const r = await s.tts(Y(metin));
    assert.deepEqual([r.status, r.body.hata], [400, "metin_bos"], JSON.stringify(metin));
  }
  assert.equal(s.calls.length, 1);
  assert.equal(s.usage("tu")[0].n, 1);
  assert.deepEqual(s.hak("pro"), { ay: 1, ek: 0 });
});

test("geçersiz ses → 400 ses_gecersiz (liste dışı, Azure kimliği, ham voice_id, harf, yuvasız dil, proto); gidilmez, hak yanmaz", async () => {
  const s = setup();
  for (const ses of ["tr-TR-EmelNeural", "tr-TR-Rachel", "TR-tr-Kadin", VID["tr-TR-Kadin"], "tr-TR-Kadin/../x", "de-DE-Erkek", "it-IT-Kadin", "toString", "__proto__", undefined, 1]) {
    const r = await s.tts(Y("Merhaba", { ses }));
    assert.deepEqual([r.status, r.body.hata], [400, "ses_gecersiz"], String(ses));
  }
  assert.equal(s.calls.length, 0);
  assert.deepEqual(s.usage("tu"), []);
  assert.deepEqual(s.hak("pro"), { ay: 0, ek: 0 });
});

test("oturumsuz → 401 (GEN_LOGIN_REQUIRED açık da kapalı da; geçersiz jeton da); ElevenLabs'e gidilmez", async () => {
  for (const env of [{}, { GEN_LOGIN_REQUIRED: "1" }]) {
    const s = setup({ env });
    for (const auth of [null, "Bearer " + "Z".repeat(43)]) {
      for (const body of [undefined, { ornek: true, ses: "tr-TR-Kadin" }]) {
        const r = await s.tts(body, { auth });
        assert.equal(r.status, 401, JSON.stringify({ env, auth }));
        assert.equal(r.body.error, "login_required");
      }
    }
    assert.equal(s.calls.length, 0);
  }
  const s = setup({ env: { ACCOUNTS_ENABLED: "0" } });
  assert.equal((await s.tts()).status, 401);
});

test("ElevenLabs hatası (5xx, 401, 422, 429, ağ hatası, boş gövde) → 502 tts_hata; sayaçlar ve aylık hak iade, rid verilmez", async () => {
  const replies = [{ status: 500, body: "x" }, { status: 401, body: "x" }, { status: 422, body: "x" }, { status: 429, body: "x" }, new Error("ağ"), { status: 200, body: new Uint8Array(0) }];
  for (const rep of replies) {
    const s = setup({ fetch: fakeFetch(() => rep) });
    const r = await s.tts();
    assert.equal(r.status, 502, String(rep.status || rep.message));
    assert.equal(r.body.hata, "tts_hata");
    assert.equal(r.body.charged, false);
    assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
    assert.equal(r.headers.get("x-ses-rid"), null);
    assert.equal(s.calls.length, 1);
    for (const k of ["tu", "ta", "tc", "sr"]) assert.deepEqual(s.usage(k).map(x => x.n), [0], k);
    assert.deepEqual(s.hak("pro"), { ay: 0, ek: 0 });
  }
  // iade sonrası hak geri gelmiş: günlük tavan 1 ve basic (1 aylık hak) iken hatadan sonra başarılı istek geçer
  let n = 0;
  const s = setup({ env: { GEN_TTS_USER_PER_DAY: "1" }, fetch: fakeFetch(() => (++n === 1 ? { status: 503, body: "x" } : { status: 200, body: MP3 })) });
  assert.equal((await s.tts(undefined, { auth: BEARER("basic") })).status, 502);
  const ok = await s.tts(undefined, { auth: BEARER("basic") });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("x-ses-kalan"), "0");
  assert.equal(s.usage("tu")[0].n, 1);
  assert.deepEqual(s.hak("basic"), { ay: 1, ek: 0 });
});

test("hata iadesi doğru kaynağa: ek'ten düşen hak ek'e döner; mevcut rid ile hata hak iade etmez (düşmemişti)", async () => {
  const s = setup({ fetch: fakeFetch(() => ({ status: 500, body: "x" })) });
  s.setHak("pro", { ay: 6, ek: 2 });
  assert.equal((await s.tts()).status, 502);
  assert.deepEqual(s.hak("pro"), { ay: 6, ek: 2 });
  let n = 0;
  const t = setup({ fetch: fakeFetch(() => (++n === 2 ? { status: 500, body: "x" } : { status: 200, body: MP3 })) });
  const r = await t.tts();
  assert.equal(r.status, 200);
  assert.equal((await t.tts(T("İkinci sahne", { rid: r.headers.get("x-ses-rid") }))).status, 502);
  assert.deepEqual(t.hak("pro"), { ay: 1, ek: 0 });
  assert.deepEqual(t.usage("sr").map(x => x.n), ["Merhaba dünya".length]);
});

test("ELEVENLABS_VOICES: yuva başına voice_id/ad; ezilen yuva yerel; eski anahtar yeni yuvaya; bozuk girdi yok sayılır; voice_id sızmaz", async () => {
  const ov = { "tr-TR-Kadin": TEST_VID, "tr-TR-KadinB": { id: TEST_VID + "B", ad: "Ayşe" }, "tr-TR-ErkekB": { id: TEST_VID + "C", ad: "<b>x</b>" }, "tr-TR-Erkek": "../x", "xx-XX-Yok": TEST_VID };
  const s = setup({ env: { ELEVENLABS_VOICES: JSON.stringify(ov) } });
  const list = ttsSesler(s.env);
  assert.deepEqual(list.map(v => v.id), ACIK);
  const by = Object.fromEntries(list.map(v => [v.id, v]));
  assert.deepEqual(by["tr-TR-KadinB"], { id: "tr-TR-KadinB", dil: "tr-TR", ad: "Ayşe", cinsiyet: "kadin", yerel: true });
  // etiketli ad reddedilir, tablo adı kalır
  assert.equal(by["tr-TR-ErkekB"].ad, "Doğa");
  assert.deepEqual([by["tr-TR-Kadin"].yerel, by["tr-TR-Erkek"].yerel, by["en-US-Kadin"].yerel, by["en-US-Anlatici"].yerel], [true, true, true, false]);
  assert.equal(ttsSesler({ ELEVENLABS_VOICES: JSON.stringify({ "en-US-Anlatici": TEST_VID }) }).find(v => v.id === "en-US-Anlatici").yerel, true);
  const r = await s.tts(Y("Merhaba"));
  assert.equal(r.status, 200);
  const rid = r.headers.get("x-ses-rid");
  for (const ses of ["tr-TR-KadinB", "tr-TR-Erkek"]) assert.equal((await s.tts(T("Merhaba", { ses, rid }))).status, 200, ses);
  assert.deepEqual(s.calls.map(c => c.url.slice(EL.length).split("?")[0]), [TEST_VID, TEST_VID + "B", VID["tr-TR-Erkek"]]);
  assert.equal((await s.tts(T("x", { ses: "xx-XX-Yok", rid }))).status, 400);
  const v = await s.voices();
  for (const id of [TEST_VID, ...Object.values(VID)]) assert.ok(!v.text.includes(id), id);
  // eski anahtar (tr-TR-Sarah) yeni yuvaya yazar; aynı yuvada yeni anahtar kazanır
  assert.equal(ttsVoiceId({ ELEVENLABS_VOICES: JSON.stringify({ "tr-TR-Sarah": TEST_VID }) }, "tr-TR-Kadin"), TEST_VID);
  assert.equal(ttsVoiceId({ ELEVENLABS_VOICES: JSON.stringify({ "tr-TR-Kadin": TEST_VID + "N", "tr-TR-Sarah": TEST_VID }) }, "tr-TR-Sarah"), TEST_VID + "N");
  for (const bad of [undefined, "", "{", "[]", "null", '"x"', JSON.stringify({ "tr-TR-Kadin": 5 }), JSON.stringify({ "tr-TR-Kadin": "a b c d e f g h i j" }), JSON.stringify({ "tr-TR-Kadin": "short" }), JSON.stringify({ "tr-TR-Kadin": { ad: "Ayşe" } })]) {
    assert.equal(ttsVoiceId({ ELEVENLABS_VOICES: bad }, "tr-TR-Kadin"), VID["tr-TR-Kadin"], String(bad));
    assert.deepEqual(ttsSesler({ ELEVENLABS_VOICES: bad }).map(x => [x.id, x.yerel]), ACIK.map(id => [id, YEREL(id)]), String(bad));
  }
  assert.equal(ttsVoiceId({ ELEVENLABS_VOICES: "{}" }, "toString"), undefined);
});

test("F2: SESLER.md anahtarları (tr-TR-Kadin1/Kadin2/Erkek1/Erkek2, de-DE, es-ES, fr-FR, ar-SA) yuvaya gider; tanınmayan anahtar bir kez loglanır, değer loglanmaz", async () => {
  const sesler = { "tr-TR-Kadin1": "tr-TR-Kadin", "tr-TR-Kadin2": "tr-TR-KadinB", "tr-TR-Erkek1": "tr-TR-Erkek", "tr-TR-Erkek2": "tr-TR-ErkekB", "de-DE": "de-DE-Kadin", "es-ES": "es-ES-Erkek", "fr-FR": "fr-FR-Erkek", "ar-SA": "ar-SA-Erkek" };
  for (const [k, yuva] of Object.entries(sesler)) {
    assert.equal(ttsVoiceId({}, k), VID[yuva], k);
    // SESLER.md biçimiyle yazılmış ELEVENLABS_VOICES yuvayı ezer
    assert.equal(ttsVoiceId({ ELEVENLABS_VOICES: JSON.stringify({ [k]: TEST_VID }) }, yuva), TEST_VID, k);
  }
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  try {
    const env = { ELEVENLABS_VOICES: JSON.stringify({ "zz-ZZ-F2yok": TEST_VID, "ar-SA": "kisa" }) };
    ttsSesler(env); ttsSesler(env); ttsVoiceId(env, "tr-TR-Kadin");
  } finally { console.log = orig; }
  const uyar = logs.filter(l => l.startsWith("ELEVENLABS_VOICES atlandı"));
  assert.deepEqual(uyar.sort(), ["ELEVENLABS_VOICES atlandı id_bozuk:ar-SA", "ELEVENLABS_VOICES atlandı yuva_yok:zz-ZZ-F2yok"]);
  for (const l of logs) assert.ok(!l.includes(TEST_VID) && !l.includes("kisa"), l);
});

test("ElevenLabs hata gövdesi → neden (ses_yok/kredi/anahtar/yogun/diger); anahtar ve voice_id yanıtta yok", async () => {
  const cases = [
    [{ status: 404, body: JSON.stringify({ detail: { type: "not_found", code: "voice_not_found", message: "m" } }) }, "ses_yok"],
    [{ status: 402, body: JSON.stringify({ detail: { code: "insufficient_credits" } }) }, "kredi"],
    [{ status: 401, body: JSON.stringify({ detail: { status: "quota_exceeded", message: "m" } }) }, "kredi"],
    [{ status: 401, body: JSON.stringify({ detail: { code: "invalid_api_key" } }) }, "anahtar"],
    [{ status: 403, body: "x" }, "anahtar"],
    [{ status: 429, body: JSON.stringify({ detail: { code: "concurrent_limit_exceeded" } }) }, "yogun"],
    [{ status: 422, body: "x" }, "diger"],
    [{ status: 500, body: "" }, "diger"],
  ];
  for (const [rep, neden] of cases) {
    const s = setup({ fetch: fakeFetch(() => rep) });
    const r = await s.tts();
    assert.equal(r.status, 502);
    assert.equal(r.body.hata, "tts_hata");
    assert.equal(r.body.neden, neden, rep.status + " " + rep.body);
    const t = JSON.stringify(r.body);
    assert.ok(!t.includes(KEY) && !t.includes(VID["tr-TR-Kadin"]));
    for (const k of ["tu", "ta", "tc"]) assert.deepEqual(s.usage(k).map(x => x.n), [0], k);
    assert.deepEqual(s.hak("pro"), { ay: 0, ek: 0 });
  }
  const s = setup({ fetch: fakeFetch(() => new Error("ağ")) });
  assert.equal((await s.tts()).body.neden, undefined);
  assert.equal(ttsNeden(404, ""), "ses_yok");
});

test("metin JSON gövdede aynen gider: tırnak/etiket kaçışsız ama gövde dışına çıkamaz; kontrol karakteri boşluk olur", async () => {
  const s = setup();
  const evil = `"}, "model_id": "x", "voice_settings": {"a":1} <break time="9s"/> A & B\u0000\u0007 son`;
  assert.equal((await s.tts(Y(evil, { ses: "en-US-Kadin" }))).status, 200);
  const j = s.calls[0].json;
  assert.equal(j.text, `"}, "model_id": "x", "voice_settings": {"a":1} <break time="9s"/> A & B   son`);
  assert.equal(j.model_id, "eleven_multilingual_v2");
  assert.deepEqual(j.voice_settings, { ...TTS_SETTINGS });
  assert.ok(!/[\u0000-\u0008]/.test(s.calls[0].init.body));
});

test("sınırlar: kullanıcı günlük tavanı → 429 scope user; aylık karakter → scope month; global → scope global; reddedilen hak yakmaz", async () => {
  const s = setup({ env: { GEN_TTS_USER_PER_DAY: "2" } });
  assert.equal((await s.tts()).status, 200);
  assert.equal((await s.tts()).status, 200);
  const l = await s.tts();
  assert.deepEqual([l.status, l.body.hata, l.body.scope], [429, "tts_limit", "user"]);
  assert.equal((await s.tts(undefined, { auth: BEARER("basic") })).status, 200);
  assert.equal(s.calls.length, 3);
  assert.deepEqual(s.usage("ta").map(x => x.n), [3]);
  assert.deepEqual(s.hak("pro"), { ay: 2, ek: 0 });

  const m = setup({ env: { GEN_TTS_CHARS_PER_MONTH: "20" } });
  assert.equal((await m.tts(Y("a".repeat(15)))).status, 200);
  const over = await m.tts(Y("a".repeat(6)));
  assert.deepEqual([over.status, over.body.scope], [429, "month"]);
  assert.equal((await m.tts(Y("a".repeat(5)))).status, 200);
  assert.deepEqual(m.usage("tu").map(x => x.n), [2]);
  assert.deepEqual(m.hak("pro"), { ay: 2, ek: 0 });

  const g = setup({ env: { GEN_TTS_PER_DAY: "1" } });
  assert.equal((await g.tts()).status, 200);
  assert.equal((await g.tts(undefined, { auth: BEARER("basic") })).body.scope, "global");
  assert.deepEqual(g.hak("basic"), { ay: 0, ek: 0 });
});

test("aylık karakter bütçesi varsayılanı 108000 (Creator ~121k kredi, multilingual 1 kredi/karakter, ~%10 pay)", async () => {
  const s = setup({ env: { GEN_TTS_USER_PER_DAY: "100", GEN_TTS_RID_CHARS: "1000000", GEN_TTS_USER_CHARS_PER_MONTH: "1000000" } });
  const first = await s.tts(Y("a".repeat(1500)));
  assert.equal(first.status, 200);
  const rid = first.headers.get("x-ses-rid");
  for (let i = 1; i < 72; i++) assert.equal((await s.tts(T("a".repeat(1500), { rid }))).status, 200, String(i));
  assert.deepEqual(s.usage("tc").map(x => x.n), [108000]);
  const over = await s.tts(T("a", { rid }));
  assert.deepEqual([over.status, over.body.scope], [429, "month"]);
  assert.deepEqual(s.hak("pro"), { ay: 1, ek: 0 });
});

test("GET /gen/tts/sesler: oturumsuz 200; yalnız açık yuvalar {id,dil,ad,cinsiyet,yerel}; acik yalnız secret var mı", async () => {
  const s = setup({ env: { GEN_LOGIN_REQUIRED: "1" } });
  const r = await s.voices();
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal(r.body.ok, true);
  assert.equal(r.body.acik, true);
  assert.deepEqual(r.body.sesler.map(v => v.id), ACIK);
  assert.deepEqual(Object.keys(r.body.sesler[0]).sort(), ["ad", "cinsiyet", "dil", "id", "yerel"]);
  assert.deepEqual(r.body.sesler[0], { id: "tr-TR-Kadin", dil: "tr-TR", ad: "Derya", cinsiyet: "kadin", yerel: true });
  assert.ok(!r.text.includes(KEY));
  for (const id of Object.values(VID)) assert.ok(!r.text.includes(id), id);
  const off = await setup({ env: { ELEVENLABS_API_KEY: undefined } }).voices();
  assert.deepEqual([off.status, off.body.acik, off.body.sesler.length], [200, false, ACIK.length]);
  assert.equal(s.calls.length, 0);
  const req = new Request("https://forms.test/gen/tts", { method: "GET" });
  assert.equal((await generate(req, new URL(req.url), s.env, ORIGIN, {}, {})).status, 404);
});

test("APP_ROUTES: iki uç yalnız app.socialmediacorner.co listesinde; brandcorner.co'da uç listesi yok", () => {
  assert.ok(APP_ROUTES.includes("POST /gen/tts"));
  assert.ok(APP_ROUTES.includes("GET /gen/tts/sesler"));
  assert.equal(SITES["app.socialmediacorner.co"].routes, APP_ROUTES);
  assert.equal(SITES["brandcorner.co"].routes, undefined);
});

// --- B·8 hak sistemi ---

test("hak (5): yeni:true → hak düşer, aynı rid ile 5 sahne daha → hak hâlâ 1; rid'siz/yeni'siz → 400 hak_onay_gerek", async () => {
  const s = setup();
  for (const body of [T(), T("x", { yeni: "true" }), T("x", { yeni: 1 }), T("x", { rid: "" }), T("x", { rid: null })]) {
    const r = await s.tts(body);
    assert.deepEqual([r.status, r.body.hata], [400, "hak_onay_gerek"], JSON.stringify(body));
  }
  assert.equal(s.calls.length, 0);
  const r = await s.tts(Y("Sahne 1"));
  assert.equal(r.status, 200);
  const rid = r.headers.get("x-ses-rid");
  for (let i = 2; i <= 6; i++) {
    const x = await s.tts(T(`Sahne ${i}`, { rid }));
    assert.equal(x.status, 200, String(i));
    assert.equal(x.headers.get("x-ses-rid"), rid);
    assert.equal(x.headers.get("x-ses-kalan"), "5");
  }
  assert.deepEqual(s.hak("pro"), { ay: 1, ek: 0 });
  assert.deepEqual(s.usage("sr").map(x => x.n), [6 * "Sahne 1".length]);
  // rid + yeni birlikte: rid kullanılır, hak düşmez
  assert.equal((await s.tts(T("Sahne 7", { rid, yeni: true }))).status, 200);
  assert.deepEqual(s.hak("pro"), { ay: 1, ek: 0 });
  // ikinci video: yeni rid, ikinci hak
  const r2 = await s.tts(Y("Video 2"));
  assert.notEqual(r2.headers.get("x-ses-rid"), rid);
  assert.equal(r2.headers.get("x-ses-kalan"), "4");
  assert.deepEqual(s.hak("pro"), { ay: 2, ek: 0 });
});

test("hak (6): aylık bitti + ek 2 → ek'ten düşer; ikisi de 0 → 402 ses_hak_yok (ek_paket), tu/ta/tc/sr geri alınır", async () => {
  const s = setup();
  s.setHak("pro", { ay: 6, ek: 2 });
  const r = await s.tts(Y("Merhaba"));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-ses-kalan"), "1");
  assert.deepEqual(s.hak("pro"), { ay: 6, ek: 1 });
  assert.equal((await s.tts(Y("Merhaba"))).status, 200);
  assert.deepEqual(s.hak("pro"), { ay: 6, ek: 0 });
  const no = await s.tts(Y("Merhaba"));
  assert.equal(no.status, 402);
  assert.equal(no.body.hata, "ses_hak_yok");
  assert.equal(no.body.kalan, 0);
  assert.equal(no.body.plan, "pro");
  assert.deepEqual(no.body.ek_paket, { ...SES_EK });
  assert.deepEqual(SES_EK, { adet: 6, tl: 299, usd: 7 });
  assert.equal(no.headers.get("x-ses-rid"), null);
  assert.equal(s.calls.length, 2);
  assert.deepEqual(s.usage("tu").map(x => x.n), [2]);
  assert.deepEqual(s.usage("ta").map(x => x.n), [2]);
  assert.deepEqual(s.usage("tc").map(x => x.n), [2 * "Merhaba".length]);
  assert.equal(s.usage("sr").reduce((a, x) => a + x.n, 0), 2 * "Merhaba".length);
  assert.deepEqual(s.hak("pro"), { ay: 6, ek: 0 });
});

test("hak (8): rid imzası bozuk / başka kullanıcının / biçimsiz → 400 rid_gecersiz; süresi geçmiş → 409 sure; 6000 karakter → 409 karakter", async () => {
  const s = setup();
  const r = await s.tts(Y("a".repeat(1500)));
  const rid = r.headers.get("x-ses-rid");
  const flip = rid.slice(0, -1) + (rid.endsWith("A") ? "B" : "A");
  const [p] = rid.split(".");
  for (const [bad, auth] of [[flip, "pro"], [rid, "basic"], ["x", "pro"], [123, "pro"], [rid + "x", "pro"], [p + "." + "A".repeat(22), "pro"]]) {
    const x = await s.tts(T("Merhaba", { rid: bad }), { auth: BEARER(auth) });
    assert.deepEqual([x.status, x.body.hata, x.body.field], [400, "rid_gecersiz", "rid"], `${auth} ${bad}`);
  }
  // GEN_SALT değişirse eski rid'ler geçersiz
  assert.deepEqual(await ridCoz({ GEN_SALT: "baska" }, rid, s.uid("pro")), { hata: "rid_gecersiz" });
  const ok = await ridCoz(s.env, rid, s.uid("pro"));
  assert.equal(ok.ok, true);
  assert.equal(ok.day, genDay());
  // süresi geçmiş (25 saat önce verilmiş)
  const old = await ridYap(s.env, s.uid("pro"), Date.now() - (RID_TTL + 3600) * 1000);
  const exp = await s.tts(T("Merhaba", { rid: old.rid }));
  assert.deepEqual([exp.status, exp.body.hata, exp.body.neden], [409, "ses_oturum_bitti", "sure"]);
  assert.deepEqual(await ridCoz(s.env, old.rid, s.uid("pro")), { hata: "sure" });
  // karakter tavanı: 1500 + 3 × 1500 = 6000 geçer, 1 karakter daha → 409 karakter; sayaçlar şişmez
  for (let i = 0; i < 3; i++) assert.equal((await s.tts(T("a".repeat(1500), { rid }))).status, 200, String(i));
  const full = await s.tts(T("a", { rid }));
  assert.deepEqual([full.status, full.body.hata, full.body.neden], [409, "ses_oturum_bitti", "karakter"]);
  assert.deepEqual(s.usage("tu").map(x => x.n), [4]);
  assert.deepEqual(s.usage("sr").map(x => x.n), [6000]);
  assert.equal(s.calls.length, 4);
  assert.deepEqual(s.hak("pro"), { ay: 1, ek: 0 });
});

test("hak (9): ornek:true → gövde metni yok sayılır, dilin örneği gider; hak/rid yok; 31. örnek → 429 scope ornek", async () => {
  const s = setup();
  const r = await s.tts({ ornek: true, ses: "tr-TR-Kadin", metin: "BUNU OKUMA", yeni: true });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-ses-rid"), null);
  assert.equal(r.headers.get("x-ses-kalan"), null);
  assert.equal(s.calls[0].json.text, TTS_ORNEK.tr);
  assert.equal((await s.tts({ ornek: true, ses: "en-GB-Erkek" })).status, 200);
  assert.equal(s.calls[1].json.text, TTS_ORNEK.en);
  assert.deepEqual(s.hak("pro"), { ay: 0, ek: 0 });
  assert.deepEqual(s.usage("ss"), []);
  assert.deepEqual(s.usage("to").map(x => x.n), [2]);
  assert.deepEqual(s.usage("tc").map(x => x.n), [TTS_ORNEK.tr.length + TTS_ORNEK.en.length]);
  // demo (hak 0) da dinleyebilir; geçersiz ses yine 400
  assert.equal((await s.tts({ ornek: true, ses: "tr-TR-Erkek" }, { auth: BEARER("demo") })).status, 200);
  assert.equal((await s.tts({ ornek: true, ses: "de-DE-Erkek" })).status, 400);
  // örnek ödenmiş işin global günlük 'ta' sayacını yemez; kendi tg/tk sayaçları artar
  assert.deepEqual(s.usage("ta"), []);
  assert.deepEqual(s.usage("tg").map(x => x.n), [3]);
  assert.deepEqual(s.usage("tk").map(x => x.n), [TTS_ORNEK.tr.length * 2 + TTS_ORNEK.en.length]);
  // ornek: true dışındaki değerler örnek sayılmaz
  assert.equal((await s.tts({ ornek: "true", ses: "tr-TR-Kadin" })).body.hata, "metin_bos");
  const t = setup();
  for (let i = 0; i < 30; i++) assert.equal((await t.tts({ ornek: true, ses: "tr-TR-Kadin" })).status, 200, String(i));
  const over = await t.tts({ ornek: true, ses: "tr-TR-Kadin" });
  assert.deepEqual([over.status, over.body.hata, over.body.scope], [429, "tts_limit", "ornek"]);
  // örnek tavanı seslendirmeyi engellemez
  assert.equal((await t.tts()).status, 200);
  assert.deepEqual(t.usage("to").map(x => x.n), [30]);
  assert.deepEqual(t.usage("ta").map(x => x.n), [1]);
});

test("F6: örnek global tavanları — günlük tg aşımı ve aylık tk karakter aşımı → 429 scope ornek_global; seslendirmenin 'ta'sı etkilenmez", async () => {
  const g = setup({ env: { GEN_TTS_SAMPLE_GLOBAL_PER_DAY: "1" } });
  assert.equal((await g.tts({ ornek: true, ses: "tr-TR-Kadin" })).status, 200);
  const o = await g.tts({ ornek: true, ses: "en-US-Kadin" }, { auth: BEARER("basic") });
  assert.deepEqual([o.status, o.body.hata, o.body.scope], [429, "tts_limit", "ornek_global"]);
  assert.equal(g.calls.length, 1);
  // reddedilen örnek kullanıcı sayacını da yakmaz (reserve ya hep ya hiç)
  assert.equal(g.usage("to").reduce((t, x) => t + x.n, 0), 1);
  assert.equal((await g.tts(undefined, { auth: BEARER("basic") })).status, 200);
  assert.deepEqual(g.usage("ta").map(x => x.n), [1]);

  const k = setup({ env: { GEN_TTS_SAMPLE_CHARS_PER_MONTH: String(TTS_ORNEK.tr.length) } });
  assert.equal((await k.tts({ ornek: true, ses: "tr-TR-Kadin" })).status, 200);
  const o2 = await k.tts({ ornek: true, ses: "tr-TR-Erkek" });
  assert.deepEqual([o2.status, o2.body.scope], [429, "ornek_global"]);
  assert.deepEqual(k.usage("tk").map(x => [x.day.slice(0, 4), x.n]), [["tts:", TTS_ORNEK.tr.length]]);
  assert.equal((await k.tts()).status, 200);
  assert.deepEqual(k.usage("ta").map(x => x.n), [1]);
});

test("F5: hak düşerken D1 hatası → 503 tts_hata neden diger (402 değil); sayaçlar iade, ElevenLabs'e gidilmez", async () => {
  const s = setup();
  const real = s.env.DB;
  s.env.DB = { prepare: sql => { if (sql.includes("'ss'")) throw new Error("D1_ERROR: test"); return real.prepare(sql); }, batch: st => real.batch(st) };
  const r = await s.tts();
  assert.deepEqual([r.status, r.body.hata, r.body.neden], [503, "tts_hata", "diger"]);
  assert.equal(r.headers.get("x-ses-rid"), null);
  assert.equal(s.calls.length, 0);
  for (const kind of ["tu", "ta", "tc", "sr", "sc"]) assert.ok(s.usage(kind).every(x => x.n === 0), kind);
  assert.deepEqual(s.hak("pro"), { ay: 0, ek: 0 });
  s.env.DB = real;
  assert.equal((await s.tts()).status, 200);
});

test("F7: kullanıcı/ay karakter tavanı = (plan + ek bakiye + bu ay harcanan ek) × 2500; aşım 429 user_month, hak yanmaz; ek harcamak tavanı küçültmez", async () => {
  const s = setup();
  // basic: 1 hak → 2500 karakter/ay (rid 6000'e izin verse de)
  const b = await s.tts(Y("a".repeat(1500)), { auth: BEARER("basic") });
  assert.equal(b.status, 200);
  const rid = b.headers.get("x-ses-rid");
  const over = await s.tts(T("a".repeat(1500), { rid }), { auth: BEARER("basic") });
  assert.deepEqual([over.status, over.body.hata, over.body.scope], [429, "tts_limit", "user_month"]);
  assert.equal((await s.tts(T("a".repeat(1000), { rid }), { auth: BEARER("basic") })).status, 200);
  assert.deepEqual(s.hak("basic"), { ay: 1, ek: 0 });
  assert.deepEqual(s.usage("sc").map(x => x.n), [2500]);
  assert.equal(s.calls.length, 2);

  // demo + 2 ek: tavan 2×2500 = 5000; ek harcandıkça sx sayar, tavan 5000'de kalır
  const d = setup();
  d.setHak("demo", { ek: 2 });
  const d1r = await d.tts(Y("a".repeat(1500)), { auth: BEARER("demo") });
  assert.equal(d1r.status, 200);
  const r1 = d1r.headers.get("x-ses-rid");
  assert.deepEqual(d.usage("sx"), [{ day: sesAy(), n: 1 }]);
  assert.equal((await d.tts(T("a".repeat(1500), { rid: r1 }), { auth: BEARER("demo") })).status, 200);
  const d2r = await d.tts(Y("a".repeat(1500)), { auth: BEARER("demo") });
  assert.equal(d2r.status, 200);
  const r2 = d2r.headers.get("x-ses-rid");
  assert.deepEqual([d.hak("demo"), d.usage("sx")[0].n], [{ ay: 0, ek: 0 }, 2]);
  const dover = await d.tts(T("a".repeat(501), { rid: r2 }), { auth: BEARER("demo") });
  assert.deepEqual([dover.status, dover.body.scope], [429, "user_month"]);
  assert.equal((await d.tts(T("a".repeat(500), { rid: r2 }), { auth: BEARER("demo") })).status, 200);
  assert.deepEqual(d.usage("sc").map(x => x.n), [5000]);

  // ek'ten düşen istek ElevenLabs'te başarısız → ek ve sx geri
  const e = setup({ fetch: fakeFetch(() => ({ status: 500, body: "{}" })) });
  e.setHak("demo", { ek: 1 });
  assert.equal((await e.tts(undefined, { auth: BEARER("demo") })).status, 502);
  assert.deepEqual([e.hak("demo"), e.usage("sx").map(x => x.n)], [{ ay: 0, ek: 1 }, [0]]);
});

test("hak (10): demo/basic/enterprise: demo ek'siz 402, ek'li 200; basic ayda 1; enterprise seslendirme:0 → 402, eksik → 6", async () => {
  const s = setup();
  const d = await s.tts(undefined, { auth: BEARER("demo") });
  assert.deepEqual([d.status, d.body.hata, d.body.plan], [402, "ses_hak_yok", "demo"]);
  s.setHak("demo", { ek: 1 });
  const d2 = await s.tts(undefined, { auth: BEARER("demo") });
  assert.equal(d2.status, 200);
  assert.equal(d2.headers.get("x-ses-kalan"), "0");
  assert.deepEqual(s.hak("demo"), { ay: 0, ek: 0 });
  const b = await s.tts(undefined, { auth: BEARER("basic") });
  assert.deepEqual([b.status, b.headers.get("x-ses-kalan")], [200, "0"]);
  assert.equal((await s.tts(undefined, { auth: BEARER("basic") })).status, 402);
  const e0 = await s.tts(undefined, { auth: BEARER("ent") });
  assert.deepEqual([e0.status, e0.body.plan], [402, "enterprise"]);
  const e6 = await s.tts(undefined, { auth: BEARER("ent0") });
  assert.deepEqual([e6.status, e6.headers.get("x-ses-kalan")], [200, "5"]);
});

test("hak (11): eşzamanlılık — kalan 1 hak, iki paralel yeni:true → biri 200, biri 402; hak tavanı aşılmaz", async () => {
  const s = setup();
  const rs = await Promise.all([s.tts(undefined, { auth: BEARER("basic") }), s.tts(undefined, { auth: BEARER("basic") })]);
  assert.deepEqual(rs.map(r => r.status).sort(), [200, 402]);
  assert.deepEqual(s.hak("basic"), { ay: 1, ek: 0 });
  s.setHak("pro", { ay: 5 });
  const ps = await Promise.all([s.tts(), s.tts(), s.tts()]);
  assert.deepEqual(ps.map(r => r.status).sort(), [200, 402, 402]);
  assert.deepEqual(s.hak("pro"), { ay: 6, ek: 0 });
  assert.equal(s.calls.length, 2);
});

test("sesAy/sesResetAt: İstanbul ayı (UTC+3), sıfırlama sonraki ayın 1'i 00:00 İstanbul", () => {
  assert.equal(sesAy(Date.UTC(2026, 10, 27, 12)), "ses:2026-11");
  assert.equal(sesAy(Date.UTC(2026, 10, 30, 22)), "ses:2026-12");
  assert.equal(sesResetAt(Date.UTC(2026, 10, 27, 12)), "2026-11-30T21:00:00.000Z");
  assert.equal(sesResetAt(Date.UTC(2026, 11, 15)), "2026-12-31T21:00:00.000Z");
  assert.equal(sesResetAt(Date.UTC(2026, 11, 31, 22)), "2027-01-31T21:00:00.000Z");
});
