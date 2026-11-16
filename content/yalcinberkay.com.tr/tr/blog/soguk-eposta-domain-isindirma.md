---
title: "Soğuk E-posta İçin Domain Isındırma: Adım Adım Rehber"
description: "Soğuk e-postalarınız spam'e düşüyorsa; domain ısındırma sürecini, SPF, DKIM ve DMARC kayıtlarını ve günlük gönderim limitlerini adım adım anlatıyoruz."
date: "2026-11-17"
category: "Outbound"
image: "https://images.pexels.com/photos/39205100/pexels-photo-39205100.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Soğuk E-posta İçin Domain Isındırma: Adım Adım Rehber"
---

Soğuk e-posta için domain ısındırma, yeni bir alan adının ve posta kutularının e-posta sağlayıcıları gözünde güven kazanması için gönderim hacminin birkaç hafta boyunca yavaş yavaş artırılması sürecidir. Pratikte süreç 3-6 hafta sürer. Önce SPF, DKIM ve DMARC kayıtları doğru kurulur. Ardından her posta kutusundan günde birkaç e-postayla başlanır ve hacim kontrollü biçimde artırılır. Isındırılmamış bir domainden yüzlerce soğuk e-posta göndermek, mesajlarınızın spam klasörüne düşmesinin en hızlı yoludur.

Outbound ekiplerle çalışırken en sık gördüğüm senaryo şu: Ekip iyi bir liste hazırlamış, mesajlar özenle yazılmış, ama kampanyanın ilk haftasında yanıt oranı neredeyse sıfır. Sorun çoğu zaman metinde değil, altyapıdadır. Bu yazıda domain seçiminden DNS ayarlarına, ısındırma takviminden itibar takibine kadar süreci adım adım anlatacağım. Ekibinizdeki bir SDR'ın ya da satış operasyon sorumlusunun bu rehberle sıfırdan kurulum yapabilmesini hedefliyorum.

## Domain ısındırma nedir ve neden gerekir?

Gmail, Outlook ve diğer sağlayıcılar, gelen her e-postayı gönderen domainin ve IP adresinin geçmişine bakarak değerlendirir. Hiç geçmişi olmayan yeni bir domain, sağlayıcılar için bilinmeyen bir göndericidir. Bilinmeyen bir göndericinin ilk gün 300 kişiye e-posta atması, spam gönderen botların tipik davranışıyla birebir örtüşür.

Isındırma bu yüzden bir "itibar inşa etme" sürecidir. Sağlayıcılara şu sinyalleri vermeye çalışırsınız:

- Gönderici gerçek bir insan ya da kurumdur.
- Gönderilen e-postalar açılıyor, okunuyor ve yanıtlanıyor.
- Alıcılar bu e-postaları spam olarak işaretlemiyor.
- Gönderim hacmi tutarlı ve öngörülebilir.

Bu sinyaller birkaç hafta boyunca tutarlı biçimde birikince domaininizin "gönderici itibarı" oluşur. Bu itibar, e-postalarınızın gelen kutusuna mı, promosyonlar sekmesine mi, yoksa spam klasörüne mi düşeceğini belirleyen en önemli faktörlerden biridir.

Önemli bir not: Isındırma tek seferlik bir iş değildir. İtibar kazanıldığı gibi kaybedilir de. Kötü bir listeyle yapılan tek bir kampanya, haftalarca emek verdiğiniz bir domaini kısa sürede yakabilir.

## Neden ana domaininizden soğuk e-posta atmamalısınız?

Şirketinizin ana domaini (ör. sirketiniz.com) faturalarınızın, müşteri yazışmalarınızın, teklif ve sözleşmelerinizin aktığı kanaldır. Soğuk e-posta ise doğası gereği risk taşır. Alıcılar sizi tanımaz, bir kısmı mesajınızı spam olarak işaretler, listede geçersiz adresler çıkar.

Soğuk kampanyaları ana domainden yürütürseniz şu risklerle karşılaşırsınız:

- **Operasyonel e-postalarınız etkilenir:** Muhasebe ekibinin gönderdiği faturalar ya da müşteri başarı ekibinin destek yanıtları spam'e düşmeye başlayabilir.
- **İtibarı geri kazanmak zordur:** Ana domainin itibarı zedelendiğinde düzeltmesi aylar sürebilir ve bu sürede tüm şirket etkilenir.
- **Kara listeye girme riski:** Domain bir kara listeye girerse sorun sadece satış ekibini değil herkesi vurur.

Bu yüzden standart yaklaşım, soğuk e-posta için **ikincil domainler** kullanmaktır. Ana domain korunur, risk izole edilir.

## Adım 1: Doğru ikincil domaini seçmek

İkincil domain, ana markanıza yakın ama ondan ayrı bir alan adıdır. Alıcı e-postayı gördüğünde markanızı tanıyabilmeli ve aldatıldığını düşünmemelidir.

### İyi ikincil domain örnekleri

Ana domaininiz **orneksirket.com** ise şu varyasyonları düşünebilirsiniz:

- orneksirket.co
- orneksirketHQ.com (küçük harfle: orneksirkethq.com)
- getorneksirket.com
- orneksirket.io
- orneksirketsatis.com

### Kaçınmanız gerekenler

- **Spam çağrıştıran uzantılar:** Kötüye kullanımla sık anılan bazı ucuz uzantılar, sağlayıcılar gözünde baştan dezavantajlıdır. .com, .co, .io ve ülke uzantıları (.com.tr gibi) genelde daha güvenli tercihlerdir.
- **Tire ve rakam yığını:** "ornek-sirket-2024-satis.com" gibi adresler hem güven vermez hem de akılda kalmaz.
- **Markayla alakasız isimler:** Alıcı imzadaki şirket adıyla domain arasında bağ kuramıyorsa güven kaybedersiniz.

### Kaç domain gerekir?

Bu sorunun cevabı hedeflediğiniz günlük hacme bağlıdır. Pratikte sağlıklı bir kurgu şöyledir:

- Her domainde **2-3 posta kutusu**
- Her posta kutusundan ısındırma sonrası günde **en fazla 30-50 e-posta** (ısındırma trafiği dahil)

Örneğin günde 300 soğuk e-posta göndermek istiyorsanız, posta kutusu başına 30 e-postayla 10 posta kutusuna ihtiyacınız vardır. Bu da yaklaşık 4-5 ikincil domain demektir. Hacmi birden fazla domaine yaymak, bir domainde sorun çıktığında tüm operasyonun durmasını engeller.

### Yönlendirmeyi unutmayın

İkincil domaini satın aldıktan sonra web adresini ana sitenize **301 yönlendirmesiyle** bağlayın. Merak eden bir alıcı domaini tarayıcıya yazdığında boş bir sayfa ya da "bu alan adı satılık" uyarısı görmemeli, doğrudan ana sitenize ulaşmalıdır. Bu küçük detay hem güven verir hem de sağlayıcılar açısından domainin gerçek bir işletmeye ait olduğunu gösterir.

## Adım 2: DNS kimlik doğrulamasını kurmak (SPF, DKIM, DMARC)

Bu adım atlanırsa ısındırmanın hiçbir anlamı kalmaz. Büyük sağlayıcılar artık kimlik doğrulaması eksik e-postalara karşı oldukça katı davranıyor. Özellikle Google ve Yahoo'nun toplu göndericiler için getirdiği kurallar, doğru kimlik doğrulamayı fiilen zorunlu hale getirdi.

### SPF (Sender Policy Framework)

SPF, domaininiz adına hangi sunucuların e-posta göndermeye yetkili olduğunu belirtir. Google Workspace kullanıyorsanız tipik bir SPF kaydı şuna benzer:

`v=spf1 include:_spf.google.com ~all`

Dikkat edilecek noktalar:

- Bir domainde **yalnızca bir SPF kaydı** olmalıdır. İki ayrı SPF kaydı varsa doğrulama başarısız olur.
- Ek bir gönderim aracı kullanıyorsanız (ör. bir sekans aracı kendi sunucusundan gönderiyorsa), onun "include" ifadesini aynı kayda ekleyin.

### DKIM (DomainKeys Identified Mail)

