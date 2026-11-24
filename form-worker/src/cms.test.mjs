// node --test src/cms.test.mjs — A14 otomatik blog yazarı (src/cms.js): kapı (CMS_ENABLED / tablo yok → 503), plan site sınırı,
// yanıtlarda ve dışa aktarmada sır yok, kota önden düşme + iade, İstanbul zamanlaması, 90 gün temizliği, OAuth bilet akışı,
// bağlantı kaldırma / hesap silme, izin listesi. D1 yerine node:sqlite; gerçek ağ yok (fetch sahte, sağlayıcı probe'ları taklit).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";
import { createHash, pbkdf2Sync } from "node:crypto";

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "cloudflare:sockets") return { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true };
    if (spec === "cloudflare:email") return { url: "data:text/javascript,export class EmailMessage{}", shortCircuit: true };
    return next(spec, ctx);
  },
});

// Gerçek ağ çağrısı olmasın: her test kendi sahte f'sini verir; genel fetch çağrılırsa test düşer
globalThis.fetch = async () => { throw new Error("gerçek ağ çağrısı yasak"); };

const { platform } = await import("./platform.js");
const { APP_ROUTES } = await import("./sites.js");
const { nextRunAt, cmsPurge, cmsTick, cmsOAuthCallback } = await import("./cms.js");
const { PROVIDERS } = await import("./cms-providers.js");

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const SCHEMA = read("../schema.sql");
const BASE = ["0001_metrics", "0002_oauth", "0003_sync", "0004_sync_changes", "0006_posts", "0018_plans"].map(n => read(`../migrations/${n}.sql`));
const CMS = read("../migrations/0019_cms.sql");

function d1(db) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })) }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes), last_row_id: Number(i.lastInsertRowid) } }; },
    raw: () => ({ sql, args }),
  });
  // D1 batch gibi: her ifade için {results, meta}; tek işlem
  const batch = async list => {
    db.exec("BEGIN");
    try {
      const out = list.map(s => {
        const { sql, args } = s.raw(), p = db.prepare(sql);
        if (p.columns().length) return { results: p.all(...args).map(r => ({ ...r })), meta: {} };
        const i = p.run(...args);
        return { results: [], meta: { changes: Number(i.changes) } };
      });
      db.exec("COMMIT");
      return out;
    } catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  return { prepare: sql => stmt(sql), batch };
}

const APP = "https://app.socialmediacorner.co", SMC = "app.socialmediacorner.co";
const hash = t => createHash("sha256").update(t).digest("hex");
const tok = ch => ch.repeat(43);
const KEY = "x".repeat(16) + "ABCD"; // sahte anahtar (son 4: ABCD)
const b64u = b => Buffer.from(b).toString("base64url");

// smc: kullanıcı 1 (A), 2 (M); brandcorner.co: 3 (B)
function freshDb({ cms = true } = {}) {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  for (const m of BASE) db.exec(m);
  if (cms) db.exec(CMS);
  const u = (site, email) => Number(db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, ?, ?, 'brand', 'x')").run(site, email, email.split("@")[0]).lastInsertRowid);
  const s = (t, uid) => db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(hash(t), uid);
  s(tok("A"), u(SMC, "a@ornek.test"));
  s(tok("M"), u(SMC, "m@ornek.test"));
  s(tok("B"), u("brandcorner.co", "b@ornek.test"));
  // C1: blog otomatiği Pro'dan itibaren (demo/basic cms_sites 0 → 403 plan_required); testlerin varsayılanı pro
  db.exec("UPDATE users SET plan = 'pro'");
  return db;
}

