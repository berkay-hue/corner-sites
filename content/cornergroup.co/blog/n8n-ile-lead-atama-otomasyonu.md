---
title: "n8n ile Lead Atama Otomasyonu: Round-Robin Kurulumu"
description: "Gelen potansiyel müşterileri satış temsilcilerine n8n ile otomatik ve adil dağıtmanın adımlarını, kurallarını ve yaygın hatalarını Türkçe anlatıyoruz."
date: "2026-10-15"
category: "Otomasyon"
image: "https://images.pexels.com/photos/7988674/pexels-photo-7988674.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "n8n ile Lead Atama Otomasyonu: Round-Robin Kurulumu"
alt: "n8n-round-robin-lead-assignment"
---

Inbound formdan, LinkedIn kampanyasından ya da outbound dizisinden gelen her yeni lead, satış ekibiniz için bir fırsattır. Ancak bu fırsatın kime ve ne kadar hızlı ulaştığı, sonucu doğrudan belirler. Birçok B2B şirkette lead atama hâlâ elle yapılır. Bir satış müdürü CRM'e bakar, "Bu Ahmet'e gitsin, şu Zeynep'e" der ve süreç onun takvimine bağlı kalır. Müdür toplantıdaysa lead saatlerce sahipsiz bekler. Bazı temsilciler fazla yüklenirken bazıları boş kalır. Ekipte "iyi lead'ler hep aynı kişiye gidiyor" algısı da zamanla oluşur.

Round-robin lead atama bu sorunların en yalın çözümüdür: gelen lead'ler, önceden tanımlanmış bir sıraya göre temsilciler arasında dönüşümlü dağıtılır. n8n bu mantığı CRM'inizden, form aracınızdan ve iletişim kanallarınızdan bağımsız biçimde kurmanıza imkân tanır. Bu yazıda n8n ile round-robin lead atama otomasyonunu adım adım kuracağız. Basit sıralı dağıtımdan ağırlıklı ve kapasite bazlı modellere, eşzamanlılık sorunlarından çok markalı yapılara kadar tüm katmanları ele alacağız.

## Round-Robin Lead Atama Neden Önemli?

Round-robin ilk bakışta sıradan bir "sırayla dağıt" kuralı gibi görünür. Satış operasyonundaki etkisi ise düşündüğünüzden daha geniştir.

- **Yanıt hızı:** Lead sahibi anında belli olduğu için ilk temas gecikmez. B2B satışta ilk dönüşü yapan taraf çoğu zaman görüşmeyi de yönlendirir.
- **Adil iş yükü:** Her temsilci benzer sayıda lead alır. Performans karşılaştırması da daha anlamlı hâle gelir.
- **Şeffaflık:** Atama kuralı yazılı ve otomatiktir. "Neden bu lead ona gitti?" sorusunun cevabı loglarda durur.
- **Yöneticinin zamanı:** Satış müdürü günde onlarca atama kararı vermek yerine koçluğa ve pipeline yönetimine odaklanır.
- **Ölçeklenebilirlik:** Ekibe yeni bir temsilci katıldığında yapmanız gereken tek şey listeye bir satır eklemektir.

Elbette her lead aynı değerde değildir. Bu yüzden iyi bir round-robin sistemi genellikle tek başına çalışmaz. Önceden yapılan bir puanlama ya da segmentasyonla birlikte çalışır. Lead'lerinizi önce [AI ile B2B lead skorlama](/blog/ai-ile-b2b-lead-skorlama-potansiyel-musteri-degerini-artirma-rehberi) yaklaşımıyla sınıflandırıp ardından her segment için ayrı bir dağıtım havuzu kullanmak, hem adaleti hem de verimi korur.

## Round-Robin Modelleri: Hangisi Size Uygun?

Kuruluma geçmeden önce hangi modeli uygulayacağınıza karar vermeniz gerekir. n8n dördünü de destekler. Aradaki fark, kullandığınız veri yapısı ve hesaplama mantığıdır.

### 1. Basit (Sıralı) Round-Robin

