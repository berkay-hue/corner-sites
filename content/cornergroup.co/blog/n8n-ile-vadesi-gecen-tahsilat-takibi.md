---
title: "n8n ile Vadesi Geçen Tahsilatları Otomatik Takip Etme"
description: "Vadesi geçen faturaları elle takip etmek nakit akışını bozar. n8n ile otomatik hatırlatma ve eskalasyon akışını adım adım kurmayı anlatıyoruz."
date: "2026-11-04"
category: "Otomasyon"
image: "https://images.pexels.com/photos/4872034/pexels-photo-4872034.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "n8n ile Vadesi Geçen Tahsilatları Otomatik Takip Etme"
alt: "n8n-overdue-invoice-follow-up"
---

Vadesi geçen tahsilatları n8n ile otomatik takip etmek, muhasebe yazılımınızdaki ya da CRM'inizdeki açık faturaları her gün belirli bir saatte tarayan, gecikme gününe göre müşteriye kademeli hatırlatma gönderen ve kritik eşiği aşan alacakları ilgili kişiye bildiren bir iş akışı kurmak demektir. Bu yapı, manuel Excel takibini ve unutulan hatırlatma e-postalarını ortadan kaldırır. Ekibinizin yalnızca gerçekten müdahale gerektiren alacaklarla ilgilenmesini sağlar. Kurulum genellikle birkaç gün sürer; yerleşik zamanlayıcı, HTTP istekleri, koşullu yönlendirme ve e-posta ile mesajlaşma entegrasyonları sayesinde ek bir tahsilat yazılımına ihtiyaç duymadan çalışır.

B2B şirketlerinde nakit akışı sorunlarının önemli bir kısmı müşterinin ödeme yapmak istememesinden kaynaklanmaz. Asıl neden, faturanın doğru kişiye ulaşmaması, ödeme onay sürecinde unutulması ya da kimsenin zamanında hatırlatma yapmamasıdır. Bu yazıda n8n ile uçtan uca bir tahsilat takip otomasyonunun nasıl kurulacağını anlatıyoruz. Hangi verilere ihtiyaç duyduğunuzu, iş akışının düğüm düğüm nasıl tasarlanacağını, hatırlatma takviminin nasıl kurgulanacağını ve sık yapılan hataları somut örneklerle ele alıyoruz.

## Vadesi geçen tahsilatlar neden manuel takip edilmemeli?

Pek çok büyüme aşamasındaki B2B şirkette tahsilat takibi şöyle işler: Finans ekibinden biri haftada bir muhasebe programından açık faturaları dışa aktarır, Excel'de vadesi geçenleri filtreler ve tek tek e-posta yazar. Bu yöntem 15-20 müşteriyle idare edilebilir. Müşteri sayısı 100'ü geçtiğinde ise üç temel sorun ortaya çıkar:

- **Tutarsızlık:** Bazı müşterilere üç gün gecikmede hatırlatma gider, bazılarına üç hafta sonra bile gitmez. Takip, o hafta ekibin ne kadar yoğun olduğuna bağlıdır.
- **Görünürlük eksikliği:** Satış ekibi, müşterisinin iki faturasının ödenmediğinden habersiz şekilde yeni bir genişleme teklifi hazırlayabilir. Hesap yöneticisi ise müşteriyle yaptığı haftalık toplantıda konuyu açması gerektiğini bilmez.
- **İlişki riski:** Aynı müşteriye hem finans hem satış ekibinden farklı tonda mesajlar gidebilir. Bu da profesyonel olmayan bir izlenim bırakır.

Otomasyon bu üç sorunu birlikte çözer. Her fatura aynı kurallarla takip edilir, ilgili herkes zamanında bilgilendirilir ve müşteriye giden iletişim tek bir standart çerçevede kalır.

## Otomatik tahsilat takibi nasıl çalışır?

n8n ile kurulan bir tahsilat takip sistemi temelde beş katmandan oluşur:

1. **Tetikleyici:** İş akışını her iş günü sabah belirli bir saatte (örneğin 09:00) başlatan zamanlayıcı.
2. **Veri toplama:** Muhasebe yazılımından, ERP'den, ödeme altyapısından ya da CRM'den açık faturaların çekilmesi.
3. **Hesaplama ve segmentasyon:** Her faturanın kaç gün geciktiğinin hesaplanması ve gecikme süresine, tutara ve müşteri segmentine göre gruplandırılması.
4. **Aksiyon:** Müşteriye e-posta, hesap yöneticisine Slack ya da Teams bildirimi, CRM'de görev oluşturma, eşik aşıldığında yöneticiye eskalasyon.
5. **Kayıt ve geri besleme:** Gönderilen her hatırlatmanın kaydedilmesi, ödeme geldiğinde dizinin otomatik durdurulması.

Bu mimari, daha önce ele aldığımız [n8n ile sözleşme yenileme hatırlatıcısı kurulumuna](/blog/n8n-sozlesme-yenileme-hatirlaticisi-kurulum) oldukça benzer. Fark şudur: Burada tarih geçmişe dönüktür ve iletişimin tonu gecikme arttıkça kademeli olarak değişir.

## Kurulumdan önce hangi verilere ihtiyacınız var?

İş akışını kurmaya başlamadan önce veri kaynağınızın aşağıdaki alanları güvenilir şekilde sağladığından emin olun. Eksik ya da hatalı veriyle kurulan bir otomasyon, manuel takipten daha fazla zarar verebilir. Ödenmiş bir fatura için müşteriye hatırlatma göndermek, en hızlı güven kaybettiren hatalardan biridir.

**Zorunlu alanlar:**

- Fatura numarası
- Müşteri adı ve benzersiz müşteri kimliği
- Fatura tutarı ve para birimi
- Fatura tarihi ve vade tarihi
- Ödeme durumu (ödenmedi, kısmi ödendi, ödendi)
- Kalan bakiye
- Fatura iletişim kişisinin e-posta adresi (genellikle muhasebe ya da satın alma birimi)

**Önerilen ek alanlar:**

- Hesap yöneticisi ya da satış temsilcisinin adı
- Müşteri segmenti (örneğin stratejik, standart, küçük ölçekli)
- Ödeme sözü verildiyse söz verilen tarih
- İtiraz ya da anlaşmazlık durumu
- Son hatırlatma tarihi

Bu alanları CRM'de tutuyorsanız kayıtların temiz olması kritik önem taşır. Aynı şirket için iki farklı kayıt ya da güncel olmayan fatura iletişim kişileri sık rastlanan sorunlardır. Bu konuda [yapay zeka ile CRM verilerini otomatik temizleme ve zenginleştirme rehberimiz](/blog/yapay-zeka-ile-crm-verilerini-otomatik-temizleme-ve-zenginlestirme-rehberi) iyi bir başlangıç noktası olabilir.

## n8n iş akışı adım adım nasıl kurulur?

Aşağıdaki kurulum, muhasebe verisinin API üzerinden alınabildiği, bildirimlerin Slack'e ve hatırlatmaların e-postayla gönderildiği bir senaryoyu temel alır. Muhasebe yazılımınızın API'si yoksa aynı yapıyı Google Sheets ya da bir veritabanı tablosu üzerinden de kurabilirsiniz.

### 1. Schedule Trigger ile günlük tetikleme

İş akışını bir **Schedule Trigger** düğümüyle başlatın. Hafta içi her gün saat 09:00'da çalışacak şekilde ayarlayın. Hafta sonu çalışmaması önemlidir. Cumartesi sabahı gelen bir ödeme hatırlatması, B2B tarafında genellikle kimse tarafından okunmaz ve pazartesi gelen kutusunda diğer e-postaların arasında kaybolur.

