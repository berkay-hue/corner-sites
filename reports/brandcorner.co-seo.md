# brandcorner.co — SEO / GEO denetimi

Tarih: 2026-10-10 · Şerit: F · Kapsam: `sites/brandcorner.co`, `templates/brandcorner.co`, `content/brandcorner.co`

## Özet

- **Kritik (canlı site):** `https://brandcorner.co` → 307 → `https://www.brandcorner.co/`. www ise 200 ile Next.js'in "404: This page could not be found" sayfasını ve `<meta name="robots" content="noindex">` döndürüyor. `/robots.txt` ve `/sitemap.xml` de 404. Canlıdaki Vercel deploy'u bozuk, ana sayfa fiilen noindex. DNS Cloudflare Pages'e taşınınca düzelir.
- **pages.dev sürümü sağlıklı.** Sayfalar, blog, yazı, robots, sitemap (8 URL) ve llms.txt 200 dönüyor; olmayan URL'ler gerçek 404 veriyor. `x-robots-tag: noindex` var; test alan adı için beklenen bu.
- Bu PR'da yapılan güvenli düzeltmeler: og:image/twitter:image, sayfa JSON-LD'leri (WebPage, BreadcrumbList, FAQPage, Blog), 404 canonical temizliği.

## Aşama 1: Bulgular

### Sayfa bazında meta

| Sayfa | Title (karakter) | Description | H1 | Canonical |
|---|---|---|---|---|
| / | Brand Corner - Influencer Marketing Platform (44) | 92 | 1 | www/ |
| /features | 49 | 69 | 1 | ✓ |
| /pricing | 39 | 55 | 1 | ✓ |
| /solutions/brands | 58 | 91 | 1 | ✓ |
| /solutions/influencers | 45 | 102 | 1 | ✓ |
| /solutions/agencies | 49 | 102 | 1 | ✓ |
| /blog | 17 | 125 | 1 | ✓ |
| /blog/influencer-contract-clauses-… | 60 | 153 | 1 | ✓ |
| /404 | 404 \| Brand Corner | yok | 1 | noindex (canonical vardı, kaldırıldı) |

- Bütün sayfalarda `lang="en"`, OG title/description/url ve Twitter etiketleri var. Title'lar ≤60, description'lar ≤160, her sayfada tek H1.
- Bütün görsellerde alt metni var.
- **Eksikti:** statik sayfaların hiçbirinde og:image/twitter:image yoktu; twitter:card `summary` idi. Bu PR'da düzeltildi.
- Description'lar kısa, 55–102 karakter. Daha uzun ve anahtar kelimeli bir metin yazmak copy değişikliği sayıldığı için dokunulmadı.

### sitemap / robots
- Pipeline (dist.mjs) `sitemap.xml`'i 8 URL ile üretiyor; noindex/404 sayfalar dışarıda. `robots.txt` içinde `Sitemap:` satırı var.
- `_orig-sitemap.xml` kaynağı www URL'leri kullanıyor.

