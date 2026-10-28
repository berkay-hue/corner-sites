---
title: "B2B Lead Scoring Nasıl Kurulur? Adım Adım Model"
description: "B2B lead scoring nasıl kurulur? Profil ve davranış puanlarını belirleyin, eşik değerini ayarlayıp CRM'de otomatikleştirin ve modeli satış verisiyle test."
date: "2026-10-28"
category: "Lead Generation"
image: "https://images.pexels.com/photos/34069/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "B2B Lead Scoring Nasıl Kurulur? Adım Adım Model"
alt: "b2b-lead-scoring-model"
---

**B2B lead scoring, potansiyel müşterileri iki eksende puanlayarak kurulur: şirketin ideal müşteri profilinize ne kadar uyduğu (fit) ve ürününüze ne kadar ilgi gösterdiği (engagement).** Sağlıklı bir model için önce kazandığınız ve kaybettiğiniz fırsatları analiz edersiniz. Ardından firmografik ve davranışsal kriterlere puan atar, negatif puanları ve puan eskimesini tanımlarsınız. Son adımda MQL ve SQL eşiklerini belirleyip modeli CRM'inize entegre eder ve her çeyrekte gerçek satış sonuçlarıyla kalibre edersiniz.

Kâğıt üzerinde basit görünse de lead scoring, B2B SaaS şirketlerinde en sık yanlış kurulan sistemlerden biridir. Bu yazıda puan tablosunun mantığını, kriterlerin nasıl seçileceğini, eşiklerin nasıl belirleneceğini ve modelin CRM'de nasıl çalıştırılacağını adım adım, örnek rakamlarla ele alacağız. Amacımız, satış ekibinizin "Bu lead'i neden bana gönderdiniz?" sorusunu sormayı bıraktığı bir sistem kurmanıza yardımcı olmak.

## Lead scoring nedir ve B2B'de neden farklı çalışır?

Lead scoring, her potansiyel müşteriye satın almaya ne kadar yakın olduğunu gösteren sayısal bir değer atama yöntemidir. Amaç, satış ekibinin sınırlı zamanını en yüksek kapanma olasılığına sahip kişilere ve şirketlere yönlendirmektir.

B2C'de tek bir kişinin davranışı çoğu zaman yeterli bir sinyaldir. B2B'de ise durum daha karmaşıktır:

- **Satın alma kararını bir komite verir.** Bir şirketten bazen 3, bazen 8 kişi sürece dahil olur. Teknik değerlendirici, bütçe sahibi ve son kullanıcı farklı davranışlar sergiler.
- **Satış döngüsü uzundur.** Orta ölçekli bir SaaS anlaşması aylarca sürebilir. Bu süre boyunca ilgi seviyesi iner ve çıkar.
- **Şirketin kendisi kişiden daha önemlidir.** İçeriklerinizi çok beğenen bir öğrenci 100 puan alabilir, ama hiçbir zaman müşteriniz olmaz. Hedef sektörde, doğru büyüklükteki bir şirketin satın alma müdürü ise yalnızca bir kez web sitenize girse bile değerli olabilir.

