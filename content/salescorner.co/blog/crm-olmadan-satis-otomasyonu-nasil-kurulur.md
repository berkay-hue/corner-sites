---
title: "CRM Olmadan Satış Otomasyonu Nasıl Kurulur? KOBİ Rehberi"
description: "Henüz CRM kullanmayan Türk KOBİ'ler için Google Sheets, e-posta ve n8n ile satış otomasyonunun adım adım nasıl kurulacağını ve sınırlarını anlatıyoruz."
date: "2026-11-17"
category: "Satış Otomasyonu"
image: "https://images.pexels.com/photos/7792748/pexels-photo-7792748.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "CRM Olmadan Satış Otomasyonu Nasıl Kurulur? KOBİ Rehberi"
alt: "sales-automation-without-crm"
---

Evet, CRM satın almadan da işe yarayan bir satış otomasyonu kurabilirsiniz. Bunun için **tek bir paylaşılan tablo** (Google Sheets veya Airtable), **bir otomasyon motoru** (n8n, Make veya Zapier) ve hâlihazırda kullandığınız **e-posta, takvim ve form araçları** yeterlidir. 3 ila 10 kişilik satış ekibi olan, aylık birkaç yüz lead'i yöneten bir KOBİ, bu yapıyla lead toplama, atama, takip hatırlatmaları ve temel raporlamayı birkaç hafta içinde otomatik hale getirebilir.

Bu rehberde CRM'siz bir satış otomasyonunun hangi parçalardan oluştuğunu, adım adım nasıl kurulduğunu, tipik bir KOBİ senaryosunda nasıl çalıştığını ve ne zaman gerçek bir CRM'e geçmeniz gerektiğini anlatıyoruz. Amaç, "önce CRM alalım, sonra düşünürüz" döngüsüne girmeden satış sürecinizi bugünden düzene sokmak.

## CRM olmadan satış otomasyonu gerçekten mümkün mü?

Pek çok KOBİ yöneticisi satış otomasyonunu CRM ile aynı şey sanıyor. Oysa ikisi farklı işlere yarar. CRM, müşteri ve fırsat bilgisini sakladığınız bir **kayıt sistemidir**. Satış otomasyonu ise bu kayıtlar üzerinde tekrarlayan işleri insan müdahalesi olmadan yürüten **iş akışlarının** bütünüdür. Bu ayrımı daha ayrıntılı merak ediyorsanız [CRM ile satış otomasyonu arasındaki farkı anlattığımız yazıya](/blog/crm-ile-satis-otomasyonu-farki-nedir) göz atabilirsiniz.

Otomasyonun ihtiyaç duyduğu şey, verinin düzenli ve erişilebilir bir yerde durmasıdır. İyi tasarlanmış bir Google Sheets veya Airtable tablosu bu ihtiyacı küçük ölçekte rahatça karşılar. Otomasyon motoru tabloyu okur, günceller ve tetikleyicilere göre e-posta gönderir, bildirim yollar ya da görev oluşturur.

CRM'siz yapının üç belirgin avantajı vardır:

- **Hızlı başlangıç:** Lisans görüşmesi, uzun kurulum projesi ve veri taşıma süreci yoktur. İlk iş akışı birkaç gün içinde çalışır.
- **Düşük maliyet:** Çoğu araç ücretsiz katmanla başlar. Kullanıcı başı lisans ödemezsiniz.
- **Süreci önce tanıma fırsatı:** CRM'e geçmeden önce satış sürecinizin gerçekte nasıl işlediğini görürsünüz. Böylece ileride CRM'i "boş bir kutu" olarak değil, oturmuş bir sürecin aracı olarak kurarsınız.

Elbette bu yaklaşımın sınırları da var. Onlara aşağıda ayrıca değineceğiz.

## Bu yaklaşım hangi KOBİ'ler için mantıklı?

Her şirket için doğru cevap aynı değildir. Aşağıdaki tablo kabaca bir yol haritası verir:

**CRM'siz otomasyon için uygun profil:**
- Satış ekibi 1 ila 10 kişi arasında
- Aylık yeni lead sayısı birkaç yüzü geçmiyor
- Satış süreci 4 ila 7 aşamadan oluşuyor ve görece basit
- Şirkette en az bir kişi tablolar ve temel mantık kurallarıyla rahat çalışabiliyor
- Hâlâ "satış sürecimiz tam olarak ne?" sorusuna net cevap aranıyor

**Doğrudan CRM'e geçmesi daha doğru olan profil:**
- 15 kişiyi aşan satış ekibi ve farklı bölgeler veya ürün grupları
- Uzun ve çok paydaşlı satış döngüleri (bir fırsatta 5 ila 10 karar verici)
- Yoğun yetki ayrımı ihtiyacı (kim hangi müşteriyi görebilir?)
- Muhasebe, ERP veya müşteri hizmetleriyle sıkı entegrasyon şartı

Ortadaki bir firmaysanız hibrit yol da mümkündür: otomasyon katmanını şimdi kurar, veriyi tabloda tutarsınız. CRM'e geçtiğinizde yalnızca "veri kaynağı" katmanını değiştirirsiniz.

## CRM'siz satış otomasyonunun dört katmanı

Sağlam bir yapı kurmak için sistemi dört katmanda düşünmek işinizi kolaylaştırır:

1. **Veri girişi katmanı:** Web formu, LinkedIn mesajları, fuar kartvizitleri, gelen e-postalar, telefon görüşmeleri ve outbound lead listeleri.
2. **Veri merkezi (tek gerçek kaynak):** Tüm lead ve fırsatların toplandığı ana tablo. Google Sheets basit ve ücretsizdir. Airtable ise ilişkili tablolar, görünümler ve alan tipleri sayesinde CRM'e daha yakın bir deneyim sunar.
3. **Otomasyon motoru:** n8n, Make veya Zapier. Tetikleyicileri dinler ve aksiyonları yürütür. Teknik kapasiteniz varsa n8n'i kendi sunucunuzda çalıştırmak hem maliyet hem veri kontrolü açısından avantaj sağlar. Bu konuda [n8n ile B2B satış otomasyonuna başlangıç rehberimiz](/blog/n8n-ile-b2b-satis-otomasyonu-rehberi) iyi bir başlangıç noktasıdır.
4. **İletişim ve görev katmanı:** Gmail veya Outlook, Google Calendar, Slack veya Microsoft Teams, gerekiyorsa WhatsApp Business ve bir e-posta dizisi aracı.

Bu katmanları birbirinden ayırmanın en büyük faydası değiştirilebilirliktir. Yarın Google Sheets'ten Airtable'a ya da bir CRM'e geçtiğinizde iş akışlarının mantığı aynı kalır. Yalnızca bağlantı noktalarını güncellersiniz.

## Adım adım kurulum

### 1. Satış sürecini kâğıda dökün

Herhangi bir araç açmadan önce sürecinizi yazın. Bir lead nereden gelir? İlk temas ne zaman ve kim tarafından kurulur? Hangi aşamalardan geçer? Hangi noktada "kayıp" sayılır?

Tipik bir KOBİ için 6 aşamalı bir yapı yeterlidir:

1. Yeni lead
2. İlk temas kuruldu
3. İhtiyaç analizi yapıldı
4. Teklif gönderildi
5. Pazarlık / karar aşaması
6. Kazanıldı / Kaybedildi

Her aşama için **giriş kriterini** yazın. Örneğin "Teklif gönderildi" aşamasına geçmek için teklif PDF'inin müşteriye e-postayla iletilmiş olması gerekir. Bu kriterler, ileride otomasyonun hangi olayda tetikleneceğini belirler.

Aynı adımda, hangi işlerin en çok vakit aldığını da listeleyin. Her şeyi aynı anda otomatikleştirmeye çalışmak yerine en çok tekrar eden 2-3 işle başlamak en sağlıklı yoldur. Önceliklendirme konusunda [satış otomasyonuna hangi süreçlerden başlanması gerektiğini](/blog/satis-otomasyonu-nereden-baslamali) ayrıca ele aldık.

