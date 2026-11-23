(function(){
'use strict';
var d=document,root=d.documentElement;
function $(s,r){return (r||d).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))}
function el(t,c,x){var e=d.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
var RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
var nf=new Intl.NumberFormat('tr-TR');
/* Mod kapısı (A0 §2): api-base boş + yerel/pages.dev host → ÖRNEK (ornek.js); yerel/pages.dev'de #ornek ya da #d=… inceleme bağlantısı dolu api-base'te de ÖRNEK açar.
   Diğer her durumda gerçek sağlayıcı (gercekProv, corner-forms worker'ı); api-base boşsa not_ready → Çok yakında + bekleme listesi. */
var API=(($('meta[name="api-base"]')||{}).content||'').trim().replace(/\/+$/,''),TS=(($('meta[name="turnstile-sitekey"]')||{}).content||'').trim(),
    MOCKHOST=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)||/\.pages\.dev$/.test(location.hostname),
    ORNEK=MOCKHOST&&(!API||/(^|&)(ornek|d|durum)(=|&|$)/.test(location.hash.slice(1))),mockFn=null,T0=Date.now();
function hd(){return Promise.reject({kod:'not_ready'})}
/* sağlayıcı arayüzü: linkedin(req), refine(req), quota(), submit(sayfa, alanlar), olay(kind, src)? → Promise; hata {kod, scope?, charged?, left?, cap?, reset_at?} */
var prov={linkedin:hd,instagram:hd,refine:hd,quota:hd,submit:hd};
/* Faz 2 (A4-2a): araç body[data-arac]'tan; yoksa 'li' (LinkedIn akışı değişmez). 'ig' → /gen/instagram kind:caption */
/* Faz 2 (A4-2b): 'reels' → /gen/instagram kind:reels (format/cta yok, video isteğe bağlı) */
var ARAC=({ig:'ig',reels:'reels'})[d.body.getAttribute('data-arac')]||'li';

/* ---- sabit veri ---- */
var TONLAR=[['samimi','Samimi'],['profesyonel','Profesyonel'],['ogretici','Öğretici'],['cesur','Cesur']];
var PL={
 li:{ad:'LinkedIn',sinir:3000,kat:210,devam:'… devamını gör',giris:'LinkedIn gönderin için hikâye, liste ve görüş.',
  ipucu:'Kesik çizgi kat çizgisidir: LinkedIn akışında ilk ~210 karakter görünür. Metinler örnektir; sektöre, tona ve platforma göre değişir, konuna göre değişmez.',
  bos:'LinkedIn akışında yalnız çizginin üstü görünür; gerisi “… devamını gör” ardında kalır. Yaklaşık ilk 210 karakter kancadır; kesin yer cihaza göre değişir.'},
 /* cp: sayım ve kesim kod noktasıyla (sunucu IG_MAX.caption 2200 kod noktası; emoji tek karakter) */
 ig:{ad:'Instagram',sinir:2200,kat:125,devam:'… devamı',cp:true,giris:'Instagram açıklaman için hikâye, liste ve görüş.',
  ipucu:'Kesik çizgi kat çizgisidir: Instagram akışında ilk ~125 karakter görünür. En çok 5 etiket; sayaç emojiyi tek karakter sayar.',
  bos:'Instagram akışında açıklamanın yalnız ilk ~125 karakteri görünür; gerisi “… devamı” ardında kalır.'},
 /* reels: ekran metni (text, sunucu IG_MAX.hook 80, hedef 60) + konuşma satırı (say, 200, hedef 140); kat yok */
 reels:{ad:'Instagram Reels',sinir:80,kat:80,devam:'',cp:true,reels:true,giris:'Reels videon için soru, iddia ve merak kancası.',
  ipucu:'Ekran metni ilk 3 saniyede okunur: hedef 60, en çok 80 karakter. Konuşma satırı hedefi 140, en çok 200 karakter. Süre rozeti konuşma satırını saniyede ~2,5 kelimeyle hesaplar.',
  bos:'Reels’te izleyici ilk 3 saniyede kalır ya da kaydırır. Ekran metni videonun üstünde yazılı durur; konuşma satırını aynı anda kendi sesinle söylersin.'},
};
var ACIS=[{"id":"hikaye","no":"01","ad":"Hikâye","alt":"Bir anla açılır, bir dersle kapanır."},{"id":"liste","no":"02","ad":"Liste","alt":"Taranabilir maddeler; kaydetmelik."},{"id":"gorus","no":"03","ad":"Görüş","alt":"Net bir tez; yorum çağırır."}],ACI={hikaye:ACIS[0],liste:ACIS[1],gorus:ACIS[2]};
var ACIS_R=[{id:'soru',no:'01',ad:'Soru',alt:'Bir soruyla durdurur.'},{id:'iddia',no:'02',ad:'İddia',alt:'Net bir iddiayla açılır.'},{id:'merak',no:'03',ad:'Merak',alt:'Merak boşluğu bırakır.'}],ACI_R={soru:ACIS_R[0],iddia:ACIS_R[1],merak:ACIS_R[2]};
/* okuma süresi: kelime / ~2,5 kelime/sn, en az 1 sn (12 kelime → 4,8 → ~5 sn) */
function reelsSn(t){var k=String(t||'').trim().split(/\s+/).filter(Boolean).length;return Math.max(1,Math.round(k/2.5))}
/* G5 hata sözlüğü (K:575-592). e: eylem türü. sunucu = yeni istek, "Tekrar dene │ 1 hak"; istemci = aynı rid, bedelsiz */
var HATA={
 bad_input:{b:'Gönderdiğin bilgi kabul edilmedi.',m:'Konuyu kontrol edip tekrar dene.',e:'duzenle'},
 origin:{b:'Bir sorun oldu.',m:'Sayfayı yenileyip tekrar dene.',e:'yenile'},
 bot:{b:'Doğrulama tamamlanamadı.',m:'Doğrulamayı yeniledik; tekrar dene. Bir uygulamanın içindeki tarayıcıdaysan sayfayı Safari ya da Chrome’da aç.',e:'sunucu'},
 refused:{b:'Bu konuyla taslak üretilemedi, konuyu değiştir.',m:'Konuyu başka sözcüklerle ya da başka bir açıdan yaz.',e:'duzenle'},
 llm_fail:{b:'Bu sefer olmadı, tekrar dene.',m:'',e:'sunucu'},
 llm_busy:{b:'Yoğunluk var, 1 dakika sonra dene.',m:'',e:'sunucu'},
 ag:{b:'Bağlantı yok.',m:'İnternete bağlanınca tekrar dene.',e:'istemci'},
 zaman:{b:'Yanıt gelmedi.',m:'',e:'istemci'},
 genel:{b:'Bir sorun oldu.',m:'Biraz sonra tekrar dene.',e:'sunucu'}
};
/* G6 (K:604-611). reset_at örnek sabit; canlı geri sayım yok */
var YEN='gece yarısı (İstanbul saati), yaklaşık 5 sa 20 dk sonra';
var DUVAR={
 anon:{h:'Bugünlük bu kadar',b:'Bugünkü 3 hakkını kullandın, gece yarısı yenilenir.',m:'Bir şey yapman gerekmez; yarın 3 hak yeniden açılır. Beklemek istemezsen iki seçenek daha var, ikisi de isteğe bağlı.',d:[['Kullandığın','3 / 3 hak'],['Yenilenme',YEN],['Senden istenen','hiçbir şey']]},
 ip:{h:'Bu bağlantı bugün doldu',b:'Bu bağlantıdan bugün çok üretim yapıldı (ortak ağlarda olur).',m:'Ofis, okul ya da kafe ağında aynı bağlantıyı çok kişi kullanır; sınır kişiye değil bağlantıya aittir. Başka bir ağdan deneyebilir ya da gece yarısını bekleyebilirsin.',d:[['Sınır','bağlantıya ait'],['Yenilenme',YEN],['Senden istenen','hiçbir şey']]},
 global:{h:'Bugünkü kapasite doldu',b:'Bugünkü kapasite doldu.',m:'Bu senin kullanımınla ilgili değil: aracın bugünkü toplam üretim payı bitti. Gece yarısı yenilenir.',d:[['Sınır','aracın günlük toplamı'],['Yenilenme',YEN],['Senden istenen','hiçbir şey']]},
 kapasite:{h:'Kapasite doldu',b:'Kapasite doldu.',m:'Araç şu an yeni taslak üretemiyor. Ne zaman açılacağı henüz belli değil; daha sonra yeniden deneyebilirsin.',d:[['Yenilenme','belli değil'],['Senden istenen','hiçbir şey']]},
 yakinda:{h:'Çok yakında',b:'Çok yakında.',m:'Araç henüz açılmadı. Açılınca haber verelim mi?',d:[]}
};
/* ?src= eşlemesi (KAYNAK) */
var KAYNAK={top:'top',error:'error',limit:'limit',footer:'footer',result:'result',cap:'cap',calendly:'calendly'};
var HIZMET=['Bu taslak yalnız metin. Yanına görsel gerekirse ekip hazırlar.','Bu liste kaydırmalı bir görsele (carousel) dönüşebilir. Tasarımı bu araç yapmaz; ekip yapar.','Görüş yazısı yorum getirir. Yorumları yanıtlamak hesap yönetimi işi; bu araçta yok, ekipte var.'];

