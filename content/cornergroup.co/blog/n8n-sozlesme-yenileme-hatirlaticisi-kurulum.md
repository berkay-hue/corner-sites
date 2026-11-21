---
title: "n8n ile Sözleşme Yenileme Hatırlatıcısı: Adım Adım Kurulum"
description: "B2B şirketlerde sözleşme yenileme tarihlerini kaçırmamak için n8n ile otomatik hatırlatma, sahip atama ve takip akışı nasıl kurulur, anlatıyoruz."
date: "2026-10-30"
category: "Otomasyon"
image: "https://images.pexels.com/photos/8730969/pexels-photo-8730969.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "n8n ile Sözleşme Yenileme Hatırlatıcısı: Adım Adım Kurulum"
alt: "n8n-contract-renewal-reminder"
---

n8n ile sözleşme yenileme hatırlatıcısı kurmak için CRM'inizdeki ya da tablonuzdaki sözleşme bitiş tarihlerini her gün okuyan, kalan gün sayısını hesaplayan ve belirlediğiniz eşiklerde (örneğin 90, 60, 30 ve 7 gün kala) ilgili hesap yöneticisine, müşteriye ve gerekirse yöneticiye otomatik bildirim gönderen bir iş akışı oluşturursunuz. Bu akışın temel bileşenleri bir **Schedule Trigger**, bir veri kaynağı düğümü (HubSpot, Pipedrive, Zoho veya Google Sheets), tarih hesaplaması yapan bir **Code** düğümü, eşiklere göre dallanan bir **Switch** düğümü ve bildirim kanallarıdır (Slack, e-posta, CRM görevi). Doğru kurulduğunda tek bir yenileme tarihi bile gözden kaçmaz ve yenileme görüşmeleri son haftaya sıkışmak yerine aylar öncesinden planlanır.

B2B şirketlerinde gelirin önemli bir kısmı mevcut müşterilerden gelir. Buna rağmen yenileme süreçleri çoğu ekipte hâlâ hesap yöneticisinin hafızasına, takvime düşülmüş dağınık notlara ya da ayda bir güncellenen bir Excel dosyasına emanet edilir. Bu yazıda, sözleşme yenileme hatırlatıcısını n8n üzerinde sıfırdan nasıl kuracağınızı, hangi düğümleri hangi sırayla kullanacağınızı, yapay zekâyı nasıl devreye alacağınızı ve sık yapılan hatalardan nasıl kaçınacağınızı adım adım anlatıyoruz.

## Sözleşme yenileme hatırlatıcısına neden ihtiyacınız var?

Yenileme süreçleri genellikle sessizce bozulur. Sözleşme bitiş tarihi yaklaşır, hesap yöneticisi yeni satış fırsatlarıyla meşguldür, müşteri tarafındaki karar verici değişmiştir ve kimse bunu fark etmez. Sözleşmenin bitmesine bir hafta kala yapılan aceleci bir arama, müşteriye "sizi ancak ödeme zamanı hatırlıyoruz" mesajı verir.

Otomatik bir hatırlatıcı şu sorunları çözer:

- **Görünürlük eksikliği:** Önümüzdeki 90 gün içinde hangi sözleşmelerin biteceğini herkes aynı anda görür.
- **Geç kalınmış görüşmeler:** Yenileme konuşması, müşterinin bütçe planlama döneminden önce başlar.
- **Fiyat güncellemesi fırsatı:** Fiyat artışı veya paket yükseltme önerisi için yeterli zaman kalır.
- **Otomatik yenileme riskleri:** Sözleşmede fesih bildirim süresi varsa (örneğin 30 gün öncesinden yazılı bildirim), bu tarih de takip edilir.
- **Sorumluluk netliği:** Her yenileme bir kişiye atanır, kimin ne yapacağı bellidir.

Özellikle abonelik modeliyle çalışan SaaS şirketlerinde, ajanslarda ve yıllık hizmet sözleşmesi yapan danışmanlık firmalarında bu otomasyon, kurulumu en kısa sürede kendini amorti eden iş akışlarından biridir.

## İş akışının mimarisi nasıl görünür?

