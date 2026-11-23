// node --test src/gen-drafts.test.mjs — A5-4: /gen/* başarılı üretimi oturumlu app kullanıcısında drafts'a yazar.
// Gerçek Anthropic/Turnstile çağrısı yok (sahte fetch). D1 yerine node:sqlite; şema schema.sql'den (users, sessions, gen_*, drafts).
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
const { ANGLES, REELS_ANGLES, SYSTEM_IG_REELS, SYSTEM_REFINE, SYSTEM_BLOG, SYSTEM_VIDEO } = await import("./gen-prompt.js");
const worker = (await import("./index.js")).default;

const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const WRANGLER = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");

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

const APP = "https://app.socialmediacorner.co";
const BC = "https://brandcorner.co";
const ANON = "11111111-2222-4333-8444-555555555555";
const IP = "203.0.113.7";
const EMAIL = "marka@ornek.test";
const TOKEN = "A".repeat(42) + "b"; // 43 karakter base64url
const hash = t => createHash("sha256").update(t).digest("hex");
let ridN = 0;
const rid = () => `00000000-0000-4000-8000-${String(++ridN).padStart(12, "0")}`;

const liDrafts = () => ANGLES.map(a => ({ angle: a, text: `Taslak ${a}` }));
const reelDrafts = () => REELS_ANGLES.map(a => ({ angle: a, text: `Kanca ${a}`, say: `Söz ${a}` }));
const llmBody = drafts => ({ id: "msg_x", model: "claude-sonnet-5-5", stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ drafts }) }], usage: { input_tokens: 100, output_tokens: 200 } });

function fakeFetch() {
  const calls = { llm: [] };
  const f = async (url, init) => {
    if (url.startsWith("https://challenges.cloudflare.com/")) return Response.json({ success: true });
    if (url === "https://api.anthropic.com/v1/messages") {
      const body = JSON.parse(init.body);
      calls.llm.push(body);
      const drafts = body.system === SYSTEM_IG_REELS ? reelDrafts() : body.system === SYSTEM_REFINE ? [{ angle: ANGLES[0], text: "Kısa hali" }]
        : body.system.startsWith(SYSTEM_BLOG) ? [{ angle: "blog", title: "Başlık", meta: "Açıklama", text: "## Bölüm\n\nParagraf." }]
        : body.system.startsWith(SYSTEM_VIDEO) ? [{ angle: "video", title: "Başlık", scenes: Array.from({ length: 6 }, (_, i) => ({ text: `Sahne ${i}`, sub: "", secs: 5 })), caption: "Açıklama" }]
        : liDrafts();
      return new Response(JSON.stringify(llmBody(drafts)), { status: 200 });
    }
    throw new Error("beklenmeyen fetch " + url);
  };
  return { f, calls };
}

// users: app marka (1), app influencer (2, rol izinsiz), brandcorner marka (3). Her birine bir oturum; app'e süresi geçmiş ikinci oturum.
function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  const u = (site, role, email) => Number(db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, ?, 'Ad', ?, 'x')").run(site, email, role).lastInsertRowid);
  const s = (tok, uid, exp = "+30 days") => db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', ?))").run(hash(tok), uid, exp);
  s(TOKEN, u("app.socialmediacorner.co", "brand", EMAIL));
  s("I".repeat(43), u("app.socialmediacorner.co", "influencer", "inf@ornek.test"));
  s("B".repeat(43), u("brandcorner.co", "brand", "bc@ornek.test"));
  s("E".repeat(43), 1, "-1 minutes");
  return db;
}

function setup({ db = freshDb(), env: extra = {} } = {}) {
  const ff = fakeFetch();
  const env = { DB: d1(db), GEN_ENABLED: "1", ACCOUNTS_ENABLED: "1", ANTHROPIC_API_KEY: "test-key", GEN_SALT: "test-salt", TURNSTILE_SECRET: "test-secret", GEN_MODEL: "claude-sonnet-5-5", GEN_PER_DAY: "3", GEN_IP_PER_DAY: "10", GEN_DAILY_CAP: "300", ...extra };
  const pending = [];
  const ctx = { waitUntil: p => pending.push(p) };
  const call = async (path, body, { origin = APP, auth } = {}) => {
    const s = JSON.stringify(body);
    const headers = { "content-type": "application/json", "cf-connecting-ip": IP, "content-length": String(Buffer.byteLength(s)) };
    if (auth !== undefined) headers.authorization = auth;
    const req = new Request(`https://forms.test${path}`, { method: "POST", headers, body: s });
    const res = await generate(req, new URL(req.url), env, origin, ctx, { fetch: ff.f });
    await Promise.all(pending.splice(0));
    return { status: res.status, headers: [...res.headers], body: await res.text() };
  };
  const rows = () => db.prepare("SELECT * FROM drafts ORDER BY id").all().map(r => ({ ...r }));
  return { db, env, call, rows, llm: ff.calls.llm };
}

