---
title: "Outbound E-postalar Spam'e Düşmesin: SPF, DKIM, DMARC"
description: "Outbound e-postalarınızın spam klasörüne düşmemesi için SPF, DKIM ve DMARC kurulumunu ve alan adı ısındırma süreçlerini adım adım anlatıyoruz."
date: "2026-10-13"
category: "Lead Generation"
image: "https://images.pexels.com/photos/7653571/pexels-photo-7653571.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Outbound E-postalar Spam'e Düşmesin: SPF, DKIM, DMARC"
alt: "outbound-email-spf-dkim-dmarc"
---

Outbound kampanyanız için haftalarca hedef kitle çıkardınız, mesajları kişiselleştirdiniz, sekansları kurdunuz. Gönderim başladı ama yanıt gelmiyor. Açılma oranları beklenenin çok altında, birkaç alıcı "e-postanız spam klasörüne düşmüş" diye dönüyor. Sorun çoğu zaman mesajda ya da teklifte değildir. Sorun, e-postanın alıcının gelen kutusuna hiç ulaşmamasıdır. Kampanya sonuçlarına bakarken gözden kaçan bu katmanın adı **deliverability**, yani e-postanın teslim edilebilirliğidir. Bu katmanın temelinde de üç teknik standart yatar: **SPF, DKIM ve DMARC**.

Bu yazıda bu üç protokolün ne işe yaradığını, outbound satış yapan bir B2B SaaS şirketi için nasıl kurulması gerektiğini ve kurulumdan sonra hangi hataların itibarınızı sessizce zedelediğini adım adım anlatacağız. Hedefimiz, teknik ekibe "şunu yapın" diyebileceğiniz, satış ekibinin de mantığını anlayabileceği bir yol haritası çıkarmak.

## Kimlik Doğrulama Neden Artık "Olsa İyi Olur" Değil, Zorunlu?

Birkaç yıl öncesine kadar SPF ve DKIM kaydı eksik bir alan adıyla da e-posta gönderebilir, makul bir teslim oranı alabilirdiniz. Bugün durum farklı. Google ve Yahoo, 2024 yılının başında toplu gönderim yapan göndericiler için yeni kurallar devreye aldı. Bu kurallara göre, belirli bir hacmin üzerinde gönderim yapan alan adlarının SPF ve DKIM ile kimlik doğrulaması yapması, bir DMARC politikası yayınlaması, pazarlama e-postalarında tek tıkla abonelikten çıkma imkânı sunması ve spam şikâyet oranını düşük tutması bekleniyor. Microsoft da Outlook tarafında benzer gereksinimleri duyurdu.

Bu kuralların "toplu gönderici" eşiği sizi bugün kapsamasa bile, alıcı sunucular kimliği doğrulanmamış e-postalara giderek daha şüpheci yaklaşıyor. Outbound e-posta, doğası gereği alıcının daha önce etkileşime girmediği bir adresten geliyor. Yani elinizde gönderici itibarı dışında güvenecek bir sinyal yok. Kimlik doğrulama eksikse, alıcı sunucunun gözünde siz "kim olduğu belli olmayan biri"siniz.

Bir de işin güvenlik tarafı var. DMARC yapılandırılmamış bir alan adı, dolandırıcıların sizin adınıza sahte e-posta göndermesine açıktır. Potansiyel bir müşterinin sizin alan adınızdan gelen bir oltalama e-postası alması, satış sürecinde inşa etmeye çalıştığınız güveni tek seferde yok eder. Bu konuyu [B2B SaaS satışta etik ve şeffaf güven inşası](/blog/b2b-saas-satista-guven-i-nsasi-etik-ve-seffaf-stratejiler) yazımızda daha geniş bir perspektiften ele almıştık. Teknik kimlik doğrulama, bu güvenin altyapı ayağıdır.

## Bir E-posta Gelen Kutusuna Ulaşmadan Önce Ne Olur?

Üç protokolü anlamanın en kolay yolu, alıcı sunucunun bakış açısından düşünmektir. Sizin satış temsilciniz bir potansiyel müşteriye e-posta gönderdiğinde, alıcının e-posta sunucusu (örneğin Gmail veya Microsoft 365) kabaca şu soruları sorar:

1. **Bu e-postayı gönderen sunucu, bu alan adı adına gönderim yapmaya yetkili mi?** (SPF)
2. **E-posta yolda değiştirilmiş mi ve gerçekten bu alan adının sahibi tarafından imzalanmış mı?** (DKIM)
3. **Bu kontroller başarısız olursa alan adı sahibi ne yapılmasını istiyor ve kontroller görünen gönderici adresiyle uyumlu mu?** (DMARC)

Bu sorulardan sonra devreye itibar, içerik, etkileşim geçmişi gibi başka sinyaller girer. Ancak ilk üç soruya tatmin edici bir yanıt veremiyorsanız, diğer sinyallerin ne kadar iyi olduğu çok az önem taşır.

## SPF: "Benim Adıma Kim E-posta Gönderebilir?"

**SPF (Sender Policy Framework)**, alan adınızın DNS kayıtlarına eklediğiniz bir TXT kaydıdır. Bu kayıt, alan adınız adına e-posta göndermeye yetkili sunucuların listesini içerir. Alıcı sunucu, gelen e-postanın hangi IP adresinden geldiğine bakar ve bu IP'nin SPF kaydınızda yetkilendirilip yetkilendirilmediğini kontrol eder.

### Örnek Bir SPF Kaydı

Google Workspace kullanan bir şirket için temel SPF kaydı şöyle görünür:

```
v=spf1 include:_spf.google.com ~all
```

Microsoft 365 kullanıyorsanız:

```
v=spf1 include:spf.protection.outlook.com ~all
```

Kayıttaki parçaların anlamı:

- **v=spf1**: Kaydın bir SPF kaydı olduğunu belirtir.
- **include:**: Belirtilen servisin yetkili sunucularını listeye dahil eder.
- **~all**: Listede olmayan sunuculardan gelen e-postaların "şüpheli" (softfail) olarak değerlendirilmesini ister. **-all** ise kesin reddetme (hardfail) anlamına gelir.

Eğer CRM'iniz, pazarlama otomasyon aracınız veya bir sekans aracı sizin alan adınız üzerinden e-posta gönderiyorsa, onların include ifadesini de eklemeniz gerekir:

```
v=spf1 include:_spf.google.com include:servisadi.com ~all
```

### SPF'te En Sık Yapılan Hatalar

**Birden fazla SPF kaydı oluşturmak.** Bir alan adında yalnızca tek bir SPF kaydı olabilir. Yeni bir araç eklerken ayrı bir "v=spf1" kaydı açmak, iki kaydın da geçersiz sayılmasına yol açar. Doğru yöntem, mevcut kaydın içine yeni include ifadesini eklemektir.

**10 DNS sorgusu sınırını aşmak.** SPF standardı, kayıt değerlendirilirken en fazla 10 DNS sorgusu yapılmasına izin verir. Her include ifadesi, kendi içinde başka sorgular tetikleyebilir. Yıllar içinde biriken araçlar (eski bir bülten servisi, artık kullanılmayan bir destek yazılımı) bu sınırı kolayca aşar ve SPF "permerror" verir. Düzenli olarak kaydınızı temizleyin, kullanılmayan servisleri çıkarın.

**+all kullanmak.** Bu ifade "herkes benim adıma gönderebilir" demektir ve SPF'in varlık amacını ortadan kaldırır. Asla kullanmayın.

### SPF'in Sınırı

SPF tek başına yeterli değildir. Çünkü SPF, e-postanın görünen "Kimden" (From) adresini değil, teknik zarf adresini (Return-Path) kontrol eder. Yani biri farklı bir Return-Path kullanıp görünen adrese sizin alan adınızı yazabilir. Bu boşluğu DKIM ve özellikle DMARC kapatır.

## DKIM: E-postaya Dijital İmza Atmak

**DKIM (DomainKeys Identified Mail)**, gönderdiğiniz her e-postaya kriptografik bir imza ekler. Bu imza, özel bir anahtarla oluşturulur ve e-postanın başlık bilgilerine yerleştirilir. Alıcı sunucu, DNS'inizde yayınladığınız açık anahtarı kullanarak imzayı doğrular. İmza geçerliyse iki şey kanıtlanmış olur: E-posta gerçekten bu alan adının kontrolündeki bir sistemden gönderilmiştir ve yolda içeriği değiştirilmemiştir.