/* ---- durum ---- */
var D={view:'bos',left:3,cap:3,scope:'anon',tone:'samimi',pl:'li',refine:0,onceki:'bos',hata:'llm_fail',kartVar:false,kartApi:[],deneme:0,timers:[],istek:0,taslaklar:null,rid:null,anon:null};
var P={bos:$('#p-bos'),yukleniyor:$('#p-yukleniyor'),sonuc:$('#p-sonuc'),hata:$('#p-hata'),duvar:$('#p-duvar')};
var BAS={bos:'Taslakların burada belirecek',yukleniyor:'Taslaklar yazılıyor',sonuc:'Taslakların',hata:'Bu sefer olmadı',duvar:'Bugünlük bu kadar'};
var form=$('#form'),konu=$('#konu'),konuHataEl=$('#konu-hata'),uretBtn=$('#uret'),hedef=$('#hedef')||el('input'),hedefHataEl=$('#hedef-hata')||el('p'); /* IG sayfasında hedef alanı yok: bağsız yedek */
var baslik=$('#sonuc-baslik'),durumEl=$('#durum'),sonucKol=$('#sonuc'),kartlar=$('#kartlar');
var cikislar=$('#cikislar'),kopru=$('#kopru'),uyari=$('#uyari'),yenidenBtn=$('#yeniden');
var cBiz=$('section[aria-labelledby="c-biz"]',cikislar),cBizBtn=$('button',cBiz);

function durum(t){durumEl.textContent=t}
function durdur(){D.istek++;D.timers.forEach(clearTimeout);D.timers=[]}
function zaman(fn,ms){D.timers.push(setTimeout(fn,RM&&ms<1000?0:ms))}
function odakla(o,kaydir){
  if(!o)return;try{o.focus({preventScroll:true})}catch(e){o.focus()}
  if(kaydir!==false&&o.scrollIntoView)o.scrollIntoView({block:'start',behavior:RM?'auto':'smooth'});
}
function pasif(b){return b.getAttribute('aria-disabled')==='true'}
function formNot(m){var f=$('#form-not');f.textContent=m||'';f.hidden=!m}
function hakYaz(){
  /* tur-1: istemci hatasında (ag, zaman) hakkın düşüp düşmediği bilinmez; sayı uydurulmaz (K: /gen/quota yanıtsızsa yalnız "1 hak kullanır") */
  var bel=!!D.hakBilinmez||D.view==='hata'&&(HATA[D.hata]||HATA.genel).e==='istemci',sc=D.view==='duvar'?D.scope:'';
  /* tur-4: "Çok yakında"da hak sayılmaz; dolu 3/3 göstergesi "Araç henüz açılmadı" ile çelişir */
  $$('.pips').forEach(function(p){p.classList.toggle('pips-gizli',!!(bel||sc==='yakinda'));$$('i',p).forEach(function(i,n){i.className=n<D.left?'dolu':''})});
  var kapali=sc==='ip'||sc==='global',ust='Bugün '+D.left+' / '+D.cap+' hak',alt;
  if(sc==='yakinda'){ust='Çok yakında';alt='Araç henüz açılmadı.'}
  else if(kapali){ust='Bugünlük kapalı';alt=DUVAR[sc].b}
  else if(bel){ust='Hak: belli değil';alt='1 hak kullanır'}
  else if(D.left<=0)alt='Bugünkü '+D.cap+' hakkını kullandın, gece yarısı yenilenir.';
  else if(D.left===1)alt='1 hak kullanır · son hakkın: bugün '+D.cap+' hakkından 1 kaldı';
  else alt='1 hak kullanır · bugün '+D.cap+' hakkından '+D.left+' kaldı';
  $('#hak-ust').textContent=ust;$('#hak-alt').textContent=alt;
  /* D5: hak yokken düğme pasif görünür ama odaklanabilir kalır; tıklanınca nedenini söyler. Kapasitede ana düğme etkin kalır */
  var kilit=D.left<=0||kapali||sc==='yakinda';
  if(D.view!=='yukleniyor')uretBtn.setAttribute('aria-disabled',kilit?'true':'false');
  yenidenBtn.setAttribute('aria-disabled',kilit?'true':'false');
  /* tur-3: taslak varken ana düğme de onları değiştirir; Yeniden üret ile aynı not (S3) */
  var un=D.kartVar&&!kilit&&D.view!=='yukleniyor';$('#uret-not').hidden=!un;uretBtn.setAttribute('aria-describedby',un?'hak-alt uret-not':'hak-alt');
  $('#yeniden-hak').textContent=D.left>1&&!kilit&&!bel?'Bugün '+D.cap+' hakkından '+D.left+' kaldı.':'';
}
function goster(v,odak){
  D.view=v;
  var kv=D.kartVar&&(v==='sonuc'||v==='hata'||v==='duvar');
  P.bos.hidden=v!=='bos';P.yukleniyor.hidden=v!=='yukleniyor';P.hata.hidden=v!=='hata';P.duvar.hidden=v!=='duvar';P.sonuc.hidden=!kv;
  baslik.textContent=kv?BAS.sonuc:(v==='duvar'?DUVAR[D.scope].h:BAS[v]);
  kartlar.setAttribute('aria-busy',v==='yukleniyor'?'true':'false'); /* tur-1: #durum'u kapsamaz, ara duyurular susmaz */
  /* tur-1: hata ve limitte kart başlığı aynı cümleyi taşır; #durum yalnız canlı bölge olarak kalır, görünür tekrar yok */
  durumEl.classList.toggle('sr',v==='hata'||v==='duvar');
  /* G6 kartların altında; G7 çıkış çifti yalnız G6 ile. Çok yakında: yalnız G8 */
  var cik=v==='duvar';cikislar.hidden=!cik;
  /* tur-4, S7: "Çok yakında" yükte biliniyorsa brif formu çizilmez; ilk eylem G8 bekleme listesi (prototipte yakında yalnız yükte gelir) */
  form.hidden=cik&&D.scope==='yakinda';
  cBiz.hidden=D.scope==='yakinda';cBizBtn.setAttribute('data-teklif',D.scope==='kapasite'?'cap':'limit');
  kopru.hidden=cik||v==='yukleniyor'||v==='hata';
  hakYaz();
  if(odak)odakla(v==='hata'?$('#hata-baslik'):v==='duvar'&&!kv?$('#duvar-baslik'):baslik);
}
function uretMesgul(m){
  /* tur-1: "Yazılıyor…" kısa; düğme daralıp yanındaki bedel satırını zıplatmasın */
  var uy=$('.uret-yazi',uretBtn);if(m)uy.setAttribute('data-genis','Üç taslak üret');else uy.removeAttribute('data-genis');
  uretBtn.setAttribute('aria-disabled',m?'true':'false');
  $('.uret-yazi',uretBtn).textContent=m?'Yazılıyor…':'Üç taslak üret';
  uretBtn.setAttribute('aria-label',m?'Yazılıyor…':'Üç taslak üret, 1 hak');
  konu.readOnly=m;hedef.readOnly=m;
  $$('.ornek').forEach(function(b){b.setAttribute('aria-disabled',m?'true':'false')});
}
function esle(v){var s=$('#mock-durum');if(s)s.value=v;root.setAttribute('data-state',v)}

/* ---- konu alanı ---- */
function konuHata(m){
  if(m){konuHataEl.textContent=m;konuHataEl.hidden=false;konu.setAttribute('aria-invalid','true')}
  else{konuHataEl.textContent='';konuHataEl.hidden=true;konu.removeAttribute('aria-invalid')}
}
var sdE=0;
function konuGuncelle(){
  var n=konu.value.length,e=n>=300?2:n>=280?1:0;
  $('#konu-sayac').textContent=n+' / 300';
  /* tur-5 (F2): 280'de kalan, 300'de sınır; eşik geçilince birer kez duyurulur */
  if(e!==sdE)$('#konu-sayac-duyuru').textContent=e>sdE?(e>1?'Sınıra ulaştın.':(300-n)+' karakter kaldı.'):'';sdE=e;
  $('#ornekler').hidden=konu.value.length>0;
  if(!konu.value)konu.removeAttribute('lang');
}
/* tur-3: örnek konu Türkçedir (lang=tr, EN arayüzde de); kullanıcı yazınca dil işareti kalkar */
konu.addEventListener('input',function(){konu.removeAttribute('lang');konuGuncelle();if(konu.value.trim())konuHata('')});
konu.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();uret()}
});
/* field-sizing desteklenmiyorsa satır sayısı büyür (satır içi stil yok) */
if(!(window.CSS&&CSS.supports&&CSS.supports('field-sizing','content'))){var boy=function(){konu.rows=2;while(konu.scrollHeight>konu.clientHeight&&konu.rows<10)konu.rows++};konu.addEventListener('input',boy)}
$$('.ornek').forEach(function(b){b.addEventListener('click',function(){
  /* tur-3: dokunmatikte konuya odak ekran klavyesini açar ve ana düğmeyi örter; odak ana düğmeye geçer */
  if(pasif(b))return;konu.value=b.getAttribute('data-ornek');konu.lang='tr';konuGuncelle();konuHata('');
  (window.matchMedia&&matchMedia('(pointer:coarse)').matches?uretBtn:konu).focus();
})});

