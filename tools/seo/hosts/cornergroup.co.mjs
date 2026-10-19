import { SITE, text, attr, setMeta, ldTag, existsSync, join, metaDescription } from "../core.mjs";

export const rule = {
    origin: "https://cornergroup.co",
    brand: "Corner Group",
    // Blog yazıları build-blog.mjs ile üretilir (başlık/açıklama/BlogPosting orada); burada yalnızca sabit sayfalar
    fix(html, page) {
      const R = this;
      html = html.replace(/<script type="application\/ld\+json" data-sk-seo>[\s\S]*?<\/script>/g, "");
      // İletişim başlığı: "Bizimle çalışalım" yerine "Birlikte çalışalım"
      html = html.replace(">BİZİMLE<!-- --> <span", ">BİRLİKTE<!-- --> <span");
      // Grup şirketleri sayfalarına iç link: Framer #main dışında, </body> öncesi statik blok (hydration'a girmez)
      if (page === "/" || page === "/en/index" || page === "/en/") {
        const en = page !== "/", base = en ? "/en/companies/" : "/sirketler/";
        const co = [["saascorner", "SAAS Corner"], ["salescorner", "Sales Corner"], ["brandcorner", "Brand Corner"], ["socialmediacorner", "Social Media Corner"], ["wishceo", "WishCEO"], ["yalcinberkay", "Berkay Yalçın"]];
        const block = `<nav data-cg-companies aria-label="${en ? "Group companies" : "Grup şirketleri"}" style="background:#0A0A0B;padding:28px 16px 104px;text-align:center;font-family:Inter,-apple-system,sans-serif;font-size:14px;border-top:1px solid rgba(255,255,255,0.06)"><span style="color:#888;margin-right:8px">${en ? "Group companies:" : "Grup şirketleri:"}</span>` +
          co.map(([s, n]) => `<a href="${base}${s}" style="color:#FFB71B;text-decoration:none;margin:0 10px;display:inline-block;padding:10px 0">${n}</a>`).join("") + `</nav>`;
        html = html.replace(/<nav data-cg-companies[\s\S]*?<\/nav>/, "").replace("</body>", block + "</body>");
        // Ölü butonlar (statik kopya, JS yok): yörünge kısaltmaları ve şirket butonları şirket sitesine, CTA'lar/robot iletişime, grafik #roi'ye
        const contact = en ? "/en/contact" : "/iletisim";
        const js = `(function(){var S={SA:"https://saascorner.co",CC:"https://crmcorner.co",SC:"https://salescorner.co",BC:"https://www.brandcorner.co",SM:"https://socialmediacorner.co"},` +
          `N=[["SAAS Corner","SA"],["CRM Corner","CC"],["Social Media Corner","SM"],["Sales Corner","SC"],["Brand Corner","BC"]],C="${contact}",` +
          `M={"Giriş":"#home",Intro:"#home",Markalar:"#brands",Brands:"#brands","Stack Builder":"#stackbuilder",Ekosistem:"#ecosystem",Ecosystem:"#ecosystem",ROI:"#roi",` +
          `"Büyüme Hikayesi":"#growth","Growth Story":"#growth","Canlı Otomasyon":"#automation","Live Automation":"#automation","Neden Biz":"#why","Why Us":"#why","İletişim":"#contact",Contact:"#contact",` +
          `"Size hangi Corner uygun?":"#stackbuilder","Size Hangi Corner?":"#stackbuilder","Kendi paketini kur":"#stackbuilder","AI Danışmana sor":C},` +
          `Q=/teklif|projeksiyon|toplant|keşif|quote|projection|meeting|discovery/i;` +
          `function L(e,u){if(!e||e.closest("a")||e.__cg)return;e.__cg=1;e.style.cursor="pointer";e.setAttribute("role","link");e.tabIndex=0;` +
          `var f=function(){location.href=u};e.addEventListener("click",f);e.addEventListener("keydown",function(k){if(k.key==="Enter")f()})}` +
          `function go(){document.querySelectorAll("span").forEach(function(s){var t=s.textContent.trim();if(S[t]&&s.parentElement&&/counterOrbit/.test(s.parentElement.getAttribute("style")||""))L(s.parentElement,S[t])});` +
          `document.querySelectorAll("button").forEach(function(b){var t=b.textContent.trim(),st=(b.parentElement&&b.parentElement.getAttribute("style"))||"";` +
          `if(/position:fixed;bottom:24px;right:24px/.test(st))return L(b,C);if(/position:fixed;bottom:24px;left:24px/.test(st))return L(b,"#roi");` +
          `if(M[t])return L(b,M[t]);if(t.length<80&&Q.test(t)&&!/v\\d/.test(t))return L(b,C);if(t.length<200)for(var i=0;i<N.length;i++)if(t.indexOf(N[i][0])===0)return L(b,S[N[i][1]])})}` +
          `document.readyState==="loading"?addEventListener("DOMContentLoaded",go):go()})()`;
        html = html.replace(/<script data-cg-links>[\s\S]*?<\/script>/, "").replace("</body>", `<script data-cg-links>${js}</script></body>`);
      }
      // Grup şirketi düğümleri: @id/url/ad, şirketin kendi sitesindeki Organization düğümüyle aynı (canlıda doğrulandı).
      // SAAS Corner'ın @id'sini A şeridi kendi sitesine ekliyor; CRM Corner'da @id yok, uydurulmaz.
      const SUB = { "https://saascorner.co": "https://saascorner.co/", "https://salescorner.co": "https://salescorner.co/", "https://socialmediacorner.co": "https://socialmediacorner.co/",
        "https://www.brandcorner.co": "https://www.brandcorner.co/", "https://wishceo.com": "https://wishceo.com/" };
      html = html.replace(/(<script type="application\/ld\+json" data-cg-ld>)([\s\S]*?)(<\/script>)/g, (m, a, json, b) => {
        const walk = n => {
          if (Array.isArray(n)) return n.forEach(walk);
          if (!n || typeof n !== "object") return;
          if (n.name === "SaaS Corner" && /^https:\/\/saascorner\.co\/?$/.test(n.url || "")) n.name = "SAAS Corner";
          const id = n["@id"]?.replace(/\/#org(-cg)?$/, ""), key = id ?? (n["@type"] === "Organization" && n.url?.replace(/\/$/, ""));
          if (key && SUB[key]) {
            const ent = Object.entries(n), out = { "@type": n["@type"] };
            if (!n["@type"]) delete out["@type"];
            out["@id"] = SUB[key] + "#org";
            for (const [k, v] of ent) if (k !== "@type" && k !== "@id") out[k] = k === "url" ? SUB[key] : v;
            for (const k of Object.keys(n)) delete n[k];
            Object.assign(n, out);
          }
          Object.values(n).forEach(walk);
        };
        const ld = JSON.parse(json), before = JSON.stringify(ld); walk(ld);
        return JSON.stringify(ld) === before ? m : a + JSON.stringify(ld) + b;
      });
      if (page !== "/") return html;
      html = html.replace(/<title>[^<]*<\/title>/, "<title>Corner Group | B2B Satış, Pazarlama ve CRM Çözümleri</title>");
      const org = { "@type": "Organization", "@id": R.origin + "/#org", name: R.brand, url: R.origin + "/", logo: R.origin + "/_a/fr/images/6WSE5LNdHL8DI6oGFkxraYy6Dg.png" };
      const ld = { "@context": "https://schema.org", "@graph": [org, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: R.brand, publisher: { "@id": org["@id"] }, inLanguage: "tr-TR" }] };
      // WebPage: ad/açıklama sayfanın title ve meta description'ıyla aynı
      const name = text(html.match(/<title>([^<]*)<\/title>/)[1]), description = text(html.match(/<meta name="description" content="([^"]*)"/)[1]);
      ld["@graph"].push({ "@type": "WebPage", "@id": R.origin + "/#webpage", url: R.origin + "/", name, description, isPartOf: { "@id": R.origin + "/#website" }, about: { "@id": org["@id"] }, publisher: { "@id": org["@id"] }, inLanguage: "tr-TR" });
      return html.replace("</head>", ldTag(ld) + "</head>");
    },
};
