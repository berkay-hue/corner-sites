---
title: "HubSpot'ta Satış Pipeline Kurulumu: Adım Adım Rehber"
description: "HubSpot'ta pipeline aşamalarını doğru kurmak satış akışını ölçülebilir kılar; bu rehberde adım adım kurulumu ve sık yapılan hataları ele alıyoruz."
date: "2026-10-10"
category: "Rehber"
image: "https://images.pexels.com/photos/8555605/pexels-photo-8555605.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "HubSpot'ta Satış Pipeline Kurulumu: Adım Adım Rehber"
---

Satış ekiplerinin büyük çoğunluğu potansiyel müşterilerini bir noktada Excel tablolarında, e-posta klasörlerinde ya da satış temsilcisinin hafızasında takip eder. Ekip küçükken bu idare eder. Ancak fırsat sayısı arttığında, yeni temsilciler katıldığında ya da yönetim "Bu çeyrek ne kadar kapatacağız?" diye sorduğunda dağınık yapı ciddi bir soruna dönüşür. HubSpot'un satış pipeline'ı bu dağınıklığı ortadan kaldırır. Her fırsatın nerede durduğunu, hangi adımın beklendiğini ve gelir tahmininin neye dayandığını tek ekranda gösterir.

Yine de pipeline'ı yalnızca birkaç aşama ekleyip bırakmak HubSpot'tan beklenen faydayı sağlamaz. İyi kurgulanmamış bir pipeline, temsilcilerin fırsatları rastgele sürüklediği ve raporların kimseye güven vermediği bir panoya dönüşür. Bu rehberde HubSpot'ta satış pipeline'ını sıfırdan nasıl kuracağınızı adım adım ele alıyoruz. Süreç haritalamadan aşama tanımlarına, zorunlu alanlardan otomasyonlara ve raporlamaya kadar her aşamayı somut örneklerle anlatıyoruz.

## Kuruluma Başlamadan Önce: Satış Sürecinizi Haritalayın

HubSpot'a giriş yapmadan önce yapılması gereken en kritik iş, mevcut satış sürecinizi kâğıda dökmektir. Pipeline, satış sürecinizin dijital bir yansımasıdır. Süreç net değilse pipeline da net olmaz.

Bu aşamada satış yöneticisi ve en az iki deneyimli temsilciyle bir oturum düzenlemenizi öneririz. Oturumda şu sorulara yanıt arayın:

- Bir fırsat hangi noktada "gerçek fırsat" sayılıyor? İlk telefon görüşmesi mi, yoksa ihtiyaç analizi toplantısı mı?
- Müşteri tarafında karar sürecinde kimler yer alıyor? Satın alma, finans, teknik ekip, üst yönetim?
- Teklif gönderilmeden önce hangi bilgilerin mutlaka toplanmış olması gerekiyor?
- Fırsatlar en çok hangi aşamada takılıyor ya da kaybediliyor?
- Ortalama bir satış döngüsü kaç gün ya da hafta sürüyor?

Bu soruların yanıtlarını bir beyaz tahtaya, soldan sağa ilerleyen bir akış olarak çizin. Amaç, temsilcinin yaptığı işleri değil, **müşterinin satın alma yolculuğundaki ilerlemeyi** gösteren kilometre taşlarını belirlemektir. Bu ayrım önemlidir. "Teklif hazırlanıyor" bir iç faaliyettir. "Müşteri teklifi inceliyor" ise müşterinin ilerlediğini gösteren bir aşamadır.

## Adım 1: Pipeline Aşamalarını Tanımlayın

Haritalama tamamlandığında sıra aşamaları netleştirmeye gelir. Genel bir kural olarak, B2B satış süreçlerinin çoğu için kapanış aşamaları hariç **5 ile 7 arasında aşama** yeterlidir. Daha azı süreci fazla kabaca gösterir. Daha fazlası temsilcilerin fırsatları güncellemeyi ihmal etmesine yol açar.

Örnek olarak kurumsal yazılım satan bir B2B şirket için şu yapıyı ele alalım:

1. **Nitelendirme**: İlk görüşme yapıldı, temel ihtiyaç ve bütçe aralığı konuşuldu.
2. **İhtiyaç Analizi**: Detaylı keşif toplantısı yapıldı, karar vericiler belirlendi.
3. **Demo / Çözüm Sunumu**: Ürün demosu ya da çözüm önerisi sunuldu.
4. **Teklif Gönderildi**: Fiyatlandırma ve kapsam içeren resmi teklif iletildi.
5. **Müzakere**: Fiyat, sözleşme şartları veya kapsam üzerinde görüşmeler sürüyor.
6. **Kazanıldı (Closed Won)**: Sözleşme imzalandı.
7. **Kaybedildi (Closed Lost)**: Fırsat kaybedildi ya da müşteri vazgeçti.

Her aşama için yazılı bir **giriş kriteri** belirleyin. Örneğin "Teklif Gönderildi" aşamasına geçiş kriteri "Teklif belgesi müşteriye e-postayla iletildi ve HubSpot'ta fırsata eklendi" şeklinde olabilir. Bu kriterler ekip içinde ortak bir dil oluşturur. Bir temsilcinin "Müzakere" dediği şey ile diğerininki aynı anlama gelmelidir.

### Aşama Tanımlarını Belgeleyin

Aşama tanımlarını kısa bir dokümanda toplayın ve ekiple paylaşın. Her aşama için şu üç bilgiyi yazmanız yeterlidir:

- **Tanım**: Bu aşama müşteri açısından neyi ifade ediyor?
- **Giriş kriteri**: Fırsatın bu aşamaya taşınması için ne gerçekleşmiş olmalı?
- **Beklenen sonraki adım**: Temsilcinin fırsatı ilerletmek için yapması gereken eylem nedir?

Bu doküman hem yeni katılan temsilcilerin eğitiminde hem de pipeline toplantılarında referans olarak kullanılır.

## Adım 2: HubSpot'ta Pipeline'ı Oluşturun

Aşamalar netleştiğinde HubSpot tarafındaki kurulum oldukça hızlıdır.

1. HubSpot hesabınızda sağ üstteki **Ayarlar** (dişli simgesi) menüsüne girin.
2. Sol menüden **Nesneler (Objects) > Fırsatlar (Deals)** bölümüne gidin.
3. **Pipeline'lar** sekmesini açın.
4. Varsayılan olarak gelen "Sales Pipeline" yapısını düzenleyebilir ya da **Pipeline oluştur** seçeneğiyle yeni bir pipeline ekleyebilirsiniz.
5. Aşama adlarını Adım 1'de belirlediğiniz isimlerle değiştirin. Gereksiz varsayılan aşamaları silin, eksik olanları ekleyin.
6. Aşamaların sırasını sürükle-bırak yöntemiyle düzenleyin.

Varsayılan pipeline'ı kullanıyorsanız mevcut aşamaları silmeden önce o aşamalarda fırsat olup olmadığını kontrol edin. HubSpot, içinde fırsat bulunan bir aşamayı silmek istediğinizde bu fırsatları başka bir aşamaya taşımanızı ister. Bu adımı dikkatli yapmazsanız fırsatlar yanlış aşamalara dağılabilir.

Aşama adlarında kısa ve eylem odaklı ifadeler kullanın. "Müşteriyle ikinci görüşme yapıldı ve teknik ekip bilgilendirildi" gibi uzun bir isim pano görünümünde okunmaz. "İhtiyaç Analizi" yeterlidir. Detay, tanım dokümanında yer almalıdır.

## Adım 3: Kazanma Olasılıklarını Belirleyin

HubSpot'ta her aşamaya bir **kazanma olasılığı (deal probability)** atanır. Bu yüzde, fırsatın o aşamadayken kazanılma ihtimalini temsil eder ve ağırlıklı pipeline değeri ile tahmin raporlarının temelini oluşturur.

Örnek pipeline için başlangıç olasılıkları şöyle olabilir:

- Nitelendirme: %10
- İhtiyaç Analizi: %20
- Demo / Çözüm Sunumu: %40
- Teklif Gönderildi: %60
- Müzakere: %80
- Kazanıldı: %100
- Kaybedildi: %0

Bu oranların nasıl kullanıldığını bir örnekle açıklayalım. Diyelim ki "Teklif Gönderildi" aşamasında toplam değeri 1.000.000 TL olan 8 fırsatınız var. Bu aşamanın olasılığı %60 olduğu için HubSpot bu fırsatların ağırlıklı değerini 600.000 TL olarak hesaplar. "Müzakere" aşamasında toplam 500.000 TL değerinde 3 fırsat varsa, %80 olasılıkla ağırlıklı değer 400.000 TL olur. Böylece yönetim, ham pipeline toplamı yerine daha gerçekçi bir gelir beklentisi görür.

İlk kurulumda bu oranlar büyük ölçüde tahmine dayanır. Önemli olan, **3 ila 6 ay sonra gerçek verilerle bu oranları güncellemektir**. HubSpot'taki fırsat dönüşüm raporları, her aşamadan kapanışa ne oranda fırsat geçtiğini gösterir. Örneğin teklif aşamasındaki fırsatlarınızın gerçekte yarıdan azı kazanılıyorsa %60 oranı aşırı iyimserdir ve düşürülmelidir.

## Adım 4: Fırsat Özelliklerini ve Zorunlu Alanları Yapılandırın

Pipeline'ın değeri, içindeki verinin kalitesiyle doğru orantılıdır. Temsilciler fırsat tutarını, kapanış tarihini ya da karar vericiyi girmeden fırsatları ilerletiyorsa, raporlarınız ne kadar şık görünürse görünsün güvenilir olmaz.

### Temel Fırsat Özellikleri

HubSpot'ta her fırsatta varsayılan olarak bulunan bazı özellikler vardır: fırsat adı, tutar, kapanış tarihi, fırsat sahibi ve aşama. Bunlara ek olarak B2B süreçleri için şu özel alanları oluşturmayı değerlendirin:

- **Fırsat kaynağı**: Fırsat nereden geldi? (Web sitesi formu, referans, fuar, dış arama, iş ortağı)
- **Ürün / hizmet kategorisi**: Hangi çözüm satılıyor?
- **Karar verici belirlendi mi?**: Evet / Hayır
- **Bütçe onayı durumu**: Belirsiz / Ayrıldı / Onaylandı
- **Rakip**: Müşterinin değerlendirdiği diğer firmalar
- **Kayıp nedeni**: Fiyat, zamanlama, rakip tercihi, ihtiyaç ortadan kalktı, yanıt alınamadı
- **Kazanma nedeni**: Fiyat, ürün özellikleri, ilişki, hız, referans

Özel özellikleri **Ayarlar > Özellikler (Properties)** bölümünden, nesne olarak "Fırsat" seçerek oluşturabilirsiniz. Mümkün olduğunca serbest metin yerine **açılır liste (dropdown)** tipini kullanın. "Fiyat yüksek", "pahalı bulundu", "bütçe yetmedi" gibi farklı yazımlar raporlamayı imkânsız hale getirir. Tek bir "Fiyat" seçeneği ise net bir analiz sağlar.

### Aşamaya Bağlı Zorunlu Alanlar

HubSpot'un en faydalı özelliklerinden biri, belirli bir aşamaya geçişte bazı alanları **zorunlu** kılabilmenizdir. Pipeline ayarlarında her aşamanın yanındaki düzenleme seçeneğinden, o aşamaya taşınırken doldurulması gereken özellikleri belirleyebilirsiniz.

Örnek bir yapı şöyle olabilir:

- **İhtiyaç Analizi** aşamasına geçişte: Tahmini tutar, tahmini kapanış tarihi, fırsat kaynağı
- **Teklif Gönderildi** aşamasına geçişte: Kesin teklif tutarı, karar verici belirlendi mi
- **Kaybedildi** aşamasına geçişte: Kayıp nedeni ve kısa açıklama
- **Kazanıldı** aşamasına geçişte: Kazanma nedeni, sözleşme başlangıç tarihi