/* ---- künye (mobilde tek satır özet) ---- */
var kunye=$('#kunye'),kunyeBtn=$('#kunye-dugme');
function kunyeOzet(){
  var s=$('input[name="sector"]:checked'),t=$('input[name="tone"]:checked');
  var p=$('input[name="platform"]:checked'),pl=PL[p?p.value:ARAC]||PL.li;
  D.tone=t.value;D.pl=PL[p?p.value:ARAC]?(p?p.value:ARAC):'li';D.sektor=s.value;
  var f=$('input[name="format"]:checked'),c=$('input[name="cta"]:checked'),v=$('input[name="video"]:checked');D.format=f?f.value:'post';D.cta=c?c.value:'';D.video=v?v.value:'';
  $('#kunye-ozet').textContent=pl.ad+' · '+(f?$('label[for="'+f.id+'"]').textContent+' · ':'')+(v&&v.value?$('label[for="'+v.id+'"]').textContent+' · ':'')+s.value+' · '+$('label[for="'+t.id+'"]').textContent;
  $('#giris').textContent=pl.giris;$('#kat-ipucu').textContent=pl.ipucu;$('#kat-bos').textContent=pl.bos;$('#kat-devam').textContent=pl.devam;
}
function plSec(v){var r=$('#p-'+v);if(r&&!r.checked){r.checked=true;kunyeOzet()}}
kunyeBtn.addEventListener('click',function(){
  var a=!kunye.classList.contains('acik');
  kunye.classList.toggle('acik',a);
  kunyeBtn.setAttribute('aria-expanded',a?'true':'false');
});
$$('input[name="sector"],input[name="tone"],input[name="platform"],input[name="format"],input[name="cta"],input[name="video"]').forEach(function(i){i.addEventListener('change',kunyeOzet)});

/* ---- üretim akışı ---- */
/* Hak yokken (D5 tıklama): G6 açıktır ya da açılır, odak G6 başlığına iner; taslaklar ekrandaysa yerinde kalır */
function hakYok(){
  if(D.view!=='duvar'){duvarGoster(D.hakScope||'anon',false);esle(D.kartVar?'sonuc-0':'limit-'+(D.hakScope||'anon'))}
  /* tur-6: odaklanan başlık cümleyi okur; #durum ikinci kez duyurmasın (hataGoster ile aynı) */
  durum('');odakla($('#duvar-baslik'));
}
function alanHata(inp,hEl,m){
  hEl.textContent=m||'';hEl.hidden=!m;
  if(m)inp.setAttribute('aria-invalid','true');else inp.removeAttribute('aria-invalid');
}
/* tur-4: mobilde klavye açılınca geçersiz alanın hata satırı klavyenin altında kalmasın; alanın üstü görünür kalacak kadar kaydırılır */
if(window.visualViewport)visualViewport.addEventListener('resize',function(){setTimeout(function(){var a=d.activeElement,v=visualViewport;if(!a||a.getAttribute('aria-invalid')!=='true')return;(a.getAttribute('aria-describedby')||'').split(' ').forEach(function(i){var h=d.getElementById(i);if(!h||h.hidden||!h.classList.contains('alan-hata'))return;var f=Math.min(h.getBoundingClientRect().bottom+8-v.offsetTop-v.height,a.getBoundingClientRect().top-8),s=h.closest('.dlg');if(f>0){if(s)s.scrollTop+=f;else scrollBy(0,f)}})},60)});
function uret(){
  if(D.view==='yukleniyor')return;
  formNot('');
  /* tur-6, S6: kapasitede ana düğme etkin ve yeniden dener (Yeniden üret ile aynı) */
  if(D.left<=0||D.view==='duvar'&&D.scope!=='kapasite'){hakYok();return}
  var t=konu.value.replace(/\s+/g,' ').trim();
  if(!t){konuHata('Konu boş. Ne hakkında yazacağını bir cümleyle anlat.');konu.focus();return}
  if(konu.value.length>300){konuHata('Konu en çok 300 karakter olabilir.');konu.focus();return}
  if(hedef.value.length>200){alanHata(hedef,hedefHataEl,'Hedef en çok 200 karakter olabilir.');hedef.focus();return}
  konuHata('');alanHata(hedef,hedefHataEl,'');D.deneme=0;D.rid=yeniRid();
  yukle(0,false);
}
/* gecen: mock için yüklemenin kaçıncı saniyesinden başlanacağı; sabit: başarı gelmez */
function yukle(gecen,sabit){
  durdur();
  if(D.view!=='yukleniyor')D.onceki=D.view;
  /* tur-1: odak gizlenecek panelin içindeyse (Yeniden üret, Tekrar dene) body'ye düşmesin, Vazgeç'e geçsin */
  var ae=d.activeElement,gz=ae&&ae!==d.body&&[P.sonuc,P.hata,P.duvar,P.bos].some(function(x){return x.contains(ae)});
  uretMesgul(true);goster('yukleniyor',false);
  durum(gecen>=20?'Biraz uzun sürdü; taslaklar hâlâ hazırlanıyor.':gecen>=8?'Taslaklar hazırlanıyor…':'Taslaklar yazılıyor…');
  /* tek sütun düzeni 1080 altı (medya eşiği); yükleme paneli ve Vazgeç görünür alana gelir, odak ekran dışında kalmaz */
  var vz=$('#vazgec'),tek=!sabit&&window.innerWidth<1080;if(gz||tek)odakla(vz,false);
  if(tek&&sonucKol.scrollIntoView)sonucKol.scrollIntoView({block:'start',behavior:RM?'auto':'smooth'});
  else if(gz&&vz.scrollIntoView)vz.scrollIntoView({block:'nearest'});
  /* yük başına en çok 3 duyuru: 0, 8 ve 20. saniye; 45. saniyede istemci zaman aşımı */
  if(gecen<8)zaman(function(){durum('Taslaklar hazırlanıyor…')},(8-gecen)*1000);
  if(gecen<20)zaman(function(){durum('Biraz uzun sürdü; taslaklar hâlâ hazırlanıyor.')},(20-gecen)*1000);
  zaman(function(){hataGoster('zaman',true)},(45-gecen)*1000);
  if(sabit)return;
  /* uretFmt: düzenleme isteği künyenin o anki değerini değil, taslağın üretildiği formatı gönderir (A4-2b) */
  var no=D.istek,q=istekKur();(ARAC==='li'?prov.linkedin:prov.instagram)(q).then(function(r){if(no!==D.istek)return;durdur();D.uretFmt=q.format||'';if(r&&typeof r.left==='number')hakAl(r);else D.left=Math.max(0,D.left-1);D.taslaklar=(r&&r.drafts)||[];D.kayit=kayitVar(r);D.kartVar=true;sonucGoster(true);esle(D.left>=2?'sonuc':'sonuc-'+D.left)},function(h){if(no!==D.istek)return;hataIsle(h||{})});
}
$('#vazgec').addEventListener('click',function(){
  durdur();uretMesgul(false);
  goster(D.kartVar?'sonuc':'bos',false);durum('Vazgeçildi.');esle('vazgecildi');
  /* kalan hak yeniden sorulur (/gen/quota); ÖRNEK'te kısa gecikmeyle aynı sayı */
  $('#hak-alt').textContent='1 hak kullanır';
  var nq=D.istek;prov.quota().then(function(r){if(nq!==D.istek)return;if(r&&typeof r.left==='number')hakAl(r);hakYaz()},function(){if(nq===D.istek)hakYaz()});
  uretBtn.focus();
});
form.addEventListener('submit',function(e){e.preventDefault();uret()});
yenidenBtn.addEventListener('click',function(){
  if(D.view==='yukleniyor')return;
  if(pasif(yenidenBtn)){hakYok();return}
  D.deneme=0;D.rid=yeniRid();yukle(0,false);
});

