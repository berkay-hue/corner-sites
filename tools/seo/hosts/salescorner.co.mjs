import { SITE, text, attr, setMeta, ldTag, existsSync, join, metaDescription } from "../core.mjs";

export const rule = {
    origin: "https://salescorner.co",
    brand: "Sales Corner",
    pages: {
      "/": ["Sales Corner | Veri Odaklı B2B Satış ve Lead Generation",
        "Sales Corner, AI ve n8n ile B2B satışı otomatikleştiren satış otomasyonu ajansıdır: pazar araştırması, lead generation, toplantı planı, CRM entegrasyonu."],
      "/iletisim": ["İletişim | Sales Corner – B2B Satış Otomasyonu",
        "Sales Corner ekibiyle iletişime geçin: B2B satış, outsourced lead generation, CRM entegrasyonu ve pazarlama çözümleri hakkında bilgi alın."],
      "/kvkk": ["KVKK Aydınlatma Metni | Sales Corner",
        "Sales Corner (salescorner.co) kişisel verilerin işlenmesine ilişkin 6698 sayılı KVKK aydınlatma metni."],
      "/gizlilik-politikasi": ["Gizlilik Politikası | Sales Corner",
        "Sales Corner (salescorner.co) gizlilik politikası: hangi verileri topladığımız, nasıl kullandığımız ve haklarınız."],
      "/kullanim-kosullari": ["Kullanım Koşulları | Sales Corner",
        "Sales Corner (salescorner.co) web sitesi kullanım koşulları."],
      "/hizmetler": ["Hizmetler | Sales Corner",
        "Sales Corner hizmetleri: HubSpot entegrasyonu, AI ve n8n ile satış otomasyonu (email, WhatsApp, toplantı brifingi, görüşme analizi), lead generation ve teklif hazırlama."],
      "/hakkimizda": ["Hakkımızda | Sales Corner",
        "Sales Corner, AI ve n8n ile B2B satış süreçlerini otomatikleştiren, Corner Group çatısı altındaki satış otomasyonu ajansıdır. Kurucu: Berkay Yalçın."],
    },
    // Sıra Berkay'ın kararı (19 Eki): ana odak HubSpot entegrasyonu, ikinci AI otomasyonu; hizmetler.html h2'leriyle aynı
    services: ["HubSpot entegrasyonu", "AI otomasyonu", "Lead generation", "Rakip analizi ve teklif hazırlama"],
    fix(html, page) {
      const R = this;
      // Cloudflare e-posta gizleme ayarı açık kalır; görünen adresler <!--email_off--> ile hariç tutulur (script/style ve etiket içleri hariç)
      html = html.replace(/<!--email_off-->[\s\S]*?<!--\/email_off-->|<(script|style)\b[\s\S]*?<\/\1>|<a\b[^>]*href="mailto:[^"]*"[^>]*>[\s\S]*?<\/a>|<[^>]*>|[^<]+/g, m =>
        m.startsWith("<!--") || /^<(?:script|style)\b/.test(m) ? m
          : m.startsWith("<a") && /href="mailto:/.test(m.slice(0, m.indexOf(">"))) ? `<!--email_off-->${m}<!--/email_off-->`
          : m[0] === "<" ? m : m.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, e => `<!--email_off-->${e}<!--/email_off-->`));
      const cg = en => en ? 'a <a href="https://cornergroup.co/">Corner Group</a> company' : 'bir <a href="https://cornergroup.co/">Corner Group</a> şirketi';
      // F7 footer + yetim /hizmetler, /hakkimizda linkleri (ana sayfalar)
      if (page === "/" || page === "/en/index") {
        html = html.replace(" Sales Corner — AI-Powered B2B Automation · ", ` Sales Corner — ${cg(page !== "/")} · `);
        if (page === "/") html = html.replace('<span class="sc-legal"><a href="/kvkk">', '<span class="sc-legal"><a href="/hizmetler">Hizmetler</a> · <a href="/hakkimizda">Hakkımızda</a> · <a href="/kvkk">');
      }
      // İletişim formu: KVKK onay kutusu zorunlu, adı "onay"; konu sırası HubSpot → AI otomasyonu → mevcutlar
      if (page === "/iletisim" || page === "/en/contact") {
        const tr = page === "/iletisim";
        html = html.replace(/(type="checkbox") name="Newsletter"/g, '$1 name="onay" required');
        html = html.replace(/(<select name="Reason"[^>]*><option value disabled selected>[^<]*<\/option>)(?!<option value="HubSpot Integration")/,
          `$1<option value="HubSpot Integration">${tr ? "HubSpot entegrasyonu" : "HubSpot Integration"}</option><option value="AI Automation">${tr ? "AI otomasyonu" : "AI Automation"}</option>`);
        if (tr) {
          for (const [a, b] of [["Joe Smith", "Ad Soyad"], ["Your@email.com", "ornek@firma.com"], ["Phone Number", "Telefon numarası"], ["Message", "Mesajınız"]])
            html = html.split(`placeholder="${a}"`).join(`placeholder="${b}"`);
          html = html.split("Formdaki konu başlıkları satış toplantısı üretimi, yeni ülkeye açılma, satış danışmanlığı ve LinkedIn danışmanlığıdır. Bunlara ek olarak lead generation, CRM senkronizasyonu, email otomasyonu ve toplantı sonrası follow-up gibi süreçleri AI workflow'larıyla otomatikleştiriyoruz.")
            .join("Ana odağımız HubSpot entegrasyonu, ikincisi AI otomasyonudur: email otomasyonu, toplantı sonrası follow-up ve lead generation gibi süreçleri AI workflow'larıyla otomatikleştiriyoruz. Formdaki diğer konu başlıkları satış toplantısı üretimi, yeni ülkeye açılma, satış danışmanlığı ve LinkedIn danışmanlığıdır.");
        }
        if (!html.includes('class="sc-foot"')) html = html.replace('<div style="border-top:1px solid rgba(14,14,12,0.12)"></div></section>', '<div style="border-top:1px solid rgba(14,14,12,0.12)"></div><nav class="sc-foot" style="display:flex;flex-wrap:wrap;gap:4px 16px;padding:24px 0;font:15px/1.6 \'DM Sans\',sans-serif;color:rgb(34,34,30)">'
          + (tr ? '<a href="/hizmetler">Hizmetler</a><a href="/hakkimizda">Hakkımızda</a><a href="/kvkk">KVKK</a><a href="/gizlilik-politikasi">Gizlilik</a><a href="/kullanim-kosullari">Koşullar</a>' : '<a href="/en/privacy">Privacy</a><a href="/en/terms">Terms</a>')
          + `<span style="width:100%">© 2026 Sales Corner — ${cg(!tr)}</span><style>.sc-foot a{color:inherit;min-height:44px;display:inline-flex;align-items:center}</style></nav></section>`);
      }
      if (page === "/404") {
        for (const [a, b] of [[">Homepage<", ">Ana sayfa<"], [">Oops<", ">Hay aksi<"], [">Page doesn't exist<", ">Sayfa bulunamadı<"]]) html = html.split(a).join(b);
        if (!html.includes('class="sk-404"')) html = html.replace("</body>", '<nav class="sk-404" style="position:fixed;left:0;right:0;bottom:72px;display:flex;justify-content:center;gap:8px 24px;flex-wrap:wrap;font:600 15px/1 Inter,system-ui,sans-serif;z-index:40"><a href="/hizmetler">Hizmetler</a><a href="/blog">Blog</a><a href="/iletisim">İletişim</a><style>.sk-404 a{color:#fff;text-decoration:none;min-height:44px;display:inline-flex;align-items:center}</style></nav></body>');
      }
      const setTitle = t => html.replace(/<title>[^<]*<\/title>/, `<title>${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>`);
      const metas = kind => [new RegExp(`(<meta name="${kind}" content=")([^"]*)(")`), new RegExp(`(<meta property="og:${kind}" content=")([^"]*)(")`), new RegExp(`(<meta name="twitter:${kind}" content=")([^"]*)(")`)];
      if (page === "/404") return html.replace(/<link rel="canonical"[^>]*>/g, "").replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex">');
      // EN sayfaları ve blog (build-blog.mjs) elle/araçla bakılır: başlık, robots ve LD'lerine dokunulmaz
      if (/^\/en\/(?:index|contact|privacy|terms)$/.test(page) || /^\/(?:en\/)?blog(?:\/|$)/.test(page)) return html;
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
        if (!org) return m;
        org.hasOfferCatalog = { "@type": "OfferCatalog", name: "Sales Corner hizmetleri", url: R.origin + "/hizmetler",
          itemListElement: R.services.map(name => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, provider: { "@id": org["@id"] } } })) };
        return a + JSON.stringify(d) + c;
      });
      return html;
    },
};
