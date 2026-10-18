// brandcorner sosyal hesap bağlama: yalnızca resmi OAuth (Instagram API, TikTok, YouTube Data API).
// Kazıma yok, şifre istenmez. Client id/secret Worker secret'ı; eksikse platform "yapılandırılmadı" görünür.
// LinkedIn, X ve Twitch'in metrik API'si bağlanmadı: "veri yok". METRICS_ENABLED kapalıyken bağlanılamaz.
// Bağlı hesabın tek kaynağı social_accounts (0001_metrics.sql); 0002_oauth.sql akış durumu ve token'ları tutar.
// Token'lar OAUTH_TOKEN_KEY (base64, 32 bayt) ile AES-GCM şifreli saklanır.
// Akış: POST /app/connect → sağlayıcı → GET /oauth/<platform>/callback (index.js; OAUTH_REDIRECT_BASE yoksa
// worker'ın kendi adresi) → panel /panel?oauth=<p>&result=pending#ticket=<bilet> → POST /app/connect/finish.
// Token takası yalnızca bileti getiren oturum akışı başlatan kullanıcıysa yapılır; callback'i açan tarayıcı
// başka birinin olsa bile (RFC 6749 §10.12) hesap ona bağlanmaz.
import { metricsEnabled } from "./metrics.js";

export const NOT_CONFIGURED = "yapılandırılmadı", NO_DATA = "veri yok";
export const OAUTH = ["instagram", "tiktok", "youtube"];
const STATE_MINUTES = 10, TICKET_MINUTES = 5, SAMPLE = 12; // ortalama için son 12 gönderi
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/; // 32 rastgele baytın base64url'i (state ve bilet)

const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0));
const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)))].map(b => b.toString(16).padStart(2, "0")).join("");

const IG = "https://graph.instagram.com", IG_API = `${IG}/v23.0`;
const TT = "https://open.tiktokapis.com/v2", YT = "https://www.googleapis.com/youtube/v3";

// refresh: süresi bu kadar içinde dolacak token yenilenir (Instagram 60 gün, TikTok 1 gün, YouTube 1 saat geçerli)
const PROVIDERS = {
  instagram: {
    id: "INSTAGRAM_CLIENT_ID", secret: "INSTAGRAM_CLIENT_SECRET", refresh: "+7 days",
    authorize: "https://www.instagram.com/oauth/authorize",
    scope: "instagram_business_basic,instagram_business_manage_insights",
  },
  tiktok: {
    id: "TIKTOK_CLIENT_KEY", secret: "TIKTOK_CLIENT_SECRET", idParam: "client_key", refresh: "+10 minutes",
    authorize: "https://www.tiktok.com/v2/auth/authorize/",
    scope: "user.info.basic,user.info.profile,user.info.stats,video.list",
  },
  youtube: {
    id: "YOUTUBE_CLIENT_ID", secret: "YOUTUBE_CLIENT_SECRET", refresh: "+10 minutes",
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    params: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
  },
};

export class ProviderError extends Error {
  constructor(code) { super(code); this.code = String(code).slice(0, 120); }
}

function tokenKey(env) {
  try {
    const k = unb64u(String(env?.OAUTH_TOKEN_KEY || "").trim());
    return k.length === 32 ? k : null;
  } catch { return null; }
}

export const oauthReady = (env, p) => OAUTH.includes(p) && !!env?.[PROVIDERS[p].id] && !!env?.[PROVIDERS[p].secret] && !!tokenKey(env);
const anyReady = env => OAUTH.some(p => oauthReady(env, p));

export const redirectUri = (env, api, p) => `${String(env?.OAUTH_REDIRECT_BASE || api).replace(/\/+$/, "")}/oauth/${p}/callback`;

