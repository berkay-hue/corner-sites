---
title: "Satış Tahmini Nasıl Yapılır? Pipeline'dan Gerçekçi Rakam"
description: "Pipeline verisinden satış tahmini nasıl çıkarılır? Aşama olasılıkları, ağırlıklı değer ve sapma kontrolüyle gerçekçi tahmin için adım adım yöntem."
date: "2026-10-20"
category: "Pipeline"
image: "https://images.pexels.com/photos/7876657/pexels-photo-7876657.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Satış Tahmini Nasıl Yapılır? Pipeline'dan Gerçekçi Rakam"
alt: "sales-forecasting-from-pipeline"
---

Satış tahmini, pipeline'daki her fırsatın **gerçekleşme olasılığını ve kapanış zamanını** kendi tarihsel verinizle ağırlıklandırarak yapılır. Temsilcinin hissi yerine şu üç soruya dayanır: Bu fırsat hangi aşamada, o aşamadan geçmişte yüzde kaçı kazanıldı ve bu fırsatın bu dönem içinde kapanması ne kadar olası? Gerçekçi bir rakama ulaşmak için temiz bir pipeline, net tanımlanmış aşamalar, en az birkaç çeyreklik dönüşüm verisi ve farklı yöntemlerin birbirini kontrol ettiği bir hesaplama düzeni gerekir.

B2B şirketlerin çoğunda tahmin toplantısı aynı şekilde geçer. Temsilciler fırsatlarını tek tek anlatır, yönetici "bunu kapatabilir miyiz?" diye sorar ve sonunda Excel'e iyimser bir rakam girilir. Çeyrek sonunda o rakam tutmaz, bir sonraki çeyrekte de aynı döngü tekrarlanır. Bu yazıda pipeline verisinden yola çıkarak savunulabilir, ölçülebilir ve zamanla daha isabetli hale gelen bir satış tahmini sürecinin nasıl kurulacağını adım adım anlatıyoruz.

## Satış tahmini neden çoğu ekipte tutmaz?

Tahminin tutmaması genellikle formülden kaynaklanmaz. Sorun, formüle giren veridedir. En sık karşılaşılan nedenler şunlardır:

- **Aşamalar keyfi tanımlanmıştır.** "Teklif" aşaması bir temsilci için teklif gönderilmesi, bir başkası için müşterinin fiyat istemesi anlamına gelir. Aynı aşamadaki iki fırsat aslında çok farklı olgunluktadır.
- **Olasılık yüzdeleri uydurmadır.** CRM'in varsayılan ayarlarında gelen yüzde 10, 25, 50, 75, 90 gibi oranlar hiç sorgulanmadan kullanılır. Bu oranlar sizin satış döngünüzü yansıtmaz.
- **Pipeline şişkindir.** Aylardır hareket etmeyen, müşterinin artık yanıt vermediği fırsatlar "açık" kalır ve toplam pipeline'ı olduğundan büyük gösterir.
- **Kapanış tarihleri sürekli ertelenir.** Bir fırsatın kapanış tarihi üç kez bir sonraki aya kaydırılmışsa bu, tahmin açısından ciddi bir uyarı işaretidir. Ancak çoğu ekip bunu izlemez.
- **Temsilci psikolojisi devreye girer.** Bazı temsilciler hedef baskısıyla iyimser davranır, bazıları sürpriz yapmak için rakamı düşük tutar (sandbagging). Her iki durumda da tahmin bozulur.

Bu nedenle iyi bir tahmin süreci önce veri disiplinini kurar, ardından hesaplamaya geçer.

## Satış tahmininde hangi yöntemler kullanılır?

Tek bir "doğru" yöntem yoktur. Olgun satış ekipleri birden fazla yöntemi birlikte kullanır ve aralarındaki farkı tartışır. En yaygın yaklaşımlar şunlardır:

1. **Aşama ağırlıklı (weighted pipeline) tahmin:** Her fırsatın tutarı, bulunduğu aşamanın tarihsel kazanma oranıyla çarpılır. Basit ve hızlıdır, ancak zamanlamayı tek başına hesaba katmaz.
2. **Temsilci beyanına dayalı kategori tahmini:** Fırsatlar "kesin (commit)", "olası (best case)" ve "pipeline" gibi kategorilere ayrılır. Temsilcinin sahadaki bilgisini kullanır, ancak öznel kalabilir.
3. **Tarihsel trend tahmini:** Geçmiş dönemlerin gelir ve büyüme eğilimi bugüne yansıtılır. Olgun ve istikrarlı işlerde iyi çalışır, yeni ürün veya yeni pazarda zayıftır.
4. **Satış hızı (sales velocity) tahmini:** Fırsat sayısı, ortalama işlem tutarı, kazanma oranı ve satış döngüsü süresinden günlük gelir üretim kapasitesi hesaplanır.
5. **Çok değişkenli ve yapay zeka destekli tahmin:** Aktivite verisi, e-posta etkileşimi, karar verici katılımı, fırsat yaşı gibi sinyaller birlikte değerlendirilerek her fırsata ayrı bir olasılık atanır.

Pratikte en sağlıklı sonuç, aşama ağırlıklı tahmini temsilci kategorileriyle karşılaştırmak ve satış hızı hesabıyla kontrol etmektir. Üç yöntem birbirine yakın bir rakam veriyorsa tahmininize güvenebilirsiniz. Aralarında büyük fark varsa bu farkın nedenini bulmak, tahmin toplantısının asıl konusu olmalıdır.

## Pipeline'dan gerçekçi tahmine: adım adım süreç

### 1. Aşamaları çıkış kriterleriyle tanımlayın

Tahminin temeli, her aşamanın ne anlama geldiğinin herkes için aynı olmasıdır. Bir fırsatın bir aşamadan diğerine geçmesi temsilcinin hissine değil, doğrulanabilir bir olaya bağlı olmalıdır. Örneğin:

- **Keşif:** İlk görüşme yapıldı, temel ihtiyaç belirlendi.
- **İhtiyaç analizi / Demo:** Karar vericiyle görüşüldü, bütçe ve zamanlama konuşuldu.
- **Teklif:** Yazılı teklif gönderildi ve müşteri tarafından teslim alındığı teyit edildi.
- **Müzakere:** Müşteri fiyat, kapsam veya sözleşme maddeleri üzerinde aktif olarak pazarlık ediyor.
- **Sözleşme:** Sözleşme hukuk veya satın alma onayında.

Bu tanımları yazılı hale getirmek ve CRM'de zorunlu alanlarla desteklemek gerekir. Aşama tasarımı konusunda daha detaylı bir çerçeve için [satış pipeline aşamalarının nasıl tanımlanacağını anlatan rehberimize](/blog/satis-pipeline-asamalari-nasil-tanimlanir) göz atabilirsiniz.

### 2. Kendi tarihsel dönüşüm oranlarınızı hesaplayın

CRM'in varsayılan yüzdelerini silin ve kendi verinizden yola çıkın. Yöntem basittir: Son 4 ila 6 çeyrekte belirli bir aşamaya ulaşan fırsatları sayın ve bunların kaçının sonunda kazanıldığına bakın.

Örnek: Son dört çeyrekte "Teklif" aşamasına 100 fırsat ulaşmış, bunların 38'i kazanılmış, 52'si kaybedilmiş, 10'u hâlâ açık. Açık olanları hesaptan çıkarırsanız teklif aşamasının kazanma oranı 38 / 90 ≈ **yüzde 42** olur.

Bu hesabı her aşama için yaptığınızda gerçek bir olasılık tablosu elde edersiniz. Dikkat edilmesi gereken birkaç nokta:

- **Segment bazında ayırın.** Kurumsal müşterilerle KOBİ'lerin dönüşüm oranları ve satış döngüleri genellikle çok farklıdır. Tek bir ortalama, iki segmenti de yanlış tahmin eder.
- **Kaynağa göre ayırın.** Gelen talep (inbound), outbound ve iş ortağı kaynaklı fırsatlar farklı davranır. Outbound fırsatlar çoğu zaman daha uzun bir eğitim sürecinden geçer.
- **Yeterli örneklem olmadan ince bölmeyin.** Bir segmentte yalnızca 8 kapanmış fırsat varsa o oran istatistiksel olarak güvenilir değildir. Bu durumda genel oranı kullanın ve veri biriktikçe ayrıştırın.

