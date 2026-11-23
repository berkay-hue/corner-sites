/* EN katmanı (yalnız /en/): statik metin derlemede çevrildi; JS'in yazdığı TR metin ve aria-label/placeholder/title/data-genis
   sözlükle çevrilir (prototip YON-KARAR §5.2 motoru). Taslak gövdeleri (.metin) ve Reels kancası çevrilmez. */
(function(){'use strict';var d=document;
var EN={
/* A5-4 taslak geçmişi notu */'Geçmiş’e kaydedildi.':'Saved to History.','Geçmişi aç':'Open History',
/* A4-2c marka sesi */'yok':'none','Ekle':'Add','Düzenle':'Edit','adsız profil':'unnamed profile','Bu tarayıcı saklamaya izin vermiyor; sekme kapanınca silinir.':'This browser doesn’t allow storage; the profile is deleted when the tab closes.','Marka sesi kaydedildi.':'Brand voice saved.','Marka sesi silindi.':'Brand voice deleted.','Marka sesi kabul edilmedi. Profili düzenleyip tekrar dene.':'The brand voice wasn’t accepted. Edit the profile and try again.','Marka adı en çok 60 karakter olabilir.':'Brand name can be up to 60 characters.','Bu ad kullanılamaz. Kendi markanın adını yaz.':'This name can’t be used. Enter your own brand’s name.','Hedef kitle en çok 160 karakter olabilir.':'Target audience can be up to 160 characters.','En çok 3 sıfat seç.':'Choose up to 3 adjectives.','En çok 10 yasak kelime yaz.':'Enter up to 10 banned words.','Her yasak kelime en çok 30 karakter olabilir.':'Each banned word can be up to 30 characters.','Yasak kelimelerde | işaretini kullanma.':'Don’t use the | character in banned words.','Örnek gönderi en çok 600 karakter olabilir.':'Sample post can be up to 600 characters.','Profil çok uzun. Marka adı, hedef kitle, yasak kelimeler ve örnek gönderi toplamı en çok 1200 karakter olabilir.':'The profile is too long. Brand name, audience, banned words and sample post can total up to 1200 characters.','Profil boş. En az bir alanı doldur.':'The profile is empty. Fill in at least one field.','ÖRNEK: Bu taslaklar örnek marka sesi profiliyle istendi.':'SAMPLE: These drafts were requested with the sample brand voice profile.',
'© 2026 Social Media Corner, bir Corner Group şirketi':'© 2026 Social Media Corner, a Corner Group company','… devamı':'… more','… devamını gör':'… see more',
'· Tüm metinler örnektir; hiçbir şey gönderilmez, yapay zekâ çağrılmaz. Her durum':'· All text is sample; nothing is sent and no AI is called. Each state also opens with the','bağlantısıyla da açılır.':'link.',
'(isteğe bağlı)':'(optional)','(zorunlu)':'(required)','Koyu tema':'Dark theme','Açık tema':'Light theme','Koyu temaya geç':'Switch to dark theme','Açık temaya geç':'Switch to light theme','Örn. demo talebi gelsin':'E.g. get demo requests','Örn. İlk 100 müşteriye ulaştık':'E.g. we reached our first 100 customers','Örn. İlk 100 müşteriye ulaştık':'E.g. We reached our first 100 customers',
'Örnek konular':'Sample topics','Prototip durum seçici':'Prototype state picker','Sahte örnek metin':'Fake sample text','Social Media Corner Taslak Masası, ana sayfa':'Social Media Corner Draft Desk, home','Taslak brifi':'Draft brief',
'Tekrar dene, 1 hak':'Try again, 1 credit','Ton değiştir':'Change tone','Üç taslak üret, 1 hak':'Write three drafts, 1 credit','Yazılıyor…':'Writing…','Yeniden üret, 1 hak':'Regenerate, 1 credit','1 hak':'1 credit',
'3 taslak hazır.':'3 drafts ready.','Hak düşmedi.':'No credit used.','Hak: belli değil':'Credits: unknown','1 hak kullanır':'Uses 1 credit','Hakkın düşmedi.':'No credit used.','Bu deneme 1 hak kullandı.':'This attempt used 1 credit.','Açık rıza.':'Explicit consent.','Açılış için bekleme listesi':'Waitlist for the launch','Ad':'Name',
'Ad ve rol ekle (isteğe bağlı)':'Add name and role (optional)','Ajans':'Agency','aracın günlük toplamı':'the tool’s daily total','Araç açılınca ilk sen haber al.':'Be the first to hear when the tool opens.',
'Araç henüz açılmadı.':'The tool isn’t open yet.','Açılınca haber verelim mi?':'Shall we let you know when it opens?',
'Araç şu an yeni taslak üretemiyor. Ne zaman açılacağı henüz belli değil; daha sonra yeniden deneyebilirsin.':'The tool can’t write new drafts right now. We don’t know yet when it will reopen; you can try again later.',
'Aradığın adres taşınmış ya da hiç olmamış olabilir.':'The address may have moved, or may never have existed.','Aydınlatma metni':'Privacy notice','Bağlantı yok.':'No connection.','bağlantıya ait':'per connection',
'Beğendiğini kopyala, kendi sesinle bitir.':'Copy the one you like and finish it in your own voice.','Beklemek istemezsen ekipten teklif alabilirsin.':'If you’d rather not wait, you can get a quote from the team.','belli değil':'not known yet',
'Bilgilerin yalnız teklif hazırlamak için kullanılır.':'Your details are used only to prepare the quote.','Bir anla açılır, bir dersle kapanır.':'Opens with a moment, closes with a lesson.','Bir cümle yeter.':'One sentence is enough.','Bir sorun oldu.':'Something went wrong.',
'Bir şey yapman gerekmez; yarın 3 hak yeniden açılır.':'You don’t need to do anything; 3 credits open again tomorrow.','Beklemek istemezsen iki seçenek daha var, ikisi de isteğe bağlı.':'If you’d rather not wait, there are two more options, both optional.',
'Biraz uzun sürdü; taslaklar hâlâ hazırlanıyor.':'This is taking a while; your drafts are still on the way.','BİZ YAPALIM':'DONE FOR YOU','Bu alanı boş bırak':'Leave this field empty',
'Bu araç ilk taslağı yazar.':'This tool writes the first draft.','Strateji, görsel üretim ve hesap yönetimi Social Media Corner ekibinde kalır.':'Strategy, visuals and account management stay with the Social Media Corner team.',
'Bu bağlantı bugün doldu':'This connection is full today','Bu bağlantıdan bugün çok üretim yapıldı (ortak ağlarda olur).':'A lot of drafts were made from this connection today (it happens on shared networks).','Bu bir prototip — veriler örnek.':'This is a prototype — the data is sample.',
'Bu gönderiyle ne olsun istiyorsun?':'What should this post achieve?','En çok 200 karakter.':'200 characters at most.','En çok 300 karakter.':'300 characters at most.','Sınıra ulaştın.':'You’ve reached the limit.','Bu konuyla taslak üretilemedi, konuyu değiştir.':'No drafts could be written for this topic; change the topic.',
'Bu liste kaydırmalı bir görsele (carousel) dönüşebilir.':'This list could become a carousel.','Tasarımı bu araç yapmaz; ekip yapar.':'This tool doesn’t design it; the team does.','Bu sayfa yok.':'This page doesn’t exist.',
'Bu sefer olmadı':'It didn’t work this time','Bu sefer olmadı, tekrar dene.':'It didn’t work this time; try again.','Bu senin kullanımınla ilgili değil: aracın bugünkü toplam üretim payı bitti.':'This isn’t about your usage: the tool’s total share for today has run out.','Gece yarısı yenilenir.':'It renews at midnight.',
'Bu taslak yalnız metin.':'This draft is text only.','Yanına görsel gerekirse ekip hazırlar.':'If it needs a visual, the team makes it.','Bugün ürettiğin taslaklar yukarıda duruyor.':'The drafts you made today are above.','Kopyalamak hak istemez.':'Copying needs no credit.',
'Bugünkü 3 hakkını kullandın, gece yarısı yenilenir.':'You’ve used today’s 3 credits; they renew at midnight.','Bugünkü 9 düzenleme hakkın doldu; gece yarısı yenilenir.':'You’ve used today’s 9 edits; they renew at midnight.',
'Bugünkü kapasite doldu':'Today’s capacity is full','Bugünkü kapasite doldu.':'Today’s capacity is full.','Bugünlük bu kadar':'That’s it for today','Bugünlük kapalı':'Closed for today','Cesur':'Bold','Çok yakında':'Coming soon','Çok yakında.':'Coming soon.',
'Danışmanlık':'Consulting','Değiştir':'Change','Doğrulama tamamlanamadı.':'The check couldn’t be completed.','Doğrulamayı yeniledik; tekrar dene.':'We’ve reset it; try again.','Bir uygulamanın içindeki tarayıcıdaysan sayfayı Safari ya da Chrome’da aç.':'If you’re in a browser inside an app, open the page in Safari or Chrome.',
'Durum':'State','Durumlar':'States','Düğme, açık rıza kutusunu işaretleyince açılır.':'The button unlocks once you tick the explicit consent box.','Düzenlenemedi; taslağın aynı duruyor.':'Couldn’t edit it; your draft is unchanged.','Tekrar dene.':'Try again.',
'E-posta':'E-mail','E-posta adresimin açılış duyurusu için işlenmesini kabul ediyorum.':'I agree to my e-mail address being processed for the launch announcement.','E-posta adresimin hesaplı sürüm duyurusu için işlenmesini kabul ediyorum.':'I agree to my e-mail address being processed for the account-version announcement.',
'E-posta yaz; sana buradan ulaşacağız.':'Enter your e-mail; that’s how we’ll reach you.','E-posta adresi eksik görünüyor.':'That e-mail address looks incomplete.','Örn. ad@sirket.com':'E.g. name@company.com','E-ticaret':'E-commerce','Eğitim':'Education',
'Ekip e-postayla döner; teklif ihtiyaca göre hazırlanır.':'The team replies by e-mail; the quote is prepared around your needs.','Ekip e-postayla döner.':'The team replies by e-mail.','Ekipten teklif al':'Get a quote from the team','Seç':'Select','Diğer':'Other',
'Formu gönderirsin; konu metnin forma eklenmez.':'You send the form; your topic text is not attached.','Gayrimenkul':'Real estate','gece yarısı (İstanbul saati)':'midnight (Istanbul time)','Genel':'General','Geri al':'Undo','Geri alındı.':'Undone.',
'Gönderdiğin bilgi kabul edilmedi.':'What you sent wasn’t accepted.','Gönderilemedi.':'Couldn’t send.','Alanları kontrol edip tekrar dene.':'Check the fields and try again.','Kısa sürede çok gönderim oldu.':'Too many submissions in a short time.','Birkaç dakika sonra tekrar dene.':'Try again in a few minutes.','Biraz sonra tekrar dene.':'Try again a bit later.','Gönderiliyor…':'Sending…','Görüş':'Take',
'Görüş yazısı yorum getirir.':'A take brings comments.','Yorumları yanıtlamak hesap yönetimi işi; bu araçta yok, ekipte var.':'Replying to them is account management: not in this tool, but the team does it.','görüşme saati seç (yeni sekme)':'pick a time (new tab)',
'Hakkının düşüp düşmediği henüz belli değil.':'We can’t tell yet whether a credit was used.','Tekrar denersen aynı istek gider; hak iki kez düşmez.':'Trying again sends the same request; you won’t be charged twice.',
'Hatadan çıkan ders':'Lesson from a mistake','Hedef (isteğe bağlı)':'Goal (optional)','Hedef en çok 200 karakter olabilir.':'The goal can be 200 characters at most.','Her taslakta bir kat çizgisi görürsün:':'Each draft shows a fold line:',
'Hesaplı sürüm açılınca ilk sen haber al: marka sesi, takvim, ekip onayı.':'Be the first to hear when the account version opens: brand voice, calendar, team approval.','Hesaplı sürüm için bekleme listesi':'Waitlist for the account version','hiçbir şey':'nothing','Hikâye':'Story',
'Instagram akışında açıklamanın yalnız ilk ~125 karakteri görünür; gerisi “… devamı” ardında kalır.':'In the Instagram feed only the first ~125 characters of the caption show; the rest sits behind “… more”.','Reels için ayrıca ilk 3 saniyelik kanca metni gelir.':'For Reels you also get a hook for the first 3 seconds.',
'Instagram gönderin için hikâye, liste ve görüş; her birinde Reels kancası.':'A story, a list and a take for your Instagram post, each with a Reels hook.','İçeriğe geç':'Skip to content','İhtiyaca göre teklif gelir.':'You get a quote built around your needs.','Kabul etmek zorunda değilsin.':'You don’t have to accept it.',
'İlk 100 müşteri':'First 100 customers','İnternete bağlanınca tekrar dene.':'Try again once you’re online.','İstek çok hızlı geldi.':'That request came too fast.','Birkaç saniye sonra tekrar dene.':'Try again in a few seconds.','İşletme':'Business',
'Kapasite doldu':'Capacity is full','Kapasite doldu.':'Capacity is full.','Kapat':'Close','Kat çizgisi: Instagram akışında metin burada kesilir, devamı “devamı” ile açılır.':'Fold line: the Instagram feed cuts the text here; the rest opens with “more”.',
'Kat çizgisi: LinkedIn akışında metin burada kesilir, devamı “devamını gör” ile açılır.':'Fold line: the LinkedIn feed cuts the text here; the rest opens with “see more”.',
'Kesik çizgi kat çizgisidir: Instagram akışında ilk ~125 karakter görünür.':'The dashed line is the fold: the first ~125 characters show in the Instagram feed.','Reels kancası videonun ilk 3 saniyesinde ekrana yazılır.':'The Reels hook goes on screen in the first 3 seconds of the video.','Metinler örnektir; konuna göre değişmez.':'The texts are samples; they don’t change with your topic.',
'Kesik çizgi kat çizgisidir: LinkedIn akışında ilk ~210 karakter görünür.':'The dashed line is the fold: the first ~210 characters show in the LinkedIn feed.','Metinler örnektir; sektöre, tona ve platforma göre değişir, konuna göre değişmez.':'The texts are samples; they change with industry, tone and platform, not with your topic.',
'Kısalt':'Shorten','Kısaltıldı.':'Shortened.','Kısaltılıyor…':'Shortening…','Konu boş.':'The topic is empty.','Ne hakkında yazacağını bir cümleyle anlat.':'Say in one sentence what you want to write about.','Konu en çok 300 karakter olabilir.':'The topic can be 300 characters at most.',
'Konu metnin bu forma eklenmez.':'Your topic text is not attached to this form.','Konu metnin saklanmaz; taslak için yapay zekâ sağlayıcısına (ABD) iletilir.':'Your topic text is not stored; it is sent to an AI provider (USA) to produce the drafts.','Kişisel veri yazma.':'Don’t enter personal data.',
'Konu senden, üç taslak bizden.':'Your topic. Three drafts from us.','Konunu yaz; aynı konuya üç ayrı açıdan taslak gelsin.':'Write your topic; get drafts from three different angles.','Konuyu başka sözcüklerle ya da başka bir açıdan yaz.':'Put it in other words or take another angle.',
'Konuyu düzenle':'Edit topic','Konuyu kontrol edip tekrar dene.':'Check the topic and try again.','Kopyala':'Copy','Kopyalandı':'Copied','Kopyalanamadı.':'Couldn’t copy.','Metin aşağıdaki alanda seçili: Ctrl/Cmd + C ile ya da uzun basıp kopyala.':'The text is selected in the box below: copy it with Ctrl/Cmd + C or a long press.',
'Kopyalandı.':'Copied.','LinkedIn’e yapıştır, kendi sesinle bitir.':'Paste it into LinkedIn and finish it in your own voice.','Instagram açıklamasına yapıştır, kendi sesinle bitir.':'Paste it into your Instagram caption and finish it in your own voice.',
'Kullandığın':'Used','KVKK Aydınlatma Metni':'KVKK privacy notice','LinkedIn akışında yalnız çizginin üstü görünür; gerisi “… devamını gör” ardında kalır.':'In the LinkedIn feed only the part above the line shows; the rest sits behind “… see more”.','Yaklaşık ilk 210 karakter kancadır; kesin yer cihaza göre değişir.':'Roughly the first 210 characters are the hook; the exact spot depends on the device.',
'LinkedIn gönderin için hikâye, liste ve görüş.':'A story, a list and a take for your LinkedIn post.','Liste':'List','Listeye ekle':'Add me to the list','Listeye eklemek için açık rıza kutusunu işaretlemen gerekiyor.':'To join the list you need to tick the explicit consent box.','Ekleniyor…':'Adding…',
'Metin çok uzun.':'The text is too long.','Konuyu 300 karaktere indir.':'Cut the topic down to 300 characters.','Ne hakkında paylaşacaksın?':'What do you want to post about?','Net bir tez; yorum çağırır.':'A clear claim; it invites comments.',
'Ofis, okul ya da kafe ağında aynı bağlantıyı çok kişi kullanır; sınır kişiye değil bağlantıya aittir.':'In an office, school or café many people share one connection; the limit belongs to the connection, not the person.','Başka bir ağdan deneyebilir ya da gece yarısını bekleyebilirsin.':'You can try from another network or wait until midnight.',
'Öğretici':'Educational','ÖRNEK':'SAMPLE','Örnek:':'Examples:','ÖRNEK: gönderilmedi.':'SAMPLE: not sent.','Listeye eklendin.':'You’re on the list.','Hesaplı sürüm açılınca haber veririz.':'We’ll let you know when the account version opens.','Araç açılınca haber veririz.':'We’ll let you know when the tool opens.',
'Talebin ulaştı.':'We’ve received your request.','Paylaş':'Share','Platform, sektör, ton':'Platform, industry, tone','Profesyonel':'Professional','Prototip':'Prototype','Reels kancası · ilk 3 sn':'Reels hook · first 3 s','Rol':'Role','Sağlık':'Healthcare','Samimi':'Friendly',
'Sayfayı yenile':'Refresh page','Sayfayı yenileyip tekrar dene.':'Refresh the page and try again.','Sektör':'Industry','Senden istenen':'Asked of you','Serbest çalışan':'Freelancer','Sınır':'Limit',"Social Media Corner’a git":'Go to Social Media Corner',
"Social Media Corner’dan içerik ve kampanya e-postası da almak istiyorum.":'I’d also like content and campaign e-mails from Social Media Corner.','Son hakkın: bugün 3 hakkından 1 kaldı.':'Last credit: 1 of 3 left today.','Kısalt, Uzat ve Ton hak düşürmez.':'Shorten, Lengthen and Tone don’t use credits.',
'Sonra ne olur':'What happens next','Strateji, görsel üretim ve hesap yönetimi Social Media Corner ekibinde.':'Strategy, visuals and account management sit with the Social Media Corner team.','E-postanı bırak, markana göre teklif hazırlayalım.':'Leave your e-mail and we’ll prepare a quote for your brand.',
'Şimdiki üç taslak yenileriyle değişir.':'Your current three drafts will be replaced by new ones.','Şirket':'Company','Taranabilir maddeler; kaydetmelik.':'Skimmable points; worth saving.','Tarih henüz belli değil.':'No date yet.','Bu liste yalnız o duyuru için kullanılır.':'This list is used only for that announcement.',
'Taslak bir başlangıç. Gerisi ekip işi.':'A draft is a start. The rest is teamwork.','Taslak en kısa hâlinde; daha fazla kısalmaz.':'The draft is at its shortest; it won’t get any shorter.','Taslak en uzun hâlinde; daha fazla uzamaz.':'The draft is at its longest; it won’t get any longer.','Taslak zaten bu tonda.':'The draft is already in this tone.',
'Taslak Masası':'Draft Desk',"Taslak Masası’na dön":'Back to Draft Desk','Taslak metni (elle kopyala)':'Draft text (copy by hand)','Taslaklar hazırlanıyor…':'Preparing your drafts…','Taslaklar yazılıyor':'Writing your drafts','Taslaklar yazılıyor…':'Writing your drafts…',
'Taslakların':'Your drafts','Taslakların burada belirecek':'Your drafts will appear here','Teklif al':'Get a quote',"Teklif formunu socialmediacorner.co’da aç":'Open the quote form on socialmediacorner.co','Teklif iste':'Request a quote','Tekrar dene':'Try again',
'Ticari ileti izni (isteğe bağlı).':'Marketing permission (optional).','Ton':'Tone','Ton değişiyor…':'Changing tone…','Ton değişti.':'Tone changed.','Uzat':'Lengthen','Uzatıldı.':'Lengthened.','Uzatılıyor…':'Lengthening…','Üç taslak üret':'Write three drafts','Üretim':'Manufacturing',
'Vazgeç':'Cancel','Vazgeçildi.':'Cancelled.','Yanıt gelmedi.':'No response came back.','Yazılım':'Software','Yazmak yerine konuşmak istersen:':'Prefer to talk instead of writing?','Yeni ofis':'New office','Yeniden üret':'Regenerate','Yenilenme':'Renews',
'Yoğunluk var, 1 dakika sonra dene.':'It’s busy right now; try again in a minute.','Sınıra yakın.':'Near the limit.','Tamamı akışta görünür.':'All of it shows in the feed.',
'Taslak Masası · Social Media Corner — ÖRNEK mock (Yön 2: marka-önce)':'Draft Desk · Social Media Corner — SAMPLE mock (Direction 2: brand-first)'};
EN["Bu araç JavaScript ile çalışır."]="This tool runs on JavaScript.";EN["Taslak Masası · Social Media Corner"]="Draft Desk · Social Media Corner";
/* Faz 2 (A4-2a): Instagram açıklama aracı */
EN["Instagram açıklaman için hikâye, liste ve görüş."]="A story, a list and a take for your Instagram caption.";EN["En çok 5 etiket; sayaç emojiyi tek karakter sayar."]="Up to 5 hashtags; the counter counts an emoji as one character.";EN["Bu taslakta kaçınman gereken bir ifade olabilir; paylaşmadan önce kontrol et."]="This draft may contain a phrase you should avoid; check it before you share.";EN["Format, sektör, ton"]="Format, industry, tone";EN["Tekli gönderi"]="Single post";EN["Reels açıklaması"]="Reels caption";EN["Harekete çağrı (isteğe bağlı)"]="Call to action (optional)";EN["Yorum"]="Comment";EN["Profil"]="Profile";EN["Yok"]="None";EN["Kaydet"]="Save";EN["Araçlar"]="Tools";EN["LinkedIn gönderisi"]="LinkedIn post";EN["Instagram açıklaması"]="Instagram caption";EN["Instagram Açıklama Taslakları · Social Media Corner"]="Instagram Caption Drafts · Social Media Corner";
/* Faz 2 (A4-2b): Reels kanca aracı */
(function(){var r={'Reels videon için soru, iddia ve merak kancası.':'A question, a claim and a curiosity hook for your Reels video.',
'Ekran metni ilk 3 saniyede okunur: hedef 60, en çok 80 karakter. Konuşma satırı hedefi 140, en çok 200 karakter. Süre rozeti konuşma satırını saniyede ~2,5 kelimeyle hesaplar.':'On-screen text is read in the first 3 seconds: aim for 60, at most 80 characters. Aim for 140 characters on the spoken line, at most 200. The time badge counts the spoken line at ~2.5 words per second.',
'Reels’te izleyici ilk 3 saniyede kalır ya da kaydırır. Ekran metni videonun üstünde yazılı durur; konuşma satırını aynı anda kendi sesinle söylersin.':'On Reels, viewers stay or scroll within the first 3 seconds. The on-screen text sits over the video; you say the spoken line in your own voice at the same time.',
'Soru':'Question','İddia':'Claim','Merak':'Curiosity','Bir soruyla durdurur.':'Stops the scroll with a question.','Net bir iddiayla açılır.':'Opens with a bold claim.','Merak boşluğu bırakır.':'Leaves a curiosity gap.',
'Ekran metni':'On-screen text','Konuşma satırı':'Spoken line','Konuşma satırının yaklaşık süresi (saniyede ~2,5 kelime)':'Approximate length of the spoken line (~2.5 words per second)',
'Kısalt ve Ton hak düşürmez.':'Shorten and Tone don’t use credits.',
'Ekran metnini videoya ekle, konuşma satırını kendi sesinle söyle.':'Add the on-screen text to your video and say the spoken line in your own voice.',
'Bu taslak yalnız metin. Videoyu çekmek ve kurgulamak gerekirse ekip yapar.':'This draft is text only. If you need the video shot and edited, the team does it.','Videoyu çekmek ve kurgulamak gerekirse ekip yapar.':'If you need the video shot and edited, the team does it.',
'Sınırı aşıyor; kısalt.':'Over the limit; shorten it.','Hedeften uzun; Kısalt ile sıkılaştır.':'Longer than the target; tighten it with Shorten.',
'Yok':'None','Konuşma':'Talking','Ürün':'Product','Önce-sonra':'Before/after','Nasıl yapılır':'How-to','Video türü (isteğe bağlı)':'Video type (optional)','Video, sektör, ton':'Video, industry, tone',
'Reels kancası':'Reels hook','Instagram açıklaması':'Instagram caption','LinkedIn gönderisi':'LinkedIn post','Her taslakta 9:16 bir önizleme görürsün:':'Each draft shows a 9:16 preview:','Reels Kanca Taslakları · Social Media Corner':'Reels Hook Drafts · Social Media Corner'};
for(var k in r)if(!Object.prototype.hasOwnProperty.call(EN,k))EN[k]=r[k]})();
function virgul(s){return s.replace(/\./g,',')}
var ENR=[
 [/^([\d.]+) \/ ([\d.]+) karakter · akışta ilk ~(\d+) görünür$/,function(m,a,b,c){return virgul(a)+' / '+virgul(b)+' characters · first ~'+c+' show in the feed'}],
 [/^([\d.]+) \/ ([\d.]+) karakter · Tamamı akışta görünür\.$/,function(m,a,b){return virgul(a)+' / '+virgul(b)+' characters · All of it shows in the feed.'}],
 [/^(\d+) karakter kaldı\.$/,function(m,a){return a+(a==='1'?' character':' characters')+' left.'}],
 [/^Sınırı aşıyor: ([\d.]+) karakter kısalt\.$/,function(m,a){return 'Over the limit: cut '+virgul(a)+' characters.'}],
 [/^1 hak kullanır · bugün (\d+) hakkından (\d+) kaldı$/,'Uses 1 credit · $2 of $1 left today'],
 [/^1 hak kullanır · son hakkın: bugün (\d+) hakkından 1 kaldı$/,'Uses 1 credit · last one: 1 of $1 left today'],
 [/^Bugün (\d+) \/ (\d+) hak$/,'Today $1 / $2 credits'],[/^(\d+) \/ (\d+) hak$/,'$1 / $2 credits'],
 [/^Bugün (\d+) hakkından (\d+) kaldı\.$/,'$2 of $1 left today.'],
 [/^Kod: (.+) · İstek no: (.+)$/,'Code: $1 · Request no: $2'],
 [/^Kod: ([a-z_]+)$/,'Code: $1'],
 [/^Taslak (\d) eylemleri$/,'Draft $1 actions'],
 [/^~(\d+) sn$/,'~$1 s'],
 [/^Ekran metni ([\d.]+) \/ ([\d.]+) karakter$/,function(m,a,b){return 'On-screen text '+virgul(a)+' / '+virgul(b)+' characters'}],
 [/^konuşma ([\d.]+) \/ ([\d.]+) karakter$/,function(m,a,b){return 'spoken '+virgul(a)+' / '+virgul(b)+' characters'}],
 [/^gece yarısı \(İstanbul saati\), yaklaşık (\d+) sa (\d+) dk sonra$/,'midnight (Istanbul time), in about $1 h $2 min']];
function enTek(t){
  if(Object.prototype.hasOwnProperty.call(EN,t))return EN[t];
  for(var i=0;i<ENR.length;i++)if(ENR[i][0].test(t))return t.replace(ENR[i][0],ENR[i][1]);
  return null;
}
function enParca(t,ayir,bag){var p=t.split(ayir),ok=0;p=p.map(function(x){var y=enTek(x);if(y!=null){ok++;return y}return x});return ok?p.join(bag):null}
function enCevir(s){
  var m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s),t=m[2],r;if(!t)return null;
  r=enTek(t);
  if(r==null&&/[.?…] [A-ZÇĞİÖŞÜ]/.test(t))r=enParca(t.replace(/([.?…]) (?=[A-ZÇĞİÖŞÜ])/g,'$1\u0001'),'\u0001',' ');
  if(r==null&&t.indexOf(' · ')>0)r=enParca(t,' · ',' · ');
  return r==null?null:m[1]+r+m[3];
}
var ATR=['aria-label','placeholder','title','data-genis'],ATLA='script,style,noscript,textarea,.metin,.reels span,[data-sabit]',
    TRM=new WeakMap(),ENM=new WeakMap(),TRA=new WeakMap();
function atla(n){var e=n.nodeType===1?n:n.parentNode;return !e||!e.closest||!!e.closest(ATLA)}
function metinCevir(n){
  if(atla(n)||ENM.get(n)===n.data)return;
  var c=enCevir(n.data);if(c!=null&&c!==n.data){TRM.set(n,n.data);ENM.set(n,c);n.data=c}
}
function ozCevir(e){
  /* pf-3: textarea'nın içeriği (kullanıcı metni) atlanır ama placeholder'ı çevrilir */
  if(e.tagName==='TEXTAREA'?atla(e.parentNode):atla(e))return;
  ATR.forEach(function(a){
    if(!e.hasAttribute(a))return;var v=e.getAttribute(a),o=TRA.get(e)||{};if(o[a]&&o[a][1]===v)return;
    var c=enCevir(v);if(c!=null&&c!==v){o[a]=[v,c];TRA.set(e,o);e.setAttribute(a,c)}
  });
}
function agacCevir(k){
  if(k.nodeType===3){metinCevir(k);return}
  if(k.nodeType!==1||atla(k))return;
  ozCevir(k);
  var w=d.createTreeWalker(k,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:function(n){if(n.nodeType===1&&n.matches(ATLA)){if(n.tagName==='TEXTAREA')ozCevir(n);return NodeFilter.FILTER_REJECT}return NodeFilter.FILTER_ACCEPT}}),n;
  while((n=w.nextNode()))if(n.nodeType===3)metinCevir(n);else ozCevir(n);
}
function gozle(ms){ms.forEach(function(m){
  if(m.type==='characterData')metinCevir(m.target);
  else if(m.type==='attributes')ozCevir(m.target);
  else for(var i=0;i<m.addedNodes.length;i++)agacCevir(m.addedNodes[i]);
})}
agacCevir(d.body);
if(window.MutationObserver)new MutationObserver(gozle).observe(d.body,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:ATR});
})();
