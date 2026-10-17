---
title: "B2B'de AI Aramalarında Görünürlük (GEO) Rehberi"
description: "ChatGPT, Gemini ve Google AI Overviews'da B2B markanızın önerilmesi için GEO yaklaşımını, içerik ve kaynak sinyallerini adım adım anlatıyoruz."
date: "2026-10-17"
category: "Trendler"
image: "https://images.pexels.com/photos/7691714/pexels-photo-7691714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "B2B'de AI Aramalarında Görünürlük (GEO) Rehberi"
alt: "b2b-ai-search-visibility-geo-guide"
---

B2B'de AI aramalarında görünürlük, yani **GEO (Generative Engine Optimization)**, markanızın ChatGPT, Perplexity, Gemini, Copilot ve Google AI Overviews gibi üretken yapay zekâ sistemlerinin cevaplarında **önerilen, alıntılanan ve doğru tanımlanan** bir kaynak hâline gelmesini sağlayan optimizasyon disiplinidir. Klasik SEO "mavi linklerde üst sıraya çıkmayı" hedefler. GEO ise yapay zekânın kurduğu cevabın **içinde yer almayı** hedefler. B2B şirketleri için bunun pratik anlamı şudur: Satın alma kararından önce "Türkiye'de B2B SaaS için en iyi outbound ajansları hangileri?" ya da "HubSpot mu Pipedrive mı?" diye soran bir yönetici, cevapta sizin adınızı görmüyorsa siz o listeye hiç girmemişsinizdir.

Bu rehberde GEO'nun SEO'dan farkını, yapay zekâ asistanlarının kaynak seçme mantığını, adım adım uygulanabilir bir B2B GEO planını, n8n ile ölçümün nasıl otomatikleştirileceğini ve çok markalı yapılarda dikkat edilmesi gerekenleri anlatıyoruz. Corner Group olarak SAAS Corner, Sales Corner, CRM Corner, Brand Corner ve Social Media Corner markalarında bu soruyu kendimize de soruyoruz. Burada paylaştığımız çerçeve, sahada test ettiğimiz pratik bir yaklaşımı yansıtıyor.

## GEO nedir ve SEO'dan farkı ne?

SEO'nun temel mantığı **sıralamadır**. Bir anahtar kelimede ilk 10 sonuç içinde olursanız tıklama alırsınız. GEO'nun mantığı ise **sentezdir**. Yapay zekâ asistanı birden fazla kaynağı okur, özetler ve tek bir cevap üretir. Bu cevapta ya bir marka adı olarak, ya bir alıntı ya da kaynak linki olarak, ya da hiç yer almazsınız.

Temel farklar şöyle özetlenebilir:

- **Hedef birimi:** SEO'da hedef sayfadır, GEO'da ise bilgi parçasıdır (paragraf, tanım, liste, tablo).
- **Başarı ölçütü:** SEO'da sıralama ve organik tıklama sayılır. GEO'da asistan cevaplarında görünme oranı (share of voice), alıntılanma ve markanın doğru tanımlanması önemlidir.
- **Sinyal kaynağı:** SEO büyük ölçüde backlink ve teknik sağlığa dayanır. GEO'da bunlara ek olarak **markanızın web genelinde ne kadar tutarlı ve sık anıldığı** belirleyicidir.
- **Sorgu yapısı:** SEO sorguları kısadır ("CRM yazılımı"). AI sorguları uzun ve bağlamlıdır ("20 kişilik satış ekibimiz var, Zoho kullanıyoruz, Pipedrive'a geçmeli miyiz?").

Önemli bir not: GEO, SEO'nun yerini almaz, onun üzerine inşa edilir. Taranamayan, indekslenemeyen ya da yavaş açılan bir sitenin yapay zekâ cevaplarında yer alma şansı da düşüktür. Çünkü pek çok asistan, cevap üretirken arama indekslerinden gerçek zamanlı veri çeker.

## B2B alıcılar neden artık yapay zekâ asistanlarına soruyor?

B2B satın alma süreci uzundur, birden fazla paydaş içerir ve araştırma yüküyle doludur. Bir satın alma komitesi üyesi eskiden 10 sekme açıp karşılaştırma tablosu hazırlardı. Bugün aynı kişi tek bir prompt ile kısa liste çıkarmayı, artı-eksi analizi almayı ve "hangi soruları sormalıyım" listesini hazırlatmayı tercih edebiliyor.

