/* ÖRNEK modu (yalnız api-base boş + yerel/pages.dev host): sahte veri, sahte sağlayıcı, durum seçici. Üretimde indirilmez. */
(function(S){'use strict';if(!S)return;
var d=document,$=S.$,D=S.D,RM=S.RM,TONLAR=S.TONLAR,kopru=S.kopru,durdur=S.durdur,konuHata=S.konuHata,alanHata=S.alanHata,hedef=S.hedef,hedefHataEl=S.hedefHataEl,formNot=S.formNot,dlg=S.dlg,teklifKapat=S.teklifKapat,tForm=S.tForm,bForm=S.bForm,bTamam=S.bTamam,bRiza=S.bRiza,bRizaHata=S.bRizaHata,bEposta=S.bEposta,rizaYaz=S.rizaYaz,uretMesgul=S.uretMesgul,sonucGoster=S.sonucGoster,goster=S.goster,durum=S.durum,esle=S.esle,odakla=S.odakla,konu=S.konu,konuGuncelle=S.konuGuncelle,plSec=S.plSec,duvarGoster=S.duvarGoster,yukle=S.yukle,teklifAc=S.teklifAc,epostaBak=S.epostaBak,teklifBitti=S.teklifBitti,rizaHata=S.rizaHata,bekleBitti=S.bekleBitti,hataGoster=S.hataGoster;
/* ---- ÖRNEK veri: sahte, sabit ---- */
var ACILAR=[
 {id:'hikaye',no:'01',ad:'Hikâye',alt:'Bir anla açılır, bir dersle kapanır.',
  kanca:{
   samimi:'Geçen salı saat 23.40’ta telefonum titredi: yüzüncü sipariş. Sevinmek yerine ilk müşterimizin bize yazdığı o kısa mesajı hatırladım.',
   profesyonel:'Bu hafta yüzüncü müşterimizle çalışmaya başladık. Bu eşiğe gelirken en çok işimize yarayan şey, ilk müşterimizden gelen tek satırlık bir geri bildirim oldu.',
   ogretici:'Yüz müşteriye ulaşmak on sekiz ay sürdü. Yolun başında bilmek istediğim tek şeyi, ilk müşterimizin yazdığı tek satırlık bir mesaj öğretti.',
   cesur:'Yüzüncü müşteriyi kutlamadık. Çünkü asıl dönüm noktası yüzüncü değil, bizi neredeyse bırakacak olan birinci müşteriydi.'},
  govde:['Mesaj şuydu: “Ürün güzel ama kargoyu üç gün bekledim, bir daha düşünürüm.”',
   'O gün iki şey yaptık. Önce kendisini arayıp özür diledik. Sonra kargo sürecini baştan yazdık: sipariş 14.00’ten önce geldiyse aynı gün çıkıyor.',
   'Bugün her beş müşterimizden biri tekrar sipariş veriyor. Reklam bütçemiz hâlâ küçük; büyüten şey, o ilk şikâyeti ciddiye almak oldu.'],
  ek:'Bunu yazarken eski mesajları yeniden okudum. İlk on müşterinin yedisi bugün hâlâ bizimle. Rakamdan çok bu oran içimi rahatlatıyor.',
  kapanis:'Sizin işinizi değiştiren ilk geri bildirim neydi?'},
 {id:'liste',no:'02',ad:'Liste',alt:'Taranabilir maddeler; kaydetmelik.',
  kanca:{
   samimi:'100 müşteriye ulaştık. Yolda yanlış bildiğimiz çok şey çıktı; en çok işe yarayan dört tanesini yazıyorum, belki birinin on sekiz ayını kısaltır.',
   profesyonel:'Yüzüncü müşteri eşiğini geçtik. Bu süreçte ölçerek doğruladığımız dört uygulamayı, benzer aşamadaki ekipler için özetliyorum.',
   ogretici:'İlk 100 müşteriye giden yolda işe yarayan dört şey var. Hiçbiri bütçe gerektirmiyor; dördü de ilk hafta uygulanabilir.',
   cesur:'İlk 100 müşteri için anlatılanların çoğu işe yaramaz. Bizde işe yarayan yalnızca dört şey vardı.'},
  govde:['1. İlk on müşteriyi tek tek aradık. Anket göndermedik; sorduk, dinledik, not aldık.\n2. Teslim süresini ürün sayfasının en üstüne yazdık. Soru sayısı yarıya indi.',
   '3. Her şikâyete aynı gün döndük. Çözemesek bile “gördük, ilgileniyoruz” dedik.',
   '4. Ayda bir, bizi bırakan bir müşteriye neden gittiğini sorduk. En değerli toplantımız bu oldu.'],
  ek:'Bir de yapmadığımız şey var: ilk 100 müşteriye kadar indirim kampanyası açmadık. İndirimle gelen, indirimle gidiyor.',
  kapanis:'Listeye siz ne eklerdiniz?'},
 {id:'gorus',no:'03',ad:'Görüş',alt:'Net bir tez; yorum çağırır.',
  kanca:{
   samimi:'Bence küçük işletmelerin en büyük hatası, müşteri sayısını kutlayıp müşterinin geri gelip gelmediğine bakmamak. Biz de aynısını yaptık.',
   profesyonel:'Müşteri sayısı tek başına sağlıklı bir büyüme göstergesi değil. Yüzüncü müşterimize ulaşırken asıl izlediğimiz ölçü tekrar sipariş oranıydı.',
   ogretici:'Yeni müşteri sayısı ile büyümeyi karıştırmak kolay. Aradaki farkı tek bir oran gösterir: müşterileriniz geri geliyor mu?',
   cesur:'“100 müşteri” bir başarı değil, bir sayı. Başarı, o yüz kişiden kaçının ikinci kez geldiği.'},
  govde:['Yeni müşteri bulmak pahalı ve gürültülü bir iştir. Herkes bunu konuşur, çünkü görünür olan budur.',
   'Sessiz olan kısım ise şu: memnun kalan müşteri kimseye haber vermeden geri gelir. Kırgın müşteri de kimseye haber vermeden gider.',
   'Bu yüzden artık aylık toplantımıza yeni müşteri sayısıyla değil, geri gelenlerin oranıyla başlıyoruz.'],
  ek:'Bu bakış herkese uymayabilir. Tek seferlik satış yapan işlerde tablo farklıdır; orada tavsiye oranı aynı görevi görür.',
  kapanis:'Katılmıyorsanız nedenini duymak isterim.'}
];
var SEKTOR={'Yazılım':'yazilim','Danışmanlık':'hizmet','Eğitim':'hizmet','Sağlık':'hizmet'};
function setKur(ham){return ham.map(function(x,i){var b=ACILAR[i],k={};TONLAR.forEach(function(t,j){k[t[0]]=x.k[j]});
 return {id:b.id,no:b.no,ad:b.ad,alt:b.alt,kanca:k,govde:x.g,ek:x.e,kapanis:x.s,reels:x.r,etiket:x.h}})}
var SETLER={li:{ticaret:ACILAR,
 yazilim:setKur([
  {k:['Yüzüncü ücretli hesap açıldığında ekipçe ekrana baktık, kimse bir şey demedi. Hepimiz aynı şeyi düşünüyorduk: ilk demoda ürün çökmüştü.',
   'Bu ay yüzüncü ücretli müşterimize ulaştık. Bu eşiğe gelmemizi sağlayan karar, ilk demoda yaşadığımız bir çöküşün ardından verildi.',
   'B2B yazılımda ilk 100 ücretli müşteri, ürünün değil kurulum deneyiminin sınavıdır. Bunu ilk demomuzda acı yoldan öğrendik.',
   'İlk demomuzda ürün çöktü. Bugün yüzüncü ücretli müşterimiz var ve o çöküş başımıza gelen en iyi şeydi.'],
   g:['Müşteri adayı nazikçe “kurulumu siz yapınca bir daha bakalım” dedi.','O hafta özellik geliştirmeyi durdurduk. Kurulumu 40 dakikadan 6 dakikaya indirdik; ilk girişte örnek veriyle dolu bir ekran gösterdik.','Denemeden ücretliye geçiş oranı o günden beri iki katı. Yeni özellik eklemeden.'],
   e:'O müşteri adayı üç ay sonra geri döndü. Bugün en çok geri bildirim veren hesaplardan biri.',s:'Siz en çok neyi ertelediniz: özelliği mi, kurulumu mu?'},
  {k:['100 ücretli hesaba ulaştık. Bize zaman kazandıran dört alışkanlığı yazıyorum; erken aşamadaki bir ekibe faydası olursa ne mutlu.',
   'Yüzüncü ücretli müşteri eşiğini geçtik. Erken aşamada büyümeyi en çok etkileyen dört uygulamayı ölçümlerimizle özetliyorum.',
   'İlk 100 ücretli müşteriye ulaşan B2B ekiplerin çoğunda dört ortak alışkanlık var. Hiçbiri büyük bir pazarlama bütçesi istemiyor.',
   'İlk 100 ücretli müşteri için yol haritası gerekmez. Dört alışkanlık yeter; gerisi gürültü.'],
   g:['1. Her yeni hesabın ilk haftasında kurucu olarak bir görüşme yaptık.\n2. Destek taleplerini haftalık ürün toplantısında ilk sıraya koyduk.','3. Fiyat sayfasında tek paket bıraktık. Karar süresi kısaldı.','4. Kaybettiğimiz her hesaba “neyi farklı yapsak kalırdınız?” diye yazdık.'],
   e:'Yapmadığımız şey: ilk 100 hesaba kadar ücretsiz plan açmadık. Ücretsiz kullanıcının isteği bizi yanlış yöne çekiyordu.',s:'Listeye siz hangi alışkanlığı eklerdiniz?'},
  {k:['Bence erken aşamadaki yazılım ekiplerinin en büyük yanılgısı, yeni özelliğin yeni müşteri getireceğini sanmak. Biz de uzun süre böyle düşündük.',
   'Erken aşamada büyümeyi belirleyen şey özellik sayısı değil, ilk haftadaki etkinleşme oranıdır. Yüzüncü müşteriye bu ölçüyü izleyerek ulaştık.',
   'Özellik eklemek ile ürünü büyütmek aynı şey değil. Farkı tek bir ölçü gösterir: yeni hesaplar ilk hafta değer görüyor mu?',
   'Yol haritanızdaki özelliklerin yarısını silin. Yüzüncü müşteriye o yarıyla değil, açılan boşlukla ulaşırsınız.'],
   g:['Yeni özellik görünürdür; duyurusu yapılır, ekibe moral verir.','Etkinleşme ise sessizdir: kullanıcı ürünü bir kez anlamlı biçimde kullanır ve geri gelir. Ya da hiç gelmez.','Bu yüzden sprint planlamasına artık “bu iş ilk haftayı kolaylaştırıyor mu?” sorusuyla başlıyoruz.'],
   e:'Kurumsal satışta tablo biraz farklı; orada satın alma süreci de ürünün parçası.',s:'Sizce erken aşamada hangi ölçü daha belirleyici?'}]),
 hizmet:setKur([
  {k:['Yüzüncü danışanımızla ilk görüşmeyi yaptığım gün defterimin ilk sayfasını açtım. İlk danışanımın sorduğu soru hâlâ orada yazıyordu.',
   'Bu ay yüzüncü danışanımızla çalışmaya başladık. Bu noktaya getiren değişiklik, ilk danışanımızın sorduğu basit bir soruyla başladı.',
   'Hizmet işinde ilk 100 danışan, uzmanlığınızdan çok anlatma biçiminizi sınar. Bunu bana ilk danışanımın tek bir sorusu öğretti.',
   'İlk danışanım ikinci görüşmeye gelmedi. Yüzüncü danışana o gelmeyen görüşme sayesinde ulaştık.'],
   g:['Sorusu şuydu: “Bu süreç bitince elimde ne olacak?”','Cevabım uzun ve belirsizdi. O akşam her hizmet için tek sayfalık bir yol haritası yazdım: kaç görüşme, hangi çıktı, hangi tarih.','Bugün yeni danışanların çoğu bu sayfayı görüp karar veriyor. Tavsiyeyle gelenlerin oranı da arttı.'],
   e:'O ilk danışan bir yıl sonra yeniden yazdı. Bu kez yol haritasını görüp hemen başladı.',s:'Hizmetinizi tek sayfada anlatabiliyor musunuz?'},
  {k:['100 danışana ulaştık. Bize en çok zaman kazandıran dört küçük değişikliği paylaşıyorum; belki sizin de işinize yarar.',
   'Yüzüncü danışan eşiğini geçtik. Hizmet kalitesini ve tavsiye oranını en çok etkileyen dört uygulamayı özetliyorum.',
   'Danışanla çalışan küçük ekipler için ilk 100 danışana giden yolda dört uygulama var. Hepsi bir haftada kurulur.',
   'Daha çok içerik üretmek size danışan getirmez. Bizi 100 danışana dört sıkıcı alışkanlık getirdi.'],
   g:['1. Her ilk görüşmeden sonra aynı gün yazılı bir özet gönderdik.\n2. Randevu hatırlatmasını ikiye çıkardık: bir gün ve bir saat önce.','3. Fiyatı ilk görüşmede açıkça söyledik; sürpriz kalmadı.','4. Süreç bitince tek soru sorduk: “Bizi kime önerirdiniz?”'],
   e:'Yapmadığımız şey: indirimli paket satmadık. İndirimle gelen danışan süreci yarıda bırakıyordu.',s:'Sizin vazgeçilmez alışkanlığınız hangisi?'},
  {k:['Bence hizmet işinde en çok hafife alınan şey, ilk görüşmeden sonraki 24 saat. Biz de yıllarca bu süreyi boş bıraktık.',
   'Hizmet işinde büyümeyi belirleyen ölçü yeni danışan sayısı değil, tavsiyeyle gelenlerin oranıdır. Yüzüncü danışana bu ölçüyle ulaştık.',
   'Uzmanlık ile güven aynı şey değil. Danışanın gözünde güveni çoğu zaman ilk görüşmeden sonraki küçük adımlar kurar.',
   'Sertifika duvarınız kimseyi ikna etmiyor. İnsanları ikna eden, ilk görüşmeden sonra ne kadar hızlı döndüğünüz.'],
   g:['Uzmanlık görünürdür; unvanda, sertifikada, web sitesinde yazar.','Güven ise sessizdir: söz verilen saatte gelen bir özet, unutulmayan bir ayrıntı, açıkça söylenen bir fiyat.','Bu yüzden ekibimizde ilk ölçü artık “kaç danışan geldi?” değil, “kaçı bizi önerdi?”.'],
   e:'Bu bakış her hizmete uymayabilir; acil müdahale gereken alanlarda hız tek başına belirleyicidir.',s:'Sizce danışan güvenini en çok ne kurar?'}])}};

/* ---- mock durum seçici: 37 durum (404 → /404.html), seçici + #d=durum ---- */
var ORNEK_KONU='İlk 100 müşteriye ulaştık';
function sifirla(){
  durdur();konuHata('');alanHata(hedef,hedefHataEl,'');formNot('');
  if(dlg.open)teklifKapat();
  tForm.reset();
  bForm.reset();bForm.hidden=false;bTamam.hidden=true;bTamam.textContent='';
  alanHata(bRiza,bRizaHata,'');alanHata(bEposta,$('#b-eposta-hata'),'');rizaYaz();
  uretMesgul(false);D.scope='anon';D.deneme=0;D.refine=0;D.kartVar=false;D.left=3;D.rid=null;D.taslaklar=null;
}
function kartlarKur(n){D.left=n;D.taslaklar=SETLER.li[SEKTOR[D.sektor]]||SETLER.li.ticaret;sonucGoster(false)}
function bosGoster(){goster('bos',false);durum('Konunu yaz; aynı konuya üç ayrı açıdan taslak gelsin.')}
function mock(v){
  sifirla();
  /* 404: statik sayfa /404.html */
  if(v==='404'){location.href='/404.html';return}
  /* tutarlı görünüm: konu boşsa örnek konu dolar; boş durumlara dönünce geri alınır */
  if(/^(bos|hata-alan|limit-yakinda|vazgecildi)/.test(v)){if(D.ornekKonu&&konu.value===ORNEK_KONU)konu.value='';D.ornekKonu=false}
  else if(!konu.value.trim()){konu.value=ORNEK_KONU;konu.lang='tr';D.ornekKonu=true}
  konuGuncelle();
  plSec('li');
  var k0=D.kartApi;
  switch(v){
  case 'bos':bosGoster();break;
  case 'bos-hak0':duvarGoster('anon',false);break;
  case 'hata-alan':bosGoster();konuHata('Konu boş. Ne hakkında yazacağını bir cümleyle anlat.');break;
  case 'yukleniyor':yukle(0,true);break;
  case 'yukleniyor-8':yukle(8,true);break;
  case 'yukleniyor-20':yukle(20,true);break;
  case 'vazgecildi':bosGoster();durum('Vazgeçildi.');break;
  case 'sonuc':kartlarKur(2);break;
  case 'sonuc-1':kartlarKur(1);break;
  case 'sonuc-0':kartlarKur(0);break;
  case 'duzenlendi':kartlarKur(2);D.kartApi[0].kisalt();break;
  case 'duzenleme-hata':kartlarKur(2);D.kartApi[0].hata();break;
  case 'duzenleme-sinir':D.refine=9;kartlarKur(2);D.kartApi[0].sinir();break;
  case 'kopya-elle':kartlarKur(2);D.kartApi[0].elle();break;
  case 'hata-too_large':bosGoster();konuHata('Metin çok uzun. Konuyu 300 karaktere indir.');break;
  case 'hata-slow_down':bosGoster();formNot('İstek çok hızlı geldi. Birkaç saniye sonra tekrar dene.');kopru.hidden=true;break;
  case 'kapasite':D.left=2;duvarGoster('kapasite',false);break;
  case 'teklif-hata':kartlarKur(2);teklifAc('result',null);epostaBak($('#t-eposta'),$('#t-eposta-hata'));break;
  case 'teklif-tamam':kartlarKur(2);teklifAc('result',null);teklifBitti();break;
  case 'teklif-gonderim-hata':kartlarKur(2);teklifAc('result',null);$('#t-eposta').value='ad@sirket.com';$('#t-hata').textContent='Gönderilemedi. Alanları kontrol edip tekrar dene.';break;
  case 'bekleme-riza':duvarGoster('anon',false);bEposta.value='ad@sirket.com';rizaHata(false);break;
  case 'bekleme-tamam':duvarGoster('anon',false);bekleBitti(false);break;
  default:
    if(v.indexOf('hata-')===0)hataGoster(v.slice(5),false);
    else if(v.indexOf('limit-')===0)duvarGoster(v.slice(6),false);
    else bosGoster();
  }
  esle(v);
}

/* sahte sağlayıcı: prototipteki gecikmeler (1800/420/400/600 ms) */
function gec(ms,v){return new Promise(function(r){setTimeout(function(){r(v)},RM&&ms<1000?0:ms)})}
S.provKur({
  linkedin:function(q){return gec(1800).then(function(){return{drafts:SETLER.li[SEKTOR[q.sector]]||SETLER.li.ticaret}})},
  refine:function(){return gec(420,{})},
  quota:function(){return gec(400).then(function(){return{left:D.left}})},
  submit:function(){return gec(600,{ok:true})}
});

/* durum seçici (prototipteki #durumlar; DOM API ile) */
var OPS=["bos","bos-hak0","hata-alan","yukleniyor","yukleniyor-8","yukleniyor-20","vazgecildi","sonuc","sonuc-1","sonuc-0","duzenlendi","duzenleme-hata","duzenleme-sinir","kopya-elle","hata-bad_input","hata-too_large","hata-origin","hata-bot","hata-slow_down","hata-refused","hata-refused-charged","hata-llm_fail","hata-llm_fail-charged","hata-llm_busy","hata-ag","hata-zaman","limit-anon","limit-ip","limit-global","kapasite","limit-yakinda","teklif-hata","teklif-tamam","teklif-gonderim-hata","bekleme-riza","bekleme-tamam","404"];
function yazi(s){return d.createTextNode(s)}
var sec=d.createElement('section'),pn=d.createElement('p'),gs=d.createElement('strong'),cd=d.createElement('code'),lb=d.createElement('label'),sel=d.createElement('select');
sec.className='proto';sec.id='durumlar';sec.tabIndex=-1;sec.setAttribute('aria-label','Prototip durum seçici');
pn.className='proto-not';gs.textContent='Prototip';cd.textContent='#d=durum';
pn.appendChild(gs);pn.appendChild(yazi(' · Tüm metinler örnektir; hiçbir şey gönderilmez, yapay zekâ çağrılmaz. Her durum '));pn.appendChild(cd);pn.appendChild(yazi(' bağlantısıyla da açılır.'));
lb.htmlFor='mock-durum';lb.textContent='Durum';sel.id='mock-durum';
OPS.forEach(function(v){var o=d.createElement('option');o.value=v;o.textContent=v;sel.appendChild(yazi('\n    '));sel.appendChild(o)});sel.appendChild(yazi('\n  '));
[yazi('\n  '),pn,yazi('\n  '),lb,yazi('\n  '),sel,yazi('\n')].forEach(function(n){sec.appendChild(n)});
d.body.insertBefore(sec,$('#teklif'));d.body.insertBefore(yazi('\n\n'),$('#teklif'));
sel.addEventListener('change',function(){
  var v=sel.value;mock(v);
  try{history.replaceState(null,'','#d='+v)}catch(e){location.hash='d='+v}
});
S.mockKur(mock);S.hashOku();
})(window.SMC);
