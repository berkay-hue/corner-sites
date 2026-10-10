# cornergroup.co: SEO / GEO denetimi

Tarih: 2026-10-10 · Dal: `claude/vigilant-sammet-43a8ab` · Kapsam: `sites/`, `templates/`, `content/` altındaki cornergroup.co dosyaları

## Özet

Teknik temel sağlam:
- `lang="tr-TR"` her sayfada.
- Canonical domain doğru.
- Kırık iç link yok, alt metni eksik görsel yok.
- `robots.txt`, `sitemap.xml` ve `llms.txt` canlıda var.

Asıl sorunlar ve bu PR'daki karşılıkları:
1. **Blog yazı şablonu beyaz zemindeydi.** Beyaz logo ve menü görünmüyordu. Ayrıca CMS'ten sızan bir "false" metni vardı. → Düzeltildi.
2. **JSON-LD eksikti.** Organization'da bağlı şirketler yoktu; blog ve iletişim sayfalarında şema yoktu. → Eklendi.
3. **Meta description'larda küçük hatalar vardı.** Blog'da "Hakkın" yazım hatası vardı, iki açıklamanın sonunda boşluk kalmıştı. → Düzeltildi.

## Aşama 1: Bulgular

### Teknik SEO (140 yerel sayfa tarandı)