Bu davranış değişikliği B2B pazarlamacılar için üç somut sonuç doğurur:

1. **Kısa liste aşaması görünmezleşir.** Alıcı sizinle iletişime geçmeden önce elemesini yapay zekâ ile yapmış olabilir.
2. **İlk izlenimi asistan oluşturur.** Asistan markanızı yanlış kategoride tanımlıyorsa (ör. "influencer ajansı" yerine "sosyal medya ajansı"), satış görüşmesine yanlış beklentiyle gelinir.
3. **Rakip karşılaştırmaları sizin kontrolünüz dışında yapılır.** "X mi Y mi?" sorusunun cevabı, web'de o karşılaştırmayı en net yapan kaynaktan beslenir. O kaynak siz değilseniz, anlatıyı başkası kurar.

Ekiplerin bu araçları içeride nasıl kullandığını anlamak da GEO'ya giden yolu kolaylaştırır. Alıcılarınızın hangi prompt kalıplarını kullandığını tahmin etmek için [B2B pazarlama için ChatGPT prompt mühendisliğindeki yeni trendler](/blog/b2b-pazarlama-icin-chatgpt-prompt-muhendisliginde-yeni-trendler) yazımızdaki yaklaşımlar iyi bir başlangıç noktası sunar.

## Yapay zekâ asistanları hangi kaynakları alıntılıyor?

Her modelin algoritması farklıdır ve kesin formüller kamuya açık değildir. Ancak sahada gözlemlenen ortak örüntüler, hangi içeriklerin seçildiği konusunda güçlü ipuçları verir.

### Net ve kendi başına anlaşılır cevaplar

Asistanlar, bir soruya **ilk 2-3 cümlede doğrudan cevap veren** paragrafları alıntılamayı sever. "Bu yazıda şunlardan bahsedeceğiz" diye başlayan, cevabı 800. kelimeye saklayan içerikler genellikle atlanır.

### Yapılandırılmış bilgi

Numaralı adımlar, karşılaştırma tabloları, tanım kutuları ve SSS bölümleri modelin bilgiyi parçalara ayırmasını kolaylaştırır. Bir model "Pipedrive'ın Zoho'ya göre avantajları" sorusuna cevap ararken, madde madde avantaj listesi olan bir sayfa, aynı bilgiyi uzun bir paragrafa gömmüş sayfaya göre daha kullanışlıdır.

### Varlık (entity) netliği

Model, markanızı bir "varlık" olarak tanımlar: Ne yapar, hangi kategoridedir, kime hizmet verir, kiminle ilişkilidir? Sitenizde, LinkedIn şirket sayfanızda, rehber sitelerinde ve basın haberlerinde **aynı tanım** tekrarlanıyorsa model sizi güvenle konumlandırır. Her kanalda farklı bir tanım varsa model kararsız kalır ve sizi önermekten kaçınabilir.

### Üçüncü taraf doğrulaması

Asistanlar, bir markanın kendi hakkında söylediklerinden çok **başkalarının o marka hakkında söylediklerine** ağırlık verme eğilimindedir. Sektör listeleri, karşılaştırma yazıları, podcast transkriptleri, forum tartışmaları, LinkedIn'deki uzman paylaşımları ve inceleme platformları bu yüzden kritik önemdedir.

### Güncellik