/* ---- taslak kâğıdı ---- */
function metinKur(a,st){
  if(!a.kanca)return st.ham!=null?st.ham:a.text;
  var p=[a.kanca[st.ton]].concat(st.lv<0?a.govde.slice(0,1):a.govde);
  if(st.lv>0)p.push(a.ek);
  p.push(a.kapanis);
  if(a.etiket)p.push(a.etiket);
  return p.join('\n\n');
}
/* kat: LinkedIn ~210, Instagram ~125; boşlukta kır, çok gerideyse sınırda kes */
function kes(t,n){
  n=n||210;
  if(t.length<=n)return [t,''];
  var c=Math.max(t.lastIndexOf(' ',n),t.lastIndexOf('\n',n));
  if(c<n*0.57)c=n;
  return [t.slice(0,c).replace(/\s+$/,''),t.slice(c).replace(/^\s+/,'')];
}
/* kod noktası: sayım ve kesim (vekil çift bölünmez); n kod noktasının UTF-16 karşılığıyla kes() */
function cpSay(t){return Array.from(t).length}
function kesCp(t,n){var a=Array.from(t);return a.length<=n?[t,'']:kes(t,a.slice(0,n).join('').length)}
function kopyala(t,ok,fail){
  function yedek(){
    try{
      var ta=el('textarea','sr');ta.value=t;ta.setAttribute('readonly','');ta.setAttribute('aria-hidden','true');
      d.body.appendChild(ta);ta.select();var r=d.execCommand('copy');d.body.removeChild(ta);
      if(r)ok();else fail();
    }catch(e){fail()}
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,yedek)}else yedek();
}
function dugme(yazi,sinif,ad){var b=el('button',sinif,yazi);b.type='button';if(ad)b.setAttribute('aria-label',ad);return b}
var SINIR='Bugünkü 9 düzenleme hakkın doldu; gece yarısı yenilenir.';
function kart(a){
  var st={lv:0,ton:D.tone,metin:''},once=null,mesgul=false,hataSirada=false,bPay=null,id='taslak-'+a.id,sira=+a.no,pl=PL[D.pl]||PL.li;
  var art=el('article','sheet taslak');art.setAttribute('aria-labelledby',id);
  var kenar=el('div','taslak-kenar'),no=el('span','no',a.no),h=el('h3',null,a.ad);
  no.setAttribute('aria-hidden','true');h.id=id;
  kenar.appendChild(no);kenar.appendChild(h);
  if(ORNEK){var oz=el('span','rozet rozet-uyari taslak-ornek','ÖRNEK');oz.title='Sahte örnek metin';kenar.appendChild(oz)}
  kenar.appendChild(el('span','taslak-pl',pl.ad));

  var govde=el('div','taslak-govde');
  var p1=el('p','metin'),kanca=el('span','kanca');p1.appendChild(kanca);
  var fold=el('div','fold'),foldY=el('span',null,pl.devam);
  foldY.setAttribute('aria-hidden','true');
  fold.appendChild(foldY);fold.appendChild(el('span','sr','Kat çizgisi: '+pl.ad+' akışında metin burada kesilir, devamı “'+pl.devam.slice(2)+'” ile açılır.'));
  var p2=el('p','metin kalan');p1.lang=p2.lang=a.lang||'tr'; /* tur-3: taslak metni EN arayüzde de Türkçe (WCAG 3.1.2) */
  var olcu=el('p','olcu'),olcuY=el('span'),olcuU=el('span');olcu.appendChild(olcuY);olcu.appendChild(olcuU);
  var reels=null,bayrak=null,cerceve=null,sayB=null,sayP=null,sure=null;
  /* IG flags (ör. banned): kısa uyarı; metin değişmez. A4-2b: IG/Reels'te düzenleme yanıtının flags'i uyarıyı günceller;
     long_hook uyarı değildir (ölçü satırı hedef aşımını söyler) */
  st.flags=a.flags;
  function bayrakVar(f){return !!(f&&f.length)&&(ARAC!=='reels'||f.some(function(x){return x!=='long_hook'}))}
  if(ARAC==='li'?(a.flags&&a.flags.length):ARAC==='ig'||bayrakVar(a.flags)){bayrak=el('p','not not-uyari taslak-bayrak','Bu taslakta kaçınman gereken bir ifade olabilir; paylaşmadan önce kontrol et.');bayrak.hidden=!bayrakVar(a.flags)}
  /* Reels: 9:16 önizleme çerçevesi (yalnız CSS oranı) içinde ekran metni; altında konuşma satırı + okuma süresi rozeti */
  if(pl.reels){
    cerceve=el('div','reels-cerceve');cerceve.appendChild(el('span','reels-etiket','Ekran metni'));p1.className='metin reels-ekran';cerceve.appendChild(p1);
    sayB=el('p','reels-bas');sayB.appendChild(el('b',null,'Konuşma satırı'));sure=el('span','rozet rozet-bilgi reels-sure');sure.title='Konuşma satırının yaklaşık süresi (saniyede ~2,5 kelime)';sayB.appendChild(sure);
    sayP=el('p','metin reels-say');sayP.lang=a.lang||'tr';
  }
  if(a.reels){reels=el('p','reels');reels.appendChild(el('b',null,'Reels kancası · ilk 3 sn'));var rk=el('span',null,'“'+a.reels+'”');rk.lang='tr';reels.appendChild(rk)}

  var ey=el('div','eylemler');ey.setAttribute('role','group');ey.setAttribute('aria-label','Taslak '+sira+' eylemleri');
  var bKopya=dugme('Kopyala','btn btn-ink btn-kucuk');
  var bKisalt=dugme('Kısalt','btn btn-cizgi btn-kucuk');
  var bUzat=dugme('Uzat','btn btn-cizgi btn-kucuk');
  var tonId='ton-'+a.id,bTon=dugme('Ton','btn btn-cizgi btn-kucuk');
  /* tur-4: dar ekranda düğme en uzun etiketine göre yer ayırır (CSS ::after); "Kısaltılıyor…", "Kopyalandı" satırı kaydırmaz */
  bKopya.setAttribute('data-genis','Kopyalandı');bKisalt.setAttribute('data-genis','Kısaltılıyor…');bUzat.setAttribute('data-genis','Uzatılıyor…');bTon.setAttribute('data-genis','Ton değişiyor…');
  bTon.setAttribute('aria-expanded','false');bTon.setAttribute('aria-controls',tonId);
  ey.appendChild(bKopya);ey.appendChild(bKisalt);if(!pl.reels)ey.appendChild(bUzat);ey.appendChild(bTon); /* reels: sunucuda lengthen yok */
  var tonG=el('div','ton-grup');tonG.id=tonId;tonG.hidden=true;
  tonG.setAttribute('role','group');tonG.setAttribute('aria-label','Ton değiştir');
  /* G2: bilgi/onay role=status, hata role=alert; iki ayrı düğüm */
  var ks=el('p','kart-durum');ks.setAttribute('role','status');
  var kh=el('p','not not-hata');kh.setAttribute('role','alert');
  var geri=dugme('Geri al','btn btn-cizgi btn-kucuk');geri.hidden=true;
  /* K6: pano ve seçim başarısızsa elle kopyalama alanı */
  var elle=el('div','elle'),elleId='elle-'+a.id,elleN=el('p','not not-uyari'),elleL=el('label',null,'Taslak metni (elle kopyala)'),elleT=el('textarea'),elleK=dugme('Kapat','btn btn-cizgi btn-kucuk');
  elleN.setAttribute('role','status');
  elle.hidden=true;elleL.setAttribute('for',elleId);elleT.id=elleId;elleT.lang='tr';elleT.readOnly=true;elleT.rows=6;
  elle.appendChild(elleN);elle.appendChild(elleL);elle.appendChild(elleT);elle.appendChild(elleK);
  /* K7: hizmet satırı, yalnız en son kopyalanan kartta */
  var hz=el('p','hizmet');hz.hidden=true;
  hz.appendChild(d.createTextNode((pl.reels?'Bu taslak yalnız metin. Videoyu çekmek ve kurgulamak gerekirse ekip yapar.':HIZMET[sira-1]||HIZMET[0])+' '));
  var hzA=el('a',null,'Ekipten teklif al');hzA.href='#teklif-yedek';hzA.setAttribute('data-teklif','result');
  hz.appendChild(hzA);

  var tonB=TONLAR.map(function(o){
    var b=dugme(o[1],'btn btn-cizgi btn-kucuk');b.setAttribute('data-ton',o[0]);
    b.addEventListener('click',function(){
      if(pasif(b)){if(!mesgul)ks.textContent=st.ton===o[0]?'Taslak zaten bu tonda.':SINIR;return}
      tonKapat(true);
      duzenle(function(){st.ton=o[0]},bTon,'Ton değişiyor…','Ton değişti.');
    });
    tonG.appendChild(b);return b;
  });
  function bayrakYaz(f){st.flags=f;if(bayrak)bayrak.hidden=!bayrakVar(f)}
  function tonKapat(odak){tonG.hidden=true;bTon.setAttribute('aria-expanded','false');if(odak)bTon.focus()}
  bTon.addEventListener('click',function(){
    if(pasif(bTon)){neden(bTon);return}
    var ac=tonG.hidden;tonG.hidden=!ac;bTon.setAttribute('aria-expanded',ac?'true':'false');
    if(ac&&tonG.scrollIntoView)tonG.scrollIntoView({block:'nearest',behavior:RM?'auto':'smooth'});
  });
  tonG.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();tonKapat(true)}});

  function yenile(){
    var dolu=D.refine>=9;
    bKisalt.setAttribute('aria-disabled',(mesgul||dolu||st.lv<=-1)?'true':'false');
    bUzat.setAttribute('aria-disabled',(mesgul||dolu||st.lv>=1)?'true':'false');
    bTon.setAttribute('aria-disabled',(mesgul||dolu)?'true':'false');
    bKopya.setAttribute('aria-disabled',mesgul?'true':'false');
    if(bPay)bPay.setAttribute('aria-disabled',mesgul?'true':'false');
    if(dolu)tonKapat(false);
    tonB.forEach(function(b){
      var c=b.getAttribute('data-ton')===st.ton;
      if(c)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');
      b.setAttribute('aria-disabled',(c||dolu)?'true':'false');
    });
  }
  function ciz(){
    if(pl.reels){
      var rt=st.ham!=null?st.ham:a.text,rs=st.say!=null?st.say:String(a.say||''),rn=cpSay(rt),rm=cpSay(rs);
      st.kanca=rt;st.soz=rs;st.metin=rs?rt+'\n\n'+rs:rt;kanca.textContent=rt;sayP.textContent=rs;sure.textContent='~'+reelsSn(rs||rt)+' sn';
      olcuY.textContent='Ekran metni '+nf.format(rn)+' / 80 karakter · konuşma '+nf.format(rm)+' / 200 karakter';
      var ras=rn>80||rm>200,ruy=rn>60||rm>140;
      olcuU.className=ras?'olcu-asim':ruy?'olcu-uyari':'';
      olcuU.textContent=ras?'Sınırı aşıyor; kısalt.':ruy?'Hedeften uzun; Kısalt ile sıkılaştır.':'';
      yenile();return;
    }
    var t=metinKur(a,st),k=pl.cp?kesCp(t,pl.kat):kes(t,pl.kat),kat=k[1].length>0,n=pl.cp?cpSay(t):t.length;
    st.metin=t;kanca.textContent=k[0];p2.textContent=k[1];
    fold.hidden=!kat;p2.hidden=!kat;
    olcuY.textContent=nf.format(n)+' / '+nf.format(pl.sinir)+' karakter · '+(kat?'akışta ilk ~'+pl.kat+' görünür':'Tamamı akışta görünür.');
    /* K3: %90'da uyarı, sınır üstünde aşım (renk + metin, yalnız renge dayanmaz) */
    olcuU.className=n>pl.sinir?'olcu-asim':(n>=pl.sinir*0.9?'olcu-uyari':'');
    olcuU.textContent=n>pl.sinir?'Sınırı aşıyor: '+nf.format(n-pl.sinir)+' karakter kısalt.':(n>=pl.sinir*0.9?'Sınıra yakın.':'');
    yenile();
  }
  /* D5 tıklaması: düğme odakta kalır, nedenini söyler */
  function neden(b){
    if(mesgul)return;
    if(D.refine>=9){ks.textContent=SINIR;return}
    if(b===bKisalt)ks.textContent='Taslak en kısa hâlinde; daha fazla kısalmaz.';
    else if(b===bUzat)ks.textContent='Taslak en uzun hâlinde; daha fazla uzamaz.';
  }
  function duzenle(fn,btn,yapiliyor,bitti,aninda){
    if(mesgul)return;
    if(D.refine>=9){ks.textContent=SINIR;return}
    kh.textContent='';geri.hidden=true;once={lv:st.lv,ton:st.ton,ham:st.ham,say:st.say,fl:st.flags};
    var eski=btn.textContent;mesgul=true;art.setAttribute('aria-busy','true');btn.textContent=yapiliyor;yenile();
    ks.textContent=yapiliyor;
    function bit(){
      mesgul=false;art.removeAttribute('aria-busy');btn.textContent=eski;
      if(hataSirada){hataSirada=false;once=null;yenile();ks.textContent='';kh.textContent='Düzenlenemedi; taslağın aynı duruyor. Tekrar dene.';return}
      fn();if(st.yeni!=null){st.ham=st.yeni;st.yeni=null}if(st.yeniSay!=null){st.say=st.yeniSay;st.yeniSay=null}if(st.yeniF){bayrakYaz(st.yeniF);st.yeniF=null}D.refine++;ciz();geri.hidden=false;
      ks.textContent=bitti+' Hak düşmedi.'+(D.refine>=9?' '+SINIR:'');
      if(D.refine>=9)D.kartApi.forEach(function(x){x.yenile()});
      /* tur-5: sınırda odak düğmede kalır (D5); neden canlı bölgede söylenir */
      if(btn!==bTon&&pasif(btn)&&D.refine<9)ks.textContent+=btn===bKisalt?' Taslak en kısa hâlinde; daha fazla kısalmaz.':' Taslak en uzun hâlinde; daha fazla uzamaz.';
      /* tur-1: uzayan metin durum satırını ve Geri al'ı katın altına itmesin (mock'ta kaydırma yok) */
      if(!aninda&&geri.scrollIntoView)geri.scrollIntoView({block:'nearest',behavior:RM?'auto':'smooth'});
    }
    if(aninda){bit();return}
    var op=btn===bKisalt?'shorten':btn===bUzat?'lengthen':'tone',lv0=st.lv,ton0=st.ton;fn();var hton=st.ton;st.lv=lv0;st.ton=ton0;
    /* /gen/refine: {anon, op, tone (yalnız op=tone), text, lang, angle}; Turnstile ve rid yok, üretim hakkı düşmez */
    var rq={anon:anonAl(),op:op,text:pl.reels?st.kanca:st.metin,lang:dilAl()};if(op==='tone')rq.tone=hton;if((ARAC==='reels'?ACI_R:ACI)[a.id])rq.angle=a.id;
    /* IG: /gen/refine kind:caption (+üretimdeki format); say gönderilmez. Reels: kind:reels + say, format yok */
    if(ARAC==='ig'){rq.kind='caption';var fm=D.uretFmt||D.format;if(fm)rq.format=fm;sesEkle(rq)}
    if(ARAC==='reels'){rq.kind='reels';rq.say=st.soz;sesEkle(rq)}
    prov.refine(rq).then(function(r){if(r&&typeof r.text==='string')st.yeni=r.text;if(ARAC!=='li'&&r){if(ARAC==='reels'&&typeof r.say==='string')st.yeniSay=r.say;if(Array.isArray(r.flags))st.yeniF=r.flags}bit()},function(h){
      /* düzenleme sınırı (anon 9/gün, bağlantı ya da günlük toplam): düğmeler kilitlenir, taslak aynı kalır */
      if(h&&h.kod==='limit'){mesgul=false;art.removeAttribute('aria-busy');btn.textContent=eski;once=null;D.refine=9;ks.textContent='';kh.textContent=h.scope==='ip'||h.scope==='global'?DUVAR[h.scope].b:SINIR;D.kartApi.forEach(function(x){x.yenile()});return}
      /* A4-2c-nav: IG/Reels'te sunucu voice.* alanını reddederse (400 bad_input) üretimdeki gibi marka sesi satırında söylenir; taslak aynı kalır. LI bu dala girmez */
      if(ARAC!=='li'&&h&&h.kod==='bad_input'&&/^voice/.test(h.field||'')&&window.SMCSes&&SMCSes.sunucuHata){mesgul=false;art.removeAttribute('aria-busy');btn.textContent=eski;once=null;yenile();ks.textContent='';SMCSes.sunucuHata(h.field);return}
      hataSirada=true;bit()});
  }
  bKisalt.addEventListener('click',function(){if(pasif(bKisalt)){neden(bKisalt);return}duzenle(function(){st.lv--},bKisalt,'Kısaltılıyor…','Kısaltıldı.')});
  bUzat.addEventListener('click',function(){if(pasif(bUzat)){neden(bUzat);return}duzenle(function(){st.lv++},bUzat,'Uzatılıyor…','Uzatıldı.')});
  geri.addEventListener('click',function(){
    if(!once||mesgul)return;
    st.lv=once.lv;st.ton=once.ton;st.ham=once.ham;st.say=once.say;if(bayrak&&once.fl!==st.flags)bayrakYaz(once.fl);once=null;ciz();geri.hidden=true;ks.textContent='Geri alındı.';bKopya.focus();
  });
  /* kopyalama üç kademe: pano → seçim (execCommand) → görünür K6 alanı; her zaman saklanan metinden */
  function elleAc(){
    olay('copy_fb');elleT.value=st.metin;elle.hidden=false;
    elleN.textContent='Kopyalanamadı. Metin aşağıdaki alanda seçili: Ctrl/Cmd + C ile ya da uzun basıp kopyala.';
    try{elleT.focus();elleT.select()}catch(e){}
  }
  elleK.addEventListener('click',function(){elle.hidden=true;elleN.textContent='';bKopya.focus()});
  bKopya.addEventListener('click',function(){
    if(pasif(bKopya))return;
    kopyala(st.metin,function(){
      olay('copy_ok');bKopya.textContent='Kopyalandı';kh.textContent='';ks.textContent=pl.reels?'Kopyalandı. Ekran metnini videoya ekle, konuşma satırını kendi sesinle söyle.':pl.cp?'Kopyalandı. Instagram açıklamasına yapıştır, kendi sesinle bitir.':'Kopyalandı. LinkedIn’e yapıştır, kendi sesinle bitir.';
      $$('.hizmet',kartlar).forEach(function(x){x.hidden=true});hz.hidden=false;
      setTimeout(function(){bKopya.textContent='Kopyala'},2000);
    },elleAc);
  });
  if(navigator.share){
    bPay=dugme('Paylaş','btn btn-cizgi btn-kucuk');
    bPay.addEventListener('click',function(){if(pasif(bPay))return;try{navigator.share({text:st.metin}).then(function(){olay('share')},function(){})}catch(e){}});
    ey.insertBefore(bPay,bTon); /* tur-3: Ton ile ton grubu art arda kalsın (odak sırası) */
  }
  if(bayrak)govde.appendChild(bayrak);if(cerceve){govde.appendChild(cerceve);govde.appendChild(sayB);govde.appendChild(sayP)}else{govde.appendChild(p1);govde.appendChild(fold);govde.appendChild(p2)}govde.appendChild(olcu);if(reels)govde.appendChild(reels);govde.appendChild(ey);govde.appendChild(tonG);
  govde.appendChild(ks);govde.appendChild(kh);govde.appendChild(geri);govde.appendChild(elle);govde.appendChild(hz);
  art.appendChild(kenar);art.appendChild(govde);
  ciz();
  /* mock durumları için kart API'si */
  D.kartApi.push({art:art,yenile:yenile,elle:elleAc,
    kisalt:function(){duzenle(function(){st.lv--},bKisalt,'Kısaltılıyor…','Kısaltıldı.',true)},
    hata:function(){hataSirada=true;duzenle(function(){},bKisalt,'Kısaltılıyor…','',true)},
    sinir:function(){ks.textContent=SINIR}});
  return art;
}
/* A5-4: sunucu taslakları hesabın geçmişine yazdıysa yanıtta draft_ids gelir → kartların altında sessiz not + Geçmiş bağlantısı.
   draft_ids yoksa (anonim, ÖRNEK, bayrak kapalı) not hiç görünmez. Metin textContent; EN smc-en.js sözlüğünden. */
