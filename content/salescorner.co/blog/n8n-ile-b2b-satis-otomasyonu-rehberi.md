---
title: "n8n ile B2B Satış Otomasyonu: Başlangıç Rehberi"
description: "n8n ile B2B satış otomasyonu: lead toplama, CRM senkronizasyonu, takip e-postaları ve AI katmanı için adım adım rehber."
date: "2026-10-11"
updated: "2026-10-16"
category: "Otomasyon"
image: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "n8n ile B2B satış otomasyonu"
alt: "b2b-sales-automation-with-n8n-guide"
---
n8n ile B2B satış otomasyonu, satışın etrafındaki tekrar eden işleri iş akışlarına bağlamaktır: lead'i yakalayıp CRM'e yazmak, şirket bilgisini zenginleştirmek, lead'i doğru temsilciye yönlendirmek, takip hatırlatmaları açmak ve raporlamak. Sık tekrar eden, kuralları net ve hata maliyeti düşük bir süreçle başlayıp akışı adım adım genişletmek en güvenli yoldur.

B2B satış ekiplerinin zamanının önemli bir kısmı satışa değil, satışın etrafındaki işlere gidiyor: formdan gelen lead'i CRM'e girmek, şirket bilgisini araştırmak, toplantı öncesi not hazırlamak, takip e-postası göndermeyi hatırlamak, haftalık raporu derlemek. Bu işlerin her biri tek başına küçük. Toplandığında ise satış temsilcisinin haftasının ciddi bir bölümünü yiyebiliyor.

**n8n ile satış otomasyonu**, bu tekrar eden adımları birbirine bağlı iş akışlarına (workflow) dönüştürmek demek. Bu rehberde n8n'in ne olduğunu, satışta hangi süreçlerle başlamanız gerektiğini ve sağlam bir otomasyonun nasıl kurulduğunu adım adım anlatıyoruz.

## n8n Nedir?

n8n, uygulamaları ve servisleri görsel bir editörde birbirine bağlayarak iş akışları kurmanızı sağlayan açık kaynaklı bir otomasyon platformudur. Her akış "node" adı verilen adımlardan oluşur: bir tetikleyici (yeni form kaydı, yeni CRM fırsatı, belirli bir saat), ardından veriyi işleyen, karar veren ve aksiyon alan adımlar gelir.

Satış ekipleri açısından n8n'i öne çıkaran üç özellik var:

- **Esneklik:** Hazır entegrasyonların yanında HTTP isteği ve kod node'larıyla API'si olan hemen her araca bağlanabilirsiniz.
- **Veri kontrolü:** Kendi sunucunuzda (self-hosted) çalıştırabildiğiniz için müşteri verisi üçüncü bir otomasyon platformunda tutulmak zorunda değil.
- **AI node'ları:** Büyük dil modellerini akışın içine bir adım olarak yerleştirip sınıflandırma, özetleme ve metin üretimi yaptırabilirsiniz.

## Satışta Hangi Süreçlerle Başlamalı?

Her şeyi aynı anda otomatikleştirmeye çalışmak, otomasyon projelerinin en sık yarım kalma nedeni. Başlangıç için şu üç kriteri taşıyan süreçleri seçin: **sık tekrar ediyor**, **kuralları net** ve **hata maliyeti düşük**. Bu kriterlere en iyi uyan satış süreçleri şunlar:

1. **Lead yakalama ve CRM'e yazma:** Web formu, LinkedIn formu ya da etkinlik listesinden gelen kişiyi otomatik olarak CRM'e kaydetmek, mükerrer kayıtları birleştirmek.
2. **Veri zenginleştirme:** Kayıttaki şirket alan adından sektör, çalışan sayısı ve konum gibi bilgileri tamamlamak.
3. **Lead yönlendirme:** Bölgeye, şirket büyüklüğüne ya da ürüne göre lead'i doğru temsilciye atamak ve Slack/Teams üzerinden bildirmek.
4. **Takip hatırlatmaları:** Belirli bir süre aksiyon alınmayan fırsatlar için temsilciye görev açmak.
5. **Raporlama:** Haftalık pipeline özetini CRM'den çekip yöneticiye e-posta veya mesaj olarak göndermek. Bu raporun anlamlı olması için [pipeline aşamalarının net tanımlanmış olması](/blog/satis-pipeline-asamalari-nasil-tanimlanir) gerekir.