İpucu: Resmi tatilleri de hariç tutmak istiyorsanız, iş akışının başına tatil tarihlerini içeren bir listeyi kontrol eden basit bir **IF** düğümü ekleyebilirsiniz.

### 2. Açık faturaların çekilmesi

**HTTP Request** düğümüyle muhasebe yazılımınızın API'sinden ödeme durumu "ödenmedi" veya "kısmi ödendi" olan faturaları çekin. Tüm faturaları çekip n8n içinde filtrelemek yerine, filtrelemeyi API sorgusunda yapmak hem daha hızlıdır hem de API limitlerine takılma riskini azaltır.

Kullandığınız sistemin hazır bir n8n entegrasyonu varsa (örneğin bazı muhasebe ve ödeme platformlarının yerleşik düğümleri bulunur) HTTP Request yerine doğrudan o düğümü kullanabilirsiniz.

### 3. Gecikme gününün hesaplanması

Bir **Code** düğümü ekleyerek her fatura için gecikme gün sayısını hesaplayın ve bir gecikme kademesi atayın. Örnek bir JavaScript mantığı şöyle olabilir:

```javascript
const bugun = new Date();
bugun.setHours(0, 0, 0, 0);

return items.map(item => {
  const vade = new Date(item.json.vade_tarihi);
  vade.setHours(0, 0, 0, 0);
  const gecikmeGun = Math.floor((bugun - vade) / (1000 * 60 * 60 * 24));

  let kademe = 'vadesi_gelmedi';
  if (gecikmeGun === -3) kademe = 'on_hatirlatma';
  else if (gecikmeGun === 1) kademe = 'kademe_1';
  else if (gecikmeGun === 7) kademe = 'kademe_2';
  else if (gecikmeGun === 15) kademe = 'kademe_3';
  else if (gecikmeGun === 30) kademe = 'kademe_4';
  else if (gecikmeGun > 30 && gecikmeGun % 15 === 0) kademe = 'eskalasyon';

  return { json: { ...item.json, gecikmeGun, kademe } };
});
```

Burada dikkat edilmesi gereken nokta, kademelerin "eşittir" kontrolüyle tanımlanmasıdır. Böylece müşteriye her gün değil, yalnızca belirlenen günlerde mesaj gider. 8. günde çalışan iş akışı, 7. gün hatırlatması gönderilmiş bir faturaya tekrar mesaj atmaz.

Ancak bu yaklaşımın bir zayıflığı vardır: İş akışı bir gün herhangi bir nedenle çalışmazsa o günün hatırlatması atlanır. Daha sağlam bir yöntem, her fatura için "son gönderilen kademe" bilgisini saklamak ve "gecikme günü 7'yi geçti ve kademe 2 henüz gönderilmedi" mantığıyla kontrol etmektir. Bunu 9. adımda ele alıyoruz.

### 4. Hariç tutma filtreleri

Bir **Filter** düğümüyle şu faturaları akıştan çıkarın:

- İtiraz ya da anlaşmazlık durumu işaretli olanlar
- Ödeme sözü verilmiş ve söz tarihi henüz geçmemiş olanlar
- Kalan bakiyesi belirli bir eşiğin altında olanlar (örneğin kur farkından doğan küçük kalıntılar)
- Hukuki takibe devredilmiş alacaklar

Bu filtre, otomasyonun en çok göz ardı edilen ama en çok sorun önleyen kısmıdır. Anlaşmazlık yaşanan bir müşteriye otomatik "ödemeniz gecikti" e-postası göndermek, çözülmekte olan bir sorunu kolayca büyütebilir.

### 5. Kademeye göre yönlendirme

Bir **Switch** düğümüyle faturaları kademe değerine göre farklı kollara yönlendirin. Her kol farklı bir aksiyon setini tetikleyecektir. Ayrıca müşteri segmentine göre ikinci bir ayrım yapmak isteyebilirsiniz. Stratejik müşteriler için ilk iletişimi otomatik e-posta yerine hesap yöneticisinin kişisel olarak yapması daha uygun olabilir.