// Bağlantı durumu: no_api ("veri yok"), not_configured ("yapılandırılmadı"), available, connected, error.
// Kaynak social_accounts: "connected" (son senkron hatalıysa "error") ya da "error"; pending/revoked → available.
export async function listConnections(env, userId, platforms = [...OAUTH, "linkedin", "x", "twitch"]) {
  let rows = new Map();
  if (anyReady(env)) {
    const { results = [] } = await env.DB.prepare(
      "SELECT platform, handle, status, error, updated_at FROM social_accounts WHERE user_id = ? AND status IN ('connected', 'error')",
    ).bind(userId).all();
    rows = new Map(results.map(r => [r.platform, r]));
  }
  return platforms.map(p => {
    if (!OAUTH.includes(p)) return { platform: p, status: "no_api", label: NO_DATA, handle: null, updated_at: null };
    if (!oauthReady(env, p)) return { platform: p, status: "not_configured", label: NOT_CONFIGURED, handle: null, updated_at: null };
    const r = rows.get(p);
    if (!r) return { platform: p, status: "available", label: null, handle: null, updated_at: null };
    return { platform: p, status: r.status === "error" || r.error ? "error" : "connected", label: null, handle: r.handle ?? null, updated_at: r.updated_at };
  });
}

export function authorizeUrl(env, p, state, redirect) {
  const cfg = PROVIDERS[p], u = new URL(cfg.authorize);
  const q = { [cfg.idParam || "client_id"]: env[cfg.id], redirect_uri: redirect, response_type: "code", scope: cfg.scope, state, ...cfg.params };
  for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v);
  return u.toString();
}

// Dönüş adresi ham Origin'den değil doğrulanmış siteden kurulur: https, port yok, yol ve kullanıcı yok.
// platform() yalnız alan adını denetler; http ya da başka port gelirse bilet o adrese gitmesin. DEV_ORIGINS birebir.
export function returnBase(env, origin, site) {
  if ((env.DEV_ORIGINS || "").split(",").includes(origin)) return origin;
  try {
    const u = new URL(origin);
    if (u.protocol === "https:" && !u.port && u.origin === origin) return u.origin;
  } catch {}
  return `https://${site}`;
}

// Tek kullanımlık state üretir, sağlayıcının onay sayfası adresini döndürür. c: {api, origin, site}
// origin platform()'un izin verdiği site (brandcorner.co ya da önizlemesi); dönüş adresi returnBase ile kaydedilir.
export async function startOAuth(env, userId, p, { api, origin, site }) {
  const state = b64u(crypto.getRandomValues(new Uint8Array(32))), redirect = redirectUri(env, api, p);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM oauth_states WHERE expires_at <= datetime('now')"),
    env.DB.prepare("INSERT INTO oauth_states (state_hash, user_id, platform, return_to, redirect_uri, expires_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))")
      .bind(await sha256(state), userId, p, `${returnBase(env, origin, site)}/panel`, redirect, `+${STATE_MINUTES} minutes`),
  ]);
  return authorizeUrl(env, p, state, redirect);
}

// Bağı koparır: token silinir, social_accounts "revoked" olur ve platform kimliği boşalır (hesap başka
// kullanıcıya bağlanabilir). Platform yapılandırılmamış olsa da çalışır. Ardından sağlayıcıda izin geri
// alınmaya çalışılır (TikTok, Google); olmazsa yine de bağ kopmuştur. Instagram'ın iptal ucu yok,
// kullanıcı izni Instagram ayarlarından kaldırır.
export async function disconnectOAuth(env, userId, p, f = fetch) {
  const row = await env.DB.prepare("SELECT access_token, refresh_token FROM oauth_tokens WHERE user_id = ? AND platform = ?").bind(userId, p).first();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM oauth_tokens WHERE user_id = ? AND platform = ?").bind(userId, p),
    env.DB.prepare("UPDATE social_accounts SET status = 'revoked', external_id = NULL, error = NULL, updated_at = datetime('now') WHERE user_id = ? AND platform = ?")
      .bind(userId, p),
  ]);
  if (!row || !REVOKE[p] || !oauthReady(env, p)) return;
  try {
    const [url, init] = REVOKE[p](env, await decrypt(env, row.access_token), await decrypt(env, row.refresh_token));
    const res = await f(url, init);
    if (!res.ok) throw new ProviderError(`revoke:${res.status}`);
  } catch (e) {
    console.log("oauth revoke", p, e instanceof ProviderError ? e.code : "error");
  }
}

// Sağlayıcıda izni geri alma. Google'da refresh token iptali uygulamanın bu hesaptaki tüm iznini kaldırır.
const REVOKE = {
  tiktok: (env, access) => [`${TT}/oauth/revoke/`, form({ client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET, token: access })],
  youtube: (env, access, refresh) => ["https://oauth2.googleapis.com/revoke", form({ token: refresh || access })],
};