function kayitVar(r){return !!(r&&Array.isArray(r.draft_ids)&&r.draft_ids.length)}
function kayitNot(){var p=$('#kayit-not');
  if(!D.kayit){if(p)p.hidden=true;return}
  if(!p){p=el('p','ipucu');p.id='kayit-not';p.appendChild(d.createTextNode('Geçmiş’e kaydedildi.'));p.appendChild(d.createTextNode(' '));
    var a=el('a',null,'Geçmişi aç');a.href=dilAl()==='en'?'/en/hesap/history':'/hesap/gecmis';p.appendChild(a);
    kartlar.parentNode.insertBefore(p,kartlar.nextSibling)}
  p.hidden=false}
function sonucGoster(odak){
  durdur();uretMesgul(false);D.kartVar=true;
  kartlar.textContent='';D.kartApi=[];
  (D.taslaklar||[]).forEach(function(a,i){kartlar.appendChild(kart(taslakNorm(a,i)))});
  kayitNot();
  uyari.className='not not-uyari';
  if(D.left===1){uyari.hidden=false;uyari.textContent='Son hakkın: bugün 3 hakkından 1 kaldı. '+(ARAC==='reels'?'Kısalt ve Ton hak düşürmez.':'Kısalt, Uzat ve Ton hak düşürmez.')}
  else{uyari.hidden=true;uyari.textContent=''}
  /* S3c: son hak kullanıldıysa taslaklar + G6 (anon) + G7; odak h2'de */
  if(D.left<=0){var hs=D.hakScope||'anon';duvarHazirla(hs);goster('duvar',odak);durum('3 taslak hazır. '+DUVAR[hs].b);return}
  goster('sonuc',odak);durum('3 taslak hazır.');
}