Temsilciler bir listede sıralanır ve her yeni lead bir sonraki kişiye gider. Dört kişilik bir ekipte sıra A → B → C → D → A şeklinde ilerler. Kurulumu en kolay modeldir. Ekipteki herkes benzer kıdemde ve benzer kapasitedeyse idealdir.

### 2. Ağırlıklı Round-Robin

Her temsilciye bir ağırlık verilir. Örneğin kıdemli bir hesap yöneticisi 3, orta seviye bir temsilci 2, yeni başlayan biri 1 ağırlığa sahip olabilir. Bu durumda her 6 lead'lik döngüde dağıtım 3-2-1 olur. Yeni işe alınan temsilcileri kademeli olarak yüklemek için oldukça kullanışlıdır.

### 3. Kapasite ve Uygunluk Bazlı Round-Robin

Sıra yine döner, ancak atama öncesinde birkaç kontrol yapılır: Temsilci izinde mi? Mesai saatinde mi? Açık lead sayısı belirlediğiniz sınırı (örneğin 25) aştı mı? Kriterleri karşılamayan temsilci o tur için atlanır. Gerçek hayatta en sağlıklı sonucu veren model genellikle budur.

### 4. Bölge veya Segment Bazlı Round-Robin

Lead'ler önce bir kurala göre havuzlara ayrılır. Bu kural ülke, şehir, sektör, şirket büyüklüğü ya da ürün olabilir. Ardından her havuz kendi içinde round-robin ile dağıtılır. Örneğin 200 çalışan üzeri şirketler "Enterprise" havuzuna, altındakiler "SMB" havuzuna gider ve her havuzun kendi sırası vardır.

Pratikte çoğu şirket bunların bir kombinasyonunu kullanır: **segment bazlı havuzlar + her havuzda kapasite kontrollü, ağırlıklı round-robin.** Bu yazıdaki kurulumu da bu hibrit yapıya genişletilebilecek şekilde tasarlayacağız.

## Mimarinin Genel Görünümü

n8n'de kuracağımız iş akışı şu ana bileşenlerden oluşur:

1. **Tetikleyici:** Yeni lead'in geldiğini haber veren düğüm (Webhook, HubSpot Trigger, Pipedrive Trigger, Typeform vb.)
2. **Veri normalizasyonu:** Farklı kaynaklardan gelen alanları tek bir formata çevirme
3. **Tekilleştirme ve mevcut sahip kontrolü:** Lead ya da şirketi CRM'de zaten var mı, sahibi kim?
4. **Segmentasyon:** Lead hangi havuza ait?
5. **Temsilci listesinin çekilmesi:** Aktif temsilciler, ağırlıkları ve kapasite bilgileri
6. **Sıradaki temsilcinin hesaplanması:** Round-robin mantığının çalıştığı Code düğümü
7. **CRM güncellemesi:** Lead sahibinin atanması
8. **Bildirim:** Temsilciye Slack, Microsoft Teams veya e-posta ile haber verilmesi
9. **Loglama:** Her atamanın kayıt altına alınması
10. **Hata yönetimi ve SLA takibi:** Bir şey ters giderse veya lead'e dokunulmazsa ne olacak?

Şimdi bu adımları tek tek kuralım.

## Adım Adım n8n Round-Robin Kurulumu

### Adım 1: Temsilci Listesini Hazırlayın

Round-robin sisteminin kalbi temsilci listesidir. Bu listeyi n8n içinde sabit kodlamak yerine harici bir kaynakta tutmanızı öneririz. Böylece satış müdürü, otomasyona dokunmadan birini listeden çıkarabilir veya ağırlığını değiştirebilir.

Seçenekler:

- **Google Sheets veya Airtable:** Teknik olmayan ekipler için en kolay seçenek.
- **Postgres / MySQL / Supabase:** Yüksek hacim ve eşzamanlılık için en sağlam seçenek.
- **n8n Data Tables:** Kullandığınız sürümde mevcutsa, harici bir araç gerektirmeyen pratik bir seçenek.

