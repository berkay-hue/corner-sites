// Site başına blog ayarları. Yalnızca blogu olan siteler.
export default {
  "cornergroup.co": {
    origin: "https://cornergroup.co",
    brand: "Corner Group",
    titleSuffix: " - Corner Group",
    author: "Corner Group",
    pClass: "framer-text framer-styles-preset-s788d1",
    cardSelector: "framer-re40qv-container", // liste kartının dış kapsayıcısı
    perPage: 9,
    lang: "tr",
    variants: { en: { lang: "en", dateLocale: "en-US", prefix: "/en" } },
    // /en/ sayfalarındaki TR/EN anahtarıyla (cg-lang) aynı görünüm
    langCss: `<style data-sk-lang>.sk-lang{position:fixed;left:16px;bottom:16px;z-index:50;display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid rgba(255,255,255,0.1);background:rgba(10,10,10,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:8px;font:600 11px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.04em}.sk-lang a,.sk-lang span{display:block;color:#999;text-decoration:none;padding:6px 7px;border-radius:6px;transition:color .15s,background .15s}.sk-lang a:hover{color:#fff}.sk-lang [aria-current]{background:#FFB71B;color:#000}</style>`,
  },
  "saascorner.co": {
    origin: "https://saascorner.co",
    brand: "SaaS Corner",
    titleSuffix: " | SaaS Corner",
    author: "SaaS Corner",
    pClass: "framer-text framer-styles-preset-dv2q2y",
    cardSelector: "framer-6qjzk6-container",
    defaultImage: "/_a/fr/assets/DdUF2hjKpJDDtxNUSLuWBnlwMc.png",
    lang: "tr",
    dateLocale: "tr-TR",
    regions: { title: "Heading", category: "Published 20 Jan 2024", date: "Published 20 Jan 2024#1", summary: "Supporting text", banner: ".framer-1exfs49", content: "Content", next: null },
    relatedCards: true, // yazı altındaki "Son Bloglar" kartları
    listHero: { title: "Navigating Remote Work: Tips for Boosting Productivity", text: "Supporting text", href: "./blog/lead-generation-saas-corner-ile-nitelikli-musterileri-elde-etmenin-yollari" },
  },
  "socialmediacorner.co": {
    origin: "https://socialmediacorner.co",
    brand: "Social Media Corner",
    titleSuffix: " | Social Media Corner",
    author: "Social Media Corner",
    pClass: "framer-text",
    cardSelector: "framer-txeawa-container",
    defaultImage: "/_a/fr/assets/DdUF2hjKpJDDtxNUSLuWBnlwMc.png",
    lang: "tr",
    dateLocale: "tr-TR",
    regions: { title: "Heading", category: "Published 20 Jan 2024", date: "Published 20 Jan 2024#1", summary: "Supporting text", banner: ".framer-2smd5o", content: "Content", next: null },
    variants: { en: { lang: "en", dateLocale: "en-US", prefix: "/en" } },
    // /en/ ve ana sayfalardaki TR/EN anahtarıyla aynı görünüm
    langCss: `<style data-sk-lang>.sk-lang{position:fixed;left:16px;bottom:16px;z-index:50;display:flex;align-items:center;gap:2px;padding:4px;border-radius:999px;background:rgba(14,28,41,.88);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font:600 12px/1 "Manrope",system-ui,sans-serif;letter-spacing:.04em}.sk-lang a,.sk-lang span{display:block;padding:7px 10px;border-radius:999px;color:#c3cbd6;text-decoration:none}.sk-lang a:hover{color:#fff}.sk-lang [aria-current]{background:#774be5;color:#fff}</style>`,
  },
  "yalcinberkay.com.tr": {
    origin: "https://www.yalcinberkay.com.tr",
    brand: "Berkay Yalçın",
    titleSuffix: " - Berkay YALÇIN",
    author: "Berkay Yalçın",
    pClass: "framer-text framer-styles-preset-1cwyh61",
    cardSelector: "framer-1yrd82k-container",
    lang: "en",
    dateLocale: "en-US",
    variants: { tr: { lang: "tr", dateLocale: "tr-TR", prefix: "/tr" } },
    regions: { title: ".framer-7c4ms5", date: ".framer-ti2qwe", readTime: ".framer-3521xc", banner: ".framer-1c7evgq", content: ".framer-v57om2", category: null, next: null },
    cardFields: { title: ".framer-1yrd82k-container", summary: ".framer-rry5oh", date: ".framer-1cyi7cp", readTime: ".framer-1ol8k15" },
  },
  "salescorner.co": {
    origin: "https://salescorner.co", brand: "Sales Corner", titleSuffix: " | Sales Corner", author: "Sales Corner",
    pClass: "sk-p", cardSelector: "sk-card", lang: "tr", dateLocale: "tr-TR",
    regions: { readTime: "ReadTime" }, cardFields: { summary: ".sk-sum", readTime: ".sk-rt" },
    variants: { en: { lang: "en", dateLocale: "en-US", prefix: "/en" } },
    // /en/ ve ana sayfalardaki TR/EN anahtarıyla aynı görünüm
    langCss: `<style data-sk-lang>.sk-lang{position:fixed;left:16px;bottom:16px;z-index:50;display:flex;gap:2px;padding:4px;border-radius:999px;background:rgba(10,10,15,.88);border:1px solid rgba(255,255,255,.14);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font:600 12px/1 Inter,system-ui,sans-serif;letter-spacing:.04em}.sk-lang a{display:block;padding:7px 10px;border-radius:999px;color:rgb(160,160,175);text-decoration:none}.sk-lang a:hover{color:#fff}.sk-lang a[aria-current]{background:linear-gradient(135deg,rgb(124,92,255),rgb(34,211,238));color:#fff}</style>`,
  },
  "brandcorner.co": {
    origin: "https://www.brandcorner.co", brand: "Brand Corner", titleSuffix: " | Brand Corner", author: "Brand Corner",
    pClass: "sk-p", cardSelector: "sk-card", lang: "en", dateLocale: "en-US",
    regions: { readTime: "ReadTime" }, cardFields: { summary: ".sk-sum", readTime: ".sk-rt" },
  },
};
