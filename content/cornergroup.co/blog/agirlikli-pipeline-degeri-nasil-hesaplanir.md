---
title: "Ağırlıklı Pipeline Değeri Nasıl Hesaplanır? KOBİ Rehberi"
description: "Pipeline'daki fırsatların değerini aşama olasılıklarıyla çarparak gerçekçi satış tahmini nasıl yapılır? KOBİ'ler için adım adım formül ve örnek."
date: "2026-11-18"
category: "Strateji"
image: "https://images.pexels.com/photos/7580792/pexels-photo-7580792.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Ağırlıklı Pipeline Değeri Nasıl Hesaplanır? KOBİ Rehberi"
alt: "how-to-calculate-weighted-pipeline-value"
---

Ağırlıklı pipeline değeri, **satış hattındaki her fırsatın tutarının o fırsatın kapanma olasılığıyla çarpılıp bu sonuçların toplanmasıyla** hesaplanır. Formül kısaca şöyledir: **Ağırlıklı Pipeline = Σ (Fırsat Tutarı × Aşama Kapanma Olasılığı)**. Örneğin teklif aşamasındaki 100.000 TL'lik bir fırsatın kapanma olasılığı %60 ise, bu fırsat ağırlıklı pipeline'a 60.000 TL olarak yansır.

Bu metrik, "pipeline'ımızda 2 milyon TL var" gibi iyimser ama yanıltıcı cümlelerin yerine "bu çeyrekte gerçekçi olarak 750.000 TL kapatmayı bekliyoruz" diyebilmenizi sağlar. KOBİ'ler için ağırlıklı pipeline, nakit akışı planlaması, işe alım kararları ve satış kotası belirleme açısından en pratik tahmin araçlarından biridir. Aşağıda formülün mantığını, aşama olasılıklarını kendi verinizden nasıl çıkaracağınızı, adım adım bir hesaplama örneğini, sık yapılan hataları ve CRM'de nasıl otomatikleştireceğinizi bulacaksınız.

## Ağırlıklı pipeline değeri nedir, ham pipeline'dan farkı ne?

Ham pipeline (ya da toplam pipeline), açık tüm fırsatların tutarlarının düz toplamıdır. İlk görüşmesi yapılmış ama henüz ihtiyacı netleşmemiş bir müşteri adayı da, sözleşmesi hukuk departmanında bekleyen bir müşteri de aynı ağırlıkla sayılır. Sonuç olarak ham pipeline neredeyse her zaman gerçekleşecek satıştan çok daha büyük görünür.

Ağırlıklı pipeline ise her fırsatı, satış sürecinde ne kadar ilerlediğine göre "indirir". Erken aşamadaki fırsatlar düşük, geç aşamadaki fırsatlar yüksek bir olasılıkla çarpılır. Böylece ortaya, geçmiş performansınıza dayanan, **gerçekleşmesi beklenen gelir** çıkar.

İki metrik arasındaki farkı şöyle düşünebilirsiniz:

- **Ham pipeline** şu soruyu yanıtlar: "Masada ne kadar potansiyel var?"
- **Ağırlıklı pipeline** şu soruyu yanıtlar: "Bu potansiyelin ne kadarının gerçekleşmesini makul olarak bekleyebiliriz?"

İkisi birlikte kullanıldığında anlamlıdır. Ham pipeline hacmi gösterir, ağırlıklı pipeline ise kaliteyi ve gerçekçiliği.

## KOBİ'ler için neden bu kadar önemli?

Büyük şirketlerde tahminleme için ayrı ekipler, gelişmiş modeller ve yıllara yayılan veri setleri bulunur. KOBİ'lerde ise çoğu zaman satış müdürü ya da doğrudan şirket sahibi "içimden gelen his" ile tahmin yapar. Ağırlıklı pipeline, bu hissi basit ve tekrarlanabilir bir hesaba dönüştürür.

Pratik faydaları şunlardır:

- **Nakit akışı planlaması:** Önümüzdeki 90 günde ne kadar faturanın kesileceğini daha gerçekçi öngörürsünüz.
- **İşe alım ve yatırım kararları:** Yeni bir satış temsilcisi ya da pazarlama bütçesi için "pipeline yeterli mi?" sorusunu rakamla yanıtlarsınız.
- **Kota ile kıyaslama:** Hedefe ne kadar uzak olduğunuzu dönem başında görürsünüz, dönem sonunda değil.
- **Erken uyarı:** Ağırlıklı pipeline haftadan haftaya düşüyorsa, sorun satış rakamlarına yansımadan önce fark edilir.
- **Temsilci koçluğu:** Hangi temsilcinin pipeline'ının "şişkin" olduğunu, hangisinin gerçekçi fırsatlarla çalıştığını görürsünüz.

## Ağırlıklı pipeline nasıl hesaplanır? Temel formül

Formülün kendisi basittir:

**Ağırlıklı Pipeline Değeri = (Fırsat 1 Tutarı × Olasılık 1) + (Fırsat 2 Tutarı × Olasılık 2) + … + (Fırsat N Tutarı × Olasılık N)**

Burada iki değişken vardır:

1. **Fırsat tutarı:** Kazanılması halinde elde edilecek beklenen gelir (tek seferlik satış tutarı, yıllık sözleşme değeri ya da sizin tanımladığınız standart bir değer).
2. **Kapanma olasılığı:** Fırsatın bulunduğu aşamadan "kazanıldı" durumuna geçme ihtimali.

Hesabın zor kısmı formül değil, bu iki değişkenin doğru belirlenmesidir. Tutarlar abartılıysa ya da olasılıklar keyfi seçilmişse, çıkan sonuç da güvenilmez olur.

### Basit bir örnek tablo

Diyelim ki küçük bir B2B yazılım firmasının satış hattında şu altı açık fırsat var ve aşama olasılıkları şöyle tanımlanmış: Keşif %10, İhtiyaç Analizi %20, Demo %40, Teklif %60, Müzakere %80.

| Fırsat | Tutar | Aşama | Olasılık | Ağırlıklı Değer |
|---|---|---|---|---|
| Fırsat 1 | 120.000 TL | Müzakere | %80 | 96.000 TL |
| Fırsat 2 | 250.000 TL | Teklif | %60 | 150.000 TL |
| Fırsat 3 | 80.000 TL | Demo | %40 | 32.000 TL |
| Fırsat 4 | 400.000 TL | İhtiyaç Analizi | %20 | 80.000 TL |
| Fırsat 5 | 150.000 TL | Keşif | %10 | 15.000 TL |
| Fırsat 6 | 60.000 TL | Teklif | %60 | 36.000 TL |
| **Toplam** | **1.060.000 TL** | | | **409.000 TL** |

Ham pipeline 1.060.000 TL görünürken, ağırlıklı pipeline 409.000 TL'dir. Aradaki fark büyük ölçüde Fırsat 4'ten gelir: 400.000 TL'lik bu fırsat ham toplamın yaklaşık %38'ini oluştururken, henüz erken aşamada olduğu için ağırlıklı toplama yalnızca 80.000 TL katkı yapar.

Bu firmanın çeyreklik kotası 600.000 TL ise, ağırlıklı pipeline'a göre yaklaşık **191.000 TL'lik bir açık** vardır. Bu açığı kapatmak için ya mevcut fırsatları hızla ilerletmek ya da yeni fırsat üretmek gerekir.

## Aşama olasılıkları nereden gelir?

KOBİ'lerin en sık yaptığı hata, CRM'in varsayılan olasılıklarını (örneğin %10, %20, %40, %60, %80) hiç sorgulamadan kullanmaktır. Bu oranlar başlangıç için kabul edilebilir ama sizin satış sürecinizi yansıtmaz. Doğru yaklaşım, olasılıkları **kendi geçmiş verinizden** hesaplamaktır.

### Geçmiş veriden olasılık hesaplama

Yöntem şudur: Son 6-12 ayda belirli bir aşamaya ulaşmış ve sonuçlanmış (kazanılmış ya da kaybedilmiş) fırsatları alın. Bunların kaçının kazanıldığını bulun.

