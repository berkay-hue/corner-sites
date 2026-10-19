---
title: "B2B Lead Scoring Nasıl Yapılır? Adım Adım Model"
description: "B2B lead scoring modeli nasıl kurulur? Puanlama kriterleri, örnek tablo ve CRM'de uygulama adımlarıyla satış ekipleri için pratik rehber."
date: "2026-10-14"
updated: "2026-10-16"
category: "Lead Generation"
image: "https://images.pexels.com/photos/7876672/pexels-photo-7876672.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "B2B Lead Scoring Nasıl Yapılır? Adım Adım Model"
alt: "b2b-lead-scoring-model"
---
B2B lead scoring, her lead'e iki ayrı puan verilerek yapılır: şirketinize ne kadar uyduğunu gösteren fit skoru (sektör, şirket büyüklüğü, unvan) ve satın almaya ne kadar yakın olduğunu gösteren engagement skoru (e-posta yanıtı, site ziyareti, demo talebi). Puanlar eşik değerlerle gruplara ayrılır, CRM'de otomatikleştirilir ve gerçek sonuçlarla düzenli olarak kalibre edilir.

B2B satış ekiplerinin çoğu aynı sorunu yaşar: pipeline'da yüzlerce lead vardır ama satış temsilcilerinin günü sınırlıdır. Kime önce dönülecek, hangi lead'e bir hafta sonra yeniden temas edilecek, hangisi listeden tamamen çıkarılacak? Bu kararlar "içgüdüyle" verildiğinde en iyi fırsatlar soğur, ekip enerjisini satın alma niyeti olmayan kişilere harcar. **Lead scoring** bu kaosu sistematik bir önceliklendirmeye dönüştürür. Her lead'e, şirketinize ne kadar uygun olduğunu ve satın almaya ne kadar yakın olduğunu gösteren bir puan verir.

Bu yazıda sıfırdan bir B2B lead scoring modelinin nasıl kurulacağını adım adım anlatıyoruz. Hangi kriterlerin kullanılacağını, puanların nasıl dağıtılacağını, eşik değerlerin nasıl belirleneceğini ve modelin zamanla nasıl kalibre edileceğini somut örneklerle ele alacağız. Yazının sonunda kendi ekibinize uyarlayabileceğiniz uçtan uca bir örnek model de bulacaksınız.

## Lead Scoring Nedir ve B2B'de Neden Farklıdır?

Lead scoring, potansiyel müşterilere belirli kriterlere göre sayısal puan atayarak satış ekibinin önceliklendirme yapmasını sağlayan bir yöntemdir. Puan yükseldikçe lead'in hem ideal müşteri profiline uyduğu hem de satın alma sürecinde ilerlediği varsayılır.

B2C'de bu süreç görece basittir. Tek bir kişi karar verir ve satın alma döngüsü kısadır. B2B'de ise durum farklıdır:

- **Birden fazla karar verici vardır.** Bir yazılım alımında son kullanıcı, departman yöneticisi, IT ve satın alma ekibi aynı anda devrededir.
- **Satış döngüsü uzundur.** İlk temastan imzaya kadar haftalar, hatta aylar geçebilir.
- **Şirket uyumu, kişi uyumu kadar önemlidir.** Çok ilgili bir kişi, size uygun olmayan bir şirkette çalışıyorsa o lead'in değeri düşüktür.
- **Sinyaller dağınıktır.** Web sitesi ziyareti, e-posta yanıtı, LinkedIn etkileşimi ve demo talebi farklı kanallardan gelir.

Bu nedenle iyi bir B2B lead scoring modeli iki boyutu ayrı ayrı ölçer:

1. **Fit (uyum) skoru:** Bu şirket ve bu kişi, ideal müşterimize ne kadar benziyor?
2. **Engagement (ilgi/niyet) skoru:** Bu lead bizimle ne kadar etkileşime giriyor ve satın alma sinyali veriyor mu?

Bu iki boyutu tek bir sayıda eritmek yerine ayrı tutmak, yazının ilerleyen bölümlerinde göreceğiniz gibi çok daha doğru kararlar almanızı sağlar.

## Başlamadan Önce: Üç Temel Hazırlık