// ---- Sağlayıcı çağrıları (f: fetch; testte sahtesi verilir) ----

async function json(f, url, init) {
  const res = await f(url, init);
  const body = await res.json().catch(() => null);
  const err = body?.error;
  if (!res.ok || !body || typeof err === "string" || (err && typeof err === "object" && err.code && err.code !== "ok")) {
    throw new ProviderError(`${res.status}:${typeof err === "string" ? err : err?.code ?? err?.type ?? body?.error_type ?? "http"}`);
  }
  return body;
}
const form = obj => ({ method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(obj) });
const bearer = token => ({ headers: { authorization: `Bearer ${token}` } });
const igUrl = (path, q) => `${IG_API}/${path}?${new URLSearchParams(q)}`;

// Dönüş: {access_token, refresh_token, expires_in, scope}
export async function exchangeCode(env, p, code, redirect, f = fetch) {
  const cfg = PROVIDERS[p], id = env[cfg.id], secret = env[cfg.secret];
  if (p === "instagram") {
    const b = await json(f, "https://api.instagram.com/oauth/access_token",
      form({ client_id: id, client_secret: secret, grant_type: "authorization_code", redirect_uri: redirect, code }));
    const short = Array.isArray(b.data) ? b.data[0] : b;
    if (!short?.access_token) throw new ProviderError("token");
    // Kısa ömürlü (1 saat) token 60 günlük token'la değiştirilir
    const long = await json(f, `${IG}/access_token?${new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: secret, access_token: short.access_token })}`);
    return { access_token: long.access_token, refresh_token: null, expires_in: long.expires_in, scope: [].concat(short.permissions ?? []).join(",") || cfg.scope };
  }
  const url = p === "tiktok" ? `${TT}/oauth/token/` : "https://oauth2.googleapis.com/token";
  const b = await json(f, url, form({ [cfg.idParam || "client_id"]: id, client_secret: secret, grant_type: "authorization_code", redirect_uri: redirect, code }));
  if (!b.access_token) throw new ProviderError("token");
  return { access_token: b.access_token, refresh_token: b.refresh_token ?? null, expires_in: b.expires_in, scope: b.scope ?? cfg.scope };
}

export async function refreshToken(env, p, { access_token, refresh_token }, f = fetch) {
  const cfg = PROVIDERS[p];
  if (p === "instagram") {
    const b = await json(f, `${IG}/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token })}`);
    return { access_token: b.access_token, refresh_token: null, expires_in: b.expires_in };
  }
  if (!refresh_token) throw new ProviderError("no_refresh_token");
  const url = p === "tiktok" ? `${TT}/oauth/token/` : "https://oauth2.googleapis.com/token";
  const b = await json(f, url, form({ [cfg.idParam || "client_id"]: env[cfg.id], client_secret: env[cfg.secret], grant_type: "refresh_token", refresh_token }));
  if (!b.access_token) throw new ProviderError("token");
  return { access_token: b.access_token, refresh_token: b.refresh_token ?? null, expires_in: b.expires_in };
}

// Gizli ya da gelmeyen değer null; ortalamaya yalnızca gelen değerler girer
const num = v => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const avg = list => {
  const xs = list.map(num).filter(x => x !== null);
  return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
};

