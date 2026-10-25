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
const { platform, cleanup } = await import("./platform.js");
const {
  ytRetention, YT_RETAIN_DAYS,
  NOT_CONFIGURED, NO_DATA, OAUTH, ProviderError, oauthReady, redirectUri, listConnections, authorizeUrl,
  exchangeCode, fetchMetrics, encrypt, decrypt, syncAccount, oauthCallback, finishOAuth, OAuthFail,
  syncDue, SYNC_MIN, SYNC_D1, pkceChallenge, disconnectOAuth, CHANGE_LIMIT, SYNCED, LISTED, CONNECTABLE, cleanHandle, fetchProfile, refreshToken,
} = await import("./oauth.js");

const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const METRICS = readFileSync(new URL("../migrations/0001_metrics.sql", import.meta.url), "utf8");
const MIGRATION = readFileSync(new URL("../migrations/0002_oauth.sql", import.meta.url), "utf8");
const SYNC = readFileSync(new URL("../migrations/0003_sync.sql", import.meta.url), "utf8");
const CHANGES = readFileSync(new URL("../migrations/0004_sync_changes.sql", import.meta.url), "utf8");
const NOTIFY = readFileSync(new URL("../migrations/0005_notify.sql", import.meta.url), "utf8");
const POSTS = readFileSync(new URL("../migrations/0006_posts.sql", import.meta.url), "utf8");
const SOURCE = readFileSync(new URL("../migrations/0007_post_source.sql", import.meta.url), "utf8");
const AUDIENCE = readFileSync(new URL("../migrations/0009_audience.sql", import.meta.url), "utf8");
const POST_AUD = readFileSync(new URL("../migrations/0010_post_audience.sql", import.meta.url), "utf8");

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
  db.exec(SYNC);
  db.exec(CHANGES);
  db.exec(NOTIFY);
  db.exec(POSTS);
  db.exec(SOURCE);
  db.exec(AUDIENCE);
  db.exec(POST_AUD);
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

// Gönderi aktarımı: m4'ün bağlantısı instagram.com değil, m6'nın hiç ölçümü yok (ikisi de aktarılmaz, ortalamaya girer)
const IG_REFRESH = ["https://graph.instagram.com/refresh_access_token?", [200, { access_token: "ig-yeni", expires_in: 5184000 }]];
const IG_MEDIA = [
  { id: "m1", like_count: 100, comments_count: 4, permalink: "https://www.instagram.com/p/AAA/", timestamp: "2026-10-20T10:00:00+0000",
    media_type: "IMAGE", media_product_type: "FEED", caption: "İlk gönderi", media_url: "https://cdn.ig.test/m1.jpg" },
  { id: "m2", like_count: 50, comments_count: 2, permalink: "https://www.instagram.com/reel/BBB/", timestamp: "2026-10-21T09:30:00+0000",
    media_type: "VIDEO", media_product_type: "REELS", caption: "Reel", media_url: "https://cdn.ig.test/m2.mp4", thumbnail_url: "https://cdn.ig.test/m2.jpg" },
  { id: "m3", like_count: 10, comments_count: 1, permalink: "https://www.instagram.com/p/CCC/", timestamp: "2026-10-22T08:00:00+0000",
    media_type: "CAROUSEL_ALBUM", media_product_type: "FEED", caption: "x".repeat(2300), media_url: "https://cdn.ig.test/m3.jpg" },
  { id: "m4", like_count: 7, comments_count: 0, permalink: "https://evil.test/p/DDD/", timestamp: "2026-10-22T08:00:00+0000", media_type: "IMAGE" },
  { id: "m5", comments_count: 3, permalink: "https://www.instagram.com/p/EEE/", timestamp: "2026-10-23T07:00:00+0000",
    media_type: "VIDEO", media_product_type: "FEED", media_url: "https://cdn.ig.test/m5.mp4" },
  { id: "m6", permalink: "https://www.instagram.com/p/FFF/", timestamp: "2026-10-23T07:00:00+0000", media_type: "IMAGE" },
];
const IG_POSTS = [
  { url: "https://www.instagram.com/p/AAA/", type: "photo", date: "2026-10-20", caption: "İlk gönderi", thumb: "https://cdn.ig.test/m1.jpg", likes: 100, comments: 4, views: 1000, reach: 800 },
  { url: "https://www.instagram.com/reel/BBB/", type: "reel", date: "2026-10-21", caption: "Reel", thumb: "https://cdn.ig.test/m2.jpg", likes: 50, comments: 2, views: 3000, reach: 2500 },
  { url: "https://www.instagram.com/p/CCC/", type: "carousel", date: "2026-10-22", caption: "x".repeat(2200), thumb: "https://cdn.ig.test/m3.jpg", likes: 10, comments: 1, views: 400, reach: null },
  { url: "https://www.instagram.com/p/EEE/", type: "video", date: "2026-10-23", caption: "", thumb: "", likes: null, comments: 3, views: null, reach: null },
];
const igPostRoutes = (extra = [], media = IG_MEDIA) => igRoutes([
  ...extra,
  [`${IGV}/me/media?`, [200, { data: media }]],
  [`${IGV}/m1/insights?`, [200, { data: [{ name: "views", total_value: { value: 1000 } }, { name: "reach", total_value: { value: 800 } }] }]],
  [`${IGV}/m2/insights?`, [200, { data: [{ name: "views", values: [{ value: 3000 }] }, { name: "reach", values: [{ value: 2500 }] }] }]],
  [`${IGV}/m3/insights?`, [200, { data: [{ name: "views", total_value: { value: 400 } }] }]],
  [`${IGV}/m4/insights?`, [200, { data: [{ name: "views", total_value: { value: 50 } }] }]],
  [`${IGV}/m5/insights?`, [400, { error: { message: "unsupported", type: "OAuthException", code: 100 } }]],
  [`${IGV}/m6/insights?`, [400, { error: { message: "unsupported", type: "OAuthException", code: 100 } }]],
]);

const TT = "https://open.tiktokapis.com/v2";
const ttRoutes = (extra = []) => [
  ...extra,
  [`${TT}/oauth/token/`, (u, b) => [200, b.grant_type === "refresh_token"
    ? { access_token: "tt-yeni-access", refresh_token: "tt-yeni-refresh", expires_in: 86400, open_id: "tt-1" }
    : { access_token: "tt-access", refresh_token: "tt-refresh", expires_in: 86400, open_id: "tt-1", scope: "user.info.basic,video.list" }]],
  [`${TT}/user/info/`, [200, { data: { user: { open_id: "tt-1", username: "inf_tt", display_name: "Inf", follower_count: 12000 } }, error: { code: "ok", message: "" } }]],
  [`${TT}/video/list/`, [200, { data: { videos: [
    { id: "v1", create_time: Date.UTC(2026, 9, 20, 10) / 1000, share_url: "https://www.tiktok.com/@inf_tt/video/v1?utm_campaign=tt4d_open_api&utm_source=x",
      cover_image_url: "https://p16.tiktokcdn.test/v1.jpeg", video_description: "İlk video", title: "", view_count: 5000, like_count: 300, comment_count: 20 },
    { id: "v2", create_time: Date.UTC(2026, 9, 21, 12) / 1000, share_url: "https://www.tiktok.com/@inf_tt/video/v2", title: "Başlık",
      view_count: 7000, like_count: 500, comment_count: 40 },
  ] }, error: { code: "ok" } }]],
];
// Paylaşım bağlantısının izleme sorgusu atılır; açıklama yoksa başlık, kapak yoksa boş; TikTok erişim vermez
const TT_POSTS = [
  { url: "https://www.tiktok.com/@inf_tt/video/v1", type: "video", date: "2026-10-20", caption: "İlk video", thumb: "https://p16.tiktokcdn.test/v1.jpeg", likes: 300, comments: 20, views: 5000, reach: null },
  { url: "https://www.tiktok.com/@inf_tt/video/v2", type: "video", date: "2026-10-21", caption: "Başlık", thumb: "", likes: 500, comments: 40, views: 7000, reach: null },
];

const YT = "https://www.googleapis.com/youtube/v3";
const ytRoutes = (extra = []) => [
  ...extra,
  ["https://oauth2.googleapis.com/token", (u, b) => [200, b.grant_type === "refresh_token"
    ? { access_token: "yt-yeni-access", expires_in: 3599 }
    : { access_token: "yt-access", refresh_token: "yt-refresh", expires_in: 3599, scope: "https://www.googleapis.com/auth/youtube.readonly" }]],
  [`${YT}/channels?`, [200, { items: [{ id: "UC1", snippet: { title: "Inf Kanal", customUrl: "@infyt" }, statistics: { subscriberCount: "8800", hiddenSubscriberCount: false }, contentDetails: { relatedPlaylists: { uploads: "UU1" } } }] }]],
  [`${YT}/playlistItems?`, [200, { items: [{ contentDetails: { videoId: "a" } }, { contentDetails: { videoId: "b" } }] }]],
  [`${YT}/videos?`, [200, { items: [
    { id: "a", snippet: { publishedAt: "2026-10-19T08:00:00Z", title: "Video A", thumbnails: { default: { url: "https://i.ytimg.test/a/default.jpg" }, medium: { url: "https://i.ytimg.test/a/mqdefault.jpg" },
      high: { url: "https://i.ytimg.test/a/hqdefault.jpg" } } },
      status: { privacyStatus: "public" }, statistics: { viewCount: "900", likeCount: "90", commentCount: "9" } },
    { id: "b", snippet: { publishedAt: "2026-10-22T18:30:00Z", title: "Video B", thumbnails: { default: { url: "https://i.ytimg.test/b/default.jpg" } } },
      status: { privacyStatus: "unlisted" }, statistics: { viewCount: "1100" } },
  ] }]],
];
// Bağlantı watch?v=<kimlik>, kapak önce orta boy; liste dışı video aktarılır; YouTube erişim vermez
const YT_POSTS = [
  { url: "https://www.youtube.com/watch?v=a", type: "video", date: "2026-10-19", caption: "Video A", thumb: "https://i.ytimg.test/a/mqdefault.jpg", likes: 90, comments: 9, views: 900, reach: null },
  { url: "https://www.youtube.com/watch?v=b", type: "video", date: "2026-10-22", caption: "Video B", thumb: "https://i.ytimg.test/b/default.jpg", likes: null, comments: null, views: 1100, reach: null },
];

// ---- yapılandırma ----