### 6. Müşteriye hatırlatma e-postası

Her kademe kolunda bir **Send Email** ya da Gmail/Outlook düğümüyle müşteriye hatırlatma gönderin. E-postanın içinde şu bilgiler mutlaka yer almalı:

- Fatura numarası ve tarihi
- Tutar ve kalan bakiye
- Vade tarihi
- Ödeme bilgileri (IBAN, ödeme linki vb.)
- Faturanın PDF eki ya da indirme bağlantısı
- Sorun varsa iletişime geçilecek kişinin adı ve doğrudan iletişim bilgisi

E-postayı kişisel bir adresten, örneğin finans ekibinden belirli bir kişinin adıyla göndermek, "noreply" adreslerinden gönderilen mesajlara kıyasla genellikle daha fazla yanıt alır.

### 7. İç ekibe bildirim

Aynı kolda bir **Slack** düğümüyle hesap yöneticisine bilgi verin. Örnek bir mesaj formatı:

> ⚠️ *ABC Teknoloji* — Fatura #2024-118, 48.000 TL, **15 gün** gecikmede. 3. hatırlatma bugün gönderildi. Bu hafta müşteriyle görüşmeniz varsa konuyu gündeme almanızı öneririz.

Bu bildirim, satış ve finans arasındaki bilgi boşluğunu kapatır. Ekip içi bildirimlerin nasıl kurgulanacağına dair daha geniş bir çerçeve için [n8n ile B2B satış ekibi iletişiminde otomasyon rehberimize](/blog/n8n-ile-b2b-satis-ekibi-i-letisiminde-otomasyon-verimlilik-rehberi) göz atabilirsiniz.

### 8. CRM'de görev oluşturma ve eskalasyon

Kademe 3 ve sonrasında yalnızca bildirim yeterli olmayabilir. HubSpot, Pipedrive ya da Zoho düğümüyle hesap yöneticisine son tarihli bir görev atayın: "ABC Teknoloji ile gecikmiş ödeme hakkında telefon görüşmesi yap." Kademe 4'te (30 gün) ve sonrasında ise finans yöneticisine ve satış direktörüne özet bir eskalasyon e-postası gönderin.

CRM'deki şirket kaydına "gecikmiş ödeme" etiketi eklemek de faydalıdır. Böylece satış ekibi bu müşteriye yeni teklif hazırlarken durumu görür. Bu etiket, [n8n ile CRM'de riskli müşteri tespiti otomasyonu](/blog/n8n-ile-b2b-crm-de-riskli-musteri-tespiti-otomasyonu) gibi daha kapsamlı bir risk skorlama yapısının girdilerinden biri olarak da kullanılabilir.

### 9. Kayıt tutma ve tekrar gönderimi önleme

Her gönderimden sonra bir Google Sheets satırına ya da veritabanı tablosuna şu bilgileri yazın: fatura numarası, gönderilen kademe, gönderim tarihi, alıcı e-posta adresi. İş akışının başında bu tabloyu okuyarak, aynı kademenin aynı faturaya ikinci kez gönderilmesini engelleyin.

Bu kayıt aynı zamanda değerli bir denetim izi oluşturur. Bir müşteri "hiç hatırlatma almadık" dediğinde, hangi tarihte hangi adrese ne gönderildiğini saniyeler içinde gösterebilirsiniz.

### 10. Ödeme geldiğinde dizinin durdurulması

Ödeme altyapınız ya da bankanız webhook destekliyorsa, ödeme bildirimini dinleyen ayrı bir n8n iş akışı kurun. Ödeme geldiğinde fatura durumunu güncelleyin, Slack'te ilgili hesap yöneticisine "ödeme alındı" bildirimi gönderin ve istenirse müşteriye kısa bir teşekkür e-postası iletin. Webhook desteği yoksa günlük iş akışı zaten yalnızca açık faturaları çektiği için ödenen faturalar bir sonraki çalışmada otomatik olarak akıştan çıkar. Ancak aynı gün içinde ödeme yapıp öğleden sonra hatırlatma alan bir müşteri senaryosunu önlemek için gönderim öncesi son bir durum kontrolü eklemek iyi bir pratiktir.

