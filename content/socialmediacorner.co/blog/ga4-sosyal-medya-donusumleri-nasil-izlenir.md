---
title: "GA4'te Sosyal Medya Dönüşümleri Nasıl İzlenir?"
description: "B2B ekipler için GA4'te sosyal medya kaynaklı form ve demo talebi dönüşümlerini nasıl kuracağınızı ve raporlayacağınızı adım adım anlatıyoruz."
date: "2026-11-17"
category: "Ölçümleme"
image: "https://images.pexels.com/photos/139387/pexels-photo-139387.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "GA4'te Sosyal Medya Dönüşümleri Nasıl İzlenir?"
alt: "ga4-social-media-conversion-tracking"
---

Sosyal medya dönüşümlerini GA4'te izlemek için üç şey gerekir: **linklerinizi UTM parametreleriyle etiketlemek, demo talebi veya form gönderimi gibi kritik eylemleri "anahtar etkinlik" (key event) olarak tanımlamak ve bu etkinlikleri Edinme ile Atıf raporlarında "Organic Social" ve "Paid Social" kanallarına göre okumak.** Bu üç adım eksiksiz kurulduğunda LinkedIn gönderisinden, Instagram hikâyesinden ya da sponsorlu bir kampanyadan gelen ziyaretçinin sitenizde ne yaptığını kanal, kampanya ve içerik düzeyinde görebilirsiniz.

Sorun şu ki B2B şirketlerin çoğunda bu kurulum yarım kalır. Sosyal medyadan gelen trafik "Referral" ya da "Direct" altında kaybolur, form gönderimleri yanlış sayılır ve sonunda yönetime "sosyal medya işe yarıyor mu?" sorusuna net bir cevap verilemez. Bu yazıda GA4'te sosyal medya dönüşümlerini sıfırdan nasıl kuracağınızı, hangi raporlara bakacağınızı ve B2B'ye özgü tuzaklardan nasıl kaçınacağınızı adım adım anlatıyoruz.

## B2B'de sosyal medya dönüşümlerini ölçmek neden daha zor?

B2C'de bir Instagram reklamına tıklayan kullanıcı aynı oturumda ürün satın alabilir. B2B'de ise satın alma kararı haftalar, hatta aylar sürer ve birden fazla kişiyi kapsar. Bir satın alma müdürü LinkedIn'de şirketinizin bir karusel gönderisini görür, iki hafta sonra Google'da markanızı arar, bir ay sonra da doğrudan sitenize girip demo talep eder.

Bu yolculukta GA4'ün varsayılan raporları son temas noktasını (örneğin "Direct") öne çıkarabilir ve sosyal medyanın rolü görünmez hale gelir. Bu yüzden B2B'de sosyal medya ölçümlemesi şu üç özelliği hesaba katmalıdır:

- **Uzun satış döngüsü:** Dönüşüm, ilk temastan çok sonra gerçekleşebilir.
- **Çoklu karar verici:** Aynı şirketten farklı kişiler farklı kanallardan gelebilir.
- **Platform içi dönüşümler:** LinkedIn Lead Gen Form gibi araçlarda kullanıcı sitenize hiç uğramadan form doldurur.

GA4 bu sorunların hepsini tek başına çözmez, ancak doğru kurulduğunda resmin büyük kısmını netleştirir.

## GA4'te "dönüşüm" artık ne anlama geliyor?

Google, 2024 yılında GA4'teki "conversion" (dönüşüm) kavramını **"key event" (anahtar etkinlik)** olarak yeniden adlandırdı. "Dönüşüm" terimi artık ağırlıklı olarak Google Ads tarafında kullanılıyor. Pratikte değişen çok şey yok: Sitenizde gerçekleşen herhangi bir etkinliği (event) iş açısından önemli olarak işaretlediğinizde, GA4 bunu anahtar etkinlik olarak raporlar.

GA4'te her şey bir etkinliktir: sayfa görüntüleme (`page_view`), kaydırma (`scroll`), dosya indirme (`file_download`), form gönderimi (`form_submit`) ya da sizin oluşturduğunuz özel bir etkinlik (`demo_talebi` gibi). Sizin işiniz, bu etkinliklerden hangilerinin gerçekten değer taşıdığına karar vermektir.