### JSON-LD (bu PR sonrası durum)
| Sayfa | Şema |
|---|---|
| / | Organization + WebSite (seo.mjs, `data-sk-seo`) |
| /features, /solutions/* | WebPage + BreadcrumbList |
| /pricing | WebPage + BreadcrumbList + **FAQPage** (sayfadaki 5 SSS, görünen metinle aynı) |
| /blog | Blog + BreadcrumbList |
| /blog/* | BlogPosting + BreadcrumbList (build-blog.mjs) |

### Blog
- Blog var: `/blog` ve bir yazı. Tasarımı siteyle uyumlu (Inter/Poppins, indigo→violet gradient, sticky header).
- Footer'da (Company → Blog) linkli. **Header menüsünde yok.** Header, Next.js'in client tarafında render edilen Resources dropdown'ı; HTML'e dokunmak hydration riski taşıdığı için bu PR'da değiştirilmedi.

### Kırık linkler / footer
- Footer'daki Integrations, Security, Careers, Press, About ve Legal (Terms, Privacy, Cookies, GDPR) linklerinin sayfası yok. Bunlar `_redirects` ile ana sayfaya (veya ilgili sayfaya) yönleniyor. **Yasal sayfalar gerçekte mevcut değil**; metinleri yazılmadı, Berkay'ın kararına bırakıldı.
- Footer'da "© 2025" yazıyor; yıl eski.

### Performans (yalnızca gözlem)
- Her sayfada yaklaşık 12 Next.js script'i ve Vercel Insights var. Statik ayna olduğu için JS yükü içerikle orantısız.
- Görseller Next `_next/image` yerine düz dosya olarak servis ediliyor; boyutları kontrol edilmedi.

### GEO
- `llms.txt` var (dist.mjs üretiyor). Ancak site İngilizce olduğu halde başlıklar Türkçe ("Ana sayfa", "Sayfalar", "Çözümler"). Ayrıntı aşağıda, Ana'ya bölümünde.
- Organization bilgisi zayıf: logo, sameAs (sosyal profiller) ve iletişim bilgisi yok.
- "Brand Corner nedir / kimin için / fiyatı ne" sorularına doğrudan cevap veren kısa blokları yok. Pricing'deki SSS artık FAQPage ile işaretli.
- Blog yazılarında yazar şu an Organization; kişi yazar (Person) yok.

## Aşama 2: Bu PR'daki değişiklikler

1. `index`, `features`, `pricing`, `solutions/*`:
   - `og:image` + `og:image:alt` + `twitter:image` eklendi (`https://www.brandcorner.co/Logo.png`).
   - `twitter:card` → `summary_large_image`.
2. `features`, `pricing`, `solutions/*`: `WebPage` + `BreadcrumbList` JSON-LD eklendi, `data-sk-page` işaretiyle `</head>` önüne.
3. `pricing`: `FAQPage` eklendi. Soru ve cevaplar sitenin kendi İngilizce SSS metinleri, birebir.
4. `404.html`: `canonical` ve `og:url` kaldırıldı; noindex sayfada canonical olmamalı.
5. `templates/brandcorner.co/blog.html`: `Blog` + `BreadcrumbList` JSON-LD eklendi.

Doğrulama:
- Geçici bir kopyada `build-blog.mjs build` + `dist.mjs` çalıştı ("1 yazı + liste, sitemap 8 url").
- Bütün JSON-LD blokları `JSON.parse` ile geçti.
- Build çıktıları (`sites/brandcorner.co/blog*`) repoda takip edilmediği için commit'lenmedi.

## Ana'ya

1. **Canonical www mi apex mi?** İstenen `https://brandcorner.co` (apex), ama bütün pipeline şu an www kullanıyor:
   - `_orig-sitemap.xml` (dist.mjs origin'i buradan alıyor)
   - `tools/blog.config.mjs` origin
   - `tools/seo.mjs` RULES origin
   - bütün canonical ve og:url'ler
   - canlıdaki 307 yönü (apex → www)

   Tutarlılık için bu PR www'yu korudu. Apex'e geçilecekse hepsinin aynı anda değişmesi ve Cloudflare'de www → apex 301 kurulması gerekiyor. Onay verirsen ayrı PR açarım; `tools/` kısmı senin dosyaların.
2. **Canlı site bozuk:** www.brandcorner.co (Vercel) 404 + noindex servis ediyor. DNS'in Cloudflare Pages'e taşınması öncelikli.
3. **`tools/seo.mjs` yeniden çalışırsa:**
   - Bu PR'daki sayfa LD'leri `data-sk-page` işaretli; seo.mjs yalnızca `data-sk-seo` olanları sildiği için korunur.
   - Yeni bir mirror ise HTML'i baştan yazar ve bu düzeltmeleri siler. Kalıcı olması için og:image/twitter:image, WebPage/Breadcrumb/FAQPage kuralları seo.mjs'teki `brandcorner.co` kuralına taşınabilir (kod `fix.mjs` mantığıyla hazır, istersen gönderirim).
   - Organization'a `logo` (Logo.png) eklemek de seo.mjs'te yapılmalı.
4. **`tools/dist.mjs` ve llms.txt:**
   - Başlıklar dilden bağımsız olarak Türkçe; `lang="en"` olan siteler için "Home / Pages / Solutions" olmalı.
   - dist.mjs llms.txt ve robots.txt'yi her seferinde baştan yazıyor, site kendine özel bir şey ekleyemiyor. Öneri: `sites/<host>/_llms-extra.md` varsa sona eklensin. Bu GEO cevap blokları için de gerekli.
5. **Header'da Blog linki yok.** Next.js header'ına dokunmak riskli. Ya v0 kaynağında menüye Blog eklenip yeniden mirror alınmalı ya da Berkay onaylarsa Resources altına eklenmeli.
6. **Yasal sayfalar** (Terms, Privacy, Cookies, GDPR) `_redirects` ile ana sayfaya gidiyor. SaaS'ta ve özellikle ödeme alan bir sitede bu sayfaların gerçekte olması gerekiyor. Metin yazılmadı; karar Berkay'da.

## Öneriler (oluşturulmadı)

Sektör landing sayfaları (`/influencer-marketing/<sektör>`):
- beauty & cosmetics
- fashion
- food & beverage
- gaming
- SaaS / tech
- travel

Şehir sayfaları, subdomain değil alt klasör (`/influencer-marketing/<şehir>`):
- Istanbul (footer'da "Made in Istanbul" geçiyor)
- London, Dubai, Berlin

Diğer:
- **TR sürümü:** Sitede TR dil düğmesi var ama ayrı bir URL yok. `/tr/...` + hreflang ile Türkçe aramalarda ikinci bir kanal açılır.
- **GEO:** Ana sayfaya veya /about'a 3–4 cümlelik "What is Brand Corner?" cevap bloğu, Organization'a sameAs, blog yazılarına kişi yazar (Person).