/* ---- hata (G5, kartların üstünde) ---- */
function hataGoster(kod,odak,sayac){
  durdur();uretMesgul(false);
  var ch=/-charged$/.test(kod);kod=kod.replace(/-charged$/,'');
  var h=HATA[kod]||HATA.genel;D.hata=kod;
  /* sayac: sunucu yanıtı left taşıdıysa sayı zaten güncel (hakAl); yoksa charged ile bir düşülür */
  if(ch&&!sayac)D.left=Math.max(0,D.left-1);
  $('#hata-baslik').textContent=h.b;
  var m=$('#hata-metin');m.textContent=h.m;m.hidden=!h.m;
  /* charged cümlesi: true / false / belirsiz (istemci) */
  $('#hata-hak').textContent=ch?'Bu deneme 1 hak kullandı. Bugün '+D.cap+' hakkından '+D.left+' kaldı.':h.e==='istemci'?'Hakkının düşüp düşmediği henüz belli değil. Tekrar denersen aynı istek gider; hak iki kez düşmez.':'Hakkın düşmedi.';
  var b=$('#hata-tekrar');b.textContent='';b.removeAttribute('aria-label');
  if(h.e==='duzenle')b.textContent='Konuyu düzenle';
  else if(h.e==='yenile')b.textContent='Sayfayı yenile';
  else if(h.e==='istemci'&&D.deneme<1)b.textContent='Tekrar dene';
  else{
    var ay=el('span','ayirici','│');ay.setAttribute('aria-hidden','true');
    b.appendChild(d.createTextNode('Tekrar dene '));b.appendChild(ay);b.appendChild(d.createTextNode(' '));b.appendChild(el('span','bedel','1 hak'));
    b.setAttribute('aria-label','Tekrar dene, 1 hak');
  }
  $('.sessiz',P.hata).hidden=kod==='refused';
  /* tur-5: istemci hatasında istek sunucuya ulaşmadı; İngilizce kod, istek no yok */
  $('#hata-kod').textContent=h.e==='istemci'?'Kod: '+(kod==='ag'?'network':'timeout'):'Kod: '+kod+' · İstek no: '+(D.rid||'7f3a91c2');
  /* odaklanan başlık zaten okunur; #durum aynı cümleyi ikinci kez duyurmasın */
  goster('hata',odak);durum(odak?'':h.b);
}
$('#hata-tekrar').addEventListener('click',function(){
  var h=HATA[D.hata]||HATA.genel;
  if(h.e==='duzenle'){konu.focus();konu.select();return}
  /* tur-5: yenilemede konu ve hedef kaybolmasın; tek seferlik sekme deposu, açılışta okunup silinir */
  if(h.e==='yenile'){try{sessionStorage.setItem('smc-konu',JSON.stringify([konu.value,hedef.value]))}catch(e){}location.reload();return}
  if(D.left<=0){hakYok();return}
  /* istemci hatası: aynı rid ile bir kez bedelsiz; ikinci denemede bedel etiketi */
  if(h.e==='istemci')D.deneme++;else{D.deneme=0;D.rid=yeniRid()}
  yukle(0,false);
});

/* ---- limit duvarı (G6, kartların altında; uyarı değil) ---- */
function duvarHazirla(scope){
  var w=DUVAR[scope]||DUVAR.anon;D.scope=scope;
  if(scope!=='yakinda'&&scope!=='kapasite')D.left=0;
  $('#duvar-baslik').textContent=w.b;$('#duvar-metin').textContent=w.m;
  var dl=$('#duvar-dokum');dl.textContent='';dl.hidden=!w.d.length;
  /* gerçek modda yenilenme süresi sunucunun reset_at'inden, kullanılan hak cap'ten gelir */
  w.d.forEach(function(x){var g=el('div');g.appendChild(el('dt',null,x[0]));g.appendChild(el('dd',null,x[1]===YEN?yenMetin():x[0]==='Kullandığın'?D.cap+' / '+D.cap+' hak':x[1]));dl.appendChild(g)});
  $('#duvar-taslak').hidden=!D.kartVar;
  var yk=scope==='yakinda';D.yakinda=yk;
  $('#c-bekle').textContent=yk?'Açılış için bekleme listesi':'Hesaplı sürüm için bekleme listesi';
  $('#b-vaat').textContent=yk?'Araç açılınca ilk sen haber al.':'Hesaplı sürüm açılınca ilk sen haber al: marka sesi, takvim, ekip onayı.';
  $('#b-riza-yazi').textContent=yk?'E-posta adresimin açılış duyurusu için işlenmesini kabul ediyorum.':'E-posta adresimin hesaplı sürüm duyurusu için işlenmesini kabul ediyorum.';
}
function duvarGoster(scope,odak){
  durdur();uretMesgul(false);duvarHazirla(scope);goster('duvar',odak);durum(DUVAR[D.scope].b);
}

/* ---- tema ---- */
var temaBtn=$('#tema');
function etkinTema(){
  var a=root.getAttribute('data-theme');if(a==='dark'||a==='light')return a;
  return window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
}
function temaYaz(){var k=etkinTema()==='dark',m=k?'Açık temaya geç':'Koyu temaya geç';temaBtn.removeAttribute('aria-pressed');temaBtn.setAttribute('data-tema-etkin',k?'dark':'light');temaBtn.setAttribute('aria-label',m);temaBtn.setAttribute('title',m)}
temaBtn.addEventListener('click',function(){
  var t=etkinTema()==='dark'?'light':'dark';root.setAttribute('data-theme',t);
  try{localStorage.setItem('smc-tema',t)}catch(e){}
  temaYaz();
});
if(window.matchMedia){var mq=matchMedia('(prefers-color-scheme: dark)');if(mq.addEventListener)mq.addEventListener('change',temaYaz)}

/* ---- e-posta doğrulama (ortak) ---- */
function epostaBak(inp,hataEl){
  var v=inp.value.trim(),ok=v.length>0&&inp.checkValidity();
  if(ok){hataEl.hidden=true;hataEl.textContent='';inp.removeAttribute('aria-invalid')}
  else{hataEl.textContent=v?'E-posta adresi eksik görünüyor. Örn. ad@sirket.com':'E-posta yaz; sana buradan ulaşacağız.';hataEl.hidden=false;inp.setAttribute('aria-invalid','true')}
  return ok;
}

/* ---- teklif penceresi ---- */
var dlg=$('#teklif'),tForm=$('#t-form'),tTamam=$('#t-tamam'),tBtn=$('button[type="submit"]',tForm),acan=null;
function teklifAc(k,btn){
  acan=btn||null;if(tForm.hidden)tForm.reset();tForm.hidden=false;tTamam.hidden=true;tTamam.textContent='';
  $('#t-eposta-hata').hidden=true;$('#t-eposta').removeAttribute('aria-invalid');
  $('#t-kaynak').value=KAYNAK[k]||'top';$('#t-hata').textContent='';$('#teklif-kapat').hidden=true;
  tBtn.textContent='Teklif iste';tBtn.removeAttribute('aria-disabled');
  if(dlg.showModal){if(!dlg.open)dlg.showModal()}else dlg.setAttribute('open','');
  /* odak başlıkta: önce ne istendiği okunur */
  $('#teklif-baslik').focus();
}
function teklifKapat(){if(dlg.close)dlg.close();else{dlg.removeAttribute('open');if(acan)acan.focus()}}
function teklifBos(){return !$$('input:not([type="hidden"]),textarea,select',tForm).some(function(x){return x.type==='checkbox'?x.checked:x.value.trim()})}
function teklifBitti(){
  tForm.hidden=true;tTamam.hidden=false;$('#teklif-kapat').hidden=false;
  tTamam.textContent=(ORNEK?'ÖRNEK: gönderilmedi. ':'')+'Talebin ulaştı. Ekip e-postayla döner; teklif ihtiyaca göre hazırlanır.';
  tTamam.focus();
}
/* temsilci: kartlardaki sonradan eklenen bağlantılar da açar */
d.addEventListener('click',function(e){
  /* ölçüm: teklif tıklaması (quote_click + kaynak); Calendly/iletişim bağlantısı yeni sekmede açılır, engellenmez */
  if(e.target.closest&&e.target.closest('[data-src="calendly"]')){olay('quote_click','calendly');return}
  var b=e.target.closest&&e.target.closest('[data-teklif]');if(!b)return;
  e.preventDefault();var k=b.getAttribute('data-teklif');olay('quote_click',KAYNAK[k]||'top');teklifAc(k,b);
});
$('#teklif-kapat').addEventListener('click',teklifKapat);
$('#teklif-vazgec').addEventListener('click',teklifKapat);
/* dış alana tıklama yalnız form boşsa kapatır; yazılan kaybolmaz */
dlg.addEventListener('click',function(e){if(e.target===dlg&&tForm.hidden===false&&teklifBos())teklifKapat()});
dlg.addEventListener('close',function(){if(acan&&acan.focus)acan.focus()});
tForm.addEventListener('submit',function(e){
  e.preventDefault();
  if(pasif(tBtn))return;
  $('#t-hata').textContent='';
  if(!epostaBak($('#t-eposta'),$('#t-eposta-hata'))){$('#t-eposta').focus();return}
  tBtn.textContent='Gönderiliyor…';tBtn.setAttribute('aria-disabled','true');
  var nt=D.istek;prov.submit('teklif',alanlar(tForm)).then(function(){if(nt!==D.istek)return;tBtn.textContent='Teklif iste';tBtn.removeAttribute('aria-disabled');teklifBitti()},function(h){if(nt!==D.istek)return;tBtn.textContent='Teklif iste';tBtn.removeAttribute('aria-disabled');$('#t-hata').textContent=gonderHata(h)});
});