## Hangi eylemleri anahtar etkinlik olarak izlemelisiniz?

Kuruluma geçmeden önce bir ölçüm planı hazırlamak, sonradan yaşanacak karmaşanın önüne geçer. B2B bir şirket için tipik bir ayrım şöyledir:

**Makro dönüşümler (doğrudan satış fırsatı yaratanlar):**
- Demo veya teklif talebi formu gönderimi
- İletişim formu gönderimi
- Toplantı planlama aracı üzerinden randevu oluşturma
- Ücretsiz deneme kaydı (SaaS şirketleri için)

**Mikro dönüşümler (ilgi ve niyet sinyali verenler):**
- E-kitap, rapor veya vaka çalışması indirme
- Webinar kaydı
- Bülten aboneliği
- Fiyatlandırma sayfasını görüntüleme
- Telefon numarasına veya e-posta adresine tıklama

Önerimiz, anahtar etkinlik sayısını **5-8 ile sınırlamak**. Her etkinliği anahtar etkinlik olarak işaretlerseniz raporlar şişer ve hangi eylemin gerçekten önemli olduğunu ayırt etmek zorlaşır. Hangi metriklerin raporlamada öne çıkması gerektiğini belirlemek için [B2B sosyal medya KPI'larını ele aldığımız rehbere](/blog/b2b-sosyal-medya-kpi-rehberi) göz atabilirsiniz.

## Adım 1: Sosyal medya linklerinizi UTM ile etiketleyin

GA4'ün sosyal medya trafiğini doğru sınıflandırabilmesi için kaynağı bilmesi gerekir. LinkedIn ve Instagram uygulamalarının kendi tarayıcıları (in-app browser) çoğu zaman yönlendiren bilgisini eksik iletir; bu da trafiğin "Direct" altına düşmesine yol açar. Çözüm, paylaştığınız her linke UTM parametresi eklemektir.

Temel parametreler şunlardır:

- `utm_source`: Trafiğin geldiği platform (linkedin, instagram)
- `utm_medium`: Trafiğin türü (organik için social, ücretli için paid_social veya cpc)
- `utm_campaign`: Kampanya adı (2025_q1_demo_kampanyasi)
- `utm_content`: İçerik veya kreatif ayrımı (karusel_v1, video_v2)

Örnek bir organik LinkedIn linki:

`https://siteniz.com/demo?utm_source=linkedin&utm_medium=social&utm_campaign=urun_lansmani&utm_content=karusel`

Örnek bir ücretli Instagram linki:

`https://siteniz.com/e-kitap?utm_source=instagram&utm_medium=paid_social&utm_campaign=ebook_mart&utm_content=video_15sn`

En kritik nokta **tutarlılıktır**. Bir ekip üyesi "LinkedIn", diğeri "linkedin", bir başkası "li" yazarsa GA4 bunları üç ayrı kaynak olarak gösterir. Bunu önlemek için ortak bir UTM şablonu (basit bir tablo yeterlidir) oluşturun ve tüm küçük harf kullanımını kural haline getirin. UTM yapısını derinlemesine incelediğimiz [UTM parametreleriyle sosyal medya trafiği ölçümü yazımızda](/blog/utm-parametreleri-sosyal-medya-trafigi-olcumu) adlandırma kurallarına dair daha fazla örnek bulabilirsiniz.

## Adım 2: Varsayılan kanal gruplamasını kontrol edin

GA4, trafiği "Default Channel Group" adı verilen kurallarla kanallara ayırır. Sosyal medya için iki kanal önemlidir:

- **Organic Social:** Kaynak bilinen bir sosyal ağ sitesiyse (linkedin.com, lnkd.in, instagram.com, l.instagram.com vb.) veya medium değeri "social", "social-network", "social-media", "sm" gibi ifadelerden biriyse.
- **Paid Social:** Kaynak bir sosyal ağ ve medium değeri "cpc", "ppc", "retargeting" ya da "paid" ile başlayan bir ifadeyse (paid_social gibi).

Bu yüzden UTM'de medium değerini rastgele seçmemelisiniz. Örneğin `utm_medium=linkedin_post` yazarsanız GA4 bu trafiği büyük olasılıkla "Unassigned" (atanmamış) kanalına koyar. Organik paylaşımlar için `social`, reklamlar için `paid_social` kullanmak en güvenli yoldur.

Kontrol için: **Raporlar > Edinme > Trafik edinme** raporunu açın ve "Unassigned" satırına bakın. Bu satırda anlamlı bir trafik varsa, ikincil boyut olarak "Oturum kaynağı/aracı" ekleyerek hangi etiketlerin yanlış yazıldığını tespit edebilirsiniz.

Kendi ihtiyacınıza göre özel bir kanal grubu da oluşturabilirsiniz (**Yönetici > Veri görünümü > Kanal grupları**). Örneğin "LinkedIn Organik", "LinkedIn Ücretli", "Instagram Organik" gibi ayrı kanallar tanımlayarak raporlamayı hızlandırabilirsiniz.

## Adım 3: Dönüşüm etkinliklerini oluşturun

Bu, işin en teknik ama en önemli kısmıdır. GA4'ün "Geliştirilmiş ölçüm" (Enhanced Measurement) özelliği form etkileşimlerini otomatik izlemeye çalışır, ancak B2B sitelerde sıklıkla hatalı çalışır: Arama kutusunu form sanabilir, başarısız gönderimleri başarılı sayabilir veya üçüncü parti form araçlarını hiç algılamayabilir. Bu yüzden kritik formları kendiniz tanımlamanızı öneririz. Üç yaygın yöntem var:

### Yöntem 1: Teşekkür sayfası üzerinden etkinlik oluşturma

Form gönderildikten sonra kullanıcı `/tesekkurler` gibi ayrı bir sayfaya yönleniyorsa en kolay yöntem budur:

1. **Yönetici > Veri görünümü > Etkinlikler** bölümüne gidin.
2. **Etkinlik oluştur** butonuna tıklayın.
3. Yeni etkinliğe bir ad verin, örneğin `demo_talebi`.
4. Koşul olarak `event_name` eşittir `page_view` ve `page_location` içerir `/demo-tesekkurler` tanımlayın.
5. Kaydedin.

Artık bu sayfa her görüntülendiğinde GA4 bir `demo_talebi` etkinliği kaydeder. Dikkat: Teşekkür sayfasının arama motorlarında dizine eklenmediğinden ve doğrudan erişilemediğinden emin olun; aksi halde sahte dönüşümler oluşur.

### Yöntem 2: Google Tag Manager ile form gönderimi izleme

Form aynı sayfada "Teşekkürler" mesajı gösteriyorsa Google Tag Manager (GTM) daha güvenilir bir yoldur:

1. GTM'de form gönderimini algılayan bir tetikleyici oluşturun (form gönderimi tetikleyicisi veya geliştiricinin gönderdiği bir `dataLayer` etkinliği).
2. Bir "GA4 Etkinliği" etiketi oluşturun ve etkinlik adını belirleyin. Google'ın önerdiği `generate_lead` adını kullanmak, ileride Google Ads entegrasyonunda kolaylık sağlar.
3. Gerekirse `form_adi` gibi bir parametre ekleyerek hangi formun gönderildiğini ayırt edin (demo, iletişim, e-kitap).
4. Önizleme modunda test edin, ardından yayınlayın.

En sağlam yöntem, geliştiricinizin form başarıyla gönderildiğinde `dataLayer.push({event: 'form_basarili', form_adi: 'demo'})` gibi bir kod tetiklemesidir. Böylece yalnızca gerçekten başarılı olan gönderimler sayılır.

### Yöntem 3: Üçüncü parti araçların yerleşik entegrasyonları

HubSpot, Calendly gibi araçların birçoğu GA4 ile doğrudan entegrasyon veya pencereler arası mesajlaşma (postMessage) üzerinden etkinlik gönderme imkânı sunar. Bu araçları kullanıyorsanız dokümantasyonlarını kontrol edin; çoğu zaman sıfırdan kurulum yapmaya gerek kalmaz.

## Adım 4: Etkinlikleri anahtar etkinlik olarak işaretleyin

Etkinlik oluşturmak tek başına yeterli değildir; GA4'e bunun önemli olduğunu söylemeniz gerekir:

1. **Yönetici > Veri görünümü > Anahtar etkinlikler** bölümüne gidin.
2. **Yeni anahtar etkinlik** butonuna tıklayıp etkinlik adını (örneğin `demo_talebi`) yazın.
3. Alternatif olarak **Etkinlikler** listesinde ilgili etkinliğin yanındaki yıldız simgesine tıklayın.

İsteğe bağlı olarak her anahtar etkinliğe **varsayılan bir değer** atayabilirsiniz. B2B'de doğrudan satış geliri sitede gerçekleşmediği için bu değer bir tahmindir. Basit bir hesaplama örneği:

- Ortalama anlaşma büyüklüğünüz 200.000 TL olsun.
- Demo taleplerinin %10'u satışa dönüşüyor olsun.
- Bu durumda bir demo talebinin tahmini değeri 200.000 × 0,10 = **20.000 TL** olur.

Aynı mantıkla e-kitap indirmenin satışa dönüşme oranı %1 ise değeri 2.000 TL olarak belirlenebilir. Bu değerler kesin gelir değildir, ancak farklı kanalların ve kampanyaların göreli katkısını karşılaştırmanızı kolaylaştırır. Bu yaklaşımı yatırım getirisi hesaplamasına nasıl taşıyacağınızı [B2B sosyal medya ROI'si nasıl ölçülür yazımızda](/blog/b2b-sosyal-medya-roi-nasil-olculur) detaylandırdık.

**Önemli not:** GA4 anahtar etkinlikleri geriye dönük hesaplamaz. Bir etkinliği bugün işaretlerseniz, yalnızca bugünden sonraki veriler anahtar etkinlik olarak raporlanır. Bu yüzden kurulumu kampanya başlamadan önce tamamlayın.

## Sosyal medya dönüşümlerini hangi raporlarda görürsünüz?

Kurulum tamamlandıktan sonra verileri okumak için şu raporları kullanın:

### Trafik edinme raporu

**Raporlar > Edinme > Trafik edinme** yolunu izleyin. Bu rapor oturum bazlıdır; yani her oturumun hangi kanaldan başladığını gösterir. Tabloda "Organic Social" ve "Paid Social" satırlarında **Anahtar etkinlikler** sütununu göreceksiniz. Sütun başlığındaki açılır menüden belirli bir etkinliği (örneğin yalnızca `demo_talebi`) seçebilirsiniz.

Daha detaylı görmek için birincil boyutu "Oturum kaynağı/aracı" veya "Oturum kampanyası" olarak değiştirin. Böylece "linkedin / social" ile "linkedin / paid_social" performansını ya da kampanyalar arasındaki farkı yan yana görebilirsiniz.

### Kullanıcı edinme raporu

**Raporlar > Edinme > Kullanıcı edinme** raporu, kullanıcıların sitenize **ilk kez** hangi kanaldan geldiğini gösterir. B2B için çok değerlidir: Bir kullanıcı ilk kez LinkedIn'den gelip bir ay sonra doğrudan girerek demo talep ettiyse, bu raporda dönüşümün "ilk kullanıcı kanalı" olarak sosyal medyaya bağlandığını görebilirsiniz. Sosyal medyanın farkındalık yaratma rolünü kanıtlamak için bu rapor güçlü bir araçtır.

### Dönüşüm yolları ve model karşılaştırma

**Reklam > Atıf > Dönüşüm yolları** raporu, kullanıcıların dönüşüme ulaşana kadar geçtiği kanal sıralamasını gösterir. Örneğin "Paid Social → Organic Search → Direct" gibi yollar görürsünüz. Bu rapor, sosyal medyanın genellikle yolculuğun başında yer aldığını gösteriyorsa, yalnızca son tıklamaya bakarak bütçe kesmenin hata olacağını anlarsınız.

### Keşifler (Explorations)

Standart raporlar yetmediğinde **Keşfet** bölümünde özel analizler oluşturabilirsiniz:

- **Serbest biçim:** Kaynak, kampanya, içerik ve açılış sayfası boyutlarını bir arada analiz etmek için.
- **Hunı keşfi:** Örneğin "LinkedIn'den gelen ziyaretçi → Hizmet sayfası → Fiyatlandırma sayfası → Demo formu" adımlarında nerede kayıp yaşandığını görmek için.
- **Yol keşfi:** Sosyal medyadan gelen kullanıcıların sitede hangi sayfaları dolaştığını anlamak için.

Bu raporlardan çıkan bulguları yönetime sunarken anlaşılır bir yapı kurmak için [B2B sosyal medya raporu hazırlama rehberimizden](/blog/b2b-sosyal-medya-raporu-nasil-hazirlanir) yararlanabilirsiniz.

## Hangi atıf modelini kullanmalısınız?

GA4'te artık iki ana atıf modeli seçeneği var: **Veriye dayalı (data-driven)** ve **son tıklama** (ücretli ve organik kanallar dahil). İlk tıklama, doğrusal ve zaman düşüşü gibi eski modeller 2023'te kaldırıldı.

**Yönetici > Veri görünümü > Atıf ayarları** bölümünden modeli seçebilir ve geriye dönük inceleme süresini (lookback window) ayarlayabilirsiniz. B2B için önerilerimiz:

- **Veriye dayalı modeli kullanın.** Bu model, dönüşüme giden yoldaki her temas noktasına katkısına göre pay verir. Sosyal medya gibi yolculuğun başında yer alan kanallar son tıklama modelinde neredeyse hiç kredi almazken, veriye dayalı modelde daha adil değerlendirilir.
- **Geriye dönük inceleme süresini 90 güne çıkarın.** Varsayılan değer 90 gündür, ancak değiştirilmiş olabilir; kontrol edin. Uzun satış döngülerinde 30 günlük pencere, sosyal medyanın katkısını büyük ölçüde gözden kaçırır.
- **Veri saklama süresini 14 aya çıkarın.** **Yönetici > Veri toplama ve değişiklik > Veri saklama** bölümünde varsayılan değer 2 aydır. Bu ayar, Keşifler raporlarında geçmiş verilere erişiminizi belirler ve B2B'de yıllık karşılaştırmalar için kritiktir.

Veriye dayalı model, yeterli veri hacmi olmayan hesaplarda son tıklamaya yakın sonuçlar verebilir. Yine de modeli doğru seçmek ve ayarları baştan yapmak, veriler biriktikçe daha güvenilir içgörüler sağlar.

## LinkedIn Lead Gen Form dönüşümleri GA4'te neden görünmüyor?

Bu, B2B pazarlamacılarının en sık karşılaştığı sorulardan biridir. LinkedIn Lead Gen Form ve Instagram'ın anlık form reklamları, kullanıcının platformdan ayrılmadan form doldurmasını sağlar. Kullanıcı sitenize hiç gelmediği için GA4'te bu dönüşümlere dair hiçbir iz oluşmaz.

Bu boşluğu kapatmanın birkaç yolu var:

1. **Platform raporlarını ayrı izleyin:** LinkedIn Campaign Manager ve Meta Ads Manager, platform içi form dönüşümlerini kendi panellerinde raporlar. Raporlamada bu verileri GA4 verileriyle yan yana, ama ayrı bir kategori olarak sunun.
2. **CRM'e bağlayın:** Form verilerini doğrudan CRM'inize aktarın ve kaynak alanını "LinkedIn Lead Gen" olarak işaretleyin. Böylece bu lead'lerin satışa dönüşüp dönüşmediğini izleyebilirsiniz. Kurulumun detaylarını [LinkedIn lead formunu CRM'e bağlama yazımızda](/blog/linkedin-lead-formu-crm-baglantisi) anlattık.
3. **Measurement Protocol ile GA4'e gönderin:** Teknik kaynağınız varsa, GA4 Measurement Protocol kullanarak CRM'deki lead verilerini sunucu tarafından GA4'e etkinlik olarak gönderebilirsiniz. Bu yöntem kurulum ve bakım gerektirir; ancak tüm dönüşümleri tek panelde görmek isteyen şirketler için değerlidir.

Platform içi formlar, site üzerindeki formlara göre genellikle daha fazla lead getirir ama lead kalitesi daha değişken olabilir. Bu yüzden sadece lead sayısına değil, CRM'deki nitelikli fırsat oranına da bakmak gerekir. Sosyal medyanın yanında outbound kanallarla da lead üretmek isteyen yazılım şirketleri için [SAAS Corner'ın B2B SaaS odaklı outbound satış ve lead generation hizmeti](https://saascorner.co) tamamlayıcı bir yaklaşım sunar.

## Örnek senaryo: Bir B2B kampanyasının GA4'te izlenmesi

Somutlaştırmak için kurgusal bir örnek üzerinden ilerleyelim. Endüstriyel yazılım satan bir şirket, üç aylık bir kampanyada şu kanalları kullanıyor:

- LinkedIn'de haftada 3 organik gönderi
- LinkedIn'de sponsorlu içerik kampanyası
- Instagram'da haftada 2 karusel gönderi

Şirket, tüm linklerde UTM kullanıyor ve iki anahtar etkinlik tanımlamış: `demo_talebi` (değeri 20.000 TL) ve `ebook_indirme` (değeri 2.000 TL).

Kampanya sonunda Trafik edinme raporunda şu tabloyu varsayalım:

- **linkedin / paid_social:** 1.200 oturum, 8 demo talebi, 45 e-kitap indirme
- **linkedin / social:** 900 oturum, 5 demo talebi, 20 e-kitap indirme
- **instagram / social:** 600 oturum, 1 demo talebi, 15 e-kitap indirme

İlk bakışta Instagram zayıf görünüyor. Ancak Kullanıcı edinme raporu, ilk kez Instagram'dan gelen kullanıcıların sonradan doğrudan veya organik aramayla dönerek 4 demo talebi daha oluşturduğunu gösteriyor. Dönüşüm yolları raporunda da Instagram'ın sıklıkla yolculuğun ilk adımı olduğu görülüyor.

Bu bulgular şu kararı destekler: Instagram'ı doğrudan lead kanalı olarak değil, farkındalık ve marka güveni kanalı olarak konumlandırmak, KPI'larını buna göre belirlemek ve bütçeyi kesmek yerine içerik türünü optimize etmek. Yalnızca son tıklamaya bakan bir ekip ise muhtemelen Instagram'ı gereksiz bulup kapatırdı.

## Sık yapılan hatalar nelerdir?

Kurulum ve raporlama sürecinde en çok karşılaştığımız hatalar şunlar:

- **Sosyal medya bio ve profil linklerini etiketlememek:** LinkedIn şirket sayfası web sitesi linki ve Instagram bio linki sürekli trafik getirir. Bu linklere de UTM ekleyin (örneğin `utm_campaign=profil_linki`).
- **Site içi linklerde UTM kullanmak:** Kendi sitenizin bir sayfasından diğerine verdiğiniz linkte UTM kullanırsanız, oturum yeniden başlar ve orijinal kaynak bilgisi silinir. UTM yalnızca dış kaynaklı linklerde kullanılmalıdır.
- **Form gönderimini çift saymak:** Hem geliştirilmiş ölçümün `form_submit` etkinliğini hem de kendi `demo_talebi` etkinliğinizi anahtar etkinlik yaparsanız aynı dönüşüm iki kez sayılır. Birini seçin.
- **İç trafiği filtrelememek:** Şirket çalışanlarının test amaçlı form doldurması verileri bozar. **Yönetici > Veri akışları > Etiket ayarları** üzerinden ofis IP adreslerini iç trafik olarak tanımlayıp filtreleyin.
- **Çapraz alan izlemeyi atlamak:** Formunuz farklı bir alan adında barındırılıyorsa (örneğin ayrı bir randevu sitesi), çapraz alan izleme yapılmadığında kaynak bilgisi kaybolur.
- **Kurulumu test etmemek:** **Yönetici > DebugView** ile her etkinliği yayına almadan önce test edin. Bir formu kendiniz doldurun ve etkinliğin doğru parametrelerle geldiğini doğrulayın.

Ekip büyüdükçe bu kuralların sürdürülebilir olması için UTM şablonları, etkinlik isimlendirme standartları ve raporlama akışlarının otomasyonu önem kazanır. Grup çatımız [Corner Group'un strateji ve otomasyon tarafındaki deneyimi](https://cornergroup.co), bu tür süreçleri ölçeklenebilir hale getirmek isteyen şirketler için bir başlangıç noktası olabilir.

## Sık sorulan sorular

### GA4'te sosyal medya trafiği neden "Direct" olarak görünüyor?

LinkedIn ve Instagram uygulamalarının içindeki tarayıcılar yönlendiren bilgisini her zaman iletmez; bu da trafiğin "Direct" kanalına düşmesine neden olur. Çözüm, paylaştığınız tüm linklere `utm_source` ve `utm_medium` parametrelerini eklemektir. Böylece GA4 trafiği yönlendiren bilgisine ihtiyaç duymadan doğru kanala atar.

### Anahtar etkinlik ile dönüşüm arasında fark var mı?

GA4'te "anahtar etkinlik", daha önce "dönüşüm" olarak adlandırılan kavramın yeni adıdır ve işlevi aynıdır. "Dönüşüm" terimi artık ağırlıklı olarak Google Ads tarafında, reklam optimizasyonu için içe aktarılan anahtar etkinlikleri ifade etmek için kullanılır. Raporlama açısından bilmeniz gereken, önemli eylemleri anahtar etkinlik olarak işaretlemenizdir.

### LinkedIn reklamlarının performansını GA4'te mi, Campaign Manager'da mı ölçmeliyim?

İkisini birlikte kullanmalısınız, çünkü farklı şeyleri ölçerler. Campaign Manager gösterim, tıklama ve platform içi form dönüşümlerini; GA4 ise reklamdan siteye gelen kullanıcıların sitede ne yaptığını gösterir. İki kaynağın rakamları farklı ölçüm yöntemleri nedeniyle hiçbir zaman birebir örtüşmez; bu normaldir.

### Kurulumdan sonra verilerin oturması ne kadar sürer?

Yeni etkinlikler genellikle birkaç dakika içinde DebugView ve Gerçek zamanlı raporda görünür, ancak standart raporlara yansıması 24-48 saat sürebilir. Anlamlı karşılaştırmalar yapabilmek için ise B2B'de en az 4-6 haftalık veri biriktirmeniz önerilir. Anahtar etkinlikler geriye dönük çalışmadığı için kurulumu mümkün olduğunca erken yapın.

## Sonuç

GA4'te sosyal medya dönüşümlerini izlemek, tek seferlik bir teknik ayardan çok, disiplin gerektiren bir süreçtir. Tutarlı UTM kullanımı, doğru tanımlanmış ve test edilmiş anahtar etkinlikler, B2B'nin uzun satış döngüsüne uygun atıf ayarları ve platform içi formları kapsayan bir CRM entegrasyonu bir araya geldiğinde, sosyal medyanın satış hunisine katkısını rakamlarla gösterebilirsiniz. Bu da bütçe görüşmelerinde tahmin yerine veriyle konuşmanızı sağlar.

LinkedIn ve Instagram kampanyalarınızın gerçekten ne kadar iş getirdiğini görmek, ölçüm altyapınızı kurmak veya mevcut kurulumunuzu denetletmek istiyorsanız, [Social Media Corner ekibiyle iletişime geçin](/iletisim); B2B sosyal medya stratejinizi ölçülebilir sonuçlara dönüştürmek için birlikte çalışalım.