Örnek bir tablo yapısı:

| rep_id | ad | crm_owner_id | havuz | agirlik | aktif | max_acik_lead | slack_id |
|---|---|---|---|---|---|---|---|
| 1 | Ayşe | 101 | SMB | 2 | TRUE | 30 | U01 |
| 2 | Mert | 102 | SMB | 2 | TRUE | 30 | U02 |
| 3 | Deniz | 103 | Enterprise | 3 | TRUE | 15 | U03 |
| 4 | Can | 104 | SMB | 1 | FALSE | 20 | U04 |

Ayrıca her havuz için **son atanan pozisyonu** tutan küçük bir sayaç tablosuna ihtiyacınız olacak:

| havuz | son_index |
|---|---|
| SMB | 7 |
| Enterprise | 2 |

### Adım 2: Tetikleyiciyi Kurun

Lead kaynağınıza göre tetikleyici seçin:

- Web sitesi formları için **Webhook** düğümü. Form aracınız POST isteğini bu adrese gönderir.
- HubSpot kullanıyorsanız **HubSpot Trigger** ile "Contact Created" olayı.
- Pipedrive'da "Added Person" veya "Added Deal" olayları.
- Outbound listelerinden gelen toplu importlar için **Schedule Trigger**. Örneğin her 10 dakikada bir sahibi boş olan kayıtları çeken bir sorgu.

Burada önemli bir tasarım kararı var: **Anlık tetikleme mi, periyodik tarama mı?** Anlık tetikleme hız açısından üstündür. Periyodik tarama ise kaçırılan olaylara karşı bir güvenlik ağı sağlar. En sağlam yapı ikisini birlikte kullanmaktır. Ana akış anlık çalışır, ikinci bir akış da her 30 dakikada bir "sahibi olmayan lead var mı?" diye kontrol eder.

### Adım 3: Veriyi Normalize Edin

Farklı kaynaklar aynı bilgiyi farklı alan adlarıyla gönderir. Biri "company_name", diğeri "Şirket", bir başkası "organization" der. Bir **Set** (Edit Fields) düğümüyle tüm girdileri ortak bir şemaya çevirin:

- `email`
- `ad_soyad`
- `sirket`
- `calisan_sayisi`
- `ulke`
- `kaynak` (form, linkedin, outbound, etkinlik)
- `marka` (çok markalı yapıdaysanız)

E-posta adresini küçük harfe çevirmek ve boşlukları temizlemek bu adımda yapılmalıdır. Aksi halde tekilleştirme kontrolü yanlış sonuç verir.

