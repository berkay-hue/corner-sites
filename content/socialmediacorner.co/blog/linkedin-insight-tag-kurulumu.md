---
title: "LinkedIn Insight Tag Nasıl Kurulur? Adım Adım"
description: "LinkedIn Insight Tag'i web sitenize nasıl ekleyeceğinizi, dönüşüm izlemeyi nasıl kuracağınızı ve sık yapılan kurulum hatalarını adım adım anlatıyoruz."
date: "2026-11-22"
category: "Ölçümleme"
image: "https://images.pexels.com/photos/577195/pexels-photo-577195.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "LinkedIn Insight Tag Nasıl Kurulur? Adım Adım"
alt: "linkedin-insight-tag-installation-guide"
---

LinkedIn Insight Tag, LinkedIn Campaign Manager üzerinden ücretsiz olarak alınan ve web sitenizin tüm sayfalarına eklenen küçük bir JavaScript kodudur. Kurulumu için Campaign Manager'da reklam hesabınızı açar, Insight Tag bölümünden kodu kopyalar ve sitenizin her sayfasında kapanış `</body>` etiketinden hemen önce yapıştırırsınız. Alternatif olarak Google Tag Manager'da Partner ID ile kurabilirsiniz. Doğru kurulduğunda dönüşüm takibi yapabilir, site ziyaretçilerinize yeniden pazarlama reklamları gösterebilir ve sitenizi hangi sektörlerden ve unvanlardan kişilerin ziyaret ettiğini görebilirsiniz.

B2B pazarlamada LinkedIn reklamlarının en sık eleştirilen yanı maliyetidir. Ancak maliyeti asıl yüksek gösteren çoğu zaman tıklama fiyatı değildir. Asıl sorun, tıklamadan sonra ne olduğunu bilmemektir. Insight Tag kurulmamış bir hesapta "Bu kampanya kaç demo talebi getirdi?" sorusuna cevap veremezsiniz. Bu rehberde kurulumu baştan sona, ekran ekran ilerler gibi anlatıyoruz. Doğrulama, dönüşüm tanımlama, yeniden pazarlama kitleleri, KVKK uyumu ve en sık yapılan hataları da ele alıyoruz.

## LinkedIn Insight Tag nedir ve ne işe yarar?

Insight Tag, sitenizi ziyaret eden ve LinkedIn hesabında oturumu açık olan kullanıcıların davranışlarını LinkedIn'e anonim olarak bildiren bir izleme kodudur. Meta Pixel ya da Google Ads etiketi ile aynı mantıkta çalışır. Farkı, eşleştirmeyi LinkedIn'in profesyonel profil verisiyle yapmasıdır. B2B şirketler için asıl değeri de buradan gelir.

Insight Tag size üç temel yetenek kazandırır:

- **Dönüşüm takibi:** Bir LinkedIn reklamına tıklayan ya da reklamı gören kişinin sitenizde form doldurup doldurmadığını, teklif sayfasına ulaşıp ulaşmadığını veya bir dosya indirip indirmediğini ölçer. Kampanya raporlarında "Conversions", "Cost per conversion" gibi sütunlar ancak bu sayede dolar.
- **Yeniden pazarlama (retargeting):** Sitenizin belirli sayfalarını ziyaret eden kişilerden kitleler oluşturur ve bu kişilere LinkedIn'de reklam gösterir. Örneğin fiyatlandırma sayfasını ziyaret edip form doldurmayan kişiler gibi.
- **Web sitesi demografisi (Website Demographics):** Sitenizi ziyaret eden LinkedIn üyelerinin unvan, kıdem, sektör, şirket büyüklüğü, lokasyon ve şirket bilgilerini toplu ve anonim olarak raporlar. Kişi bazında isim görmezsiniz. Yine de "Sitemizi en çok hangi sektörlerden yöneticiler ziyaret ediyor?" sorusuna veriye dayalı cevap verebilirsiniz.

Bu üçüncü özellik çoğu zaman göz ardı edilir. Oysa reklam vermeseniz bile Insight Tag kurmak, içerik ve hedef kitle stratejiniz için değerli bir veri kaynağı sağlar.

## Kurulumdan önce neleri hazırlamalısınız?