Kuruluma geçmeden önce akışın genel resmini netleştirelim. Önerdiğimiz yapı yedi katmandan oluşur:

1. **Tetikleyici:** Her iş günü sabah 08:30'da çalışan bir Schedule Trigger.
2. **Veri çekme:** CRM'den aktif sözleşmelerin listesini alan düğüm.
3. **Hesaplama:** Her sözleşme için kalan gün sayısını ve hangi eşiğe denk geldiğini hesaplayan Code düğümü.
4. **Filtreleme:** Yalnızca bugün bir eşiğe denk gelen kayıtları geçiren IF/Filter düğümü.
5. **Dallanma:** Eşiğe ve sözleşme değerine göre farklı aksiyonlara yönlendiren Switch düğümü.
6. **Aksiyonlar:** Slack bildirimi, CRM görevi, müşteriye e-posta, yöneticiye eskalasyon.
7. **Kayıt ve hata yönetimi:** Gönderilen hatırlatmaların loglanması ve hata durumunda uyarı.

Bu mimari, tek bir sözleşme için de, beş yüz sözleşme için de aynı şekilde çalışır. Ölçek büyüdükçe değişen tek şey, veri çekme adımında sayfalama (pagination) ihtiyacıdır.

## Kurulumdan önce neye ihtiyacınız var?

Hazırlık aşaması, kurulumun kendisinden daha kritiktir. Aşağıdaki maddeleri tamamlamadan n8n'i açmayın:

- **Tek bir doğru kaynak:** Sözleşme bitiş tarihleri tek bir yerde tutulmalı. HubSpot kullanıyorsanız deal veya company nesnesinde özel bir alan (örneğin `contract_end_date`) oluşturun. Pipedrive'da deal üzerinde özel tarih alanı, Zoho'da ise Deals veya özel bir Contracts modülü kullanılabilir.
- **Zorunlu alanlar:** Her sözleşme kaydında en az şu bilgiler olmalı: müşteri adı, sözleşme bitiş tarihi, yıllık sözleşme değeri, hesap yöneticisi (owner), müşteri tarafındaki iletişim kişisi ve e-postası, otomatik yenileme olup olmadığı, fesih bildirim süresi (gün).
- **Eşik kararı:** Hangi günlerde hatırlatma gideceğine ekip olarak karar verin. Yaygın bir kurgu 90, 60, 30, 14 ve 7 gündür.
- **Kanal kararı:** İç bildirimler Slack veya Microsoft Teams'e mi, e-postaya mı gidecek? Müşteriye otomatik e-posta gidecek mi, yoksa yalnızca iç ekip mi uyarılacak?
- **n8n ortamı:** n8n Cloud hesabı veya kendi sunucunuzda çalışan (self-hosted) bir kurulum. Saat dilimini (Timezone) mutlaka Europe/Istanbul olarak ayarlayın; aksi halde tetikleyici beklemediğiniz saatlerde çalışır.

CRM'inizde pipeline ve alan yapısı henüz oturmadıysa, önce [HubSpot'ta satış pipeline kurulumunu adım adım anlatan rehberimize](/blog/hubspot-satis-pipeline-kurulumu-adim-adim-rehber) göz atmanızı öneririz. Yenileme otomasyonu, temiz bir CRM yapısının üzerine kurulduğunda gerçek değerini gösterir.

## Adım adım kurulum

Aşağıdaki adımları HubSpot üzerinden anlatıyoruz; Pipedrive, Zoho veya Google Sheets kullanıyorsanız yalnızca veri çekme düğümünü değiştirmeniz yeterli.

### Adım 1: Schedule Trigger'ı yapılandırın

Yeni bir workflow oluşturun ve ilk düğüm olarak **Schedule Trigger** ekleyin.

- **Trigger Interval:** Days
- **Days Between Triggers:** 1
- **Trigger at Hour:** 8
- **Trigger at Minute:** 30

Hafta sonları bildirim göndermek istemiyorsanız, "Custom (Cron)" seçeneğiyle `30 8 * * 1-5` ifadesini kullanabilirsiniz. Bu durumda hafta sonuna denk gelen eşikleri kaçırmamak için 3. adımdaki hesaplamada küçük bir düzeltme yapacağız.