Lead verisi eksikse, örneğin çalışan sayısı veya sektör bilgisi yoksa, segmentasyon da hatalı olur. Bu nedenle atama akışından önce bir zenginleştirme katmanı eklemek çok faydalıdır. Bu konuyu detaylı olarak [n8n ile B2B lead zenginleştirme otomasyonu](/blog/n8n-ile-b2b-lead-zenginlestirme-otomasyonu-rehberi-verimliligi-artirin) yazımızda anlattık. Outbound tarafında lead listelerinizi [Apollo.io](https://get.apollo.io/679irkzm35ya) gibi bir veri kaynağından çekiyorsanız, şirket büyüklüğü ve sektör alanları genellikle hazır gelir ve segmentasyon çok daha isabetli olur.

### Adım 4: Tekilleştirme ve Mevcut Sahip Kontrolü

Round-robin'in en sık atlanan kuralı şudur: **Bir şirketin zaten bir sahibi varsa, aynı şirketten gelen yeni kişi de ona gitmeli.** Aksi halde aynı firmaya iki farklı temsilci ulaşır. Bu hem müşteri gözünde profesyonelliği zedeler hem de ekip içinde çatışma yaratır.

Bu adımda:

1. CRM'de e-posta adresiyle kişi araması yapın. Kişi varsa ve sahibi atanmışsa akışı burada sonlandırın veya sadece bilgilendirme gönderin.
2. E-posta alan adından (`@firma.com`) şirket araması yapın. Şirketin sahibi varsa lead'i doğrudan o kişiye atayın ve round-robin sayacını **ilerletmeyin.**
3. Gmail, Hotmail gibi genel e-posta sağlayıcılarını bu kontrolden hariç tutun. Bunun için basit bir liste kullanan bir **IF** düğümü yeterlidir.

### Adım 5: Segmentasyon (Havuz Belirleme)

Bir **Switch** düğümüyle lead'i havuzlara yönlendirin. Örnek kurallar:

- `calisan_sayisi >= 200` → Enterprise
- `ulke` Türkiye dışında → International
- Diğer tüm durumlar → SMB

Lead skorunuz varsa bunu da kural olarak ekleyebilirsiniz. Örneğin skoru 80'in üzerindeki lead'ler kıdemli temsilcilerden oluşan bir "Öncelikli" havuzuna gidebilir.

### Adım 6: Uygun Temsilcileri Filtreleyin

Seçilen havuzdaki temsilcileri tablonuzdan çekin ve şu filtreleri uygulayın:

- `aktif = TRUE`
- O gün izinde değil. İzin takvimini ayrı bir sayfada tutabilir veya Google Calendar'dan "Out of Office" etkinliklerini sorgulayabilirsiniz.
- Mesai saati içinde. Uluslararası ekiplerde temsilcinin saat dilimine göre kontrol edin.
- Açık lead sayısı `max_acik_lead` değerinin altında. Bu bilgiyi CRM'den sahip bazlı bir sorguyla çekebilirsiniz.

Filtre sonrası liste boş kalırsa ne olacağını da önceden tanımlayın. Lead bir "yedek" kişiye, genellikle satış müdürüne veya ekip liderine atanabilir ya da bir kuyrukta bekletilip ilk uygun temsilciye verilebilir.

### Adım 7: Round-Robin Mantığını Code Düğümünde Kurun

Şimdi işin merkezine geliyoruz. Aşağıdaki örnek, ağırlıklı round-robin mantığını uygular. Mantık şöyle işler: Her temsilci, ağırlığı kadar listede tekrar eder ve sayaç bu genişletilmiş liste üzerinde döner.

```javascript
// Girdi: filtrelenmiş temsilciler ve havuzun son_index değeri
const reps = $('Uygun Temsilciler').all().map(i => i.json);
const lastIndex = $('Sayaç Oku').first().json.son_index ?? -1;

// Ağırlığa göre genişletilmiş sıra oluştur
// Ayşe(2), Mert(2), Deniz(1) -> [Ayşe, Mert, Deniz, Ayşe, Mert] gibi dengeli dağılım
const maxWeight = Math.max(...reps.map(r => r.agirlik));
const queue = [];
for (let round = 0; round < maxWeight; round++) {
  for (const rep of reps) {
    if (rep.agirlik > round) queue.push(rep);
  }
}

if (queue.length === 0) {
  return [{ json: { atanan: null, sebep: 'uygun_temsilci_yok' } }];
}

const nextIndex = (lastIndex + 1) % queue.length;
const selected = queue[nextIndex];

return [{
  json: {
    atanan_rep_id: selected.rep_id,
    atanan_ad: selected.ad,
    crm_owner_id: selected.crm_owner_id,
    slack_id: selected.slack_id,
    yeni_index: nextIndex
  }
}];
```

Burada dikkat edilmesi gereken bir nokta var: Ağırlıkları sırayla iç içe geçirdiğimiz için (Ayşe, Mert, Deniz, Ayşe, Mert…) aynı temsilci art arda lead almaz. Ağırlık 3 olan birini listeye üç kez peş peşe eklemek de mümkündür, ancak bu durumda kısa vadede "yığılma" hissi oluşur.

Bir diğer önemli nokta: Temsilci listesi değiştiğinde (biri izne çıktığında veya kapasitesi dolduğunda) kuyruk uzunluğu da değişir. Modüler aritmetik sayesinde sistem çökmez, ancak kısa süreli küçük dengesizlikler olabilir. Haftalık raporlamayla bunu takip etmek yeterlidir.

### Adım 8: Sayacı Güvenli Biçimde Güncelleyin

Round-robin otomasyonlarında en sık karşılaşılan teknik sorun **yarış durumu (race condition)** sorunudur. Aynı saniyede iki lead geldiğinde iki ayrı yürütme aynı `son_index` değerini okur ve iki lead aynı temsilciye gider.

Çözüm seçenekleri:

- **Veritabanında atomik güncelleme:** Postgres kullanıyorsanız sayacı tek bir sorguyla okuyup artırabilirsiniz: `UPDATE rr_sayac SET son_index = son_index + 1 WHERE havuz = 'SMB' RETURNING son_index;` Bu sorgu, eşzamanlı isteklerde bile her yürütmeye farklı bir değer döndürür. Modül işlemini ardından Code düğümünde yaparsınız. Yüksek hacimli ekipler için en güvenilir yöntem budur.
- **Kuyruk yaklaşımı:** Webhook lead'i doğrudan işlemek yerine bir tabloya yazar. Ayrı bir akış her dakika bu tabloyu sırayla işler. Böylece atamalar seri hâle gelir.
- **n8n workflow static data:** Küçük hacimlerde `$getWorkflowStaticData('global')` ile sayaç tutulabilir. Ancak bu veri yalnızca aktif (production) yürütmelerde kalıcıdır ve eşzamanlılığa karşı koruma sağlamaz. Test ortamı veya düşük hacim için uygundur.
- **Google Sheets:** Kolaydır, ancak eşzamanlılık koruması yoktur. Günde birkaç düzine lead'in ötesine geçiyorsanız veritabanına taşınmayı düşünün.

### Adım 9: CRM'de Sahibi Atayın

Seçilen temsilcinin `crm_owner_id` değerini kullanarak ilgili CRM düğümüyle güncelleme yapın:

- **HubSpot:** Contact veya Deal kaydında `hubspot_owner_id` alanını güncelleyin.
- **Pipedrive:** Person veya Deal kaydında `owner_id` alanını güncelleyin.
- **Zoho CRM:** Lead kaydında `Owner` alanını güncelleyin.

Atamayla birlikte bir görev (task) oluşturmak da iyi bir pratiktir. Örneğin "İlk temas – 2 saat içinde" başlıklı ve vade tarihi atanmış bir görev, temsilcinin günlük iş listesine otomatik olarak düşer. Pipeline aşamalarınız henüz net değilse, atama sonrası lead'in hangi aşamaya gireceğini belirlemek için [HubSpot'ta satış pipeline kurulumu](/blog/hubspot-satis-pipeline-kurulumu-adim-adim-rehber) rehberimize göz atabilirsiniz.

