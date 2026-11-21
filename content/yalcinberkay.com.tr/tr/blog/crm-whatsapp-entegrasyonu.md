---
title: "CRM ile WhatsApp Business Entegrasyonu Nasıl Yapılır?"
description: "Satış ekibinizin WhatsApp Business yazışmalarını CRM kaydına bağlamanın adımlarını, araç seçeneklerini ve KVKK uyumlu kurulum notlarını anlatıyoruz."
date: "2026-11-01"
category: "CRM"
image: "https://images.pexels.com/photos/7988674/pexels-photo-7988674.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "CRM ile WhatsApp Business Entegrasyonu Nasıl Yapılır?"
---

WhatsApp Business'ı CRM'e entegre etmenin sağlıklı yolu, **WhatsApp Business uygulamasını değil, WhatsApp Business Platform'u (API) kullanmaktır.** Bunun için bir Meta iş ortağı (BSP) ya da CRM'inizin yerel entegrasyonu üzerinden numaranızı bağlarsınız. Ardından telefon numaralarını CRM'deki kişi kayıtlarıyla eşleştirir, onay (opt-in) alanlarını tanımlar, şablon mesajlarınızı Meta onayına gönderir ve konuşmaların hangi temsilciye düşeceğini belirleyen kuralları kurarsınız. Teknik kısım çoğu zaman birkaç günde biter. Asıl zaman alan iş süreç tasarımıdır: kim, kime, hangi aşamada, hangi mesajı atacak?

Türkiye'de B2B satış yapan neredeyse her ekibin bir WhatsApp gerçeği vardır. Müşteri e-postaya iki gün dönmez ama WhatsApp'a on dakikada yanıt verir. Sorun, bu konuşmaların temsilcilerin kişisel telefonlarında kalmasıdır. Temsilci ayrıldığında müşteri geçmişi de onunla gider. Yönetici pipeline'a baktığında fırsatın son durumunu göremez, çünkü son pazarlık WhatsApp'ta yapılmıştır. Bu yazıda entegrasyonu baştan sona, karar noktaları ve maliyet kalemleriyle birlikte anlatıyorum.

## WhatsApp Business uygulaması mı, API mi?

İşe bu ayrımla başlamak gerekiyor, çünkü yanlış seçim aylar sonra geri dönüşü zor bir duvara çarptırır.

**WhatsApp Business uygulaması** telefonunuza indirdiğiniz ücretsiz uygulamadır. Katalog, hızlı yanıtlar, etiketler ve otomatik karşılama mesajı sunar. Küçük bir işletme için yeterlidir. Ancak CRM entegrasyonu açısından ciddi sınırları vardır:

- Resmi ve kararlı bir API'si yoktur. "Uygulamayı CRM'e bağlıyoruz" diyen çözümlerin bir kısmı resmi olmayan yöntemler kullanır ve numaranızın engellenme riskini taşır.
- Aynı numarayı birden fazla temsilcinin düzenli biçimde kullanması zordur.
- Konuşmalar otomatik olarak kişi kaydına yazılmaz.
- Raporlama yok denecek kadar azdır.

**WhatsApp Business Platform (API)** ise sistemler arası entegrasyon için tasarlanmıştır. Bir arayüzü yoktur. Arayüzü CRM'iniz ya da kullandığınız iş ortağının paneli sağlar. Sunduğu imkânlar şunlardır:

- Tek numarayı onlarca temsilcinin ortak gelen kutusundan kullanması
- Mesajların kişi, şirket ve fırsat kayıtlarına otomatik işlenmesi
- Şablon mesajlarla toplu ama kişiselleştirilmiş bildirimler
- Webhook'larla diğer sistemlere (form, takvim, ERP) bağlanma
- Konuşma bazlı raporlama

Pratik bir kural vermek gerekirse: Satışta birden fazla kişi WhatsApp kullanıyorsa ya da konuşmaların CRM'de görünmesini istiyorsanız, API'ye geçin. Tek kişilik bir danışmanlık işi yürütüyorsanız uygulama bir süre daha idare eder.

## Entegrasyondan önce hangi kararları vermelisiniz?