test("secret yoksa ya da eksikse 'yapılandırılmadı'; X, Twitch 'veri yok'; DB'ye dokunulmaz", async () => {
  const label = list => Object.fromEntries(list.map(x => [x.platform, [x.status, x.label]]));
  // env.DB yok: yapılandırılmamışken sorgu atılsaydı hata verirdi
  assert.deepEqual(label(await listConnections({}, 1)), {
    instagram: ["not_configured", NOT_CONFIGURED], tiktok: ["not_configured", NOT_CONFIGURED], youtube: ["not_configured", NOT_CONFIGURED],
    linkedin: ["not_configured", NOT_CONFIGURED], x: ["no_api", NO_DATA], twitch: ["no_api", NO_DATA],
  });
  assert.equal(oauthReady({ ...IG_ENV }, "instagram"), false, "anahtar yok");
  assert.equal(oauthReady({ INSTAGRAM_CLIENT_ID: "x", OAUTH_TOKEN_KEY: KEY }, "instagram"), false, "secret yok");
  assert.equal(oauthReady({ ...IG_ENV, OAUTH_TOKEN_KEY: Buffer.alloc(16).toString("base64") }, "instagram"), false, "anahtar 16 bayt");
  assert.equal(oauthReady({ ...IG_ENV, OAUTH_TOKEN_KEY: "%%%" }, "instagram"), false, "anahtar bozuk");
  assert.equal(oauthReady({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY }, "instagram"), true);
  assert.equal(oauthReady({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY }, "tiktok"), false);
  assert.equal(oauthReady({ ...ALL, LINKEDIN_CLIENT_ID: "x", LINKEDIN_CLIENT_SECRET: "y" }, "linkedin"), true);
  assert.equal(oauthReady(ALL, "linkedin"), false);
  assert.deepEqual(OAUTH, ["instagram", "tiktok", "youtube", "linkedin"]);
  assert.deepEqual(SYNCED, ["instagram", "tiktok", "youtube"]);
  assert.deepEqual(LISTED, ["instagram", "tiktok", "youtube", "x", "linkedin", "twitch"]);
  assert.deepEqual(CONNECTABLE, {
    influencer: ["instagram", "tiktok", "youtube", "linkedin"],
    brand: ["instagram", "tiktok", "youtube", "linkedin"],
    agency: ["instagram", "tiktok", "youtube", "linkedin"],
  });
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
  // YT_ANALYTICS "1": kitle raporu izni de istenir; başka platformun izni değişmez
  const yta = new URL(authorizeUrl({ ...ALL, YT_ANALYTICS: "1" }, "youtube", "s", redirect("youtube")));
  assert.equal(yta.searchParams.get("scope"), "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly");
  assert.equal(new URL(authorizeUrl({ ...ALL, YT_ANALYTICS: "1" }, "tiktok", "s", redirect("tiktok"))).searchParams.get("scope"), tt.searchParams.get("scope"));

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

test("metrikler: takipçi ve son gönderilerin ortalamaları; gizli değer ortalamaya girmez", async t => {
  t.mock.method(console, "log", () => {}); // kitle raporu yolu yok: "yt audience error 404"
  const ig = await fetchMetrics("instagram", "ig-token", fakeFetch(igRoutes()));
  // m2'nin beğenisi gizli, m3'ün izlenmesi alınamadı
  assert.deepEqual(ig, { external_id: "1784", handle: "inf_ig", followers: 5400, avg_views: 2001, avg_likes: 151, avg_comments: 3, posts_sampled: 3, posts: [], posts_recent: 0, audience: null });

  // Bağlantılı gönderiler aktarılacaklar listesine girer: tür, tarih, kapak, metin (2200), izlenme ve erişim
  const igf = fakeFetch(igPostRoutes());
  const igp = await fetchMetrics("instagram", "ig-token", igf);
  assert.deepEqual(igp.posts, IG_POSTS);
  assert.deepEqual([igp.avg_views, igp.avg_likes, igp.avg_comments, igp.posts_sampled], [1113, 42, 2, 6]);
  assert.match(new URL(igf.calls[1].url).searchParams.get("fields"), /\bpermalink\b.*\btimestamp\b.*\bthumbnail_url\b/);
  assert.ok(igf.calls.slice(2).filter(c => !c.url.startsWith(`${IGV}/me/`)).every(c => new URL(c.url).searchParams.get("metric") === "views,reach"));

  const ttf = fakeFetch(ttRoutes());
  assert.deepEqual(await fetchMetrics("tiktok", "tt-token", ttf),
    { external_id: "tt-1", handle: "inf_tt", followers: 12000, avg_views: 6000, avg_likes: 400, avg_comments: 30, posts_sampled: 2, posts: TT_POSTS, posts_recent: 2, audience: null });
  assert.equal(ttf.calls[0].headers.authorization, "Bearer tt-token");
  assert.deepEqual(ttf.calls[1].body, { max_count: 20 });
  assert.match(new URL(ttf.calls[1].url).searchParams.get("fields"), /\bcreate_time\b.*\bshare_url\b.*\bcover_image_url\b/);

  // YouTube sayıları metin döner; eksik beğeni/yorum ortalamaya girmez. Kitle raporu yolu yok (404): kitle nedeniyle döner
  const ytf = fakeFetch(ytRoutes());
  assert.deepEqual(await fetchMetrics("youtube", "yt-token", ytf),
    { external_id: "UC1", handle: "@infyt", followers: 8800, avg_views: 1000, avg_likes: 90, avg_comments: 9, posts_sampled: 2, posts: YT_POSTS, posts_recent: 2, audience: { reason: "error" } });
  assert.match(ytf.calls.findLast(c => c.url.startsWith(`${YT}/videos?`)).url, /part=snippet,statistics,status&fields=[^&]+&id=a,b$/);

  // Gizli abone sayısı ve videosuz kanal (yükleme listesi 404)
  const hidden = fakeFetch(ytRoutes([
    [`${YT}/channels?`, [200, { items: [{ id: "UC2", snippet: { title: "Yeni" }, statistics: { subscriberCount: "0", hiddenSubscriberCount: true }, contentDetails: { relatedPlaylists: { uploads: "UU2" } } }] }]],
    [`${YT}/playlistItems?`, [404, { error: { code: 404, message: "playlistNotFound" } }]],
  ]));
  assert.deepEqual(await fetchMetrics("youtube", "t", hidden),
    { external_id: "UC2", handle: "Yeni", followers: null, avg_views: null, avg_likes: null, avg_comments: null, posts_sampled: 0, posts: [], posts_recent: 0, audience: { reason: "error" } });

  const noChannel = fakeFetch([[`${YT}/channels?`, [200, { items: [] }]]]);
  await assert.rejects(fetchMetrics("youtube", "t", noChannel), e => e.code === "no_channel");
});

// Instagram kitle yanıtı: data[metric][kırılım] = {değer: sayı}; olmayan kırılım 400 (eşiğin altı). dimension_keys
// takipçide başta "timeframe" taşır, etkileşende yalnız kırılımın kendisi
const igAudience = data => [`${IGV}/me/insights?`, u => {
  const q = new URL(u).searchParams, metric = q.get("metric"), k = q.get("breakdown"), d = data[metric]?.[k];
  if (!d) return [400, { error: { message: "Not enough followers", type: "OAuthException", code: 100 } }];
  const tf = metric === "follower_demographics";
  return [200, { data: [{ name: metric, period: "lifetime", total_value: { breakdowns: [{
    dimension_keys: tf ? ["timeframe", k] : [k],
    results: Object.entries(d).map(([v, value]) => ({ dimension_values: tf ? ["this_month", v] : [v], value })),
  }] } }] }];
}];
const IG_AUD = {
  follower_demographics: {
    // "?" bilinmeyen yaş: listede yok, paydada var; boş anahtar ve 0 atılır
    age: { "25-34": 500, "18-24": 300, "45-54": 150, "13-17": 0, "": 30, "?": 50 },
    gender: { M: 600, F: 350, U: 50 },
    // İlk 10; payda cinsiyet toplamı (1000), ülkelerin kendi toplamı (952) değil
    country: { TR: 700, DE: 100, US: 50, NL: 30, GB: 20, FR: 15, AZ: 12, CY: 9, AT: 7, BE: 5, CH: 3, SE: 1 },
    city: { "Ankara, Ankara Province": 123, "Istanbul, Istanbul Province": 400 },
  },
  engaged_audience_demographics: { gender: { F: 1, M: 2 } },
};
const IG_AUD_OUT = {
  followers: {
    age: [["18-24", 30], ["25-34", 50], ["45-54", 15]],
    gender: [["F", 35], ["M", 60], ["U", 5]],
    country: [["TR", 70], ["DE", 10], ["US", 5], ["NL", 3], ["GB", 2], ["FR", 1.5], ["AZ", 1.2], ["CY", 0.9], ["AT", 0.7], ["BE", 0.5]],
    city: [["Istanbul, Istanbul Province", 40], ["Ankara, Ankara Province", 12.3]],
  },
  engaged: { gender: [["F", 33.3], ["M", 66.7]] },
};

test("kitle: Instagram takipçi ve etkileşen dağılımı; yaş ve cinsiyet sabit sırayla, ülke ve şehir ilk 10, yüzde bir ondalık", async () => {
  const f = fakeFetch(igRoutes([igAudience(IG_AUD)]));
  const m = await fetchMetrics("instagram", "ig-token", f);
  assert.deepEqual(m.audience, IG_AUD_OUT);
  assert.equal(m.avg_views, 2001);
  // Kırılım başına bir çağrı, iki metrik
  const qs = f.calls.filter(c => c.url.startsWith(`${IGV}/me/insights?`)).map(c => Object.fromEntries(new URL(c.url).searchParams));
  assert.deepEqual(qs.map(q => `${q.metric}/${q.breakdown}`).sort(),
    ["engaged_audience_demographics", "follower_demographics"].flatMap(x => ["age", "city", "country", "gender"].map(k => `${x}/${k}`)));
  for (const { metric, breakdown, ...rest } of qs) {
    assert.deepEqual(rest, { period: "lifetime", timeframe: "this_month", metric_type: "total_value", access_token: "ig-token" });
  }

  // Etkileşen kitle eşiğin altında (hepsi 400): engaged null; ikisi de boşsa kitle yok
  const only = await fetchMetrics("instagram", "ig-token", fakeFetch(igRoutes([igAudience({ follower_demographics: IG_AUD.follower_demographics })])));
  assert.deepEqual(only.audience, { followers: IG_AUD_OUT.followers, engaged: null });
  assert.equal((await fetchMetrics("instagram", "ig-token", fakeFetch(igRoutes([igAudience({})])))).audience, null);
  // Yalnız 0 değerli sonuç da kitle sayılmaz; kitle hatası ölçümü bozmaz
  const zero = await fetchMetrics("instagram", "ig-token", fakeFetch(igRoutes([igAudience({ follower_demographics: { gender: { F: 0, M: 0 } } })])));
  assert.deepEqual([zero.audience, zero.followers, zero.avg_views], [null, 5400, 2001]);
});

// YouTube Analytics yanıtı: dimensions'a göre columnHeaders + rows; status 200 değilse o hata (body verilmezse izin
// hatası). empty: bu filters değerlerinde satır yok (null: kanal raporu), YouTube eşiğin altında rows'u hiç göndermez
const YTA = "https://youtubeanalytics.googleapis.com/v2/reports?";
const YT_DEMO = {
  columnHeaders: [{ name: "ageGroup" }, { name: "gender" }, { name: "viewerPercentage" }],
  rows: [["age18-24", "female", 20.5], ["age18-24", "male", 14.5], ["age25-34", "female", 30], ["age25-34", "male", 25], ["age65-", "user_specified", 10]],
};
const YT_GEO = { columnHeaders: [{ name: "country" }, { name: "views" }], rows: [["TR", 600], ["ZZ", 200], ["DE", 150], ["US", 50]] };
const YT_VIEWERS = { age: [["18-24", 35], ["25-34", 55], ["65+", 10]], gender: [["F", 50.5], ["M", 39.5], ["U", 10]], country: [["TR", 60], ["DE", 15], ["US", 5]] };
const ytAudience = (status = 200, { body, empty = [] } = {}) => [YTA, u => {
  if (status !== 200) return [status, body ?? { error: { code: status, message: "Request had insufficient authentication scopes.", status: "PERMISSION_DENIED" } }];
  const q = new URL(u).searchParams, r = q.get("dimensions") === "country" ? YT_GEO : YT_DEMO;
  return [200, empty.includes(q.get("filters")) ? { columnHeaders: r.columnHeaders } : r];
}];
const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);

test("kitle: YouTube izleyici yaşı ve cinsiyeti, ülkeye göre izlenme payı (ZZ paydada, listede yok); her video için yayın gününden düne aynı kırılım", async () => {
  const f = fakeFetch(ytRoutes([ytAudience()]));
  const m = await fetchMetrics("youtube", "yt-token", f);
  assert.deepEqual(m.audience, { viewers: YT_VIEWERS });
  const reps = f.calls.filter(c => c.url.startsWith(YTA));
  const qs = reps.map(c => Object.fromEntries(new URL(c.url).searchParams));
  for (const [i, q] of qs.entries()) {
    assert.equal(q.ids, "channel==MINE");
    assert.equal(reps[i].headers.authorization, "Bearer yt-token");
    assert.equal(q.endDate, yesterday());
  }
  // Kanal: dünden geriye 90 gün, filtresiz
  const ch = qs.filter(q => !q.filters);
  assert.deepEqual(ch.map(q => `${q.dimensions}:${q.metrics}`).sort(), ["ageGroup,gender:viewerPercentage", "country:views"]);
  assert.ok(ch.every(q => Date.parse(q.endDate) - Date.parse(q.startDate) === 90 * 864e5));
  // Video başına aynı iki rapor, yayın gününden; sonuç gönderinin audience alanında
  assert.deepEqual(qs.filter(q => q.filters).map(q => `${q.filters} ${q.startDate} ${q.dimensions}:${q.metrics}`).sort(), [
    "video==a 2026-10-19 ageGroup,gender:viewerPercentage", "video==a 2026-10-19 country:views",
    "video==b 2026-10-22 ageGroup,gender:viewerPercentage", "video==b 2026-10-22 country:views",
  ]);
  assert.deepEqual(m.posts, YT_POSTS.map(p => ({ ...p, audience: { viewers: YT_VIEWERS } })));

  // Eşiğin altındaki video (rows yok): o gönderide kitle yok, diğeri gelir
  const one = await fetchMetrics("youtube", "yt-token", fakeFetch(ytRoutes([ytAudience(200, { empty: ["video==b"] })])));
  assert.deepEqual(one.posts.map(p => p.audience), [{ viewers: YT_VIEWERS }, undefined]);
  // Kanal eşiğin altında: kitle nedeniyle ("few"), videolar yine sorulur
  const few = await fetchMetrics("youtube", "yt-token", fakeFetch(ytRoutes([ytAudience(200, { empty: [null] })])));
  assert.deepEqual([few.audience, few.posts.map(p => p.audience)], [{ reason: "few" }, [{ viewers: YT_VIEWERS }, { viewers: YT_VIEWERS }]]);
});

test("kitle: YouTube raporu alınamazsa neden döner (izin yok, API kapalı, diğer); video sorulmaz, ölçüm yine gelir", async t => {
  t.mock.method(console, "log", () => {});
  const run = async (status, body) => {
    const f = fakeFetch(ytRoutes([ytAudience(status, { body })]));
    const m = await fetchMetrics("youtube", "yt-token", f);
    assert.deepEqual([m.followers, m.avg_views, m.posts], [8800, 1000, YT_POSTS]);
    assert.equal(f.calls.filter(c => c.url.startsWith(YTA)).length, 2);
    return m.audience.reason;
  };
  // Google onay ekranında YouTube Analytics kutusu işaretlenmemiş: mesaj, errors[] ya da details[] ile
  assert.equal(await run(403), "no_scope");
  assert.equal(await run(403, { error: { code: 403, message: "x", errors: [{ reason: "insufficientPermissions" }] } }), "no_scope");
  assert.equal(await run(403, { error: { code: 403, message: "x", details: [{ reason: "ACCESS_TOKEN_SCOPE_INSUFFICIENT" }] } }), "no_scope");
  // GCP projesinde YouTube Analytics API kapalı
  assert.equal(await run(403, { error: { code: 403, message: "x", errors: [{ reason: "accessNotConfigured" }] } }), "api_off");
  assert.equal(await run(403, { error: { code: 403, message: "x", details: [{ reason: "SERVICE_DISABLED" }] } }), "api_off");
  assert.equal(await run(403, { error: { code: 403, message: "Forbidden" } }), "error");
  assert.equal(await run(500, "bozuk"), "error");
});

test("kitle: YouTube'da iki rapordan biri alınamazsa kanal gelenle sürer, gönderiye yarım kitle yazılmaz; gelen boşsa neden döner", async t => {
  t.mock.method(console, "log", () => {});
  // fail boyutundaki rapor 500; empty: bu filters değerlerinde gelen rapor satırsız (null: kanal raporu)
  const half = (fail, empty = []) => [YTA, u => {
    const q = new URL(u).searchParams, dim = q.get("dimensions");
    if (dim === fail) return [500, { error: { code: 500, message: "backendError" } }];
    const r = dim === "country" ? YT_GEO : YT_DEMO;
    return [200, empty.includes(q.get("filters")) ? { columnHeaders: r.columnHeaders } : r];
  }];
  const geoOff = await fetchMetrics("youtube", "yt-token", fakeFetch(ytRoutes([half("country")])));
  assert.deepEqual([geoOff.audience, geoOff.posts.map(p => p.audience)], [{ viewers: { age: YT_VIEWERS.age, gender: YT_VIEWERS.gender } }, [undefined, undefined]]);
  const demoOff = await fetchMetrics("youtube", "yt-token", fakeFetch(ytRoutes([half("ageGroup,gender")])));
  assert.deepEqual([demoOff.audience, demoOff.posts.map(p => p.audience)], [{ viewers: { country: YT_VIEWERS.country } }, [undefined, undefined]]);
  // Gelen kanal raporu boş, öteki alınamadı: "few" değil alınamayanın nedeni
  const emptyDemo = await fetchMetrics("youtube", "yt-token", fakeFetch(ytRoutes([half("country", [null])])));
  assert.deepEqual(emptyDemo.audience, { reason: "error" });
});

test("metrikler: TikTok ve YouTube'da adresi, tarihi ya da ölçümü uygun olmayan gönderi ve özel ya da izlenemeyen video aktarılmaz, ortalamaya girer", async t => {
  t.mock.method(console, "log", () => {}); // kitle raporu yolu yok: "yt audience error 404"
  // Elenen videoların ölçümleri 100/10/1; yalnız v9 aktarılır (sorgu ve parça atılır, http kapak boş, metin 2200, eksi ve kesirli sayı null)
  const ok = { create_time: Date.UTC(2026, 9, 20) / 1000, view_count: 100, like_count: 10, comment_count: 1 };
  const videos = [
    { ...ok, share_url: "https://www.tiktok.com.evil.test/@x/video/1" },
    { ...ok, share_url: "https://www.tiktok.com@evil.test/@x/video/2" },
    { ...ok, share_url: "http://www.tiktok.com/@x/video/3" },
    { ...ok, share_url: "https://www.tiktok.com:8443/@x/video/4" },
    { ...ok, share_url: "https://www.tiktok.com/@x/video/it's" },
    { ...ok, share_url: "https://www.tiktok.com/@x/video/6", create_time: undefined },
    { ...ok, share_url: "https://www.tiktok.com/@x/video/7", create_time: -5 },
    { ...ok, share_url: "https://www.tiktok.com/@x/video/8", create_time: 1e15 },
    { share_url: "https://www.tiktok.com/@x/video/9", create_time: ok.create_time },
    { share_url: "https://www.tiktok.com/@inf_tt/video/v9?lang=tr#yorum", create_time: ok.create_time, cover_image_url: "http://p16.tiktokcdn.test/v9.jpeg",
      video_description: "y".repeat(2300), view_count: 300, like_count: -1, comment_count: 2.5 },
  ];
  const tt = await fetchMetrics("tiktok", "t", fakeFetch(ttRoutes([[`${TT}/video/list/`, [200, { data: { videos }, error: { code: "ok" } }]]])));
  assert.deepEqual(tt.posts, [
    { url: "https://www.tiktok.com/@inf_tt/video/v9", type: "video", date: "2026-10-20", caption: "y".repeat(2200), thumb: "", likes: null, comments: null, views: 300, reach: null },
  ]);
  assert.deepEqual([tt.avg_views, tt.avg_likes, tt.avg_comments, tt.posts_sampled], [122, 10, 1, 10]);

  // Özel video, reddedilmiş, yüklemesi başarısız ya da silinmiş video, kimliği bozuk ve tarihsiz video aktarılmaz;
  // uygun olmayan kapak adayı atlanır. İşlenmiş (processed) video aktarılır.
  const snippet = { publishedAt: "2026-10-19T08:00:00Z", title: "T" }, pub = { privacyStatus: "public" };
  const items = [
    { id: "p1", snippet, status: { privacyStatus: "private" }, statistics: { viewCount: "500", likeCount: "50", commentCount: "5" } },
    { id: "b&x=1", snippet, status: pub, statistics: { viewCount: "500" } },
    { id: "p3", snippet: { title: "T" }, status: pub, statistics: { viewCount: "500" } },
    { id: "p4", snippet: { publishedAt: snippet.publishedAt, thumbnails: { medium: { url: "javascript:alert(1)" }, high: { url: "https://i.ytimg.test/p4/hqdefault.jpg" } } },
      status: pub, statistics: { viewCount: "100", likeCount: "x", commentCount: "" } },
    ...["rejected", "failed", "deleted", "processed"].map((uploadStatus, i) => ({ id: `u${i}`, snippet, status: { ...pub, uploadStatus }, statistics: { viewCount: "400" } })),
  ];
  const yt = await fetchMetrics("youtube", "t", fakeFetch(ytRoutes([
    [`${YT}/playlistItems?`, [200, { items: items.map(v => ({ contentDetails: { videoId: v.id } })) }]],
    [`${YT}/videos?`, [200, { items }]],
  ])));
  assert.deepEqual(yt.posts, [
    { url: "https://www.youtube.com/watch?v=p4", type: "video", date: "2026-10-19", caption: "", thumb: "https://i.ytimg.test/p4/hqdefault.jpg", likes: null, comments: null, views: 100, reach: null },
    { url: "https://www.youtube.com/watch?v=u3", type: "video", date: "2026-10-19", caption: "T", thumb: "", likes: null, comments: null, views: 400, reach: null },
  ]);
  assert.deepEqual([yt.avg_views, yt.avg_likes, yt.avg_comments, yt.posts_sampled], [400, 50, 5, 8]);
});

test("metrikler: Instagram'da yorumları kapalı gönderinin 0 yorumu ve erişimi olan gönderinin 0 izlenmesi ölçülmemiş sayılır", async () => {
  // m1: yorum kapalı ve 0, izlenme 0 ama erişim var; m2: yorum kapalı ama sayı var, izlenme ve erişim 0; m3: yorum açık ve 0
  // (kural ortalamaya uygulanmasaydı yorum ortalaması 1, izlenme ortalaması 133 çıkardı)
  const media = [
    { ...IG_MEDIA[0], comments_count: 0, is_comment_enabled: false },
    { ...IG_MEDIA[1], comments_count: 3, is_comment_enabled: false },
    { ...IG_MEDIA[2], comments_count: 0, is_comment_enabled: true },
  ];
  const f = fakeFetch(igPostRoutes([
    [`${IGV}/m1/insights?`, [200, { data: [{ name: "views", total_value: { value: 0 } }, { name: "reach", total_value: { value: 800 } }] }]],
    [`${IGV}/m2/insights?`, [200, { data: [{ name: "views", values: [{ value: 0 }] }, { name: "reach", values: [{ value: 0 }] }] }]],
  ], media));
  const m = await fetchMetrics("instagram", "ig-token", f);
  assert.deepEqual(m.posts.map(p => [p.comments, p.views, p.reach]), [[null, null, 800], [3, 0, 0], [0, 400, null]]);
  assert.deepEqual([m.avg_views, m.avg_comments, m.posts_sampled], [200, 2, 3]);
  assert.match(new URL(f.calls[1].url).searchParams.get("fields"), /,is_comment_enabled$/);
  assert.equal(f.calls.filter(c => c.url.startsWith(`${IGV}/me/media?`)).length, 1);
});

// is_comment_enabled istenince status ile reddeden gönderi listesi; alan istenmezse media döner
const igNoField = (status, media = IG_MEDIA) => [`${IGV}/me/media?`, u => new URL(u).searchParams.get("fields").includes("is_comment_enabled")
  ? [status, { error: { message: "(#100) Tried accessing nonexisting field (is_comment_enabled)", type: "OAuthException", code: 100 } }]
  : [200, { data: media }]];
const lists = f => f.calls.filter(c => c.url.startsWith(`${IGV}/me/media?`)).map(c => new URL(c.url).searchParams.get("fields"));
// insights istenen gönderiler (kitle kırılımları, me/insights, hariç)
const insightsOf = f => f.calls.filter(c => c.url.includes("/insights?") && !c.url.startsWith(`${IGV}/me/`)).map(c => new URL(c.url).pathname.split("/")[2]);

test("metrikler: Instagram is_comment_enabled alanını reddederse liste bir kez onsuz istenir, başka hata tekrarlanmaz", async () => {
  const f = fakeFetch(igPostRoutes([igNoField(400)]));
  assert.deepEqual((await fetchMetrics("instagram", "ig-token", f)).posts, IG_POSTS);
  const [first, second, ...rest] = lists(f);
  assert.match(first, /,is_comment_enabled$/);
  assert.doesNotMatch(second, /is_comment_enabled/);
  assert.equal(rest.length, 0);
  // 400 dışı hata: tekrar yok
  const g = fakeFetch(igPostRoutes([igNoField(500)]));
  await assert.rejects(fetchMetrics("instagram", "ig-token", g), e => e instanceof ProviderError && e.code === "500:100");
  assert.equal(lists(g).length, 1);
  // Token hatası tekrarda da döner ve yukarı iletilir
  const h = fakeFetch(igPostRoutes([[`${IGV}/me/media?`, [400, { error: { message: "Invalid OAuth access token", type: "OAuthException", code: 190 } }]]]));
  await assert.rejects(fetchMetrics("instagram", "ig-token", h), e => e instanceof ProviderError && e.code === "400:190");
  assert.equal(lists(h).length, 2);
});

// Sayfalı listeler: i. gönderi/video; beğeni i, yorum 1 (TikTok'ta izlenme 10 × i)
const span = (a, b, fn) => Array.from({ length: b - a }, (_, i) => fn(a + i));
const igm = i => ({ id: `n${i}`, like_count: i, comments_count: 1, permalink: `https://www.instagram.com/p/N${i}/`, timestamp: "2026-10-01T10:00:00+0000", media_type: "IMAGE" });
// Instagram sayfası k (imleç "c<k>"); son sayfada paging.next yok. paging.next adresi açılmamalı (evil.test).
// status: is_comment_enabled istenince bu durumla reddedilir
const igPages = (pages, status = 0) => [`${IGV}/me/media?`, u => {
  const q = new URL(u).searchParams;
  if (status && q.get("fields").includes("is_comment_enabled")) return igNoField(status)[1](u);
  const k = q.has("after") ? Number(q.get("after").slice(1)) : 0, more = k + 1 < pages.length;
  return [200, { data: pages[k], paging: { cursors: { after: more ? `c${k + 1}` : "son" }, ...(more ? { next: "https://evil.test/next" } : {}) } }];
}];

test("metrikler: Instagram listesi imleçle en çok 4 sayfa (paging.next açılmaz), alan reddi sonraki sayfalarda da geçerli; insights ve ortalama son 12, aktarım hepsi", async () => {
  // 5 sayfa var, 4'ü okunur; 2. sayfa 1. sayfanın son gönderisiyle başlar (kayan liste): bir kez aktarılır
  const pages = [span(0, 10, igm), span(9, 20, igm), span(20, 30, igm), span(30, 40, igm), span(40, 50, igm)];
  const f = fakeFetch(igRoutes([[`${IGV}/n0/insights?`, [200, { data: [{ name: "views", total_value: { value: 70 } }] }]], igPages(pages, 400)]));
  const m = await fetchMetrics("instagram", "ig-token", f);
  assert.deepEqual(m.posts.map(p => p.url), span(0, 40, igm).map(x => x.permalink));
  assert.deepEqual([m.posts_sampled, m.posts_recent, m.avg_views, m.avg_likes, m.avg_comments], [12, 12, 70, 6, 1]);
  const ls = f.calls.filter(c => c.url.startsWith(`${IGV}/me/media?`)).map(c => new URL(c.url).searchParams);
  assert.deepEqual(ls.map(q => [q.get("after"), q.get("limit"), q.get("fields").includes("is_comment_enabled")]),
    [[null, "50", true], [null, "50", false], ["c1", "50", false], ["c2", "50", false], ["c3", "50", false]]);
  assert.ok(f.calls.every(c => c.url.startsWith(IGV)));
  assert.deepEqual(insightsOf(f), span(0, 12, i => `n${i}`));
  // Son sayfada (paging.next yok) durur; sonraki sayfanın hatası o ana kadar gelenleri bırakır
  const g = fakeFetch(igRoutes([igPages(pages.slice(0, 2))]));
  assert.equal((await fetchMetrics("instagram", "ig-token", g)).posts.length, 20);
  assert.equal(lists(g).length, 2);
  const h = fakeFetch(igRoutes([[`${IGV}/me/media?`, u => new URL(u).searchParams.has("after") ? [500, { error: { message: "x", code: 1 } }] : igPages(pages)[1](u)]]));
  assert.deepEqual((await fetchMetrics("instagram", "ig-token", h)).posts.map(p => p.url), span(0, 10, igm).map(x => x.permalink));
  assert.equal(lists(h).length, 2);
});

const ttv = i => ({ id: `w${i}`, create_time: Date.UTC(2026, 9, 1) / 1000, share_url: `https://www.tiktok.com/@inf_tt/video/w${i}`, view_count: 10 * i, like_count: i, comment_count: 1 });
// TikTok sayfası: imleç k (ilk sayfada yok) → önceki sayfanın son videosu ve w(3k)…w(3k+2); sonraki imleç next(k)
const ttPages = ({ next = k => k + 1, more = () => true, fail = -1 } = {}) => [`${TT}/video/list/`, (u, b) => {
  const k = b.cursor ?? 0;
  if (k === fail) return [500, { error: { code: "internal_error", message: "" } }];
  return [200, { data: { videos: [...(k ? [ttv(3 * k - 1)] : []), ...span(3 * k, 3 * k + 3, ttv)], cursor: next(k), has_more: more(k) }, error: { code: "ok" } }];
}];

test("metrikler: TikTok listesi imleçle (has_more) en çok 5 sayfa, video bir kez; ortalama son 12", async () => {
  const f = fakeFetch(ttRoutes([ttPages()]));
  const m = await fetchMetrics("tiktok", "t", f);
  assert.deepEqual(m.posts.map(p => p.url), span(0, 15, i => `https://www.tiktok.com/@inf_tt/video/w${i}`));
  assert.deepEqual([m.posts_sampled, m.posts_recent, m.avg_views, m.avg_likes, m.avg_comments], [12, 12, 55, 6, 1]);
  assert.deepEqual(f.calls.filter(c => c.url.startsWith(`${TT}/video/list/`)).map(c => c.body),
    [{ max_count: 20 }, ...span(1, 5, cursor => ({ max_count: 20, cursor }))]);
  // has_more false, sayı olmayan imleç ya da sonraki sayfanın hatası: o ana kadar gelenler
  const run = async opt => {
    const g = fakeFetch(ttRoutes([ttPages(opt)]));
    return [(await fetchMetrics("tiktok", "t", g)).posts.length, g.calls.filter(c => c.url.startsWith(`${TT}/video/list/`)).length];
  };
  assert.deepEqual(await run({ more: k => k < 1 }), [6, 2]);
  assert.deepEqual(await run({ next: () => "abc" }), [3, 1]);
  assert.deepEqual(await run({ fail: 2 }), [6, 3]);
});

const ytv = id => ({ id, snippet: { publishedAt: "2026-10-01T08:00:00Z", title: id, thumbnails: {} }, statistics: { viewCount: "10", likeCount: "1" }, status: { privacyStatus: "public", uploadStatus: "processed" } });
const ytUrl = i => `https://www.youtube.com/watch?v=v${i}`;
// Yükleme listesi sayfası k (jeton "t<k>"): v(50k)…v(50k+49), son sayfa dışında nextPageToken. Videolar istenenin
// tersi sırayla döner. failList / failPart: o liste sayfası ya da video parçası 500 döner
const ytPages = ({ pages = 5, failList = -1, failPart = -1 } = {}) => [
  [`${YT}/playlistItems?`, u => {
    const t = new URL(u).searchParams.get("pageToken"), k = t ? Number(t.slice(1)) : 0;
    if (k === failList) return [500, { error: { code: 500, message: "x" } }];
    return [200, { items: span(50 * k, 50 * k + 50, i => ({ contentDetails: { videoId: `v${i}` } })), ...(k + 1 < pages ? { nextPageToken: `t${k + 1}` } : {}) }];
  }],
  [`${YT}/videos?`, u => {
    const ids = new URL(u).searchParams.get("id").split(",");
    return Number(ids[0].slice(1)) / 50 === failPart ? [500, { error: { code: 500, message: "x" } }] : [200, { items: ids.map(ytv).reverse() }];
  }],
];

test("metrikler: YouTube yükleme listesi sayfa sayfa (en çok 4), videolar 50'şer ve yalnız gereken alanlarla; liste sırası korunur", async t => {
  t.mock.method(console, "log", () => {}); // kitle raporu yolu yok: "yt audience error 404"
  const f = fakeFetch(ytRoutes(ytPages()));
  const m = await fetchMetrics("youtube", "t", f);
  assert.deepEqual(m.posts.map(p => p.url), span(0, 200, ytUrl));
  assert.deepEqual([m.posts_sampled, m.posts_recent, m.avg_views, m.avg_likes], [12, 12, 10, 1]);
  const pl = f.calls.filter(c => c.url.startsWith(`${YT}/playlistItems?`)).map(c => new URL(c.url).searchParams);
  assert.deepEqual(pl.map(q => [q.get("pageToken"), q.get("maxResults"), q.get("playlistId"), q.get("fields")]),
    [null, "t1", "t2", "t3"].map(t => [t, "50", "UU1", "nextPageToken,items/contentDetails/videoId"]));
  const vs = f.calls.filter(c => c.url.startsWith(`${YT}/videos?`)).map(c => new URL(c.url).searchParams);
  assert.deepEqual(vs.map(q => q.get("id")), span(0, 4, k => span(50 * k, 50 * k + 50, i => `v${i}`).join(",")));
  assert.ok(vs.every(q => q.get("part") === "snippet,statistics,status"
    && q.get("fields") === "items(id,snippet(publishedAt,title,thumbnails),statistics(viewCount,likeCount,commentCount),status(privacyStatus,uploadStatus))"));
  assert.equal(f.calls.length, 11); // profil + 4 liste sayfası + 4 video parçası + 2 kitle raporu
  // Sonraki liste sayfası ya da video parçası gelmezse eksik kalır; ilk video parçasının hatası yukarı çıkar
  const posts = async opt => (await fetchMetrics("youtube", "t", fakeFetch(ytRoutes(ytPages(opt))))).posts.map(p => p.url);
  assert.deepEqual(await posts({ pages: 1 }), span(0, 50, ytUrl));
  assert.deepEqual(await posts({ failList: 1 }), span(0, 50, ytUrl));
  assert.deepEqual(await posts({ failPart: 2 }), [...span(0, 100, ytUrl), ...span(150, 200, ytUrl)]);
  await assert.rejects(fetchMetrics("youtube", "t", fakeFetch(ytRoutes(ytPages({ failPart: 0 })))), e => e instanceof ProviderError && e.code === "500:500");
});

test("kitle: YouTube'da video başına kitle en çok 5 videoya sorulur: en yeni 2 ve günden güne kayan 3 eski", async () => {
  const f = fakeFetch(ytRoutes([...ytPages(), ytAudience()]));
  const m = await fetchMetrics("youtube", "t", f);
  const k = (Math.floor(Date.now() / 864e5) * 3) % 198, want = [0, 1, ...[0, 1, 2].map(i => 2 + (k + i) % 198)];
  const asked = f.calls.map(c => new URL(c.url).searchParams.get("filters")).filter(Boolean);
  assert.equal(asked.length, 10);
  assert.deepEqual([...new Set(asked)].sort(), want.map(i => `video==v${i}`).sort());
  assert.deepEqual(m.posts.flatMap((p, i) => p.audience ? [i] : []), want.toSorted((a, b) => a - b));
  // Bugün yayınlanan ve izlenmesi 0 olan video sorulmaz
  const fresh = fakeFetch(ytRoutes([ytAudience(),
    [`${YT}/videos?`, [200, { items: [
      { ...ytv("a"), snippet: { publishedAt: new Date().toISOString(), title: "a", thumbnails: {} } },
      { ...ytv("b"), statistics: { viewCount: "0" } },
    ] }]],
  ]));
  const nf = await fetchMetrics("youtube", "t", fresh);
  assert.deepEqual(fresh.calls.filter(c => new URL(c.url).searchParams.get("filters")).length, 0);
  assert.deepEqual(nf.posts.map(p => p.audience), [undefined, undefined]);
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

async function setup(extraEnv = {}, db = freshDb()) {
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
  const bl = await call("GET", "/app/connections", { token: brand.token });
  assert.equal(bl.status, 200);
  assert.deepEqual(bl.body.connectable, ["instagram", "tiktok", "youtube", "linkedin"]);
  assert.deepEqual(fail(await call("POST", "/app/connect", { token: brand.token, body: { platform: "instagram" } })), [409, "not_configured"]);
  assert.deepEqual(fail(await call("POST", "/app/connect", { token: brand.token, body: { platform: "linkedin" } })), [409, "not_configured"]);
  assert.deepEqual(fail(await finish(call, brand.token, "a".repeat(43))), [400, "ticket"]);
  assert.equal((await finish(call, undefined, "a".repeat(43))).status, 401);

  const list = await call("GET", "/app/connections", { token: inf.token });
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.connections.map(x => [x.platform, x.label]), [
    ["instagram", NOT_CONFIGURED], ["tiktok", NOT_CONFIGURED], ["youtube", NOT_CONFIGURED],
    ["x", NO_DATA], ["linkedin", NOT_CONFIGURED], ["twitch", NO_DATA],
  ]);
  const err = async platformName => fail(await call("POST", "/app/connect", { token: inf.token, body: { platform: platformName } }));
  assert.deepEqual(await err("linkedin"), [409, "not_configured"]);
  assert.deepEqual(await err("x"), [400, "no_api"]);
  assert.deepEqual(await err("myspace"), [400, "platform"]);
  assert.deepEqual(await err("instagram"), [409, "not_configured"]);
  assert.deepEqual(fail(await finish(call, inf.token, "a".repeat(43))), [400, "ticket"]);
  assert.equal((await call("POST", "/app/disconnect", { token: inf.token, body: { platform: "instagram" } })).status, 200);

  // Yapılandırılmamış dönüş adresi
  const r = await callback(env, "/oauth/instagram/callback?code=x&state=" + "a".repeat(43));
  assert.equal(r.status, 503);
  assert.equal(await r.text(), NOT_CONFIGURED);

  // METRICS_ENABLED kapalı: secret'lar girilmiş olsa da bağlanma uçları ve dönüş adresi kapalı. Liste yalnız
  // bağlı ve hatalı satırları döner (koparılabilsinler diye); bağı koparmak açık
  const off = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY, METRICS_ENABLED: "0" });
  const inf2 = await off.join("influencer", "inf@x.co");
  const offList = await off.call("GET", "/app/connections", { token: inf2.token });
  assert.deepEqual([offList.status, offList.body], [200, { ok: true, disabled: true, connectable: ["instagram", "tiktok", "youtube", "linkedin"], connections: [] }]);
  for (const [method, path, body] of [
    ["POST", "/app/connect", { platform: "instagram" }], ["POST", "/app/connect/finish", { ticket: "a".repeat(43) }],
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
  // V'nin oturumu bileti gönderir: ticket_owner (bilet başka hesabın), kod takası yapılmaz
  assert.deepEqual(fail(await finish(call, v.token, ticket)), [403, "ticket_owner"]);
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
  assert.deepEqual(fail(await off("x")), [400, "platform"]);
  assert.equal((await off("linkedin")).status, 200);
  assert.equal(net.calls.length, 0);
});

test("syncAccount: süresi dolan token yenilenir, sonuç social_accounts'a yazılır", async t => {
  t.mock.method(console, "log", () => {}); // kitle raporu yolu yok: "yt audience error 404"
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
  assert.deepEqual([acc().handle, acc().error, acc().sync_changes], ["eski", null, 1]);

  // Uyuşmazlık ama ölçüm alınırken bağ yeniden kuruldu (token ya da hesap değişti): yeni bağın sayacına yazılmaz
  const tt1 = [200, { data: { user: { open_id: "tt-1", username: "inf_tt", follower_count: 12000 } }, error: { code: "ok", message: "" } }];
  for (const sql of ["UPDATE oauth_tokens SET access_token = ? WHERE platform = 'tiktok'", "UPDATE social_accounts SET external_id = 'tt-3' WHERE platform = 'tiktok' AND ? IS NOT NULL"]) {
    await reset("tt-9", "+1 hours");
    const moved = fakeFetch(ttRoutes([[`${TT}/user/info/`, () => { db.prepare(sql).run(other); return tt1; }]]));
    await assert.rejects(syncAccount(env, inf.id, "tiktok", moved), changed);
    assert.deepEqual([acc().sync_changes, acc().status, acc().error], [0, "connected", null]);
  }

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

test("METRICS_ENABLED kapalı: liste bağlı ve hatalı satırları döner, bağ koparılabilir", async t => {
  t.mock.method(console, "log", () => {});
  const net = fakeFetch([]);
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  const { db, call, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY, METRICS_ENABLED: "0" });
  const inf = await join("influencer", "inf@x.co");
  const ins = db.prepare("INSERT INTO social_accounts (user_id, platform, handle, external_id, status, error) VALUES (?, ?, ?, ?, ?, ?)");
  ins.run(inf.id, "instagram", "inf_ig", "1784", "connected", null);
  ins.run(inf.id, "tiktok", "inf_tt", "tt-1", "connected", "invalid_grant");
  ins.run(inf.id, "youtube", null, null, "revoked", null);
  const r = await call("GET", "/app/connections", { token: inf.token });
  assert.equal(r.status, 200);
  assert.equal(r.body.disabled, true);
  assert.deepEqual(r.body.connections.map(c => [c.platform, c.status, c.handle]), [["instagram", "connected", "inf_ig"], ["tiktok", "error", "inf_tt"]]);
  assert.equal((await call("POST", "/app/disconnect", { token: inf.token, body: { platform: "instagram" } })).status, 200);
  assert.deepEqual({ ...db.prepare("SELECT status, external_id FROM social_accounts WHERE platform = 'instagram'").get() }, { status: "revoked", external_id: null });
  const after = await call("GET", "/app/connections", { token: inf.token });
  assert.deepEqual(after.body.connections.map(c => c.platform), ["tiktok"]);
});

test("PKCE: YouTube S256, verifier şifreli saklanır ve kod takasında gider; TikTok ve Instagram'da yok", async t => {
  t.mock.method(console, "log", () => {});
  let net = fakeFetch([]);
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  const { db, env, call, join } = await setup(ALL);
  const inf = await join("influencer", "inf@x.co");
  const connectUrl = async p => new URL((await call("POST", "/app/connect", { token: inf.token, body: { platform: p } })).body.url);
  const verifierOf = p => db.prepare("SELECT code_verifier FROM oauth_states WHERE platform = ?").get(p).code_verifier;

  const u = await connectUrl("youtube");
  assert.equal(u.searchParams.get("code_challenge_method"), "S256");
  const stored = verifierOf("youtube"), v = await decrypt(env, stored);
  assert.match(v, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(!stored.includes(v));
  assert.equal(u.searchParams.get("code_challenge"), await pkceChallenge(v));
  const ticket = await land(env, u.searchParams.get("state"), "youtube");
  net = fakeFetch(ytRoutes());
  assert.equal((await finish(call, inf.token, ticket)).status, 200);
  const yt = net.calls.find(c => c.url === "https://oauth2.googleapis.com/token");
  assert.equal(yt.body.code_verifier, v);

  for (const [p, tokenUrl] of [["tiktok", `${TT}/oauth/token/`], ["instagram", "https://api.instagram.com/oauth/access_token"]]) {
    const pu = await connectUrl(p);
    assert.equal(pu.searchParams.get("code_challenge"), null, p);
    assert.equal(pu.searchParams.get("code_challenge_method"), null, p);
    assert.equal(verifierOf(p), null, p);
    const pt = await land(env, pu.searchParams.get("state"), p);
    net = fakeFetch(ttRoutes(igRoutes()));
    assert.equal((await finish(call, inf.token, pt)).status, 200, p);
    const tok = net.calls.find(c => c.url.startsWith(tokenUrl));
    assert.ok(tok, p);
    assert.equal("code_verifier" in tok.body, false, p);
  }
});

test("Yeniden bağlanma: aynı hesap ölçümleri korur, başka hesapta eski ölçümler ayrılır", async t => {
  t.mock.method(console, "log", () => {});
  let net = fakeFetch([]);
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  const { db, env, call, join } = await setup({ ...TT_ENV, OAUTH_TOKEN_KEY: KEY });
  const inf = await join("influencer", "inf@x.co");
  const connect = async routes => {
    const ticket = await land(env, await start(call, inf.token, "tiktok"), "tiktok");
    net = fakeFetch(routes);
    const r = await finish(call, inf.token, ticket);
    assert.equal(r.status, 200, JSON.stringify(r.body));
  };
  const acc = () => ({ ...db.prepare("SELECT id, external_id, next_sync_at FROM social_accounts WHERE user_id = ? AND platform = 'tiktok'").get(inf.id) });
  const linked = () => db.prepare("SELECT account_id FROM link_snapshots").get().account_id;
  await connect(ttRoutes());
  const { id } = acc();
  db.prepare("INSERT INTO metric_snapshots (account_id, followers) VALUES (?, 100)").run(id);
  db.prepare("INSERT INTO link_snapshots (application_id, account_id, url, platform) VALUES (1, ?, 'https://www.tiktok.com/@inf_tt/video/1', 'tiktok')").run(id);
  db.prepare("UPDATE social_accounts SET next_sync_at = datetime('now', '+10 minutes') WHERE id = ?").run(id);

  // Aynı hesap (tt-1): ölçümler ve link bağı kalır, süren senkronun kirası düşer
  await connect(ttRoutes());
  assert.deepEqual([acc().id, acc().external_id, acc().next_sync_at], [id, "tt-1", null]);
  assert.equal(count(db, "metric_snapshots"), 1);
  assert.equal(linked(), id);

  // Başka hesap (tt-2): eski hesabın ölçümleri silinir, link ölçümü kalır ama hesaptan ayrılır
  const other = { data: { user: { open_id: "tt-2", username: "yeni_tt", display_name: "Yeni", follower_count: 50 } }, error: { code: "ok", message: "" } };
  await connect(ttRoutes([[`${TT}/user/info/`, [200, other]]]));
  assert.deepEqual([acc().id, acc().external_id], [id, "tt-2"]);
  assert.equal(count(db, "metric_snapshots"), 0);
  assert.equal(count(db, "link_snapshots"), 1);
  assert.equal(linked(), null);
});

// Senkron testleri: bağlı hesap ve 1 saat geçerli token (yenileme gerekmez)
const seed = async (db, env, userId, p, ext) => {
  db.prepare("INSERT INTO social_accounts (user_id, platform, handle, external_id, status) VALUES (?, ?, 'eski', ?, 'connected')").run(userId, p, ext);
  db.prepare("INSERT INTO oauth_tokens (user_id, platform, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?, datetime('now', '+1 hours'))")
    .run(userId, p, await encrypt(env, `${p}-access`), await encrypt(env, `${p}-refresh`));
};
// Bir sonraki senkrona kalan dakika (next_sync_at NULL ise null)
const due = (db, userId, p = "tiktok") => db.prepare(
  "SELECT (julianday(next_sync_at) - julianday('now')) * 1440 AS m FROM social_accounts WHERE user_id = ? AND platform = ?",
).get(userId, p).m;
const near = (m, want) => assert.ok(m !== null && Math.abs(m - want) < 2, `${m} ~ ${want}`);
const ZERO = { synced: 0, failed: 0, changed: 0, busy: 0, deferred: 0 };
const route = (prefix, fn) => {
  const hit = ttRoutes().find(([p]) => p === prefix)[1];
  return [prefix, (u, b) => { fn(); return typeof hit === "function" ? hit(u, b) : hit; }];
};

test("syncDue: vadesi gelen hesap ölçülür, ~1 gün sonraya kurulur; vadesi gelmeyen ve yapılandırılmayan platform atlanır", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...TT_ENV, OAUTH_TOKEN_KEY: KEY });
  const a = await join("influencer", "a@x.co"), b = await join("influencer", "b@x.co");
  await seed(db, env, a.id, "tiktok", "tt-1");
  await seed(db, env, b.id, "tiktok", "tt-2");
  db.prepare("UPDATE social_accounts SET next_sync_at = datetime('now', '+2 hours') WHERE user_id = ?").run(b.id);
  await seed(db, env, a.id, "youtube", "UC1"); // YouTube secret'ları yok: seçilmez
  const f = fakeFetch(ttRoutes());
  assert.deepEqual(await syncDue(env, f), { ...ZERO, synced: 1 });
  assert.deepEqual({ ...db.prepare("SELECT account_id, source, followers, avg_views, avg_likes, avg_comments, posts_sampled FROM metric_snapshots").get() }, {
    account_id: db.prepare("SELECT id FROM social_accounts WHERE user_id = ? AND platform = 'tiktok'").get(a.id).id,
    source: "oauth", followers: 12000, avg_views: 6000, avg_likes: 400, avg_comments: 30, posts_sampled: 2,
  });
  near(due(db, a.id), 1435);
  near(due(db, b.id), 120);
  assert.equal(due(db, a.id, "youtube"), null);
  assert.ok(f.calls.every(c => c.url.startsWith(TT) && !c.url.startsWith(`${TT}/oauth/`)));
  // Hemen ikinci çalıştırma: vadesi gelen yok
  const g = fakeFetch(ttRoutes());
  assert.deepEqual(await syncDue(env, g), ZERO);
  assert.equal(g.calls.length, 0);
  assert.equal(count(db, "metric_snapshots"), 1);
});

