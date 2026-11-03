---
title: "UTM Parametreleri: Sosyal Medya Trafiği Nasıl Ölçülür?"
description: "B2B sosyal medya paylaşımlarınızın gerçek potansiyel müşteriye dönüşüp dönüşmediğini UTM parametreleriyle nasıl izleyeceğinizi adım adım anlatıyoruz."
date: "2026-11-04"
category: "Ölçümleme"
image: "https://images.pexels.com/photos/12969403/pexels-photo-12969403.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "UTM Parametreleri: Sosyal Medya Trafiği Nasıl Ölçülür?"
alt: "utm-parameters-social-media-traffic"
---

UTM parametreleri, bir web adresinin sonuna eklenen ve ziyaretçinin hangi platformdan, hangi kampanyadan ve hangi içerikten geldiğini analitik aracınıza bildiren etiketlerdir. Sosyal medya trafiğini doğru ölçmek için LinkedIn ve Instagram'da paylaştığınız her linke **utm_source, utm_medium ve utm_campaign** parametrelerini tutarlı bir isimlendirme standardıyla eklemeniz gerekir. Sonrasında bu verileri Google Analytics 4 (GA4) ve CRM'inizde okuyarak hangi gönderinin, reklamın ya da çalışan paylaşımının siteye trafik, form doldurma ve satış fırsatı getirdiğini görebilirsiniz.

B2B şirketlerde sosyal medya ekiplerinin en sık duyduğu soru şudur: "Bu paylaşımlar bize gerçekte ne kazandırıyor?" Beğeni ve gösterim sayıları bu soruyu yanıtlamaya yetmez. Satış ekibi demo taleplerini, yönetim ise pipeline'a katkıyı görmek ister. UTM parametreleri, sosyal medyadaki etkileşim ile sitedeki dönüşüm arasındaki kopukluğu kapatan en basit ve en ucuz araçtır. Bu yazıda UTM'nin ne olduğunu, B2B şirketler için nasıl bir isimlendirme standardı kurulacağını, LinkedIn ve Instagram'da adım adım nasıl uygulanacağını ve verinin nasıl raporlanacağını anlatıyoruz.

## UTM parametresi tam olarak nedir?

UTM, "Urchin Tracking Module" ifadesinin kısaltmasıdır. Google'ın 2005'te satın aldığı Urchin adlı analitik yazılımından miras kalan bu yapı, bugün GA4 başta olmak üzere neredeyse tüm analitik ve pazarlama otomasyonu araçları tarafından okunur.

Teknik olarak bir UTM linki, normal bir URL'nin sonuna soru işaretiyle eklenen anahtar-değer çiftlerinden oluşur. Örnek:

`https://www.ornekfirma.com/webinar?utm_source=linkedin&utm_medium=social&utm_campaign=2025-q2-veri-guvenligi-webinar&utm_content=carousel-v1`

Bu link tıklandığında sayfa aynı şekilde açılır, kullanıcı için hiçbir şey değişmez. Ancak GA4 bu oturumu "LinkedIn'den, organik sosyal medya üzerinden, 2025 ikinci çeyrek veri güvenliği webinar kampanyası kapsamında, carousel gönderinin ilk versiyonundan gelen ziyaret" olarak kaydeder.

## Hangi UTM parametreleri var, her biri ne işe yarar?

Temelde beş klasik parametre vardır. İlk üçü pratikte zorunlu, son ikisi isteğe bağlıdır.

- **utm_source (kaynak):** Trafiğin geldiği platform. Örnek: `linkedin`, `instagram`, `facebook`, `newsletter`.
- **utm_medium (ortam):** Trafiğin türü. Örnek: `social` (organik sosyal), `paid-social` (ücretli sosyal), `email`.
- **utm_campaign (kampanya):** Linkin ait olduğu kampanya veya girişim. Örnek: `2025-q2-veri-guvenligi-webinar`.
- **utm_content (içerik):** Aynı kampanya içindeki farklı içerikleri, görselleri ya da paylaşan kişileri ayırt etmek için kullanılır. Örnek: `video-30sn`, `carousel-v2`, `calisan-ayse-k`.
- **utm_term (terim):** Aslında arama reklamlarındaki anahtar kelimeler için tasarlanmıştır. Sosyal medyada genellikle hedef kitle segmentini belirtmek için kullanılır. Örnek: `cfo-hedefleme`, `retargeting-site-ziyaretcileri`.

