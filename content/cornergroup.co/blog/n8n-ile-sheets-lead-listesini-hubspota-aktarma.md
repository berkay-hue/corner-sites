---
title: "n8n ile Sheets Lead Listesini HubSpot'a Aktarma"
description: "Google Sheets'teki lead listesini n8n ile HubSpot'a otomatik aktarın; tekrar eden kayıtları önleyin, alanları eşleştirin ve hataları takip edin."
date: "2026-11-14"
category: "Otomasyon"
image: "https://images.pexels.com/photos/7983587/pexels-photo-7983587.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "n8n ile Sheets Lead Listesini HubSpot'a Aktarma"
alt: "n8n-google-sheets-to-hubspot-lead-import"
---

Google Sheets'teki bir lead listesini HubSpot'a aktarmanın en pratik yolu, n8n'de **Google Sheets tetikleyicisi, veri temizleme adımı ve HubSpot "Create or Update" (upsert) işlemi** içeren bir iş akışı kurmaktır. Bu akış, tabloya eklenen her yeni satırı okur, e-posta adresine göre HubSpot'ta kişiyi oluşturur ya da günceller ve işlem sonucunu tekrar Sheets'e yazar. Doğru kurulduğunda manuel CSV import'un yarattığı mükerrer kayıt, eksik alan ve gecikme sorunlarını büyük ölçüde ortadan kaldırır.

Birçok B2B ekibinde lead'ler önce bir tabloda toplanır. SDR'lar prospecting yapar, etkinlik listeleri tabloya yapıştırılır, pazarlama ekibi bir webinar katılımcı listesini paylaşır. Sorun şu ki bu tablo, satış ekibinin asıl çalıştığı CRM'den kopuk kalır. Bu yazıda, Corner Group bünyesinde outbound ve CRM projelerinde sık kullandığımız yaklaşımı adım adım anlatıyoruz: tablonun nasıl hazırlanacağını, n8n akışının hangi node'lardan oluşacağını, mükerrer kayıtların nasıl önleneceğini ve API limitlerine nasıl takılmadan toplu aktarım yapılacağını.

## Neden manuel import yerine otomatik aktarım?

HubSpot'un kendi CSV import özelliği işe yarar, ama tek seferlik işler içindir. Lead listesi sürekli büyüyen, birden fazla kişinin aynı anda doldurduğu, canlı bir tabloysa manuel import birkaç soruna yol açar:

- **Gecikme:** Listeyi haftada bir import ediyorsanız, pazartesi eklenen bir lead'e cuma günü ulaşılır. Satışta hızın ne kadar belirleyici olduğunu [speed-to-lead kavramını ve gelen lead'e otomatik yanıtı anlattığımız yazıda](/blog/speed-to-lead-nedir-n8n-otomatik-yanit) detaylı ele almıştık.
- **Mükerrer kayıtlar:** Aynı listenin farklı versiyonları tekrar tekrar import edildiğinde CRM'de aynı kişinin iki-üç kopyası oluşabilir.
- **Tutarsız veri:** "istanbul", "İstanbul", "IST" gibi farklı yazımlar raporlamayı bozar.
- **İzlenebilirlik eksikliği:** Hangi satırın aktarıldığı, hangisinin hata verdiği tabloda görünmez.

Otomatik bir n8n akışı bu dört sorunu tek seferde çözer. Her satır eklendiği anda (veya belirlediğiniz periyotta) işlenir, veri standartlaştırılır, e-posta üzerinden eşleştirme yapılır ve satırın durumu tabloya geri yazılır.

## Başlamadan önce neye ihtiyacınız var?

Kuruluma başlamadan aşağıdaki dört bileşeni hazırlayın:

1. **Bir n8n ortamı:** n8n Cloud hesabı ya da kendi sunucunuzda çalışan (self-hosted) bir n8n kurulumu. İkisi de bu akış için yeterlidir.
2. **Google hesabı ve OAuth bağlantısı:** n8n'de Google Sheets credential'ı oluşturmanız gerekir. Self-hosted kurulumlarda Google Cloud Console'da bir OAuth istemcisi açmanız gerekebilir.
3. **HubSpot Private App token'ı:** HubSpot'ta *Ayarlar > Entegrasyonlar > Private Apps* bölümünden yeni bir uygulama oluşturun. En az şu kapsamları (scope) verin: `crm.objects.contacts.read`, `crm.objects.contacts.write`, `crm.objects.companies.read`, `crm.objects.companies.write`. Token'ı n8n'de HubSpot credential'ı olarak kaydedin.
4. **Standart bir Google Sheets şablonu:** Akışın sağlıklı çalışması için tablonuzun sütun yapısının sabit olması şarttır.

