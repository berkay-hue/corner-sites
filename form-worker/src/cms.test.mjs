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
const CMS = ["0019_cms", "0021_cms_send_now"].map(n => read(`../migrations/${n}.sql`)).join("\n");

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
  WPCOM_CLIENT_ID: "cid", WPCOM_CLIENT_SECRET: "csecret", CMS_LEAD_HOURS: "0", // önden hazırlama kapalı: eski testler saatten bağımsız
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

// ---- "Şimdi bir yazı yaz" (25.11): site başına günde 1 elle tetik, aktif olmayan sitede 409, takvim bozulmaz ----
const RID2 = "223e4567-e89b-42d3-a456-426614174001", RID3 = "323e4567-e89b-42d3-a456-426614174002";
const cmN = db => db.prepare("SELECT COALESCE(SUM(n), 0) AS n FROM gen_usage WHERE kind = 'cm'").get().n;

test("şimdi yaz: oturum yok 401, başka kullanıcının sitesi 404, Pro altı plan 403 plan_required", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const s = (await connect(call)).body.site;
  const anon = await call("POST", `/app/cms/${s.id}/run`, { token: null, body: { rid: RID } });
  assert.equal(anon.status, 401, JSON.stringify(anon.body));
  const other = await call("POST", `/app/cms/${s.id}/run`, { token: tok("M"), body: { rid: RID } });
  assert.deepEqual([other.status, other.body.error], [404, "not_found"]);
  for (const plan of ["basic", "demo"]) {
    db.prepare("UPDATE users SET plan = ?, created_at = datetime('now') WHERE id = 1").run(plan);
    const r = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
    assert.deepEqual([r.status, r.body.error, r.body.plan], [403, "plan_required", "pro"], plan);
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_posts").get().n, 0);
  assert.deepEqual({ ...counters(db), cm: cmN(db) }, { lb: 0, u: 0, cm: 0 });
});

test("şimdi yaz: günde 1 tetik → ikinci rid 429 daily_limit (kota düşmez); aynı rid idempotent; başka site ayrı hak", async t => {
  stubProviders(t);
  const db = freshDb();
  db.prepare("UPDATE users SET plan = 'enterprise', plan_limits = '{\"cms_sites\":2}' WHERE id = 1").run();
  const { call } = setup(db);
  const s = (await connect(call)).body.site;
  const r = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.post.state, "uretiliyor");
  assert.deepEqual({ ...counters(db), cm: cmN(db) }, { lb: 1, u: 1, cm: 1 });
  const same = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.deepEqual([same.status, same.body.post.id], [200, r.body.post.id]);
  const second = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID2 } });
  assert.deepEqual([second.status, second.body.error], [429, "daily_limit"]);
  assert.match(second.body.reset_at, /^\d{4}-\d{2}-\d{2}T21:00:00/);
  assert.deepEqual({ ...counters(db), cm: cmN(db) }, { lb: 1, u: 1, cm: 1 });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_posts").get().n, 1);
  // ikinci site kendi günlük hakkını kullanır
  const s2 = (await call("POST", "/app/cms/connect", { body: { platform: "hubspot", inputs: { api_key: "z".repeat(16) + "WXYZ" } } })).body.site;
  assert.ok(s2?.id, "ikinci site");
  const r2 = await call("POST", `/app/cms/${s2.id}/run`, { body: { rid: RID3 } });
  assert.equal(r2.status, 200, JSON.stringify(r2.body));
  assert.deepEqual({ ...counters(db), cm: cmN(db) }, { lb: 2, u: 2, cm: 2 });
});

test("şimdi yaz: aylık hak doluysa 402 quota (günlük tetik harcanmaz)", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const s = (await connect(call)).body.site;
  const month = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 7);
  db.prepare("INSERT INTO gen_month (month, user_id, kind, n) VALUES (?, 1, 'lb', 40)").run(month);
  const r = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.deepEqual([r.status, r.body.error], [402, "quota"]);
  assert.equal(cmN(db), 0);
  db.prepare("DELETE FROM gen_month").run();
  const ok2 = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID2 } });
  assert.equal(ok2.status, 200, JSON.stringify(ok2.body));
});

test("şimdi yaz: duraklatılmış / hatalı sitede 409 site_state; kaldırılmış site 404", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const s = (await connect(call)).body.site;
  for (const st of ["duraklatildi", "hata"]) {
    db.prepare("UPDATE cms_sites SET state = ? WHERE id = ?").run(st, s.id);
    const r = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
    assert.deepEqual([r.status, r.body.error, r.body.state], [409, "site_state", st], st);
  }
  db.prepare("UPDATE cms_sites SET state = 'aktif' WHERE id = ?").run(s.id);
  assert.equal((await call("POST", `/app/cms/${s.id}/disconnect`, { body: {} })).status, 200);
  const gone = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.ok([404, 409].includes(gone.status), String(gone.status));
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_posts").get().n, 0);
  assert.deepEqual({ ...counters(db), cm: cmN(db) }, { lb: 0, u: 0, cm: 0 });
});

