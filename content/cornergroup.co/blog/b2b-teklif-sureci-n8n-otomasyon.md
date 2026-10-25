---
title: "B2B Teklif Sürecini n8n ile Otomatikleştirme Rehberi"
description: "KOBİ'ler teklif hazırlama süresini nasıl kısaltır? Bu rehberde n8n ile form talebinden onaylı PDF teklife uzanan otomasyonun kurulumunu adım adım."
date: "2026-10-25"
category: "Otomasyon"
image: "https://images.pexels.com/photos/8171198/pexels-photo-8171198.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "B2B Teklif Sürecini n8n ile Otomatikleştirme Rehberi"
alt: "automate-b2b-quote-process-n8n"
---

B2B teklif sürecini n8n ile otomatikleştirmek, **CRM'deki bir fırsat belirli bir aşamaya geldiğinde teklifin otomatik hazırlanması, onaylanması, gönderilmesi ve takip edilmesi** anlamına gelir. Akış şöyle işler: n8n müşteri ve ürün verisini CRM'den çeker, fiyat ve indirim kurallarını uygular, gerekiyorsa yöneticiden onay alır, PDF teklifi üretip müşteriye iletir ve yanıt gelene kadar hatırlatmaları kendisi yönetir. Bu yapı, satış temsilcisinin bir teklif için harcadığı saatleri dakikalara indirir ve fiyatlama hatalarını büyük ölçüde ortadan kaldırır.

Pek çok B2B şirkette teklif hazırlamak hâlâ elle yürütülür. Temsilci Excel'den fiyat listesini açar, bir önceki teklifin Word dosyasını kopyalar, müşteri adını değiştirir, indirim için yöneticisine WhatsApp'tan yazar, PDF'i e-postayla gönderir ve takibi hafızasına bırakır. Bu rehberde aynı süreci n8n ile uçtan uca nasıl kuracağınızı adım adım ele alıyoruz: hazırlık, akış mimarisi, fiyatlama mantığı, onay mekanizması, belge üretimi, yapay zekânın doğru kullanımı, maliyet ve ölçümleme.

## Teklif süreci neden otomasyona en uygun alanlardan biri?

Teklif süreci, otomasyon için ideal üç özelliği aynı anda taşır: **tekrarlı**, **kurala dayalı** ve **gelire doğrudan bağlı** olması.

- **Tekrarlıdır:** Her teklifte aynı adımlar uygulanır: müşteri bilgisi, ürün kalemleri, fiyat, indirim, koşullar, geçerlilik süresi, gönderim ve takip.
- **Kurala dayalıdır:** "Yüzde 10'un üzerindeki indirimler satış müdürü onayı gerektirir", "Yıllık ödemede iki ay ücretsiz verilir" gibi kurallar çoğu şirkette zaten vardır. Ancak çoğu zaman yazılı değildir, kişilerin kafasındadır.
- **Gelire doğrudan bağlıdır:** Teklifin bir gün geç gitmesi, rakibin önce davranmasına yol açabilir. Yanlış hesaplanmış bir indirim de doğrudan kâr marjını eritir.

Elle yürütülen süreçte sık karşılaşılan sorunlar bellidir: eski fiyat listesinden teklif gitmesi, müşteri adının bir önceki tekliften kalması, onay beklerken fırsatın soğuması, gönderilen tekliflerin takip edilmemesi ve hangi teklifin hangi versiyonda olduğunun bilinmemesi. n8n bu sorunların her birini ayrı bir düğüm (node) ile ele almanıza imkân tanır.

## n8n ile otomatik teklif akışı nasıl çalışır?

Akışı kurmadan önce büyük resmi görmek faydalıdır. Tipik bir B2B teklif otomasyonu şu katmanlardan oluşur:

1. **Tetikleyici:** CRM'de fırsatın "Teklif Hazırlanacak" aşamasına taşınması ya da bir formun doldurulması.
2. **Veri toplama:** Şirket, ilgili kişi, ürün kalemleri, adet, sözleşme süresi ve ödeme tipi bilgilerinin CRM'den çekilmesi.
3. **Doğrulama:** Eksik alan kontrolü. Örneğin vergi numarası ya da fatura adresi yoksa akış durur ve temsilciye bildirim gider.
4. **Fiyatlama motoru:** Güncel fiyat listesine göre hesaplama, indirim kurallarının uygulanması, vergi ve toplamların bulunması.
5. **Onay katmanı:** Eşik değerleri aşan teklifler için yöneticiye onay talebi.
6. **Belge üretimi:** Şablondan PDF teklif oluşturulması ve versiyon numarasıyla arşivlenmesi.
7. **Gönderim:** Kişiselleştirilmiş e-posta ile teklifin müşteriye iletilmesi.
8. **Takip:** Belirli aralıklarla hatırlatma, açılma ya da yanıt durumuna göre dallanma.
9. **Kapanış:** Kabul edilen tekliflerde CRM aşamasının güncellenmesi, muhasebe ve operasyon ekiplerine devir.

n8n'in bu iş için güçlü yanı, görsel arayüzde bu katmanları birbirine bağlarken gerektiğinde JavaScript ile özel mantık yazabilmenizdir. HubSpot, Pipedrive ve Zoho için hazır entegrasyonları bulunur. Hazır düğümü olmayan sistemlere de HTTP Request düğümüyle API üzerinden bağlanabilirsiniz.

## Başlamadan önce neleri hazırlamalısınız?

Otomasyon projelerinin çoğu teknik nedenlerle değil, süreç belirsizliği nedeniyle tıkanır. n8n'i açmadan önce şu dört başlığı netleştirin.

### 1. Tek ve güncel bir fiyat kaynağı

Fiyatlar üç farklı Excel dosyasında ve iki farklı kişinin bilgisayarında duruyorsa otomasyon yanlış veriyi daha hızlı yaymaktan öteye geçemez. Fiyat listesini tek bir yerde toplayın. Bu yer CRM'in ürün kataloğu (HubSpot Products, Pipedrive Products, Zoho Price Books), bir Google Sheets tablosu ya da Airtable olabilir. Her ürün için en az şu alanlar bulunmalıdır:

- Ürün kodu ve adı
- Birim fiyat ve para birimi
- Fiyatlandırma birimi (kullanıcı başı, aylık, adet vb.)
- Maksimum izinli indirim oranı
- Geçerlilik tarihi

### 2. Yazılı indirim ve onay matrisi

Kimin hangi indirimi onaylayabileceğini tabloya dökün. Örnek bir matris:

- **%0–10 indirim:** Satış temsilcisi kendi yetkisinde verir, onay gerekmez.
- **%10–20 indirim:** Satış müdürü onayı gerekir.
- **%20 üzeri indirim veya özel ödeme koşulu:** Genel müdür ya da finans onayı gerekir.
- **Toplam tutar belirli bir eşiğin üzerindeyse** (örneğin 500.000 TL), indirim olmasa bile finans bilgilendirilir.

Bu oranlar sizin işinize göre değişir. Önemli olan kuralın yazılı ve tartışmasız olmasıdır.

### 3. Standart teklif şablonu

Kapak sayfası, müşteri bilgileri, kalem tablosu, toplamlar, ödeme koşulları, geçerlilik süresi ve imza alanını içeren tek bir şablon hazırlayın. Değişken alanları süslü parantezlerle işaretleyin: `{{firma_adi}}`, `{{teklif_no}}`, `{{gecerlilik_tarihi}}` gibi.

### 4. CRM alanlarının düzeni

Teklif için gereken her bilgi CRM'de belirli bir alanda durmalıdır. "Notlar kısmına yazmıştım" yaklaşımı otomasyonla çalışmaz. Hangi CRM'i kullanacağınıza henüz karar vermediyseniz [HubSpot ve Pipedrive karşılaştırmasını ele aldığımız KOBİ karar rehberi](/blog/hubspot-mi-pipedrive-mi-kobi-karar-rehberi) bu konuda yol gösterecektir.

## Adım adım n8n teklif otomasyonu kurulumu

