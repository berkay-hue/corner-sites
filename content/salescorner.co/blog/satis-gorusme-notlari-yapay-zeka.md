---
title: "Satış Görüşme Notlarını Yapay Zekayla Otomatikleştirme"
description: "Satış görüşmesi notlarını yapay zekayla CRM'e otomatik kaydetmenin adım adım sürecini, veri güvenliği ve KVKK sınırlarıyla birlikte anlatıyoruz."
date: "2026-10-25"
category: "Yapay Zeka"
image: "https://images.pexels.com/photos/3865639/pexels-photo-3865639.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Satış Görüşme Notlarını Yapay Zekayla Otomatikleştirme"
alt: "automate-sales-call-notes-with-ai"
---

Satış görüşme notlarını yapay zekayla otomatikleştirmek, görüşmenin kaydedilip yazıya dökülmesi, bir dil modeliyle önceden tanımlı alanlara göre özetlenmesi ve sonucun insan müdahalesine gerek kalmadan CRM'e işlenmesi demektir. Doğru kurulduğunda satış temsilcisi görüşme bittikten sonra 15-20 dakika not yazmak yerine birkaç dakika içinde hazır özeti kontrol edip onaylar. Pipeline'daki bilgi de standart, aranabilir ve güncel hale gelir.

Bu yazıda otomatik not akışının parça parça nasıl çalıştığını anlatıyoruz. Notlarda hangi alanların olması gerektiğini, adım adım kurulumu, maliyet hesabını, KVKK tarafındaki dikkat noktalarını ve ekiplerin en sık yaptığı hataları ele alıyoruz. Amacımız "yapay zeka not tutsun" fikrini, satış ekibinin her gün güvenerek kullanabileceği bir iş akışına dönüştürmek.

## Satış görüşme notlarını otomatikleştirmek tam olarak ne demek?

Pek çok ekip "otomatik not" denince yalnızca transkripsiyonu düşünür. Oysa transkript tek başına not değildir. 45 dakikalık bir keşif görüşmesinin transkripti kolayca 6.000-8.000 kelimeyi bulur. Kimse bunu tekrar okumaz, CRM'e yapıştırıldığında da kimsenin işine yaramaz.

Gerçek otomasyon dört katmandan oluşur:

- **Yakalama:** Görüşmenin sesinin ya da videosunun kaydedilmesi. Zoom, Google Meet, Teams veya telefon santrali üzerinden yapılabilir.
- **Transkripsiyon:** Konuşmanın metne çevrilmesi ve konuşmacıların ayrıştırılması. "Satıcı ne dedi, müşteri ne dedi?" sorusunun cevabı bu katmanda netleşir.
- **Anlamlandırma:** Bir dil modelinin transkripti okuyup ihtiyaç, bütçe, karar verici, itirazlar ve sonraki adım gibi alanlara göre yapılandırılmış bir özet çıkarması.
- **Aksiyon:** Bu özetin CRM'deki doğru fırsat kaydına yazılması, takip görevlerinin oluşturulması ve gerekirse takip e-postası taslağının hazırlanması.

İlk iki katman artık neredeyse emtia haline geldi. Fark yaratan kısım son iki katmandır, yani modelin neyi çıkaracağını sizin satış metodolojinize göre tanımlamak ve bu çıktıyı iş akışınıza bağlamak.

## Manuel not tutma neden satış ekibini yavaşlatıyor?

Sorun yalnızca zaman kaybı değil, ama oradan başlayalım. Basit bir örnek hesap yapalım. Bir temsilci günde 5 görüşme yapıyor ve her görüşmenin ardından notları düzenleyip CRM'e girmek için ortalama 15 dakika harcıyor. Bu, günde 75 dakika, haftada 6 saatten fazla eder. 8 kişilik bir ekipte haftada yaklaşık 50 saat, yani neredeyse bir tam zamanlı çalışanın mesaisi not yazmaya gidiyor.

Daha büyük maliyet ise görünmeyen tarafta:

- **Tutarsızlık:** Her temsilci farklı formatta not alır. Biri bütçeyi yazar, diğeri yazmaz. Yönetici pipeline toplantısında aynı soruları tekrar tekrar sormak zorunda kalır.
- **Gecikme:** Görüşme sonrası not, çoğu zaman gün sonuna ya da ertesi güne kalır. Bu sürede detaylar unutulur.
- **Seçici hafıza:** İnsanlar duymak istediklerini hatırlar. Müşterinin "bütçemiz şu an yok ama Q3'te bakabiliriz" cümlesi notlara "olumlu görüşme" diye geçebilir.
- **Kaybolan sinyaller:** Rakip isimleri, belirli bir özellik talebi, satın alma sürecindeki ek paydaşlar gibi bilgiler dağınık notlarda kaybolur, ürün ve pazarlama ekiplerine hiç ulaşmaz.

Kısacası manuel not, CRM'deki verinin kalitesini doğrudan düşürür. Kötü veriyle yapılan her tahmin, her önceliklendirme ve her koçluk görüşmesi de bu kaliteyi miras alır.

## Otomatik not akışı nasıl çalışır?

Tipik bir akışı uçtan uca şöyle düşünebilirsiniz:

1. Temsilci takvimdeki toplantıya katılır. Bir kayıt aracı ya da toplantı botu görüşmeyi otomatik olarak kaydeder.
2. Görüşme bittiğinde ses dosyası bir transkripsiyon servisine gönderilir.
3. Transkript, konuşmacı etiketleriyle birlikte bir dil modeline iletilir. Modelden, önceden tanımlanmış bir şablona göre yapılandırılmış çıktı (ör. JSON) üretmesi istenir.
4. Çıktı doğrulanır: Zorunlu alanlar dolu mu, tarih formatı doğru mu, fırsat ID'si eşleşiyor mu?
5. Özet, CRM'deki ilgili fırsat ya da kişi kaydına not olarak eklenir. Belirli alanlar (aşama, tahmini kapanış tarihi, karar verici) güncelleme önerisi olarak işaretlenir.
6. Temsilciye Slack, Teams veya e-posta üzerinden "özetiniz hazır, onaylayın" bildirimi gider.
7. Onaylanan sonraki adımlar CRM'de görev olarak açılır. İsteğe bağlı olarak takip e-postası taslağı oluşturulur.

Burada kritik nokta **5. adım**: Yapay zekanın CRM alanlarını doğrudan değiştirmesine izin vermek yerine öneri olarak sunması, özellikle ilk aylarda güveni korumanın en sağlıklı yoludur.

## Görüşme notlarında hangi alanlar olmalı?

Modelin kalitesini belirleyen en önemli şey, ondan ne istediğinizdir. "Bu görüşmeyi özetle" komutu, her seferinde farklı uzunlukta ve farklı odakta metinler üretir. Bunun yerine satış metodolojinize uygun sabit bir şablon tanımlayın.

Keşif (discovery) görüşmeleri için örnek bir şablon:

- **Görüşme tipi:** Keşif, demo, teklif, müzakere
- **Katılımcılar ve rolleri:** Müşteri tarafında kim vardı, unvanı ne, karar sürecindeki rolü ne?
- **Mevcut durum:** Müşteri bugün bu işi nasıl yapıyor, hangi araçları kullanıyor?
- **Temel sorun:** Müşterinin kendi cümleleriyle dile getirdiği acı noktası (mümkünse doğrudan alıntı)
- **Etkisi:** Sorunun işe etkisi; zaman, para, risk
- **Bütçe sinyali:** Bütçe var mı, ne zaman ayrılıyor, kim onaylıyor?
- **Karar süreci:** Kaç kişi dahil, satın alma veya hukuk onayı gerekiyor mu?
- **Zamanlama:** Müşterinin belirttiği hedef tarih ya da tetikleyici olay
- **Rakipler ve alternatifler:** Değerlendirilen diğer çözümler, "hiçbir şey yapmamak" seçeneği dahil
- **İtirazlar ve endişeler:** Fiyat, entegrasyon, güvenlik vb.
- **Sonraki adım:** Kim, neyi, hangi tarihe kadar yapacak?
- **Önerilen pipeline aşaması:** Görüşmenin içeriğine göre fırsatın hangi aşamada olması gerektiği ve gerekçesi