GA4, bunlara ek olarak `utm_id` (kampanya kimliği), `utm_source_platform`, `utm_creative_format` ve `utm_marketing_tactic` gibi yeni parametreleri de destekler. Çoğu B2B ekibi için ilk beş parametreyi disiplinli kullanmak yeterlidir. Ek parametreleri ancak raporlama olgunluğunuz arttıktan sonra devreye almanızı öneririz.

## UTM kullanmazsanız sosyal medya trafiği neden yanlış ölçülür?

Birçok ekip, "GA4 zaten LinkedIn'den gelen trafiği gösteriyor, neden UTM'ye ihtiyacım olsun?" diye düşünür. Sorun şu ki, GA4'ün UTM'siz yaptığı tahmin çoğu zaman eksik ya da hatalıdır:

1. **Mobil uygulamalar yönlendiren bilgisini kaybettirir.** LinkedIn veya Instagram uygulamasının içindeki tarayıcıdan açılan linkler, bazen yönlendiren (referrer) bilgisi taşımaz. Bu ziyaretler "Direct" (doğrudan) trafik olarak görünür ve sosyal medyanın katkısı görünmez hale gelir.
2. **Organik ve ücretli trafik karışır.** UTM olmadan LinkedIn'den gelen bir ziyaretin organik bir gönderiden mi, yoksa sponsorlu bir reklamdan mı geldiğini ayırt edemezsiniz. Bütçe kararları da bu yüzden körlemesine verilir.
3. **Hangi içeriğin işe yaradığı bilinmez.** Aynı hafta üç farklı gönderide aynı landing page'e link verdiyseniz, UTM olmadan hangisinin form doldurttuğunu bilemezsiniz.
4. **Çalışan paylaşımlarının etkisi kaybolur.** Satış ekibinin ya da yöneticilerin kişisel profillerinden yaptığı paylaşımlar, şirket sayfasından gelen trafikle aynı torbaya girer.
5. **Mesajlaşma ve "dark social" trafiği tamamen kaybolur.** Bir LinkedIn mesajında ya da WhatsApp grubunda paylaşılan link, UTM yoksa genellikle doğrudan trafik olarak sayılır.