Bu beş akış kurulduğunda temsilcilerin manuel veri girişi genellikle azalır ve lead'lerin unutulma riski azalır.

## Sağlam Bir Satış Workflow'unun 5 Katmanı

Sales Corner'da kurduğumuz her satış otomasyonunu beş katmanlı bir mimariyle tasarlıyoruz. Bu yapı, akışın hem anlaşılır hem de bakımı kolay kalmasını sağlıyor:

1. **Tetikleyici:** Akışı başlatan olay. Webhook, zamanlanmış görev ya da bir uygulamadaki değişiklik olabilir.
2. **Veri zenginleştirme:** Gelen kaydın eksik alanlarını tamamlamak. Sonraki adımların karar kalitesi bu katmana bağlıdır.
3. **AI katmanı:** Lead'i sınıflandırmak, öncelik puanı vermek (puanlama modelini [B2B lead scoring rehberimizde](/blog/b2b-lead-scoring-nasil-yapilir) anlattık) ya da kişiselleştirilmiş bir taslak üretmek gibi yorum gerektiren işler.
4. **Aksiyon:** CRM'i güncellemek, e-posta taslağı oluşturmak, görev açmak, bildirim göndermek.
5. **Loglama:** Her çalıştırmanın sonucunu kaydetmek. Bir şey ters gittiğinde neyin, ne zaman, neden olduğunu görebilmek için şart.

Katmanları ayrı tutmanın faydası, birini değiştirdiğinizde diğerlerinin etkilenmemesi. Örneğin veri sağlayıcınızı değiştirdiğinizde yalnızca zenginleştirme katmanını güncellersiniz.

## Örnek Akış: Formdan Gelen Lead'i 2 Dakikada Değerlendirmek

Somut bir örnek üzerinden gidelim. Hedef: web sitesindeki demo formunu dolduran kişinin, birkaç dakika içinde doğru temsilciye, hazır bir özetle ulaşması.

1. **Webhook node'u** form gönderimini yakalar (ad, e-posta, şirket, mesaj).
2. **Filtre adımı** kişisel e-posta adreslerini (gmail, hotmail vb.) ayrı bir kuyruğa ayırır.
3. **HTTP isteği node'u** şirket alan adı üzerinden firma bilgilerini çeker.
4. **AI node'u** formdaki mesajı ve firma bilgisini okuyup lead'i "sıcak / ılık / soğuk" olarak sınıflandırır ve tek paragraflık bir özet yazar.
5. **CRM node'u** kişiyi ve şirketi oluşturur ya da günceller, sınıflandırmayı bir alana yazar.
6. **Switch node'u** sıcak lead'leri ilgili temsilciye anlık bildirimle iletir; diğerlerini besleme (nurturing) dizisine ekler.
7. **Log adımı** çalıştırma sonucunu bir tabloya kaydeder.

Bu akış kurulduktan sonra temsilci, bildirimi aldığında kişiyi araştırmakla vakit kaybetmez; özet, firma bilgisi ve öncelik zaten önündedir.

## AI Katmanını Doğru Kullanmak

Yapay zeka satış otomasyonunu güçlendirir, ancak kontrolsüz bırakıldığında hızla hata da çoğaltır. Şu kuralları uygulamanızı öneriyoruz:

- **Yapılandırılmış çıktı isteyin.** Modelden serbest metin yerine belirli alanları olan JSON isteyin; böylece sonraki node'lar çıktıyı güvenle işleyebilir.
- **Kararı sınırlayın.** Modelin seçebileceği değerleri baştan tanımlayın ("sıcak", "ılık", "soğuk" gibi). Açık uçlu kararlar tutarsızlık üretir.
- **Müşteriye giden metinlerde insan onayı tutun.** AI'ın yazdığı e-postayı doğrudan göndermek yerine CRM'de taslak olarak bırakın; temsilci gözden geçirip göndersin.
- **Gerekli veriyi gönderin, fazlasını değil.** Modele yalnızca görev için gereken alanları iletin; kişisel verileri gereksiz yere paylaşmayın. Soğuk e-postada kişisel verinin yasal sınırları için [KVKK rehberimize](/blog/kvkk-uyumlu-soguk-eposta-yasal-sinirlar) bakabilirsiniz.