test("şimdi yaz: takvim (next_run_at) değişmez; cmsTick elle yazıyı üretir, planlı tur da ayrıca çalışır", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const s = (await connect(call)).body.site;
  const before = db.prepare("SELECT next_run_at FROM cms_sites WHERE id = ?").get(s.id).next_run_at;
  assert.ok(before, "takvim var");
  const r = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.equal(r.status, 200);
  assert.equal(db.prepare("SELECT next_run_at FROM cms_sites WHERE id = ?").get(s.id).next_run_at, before);
  const out = await cmsTick(env, async () => LLM_OK(), { log: () => {} });
  assert.equal(out.produced, 1, JSON.stringify(out));
  assert.equal(db.prepare("SELECT state FROM cms_posts WHERE id = ?").get(r.body.post.id).state, "hazir");
  assert.equal(db.prepare("SELECT next_run_at FROM cms_sites WHERE id = ?").get(s.id).next_run_at, before, "elle üretim takvimi kaydırmaz");
  // planlı zaman gelince normal tur yine yazı ekler ve sonraki zamanı takvimden hesaplar
  db.prepare("UPDATE cms_sites SET next_run_at = datetime('now', '-1 minutes') WHERE id = ?").run(s.id);
  await cmsTick(env, async () => LLM_OK(), { log: () => {} });
  const sched = db.prepare("SELECT COUNT(*) AS n FROM cms_posts WHERE cms_site_id = ? AND slot NOT LIKE 'manual:%'").get(s.id).n;
  assert.equal(sched, 1);
  const after = db.prepare("SELECT next_run_at FROM cms_sites WHERE id = ?").get(s.id).next_run_at;
  // sonraki zaman takvimden (gün/saat) yeniden hesaplanır: elle tetik olmasa da aynı olacak yuva, ileride
  assert.equal(after, before);
  assert.ok(after > db.prepare("SELECT datetime('now') AS t").get().t);
});

test("şimdi yaz: üretim başarısız → günlük tetik de iade edilir, aynı gün yeniden denenebilir", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const s = (await connect(call)).body.site;
  const r = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.equal(r.status, 200);
  assert.equal(cmN(db), 1);
  await cmsTick(env, async () => LLM_FAIL(), { log: () => {} });
  assert.deepEqual({ ...counters(db), cm: cmN(db) }, { lb: 0, u: 0, cm: 0 });
  const again = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID2 } });
  assert.equal(again.status, 200, JSON.stringify(again.body));
  assert.equal(cmN(db), 1);
});

const cuN = db => db.prepare("SELECT COALESCE(SUM(n), 0) AS n FROM gen_usage WHERE kind = 'cu'").get().n;

test("şimdi yaz: aynı rid ile eşzamanlı iki istek → ikisi de aynı yazıyı döner (429 değil), sayaçlar bir kez düşer", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const s = (await connect(call)).body.site;
  const [a, b] = await Promise.all([1, 2].map(() => call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } })));
  assert.deepEqual([a.status, b.status], [200, 200], JSON.stringify([a.body, b.body]));
  assert.equal(a.body.post.id, b.body.post.id);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cms_posts").get().n, 1);
  assert.deepEqual({ ...counters(db), cm: cmN(db), cu: cuN(db) }, { lb: 1, u: 1, cm: 1, cu: 1 });
});

test("şimdi yaz: tetik sayacı dolu ama aynı rid'in yazısı var → yazı döner (yarışın kaybeden tarafı)", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const s = (await connect(call)).body.site;
  const r = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.equal(r.status, 200);
  // ilk prev kontrolünü kaçırmış ikinci isteği taklit et: ilk SELECT boş döner, sonrakiler gerçek
  const real = db.prepare.bind(db);
  let missed = false;
  db.prepare = sql => {
    const st = real(sql);
    if (!missed && /FROM cms_posts WHERE cms_site_id = \? AND slot = \?/.test(sql)) {
      missed = true;
      return new Proxy(st, { get: (o, k) => k === "get" ? () => undefined : (typeof o[k] === "function" ? o[k].bind(o) : o[k]) });
    }
    return st;
  };
  t.after(() => { db.prepare = real; });
  const b = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  db.prepare = real;
  assert.ok(missed, "taklit devreye girdi");
  assert.deepEqual([b.status, b.body.post?.id], [200, r.body.post.id], JSON.stringify(b.body));
  assert.deepEqual({ ...counters(db), cm: cmN(db), cu: cuN(db) }, { lb: 1, u: 1, cm: 1, cu: 1 });
});

test("şimdi yaz: siteyi kaldırıp yeniden bağlamak günlük tetiği sıfırlamaz (Pro, 1 site); üretim hatası iki sayacı da iade eder", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const s = (await connect(call)).body.site;
  assert.equal((await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } })).status, 200);
  assert.equal((await call("POST", `/app/cms/${s.id}/disconnect`, { body: {} })).status, 200);
  const s2 = (await connect(call)).body.site;
  assert.ok(s2?.id && s2.id !== s.id, "yeni site kaydı");
  const r2 = await call("POST", `/app/cms/${s2.id}/run`, { body: { rid: RID2 } });
  assert.deepEqual([r2.status, r2.body.error], [429, "daily_limit"], JSON.stringify(r2.body));
  assert.equal(cuN(db), 1);
  // kaldırılan sitenin bekleyen elle yazısı iptal + iade edilince aynı gün yeni sitede tetik açılır
  await cmsTick(env, async () => LLM_FAIL(), { log: () => {} });
  assert.deepEqual({ ...counters(db), cm: cmN(db), cu: cuN(db) }, { lb: 0, u: 0, cm: 0, cu: 0 });
  const r3 = await call("POST", `/app/cms/${s2.id}/run`, { body: { rid: RID3 } });
  assert.equal(r3.status, 200, JSON.stringify(r3.body));
  assert.equal(cuN(db), 1);
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