| Kontrol | Durum |
|---|---|
| `html lang` | ✅ Her sayfada `tr-TR` |
| Title ≤60 | ✅ Ana sayfa "Corner Group \| B2B Satış, Pazarlama ve CRM Çözümleri" (52). Yazılar build-blog'un ≤60 mantığıyla üretiliyor |
| Description ≤160 | ✅ Uzunluklar uygun. ⚠️ blog.html'de "Satış Hakkın" yazım hatası ve sonda boşluk vardı; iletisim'de de sonda boşluk vardı (düzeltildi) |
| Tek H1 | ⚠️ index.html'de 2 adet H1 var ("Satışın, markanın, …"). Framer'ın masaüstü ve mobil varyantları; ikisinden biri her zaman gizli. Arama motorları için ciddi bir sorun değil, ama ideal olan tek H1 (şablon yapısı, bu PR'da dokunulmadı) |
| Canonical | ✅ Tüm sayfalarda `https://cornergroup.co/...` |
| OG/Twitter | ✅ index, blog, iletisim ve yazılarda var. 404 noindex olduğu için eksik olması sorun değil |
| Görsel alt | ✅ 558 görselin hepsinde alt var |
| Kırık iç link | ✅ Yok |
| 404 | ✅ `404.html` var ve `noindex`. Sade ama yeterli |

### Sitemap / robots
- ✅ `robots.txt`: `Allow: /` ve `Sitemap:` satırı var. dist.mjs üretiyor.
- ✅ `sitemap.xml`: 141 URL (ana sayfa, blog, iletişim ve 138 yazı). Bugünkü yazı da dahil.

### Yapısal veri (önce)

| Sayfa | Önce | Sonra |
|---|---|---|
| index | Organization + WebSite (seo.mjs, `data-sk-seo`); subOrganization/sameAs yok | + Organization: subOrganization (5 şirket), sameAs, contactPoint |
| blog | Yok | Blog + BreadcrumbList |
| iletisim | Yok | ContactPage + BreadcrumbList |
| yazılar | BlogPosting + BreadcrumbList (build-blog) | Aynı |
| FAQPage | Yok. Sayfalarda görünür SSS bölümü olmadığı için eklenmedi (görünmeyen içerik için FAQ şeması Google yönergelerine aykırı) | — |

### Blog
- ✅ `/blog` hem üst menüden (cg-nav) hem footer'dan linkli.
- ✅ Blog liste sayfası koyu tema, Inter fontu ve ana siteyle aynı header/footer kullanıyor.
- ❌ **Yazı sayfası** (`templates/cornergroup.co/post.html`):
  - Zemin beyazdı (`background: #fff`), bu yüzden beyaz logo ve menü linkleri görünmüyordu.
  - Başlığın altında Framer CMS'in "Featured" alanından sızan **"false"** metni görünüyordu.
  - → Düzeltildi.

### Performans (sadece gözlem)
- `index.html` 265 KB. Framer'ın inline CSS'i ve SSR çıktısı yüzünden; harici `<script src>` yok.
- `_a/` varlık klasörü 18 MB. 500 KB'tan büyük png/jpg yok (görseller çoğunlukla webp ya da optimize edilmiş).
- Görsellere dokunulmadı, refactor önerilmiyor. Fırsat: kullanılmayan Framer CSS'inin temizlenmesi (ağır iş, düşük öncelik).

### GEO (AI arama motorları)
- ✅ `llms.txt` canlıda (dist.mjs otomatik üretiyor): kurum özeti, sayfalar ve tüm yazılar.
- ⚠️ Ana sayfada "Corner Group nedir / kime hizmet verir / nasıl çalışır" türü **net cevap blokları yok**. Metin slogan ağırlıklı.
- ⚠️ **SSS bölümü yok** (ne ana sayfada ne iletişimde).
- ⚠️ **Yazar bilgisi yok.** Yazıların BlogPosting'i kurumu yazar gösteriyor; kişi (Person) yazar, biyografi ve LinkedIn yok.
- ⚠️ **Alıntılanabilir istatistik az.** "Teknopark onaylı" dışında rakam yok (müşteri sayısı, ortalama pipeline artışı, kurulum süresi vb.).

Öneriler (metin değişikliği gerektirdiği için bu PR'da yapılmadı):
1. Ana sayfaya 3–5 maddelik bir "Corner Group nedir?" bloğu eklenmeli. 40–60 kelimelik, tek başına alıntılanabilir paragraflar olmalı.
2. Ana sayfa ve iletişime 5–8 soruluk bir SSS bölümü eklenmeli; ardından FAQPage şeması eklenebilir. Örnek sorular: "Hangi CRM'lerle çalışıyorsunuz?", "Kurulum ne kadar sürer?", "Fiyatlandırma nasıl?".
3. Yazılar için yazar profili eklenmeli: kişi adı, kısa biyografi, LinkedIn ve Person JSON-LD. Bu build-blog'da değişiklik gerektiriyor (Ana'ya).
4. Vaka çalışmalarındaki somut sonuçlar ("%X dönüşüm artışı") ana sayfada istatistik bandı olarak gösterilebilir.

### Coğrafi / sektör alt site fırsatı (sadece öneri, açılmadı)
- **Önerim: alt klasör, alt domain değil.** Sebep: cornergroup.co'nun otoritesi alt klasörlere doğrudan aktarılır. Alt domain arama motorlarınca kısmen ayrı site sayılır. Ayrıca ayrı Cloudflare projesi, sitemap ve bakım yükü getirir. Marka ayrımı gerekenler zaten kendi domain'lerinde (saascorner, salescorner vb.).
- Holding sitesi için en mantıklı sayfalar:
  - **Sektör:** `/sektor/saas`, `/sektor/uretim-ihracat`, `/sektor/e-ticaret`, `/sektor/profesyonel-hizmetler`. Her biri ilgili bağlı şirkete ve blogdaki vaka yazılarına link vermeli. Blogda "ihracat", "e-ticaret" ve "KOBİ" vakaları zaten var; bunlar iç link kaynağı olur.
  - **Coğrafi:** `/istanbul-b2b-satis-danismanligi`, `/ankara-...`, `/izmir-...`. Ancak yalnızca gerçek yerel kanıt (ofis, müşteri, etkinlik) varsa açılmalı. İnce şehir sayfaları "doorway" riski taşır.
  - **Dış pazar:** İhracat odaklı müşteriler için ileride `/en/` İngilizce klasörü (hreflang ile).
- Öncelik: önce sektör sayfaları (blog içeriğiyle doğal iç link ağı), sonra gerekirse şehir sayfaları.

## Aşama 2: Yapılan düzeltmeler

1. **`templates/cornergroup.co/post.html`**
   - Koyu tema eklendi (`<style data-cg-theme>`): zemin `#0A0A0B`; metin `#c9c9cf`, başlıklar beyaz, kategori/link/sonraki yazı `#FFB71B`. Ana sitenin renkleriyle aynı. Header ve footer artık görünüyor.
   - Sızan "Featured: false" bloğu kaldırıldı.
2. **Tüm yazılar yeniden üretildi** (`build-blog.mjs build cornergroup.co`): 138 yazı, `blog.html`, `_blog-index.json` ve `sitemap.xml` (141 URL).
3. **`sites/cornergroup.co/index.html`**: elle eklenen Organization JSON-LD (`data-cg-ld`, seo.mjs'nin sildiği `data-sk-seo` değil). Aynı `@id` (`#org`) ile seo.mjs graph'ına birleşiyor. İçerik:
   - subOrganization: SaaS Corner, Sales Corner, CRM Corner, Social Media Corner, Brand Corner;
   - sameAs: LinkedIn, Instagram ve bağlı şirket domain'leri;
   - contactPoint.
4. **`templates/cornergroup.co/blog.html`**:
   - Blog + BreadcrumbList JSON-LD eklendi.
   - Description'daki "Satış Hakkın" → "Satış hakkında" düzeltildi, sondaki boşluk silindi (meta ve og).
5. **`sites/cornergroup.co/iletisim.html`**:
   - ContactPage + BreadcrumbList JSON-LD eklendi.
   - Description'ın sonundaki boşluk silindi.

Yerel doğrulama:
- `dist.mjs` çıktısında robots, llms ve _headers üretiliyor; JSON-LD dist'te korunuyor.
- Yazı sayfası tarayıcıda koyu temada kontrol edildi: header, footer, başlık ve gövde okunuyor.

## Ana'ya
- **seo.mjs:** Organization kuralına site başına `subOrganization`/`sameAs` desteği eklenebilir; o zaman elle eklenen `data-cg-ld` bloğuna gerek kalmaz.
- **audit.mjs:** ESM `NODE_PATH`'i dikkate almıyor, bu yüzden `NODE_PATH=... node tools/audit.mjs` linkedom'u bulamıyor (`ERR_MODULE_NOT_FOUND`). Çözüm: `createRequire` ya da worktree'lerde tools/node_modules'e erişim.
- **Framer import / build-blog:** CMS'teki boolean "Featured" alanı post şablonuna "false" metni olarak sızıyordu. Diğer sitelerin post.html'lerinde de olabilir; import aşamasında temizlenmeli.
- **build-blog:** BlogPosting'de `author` için Person (ad, url, sameAs) desteği; GEO için önemli.
- **dist.mjs / llms.txt:** Kurum özetinin altına bağlı şirketler listesi ve "kime hizmet verir" satırı eklenebilir (site başına opsiyonel `llms-extra.md` gibi).