### Adım 10: Temsilciyi Bilgilendirin

Atama yapıldıktan sonra temsilciye anında haber verin. Slack mesajı için örnek bir şablon:

> 🎯 **Yeni lead atandı:** Ahmet Yılmaz – Örnek Teknoloji A.Ş.
> Çalışan sayısı: 120 | Kaynak: Web formu | Havuz: SMB
> Not: "Ekibimiz için CRM entegrasyonu arıyoruz."
> CRM kaydı: [bağlantı]
> Hedef ilk temas süresi: 2 saat

Mesajda lead'in kaynağı, form notu ve varsa skor gibi bağlamı vermek, temsilcinin ilk görüşmeye hazırlıklı girmesini sağlar. Ekip içi bildirim kurgusunu daha geniş ele almak isterseniz [n8n ile B2B satış ekibi iletişiminde otomasyon](/blog/n8n-ile-b2b-satis-ekibi-i-letisiminde-otomasyon-verimlilik-rehberi) yazımızda Slack ve e-posta senaryolarını detaylı anlattık.

### Adım 11: Her Atamayı Loglayın

Ayrı bir log tablosuna şu bilgileri yazın:

- Zaman damgası
- Lead e-postası ve şirketi
- Havuz
- Atanan temsilci
- Atama tipi (round-robin, mevcut şirket sahibi, yedek kişi)
- Kullanılan sayaç değeri