test("W5: CMS bileti sosyal bağlantı bitişinde (/app/connect/finish) yanmaz: 400 ticket, satır kalır, cmsoauth/finish yine bağlar", async t => {
  stubProviders(t);
  const { db, env, call } = setup(freshDb(), { METRICS_ENABLED: "1" }); // sosyal bağlantı uçları açık
  const ticket = await oauthFlow(t, call, env);
  const left = () => db.prepare("SELECT COUNT(*) AS n FROM oauth_states WHERE ticket_hash = ?").get(hash(ticket)).n;
  for (let i = 0; i < 2; i++) {
    const r = await call("POST", "/app/connect/finish", { body: { ticket } });
    assert.deepEqual([r.status, r.body.error], [400, "ticket"], JSON.stringify(r.body));
    assert.equal(left(), 1);
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM social_accounts").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM oauth_tokens").get().n, 0);
  const f = await call("POST", "/app/cmsoauth/finish", { body: { ticket } });
  assert.equal(f.status, 200, JSON.stringify(f.body));
  assert.equal(left(), 0);
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
  for (const k of ["GET /app/cms", "GET /app/cmsposts", "POST /app/cms/connect", "POST /app/cms/:id/run", "POST /app/cms/:id/disconnect", "POST /app/cmsoauth/start", "POST /app/cmsoauth/finish",
    "POST /app/cmsposts/:id/view", "POST /app/cmsposts/:id/edit", "POST /app/cmsposts/:id/skip", "POST /app/cmsposts/:id/now", "POST /app/cmsposts/:id/reschedule"])
    assert.ok(APP_ROUTES.includes(k), k);
  stubProviders(t);
  const { call } = setup();
  assert.equal((await call("GET", "/app/cms")).status, 200);
  const bc = await call("GET", "/app/cms", { token: tok("B"), origin: "https://brandcorner.co" });
  assert.deepEqual([bc.status, bc.body.error], [404, "not_found"]);
  const bc2 = await call("POST", "/app/cms/connect", { token: tok("B"), origin: "https://brandcorner.co", body: { platform: "hubspot", inputs: { api_key: KEY } } });
  assert.equal(bc2.status, 404);
});