HubSpot'un ücretsiz planıyla da bu akışı kurabilirsiniz; ancak özel alan sayısı, otomasyon ve raporlama gibi konularda sınırlara erken takılabilirsiniz. Hangi noktada ücretli plana geçmenin mantıklı olduğunu [HubSpot ücretsiz plan limitlerini incelediğimiz yazıda](/blog/hubspot-ucretsiz-plan-limitleri) bulabilirsiniz.

## Google Sheets tablosu nasıl hazırlanmalı?

Otomasyonun kalitesi, girdinin kalitesine bağlıdır. Önerdiğimiz minimum sütun yapısı şöyle:

| Sütun | Örnek değer | HubSpot alanı |
|---|---|---|
| email | ayse.kaya@ornekfirma.com | email |
| ad | Ayşe | firstname |
| soyad | Kaya | lastname |
| unvan | Satış Direktörü | jobtitle |
| sirket | Örnek Firma A.Ş. | company |
| web_sitesi | ornekfirma.com | website / domain |
| telefon | 0532 123 45 67 | phone |
| sehir | İstanbul | city |
| kaynak | LinkedIn Outbound | lead_kaynagi (özel alan) |
| durum | (boş bırakılır) | – |
| hubspot_id | (boş bırakılır) | – |
| hata | (boş bırakılır) | – |

Son üç sütun kritik. **durum**, **hubspot_id** ve **hata** sütunlarını n8n doldurur. Böylece tabloyu açan herkes hangi satırın aktarıldığını, hangisinin beklediğini ve hangisinin neden başarısız olduğunu görür.

Birkaç pratik öneri:

- **E-postayı zorunlu tutun.** HubSpot kişileri e-posta adresine göre tekilleştirir. E-postası olmayan satırları akışa sokmayın.
- **Veri doğrulama kullanın.** "kaynak" ve "sehir" gibi sütunlara Sheets'in *Veri > Veri doğrulama* özelliğiyle açılır liste ekleyin. Serbest metin girişi, tutarsızlığın bir numaralı sebebidir.
- **Sütun adlarını değiştirmeyin.** n8n, alanları sütun başlıklarına göre eşleştirir. Birisi "email" sütununu "E-posta" olarak yeniden adlandırırsa akış sessizce bozulur.

