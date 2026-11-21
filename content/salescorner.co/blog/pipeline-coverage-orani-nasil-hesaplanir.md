---
title: "Pipeline Coverage Oranı Nasıl Hesaplanır? Formül ve Örnek"
description: "Pipeline coverage oranı, satış hedefine ulaşmak için yeterli fırsatın olup olmadığını gösterir. Formülü ve adım adım örnek hesabıyla açıklıyoruz."
date: "2026-11-22"
category: "Pipeline"
image: "https://images.pexels.com/photos/39204822/pexels-photo-39204822.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Pipeline Coverage Oranı Nasıl Hesaplanır? Formül ve Örnek"
alt: "how-to-calculate-pipeline-coverage-ratio"
---

Pipeline coverage oranı, belirli bir dönemde kapanması beklenen **açık pipeline değerinin, aynı dönemin satış hedefine (kotasına) bölünmesiyle** hesaplanır. Formül şudur: **Pipeline Coverage = Dönem İçindeki Açık Pipeline Değeri ÷ Dönemin Kalan Kotası**. Örneğin çeyrek hedefiniz 4.500.000 TL ise ve bu çeyrekte kapanma tarihi olan açık fırsatlarınızın toplamı 13.500.000 TL ise, coverage oranınız **3x** olur. Yani hedefin üç katı kadar fırsat pipeline'da bekliyor demektir.

Bu oran tek başına "hedefe ulaşacak mıyız?" sorusunu cevaplamaz. Ama "hedefe ulaşmak için yeterli malzememiz var mı?" sorusuna hızlı ve güçlü bir cevap verir. Bu yazıda formülün farklı versiyonlarını, adım adım hesaplamayı, gerçekçi bir sayısal örneği, ideal oranın kendi verinizden nasıl çıkarılacağını ve en sık yapılan hataları ele alıyoruz.

## Pipeline coverage oranı nedir ve neden önemlidir?

Pipeline coverage, satış ekibinin önündeki fırsat hacminin hedefe göre ne kadar "yastık" sağladığını gösteren bir oran metriğidir. Satışta her fırsat kazanılmaz. Bir kısmı kaybedilir, bir kısmı ertelenir, bir kısmı da sessizce ölür. Bu nedenle 1 TL'lik hedef için pipeline'da yalnızca 1 TL'lik fırsat bulunması, neredeyse kesin bir hedef kaçırma anlamına gelir.

Coverage oranının değeri, bir **öncü gösterge** olmasından gelir. Kapanan satış rakamı geçmişi anlatır. Coverage ise birkaç hafta veya ay sonra ne olacağına dair erken bir sinyal verir. Çeyreğin başında coverage düşükse hâlâ müdahale etmek için zamanınız vardır. Outbound'u hızlandırabilir, takılan fırsatları canlandırabilir ya da hedefi revize etme konuşmasını erkenden başlatabilirsiniz. Çeyreğin son haftasında fark edilen bir açık ise genellikle kapatılamaz.

Coverage özellikle şu kararlarda işe yarar:

- **Kaynak planlama:** Daha fazla SDR mı, daha fazla kampanya mı gerekiyor?
- **Tahmin güvenilirliği:** Forecast'teki rakam gerçekçi bir fırsat hacmine mi dayanıyor?
- **Temsilci koçluğu:** Hangi temsilcinin pipeline'ı hedefini taşıyamayacak kadar ince?
- **Pazarlama-satış uyumu:** Pazarlamanın üretmesi gereken fırsat hacmi ne kadar olmalı?

## Pipeline coverage formülü nedir?

Pratikte üç farklı versiyon kullanılır. Hangisini kullandığınızı ekip içinde netleştirmek, "bizim coverage 3x" cümlesinin herkes için aynı anlama gelmesini sağlar.

### 1. Temel formül

**Pipeline Coverage = Dönem İçindeki Açık Pipeline ÷ Dönem Kotası**

En basit versiyondur. Çeyreğin başında, henüz hiçbir satış kapanmamışken kullanılır.

### 2. Kalan kotaya göre formül (önerilen)

**Pipeline Coverage = Dönem İçindeki Açık Pipeline ÷ (Dönem Kotası − Kapanmış Satış)**

