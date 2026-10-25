// brandcorner sosyal hesap bağlama: yalnızca resmi OAuth (Instagram API, TikTok, YouTube Data API,
// LinkedIn OpenID Connect). Kazıma yok, şifre istenmez. Client id/secret Worker secret'ı; eksikse platform
// "yapılandırılmadı" görünür. LinkedIn yalnızca kimlik (OpenID Connect): metrikleri Community Management onayına
// kadar "veri yok". X ve Twitch bağlanamaz ("veri yok"). METRICS_ENABLED kapalıyken bağlanılamaz.
// Bağlı hesabın tek kaynağı social_accounts (0001_metrics.sql); 0002_oauth.sql akış durumu ve token'ları tutar.
// Token'lar OAUTH_TOKEN_KEY (base64, 32 bayt) ile AES-GCM şifreli saklanır.
// POSTS_ENABLED "1" ise senkron (Instagram, TikTok, YouTube) son gönderileri (Instagram ve YouTube'da en çok 200, TikTok'ta
// 100) panelin Gönderiler kaydına (posts/post_snaps, 0007 posts.account_id) aktarır; bağ koparılınca ya da platformda başka
// hesap bağlanınca bu gönderiler silinir.
// Akış: POST /app/connect → sağlayıcı → GET /oauth/<platform>/callback (index.js; OAUTH_REDIRECT_BASE yoksa
// worker'ın kendi adresi) → panel /panel?oauth=<p>&result=pending#ticket=<bilet> → POST /app/connect/finish.
// Token takası yalnızca bileti getiren oturum akışı başlatan kullanıcıysa yapılır; callback'i açan tarayıcı
// başka birinin olsa bile (RFC 6749 §10.12) hesap ona bağlanmaz.
import { metricsEnabled } from "./metrics.js";

export const NOT_CONFIGURED = "yapılandırılmadı", NO_DATA = "veri yok";
// OAUTH: bağlanabilen (OAuth akışı var). SYNCED: metrikleri senkronlanan. LISTED: bağlantı listesi (sıra).
// CONNECTABLE: rolün bağlayabildiği; üç rolde de SYNCED + LinkedIn (LinkedIn'de senkron yok, "veri yok").
export const OAUTH = ["instagram", "tiktok", "youtube", "linkedin"];
export const SYNCED = ["instagram", "tiktok", "youtube"];
export const LISTED = ["instagram", "tiktok", "youtube", "x", "linkedin", "twitch"];
export const CONNECTABLE = { influencer: [...SYNCED, "linkedin"], brand: [...SYNCED, "linkedin"], agency: [...SYNCED, "linkedin"] };
const STATE_MINUTES = 10, TICKET_MINUTES = 5, SAMPLE = 12; // ortalama (ve Instagram insights'ı) için son 12 gönderi
// Gönderi listesi sayfa boyu ve en çok sayfa: Instagram ve YouTube 4 × 50, TikTok 5 × 20 (TikTok'ta sayfa en çok 20)
const IG_PAGE = 50, IG_PAGES = 4, TT_PAGE = 20, TT_PAGES = 5, YT_PAGE = 50, YT_PAGES = 4;
// Gönderi başına kitle: senkron başına en çok bu kadar YouTube videosu (en yeni 2 + sırayla eskiler; video başına 2 rapor)
const YT_AUD_VIDEOS = 5;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/; // 32 rastgele baytın base64url'i (state ve bilet)

const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0));
const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)))].map(b => b.toString(16).padStart(2, "0")).join("");

const IG = "https://graph.instagram.com", IG_API = `${IG}/v23.0`;
const TT = "https://open.tiktokapis.com/v2", YT = "https://www.googleapis.com/youtube/v3";
const YTA = "https://youtubeanalytics.googleapis.com/v2", YT_AUDIENCE = "https://www.googleapis.com/auth/yt-analytics.readonly";

// refresh: süresi bu kadar içinde dolacak token yenilenir (Instagram 60 gün, TikTok 1 gün, YouTube 1 saat geçerli).
// LinkedIn'de refresh yok: token 60 gün geçerli, yenilenmez ve saklanmaz (yalnızca bağlanırken kimlik okunur).
const PROVIDERS = {
  instagram: {
    id: "INSTAGRAM_CLIENT_ID", secret: "INSTAGRAM_CLIENT_SECRET", refresh: "+7 days",
    authorize: "https://www.instagram.com/oauth/authorize",
    scope: "instagram_business_basic,instagram_business_manage_insights",
  },
  tiktok: {
    id: "TIKTOK_CLIENT_KEY", secret: "TIKTOK_CLIENT_SECRET", idParam: "client_key", refresh: "+10 minutes",
    authorize: "https://www.tiktok.com/v2/auth/authorize/", token: `${TT}/oauth/token/`,
    scope: "user.info.basic,user.info.profile,user.info.stats,video.list",
  },
  youtube: {
    id: "YOUTUBE_CLIENT_ID", secret: "YOUTUBE_CLIENT_SECRET", refresh: "+10 minutes", pkce: true,
    authorize: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    params: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
  },
  linkedin: {
    id: "LINKEDIN_CLIENT_ID", secret: "LINKEDIN_CLIENT_SECRET",
    authorize: "https://www.linkedin.com/oauth/v2/authorization", token: "https://www.linkedin.com/oauth/v2/accessToken",
    scope: "openid profile email",
  },
};

export class ProviderError extends Error {
  constructor(code) { super(code); this.code = String(code).slice(0, 120); }
}
// Beklenmeyen hata için güvenli log metni: ad + mesaj, tek satır, ≤160. Tırnak içindeki parçalar (ör. JSON ayrıştırma
// hatasındaki gövde kesiti) ve 24+ karakterlik token benzeri diziler maskelenir.
export const errText = e => `${e?.name || "Error"}: ${String(e?.message ?? e)}`.replace(/\s+/g, " ")
  .replace(/"[^"]*"|'[^']*'/g, "\"…\"").replace(/[A-Za-z0-9_\-.~+/=]{24,}/g, "…").slice(0, 160);

function tokenKey(env) {
  try {
    const k = unb64u(String(env?.OAUTH_TOKEN_KEY || "").trim());
    return k.length === 32 ? k : null;
  } catch { return null; }
}

export const oauthReady = (env, p) => OAUTH.includes(p) && !!env?.[PROVIDERS[p].id] && !!env?.[PROVIDERS[p].secret] && !!tokenKey(env);
const missing = e => /no such table/i.test(e?.message || ""); // migration uygulanmamış
const ACCOUNT = "SELECT id FROM social_accounts WHERE user_id = ? AND platform = ?";

export const redirectUri = (env, api, p) => `${String(env?.OAUTH_REDIRECT_BASE || api).replace(/\/+$/, "")}/oauth/${p}/callback`;

