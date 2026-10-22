---
title: "CRM Veri Temizliği: Yinelenen Kayıtlar Nasıl Ayıklanır?"
description: "CRM'deki tekrar eden firma ve kişi kayıtlarını nasıl birleştireceğinizi, yeni kayıtlarda hangi kuralları uygulamanız gerektiğini adım adım gösteriyoruz."
date: "2026-10-22"
category: "CRM"
image: "https://images.pexels.com/photos/7691673/pexels-photo-7691673.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "CRM Veri Temizliği: Yinelenen Kayıtlar Nasıl Ayıklanır?"
---

CRM'deki yinelenen kayıtları ayıklamanın en güvenli yolu dört adımdan geçer: önce bir yedek alırsınız, sonra şirketler için web alan adı ve kişiler için e-posta adresi gibi net eşleştirme kuralları tanımlarsınız, ardından her yinelenen grupta hangi kaydın "ana kayıt" olacağını belirlersiniz ve son olarak geçmiş aktiviteleri kaybetmeden kayıtları birleştirirsiniz. Tek seferlik bir temizlik yetmez. Kayıtların yeniden çoğalmasını önleyen giriş kuralları ve düzenli kontroller olmadan veri birkaç ay içinde eski hâline döner.

Bu yazıda B2B satış ekiplerinde en sık karşılaştığım tabloyu ele alıyorum: aynı şirketin üç farklı yazımla açılmış olması, aynı kişiye iki temsilcinin aynı hafta e-posta atması, pipeline raporunda aynı fırsatın iki kez görünmesi. Bunların ortak noktası kirli veridir. Aşağıda yinelenen kayıtların nereden geldiğini, nasıl tespit edildiğini, hangi sırayla birleştirileceğini ve temizlikten sonra verinin nasıl temiz tutulacağını adım adım anlatıyorum.

## Yinelenen kayıtlar neden bu kadar büyük bir sorun?

Yinelenen kayıtları çoğu ekip "biraz dağınıklık" olarak görür. Oysa etkisi raporlamadan müşteri deneyimine kadar her yere yayılır.

- **Yanlış raporlama:** Aynı fırsat iki şirket kaydına bağlıysa pipeline değeri şişer. Tahminler gerçekçi olmaktan çıkar, kota ve kaynak planlaması yanlış verilere dayanır.
- **Çakışan temaslar:** İki SDR aynı karar vericiye farklı mesajlarla ulaşırsa karşı tarafta profesyonel olmayan bir izlenim oluşur. B2B'de bu tek başına bir fırsatı kaybettirebilir.
- **Sahiplik kavgaları:** "Bu hesap benimdi" tartışmasının kaynağı çoğu zaman yinelenen kayıtlardır. Komisyon hesaplanırken kimin hangi kayda bağlı olduğu belirsizleşir.
- **Kaybolan geçmiş:** Bir temsilci eski toplantı notlarını bir kayıtta, yeni teklifi diğerinde tutuyorsa hesabın tam hikâyesini kimse göremez.
- **Güven kaybı:** Bence en pahalısı bu. Ekip CRM'deki verinin yanlış olduğuna inanmaya başladığında sistemi kullanmayı bırakır ve notlarını Excel'de, WhatsApp'ta tutmaya döner. Bu döngüyü [satış ekibinin CRM'i neden kullanmadığını anlattığım yazıda](/blog/satis-ekibi-crmi-kullanmiyor) ayrıntılı ele almıştım. Kirli veri bu sorunun hem sebebi hem sonucudur.

## Yinelenen kayıtlar nereden geliyor?

Temizliğe başlamadan önce kaynağı anlamak gerekir. Kaynağı bilmezseniz musluk açıkken yeri silmiş olursunuz. Türkiye'deki B2B ekiplerde gördüğüm başlıca kaynaklar şunlar:

1. **Toplu liste içe aktarmaları:** Fuar katılımcı listeleri, satın alınan veri setleri ya da prospecting araçlarından çekilen CSV dosyaları "mevcut kayıtlarla eşleştir" kontrolü yapılmadan yüklenir. Yinelenen kayıtların büyük bölümü buradan gelir.
2. **Manuel giriş:** Temsilci aramadan önce şirketi CRM'de aramaz, doğrudan yeni kayıt açar. Biri "Yıldız Holding" yazar, diğeri "Yildiz Holding A.Ş." yazar.
3. **Entegrasyonlar:** Web formu, e-posta aracı, pazarlama otomasyonu ve takvim entegrasyonları kendi eşleştirme mantıklarıyla kayıt oluşturur. Biri e-postaya, diğeri isme bakıyorsa aynı kişi iki kez oluşur.
4. **CRM geçişleri:** Eski sistemden yenisine taşırken önceki sistemdeki yinelenen kayıtlar da taşınır. Üstüne geçiş sırasında yeni yinelenen kayıtlar eklenir.
5. **Kişisel ve kurumsal e-posta karışıklığı:** Aynı kişi bir kayıtta gmail adresiyle, diğerinde şirket adresiyle bulunur.
6. **İş değiştiren kişiler:** Karar verici başka şirkete geçtiğinde eski kayıt güncellenmez, yeni şirket için sıfırdan bir kayıt açılır.

Hangi kaynağın sizde baskın olduğunu bilmek, temizlikten sonra hangi kuralları koyacağınızı belirler.

## Temizliğe başlamadan önce neler hazırlanmalı?

Aceleyle "toplu birleştir" butonuna basmak, geri dönüşü zor hatalara yol açar. Birleştirilen kayıtları ayırmak çoğu CRM'de ya imkânsızdır ya da çok zahmetlidir. O yüzden hazırlık aşaması atlanmamalı.

### Tam yedek alın

Şirket, kişi, fırsat ve aktivite tablolarının tamamını dışa aktarın. Dosya adına tarih koyun ve erişimi kısıtlı bir klasörde saklayın. Bu yedek, yanlış birleştirilen bir kaydı kurtarmanın tek yoludur.

### Bir sahip belirleyin

Veri temizliği "herkesin işi" olduğunda kimsenin işi olmaz. Küçük ekiplerde bu kişi genellikle satış operasyonlarından sorumlu biri ya da satış müdürüdür. Bu kişi kuralları yazar, birleştirmeleri onaylar ve süreci yürütür.

### Temsilcilere haber verin

Birleştirme sırasında kayıt sahipliği değişebilir, bazı kayıtlar kaybolmuş gibi görünebilir. Ekibe hangi gün ne yapılacağını, kısa bir süre toplu içe aktarma ve yeni kayıt açmanın durdurulacağını önceden duyurun.

### Kapsamı sınırlayın

Tüm veritabanını bir anda temizlemeye çalışmayın. Önce şirket (hesap) kayıtlarıyla başlayın, sonra kişilere, en son fırsatlara geçin. Bu sıra önemlidir. Kişiler şirketlere, fırsatlar da şirketlere bağlıdır. Şirketler temizlenmeden kişileri birleştirmek, kişileri yanlış hesaplara bağlama riskini artırır.

## Yinelenen kayıtlar adım adım nasıl ayıklanır?

### 1. Envanter çıkarın

Önce sorunun boyutunu ölçün. Basit bir yöntem: şirket kayıtlarını dışa aktarın, web alan adı sütununu normalize edin (www, http, https ve sondaki eğik çizgiyi kaldırın) ve aynı alan adına sahip kaç kayıt olduğunu sayın. Aynı işlemi kişiler için e-posta adresiyle yapın.

Örnek bir senaryo düşünelim: 12.000 şirket ve 30.000 kişi kaydı olan bir ekip bu kontrolü yaptığında, aynı alan adını paylaşan birkaç yüz şirket grubu ve aynı e-postayı paylaşan bir o kadar kişi grubu bulabilir. Bu rakamlar her şirkette farklıdır. Önemli olan kendi rakamınızı bilmek, çünkü temizlik sonrasında aynı ölçümü tekrarlayıp ilerlemeyi bununla takip edeceksiniz.

### 2. Eşleştirme kurallarını yazın

Yinelenen kaydı neyin tanımladığına karar vermeniz gerekir. Kuralları güven seviyesine göre üç katmanda düşünmenizi öneririm.