Kuruluma başlamadan önce birkaç hazırlığı tamamlamak, sonradan yaşanacak "Neden veri gelmiyor?" sorununun büyük kısmını önler.

1. **Bir LinkedIn Campaign Manager reklam hesabı:** Hesabınız yoksa linkedin.com/campaignmanager adresinden ücretsiz açabilirsiniz. Hesabı şirket sayfanızla ilişkilendirmeniz gerekir. Hesap açmak için kampanya başlatmanız gerekmez.
2. **Doğru yetki seviyesi:** Insight Tag'i yönetmek için reklam hesabında en az "Account Manager" rolüne sahip olmalısınız. Ajansla çalışıyorsanız rol atamasının doğru yapıldığından emin olun.
3. **Web sitesine erişim:** Sitenizin şablon dosyalarına, CMS yönetim paneline (WordPress, Webflow, HubSpot CMS vb.) veya Google Tag Manager konteynerine erişiminiz olmalı. Erişiminiz yoksa kodu teknik ekibe iletmeniz gerekecek.
4. **Çerez onay altyapısı:** Türkiye'de KVKK, Avrupa'dan trafik alıyorsanız GDPR açısından pazarlama çerezleri için açık rıza gerekir. Bir çerez yönetim aracınız (CMP) varsa Insight Tag'i hangi kategoriye bağlayacağınızı önceden belirleyin.
5. **Ölçmek istediğiniz dönüşümlerin listesi:** Demo talebi, iletişim formu, e-kitap indirme, webinar kaydı, bülten aboneliği gibi. Her biri için teşekkür sayfasının URL'sini veya formun gönderim olayını not alın.

