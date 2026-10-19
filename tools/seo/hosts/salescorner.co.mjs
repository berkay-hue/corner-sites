import { SITE, text, attr, setMeta, ldTag, existsSync, join, metaDescription } from "../core.mjs";

export const rule = {
    origin: "https://salescorner.co",
    brand: "Sales Corner",
    pages: {
      "/": ["Sales Corner | Veri Odaklı B2B Satış ve Lead Generation",
        "Sales Corner, AI ve n8n ile B2B satışı otomatikleştiren satış otomasyonu ajansıdır: pazar araştırması, lead generation, toplantı planı, CRM entegrasyonu."],
      "/iletisim": ["İletişim | Sales Corner – B2B Satış Otomasyonu",
        "Sales Corner ekibiyle iletişime geçin: B2B satış, outsourced lead generation, CRM entegrasyonu ve pazarlama çözümleri hakkında bilgi alın."],
      "/hizmetler": ["Hizmetler | Sales Corner",
        "Sales Corner hizmetleri: AI ve n8n ile lead generation, CRM senkronizasyonu, email ve WhatsApp otomasyonu, toplantı brifingi, görüşme analizi ve teklif hazırlama."],
      "/hakkimizda": ["Hakkımızda | Sales Corner",
        "Sales Corner, AI ve n8n ile B2B satış süreçlerini otomatikleştiren, Corner Group çatısı altındaki satış otomasyonu ajansıdır. Kurucu: Berkay Yalçın."],
    },
    services: ["Lead generation", "CRM senkronizasyonu", "Email ve WhatsApp otomasyonu", "Toplantı brifingi ve görüşme analizi", "Rakip analizi ve teklif hazırlama"],
    fix(html, page) {
      const R = this;
      const setTitle = t => html.replace(/<title>[^<]*<\/title>/, `<title>${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>`);
      const metas = kind => [new RegExp(`(<meta name="${kind}" content=")([^"]*)(")`), new RegExp(`(<meta property="og:${kind}" content=")([^"]*)(")`), new RegExp(`(<meta name="twitter:${kind}" content=")([^"]*)(")`)];
      if (page === "/404") return html.replace(/<link rel="canonical"[^>]*>/g, "").replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex">');
      // EN sayfaları ve blog (build-blog.mjs) elle/araçla bakılır: başlık, robots ve LD'lerine dokunulmaz
      if (/^\/en\/(?:index|contact)$/.test(page) || /^\/(?:en\/)?blog(?:\/|$)/.test(page)) return html;
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
      // Org'a hizmet kataloğu: yalnız hizmetler.html'deki başlıklar, rakam yok (görev 368)
      if (page === "/") html = html.replace(/(<script type="application\/ld\+json"[^>]*>)(.*?)(<\/script>)/gs, (m, a, body, c) => {
        let d; try { d = JSON.parse(body); } catch { return m; }
        const org = (d["@graph"] || [d]).find(n => n["@id"] === R.origin + "/#org");
        if (!org || org.hasOfferCatalog) return m;
        org.hasOfferCatalog = { "@type": "OfferCatalog", name: "Sales Corner hizmetleri", url: R.origin + "/hizmetler",
          itemListElement: R.services.map(name => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, provider: { "@id": org["@id"] } } })) };
        return a + JSON.stringify(d) + c;
      });
      return html;
    },
};
