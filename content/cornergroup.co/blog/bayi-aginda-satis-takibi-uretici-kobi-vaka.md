---
title: "Bayi Ağında Satış Takibi: Üretici KOBİ Vaka Çalışması"
description: "Bayi ağı olan üretici KOBİ'lerde satış verisi neden dağılır? Gerçek bir vakada CRM kurulumu, veri akışı ve sonuçlarını adım adım ele alıyoruz."
date: "2026-10-26"
category: "Vaka Çalışması"
image: "https://images.pexels.com/photos/8555771/pexels-photo-8555771.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Bayi Ağında Satış Takibi: Üretici KOBİ Vaka Çalışması"
alt: "dealer-network-sales-tracking-case-study"
---

Bayi ağında satış takibi, üreticinin bayilerden gelen teklif, sipariş ve fırsat verilerini **tek bir CRM'de, ortak aşama tanımlarıyla ve otomatik veri akışıyla** toplamasıyla çözülür. Bu vaka çalışmasında anlatılan üretici KOBİ, Excel dosyaları, WhatsApp mesajları ve aylık telefon görüşmeleriyle yürüyen dağınık takibi bırakıp bayileri basit bir portal ve otomatik hatırlatmalarla CRM'e bağladı. Böylece hangi bayinin hangi projede ne aşamada olduğunu haftalık olarak görebilir hale geldi. Kilit nokta yazılımın kendisi değildi. Bayiye "veri girişi" değil "fayda" sunan bir süreç tasarlamak işin özüydü.

Bu yazıda, isim vermeden ve gizlilik gereği bazı ayrıntıları genelleştirerek, endüstriyel ekipman üreten orta ölçekli bir KOBİ'nin bayi ağında satış görünürlüğünü nasıl kazandığını adım adım anlatıyoruz. Paylaştığımız sayılar projenin kurgusunu (bayi sayısı, aşama sayısı, süreler gibi) açıklamak içindir. Sektör istatistiği iddiası taşımazlar. Amacımız, benzer yapıdaki üreticilerin kendi süreçlerine uyarlayabileceği somut bir yol haritası sunmak.

## Bayi ağında satış takibi neden bu kadar zor?

Doğrudan satış yapan bir şirkette satış temsilcisi şirketin çalışanıdır. CRM'e veri girmesi bir iş tanımı meselesidir. Bayi modelinde ise durum farklıdır. Bayi bağımsız bir işletmedir, kendi önceliklerine sahiptir ve çoğu zaman birden fazla markanın ürününü satar. Üreticinin "bana pipeline'ını göster" talebi bayi tarafında çoğu zaman şu sorulara takılır:

- **"Bu bilgiyi neden paylaşayım?"** Bayi, müşteri bilgisini paylaşırsa üreticinin müşteriye doğrudan gideceğinden çekinir.
- **"Zamanım yok."** Küçük bayilerde satışı genellikle işletme sahibi yapar. Ayrıca rapor doldurmaya ayıracak vakti yoktur.
- **"Hangi sistemi kullanayım?"** Her üreticinin farklı bir formatı, farklı bir Excel şablonu vardır.
- **"Karşılığında ne alacağım?"** Veri paylaşımının bayiye somut bir faydası yoksa süreç birkaç hafta içinde unutulur.

Üretici tarafında ise sonuç tanıdıktır. Satış tahminleri tahmin olmaktan çıkıp temenniye dönüşür. Üretim planlaması geriden gelen siparişlere göre yapılır. Hangi bölgede rakibe iş kaybedildiği ancak yıl sonunda anlaşılır.

## Başlangıç noktası neydi?

Vaka çalışmasının konusu olan şirket, Türkiye genelinde yaklaşık **40 aktif bayi** ile çalışan, endüstriyel ekipman üreten bir KOBİ. Merkezde 4 kişilik bir bölge satış ekibi (bayi yöneticileri) ve bir satış müdürü bulunuyordu. Projeye başlamadan önceki tablo şöyleydi:

- Bayiler aylık olarak bir Excel şablonu doldurup e-postayla gönderiyordu. Gönderim oranı düzensizdi ve dosyaların önemli bir kısmı eksik ya da geç geliyordu.
- Büyük projeler (örneğin bir fabrika yatırımı için toplu ekipman alımı) genellikle WhatsApp üzerinden konuşuluyor, kayıt altına alınmıyordu.
- Aynı son müşteriye iki farklı bayinin teklif verdiği, fiyat kırarak birbirine rakip olduğu durumlar yaşanıyordu.
- Satış müdürü çeyreklik tahminleri, bölge yöneticileriyle yaptığı telefon görüşmelerine dayanarak hazırlıyordu.
- Kaybedilen işlerin nedeni sistematik olarak kaydedilmiyordu. "Fiyat yüksek geldi" cevabı her şeyin açıklaması olarak kabul ediliyordu.

Yönetimin talebi netti: "Hangi bayide, hangi projede, ne kadar potansiyel var ve bu iş ne zaman kapanır? Bunu her pazartesi sabahı tek ekranda görmek istiyoruz."

## Proje hedefleri nasıl belirlendi?

Geniş ve ölçülemeyen hedefler yerine, ilk 6 ay için takip edilebilir hedefler tanımlandı:

1. **Görünürlük:** Belirli bir tutarın üzerindeki tüm bayi fırsatlarının CRM'de kayıtlı olması.
2. **Güncellik:** Açık fırsatların en geç 14 günde bir güncellenmesi.
3. **Çakışma önleme:** Aynı son müşteriye ait fırsatın iki bayi tarafından girilmesi halinde 48 saat içinde merkez tarafından karara bağlanması.
4. **Kayıp analizi:** Kapanan her kayıp fırsatta standart bir kayıp nedeninin seçilmesi.
5. **Tahmin doğruluğu:** Çeyreklik tahminin telefon görüşmelerinden değil, CRM'deki ağırlıklı pipeline'dan üretilmesi.

Bu hedeflerin hiçbiri "CRM kuralım" değildi. CRM yalnızca araçtı. Hedefler, yönetimin almak istediği kararlara göre yazıldı.

## Hangi CRM seçildi ve neden?

Şirket üç seçeneği değerlendirdi: HubSpot, Pipedrive ve Zoho CRM. Değerlendirme kriterleri şunlardı:

- **Bayi erişimi:** Bayilerin tam lisans almadan, sınırlı bir arayüzle fırsat girebilmesi.
- **Otomasyon ve API:** Dış formlardan ve sistemlerden veri akışına izin vermesi.
- **Maliyet ölçeklenebilirliği:** 40 bayiye ayrı ayrı tam lisans almanın bütçeyi zorlayacak olması.
- **Raporlama:** Bayi, bölge ve ürün grubu kırılımında pipeline raporu.

Sonunda şirket, merkez ekibin CRM'i tam lisansla kullandığı, bayilerin ise CRM'e doğrudan değil **basit bir web formu ve haftalık e-posta özetleri üzerinden** bağlandığı hibrit bir model seçti. Bu yaklaşım hem lisans maliyetini düşük tuttu hem de bayiler için öğrenme eğrisini neredeyse sıfıra indirdi. Araç tercihi Pipedrive yönünde oldu. Ancak burada anlatılan mimari, HubSpot ya da Zoho ile de kurulabilir. CRM değiştirmeyi düşünen şirketler için [Pipedrive'dan HubSpot'a geçişte veri taşıma adımlarını anlattığımız vaka](/blog/pipedriveden-hubspota-gecis-vaka-calismasi) karar sürecine iyi bir referans olabilir.

## Uygulama adım adım nasıl ilerledi?

### 1. Ortak bir satış dili oluşturmak

İlk iş yazılım değil, tanımlardı. Her bayinin "teklif verildi" ya da "sıcak müşteri" ifadesinden anladığı farklıydı. Bölge yöneticileri ve gönüllü beş bayiyle yapılan iki atölye sonunda **6 aşamalı** bir bayi pipeline'ı tanımlandı:

1. **Fırsat kaydı:** Son müşteri ve ihtiyaç belli, bayi işi takip ediyor.
2. **Teknik keşif:** Saha ziyareti ya da teknik görüşme yapıldı.
3. **Teklif verildi:** Bayi, son müşteriye resmi teklif iletti.
4. **Pazarlık / revizyon:** Fiyat, teslim süresi veya teknik şartname konuşuluyor.
5. **Sözlü onay:** Müşteri işi verdiğini belirtti, sipariş bekleniyor.
6. **Kazanıldı / Kaybedildi:** Sipariş üreticiye düştü ya da iş kaybedildi.