Bu boşluklar küçük görünse de, raporlama döneminin sonunda sosyal medyanın sistematik olarak olduğundan daha az değerli görünmesine yol açar. [B2B sosyal medya ROI'sini ölçmeye](/blog/b2b-sosyal-medya-roi-nasil-olculur) çalışan her ekibin ilk adımı, trafiğin doğru etiketlenmesini sağlamaktır.

## B2B için UTM isimlendirme standardı nasıl kurulur?

UTM'nin gücü, tutarlılığından gelir. `LinkedIn`, `linkedin`, `Linkedin.com` ve `li` GA4'te dört ayrı kaynak olarak görünür. Bir yıl sonra raporunuz yüzlerce dağınık satırdan oluşur ve hiçbir şey okunamaz hale gelir. Bu yüzden ilk iş, yazılı bir isimlendirme standardı belirlemektir.

### Temel kurallar

- **Her zaman küçük harf kullanın.** GA4 büyük-küçük harfe duyarlıdır.
- **Boşluk kullanmayın.** Kelimeleri tire (`-`) ile ayırın. Alt çizgi de kullanılabilir ama tek bir tercihte kalın.
- **Türkçe karakter kullanmayın.** `güvenlik` yerine `guvenlik`, `çeyrek` yerine `ceyrek` yazın. Türkçe karakterler URL'de kodlanır ve raporda okunmaz hale gelebilir.
- **Kampanya adına tarih ekleyin.** `yil-ceyrek-konu` formatı, aynı konudaki kampanyaları yıllar içinde karşılaştırmanızı kolaylaştırır.
- **Kısaltmaları belgeleyin.** `wbn` webinar mı, başka bir şey mi? Herkesin aynı sözlüğü kullanması gerekir.

### Örnek bir standart tablo

Aşağıdaki yapı, B2B şirketlerin büyük bölümü için iyi bir başlangıç noktasıdır:

- **utm_source:** `linkedin`, `instagram`, `facebook`, `youtube`, `x`
- **utm_medium:**
  - `social` → organik şirket sayfası paylaşımları
  - `paid-social` → sponsorlu içerik ve reklamlar
  - `employee-social` → çalışan ve yönetici paylaşımları
  - `social-dm` → LinkedIn mesajları, Instagram DM'leri
  - `bio-link` → Instagram profil linki
- **utm_campaign:** `2025-q2-veri-guvenligi-webinar`, `2025-q3-urun-lansmani-erp`, `always-on-blog`
- **utm_content:** içerik formatı + versiyon ya da paylaşan kişi (`video-v1`, `dokuman-v2`, `calisan-mehmet-a`)
- **utm_term:** hedef kitle segmenti (`it-yoneticileri`, `retargeting-30-gun`, `lookalike-musteri`)

Önemli bir teknik not: GA4'ün varsayılan kanal gruplaması, `utm_medium` değeri "paid" ile başlayan sosyal medya trafiğini **Paid Social**, `social` gibi değerleri ise **Organic Social** kanalına atar. `employee-social` gibi özel değerler, kaynak bilinen bir sosyal platform olduğu sürece genellikle Organic Social altında görünür. Yine de varsayılan kanal raporlarında beklenmedik sonuçlar görmemek için özel ortam değerlerinizi bir kez test etmeniz ya da GA4'te özel kanal grubu tanımlamanız iyi olur.

### Standardı nerede tutmalısınız?

En pratik yöntem, ortak bir Google Sheets veya Excel dosyasıdır. Bu dosyada:

1. Bir sekmede izin verilen kaynak, ortam ve formatların listesi,
2. Bir sekmede açılır menülerle UTM linki üreten bir şablon,
3. Bir sekmede de oluşturulan tüm linklerin kaydı (tarih, kampanya, oluşturan kişi, hedef URL) bulunur.

Bu dosya, içerik takvimi ve onay süreciyle aynı yerde yaşamalıdır. Eğer ekibinizde bir [sosyal medya içerik onay süreci](/blog/b2b-sosyal-medya-icerik-onay-sureci) varsa, "UTM linki standart dosyadan üretildi mi?" sorusunu kontrol listesine eklemek, hataların büyük kısmını yayından önce yakalar.

## Adım adım UTM linki nasıl oluşturulur?

Somut bir senaryo üzerinden gidelim. Bir B2B yazılım şirketinin, finans direktörlerine yönelik "Nakit akışı tahmininde yapay zekâ" başlıklı bir webinar düzenlediğini varsayalım. Kampanya hem LinkedIn hem Instagram'da, hem organik hem ücretli olarak yürütülecek.

1. **Hedef URL'yi netleştirin.** Örnek: `https://www.ornekyazilim.com/webinar/nakit-akisi`
2. **Kampanya adını belirleyin.** Standarda göre: `2025-q3-nakit-akisi-webinar`
3. **Her dağıtım noktası için ayrı link üretin.** Örneğin:
   - LinkedIn şirket sayfası video gönderisi: `utm_source=linkedin&utm_medium=social&utm_campaign=2025-q3-nakit-akisi-webinar&utm_content=video-v1`
   - LinkedIn sponsorlu doküman reklamı: `utm_source=linkedin&utm_medium=paid-social&utm_campaign=2025-q3-nakit-akisi-webinar&utm_content=dokuman-v1&utm_term=cfo-hedefleme`
   - Satış direktörünün kişisel paylaşımı: `utm_source=linkedin&utm_medium=employee-social&utm_campaign=2025-q3-nakit-akisi-webinar&utm_content=calisan-satis-direktoru`
   - Instagram story link çıkartması: `utm_source=instagram&utm_medium=social&utm_campaign=2025-q3-nakit-akisi-webinar&utm_content=story-geri-sayim`
4. **Linki bir URL oluşturucuyla ya da şablonla üretin.** Google'ın ücretsiz Campaign URL Builder aracı veya kendi tablonuzdaki birleştirme formülü yeterlidir.
5. **Linki test edin.** Tarayıcıda açın, ardından GA4'te **Raporlar > Gerçek zamanlı** ekranında kendi ziyaretinizin doğru kaynak ve kampanyayla göründüğünü kontrol edin.
6. **Gerekirse kısaltın.** Uzun UTM linkleri gönderi metninde kötü görünür. Bitly gibi bir kısaltıcı ya da kendi alan adınızla çalışan bir kısa link servisi kullanabilirsiniz. Kısaltıcı, UTM parametrelerini korur.
7. **Kayda geçirin.** Linki, hangi gönderide kullanıldığıyla birlikte UTM kayıt sekmesine ekleyin.

Bu yapıyla kampanya sonunda şu soruların hepsine net cevap verebilirsiniz: Webinar kayıtlarının ne kadarı organik, ne kadarı ücretli LinkedIn'den geldi? Video mu doküman mı daha çok kayıt getirdi? Satış direktörünün paylaşımı şirket sayfasından daha mı etkiliydi?

## LinkedIn ve Instagram'da UTM nasıl kullanılır?

Her platformun kendine özgü link noktaları ve kısıtları vardır. B2B şirketlerin en çok kullandığı iki platform için pratik notlar:

### LinkedIn organik paylaşımlar

- Gönderi metnindeki linke UTM ekleyin. LinkedIn, link önizlemesini UTM'li URL'den de sorunsuz oluşturur.
- Linki ilk yoruma koyma taktiğini kullanıyorsanız, yorumdaki linke de mutlaka UTM ekleyin ve `utm_content` değerine `ilk-yorum` gibi bir ifade yazın. Böylece gövdedeki link ile yorumdaki linkin performansını karşılaştırabilirsiniz.
- Şirket sayfası "Web sitesini ziyaret et" butonuna da UTM'li link koyun (`utm_medium=profile-link` gibi).

### LinkedIn çalışan ve yönetici paylaşımları

Çalışan savunuculuğu (employee advocacy), B2B'de en çok hafife alınan trafik kaynaklarından biridir. Her çalışana kendi `utm_content` değerine sahip bir link vermek, kimin paylaşımının gerçekten trafik ve lead getirdiğini görmenizi sağlar. Bu yaklaşımın detaylarını [LinkedIn'de çalışan paylaşımı rehberimizde](/blog/b2b-sirketlerde-calisan-paylasimi-linkedin) ele aldık. Pratik bir öneri: Çalışanlara hazır paylaşım metni gönderirken UTM'li kısa linki de metnin içine yerleştirin. Çalışanlar linki kendileri oluşturmaya çalıştığında hata oranı ciddi biçimde artar.