// Bağlantı durumu: no_api ("veri yok"), not_configured ("yapılandırılmadı"), available, connected, error.
// label görünen Türkçe metin; label_code panelin çevirebileceği sabit kod ("no_data", "not_configured", yoksa null).
// configured: bu rol bu platformu bağlayabilir ve secret'lar tam (METRICS_ENABLED'dan bağımsız).
// Kaynak social_accounts: "connected" (son senkron hatalıysa "error") ya da "error"; pending/revoked → available.
// Bağlı satır platform yapılandırılmamış ya da rol artık bağlayamıyor olsa da connected/error döner: kullanıcı
// bağı koparabilmeli. Bağlı LinkedIn "veri yok" etiketi taşır (metrik yok). Tablo yoksa (0001 uygulanmamış)
// bağlı satır yoktur.
export async function listConnections(env, userId, role = "influencer") {
  let rows = new Map();
  if (env?.DB) {
    try {
      const { results = [] } = await env.DB.prepare(
        "SELECT platform, handle, status, error, updated_at FROM social_accounts WHERE user_id = ? AND status IN ('connected', 'error')",
      ).bind(userId).all();
      rows = new Map(results.map(r => [r.platform, r]));
    } catch (e) {
      if (!missing(e)) throw e;
    }
  }
  return LISTED.map(p => {
    const configured = !!(CONNECTABLE[role]?.includes(p) && oauthReady(env, p));
    const row = (status, label, label_code, r = null) =>
      ({ platform: p, status, configured, handle: r?.handle ?? null, label, label_code, updated_at: r?.updated_at ?? null });
    const r = OAUTH.includes(p) ? rows.get(p) : null;
    if (r) {
      const status = r.status === "error" || r.error ? "error" : "connected";
      return SYNCED.includes(p) ? row(status, null, null, r) : row(status, NO_DATA, "no_data", r);
    }
    if (!CONNECTABLE[role]?.includes(p)) return row("no_api", NO_DATA, "no_data");
    if (!configured) return row("not_configured", NOT_CONFIGURED, "not_configured");
    return row("available", null, null);
  });
}

// challenge: PKCE S256 (RFC 7636), yalnız pkce: true olan sağlayıcıda (YouTube). TikTok'un web Login Kit'i PKCE'yi
// belgelemiyor (yalnız mobil ve masaüstü), Instagram Login de; ikisine gönderilmez.
// YT_ANALYTICS "1" ise YouTube'dan kitle raporu izni de istenir (yt-analytics.readonly). GCP'de YouTube Analytics API
// açılmadan ve izin onay ekranına eklenmeden istenirse Google bağlanan herkese uyarı gösterebilir; o yüzden bayrakla.
export function authorizeUrl(env, p, state, redirect, challenge = null) {
  const cfg = PROVIDERS[p], u = new URL(cfg.authorize);
  const scope = p === "youtube" && env?.YT_ANALYTICS === "1" ? `${cfg.scope} ${YT_AUDIENCE}` : cfg.scope;
  const q = { [cfg.idParam || "client_id"]: env[cfg.id], redirect_uri: redirect, response_type: "code", scope, state, ...cfg.params };
  if (challenge) Object.assign(q, { code_challenge: challenge, code_challenge_method: "S256" });
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
// PKCE'li sağlayıcıda code_verifier şifreli olarak state satırına yazılır, takasta (finishOAuth) gönderilir.
export async function startOAuth(env, userId, p, { api, origin, site }) {
  const state = b64u(crypto.getRandomValues(new Uint8Array(32))), redirect = redirectUri(env, api, p);
  const verifier = PROVIDERS[p].pkce ? b64u(crypto.getRandomValues(new Uint8Array(32))) : null;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM oauth_states WHERE expires_at <= datetime('now')"),
    env.DB.prepare(
      "INSERT INTO oauth_states (state_hash, user_id, platform, return_to, redirect_uri, code_verifier, expires_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))",
    ).bind(await sha256(state), userId, p, `${returnBase(env, origin, site)}/panel`, redirect,
      verifier && await encrypt(env, verifier), `+${STATE_MINUTES} minutes`),
  ]);
  return authorizeUrl(env, p, state, redirect, verifier && await pkceChallenge(verifier));
}
export const pkceChallenge = async verifier => b64u(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(verifier))));

