# saascorner.co: SEO / GEO denetimi

Tarih: 2026-10-10. Kapsam: sites/saascorner.co (323 HTML sayfa), templates/saascorner.co, content/saascorner.co/blog (193 yazı) ve canlı site (curl).

## Özet

- Teknik SEO temeli sağlam:
  - Tüm sayfalarda title ≤60 ve description ≤160 karakter (tek istisna /404, noindex).
  - Her sayfada canonical, OG/Twitter etiketleri ve `lang="tr-TR"` var.
  - Kırık iç link yok; alt metni eksik görsel yok.
- Yapısal veride iki gerçek hata bulundu ve düzeltildi:
  1. **Yanlış BlogPosting:** Her blog yazısında, başka bir yazıya ait ikinci bir BlogPosting vardı ("2026 CRM Trendleri…", 2026-04-29). Kaynağı post şablonuydu ve 191 yazının hepsine yayılmıştı.
  2. **Görünmeyen SSS için FAQPage:** Ana sayfa SSS'sinin FAQPage verisi 323 sayfanın hepsinde vardı. Oysa SSS metni yalnızca ana sayfada görünüyor; bu, Google'ın yapısal veri kurallarına aykırı.
- **robots.txt, llms.txt, sitemap.xml:** Canlıda üçü de 200 dönüyor ve doğru (dist.mjs deploy sırasında üretiyor).
- **Blog:** Ana menüden ve footer'dan linkli. Şablonlar ana sitenin Framer header/footer, renk ve fontlarını birebir kullanıyor.

## Aşama 1: Denetim

### Teknik SEO (323 sayfa, linkedom ile yerel tarama)

| Kontrol | Sonuç |
|---|---|
| title > 60 karakter | 0 |
| description > 160 karakter | 1 (/404, 176 karakter; noindex olduğu için etkisi yok) |
| Boş title veya description | 0 |
| Canonical | Hepsinde var, hepsi https://saascorner.co. /404'te yok, bu normal. |
| Canonical ≠ kendisi | 6 sayfa: bilgi-merkezi `-2` kopyaları asıl sayfaya işaret ediyor (bilinçli) |
| html lang | tr-TR (hepsi) |
| OG ve Twitter | Hepsi tam (og:url, og:image, summary_large_image) |
| noindex | Yalnızca /404 |
| Kırık iç link | 0 |
| alt'sız img | 0 |
| H1 > 1 | /404, /blog, /cerez-politikasi. Hepsi Framer breakpoint kopyası, metin aynı; sorun değil. |

Bulgular:
- **/blog H1'i:** "Blog" başlığı değil, öne çıkan yazının başlığı ("CRM ile Sürekli Öğrenen B2B SaaS Organizasyonu…"). build-blog.mjs, hero'daki `<h1>`'i yazı başlığıyla dolduruyor. (Ana'ya notu aşağıda.)
- **Tekrarlanan title (9):**
  - 6'sı bilgi-merkezi `-2` çiftleri; canonical ile çözülmüş.
  - /bilgi-merkezi/b2b-satis-onboarding-musteri-merkezli-yaklasim ile /blog/b2b-satis-onboarding-musteri-merkezli-yaklasim aynı başlığı taşıyor.
  - İki blog yazısı aynı başlığı taşıyor: "B2B İletişiminde Yeni Standart | SaaS Corner".
    - b2b-de-basari-teklifin-otesindeki-dijital-guvendir.-saas-corner-ile-stratejik-aginizi-kurun
    - b2b-i̇letisiminde-yeni-standart-dijital-guven-ve-stratejik-gorunurluk
- **Sorunlu slug karakterleri:** Bazı slug'larda birleşik noktalı "i̇", nokta (`.`) ve ’ var. Çalışıyorlar ama paylaşımda ve URL kodlamada kırılgan. Yeni yazılarda ASCII slug önerilir. Mevcut URL'ler değiştirilmedi (dizine eklenmiş durumdalar).

### sitemap.xml / robots.txt

- **Canlı robots.txt:** `User-agent: * / Allow: /` ve `Sitemap: https://saascorner.co/sitemap.xml` satırı var.
- **Canlı sitemap.xml:** 324 URL, 193'ü /blog/. Bütün yazıları kapsıyor.
- **Yerel sitemap:** 322 URL. Farkı 2 yazı oluşturuyor (b2b-saas-seo-rehberi-turkiye-adim-adim, linkedin-reklamlari-b2b-saas-deger-mi); bunlar deploy sırasında build ediliyor.
- dist.mjs, noindex olan ve canonical'ı başka adrese işaret eden URL'leri sitemap'ten düşürüyor.