Gerçek zamanlı arama yapan asistanlar (Perplexity, ChatGPT'nin arama modu, Google AI Overviews) yeni ve tarihli içerikleri öne çıkarabilir. "2023 CRM karşılaştırması" başlıklı ve hiç güncellenmemiş bir sayfa, güncel bir rakibe karşı dezavantajlıdır.

## B2B GEO stratejisi adım adım nasıl kurulur?

Aşağıdaki plan, 8-12 haftalık bir ilk döngü için tasarlandı. Küçük bir ekip bile haftada birkaç saat ayırarak uygulayabilir.

### Adım 1: Soru envanteri çıkarın

GEO'nun anahtar kelime araştırması, **soru araştırmasıdır**. Hedef: alıcılarınızın yapay zekâya soracağı 40-60 gerçekçi soruyu listelemek.

Kaynaklar:

- Satış ekibinin keşif görüşmelerinde en sık duyduğu sorular
- CRM'deki kaybedilen fırsat notları ("neden rakibi seçtiler?")
- Müşteri destek ve onboarding talepleri
- LinkedIn yorumlarında ve sektör gruplarında dönen tartışmalar

Soruları üç kovaya ayırın:

1. **Kategori soruları:** "B2B SaaS için outbound lead generation nasıl yapılır?"
2. **Karşılaştırma soruları:** "HubSpot mu Pipedrive mı, 15 kişilik satış ekibi için hangisi?"
3. **Marka soruları:** "SAAS Corner ne yapar?", "Brand Corner hangi influencer modellerini destekler?"

### Adım 2: Mevcut durumu ölçün (baseline)

Her soruyu en az 3-4 asistana (ör. ChatGPT, Perplexity, Gemini, Copilot) sorun ve şunları kaydedin:

- Markanız cevapta geçiyor mu? (Evet/Hayır)
- Geçiyorsa kaçıncı sırada ve nasıl tanımlanıyor?
- Hangi rakipler geçiyor?
- Hangi kaynaklar (URL) alıntılanıyor?

Örnek bir başlangıç tablosu: 50 soru × 4 asistan = 200 gözlem. Bu gözlemlerin kaçında markanızın geçtiği, ilk **AI share of voice** değerinizdir. Bu sayı ilk ölçümde düşük çıkarsa endişelenmeyin. Amaç, bir referans noktası belirlemek.

**İpucu:** Alıntılanan kaynak URL'leri altın değerindedir. Asistanların sizin kategorinizde hangi siteleri "güvenilir" saydığını gösterir. Bu siteler, Adım 5'teki dış görünürlük çalışmanızın hedef listesidir.

### Adım 3: Alıntılanabilir içerik formatına geçin

Mevcut ve yeni içeriklerinizi şu kalıba göre düzenleyin:

- **İlk 2-3 cümle:** Sorunun tek başına alıntılanabilecek, net cevabı.
- **Soru biçiminde ara başlıklar:** "Maliyeti ne kadar?", "Ne kadar sürede sonuç verir?" gibi.
- **Numaralı adımlar ve listeler:** Süreç anlatan her bölümde.
- **Karşılaştırma tabloları:** Özellikle "X mi Y mi?" içeriklerinde.
- **SSS bölümü:** Her yazının sonunda 3-5 net soru-cevap.
- **Tarih ve yazar bilgisi:** Güncellik ve uzmanlık sinyali için.

Pratik bir örnek: "CRM seçimi" hakkında 2.500 kelimelik bir yazınız varsa, girişine "15 kişinin altındaki, pipeline odaklı satış ekipleri için Pipedrive; pazarlama otomasyonu ve satışı tek çatıda isteyen ekipler için HubSpot; geniş ürün ekosistemi ve maliyet esnekliği arayanlar için Zoho genellikle öne çıkar" gibi net bir özet cümlesi eklemek, o yazının alıntılanma ihtimalini ciddi biçimde artırabilir.

### Adım 4: Varlık tutarlılığını sağlayın

Markanızın tek cümlelik tanımını yazın ve **her yerde aynı şekilde** kullanın:

- Web sitesi "Hakkımızda" ve footer alanı
- LinkedIn şirket sayfası "Genel Bakış" bölümü
- Instagram ve diğer sosyal profil biyografileri
- Rehber siteleri, ajans listeleri, etkinlik konuşmacı profilleri
- Basın bültenleri ve konuk yazı biyografileri

Örnek tanım kalıbı: **"[Marka], [hedef kitle] için [ana hizmet] sunan bir [kategori] şirketidir."**

Ton ve mesaj tutarlılığını kanallar arasında korumak yalnızca GEO için değil, genel marka algısı için de kritiktir. Bu konuyu detaylı ele aldığımız [AI ile çok kanallı iletişimde marka sesi tutarlılığı](/blog/ai-ile-b2b-marka-sesi-cok-kanalli-i-letisimde-tutarlilik-rehberi) rehberi, tanımlarınızı standartlaştırırken işinize yarayacaktır.

### Adım 5: Dış görünürlük ve üçüncü taraf sinyalleri oluşturun

Bu adım GEO'nun en çok emek isteyen ama en yüksek etkili kısmıdır. Hedef, Adım 2'de tespit ettiğiniz "güvenilir kaynaklarda" markanızın anılmasını sağlamaktır.

Somut taktikler:

- **Sektör karşılaştırma ve liste yazılarına dahil olun.** Editörlere güncel, doğrulanabilir bilgilerle ulaşın.
- **Podcast ve webinar konukluğu yapın.** Transkriptler genellikle indekslenir ve uzmanlık sinyali taşır.
- **LinkedIn'de uzman sesi oluşturun.** Kurucu ve satış liderlerinin düzenli, öğretici paylaşımları, markanın konu otoritesini güçlendirir. Kurumsal ve kişisel LinkedIn varlığınızı stratejik biçimde büyütmek için [Social Media Corner'ın B2B LinkedIn ve Instagram yönetimi](https://socialmediacorner.co) hizmetinden yararlanabilirsiniz.
- **Sektör influencer'ları ve uzmanlarla iş birliği yapın.** Güvenilir bir sektör uzmanının blogunda, bülteninde veya videosunda anılmak, yapay zekâ için güçlü bir dış doğrulamadır. Bu iş birliklerini doğru kurgulamak ve ölçmek için [B2B influencer pazarlamasında etkili stratejiler ve ölçümleme](/blog/b2b-influencer-pazarlamasi-etkili-stratejiler-ve-olcumleme-rehberi) yazımıza göz atabilir, uygulama tarafında [Brand Corner'ın influencer pazarlama platformunu](https://www.brandcorner.co) değerlendirebilirsiniz.
- **İnceleme platformlarında aktif olun.** Memnun müşterilerden dürüst değerlendirme isteyin. Sahte yorum gibi kestirmelerden kesinlikle kaçının.

### Adım 6: Teknik altyapıyı hazırlayın

Teknik tarafta kontrol edilmesi gereken başlıca noktalar şunlardır:

1. **AI tarayıcılarına erişim:** `robots.txt` dosyanızda GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot ve Google-Extended gibi tarayıcıları farkında olmadan engellemediğinizden emin olun. Hangi botlara izin vereceğiniz bir iş kararıdır. Ancak bu kararı bilinçli verin, varsayılan ayarlara bırakmayın.
2. **Yapılandırılmış veri (schema):** Organization, Article, FAQPage, Person (yazarlar için) ve uygunsa SoftwareApplication veya Service şemalarını kullanın. Arama motorları bazı zengin sonuç türlerini sınırlasa da yapılandırılmış veri, makinelerin içeriği anlamasına hâlâ yardımcı olur.
3. **Sunucu tarafında render:** İçeriği yalnızca JavaScript ile yükleyen sayfalar bazı tarayıcılar tarafından eksik okunabilir. Kritik metnin HTML'de doğrudan bulunması gerekir.
4. **Hız ve erişilebilirlik:** Gerçek zamanlı arama yapan asistanlar yavaş sayfalarda zaman aşımına düşebilir.
5. **llms.txt:** Yapay zekâ sistemlerine sitenizin özetini sunmayı amaçlayan bu öneri henüz yerleşik bir standart değildir. Düşük maliyetli bir deneme olarak eklenebilir, ancak tek başına sonuç beklenmemelidir.

### Adım 7: Ölçün, öğrenin, tekrarlayın

GEO tek seferlik bir proje değil, döngüsel bir süreçtir. Aylık ölçüm ritmi önerilir:

- **AI share of voice:** Soru envanterindeki cevaplarda görünme oranınız.
- **Tanım doğruluğu:** Asistanlar markanızı doğru kategoride ve doğru hizmetlerle mi tanımlıyor?
- **AI referans trafiği:** Analitik aracınızda chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com gibi kaynaklardan gelen oturumlar.
- **Beyana dayalı atıf:** Form ve demo talebi sayfalarına "Bizi nasıl duydunuz?" alanı ekleyin ve "ChatGPT / yapay zekâ asistanı" seçeneğini koyun. Bu alan, analitiğin göremediği "dark funnel" etkisini görünür kılmanın en basit yoludur.
- **CRM'de etiketleme:** AI kaynaklı lead'leri CRM'de ayrı bir kaynak olarak işaretleyin ve dönüşüm oranlarını diğer kanallarla karşılaştırın.

## n8n ile GEO takibi nasıl otomatikleştirilir?

Elle 200 gözlem yapmak ilk ay için öğreticidir ama sürdürülebilir değildir. n8n ile basit bir izleme iş akışı kurulabilir:

1. **Tetikleyici:** Haftalık Cron node'u (ör. her pazartesi 09:00).
2. **Soru listesi:** Google Sheets veya Airtable'dan soru envanterini çeken bir node.
3. **Sorgu:** Her soru için, API'si olan model ve arama servislerine HTTP Request node'u ile istek. Arayüzden aldığınız cevapların API cevaplarından farklı olabileceğini unutmayın. Bu yüzden otomasyonu, manuel kontrollerin yerine değil yanında kullanın.
4. **Analiz:** Dönen cevapta marka adı, rakip adları ve alıntılanan URL'leri bir Code node'u ile ayrıştırma.
5. **Kayıt:** Sonuçları tarih damgasıyla bir tabloya yazma.
6. **Uyarı:** Görünürlük bir önceki haftaya göre belirgin düştüğünde veya marka yanlış tanımlandığında Slack ya da e-posta bildirimi.
7. **Raporlama:** Ay sonunda özet tabloyu yöneticilere gönderen ayrı bir iş akışı.

Bu yapı, birden fazla markayı tek bir panelden izlemek isteyen gruplar için özellikle değerlidir. Benzer bir merkezi otomasyon mimarisini [çoklu markalı holdinglerde n8n ile pazarlama otomasyonu](/blog/coklu-markali-holdinglerde-n8n-ile-pazarlama-otomasyonu-rehberi) yazımızda detaylı olarak ele aldık.

## Çok markalı yapılarda GEO nasıl yönetilir?

Corner Group gibi birden fazla markası olan yapılarda GEO'nun kendine özgü riskleri vardır:

- **Varlık karışıklığı:** Asistan, kardeş markaları birbirine karıştırabilir veya hepsini tek bir şirket gibi tanımlayabilir. Her markanın tanımı net biçimde ayrışmalı, grup ilişkisi ise açıkça belirtilmelidir (ör. "SAAS Corner, Corner Group bünyesinde B2B SaaS şirketlerine outbound satış hizmeti sunar").
- **İç rekabet:** İki marka aynı soru için içerik üretirse, birbirlerinin alıntılanma şansını bölebilirler. Soru envanterini grup düzeyinde tutup her soruyu bir "sahip" markaya atamak bu sorunu çözer.
- **Çapraz destek:** Markalar birbirine bağlamsal olarak referans verebilir. Örneğin bir CRM içeriği, outbound sürecin CRM'e nasıl aktığını anlatırken kardeş markanın uzmanlığına doğal biçimde atıf yapabilir.
- **Ortak ölçüm paneli:** Tüm markaların AI share of voice verisini tek tabloda görmek, kaynak dağıtımını kolaylaştırır.

## En sık yapılan GEO hataları nelerdir?

1. **Yapay zekâ için içerik spam'i üretmek.** Düşük kaliteli, birbirinin kopyası yüzlerce sayfa hem SEO'ya hem marka algısına zarar verir. Asistanlar da özgün, derinlikli kaynakları tercih etme eğilimindedir.
2. **Cevabı gizlemek.** Okuru form doldurmaya zorlamak için asıl bilgiyi saklamak, alıntılanma şansını sıfırlar. Değerli bilgiyi açıkta bırakın, derinleşmeyi teklif edin.
3. **Sadece kendi sitesine odaklanmak.** Dış kaynaklarda anılmayan bir marka, ne kadar iyi içerik üretse de sınırlı görünürlük elde eder.
4. **Tutarsız marka tanımları.** Her kanalda farklı bir slogan veya kategori tanımı, modeli kararsız bırakır.
5. **Ölçmeden optimize etmek.** Baseline olmadan yapılan çalışmanın etkisi kanıtlanamaz. Bu da bütçe görüşmelerinde ekibi zor durumda bırakır.
6. **Uydurma iddialar.** "Sektörün lideri", "1 numaralı" gibi doğrulanamayan ifadeler hem güven kaybettirir hem de yapay zekâ cevaplarında yanlış bilgi zincirine yol açabilir.

## Maliyeti ne kadar ve sonuç ne zaman gelir?

GEO'nun maliyeti büyük ölçüde **mevcut içerik altyapınıza** bağlıdır. Düzenli blog yayınlayan, LinkedIn'de aktif ve teknik SEO temeli sağlam bir şirket için ek maliyet çoğunlukla mevcut içeriklerin yeniden düzenlenmesi, ölçüm sisteminin kurulması ve dış görünürlük çalışmalarından oluşur.

Örnek bir kaynak planı:

- **İlk 2 hafta:** Soru envanteri ve baseline ölçümü. Bir pazarlama uzmanının yaklaşık 15-20 saatlik emeği yeterlidir.
- **3-8. haftalar:** En önemli 10-15 içeriğin alıntılanabilir formata dönüştürülmesi, varlık tutarlılığı düzeltmeleri ve teknik kontroller.
- **8. haftadan sonra:** Dış görünürlük çalışmaları ve aylık ölçüm döngüsü.

Sonuçların zamanlaması asistana göre değişir. Gerçek zamanlı arama yapan sistemlerde içerik güncellemelerinin etkisi birkaç hafta içinde görülebilir. Modelin eğitim verisine dayanan "ezber" bilgisinin değişmesi ise daha uzun sürer, çünkü yeni model sürümlerini beklemek gerekir. Bu yüzden GEO'yu kampanya olarak değil, **en az 6 aylık bir program** olarak planlamak gerçekçidir.

## Sık sorulan sorular

### GEO, SEO'nun yerini mi alıyor?

Hayır. GEO, SEO'nun üzerine inşa edilen tamamlayıcı bir disiplindir. Taranabilir, hızlı ve otoriter bir site olmadan yapay zekâ cevaplarında görünmek de zorlaşır. En doğru yaklaşım, iki disiplini aynı içerik stratejisi altında yönetmektir.

### B2B şirketleri GEO'ya nereden başlamalı?

En verimli başlangıç noktası, alıcıların yapay zekâya soracağı 40-60 soruluk bir envanter çıkarıp bu soruları birkaç asistanda test etmektir. Bu baseline, hangi konularda görünmediğinizi ve hangi kaynakların alıntılandığını gösterir. Sonraki tüm adımlar bu veriye göre önceliklendirilir.

### Yapay zekâ asistanlarında görünürlüğümü nasıl ölçerim?

Üç katmanlı bir ölçüm önerilir. Birinci katman, soru envanterinizdeki cevaplarda markanızın geçme oranıdır (AI share of voice). İkinci katman, analitikte AI platformlarından gelen referans trafiğidir. Üçüncü katman ise formlardaki "Bizi nasıl duydunuz?" alanı gibi beyana dayalı atıflardır.

### Küçük bir B2B şirketi büyük rakiplere karşı GEO'da şansı var mı?

Evet. Yapay zekâ asistanları niş ve spesifik sorulara cevap ararken, o konuyu en net ve en derin anlatan kaynağı tercih edebilir. Belirli bir sektöre, bölgeye veya kullanım senaryosuna odaklanan küçük bir şirket, genel içerik üreten büyük rakiplerin önüne geçebilir.

## Sonuç

B2B alıcılarının araştırma yolculuğu değişiyor. Kısa listeler artık arama sonuç sayfalarında değil, yapay zekâ asistanlarının cevaplarında oluşuyor. GEO, bu yeni ortamda markanızın doğru tanımlanmasını, güvenilir kaynaklarda anılmasını ve alıcının karar anında akla gelmesini sağlayan sistematik bir çalışmadır. Soru envanteri, alıntılanabilir içerik, varlık tutarlılığı, dış görünürlük, teknik altyapı ve düzenli ölçümden oluşan döngüyü kurduğunuzda, yapay zekâ cevaplarındaki yeriniz şansa bağlı olmaktan çıkar.

Corner Group olarak outbound satıştan CRM'e, influencer pazarlamadan LinkedIn yönetimine kadar uzanan markalarımızla B2B şirketlerinin hem insanlar hem de yapay zekâ tarafından doğru anlaşılmasına yardımcı oluyoruz. Markanızın AI aramalarındaki görünürlüğünü birlikte değerlendirmek için [bizimle iletişime geçin](/iletisim).