DKIM, e-postalarınıza dijital bir imza ekler. Alıcı sunucu bu imzayı DNS'teki açık anahtarla doğrulayarak e-postanın yolda değiştirilmediğini anlar. Google Workspace ya da Microsoft 365 yönetim panelinden DKIM anahtarını oluşturup DNS'e TXT kaydı olarak eklersiniz. Mümkünse **2048 bit** anahtar tercih edin.

Kaydı ekledikten sonra yönetim panelinden "kimlik doğrulamayı başlat" adımını atlamayın. Pek çok ekip kaydı ekleyip bu adımı unuttuğu için DKIM'i hiç aktif etmemiş oluyor.

### DMARC

DMARC, SPF ve DKIM doğrulaması başarısız olduğunda alıcı sunucunun ne yapacağını söyler. Başlangıç için şu kayıt yeterlidir:

`v=DMARC1; p=none; rua=mailto:dmarc@orneksirket.co`

İlk haftalarda "p=none" ile başlayıp raporları izleyin. Her şey düzgün çalışıyorsa zamanla "p=quarantine" seviyesine geçebilirsiniz.

### Özel takip domaini (custom tracking domain)

Sekans araçlarının çoğu açılma ve tıklama takibi için paylaşımlı bir domain kullanır. Bu paylaşımlı domain başka kullanıcıların kötü davranışlarıyla itibar kaybetmiş olabilir. Takip yapacaksanız mutlaka kendi alt domaininizi (ör. track.orneksirket.co) CNAME kaydıyla tanımlayın.

Daha iyisi şu: Soğuk e-postalarda açılma takibini tamamen kapatmayı düşünün. Açılma takibi için e-postaya eklenen görünmez piksel, teslim edilebilirliği olumsuz etkileyebilir. Üstelik Apple'ın gizlilik özellikleri nedeniyle açılma verisi zaten güvenilirliğini büyük ölçüde yitirdi. Asıl ölçmeniz gereken metrik yanıttır.

### Kontrol listesi

Kurulumu tamamladığınızda şunları doğrulayın:

1. MX kayıtları doğru, posta kutusu e-posta alabiliyor.
2. SPF kaydı tek ve geçerli.
3. DKIM aktif, test e-postasında "PASS" görünüyor.
4. DMARC kaydı yayında.
5. Web adresi ana siteye 301 ile yönleniyor.
6. Takip kullanılıyorsa özel takip domaini tanımlı.

Gmail'de kendinize bir test e-postası gönderip "Orijinali göster" seçeneğine tıkladığınızda SPF, DKIM ve DMARC satırlarının hepsinde "PASS" görmelisiniz.

## Adım 3: Posta kutularını gerçek bir insan gibi hazırlamak

DNS hazır olduktan sonra posta kutularını oluşturun. Burada amaç, her posta kutusunun gerçek bir çalışana ait olduğu izlenimini vermektir.

- **Gerçek isim kullanın:** "satis@" ya da "info@" yerine "berkay@" veya "ayse.kaya@" gibi kişisel adresler tercih edin. Soğuk e-posta kişiden kişiye bir iletişimdir.
- **Profil fotoğrafı ekleyin:** Gmail'de gönderici fotoğrafı güven duygusunu artırır.
- **İmza oluşturun:** İsim, unvan, şirket adı ve ana web sitesi yeterlidir. İmzaya çok sayıda link, büyük logolar ve sosyal medya ikonları eklemekten kaçının.
- **Yönlendirme ayarlayın:** Yanıtların gözden kaçmaması için ikincil posta kutularını ana CRM'inize veya satış temsilcisinin ana gelen kutusuna bağlayın.

Bu aşamada ilk birkaç gün posta kutusunu gerçekten kullanmak da işe yarar: Birkaç tanıdığa, iş arkadaşınıza e-posta atın, onların yanıt vermesini isteyin. Bu doğal trafik, otomatik ısındırma başlamadan önce iyi bir temel oluşturur.

## Adım 4: Isındırma takvimini uygulamak

Isındırmanın kalbi, hacmi yavaş ve tutarlı biçimde artırmaktır. Aşağıdaki takvim, posta kutusu başına uyguladığım ve ekiplerle sık kullandığım bir çerçevedir. Rakamlar kesin kurallar değil, makul bir başlangıç noktasıdır.