Listeyi oluştururken iletişim verisinin doğruluğu da en az yapı kadar önemlidir. Prospecting tarafında doğrulanmış e-posta ve unvan bilgisi için [Apollo.io](https://get.apollo.io/679irkzm35ya) gibi araçlardan dışa aktardığınız listeleri doğrudan bu şablona yapıştırabilirsiniz.

## n8n iş akışı adım adım nasıl kurulur?

Akışın genel mantığı şöyle: **Tetikleyici → Filtre → Veri temizleme → Şirket kontrolü → Kişi upsert → İlişkilendirme → Sheets'e geri yazma.** Şimdi her adımı tek tek ele alalım.

### 1. Tetikleyiciyi seçin

İki seçeneğiniz var:

- **Google Sheets Trigger (Row Added):** Tabloya yeni satır eklendiğinde akış çalışır. n8n bu tetikleyicide belirli aralıklarla tabloyu yoklar (polling); varsayılan olarak her dakika kontrol edecek şekilde ayarlanabilir. Canlı, sürekli dolan listeler için idealdir.
- **Schedule Trigger + Google Sheets (Get Rows):** Örneğin her saat başı veya her sabah 08:00'de tablonun tamamını okur ve yalnızca "durum" sütunu boş olan satırları işler. Toplu yapıştırılan listeler ve geriye dönük düzeltmeler için daha güvenilirdir.

Bizim tavsiyemiz çoğu ekip için ikinci yöntemdir. Çünkü "durum" sütunu sayesinde akış idempotent olur: aynı satır iki kez işlenmez, hata alan bir satırı düzeltip "durum" alanını temizlediğinizde bir sonraki çalışmada otomatik olarak tekrar denenir.

### 2. İşlenecek satırları filtreleyin

Google Sheets node'unda *Get Row(s)* işlemini seçin, ardından bir **Filter** node'u ekleyin. Koşullar:

- `email` boş değil
- `durum` boş

Bu iki koşul, hem e-postasız satırları hem de daha önce aktarılmış satırları eler. 2.000 satırlık bir tabloda günde 50 yeni lead ekleniyorsa, akış her çalışmada yalnızca o 50 satırla uğraşır.

### 3. Veriyi temizleyin ve standartlaştırın

Bu adım çoğu kurulumda atlanır ve sonradan en çok sorun çıkaran yer olur. Bir **Code** node'u ekleyip aşağıdaki gibi bir temizleme mantığı kurabilirsiniz:

```javascript
return $input.all().map(item => {
  const d = item.json;

  const email = (d.email || '').trim().toLowerCase();
  const capitalize = s => (s || '').trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/(^|\s)\S/g, c => c.toLocaleUpperCase('tr-TR'));

  // Domain: protokol, www ve yol kısmını temizle
  const domain = (d.web_sitesi || email.split('@')[1] || '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .toLowerCase();

  // Telefon: yalnızca rakamları al, +90 formatına çevir
  let phone = (d.telefon || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = phone.slice(1);
  if (phone.length === 10) phone = '+90' + phone;

  const genericDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];

  return {
    json: {
      row_number: d.row_number,
      email,
      firstname: capitalize(d.ad),
      lastname: capitalize(d.soyad),
      jobtitle: (d.unvan || '').trim(),
      company: (d.sirket || '').trim(),
      domain: genericDomains.includes(domain) ? '' : domain,
      phone,
      city: capitalize(d.sehir),
      lead_kaynagi: d.kaynak || 'Bilinmiyor'
    }
  };
});
```

Bu kod üç önemli iş yapar: e-postayı küçük harfe çevirerek eşleştirme hatalarını önler, Türkçe karakterleri doğru büyük harfe çevirir (ör. "istanbul" → "İstanbul") ve telefon numaralarını tek bir formata indirger. Ayrıca gmail.com gibi genel e-posta alan adlarını şirket domain'i olarak kullanmaz; aksi halde yüzlerce kişi "gmail.com" adlı tek bir şirkete bağlanabilir.

Bu aşamada lead'leri ek verilerle (sektör, çalışan sayısı, LinkedIn URL'si) zenginleştirmek isterseniz araya bir zenginleştirme adımı ekleyebilirsiniz. Bu konuyu [n8n ile B2B lead zenginleştirme otomasyonu rehberimizde](/blog/n8n-ile-b2b-lead-zenginlestirme-otomasyonu-rehberi-verimliligi-artirin) ayrıntılı anlattık.

### 4. Şirketi bulun veya oluşturun

B2B satışta kişiyi şirketsiz bırakmak, raporlamada büyük bir boşluk yaratır. Bu yüzden önce şirket kaydını ele alın:

1. **IF node:** `domain` alanı dolu mu? Boşsa şirket adımını atlayıp doğrudan kişi adımına geçin.
2. **HubSpot node (Company → Search by Domain):** Domain'e göre HubSpot'ta mevcut şirketi arayın.
3. **IF node:** Sonuç döndü mü?
   - Döndüyse şirket ID'sini alın.
   - Dönmediyse **HubSpot node (Company → Create)** ile `name` ve `domain` alanlarını doldurarak yeni şirket oluşturun.
4. **Merge node:** İki koldan gelen şirket ID'sini tek bir akışta birleştirin.

Bu yapı sayesinde aynı şirketten 15 kişilik bir liste geldiğinde HubSpot'ta 15 ayrı şirket değil, tek bir şirket ve ona bağlı 15 kişi oluşur.

### 5. Kişiyi oluşturun veya güncelleyin (upsert)

Akışın kalbi burasıdır. **HubSpot node**'unda *Contact → Create or Update* işlemini seçin. Bu işlem e-posta adresini anahtar olarak kullanır: kişi HubSpot'ta varsa günceller, yoksa yeni kayıt açar.