Her aşamaya bir **olasılık yüzdesi** atandı ve bu yüzdeler ağırlıklı pipeline hesabında kullanıldı. Başlangıçta yüzdeler tahmini olarak belirlendi. İlk çeyreğin sonunda gerçekleşen kapanışlara göre revize edilmesi kararlaştırıldı.

### 2. Fırsat kaydı (deal registration) kuralını koymak

Bayilerin veri paylaşmaya en çok direnç gösterdiği nokta, üreticiye güvensizlikti. Bu nedenle sisteme bir **fırsat koruma kuralı** eklendi. Bir bayi, son müşteriyi sisteme ilk kaydeden taraf olduğunda o fırsat **90 gün** boyunca o bayiye ait sayılıyor, diğer bayilerden gelen aynı müşteri kaydı merkez tarafından reddediliyordu. Ayrıca sisteme kayıtlı fırsatlarda bayiye **proje bazlı özel fiyat** desteği sağlanabiliyordu.

Bu tek kural, bayi tarafındaki motivasyonu tersine çevirdi. Veri girmek artık üreticiye "rapor vermek" değil, bayinin kendi işini **koruma altına alması** anlamına geliyordu.

### 3. Bayi için mümkün olan en kısa formu tasarlamak

Bayi fırsat formu, cep telefonundan iki dakikada doldurulabilecek şekilde **7 alanla** sınırlandırıldı:

- Son müşteri firma adı
- Şehir
- Ürün grubu (açılır liste)
- Tahmini tutar aralığı (açılır liste)
- Tahmini karar tarihi (ay olarak)
- Rakip var mı? (Evet/Hayır, varsa marka)
- Kısa not

Vergi numarası, yetkili kişi telefonu gibi hassas alanlar zorunlu tutulmadı. Bu alanlar ancak fırsat "teklif verildi" aşamasına geçtiğinde, özel fiyat talebi için isteniyordu.

### 4. Veri kalitesi kurallarını baştan koymak

Yinelenen firma kayıtları bayi modelinde ciddi bir sorundur. "ABC Makine", "ABC Makina San. Tic." ve "ABC Makine Ltd." üç ayrı müşteri gibi görünür. Bu nedenle form verisi CRM'e yazılmadan önce firma adı normalize ediliyor, olası eşleşmeler bölge yöneticisine onay için gönderiliyordu. Bu konudaki yaklaşımı daha ayrıntılı merak edenler için [çok markalı bir holdingde CRM veri kalitesini nasıl iyileştirdiğimizi anlatan vaka](/blog/cok-markali-holdingde-crm-veri-kalitesi-basarili-bir-vaka-calismasi) benzer kuralları içeriyor.

## n8n ile hangi otomasyonlar kuruldu?

Projenin "ağır işini" n8n üzerinde kurulan iş akışları üstlendi. Amaç, bölge yöneticilerinin manuel takip yükünü azaltmak ve bayiye yalnızca gerektiğinde dokunmaktı. Kurulan başlıca akışlar şunlardı:

- **Form → CRM akışı:** Bayi formu gönderdiğinde n8n veriyi alıyor, firma adını normalize ediyor, CRM'de olası eşleşme arıyor ve sonuca göre ya yeni fırsat açıyor ya da bölge yöneticisine "olası çakışma" bildirimi gönderiyordu.
- **Çakışma yönetimi:** Aynı son müşteriye ikinci bir bayi kaydı geldiğinde, ilgili bölge yöneticisine ve satış müdürüne iki kaydın karşılaştırmalı özeti iletiliyordu. Karar 48 saat içinde verilmezse otomatik hatırlatma gidiyordu.
- **Güncelleme hatırlatmaları:** 14 gündür hareket görmeyen fırsatlar için bayiye, fırsatın mevcut aşamasını tek tıkla güncelleyebileceği bir bağlantı içeren e-posta gönderiliyordu. Üç seçenek yeterliydi: "Aynı aşamada", "İlerledi", "Kaybedildi".
- **Haftalık bayi özeti:** Her pazartesi sabahı her bayiye kendi açık fırsatlarının listesi, koruma süresi dolmak üzere olan kayıtlar ve varsa onaylanan özel fiyatlar gönderiliyordu.
- **Yönetim raporu:** Satış müdürüne bölge ve ürün grubu kırılımında ağırlıklı pipeline, bu hafta açılan/kapanan fırsatlar ve kayıp nedenleri özetleniyordu.