/* ---- bekleme listesi ---- */
var bForm=$('#b-form'),bRiza=$('#b-riza'),bBtn=$('#b-gonder'),bRizaHata=$('#b-riza-hata'),bTamam=$('#b-tamam'),bEposta=$('#b-eposta');
function rizaYaz(){
  bBtn.setAttribute('aria-disabled',bRiza.checked?'false':'true');
  if(bRiza.checked)alanHata(bRiza,bRizaHata,'');
}
function rizaHata(odak){alanHata(bRiza,bRizaHata,'Listeye eklemek için açık rıza kutusunu işaretlemen gerekiyor.');if(odak!==false)bRiza.focus()}
function bekleBitti(odak){
  bForm.hidden=true;bTamam.hidden=false;
  bTamam.textContent=(ORNEK?'ÖRNEK: gönderilmedi. ':'')+'Listeye eklendin. '+(D.yakinda?'Araç açılınca haber veririz.':'Hesaplı sürüm açılınca haber veririz.');
  if(odak!==false)bTamam.focus();
}
bRiza.addEventListener('change',rizaYaz);
bForm.addEventListener('submit',function(e){
  e.preventDefault();
  if(bBtn.textContent==='Ekleniyor…'||bBtn.textContent==='Adding…')return;
  if(!bRiza.checked){rizaHata();return}
  if(!epostaBak(bEposta,$('#b-eposta-hata'))){bEposta.focus();return}
  var eski=bBtn.textContent;bBtn.textContent='Ekleniyor…';bBtn.setAttribute('aria-disabled','true');
  var nb=D.istek;prov.submit('bekleme',alanlar(bForm)).then(function(){if(nb!==D.istek)return;bBtn.textContent=eski;rizaYaz();bekleBitti()},function(h){if(nb!==D.istek)return;bBtn.textContent=eski;rizaYaz();alanHata(bEposta,$('#b-eposta-hata'),gonderHata(h))});
});

/* ---- istek (A3-1: corner-forms worker'ı; sözleşme form-worker/src/generate.js + index.js /submit) ---- */
/* yerel depo: smc-anon (rastgele kimlik, kişisel veri değil), smc-son (son başarılı üretim günü, ret için), smc-acik (araç açık görüldü) */
function depo(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
function uuid(){try{if(crypto.randomUUID)return crypto.randomUUID()}catch(e){}var a=new Uint8Array(16);crypto.getRandomValues(a);a[6]=a[6]&15|64;a[8]=a[8]&63|128;var h=Array.prototype.map.call(a,function(x){return(256+x).toString(16).slice(1)}).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)}
function yeniRid(){return uuid()}
function anonAl(){if(D.anon)return D.anon;var a=depo('smc-anon');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a||'')){a=uuid();depo('smc-anon',a)}return(D.anon=a)}
function gunAl(){try{var p={};new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});return p.year+'-'+p.month+'-'+p.day}catch(e){return ''}}
/* ret: ilk üretim ret0; önceki üretim günü dün ret1, 2-7 gün ret2_7, 8+ ret8; aynı gün ya da bilinmiyorsa null */
function retAl(){var s=depo('smc-son'),b=gunAl();if(!b)return null;if(!/^\d{4}-\d\d-\d\d$/.test(s||''))return 'ret0';var f=Math.round((Date.parse(b)-Date.parse(s))/864e5);return !(f>0)?null:f===1?'ret1':f<=7?'ret2_7':'ret8'}
function dilAl(){return root.lang==='en'?'en':'tr'}
/* A4-2c: IG ve Reels gövdesine marka sesi (smc-ses.js varsa ve profil doluysa); LinkedIn'e eklenmez */
function sesEkle(q){var v=window.SMCSes&&SMCSes.voice&&SMCSes.voice();if(v)q.voice=v}
function istekKur(){var g=hedef.value.replace(/\s+/g,' ').trim(),hp=$('input[name="website"]',form);var q={anon:anonAl(),topic:konu.value.replace(/\s+/g,' ').trim(),sector:D.sektor,tone:D.tone,lang:dilAl(),t:Date.now()-T0,hp:hp?hp.value:'',ret:retAl(),rid:D.rid||(D.rid=yeniRid()),ts:''};
  /* /gen/instagram: kind:caption, format post|carousel|reels, cta isteğe bağlı; goal yok */
  if(ARAC==='ig'){q.kind='caption';q.format=D.format||'post';if(D.cta)q.cta=D.cta;sesEkle(q);return q}
  /* /gen/instagram kind:reels: format ve cta gönderilmez (sunucu 400); video isteğe bağlı talk|product|before_after|howto */
  if(ARAC==='reels'){q.kind='reels';if(D.video)q.video=D.video;sesEkle(q);return q}
  if(g)q.goal=g;return q}
function hakAl(r){if(!r)return;if(typeof r.left==='number'){D.left=Math.max(0,r.left);D.hakBilinmez=false}if(typeof r.cap==='number'&&r.cap>0)D.cap=r.cap;if(typeof r.reset_at==='string')D.reset=r.reset_at;if(r.scope==='anon'||r.scope==='ip'||r.scope==='global')D.hakScope=r.scope}
/* A5-4: oturum jetonu smc-oturum (smc-hesap.js yazar; önce sessionStorage, sonra localStorage; düz ya da {"token":…}, smc-yayin.js ile aynı okuma).
   Yalnız okunur; depo kapalıysa ya da biçim dışıysa null → istek jetonsuz, bugünkü gibi. Sunucu geçersiz jetonda anonime düşer (401 yok). */
function oturumJeton(){var ds=[];try{ds.push(window.sessionStorage)}catch(e){}try{ds.push(window.localStorage)}catch(e){}
  for(var i=0;i<ds.length;i++){var v=null;try{v=ds[i]&&ds[i].getItem('smc-oturum')}catch(e){v=null}if(!v)continue;var t=v;
    if(v.charAt(0)==='{'){try{t=JSON.parse(v).token}catch(e){t=null}}if(typeof t==='string'&&/^[A-Za-z0-9_-]{43}$/.test(t))return t}
  return null}
/* jeton yalnız üretim uçlarına gider (sunucu orada taslak geçmişine yazar); /gen/quota, /gen/event, /submit jetonsuz kalır */
var JETON_YOL=/^\/gen\/(linkedin|instagram|refine)$/;
/* tek POST yardımcısı: başarı → gövde; hata → {kod, scope, charged, left, cap, reset_at, field}; ağ → ag; süre → zaman */
function post(yol,govde,ms,kalici){
  if(!window.fetch)return Promise.reject({kod:'ag'});
  var ac=window.AbortController?new AbortController():null,tm=ac&&ms?setTimeout(function(){ac.abort()},ms):null,o={method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(govde),credentials:'omit',cache:'no-store'};
  if(ac)o.signal=ac.signal;if(kalici)o.keepalive=true;
  if(JETON_YOL.test(yol)){var tk=oturumJeton();if(tk)o.headers.authorization='Bearer '+tk}
  return fetch(API+yol,o).then(function(r){clearTimeout(tm);if(r.status===204)return {};return r.json().then(function(j){if(r.ok&&j&&j.ok!==false)return j;j=j||{};throw {kod:j.error||'genel',scope:j.scope,charged:!!j.charged,left:j.left,cap:j.cap,reset_at:j.reset_at,field:j.field}},function(){throw {kod:'genel'}})},function(e){clearTimeout(tm);throw {kod:e&&e.name==='AbortError'?'zaman':'ag'}});
}
/* /submit (index.js): {page, fields:[[etiket, değer]], hp}; site origin'den gelir. Boş alanlar gönderilmez. */
var ROL={isletme:'işletme',ajans:'ajans',serbest:'serbest'};function RIZA(){return 'Evet — metin v1 (https://app.socialmediacorner.co/'+(dilAl()==='en'?'en/privacy':'kvkk')+')'}
function gercekProv(){return{
  linkedin:function(q){return tsAl().then(function(ts){q.ts=ts;return post('/gen/linkedin',q,46000)}).then(function(r){tsSifirla();D.acik=true;depo('smc-acik','1');var g=gunAl();if(g)depo('smc-son',g);return r},function(h){tsSifirla();throw h})},
  instagram:function(q){return tsAl().then(function(ts){q.ts=ts;return post('/gen/instagram',q,46000)}).then(function(r){tsSifirla();D.acik=true;depo('smc-acik','1');var g=gunAl();if(g)depo('smc-son',g);return r},function(h){tsSifirla();throw h})},
  refine:function(q){return post('/gen/refine',q,30000).then(function(r){hakAl(r);if(kayitVar(r)){D.kayit=true;kayitNot()}var a=r&&r.drafts&&r.drafts[0];return{text:a&&typeof a.text==='string'?a.text:null,say:a&&typeof a.say==='string'?a.say:null,flags:a?(Array.isArray(a.flags)?a.flags.slice(0,5):[]):null}})},
  quota:function(){return post('/gen/quota',{anon:anonAl()},10000)},
  olay:function(kind,src){var b={anon:anonAl(),kind:kind};if(src)b.src=src;return post('/gen/event',b,8000,true)},
  submit:function(tur,o){var f=tur==='bekleme'?[['E-posta',o.email],['Ad',o.name],['Rol',ROL[o.role]||''],['Açık rıza',o.consent?RIZA():''],['Ticari ileti izni',o.marketing?'Evet — v1':'']]:[['E-posta',o.email],['Ad',o.name],['Şirket',o.company],['Sektör',o.sector],['Kaynak',o.src],['Dil',dilAl()]];
    return post('/submit',{page:tur==='bekleme'?'/bekleme-listesi':'/teklif',fields:f.filter(function(x){return x[1]}),hp:o.website||''},15000)}
}}
/* ölçüm olayı (/gen/event): yalnız anon + tür + kaynak; kişisel veri yok; sunucu o gün üretim yapmamış anon'u yok sayar */
function olay(kind,src){if(!D.acik||!prov.olay)return;try{prov.olay(kind,src).then(null,function(){})}catch(e){}}
/* Turnstile: sitekey doluysa explicit render (araç açık görülünce ya da ilk üretimde); boşsa hiç yüklenmez ve ts:'' gider.
   Sunucu GEN_ENABLED=1'de her üretimi doğrular; sitekey boşken açılırsa üretim 'bot' döner, sitekey açılıştan önce girilmeli. */