### DKIM Nasıl Kurulur?

Süreç genellikle şu adımlardan oluşur:

1. E-posta sağlayıcınızın yönetici panelinden DKIM anahtarı oluşturursunuz. Google Workspace'te bu, Yönetici Konsolu'ndaki Gmail kimlik doğrulama ayarlarında yer alır.
2. Sistem size bir **selector** (seçici) adı ve bir açık anahtar değeri verir.
3. Bu değeri DNS'inize TXT (bazı sağlayıcılarda CNAME) kaydı olarak eklersiniz. Örneğin Google için kayıt adı genellikle `google._domainkey.alanadiniz.com` şeklindedir.
4. DNS yayılımı tamamlandıktan sonra panelden "Kimlik doğrulamayı başlat" seçeneğini etkinleştirirsiniz.

Microsoft 365'te ise genellikle `selector1._domainkey` ve `selector2._domainkey` adlı iki CNAME kaydı oluşturulur ve Defender portalından DKIM imzalama açılır.

### DKIM İçin Pratik Öneriler

- **2048 bit anahtar kullanın.** 1024 bit anahtarlar hâlâ kabul edilse de daha güçlü anahtar tercih edilmelidir. Bazı DNS sağlayıcıları uzun TXT kayıtlarını bölerek girmenizi isteyebilir; bu normaldir.
- **Her gönderim aracı için ayrı DKIM imzası yapılandırın.** Sekans aracınız veya CRM'iniz sizin alan adınız adına e-posta gönderiyorsa, o aracın da kendi selector'ı ile sizin alan adınızı imzalaması gerekir. Aksi halde araç, kendi alan adıyla imzalar ve DMARC uyumu bozulur.
- **Anahtarları periyodik olarak yenileyin.** Yılda bir veya iki kez anahtar rotasyonu iyi bir güvenlik pratiğidir.

## DMARC: Kuralları Koyan ve Raporlayan Katman

**DMARC (Domain-based Message Authentication, Reporting and Conformance)**, SPF ve DKIM'i bir araya getiren ve onlara anlam kazandıran politikadır. DMARC üç şey yapar:

1. **Uyum (alignment) kontrolü:** SPF veya DKIM'de doğrulanan alan adının, e-postanın görünen "Kimden" adresindeki alan adıyla eşleşip eşleşmediğine bakar. Alıcının gördüğü adresin gerçekten doğrulanmış olmasını sağlayan şey budur.
2. **Politika:** Kontroller başarısız olursa alıcı sunucunun ne yapmasını istediğinizi söyler.
3. **Raporlama:** Alan adınız adına gönderilen e-postalarla ilgili toplu raporların size iletilmesini sağlar.

### Örnek DMARC Kaydı

DMARC kaydı `_dmarc.alanadiniz.com` adresinde TXT kaydı olarak yayınlanır:

```
v=DMARC1; p=none; rua=mailto:dmarc-rapor@alanadiniz.com; adkim=r; aspf=r
```

- **p=none**: Sadece izle, hiçbir e-postaya müdahale etme.
- **p=quarantine**: Başarısız e-postaları spam klasörüne gönder.
- **p=reject**: Başarısız e-postaları tamamen reddet.
- **rua**: Toplu raporların gönderileceği adres.
- **adkim / aspf**: DKIM ve SPF uyum modu. "r" (relaxed) alt alan adlarının ana alan adıyla eşleşmesine izin verir, "s" (strict) birebir eşleşme ister.
- **pct**: Politikanın e-postaların yüzde kaçına uygulanacağını belirtir; kademeli geçişte işe yarar.

### DMARC'ı Kademeli Sıkılaştırmak

DMARC'ı doğrudan p=reject ile başlatmak, meşru e-postalarınızın da reddedilmesine neden olabilir. Çünkü çoğu şirket, alan adı adına e-posta gönderen tüm sistemleri bilmez: muhasebe yazılımı fatura gönderir, İK aracı bildirim gönderir, eski bir web formu otomatik yanıt verir. Doğru yaklaşım şudur:

1. **İlk 2-4 hafta: p=none.** Raporları toplayın, alan adınız adına hangi kaynakların e-posta gönderdiğini görün.
2. **Bilinmeyen ama meşru kaynakları düzeltin.** Her biri için SPF include ve DKIM imzası ekleyin.
3. **p=quarantine; pct=25** ile başlayıp yüzdeyi kademeli olarak artırın.
4. **Raporlar temiz olduğunda p=reject'e geçin.**

DMARC raporları XML formatında gelir ve ham haliyle okunması zordur. Bu raporları anlaşılır grafiklere çeviren çok sayıda ücretsiz ve ücretli DMARC analiz aracı mevcuttur. Satış operasyonundan sorumlu kişinin bu raporlara ayda en az bir kez göz atması, sorunları erken yakalamak için yeterlidir.

## Outbound İçin Alan Adı Mimarisi: Ana Domain'i Koruyun

SPF, DKIM ve DMARC'ı doğru kurmak, ana alan adınızın itibarını riske atmanız gerektiği anlamına gelmez. Outbound e-posta, en dikkatli yapıldığında bile, alıcıların bir kısmının "spam" butonuna basabileceği bir kanaldır. Bu şikâyetler doğrudan gönderici alan adının itibarına yazılır. Eğer outbound'u ana alan adınızdan yaparsanız, müşterilerinize gönderdiğiniz faturalar, destek yanıtları ve ürün bildirimleri de aynı itibar havuzundan etkilenir.

Bu nedenle B2B SaaS şirketlerinde yaygın ve sağlıklı yaklaşım, outbound için **ikincil alan adları** kullanmaktır. Örneğin ana alan adınız `ornekyazilim.com` ise, outbound için şu tür alan adları tercih edilebilir:

- `ornekyazilim.co`
- `ornekyazilimhq.com`
- `tryornekyazilim.com`

Bu yapıyı kurarken dikkat edilecek noktalar:

- **Her ikincil alan adı için SPF, DKIM ve DMARC'ı ayrı ayrı kurun.** Ana domain'deki ayarlar ikincil domainlere otomatik olarak geçmez.
- **İkincil alan adını ana web sitenize yönlendirin.** Alıcı merak edip alan adını tarayıcıya yazdığında, boş bir sayfa yerine gerçek web sitenizi görmelidir.
- **Her alan adında sınırlı sayıda posta kutusu açın.** Bir alan adında iki-üç posta kutusu ile çalışmak, riski dağıtmak açısından yaygın bir pratiktir.
- **Yeni alan adlarını hemen kullanmayın.** Satın alınan alan adının birkaç hafta "olgunlaşması" ve ısınma sürecinden geçmesi gerekir.
- **Özel izleme alan adı (custom tracking domain) kullanın.** Açılma ve tıklama takibi yapıyorsanız, aracın ortak izleme alan adı yerine kendi alt alan adınızı (ör. `link.ornekyazilim.co`) kullanın. Ortak alan adları, başka kullanıcıların kötü davranışlarından etkilenebilir.

## Adım Adım Kurulum Planı: İlk 30 Gün

Teorik bilgiyi uygulanabilir bir plana dönüştürelim. Yeni bir outbound altyapısı kuran bir SaaS şirketi için örnek bir takvim şöyle olabilir:

### 1. Hafta: Altyapı

1. Outbound için 2-3 ikincil alan adı satın alın.
2. Her alan adına Google Workspace veya Microsoft 365 hesabı bağlayın; her alan adında 2-3 posta kutusu açın. Posta kutularına gerçek kişi adları verin (ör. ayse@, mehmet@), "info@" veya "sales@" gibi genel adreslerden kaçının.
3. SPF kaydını oluşturun.
4. DKIM anahtarını üretin, DNS'e ekleyin ve imzalamayı etkinleştirin.
5. DMARC kaydını p=none ile yayınlayın ve rua adresini tanımlayın.
6. Alan adlarını ana web sitenize yönlendirin.

### 2. Hafta: Doğrulama ve Isınma Başlangıcı

