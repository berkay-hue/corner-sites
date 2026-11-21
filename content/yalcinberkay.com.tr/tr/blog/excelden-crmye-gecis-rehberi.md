---
title: "Excel'den CRM'e Geçiş: Satış Ekibi İçin Adım Adım Plan"
description: "Satış takibini Excel'de yürüten ekipler CRM'e nasıl geçmeli? Veri hazırlığından pilot kullanıma kadar adım adım plan ve sık yapılan hatalar ve çözümleri."
date: "2026-11-08"
category: "CRM"
image: "https://images.pexels.com/photos/7693155/pexels-photo-7693155.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Excel'den CRM'e Geçiş: Satış Ekibi İçin Adım Adım Plan"
---

Excel'den CRM'e geçiş, tek seferde yapılan bir "dosya yükleme" işi değildir. **Önce satış sürecini ve veri yapısını tanımlarsınız, sonra Excel'deki veriyi temizleyip bu yapıya göre aktarır, en son ekibi yeni düzende çalışmaya alıştırırsınız.** Küçük ve orta ölçekli bir B2B satış ekibi için bu iş genellikle 4-8 hafta sürer. Başarısız geçişlerin çoğu yazılım yüzünden değil, Excel'deki dağınıklığın olduğu gibi CRM'e taşınması yüzünden olur.

Bu yazıda, satış ekibini Excel'den CRM'e taşırken izlenecek planı adım adım anlatıyorum. Hangi sırayla ilerleyeceğinizi, her aşamada neye karar vermeniz gerektiğini, ne kadar zaman ve emek ayırmanız gerektiğini ve en sık yapılan hataları bulacaksınız. Amaç, geçişten üç ay sonra "CRM'i aldık ama herkes yine Excel'e döndü" cümlesini kurmamak.

## Excel'den CRM'e geçmenin zamanı geldi mi?

Excel kötü bir araç değildir. Tek kişilik bir kurucu satışı ya da ayda birkaç fırsatla çalışan iki kişilik bir ekip için yıllarca yeterli olabilir. Sorun, ekip ve fırsat sayısı büyüdüğünde ortaya çıkar. Şu belirtilerden üçü veya daha fazlası sizde varsa geçişi ertelemenin bedeli artık ödediğiniz CRM lisansından yüksektir:

- **Aynı müşterinin birden fazla dosyada farklı bilgilerle yer alması.** Ahmet'in dosyasında "teklif gönderildi", Zeynep'in dosyasında "ilk görüşme" yazıyorsa kimin haklı olduğunu bilemezsiniz.
- **"Son dosya hangisi?" sorusunun haftada en az bir kez sorulması.** "pipeline_final_v3_guncel.xlsx" gibi dosya adları tanıdık geliyorsa bu madde size uyuyor.
- **Bir temsilci ayrıldığında müşteri geçmişinin de onunla gitmesi.** Notlar kişisel dosyalarda ya da e-posta kutularında kalıyorsa devir teslim haftalar sürer.
- **Satış tahmininin yöneticinin sezgisine dayanması.** Fırsatların hangi aşamada ne kadar beklediğini göremiyorsanız tahmininiz tahmin değil, umuttur.
- **Takip görevlerinin unutulması.** "Geçen ay arayacaktık" diye hatırlanan fırsatlar, hatırlandığında çoğu zaman çoktan rakibe gitmiştir.
- **Raporlamanın her ay birinin yarım gününü alması.** Birden fazla dosyayı birleştirip pivot tablo kurmak, satış operasyonunun en pahalı angaryalarından biridir.

Örneğin 5 temsilcili bir ekipte her temsilci haftada sadece 2 saatini dosya güncellemeye, bilgi aramaya ve "bu müşteriyle kim konuşmuştu?" sorusuna ayırıyorsa ayda yaklaşık 40 saatlik satış zamanı kaybediliyor demektir. Bu, neredeyse bir temsilcinin bir haftalık mesaisine denk gelir.

## Geçişe başlamadan önce hedefi netleştirin