Burada dengeyi iyi kurmak gerekir. Her aşamaya beş-altı zorunlu alan eklemek temsilcileri yorar ve kaçınma davranışını tetikler. Her geçişte **en fazla 2-3 kritik alan** zorunlu tutmak genellikle iyi bir başlangıç noktasıdır.

## Adım 5: Birden Fazla Pipeline Gerekli mi?

Kurulum sırasında sık sorulan sorulardan biri, tek pipeline mı yoksa birden fazla pipeline mı kullanılması gerektiğidir. Genel kural şudur: **Satış süreci gerçekten farklıysa ayrı pipeline, yalnızca ürün ya da bölge farklıysa tek pipeline ve filtre.**

Ayrı pipeline gerektiren tipik durumlar:

- **Yeni müşteri satışı ile mevcut müşteriye ek satış (upsell / cross-sell)**: Mevcut müşteriye satışta nitelendirme ve ihtiyaç analizi aşamaları genellikle çok daha kısadır.
- **Doğrudan satış ile iş ortağı (bayi) üzerinden satış**: İş ortağı kanalında onay ve kayıt aşamaları farklıdır.
- **Proje bazlı satış ile abonelik satışı**: Proje satışında keşif ve teknik değerlendirme süreçleri uzun olabilir.
- **Sözleşme yenilemeleri**: Yenileme süreçleri kendine özgü aşamalara sahiptir (yenileme hatırlatması, kullanım değerlendirmesi, yenileme teklifi gibi).

Buna karşılık iki farklı ürün grubunuz aynı satış adımlarıyla satılıyorsa, ayrı pipeline açmak yerine "Ürün kategorisi" özelliğini kullanıp raporlarda filtreleme yapmak daha sade bir yapı sunar. Gereksiz pipeline'lar hem yönetimi zorlaştırır hem de toplam pipeline görünümünü parçalar.

Ayrıca oluşturabileceğiniz pipeline sayısının HubSpot lisans seviyenize göre değiştiğini unutmayın. Kuruluma başlamadan önce mevcut abonelik planınızın sınırlarını kontrol etmek, ileride yeniden yapılandırma ihtiyacını önler.

## Adım 6: Otomasyonlarla Manuel İşleri Azaltın

Pipeline kurulduktan sonra, temsilcilerin tekrarlayan işlerini otomasyonlarla azaltmak benimsemeyi ciddi ölçüde artırır. HubSpot'ta iki temel otomasyon seviyesi bulunur.

### Pipeline Seviyesinde Basit Otomasyonlar

Pipeline ayarlarındaki **Otomatikleştir (Automate)** sekmesinden, bir fırsat belirli bir aşamaya geldiğinde otomatik görev oluşturma gibi basit aksiyonlar tanımlayabilirsiniz. Örneğin:

- Fırsat "Demo / Çözüm Sunumu" aşamasına geçtiğinde, fırsat sahibine "Demo sonrası takip e-postası gönder" görevi, 2 iş günü sonrası için otomatik oluşturulsun.
- Fırsat "Teklif Gönderildi" aşamasına geçtiğinde, 5 gün sonrası için "Teklif hakkında geri bildirim al" görevi atansın.

### İş Akışları (Workflows) ile Gelişmiş Otomasyonlar

Daha kapsamlı senaryolar için iş akışları kullanılır. Bu özellik belirli lisans seviyelerinde sunulur. Örnek senaryolar:

- **Hareketsiz fırsat uyarısı**: Bir fırsat 21 gündür aynı aşamada duruyorsa ve son aktivite tarihi 14 günden eskiyse, fırsat sahibine ve satış yöneticisine bildirim gönderilsin.
- **Büyük fırsat bildirimi**: Tutarı belirli bir eşiğin, örneğin 500.000 TL'nin üzerinde olan bir fırsat "Müzakere" aşamasına geçtiğinde satış direktörüne dahili e-posta gitsin.
- **Kazanılan fırsat devri**: Fırsat "Kazanıldı" aşamasına geçtiğinde, müşteri başarı ya da operasyon ekibi için bir onboarding görevi oluşturulsun ve ilgili kişi fırsata eklensin.
- **Kayıp fırsat geri dönüşü**: "Zamanlama" nedeniyle kaybedilen fırsatlar için 6 ay sonra fırsat sahibine yeniden iletişim görevi oluşturulsun.