1. Her posta kutusundan kendi Gmail ve Outlook test hesaplarınıza e-posta gönderin. Gmail'de e-postayı açıp "Orijinali göster" seçeneğine tıkladığınızda SPF, DKIM ve DMARC satırlarında **PASS** görmelisiniz.
2. DNS kayıtlarınızı komut satırından da kontrol edebilirsiniz: `dig TXT alanadiniz.com` ve `dig TXT _dmarc.alanadiniz.com` komutları kayıtların doğru yayınlanıp yayınlanmadığını gösterir.
3. Google Postmaster Tools'a alan adlarınızı ekleyin. Bu araç, Gmail'e gönderdiğiniz e-postaların itibar ve spam oranı verisini gösterir.
4. Isınma (warm-up) sürecini başlatın. Her posta kutusundan günde birkaç e-postayla başlayıp hacmi haftalar içinde yavaşça artırın. Isınma araçları bu süreci otomatikleştirebilir, ancak gerçek kişilerle gerçek yazışmalar da en az bunun kadar değerlidir.

### 3-4. Hafta: Kontrollü Gönderim

1. Gerçek kampanyaya düşük hacimle başlayın. Posta kutusu başına günlük gönderimi düşük tutmak, outbound ekipleri arasında yaygın kabul gören bir güvenlik marjıdır; hacmi artırmak gerekiyorsa daha fazla posta kutusuna yayın.
2. Geri dönen (bounce) e-postaları günlük takip edin.
3. DMARC raporlarını inceleyin; beklenmeyen bir gönderici kaynak varsa araştırın.
4. Sorun yoksa DMARC politikasını quarantine'e doğru ilerletmeyi planlayın.

## Kimlik Doğrulama Gerekli Ama Yeterli Değil

SPF, DKIM ve DMARC, "bu e-posta gerçekten bizden" demenin yoludur. Ancak alıcı sunucular, e-postanın gerçekten sizden gelip gelmediği kadar, **istenip istenmediğine** de bakar. Kusursuz kimlik doğrulaması olan bir alan adı, kötü bir listeye özensiz mesajlar gönderdiğinde yine spam klasörüne düşer. Teslim edilebilirliği belirleyen diğer faktörler:

### Liste Kalitesi ve Doğrulanmış Adresler