### LinkedIn reklamları

- Campaign Manager'da her reklamın hedef URL'sine UTM ekleyin. Reklam metni ve görselini test ediyorsanız, her varyasyonun `utm_content` değeri farklı olmalıdır.
- LinkedIn Lead Gen Form kullanıyorsanız kullanıcı sitenize hiç gelmez, bu yüzden UTM GA4'e veri taşımaz. Bu durumda formun **gizli alanlarını (hidden fields)** kullanarak kampanya ve içerik bilgisini lead kaydının içine yazabilirsiniz. Kurulum adımlarını [LinkedIn Lead Gen Form kurulum rehberimizde](/blog/linkedin-lead-gen-form-nasil-kurulur) anlattık.

### Instagram

Instagram, link konusunda LinkedIn'e göre daha kısıtlıdır:

- **Gönderi açıklamalarındaki linkler tıklanabilir değildir.** Bu yüzden organik feed gönderilerinden doğrudan UTM'li trafik beklemeyin.
- **Profil linki (bio link):** Buraya `utm_medium=bio-link` ile etiketlenmiş bir link koyun. Bir link sayfası aracı kullanıyorsanız, o sayfadaki her butona ayrı UTM ekleyin. Aksi takdirde tüm trafik link aracının adıyla görünür.
- **Story link çıkartması:** Her story için ayrı `utm_content` değeri kullanın (`story-anket`, `story-geri-sayim` gibi).
- **Instagram reklamları (Meta Ads Manager):** Reklam düzeyindeki "URL parametreleri" alanında dinamik değişkenler kullanabilirsiniz. Örneğin `utm_source={{site_source_name}}&utm_medium=paid-social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}` gibi bir şablon, kampanya ve reklam adlarını otomatik olarak UTM'e yazar. Bu yöntemin işe yaraması için Ads Manager'daki kampanya adlarının da UTM standardınıza uygun, Türkçe karaktersiz ve küçük harfli olması gerekir.
- **DM'ler:** Instagram mesajlarında paylaştığınız linklerde `utm_medium=social-dm` kullanın.

