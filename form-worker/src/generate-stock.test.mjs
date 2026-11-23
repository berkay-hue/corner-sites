// node --test src/generate-stock.test.mjs — /gen/stock (Pexels arama vekili) ve /gen/quota stock bayrağı.
// Gerçek ağ çağrısı yok: fetch sahte verilir, api.pexels.com dışında bir URL gelirse hata fırlatır. D1 yerine node:sqlite.
// A9b: /gen/stock yalnız pro|enterprise planlı girişli kullanıcı (Bearer); şema schema.sql + migrations/0018_plans.sql.
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

const { generate } = await import("./generate.js");
const worker = (await import("./index.js")).default;

const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const MIG18 = readFileSync(new URL("../migrations/0018_plans.sql", import.meta.url), "utf8");
const hash = t => createHash("sha256").update(t).digest("hex");
// plan başına bir app kullanıcısı + oturum; jeton 43 karakter base64url
const TOK = { pro: "P".repeat(43), basic: "B".repeat(43), enterprise: "E".repeat(43) };
const BEARER = plan => `Bearer ${TOK[plan]}`;
function freshDb({ mig18 = true } = {}) {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  if (mig18) db.exec(MIG18);
  for (const plan of Object.keys(TOK)) {
    const cols = mig18 ? "site, email, name, role, pass, plan" : "site, email, name, role, pass";
    const vals = mig18 ? [`${plan}@ornek.test`, plan] : [`${plan}@ornek.test`];
    const uid = Number(db.prepare(`INSERT INTO users (${cols}) VALUES ('app.socialmediacorner.co', ?, 'Ad', 'brand', 'x'${mig18 ? ", ?" : ""})`).run(...vals).lastInsertRowid);
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
const KEY = "pexels-test-key";
const photo = (id, extra = {}) => ({
  id, width: 4000, height: 6000, url: `https://www.pexels.com/photo/x-${id}/`, photographer: "Ayşe Fotoğraf",
  photographer_url: "https://www.pexels.com/@ayse", photographer_id: 9, avg_color: "#778899", liked: false, alt: "Masada dizüstü bilgisayar",
  src: {
    original: `https://images.pexels.com/photos/${id}/a.jpeg`, large2x: `https://images.pexels.com/photos/${id}/a.jpeg?w=1880`,
    large: `https://images.pexels.com/photos/${id}/a.jpeg?h=650`, medium: `https://images.pexels.com/photos/${id}/a.jpeg?h=350`,
    small: `https://images.pexels.com/photos/${id}/a.jpeg?h=130`, portrait: `https://images.pexels.com/photos/${id}/a.jpeg?h=1200&w=800`,
    landscape: `https://images.pexels.com/photos/${id}/a.jpeg?h=627&w=1200`, tiny: `https://images.pexels.com/photos/${id}/a.jpeg?h=200&w=280`,
  },
  ...extra,
});

function fakeFetch(reply = () => ({ status: 200, body: { page: 1, per_page: 15, total_results: 2, photos: [photo(1), photo(2)], next_page: "https://api.pexels.com/v1/search/?page=2" } })) {
  const calls = [];
  // Workers gibi: fetch nesne metodu olarak (this dolu) çağrılırsa TypeError: Illegal invocation
  const f = async function (url, init) {
    if (this !== undefined) throw new TypeError("Illegal invocation");
    if (!String(url).startsWith("https://api.pexels.com/v1/search")) throw new Error("beklenmeyen fetch " + url);
    calls.push({ url: new URL(url), init });
    const r = await reply(calls.length);
    if (r instanceof Error) throw r;
    return new Response(typeof r.body === "string" ? r.body : JSON.stringify(r.body), { status: r.status });
  };
  return { f, calls };
}

function setup({ env: extra = {}, fetch: ff = fakeFetch(), db = freshDb() } = {}) {
  const env = { DB: d1(db), GEN_ENABLED: "1", ACCOUNTS_ENABLED: "1", ANTHROPIC_API_KEY: "k", GEN_SALT: "salt", TURNSTILE_SECRET: "t", PEXELS_API_KEY: KEY, ...extra };
  const ctx = { waitUntil() {} };
  // varsayılan: pro oturum; auth null → başlık yok (anonim)
  const call = async (qs, { method = "GET", origin = ORIGIN, ip = "203.0.113.7", auth = BEARER("pro") } = {}) => {
    const headers = { "cf-connecting-ip": ip };
    if (auth) headers.authorization = auth;
    const req = new Request(`https://forms.test/gen/stock${qs}`, { method, headers, body: method === "GET" ? undefined : "{}" });
    const res = await generate(req, new URL(req.url), env, origin, ctx, { fetch: ff.f });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
  };
  const usage = kind => db.prepare("SELECT n FROM gen_usage WHERE kind = ?").all(kind).map(r => Number(r.n));
  return { env, call, usage, calls: ff.calls };
}

test("başarılı arama: Pexels'e anahtar başlıkta, sorgu/yön/sayfa doğru; yanıt ince", async () => {
  const s = setup();
  const r = await s.call("?q=%20%20ofis%20%20masas%C4%B1%20&orientation=portrait&page=2");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal(s.calls.length, 1);
  const { url, init } = s.calls[0];
  assert.equal(url.origin + url.pathname, "https://api.pexels.com/v1/search");
  assert.equal(url.searchParams.get("query"), "ofis masası");
  assert.equal(url.searchParams.get("orientation"), "portrait");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("per_page"), "15");
  assert.equal(init.headers.authorization, KEY);
  assert.deepEqual(Object.keys(r.body).sort(), ["next", "ok", "page", "per_page", "photos", "total_results"]);
  assert.equal(r.body.next, true);
  assert.equal(r.body.photos.length, 2);
  assert.deepEqual(Object.keys(r.body.photos[0]).sort(), ["alt", "height", "id", "photographer", "photographer_url", "src", "url", "width"]);
  assert.equal(r.body.photos[0].photographer, "Ayşe Fotoğraf");
  assert.equal(r.body.photos[0].url, "https://www.pexels.com/photo/x-1/");
  assert.ok(r.body.photos[0].src.large.startsWith("https://images.pexels.com/"));
  assert.ok(!JSON.stringify(r.body).includes(KEY));
  assert.ok(!("avg_color" in r.body.photos[0]) && !("liked" in r.body.photos[0]));
});

test("sorgu doğrulama: boş, 100 karakterden uzun, geçersiz yön ya da sayfa → 400, Pexels çağrılmaz", async () => {
  const s = setup();
  for (const [qs, field] of [["", "q"], ["?q=%20%20", "q"], [`?q=${"a".repeat(101)}`, "q"], ["?q=kedi&orientation=wide", "orientation"], ["?q=kedi&page=0", "page"], ["?q=kedi&page=abc", "page"], ["?q=kedi&page=101", "page"]]) {
    const r = await s.call(qs);
    assert.equal(r.status, 400, qs);
    assert.deepEqual([r.body.error, r.body.field], ["bad_input", field], qs);
  }
  assert.equal((await s.call(`?q=${"ş".repeat(100)}`)).status, 200);
  assert.equal(s.calls.length, 1);
});

test("anahtar yok → 503 not_ready; bayrak kapalı → 503; origin yok → 403; POST → 404", async () => {
  const a = setup({ env: { PEXELS_API_KEY: "" } });
  const r = await a.call("?q=kedi");
  assert.deepEqual([r.status, r.body.error], [503, "not_ready"]);
  const b = setup({ env: { GEN_ENABLED: "0" } });
  assert.equal((await b.call("?q=kedi")).status, 503);
  const c = setup();
  assert.equal((await c.call("?q=kedi", { origin: null })).status, 403);
  assert.equal((await c.call("?q=kedi", { method: "POST" })).status, 404);
  assert.equal(a.calls.length + b.calls.length + c.calls.length, 0);
});

test("üst akış hatası → 502 upstream, ayrıntı sızmaz (durum, bozuk JSON, ağ hatası, eksik photos)", async () => {
  const replies = [
    { status: 401, body: { error: "Unauthorized secret detail" } },
    { status: 429, body: "rate limited detail" },
    { status: 200, body: "<html>not json" },
    new Error("network secret detail"),
    { status: 200, body: { page: 1 } },
  ];
  const s = setup({ fetch: fakeFetch(n => replies[n - 1]) });
  for (let i = 0; i < replies.length; i++) {
    const r = await s.call("?q=kedi");
    assert.equal(r.status, 502);
    assert.deepEqual(r.body, { ok: false, error: "upstream", charged: false });
  }
});

test("bozuk ya da yabancı alan adlı fotoğraf öğeleri ayıklanır; en çok 15 öğe", async () => {
  const many = Array.from({ length: 20 }, (_, i) => photo(i + 1));
  many[0] = { id: "x" };
  many[1] = photo(2, { src: { medium: "https://evil.example/a.jpg", large: "http://images.pexels.com/a.jpg" } });
  many[2] = photo(3, { photographer_url: "javascript:alert(1)", url: "https://evil.example/p" });
  const s = setup({ fetch: fakeFetch(() => ({ status: 200, body: { total_results: 20, photos: many } })) });
  const r = await s.call("?q=kedi");
  assert.equal(r.status, 200);
  assert.equal(r.body.photos.length, 13);
  assert.equal(r.body.next, false);
  const p3 = r.body.photos.find(p => p.id === 3);
  assert.deepEqual([p3.photographer_url, p3.url], [null, null]);
});

test("IP başına günlük sınır → 429 limit (scope ip); başka IP etkilenmez; toplam tavan → scope global", async () => {
  const s = setup({ env: { GEN_STOCK_IP_PER_DAY: "2", GEN_STOCK_PER_DAY: "3" } });
  assert.equal((await s.call("?q=a")).status, 200);
  assert.equal((await s.call("?q=b")).status, 200);
  const l = await s.call("?q=c");
  assert.deepEqual([l.status, l.body.error, l.body.scope], [429, "limit", "ip"]);
  assert.equal((await s.call("?q=d", { ip: "198.51.100.9" })).status, 200);
  const g = await s.call("?q=e", { ip: "192.0.2.44" });
  assert.deepEqual([g.status, g.body.scope], [429, "global"]);
  assert.equal(s.calls.length, 3);
  assert.deepEqual(s.usage("st").sort(), [0, 1, 2]); // üçüncü IP global dolunca geri alındı
  assert.deepEqual(s.usage("sa"), [3]);
});

test("plan kilidi: anonim, basic, jeton geçersiz, ACCOUNTS kapalı, 0018 yok → 403 plan need pro; pro ve enterprise → 200", async () => {
  const s = setup();
  for (const auth of [null, BEARER("basic"), `Bearer ${"Z".repeat(43)}`, "Basic abc"]) {
    const r = await s.call("?q=kedi", { auth });
    assert.equal(r.status, 403, String(auth));
    assert.deepEqual(r.body, { ok: false, error: "plan", charged: false, need: "pro" });
    assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
  }
  assert.equal(s.calls.length, 0);
  assert.deepEqual(s.usage("st"), []); // 403'te sayaç dokunulmaz
  assert.equal((await s.call("?q=kedi")).status, 200);
  assert.equal((await s.call("?q=kedi", { auth: BEARER("enterprise") })).status, 200);
  assert.equal(s.calls.length, 2);
  const off = setup({ env: { ACCOUNTS_ENABLED: "0" } });
  assert.deepEqual([(await off.call("?q=kedi")).status, off.calls.length], [403, 0]);
  const old = setup({ db: freshDb({ mig18: false }) });
  assert.deepEqual([(await old.call("?q=kedi")).status, old.calls.length], [403, 0]);
  // sıra: doğrulama 400 ve anahtar 503 plan kontrolünden önce
  assert.equal((await s.call("", { auth: null })).status, 400);
  assert.equal((await setup({ env: { PEXELS_API_KEY: "" } }).call("?q=kedi", { auth: null })).status, 503);
});

test("quota stock bayrağı: anahtar var VE plan izin veriyor (pro/enterprise); anonim/basic false", async () => {
  const cases = [[KEY, "pro", true], [KEY, "enterprise", true], [KEY, "basic", false], [KEY, null, false], ["", "pro", false], [undefined, "pro", false]];
  for (const [key, plan, want] of cases) {
    const db = freshDb();
    const env = { DB: d1(db), GEN_ENABLED: "1", ACCOUNTS_ENABLED: "1", ANTHROPIC_API_KEY: "k", GEN_SALT: "salt", TURNSTILE_SECRET: "t", PEXELS_API_KEY: key };
    const b = JSON.stringify({ anon: "11111111-2222-4333-8444-555555555555" });
    const headers = { "content-type": "application/json", "content-length": String(Buffer.byteLength(b)) };
    if (plan) headers.authorization = BEARER(plan);
    const req = new Request("https://forms.test/gen/quota", { method: "POST", headers, body: b });
    const res = await generate(req, new URL(req.url), env, ORIGIN, { waitUntil() {} }, { fetch: () => { throw new Error("ağ yok"); } });
    assert.equal(res.status, 200);
    const j = await res.json();
    assert.equal(j.stock, want, `${key} ${plan}`);
    assert.equal(j.plan, plan || "anon");
  }
});

test("index.js: GET /gen/stock CORS başlıklı; OPTIONS GET'e izin verir; izinsiz origin → 403", async () => {
  const env = { DB: d1(new DatabaseSync(":memory:")), ALLOWED_HOSTS: "app.socialmediacorner.co", GEN_ENABLED: "1", ANTHROPIC_API_KEY: "k", GEN_SALT: "s", TURNSTILE_SECRET: "t" };
  const pre = await worker.fetch(new Request("https://forms.test/gen/stock?q=a", { method: "OPTIONS", headers: { origin: ORIGIN } }), env, { waitUntil() {} });
  assert.match(pre.headers.get("access-control-allow-methods"), /GET/);
  assert.equal(pre.headers.get("access-control-allow-origin"), ORIGIN);
  // anahtar yok → 503 not_ready (ağ çağrısı yapılmadan)
  const r = await worker.fetch(new Request("https://forms.test/gen/stock?q=a", { headers: { origin: ORIGIN } }), env, { waitUntil() {} });
  assert.equal(r.status, 503);
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
  const x = await worker.fetch(new Request("https://forms.test/gen/stock?q=a", { headers: { origin: "https://evil.example" } }), env, { waitUntil() {} });
  assert.equal(x.status, 403);
});
