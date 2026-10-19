import { SITE, text, attr, setMeta, ldTag, existsSync, join, metaDescription } from "../core.mjs";

  // SMC: /blog/* (TR/EN) atlanır, çünkü yazılar build-blog.mjs ile başlık, meta ve BlogPosting/FAQ LD dahil üretilir; burada yeniden yazmak onları ezer
export const rule = {
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
      return html;
    },
};