### Örnek 5 haftalık ısındırma planı (posta kutusu başına)

- **1. hafta:** Günde 5-10 ısındırma e-postası. Soğuk e-posta yok.
- **2. hafta:** Günde 10-20 ısındırma e-postası. Soğuk e-posta yok.
- **3. hafta:** Günde 20-25 ısındırma e-postası. İsterseniz haftanın sonunda günde 5 soğuk e-postayla, en sıcak segmentinizden başlayın.
- **4. hafta:** Toplam günde 30-35 e-posta. Bunun yaklaşık yarısı soğuk e-posta olabilir.
- **5. hafta ve sonrası:** Toplam günde 30-50 e-posta. Isındırma trafiğini kapatmayın, günde 10-15 e-posta düzeyinde arka planda devam etsin.

### Takvimi uygularken dikkat edilecekler

- **Hacmi her gün artırmayın, kademeli artırın.** 5'ten 50'ye üç günde çıkmak, hiç ısındırmamakla neredeyse aynı etkiyi yaratır.
- **Hafta sonlarını göz önünde bulundurun.** B2B soğuk e-postaları hafta içi gönderin. Isındırma trafiği hafta sonu düşük seviyede devam edebilir.
- **Gönderimleri gün içine yayın.** 30 e-postayı aynı dakikada göndermek yerine, aralarına birkaç dakikalık rastgele boşluklar koyun. Sekans araçlarının çoğu bunu otomatik yapar.
- **Bir şeyler ters giderse geri adım atın.** Spam oranında ya da geri dönen e-postalarda artış görürseniz hacmi bir önceki haftanın seviyesine çekin.

## Otomatik ısındırma araçları işe yarar mı?

Piyasada pek çok otomatik ısındırma aracı var ve sekans platformlarının çoğu bu özelliği kendi içinde sunuyor. Çalışma mantıkları benzerdir: Posta kutunuz, ağdaki diğer kullanıcıların posta kutularıyla otomatik olarak e-postalaşır. Gelen e-postalar açılır, spam klasöründeyse "spam değil" olarak işaretlenir, bir kısmına yanıt verilir.

**Kısa cevap: Evet, işe yararlar ama tek başlarına yeterli değillerdir.**

Avantajları:

- Elle yapılması imkânsız bir hacimde olumlu etkileşim sinyali üretirler.
- Spam klasöründen kurtarma işlemi, sağlayıcılara güçlü bir olumlu sinyal gönderir.
- Teslim edilebilirlik puanı gibi göstergelerle size erken uyarı verirler.

Sınırları:

- Ağdaki etkileşimlerin yapay olduğunu sağlayıcılar zamanla daha iyi tespit ediyor.
- Isındırma aracının gösterdiği yüksek "gelen kutusu oranı", gerçek alıcılarınızdaki durumu birebir yansıtmaz.
- Kötü bir liste veya kötü bir metin, en iyi ısındırmayı bile boşa çıkarır.

Benim önerim şu: Otomatik ısındırmayı bir temel olarak kullanın, ama asıl itibarı gerçek alıcılardan gelen gerçek yanıtlar inşa eder. Bu yüzden soğuk gönderime geçtiğinizde ilk e-postaları en ilgili, en iyi eşleşen segmentinize gönderin.

## Isındırma ne kadar sürer?

Yeni bir domain için **en az 3 hafta, ideal olarak 4-6 hafta** öngörün. Bu süre şu faktörlere göre değişir:

- **Domainin yaşı:** Yeni satın alınmış bir domain, birkaç aydır var olan bir domaine göre daha temkinli ısındırılmalıdır. Bu yüzden birçok ekip, ihtiyaç duymadan birkaç hafta önce domainleri satın alıp bekletir.
- **Hedef hacim:** Posta kutusu başına günde 20 e-posta hedefliyorsanız, 50 hedefleyen birine göre daha kısa sürede hazır olursunuz.
- **Alıcı profili:** Kurumsal şirketlerin güvenlik filtreleri genellikle daha katıdır. Hedef kitleniz ağırlıklı olarak büyük kurumlarsa sabırlı olun.