// ---- bildirim e-postası (25.11) ----
const MAIL_ENV = { SMTP_USER: "bildirim@ornek.test", SMTP_PASS: "sahte" };
function mailSpy() { const sent = []; return { sent, mail: async (env, m) => { sent.push(m); } }; }
function stubPush(t, fn) { const hp = PROVIDERS.hubspot, o = hp.push; hp.push = fn; t.after(() => { hp.push = o; }); }
const insPost = (db, siteId, slot, extra = {}) => {
  const r = { state: "hazir", title: "Örnek <b>Yazı</b>", markdown: "Gövde.", mode: "draft", user_id: 1, ...extra };
  return Number(db.prepare("INSERT INTO cms_posts (cms_site_id, user_id, slot, state, title, markdown, mode, lease_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(siteId, r.user_id, slot, r.state, r.title, r.markdown, r.mode, r.lease_until ?? null).lastInsertRowid);
};

test("bildirim: başarılı yayında kullanıcının dilinde e-posta (EN), bağlantı + panel; HTML kaçışlı", async t => {
  stubProviders(t);
  stubPush(t, async () => ({ ok: true, remote_id: "9", url: "https://blog.example.test/ornek" }));
  const { db, env, call } = setup(freshDb(), MAIL_ENV);
  const s = (await connect(call)).body.site;
  db.exec("UPDATE users SET lang = 'en', name = 'Ayşe' WHERE id = 1");
  insPost(db, s.id, "p1", { mode: "publish" });
  const { sent, mail } = mailSpy();
  const out = await cmsTick({ ...env, GEN_ENABLED: "0" }, async () => { throw new Error("ağ yok"); }, { log: () => {}, mail });
  assert.equal(out.pushed, 1, JSON.stringify(out));
  assert.equal(out.mailed, 1, JSON.stringify(out));
  assert.equal(sent.length, 1);
  const m = sent[0];
  assert.equal(m.to, "a@ornek.test");
  assert.match(m.subject, /^Your post is live: Örnek <b>Yazı<\/b>$/);
  assert.ok(!/[\r\n]/.test(m.subject));
  assert.match(m.text, /Hi Ayşe,/);
  assert.match(m.text, /https:\/\/blog\.example\.test\/ornek/);
  assert.match(m.text, /https:\/\/app\.socialmediacorner\.co\/en\//);
  assert.ok(m.html.includes("&lt;b&gt;Yazı&lt;/b&gt;") && !m.html.includes("<b>Yazı"), m.html);
  assert.equal(m.from.email, "bildirim@ornek.test");
});

test("bildirim: taslak gönderimde TR e-posta; SMTP yoksa hiç gönderilmez", async t => {
  stubProviders(t);
  stubPush(t, async () => ({ ok: true, remote_id: "9", url: "https://blog.example.test/taslak" }));
  {
    const { db, env, call } = setup(freshDb(), MAIL_ENV);
    const s = (await connect(call)).body.site;
    insPost(db, s.id, "p1");
    const { sent, mail } = mailSpy();
    const out = await cmsTick({ ...env, GEN_ENABLED: "0" }, async () => { throw new Error("ağ yok"); }, { log: () => {}, mail });
    assert.equal(out.mailed, 1, JSON.stringify(out));
    assert.match(sent[0].subject, /^Yeni taslak sitende: /);
    assert.match(sent[0].text, /^Merhaba a,/);
    assert.match(sent[0].text, /LinkedIn ya da Instagram/);
  }
  {
    const { db, env, call } = setup();
    const s = (await connect(call)).body.site;
    insPost(db, s.id, "p1");
    const { sent, mail } = mailSpy();
    const out = await cmsTick({ ...env, GEN_ENABLED: "0" }, async () => { throw new Error("ağ yok"); }, { log: () => {}, mail });
    assert.equal(out.pushed, 1);
    assert.equal(sent.length, 0);
    assert.equal(out.mailed, 0);
  }
});

test("bildirim: hata e-postası kullanıcı başına günde en çok 1; tik başına en çok 2 e-posta", async t => {
  stubProviders(t);
  stubPush(t, async () => ({ ok: false, error: "bad_input", retry: false })); // site düşürmeyen kalıcı hata
  const { db, env, call } = setup(freshDb(), MAIL_ENV);
  const s = (await connect(call)).body.site;
  insPost(db, s.id, "p1");
  insPost(db, s.id, "p2");
  const { sent, mail } = mailSpy();
  const opts = { log: () => {}, mail };
  const out = await cmsTick({ ...env, GEN_ENABLED: "0" }, async () => { throw new Error("ağ yok"); }, opts);
  assert.equal(out.push_failed, 2, JSON.stringify(out));
  assert.equal(sent.length, 1, JSON.stringify(out)); // ikinci hata aynı gün: düşer
  assert.equal(out.mail_skipped, 1);
  assert.match(sent[0].subject, /gönderilemedi/);
  // ertesi gün yeniden 1 hata e-postası
  insPost(db, s.id, "p3");
  const later = Date.now() + 26 * 3600e3;
  await cmsTick({ ...env, GEN_ENABLED: "0" }, async () => { throw new Error("ağ yok"); }, { ...opts, now: () => later });
  assert.equal(sent.length, 2);

  // tik başına sınır: 3 başarılı gönderim (PUSH_PER_TICK=2 → 2 gönderim) + 2 eski 'gonderiliyor' (sonucu bilinmiyor)
  stubPush(t, async () => ({ ok: true, remote_id: "1", url: "https://blog.example.test/x" }));
  const B = setup(freshDb(), MAIL_ENV);
  const s2 = (await connect(B.call)).body.site;
  insPost(B.db, s2.id, "q1");
  insPost(B.db, s2.id, "q2");
  insPost(B.db, s2.id, "q3", { state: "gonderiliyor", lease_until: "2000-01-01 00:00:00" });
  const spy2 = mailSpy();
  const o2 = await cmsTick({ ...B.env, GEN_ENABLED: "0" }, async () => { throw new Error("ağ yok"); }, { log: () => {}, mail: spy2.mail });
  assert.equal(o2.stale, 1, JSON.stringify(o2));
  assert.equal(spy2.sent.length, 2, JSON.stringify(o2));
  assert.equal(o2.mailed + o2.mail_skipped, 3, JSON.stringify(o2));
  assert.match(spy2.sent[0].subject, /gönderilemedi/); // eski 'gonderiliyor' → sonucu bilinmiyor hatası önce
});

test("bildirim: üretilemeyen yazıda hata e-postası (hak iade metni); gönderici hatası tiki düşürmez", async t => {
  stubProviders(t);
  const { db, env, call } = setup(freshDb(), MAIL_ENV);
  const s = (await connect(call)).body.site;
  await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  const sent = [];
  const out = await cmsTick(env, async () => LLM_FAIL(), { log: () => {}, mail: async (e, m) => { sent.push(m); throw new Error("smtp"); } });
  assert.equal(out.produce_failed, 1, JSON.stringify(out));
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /üretilemedi/);
  assert.match(sent[0].text, /hakkı iade edildi/);
  assert.equal(out.mailed, 0);
  assert.equal(out.mail_skipped, 1);
  // gönderilemeyen hata e-postası günlük hakkı yemez: aynı gün sonraki hata yine e-posta dener
  const ne = () => db.prepare("SELECT COALESCE(SUM(n), 0) AS n FROM gen_usage WHERE kind = 'ne'").get().n;
  assert.equal(ne(), 0);
  db.prepare("UPDATE gen_usage SET n = 0 WHERE kind = 'cm' OR kind = 'cu'").run();
  assert.equal((await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID2 } })).status, 200);
  const { sent: sent2, mail } = mailSpy();
  const out2 = await cmsTick(env, async () => LLM_FAIL(), { log: () => {}, mail });
  assert.equal(out2.mailed, 1, JSON.stringify(out2));
  assert.equal(sent2.length, 1);
  assert.equal(ne(), 1);
});

