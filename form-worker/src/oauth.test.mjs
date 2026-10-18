// node --test src/oauth.test.mjs — D1 yerine node:sqlite, sağlayıcılar yerine sahte fetch; gerçek ağ, secret ve deploy yok.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";

// smtp.js "cloudflare:sockets" içe aktarır; Node'da yok, testte sahte modül verilir.
// Test globalThis.__smtpConnect'i kurarsa bağlantı ona gider, yoksa hata.
registerHooks({
  resolve(spec, ctx, next) {
    return spec === "cloudflare:sockets"
      ? { url: "data:text/javascript,export const connect=(...a)=>(globalThis.__smtpConnect||(()=>{throw new Error('sockets')}))(...a)", shortCircuit: true }
      : next(spec, ctx);
  },
});
const { platform } = await import("./platform.js");
const {
  NOT_CONFIGURED, NO_DATA, OAUTH, ProviderError, oauthReady, redirectUri, listConnections, authorizeUrl,
  exchangeCode, fetchMetrics, encrypt, decrypt, syncAccount, oauthCallback, finishOAuth, OAuthFail,
} = await import("./oauth.js");

const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const METRICS = readFileSync(new URL("../migrations/0001_metrics.sql", import.meta.url), "utf8");
const MIGRATION = readFileSync(new URL("../migrations/0002_oauth.sql", import.meta.url), "utf8");

// Testin ihtiyacı kadar D1: prepare().bind().all/first/run, batch (gerçek D1 gibi atomik), exec
function d1(db) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })) }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => {
      const i = db.prepare(sql).run(...args);
      return { success: true, meta: { changes: Number(i.changes), last_row_id: Number(i.lastInsertRowid) } };
    },
  });
  const batch = async list => {
    db.exec("BEGIN");
    try {
      const out = [];
      for (const s of list) out.push(await s.run());
      db.exec("COMMIT");
      return out;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
  return { prepare: sql => stmt(sql), batch, exec: async sql => db.exec(sql) };
}

function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  db.exec(METRICS);
  db.exec(MIGRATION);
  return db;
}

// Sahte anahtar ve uygulama bilgileri; gerçek secret değil
const KEY = Buffer.alloc(32, 7).toString("base64");
const IG_ENV = { INSTAGRAM_CLIENT_ID: "ig-app-id", INSTAGRAM_CLIENT_SECRET: "ig-gizli-secret" };
const TT_ENV = { TIKTOK_CLIENT_KEY: "tt-client-key", TIKTOK_CLIENT_SECRET: "tt-gizli-secret" };
const YT_ENV = { YOUTUBE_CLIENT_ID: "yt-client-id", YOUTUBE_CLIENT_SECRET: "yt-gizli-secret" };
const ALL = { ...IG_ENV, ...TT_ENV, ...YT_ENV, OAUTH_TOKEN_KEY: KEY };
const hash = s => createHash("sha256").update(s).digest("hex");

// routes: [url öneki, [status, gövde] | (url, body) => [status, gövde]]; ilk eşleşen döner, çağrılar kaydedilir
function fakeFetch(routes) {
  const calls = [];
  const f = async (url, init = {}) => {
    const u = String(url);
    const body = init.body instanceof URLSearchParams ? Object.fromEntries(init.body) : init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url: u, method: init.method || "GET", headers: init.headers || {}, body });
    const hit = routes.find(([prefix]) => u.startsWith(prefix));
    const [status, json] = !hit ? [404, { error: "unrouted" }] : typeof hit[1] === "function" ? hit[1](u, body) : hit[1];
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  };
  f.calls = calls;
  return f;
}

const IGV = "https://graph.instagram.com/v23.0";
const igRoutes = (extra = []) => [
  ...extra,
  ["https://api.instagram.com/oauth/access_token", [200, { data: [{ access_token: "ig-kisa", user_id: "1784", permissions: "instagram_business_basic" }] }]],
  ["https://graph.instagram.com/access_token?", [200, { access_token: "ig-uzun-token", token_type: "bearer", expires_in: 5184000 }]],
  [`${IGV}/me?`, [200, { user_id: "1784", username: "inf_ig", followers_count: 5400 }]],
  [`${IGV}/me/media?`, [200, { data: [{ id: "m1", like_count: 100, comments_count: 4 }, { id: "m2", comments_count: 6 }, { id: "m3", like_count: 201, comments_count: 0 }] }]],
  [`${IGV}/m1/insights?`, [200, { data: [{ name: "views", total_value: { value: 1000 } }] }]],
  [`${IGV}/m2/insights?`, [200, { data: [{ name: "views", values: [{ value: 3001 }] }] }]],
  [`${IGV}/m3/insights?`, [400, { error: { message: "unsupported", type: "OAuthException", code: 100 } }]],
];

const TT = "https://open.tiktokapis.com/v2";
const ttRoutes = (extra = []) => [
  ...extra,
  [`${TT}/oauth/token/`, (u, b) => [200, b.grant_type === "refresh_token"
    ? { access_token: "tt-yeni-access", refresh_token: "tt-yeni-refresh", expires_in: 86400, open_id: "tt-1" }
    : { access_token: "tt-access", refresh_token: "tt-refresh", expires_in: 86400, open_id: "tt-1", scope: "user.info.basic,video.list" }]],
  [`${TT}/user/info/`, [200, { data: { user: { open_id: "tt-1", username: "inf_tt", display_name: "Inf", follower_count: 12000 } }, error: { code: "ok", message: "" } }]],
  [`${TT}/video/list/`, [200, { data: { videos: [{ id: "v1", view_count: 5000, like_count: 300, comment_count: 20 }, { id: "v2", view_count: 7000, like_count: 500, comment_count: 40 }] }, error: { code: "ok" } }]],
];

const YT = "https://www.googleapis.com/youtube/v3";
const ytRoutes = (extra = []) => [
  ...extra,
  ["https://oauth2.googleapis.com/token", (u, b) => [200, b.grant_type === "refresh_token"
    ? { access_token: "yt-yeni-access", expires_in: 3599 }
    : { access_token: "yt-access", refresh_token: "yt-refresh", expires_in: 3599, scope: "https://www.googleapis.com/auth/youtube.readonly" }]],
  [`${YT}/channels?`, [200, { items: [{ id: "UC1", snippet: { title: "Inf Kanal", customUrl: "@infyt" }, statistics: { subscriberCount: "8800", hiddenSubscriberCount: false }, contentDetails: { relatedPlaylists: { uploads: "UU1" } } }] }]],
  [`${YT}/playlistItems?`, [200, { items: [{ contentDetails: { videoId: "a" } }, { contentDetails: { videoId: "b" } }] }]],
  [`${YT}/videos?`, [200, { items: [{ statistics: { viewCount: "900", likeCount: "90", commentCount: "9" } }, { statistics: { viewCount: "1100" } }] }]],
];

