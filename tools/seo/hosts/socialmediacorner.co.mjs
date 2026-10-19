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

      // 19 Eki denetimi (smc-02…11)
      const words = (from, to) => { const run = w => w.split(" ").map(x => `<span style="display:inline-block">${x}</span>`).join(" "); html = html.split(run(from)).join(run(to)); };
      // smc-02: footer'da KVKK / gizlilik bağlantısı
      html = html.replace(/(— bir Corner Group şirketi)<\/p>/g, '$1 · <a class="framer-text" href="/kvkk">KVKK Aydınlatma Metni</a></p>')
        .replace(/(— a Corner Group company)<\/p>/g, '$1 · <a class="framer-text" href="/en/privacy">Privacy Notice</a></p>');
      // smc-02: iletişim formunun altında kısa bilgilendirme
      if (page === "/iletisim" || page === "/en/contact") html = html.replace(/(<\/button><\/div><\/div>)(<\/form>)/g, en
        ? '$1<p class="sk-kvkk-note" style="font-size:12px;opacity:.75;margin:8px 0 0">The details you send are used only to reply to you. <a href="/en/privacy">Privacy Notice</a></p>$2'
        : '$1<p class="sk-kvkk-note" style="font-size:12px;opacity:.75;margin:8px 0 0">Gönderdiğiniz bilgiler yalnızca size dönüş yapmak için kullanılır. <a href="/kvkk">KVKK Aydınlatma Metni</a></p>$2');
      // smc-03: menüde Fiyatlandırma → /fiyatlar, yanına Hakkımızda (#pricing'li öğe bir kez dönüşür, ikinci çalıştırmada eşleşmez)
      html = html.replace(/<!--\$--><div class="(framer-[a-z0-9]+-container)"><!--\$--><a ([^>]*?)href="[^"]*#pricing"([^>]*)>(<div[^>]*><p[^>]*>)(Fiyatlandırma|Pricing)<\/p><\/div><\/a><!--\/\$--><\/div><!--\/\$-->/g, (m, c, a, b, inner, label) => {
        const item = (href, text) => `<!--$--><div class="${c}"><!--$--><a ${a}href="${href}"${b}>${inner}${text}</p></div></a><!--/$--></div><!--/$-->`;
        return label === "Pricing" ? item("/en/pricing", "Pricing") + item("/en/about", "About") : item("/fiyatlar", "Fiyatlandırma") + item("/hakkimizda", "Hakkımızda");
      });
      // smc-04: hakkımızda/fiyatlar ↔ EN karşılıkları (hreflang + dil düğmesi)
      const pair = { "/hakkimizda": "/en/about", "/fiyatlar": "/en/pricing" }[page];
      if (pair && !html.includes('hreflang="en" href="' + R.origin + pair + '"')) html = html.replace(/(<link rel="alternate" hreflang="tr" href="[^"]*">)/, `$1<link rel="alternate" hreflang="en" href="${R.origin + pair}">`);
      if (pair) html = html.replace('<a href="/en/" hreflang="en"', `<a href="${pair}" hreflang="en"`);
      // smc-05: kopya "SaaS" hizmet düğümü yerine genel, teklif bazlı hizmet
      const service = u => (u = u.replace(/index$/, ""), { "@context": "https://schema.org", "@type": "Service", "@id": R.origin + u + "#service", name: en ? "Social media management" : "Sosyal medya yönetimi",
        description: en ? "Instagram and LinkedIn management for brands: strategy, content, ads and reporting from one team. Pricing is by tailored quote." : "Markalar için Instagram ve LinkedIn yönetimi: strateji, içerik, reklam ve raporlama tek ekipten. Fiyat, ihtiyaca göre hazırlanan teklifle belirlenir.",
        serviceType: en ? "Social media management" : "Sosyal medya yönetimi", url: R.origin + u, areaServed: en ? "Worldwide" : "TR", provider: { "@id": R.origin + "/#org" } });
      if (page === "/fiyatlar" || page === "/hakkimizda") html = html.replace(/<script type="application\/ld\+json" data-smc-ld>\{"@context":"https:\/\/schema\.org","@type":"Service","@id":"[^"]*#service","name":"SaaS şirketleri için[^<]*<\/script>/, ldTag(service(page)).replace("<script ", "<script data-smc-ld ").replace("data-smc-ld data-sk-seo", "data-smc-ld"));
      if ((page === "/" || page === "/en/index") && !html.includes('#service"')) html = html.replace("</head>", ldTag(service(page)).replace(/ data-sk-seo/, " data-smc-ld") + "</head>");
      // smc-07: Organization sameAs = sitedeki sosyal bağlantılar
      html = html.split('"email":"info@socialmediacorner.co","founder"').join('"email":"info@socialmediacorner.co","sameAs":["https://www.instagram.com/saascorner.co/","https://www.linkedin.com/company/saascorner/"],"founder"');
      // smc-08: şablondan kalan İngilizce/anlamsız metinler
      html = html.replace(/>Popular</g, en ? ">Popular<" : ">Popüler<").replace(/>kullanıcı\/ay</g, ">size özel<").replace(/>user\/month</g, ">tailored to you<")
        .replace(/>Your Queries, Simplified</g, en ? ">Common Questions<" : ">Merak Edilenler<");
      if (!en) html = html.replace(/(data-nested-link="true" role="link" tabindex="0">)FAQs</g, "$1SSS<");
      words("Yapay Zeka ve Pazarlamayı Birleştirin!", "Sosyal Medyanızı Birlikte Büyütelim!");
      words("Çeşitli ve dinamik gerçek dünya ortamlarında potansiyel müşteri oluşturmayı ve müşteri etkileşimini otomatikleştirin.", "Strateji, içerik ve reklamı tek ekipten yönetelim; size özel teklifinizi hazırlayalım.");
      words("AI Meets Marketing", "Let's Grow Your Social Media");
      words("Automate lead generation and customer engagement across real-world, fast-moving channels.", "Strategy, content and ads from one team, with a quote tailored to you.");
      // smc-09: cevabı olmayan iki SSS kartı (mobil görünüm) çıkar; e-posta Cloudflare gizlemesinden muaf
      const faqM = /<div class="framer-[a-z0-9]+-container"[^>]*><div class="framer-kFUTx/g;
      for (let m; (m = faqM.exec(html));) {
        const end = divEnd(html, m.index), card = html.slice(m.index, end);
        if (end > 0 && !card.includes('data-framer-name="Content"') && /Herhangi bir araç sağlıyor|Farklı satış ve pazarlama|Do you provide any tools\?|What else do you offer across sales/.test(card)) { html = html.slice(0, m.index) + html.slice(end); faqM.lastIndex = m.index; }
      }
      html = html.replace(/(>(?:Detaylı sorular için ulaşın :|More questions\? Email us:) +)info@socialmediacorner\.co</g, "$1<!--email_off-->info@socialmediacorner.co<!--/email_off--><");
      // smc-10: çatı Corner Group
      html = html.split("Social Media Corner, SAAS Corner çatısı altında").join("Social Media Corner, Corner Group çatısı altında")
        .split("a social media management service from SAAS Corner that").join("a Corner Group social media management service that")
        .split("Social Media Corner, SAAS Corner'ın markasıdır ve Corner Group çatısı altında").join("Social Media Corner, Corner Group çatısı altında")
        .split("çalışan SAAS Corner'ın markasıdır ve Corner Group çatısı altında").join("Corner Group çatısı altında");
      // smc-11: yazım ve başlık
      html = html.replace(/Sürdürebilirlik/g, "Sürdürülebilirlik");
      words("7/24 Ulaşın!", "Bize Ulaşın");
      words("Reach Us 24/7", "Get in Touch");
      return html;
    },
};
