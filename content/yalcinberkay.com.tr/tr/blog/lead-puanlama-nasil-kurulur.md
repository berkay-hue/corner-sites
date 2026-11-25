---
title: "Lead Puanlama Nasıl Kurulur? Pratik Model Örneği"
description: "Potansiyel müşterilere puan verirken hangi davranış ve firma sinyallerinin esas alınacağını, CRM'de puanlama modelinin adım adım kurulumunu anlatıyoruz."
date: "2026-11-26"
category: "CRM"
image: "https://images.pexels.com/photos/8171183/pexels-photo-8171183.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Lead Puanlama Nasıl Kurulur? Pratik Model Örneği"
---

Lead puanlama, her potansiyel müşteriye iki eksende puan vererek kurulur: **ideal müşteri profilinize ne kadar uyduğu (uygunluk)** ve **satın alma niyetini gösteren ne kadar sinyal verdiği (ilgi)**. Bu iki puan toplanır ve önceden belirlediğiniz eşiklere göre lead'in ne olacağına karar verilir: beslemeye mi alınacak, SDR mı arayacak, yoksa doğrudan satış temsilcisine mi gidecek. İyi bir model 100 puanlık bir ölçekle, 10-15 kriterle ve geçmiş kazanılan anlaşmalarınızdan çıkarılan verilerle kurulur. İlk günden mükemmel olması gerekmez; üç ayda bir gözden geçirilmesi yeterlidir.

Bu yazıda lead puanlamanın mantığını anlatacağım, ardından bir B2B şirketi için baştan sona çalışan bir model örneği paylaşacağım. Örnekteki rakamlar, kendi CRM'inize uyarlayabileceğiniz bir başlangıç noktası olsun diye verildi. Amaç teoriyi tekrarlamak değil. Amaç, pazartesi sabahı CRM'inizi açıp kurmaya başlayabileceğiniz bir şablon sunmak.

## Lead puanlama neden gerekli?

Küçük bir ekipte, ayda birkaç düzine lead geldiğinde herkes her lead'e bakabilir. Lead sayısı yüzleri bulduğunda ise ekip öncelik sırasını içgüdüyle belirlemeye başlar. İçgüdü genellikle şöyle çalışır: Temsilci en son gelen lead'i arar, tanıdık geldiği için büyük markayı arar ya da kendisini en az reddedecek kişiyi arar. Hiçbiri gerçekten satın alma ihtimali en yüksek lead'e öncelik vermek anlamına gelmez.

Lead puanlama üç somut sorunu çözer:

- **Zaman kaybı:** Temsilciler satın alma ihtimali düşük lead'lerle uğraşırken sıcak lead'ler soğur. Bir demo talebinin aynı gün aranmasıyla üç gün sonra aranması arasındaki fark, satış yapmış herkesin bildiği bir şeydir.
- **Pazarlama ile satış arasındaki sürtünme:** Pazarlama "çok lead gönderdik" der, satış "lead'ler kötü" der. Ortak bir puanlama modeli, "iyi lead" tanımını iki ekibin birlikte yazdığı bir sözleşmeye dönüştürür.
- **Öngörülebilirlik:** Hangi puan aralığındaki lead'lerin hangi oranda fırsata dönüştüğünü bildiğinizde, pipeline'ınız tahmin edilebilir hâle gelir. Bu da [satış tahmini yaparken](/blog/satis-tahmini-forecast-nasil-yapilir) elinize sağlam bir girdi verir.

## Başlamadan önce neye ihtiyacınız var?

Puanlama modeli, altındaki veriden daha iyi olamaz. Kriter yazmaya başlamadan önce üç hazırlığı tamamlayın.

### 1. İdeal müşteri profilini yazıya dökün

"KOBİ'lere satıyoruz" bir profil değildir. Profil şu sorulara cevap verir: Hangi sektör? Kaç çalışan? Hangi coğrafya? Satın alma kararını hangi unvan veriyor, kim etkiliyor? Hangi teknolojiyi veya süreci zaten kullanıyorlar? Hangi tetikleyici olay ihtiyaç doğuruyor (yeni şube, büyüme, yönetim değişikliği, yeni regülasyon)?

### 2. Geçmiş kazanılan anlaşmalara bakın