Bu log hem hata ayıklamada hem de aylık dağılım raporlarında hayat kurtarır. "Mert bu ay neden daha az lead aldı?" sorusunun cevabı genellikle loglarda görünür. Belki 5 gün izindeydi, belki kapasite sınırına takıldı.

### Adım 12: SLA Takibi ve Yeniden Atama

Atama işin yarısıdır. Diğer yarısı, atanan lead'e gerçekten dokunulmasıdır. İkinci bir n8n akışı kurun:

1. **Schedule Trigger** ile her 30 dakikada bir çalışsın.
2. Son 24 saat içinde atanmış, ancak üzerinde hiçbir aktivite (arama, e-posta, not) kaydedilmemiş lead'leri CRM'den çeksin.
3. Belirlediğiniz süre aşılmışsa (örneğin mesai içinde 4 saat) temsilciye hatırlatma göndersin.
4. İkinci eşik de aşılırsa (örneğin 8 saat) lead'i round-robin ile bir sonraki temsilciye yeniden atasın ve satış müdürünü bilgilendirsin.

Bu mekanizma, lead'lerin CRM'de unutulmasını engeller. Aynı zamanda ekipte doğal bir hız disiplini oluşturur.

## Hata Yönetimi: Sistem Sessizce Çökmesin

Otomasyonların en tehlikeli hali, hata verip kimseye haber vermeden durmasıdır. Şu önlemleri mutlaka alın:

- **Error Trigger akışı:** n8n'de ayrı bir hata akışı oluşturun ve ana akışın ayarlarından bu akışı "Error Workflow" olarak seçin. Herhangi bir düğüm hata verdiğinde operasyon kanalına bildirim gitsin.
- **Retry ayarları:** CRM API çağrılarında "Retry On Fail" seçeneğini açın, örneğin 3 deneme ve 5 saniye bekleme. Geçici API kesintileri çoğu zaman bu şekilde tolere edilir.
- **Rate limit:** Toplu importlarda CRM API limitlerine takılmamak için **Loop Over Items** ve **Wait** düğümleriyle istekleri yavaşlatın.
- **Varsayılan sahip:** Her ne olursa olsun lead sahipsiz kalmamalı. Akış hata verirse lead'i ekip liderine atayan bir yedek dal kurun.

## Çok Markalı Yapılarda Round-Robin