## Hatırlatma takvimi nasıl kurgulanmalı?

Her şirketin ödeme koşulları ve müşteri profili farklıdır. Yine de B2B'de yaygın olarak işe yarayan kademeli bir yapı şöyledir:

- **Vadeden 3 gün önce (ön hatırlatma):** Nazik bir bilgilendirme. "Yaklaşan ödemeniz hakkında hatırlatma" tonunda. Amaç, faturanın müşterinin onay sürecinde kaybolmadığından emin olmak.
- **Vadeden 1 gün sonra (kademe 1):** Dostane ve varsayımsız. "Ödemenizi henüz göremedik, gözden kaçmış olabilir" yaklaşımı.
- **7. gün (kademe 2):** Daha net bir hatırlatma. Faturanın tekrar eklenmesi ve ödemenin planlanıp planlanmadığının sorulması.
- **15. gün (kademe 3):** Doğrudan ve somut. Hesap yöneticisinin de bilgide olduğu, telefonla iletişim önerisi içeren mesaj. Bu noktada CRM görevi oluşturulur.
- **30. gün (kademe 4):** Resmi ton. Sözleşmedeki ödeme koşullarına atıf, olası hizmet kısıtlamaları ya da gecikme faizi gibi sözleşmede tanımlı yaptırımların hatırlatılması. Yöneticiye eskalasyon.
- **30. günden sonra her 15 günde bir:** İç eskalasyon ve yönetim raporu. Bu noktadan sonra müşteriye otomatik e-posta göndermek yerine insan müdahalesine geçmek genellikle daha doğrudur.

Örnek bir senaryo üzerinden düşünelim: Aylık 120 fatura kesen bir B2B SaaS şirketi olsun. Bu faturaların bir kısmı her ay vadesinde ödenmiyor olsun. Manuel takipte finans uzmanının her hafta birkaç saatini bu işe ayırması gerekir. Otomasyondan sonra ise uzman yalnızca kademe 3 ve sonrasına ulaşan, genellikle tek haneli sayıdaki faturayla ilgilenir. Diğerleri otomatik hatırlatmalarla kendiliğinden kapanır.

## Hatırlatma e-postalarında ton nasıl olmalı?

Tahsilat iletişiminde amaç parayı almak kadar müşteri ilişkisini korumaktır. Aşağıda iki kademe için örnek metinler bulabilirsiniz.

**Kademe 1 örneği (vadeden 1 gün sonra):**

> Merhaba Ayşe Hanım,
>
> 15 Mart vadeli #2024-118 numaralı, 48.000 TL tutarındaki faturamızın ödemesini sistemimizde henüz göremedik. Ödeme süreciniz devam ediyorsa bu mesajı dikkate almayabilirsiniz.
>
> Faturayı ekte tekrar paylaşıyorum. Herhangi bir sorunuz olursa doğrudan bana yazabilirsiniz.

**Kademe 3 örneği (15. gün):**

> Merhaba Ayşe Hanım,
>
> #2024-118 numaralı faturamız 15 gündür açık görünüyor. Ödeme sürecinde bizden kaynaklı bir eksik ya da onay bekleyen bir konu varsa çözmek için hazırız.
>
> Hesap yöneticiniz Mehmet Bey de konudan haberdar. Bu hafta kısa bir telefon görüşmesi planlayabilirsek seviniriz. Uygun olduğunuz zamanı paylaşabilir misiniz?

Dikkat edilecek noktalar:

- Suçlayıcı ifadelerden kaçının. "Ödemenizi yapmadınız" yerine "ödemenizi henüz göremedik" deyin.
- Her e-postada çözüm yolu sunun: soru varsa kime yazılacağı, ödeme nasıl yapılacağı.
- Kademe ilerledikçe netliği artırın ama saygıyı azaltmayın.
- Müşterinin dilinde ve kültürel bağlamında yazın. Uluslararası müşterileriniz varsa şablonları dile göre ayırın.

## Yapay zeka bu sürece nasıl katkı sağlar?

Temel tahsilat otomasyonu kural tabanlı çalışır ve çoğu şirket için yeterlidir. Yapay zeka ise belirli noktalarda süreci daha akıllı hale getirebilir:

- **Yanıt sınıflandırma:** Hatırlatma e-postalarına gelen yanıtları bir yapay zeka düğümüne gönderip sınıflandırabilirsiniz: "ödeme yapıldı", "ödeme sözü", "itiraz", "yanlış kişi", "otomatik yanıt". Ödeme sözü içeren yanıtlardan tarih bilgisini çıkarıp ilgili alana yazmak, dizinin o tarihe kadar otomatik olarak duraklatılmasını sağlar.
- **Ton kişiselleştirme:** Müşterinin geçmiş ödeme davranışına göre mesaj tonunu ayarlamak. Yıllardır düzenli ödeme yapan ve ilk kez geciken bir müşteriyle sürekli geciken bir müşteriye aynı dille yazılmamalıdır.
- **Gecikme riski tahmini:** Geçmiş ödeme verilerinden yola çıkarak hangi faturaların gecikme ihtimalinin yüksek olduğunu tahmin etmek ve bu müşterilere ön hatırlatmayı daha erken göndermek.

Burada önemli bir uyarı var: Yapay zekanın ürettiği mesajları, özellikle ilk haftalarda, gönderilmeden önce bir insanın onayına sunun. n8n'deki onay akışları ya da Slack üzerinden "onayla/reddet" butonları bu iş için oldukça kullanışlıdır.

## Hangi hatalardan kaçınmak gerekir?

Tahsilat otomasyonu kuran ekiplerin sık karşılaştığı sorunlar şunlardır:

1. **Test ortamı olmadan canlıya geçmek:** İlk çalıştırmada tüm açık faturalara aynı anda e-posta gitmesi ciddi bir itibar riski yaratır. İş akışını önce tüm e-postaları kendi adresinize yönlendirerek birkaç gün test edin.
2. **Geçmiş faturaları göz ardı etmek:** Sistemi kurduğunuz gün 60 gün gecikmiş bir fatura varsa, hangi kademeden başlayacağını önceden belirleyin. Aksi halde bu müşteriye "ödemeniz 1 gün gecikti" gibi tutarsız bir mesaj gidebilir.
3. **Kısmi ödemeleri yanlış işlemek:** Toplam tutar yerine kalan bakiye üzerinden hatırlatma yapın. 48.000 TL'lik faturanın 40.000 TL'sini ödemiş bir müşteriye tam tutarı hatırlatmak gereksiz bir sürtüşme yaratır.
4. **Fatura iletişim kişisini güncel tutmamak:** Satın alma birimindeki kişi değiştiğinde hatırlatmalar boşa gider. Geri dönen (bounce) e-postaları yakalayıp hesap yöneticisine bildiren küçük bir kol eklemek bu sorunu çözer.
5. **Kişisel verilerin korunmasını göz ardı etmek:** Fatura ve iletişim verileri kişisel veri içerir. n8n'i kendi sunucunuzda barındırıyorsanız erişim yetkilerini sınırlayın; bulut sürümü kullanıyorsanız veri işleme koşullarını KVKK açısından hukuk ekibinizle değerlendirin.
6. **Satış ekibini sürecin dışında bırakmak:** Hesap yöneticileri müşteriye neyin gönderildiğini bilmezse, bir toplantıda müşterinin "bize neden bu kadar sert bir e-posta attınız" sorusuyla hazırlıksız karşılaşabilirler.