const ENV = {
  PBKDF2_ITER: "10000", ACCOUNTS_ENABLED: "1", CMS_ENABLED: "1", OAUTH_TOKEN_KEY: Buffer.alloc(32, 7).toString("base64"),
  GEN_ENABLED: "1", ANTHROPIC_API_KEY: "test", GEN_SALT: "salt", TURNSTILE_SECRET: "t", GEN_MODEL: "m",
  WPCOM_CLIENT_ID: "cid", WPCOM_CLIENT_SECRET: "csecret",
};
function setup(db = freshDb(), extra = {}) {
  const env = { DB: d1(db), ...ENV, ...extra };
  const call = async (method, path, { token = tok("A"), body, origin = APP } = {}) => {
    const headers = { "cf-connecting-ip": "10.0.0.1", "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const res = await platform(req, new URL(req.url), env, origin, async () => {});
    return { status: res.status, body: await res.json() };
  };
  return { db, env, call };
}

// Sağlayıcı taklitleri (ağ yok); her test sonunda geri alınır
function stubProviders(t) {
  const hp = PROVIDERS.hubspot, wp = PROVIDERS.wpcom;
  const orig = { probe: hp.probe, wprobe: wp.probe, exchange: wp.oauth.exchange };
  hp.probe = async inputs => ({ ok: true, account: { name: "Blog", url: "https://blog.example.test" }, options: {}, config: {}, creds: { api_key: inputs.api_key } });
  wp.oauth.exchange = async () => ({ ok: true, creds: { access_token: "tok-sahte-" + "y".repeat(20) }, config: { blog_id: "123", blog_url: "https://wp.example.test" } });
  wp.probe = async inputs => ({ ok: true, account: { name: "WP Blog", url: "https://wp.example.test" }, options: {}, config: { blog_id: inputs.blog_id }, creds: { access_token: inputs.access_token } });
  t.after(() => { hp.probe = orig.probe; wp.probe = orig.wprobe; wp.oauth.exchange = orig.exchange; });
}
const connect = (call, token = tok("A"), extra = {}) => call("POST", "/app/cms/connect", { token, body: { platform: "hubspot", inputs: { api_key: KEY }, ...extra } });

// Sır taşıyan alan adı ya da değer içeriyor mu (yalnız hint serbest)
function noSecrets(obj) {
  const s = JSON.stringify(obj);
  for (const k of ["secret_box", "token_box", "api_key", "access_token", "client_secret", "refresh_token"]) assert.ok(!s.includes(`"${k}"`), k);
  assert.ok(!s.includes(KEY), "anahtar değeri");
  assert.ok(!s.includes("tok-sahte-"), "token değeri");
}

// ---- kapı ----
test("CMS_ENABLED kapalı → 503 not_ready", async () => {
  const { call } = setup(freshDb(), { CMS_ENABLED: "0" });
  const r = await call("GET", "/app/cms");
  assert.deepEqual([r.status, r.body.error], [503, "not_ready"]);
});

test("0019 uygulanmamış (tablo yok) → 503 not_ready", async () => {
  const { call } = setup(freshDb({ cms: false }));
  for (const [m, p] of [["GET", "/app/cms"], ["GET", "/app/cmsposts"], ["POST", "/app/cms/1/pause"]]) {
    const r = await call(m, p, { body: m === "POST" ? {} : undefined });
    assert.deepEqual([r.status, r.body.error], [503, "not_ready"], p);
  }
});

// ---- plan site sınırı ----
// 24.11: pro ve enterprise tek site; enterprise'a ek site plan_limits.cms_sites ile (iletişimle) verilir
for (const [plan, limit, limits] of [["pro", 1], ["enterprise", 1, '{"linkedin_blog":50}'], ["enterprise", 3, '{"cms_sites":3}']]) {
  test(`connect plan sınırı: ${plan} ${limit}, fazlası 403 site_limit`, async t => {
    stubProviders(t);
    const { db, call } = setup();
    db.prepare("UPDATE users SET plan = ?, plan_limits = ? WHERE id = 1").run(plan, limits ?? null);
    for (let i = 0; i < limit; i++) {
      const r = await connect(call);
      assert.equal(r.status, 200, `${i}: ${JSON.stringify(r.body)}`);
    }
    const over = await connect(call);
    assert.deepEqual([over.status, over.body.error], [403, "site_limit"]);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_sites WHERE user_id = 1").get().n, limit);
    const l = await call("GET", "/app/cms");
    assert.deepEqual(l.body.limits, { sites: limit, used: limit, per_week_max: plan === "enterprise" ? 7 : 3, plan_required: null });
  });
}

// 24.11 öncesi 2 sitesi olan pro kullanıcı: siteler görünür ve yönetilir, yeni bağlantı 403 (0'a inene dek)
test("sınır 1'e indi, 2 etkin site: GET used 2, pause/resume/disconnect 200, connect 0'a dek 403", async t => {
  stubProviders(t);
  const { db, call } = setup();
  db.prepare("UPDATE users SET plan = 'enterprise', plan_limits = '{\"cms_sites\":2}' WHERE id = 1").run();
  const a = (await connect(call)).body.site, b = (await connect(call)).body.site;
  assert.ok(a?.id && b?.id);
  db.prepare("UPDATE users SET plan = 'pro', plan_limits = NULL WHERE id = 1").run();
  const l = await call("GET", "/app/cms");
  assert.deepEqual([l.status, l.body.sites.length, l.body.limits.sites, l.body.limits.used], [200, 2, 1, 2]);
  assert.deepEqual((await connect(call)).body.error, "site_limit");
  const pz = await call("POST", `/app/cms/${a.id}/pause`, { body: {} });
  assert.deepEqual([pz.status, pz.body.site.state], [200, "duraklatildi"]);
  const rs = await call("POST", `/app/cms/${a.id}/resume`, { body: {} });
  assert.deepEqual([rs.status, rs.body.site.state], [200, "aktif"]);
  assert.equal((await call("POST", `/app/cms/${a.id}/disconnect`, { body: {} })).status, 200);
  const over = await connect(call);
  assert.deepEqual([over.status, over.body.error], [403, "site_limit"]);
  assert.equal((await call("POST", `/app/cms/${b.id}/disconnect`, { body: {} })).status, 200);
  assert.equal((await connect(call)).status, 200);
});

// ---- C1 plan kapısı: demo/basic (cms_sites 0) ve plan yok → 403 plan_required {plan:"pro"}; okuma, duraklatma, kaldırma serbest ----
for (const plan of ["demo", "basic", "bilinmeyen"]) {
  test(`plan kapısı: ${plan} → yazan uçlar 403 plan_required; GET/pause/disconnect serbest; limits kilitli`, async t => {
    stubProviders(t);
    const { db, call } = setup();
    const s = (await connect(call)).body.site; // pro iken bağlandı
    db.prepare("UPDATE users SET plan = ?, created_at = datetime('now') WHERE id = 1").run(plan);
    const gated = [
      ["/app/cms/probe", { platform: "hubspot", inputs: { api_key: KEY } }],
      ["/app/cms/connect", { platform: "hubspot", inputs: { api_key: KEY }, settings: DAILY }], // plan_frequency/site_limit'ten önce
      [`/app/cms/${s.id}/settings`, { per_week: 1, days: [1] }],
      [`/app/cms/${s.id}/run`, { rid: RID }],
      [`/app/cms/${s.id}/resume`, {}],
      ["/app/cmsposts/999/retry", {}],
      ["/app/cmsoauth/start", { platform: "wpcom" }],
      ["/app/cmsoauth/finish", { ticket: "x".repeat(43) }],
    ];
    for (const [p, body] of gated) {
      const r = await call("POST", p, { body });
      assert.deepEqual([r.status, r.body.ok, r.body.error, r.body.plan], [403, false, "plan_required", "pro"], p);
    }
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_sites").get().n, 1);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_posts").get().n, 0);
    const l = await call("GET", "/app/cms");
    assert.equal(l.status, 200);
    assert.deepEqual(l.body.limits, { sites: 0, used: 1, per_week_max: 0, plan_required: "pro" });
    assert.equal((await call("GET", "/app/cmsposts")).status, 200);
    const pz = await call("POST", `/app/cms/${s.id}/pause`, { body: {} });
    assert.deepEqual([pz.status, pz.body.site.state], [200, "duraklatildi"]);
    assert.equal((await call("POST", `/app/cms/${s.id}/disconnect`, { body: {} })).status, 200);
    // Pro'ya geçince yeniden bağlanır
    db.prepare("UPDATE users SET plan = 'pro' WHERE id = 1").run();
    assert.equal((await connect(call)).status, 200);
    assert.equal((await call("GET", "/app/cms")).body.limits.plan_required, null);
  });
}

