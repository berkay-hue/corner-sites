import { SITE, text, attr, setMeta, ldTag, existsSync, join, metaDescription } from "../core.mjs";

export const rule = {
    origin: "https://www.brandcorner.co",
    FAQ: {
      en: [
        ["Can I change plans later?", "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."],
        ["What payment methods do you accept?", "Online payments are not accepted at the moment."],
        ["Is there a contract or commitment?", "No long-term contracts required. Monthly plans can be cancelled anytime. Yearly plans are billed annually but can be cancelled with remaining time prorated."],
        // Eklenen sorular yalnız fiyat kartlarında yazanlardan; deneme süresi ve iade Berkay doğrulayana kadar yazılmaz
        ["Is there a free plan?", "Yes. The Starter plan is free and includes influencer browsing, 3 campaigns per month, basic analytics and email support."],
        ["How much does the Professional plan cost?", "The Professional plan is $99 per month. It adds unlimited campaigns, advanced analytics, priority support, team collaboration for 3 users and custom reports."],
        ["What does the Enterprise plan include?", "Enterprise has custom pricing. It includes everything in Professional plus unlimited users, a dedicated account manager, custom integrations and white-label options. Contact sales for a quote."],
        ["Do I need a credit card to start?", "No. You can start on the free plan without a credit card."]],
      tr: [
        ["Planımı daha sonra değiştirebilir miyim?", "Evet! Planınızı istediğiniz zaman yükseltebilir veya düşürebilirsiniz. Değişiklikler bir sonraki fatura döneminin başında yürürlüğe girer."],
        ["Hangi ödeme yöntemlerini kabul ediyorsunuz?", "Şu an online ödeme alınmıyor."],
        ["Sözleşme veya taahhüt var mı?", "Uzun vadeli sözleşme gerekmez. Aylık planlar her zaman iptal edilebilir. Yıllık planlar yıllık olarak faturalandırılır ancak kalan süre orantılı olarak iptal edilebilir."],
        ["Ücretsiz plan var mı?", "Evet. Starter planı ücretsizdir; influencer arama, ayda 3 kampanya, temel analitik ve e-posta desteği içerir."],
        ["Professional planın fiyatı nedir?", "Professional planı aylık 99 $'dır. Sınırsız kampanya, gelişmiş analitik, öncelikli destek, 3 kullanıcılı ekip çalışması ve özel raporlar ekler."],
        ["Enterprise planı neleri içerir?", "Enterprise fiyatı size özeldir. Professional'daki her şeye ek olarak sınırsız kullanıcı, özel hesap yöneticisi, özel entegrasyonlar ve white-label seçenekleri içerir. Teklif için satış ekibiyle görüşün."],
        ["Başlamak için kredi kartı gerekir mi?", "Hayır. Ücretsiz planla kredi kartı olmadan başlayabilirsiniz."]],
    },
    // v0 şablonu her sayfaya aynı başlık/açıklamayı veriyor. Sayfa başına [başlık ≤60, açıklama ≤155, breadcrumb adı], sitedeki metinden
    META: {
      "/": ["Brand Corner - Influencer Marketing Platform", "Connect brands with the right influencers. An all-in-one influencer marketing platform to manage campaigns, discover talent, and track performance."],
      "/features": ["Influencer Marketing Features | Brand Corner", "Brand Corner is an influencer marketing platform with discovery and matching, campaign management, analytics, messaging, payments and integrations.", "Features"],
      "/pricing": ["Pricing and Plans | Brand Corner", "Compare Brand Corner's Starter, Professional and Enterprise plans side by side, with a feature comparison and answers to frequently asked questions.", "Pricing"],
      "/solutions/brands": ["Influencer Marketing for Brands | Brand Corner", "Brand Corner helps brands discover, connect, and collaborate with influencers who align with their brand values, with advanced search and analytics.", "For Brands"],
      "/solutions/influencers": ["For Influencers: Get Discovered by Brands | Brand Corner", "Brand Corner helps influencers get discovered by brands, receive quality offers, and manage collaborations, contracts and payments in one place.", "For Influencers"],
      "/solutions/agencies": ["Influencer Agency Management Tools | Brand Corner", "Brand Corner gives agencies tools to manage their talent roster, orchestrate client campaigns, and automate reporting with a dedicated client portal.", "For Agencies"],
      "/about": ["About Brand Corner", "Brand Corner is an influencer marketing platform connecting brands, influencers, and agencies worldwide. Built in Istanbul as part of Corner Group.", "About"],
      "/contact": ["Contact Brand Corner", "Contact the Brand Corner team about influencer campaigns, plans, or partnerships. Send us a message and we will get back to you.", "Contact"],
      "/privacy": ["Privacy Policy | Brand Corner", "How the Brand Corner website handles personal data: the newsletter form, hosting, cookies and local storage, and your rights under the GDPR and KVKK.", "Privacy Policy"],
      "/kvkk": ["KVKK Aydınlatma Metni | Brand Corner", "Brand Corner hesabı için kişisel verilerin hangi amaçla işlendiği, kimlere aktarıldığı, ne kadar saklandığı ve KVKK 11. madde kapsamındaki haklarınız.", "KVKK Aydınlatma Metni"],
      "/terms": ["Terms of Service | Brand Corner", "The terms for using the Brand Corner website and panel: your account, your content, brand and influencer roles, acceptable use and liability.", "Terms of Service"],
      "/404": ["Page Not Found | Brand Corner", "This page could not be found."],
      // Giriş, kayıt, şifre sıfırlama ve panel: noindex, sitemap'te yok
      "/giris": ["Giriş | Brand Corner", "Brand Corner hesabınıza giriş yapın."],
      "/login": ["Log in | Brand Corner", "Log in to your Brand Corner account."],
      "/kayit": ["Kayıt ol | Brand Corner", "Marka, influencer ya da ajans olarak Brand Corner hesabı oluşturun."],
      "/register": ["Sign up | Brand Corner", "Create a Brand Corner account as a brand, influencer or agency."],
      "/sifremi-unuttum": ["Şifremi unuttum | Brand Corner", "Brand Corner hesabınızın şifresini sıfırlamak için link isteyin."],
      "/forgot-password": ["Forgot password | Brand Corner", "Request a link to reset your Brand Corner password."],
      "/sifre-yenile": ["Yeni şifre | Brand Corner", "Brand Corner hesabınız için yeni bir şifre belirleyin."],
      "/reset-password": ["New password | Brand Corner", "Set a new password for your Brand Corner account."],
      "/panel": ["Panel | Brand Corner", "Brand Corner panel."],
    },
    // (FOOTER aşağıda: Integrations/Security/Careers/Press çıkar, KVKK ve Corner Group linkleri girer)
    // Doğrulanamayan iddialar (500+/10,000+ sayaçları, logo şeridi, yorumlar, başarı hikâyeleri, mockup tutarları, © 2025) nötrlenir.
    // Gövde SSR çıktısı: her değişiklik CHUNK_PATCHES'teki istemci yamasıyla birebir aynı olmalı, yoksa hydration #418 verir.
    // cut: açılış etiketinden eşi olan kapanışa kadar silinir; section: başlığı içeren <section> silinir; swap: [eski, yeni, beklenen adet]
    BODY: (() => {
      const copy = ["<p>© 2025 Brand Corner. All rights reserved.</p>", "<p>© Brand Corner. All rights reserved.</p>", 1];
      const grid = '<div class="mt-10 grid grid-cols-3 gap-6">';
      const social = '<div class="mt-6 flex gap-4">';  // footer'daki 4 sosyal ikon href="#" (hesap yok)
      // Hero: "No credit card required · 14-day free trial" yalnız sayfa sonundaki CTA'daydı; butonların altına da girer
      // (aynı sözlük anahtarları ve ikonlar). Ana sayfa chunk'ındaki hero yamasıyla birebir
      const svg = (n, d) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${n} h-4 w-4 text-primary">${d}</svg>`;
      const trust = '<div class="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground lg:justify-start">';
      const trial = ["Watch Demo</button></div>" + trust, "Watch Demo</button></div>"
        + '<div class="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-foreground lg:justify-start">' + [
          ["shield", '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>', "No credit card required"],
          ["clock", '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>', "14-day free trial"],
        ].map(([n, d, t]) => `<div class="flex items-center gap-2">${svg(n, d)}<span>${t}</span></div>`).join("") + "</div>" + trust, 1];
      return {
        "/": { cut: ['<div class="mt-16 border-t border-border pt-8 lg:mt-24">', social], section: [">Trusted by Industry Leaders</h2>", ">Success Stories</h2>"], swap: [
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
          ["Join thousands of brands, influencers, and agencies growing with Brand Corner.", "Brands, influencers, and agencies can grow with Brand Corner.", 1], trial, copy] },
        "/features": { cut: [social], swap: [["analyzes thousands of profiles", "analyzes profiles", 1], copy] },
        // SSS akordeonu kapalıyken cevaplar HTML'de yok: düz liste olur (chunk'ta aynı değişiklik), SSR dili EN
        "/pricing": { cut: [social], swap: [copy, ['role="switch" aria-checked=', 'role="switch" aria-label="Yearly" aria-checked=', 1], ['We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for enterprise plans.', 'Online payments are not accepted at the moment.', 1]], put: [['<div data-slot="accordion" class="mt-10"', faqHtml]] },
        "/solutions/brands": { cut: [grid, social], swap: [
          ["<span>125K followers</span>", "<span>Followers</span>", 4],
          ["<span>4.8% engagement</span>", "<span>Engagement</span>", 4],
          ['<p class="font-semibold text-foreground">+24 new</p>', '<p class="font-semibold text-foreground">New</p>', 1],
          ['text-[#10B981]">+340%</p>', 'text-[#10B981]">—</p>', 1],
          ["Join 500+ brands already using Brand Corner to transform their influencer marketing.", "Use Brand Corner to transform your influencer marketing.", 1], copy] },
        "/solutions/influencers": { cut: [grid, social], section: [">Influencer Success Stories</h2>"], swap: [
          ['<p class="text-sm text-muted-foreground">Fashion Brand - $1,500</p>', '<p class="text-sm text-muted-foreground">Fashion Brand</p>', 1],
          ['<div class="font-mono text-2xl font-bold text-foreground">$4,250</div>', '<div class="font-mono text-2xl font-bold text-foreground">—</div>', 1],
          ['text-[#10B981]">+32%</div>', 'text-[#10B981]">—</div>', 1],
          ['<p class="font-semibold text-[#10B981]">+$1,500</p>', '<p class="font-semibold text-[#10B981]">—</p>', 1],
          ["visible to hundreds of brands", "visible to brands", 1],
          ["Join 10,000+ influencers already growing with Brand Corner. It&#x27;s free to join!", "Grow with Brand Corner. It&#x27;s free to join!", 1], copy] },
        "/solutions/agencies": { cut: [grid, social], swap: [
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
      // 6 Next sayfasının footer'ı (chunk'taki FOOTER yamasıyla birebir, yoksa #418) ve kullanılmayan font önyüklemeleri (PRE)
      if (T.swap) T.swap = [...T.swap.filter(x => !FOOTER.includes(x) && !LOGO.includes(x) && !PRE.includes(x)), ...FOOTER, ...LOGO, ...PRE];
      // <a><button> (header menüsü 5 öğe + ana sayfada "View All Plans") yerine tek <a data-slot="button">: chunk'lardaki
      // Button asChild yamasıyla birebir. 0 ise önceki koşuda çevrilmiştir
      if (T.swap) { const n = page === "/" ? 6 : 5, k = (b.match(LINKBTN) || []).length;
        if (k && k !== n) throw new Error(`brandcorner ${page}: <a><button> ${k} kez, beklenen ${n}`);
        b = b.replace(LINKBTN, '<a data-slot="button" class="$2" href="$1">$3</a>'); }
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
      for (const [open, html] of T.put || []) { const i = b.indexOf(open); if (i >= 0) { b = drop(i, open); b = b.slice(0, i) + html() + b.slice(i); } }  // put: öğeyi html() ile değiştirir
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
      // kvkk ↔ privacy hreflang çiftine x-default (İngilizce sayfa)
      html = html.replace(/<link rel="alternate" hreflang="x-default"[^>]*>/g, "");
      if (html.includes('hreflang="tr" href="https://www.brandcorner.co/kvkk"'))
        html = html.replace("</head>", `<link rel="alternate" hreflang="x-default" href="https://www.brandcorner.co/privacy"/></head>`);
      // Favicon ve 1200×630 paylaşım görseli: dosyalar sites/brandcorner.co'ya konunca devreye girer
      if (existsSync(join(SITE, "icon.png")) && !html.includes('rel="icon"'))
        html = html.replace("</head>", `<link rel="icon" href="/icon.png" type="image/png"/><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/></head>`);
      // Footer'daki sosyal ikonlar artık gövdeden ve chunk'tan birlikte siliniyor (BODY cut + CHUNK_PATCHES); eski gizleme CSS'i kalkar
      html = html.replace('<style data-sk-seo>footer a[href="#"]{display:none}</style>', "");
      // Skip link (Next sayfaları; statik sayfalarda HTML'de). React 19 body'ye eklenmiş fazladan etiketi hydration'da atlar
      if (html.includes('<main class="flex-1">') && !html.includes('class="sk-skip"')) html = html
        .replace("</head>", '<style data-sk-skip>.sk-skip{position:absolute;left:-9999px;top:8px;z-index:100;padding:8px 12px;border-radius:6px;background:#fff;color:#111}.sk-skip:focus{left:8px}</style></head>')
        .replace(/(<body\b[^>]*>)/, '$1<a class="sk-skip" href="#main">Skip to content</a>')
        .replace('<main class="flex-1">', '<main id="main" class="flex-1">');
      // Mobil/dokunmatikte 44px dokunma alanı + mobil menü iç boşluğu. Katmansız CSS, Tailwind'in @layer utilities'ini ezer;
      // yalnız <head>'e eklenir (gövde aynı, #418 yok). Her çalıştırmada silinip yeniden yazılır; panel kendi stilini taşır
      html = html.replace(/<style data-sk-tap>[\s\S]*?<\/style>/, "");
      if (page !== "/panel") html = html.replace("</head>", `<style data-sk-tap>${TAP}</style></head>`);
      // WCAG AA metin kontrastı (yalnız Next sayfaları; statik sayfalarda bu sınıflar yok)
      html = html.replace(/<style data-sk-con>[\s\S]*?<\/style>/, "");
      if (html.includes("/_next/static/")) html = html.replace("</head>", `<style data-sk-con>${CON}</style></head>`);
      // Yerleşim düzeltmeleri (yalnız Next sayfaları, yalnız CSS; gövde aynı)
      html = html.replace(/<style data-sk-ux>[\s\S]*?<\/style>/, "");
      if (html.includes("/_next/static/")) html = html.replace("</head>", `<style data-sk-ux>${UX}</style></head>`);
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
        parentOrganization: { "@type": "Organization", "@id": "https://cornergroup.co/#org", name: "Corner Group", url: "https://cornergroup.co/" },
        contactPoint: { "@type": "ContactPoint", email: "info@saascorner.co", contactType: "customer support", availableLanguage: ["en", "tr"] },
        // Brand Corner'ın kendi sosyal hesabı yok; saascorner.co'daki SAAS Corner hesapları (Ana, 19 Eki)
        sameAs: ["https://www.linkedin.com/company/saascorner/", "https://www.instagram.com/saascorner.co/"] };
      const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "");
      // /kvkk tek Türkçe yasal sayfa: dil ve breadcrumb "Ana Sayfa"
      const tr = /<html lang="tr"/.test(html);
      const graph = noindex ? [] : page === "/"
        ? [org, { "@type": "WebSite", "@id": R.origin + "/#website", url: R.origin + "/", name: "Brand Corner", publisher: { "@id": ORG }, inLanguage: "en" }]
        : [...(page === "/about" ? [org] : []),
          { "@type": page === "/about" ? "AboutPage" : page === "/contact" ? "ContactPage" : "WebPage", "@id": url + "#webpage", url, name: h1, description: desc, isPartOf: { "@id": R.origin + "/#website" }, about: { "@id": ORG }, inLanguage: tr ? "tr" : "en" },
          { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: tr ? "Ana Sayfa" : "Home", item: R.origin + "/" }, { "@type": "ListItem", position: 2, name: crumb, item: url }] }];
      // /pricing: FAQPage görünür (SSR, EN) SSS ile birebir; TR yalnız dil değişince istemcide. Teklifler fiyat kartlarından;
      // Enterprise fiyatsız olduğundan Offer'a girmez, deneme/iade süresi Berkay doğrulayana kadar şemada yok
      if (page === "/pricing") graph.push(
        { "@type": "FAQPage", "@id": url + "#faq", url, inLanguage: "en", isPartOf: { "@id": url + "#webpage" },
          mainEntity: R.FAQ.en.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: ans } })) },
        { "@type": "SoftwareApplication", "@id": R.origin + "/#app", name: "Brand Corner", url: R.origin + "/", applicationCategory: "BusinessApplication",
          operatingSystem: "Web", description: "Connecting brands, influencers, and agencies worldwide", publisher: { "@id": ORG },
          offers: [{ "@type": "Offer", name: "Starter", price: "0", priceCurrency: "USD", url },
            { "@type": "Offer", name: "Professional", price: "99", priceCurrency: "USD", url,
              priceSpecification: { "@type": "UnitPriceSpecification", price: "99", priceCurrency: "USD", unitCode: "MON", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" } } }] });
      if (graph.length) html = html.replace("</head>", ldTag({ "@context": "https://schema.org", "@graph": graph }) + "</head>");
      // Gövde (RSC verisinden önceki kısım) iddia nötrleme; RSC verisinde bu metinler yok
      const at = html.indexOf("<script>(self.__next_f"), end = at < 0 ? html.length : at;
      const tail = HL.reduce((s, h) => s.split(h).join(""), html.slice(end));  // font önyükleme ipuçları (PRE ile birlikte)
      return R.body(html.slice(0, end), page) + tail;
    },
};

// Beyaz zeminde yeşil #10B981 metin 2.54:1, sarı #FFB71B 1.74:1, features etiketleri 4.39:1 (AA 4.5:1).
// Aynı tonun koyusu; ikonlar (svg) grafik, renkleri kalır
const CON = [
  ":is(p,span,div).text-\\[\\#10B981\\]:not(:has(svg)){color:#047857}", // 5.48:1
  ".bg-\\[\\#10B981\\]\\/20.text-\\[\\#10B981\\]{color:#065f46}", // "Verified" rozeti, açık yeşil zeminde
  ":is(p,span,div).text-\\[\\#FFB71B\\]:not(:has(svg)){color:#B45309}", // 5.02:1
  ".rounded-full.bg-muted.text-muted-foreground{color:#4b5563}", // 6.87:1
].join("");

// Mobil hero: tek sütunlu grid'in örtük "auto" sütunu mockup satırının min-content genişliğine uzuyordu
// (/solutions/brands 375px'te H1, metin ve CTA'lar sağdan kesik). Sütun ekran genişliğine sabitlenir;
// mockup satırlarında metin daralır, avatar küçülmez. Yüzen bilgi kartları ekran kenarına taşmaz, içerik kenarına hizalanır
const UX = [
  "@media (max-width:1023.98px){#main>section:first-child .grid.items-center{grid-template-columns:minmax(0,1fr)}",
  "#main>section:first-child .grid>.relative .flex-1{min-width:0}#main>section:first-child .grid>.relative .rounded-full{flex-shrink:0}}",
  "@media (max-width:639.98px){#main>section:first-child .absolute.-right-4.rounded-xl.border{right:0}#main>section:first-child .absolute.-left-4.rounded-xl.border{left:0}",
  // Yapışkan header'daki "Get Started Free" 640px altında gizliydi (kaydırınca kayıt yolu hamburger içinde kalıyordu);
  // Login ve TR gizli kalır, logo + CTA + menü 320px'e sığar
  "header [data-slot=button].gradient-primary{display:inline-flex;padding:0 14px}}",
  // Pricing SSS satırları py-5 kullanıyor ama derlenmiş CSS'te py-5 yok (Tailwind yalnız kaynakta görüleni üretir); satırlar dipdibeydi
  ".py-5{padding-block:calc(var(--spacing)*5)}",
  // Plan kartları (/, /pricing): buton listenin hemen altındaydı; madde sayısı farklı olunca masaüstünde butonlar
  // farklı hizadaydı (Starter 64px yukarıda). İçerik esnek sütun, buton kartın dibinde; masaüstünde de 44px
  "#main [data-slot=card]>[data-slot=card-content]:has(>ul+[data-slot=button].w-full){flex:1;display:flex;flex-direction:column}",
  "#main [data-slot=card-content]>ul:has(+[data-slot=button].w-full){margin-bottom:2rem}#main [data-slot=card-content]>ul+[data-slot=button].w-full{margin-top:auto;min-height:44px;font-weight:600}",
  // Öne çıkan plan (Most Popular): deneme butonu daha belirgin (metin aynı)
  "#main [data-slot=card].ring-2 [data-slot=card-content]>ul+[data-slot=button].gradient-primary{min-height:48px;font-size:1rem;box-shadow:0 8px 20px -6px rgb(37 99 235/.55)}",
  // Alt alta dizilen kartlarda scale-105 Pro kartını ekran kenarına 7px yaklaştırıyor, rozeti üstteki karta değdiriyordu
  "@media (max-width:1023.98px){#main [data-slot=card].scale-105{scale:1}}",
  // Pricing karşılaştırma tablosu 375px'te 600px genişlikte yatay kayıyordu; "Feature" sütunu 268px olduğundan
  // Enterprise'a kaydırınca özellik adları ekrandan çıkıyordu. Dar ekranda tablo 480px, ilk sütun 136px ve yapışkan
  "@media (max-width:639.98px){#main .overflow-x-auto>table{min-width:30rem}",
  "#main .overflow-x-auto>table :is(th,td):first-child{position:sticky;left:0;z-index:1;width:8.5rem;min-width:8.5rem;padding-right:.5rem;background:var(--background)}#main .overflow-x-auto>table td:first-child{font-size:.875rem;line-height:1.25rem}",
  "#main .overflow-x-auto>table :is(th,td):first-child::after{content:\"\";position:absolute;top:0;bottom:0;right:-8px;width:8px;background:linear-gradient(to right,rgb(0 0 0/.08),transparent);pointer-events:none}}",
  // Ana sayfa CTA bölümündeki desen %10 opaklıkta, her ziyarette 137 KB PNG iniyordu; aynı 1024×717 desen webp (21 KB).
  // Derlenmiş CSS'teki PNG kuralı geçersiz kalır, PNG hiç istenmez
  "#main [class*=\"abstract-geometric-pattern.png\"]{background-image:url(/abstract-geometric-pattern.webp)}",
  // Özellik/çözüm kartları: kartın py-6'sı ile içeriğin p-6'sı üst üste biniyordu (üst/alt 48px, yanlar 24px; telefonda
  // her kartta ~48px boşluk). Tek çocuğu içerik olan kartta dikey boşluğu içerik verir; her kenar eşit (24px, sm:p-8'de 32px)
  "#main [data-slot=card].py-6:has(>[data-slot=card-content]:only-child){padding-block:0}",
  // Bülten durum satırı: boşken yer kaplamaz, dolunca giriş+butonun altında tam satır; hata kırmızı (#b91c1c beyazda 6.5:1)
  "footer form.sk-nl{flex-wrap:wrap;row-gap:0}footer .sk-nl-msg{flex-basis:100%;margin:0;font-size:.875rem;line-height:1.25rem;color:var(--muted-foreground)}",
  "footer .sk-nl-msg:not(:empty){margin-top:.5rem}footer .sk-nl-msg[data-err]{color:#b91c1c}",
  // Pricing Monthly/Yearly yazıları tıklanınca dönemi seçer (chunk onClick); el imleci, çift tıkta metin seçilmez
  "div:has(>[data-slot=switch])>span:not(.rounded-full){cursor:pointer;user-select:none}",
].join("");

// 44px dokunma alanı yalnız dar ekranda ve dokunmatikte; fareli masaüstü düzeni aynı kalır
const TAP = "@media (max-width:1023px),(pointer:coarse){" + [
  // Next sayfaları: menü düğmesi ve sağdan açılan menü (kenara yapışık içerik, 28px bağlantılar, 16px kapat)
  "[data-slot=sheet-trigger]{width:44px;height:44px}",
  "[data-slot=sheet-content]>div{padding:56px 20px 24px;gap:4px}",
  "[data-slot=sheet-content]>div>a{display:flex;align-items:center;min-height:44px}",
  "[data-slot=sheet-content]>button{top:6px;right:6px;width:44px;height:44px;display:flex;align-items:center;justify-content:center}",
  "header [data-slot],main [data-slot=button],footer [data-slot=button],footer [data-slot=input],[data-slot=sheet-content] [data-slot=button]{min-height:44px}",
  // "View All Plans": düğmeyi saran <a> satır içi (20px); kutusu düğmeyle aynı olsun
  "main a:has(>[data-slot=button]){display:inline-flex}",
  // Yearly anahtarı 32×18 (+1px kenarlık; ::after dolgu kutusundan ölçülür): görünüm aynı, tıklama alanı 46×44.
  // Yanındaki Monthly/Yearly yazıları (20px) da 44px yüksekliğinde basılır; aradaki 16px boşlukta alanlar çakışmaz
  "[data-slot=switch]{position:relative}[data-slot=switch]::after{content:\"\";position:absolute;inset:-14px -8px}",
  "div:has(>[data-slot=switch])>span:not(.rounded-full){position:relative}div:has(>[data-slot=switch])>span:not(.rounded-full)::after{content:\"\";position:absolute;inset:-12px -4px}",
  // Footer bağlantıları (Next + statik): satır boşluğu yerine 44px yükseklik
  "footer a:not(.flex){display:inline-flex;align-items:center;min-height:44px;min-width:44px}footer a.flex{min-height:44px}footer ul>li{margin-block:0}footer nav{row-gap:0}",
  // Statik sayfalar (about, contact, yasal, giriş/kayıt): logo, üst menü, buton, onay kutusu satırı
  "header.top .wrap>a:first-child,header.top nav a,header.top .btn{display:inline-flex;align-items:center;min-height:44px;min-width:44px}",
  // Dar ekranda (320px) yer yetmeyince buton ve logo eziliyordu: buton küçülmez, logo oranını koruyarak küçülür
  "header.top .btn{flex-shrink:0;white-space:nowrap}header.top .wrap>a:first-child img{min-width:0;object-fit:contain;object-position:left center}",
  ".sk-skip{display:inline-flex;align-items:center;min-height:44px}button.btn,.card .row{min-height:44px}",
].join("") + "}";

const GROUP = [["https://saascorner.co", "SAAS Corner"], ["https://salescorner.co", "Sales Corner"], ["https://socialmediacorner.co", "Social Media Corner"], ["https://cornergroup.co", "Corner Group"]];
const LI = (h, n) => `<li><a class="text-sm text-muted-foreground transition-colors hover:text-primary" href="${h}">${n}</a></li>`;
const LINKBTN = /<a href="(\/[a-z]*)"><button data-slot="button" class="([^"]*)">([^<]+(?:<svg\b[^>]*>(?:<path\b[^>]*><\/path>)*<\/svg>)?)<\/button><\/a>/g;
const FOOTER = [
  ...[["/integrations", "Integrations"], ["/security", "Security"], ["/careers", "Careers"], ["/press", "Press"]].map(([h, n]) => [LI(h, n), "", 1]),
  [LI("/gdpr", "GDPR Compliance") + "</ul>", LI("/gdpr", "GDPR Compliance") + LI("/kvkk", "KVKK") + "</ul>", 1],
  ['flex-1" placeholder="email@example.com"/>', 'flex-1" placeholder="email@example.com" aria-label="Email address"/>', 1],
  // Bülten formu (NL ile birebir): sınıf, alan adı/otomatik doldurma ve boş durum satırı
  ['<form class="flex w-full max-w-md gap-2">', '<form class="flex w-full max-w-md gap-2 sk-nl">', 1],
  // data-sk-noform: dist.mjs'in forms-client'ı formu yakalamasın (yakalarsa onSubmit hiç çalışmaz, mesaj yalnız İngilizce butonda)
  ['<form class="flex w-full max-w-md gap-2 sk-nl">', '<form class="flex w-full max-w-md gap-2 sk-nl" data-sk-noform="">', 1],
  ['placeholder="email@example.com" aria-label="Email address"/>', 'placeholder="email@example.com" aria-label="Email address" name="email" autoComplete="email" required=""/>', 1],
  ["Subscribe</button></form>", 'Subscribe</button><p role="status" aria-live="polite" class="sk-nl-msg"></p></form>', 1],
  ["<p>Made with ❤️ in Istanbul</p></div>", '<p>Made with ❤️ in Istanbul</p><nav aria-label="Corner Group companies" class="flex flex-wrap gap-4">'
    + GROUP.map(([u, n]) => `<a href="${u}" class="hover:text-primary">${n}</a>`).join("") + "</nav></div>", 1],
];
// Footer bülten formunun action'ı, alan adı ve işleyicisi yoktu: Subscribe sayfayı yeniliyor, e-posta kayboluyordu. Corner
// form alıcısının genel /submit ucuna (iletişim formuyla aynı) page "/newsletter" olarak gider; sonuç formun altındaki
// durum satırında, site diliyle. onSubmit SSR HTML'ine yazılmaz; sınıf/öznitelik/boş <p> FOOTER swap'larıyla aynı
const NL_MSG = { wait: ["Subscribing…", "Kaydediliyor…"], ok: ["Thanks! We'll keep you updated.", "Teşekkürler! Gelişmelerden haberdar edeceğiz."],
  rate: ["Too many attempts. Please try again later.", "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin."],
  err: ["Something went wrong. Please try again.", "Bir sorun oluştu. Lütfen tekrar deneyin."] };