### 2. Ana tabloyu tasarlayın

Tablonuz sistemin kalbidir. Kötü tasarlanmış bir tablo, en iyi otomasyonu bile çöpe çevirir. Önerdiğimiz minimum sütun seti:

- **Lead ID** (otomatik üretilen benzersiz kod, ör. L-2024-0153)
- **Kayıt tarihi**
- **Kaynak** (web formu, fuar, outbound, referans, LinkedIn vb., açılır liste olarak)
- **Firma adı**
- **Sektör**
- **Çalışan sayısı aralığı**
- **Kişi adı soyadı**
- **Unvan**
- **E-posta**
- **Telefon**
- **İletişim izni** (evet/hayır, izin tarihi)
- **Atanan temsilci**
- **Aşama** (açılır liste)
- **Aşama değişiklik tarihi**
- **Sonraki aksiyon** ve **sonraki aksiyon tarihi**
- **Tahmini tutar**
- **Kayıp nedeni** (açılır liste)
- **Notlar**

Üç kurala mutlaka uyun:

- **Serbest metin yerine açılır liste kullanın.** "İstanbul", "istanbul", "İst." gibi varyasyonlar raporlamayı bozar.
- **Her satır bir lead olsun.** Aynı firmadan iki kişi varsa iki satır açın ve firma adını tutarlı yazın.
- **Tarihleri tarih formatında tutun.** Otomasyonların "3 gündür hareket yok" gibi kuralları ancak böyle çalışır.

Airtable kullanıyorsanız "Firmalar" ve "Kişiler" için ayrı tablolar açıp birbirine bağlayabilirsiniz. Bu, CRM'deki hesap-kişi ilişkisinin sade bir karşılığıdır.

### 3. Lead girişini otomatikleştirin

Manuel veri girişi, CRM'siz sistemlerin en zayıf halkasıdır. Mümkün olan her kanalı doğrudan tabloya bağlayın:

- **Web formu:** Typeform, Google Forms, Tally veya sitenizdeki form, webhook ile n8n'e veri gönderir. n8n veriyi temizler (büyük-küçük harf, telefon formatı) ve tabloya yeni satır ekler.
- **Gelen e-postalar:** satis@ gibi bir ortak adrese gelen e-postalar için bir iş akışı kurun. Göndereni ve konuyu tabloya ekleyin, "Kaynak" alanını "Gelen e-posta" olarak işaretleyin.
- **Fuar kartvizitleri:** Telefonla kartvizit fotoğrafı çekip bir klasöre yükleyin. Bir yapay zeka adımı görseldeki bilgileri ayrıştırır ve tabloya yazar. Çıktıyı bir kişinin hızlıca kontrol etmesi yeterlidir.
- **Outbound listeler:** Hedef firma ve karar verici listelerini bir prospecting aracından dışa aktarıp tabloya aktarabilirsiniz. Örneğin [Apollo.io](https://get.apollo.io/679irkzm35ya) üzerinden sektör, şirket büyüklüğü ve unvana göre filtrelenmiş listeler hazırlayıp düzenli aralıklarla tabloya çekmek mümkündür.

Her girişte iki kontrol ekleyin: **mükerrer kayıt kontrolü** (aynı e-posta tabloda var mı?) ve **zorunlu alan kontrolü** (e-posta veya telefon olmadan kayıt açılmasın). Bu iki adım, ileride saatlerce sürecek temizlik işini baştan önler.

Kendi ekibinizle outbound lead üretmeye zaman ayıramıyorsanız bu katmanı dışarıdan da çözebilirsiniz. Özellikle yazılım şirketleri için [SAAS Corner'ın B2B SaaS odaklı outbound ve lead generation hizmeti](https://saascorner.co) bu işi uçtan uca üstlenir.

### 4. Lead atama ve anlık bildirim kurun

Yeni bir lead tabloya düştüğünde kimin ilgileneceği belli olmalı. Atama kuralları basit tutulabilir:

- **Sıralı dağıtım (round-robin):** Lead'ler temsilcilere sırayla atanır.
- **Bölge bazlı:** Marmara'dan gelenler A temsilcisine, Ege'den gelenler B temsilcisine gider.
- **Sektör bazlı:** Gıda sektörü bir kişide, otomotiv başka bir kişide toplanır.
- **Büyüklük bazlı:** 250 üzeri çalışanı olan firmalar kıdemli temsilciye gider.

n8n'de bu mantık birkaç "IF" veya "Switch" düğümüyle kurulur. Atama yapıldıktan sonra temsilciye Slack, Teams veya e-posta üzerinden şu formatta bir bildirim gider:

> Yeni lead: Örnek Makine A.Ş. (Gebze, 80 çalışan). Kişi: Satın Alma Müdürü. Kaynak: Web formu. İlk temas için son süre: bugün 17:00.

Kuralların nasıl tasarlanacağını ve hangi durumlarda hangi modelin işe yaradığını [lead atama kurallarını adım adım anlattığımız rehberde](/blog/lead-atama-kurallari-nasil-kurulur-adim-adim-rehber) bulabilirsiniz.

### 5. Takip hatırlatmalarını ve e-posta dizilerini kurun

KOBİ'lerde fırsat kaybının en yaygın nedeni, kötü bir teklif değil, **unutulan takiptir**. Otomasyonun en hızlı geri dönüş sağladığı alan da budur.

Önerilen hatırlatma kuralları:

- **İlk temas kuralı:** Lead atandıktan sonra 4 iş saati içinde aşama "İlk temas kuruldu" olarak güncellenmediyse temsilciye hatırlatma, 24 saat sonra satış yöneticisine bildirim gider.
- **Hareketsizlik kuralı:** Herhangi bir fırsatın "Aşama değişiklik tarihi" 10 günü geçtiyse temsilciye "Bu fırsatta son durum nedir?" sorusu iletilir.
- **Sonraki aksiyon kuralı:** "Sonraki aksiyon tarihi" bugün olan tüm satırlar her sabah 08:30'da temsilciye liste halinde e-postayla gönderilir.
- **Teklif takip kuralı:** Teklif gönderildikten 3 gün sonra temsilciye arama hatırlatması, 7 gün sonra hâlâ hareket yoksa ikinci takip e-postası taslağı hazırlanır.

E-posta dizileri için iki seçeneğiniz var. Birincisi, n8n ile Gmail veya Outlook üzerinden zamanlanmış e-postalar göndermek. İkincisi, bu iş için tasarlanmış bir e-posta dizisi aracı kullanıp sonuçları (açılma, yanıt) tabloya geri yazdırmak. Her iki durumda da **yanıt geldiğinde dizinin otomatik durması** kritik bir kuraldır. Müşteri cevap verdikten sonra "Size tekrar ulaşmak istedim" e-postası almak güven kaybettirir.

WhatsApp'ı da takip kanalı olarak düşünüyorsanız önce yasal çerçeveyi netleştirin. Ticari ileti izni olmayan kişilere mesaj göndermek ciddi risk taşır. Bu konuyu [WhatsApp ile B2B satışta ticari ileti izninin nasıl alınacağını anlattığımız yazıda](/blog/whatsapp-b2b-satis-ticari-ileti-izni) detaylandırdık. Tablonuzdaki "İletişim izni" sütunu da tam olarak bu yüzden var: otomasyon, izni olmayan satırları WhatsApp ve pazarlama e-postası akışlarına hiç sokmamalıdır.

### 6. Aşama geçişlerine bağlı aksiyonlar ekleyin

Tablodaki "Aşama" sütunu değiştiğinde farklı aksiyonlar tetiklenebilir:

- **"İhtiyaç analizi yapıldı" olduğunda:** Temsilciye teklif şablonunu içeren bir Google Docs kopyası otomatik oluşturulur ve firma bilgileri şablona doldurulur.
- **"Teklif gönderildi" olduğunda:** Satış yöneticisine bilgi gider, teklif takip zamanlayıcısı başlar.
- **"Kazanıldı" olduğunda:** Muhasebe veya operasyon ekibine yeni müşteri bildirimi gider, müşteriye hoş geldiniz e-postası taslağı hazırlanır.
- **"Kaybedildi" olduğunda:** "Kayıp nedeni" alanı boşsa temsilciden bu alanı doldurması istenir. 90 gün sonra yeniden temas için bir hatırlatma oluşturulur.

Bu noktada yapay zekayı da devreye alabilirsiniz. Örneğin ihtiyaç analizi notlarından teklif metninin ilk taslağını üretmek veya bir görüşme notunu özetleyip "Notlar" sütununa yazmak, temsilcilere gün içinde ciddi zaman kazandırır.

### 7. Basit ama düzenli raporlama kurun

CRM'siz yapının en çok eleştirilen yanı raporlamadır, ama doğru kurulursa bu sorun büyük ölçüde çözülür. Ana tablodan beslenen ayrı bir "Rapor" sekmesi veya Looker Studio panosu oluşturun. Takip etmeniz gereken minimum göstergeler:

- Kaynak bazında haftalık yeni lead sayısı
- Aşama bazında açık fırsat sayısı ve toplam tahmini tutar
- Ortalama ilk temas süresi (saat cinsinden)
- Aşamadan aşamaya dönüşüm oranları
- Temsilci bazında açık fırsat ve kazanılan iş sayısı
- En sık görülen 3 kayıp nedeni

Her pazartesi sabahı bu özet otomatik olarak yöneticinin e-postasına gelsin. Böylece haftalık satış toplantısı, "Kimde ne var?" sorusuyla değil, rakamlar üzerinden başlar.

## Örnek senaryo: 6 kişilik bir endüstriyel ekipman firması

Somutlaştırmak için kurgusal ama gerçekçi bir senaryo düşünelim. Bursa'da endüstriyel kompresör satan bir KOBİ: 4 saha satış temsilcisi, 1 iç satış uzmanı ve 1 satış müdürü var. Lead'ler web formu, fuarlar, bayi yönlendirmeleri ve telefonla geliyor. Bugüne kadar herkes kendi Excel dosyasını tutuyor, takipler temsilcinin hafızasına kalıyor.

**Kurulan yapı:**

- Tek bir Airtable tabanı: "Firmalar", "Kişiler" ve "Fırsatlar" tabloları
- Kendi sunucusunda çalışan n8n üzerinde 7 iş akışı:
  1. Web formundan tabloya kayıt ve mükerrer kontrolü
  2. Fuar kartviziti fotoğrafından kayıt oluşturma
  3. Bölgeye göre lead atama ve Teams bildirimi
  4. Her sabah 08:30'da kişisel günlük aksiyon listesi
  5. 10 gün hareketsiz kalan fırsatlar için uyarı
  6. Teklif sonrası 3. ve 7. gün takip hatırlatmaları
  7. Pazartesi sabahı yönetici özeti
- Teklifler için Google Docs şablonu ve aşama değişince otomatik kopya oluşturma

**Kurulum süreci:** İlk hafta süreç haritası çıkarıldı ve tablo tasarlandı. İkinci hafta mevcut Excel dosyaları temizlenip tek tabloda birleştirildi. Üçüncü ve dördüncü haftalarda iş akışları sırayla devreye alındı. Her iş akışı önce bir temsilciyle bir hafta test edildi, sonra tüm ekibe açıldı.

**Ne değişti?** İlk temas süresi artık tahmin değil, ölçülen bir rakam. Satış müdürü hangi fırsatın kimde ve hangi aşamada beklediğini tek ekrandan görüyor. Teklif sonrası takipler sistematik hale geldi. Temsilcilerin her sabah "Bugün kimi aramalıyım?" diye düşünmesine gerek kalmadı. Bu tür bir yapıda kazanılan en değerli şey çoğu zaman tek tek otomasyonlar değil, **satış sürecinin ilk kez görünür hale gelmesidir**.

## Maliyeti ne kadar?

CRM'siz otomasyonun maliyeti üç kalemden oluşur:

- **Araç maliyeti:** Google Sheets ücretsizdir. Airtable, n8n bulut, Make ve Zapier'ın ücretsiz veya düşük ücretli başlangıç katmanları vardır. n8n'i kendi sunucunuzda çalıştırırsanız maliyet çoğunlukla küçük bir sanal sunucu ücretiyle sınırlı kalır. Toplam araç maliyeti, küçük bir ekip için çoğu zaman tek bir CRM'in birkaç kullanıcı lisansından daha düşüktür.
- **Kurulum emeği:** Basit bir yapı (3-4 iş akışı) için şirket içinde yetkin biri birkaç hafta içinde sonuç alabilir. Daha kapsamlı yapılar (7-10 iş akışı, yapay zeka adımları, raporlama panosu) dışarıdan destekle genellikle 3 ila 6 hafta sürer.
- **Bakım:** Ayda birkaç saatlik kontrol ve küçük düzenlemeler. Otomasyonlar "kur ve unut" değildir. Bir form alanı değiştiğinde veya yeni bir temsilci katıldığında güncelleme gerekir.

Türkiye koşullarında kalem kalem bütçe planlamak isterseniz [satış otomasyonu maliyetini gerçek rakamlarla ele aldığımız rehbere](/blog/satis-otomasyonu-maliyeti-turkiye) göz atabilirsiniz.

## En sık yapılan hatalar nelerdir?

CRM'siz otomasyon projelerinde aynı hatalar tekrar tekrar karşımıza çıkıyor:

- **Birden fazla "ana" tablo:** Temsilciler kendi dosyalarını tutmaya devam ederse sistem çöker. Tek gerçek kaynak kuralı tartışmaya açık olmamalı.
- **Tablo yapısını sık değiştirmek:** Sütun adı veya sırası değiştiğinde iş akışları bozulabilir. Yapı değişikliklerini tek bir sorumlu kişi yapmalı ve her değişiklikten sonra akışlar test edilmeli.
- **Her şeyi aynı anda otomatikleştirmek:** 15 iş akışını aynı hafta devreye almak, hangisinin sorun çıkardığını bulmayı imkânsızlaştırır. Birer birer ilerleyin.
- **Hata bildirimini unutmak:** Bir iş akışı sessizce durursa haftalarca fark edilmeyebilir. Her kritik akışa "hata olursa yöneticiye bildir" adımı ekleyin.
- **Erişim yetkilerini ihmal etmek:** Paylaşılan tablolar kolayca yanlış kişiyle paylaşılabilir. Müşteri verisi içeren tabloları yalnızca ilgili kişilere açın, düzenleme ve görüntüleme yetkilerini ayırın. KVKK açısından da kişisel verilerin nerede ve nasıl tutulduğunu bilmek zorundasınız.
- **Ekibi sürece katmamak:** Temsilciler sistemi "yönetimin kontrol aracı" olarak görürse veri girmezler. Otomasyonun onların işini nasıl kolaylaştırdığını (sabah listesi, otomatik teklif taslağı) ilk günden gösterin.

## Ne zaman CRM'e geçmelisiniz?

CRM'siz yapı bir başlangıçtır, kalıcı bir çözüm olmak zorunda değildir. Aşağıdaki işaretlerden ikisi veya daha fazlası görünüyorsa CRM'e geçişi planlamanın zamanı gelmiştir:

- Tablodaki satır sayısı performansı etkilemeye başladı, sayfa yavaş açılıyor.
- Satış ekibi 10-12 kişiyi geçti ve farklı yetki seviyeleri gerekiyor.
- Bir fırsatta çok sayıda kişi, aktivite ve belge izlemek zorlaşıyor.
- E-posta ve görüşme geçmişinin fırsatla otomatik ilişkilendirilmesi kritik hale geldi.
- İş akışı sayısı 15-20'yi geçti ve bakımı ciddi zaman almaya başladı.
- Satış tahmini ve gelişmiş raporlama, yönetimin temel ihtiyacı haline geldi.

İyi haber şu: Katmanlı bir yapı kurduysanız geçiş çok daha kolay olur. Tablonuzda temiz, standart alanlarla tuttuğunuz veri doğrudan CRM'e aktarılır. İş akışlarınızın mantığı da yeni sisteme taşınır. Üstelik artık hangi alanlara, hangi aşamalara ve hangi raporlara ihtiyacınız olduğunu deneyimle biliyorsunuzdur. CRM seçimini de bu bilgiyle yaparsınız.

## Sık sorulan sorular

### Google Sheets mi Airtable mı tercih etmeliyim?

Ekibiniz küçükse ve süreç basitse Google Sheets yeterlidir, ücretsizdir ve herkes kullanmayı bilir. Firma, kişi ve fırsatları ayrı tablolarda ilişkilendirmek, farklı görünümler oluşturmak ve alan tiplerini daha sıkı kontrol etmek istiyorsanız Airtable daha iyi bir seçimdir. İleride CRM'e geçmeyi planlıyorsanız Airtable'ın ilişkisel yapısı geçişi kolaylaştırır.

### CRM'siz otomasyon için yazılım bilgisi gerekir mi?

n8n, Make ve Zapier gibi araçlar görsel arayüzle çalışır, bu yüzden kod yazmak zorunlu değildir. Yine de tablolar, koşullu mantık ve temel veri formatları konusunda rahat olan birinin projeyi sahiplenmesi gerekir. Daha karmaşık senaryolarda (API entegrasyonları, yapay zeka adımları) dışarıdan destek almak süreyi kısaltır.

### Paylaşılan tablolarda müşteri verisi tutmak güvenli mi?

Doğru yapılandırıldığında güvenli olabilir, ancak sorumluluk sizdedir. Erişimi yalnızca ilgili kişilere verin, düzenleme ve görüntüleme yetkilerini ayırın, ayrılan çalışanların erişimini hemen kaldırın ve iletişim izni bilgisini kayıt altında tutun. KVKK kapsamındaki yükümlülükler, verinin CRM'de ya da tabloda olmasından bağımsız olarak geçerlidir.

### Bu yapı kaç lead'e kadar sorunsuz çalışır?

Kesin bir sınır yoktur. Belirleyici olan, lead sayısından çok ekip büyüklüğü, iş akışı sayısı ve raporlama ihtiyacıdır. Tablo yavaşlamaya, iş akışlarının bakımı ciddi zaman almaya ve yetki yönetimi karmaşıklaşmaya başladığında CRM'e geçişi planlamak gerekir.

## Sonuç

CRM satın almak, satış otomasyonunun ön şartı değildir. Tek bir iyi tasarlanmış tablo, bir otomasyon motoru ve mevcut iletişim araçlarınızla lead toplama, atama, takip hatırlatmaları, teklif hazırlığı ve haftalık raporlamayı otomatik hale getirebilirsiniz. Başarının anahtarı araç seçiminden çok disiplindedir: tek gerçek kaynak, standart alanlar, adım adım devreye alınan iş akışları ve ekibin sürece gerçekten dahil edilmesi.

Bu yapı size iki şey kazandırır: bugünden daha az fırsat kaçıran bir satış ekibi ve yarın CRM'e geçtiğinizde ne istediğini bilen bir şirket. Satış sürecinizi CRM'e bağımlı kalmadan otomatikleştirmek ve doğru iş akışlarını birlikte tasarlamak isterseniz [Sales Corner ekibiyle bir görüşme planlayın](/iletisim). Mevcut sürecinizi birlikte inceleyip ilk otomasyonlarınızı hangi noktadan başlatacağınızı netleştirelim.