**Aşama Olasılığı = O aşamaya ulaşıp kazanılan fırsat sayısı ÷ O aşamaya ulaşıp sonuçlanan toplam fırsat sayısı**

Örnek bir 12 aylık veri:

- Keşif aşamasına giren ve sonuçlanan fırsat: 200, kazanılan: 30 → **%15**
- İhtiyaç analizine ulaşan: 120, kazanılan: 30 → **%25**
- Demo aşamasına ulaşan: 80, kazanılan: 30 → **%37,5**
- Teklif aşamasına ulaşan: 50, kazanılan: 30 → **%60**
- Müzakereye ulaşan: 36, kazanılan: 30 → **yaklaşık %83**

Dikkat edin: Kazanılan 30 fırsatın tamamı zaten tüm aşamalardan geçmiştir. Bu yüzden her aşamada pay sabit kalır, payda küçülür. Bu tabloya göre CRM'in varsayılan %10'luk keşif oranı bu firma için düşük, %40'lık demo oranı ise biraz iyimserdir.

### Yeterli veriniz yoksa ne yapmalısınız?

Yeni kurulan ya da CRM'e yakın zamanda geçmiş bir KOBİ'de yüzlerce sonuçlanmış fırsat bulunmayabilir. Bu durumda:

1. **Başlangıçta muhafazakâr varsayılanlar kullanın** ve bunları "geçici" olarak işaretleyin.
2. **Her çeyrek sonunda gerçekleşen oranlarla karşılaştırın** ve güncelleyin.
3. **Satış ekibiyle kalibrasyon yapın:** "Teklif verdiğimiz 10 müşteriden kaçı genelde imza atıyor?" sorusu, veri olmadığında bile kaba bir başlangıç noktası sağlar.
4. **En az 30-40 sonuçlanmış fırsata ulaştığınızda** oranları tamamen kendi verinize geçirin.

Excel'den CRM'e yeni geçtiyseniz, eski tablolardaki kazanılan/kaybedilen kayıtları sisteme aşama bilgisiyle aktarmak bu süreci hızlandırır.

## Adım adım ağırlıklı pipeline hesaplama

Aşağıdaki yedi adım, sıfırdan güvenilir bir ağırlıklı pipeline kurmak için yeterlidir.

1. **Satış aşamalarını netleştirin.** Her aşamanın giriş ve çıkış kriteri yazılı olsun. Örneğin "Demo" aşaması, "müşteri ile ürün gösterimi yapıldı ve karar vericilerden en az biri katıldı" şeklinde tanımlanmalı. Belirsiz aşamalar, belirsiz olasılık demektir.
2. **Fırsat tutarı standardını belirleyin.** Yıllık abonelik mi, ilk yıl değeri mi, toplam sözleşme değeri mi? Tüm ekip aynı tanımı kullanmalı.
3. **Geçmiş veriden aşama olasılıklarını hesaplayın.** Yukarıdaki yöntemi uygulayın.
4. **Pipeline'ı temizleyin.** Haftalardır hareket etmeyen, müşteriyle temas kesilmiş fırsatları kapatın. [Ölü fırsatların nasıl temizleneceğini anlattığımız pipeline hijyeni rehberinde](/blog/pipeline-hijyeni-olu-firsatlar-nasil-temizlenir) bu sürecin ayrıntıları var. Temizlenmemiş pipeline'da ağırlıklı değer de şişkin çıkar.
5. **Dönemi filtreleyin.** Tahmin yapacağınız dönemi (ör. bu çeyrek) seçin ve yalnızca beklenen kapanış tarihi bu döneme düşen fırsatları hesaba katın.
6. **Her fırsat için tutar × olasılık hesaplayın ve toplayın.**
7. **Sonucu kota ve önceki haftalarla karşılaştırın.** Tek başına bir rakam, trend ile birlikte okunduğunda anlam kazanır.

## Ağırlıklı pipeline'ı daha gerçekçi yapan düzeltmeler

