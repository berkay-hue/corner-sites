import { SITE, text, attr, setMeta, ldTag, existsSync, join, metaDescription } from "../core.mjs";

export const rule = {
    origin: "https://www.yalcinberkay.com.tr",
    // Sayfalardaki Person düğümünün tek kaynağı; Organization @id'leri ilgili sitelerin kendi graph'ıyla aynı
    person: (() => {
      const id = "https://www.yalcinberkay.com.tr/#person", founder = { "@id": id };
      const org = (name, url, oid) => ({ "@type": "Organization", ...(oid && { "@id": oid }), name, url, founder });
      return {
        "@type": "Person", "@id": id, name: "Berkay Yalçın", alternateName: "Berkay YALÇIN", url: "https://www.yalcinberkay.com.tr/",
        image: "https://www.yalcinberkay.com.tr/_a/fr/images/tfHxTGcPg5W1q2kXiuBQynltGIA_d8696c1a.png", jobTitle: "Founder & B2B Sales Consultant",
        description: "Founder of SAAS Corner, Sales Corner, Social Media Corner, Brand Corner, CRM Corner and Corner Group; B2B sales consultant with 10+ years of experience, specialising in outbound sales, lead generation and CRM.",
        worksFor: [org("SAAS Corner", "https://saascorner.co", "https://saascorner.co/#org"), org("Corner Group", "https://cornergroup.co", "https://cornergroup.co/#org"),
          org("Sales Corner", "https://salescorner.co", "https://salescorner.co/#org"), org("Social Media Corner", "https://socialmediacorner.co", "https://socialmediacorner.co/#org"),
          org("Brand Corner", "https://www.brandcorner.co", "https://www.brandcorner.co/#org"), org("WishCEO", "https://wishceo.com", "https://wishceo.com/#org"),
          org("CRM Corner", "https://crmcorner.co")],
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
};