test("syncDue: en fazla max hesap, bütçeyi aşan platform sonraki saate kalır", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...IG_ENV, ...TT_ENV, OAUTH_TOKEN_KEY: KEY });
  const a = await join("influencer", "a@x.co"), b = await join("influencer", "b@x.co");
  await seed(db, env, a.id, "instagram", "1784");
  await seed(db, env, a.id, "tiktok", "tt-1");
  await seed(db, env, b.id, "tiktok", "tt-2");
  // Bütçe 7: Instagram (27) sığmaz, ilk TikTok (7) sığar, ikinci TikTok bütçeyi aşar
  const f = fakeFetch(ttRoutes());
  assert.deepEqual(await syncDue(env, f, { budget: 7 }), { ...ZERO, synced: 1, deferred: 2 });
  assert.equal(f.calls.some(c => c.url.includes("instagram")), false);
  near(due(db, a.id), 1435);
  assert.equal(due(db, a.id, "instagram"), null);
  assert.equal(due(db, b.id), null);
  // max 1: yalnız ilk sıradaki (Instagram) alınır; diğer TikTok kalır
  const g = fakeFetch(ttRoutes(igRoutes([["https://graph.instagram.com/refresh_access_token?", [200, { access_token: "ig-yeni", expires_in: 5184000 }]]])));
  assert.deepEqual(await syncDue(env, g, { max: 1 }), { ...ZERO, synced: 1, deferred: 1 });
  near(due(db, a.id, "instagram"), 1435);
  assert.equal(due(db, b.id), null);
  // En ucuz platforma yetmeyen bütçe ya da max 0: hiçbir sorgu ve istek yok
  assert.equal(SYNC_MIN, 7);
  const h = fakeFetch(ttRoutes());
  assert.deepEqual(await syncDue(env, h, { budget: SYNC_MIN - 1 }), ZERO);
  assert.deepEqual(await syncDue(env, h, { max: 0 }), ZERO);
  assert.equal(h.calls.length, 0);
});