// Her sağlayıcı: profile → {external_id, handle, followers, ...}; recent → [{views, likes, comments}]
const API = {
  instagram: {
    async profile(token, f) {
      const me = await json(f, igUrl("me", { fields: "user_id,username,followers_count", access_token: token }));
      return { external_id: me.user_id ?? me.id, handle: me.username, followers: me.followers_count };
    },
    async recent(token, f) {
      const media = await json(f, igUrl("me/media", { fields: "id,like_count,comments_count", limit: SAMPLE, access_token: token }));
      const items = (media.data || []).slice(0, SAMPLE);
      // İzlenme yalnızca gönderi insights'ında; alınamayan gönderi (eski, reklam vb.) ortalamaya girmez
      const views = await Promise.all(items.map(m => json(f, igUrl(`${m.id}/insights`, { metric: "views", access_token: token }))
        .then(b => { const d = b.data?.[0]; return d?.total_value?.value ?? d?.values?.[0]?.value ?? null; }, () => null)));
      return items.map((m, i) => ({ views: views[i], likes: m.like_count, comments: m.comments_count }));
    },
  },
  tiktok: {
    async profile(token, f) {
      const b = await json(f, `${TT}/user/info/?fields=open_id,username,display_name,follower_count`, bearer(token));
      const u = b.data?.user || {};
      return { external_id: u.open_id, handle: u.username || u.display_name, followers: u.follower_count };
    },
    async recent(token, f) {
      const b = await json(f, `${TT}/video/list/?fields=id,view_count,like_count,comment_count`, {
        method: "POST", headers: { ...bearer(token).headers, "content-type": "application/json" }, body: JSON.stringify({ max_count: SAMPLE }),
      });
      return (b.data?.videos || []).slice(0, SAMPLE).map(v => ({ views: v.view_count, likes: v.like_count, comments: v.comment_count }));
    },
  },
  youtube: {
    async profile(token, f) {
      const b = await json(f, `${YT}/channels?part=snippet,statistics,contentDetails&mine=true`, bearer(token));
      const ch = b.items?.[0];
      if (!ch) throw new ProviderError("no_channel");
      const st = ch.statistics || {};
      return {
        external_id: ch.id, handle: ch.snippet?.customUrl || ch.snippet?.title,
        followers: st.hiddenSubscriberCount ? null : st.subscriberCount, uploads: ch.contentDetails?.relatedPlaylists?.uploads,
      };
    },
    async recent(token, f, prof) {
      if (!prof.uploads) return [];
      // Videosu olmayan kanalda yükleme listesi 404 dönebilir
      const pl = await json(f, `${YT}/playlistItems?part=contentDetails&maxResults=${SAMPLE}&playlistId=${encodeURIComponent(prof.uploads)}`, bearer(token))
        .catch(() => ({ items: [] }));
      const ids = (pl.items || []).map(i => i.contentDetails?.videoId).filter(Boolean).slice(0, SAMPLE);
      if (!ids.length) return [];
      const vs = await json(f, `${YT}/videos?part=statistics&id=${ids.map(encodeURIComponent).join(",")}`, bearer(token));
      return (vs.items || []).map(({ statistics: s = {} }) => ({ views: s.viewCount, likes: s.likeCount, comments: s.commentCount }));
    },
  },
};

export async function fetchProfile(p, token, f = fetch) {
  const pr = await API[p].profile(token, f);
  return { external_id: pr.external_id == null ? null : String(pr.external_id), handle: pr.handle || null, followers: num(pr.followers) };
}

// Takipçi + son gönderilerin ortalama izlenme, beğeni ve yorumu
export async function fetchMetrics(p, token, f = fetch) {
  const pr = await API[p].profile(token, f);
  const posts = await API[p].recent(token, f, pr);
  return {
    external_id: pr.external_id == null ? null : String(pr.external_id), handle: pr.handle || null, followers: num(pr.followers),
    avg_views: avg(posts.map(x => x.views)), avg_likes: avg(posts.map(x => x.likes)), avg_comments: avg(posts.map(x => x.comments)),
    posts_sampled: posts.length,
  };
}

// ---- Token şifreleme: "v1.<iv>.<şifreli>" (AES-GCM, 12 bayt iv) ----

const aesKey = env => {
  const raw = tokenKey(env);
  if (!raw) throw new Error("token_key");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
};

export async function encrypt(env, plain) {
  if (plain == null) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(env), enc.encode(String(plain))));
  return `v1.${b64u(iv)}.${b64u(ct)}`;
}

export async function decrypt(env, box) {
  if (box == null) return null;
  const [v, iv, ct] = String(box).split(".");
  if (v !== "v1" || !iv || !ct) throw new Error("token_format");
  return dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv) }, await aesKey(env), unb64u(ct)));
}

const expiry = t => (num(t.expires_in) === null ? null : `+${Math.floor(num(t.expires_in))} seconds`);

