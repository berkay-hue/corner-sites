---
title: "Kaybedilen Fırsatları Geri Kazanma: n8n ile Otomatik Takip"
description: "Kaybedilen B2B fırsatları nasıl geri kazanılır? Kayıp nedenine göre segmentleme, n8n ile otomatik takip ve ölçüm adımlarını KOBİ'ler için anlatıyoruz."
date: "2026-11-20"
category: "Otomasyon"
image: "https://images.pexels.com/photos/39204819/pexels-photo-39204819.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Kaybedilen Fırsatları Geri Kazanma: n8n ile Otomatik Takip"
alt: "win-back-lost-deals-n8n-automated-follow-up"
---

Kaybedilen bir B2B fırsatı çoğu zaman tamamen kapanmış değildir, yalnızca **zamanlaması yanlış** bir fırsattır. n8n ile kurulan otomatik takip sistemi, CRM'de "kaybedildi" olarak işaretlenen her fırsatı kayıp nedenine göre sınıflandırır, uygun bekleme süresini hesaplar ve doğru zamanda kişiselleştirilmiş bir yeniden temas başlatır. Böylece satış ekibi hiçbir şeyi hatırlamak zorunda kalmadan, daha önce emek verdiği ve sizi zaten tanıyan potansiyel müşterilere sistematik biçimde geri döner.

Bu yazıda, kaybedilen fırsatları geri kazanmak için n8n üzerinde nasıl bir akış kurabileceğinizi adım adım anlatıyoruz: hangi fırsatların takibe değer olduğu, kayıp nedenine göre zamanlama, yapay zekâ ile mesaj kişiselleştirme, yanıt algılama, maliyet ve ölçüm. Amaç, "bir ara tekrar ararız" cümlesini somut, ölçülebilir ve tekrarlanabilir bir sürece dönüştürmek.

## Kaybedilen fırsat neden gerçekten "kayıp" değildir?

B2B satışta bir fırsatın kaybedilmesi genellikle şu nedenlerden birine dayanır: bütçe yoktu, zamanlama uygun değildi, karar verici değişti, rakip seçildi, iç öncelikler kaydı ya da potansiyel müşteri sessizleşti. Bu nedenlerin önemli bir kısmı **kalıcı değil, geçicidir**. Bütçe yeni mali yılda açılır, ertelenen proje bir sonraki çeyrekte gündeme gelir, rakip ürünle yaşanan memnuniyetsizlik birkaç ay içinde kendini gösterir.

Buna rağmen birçok şirkette "Closed Lost" aşaması bir mezarlık gibi işler. Fırsat kapatılır, satış temsilcisi yeni lead'lere odaklanır ve o firma bir daha aranmaz. Oysa bu kişiler:

- Ürününüzü zaten tanır, demo görmüştür ya da teklif almıştır.
- İhtiyaçları, karar süreçleri ve paydaşları hakkında elinizde bilgi vardır.
- Soğuk bir lead'e göre çok daha kısa bir döngüde yeniden değerlendirme yapabilir.

Yeni bir lead'i bulmak, nitelendirmek ve demo aşamasına getirmek ciddi zaman ve bütçe gerektirir. Kaybedilen fırsat havuzu ise bu yatırımın büyük kısmının zaten yapıldığı bir varlıktır. Sorun, bu varlığı yönetecek **disiplinli bir takip mekanizmasının** olmamasıdır. İşte n8n bu noktada devreye girer.