// Bağı koparır: token silinir, hesabın ölçümleri (metric_snapshots) ve hesaptan aktarılan gönderiler (posts,
// post_snaps; elle girilenler kalır) silinir, link ölçümlerinin hesap bağı kopar, social_accounts "revoked" olur
// ve platform kimliği boşalır (hesap başka kullanıcıya bağlanabilir).
// Platform yapılandırılmamış olsa da çalışır; 0002 uygulanmamışsa (oauth_tokens yok) silinecek token yoktur,
// bağ yine koparılır; 0001 de yoksa yapılacak bir şey yoktur. Ardından sağlayıcıda izin geri alınmaya
// çalışılır (TikTok, Google); olmazsa yine de bağ kopmuştur. Instagram'ın ve LinkedIn'in iptal ucu yok, kullanıcı
// izni platformun ayarlarından kaldırır (LinkedIn token'ı zaten saklanmaz).
export async function disconnectOAuth(env, userId, p, f = fetch) {
  let row = null, tokens = true;
  try {
    row = await env.DB.prepare("SELECT access_token, refresh_token FROM oauth_tokens WHERE user_id = ? AND platform = ?").bind(userId, p).first();
  } catch (e) {
    if (!missing(e)) throw e;
    tokens = false;
  }
  // 0006 ya da 0007 uygulanmamışsa (tablo ya da sütun yok) aktarılmış gönderi de yoktur
  try {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM post_snaps WHERE post_id IN (SELECT id FROM posts WHERE account_id IN (${ACCOUNT}))`).bind(userId, p),
      env.DB.prepare(`DELETE FROM posts WHERE account_id IN (${ACCOUNT})`).bind(userId, p),
    ]);
  } catch (e) {
    if (!/no such (table|column)/i.test(e?.message || "")) throw e;
  }
  try {
    await env.DB.batch([
      ...(tokens ? [env.DB.prepare("DELETE FROM oauth_tokens WHERE user_id = ? AND platform = ?").bind(userId, p)] : []),
      env.DB.prepare(`DELETE FROM metric_snapshots WHERE account_id IN (${ACCOUNT})`).bind(userId, p),
      env.DB.prepare(`UPDATE link_snapshots SET account_id = NULL WHERE account_id IN (${ACCOUNT})`).bind(userId, p),
      env.DB.prepare("UPDATE social_accounts SET status = 'revoked', external_id = NULL, error = NULL, updated_at = datetime('now') WHERE user_id = ? AND platform = ?")
        .bind(userId, p),
    ]);
  } catch (e) {
    if (tokens || !missing(e)) throw e;
    return;
  }
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
// Sayfalı liste: get(imleç) → {items, next}. İlk sayfanın hatası yukarı çıkar; sonraki sayfa hata verirse o ana kadar
// gelenler kalır. En çok `max` sayfa; aynı kimlik bir kez (sayfalar arasında kayan liste), kimliksiz öğe elenmez.
async function paged(get, max, id) {
  const out = [], seen = new Set();
  let page = await get(null);
  for (let n = 1; ; n++) {
    for (const x of Array.isArray(page?.items) ? page.items : []) {
      const k = x && id(x);
      if (x && !seen.has(k)) { if (k != null) seen.add(k); out.push(x); }
    }
    if (n >= max || !page?.next) return out;
    page = await get(page.next).catch(() => null);
    if (!page) return out;
  }
}

// Dönüş: {access_token, refresh_token, expires_in, scope}. verifier: PKCE code_verifier (yalnız YouTube).
export async function exchangeCode(env, p, code, redirect, f = fetch, verifier = null) {
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
  const b = await json(f, cfg.token, form({
    [cfg.idParam || "client_id"]: id, client_secret: secret, grant_type: "authorization_code", redirect_uri: redirect, code,
    ...(verifier ? { code_verifier: verifier } : {}),
  }));
  if (!b.access_token) throw new ProviderError("token");
  return { access_token: b.access_token, refresh_token: b.refresh_token ?? null, expires_in: b.expires_in, scope: b.scope ?? cfg.scope };
}

export async function refreshToken(env, p, { access_token, refresh_token }, f = fetch) {
  const cfg = PROVIDERS[p];
  if (!cfg.refresh) throw new ProviderError("no_refresh");
  if (p === "instagram") {
    const b = await json(f, `${IG}/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token })}`);
    return { access_token: b.access_token, refresh_token: null, expires_in: b.expires_in };
  }
  if (!refresh_token) throw new ProviderError("no_refresh_token");
  const b = await json(f, cfg.token, form({ [cfg.idParam || "client_id"]: env[cfg.id], client_secret: env[cfg.secret], grant_type: "refresh_token", refresh_token }));
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

// Kitle dağılımı: [[değer, yüzde]] (bir ondalık); yaş ve cinsiyet sabit sırayla, ülke ve şehir en büyük AUD_TOP.
// Bilinmeyen yaş/cinsiyet değeri, boş anahtar ve 0 ya da sayı olmayan değer atılır.
const AGES = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"], GENDERS = ["F", "M", "U"], AUD_TOP = 10;
const sumOf = pairs => pairs.reduce((a, [, v]) => a + (num(v) || 0), 0);
// total: yüzdenin paydası, kırılımın kendi toplamından büyükse (yalnız ilk 45 değeri gelen ülke ve şehirde bütün kitle)
function shares(pairs, { order = null, total = 0 } = {}) {
  const by = new Map();
  for (const [k, v] of pairs) {
    const key = typeof k === "string" ? k.trim().slice(0, 80) : "", n = num(v);
    if (key && n) by.set(key, (by.get(key) || 0) + n);
  }
  const base = Math.max(sumOf([...by]), total);
  const list = order ? order.filter(k => by.has(k)).map(k => [k, by.get(k)]) : [...by].sort((a, b) => b[1] - a[1]).slice(0, AUD_TOP);
  return base ? list.map(([k, v]) => [k, Math.round((v / base) * 1000) / 10]) : [];
}
// Boş kırılımlar atılır; hiçbiri yoksa null
const section = s => {
  const o = Object.fromEntries(Object.entries(s).filter(([, l]) => l.length));
  return Object.keys(o).length ? o : null;
};
// Instagram kırılımı: data[0].total_value.breakdowns[0].results[{dimension_values, value}]. dimension_keys başta
// "timeframe" taşıyabilir: kırılımın kendi sırası alınır, bulunamazsa son değer.
function igBreakdown(b, key) {
  const br = b?.data?.[0]?.total_value?.breakdowns?.[0];
  const i = Array.isArray(br?.dimension_keys) ? br.dimension_keys.indexOf(key) : -1;
  return (Array.isArray(br?.results) ? br.results : []).map(r => {
    const d = Array.isArray(r?.dimension_values) ? r.dimension_values : [];
    return [d[i >= 0 ? i : d.length - 1], r?.value];
  });
}
// YouTube Analytics raporu: satırlar columnHeaders adlarıyla nesneye çevrilir
function ytRows(b) {
  const names = (Array.isArray(b?.columnHeaders) ? b.columnHeaders : []).map(c => c?.name);
  return (Array.isArray(b?.rows) ? b.rows : []).filter(Array.isArray).map(r => Object.fromEntries(names.map((n, i) => [n, r[i]])));
}
const YT_GENDER = { female: "F", male: "M", user_specified: "U" };
// YouTube Analytics raporu. Alınamazsa nedeni ayrılır (panel ne yapılacağını yazar): no_scope (bağlantıda izin yok:
// Google onay ekranında YouTube Analytics kutusu işaretlenmemiş), api_off (GCP projesinde API kapalı), error (diğer).
// Hata atmaz: {rows} ya da {reason, status}.
async function ytReport(f, token, q) {
  const res = await f(`${YTA}/reports?${new URLSearchParams(q)}`, bearer(token)).catch(() => null);
  const body = res ? await res.json().catch(() => null) : null;
  if (res?.ok && body && !body.error) return { rows: ytRows(body) };
  const e = body?.error && typeof body.error === "object" ? body.error : {};
  const why = [...(Array.isArray(e.errors) ? e.errors : []), ...(Array.isArray(e.details) ? e.details : [])].map(x => x?.reason);
  const reason = why.includes("insufficientPermissions") || why.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT")
    || (res?.status === 403 && /insufficient authentication scopes/i.test(String(e.message ?? ""))) ? "no_scope"
    : why.includes("accessNotConfigured") || why.includes("SERVICE_DISABLED") ? "api_off" : "error";
  return { reason, status: res?.status ?? 0 };
}
// İzleyici kırılımı: yaş ve cinsiyet yüzdesi (YouTube yalnız oturum açmış izleyicileri sayar) ve ülkeye göre izlenme payı
// (bilinmeyen ZZ paydada kalır, listede yok); boşsa null
function ytViewers(demo, geo) {
  const age = demo.map(r => [typeof r.ageGroup === "string" ? r.ageGroup.replace(/^age/, "").replace(/-$/, "+") : null, r.viewerPercentage]);
  const views = geo.map(r => [r.country, r.views]);
  return section({
    age: shares(age, { order: AGES }), gender: shares(demo.map(r => [YT_GENDER[r.gender], r.viewerPercentage]), { order: GENDERS }),
    country: shares(views.filter(([c]) => c !== "ZZ"), { total: sumOf(views) }),
  });
}

// Aktarılan gönderi: platform.js postIn kurallarıyla aynı (platform.js bu dosyayı içe aktardığı için kopya).
// Bağlantı https ve platformun kendi adresi (YouTube'da yalnız watch?v=<kimlik>), tarih YYYY-MM-DD, kapak https
// (ilk uygun aday), metin en çok 2200, ölçüm 0+ tam sayı.
// Bağlantısı, tarihi ya da hiç ölçümü olmayan gönderi aktarılmaz (ortalamaya yine girer).
const MAX_POSTS = 1000; // platform.js ile aynı: kullanıcı başına gönderi sınırı
const POST_URL = {
  instagram: /^https:\/\/(www\.)?instagram\.com\/[^\s"'<>]+$/,
  tiktok: /^https:\/\/(www\.)?tiktok\.com\/[^\s"'<>]+$/,
  youtube: /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{1,64}$/,
};
const okThumb = s => typeof s === "string" && /^https:\/\/[^\s"'<>]{4,2000}$/.test(s);
const whole = v => { const n = num(v); return n !== null && Number.isInteger(n) && n < 1e12 ? n : null; };
function toPost(p, { url, date, type, caption, thumbs, likes, comments, views, reach = null }) {
  if (typeof url !== "string" || url.length > 2000 || !POST_URL[p].test(url) || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const post = {
    url, type, date, caption: typeof caption === "string" ? caption.slice(0, 2200) : "", thumb: thumbs.find(okThumb) || "",
    likes: whole(likes), comments: whole(comments), views: whole(views), reach: whole(reach),
  };
  return (post.likes ?? post.comments ?? post.views ?? post.reach ?? null) === null ? null : post;
}
const IG_TYPE = { IMAGE: "photo", VIDEO: "video", CAROUSEL_ALBUM: "carousel" };
function igPost(m, ins) {
  return toPost("instagram", {
    url: typeof m.permalink === "string" ? m.permalink.trim() : "", date: typeof m.timestamp === "string" ? m.timestamp.slice(0, 10) : "",
    type: m.media_product_type === "REELS" ? "reel" : m.media_product_type === "STORY" ? "story" : IG_TYPE[m.media_type] || "photo",
    // Videoda media_url videonun kendisi, kapak thumbnail_url; fotoğraf ve albümde kapak media_url
    caption: m.caption, thumbs: [m.thumbnail_url, m.media_type === "VIDEO" ? null : m.media_url],
    likes: m.like_count, comments: m.comments_count, views: ins.views, reach: ins.reach,
  });
}
// TikTok paylaşım bağlantısının sorgusu (izleme parametreleri) atılır. Kapak adresi ~6 saat geçerli: günlük senkronda
// tazelenir, arada süresi dolunca panel kapak yerine kutu gösterir (son videolardan çıkan videonun kapağı tazelenmez)
function ttPost(v) {
  let url = "";
  try { const u = new URL(v.share_url); url = u.origin + u.pathname; } catch {}
  const at = num(v.create_time), d = at ? new Date(at * 1000) : null;
  return toPost("tiktok", {
    url, date: d && Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : "", type: "video",
    caption: v.video_description || v.title, thumbs: [v.cover_image_url], likes: v.like_count, comments: v.comment_count, views: v.view_count,
  });
}
function ytPost(v) {
  const s = v.snippet || {}, th = s.thumbnails || {}, st = v.statistics || {};
  return toPost("youtube", {
    url: typeof v.id === "string" ? `https://www.youtube.com/watch?v=${v.id}` : "", date: typeof s.publishedAt === "string" ? s.publishedAt.slice(0, 10) : "",
    type: "video", caption: s.title, thumbs: [th.medium?.url, th.high?.url, th.default?.url],
    likes: st.likeCount, comments: st.commentCount, views: st.viewCount,
  });
}