// ---- yapılandırma ----

test("secret yoksa ya da eksikse 'yapılandırılmadı'; LinkedIn, X, Twitch 'veri yok'; DB'ye dokunulmaz", async () => {
  const label = list => Object.fromEntries(list.map(x => [x.platform, [x.status, x.label]]));
  // env.DB yok: yapılandırılmamışken sorgu atılsaydı hata verirdi
  assert.deepEqual(label(await listConnections({}, 1)), {
    instagram: ["not_configured", NOT_CONFIGURED], tiktok: ["not_configured", NOT_CONFIGURED], youtube: ["not_configured", NOT_CONFIGURED],
    linkedin: ["no_api", NO_DATA], x: ["no_api", NO_DATA], twitch: ["no_api", NO_DATA],
  });
  assert.equal(oauthReady({ ...IG_ENV }, "instagram"), false, "anahtar yok");
  assert.equal(oauthReady({ INSTAGRAM_CLIENT_ID: "x", OAUTH_TOKEN_KEY: KEY }, "instagram"), false, "secret yok");
  assert.equal(oauthReady({ ...IG_ENV, OAUTH_TOKEN_KEY: Buffer.alloc(16).toString("base64") }, "instagram"), false, "anahtar 16 bayt");
  assert.equal(oauthReady({ ...IG_ENV, OAUTH_TOKEN_KEY: "%%%" }, "instagram"), false, "anahtar bozuk");
  assert.equal(oauthReady({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY }, "instagram"), true);
  assert.equal(oauthReady({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY }, "tiktok"), false);
  assert.equal(oauthReady({ ...ALL, LINKEDIN_CLIENT_ID: "x", LINKEDIN_CLIENT_SECRET: "y" }, "linkedin"), false);
  assert.deepEqual(OAUTH, ["instagram", "tiktok", "youtube"]);
});

test("onay adresi: client id ve state var, secret yok", () => {
  const redirect = p => redirectUri({}, "https://forms.test", p);
  const ig = new URL(authorizeUrl(ALL, "instagram", "S".repeat(43), redirect("instagram")));
  assert.equal(ig.origin + ig.pathname, "https://www.instagram.com/oauth/authorize");
  assert.equal(ig.searchParams.get("client_id"), "ig-app-id");
  assert.equal(ig.searchParams.get("redirect_uri"), "https://forms.test/oauth/instagram/callback");
  assert.equal(ig.searchParams.get("response_type"), "code");
  assert.equal(ig.searchParams.get("state"), "S".repeat(43));
  assert.match(ig.searchParams.get("scope"), /instagram_business_manage_insights/);

  const tt = new URL(authorizeUrl(ALL, "tiktok", "s", redirect("tiktok")));
  assert.equal(tt.searchParams.get("client_key"), "tt-client-key");
  assert.equal(tt.searchParams.has("client_id"), false);
  assert.match(tt.searchParams.get("scope"), /user\.info\.stats/);

  const yt = new URL(authorizeUrl(ALL, "youtube", "s", redirect("youtube")));
  assert.equal(yt.searchParams.get("access_type"), "offline");
  assert.equal(yt.searchParams.get("scope"), "https://www.googleapis.com/auth/youtube.readonly");

  for (const u of [ig, tt, yt]) assert.doesNotMatch(u.toString(), /gizli/);
  assert.equal(redirectUri({ OAUTH_REDIRECT_BASE: "https://api.brandcorner.co/" }, "https://forms.test", "tiktok"), "https://api.brandcorner.co/oauth/tiktok/callback");
});

// ---- sağlayıcı çağrıları ----

test("kod takası: üç sağlayıcı aynı biçime çevrilir", async () => {
  const ig = fakeFetch(igRoutes());
  const t1 = await exchangeCode(ALL, "instagram", "kod-1", "https://forms.test/oauth/instagram/callback", ig);
  assert.deepEqual(t1, { access_token: "ig-uzun-token", refresh_token: null, expires_in: 5184000, scope: "instagram_business_basic" });
  assert.deepEqual(ig.calls[0].body, {
    client_id: "ig-app-id", client_secret: "ig-gizli-secret", grant_type: "authorization_code",
    redirect_uri: "https://forms.test/oauth/instagram/callback", code: "kod-1",
  });
  const long = new URL(ig.calls[1].url);
  assert.equal(long.searchParams.get("grant_type"), "ig_exchange_token");
  assert.equal(long.searchParams.get("access_token"), "ig-kisa");

  const tt = fakeFetch(ttRoutes());
  const t2 = await exchangeCode(ALL, "tiktok", "kod-2", "r", tt);
  assert.equal(t2.access_token, "tt-access");
  assert.equal(t2.refresh_token, "tt-refresh");
  assert.equal(tt.calls[0].body.client_key, "tt-client-key");
  assert.equal(tt.calls[0].body.client_id, undefined);

  const yt = fakeFetch(ytRoutes());
  const t3 = await exchangeCode(ALL, "youtube", "kod-3", "r", yt);
  assert.deepEqual([t3.access_token, t3.refresh_token, t3.expires_in], ["yt-access", "yt-refresh", 3599]);
  assert.equal(yt.calls[0].body.client_id, "yt-client-id");

  // Sağlayıcı hatası: kısa kodlu ProviderError
  const bad = fakeFetch([["https://oauth2.googleapis.com/token", [400, { error: "invalid_grant", error_description: "x" }]]]);
  await assert.rejects(exchangeCode(ALL, "youtube", "k", "r", bad), e => e instanceof ProviderError && e.code === "400:invalid_grant");
  // TikTok 200 dönse de error.code "ok" değilse hata
  const ttBad = fakeFetch([[`${TT}/user/info/`, [200, { data: {}, error: { code: "access_token_invalid" } }]]]);
  await assert.rejects(fetchMetrics("tiktok", "t", ttBad), e => e.code === "200:access_token_invalid");
});