Geçersiz adreslere gönderim yapmak, yüksek bounce oranına yol açar ve alıcı sunuculara "bu gönderici listesini özenle hazırlamıyor" sinyali verir. Gönderimden önce e-posta adreslerini doğrulamak, catch-all adreslere dikkatli yaklaşmak ve hedef kitleyi ideal müşteri profiline göre daraltmak şarttır. B2B iletişim verisi ve doğrulanmış e-posta adresleri için [Apollo.io](https://get.apollo.io/679irkzm35ya) gibi prospecting platformları, filtreleme ve doğrulama özellikleriyle listenin temiz başlamasına yardımcı olur. Yine de hiçbir veri kaynağı yüzde yüz doğru değildir; gönderim öncesi ikinci bir doğrulama katmanı eklemek iyi bir alışkanlıktır.

### İçerik ve Kişiselleştirme

- İlk e-postada link, görsel ve ek kullanımını minimumda tutun. Mümkünse ilk temasta hiç link koymayın.
- Aynı şablonu yüzlerce kişiye birebir gönderin değil; şirkete, role ve bağlama göre gerçek kişiselleştirme yapın. Birebir aynı içeriğin yüksek hacimde gönderilmesi, filtreler için bir örüntü oluşturur.
- Kısa, düz metne yakın e-postalar yazın. Ağır HTML şablonları outbound için uygun değildir.
- Abartılı vaatler, büyük harflerle yazılmış konu satırları ve agresif satış dili hem filtreleri hem de alıcıları rahatsız eder.

### Etkileşim ve Şikâyet Oranı

Alıcı sunucular, e-postalarınızın yanıtlanıp yanıtlanmadığına, silinip silinmediğine ve spam olarak işaretlenip işaretlenmediğine bakar. Yanıt oranı yüksek kampanyalar zamanla itibarı güçlendirir. Bu nedenle e-postanın sonunda, ilgilenmeyen alıcının kolayca "ilgilenmiyorum" diyebileceği bir çıkış yolu sunmak, onun spam butonuna basmasından çok daha iyidir. Spam şikâyet oranınızı Google Postmaster Tools'tan takip edin; bu oranın çok düşük seviyelerde kalması gerekir.

Outbound'un bütün resmini, yani hedefleme, mesajlaşma ve görüşme alma sürecini [B2B şirketler için outbound satış ve nitelikli görüşme alma](/blog/outbound-satış-nedir-b2b-şirketler-i̇çin-nitelikli-görüşme-almanın-yolu) yazımızda detaylı anlattık. Teslim edilebilirlik, o resmin görünmeyen ama her şeyi taşıyan zeminidir.

## Sık Yapılan Hatalar ve Hızlı Kontrol Listesi

Sahada en sık karşılaştığımız deliverability sorunları genellikle karmaşık değil, gözden kaçmış küçük ayrıntılardan kaynaklanıyor:

- **Yeni bir araç eklendi ama SPF güncellenmedi.** Pazarlama ekibi yeni bir bülten aracı aldı, kimse DNS'e dokunmadı. Sonuç: o araçtan giden her e-posta SPF'ten kalıyor.
- **İki ayrı SPF kaydı var.** Biri eski IT firmasından kalma, biri yeni eklenen. İkisi de geçersiz.
- **DKIM anahtarı DNS'e eklendi ama imzalama açılmadı.** Kayıt var, ama e-postalar imzalanmıyor.
- **Sekans aracı kendi alan adıyla imzalıyor.** DKIM "pass" görünse de DMARC uyumu sağlanmıyor.
- **DMARC yıllardır p=none'da bırakıldı ve raporlar hiç okunmadı.** Politika var ama koruma yok.
- **Yeni alan adıyla ilk gün yüksek hacimde gönderim yapıldı.** Isınma atlandı, alan adı birkaç gün içinde itibar kaybetti.
- **Ana alan adı outbound için kullanıldı.** Şikâyetler, müşteri iletişimini de etkilemeye başladı.

Her kampanya öncesinde şu soruları hızlıca kontrol edin:

1. Gönderim yapılan her alan adında tek ve geçerli bir SPF kaydı var mı?
2. DKIM imzalama aktif mi ve imza görünen gönderici alan adıyla uyumlu mu?
3. DMARC kaydı yayınlanmış mı, raporlar düzenli inceleniyor mu?
4. Test e-postalarında SPF, DKIM ve DMARC sonuçları PASS mı?
5. Liste doğrulandı mı, bounce riski düşük mü?
6. Posta kutusu başına günlük hacim makul mü?
7. Özel izleme alan adı kullanılıyor mu?

Bu kontrolleri manuel yapmak yerine operasyonun bir parçası haline getirmek uzun vadede çok daha sürdürülebilirdir. Liste temizliğinden gönderim takibine kadar tekrarlayan adımları nasıl otomatiğe bağlayabileceğinizi [lead generation operasyonunu otomatiğe bağlamak](/blog/b2b’de-uykusuz-gecelerin-çıktısı-lead-generation-operasyonunu-otomatiğe-bağlamak) yazımızda ele aldık.

## Sorumluluk Kimde? Satış ve Teknik Ekip Arasındaki Boşluk

Deliverability sorunlarının kronikleşmesinin en büyük nedeni, konunun sahipsiz kalmasıdır. Satış ekibi "bu teknik bir konu" der, IT ekibi "e-posta çalışıyor, sorun yok" der. Oysa e-posta çalışıyor olabilir, ama gelen kutusuna değil spam klasörüne ulaşıyordur.

Bu boşluğu kapatmak için önerimiz şu:

- **Satış operasyonlarında (Sales Ops veya RevOps) bir deliverability sorumlusu belirleyin.** Bu kişinin DNS'e erişimi olmasa bile, hangi araçların alan adı adına gönderim yaptığını bilmesi ve değişiklik taleplerini IT'ye iletmesi gerekir.
- **Yeni bir gönderim aracı satın alınmadan önce kontrol listesi oluşturun.** "Bu araç bizim adımıza e-posta gönderecek mi? SPF ve DKIM gereksinimleri neler?" sorusu satın alma sürecinin parçası olsun.
- **Teslim edilebilirlik metriklerini satış raporlarına ekleyin.** Bounce oranı, spam şikâyet oranı ve alan adı itibarı; açılma ve yanıt oranlarıyla aynı dashboard'da yer almalı.

Bu altyapıyı içeride kurmak için zaman veya uzmanlık yoksa, uçtan uca veri odaklı outbound süreçleri yöneten [Sales Corner'ın B2B satış ve lead generation hizmetleri](https://salescorner.co) gibi ekiplerle çalışmak, hem kurulum hem de sürekli takip yükünü hafifletebilir.

## Sonuç

Outbound e-postada başarı, iyi bir liste ve iyi bir mesajla başlar; ama e-posta gelen kutusuna ulaşmazsa ikisinin de hiçbir değeri kalmaz. **SPF**, alan adınız adına kimin gönderim yapabileceğini tanımlar. **DKIM**, her e-postaya doğrulanabilir bir imza ekler. **DMARC** ise bu iki kontrolü görünen gönderici adresiyle eşleştirir, politika belirler ve size neler olup bittiğini raporlar. Bu üçlü bugün büyük e-posta sağlayıcılarının beklediği asgari standarttır.

Ancak kimlik doğrulama sadece başlangıçtır. İkincil alan adlarıyla ana domain'inizi korumak, yeni posta kutularını sabırla ısıtmak, listeyi doğrulamak, hacmi kontrollü tutmak ve gerçek kişiselleştirmeyle yanıt almaya odaklanmak, uzun vadeli teslim edilebilirliğin diğer ayaklarıdır. Bunları bir kez kurup unutmak yerine düzenli olarak izlenen bir operasyon haline getirdiğinizde, outbound kampanyalarınızın sonuçları da çok daha öngörülebilir hale gelir.

Outbound altyapınızı sıfırdan kurmak, mevcut kampanyalarınızdaki teslim edilebilirlik sorunlarını teşhis etmek ya da nitelikli görüşme üreten bir lead generation operasyonu oluşturmak istiyorsanız, SAAS Corner ekibi olarak yardımcı olmaktan memnuniyet duyarız. [İletişim sayfamızdan](/iletisim) bize ulaşın, ihtiyaçlarınızı birlikte değerlendirelim.

## Sık sorulan sorular

### SPF, DKIM ve DMARC arasındaki fark nedir?

SPF alan adınız adına kimin gönderim yapabileceğini tanımlar, DKIM her e-postaya doğrulanabilir bir imza ekler, DMARC ise bu iki kontrolü görünen gönderici adresiyle eşleştirip politika belirler ve raporlar. SPF tek başına yeterli değildir, çünkü görünen "Kimden" adresini değil teknik zarf adresini kontrol eder. Bu boşluğu DKIM ve özellikle DMARC kapatır.

### DMARC'a doğrudan p=reject ile başlanmalı mı?

Hayır, DMARC'ı doğrudan p=reject ile başlatmak meşru e-postalarınızın da reddedilmesine neden olabilir. İlk 2-4 hafta p=none ile raporları toplayıp alan adınız adına hangi kaynakların e-posta gönderdiğini görmeniz önerilir. Bilinmeyen ama meşru kaynakları düzelttikten sonra p=quarantine; pct=25 ile başlayıp yüzdeyi kademeli olarak artırabilir, raporlar temiz olduğunda p=reject'e geçebilirsiniz.

### Outbound e-postalar ana alan adından gönderilmeli mi?

Hayır, B2B SaaS şirketlerinde yaygın ve sağlıklı yaklaşım outbound için ikincil alan adları kullanmaktır. Outbound'da gelen spam şikâyetleri doğrudan gönderici alan adının itibarına yazılır ve ana alan adı kullanılırsa faturalar, destek yanıtları ve ürün bildirimleri de aynı itibar havuzundan etkilenir. Ana domain'deki ayarlar ikincil domainlere otomatik olarak geçmediği için her ikincil alan adında SPF, DKIM ve DMARC'ı ayrı ayrı kurmanız gerekir.

### Kurulumun doğru çalıştığı nasıl kontrol edilir?

En pratik yol, her posta kutusundan kendi Gmail ve Outlook test hesaplarınıza e-posta göndermektir. Gmail'de e-postayı açıp "Orijinali göster" seçeneğine tıkladığınızda SPF, DKIM ve DMARC satırlarında PASS görmelisiniz. DNS kayıtlarınızı komut satırından dig komutlarıyla da kontrol edebilir, Google Postmaster Tools ile Gmail'e gönderdiğiniz e-postaların itibar ve spam oranı verisini izleyebilirsiniz.
