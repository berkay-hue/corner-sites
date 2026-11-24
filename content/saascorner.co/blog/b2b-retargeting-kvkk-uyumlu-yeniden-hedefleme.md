---
title: "B2B Retargeting: KVKK'ya Uygun Yeniden Hedefleme"
description: "B2B retargeting reklamlarını KVKK ve çerez izni kurallarına uyarak nasıl kurarsınız? Kitle, çerez onayı ve platform ayarlarını adım adım anlatıyoruz."
date: "2026-11-24"
category: "Pazarlama"
image: "https://images.pexels.com/photos/106344/pexels-photo-106344.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "B2B Retargeting: KVKK'ya Uygun Yeniden Hedefleme"
alt: "b2b-retargeting-kvkk-compliance"
---

B2B retargeting, web sitenizi ziyaret etmiş ya da sizinle temas kurmuş karar vericilere LinkedIn, Google ve Meta gibi platformlarda yeniden reklam göstermektir. Türkiye'de bunu KVKK'ya uygun yapmanın temel şartı, pazarlama çerezlerini ve pixel'leri **ziyaretçinin açık rızası alınmadan çalıştırmamaktır**. Müşteri ya da lead listelerini reklam platformlarına yüklerken de **aydınlatma**, **hukuki dayanak** ve **yurt dışına aktarım** kurallarına uymanız gerekir. Kısacası retargeting yasak değildir. Yasa dışı olan, rızasız takip ve dayanaksız veri aktarımıdır.

Bu yazıda B2B SaaS şirketlerinin retargeting kampanyalarını hukuki riski azaltarak nasıl kurabileceğini anlatıyoruz. Hangi verinin kişisel veri sayıldığını, çerez bannerının nasıl olması gerektiğini ve liste yüklemenin kurallarını adım adım ele alıyoruz. Rıza oranı düşük kaldığında da etkili kalan alternatif hedefleme yöntemlerini de inceliyoruz. Yazı genel bir yol haritası sunar, hukuki görüş yerine geçmez. Nihai kurguyu mutlaka bir KVKK danışmanıyla doğrulayın.

## B2B retargeting nedir, B2C'den farkı ne?

Retargeting, daha önce markanızla etkileşime girmiş kişilere tekrar ulaşma pratiğidir. Bu etkileşim web sitesi ziyareti, demo formunu yarıda bırakma, webinar kaydı ya da bir e-posta açma olabilir. Teknik olarak iki ana yöntemle yapılır:

- **Pixel/çerez tabanlı retargeting:** Sitenize yerleştirilen LinkedIn Insight Tag, Meta Pixel veya Google Ads etiketi ziyaretçiyi tanır. Platform bu kişiye daha sonra reklam gösterir.
- **Liste tabanlı retargeting:** Elinizdeki e-posta adreslerini veya şirket listelerini platforma yüklersiniz (Custom Audience, Matched Audiences, Customer Match). Platform bu kayıtları kendi kullanıcılarıyla eşleştirir.

B2B'de bu sürecin dinamiği B2C'den belirgin biçimde farklıdır:

- **Satış döngüsü uzundur.** Bir SaaS aracının satın alınması 3 ila 9 ay sürebilir. Bu yüzden retargeting penceresi 7 gün değil, 90-180 gün düşünülmelidir.
- **Satın alma kararını birden fazla kişi verir.** Siteyi ziyaret eden operasyon müdürü tek başına karar vermez. Finans ve IT de sürece dahildir.
- **Hedef kitle küçüktür.** Binlerce kişilik değil, bazen birkaç yüz kişilik kitlelerle çalışırsınız. Rıza kaynaklı her kayıp oransal olarak daha çok hissedilir.

Bu son madde, KVKK uyumunun B2B'de neden stratejik bir konu olduğunu da açıklar. Kitleniz zaten küçükken bir de rıza oranı düşükse, sadece pixel'e dayanan bir strateji hızla tıkanır.

## "B2B'deyiz, kurumsal veri KVKK'ya girmez" doğru mu?

Hayır. B2B pazarlamanın en yaygın yanılgısı budur. KVKK tüzel kişilerin verisini korumaz, ama **çalışanlar gerçek kişidir**. Retargeting'de kullanılan verilerin büyük kısmı da kişisel veri niteliği taşır:

- **Kurumsal e-posta adresi** (ahmet.yilmaz@firma.com): Kimliği belirli bir kişiyle ilişkilendirildiği için kişisel veridir.
- **Çerez kimlikleri ve cihaz kimlikleri:** Tek başına isim içermese de bir kişiyi tekil olarak ayırt etmeye yaradığı için kişisel veri kapsamında değerlendirilir.
- **IP adresi:** Özellikle diğer verilerle birleştirildiğinde kişisel veri sayılır.
- **Hashlenmiş e-posta:** Platformlara yüklerken e-postalar genellikle SHA-256 ile hashlenir. Bu bir güvenlik önlemidir, anonimleştirme değildir. Platform eşleştirme yapabildiğine göre veri hâlâ kişiyi belirlenebilir kılar.

Buna karşılık **yalnızca şirket adı, sektör ve çalışan sayısı** gibi firma düzeyindeki bilgiler, bir kişiyle ilişkilendirilmedikçe kişisel veri değildir. Bu ayrım ileride anlatacağımız hesap bazlı hedefleme alternatifinin temelini oluşturur.

## Çerez rızası olmadan pixel çalıştırabilir miyim?

Kısa cevap: **Pazarlama ve reklam çerezleri için hayır.** Kişisel Verileri Koruma Kurumu'nun çerez uygulamalarına ilişkin rehberi, zorunlu olmayan çerezlerin açık rızaya dayanması gerektiği yönünde bir yaklaşım ortaya koyar. Retargeting pixel'leri bu kategoriye girer. Hizmetin teknik olarak çalışması için zorunlu değildirler.

Pratikte bu, şu kuralların uygulanması anlamına gelir:

1. **Pixel, rıza verilmeden yüklenmemeli.** Sayfa açılır açılmaz LinkedIn Insight Tag'in tetiklenmesi, bannerda "Kabul et" butonu olsa bile uyumsuzdur. Etiket ancak kullanıcı pazarlama çerezlerine onay verdikten sonra çalışmalıdır.
2. **"Kabul et" ve "Reddet" eşit görünürlükte olmalı.** Reddetme seçeneğini küçük gri bir linkin arkasına saklamak ya da iki tıklama derinliğe gömmek rızanın özgürce verildiği iddiasını zayıflatır.
3. **Önceden işaretli kutu kullanılmamalı.** Pazarlama çerezleri varsayılan olarak kapalı gelmelidir.
4. **"Siteyi kullanmaya devam ederek kabul etmiş sayılırsınız" ifadesi yeterli değildir.** Açık rıza, olumlu bir eylemle verilmelidir.
5. **Rıza kategorilere ayrılmalı.** Zorunlu, analitik, işlevsel ve pazarlama çerezleri ayrı ayrı yönetilebilmelidir.
6. **Rıza geri alınabilmeli.** Footer'da ya da sabit bir ikonla tercihleri değiştirme imkânı sunulmalıdır.

Teknik tarafta en sağlıklı yol, Google Tag Manager gibi bir etiket yöneticisini bir **Consent Management Platform (CMP)** ile entegre etmektir. Her etiket bir rıza kategorisine bağlanır ve yalnızca ilgili onay geldiğinde tetiklenir. Google tarafında Consent Mode yapılandırması da bu akışın bir parçası olarak düşünülmelidir.

### Aydınlatma metni nerede durmalı?

Çerez bannerından erişilebilen bir **çerez politikası** ve ayrı bir **aydınlatma metni** bulunmalıdır. Bu metinlerde hangi çerezlerin kullanıldığı, hangi amaçla, ne süreyle saklandığı ve hangi üçüncü taraflara (LinkedIn, Meta, Google gibi) aktarıldığı açıkça yazılmalıdır. "Hizmetlerimizi geliştirmek için çerez kullanıyoruz" gibi genel cümleler yeterli değildir.

## Müşteri veya lead listesini LinkedIn ya da Meta'ya yüklemek yasal mı?

Liste tabanlı retargeting B2B'de çok güçlüdür. Örneğin demo almış ama satın almamış 400 kişilik bir listeyi LinkedIn'e yükleyip onlara vaka çalışması reklamı gösterebilirsiniz. Ancak bu işlem KVKK açısından üç ayrı soruyu gündeme getirir.