test("plan kapısı: cmsTick basic'e düşen kullanıcının aktif sitesini üretmeden duraklatır (plan_required); Pro'da resume", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const s = (await connect(call)).body.site;
  db.prepare("UPDATE users SET plan = 'basic' WHERE id = 1").run();
  db.prepare("UPDATE cms_sites SET next_run_at = datetime('now', '-1 minutes') WHERE id = ?").run(s.id);
  const calls = [];
  const out = await cmsTick(env, async url => { calls.push(String(url)); return LLM_OK(); }, { log: () => {} });
  assert.equal(out.plan_paused, 1, JSON.stringify(out));
  assert.deepEqual([out.scheduled, out.quota, out.produced, calls.length], [0, 0, 0, 0]);
  assert.deepEqual(counters(db), { lb: 0, u: 0 });
  const row = db.prepare("SELECT state, last_error, next_run_at, lease_until FROM cms_sites WHERE id = ?").get(s.id);
  assert.deepEqual({ ...row }, { state: "duraklatildi", last_error: "plan_required", next_run_at: null, lease_until: null });
  const l = await call("GET", "/app/cms");
  assert.deepEqual([l.body.sites[0].state, l.body.sites[0].last_error], ["duraklatildi", "plan_required"]);
  assert.deepEqual((await call("POST", `/app/cms/${s.id}/resume`, { body: {} })).body.error, "plan_required");
  db.prepare("UPDATE users SET plan = 'pro' WHERE id = 1").run();
  const res = await call("POST", `/app/cms/${s.id}/resume`, { body: {} });
  assert.deepEqual([res.status, res.body.site.state, res.body.site.last_error], [200, "aktif", null]);
});