### Yapısal veri (JSON-LD)

| Tip | Önce | Sonra |
|---|---|---|
| Organization | 323 sayfa | 323 sayfa (değişmedi) |
| WebSite | ana sayfa | ana sayfa |
| Article | bilgi-merkezi, 121 | 121 |
| BlogPosting | 382 (yazı başına 2, biri yanlış) | 191 (yazı başına 1, doğru) |
| BreadcrumbList | yalnızca yazılar (191) | yazılar + /blog |
| FAQPage | 323 sayfa (görünür SSS yalnızca ana sayfada) | yalnızca ana sayfa |
| CollectionPage | yok | /blog |

Organization verisi:
- Logo başka bir domainde barınıyor (raw.githubusercontent.com).
- Marka adı tutarsız: Organization ve sayfa title'larında "SAAS Corner", blog title soneki ve yazar alanında "SaaS Corner".

### Blog

- /blog var; ana menüde ve footer'da https://saascorner.co/blog linki var.
- templates/saascorner.co/blog.html ve post.html, ana sitenin Framer çıktısından türetilmiş. Header, footer, renk ve font aynı; uyum çalışması gerekmedi.
- **Görseller:**
  - Tüm yazıların front matter'ında imageAlt var.
  - 4 yazıda `image: ""`, yani kapak görseli yok:
    - crm-ile-discovery-otomasyonu-yeni-nesil-rehberi
    - gelecekteki-crm-trendleri-chatbot-ve-predictive-analytics
    - lead-kalitesi-den-lead-kalitesi-e-saas-qualification-yolculugu
    - musteri-memnuniyeti-odakli-crm-stratejileri
  - Bazı kapak görselleri 6–7 yazıda tekrar kullanılıyor.
- **Yazar bilgisi:** Yazar "SaaS Corner" (Organization). Kişi (Person) yazar yok.

### Performans (yalnızca gözlem)

- **HTML boyutu:**
  - blog.html ≈ 784 KB, index.html ≈ 312 KB, yazılar ≈ 330 KB.
  - Neden: Framer SSR her breakpoint için DOM'u kopyalıyor. Gzip sonrası kabul edilebilir, ama liste sayfası ağır.
- **Görseller:** 1 MB'tan büyük 23 görsel var (png/jpg). WebP/AVIF ve boyutlandırma ile ciddi kazanç sağlanabilir.
- **Site boyutu:** Toplam ≈ 222 MB.
- **Üçüncü taraf script:** Yalnızca Google Analytics (gtag). Gereksiz bir script görülmedi.

### GEO (yapay zekâ arama motorları)

- **llms.txt:** Canlıda var (≈92 KB, sitemap başlıkları ve açıklamalarından gruplu üretiliyor).
- **Eksikler ve öneriler:**
  1. **"X nedir / kime / fiyat" cevap blokları:** Ana sayfada ve hizmet bölümlerinde 2–3 cümlelik net tanımlar olmalı. Örnekler: "Outsourced SDR nedir?", "Kimler için uygun?", "Fiyatlandırma nasıl çalışır (aylık retainer / toplantı başı)?". Bunlar LLM'lerin doğrudan alıntılayacağı biçimde yazılmalı.
  2. **Görünür SSS:**
     - Şu an SSS yalnızca ana sayfada.
     - Hizmet ve iletişim sayfalarına kendi görünür SSS'leri eklenirse FAQPage verisi o sayfalarda da meşru olur.
     - Blog yazılarına yazı sonu "Sık sorulanlar" bölümü eklenebilir; build-blog bunu markdown'dan üretebilir.
  3. **Yazar / E-E-A-T:** Yazılara gerçek kişi yazar (Person: ad, unvan, LinkedIn) ve kısa bir biyografi eklenmeli. Organization'a `founder`, `foundingDate` ve `address` alanları eklenmeli.
  4. **Alıntılanabilir istatistikler:** Kendi verilerinizden numaralı ve tarihli istatistikler yayınlanmalı (ör. "2026'da 40 B2B kampanyada ortalama toplantı oranı %X"). Yazılarda kaynaklı rakamlar kullanılmalı.
  5. **Marka adı:** Tek bir yazım seçilmeli ("SAAS Corner" ya da "SaaS Corner"). LLM'ler varlığı adla eşleştiriyor.

### Coğrafi / alt site fırsatı (yalnızca öneri, açılmadı)