### 3. Pipeline'ı temizleyin

Şişkin bir pipeline, en doğru formülü bile işe yaramaz hale getirir. Tahmin döngüsünün başında aşağıdaki kurallarla bir hijyen kontrolü yapın:

- Bulunduğu aşamada ortalama sürenin iki katından uzun süredir bekleyen fırsatları işaretleyin.
- Son 30 gündür müşteriyle hiçbir kayıtlı etkileşim olmayan fırsatları gözden geçirin.
- Kapanış tarihi geçmiş ama hâlâ açık duran fırsatları ya güncelleyin ya kapatın.
- Kapanış tarihi iki veya daha fazla kez ertelenmiş fırsatları ayrı bir listeye alın.

Bu temizlik çoğu zaman toplam pipeline'ı belirgin biçimde küçültür. Bu kötü bir haber değildir; tahmininizin gerçeğe yaklaştığını gösterir. Eksik veya güncel olmayan şirket ve kişi bilgileri de fırsat değerlendirmesini zorlaştırır; bu konuda [B2B veri zenginleştirme rehberimiz](/blog/b2b-veri-zenginlestirme-nasil-yapilir) CRM kayıtlarını nasıl güncel tutabileceğinizi anlatıyor.

### 4. Ağırlıklı pipeline'ı hesaplayın

Temizlenmiş pipeline ve kendi oranlarınızla ağırlıklı tahmini çıkarabilirsiniz. Çeyreklik hedefi 6.000.000 TL olan bir ekip için örnek bir tablo:

| Aşama | Fırsat sayısı | Toplam tutar | Tarihsel kazanma oranı | Ağırlıklı tutar |
|---|---|---|---|---|
| Keşif | 12 | 4.800.000 TL | %8 | 384.000 TL |
| İhtiyaç analizi | 9 | 3.600.000 TL | %20 | 720.000 TL |
| Teklif | 6 | 2.700.000 TL | %40 | 1.080.000 TL |
| Müzakere | 4 | 1.800.000 TL | %65 | 1.170.000 TL |
| Sözleşme | 2 | 900.000 TL | %90 | 810.000 TL |
| **Toplam** | **33** | **13.800.000 TL** | | **4.164.000 TL** |

İlk bakışta 13,8 milyon TL'lik pipeline hedefin iki katından fazla görünür. Ağırlıklandırıldığında ise beklenen gelir yaklaşık **4,16 milyon TL**'ye iner. Yani ekip, mevcut haliyle hedefin yaklaşık yüzde 69'unu tutturma yolundadır.

### 5. Zamanlamayı hesaba katın

Ağırlıklı pipeline'ın en büyük zaafı, fırsatın **ne zaman** kapanacağını göz ardı etmesidir. Yukarıdaki örnekte keşif aşamasındaki 12 fırsat, ortalama 90 günlük bir satış döngüsüne sahip bir şirkette büyük ihtimalle bu çeyrekte kapanmayacaktır.

Bunu düzeltmenin iki yolu vardır:

- **Kapanış tarihi filtresi:** Yalnızca kapanış tarihi bu dönem içinde olan ve o tarih gerçekçi görünen fırsatları hesaba katın.
- **Aşamada kalan süre analizi:** Her aşamadan kapanışa kadar geçen ortalama süreyi hesaplayın. Örneğin keşiften kapanışa ortalama 85 gün geçiyorsa ve çeyreğin bitmesine 40 gün kaldıysa, keşif aşamasındaki fırsatların bu çeyrek tahminine katkısını sıfıra yakın kabul edin.

Örneğimizde keşif aşamasını çeyrek dışı bırakır, ihtiyaç analizindeki fırsatların ise yalnızca yarısının zamanında kapanabileceğini varsayarsak tahmin şöyle değişir: 360.000 + 1.080.000 + 1.170.000 + 810.000 = **3.420.000 TL.** Bu, çeyrek için çok daha savunulabilir bir rakamdır.