test("syncDue: Instagram'ın en kötü yolu (yenileme + alan reddinde tekrar + 4 sayfa + 12 insights + 8 kitle kırılımı) bütçe payına sığar", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY });
  const a = await join("influencer", "a@x.co");
  await seed(db, env, a.id, "instagram", "1784"); // token 7 günden kısa: yenilenir
  const pages = [span(0, 13, igm), span(13, 20, igm), span(20, 30, igm), span(30, 40, igm), span(40, 50, igm)];
  const f = fakeFetch(igRoutes([IG_REFRESH, igPages(pages, 400)]));
  assert.deepEqual(await syncDue(env, f, { budget: 26 }), { ...ZERO, deferred: 1 });
  assert.equal(f.calls.length, 0);
  assert.deepEqual(await syncDue(env, f, { budget: 27 }), { ...ZERO, synced: 1 });
  assert.ok(f.calls.some(c => c.url.startsWith(IG_REFRESH[0])), "yenileme yapıldı");
  assert.equal(lists(f).length, 5);
  assert.equal(f.calls.filter(c => c.url.startsWith(`${IGV}/me/insights?`)).length, 8);
  assert.equal(f.calls.length, 27);
});

test("syncDue: TikTok'un (yenileme + 5 sayfa) ve YouTube'un (yenileme + 4 liste sayfası + 4 video parçası + 2 kanal kitle raporu + 5 videonun 2'şer kitle raporu) en kötü yolu bütçe payına sığar", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...TT_ENV, ...YT_ENV, OAUTH_TOKEN_KEY: KEY });
  const a = await join("influencer", "a@x.co");
  await seed(db, env, a.id, "tiktok", "tt-1");
  await seed(db, env, a.id, "youtube", "UC1");
  db.prepare("UPDATE oauth_tokens SET expires_at = datetime('now', '-1 hours')").run();
  const f = fakeFetch([...ttRoutes([ttPages()]), ...ytRoutes([...ytPages(), ytAudience()])]);
  assert.deepEqual(await syncDue(env, f, { budget: 6 }), ZERO); // en ucuz platformdan az: hiç bakılmaz
  assert.deepEqual(await syncDue(env, f, { budget: 7 }), { ...ZERO, synced: 1, deferred: 1 });
  assert.equal(f.calls.length, 7);
  assert.ok(f.calls.every(c => c.url.startsWith(TT)));
  assert.deepEqual(await syncDue(env, f, { budget: 21 }), { ...ZERO, deferred: 1 });
  assert.deepEqual(await syncDue(env, f, { budget: 22 }), { ...ZERO, synced: 1 });
  assert.equal(f.calls.filter(c => c.url.startsWith(YTA)).length, 12);
  assert.equal(f.calls.length, 29);
});