Tahsilat süreci, satış sonrası müşteri yolculuğunun ayrılmaz bir parçasıdır. Onboarding, kullanım takibi ve yenileme süreçleriyle birlikte ele alındığında çok daha tutarlı bir müşteri deneyimi ortaya çıkar. Bu bütüncül yaklaşım için [n8n ile satış sonrası B2B müşteri takip süreçleri otomasyonu](/blog/n8n-ile-satis-sonrasi-b2b-musteri-takip-surecleri-otomasyonu) yazımıza da göz atabilirsiniz.

## Başarıyı hangi metriklerle ölçmeli?

Otomasyonu kurduktan sonra etkisini düzenli olarak ölçmek gerekir. Takip edilmesi önerilen metrikler:

- **Ortalama tahsilat süresi (DSO):** Faturanın kesilmesinden ödemenin alınmasına kadar geçen ortalama gün sayısı. Otomasyonun en doğrudan etkilediği göstergedir.
- **Vadesinde ödenen fatura oranı:** Ön hatırlatmanın etkisini görmek için kullanışlıdır.
- **Kademelere göre kapanma oranı:** Faturaların ne kadarı kademe 1'de, ne kadarı kademe 3'te kapanıyor? Çoğu kademe 1'de kapanıyorsa sorun muhtemelen unutkanlık ya da süreçtir; kademe 3'e kadar uzanıyorsa nakit sıkıntısı ya da memnuniyetsizlik gibi daha derin nedenler olabilir.
- **30 günü aşan alacak tutarı:** Yönetim raporlarında ayrı izlenmesi gereken kritik bir göstergedir.
- **Manuel müdahale gerektiren fatura sayısı:** Ekibin bu sürece harcadığı zamanın dolaylı bir ölçüsüdür.