// ---- C1 Cloudflare Pages: DB'de platform github + config.host cloudflare; çıktıda provider "cloudflare" ----
test("cloudflare: providers'ta github'ın ardından (stored_as github); connect platform github + config.host; site.provider cloudflare", async t => {
  const gh = PROVIDERS.github, orig = gh.probe;
  gh.probe = async inputs => ({ ok: true, account: { name: `${inputs.owner}/${inputs.repo}`, url: `https://github.com/${inputs.owner}/${inputs.repo}` }, options: {},
    config: { owner: inputs.owner, repo: inputs.repo, branch: "main", ssg: "hugo", path_template: "content/posts/{slug}.md" }, creds: { token: inputs.token } });
  t.after(() => { gh.probe = orig; });
  const { db, call } = setup();
  // iki site bağlanıyor: pro tek site (24.11), ek site enterprise plan_limits.cms_sites ile
  db.prepare("UPDATE users SET plan = 'enterprise', plan_limits = '{\"cms_sites\":3}' WHERE id = 1").run();
  const l0 = await call("GET", "/app/cms");
  const ids = l0.body.providers.map(p => p.id);
  assert.equal(ids[ids.indexOf("github") + 1], "cloudflare");
  const cf = l0.body.providers.find(p => p.id === "cloudflare");
  assert.deepEqual([cf.name, cf.auth, cf.stored_as], ["Cloudflare Pages", "key", "github"]);
  assert.ok(cf.fields.some(f => f.key === "base_url" && f.required === false));
  for (const p of l0.body.providers) assert.equal(p.stored_as, p.id === "cloudflare" ? "github" : p.id, p.id);
  const inputs = { owner: "acme", repo: "site", token: "github_pat_" + "z".repeat(20), ssg: "hugo", base_url: "acme.pages.dev" };
  const pr = await call("POST", "/app/cms/probe", { body: { platform: "cloudflare", inputs } });
  assert.deepEqual([pr.status, pr.body.account.url], [200, "https://acme.pages.dev/"], JSON.stringify(pr.body));
  const c = await call("POST", "/app/cms/connect", { body: { platform: "cloudflare", inputs } });
  assert.equal(c.status, 200, JSON.stringify(c.body));
  assert.deepEqual([c.body.site.platform, c.body.site.provider, c.body.site.base_url], ["github", "cloudflare", "https://acme.pages.dev/"]);
  const row = db.prepare("SELECT platform, config FROM cms_sites WHERE id = ?").get(c.body.site.id);
  assert.equal(row.platform, "github");
  const cfg = JSON.parse(row.config);
  assert.deepEqual([cfg.host, cfg.pages_url, cfg.repo], ["cloudflare", "https://acme.pages.dev/", "site"]);
  // düz GitHub satırı provider = platform
  const g = await call("POST", "/app/cms/connect", { body: { platform: "github", inputs: { ...inputs, base_url: undefined } } });
  assert.deepEqual([g.status, g.body.site.platform, g.body.site.provider], [200, "github", "github"]);
  const l = await call("GET", "/app/cms");
  assert.deepEqual(l.body.sites.map(s => s.provider).sort(), ["cloudflare", "github"]);
  // ayar değişikliği config.host'u korur
  const st = await call("POST", `/app/cms/${c.body.site.id}/settings`, { body: { per_week: 1, days: [2] } });
  assert.deepEqual([st.status, st.body.site.provider], [200, "cloudflare"]);
  // geçersiz Pages adresi → 400 benzeri hata, satır eklenmez
  const bad = await call("POST", "/app/cms/connect", { body: { platform: "cloudflare", inputs: { ...inputs, base_url: "http://127.0.0.1" } } });
  assert.equal(bad.body.ok, false);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_sites").get().n, 2);
});

test("kaldırılan site sınıra sayılmaz", async t => {
  stubProviders(t);
  const { db, call } = setup();
  db.prepare("UPDATE users SET plan = 'enterprise', plan_limits = '{\"cms_sites\":1}' WHERE id = 1").run();
  const a = await connect(call);
  assert.equal((await connect(call)).status, 403);
  assert.equal((await call("POST", `/app/cms/${a.body.site.id}/disconnect`, { body: {} })).status, 200);
  assert.equal((await connect(call)).status, 200);
});

// ---- sır yok ----
test("connect/list/export yanıtlarında sır yok; yalnız hint", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const c = await connect(call);
  assert.equal(c.status, 200);
  assert.equal(c.body.site.hint, "ABCD");
  noSecrets(c.body);
  assert.ok(db.prepare("SELECT secret_box FROM cms_sites").get().secret_box, "şifreli kutu DB'de");
  assert.ok(!db.prepare("SELECT secret_box FROM cms_sites").get().secret_box.includes(KEY), "DB'de düz anahtar yok");
  const l = await call("GET", "/app/cms");
  assert.equal(l.status, 200);
  noSecrets({ sites: l.body.sites, posts: l.body.posts }); // providers[].fields alan tanımı (api_key adı) içerir, değer değil
  assert.ok(!JSON.stringify(l.body).includes(KEY));
  assert.equal(l.body.sites[0].hint, "ABCD");
  const e = await call("GET", "/app/export");
  assert.equal(e.status, 200);
  assert.equal(e.body.cms_sites.length, 1);
  assert.ok(!("hint" in e.body.cms_sites[0]) && !("secret_box" in e.body.cms_sites[0]));
  noSecrets(e.body);
});

// ---- kota ----
const LLM_OK = () => new Response(JSON.stringify({
  stop_reason: "end_turn", model: "m", usage: {},
  content: [{ type: "text", text: JSON.stringify({ drafts: [{ angle: "blog", title: "Başlık", meta: "açıklama", text: "Giriş paragrafı.\n\n## Bölüm\n\nMetin." }] }) }],
}), { status: 200, headers: { "content-type": "application/json" } });
const LLM_FAIL = () => new Response(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "x" } }), { status: 400, headers: { "content-type": "application/json" } });
const counters = db => ({
  lb: db.prepare("SELECT COALESCE(SUM(n), 0) AS n FROM gen_month WHERE user_id = 1 AND kind = 'lb'").get().n,
  u: db.prepare("SELECT COALESCE(SUM(n), 0) AS n FROM gen_usage WHERE kind = 'u'").get().n,
});
const RID = "123e4567-e89b-42d3-a456-426614174000";