// Bağlı hesabın güncel metrikleri; süresi dolmak üzere olan token önce yenilenir.
// Sonuç social_accounts'a yazılır (hata kodu ya da güncel kullanıcı adı). Ölçümleri metric_snapshots'a
// kaydetmek ve günlük senkron sonraki PR'da.
// Okuma ile yazma arasında hesap yeniden bağlanabilir ya da token başka bir senkronla yenilenebilir. Yazımlar
// okunan token'a ve platform kimliğine bağlı (karşılaştır-yaz): eski hesabın token'ı ya da kullanıcı adı yenisinin
// üstüne yazılmaz. Hata yazımı da o an geçerli token'a bağlı: başka bir senkron token'ı yenilediyse ya da hesap
// koparılıp yeniden bağlandıysa eski token'ın hatası yeni bağa düşmez. Böyle bir çakışmada (bağ koparılması dahil)
// "changed" atılır, hesaba hata yazılmaz; çağıran bu ölçümleri kaydetmez.
export async function syncAccount(env, userId, p, f = fetch) {
  if (!oauthReady(env, p)) throw new ProviderError("not_configured");
  const row = await env.DB.prepare(
    `SELECT t.access_token, t.refresh_token, (t.expires_at IS NOT NULL AND t.expires_at <= datetime('now', ?)) AS stale, a.external_id
     FROM oauth_tokens t JOIN social_accounts a ON a.user_id = t.user_id AND a.platform = t.platform AND a.status = 'connected'
     WHERE t.user_id = ? AND t.platform = ?`,
  ).bind(PROVIDERS[p].refresh, userId, p).first();
  if (!row) throw new ProviderError("not_connected");
  let cur = row.access_token;
  const mark = (error, handle = null) => env.DB.prepare(
    `UPDATE social_accounts SET error = ?, handle = COALESCE(?, handle), updated_at = datetime('now')
     WHERE user_id = ? AND platform = ? AND status = 'connected' AND external_id = ?
       AND EXISTS (SELECT 1 FROM oauth_tokens WHERE user_id = ? AND platform = ? AND access_token = ?)`,
  ).bind(error, handle, userId, p, row.external_id, userId, p, cur).run();
  try {
    let access = await decrypt(env, row.access_token);
    if (row.stale) {
      const t = await refreshToken(env, p, { access_token: access, refresh_token: await decrypt(env, row.refresh_token) }, f);
      const next = await encrypt(env, t.access_token);
      const r = await env.DB.prepare(
        "UPDATE oauth_tokens SET access_token = ?, refresh_token = COALESCE(?, refresh_token), expires_at = datetime('now', ?), updated_at = datetime('now') WHERE user_id = ? AND platform = ? AND access_token = ?",
      ).bind(next, await encrypt(env, t.refresh_token), expiry(t), userId, p, row.access_token).run();
      if (!r.meta?.changes) throw new ProviderError("changed");
      cur = next;
      access = t.access_token;
    }
    const m = await fetchMetrics(p, access, f);
    if (m.external_id !== row.external_id) throw new ProviderError("changed");
    if (!(await mark(null, m.handle)).meta?.changes) throw new ProviderError("changed");
    return m;
  } catch (e) {
    if (e instanceof ProviderError && e.code === "changed") throw e;
    if (!(await mark(e instanceof ProviderError ? e.code : "sync")).meta?.changes) throw new ProviderError("changed");
    throw e;
  }
}

// ---- Sağlayıcı dönüşü: GET /oauth/<platform>/callback?code=…&state=… ----

const page = (body, status) => new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
const redirect = to => new Response(null, { status: 302, headers: { location: to, "cache-control": "no-store", "referrer-policy": "no-referrer" } });
const EXPIRED = "Bağlantı geçersiz ya da süresi dolmuş. Panelden yeniden bağlanmayı deneyin.";

