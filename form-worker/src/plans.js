// A9b plan hakları (Desktop/app-smc/A9.md): aylık üretim sayısı ve Pexels erişimi; A13'te ÷5 (basic 8/2, pro 40/12). Sayılar
// sites/app.socialmediacorner.co/assets/plans.js (window.SMC_PLANS, Planlar sayfası) ile aynıdır; plans.test.mjs ikisini karşılaştırır.
// linkedin_blog: LinkedIn + blog taslağı (gen_month kind 'lb'); video_gorsel: video + görsel/Instagram taslağı (kind 'vg').
// Enterprise sayıları users.plan_limits JSON'undan ({"linkedin_blog":N,"video_gorsel":N}); yoksa/geçersizse pro sayıları.
// A14 cms_sites: bağlanabilecek müşteri sitesi (CMS) sayısı; enterprise plan_limits.cms_sites, yoksa 10.
// A15 demo: app.socialmediacorner.co kaydının varsayılanı (platform.js register), basic'in yarısı; users.created_at'ten
// TRIAL_DAYS gün geçerli (trialEndsAt/trialEnded). Demo hakları aylık değil, deneme boyunca TOPLAM: generate.js sayaçları
// created_at ayından bu yana gen_month satırlarını toplar (ay dönümünde sıfırlanmaz). Marka sesi kullanıcı başına tek satır (brand_voice).
export const TRIAL_DAYS = 14;
export const PLANS = Object.freeze({
  demo: Object.freeze({ linkedin_blog: 4, video_gorsel: 1, stock: false, cms_sites: 1 }),
  basic: Object.freeze({ linkedin_blog: 8, video_gorsel: 2, stock: false, cms_sites: 1 }),
  pro: Object.freeze({ linkedin_blog: 40, video_gorsel: 12, stock: true, cms_sites: 3 }),
  enterprise: Object.freeze({ linkedin_blog: null, video_gorsel: null, stock: true, cms_sites: null }),
});

// üretim platformu → aylık sayaç türü
export const MONTH_KIND = Object.freeze({ linkedin: "lb", blog: "lb", video: "vg", instagram: "vg" });
export const KIND_NAME = Object.freeze({ lb: "linkedin_blog", vg: "video_gorsel" });

// users.plan değeri; 0018 uygulanmamışsa (sütun yok) null, bilinmeyen değer basic sayılır (CHECK ALTER ile eklenemiyor)
export function planOf(user) {
  if (!user || user.plan === undefined || user.plan === null) return null;
  return Object.hasOwn(PLANS, user.plan) ? user.plan : "basic";
}

const pos = v => Number.isSafeInteger(v) && v > 0 ? v : null;

export const ENTERPRISE_CMS_SITES = 10;

// SQLite datetime('now') ("YYYY-MM-DD HH:MM:SS", UTC) ya da ISO → ms; okunamazsa null
export function parseUtc(s) {
  if (typeof s !== "string" || !s) return null;
  const t = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s.replace(" ", "T") : s.replace(" ", "T") + "Z");
  return Number.isFinite(t) ? t : null;
}

// Deneme bitişi (ISO) = created_at + TRIAL_DAYS gün; created_at okunamazsa null
export function trialEndsAt(user) {
  const t = parseUtc(user?.created_at);
  return t === null ? null : new Date(t + TRIAL_DAYS * 864e5).toISOString();
}
// Deneme bitti mi (yalnız demo planı için anlamlı); bitiş bilinmiyorsa false
export function trialEnded(user, now = Date.now()) {
  const e = trialEndsAt(user);
  return e !== null && now >= Date.parse(e);
}
// Demo sayaçlarının başladığı ay ('YYYY-MM', Europe/Istanbul sabit UTC+3, generate.js genDay ile aynı); okunamazsa null
export function trialMonth(user) {
  const t = parseUtc(user?.created_at);
  return t === null ? null : new Date(t + 3 * 3600e3).toISOString().slice(0, 7);
}

// {plan, linkedin_blog, video_gorsel, stock, cms_sites}; plan null ise null. demo'da ayrıca trial_ends_at, trial_ended.
export function planLimits(user, now = Date.now()) {
  const plan = planOf(user);
  if (!plan) return null;
  if (plan === "demo") return { plan, ...PLANS.demo, trial_ends_at: trialEndsAt(user), trial_ended: trialEnded(user, now) };
  if (plan !== "enterprise") return { plan, ...PLANS[plan] };
  let j = null;
  try { j = JSON.parse(user.plan_limits || "null"); } catch { j = null; }
  return {
    plan,
    linkedin_blog: pos(j?.linkedin_blog) ?? PLANS.pro.linkedin_blog,
    video_gorsel: pos(j?.video_gorsel) ?? PLANS.pro.video_gorsel,
    stock: true,
    cms_sites: pos(j?.cms_sites) ?? ENTERPRISE_CMS_SITES,
  };
}
