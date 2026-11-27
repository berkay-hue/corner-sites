// node --test src/seo.test.mjs — POST /gen/seo (SEO analizi). Gerçek ağ yok: sayfa ve Anthropic fetch sahte; D1 yerine node:sqlite.
// Hak: gen_usage day "seo:YYYY-MM-DD" (UTC+3), key "u:<id>", kind 'so'; hata olursa iade.
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
const { checkUrl, scoreSeo, extractPage, keywordStats, ruleIssues, cleanAi, slugify, fetchPage, SEO_PER_DAY, SEO_UA, SEO_SCHEMA } = await import("./seo.js");

const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const MIG18 = readFileSync(new URL("../migrations/0018_plans.sql", import.meta.url), "utf8");
const hash = t => createHash("sha256").update(t).digest("hex");
const TOK = { pro: "P".repeat(43), basic: "B".repeat(43), demo: "D".repeat(43), ent: "E".repeat(43), old: "O".repeat(43) };
const PLAN = { pro: "pro", basic: "basic", demo: "demo", ent: "enterprise", old: "demo" };
const BEARER = who => `Bearer ${TOK[who]}`;
const UID = {};
function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  db.exec(MIG18);
  for (const [who, plan] of Object.entries(PLAN)) {
    const uid = Number(db.prepare("INSERT INTO users (site, email, name, role, pass, plan) VALUES ('app.socialmediacorner.co', ?, 'Ad', 'brand', 'x', ?)").run(`${who}@ornek.test`, plan).lastInsertRowid);
    UID[who] = uid;
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(hash(TOK[who]), uid);
  }
  // deneme süresi bitmiş demo
  db.prepare("UPDATE users SET created_at = datetime('now', '-400 days') WHERE id = ?").run(UID.old);
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
  const batch = async list => list.map(s => ({ results: db.prepare(s.sql).all(...s.args).map(r => ({ ...r })), success: true, meta: {} }));
  return { prepare: sql => stmt(sql), batch };
}

const ORIGIN = "https://app.socialmediacorner.co";
const AN = "https://api.anthropic.com/v1/messages";
const seoDay = () => "seo:" + new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