### 1. Hukuki dayanağınız ne?

E-posta adresini bir form aracılığıyla topladığınızda, kişiye bu verinin reklam platformlarında hedefleme amacıyla kullanılacağını söylediniz mi? Söylemediyseniz, veriyi topladığınız amacın dışında kullanıyorsunuz demektir. Bu durum KVKK'nın amaçla bağlantılı ve sınırlı işleme ilkesine aykırı düşer.

Pratik öneri: Form aşamasında aydınlatma metnine reklam hedeflemesini açıkça ekleyin. Pazarlama amaçlı kullanım için **ayrı ve isteğe bağlı bir onay kutusu** koyun. Bu kutu işaretlenmeden form gönderilebilmeli, yani rıza demo talebinin ön şartı yapılmamalıdır.

### 2. Yurt dışına aktarım yapıyor musunuz?

LinkedIn, Meta ve Google sunucularının önemli kısmı Türkiye dışındadır. Listeyi yüklemek, kişisel veriyi yurt dışına aktarmak anlamına gelir. 2024'te yürürlüğe giren değişikliklerle KVKK'nın 9. maddesi yeniden düzenlendi. Artık yeterlilik kararı, uygun güvenceler (örneğin Kurul'un yayımladığı **standart sözleşmeler**) ve belirli istisnai durumlar gibi daha kademeli bir sistem var. Standart sözleşme kullanıldığında, imzadan sonra belirli bir süre içinde Kurum'a bildirim yükümlülüğü de bulunur.

Platform sözleşmelerinin bu çerçeveye nasıl oturduğu teknik ve hukuki bir değerlendirme gerektirir. Bu adımı mutlaka hukuk danışmanınızla birlikte planlayın. "Herkes yüklüyor" demek bir dayanak değildir.

### 3. Veriyi minimize ediyor musunuz?

- Sadece gerekli alanları yükleyin. Çoğu durumda e-posta yeterlidir. Telefon, unvan veya adres eklemeyin.
- Platformun sunduğu hashleme özelliğini kullanın ya da veriyi yüklemeden önce kendiniz hashleyin.
- Abonelikten çıkan, verisinin silinmesini talep eden veya rızasını geri çeken kişileri listeden **otomatik olarak** çıkarın. Bunu manuel yapmak, er ya da geç birinin unutulması demektir.

Bu konular, soğuk iletişimde karşılaşılan izin sorularıyla doğrudan bağlantılıdır. Outbound tarafında da benzer bir çerçeveye ihtiyaç duyuyorsanız [B2B soğuk e-postada KVKK açısından neler yapılabileceğini](/blog/b2b-soguk-eposta-kvkk-rehberi) anlattığımız yazıya göz atabilirsiniz.

## KVKK'ya uygun retargeting altyapısı nasıl kurulur? 7 adım

Aşağıdaki adımlar orta ölçekli bir B2B SaaS şirketinin 4-6 haftada tamamlayabileceği bir kurulum planıdır.

1. **Veri envanteri çıkarın.** Sitenizde hangi etiketlerin çalıştığını listeleyin: LinkedIn Insight Tag, Meta Pixel, Google Ads, Hotjar, HubSpot tracking kodu, chatbot'lar. Çoğu şirket bu envanteri ilk kez çıkardığında unutulmuş 2-3 eski etiket bulur.
2. **Her etiketi bir kategoriye atayın.** Zorunlu, analitik, işlevsel ve pazarlama olarak ayırın. Retargeting etiketlerinin tamamı pazarlama kategorisine girer.
3. **CMP seçip etiket yöneticisine bağlayın.** Pazarlama etiketlerinin yalnızca rıza sinyaliyle tetiklendiğini test edin. Tarayıcının geliştirici araçlarında, rıza vermeden önce ağ isteklerinde LinkedIn veya Meta domain'lerinin görünmediğini kontrol edin.
4. **Aydınlatma metnini ve çerez politikasını güncelleyin.** Hangi platforma, hangi amaçla, ne kadar süreyle veri gittiğini tek tek yazın.
5. **Formları yeniden tasarlayın.** Demo, içerik indirme ve webinar formlarına isteğe bağlı pazarlama onayı ekleyin. Onay durumunu CRM'de ayrı bir alan olarak tutun, örneğin "Reklam hedefleme onayı: Evet/Hayır, tarih, kaynak".
6. **CRM ile reklam platformları arasında senkronizasyon kurun.** Yalnızca onayı "Evet" olan kayıtlar reklam kitlelerine aktarılmalı. Onay geri çekildiğinde kayıt kitleden düşmeli. Bu akışı kurgularken [B2B pazarlama otomasyonu aracı seçiminde](/blog/b2b-pazarlama-otomasyonu-araci-nasil-secilir) rıza yönetimi ve reklam entegrasyonlarını önemli kriterler arasına almak işinizi kolaylaştırır.
7. **Saklama sürelerini belirleyin.** Retargeting kitlelerinde kişilerin ne kadar süre kalacağını tanımlayın, örneğin 180 gün. Platform ayarlarını buna göre yapılandırın.

## Rıza oranı düşükse retargeting işe yarar mı?

Bu, uyumlu bir kurulumdan sonra herkesin sorduğu sorudur. Bir örnekle bakalım:

- Aylık 8.000 tekil ziyaretçi alan bir B2B SaaS sitesi düşünelim.
- Pazarlama çerezlerine onay oranı %40 olsun. Bu oran banner tasarımına ve kitleye göre ciddi biçimde değişir.
- Bu durumda pixel'in tanıyabileceği kitle aylık yaklaşık 3.200 kişidir.
- Platformun eşleştirme oranı da devreye girer. LinkedIn, ziyaretçiyi ancak oturum açmış bir üyeyle eşleştirebildiğinde tanır. Gerçekte reklam gösterilebilecek kitle daha da küçülür.
- LinkedIn'de bir kitlenin kampanyada kullanılabilmesi için genellikle en az 300 eşleşmiş üye gerekir. Fiyatlandırma sayfası ziyaretçileri gibi niş segmentler bu eşiğin altında kalabilir.

Sonuç: Rıza oranı düşükse, pixel tabanlı retargeting tek başına yetmez. Ama bu, retargeting'den vazgeçmeniz gerektiği anlamına gelmez. Stratejiyi **katmanlı** kurmanız gerektiği anlamına gelir.

### Rıza oranını meşru yollarla artırmak

- Bannerı sade ve dürüst yazın. "Size ilgisiz reklamlar yerine işinize uygun içerik göstermek için" gibi gerçek faydayı anlatan ama baskı kurmayan bir dil kullanın.
- Banner'ın sayfa içeriğini tamamen kapatmasından kaçının. Kullanıcıyı "kabul etmeden ilerleyemezsin" noktasına sıkıştırmak rızanın özgürlüğünü tartışmalı hale getirir.
- Farklı banner metinlerini A/B test edin. Ancak "Reddet" seçeneğini zorlaştırarak oran yükseltmek bir test değil, bir risktir.

## Pixel'e bağımlı olmayan alternatifler neler?

KVKK uyumu, sizi aslında B2B'de zaten daha verimli olan yöntemlere yönlendirir.

### Hesap bazlı hedefleme (ABM)

LinkedIn, kişi listesi yerine **şirket listesi** yüklemenize izin verir. Hedef aldığınız 250 şirketin adını ve web sitesini yüklersiniz. Platform bu şirketlerde çalışan ve belirlediğiniz unvan kriterlerine uyan kişilere reklam gösterir. Siz kişisel veri yüklemezsiniz. Eşleştirmeyi platform kendi üyelik verisiyle yapar.

Bu yöntem teknik olarak retargeting değildir, ama B2B'de işlevsel olarak aynı amaca hizmet eder: Doğru hesaplara tekrar tekrar görünmek. Hedef hesaplarınızı nasıl belirleyeceğinizi [ABM ve hesap bazlı pazarlama rehberimizde](/blog/abm-nedir-b2b-saas-hesap-bazli-pazarlama) detaylı anlattık.

### Platform içi etkileşim retargeting'i

LinkedIn'de video reklamınızı %50'den fazla izleyenlere, Lead Gen Form'u açıp göndermeyenlere ya da şirket sayfanızla etkileşime girenlere yeniden reklam gösterebilirsiniz. Bu kitleler sizin sitenizdeki çerezlerle değil, platformun kendi verisiyle oluşur. Bu durum sizin site tarafındaki çerez yükümlülüğünüzü ortadan kaldırır. Platform tarafındaki veri işleme ise kullanıcının platformla arasındaki ilişkiye tabidir. Yine de aydınlatma metninizde bu platformları kullandığınızı belirtmek iyi bir uygulamadır.

Örnek bir kurgu şöyle olabilir:

- **1. hafta:** Hedef hesaplara 60 saniyelik problem odaklı video.
- **2-3. hafta:** Videoyu %50+ izleyenlere vaka çalışması karuseli.
- **4. hafta ve sonrası:** Karuselle etkileşime girenlere demo teklifli Lead Gen Form.

Bu tür LinkedIn kampanyalarını organik içerikle birlikte yönetmek istiyorsanız, [Social Media Corner'ın B2B LinkedIn yönetimi](https://socialmediacorner.co) tarafındaki deneyimi reklam ve içerik takvimini aynı çatı altında toplamanıza yardımcı olabilir.

### Bağlamsal hedefleme

Kişiyi değil, içeriği hedeflersiniz. "CRM entegrasyonu" konulu sayfalarda ya da sektör yayınlarında reklam göstermek bunun örneğidir. Takip verisi gerektirmez. Hedefleme hassasiyeti daha düşüktür, ama marka bilinirliği ve üst huni için iyi bir tamamlayıcıdır.

## B2B retargeting kampanyası nasıl segmentlenmeli?

Uyumlu bir altyapı kurduktan sonra asıl fark segmentasyonda ortaya çıkar. Herkese aynı reklamı göstermek, hem bütçe israfıdır hem de kullanıcıyı rahatsız eder.

| Segment | Pencere | Mesaj | Önerilen frekans |
|---|---|---|---|
| Blog okuyucuları | 90 gün | İlgili rehber veya lead magnet | Haftada 1-2 |
| Ürün/özellik sayfası ziyaretçileri | 60 gün | Vaka çalışması, kullanım senaryosu | Haftada 2-3 |
| Fiyat sayfası ziyaretçileri | 30 gün | Demo, ROI hesaplayıcı, karşılaştırma | Haftada 3 |
| Demo formunu yarıda bırakanlar | 14 gün | Kısa demo daveti, sosyal kanıt | Günde en fazla 1 |
| Mevcut müşteriler | Sürekli | Yeni özellik, upsell | Düşük |

Birkaç pratik kural:

- **Mevcut müşterileri ve açık fırsatları dışlayın.** Satış ekibi ile müzakere aşamasındaki bir hesaba "Ücretsiz demo alın" reklamı göstermek profesyonel görünmez. Bu dışlamayı yapabilmek için CRM'deki aşama verisinin pazarlamayla senkron olması gerekir. Bu noktada [pazarlama ve satış arasındaki lead devir SLA'sını](/blog/pazarlama-satis-uyumu-lead-devir-sla) netleştirmek kitle yönetimini de kolaylaştırır.
- **Frekansı sınırlayın.** Küçük B2B kitlelerinde aynı kişinin bir reklamı haftada 10 kez görmesi kolaydır. Bu hem bütçeyi eritir hem de "takip ediliyorum" hissi yaratır. KVKK uyumlu bir kampanya, algıda da saygılı olmalıdır.
- **Reklamın gittiği sayfayı segmente uygun hazırlayın.** Fiyat sayfası ziyaretçisini ana sayfaya göndermek dönüşümü düşürür. Her segment için ayrı bir açılış sayfası düşünün. Bu sayfaların yapısını [B2B SaaS landing page rehberimizde](/blog/b2b-saas-landing-page-rehberi) adım adım bulabilirsiniz.

### Bütçe nasıl planlanmalı?

Retargeting bütçesi genellikle toplam ücretli medya bütçesinin küçük bir kısmıdır, çünkü kitle küçüktür. Örnek bir planlama:

- Aylık ücretli reklam bütçesi 100.000 TL olan bir şirket, bunun %15-25'ini retargeting ve ABM katmanına ayırabilir.
- Kalan bütçe yeni kitle kazanımına gider. Retargeting havuzunu dolduran şey bu kazanım kampanyalarıdır.
- Kitle küçükse bütçeyi artırmak sonuç vermez, sadece frekansı yükseltir. Önce havuzu büyütün.

## En sık yapılan KVKK hataları

- **Pixel'i bannerdan önce yüklemek.** En yaygın ve teknik olarak en kolay tespit edilen hatadır.
- **Fuar veya etkinlikte toplanan kartvizitleri doğrudan reklam platformuna yüklemek.** Kişiye bu kullanım hakkında bilgi verilmediyse dayanak zayıftır.
- **Satın alınan listeleri Custom Audience olarak kullanmak.** Verinin hangi aydınlatma ve dayanakla toplandığını bilmediğiniz bir listeyi yurt dışındaki bir platforma aktarmak riski katlar.
- **Rıza geri alındığında kitleleri güncellememek.** CRM'de "abonelikten çıktı" görünen kişi haftalarca reklam görmeye devam eder.
- **Ajansın kendi hesabında kitle tutması.** Kitlelerin ve pixel'lerin şirketin kendi reklam hesabında olması hem kontrol hem sorumluluk açısından daha sağlıklıdır. Veri sorumlusu sizsiniz, ajans ise veri işleyen konumundadır. Bu ilişki yazılı bir sözleşmeyle düzenlenmelidir.

## Sık sorulan sorular

### B2B retargeting için açık rıza her zaman gerekli mi?

Sitenize yerleştirdiğiniz pazarlama çerezleri ve retargeting pixel'leri için açık rıza alınması gerektiği yönündeki yaklaşım yaygındır ve en güvenli yol budur. Şirket adı gibi kişisel veri içermeyen listelerle yapılan hesap bazlı hedeflemede ise sizin tarafınızda kişisel veri işleme sınırlı kalır. Her senaryonun dayanağını hukuk danışmanınızla ayrıca değerlendirin.

### E-posta adreslerini hashleyerek yüklemek KVKK sorununu çözer mi?

Hayır. Hashleme bir güvenlik önlemidir, anonimleştirme değildir. Platform hashlenmiş e-postayı kendi kullanıcılarıyla eşleştirebildiği için veri kişisel veri olmaya devam eder. Aydınlatma, hukuki dayanak ve yurt dışına aktarım kurallarına yine uymanız gerekir.

### LinkedIn şirket listesi hedeflemesi KVKK açısından daha mı güvenli?

Genellikle daha düşük risklidir. Çünkü yalnızca şirket adı ve web sitesi gibi firma düzeyindeki bilgileri yüklersiniz, eşleştirmeyi platform kendi üyelik verisiyle yapar. Yine de aydınlatma metninizde LinkedIn'i reklam amaçlı kullandığınızı belirtmeniz iyi bir uygulamadır.

### Rıza oranımız çok düşük, retargeting'i bırakmalı mıyız?

Bırakmanız gerekmez, stratejiyi katmanlamanız gerekir. Pixel tabanlı retargeting'i rıza veren ziyaretçilerle sürdürün. Yanına hesap bazlı hedefleme, platform içi etkileşim retargeting'i ve onaylı CRM listeleri ekleyin. B2B'de bu katmanlı yapı çoğu zaman tek başına pixel'den daha isabetli sonuç verir.

## Sonuç

KVKK'ya uygun B2B retargeting, kısıtlayıcı bir zorunluluktan çok daha disiplinli bir pazarlama modelidir. Pixel'leri rızaya bağlamak, formlarda dürüst aydınlatma yapmak, liste yüklemelerini hukuki dayanağa oturtmak ve CRM ile reklam kitlelerini senkron tutmak hem riski azaltır hem de bütçenin gerçekten ilgili hesaplara harcanmasını sağlar. Rıza oranının yetmediği yerde hesap bazlı hedefleme ve platform içi etkileşim kitleleri devreye girer. Sonuç olarak hem yasal hem de satış ekibinizin gerçekten işine yarayan bir retargeting yapısı kurarsınız.

Retargeting altyapınızı KVKK'ya uygun hale getirmek, CRM ve reklam platformlarınızı birbirine bağlamak ya da hesap bazlı kampanyalarınızı kurgulamak istiyorsanız [SAAS Corner ekibiyle iletişime geçin](/iletisim). Mevcut kurulumunuzu birlikte inceleyelim ve size uygun bir yol haritası çıkaralım.