Instagram metriklerini platformun kendi panelinde nasıl yorumlayacağınızı merak ediyorsanız [Instagram analitiği ve B2B metrikleri](/blog/instagram-analitigi-nasil-okunur) yazımız, UTM verisiyle birlikte okunduğunda daha anlamlı bir tablo sunar.

## UTM verilerini GA4'te nerede görürsünüz?

Linkler doğru kurulduktan sonra veriyi okumak için GA4'te şu adımları izleyin:

1. **Raporlar > Edinme > Trafik edinme** ekranını açın.
2. Tablonun birincil boyutunu **Oturum kaynağı / aracı** (Session source / medium) olarak değiştirin. Burada `linkedin / social`, `linkedin / paid-social`, `instagram / bio-link` gibi satırlar göreceksiniz.
3. İkincil boyut olarak **Oturum kampanyası** ekleyin.
4. `utm_content` verisini görmek için **Oturum manuel reklam içeriği** (Session manual ad content) boyutunu kullanın.
5. Dönüşüm (anahtar etkinlik) sütununu, örneğin `form_submit` veya `demo_talebi` olacak şekilde filtreleyin.

Daha derin analiz için **Keşfet (Explorations)** bölümünde serbest biçimli bir rapor oluşturun: Satırlara kampanya ve içerik, sütunlara kaynak/aracı, değerlere oturum, etkileşimli oturum ve anahtar etkinlik sayısını ekleyin. Bu rapor, her ay tekrar kullanabileceğiniz bir şablon haline gelir.

Örnek bir yorum: Diyelim ki webinar kampanyasında LinkedIn reklamları 800 oturum ve 24 kayıt, satış direktörünün kişisel paylaşımı ise 150 oturum ve 12 kayıt getirdi. Reklam trafiği hacim olarak daha büyük olsa da, kişisel paylaşımın dönüşüm oranı (%8) reklamın (%3) yaklaşık iki buçuk katıdır. Bu tür bir içgörü, bir sonraki kampanyada çalışan paylaşımına daha fazla emek ayırma kararını veriyle destekler.

## UTM verisini CRM'e ve satış sürecine nasıl bağlarsınız?

B2B'de asıl soru "kaç ziyaret geldi?" değil, "kaç nitelikli fırsat ve ne kadar gelir geldi?" sorusudur. Bunun için UTM verisinin form doldurma anında CRM'e taşınması gerekir.