test("syncDue: kitle dağılımı ölçümle birlikte JSON olarak yazılır; vermeyen platformda NULL", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...IG_ENV, ...TT_ENV, OAUTH_TOKEN_KEY: KEY });
  const a = await join("influencer", "a@x.co");
  await seed(db, env, a.id, "instagram", "1784");
  await seed(db, env, a.id, "tiktok", "tt-1");
  assert.deepEqual(await syncDue(env, fakeFetch([...igRoutes([IG_REFRESH, igAudience(IG_AUD)]), ...ttRoutes()])), { ...ZERO, synced: 2 });
  const aud = p => db.prepare("SELECT s.audience FROM metric_snapshots s JOIN social_accounts a ON a.id = s.account_id WHERE a.platform = ?").get(p).audience;
  assert.deepEqual(JSON.parse(aud("instagram")), IG_AUD_OUT);
  assert.equal(aud("tiktok"), null);
});

// D1 ifadelerini sayar (batch içindekiler tek tek)
const counted = DB => {
  let n = 0;
  const wrap = s => ({ bind: (...a) => wrap(s.bind(...a)), all: () => (n++, s.all()), first: () => (n++, s.first()), run: () => (n++, s.run()), raw: s });
  return { DB: { ...DB, prepare: sql => wrap(DB.prepare(sql)), batch: list => (n += list.length, DB.batch(list.map(x => x.raw))) }, n: () => n };
};

test("syncDue: D1 sınırı — liste + hesap başına en çok SYNC_D1 ifade, sığmayan hesap sonraki saate kalır", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY, POSTS_ENABLED: "1" });
  const a = await join("influencer", "a@x.co"), b = await join("influencer", "b@x.co");
  await seed(db, env, a.id, "instagram", "1784");
  await seed(db, env, b.id, "instagram", "1785");
  // En kötü yol: Instagram token'ı 7 günden kısa (yenileme) + ölçüm + gönderiler
  const f = fakeFetch(igPostRoutes([IG_REFRESH]));
  // Bir hesaba yetmeyen D1 payı: hiçbir sorgu ve istek yok
  const none = counted(env.DB);
  assert.deepEqual(await syncDue({ ...env, DB: none.DB }, f, { d1: SYNC_D1 }), ZERO);
  assert.equal(none.n(), 0);
  assert.equal(f.calls.length, 0);
  // İkinci hesaba bir ifade eksik pay: ilk hesap yenilenip ölçülür, ikincisi kalır; harcanan ifade payı aşmaz
  const one = counted(env.DB);
  assert.deepEqual(await syncDue({ ...env, DB: one.DB }, f, { d1: 2 * SYNC_D1 }), { ...ZERO, synced: 1, deferred: 1 });
  assert.ok(f.calls.some(c => c.url.startsWith(IG_REFRESH[0])), "yenileme yapıldı");
  assert.equal(one.n(), 1 + SYNC_D1); // SYNC_D1 en kötü yolda tam
  near(due(db, a.id, "instagram"), 1435);
  assert.equal(due(db, b.id, "instagram"), null);
  assert.equal(count(db, "metric_snapshots"), 1);
  assert.equal(count(db, "posts"), IG_POSTS.length);
  // TikTok'un en kötü yolu (yenileme + ölçüm + gönderiler) da payın içinde
  const tt = await setup({ ...TT_ENV, OAUTH_TOKEN_KEY: KEY, POSTS_ENABLED: "1" });
  const c = await tt.join("influencer", "c@x.co");
  await seed(tt.db, tt.env, c.id, "tiktok", "tt-1");
  tt.db.prepare("UPDATE oauth_tokens SET expires_at = datetime('now', '-1 hours')").run();
  const two = counted(tt.env.DB);
  const g = fakeFetch(ttRoutes());
  assert.deepEqual(await syncDue({ ...tt.env, DB: two.DB }, g, { d1: 1 + SYNC_D1 }), { ...ZERO, synced: 1 });
  assert.ok(g.calls.some(x => x.body?.grant_type === "refresh_token"), "yenileme yapıldı");
  assert.ok(two.n() <= 1 + SYNC_D1, String(two.n()));
});

test("syncDue: kira — başkası almışsa busy, senkron sürerken kira düşerse ölçüm yazılmaz", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...TT_ENV, OAUTH_TOKEN_KEY: KEY });
  const a = await join("influencer", "a@x.co"), b = await join("influencer", "b@x.co");
  await seed(db, env, a.id, "tiktok", "tt-1");
  await seed(db, env, b.id, "tiktok", "tt-2");
  // a senkronlanırken başka bir çalıştırma b'yi kiralar
  const leaseB = () => db.prepare("UPDATE social_accounts SET next_sync_at = datetime('now', '+15 minutes') WHERE user_id = ?").run(b.id);
  assert.deepEqual(await syncDue(env, fakeFetch(ttRoutes([route(`${TT}/video/list/`, leaseB)]))), { ...ZERO, synced: 1, busy: 1 });
  near(due(db, a.id), 1435);
  near(due(db, b.id), 15);
  assert.equal(count(db, "metric_snapshots"), 1);
  // a senkronlanırken yeniden bağlanır (finishOAuth next_sync_at'i NULL yapar): ölçüm yazılmaz, kira geri kurulmaz
  db.prepare("UPDATE social_accounts SET next_sync_at = NULL WHERE user_id = ?").run(a.id);
  db.prepare("UPDATE social_accounts SET next_sync_at = datetime('now', '+1 hours') WHERE user_id = ?").run(b.id);
  const reconnect = () => db.prepare("UPDATE social_accounts SET next_sync_at = NULL WHERE user_id = ?").run(a.id);
  assert.deepEqual(await syncDue(env, fakeFetch(ttRoutes([route(`${TT}/video/list/`, reconnect)]))), { ...ZERO, changed: 1 });
  assert.equal(count(db, "metric_snapshots"), 1);
  assert.equal(due(db, a.id), null);
});

// Gönderi aktarımı: aktarılan gönderi account_id'li, elle girilen NULL
const igAcc = (db, userId) => db.prepare("SELECT id FROM social_accounts WHERE user_id = ? AND platform = 'instagram'").get(userId).id;
const imported = db => db.prepare("SELECT url, platform, type, date, caption, thumb, account_id FROM posts WHERE account_id IS NOT NULL ORDER BY date")
  .all().map(r => ({ ...r }));
const snapsOf = (db, url) => db.prepare("SELECT s.at, s.likes, s.comments, s.views, s.reach FROM post_snaps s JOIN posts p ON p.id = s.post_id WHERE p.url = ? ORDER BY s.at")
  .all(url).map(r => ({ ...r }));
const today = () => new Date().toISOString().slice(0, 10);
const MANUAL = { url: "https://www.instagram.com/p/CCC/", type: "photo", date: "2026-10-01", caption: "elle", likes: 5, at: "2026-10-02" };
const IG_9999 = [`${IGV}/me?`, [200, { user_id: "9999", username: "yeni_ig", followers_count: 10 }]];

