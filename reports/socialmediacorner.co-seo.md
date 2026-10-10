# socialmediacorner.co: SEO / GEO denetimi

Tarih: 2026-10-10 · Kapsam: `sites/socialmediacorner.co`, `templates/socialmediacorner.co`, `content/socialmediacorner.co/blog`

## Özet

- Teknik temel sağlam: https apex kanonik, www/http 301, robots.txt + Sitemap satırı, llms.txt (dist üretiyor), gerçek 404.
- En kritik iki sorun düzeltildi:
  1. Her blog yazısında, şablondan kalan sabit ikinci bir BlogPosting JSON-LD vardı (headline "Satışta Yapay Zeka..."). Google 20 yazının hepsini aynı makale gibi görebiliyordu.
  2. İletişim sayfasının adresi Türkçe karakterli `/iletişim`'di. Canonical `%C5%9F` (büyük harf), canlı yönlendirme `%c5%9f` (küçük harf) kullanıyordu, `/iletisim` ise 404 veriyordu. Sayfa `/iletisim`'e taşındı ve eski adresler 301 ile yönlendiriliyor.
- İçerik konuya uymuyor: 20 yazının yalnızca 2'si sosyal medya hakkında, gerisi SaaS satış / lead generation. Bu, hem SEO hem GEO için en büyük konu sinyali sorunu ("Ana'ya" bölümüne bakın).

## Aşama 1: Denetim bulguları

### Sayfa bazında (düzeltmeler sonrası)

| Sayfa | Title | Desc | H1 | JSON-LD | Boş alt |
|---|---|---|---|---|---|
| `/` | 55 | 130 | 1 | Organization, WebSite | 21 |
| `/blog` | 60 | 153 | 3* | Blog, BreadcrumbList (yeni) | 0 |
| `/iletisim` | 30 | 149 | 1 | ContactPage, Organization, BreadcrumbList (yeni) | 1 |
| `/404` | 38 | 150 | 0 | – (noindex) | 1 |
| 20 yazı | 37–60 | 84–155 | 1 | BlogPosting, BreadcrumbList (artık tek) | 6** |

\* `/blog`'daki 3 H1, öne çıkan yazı başlığının Framer ssr-variant kopyalarıdır (masaüstü/tablet/mobil). Bkz. Ana'ya #1.
\*\* Her yazıda 6 "ilgili yazı" kartı görselinin alt metni boş. Bu metni build-blog üretiyor. Bkz. Ana'ya #2.

- **lang:** tüm sayfalarda `tr` / `tr-TR`.
- **Canonical, OG ve Twitter:** her yerde mevcut ve apex domaine işaret ediyor.
- **Kısa description'lar** (≥120 karakter önerilir):
  - `linkedin-ve-satis` 85 karakter
  - `saas-corner-ile-guclu-lead-generation-stratejileri` 84 karakter
  - `donusum-orani-optimizasyonu` 111 karakter
  - Bunlar content/frontmatter metni olduğu için içerikleri değiştirilmedi.
- **Ana sayfadaki 21 boş alt:**
  - cloud ×9: dekoratif, `alt=""` doğru.
  - logolar ×6, Card ×4, Icon ×2.
  - Logolar müşteri/araç logoları. Doğru isimler bilinmeden alt metin yazmak yanlış veri olur, bu yüzden boş bırakıldı. Berkay/Ana logo isimlerini verirse eklenebilir.
- **İç linkler:**
  - Düzeltmeden sonra kırık iç link yok.
  - `/iletisim` sayfasında Framer'dan kalma bir "remix" linki var (`framer.com/projects/new?duplicate=...`). Bu bir metin/tasarım öğesi olduğu için dokunulmadı; kaldırılması önerilir.
- **Sosyal linkler:** footer'daki Instagram ve LinkedIn, SAAS Corner hesaplarına gidiyor. Bilinçli bir tercih değilse Social Media Corner'a ait hesaplar eklenmeli.
- **404:** gerçek 404 kodu dönüyor ve noindex. H1 yok (düşük öncelik).

### Sitemap ve robots

- `sitemap.xml`: 23 URL. Kapsam: `/`, `/blog`, `/iletisim` ve 20 yazı. Tamamı listede.
- `robots.txt`: dist üretiyor ve içinde `Sitemap:` satırı var.

### Blog

- `/blog` ana menüden ve footer'dan linkleniyor.
- `blog.html` ve `post.html` şablonları ana sitenin Framer header/footer, renk ve fontlarını kullanıyor; uyumlu.

### Performans (gözlem)

- Sayfalar büyük: Framer statik çıktısı, ana sayfa yaklaşık 300 KB HTML, 404 sayfası yaklaşık 300 KB.
- Görseller `_a/fr/images` altında. Framer zaten `srcset` ile birden fazla boyut veriyor.
- Ağır refactor yapılmadı.

### GEO