test("run kotayı önden düşer; aynı rid aynı yazı; cmsTick üretimde tekrar düşmez", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const s = (await connect(call)).body.site;
  const r = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.post.state, "uretiliyor");
  assert.deepEqual(counters(db), { lb: 1, u: 1 });
  const again = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.equal(again.body.post.id, r.body.post.id);
  assert.deepEqual(counters(db), { lb: 1, u: 1 });
  const calls = [];
  const out = await cmsTick(env, async (url, init) => { calls.push(String(url)); return LLM_OK(); }, { log: () => {} });
  assert.equal(out.produced, 1, JSON.stringify(out));
  assert.ok(calls.every(u => u.startsWith("https://api.anthropic.com/")), calls.join());
  const p = db.prepare("SELECT * FROM cms_posts WHERE id = ?").get(r.body.post.id);
  assert.equal(p.state, "hazir");
  assert.equal(p.title, "Başlık");
  assert.equal(p.charged, 1);
  assert.deepEqual(counters(db), { lb: 1, u: 1 });
});

test("üretim başarısız → kota iade edilir (charged 0, basarisiz); iade tekrarlanmaz", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const s = (await connect(call)).body.site;
  const r = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.deepEqual(counters(db), { lb: 1, u: 1 });
  const out = await cmsTick(env, async () => LLM_FAIL(), { log: () => {} });
  assert.equal(out.produce_failed, 1, JSON.stringify(out));
  const p = db.prepare("SELECT * FROM cms_posts WHERE id = ?").get(r.body.post.id);
  assert.deepEqual([p.state, p.charged, p.last_error], ["basarisiz", 0, "llm_fail"]);
  assert.deepEqual(counters(db), { lb: 0, u: 0 });
  await cmsTick(env, async () => LLM_FAIL(), { log: () => {} });
  assert.deepEqual(counters(db), { lb: 0, u: 0 });
});

test("run: geçersiz rid 400; aylık kota doluysa 402 quota", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const s = (await connect(call)).body.site;
  assert.equal((await call("POST", `/app/cms/${s.id}/run`, { body: { rid: "x" } })).status, 400);
  const month = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 7);
  db.prepare("INSERT INTO gen_month (month, user_id, kind, n) VALUES (?, 1, 'lb', 40)").run(month);
  const r = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.deepEqual([r.status, r.body.error], [402, "quota"]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_posts").get().n, 0);
});

// ---- zamanlama ----
test("nextRunAt: İstanbul (UTC+3) saati ve doğru gün", () => {
  // 2026-11-24 Salı 06:00 UTC = 09:00 İstanbul
  const from = Date.UTC(2026, 10, 24, 6, 0, 0);
  assert.equal(nextRunAt([2], 10, from), "2026-11-24 07:00:00"); // aynı gün 10:00 İST
  assert.equal(nextRunAt([2], 9, from), "2026-12-01 06:00:00"); // 09:00 tam şimdi: kesin sonrası → gelecek Salı
  assert.equal(nextRunAt([3], 10, from), "2026-11-25 07:00:00"); // Çarşamba
  assert.equal(nextRunAt([1], 0, from), "2026-11-29 21:00:00"); // Pazartesi 00:00 İST = Pazar 21:00 UTC
  assert.equal(nextRunAt([7], 23, from), "2026-11-29 20:00:00"); // Pazar
  // UTC'de Pazartesi 22:00 = İstanbul'da Salı 01:00 → Salı 02:00 aynı gün
  assert.equal(nextRunAt([2], 2, Date.UTC(2026, 10, 23, 22, 0, 0)), "2026-11-23 23:00:00");
  assert.equal(nextRunAt([], 10, from), null);
  assert.equal(nextRunAt([2], 1.5, from), null);
});

// ---- 90 gün temizliği ----
test("cmsPurge: 90 günden eski gövde boşalır, yeni kalır; eski hazir iptal", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const s = (await connect(call)).body.site;
  const ins = db.prepare("INSERT INTO cms_posts (cms_site_id, user_id, slot, state, title, markdown, created_at) VALUES (?, 1, ?, ?, 'T', 'gövde', datetime('now', ?))");
  ins.run(s.id, "a", "gonderildi", "-100 days");
  ins.run(s.id, "b", "hazir", "-91 days");
  ins.run(s.id, "c", "gonderildi", "-10 days");
  ins.run(s.id, "d", "uretiliyor", "-100 days");
  assert.equal(await cmsPurge(env), 2);
  const rows = Object.fromEntries(db.prepare("SELECT slot, state, markdown FROM cms_posts").all().map(r => [r.slot, [r.state, r.markdown]]));
  assert.deepEqual(rows, { a: ["gonderildi", null], b: ["iptal", null], c: ["gonderildi", "gövde"], d: ["uretiliyor", "gövde"] });
  assert.equal(await cmsPurge(env), 0);
});

