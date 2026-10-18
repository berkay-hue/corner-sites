// node --test src/oauth.test.mjs — D1 yerine node:sqlite, sağlayıcılar yerine sahte fetch; gerçek ağ, secret ve deploy yok.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";

// smtp.js "cloudflare:sockets" içe aktarır; Node'da yok, testte sahte modül verilir
registerHooks({
  resolve(spec, ctx, next) {
    return spec === "cloudflare:sockets"
      ? { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true }
      : next(spec, ctx);
  },
});
const { platform } = await import("./platform.js");
const {
  NOT_CONFIGURED, NO_DATA, OAUTH, ProviderError, oauthReady, redirectUri, listConnections, authorizeUrl,
  exchangeCode, fetchMetrics, encrypt, decrypt, syncAccount, oauthCallback,
} = await import("./oauth.js");

const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const MIGRATION = readFileSync(new URL("../migrations/0002_oauth.sql", import.meta.url), "utf8");

// Testin ihtiyacı kadar D1: prepare().bind().all/first/run, batch, exec
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
  return { prepare: sql => stmt(sql), batch: async list => Promise.all(list.map(s => s.run())), exec: async sql => db.exec(sql) };
}

function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
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
function api(env) {
  return async (method, path, { token, body, ip = "10.0.0.1" } = {}) => {
    const headers = { "cf-connecting-ip": ip, "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const res = await platform(req, new URL(req.url), env, ORIGIN, async () => {});
    return { status: res.status, body: await res.json() };
  };
}

async function setup(extraEnv = {}) {
  const db = freshDb();
  const env = { DB: d1(db), DEV_ORIGINS: ORIGIN, PBKDF2_ITER: "10000", ...extraEnv };
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

const callback = (env, path, f) => {
  const req = new Request(`https://forms.test${path}`);
  return oauthCallback(req, new URL(req.url), env, f);
};

test("bağlantı uçları: yetki ve yapılandırılmamış durum", async () => {
  const { call, join } = await setup();
  const brand = await join("brand", "marka@x.co"), inf = await join("influencer", "inf@x.co");

  assert.equal((await call("GET", "/app/connections")).status, 401);
  assert.equal((await call("GET", "/app/connections", { token: brand.token })).status, 403);
  assert.equal((await call("POST", "/app/connect", { token: brand.token, body: { platform: "instagram" } })).status, 403);

  const list = await call("GET", "/app/connections", { token: inf.token });
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.connections.map(x => [x.platform, x.label]), [
    ["instagram", NOT_CONFIGURED], ["tiktok", NOT_CONFIGURED], ["youtube", NOT_CONFIGURED],
    ["x", NO_DATA], ["linkedin", NO_DATA], ["twitch", NO_DATA],
  ]);
  const err = async platformName => {
    const r = await call("POST", "/app/connect", { token: inf.token, body: { platform: platformName } });
    return [r.status, r.body.error];
  };
  assert.deepEqual(await err("linkedin"), [400, "no_api"]);
  assert.deepEqual(await err("myspace"), [400, "platform"]);
  assert.deepEqual(await err("instagram"), [409, "not_configured"]);
  assert.equal((await call("POST", "/app/disconnect", { token: inf.token, body: { platform: "instagram" } })).status, 200);

  // Yapılandırılmamış dönüş adresi
  const r = await callback({}, "/oauth/instagram/callback?code=x&state=" + "a".repeat(43));
  assert.equal(r.status, 503);
  assert.equal(await r.text(), NOT_CONFIGURED);
});

test("Instagram bağlama: state tek kullanımlık, token şifreli, panele dönüş", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, call, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY });
  const inf = await join("influencer", "inf@x.co");
  const start = async () => {
    const r = await call("POST", "/app/connect", { token: inf.token, body: { platform: "instagram" } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const u = new URL(r.body.url);
    assert.equal(u.searchParams.get("redirect_uri"), "https://forms.test/oauth/instagram/callback");
    assert.doesNotMatch(r.body.url, /gizli/);
    return u.searchParams.get("state");
  };

  const state = await start();
  assert.match(state, /^[A-Za-z0-9_-]{43}$/);
  const row = db.prepare("SELECT * FROM oauth_states").get();
  assert.equal(row.state_hash, hash(state));
  assert.equal(row.return_to, `${ORIGIN}/panel`);
  assert.equal(row.user_id, inf.id);

  const f = fakeFetch(igRoutes());
  const ok = await callback(env, `/oauth/instagram/callback?code=kod-1&state=${state}`, f);
  assert.equal(ok.status, 302);
  assert.equal(ok.headers.get("location"), `${ORIGIN}/panel?oauth=instagram&result=ok`);
  assert.equal(f.calls[0].body.redirect_uri, "https://forms.test/oauth/instagram/callback");
  const tok = db.prepare("SELECT * FROM oauth_tokens WHERE user_id = ?").get(inf.id);
  assert.equal(tok.handle, "inf_ig");
  assert.equal(tok.external_id, "1784");
  assert.equal(tok.refresh_token, null);
  assert.ok(tok.expires_at);
  assert.doesNotMatch(tok.access_token, /ig-uzun-token/);
  assert.equal(await decrypt(env, tok.access_token), "ig-uzun-token");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM oauth_states").get().n, 0);

  // Aynı state ikinci kez kullanılamaz
  assert.equal((await callback(env, `/oauth/instagram/callback?code=kod-1&state=${state}`, f)).status, 400);
  const list = await call("GET", "/app/connections", { token: inf.token });
  assert.deepEqual(list.body.connections.slice(0, 3).map(x => [x.platform, x.status, x.handle]),
    [["instagram", "connected", "inf_ig"], ["tiktok", "not_configured", null], ["youtube", "not_configured", null]]);

  // Kullanıcı reddederse: denied, token değişmez
  const denied = await callback(env, `/oauth/instagram/callback?error=access_denied&state=${await start()}`, f);
  assert.equal(denied.headers.get("location"), `${ORIGIN}/panel?oauth=instagram&result=denied`);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM oauth_tokens").get().n, 1);

  // Sağlayıcı hatası: error ile panele dönüş
  const failing = fakeFetch([["https://api.instagram.com/oauth/access_token", [400, { error_type: "OAuthException", code: 400, error_message: "bad code" }]]]);
  const err = await callback(env, `/oauth/instagram/callback?code=bozuk&state=${await start()}`, failing);
  assert.equal(err.headers.get("location"), `${ORIGIN}/panel?oauth=instagram&result=error`);

  // Geçersiz, süresi dolmuş ya da başka platformun state'i
  assert.equal((await callback(env, "/oauth/instagram/callback?code=x&state=kisa", f)).status, 400);
  const old = "o".repeat(43);
  db.prepare("INSERT INTO oauth_states (state_hash, user_id, platform, return_to, expires_at) VALUES (?, ?, 'instagram', ?, datetime('now', '-1 minutes'))")
    .run(hash(old), inf.id, `${ORIGIN}/panel`);
  assert.equal((await callback(env, `/oauth/instagram/callback?code=x&state=${old}`, f)).status, 400);
  const other = "t".repeat(43);
  db.prepare("INSERT INTO oauth_states (state_hash, user_id, platform, return_to, expires_at) VALUES (?, ?, 'tiktok', 'https://kotu.example', datetime('now', '+5 minutes'))")
    .run(hash(other), inf.id);
  assert.equal((await callback(env, `/oauth/instagram/callback?code=x&state=${other}`, f)).status, 400);
  assert.equal((await callback(env, "/oauth/myspace/callback?code=x", f)).status, 404);

  // Bağlantıyı kaldırma
  assert.equal((await call("POST", "/app/disconnect", { token: inf.token, body: { platform: "instagram" } })).status, 200);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM oauth_tokens").get().n, 0);
  assert.equal((await call("GET", "/app/connections", { token: inf.token })).body.connections[0].status, "available");
});