Otomasyonlara başlarken hepsini aynı anda devreye almayın. En çok zaman kaybettiren iki veya üç senaryoyla başlayıp birkaç hafta sonucu gözlemlemek, ardından yenilerini eklemek daha sağlıklıdır.

## Adım 7: Mevcut Fırsatları HubSpot'a Aktarın

Yeni pipeline hazır olduğunda, Excel'de ya da başka bir CRM'de takip edilen açık fırsatları HubSpot'a taşımanız gerekir. Bu adımı aceleye getirmek, kurulumun geri kalanında yapılan özenli çalışmayı boşa çıkarabilir.

İçe aktarma öncesi kontrol listesi:

1. **Yalnızca açık ve güncel fırsatları aktarın.** Örneğin son 6 ayda hiçbir aktivite görmemiş fırsatları aktarmak yerine kapatın ya da ayrı bir arşiv listesinde tutun.
2. **Aşama eşleştirmesi yapın.** Eski sistemdeki "Görüşüldü", "Sıcak", "Teklif aşaması" gibi ifadelerin yeni pipeline'daki hangi aşamaya karşılık geldiğini bir tabloda belirleyin.
3. **Şirket ve kişi kayıtlarını önce aktarın.** Fırsatlar, ilişkilendirildikleri şirket ve kişi kayıtlarıyla anlam kazanır. Önce şirketleri ve kişileri, ardından fırsatları aktarmak ilişkilendirmeyi kolaylaştırır.
4. **Tutar ve tarih formatlarını standartlaştırın.** Para birimi ve tarih biçimi tutarsızlıkları içe aktarmada en sık karşılaşılan hatalardandır.
5. **Fırsat sahiplerini doğru atayın.** Her fırsatın bir sahibi olmalıdır. Sahipsiz fırsatlar pipeline'da kaybolur.

HubSpot'un içe aktarma aracı, sütunları HubSpot özellikleriyle eşleştirmenize olanak tanır. İlk denemeyi 10-20 kayıtlık küçük bir dosyayla yapıp sonucu kontrol ettikten sonra tüm veriyi aktarmak, hataların topluca sisteme girmesini önler.

## Adım 8: Raporlama ve Satış Tahminini Kurgulayın

Pipeline'ın asıl gücü, doğru raporlarla yönetim kararlarına dönüştüğünde ortaya çıkar. Kurulumun son teknik adımı, satış yöneticisi ve üst yönetim için bir **satış paneli (dashboard)** oluşturmaktır.

Başlangıç için önerdiğimiz temel raporlar:

- **Aşamaya göre pipeline değeri**: Her aşamada toplam kaç fırsat ve ne kadar tutar olduğunu gösterir.
- **Ağırlıklı pipeline / tahmin raporu**: Kazanma olasılıklarına göre bu ay ve bu çeyrek beklenen geliri gösterir.
- **Fırsat dönüşüm (funnel) raporu**: Fırsatların bir aşamadan diğerine hangi oranda geçtiğini gösterir ve darboğazları ortaya çıkarır.
- **Aşamada geçirilen ortalama süre**: Fırsatların hangi aşamada en uzun süre beklediğini gösterir.
- **Kayıp nedenleri dağılımı**: Fırsatların neden kaybedildiğini kategorilere göre gösterir.
- **Temsilci bazlı performans**: Kişi başına açık pipeline, kazanılan tutar ve kazanma oranı.