test("metrikler: takipçi ve son gönderilerin ortalamaları; gizli değer ortalamaya girmez", async () => {
  const ig = await fetchMetrics("instagram", "ig-token", fakeFetch(igRoutes()));
  // m2'nin beğenisi gizli, m3'ün izlenmesi alınamadı
  assert.deepEqual(ig, { external_id: "1784", handle: "inf_ig", followers: 5400, avg_views: 2001, avg_likes: 151, avg_comments: 3, posts_sampled: 3 });

  const ttf = fakeFetch(ttRoutes());
  assert.deepEqual(await fetchMetrics("tiktok", "tt-token", ttf),
    { external_id: "tt-1", handle: "inf_tt", followers: 12000, avg_views: 6000, avg_likes: 400, avg_comments: 30, posts_sampled: 2 });
  assert.equal(ttf.calls[0].headers.authorization, "Bearer tt-token");
  assert.deepEqual(ttf.calls[1].body, { max_count: 12 });

  // YouTube sayıları metin döner; eksik beğeni/yorum ortalamaya girmez
  const ytf = fakeFetch(ytRoutes());
  assert.deepEqual(await fetchMetrics("youtube", "yt-token", ytf),
    { external_id: "UC1", handle: "@infyt", followers: 8800, avg_views: 1000, avg_likes: 90, avg_comments: 9, posts_sampled: 2 });
  assert.match(ytf.calls.at(-1).url, /id=a,b$/);

  // Gizli abone sayısı ve videosuz kanal (yükleme listesi 404)
  const hidden = fakeFetch(ytRoutes([
    [`${YT}/channels?`, [200, { items: [{ id: "UC2", snippet: { title: "Yeni" }, statistics: { subscriberCount: "0", hiddenSubscriberCount: true }, contentDetails: { relatedPlaylists: { uploads: "UU2" } } }] }]],
    [`${YT}/playlistItems?`, [404, { error: { code: 404, message: "playlistNotFound" } }]],
  ]));
  assert.deepEqual(await fetchMetrics("youtube", "t", hidden),
    { external_id: "UC2", handle: "Yeni", followers: null, avg_views: null, avg_likes: null, avg_comments: null, posts_sampled: 0 });

  const noChannel = fakeFetch([[`${YT}/channels?`, [200, { items: [] }]]]);
  await assert.rejects(fetchMetrics("youtube", "t", noChannel), e => e.code === "no_channel");
});

// ---- şifreleme ----

test("token şifreleme: gidiş-dönüş, her seferinde farklı, yanlış anahtar açamaz", async () => {
  const env = { OAUTH_TOKEN_KEY: KEY };
  const a = await encrypt(env, "gizli-token"), b = await encrypt(env, "gizli-token");
  assert.match(a, /^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/);
  assert.notEqual(a, b);
  assert.doesNotMatch(a, /gizli/);
  assert.equal(await decrypt(env, a), "gizli-token");
  assert.equal(await encrypt(env, null), null);
  assert.equal(await decrypt(env, null), null);
  await assert.rejects(decrypt({ OAUTH_TOKEN_KEY: Buffer.alloc(32, 8).toString("base64") }, a));
  await assert.rejects(decrypt(env, "v2.x.y"), /token_format/);
  await assert.rejects(encrypt({}, "x"), /token_key/);
});

// ---- uçlar ve sağlayıcı dönüşü ----