Son madde özellikle değerlidir. Model, aşama geçiş kriterlerinizi biliyorsa fırsatın gerçekten ilerleyip ilerlemediği konusunda objektif bir ikinci görüş sunar. Bunun için önce [pipeline aşamalarınızı net giriş ve çıkış kriterleriyle tanımlamanız](/blog/satis-pipeline-asamalari-nasil-tanimlanir) gerekir. Tanımsız aşamalarla çalışan bir modelden tutarlı öneri beklemek gerçekçi değildir.

### Prompt nasıl yazılmalı?

İyi bir özetleme prompt'u genellikle şu parçalardan oluşur:

- **Rol ve bağlam:** "Sen B2B satış görüşmelerini analiz eden bir asistansın. Şirketimiz X ürününü Y segmentindeki şirketlere satıyor."
- **Şablon:** Yukarıdaki alanların listesi ve her alanın ne anlama geldiğinin kısa tanımı.
- **Kurallar:** "Transkriptte açıkça geçmeyen bilgiyi uydurma; bilinmiyorsa 'belirtilmedi' yaz." "Müşterinin sorununu mümkünse kendi cümlesiyle alıntıla." "Sonraki adımda tarih yoksa tarih ekleme."
- **Çıktı formatı:** Sabit anahtarlara sahip JSON. Böylece CRM'e yazarken ayrıştırma hatası yaşanmaz.

"Uydurma" kuralı hafife alınmamalı. Dil modelleri boşlukları makul görünen tahminlerle doldurmaya eğilimlidir. "Bütçe: yaklaşık 50.000 TL" gibi transkriptte hiç geçmeyen bir ifade CRM'e girerse, otomatik not sistemi manuel nottan daha zararlı hale gelir.

## Adım adım kurulum: İlk 30 günde ne yapılmalı?

Aşağıdaki sıralama, küçük ve orta ölçekli B2B satış ekipleri için gerçekçi bir başlangıç planıdır.

1. **Kapsamı daraltın (1. hafta):** Her görüşme tipini aynı anda otomatikleştirmeye çalışmayın. En çok tekrar eden ve en çok bilgi kaybı yaşanan görüşme tipini seçin. Çoğu ekip için bu, keşif görüşmesidir.
2. **Şablonu yazın (1. hafta):** Satış yöneticisi ve en deneyimli iki temsilciyle birlikte keşif görüşmesinden çıkması gereken alanları belirleyin. 10-12 alanı geçmeyin.
3. **Kayıt ve transkripsiyonu seçin (1. hafta):** Kullandığınız toplantı platformuyla doğal entegrasyonu olan, Türkçe transkripsiyon kalitesi iyi bir çözüm seçin. Türkçe-İngilizce karışık konuşmaları (sektör jargonu) nasıl işlediğini mutlaka test edin.
4. **Manuel prototip (2. hafta):** Otomasyonu kurmadan önce geçmiş 10-15 görüşmenin transkriptini prompt'unuzla elle çalıştırın. Çıktıları, o görüşmeyi yapan temsilcinin kendi notlarıyla karşılaştırın. Eksik ya da hatalı alanlara göre prompt'u revize edin.
5. **Akışı otomatikleştirin (3. hafta):** Kayıt, transkript, model, doğrulama ve CRM adımlarını birbirine bağlayın. Bu noktada hazır bir not aracının yerleşik entegrasyonunu ya da bir iş akışı otomasyon aracını kullanabilirsiniz.
6. **İnsan onayıyla canlıya alın (3-4. hafta):** İlk aşamada her özet temsilci onayından sonra CRM'e işlensin. Temsilcinin yaptığı düzeltmeleri kaydedin. Bunlar prompt iyileştirmesi için en değerli veridir.
7. **Gözden geçirin (4. hafta sonu):** Onay oranı, düzeltme sıklığı ve temsilcilerin not için harcadığı süre üzerinden bir değerlendirme yapın. Sonra ikinci görüşme tipine (ör. demo) geçin.