1. **Formlarınıza gizli alanlar ekleyin.** `utm_source`, `utm_medium`, `utm_campaign` ve `utm_content` için gizli form alanları oluşturun.
2. **Parametreleri yakalayın.** Basit bir JavaScript ya da Google Tag Manager kurgusuyla, URL'deki UTM değerlerini okuyup çerezde saklayın ve form gönderilirken gizli alanlara yazın. Böylece kullanıcı siteye LinkedIn'den gelip üç sayfa gezdikten sonra form doldursa bile kaynak bilgisi kaybolmaz.
3. **İlk ve son temas ayrımı yapın.** CRM'de hem ilk geliş kaynağını (first touch) hem de formu doldurduğu oturumun kaynağını (last touch) ayrı alanlarda tutun. B2B satış döngüleri uzun olduğu için, bir lead'i ilk kez LinkedIn getirmiş, formu ise bir e-posta bülteninden doldurmuş olabilir.
4. **Fırsat aşamalarıyla eşleştirin.** CRM raporunda kampanya bazında lead, nitelikli lead (MQL/SQL), fırsat ve kazanılan anlaşma sayılarını yan yana görün.

HubSpot, Salesforce, Pipedrive gibi CRM'lerin çoğu bu yapıyı ya hazır özelliklerle ya da küçük entegrasyonlarla destekler. Pazarlama ve satış verisini birbirine bağlayan otomasyon kurgularını uçtan uca tasarlamak isteyen ekipler için [strateji ve otomasyon odaklı Corner Group](https://cornergroup.co) çatısı altında bu tür entegrasyon projeleri de ele alınabiliyor.

## En sık yapılan UTM hataları nelerdir?

Sahada en sık karşılaştığımız hatalar ve çözümleri:

- **İç linklere UTM eklemek:** Kendi sitenizdeki bir sayfadan başka bir sayfaya verilen linke UTM eklerseniz, GA4 yeni bir oturum başlatıp asıl kaynağı siler. UTM yalnızca **dış kaynaklardan** sitenize gelen linklerde kullanılmalıdır.
- **Tutarsız isimlendirme:** `LinkedIn` ve `linkedin` iki ayrı satır olur. Standart dosya ve açılır menüler bu sorunu çözer.
- **Kampanya adlarını çok genel tutmak:** `sosyal-medya` gibi bir kampanya adı hiçbir şey anlatmaz. Tarih ve konu içermelidir.
- **utm_medium'u yanlış kullanmak:** Ortam alanına `linkedin` yazmak, kanal raporlarını bozar. Ortam, platformu değil trafik türünü anlatır.
- **Kısaltılmış linki test etmemek:** Kısaltıcı bazen yönlendirme sırasında parametreleri bozabilir. Yayından önce bir kez tıklayıp GA4 gerçek zamanlı raporunda kontrol edin.
- **Çerez onayını göz ardı etmek:** KVKK ve çerez onay yönetimi nedeniyle, çerezleri reddeden kullanıcıların bir kısmı GA4'te tam görünmeyebilir. Bu, UTM'nin değil ölçüm altyapısının bir sınırıdır. Raporları yorumlarken bu payı hesaba katın.
- **Kaydı tutmamak:** Altı ay sonra "bu `v3` neydi?" diye sorulduğunda cevap verecek bir kayıt yoksa, veri anlamını yitirir.

## Hangi araçlara ihtiyacınız var ve maliyeti ne kadar?

İyi haber şu: Sağlam bir UTM altyapısı kurmak için büyük bir bütçeye ihtiyacınız yok.

- **Google Analytics 4:** Ücretsiz.
- **Google Tag Manager:** Ücretsiz. UTM'leri form alanlarına aktarmak için kullanılır.
- **Google Sheets veya Excel:** UTM standart ve kayıt dosyası için yeterli.
- **Link kısaltıcı:** Ücretsiz planlar başlangıç için yeterli. Kendi alan adınızla marka linki istiyorsanız aylık küçük bir ücret söz konusu olabilir.
- **CRM:** Zaten kullandığınız sistem genellikle yeterlidir. Gizli alan desteği çoğu planda bulunur.

Asıl maliyet zaman ve disiplindir. İlk kurulum (standart belirleme, şablon hazırlama, GA4 ve form entegrasyonu) çoğu B2B şirkette birkaç iş günü sürer. Sonrasında her kampanya için link üretmek dakikalar alır. Asıl zorluk, ekibin tamamının bu standarda sürekli uymasını sağlamaktır.

## UTM verisini raporlara nasıl yansıtmalısınız?