Yapay zekanın soğuk e-posta yazımında nasıl kullanılacağını ayrıntılı merak ediyorsanız [yapay zekayla soğuk e-posta yazma rehberimize](/blog/yapay-zekayla-soguk-eposta-nasil-yazilir) göz atabilirsiniz. n8n ve yapay zekayla çalışan hazır bir örnek görmek isterseniz [Sekans Yazarı aracımız](/sekans-yazari) video, PDF veya web sitesinden outreach dizisi üretiyor.

## Sık Yapılan Hatalar

Aşağıdaki hataların daha geniş bir resmini [satış otomasyonu projelerinin neden başarısız olduğunu anlattığımız yazıda](/blog/satis-otomasyonu-projesi-neden-basarisiz-olur) bulabilirsiniz.

- **Hata yönetimini atlamak:** Bir API geçici olarak yanıt vermediğinde akış sessizce durur. Her kritik akışa bir hata akışı (error workflow) bağlayın ve başarısız çalıştırmalar için bildirim alın.
- **Mükerrer kayıtları kontrol etmemek:** CRM'e yazmadan önce e-posta veya alan adına göre arama yapmazsanız aynı kişi birden fazla kez oluşturulur.
- **Tek dev akış kurmak:** Her şeyi tek bir workflow'a sığdırmak bakımı zorlaştırır. İşleri küçük, tek amaçlı akışlara bölün ve gerektiğinde birbirini çağırmalarını sağlayın.
- **Ölçmemek:** Otomasyondan önce ve sonra lead'e ilk dönüş süresini, manuel veri girişine harcanan zamanı ve dönüşüm oranını ölçmezseniz kazancı kanıtlayamazsınız.

## Sık sorulan sorular

### n8n kullanmak için yazılım bilgisi gerekir mi?

Temel akışlar görsel editörde, kod yazmadan kurulabilir. Özel veri dönüşümleri veya hazır entegrasyonu olmayan araçlar için JavaScript ya da HTTP istekleri bilgisi işinizi kolaylaştırır.

### n8n hangi CRM'lerle çalışır?

HubSpot, Pipedrive, Salesforce ve Zoho gibi yaygın CRM'ler için hazır node'lar bulunur. API'si olan diğer CRM'lere de HTTP isteği node'uyla bağlanabilirsiniz.

### Satış otomasyonu satış temsilcisinin yerini alır mı?

Hayır. Otomasyon veri girişi, araştırma ve hatırlatma gibi tekrar eden işleri üstlenir. İlişki kurmak, ihtiyacı anlamak ve anlaşmayı kapatmak temsilcinin işi olmaya devam eder; otomasyon ona bunun için zaman açar.

### İlk otomasyon ne kadar sürede devreye alınır?

Lead yakalama ve CRM'e yazma gibi tek amaçlı bir akış, araçlara erişim hazırsa genellikle birkaç gün içinde test edilip devreye alınabilir. Çok adımlı ve AI katmanı içeren akışlar daha uzun test süresi gerektirir.

Sales Corner'ın satış otomasyonu ve outbound alanında neler yaptığını [hizmetler sayfamızda](/hizmetler) görebilirsiniz.

## Sonuç

n8n ile B2B satış otomasyonu, satış ekibinizin zamanını tekrar eden işlerden alıp müşteriyle geçirilen zamana aktarmanın en pratik yollarından biri. Küçük ve net bir süreçle başlayın, beş katmanlı yapıyı koruyun, AI'ı sınırları belirli görevlerde kullanın ve her adımı ölçün.

Satış süreçlerinizi AI ve n8n ile uçtan uca otomatikleştirmek istiyorsanız Sales Corner ekibi yanınızda. Aynı altyapıyla çalışan modülleri [Sales Corner modül panelinde](/dashboard) görebilirsiniz; örneğin [Toplantı Briefing aracı](/briefing) görüşme öncesi firma ve kişi araştırmasını otomatik hazırlar. Mevcut akışınızı birlikte inceleyip hangi adımların otomasyona en uygun olduğunu belirlemek için [bizimle iletişime geçin](/iletisim).