var tsId=null,tsTok='',tsBek=[],tsYuklendi=false;
function tsYukle(){if(!TS||ORNEK||tsYuklendi||!$('#turnstile'))return;tsYuklendi=true;
  window.smcTurnstile=function(){try{tsId=turnstile.render('#turnstile',{sitekey:TS,appearance:'interaction-only',size:'flexible',language:dilAl(),callback:function(t){tsTok=t;tsBek.splice(0).forEach(function(f){f(t)})},'expired-callback':function(){tsTok=''},'error-callback':function(){tsTok='';tsBek.splice(0).forEach(function(f){f('')})}})}catch(e){}};
  var s=d.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=smcTurnstile';s.async=true;s.defer=true;d.head.appendChild(s)}
function tsAl(){if(!TS||ORNEK)return Promise.resolve('');tsYukle();if(tsTok){var t=tsTok;tsTok='';return Promise.resolve(t)}return new Promise(function(ok){var bitti=false;function f(t){if(bitti)return;bitti=true;tsTok='';ok(t||'')}tsBek.push(f);setTimeout(function(){f('')},10000)})}
function tsSifirla(){tsTok='';if(tsId!=null&&window.turnstile)try{turnstile.reset(tsId)}catch(e){}}
function yenMetin(){var g='gece yarısı (İstanbul saati)';if(!D.reset)return ORNEK?YEN:g;var dk=Math.max(1,Math.round((Date.parse(D.reset)-Date.now())/6e4));if(!isFinite(dk))return g;return g+', yaklaşık '+Math.floor(dk/60)+' sa '+(dk%60)+' dk sonra'}
function gonderHata(h){var k=h&&h.kod;return k==='rate'?'Kısa sürede çok gönderim oldu. Birkaç dakika sonra tekrar dene.':k==='ag'?'Bağlantı yok. İnternete bağlanınca tekrar dene.':k==='zaman'?'Yanıt gelmedi. Biraz sonra tekrar dene.':'Gönderilemedi. Alanları kontrol edip tekrar dene.'}
function alanlar(f){var o={};$$('input[name],textarea[name],select[name]',f).forEach(function(x){if(x.type==='checkbox')o[x.name]=x.checked;else if(x.type!=='radio'||x.checked)o[x.name]=x.value});return o}
function taslakNorm(a,i){if(a&&a.kanca)return a;var rl=ARAC==='reels',L=rl?ACIS_R:ACIS,b=(rl?ACI_R:ACI)[a&&a.angle]||L[i]||L[0],o={id:b.id,no:b.no,ad:b.ad,alt:b.alt,text:String(a&&a.text||''),lang:dilAl()};if(rl)o.say=String(a&&a.say||'');if(a&&Array.isArray(a.flags)&&a.flags.length)o.flags=a.flags.slice(0,5);return o}
function hataIsle(h){var k=h.kod||'genel';if(k==='vazgec')return;var s=typeof h.left==='number';if(s)hakAl(h);if(k==='limit'){duvarGoster(h.scope||'anon',true);return}if(k==='not_ready'){D.acik=false;depo('smc-acik',null);duvarGoster('yakinda',true);return}if(k==='llm_limit'){duvarGoster('kapasite',true);return}if(k==='bad_input'&&/^voice/.test(h.field||'')&&window.SMCSes&&SMCSes.sunucuHata){durdur();uretMesgul(false);goster(D.kartVar?'sonuc':'bos',false);durum('');SMCSes.sunucuHata(h.field);return}if(k==='too_large'||k==='slow_down'){durdur();uretMesgul(false);goster(D.kartVar?'sonuc':'bos',false);durum('');if(k==='too_large'){konuHata('Metin çok uzun. Konuyu 300 karaktere indir.');konu.focus()}else{formNot('İstek çok hızlı geldi. Birkaç saniye sonra tekrar dene.');kopru.hidden=true}return}hataGoster(k+(h.charged?'-charged':''),true,s)}

/* ---- derin bağlantı: #tema=dark&teklif=1; #d=durum yalnız ÖRNEK modunda (ornek.js) ---- */
function hashOku(){
  var h=location.hash.replace(/^#/,'');if(!h)return;
  h.split('&').forEach(function(kv){
    var a=kv.split('='),v;try{v=decodeURIComponent(a[1]||'')}catch(e){v=''}
    if(a[0]==='tema'){v=v==='koyu'?'dark':v==='acik'?'light':v;if(v==='dark'||v==='light'){root.setAttribute('data-theme',v);temaYaz()}}
    if((a[0]==='d'||a[0]==='durum')&&mockFn){var s=$('#mock-durum');if(s){s.value=v;if(s.value===v&&root.getAttribute('data-state')!==v)mockFn(v)}}
    if(a[0]==='teklif')teklifAc('top',null);
  });
}
kunyeOzet();konuGuncelle();hakYaz();temaYaz();rizaYaz();
try{var kk=JSON.parse(sessionStorage.getItem('smc-konu')||'null');sessionStorage.removeItem('smc-konu');if(kk){konu.value=kk[0]||'';hedef.value=kk[1]||'';konuGuncelle()}}catch(e){}
if(ORNEK){
  /* ÖRNEK modu: bant görünür, sahte veri + durum seçici ornek.js'te */
  window.SMC={$:$,d:d,D:D,RM:RM,TONLAR:TONLAR,kopru:kopru,durdur:durdur,konuHata:konuHata,alanHata:alanHata,hedef:hedef,hedefHataEl:hedefHataEl,formNot:formNot,dlg:dlg,teklifKapat:teklifKapat,tForm:tForm,bForm:bForm,bTamam:bTamam,bRiza:bRiza,bRizaHata:bRizaHata,bEposta:bEposta,rizaYaz:rizaYaz,uretMesgul:uretMesgul,sonucGoster:sonucGoster,goster:goster,durum:durum,esle:esle,odakla:odakla,konu:konu,konuGuncelle:konuGuncelle,plSec:plSec,duvarGoster:duvarGoster,yukle:yukle,teklifAc:teklifAc,epostaBak:epostaBak,teklifBitti:teklifBitti,rizaHata:rizaHata,bekleBitti:bekleBitti,hataGoster:hataGoster,hashOku:hashOku,mockKur:function(f){mockFn=f},provKur:function(p){prov=p},ARAC:ARAC};
  var bant=$('#ornek-bant');if(bant)bant.hidden=false;
  var os=d.createElement('script');os.src='/assets/ornek.js';d.body.appendChild(os);
}else{
  /* GERÇEK mod: api-base doluysa worker'a bağlan. Açılışta Çok yakında (ya da araç önceden açık görüldüyse boş form, hak belli değil);
     /gen/quota başarılıysa araç açık, hak sayısı sunucudan; 503 not_ready ya da ağ/CORS hatasında Çok yakında + bekleme listesi kalır */
  if(API)prov=gercekProv();
  if(API&&depo('smc-acik')==='1'){D.hakBilinmez=true;goster('bos',false);esle('bos')}else{duvarGoster('yakinda',false);esle('limit-yakinda')}
  hashOku();
  if(API)prov.quota().then(function(r){
    var ilk=D.view==='bos'&&!D.kartVar||D.view==='duvar'&&D.scope==='yakinda';
    D.hakBilinmez=false;D.acik=true;depo('smc-acik','1');hakAl(r);tsYukle();
    if(!ilk){hakYaz();return}
    if(D.left<=0){duvarGoster(D.hakScope||'anon',false);esle('limit-'+(D.hakScope||'anon'))}
    else{D.scope='anon';D.yakinda=false;goster('bos',false);esle('bos')}
  },function(h){
    /* not_ready: araç kapalı → Çok yakında. Ağ hatası: araç önceden açık görüldüyse form kalır, hak "belli değil" */
    var nr=h&&h.kod==='not_ready';if(nr)depo('smc-acik',null);
    if(nr&&D.view==='bos'&&!D.kartVar){D.hakBilinmez=false;duvarGoster('yakinda',false);esle('limit-yakinda')}else hakYaz();
  });
}
window.addEventListener('hashchange',hashOku);
})();