### Adım 2: Sözleşme verisini CRM'den çekin

**HubSpot** düğümünü ekleyin ve şu ayarları yapın:

- **Resource:** Deal
- **Operation:** Search
- **Filter:** `contract_end_date` alanı bugünden büyük **ve** bugünden 91 gün sonrasından küçük olan kayıtlar
- **Properties:** dealname, amount, hubspot_owner_id, contract_end_date, auto_renewal, notice_period_days

Filtreyi doğrudan API tarafında uygulamak önemlidir. Tüm deal'leri çekip n8n içinde filtrelemek hem yavaş çalışır hem de API limitlerinizi gereksiz yere tüketir. Kayıt sayınız yüksekse "Return All" seçeneğini açarak sayfalamayı n8n'in yönetmesini sağlayın.

Google Sheets kullanıyorsanız **Google Sheets** düğümünde "Get Row(s)" operasyonunu seçin ve tablonuzda tarih sütununun tutarlı bir formatta (tercihen YYYY-AA-GG) olduğundan emin olun. Tarih formatı tutarsızlığı, bu tür akışlarda en sık karşılaşılan hata kaynağıdır.

### Adım 3: Kalan gün sayısını hesaplayın

Bir **Code** düğümü ekleyin ve "Run Once for All Items" modunu seçin. n8n'in Code düğümünde Luxon kütüphanesi hazır olarak gelir, bu yüzden tarih hesaplamaları oldukça kolaydır:

```javascript
const thresholds = [90, 60, 30, 14, 7];
const today = DateTime.now().setZone('Europe/Istanbul').startOf('day');
const results = [];

for (const item of $input.all()) {
  const p = item.json.properties || item.json;
  if (!p.contract_end_date) continue;

  const endDate = DateTime.fromISO(p.contract_end_date, { zone: 'Europe/Istanbul' }).startOf('day');
  const daysLeft = Math.round(endDate.diff(today, 'days').days);

  const noticeDays = Number(p.notice_period_days || 0);
  const noticeDeadline = noticeDays > 0 ? daysLeft - noticeDays : null;

  const matchedThreshold = thresholds.find(t => t === daysLeft) || null;

  results.push({
    json: {
      dealId: item.json.id,
      dealName: p.dealname,
      amount: Number(p.amount || 0),
      ownerId: p.hubspot_owner_id,
      endDate: endDate.toFormat('dd.MM.yyyy'),
      daysLeft,
      matchedThreshold,
      autoRenewal: p.auto_renewal === 'true',
      noticeDeadline
    }
  });
}

return results;
```

Bu kod her sözleşme için kalan gün sayısını, denk gelen eşiği ve fesih bildirim süresine kalan günü hesaplar. Hafta sonlarını atlıyorsanız eşleşmeyi `t === daysLeft` yerine bir aralık kontrolüyle yapabilirsiniz: Pazartesi günleri, Cumartesi ve Pazar'a denk gelen eşikleri de yakalamak için `daysLeft` değerinin `t`, `t-1` veya `t-2` olduğu durumları kabul edin. Aynı hatırlatmanın iki kez gitmemesini ise 7. adımdaki kayıt mekanizması garanti eder.

### Adım 4: Yalnızca ilgili kayıtları geçirin

Bir **Filter** düğümü ekleyin ve koşul olarak `matchedThreshold` değerinin boş olmadığını belirleyin. Ek olarak, `noticeDeadline` değeri 0 ile 7 arasında olan kayıtları da geçirmek isteyebilirsiniz; bu, otomatik yenilenen sözleşmelerde müşterinin fesih hakkını kullanabileceği son haftayı yakalamanızı sağlar. Bu tarih, hesap yöneticisinin müşteriyle temas kurması gereken en kritik andır.

Örneğin elinizde önümüzdeki 90 gün içinde biten 40 sözleşme varsa, sıradan bir günde bu filtreden yalnızca 2-4 kayıt geçer. Bildirim yorgunluğunu önleyen şey tam olarak budur.

### Adım 5: Eşiğe ve değere göre dallanın

Bir **Switch** düğümü ekleyin. Her eşik farklı bir aksiyon gerektirir:

- **90 gün:** Hesap yöneticisine Slack bildirimi ve CRM'de "Yenileme hazırlığı" görevi. Müşteri kullanım verisinin incelenmesi, değer özetinin hazırlanması.
- **60 gün:** Müşteriyle yenileme/değerlendirme toplantısı planlanması için görev; isterseniz müşteriye kişiselleştirilmiş bir "yıllık değerlendirme" daveti.
- **30 gün:** Teklifin gönderilmiş olması gereken eşik. Teklif gönderilmediyse yöneticiye bildirim.
- **14 gün:** Teklif hâlâ imzalanmadıysa satış yöneticisine eskalasyon.
- **7 gün:** Kritik uyarı; hem hesap yöneticisine hem yöneticiye, gerekiyorsa finans ekibine bildirim.

Sözleşme değerine göre ikinci bir ayrım yapmak da mantıklıdır. Örneğin yıllık değeri belirli bir eşiğin üzerindeki sözleşmelerde 90 gün kala doğrudan yöneticiyi de bildirime dahil edebilir, düşük değerli sözleşmelerde ise süreci daha hafif tutabilirsiniz. Bunu Switch'ten sonra bir **IF** düğümüyle `amount` alanına bakarak kolayca kurgularsınız.

Yenileme teklifini de otomatikleştirmek istiyorsanız, 30 günlük dalı [n8n ile B2B teklif sürecini otomatikleştirme rehberimizde](/blog/b2b-teklif-sureci-n8n-otomasyon) anlattığımız akışa bağlayabilirsiniz. Böylece teklif taslağı, hesap yöneticisinin önüne hazır gelir.

### Adım 6: Bildirimleri ve görevleri oluşturun

Her dal için gerekli aksiyon düğümlerini ekleyin:

**Slack bildirimi:** **Slack** düğümünde "Send Message" operasyonunu seçin. Hesap yöneticisinin Slack kullanıcı kimliğine ulaşmak için CRM owner ID'si ile Slack ID'sini eşleştiren küçük bir tablo (Google Sheets veya n8n içinde bir Code düğümünde sabit bir nesne) kullanabilirsiniz. Örnek mesaj:

> 🔔 **Acme Teknoloji** sözleşmesi 30 gün sonra (15.07.2025) sona eriyor. Yıllık değer: 120.000 TL. Otomatik yenileme: Hayır. Teklif durumu CRM'de güncellenmemiş görünüyor. Bugün aksiyon alınması öneriliyor.

**CRM görevi:** **HubSpot** düğümünde "Engagement" veya "Task" kaynağını kullanarak ilgili deal'e bağlı, hesap yöneticisine atanmış bir görev oluşturun. Görevin son tarihini, eşiğe göre birkaç gün sonrasına ayarlayın (örneğin 90 günlük eşikte 7 gün sonra).

**Müşteri e-postası (opsiyonel):** **Gmail** veya **Send Email** düğümüyle müşterideki iletişim kişisine e-posta gönderebilirsiniz. Ancak bu adımı ilk haftalarda kapalı tutmanızı, iç bildirimlerin doğru çalıştığından emin olduktan sonra açmanızı öneririz. Müşteriye yanlış tarihli bir yenileme e-postası gitmesi, hiç e-posta gitmemesinden daha zararlıdır.

Ekip içi bildirim kurgusunu daha geniş bir perspektifle ele almak isterseniz, [n8n ile B2B satış ekibi iletişiminde otomasyon rehberimiz](/blog/n8n-ile-b2b-satis-ekibi-i-letisiminde-otomasyon-verimlilik-rehberi) kanal seçimi ve mesaj formatı konusunda pratik örnekler sunuyor.

### Adım 7: Gönderilen hatırlatmaları kaydedin

Aynı hatırlatmanın iki kez gitmesi, hem ekibi hem müşteriyi rahatsız eder. Bunu önlemek için basit bir log tablosu oluşturun. Google Sheets, Airtable ya da n8n'in yerleşik **Data Tables** özelliği bu iş için yeterlidir. Tabloda şu sütunlar bulunsun: dealId, eşik, gönderim tarihi, kanal.