Bu metrikleri n8n ile haftalık olarak derleyip yönetime otomatik bir özet rapor olarak gönderebilirsiniz. Satış ve gelir metriklerini birlikte nasıl kurgulayacağınızı merak ediyorsanız [B2B satış ekibi KPI'ları rehberimiz](/blog/b2b-satis-ekibi-kpi-rehberi) faydalı bir çerçeve sunar.

Tahsilat verisi aynı zamanda satış stratejisi için de değerli bir sinyaldir. Sürekli geç ödeme yapan müşteri profillerini tanımak, ideal müşteri profilinizi daha isabetli tanımlamanıza ve gelecekteki pipeline'ınızı daha sağlıklı müşterilerle doldurmanıza yardımcı olur. Bu tür veri odaklı satış ve hedefleme konusunda [veri odaklı B2B satış ve lead generation hizmeti sunan Sales Corner](https://salescorner.co) ekibiyle de çalışabilirsiniz.

## Maliyeti ne kadar?

n8n ile tahsilat takip otomasyonunun maliyeti üç kalemden oluşur:

- **n8n lisansı veya barındırma:** n8n'in topluluk sürümü ücretsizdir ve kendi sunucunuzda barındırabilirsiniz. Bu durumda yalnızca küçük bir sunucunun aylık maliyetini ödersiniz. Bulut sürümü ise iş akışı çalıştırma sayısına göre aylık abonelik ücretiyle sunulur. Günde bir kez çalışan bir tahsilat akışı, düşük kademeli planların limitleri içinde rahatlıkla kalır.
- **Entegre edilen araçlar:** Muhasebe yazılımınız, CRM'iniz ve e-posta altyapınız zaten mevcutsa ek maliyet genellikle yoktur. Yapay zeka katmanı eklerseniz, kullanılan dil modelinin API maliyeti işlem hacmine bağlı olarak eklenir. Tahsilat e-postası yanıtları gibi düşük hacimli işlerde bu maliyet genellikle sınırlı kalır.
- **Kurulum emeği:** Temel bir akış, n8n deneyimi olan biri tarafından birkaç gün içinde kurulabilir. Yapay zeka sınıflandırması, webhook entegrasyonları ve çok para birimli yapılar eklendiğinde süre uzar. Asıl zaman alan kısım çoğunlukla teknik kurulum değil; hatırlatma takviminin, istisnaların ve şablonların finans ve satış ekipleriyle birlikte netleştirilmesidir.

Karşılaştırma için şunu düşünmek faydalı olur: Finans ekibinizden birinin haftada birkaç saatini tahsilat takibine ayırdığını varsayarsak, bu sürenin büyük kısmı otomasyonla serbest kalır. Buna nakit akışındaki iyileşmenin finansman maliyetine etkisi de eklendiğinde, yatırımın kendini kısa sürede amorti etmesi olasıdır.

## Sık sorulan sorular

### n8n ile tahsilat takibi için muhasebe yazılımımın API'si olması şart mı?

Hayır, şart değil. API yoksa açık faturaları düzenli olarak bir Google Sheets dosyasına, Excel'e ya da veritabanına aktarıp n8n'in bu kaynağı okumasını sağlayabilirsiniz. Ancak API entegrasyonu, verinin her zaman güncel olmasını sağladığı için ödenmiş faturalara yanlışlıkla hatırlatma gitme riskini önemli ölçüde azaltır.

### Otomatik hatırlatmalar müşteri ilişkisine zarar verir mi?

Doğru kurgulandığında genellikle tam tersi olur. Tutarlı, nazik ve bilgilendirici hatırlatmalar profesyonel bir izlenim bırakır ve müşterinin faturayı unutmasını engeller. Zarar, genellikle itiraz eden müşterilerin filtrelenmemesi, kısmi ödemelerin yanlış hesaplanması ya da çok sık mesaj gönderilmesi gibi kurulum hatalarından kaynaklanır.

### Stratejik müşterilere de otomatik e-posta gönderilmeli mi?

Bu tamamen müşteri ilişkinizin yapısına bağlıdır. Pek çok şirket büyük ve stratejik müşterilerde ilk hatırlatmayı hesap yöneticisinin kişisel olarak yapmasını tercih eder. Bu durumda n8n müşteriye e-posta göndermek yerine yalnızca hesap yöneticisine görev ve bildirim oluşturur. Böylece otomasyonun takip disiplini korunurken iletişim kişisel kalır.

### Ödeme yapıldığında hatırlatmaların durduğundan nasıl emin olabilirim?

En güvenilir yöntem, ödeme altyapınızdan veya bankanızdan gelen webhook bildirimleriyle fatura durumunu anlık güncellemektir. Webhook desteği yoksa, her e-posta gönderiminden hemen önce faturanın güncel durumunu tekrar kontrol eden bir adım ekleyin. Ayrıca gönderim kayıtlarını tutarak hangi faturaya hangi kademede mesaj gittiğini her zaman denetleyebilirsiniz.

## Sonuç

Vadesi geçen tahsilatların takibi, çoğu B2B şirkette hâlâ manuel, düzensiz ve kişilere bağımlı yürüyen bir süreçtir. n8n ile kurulan bir otomasyon her faturayı aynı kurallarla takip eder, müşteriye doğru zamanda doğru tonda ulaşır, satış ve finans ekiplerini aynı bilgiyle buluşturur ve yalnızca gerçekten müdahale gerektiren durumları insanlara bırakır. Başarının anahtarı teknik kurulumdan çok, istisnaların doğru tanımlanması, şablonların özenle yazılması ve sistemin canlıya alınmadan önce titizlikle test edilmesidir.

Tahsilat, satış sonrası ya da CRM süreçlerinizi n8n ile otomatikleştirmek ve ekibinizin zamanını gerçekten değer yaratan işlere ayırmak istiyorsanız, [Corner Group ekibiyle iletişime geçin](/iletisim). Süreçlerinizi birlikte analiz edelim ve size özel bir otomasyon yol haritası çıkaralım.