const liBody = () => ({ anon: ANON, topic: "  Yeni ürün lansmanı  ", sector: "Yazılım", tone: "samimi", goal: "gizli hedef metni", lang: "tr", rid: rid(), t: 4000, ts: "tok", hp: "" });
const igBody = o => ({ anon: ANON, kind: "caption", topic: "Yeni ürün lansmanı", sector: "E-ticaret", tone: "samimi", format: "post", lang: "tr", rid: rid(), t: 4000, ts: "tok", hp: "", ...o });
const noSecret = meta => {
  for (const s of [TOKEN, hash(TOKEN), IP, EMAIL, ANON, "gizli hedef", "token", "ip", "email", "anon", "goal"]) assert.ok(!meta.includes(s), `meta'da ${s}: ${meta}`);
};

test("oturumlu /gen/linkedin: 3 satır (varyant başına), user_id/site/konu doğru, meta'da sır yok, draft_ids yalnız burada", async () => {
  const s = setup();
  const r = await s.call("/gen/linkedin", liBody(), { auth: `Bearer ${TOKEN}` });
  assert.equal(r.status, 200);
  const b = JSON.parse(r.body);
  const rows = s.rows();
  assert.equal(rows.length, 3);
  assert.deepEqual(b.draft_ids, rows.map(x => x.id));
  for (const [i, x] of rows.entries()) {
    assert.deepEqual([x.user_id, x.site, x.platform, x.topic, x.body], [1, "app.socialmediacorner.co", "linkedin", "Yeni ürün lansmanı", b.drafts[i].text]);
    assert.deepEqual(JSON.parse(x.meta), { kind: "li", tone: "samimi", sector: "Yazılım", lang: "tr", angle: b.drafts[i].angle });
    noSecret(x.meta);
  }
});

test("A8: oturumlu /gen/blog ve /gen/video 200 ama satır yazmaz (0017 CHECK, 0018 yok); linkedin style meta'da yalnız işaret", async () => {
  const s = setup();
  const common = { anon: ANON, topic: "Yeni ürün", sector: "Yazılım", tone: "samimi", lang: "tr", t: 4000, ts: "tok", hp: "" };
  const b = await s.call("/gen/blog", { ...common, length: "short", rid: rid() }, { auth: `Bearer ${TOKEN}` });
  const v = await s.call("/gen/video", { ...common, kind: "video", length: "30", rid: rid() }, { auth: `Bearer ${TOKEN}` });
  for (const r of [b, v]) {
    assert.equal(r.status, 200);
    assert.equal(JSON.parse(r.body).draft_ids, undefined);
  }
  assert.equal(s.rows().length, 0);
  const l = await s.call("/gen/linkedin", { ...liBody(), style: "gizli stil örneği" }, { auth: `Bearer ${TOKEN}` });
  assert.equal(l.status, 200);
  const rows = s.rows();
  assert.equal(rows.length, 3);
  for (const x of rows) {
    assert.deepEqual(JSON.parse(x.meta), { kind: "li", tone: "samimi", sector: "Yazılım", lang: "tr", style: true, angle: JSON.parse(x.meta).angle });
    assert.ok(!x.meta.includes("gizli stil"));
  }
});

test("oturumlu /gen/instagram caption ve reels: platform instagram, reels gövdesi ekran metni + söz", async () => {
  const s = setup();
  const c = await s.call("/gen/instagram", igBody({ cta: "dm", voice: { banned: ["katkı"] } }), { auth: `Bearer ${TOKEN}` });
  assert.equal(c.status, 200);
  const r = await s.call("/gen/instagram", igBody({ kind: "reels", format: undefined, video: "talk" }), { auth: `Bearer ${TOKEN}` });
  assert.equal(r.status, 200);
  const rows = s.rows();
  assert.equal(rows.length, 6);
  assert.ok(rows.every(x => x.platform === "instagram" && x.user_id === 1 && x.site === "app.socialmediacorner.co"));
  assert.deepEqual(JSON.parse(rows[0].meta), { kind: "caption", tone: "samimi", sector: "E-ticaret", lang: "tr", format: "post", cta: "dm", voice: true, angle: JSON.parse(c.body).drafts[0].angle });
  assert.ok(!rows[0].meta.includes("katkı"));
  const rb = JSON.parse(r.body);
  assert.equal(rows[3].body, `${rb.drafts[0].text}\n\n${rb.drafts[0].say}`);
  assert.deepEqual(JSON.parse(rows[3].meta).video, "talk");
  assert.deepEqual(JSON.parse(r.body).draft_ids, rows.slice(3).map(x => x.id));
  for (const x of rows) noSecret(x.meta);
});