Puanlama kriterlerine geçmeden önce üç konuyu netleştirmeniz gerekir. Bunlar atlandığında en sofistike model bile yanlış sonuç üretir.

### Satış ve pazarlama arasında ortak dil

"Nitelikli lead" kavramı pazarlama ekibi için bir e-kitap indiren kişi, satış ekibi için ise bütçesi ve zaman planı belli bir karar verici olabilir. Modeli kurmadan önce iki ekip bir araya gelip **MQL (Marketing Qualified Lead)** ve **SQL (Sales Qualified Lead)** tanımları üzerinde yazılı olarak anlaşmalıdır.

### Pipeline aşamalarının net olması

Lead scoring, pipeline'ın giriş kapısıdır. Bir lead belirli bir puana ulaştığında hangi aşamaya geçeceği, kimin sorumluluğuna devredileceği ve bu geçişin nasıl kaydedileceği önceden tanımlanmış olmalıdır. Bu konuda henüz net bir yapınız yoksa [satış pipeline aşamalarının nasıl tanımlanacağını örneklerle anlattığımız rehbere](/blog/satis-pipeline-asamalari-nasil-tanimlanir) göz atmanızı öneririz.

### Temiz ve ölçülebilir veri

CRM'deki kayıtların önemli bir kısmında sektör, çalışan sayısı veya unvan bilgisi eksikse fit skoru anlamsız hale gelir. Benzer şekilde e-posta açılma, tıklama ve web sitesi ziyaretleri takip edilmiyorsa engagement skoru hesaplanamaz. Modeli kurmadan önce hangi verilere sahip olduğunuzu ve hangilerinin eksik olduğunu listeleyin.

## Adım 1: İdeal Müşteri Profilini (ICP) Yazılı Hale Getirin

Lead scoring'in temeli, ideal müşterinizin kim olduğunu bilmektir. ICP iki katmanda tanımlanır.

**Şirket düzeyi (firmografik) kriterler:**

- Sektör (ör. SaaS, üretim, lojistik, profesyonel hizmetler)
- Çalışan sayısı aralığı (ör. 50–500)
- Coğrafya (ör. Türkiye ve DACH bölgesi)
- Tahmini ciro veya büyüme aşaması
- Kullanılan teknolojiler (ör. belirli bir CRM veya e-posta platformu)

**Kişi düzeyi (demografik) kriterler:**

- Unvan ve kıdem (ör. Satış Direktörü, VP Sales, Kurucu)
- Departman (satış, pazarlama, operasyon)
- Karar verme yetkisi (karar verici, etkileyici, son kullanıcı)

Burada sık yapılan hata, ICP'yi "olmasını istediğimiz müşteri" üzerinden tanımlamaktır. Doğru yaklaşım, **gerçekte en iyi sonuç aldığınız müşterilerden** yola çıkmaktır. Bu da bizi ikinci adıma götürür.

## Adım 2: Kazanılan ve Kaybedilen Fırsatları Analiz Edin

Son 12–24 ayda kapattığınız anlaşmaları ve kaybettiğiniz fırsatları bir tabloya dökün. Her biri için şu sorulara yanıt arayın:

- Kazanılan müşterilerin ortak sektörleri ve şirket büyüklükleri neler?
- İlk teması kim kurdu, hangi unvandaki kişi anlaşmayı ilerletti?
- Satın alma öncesinde hangi davranışlar gözlendi? Fiyat sayfası ziyareti, vaka çalışması indirme, webinar katılımı gibi.
- Kaybedilen fırsatlarda tekrar eden bir örüntü var mı? Örneğin çok küçük şirketler bütçe nedeniyle mi düşüyor?

Bu analiz için büyük bir veri setine ihtiyacınız yok. 30–50 kazanılmış anlaşma bile güçlü örüntüleri ortaya çıkarmaya yeter. Amaç, hangi özelliklerin satın alma olasılığını gerçekten artırdığını görmektir. Analizin sonunda elinizde "yüksek etkili", "orta etkili" ve "düşük etkili" olarak gruplandırılmış bir kriter listesi olmalıdır.

## Adım 3: Fit Skoru Kriterlerini ve Ağırlıklarını Belirleyin