Teknik kurulumdan önce yarım günlük bir çalışma yapın ve aşağıdaki soruları yazılı olarak cevaplayın. Bu kararları sonradan değiştirmek, baştan doğru vermekten çok daha pahalıdır.

### WhatsApp'ı hangi satış anlarında kullanacaksınız?

WhatsApp her aşamaya uygun bir kanal değildir. B2B'de en iyi sonuç verdiği yerler genellikle şunlardır:

1. **Inbound lead karşılama:** Web formu dolduran kişiye ilk dakikalarda kısa bir mesaj göndermek.
2. **Toplantı teyidi ve hatırlatma:** Demodan bir gün önce ve bir saat önce gönderilen hatırlatma, gelmeme (no-show) oranını belirgin şekilde düşürür.
3. **Teklif sonrası takip:** Teklifi e-postayla gönderip "Teklifi ilettim, sorularınız olursa buradan da yazabilirsiniz" notunu WhatsApp'tan düşmek.
4. **Sözleşme ve onboarding:** İmza sürecinde eksik evrak takibi, kurulum adımları.
5. **Mevcut müşteri iletişimi:** Yenileme, ek satış, destek talebi yönlendirme.

Kullanmamanız gereken yer ise **soğuk prospecting**tir. Hiç iletişime geçmemiş, onay vermemiş birine WhatsApp'tan satış mesajı atmak hem Meta politikalarına hem de Türkiye'deki mevzuatın ruhuna aykırıdır. Numaranızın kalitesi düşer ve hesabınız kısıtlanabilir. Soğuk erişim için e-posta, telefon ve LinkedIn hâlâ doğru kanallardır.

### Hangi CRM nesnesine yazılacak?

