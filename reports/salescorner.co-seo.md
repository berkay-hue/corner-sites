# salescorner.co — SEO / GEO denetimi (Şerit D)

Tarih: 2026-10-10 · Kapsam: `sites/salescorner.co`, `templates/salescorner.co`, `content/salescorner.co/blog`

## 1. Bulgular (düzeltme öncesi)

| Kontrol | Durum |
|---|---|
| lang | 19 sayfanın hepsi `tr-TR` ✅ |
| title ≤60 | 17 sayfada aynı title (61 karakter, kopya) ❌ |
| description ≤160 | 17 sayfada aynı, 160+ karakterlik description ❌ |
| Tek H1 | 7 sayfada H1 yok (briefing, cv-analiz, gorsel-ekleme, haftalik-rapor, linkedin-callback, page-5, page-6). Hepsi noindex. |
| canonical | Var ✅ |
| OG/Twitter | Var. Araç ve uygulama sayfalarında og:image göreli (`/_fru/...`) ❌ |
| alt | iletisim'de 3 dekoratif görselin alt'ı boş (dekoratif için uygun) |
| robots meta | index + iletisim indexlenebilir. Diğer 17 sayfa `noindex, nofollow` (404: `noindex`). Araç sayfaları da noindex. |
| sitemap.xml | Canlıda 200, ama noindex olan tüm sayfaları (404, login, dashboard…) listeliyor ❌ |
| robots.txt | 200, `Allow: /` + Sitemap ✅ |
| llms.txt | 200, ama noindex sayfalarla ve kopya description'la dolu ❌ |
| 404 | Bilinmeyen URL 404 dönüyor, 404.html var ✅ |
| JSON-LD | index: Organization + WebSite ✅. Blog yazısı: BlogPosting ✅. /blog listesinde yok. iletisim'de yok. FAQPage hiçbir yerde yok. |
| /blog | Var (200). Menüde ve footer'da link var, ama `https://salescorner.co/blog` + `target=_blank` (yeni sekme) ❌. Blog şablonu ana sitenin stilinden farklı (renk, font, nav, footer) ❌ |
| Kırık/placeholder link | index footer'ında Gizlilik / Şartlar / KVKK → `#` ⚠️ |
| Performans (sadece gözlem) | Framer sayfaları 145–280 KB HTML. Ağır ama değiştirilmedi. |
| GEO | FAQ bölümü, yazar bilgisi ve istatistik/kanıt blokları yok. Answer-first paragraf yok. |

## 2. Yapılan değişiklikler

- **Uygulama ve araç sayfaları (17 adet, hepsi noindex kaldı):**
  - Her sayfaya özgün title verildi (`<X> | Sales Corner`): title, og:title ve twitter:title.
  - Description ≤160 karakter (title/og/twitter).
  - og:image ve twitter:image mutlak URL yapıldı.
- **`_orig-sitemap.xml`:** Yalnızca `/` ve `/iletisim` kaldı. build-blog, `/blog` ile yazıları ekliyor. Böylece sitemap ve llms.txt artık noindex sayfaları içermiyor.
  - Scratchpad build sonucu: sitemap 4 URL (/, /iletisim, /blog, yazı). llms.txt temiz.
- **index.html:** Menü ve footer'daki Blog linki → `/blog`. Aynı sekmede açılıyor, `target`/`rel` kaldırıldı.
- **iletisim.html:** BreadcrumbList JSON-LD eklendi (Ana Sayfa → İletişim).
- **templates/salescorner.co/blog.html + post.html:** Ana siteyle aynı görünüme getirildi.
  - Arka plan `#05060a`, gradient `#7C5CFF→#22D3EE`, başlıklar Inter Tight, genişlik 1280.
  - Nav ana siteyle aynı (Otomasyonlar / Mimari / Custom / Tech Stack / Blog).
  - Footer 4 sütunlu ana site footer'ı (Otomasyonlar, Şirket, İletişim).
  - İçerik, copy ve yapı değişmedi.

Yeni landing sayfası yok, copy yeniden yazılmadı, tasarım değişmedi.

## 3. Ana'ya (ortak dosyalar, dokunulmadı)

1. **`tools/build-blog.mjs` sitemap'i:** `_orig-sitemap.xml`'deki her loc'u alıyor, noindex/404 filtresi yok. salescorner'da `_orig-sitemap`'i kırparak çözdüm. Genel çözüm: `robots noindex` olan sayfalar build sırasında atlansın.
2. **`tools/dist.mjs`:** llms.txt ve robots.txt'yi her build'de baştan yazıyor. Site bazlı özelleştirme yok (ör. llms.txt'ye hizmet özeti ya da FAQ eklemek).
3. **/blog liste sayfası:** build-blog JSON-LD eklemiyor. `Blog` / `CollectionPage` + BreadcrumbList eklenebilir.
4. **Rakip analizi 500 hatası:** n8n backend sorunu, site tarafında değil.

## 4. Öneriler (uygulanmadı)

- **Araç sayfaları:**
  - Şu an noindex. İndexlenebilir landing'e dönüşmeleri için her birine özgün copy ve H1 gerekir.
  - Karar Berkay/Ana'da. Uygun adaylar: rakip-analizi, seo-robotu, web-keyword, sekans-yazari.
- **FAQ:** Ana sayfaya 5–8 soruluk bir SSS bölümü + FAQPage schema eklenmeli. GEO için en yüksek etkili adım.
- **Yazar/E-E-A-T:** Blog yazılarına yazar kutusu (kişi + LinkedIn) ve `author: Person` eklenebilir.
- **İstatistik/kanıt:** Müşteri sayısı, toplantı/lead metrikleri gibi somut veriler (answer block) LLM'lerin alıntılamasını kolaylaştırır.
- **Footer yasal linkleri:** Gizlilik/Şartlar/KVKK `#` → gerçek sayfalar (KVKK TR için zorunlu).
- **Geo / alt site fikirleri (sadece öneri):**
  - Şehir bazlı: "İstanbul B2B lead generation", "Ankara satış dış kaynak".
  - Sektör bazlı: SaaS, üretim, lojistik için outbound sayfaları.
  - İngilizce `/en` sürümü.
- **Performans:** Framer çıktısı ağır. Görsel boyutları ve kullanılmayan script'ler ileride gözden geçirilebilir.