Pratik bir planlama ipucu: Yeni bir outbound kampanyası ya da yeni bir SDR'ın işe başlangıcı takviminizdeyse, domain ve posta kutusu kurulumunu **en az bir ay önceden** başlatın. Yeni temsilcinin ilk haftasını altyapının hazır olmasını bekleyerek geçirmesi hem moral hem verim kaybıdır. Bu konuyu [yeni satış temsilcisi için ilk 90 gün onboarding planı](/blog/yeni-satis-temsilcisi-icin-ilk-90-gun-onboarding-plani) yazısında da ayrıca ele almıştım.

## Adım 5: Soğuk gönderime geçerken liste kalitesini korumak

Isındırma bittiğinde itibarınızı en çok etkileyecek şey göndereceğiniz listedir. Teslim edilebilirliği bozan en büyük üç etken şunlardır: **geçersiz adresler (bounce), spam şikâyetleri ve ilgisiz alıcılar.**

### Geri dönen e-postaları minimumda tutun

Geri dönen e-posta oranınızı **yüzde 2'nin altında**, ideal olarak yüzde 1'in altında tutmayı hedefleyin. Bunun için:

- Her listeyi göndermeden önce bir e-posta doğrulama aracından geçirin.
- "Catch-all" (her adresi kabul eden) domainlere dikkatli olun. Bu adreslerin geçerliliği kesin olarak doğrulanamaz, küçük partilerle test edin.
- Birkaç aydan eski listeleri yeniden doğrulamadan kullanmayın. İnsanlar iş değiştirir, adresler kapanır.