Mesajlar kişi (contact) kaydına mı, fırsat (deal) kaydına mı, yoksa ikisine birden mi düşecek? Benim önerim şu: Konuşma her zaman **kişi kaydına** bağlansın, açık bir fırsat varsa o fırsatın zaman akışında da görünsün. Fırsat aşamalarınız net tanımlı değilse bu noktada sorun yaşarsınız. Önce [CRM'de satış aşamalarının nasıl tanımlanacağı](/blog/crmde-satis-asamalari-nasil-tanimlanir) konusunu oturtmanızı öneririm, çünkü otomatik mesaj tetikleyicilerinin büyük kısmı aşama değişikliklerine bağlanacak.

### Konuşmanın sahibi kim olacak?

Gelen bir WhatsApp mesajı kime düşer? Üç yaygın model vardır:

- **Kayıt sahibine yönlendirme:** Kişi kaydının sahibi kimse mesaj ona gider. Account Executive'lerin portföy yönettiği ekiplerde en mantıklı modeldir.
- **Sıralı dağıtım (round-robin):** Yeni inbound lead'ler sırayla SDR'lara dağıtılır.
- **Ortak havuz:** Tüm ekip aynı kutuyu görür, ilk alan sahiplenir. Küçük ekiplerde işe yarar, büyüdükçe karmaşa yaratır.

## CRM ile WhatsApp Business entegrasyonu adım adım nasıl yapılır?

Aşağıdaki sıra, farklı CRM'lerde ve farklı ekip büyüklüklerinde test edilmiş bir akıştır. Araç değişse de mantık aynıdır.

### 1. Entegrasyon yolunu seçin

Üç seçeneğiniz var:

- **CRM'in yerel entegrasyonu:** HubSpot, Salesforce, Zoho, Bitrix24 gibi pek çok CRM'in kendi WhatsApp bağlantısı ya da resmi pazar yerinde (marketplace) uygulamaları vardır. Kurulumu en hızlı yoldur. Ancak bazı özellikler üst paketlerle sınırlı olabilir.
- **BSP (Business Solution Provider) üzerinden:** Meta'nın onaylı iş ortakları numaranızı API'ye bağlar ve CRM'inize hazır bir konektör sunar. Türkçe destek veren yerel iş ortakları da var. Çok sayıda temsilci ve gelişmiş yönlendirme gerekiyorsa genellikle en esnek seçenektir.
- **Ara katman otomasyonu (Make, Zapier, n8n vb.):** Elinizde WhatsApp API erişimi varsa, CRM ile arasındaki veri akışını bu araçlarla kurgulayabilirsiniz. Esnektir ama bakım yükü size kalır.

CRM'inizi henüz seçmediyseniz WhatsApp entegrasyonunu seçim kriterlerinden biri yapın. [Küçük satış ekibi için CRM seçimi](/blog/kucuk-satis-ekibi-icin-crm-nasil-secilir) yazısında bu tür kriterleri daha geniş ele almıştım.

### 2. Meta Business hesabını ve numarayı hazırlayın

Teknik tarafta yapmanız gerekenler:

1. **Meta Business Manager** hesabı açın ya da mevcut hesabı kullanın.
2. **İşletme doğrulamasını** tamamlayın. Ticaret sicil bilgileri, vergi levhası gibi belgeler istenebilir. Bu adım birkaç gün sürebildiği için en başta başlatın.
3. API'ye bağlayacağınız **telefon numarasını** belirleyin. Bu numara aynı anda normal WhatsApp ya da WhatsApp Business uygulamasında aktif olmamalıdır. Mevcut numarayı taşıyacaksanız uygulamadaki hesabı kapatmanız gerekebilir. Konuşma geçmişini önceden yedekleyin.
4. **Görünen adı** (display name) ve profil bilgilerini girin. Görünen ad, şirket adınızla tutarlı olmalıdır, aksi halde Meta reddedebilir.

Sık yapılan bir hata, şirketin ana santral numarasını gözü kapalı bağlamaktır. Ayrı bir mobil ya da sabit hat ayırmak çoğu zaman daha temizdir.

### 3. Telefon numarası verisini temizleyin

Entegrasyonun başarısı, CRM'deki telefon verisinin kalitesine doğrudan bağlıdır. WhatsApp mesajı geldiğinde sistem numarayı CRM'de arar. Bulamazsa yeni bir kişi oluşturur. Bulursa ama iki tane bulursa konuşma yanlış kayda düşer.

Yapmanız gerekenler:

- Tüm numaraları **uluslararası formata (E.164)** çevirin. "0532 123 45 67", "5321234567" ve "+90 532 123 45 67" aynı numaradır ama sistem için üç farklı değerdir. Hepsini "+905321234567" formatına getirin.
- **Sabit hat ve mobil numarayı ayrı alanlarda** tutun. WhatsApp mesajları mobil alana bağlanmalı.
- **Yinelenen kayıtları** birleştirin. Bu iş için [CRM'de yinelenen kayıtların nasıl ayıklanacağını](/blog/crm-veri-temizligi-yinelenen-kayitlar) anlattığım rehberdeki adımları kullanabilirsiniz.
- Yeni kayıt girişinde numara formatını zorunlu kılan bir doğrulama kuralı ekleyin.

Örnek: 3.000 kişilik bir CRM veritabanında numaraların yaklaşık üçte birinin farklı formatlarda girildiğini düşünün. Format düzeltilmeden entegrasyon açılırsa ilk haftada yüzlerce "isimsiz" yeni kayıt oluşur ve ekip CRM'e güvenini kaybeder.

### 4. Onay (opt-in) alanlarını kurun

CRM'e en az şu alanları ekleyin:

- **WhatsApp onayı** (Evet/Hayır)
- **Onay tarihi**
- **Onay kaynağı** (web formu, toplantı, e-posta yanıtı, sözlü beyan vb.)
- **Ret tarihi** (kişi "artık yazmayın" dediğinde)

Formlarınıza ayrı ve önceden işaretlenmemiş bir kutucuk ekleyin: "Toplantı hatırlatmaları ve teklif güncellemeleri için WhatsApp üzerinden iletişime geçilmesini kabul ediyorum." Pazarlama içerikli mesaj atmayı planlıyorsanız bunu da açıkça yazın.

### 5. Şablon mesajları hazırlayın ve onaya gönderin

WhatsApp API'nin en önemli kuralı **müşteri hizmetleri penceresidir**. Kişi size yazdıktan sonraki 24 saat içinde serbest metinle yanıt verebilirsiniz. Bu pencere kapandıysa ya da konuşmayı siz başlatıyorsanız, yalnızca Meta'nın önceden onayladığı **şablon mesajları** gönderebilirsiniz.

Şablonlar kategorilere ayrılır. Satış ekipleri için önemli olanlar şunlardır:

- **Utility (hizmet/işlem):** Toplantı teyidi, teklif gönderim bildirimi, evrak hatırlatma.
- **Marketing (pazarlama):** Kampanya, etkinlik daveti, yeni ürün duyurusu.
- **Authentication (doğrulama):** Tek kullanımlık kodlar. Satışta nadiren gerekir.

Satış ekibi için başlangıç seti olarak 5-6 şablon yeterlidir:

1. **İlk karşılama:** "Merhaba {{1}}, {{2}} üzerinden ilettiğiniz talep için teşekkürler. Ben {{3}}, ihtiyacınızı konuşmak için bu hafta 20 dakikalık bir görüşme planlayabilir miyiz?"
2. **Toplantı teyidi:** "Merhaba {{1}}, {{2}} saat {{3}}'teki görüşmemizi teyit ediyorum. Bağlantı: {{4}}"
3. **Toplantı hatırlatma (1 saat önce)**
4. **Teklif bildirimi:** "Merhaba {{1}}, konuştuğumuz kapsamdaki teklifimizi e-posta adresinize ilettim. Sorularınız olursa buradan da yazabilirsiniz."
5. **Sessizlik sonrası takip:** Teklifin üzerinden belirli bir süre geçip yanıt gelmediyse nazik bir yoklama.
6. **Kapanış sonrası onboarding:** İlk kurulum adımlarını ileten mesaj.

Şablonlarda dikkat edilecekler: Kısa olsun, değişkenleri ({{1}} gibi) anlamlı yerlerde kullanın. Satış dilini abartmayın. "Hizmet" kategorisinde bir şablonu pazarlama metniyle doldurursanız Meta kategoriyi değiştirebilir ya da reddedebilir.

### 6. Otomasyonları CRM aşamalarına bağlayın

Asıl değer burada ortaya çıkar. Örnek bir akış:

- **Yeni inbound lead oluştu + WhatsApp onayı var:** 5 dakika içinde "İlk karşılama" şablonu gider, lead SDR'a atanır.
- **Fırsat "Demo planlandı" aşamasına geçti:** Toplantı teyit şablonu gider. Toplantıdan 1 saat önce hatırlatma tetiklenir.
- **Fırsat "Teklif gönderildi" aşamasına geçti:** Teklif bildirimi gider. 4 iş günü içinde yanıt gelmezse temsilciye "WhatsApp takibi yap" görevi açılır.
- **Fırsat "Kazanıldı" oldu:** Onboarding şablonu gider ve kayıt müşteri başarı ekibine devredilir.

Burada önemli bir tasarım ilkesi var: **Her şeyi otomatik göndermeyin.** Teklif sonrası takip gibi ilişki hassasiyeti yüksek anlarda otomasyon mesajı göndermek yerine temsilciye görev açmak çoğu zaman daha iyi sonuç verir. Müşteri, kişiye özel yazılmış bir mesajı otomatik olandan kolayca ayırt eder.

### 7. Pilot yapın, sonra yayın

Tüm ekibi aynı anda açmayın. İki-üç temsilciyle iki hafta pilot yapın ve şunları kontrol edin:

- Gelen mesajlar doğru kişi kaydına düşüyor mu?
- Yeni kayıt oluşturma kuralı gereksiz kayıt üretiyor mu?
- Yönlendirme doğru çalışıyor mu? Mesajlar sahipsiz kalıyor mu?
- Şablonların okunma ve yanıt oranları nasıl?
- Temsilciler WhatsApp'ı hâlâ kişisel telefondan kullanıyor mu?

Son madde kritik. Entegrasyon kurulduğu halde temsilciler eski alışkanlıkla kişisel numaralarından yazmaya devam ediyorsa, sorun teknik değil davranışsaldır. Bu durumda [satış ekibinin CRM'i neden kullanmadığını](/blog/satis-ekibi-crmi-kullanmiyor) anlattığım yazıdaki yaklaşımlar burada da geçerli: kuralı netleştirin, yöneticinin kendisi örnek olsun, raporları sadece CRM'deki veriden yapın.

## Maliyeti ne kadar?

Maliyet tek kalemden oluşmaz. Dört bileşeni ayrı ayrı düşünmeniz gerekir:

1. **Meta mesaj ücretleri:** Meta, şablon mesajlar için ülkeye ve kategoriye göre değişen bir ücret alır. Pazarlama şablonları genellikle en pahalı, hizmet şablonları daha ucuz kategoridir. Müşterinin başlattığı ve 24 saatlik pencere içinde serbest metinle yürüttüğünüz yazışmalar ise genellikle ücretlendirilmez. Meta fiyatlandırma modelini zaman zaman değiştirdiği için güncel tarifeyi kurulumdan önce mutlaka kontrol edin.
2. **BSP ya da entegrasyon aracı aboneliği:** Genellikle aylık sabit ücret, bazen kullanıcı veya numara başına ek ücret içerir. Bazı iş ortakları Meta ücretlerinin üzerine kendi marjlarını ekler. Teklif alırken bunu açıkça sorun.
3. **CRM paketi:** WhatsApp entegrasyonu bazı CRM'lerde yalnızca üst paketlerde bulunur. Paket yükseltmesi, ekip büyüklüğüne göre en büyük maliyet kalemi olabilir.
4. **Kurulum ve bakım emeği:** Şablon hazırlığı, veri temizliği, otomasyon kurulumu ve sonradan yapılacak düzenlemeler için iç kaynak ya da dış destek.

Hesaplama mantığını göstermek için **varsayımsal** bir örnek: 6 temsilcilik bir ekip ayda 300 yeni lead'e karşılama mesajı, 120 toplantıya teyit ve hatırlatma, 50 teklife bildirim gönderiyor olsun. Bu yaklaşık 590 şablon mesaj eder ve çoğu hizmet kategorisindedir. Müşterilerin yanıt verdiği konuşmaların devamı çoğunlukla ücretsiz pencere içinde kalır. Bu senaryoda Meta ücretleri genellikle toplam maliyetin küçük bir kısmıdır. Asıl belirleyici kalemler CRM paketi ve BSP aboneliğidir. Birim fiyatları kendi tekliflerinizle doldurup aynı tabloyu kurarsanız gerçekçi bir bütçe çıkar.

Maliyeti değerlendirirken karşı tarafı da hesaba katın: Toplantıya gelmeme oranındaki düşüş ve teklif sonrası daha hızlı yanıtlar, satış döngüsünü kısaltır. [B2B satış döngüsünü kısaltma](/blog/b2b-satis-dongusu-nasil-kisaltilir) üzerine yazdığım yöntemlerin birkaçı doğrudan bu tür hızlı iletişim kanallarına dayanır.

## KVKK ve ticari ileti kuralları açısından nelere dikkat etmelisiniz?

Hukuki tavsiye değil, ama sahada gördüğüm temel noktalar şunlar:

- **Kişisel veri işliyorsunuz.** WhatsApp üzerinden gelen ad, numara ve mesaj içerikleri KVKK kapsamındadır. Aydınlatma metninizde WhatsApp kanalını ve verinin hangi sistemlerde (CRM, BSP, Meta) işlendiğini belirtin.
- **Yurt dışına veri aktarımı** konusu gündeme gelir, çünkü Meta ve birçok BSP'nin sunucuları yurt dışındadır. Hukuk danışmanınızla bu başlığı mutlaka konuşun.
- **Ticari elektronik ileti mevzuatı:** Pazarlama amaçlı mesajlar için onay ve İleti Yönetim Sistemi (İYS) yükümlülükleri gündeme gelebilir. Tacir ve esnaflara yönelik iletilerde bazı istisnalar olsa da ret hakkı her zaman saklıdır. Kişi "yazmayın" dediğinde bu bilgi CRM'e işlenmeli ve otomasyonlar durmalıdır.
- **Meta'nın kendi politikası** mevzuattan bağımsız olarak onay ister. Yasal olarak gönderebileceğiniz bir mesaj, Meta politikasına aykırıysa numaranız yine de kısıtlanabilir.

Benzer ilkeleri e-posta tarafında [soğuk e-posta ve KVKK](/blog/soguk-eposta-kvkk-outbound-ekipler) yazısında detaylı anlatmıştım. Mantık WhatsApp için daha da sıkı uygulanmalıdır, çünkü kanal çok daha kişiseldir.

## Satış ekibi WhatsApp'ı günlük olarak nasıl kullanmalı?

Teknik kurulum ne kadar iyi olursa olsun, ekibin kullanım kurallarını yazılı hale getirmezseniz kaos çıkar. Kısa bir "WhatsApp oyun kitabı" hazırlayın. İçinde şunlar olsun:

- **Yanıt süresi hedefi:** Mesai içinde gelen mesajlara örneğin 30 dakika içinde dönüş.
- **Mesai dışı kural:** Mesai sonrası otomatik yanıt devreye girsin. Temsilciler gece 23.00'te müşteriye yazmasın.
- **Ne WhatsApp'ta konuşulmaz:** Fiyat pazarlığının son hali, sözleşme maddeleri ve indirim onayları yazılı olarak e-posta ya da teklif sistemi üzerinden teyit edilir. WhatsApp hızlandırıcıdır, resmi kayıt kanalı değildir.
- **Ses kaydı ve dosya:** Ses kaydı yerine kısa yazılı mesaj tercih edilsin. Yöneticiler ses kayıtlarını hızlıca tarayamaz ve özetleyemez.
- **Ton:** Samimi ama profesyonel. Emoji kullanımı müşterinin tonuna göre ayarlansın.
- **Grup sohbetleri:** Müşteri tarafında birden fazla karar verici varsa WhatsApp grubu açmak cazip gelir. Ancak grupların CRM entegrasyonu çoğu çözümde sınırlıdır. Kritik bilgiler mutlaka e-postayla da paylaşılmalı.

Haftalık pipeline toplantılarında WhatsApp konuşmalarının CRM'deki zaman akışından okunabilmesi, yöneticinin "Müşteri en son ne dedi?" sorusunu temsilciye sormadan cevaplayabilmesi demektir. Toplantılar daha kısa ve daha somut geçer.

## Hangi metrikleri izlemelisiniz?

Entegrasyonun işe yarayıp yaramadığını anlamak için şu göstergeleri ilk günden takip edin:

- **İlk yanıt süresi:** Inbound lead'e ilk mesajın gitme süresi (otomatik) ve temsilcinin ilk kişisel yanıtı (manuel).
- **Şablon okunma ve yanıt oranı:** Hangi şablon yanıt alıyor, hangisi görmezden geliniyor?
- **Toplantıya katılım oranı:** WhatsApp hatırlatması gönderilen ve gönderilmeyen toplantıları karşılaştırın.
- **Teklif sonrası ilk yanıt süresi:** WhatsApp bildirimi eklendikten önceki ve sonraki dönemi kıyaslayın.
- **Ret/engelleme sinyalleri:** "Yazmayın" yanıtları ve Meta panelindeki numara kalite puanı. Kalite puanı düşüyorsa şablonlarınız fazla agresif ya da yanlış kişilere gidiyor demektir.
- **CRM dışı kullanım:** Temsilcilerin müşteriyle yazıştığı ama CRM'de kaydı olmayan konuşmalar. Bunu ancak 1:1 görüşmelerde ve müşteri geri bildirimlerinde fark edersiniz.

İlk ay için gerçekçi bir hedef: ölçmeye başlamak ve en zayıf iki şablonu yeniden yazmak. Mükemmel kurguyu ilk gün aramayın.

## Sık yapılan hatalar

Sahada en çok karşılaştığım hatalar:

1. **Resmi olmayan araçlarla uygulamayı CRM'e bağlamak.** Kısa vadede ucuzdur, numara kapandığında tüm müşteri iletişimini kaybedersiniz.
2. **Veri temizliğini atlamak.** Format karmaşası yüzünden konuşmalar yanlış kayıtlara düşer.
3. **WhatsApp'ı soğuk erişim kanalı sanmak.** Kalite puanı hızla düşer, hesap kısıtlanır.
4. **Her şeyi otomatikleştirmek.** Müşteri bir botla konuştuğunu hissettiği an ilişki soğur.
5. **Sahiplik kuralı koymamak.** Ortak kutuda herkesin gördüğü ama kimsenin yanıtlamadığı mesajlar birikir.
6. **Pazarlama ve satış ekiplerinin aynı numaradan koordinasyonsuz mesaj atması.** Müşteri aynı gün hem kampanya mesajı hem satış takibi alır. Hangi ekibin hangi şablonu hangi koşulda göndereceğini tek bir takvimde yönetin.

Bu tür otomasyonları ekip içinde kurgulayacak kapasiteniz yoksa, satış operasyonu ve otomasyon tarafında destek veren [Corner Group'un strateji ve otomasyon ekibi](https://cornergroup.co) gibi bir yapıyla ilk kurgu birlikte yapılabilir. Ardından bakımı ekibinize devredebilirsiniz.

## Sık sorulan sorular

### WhatsApp Business uygulamasını CRM'e bağlamak mümkün mü?

Bazı araçlar uygulamayı CRM'e bağladığını iddia eder, ancak bunların bir kısmı resmi olmayan yöntemler kullanır ve numaranızın engellenme riski vardır. Sürdürülebilir ve çok kullanıcılı bir kurgu için WhatsApp Business Platform (API) kullanmak gerekir. Meta'nın kendi ekosisteminde gelen yenilikleri takip etmekte fayda var, ama satış ekibi ölçeğinde API hâlâ doğru tercihtir.

### Müşteriye WhatsApp'tan ilk mesajı biz atabilir miyiz?

Evet, ancak yalnızca Meta tarafından onaylanmış şablon mesajlarla ve kişinin WhatsApp üzerinden iletişime onay vermiş olması şartıyla. Kişi size yazdıktan sonraki 24 saat içinde ise serbest metinle yanıt verebilirsiniz. Onayı olmayan kişilere soğuk satış mesajı atmak hem politika hem mevzuat açısından risklidir.

### Entegrasyon ne kadar sürer?

İşletme doğrulaması ve numara bağlantısı genellikle birkaç gün ile iki hafta arasında tamamlanır. Şablon onayları çoğunlukla hızlıdır. Asıl süre veri temizliği, otomasyon kurgusu ve ekip eğitimine gider. Pilot dahil 3-6 haftalık bir plan gerçekçidir.

### Temsilciler kişisel numaralarından yazmaya devam ederse ne olur?

Konuşmalar CRM'e düşmez, temsilci ayrıldığında müşteri geçmişi kaybolur ve onay kayıtları tutulamaz. Bu yüzden entegrasyonla birlikte net bir kural koyun: Müşteriyle tüm WhatsApp iletişimi şirket numarasından yürür. Raporlama ve pipeline değerlendirmeleri de yalnızca CRM'deki veriye dayanır.

## Sonuç

CRM ile WhatsApp Business entegrasyonu teknik olarak zor bir proje değil. Zorluk, doğru kararları doğru sırayla vermekte. Önce API ile uygulama arasındaki seçimi yapın. Ardından WhatsApp'ı hangi satış anlarında kullanacağınızı belirleyin, telefon verinizi temizleyin, onay alanlarını kurun, az sayıda iyi yazılmış şablonla başlayın ve otomasyonları satış aşamalarınıza bağlayın. Pilotla doğrulayın, metrikleri izleyin ve ekibin kişisel telefon alışkanlığını bilinçli olarak dönüştürün. Bunları yaptığınızda WhatsApp, kontrol edilemeyen bir yan kanal olmaktan çıkar ve pipeline'ın görünür, ölçülebilir bir parçası haline gelir.

Kendi CRM'inizde WhatsApp kurgusunu tasarlarken ya da satış operasyonunuzu baştan düzenlerken bir dış göz isterseniz, [Berkay Yalçın](/tr) sayfası üzerinden bana ulaşabilirsiniz. Mevcut yapınızı birlikte değerlendirelim.