Bir örnekle bu raporların nasıl kullanılabileceğini açıklayalım. Diyelim ki dönüşüm raporunuz, "Demo" aşamasından "Teklif" aşamasına geçen fırsat oranının diğer aşamalara göre belirgin şekilde düşük olduğunu gösteriyor. Bu durum demo içeriğinin müşteri ihtiyaçlarıyla örtüşmediğine ya da demo sonrası takibin zayıf kaldığına işaret edebilir. Aynı dönemde "Teklif" aşamasında geçirilen ortalama süre 30 günü aşıyorsa, teklif sonrası takip sürecinin de gözden geçirilmesi gerekir. Pipeline verisi böylece somut aksiyonlara dönüşür.

HubSpot'un tahmin (forecast) aracı, temsilcilerin kendi fırsatları için "kesin", "olası" gibi tahmin kategorileri girmesine ve yöneticinin ekip genelinde hedefe karşı durumu izlemesine imkân tanır. Bu araç, kazanma olasılıklarına dayalı otomatik hesaplamayı temsilcinin sahadan gelen öngörüsüyle birleştirir.

## Adım 9: Ekibin Benimsemesini Sağlayın

Teknik olarak kusursuz bir pipeline, ekip tarafından kullanılmadığında hiçbir değer üretmez. Kurulum projelerinde en çok gözden kaçan adım budur.

Benimsemeyi artırmak için şu uygulamaları öneririz:

- **Canlıya geçişte kısa bir eğitim düzenleyin.** 60-90 dakikalık bir oturumda aşama tanımlarını, zorunlu alanları ve günlük kullanım akışını gösterin.
- **Haftalık pipeline toplantılarını HubSpot üzerinden yapın.** Yönetici Excel yerine doğrudan HubSpot panosunu açtığında, ekip verinin güncel olması gerektiğini hızla içselleştirir.
- **Fırsat kartını sadeleştirin.** Fırsat kayıt sayfasında temsilcinin en çok ihtiyaç duyduğu alanları üstte gösterin. Kullanılmayan alanları gizleyin.
- **Mobil uygulamayı tanıtın.** Sahada çalışan temsilciler için toplantı sonrası fırsatı telefondan güncelleyebilmek ciddi kolaylık sağlar.
- **İlk ayda yakın takip yapın.** Haftalık olarak eksik alanları, güncellenmemiş kapanış tarihlerini ve hareketsiz fırsatları kontrol edip geri bildirim verin.

## Sık Yapılan Hatalar

Pipeline kurulumlarında sıkça karşılaştığımız hataları bilmek, aynı tuzaklara düşmemenize yardımcı olur:

- **Aşamaları iç faaliyetlere göre kurgulamak.** "Teklif hazırlanıyor", "Yönetici onayında" gibi aşamalar müşterinin ilerlemesini değil, iç süreçleri gösterir. Bu tür adımlar aşama yerine görev olarak takip edilmelidir.
- **Çok fazla aşama oluşturmak.** 10-12 aşamalı pipeline'lar hem pano görünümünü karmaşıklaştırır hem de güncelleme yükünü artırır.
- **Kazanma olasılıklarını hiç güncellememek.** İlk günkü tahmini oranlar yıllarca değişmeden kalırsa tahmin raporları gerçeklikten kopar.
- **Kapanış tarihini önemsememek.** Kapanış tarihi geçmiş ama hâlâ açık duran fırsatlar, tahminleri şişirir. Bu fırsatları düzenli olarak gözden geçirmek gerekir.
- **Kayıp nedenlerini serbest metinle toplamak.** Standart bir liste olmadan kayıp analizini anlamlı şekilde yapamazsınız.
- **Her şeyi ilk günde otomatikleştirmeye çalışmak.** Süreç oturmadan kurulan karmaşık otomasyonlar, hatalı bildirimlere ve ekipte güven kaybına yol açar.
- **Pipeline'ı kurup bırakmak.** Satış süreci zamanla değişir. Pipeline yapısını en az altı ayda bir gözden geçirmek sağlıklı bir alışkanlıktır.

## Sonuç