Son 6-12 ayda kazandığınız anlaşmaları bir tabloya dökün. Her biri için sektörü, çalışan sayısını, ilk temas kuran kişinin unvanını, lead'in nereden geldiğini ve satıştan önce hangi etkileşimleri gerçekleştirdiğini not edin. Ardından aynı işlemi kaybettiğiniz ya da hiç ilerlemeyen fırsatlar için yapın. İki liste arasındaki farklar, puanlama kriterlerinizin ham maddesidir. Elinizde yeterli kapanmış anlaşma yoksa (örneğin 20'nin altındaysa) satış ekibinin tecrübesine dayalı bir modelle başlayın, veri biriktikçe düzeltin.

### 3. CRM verisini temizleyin

Aynı firma üç farklı kayıtla duruyorsa, aynı kişi iki kez lead olarak girildiyse ya da sektör alanı yarı yarıya boşsa, puanlama yanlış sonuç verir. Bu adımı atlamayın: [CRM'de yinelenen kayıtların nasıl ayıklanacağını](/blog/crm-veri-temizligi-yinelenen-kayitlar) ayrı bir yazıda detaylı anlattım. Eksik firmografik alanları doldurmak için de bir veri zenginleştirme aracı kullanabilirsiniz. Örneğin [Apollo.io](https://get.apollo.io/679irkzm35ya) gibi B2B veri platformları çalışan sayısı, sektör ve unvan gibi alanları otomatik doldurarak uygunluk puanının güvenilirliğini artırır.

## Uygunluk puanı: Bu lead doğru müşteri mi?

Uygunluk (fit) puanı, lead'in **kim olduğunu** ölçer. Lead hiçbir şey yapmasa bile bu puan değişmez, çünkü firmanın ve kişinin özelliklerine dayanır. Tipik uygunluk kriterleri şunlardır:

- **Sektör:** Ürününüzün en çok değer yarattığı sektörler en yüksek puanı alır.
- **Firma büyüklüğü:** Çalışan sayısı veya ciro bandı. Çok küçük firmalar bütçe açısından, çok büyük firmalar satış döngüsü açısından farklı davranır.
- **Unvan ve departman:** Karar verici, etkileyici ve kullanıcı arasında net bir ayrım yapın.
- **Coğrafya:** Hizmet verebildiğiniz bölgede mi?
- **Teknoloji veya süreç uyumu:** Ürününüzün entegre olduğu bir sistemi kullanıyor mu, ya da çözdüğünüz problemi yaşadığını gösteren bir işaret var mı?

Unvan kriterinde dikkatli olun. B2B satışta kararı tek bir kişi vermez. Bir operasyon müdürü yüksek puan alabilir ama nihai onay finans direktöründen çıkıyor olabilir. Bu dinamiği [satın alma komitesinin nasıl yönetileceği](/blog/b2b-satin-alma-komitesi-nasil-yonetilir) yazısında ele aldım. Puanlama açısından pratik öneri şudur: Aynı firmadan birden fazla kişi etkileşime giriyorsa, bunu ayrıca ödüllendirin.

## İlgi puanı: Bu lead şu an satın almaya ne kadar yakın?

İlgi (engagement) puanı lead'in **ne yaptığını** ölçer. Burada kritik ayrım, düşük niyetli ve yüksek niyetli davranışlar arasındadır:

- **Yüksek niyet:** Demo talebi, fiyatlandırma sayfası ziyareti, teklif talebi, outbound e-postaya olumlu yanıt, "bize ulaşın" formu.
- **Orta niyet:** Webinar katılımı, vaka çalışması okuma, ürün karşılaştırma sayfası ziyareti, birden fazla ziyaret.
- **Düşük niyet:** E-posta açma, blog yazısı okuma, sosyal medyada beğeni.

En sık yapılan hata, düşük niyetli davranışlara fazla puan vermektir. E-posta açma oranları bugün otomatik güvenlik taramaları ve gizlilik özellikleri yüzünden güvenilir bir sinyal değil. Bir lead'in on e-postayı açmış olması, onu demo isteyen biriyle aynı seviyeye taşımamalı. Bu yüzden düşük niyetli davranışlara **tavan puan** koymanızı öneririm.

## Pratik model örneği: 100 puanlık şablon

Şimdi somut bir örneğe geçelim. Hayali şirketimiz, 50-500 çalışanlı üretim ve lojistik firmalarına saha servis yönetim yazılımı satan bir B2B SaaS şirketi olsun. Hem inbound (web sitesi, içerik) hem outbound (SDR ekibi) kanalı var. Model 50 puan uygunluk ve 50 puan ilgi olmak üzere toplam 100 puan üzerinden kurulur.

### Uygunluk puanı (en fazla 50)

| Kriter | Değer | Puan |
|---|---|---|
| Sektör | Üretim veya lojistik | +15 |
| | Saha hizmeti veren diğer sektörler (enerji, tesis yönetimi) | +8 |
| | Diğer | 0 |
| Çalışan sayısı | 50-500 | +15 |
| | 20-49 veya 501-1000 | +8 |
| | 20'nin altı | -10 |
| Unvan | Genel Müdür, Operasyon Direktörü, COO | +12 |
| | Operasyon / Servis / Satın Alma Müdürü | +8 |
| | Uzman, mühendis | +3 |
| | Öğrenci, stajyer | -10 |
| Konum | Hizmet verilen bölge | +5 |
| | Hizmet dışı bölge | -15 |
| Teknoloji | Entegre olunan ERP'lerden birini kullanıyor | +3 |

### İlgi puanı (en fazla 50)

| Davranış | Puan | Not |
|---|---|---|
| Demo talebi | +25 | Ayrıca hızlı yönlendirme tetikler |
| Outbound e-postaya olumlu yanıt | +15 | "Konuşalım", "detay gönderin" vb. |
| Fiyatlandırma sayfası ziyareti (son 14 gün) | +10 | Tek seferlik |
| Webinar katılımı | +8 | Kayıt olup katılmamak: +2 |
| Vaka çalışması / karşılaştırma sayfası | +5 | |
| İçerik indirme (e-kitap, rapor) | +5 | En fazla 2 kez sayılır |
| Aynı firmadan ikinci kişinin etkileşimi | +5 | Komite sinyali |
| LinkedIn'de içeriğe yorum veya mesaj | +3 | |
| E-posta açma | +1 | Toplamda en fazla +3 |

### Negatif puanlar ve puan erimesi

| Durum | Puan |
|---|---|
| Rakip firma alan adı | -50 |
| Kişisel e-posta adresi (gmail, hotmail vb.) | -5 |
| İş ilanı sayfası ziyareti (iş arayan sinyali) | -10 |
| "İlgilenmiyorum" yanıtı | -30 |
| 30 gün boyunca hiç etkileşim yok | İlgi puanından -10 |
| E-posta geri dönüyor (bounce) | -20 |

Puan erimesi (decay) modelin en çok atlanan parçasıdır. Altı ay önce webinara katılmış ama o günden beri hiçbir şey yapmamış bir lead, dün fiyat sayfasına bakan bir lead ile aynı puanı taşımamalı. Erime yalnızca ilgi puanına uygulanır. Firma 200 çalışanlıysa, altı ay sonra da 200 çalışanlıdır.

### Eşikler: Hangi puan ne anlama geliyor?

| Toplam puan | Durum | Aksiyon |
|---|---|---|
| 0-39 | Besleme | Otomatik e-posta serisi, içerik paylaşımı |
| 40-59 | MQL (pazarlama nitelikli) | SDR 48 saat içinde ulaşır, nitelendirme görüşmesi |
| 60 ve üzeri | SQL adayı | SDR 24 saat içinde arar, uygunsa AE'ye devreder |
| Demo talebi + uygunluk ≥ 30 | Hızlı yol | Puan beklenmeden doğrudan AE'ye atanır |

### Üç lead üzerinden hesaplama

**Lead A:** 200 çalışanlı bir üretim firmasının operasyon direktörü. Hizmet bölgesinde, entegre ERP'yi kullanıyor. Geçen hafta fiyatlandırma sayfasını ziyaret etti ve bir webinara katıldı.

- Uygunluk: 15 + 15 + 12 + 5 + 3 = **50**
- İlgi: 10 + 8 = **18**
- Toplam: **68** → SQL adayı, SDR 24 saat içinde arar.

**Lead B:** 15 kişilik bir dijital ajansta çalışan uzman. Bir e-kitap indirdi, üç e-postayı açtı.

- Uygunluk: 0 (sektör) - 10 (çalışan) + 3 (unvan) + 5 (konum) = **-2**
- İlgi: 5 + 3 = **8**
- Toplam: **6** → Besleme. Satış ekibinin zamanını almaz.

**Lead C:** 120 çalışanlı bir lojistik firmasının satın alma müdürü. SDR'ın outbound dizisindeki ikinci e-postaya "Detay gönderebilir misiniz?" diye cevap verdi.

- Uygunluk: 15 + 15 + 8 + 5 = **43**
- İlgi: **15**
- Toplam: **58** → MQL. SDR nitelendirme görüşmesi yapar ve firmadaki operasyon tarafındaki karar vericiyi de sürece dahil etmeye çalışır.

Lead C örneği önemli bir noktayı gösteriyor: Puan 60'ın altında kalmış olsa da bu lead gerçek bir fırsat olabilir. Model temsilcinin yargısını ortadan kaldırmaz, sadece nereden başlayacağını söyler.

## Alternatif yöntem: Puan yerine harf-rakam matrisi

Bazı ekipler tek bir toplam puan yerine iki boyutu ayrı tutmayı tercih eder. Uygunluk A, B veya C olarak harflendirilir. İlgi ise 1, 2 veya 3 olarak rakamlandırılır. Sonuçta "A1" en uygun ve en ilgili lead'i, "C3" ise hem uyumsuz hem ilgisiz lead'i ifade eder.

Bu yöntemin avantajı, toplam puanın gizlediği bilgiyi açığa çıkarmasıdır. 60 puanlık bir lead, 50 uygunluk + 10 ilgi de olabilir, 10 uygunluk + 50 ilgi de. Birincisi outbound ile ısıtılması gereken mükemmel bir hedef hesaptır. İkincisi ise ürünle çok ilgilenen ama muhtemelen satın alamayacak bir kişidir. Matris bu ayrımı görünür kılar:

- **A1, A2, B1:** Hemen satış teması
- **A3:** Hesap bazlı outbound hedefi. İlgi yok ama profil mükemmel.
- **B2, B3, C1:** Besleme ve SDR nitelendirmesi
- **C2, C3:** Yalnızca otomatik besleme

Ekibiniz 10 kişinin altındaysa toplam puanla başlayın. Ekip büyüdükçe ve outbound ağırlığı arttıkça matrise geçmek mantıklı olur.

## CRM'de lead puanlama nasıl kurulur?

Çoğu modern CRM, yerleşik puanlama özelliği ya da iş akışı (workflow) otomasyonu sunar. Kurulumu şu sırayla yapın:

1. **Alanları oluşturun:** "Uygunluk puanı", "İlgi puanı", "Toplam puan" ve "Lead durumu" (Besleme / MQL / SQL / Diskalifiye) alanlarını açın. Puanları ayrı tutmak raporlamada çok işinize yarar.
2. **Firmografik alanları zorunlu hâle getirin:** Sektör ve çalışan sayısı boşsa uygunluk puanı hesaplanamaz. Form ve veri girişinde bu alanları açılır liste olarak tanımlayın, serbest metin bırakmayın.
3. **Kuralları tek tek tanımlayın:** Yukarıdaki tablodaki her satır bir kural olur. "Sektör = Üretim ise uygunluk puanına +15 ekle" gibi.
4. **Tavanları ve erimeyi ekleyin:** E-posta açma için tavan, 30 günlük hareketsizlik için düşüş kuralı.
5. **Eşik tetikleyicilerini bağlayın:** Toplam puan 40'ı geçtiğinde lead durumu MQL'e dönsün, ilgili SDR'a görev atansın ve bildirim gitsin. Lead'in hangi temsilciye atanacağı, [bölge ve hesap dağılımı](/blog/satis-ekibinde-bolge-ve-hesap-dagilimi-nasil-yapilir) kurallarınıza göre belirlenmeli.
6. **Pipeline ile ilişkilendirin:** SQL olan lead fırsata dönüştüğünde puanı fırsat kaydında da görünsün. Böylece hangi puan aralığının hangi oranda kazanıldığını ölçebilirsiniz. Lead durumları ile fırsat aşamalarını birbirine karıştırmamak için [CRM'de satış aşamalarının nasıl tanımlanacağına](/blog/crmde-satis-asamalari-nasil-tanimlanir) da göz atın.

Kurulumu küçük bir pilotla başlatın. İlk iki hafta puanlar hesaplansın ama otomatik atamalar çalışmasın. Bu sürede satış ekibi, puanın ne söylediğine ve kendi sezgilerine birlikte bakarak modeli test etsin.

## Outbound ekiplerde lead puanlama nasıl farklılaşır?

Inbound ağırlıklı şirketlerde puanlama genellikle web davranışı üzerine kurulur. Outbound ekiplerde ise durum tersine döner. Lead'lerin büyük kısmı henüz hiçbir şey yapmamıştır, çünkü onları siz seçmişsinizdir. Bu durumda:

- **Uygunluk puanı daha ağır basar.** Hangi hesaplara dizi başlatılacağına uygunluk puanı karar verir. A sınıfı hesaplar kişiselleştirilmiş, çok kanallı dizilere girer. B sınıfı hesaplar ise daha otomatik dizilere.
- **İlgi sinyalleri outbound kanallardan gelir.** E-postaya yanıt, soğuk aramada "sonra arayın" yerine "gelecek çeyrek konuşalım" demek, LinkedIn bağlantı isteğini kabul edip mesaja dönmek gibi.
- **Tetikleyici olaylar puanlanır.** Yeni yatırım haberi, yeni operasyon direktörü ataması, büyüme ilanları. Bunlar bir hesabın "şimdi" konuşmaya açık olma ihtimalini artırır.

Outbound ekibini sıfırdan kuruyorsanız, puanlama modelini ekiple birlikte tasarlamanızı öneririm. Hangi hesapların hedef listeye gireceği, [sıfırdan outbound satış ekibi kurarken](/blog/sifirdan-outbound-satis-ekibi-kurmak) verilecek en kritik kararlardan biridir. Bu işi şirket içinde kurmak yerine dışarıdan destek almak isteyen B2B SaaS şirketleri için [SAAS Corner'ın outbound satış ve lead generation hizmeti](https://saascorner.co), hedef listenin ve nitelendirme kriterlerinin baştan tanımlandığı bir yapı sunar.

## Modelin çalışıp çalışmadığını nasıl anlarsınız?

Bir puanlama modelinin değeri, yüksek puanlı lead'lerin gerçekten daha iyi sonuç verip vermediğiyle ölçülür. Üç kontrol yapın.

**1. Puan bandına göre dönüşüm oranı:** Her çeyrek sonunda lead'leri puan bantlarına ayırın (0-19, 20-39, 40-59, 60-79, 80+) ve her bandın fırsata ve kazanılan anlaşmaya dönüşüm oranına bakın. Sağlıklı bir modelde bu oranlar banttan banda düzenli artar. 40-59 bandı ile 60-79 bandı aynı oranda dönüşüyorsa, ayrımınız işe yaramıyor demektir.

**2. Kazanılan anlaşmaların ilk puanı:** Son çeyrekte kazanılan anlaşmaların, lead olarak ilk SDR temasına geçtikleri andaki puanına bakın. Bu anlaşmaların önemli bir kısmı besleme bandından çıkmışsa, eşiğiniz fazla yüksek veya kriterleriniz hatalı olabilir.

**3. Satış ekibinin geri bildirimi:** SDR'lara "60 üzeri geldi ama tamamen alakasızdı" veya "30 puandı ama harika bir görüşme oldu" durumlarını işaretleyebilecekleri basit bir alan verin. Ayda bir bu kayıtları gözden geçirin. Genellikle bir kriterin fazla ya da eksik puanlandığını hemen görürsünüz.

Bu kontrollere göre modeli çeyrekte bir güncelleyin. Her seferinde en fazla 2-3 kriteri değiştirin. Aynı anda her şeyi değiştirirseniz hangi değişikliğin işe yaradığını bilemezsiniz.

## En sık yapılan hatalar nelerdir?

- **Çok fazla kriterle başlamak:** 40 kriterli bir model kimse tarafından anlaşılmaz ve bakımı yapılamaz. 10-15 kriter, başlangıç için fazlasıyla yeterlidir.
- **Satış ekibini sürece katmamak:** Modeli pazarlama tek başına yazarsa satış ona güvenmez ve puanlara bakmadan kendi listesini aramaya devam eder.
- **Negatif puanları unutmak:** Rakipler, öğrenciler ve iş arayanlar pozitif sinyallerle şişirilmiş puanlar alabilir.
- **Erimeyi uygulamamak:** Bir yıl önceki ilgi bugünkü niyeti göstermez.
- **Eşiği satış kapasitesinden bağımsız belirlemek:** SDR'larınız haftada 50 lead'i nitelendirebiliyorsa ama eşik haftada 200 MQL üretiyorsa, eşik fazla düşüktür. Tersi durumda ise ekip boş kalır, eşiği düşürün.
- **Puanı tek gerçek saymak:** Puan bir önceliklendirme aracıdır. Temsilcinin bir görüşmede duyduğu net bir bütçe ve zaman bilgisi, modelin söylediğinden her zaman daha değerlidir.

## Sık sorulan sorular

### Lead puanlama için kaç kriter kullanılmalı?

Başlangıç için 10-15 kriter idealdir: 4-6 uygunluk kriteri, 5-7 ilgi kriteri ve 3-4 negatif kriter. Daha azı lead'leri yeterince ayırt etmez, daha fazlası ise bakımı zor ve anlaşılmaz bir model ortaya çıkarır. Veri biriktikçe etkisiz kriterleri çıkarıp yenilerini test edebilirsiniz.

### MQL ve SQL eşiği nasıl belirlenir?

Eşik, geçmiş kazanılan anlaşmaların ilk temas anındaki puanlarına ve satış ekibinin kapasitesine göre belirlenir. Pratik bir yöntem, geçmiş kazanılan anlaşmaların büyük çoğunluğunun üzerinde kaldığı puanı MQL eşiği olarak almak ve ekibin haftalık nitelendirme kapasitesine göre ince ayar yapmaktır. Geçmiş veri yoksa 100 puanlık ölçekte 40 ve 60 gibi makul eşiklerle başlayıp ilk çeyrek sonunda düzeltin.

### Küçük bir satış ekibi için lead puanlama gerekli mi?

Ayda birkaç düzine lead alan ve 2-3 kişilik bir ekip için karmaşık bir model gerekli değildir. Ancak basit bir uygunluk puanı (sektör, büyüklük, unvan) bile kimin önce aranacağı konusunda ciddi zaman kazandırır. Lead hacmi arttığında ilgi puanını ve otomasyonları eklemek, sistemi sıfırdan kurmaktan çok daha kolay olur.

### Lead puanlama modeli ne sıklıkla güncellenmeli?

Model çeyrekte bir gözden geçirilmeli ve her seferinde en fazla 2-3 kriter değiştirilmelidir. Ürüne yeni bir segment eklendiğinde, fiyatlandırma değiştiğinde ya da yeni bir pazara girildiğinde ise çeyrek sonunu beklemeden güncelleme yapılmalıdır. Puan bantlarına göre dönüşüm oranları, güncellemenin gerekip gerekmediğini gösteren en net göstergedir.

## Sonuç

Lead puanlama, satış ekibinin en kıt kaynağı olan zamanın doğru lead'lere harcanmasını sağlayan basit bir disiplindir. İdeal müşteri profilinizi yazıya dökün, geçmiş kazanılan anlaşmalardan kriterlerinizi çıkarın, uygunluk ve ilgiyi ayrı ayrı puanlayın, negatif puan ve erimeyi eklemeyi unutmayın. Ardından eşikleri ekip kapasitenize göre ayarlayın. Yukarıdaki 100 puanlık şablonu kendi sektörünüze uyarlayarak bir hafta içinde ilk versiyonu kurabilirsiniz. Gerisi, çeyrekten çeyreğe ölçüp düzeltmektir.

CRM'inizde lead puanlama modelini kurarken ya da outbound ekibinizin hedef listesini önceliklendirirken bir dış göz isterseniz, [benimle iletişime geçebilirsiniz](/tr). Modelinizi birlikte gözden geçirip ekibinize uygun hâle getirmekten memnuniyet duyarım.