Doğrulanmış iletişim verisiyle liste oluşturmak için [Apollo.io](https://get.apollo.io/679irkzm35ya) gibi veri platformları iyi bir başlangıç noktasıdır. Yine de hangi kaynağı kullanırsanız kullanın, göndermeden önce ikinci bir doğrulamadan geçirmek iyi bir alışkanlıktır. Listeyi nasıl kuracağınızı [B2B potansiyel müşteri listesi nasıl oluşturulur](/blog/b2b-potansiyel-musteri-listesi-nasil-olusturulur) yazısında detaylıca anlattım.

### Spam şikâyetlerini düşük tutun

Google, toplu göndericiler için spam şikâyet oranının **yüzde 0,3'ün altında** tutulmasını şart koşuyor ve ideal olarak yüzde 0,1'in altında kalınmasını öneriyor. Soğuk e-postada bu eşiğin altında kalmak için:

- Mesajınız gerçekten alıcının işine ve rolüne dair olmalı.
- Alıcıya kolay bir çıkış yolu sunun. "Bu konu sizin için uygun değilse haber verin, bir daha yazmayayım" gibi basit bir cümle bile şikâyet yerine yanıt almanızı sağlar.
- Takip e-postalarının sayısını abartmayın. 3-4 adımlık bir sekans çoğu durumda yeterlidir.

Çıkış seçeneği ve veri işleme konusu yalnızca teslim edilebilirlik açısından değil, yasal açıdan da önemlidir. Türkiye'deki çerçeveyi [soğuk e-posta ve KVKK](/blog/soguk-eposta-kvkk-outbound-ekipler) yazısında ele almıştım. Kampanyayı başlatmadan önce mutlaka göz atın.

### İçerik de teslim edilebilirliği etkiler

- İlk e-postada link vermekten kaçının ya da en fazla bir link kullanın.
- Görsel, ek dosya ve HTML şablonları kullanmayın. Düz metin, kişiden kişiye bir e-posta gibi görünür.
- Aynı metni yüzlerce kişiye birebir göndermek yerine kişiselleştirme ve metin varyasyonları kullanın.
- "Ücretsiz", "garanti", "son fırsat" gibi pazarlama dilinden uzak durun.

Metin tarafında yanıt almayı artıracak taktikler için [soğuk e-postada yanıt oranı nasıl artırılır](/blog/soguk-eposta-yanit-orani-nasil-artirilir) yazısına bakabilirsiniz. Isındırma kapıyı açar, ama içeri girmenizi sağlayan şey mesajın kendisidir.

## Domain itibarını nasıl takip edersiniz?

Kampanya başladıktan sonra itibarı düzenli izlemek, sorunları büyümeden yakalamanızı sağlar. Haftalık olarak şu kontrolleri yapın:

- **Google Postmaster Tools:** Domaininizi buraya ekleyin. Belirli bir hacmin üzerine çıktığınızda domain itibarı ve spam oranı verilerini gösterir. Düşük hacimde veri görünmeyebilir, bu normaldir.
- **Kara liste kontrolü:** Ücretsiz kara liste tarama araçlarıyla domaininizin ve gönderim IP'nizin büyük listelerde olup olmadığına bakın.
- **Yerleşim testleri (placement test):** Farklı sağlayıcılardaki test adreslerine e-posta göndererek mesajlarınızın gelen kutusuna mı, promosyonlara mı, spam'e mi düştüğünü kontrol edin.
- **Yanıt oranı trendi:** En pratik göstergedir. Aynı segment ve aynı metinle yanıt oranınız birden düşüyorsa, ilk şüphelenmeniz gereken yer teslim edilebilirliktir.

### Bir domain "yandığında" ne yapmalı?

Yanıtlar aniden kesildiyse, testlerde e-postalar spam'e düşüyorsa ya da domain bir kara listeye girdiyse:

1. O domainden soğuk gönderimi hemen durdurun.
2. Isındırma trafiğini düşük seviyede sürdürün.
3. Sorunun kaynağını bulun: liste kalitesi mi, metin mi, hacim mi?
4. İki-üç hafta sonra küçük hacimle tekrar test edin.
5. İtibar toparlanmıyorsa domaini emekliye ayırın ve yedek domaine geçin.

Bu yüzden her zaman ısındırılmış **en az bir yedek domain** bulundurmanızı öneririm. Domain yandığında sıfırdan başlayıp bir ay beklemek, pipeline'ınızda ciddi bir boşluk yaratır.

## Maliyeti ne kadar?

İyi haber şu: Domain ısındırma altyapısı, outbound ekibinin toplam maliyeti içinde küçük bir kalemdir. Ana kalemler şunlardır:

- **Domainler:** Uzantıya göre değişmekle birlikte, yaygın uzantılarda domain başına yıllık maliyet genellikle düşüktür.
- **Posta kutuları:** Google Workspace veya Microsoft 365 gibi servislerde kullanıcı başına aylık bir ücret ödersiniz. 10 posta kutusu, her biri için ayrı lisans demektir.
- **Isındırma ve sekans aracı:** Çoğu araç posta kutusu başına ya da kullanıcı başına aylık ücretlendirilir. Bazı sekans araçları ısındırmayı pakete dahil eder.
- **E-posta doğrulama:** Genellikle doğrulanan adres sayısına göre kredi bazlı fiyatlandırılır.

Örnek bir kurgu üzerinden düşünelim: 4 domain ve 10 posta kutusuyla günde yaklaşık 300 soğuk e-posta gönderen bir ekip, aylık altyapı maliyetinin büyük kısmını posta kutusu lisanslarına ve sekans aracına öder. Bu tutar bir SDR'ın aylık maliyetinin yanında oldukça küçük kalır. Asıl pahalı olan, altyapı hatası yüzünden bir SDR'ın haftalarca spam'e e-posta göndermesidir. Ekip maliyetini bütünüyle görmek isterseniz [outbound satış ekibinin gerçek maliyeti](/blog/outbound-satis-ekibinin-gercek-maliyeti-nasil-hesaplanir) yazısındaki hesaplama çerçevesini kullanabilirsiniz.

Altyapıyı içeride kurmak yerine bu işi bir partnere devretmek isteyen SaaS şirketleri için grubumuzdaki [SAAS Corner, B2B SaaS'a özel outbound satış ve lead generation hizmeti](https://saascorner.co) sunuyor. Farklı sektörlerde veri odaklı bir yaklaşım arayanlar ise [Sales Corner'ın B2B satış ve lead generation çözümlerine](https://salescorner.co) bakabilir.

## Sık yapılan hatalar

Ekiplerle çalışırken en sık karşılaştığım hatalar şunlar:

- **Ana domainden soğuk kampanya yürütmek.** Kısa vadede pratik görünür, uzun vadede şirketin tüm e-posta trafiğini riske atar.
- **Isındırmayı kampanya başladığında kapatmak.** Arka planda düşük hacimli ısındırma trafiği itibarı korumaya devam eder.
- **DKIM kaydını ekleyip aktif etmeyi unutmak.** Kayıt DNS'te durur ama imza hiç atılmaz.
- **Bir posta kutusundan günde 100+ soğuk e-posta göndermek.** Hacmi artırmanın yolu, posta kutusu başına hacmi şişirmek değil, daha fazla posta kutusu ve domain kullanmaktır.
- **Doğrulanmamış, eski listeler kullanmak.** Yüksek bounce oranı, itibarı en hızlı bozan etkendir.
- **Sadece açılma oranına bakmak.** Açılma verisi yanıltıcıdır. Yanıt oranı ve olumlu yanıt oranı asıl göstergelerdir.

Altyapı sorunları, outbound'un "çalışmıyor" diye terk edilmesinin en görünmez nedenlerinden biridir. Diğer yaygın sebepleri [outbound satış neden çalışmıyor](/blog/outbound-satis-neden-calismiyor) yazısında topladım.

## Sık sorulan sorular

### Domain ısındırmadan doğrudan soğuk e-posta gönderebilir miyim?

Teknik olarak gönderebilirsiniz, ama e-postalarınızın büyük kısmının spam klasörüne düşme ihtimali çok yüksektir. Isındırılmamış bir domainden yüksek hacimli gönderim, domainin kısa sürede kalıcı olarak itibar kaybetmesine yol açabilir. Birkaç haftalık bekleme, aylarca sürecek bir itibar sorunundan çok daha ucuzdur.

### Bir posta kutusundan günde kaç soğuk e-posta gönderilmeli?

Isındırma tamamlandıktan sonra posta kutusu başına toplamda günde 30-50 e-posta, bunun içinde soğuk e-posta olarak 20-40 adet makul bir aralıktır. Daha yüksek hacim gerekiyorsa sınırı zorlamak yerine yeni posta kutuları ve domainler ekleyin. Bu yaklaşım riski dağıtır ve bir domain sorun yaşadığında operasyonun durmasını engeller.

### Isındırma tamamlandığında ısındırma aracını kapatmalı mıyım?

Hayır, kapatmamanızı öneririm. Soğuk kampanya devam ederken ısındırma trafiğini günde 10-15 e-posta gibi düşük bir seviyede sürdürmek, olumlu etkileşim sinyallerinin akmaya devam etmesini sağlar. Bu, özellikle yanıt oranının düşük olduğu dönemlerde itibarınızı dengeler.

### Eski bir domaini yeniden kullanırken de ısındırma gerekir mi?

Evet. Domain uzun süre e-posta göndermediyse ya da daha önce farklı amaçla kullanıldıysa, sağlayıcılar onu yeniden değerlendirir. Kara liste kontrolü yapın, DNS kayıtlarını gözden geçirin ve yeni bir domain gibi kademeli ısındırma uygulayın. Süreç yeni bir domaine göre biraz daha kısa sürebilir, ama adımları atlamayın.

## Sonuç

Domain ısındırma, soğuk e-postanın görünmeyen ama belirleyici katmanıdır. Doğru ikincil domainleri seçmek, SPF, DKIM ve DMARC'ı eksiksiz kurmak ve hacmi 4-6 hafta boyunca sabırla artırmak, mesajlarınızın gerçekten okunabilmesinin ön koşuludur. Isındırma bittikten sonra ise itibarınızı doğrulanmış listeler, alakalı mesajlar ve kontrollü hacimle korursunuz.

Unutmayın: En iyi yazılmış e-posta bile spam klasöründe kimseye ulaşmaz. Altyapıyı bir kez doğru kurduğunuzda, ekibiniz enerjisini asıl işe, yani doğru kişilere doğru mesajı ulaştırmaya harcayabilir.

Outbound altyapınızı kurarken ya da mevcut kampanyalarınızda teslim edilebilirlik sorunları yaşıyorsanız, deneyimlerimi paylaşmaktan memnuniyet duyarım. Benimle iletişime geçmek ve çalışmalarım hakkında daha fazla bilgi almak için [Berkay Yalçın](/tr) sayfasını ziyaret edebilirsiniz.