Bu nedenle B2B lead scoring'de kişi puanının yanında **hesap (account) seviyesinde puanlama** yapmak da gerekir. Lead scoring'in genel nitelendirme sürecindeki yerini daha geniş bir perspektiften görmek isterseniz [SaaS'ta lead kalitesini artıran qualification yolculuğu](/blog/lead-kalitesi-den-lead-kalitesi-e-saas-qualification-yolculugu) yazımız iyi bir başlangıç olur.

## Başlamadan önce hangi verilere ihtiyacınız var?

Model kurmaya geçmeden önce elinizdeki verinin envanterini çıkarın. Kötü veriyle kurulan en iyi model bile yanlış sonuç verir. Minimum olarak şunlara ihtiyacınız olacak:

1. **Son 12-24 ayın kapanan fırsatları (won ve lost):** Kazandığınız ve kaybettiğiniz anlaşmaların CRM kayıtları. Örüntü çıkarabilmek için mümkünse en az birkaç düzine kazanılmış fırsat olmalı.
2. **Firmografik veriler:** Sektör, çalışan sayısı, ciro aralığı, lokasyon ve kullanılan teknolojiler.
3. **Kişi verileri:** Unvan, departman ve kıdem seviyesi.
4. **Davranışsal veriler:** Web sitesi ziyaretleri, e-posta etkileşimleri, form doldurmalar, webinar katılımları, demo talepleri ve deneme sürümü kullanımı.
5. **Satış ekibinin geri bildirimi:** Hangi lead'lerin "zaman kaybı" olduğunu en iyi bilenler, onlarla görüşen kişilerdir.

Firmografik verilerde eksiklik varsa veri zenginleştirme araçlarıyla tamamlayabilirsiniz. Örneğin [Apollo.io](https://get.apollo.io/679irkzm35ya) gibi B2B veri platformları; şirket büyüklüğü, sektör ve unvan bilgilerini CRM kayıtlarınıza eklemenizi kolaylaştırır. Böylece form doldururken yalnızca e-posta bırakan bir kişiyi bile anlamlı biçimde puanlayabilirsiniz.

## Adım 1: Kazandığınız ve kaybettiğiniz müşterileri analiz edin

Lead scoring modeli, varsayımlarla değil geçmişteki gerçek sonuçlarla kurulmalıdır. İlk iş, CRM'den kapanmış fırsatları dışa aktarıp şu soruları sormaktır:

- Kazandığımız müşterilerin çoğu hangi sektörlerde?
- Hangi çalışan sayısı aralığında kapanma oranımız en yüksek?
- Anlaşmaları hangi unvanlar başlatıyor, hangi unvanlar imzalıyor?
- Kazanılan fırsatlar, satışa geçmeden önce hangi içeriklerle etkileşime girmiş?
- Kaybedilen fırsatların ortak özellikleri neler? Bütçe yetersizliği, yanlış şirket büyüklüğü, karar vericiye ulaşamamak gibi.

Basit bir örnek üzerinden ilerleyelim. Türkiye'de insan kaynakları yazılımı satan hayali bir SaaS şirketi düşünün. Analiz sonunda şu tablo ortaya çıksın:

- Kazanılan müşterilerin büyük bölümü **100-500 çalışanlı** şirketler.
- En iyi sonuç veren sektörler **perakende, üretim ve lojistik**; yüksek personel devir hızı olan sektörler.
- Süreci genellikle **İK müdürü** başlatıyor, **CFO veya genel müdür** onaylıyor.
- Kazanılan fırsatların çoğu, satış görüşmesinden önce **fiyatlandırma sayfasını** ve en az bir **vaka çalışmasını** ziyaret etmiş.
- 50 çalışanın altındaki şirketlerle görüşmeler çoğunlukla bütçe nedeniyle kaybedilmiş.

Bu bulgular, puan tablonuzun omurgasını oluşturur. Bu analiz aynı zamanda ideal müşteri profilinizi (ICP) netleştirir. ICP üzerinden hedef şirket listesi çıkarmak isterseniz [B2B'de hedef hesap listesi nasıl oluşturulur](/blog/b2b-hedef-hesap-listesi-nasil-olusturulur) rehberimize göz atabilirsiniz.

## Adım 2: Fit puanını belirleyin (firmografik ve demografik kriterler)

Fit puanı, "Bu şirket ve bu kişi, müşterimiz olmaya uygun mu?" sorusunu yanıtlar. Davranıştan bağımsızdır ve genellikle zaman içinde değişmez.

Örnek HR yazılımı şirketimiz için fit puanlaması şöyle olabilir (maksimum 50 puan):

### Şirket kriterleri

- **Çalışan sayısı:**
  - 100-500 çalışan: +20
  - 50-99 veya 501-1000 çalışan: +10
  - 50'den az çalışan: 0
  - 1000'den fazla çalışan: +5 (farklı bir satış hareketi gerektirir)
- **Sektör:**
  - Perakende, üretim, lojistik: +10
  - Hizmet, sağlık, eğitim: +5
  - Diğer: 0
- **Lokasyon:**
  - Türkiye merkezli: +5
  - Hizmet verilmeyen ülke: -20

### Kişi kriterleri

- **Unvan ve kıdem:**
  - İK direktörü, İK müdürü, CHRO: +15
  - CFO, genel müdür, kurucu: +10
  - İK uzmanı: +5
  - Öğrenci, stajyer, danışman: -10

Burada önemli bir nokta var: **Puanlar sizin verinize göre belirlenmeli.** Yukarıdaki rakamlar bir şablon değil, mantığı göstermek için verilmiş örneklerdir. Sizin şirketinizde 20-50 çalışanlı şirketler en iyi müşteriler olabilir. Bu durumda tablo tamamen tersine döner.

Pratik bir kural olarak, en güçlü kriterinize en yüksek puanı verin. Diğerlerini de kazanılan fırsatlardaki ağırlıklarına göre orantılı dağıtın.

## Adım 3: Engagement puanını belirleyin (davranışsal kriterler)

Engagement puanı, "Bu kişi şu anda ne kadar ilgili?" sorusunu yanıtlar. Fit puanından farklı olarak sürekli değişir.

Davranışları iki gruba ayırmak işinizi kolaylaştırır: **yüksek niyet** ve **düşük niyet** sinyalleri.

### Yüksek niyet sinyalleri

- Demo talep formu doldurma: +30
- Fiyatlandırma sayfası ziyareti: +15
- Ücretsiz deneme başlatma: +25
- Satış e-postasına olumlu yanıt verme: +20
- Rakip karşılaştırma sayfası ziyareti: +10
- Vaka çalışması okuma: +10

### Düşük niyet sinyalleri

- Blog yazısı okuma: +2 (ziyaret başına, en fazla +10)
- E-posta bülteni açma: +1
- E-postadaki bağlantıya tıklama: +3
- E-kitap veya rehber indirme: +8
- Webinar kaydı: +5, katılım: +10

Dikkat etmeniz gereken nokta şu: **Düşük niyet sinyallerine bir üst sınır koyun.** Aksi halde blogunuzu düzenli okuyan ama satın alma niyeti olmayan bir kişi, yalnızca okuma alışkanlığıyla satış ekibinin önüne düşer.

Webinar katılımı gibi orta seviye sinyalleri daha etkili kullanmak için [B2B webinar ile nitelikli lead toplama rehberimiz](/blog/b2b-webinar-nitelikli-lead-toplama-rehberi) etkinlik sonrası puanlamayı nasıl kurgulayacağınıza dair fikir verebilir.

## Adım 4: Negatif puanlama ve puan eskimesi nasıl kurgulanır?

Birçok şirketin atladığı ama modelin isabetini en çok artıran adım budur. Puanlar yalnızca artarsa, sistem zamanla şişer ve anlamsızlaşır.

### Negatif puanlar

- Kişisel e-posta adresi (gmail, hotmail vb.): -10
- Kariyer veya iş ilanları sayfası ziyareti: -15 (muhtemelen iş arayan biri)
- E-posta listesinden çıkma: -20
- Rakip şirket alan adı: -50 veya otomatik diskalifiye
- Mevcut müşteri: Lead scoring dışında tutulmalı, ayrı bir genişleme (expansion) modeline yönlendirilmeli
- Satış ekibinin "uygun değil" olarak işaretlemesi: -30

### Puan eskimesi (decay)

Altı ay önce fiyatlandırma sayfanıza bakan biri, bugün bakan biriyle aynı değerde değildir. Engagement puanına bir eskime kuralı ekleyin:

- 30 gün boyunca hiçbir etkileşim yoksa engagement puanından **%25 düşür**.
- 90 gün etkileşim yoksa engagement puanını **sıfırla**.

Fit puanı ise eskimez. Şirket hâlâ doğru şirkettir, sadece şu an aktif değildir. Bu ayrım, ileride yeniden ısınan hesapları yakalamanızı sağlar.

## Adım 5: MQL ve SQL eşiklerini nasıl belirlemelisiniz?

Puanlar tek başına bir şey ifade etmez. Hangi puandan sonra ne olacağını tanımlamanız gerekir. Tipik bir yapı şöyledir:

- **0-39 puan, Soğuk lead:** Pazarlama otomasyonu ile beslenir, satışa gitmez.
- **40-69 puan, MQL (Marketing Qualified Lead):** Pazarlama açısından nitelikli kabul edilir. SDR ekibi tarafından araştırılır ve kişiselleştirilmiş bir temasla iletişime geçilir.
- **70+ puan, SQL adayı:** SDR, doğrudan arama veya toplantı daveti ile iletişime geçer. Görüşme sonrasında BANT veya MEDDIC gibi bir çerçeveyle nitelendirilerek SQL'e dönüştürülür.

Eşiği belirlemek için geçmiş verinize dönün. Modeli kazanılan fırsatlara geriye dönük uygulayın ve şu soruyu sorun: *"Kazandığımız müşterilerin büyük çoğunluğu, satışa geçtiklerinde kaç puandaydı?"* Eşiğinizi bu değerin biraz altına koyun.

Eşiği çok düşük tutarsanız satış ekibi niteliksiz lead'lerle boğulur. Çok yüksek tutarsanız sıcak fırsatlar pazarlama otomasyonunda bekleyip soğur.

**Önemli bir istisna:** Demo talebi gibi doğrudan satış niyeti bildiren aksiyonlar, puandan bağımsız olarak hemen satış ekibine yönlendirilmelidir. Fit puanı düşükse bile bu kişiyle konuşulmalıdır. En kötü ihtimalle doğru bir şekilde diskalifiye edilir.

## Adım 6: İki boyutlu matris modelini kullanın

Fit ve engagement puanlarını tek bir sayıda toplamak, önemli bir bilgiyi gizler. 80 puanlık bir lead, yüksek fit ve düşük ilgiden de gelebilir, düşük fit ve aşırı ilgiden de. Bu iki durum tamamen farklı aksiyonlar gerektirir.

Bu yüzden olgun B2B ekipleri **matris modelini** tercih eder:

- **Fit:** A (mükemmel), B (iyi), C (orta), D (uygun değil)
- **Engagement:** 1 (çok aktif), 2 (aktif), 3 (az aktif), 4 (pasif)

Bu iki eksen, aksiyonları netleştirir:

- **A1, A2, B1:** Hemen satış teması. Öncelikli liste.
- **A3, A4:** Doğru şirket ama ilgi yok. Outbound prospecting için ideal adaylar. SDR proaktif olarak ulaşmalı.
- **B2, B3, C1, C2:** Nurturing akışına alın, ilgi arttığında tekrar değerlendirin.
- **C3, C4, D grubu:** Düşük öncelik. Otomatik içerik akışında kalabilir, satış zamanı harcanmaz.

Matris modelinin en büyük faydası, **A3 ve A4 gibi "doğru ama sessiz" hesapları görünür kılmasıdır.** Bu hesaplar inbound'da hiç tetiklenmez, ama outbound satış için altın değerindedir.

## Adım 7: Modeli CRM'de nasıl kurarsınız?

Model ne kadar iyi tasarlanırsa tasarlansın, CRM'de otomatik çalışmıyorsa birkaç hafta içinde unutulur. Kurulum için genel bir yol haritası:

1. **Özel alanlar oluşturun:** CRM'inizde "Fit Puanı", "Engagement Puanı", "Toplam Puan" ve "Lead Derecesi (A1-D4)" alanlarını açın.
2. **Fit kurallarını tanımlayın:** Çoğu CRM'de (HubSpot, Salesforce, Pipedrive gibi) kural tabanlı puanlama özelliği bulunur. Çalışan sayısı, sektör ve unvan alanlarına göre puan atayan kuralları girin.
3. **Davranışsal takibi bağlayın:** Web sitesi izleme kodunu, e-posta pazarlama aracını ve form sistemini CRM'e entegre edin. Fiyatlandırma sayfası gibi kritik sayfaları ayrıca etiketleyin.
4. **Eskime kurallarını otomatize edin:** Zamanlanmış iş akışlarıyla belirli süre etkileşimsiz kalan kayıtların engagement puanını düşürün.
5. **Yönlendirme (routing) kurallarını yazın:** Eşiği geçen lead'i otomatik olarak doğru SDR'a atayın, görev oluşturun ve bildirim gönderin.
6. **Hesap seviyesinde toplama yapın:** Aynı şirketten birden fazla kişi etkileşimdeyse, kişi puanlarını hesap kaydında toplayın. Bir şirketten üç farklı kişinin aynı hafta fiyatlandırma sayfasına bakması, çok güçlü bir satın alma sinyalidir.

Puanlama, yönlendirme ve takip görevlerinin otomasyonu birbirine bağlıdır. Bu yapıyı uçtan uca nasıl kurabileceğinizi [lead generation operasyonunu otomatiğe bağlamak](/blog/b2bde-uykusuz-gecelerin-ciktisi-lead-generation-operasyonunu-otomatige-baglamak) üzerine yazdığımız makalede ayrıntılı ele aldık.

### SLA tanımlamayı unutmayın

Pazarlama ile satış arasında bir hizmet seviyesi anlaşması (SLA) olmadan lead scoring yarım kalır. Örnek bir SLA:

- A1/A2 lead'lere **4 iş saati** içinde ilk temas
- MQL'lere **2 iş günü** içinde ilk temas
- Satış ekibi, reddettiği her lead için CRM'de **ret nedeni** seçmek zorunda

Ret nedenleri, modelinizi kalibre etmek için en değerli veri kaynağınız olacaktır.

## Adım 8: Model nasıl test edilir ve kalibre edilir?

Lead scoring bir kez kurulup bırakılan bir sistem değildir. İlk sürüm her zaman hatalıdır ve bu normaldir. Önemli olan, hataları hızla görüp düzeltmektir.

### İlk 30 gün: Gölge modu

Modeli canlıya almadan önce bir ay boyunca "gölge modunda" çalıştırın. Puanlar hesaplansın ama yönlendirme yapılmasın. Bu sürede satış ekibinin doğal olarak seçtiği lead'lerle modelin yüksek puan verdiği lead'leri karşılaştırın. Büyük farklar varsa kriterleri gözden geçirin.

### Her çeyrek: Performans analizi

Her çeyrekte şu metrikleri inceleyin:

- **Puan grubuna göre dönüşüm oranı:** A1 lead'lerin fırsata dönüşme oranı, B2'lerden belirgin şekilde yüksek mi? Değilse model ayrıştırma yapmıyordur.
- **MQL'den SQL'e geçiş oranı:** Çok düşükse eşik fazla aşağıdadır veya kriterler yanlıştır.
- **Satışın reddettiği MQL oranı ve ret nedenleri:** Aynı neden tekrar ediyorsa, o kriteri negatif puana çevirin.
- **Kazanılan fırsatların başlangıç puanı:** Düşük puandan gelip kazanılan anlaşmalar varsa, modelin gözden kaçırdığı bir sinyal var demektir.

Lead scoring'in iyileştirdiği huni metriklerini bütüncül biçimde ele almak için [dönüşüm oranı optimizasyonu](/blog/donusum-orani-optimizasyonu) yazımızdaki yaklaşımlar modelinizle birlikte kullanılabilir.

### Ne zaman makine öğrenmesine geçmeli?

Kural tabanlı model, çoğu B2B SaaS şirketi için uzun süre yeterlidir. Yapay zekâ destekli tahmine dayalı (predictive) puanlama, ancak yeterli hacimde kapanmış fırsat verisi biriktiğinde anlamlı sonuç verir. Az veriyle eğitilen bir algoritma, yanlış örüntüler öğrenir. Önce kural tabanlı modeli oturtun, veriyi temizleyin, sonra otomasyona geçin.

## Outbound satışta lead scoring nasıl uyarlanır?

Klasik lead scoring inbound odaklıdır: Birisi sitenize gelir, etkileşime girer, puanı artar. Ancak outbound ağırlıklı çalışan B2B SaaS şirketlerinde lead'lerin çoğu henüz sizinle etkileşime girmemiştir. Bu durumda model şu şekilde uyarlanır:

- **Fit puanı ön plana çıkar.** Outbound listesi oluştururken her hesaba önce fit puanı verilir. Yalnızca A ve B hesapları dizilere (sequence) alınır.
- **Tetikleyici olaylar (trigger events) puana eklenir.** Yeni yatırım alması, hızlı işe alım yapması, yeni bir İK direktörü ataması veya yeni bir lokasyon açması gibi sinyaller ek puan kazandırır. Örneğin "son 90 günde yeni İK yöneticisi atandı: +15" gibi.
- **Outbound etkileşimi engagement puanına dönüşür.** Soğuk e-postayı açma, bağlantıya tıklama, LinkedIn bağlantı isteğini kabul etme ve aramaya geri dönüş yapma gibi aksiyonlar puanlanır.
- **Olumsuz yanıtlar netleştirilir.** "Şu an ilgilenmiyoruz" yanıtı ile "bize bir daha yazmayın" yanıtı aynı negatif puanı almamalıdır. İlki 6 ay sonra yeniden değerlendirilebilir, ikincisi listeden kalıcı olarak çıkarılmalıdır.

Veri odaklı outbound süreçlerini ve hesap önceliklendirmesini profesyonel bir ekiple kurgulamak isteyen şirketler için kardeş şirketimiz [Sales Corner'ın veri odaklı B2B satış ve lead generation hizmetleri](https://salescorner.co) bu yaklaşımın sahadaki karşılığını sunar.

## Lead scoring kurarken en sık yapılan hatalar nelerdir?

- **Satış ekibini sürece dahil etmemek:** Pazarlamanın tek başına tasarladığı modeller, satış tarafından benimsenmez. Kriter belirleme toplantısına mutlaka en az bir satış yöneticisi ve bir SDR katılmalı.
- **Çok fazla kriter kullanmak:** 40 farklı kural içeren bir model kimse tarafından anlaşılmaz ve bakımı imkânsızlaşır. Başlangıç için 8-12 kriter yeterlidir.
- **Her etkileşime puan vermek:** Bülten açma oranları, gizlilik özellikleri ve otomatik e-posta tarayıcıları nedeniyle güvenilmez hale gelmiştir. Açılmalara çok az veya hiç puan vermeyin, tıklamalara ve yanıtlara odaklanın.
- **Puan eskimesini atlamak:** Bir yıl önce aktif olan lead'ler bugün hâlâ "sıcak" görünür ve satış ekibinin güvenini sarsar.
- **Kişi ve hesap puanını karıştırmak:** Satın alma komitesinin tamamını değil, tek bir kişiyi takip etmek büyük fırsatları kaçırmanıza neden olur.
- **Modeli hiç güncellememek:** Ürününüz, fiyatlandırmanız ve hedef pazarınız değiştikçe kriterleriniz de değişmelidir.
- **Puanlamayı nurturing'den kopuk düşünmek:** Puanı düşük lead'ler çöpe atılmaz, doğru içerikle olgunlaştırılır. Bu konuda [entegre bir B2B lead nurturing yaklaşımı](/blog/b2b-satis-lead-nurturing-entegre-yaklasim) lead scoring'in doğal tamamlayıcısıdır.

## Sık sorulan sorular

### Lead scoring modeli kurmak ne kadar sürer?

Verileri CRM'de düzenli olan bir şirket için ilk sürüm genellikle 2-4 hafta içinde hazırlanabilir. Bu süreye geçmiş fırsat analizi, kriter belirleme ve CRM kurulumu dahildir. Modelin güvenilir hale gelmesi ise gölge modu ve ilk kalibrasyon döngüsüyle birlikte 2-3 ay sürer.

### Küçük bir SaaS şirketinin lead scoring'e ihtiyacı var mı?

Satış ekibi gelen tüm lead'lerle zaman kaybetmeden ilgilenebiliyorsa, karmaşık bir modele henüz gerek yoktur. Ancak basit bir fit puanlaması her ölçekte faydalıdır, çünkü outbound listelerini ve öncelikleri netleştirir. Lead hacmi satış kapasitesini aşmaya başladığında, davranışsal puanlamayı da devreye almak gerekir.

### Fit puanı mı, engagement puanı mı daha önemli?

B2B'de genellikle fit puanı daha belirleyicidir, çünkü yanlış şirketteki çok ilgili bir kişi nadiren müşteriye dönüşür. Engagement puanı ise zamanlamayı gösterir. İkisini tek bir sayıda toplamak yerine matris modeliyle ayrı ayrı izlemek en sağlıklı yaklaşımdır.

### Lead scoring için özel bir yazılım gerekir mi?

Çoğu durumda gerekmez. HubSpot, Salesforce ve Pipedrive gibi yaygın CRM'ler kural tabanlı puanlama ve otomasyon özellikleri sunar. Ayrı bir yazılıma, özellikle tahmine dayalı puanlama veya gelişmiş niyet (intent) verisi kullanmak istediğinizde ihtiyaç duyulur.

## Sonuç

İyi kurulmuş bir B2B lead scoring modeli; satış ekibinin zamanını korur, pazarlama ile satış arasındaki sürtünmeyi azaltır ve doğru hesaplara doğru zamanda ulaşmanızı sağlar. Formül aslında nettir: Geçmiş verinizden öğrenin, fit ve engagement'ı ayrı ölçün, negatif puanları ve eskimeyi unutmayın, eşikleri gerçek sonuçlara göre belirleyin ve modeli her çeyrek kalibre edin. En önemlisi, lead scoring'i bir pazarlama projesi olarak değil, satış ve pazarlamanın birlikte sahiplendiği bir gelir sistemi olarak görün.

Lead scoring modelinizi sıfırdan kurmak, mevcut CRM yapınızı gözden geçirmek ya da outbound ve inbound lead akışınızı tek bir önceliklendirme sistemine bağlamak istiyorsanız, SAAS Corner ekibi olarak yardımcı olmaktan memnuniyet duyarız. [İletişim sayfamızdan](/iletisim) bize ulaşın, şirketinize özel bir yol haritasını birlikte çıkaralım.