- `llms.txt` var ama yalnızca sayfa listesi içeriyor. Kurum özeti, hizmetler ve fiyat yaklaşımı yok (Ana'ya #3).
- Sayfalarda net cevap blokları yok: "Sosyal medya yönetimi nedir?", "Kimler için uygun?", "Ne kadar tutar?".
- SSS bölümü ve FAQPage şeması yok.
- Yazılarda yazar bilgisi kurum olarak geçiyor. Kişi yazar (Person) ve kısa biyografi yok.
- Alıntılanabilir istatistik az.

## Aşama 2: Yapılan değişiklikler

1. **İletişim sayfası ASCII adrese taşındı:** `iletişim.html` → `iletisim.html` (`git mv`).
   - Tüm iç linkler güncellendi: index, blog, 404, iletisim, şablonlar ve 20 yazı (rebuild ile).
   - Canonical ve og:url, `_orig-sitemap.xml` ve `sitemap.xml` güncellendi.
2. **Yeni `sites/socialmediacorner.co/_redirects`:** `/iletişim`, `/ileti%C5%9Fim`, `/ileti%c5%9fim` ve bunların `.html` sürümleri `/iletisim`'e 301 ile yönlendiriliyor. dist bu dosyayı kopyalıyor.
3. **`templates/socialmediacorner.co/post.html`:** şablondan kalan sabit `data-sk-seo` BlogPosting kaldırıldı. Her yazıda artık build-blog'un ürettiği tek doğru BlogPosting ve BreadcrumbList var.
4. **`iletisim.html`:** JSON-LD eklendi (`data-smc-ld`).
   - ContactPage
   - Organization `#org`: e-posta, parentOrganization SAAS Corner, contactPoint
   - BreadcrumbList
5. **`templates/socialmediacorner.co/blog.html`:** JSON-LD eklendi (`data-smc-ld`).
   - Blog (`/blog#blog`, publisher `#org`)
   - BreadcrumbList
6. **Blog yeniden derlendi:** `node tools/build-blog.mjs build socialmediacorner.co` sonucu 20 yazı, liste sayfası ve 23 URL'lik sitemap.

Not: Eklediğim JSON-LD'ler bilinçli olarak `data-smc-ld` niteliğini kullanıyor. Sebebi, `tools/seo.mjs` yeniden çalıştığında `data-sk-seo` bloklarını silip yalnızca `/` ve yazılar için yeniden yazması.

## Ana'ya

1. **build-blog, blog liste sayfasının hero alanı:**
   - Öne çıkan yazı başlığı 3 ssr-variant'ta `<h1>` olarak kalıyor, bu yüzden `/blog`'da 3 H1 var.
   - build-blog hero'yu `<h1[^>]*>` regex'iyle bulduğu için şablonda h2'ye çeviremedim.
   - Öneri: ilk variant h1 kalsın, diğer ikisi h2 olsun; ya da sayfa başlığı ("Blog") h1 olsun.
2. **build-blog, ilgili yazı kartları:** 6 kart görseline `alt="<yazı başlığı>"` yazılsın. Şu an boş geliyor; 20 yazı × 6 = 120 boş alt.
3. **llms.txt (`tools/dist.mjs`):**
   - Siteye özel kısa bir özet paragrafı eklenebilsin: ne yapıyoruz, kime, nasıl fiyatlanıyor, iletişim.
   - Örneğin `sites/<host>/_llms-intro.md` varsa başa eklensin.
4. **`tools/seo.mjs`, Organization:** `email`, `contactPoint`, `parentOrganization` (SAAS Corner) ve `sameAs` (sosyal hesaplar) alanlarıyla zenginleştirilsin.
5. **blog-daily konu karışımı:**
   - socialmediacorner yazıları çoğunlukla SaaS satış / lead generation hakkında; 20 yazının yalnızca 2'si sosyal medya.
   - Günlük yazı konu havuzu sosyal medya yönetimi, içerik takvimi, Reels/TikTok, topluluk yönetimi, reklam ve raporlama ile sınırlanmalı.
   - Mevcut alakasız yazılar için öneri: noindex ya da saascorner.co'ya taşıyıp 301. Karar Ana'nın/Berkay'ın.
6. **Worktree'lerde `tools/node_modules` yok:** build-blog worktree'den doğrudan çalışmıyor (linkedom bulunamıyor). Ben bir `registerHooks` resolve hook'u ile ana checkout'taki linkedom'u kullandım. Kalıcı bir çözüm (ör. symlink ya da NODE_PATH destekli bir wrapper) Ana'nın kararı.

## GEO önerileri (metin değişikliği; onay gerekir)

- **Ana sayfaya kısa bir SSS bölümü ve FAQPage JSON-LD:**
  - "Sosyal medya yönetimi nedir?"
  - "Social Media Corner kimler için uygun?" (KOBİ, e-ticaret, B2B/SaaS)
  - "Fiyatlandırma nasıl?" (paket ya da aralık)
  - "Hangi platformları yönetiyorsunuz?"
  - "Raporlama nasıl yapılıyor?"
- **Her hizmet bölümünün başına 1–2 cümlelik tanım cümlesi:** AI Overviews ve Perplexity bu tür cümleleri doğrudan alıntılıyor.
- **Ölçülebilir veriler:** müşteri sayısı, ortalama etkileşim artışı, yönetilen hesap sayısı gibi kaynağı belli istatistikler.
- **Yazılara kişi yazar:** Person şeması ve kısa biyografi (E-E-A-T).

## Coğrafi / sektör landing önerileri (şimdi açılmadı)

Öneri: alt klasör kullanılsın, alt domain değil. Böylece otorite tek host'ta birikir, ayrı Pages projesi ve sitemap gerekmez.

- **Şehir sayfaları:** `/istanbul-sosyal-medya-yonetimi`, `/ankara-sosyal-medya-yonetimi`, `/izmir-sosyal-medya-yonetimi`.
  - Yerel aramalarda "ajans" niyeti yüksek.
  - Her sayfada şehre özgü örnek, SSS ve iletişim bloğu olmalı; ince ya da kopya sayfa olmamalı.
- **Sektör sayfaları:** `/sektor/e-ticaret`, `/sektor/saas`, `/sektor/restoran-kafe`, `/sektor/saglik-klinik`, `/sektor/emlak`.
  - Her birine ilgili blog yazıları iç link verir.
- **Ön koşul:** önce Ana'ya #5'teki konu düzeltmesi yapılmalı. Aksi halde landing'ler alakasız bir blogla desteklenmiş olur.