// Her sağlayıcı: profile → {external_id, handle, followers, ...}; recent → [{views, likes, comments, post?}]
const API = {
  instagram: {
    async profile(token, f) {
      const me = await json(f, igUrl("me", { fields: "user_id,username,followers_count", access_token: token }));
      return { external_id: me.user_id ?? me.id, handle: me.username, followers: me.followers_count };
    },
    async recent(token, f) {
      const base = "id,like_count,comments_count,permalink,timestamp,media_type,media_product_type,caption,media_url,thumbnail_url";
      let fields = `${base},is_comment_enabled`;
      const page = (list, after) => json(f, igUrl("me/media", { fields: list, limit: IG_PAGE, ...(after ? { after } : {}), access_token: token }));
      // Sonraki sayfa imleçle kendi adresimizden istenir (paging.next adresi açılmaz). is_comment_enabled reddedilirse (400)
      // liste onsuz istenir (sonraki sayfalar da); o zaman yorum sayısı geldiği gibi kalır.
      const items = await paged(async after => {
        const b = await page(fields, after).catch(e => {
          if (after || fields === base || !(e instanceof ProviderError && e.code.startsWith("400:"))) throw e;
          fields = base;
          return page(fields, after);
        });
        const next = b.paging?.next && b.paging?.cursors?.after;
        return { items: b.data, next: typeof next === "string" && next ? next : null };
      }, IG_PAGES, m => m.id);
      // İzlenme ve erişim yalnızca gönderi insights'ında (son SAMPLE gönderi); alınamayan gönderi (eski, reklam vb.)
      // ortalamaya girmez
      const ins = await Promise.all(items.slice(0, SAMPLE).map(m => json(f, igUrl(`${m.id}/insights`, { metric: "views,reach", access_token: token }))
        .then(b => Object.fromEntries((Array.isArray(b.data) ? b.data : []).map(d => [d?.name, d?.total_value?.value ?? d?.values?.[0]?.value ?? null])),
          () => ({}))));
      // Olamayacak 0 ölçülmemiş sayılır (null): yorumları kapalı gönderinin 0 yorumu ve erişimi olan gönderinin 0 izlenmesi
      // (Instagram eski gönderilerde izlenmeyi 0 döner; erişilen her hesap gönderiyi en az bir kez görmüştür)
      return items.map((m, i) => {
        const mm = m.is_comment_enabled === false && num(m.comments_count) === 0 ? { ...m, comments_count: null } : m;
        const n = ins[i] || {}, it = num(n.views) === 0 && num(n.reach) > 0 ? { ...n, views: null } : n;
        return { views: it.views ?? null, likes: mm.like_count, comments: mm.comments_count, post: igPost(mm, it) };
      });
    },
    // Kitle: takipçiler (follower_demographics) ve bu ay etkileşenler (engaged_audience_demographics), kırılım
    // başına bir çağrı (Instagram tek kırılım kabul eder, timeframe zorunlu). 100'den az takipçide ya da etkileşimde
    // Instagram boş döner; hata da boş sayılır. Ülke ve şehrin yalnız ilk 45 değeri gelir: payda cinsiyet toplamı.
    async audience(token, f) {
      const get = (metric, breakdown) => json(f, igUrl("me/insights", {
        metric, period: "lifetime", timeframe: "this_month", metric_type: "total_value", breakdown, access_token: token,
      })).then(b => igBreakdown(b, breakdown), () => []);
      const one = async metric => {
        const [age, gender, country, city] = await Promise.all(["age", "gender", "country", "city"].map(k => get(metric, k)));
        const total = sumOf(gender);
        return section({ age: shares(age, { order: AGES }), gender: shares(gender, { order: GENDERS }), country: shares(country, { total }), city: shares(city, { total }) });
      };
      const [followers, engaged] = await Promise.all([one("follower_demographics"), one("engaged_audience_demographics")]);
      return followers || engaged ? { followers, engaged } : null;
    },
  },
  tiktok: {
    async profile(token, f) {
      const b = await json(f, `${TT}/user/info/?fields=open_id,username,display_name,follower_count`, bearer(token));
      const u = b.data?.user || {};
      return { external_id: u.open_id, handle: u.username || u.display_name, followers: u.follower_count };
    },
    async recent(token, f) {
      const fields = "id,create_time,share_url,cover_image_url,title,video_description,view_count,like_count,comment_count";
      const vs = await paged(async cursor => {
        const b = await json(f, `${TT}/video/list/?fields=${fields}`, {
          method: "POST", headers: { ...bearer(token).headers, "content-type": "application/json" },
          body: JSON.stringify(cursor === null ? { max_count: TT_PAGE } : { max_count: TT_PAGE, cursor }),
        });
        return { items: b.data?.videos, next: b.data?.has_more && Number.isFinite(b.data?.cursor) ? b.data.cursor : null };
      }, TT_PAGES, v => v.id);
      return vs.map(v => ({ views: v.view_count, likes: v.like_count, comments: v.comment_count, post: ttPost(v) }));
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
        since: typeof ch.snippet?.publishedAt === "string" ? ch.snippet.publishedAt.slice(0, 10) : null,
      };
    },
    async recent(token, f, prof) {
      if (!prof.uploads) return [];
      // Videosu olmayan kanalda yükleme listesi 404 dönebilir. fields yalnız kullanılan alanları ister (yanıt küçük kalır;
      // alan adları YouTube şemasında olmalı, yoksa istek 400 döner).
      const pf = encodeURIComponent("nextPageToken,items/contentDetails/videoId");
      const ids = await paged(async pageToken => {
        const b = await json(f, `${YT}/playlistItems?part=contentDetails&maxResults=${YT_PAGE}&fields=${pf}&playlistId=${encodeURIComponent(prof.uploads)}`
          + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""), bearer(token));
        const next = b.nextPageToken;
        return {
          items: (Array.isArray(b.items) ? b.items : []).map(i => i?.contentDetails?.videoId).filter(v => typeof v === "string" && v),
          next: typeof next === "string" && next ? next : null,
        };
      }, YT_PAGES, v => v).catch(() => []);
      if (!ids.length) return [];
      // Videolar 50'şer (videos.list sınırı); ilk parçanın hatası yukarı çıkar, sonrakiler gelmezse eksik kalır
      const vf = encodeURIComponent("items(id,snippet(publishedAt,title,thumbnails),statistics(viewCount,likeCount,commentCount),status(privacyStatus,uploadStatus))");
      const parts = await Promise.all(Array.from({ length: Math.ceil(ids.length / YT_PAGE) }, (_, k) => {
        const q = json(f, `${YT}/videos?part=snippet,statistics,status&fields=${vf}&id=${ids.slice(k * YT_PAGE, (k + 1) * YT_PAGE).map(encodeURIComponent).join(",")}`, bearer(token));
        return k ? q.catch(() => ({ items: [] })) : q;
      }));
      const by = new Map(parts.flatMap(b => Array.isArray(b.items) ? b.items : []).filter(v => v && typeof v.id === "string").map(v => [v.id, v]));
      // Yükleme listesi sırasıyla (en yeni önce). Özel video ve izlenemeyen video (reddedilmiş, yüklemesi başarısız,
      // silinmiş) ortalamaya girer ama gönderi olarak aktarılmaz (TikTok da yalnız herkese açık videoları döner)
      return ids.map(id => by.get(id)).filter(Boolean).map(v => {
        const s = v.statistics || {};
        const hidden = v.status?.privacyStatus === "private" || ["rejected", "failed", "deleted"].includes(v.status?.uploadStatus);
        return { id: v.id, views: s.viewCount, likes: s.likeCount, comments: s.commentCount, post: hidden ? null : ytPost(v) };
      });
    },
    // Kitle (dünden geriye 90 gün): izleyici kırılımı (ytViewers). Şehir raporu okunur ad vermez, alınmaz. Rapor
    // alınamazsa {reason} (ytReport). Küçük kanalda 90 günün yaş ve cinsiyeti YouTube'un gizlilik eşiğinin altında kalıp
    // boş gelir: o zaman kanalın açıldığı günden (yoksa en eski videodan) düne bakılır, gelirse {viewers, range: "all"}.
    // Yine boşsa {reason: "few", views}: aynı aralığın toplam izlenmesi (0 ise YouTube Analytics bu kanalda henüz izlenme
    // görmüyor, 0'dan büyükse kırılım eşiğin altında; alınamazsa null); panel nedeni yazar. Gönderi başına kitle: her
    // senkronda en yeni 2 video ve sırayla eskiler (en çok YT_AUD_VIDEOS, ~20 günde 60 video), yayın gününden düne; veri
    // gelirse o videonun post.audience alanına yazılır (D1'de kalır).
    async audience(token, f, prof, items = []) {
      const day = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10), endDate = day(1), from = day(91);
      // Rapor alınamazsa ve gelen de boşsa alınamayanın {reason}'ı; biri alınamazsa gelenle sürer (partial): kanal
      // yarım kırılımı gösterir, gönderiye yazılmaz (D1'deki tam kitle kalır)
      const viewers = async q => {
        const [demo, geo] = await Promise.all([
          ytReport(f, token, { ids: "channel==MINE", endDate, ...q, dimensions: "ageGroup,gender", metrics: "viewerPercentage" }),
          ytReport(f, token, { ids: "channel==MINE", endDate, ...q, dimensions: "country", metrics: "views" }),
        ]);
        const v = ytViewers(demo.rows || [], geo.rows || []), bad = demo.reason ? demo : geo.reason ? geo : null;
        return bad && !v ? bad : { viewers: v, partial: !!bad };
      };
      let ch = await viewers({ startDate: from }), range = null;
      if (ch.reason) {
        console.log("yt audience", ch.reason, ch.status);
        return { reason: ch.reason };
      }
      const first = prof?.since || items.map(x => x.post?.date).filter(Boolean).sort()[0];
      const start = first && first < from ? first : from;
      if (!(ch.viewers?.age || ch.viewers?.gender) && start < from) {
        const all = await viewers({ startDate: start });
        if (all.viewers && (all.viewers.age || all.viewers.gender || !ch.viewers)) [ch, range] = [all, "all"];
      }
      const vids = items.filter(x => typeof x.id === "string" && x.post && num(x.views) > 0 && x.post.date <= endDate);
      const old = vids.slice(2), k = old.length ? (Math.floor(Date.now() / 864e5) * 3) % old.length : 0;
      await Promise.all([...vids.slice(0, 2), ...old.slice(k), ...old.slice(0, k)].slice(0, YT_AUD_VIDEOS).map(async x => {
        const r = await viewers({ startDate: x.post.date, filters: `video==${x.id}` });
        if (r.viewers && !r.partial) x.post.audience = { viewers: r.viewers };
      }));
      if (ch.viewers) return range ? { viewers: ch.viewers, range } : { viewers: ch.viewers };
      const tot = await ytReport(f, token, { ids: "channel==MINE", startDate: start, endDate, metrics: "views" });
      return { reason: "few", views: tot.rows ? num(tot.rows[0]?.views) ?? 0 : null };
    },
  },
  // OpenID Connect userinfo: sub uygulamaya özel kalıcı kimlik; ad görünen ad olur. Metrik yok (Community Management).
  linkedin: {
    async profile(token, f) {
      const u = await json(f, "https://api.linkedin.com/v2/userinfo", bearer(token));
      return { external_id: u.sub, handle: u.name || [u.given_name, u.family_name].filter(v => typeof v === "string").join(" "), followers: null };
    },
  },
};