test("syncAccount: süresi dolan token yenilenir, hata kaydedilir", async () => {
  const { db, env, join } = await setup({ ...TT_ENV, ...YT_ENV, OAUTH_TOKEN_KEY: KEY });
  const inf = await join("influencer", "inf@x.co");
  const put = async (p, access, refresh, expiresSql) => db.prepare(
    `INSERT INTO oauth_tokens (user_id, platform, handle, access_token, refresh_token, expires_at) VALUES (?, ?, 'eski', ?, ?, datetime('now', '${expiresSql}'))`,
  ).run(inf.id, p, await encrypt(env, access), await encrypt(env, refresh));
  const tok = p => db.prepare("SELECT * FROM oauth_tokens WHERE user_id = ? AND platform = ?").get(inf.id, p);

  await assert.rejects(syncAccount(env, inf.id, "tiktok", fakeFetch([])), e => e.code === "not_connected");
  await assert.rejects(syncAccount(env, inf.id, "instagram", fakeFetch([])), e => e.code === "not_configured");

  // TikTok: süresi geçmiş, yenilenir; yeni refresh token da saklanır
  await put("tiktok", "tt-eski-access", "tt-eski-refresh", "-1 hours");
  const tf = fakeFetch(ttRoutes());
  const m = await syncAccount(env, inf.id, "tiktok", tf);
  assert.deepEqual([m.followers, m.avg_views, m.handle], [12000, 6000, "inf_tt"]);
  assert.deepEqual(tf.calls[0].body, { client_key: "tt-client-key", client_secret: "tt-gizli-secret", grant_type: "refresh_token", refresh_token: "tt-eski-refresh" });
  assert.equal(tf.calls[1].headers.authorization, "Bearer tt-yeni-access");
  const t1 = tok("tiktok");
  assert.equal(await decrypt(env, t1.access_token), "tt-yeni-access");
  assert.equal(await decrypt(env, t1.refresh_token), "tt-yeni-refresh");
  assert.equal(t1.handle, "inf_tt");
  assert.equal(t1.error, null);

  // YouTube: geçerli token yenilenmez; yenilemede refresh token gelmezse eskisi kalır
  await put("youtube", "yt-access", "yt-refresh", "+1 hours");
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
  assert.equal(tok("youtube").error, "401:401");
  const list = await listConnections(env, inf.id);
  assert.deepEqual(list.slice(0, 3).map(x => [x.platform, x.status]), [["instagram", "not_configured"], ["tiktok", "connected"], ["youtube", "error"]]);
});
