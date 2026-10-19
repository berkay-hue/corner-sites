import { SITE, text, attr, setMeta, ldTag, existsSync, join, metaDescription } from "../core.mjs";

// <div ...> açılışından eşleşen </div>'e kadar olan aralığın sonu (iç içe div sayılır)
const divEnd = (html, i) => {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = i;
  for (let depth = 0, m; (m = re.exec(html));) if ((depth += m[0] === "</div>" ? -1 : 1) === 0) return re.lastIndex;
  return -1;
};

  // SMC: /blog/* (TR/EN) atlanır, çünkü yazılar build-blog.mjs ile başlık, meta ve BlogPosting/FAQ LD dahil üretilir; burada yeniden yazmak onları ezer
export const rule = {
    origin: "https://socialmediacorner.co",
    brand: "Social Media Corner",
    // Görev 215: site araması da aynı eski metni göstermesin
    files: {
      "_a/fr/sites/3ddpnibf9YvA3arhvREVUM/searchIndex-FeAl8UKWvLPu.json": (src) => {
        const idx = JSON.parse(src);
        for (const [url, doc] of Object.entries(idx)) for (const [k, v] of Object.entries(doc)) {
          if (!Array.isArray(v)) continue;
          doc[k] = v.filter((t) => t !== "Get Alter" && !(url.startsWith("/blog") ? false : /CRM Corner|HubSpot|^Herhangi bir araç sağlıyor musunuz\?$/.test(t)))
            .map((t) => t === "© 2025 SAAS Corner" ? "© 2026 Social Media Corner — bir Corner Group şirketi" : t === "Made by SAAS Corner" ? "Made by Corner Group" : t);
        }
        return JSON.stringify(idx);
      },
    },
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

      // Çatı kuruluş Corner Group (cornergroup.co/#org); eski SAAS Corner düğümü tüm sayfalarda değiştirilir
      html = html.split('"parentOrganization":{"@type":"Organization","name":"SAAS Corner","url":"https://saascorner.co","sameAs":["https://www.linkedin.com/company/saascorner/","https://www.instagram.com/saascorner.co/","https://www.trustpilot.com/review/saascorner.co"]}')
        .join('"parentOrganization":{"@type":"Organization","@id":"https://cornergroup.co/#org","name":"Corner Group","url":"https://cornergroup.co/"}');
      // Sayfadaki data-sk-seo LD elle zenginleştirilmiş (#77: founder, parentOrganization, contactPoint): varsa korunur.
      // Yoksa (taze ayna) aynı @id'lerle aynı graph üretilir; yeniden ayna alındığında #77 geri gitmez
      if (page === "/" && !html.includes('data-sk-seo>')) {
        const email = "info@socialmediacorner.co";
        const org = {
          "@type": "Organization", "@id": R.origin + "/#org", name: R.brand, url: R.origin + "/", logo: R.origin + "/_a/fr/images/HZ5MjnQL4L5dlgs5jDednLyCI0.png", email,
          founder: { "@type": "Person", "@id": "https://www.yalcinberkay.com.tr/#person", name: "Berkay Yalçın", url: "https://www.yalcinberkay.com.tr/" },
          parentOrganization: { "@type": "Organization", "@id": "https://cornergroup.co/#org", name: "Corner Group", url: "https://cornergroup.co/" },
          contactPoint: { "@type": "ContactPoint", contactType: "customer service", email, availableLanguage: ["tr", "en"] },
        };
        html = html.replace("</head>", ldTag({ "@context": "https://schema.org", "@graph": [org, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: R.brand, publisher: { "@id": org["@id"] }, inLanguage: "tr-TR" }] }) + "</head>");
      }
      // Görev 215 (BODY): Framer şablonundan kalan gövde parçaları; ayna yeniden alınsa da kural tekrar temizler
      // 1) 'Get Alter' remix butonu (framer.com/projects/new?duplicate=...)
      html = html.replace(/<!--\$--><a [^>]*href="https:\/\/framer\.com\/projects\/new\?duplicate=[^"]*"[\s\S]*?Get Alter<\/p><\/div><\/a><!--\/\$-->/g, "");
      // 2) Eski SAAS Corner / CRM Corner / HubSpot SSS maddeleri (soru+cevap kartı bütünüyle çıkar)
      const faq = /<div class="framer-[a-z0-9]+-container" data-sk-reveal[^>]*><div class="framer-kFUTx/g;
      for (let m; (m = faq.exec(html));) {
        const end = divEnd(html, m.index);
        if (end > 0 && /CRM Corner|HubSpot|SAAS Corner/.test(html.slice(m.index, end))) { html = html.slice(0, m.index) + html.slice(end); faq.lastIndex = m.index; }
      }
      // Kardeş şirket logosunun alt metni
      html = html.replace(/alt="CRM Corner logosu"/g, 'alt="Corner Group şirket logosu"').replace(/alt="CRM Corner logo"/g, 'alt="Corner Group company logo"');
      // 3) Footer: SAAS Corner → Social Media Corner, bir Corner Group şirketi
      const en = /^\/en(\/|$)/.test(page);
      html = html.replace(/© 2025 SAAS Corner/g, en ? "© 2026 Social Media Corner — a Corner Group company" : "© 2026 Social Media Corner — bir Corner Group şirketi")
        .replace(/href="https:\/\/saascorner\.co" target="_blank" rel="noopener">SAAS Corner<\/a>/g, 'href="https://cornergroup.co/" target="_blank" rel="noopener">Corner Group</a>');
      return html;
    },
};