### 6. Temsilci kategorileriyle karşılaştırın

Formül tabanlı rakamı, sahadaki bilgiyle dengeleyin. Her temsilciden fırsatlarını üç kategoriye ayırmasını isteyin:

- **Commit (kesin):** Kaybedilirse temsilcinin şaşıracağı fırsatlar. Karar verici onay vermiş, yalnızca prosedür kalmıştır.
- **Best case (olası):** Her şey yolunda giderse bu dönem kapanabilecek fırsatlar.
- **Pipeline:** Bu dönem kapanma ihtimali düşük, ancak aktif olan fırsatlar.

Commit toplamı 2,8 milyon TL, commit artı best case toplamı 4,5 milyon TL çıkıyorsa ve formül tabanlı tahmininiz 3,4 milyon TL ise, gerçekçi aralık bu iki uç arasındadır. Burada önemli olan, her temsilcinin geçmiş commit isabetini takip etmektir. "Commit" dediği fırsatların geçmişte yüzde 90'ını kapatan bir temsilciyle yüzde 60'ını kapatan bir temsilcinin beyanı aynı ağırlıkta değerlendirilmemelidir.

### 7. Satış hızı formülüyle kontrol edin

Üçüncü bir bakış açısı için satış hızını hesaplayın:

**Satış hızı = (Aktif fırsat sayısı × Ortalama işlem tutarı × Kazanma oranı) / Ortalama satış döngüsü (gün)**

Örnek: 40 aktif fırsat, 450.000 TL ortalama tutar, yüzde 22 kazanma oranı ve 75 günlük ortalama döngü.

(40 × 450.000 × 0,22) / 75 = **52.800 TL/gün**

90 günlük bir çeyrekte bu, yaklaşık 4,75 milyon TL'lik bir gelir üretim kapasitesine karşılık gelir. Bu rakam bir tahmin değil, mevcut pipeline'ın sürdürülebilir üretim gücüdür. Ağırlıklı tahmininiz bunun çok üzerindeyse büyük ihtimalle aşırı iyimsersiniz; çok altındaysa ya pipeline'da sorunlu fırsatlar var ya da zamanlama varsayımlarınız fazla temkinli.

Satış hızının dört bileşeni aynı zamanda büyüme kaldıraçlarınızı da gösterir: Daha fazla fırsat, daha yüksek ortalama tutar, daha iyi kazanma oranı veya daha kısa döngü. Bu metrikleri düzenli izlemek için [satış ekibi verimliliğini ölçmeye yönelik KPI rehberimizden](/blog/satis-ekibi-verimlilik-kpi-rehberi) yararlanabilirsiniz.

### 8. Senaryolarla raporlayın

Yönetime tek bir rakam sunmak yerine bir aralık sunun:

- **Kötümser senaryo:** Yalnızca commit fırsatları, temsilcinin geçmiş isabet oranıyla düzeltilmiş hali.
- **Gerçekçi senaryo:** Zaman ayarlı ağırlıklı pipeline.
- **İyimser senaryo:** Commit artı best case toplamı.

Örneğimizde bu aralık yaklaşık 2,5 milyon ile 4,5 milyon TL arasında, gerçekçi beklenti ise 3,4 milyon TL'dir. Bu çerçeve yönetimin kaynak planlaması yapmasını kolaylaştırır ve "tahmin tuttu mu, tutmadı mı" tartışmasını daha verimli hale getirir.

## Pipeline coverage ne kadar olmalı?

Sık duyulan "pipeline hedefin 3 katı olmalı" kuralı bir başlangıç noktasıdır, ama evrensel değildir. Doğru coverage oranı sizin kazanma oranınıza bağlıdır:

**Gerekli coverage = 1 / Kazanma oranı**

- Kazanma oranınız yüzde 33 ise yaklaşık 3 kat coverage yeterlidir.
- Kazanma oranınız yüzde 20 ise 5 kat coverage gerekir.
- Kazanma oranınız yüzde 40 ise 2,5 kat yetebilir.