Çeyreğin ortasında temel formül yanıltıcı olur. Kapanan satışlar pipeline'dan çıktığı için oran düşüyor gibi görünür, oysa hedefin bir kısmı zaten gerçekleşmiştir. Bu yüzden payda olarak **kalan kotayı** kullanmak daha doğrudur. Bu yazıdaki örneklerde bu versiyonu kullanacağız.

### 3. Ağırlıklı (weighted) coverage

**Ağırlıklı Coverage = Σ (Fırsat Değeri × Aşama Olasılığı) ÷ Kalan Kota**

Her fırsatın değeri, bulunduğu aşamanın tarihsel kazanma olasılığıyla çarpılır. Ham coverage "yeterli malzeme var mı?" sorusunu cevaplar. Ağırlıklı coverage ise "bu malzemeden beklenen sonuç hedefi karşılıyor mu?" sorusuna yaklaşır. Ağırlıklı coverage'ın 1x'e yakın veya üstünde olması, hedefin istatistiksel olarak ulaşılabilir olduğuna işaret eder.

## Pipeline coverage adım adım nasıl hesaplanır?

Formül basit olsa da hesaplamanın güvenilirliği, hangi fırsatları dahil ettiğinize bağlıdır. Aşağıdaki adımları sırayla uygulayın.

1. **Dönemi belirleyin.** Coverage her zaman belirli bir dönem için hesaplanır: bu ay, bu çeyrek ya da gelecek çeyrek. Dönemsiz bir "toplam pipeline ÷ yıllık hedef" hesabı çok az şey söyler.

2. **Kapanma tarihine göre filtreleyin.** Yalnızca beklenen kapanma tarihi seçtiğiniz dönem içinde kalan fırsatları alın. Gelecek çeyrekte kapanacak bir fırsat, bu çeyreğin hedefine katkı sağlamaz.

3. **Yalnızca nitelikli aşamaları dahil edin.** "Lead", "ilk temas" veya "toplantı talep edildi" gibi henüz nitelendirilmemiş kayıtlar coverage'ı şişirir. Genellikle en az bir keşif görüşmesi yapılmış ve temel niteleme kriterlerini geçmiş fırsatlar dahil edilir. Bu sınırı netleştirmek için [satış pipeline aşamalarının net giriş-çıkış kriterleriyle tanımlanması](/blog/satis-pipeline-asamalari-nasil-tanimlanir) şarttır.

4. **Kapanmış ve kaybedilmiş fırsatları çıkarın.** Pay yalnızca açık fırsatlardan oluşur. Kazanılanlar paydadan düşülür, kaybedilenler tamamen dışarıda kalır.

5. **Kalan kotayı hesaplayın.** Dönem kotasından o ana kadar kapanmış satış tutarını çıkarın.

6. **Bölün ve kaydedin.** Açık pipeline toplamını kalan kotaya bölün. Sonucu tarih damgasıyla kaydedin. Coverage'ın asıl değeri, haftalık trendinde ortaya çıkar.

7. **Kırılımlara ayırın.** Aynı hesabı temsilci, segment, ürün ve kaynak (inbound/outbound/partner) bazında da yapın. Toplam coverage sağlıklı görünürken tek bir temsilcinin veya segmentin ciddi açık verdiğini ancak böyle görebilirsiniz.

## Sayısal örnek: Bir B2B yazılım ekibinin çeyrek hesabı

Varsayımsal bir B2B SaaS şirketi düşünelim. Üç kişilik bir satış ekibi var ve çeyreğin altıncı haftasındayız.

- Çeyrek kotası: **6.000.000 TL**
- Çeyrek içinde şimdiye kadar kapanan satış: **1.500.000 TL**
- Kalan kota: 6.000.000 − 1.500.000 = **4.500.000 TL**
- Bu çeyrekte kapanma tarihi olan açık, nitelikli fırsatların toplamı: **12.600.000 TL**

**Coverage = 12.600.000 ÷ 4.500.000 = 2,8x**

İlk bakışta "3x civarı, fena değil" denebilir. Ama bu rakamın yeterli olup olmadığı, ekibin kazanma oranına bağlıdır.

### Kazanma oranıyla karşılaştırma

Şirketin son dört çeyrekteki **değer bazlı kazanma oranı %25** olsun. Yani pipeline'a giren her 100 TL'lik fırsatın ortalama 25 TL'si kazanılıyor. Bu durumda gereken minimum coverage:

**Gereken Coverage = 1 ÷ Kazanma Oranı = 1 ÷ 0,25 = 4x**

Kalan 4.500.000 TL'lik kotayı karşılamak için gereken pipeline: 4.500.000 × 4 = **18.000.000 TL**

Mevcut pipeline: 12.600.000 TL
**Pipeline açığı: 18.000.000 − 12.600.000 = 5.400.000 TL**

Yani ekip mevcut kazanma oranıyla devam ederse, kalan dönemde yaklaşık 3.150.000 TL (12.600.000 × 0,25) kapatması beklenir. Bu da hedefin 1.350.000 TL gerisinde kalmak demektir. 2,8x'lik oran rahatlatıcı görünse de bu ekip için yetersizdir.

### Ağırlıklı coverage ile ikinci kontrol

Aynı 12.600.000 TL'lik pipeline'ı aşamalara göre ayıralım. Olasılıklar, şirketin kendi tarihsel aşama dönüşüm verisinden alınmış olsun:

| Aşama | Açık Değer | Aşama Olasılığı | Ağırlıklı Değer |
|---|---|---|---|
| Keşif / Niteleme | 4.000.000 TL | %10 | 400.000 TL |
| Çözüm Sunumu | 3.600.000 TL | %25 | 900.000 TL |
| Teklif | 3.000.000 TL | %50 | 1.500.000 TL |
| Müzakere | 2.000.000 TL | %75 | 1.500.000 TL |
| **Toplam** | **12.600.000 TL** | | **4.300.000 TL** |

**Ağırlıklı Coverage = 4.300.000 ÷ 4.500.000 = 0,96x**

Ağırlıklı yöntem, basit kazanma oranı hesabından daha iyimser bir tablo çiziyor. Çünkü pipeline'ın önemli bir kısmı ileri aşamalarda. Yine de oran 1x'in altında. Bu da "en iyi ihtimalle sınırda" bir çeyrek anlamına gelir. İki yöntemin birlikte okunması, tek bir rakama güvenmekten çok daha sağlıklıdır.

### Temsilci bazlı kırılım

Aynı tabloyu temsilcilere bölelim. Her temsilcinin kalan kotası 1.500.000 TL olsun:

- **Temsilci A:** 6.000.000 TL pipeline → **4,0x**
- **Temsilci B:** 2.400.000 TL pipeline → **1,6x**
- **Temsilci C:** 4.200.000 TL pipeline → **2,8x**

Toplam 2,8x'lik oran, aslında ciddi bir dengesizliği gizliyor. Temsilci A hedefini rahatça taşıyabilir. Temsilci B'nin ise mevcut kazanma oranıyla hedefin yarısına bile ulaşması zor. Yönetici için doğru aksiyon, tüm ekibe "daha fazla fırsat açın" demek değil. B ile birebir bir pipeline üretim planı yapmak ve gerekirse A'nın taşıyamayacağı fırsatların yeniden dağıtımını değerlendirmektir.

## İdeal pipeline coverage oranı kaç olmalı?

B2B satışta sıkça duyulan genel kural **3x**'tir. Ancak bu kural yalnızca kazanma oranı yaklaşık %33 olan ekipler için doğrudur. Doğru hedef oran, kendi verinizden çıkarılmalıdır.

### Kazanma oranından hedef coverage'ı türetin

Temel mantık basittir: **Hedef Coverage ≈ 1 ÷ Değer Bazlı Kazanma Oranı**

- Kazanma oranı %50 → yaklaşık 2x yeterli
- Kazanma oranı %33 → yaklaşık 3x
- Kazanma oranı %25 → yaklaşık 4x
- Kazanma oranı %20 → yaklaşık 5x

Burada önemli bir ayrıntı var: Kazanma oranını **adet bazında değil, değer bazında** hesaplayın. Küçük fırsatları sık kazanıp büyükleri kaybeden bir ekipte adet bazlı kazanma oranı %40, değer bazlı oran ise %20 olabilir. Coverage TL üzerinden hesaplandığı için kazanma oranı da TL üzerinden olmalıdır.

### Kayma (slippage) payını ekleyin

Bazı fırsatlar kaybedilmez ama bir sonraki döneme kayar. Tarihsel verinize göre dönem içi fırsatların belirli bir kısmı sürekli kayıyorsa, hedef coverage'ı buna göre artırın. Örneğin kazanma oranınız %25 ve fırsatların %20'si düzenli olarak sonraki çeyreğe kayıyorsa:

**Hedef Coverage = 1 ÷ (0,25 × 0,80) = 5x**

Kazanma oranınızı hesaplarken kaymaları zaten "kaybedildi" sayıyorsanız bu düzeltmeyi yapmayın. Aksi hâlde aynı etkiyi iki kez hesaba katarsınız.

### Dönemin neresinde olduğunuza göre yorumlayın

Çeyreğin ilk haftasındaki 3x ile son haftasındaki 3x aynı şey değildir. Çeyrek başında pipeline'ın büyük kısmı erken aşamalardadır ve dönem içinde yeni fırsatlar da eklenecektir. Çeyrek sonuna doğru ise yeni fırsat eklenmesi pek mümkün değildir ve kalan fırsatların çoğu ileri aşamada olmalıdır. Bu yüzden pek çok ekip iki farklı coverage takip eder:

- **Mevcut dönem coverage'ı:** Bu çeyrekte kapanacak fırsatlar ÷ kalan kota
- **Gelecek dönem coverage'ı:** Gelecek çeyrekte kapanacak fırsatlar ÷ gelecek çeyreğin kotası

Satış döngünüz 60-90 gün sürüyorsa, gelecek çeyreğin pipeline'ı büyük ölçüde bu çeyrekte oluşur. Çeyreğin ortasında gelecek dönem coverage'ı hâlâ 1x'in altındaysa, bu sizin için asıl alarm sinyalidir.

## Pipeline coverage hesaplarken en sık yapılan hatalar nelerdir?

### Ölü fırsatları pipeline'da tutmak

