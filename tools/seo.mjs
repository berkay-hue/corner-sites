// Mirror sonrası SEO düzeltmeleri (idempotent). Kullanım: node tools/seo.mjs <host>
// Şimdilik yalnızca yalcinberkay.com.tr; diğer siteler kendi kurallarıyla eklenecek.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { metaDescription } from "./lib/content.mjs";

const host = process.argv[2];
const SITE = join(import.meta.dirname, "..", "sites", host);

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith("_")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else if (e.name.endsWith(".html")) yield p;
  }
}

const text = s => s.replace(/<br[^>]*>/g, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const attr = s => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const setMeta = (html, re, value) => html.replace(re, (m, a, _old, b) => `${a}${attr(value)}${b}`);
const ldTag = obj => `<script type="application/ld+json" data-sk-seo>${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

const RULES = {
  "cornergroup.co": {
    origin: "https://cornergroup.co",
    brand: "Corner Group",
    // Blog yazıları build-blog.mjs ile üretilir (başlık/açıklama/BlogPosting orada); burada yalnızca sabit sayfalar
    fix(html, page) {
      const R = this;
      html = html.replace(/<script type="application\/ld\+json" data-sk-seo>[\s\S]*?<\/script>/g, "");
      if (page !== "/") return html;
      html = html.replace(/<title>[^<]*<\/title>/, "<title>Corner Group | B2B Satış, Pazarlama ve CRM Çözümleri</title>");
      const org = { "@type": "Organization", "@id": R.origin + "/#org", name: R.brand, url: R.origin + "/", logo: R.origin + "/_a/fr/images/6WSE5LNdHL8DI6oGFkxraYy6Dg.png" };
      const ld = { "@context": "https://schema.org", "@graph": [org, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: R.brand, publisher: { "@id": org["@id"] }, inLanguage: "tr-TR" }] };
      return html.replace("</head>", ldTag(ld) + "</head>");
    },
  },
  "yalcinberkay.com.tr": {
    origin: "https://www.yalcinberkay.com.tr",
    // Sayfalardaki Person düğümünün tek kaynağı; Organization @id'leri ilgili sitelerin kendi graph'ıyla aynı
    person: (() => {
      const id = "https://www.yalcinberkay.com.tr/#person", founder = { "@id": id };
      const org = (name, url, oid) => ({ "@type": "Organization", ...(oid && { "@id": oid }), name, url, founder });
      return {
        "@type": "Person", "@id": id, name: "Berkay Yalçın", alternateName: "Berkay YALÇIN", url: "https://www.yalcinberkay.com.tr/",
        image: "https://www.yalcinberkay.com.tr/_a/fr/images/tfHxTGcPg5W1q2kXiuBQynltGIA_d8696c1a.png", jobTitle: "Founder & B2B Sales Consultant",
        description: "Founder of SAAS Corner, Sales Corner, Social Media Corner, Brand Corner, CRM Corner and Corner Group; B2B sales consultant with 10+ years of experience, specialising in outbound sales, lead generation and CRM.",
        worksFor: [org("SAAS Corner", "https://saascorner.co"), org("Corner Group", "https://cornergroup.co", "https://cornergroup.co/#org"),
          org("Sales Corner", "https://salescorner.co"), org("Social Media Corner", "https://socialmediacorner.co"),
          org("Brand Corner", "https://www.brandcorner.co", "https://www.brandcorner.co/#org"), org("CRM Corner", "https://crmcorner.co")],
        knowsAbout: ["B2B sales", "Lead generation", "Outbound sales", "Sales development (SDR)", "CRM", "HubSpot", "Salesforce", "Pipedrive", "Apollo.io", "Sales automation"],
        knowsLanguage: ["en", "tr"], sameAs: ["https://www.linkedin.com/in/berkayyalcin2/", "https://www.instagram.com/beerkayyalcin"],
      };
    })(),
    fix(html, page) {
      const R = this;
      // Blog yazıları build-blog.mjs ile üretilir (başlık/açıklama/BlogPosting orada)
      if (/^\/(?:tr\/)?blog\//.test(page)) return html;
      // Şablondan kalan Framer affiliate linki ("via=mejed_k")
      html = html.replace(/\s*\|\s*Powered by\s*(?:<!--\$-->)?<a[^>]*framer\.com[^>]*>Framer<\/a>(?:<!--\/\$-->)?/g, "");
      // Şablon yazar adı
      html = html.replace(/ - Sawad(?=["<])/g, " - Berkay YALÇIN");
      // Ana sayfada ikinci H1 ("X YEARS OF EXPERIENCE") -> h2 (aynı sınıflar, görünüm değişmez)
      if (page === "/") html = html.replace(/<h1([^>]*)>(\d+ YEARS OF[\s\S]*?)<\/h1>/g, "<h2$1>$2</h2>");
      // 404: canonical olmamalı
      if (page === "/404") html = html.replace(/<link rel="canonical"[^>]*>\s*/g, "");

      // Ana sayfalarda (EN ve /tr/) graph'taki diğer düğümler (WebSite, ProfilePage, Service) korunur, Person yenilenir
      const re = /<script type="application\/ld\+json" data-sk-seo>([\s\S]*?)<\/script>/;
      if (page === "/" || page === "/tr/index") {
        const old = html.match(re)?.[1];
        if (old) {
          const ld = JSON.parse(old);
          ld["@graph"] = ld["@graph"].map(n => n["@id"] === R.person["@id"] ? R.person : n);
          return html.replace(re, () => ldTag(ld));
        }
        if (page === "/") return html.replace("</head>", ldTag({ "@context": "https://schema.org", "@graph": [R.person, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: "Berkay YALÇIN", publisher: { "@id": R.person["@id"] }, inLanguage: "en" }] }) + "</head>");
      }
      return html.replace(new RegExp(re.source, "g"), "");
    },
  },
  "brandcorner.co": {
    origin: "https://www.brandcorner.co",
    // v0 şablonu her sayfaya aynı başlık/açıklamayı veriyor. Sayfa başına [başlık ≤60, açıklama ≤160, breadcrumb adı], sitedeki metinden
    META: {
      "/": ["Brand Corner - Influencer Marketing Platform", "Connect brands with the right influencers. An all-in-one influencer marketing platform to manage campaigns, discover talent, and track performance."],
      "/features": ["Influencer Marketing Features | Brand Corner", "Discovery and matching, campaign management, analytics and reporting, messaging and payments, and integrations: everything you need to run influencer campaigns.", "Features"],
      "/pricing": ["Pricing and Plans | Brand Corner", "Compare Brand Corner's Starter, Professional and Enterprise plans side by side, with a feature comparison and answers to frequently asked questions.", "Pricing"],
      "/solutions/brands": ["Influencer Marketing for Brands | Brand Corner", "Discover, connect, and collaborate with influencers who align with your brand values: advanced search, smart filtering, messaging and performance analytics.", "For Brands"],
      "/solutions/influencers": ["For Influencers: Get Discovered by Brands | Brand Corner", "Get discovered by brands, receive quality offers, and manage collaborations, contracts and payments in one place, with analytics to help you grow.", "For Influencers"],
      "/solutions/agencies": ["Influencer Agency Management Tools | Brand Corner", "Manage your talent roster, orchestrate client campaigns, and automate reporting and workflows with agency-grade tools and a dedicated client portal.", "For Agencies"],
      "/about": ["About Brand Corner", "Brand Corner is an influencer marketing platform connecting brands, influencers, and agencies worldwide. Built in Istanbul as part of Corner Group.", "About"],
      "/404": ["Page Not Found | Brand Corner", "This page could not be found."],
    },
    // Doğrulanamayan iddialar (500+/10,000+ sayaçları, logo şeridi, yorumlar, başarı hikâyeleri, mockup tutarları, © 2025) nötrlenir.
    // Gövde SSR çıktısı: her değişiklik CHUNK_PATCHES'teki istemci yamasıyla birebir aynı olmalı, yoksa hydration #418 verir.
    // cut: açılış etiketinden eşi olan kapanışa kadar silinir; section: başlığı içeren <section> silinir; swap: [eski, yeni, beklenen adet]
    BODY: (() => {
      const copy = ["<p>© 2025 Brand Corner. All rights reserved.</p>", "<p>© Brand Corner. All rights reserved.</p>", 1];
      const grid = '<div class="mt-10 grid grid-cols-3 gap-6">';
      return {
        "/": { cut: ['<div class="mt-16 border-t border-border pt-8 lg:mt-24">'], section: [">Trusted by Industry Leaders</h2>", ">Success Stories</h2>"], swap: [
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
        "/features": { swap: [["analyzes thousands of profiles", "analyzes profiles", 1], copy] },
        "/pricing": { swap: [copy] },
        "/solutions/brands": { cut: [grid], swap: [
          ["<span>125K followers</span>", "<span>Followers</span>", 4],
          ["<span>4.8% engagement</span>", "<span>Engagement</span>", 4],
          ['<p class="font-semibold text-foreground">+24 new</p>', '<p class="font-semibold text-foreground">New</p>', 1],
          ['text-[#10B981]">+340%</p>', 'text-[#10B981]">—</p>', 1],
          ["Join 500+ brands already using Brand Corner to transform their influencer marketing.", "Use Brand Corner to transform your influencer marketing.", 1], copy] },
        "/solutions/influencers": { cut: [grid], section: [">Influencer Success Stories</h2>"], swap: [
          ['<p class="text-sm text-muted-foreground">Fashion Brand - $1,500</p>', '<p class="text-sm text-muted-foreground">Fashion Brand</p>', 1],
          ['<div class="font-mono text-2xl font-bold text-foreground">$4,250</div>', '<div class="font-mono text-2xl font-bold text-foreground">—</div>', 1],
          ['text-[#10B981]">+32%</div>', 'text-[#10B981]">—</div>', 1],
          ['<p class="font-semibold text-[#10B981]">+$1,500</p>', '<p class="font-semibold text-[#10B981]">—</p>', 1],
          ["visible to hundreds of brands", "visible to brands", 1],
          ["Join 10,000+ influencers already growing with Brand Corner. It&#x27;s free to join!", "Grow with Brand Corner. It&#x27;s free to join!", 1], copy] },
        "/solutions/agencies": { cut: [grid], swap: [
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
      // Favicon ve 1200×630 paylaşım görseli: dosyalar sites/brandcorner.co'ya konunca devreye girer
      if (existsSync(join(SITE, "icon.png")) && !html.includes('rel="icon"'))
        html = html.replace("</head>", `<link rel="icon" href="/icon.png" type="image/png"/><link rel="apple-touch-icon" href="/icon.png"/></head>`);
      // Footer'daki 4 sosyal ikon href="#" (hesap yok): gövdeye dokunmadan (#418) head CSS ile gizlenir
      if (/<a\b[^>]*href="#"/.test(html) && !html.includes('footer a[href="#"]'))
        html = html.replace("</head>", `<style data-sk-seo>footer a[href="#"]{display:none}</style></head>`);
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
      const graph = noindex ? [] : page === "/"
        ? [org, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: "Brand Corner", publisher: { "@id": ORG }, inLanguage: "en" }]
        : [...(page === "/about" ? [org] : []),
          { "@type": page === "/about" ? "AboutPage" : "WebPage", "@id": url + "#webpage", url, name: h1, isPartOf: { "@id": R.origin + "/#website" }, about: { "@id": ORG }, inLanguage: "en" },
          { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: R.origin + "/" }, { "@type": "ListItem", position: 2, name: crumb, item: url }] }];
      if (graph.length) html = html.replace("</head>", ldTag({ "@context": "https://schema.org", "@graph": graph }) + "</head>");
      // Gövde (RSC verisinden önceki kısım) iddia nötrleme; RSC verisinde bu metinler yok
      const at = html.indexOf("<script>(self.__next_f"), end = at < 0 ? html.length : at;
      return R.body(html.slice(0, end), page) + html.slice(end);
    },
  },
  // SMC: /blog/* (TR/EN) atlanır, çünkü yazılar build-blog.mjs ile başlık, meta ve BlogPosting/FAQ LD dahil üretilir; burada yeniden yazmak onları ezer
  "socialmediacorner.co": {
    origin: "https://socialmediacorner.co",
    brand: "Social Media Corner",
    fix(html, page) {
      const R = this;
      if (/^\/(?:en\/)?blog\//.test(page)) return html;
      const setTitle = t => html.replace(/<title>[^<]*<\/title>/, `<title>${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>`);
      const metas = kind => [new RegExp(`(<meta name="${kind}" content=")([^"]*)(")`), new RegExp(`(<meta property="og:${kind}" content=")([^"]*)(")`), new RegExp(`(<meta name="twitter:${kind}" content=")([^"]*)(")`)];
      // Ana sayfada ikinci H1 -> h2 (aynı sınıflar, görünüm değişmez)
      if (page === "/") {
        html = html.replace(/<h1([^>]*)>(Sosyal Medya Görünümünüzü[\s\S]*?)<\/h1>/g, "<h2$1>$2</h2>");
        html = setTitle("Social Media Corner – Profesyonel Sosyal Medya Yönetimi");
      }
      // Blog şablonu SAAS Corner'dan kopyalanmış: marka başlıkta yanlış
      if (page === "/blog") html = setTitle("Blog: Sosyal Medya, Satış ve Pazarlama | Social Media Corner");
      // 160'tan uzun açıklamalar
      for (const re of metas("description")) html = html.replace(re, (m, a, v, b) => v.length > 160 ? a + attr(metaDescription(text(v))) + b : m);

      // Sayfadaki data-sk-seo LD elle zenginleştirilmiş (#77: founder, parentOrganization, contactPoint): varsa korunur.
      // Yoksa (taze ayna) aynı @id'lerle aynı graph üretilir; yeniden ayna alındığında #77 geri gitmez
      if (page === "/" && !html.includes('data-sk-seo>')) {
        const email = "info@socialmediacorner.co";
        const org = {
          "@type": "Organization", "@id": R.origin + "/#org", name: R.brand, url: R.origin + "/", logo: R.origin + "/_a/fr/images/HZ5MjnQL4L5dlgs5jDednLyCI0.png", email,
          founder: { "@type": "Person", "@id": "https://www.yalcinberkay.com.tr/#person", name: "Berkay Yalçın", url: "https://www.yalcinberkay.com.tr/" },
          parentOrganization: { "@type": "Organization", name: "SAAS Corner", url: "https://saascorner.co", sameAs: ["https://www.linkedin.com/company/saascorner/", "https://www.instagram.com/saascorner.co/", "https://www.trustpilot.com/review/saascorner.co"] },
          contactPoint: { "@type": "ContactPoint", contactType: "customer service", email, availableLanguage: ["tr", "en"] },
        };
        html = html.replace("</head>", ldTag({ "@context": "https://schema.org", "@graph": [org, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: R.brand, publisher: { "@id": org["@id"] }, inLanguage: "tr-TR" }] }) + "</head>");
      }
      return html;
    },
  },
  "saascorner.co": {
    origin: "https://saascorner.co",
    brand: "SAAS Corner",
    // Ana sayfa başlık/açıklamasını kopyalayan yasal sayfalar
    legal: {
      "/kvkk-basvuru-formu": "KVKK kapsamında ilgili kişi olarak SAAS Corner'a başvurunuzu iletebileceğiniz form ve başvuru yöntemleri.",
      "/kullanim-kosullari": "SAAS Corner web sitesinin ve hizmetlerinin kullanımına ilişkin koşullar, hak ve sorumluluklar.",
      "/gizlilik-politikasi": "SAAS Corner'ın kişisel verileri nasıl topladığı, kullandığı ve koruduğuna dair gizlilik politikası.",
      "/aydinlatma-metni/ticari-iletisim": "SAAS Corner ticari elektronik ileti gönderimi ve onayına ilişkin KVKK aydınlatma metni.",
    },
    fix(html, page) {
      const R = this, url = R.origin + (page === "/" ? "/" : page);
      const setTitle = t => html.replace(/<title>[^<]*<\/title>/, `<title>${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>`);
      const metas = kind => [new RegExp(`(<meta name="${kind}" content=")([^"]*)(")`), new RegExp(`(<meta property="og:${kind}" content=")([^"]*)(")`), new RegExp(`(<meta name="twitter:${kind}" content=")([^"]*)(")`)];
      const h2toH1 = t => { html = html.replace(new RegExp(`<h2([^>]*)>(${t}\\s*)</h2>`, "g"), "<h1$1>$2</h1>"); };
      if (page === "/404") return html.replace(/<link rel="canonical"[^>]*>/g, "");
      if (page === "/") html = setTitle("SAAS Corner | Outsourced Lead Generation & B2B Growth");
      if (page === "/iletisim") h2toH1("Bizimle iletişime geçin!");
      if (page === "/bilgi-merkezi") {
        h2toH1("Bilgi Merkezi");
        html = setTitle("Bilgi Merkezi: B2B Satış Rehberleri | SAAS Corner");
      }
      if (R.legal[page]) {
        const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "");
        if (h1) { html = setTitle(`${h1} | ${R.brand}`); for (const re of metas("title")) html = setMeta(html, re, h1); }
        for (const re of metas("description")) html = setMeta(html, re, R.legal[page]);
      }
      // Bilgi merkezi şablonundaki yazım hatası
      for (const re of metas("description")) html = html.replace(re, (m, a, v, b) => a + v.replace(/Oursourced/g, "Outsourced") + b);
      for (const re of metas("description")) html = html.replace(re, (m, a, v, b) => v.length > 160 ? a + attr(metaDescription(text(v))) + b : m);

      html = html.replace(/<script type="application\/ld\+json" data-sk-seo>[\s\S]*?<\/script>/g, "");
      // Organization (+FAQPage) sitenin kendi LD'sinde her sayfada var; yalnızca WebSite eklenir
      const org = { "@type": "Organization", name: R.brand, url: R.origin };
      const ld = [];
      if (page === "/") ld.push({ "@context": "https://schema.org", "@type": "WebSite", url: R.origin + "/", name: R.brand, inLanguage: "tr-TR" });

      const blog = page.startsWith("/blog/"), kb = page.startsWith("/bilgi-merkezi/");
      if (blog) {
        // Yazı başlığı "Heading" h3 (Son Bloglar da aynı adı taşır: yalnızca ilk başlıkla aynı metin) -> h1
        html = html.replace(/(data-framer-name="Heading"[^>]*>)<h1([^>]*)>([\s\S]*?)<\/h1>/g, "$1<h3$2>$3</h3>");
        const first = html.match(/data-framer-name="Heading"[^>]*><h3[^>]*>([\s\S]*?)<\/h3>/)?.[1];
        html = html.replace(/(data-framer-name="Heading"[^>]*>)<h3([^>]*)>([\s\S]*?)<\/h3>/g, (m, a, b, c) => c === first ? `${a}<h1${b}>${c}</h1>` : m);
      }
      if (kb) {
        html = html.replace(/(data-framer-name="title"[^>]*>)<h2([^>]*)>([\s\S]*?)<\/h2>/g, "$1<h1$2>$3</h1>");
        // "-2" kopyaları: aynı başlıklı, %55 örtüşen içerik -> asıl yazıya canonical
        const orig = page.match(/^(\/bilgi-merkezi\/.+)-2$/)?.[1];
        if (orig && existsSync(join(SITE, orig + ".html"))) html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${R.origin}${orig}$2`);
      }
      if (blog || kb) {
        const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "");
        // Aynı konu hem blog'da hem bilgi merkezinde (ve kısaltmalar çakışıyor): kullanılmamış ilk aday;
        // walk sırası sabit olduğundan sonuç her koşuda aynı (idempotent). Asıla canonical veren "-2" kopyalar sayılmaz.
        const sfx = ` | ${R.brand}`, head = h1.split(/[:?!]/)[0].trim(), tag = blog ? " – Blog" : " – Rehber";
        const cut = n => metaDescription(h1, n).replace(/…$/, "").trim();
        const own = !/-2$/.test(page) || html.includes(`<link rel="canonical" href="${url}"`);
        R.used ||= new Set();
        const title = [h1 + sfx, h1, head + sfx, head, head + tag + sfx, head + tag, cut(60), cut(60 - tag.length) + tag]
          .find(t => t.length <= 60 && (!own || !R.used.has(t))) || cut(60);
        if (own) R.used.add(title);
        html = setTitle(title);
        for (const re of metas("title")) html = setMeta(html, re, h1);
        html = html.replace(/(<meta property="og:type" content=")website(")/, "$1article$2");
        const date = html.match(/<time datetime="(\d{4}-\d\d-\d\d)/)?.[1];
        const image = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
        const desc = text(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "");
        ld.push({
          "@context": "https://schema.org", "@type": blog ? "BlogPosting" : "Article", headline: h1, description: desc, inLanguage: "tr-TR",
          ...(image && { image }), ...(date && { datePublished: date, dateModified: date }),
          author: org, publisher: org, mainEntityOfPage: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] || url, url,
        });
      }
      if (ld.length) html = html.replace("</head>", ld.map(ldTag).join("") + "</head>");
      return html;
    },
  },
  "salescorner.co": {
    origin: "https://salescorner.co",
    brand: "Sales Corner",
    pages: {
      "/": ["Sales Corner | Veri Odaklı B2B Satış ve Lead Generation",
        "Sales Corner; hedef pazar araştırması, lead generation, toplantı planlama ve CRM entegrasyonuyla B2B satış sürecinizi veri ve otomasyonla uçtan uca yönetir."],
      "/iletisim": ["İletişim | Sales Corner – B2B Satış Otomasyonu",
        "Sales Corner ekibiyle iletişime geçin: B2B satış, outsourced lead generation, CRM entegrasyonu ve pazarlama çözümleri hakkında bilgi alın."],
    },
    fix(html, page) {
      const R = this;
      const setTitle = t => html.replace(/<title>[^<]*<\/title>/, `<title>${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>`);
      const metas = kind => [new RegExp(`(<meta name="${kind}" content=")([^"]*)(")`), new RegExp(`(<meta property="og:${kind}" content=")([^"]*)(")`), new RegExp(`(<meta name="twitter:${kind}" content=")([^"]*)(")`)];
      if (page === "/404") return html.replace(/<link rel="canonical"[^>]*>/g, "").replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex">');
      // EN sayfaları ve blog (build-blog.mjs) elle/araçla bakılır: başlık, robots ve LD'lerine dokunulmaz
      if (/^\/en\/(?:index|iletisim)$/.test(page) || /^\/(?:en\/)?blog(?:\/|$)/.test(page)) return html;
      const meta = R.pages[page];
      // Diğer sayfalar SAAS Corner'ın iç araçları (login, dashboard, ...): arama sonuçlarına girmez
      if (!meta) return html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
      html = setTitle(meta[0]);
      for (const re of metas("title")) html = setMeta(html, re, meta[0]);
      for (const re of metas("description")) html = setMeta(html, re, meta[1]);
      if (page === "/iletisim") html = html.replace(/<h2([^>]*)>(Bizimle iletişime geçin!\s*)<\/h2>/g, "<h1$1>$2</h1>");

      // Sayfadaki data-sk-seo LD elle zenginleştirilmiş (Org adres/iletişim, founder Person, WebSite inLanguage): varsa korunur.
      // Yoksa (taze ayna) aynı @id'lerle temel graph üretilir; Person build-blog.mjs AUTHOR ile aynı
      if (page === "/" && !html.includes('data-sk-seo>')) {
        const person = { "@type": "Person", "@id": "https://www.yalcinberkay.com.tr/#person", name: "Berkay Yalçın", url: "https://www.yalcinberkay.com.tr/", jobTitle: "Founder & B2B Sales Consultant",
          sameAs: ["https://www.linkedin.com/in/berkayyalcin2/", "https://www.instagram.com/beerkayyalcin"] };
        const org = { "@type": "Organization", "@id": R.origin + "/#org", name: R.brand, url: R.origin + "/", logo: html.match(/<meta property="og:image" content="([^"]*)"/)?.[1], founder: person,
          parentOrganization: { "@id": "https://cornergroup.co/#org", "@type": "Organization", name: "Corner Group", url: "https://cornergroup.co/" } };
        html = html.replace("</head>", ldTag({ "@context": "https://schema.org", "@graph": [org, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: R.brand, publisher: { "@id": org["@id"] }, inLanguage: ["tr-TR", "en"] }] }) + "</head>");
      }
      return html;
    },
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
// Next build latin-ext alt kümelerini (ğ, ş, İ, ₺ …) yayımlamamış; @font-face 404 veriyor, tarayıcı zaten "* Fallback" (Arial) ile çiziyor.
const LATIN_EXT = "U+100-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+304,U+308,U+329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const noFace = (family, weight, file) => [`@font-face{font-family:${family};font-style:normal;font-weight:${weight};font-display:swap;src:url(../media/${file}.woff2)format("woff2");unicode-range:${LATIN_EXT}}`, ""];
const CHUNK_PATCHES = {
  "brandcorner.co": [
    // e34ca4a footer Company listesine Blog ekledi (6 sayfa); i18n sözlüklerinde footer.blog zaten var
    { chunk: "fbb4735ac8b2897c", edits: [['{href:"/press",label:e("footer.press")},', '{href:"/press",label:e("footer.press")},{href:"/blog",label:e("footer.blog")},']] },
    // PR-F: doğrulanamayan sayaçlar, logo şeridi, yorumlar, başarı hikâyeleri ve mockup tutarları
    { chunk: "411b1b9d3b6df8ca", was: ["7cc019c396358bc9"], edits: DICT },
    { chunk: "763536697d8b15ea", was: ["021182790b26378c"], edits: DICT },
    { chunk: "e4b281dafb09dd8b", edits: [  // ana sayfa
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
    { chunk: "265b6dd36dde1597", edits: [  // /solutions/brands
      [statGrid("a"), ""],
      ['(0,a.jsx)("span",{children:"125K followers"})', '(0,a.jsx)("span",{children:"Followers"})'],
      ['(0,a.jsx)("span",{children:"4.8% engagement"})', '(0,a.jsx)("span",{children:"Engagement"})'],
      ['children:"+24 new"', 'children:"New"'],
      ['children:"+340%"', 'children:"—"'],
      ['"Join 500+ brands already using Brand Corner to transform their influencer marketing."', '"Use Brand Corner to transform your influencer marketing."'],
      ['"Influencer pazarlamasını dönüştürmek için Brand Corner kullanan 500+ markaya katılın."', '"Influencer pazarlamanızı Brand Corner ile dönüştürün."'],
    ] },
    { chunk: "51d3cf739a8640a6", edits: [  // /solutions/influencers
      [statGrid("s"), ""],
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
    { chunk: "4897118e349b9d9c", edits: [  // /solutions/agencies
      [statGrid("t"), ""],
      ['[{name:"Sarah J.",campaigns:5,earnings:"$12,500"},{name:"Mike R.",campaigns:3,earnings:"$8,200"},{name:"Emma L.",campaigns:4,earnings:"$10,800"}]',
        '[{name:("en"===l?"Talent":"Yetenek")+" A",campaigns:5,earnings:"—"},{name:("en"===l?"Talent":"Yetenek")+" B",campaigns:3,earnings:"—"},{name:("en"===l?"Talent":"Yetenek")+" C",campaigns:4,earnings:"—"}]'],
      ['children:"$45,200"', 'children:"—"'],
      ['"Join leading agencies already managing their talents with Brand Corner."', '"Manage your talents with Brand Corner."'],
      ['"Yeteneklerini Brand Corner ile yöneten önde gelen ajanslara katılın."', '"Yeteneklerinizi Brand Corner ile yönetin."'],
    ] },
    { chunk: "5c127651fc7ca527", edits: [  // /features
      ["analyzes thousands of profiles", "analyzes profiles"],
      ["üzere binlerce profili analiz eder.", "üzere profilleri analiz eder."],
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
  ],
};
const splice = (src, from, to, chunk) => {
  const [a, z] = typeof from === "string" ? [from, null] : [from.from, from.until];
  const i = src.indexOf(a);
  if (i < 0 || src.indexOf(a, i + 1) >= 0) throw new Error(`chunk yaması tek eşleşmeli: ${chunk}: ${a.slice(0, 60)}`);
  const j = z === null ? i + a.length : src.indexOf(z, i + a.length);
  if (j < 0) throw new Error(`chunk yaması bitişi yok: ${chunk}: ${z.slice(0, 60)}`);
  return src.slice(0, i) + to + src.slice(j);
};

const rule = RULES[host];
if (!rule) { console.error(`kural yok: ${host}`); process.exit(1); }
const renames = [];
for (const p of CHUNK_PATCHES[host] || []) {
  const dir = join(SITE, "_next/static/chunks"), ext = p.ext || "js", src = await readFile(join(dir, `${p.chunk}.${ext}`), "utf8");
  const out = p.edits.reduce((s, [from, to]) => splice(s, from, to, p.chunk), src), name = createHash("sha256").update(out).digest("hex").slice(0, 16);
  const left = rule.CLAIMS && out.match(rule.CLAIMS);  // EN + TR sözlük dahil yamalı chunk'ta da iddia kalmasın
  if (left) throw new Error(`${p.chunk}: doğrulanamayan iddia kaldı: ${left[0]}`);
  if (!existsSync(join(dir, `${name}.${ext}`))) await writeFile(join(dir, `${name}.${ext}`), out);
  for (const old of [p.chunk, ...(p.was || [])]) renames.push([`/_next/static/chunks/${old}.${ext}`, `/_next/static/chunks/${name}.${ext}`]);
}
let n = 0;
const used = new Set();
for await (const f of walk(SITE)) {
  const page = "/" + relative(SITE, f).replace(/\.html$/, "").replace(/^index$/, "");  // index -> "/"
  const before = await readFile(f, "utf8");
  let after = rule.fix(before, page);
  for (const [a, b] of renames) after = after.replaceAll(a, b);
  for (const [, b] of renames) if (after.includes(b)) used.add(b);
  if (after !== before) { await writeFile(f, after); n++; }
}
const unused = [...new Set(renames.map(([, b]) => b))].filter(b => !used.has(b));
if (unused.length) throw new Error(`yamalı chunk hiçbir sayfada yok (önceki adı was'a ekle): ${unused.join(", ")}`);
console.log(`seo: ${host} ${n} dosya güncellendi${(CHUNK_PATCHES[host] || []).length ? `, ${CHUNK_PATCHES[host].length} chunk yamalandı` : ""}`);