Akışta aksiyonlardan **önce** bu tabloyu kontrol edin: Aynı dealId ve eşik kombinasyonu zaten varsa kaydı atlayın. Aksiyonlardan **sonra** ise yeni satırı ekleyin. n8n'in **Remove Duplicates** düğümünün "önceki çalışmalardaki öğeleri kaldır" seçeneği de bu amaçla kullanılabilir; dealId ile eşiği birleştiren bir anahtar üretip bu anahtara göre tekilleştirme yapabilirsiniz.

### Adım 8: Hata yönetimini kurun

Otomasyonların en tehlikeli hali, sessizce çalışmayı bırakmalarıdır. CRM API anahtarınızın süresi dolduğunda ya da bir alan adı değiştiğinde akış hata verir ve kimse fark etmeyebilir.

Ayrı bir workflow oluşturun ve ilk düğüm olarak **Error Trigger** ekleyin. Bu workflow'u ana akışın ayarlarındaki "Error Workflow" alanına bağlayın. Hata oluştuğunda operasyon sorumlusuna Slack veya e-posta ile bildirim gitsin. Ayrıca haftada bir, "bu hafta X hatırlatma gönderildi" şeklinde bir özet mesajı göndermek, akışın canlı olduğunu herkese gösterir.

## Hangi zamanlama kurgusu en iyi sonucu verir?

Tek bir doğru cevap yok; doğru kurgu, satış döngünüze ve müşteri profilinize bağlıdır. Yine de genel bir çerçeve çizebiliriz:

- **Yıllık değeri yüksek, kurumsal müşteriler:** 120, 90, 60, 30, 14 gün. Kurumsal müşterilerde satın alma ve hukuk onayları uzun sürer; 30 gün kala başlayan bir yenileme süreci çoğu zaman yetişmez.
- **Orta ölçekli müşteriler:** 90, 60, 30, 7 gün.
- **Aylık veya düşük değerli abonelikler:** 30 ve 7 gün; burada hatırlatmalar daha çok müşteri başarısı ekibinin sorumluluğundadır.

Fesih bildirim süresi olan sözleşmelerde ise asıl kritik tarih, sözleşme bitiş tarihi değil **fesih bildiriminin son günüdür**. Örneğin 30 gün fesih bildirim süresi olan otomatik yenilenen bir sözleşmede, müşteri bitişe 31 gün kala kararını vermiş olmalıdır. Bu nedenle bu tür sözleşmelerde eşikleri bildirim son gününe göre hesaplamak daha doğrudur.

## Yapay zekâ bu akışa nasıl dahil edilir?

Temel hatırlatıcı çalıştıktan sonra, akışı yapay zekâ ile zenginleştirebilirsiniz. n8n'in **AI Agent** veya **OpenAI / Anthropic** düğümleriyle şu senaryoları kurmak mümkündür:

- **Hesap özeti üretme:** 90 günlük eşikte, CRM'deki son notları, destek taleplerini ve toplantı kayıtlarını bir dil modeline göndererek hesap yöneticisine "bu müşteriyle son bir yılda neler oldu" özetini hazırlatın. Yöneticinin hazırlık süresi ciddi oranda kısalır.
- **Kişiselleştirilmiş e-posta taslağı:** 60 günlük eşikte, müşterinin sektörüne ve kullandığı özelliklere göre değerlendirme toplantısı davet e-postasının taslağını oluşturun. Taslak doğrudan gönderilmez; hesap yöneticisinin onayına sunulur.
- **Risk sinyali çıkarma:** Son destek taleplerinin tonunu analiz ederek "bu müşteri memnuniyetsiz görünüyor" uyarısını bildirime ekleyin.