Eşleştirilecek alanlar:

- **Email:** `{{ $json.email }}`
- **First Name / Last Name:** temizlenmiş ad-soyad
- **Job Title, Company Name, Phone Number, City:** ilgili alanlar
- **Lifecycle Stage:** `lead`
- **Lead Status:** `NEW`
- **Özel alan (lead_kaynagi):** Additional Fields altından özel property seçerek

Burada dikkat edilmesi gereken bir nüans var: **Lifecycle stage'i her güncellemede "lead" olarak yazarsanız**, daha önce "opportunity" veya "customer" aşamasına geçmiş bir kişiyi geri düşürmeye çalışırsınız. HubSpot varsayılan olarak lifecycle stage'in geriye alınmasına izin vermez ve bu durumda hata alabilirsiniz. Çözüm: Upsert'ten önce kişinin var olup olmadığını kontrol edip lifecycle alanını yalnızca yeni kayıtlarda gönderin ya da bu alanı tamamen HubSpot içindeki iş akışlarına bırakın.

### 6. Kişiyi şirkete bağlayın

Kişi ve şirket ID'leri elinizdeyken ilişkilendirmeyi yapın. Bunun için en esnek yöntem bir **HTTP Request** node'u ile HubSpot'un associations API'sini çağırmaktır. HubSpot credential'ınızı bu node'da da kullanabilirsiniz; böylece token'ı ayrıca yazmanıza gerek kalmaz. Kişi ile şirket arasındaki varsayılan ilişki tipini kullanmak çoğu senaryo için yeterlidir.

İsterseniz HubSpot'ta "Şirket domain'ine göre kişileri otomatik ilişkilendir" ayarını açık tutarak bu adımı basitleştirebilirsiniz; ancak domain'i olmayan ya da farklı domain kullanan kişiler için manuel ilişkilendirme daha güvenilirdir.

### 7. Sonucu Google Sheets'e geri yazın

Son olarak **Google Sheets node (Update Row)** ile ilgili satırı güncelleyin. Eşleştirme için `row_number` alanını kullanın ve şunları yazın:

- **durum:** `Aktarıldı`
- **hubspot_id:** HubSpot'tan dönen kişi ID'si
- **hata:** boş

Böylece tabloyu açan bir SDR, hangi lead'in CRM'e düştüğünü anında görür ve HubSpot ID'si üzerinden kayda doğrudan ulaşabilir.

## Hatalar nasıl yönetilmeli?

Gerçek hayatta her satır sorunsuz geçmez. Geçersiz e-posta formatı, HubSpot'ta bulunmayan bir özel alan değeri ya da geçici bir API hatası akışı durdurabilir. Bunun için:

- HubSpot node'larının ayarlarında **"On Error: Continue (using error output)"** seçeneğini aktif edin. Böylece tek bir hatalı satır tüm akışı durdurmaz.
- Hata çıkışını ayrı bir Google Sheets node'una bağlayın ve satırın **durum** alanına `Hata`, **hata** alanına HubSpot'un döndürdüğü mesajı yazın.
- n8n'de bir **Error Workflow** tanımlayarak beklenmedik çökmelerde Slack veya e-posta üzerinden bildirim alın.

Bu yapıyla ekip, sabah tabloyu açtığında "Hata" filtresiyle sorunlu satırları görür, düzeltir, durum alanını temizler; bir sonraki çalışmada satır otomatik olarak tekrar denenir.

## Mükerrer kayıtlar nasıl önlenir?

Upsert işlemi e-posta bazında mükerrerliği engeller, ama tek başına yeterli değildir. Ek önlemler:

- **E-postayı her zaman küçük harfe çevirin.** "Ayse.Kaya@" ile "ayse.kaya@" HubSpot'ta aynı kabul edilse de tutarlılık için temizlik adımı şarttır.
- **Şirketleri adla değil domain'le eşleştirin.** "Örnek Firma", "Örnek Firma A.Ş." ve "ORNEK FIRMA" üç farklı kayıt yaratır; "ornekfirma.com" ise tektir.
- **Tablo içi tekrarları önceden ayıklayın.** Code node'unda veya **Remove Duplicates** node'uyla aynı çalışma içinde aynı e-postanın iki kez işlenmesini engelleyin.
- **"durum" sütununu kutsal kabul edin.** Bu sütun dolu olan satır bir daha işlenmez.