// ---- önden hazırlama + yaklaşan yazı yönetimi (25.11) ----
const sqlT = ms => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
const NO_NET = async () => { throw new Error("ağ yok"); };

test("önden hazırlama: yuvadan 3 saat önce üretilir, yuvaya dek bekler, 'yazın hazır' e-postası; yuva gelince gönderilir", async t => {
  stubProviders(t);
  let pushes = 0;
  stubPush(t, async () => { pushes++; return { ok: true, remote_id: "9", url: "https://blog.example.test/x" }; });
  const { db, env, call } = setup(freshDb(), { ...MAIL_ENV, CMS_LEAD_HOURS: "24" });
  const s = (await connect(call)).body.site;
  const slot = sqlT(Date.now() + 3 * 3600e3);
  db.prepare("UPDATE cms_sites SET next_run_at = ? WHERE id = ?").run(slot, s.id);
  const { sent, mail } = mailSpy();
  // tik bütçesi: zamanlama turları üretimi bir sonraki tike (cron'da bir dakika sonra) bırakabilir
  const tick2 = async () => { const a = await cmsTick(env, async () => LLM_OK(), { log: () => {}, mail }), b = await cmsTick(env, async () => LLM_OK(), { log: () => {}, mail });
    return Object.fromEntries(Object.keys(a).map(k => [k, a[k] + b[k]])); };
  const out = await tick2();
  assert.deepEqual([out.scheduled, out.produced, out.pushed], [1, 1, 0], JSON.stringify(out));
  const p = db.prepare("SELECT * FROM cms_posts WHERE cms_site_id = ?").get(s.id);
  assert.deepEqual([p.state, p.slot, p.next_try_at], ["hazir", slot, slot]);
  assert.ok(db.prepare("SELECT next_run_at FROM cms_sites WHERE id = ?").get(s.id).next_run_at > slot, "sonraki yuva bu yuvadan sonra");
  assert.equal(sent.length, 1, JSON.stringify(out));
  assert.match(sent[0].subject, /^Sıradaki yazın hazır: Başlık$/);
  assert.match(sent[0].text, /taslak olarak gönderilecek/);
  assert.match(sent[0].text, /erteleyebilir ya da atlayabilirsin/);
  // panel listesinde yayın zamanı
  const l = await call("GET", "/app/cmsposts");
  const lp = l.body.posts.find(x => x.id === p.id);
  assert.deepEqual([lp.publish_at, lp.slot, lp.has_content], [slot, slot, true]);
  // yuvadan önce gönderilmez; yuva gelince gider
  await cmsTick({ ...env, GEN_ENABLED: "0" }, NO_NET, { log: () => {}, now: () => Date.now() + 3600e3 });
  assert.equal(pushes, 0);
  const o2 = await cmsTick({ ...env, GEN_ENABLED: "0" }, NO_NET, { log: () => {}, mail, now: () => Date.parse(slot.replace(" ", "T") + "Z") + 60e3 });
  assert.equal(o2.pushed, 1, JSON.stringify(o2));
  assert.equal(db.prepare("SELECT state FROM cms_posts WHERE id = ?").get(p.id).state, "gonderildi");
});

test("önden hazırlama: yuvaya 2 saatten az kaldıysa 'hazır' e-postası yok; geçmiş yuva hemen gönderilebilir", async t => {
  stubProviders(t);
  const { db, env, call } = setup(freshDb(), { ...MAIL_ENV, CMS_LEAD_HOURS: "24" });
  const s = (await connect(call)).body.site;
  db.prepare("UPDATE cms_sites SET next_run_at = ? WHERE id = ?").run(sqlT(Date.now() + 30 * 60e3), s.id);
  const { sent, mail } = mailSpy();
  await cmsTick(env, async () => LLM_OK(), { log: () => {}, mail });
  const out = await cmsTick(env, async () => LLM_OK(), { log: () => {}, mail });
  assert.equal(out.produced, 1, JSON.stringify(out));
  assert.equal(sent.length, 0);
});

const prepPost = async (t, extra) => {
  stubProviders(t);
  const S = setup(freshDb(), extra);
  const s = (await connect(S.call)).body.site;
  const id = insPost(S.db, s.id, sqlT(Date.now() + 20 * 3600e3));
  S.db.prepare("UPDATE cms_posts SET next_try_at = slot WHERE id = ?").run(id);
  return { ...S, s, id };
};