test("syncDue: Instagram gönderileri Gönderiler'e aktarılır; aynı gün yeniden senkron tazeler; elle girilen gönderiye dokunulmaz", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, call, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY, POSTS_ENABLED: "1" });
  const a = await join("influencer", "a@x.co");
  await seed(db, env, a.id, "instagram", "1784");
  const r = await call("POST", "/app/posts/manual", { token: a.token, body: MANUAL });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  // POSTS_ENABLED kapalı: ölçüm yazılır, gönderi aktarılmaz
  assert.deepEqual(await syncDue({ ...env, POSTS_ENABLED: "0" }, fakeFetch(igPostRoutes([IG_REFRESH]))), { ...ZERO, synced: 1 });
  assert.deepEqual([count(db, "metric_snapshots"), count(db, "posts")], [1, 1]);
  // Açık: bağlantısı elle girilenle aynı olan (CCC) atlanır, diğerleri hesaba bağlı ve bugünün ölçümüyle aktarılır
  db.prepare("UPDATE social_accounts SET next_sync_at = NULL").run();
  assert.deepEqual(await syncDue(env, fakeFetch(igPostRoutes([IG_REFRESH]))), { ...ZERO, synced: 1 });
  const acc = igAcc(db, a.id);
  const pick = ({ url, type, date, caption, thumb }) => ({ url, platform: "instagram", type, date, caption, thumb, account_id: acc });
  assert.deepEqual(imported(db), IG_POSTS.filter(p => p.url !== MANUAL.url).map(pick));
  assert.deepEqual(snapsOf(db, IG_POSTS[0].url), [{ at: today(), likes: 100, comments: 4, views: 1000, reach: 800 }]);
  assert.deepEqual(snapsOf(db, IG_POSTS[3].url), [{ at: today(), likes: null, comments: 3, views: null, reach: null }]);
  assert.deepEqual({ ...db.prepare("SELECT type, caption, account_id FROM posts WHERE url = ?").get(MANUAL.url) }, { type: "photo", caption: "elle", account_id: null });
  assert.deepEqual(snapsOf(db, MANUAL.url), [{ at: "2026-10-02", likes: 5, comments: null, views: null, reach: null }]);
  // Panel listesi: aktarılanlar ve elle girilen, ölçümleriyle (tarih sırasıyla)
  const list = await call("GET", "/app/posts", { token: a.token });
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.deepEqual(list.body.posts.map(p => [p.url, p.type, p.snaps.length]), [
    [IG_POSTS[3].url, "video", 1], [IG_POSTS[1].url, "reel", 1], [IG_POSTS[0].url, "photo", 1], [MANUAL.url, "photo", 1],
  ]);
  assert.deepEqual(list.body.posts[2].snaps, [{ at: today(), likes: 100, comments: 4, views: 1000, reach: 800 }]);

  // Aynı gün yeniden: metin, kapak ve o günün ölçümü tazelenir; gönderi ve ölçüm sayısı aynı kalır
  const media = IG_MEDIA.map(m => m.id === "m1" ? { ...m, like_count: 120, caption: "Düzeltildi", media_url: "https://cdn.ig.test/m1-yeni.jpg" } : m);
  const before = [count(db, "posts"), count(db, "post_snaps")];
  db.prepare("UPDATE social_accounts SET next_sync_at = NULL").run();
  assert.deepEqual(await syncDue(env, fakeFetch(igPostRoutes([], media))), { ...ZERO, synced: 1 });
  assert.deepEqual([count(db, "posts"), count(db, "post_snaps")], before);
  assert.deepEqual({ ...db.prepare("SELECT caption, thumb, date FROM posts WHERE url = ?").get(IG_POSTS[0].url) },
    { caption: "Düzeltildi", thumb: "https://cdn.ig.test/m1-yeni.jpg", date: "2026-10-20" });
  assert.deepEqual(snapsOf(db, IG_POSTS[0].url), [{ at: today(), likes: 120, comments: 4, views: 1000, reach: 800 }]);
  // Ertesi gün: aktarılan gönderiye yeni ölçüm satırı eklenir, öncekiler kalır; elle girilen değişmez
  db.prepare("UPDATE post_snaps SET at = date('now', '-1 days') WHERE post_id IN (SELECT id FROM posts WHERE account_id IS NOT NULL)").run();
  db.prepare("UPDATE social_accounts SET next_sync_at = NULL").run();
  assert.deepEqual(await syncDue(env, fakeFetch(igPostRoutes())), { ...ZERO, synced: 1 });
  assert.equal(count(db, "post_snaps"), 2 * (IG_POSTS.length - 1) + 1);
  assert.deepEqual(snapsOf(db, IG_POSTS[0].url).map(s => s.likes), [120, 100]);
  assert.deepEqual(snapsOf(db, MANUAL.url), [{ at: "2026-10-02", likes: 5, comments: null, views: null, reach: null }]);
});

test("syncDue: TikTok ve YouTube gönderileri de aktarılır; her gönderi kendi platformu ve hesabıyla, erişimsiz", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, call, join } = await setup({ ...TT_ENV, ...YT_ENV, OAUTH_TOKEN_KEY: KEY, POSTS_ENABLED: "1" });
  const a = await join("influencer", "a@x.co");
  await seed(db, env, a.id, "tiktok", "tt-1");
  await seed(db, env, a.id, "youtube", "UC1");
  assert.deepEqual(await syncDue(env, fakeFetch([...ttRoutes(), ...ytRoutes()])), { ...ZERO, synced: 2 });
  const acc = p => db.prepare("SELECT id FROM social_accounts WHERE user_id = ? AND platform = ?").get(a.id, p).id;
  const pick = p => ({ url, type, date, caption, thumb }) => ({ url, platform: p, type, date, caption, thumb, account_id: acc(p) });
  const [tt, yt] = [TT_POSTS.map(pick("tiktok")), YT_POSTS.map(pick("youtube"))];
  assert.notEqual(acc("tiktok"), acc("youtube"));
  assert.deepEqual(imported(db), [yt[0], tt[0], tt[1], yt[1]]);
  assert.deepEqual(snapsOf(db, TT_POSTS[0].url), [{ at: today(), likes: 300, comments: 20, views: 5000, reach: null }]);
  assert.deepEqual(snapsOf(db, YT_POSTS[1].url), [{ at: today(), likes: null, comments: null, views: 1100, reach: null }]);
  // Panel listesi: iki platform birlikte, yeniden eskiye
  const list = await call("GET", "/app/posts", { token: a.token });
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.deepEqual(list.body.posts.map(p => [p.platform, p.url, p.snaps.length]), [
    ["youtube", YT_POSTS[1].url, 1], ["tiktok", TT_POSTS[1].url, 1], ["tiktok", TT_POSTS[0].url, 1], ["youtube", YT_POSTS[0].url, 1],
  ]);
});

test("syncDue: YouTube video kitlesi gönderiye, kanal kitlesi ölçüme yazılır; video gelmezse eskisi kalır, değişirse tazelenir; rapor alınamazsa neden saklanır", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, call, join } = await setup({ ...YT_ENV, OAUTH_TOKEN_KEY: KEY, POSTS_ENABLED: "1" });
  const a = await join("influencer", "a@x.co");
  await seed(db, env, a.id, "youtube", "UC1");
  const sync = async route => {
    db.prepare("UPDATE social_accounts SET next_sync_at = NULL").run();
    assert.deepEqual(await syncDue(env, fakeFetch(ytRoutes([route]))), { ...ZERO, synced: 1 });
  };
  const snap = () => JSON.parse(db.prepare("SELECT audience FROM metric_snapshots ORDER BY id DESC LIMIT 1").get().audience);
  const posts = () => db.prepare("SELECT audience FROM posts ORDER BY date").all().map(r => JSON.parse(r.audience));
  const V = { viewers: YT_VIEWERS };
  await sync(ytAudience());
  assert.deepEqual([snap(), posts()], [V, [V, V]]);
  const list = await call("GET", "/app/posts", { token: a.token });
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.deepEqual(list.body.posts.map(p => p.audience), [V, V]);
  // a bu kez eşiğin altında: kitlesi silinmez; b'nin değişen kitlesi tazelenir
  db.prepare("UPDATE posts SET audience = ? WHERE url = ?").run(JSON.stringify({ viewers: { age: [["18-24", 100]] } }), YT_POSTS[1].url);
  await sync(ytAudience(200, { empty: ["video==a"] }));
  assert.deepEqual(posts(), [V, V]);
  // İzin yok: ölçüme nedeni yazılır, video sorulmaz, gönderilerin kitlesi kalır
  await sync(ytAudience(403));
  assert.deepEqual([snap(), posts()], [{ reason: "no_scope" }, [V, V]]);
});

test("syncDue: son 12 gönderi günde bir, eskiler haftada bir ölçülür; gelmeyen izlenme ve erişim son ölçülenle sürer; değişmeyen gönderi yeniden yazılmaz", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY, POSTS_ENABLED: "1" });
  const a = await join("influencer", "a@x.co");
  await seed(db, env, a.id, "instagram", "1784");
  db.exec("CREATE TABLE upd (n INTEGER); INSERT INTO upd VALUES (0); CREATE TRIGGER posts_upd AFTER UPDATE ON posts BEGIN UPDATE upd SET n = n + 1; END;");
  const updates = () => db.prepare("SELECT n FROM upd").get().n;
  // n<i> gönderisinin insights'ı: izlenme base + i, erişim 500 + i
  const sync = async (media, base) => {
    const ins = [`${IGV}/n`, u => {
      const i = Number(new URL(u).pathname.split("/")[2].slice(1));
      return [200, { data: [{ name: "views", total_value: { value: base + i } }, { name: "reach", total_value: { value: 500 + i } }] }];
    }];
    db.prepare("UPDATE social_accounts SET next_sync_at = NULL").run();
    const f = fakeFetch(igRoutes([IG_REFRESH, ins, [`${IGV}/me/media?`, [200, { data: media }]]]));
    assert.deepEqual(await syncDue(env, f), { ...ZERO, synced: 1 });
    return insightsOf(f);
  };
  const ago = days => db.prepare("UPDATE post_snaps SET at = date(at, ?)").run(`-${days} days`);
  const day = d => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
  const url = i => `https://www.instagram.com/p/N${i}/`;
  await sync(span(0, 12, igm), 1000);
  assert.deepEqual(snapsOf(db, url(11)), [{ at: today(), likes: 11, comments: 1, views: 1011, reach: 511 }]);
  // 3 gün sonra 2 yeni gönderi: n10 ve n11 son 12'den çıkar, son ölçümleri haftadan yeni olduğu için ölçülmez
  ago(3);
  await sync([igm(13), igm(12), ...span(0, 12, igm)], 1000);
  assert.equal(count(db, "posts"), 14);
  assert.deepEqual(snapsOf(db, url(11)).map(s => s.at), [day(3)]);
  assert.deepEqual(snapsOf(db, url(9)).map(s => s.at), [day(3), today()]);
  assert.deepEqual(snapsOf(db, url(13)), [{ at: today(), likes: 13, comments: 1, views: 1013, reach: 513 }]);
  assert.equal(updates(), 0);
  // 5 gün sonra (son ölçüm 8 gün önce) n10 ve n11 yeniden ölçülür: insights'ları istenmez, izlenme ve erişim sürer;
  // yalnız metni değişen n0 güncellenir
  ago(5);
  const media = [igm(13), igm(12), { ...igm(0), caption: "Yeni metin" }, ...span(1, 10, igm), { ...igm(10), like_count: 40 }, { ...igm(11), like_count: 41 }];
  assert.deepEqual(await sync(media, 2000), ["n13", "n12", ...span(0, 10, i => `n${i}`)]);
  assert.deepEqual(snapsOf(db, url(11)), [
    { at: day(8), likes: 11, comments: 1, views: 1011, reach: 511 }, { at: today(), likes: 41, comments: 1, views: 1011, reach: 511 },
  ]);
  assert.deepEqual(snapsOf(db, url(9)).at(-1), { at: today(), likes: 9, comments: 1, views: 2009, reach: 509 });
  assert.equal(updates(), 1);
  assert.equal(db.prepare("SELECT caption FROM posts WHERE url = ?").get(url(0)).caption, "Yeni metin");
});

test("Gönderi aktarımı: bağ koparılınca ya da başka hesap bağlanınca aktarılanlar silinir; elle girilenler ve başkasınınkiler kalır", async t => {
  t.mock.method(console, "log", () => {});
  let net = fakeFetch([]);
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  const { db, env, call, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY, POSTS_ENABLED: "1" });
  const a = await join("influencer", "a@x.co"), b = await join("influencer", "b@x.co");
  assert.equal((await call("POST", "/app/posts/manual", { token: a.token, body: MANUAL })).status, 200);
  const connect = async routes => {
    const ticket = await land(env, await start(call, a.token));
    net = fakeFetch(routes);
    const r = await finish(call, a.token, ticket);
    assert.equal(r.status, 200, JSON.stringify(r.body));
  };
  const sync = async (extra = []) => {
    db.prepare("UPDATE social_accounts SET next_sync_at = NULL WHERE user_id = ?").run(a.id);
    assert.deepEqual(await syncDue(env, fakeFetch(igPostRoutes([IG_REFRESH, ...extra]))), { ...ZERO, synced: 1 });
  };
  // b'nin kendi hesabından aktarılmış bir gönderisi (a'nın işlemleri dokunmaz)
  await seed(db, env, b.id, "instagram", "1785");
  db.prepare("UPDATE social_accounts SET next_sync_at = datetime('now', '+1 days') WHERE user_id = ?").run(b.id);
  db.prepare("INSERT INTO posts (user_id, url, platform, type, date, account_id) VALUES (?, 'https://www.instagram.com/p/BBB1/', 'instagram', 'photo', '2026-10-20', ?)")
    .run(b.id, igAcc(db, b.id));
  const theirs = () => db.prepare("SELECT COUNT(*) AS n FROM posts WHERE user_id = ?").get(b.id).n;

  await connect(igRoutes());
  await sync();
  assert.equal(imported(db).filter(p => p.account_id === igAcc(db, a.id)).length, 3);
  // Aynı hesap yeniden bağlanır: gönderiler kalır
  await connect(igRoutes());
  assert.equal(imported(db).filter(p => p.account_id === igAcc(db, a.id)).length, 3);
  // Başka hesap (9999): eski hesaptan aktarılanlar ve ölçümleri silinir, elle girilen kalır
  await connect(igRoutes([IG_9999]));
  assert.equal(imported(db).filter(p => p.account_id === igAcc(db, a.id)).length, 0);
  assert.deepEqual(db.prepare("SELECT url FROM posts WHERE user_id = ?").all(a.id).map(r => r.url), [MANUAL.url]);
  assert.equal(snapsOf(db, MANUAL.url).length, 1);
  assert.equal(count(db, "post_snaps"), 1);
  // Yeni hesaptan aktarım, ardından bağı koparma: aktarılanlar silinir, elle girilen ve b'ninki kalır
  await sync([IG_9999]);
  assert.equal(imported(db).filter(p => p.account_id === igAcc(db, a.id)).length, 3);
  net = fakeFetch([]);
  const r = await call("POST", "/app/disconnect", { token: a.token, body: { platform: "instagram" } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(db.prepare("SELECT url, account_id FROM posts WHERE user_id = ?").all(a.id).map(r => ({ ...r })), [{ url: MANUAL.url, account_id: null }]);
  assert.equal(count(db, "post_snaps"), 1);
  assert.equal(theirs(), 1);
  assert.equal(net.calls.length, 0);
});

test("syncDue: kira düşerse gönderi de yazılmaz; kullanıcının MAX_POSTS gönderisi varsa yenisi eklenmez, ölçüm yazılır", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY, POSTS_ENABLED: "1" });
  const a = await join("influencer", "a@x.co");
  await seed(db, env, a.id, "instagram", "1784");
  // Gönderiler okunurken yeniden bağlanır (finishOAuth next_sync_at'i NULL yapar): hiçbir şey yazılmaz
  const reconnect = [`${IGV}/me/media?`, () => { db.prepare("UPDATE social_accounts SET next_sync_at = NULL").run(); return [200, { data: IG_MEDIA }]; }];
  assert.deepEqual(await syncDue(env, fakeFetch(igPostRoutes([IG_REFRESH, reconnect]))), { ...ZERO, changed: 1 });
  assert.deepEqual([count(db, "metric_snapshots"), count(db, "posts"), count(db, "post_snaps")], [0, 0, 0]);
  // 1000 elle girilmiş gönderi: aktarım eklemez, ölçüm yine yazılır
  const add = db.prepare("INSERT INTO posts (user_id, url, platform, type, date) VALUES (?, ?, 'instagram', 'photo', '2026-01-01')");
  for (let i = 0; i < 1000; i++) add.run(a.id, `https://www.instagram.com/p/elle${i}/`);
  db.prepare("UPDATE social_accounts SET next_sync_at = NULL").run();
  assert.deepEqual(await syncDue(env, fakeFetch(igPostRoutes([IG_REFRESH]))), { ...ZERO, synced: 1 });
  assert.deepEqual([count(db, "metric_snapshots"), count(db, "posts"), count(db, "post_snaps")], [1, 1000, 0]);
});