### n8n ile örnek bir iş akışı

Hazır bir not aracı yerine kendi akışınızı kurmak istiyorsanız n8n gibi açık kaynaklı bir otomasyon aracı esneklik sağlar. Basitleştirilmiş bir akış şöyle görünür:

- **Tetikleyici:** Toplantı platformundan gelen "kayıt hazır" webhook'u
- **HTTP isteği:** Ses dosyasını transkripsiyon servisine gönder, transkripti al
- **Kod düğümü:** Toplantı katılımcılarının e-posta adreslerinden CRM'deki kişi ve fırsatı bul
- **Yapay zeka düğümü:** Transkripti ve fırsatın mevcut bilgilerini prompt ile modele gönder, JSON çıktısı al
- **Doğrulama düğümü:** Zorunlu alanlar ve format kontrolü. Hata varsa akışı insan incelemesine yönlendir.
- **Slack/Teams düğümü:** Temsilciye özet ve "Onayla / Düzenle" butonları gönder
- **CRM düğümü:** Onaylanan özeti nota yaz, görevleri oluştur

Bu tür bir akışı sıfırdan kurmak istiyorsanız [n8n ile B2B satış otomasyonuna başlangıç rehberimiz](/blog/n8n-ile-b2b-satis-otomasyonu-rehberi) temel kavramları ve ilk kurulum adımlarını anlatıyor.

Bir ipucu: Modele yalnızca transkripti değil, fırsatın CRM'deki mevcut durumunu da gönderin. Böylece model "bu görüşmede ne değişti?" sorusunu cevaplayabilir. Örneğin "karar verici önceki görüşmede satın alma müdürü olarak girilmişti, bu görüşmede CFO'nun da onay vereceği ortaya çıktı" gibi bir tespit yapabilir. Değişime odaklanan özet, her seferinde sıfırdan yazılan özetten çok daha kullanışlıdır.

## Hangi aracı seçmeliyim: hazır çözüm mü, kendi akışınız mı?

Temelde üç seçenek var:

- **Hazır görüşme zekası (conversation intelligence) platformları:** Kayıt, transkript, özet ve CRM entegrasyonunu tek pakette sunar. Kurulumu hızlıdır ama özelleştirme sınırlı olabilir. Kullanıcı başı lisansla fiyatlandırılır.
- **CRM'in kendi yapay zeka özellikleri:** Bazı CRM'ler görüşme özetlemeyi yerleşik olarak sunar. Veri tek yerde kalır ama Türkçe kalitesi ve şablon esnekliği değişkendir.
- **Kendi akışınız:** Transkripsiyon API'si, dil modeli API'si ve bir otomasyon aracıyla kurulur. En esnek ve genellikle ölçekte en ekonomik seçenektir. Buna karşılık bakım sorumluluğu sizdedir.

Seçim yaparken şu sorulara cevap arayın: Türkçe transkripsiyon kalitesi gerçek görüşmelerinizde yeterli mi? Şablonu kendi metodolojinize göre değiştirebiliyor musunuz? Veriler nerede saklanıyor? CRM'inize çift yönlü yazabiliyor mu? Daha kapsamlı bir değerlendirme çerçevesi için [satış için yapay zeka aracı seçerken dikkat edilmesi gereken kriterleri](/blog/satis-icin-yapay-zeka-araci-secimi) ayrıca ele aldık.

## Maliyeti ne kadar?

Kesin bir rakam vermek mümkün değil, çünkü maliyet ekip büyüklüğüne, görüşme hacmine ve seçtiğiniz modele göre ciddi şekilde değişir. Ama hesabın nasıl yapılacağını göstermek mümkün.