Temel formül iyi bir başlangıçtır ama bazı düzeltmeler tahmin doğruluğunu belirgin şekilde artırır.

### Zaman (yaş) düzeltmesi

Bir fırsat, bulunduğu aşamada ortalama sürenin çok üzerinde kalıyorsa kapanma olasılığı genellikle düşer. Basit bir kural uygulayabilirsiniz:

- Fırsat, aşamadaki ortalama sürenin **2 katından fazla** bekliyorsa olasılığı **yarıya indirin**.
- **3 katını** aşmışsa fırsatı gözden geçirme listesine alın veya kapatın.

Örneğin teklif aşamasında ortalama bekleme süreniz 14 gün ise, 35 gündür yanıt alamadığınız 250.000 TL'lik bir teklif %60 yerine %30 ile hesaplanmalıdır. Bu, ağırlıklı değeri 150.000 TL'den 75.000 TL'ye düşürür.

### Fırsat büyüklüğü düzeltmesi

Ortalama satış tutarınızın çok üzerindeki fırsatlar genellikle daha uzun sürer ve daha düşük oranla kapanır. Ortalamanızın 3-4 katı büyüklüğündeki fırsatlar için ayrı bir olasılık seti tutmak ya da bu fırsatları ayrıca raporlamak mantıklıdır. Yukarıdaki örnekteki 400.000 TL'lik fırsat bu duruma iyi bir örnektir.

### Kaynak ve segment düzeltmesi

Referansla gelen fırsatlar ile soğuk outbound'dan gelen fırsatların kapanma oranları çoğu zaman farklıdır. Yeterli veriniz varsa olasılıkları kaynak bazında ayırın. Bu, aynı zamanda hangi kanala yatırım yapmanız gerektiğini de gösterir. Kanal maliyetlerini de hesaba katmak isterseniz [B2B lead maliyetinin (CPL) nasıl hesaplandığını anlattığımız rehber](/blog/b2b-lead-maliyeti-cpl-nasil-hesaplanir) iyi bir tamamlayıcıdır.

### Temsilci bazlı kalibrasyon

Bazı temsilciler fırsatları erken aşamalarda ilerletme eğilimindedir, bazıları ise çok temkinlidir. Her temsilcinin geçmişteki tahmini ile gerçekleşen satışını karşılaştırıp bir "doğruluk katsayısı" hesaplayabilirsiniz. Örneğin bir temsilcinin ağırlıklı pipeline'ı geçmişte sistematik olarak %20 fazla çıkıyorsa, bu temsilcinin rakamlarını 0,8 ile çarpmak tahmini iyileştirir.

## Ağırlıklı pipeline ile kota nasıl karşılaştırılır?

Ağırlıklı pipeline'ın en değerli kullanımlarından biri, dönem hedefine ulaşma ihtimalini erkenden görmektir. Burada iki oran işinize yarar.

**Pipeline kapsama oranı (coverage):** Ham pipeline ÷ Kota. Yukarıdaki örnekte 1.060.000 ÷ 600.000 = yaklaşık **1,77x**. Birçok B2B şirketi, ortalama kazanma oranına bağlı olarak 3x ile 4x arasında bir kapsamayı sağlıklı kabul eder. Kazanma oranınız %25 civarındaysa, kotayı tutturmak için kabaca kotanın 4 katı kadar ham pipeline'a ihtiyacınız vardır.

**Ağırlıklı kapsama oranı:** Ağırlıklı pipeline ÷ Kota. Örnekte 409.000 ÷ 600.000 = yaklaşık **%68**. Bu oranın dönem başında %100'ün altında olması tek başına alarm değildir; çünkü dönem içinde yeni fırsatlar açılacak ve mevcut fırsatlar ilerleyecektir. Ancak dönem ortasında hâlâ %70'lerdeyse, kotanın tutturulması zorlaşıyor demektir.

