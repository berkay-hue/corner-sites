import { SITE, text, attr, setMeta, ldTag, existsSync, join, metaDescription } from "../core.mjs";

export const rule = {
    origin: "https://saascorner.co",
    brand: "SAAS Corner",
    // Ana sayfa başlık/açıklamasını kopyalayan yasal sayfalar
    legal: {
      "/kvkk-basvuru-formu": "KVKK kapsamında ilgili kişi olarak SAAS Corner'a başvurunuzu iletebileceğiniz form ve başvuru yöntemleri.",
      "/kullanim-kosullari": "SAAS Corner web sitesinin ve hizmetlerinin kullanımına ilişkin koşullar, hak ve sorumluluklar.",
      "/gizlilik-politikasi": "SAAS Corner'ın kişisel verileri nasıl topladığı, kullandığı ve koruduğuna dair gizlilik politikası.",
      "/aydinlatma-metni/ticari-iletisim": "SAAS Corner ticari elektronik ileti gönderimi ve onayına ilişkin KVKK aydınlatma metni.",
    },
    // Hesaplanan başlığı anlamsız kalan sayfalar (elle verilmiş başlık)
    titles: {
      "/bilgi-merkezi/musteri-memnuniyeti-den-musteri-memnuniyeti2-e-saas-lead-7urturing-yolculugu-2": "SaaS Lead Nurturing Yolculuğu | SAAS Corner",
    },
    fix(html, page) {
      const R = this, url = R.origin + (page === "/" ? "/" : page);
      const setTitle = t => html.replace(/<title>[^<]*<\/title>/, `<title>${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>`);
      const metas = kind => [new RegExp(`(<meta name="${kind}" content=")([^"]*)(")`), new RegExp(`(<meta property="og:${kind}" content=")([^"]*)(")`), new RegExp(`(<meta name="twitter:${kind}" content=")([^"]*)(")`)];
      const h2toH1 = t => { html = html.replace(new RegExp(`<h2([^>]*)>(${t}\\s*)</h2>`, "g"), "<h1$1>$2</h1>"); };
      if (page === "/404") return html.replace(/<link rel="canonical"[^>]*>/g, "");
      // Blog yazıları (build-blog.mjs, data-sk-post LD), /blog listesi, sektör ve EN sayfaları elle/araçla bakılır:
      // başlık, açıklama ve LD'lerine (data-sk-seo dahil) dokunulmaz
      if (/^\/(?:en|sektor)\//.test(page) || /^\/blog(?:\/|$)/.test(page)) return html;
      if (page === "/") html = setTitle("Nitelikli Satış Toplantıları Getiriyoruz | SAAS Corner");
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

      // Eski data-sk-seo LD'nin yerinde yenisi yazılır (sonradan eklenen blokların önünde kalır, ikinci koşu fark üretmez)
      const MARK = "\0sk-seo-ld\0";
      let first = true;
      html = html.replace(/<script type="application\/ld\+json" data-sk-seo>[\s\S]*?<\/script>/g, () => first ? (first = false, MARK) : "");
      // Organization (+FAQPage) sitenin kendi LD'sinde her sayfada var; yalnızca WebSite eklenir
      // Sitenin Organization LD'sine kalıcı @id ve çatı şirket; diğer düğümler bu @id'ye bağlanır
      const ORG = R.origin + "/#org";
      html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (m, a, j, b) => {
        let o; try { o = JSON.parse(j); } catch { return m; }
        if (o["@type"] !== "Organization" || o.url !== R.origin) return m;
        const { "@context": c, "@type": t, ...rest } = o;
        return a + JSON.stringify({ "@context": c, "@type": t, "@id": ORG, ...rest, parentOrganization: { "@type": "Organization", "@id": "https://cornergroup.co/#org", name: "Corner Group", url: "https://cornergroup.co" } }) + b;
      });
      const org = { "@id": ORG };
      const ld = [];
      if (page === "/") ld.push({ "@context": "https://schema.org", "@type": "WebSite", url: R.origin + "/", name: R.brand, inLanguage: "tr-TR", publisher: org });

      const kb = page.startsWith("/bilgi-merkezi/");
      if (kb) {
        html = html.replace(/(data-framer-name="title"[^>]*>)<h2([^>]*)>([\s\S]*?)<\/h2>/g, "$1<h1$2>$3</h1>");
        // "-2" kopyaları: aynı başlıklı, %55 örtüşen içerik -> asıl yazıya canonical
        const orig = page.match(/^(\/bilgi-merkezi\/.+)-2$/)?.[1];
        if (orig && existsSync(join(SITE, orig + ".html"))) html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${R.origin}${orig}$2`);
        const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "");
        // Kısaltmalar çakışabiliyor: kullanılmamış ilk aday;
        // walk sırası sabit olduğundan sonuç her koşuda aynı (idempotent). Asıla canonical veren "-2" kopyalar sayılmaz.
        const sfx = ` | ${R.brand}`, head = h1.split(/[:?!]/)[0].trim(), tag = " – Rehber";
        const cut = n => metaDescription(h1, n).replace(/…$/, "").trim();
        const own = !/-2$/.test(page) || html.includes(`<link rel="canonical" href="${url}"`);
        R.used ||= new Set(Object.values(R.titles || {})); // elle verilen başlıklar başka sayfaya düşmesin
        const title = R.titles[page] || [h1 + sfx, h1, head + sfx, head, head + tag + sfx, head + tag, cut(60), cut(60 - tag.length) + tag]
          .find(t => t.length <= 60 && (!own || !R.used.has(t))) || cut(60);
        if (own) R.used.add(title);
        html = setTitle(title);
        for (const re of metas("title")) html = setMeta(html, re, h1);
        html = html.replace(/(<meta property="og:type" content=")website(")/, "$1article$2");
        const date = html.match(/<time datetime="(\d{4}-\d\d-\d\d)/)?.[1];
        const image = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
        const desc = text(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "");
        // "-2" kopyada url de asıl yazıyı gösterir (canonical ile aynı)
        const canon = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] || url;
        ld.push({
          "@context": "https://schema.org", "@type": "Article", headline: h1, description: desc, inLanguage: "tr-TR",
          ...(image && { image }), ...(date && { datePublished: date, dateModified: date }),
          author: org, publisher: org, mainEntityOfPage: canon, url: canon,
        });
      }
      const tags = ld.map(ldTag).join("");
      html = html.includes(MARK) ? html.replace(MARK, () => tags) : tags ? html.replace("</head>", () => tags + "</head>") : html;
      return html;
    },
};
