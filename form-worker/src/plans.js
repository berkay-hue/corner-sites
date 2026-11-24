// A9b plan hakları (Desktop/app-smc/A9.md): aylık üretim sayısı ve Pexels erişimi; A13'te ÷5 (basic 8/2, pro 40/12). Sayılar
// sites/app.socialmediacorner.co/assets/plans.js (window.SMC_PLANS, Planlar sayfası) ile aynıdır; plans.test.mjs ikisini karşılaştırır.
// linkedin_blog: LinkedIn + blog taslağı (gen_month kind 'lb'); video_gorsel: video + görsel/Instagram taslağı (kind 'vg').
// Enterprise sayıları users.plan_limits JSON'undan ({"linkedin_blog":N,"video_gorsel":N}); yoksa/geçersizse pro sayıları.
// A14 cms_sites: bağlanabilecek müşteri sitesi (CMS) sayısı; enterprise plan_limits.cms_sites, yoksa 10.
export const PLANS = Object.freeze({
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

// {plan, linkedin_blog, video_gorsel, stock, cms_sites}; plan null ise null
export function planLimits(user) {
  const plan = planOf(user);
  if (!plan) return null;
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
