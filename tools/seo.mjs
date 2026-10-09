// Mirror sonrası SEO düzeltmeleri (idempotent). Kullanım: node tools/seo.mjs <host>
// Şimdilik yalnızca yalcinberkay.com.tr; diğer siteler kendi kurallarıyla eklenecek.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { existsSync } from "node:fs";
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
    person: {
      "@type": "Person", "@id": "https://www.yalcinberkay.com.tr/#person", name: "Berkay YALÇIN",
      url: "https://www.yalcinberkay.com.tr/", jobTitle: "Sales Consultant",
      worksFor: { "@type": "Organization", name: "SAAS Corner", url: "https://saascorner.co" },
      sameAs: ["https://linkedin.com/in/berkayyalcin2", "https://www.instagram.com/beerkayyalcin"],
    },
    fix(html, page) {
      const R = this;
      // Şablondan kalan Framer affiliate linki ("via=mejed_k")
      html = html.replace(/\s*\|\s*Powered by\s*(?:<!--\$-->)?<a[^>]*framer\.com[^>]*>Framer<\/a>(?:<!--\/\$-->)?/g, "");
      // Şablon yazar adı
      html = html.replace(/ - Sawad(?=["<])/g, " - Berkay YALÇIN");
      // Ana sayfada ikinci H1 ("X YEARS OF EXPERIENCE") -> h2 (aynı sınıflar, görünüm değişmez)
      if (page === "/") html = html.replace(/<h1([^>]*)>(\d+ YEARS OF[\s\S]*?)<\/h1>/g, "<h2$1>$2</h2>");
      // 404: canonical olmamalı
      if (page === "/404") html = html.replace(/<link rel="canonical"[^>]*>\s*/g, "");

      html = html.replace(/<script type="application\/ld\+json" data-sk-seo>[\s\S]*?<\/script>/g, "");
      const ld = [];
      const url = R.origin + (page === "/" ? "/" : page);
      if (page === "/") ld.push({ "@context": "https://schema.org", "@graph": [R.person, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: "Berkay YALÇIN", publisher: { "@id": R.person["@id"] }, inLanguage: "en" }] });

      if (page.startsWith("/blog/")) {
        const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "");
        const paras = [...html.matchAll(/<p class="framer-text[^"]*"[^>]*>([\s\S]*?)<\/p>/g)].flatMap(m => m[1].split(/<br[^>]*>/).map(text)).filter(t => t.length > 60);
        // Paragraf içinde nokta sonrası boşluk eksik ("platforms.Surveying")
        const desc = metaDescription((paras[0] || h1).replace(/([a-z])\.([A-Z])/g, "$1. $2"));
        for (const re of [/(<meta name="description" content=")([^"]*)(")/, /(<meta property="og:description" content=")([^"]*)(")/, /(<meta name="twitter:description" content=")([^"]*)(")/])
          html = setMeta(html, re, desc);
        const title = `${h1} - Berkay YALÇIN`.length <= 60 ? `${h1} - Berkay YALÇIN` : /[:!?]/.test(h1.slice(0, -1)) ? h1.split(/[:!?]/)[0].trim() + " - Berkay YALÇIN" : h1;
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>`);
        html = html.replace(/(<meta property="og:type" content=")website(")/, "$1article$2");
        const d = html.match(/>((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4})</)?.[1];
        const date = d ? new Date(d + " 12:00 UTC").toISOString().slice(0, 10) : undefined;
        const image = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
        ld.push({
          "@context": "https://schema.org", "@type": "BlogPosting", headline: h1, description: desc,
          ...(image && { image }), ...(date && { datePublished: date, dateModified: date }),
          author: R.person, publisher: { "@id": R.person["@id"] }, mainEntityOfPage: url, url,
        });
      }
      if (ld.length) html = html.replace("</head>", ld.map(ldTag).join("") + "</head>");
      return html;
    },
  },
  "brandcorner.co": {
    origin: "https://www.brandcorner.co",
    // v0 şablonu her sayfaya aynı başlık/açıklamayı veriyor; sayfaya özel değerler H1 ve altındaki ilk paragraftan
    fix(html, page) {
      const R = this, url = R.origin + (page === "/" ? "/" : page);
      const at = html.indexOf("<h1");
      const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "");
      const lead = text(html.slice(at).match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] || "");
      const title = page === "/" ? "Brand Corner - Influencer Marketing Platform" : `${h1} | Brand Corner`;
      const desc = metaDescription(page === "/" ? `Connect brands with the right influencers. ${lead}` : lead);
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
        .replace(/(\\"(?:name|property)\\":\\"(?:og:|twitter:)?description\\",\\"content\\":)\\"(?:[^\\]|\\\\.)*?\\"(?=\})/g, `$1${rsc(desc)}`));
      html = html.replace(/<link rel="canonical"[^>]*>|<meta property="og:(?:url|site_name)"[^>]*>/g, "");
      html = html.replace(/(<meta property="og:title")/, `<link rel="canonical" href="${url}"/><meta property="og:url" content="${url}"/><meta property="og:site_name" content="Brand Corner"/>$1`);
      html = html.replace(/<script type="application\/ld\+json" data-sk-seo>[\s\S]*?<\/script>/g, "");
      if (page === "/") html = html.replace("</head>", ldTag({ "@context": "https://schema.org", "@graph": [
        { "@type": "Organization", "@id": R.origin + "/#org", name: "Brand Corner", url: R.origin + "/" },
        { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: "Brand Corner", publisher: { "@id": R.origin + "/#org" }, inLanguage: "en" }] }) + "</head>");
      return html;
    },
  },
  "socialmediacorner.co": {
    origin: "https://socialmediacorner.co",
    brand: "Social Media Corner",
    fix(html, page) {
      const R = this, url = R.origin + (page === "/" ? "/" : page);
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

      html = html.replace(/<script type="application\/ld\+json" data-sk-seo>[\s\S]*?<\/script>/g, "");
      const org = { "@type": "Organization", "@id": R.origin + "/#org", name: R.brand, url: R.origin + "/", logo: R.origin + "/_a/fr/images/HZ5MjnQL4L5dlgs5jDednLyCI0.png" };
      const ld = [];
      if (page === "/") ld.push({ "@context": "https://schema.org", "@graph": [org, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: R.brand, publisher: { "@id": org["@id"] }, inLanguage: "tr-TR" }] });

      if (page.startsWith("/blog/")) {
        // Yazı başlığı hero'daki Heading içinde h3 (breakpoint varyantı başına bir kopya, yalnızca biri görünür) -> h1
        // ("Son Bloglar" gibi bölüm başlıkları da Heading adını taşır: yalnızca ilk başlığın metniyle aynı olanlar)
        html = html.replace(/(data-framer-name="Heading"[^>]*>)<h1([^>]*)>([\s\S]*?)<\/h1>/g, "$1<h3$2>$3</h3>");
        const first = html.match(/data-framer-name="Heading"[^>]*><h3[^>]*>([\s\S]*?)<\/h3>/)?.[1];
        html = html.replace(/(data-framer-name="Heading"[^>]*>)<h3([^>]*)>([\s\S]*?)<\/h3>/g, (m, a, b, c) => c === first ? `${a}<h1${b}>${c}</h1>` : m);
        const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "");
        const sfx = ` | ${R.brand}`, head = h1.split(/[:?!]/)[0].trim();
        const title = [h1 + sfx, h1, head + sfx, head].find(t => t.length <= 60) || metaDescription(h1, 60).replace(/…$/, "");
        html = setTitle(title);
        for (const re of metas("title")) html = setMeta(html, re, h1);
        html = html.replace(/(<meta property="og:type" content=")website(")/, "$1article$2");
        const AY = ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"];
        const dm = html.match(/data-framer-name="Published[^"]*"[^>]*><p[^>]*>(\d{1,2}) ([A-Za-zÇĞİÖŞÜçğıöşü]+) (\d{4})<\/p>/);
        const mi = dm ? AY.indexOf(dm[2].toLocaleLowerCase("tr")) : -1;
        const date = mi >= 0 ? `${dm[3]}-${String(mi + 1).padStart(2, "0")}-${dm[1].padStart(2, "0")}` : undefined;
        const image = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
        const desc = text(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "");
        ld.push({
          "@context": "https://schema.org", "@type": "BlogPosting", headline: h1, description: desc, inLanguage: "tr-TR",
          ...(image && { image }), ...(date && { datePublished: date, dateModified: date }),
          author: org, publisher: org, mainEntityOfPage: url, url,
        });
      }
      if (ld.length) html = html.replace("</head>", ld.map(ldTag).join("") + "</head>");
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
      "/iletisim": ["İletişim | Sales Corner",
        "Sales Corner ekibiyle iletişime geçin: B2B satış, outsourced lead generation, CRM entegrasyonu ve pazarlama çözümleri hakkında bilgi alın."],
    },
    fix(html, page) {
      const R = this;
      const setTitle = t => html.replace(/<title>[^<]*<\/title>/, `<title>${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>`);
      const metas = kind => [new RegExp(`(<meta name="${kind}" content=")([^"]*)(")`), new RegExp(`(<meta property="og:${kind}" content=")([^"]*)(")`), new RegExp(`(<meta name="twitter:${kind}" content=")([^"]*)(")`)];
      if (page === "/404") return html.replace(/<link rel="canonical"[^>]*>/g, "").replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex">');
      const meta = R.pages[page];
      // Diğer sayfalar SAAS Corner'ın iç araçları (login, dashboard, ...): arama sonuçlarına girmez
      if (!meta) return html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
      html = setTitle(meta[0]);
      for (const re of metas("title")) html = setMeta(html, re, meta[0]);
      for (const re of metas("description")) html = setMeta(html, re, meta[1]);
      if (page === "/iletisim") html = html.replace(/<h2([^>]*)>(Bizimle iletişime geçin!\s*)<\/h2>/g, "<h1$1>$2</h1>");

      html = html.replace(/<script type="application\/ld\+json" data-sk-seo>[\s\S]*?<\/script>/g, "");
      if (page === "/") {
        const org = { "@type": "Organization", "@id": R.origin + "/#org", name: R.brand, url: R.origin + "/", logo: html.match(/<meta property="og:image" content="([^"]*)"/)?.[1] };
        html = html.replace("</head>", ldTag({ "@context": "https://schema.org", "@graph": [org, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: R.brand, publisher: { "@id": org["@id"] }, inLanguage: "tr-TR" }] }) + "</head>");
      }
      return html;
    },
  },
};

const rule = RULES[host];
if (!rule) { console.error(`kural yok: ${host}`); process.exit(1); }
let n = 0;
for await (const f of walk(SITE)) {
  const page = "/" + relative(SITE, f).replace(/\.html$/, "").replace(/^index$/, "");  // index -> "/"
  const before = await readFile(f, "utf8");
  const after = rule.fix(before, page);
  if (after !== before) { await writeFile(f, after); n++; }
}
console.log(`seo: ${host} ${n} dosya güncellendi`);
