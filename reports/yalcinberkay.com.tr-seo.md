# yalcinberkay.com.tr — SEO / GEO denetimi (Şerit E)

Tarih: 2026-10-10 · Kapsam: `sites/`, `templates/`, `content/` (yalcinberkay.com.tr)

## Özet

| Alan | Önce | Sonra (bu PR) |
|---|---|---|
| Title ≤60 / description ≤160 | Hepsi limit içinde ama zayıf ("Berkay YALÇIN \| Tools" gibi) | 5 sayfa + blog şablonu anahtar kelimeli; og/twitter eşlendi |
| Canonical (www), lang=en, OG/Twitter | Tamam | Tamam |
| H1 | Her sayfada 1 tane (Framer kırılım kopyaları ×3, tek görünür) · Blog H1 **"DESIGN THOUGHTS"** (yanlış şablon artığı) | Blog H1 → "SALES THOUGHTS" (ana sayfadaki bölüm adıyla aynı) |
| Görsel alt | Ana sayfa, tools, experience ve yazılarda alt boş; blog kartları "Blog Image" | Profil, şirket/araç logoları ve kart görselleri anlamlı alt aldı |
| JSON-LD ana sayfa | Person (worksFor yalnız SAAS Corner) + WebSite | Person (6 Corner şirketi, knowsAbout, image, description) + WebSite + ProfilePage |
| JSON-LD iç sayfalar | Yok | WebPage + BreadcrumbList (tools, projects, experience); Blog + BreadcrumbList (/blog) |
| JSON-LD yazılar | **Hata:** `post.html` şablonundaki "Adapting to the New B2B Sales Landscape" BlogPosting bloğu **her yazıya** kopyalanıyordu (tüm yazılarda yanlış headline/URL) | Şablondan çıkarıldı; her yazıda yalnız kendi BlogPosting + BreadcrumbList |
| Sitemap / robots | Deploy'da üretiliyor; 11 URL, robots tamam | Değişmedi (build-blog yeniden üretti) |
| Yönlendirme / 404 | apex, http, /index.html → www 301/308; 404 sayfası 404 dönüyor | — |
| Kırık link | Yok (iç linkler ve crmcorner.co vb. 200) | — |
| llms.txt | Var ama ince: özet tek cümle, başlıklar Türkçe ("Sayfalar", "Ana sayfa") | Ana sayfa description'ı zenginleşti → llms.txt özeti de zenginleşir. Başlıklar için Ana'ya not |
| Menü/footer | Blog ("Thoughts") menüde; nav/footer tüm sayfalarda tutarlı | — |

## Yapılan değişiklikler

- **Meta** (title / og:title / twitter:title, description / og / twitter):
  - Ana sayfa: `Berkay YALÇIN | B2B Sales Consultant & SAAS Corner Founder` (58/146)
  - Tools: `Sales & CRM Tools I Use | Berkay YALÇIN` (39/147)
  - Projects: `Projects & Companies | Berkay YALÇIN` (36/134)
  - Experience: `Sales Experience & Career | Berkay YALÇIN` (41/136)
  - Blog (site + şablon): `B2B Sales Blog | Berkay YALÇIN` (30/142)
- **Alt metinleri**: profil fotoğrafı "Berkay YALÇIN" (post şablonu dahil); SAAS Corner, Social Media Corner, CRM Corner ve 13 araç logosu; ana sayfa blog kartlarında yazı başlığı. Projects'teki 2 görsel alt'sız bırakıldı (yanındaki metinle aynı içerik, dekoratif).
- **JSON-LD**:
  - Person `@id https://www.yalcinberkay.com.tr/#person`:
    - worksFor alanında SAAS Corner (founder), Corner Group, Sales Corner, Social Media Corner, Brand Corner ve CRM Corner var.
    - sameAs alanında LinkedIn ve Instagram var.
    - knowsAbout, knowsLanguage, image ve description eklendi.
  - Yeni bloklar `data-sk-page` niteliğiyle eklendi, böylece seo.mjs onları silmez.