HubSpot'ta satış pipeline'ı kurmak teknik olarak birkaç saatlik bir iştir. Ancak gerçekten işe yarayan bir pipeline, bu teknik adımdan önce yapılan süreç analizine ve sonrasında gösterilen disipline bağlıdır. Satış sürecinizi müşterinin bakış açısıyla haritalamak, her aşamayı net kriterlerle tanımlamak, kritik verileri zorunlu alanlarla güvence altına almak ve otomasyonlarla tekrarlayan işleri azaltmak, pipeline'ınızı bir veri giriş ekranından gerçek bir yönetim aracına dönüştürür. Doğru kurgulanmış raporlar ise satış yöneticisine darboğazları erkenden görme, ekibine zamanında destek olma ve gelir tahminlerini güvenilir bir temele oturtma imkânı verir.

Unutmayın, pipeline yaşayan bir yapıdır. İlk kurulumdan sonraki aylarda toplanan gerçek veriler, aşamalarınızı, olasılık oranlarınızı ve otomasyonlarınızı iyileştirmeniz için en değerli kaynaktır.

HubSpot'ta satış pipeline'ınızı sıfırdan kurmak ya da mevcut yapınızı gözden geçirip optimize etmek istiyorsanız, Corner Group ekibi süreç analizinden kuruluma, veri aktarımından ekip eğitimine kadar her adımda yanınızda. İhtiyaçlarınızı konuşmak için bizimle iletişime geçin.

## Sık sorulan sorular

### HubSpot satış pipeline'ında kaç aşama olmalı?

B2B satış süreçlerinin çoğu için kapanış aşamaları hariç 5 ile 7 arasında aşama yeterlidir. Daha az aşama süreci fazla kabaca gösterir, daha fazlası ise temsilcilerin fırsatları güncellemeyi ihmal etmesine yol açar. 10-12 aşamalı pipeline'lar hem pano görünümünü karmaşıklaştırır hem de güncelleme yükünü artırır. Aşamalar temsilcinin iç faaliyetlerini değil, müşterinin satın alma yolculuğundaki ilerlemeyi göstermeli ve her biri için yazılı bir giriş kriteri belirlenmelidir.

### HubSpot'ta kazanma olasılıkları nasıl belirlenir ve ne zaman güncellenmeli?

Kazanma olasılıkları ilk kurulumda büyük ölçüde tahmine dayanır ve 3 ila 6 ay sonra gerçek verilerle güncellenmelidir. Her aşamaya atanan yüzde, ağırlıklı pipeline değerini belirler; örneğin %60 olasılıklı aşamada toplam 1.000.000 TL değerindeki fırsatların ağırlıklı değeri 600.000 TL olarak hesaplanır. Fırsat dönüşüm raporları her aşamadan kapanışa ne oranda fırsat geçtiğini gösterir. Teklif aşamasındaki fırsatların gerçekte yarıdan azı kazanılıyorsa %60 oranı aşırı iyimserdir ve düşürülmelidir.

### HubSpot'ta ne zaman birden fazla pipeline kullanılmalı?

Satış süreci gerçekten farklıysa ayrı pipeline, yalnızca ürün ya da bölge farklıysa tek pipeline ve filtre kullanılmalıdır. Yeni müşteri satışı ile mevcut müşteriye ek satış, doğrudan satış ile bayi üzerinden satış, proje bazlı satış ile abonelik satışı ve sözleşme yenilemeleri ayrı pipeline gerektiren tipik durumlardır. Aynı adımlarla satılan ürün grupları için "Ürün kategorisi" özelliğiyle filtreleme daha sade bir yapı sunar. Oluşturulabilecek pipeline sayısı HubSpot lisans seviyesine göre değişir.

### Aşama geçişlerinde kaç alan zorunlu tutulmalı?

Her aşama geçişinde en fazla 2-3 kritik alanı zorunlu tutmak genellikle iyi bir başlangıç noktasıdır. Her aşamaya beş-altı zorunlu alan eklemek temsilcileri yorar ve kaçınma davranışını tetikler. Örneğin "Kaybedildi" aşamasına geçişte kayıp nedeni ve kısa açıklama, "Kazanıldı" aşamasına geçişte kazanma nedeni ve sözleşme başlangıç tarihi istenebilir. Kayıp nedeni gibi alanlarda serbest metin yerine açılır liste kullanmak raporlamayı mümkün kılar.
