// Hesaplı siteler (A5-1): üyelik ve panel API'sini (platform.js) kullanan her sitenin marka adı, Pages önizleme
// projesi ve sayfa yolları. Tek kaynak: şifre sıfırlama e-postası (platform.js resetMail, link) ve OAuth dönüş adresi
// (oauth.js startOAuth) buradan okur. Yollar istekten hiç alınmaz, yalnız bu sabit tablodan (açık yönlendirme yok).
// Tabloda olmayan bir AUTH_HOSTS sitesi brandcorner.co değerlerini alır (A5-1'den önceki davranış).
//
// gate: site yalnız bu ortam değişkeni açıkken hesap sitesi olur (wrangler.toml ACCOUNTS_ENABLED, A13 ile "1").
//   "1"       → canlı alan adı ve Pages önizlemesi; AUTH_HOSTS'a yazılmasa da eklenmiş sayılır.
//   "preview" → yalnız Pages önizlemesi (<dal>.web-smcapp.pages.dev); canlı alan adı 403 origin kalır.
//   başka her değer → site AUTH_HOSTS'ta yazsa da hesap sitesi değildir: 403 origin (A5-1'den önceki davranış).
// roles (A5-2w): sitenin kabul ettiği roller. Tek rol varsa kayıtta rol istemciden alınmaz, sunucu onu yazar;
//   listede olmayan roldeki kullanıcı bu sitede giriş yapamaz, oturumu 401 auth alır. Yoksa platform.js'in tüm rolleri.
// routes (A5-2w): sitede çalışan uçların izin listesi; listede olmayan uç 404 not_found döner (oturuma ve gövdeye
//   bakılmadan). Yoksa her uç açık. brandcorner.co'da ikisi de yok: A5-1'den önceki davranış.
export const DEFAULT_SITE = "brandcorner.co";

// app.socialmediacorner.co'nun uçları: yalnız hesap için gerekenler (giriş, kayıt, çıkış, ben, şifre sıfırlama,
// profil, bağlantılar, bağlama ve bağı koparma; A5-3: marka sesi, taslak geçmişi, veri dışa aktarma, hesap silme).
// Biçim "YÖNTEM /yol"; /app/* yolundaki sayısal id ":id" yazılır.
// Kampanya, başvuru, influencer arama, eşleşme, istatistik, metrics, gönderi ve bildirim uçları yok (404). Yönetim uçları (A13)
// smc'nin kendisi (src/platform.js smcAdmin*): yöneticisi olmayana yine 404; brandcorner.co'nun admin/:id/perm|posts|snap uçları yok.
export const APP_ROUTES = Object.freeze([
  "POST /auth/register", "POST /auth/login", "POST /auth/logout", "GET /auth/me", "POST /auth/forgot", "POST /auth/reset",
  "GET /app/profile", "POST /app/profile",
  "GET /app/connections", "POST /app/connect", "POST /app/connect/finish", "POST /app/disconnect",
  "GET /app/voice", "PUT /app/voice", "GET /app/drafts", "POST /app/drafts/:id/delete", "GET /app/export", "POST /app/account/delete",
  "GET /app/admin", "GET /app/admin/users", "GET /app/admin/submissions", "GET /app/admin/drafts", "GET /app/admin/jobs", "POST /app/admin/:id/plan",
  // A14 otomatik blog yazarı (src/cms.js CMS_ROUTES; CMS_ENABLED kapalı ya da 0019 yoksa 503 not_ready)
  "GET /app/cms", "GET /app/cmsposts", "POST /app/cms/probe", "POST /app/cms/connect", "POST /app/cms/:id/settings", "POST /app/cms/:id/run",
  "POST /app/cms/:id/pause", "POST /app/cms/:id/resume", "POST /app/cms/:id/disconnect", "POST /app/cmsposts/:id/retry", "POST /app/cmsoauth/start",
  "POST /app/cmsoauth/finish",
]);

export const SITES = {
  "brandcorner.co": {
    name: "Brand Corner",
    preview: "web-brandcorner",
    reset: { tr: "/sifre-yenile", en: "/reset-password" },
    back: { tr: "/panel", en: "/panel" },
  },
  "app.socialmediacorner.co": {
    name: "Social Media Corner",
    preview: "web-smcapp",
    gate: "ACCOUNTS_ENABLED",
    reset: { tr: "/hesap/sifre-yenile", en: "/en/hesap/reset-password" },
    back: { tr: "/hesap/baglantilar", en: "/en/hesap/connections" },
    roles: Object.freeze(["brand"]),
    routes: APP_ROUTES,
    // Yönetim panelinin form gönderileri listesi (src/index.js /submit site = origin alanı): pazarlama sitesi + uygulama
    submitSites: Object.freeze(["socialmediacorner.co", "app.socialmediacorner.co"]),
  },
};

export const siteConf = site => (Object.hasOwn(SITES, site) ? SITES[site] : SITES[DEFAULT_SITE]);
const byLang = (paths, lang) => paths[lang === "en" ? "en" : "tr"];
// Şifre sıfırlama sayfası ve OAuth dönüşünde açılacak sayfa (yol, "/" ile başlar)
export const resetPath = (site, lang) => byLang(siteConf(site).reset, lang);
export const backPath = (site, lang) => byLang(siteConf(site).back, lang);
// Rol kısıtı olan sitede yalnız listedeki roller; kısıtsız sitede her rol (rolün geçerliliğine platform.js bakar)
export const siteRoles = site => siteConf(site).roles || null;
export const roleAllowed = (site, role) => !siteRoles(site) || siteRoles(site).includes(role);
// key: "YÖNTEM /yol" (/app/* için id ":id"); izin listesi olmayan sitede her uç açık
export const routeAllowed = (site, key) => { const r = siteConf(site).routes; return !r || r.includes(key); };

// "on" | "preview" | "off"; kapısı olmayan site her zaman "on"
export function gateMode(env, site) {
  const gate = siteConf(site).gate;
  if (!gate) return "on";
  const v = env?.[gate];
  return v === "1" ? "on" : v === "preview" ? "preview" : "off";
}

// Canlı alan adıyla açık hesap siteleri. Sıra AUTH_HOSTS'taki gibi (hosts[0] DEV_ORIGINS'in ve web-brandcorner
// önizlemesinin sitesi); kapısı "1" olan site AUTH_HOSTS'ta yoksa sona eklenir, kapısı kapalı olan çıkarılır.
export function authHosts(env) {
  const hosts = String(env?.AUTH_HOSTS || DEFAULT_SITE).split(",").map(h => h.trim()).filter(h => h && gateMode(env, h) === "on");
  for (const d of Object.keys(SITES)) if (SITES[d].gate && gateMode(env, d) === "on" && !hosts.includes(d)) hosts.push(d);
  return hosts;
}

// Pages önizlemesi (<proje>.pages.dev ya da <dal>.<proje>.pages.dev): web-brandcorner bugünkü gibi hosts[0]'a gider;
// kapılı site kendi önizlemesinden yalnız kapısı "1" ya da "preview" iken açılır. Eşleşme yoksa null.
export function previewSite(env, hostname, hosts = authHosts(env)) {
  for (const d of Object.keys(SITES)) {
    const s = SITES[d];
    if (!new RegExp(`^(?:[a-z0-9-]+\\.)?${s.preview}\\.pages\\.dev$`).test(hostname)) continue;
    if (!s.gate) return hosts[0] || null;
    return gateMode(env, d) === "off" ? null : d;
  }
  return null;
}