- **post.html şablonu**: sabit `data-sk-seo` BlogPosting kaldırıldı, profil görseline alt eklendi.
- **blog.html şablonu**: meta, H1 ve LD sitedeki blog.html ile aynı.
- `node tools/build-blog.mjs build yalcinberkay.com.tr` ile yazılar, liste ve sitemap yeniden üretildi. Bunlara CI'ın zaten yayınladığı 6. yazının yerel kopyası da dahil.

## Berkay'ın onayı gereken noktalar

1. **Şirketlerdeki rol**: Person worksFor altı Corner şirketini listeliyor. Sitede yalnız "SAAS Corner — Founder" yazıyor. Diğerlerinde rolün (kurucu/ortak) doğru olduğunu doğrula. Yanlışsa listeden çıkarırız.
2. **Deneyim yılı çelişkisi**: Ana sayfada "+7 YEARS OF EXPERIENCE", experience sayfasının H1'inde "12 YEARS OF EXPERIENCE" yazıyor. Metin değişikliği yetkim dışında olduğu için meta'ya sayı koymadım. Hangisi doğru?
3. LinkedIn sameAs `https://www.linkedin.com/in/berkayyalcin2/` olarak normalize edildi.

## Ana'ya: ortak dosya ihtiyaçları (dokunulmadı)

- **tools/seo.mjs**:
  - Yeniden çalıştırılırsa ana sayfadaki `data-sk-seo` Person'ı eski haline (yalnız SAAS Corner) döndürür.
  - Kural yalcinberkay için güncellenmeli: worksFor dizisi, knowsAbout ve sameAs.
  - seo.mjs `data-sk-seo`yu şablonlara yazmamalı. post.html'deki hata büyük olasılıkla buradan geldi.
- **tools/build-blog.mjs**:
  - Yazılarda author ve publisher şu an `Organization "Berkay Yalçın"`. Bu kişisel sitede `{"@type":"Person","@id":"https://www.yalcinberkay.com.tr/#person"}` olmalı.
  - Ek koruma olarak post üretirken şablondaki `data-sk-seo` bloğu da silinmeli.
- **tools/dist.mjs (llms.txt)**:
  - lang=en sitelerde başlıklar İngilizce olmalı ("Pages", "Home").
  - Kişisel site için kısa bir bio ve "Companies" bölümü (6 Corner şirketi ve linkleri) eklenmeli. GEO açısından en değerli kazanım bu.
- **blog-worker**: "How to Build an Outbound Sales Team from Scratch" yazısının kapak ve og:image görseli pexels'ten hotlink ediliyor (`images.pexels.com/...`). Görsel indirilip `/_a/` altına konmalı.

## Öneriler (uygulanmadı)

- **Performans** (yalnız gözlem):
  - HTML sayfaları 276–531 KB, Framer inline CSS/JS yüzünden.
  - Ana sayfada 56 img var.
  - Kritik değil. Yazı sayısı artarsa liste sayfası sayfalanabilir.
- **GEO / alıntılanabilirlik**:
  - Ana sayfaya 3–5 soruluk SSS (FAQPage), örneğin "What does a B2B sales consultant do?", "What is SAAS Corner?" ve "Which CRM do you recommend?".
  - Ana sayfaya kısa bir "About" cevap bloğu (2–3 cümle, şirketler + uzmanlık).
  - Yazılara "Key takeaways" kutusu.
  - Doğrulanmış rakamlar ("+20 worldwide clients", "+1M$ company income") tek bir yerde, kaynağıyla birlikte.
- **Yazar sinyali**: yazıların altına kısa bir yazar kutusu (Person'a link).
- **Coğrafi / alt site fikirleri**:
  - Türkçe sürüm `/tr/` (hreflang en/tr). Türkiye pazarındaki "B2B satış danışmanı" araması için.
  - GCC/EMEA deneyimini öne çıkaran bir "International B2B sales" sayfası.
  - Corner Group altında kişisel marka ↔ şirket çapraz linkleri (her Corner sitesinin footer'ında "Founded by Berkay Yalçın" linki), Person/Organization grafiğini güçlendirir.