Öneri: alt domain değil, **alt klasör**. Domain otoritesi tek yerde kalır, mevcut blog ve bilgi-merkezi iç linkleri doğrudan güç aktarır, deploy hattı da aynı kalır.

- **Sektör sayfaları (öncelikli):**
  - Hedef sayfalar: `/sektor/saas`, `/sektor/fintech`, `/sektor/yazilim-ajanslari`, `/sektor/b2b-hizmet`.
  - Gerekçe: Blog içeriği zaten sektör odaklı, iç link kurmak kolay.
  - Her sayfada şunlar olmalı: sektöre özel sorunlar, süreç, vaka veya istatistik, SSS (FAQPage), CTA.
- **Şehir sayfaları:**
  - Hedef sayfalar: `/istanbul-lead-generation`, `/ankara-…`, `/izmir-…`.
  - Yalnızca gerçek yerel kanıt (müşteri, ofis, etkinlik) varsa açılmalı; aksi halde ince içerik riski taşır.
- **Ülke / dil:**
  - Hizmet "Worldwide" ise İngilizce sürüm `/en/` altında ve hreflang ile kurulmalı.
  - Tüm site şu an tr-TR, ama Organization açıklaması ve ana sayfa title'ı İngilizce. Bu karışıklık da giderilmeli.

## Aşama 2: Yapılan düzeltmeler (yalnızca saascorner.co klasörleri)

1. **templates/saascorner.co/post.html:** Sabit kalmış `data-sk-seo` BlogPosting bloğu ("2026 CRM Trendleri…") kaldırıldı. Yazıların doğru BlogPosting ve BreadcrumbList verisi build-blog'un `data-sk-post` bloğundan geliyor.
2. **sites/saascorner.co/blog/*.html (191 dosya):** Aynı yanlış blok kaldırıldı. Deploy'da yeniden build edilecek 2 yazı şablondan doğru çıkacak.
3. **FAQPage (ana sayfa hariç tüm sayfalar ve iki şablon):** Ana sayfa SSS'sinin FAQPage verisi, SSS'nin görünmediği 322 sayfadan ve blog/post şablonlarından kaldırıldı. Ana sayfadaki veri korundu.
4. **/blog için CollectionPage + BreadcrumbList:** `data-sk-seo` bloğu hem sites/saascorner.co/blog.html'e hem templates/saascorner.co/blog.html'e eklendi. build-blog bu bloğu silmiyor, yeniden build'de kalır.

Metin, tasarım ve URL değişikliği yapılmadı. Tüm JSON-LD blokları geçerli JSON (doğrulandı).

## Ana'ya

- **Ana'ya: /blog H1.** build-blog.mjs liste hero'sunda başlığı yalnızca bir `<h1>` içine yazıyor (cfg.listHero). Sayfanın H1'i bu yüzden "Blog / SAAS Corner Blog" yerine öne çıkan yazının başlığı oluyor. Öneri: Öne çıkan yazı başlığı `<h2>` olsun, sayfaya ayrı bir "Blog" H1'i eklensin. Bu bir tools/ değişikliği.
- **Ana'ya: Marka adı tutarsızlığı.** tools/blog.config.mjs saascorner.co girdisinde brand, titleSuffix ve author "SaaS Corner"; site, Organization verisi ve seo.mjs "SAAS Corner". Berkay'ın tercihine göre tek yazıma çekilmeli.
- **Ana'ya: Title tekilleştirme.** build-blog aynı başlıklı iki yazıya izin veriyor ("B2B İletişiminde Yeni Standart"). Build sırasında tekrar eden title için uyarı eklenebilir. Bu yazılardan birinin başlığını değiştirmek de içerik kararı; Berkay'a sorulmalı.
- **Ana'ya: Organization logosu.** Logo raw.githubusercontent.com'da duruyor. saascorner.co altına taşınmalı. Veri, Framer site-geneli custom code'unda; mirror'da değiştirilirse bir sonraki mirror ezer.
- **Ana'ya: Mirror'ın ezme riski.** Statik sayfalardaki düzeltmeler (FAQPage temizliği, /blog LD) bir sonraki Framer re-mirror'ında geri gelebilir. Kalıcı çözüm için ya Framer custom code'da FAQPage yalnızca ana sayfaya konmalı, ya da tools/seo.mjs kuralları deploy hattına (dist.mjs öncesine) bağlanmalı. Şu an seo.mjs pipeline'da çalışmıyor.
- **Ana'ya: Görsel optimizasyonu.** 1 MB üzeri 23 görsel var. Deploy'da WebP/AVIF dönüşümü ve srcset (tools/dist.mjs) site genelinde kazanç sağlar.