Şimdi analiz ettiğiniz kriterleri puanlara dönüştürme zamanı. Pratik bir yaklaşım, fit skorunu **100 üzerinden** hesaplamaktır. Aşağıda bir B2B yazılım şirketi için örnek bir dağılım var. Rakamlar örnek amaçlıdır ve kendi verinize göre uyarlanmalıdır.

**Sektör (en fazla 25 puan)**

- Hedef sektör (SaaS, e-ticaret altyapısı): 25
- Yakın sektör (dijital ajans, danışmanlık): 15
- Hedef dışı sektör: 0

**Şirket büyüklüğü (en fazla 25 puan)**

- 50–500 çalışan: 25
- 20–49 veya 501–1000 çalışan: 15
- 20'den az çalışan: 5
- 1000'den fazla çalışan: 10 (satış döngüsü çok uzun olduğu için)

**Unvan ve kıdem (en fazla 30 puan)**

- C-level veya kurucu: 30
- VP / Direktör: 25
- Müdür: 15
- Uzman / Yönetici olmayan: 5

**Coğrafya (en fazla 10 puan)**

- Birincil pazar: 10
- İkincil pazar: 5
- Hizmet verilmeyen bölge: 0

**Teknoloji uyumu (en fazla 10 puan)**

- Entegre olduğunuz bir platformu kullanıyor: 10
- Bilinmiyor: 3
- Rakip bir çözümü yeni almış: 0

Ağırlıkları belirlerken şu kuralı izleyin: **kazanılan anlaşmalarda en belirleyici çıkan kriter en yüksek ağırlığı alır.** Kurucu veya C-level ile yapılan görüşmelerin belirgin şekilde daha sık kapandığını görüyorsanız unvana sektörden daha fazla ağırlık vermeniz mantıklıdır.

## Adım 4: Engagement Skoru Kriterlerini Belirleyin

Fit skoru "doğru kişi mi?" sorusunu yanıtlar. Engagement skoru ise "şu an ilgili mi?" sorusuna cevap verir. Bunu da 100 üzerinden tasarlamak, iki skoru karşılaştırmayı kolaylaştırır.

Davranışları niyet gücüne göre üç gruba ayırabilirsiniz.

**Yüksek niyet sinyalleri:**

- Demo veya görüşme talebi: 40
- Soğuk e-postaya olumlu yanıt: 30
- Fiyatlandırma sayfasını ziyaret: 20
- Son 7 günde birden fazla ürün sayfası ziyareti: 15

**Orta niyet sinyalleri:**

- Vaka çalışması veya karşılaştırma içeriği indirme: 10
- Webinar'a katılım (sadece kayıt değil): 10
- E-postadaki bağlantıya tıklama: 5
- LinkedIn'de şirket gönderisine yorum veya mesaj: 5

**Düşük niyet sinyalleri:**

- Blog yazısı okuma: 2
- Bültene abonelik: 3
- E-posta açma: 1 (gizlilik özellikleri nedeniyle açılma verisi güvenilir olmadığı için düşük tutulmalı)

Engagement skorunda üst sınır koymak önemlidir. Aksi halde blogunuzu her gün okuyan bir öğrenci, demo talep eden bir satış direktöründen daha yüksek puana ulaşabilir. Pratik bir çözüm olarak her kategori için tavan belirleyin. Örneğin düşük niyet sinyallerinden toplanabilecek puan en fazla 10 olsun.

LinkedIn etkileşimleri B2B'de giderek daha önemli bir sinyal haline geliyor. Şirket sayfanız ve yöneticilerinizin profilleri düzenli içerik üretmiyorsa bu kanaldan gelecek sinyaller de zayıf kalır. Bu tarafı güçlendirmek isteyen ekipler için [B2B odaklı LinkedIn yönetimi sunan Social Media Corner](https://socialmediacorner.co) iyi bir başlangıç noktası olabilir.

## Adım 5: Negatif Puanlama ve Puan Eskimesini Ekleyin

Pek çok lead scoring modeli yalnızca puan eklediği için zamanla şişer. Sağlıklı bir model puanı düşürmeyi de bilir.

### Negatif puanlama

- Rakip şirket çalışanı: −50 (veya doğrudan diskalifiye)
- Öğrenci veya kişisel e-posta adresi (gmail, hotmail): −20
- "İlgilenmiyorum" yanıtı: −40
- E-posta aboneliğinden çıkış: −30
- Kariyer sayfasını ziyaret (iş arayan sinyali): −10