Kayıp nedenlerini doğru analiz etmeden geri kazanım akışı kurmak, yanlış kişiye yanlış mesajı göndermek demektir. Bu konuda temeli sağlamlaştırmak isterseniz [B2B'de kaybedilen satışların nedenini bulma üzerine hazırladığımız vaka yazısına](/blog/b2b-kaybedilen-satislarin-nedenini-bulma) göz atmanızı öneririz.

## Hangi kaybedilen fırsatlar takibe değer?

Her kaybedilen fırsat aynı muameleyi hak etmez. Otomasyonu kurmadan önce havuzunuzu segmentlere ayırmanız gerekir. Pratikte işe yarayan bir sınıflandırma şöyledir:

### Yüksek geri kazanım potansiyeli

- **Zamanlama / erteleme:** "Şu an değil, bir sonraki çeyrekte bakalım." En sıcak segmenttir.
- **Bütçe:** "Bu yıl bütçemiz yok." Mali yıl döngüsüyle doğrudan ilişkilidir.
- **İç öncelik değişikliği:** Proje askıya alınmış ama ihtiyaç ortadan kalkmamıştır.

### Orta geri kazanım potansiyeli

- **Rakip seçildi:** Rakiple sözleşme süresi, onboarding deneyimi ve memnuniyet belirleyicidir. Genellikle 6–12 ay sonra yeniden temas anlamlıdır.
- **Sessizleşme (ghosting):** Nedeni bilinmez; kısa bir bekleme sonrası farklı bir açıyla temas denenebilir.
- **Karar verici ayrıldı:** Hem yeni gelen kişiyle hem de şirketten ayrılan eski şampiyonunuzla (yeni şirketinde) iki ayrı fırsat doğar.

### Düşük potansiyel veya takip dışı

- **Ürün uyumu yok:** İhtiyaç ile çözümünüz örtüşmüyorsa, ancak ürününüzde ilgili bir geliştirme olduğunda temas mantıklıdır.
- **Açık ret ve iletişim istememe:** Bu kişiler otomasyondan tamamen çıkarılmalıdır. Hem etik hem yasal açıdan (KVKK, ticari ileti onayı) bu nokta kritik.

Bu sınıflandırmanın işe yaraması için CRM'de "kayıp nedeni" alanının **zorunlu ve standart seçenekli** olması gerekir. Serbest metin alanı ("fiyat biraz yüksek geldi sanırım") otomasyonu zorlaştırır. Eğer CRM verileriniz dağınıksa, önce [yapay zekâ ile CRM verilerini otomatik temizleme ve zenginleştirme](/blog/yapay-zeka-ile-crm-verilerini-otomatik-temizleme-ve-zenginlestirme-rehberi) adımını tamamlamak, geri kazanım akışının isabetini ciddi oranda artırır.

## n8n ile otomatik geri kazanım sistemi nasıl çalışır?

Sistemin mantığı dört katmandan oluşur:

1. **Yakalama:** Bir fırsat "Closed Lost" aşamasına geçtiğinde n8n bunu algılar.
2. **Sınıflandırma ve planlama:** Kayıp nedenine göre segment belirlenir ve bir "yeniden temas tarihi" hesaplanıp CRM'e yazılır.
3. **Tetikleme ve kişiselleştirme:** Her gün çalışan bir zamanlayıcı, yeniden temas tarihi gelmiş fırsatları bulur; yapay zekâ ile kişiselleştirilmiş mesaj hazırlanır.
4. **Gönderim, yanıt algılama ve geri bildirim:** Mesaj gönderilir veya satış temsilcisine görev olarak atanır; yanıt gelirse akış durur, fırsat yeniden açılır.

Burada önemli bir mimari karar var: n8n'de **Wait** node'u ile 90 gün beklemek teknik olarak mümkün olsa da önerilmez. Uzun beklemeler sunucu yeniden başlatmalarında, sürüm güncellemelerinde ve hata durumlarında kırılgan hale gelir. Bunun yerine bekleme bilgisini CRM'de bir tarih alanında saklamak ve her gün bir **Schedule Trigger** ile bu tarihi sorgulamak çok daha sağlam bir yöntemdir. Bu sayede satış ekibi de CRM üzerinden hangi fırsatın ne zaman yeniden ele alınacağını görebilir.

## Adım adım kurulum

Aşağıdaki adımlar HubSpot, Pipedrive veya Zoho CRM ile çalışacak şekilde genel tutuldu. Node isimleri n8n'deki karşılıklarıyla verilmiştir.

### 1. CRM'de gerekli alanları oluşturun

Otomasyona başlamadan önce CRM'inizde şu özel alanları açın:

- `kayip_nedeni` (açılır liste: Bütçe, Zamanlama, Rakip, Sessizleşme, Karar verici değişti, Ürün uyumu yok, İletişim istemiyor)
- `kayip_detay` (kısa metin: satış temsilcisinin notu)
- `yeniden_temas_tarihi` (tarih)
- `geri_kazanim_durumu` (Bekliyor, Temas edildi, Yanıt alındı, Yeniden açıldı, Kapatıldı)
- `geri_kazanim_deneme_sayisi` (sayı)
- `rakip_adi` (varsa)

Bu alanlar hem otomasyonun yakıtı hem de daha sonra yapacağınız analizin temelidir.

### 2. Kayıp anını yakalayın

İlk iş akışınız (Workflow A) fırsatın kaybedildiği anı yakalar:

- **Tetikleyici:** HubSpot Trigger veya Pipedrive Trigger node'u ile "deal updated" olayını dinleyin. Zoho için CRM'in workflow kuralından n8n **Webhook** node'una istek gönderebilirsiniz.
- **IF node:** Aşama "Closed Lost" değilse akışı durdurun.
- **IF node:** `kayip_nedeni` boşsa, temsilciye Slack veya e-posta ile "Bu fırsatın kayıp nedenini girmeden kapatılamaz" uyarısı gönderin. Bu küçük adım veri kalitesini kökten değiştirir.

### 3. Kayıp nedenine göre yeniden temas tarihi hesaplayın

**Switch** node'u ile her kayıp nedeni için ayrı bir dal açın ve **Set** veya **Code** node'u ile tarih hesaplayın. Başlangıç için şu zamanlamalar makul bir çerçevedir (kendi satış döngünüze göre uyarlayın):

- **Zamanlama / erteleme:** 60–90 gün sonra. Temsilci belirli bir tarih not ettiyse o tarihten 2 hafta önce.
- **Bütçe:** Müşterinin bütçe planlama dönemine 4–6 hafta kala. Türkiye'deki birçok şirket için bu, takvim yılı sonuna yakın, yani ekim–kasım dönemidir.
- **Rakip seçildi:** 150–180 gün sonra (onboarding'in bitip ilk memnuniyetsizliklerin oluştuğu dönem) ve rakip sözleşme yenileme tarihi biliniyorsa ondan 60–90 gün önce.
- **Sessizleşme:** 30–45 gün sonra, farklı bir açıyla.
- **Karar verici değişti:** Hemen (yeni kişiye tanışma mesajı) ve eski şampiyona 30 gün sonra.
- **Ürün uyumu yok:** Otomatik tarih yok; ilgili özellik yayınlandığında manuel tetikleme.
- **İletişim istemiyor:** Akıştan çıkar, CRM'de "iletişim yasak" olarak işaretle.

Hesaplanan tarihi **HubSpot / Pipedrive / Zoho CRM** node'u ile `yeniden_temas_tarihi` alanına yazın ve `geri_kazanim_durumu` alanını "Bekliyor" yapın.

### 4. Günlük tarama akışını kurun

İkinci iş akışı (Workflow B) her sabah, örneğin saat 08:30'da çalışır:

- **Schedule Trigger:** Hafta içi her gün 08:30.
- **CRM node (Search):** `yeniden_temas_tarihi` bugün veya öncesi olan ve `geri_kazanim_durumu` "Bekliyor" olan fırsatları çekin.
- **IF node:** `geri_kazanim_deneme_sayisi` 3 veya üzerindeyse fırsatı "Kapatıldı" olarak işaretleyip akıştan çıkarın. Sonsuz takip, marka algısına zarar verir.
- **Split In Batches / Loop:** Fırsatları tek tek işleyin; özellikle e-posta sağlayıcınızın gönderim limitlerini aşmamak için gruplar arasına kısa beklemeler koyun.

### 5. Kişi verisini doğrulayın ve güncelleyin

Aylar sonra yeniden temas kurarken en sık karşılaşılan sorun, kişinin şirketten ayrılmış olmasıdır. Bu yüzden gönderimden önce:

- E-posta adresinin hâlâ geçerli olup olmadığını bir doğrulama servisiyle kontrol edin (**HTTP Request** node'u).
- Kişinin hâlâ aynı şirkette ve aynı rolde olup olmadığını kontrol edin. Kişi değişmişse, aynı rolü üstlenen yeni kişiyi bulmak için [Apollo.io](https://get.apollo.io/679irkzm35ya) gibi bir B2B iletişim verisi aracını API üzerinden akışa bağlayabilirsiniz.
- Eski şampiyonunuz yeni bir şirkete geçtiyse, bunu ayrı bir "yeni fırsat" olarak CRM'e açın. Sizi tanıyan ve ürününüzü daha önce savunmuş biri, yeni şirketinde en değerli giriş kapınız olabilir.

### 6. Yapay zekâ ile kişiselleştirilmiş mesaj üretin

Geri kazanım mesajının en büyük düşmanı jenerik olmasıdır. "Merhaba, uzun zamandır görüşmedik, ihtiyaçlarınız değişti mi?" türü mesajlar düşük yanıt alır. n8n'deki **OpenAI** veya **AI Agent** node'una şu bağlamı verin:

- Kayıp nedeni ve temsilcinin notu
- Daha önce görüşülen konu ve ilgilenilen modül / paket
- Şirketin sektörü ve büyüklüğü
- O tarihten bu yana ürününüzde yapılan, bu müşteriyle ilgili geliştirmeler (bunu bir Google Sheets veya Notion tablosundan çekebilirsiniz)
- Mesajın tonu ve maksimum uzunluğu (ör. 90 kelime, tek bir net soru)

Örnek bir sistem talimatı şöyle olabilir: *"Sen bir B2B satış temsilcisisin. Aşağıdaki fırsat bilgilerine göre, daha önce görüştüğümüz kişiye 90 kelimeyi geçmeyen, satış baskısı içermeyen, tek bir somut değer önerisi ve tek bir kolay yanıtlanabilir soru içeren bir e-posta yaz. Kayıp nedenine doğrudan atıf yap ama suçlayıcı olma."*

Üretilen metni doğrudan göndermek yerine ilk haftalarda **onay akışı** kurmanızı öneririz: mesaj Slack'te temsilciye düşer, "Gönder / Düzenle / Atla" butonlarıyla karar verilir. Güven oluştukça düşük riskli segmentlerde (ör. sessizleşme) tam otomatik gönderime geçebilirsiniz.

### 7. Kanalı seçin ve gönderin

Her segment için en uygun kanal farklı olabilir:

- **E-posta:** Bütçe ve zamanlama segmentleri için birincil kanal. Gmail veya Outlook node'u ile temsilcinin kendi hesabından gönderilmesi, açılma ve yanıt oranlarını belirgin biçimde iyileştirir.
- **LinkedIn:** Karar verici değişikliği ve eski şampiyon takibinde etkili. Burada otomatik mesaj yerine temsilciye "bugün LinkedIn'den bağlantı kur ve şu notu gönder" görevi oluşturmak daha güvenlidir.
- **Telefon:** Yüksek değerli fırsatlarda (ör. belirli bir ciro eşiğinin üzerinde) otomasyon mesaj göndermez; yalnızca CRM'de arama görevi oluşturur ve konuşma notlarını hazır eder.

Gönderim sonrası CRM'de `geri_kazanim_durumu` "Temas edildi" yapılır, `geri_kazanim_deneme_sayisi` bir artırılır ve bir sonraki deneme için yeni `yeniden_temas_tarihi` (ör. 21 gün sonra) yazılır.

### 8. Yanıtı algılayın ve fırsatı yeniden açın

Üçüncü iş akışı (Workflow C) yanıtları izler:

- **Gmail Trigger / IMAP Email Trigger:** Geri kazanım kampanyasından gelen yanıtları yakalayın (konu satırında veya thread ID'de bir etiketle eşleştirme yapabilirsiniz).
- **AI node ile niyet sınıflandırma:** Yanıtı "İlgili", "Daha sonra", "Rakiple devam", "İletişim istemiyor", "Otomatik yanıt / izin" kategorilerinden birine atayın.
- **Switch node:**
  - *İlgili:* Fırsatı yeni bir pipeline aşamasında yeniden açın, temsilciye anlık Slack bildirimi gönderin ve takvim linki içeren bir yanıt taslağı hazırlayın.
  - *Daha sonra:* Yanıttaki tarihi çıkarıp `yeniden_temas_tarihi` alanını güncelleyin.
  - *İletişim istemiyor:* Kişiyi tüm otomasyonlardan kalıcı olarak çıkarın.
  - *Otomatik yanıt:* Dönüş tarihi varsa ona göre ertelemeyi yapın.

Bu noktada hız kritik. İlgi gösteren bir eski fırsata saatler içinde dönmek, günler sonra dönmekten çok daha yüksek dönüşüm sağlar. Hızlı yanıt mantığının detaylarını [speed-to-lead kavramı ve n8n ile gelen lead'e otomatik yanıt](/blog/speed-to-lead-nedir-n8n-otomatik-yanit) yazımızda ele aldık; aynı prensipler yeniden canlanan fırsatlar için de geçerli.

## Geri kazanım mesajları nasıl yazılmalı?

Otomasyon mesajı taşır ama içeriği yine sizin stratejiniz belirler. Segmente göre işe yarayan yaklaşımlardan birkaç örnek:

**Bütçe nedeniyle kaybedilen fırsat için:**
> "Merhaba Ayşe Hanım, mart ayında görüştüğümüzde bu yıl için bütçe ayrılamadığını söylemiştiniz. Önümüzdeki yılın planlaması başlamışken, o gün konuştuğumuz satış raporlama ihtiyacı için kapsamı daraltılmış bir başlangıç paketi hazırladık. Bütçe görüşmelerinize girdi olması için kısa bir özet göndermemi ister misiniz?"

**Rakip seçildiği için kaybedilen fırsat için:**
> "Merhaba Mehmet Bey, geçen yıl X çözümüyle ilerlemeye karar vermiştiniz, umarım süreç iyi gidiyordur. Benzer ölçekteki ekiplerin ilk 6 ayda en çok raporlama esnekliği konusunda soru işaretleri yaşadığını görüyoruz. Sizin tarafta durum nasıl, karşılaştırmalı bir bakış faydalı olur mu?"

**Sessizleşen fırsat için:**
> "Merhaba Can Bey, teklifimizi ilettikten sonra sizden haber alamadım; büyük ihtimalle öncelikler değişti. Dosyayı kapatmam mı, yoksa birkaç ay sonra tekrar yazmam mı daha uygun olur? Tek kelimelik bir yanıt bile yeterli."

Ortak noktalar şunlar:

- **Önceki görüşmeye somut bir atıf** (tarih, konu, ihtiyaç).
- **Yeni bir değer** (ürün güncellemesi, yeni paket, sektörel içgörü).
- **Tek ve kolay yanıtlanabilir bir soru.**
- **Satış baskısı olmaması.** Amaç tekrar konuşma başlatmak, ilk mesajda satış kapatmak değil.

Demo veya teklif sonrası kaybedilen fırsatlarda mesaj kurgusunu güçlendirmek için [B2B satış demo sonrası takip stratejileri](/blog/b2b-satis-demo-sonrasi-takip-stratejileri-donusumu-artiran-adimlar) yazımızdaki adımlar doğrudan uygulanabilir.

## Hangi metrikler takip edilmeli?

Geri kazanım otomasyonunu "kurdum ve unuttum" moduna sokmamak için şu metrikleri bir panoda izleyin. n8n'den haftalık olarak Google Sheets'e veya bir BI aracına veri aktarabilirsiniz.

- **Yeniden temas edilen fırsat sayısı:** Haftalık ve segment bazında.
- **Yanıt oranı:** Segment ve kanal bazında. Hangi kayıp nedeninin daha "canlı" olduğunu gösterir.
- **Yeniden açılma oranı:** Yanıt verenlerden kaçı pipeline'a geri döndü?
- **Geri kazanım kazanma oranı:** Yeniden açılan fırsatlardan kaçı kazanıldı?
- **Geri kazanılan gelir:** Toplam ve ortalama anlaşma büyüklüğü.
- **Geri kazanım satış döngüsü:** Yeniden açılıştan kapanışa geçen gün sayısı. Genellikle yeni lead'lere göre daha kısa olması beklenir; değilse mesajlaşmayı gözden geçirin.
- **Opt-out oranı:** Yükseliyorsa sıklık veya ton sorunu vardır.

Bu metrikleri ekibin genel performans göstergeleriyle birlikte değerlendirmek için [B2B satış ekibi KPI'ları rehberimize](/blog/b2b-satis-ekibi-kpi-rehberi) başvurabilirsiniz.

## Maliyeti ne kadar?

Geri kazanım otomasyonunun maliyeti üç kalemden oluşur:

1. **n8n altyapısı:** Kendi sunucunuzda (self-hosted) çalıştırırsanız yalnızca küçük bir bulut sunucusunun aylık bedelini ödersiniz. n8n Cloud tercih ederseniz, aylık çalıştırma (execution) sayısına göre fiyatlanan planlardan birini seçersiniz. Bu akış günde bir tarama ve olay bazlı tetiklemelerle çalıştığı için çalıştırma hacmi genellikle düşüktür.
2. **Yapay zekâ API kullanımı:** Mesaj başına birkaç yüz token harcandığı için, ayda birkaç yüz geri kazanım mesajı üreten bir ekipte bu kalem genellikle küçük kalır.
3. **Kurulum ve bakım emeği:** Asıl maliyet buradadır. CRM alanlarının hazırlanması, üç iş akışının kurulması, prompt'ların test edilmesi ve ilk ayın ince ayarları için deneyimli birinin birkaç günlük çalışması gerekir. Sonrasında ayda birkaç saatlik bakım yeterlidir.

Basit bir örnek hesapla düşünelim (rakamlar tamamen temsili): Yılda 200 fırsat kaybeden, ortalama anlaşma büyüklüğü 10.000 dolar olan bir SaaS şirketi, bu havuzun yalnızca yüzde 5'ini geri kazanırsa 10 anlaşma ve 100.000 dolarlık ek gelir elde eder. Bu oran sektöre ve ürüne göre değişir; ancak sıfır maliyetle "unutulan" bir havuzdan küçük bir yüzdenin bile geri dönmesi, otomasyonun maliyetini genellikle rahatlıkla karşılar.

## Sık yapılan hatalar nelerdir?

Geri kazanım otomasyonu kuran ekiplerde tekrar tekrar gördüğümüz hatalar:

- **Kayıp nedenini serbest metin bırakmak:** Otomasyon segmentasyon yapamaz, herkes aynı mesajı alır.
- **Çok erken temas:** Kaybedildikten bir hafta sonra "Fikriniz değişti mi?" mesajı, ısrarcı görünür.
- **Sonsuz takip:** Deneme sayısına üst sınır koymamak, marka algısına zarar verir ve spam şikâyetlerine yol açabilir.
- **Kişi değişikliğini kontrol etmemek:** Şirketten ayrılmış birine yazılan e-posta geri döner ve gönderici itibarınızı düşürür.
- **Satış ekibini döngünün dışında bırakmak:** Yeniden açılan fırsat temsilciye bildirilmezse, sıcak bir yanıt günlerce cevapsız kalabilir.
- **Geri kazanılan fırsatları ayrı raporlamamak:** Bu durumda sistemin gerçek katkısını göremez, yatırımı savunamazsınız.
- **Yasal çerçeveyi atlamak:** Ticari elektronik ileti mevzuatı ve KVKK kapsamında, iletişim istemediğini belirten kişileri kalıcı olarak listeden çıkarmak ve veri işleme dayanağınızı netleştirmek zorunludur.

Geri kazanım otomasyonu, pipeline yönetiminin bir parçası olarak ele alındığında en yüksek verimi verir. Satış metodolojisi, pipeline disiplini ve veri odaklı lead generation tarafında destek arıyorsanız, [veri odaklı B2B satış süreçleri kuran Sales Corner](https://salescorner.co) ekibiyle bu akışları uçtan uca tasarlayabilirsiniz.

## Sık sorulan sorular

### Kaybedilen bir fırsata ne kadar süre sonra yeniden ulaşılmalı?

Bu, kayıp nedenine bağlıdır. Zamanlama nedeniyle ertelenen fırsatlarda 60–90 gün, bütçe nedeniyle kaybedilenlerde bir sonraki bütçe planlama döneminden 4–6 hafta önce, rakip seçilen fırsatlarda ise yaklaşık 6 ay sonra temas kurmak genellikle iyi bir başlangıç noktasıdır. Bu süreleri kendi satış döngünüze göre test ederek ayarlamalısınız.

### n8n'de uzun bekleme süreleri için Wait node kullanmak doğru mu?

Haftalar veya aylar süren beklemeler için Wait node önerilmez, çünkü sunucu yeniden başlatmaları ve güncellemeler akışı kırılgan hale getirebilir. Daha sağlam yöntem, yeniden temas tarihini CRM'de bir alana yazmak ve her gün çalışan bir Schedule Trigger ile tarihi gelmiş fırsatları sorgulamaktır. Bu yaklaşım satış ekibine de görünürlük sağlar.

### Yapay zekânın yazdığı geri kazanım mesajları doğrudan gönderilebilir mi?

Başlangıçta mesajların satış temsilcisinin onayından geçmesi önerilir; n8n üzerinden Slack'e "Gönder / Düzenle / Atla" seçenekli bir onay adımı eklemek kolaydır. Mesaj kalitesinden emin olduktan sonra, sessizleşme gibi düşük riskli segmentlerde tam otomatik gönderime geçilebilir. Yüksek değerli fırsatlarda ise insan dokunuşunu korumak her zaman daha güvenlidir.

### Bu otomasyon hangi CRM'lerle çalışır?

n8n, HubSpot, Pipedrive ve Zoho CRM için hazır node'lara sahiptir; bu node'larla fırsat okuma, güncelleme ve tetikleyici kurma işlemleri yapılabilir. Hazır node'u olmayan CRM'ler için ise Webhook ve HTTP Request node'larıyla API üzerinden aynı akış kurulabilir. Önemli olan, CRM'de kayıp nedeni ve yeniden temas tarihi gibi alanların standart biçimde tutulmasıdır.

## Sonuç

Kaybedilen fırsatlar, B2B şirketlerin en az değerlendirilen gelir kaynaklarından biridir. Bu kişiler sizi tanır, ihtiyaçlarını paylaşmıştır ve çoğu zaman yalnızca doğru zamanı beklemektedir. n8n ile kurulan bir geri kazanım sistemi; kayıp anını yakalar, nedene göre doğru zamanlamayı planlar, yapay zekâ ile kişiselleştirilmiş mesaj hazırlar, yanıtları algılar ve ilgilenen fırsatı anında satış ekibine geri taşır. Üstelik bunu kimsenin "hatırlamasına" gerek kalmadan, her ay aynı disiplinle yapar.

Başlamak için büyük bir projeye ihtiyacınız yok: CRM'de kayıp nedeni alanını standartlaştırın, tek bir segmentle (örneğin zamanlama nedeniyle kaybedilenler) ilk akışı kurun, sonuçları ölçün ve diğer segmentlere genişletin.

Kaybedilen fırsat havuzunuzu sistematik bir gelir kanalına dönüştürmek, CRM'inize uygun n8n akışlarını birlikte tasarlamak isterseniz [Corner Group ekibiyle iletişime geçin](/iletisim); mevcut pipeline'ınızı birlikte inceleyip size özel bir geri kazanım planı çıkaralım.