## Toplu aktarımda API limitlerine takılmamak için ne yapmalı?

Tabloya bir anda 3.000 satırlık bir liste yapıştırıldığını düşünün. Her satır için şirket arama, şirket oluşturma, kişi upsert ve ilişkilendirme dahil 3-4 API çağrısı yapılıyorsa toplamda 10.000'i aşkın istek eder. HubSpot, private app'ler için kısa zaman pencerelerinde sınırlı sayıda isteğe izin verir ve bu limit abonelik planınıza göre değişir. Limit aşıldığında 429 hatası alırsınız.

Çözüm basit:

1. **Loop Over Items (Split in Batches)** node'u ile satırları 10'arlı gruplara bölün.
2. Her grubun sonuna 1-2 saniyelik bir **Wait** node'u ekleyin.
3. HubSpot node'larında **Retry On Fail** seçeneğini açıp 3 deneme ve birkaç saniyelik bekleme süresi tanımlayın.

Bu ayarla 3.000 satırlık bir liste, akışı zorlamadan makul bir sürede işlenir. Günlük 50-100 lead'lik normal akışta ise bu limitler pratikte hiç hissedilmez.

## Maliyeti ne kadar?

Bu akışın maliyeti üç kalemden oluşur:

- **n8n:** Self-hosted kurulumda yazılımın kendisi için lisans ödemezsiniz, yalnızca sunucu maliyeti vardır; küçük bir bulut sunucusu bu akış için yeterlidir. n8n Cloud'da ise fiyatlandırma aylık iş akışı çalıştırma (execution) sayısına göre belirlenir. Schedule Trigger ile saatte bir çalışan bir akış ayda yaklaşık 720 execution üretir; Loop node'u execution sayısını artırmaz, çünkü tüm satırlar aynı çalıştırma içinde işlenir.
- **HubSpot:** Ücretsiz CRM ile bu akış çalışır. Ancak özel alanlar, gelişmiş otomasyon ve sekans gibi özellikler için Sales Hub'ın ücretli katmanlarına ihtiyaç duyabilirsiniz.
- **Kurulum zamanı:** n8n'e aşina bir kişi için temel akış birkaç saatte kurulur. Hata yönetimi, şirket eşleştirme ve test dahil üretime hazır hâle getirmek genellikle bir-iki iş günü sürer.

Karşılaştırma için şöyle düşünün: Haftada 300 lead'i manuel olarak temizleyip import eden bir SDR, bu işe kolayca haftada 2-3 saat harcar. Yılda bu, 100 saati aşan bir süre demektir ve bu süre satış görüşmesinden çalınır.

## Gerçekçi bir kullanım senaryosu

Bir B2B SaaS şirketinin üç kişilik outbound ekibini düşünelim. SDR'lar her gün LinkedIn ve veri araçlarından hedef hesaplar belirleyip ortak bir Google Sheets tablosuna yazıyor. Ayrıca pazarlama ekibi ayda bir webinar katılımcı listesini aynı tabloya ekliyor.

Otomasyon öncesinde liste haftada bir import ediliyor, her import sonrası birisi mükerrer kayıtları elle birleştiriyor ve lead'lerin bir kısmı hiçbir satış temsilcisine atanmadan bekliyor.

n8n akışı kurulduktan sonra süreç şöyle işliyor:

1. SDR satırı ekliyor.
2. En geç bir saat içinde kişi HubSpot'ta "NEW" statüsünde, doğru şirkete bağlı ve kaynak bilgisiyle oluşuyor.
3. Aynı akışın devamında lead, ekip üyeleri arasında sırayla dağıtılıyor. Bu dağıtım mantığını [n8n ile round-robin lead atama kurulumunu anlattığımız yazıda](/blog/n8n-ile-lead-atama-otomasyonu) adım adım bulabilirsiniz.
4. Atanan temsilciye Slack üzerinden bildirim gidiyor.
5. Tablodaki satır "Aktarıldı" olarak işaretleniyor.