"CRM'e geçiyoruz" bir hedef değildir. Geçişin neyi çözmesini istediğinizi en baştan yazılı hâle getirin, çünkü kurulum sırasında vereceğiniz her karar bu hedeflere göre şekillenecek.

İyi tanımlanmış hedeflere birkaç örnek:

1. **Pipeline görünürlüğü:** "Her pazartesi açık fırsatların aşama, tutar ve beklenen kapanış tarihine göre dağılımını tek ekranda görmek."
2. **Takip disiplini:** "Hiçbir açık fırsatın gelecek tarihli bir görevi olmadan kalmaması."
3. **Devir teslim güvencesi:** "Bir müşteriyle ilgili tüm yazışma ve notların 2 dakika içinde bulunabilmesi."
4. **Raporlama süresi:** "Aylık satış raporunun hazırlanma süresini yarım günden 15 dakikaya indirmek."

Bu hedefleri 3-5 maddeyle sınırlayın. Bütün ihtiyaçları ilk günden karşılamaya çalışan bir kurulum hem gecikir hem de ekibi gereksiz alanlarla boğar.

Bir de **sorumlu** belirleyin. Geçişin bir sahibi olmalı: küçük ekiplerde genellikle satış yöneticisi, biraz daha büyük ekiplerde satış operasyonları sorumlusu. "Hepimiz birlikte hallederiz" yaklaşımı, kimsenin halletmemesiyle sonuçlanır.

## Adım 1: Mevcut Excel dosyalarının envanterini çıkarın

İlk iş, şirkette satışla ilgili hangi dosyaların olduğunu bulmaktır. Bu adım sanıldığından uzun sürer, çünkü dosyalar ortak klasörlere, kişisel bilgisayarlara, e-posta eklerine ve bulut sürücülere dağılmıştır.

Her temsilciden ve yöneticiden şu listeyi isteyin:

- Kullandıkları tüm müşteri, aday ve fırsat dosyaları
- Teklif takip tabloları
- Fuar, etkinlik ya da satın alınmış listelerden gelen aday dosyaları
- Kişisel not dosyaları (evet, bunlar da önemli)

Ardından bir **envanter tablosu** oluşturun. Her dosya için şu sütunlar yeterlidir: dosya adı, sahibi, kayıt sayısı, son güncellenme tarihi, içerdiği alanlar ve "CRM'e taşınacak mı?" kararı.

Bu aşamada sert davranmaktan çekinmeyin. Son 18-24 aydır hiç dokunulmamış, iletişim bilgisi eksik ve kimsenin sahiplenmediği aday listelerini CRM'e taşımak zorunda değilsiniz. Bunları arşivleyin. CRM'e taşınan her işe yaramaz kayıt, ileride raporlarınızı bozacak ve temsilcilerin sisteme güvenini zayıflatacaktır.

## Adım 2: Satış sürecini ve aşamaları tanımlayın

Geçişin en kritik adımı budur ve çoğu ekip bunu atlar. Excel'de "Durum" sütununa herkes kendi kelimesini yazar: "görüşüldü", "sıcak", "teklif aşamasında", "bekliyor", "olumlu". CRM'de bu serbestliğe izin verirseniz aynı karmaşayı daha pahalı bir yazılıma taşımış olursunuz.

Önce gerçek satış sürecinizi kâğıda dökün. Tipik bir B2B hizmet satışı için örnek bir aşama dizisi şöyle olabilir:

1. **Nitelikli aday:** Hedef profile uyan, ilk temasın kurulduğu firma
2. **Keşif görüşmesi yapıldı:** İhtiyaç, bütçe, karar süreci konuşuldu
3. **Çözüm sunumu / demo:** Karar vericiye sunum yapıldı
4. **Teklif gönderildi:** Yazılı teklif iletildi
5. **Pazarlık:** Fiyat, kapsam ya da sözleşme maddeleri konuşuluyor
6. **Kazanıldı / Kaybedildi**