UTM'nin değeri, verinin düzenli olarak karar vericilere ulaşmasıyla ortaya çıkar. Aylık sosyal medya raporunuza şu bölümleri eklemenizi öneririz:

1. **Kanal özeti:** LinkedIn organik, LinkedIn ücretli, çalışan paylaşımları ve Instagram'dan gelen oturum ve dönüşümler.
2. **Kampanya performansı:** Her kampanyanın getirdiği oturum, lead ve nitelikli lead sayısı.
3. **İçerik karşılaştırması:** `utm_content` bazında en iyi ve en zayıf performans gösteren üç içerik.
4. **Pipeline katkısı:** CRM'den alınan, sosyal medya kaynaklı fırsat ve kazanılan anlaşma verileri.
5. **Aksiyon önerileri:** Bir sonraki ay için veriye dayalı iki veya üç somut karar.

Bu yapının platform metrikleriyle nasıl birleştirileceğini [B2B sosyal medya raporu hazırlama rehberimizde](/blog/b2b-sosyal-medya-raporu-nasil-hazirlanir) ayrıntılı olarak anlattık.

## Sık sorulan sorular

### UTM parametreleri SEO'ya zarar verir mi?

Doğru kullanıldığında hayır. UTM'li linkler sosyal medyada ve reklamlarda kullanılır, arama motorları ise sayfanın canonical etiketine bakarak asıl URL'yi dizine ekler. Sitenizdeki sayfalarda doğru canonical etiketi olduğundan emin olmanız yeterlidir.

### Organik Instagram gönderilerini UTM ile ölçebilir miyim?

Instagram feed açıklamalarındaki linkler tıklanabilir olmadığı için doğrudan ölçemezsiniz. Bunun yerine profil linki, story link çıkartmaları ve DM'lerde UTM kullanarak organik Instagram'ın siteye getirdiği trafiği ölçebilirsiniz. Gönderide "linki profilimizde bulabilirsiniz" yönlendirmesi yapıp profil linkini kampanyaya özel UTM ile güncellemek pratik bir çözümdür.

### utm_medium için "social" mı yoksa "paid-social" mı kullanmalıyım?

Organik paylaşımlarda `social`, reklamlarda ise "paid" ile başlayan bir değer (örneğin `paid-social`) kullanın. GA4'ün varsayılan kanal gruplaması bu ayrıma göre trafiği Organic Social ve Paid Social kanallarına atar. Böylece organik ve ücretli sosyal medyanın katkısını ayrı ayrı raporlayabilirsiniz.

### LinkedIn Lead Gen Form kullanıyorsam UTM'ye ihtiyacım var mı?

Lead Gen Form'da kullanıcı sitenize gelmediği için UTM GA4'e veri aktarmaz. Ancak formun gizli alanlarına kampanya ve içerik bilgisini yazarak aynı mantığı CRM tarafında kurabilirsiniz. Bu sayede site trafiği ile form lead'lerini aynı isimlendirme standardıyla birlikte raporlayabilirsiniz.

## Sonuç

UTM parametreleri, sosyal medya ölçümlemesinin en temel ama en çok ihmal edilen yapı taşıdır. Tutarlı bir isimlendirme standardı, her dağıtım noktası için ayrı link, GA4'te doğru rapor kurgusu ve CRM'e bağlanan gizli form alanlarıyla; LinkedIn ve Instagram'daki her paylaşımın siteye ve satış hattına katkısını net biçimde görebilirsiniz. Böylece sosyal medya, "marka bilinirliği" başlığı altında tartışılan belirsiz bir kalem olmaktan çıkar ve bütçe kararlarında veriyle savunulan bir kanala dönüşür.

Sosyal medya trafiğinizi uçtan uca ölçmek, UTM standardınızı kurmak ve raporlarınızı satış hedefleriyle hizalamak istiyorsanız Social Media Corner ekibi olarak yardımcı olmaya hazırız. Mevcut durumunuzu birlikte değerlendirmek için [bizimle iletişime geçin](/iletisim).