Birden fazla marka veya iş birimi yöneten şirketlerde lead atama bir katman daha karmaşıklaşır. Aynı web altyapısından gelen bir lead, ilgilendiği hizmete göre farklı bir markanın satış ekibine gitmelidir. Corner Group çatısı altında da benzer bir yapı vardır. Outbound satış talebi [B2B SaaS şirketleri için outbound ve lead generation hizmeti sunan SAAS Corner](https://saascorner.co) ekibine, satış süreci ve pipeline danışmanlığı talebi ise [veri odaklı B2B satış yaklaşımıyla çalışan Sales Corner](https://salescorner.co) ekibine yönlendirilir.

Bu tür yapılarda önerdiğimiz kurgu şudur:

1. **Marka belirleme:** Form alanı, UTM parametresi veya landing page URL'sinden lead'in hangi markaya ait olduğunu tespit edin.
2. **Marka bazlı havuzlar:** Her markanın kendi temsilci listesi ve kendi sayacı olsun. Sayaç tablosundaki `havuz` alanını `marka_havuz` (örneğin "MarkaA_SMB") şeklinde genişletmek yeterlidir.
3. **Çapraz fırsat kuralı:** Bir lead birden fazla markanın hizmetiyle ilgileniyorsa ana markaya atayın ve diğer markanın ekibine "çapraz fırsat" bildirimi gönderin.
4. **Ortak şirket sahipliği kontrolü:** Aynı şirketle başka bir markanın zaten aktif bir ilişkisi varsa bunu temsilciye bildirin. Müşteriye iki markadan habersiz iki ayrı teklif gitmesi istenmeyen bir durumdur.

Çok markalı otomasyon mimarisinin genel çerçevesini [çoklu markalı holdinglerde n8n ile pazarlama otomasyonu](/blog/coklu-markali-holdinglerde-n8n-ile-pazarlama-otomasyonu-rehberi) yazımızda daha ayrıntılı ele aldık.

## Başarıyı Nasıl Ölçersiniz?

Round-robin sistemini kurduktan sonra şu metrikleri haftalık ya da aylık izleyin:

- **Temsilci başına atanan lead sayısı:** Ağırlıklarla orantılı mı? Örneğin 2-2-1 ağırlıklı bir ekipte 100 lead'in yaklaşık 40-40-20 dağılması beklenir.
- **Ortalama ilk temas süresi:** Atamadan ilk aktiviteye kadar geçen süre. Otomasyon öncesi ve sonrası karşılaştırması en net etkiyi gösterir.
- **Yeniden atama oranı:** SLA ihlali nedeniyle yeniden atanan lead yüzdesi. Bu oran yüksekse kapasite sınırlarını gözden geçirin.
- **Temsilci bazlı dönüşüm oranı:** Lead'den toplantıya, toplantıdan fırsata geçiş. Adil dağıtım sayesinde bu karşılaştırma artık anlamlıdır.
- **Yedek kişiye düşen lead sayısı:** Sık oluyorsa ekip kapasiteniz yetersiz ya da filtreleriniz fazla katı olabilir.

Bu metrikleri log tablonuzdan ve CRM'den çeken bir raporlama akışını yine n8n ile kurabilir, her pazartesi sabahı satış kanalına otomatik özet gönderebilirsiniz.

## Sık Yapılan Hatalar

- **Mevcut şirket sahibini kontrol etmemek:** Aynı firmaya iki temsilcinin ulaşması, en hızlı güven kaybettiren hatadır.
- **Sayacı test ortamında tutmak:** n8n'de manuel test yürütmeleri static data'yı kalıcı olarak kaydetmez. Canlıya geçtiğinizde sayacın sıfırdan başladığını fark edebilirsiniz.
- **İzin ve kapasite kontrolü olmadan dağıtmak:** Tatildeki temsilciye giden lead bir hafta bekler.
- **Tüm lead'leri tek havuza koymak:** Kurumsal bir fırsatın deneyimsiz bir temsilciye düşmesi, adaletli ama verimsiz bir sonuçtur.
- **Loglamayı atlamak:** Sorun çıktığında neyin, neden, kime gittiğini bilmeden düzeltme yapmak neredeyse imkânsızdır.
- **Temsilci listesini koda gömmek:** Her personel değişikliğinde otomasyonu düzenlemek zorunda kalırsınız ve hata riski artar.

## Sonuç

n8n ile round-robin lead atama otomasyonu, satış operasyonunuzun en temel ama en etkili iyileştirmelerinden biridir. Doğru kurulduğunda lead'ler saniyeler içinde doğru kişiye ulaşır, iş yükü adil dağılır ve yöneticiler manuel atama yükünden kurtulur. Sağlam bir sistemin anahtarı birkaç kritik detayda gizlidir: mevcut sahip kontrolü, kapasite ve uygunluk filtreleri, eşzamanlılığa dayanıklı bir sayaç, SLA takibi ve eksiksiz loglama. Basit sıralı modelle başlayıp ihtiyaç doğdukça ağırlık, segment ve marka katmanları eklemek en pratik yoldur.

Lead atama süreçlerinizi otomatikleştirmek, CRM'inizle entegre bir round-robin yapısı kurmak ya da çok markalı satış operasyonunuzu n8n ile ölçeklendirmek istiyorsanız, [Corner Group ekibiyle iletişime geçin](/iletisim). İhtiyaçlarınıza uygun mimariyi birlikte tasarlayalım.