Her aşama için **giriş kriteri** yazın. "Teklif gönderildi" aşamasına geçmek için yazılı teklifin müşteriye iletilmiş olması gerekir; "teklif hazırlıyoruz" bu aşamaya girmez. Bu ayrım, ileride forecast doğruluğunu doğrudan belirler. Aşamaları tanımlarken nelere dikkat edeceğinizi [CRM'de satış aşamalarının nasıl tanımlanacağını anlattığım yazıda](/blog/crmde-satis-asamalari-nasil-tanimlanir) ayrıntılı olarak ele aldım.

Ayrıca **kayıp nedenlerini** de şimdiden standart bir liste hâline getirin: fiyat, zamanlama, rakip, bütçe yok, karar verici değişti, yanıt yok. Excel'de genelde hiç tutulmayan bu bilgi, birkaç ay sonra satış stratejiniz için en değerli verilerden biri olur.

## Adım 3: Veri modelini tasarlayın

Excel'de her şey tek bir satırda durur: firma adı, kişi adı, telefon, teklif tutarı, son görüşme notu. CRM'de ise bu bilgiler birbirine bağlı ayrı kayıtlara bölünür. Bu yapıyı baştan doğru kurmak, geçişin geri kalanını kolaylaştırır.

Çoğu CRM'de temel nesneler şunlardır:

- **Firma (Account / Company):** Firma adı, sektör, şehir, çalışan sayısı aralığı, web sitesi
- **Kişi (Contact):** Ad soyad, unvan, e-posta, telefon, bağlı olduğu firma
- **Fırsat (Deal / Opportunity):** Fırsat adı, tutar, aşama, beklenen kapanış tarihi, sahibi, bağlı firma ve kişiler
- **Aktivite:** Arama, e-posta, toplantı, not ve görevler

Excel'deki bir satırın CRM'de nasıl bölüneceğini örnekle düşünün. "ABC Lojistik – Mehmet Bey – Satın Alma Müdürü – 0532… – 250.000 TL yıllık hizmet teklifi – 12 Mart'ta teklif gönderildi" satırı; bir firma kaydına, bir kişi kaydına, bir fırsat kaydına ve bir aktivite notuna dönüşür. Aynı firmada ikinci bir fırsat açıldığında firma kaydını tekrar oluşturmazsınız, mevcut kayda yeni bir fırsat bağlarsınız.

### Hangi alanlar zorunlu olmalı?

Burada kural basit: **az ve öz.** Zorunlu alan sayısını her nesne için 4-6 ile sınırlayın. Örneğin bir fırsat için zorunlu alanlar şunlar olabilir: fırsat adı, firma, tutar, aşama, beklenen kapanış tarihi, sahibi. "Müşterinin rakip kullanıp kullanmadığı", "karar sürecindeki kişi sayısı" gibi alanlar faydalı olabilir ama ilk günden zorunlu yaparsanız temsilciler alanları rastgele doldurmaya başlar.

Bir diğer önemli karar, serbest metin yerine **açılır liste** kullanmaktır. Sektör, şehir, kaynak (referans, outbound, web formu, fuar) ve kayıp nedeni gibi alanlar mutlaka seçmeli olmalı. Aksi hâlde "İstanbul", "istanbul", "İST" ve "Ist." diye dört farklı şehir görürsünüz.

## Adım 4: Veriyi temizleyin

Veriyi aktarmadan önce temizlemek, aktardıktan sonra temizlemekten çok daha kolaydır. Excel'in filtre, sıralama ve formül özellikleri bu aşamada en iyi dostunuzdur.

Temizlik için kontrol listesi:

1. **Dosyaları tek bir ana tabloda birleştirin.** Tüm envanterdeki taşınacak dosyaları, Adım 3'te belirlediğiniz sütun yapısına göre tek bir çalışma kitabında toplayın.
2. **Yinelenen kayıtları ayıklayın.** Aynı firma farklı yazımlarla (ABC Lojistik A.Ş., ABC Lojistik, Abc Lojistik Ltd.) birden fazla kez yer alıyor olabilir. Web sitesi alan adı ve e-posta adresi, eşleştirme için firma adından çok daha güvenilir anahtarlardır.
3. **Formatları standartlaştırın.** Telefonları tek formata (ör. +90 5XX XXX XX XX), tarihleri tek formata, şehir ve sektörleri açılır listedeki değerlere çevirin.
4. **Eksik ve bozuk kayıtları işaretleyin.** E-postası da telefonu da olmayan kişi kayıtlarını ya tamamlayın ya da taşımayın.
5. **Sahipliği netleştirin.** Her firma ve fırsatın bir sahibi olmalı. Ayrılmış temsilcilerin kayıtlarını şimdiden mevcut ekibe dağıtın.
6. **Fırsat durumlarını yeni aşamalara eşleyin.** Excel'deki "sıcak", "olumlu", "bekliyor" gibi ifadeleri tek tek Adım 2'deki aşamalara karşılık getirin. Karşılığı belli olmayanlar için fırsat sahibine sorun.

Yinelenen kayıt temizliği tek başına ayrı bir uzmanlık konusu; hangi alanların eşleştirme anahtarı olarak kullanılacağını ve birleştirme kurallarını [CRM'de yinelenen kayıtların nasıl ayıklanacağını anlattığım rehberde](/blog/crm-veri-temizligi-yinelenen-kayitlar) bulabilirsiniz.

Gerçekçi bir beklenti vermek gerekirse birkaç bin kayıtlık bir veri setinde temizlik, toplam geçiş süresinin en uzun kalemidir. 3.000 kayıtlık bir firma ve kişi listesi için 2-4 iş günü ayırmak abartı değildir.

## Adım 5: CRM'i seçin ve temel kurulumu yapın

Bu sıralama bilinçli: CRM'i süreç ve veri modeli netleştikten sonra seçmek, demo sırasında doğru soruları sormanızı sağlar. "Bizim 6 aşamalı bir sürecimiz, kayıp nedeni alanımız ve fırsat başına birden fazla kişi bağlama ihtiyacımız var; bunu sizin sistemde nasıl kurarız?" sorusu, genel bir ürün tanıtımından çok daha fazla bilgi verir.

Küçük ekipler için seçim yaparken dikkat edilecek kriterleri [küçük satış ekibi için CRM seçimi üzerine yazdığım yazıda](/blog/kucuk-satis-ekibi-icin-crm-nasil-secilir) ayrıntılı olarak anlattım. Kısaca bakılması gerekenler: kullanım kolaylığı, e-posta ve takvim entegrasyonu, mobil uygulama, Excel/CSV içe aktarma kolaylığı, Türkçe dil desteği ve büyüdükçe artacak maliyet.

Seçimden sonra temel kurulum şu sırayla yapılır:

- Kullanıcı hesaplarının ve rollerin oluşturulması (temsilci, yönetici, yönetici yetkileri)
- Pipeline aşamalarının ve giriş kriterlerinin girilmesi
- Özel alanların ve açılır listelerin tanımlanması
- E-posta ve takvim entegrasyonunun bağlanması
- Temel raporların ve pano ekranının kurulması (açık pipeline, aşamaya göre dağılım, bu ay kapanması beklenen fırsatlar, gecikmiş görevler)

Otomasyon tarafında ilk günden çok iddialı olmayın. Başlangıç için 2-3 basit kural yeterli: yeni fırsat açıldığında sahibine görev oluşturulması, fırsat "teklif gönderildi" aşamasına geçince 3 gün sonrasına takip görevi atanması, 14 gündür hareketsiz kalan fırsatlar için yöneticiye bildirim gitmesi gibi. Süreç oturduktan sonra daha karmaşık iş akışları ve sistemler arası entegrasyonlar için [Corner Group'un strateji ve otomasyon tarafındaki çalışmaları](https://cornergroup.co) iyi bir örnek oluşturabilir.

## Adım 6: Pilot aktarım yapın

Tüm veriyi bir anda yüklemeyin. Önce 50-100 kayıtlık bir örnekle deneme yapın. Bu örnekte farklı senaryolar bulunsun: birden fazla kişisi olan bir firma, birden fazla fırsatı olan bir firma, kaybedilmiş bir fırsat, notları uzun bir kayıt.

Pilot aktarımda şunları kontrol edin:

- Firma, kişi ve fırsat kayıtları birbirine doğru bağlandı mı?
- Türkçe karakterler (ş, ğ, ı, İ, ç, ö, ü) bozulmadan aktarıldı mı? CSV dosyasını UTF-8 olarak kaydetmek bu sorunun çoğunu çözer.
- Tarihler doğru okundu mu? Gün/ay sıralamasının ters okunması sık görülen bir hatadır.
- Tutarlar doğru para birimiyle ve doğru ondalık ayracıyla geldi mi? Türkçe Excel'de virgül, birçok sistemde nokta ondalık ayracıdır; 250.000 TL'nin 250 TL'ye dönüşmesi gibi hatalar burada yakalanır.
- Açılır liste değerleri eşleşti mi, yoksa sistem yeni ve tutarsız değerler mi oluşturdu?

Pilot sonuçlarını iki temsilciye gösterin ve "kendi müşterini bul, geçmişini oku, bir görev oluştur" deyin. Temsilcinin sistemi gerçek bir müşteriyle kullanırken takıldığı yerler, sizin kontrol listenizde olmayan sorunları ortaya çıkarır.

Sorunları düzeltin, gerekirse ikinci bir pilot yapın, ardından tam aktarıma geçin. Tam aktarımı genellikle şu sırayla yaparsınız: önce firmalar, sonra kişiler, sonra fırsatlar, en son aktiviteler ve notlar. Bu sıra, kayıtlar arası bağlantıların kopmamasını sağlar.

## Adım 7: Ekibi eğitin ve geçiş gününü belirleyin

Teknik olarak kusursuz bir aktarım bile ekip sistemi kullanmazsa işe yaramaz. Eğitimi "CRM'in tüm özellikleri" üzerine değil, **temsilcinin günlük işi** üzerine kurun.

Etkili bir eğitim programı genellikle şöyle görünür:

1. **İlk oturum (60-90 dakika):** Neden geçiş yapıyoruz, temsilciye ne kazandıracak, temel ekranlar ve gezinme.
2. **Uygulamalı oturum (90 dakika):** Herkes kendi gerçek müşterileriyle çalışır. Yeni fırsat açma, aşama güncelleme, arama notu girme, görev oluşturma, e-postayı kayda bağlama.
3. **Yönetici oturumu (60 dakika):** Raporlar, pano, pipeline toplantısının CRM üzerinden nasıl yapılacağı.
4. **Kısa başvuru dokümanı:** Tek sayfalık bir "bunu yaparken şunu kullan" rehberi.

Ardından net bir **geçiş günü** belirleyin. Bu tarihten sonra Excel dosyaları salt okunur hâle getirilir ve arşive kaldırılır. İki sistemi paralel olarak yürütmek kulağa güvenli gelir ama pratikte ekibi Excel'de tutar ve CRM'deki veri hızla eskir. Paralel dönem şartsa bile 1-2 haftayı geçmemeli.

Bu noktada liderlik örneği belirleyicidir. Yönetici pipeline toplantısını hâlâ Excel çıktısı üzerinden yapıyorsa ekip CRM'i ciddiye almaz. **CRM'de olmayan fırsat, toplantıda konuşulmaz** kuralı, aylarca süren ikna çabasından daha etkilidir.

## Adım 8: İlk 30-60-90 günü yönetin

Geçiş günü bitiş çizgisi değil, başlangıç çizgisidir. İlk üç ay boyunca sistemi aktif olarak izlemeniz gerekir.

**İlk 30 gün:**
- Her gün 10 dakika ayırıp yeni kayıtların doğru girilip girilmediğine bakın.
- Haftalık kısa bir "takıldığınız yer var mı?" toplantısı yapın.
- Görevi gecikmiş ve aşaması güncellenmemiş fırsatları birebir takip edin.

**30-60 gün:**
- Kullanılmayan alanları belirleyin ve kaldırın. Hiç kimsenin doldurmadığı bir alan ya gereksizdir ya da yanlış tasarlanmıştır.
- İlk otomasyonların işe yarayıp yaramadığını değerlendirin.
- Haftalık pipeline toplantısını tamamen CRM panosu üzerinden yapmaya başlayın.

**60-90 gün:**
- Aşama dönüşüm oranlarına ilk kez anlamlı veriyle bakın. Fırsatların hangi aşamada en çok beklediğini, en çok nerede kaybedildiğini görün.
- CRM verisine dayanan ilk satış tahmininizi yapın. Bu konuda yol gösterici olması için [pratik satış tahmini rehberine](/blog/satis-tahmini-forecast-nasil-yapilir) göz atabilirsiniz.
- Yeni katılan temsilcilerin onboarding sürecine CRM eğitimini kalıcı olarak ekleyin.

Bu dönemde kullanım oranı düşükse sorun genellikle eğitimden değil, sistemin temsilciye değil sadece yöneticiye fayda sağlamasından kaynaklanır. Ekip CRM'e direnç gösteriyorsa nedenleri ve çözümleri [satış ekibinin CRM'i neden kullanmadığını incelediğim yazıda](/blog/satis-ekibi-crmi-kullanmiyor) bulabilirsiniz.

## Geçiş ne kadar sürer?

5-10 kişilik bir B2B satış ekibi için gerçekçi bir zaman planı şöyle görünür:

- **1. hafta:** Hedeflerin belirlenmesi, dosya envanteri
- **2. hafta:** Satış süreci, aşamalar ve veri modeli tasarımı
- **3-4. hafta:** Veri temizliği ve birleştirme, paralelde CRM seçimi
- **5. hafta:** Temel kurulum, pilot aktarım
- **6. hafta:** Tam aktarım, eğitim, geçiş günü
- **7-18. hafta:** 30-60-90 günlük takip dönemi

Kayıt sayısı azsa ve süreç zaten netse bu süre 3-4 haftaya inebilir. Birden fazla şube, ürün grubu ya da para birimiyle çalışan ekiplerde 10-12 haftayı bulabilir. En çok gecikme, Adım 2'de aşamalar üzerinde uzlaşılamadığında ve Adım 4'te veri temizliği hafife alındığında yaşanır.

## Maliyeti ne kadar?

CRM geçişinin maliyetini yalnızca lisans ücreti olarak düşünmek yaygın bir hatadır. Toplam maliyeti üç kalemde değerlendirin:

1. **Lisans maliyeti:** Çoğu CRM kullanıcı başına aylık ücretlendirilir. Ücretsiz katmanlar küçük ekipler için başlangıçta yeterli olabilir ama otomasyon, gelişmiş raporlama ve entegrasyonlar genellikle ücretli paketlerdedir. Seçim yaparken bugünkü ekip büyüklüğüne değil, 12-18 ay sonraki büyüklüğe göre hesap yapın.
2. **İç zaman maliyeti:** Geçiş sorumlusunun 4-6 hafta boyunca zamanının önemli bir kısmını bu işe ayırması, temsilcilerin eğitim ve veri kontrolüne harcadığı saatler. Örneğin 6 kişilik bir ekipte her temsilci geçiş sürecinde toplam 6-8 saat harcarsa bu yaklaşık 40-50 saatlik bir satış zamanı demektir.
3. **Dış destek maliyeti (opsiyonel):** Karmaşık veri yapıları, özel entegrasyonlar veya zaman baskısı varsa bir danışman ya da CRM uygulama ortağıyla çalışmak gerekebilir.

Karşı tarafta ise kazanımlar var: raporlamaya harcanan sürenin azalması, takip edilmeden kaybolan fırsatların önlenmesi, temsilci değişikliklerinde müşteri geçmişinin korunması. Unutulan tek bir orta ölçekli fırsatın değeri, çoğu küçük ekip için bir yıllık CRM lisansını karşılar.

## En sık yapılan hatalar

Geçiş süreçlerinde tekrar tekrar karşılaşılan hatalar şunlar:

- **Excel'i olduğu gibi kopyalamak:** Excel'deki her sütunu CRM'de bir alana dönüştürmek, karmaşayı yeni bir sisteme taşımaktır.
- **Süreç tanımlamadan yazılım seçmek:** Demo sırasında etkileyici görünen özellikler, sizin sürecinize uymuyorsa hiçbir işe yaramaz.
- **Veriyi temizlemeden yüklemek:** "Önce yükleyelim, sonra düzeltiriz" denen veri genellikle hiç düzeltilmez.
- **Çok fazla zorunlu alan:** Her yeni fırsat için 15 alan doldurmak zorunda olan temsilci ya fırsatı girmez ya da alanları rastgele doldurur.
- **Paralel sistemi uzun süre yaşatmak:** Excel açık kaldıkça ekip ona geri döner.
- **Yöneticinin CRM'i kullanmaması:** Raporları hâlâ Excel'den isteyen yönetici, CRM'in gereksiz olduğu mesajını verir.
- **Geçişi tamamlanmış saymak:** İlk 90 günlük takip yapılmazsa sistem birkaç ay içinde bozulmaya başlar.

## Sık sorulan sorular

### Excel'deki tüm eski veriyi CRM'e taşımak zorunda mıyım?

Hayır, taşımamanız çoğu zaman daha iyidir. Aktif müşterileri, açık fırsatları ve son 12-24 ayda temas kurulmuş adayları taşıyın. Daha eski ve eksik kayıtları Excel arşivinde salt okunur olarak saklamak hem CRM'i temiz tutar hem de gerektiğinde eski bilgiye ulaşmanızı sağlar.

### Excel'den CRM'e geçiş ne kadar sürer?

5-10 kişilik bir B2B satış ekibi için hazırlık, temizlik, aktarım ve eğitim dahil genellikle 4-8 hafta sürer. Bunun ardından sistemin oturması için 90 günlük bir takip dönemi planlamak gerekir. En uzun süren kalemler genellikle satış aşamalarının tanımlanması ve veri temizliğidir.

### Geçiş sırasında Excel ve CRM'i paralel kullanmalı mıyız?

Kısa bir paralel dönem (1-2 hafta) güven verebilir ama bundan uzunu zararlıdır. İki sistem aynı anda açık kaldığında ekip alışkın olduğu Excel'e döner ve CRM'deki veri hızla eskir. Net bir geçiş günü belirleyip Excel dosyalarını bu tarihten sonra salt okunur hâle getirmek en sağlıklı yoldur.

### Satış ekibi CRM'e geçişe direnç gösterirse ne yapmalıyım?

Önce sistemin temsilciye ne kazandırdığını somut olarak gösterin: otomatik takip görevleri, tek ekranda müşteri geçmişi, rapor hazırlama angaryasının ortadan kalkması gibi. Zorunlu alanları azaltın, eğitimi temsilcilerin gerçek müşterileri üzerinden yapın ve pipeline toplantılarını yalnızca CRM verisiyle yürütün. Yöneticinin sistemi aktif kullanması, direnci kırmanın en etkili yoludur.

## Sonuç

Excel'den CRM'e geçiş, doğru sırayla yapıldığında satış ekibinin çalışma biçimini kalıcı olarak iyileştirir. Sıra şu: hedefleri belirleyin, mevcut dosyaların envanterini çıkarın, satış sürecini ve aşamaları tanımlayın, veri modelini kurun, veriyi temizleyin, ardından CRM'i seçip pilot aktarımla ilerleyin. Ekibi gerçek işleri üzerinden eğitin, net bir geçiş günü belirleyin ve ilk 90 günü yakından takip edin.

En önemli nokta şu: CRM, Excel'deki düzensizliği kendiliğinden çözmez. Çözen şey, geçiş sırasında verdiğiniz süreç ve veri kararlarıdır. Yazılım bu kararları görünür ve sürdürülebilir kılar.

Ekibinizi Excel'den CRM'e taşımayı planlıyorsanız ya da geçiş yaptığınız hâlde sistemin bir türlü oturmadığını düşünüyorsanız deneyimlerimi paylaşmaktan memnuniyet duyarım. [Berkay Yalçın](/tr) sayfası üzerinden benimle iletişime geçebilirsiniz.