Aylardır hareketsiz duran, müşteriden yanıt alınamayan ama "kaybedildi" olarak işaretlenmeyen fırsatlar coverage'ı yapay olarak şişirir. 3x görünen bir pipeline, temizlendiğinde 2x'e inebilir. Hareketsiz fırsatları düzenli olarak ayıklamak için [pipeline'da takılan fırsatları tespit etme yöntemlerini](/blog/pipelinede-takilan-firsatlar-tespit) rutin bir kontrol hâline getirin.

### Kapanma tarihlerini gerçekçi tutmamak

Temsilciler bazen fırsatların kapanma tarihini "bu çeyrek" olarak bırakır, çünkü aksi hâlde kendi coverage'ları düşük görünür. Bunun tersi de olur: Riskli fırsatlar bilinçli olarak gelecek döneme itilir. Kapanma tarihinin, müşteriyle teyit edilmiş bir satın alma takvimine dayanması gerektiği kuralını koyun.

### Nitelenmemiş kayıtları dahil etmek

CRM'deki her kayıt bir fırsat değildir. Yalnızca form doldurmuş bir lead'i 500.000 TL'lik fırsat olarak pipeline'a eklemek, coverage'ı anlamsız kılar. Hangi aşamadan itibaren coverage'a dahil edileceğini yazılı olarak tanımlayın.

### Fırsat değerlerini tahmini bırakmak

Erken aşamada girilen "yaklaşık" değerler genellikle iyimserdir. Teklif aşamasına gelene kadar değerin nasıl tahmin edileceğine dair bir standart belirleyin. Örneğin segment bazlı ortalama anlaşma büyüklüğünü varsayılan değer olarak kullanabilirsiniz.

### Tek bir anlık görüntüye bakmak

Pazartesi 3,2x, perşembe 2,6x. Hangisi doğru? İkisi de. Coverage'ın asıl bilgisi trendindedir. Haftalık olarak aynı gün ve saatte alınan değerleri karşılaştırın. Düşüşün kaynağını (kazanılan, kaybedilen, kayan fırsatlar) ayrı ayrı izleyin. Bu karşılaştırmayı her hafta ekip önünde yapmak, [pipeline toplantısını gündem odaklı ve verimli yönetmenin](/blog/pipeline-toplantisi-nasil-yonetilir-gundem-ornegi) en pratik yollarından biridir.

### Coverage'ı tek başına başarı göstergesi saymak

Yüksek coverage her zaman iyi değildir. 8x gibi çok yüksek bir oran, temsilcilerin fırsatları yeterince elemediğini, nitelemenin zayıf olduğunu ya da kazanma oranının ciddi şekilde düştüğünü gösterebilir. Coverage'ı her zaman kazanma oranı ve ortalama satış döngüsüyle birlikte okuyun.

## Coverage düşükse ne yapmalı?

Yukarıdaki örnekte ekip 5.400.000 TL'lik bir pipeline açığıyla karşı karşıyaydı. Bu tür bir açığı kapatmanın üç ana yolu vardır. Bunları genellikle birlikte kullanmak gerekir.

### 1. Yeni fırsat üretimini artırın

Satış döngünüz kısaysa, dönem içinde açılan yeni fırsatlar hâlâ bu çeyreğe yetişebilir. Gereken fırsat sayısını hesaplamak için açığı ortalama anlaşma büyüklüğüne bölün. Ortalama anlaşma 300.000 TL ise 5.400.000 TL'lik açık için yaklaşık **18 yeni nitelikli fırsat** gerekir. Toplantıdan fırsata dönüşüm oranınız %50 ise bu, yaklaşık 36 keşif toplantısı demektir. Bu sayıyı geriye doğru outbound aktivitesine çevirdiğinizde haftalık hedefler somutlaşır.

Mevcut ekibin kapasitesi bu hacmi üretmeye yetmiyorsa, dış destek mantıklı bir seçenek olabilir. Örneğin B2B yazılım şirketleri için [SAAS Corner'ın outbound satış ve lead generation hizmeti](https://saascorner.co), toplantı üretimini ekip kapasitesinden bağımsız olarak ölçeklendirmenin bir yoludur.

### 2. Mevcut pipeline'ın dönüşümünü artırın

Yeni fırsat açmak zaman alır. Mevcut fırsatların kazanma oranını birkaç puan artırmak ise çoğu zaman daha hızlı sonuç verir. Teklif ve müzakere aşamasındaki fırsatlar için karar vericiye erişim, yazılı bir ortak eylem planı ve net bir sonraki adım olup olmadığını tek tek kontrol edin. Örnekteki ekip kazanma oranını %25'ten %30'a çıkarabilseydi, aynı 12.600.000 TL'lik pipeline'dan beklenen kapanış 3.780.000 TL'ye yükselirdi.

### 3. Döngüyü hızlandırın

Kayma oranı yüksekse sorun fırsat sayısında değil, hızdadır. Hangi aşamada fırsatların en uzun süre beklediğini bulun ve o aşamadaki darboğazı çözün. Coverage ile hız birbirini tamamlar. [Pipeline hızının formülü ve hesaplanması](/blog/pipeline-hizi-nasil-hesaplanir) konusunu da coverage ile birlikte izlemek, açığın kaynağını daha net görmenizi sağlar.

## Coverage, satış tahmininde nasıl kullanılır?

Coverage ile forecast birbirine karıştırılmamalıdır. Coverage "ne kadar malzememiz var?" sorusunu sorar. Forecast ise "bu malzemeden ne kadar sonuç çıkacak?" sorusunu sorar. Yine de ikisi arasında güçlü bir bağ vardır.

Temsilcinin taahhüt ettiği rakam (commit) ile coverage arasında tutarsızlık varsa, bu bir uyarıdır. Örneğin bir temsilci kalan kotasının tamamını getireceğini söylüyor, ama coverage'ı 1,6x ve kazanma oranı %25 ise, bu taahhüdün arkasındaki varsayımları sorgulamak gerekir. Coverage, tahmin görüşmelerinde objektif bir referans noktası sağlar. Pipeline verisinden daha sağlam rakamlara ulaşmak için [gerçekçi satış tahmini yapma yöntemlerini](/blog/satis-tahmini-nasil-yapilir) coverage analiziyle birleştirmenizi öneririz.

## Coverage takibini otomasyon ve yapay zekayla nasıl kolaylaştırırsınız?

Manuel coverage hesabı, CRM'den haftalık rapor çekip tabloda işlemekten ibarettir. Bu işe yarar ama iki sorunu vardır: Zaman alır ve hesaplamanın dayandığı veri kalitesini sorgulamaz. Otomasyon her iki soruna da çözüm sunar.

- **Otomatik haftalık rapor:** Her pazartesi sabahı temsilci, segment ve dönem bazlı coverage değerlerinin, önceki haftayla farkı ve kalan açıkla birlikte ekibe gönderilmesi.
- **Veri hijyeni uyarıları:** Kapanma tarihi geçmiş ama hâlâ açık olan, belirli bir süredir aktivite görmemiş ya da değeri boş bırakılmış fırsatların temsilciye otomatik bildirilmesi.
- **Eşik bazlı alarmlar:** Bir temsilcinin coverage'ı hedef oranın altına düştüğünde yöneticiye bildirim gitmesi.
- **Yapay zeka destekli risk skorlaması:** E-posta yanıt sıklığı, toplantı katılımı ve karar verici etkileşimi gibi sinyallerle fırsatların gerçek kazanma olasılığının tahmin edilmesi. Bu yaklaşım, aşama bazlı sabit olasılıklardan daha isabetli bir ağırlıklı coverage hesaplamaya yardımcı olabilir.

Bu otomasyonların değeri yalnızca zaman kazandırması değildir. Coverage'ı "çeyrek sonunda bakılan bir rakam" olmaktan çıkarıp her hafta yönetilen bir göstergeye dönüştürmesidir.

## Sık sorulan sorular

### Pipeline coverage oranı ile pipeline değeri arasındaki fark nedir?

Pipeline değeri, açık fırsatların toplam TL tutarıdır. Coverage oranı ise bu tutarın dönemin kalan kotasına oranıdır. 10.000.000 TL'lik bir pipeline, kotası 2.000.000 TL olan bir ekip için 5x, kotası 10.000.000 TL olan bir ekip için 1x coverage anlamına gelir. Bu yüzden coverage, pipeline değerini hedefle ilişkilendirdiği için çok daha anlamlıdır.

### 3x pipeline coverage her şirket için yeterli mi?

Hayır. 3x kuralı yaklaşık %33'lük bir değer bazlı kazanma oranını varsayar. Kazanma oranınız %20 ise 5x'e, %50 ise yaklaşık 2x'e ihtiyacınız vardır. Hedef oranınızı kendi tarihsel kazanma ve kayma oranlarınızdan türetmelisiniz.

### Pipeline coverage ne sıklıkla hesaplanmalı?

Çoğu B2B ekip için haftalık hesaplama idealdir. Haftalık takip, trendi görmeye ve açıklara dönem bitmeden müdahale etmeye yetecek sıklıktadır. Satış döngüsü çok kısa olan ekipler daha sık bakabilir. Uzun döngülü kurumsal satışta ise haftalık takip yine önerilir, ancak gelecek dönem coverage'ına daha fazla ağırlık verilmelidir.

### Ağırlıklı coverage mı, ham coverage mı kullanılmalı?

İkisini birlikte kullanmak en sağlıklısıdır. Ham coverage, hedef için yeterli fırsat hacmi olup olmadığını hızlıca gösterir. Ağırlıklı coverage ise pipeline'ın aşama dağılımını hesaba katarak beklenen sonuca daha yakın bir tablo çizer. Ham oran yüksek ama ağırlıklı oran düşükse, pipeline'ınızın büyük kısmı erken aşamalarda birikmiş demektir.

## Sonuç

Pipeline coverage oranı, satış hedefinize ulaşmak için yeterli fırsat hacmine sahip olup olmadığınızı gösteren en pratik öncü göstergelerden biridir. Hesaplaması basittir: **dönem içindeki açık pipeline ÷ kalan kota**. Asıl değeri ise doğru uygulandığında ortaya çıkar. Bunun için yalnızca nitelikli ve dönem içi fırsatları dahil etmek, hedef oranı kendi kazanma oranınızdan türetmek, temsilci ve segment bazında kırılım yapmak ve sonucu her hafta trend olarak izlemek gerekir.

Örnekte gördüğümüz gibi, 2,8x gibi "iyi görünen" bir rakam, kazanma oranıyla birlikte okunduğunda milyonlarca liralık bir açığı gizleyebilir. Bu açığı erken görmek, onu kapatmak için gereken zamanı kazanmak demektir.

Coverage takibini otomatikleştirmek, pipeline verinizi temizlemek ya da açığı kapatacak outbound iş akışlarını kurmak istiyorsanız, Sales Corner olarak yapay zeka destekli satış otomasyonlarıyla yardımcı olabiliriz. Mevcut pipeline yapınızı birlikte değerlendirmek için [bizimle bir görüşme planlayın](/iletisim).
