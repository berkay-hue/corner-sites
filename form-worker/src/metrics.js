// brandcorner sosyal metrikleri: takipçi, ortalama izlenme, beğeni, yorum.
// Veriler yalnızca resmi API'lerden (OAuth) gelir; kazıma ve şifre yok. Tablolar: migrations/0001_metrics.sql.
// METRICS_ENABLED = "1" değilse D1 metrik tablolarına hiç dokunulmaz; her hesap ve link için
// "örnek" etiketli, aynı girdide hep aynı çıkan uydurma sayılar döner (panel tasarımı ve demo için).

// label görünen Türkçe metin; label_code panelin çevirebileceği sabit kod: "sample" (örnek), "no_data" (veri yok),
// gerçek ölçümde null.
export const SAMPLE = "örnek", NO_DATA = "veri yok";
// Resmi API'si bağlanabilen platformlar; LinkedIn, X ve Twitch için "veri yok"
export const OFFICIAL = ["instagram", "tiktok", "youtube"];
export const metricsEnabled = env => env?.METRICS_ENABLED === "1";

// Girdiden tohumlanan sabit rastgele sayı üreteci (FNV-1a + mulberry32)
function rng(key) {
  let h = 2166136261;
  for (const ch of String(key)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (r, [lo, hi]) => lo + (hi - lo) * r();

// Takipçiye göre gönderi başı izlenme oranı (örnek mod)
const VIEW_RATE = { instagram: [0.1, 0.4], tiktok: [0.3, 1.2], youtube: [0.05, 0.3] };
const LIKE_RATE = [0.03, 0.09], COMMENT_RATE = [0.02, 0.08];
const EMPTY = { followers: null, avg_views: null, avg_likes: null, avg_comments: null };

function engagement(r, views) {
  const likes = Math.round(views * between(r, LIKE_RATE));
  return { views, likes, comments: Math.round(likes * between(r, COMMENT_RATE)) };
}

export function sampleAccount(platform, handle) {
  if (!OFFICIAL.includes(platform)) return { ...EMPTY };
  const r = rng(`acc|${platform}|${handle ?? ""}`);
  const followers = Math.round(2000 * 125 ** r()); // 2 bin – 250 bin
  const e = engagement(r, Math.round(followers * between(r, VIEW_RATE[platform])));
  return { followers, avg_views: e.views, avg_likes: e.likes, avg_comments: e.comments };
}

export function sampleLink(platform, url) {
  if (!OFFICIAL.includes(platform)) return { views: null, likes: null, comments: null };
  const r = rng(`link|${url}`);
  return engagement(r, Math.round(1000 * 200 ** r())); // 1 bin – 200 bin
}

const HOSTS = [
  ["instagram", ["instagram.com", "instagr.am"]],
  ["tiktok", ["tiktok.com"]],
  ["youtube", ["youtube.com", "youtu.be"]],
  ["linkedin", ["linkedin.com", "lnkd.in"]],
  ["x", ["x.com", "twitter.com"]],
  ["twitch", ["twitch.tv"]],
];

// İçerik linkinin platformu; tanınmayan ya da geçersiz link null
export function platformOf(url) {
  let host;
  try { host = new URL(String(url)).hostname.toLowerCase(); } catch { return null; }
  for (const [p, list] of HOSTS) if (list.some(d => host === d || host.endsWith("." + d))) return p;
  return null;
}

const account = (platform, handle, row) => {
  const real = row?.taken_at && OFFICIAL.includes(platform);
  return {
    platform, handle: handle ?? null,
    source: real ? row.source || "oauth" : "none", label: real ? null : NO_DATA, label_code: real ? null : "no_data",
    followers: real ? row.followers : null, avg_views: real ? row.avg_views : null,
    avg_likes: real ? row.avg_likes : null, avg_comments: real ? row.avg_comments : null,
    // Ortalamanın hesaplandığı gönderi sayısı; 0 ise hesapta paylaşım yok (panel "Henüz paylaşım yok" yazar)
    posts_sampled: real ? row.posts_sampled ?? null : null,
    taken_at: real ? row.taken_at : null,
  };
};

// Influencer'ın hesap metrikleri. profile.platforms: [{platform, handle, followers}] (kendi beyanı)
export async function accountMetrics(env, userId, profile) {
  const declared = Array.isArray(profile?.platforms) ? profile.platforms.filter(x => x && x.platform) : [];
  if (!metricsEnabled(env)) {
    return {
      mode: "sample", label: SAMPLE, label_code: "sample",
      accounts: declared.map(({ platform, handle }) => {
        const ok = OFFICIAL.includes(platform);
        return { platform, handle: handle ?? null, source: ok ? "sample" : "none", label: ok ? SAMPLE : NO_DATA, label_code: ok ? "sample" : "no_data", ...sampleAccount(platform, handle), taken_at: null };
      }),
    };
  }
  const { results = [] } = await env.DB.prepare(
    `SELECT a.platform, a.handle, s.taken_at, s.source, s.followers, s.avg_views, s.avg_likes, s.avg_comments, s.posts_sampled
     FROM social_accounts a
     LEFT JOIN metric_snapshots s ON s.id = (SELECT id FROM metric_snapshots WHERE account_id = a.id ORDER BY taken_at DESC, id DESC LIMIT 1)
     WHERE a.user_id = ? AND a.status = 'connected'`,
  ).bind(userId).all();
  const byPlatform = new Map(results.map(r => [r.platform, r]));
  const seen = new Set(), accounts = [];
  // Önce profildeki sırayla beyan edilenler, sonra beyan edilmemiş bağlı hesaplar; bağlı platform bir kez
  for (const { platform, handle } of [...declared, ...results]) {
    const row = byPlatform.get(platform);
    if (row && seen.has(platform)) continue;
    if (row) seen.add(platform);
    accounts.push(account(platform, row?.handle ?? handle, row));
  }
  return { mode: "live", label: null, label_code: null, accounts };
}

// İşbirliği içerik linkinin metrikleri. app: {id, content_url}
export async function linkMetrics(env, app) {
  const url = app?.content_url || null, platform = url ? platformOf(url) : null;
  const none = { url, platform, source: "none", label: NO_DATA, label_code: "no_data", views: null, likes: null, comments: null, taken_at: null };
  if (!metricsEnabled(env)) {
    if (!url || !OFFICIAL.includes(platform)) return { mode: "sample", ...none };
    return { mode: "sample", url, platform, source: "sample", label: SAMPLE, label_code: "sample", ...sampleLink(platform, url), taken_at: null };
  }
  // Resmi API'si olmayan platformun (LinkedIn, X, Twitch) linkine ölçüm yazılmaz; tabloda satır olsa da "veri yok"
  if (!url || !OFFICIAL.includes(platform)) return { mode: "live", ...none };
  const row = await env.DB.prepare(
    "SELECT url, platform, views, likes, comments, taken_at, source FROM link_snapshots WHERE application_id = ? AND url = ? ORDER BY taken_at DESC, id DESC LIMIT 1",
  ).bind(app.id, url).first();
  if (!row) return { mode: "live", ...none };
  return {
    mode: "live", url, platform: row.platform || platform, source: row.source || "oauth", label: null, label_code: null,
    views: row.views, likes: row.likes, comments: row.comments, taken_at: row.taken_at,
  };
}