test("syncDue: hesap kimliği değişirse ~1 saat, sağlayıcı hatasında ~6 saat sonra yeniden denenir", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...TT_ENV, OAUTH_TOKEN_KEY: KEY });
  const a = await join("influencer", "a@x.co");
  await seed(db, env, a.id, "tiktok", "tt-1");
  const other = { data: { user: { open_id: "tt-2", username: "baska", display_name: "B", follower_count: 1 } }, error: { code: "ok", message: "" } };
  assert.deepEqual(await syncDue(env, fakeFetch(ttRoutes([[`${TT}/user/info/`, [200, other]]]))), { ...ZERO, changed: 1 });
  near(due(db, a.id), 55);
  db.prepare("UPDATE social_accounts SET next_sync_at = NULL WHERE user_id = ?").run(a.id);
  const denied = ttRoutes([[`${TT}/user/info/`, [401, { error: { code: "access_token_invalid", message: "" } }]]]);
  assert.deepEqual(await syncDue(env, fakeFetch(denied)), { ...ZERO, failed: 1 });
  near(due(db, a.id), 355);
  assert.equal(count(db, "metric_snapshots"), 0);
});

test("syncDue: kimlik uyuşmazlığı art arda CHANGE_LIMIT kez sürerse hesap hatalı olur ve denenmez; başarı ve yeniden bağlanma sayacı sıfırlar", async t => {
  t.mock.method(console, "log", () => {});
  let net = fakeFetch([]);
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  const { db, env, call, join } = await setup({ ...TT_ENV, OAUTH_TOKEN_KEY: KEY });
  const a = await join("influencer", "a@x.co");
  await seed(db, env, a.id, "tiktok", "tt-1");
  const other = { data: { user: { open_id: "tt-2", username: "baska", display_name: "B", follower_count: 1 } }, error: { code: "ok", message: "" } };
  const swapped = () => fakeFetch(ttRoutes([[`${TT}/user/info/`, [200, other]]]));
  const denied = () => fakeFetch(ttRoutes([[`${TT}/user/info/`, [401, { error: { code: "access_token_invalid", message: "" } }]]]));
  const row = () => ({ ...db.prepare("SELECT status, error, sync_changes FROM social_accounts WHERE user_id = ? AND platform = 'tiktok'").get(a.id) });
  const again = () => db.prepare("UPDATE social_accounts SET next_sync_at = NULL WHERE user_id = ?").run(a.id);
  assert.equal(CHANGE_LIMIT, 3);

  // Sınırın altında: bağlı kalır, ~1 saat sonra yeniden; başarılı senkron sayacı sıfırlar
  for (let i = 1; i < CHANGE_LIMIT; i++) {
    assert.deepEqual(await syncDue(env, swapped()), { ...ZERO, changed: 1 });
    assert.deepEqual(row(), { status: "connected", error: null, sync_changes: i });
    near(due(db, a.id), 55);
    again();
  }
  assert.deepEqual(await syncDue(env, fakeFetch(ttRoutes())), { ...ZERO, synced: 1 });
  assert.deepEqual(row(), { status: "connected", error: null, sync_changes: 0 });

  // Arada sağlayıcı hatası sayacı sıfırlamaz; sınıra ulaşınca hesap 'error', ~6 saat kira, sonra hiç seçilmez
  const steps = [[swapped, { ...ZERO, changed: 1 }, 1], [denied, { ...ZERO, failed: 1 }, 1], [swapped, { ...ZERO, changed: 1 }, 2]];
  for (const [f, out, n] of steps) {
    again();
    assert.deepEqual(await syncDue(env, f()), out);
    assert.equal(row().sync_changes, n);
  }
  again();
  assert.deepEqual(await syncDue(env, swapped()), { ...ZERO, failed: 1 });
  assert.deepEqual(row(), { status: "error", error: "account_changed", sync_changes: 3 });
  near(due(db, a.id), 355);
  again();
  const idle = fakeFetch(ttRoutes());
  assert.deepEqual(await syncDue(env, idle), ZERO);
  assert.equal(idle.calls.length, 0);
  assert.equal(count(db, "metric_snapshots"), 1);
  const list = await call("GET", "/app/connections", { token: a.token });
  assert.equal(list.body.connections.find(c => c.platform === "tiktok").status, "error");

  // Yeniden bağlanma: bağlı, hatasız, sayaç sıfır
  const ticket = await land(env, await start(call, a.token, "tiktok"), "tiktok");
  net = fakeFetch(ttRoutes());
  assert.equal((await finish(call, a.token, ticket)).status, 200);
  assert.deepEqual(row(), { status: "connected", error: null, sync_changes: 0 });
});

test("0002 uygulanmadan disconnect 500 dönmez", async t => {
  t.mock.method(console, "log", () => {});
  const net = fakeFetch([]);
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  // 0001 var, 0002 yok: oauth_tokens tablosu yok
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  db.exec(METRICS);
  const { env, call, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY }, db);
  const inf = await join("influencer", "inf@x.co");
  db.prepare("INSERT INTO social_accounts (user_id, platform, handle, external_id, status) VALUES (?, 'instagram', 'inf_ig', '1784', 'connected')").run(inf.id);
  const r = await call("POST", "/app/disconnect", { token: inf.token, body: { platform: "instagram" } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual({ ...db.prepare("SELECT status, external_id FROM social_accounts").get() }, { status: "revoked", external_id: null });
  // 0001 de yok: hiç tablo yokken de hata vermez
  const bare = new DatabaseSync(":memory:");
  bare.exec(SCHEMA);
  const s = await setup({}, bare);
  const u = await s.join("influencer", "inf@x.co");
  assert.equal((await s.call("POST", "/app/disconnect", { token: u.token, body: { platform: "tiktok" } })).status, 200);
  await disconnectOAuth(s.env, u.id, "youtube");
  assert.equal(net.calls.length, 0);
});

test("cleanup: süresi dolan OAuth state'leri silinir; tablo yoksa diğer temizlik yine yapılır", async t => {
  const logs = [];
  t.mock.method(console, "log", (...a) => logs.push(a.join(" ")));
  const { db, env, call, join } = await setup({ ...IG_ENV, OAUTH_TOKEN_KEY: KEY });
  const inf = await join("influencer", "inf@x.co");
  await start(call, inf.token);
  await start(call, inf.token);
  db.prepare("UPDATE oauth_states SET expires_at = datetime('now', '-1 minutes') WHERE rowid = (SELECT MIN(rowid) FROM oauth_states)").run();
  await cleanup(env);
  assert.equal(count(db, "oauth_states"), 1);
  assert.equal(logs.length, 0);
  // 0002 yok: oauth_states silinemez, loglanır; süresi dolan oturum yine silinir
  const bare = new DatabaseSync(":memory:");
  bare.exec(SCHEMA);
  bare.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ('h', 1, datetime('now', '-1 minutes'))").run();
  await cleanup({ DB: d1(bare) });
  assert.equal(count(bare, "sessions"), 0);
  assert.ok(logs.some(l => l.startsWith("cleanup oauth_states")), logs.join("\n"));
});

test("ytRetention: taramadan çıkan YouTube API gönderisi ve senkronu durmuş hesabın ölçümleri silinir; elle girilen, taze ve diğer platform kalır", async () => {
  const { db, env, join } = await setup({ OAUTH_TOKEN_KEY: KEY });
  const a = await join("influencer", "a@x.co"), b = await join("influencer", "b@x.co");
  await seed(db, env, a.id, "youtube", "UC-a");
  await seed(db, env, a.id, "instagram", "ig-a");
  await seed(db, env, b.id, "youtube", "UC-b");
  const acc = (u, p) => db.prepare("SELECT id FROM social_accounts WHERE user_id = ? AND platform = ?").get(u, p).id;
  const ytA = acc(a.id, "youtube"), igA = acc(a.id, "instagram"), ytB = acc(b.id, "youtube");
  const ago = d => `-${d} days`, over = YT_RETAIN_DAYS + 1;
  const post = (u, url, p, accountId, created) => db.prepare(
    "INSERT INTO posts (user_id, url, platform, type, date, account_id, created_at) VALUES (?, ?, ?, 'video', '2026-01-01', ?, datetime('now', ?))",
  ).run(u, url, p, accountId, ago(created)).lastInsertRowid;
  const snap = (id, d) => db.prepare("INSERT INTO post_snaps (post_id, at, views) VALUES (?, date('now', ?), 1)").run(id, ago(d));
  const metric = (id, d) => db.prepare("INSERT INTO metric_snapshots (account_id, taken_at, followers) VALUES (?, datetime('now', ?), 1)").run(id, ago(d));
  // Son ölçümü sınırdan eski: silinir
  const old = post(a.id, "https://youtu.be/old", "youtube", ytA, 90);
  snap(old, 60); snap(old, over);
  // Taramada: eski ölçümleri de kalır (istatistik, yetki doğrulanıyor)
  const live = post(a.id, "https://youtu.be/live", "youtube", ytA, 90);
  snap(live, 60); snap(live, 3);
  // Ölçümsüz: aktarım tarihi sınırdan eskiyse silinir, yeniyse kalır
  post(a.id, "https://youtu.be/bare-old", "youtube", ytA, over);
  post(a.id, "https://youtu.be/bare-new", "youtube", ytA, 2);
  // Elle girilen YouTube ve Instagram gönderisi kalır
  snap(post(a.id, "https://youtu.be/manual", "youtube", null, 120), 120);
  snap(post(a.id, "https://instagram.com/p/x", "instagram", igA, 120), 120);
  // a'nın YouTube hesabı sınır boyunca senkronlanmamış: ölçümleri silinir; b'ninki ve Instagram kalır
  metric(ytA, 60); metric(ytA, over);
  metric(igA, 60);
  metric(ytB, 60); metric(ytB, 1);
  await ytRetention(env);
  const urls = db.prepare("SELECT url FROM posts ORDER BY url").all().map(r => r.url);
  assert.deepEqual(urls, ["https://instagram.com/p/x", "https://youtu.be/bare-new", "https://youtu.be/live", "https://youtu.be/manual"]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM post_snaps WHERE post_id = ?").get(old).n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM post_snaps WHERE post_id = ?").get(live).n, 2);
  assert.equal(count(db, "post_snaps"), 4);
  const left = db.prepare("SELECT account_id, COUNT(*) AS n FROM metric_snapshots GROUP BY account_id ORDER BY account_id").all().map(r => [r.account_id, r.n]);
  assert.deepEqual(left, [[igA, 1], [ytB, 2]].sort((x, y) => x[0] - y[0]));
  // Hesap ve bağ durumu değişmez
  assert.equal(db.prepare("SELECT status FROM social_accounts WHERE id = ?").get(ytA).status, "connected");
  // İkinci çalıştırma bir şey silmez
  await ytRetention(env);
  assert.equal(count(db, "posts"), 4);
  assert.equal(count(db, "metric_snapshots"), 3);
  // Tablolar yoksa (0001 ya da 0006 uygulanmamış) hata vermez, gönderi tablosu yoksa ölçümler yine silinir;
  // başka hata yukarı çıkar
  const bare = new DatabaseSync(":memory:");
  bare.exec(SCHEMA);
  await ytRetention({ DB: d1(bare) });
  bare.exec(METRICS);
  bare.prepare("INSERT INTO social_accounts (user_id, platform, handle, status) VALUES (1, 'youtube', 'k', 'error')").run();
  bare.prepare("INSERT INTO metric_snapshots (account_id, taken_at) VALUES (1, datetime('now', ?))").run(ago(over));
  await ytRetention({ DB: d1(bare) });
  assert.equal(count(bare, "metric_snapshots"), 0);
  await assert.rejects(ytRetention({ DB: { prepare: () => ({ bind: () => ({}) }), batch: async () => { throw new Error("D1_ERROR: busy"); } } }), /busy/);
});

// ---- PR5: LinkedIn OIDC + marka/ajans hesapları ----
// Sahte LinkedIn uygulama bilgileri; gerçek secret değil
const LI_ENV = { LINKEDIN_CLIENT_ID: "li-client-id", LINKEDIN_CLIENT_SECRET: "li-gizli-secret" };
const LI_TOKEN = "https://www.linkedin.com/oauth/v2/accessToken";
const LI_USER = "https://api.linkedin.com/v2/userinfo";
const liRoutes = (extra = []) => [...extra,
  [LI_TOKEN, [200, { access_token: "li-access", expires_in: 5184000, scope: "openid,profile,email" }]],
  [LI_USER, [200, { sub: "li-sub-1", name: "Ayşe Yılmaz", email: "a@x.co" }]]];
const liRow = (list, p = "linkedin") => list.find(c => c.platform === p);

test("LinkedIn: yetki linki (PKCE yok), kod takası, userinfo sub/ad, yenileme yok", async () => {
  const env = { ...ALL, ...LI_ENV };
  const redirect = "https://forms.test/oauth/linkedin/callback";
  const u = new URL(authorizeUrl(env, "linkedin", "st-1", redirect));
  assert.equal(`${u.origin}${u.pathname}`, "https://www.linkedin.com/oauth/v2/authorization");
  assert.deepEqual(Object.fromEntries(u.searchParams), {
    client_id: "li-client-id", redirect_uri: redirect, response_type: "code", scope: "openid profile email", state: "st-1",
  });
  assert.ok(!u.href.includes("gizli"));

  const f = fakeFetch(liRoutes());
  const t = await exchangeCode(env, "linkedin", "kod", redirect, f);
  assert.deepEqual([f.calls[0].url, f.calls[0].method, f.calls[0].body], [LI_TOKEN, "POST", {
    client_id: "li-client-id", client_secret: "li-gizli-secret", grant_type: "authorization_code", redirect_uri: redirect, code: "kod",
  }]);
  assert.equal(t.access_token, "li-access");
  assert.equal(t.refresh_token, null);

  assert.deepEqual(await fetchProfile("linkedin", t.access_token, f), { external_id: "li-sub-1", handle: "Ayşe Yılmaz", followers: null });
  assert.equal(f.calls[1].url, LI_USER);
  assert.equal(f.calls[1].headers.authorization, "Bearer li-access");

  // name yoksa ad + soyad
  const g = fakeFetch([[LI_USER, [200, { sub: "li-sub-2", given_name: "Ayşe", family_name: "Yılmaz" }]]]);
  assert.deepEqual(await fetchProfile("linkedin", "t", g), { external_id: "li-sub-2", handle: "Ayşe Yılmaz", followers: null });
  const h = fakeFetch([[LI_USER, [200, { sub: "li-sub-3" }]]]);
  assert.deepEqual(await fetchProfile("linkedin", "t", h), { external_id: "li-sub-3", handle: null, followers: null });
  // metin olmayan ad parçası atlanır
  const k = fakeFetch([[LI_USER, [200, { sub: "li-sub-4", given_name: "Ayşe", family_name: { localized: "x" } }]]]);
  assert.equal((await fetchProfile("linkedin", "t", k)).handle, "Ayşe");

  // LinkedIn'de yenileme yok: fetch yapılmadan no_refresh
  const n = fakeFetch(liRoutes());
  await assert.rejects(refreshToken(env, "linkedin", { access_token: "a", refresh_token: "r" }, n), e => e instanceof ProviderError && e.code === "no_refresh");
  assert.equal(n.calls.length, 0);
});

