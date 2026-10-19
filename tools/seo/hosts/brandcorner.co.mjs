import { SITE, text, attr, setMeta, ldTag, existsSync, join, metaDescription } from "../core.mjs";

export const rule = {
    origin: "https://www.brandcorner.co",
    FAQ: {
      en: [
        ["Can I change plans later?", "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."],
        ["What payment methods do you accept?", "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for enterprise plans."],
        ["Is there a contract or commitment?", "No long-term contracts required. Monthly plans can be cancelled anytime. Yearly plans are billed annually but can be cancelled with remaining time prorated."]],
      tr: [
        ["Planımı daha sonra değiştirebilir miyim?", "Evet! Planınızı istediğiniz zaman yükseltebilir veya düşürebilirsiniz. Değişiklikler bir sonraki fatura döneminin başında yürürlüğe girer."],
        ["Hangi ödeme yöntemlerini kabul ediyorsunuz?", "Tüm büyük kredi kartlarını (Visa, Mastercard, American Express), PayPal'ı ve kurumsal planlar için banka transferlerini kabul ediyoruz."],
        ["Sözleşme veya taahhüt var mı?", "Uzun vadeli sözleşme gerekmez. Aylık planlar her zaman iptal edilebilir. Yıllık planlar yıllık olarak faturalandırılır ancak kalan süre orantılı olarak iptal edilebilir."]],
    },
    // v0 şablonu her sayfaya aynı başlık/açıklamayı veriyor. Sayfa başına [başlık ≤60, açıklama ≤155, breadcrumb adı], sitedeki metinden
    META: {
      "/": ["Brand Corner - Influencer Marketing Platform", "Connect brands with the right influencers. An all-in-one influencer marketing platform to manage campaigns, discover talent, and track performance."],
      "/features": ["Influencer Marketing Features | Brand Corner", "Brand Corner is an influencer marketing platform with discovery and matching, campaign management, analytics, messaging, payments and integrations.", "Features"],
      "/pricing": ["Pricing and Plans | Brand Corner", "Compare Brand Corner's Starter, Professional and Enterprise plans side by side, with a feature comparison and answers to frequently asked questions.", "Pricing"],
      "/solutions/brands": ["Influencer Marketing for Brands | Brand Corner", "Brand Corner helps brands discover, connect, and collaborate with influencers who align with their brand values, with advanced search and analytics.", "For Brands"],
      "/solutions/influencers": ["For Influencers: Get Discovered by Brands | Brand Corner", "Brand Corner helps influencers get discovered by brands, receive quality offers, and manage collaborations, contracts and payments in one place.", "For Influencers"],
      "/solutions/agencies": ["Influencer Agency Management Tools | Brand Corner", "Brand Corner gives agencies tools to manage their talent roster, orchestrate client campaigns, and automate reporting with a dedicated client portal.", "For Agencies"],
      "/about": ["About Brand Corner", "Brand Corner is an influencer marketing platform connecting brands, influencers, and agencies worldwide. Built in Istanbul as part of Corner Group.", "About"],
      "/contact": ["Contact Brand Corner", "Contact the Brand Corner team about influencer campaigns, plans, or partnerships. Send us a message and we will get back to you.", "Contact"],
      "/privacy": ["Privacy Policy | Brand Corner", "How the Brand Corner website handles personal data: the newsletter form, hosting, cookies and local storage, and your rights under the GDPR and KVKK.", "Privacy Policy"],
      "/kvkk": ["KVKK Aydınlatma Metni | Brand Corner", "Brand Corner hesabı için kişisel verilerin hangi amaçla işlendiği, kimlere aktarıldığı, ne kadar saklandığı ve KVKK 11. madde kapsamındaki haklarınız.", "KVKK Aydınlatma Metni"],
      "/terms": ["Terms of Service | Brand Corner", "The terms that apply when you use the Brand Corner website, including acceptable use, intellectual property, the newsletter form and liability.", "Terms of Service"],
      "/404": ["Page Not Found | Brand Corner", "This page could not be found."],
      // Giriş, kayıt, şifre sıfırlama ve panel: noindex, sitemap'te yok
      "/giris": ["Giriş | Brand Corner", "Brand Corner hesabınıza giriş yapın."],
      "/login": ["Log in | Brand Corner", "Log in to your Brand Corner account."],
      "/kayit": ["Kayıt ol | Brand Corner", "Marka, influencer ya da ajans olarak Brand Corner hesabı oluşturun."],
      "/register": ["Sign up | Brand Corner", "Create a Brand Corner account as a brand, influencer or agency."],
      "/sifremi-unuttum": ["Şifremi unuttum | Brand Corner", "Brand Corner hesabınızın şifresini sıfırlamak için link isteyin."],
      "/forgot-password": ["Forgot password | Brand Corner", "Request a link to reset your Brand Corner password."],
      "/sifre-yenile": ["Yeni şifre | Brand Corner", "Brand Corner hesabınız için yeni bir şifre belirleyin."],
      "/reset-password": ["New password | Brand Corner", "Set a new password for your Brand Corner account."],
      "/panel": ["Panel | Brand Corner", "Brand Corner panel."],
    },
    // Doğrulanamayan iddialar (500+/10,000+ sayaçları, logo şeridi, yorumlar, başarı hikâyeleri, mockup tutarları, © 2025) nötrlenir.
    // Gövde SSR çıktısı: her değişiklik CHUNK_PATCHES'teki istemci yamasıyla birebir aynı olmalı, yoksa hydration #418 verir.
    // cut: açılış etiketinden eşi olan kapanışa kadar silinir; section: başlığı içeren <section> silinir; swap: [eski, yeni, beklenen adet]
    BODY: (() => {
      const copy = ["<p>© 2025 Brand Corner. All rights reserved.</p>", "<p>© Brand Corner. All rights reserved.</p>", 1];
      const grid = '<div class="mt-10 grid grid-cols-3 gap-6">';
      const social = '<div class="mt-6 flex gap-4">';  // footer'daki 4 sosyal ikon href="#" (hesap yok)
      return {
        "/": { cut: ['<div class="mt-16 border-t border-border pt-8 lg:mt-24">', social], section: [">Trusted by Industry Leaders</h2>", ">Success Stories</h2>"], swap: [
          ['<link rel="preload" as="image" href="/fashion-brand-marketing-campaign-success.jpg"/>', "", 1],
          ['<link rel="preload" as="image" href="/tech-startup-growth-marketing.jpg"/>', "", 1],
          ['<link rel="preload" as="image" href="/food-delivery-app-success-story.jpg"/>', "", 1],
          ["<span>Trusted by 500+ brands</span>", "<span>For brands</span>", 1],
          ["<span>10,000+ influencers</span>", "<span>For influencers</span>", 1],
          ["<span>50+ agencies</span>", "<span>For agencies</span>", 1],
          ...["2.4K", "89%", "$45K"].map(v => [`<div class="font-mono text-2xl font-bold text-primary">${v}</div>`, '<div class="font-mono text-2xl font-bold text-primary">—</div>', 1]),
          ['<p class="font-semibold text-foreground">+15 Influencers</p>', '<p class="font-semibold text-foreground">Influencers</p>', 1],
          ['<p class="font-mono font-semibold text-[#10B981]">+340%</p>', '<p class="font-mono font-semibold text-[#10B981]">—</p>', 1],
          ['<span class="text-xs text-muted-foreground">12K followers</span>', '<span class="text-xs text-muted-foreground">Followers</span>', 4],
          ['leading-5 text-primary">4.8%</div>', 'leading-5 text-primary">—</div>', 4],
          [">24/7 Support</h3>", ">Support</h3>", 1],
          ["Join thousands of brands, influencers, and agencies growing with Brand Corner.", "Brands, influencers, and agencies can grow with Brand Corner.", 1], copy] },
        "/features": { cut: [social], swap: [["analyzes thousands of profiles", "analyzes profiles", 1], copy] },
        "/pricing": { cut: [social], swap: [copy] },
        "/solutions/brands": { cut: [grid, social], swap: [
          ["<span>125K followers</span>", "<span>Followers</span>", 4],
          ["<span>4.8% engagement</span>", "<span>Engagement</span>", 4],
          ['<p class="font-semibold text-foreground">+24 new</p>', '<p class="font-semibold text-foreground">New</p>', 1],
          ['text-[#10B981]">+340%</p>', 'text-[#10B981]">—</p>', 1],
          ["Join 500+ brands already using Brand Corner to transform their influencer marketing.", "Use Brand Corner to transform your influencer marketing.", 1], copy] },
        "/solutions/influencers": { cut: [grid, social], section: [">Influencer Success Stories</h2>"], swap: [
          ['<p class="text-sm text-muted-foreground">Fashion Brand - $1,500</p>', '<p class="text-sm text-muted-foreground">Fashion Brand</p>', 1],
          ['<div class="font-mono text-2xl font-bold text-foreground">$4,250</div>', '<div class="font-mono text-2xl font-bold text-foreground">—</div>', 1],
          ['text-[#10B981]">+32%</div>', 'text-[#10B981]">—</div>', 1],
          ['<p class="font-semibold text-[#10B981]">+$1,500</p>', '<p class="font-semibold text-[#10B981]">—</p>', 1],
          ["visible to hundreds of brands", "visible to brands", 1],
          ["Join 10,000+ influencers already growing with Brand Corner. It&#x27;s free to join!", "Grow with Brand Corner. It&#x27;s free to join!", 1], copy] },
        "/solutions/agencies": { cut: [grid, social], swap: [
          ...[["Sarah J.", "A", "$12,500"], ["Mike R.", "B", "$8,200"], ["Emma L.", "C", "$10,800"]].flatMap(([n, k, v]) => [
            [`<p class="font-medium text-foreground">${n}</p>`, `<p class="font-medium text-foreground">Talent ${k}</p>`, 1], [`>${v}</p>`, ">—</p>", 1]]),
          ['<p class="font-mono font-semibold text-[#10B981]">$45,200</p>', '<p class="font-mono font-semibold text-[#10B981]">—</p>', 1],
          ["Join leading agencies already managing their talents with Brand Corner.", "Manage your talents with Brand Corner.", 1], copy] },
      };
    })(),
    // Bunlardan biri gövdede kalırsa koşu durur: ayna yenilenip işaretler kayarsa iddialar sessizce geri gelmesin
    CLAIMS: /500\+|10,000\+|50\+ agencies|\$5M|50,000\+|98%|2\.4K|89%|\$45K|\+340%|TechCorp|ModaBrand|FoodCo|TravelGo|StyleHub|Sarah|Alex Rivera|Maria Garcia|TechStart|FoodExpress|Mike R\.|Emma L\.|\$12,500|\$8,200|\$10,800|\$45,200|\$4,250|\$1,500|125K|12K followers|4\.8%|24\/7|thousands of|hundreds of|© 2025|Join leading|Industry Leaders|10\.000\+|50\.000\+|₺\d+M|%98|7\/24|binlerce|yüzlerce|Sektör Lider/,
    body(b, page) {
      const T = this.BODY[page] || {};
      const drop = (i, what) => {  // i'deki açılış etiketini eşi olan kapanışla birlikte siler
        const tag = b.slice(i + 1).match(/^\w+/)[0], re = new RegExp(`<${tag}\\b|</${tag}>`, "g");
        re.lastIndex = i;
        for (let d = 0, m; (m = re.exec(b)); ) if (!(d += m[0][1] === "/" ? -1 : 1)) return b.slice(0, i) + b.slice(re.lastIndex);
        throw new Error(`brandcorner ${page}: ${what} kapanmıyor`);
      };
      // İşaret yoksa önceki koşuda silinmiştir (idempotent)
      for (const open of T.cut || []) {
        const i = b.indexOf(open);
        if (i >= 0 && b.indexOf(open, i + 1) >= 0) throw new Error(`brandcorner ${page}: ${open} tek değil`);
        if (i >= 0) b = drop(i, open);
      }
      for (const h of T.section || []) { const i = b.indexOf(h); if (i >= 0) b = drop(b.lastIndexOf("<section", i), h); }
      for (const [a, z, n] of T.swap || []) {
        const k = b.split(a).length - 1;
        if (k && k !== n) throw new Error(`brandcorner ${page}: "${a}" ${k} kez, beklenen ${n}`);
        b = b.split(a).join(z);
      }
      const left = b.replace(/<script\b[\s\S]*?<\/script>/g, "").match(this.CLAIMS);
      if (left) throw new Error(`brandcorner ${page}: doğrulanamayan iddia kaldı: ${left[0]}`);
      return b;
    },
    fix(html, page) {
      if (/^\/blog(?:\/|$)/.test(page)) return html;  // blog sayfaları build-blog.mjs'in
      const R = this, url = R.origin + (page === "/" ? "/" : page), ORG = R.origin + "/#org";
      if (!R.META[page]) throw new Error(`brandcorner: ${page} için META yok`);
      const [title, desc, crumb] = R.META[page];
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${title.replace(/&/g, "&amp;")}</title>`);
      for (const [re, v] of [
        [/(<meta name="description" content=")([^"]*)(")/, desc], [/(<meta property="og:description" content=")([^"]*)(")/, desc],
        [/(<meta name="twitter:description" content=")([^"]*)(")/, desc], [/(<meta property="og:title" content=")([^"]*)(")/, title],
        [/(<meta name="twitter:title" content=")([^"]*)(")/, title]]) html = setMeta(html, re, v);
      // Hydration sonrası Next başlığı RSC verisinden (self.__next_f) yeniden yazar; oradaki eski değerler de değişmeli
      const rsc = s => JSON.stringify(JSON.stringify(s)).slice(1, -1).replace(/</g, "\\\\u003c");
      html = html.replace(/<script>self\.__next_f\.push\([\s\S]*?<\/script>/g, s => s
        .replace(/(\\"title\\",\\"0\\",\{\\"children\\":)\\"[^\\]*\\"/, `$1${rsc(title)}`)
        .replace(/(\\"(?:name|property)\\":\\"(?:og:|twitter:)?title\\",\\"content\\":)\\"[^\\]*\\"/g, `$1${rsc(title)}`)
        .replace(/(\\"(?:name|property)\\":\\"(?:og:|twitter:)?description\\",\\"content\\":)\\"(?:[^\\]|\\\\.)*?\\"(?=\})/g, `$1${rsc(desc)}`)
        .replace(/(,?)\[\\"\$\\",\\"meta\\",\\"\d+\\",\{\\"name\\":\\"generator\\",\\"content\\":\\"v0\.app\\"\}\](,?)/g, (m, a, b) => a && b ? "," : ""));
      // v0 404 sayfasında kök layout'un başlığı ikinci <title> olarak kalıyor; head'de ilki kalır. generator=v0 etiketi de atılır
      html = html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/, h => { let i = 0; return h.replace(/<title>[^<]*<\/title>/g, t => i++ ? "" : t); });
      html = html.replace(/<meta name="generator" content="v0\.app"\/>/g, "");
      // noindex sayfaya (404) canonical ve og:url konmaz
      const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
      html = html.replace(/<link rel="canonical"[^>]*>|<meta property="og:(?:url|site_name)"[^>]*>/g, "");
      html = html.replace(/(<meta property="og:title")/, (noindex ? "" : `<link rel="canonical" href="${url}"/><meta property="og:url" content="${url}"/>`) + `<meta property="og:site_name" content="Brand Corner"/>$1`);
      // kvkk ↔ privacy hreflang çiftine x-default (İngilizce sayfa)
      html = html.replace(/<link rel="alternate" hreflang="x-default"[^>]*>/g, "");
      if (html.includes('hreflang="tr" href="https://www.brandcorner.co/kvkk"'))
        html = html.replace("</head>", `<link rel="alternate" hreflang="x-default" href="https://www.brandcorner.co/privacy"/></head>`);
      // Favicon ve 1200×630 paylaşım görseli: dosyalar sites/brandcorner.co'ya konunca devreye girer
      if (existsSync(join(SITE, "icon.png")) && !html.includes('rel="icon"'))
        html = html.replace("</head>", `<link rel="icon" href="/icon.png" type="image/png"/><link rel="apple-touch-icon" href="/icon.png"/></head>`);
      // Footer'daki sosyal ikonlar artık gövdeden ve chunk'tan birlikte siliniyor (BODY cut + CHUNK_PATCHES); eski gizleme CSS'i kalkar
      html = html.replace('<style data-sk-seo>footer a[href="#"]{display:none}</style>', "");
      if (existsSync(join(SITE, "og.png"))) {
        html = html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*(")/g, `$1${R.origin}/og.png$2`);
        if (!html.includes('property="og:image:width"'))
          html = html.replace(/(<meta property="og:image" content="[^"]*"\/>)/, `$1<meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>`);
      }
      // Tam Organization düğümü / ve /about'ta, diğer sayfalar @id ile bağlanır. description footer sloganı;
      // founder ve parentOrganization @id/ad/url'leri canlı yalcinberkay ve cornergroup düğümleriyle birebir
      html = html.replace(/<script type="application\/ld\+json" data-sk-(?:seo|page)>[\s\S]*?<\/script>\n?/g, "");
      const org = { "@type": "Organization", "@id": ORG, name: "Brand Corner", url: R.origin + "/",
        logo: { "@type": "ImageObject", url: R.origin + "/icon.png", width: 512, height: 512 },
        description: "Connecting brands, influencers, and agencies worldwide",
        founder: { "@type": "Person", "@id": "https://www.yalcinberkay.com.tr/#person", name: "Berkay Yalçın", url: "https://www.yalcinberkay.com.tr/" },
        parentOrganization: { "@type": "Organization", "@id": "https://cornergroup.co/#org", name: "Corner Group", url: "https://cornergroup.co/" } };
      const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "");
      // /kvkk tek Türkçe yasal sayfa: dil ve breadcrumb "Ana Sayfa"
      const tr = /<html lang="tr"/.test(html);
      const graph = noindex ? [] : page === "/"
        ? [org, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: "Brand Corner", publisher: { "@id": ORG }, inLanguage: "en" }]
        : [...(page === "/about" ? [org] : []),
          { "@type": page === "/about" ? "AboutPage" : "WebPage", "@id": url + "#webpage", url, name: h1, description: desc, isPartOf: { "@id": R.origin + "/#website" }, about: { "@id": ORG }, inLanguage: tr ? "tr" : "en" },
          { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: tr ? "Ana Sayfa" : "Home", item: R.origin + "/" }, { "@type": "ListItem", position: 2, name: crumb, item: url }] }];
      // /pricing SSS'si (PricingFAQ chunk'ı) birebir; sayfa dil anahtarlı olduğundan EN ve TR ayrı FAQPage
      if (page === "/pricing") for (const [lang, qa] of Object.entries(R.FAQ))
        graph.push({ "@type": "FAQPage", "@id": url + "#faq-" + lang, url, inLanguage: lang, isPartOf: { "@id": url + "#webpage" },
          mainEntity: qa.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: ans } })) });
      if (graph.length) html = html.replace("</head>", ldTag({ "@context": "https://schema.org", "@graph": graph }) + "</head>");
      // Gövde (RSC verisinden önceki kısım) iddia nötrleme; RSC verisinde bu metinler yok
      const at = html.indexOf("<script>(self.__next_f"), end = at < 0 ? html.length : at;
      return R.body(html.slice(0, end), page) + html.slice(end);
    },
};

// v0/Next istemci bileşenlerinin gövdesi JS chunk'ında: HTML'e eklenen öğe chunk'ta da olmalı, yoksa hydration #418 verir.
// /_next/static/* immutable önbellekli: yamalı chunk içerik özetli yeni adla yazılır, HTML ve RSC referansları ona çevrilir; eski dosya kalır.
// edits sırayla uygulanır: [from, to]; from ya tek eşleşen metin ya da {from, until}: tek eşleşen from'dan sonraki ilk until'e kadar (until kalır)
// Yamalanmış chunk'ın edits'i değişirse sayfalar önceki çıktının adını gösterir: o ad was'a eklenir (yeni ad hiçbir sayfada yoksa koşu durur)
// Gövdeyi silinen bileşenler "return null" olur; aynı değişiklik RULES["brandcorner.co"].BODY ile SSR HTML'de de yapılır.
const DICT = [  // i18n sözlüğü (EN + TR); 6 sayfanın ve 404'ün chunk'ında aynı kopya
  ['"hero.trust.brands":"Trusted by 500+ brands"', '"hero.trust.brands":"For brands"'],
  ['"hero.trust.influencers":"10,000+ influencers"', '"hero.trust.influencers":"For influencers"'],
  ['"hero.trust.agencies":"50+ agencies"', '"hero.trust.agencies":"For agencies"'],
  ['"features.support.title":"24/7 Support"', '"features.support.title":"Support"'],
  ['"footer.copyright":"© 2025 Brand Corner. All rights reserved."', '"footer.copyright":"© Brand Corner. All rights reserved."'],
  ['"hero.trust.brands":"500+ marka güveniyor"', '"hero.trust.brands":"Markalar için"'],
  ['"hero.trust.influencers":"10,000+ influencer"', '"hero.trust.influencers":"Influencer\'lar için"'],
  ['"hero.trust.agencies":"50+ ajans"', '"hero.trust.agencies":"Ajanslar için"'],
  ['"features.support.title":"7/24 Destek"', '"features.support.title":"Destek"'],
  ['"footer.copyright":"© 2025 Brand Corner. Tüm hakları saklıdır."', '"footer.copyright":"© Brand Corner. Tüm hakları saklıdır."'],
  ['"cta.subheadline":"Join thousands of brands, influencers, and agencies growing with Brand Corner."', '"cta.subheadline":"Brands, influencers, and agencies can grow with Brand Corner."'],
  ['"cta.subheadline":"Brand Corner ile büyüyen binlerce marka, influencer ve ajansa katılın."', '"cta.subheadline":"Markalar, influencer\'lar ve ajanslar Brand Corner ile büyüyebilir."'],
  ['tarafından keşfedillin,', 'tarafından keşfedilin,'],  // yazım hatası
  // PR-G: SocialProofSection "return null" olduğundan görünmüyor; sözlükte de iddia kalmasın
  ['"socialProof.headline":"Trusted by Industry Leaders"', '"socialProof.headline":"Built for brands, influencers, and agencies"'],
  ['"socialProof.brands":"500+ Brands"', '"socialProof.brands":"Brands"'],
  ['"socialProof.influencers":"10,000+ Influencers"', '"socialProof.influencers":"Influencers"'],
  ['"socialProof.revenue":"$5M+ Revenue Generated"', '"socialProof.revenue":"Revenue"'],
  ['"socialProof.campaigns":"50,000+ Successful Campaigns"', '"socialProof.campaigns":"Campaigns"'],
  ['"socialProof.satisfaction":"98% Satisfaction Rate"', '"socialProof.satisfaction":"Satisfaction"'],
  ['"socialProof.headline":"Sektör Liderlerinin Tercihi"', '"socialProof.headline":"Markalar, influencer\'lar ve ajanslar için"'],
  ['"socialProof.brands":"500+ Marka"', '"socialProof.brands":"Markalar"'],
  ['"socialProof.influencers":"10,000+ Influencer"', '"socialProof.influencers":"Influencer\'lar"'],
  ['"socialProof.revenue":"₺50M+ Gelir Oluşturuldu"', '"socialProof.revenue":"Gelir"'],
  ['"socialProof.campaigns":"50,000+ Başarılı Kampanya"', '"socialProof.campaigns":"Kampanyalar"'],
  ['"socialProof.satisfaction":"%98 Memnuniyet Oranı"', '"socialProof.satisfaction":"Memnuniyet"'],
];
const statGrid = v => ({ from: `,(0,${v}.jsxs)("div",{className:"mt-10 grid grid-cols-3 gap-6",children:[`, until: `]}),(0,${v}.jsxs)("div",{className:"relative"` });
// CTA'lar düz <button>'dı: onClick SSR HTML'ine yazılmaz (#418 riski yok). Dil kapsamda yoksa localStorage'dan okunur (varsayılan en)
const REG = (q = "") => `()=>{let l;try{l=localStorage.getItem("brand-corner-lang")}catch(x){}location.href=${q ? `("tr"===l?"/kayit":"/register")+"${q}"` : `"tr"===l?"/kayit":"/register"`}}`;
const go = u => `()=>{location.href="${u}"}`;
// Fiyat kartları: Kurumsal (Contact Sales) e-postaya, diğerleri kayda
const plan = lang => `()=>{location.href=t.cta===e("pricingPage.contactSales")?"mailto:info@saascorner.co":"en"===${lang}?"/register":"/kayit"}`;
const on = (btn, js) => {
  const to = /^\(0,/.test(btn) ? btn.replace(/^(\(0,\w+\.jsxs?\)\(\w+\.Button,\{)/, `$1onClick:${js},`) : `onClick:${js},${btn}`;
  if (to === btn) throw new Error(`onClick eklenemedi: ${btn.slice(0, 60)}`);
  return [btn, to];
};
// Next build latin-ext alt kümelerini (ğ, ş, İ, ₺ …) yayımlamamış; @font-face 404 veriyor, tarayıcı zaten "* Fallback" (Arial) ile çiziyor.
const LATIN_EXT = "U+100-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+304,U+308,U+329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const noFace = (family, weight, file) => [`@font-face{font-family:${family};font-style:normal;font-weight:${weight};font-display:swap;src:url(../media/${file}.woff2)format("woff2");unicode-range:${LATIN_EXT}}`, ""];
export const chunks = [
    // e34ca4a footer Company listesine Blog ekledi (6 sayfa); i18n sözlüklerinde footer.blog zaten var
    // Header'daki Giriş/Login ve Get Started butonlarının (masaüstü + mobil menü) tıklama işleyicisi yoktu; site diline göre
    // /login|/giris ve /register|/kayit'e gider. onClick SSR HTML'ine yazılmaz, gövdeye dokunulmaz (#418 riski yok)
    // Footer'daki 4 sosyal ikon href="#" idi (hesap yok): gövdeden (BODY cut) ve chunk'tan birlikte silinir
    { chunk: "fbb4735ac8b2897c", was: ["29a4179b1081dab7"], edits: [
      ['{href:"/press",label:e("footer.press")},', '{href:"/press",label:e("footer.press")},{href:"/blog",label:e("footer.blog")},'],
      ...['hidden border-primary text-primary hover:bg-primary/5 sm:inline-flex bg-transparent', 'border-primary text-primary bg-transparent'].map(c => [
        `(0,u.jsx)(m.Button,{variant:"outline",className:"${c}",children:r("nav.login")})`,
        `(0,u.jsx)(m.Button,{variant:"outline",onClick:()=>{location.href="en"===e?"/login":"/giris"},className:"${c}",children:r("nav.login")})`]),
      ...['hidden gradient-primary text-primary-foreground hover:opacity-90 sm:inline-flex', 'gradient-primary text-primary-foreground'].map(c =>
        on(`(0,u.jsx)(m.Button,{className:"${c}",children:r("nav.getStarted")})`, `()=>{location.href="en"===e?"/register":"/kayit"}`)),
      [{ from: ',(0,t.jsxs)("div",{className:"mt-6 flex gap-4"', until: ']}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4"' }, ""],
    ] },
    // PR-F: doğrulanamayan sayaçlar, logo şeridi, yorumlar, başarı hikâyeleri ve mockup tutarları
    { chunk: "411b1b9d3b6df8ca", was: ["7cc019c396358bc9", "869eb8a0955429b6"], edits: DICT },
    { chunk: "763536697d8b15ea", was: ["021182790b26378c", "42731d199f21ea94"], edits: DICT },
    { chunk: "e4b281dafb09dd8b", was: ["ed42209b874cf44c"], edits: [  // ana sayfa
      on('(0,s.jsxs)(a.Button,{size:"lg",className:"gradient-primary h-12 px-8 text-lg text-primary-foreground",children:[e("hero.cta.trial")', REG()),
      on('(0,s.jsxs)(a.Button,{size:"lg",variant:"outline",className:"h-12 gap-2 px-8 text-lg bg-transparent",children:[', go("/features")),
      on('(0,s.jsxs)(r.Button,{variant:"link",className:"mt-4 h-auto p-0 text-primary",children:[e("solution.learnMore")', go("/features")),
      on('(0,s.jsxs)(r.Button,{size:"lg",className:"mt-8 gradient-primary text-primary-foreground",children:[p.cta', REG()),
      on('(0,s.jsx)(r.Button,{className:`mt-8 w-full ${t.popular?"gradient-primary text-primary-foreground":""}`,variant:t.popular?"default":"outline",children:t.cta})', plan("d")),
      on('(0,s.jsxs)(a.Button,{size:"lg",className:"mt-8 h-14 bg-primary-foreground px-10 text-lg text-primary hover:bg-primary-foreground/90",children:[e("cta.button")', REG()),
      [{ from: ',(0,s.jsxs)("div",{className:"mt-16 border-t border-border pt-8 lg:mt-24"', until: ']})]})}e.s(["HeroSection"' }, ""],  // "Trusted by 500+" + logo şeridi
      [{ from: 'function l(){let{t:e,language:l}=(0,t.useLanguage)(),i=[{value:"500+"', until: 'e.s(["SocialProofSection",()=>l])' }, "function l(){return null}"],
      [{ from: 'function i(){let{t:e,language:i}=(0,t.useLanguage)();return(0,s.jsx)("section",{className:"bg-secondary py-16 sm:py-24"', until: 'e.s(["CaseStudiesSection",()=>i])' }, "function i(){return null}"],
      ['children:1===e?"2.4K":2===e?"89%":"$45K"', 'children:"—"'],
      ['children:"+15 Influencers"', 'children:"Influencers"'],
      ['children:"+340%"', 'children:"—"'],
      ['children:"12K followers"', 'children:"Followers"'],
      ['children:"4.8%"', 'children:"—"'],
      ['children:"Fashion brand collaboration - $500"', 'children:"Fashion brand collaboration"'],
      ['children:"$2.4K"', 'children:"—"'],
      ['children:"+24%"', 'children:"—"'],
      ['children:["$",1500*e]', 'children:"—"'],
    ] },
    { chunk: "265b6dd36dde1597", was: ["81f74a9a6a0889fa"], edits: [  // /solutions/brands
      [statGrid("a"), ""],
      on('className:"gradient-primary h-12 px-8 text-primary-foreground",children:[e("solutions.brands.cta")', REG("?role=brand")),
      on('(0,a.jsx)(t.Button,{size:"lg",variant:"outline",className:"h-12 px-8 bg-transparent",children:e("hero.cta.demo")})', go("/features")),
      on('className:"mt-8 h-12 bg-primary-foreground px-8 text-primary hover:bg-primary-foreground/90",children:[e("solutions.brands.cta")', REG("?role=brand")),
      ['(0,a.jsx)("span",{children:"125K followers"})', '(0,a.jsx)("span",{children:"Followers"})'],
      ['(0,a.jsx)("span",{children:"4.8% engagement"})', '(0,a.jsx)("span",{children:"Engagement"})'],
      ['children:"+24 new"', 'children:"New"'],
      ['children:"+340%"', 'children:"—"'],
      ['"Join 500+ brands already using Brand Corner to transform their influencer marketing."', '"Use Brand Corner to transform your influencer marketing."'],
      ['"Influencer pazarlamasını dönüştürmek için Brand Corner kullanan 500+ markaya katılın."', '"Influencer pazarlamanızı Brand Corner ile dönüştürün."'],
    ] },
    { chunk: "51d3cf739a8640a6", was: ["6bbaf7b9bf66cf11", "a8188971253e20e0"], edits: [  // /solutions/influencers
      ['"Get Discovered":"Keşfedillin"', '"Get Discovered":"Keşfedilin"'],  // yazım hatası
      [statGrid("s"), ""],
      on('className:"h-12 bg-[#FFB71B] px-8 text-foreground hover:bg-[#FFB71B]/90",children:[e("solutions.influencers.cta")', REG("?role=influencer")),
      on('(0,s.jsx)(t.Button,{size:"lg",variant:"outline",className:"h-12 px-8 bg-transparent",children:e("hero.cta.demo")})', go("/features")),
      on('className:"mt-8 h-12 bg-foreground px-8 text-background hover:bg-foreground/90",children:[e("solutions.influencers.cta")', REG("?role=influencer")),
      [{ from: 'function l(){let{language:e}=(0,r.useLanguage)();return(0,s.jsx)("section",{className:"bg-background py-16 sm:py-24",children:(0,s.jsxs)("div",{className:"mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",children:[(0,s.jsxs)("div",{className:"text-center",children:[(0,s.jsx)("h2",{className:"font-serif text-3xl font-bold text-foreground sm:text-4xl",children:"en"===e?"Influencer Success Stories"', until: 'e.s(["InfluencersSuccess",()=>l])' }, "function l(){return null}"],
      ['children:"Fashion Brand - $1,500"', 'children:"Fashion Brand"'],
      ['children:"$4,250"', 'children:"—"'],
      ['children:"+32%"', 'children:"—"'],
      ['children:"+$1,500"', 'children:"—"'],
      ['"Your profile is visible to hundreds of brands actively looking for influencers like you."', '"Your profile is visible to brands actively looking for influencers like you."'],
      ["arayan yüzlerce marka tarafından görülebilir.", "arayan markalar tarafından görülebilir."],
      [`"Join 10,000+ influencers already growing with Brand Corner. It's free to join!"`, `"Grow with Brand Corner. It's free to join!"`],
      [`"Brand Corner ile büyüyen 10.000+ influencer'a katılın. Katılım ücretsiz!"`, `"Brand Corner ile büyüyün. Katılım ücretsiz!"`],
    ] },
    { chunk: "4897118e349b9d9c", was: ["e51060d5d0abddeb"], edits: [  // /solutions/agencies
      [statGrid("t"), ""],
      on('className:"h-12 bg-accent px-8 text-accent-foreground hover:bg-accent/90",children:[e("solutions.agencies.cta")', REG("?role=agency")),
      on('(0,t.jsx)(s.Button,{size:"lg",variant:"outline",className:"h-12 px-8 bg-transparent",children:e("hero.cta.demo")})', go("/features")),
      on('className:"mt-8 h-12 bg-accent-foreground px-8 text-accent hover:bg-accent-foreground/90",children:[e("solutions.agencies.cta")', REG("?role=agency")),
      ['[{name:"Sarah J.",campaigns:5,earnings:"$12,500"},{name:"Mike R.",campaigns:3,earnings:"$8,200"},{name:"Emma L.",campaigns:4,earnings:"$10,800"}]',
        '[{name:("en"===l?"Talent":"Yetenek")+" A",campaigns:5,earnings:"—"},{name:("en"===l?"Talent":"Yetenek")+" B",campaigns:3,earnings:"—"},{name:("en"===l?"Talent":"Yetenek")+" C",campaigns:4,earnings:"—"}]'],
      ['children:"$45,200"', 'children:"—"'],
      ['"Join leading agencies already managing their talents with Brand Corner."', '"Manage your talents with Brand Corner."'],
      ['"Yeteneklerini Brand Corner ile yöneten önde gelen ajanslara katılın."', '"Yeteneklerinizi Brand Corner ile yönetin."'],
    ] },
    { chunk: "5c127651fc7ca527", was: ["6569e4e1529055d4"], edits: [  // /features
      ["analyzes thousands of profiles", "analyzes profiles"],
      ["üzere binlerce profili analiz eder.", "üzere profilleri analiz eder."],
      on('(0,a.jsxs)(r.Button,{size:"lg",className:"gradient-primary h-12 px-8 text-primary-foreground",children:[e("hero.cta.trial")', REG()),
      // Demo videosu yok; bu sayfadaki "Watch Demo" bir alttaki özellik bölümüne kaydırır
      on('(0,a.jsx)(r.Button,{size:"lg",variant:"outline",className:"h-12 px-8 bg-transparent",children:e("hero.cta.demo")})',
        'v=>{v.currentTarget.closest("section")?.nextElementSibling?.scrollIntoView({behavior:"smooth"})}'),
      on('(0,a.jsxs)(r.Button,{size:"lg",className:"mt-8 h-12 bg-primary-foreground px-8 text-primary hover:bg-primary-foreground/90",children:[e("hero.cta.trial")', REG()),
    ] },
    // #170 SSS'yi kaynakta ve yamalı çıktıda yerinde değiştirdi; çıktı adı 49468e11 kaldı (içerik özeti bf87c986), o ad was'ta
    { chunk: "6298d546504883f0", was: ["49468e11c5cb80ca"], edits: [  // /pricing
      on('(0,a.jsx)(i.Button,{className:(0,j.cn)("mt-8 w-full",t.popular?"gradient-primary text-primary-foreground":""),variant:t.popular?"default":"outline",children:t.cta})', plan("s")),
      on('(0,a.jsxs)(r.Button,{size:"lg",className:"mt-8 gradient-primary text-primary-foreground",children:[(0,a.jsx)(n.MessageSquare,', go("mailto:info@saascorner.co")),
    ] },
    // TR font 404'leri: eksik latin-ext dosyalarına giden 6 @font-face (görünüm aynı kalır, yalnız 404 istekleri kalkar)
    { chunk: "f525b972636fb7eb", ext: "css", edits: [
      noFace("Inter", "100 900", "1bffadaabf893a1e-s.7cd81963"),
      noFace("Poppins", "400", "6c55a692938ebbbc-s.0a77efb4"),
      noFace("Poppins", "500", "0da9c7f357bd9d4d-s.b2288445"),
      noFace("Poppins", "600", "5f9d24ebef5d5292-s.bd593fbe"),
      noFace("Poppins", "700", "798ea22d9983e047-s.b460e02c"),
      noFace("Space Grotesk", "300 700", "28868e710e86be81-s.c30238d4"),
    ] },
];