**Hazır platformlarda** maliyet büyük ölçüde kullanıcı sayısına bağlıdır: Temsilci sayısı × aylık lisans ücreti. Görüşme hacmi artsa da kullanıcı başı ücret genellikle sabit kalır. Bu yüzden çok görüşme yapan küçük ekipler için avantajlı olabilir.

**Kendi akışınızda** maliyet kullanıma bağlıdır ve üç kalemden oluşur:

- **Transkripsiyon:** Genellikle dakika başına ücretlendirilir.
- **Dil modeli:** İşlenen metin miktarına (token) göre ücretlendirilir. Uzun transkriptler ve büyük modeller maliyeti artırır.
- **Otomasyon altyapısı:** Kendi sunucunuzda barındırılan bir n8n kurulumu ya da bulut aboneliği.

Örnek bir hacim hesabı: 6 temsilcili bir ekip, kişi başı haftada 12 görüşme yapıyor ve görüşmeler ortalama 30 dakika sürüyor. Bu, haftada 2.160 dakika, ayda yaklaşık 9.000 dakika ses demektir. Seçtiğiniz servislerin güncel dakika ve token fiyatlarını bu hacimle çarptığınızda aylık değişken maliyetinizi bulursunuz. Bunu, yukarıda hesapladığımız not yazma süresinin temsilci maliyetiyle karşılaştırın. Çoğu senaryoda otomasyonun maliyeti, kazanılan satış zamanının değerinin küçük bir kesridir. Yine de kendi rakamlarınızla doğrulamadan karar vermeyin.

Gözden kaçan bir maliyet kalemi de **kurulum ve bakım emeğidir.** Prompt'ların güncellenmesi, CRM alanlarındaki değişikliklerin akışa yansıtılması ve hata takibi düzenli zaman ister.

## KVKK ve görüşme kaydı: Nelere dikkat etmelisiniz?

Görüşme kaydı kişisel veri işlemektir. Ses kaydı, kişinin adı, unvanı ve görüşmede paylaşılan bilgiler bu kapsama girer. Bu yüzden teknik kurulumdan önce hukuki çerçeveyi netleştirmek gerekir. Burada yazılanlar genel bilgi niteliğindedir. Kendi durumunuz için mutlaka hukuk danışmanınızla çalışın.

Pratikte dikkat edilen başlıca noktalar:

- **Bilgilendirme ve onay:** Görüşmenin kaydedileceğini ve yapay zeka ile işleneceğini katılımcılara görüşme öncesinde (davet metninde) ve görüşme başında açıkça belirtmek yaygın ve sağlıklı bir uygulamadır. Karşı taraf kabul etmezse kaydı kapatabilmelisiniz.
- **Yurt dışına veri aktarımı:** Transkripsiyon ve dil modeli servislerinin çoğu verileri yurt dışındaki sunucularda işler. Bu durum KVKK'daki yurt dışına aktarım hükümleri açısından ayrıca değerlendirilmelidir.
- **Saklama süresi:** Ham ses kayıtlarını süresiz saklamayın. Özet çıkarıldıktan sonra kaydın ne kadar tutulacağına dair bir politika belirleyin.
- **Hassas bilgi filtreleme:** Görüşmede kişisel telefon numarası, sağlık bilgisi gibi gereksiz veriler geçebilir. Prompt'a bu tür bilgileri özete almaması talimatını ekleyin.
- **Servis sağlayıcı sözleşmeleri:** Kullandığınız servislerin verilerinizi model eğitimi için kullanıp kullanmadığını kontrol edin. Kurumsal planlarda bu genellikle kapatılabilir.

## En sık yapılan hatalar nelerdir?

Görüşme notu otomasyonları teknik olarak çoğu zaman çalışır. Başarısız olduklarında sebep genellikle süreç ve benimsemedir. Bu hatalara genel bir bakış için [satış otomasyonu projelerinin neden başarısız olduğunu](/blog/satis-otomasyonu-projesi-neden-basarisiz-olur) anlattığımız yazıya da göz atabilirsiniz. Görüşme notlarına özgü hatalar ise şunlar:

- **Şablonsuz özet:** "Özetle" demek yeterli değil. Sabit alanlar olmadan çıktı karşılaştırılamaz ve raporlanamaz.
- **Her şeyi CRM'e dökmek:** Tam transkripti fırsat notuna yapıştırmak, CRM'i okunmaz hale getirir. Transkript ayrı bir yerde, bağlantı olarak durmalı. Notta yalnızca yapılandırılmış özet yer almalı.
- **İnsan onayını erken kaldırmak:** İlk haftalarda iyi giden bir sistemin onay adımını hemen kaldırmak cazip gelir. Ama modelin hatalarının bir kısmı ancak nadir görüşme tiplerinde ortaya çıkar. Düzeltme oranı belirli bir süre düşük seyretmeden onayı kaldırmayın.
- **Temsilcileri sürece dahil etmemek:** Notların "yönetici kontrolü" için tutulduğu algısı oluşursa temsilciler kayda direnç gösterir. Sistemi, onların zamanını geri kazandıran bir araç olarak konumlandırın. Şablon tasarımına onları dahil edin.
- **Konuşmacı ayrımını kontrol etmemek:** Transkriptte satıcı ile müşterinin cümleleri karışırsa, model satıcının söylediği bir şeyi müşterinin ihtiyacı gibi yazabilir. Konuşmacı etiketlerinin doğruluğunu test sürecinde mutlaka kontrol edin.
- **Türkçe kaliteyi varsaymak:** Demo videolarında kusursuz görünen araçlar, aksanlı, hızlı ya da jargon yoğun Türkçe konuşmalarda zorlanabilir. Kendi gerçek kayıtlarınızla test edin.

## Otomatik notlar satış sürecine başka ne katar?

Not yazma süresinden tasarruf işin yalnızca başlangıcı. Yapılandırılmış görüşme verisi biriktikçe başka kullanım alanları da açılır:

- **Takip e-postaları:** Görüşme özeti ve sonraki adımlar kullanılarak dakikalar içinde kişiselleştirilmiş takip e-postası taslağı hazırlanabilir. Temsilci yalnızca gözden geçirip gönderir.
- **Pipeline toplantıları:** Yönetici, her fırsat için "son görüşmede ne değişti, sonraki adım ne, risk ne?" sorularının cevabını toplantıdan önce hazır görür. Toplantı durum güncellemesinden strateji tartışmasına döner.
- **Koçluk:** Hangi temsilcinin keşif görüşmelerinde bütçe ya da karar süreci sorularını atladığı, alanların ne sıklıkla "belirtilmedi" olarak kaldığına bakılarak tespit edilebilir.
- **Ürün ve pazarlama geri bildirimi:** Rakip isimleri, tekrar eden itirazlar ve özellik talepleri tüm görüşmeler genelinde sayılabilir. Bu, ürün yol haritası ve mesajlaşma için doğrudan veri sağlar.
- **Outbound mesajların iyileştirilmesi:** Müşterilerin sorunlarını kendi cümleleriyle nasıl ifade ettiğini görmek, soğuk e-posta ve LinkedIn mesajlarında kullanılacak dili netleştirir. Yüksek hacimli outbound görüşmeler yapan B2B SaaS ekipleri için bu döngüyü uçtan uca kurmak isteyenler [SAAS Corner'ın outbound satış ve lead generation hizmetini](https://saascorner.co) inceleyebilir.

## Başarıyı nasıl ölçersiniz?

Otomasyonu kurduktan sonra "işe yaradı mı?" sorusunu hisle değil, rakamla cevaplamak gerekir. Takip edilmesi gereken göstergeler:

- **Not başına harcanan süre:** Kurulum öncesi ve sonrası temsilcilerin kendi beyanı ya da zaman takibiyle ölçülebilir.
- **Onay oranı ve düzeltme sıklığı:** Özetlerin yüzde kaçı değişiklik yapılmadan onaylanıyor, hangi alanlar en çok düzeltiliyor?
- **CRM veri doluluğu:** Fırsat kayıtlarında karar verici, bütçe, sonraki adım ve kapanış tarihi gibi kritik alanların doluluk oranı.
- **Not gecikmesi:** Görüşme bitişi ile notun CRM'e girmesi arasındaki süre.
- **Takip hızı:** Görüşme sonrası ilk takip e-postasının gönderilmesine kadar geçen süre.

Bu metrikleri ekip verimliliğine dair daha geniş bir çerçeveye oturtmak için [satış ekibi verimliliğini ölçmek için KPI rehberimizden](/blog/satis-ekibi-verimlilik-kpi-rehberi) yararlanabilirsiniz.

Görüşme notları, satış otomasyonu stratejinizin yalnızca bir parçası. Lead üretiminden kapanışa kadar tüm akışı tasarlamak isteyen şirketler için grubumuzun çatı şirketi [Corner Group, strateji ve otomasyon tarafında](https://cornergroup.co) bütüncül destek sunuyor.

## Sık sorulan sorular

### Yapay zeka Türkçe satış görüşmelerini doğru özetleyebilir mi?

Güncel transkripsiyon servisleri ve dil modelleri Türkçe görüşmelerde genellikle kullanılabilir kalitede sonuç verir. Ancak aksan, hızlı konuşma, kötü ses kalitesi ve Türkçe-İngilizce karışık sektör jargonu hata oranını artırabilir. Bu yüzden araç seçmeden önce kendi gerçek görüşme kayıtlarınızla test yapmanız ve ilk dönemde insan onayını korumanız önerilir.

### Görüşmeyi kaydetmek için müşteriden izin almak gerekir mi?

Görüşme kaydı kişisel veri işleme sayılır. Katılımcıları kayıt ve yapay zeka ile işleme konusunda önceden bilgilendirmek ve kabul etmeyenler için kaydı kapatabilmek sağlıklı bir uygulamadır. Yurt dışındaki servislere veri aktarımı gibi konular da ayrıca değerlendirilmelidir. Kesin yükümlülükleriniz için hukuk danışmanınızdan görüş almalısınız.

### Yapay zekanın ürettiği notlar doğrudan CRM'e yazılmalı mı?

Başlangıçta hayır. Özetin temsilciye onay için gönderilmesi ve onaylandıktan sonra CRM'e işlenmesi en güvenli yaklaşımdır. Düzeltme oranı belirli bir süre düşük seyrettikten sonra not alanı gibi düşük riskli alanlar otomatik yazılabilir. Pipeline aşaması ve kapanış tarihi gibi kritik alanlar ise öneri olarak kalmalıdır.

### Kurulum ne kadar sürer?

Hazır bir platformla temel kurulum birkaç gün içinde tamamlanabilir. Şablon tasarımı, prompt testi ve insan onaylı canlıya geçiş dahil sağlıklı bir devreye alma süreci ise genellikle 3-4 hafta sürer. Kendi akışını n8n gibi bir araçla kuran ekiplerde bu süre entegrasyon karmaşıklığına göre uzayabilir.

## Sonuç

Satış görüşme notlarını yapay zekayla otomatikleştirmek, temsilcilere her hafta saatlerce zaman kazandırmanın ötesinde, CRM'inizdeki verinin tutarlılığını ve güvenilirliğini kökten değiştirir. Başarının anahtarı araçta değil tasarımdadır. Metodolojinize uygun sabit bir şablon, uydurmayı engelleyen net kurallar, insan onaylı bir geçiş süreci ve ölçülebilir hedefler bu tasarımın temel parçalarıdır. Tek bir görüşme tipiyle başlayın, gerçek kayıtlarınızla test edin ve sistemi temsilcilerinizle birlikte geliştirin.

Görüşme notlarınızı CRM'inize bağlı, Türkçe çalışan ve ekibinizin metodolojisine uygun bir otomasyonla yönetmek istiyorsanız, mevcut sürecinizi birlikte değerlendirelim. [Sales Corner ekibiyle bir görüşme planlayın](/iletisim) ve ilk adımı birlikte atalım.