Sonuç: Lead'in tabloya girmesiyle satış temsilcisinin önüne düşmesi arasındaki süre günlerden saatlere iniyor, mükerrer kayıt temizliği neredeyse tamamen ortadan kalkıyor ve kaynak bazlı raporlama ilk kez güvenilir hâle geliyor.

Outbound sürecinin listeyi oluşturma ve kampanya yürütme tarafını uçtan uca dışarıdan almak isteyen ekipler için [B2B SaaS'a özel outbound satış ve lead generation hizmeti sunan SAAS Corner](https://saascorner.co) bu akışın beslendiği listeleri sistematik olarak üretebilir.

## Sık yapılan hatalar

- **Sheets'i "veritabanı" gibi kullanmak:** Sheets bir giriş noktasıdır, tek doğruluk kaynağı HubSpot olmalıdır. Güncellemeleri CRM'de yapın, tabloda değil.
- **Tüm alanları her seferinde üzerine yazmak:** Satış temsilcisinin HubSpot'ta güncellediği unvan veya telefon, tablodaki eski veriyle ezilebilir. Güncellemede yalnızca boş alanları doldurmayı düşünün.
- **Test etmeden canlıya almak:** İlk çalıştırmayı 5-10 satırlık bir test tablosuyla ve mümkünse bir HubSpot sandbox ya da test hesabıyla yapın.
- **KVKK'yı unutmak:** Aktardığınız kişisel verilerin hukuki dayanağını ve kaynağını belgeleyin. "kaynak" sütunu bu açıdan da işe yarar.

## Sık sorulan sorular

### n8n ile Google Sheets'ten HubSpot'a aktarım için kod bilmek gerekir mi?

Temel akış tamamen sürükle-bırak node'larla kurulabilir. Ancak telefon formatlama veya Türkçe karakter düzeltme gibi veri temizleme adımları için kısa bir JavaScript kodu (Code node) kullanmak işi çok kolaylaştırır. Yazıdaki örnek kodu kendi sütun adlarınıza göre uyarlamanız yeterlidir.

### Aynı kişi tabloya iki kez eklenirse HubSpot'ta mükerrer kayıt oluşur mu?

HubSpot node'unun "Create or Update" işlemini kullanırsanız oluşmaz; çünkü bu işlem e-posta adresine göre mevcut kişiyi bulup günceller. Yine de e-postaları küçük harfe çevirmek ve aynı çalışma içindeki tekrarları Remove Duplicates node'uyla ayıklamak en güvenli yaklaşımdır.

### Bu akış HubSpot ücretsiz planıyla çalışır mı?

Evet, kişi ve şirket oluşturma, güncelleme ve ilişkilendirme işlemleri ücretsiz planda da API üzerinden yapılabilir. Özel alan sayısı, gelişmiş otomasyon ve raporlama ihtiyaçları büyüdükçe ücretli plana geçmek gündeme gelebilir.

### Akış ne sıklıkla çalışmalı?

Canlı ve sürekli dolan listeler için saatte bir çalışan bir Schedule Trigger çoğu ekip için yeterli bir denge sunar. Gelen lead'lere dakikalar içinde dönüş yapmanız gerekiyorsa Google Sheets Trigger ile daha kısa yoklama aralığı kullanabilir ya da lead'i doğrudan formdan webhook ile almayı tercih edebilirsiniz.

## Sonuç

Google Sheets'teki lead listesini n8n ile HubSpot'a bağlamak, teknik olarak birkaç node'dan oluşan basit bir akış gibi görünse de satış operasyonuna etkisi büyüktür. Doğru tablo yapısı, sağlam bir veri temizleme adımı, e-posta bazlı upsert, domain bazlı şirket eşleştirmesi ve tabloya geri yazılan durum bilgisiyle; lead'ler gecikmeden, temiz ve izlenebilir şekilde satış ekibinin önüne düşer. Üzerine lead atama, zenginleştirme ve otomatik bildirim katmanları ekledikçe bu akış, tüm outbound sürecinizin omurgasına dönüşür.

Kendi lead listelerinizi HubSpot'a otomatik bağlamak, mevcut n8n akışlarınızı gözden geçirmek veya CRM ve outbound süreçlerinizi uçtan uca kurgulamak istiyorsanız [Corner Group ekibiyle iletişime geçin](/iletisim); ihtiyacınıza uygun yapıyı birlikte tasarlayalım.