Risk sinyalleri konusunu daha derinlemesine ele almak isterseniz, [n8n ile B2B CRM'de riskli müşteri tespiti otomasyonu](/blog/n8n-ile-b2b-crm-de-riskli-musteri-tespiti-otomasyonu) yazımızdaki skorlama yaklaşımını yenileme hatırlatıcınızla birleştirebilirsiniz. Riskli olarak işaretlenen bir müşterinin yenileme hatırlatması, normal bir müşteriye göre daha erken ve daha üst seviyede bir kişiye gitmelidir.

Yapay zekâ kullanırken dikkat edilmesi gereken iki nokta var: Müşteri verilerini hangi modele gönderdiğinizi KVKK açısından değerlendirin ve yapay zekânın ürettiği hiçbir metni insan onayı olmadan müşteriye göndermeyin.

## Maliyeti ne kadar?

Bu otomasyonun maliyeti üç kalemden oluşur:

- **n8n lisansı:** Kendi sunucunuzda çalışan Community Edition'ı ücretsiz kullanabilirsiniz; yalnızca sunucu maliyetini (küçük bir bulut sunucusu yeterlidir) ödersiniz. n8n Cloud'da ise planlar aylık çalıştırma (execution) sayısına göre fiyatlandırılır. Günde bir kez çalışan bu akış, ayda yaklaşık 22-30 çalıştırma tüketir; yani en giriş seviyesindeki planlar bile bu iş akışı için fazlasıyla yeterlidir.
- **Yapay zekâ API maliyeti:** Yalnızca eşiğe denk gelen sözleşmeler için model çağrısı yapıldığından, aylık kullanım genellikle düşük kalır. Günde ortalama 3 kayıt için birer özet üretilmesi, ayda yaklaşık 60-90 model çağrısı demektir.
- **Kurulum zamanı:** CRM verisi temizse, deneyimli bir kişi temel akışı bir iş gününde kurup test edebilir. Yapay zekâ katmanı, eskalasyon kuralları ve raporlama eklendiğinde bu süre birkaç güne çıkar. Asıl zaman genellikle CRM'deki eksik ve tutarsız tarih alanlarını temizlemeye harcanır.

Karşı tarafta ise kaçırılan tek bir yenileme bile, bu maliyetlerin çok üzerinde bir gelir kaybı anlamına gelebilir.

## En sık yapılan hatalar nelerdir?

Sahada en sık gördüğümüz hatalar şunlar:

1. **Saat dilimi hatası:** n8n sunucusu UTC'de çalışırken tarih hesaplamasının Türkiye saatine göre yapılmaması, gece yarısına yakın kayıtlarda bir günlük kaymaya yol açar.
2. **Boş tarih alanları:** Bitiş tarihi girilmemiş sözleşmeler akıştan sessizce düşer. Haftalık bir kontrolle "tarihi boş olan aktif müşteriler" listesini hesap yöneticilerine göndermek bu sorunu çözer.
3. **Bildirim yorgunluğu:** Her gün "önümüzdeki 90 günde biten 40 sözleşme var" mesajı göndermek, ekibin birkaç hafta içinde bildirimleri görmezden gelmesine neden olur. Yalnızca eşik günlerinde, yalnızca ilgili kişiye bildirim gönderin.
4. **Yenilenen sözleşmenin tarihinin güncellenmemesi:** Müşteri yenilediğinde yeni bitiş tarihi CRM'e girilmezse akış eski tarihe göre hatırlatma göndermeye devam eder. Deal "Kazanıldı" aşamasına geçtiğinde bitiş tarihini otomatik olarak bir yıl ileri taşıyan ikinci küçük bir akış kurmak bu riski ortadan kaldırır.
5. **Sahipsiz kayıtlar:** Hesap yöneticisi şirketten ayrıldığında kayıtları sahipsiz kalır. Owner alanı boş veya pasif bir kullanıcıya ait kayıtların bildirimini otomatik olarak satış yöneticisine yönlendirin.

## Başarıyı nasıl ölçersiniz?

Otomasyonu kurduktan sonra etkisini ölçmek için şu metrikleri takip edin:

- **Zamanında başlatılan yenileme oranı:** 60 gün kala değerlendirme toplantısı yapılmış sözleşmelerin oranı.
- **Brüt ve net gelir tutma oranı (GRR / NRR):** Yenilemelerin ve paket yükseltmelerin gelir üzerindeki etkisi.
- **Son haftaya kalan yenileme sayısı:** Bu sayının giderek azalması, sürecin oturduğunu gösterir.
- **Yenilemede fiyat güncelleme oranı:** Erken başlayan görüşmeler, fiyat güncellemesini konuşmak için daha uygun bir zemin oluşturur. Fiyatlandırma tarafını güçlendirmek için değer bazlı fiyatlandırma yaklaşımlarını da gözden geçirmeye değer.

Bu metrikleri aylık olarak bir Slack kanalına ya da yönetim panosuna otomatik raporlamak da yine n8n ile yapılabilir. Yenileme sürecinin genel müşteri başarısı stratejisi içindeki yerini görmek için [n8n ile B2B müşteri başarısı süreçlerini otomatikleştirme rehberimiz](/blog/n8n-ile-b2b-musteri-basarisi-sureclerini-otomatiklestirme-rehberi) iyi bir tamamlayıcı kaynak olacaktır.

Yenileme süreçlerini yeni müşteri kazanımıyla birlikte veri odaklı bir satış operasyonunun parçası haline getirmek istiyorsanız, grubumuzun [veri odaklı B2B satış ve lead generation hizmeti veren Sales Corner](https://salescorner.co) ekibi pipeline yönetimi ve satış metodolojileri konusunda destek sağlıyor.

## Sık sorulan sorular

### n8n ile sözleşme yenileme hatırlatıcısı kurmak için kodlama bilgisi gerekir mi?

Temel akış büyük ölçüde sürükle-bırak düğümlerle kurulabilir. Tarih hesaplaması için kısa bir Code düğümü kullanmak işi kolaylaştırır, ancak aynı hesaplama n8n'in Date & Time düğümü ve ifadeleriyle de yapılabilir. Yapay zekâ katmanı ve özel eskalasyon kuralları eklendikçe JavaScript bilgisi avantaj sağlar.

### Hangi CRM'lerle çalışır?

n8n'in HubSpot, Pipedrive, Zoho CRM, Salesforce ve Google Sheets için hazır düğümleri vardır. Hazır düğümü olmayan bir sistem kullanıyorsanız, API'si olduğu sürece HTTP Request düğümüyle veriye erişebilirsiniz. Önemli olan, sözleşme bitiş tarihinin bu sistemde tutarlı bir alanda tutulmasıdır.

### Müşteriye otomatik yenileme e-postası göndermek doğru mu?

Düşük değerli ve standart sözleşmelerde otomatik bilgilendirme e-postaları işe yarayabilir. Yüksek değerli ve kurumsal müşterilerde ise e-postanın hesap yöneticisinin adına, onun onayıyla gitmesi daha doğrudur. Başlangıçta yalnızca iç bildirimleri açıp, akış güvenilir hale geldikten sonra müşteri e-postalarını devreye almanızı öneririz.

### Aynı hatırlatmanın birden fazla kez gitmesini nasıl engellerim?

Gönderilen her hatırlatmayı sözleşme kimliği ve eşik bilgisiyle bir log tablosuna kaydedin ve aksiyon öncesinde bu tabloyu kontrol edin. n8n'in Remove Duplicates düğümü de önceki çalıştırmalarda işlenmiş kayıtları ayıklamak için kullanılabilir. Bu kontrol, özellikle akışı manuel olarak tekrar çalıştırdığınız durumlarda hayat kurtarır.

## Sonuç

Sözleşme yenileme hatırlatıcısı, n8n ile kurabileceğiniz en sade ama gelir üzerindeki etkisi en doğrudan otomasyonlardan biridir. Günlük bir tetikleyici, temiz bir tarih alanı, kalan gün hesaplaması, eşik bazlı dallanma ve doğru kişiye giden bildirimler; bu beş bileşen bir araya geldiğinde yenileme süreci kişilerin hafızasına bağlı olmaktan çıkar ve öngörülebilir bir operasyona dönüşür. Üzerine eklenecek yapay zekâ destekli hesap özetleri, risk sinyalleri ve otomatik raporlama ise ekibinizin yenileme görüşmelerine çok daha hazırlıklı girmesini sağlar.

CRM yapınıza uygun bir yenileme otomasyonu kurmak, mevcut iş akışlarınızı n8n ile birbirine bağlamak ya da satış ve müşteri başarısı süreçlerinizi uçtan uca otomatikleştirmek istiyorsanız, [Corner Group ekibiyle iletişime geçin](/iletisim); ihtiyacınıza özel kurguyu birlikte tasarlayalım.