const NL = "s=>{s.preventDefault();let f=s.currentTarget,m=f.querySelector(\"[role=status]\"),b=f.querySelector(\"button\"),say=(k,x)=>{m.textContent="
  + JSON.stringify(NL_MSG) + "[k][\"tr\"===nlLang?1:0];x?m.setAttribute(\"data-err\",\"\"):m.removeAttribute(\"data-err\")};b.disabled=!0;say(\"wait\");"
  + "fetch(\"https://corner-forms.berkay-999.workers.dev/submit\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},"
  + "body:JSON.stringify({page:\"/newsletter\",fields:[[\"Email\",f.elements.email.value.trim()],[\"Page\",location.pathname]],hp:\"\"})})"
  + ".then(r=>r.json()).then(d=>{d&&d.ok?(f.reset(),say(\"ok\")):say(d&&\"rate\"===d.error?\"rate\":\"err\",1)}).catch(()=>say(\"err\",1)).finally(()=>{b.disabled=!1})}";
// Poppins yalnız font-serif ile ve hep 600/700 çiziliyor (HTML'de ve chunk'larda 400/500 yok): 400 ve 500 önyüklemesi her
// sayfada boşa 2 istek (~17 KB) ve LCP'den bant alıyordu. @font-face kalır, ileride kullanılırsa tembel iner. Head'deki <link>
// ve akıştaki :HL ipucu birlikte gider, yoksa React hidrasyonda önyüklemeyi geri ekler
const FONTS = ["a218039a3287bcfd-s.p.4a23d71b", "8e6fa89aa22d24ec-s.p.3aec397d"].map(f => `/_next/static/media/${f}.woff2`);
// Header logosu ilk ekranda ama loading="lazy" idi; ana sayfa bağlantısının tek adı da "Brand Corner Logo"ydu.
// Statik sayfalardaki gibi "Brand Corner" ve hemen yüklenir (chunk'taki logo yamasıyla birebir)
const LOGO = [['<img alt="Brand Corner Logo" loading="lazy" width="64"', '<img alt="Brand Corner" loading="eager" width="64"', 1]];
const PRE = FONTS.map(u => [`<link rel="preload" href="${u}" as="font" crossorigin="" type="font/woff2"/>`, "", 1]);
const HL = FONTS.map(u => `:HL[\\"${u}\\",\\"font\\",{\\"crossOrigin\\":\\"\\",\\"type\\":\\"font/woff2\\"}]\\n`);
// SSS düz liste: SSR (EN) ve chunk aynı yapıyı çizer. React metin kaçışı: & < > " '
const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
function faqHtml() {
  return '<div class="mt-10">' + rule.FAQ.en.map(([q, a]) => `<div class="border-b border-border py-5"><h3 class="font-semibold text-foreground">${esc(q)}</h3><p class="mt-2 text-sm text-muted-foreground">${esc(a)}</p></div>`).join("") + "</div>";
}
const faqJs = () => '(0,a.jsx)("div",{className:"mt-10",children:[' + rule.FAQ.en.map(([q, a], i) => {
  const [tq, ta] = rule.FAQ.tr[i];
  return `{question:"en"===e?${JSON.stringify(q)}:${JSON.stringify(tq)},answer:"en"===e?${JSON.stringify(a)}:${JSON.stringify(ta)}}`;
}).join(",") + '].map((e,t)=>(0,a.jsxs)("div",{className:"border-b border-border py-5",children:[(0,a.jsx)("h3",{className:"font-semibold text-foreground",children:e.question}),(0,a.jsx)("p",{className:"mt-2 text-sm text-muted-foreground",children:e.answer})]},t))';
// v0/Next istemci bileşenlerinin gövdesi JS chunk'ında: HTML'e eklenen öğe chunk'ta da olmalı, yoksa hydration #418 verir.
// /_next/static/* immutable önbellekli: yamalı chunk içerik özetli yeni adla yazılır, HTML ve RSC referansları ona çevrilir; eski dosya kalır.
// edits sırayla uygulanır: [from, to]; from ya tek eşleşen metin ya da {from, until}: tek eşleşen from'dan sonraki ilk until'e kadar (until kalır)
// Yamalanmış chunk'ın edits'i değişirse sayfalar önceki çıktının adını gösterir: o ad was'a eklenir (yeni ad hiçbir sayfada yoksa koşu durur)
// Gövdeyi silinen bileşenler "return null" olur; aynı değişiklik RULES["brandcorner.co"].BODY ile SSR HTML'de de yapılır.
const DICT = [  // i18n sözlüğü (EN + TR); 6 sayfanın chunk'ında aynı kopya
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
  ['tarafından keşfedillin,', 'tarafından keşfedilin,'],  // yazım hatası
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
const LANG = ['e&&("en"===e||"tr"===e)&&o(e)},[]),', 'e&&("en"===e||"tr"===e)&&o(e)},[]),(0,r.useEffect)(()=>{document.documentElement.lang=i},[i]),'];
const statGrid = v =>({ from: `,(0,${v}.jsxs)("div",{className:"mt-10 grid grid-cols-3 gap-6",children:[`, until: `]}),(0,${v}.jsxs)("div",{className:"relative"` });
// CTA'lar düz <button>'dı: onClick SSR HTML'ine yazılmaz (#418 riski yok). Dil kapsamda yoksa localStorage'dan okunur (varsayılan en)
const REG = (q = "") => `()=>{let l;try{l=localStorage.getItem("brand-corner-lang")}catch(x){}location.href=${q ? `("tr"===l?"/kayit":"/register")+"${q}"` : `"tr"===l?"/kayit":"/register"`}}`;
const go = u => `()=>{location.href="${u}"}`;
// Fiyat kartları: Kurumsal (Contact Sales) e-postaya, diğerleri kayda
const plan = lang => `()=>{location.href=t.cta===e("pricingPage.contactSales")?"mailto:info@saascorner.co":"en"===${lang}?"/register":"/kayit"}`;
const on = (btn, js) => {
  const to = /^\(0,/.test(btn) ? btn.replace(/^(\(0,\w+\.jsxs?\)\(\w+\.Button,\{)/, `$1onClick:${js},`) : `onClick:${js},${btn}`;
  if (to === btn) throw new Error(`onClick eklenemedi: ${btn.slice(0, 60)}`);
  return [btn, to];
};
export const chunks = [
    // e34ca4a footer Company listesine Blog ekledi (6 sayfa); i18n sözlüklerinde footer.blog zaten var
    // Header'daki Giriş/Login ve Get Started butonlarının (masaüstü + mobil menü) tıklama işleyicisi yoktu; site diline göre
    // /login|/giris ve /register|/kayit'e gider. onClick SSR HTML'ine yazılmaz, gövdeye dokunulmaz (#418 riski yok)
    // Footer'daki 4 sosyal ikon href="#" idi (hesap yok): gövdeden (BODY cut) ve chunk'tan birlikte silinir
    // 19 Eki: Integrations/Security/Careers/Press sayfası yok, footer'dan çıkar; Legal'e KVKK, alt satıra Corner Group şirketleri
    // 23 Eki: mobil menü (Sheet) başlıksızdı; ekran okuyucuda adsız pencere, açılınca konsolda Radix DialogTitle hatası.
    // Dile göre aria-label; başlık uyarısı aria-label varken susar. Kapalı Sheet SSR'da yok (#418 riski yok)
    // 23 Eki: masaüstü menüde Link içinde Button vardı (<a><button>: iç içe etkileşimli öğe, her öğede iki Tab durağı).
    // Button asChild ile Link'i <a data-slot="button"> olarak çizer; görünüm aynı. SSR gövdesi body()'deki LINKBTN ile aynı biçime çevrilir
    // 23 Eki: statik sunucu ?_rsc= isteğine RSC değil HTML döner; Next her görünen bağlantıyı boşuna ön yüklüyordu (ana sayfada
    // 14 istek, ~140 KB) ve tıklamada yine tam sayfa yüklemesine düşüyordu. Link router bağlamını görmez: ön yükleme yok,
    // tıklama doğrudan <a> gezinmesi. Çizilen <a> aynı (#418 riski yok)
    // 23 Eki: header logosu "Brand Corner" adıyla hemen yüklenir (LOGO, yukarıda)
    // 23 Eki: footer bülten formu sayfayı yeniliyordu; onSubmit form alıcısına gönderir (NL, yukarıda), sonucu durum satırında gösterir
    { chunk: "fbb4735ac8b2897c", was: ["29a4179b1081dab7", "f847b81df96780e6", "50ec8e92a50e74a5", "2c6b236da8230460", "75a2fdeac448816e", "173212324b0a63cf", "5ea4debd3abcbb8f", "00b8225ea81abed0"], edits: [
      ['let I=l.default.useContext(c.AppRouterContext),L=!1!==E', 'let I=null,L=!1!==E'],
      ['{href:"/pricing",label:e("footer.pricing")},{href:"/integrations",label:e("footer.integrations")},{href:"/security",label:e("footer.security")}]', '{href:"/pricing",label:e("footer.pricing")}]'],
      ['{href:"/careers",label:e("footer.careers")},{href:"/press",label:e("footer.press")},', '{href:"/blog",label:e("footer.blog")},'],
      ['{href:"/gdpr",label:e("footer.gdpr")}]', '{href:"/gdpr",label:e("footer.gdpr")},{href:"/kvkk",label:"KVKK"}]'],
      ['type:"email",placeholder:"email@example.com",className:"flex-1"', 'type:"email",placeholder:"email@example.com","aria-label":"Email address",name:"email",autoComplete:"email",required:!0,className:"flex-1"'],
      ['alt:"Brand Corner Logo",width:64,height:64,className:"rounded-lg"', 'alt:"Brand Corner",width:64,height:64,loading:"eager",className:"rounded-lg"'],
      ['let{t:e}=(0,n.useLanguage)(),i={solutions:', 'let{t:e,language:nlLang}=(0,n.useLanguage)(),i={solutions:'],
      ['(0,t.jsxs)("form",{className:"flex w-full max-w-md gap-2",children:[', `(0,t.jsxs)("form",{className:"flex w-full max-w-md gap-2 sk-nl","data-sk-noform":"",onSubmit:${NL},children:[`],
      ['children:e("footer.subscribe")})]})', 'children:e("footer.subscribe")}),(0,t.jsx)("p",{role:"status","aria-live":"polite",className:"sk-nl-msg"})]})'],
      ['(0,t.jsx)("p",{children:e("footer.madeWith")})', '(0,t.jsx)("p",{children:e("footer.madeWith")}),(0,t.jsx)("nav",{"aria-label":"Corner Group companies",className:"flex flex-wrap gap-4",children:'
        + JSON.stringify(GROUP.map(([u, n]) => [u, n])) + '.map(([u,n])=>(0,t.jsx)("a",{href:u,className:"hover:text-primary",children:n},u))})'],
      ...['hidden border-primary text-primary hover:bg-primary/5 sm:inline-flex bg-transparent', 'border-primary text-primary bg-transparent'].map(c => [
        `(0,u.jsx)(m.Button,{variant:"outline",className:"${c}",children:r("nav.login")})`,
        `(0,u.jsx)(m.Button,{variant:"outline",onClick:()=>{location.href="en"===e?"/login":"/giris"},className:"${c}",children:r("nav.login")})`]),
      ...['hidden gradient-primary text-primary-foreground hover:opacity-90 sm:inline-flex', 'gradient-primary text-primary-foreground'].map(c =>
        on(`(0,u.jsx)(m.Button,{className:"${c}",children:r("nav.getStarted")})`, `()=>{location.href="en"===e?"/register":"/kayit"}`)),
      [{ from: ',(0,t.jsxs)("div",{className:"mt-6 flex gap-4"', until: ']}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4"' }, ""],
      ['(0,u.jsx)(ts,{side:"right",className:"w-80",children:', '(0,u.jsx)(ts,{side:"right",className:"w-80","aria-label":"en"===e?"Menu":"Menü","aria-labelledby":void 0,"aria-describedby":void 0,children:'],
      ['(0,u.jsx)(te,{titleId:l.titleId})', '(0,u.jsx)(te,{titleId:i["aria-label"]?void 0:l.titleId})'],
      ['(0,u.jsx)(f.default,{href:e.href,children:(0,u.jsx)(m.Button,{variant:"ghost",className:"text-muted-foreground hover:text-foreground",children:e.label})},e.href)',
        '(0,u.jsx)(m.Button,{asChild:!0,variant:"ghost",className:"text-muted-foreground hover:text-foreground",children:(0,u.jsx)(f.default,{href:e.href,children:e.label})},e.href)'],
    ] },
    // PR-F: doğrulanamayan sayaçlar, logo şeridi, yorumlar, başarı hikâyeleri ve mockup tutarları
    // 23 Eki: TR seçilince <html lang> "en" kalıyordu (ekran okuyucu Türkçeyi İngilizce okur). Dil değişince eşitlenir;
    // effect hydration'dan sonra çalışır, SSR HTML aynı (#418 riski yok)
    { chunk: "411b1b9d3b6df8ca", was: ["7cc019c396358bc9", "869eb8a0955429b6", "45989ccf38b6b48c"], edits: [...DICT, LANG] },
    // 404 statik sayfa oldu (23 Eki): yalnız 404'ün yüklediği sözlük kopyası (763536697d8b15ea) artık yamalanmıyor
    // 23 Eki: hero butonlarının altına deneme satırı (BODY'deki trial ile birebir). Shield modülü ve Clock alt CTA'dakiyle aynı
    { chunk: "e4b281dafb09dd8b", was: ["ed42209b874cf44c", "5e56863b5691ae63", "67c20b341ca8d0dd"], edits: [  // ana sayfa
      ['var l=e.i(10552),i=e.i(84135),n=e.i(2870),d=e.i(95751);function c(){', 'var l=e.i(10552),i=e.i(84135),n=e.i(2870),d=e.i(95751);let skSh=e.i(42838).Shield,'
        + 'skCl=(0,e.i(10965).default)("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);function c(){'],
      ['e("hero.cta.demo")]})]}),', 'e("hero.cta.demo")]})]}),(0,s.jsxs)("div",{className:"mt-4 flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-foreground lg:justify-start",children:['
        + '(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[(0,s.jsx)(skSh,{className:"h-4 w-4 text-primary"}),(0,s.jsx)("span",{children:e("cta.noCreditCard")})]}),'
        + '(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[(0,s.jsx)(skCl,{className:"h-4 w-4 text-primary"}),(0,s.jsx)("span",{children:e("cta.freeTrial")})]})]}),'],
      on('(0,s.jsxs)(a.Button,{size:"lg",className:"gradient-primary h-12 px-8 text-lg text-primary-foreground",children:[e("hero.cta.trial")', REG()),
      on('(0,s.jsxs)(a.Button,{size:"lg",variant:"outline",className:"h-12 gap-2 px-8 text-lg bg-transparent",children:[', go("/features")),
      on('(0,s.jsxs)(r.Button,{variant:"link",className:"mt-4 h-auto p-0 text-primary",children:[e("solution.learnMore")', go("/features")),
      on('(0,s.jsxs)(r.Button,{size:"lg",className:"mt-8 gradient-primary text-primary-foreground",children:[p.cta', REG()),
      on('(0,s.jsx)(r.Button,{className:`mt-8 w-full ${t.popular?"gradient-primary text-primary-foreground":""}`,variant:t.popular?"default":"outline",children:t.cta})', plan("d")),
      on('(0,s.jsxs)(a.Button,{size:"lg",className:"mt-8 h-14 bg-primary-foreground px-10 text-lg text-primary hover:bg-primary-foreground/90",children:[e("cta.button")', REG()),
      [{ from: ',(0,s.jsxs)("div",{className:"mt-16 border-t border-border pt-8 lg:mt-24"', until: ']})]})}e.s(["HeroSection"' }, ""],  // "Trusted by 500+" + logo şeridi
      [{ from: 'function l(){let{t:e,language:l}=(0,t.useLanguage)(),i=[{value:"500+"', until: 'e.s(["SocialProofSection",()=>l])' }, "function l(){return null}"],
      [{ from: 'function i(){let{t:e,language:i}=(0,t.useLanguage)();return(0,s.jsx)("section",{className:"bg-secondary py-16 sm:py-24"', until: 'e.s(["CaseStudiesSection",()=>i])' }, "function i(){return null}"],
      ['children:1===e?"2.4K":2===e?"89%":"$45K"', 'children:"—"'],
      ['(0,s.jsx)(n.default,{href:"/pricing",children:(0,s.jsxs)(r.Button,{variant:"link",className:"text-primary",children:[e("pricing.viewAll"),(0,s.jsx)(i.ArrowRight,{className:"ml-1 h-4 w-4"})]})})',  // <a><button>: header ile aynı düzeltme
        '(0,s.jsx)(r.Button,{asChild:!0,variant:"link",className:"text-primary",children:(0,s.jsxs)(n.default,{href:"/pricing",children:[e("pricing.viewAll"),(0,s.jsx)(i.ArrowRight,{className:"ml-1 h-4 w-4"})]})})'],
      ['children:"+15 Influencers"', 'children:"Influencers"'],
      ['children:"+340%"', 'children:"—"'],
      ['children:"12K followers"', 'children:"Followers"'],
      ['children:"4.8%"', 'children:"—"'],
      ['children:"Fashion brand collaboration - $500"', 'children:"Fashion brand collaboration"'],
      ['children:"$2.4K"', 'children:"—"'],
      ['children:"+24%"', 'children:"—"'],
      ['children:["$",1500*e]', 'children:"—"'],
    ] },
    { chunk: "265b6dd36dde1597", was: ["81f74a9a6a0889fa"], edits: [  // /solutions/brands
      [statGrid("a"), ""],
      on('className:"gradient-primary h-12 px-8 text-primary-foreground",children:[e("solutions.brands.cta")', REG("?role=brand")),
      on('(0,a.jsx)(t.Button,{size:"lg",variant:"outline",className:"h-12 px-8 bg-transparent",children:e("hero.cta.demo")})', go("/features")),
      on('className:"mt-8 h-12 bg-primary-foreground px-8 text-primary hover:bg-primary-foreground/90",children:[e("solutions.brands.cta")', REG("?role=brand")),
      ['(0,a.jsx)("span",{children:"125K followers"})', '(0,a.jsx)("span",{children:"Followers"})'],
      ['(0,a.jsx)("span",{children:"4.8% engagement"})', '(0,a.jsx)("span",{children:"Engagement"})'],
      ['children:"+24 new"', 'children:"New"'],
      ['children:"+340%"', 'children:"—"'],
      ['"Join 500+ brands already using Brand Corner to transform their influencer marketing."', '"Use Brand Corner to transform your influencer marketing."'],
      ['"Influencer pazarlamasını dönüştürmek için Brand Corner kullanan 500+ markaya katılın."', '"Influencer pazarlamanızı Brand Corner ile dönüştürün."'],
    ] },
    { chunk: "51d3cf739a8640a6", was: ["6bbaf7b9bf66cf11", "a8188971253e20e0"], edits: [  // /solutions/influencers
      ['"Get Discovered":"Keşfedillin"', '"Get Discovered":"Keşfedilin"'],  // yazım hatası
      [statGrid("s"), ""],
      on('className:"h-12 bg-[#FFB71B] px-8 text-foreground hover:bg-[#FFB71B]/90",children:[e("solutions.influencers.cta")', REG("?role=influencer")),
      on('(0,s.jsx)(t.Button,{size:"lg",variant:"outline",className:"h-12 px-8 bg-transparent",children:e("hero.cta.demo")})', go("/features")),
      on('className:"mt-8 h-12 bg-foreground px-8 text-background hover:bg-foreground/90",children:[e("solutions.influencers.cta")', REG("?role=influencer")),
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
    { chunk: "4897118e349b9d9c", was: ["e51060d5d0abddeb"], edits: [  // /solutions/agencies
      [statGrid("t"), ""],
      on('className:"h-12 bg-accent px-8 text-accent-foreground hover:bg-accent/90",children:[e("solutions.agencies.cta")', REG("?role=agency")),
      on('(0,t.jsx)(s.Button,{size:"lg",variant:"outline",className:"h-12 px-8 bg-transparent",children:e("hero.cta.demo")})', go("/features")),
      on('className:"mt-8 h-12 bg-accent-foreground px-8 text-accent hover:bg-accent-foreground/90",children:[e("solutions.agencies.cta")', REG("?role=agency")),
      ['[{name:"Sarah J.",campaigns:5,earnings:"$12,500"},{name:"Mike R.",campaigns:3,earnings:"$8,200"},{name:"Emma L.",campaigns:4,earnings:"$10,800"}]',
        '[{name:("en"===l?"Talent":"Yetenek")+" A",campaigns:5,earnings:"—"},{name:("en"===l?"Talent":"Yetenek")+" B",campaigns:3,earnings:"—"},{name:("en"===l?"Talent":"Yetenek")+" C",campaigns:4,earnings:"—"}]'],
      ['children:"$45,200"', 'children:"—"'],
      ['"Join leading agencies already managing their talents with Brand Corner."', '"Manage your talents with Brand Corner."'],
      ['"Yeteneklerini Brand Corner ile yöneten önde gelen ajanslara katılın."', '"Yeteneklerinizi Brand Corner ile yönetin."'],
    ] },
    { chunk: "5c127651fc7ca527", was: ["6569e4e1529055d4"], edits: [  // /features
      ["analyzes thousands of profiles", "analyzes profiles"],
      ["üzere binlerce profili analiz eder.", "üzere profilleri analiz eder."],
      on('(0,a.jsxs)(r.Button,{size:"lg",className:"gradient-primary h-12 px-8 text-primary-foreground",children:[e("hero.cta.trial")', REG()),
      // Demo videosu yok; bu sayfadaki "Watch Demo" bir alttaki özellik bölümüne kaydırır
      on('(0,a.jsx)(r.Button,{size:"lg",variant:"outline",className:"h-12 px-8 bg-transparent",children:e("hero.cta.demo")})',
        'v=>{v.currentTarget.closest("section")?.nextElementSibling?.scrollIntoView({behavior:"smooth"})}'),
      on('(0,a.jsxs)(r.Button,{size:"lg",className:"mt-8 h-12 bg-primary-foreground px-8 text-primary hover:bg-primary-foreground/90",children:[e("hero.cta.trial")', REG()),
    ] },
    // #170 SSS'yi kaynakta ve yamalı çıktıda yerinde değiştirdi; çıktı adı 49468e11 kaldı (içerik özeti bf87c986), o ad was'ta
    { chunk: "6298d546504883f0", was: ["49468e11c5cb80ca", "bf87c986ab1ea156", "38c0e5819384d936", "19ccbd72fabe6063"], edits: [  // /pricing
      // Anahtarın adı "Yearly"; yanındaki Monthly/Yearly yazılarına basınca da seçilir (yalnız onClick, SSR aynı)
      ['(0,a.jsx)("span",{className:(0,j.cn)("text-sm",!l&&"font-semibold text-foreground"),children:e("pricingPage.toggle.monthly")}),(0,a.jsx)(N,{checked:l,onCheckedChange:o}),(0,a.jsx)("span",{className:(0,j.cn)("text-sm",l&&"font-semibold text-foreground"),children:e("pricingPage.toggle.yearly")})',
        '(0,a.jsx)("span",{className:(0,j.cn)("text-sm",!l&&"font-semibold text-foreground"),onClick:()=>o(!1),children:e("pricingPage.toggle.monthly")}),(0,a.jsx)(N,{checked:l,onCheckedChange:o,"aria-label":"Yearly"}),(0,a.jsx)("span",{className:(0,j.cn)("text-sm",l&&"font-semibold text-foreground"),onClick:()=>o(!0),children:e("pricingPage.toggle.yearly")})'],
      [{ from: '(0,a.jsx)(er,{type:"single",collapsible:!0,className:"mt-10",children:[', until: '})]})})}e.s(["PricingFAQ"' }, faqJs()],
      on('(0,a.jsx)(i.Button,{className:(0,j.cn)("mt-8 w-full",t.popular?"gradient-primary text-primary-foreground":""),variant:t.popular?"default":"outline",children:t.cta})', plan("s")),
      on('(0,a.jsxs)(r.Button,{size:"lg",className:"mt-8 gradient-primary text-primary-foreground",children:[(0,a.jsx)(n.MessageSquare,', go("mailto:info@saascorner.co")),
    ] },
];