### Puan eskimesi (decay)

Üç ay önce fiyat sayfasını ziyaret eden ve o günden beri hiçbir etkileşimi olmayan bir lead, bugün aynı sayfayı ziyaret edenle aynı değerde değildir. Bu nedenle engagement puanlarına bir eskime kuralı ekleyin. Örneğin:

- 30 gün etkileşim yoksa engagement skorunun %25'i düşsün.
- 60 gün etkileşim yoksa %50'si düşsün.
- 90 gün sonunda engagement skoru sıfırlansın.

Fit skoru ise genellikle eskimez. Şirketin sektörü veya kişinin unvanı değişmediği sürece uyum aynı kalır. Ancak kişi şirket değiştirdiğinde fit skorunun yeniden hesaplanması gerekir.

## Adım 6: Eşik Değerleri ve Aksiyon Matrisini Tanımlayın

Puanlar tek başına bir şey ifade etmez. Önemli olan her puan aralığının hangi aksiyonu tetiklediğidir. Fit ve engagement skorlarını ayrı tuttuğunuzda basit ama güçlü bir **2x2 matris** elde edersiniz:

- **Yüksek fit + yüksek engagement (A):** Hemen satış temsilcisine devredilir, 24 saat içinde kişisel temas kurulur. Bu lead'ler SQL adayıdır.
- **Yüksek fit + düşük engagement (B):** Doğru şirket ama henüz ilgi yok. Kişiselleştirilmiş outbound dizisine alınır.
- **Düşük fit + yüksek engagement (C):** İlgili ama ideal müşteri değil. Pazarlama otomasyonuyla beslenir, gerekirse kısa bir niteleme görüşmesi yapılır.
- **Düşük fit + düşük engagement (D):** Genel bülten listesinde tutulur, satış zamanı harcanmaz.

Örnek eşikler:

- Fit skoru 70 ve üzeri: yüksek fit
- Engagement skoru 50 ve üzeri: yüksek engagement