const ORIGIN = "http://localhost:8788";
function api(env, origin = ORIGIN) {
  return async (method, path, { token, body, ip = "10.0.0.1" } = {}) => {
    const headers = { "cf-connecting-ip": ip, "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const res = await platform(req, new URL(req.url), env, origin, async () => {});
    return { status: res.status, body: await res.json() };
  };
}

async function setup(extraEnv = {}) {
  const db = freshDb();
  const env = { DB: d1(db), DEV_ORIGINS: ORIGIN, PBKDF2_ITER: "10000", METRICS_ENABLED: "1", ...extraEnv };
  const call = api(env);
  let ip = 0;
  const join = async (role, email) => {
    const r = await call("POST", "/auth/register", {
      ip: `10.0.1.${++ip}`, body: { name: email, email, password: "sifre-12345", role, consent: true, hp: "", t: 2000 },
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return { token: r.body.token, id: r.body.user.id };
  };
  return { db, env, call, join };
}

const callback = (env, path) => {
  const req = new Request(`https://forms.test${path}`);
  return oauthCallback(req, new URL(req.url), env);
};
const count = (db, table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
// Bağlanmayı başlatır, state'i döndürür
const start = async (call, token, p = "instagram") => {
  const r = await call("POST", "/app/connect", { token, body: { platform: p } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return new URL(r.body.url).searchParams.get("state");
};
// Sağlayıcı dönüşü: panele pending ve fragment'ta bilet; bileti döndürür
const PENDING = /^http:\/\/localhost:8788\/panel\?oauth=(\w+)&result=pending#ticket=([A-Za-z0-9_-]{43})$/;
const land = async (env, state, p = "instagram", code = "kod-1") => {
  const r = await callback(env, `/oauth/${p}/callback?code=${code}&state=${state}`);
  assert.equal(r.status, 302);
  const m = PENDING.exec(r.headers.get("location"));
  assert.ok(m, r.headers.get("location"));
  assert.equal(m[1], p);
  return m[2];
};
const finish = (call, token, ticket) => call("POST", "/app/connect/finish", { token, body: { ticket } });
const fail = r => [r.status, r.body.error];

test("bağlantı uçları: yetki, yapılandırılmamış durum, METRICS_ENABLED kapalı", async () => {
  const { env, call, join } = await setup();
  const brand = await join("brand", "marka@x.co"), inf = await join("influencer", "inf@x.co");

  assert.equal((await call("GET", "/app/connections")).status, 401);
  assert.equal((await call("GET", "/app/connections", { token: brand.token })).status, 403);
  assert.equal((await call("POST", "/app/connect", { token: brand.token, body: { platform: "instagram" } })).status, 403);
  assert.equal((await finish(call, brand.token, "a".repeat(43))).status, 403);
  assert.equal((await finish(call, undefined, "a".repeat(43))).status, 401);

  const list = await call("GET", "/app/connections", { token: inf.token });
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.connections.map(x => [x.platform, x.label]), [
    ["instagram", NOT_CONFIGURED], ["tiktok", NOT_CONFIGURED], ["youtube", NOT_CONFIGURED],
    ["x", NO_DATA], ["linkedin", NO_DATA], ["twitch", NO_DATA],
  ]);
  const err = async platformName => fail(await call("POST", "/app/connect", { token: inf.token, body: { platform: platformName } }));
  assert.deepEqual(await err("linkedin"), [400, "no_api"]);
  assert.deepEqual(await err("myspace"), [400, "platform"]);
  assert.deepEqual(await err("instagram"), [409, "not_configured"]);
  assert.deepEqual(fail(await finish(call, inf.token, "a".repeat(43))), [400, "ticket"]);
  assert.equal((await call("POST", "/app/disconnect", { token: inf.token, body: { platform: "instagram" } })).status, 200);

  // Yapılandırılmamış dönüş adresi
  const r = await callback(env, "/oauth/instagram/callback?code=x&state=" + "a".repeat(43));
  assert.equal(r.status, 503);
  assert.equal(await r.text(), NOT_CONFIGURED);

  // METRICS_ENABLED kapalı: secret'lar girilmiş olsa da bağlanma uçları ve dönüş adresi kapalı; bağı koparmak açık
  const off = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY, METRICS_ENABLED: "0" });
  const inf2 = await off.join("influencer", "inf@x.co");
  for (const [method, path, body] of [
    ["GET", "/app/connections"], ["POST", "/app/connect", { platform: "instagram" }], ["POST", "/app/connect/finish", { ticket: "a".repeat(43) }],
  ]) assert.deepEqual(fail(await off.call(method, path, { token: inf2.token, body })), [409, "disabled"], path);
  assert.equal((await callback(off.env, "/oauth/instagram/callback?code=x&state=" + "a".repeat(43))).status, 503);
  assert.equal((await off.call("POST", "/app/disconnect", { token: inf2.token, body: { platform: "instagram" } })).status, 200);
  assert.equal(count(off.db, "oauth_states"), 0);
});

test("Instagram bağlama: dönüş bağlamaz, bilet tek kullanımlık, token şifreli", async t => {
  t.mock.method(console, "log", () => {});
  let net = fakeFetch(igRoutes());
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  const { db, env, call, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY });
  const inf = await join("influencer", "inf@x.co");

  const r = await call("POST", "/app/connect", { token: inf.token, body: { platform: "instagram" } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const u = new URL(r.body.url);
  assert.equal(u.searchParams.get("redirect_uri"), "https://forms.test/oauth/instagram/callback");
  assert.doesNotMatch(r.body.url, /gizli/);
  const state = u.searchParams.get("state");
  assert.match(state, /^[A-Za-z0-9_-]{43}$/);
  const row = db.prepare("SELECT * FROM oauth_states").get();
  assert.equal(row.state_hash, hash(state));
  assert.equal(row.return_to, `${ORIGIN}/panel`);
  assert.equal(row.redirect_uri, "https://forms.test/oauth/instagram/callback");
  assert.equal(row.user_id, inf.id);
  assert.equal(row.ticket_hash, null);

  // Sağlayıcı dönüşü: sağlayıcı çağrılmaz, hiçbir şey bağlanmaz; kod şifreli saklanır, bilet fragment'ta
  const res = await callback(env, `/oauth/instagram/callback?code=kod-1&state=${state}`);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("referrer-policy"), "no-referrer");
  assert.equal(res.headers.get("cache-control"), "no-store");
  const ticket = PENDING.exec(res.headers.get("location"))?.[2];
  assert.ok(ticket, res.headers.get("location"));
  const held = db.prepare("SELECT * FROM oauth_states").get();
  assert.equal(held.ticket_hash, hash(ticket));
  assert.doesNotMatch(held.code, /kod-1/);
  assert.equal(await decrypt(env, held.code), "kod-1");
  assert.equal(net.calls.length, 0);
  assert.equal(count(db, "oauth_tokens"), 0);
  assert.equal(count(db, "social_accounts"), 0);

  // Aynı state ikinci kez kullanılamaz: ne yeni kodla ne redle
  assert.equal((await callback(env, `/oauth/instagram/callback?code=kod-2&state=${state}`)).status, 400);
  assert.equal((await callback(env, `/oauth/instagram/callback?error=access_denied&state=${state}`)).status, 400);
  assert.equal(await decrypt(env, db.prepare("SELECT code FROM oauth_states").get().code), "kod-1");

  // Panel bileti oturumla gönderir; bağlama burada
  const done = await finish(call, inf.token, ticket);
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.deepEqual(done.body.connection, { platform: "instagram", handle: "inf_ig" });
  assert.equal(net.calls[0].body.redirect_uri, "https://forms.test/oauth/instagram/callback");
  assert.equal(net.calls[0].body.code, "kod-1");
  const acc = db.prepare("SELECT * FROM social_accounts WHERE user_id = ?").get(inf.id);
  assert.deepEqual([acc.platform, acc.handle, acc.external_id, acc.status, acc.error], ["instagram", "inf_ig", "1784", "connected", null]);
  assert.ok(acc.connected_at);
  const tok = db.prepare("SELECT * FROM oauth_tokens WHERE user_id = ?").get(inf.id);
  assert.equal(tok.refresh_token, null);
  assert.ok(tok.expires_at);
  assert.doesNotMatch(tok.access_token, /ig-uzun-token/);
  assert.equal(await decrypt(env, tok.access_token), "ig-uzun-token");
  assert.equal(count(db, "oauth_states"), 0);

  // Bilet ikinci kez kullanılamaz
  assert.deepEqual(fail(await finish(call, inf.token, ticket)), [400, "ticket"]);
  const list = await call("GET", "/app/connections", { token: inf.token });
  assert.deepEqual(list.body.connections.slice(0, 3).map(x => [x.platform, x.status, x.handle]),
    [["instagram", "connected", "inf_ig"], ["tiktok", "not_configured", null], ["youtube", "not_configured", null]]);

  // Kullanıcı reddederse: denied, state silinir, bağlantı değişmez
  const denied = await callback(env, `/oauth/instagram/callback?error=access_denied&state=${await start(call, inf.token)}`);
  assert.equal(denied.headers.get("location"), `${ORIGIN}/panel?oauth=instagram&result=denied`);
  assert.equal(count(db, "oauth_states"), 0);
  assert.equal(count(db, "oauth_tokens"), 1);

  // Sağlayıcı hatası: dönüş yine bilet verir, finish 502; eski bağlantı ve token değişmez
  net = fakeFetch([["https://api.instagram.com/oauth/access_token", [400, { error_type: "OAuthException", code: 400, error_message: "bad code" }]]]);
  assert.deepEqual(fail(await finish(call, inf.token, await land(env, await start(call, inf.token), "instagram", "bozuk"))), [502, "provider"]);
  assert.equal(await decrypt(env, db.prepare("SELECT access_token FROM oauth_tokens").get().access_token), "ig-uzun-token");

  // Platform kimliği dönmezse bağlanmaz
  net = fakeFetch(igRoutes([[`${IGV}/me?`, [200, { username: "kimliksiz" }]]]));
  assert.deepEqual(fail(await finish(call, inf.token, await land(env, await start(call, inf.token)))), [502, "provider"]);
  assert.deepEqual({ ...db.prepare("SELECT handle, external_id FROM social_accounts").get() }, { handle: "inf_ig", external_id: "1784" });

  // Geçersiz, süresi dolmuş ya da başka platformun state'i
  assert.equal((await callback(env, "/oauth/instagram/callback?code=x&state=kisa")).status, 400);
  const old = "o".repeat(43);
  db.prepare("INSERT INTO oauth_states (state_hash, user_id, platform, return_to, redirect_uri, expires_at) VALUES (?, ?, 'instagram', ?, 'r', datetime('now', '-1 minutes'))")
    .run(hash(old), inf.id, `${ORIGIN}/panel`);
  assert.equal((await callback(env, `/oauth/instagram/callback?code=x&state=${old}`)).status, 400);
  assert.equal((await callback(env, `/oauth/instagram/callback?error=access_denied&state=${old}`)).status, 400);
  const other = "t".repeat(43);
  db.prepare("INSERT INTO oauth_states (state_hash, user_id, platform, return_to, redirect_uri, expires_at) VALUES (?, ?, 'tiktok', 'https://kotu.example', 'r', datetime('now', '+5 minutes'))")
    .run(hash(other), inf.id);
  assert.equal((await callback(env, `/oauth/instagram/callback?code=x&state=${other}`)).status, 400);
  assert.equal((await callback(env, "/oauth/myspace/callback?code=x")).status, 404);

  // Bağı koparma: token silinir, hesap "revoked", platform kimliği boşalır; Instagram'da iptal ucu yok
  net = fakeFetch([]);
  assert.equal((await call("POST", "/app/disconnect", { token: inf.token, body: { platform: "instagram" } })).status, 200);
  assert.equal(count(db, "oauth_tokens"), 0);
  assert.deepEqual({ ...db.prepare("SELECT status, external_id FROM social_accounts").get() }, { status: "revoked", external_id: null });
  assert.equal(net.calls.length, 0);
  assert.equal((await call("GET", "/app/connections", { token: inf.token })).body.connections[0].status, "available");
});

test("başkasının bileti hiçbir şey bağlamaz ve yanar (RFC 6749 §10.12)", async t => {
  const net = fakeFetch(igRoutes());
  t.mock.method(globalThis, "fetch", net);
  const { db, env, call, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY });
  const a = await join("influencer", "a@x.co"), v = await join("influencer", "v@x.co");

  // A kendi onay adresini V'ye gönderir; V onaylar, sağlayıcı V'nin tarayıcısını panele biletle döndürür
  const ticket = await land(env, await start(call, a.token));
  // V'nin oturumu bileti gönderir: forbidden, kod takası yapılmaz
  assert.deepEqual(fail(await finish(call, v.token, ticket)), [403, "forbidden"]);
  // Bilet yandı: A eline geçirse de kullanamaz
  assert.deepEqual(fail(await finish(call, a.token, ticket)), [400, "ticket"]);
  assert.equal(net.calls.length, 0);
  assert.equal(count(db, "oauth_tokens"), 0);
  assert.equal(count(db, "social_accounts"), 0);
  assert.equal(count(db, "oauth_states"), 0);
});

test("bir platform hesabı tek kullanıcıya bağlanır (taken)", async t => {
  t.mock.method(console, "log", () => {});
  t.mock.method(globalThis, "fetch", fakeFetch(igRoutes()));
  const { db, env, call, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY });
  const u1 = await join("influencer", "u1@x.co"), u2 = await join("influencer", "u2@x.co");
  const connect = async u => finish(call, u.token, await land(env, await start(call, u.token)));
  const rows = (table, u) => db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`).get(u.id).n;

  assert.equal((await connect(u1)).status, 200);
  assert.deepEqual(fail(await connect(u2)), [409, "taken"]);
  assert.equal(rows("social_accounts", u2), 0);
  assert.equal(rows("oauth_tokens", u2), 0);

  // Yarış: ön kontrolü geçse bile UNIQUE(platform, external_id) engeller, token yazılmaz
  const prep = env.DB.prepare;
  env.DB.prepare = sql => (/^SELECT 1 FROM social_accounts/.test(sql) ? { bind: () => ({ first: async () => null }) } : prep(sql));
  assert.deepEqual(fail(await connect(u2)), [409, "taken"]);
  env.DB.prepare = prep;
  assert.equal(rows("social_accounts", u2), 0);
  assert.equal(rows("oauth_tokens", u2), 0);

  // Aynı kullanıcı yeniden bağlanabilir
  assert.equal((await connect(u1)).status, 200);
  assert.equal(count(db, "social_accounts"), 1);

  // u1 bağı koparınca hesap u2'ye bağlanabilir
  assert.equal((await call("POST", "/app/disconnect", { token: u1.token, body: { platform: "instagram" } })).status, 200);
  assert.equal((await connect(u2)).status, 200);
  const owners = db.prepare("SELECT user_id, status, external_id FROM social_accounts ORDER BY user_id").all().map(x => ({ ...x }));
  assert.deepEqual(owners, [{ user_id: u1.id, status: "revoked", external_id: null }, { user_id: u2.id, status: "connected", external_id: "1784" }]);
});

test("bilet: süresi dolunca, biçimi bozuksa ya da state yerine kullanılırsa geçersiz", async t => {
  const net = fakeFetch(igRoutes());
  t.mock.method(globalThis, "fetch", net);
  const { db, env, call, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY });
  const inf = await join("influencer", "inf@x.co");

  const ticket = await land(env, await start(call, inf.token));
  db.prepare("UPDATE oauth_states SET expires_at = datetime('now', '-1 seconds')").run();
  assert.deepEqual(fail(await finish(call, inf.token, ticket)), [400, "ticket"]);
  for (const bad of ["", "kisa", "a".repeat(44), "a".repeat(42) + "=", 12, null, { ticket }]) {
    assert.deepEqual(fail(await finish(call, inf.token, bad)), [400, "ticket"], JSON.stringify(bad));
  }

  // State bilet yerine, bilet state yerine geçmez
  const state = await start(call, inf.token);
  assert.deepEqual(fail(await finish(call, inf.token, state)), [400, "ticket"]);
  const t2 = await land(env, state);
  assert.equal((await callback(env, `/oauth/instagram/callback?code=x&state=${t2}`)).status, 400);
  assert.equal(net.calls.length, 0);
});

test("bağı koparma: TikTok ve Google'da izin geri alınır; platform hazır değilse de satırlar silinir", async t => {
  const logs = [];
  t.mock.method(console, "log", (...a) => logs.push(a.join(" ")));
  let net = fakeFetch([]);
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  const { db, env, call, join } = await setup({ ...TT_ENV, ...YT_ENV, OAUTH_TOKEN_KEY: KEY });
  const inf = await join("influencer", "inf@x.co");
  const put = async (p, ext) => {
    db.prepare("INSERT OR REPLACE INTO social_accounts (user_id, platform, handle, external_id, status) VALUES (?, ?, 'h', ?, 'connected')").run(inf.id, p, ext);
    db.prepare("INSERT OR REPLACE INTO oauth_tokens (user_id, platform, access_token, refresh_token) VALUES (?, ?, ?, ?)")
      .run(inf.id, p, await encrypt(env, `${p}-access`), await encrypt(env, `${p}-refresh`));
  };
  const off = p => call("POST", "/app/disconnect", { token: inf.token, body: { platform: p } });
  const acc = p => ({ ...db.prepare("SELECT status, external_id, error FROM social_accounts WHERE user_id = ? AND platform = ?").get(inf.id, p) });
  const tokens = p => db.prepare("SELECT COUNT(*) AS n FROM oauth_tokens WHERE user_id = ? AND platform = ?").get(inf.id, p).n;
  const REVOKED = { status: "revoked", external_id: null, error: null };

  // TikTok: access token iptal edilir
  await put("tiktok", "tt-1");
  net = fakeFetch([[`${TT}/oauth/revoke/`, [200, {}]]]);
  assert.equal((await off("tiktok")).status, 200);
  assert.deepEqual(net.calls.map(c => [c.url, c.method, c.body]),
    [[`${TT}/oauth/revoke/`, "POST", { client_key: "tt-client-key", client_secret: "tt-gizli-secret", token: "tiktok-access" }]]);
  assert.equal(tokens("tiktok"), 0);
  assert.deepEqual(acc("tiktok"), REVOKED);

  // YouTube: refresh token iptal edilir; sağlayıcı hata verse de bağ kopar, logda yalnızca kod
  await put("youtube", "UC1");
  net = fakeFetch([["https://oauth2.googleapis.com/revoke", [400, { error: "invalid_token" }]]]);
  assert.equal((await off("youtube")).status, 200);
  assert.deepEqual(net.calls.map(c => [c.url, c.body]), [["https://oauth2.googleapis.com/revoke", { token: "youtube-refresh" }]]);
  assert.equal(tokens("youtube"), 0);
  assert.deepEqual(acc("youtube"), REVOKED);
  assert.deepEqual(logs, ["oauth revoke youtube revoke:400"]);

  // Bağlı olmayan platform: ok, sağlayıcı çağrılmaz
  net = fakeFetch([]);
  assert.equal((await off("tiktok")).status, 200);
  assert.equal(net.calls.length, 0);

  // Hiçbir platform hazır değil (anahtar kaldırıldı): satırlar yine silinir, iptal denenmez
  await put("instagram", "1784");
  await put("tiktok", "tt-1");
  delete env.OAUTH_TOKEN_KEY;
  for (const p of ["instagram", "tiktok"]) {
    assert.equal((await off(p)).status, 200);
    assert.equal(tokens(p), 0);
    assert.deepEqual(acc(p), REVOKED);
  }
  assert.equal(net.calls.length, 0);
  assert.deepEqual(fail(await off("linkedin")), [400, "platform"]);
});

test("syncAccount: süresi dolan token yenilenir, sonuç social_accounts'a yazılır", async () => {
  const { db, env, join } = await setup({ ...TT_ENV, ...YT_ENV, OAUTH_TOKEN_KEY: KEY });
  const inf = await join("influencer", "inf@x.co");
  const put = async (p, ext, access, refresh, expiresSql) => {
    db.prepare("INSERT INTO social_accounts (user_id, platform, handle, external_id, status) VALUES (?, ?, 'eski', ?, 'connected')").run(inf.id, p, ext);
    db.prepare(`INSERT INTO oauth_tokens (user_id, platform, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?, datetime('now', '${expiresSql}'))`)
      .run(inf.id, p, await encrypt(env, access), await encrypt(env, refresh));
  };
  const tok = p => db.prepare("SELECT * FROM oauth_tokens WHERE user_id = ? AND platform = ?").get(inf.id, p);
  const acc = p => db.prepare("SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?").get(inf.id, p);

  await assert.rejects(syncAccount(env, inf.id, "tiktok", fakeFetch([])), e => e.code === "not_connected");
  await assert.rejects(syncAccount(env, inf.id, "instagram", fakeFetch([])), e => e.code === "not_configured");

  // TikTok: süresi geçmiş, yenilenir; yeni refresh token da saklanır
  await put("tiktok", "tt-1", "tt-eski-access", "tt-eski-refresh", "-1 hours");
  const tf = fakeFetch(ttRoutes());
  const m = await syncAccount(env, inf.id, "tiktok", tf);
  assert.deepEqual([m.followers, m.avg_views, m.handle], [12000, 6000, "inf_tt"]);
  assert.deepEqual(tf.calls[0].body, { client_key: "tt-client-key", client_secret: "tt-gizli-secret", grant_type: "refresh_token", refresh_token: "tt-eski-refresh" });
  assert.equal(tf.calls[1].headers.authorization, "Bearer tt-yeni-access");
  const t1 = tok("tiktok");
  assert.equal(await decrypt(env, t1.access_token), "tt-yeni-access");
  assert.equal(await decrypt(env, t1.refresh_token), "tt-yeni-refresh");
  assert.equal(acc("tiktok").handle, "inf_tt");
  assert.equal(acc("tiktok").error, null);

  // YouTube: geçerli token yenilenmez; yenilemede refresh token gelmezse eskisi kalır
  await put("youtube", "UC1", "yt-access", "yt-refresh", "+1 hours");
  const yf = fakeFetch(ytRoutes());
  await syncAccount(env, inf.id, "youtube", yf);
  assert.equal(yf.calls.some(c => c.url.startsWith("https://oauth2.googleapis.com")), false);
  db.prepare("UPDATE oauth_tokens SET expires_at = datetime('now', '+5 minutes') WHERE platform = 'youtube'").run();
  await syncAccount(env, inf.id, "youtube", yf);
  assert.equal(await decrypt(env, tok("youtube").access_token), "yt-yeni-access");
  assert.equal(await decrypt(env, tok("youtube").refresh_token), "yt-refresh");

  // Sağlayıcı reddederse hata kodu kaydedilir, listede "error"
  const revoked = fakeFetch([[`${YT}/channels?`, [401, { error: { code: 401, message: "Invalid Credentials" } }]]]);
  await assert.rejects(syncAccount(env, inf.id, "youtube", revoked), e => e.code === "401:401");
  assert.equal(acc("youtube").error, "401:401");
  const list = await listConnections(env, inf.id);
  assert.deepEqual(list.slice(0, 3).map(x => [x.platform, x.status]), [["instagram", "not_configured"], ["tiktok", "connected"], ["youtube", "error"]]);
});

test("dönüş adresi ham Origin'den değil: https, port ve yol yok; yalnız DEV_ORIGINS birebir", async () => {
  const { db, env, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY });
  const inf = await join("influencer", "inf@x.co");
  const backTo = async origin => {
    const r = await api(env, origin)("POST", "/app/connect", { token: inf.token, body: { platform: "instagram" } });
    assert.equal(r.status, 200, `${origin} ${JSON.stringify(r.body)}`);
    const state = new URL(r.body.url).searchParams.get("state");
    return [state, db.prepare("SELECT return_to FROM oauth_states WHERE state_hash = ?").get(hash(state)).return_to];
  };
  const cases = [
    ["https://brandcorner.co", "https://brandcorner.co/panel"],
    ["https://www.brandcorner.co", "https://www.brandcorner.co/panel"],
    ["https://pr-7.web-brandcorner.pages.dev", "https://pr-7.web-brandcorner.pages.dev/panel"],
    [ORIGIN, `${ORIGIN}/panel`],
    // Alan adı doğru ama şema, port, kullanıcı ya da yol saldırganın: doğrulanmış siteye düşer
    ["http://brandcorner.co", "https://brandcorner.co/panel"],
    ["https://brandcorner.co:8443", "https://brandcorner.co/panel"],
    ["https://x@brandcorner.co", "https://brandcorner.co/panel"],
    ["https://www.brandcorner.co/p?x=", "https://brandcorner.co/panel"],
    ["http://pr-7.web-brandcorner.pages.dev", "https://brandcorner.co/panel"],
    ["http://localhost:9999", null],
  ];
  for (const [origin, want] of cases) {
    if (want === null) {
      const r = await api(env, origin)("POST", "/app/connect", { token: inf.token, body: { platform: "instagram" } });
      assert.deepEqual(fail(r), [403, "origin"], origin);
      continue;
    }
    assert.equal((await backTo(origin))[1], want, origin);
  }
  // Sağlayıcı dönüşü bileti bu adrese götürür
  const [state] = await backTo("http://brandcorner.co");
  const r = await callback(env, `/oauth/instagram/callback?code=k&state=${state}`);
  assert.match(r.headers.get("location"), /^https:\/\/brandcorner\.co\/panel\?oauth=instagram&result=pending#ticket=[A-Za-z0-9_-]{43}$/);
});

// Sahte SMTP sunucusu: her komuta beklenen yanıtı verir, DATA'dan sonraki iletiyi yakalar
function fakeSmtp() {
  const sent = [], enc = new TextEncoder(), dec = new TextDecoder();
  globalThis.__smtpConnect = () => {
    const queue = ["220 hazir\r\n"];
    let waiting = null, data = false;
    const push = line => {
      if (waiting) { const w = waiting; waiting = null; w({ value: enc.encode(line), done: false }); } else queue.push(line);
    };
    return {
      writable: { getWriter: () => ({ write: async bytes => {
        const line = dec.decode(bytes);
        if (data) { data = false; sent.push(line); return push("250 tamam\r\n"); }
        if (line.startsWith("DATA")) { data = true; return push("354 devam\r\n"); }
        push({ EHLO: "250 tamam", AUTH: "235 tamam", MAIL: "250 tamam", RCPT: "250 tamam", QUIT: "221 hosca kal" }[line.slice(0, 4)] + "\r\n");
      } }) },
      readable: { getReader: () => ({
        read: () => queue.length ? Promise.resolve({ value: enc.encode(queue.shift()), done: false }) : new Promise(r => { waiting = r; }),
      }) },
      close: async () => {},
    };
  };
  return sent;
}
// İletinin düz metin ve HTML bölümleri (base64)
const mailParts = msg => ["plain", "html"].map(kind => {
  const m = msg.match(new RegExp(`Content-Type: text/${kind}; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n([A-Za-z0-9+/=\r\n]+?)\r\n--`));
  return Buffer.from(m[1].replace(/\r\n/g, ""), "base64").toString("utf8");
});

test("şifre sıfırlama linki ham Origin'den değil doğrulanmış siteden kurulur", async t => {
  const sent = fakeSmtp();
  t.after(() => { delete globalThis.__smtpConnect; });
  const { db, env, join } = await setup({ SMTP_USER: "noreply@brandcorner.co", SMTP_PASS: "test-sifre" });
  await join("brand", "marka@x.co");
  const linkFor = async origin => {
    db.prepare("DELETE FROM auth_attempts").run();
    const before = sent.length;
    const r = await api(env, origin)("POST", "/auth/forgot", { body: { email: "marka@x.co", lang: "tr" } });
    assert.equal(r.status, 200, `${origin} ${JSON.stringify(r.body)}`);
    assert.equal(sent.length, before + 1, origin);
    const parts = mailParts(sent.at(-1));
    for (const part of parts) assert.equal(part.includes("evil.example"), false, origin);
    return parts[0].match(/https?:\/\/\S+#t=[A-Za-z0-9_-]{43}/)?.[0];
  };
  const cases = [
    ["https://brandcorner.co", "https://brandcorner.co"],
    ["https://www.brandcorner.co", "https://www.brandcorner.co"],
    [ORIGIN, ORIGIN],
    // Alan adı doğru ama Origin'in geri kalanı saldırganın: link doğrulanmış siteye döner
    ["https://brandcorner.co/ Yeni adres: https://evil.example/r", "https://brandcorner.co"],
    ["https://brandcorner.co/x https://evil.example", "https://brandcorner.co"],
    ["http://brandcorner.co", "https://brandcorner.co"],
    ["https://brandcorner.co:8443", "https://brandcorner.co"],
    ["https://evil.example@brandcorner.co", "https://brandcorner.co"],
  ];
  for (const [origin, base] of cases) {
    const link = await linkFor(origin);
    assert.ok(link?.startsWith(`${base}/sifre-yenile#t=`), `${origin} → ${link}`);
  }
});