test("refine: oturumluysa 1 satır yazar (konu boş, op meta'da); anonim refine yazmaz", async () => {
  const s = setup();
  assert.equal((await s.call("/gen/linkedin", liBody())).status, 200); // anonim üretim: refine şartı
  assert.equal(s.rows().length, 0);
  const ref = { anon: ANON, op: "shorten", text: "Uzun bir taslak metni", lang: "tr", angle: ANGLES[0] };
  const a = await s.call("/gen/refine", ref);
  assert.equal(a.status, 200);
  assert.equal(JSON.parse(a.body).draft_ids, undefined);
  assert.equal(s.rows().length, 0);
  const r = await s.call("/gen/refine", ref, { auth: `Bearer ${TOKEN}` });
  assert.equal(r.status, 200);
  const rows = s.rows();
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0].user_id, rows[0].platform, rows[0].topic, rows[0].body], [1, "linkedin", "", JSON.parse(r.body).drafts[0].text]);
  assert.deepEqual(JSON.parse(rows[0].meta), { kind: "li", op: "shorten", lang: "tr", angle: ANGLES[0] });
  assert.deepEqual(JSON.parse(r.body).draft_ids, [rows[0].id]);
  noSecret(rows[0].meta);
});

test("anonim / bayrak kapalı ya da preview / geçersiz, süresi geçmiş, başka site, izinsiz rol jetonu: satır yok, yanıt ve LLM isteği anonimle aynı", async () => {
  const body = liBody();
  const base = setup();
  const anon = await base.call("/gen/linkedin", body);
  assert.equal(anon.status, 200);
  assert.equal(JSON.parse(anon.body).draft_ids, undefined);
  const cases = [
    [{}, `Bearer ${TOKEN}`, { ACCOUNTS_ENABLED: "0" }],
    [{}, `Bearer ${TOKEN}`, { ACCOUNTS_ENABLED: "preview" }],
    [{}, `Bearer ${TOKEN}`, { ACCOUNTS_ENABLED: undefined }],
    [{}, `Bearer ${"Z".repeat(43)}`], // bilinmeyen jeton
    [{}, `Bearer ${TOKEN}x`], // biçim dışı
    [{}, TOKEN], // Bearer yok
    [{}, `Bearer ${"E".repeat(43)}`], // süresi geçmiş
    [{}, `Bearer ${"B".repeat(43)}`], // brandcorner kullanıcısı app'te
    [{}, `Bearer ${"I".repeat(43)}`], // app'te izinsiz rol
  ];
  for (const [, auth, env] of cases) {
    const s = setup({ env });
    const r = await s.call("/gen/linkedin", body, { auth });
    assert.deepEqual(r, anon, auth);
    assert.deepEqual(s.llm, base.llm, auth);
    assert.equal(s.rows().length, 0, auth);
  }
});

test("drafts tablosu yoksa oturumlu üretim yine 200 (draft_ids yok), hata tek satır loglanır", async t => {
  const body = liBody();
  const anon = await setup().call("/gen/linkedin", body);
  const db = freshDb();
  db.exec("DROP TABLE drafts");
  const s = setup({ db });
  const log = t.mock.method(console, "log", () => {});
  const r = await s.call("/gen/linkedin", body, { auth: `Bearer ${TOKEN}` });
  log.mock.restore();
  assert.deepEqual(r, anon);
  const lines = log.mock.calls.filter(c => c.arguments[0] === "gen drafts");
  assert.equal(lines.length, 1);
  assert.ok(!lines[0].arguments.join(" ").includes(TOKEN));
});

test("brandcorner.co, izin listesinde olmayan origin ve preview kapısında önizleme: geçerli oturum olsa da satır yok, yanıt anonimle aynı", async () => {
  // Önizleme (<dal>.web-smcapp.pages.dev) "preview" kapısında platformSite'tan app sitesini alır; yazımı yalnız ACCOUNTS_ENABLED === "1" şartı durdurur
  const PV = "https://f-x.web-smcapp.pages.dev";
  for (const [origin, tok, env] of [[BC, "B".repeat(43), { AUTH_HOSTS: "brandcorner.co" }], ["https://saascorner.co", TOKEN, {}], [null, TOKEN, {}], [PV, TOKEN, { ACCOUNTS_ENABLED: "preview" }]]) {
    const body = liBody();
    const anon = await setup({ env }).call("/gen/linkedin", body, { origin });
    const s = setup({ env });
    const r = await s.call("/gen/linkedin", body, { origin, auth: `Bearer ${tok}` });
    assert.deepEqual(r, anon, String(origin));
    assert.equal(s.rows().length, 0, String(origin));
  }
});

test("CORS: /gen/* önuçuşu app origin'ine authorization başlığını zaten izinli verir; wrangler bayrakları 0", async () => {
  const hosts = WRANGLER.match(/^ALLOWED_HOSTS\s*=\s*"([^"]*)"/m)[1];
  const env = { DB: d1(freshDb()), ALLOWED_HOSTS: hosts, GEN_ENABLED: "0" };
  const res = await worker.fetch(new Request("https://forms.test/gen/linkedin", { method: "OPTIONS", headers: { origin: APP } }), env, { waitUntil() {} });
  assert.equal(res.headers.get("access-control-allow-origin"), APP);
  assert.ok(res.headers.get("access-control-allow-headers").split(/,\s*/).includes("authorization"));
  assert.match(WRANGLER, /^ACCOUNTS_ENABLED\s*=\s*"0"/m);
});