B grubundaki lead'ler, outbound ekiplerin en büyük fırsatıdır. Doğru şirkettirler ama henüz sizi tanımamaktadırlar. Bu gruba gönderilecek mesajların kalitesi dönüşümü doğrudan belirler. [Yapay zekayla soğuk e-posta yazmayı anlattığımız yazıda](/blog/yapay-zekayla-soguk-eposta-nasil-yazilir) bu lead'ler için ölçeklenebilir ama kişisel mesajların nasıl hazırlanacağını detaylıca ele aldık. Bu dizileri ürün videonuz, PDF dokümanınız veya web sitenizden otomatik üretmek için [Sekans Yazarı aracını](/#otomasyonlar) kullanabilirsiniz.

## Adım 7: Veri Zenginleştirmeyle Modeli Besleyin

Fit skorunun doğruluğu, elinizdeki verinin eksiksizliğine bağlıdır. Bir form doldurulduğunda genellikle yalnızca ad, e-posta ve şirket adı gelir. Sektör, çalışan sayısı, unvan ve teknoloji bilgisi eksik kalır. Bu eksik alanlar sıfır puan alırsa iyi bir lead haksız yere düşük skorlanır.

Bu sorunu çözmek için veri zenginleştirme araçları kullanılır. Lead CRM'e girdiği anda e-posta alan adından şirket bilgileri, kişinin adından ve şirketinden unvan ve kıdem bilgileri otomatik olarak çekilir. Örneğin [Apollo.io](https://get.apollo.io/679irkzm35ya) gibi B2B veri platformları hem yeni lead listesi oluşturmak hem de mevcut kayıtları firmografik verilerle zenginleştirmek için yaygın olarak kullanılır. Hedef şirketlerin web sitelerinde belirli ürün veya teknoloji sinyallerini toplu olarak aramak isterseniz [Web Keyword Scanner aracımız](/#otomasyonlar) da fit skoruna veri sağlayabilir.

Zenginleştirme yaparken iki noktaya dikkat edin:

- **Eksik veri için ara puan verin.** Çalışan sayısı bilinmiyorsa sıfır yerine düşük-orta bir puan (ör. 25 üzerinden 8) atamak, modelin eksik veriyi cezalandırmasını önler.
- **Yasal çerçeveye uyun.** Zenginleştirilmiş kişisel verilerle iletişime geçerken KVKK ve ilgili düzenlemeler devreye girer. Bu konuda [KVKK'ya uygun B2B soğuk e-postanın yasal sınırlarını ele aldığımız yazı](/blog/kvkk-uyumlu-soguk-eposta-yasal-sinirlar) size net bir çerçeve sunar.

## Adım 8: Skorlamayı Otomasyonla Devreye Alın

Lead scoring'i elle yapmak ilk birkaç hafta mümkündür ama sürdürülebilir değildir. Modelin gerçek değeri, skorların otomatik hesaplanması ve aksiyonların otomatik tetiklenmesiyle ortaya çıkar.

Tipik bir otomasyon akışı şöyle işler:

1. Yeni lead CRM'e düşer (form, outbound liste veya entegrasyon üzerinden).
2. Zenginleştirme aracı eksik firmografik alanları doldurur.
3. Fit skoru kurallara göre hesaplanır ve CRM alanına yazılır.
4. Web sitesi, e-posta ve LinkedIn etkileşimleri geldikçe engagement skoru güncellenir.
5. Lead A grubuna geçtiğinde ilgili satış temsilcisine Slack veya e-posta bildirimi gider, CRM'de görev açılır.
6. B grubundaki lead'ler otomatik olarak uygun outbound dizisine eklenir.
7. Haftalık bir iş, eskime kurallarını uygulayarak engagement skorlarını günceller.

Bu akışı kurmak için pahalı kurumsal yazılımlara ihtiyacınız yok. n8n gibi esnek otomasyon araçlarıyla CRM, zenginleştirme servisi, e-posta platformu ve iletişim kanallarınızı birbirine bağlayabilirsiniz. Nereden başlayacağınızı bilmiyorsanız [n8n ile B2B satış otomasyonuna giriş rehberimiz](/blog/n8n-ile-b2b-satis-otomasyonu-rehberi) temel kurulumu adım adım anlatıyor.

## Adım 9: Test Edin, Ölçün ve Kalibre Edin

İlk model hiçbir zaman mükemmel olmaz. Önemli olan modeli düzenli olarak gerçek sonuçlarla karşılaştırmaktır.

**İlk 30 gün:** Modeli "gölge modda" çalıştırın. Skorlar hesaplansın ama satış ekibi alışık olduğu şekilde çalışmaya devam etsin. Ay sonunda satış ekibinin kendi seçtiği öncelikli lead'lerle modelin A grubuna koyduklarını karşılaştırın.

**Aylık takip edilecek metrikler:**

- Her skor grubunun (A, B, C, D) toplantıya dönüşme oranı
- Her grubun fırsata ve kazanılan anlaşmaya dönüşme oranı
- A grubundaki lead'lere ilk temasın ortalama süresi
- Satış ekibinin "bu lead nitelikli değildi" diye geri gönderdiği MQL oranı

**Çeyreklik kalibrasyon:**

- A grubu ile D grubu arasında dönüşüm farkı belirgin değilse kriterler ayrıştırıcı değildir. Ağırlıkları yeniden gözden geçirin.
- Kazanılan anlaşmaların önemli bir kısmı B veya C grubundan geliyorsa eşik değerleriniz fazla yüksektir.
- Satış ekibi sürekli belirli bir kriterin yanıltıcı olduğunu söylüyorsa (ör. webinar katılımcıları hiç satın almıyor) o kriterin puanını düşürün.

Satış ekibinden sistematik geri bildirim almak bu aşamanın en kritik parçasıdır. CRM'e basit bir "skor doğru muydu?" alanı eklemek bile kalibrasyon için değerli veri üretir.

## Uçtan Uca Örnek: Bir Lead'in Skorlanması

Modeli somutlaştırmak için kurgusal bir senaryo üzerinden gidelim. Türkiye'de B2B satış ekiplerine yazılım sunan bir şirketin modelini kullandığımızı varsayalım.

**Lead:** 180 çalışanlı bir SaaS şirketinde Satış Direktörü. Şirket İstanbul merkezli ve sizin entegre olduğunuz bir CRM'i kullanıyor.

**Fit skoru hesabı:**

- Sektör (SaaS, hedef sektör): 25
- Şirket büyüklüğü (180 çalışan): 25
- Unvan (Direktör): 25
- Coğrafya (birincil pazar): 10
- Teknoloji (entegre CRM): 10
- **Toplam fit skoru: 95**

**Engagement geçmişi (son 14 gün):**

- Outbound dizisindeki ikinci e-postadaki bağlantıya tıkladı: 5
- Aynı gün iki ürün sayfasını ve fiyatlandırma sayfasını ziyaret etti: 15 + 20
- Bir vaka çalışmasını indirdi: 10
- **Toplam engagement skoru: 50**

**Sonuç:** Fit 95, engagement 50. Lead A grubuna geçer. Satış temsilcisine otomatik bildirim gider. Temsilci, lead'in incelediği fiyatlandırma sayfasını ve indirdiği vaka çalışmasını bağlam olarak kullanarak aynı gün kişisel bir e-posta ve LinkedIn mesajı gönderir.

Şimdi karşılaştırma için ikinci bir lead düşünelim: 8 çalışanlı bir dijital ajansta uzman pozisyonundaki bir kişi. Son bir haftada beş blog yazısı okumuş, bir webinar'a katılmış ve bir e-kitap indirmiş.

- Fit skoru: 15 (yakın sektör) + 5 (küçük şirket) + 5 (uzman) + 10 (coğrafya) + 3 (teknoloji bilinmiyor) = **38**
- Engagement skoru: 10 (blog tavanı) + 10 (webinar) + 10 (içerik indirme) = **30**

Bu lead D grubundadır. Çok ilgili görünse de satış ekibinin zamanını hak edecek bir uyuma sahip değildir. Modelin yokluğunda bu kişi, yalnızca "aktif" göründüğü için ilk lead'in önüne geçebilirdi.

## Yapay Zeka Lead Scoring'e Ne Katar?

Kural tabanlı modeller anlaşılır ve yönetilebilir oldukları için iyi bir başlangıç noktasıdır. Veri hacmi arttıkça yapay zeka bu modeli birkaç şekilde güçlendirebilir:

- **Örüntü keşfi:** Makine öğrenmesi modelleri, kazanılan anlaşmalardaki insan gözünün kaçırabileceği kriter kombinasyonlarını tespit edebilir. Örneğin belirli bir sektörde yalnızca belirli bir büyüklük aralığındaki şirketlerin dönüştüğünü ortaya çıkarabilir.
- **Metin sinyallerinin yorumlanması:** E-posta yanıtlarının içeriğini analiz ederek "şu an değil ama üç ay sonra konuşalım" gibi yanıtları "ilgilenmiyorum" yanıtlarından ayırabilir ve puanı buna göre ayarlayabilir.
- **Niyet verisinin birleştirilmesi:** İş ilanları, yatırım haberleri ve yönetici değişiklikleri gibi dış sinyalleri tarayıp ilgili şirketlerin skorunu yükseltebilir. Satış direktörü yeni işe alınmış bir şirket, yeni araçlara açık olma eğilimindedir.
- **Kişiselleştirilmiş sonraki adım önerisi:** Skorun yanında, lead'in davranışına göre hangi mesajın veya içeriğin gönderilmesi gerektiğini önerebilir.

Ancak yapay zeka, temiz veri ve net tanımlar olmadan sihir yapmaz. Önce kural tabanlı modeli kurup birkaç çeyrek boyunca kalibre etmek, ardından yapay zeka katmanını eklemek en sağlıklı yoldur. Böylece yapay zekanın önerilerini değerlendirebileceğiniz bir referans noktanız olur.

## Sık Yapılan Hatalar

Lead scoring projelerinin başarısız olmasının nedenleri genellikle benzerdir:

- **Çok fazla kriter kullanmak.** Yirmi farklı kritere sahip bir model kimsenin anlamadığı bir kara kutuya dönüşür. Başlangıçta fit için 4–6, engagement için 6–10 kriter yeterlidir.
- **Satış ekibini sürece dahil etmemek.** Pazarlama ekibinin tek başına kurduğu modeller satış tarafında güven kazanamaz ve kısa sürede görmezden gelinir.
- **Fit ve engagement'ı tek sayıda birleştirmek.** Tek bir toplam skor, "doğru şirket ama ilgisiz" ile "yanlış şirket ama çok ilgili" lead'leri aynı puanda gösterebilir.
- **Negatif puanlamayı ve eskimeyi atlamak.** Bu iki mekanizma olmadan skorlar zamanla anlamsızca şişer.
- **Modeli bir kez kurup unutmak.** Pazarınız, ürününüz ve ICP'niz değiştikçe modelin de güncellenmesi gerekir.
- **Skoru aksiyona bağlamamak.** Hiçbir otomasyonu tetiklemeyen ve satış sürecini değiştirmeyen bir skor, yalnızca CRM'de duran bir sayıdır.

Özellikle SaaS şirketlerinde lead scoring, outbound stratejisiyle birlikte düşünüldüğünde en yüksek verimi verir. Hem ICP'yi netleştirmek hem de yüksek fit skoruna sahip hesaplara sistematik şekilde ulaşmak isteyen ekipler için [B2B SaaS'a özel outbound satış ve lead generation hizmeti veren SAAS Corner](https://saascorner.co) bu iki tarafı birlikte ele alan bir yaklaşım sunar.

Sales Corner'ın satış otomasyonu ve outbound alanında neler yaptığını [hizmetler sayfamızda](/hizmetler) görebilirsiniz.

## Sonuç

İyi bir B2B lead scoring modeli karmaşık olmak zorunda değildir. Önemli olan ideal müşterinizi gerçek verilerle tanımlamak, fit ve engagement'ı ayrı ölçmek, negatif puanlama ve eskime kurallarıyla modeli dengede tutmak ve her skor grubunu net bir aksiyona bağlamaktır. Bu yazıda anlattığımız dokuz adımı izleyerek birkaç hafta içinde çalışan bir ilk versiyon kurabilir, ardından aylık metrikler ve satış ekibinden gelen geri bildirimlerle modeli sürekli iyileştirebilirsiniz.

Sonuçta lead scoring, satış ekibinizin en değerli kaynağı olan zamanı doğru lead'lere yönlendirmenin en etkili yollarından biridir. Veri zenginleştirme, otomatik skor hesaplama ve skora bağlı outbound akışlarını kurmak için desteğe ihtiyacınız varsa Sales Corner ekibi olarak yardımcı olmaktan memnuniyet duyarız. Mevcut sürecinizi birlikte değerlendirmek için [bizimle bir görüşme planlayın](/iletisim).

## Sık sorulan sorular

### B2B lead scoring nedir?
Lead scoring, potansiyel müşterilere belirli kriterlere göre sayısal puan atayarak satış ekibinin önceliklendirme yapmasını sağlayan bir yöntemdir. B2B'de iyi bir model iki boyutu ayrı ölçer: lead'in ideal müşteri profiline ne kadar uyduğunu gösteren fit skoru ve ne kadar etkileşime girdiğini gösteren engagement skoru.

### Fit ve engagement skorları neden ayrı tutulmalı?
Tek bir toplam skor, "doğru şirket ama ilgisiz" ile "yanlış şirket ama çok ilgili" lead'leri aynı puanda gösterebileceği için ayrı tutulmalıdır. İki skor ayrı kalınca 2x2 bir aksiyon matrisi kurulur: yüksek fit ve yüksek engagement'lı lead'ler 24 saat içinde satış temsilcisine devredilir, yüksek fit ama düşük engagement'lı lead'ler kişiselleştirilmiş outbound dizisine alınır.

### Lead scoring modeli kurmak için ne kadar veri gerekir?
Büyük bir veri setine gerek yoktur; 30–50 kazanılmış anlaşma bile güçlü örüntüleri ortaya çıkarmaya yeter. Son 12–24 ayda kazanılan ve kaybedilen fırsatlar analiz edilerek hangi kriterlerin satın alma olasılığını gerçekten artırdığı belirlenir.

### Puan eskimesi (decay) nasıl uygulanır?
Engagement puanları etkileşimsiz geçen süreye göre düşürülür: örneğin 30 gün etkileşim yoksa %25, 60 günde %50 düşer, 90 günün sonunda engagement skoru sıfırlanır. Fit skoru ise genellikle eskimez; yalnızca kişi şirket değiştirdiğinde yeniden hesaplanır.
