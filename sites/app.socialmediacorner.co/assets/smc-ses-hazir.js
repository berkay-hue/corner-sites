/* Hazır marka sesleri (PLAN madde 1, A dilimi): girişsiz de seçilebilir. smc-ses.js'ten önce defer ile yüklenir.
   sector: stüdyo sektör çipi değeri (index.html name="sector"); tone: stüdyo ton çipi (samimi|profesyonel|ogretici|cesur).
   ornek: sunucuya <stil> olarak giden üslup örneği (yalnız ritim ve kelime düzeyi taklit edilir, içerik taşınmaz);
   yasak: "Kaçınılacak kelimeler" satırı. Metinler kurgusal; marka, kişi, rakam içermez. */
(function(){'use strict';
window.SMCSesHazir=[
  {id:'kurumsal-b2b',ad:{tr:'Kurumsal B2B',en:'Corporate B2B'},sector:'Danışmanlık',tone:'profesyonel',
   ozet:{tr:'Ölçülü, güven veren, kanıta dayalı.',en:'Measured, trustworthy, evidence-led.'},
   ornek:{tr:'Satın alma ekipleri artık karar vermeden önce ortalama üç farklı kaynaktan bilgi topluyor. Bu nedenle tekliflerimizde yalnız fiyatı değil, süreci de açıkça anlatıyoruz: kim, hangi adımda, hangi çıktıyı teslim ediyor. Netlik, uzun vadeli iş ortaklığının ilk şartı.\n\nSiz de tedarikçi seçerken hangi kriteri öne alıyorsunuz?',
          en:'Procurement teams now gather information from several sources before they decide. That is why our proposals explain the process, not just the price: who does what, at which step, and what gets delivered. Clarity is the first condition of a long-term partnership.\n\nWhich criterion do you put first when choosing a supplier?'},
   yasak:{tr:['kaçırma','şok','inanılmaz','bedava'],en:['don’t miss','shocking','unbelievable','free']}},
  {id:'samimi-kobi',ad:{tr:'Samimi KOBİ',en:'Friendly small business'},sector:'Genel',tone:'samimi',
   ozet:{tr:'Sıcak, yakın, “biz” diliyle.',en:'Warm, close, in a “we” voice.'},
   ornek:{tr:'Bu sabah dükkânı açarken aklımızda tek bir şey vardı: dün gelen o soru. “Bunu evde nasıl kullanırım?” Haklısın, anlatmamız lazım. Kısa bir rehber hazırladık, aşağıya bıraktık.\n\nSorusu olan herkes yazabilir, hepsini tek tek okuyoruz.',
          en:'When we opened the shop this morning, one thing was on our mind: yesterday’s question. “How do I use this at home?” Fair point, we should explain. We put together a short guide and left it below.\n\nAnyone with a question can write to us; we read every message.'},
   yasak:{tr:['sinerji','paradigma','kurumsal çözüm'],en:['synergy','paradigm','enterprise solution']}},
  {id:'teknik-uzman',ad:{tr:'Teknik uzman',en:'Technical expert'},sector:'Yazılım',tone:'ogretici',
   ozet:{tr:'Kesin, adım adım, terimleri açıklayan.',en:'Precise, step by step, explains terms.'},
   ornek:{tr:'Önbellek her sorunu çözmez. Önce darboğazı ölçün: yanıt süresinin ne kadarı veritabanında, ne kadarı ağda geçiyor? Sonra en sık okunan ve en seyrek değişen veriyi seçin. Geçersiz kılma kuralını yazmadan önbellek eklemek, hatayı ertelemektir.\n\n1. Ölç.\n2. Seç.\n3. Geçersiz kılmayı planla.',
          en:'Caching does not fix every problem. Measure the bottleneck first: how much of the response time is spent in the database, how much on the network? Then pick the data that is read most and changes least. Adding a cache before writing the invalidation rule only postpones the bug.\n\n1. Measure.\n2. Choose.\n3. Plan invalidation.'},
   yasak:{tr:['devrim niteliğinde','sihirli','mucize'],en:['revolutionary','magic','miracle']}},
  {id:'enerjik-eticaret',ad:{tr:'Enerjik e-ticaret',en:'Energetic e-commerce'},sector:'E-ticaret',tone:'cesur',
   ozet:{tr:'Hızlı, coşkulu, kısa cümleler.',en:'Fast, upbeat, short sentences.'},
   ornek:{tr:'Yeni sezon raflarda! Hafif, nefes alan, her güne uyan parçalar. Sepete ekle, yarın kapında.\n\nHangisi senin favorin? Yorumlara yaz, en çok seçileni hafta sonu öne çıkaralım.',
          en:'New season is in! Light, breathable pieces that fit every day. Add to cart, it’s at your door tomorrow.\n\nWhich one is your favourite? Tell us in the comments and we’ll feature the top pick this weekend.'},
   yasak:{tr:['son şans','garantili','kaçırma'],en:['last chance','guaranteed','act now']}},
  {id:'sakin-danisman',ad:{tr:'Sakin danışman',en:'Calm advisor'},sector:'Danışmanlık',tone:'samimi',
   ozet:{tr:'Dingin, düşündüren, acele etmeyen.',en:'Calm, thoughtful, unhurried.'},
   ornek:{tr:'Her karar hemen verilmek zorunda değil. Bazen en doğru adım, bir hafta bekleyip veriyi yeniden okumaktır. Görüştüğümüz ekiplerde en sık gördüğümüz şey, hızın netliğin önüne geçmesi.\n\nBu hafta ertelediğiniz bir karar var mı? Belki de doğru olanı yaptınız.',
          en:'Not every decision has to be made right away. Sometimes the right step is to wait a week and read the data again. The pattern we see most often in the teams we work with is speed getting ahead of clarity.\n\nIs there a decision you put off this week? Maybe you did the right thing.'},
   yasak:{tr:['acil','hemen şimdi','kaçırmayın'],en:['urgent','right now','hurry']}},
  {id:'egitici',ad:{tr:'Eğitici',en:'Educational'},sector:'Eğitim',tone:'ogretici',
   ozet:{tr:'Açık, örnekli, öğreten.',en:'Clear, example-driven, teaching.'},
   ornek:{tr:'Bir konuyu gerçekten öğrendiğinizi nasıl anlarsınız? Başkasına beş dakikada anlatabiliyorsanız. Bugün bunu deneyin: öğrendiğiniz son kavramı bir kâğıda üç cümleyle yazın. Takıldığınız yer, tekrar etmeniz gereken yerdir.\n\nKüçük bir ipucu: örnek vermeden anlatmayın.',
          en:'How do you know you have really learned something? When you can explain it to someone else in five minutes. Try it today: write the last concept you learned in three sentences. Where you get stuck is what you need to review.\n\nA small tip: never explain without an example.'},
   yasak:{tr:['kolay para','kesin sonuç','hile'],en:['easy money','guaranteed results','hack']}}
];
})();