**Kesin eşleşme (otomatik birleştirilebilir):**
- Şirketler için: aynı normalize edilmiş web alan adı
- Kişiler için: aynı e-posta adresi (küçük harfe çevrilmiş, boşlukları temizlenmiş)
- Şirketler için ikincil anahtar: aynı vergi numarası (CRM'de tutuyorsanız)

**Güçlü olası eşleşme (hızlı manuel kontrol):**
- Şirketler için: normalize edilmiş şirket adı aynı, şehir aynı
- Kişiler için: ad-soyad aynı ve aynı şirkete bağlı, ama e-postalar farklı
- Aynı telefon numarası (başında +90, 0 ya da boşluk farkı olabilir, önce normalize edin)

**Zayıf eşleşme (dikkatli inceleme):**
- Benzer ama aynı olmayan şirket adları ("Atlas Lojistik" ile "Atlas Lojistik ve Taşımacılık")
- Aynı ad-soyad, farklı şirket (iş değiştirmiş olabilir, aynı isimde iki farklı kişi de olabilir)

Kesin eşleşmeleri toplu birleştirebilirsiniz. Olası eşleşmelere birinin göz atması gerekir. Zayıf eşleşmeler ise ancak hesap sahibi temsilcinin onayıyla birleştirilmeli.

**Dikkat edilmesi gereken bir istisna:** Holding yapıları ve grup şirketleri. Aynı alan adını kullanan ama ayrı tüzel kişilikler olan şirketler, örneğin bir holdingin farklı vergi numaralarıyla faturalanan iştirakleri, gerçekte ayrı hesaplar olabilir. Bunları birleştirmek yerine CRM'deki üst şirket/alt şirket ilişkisiyle bağlamak daha doğrudur.

### 3. Ana kaydı seçme kurallarını belirleyin

Her yinelenen grupta bir kayıt "ana kayıt" olarak kalır, diğerleri ona birleştirilir. Hangisinin ana kayıt olacağına her seferinde ayrı ayrı karar vermek yerine kural koyun. Pratikte işe yarayan bir sıralama:

1. Açık fırsatı olan kayıt
2. Kapanmış (kazanılmış) fırsatı olan, yani müşteri olan kayıt
3. En fazla aktivite geçmişi olan kayıt
4. En son güncellenen kayıt
5. Eşitlik durumunda en eski oluşturulan kayıt

Alan bazında da kural gerekir. Ana kayıtta telefon numarası boş ama birleştirilen kayıtta doluysa, dolu olan korunmalı. Çoğu CRM'in birleştirme ekranı alan bazında seçim yapmanıza izin verir. Toplu birleştirmede ise "boş olmayan değeri koru" ya da "en son güncelleneni koru" gibi bir varsayılan belirleyin.

Sahiplik konusunu önceden netleştirin. Birleştirilen kayıtların farklı sahipleri varsa kural basit olmalı: açık fırsatı yöneten temsilci hesabın sahibi olur. Bu konu komisyonla doğrudan ilişkili olduğu için, [komisyon planını tasarlarken](/blog/satis-ekibinde-komisyon-plani-nasil-tasarlanir) hesap sahipliği kurallarını da yazılı hâle getirmenizi öneririm.

### 4. Birleştirmeyi yapın

Sıra şöyle olmalı:

1. **Kesin eşleşen şirketler:** Toplu birleştirme, ardından rastgele seçilmiş 20-30 kaydı elle kontrol edin.
2. **Olası eşleşen şirketler:** Bir elektronik tabloya alın, "birleştir / ayrı tut / üst-alt ilişkisi kur" sütunu ekleyin, kararları işaretleyip uygulayın.
3. **Kesin eşleşen kişiler:** Toplu birleştirme.
4. **Olası eşleşen kişiler:** Manuel inceleme.
5. **Fırsatlar:** Aynı şirkette, aynı ürün için, yakın tarihlerde açılmış fırsatları inceleyin. Fırsat birleştirmede en çok dikkat gereken nokta, aynı müşteriye gerçekten iki ayrı satış mı yapıldığı yoksa aynı fırsatın iki kez mi girildiğidir.

Birleştirme sırasında aktivite geçmişinin (e-postalar, aramalar, notlar, toplantılar) ana kayda taşındığını mutlaka doğrulayın. Bazı CRM'ler bunu otomatik yapar, bazı entegrasyonlar yapmaz.

### 5. Doğrulayın ve ölçün

Temizlikten sonra ilk adımdaki envanter ölçümünü tekrarlayın. Aynı alan adına sahip şirket sayısının sıfıra yakın olması gerekir (holding istisnaları hariç). Ayrıca:

- Pipeline toplam değerini temizlik öncesiyle karşılaştırın. Düşüş varsa çift sayılan fırsatlar temizlenmiştir.
- Birkaç temsilciden kendi hesaplarını kontrol etmesini isteyin.
- Raporlarda ve otomasyonlarda (sıralı e-posta akışları, görev atamaları) bozulma olup olmadığına bakın.

## Türkçe şirket adları neden ayrı dikkat istiyor?

Yurt dışı kaynaklı rehberlerin çoğunda atlanan ama Türkiye'de en çok sorun çıkaran konu budur. Aynı şirket CRM'de şu biçimlerde görünebilir:

- "Özkan Gıda San. ve Tic. A.Ş."
- "Ozkan Gida Sanayi ve Ticaret Anonim Şirketi"
- "ÖZKAN GIDA"
- "Özkan Gıda A.Ş"

Bunları yakalamak için şirket adlarını karşılaştırmadan önce normalize eden bir yardımcı sütun oluşturun. Normalizasyon adımları:

1. Tüm harfleri küçük harfe çevirin. Türkçe "İ/ı" dönüşümüne dikkat edin, bazı araçlar "I" harfini yanlış dönüştürür.
2. Türkçe karakterleri ASCII karşılıklarına çevirin: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u.
3. Şirket türü eklerini kaldırın: "a.ş.", "anonim şirketi", "ltd. şti.", "limited şirketi", "san. ve tic.", "sanayi ve ticaret", "tic.", "ltd".
4. Noktalama işaretlerini ve fazla boşlukları silin.

Bu dönüşümden sonra yukarıdaki dört kaydın hepsi "ozkan gida" hâline gelir ve eşleşir. Bu yardımcı sütun yalnızca eşleştirme içindir. CRM'de görünen resmî şirket adını değiştirmeyin.

Aynı mantık telefon numaraları için de geçerlidir. "+90 212 555 00 00", "0212 555 0000" ve "2125550000" aynı numaradır. Karşılaştırmadan önce boşlukları, parantezleri ve ülke/şehir öneklerindeki farkları tek bir formata indirin.

## Hangi araçları kullanmalısınız?

Araç seçimi veri hacminize ve bütçenize bağlıdır. Üç seviye düşünebilirsiniz.

**CRM'in kendi araçları:** Popüler CRM'lerin çoğunda yinelenen kayıt önerisi, birleştirme ekranı ve kayıt oluşturulurken uyarı veren kurallar bulunur. İlk adım olarak bunları açın. Sınırlılıkları genellikle bulanık (fuzzy) eşleştirmede ve toplu işlemlerde ortaya çıkar. Henüz CRM seçim aşamasındaysanız, [küçük satış ekipleri için CRM seçimi rehberinde](/blog/kucuk-satis-ekibi-icin-crm-nasil-secilir) değinildiği gibi yinelenen kayıt yönetimini değerlendirme kriterlerinize ekleyin.

**Elektronik tablo:** Birkaç bin kayda kadar Excel ya da Google Sheets ile normalizasyon sütunları oluşturmak, EĞERSAY ile tekrarları işaretlemek ve kararları elle girmek tamamen yeterlidir. Ücretsizdir ve süreci anlamanızı sağlar.

**Üçüncü taraf temizlik araçları:** On binlerce kayıt, birden fazla entegrasyon ve düzenli temizlik ihtiyacı varsa CRM'e bağlanan özel veri temizleme uygulamaları zaman kazandırır. Bu araçlar bulanık eşleştirme, zamanlanmış taramalar ve kural tabanlı otomatik birleştirme sunar.

Yinelenen kayıtların büyük kısmı dış listelerden geliyorsa, sorunu kaynağında çözmek daha verimlidir. Örneğin [Apollo.io](https://get.apollo.io/679irkzm35ya) gibi prospecting araçlarından veri çekerken CRM entegrasyonunun "mevcut kaydı güncelle" mantığıyla çalışacak şekilde ayarlanması, her dışa aktarımda yeni kayıt oluşmasını engeller. Listeleri baştan nasıl yapılandırmanız gerektiğini [B2B potansiyel müşteri listesi oluşturma yazısında](/blog/b2b-potansiyel-musteri-listesi-nasil-olusturulur) anlatmıştım. Temiz bir liste, temiz bir CRM'in ilk şartıdır.

## Ne kadar sürer, maliyeti ne kadar?

Kesin bir rakam vermek yanıltıcı olur, ama kabaca bir çerçeve çizebilirim. Birkaç bin kayıtlık bir CRM'de, sahibi belli bir kişi elektronik tabloyla çalışırsa ilk büyük temizlik genellikle birkaç iş gününde tamamlanır. Zamanın çoğu toplu birleştirmeye değil, olası eşleşmelerin manuel incelemesine gider. On binlerce kayıt ve birden fazla entegrasyonun olduğu bir yapıda süreç birkaç haftaya yayılabilir.

Maliyet üç kalemden oluşur:

- **İç zaman:** Operasyon sorumlusunun ve temsilcilerin inceleme için ayırdığı saatler. Genellikle en büyük kalem budur.
- **Araç ücreti:** CRM'in kendi araçları çoğu pakette dahildir. Üçüncü taraf temizlik uygulamaları genellikle kayıt sayısına ya da kullanıcıya göre aylık ücretlendirilir.
- **Dış destek:** CRM geçişi ya da kapsamlı yeniden yapılandırma söz konusuysa danışmanlık hizmeti alınabilir.

Maliyeti değerlendirirken karşı tarafı da hesaba katın: yanlış pipeline tahminleri, aynı kişiye iki kez ulaşan temsilciler, kaybolan hesap geçmişi ve CRM'e güvenmeyen bir ekip. Bunların bedeli çoğu zaman temizliğin bedelinden yüksektir.

## Temizlikten sonra veri nasıl temiz tutulur?

Tek seferlik temizlik, kurallar konmazsa birkaç ay içinde etkisini kaybeder. Kalıcı sonuç için şu önlemleri öneririm:

### Giriş noktasında engelleyin

- CRM'de yinelenen kayıt uyarısını açın ve mümkünse aynı alan adı ya da e-postayla kayıt oluşturmayı engelleyin.
- Şirket kaydında web alan adını zorunlu alan yapın. Alan adı, en güvenilir eşleştirme anahtarıdır.
- Temsilcilere basit bir alışkanlık kazandırın: "Önce ara, sonra oluştur."

### İçe aktarmaları kontrol altına alın

- Toplu içe aktarma yetkisini bir ya da iki kişiyle sınırlayın.
- Her içe aktarmadan önce dosyayı mevcut kayıtlarla karşılaştırın ve "eşleşirse güncelle, eşleşmezse oluştur" ayarını kullanın.
- İçe aktarılan kayıtlara kaynak ve tarih etiketi ekleyin. Sorun çıkarsa hangi listeden geldiğini bulmak kolaylaşır.

Outbound ekiplerde dış listelerin hacmi yüksek olduğundan bu kontrol daha da kritiktir. Ayrıca kişisel veri içeren listelerin nereden geldiğini ve hangi amaçla işlendiğini kayıt altına almak, [soğuk e-posta ve KVKK](/blog/soguk-eposta-kvkk-outbound-ekipler) açısından da önemlidir. Temiz ve kaynağı belli veri, hem satış verimliliği hem de uyum açısından avantaj sağlar.

### Entegrasyonları denetleyin

Her entegrasyonun hangi alana göre eşleştirme yaptığını belgeleyin. Web formu e-postaya, takvim entegrasyonu isme bakıyorsa ikisini aynı anahtara (e-posta) bağlayın.

### Düzenli kontrol takvimi oluşturun

- **Haftalık:** Son yedi günde oluşturulan kayıtlarda yinelenen kayıt raporu. On dakika sürer.
- **Aylık:** Alan adı ve e-posta bazında tam tarama, olası eşleşmelerin incelenmesi.
- **Çeyreklik:** Eksik alanlar, iş değiştiren kişiler ve pasif kayıtlar için genel veri sağlığı kontrolü.

Haftalık kontrolü ayrı bir toplantı yapmak yerine mevcut ritüellere eklemek daha sürdürülebilirdir. Örneğin [haftalık pipeline toplantısının](/blog/haftalik-pipeline-toplantisi-rehberi) son beş dakikasını veri kalitesine ayırabilirsiniz.

### Sorumluluğu görünür kılın

Temsilci bazında yinelenen kayıt ve eksik alan oranını gösteren basit bir pano hazırlayın. Kimseyi cezalandırmak için değil, sorunun nereden çıktığını görmek için. Çoğu zaman sorun kişide değil süreçtedir: bir entegrasyon ayarı ya da belirsiz bir kural.

Veri kalitesini kendi ekibiyle yönetmekte zorlanan şirketler için dışarıdan destek de bir seçenek. Örneğin [veri odaklı B2B satış ve lead generation hizmeti veren Sales Corner](https://salescorner.co) gibi ekipler, lead verisini CRM'e temiz ve eşleştirilmiş biçimde aktarmayı sürecin parçası olarak ele alır.

## Sık sorulan sorular

### CRM'de yinelenen kayıtları otomatik olarak birleştirmek güvenli mi?

Yalnızca kesin eşleşmelerde, yani aynı web alan adı ya da aynı e-posta adresi gibi tartışmasız anahtarlarda güvenlidir. Benzer şirket adları, aynı ad-soyad ya da telefon numarası gibi olası eşleşmeler mutlaka bir kişi tarafından kontrol edilmelidir. Toplu birleştirmeden önce tam yedek almak zorunludur, çünkü birleştirme çoğu CRM'de geri alınamaz.

### Önce şirketleri mi, kişileri mi temizlemeliyim?

Önce şirket kayıtlarını temizleyin, sonra kişilere, en son fırsatlara geçin. Kişiler ve fırsatlar şirketlere bağlı olduğu için, şirketler temizlenmeden yapılan kişi birleştirmeleri kayıtları yanlış hesaplara bağlayabilir. Bu sıra birleştirme sırasında oluşacak hataları en aza indirir.

### CRM veri temizliği ne sıklıkla yapılmalı?

İlk kapsamlı temizlikten sonra son bir haftada oluşturulan kayıtlar için haftalık kısa bir kontrol, tüm veritabanı için aylık bir tarama ve çeyreklik genel veri sağlığı incelemesi yeterlidir. Asıl önemli olan, giriş noktasında yinelenen kayıt uyarılarını ve içe aktarma kurallarını devreye almaktır. Böylece temizlik bir proje olmaktan çıkar, rutin hâline gelir.

### Holding ve grup şirketlerini birleştirmeli miyim?

Genellikle hayır. Aynı alan adını kullansalar bile farklı vergi numaralarıyla faturalanan ve ayrı satın alma süreçleri olan şirketler ayrı hesaplar olarak kalmalıdır. Bunları birleştirmek yerine CRM'deki üst şirket/alt şirket ilişkisiyle bağlamak, hem raporlamada grup bütününü görmenizi hem de her iştirakin satış sürecini ayrı takip etmenizi sağlar.

## Sonuç

Yinelenen kayıtları ayıklamak teknik bir işten çok bir disiplin meselesidir. Yedek alın, şirketlerden başlayın, net eşleştirme kuralları yazın, ana kaydı seçme kuralını önceden belirleyin ve Türkçe şirket adlarını normalize etmeyi unutmayın. Ardından kayıtların yeniden çoğalmasını engelleyen giriş kurallarını ve kısa, düzenli kontrolleri devreye alın. Temiz bir CRM, doğru pipeline tahmininin, adil komisyon hesabının ve ekibin sisteme güvenmesinin temelidir.

CRM'inizde veri kalitesi sorunu yaşıyorsanız, satış operasyonlarınızı yeniden yapılandırmak istiyorsanız ya da outbound ekibiniz için temiz bir veri altyapısı kurmayı düşünüyorsanız, [benimle iletişime geçebilirsiniz](/tr). Mevcut durumunuzu birlikte değerlendirip size uygun bir yol haritası çıkarabiliriz.