test("syncAccount: okuma ile yazma arasında hesap değişirse eski token ve kullanıcı adı yazılmaz", async () => {
  const { db, env, join } = await setup({ ...TT_ENV, OAUTH_TOKEN_KEY: KEY });
  const inf = await join("influencer", "inf@x.co");
  const tok = () => db.prepare("SELECT * FROM oauth_tokens WHERE user_id = ? AND platform = 'tiktok'").get(inf.id);
  const acc = () => db.prepare("SELECT * FROM social_accounts WHERE user_id = ? AND platform = 'tiktok'").get(inf.id);
  const reset = async (ext, expiresSql) => {
    db.prepare("DELETE FROM social_accounts").run();
    db.prepare("DELETE FROM oauth_tokens").run();
    db.prepare("INSERT INTO social_accounts (user_id, platform, handle, external_id, status) VALUES (?, 'tiktok', 'eski', ?, 'connected')").run(inf.id, ext);
    db.prepare(`INSERT INTO oauth_tokens (user_id, platform, access_token, refresh_token, expires_at) VALUES (?, 'tiktok', ?, ?, datetime('now', '${expiresSql}'))`)
      .run(inf.id, await encrypt(env, "tt-eski-access"), await encrypt(env, "tt-eski-refresh"));
  };
  const other = await encrypt(env, "baska-access");
  const changed = e => e instanceof ProviderError && e.code === "changed";

  // Yenileme sürerken başka bir senkron ya da yeniden bağlama token'ı değiştirdi: yeni token ezilmez
  await reset("tt-1", "-1 hours");
  const race = fakeFetch(ttRoutes([[`${TT}/oauth/token/`, () => {
    db.prepare("UPDATE oauth_tokens SET access_token = ? WHERE platform = 'tiktok'").run(other);
    return [200, { access_token: "tt-yeni-access", refresh_token: "tt-yeni-refresh", expires_in: 86400, open_id: "tt-1" }];
  }]]));
  await assert.rejects(syncAccount(env, inf.id, "tiktok", race), changed);
  assert.equal(tok().access_token, other);
  assert.equal(await decrypt(env, tok().refresh_token), "tt-eski-refresh");
  assert.deepEqual([acc().handle, acc().error], ["eski", null]);
  assert.equal(race.calls.some(c => c.url.startsWith(`${TT}/user/info/`)), false);

  // Ölçüm alınırken kullanıcı başka bir hesap bağladı: eski hesabın kullanıcı adı yenisine yazılmaz
  await reset("tt-1", "+1 hours");
  const swap = fakeFetch(ttRoutes([[`${TT}/user/info/`, () => {
    db.prepare("UPDATE social_accounts SET external_id = 'tt-2', handle = 'yeni' WHERE platform = 'tiktok'").run();
    return [200, { data: { user: { open_id: "tt-1", username: "inf_tt", follower_count: 12000 } }, error: { code: "ok", message: "" } }];
  }]]));
  await assert.rejects(syncAccount(env, inf.id, "tiktok", swap), changed);
  assert.deepEqual([acc().external_id, acc().handle, acc().error], ["tt-2", "yeni", null]);

  // Ölçüm alınırken bağ koparıldı: satıra yazılmaz, ölçüm dönmez
  await reset("tt-1", "+1 hours");
  const gone = fakeFetch(ttRoutes([[`${TT}/user/info/`, () => {
    db.prepare("UPDATE social_accounts SET status = 'revoked', external_id = NULL WHERE platform = 'tiktok'").run();
    return [200, { data: { user: { open_id: "tt-1", username: "inf_tt", follower_count: 12000 } }, error: { code: "ok", message: "" } }];
  }]]));
  await assert.rejects(syncAccount(env, inf.id, "tiktok", gone), changed);
  assert.deepEqual([acc().status, acc().handle, acc().error], ["revoked", "eski", null]);

  // Token kayıtlı hesaptan başka bir hesabı döndürüyor: yazılmaz
  await reset("tt-9", "+1 hours");
  await assert.rejects(syncAccount(env, inf.id, "tiktok", fakeFetch(ttRoutes())), changed);
  assert.deepEqual([acc().handle, acc().error], ["eski", null]);

  // Yenileme sürerken token başka bir senkronla değişti, sağlayıcı da eski refresh token'ı reddetti: hata yeni bağa yazılmaz
  await reset("tt-1", "-1 hours");
  const lost = fakeFetch(ttRoutes([[`${TT}/oauth/token/`, () => {
    db.prepare("UPDATE oauth_tokens SET access_token = ? WHERE platform = 'tiktok'").run(other);
    return [400, { error: "invalid_grant", error_description: "refresh token kullanıldı" }];
  }]]));
  await assert.rejects(syncAccount(env, inf.id, "tiktok", lost), changed);
  assert.equal(tok().access_token, other);
  assert.deepEqual([acc().handle, acc().error], ["eski", null]);

  // Ölçüm alınırken bağ koparılıp aynı hesapla yeniden kuruldu, eski token reddedildi: hata yeni bağa yazılmaz
  await reset("tt-1", "+1 hours");
  const relinked = fakeFetch(ttRoutes([[`${TT}/user/info/`, () => {
    db.prepare("UPDATE oauth_tokens SET access_token = ? WHERE platform = 'tiktok'").run(other);
    return [401, { error: { code: "access_token_invalid", message: "" } }];
  }]]));
  await assert.rejects(syncAccount(env, inf.id, "tiktok", relinked), changed);
  assert.deepEqual([acc().handle, acc().error], ["eski", null]);

  // Yenileme kendi token'ını yazdı, ölçüm reddedildi: hata yeni token'a göre yazılır
  await reset("tt-1", "-1 hours");
  const denied = fakeFetch(ttRoutes([[`${TT}/user/info/`, [401, { error: { code: "access_token_invalid", message: "" } }]]]));
  await assert.rejects(syncAccount(env, inf.id, "tiktok", denied), e => e instanceof ProviderError && e.code !== "changed");
  assert.equal(await decrypt(env, tok().access_token), "tt-yeni-access");
  assert.notEqual(acc().error, null);

  // Sağlam durumda yazılır
  await reset("tt-1", "+1 hours");
  assert.equal((await syncAccount(env, inf.id, "tiktok", fakeFetch(ttRoutes()))).handle, "inf_tt");
  assert.deepEqual([acc().handle, acc().error], ["inf_tt", null]);
});