// Callback hiçbir hesabı bağlamaz. Sağlayıcının kodunu şifreli saklar, state'i tek kullanımlık bir bilete
// çevirir ve paneli /panel?oauth=<p>&result=pending#ticket=<bilet> adresine gönderir (bilet sunucu
// loglarına ve Referer'a düşmesin diye fragment'ta). Red: result=denied. State ikinci kez kullanılamaz.
export async function oauthCallback(req, url, env) {
  const p = /^\/oauth\/([a-z]+)\/callback$/.exec(url.pathname)?.[1];
  if (req.method !== "GET" || !OAUTH.includes(p)) return page("Bulunamadı", 404);
  if (!metricsEnabled(env) || !oauthReady(env, p)) return page(NOT_CONFIGURED, 503);
  const state = url.searchParams.get("state") || "";
  if (!TOKEN_RE.test(state)) return page(EXPIRED, 400);
  const hash = await sha256(state), code = url.searchParams.get("code");
  const back = (to, result, frag = "") => redirect(`${to}?${new URLSearchParams({ oauth: p, result })}${frag}`);
  // Dönüş adresi istekten değil, başlatırken kaydedilenden gelir.
  if (url.searchParams.get("error") || !code) {
    const st = await env.DB.prepare(
      "DELETE FROM oauth_states WHERE state_hash = ? AND platform = ? AND ticket_hash IS NULL AND expires_at > datetime('now') RETURNING return_to",
    ).bind(hash, p).first();
    return st ? back(st.return_to, "denied") : page(EXPIRED, 400);
  }
  const ticket = b64u(crypto.getRandomValues(new Uint8Array(32)));
  const st = await env.DB.prepare(
    `UPDATE oauth_states SET ticket_hash = ?, code = ?, expires_at = datetime('now', ?)
     WHERE state_hash = ? AND platform = ? AND ticket_hash IS NULL AND expires_at > datetime('now') RETURNING return_to`,
  ).bind(await sha256(ticket), await encrypt(env, code), `+${TICKET_MINUTES} minutes`, hash, p).first();
  return st ? back(st.return_to, "pending", `#ticket=${ticket}`) : page(EXPIRED, 400);
}

// Hata kodu ve HTTP durumu; platform.js bunu kendi Bad hatasına çevirir.
export class OAuthFail extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}

// POST /app/connect/finish {ticket}: bileti getiren oturum akışı başlatan kullanıcı değilse bilet yine
// yanar ve hiçbir şey bağlanmaz (forbidden). Platform hesabı başka kullanıcıya bağlıysa "taken".
export async function finishOAuth(env, userId, ticket, f = fetch) {
  if (typeof ticket !== "string" || !TOKEN_RE.test(ticket)) throw new OAuthFail("ticket");
  const st = await env.DB.prepare(
    "DELETE FROM oauth_states WHERE ticket_hash = ? AND expires_at > datetime('now') RETURNING user_id, platform, code, redirect_uri",
  ).bind(await sha256(ticket)).first();
  if (!st) throw new OAuthFail("ticket");
  if (Number(st.user_id) !== Number(userId)) throw new OAuthFail("forbidden", 403);
  const p = st.platform;
  if (!oauthReady(env, p)) throw new OAuthFail("not_configured", 409);
  try {
    const t = await exchangeCode(env, p, await decrypt(env, st.code), st.redirect_uri, f);
    const prof = await fetchProfile(p, t.access_token, f);
    if (!prof.external_id) throw new ProviderError("no_id");
    const other = await env.DB.prepare("SELECT 1 FROM social_accounts WHERE platform = ? AND external_id = ? AND user_id <> ?")
      .bind(p, prof.external_id, userId).first();
    // Sağlayıcıda iptal yapılmaz: Google'da bu, hesabı bağlı tutan diğer kullanıcının iznini de kaldırır.
    if (other) throw new OAuthFail("taken", 409);
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO social_accounts (user_id, platform, handle, external_id, status, connected_at, error)
         VALUES (?, ?, ?, ?, 'connected', datetime('now'), NULL)
         ON CONFLICT (user_id, platform) DO UPDATE SET handle = excluded.handle, external_id = excluded.external_id,
           status = 'connected', connected_at = excluded.connected_at, error = NULL, updated_at = datetime('now')`,
      ).bind(userId, p, prof.handle ?? null, prof.external_id),
      env.DB.prepare(
        `INSERT INTO oauth_tokens (user_id, platform, access_token, refresh_token, expires_at, scope)
         VALUES (?, ?, ?, ?, datetime('now', ?), ?)
         ON CONFLICT (user_id, platform) DO UPDATE SET access_token = excluded.access_token, refresh_token = excluded.refresh_token,
           expires_at = excluded.expires_at, scope = excluded.scope, updated_at = datetime('now')`,
      ).bind(userId, p, await encrypt(env, t.access_token), await encrypt(env, t.refresh_token), expiry(t), t.scope ?? null),
    ]);
    return { platform: p, handle: prof.handle ?? null };
  } catch (e) {
    if (e instanceof OAuthFail) throw e;
    if (/UNIQUE/i.test(e?.message || "")) throw new OAuthFail("taken", 409); // aynı anda iki kullanıcı
    console.log("oauth", p, e instanceof ProviderError ? e.code : "error");
    throw new OAuthFail("provider", 502);
  }
}