// ---- sıklık (blog otomatiği): per_week ∈ {1,2,3,7}, plan tavanı cms_per_week (demo/basic 0, pro 3, enterprise 7) ----
const DAILY = { per_week: 7, days: [1, 2, 3, 4, 5, 6, 7], hour: 9, lang: "tr" };

test("sıklık: enterprise per_week 7 (günde 1) bağlanır; sütunda 3, yanıtta 7; limits.per_week_max 7", async t => {
  stubProviders(t);
  const { db, call } = setup();
  db.prepare("UPDATE users SET plan = 'enterprise' WHERE id = 1").run();
  const r = await connect(call, tok("A"), { settings: DAILY });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual([r.body.site.per_week, r.body.site.days], [7, [1, 2, 3, 4, 5, 6, 7]]);
  assert.equal(db.prepare("SELECT per_week FROM cms_sites WHERE id = ?").get(r.body.site.id).per_week, 3); // 0019 CHECK 1..3
  const l = await call("GET", "/app/cms");
  assert.equal(l.body.limits.per_week_max, 7);
  assert.equal(l.body.sites[0].per_week, 7);
  // ayarlardan haftada 2'ye inip yeniden günde 1'e çıkabilir
  const s2 = await call("POST", `/app/cms/${r.body.site.id}/settings`, { body: { per_week: 2, days: [1, 4] } });
  assert.deepEqual([s2.status, s2.body.site.per_week], [200, 2]);
  const s7 = await call("POST", `/app/cms/${r.body.site.id}/settings`, { body: { per_week: 7, days: [7, 6, 5, 4, 3, 2, 1] } });
  assert.deepEqual([s7.status, s7.body.site.per_week, s7.body.site.days], [200, 7, [1, 2, 3, 4, 5, 6, 7]]);
});

test("sıklık: enterprise plan_limits.cms_per_week 2 → per_week_max 2, 3 reddedilir", async t => {
  stubProviders(t);
  const { db, call } = setup();
  db.prepare("UPDATE users SET plan = 'enterprise', plan_limits = '{\"cms_per_week\":2}' WHERE id = 1").run();
  assert.equal((await call("GET", "/app/cms")).body.limits.per_week_max, 2);
  const r = await connect(call, tok("A"), { settings: { per_week: 3, days: [1, 3, 5], hour: 9, lang: "tr" } });
  assert.deepEqual([r.status, r.body.error, r.body.max], [403, "plan_frequency", 2]);
});

for (const plan of ["pro"]) {
  test(`sıklık: ${plan} per_week 7 → 403 plan_frequency {max 3}; 3 olur; per_week_max 3`, async t => {
    stubProviders(t);
    const { db, call } = setup();
    db.prepare("UPDATE users SET plan = ?, created_at = datetime('now') WHERE id = 1").run(plan);
    const r = await connect(call, tok("A"), { settings: DAILY });
    assert.deepEqual([r.status, r.body.error, r.body.max], [403, "plan_frequency", 3]);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_sites").get().n, 0);
    assert.equal((await call("GET", "/app/cms")).body.limits.per_week_max, 3);
    const ok3 = await connect(call, tok("A"), { settings: { per_week: 3, days: [1, 3, 5], hour: 9, lang: "tr" } });
    assert.equal(ok3.status, 200, JSON.stringify(ok3.body));
    const up = await call("POST", `/app/cms/${ok3.body.site.id}/settings`, { body: DAILY });
    assert.deepEqual([up.status, up.body.error, up.body.max], [403, "plan_frequency", 3]);
  });
}