Aşağıdaki örnekte CRM olarak Pipedrive, belge için Google Docs, onay için Slack ve gönderim için Gmail kullandığımızı varsayıyoruz. Aynı mantık HubSpot, Zoho, Microsoft Teams veya Outlook ile de kurulabilir.

### 1. Tetikleyiciyi kurun

Pipedrive Trigger düğümünü "Deal updated" olayına bağlayın. Ardından bir IF düğümü ekleyerek yalnızca aşama "Teklif Hazırlanacak" olduğunda akışın devam etmesini sağlayın. Böylece fırsatta yapılan her küçük değişiklik akışı tetiklemez.

Alternatif olarak bazı ekipler, temsilcinin bir form doldurmasını tercih eder. n8n'in Form Trigger düğümüyle ürün, adet ve indirim talebini temsilciden alıp geri kalanını CRM'den tamamlayabilirsiniz.

### 2. Verileri toplayın ve doğrulayın

Fırsat ID'si üzerinden şu verileri çekin:

- Fırsata bağlı organizasyon (unvan, vergi dairesi, vergi no, adres)
- İlgili kişi (ad, unvan, e-posta)
- Fırsata eklenmiş ürünler ve adetleri
- Özel alanlar: sözleşme süresi, ödeme tipi, talep edilen indirim

Ardından bir Code düğümüyle zorunlu alanları kontrol edin. Eksik varsa akışı durdurun ve temsilciye Slack üzerinden "Vergi numarası eksik olduğu için teklif oluşturulamadı" gibi net bir mesaj gönderin. Bu tek adım, müşteriye eksik bilgiyle giden teklifleri tamamen önler. CRM verileriniz dağınıksa [yapay zeka ile CRM verilerini otomatik temizleme ve zenginleştirme](/blog/yapay-zeka-ile-crm-verilerini-otomatik-temizleme-ve-zenginlestirme-rehberi) yaklaşımını teklif otomasyonundan önce devreye almanızı öneririz.

### 3. Fiyatlama motorunu yazın

Bu, akışın kalbidir. Fiyat listesini Google Sheets veya CRM kataloğundan çektikten sonra bir Code düğümünde hesaplama yapın. Basitleştirilmiş bir örnek:

```javascript
const kalemler = $json.urunler;
const talepIndirim = $json.indirim_orani || 0;
const yillikOdeme = $json.odeme_tipi === 'yillik';

let araToplam = 0;
const satirlar = kalemler.map(k => {
  const tutar = k.birim_fiyat * k.adet * (k.ay_sayisi || 1);
  araToplam += tutar;
  return { ...k, tutar };
});

let indirim = araToplam * (talepIndirim / 100);
if (yillikOdeme) indirim += araToplam * (2 / 12);

const kdvsiz = araToplam - indirim;
const kdv = kdvsiz * 0.20;
const genelToplam = kdvsiz + kdv;

let onaySeviyesi = 'yok';
if (talepIndirim > 20) onaySeviyesi = 'genel_mudur';
else if (talepIndirim > 10) onaySeviyesi = 'satis_muduru';

return [{ json: { satirlar, araToplam, indirim, kdvsiz, kdv, genelToplam, onaySeviyesi } }];
```

Somut bir örnekle düşünelim: 25 kullanıcılık, kullanıcı başı aylık 400 TL'lik bir yazılım lisansı, 12 aylık sözleşme ve %15 indirim talebi. Ara toplam 25 × 400 × 12 = 120.000 TL olur. %15 indirim 18.000 TL eder, KDV hariç tutar 102.000 TL'ye düşer. İndirim %10'u aştığı için akış otomatik olarak satış müdürü onayına yönlenir. Temsilcinin hesap makinesi açmasına, kuralları hatırlamasına gerek kalmaz.

Gerçek senaryoda KDV oranını, para birimi dönüşümünü ve ürün bazlı maksimum indirim sınırlarını da bu düğüme eklemeniz gerekir.

### 4. Onay akışını kurun

Switch düğümüyle `onaySeviyesi` değerine göre dallanma yapın:

- **Onay gerekmiyorsa:** Doğrudan belge üretimine geçin.
- **Onay gerekiyorsa:** İlgili yöneticiye Slack'te müşteri adı, toplam tutar, indirim oranı ve temsilcinin gerekçesini içeren bir mesaj gönderin. Mesaja "Onayla" ve "Reddet" butonları ekleyin.

n8n'in Wait düğümü, "On Webhook Call" moduyla yöneticinin butona basmasını bekler. Onay gelirse akış devam eder, red gelirse temsilciye gerekçeyle birlikte bildirim gider. Belirli bir süre içinde yanıt gelmezse (örneğin 4 iş saati) yöneticiye hatırlatma, 24 saat sonra da bir üst seviyeye eskalasyon kurgulayabilirsiniz. Ekip içi bildirimleri tasarlarken [n8n ile B2B satış ekibi iletişiminde otomasyon](/blog/n8n-ile-b2b-satis-ekibi-i-letisiminde-otomasyon-verimlilik-rehberi) yazımızdaki kanal ve mesaj yapısı önerilerinden yararlanabilirsiniz.

Onay kayıtlarını, yani kimin, ne zaman, hangi tutarı onayladığını, bir tabloya ya da CRM notuna yazmayı unutmayın. Bu kayıt hem iç denetim hem de ileride indirim politikasını değerlendirmek için değerli bir veri kaynağıdır.

### 5. Teklif belgesini üretin

Belge üretimi için yaygın üç yöntem vardır:

- **Google Docs şablonu:** Şablonu kopyalayın, değişkenleri "Replace text" işlemiyle doldurun ve PDF olarak dışa aktarın. Kurulumu en kolay yöntemdir.
- **HTML'den PDF:** Teklifi HTML olarak oluşturup Gotenberg gibi bir PDF dönüştürücü servise gönderin. Tasarım kontrolü daha yüksektir, kalem sayısı değişken tablolar için daha esnektir.
- **Teklif platformları:** PandaDoc veya benzeri araçların API'leri üzerinden belge oluşturup e-imza özelliğini de kullanabilirsiniz.

Her teklife benzersiz bir numara verin. `TKL-2025-0142` gibi bir yapı, fırsat ID'siyle eşleştirildiğinde arşivlemeyi kolaylaştırır. Revizyonlarda `TKL-2025-0142-R2` formatına geçin. PDF'i Google Drive'da müşteri klasörüne kaydedin ve bağlantısını CRM'deki fırsata ekleyin.

### 6. Gönderimi kişiselleştirin

Teklif e-postası şablon gibi görünmemelidir. Gmail veya Outlook düğümüyle gönderim yaparken şu unsurları dinamik hale getirin:

- İlgili kişinin adı ve unvanı
- Görüşmede konuşulan temel ihtiyaç (CRM'deki görüşme notu alanından)
- Teklifin geçerlilik tarihi
- Bir sonraki adım için net bir öneri: "Perşembe günü 15 dakikalık bir değerlendirme görüşmesi yapalım mı?"

E-postanın temsilcinin kendi adresinden gitmesi yanıt oranı açısından önemlidir. n8n'de her temsilci için ayrı kimlik bilgisi tanımlayabilir ya da e-posta servisinizin "farklı göndericiden gönder" özelliğini kullanabilirsiniz.

### 7. Takip ve hatırlatmaları otomatikleştirin

Teklif gönderildikten sonra en çok kaybedilen alan takiptir. Önerilen bir takip ritmi:

1. **Gönderimden 2 iş günü sonra:** Kısa bir kontrol e-postası: "Teklifi inceleme fırsatınız oldu mu?"
2. **5 iş günü sonra:** Yanıt yoksa temsilciye telefonla arama görevi oluşturun.
3. **Geçerlilik bitimine 3 gün kala:** Müşteriye son hatırlatma, temsilciye bildirim.
4. **Geçerlilik dolduğunda:** Fırsatı "Teklif Süresi Doldu" aşamasına taşıyın ve temsilciye karar görevi atayın.

Her adımdan önce CRM'de fırsatın aşamasını kontrol edin. Müşteri bu arada yanıt verdiyse ya da fırsat kazanıldıysa hatırlatma gitmemelidir. Bu kontrol yapılmazsa, sözleşmeyi imzalamış bir müşteriye "Teklifimizi değerlendirdiniz mi?" e-postası gidebilir ve bu ciddi bir güven kaybı yaratır.

### 8. Kabul sonrası devri kurgulayın

Müşteri teklifi kabul ettiğinde akış bitmez. Bu noktada:

- CRM'deki fırsatı "Kazanıldı" olarak işaretleyin.
- Muhasebeye fatura bilgilerini içeren bir görev ya da e-posta gönderin.
- Operasyon veya müşteri başarısı ekibi için onboarding görevi oluşturun.
- Hoş geldin e-postasını planlayın.

Kazanılan müşterinin sorunsuz devri, ilk izlenimi belirleyen en kritik andır. Bu aşamayı genişletmek isterseniz [n8n ile B2B müşteri başarısı süreçlerini otomatikleştirme rehberimize](/blog/n8n-ile-b2b-musteri-basarisi-sureclerini-otomatiklestirme-rehberi) göz atabilirsiniz.

## Yapay zekâyı teklif sürecinde nerede kullanmalı, nerede kullanmamalı?

n8n'in OpenAI, Anthropic ve diğer dil modelleriyle entegrasyonu, teklif sürecine yapay zekâ eklemeyi kolaylaştırır. Ancak her adımda kullanmak doğru değildir.

**Yapay zekânın değer kattığı alanlar:**

- **Görüşme notlarından ihtiyaç özeti çıkarmak:** Temsilcinin dağınık notlarını, teklifin "Anladığımız İhtiyaçlarınız" bölümüne uygun, düzgün paragraflara dönüştürmek.
- **E-posta metnini kişiselleştirmek:** Müşterinin sektörüne ve konuşulan konulara göre giriş paragrafını uyarlamak.
- **Müşteri yanıtını sınıflandırmak:** Gelen yanıtın "olumlu", "fiyat itirazı", "erteleme" ya da "ek bilgi talebi" olduğunu tespit edip doğru dala yönlendirmek.
- **Revizyon taleplerini yorumlamak:** "Kullanıcı sayısını 30'a çıkarıp aylık ödeme istiyoruz" gibi bir yanıttan yapılandırılmış veri çıkarmak.

**Yapay zekânın kullanılmaması gereken alanlar:**

- **Fiyat hesaplama:** Rakamlar her zaman deterministik kodla hesaplanmalıdır. Dil modelleri sayısal işlemlerde hata yapabilir.
- **İndirim kararı:** Onay mantığı yazılı kurallara dayanmalıdır.
- **Hukuki koşullar:** Sözleşme maddeleri onaylı şablondan gelmeli, modele yeniden yazdırılmamalıdır.

Kısacası yapay zekâ metin ve yorumlama tarafında, kod ise rakam ve kural tarafında çalışmalıdır. Model çıktısını müşteriye gitmeden önce temsilcinin görebileceği bir önizleme adımı eklemek, özellikle ilk aylarda iyi bir güvenlik katmanıdır.

## Çok markalı yapılarda teklif otomasyonu nasıl kurgulanır?

Birden fazla markası olan şirketlerde her markanın farklı fiyat listesi, logosu, şablonu ve hatta farklı tüzel kişiliği olabilir. Bu durumda her marka için ayrı bir akış kurmak yerine **tek bir ana akış ve marka bazlı yapılandırma tablosu** kullanmak daha sürdürülebilirdir.

Yapılandırma tablosunda her marka için şu bilgiler tutulur:

- Şablon dosya ID'si
- Fiyat listesi kaynağı
- Onay matrisi ve onaylayıcıların Slack ID'leri
- Gönderici e-posta adresi ve imza
- Tüzel kişilik ve fatura bilgileri

Akış, fırsattaki "marka" alanına göre bu tablodan ilgili satırı okur ve geri kalan adımları aynı mantıkla yürütür. Böylece bir kuralı değiştirmek istediğinizde on ayrı akışı değil, tek bir tabloyu güncellersiniz. Bu yaklaşımın veri tarafını [çok markalı holdinglerde merkezi CRM stratejileri](/blog/cok-markali-holdinglerde-merkezi-crm-stratejileri-veri-butunlugu-rehberi) yazımızda ayrıntılı ele aldık.

## Hangi metrikleri izlemelisiniz?

Otomasyonun işe yarayıp yaramadığını ölçmeden başarısını iddia edemezsiniz. Kurulumdan önce mevcut durumu kaydedin, ardından şu metrikleri düzenli takip edin:

- **Teklif hazırlama süresi:** Fırsatın "Teklif Hazırlanacak" aşamasına geçişinden teklifin gönderilmesine kadar geçen süre.
- **Onay süresi:** Onay talebinin gönderilmesinden yanıt gelmesine kadar geçen süre.
- **Teklif kabul oranı:** Gönderilen tekliflerin yüzde kaçının kazanıldığı.
- **Ortalama indirim oranı:** Temsilci ve marka bazında. Otomasyon sonrası indirim disiplininin artması beklenir.
- **Revizyon sayısı:** Teklif başına ortalama kaç revizyon yapıldığı.
- **Takip uyumu:** Planlanan hatırlatmaların ne kadarının zamanında gerçekleştiği.

Bu verilerin her biri n8n akışının içinde zaten oluşur. Her adımda zaman damgasını bir tabloya yazdığınızda haftalık raporu da ayrı bir n8n akışıyla otomatik üretebilirsiniz. Raporlama altyapısını kurmak için satış pipeline'ınızı veriye dayalı yönetmek istiyorsanız [Sales Corner'ın veri odaklı B2B satış yaklaşımı](https://salescorner.co) da iyi bir başlangıç noktasıdır.

## Maliyeti ne kadar?

n8n'in maliyet yapısı, onu teklif otomasyonu için cazip kılan unsurlardan biridir. Temelde iki seçenek vardır:

- **Self-hosted (kendi sunucunuzda):** n8n'in topluluk sürümü ücretsizdir. Yalnızca sunucu maliyeti ödersiniz. Küçük ve orta ölçekli bir teklif akışı için mütevazı özelliklere sahip bir bulut sunucu genellikle yeterlidir. Ancak kurulum, güncelleme, yedekleme ve güvenlik sorumluluğu sizdedir.
- **n8n Cloud:** Aylık abonelikle çalışır, fiyat çalıştırma (execution) sayısına göre kademelenir. Altyapı yönetimiyle uğraşmak istemeyen ekipler için daha pratiktir. Güncel fiyatları n8n'in resmi sitesinden kontrol etmenizi öneririz.

Bunlara ek olarak hesaba katmanız gereken kalemler:

- Yapay zekâ API kullanımı (teklif başına genellikle düşük bir maliyet)
- PDF dönüştürme veya e-imza servisi kullanıyorsanız abonelik ücreti
- İlk kurulum ve süreç tasarımı için harcanacak iç ekip zamanı ya da danışmanlık bedeli

Yatırım getirisini hesaplamak için basit bir yöntem: Ayda kaç teklif hazırladığınızı, teklif başına harcanan ortalama süreyi ve temsilcinin saatlik maliyetini çarpın. Örneğin ayda 60 teklif hazırlayan ve her birine ortalama 1,5 saat harcayan bir ekip, ayda yaklaşık 90 saatini teklif hazırlığına ayırıyor demektir. Bu sürenin büyük kısmı otomasyonla serbest kaldığında temsilciler o zamanı satış görüşmelerine aktarabilir. Hız ve doğruluktan gelen dolaylı kazanç ise bu hesabın üzerine eklenir.

## En sık yapılan hatalar nelerdir?

Teklif otomasyonu kuran ekiplerin sık düştüğü tuzaklar şunlardır:

1. **Süreci netleştirmeden otomatikleştirmek:** Yazılı olmayan bir onay kuralını koda dökemezsiniz. Önce süreci kâğıt üzerinde çizin.
2. **Hata yönetimini atlamak:** API bağlantısı koptuğunda ya da bir alan boş geldiğinde ne olacağını tanımlayın. n8n'in Error Trigger düğümüyle başarısız çalıştırmaları anında bir Slack kanalına bildirin.
3. **Temsilciyi devre dışı bırakmak:** Teklifin temsilcinin bilgisi olmadan gitmesi güven sorununa yol açar. En azından ilk dönemde "gönderime hazır, onaylıyor musun?" adımı ekleyin.
4. **Tek seferde her şeyi kurmaya çalışmak:** Önce tetikleyici, hesaplama ve belge üretimiyle başlayın. Onay, takip ve yapay zekâ katmanlarını ikinci ve üçüncü haftada ekleyin.
5. **Fiyat listesi güncellemesini unutmak:** Fiyat kaynağının sahibi ve güncelleme sıklığı belli olmalıdır. Aksi halde otomasyon, eski fiyatı kusursuz bir şekilde müşterilere gönderir.
6. **Test ortamı kullanmamak:** Akışları önce test fırsatları ve iç e-posta adresleriyle deneyin. Gerçek müşteriye hatalı teklif gitmesi, otomasyona olan güveni bir anda sarsar.

## Sık sorulan sorular

### n8n ile teklif otomasyonu kurmak için yazılım bilgisi gerekir mi?

Temel akışlar görsel arayüzle, kod yazmadan kurulabilir. Ancak fiyatlama motoru ve veri doğrulama gibi adımlarda basit JavaScript bilgisi büyük kolaylık sağlar. Teknik ekibi olmayan şirketler genellikle ilk kurulumu bir uzmanla yapıp bakımını iç ekibe devreder.

### Hangi CRM'lerle çalışır?

n8n'in HubSpot, Pipedrive, Zoho CRM ve Salesforce için hazır düğümleri bulunur. Hazır düğümü olmayan sistemlere de API üzerinden HTTP Request düğümüyle bağlanılabilir. Bu sayede yerli ERP veya muhasebe yazılımlarıyla da entegrasyon kurulabilir.

### Teklif otomasyonunu kurmak ne kadar sürer?

Fiyat listesi, şablon ve onay kuralları hazırsa temel bir akış birkaç gün içinde çalışır hale gelebilir. Onay, takip, yapay zekâ ve çok markalı yapı gibi katmanlarla birlikte uçtan uca bir sistem genellikle birkaç haftalık kademeli bir çalışma gerektirir. Süreyi en çok etkileyen faktör, teknik kurulumdan çok sürecin ne kadar net tanımlandığıdır.

### Müşteri verilerinin güvenliği nasıl sağlanır?

Self-hosted kurulumda veriler kendi sunucunuzda kalır, bu da KVKK uyumu açısından kontrolü artırır. Kimlik bilgilerini n8n'in şifreli credential yapısında saklamak, erişimi rol bazlı sınırlamak ve yapay zekâ servislerine yalnızca gerekli minimum veriyi göndermek temel güvenlik önlemleridir.

## Sonuç

B2B teklif süreci, otomasyonun en hızlı ve en ölçülebilir geri dönüş sağladığı alanlardan biridir. n8n ile CRM'den veri çekmek, fiyat ve indirim kurallarını tutarlı biçimde uygulamak, onayları hızlandırmak, belgeyi saniyeler içinde üretmek ve takibi hiç aksatmadan yürütmek mümkündür. Başarının anahtarı teknik araçtan çok sürecin kendisidir: tek bir fiyat kaynağı, yazılı bir onay matrisi ve standart bir şablonla başlayan ekipler, otomasyonun faydasını ilk haftalarda görmeye başlar.

Teklif sürecinizi uçtan uca otomatikleştirmek, CRM'inizle entegre bir n8n akışı kurmak ya da çok markalı yapınıza uygun bir mimari tasarlamak istiyorsanız Corner Group ekibi olarak yardımcı olmaya hazırız. Mevcut sürecinizi birlikte değerlendirmek için [iletişim sayfamızdan](/iletisim) bize ulaşabilirsiniz.
