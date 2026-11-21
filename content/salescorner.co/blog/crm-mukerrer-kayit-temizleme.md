---
title: "CRM'de Mükerrer Kayıtlar: Temizleme Rehberi"
description: "CRM'de mükerrer kayıtlar raporları bozar ve aynı müşteriye iki kez ulaşılmasına yol açar. Tespit, birleştirme ve önleme adımlarını anlatıyoruz."
date: "2026-11-18"
category: "Satış Otomasyonu"
image: "https://images.pexels.com/photos/7794050/pexels-photo-7794050.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "CRM'de Mükerrer Kayıtlar: Temizleme Rehberi"
alt: "crm-duplicate-records-cleanup-guide"
---

CRM'deki mükerrer kayıtlar beş adımda temizlenir: **verinin yedeğini alın, alanları standart bir formata getirin, eşleştirme kurallarını tanımlayın, her grup için tek bir "ana kayıt" seçip diğerlerini onun içinde birleştirin, ardından yeni mükerrerlerin oluşmasını giriş noktalarında engelleyin.** Bu sırayı atlayıp doğrudan "birleştir" butonuna basmak, temizlikten daha büyük bir karmaşa yaratır. Kalıcı çözüm tek seferlik bir temizlik değildir; temizlik ile önleme kurallarının birlikte çalışmasıdır.

Bu rehberde mükerrer kayıtların nereden geldiğini, satış ekibine neye mal olduğunu, Türkiye'deki B2B verisine özgü tuzakları ve temizliği adım adım nasıl yapacağınızı somut örneklerle anlatıyoruz. Amaç yalnızca listeyi küçültmek değil. Pipeline raporlarına, lead atamaya ve e-posta dizilerine yeniden güvenebilmek.

## Mükerrer kayıtlar neden oluşur?

Çoğu ekip mükerrer kaydı bir kullanıcı hatası sanır. Oysa sorunun büyük kısmı sistemin tasarımından kaynaklanır. En sık görülen kaynaklar şunlardır:

- **Toplu içe aktarmalar:** Fuardan dönen bir Excel, satın alınan bir lead listesi ya da bir prospecting aracından indirilen CSV, mevcut kayıtlarla karşılaştırılmadan sisteme yüklenir.
- **Web formları:** Aynı kişi önce e-kitap indirir, üç ay sonra demo talep eder. Form her seferinde yeni bir kişi kaydı açar.
- **Entegrasyonlar:** E-posta aracı, takvim uygulaması ve CRM arasında çift yönlü senkronizasyon varsa, eşleştirme anahtarı doğru seçilmediğinde her senkronizasyon yeni kayıt doğurabilir.
- **Manuel girişler:** Temsilci "Akdeniz Lojistik" diye arar, sonuç çıkmaz, çünkü kayıt "Akdeniz Lojistik Taşımacılık San. ve Tic. A.Ş." olarak girilmiştir. Temsilci de yeni bir şirket açar.
- **Kişi değişiklikleri:** Bir karar verici şirket değiştirir. Eski kaydı güncellenmek yerine yeni şirket altında yeni bir kişi olarak eklenir.
- **Farklı yazımlar:** Türkçe karakterler (İ/I, ş/s, ğ/g), büyük-küçük harf farkları ve kısaltmalar aynı kişiyi ya da şirketi sistemin gözünde iki ayrı varlığa dönüştürür.

Bu kaynakları bilmek önemlidir. Temizliğin ikinci yarısı, yani önleme, tam olarak bu giriş noktalarını kapatmaya dayanır.

## Mükerrer kayıtlar satış ekibine neye mal olur?

Mükerrer kayıt, raporda küçük bir kusur gibi görünür. Sahada ise doğrudan gelir kaybı ve itibar riski yaratır. Somut sonuçlar şöyle sıralanabilir:

1. **Aynı kişiye iki farklı e-posta dizisi gider.** Satın alma müdürü aynı hafta iki temsilciden, iki farklı tonda ve iki farklı teklifle e-posta alır. Bu, şirketinizin kendi içinde iletişim kuramadığı izlenimini verir.
2. **Lead atama çatışmaları çıkar.** İki kayıt iki farklı temsilciye atanır, ikisi de aynı müşteriyi arar ve komisyon tartışması başlar. [Lead atama kurallarını nasıl kuracağınızı](/blog/lead-atama-kurallari-nasil-kurulur-adim-adim-rehber) ne kadar iyi tasarlarsanız tasarlayın, kural iki ayrı kayıt gördüğü sürece iki ayrı atama yapar.
3. **Pipeline şişer, tahmin bozulur.** Aynı fırsat iki şirket kaydı altında açıldığında pipeline değeri olduğundan yüksek görünür. Bu da [pipeline'dan gerçekçi satış tahmini yapmayı](/blog/satis-tahmini-nasil-yapilir) imkânsızlaştırır.
4. **Aktivite geçmişi parçalanır.** Bir müşteriyle yapılan son üç görüşme bir kayıtta, teklif başka bir kayıttadır. Yeni devralan temsilci resmin yarısını görür.
5. **İzin ve abonelikten çıkma kayıtları kaybolur.** Kişi bir kayıtta abonelikten çıkmıştır ama diğer kayıt hâlâ aktif listededir. Bu durum hem itibar hem de ticari ileti mevzuatı açısından risk oluşturur.
6. **Lisans ve veri maliyeti artar.** Kayıt sayısına göre fiyatlanan CRM ve e-posta araçlarında, var olmayan kişiler için ödeme yaparsınız.

Kısacası mükerrer kayıt yalnızca bir "veri hijyeni" konusu değildir. Satış operasyonunun güvenilirliğini doğrudan etkiler.

## CRM'de ne kadar mükerrer kayıt olduğunu nasıl anlarsınız?

Temizliğe başlamadan önce sorunun boyutunu ölçün. Bunun için karmaşık bir araca gerek yoktur. CRM'den kişi ve şirket listelerini dışa aktarıp bir tabloda şu kontrolleri yapmanız yeterlidir:

- **E-posta adresi tekrarı:** Küçük harfe çevrilmiş ve boşlukları temizlenmiş e-posta sütununda aynı değerin kaç kez geçtiğini sayın. Bu, en güvenilir ilk göstergedir.
- **Telefon numarası tekrarı:** Numaraları yalnızca rakamlardan oluşacak şekilde sadeleştirip son 10 haneye göre gruplayın.
- **Alan adı (domain) tekrarı:** Şirket kayıtlarında web sitesi alanını "www." ve "https://" kısımlarından arındırarak gruplayın. Aynı alan adına bağlı birden fazla şirket kaydı, büyük olasılıkla mükerrerdir.
- **Şirket adı benzerliği:** Ünvan eklerini (A.Ş., Ltd. Şti., San. ve Tic.) çıkardıktan sonra kalan kök isimleri karşılaştırın.

Örnek bir senaryo düşünelim: 12.000 kişi ve 3.500 şirket kaydı olan bir ekip bu kontrolleri yapıyor. E-posta bazında birkaç yüz tekrar, alan adı bazında ise yüzlerce şirket grubu çıkabilir. Bu sayıları bir yere not edin. Temizlik sonrasında aynı kontrolü tekrar çalıştırıp ilerlemeyi ölçeceksiniz.

## Temizliğe başlamadan önce ne yapılmalı?

Birleştirme işlemlerinin çoğu CRM'de geri alınamaz. Bu yüzden hazırlık aşaması, temizliğin kendisi kadar önemlidir.

- **Tam yedek alın.** Kişi, şirket, fırsat, aktivite ve not tablolarının tamamını dışa aktarın. Tarihli bir klasörde saklayın.
- **Bir veri sahibi belirleyin.** Temizliği "herkes biraz yapsın" yaklaşımıyla yürütmeyin. Kararları verecek, istisnaları onaylayacak tek bir kişi ya da küçük bir ekip olsun.
- **Kapsamı netleştirin.** İlk turda yalnızca kişi kayıtlarını mı, yalnızca şirketleri mi, yoksa ikisini birden mi temizleyeceğinize karar verin. Genellikle önce şirketler, sonra kişiler temizlenir. Kişiler şirketlere bağlı olduğu için bu sıra daha az iş çıkarır.
- **Otomasyonları geçici olarak durdurun.** Temizlik sırasında aktif e-posta dizileri, atama kuralları ve senkronizasyonlar yeni kayıt açabilir ya da birleştirilen kayıtlar üzerinde beklenmedik tetiklemeler yapabilir.
- **Ekibi bilgilendirin.** Temsilcilere hangi gün ve saatte hangi kayıtların birleştirileceğini söyleyin. Böylece "müşterim kayboldu" panikleri yaşanmaz.

## Adım adım CRM mükerrer kayıt temizleme süreci

### 1. Veriyi standartlaştırın

Eşleştirme yapmadan önce verinin aynı dilde konuşması gerekir. Aksi takdirde aynı kişi farklı yazımlar yüzünden eşleşmez. Standartlaştırma kuralları için birkaç örnek:

- **E-posta:** Tümünü küçük harfe çevirin, baş ve sondaki boşlukları silin. "Ahmet.Yilmaz@Firma.com.tr " ile "ahmet.yilmaz@firma.com.tr" aynı kayıt olmalıdır.
- **Telefon:** Tüm numaraları tek bir formata getirin, örneğin +90 5XX XXX XX XX. "0532...", "532...", "+90 532..." ve "90532..." yazımlarının hepsi aynı numarayı gösterir.
- **Şirket adı:** Eşleştirme için ayrı bir "kök ad" alanı oluşturun. "Yıldız Makine San. ve Tic. Ltd. Şti." ile "YILDIZ MAKİNE A.Ş." kayıtlarının kök adı "yildiz makine" olsun.
- **Türkçe karakterler:** Eşleştirme alanında İ, ı, ş, ğ, ü, ö, ç harflerini Latin karşılıklarına dönüştürün. Orijinal ad alanına dokunmayın. Dönüştürme yalnızca karşılaştırma içindir.
- **Web sitesi:** "https://www.firma.com.tr/" ile "firma.com.tr" aynı değere indirgenmelidir.

Bu adımda orijinal verinizi bozmamaya dikkat edin. Standartlaştırılmış değerleri yardımcı alanlarda tutmak, hem güvenli hem de geri dönülebilir bir yöntemdir.

### 2. Eşleştirme kurallarını tanımlayın

Eşleştirme kuralları iki gruba ayrılır:

**Kesin eşleşmeler (otomatik birleştirilebilir):**
- Aynı e-posta adresine sahip kişi kayıtları
- Aynı vergi kimlik numarasına sahip şirket kayıtları (bu alanı tutuyorsanız Türkiye'deki en güvenilir şirket anahtarıdır)
- Aynı alan adına ve aynı kök ada sahip şirket kayıtları

**Olası eşleşmeler (manuel onay gerektirir):**
- Aynı ad soyad ve aynı şirket, ama farklı e-posta adresi
- Aynı telefon numarası, farklı isim (santral numarası olabilir)
- Benzer kök ad, farklı alan adı (grup şirketi ya da gerçekten farklı bir firma olabilir)

Kesin eşleşmeleri toplu işlemle, olası eşleşmeleri ise bir inceleme listesiyle ele alın. İnceleme listesini temsilcilere değil, veri sahibine verin. Temsilci kendi kaydını korumaya eğilimli olur.

### 3. Her grup için ana kaydı seçin

Birleştirilecek her grupta bir kayıt "ana kayıt" olarak kalır, diğerleri onun içine akar. Ana kaydı seçerken şu öncelik sırasını kullanabilirsiniz:

1. Açık fırsatı veya aktif müşteri sözleşmesi olan kayıt
2. En fazla aktivite geçmişine (arama, toplantı, e-posta) sahip kayıt
3. En son güncellenen kayıt
4. En eski oluşturulma tarihine sahip kayıt

Bu sırayı yazılı bir kural hâline getirin. Böylece yüzlerce grupta tutarlı karar verilir.

### 4. Alan bazlı birleştirme kurallarını belirleyin

Ana kayıt seçildikten sonra çakışan alanlarda hangi değerin kalacağına karar vermeniz gerekir. Örnekler:

- **Unvan ve departman:** En son güncellenen değer kalsın. Kişiler terfi alır, unvan değişir.
- **Telefon ve e-posta:** Ana değer korunsun, diğerleri "ikincil telefon" veya "alternatif e-posta" alanına taşınsın. Veri kaybolmasın.
- **Lead kaynağı:** İlk kaynak korunsun. Pazarlama atfı (attribution) için ilk temas noktası önemlidir.
- **Abonelikten çıkma ve iletişim izni:** En kısıtlayıcı değer kazansın. Kayıtlardan biri bile "iletişime kapalı" ise birleşik kayıt da kapalı olmalıdır.
- **Kayıt sahibi (owner):** Açık fırsatın sahibi kazansın. Fırsat yoksa en son aktivite yapan temsilci kalsın.

Özellikle izin alanındaki kural tartışmaya açık değildir. Burada yapılacak bir hata, temizlik projesinin tüm faydasını gölgede bırakır.

### 5. İlişkili kayıtları taşıyın

Kişi veya şirket kaydını birleştirmek yetmez. Ona bağlı olan her şey de ana kayda taşınmalıdır:

- Fırsatlar ve teklifler
- Arama, toplantı, e-posta ve not geçmişi
- Görevler ve hatırlatıcılar
- E-posta dizisi kayıtları
- Ekli dosyalar

CRM'lerin yerleşik birleştirme fonksiyonları bu taşımayı genellikle otomatik yapar. Toplu işlemi API veya harici bir araçla yapıyorsanız ilişkili nesneleri ayrıca kontrol etmeniz gerekir. Bir kişi kaydını silip yeniden oluşturmak, bağlı tüm geçmişi kaybetmek demektir.

### 6. Önce pilot, sonra toplu birleştirme

İlk turda 50-100 gruplu küçük bir örneklemle başlayın. Birleştirme sonrasında şunları kontrol edin:

- Fırsatlar doğru şirkette mi?
- Aktivite geçmişi eksiksiz mi?
- İzin alanları doğru mu?
- Raporlar ve dashboard'lar beklendiği gibi güncellendi mi?

Pilot sorunsuz geçtiyse toplu işleme geçin. Toplu işlemi de tek seferde değil, birkaç yüz kayıtlık parçalar hâlinde yapmak hataları erken yakalamanızı sağlar.

### 7. Sonucu doğrulayın ve ölçün

Temizlik bittiğinde başlangıçta yaptığınız denetimi aynı yöntemle tekrar çalıştırın. Kesin eşleşme grubunda sıfıra yakın bir sonuç beklenir. Olası eşleşmelerde ise kalanların bilinçli olarak ayrı bırakılan kayıtlar olduğundan emin olun. Temsilcilerden bir hafta boyunca "kaybolan müşteri" veya "yanlış birleşen kayıt" geri bildirimi toplayın.

## Hangi kayıtlar birleştirilmemeli?

Her benzerlik bir mükerrer değildir. Aşırı agresif birleştirme, en az mükerrer kayıt kadar zarar verir. Dikkat edilmesi gereken durumlar:

- **Holding ve grup şirketleri:** Aynı grubun inşaat ve enerji şirketleri farklı karar vericilere, farklı bütçelere ve farklı satın alma süreçlerine sahiptir. Bunları birleştirmek yerine üst şirket–alt şirket (parent–child) ilişkisiyle bağlayın.
- **Şubeler ve bölge ofisleri:** İstanbul ve İzmir ofisi ayrı ayrı satın alma yapıyorsa ayrı kayıt kalmalıdır.
- **Aynı isimli farklı kişiler:** Büyük şirketlerde iki "Mehmet Demir" bulunması sürpriz değildir. E-posta ve departman farklıysa birleştirmeyin.
- **Genel adresler:** info@, satis@, muhasebe@ gibi adresler birden fazla kişiyle ilişkilendirilmiş olabilir. Bu adresler üzerinden kişi birleştirmesi yapmayın.
- **Bayi ve distribütörler:** Aynı alan adını kullanan bayiler, hukuki olarak ayrı şirketler olabilir.

Bu istisnaları baştan bir "birleştirme yapılmayacaklar" listesine yazın ve eşleştirme kurallarınızdan hariç tutun.

## Mükerrer kayıtların tekrar oluşması nasıl önlenir?

Temizlik tek başına geçici bir rahatlama sağlar. Giriş noktalarını kapatmazsanız birkaç ay içinde aynı noktaya dönersiniz. Önleme katmanları şunlardır:

### İçe aktarmada kontrol

Her toplu yüklemeden önce listeyi mevcut CRM verisiyle e-posta ve alan adı üzerinden karşılaştırın. Eşleşen kayıtlar "güncelle", eşleşmeyenler "yeni oluştur" olarak işlensin. Prospecting araçlarından liste çekiyorsanız, örneğin [Apollo.io](https://get.apollo.io/679irkzm35ya) gibi bir platformdan, dışa aktarmadan önce CRM'de zaten var olan kişileri hariç tutma seçeneklerini kullanın. Dış kaynaklı lead listelerini düzenli olarak yönetemiyorsanız bu süreci uzman bir ekibe bırakmak da mantıklı olabilir. [B2B SaaS şirketlerine outbound ve lead generation hizmeti veren SAAS Corner](https://saascorner.co), liste üretimini bu tür veri hijyeni kurallarıyla birlikte ele alır.

### Formlarda ve entegrasyonlarda "önce ara, sonra oluştur" mantığı

Web formu doldurulduğunda doğrudan yeni kayıt açmak yerine sistem önce e-posta adresini arasın. Kayıt varsa güncellensin, yoksa oluşturulsun. Bu kuralı [n8n ile kurulan bir B2B satış otomasyonu](/blog/n8n-ile-b2b-satis-otomasyonu-rehberi) içinde birkaç düğümle uygulamak mümkündür: form tetikleyicisi, CRM'de arama, koşul düğümü ve buna göre oluşturma ya da güncelleme.

### Benzersiz tanımlayıcı kullanımı

Kişiler için e-posta adresi, şirketler için alan adı veya vergi numarası benzersiz anahtar olarak tanımlanmalıdır. Birçok CRM, belirli bir alanın benzersiz olmasını zorunlu tutmanıza izin verir. Bu ayarı açmak, manuel girişte de mükerrerliği büyük ölçüde engeller.

### Zenginleştirme ile tutarlılık

Veri zenginleştirme araçları, şirket kayıtlarına standart bir alan adı, sektör ve çalışan sayısı bilgisi ekleyerek eşleştirmeyi kolaylaştırır. Elle girilen "Akdeniz Lojistik" ile otomatik zenginleştirilen alan adı yan yana geldiğinde mükerrerlik çok daha kolay fark edilir. [B2B veri zenginleştirmenin Türkiye'de nasıl yapıldığını](/blog/b2b-veri-zenginlestirme-nasil-yapilir) anlattığımız rehber, bu adımı temizlik sürecine nasıl bağlayacağınızı detaylandırıyor.

### E-posta doğrulama

Birleştirme sonrasında kalan e-posta adreslerini doğrulamadan geçirmek iyi bir pratiktir. Geçersiz adresler hem mükerrer analizini yanıltır hem de gönderici itibarınızı düşürür. Bu konuda [e-posta bounce oranını düşürme rehberimiz](/blog/eposta-bounce-orani-nasil-dusurulur) pratik adımlar içeriyor.

## Hangi araçlarla yapılır, maliyeti ne kadar?

Mükerrer kayıt temizliği için üç temel yaklaşım vardır:

1. **CRM'in yerleşik araçları:** HubSpot, Salesforce, Pipedrive ve Zoho gibi platformların çoğunda mükerrer tespiti ve birleştirme özellikleri bulunur. Bazıları yalnızca üst paketlerde sunulur. Küçük ve orta ölçekli veri setleri için genellikle yeterlidir. Ek maliyet çoğu zaman paket yükseltmesiyle sınırlıdır.
2. **Tablo tabanlı manuel yöntem:** Veriyi dışa aktarıp Excel veya Google Sheets'te standartlaştırma ve gruplama yapmak, ardından birleştirme listesini CRM'e geri yüklemek. Yazılım maliyeti yoktur ama zaman maliyeti yüksektir. Birkaç bin kayıt için uygulanabilir.
3. **Özel veri kalitesi araçları ve otomasyon akışları:** Bulanık eşleştirme, toplu birleştirme ve sürekli izleme sunan araçlar veya n8n gibi platformlarla kurulan özel akışlar. On binlerce kayıt ve birden fazla veri kaynağı olan ekipler için uygundur.

Doğru seçim, kayıt sayınıza, kaynak çeşitliliğinize ve temizliğin ne sıklıkla tekrarlanacağına bağlıdır. Tek seferlik bir temizlik için yerleşik araçlar yeterli olabilir. Sürekli veri akışı olan bir outbound operasyonu için ise önleme kurallarını otomatikleştirmek uzun vadede daha ucuza gelir.

## Temizliği kalıcı kılmak için hangi rutin kurulmalı?

Veri kalitesi bir proje değil, bir alışkanlıktır. Önerilen rutin:

- **Haftalık:** Yeni oluşturulan kayıtlarda kesin eşleşme kontrolü. Otomatik bir rapor bu işi birkaç dakikaya indirir.
- **Aylık:** Olası eşleşmeler listesinin veri sahibi tarafından gözden geçirilmesi.
- **Çeyreklik:** Tam denetim. Başlangıçtaki ölçümlerin tekrarlanması ve trendin izlenmesi.
- **Her yeni entegrasyon veya içe aktarma öncesi:** Eşleştirme anahtarının ve "güncelle ya da oluştur" mantığının test edilmesi.

Bu rutine bir de sorumluluk ekleyin. Veri kalitesini bir satış operasyonları sorumlusunun hedeflerine dahil etmek, sürecin unutulmasını engeller.

## Sık sorulan sorular

### CRM'de mükerrer kayıtları silmek mi, birleştirmek mi daha doğru?

Neredeyse her durumda birleştirmek daha doğrudur. Silme işlemi, kayda bağlı aktivite geçmişini, fırsatları ve izin bilgilerini kalıcı olarak yok edebilir. Birleştirme ise tüm geçmişi tek bir ana kayıtta toplar.

### Mükerrer kayıt temizliği ne kadar sürer?

Süre kayıt sayısına, veri kaynaklarının çeşitliliğine ve otomasyon düzeyine bağlıdır. Birkaç bin kayıtlık bir CRM'de hazırlık, pilot ve toplu birleştirme genellikle birkaç gün içinde tamamlanabilir. On binlerce kayıt ve çok sayıda entegrasyon olan yapılarda süreç birkaç haftaya yayılabilir.

### Şirket kayıtlarını eşleştirirken en güvenilir alan hangisi?

Türkiye'de vergi kimlik numarası en güvenilir şirket anahtarıdır, ancak her CRM'de bu alan tutulmaz. Bu durumda web sitesi alan adı en pratik alternatiftir. Şirket adı ise ünvan ekleri ve yazım farkları nedeniyle tek başına güvenilir değildir.

### Temizlikten sonra mükerrer kayıtlar neden yeniden oluşuyor?

Çünkü temizlik geçmişi düzeltir, giriş noktalarını kapatmaz. Formlar, toplu içe aktarmalar ve entegrasyonlar "önce ara, sonra oluştur" mantığıyla çalışmıyorsa yeni mükerrerler oluşmaya devam eder. Kalıcı çözüm için önleme kuralları temizlikle birlikte kurulmalıdır.

## Sonuç

CRM'deki mükerrer kayıtlar yalnızca düzensiz bir veritabanı görüntüsü yaratmaz. Aynı müşteriye çift e-posta gitmesine, temsilciler arasında atama çatışmalarına ve güvenilmez pipeline raporlarına yol açar. Etkili bir temizlik; yedekleme, standartlaştırma, net eşleştirme kuralları, tutarlı ana kayıt seçimi ve pilotla başlayan kontrollü bir birleştirme sürecinden oluşur. Bu temizliğin kalıcı olması ise içe aktarma, form ve entegrasyon noktalarında kurulan önleme otomasyonlarına bağlıdır.

CRM verinizi temizlemek ve mükerrer kayıtları kaynağında engelleyen otomasyonlar kurmak istiyorsanız, mevcut yapınızı birlikte değerlendirelim. Sales Corner ekibiyle [görüşme planlayarak](/iletisim) ilk adımı atabilirsiniz.