test("sıklık: pro'da oauth start da 403 plan_frequency", async t => {
  stubProviders(t);
  const { db, call } = setup();
  db.prepare("UPDATE users SET plan = 'pro' WHERE id = 1").run();
  const st = await call("POST", "/app/cmsoauth/start", { body: { platform: "wpcom", settings: DAILY } });
  assert.deepEqual([st.status, st.body.error, st.body.max], [403, "plan_frequency", 3]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM oauth_states").get().n, 0);
});

test("sıklık: per_week 1/2/3/7 dışı 400 per_week; days uzunluğu per_week'e eşit olmalı", async t => {
  stubProviders(t);
  const { db, call } = setup();
  db.prepare("UPDATE users SET plan = 'enterprise' WHERE id = 1").run();
  for (const pw of [0, 4, 5, 6, 8, "x"]) {
    const r = await connect(call, tok("A"), { settings: { per_week: pw, days: [1], hour: 9, lang: "tr" } });
    assert.deepEqual([r.status, r.body.error, r.body.field], [400, "bad_input", "per_week"], String(pw));
  }
  for (const [pw, days] of [[7, [1, 2, 3, 4, 5, 6]], [2, [1]], [3, [1, 2, 3, 4]], [7, [1, 1, 2, 3, 4, 5, 6]], [1, []]]) {
    const r = await connect(call, tok("A"), { settings: { per_week: pw, days, hour: 9, lang: "tr" } });
    assert.deepEqual([r.status, r.body.error, r.body.field], [400, "bad_input", "days"], JSON.stringify([pw, days]));
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_sites").get().n, 0);
});

test("sıklık: cmsTick plan düşmüşse üretmez, siteyi duraklatildi + plan_frequency yapar; resume 403", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  db.prepare("UPDATE users SET plan = 'enterprise' WHERE id = 1").run();
  const s = (await connect(call, tok("A"), { settings: DAILY })).body.site;
  db.prepare("UPDATE users SET plan = 'pro' WHERE id = 1").run();
  db.prepare("UPDATE cms_sites SET next_run_at = datetime('now', '-1 minutes') WHERE id = ?").run(s.id);
  const calls = [];
  const out = await cmsTick(env, async url => { calls.push(String(url)); return LLM_OK(); }, { log: () => {} });
  assert.equal(out.plan_paused, 1, JSON.stringify(out));
  assert.deepEqual([out.scheduled, out.quota, out.produced], [0, 0, 0]);
  assert.equal(calls.length, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_posts").get().n, 0);
  assert.deepEqual(counters(db), { lb: 0, u: 0 });
  const row = db.prepare("SELECT state, last_error, next_run_at, lease_until FROM cms_sites WHERE id = ?").get(s.id);
  assert.deepEqual({ ...row }, { state: "duraklatildi", last_error: "plan_frequency", next_run_at: null, lease_until: null });
  const l = await call("GET", "/app/cms");
  assert.deepEqual([l.body.sites[0].state, l.body.sites[0].last_error, l.body.sites[0].per_week], ["duraklatildi", "plan_frequency", 7]);
  const res = await call("POST", `/app/cms/${s.id}/resume`, { body: {} });
  assert.deepEqual([res.status, res.body.error, res.body.max], [403, "plan_frequency", 3]);
  // sıklığı düşürünce yeniden başlar
  assert.equal((await call("POST", `/app/cms/${s.id}/settings`, { body: { per_week: 3, days: [1, 3, 5] } })).status, 200);
  const res2 = await call("POST", `/app/cms/${s.id}/resume`, { body: {} });
  assert.deepEqual([res2.status, res2.body.site.state, res2.body.site.last_error], [200, "aktif", null]);
  // planı yeten site tikte normal zamanlanır
  db.prepare("UPDATE cms_sites SET next_run_at = datetime('now', '-1 minutes') WHERE id = ?").run(s.id);
  const out2 = await cmsTick(env, async () => LLM_OK(), { log: () => {} });
  assert.deepEqual([out2.plan_paused, out2.scheduled], [0, 1], JSON.stringify(out2));
});

// ---- OAuth (WordPress.com) ----
async function oauthFlow(t, call, env, token = tok("A")) {
  const st = await call("POST", "/app/cmsoauth/start", { token, body: { platform: "wpcom" } });
  assert.equal(st.status, 200, JSON.stringify(st.body));
  const state = new URL(st.body.url).searchParams.get("state");
  assert.match(state, /^[A-Za-z0-9_-]{43}$/);
  const res = await cmsOAuthCallback(new Request(`https://forms.test/oauth/cms/wpcom/callback?state=${state}&code=kod`), env, "wpcom");
  assert.equal(res.status, 302);
  const loc = new URL(res.headers.get("location"));
  return loc.searchParams.get("cms_bilet");
}

test("OAuth callback cms_sites'a yazmaz, bilet döner; doğru kullanıcı finish ile bağlar", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const ticket = await oauthFlow(t, call, env);
  assert.match(ticket, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_sites").get().n, 0);
  const row = db.prepare("SELECT * FROM oauth_states WHERE ticket_hash = ?").get(hash(ticket));
  assert.ok(row && !String(row.code).includes("tok-sahte-"), "bilet yükü şifreli");
  const f = await call("POST", "/app/cmsoauth/finish", { body: { ticket } });
  assert.equal(f.status, 200, JSON.stringify(f.body));
  assert.deepEqual([f.body.site.platform, f.body.site.state], ["wpcom", "aktif"]);
  noSecrets(f.body);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_sites WHERE user_id = 1").get().n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM oauth_states WHERE ticket_hash = ?").get(hash(ticket)).n, 0);
  // tek kullanımlık
  assert.equal((await call("POST", "/app/cmsoauth/finish", { body: { ticket } })).status, 403);
});