// Görünen ad: kontrol, satır/paragraf ayırıcı ve biçim karakterleri silinir (ZWNJ/ZWJ kalır, emoji bozulmasın),
// en çok 60 kod noktası; boşsa null.
export const cleanHandle = v => [...(typeof v === "string" ? v : "").replace(/[\p{Cc}\p{Zl}\p{Zp}]|(?![\u200c\u200d])\p{Cf}/gu, "").trim()]
  .slice(0, 60).join("").trim() || null;
// Platform kimliği: yalnız metin ya da sayı, boş değil, en çok 128 karakter; değilse "no_id".
const extId = v => {
  const id = typeof v === "string" || (typeof v === "number" && Number.isFinite(v)) ? String(v).trim() : "";
  if (!id || id.length > 128) throw new ProviderError("no_id");
  return id;
};

export async function fetchProfile(p, token, f = fetch) {
  const pr = await API[p].profile(token, f);
  return { external_id: extId(pr.external_id), handle: cleanHandle(pr.handle), followers: num(pr.followers) };
}

// Takipçi + son SAMPLE gönderinin ortalama izlenme, beğeni ve yorumu; posts: aktarılacak gönderiler (en yeni önce),
// posts_recent: bunlardan kaçı son SAMPLE gönderiden (posts'un ilk posts_recent kadarı); audience: kitle dağılımı
// (Instagram ve YouTube), alınamazsa null (YouTube'da nedeniyle {reason}); ölçümü bozmaz. YouTube'da bazı gönderiler
// audience taşır (gönderi başına kitle).
export async function fetchMetrics(p, token, f = fetch) {
  if (!SYNCED.includes(p)) throw new ProviderError("no_api");
  const pr = await API[p].profile(token, f);
  const all = await API[p].recent(token, f, pr), last = all.slice(0, SAMPLE);
  const audience = API[p].audience ? await API[p].audience(token, f, pr, all).catch(() => null) : null;
  return {
    external_id: extId(pr.external_id), handle: cleanHandle(pr.handle), followers: num(pr.followers),
    avg_views: avg(last.map(x => x.views)), avg_likes: avg(last.map(x => x.likes)), avg_comments: avg(last.map(x => x.comments)),
    posts_sampled: last.length, posts: all.map(x => x.post).filter(Boolean), posts_recent: last.filter(x => x.post).length, audience,
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
// Sonuç social_accounts'a yazılır (hata kodu ya da güncel kullanıcı adı); ölçümleri syncDue metric_snapshots'a
// yazar.
// Okuma ile yazma arasında hesap yeniden bağlanabilir ya da token başka bir senkronla yenilenebilir. Yazımlar
// okunan token'a ve platform kimliğine bağlı (karşılaştır-yaz): eski hesabın token'ı ya da kullanıcı adı yenisinin
// üstüne yazılmaz. Hata yazımı da o an geçerli token'a bağlı: başka bir senkron token'ı yenilediyse ya da hesap
// koparılıp yeniden bağlandıysa eski token'ın hatası yeni bağa düşmez. Böyle bir çakışmada (bağ koparılması dahil)
// "changed" atılır, hesaba hata yazılmaz; çağıran bu ölçümleri kaydetmez.
// Sağlayıcı bu token için kayıtlı external_id'den farklı bir kimlik döndürürse bu bir yarış değil, kalıcı bir
// uyuşmazlıktır: art arda CHANGE_LIMIT. seferde hesap 'error' olur ("account_changed"), saatlik deneme durur.
// Ondan önceki seferler "changed" atar (~1 saat sonra yeniden). Başarılı senkron ve yeniden bağlama sayacı sıfırlar.
export const CHANGE_LIMIT = 3;
export async function syncAccount(env, userId, p, f = fetch) {
  if (!SYNCED.includes(p)) throw new ProviderError("no_api");
  if (!oauthReady(env, p)) throw new ProviderError("not_configured");
  const row = await env.DB.prepare(
    `SELECT t.access_token, t.refresh_token, (t.expires_at IS NOT NULL AND t.expires_at <= datetime('now', ?)) AS stale, a.external_id
     FROM oauth_tokens t JOIN social_accounts a ON a.user_id = t.user_id AND a.platform = t.platform AND a.status = 'connected'
     WHERE t.user_id = ? AND t.platform = ?`,
  ).bind(PROVIDERS[p].refresh, userId, p).first();
  if (!row) throw new ProviderError("not_connected");
  let cur = row.access_token;
  const mark = (error, handle = null) => env.DB.prepare(
    `UPDATE social_accounts SET error = ?, handle = COALESCE(?, handle), updated_at = datetime('now'),
       sync_changes = CASE WHEN ? IS NULL THEN 0 ELSE sync_changes END
     WHERE user_id = ? AND platform = ? AND status = 'connected' AND external_id = ?
       AND EXISTS (SELECT 1 FROM oauth_tokens WHERE user_id = ? AND platform = ? AND access_token = ?)`,
  ).bind(error, handle, error, userId, p, row.external_id, userId, p, cur).run();
  // Kalıcı kimlik uyuşmazlığını say; aynı bağ ve aynı token'a bağlı (yarışta 0 satır: sayılmaz, "changed")
  const mismatch = async () => {
    const r = await env.DB.prepare(
      `UPDATE social_accounts SET sync_changes = sync_changes + 1, updated_at = datetime('now'),
         status = CASE WHEN sync_changes + 1 >= ? THEN 'error' ELSE status END,
         error = CASE WHEN sync_changes + 1 >= ? THEN 'account_changed' ELSE error END
       WHERE user_id = ? AND platform = ? AND status = 'connected' AND external_id = ?
         AND EXISTS (SELECT 1 FROM oauth_tokens WHERE user_id = ? AND platform = ? AND access_token = ?)
       RETURNING status`,
    ).bind(CHANGE_LIMIT, CHANGE_LIMIT, userId, p, row.external_id, userId, p, cur).first();
    return r?.status === "error" ? "account_changed" : "changed";
  };
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
    if (m.external_id !== row.external_id) throw new ProviderError(await mismatch());
    if (!(await mark(null, m.handle)).meta?.changes) throw new ProviderError("changed");
    return m;
  } catch (e) {
    if (e instanceof ProviderError && (e.code === "changed" || e.code === "account_changed")) throw e;
    if (!(await mark(e instanceof ProviderError ? e.code : "sync")).meta?.changes) throw new ProviderError("changed");
    throw e;
  }
}

// Günlük senkron (cron, src/index.js): bağlı hesaplar günde bir senkronlanır, ölçümler metric_snapshots'a yazılır.
// Ücretsiz planda çağrı başına 50 dış istek ve 50 D1 sorgusu var: bir çalıştırmada en fazla `max` hesap,
// sağlayıcı çağrılarının tahmini toplamı (COST, yenileme dahil) en fazla `budget` ve D1 ifadeleri (vade listesi,
// alınan hesap başına en kötü SYNC_D1, kirası başkasında olan hesap başına 1) en fazla `d1`. Sığmayanlar sonraki saate kalır.
// Kira: hesap 15 dakikalığına alınır (next_sync_at), aynı anda tek senkron olur ve iki senkron aynı refresh token'ı
// harcamaz. Ölçüm yalnızca kira hâlâ bizdeyse, hesap bağlıysa ve platform kimliği aynıysa yazılır; hesap yeniden
// bağlanınca kira düşer (finishOAuth next_sync_at'i NULL yapar), eski hesabın ölçümü yeni hesaba yazılmaz.
// POSTS_ENABLED "1" ise gönderiler (fetchMetrics posts) aynı koşullarla ve aynı batch'te posts/post_snaps'e yazılır.
// En kötü durumda istek sayısı: profil + gönderi sayfaları + yenileme. Instagram: 4 sayfa + alan reddinde tekrar + son 12
// gönderinin insights'ı + 8 kitle kırılımı; TikTok: 5 sayfa; YouTube: 4 liste sayfası + 4 video parçası + 2 kitle raporu
// + kanalın tüm zamanı için 2 kitle raporu + toplam izlenme + YT_AUD_VIDEOS videonun 2'şer kitle raporu.
const COST = { instagram: 27, tiktok: 7, youtube: 15 + 2 * YT_AUD_VIDEOS };
const NEXT = { ok: "+1435 minutes", fail: "+355 minutes", changed: "+55 minutes" }; // saatlik cron'da ~1 gün, ~6 saat, ~1 saat
export const SYNC_MIN = Math.min(...Object.values(COST));
export const SYNC_D1 = 8; // kira, token, yenileme, son senkron işareti, ölçüm + gönderiler + gönderi ölçümleri + kira bırakma (batch)
export async function syncDue(env, f = fetch, { budget = 40, max = 5, d1 = 50 } = {}) {
  const out = { synced: 0, failed: 0, changed: 0, busy: 0, deferred: 0 };
  const ready = SYNCED.filter(p => oauthReady(env, p));
  if (!ready.length || budget < SYNC_MIN || max < 1 || d1 < 1 + SYNC_D1) return out;
  const { results = [] } = await env.DB.prepare(
    `SELECT id, user_id, platform FROM social_accounts
     WHERE status = 'connected' AND external_id IS NOT NULL AND platform IN (${ready.map(() => "?").join(", ")})
       AND (next_sync_at IS NULL OR next_sync_at <= datetime('now'))
     ORDER BY next_sync_at IS NOT NULL, next_sync_at, id LIMIT 20`,
  ).bind(...ready).all();
  let spent = 0, picked = 0, used = 1;
  for (const a of results) {
    if (!Number.isFinite(COST[a.platform]) || picked >= max || spent + COST[a.platform] > budget || used + SYNC_D1 > d1) { out.deferred++; continue; }
    used++;
    try {
      const lease = await env.DB.prepare(
        `UPDATE social_accounts SET next_sync_at = datetime('now', '+15 minutes')
         WHERE id = ? AND status = 'connected' AND (next_sync_at IS NULL OR next_sync_at <= datetime('now')) RETURNING next_sync_at`,
      ).bind(a.id).first();
      if (!lease) { out.busy++; continue; }
      spent += COST[a.platform];
      used += SYNC_D1 - 1;
      picked++;
      const release = next => env.DB.prepare("UPDATE social_accounts SET next_sync_at = datetime('now', ?) WHERE id = ? AND next_sync_at = ?")
        .bind(next, a.id, lease.next_sync_at);
      let m;
      try {
        m = await syncAccount(env, a.user_id, a.platform, f);
      } catch (e) {
        const changed = e instanceof ProviderError && e.code === "changed";
        out[changed ? "changed" : "failed"]++;
        console.log("sync", a.platform, e instanceof ProviderError ? e.code : "error");
        await release(changed ? NEXT.changed : NEXT.fail).run();
        continue;
      }
      // Gönderiler tek JSON parametresiyle (D1'de sorgu başına en çok 100 parametre). Bu hesaptan aktarılmış gönderinin
      // türü, metni ve kapağı değiştiyse tazelenir (Instagram ve TikTok kapak adresleri süreli); elle girilmiş aynı bağlantıya
      // dokunulmaz. Kullanıcının MAX_POSTS gönderisi varsa yenisi eklenmez (sınır sorgu başında sayılır: bir senkron aşabilir).
      // Kitle (audience, yalnız YouTube'da ve her senkronda birkaç videoda gelir) gelmezse eskisi kalır.
      // Ölçüm son SAMPLE gönderide günde bir (aynı gün tekrar senkronlanırsa üzerine yazılır), daha eskilerde haftada bir.
      // Gelmeyen izlenme ve erişim (Instagram insights'ı yalnız son SAMPLE gönderide) son ölçülen değerle sürer.
      const own = "EXISTS (SELECT 1 FROM social_accounts WHERE id = ? AND status = 'connected' AND external_id = ? AND next_sync_at = ?)";
      const posts = env.POSTS_ENABLED === "1" && m.posts?.length ? JSON.stringify(m.posts) : null;
      const [ins] = await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO metric_snapshots (account_id, source, followers, avg_views, avg_likes, avg_comments, posts_sampled, audience)
           SELECT id, 'oauth', ?, ?, ?, ?, ?, ? FROM social_accounts
           WHERE id = ? AND status = 'connected' AND external_id = ? AND next_sync_at = ?`,
        ).bind(m.followers, m.avg_views, m.avg_likes, m.avg_comments, m.posts_sampled, m.audience ? JSON.stringify(m.audience) : null,
          a.id, m.external_id, lease.next_sync_at),
        ...(posts ? [
          env.DB.prepare(
            `INSERT INTO posts (user_id, url, platform, type, date, caption, thumb, account_id, audience)
             SELECT ?, json_extract(j.value, '$.url'), ?, json_extract(j.value, '$.type'), json_extract(j.value, '$.date'),
               json_extract(j.value, '$.caption'), json_extract(j.value, '$.thumb'), ?, json_extract(j.value, '$.audience')
             FROM json_each(?) j
             WHERE ${own} AND (SELECT COUNT(*) FROM posts WHERE user_id = ?) < ${MAX_POSTS}
             ON CONFLICT (user_id, url) DO UPDATE SET type = excluded.type, caption = excluded.caption, thumb = excluded.thumb,
               audience = COALESCE(excluded.audience, posts.audience)
               WHERE posts.account_id = excluded.account_id
                 AND (posts.type <> excluded.type OR posts.caption <> excluded.caption OR posts.thumb <> excluded.thumb
                   OR (excluded.audience IS NOT NULL AND excluded.audience IS NOT posts.audience))`,
          ).bind(a.user_id, a.platform, a.id, posts, a.id, m.external_id, lease.next_sync_at, a.user_id),
          env.DB.prepare(
            `INSERT INTO post_snaps (post_id, at, likes, comments, views, reach)
             SELECT p.id, date('now'), json_extract(j.value, '$.likes'), json_extract(j.value, '$.comments'),
               COALESCE(json_extract(j.value, '$.views'),
                 (SELECT s.views FROM post_snaps s WHERE s.post_id = p.id AND s.views IS NOT NULL ORDER BY s.at DESC LIMIT 1)),
               COALESCE(json_extract(j.value, '$.reach'),
                 (SELECT s.reach FROM post_snaps s WHERE s.post_id = p.id AND s.reach IS NOT NULL ORDER BY s.at DESC LIMIT 1))
             FROM json_each(?) j JOIN posts p ON p.user_id = ? AND p.url = json_extract(j.value, '$.url') AND p.account_id = ?
             WHERE ${own}
               AND (j.key < ? OR NOT EXISTS (SELECT 1 FROM post_snaps s WHERE s.post_id = p.id AND s.at > date('now', '-7 days')))
             ON CONFLICT (post_id, at) DO UPDATE SET likes = excluded.likes, comments = excluded.comments, views = excluded.views,
               reach = excluded.reach`,
          ).bind(posts, a.user_id, a.id, a.id, m.external_id, lease.next_sync_at, m.posts_recent),
        ] : []),
        release(NEXT.ok),
      ]);
      out[ins.meta?.changes ? "synced" : "changed"]++;
    } catch (e) {
      out.failed++;
      console.log("sync", a.platform, "db", e?.message?.slice(0, 80));
    }
  }
  if (out.deferred) console.log("sync deferred", out.deferred); // sonraki saatte
  return out;
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
// yanar ve hiçbir şey bağlanmaz (ticket_owner, 403). Platform hesabı başka kullanıcıya bağlıysa "taken".
// role verilirse bilet platformu o rolün CONNECTABLE listesinde olmalı (bilet yine yanar).
export async function finishOAuth(env, userId, ticket, f = fetch, role = null) {
  if (typeof ticket !== "string" || !TOKEN_RE.test(ticket)) throw new OAuthFail("ticket");
  const st = await env.DB.prepare(
    "DELETE FROM oauth_states WHERE ticket_hash = ? AND expires_at > datetime('now') RETURNING user_id, platform, code, redirect_uri, code_verifier",
  ).bind(await sha256(ticket)).first();
  if (!st) throw new OAuthFail("ticket");
  if (Number(st.user_id) !== Number(userId)) throw new OAuthFail("ticket_owner", 403);
  const p = st.platform;
  if (role && !CONNECTABLE[role]?.includes(p)) throw new OAuthFail("no_api", 400);
  if (!oauthReady(env, p)) throw new OAuthFail("not_configured", 409);
  try {
    const verifier = st.code_verifier ? await decrypt(env, st.code_verifier) : null;
    const t = await exchangeCode(env, p, await decrypt(env, st.code), st.redirect_uri, f, verifier);
    const prof = await fetchProfile(p, t.access_token, f);
    if (!prof.external_id) throw new ProviderError("no_id");
    const other = await env.DB.prepare("SELECT 1 FROM social_accounts WHERE platform = ? AND external_id = ? AND user_id <> ?")
      .bind(p, prof.external_id, userId).first();
    // Sağlayıcıda iptal yapılmaz: Google'da bu, hesabı bağlı tutan diğer kullanıcının iznini de kaldırır.
    if (other) throw new OAuthFail("taken", 409);
    // Upsert social_accounts.id'yi korur. Kullanıcı bu platformda başka bir hesap bağlıyorsa (ya da bağ
    // koparılmışsa) önceki hesabın ölçümleri ve ondan aktarılan gönderiler silinir, link ölçümlerinin hesap bağı
    // kopar; eski hesabın takipçisi ve gönderileri yeni hesapta görünmez. Aynı hesap yeniden bağlanırsa ölçümler
    // kalır. next_sync_at NULL: yeni bağ hemen senkronlanır, süren bir senkronun kirası düşer (syncDue ölçüm yazmaz).
    // Senkronu olmayan platformda (LinkedIn) token saklanmaz; varsa eski token satırı silinir.
    const old = `${ACCOUNT} AND (external_id IS NULL OR external_id <> ?)`;
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM post_snaps WHERE post_id IN (SELECT id FROM posts WHERE account_id IN (${old}))`).bind(userId, p, prof.external_id),
      env.DB.prepare(`DELETE FROM posts WHERE account_id IN (${old})`).bind(userId, p, prof.external_id),
      env.DB.prepare(`DELETE FROM metric_snapshots WHERE account_id IN (${old})`).bind(userId, p, prof.external_id),
      env.DB.prepare(`UPDATE link_snapshots SET account_id = NULL WHERE account_id IN (${old})`).bind(userId, p, prof.external_id),
      env.DB.prepare(
        `INSERT INTO social_accounts (user_id, platform, handle, external_id, status, connected_at, error)
         VALUES (?, ?, ?, ?, 'connected', datetime('now'), NULL)
         ON CONFLICT (user_id, platform) DO UPDATE SET handle = excluded.handle, external_id = excluded.external_id,
           status = 'connected', connected_at = excluded.connected_at, error = NULL, next_sync_at = NULL, sync_changes = 0,
           updated_at = datetime('now')`,
      ).bind(userId, p, prof.handle ?? null, prof.external_id),
      SYNCED.includes(p)
        ? env.DB.prepare(
          `INSERT INTO oauth_tokens (user_id, platform, access_token, refresh_token, expires_at, scope)
           VALUES (?, ?, ?, ?, datetime('now', ?), ?)
           ON CONFLICT (user_id, platform) DO UPDATE SET access_token = excluded.access_token, refresh_token = excluded.refresh_token,
             expires_at = excluded.expires_at, scope = excluded.scope, updated_at = datetime('now')`,
        ).bind(userId, p, await encrypt(env, t.access_token), await encrypt(env, t.refresh_token), expiry(t), t.scope ?? null)
        : env.DB.prepare("DELETE FROM oauth_tokens WHERE user_id = ? AND platform = ?").bind(userId, p),
    ]);
    return { platform: p, handle: prof.handle ?? null };
  } catch (e) {
    if (e instanceof OAuthFail) throw e;
    if (/UNIQUE/i.test(e?.message || "")) throw new OAuthFail("taken", 409); // aynı anda iki kullanıcı
    // ProviderError dışı hata (ağ, ayrıştırma, D1): mesaj tek satır, ≤160; tırnak içi ve uzun token benzeri parçalar maskelenir
    if (e instanceof ProviderError) console.log("oauth", p, e.code);
    else console.log("oauth", p, "error", errText(e));
    throw new OAuthFail("provider", 502);
  }
}