test("yönetim: önizle sahibine markdown döner, başkasına 404", async t => {
  const { call, id } = await prepPost(t);
  const v = await call("POST", `/app/cmsposts/${id}/view`, { body: {} });
  assert.deepEqual([v.status, v.body.title, v.body.markdown, v.body.post.state], [200, "Örnek <b>Yazı</b>", "Gövde.", "hazir"]);
  assert.ok(v.body.post.publish_at);
  const m = await call("POST", `/app/cmsposts/${id}/view`, { token: tok("M"), body: {} });
  assert.deepEqual([m.status, m.body.error], [404, "not_found"]);
  assert.equal((await call("POST", "/app/cmsposts/99999/view", { body: {} })).status, 404);
});

test("yönetim: düzenle doğrular, günceller; basic plan 403; gönderilmiş yazı 400 state", async t => {
  const { db, call, id } = await prepPost(t);
  for (const body of [{ title: "  ", markdown: "x" }, { title: "a".repeat(301), markdown: "x" }, { title: "Yeni", markdown: " " }, { title: "Yeni" }]) {
    const r = await call("POST", `/app/cmsposts/${id}/edit`, { body });
    assert.equal(r.status, 400, JSON.stringify(body));
  }
  const r = await call("POST", `/app/cmsposts/${id}/edit`, { body: { title: "  Yeni   başlık ", markdown: "## Bölüm\n\nYeni gövde." } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const p = db.prepare("SELECT title, markdown, slug, state FROM cms_posts WHERE id = ?").get(id);
  assert.deepEqual([p.title, p.markdown, p.state], ["Yeni başlık", "## Bölüm\n\nYeni gövde.", "hazir"]);
  assert.ok(p.slug && p.slug.includes("yeni"));
  assert.equal((await call("POST", `/app/cmsposts/${id}/edit`, { token: tok("M"), body: { title: "x", markdown: "y" } })).status, 404);
  db.prepare("UPDATE users SET plan = 'basic' WHERE id = 1").run();
  const g = await call("POST", `/app/cmsposts/${id}/edit`, { body: { title: "x", markdown: "y" } });
  assert.deepEqual([g.status, g.body.error, g.body.plan], [403, "plan_required", "pro"]);
  db.prepare("UPDATE users SET plan = 'pro' WHERE id = 1").run();
  db.prepare("UPDATE cms_posts SET state = 'gonderildi' WHERE id = ?").run(id);
  const st = await call("POST", `/app/cmsposts/${id}/edit`, { body: { title: "x", markdown: "y" } });
  assert.deepEqual([st.status, st.body.field], [400, "state"]);
});

test("yönetim: şimdi paylaş next_try_at'ı şimdiye çeker + send_now; duraklatılmış/hata sitede de gider; kaldırılmışta 409", async t => {
  const { db, call, s, id } = await prepPost(t);
  const r = await call("POST", `/app/cmsposts/${id}/now`, { body: {} });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.post.send_now, 1);
  assert.deepEqual({ ...db.prepare("SELECT next_try_at <= datetime('now') AS d, send_now FROM cms_posts WHERE id = ?").get(id) }, { d: 1, send_now: 1 });
  for (const st of ["duraklatildi", "hata"]) {
    db.prepare("UPDATE cms_sites SET state = ? WHERE id = ?").run(st, s.id);
    const z = await call("POST", `/app/cmsposts/${id}/now`, { body: {} });
    assert.equal(z.status, 200, st + JSON.stringify(z.body));
  }
  db.prepare("UPDATE cms_sites SET state = 'kaldirildi' WHERE id = ?").run(s.id);
  const k = await call("POST", `/app/cmsposts/${id}/now`, { body: {} });
  assert.deepEqual([k.status, k.body.error], [409, "site_state"]);
});

test("şimdi paylaş: duraklatılmış sitede send_now yazı tikte gider; send_now'sız vakti geçmiş yazı gitmez, site duraklatılmış kalır", async t => {
  let pushes = 0;
  const { db, env, call, s, id } = await prepPost(t);
  stubPush(t, async () => { pushes++; return { ok: true, remote_id: "9", url: "https://blog.example.test/x" }; });
  const late = insPost(db, s.id, sqlT(Date.now() - 2 * 86400e3));
  db.prepare("UPDATE cms_posts SET next_try_at = slot WHERE id = ?").run(late);
  assert.equal((await call("POST", `/app/cms/${s.id}/pause`, { body: {} })).status, 200);
  let out = await cmsTick({ ...env, GEN_ENABLED: "0" }, NO_NET, { log: () => {} });
  assert.equal(out.pushed, 0, JSON.stringify(out));
  assert.equal((await call("POST", `/app/cmsposts/${id}/now`, { body: {} })).status, 200);
  out = await cmsTick({ ...env, GEN_ENABLED: "0" }, NO_NET, { log: () => {} });
  assert.equal(out.pushed, 1, JSON.stringify(out));
  assert.equal(pushes, 1);
  assert.equal(db.prepare("SELECT state FROM cms_posts WHERE id = ?").get(id).state, "gonderildi");
  assert.equal(db.prepare("SELECT state FROM cms_posts WHERE id = ?").get(late).state, "hazir");
  assert.equal(db.prepare("SELECT state FROM cms_sites WHERE id = ?").get(s.id).state, "duraklatildi");
});

test("ertele send_now'ı sıfırlar; yeniden dene send_now = 1 (duraklatılmış sitede de gider)", async t => {
  const { db, call, s, id } = await prepPost(t);
  assert.equal((await call("POST", `/app/cmsposts/${id}/now`, { body: {} })).status, 200);
  const r = await call("POST", `/app/cmsposts/${id}/reschedule`, { body: { at: new Date(Date.now() + 2 * 86400e3).toISOString() } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(db.prepare("SELECT send_now FROM cms_posts WHERE id = ?").get(id).send_now, 0);
  db.prepare("UPDATE cms_posts SET state = 'basarisiz' WHERE id = ?").run(id);
  db.prepare("UPDATE cms_sites SET state = 'duraklatildi' WHERE id = ?").run(s.id);
  const y = await call("POST", `/app/cmsposts/${id}/retry`, { body: {} });
  assert.equal(y.status, 200, JSON.stringify(y.body));
  assert.deepEqual({ ...db.prepare("SELECT state, send_now FROM cms_posts WHERE id = ?").get(id) }, { state: "hazir", send_now: 1 });
});

test("yeniden başlat (B): vakti geçmiş yazılar hemen gitmez, sıradaki boş günlere (günde bir) dizilir; elle istenen kalır; sonraki yuva onlardan sonra", async t => {
  const { db, env, call, s, id } = await prepPost(t);
  let pushes = 0;
  stubPush(t, async () => { pushes++; return { ok: true, remote_id: "9", url: "https://blog.example.test/x" }; });
  const futureSlot = db.prepare("SELECT next_try_at FROM cms_posts WHERE id = ?").get(id).next_try_at;
  const mk = (ago, extra) => { const x = insPost(db, s.id, sqlT(Date.now() - ago), extra); db.prepare("UPDATE cms_posts SET next_try_at = slot WHERE id = ?").run(x); return x; };
  const a = mk(3 * 86400e3), b = mk(2 * 86400e3), m = mk(86400e3);
  db.prepare("UPDATE cms_posts SET send_now = 1 WHERE id = ?").run(m);
  // Pzt/Çar/Cum 10:00 İstanbul (plan sınırı haftada 3)
  db.prepare("UPDATE cms_sites SET days = '[1,3,5]', hour = 10 WHERE id = ?").run(s.id);
  assert.equal((await call("POST", `/app/cms/${s.id}/pause`, { body: {} })).status, 200);
  const r = await call("POST", `/app/cms/${s.id}/resume`, { body: {} });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.moved, 2);
  const at = x => db.prepare("SELECT next_try_at, send_now FROM cms_posts WHERE id = ?").get(x);
  const ist = v => new Date(Date.parse(v.replace(" ", "T") + "Z") + 3 * 3600e3), day = v => ist(v).toISOString().slice(0, 10);
  const now = sqlT(Date.now());
  const ta = at(a).next_try_at, tb = at(b).next_try_at;
  assert.equal(r.body.moved_first, ta);
  for (const v of [ta, tb]) { assert.ok(v > now, v); assert.equal(ist(v).getUTCHours(), 10, v); }
  assert.ok(ta < tb, `${ta} < ${tb}`);
  const days = [ta, tb, futureSlot].map(day);
  assert.equal(new Set(days).size, 3, JSON.stringify(days));
  assert.ok(at(m).next_try_at < now && at(m).send_now === 1, "elle istenen yazı yerinde");
  const next = db.prepare("SELECT next_run_at FROM cms_sites WHERE id = ?").get(s.id).next_run_at;
  assert.ok(next > tb && next > futureSlot && !days.includes(day(next)), next);
  // tik yalnız elle isteneni gönderir
  const out = await cmsTick({ ...env, GEN_ENABLED: "0" }, NO_NET, { log: () => {} });
  assert.equal(out.pushed, 1, JSON.stringify(out));
  assert.equal(db.prepare("SELECT state FROM cms_posts WHERE id = ?").get(m).state, "gonderildi");
  assert.deepEqual([a, b].map(x => db.prepare("SELECT state FROM cms_posts WHERE id = ?").get(x).state), ["hazir", "hazir"]);
});

test("yönetim: ertele geçersiz/geçmiş/30 günden uzak → 400; geçerli zaman yazılır", async t => {
  const { db, call, id } = await prepPost(t);
  const iso = ms => new Date(ms).toISOString();
  for (const at of ["yarın", "2026-11-26 10:00", iso(Date.now() - 3600e3), iso(Date.now() + 31 * 86400e3), 12345]) {
    const r = await call("POST", `/app/cmsposts/${id}/reschedule`, { body: { at } });
    assert.deepEqual([r.status, r.body.error, r.body.field], [400, "bad_input", "at"], String(at));
  }
  const want = Date.now() + 2 * 86400e3;
  const r = await call("POST", `/app/cmsposts/${id}/reschedule`, { body: { at: iso(want) } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(db.prepare("SELECT next_try_at FROM cms_posts WHERE id = ?").get(id).next_try_at, sqlT(want));
  assert.equal(r.body.post.publish_at, sqlT(want));
  const off = await call("POST", `/app/cmsposts/${id}/reschedule`, { body: { at: "2099-01-01T10:00:00+03:00" } });
  assert.equal(off.status, 400);
});

test("yönetim: hazır yazıyı atla → iptal (iade yok), ikinci atla 400; üretimdeki yazıyı atla → hak iade", async t => {
  const { db, call, id, s } = await prepPost(t);
  const r = await call("POST", `/app/cmsposts/${id}/skip`, { body: {} });
  assert.deepEqual([r.status, r.body.post.state], [200, "iptal"]);
  assert.deepEqual(Object.values(db.prepare("SELECT state, last_error FROM cms_posts WHERE id = ?").get(id)), ["iptal", "skipped"]);
  const again = await call("POST", `/app/cmsposts/${id}/skip`, { body: {} });
  assert.deepEqual([again.status, again.body.field], [400, "state"]);
  // üretimdeki (elle tetik) yazı: kota iade edilir
  const run = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.equal(run.status, 200, JSON.stringify(run.body));
  assert.deepEqual(counters(db), { lb: 1, u: 1 });
  const k = await call("POST", `/app/cmsposts/${run.body.post.id}/skip`, { body: {} });
  assert.deepEqual([k.status, k.body.post.state], [200, "iptal"], JSON.stringify(k.body));
  assert.deepEqual(counters(db), { lb: 0, u: 0 });
  assert.equal((await call("POST", `/app/cmsposts/${run.body.post.id}/skip`, { body: {} })).status, 400);
});

test("yönetim: önden hazır yazının gününde saat değişse / yeniden başlatılsa da aynı güne ikinci yuva açılmaz", async t => {
  const { db, call, id, s } = await prepPost(t);
  const slot = db.prepare("SELECT slot FROM cms_posts WHERE id = ?").get(id).slot;
  const ist = v => new Date(Date.parse(v.replace(" ", "T") + "Z") + 3 * 3600e3), iso = new Date(ist(slot)).getUTCDay() || 7;
  const day = v => ist(v).toISOString().slice(0, 10);
  // aynı gün, daha geç saat: düzeltmesiz bu yuva bekleyen yazının gününe düşerdi
  const r = await call("POST", `/app/cms/${s.id}/settings`, { body: { per_week: 1, days: [iso], hour: 23 } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  let next = db.prepare("SELECT next_run_at FROM cms_sites WHERE id = ?").get(s.id).next_run_at;
  assert.ok(next > slot && day(next) !== day(slot), `${slot} → ${next}`);
  assert.equal(ist(next).getUTCHours(), 23);
  assert.equal((await call("POST", `/app/cms/${s.id}/pause`, { body: {} })).status, 200);
  assert.equal((await call("POST", `/app/cms/${s.id}/resume`, { body: {} })).status, 200);
  next = db.prepare("SELECT next_run_at FROM cms_sites WHERE id = ?").get(s.id).next_run_at;
  assert.ok(next > slot && day(next) !== day(slot), `resume: ${slot} → ${next}`);
  // bekleyen yazı atlanınca kısıt kalkar
  assert.equal((await call("POST", `/app/cmsposts/${id}/skip`, { body: {} })).status, 200);
  assert.equal((await call("POST", `/app/cms/${s.id}/settings`, { body: { per_week: 1, days: [iso], hour: 23 } })).status, 200);
  next = db.prepare("SELECT next_run_at FROM cms_sites WHERE id = ?").get(s.id).next_run_at;
  assert.equal(day(next), day(slot), next);
});

test("yönetim: üretimdeki elle yazıyı atlamak günlük tetik hakkını iade etmez (tetik→atla döngüsü yok); aylık hak iade", async t => {
  stubProviders(t);
  const { db, call } = setup();
  const s = (await connect(call)).body.site;
  const run = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.equal(run.status, 200, JSON.stringify(run.body));
  assert.equal((await call("POST", `/app/cmsposts/${run.body.post.id}/skip`, { body: {} })).status, 200);
  assert.deepEqual(counters(db), { lb: 0, u: 0 });
  const again = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID2 } });
  assert.deepEqual([again.status, again.body.error], [429, "daily_limit"]);
});

test("üretim sürerken atlanan yazının kuyruk konusu düşmez", async t => {
  stubProviders(t);
  const { db, env, call } = setup();
  const s = (await connect(call)).body.site;
  db.prepare("UPDATE cms_sites SET topics = ? WHERE id = ?").run(JSON.stringify(["Konu A", "Konu B"]), s.id);
  const run = await call("POST", `/app/cms/${s.id}/run`, { body: { rid: RID } });
  assert.equal(run.status, 200, JSON.stringify(run.body));
  let skipped = false;
  await cmsTick(env, async () => {
    if (!skipped) { skipped = true; assert.equal((await call("POST", `/app/cmsposts/${run.body.post.id}/skip`, { body: {} })).status, 200); }
    return LLM_OK();
  }, { log: () => {} });
  assert.ok(skipped);
  assert.equal(db.prepare("SELECT state FROM cms_posts WHERE id = ?").get(run.body.post.id).state, "iptal");
  assert.equal(db.prepare("SELECT topics FROM cms_sites WHERE id = ?").get(s.id).topics, JSON.stringify(["Konu A", "Konu B"]));
});