test("OAuth dönüş yolu: varsayılan /blog-otomatik (en: /en/blog-autopilot); body.back yalnız izin listesinden", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const ret = async (body, lang) => {
    db.exec("DELETE FROM oauth_states");
    if (lang) db.prepare("UPDATE users SET lang = ? WHERE id = 1").run(lang);
    const st = await call("POST", "/app/cmsoauth/start", { body: { platform: "wpcom", ...body } });
    assert.equal(st.status, 200, JSON.stringify(st.body));
    return new URL(db.prepare("SELECT return_to FROM oauth_states").get().return_to).pathname;
  };
  assert.equal(await ret({}), "/blog-otomatik");
  assert.equal(await ret({ back: "/hesap/baglantilar" }), "/hesap/baglantilar");
  assert.equal(await ret({ back: "/en/blog-autopilot" }), "/en/blog-autopilot");
  assert.equal(await ret({ back: "https://evil.test/x" }), "/blog-otomatik");
  assert.equal(await ret({ back: "//evil.test" }), "/blog-otomatik");
  const hasLang = db.prepare("SELECT COUNT(*) AS n FROM pragma_table_info('users') WHERE name = 'lang'").get().n;
  if (hasLang) assert.equal(await ret({}, "en"), "/en/blog-autopilot");
});

test("OAuth finish başka kullanıcının biletiyle → 403, bilet yanar, hiçbir şey bağlanmaz", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const ticket = await oauthFlow(t, call, env, tok("A"));
  const r = await call("POST", "/app/cmsoauth/finish", { token: tok("M"), body: { ticket } });
  assert.deepEqual([r.status, r.body.error], [403, "forbidden"]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM oauth_states WHERE ticket_hash = ?").get(hash(ticket)).n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_sites").get().n, 0);
  assert.equal((await call("POST", "/app/cmsoauth/finish", { token: tok("A"), body: { ticket } })).status, 403);
});

test("OAuth süresi dolmuş bilet → 403", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const ticket = await oauthFlow(t, call, env);
  db.prepare("UPDATE oauth_states SET expires_at = datetime('now', '-1 minute') WHERE ticket_hash = ?").run(hash(ticket));
  const r = await call("POST", "/app/cmsoauth/finish", { body: { ticket } });
  assert.deepEqual([r.status, r.body.error], [403, "forbidden"]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_sites").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM oauth_states WHERE ticket_hash = ?").get(hash(ticket)).n, 0);
});

// ---- kaldırma / hesap silme ----
test("disconnect: anahtarlar silinir, hazir yazılar iptal, gönderilmiş kalır", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const s = (await connect(call)).body.site;
  const ins = db.prepare("INSERT INTO cms_posts (cms_site_id, user_id, slot, state, title, markdown) VALUES (?, 1, ?, ?, 'T', 'm')");
  ins.run(s.id, "h", "hazir");
  ins.run(s.id, "g", "gonderildi");
  const r = await call("POST", `/app/cms/${s.id}/disconnect`, { body: {} });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual([r.body.site.state, r.body.site.hint], ["kaldirildi", null]);
  const row = db.prepare("SELECT * FROM cms_sites WHERE id = ?").get(s.id);
  assert.deepEqual([row.secret_box, row.token_box, row.hint, row.state], [null, null, null, "kaldirildi"]);
  const st = Object.fromEntries(db.prepare("SELECT slot, state FROM cms_posts").all().map(x => [x.slot, x.state]));
  assert.deepEqual(st, { h: "iptal", g: "gonderildi" });
  // başka kullanıcı başkasının sitesine erişemez
  assert.equal((await call("POST", `/app/cms/${s.id}/pause`, { token: tok("M"), body: {} })).status, 404);
});

test("deleteAccount cms_posts ve cms_sites'ı siler", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const s = (await connect(call)).body.site;
  db.prepare("INSERT INTO cms_posts (cms_site_id, user_id, slot, state) VALUES (?, 1, 'x', 'gonderildi')").run(s.id);
  const salt = Buffer.alloc(16, 3), pw = "parola-12345";
  db.prepare("UPDATE users SET pass = ? WHERE id = 1").run(`pbkdf2$10000$${b64u(salt)}$${b64u(pbkdf2Sync(pw, salt, 10000, 32, "sha256"))}`);
  const r = await call("POST", "/app/account/delete", { body: { password: pw } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_posts").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_sites").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users WHERE id = 1").get().n, 0);
});

// ---- izin listesi ----
test("APP_ROUTES: smc CMS uçlarına izin verir, brandcorner.co'da yok", async t => {
  for (const k of ["GET /app/cms", "GET /app/cmsposts", "POST /app/cms/connect", "POST /app/cms/:id/run", "POST /app/cms/:id/disconnect", "POST /app/cmsoauth/start", "POST /app/cmsoauth/finish"])
    assert.ok(APP_ROUTES.includes(k), k);
  stubProviders(t);
  const { call } = setup();
  assert.equal((await call("GET", "/app/cms")).status, 200);
  const bc = await call("GET", "/app/cms", { token: tok("B"), origin: "https://brandcorner.co" });
  assert.deepEqual([bc.status, bc.body.error], [404, "not_found"]);
  const bc2 = await call("POST", "/app/cms/connect", { token: tok("B"), origin: "https://brandcorner.co", body: { platform: "hubspot", inputs: { api_key: KEY } } });
  assert.equal(bc2.status, 404);
});