const LONG = Array.from({ length: 900 }, (_, i) => (i % 60 === 0 ? "sosyal medya yönetimi" : "kelime")).join(" ");
const PAGE = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>Sosyal medya yönetimi rehberi | Örnek Ajans 2026</title>
<meta name="description" content="Sosyal medya yönetimi nasıl yapılır? Planlama, içerik takvimi, ölçüm ve raporlama adımlarını tek rehberde topladık.">
<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="canonical" href="https://ornek.com/rehber">
<meta property="og:title" content="Rehber"><script type="application/ld+json">{"@type":"Article"}</script><style>h1{color:red}</style></head>
<body><!-- <h1>yorum</h1> --><h1>Sosyal Medya Yönetimi &amp; Rehberi</h1><h2>Planlama</h2><h2>Ölçüm</h2><p>${LONG}</p><script>var x="kelime kelime";</script></body></html>`;

function aiObj(lang = "tr") {
  const en = lang === "en";
  return {
    keywords: {
      primary: ["sosyal medya yönetimi", "sosyal medya ajansı", "içerik takvimi"],
      secondary: ["a", "b", "c", "d", "e", "f"],
      long_tail: ["bir", "iki", "üç", "dört", "beş"],
      table: [
        { keyword: "sosyal medya yönetimi", volume: "1K–10K", competition: "high", intent: "commercial" },
        { keyword: "içerik takvimi", volume: "N/A", competition: "low", intent: "informational" },
        { keyword: "-", volume: "100", competition: "low", intent: "informational" },
      ],
    },
    issues: [en ? "Add internal links." : "İç bağlantı ekle.", "İç bağlantı ekle!"],
    generated_content: {
      seo_title: en ? "Social media management guide" : "Sosyal Medya Yönetimi Rehberi",
      meta_description: "Açıklama ".repeat(10).trim(),
      slug: "Sosyal Medya Yönetimi Rehberi",
      content: {
        intro: "Giriş.",
        sections: [1, 2, 3, 4, 5, 6].map(i => ({ h2: `Bölüm ${i}`, content: `Paragraf ${i}.\n\n\n\nİkinci.`, h3_subheadings: ["A", "B"] })),
        faq: [1, 2, 3, 4, 5].map(i => ({ q: `Soru ${i}?`, a: "Cevap." })),
        conclusion: "Sonuç.",
      },
      internal_link_suggestions: [{ anchor: "fiyatlar", topic: "fiyat sayfası" }, { anchor: "", topic: "boş" }],
    },
  };
}

// sayfa + Anthropic sahte fetch; Workers gibi this dolu çağrı TypeError
function fakeFetch({ pages = { "https://ornek.com/rehber": { status: 200, body: PAGE } }, ai = () => aiObj(), anth = null } = {}) {
  const calls = [];
  const f = async function (url, init) {
    if (this !== undefined) throw new TypeError("Illegal invocation");
    url = String(url);
    calls.push({ url, init });
    if (url === AN) {
      if (anth) return anth(init);
      const body = JSON.parse(init.body);
      return Response.json({ stop_reason: "end_turn", model: body.model || "m", usage: { input_tokens: 10, output_tokens: 20 }, content: [{ type: "text", text: JSON.stringify(ai(body)) }] });
    }
    const p = pages[url];
    if (!p) throw new Error("beklenmeyen fetch " + url);
    if (p instanceof Error) throw p;
    return new Response(p.body ?? null, { status: p.status, headers: { "content-type": p.type || "text/html; charset=utf-8", ...(p.headers || {}) } });
  };
  return { f, calls };
}

function setup({ env: extra = {}, fetch: ff = fakeFetch(), db = freshDb() } = {}) {
  const env = { DB: d1(db), GEN_ENABLED: "1", ACCOUNTS_ENABLED: "1", ANTHROPIC_API_KEY: "k", GEN_SALT: "salt", TURNSTILE_SECRET: "t", ...extra };
  const ctx = { waitUntil() {} };
  const seo = async (body = { url: "https://ornek.com/rehber", lang: "tr" }, { auth = BEARER("pro"), raw } = {}) => {
    const b = raw ?? JSON.stringify(body);
    const headers = { "content-type": "application/json", "content-length": String(Buffer.byteLength(b)), "cf-connecting-ip": "203.0.113.7" };
    if (auth) headers.authorization = auth;
    const req = new Request("https://forms.test/gen/seo", { method: "POST", headers, body: b });
    const res = await generate(req, new URL(req.url), env, ORIGIN, ctx, { fetch: ff.f });
    return { status: res.status, body: await res.json() };
  };
  const used = who => Number(db.prepare("SELECT n FROM gen_usage WHERE day = ? AND key = ?").get(seoDay(), "u:" + UID[who])?.n || 0);
  return { env, db, ff, seo, used };
}

/* ---------- URL denetimi ---------- */
test("checkUrl: geçerli adresler normalize edilir", () => {
  assert.deepEqual(checkUrl("ornek.com/a?b=1#x"), { ok: true, url: "https://ornek.com/a?b=1" });
  assert.equal(checkUrl("  HTTP://Ornek.COM.  ").url, "http://ornek.com/");
  assert.equal(checkUrl("https://xn--rnek-zoa.com.tr/").ok, true);
  assert.equal(checkUrl("https://örnek.com.tr/").ok, true);
  assert.equal(checkUrl("https://ornek.com:443/").ok, true); // varsayılan port URL'den düşer
});

test("checkUrl: SSRF ve bozuk adresler reddedilir", () => {
  const bad = {
    "": "empty", "ftp://ornek.com/": "scheme", "javascript:alert(1)": "scheme", "file:///etc/passwd": "scheme",
    "https://a:b@ornek.com/": "credentials", "https://ornek.com:8080/": "port", "http://ornek.com:443/": "port",
    "http://127.0.0.1/": "ip", "http://169.254.169.254/latest/meta-data": "ip", "http://[::1]/": "ip", "http://2130706433/": "ip", "http://0x7f.1/": "ip",
    "http://localhost/": "host", "http://foo.localhost/": "private", "http://printer.local/": "private", "http://db.internal/": "private",
    "http://metadata.google.internal/": "private", "http://x.home.arpa/": "private", "http://a.test/": "private", "http://10.0.0.1.nip.io/": "private",
    "http://app.lvh.me/": "private", "http://ornek/": "host", "http://ornek.c0m/": "host", "http://a b.com/": "invalid",
    ["https://ornek.com/" + "a".repeat(2100)]: "too_long",
  };
  for (const [u, reason] of Object.entries(bad)) assert.deepEqual(checkUrl(u), { ok: false, reason }, u);
  assert.equal(checkUrl(null).ok, false);
});

/* ---------- çıkarım ve puan ---------- */
test("extractPage: başlık, meta, H1/H2, kelime ve bonus etiketleri", () => {
  const p = extractPage(PAGE);
  assert.equal(p.title, "Sosyal medya yönetimi rehberi | Örnek Ajans 2026");
  assert.match(p.meta, /^Sosyal medya yönetimi nasıl yapılır\?/);
  assert.deepEqual(p.h1s, ["Sosyal Medya Yönetimi & Rehberi"]); // yorum içindeki H1 sayılmaz
  assert.deepEqual(p.h2s, ["Planlama", "Ölçüm"]);
  assert.ok(p.words > 900 && p.words < 1000, String(p.words)); // script/style metni sayılmaz
  assert.ok(!p.text.includes("var x"));
  assert.deepEqual([p.canonical, p.og_title, p.ld_json, p.viewport], [true, true, true, true]);
  const e = extractPage("<p>merhaba</p>");
  assert.deepEqual([e.title, e.meta, e.h1s.length, e.canonical, e.og_title, e.ld_json, e.viewport], ["", "", 0, false, false, false, false]);
  const many = extractPage("<meta content='ters &#x27;sıra&#39;' name='description'>" + Array.from({ length: 30 }, (_, i) => `<h2>b${i}</h2>`).join(""));
  assert.equal(many.meta, "ters 'sıra'");
  assert.equal(many.h2s.length, 20);
});

test("extractPage: kapanmayan etiketlerde doğrusal (10 ms CPU), ASCII dışı harf indeksi kaydırmaz", () => {
  const filler = "<p>" + "kelime ".repeat(40) + "</p>";
  const cases = {
    script: "<title>T</title><body>" + filler + "<script>x".repeat(2000) + "y".repeat(350000),
    h2: "<body>" + "<h2>açık başlık ".repeat(2000) + filler.repeat(1100),
    lt: "<body>" + filler + "<a <b <c ".repeat(40000),
    comment: "<body>" + "<!-- yorum ".repeat(2000) + filler.repeat(1100),
    meta: "<head>" + "<meta name=description content=x ".repeat(10000),
    normal: "<html><head><title>Normal sayfa</title><script>" + "v=1;".repeat(5000) + "</script></head><body>" + `<h2>B</h2>${filler}<script>a()</script>`.repeat(1200),
  };
  for (const [k, html] of Object.entries(cases)) {
    assert.ok(html.length > 300000, k);
    const t0 = performance.now();
    const p = extractPage(html);
    const ms = performance.now() - t0;
    assert.ok(ms < 50, `${k}: ${ms.toFixed(1)} ms`);
    assert.ok(Number.isInteger(p.words), k);
  }
  assert.equal(extractPage(cases.script).title, "T");
  assert.equal(extractPage(cases.normal).h2s.length, 20);
  const tr = extractPage("<p>" + "İSTANBUL İzmir ".repeat(50) + "</p><h1>Başlık</h1><meta name=\"description\" content=\"Açıklama\">");
  assert.deepEqual([tr.h1s, tr.meta], [["Başlık"], "Açıklama"]);
});

test("scoreSeo: kural tablosu ve seviyeler (saf)", () => {
  const full = { title: "x".repeat(45), meta: "y".repeat(120), h1s: ["a"], words: 1600, canonical: true, og_title: true, ld_json: true, viewport: true, text: "" };
  // anahtar kelime yok → 10: (20+20+20+20+10+20)/1.2 = 91.67 → 92
  let s = scoreSeo(full, null);
  assert.deepEqual(s.breakdown, { title_quality: 20, meta_desc_quality: 20, h1_quality: 20, content_depth: 20, keyword_density: 10, bonus_points: 20 });
  assert.deepEqual([s.total, s.level, s.color, s.keyword], [92, "Mükemmel", "green", null]);
  // yoğunluk %1 → 20; toplam 120/1.2 = 100
  const text = Array.from({ length: 100 }, (_, i) => (i === 5 ? "Kahve" : "su")).join(" ");
  s = scoreSeo({ ...full, text }, "kahve");
  assert.equal(s.breakdown.keyword_density, 20);
  assert.equal(s.total, 100);
  assert.deepEqual(s.keyword, { term: "kahve", count: 1, density: 1 });
  // geçiyor ama yoğun değil → 12; hiç yok → 5
  assert.equal(scoreSeo({ ...full, text: "kahve " + "su ".repeat(400) }, "kahve").breakdown.keyword_density, 12);
  assert.equal(scoreSeo({ ...full, text: "su su" }, "kahve").breakdown.keyword_density, 5);
  // kısa/uzun başlık-meta 12, birden çok H1 12, kelime eşikleri
  s = scoreSeo({ title: "kısa", meta: "kısa", h1s: ["a", "b"], words: 800, text: "" }, null);
  assert.deepEqual(s.breakdown, { title_quality: 12, meta_desc_quality: 12, h1_quality: 12, content_depth: 15, keyword_density: 10, bonus_points: 0 });
  assert.equal(s.total, 51); // 61/1.2 = 50.8
  assert.deepEqual([s.level, s.color], ["Orta", "amber"]);
  assert.equal(scoreSeo({ title: "", meta: "", h1s: [], words: 300, text: "" }, null).breakdown.content_depth, 10);
  s = scoreSeo({ title: "", meta: "", h1s: [], words: 10, text: "" }, null, "en");
  assert.deepEqual([s.breakdown.title_quality, s.breakdown.meta_desc_quality, s.breakdown.h1_quality, s.breakdown.content_depth], [0, 0, 0, 4]);
  assert.deepEqual([s.total, s.level, s.color], [12, "Poor", "red"]);
  // seviye sınırları: 60 İyi/blue
  s = scoreSeo({ title: "x".repeat(45), meta: "y".repeat(100), h1s: ["a"], words: 10, text: "", viewport: true }, null);
  assert.deepEqual([s.total, s.level, s.color], [66, "İyi", "blue"]); // 79/1.2
  assert.equal(scoreSeo({ ...full, title: "x".repeat(61) }, null, "en").level, "Excellent");
  // Türkçe büyük/küçük ve kelime sınırı: "kahveci" sayılmaz, "KAHVE" sayılır, çok kelimeli ifade
  assert.equal(keywordStats("KAHVE kahveci kahve", "kahve").count, 2);
  assert.equal(keywordStats("İstanbul ofis, istanbul  ofis", "istanbul ofis").count, 2);
  assert.equal(keywordStats("", "x").density, 0);
});

test("ruleIssues: istenen dilde, eksikleri sayar", () => {
  const p = { title: "", meta: "kısa", h1s: ["a", "b"], words: 100, text: "su", canonical: false, og_title: true, ld_json: false, viewport: true };
  const tr = ruleIssues(p, scoreSeo(p, "kahve"), "tr");
  assert.ok(tr.includes("Sayfada <title> etiketi yok."));
  assert.ok(tr.some(s => s.startsWith("Meta açıklama 4 karakter")));
  assert.ok(tr.some(s => s.includes("2 H1")));
  assert.ok(tr.some(s => s.startsWith("Eksik etiketler: canonical, yapılandırılmış veri")));
  assert.ok(tr.some(s => s.includes("“kahve” metinde geçmiyor")));
  const en = ruleIssues(p, scoreSeo(p, "kahve", "en"), "en");
  assert.ok(en.includes("The page has no <title> tag."));
  assert.ok(en.every(s => !/[ğüşıöç]/i.test(s.replace("kahve", ""))));
});

test("cleanAi: sayılar kırpılır, N/A ve boşlar düşer, slug ASCII", () => {
  const a = cleanAi(aiObj());
  assert.equal(a.keywords.secondary.length, 5);
  assert.deepEqual(a.keywords.table.map(r => r.keyword), ["sosyal medya yönetimi", "içerik takvimi"]); // "-" satırı düşer
  assert.equal(a.keywords.table[1].volume, undefined); // N/A düşer
  assert.equal(a.generated_content.content.sections.length, 5);
  assert.equal(a.generated_content.content.sections[0].content, "Paragraf 1.\n\nİkinci.");
  assert.equal(a.generated_content.content.faq.length, 4);
  assert.equal(a.generated_content.slug, "sosyal-medya-yonetimi-rehberi");
  assert.deepEqual(a.generated_content.internal_link_suggestions, [{ anchor: "fiyatlar", topic: "fiyat sayfası" }]);
  assert.equal(cleanAi({}), null);
  assert.equal(cleanAi({ ...aiObj(), keywords: { primary: ["N/A"] } }), null);
  assert.equal(slugify("Çağrı Ölçüm İş Şablonu!"), "cagri-olcum-is-sablonu");
  // şema: yapılandırılmış çıktı kısıtları (min/max yok, additionalProperties false)
  assert.equal(SEO_SCHEMA.additionalProperties, false);
  assert.ok(!JSON.stringify(SEO_SCHEMA).match(/min|max/i));
});

/* ---------- indirme ---------- */
test("fetchPage: el ile yönlendirme, her adım denetlenir, sınır ve UA", async () => {
  const ff = fakeFetch({ pages: {
    "https://a.com/": { status: 301, headers: { location: "/b" } },
    "https://a.com/b": { status: 302, headers: { location: "https://c.com/" } },
    "https://c.com/": { status: 200, body: "<title>ok</title>" },
    "https://r.com/": { status: 302, headers: { location: "http://169.254.169.254/" } },
    "https://loop.com/": { status: 302, headers: { location: "https://loop.com/" } },
    "https://pdf.com/": { status: 200, type: "application/pdf", body: "x" },
    "https://e404.com/": { status: 404, body: "yok" },
    "https://big.com/": { status: 200, body: "<p>" + "a".repeat(500000) },
    "https://down.com/": new TypeError("conn"),
  } });
  const ok = await fetchPage(ff.f, "https://a.com/");
  assert.deepEqual(ok, { url: "https://c.com/", html: "<title>ok</title>" });
  assert.equal(ff.calls[0].init.redirect, "manual");
  assert.equal(ff.calls[0].init.headers["user-agent"], SEO_UA);
  assert.equal(SEO_UA, "SocialMediaCornerBot/1.0 (+https://socialmediacorner.co)");
  assert.deepEqual(await fetchPage(ff.f, "https://r.com/"), { reason: "redirect_blocked" });
  assert.ok(!ff.calls.some(c => c.url.includes("169.254")));
  const n = ff.calls.length;
  assert.deepEqual(await fetchPage(ff.f, "https://loop.com/"), { reason: "too_many_redirects" });
  assert.equal(ff.calls.length - n, 6); // ilk istek + 5 yönlendirme
  assert.deepEqual(await fetchPage(ff.f, "https://pdf.com/"), { reason: "not_html" });
  assert.deepEqual(await fetchPage(ff.f, "https://e404.com/"), { reason: "http_404" });
  assert.deepEqual(await fetchPage(ff.f, "https://down.com/"), { reason: "conn" });
  assert.equal((await fetchPage(ff.f, "https://big.com/")).html.length, 400000);
  // zaman aşımı
  const slow = async function (u, init) {
    return new Promise((res, rej) => init.signal.addEventListener("abort", () => rej(init.signal.reason)));
  };
  assert.deepEqual(await fetchPage(slow, "https://s.com/", { ms: 30 }), { reason: "timeout" });
  // Latin-5 sayfa
  const l5 = new Uint8Array([0x3c, 0x70, 0x3e, 0xfe, 0xf0]); // <p>şğ
  const lf = async () => new Response(l5, { status: 200, headers: { "content-type": "text/html; charset=windows-1254" } });
  assert.equal((await fetchPage(lf, "https://l.com/")).html, "<p>şğ");
});

/* ---------- uç ---------- */
test("/gen/seo: oturum yoksa 401 login_required (GEN_LOGIN_REQUIRED kapalıyken de), ağa çıkılmaz", async () => {
  const t = setup();
  let r = await t.seo(undefined, { auth: null });
  assert.equal(r.status, 401);
  assert.equal(r.body.error, "login_required");
  r = await t.seo(undefined, { auth: "Bearer " + "Z".repeat(43) });
  assert.equal(r.status, 401);
  assert.equal(t.ff.calls.length, 0);
  // GEN_LOGIN_REQUIRED=1 da aynı
  const t2 = setup({ env: { GEN_LOGIN_REQUIRED: "1" } });
  assert.equal((await t2.seo(undefined, { auth: null })).status, 401);
  // deneme süresi biten demo
  r = await t.seo(undefined, { auth: BEARER("old") });
  assert.deepEqual([r.status, r.body.error], [403, "trial_ended"]);
});

test("/gen/seo: bad_url ve bad_input hak düşürmez", async () => {
  const t = setup();
  let r = await t.seo({ url: "http://127.0.0.1/", lang: "tr" });
  assert.deepEqual([r.status, r.body.error, r.body.reason], [400, "bad_url", "ip"]);
  r = await t.seo(null, { raw: "[1]" });
  assert.equal(r.status, 400);
  r = await t.seo({ url: "x".repeat(5000) });
  assert.equal(r.status, 413);
  assert.equal(t.used("pro"), 0);
  assert.equal(t.ff.calls.length, 0);
});

test("/gen/seo: mutlu yol (TR) — yanıt biçimi, puan, hak", async () => {
  const t = setup();
  const r = await t.seo();
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const b = r.body;
  assert.equal(b.ok, true);
  assert.equal(b.url, "https://ornek.com/rehber");
  assert.ok(!Number.isNaN(Date.parse(b.analyzed_at)));
  assert.deepEqual(Object.keys(b.seo_score.breakdown), ["title_quality", "meta_desc_quality", "h1_quality", "content_depth", "keyword_density", "bonus_points"]);
  assert.equal(b.seo_score.breakdown.bonus_points, 20);
  assert.equal(b.seo_score.breakdown.keyword_density, 20); // 16 geçiş / ~937 kelime ≈ %1,7
  assert.equal(b.seo_score.keyword.term, "sosyal medya yönetimi");
  assert.ok(b.seo_score.total >= 80 && b.seo_score.level === "Mükemmel" && b.seo_score.color === "green");
  assert.equal(b.page_info.h1, "Sosyal Medya Yönetimi & Rehberi");
  assert.deepEqual(b.page_info.h2s, ["Planlama", "Ölçüm"]);
  assert.equal(b.page_info.h1s, undefined);
  assert.equal(b.keywords.primary.length, 3);
  // AI sorunları tekilleşir ("İç bağlantı ekle." / "!")
  assert.equal(b.issues.filter(s => s.startsWith("İç bağlantı")).length, 1);
  assert.equal(b.generated_content.content.sections.length, 5);
  assert.deepEqual(b.seo_quota, { used: 1, limit: SEO_PER_DAY.pro });
  assert.equal(t.used("pro"), 1);
  // gen_daily ölçümü (produce ile aynı sütunlar)
  assert.deepEqual({ ...t.db.prepare("SELECT ok, fail, tok_in, tok_out FROM gen_daily WHERE day = ?").get(seoDay().slice(4)) }, { ok: 1, fail: 0, tok_in: 10, tok_out: 20 });
  // model isteği: şema, dil, sayfa verisi <page> içinde
  const an = t.ff.calls.find(c => c.url === AN);
  const req = JSON.parse(an.init.body);
  assert.equal(req.output_config.format.type, "json_schema");
  assert.match(req.messages[0].content, /Turkish/);
  assert.match(req.messages[0].content, /<page>[\s\S]*Title: Sosyal medya yönetimi rehberi[\s\S]*<\/page>/);
  // kalan hak sorgusu hak düşürmez
  const q = await t.seo({ check: true });
  assert.deepEqual([q.status, q.body.charged, q.body.seo_quota], [200, false, { used: 1, limit: 25 }]);
  assert.equal(t.used("pro"), 1);
});

test("/gen/seo: İngilizce istek İngilizce sorun ve seviye döner", async () => {
  const t = setup({ fetch: fakeFetch({ ai: () => aiObj("en") }) });
  const r = await t.seo({ url: "ornek.com/rehber", lang: "en" });
  assert.equal(r.status, 200);
  assert.equal(r.body.seo_score.level, "Excellent");
  const req = JSON.parse(t.ff.calls.find(c => c.url === AN).init.body);
  assert.match(req.messages[0].content, /^Write every string value in English/);
  assert.ok(r.body.issues.includes("Add internal links."));
});

test("/gen/seo: günlük sınır 429 seo_limit; sınır plana göre", async () => {
  const t = setup();
  t.db.prepare("INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, 'so', ?)").run(seoDay(), "u:" + UID.demo, SEO_PER_DAY.demo);
  const r = await t.seo(undefined, { auth: BEARER("demo") });
  assert.equal(r.status, 429);
  assert.deepEqual([r.body.error, r.body.limit, r.body.used], ["seo_limit", 3, 3]);
  assert.equal(t.ff.calls.length, 0);
  assert.equal(t.used("demo"), 3);
  assert.deepEqual(SEO_PER_DAY, { demo: 3, basic: 10, pro: 25, enterprise: 50 });
  const q = await t.seo({ check: true }, { auth: BEARER("ent") });
  assert.deepEqual(q.body.seo_quota, { used: 0, limit: 50 });
  const b = await t.seo({ check: true }, { auth: BEARER("basic") });
  assert.equal(b.body.seo_quota.limit, 10);
});

test("/gen/seo: indirme ve model hatasında hak iade edilir", async () => {
  const t = setup({ fetch: fakeFetch({ pages: { "https://ornek.com/rehber": { status: 503, body: "x" }, "https://pdf.com/": { status: 200, type: "application/pdf", body: "x" } } }) });
  let r = await t.seo();
  assert.deepEqual([r.status, r.body.error, r.body.reason], [422, "fetch_failed", "http_503"]);
  r = await t.seo({ url: "https://pdf.com/" });
  assert.deepEqual([r.status, r.body.reason], [422, "not_html"]);
  assert.equal(t.used("pro"), 0);

  const t2 = setup({ fetch: fakeFetch({ anth: () => Response.json({ stop_reason: "end_turn", model: "m", usage: {}, content: [{ type: "text", text: "{\"keywords\":{}}" }] }) }) });
  r = await t2.seo();
  assert.deepEqual([r.status, r.body.error], [502, "llm_fail"]);
  assert.equal(t2.used("pro"), 0);
  assert.equal(t2.db.prepare("SELECT fail FROM gen_daily WHERE day = ?").get(seoDay().slice(4)).fail, 1);

  const t3 = setup({ fetch: fakeFetch({ anth: () => Response.json({ stop_reason: "refusal", model: "m", usage: {}, content: [] }) }) });
  r = await t3.seo();
  assert.deepEqual([r.status, r.body.error], [422, "refused"]);
  assert.equal(t3.used("pro"), 0);
  assert.equal(t3.db.prepare("SELECT refused FROM gen_daily WHERE day = ?").get(seoDay().slice(4)).refused, 1);

  // indirme sırasında beklenmedik hata: 422 fetch_failed, hak iade
  const t4 = setup({ fetch: { calls: [], f: async () => ({ status: 200, headers: { get() { throw new Error("boom"); } } }) } });
  r = await t4.seo();
  assert.deepEqual([r.status, r.body.error, r.body.reason], [422, "fetch_failed", "parse"]);
  assert.equal(t4.used("pro"), 0);
});

test("/gen/seo: GEN_PROVIDER=fake + DEV_ORIGINS model çağırmaz", async () => {
  const t = setup({ env: { GEN_PROVIDER: "fake", DEV_ORIGINS: "http://localhost:8788" } });
  const r = await t.seo();
  assert.equal(r.status, 200);
  assert.ok(!t.ff.calls.some(c => c.url === AN));
  assert.match(r.body.generated_content.seo_title, /ÖRNEK/);
});