Bu akışların ortak özelliği, **bayinin CRM'e hiç giriş yapmadan** sürece dahil olabilmesiydi. Bayi açısından sistem bir form, birkaç e-posta ve tek tıklık güncelleme bağlantılarından ibaretti. n8n ile benzer bildirim ve hatırlatma zincirlerini başka bir bağlamda nasıl kurduğumuzu görmek isterseniz [B2B etkinlik pazarlamasında n8n otomasyonu vakası](/blog/b2b-etkinlik-pazarlamasinda-n8n-ile-otomasyon-basarili-bir-vaka-calismasi) iyi bir örnek sunuyor.

## Bayiler sisteme nasıl ikna edildi?

Teknik kurulum yaklaşık 5 hafta sürdü. Asıl zorlu kısım ise benimsetmeydi. Şirket bunu üç dalgada yaptı.

**Pilot dalga (ilk 4 hafta):** Atölyelere katılan 5 gönüllü bayi ile başlandı. Bu bayilerden gelen geri bildirimle form iki kez sadeleştirildi. Örneğin başlangıçta zorunlu olan "son müşteri yetkili adı" alanı kaldırıldı.

**Genişleme dalgası (5-10. hafta):** Pilot bayilerin deneyimleri, bölgesel bayi toplantılarında bizzat bu bayiler tarafından anlatıldı. Bir bayinin "geçen ay sisteme girdiğim projede başka bayi araya girmeye çalıştı, merkez işi bende tuttu" demesi, herhangi bir sunumdan daha ikna ediciydi.

**Kurumsallaştırma (11. haftadan itibaren):** Proje bazlı özel fiyat, kampanya destekleri ve yıl sonu bayi primlerinin hesaplanmasında **yalnızca sisteme kayıtlı fırsatlar** dikkate alınmaya başlandı. Bu kural önceden duyuruldu ve geçiş için bir aylık süre tanındı.

Prim ve teşvik tasarımı burada belirleyici oldu. Bayilere ve iç ekibe yönelik teşvik sistemini kurgularken [B2B satış komisyon planı hazırlama rehberimizdeki](/blog/b2b-satis-komisyon-plani-nasil-hazirlanir) ilkeler uyarlandı: basit hesaplanabilirlik, şeffaflık ve davranışı doğrudan ödüllendirme.

## Yapay zekâ bu süreçte nerede kullanıldı?

Yapay zekâ projenin merkezinde değildi. Ama üç noktada belirgin bir zaman tasarrufu sağladı:

- **Serbest metin notlarının sınıflandırılması:** Bayilerin formdaki "kısa not" alanına yazdıkları ifadeler bir dil modeliyle işlenerek rakip markası, teknik engel ve aciliyet gibi etiketlere ayrıldı. Böylece "rakip X ile fiyat yarışı var" gibi bilgiler raporlanabilir hale geldi.
- **Kayıp nedeni önerisi:** Fırsat "kaybedildi" olarak işaretlendiğinde, fırsat geçmişindeki notlara bakılarak en olası kayıp nedeni öneriliyor, bölge yöneticisi bunu onaylıyor ya da düzeltiyordu. Kayıp analizini sistematik hale getirmek için kullanılan çerçeveyi [B2B'de kaybedilen satışların nedenini bulma vakamızda](/blog/b2b-kaybedilen-satislarin-nedenini-bulma) ayrıntılı olarak anlattık.
- **Haftalık yönetim özeti:** Ham rapor verisi, satış müdürü için birkaç paragraflık bir yorum metnine dönüştürülüyordu. Örneğin "Marmara'da teklif aşamasındaki fırsatlar artarken pazarlık aşamasında bekleme süresi uzuyor" gibi. Bu özet bir karar aracı değil, dikkat çekici bir başlangıç noktasıydı. Rakamların doğruluğu her zaman CRM raporundan kontrol edildi.

Yapay zekâ çıktılarının hiçbiri doğrudan bayiye gönderilmedi. Tüm sınıflandırmalar insan onayından geçti. Bu, özellikle bayi ilişkisinin hassas olduğu bir yapıda bilinçli bir tercihti.

## İlk 6 ayda neler değişti?

Gizlilik nedeniyle şirkete özgü rakamları paylaşmıyoruz. Ancak değişimin yönü ve niteliği oldukça netti:

- **Pazartesi toplantıları değişti.** Satış müdürü artık bölge yöneticilerine "Durum ne?" diye sormak yerine, ekrandaki listeden belirli fırsatlar üzerine soru soruyordu: "Bu proje üç haftadır pazarlıkta, ne eksik?"
- **Bayi çakışmaları görünür hale geldi.** Daha önce sahada fiyat kırılarak "çözülen" çakışmalar artık merkezde ve kayıt altında karara bağlanıyordu. Bu da fiyat disiplinini olumlu etkiledi.
- **Üretim planlaması öne çekildi.** "Sözlü onay" aşamasındaki fırsatlar üretim ekibiyle haftalık paylaşılmaya başlandı. Uzun termin süreli ürünlerde hazırlık daha erken başlayabildi.
- **Rakip istihbaratı oluştu.** Sınıflandırılmış notlar sayesinde hangi bölgede hangi rakip markayla, hangi ürün grubunda karşılaşıldığı ilk kez sistematik olarak görüldü. Bu veri, sonraki dönemde ürün ve fiyat stratejisine girdi oldu.
- **Bayi performans görüşmeleri nesnelleşti.** Yıl sonu değerlendirmesi artık yalnızca gerçekleşen ciroya değil, açılan fırsat sayısına, dönüşüm oranına ve güncelleme disiplinine de dayanıyordu.

Tüm bayiler aynı hızda uyum sağlamadı. Ağın küçük bir kısmı sistemi düzenli kullanmakta zorlandı. Bu bayiler için bölge yöneticisinin aylık telefon görüşmesinde fırsatları bayi adına girdiği bir "asistanlı mod" tanımlandı. Mükemmel değil, ama sıfır veriden iyiydi.

## Maliyeti ne kadar?

Bu tür bir projenin maliyeti, şirketin büyüklüğüne ve seçilen araçlara göre ciddi farklılık gösterir. Bu yüzden tek bir rakam vermek yanıltıcı olur. Bütçeyi planlarken dikkate alınması gereken kalemler şunlardır:

- **CRM lisansları:** Burada anlatılan hibrit modelde yalnızca merkez ekip (bu vakada 5-6 kullanıcı) tam lisansa ihtiyaç duyar. Bayiler form ve e-posta üzerinden bağlandığı için bayi başına lisans gerekmez. Bu, toplam maliyeti belirleyen en önemli tasarım kararıdır.
- **Otomasyon altyapısı:** n8n kendi sunucunuzda barındırılabilir ya da bulut sürümü kullanılabilir. Her iki seçeneğin de maliyet ve bakım yükü farklıdır.
- **Kurulum ve danışmanlık:** Süreç tasarımı, atölyeler, entegrasyonlar ve test. Bu vakada teknik kurulum yaklaşık 5 hafta, benimsetme süreci ise yaklaşık 3 ay sürdü.
- **Yapay zekâ kullanımı:** Not sınıflandırma ve özetleme için kullanılan dil modeli API'lerinin maliyeti, işlenen metin hacmine bağlıdır. Bayi ağı ölçeğinde genellikle bütçenin küçük bir kalemidir.
- **İç zaman maliyeti:** Bölge yöneticilerinin pilot dönemde bayilerle birebir ilgilenmesi için ayırdığı zaman çoğu zaman hesaba katılmaz, ama gerçek bir maliyettir.

Doğru soru "Ne kadar tutar?" değil, "Görünmeyen pipeline bize ne kaybettiriyor?" sorusudur. Çakışan bayi teklifleri yüzünden kırılan fiyatlar, geç planlanan üretim ve fark edilmeden kaybedilen projeler genellikle sistem maliyetinden çok daha büyük bir kalemdir.

## Diğer üreticiler bu vakadan ne öğrenebilir?

Benzer bir proje planlayan üreticiler için öne çıkan dersler şunlar:

1. **Önce tanım, sonra yazılım.** Ortak aşama tanımları olmadan kurulan CRM, Excel'in daha pahalı bir versiyonu olur.
2. **Bayiye fayda sunun.** Fırsat koruma ve proje bazlı fiyat desteği gibi somut karşılıklar olmadan veri paylaşımı sürdürülebilir olmaz.
3. **Formu acımasızca kısaltın.** Her ek alan, doldurulma oranını düşürür. Gerekli bilgiyi aşamalara yayın.
4. **Bayiyi CRM'e değil, CRM'i bayiye götürün.** Form, e-posta ve tek tıklık güncellemeler, bayiye yeni bir yazılım öğretmekten çok daha etkilidir.
5. **Otomasyonu takip yükünü azaltmak için kullanın.** n8n gibi araçlar hatırlatma, çakışma kontrolü ve raporlama işini üstlenirse bölge yöneticileri ilişkiye odaklanabilir.
6. **Yapay zekâyı insan onayıyla kullanın.** Özellikle bayi ilişkisi gibi hassas alanlarda yapay zekâ öneri üretmeli, kararı insan vermelidir.
7. **Teşvikleri sisteme bağlayın, ama geçiş süresi tanıyın.** Prim ve destekleri kayıtlı fırsatlara bağlamak benimsetmeyi hızlandırır. Ani geçiş ise direnç yaratır.

Bayi pipeline'ını yönetirken satış metodolojisi ve aşama disiplini konusunda dış destek arayan şirketler için [Sales Corner'ın veri odaklı B2B satış ve pipeline yaklaşımı](https://salescorner.co) iyi bir başlangıç noktası olabilir.

## Sık sorulan sorular

### Bayilere CRM lisansı vermek zorunlu mu?

Hayır. Bu vakadaki gibi bayilerin bir web formu ve otomatik e-postalar üzerinden sisteme bağlandığı hibrit bir model, hem lisans maliyetini düşürür hem de bayi tarafında öğrenme yükünü ortadan kaldırır. Bayi sayısı az ve bayiler teknolojiye yatkınsa sınırlı erişimli kullanıcı hesapları da düşünülebilir.

### Bayiler müşteri bilgilerini paylaşmak istemezse ne yapılmalı?

En etkili çözüm, veri paylaşımını bayi için bir korumaya dönüştürmektir. Fırsatı ilk kaydeden bayiye belirli bir süre öncelik tanıyan fırsat koruma kuralı ve kayıtlı projelere özel fiyat desteği, bayinin bilgi paylaşma motivasyonunu belirgin biçimde artırır. Hassas alanları ilk aşamada zorunlu tutmamak da güveni hızlandırır.

### Bayi ağında satış takibi sistemi ne kadar sürede kurulur?

Bu vakada teknik kurulum yaklaşık 5 hafta, pilottan tüm ağa yayılma ve kurumsallaşma ise yaklaşık 3 ay sürdü. Süre; bayi sayısına, mevcut veri kalitesine ve ERP gibi diğer sistemlerle entegrasyon ihtiyacına göre değişir. Asıl zaman alan kısım genellikle yazılım değil, bayilerin benimsemesidir.

### Hangi CRM bayi ağı yönetimi için daha uygun?

HubSpot, Pipedrive ve Zoho CRM'in hepsi bu tür bir yapıyı destekleyebilir. Belirleyici olan; API ve otomasyon esnekliği, merkez ekip için lisans maliyeti ve bayi, bölge ve ürün kırılımında raporlama kabiliyetidir. Araç seçiminden önce süreç ve aşama tanımlarını netleştirmek, yanlış araç seçme riskini önemli ölçüde azaltır.

## Sonuç

Bayi ağında satış takibi, üretici KOBİ'ler için çoğu zaman "bayiler veri girmiyor" şikâyetine sıkışır. Bu vaka, sorunun teknolojiden çok tasarımda olduğunu gösteriyor. Ortak bir satış dili, bayiye somut fayda sağlayan fırsat koruma kuralı, iki dakikada doldurulan bir form ve takibi üstlenen n8n otomasyonları bir araya geldiğinde, dağınık Excel dosyaları her pazartesi güncel bir pipeline ekranına dönüşebiliyor. Yapay zekâ ise doğru yerde, insan onayıyla kullanıldığında bu tabloyu daha anlamlı hale getiriyor.

Siz de bayi ağınızdaki satış fırsatlarını görünür kılmak, CRM ve otomasyon altyapınızı bayi modelinize uygun şekilde kurmak istiyorsanız, mevcut durumunuzu birlikte değerlendirmek için [Corner Group ekibiyle iletişime geçin](/iletisim).