Son madde stratejik açıdan en kritik olanıdır. Neyi ölçeceğinizi önceden tanımlamazsanız kurulum teknik olarak doğru olur ama raporlar size bir şey söylemez. Bu noktada [B2B sosyal medya ROI'sinin nasıl ölçüleceğini](/blog/b2b-sosyal-medya-roi-nasil-olculur) anlatan rehberimiz, hangi dönüşümlerin gerçekten iş sonucuna bağlandığını belirlemenize yardımcı olur.

## LinkedIn Insight Tag adım adım nasıl kurulur?

Aşağıdaki adımlar, kodu doğrudan sitenize eklediğiniz manuel kurulum yöntemini anlatır. LinkedIn arayüzü zaman zaman güncellendiği için menü isimleri küçük farklılıklar gösterebilir. Akış ise aynıdır.

### Adım 1: Campaign Manager'da doğru hesabı seçin

Campaign Manager'a giriş yapın ve Insight Tag kurmak istediğiniz reklam hesabını seçin. Birden fazla reklam hesabınız varsa (örneğin farklı ülkeler veya ürün grupları için) dikkat edin. Her reklam hesabının kendine ait bir Insight Tag'i ve **Partner ID** numarası vardır. Yanlış hesabın kodunu kurarsanız veriler başka bir hesaba akar.

### Adım 2: Insight Tag bölümünü açın

Sol menüde **"Data"** (Veri) başlığı altındaki **"Insight Tag"** seçeneğine gidin. Yeni arayüzde bu alan **"Signals Manager"** veya benzer bir veri yönetimi başlığı altında yer alabilir. İlk kez giriyorsanız ekranda "Install my Insight Tag" ya da benzeri bir buton görürsünüz.

### Adım 3: Kurulum yöntemini seçin

LinkedIn size üç seçenek sunar:

- **I will install the tag myself:** Kodu kopyalayıp kendiniz eklersiniz.
- **I will send the tag to a developer:** Kodu e-postayla geliştiricinize gönderirsiniz.
- **I will use a tag manager:** Google Tag Manager gibi bir etiket yöneticisi kullanırsınız. Bu durumda size yalnızca Partner ID verilir.

Manuel kurulum için ilk seçeneği işaretleyin.

### Adım 4: Kodu kopyalayın

Ekranda iki parçalı bir kod göreceksiniz: bir `<script>` bloğu ve onun altında bir `<noscript>` bloğu. `<noscript>` kısmı, JavaScript'in kapalı olduğu tarayıcılarda bir görüntü pikseli üzerinden temel veri gönderir. Kodun tamamını, hiçbir satırı atlamadan kopyalayın. Kodun içinde `_linkedin_partner_id` değişkenine atanmış sayısal bir değer göreceksiniz. Bu sizin Partner ID'nizdir.

### Adım 5: Kodu sitenizin her sayfasına ekleyin

LinkedIn'in önerisi, kodu sitenizin **tüm sayfalarında**, kapanış `</body>` etiketinden hemen önce yer alacak şekilde eklemektir. Burada kritik nokta "tüm sayfalar" ifadesidir. Kodu yalnızca ana sayfaya eklerseniz teşekkür sayfasındaki dönüşümleri ve blog ziyaretçilerini göremezsiniz.

Yaygın platformlarda pratik yaklaşım şöyledir:

- **WordPress:** Temanızın `footer.php` dosyasına eklemek yerine bir "header/footer kod ekleme" eklentisi kullanmak daha güvenlidir. Tema güncellemesinde kod silinmez.
- **Webflow:** Project Settings > Custom Code > Footer Code alanına yapıştırıp siteyi yeniden yayınlayın.
- **HubSpot CMS:** Settings > Website > Pages > Site Footer HTML alanına ekleyin. Landing page'ler farklı bir şablon kullanıyorsa onları ayrıca kontrol edin.
- **Özel kodlanmış siteler:** Ortak layout ya da footer bileşenine eklenmesi, kodun tüm sayfalara tek noktadan dağılmasını sağlar.

### Adım 6: Siteyi yayına alın ve doğrulamayı bekleyin

Kodu ekleyip değişiklikleri yayınladıktan sonra sitenizi birkaç sayfa gezerek ziyaret edin. LinkedIn, etiketin sinyal aldığı alan adlarını Insight Tag ekranında listeler. Durum bilgisinin "Active" olarak görünmesi **24 saate kadar** sürebilir. İlk birkaç saatte "No recent activity" görmeniz normaldir. Panik yapıp kodu tekrar tekrar eklemeyin.

## Google Tag Manager ile nasıl kurulur?

Sitenizde Google Tag Manager (GTM) kullanıyorsanız Insight Tag'i GTM üzerinden kurmanızı öneririz. Bu yöntem, kodu geliştiriciye ihtiyaç duymadan yönetmenizi, çerez onayıyla tetiklemenizi ve olay bazlı dönüşümleri kolayca tanımlamanızı sağlar.

1. Campaign Manager'da kurulum yöntemi olarak **"I will use a tag manager"** seçeneğini işaretleyin ve size gösterilen **Partner ID**'yi kopyalayın.
2. GTM konteynerinizde **Etiketler > Yeni** seçeneğine tıklayın.
3. Etiket türü olarak şablon galerisinden **"LinkedIn Insight"** etiketini seçin. GTM'de hazır bir şablon olarak bulunur.
4. Partner ID alanına kopyaladığınız numarayı yapıştırın.
5. Tetikleyici olarak **"All Pages"** (Tüm Sayfalar) seçin. Çerez onayı kullanıyorsanız buraya pazarlama çerezlerine izin verildiğinde tetiklenen özel tetikleyiciyi bağlayın.
6. **Önizleme (Preview)** moduna girip sitenizi gezin. Etiketin "Tags Fired" listesinde göründüğünü kontrol edin.
7. Her şey doğruysa konteyneri **yayınlayın (Submit > Publish)** ve sürüme açıklayıcı bir isim verin. Örneğin "LinkedIn Insight Tag eklendi".

GTM kullanıyorsanız aynı etiketi hem manuel hem GTM üzerinden eklememeye dikkat edin. Çift kurulum, sayfa görüntülemelerinin ve dönüşümlerin şişmesine yol açabilir.

## Kurulumun çalıştığını nasıl doğrularsınız?

24 saat beklemek zorunda kalmadan etiketin çalışıp çalışmadığını kendiniz test edebilirsiniz.

- **Tarayıcı geliştirici araçları:** Chrome'da sitenizi açın, F12 ile geliştirici araçlarını açıp **Network** sekmesine geçin. Filtre alanına `linkedin` ya da `px.ads` yazın ve sayfayı yenileyin. `px.ads.linkedin.com` adresine giden istekler görüyorsanız etiket tetikleniyor demektir.
- **Kaynak kodu kontrolü:** Sayfaya sağ tıklayıp "Sayfa kaynağını görüntüle" deyin ve `_linkedin_partner_id` ifadesini arayın. Bulamıyorsanız kod o sayfada yok demektir. Ancak GTM ile kurulumda kod kaynakta görünmez. Bu durumda Network sekmesini kullanın.
- **Campaign Manager durumu:** Insight Tag ekranında alan adınızın listelendiğini ve son sinyal zamanının güncel olduğunu kontrol edin.
- **Farklı sayfa türlerini test edin:** Ana sayfa, blog yazısı, landing page ve teşekkür sayfası ayrı şablonlar kullanıyor olabilir. Dördünü de ayrı ayrı kontrol edin.

Çerez onay bandınız varsa testi yaparken bandda "Kabul et" seçeneğine tıklamayı unutmayın. Onay vermeden yapılan testlerde etiketin tetiklenmemesi, sistemin doğru çalıştığını gösterir.

## Dönüşüm takibi nasıl tanımlanır?

Insight Tag'i kurmak işin yarısıdır. Kampanya raporlarında anlamlı veri görmek için dönüşümleri ayrıca tanımlamanız gerekir. Campaign Manager'da **Analyze > Conversion tracking** (veya Data > Conversions) bölümüne gidin ve **"Create conversion"** ile yeni dönüşüm oluşturun.

### Dönüşüm ayarları

Her dönüşüm için şu alanları dolduracaksınız:

- **Dönüşüm adı:** Raporlarda kolay ayırt edilecek bir isim verin. Örneğin "Demo Talebi – Teşekkür Sayfası".
- **Dönüşüm türü:** Lead, Sign up, Download, Purchase gibi seçeneklerden en uygununu seçin.
- **Değer (opsiyonel):** Her dönüşüme ortalama bir değer atayabilirsiniz. Örneğin bir demo talebinin satışa dönüşme oranından hesaplanan tahmini bir tutar. Bu, ROAS hesaplamasını mümkün kılar.
- **Atıf penceresi (attribution window):** Varsayılan olarak tıklama sonrası 30 gün, görüntüleme sonrası 7 gündür. B2B satış döngüsü uzun olan şirketler tıklama penceresini 90 güne kadar uzatabilir. Kısa döngülü kampanyalarda daraltmak daha temiz veri sağlar.
- **Atıf modeli:** Tek bir kampanyaya mı (last touch) yoksa etkileşimde bulunulan tüm kampanyalara mı kredi verileceğini seçersiniz.

### URL bazlı mı, olay bazlı mı?

LinkedIn iki yöntem sunar:

1. **Sayfa yüklemesi (Page load / URL kuralı):** Kullanıcı belirli bir URL'ye ulaştığında dönüşüm sayılır. Örneğin URL `/tesekkurler-demo` içeriyorsa. Formdan sonra ayrı bir teşekkür sayfasına yönlendirme yapan sitelerde en kolay ve en güvenilir yöntemdir.
2. **Olay bazlı (Event-specific):** Buton tıklaması veya form gönderimi gibi sayfa değişmeden gerçekleşen eylemler için kullanılır. Form aynı sayfada "Teşekkürler" mesajı gösteriyorsa bu yöntemi seçmelisiniz. Uygulaması için LinkedIn'in verdiği olay kodunu ilgili butona ya da GTM'deki form gönderim tetikleyicisine bağlarsınız.

Pratik bir örnek: Bir yazılım şirketinin üç dönüşümü olduğunu düşünelim. Demo talebi `/demo-tesekkurler` sayfasına yönleniyor, e-kitap indirme `/e-kitap-tesekkurler` sayfasına gidiyor, bülten aboneliği ise aynı sayfada onay mesajı gösteriyor. İlk ikisi URL kuralıyla, üçüncüsü olay bazlı tanımlanır. Böylece her kampanyanın hangi dönüşüm türünü ne maliyetle ürettiği ayrı ayrı görülür.

LinkedIn içinde kalan form akışlarını tercih ediyorsanız [LinkedIn Lead Gen Form kurulumunu](/blog/linkedin-lead-gen-form-nasil-kurulur) anlattığımız rehbere de göz atabilirsiniz. O formlar dönüşümü Insight Tag olmadan da kaydeder. Insight Tag ise site içi dönüşümler için gereklidir.

### LinkedIn ve GA4 verileri neden birbirini tutmaz?

Kurulumdan sonra en sık duyduğumuz soru budur. LinkedIn, reklamı görüp daha sonra sitenize doğrudan gelen kişiyi de (view-through) dönüşüme sayabilir. GA4 ise genellikle son tıklamaya veya kendi atıf modeline göre kredi verir. Bu nedenle iki platformun rakamları arasında fark olması normaldir. Bütüncül bir görünüm için LinkedIn trafiğinizi [UTM parametreleriyle etiketlemenizi](/blog/utm-parametreleri-sosyal-medya-trafigi-olcumu) ve [GA4'te sosyal medya dönüşümlerini](/blog/ga4-sosyal-medya-donusumleri-nasil-izlenir) ayrıca izlemenizi öneririz.

## Insight Tag ile yeniden pazarlama kitlesi nasıl oluşturulur?

Insight Tag aktif olduktan sonra Campaign Manager'da **Plan > Audiences > Create audience > Website** yolunu izleyerek web sitesi ziyaretçi kitleleri oluşturabilirsiniz.

Kitle oluştururken iki şeyi belirlersiniz:

- **URL kuralı:** Tüm site ziyaretçileri, belirli bir URL'yi içeren sayfalar (ör. `/fiyatlandirma`) veya belirli bir URL ile başlayan sayfalar (ör. `/blog/`).
- **Geriye dönük süre:** Ziyaretçileri son 30, 60, 90 veya 180 gün içinde siteye gelenler olarak sınırlarsınız.

B2B için işe yarayan bazı kitle kurguları şunlardır:

- **Sıcak kitle:** Son 30 günde fiyatlandırma veya demo sayfasını ziyaret eden ama teşekkür sayfasına ulaşmayan kişiler. Bu kitleye müşteri vaka çalışması veya kısa bir demo videosu gösterilebilir.
- **İçerik okuyucuları:** Son 90 günde blogu ziyaret edenler. Bu kitleye e-kitap veya webinar gibi bir sonraki aşama içerik önerilebilir.
- **Hariç tutma kitlesi:** Teşekkür sayfasını ziyaret edenler, yani zaten dönüşüm sağlamış kişiler. Bu kişileri kampanyalardan dışlayarak bütçenin boşa harcanmasını önlersiniz.

Önemli bir sınır: Bir web sitesi kitlesinin reklam yayınlamak için **en az 300 eşleşen üyeye** ulaşması gerekir. Trafiği düşük B2B sitelerinde dar URL kurallı kitleler bu eşiğe geç ulaşır. Bu yüzden Insight Tag'i reklam vermeyi planladığınız tarihten haftalar önce kurmak akıllıca olur. Kitle toplamaya ancak etiket kurulduğu andan itibaren başlanır, geriye dönük veri oluşmaz.

Retargeting kitlelerini firmografik hedeflemeyle birleştirmek için [LinkedIn reklamında B2B hedeflemenin nasıl yapıldığını](/blog/linkedin-reklaminda-b2b-hedefleme-nasil-yapilir) anlattığımız yazı iyi bir tamamlayıcı olacaktır.

## KVKK ve çerez onayı açısından nelere dikkat etmelisiniz?

Insight Tag, pazarlama ve reklam amaçlı bir izleme teknolojisidir. Bu nedenle çoğu durumda zorunlu çerezler kategorisine girmez ve kullanıcının açık rızasını gerektirir. Hukuki değerlendirme için mutlaka kendi hukuk danışmanınızla çalışın. Uygulama tarafında ise şu adımlar standart kabul görür:

- **Çerez bandında pazarlama kategorisi:** Insight Tag'i "Pazarlama" veya "Reklam" çerezleri kategorisine bağlayın. Kullanıcı bu kategoriyi onaylamadan etiket tetiklenmesin.
- **GTM'de onay modu:** GTM kullanıyorsanız etiketin tetikleyicisini CMP'nizin onay olayına bağlayın.
- **Çerez politikası güncellemesi:** Çerez politikanızda LinkedIn'in kullandığı çerezleri ve amacını açıkça listeleyin.
- **Birinci taraf çerez ayarı:** Insight Tag ayarlarında birinci taraf çerez kullanımını etkinleştirme seçeneği bulunur. Üçüncü taraf çerezlerin tarayıcılarda giderek kısıtlandığı bir ortamda bu ayar ölçüm doğruluğunu artırabilir. Ancak bunun da çerez politikanızda yer alması gerekir.

Çerez onayının bir sonucu olarak, onay vermeyen ziyaretçiler ölçülmez ve raporlarınızdaki rakamlar gerçek trafiğin altında kalır. Bu bir hata değil, uyumun doğal sonucudur. Raporlama yaparken bu farkı yöneticilere önceden açıklamak beklenti yönetimi açısından önemlidir.

## Maliyeti ne kadar?

LinkedIn Insight Tag tamamen **ücretsizdir**. Kodu almak, sitenize kurmak, web sitesi demografisini görmek ve dönüşüm tanımlamak için hiçbir ücret ödemezsiniz. Reklam hesabı açmak da ücretsizdir. Ödeme ancak kampanya yayınladığınızda, reklam harcaması olarak başlar.

Gerçek maliyet zaman ve uzmanlıktır. Basit bir siteye manuel kurulum 15-30 dakika sürer. Birden fazla dönüşüm, GTM olay takibi, çerez onayı entegrasyonu ve kitle kurgusu içeren kapsamlı bir kurulum ise genellikle birkaç saatlik planlama ve test gerektirir. Bu yatırım ilk kampanyada geri döner. Ölçülemeyen bir kampanya optimize edilemez.

## En sık yapılan kurulum hataları nelerdir?

Yıllar içinde denetlediğimiz reklam hesaplarında tekrar tekrar karşılaştığımız hatalar şunlar:

1. **Kodun yalnızca ana sayfada olması:** Teşekkür sayfaları ve landing page'ler ayrı şablon kullandığında kod oraya ulaşmaz. Dönüşümler sıfır görünür.
2. **Yanlış reklam hesabının Partner ID'si:** Ajans değişikliği veya yeni hesap açılması sonrası eski hesabın kodu sitede kalır. Veriler yanlış hesaba akar.
3. **Çift kurulum:** Hem manuel hem GTM üzerinden eklenen etiket, sayıların şişmesine yol açar.
4. **Teşekkür sayfasının doğrudan erişilebilir olması:** Teşekkür sayfası arama motorlarında indekslenmiş ya da menüden ulaşılabilir durumdaysa form doldurmayan kişiler de dönüşüm olarak sayılır. Bu sayfaları `noindex` yapın ve yalnızca form sonrası yönlendirmeyle erişilebilir tutun.
5. **Geniş URL kuralı:** "URL `tesekkurler` içeriyorsa" gibi geniş bir kural, bülten onayı ile demo talebini aynı dönüşüme toplar. Kuralları her dönüşüm için ayrı ve spesifik yazın.
6. **Tek sayfalık uygulamalarda (SPA) sayfa değişiminin algılanmaması:** React veya Vue tabanlı sitelerde URL değişse de sayfa yeniden yüklenmez. Bu durumda olay bazlı dönüşüm veya GTM'de geçmiş değişikliği (history change) tetikleyicisi kullanmak gerekir.
7. **Reklamdan hemen önce kurulum:** Retargeting kitlesi 300 üye eşiğine ulaşmadan kampanya planlanır, kitle yayın alamaz.

Kurulumu tamamladıktan sonra farklı mesajların dönüşüm üzerindeki etkisini sağlıklı ölçmek için [B2B reklamlarda A/B testinin nasıl yapıldığını](/blog/b2b-reklamda-ab-test-nasil-yapilir) anlattığımız rehberi de inceleyebilirsiniz. Dönüşüm verisi olmadan yapılan testler yalnızca tıklama oranına bakar ve yanıltıcı sonuç verebilir.

## Kurulumdan sonra ilk 30 gün için kontrol listesi

Kurulumun teknik olarak bitmesi, ölçüm sisteminin oturduğu anlamına gelmez. İlk ay için önerdiğimiz rutin şudur:

- **1. gün:** Network sekmesiyle tüm sayfa şablonlarında etiketin tetiklendiğini doğrulayın. Her dönüşüm için bir test formu doldurun.
- **2.-3. gün:** Campaign Manager'da alan adının "Active" göründüğünü ve test dönüşümlerinin kaydedildiğini kontrol edin.
- **1. hafta:** Retargeting kitlelerini oluşturun ve kitle büyüklüklerinin artmaya başladığını izleyin.
- **2.-4. hafta:** Website Demographics raporunu inceleyin. Ziyaretçi profilinin hedef personanızla örtüşüp örtüşmediğine bakın. Ciddi bir sapma varsa içerik ve dağıtım stratejinizi gözden geçirin.
- **30. gün:** LinkedIn dönüşüm verisini GA4 ve CRM verisiyle karşılaştırın. Farkların nedenlerini (atıf penceresi, view-through, çerez onayı) belgeleyin ve raporlama standardınızı buna göre belirleyin.

Insight Tag verisini satış ekibinin kullandığı lead akışıyla birleştirmek istiyorsanız, outbound ve inbound kanalları birlikte kurgulamak için [B2B SaaS şirketlerine outbound satış ve lead generation hizmeti veren SAAS Corner](https://saascorner.co) ile kardeş şirketimiz olarak birlikte çalışıyoruz.

## Sık sorulan sorular

### LinkedIn Insight Tag reklam vermeden kurulabilir mi?

Evet. Insight Tag'i kurmak için aktif bir kampanyanız olması gerekmez, ücretsiz bir Campaign Manager hesabı yeterlidir. Reklam vermeseniz bile web sitesi demografisi raporuyla ziyaretçilerinizin sektör, unvan ve şirket büyüklüğü dağılımını görebilir, ileride kullanmak üzere retargeting kitleleri biriktirebilirsiniz.

### Insight Tag kurulduktan sonra veriler ne zaman görünür?

Etiketin Campaign Manager'da "Active" durumuna geçmesi 24 saate kadar sürebilir. Dönüşümler kaydedilmeye kurulumdan sonra başlar, ancak web sitesi demografisi ve retargeting kitleleri anlamlı büyüklüğe ulaşmak için yeterli trafiğe ihtiyaç duyar. Kitlelerin reklam yayını için en az 300 üyeye ulaşması gerekir.

### Insight Tag sitemi yavaşlatır mı?

Insight Tag asenkron yüklenen hafif bir koddur ve sayfa yüklenmesini engellemeyecek şekilde tasarlanmıştır. Normal koşullarda kullanıcı deneyiminde fark edilir bir yavaşlama yaratmaz. Yine de çok sayıda izleme kodu kullanan sitelerde tüm etiketleri Google Tag Manager altında toplamak performans yönetimini kolaylaştırır.

### Birden fazla web sitesi için tek bir Insight Tag kullanılabilir mi?

Evet. Aynı reklam hesabına ait Insight Tag'i birden fazla alan adına kurabilirsiniz. LinkedIn her alan adını Insight Tag ekranında ayrı listeler. Bu sayede ana siteniz, blog alt alan adınız ve kampanya landing page'leriniz tek bir hesapta ölçülür ve ortak retargeting kitlelerine dahil edilebilir.

## Sonuç

LinkedIn Insight Tag, B2B şirketlerin LinkedIn reklamlarından gerçek iş sonucu almasının ön koşuludur. Kod ücretsizdir ve teknik kurulumu birkaç dakika sürer. Ancak değeri doğru dönüşüm tanımlarından, mantıklı kitle kurgularından, KVKK uyumlu çerez yönetiminden ve düzenli veri kontrolünden gelir. Etiketi reklam planlarınızdan haftalar önce kurmak, hem retargeting kitlelerinizin hazır olmasını hem de kampanyalarınızın ilk günden ölçülebilir olmasını sağlar.

Insight Tag kurulumunu, dönüşüm kurgunuzu ve LinkedIn reklam ölçümlemenizi uçtan uca birlikte planlamak isterseniz [Social Media Corner ekibiyle iletişime geçin](/iletisim). Hesabınızı inceleyelim ve ölçülebilir bir B2B reklam altyapısı kuralım.