Kotanın kendisi gerçekçi değilse bu karşılaştırmalar da anlamsızlaşır. Hedefi nasıl belirleyeceğinizi [KOBİ'ler için adım adım satış kotası belirleme yöntemini anlattığımız yazıda](/blog/satis-kotasi-nasil-belirlenir-kobi) ayrıntılı ele aldık.

### Açık hesaplama: Ne kadar yeni fırsat gerekir?

Örnekteki 191.000 TL'lik açığı kapatmak için kaç yeni fırsat açılması gerektiğini de hesaplayabilirsiniz. Ortalama fırsat tutarınız 120.000 TL ve keşif aşamasından kazanma oranınız %15 ise, yeni açılan bir fırsatın beklenen değeri 18.000 TL'dir. 191.000 ÷ 18.000 ≈ **11 yeni fırsat**. Satış döngünüz bu dönem içinde kapanmaya yetecek kadar kısaysa, ekibinizin önümüzdeki haftalarda yaklaşık 11 nitelikli yeni fırsat açması gerekir. Döngü uzunsa bu açığın büyük kısmı mevcut fırsatların hızlandırılmasıyla kapatılmalıdır.

Fırsat üretimi tarafında iç kaynaklarınız yetmiyorsa, [B2B SaaS şirketleri için outbound satış ve lead generation hizmeti sunan SAAS Corner](https://saascorner.co) gibi dış ekiplerle pipeline'ın üst kısmını beslemek bir seçenektir.

## En sık yapılan hatalar nelerdir?

Ağırlıklı pipeline basit bir hesap olduğu için hataları da çoğu zaman gözden kaçar. KOBİ'lerde en sık karşılaşılan durumlar şunlardır:

- **Temsilcinin olasılığı elle girmesi:** Olasılık alanı serbest bırakıldığında herkes kendi fırsatına iyimser bakar. Olasılık, aşamaya bağlı ve otomatik olmalıdır. Temsilcinin görüşü ayrı bir "tahmin kategorisi" alanında tutulabilir.
- **Beklenen kapanış tarihinin güncellenmemesi:** Kapanış tarihi geçmiş fırsatlar hâlâ "bu ay" içinde sayılıyorsa tahmin şişer. Tarihi geçmiş her fırsat haftalık olarak güncellenmeli.
- **Tutarların tutarsız girilmesi:** Bir temsilci KDV dahil, diğeri hariç; biri yıllık, diğeri aylık tutar giriyorsa toplam anlamsızdır.
- **Aşama tanımlarının belirsiz olması:** "Teklif" aşaması bir temsilci için "fiyat konuşuldu", diğeri için "resmi teklif gönderildi" anlamına geliyorsa olasılıklar da güvenilmez olur.
- **Olasılıkları hiç güncellememek:** Pazar, ürün ve ekip değişir. Olasılıkları en az çeyrekte bir gözden geçirin.
- **Tek bir büyük fırsata bağımlılık:** Ağırlıklı pipeline'ın %40'ı tek bir fırsattan geliyorsa, o fırsatın kaybedilmesi tüm tahmini çökertir. Bu tür yoğunlaşmaları ayrıca raporlayın.
- **Ağırlıklı değeri satış hedefi gibi kullanmak:** Ağırlıklı pipeline bir tahmindir, söz değildir. Temsilcilerin primini doğrudan bu rakama bağlamak manipülasyona yol açabilir. Komisyon yapısını kurgularken gerçekleşen satışı esas almak daha sağlıklıdır.

## Ağırlıklı pipeline CRM'de nasıl kurulur?

Ağırlıklı pipeline'ı Excel'de hesaplamak mümkündür ama her hafta elle güncellemek zaman alır ve hata riskini artırır. Popüler CRM'lerin çoğu bu hesabı yerleşik olarak yapar.

### HubSpot

HubSpot'ta her deal pipeline aşamasına bir "deal probability" (kazanma olasılığı) atanır. Sistem, "Weighted amount" alanını otomatik hesaplar ve raporlarda kullanılabilir hale getirir. Forecast modülünde temsilcilerin ayrıca kendi tahmin kategorilerini (ör. commit, best case) girmesi mümkündür.

### Pipedrive

Pipedrive'da her aşamaya kazanma olasılığı tanımlanabilir. "Deal probability" özelliği açıldığında, Forecast görünümünde ağırlıklı değerler ay ay listelenir. Görsel pipeline yapısı küçük ekipler için hızlı bir başlangıç sağlar.

### Zoho CRM

Zoho CRM'de "Stage-Probability Mapping" ile her aşama bir olasılıkla eşleştirilir ve "Expected Revenue" alanı otomatik hesaplanır. Bu alan raporlarda ve dashboard'larda doğrudan kullanılabilir.

Hangi aracın sizin süreciniz için uygun olduğuna henüz karar vermediyseniz, [HubSpot ile Pipedrive'ı KOBİ'ler açısından karşılaştırdığımız karar rehberi](/blog/hubspot-mi-pipedrive-mi-kobi-karar-rehberi) seçimi kolaylaştırabilir.

## n8n ve yapay zeka ile ağırlıklı pipeline'ı nasıl otomatikleştirebilirsiniz?

CRM'in yerleşik özellikleri temel hesabı yapar, ancak yukarıda anlattığımız düzeltmeler (yaş, büyüklük, temsilci kalibrasyonu) çoğu zaman ek otomasyon gerektirir. Bu noktada n8n gibi açık kaynaklı bir otomasyon aracı işe yarar.

Örnek bir n8n akışı şöyle kurgulanabilir:

1. **Zamanlayıcı tetikleyici:** Her pazartesi sabahı çalışır.
2. **CRM'den veri çekme:** Açık tüm fırsatları; tutar, aşama, aşamaya giriş tarihi ve beklenen kapanış tarihiyle birlikte API üzerinden alır.
3. **Yaş düzeltmesi:** Aşamada ortalama sürenin 2 katından fazla kalan fırsatların olasılığını yarıya indirir.
4. **Ham ve düzeltilmiş ağırlıklı pipeline hesaplama:** Her iki değeri de temsilci ve dönem bazında hesaplar.
5. **Raporlama:** Sonucu Google Sheets'e yazar ve satış ekibinin kullandığı kanala (Slack, Teams ya da e-posta) özet olarak gönderir.
6. **Uyarı:** Ağırlıklı kapsama oranı belirlediğiniz eşiğin altına düşerse yöneticiye ayrı bir bildirim yollar.

Yapay zeka tarafında ise büyük dil modelleri, fırsat notlarını ve son e-posta yazışmalarını okuyarak "bu fırsatta risk sinyali var mı?" sorusuna destek verebilir. Örneğin müşterinin son yazışmada bütçe dondurmasından bahsetmesi gibi ipuçlarını işaretleyebilir. Ancak burada dikkatli olmak gerekir: Yapay zekanın ürettiği risk skoru, geçmiş verinize dayalı aşama olasılığının yerine geçmemeli, onu tamamlayan bir uyarı katmanı olarak kullanılmalıdır.

## Ağırlıklı pipeline haftalık rutine nasıl bağlanır?

Bir metriğin değeri, düzenli olarak bakılıp karar alınmasından gelir. Ağırlıklı pipeline'ı en verimli kullanmanın yolu, onu haftalık satış toplantısının sabit gündem maddesi yapmaktır.

Önerilen haftalık akış:

- **Toplantı öncesi:** Temsilciler kendi fırsatlarının aşama, tutar ve kapanış tarihlerini günceller. Otomasyon raporu hazırlar.
- **Toplantının ilk 10 dakikası:** Ekip toplamı ham pipeline, ağırlıklı pipeline ve kota karşılaştırması; önceki haftaya göre değişim.
- **Sonraki 20 dakika:** Ağırlıklı değeri en yüksek 5-10 fırsat tek tek konuşulur. "Bir sonraki adım ne, tarih ne?" sorusu her biri için netleştirilir.
- **Son 10 dakika:** Haftalık değişimin nedenleri (yeni açılan, ilerleyen, kaybedilen fırsatlar) ve açığı kapatmak için alınacak aksiyonlar.

Bu toplantının nasıl yapılandırılacağını [KOBİ'ler için haftalık pipeline toplantısı rehberimizde](/blog/haftalik-pipeline-toplantisi-nasil-yapilir) daha ayrıntılı anlattık.

Haftalık trendi izlemek özellikle önemlidir. Örneğin ağırlıklı pipeline'ınız üç hafta üst üste 409.000 TL'den 380.000 TL'ye, ardından 350.000 TL'ye düşüyorsa, kaybedilen fırsatlar yeni fırsatlarla telafi edilmiyor demektir. Bu sinyal, dönem sonunu beklemeden prospecting faaliyetlerini artırmanız gerektiğini gösterir. Veri odaklı satış süreçleri kurma konusunda destek arıyorsanız, [veri odaklı B2B satış ve lead generation alanında çalışan Sales Corner](https://salescorner.co) bu tür yapıların kurulmasında yardımcı olabilir.

## Sık sorulan sorular

### Ağırlıklı pipeline ile satış tahmini aynı şey mi?

Tam olarak aynı değildir. Ağırlıklı pipeline, matematiksel olarak hesaplanan bir beklenen değerdir ve satış tahmininin önemli bir girdisidir. Satış tahmini ise buna ek olarak temsilci görüşleri, mevsimsellik ve yönetici değerlendirmesi gibi faktörleri de içerebilir.

### Aşama olasılıklarını ne sıklıkla güncellemeliyim?

KOBİ'ler için çeyrekte bir güncelleme genellikle yeterlidir. Ürününüzü, fiyatınızı ya da hedef pazarınızı değiştirdiyseniz, değişiklikten sonraki ilk çeyrek sonunda oranları mutlaka yeniden hesaplayın. Oranları her hafta değiştirmek ise trend karşılaştırmasını bozacağı için önerilmez.

### Ağırlıklı pipeline kotanın altındaysa ne yapmalıyım?

Önce açığın büyüklüğünü ve dönemin ne kadarının kaldığını değerlendirin. Satış döngünüz kısaysa yeni fırsat üretimini artırın; döngünüz uzunsa geç aşamadaki fırsatları hızlandırmaya ve tıkanan fırsatlardaki engelleri kaldırmaya odaklanın. Her iki durumda da açığı kaç yeni fırsatın kapatacağını hesaplamak, ekibe somut bir hedef verir.

### Küçük bir ekip için Excel yeterli mi?

Beş ya da daha az temsilcisi ve ayda birkaç düzine fırsatı olan bir ekip için Excel başlangıçta yeterli olabilir. Ancak aşama geçiş tarihlerini tutmak, yaş düzeltmesi yapmak ve geçmiş veriden olasılık hesaplamak elle yapıldığında hızla zorlaşır. Fırsat sayısı arttıkça CRM'e geçmek hem doğruluğu hem de zaman tasarrufunu artırır.

## Sonuç

Ağırlıklı pipeline değeri, her fırsatın tutarını kapanma olasılığıyla çarpıp toplamaktan ibaret basit bir hesaptır; ancak doğru kurulduğunda KOBİ'ler için en güçlü tahmin araçlarından birine dönüşür. Güvenilir sonuç almak için net aşama tanımlarına, kendi geçmiş verinizden hesaplanmış olasılıklara, temiz bir pipeline'a ve düzenli bir haftalık rutine ihtiyacınız var. Yaş, büyüklük ve temsilci bazlı düzeltmeler ise tahmininizi bir adım daha gerçekçi hale getirir.

İlk adım olarak son 12 ayın kapanmış fırsatlarını çıkarıp aşama bazlı kazanma oranlarınızı hesaplayın; bu tek çalışma bile tahminlerinizin ne kadar iyimser ya da gerçekçi olduğunu gösterecektir. Pipeline yapınızı kurmak, CRM'inizde ağırlıklı tahminlemeyi otomatikleştirmek ya da n8n ile raporlama akışları oluşturmak için destek almak isterseniz, [Corner Group ekibiyle iletişime geçin](/iletisim); satış sürecinize uygun bir yol haritasını birlikte çıkaralım.