Coverage'ı toplam hedef yerine **kalan açık** üzerinden hesaplamak daha anlamlıdır. Örneğin çeyreğin ortasında 3 milyon TL'lik hedef açığınız varsa ve bu dönem kapanabilecek fırsatlardaki kazanma oranınız yüzde 30 ise, en az 10 milyon TL'lik zamanlaması uygun pipeline'a ihtiyacınız vardır.

Coverage yetersiz çıktığında çözüm tahmini şişirmek değil, huninin üst kısmını beslemektir. Bunun için hedef kitlenin net tanımlanması ve fırsatların erkenden önceliklendirilmesi gerekir; [B2B lead scoring modeli kurma rehberimiz](/blog/b2b-lead-scoring-nasil-yapilir) bu önceliklendirmeyi sistematik hale getirmenize yardımcı olur. Özellikle SaaS şirketlerinde üst huni açığını kapatmak için [B2B SaaS'a özel outbound satış ve lead generation hizmeti sunan SAAS Corner](https://saascorner.co) da kardeş şirketimiz olarak bu ihtiyaca odaklanır.

## Yapay zeka destekli tahmin gerçekten daha isabetli mi?

Yapay zeka, doğru veriyle beslendiğinde insan gözünün kaçırdığı örüntüleri yakalayabilir. Örneğin şu sinyalleri birlikte değerlendirerek her fırsata dinamik bir olasılık atayabilir:

- Son iki haftadaki e-posta ve toplantı yoğunluğu
- Karar verici veya satın alma biriminin sürece dahil olup olmadığı
- Müşteri tarafındaki yanıt süresinin uzayıp kısalması
- Fırsatın aşamada geçirdiği sürenin ortalamaya göre durumu
- Kapanış tarihinin kaç kez değiştirildiği
- Benzer büyüklük ve sektördeki geçmiş fırsatların sonuçları

Ancak burada kritik bir koşul vardır: Model yalnızca CRM'e girilen veri kadar iyidir. Toplantıların kaydedilmediği, e-postaların CRM'e bağlanmadığı, aşamaların keyfi güncellendiği bir ortamda yapay zeka yalnızca hatalı veriyi daha hızlı işler. Bu nedenle önce aktivitelerin otomatik olarak kaydedildiği bir altyapı kurmak gerekir. CRM'in bir kayıt sistemi, otomasyonun ise bu kayıtları besleyen ve harekete geçiren katman olduğunu anlamak bu noktada önemlidir.

Sales Corner'ın yaklaşımında yapay zeka, temsilcinin yerine karar vermez; riskli fırsatları erken işaretler, kapanış tarihi tutarsızlıklarını raporlar ve tahmin toplantısını "her fırsatı tek tek anlatma" seansından "istisnaları tartışma" seansına dönüştürür.

## Tahmin doğruluğu nasıl ölçülür?

Ölçmediğiniz tahmini iyileştiremezsiniz. Her dönem sonunda iki metriği takip edin:

**Tahmin doğruluğu = 1 − (|Gerçekleşen − Tahmin| / Gerçekleşen)**

Örnek: Çeyrek başında 5,0 milyon TL tahmin ettiniz, gerçekleşen 4,4 milyon TL oldu. Fark 600.000 TL, hata oranı 600.000 / 4.400.000 ≈ yüzde 13,6, doğruluk ise yaklaşık **yüzde 86** olur.

**Tahmin sapması (bias):** Hata sürekli aynı yönde mi? Art arda dört çeyrek tahminin üzerinde kalıyorsanız sisteminizde yapısal bir iyimserlik vardır. Bu durumda aşama oranlarını, temsilci commit isabetlerini ve kapanış tarihi disiplinini yeniden incelemeniz gerekir.

Bu iki metriği hem ekip hem temsilci bazında izleyin. Ayrıca tahmini yalnızca çeyrek başında değil, her hafta güncelleyin ve haftalık değişimi kaydedin. Çeyreğin 3. haftasındaki tahminle 10. haftasındaki tahmin arasındaki fark, sürecin ne kadar erken doğru sinyal verdiğini gösterir.

## Satış tahmininde en sık yapılan hatalar

- **Tek bir yönteme körü körüne güvenmek.** Formül tabanlı tahmin ile sahadaki bilgi birbirini kontrol etmelidir.
- **Varsayılan CRM olasılıklarını kullanmak.** Kendi verinizden hesaplanmamış bir yüzde, tahmin değil tahmindir.
- **Kaybedilen fırsatları kapatmamak.** "Belki döner" diye açık bırakılan fırsatlar hem pipeline'ı hem dönüşüm oranlarını bozar.
- **Tahmini hedefe göre ayarlamak.** Tahmin, hedefe ulaşıp ulaşamayacağınızı söyler; hedefin kendisi değildir. Rakamı yönetimin duymak istediğine göre şekillendirmek, sorunun erken fark edilmesini engeller.
- **Yeni ürün veya pazarda eski oranları kullanmak.** Tarihsel verisi olmayan bir alanda daha geniş bir senaryo aralığı belirleyin ve ilk birkaç dönemi öğrenme süreci olarak kabul edin.
- **Otomasyonu veri disiplini olmadan kurmak.** Araç ne kadar gelişmiş olursa olsun, süreç tanımlanmadan kurulan sistemler beklenen sonucu vermez.

## Sık sorulan sorular

### Satış tahmini için ne kadar geçmiş veriye ihtiyaç var?

Güvenilir aşama dönüşüm oranları için genellikle en az 4 ila 6 çeyreklik kapanmış fırsat verisi önerilir. Satış döngünüz kısaysa ve fırsat hacminiz yüksekse daha kısa bir dönem de yeterli olabilir. Veri azsa genel oranlarla başlayıp her çeyrek oranları güncellemek en pratik yoldur.

### Ağırlıklı pipeline ile commit tahmini arasındaki fark nedir?

Ağırlıklı pipeline, her fırsatın tutarını aşamanın tarihsel kazanma oranıyla çarparak matematiksel bir beklenti üretir. Commit tahmini ise temsilcinin kesin kapanacağını beyan ettiği fırsatların toplamıdır. İlki nesnel ama zamanlamaya karşı kör, ikincisi sahadaki bilgiyi yansıtır ama özneldir; bu yüzden ikisi birlikte kullanılmalıdır.

### Satış tahmini ne sıklıkla güncellenmeli?

B2B satış ekiplerinin çoğu için haftalık güncelleme ideal ritimdir. Aylık veya çeyreklik güncellemeler, sorunların düzeltilemeyecek kadar geç fark edilmesine yol açar. Haftalık değişimleri kaydetmek, hangi fırsatların tahmini en çok oynattığını görmenizi de sağlar.

### Yapay zeka satış tahmininde insan değerlendirmesinin yerini alır mı?

Hayır, en iyi sonuç ikisinin birlikte kullanılmasıyla elde edilir. Yapay zeka aktivite ve etkileşim verilerinden riskli fırsatları erken tespit eder, temsilci ise müşteriyle ilgili kayda geçmemiş bağlamı sağlar. Yapay zekanın değeri, tahmin toplantısında zamanın doğru fırsatlara harcanmasını sağlamasıdır.

## Sonuç

Gerçekçi bir satış tahmini, iyi niyetli temsilci beyanlarının toplamı değil, disiplinli bir sürecin çıktısıdır. Aşamaları doğrulanabilir kriterlerle tanımlamak, kendi dönüşüm oranlarınızı hesaplamak, pipeline'ı düzenli temizlemek, zamanlamayı hesaba katmak ve birden fazla yöntemi birbirine karşı kontrol etmek, tahmin isabetini kalıcı olarak artırır. Her dönem sonunda doğruluk ve sapmayı ölçtüğünüzde, süreç kendi kendini iyileştiren bir sisteme dönüşür.

Pipeline verinizi otomatik olarak toplayan, riskli fırsatları erkenden işaretleyen ve haftalık tahmini sizin yerinize hazırlayan bir altyapı kurmak istiyorsanız, ekibimizle bir [görüşme planlayarak](/iletisim) mevcut sürecinizi birlikte değerlendirebiliriz.