test("LinkedIn: marka bağlar; token saklanmaz, eski token satırı silinir; liste ve ölçümde veri yok; kes yalnız yerel", async t => {
  t.mock.method(console, "log", () => {});
  const net = fakeFetch(liRoutes());
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  const { db, env, call, join } = await setup({ ...ALL, ...LI_ENV });
  const brand = await join("brand", "marka@x.co");
  db.prepare("INSERT INTO oauth_tokens (user_id, platform, access_token, refresh_token, expires_at) VALUES (?, 'linkedin', 'eski', NULL, datetime('now', '+1 hours'))").run(brand.id);

  const ticket = await land(env, await start(call, brand.token, "linkedin"), "linkedin");
  const r = await finish(call, brand.token, ticket);
  assert.deepEqual([r.status, r.body], [200, { ok: true, connection: { platform: "linkedin", handle: "Ayşe Yılmaz" } }]);
  assert.equal(count(db, "oauth_tokens"), 0);
  assert.deepEqual({ ...db.prepare("SELECT platform, external_id, status, handle, sync_changes FROM social_accounts").get() },
    { platform: "linkedin", external_id: "li-sub-1", status: "connected", handle: "Ayşe Yılmaz", sync_changes: 0 });

  const list = (await call("GET", "/app/connections", { token: brand.token })).body;
  assert.deepEqual(list.connectable, ["instagram", "tiktok", "youtube", "linkedin"]);
  const li = liRow(list.connections);
  assert.deepEqual({ ...li, updated_at: typeof li.updated_at }, {
    platform: "linkedin", status: "connected", configured: true, handle: "Ayşe Yılmaz", label: NO_DATA, label_code: "no_data", updated_at: "string",
  });

  const m = await call("GET", "/app/metrics", { token: brand.token });
  assert.equal(m.status, 200);
  const acc = liRow(m.body.metrics.accounts);
  assert.deepEqual([acc.source, acc.label_code, acc.followers], ["none", "no_data", null]);

  const calls = net.calls.length;
  const d = await call("POST", "/app/disconnect", { token: brand.token, body: { platform: "linkedin" } });
  assert.equal(d.status, 200);
  assert.equal(net.calls.length, calls); // LinkedIn'de iptal ucu yok
  assert.equal(db.prepare("SELECT status FROM social_accounts").get().status, "revoked");
});

test("LinkedIn: secret yoksa callback 503, connect 409 not_configured; iptal edilirse denied", async t => {
  t.mock.method(console, "log", () => {});
  const off = await setup(ALL);
  const brand = await off.join("brand", "marka@x.co");
  assert.equal((await callback(off.env, `/oauth/linkedin/callback?code=x&state=${"a".repeat(43)}`)).status, 503);
  assert.deepEqual(fail(await off.call("POST", "/app/connect", { token: brand.token, body: { platform: "linkedin" } })), [409, "not_configured"]);
  assert.equal(liRow((await off.call("GET", "/app/connections", { token: brand.token })).body.connections).status, "not_configured");

  const { db, env, call, join } = await setup({ ...ALL, ...LI_ENV });
  const b2 = await join("agency", "ajans@x.co");
  const state = await start(call, b2.token, "linkedin");
  const r = await callback(env, `/oauth/linkedin/callback?error=user_cancelled_login&state=${state}`);
  assert.equal(r.status, 302);
  assert.equal(r.headers.get("location"), `${ORIGIN}/panel?oauth=linkedin&result=denied`);
  assert.equal(count(db, "oauth_states"), 0);
});

test("roller: üç rol de linkedin bağlar (veri yok, senkron yok, kes yalnız yerel); rolün listesinde olmayan bilet yanar", async t => {
  t.mock.method(console, "log", () => {});
  const net = fakeFetch(liRoutes(igRoutes()));
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  const { db, env, call, join } = await setup({ ...ALL, ...LI_ENV });
  for (const role of ["brand", "agency", "influencer"]) {
    const u = await join(role, `${role}@x.co`);
    const before = (await call("GET", "/app/connections", { token: u.token })).body;
    assert.deepEqual(before.connectable, ["instagram", "tiktok", "youtube", "linkedin"], role);
    assert.deepEqual([liRow(before.connections).status, liRow(before.connections).configured], ["available", true], role);
    const ticket = await land(env, await start(call, u.token, "linkedin"), "linkedin");
    const r = await finish(call, u.token, ticket);
    assert.deepEqual([r.status, r.body.connection], [200, { platform: "linkedin", handle: "Ayşe Yılmaz" }], role);
    const li = liRow((await call("GET", "/app/connections", { token: u.token })).body.connections);
    assert.deepEqual([li.status, li.configured, li.label, li.label_code], ["connected", true, NO_DATA, "no_data"], role);
    const acc = liRow((await call("GET", "/app/metrics", { token: u.token })).body.metrics.accounts);
    assert.deepEqual([acc.source, acc.label_code, acc.followers], ["none", "no_data", null], role);
    const calls = net.calls.length;
    assert.equal((await call("POST", "/app/disconnect", { token: u.token, body: { platform: "linkedin" } })).status, 200);
    assert.equal(net.calls.length, calls, role); // LinkedIn'de iptal ucu yok
  }
  assert.equal(count(db, "oauth_tokens"), 0);

  // Savunma: bilet rolün listesinde olmayan platform içinse finish 400 no_api ve bilet yanar
  const u = await join("brand", "donen@x.co");
  const ticket = await land(env, await start(call, u.token, "linkedin"), "linkedin");
  const saved = CONNECTABLE.brand;
  CONNECTABLE.brand = [...SYNCED];
  const before = net.calls.length;
  try {
    // Rolün listesinde olmayan platform: satır no_api, secret'lar tam olsa da configured false
    const narrowed = (await call("GET", "/app/connections", { token: u.token })).body;
    assert.deepEqual(narrowed.connectable, [...SYNCED]);
    assert.deepEqual(liRow(narrowed.connections), {
      platform: "linkedin", status: "no_api", configured: false, handle: null, label: NO_DATA, label_code: "no_data", updated_at: null,
    });
    assert.deepEqual(fail(await finish(call, u.token, ticket)), [400, "no_api"]);
    assert.deepEqual(fail(await finish(call, u.token, ticket)), [400, "ticket"]);
  } finally {
    CONNECTABLE.brand = saved;
  }
  assert.equal(net.calls.length, before);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM social_accounts WHERE user_id = ?").get(u.id).n, 0);
});

test("roller: marka kesişi influencer satırına dokunmaz; marka başka markanın ölçümünü göremez", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, call, join } = await setup({ ...ALL, ...LI_ENV });
  const inf = await join("influencer", "inf@x.co"), brand = await join("brand", "marka@x.co"), other = await join("brand", "diger@x.co");
  await seed(db, env, inf.id, "instagram", "1784");
  await seed(db, env, brand.id, "instagram", "1785");
  t.mock.method(globalThis, "fetch", fakeFetch(igRoutes()));
  assert.equal((await call("POST", "/app/disconnect", { token: brand.token, body: { platform: "instagram" } })).status, 200);
  const st = id => db.prepare("SELECT status FROM social_accounts WHERE user_id = ? AND platform = 'instagram'").get(id).status;
  assert.equal(st(inf.id), "connected");
  assert.equal(st(brand.id), "revoked");
  assert.deepEqual(fail(await call("GET", `/app/metrics/${other.id}`, { token: brand.token })), [404, "not_found"]);
});

test("korumalar: roller arası taken iki yönde (linkedin dahil), marka bileti başkasında 403, linkedin UNIQUE yarışı 409", async t => {
  t.mock.method(console, "log", () => {});
  const net = fakeFetch(liRoutes(igRoutes()));
  t.mock.method(globalThis, "fetch", (...a) => net(...a));
  const { db, env, call, join } = await setup({ ...ALL, ...LI_ENV });
  const agency = await join("agency", "ajans@x.co"), inf = await join("influencer", "inf@x.co");
  const connect = async (u, p = "instagram") => finish(call, u.token, await land(env, await start(call, u.token, p), p));

  assert.equal((await connect(agency)).status, 200);
  assert.deepEqual(fail(await connect(inf)), [409, "taken"]);
  assert.equal((await call("POST", "/app/disconnect", { token: agency.token, body: { platform: "instagram" } })).status, 200);
  assert.equal((await connect(inf)).status, 200);
  assert.deepEqual(fail(await connect(agency)), [409, "taken"]);

  // LinkedIn de roller arasında: influencer'a bağlı profil ajansa bağlanamaz, kesilince bağlanır
  assert.equal((await connect(inf, "linkedin")).status, 200);
  assert.deepEqual(fail(await connect(agency, "linkedin")), [409, "taken"]);
  assert.equal((await call("POST", "/app/disconnect", { token: inf.token, body: { platform: "linkedin" } })).status, 200);
  assert.equal((await connect(agency, "linkedin")).status, 200);
  assert.equal((await call("POST", "/app/disconnect", { token: agency.token, body: { platform: "linkedin" } })).status, 200);

  // Marka bileti başka bir kullanıcıda kullanılamaz
  const b1 = await join("brand", "b1@x.co"), b2 = await join("brand", "b2@x.co");
  const ticket = await land(env, await start(call, b1.token, "linkedin"), "linkedin");
  assert.deepEqual(fail(await finish(call, b2.token, ticket)), [403, "ticket_owner"]);
  assert.deepEqual(fail(await finish(call, b1.token, ticket)), [400, "ticket"]);

  // LinkedIn: aynı sub ikinci markaya bağlanamaz; ön kontrol atlansa da UNIQUE engeller
  assert.equal((await connect(b1, "linkedin")).status, 200);
  assert.deepEqual(fail(await connect(b2, "linkedin")), [409, "taken"]);
  const prep = env.DB.prepare;
  env.DB.prepare = sql => (/^SELECT 1 FROM social_accounts/.test(sql) ? { bind: () => ({ first: async () => null }) } : prep(sql));
  const raced = await connect(b2, "linkedin");
  env.DB.prepare = prep;
  assert.deepEqual(fail(raced), [409, "taken"]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM social_accounts WHERE user_id = ?").get(b2.id).n, 0);
});

test("liste: configured her satırda boolean ve kapalı kipten bağımsız; linkedin tek; kapalı kipte bağlı linkedin görünür", async () => {
  const { db, env, call, join } = await setup({ ...ALL, ...LI_ENV });
  const brand = await join("brand", "marka@x.co"), inf = await join("influencer", "inf@x.co");
  for (const u of [brand, inf]) {
    const { connections } = (await call("GET", "/app/connections", { token: u.token })).body;
    assert.deepEqual(connections.map(c => c.platform), LISTED);
    assert.equal(connections.filter(c => c.platform === "linkedin").length, 1);
    for (const c of connections) {
      assert.deepEqual(Object.keys(c), ["platform", "status", "configured", "handle", "label", "label_code", "updated_at"]);
      assert.equal(typeof c.configured, "boolean");
    }
  }
  const viaList = await listConnections(env, brand.id, "brand");
  const offList = await listConnections({ ...env, METRICS_ENABLED: "0" }, brand.id, "brand");
  assert.deepEqual(offList.map(c => c.configured), viaList.map(c => c.configured));
  assert.equal(liRow(viaList).configured, true);

  await seed(db, env, brand.id, "linkedin", "li-sub-1");
  env.METRICS_ENABLED = "0";
  const r = await call("GET", "/app/connections", { token: brand.token });
  assert.deepEqual([r.status, r.body.disabled, r.body.connectable], [200, true, ["instagram", "tiktok", "youtube", "linkedin"]]);
  assert.deepEqual(r.body.connections.map(c => [c.platform, c.status, c.label_code]), [["linkedin", "connected", "no_data"]]);
  assert.deepEqual(fail(await call("POST", "/app/connect", { token: brand.token, body: { platform: "linkedin" } })), [409, "disabled"]);
  assert.equal((await call("POST", "/app/disconnect", { token: brand.token, body: { platform: "linkedin" } })).status, 200);
});

test("syncDue: linkedin satırları senkrona girmez (20 linkedin + 1 tiktok → 1)", async t => {
  t.mock.method(console, "log", () => {});
  const { db, env, join } = await setup({ ...TT_ENV, ...LI_ENV, OAUTH_TOKEN_KEY: KEY });
  for (let i = 0; i < 20; i++) {
    const id = db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES ('x', ?, 'x', 'brand', 'x')").run(`li${i}@x.co`).lastInsertRowid;
    await seed(db, env, Number(id), "linkedin", `li-${i}`);
  }
  const inf = await join("influencer", "inf@x.co");
  await seed(db, env, inf.id, "tiktok", "tt-1");
  const f = fakeFetch([...ttRoutes(), ...liRoutes()]);
  assert.deepEqual(await syncDue(env, f), { ...ZERO, synced: 1 });
  assert.ok(f.calls.length > 0);
  assert.ok(f.calls.every(c => !c.url.includes("linkedin")));
  await assert.rejects(syncAccount(env, inf.id, "linkedin", f), e => e.code === "no_api");
});

test("cleanHandle: görünmez kontrol/biçim karakterleri silinir, ZWJ kalır, 60 kod noktası", () => {
  assert.equal(cleanHandle("a b؜c\u{E0041}d­e\u0007"), "abcde");
  assert.equal(cleanHandle("👩‍💻 Ayşe"), "👩‍💻 Ayşe");
  assert.equal(cleanHandle("  ad‌soyad  "), "ad‌soyad");
  assert.equal([...cleanHandle("😀".repeat(70))].length, 60);
  assert.equal(cleanHandle(null), null);
  assert.equal(cleanHandle(5), null);
  assert.equal(cleanHandle(""), null);
  assert.equal(cleanHandle("   "), null);
});

test("external_id: boş, yalnız boşluk ya da 128'den uzunsa no_id; sayı string olur", async () => {
  const prof = body => fetchProfile("linkedin", "t", fakeFetch([[LI_USER, [200, body]]]));
  for (const body of [{}, { sub: "  " }, { sub: "a".repeat(129) }, { sub: null }, { sub: {} }]) {
    await assert.rejects(prof(body), e => e instanceof ProviderError && e.code === "no_id", JSON.stringify(body));
  }
  assert.equal((await prof({ sub: 123 })).external_id, "123");
  assert.equal((await prof({ sub: "a".repeat(128) })).external_id, "a".repeat(128));
});
