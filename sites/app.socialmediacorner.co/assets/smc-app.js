(function(){
'use strict';
var d=document,root=d.documentElement;
function $(s,r){return (r||d).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))}
function el(t,c,x){var e=d.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
var RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
var nf=new Intl.NumberFormat('tr-TR');
/* Mod kapısı: api-base boş + yerel/pages.dev host → ÖRNEK (ornek.js); boş + başka host → Çok yakında; dolu → A3-1 sağlayıcısı (bu dalda yok, not_ready). */
var API=(($('meta[name="api-base"]')||{}).content||'').trim(),MOCKHOST=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)||/\.pages\.dev$/.test(location.hostname),ORNEK=!API&&MOCKHOST,mockFn=null;
function hd(){return Promise.reject({kod:'not_ready'})}
/* sağlayıcı arayüzü: linkedin(req), refine(req), quota(), submit(sayfa, alanlar) → Promise; hata {kod, scope?, charged?} */
var prov={linkedin:hd,refine:hd,quota:hd,submit:hd};

/* ---- sabit veri ---- */
var TONLAR=[['samimi','Samimi'],['profesyonel','Profesyonel'],['ogretici','Öğretici'],['cesur','Cesur']];
var PL={
 li:{ad:'LinkedIn',sinir:3000,kat:210,devam:'… devamını gör',giris:'LinkedIn gönderin için hikâye, liste ve görüş.',
  ipucu:'Kesik çizgi kat çizgisidir: LinkedIn akışında ilk ~210 karakter görünür. Metinler örnektir; sektöre, tona ve platforma göre değişir, konuna göre değişmez.',
  bos:'LinkedIn akışında yalnız çizginin üstü görünür; gerisi “… devamını gör” ardında kalır. Yaklaşık ilk 210 karakter kancadır; kesin yer cihaza göre değişir.'},
};
var ACIS=[{"id":"hikaye","no":"01","ad":"Hikâye","alt":"Bir anla açılır, bir dersle kapanır."},{"id":"liste","no":"02","ad":"Liste","alt":"Taranabilir maddeler; kaydetmelik."},{"id":"gorus","no":"03","ad":"Görüş","alt":"Net bir tez; yorum çağırır."}],ACI={hikaye:ACIS[0],liste:ACIS[1],gorus:ACIS[2]};
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
var form=$('#form'),konu=$('#konu'),konuHataEl=$('#konu-hata'),uretBtn=$('#uret'),hedef=$('#hedef'),hedefHataEl=$('#hedef-hata');
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
  var bel=D.view==='hata'&&(HATA[D.hata]||HATA.genel).e==='istemci',sc=D.view==='duvar'?D.scope:'';
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
  var p=$('input[name="platform"]:checked'),pl=PL[p?p.value:'li'];
  D.tone=t.value;D.pl=p?p.value:'li';D.sektor=s.value;
  $('#kunye-ozet').textContent=pl.ad+' · '+s.value+' · '+$('label[for="'+t.id+'"]').textContent;
  $('#giris').textContent=pl.giris;$('#kat-ipucu').textContent=pl.ipucu;$('#kat-bos').textContent=pl.bos;$('#kat-devam').textContent=pl.devam;
}
function plSec(v){var r=$('#p-'+v);if(r&&!r.checked){r.checked=true;kunyeOzet()}}
kunyeBtn.addEventListener('click',function(){
  var a=!kunye.classList.contains('acik');
  kunye.classList.toggle('acik',a);
  kunyeBtn.setAttribute('aria-expanded',a?'true':'false');
});
$$('input[name="sector"],input[name="tone"],input[name="platform"]').forEach(function(i){i.addEventListener('change',kunyeOzet)});

/* ---- üretim akışı ---- */
/* Hak yokken (D5 tıklama): G6 açıktır ya da açılır, odak G6 başlığına iner; taslaklar ekrandaysa yerinde kalır */
function hakYok(){
  if(D.view!=='duvar'){duvarGoster('anon',false);esle(D.kartVar?'sonuc-0':'limit-anon')}
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
  var no=D.istek;prov.linkedin(istekKur()).then(function(r){if(no!==D.istek)return;durdur();D.left=r&&typeof r.left==='number'?r.left:Math.max(0,D.left-1);D.taslaklar=(r&&r.drafts)||[];D.kartVar=true;sonucGoster(true);esle(D.left>=2?'sonuc':'sonuc-'+D.left)},function(h){if(no!==D.istek)return;hataIsle(h||{})});
}
$('#vazgec').addEventListener('click',function(){
  durdur();uretMesgul(false);
  goster(D.kartVar?'sonuc':'bos',false);durum('Vazgeçildi.');esle('vazgecildi');
  /* kalan hak yeniden sorulur (/gen/quota); ÖRNEK'te kısa gecikmeyle aynı sayı */
  $('#hak-alt').textContent='1 hak kullanır';
  var nq=D.istek;prov.quota().then(function(r){if(nq!==D.istek)return;if(r&&typeof r.left==='number')D.left=r.left;hakYaz()},function(){if(nq===D.istek)hakYaz()});
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
  var reels=null;
  if(a.reels){reels=el('p','reels');reels.appendChild(el('b',null,'Reels kancası · ilk 3 sn'));var rk=el('span',null,'“'+a.reels+'”');rk.lang='tr';reels.appendChild(rk)}

  var ey=el('div','eylemler');ey.setAttribute('role','group');ey.setAttribute('aria-label','Taslak '+sira+' eylemleri');
  var bKopya=dugme('Kopyala','btn btn-ink btn-kucuk');
  var bKisalt=dugme('Kısalt','btn btn-cizgi btn-kucuk');
  var bUzat=dugme('Uzat','btn btn-cizgi btn-kucuk');
  var tonId='ton-'+a.id,bTon=dugme('Ton','btn btn-cizgi btn-kucuk');
  /* tur-4: dar ekranda düğme en uzun etiketine göre yer ayırır (CSS ::after); "Kısaltılıyor…", "Kopyalandı" satırı kaydırmaz */
  bKopya.setAttribute('data-genis','Kopyalandı');bKisalt.setAttribute('data-genis','Kısaltılıyor…');bUzat.setAttribute('data-genis','Uzatılıyor…');bTon.setAttribute('data-genis','Ton değişiyor…');
  bTon.setAttribute('aria-expanded','false');bTon.setAttribute('aria-controls',tonId);
  ey.appendChild(bKopya);ey.appendChild(bKisalt);ey.appendChild(bUzat);ey.appendChild(bTon);
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
  hz.appendChild(d.createTextNode((HIZMET[sira-1]||HIZMET[0])+' '));
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
    var t=metinKur(a,st),k=kes(t,pl.kat),kat=k[1].length>0,n=t.length;
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
    kh.textContent='';geri.hidden=true;once={lv:st.lv,ton:st.ton,ham:st.ham};
    var eski=btn.textContent;mesgul=true;art.setAttribute('aria-busy','true');btn.textContent=yapiliyor;yenile();
    ks.textContent=yapiliyor;
    function bit(){
      mesgul=false;art.removeAttribute('aria-busy');btn.textContent=eski;
      if(hataSirada){hataSirada=false;once=null;yenile();ks.textContent='';kh.textContent='Düzenlenemedi; taslağın aynı duruyor. Tekrar dene.';return}
      fn();if(st.yeni!=null){st.ham=st.yeni;st.yeni=null}D.refine++;ciz();geri.hidden=false;
      ks.textContent=bitti+' Hak düşmedi.'+(D.refine>=9?' '+SINIR:'');
      if(D.refine>=9)D.kartApi.forEach(function(x){x.yenile()});
      /* tur-5: sınırda odak düğmede kalır (D5); neden canlı bölgede söylenir */
      if(btn!==bTon&&pasif(btn)&&D.refine<9)ks.textContent+=btn===bKisalt?' Taslak en kısa hâlinde; daha fazla kısalmaz.':' Taslak en uzun hâlinde; daha fazla uzamaz.';
      /* tur-1: uzayan metin durum satırını ve Geri al'ı katın altına itmesin (mock'ta kaydırma yok) */
      if(!aninda&&geri.scrollIntoView)geri.scrollIntoView({block:'nearest',behavior:RM?'auto':'smooth'});
    }
    if(aninda){bit();return}
    var op=btn===bKisalt?'shorten':btn===bUzat?'lengthen':'tone',lv0=st.lv,ton0=st.ton;fn();var hton=st.ton;st.lv=lv0;st.ton=ton0;
    prov.refine({anon:D.anon||null,op:op,tone:op==='tone'?hton:undefined,text:st.metin,lang:dilAl(),rid:yeniRid()}).then(function(r){if(r&&typeof r.text==='string')st.yeni=r.text;bit()},function(){hataSirada=true;bit()});
  }
  bKisalt.addEventListener('click',function(){if(pasif(bKisalt)){neden(bKisalt);return}duzenle(function(){st.lv--},bKisalt,'Kısaltılıyor…','Kısaltıldı.')});
  bUzat.addEventListener('click',function(){if(pasif(bUzat)){neden(bUzat);return}duzenle(function(){st.lv++},bUzat,'Uzatılıyor…','Uzatıldı.')});
  geri.addEventListener('click',function(){
    if(!once||mesgul)return;
    st.lv=once.lv;st.ton=once.ton;st.ham=once.ham;once=null;ciz();geri.hidden=true;ks.textContent='Geri alındı.';bKopya.focus();
  });
  /* kopyalama üç kademe: pano → seçim (execCommand) → görünür K6 alanı; her zaman saklanan metinden */
  function elleAc(){
    elleT.value=st.metin;elle.hidden=false;
    elleN.textContent='Kopyalanamadı. Metin aşağıdaki alanda seçili: Ctrl/Cmd + C ile ya da uzun basıp kopyala.';
    try{elleT.focus();elleT.select()}catch(e){}
  }
  elleK.addEventListener('click',function(){elle.hidden=true;elleN.textContent='';bKopya.focus()});
  bKopya.addEventListener('click',function(){
    if(pasif(bKopya))return;
    kopyala(st.metin,function(){
      bKopya.textContent='Kopyalandı';kh.textContent='';ks.textContent='Kopyalandı. LinkedIn’e yapıştır, kendi sesinle bitir.';
      $$('.hizmet',kartlar).forEach(function(x){x.hidden=true});hz.hidden=false;
      setTimeout(function(){bKopya.textContent='Kopyala'},2000);
    },elleAc);
  });
  if(navigator.share){
    bPay=dugme('Paylaş','btn btn-cizgi btn-kucuk');
    bPay.addEventListener('click',function(){if(pasif(bPay))return;try{navigator.share({text:st.metin}).catch(function(){})}catch(e){}});
    ey.insertBefore(bPay,bTon); /* tur-3: Ton ile ton grubu art arda kalsın (odak sırası) */
  }
  govde.appendChild(p1);govde.appendChild(fold);govde.appendChild(p2);govde.appendChild(olcu);if(reels)govde.appendChild(reels);govde.appendChild(ey);govde.appendChild(tonG);
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
function sonucGoster(odak){
  durdur();uretMesgul(false);D.kartVar=true;
  kartlar.textContent='';D.kartApi=[];
  (D.taslaklar||[]).forEach(function(a,i){kartlar.appendChild(kart(taslakNorm(a,i)))});
  uyari.className='not not-uyari';
  if(D.left===1){uyari.hidden=false;uyari.textContent='Son hakkın: bugün 3 hakkından 1 kaldı. Kısalt, Uzat ve Ton hak düşürmez.'}
  else{uyari.hidden=true;uyari.textContent=''}
  /* S3c: son hak kullanıldıysa taslaklar + G6 (anon) + G7; odak h2'de */
  if(D.left<=0){duvarHazirla('anon');goster('duvar',odak);durum('3 taslak hazır. '+DUVAR.anon.b);return}
  goster('sonuc',odak);durum('3 taslak hazır.');
}

/* ---- hata (G5, kartların üstünde) ---- */
function hataGoster(kod,odak){
  durdur();uretMesgul(false);
  var ch=/-charged$/.test(kod);kod=kod.replace(/-charged$/,'');
  var h=HATA[kod]||HATA.genel;D.hata=kod;
  if(ch)D.left=Math.max(0,D.left-1);
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
  w.d.forEach(function(x){var g=el('div');g.appendChild(el('dt',null,x[0]));g.appendChild(el('dd',null,x[1]));dl.appendChild(g)});
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
function temaYaz(){temaBtn.setAttribute('aria-pressed',etkinTema()==='dark'?'true':'false')}
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
  var b=e.target.closest&&e.target.closest('[data-teklif]');if(!b)return;
  e.preventDefault();teklifAc(b.getAttribute('data-teklif'),b);
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
  var nt=D.istek;prov.submit('teklif',alanlar(tForm)).then(function(){if(nt!==D.istek)return;tBtn.textContent='Teklif iste';tBtn.removeAttribute('aria-disabled');teklifBitti()},function(){if(nt!==D.istek)return;tBtn.textContent='Teklif iste';tBtn.removeAttribute('aria-disabled');$('#t-hata').textContent='Gönderilemedi. Alanları kontrol edip tekrar dene.'});
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
  var nb=D.istek;prov.submit('bekleme',alanlar(bForm)).then(function(){if(nb!==D.istek)return;bBtn.textContent=eski;rizaYaz();bekleBitti()},function(){if(nb!==D.istek)return;bBtn.textContent=eski;rizaYaz();alanHata(bEposta,$('#b-eposta-hata'),'Gönderilemedi. Alanları kontrol edip tekrar dene.')});
});

/* ---- istek (A0 biçimi; anon/ret/Turnstile/fetch A3-1'de) ---- */
function yeniRid(){var a=new Uint8Array(8);crypto.getRandomValues(a);return Array.prototype.map.call(a,function(x){return(256+x).toString(16).slice(1)}).join('')}
function dilAl(){return root.lang==='en'?'en':'tr'}
function istekKur(){var g=hedef.value.replace(/\s+/g,' ').trim(),hp=$('input[name="website"]',form);var q={anon:D.anon||null,topic:konu.value.replace(/\s+/g,' ').trim(),sector:D.sektor,tone:D.tone,lang:dilAl(),t:'',hp:hp?hp.value:'',ret:null,rid:D.rid||(D.rid=yeniRid()),ts:Date.now()};if(g)q.goal=g;return q}
function alanlar(f){var o={};$$('input[name],textarea[name],select[name]',f).forEach(function(x){if(x.type==='checkbox')o[x.name]=x.checked;else if(x.type!=='radio'||x.checked)o[x.name]=x.value});return o}
function taslakNorm(a,i){if(a&&a.kanca)return a;var b=ACI[a&&a.angle]||ACIS[i]||ACIS[0];return{id:b.id,no:b.no,ad:b.ad,alt:b.alt,text:String(a&&a.text||''),lang:dilAl()}}
function hataIsle(h){var k=h.kod||'genel';if(k==='vazgec')return;if(k==='limit'){duvarGoster(h.scope||'anon',true);return}if(k==='not_ready'){duvarGoster('yakinda',true);return}if(k==='llm_limit'){duvarGoster('kapasite',true);return}if(k==='too_large'||k==='slow_down'){durdur();uretMesgul(false);goster(D.kartVar?'sonuc':'bos',false);durum('');if(k==='too_large'){konuHata('Metin çok uzun. Konuyu 300 karaktere indir.');konu.focus()}else{formNot('İstek çok hızlı geldi. Birkaç saniye sonra tekrar dene.');kopru.hidden=true}return}hataGoster(k+(h.charged?'-charged':''),true)}

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
  window.SMC={$:$,d:d,D:D,RM:RM,TONLAR:TONLAR,kopru:kopru,durdur:durdur,konuHata:konuHata,alanHata:alanHata,hedef:hedef,hedefHataEl:hedefHataEl,formNot:formNot,dlg:dlg,teklifKapat:teklifKapat,tForm:tForm,bForm:bForm,bTamam:bTamam,bRiza:bRiza,bRizaHata:bRizaHata,bEposta:bEposta,rizaYaz:rizaYaz,uretMesgul:uretMesgul,sonucGoster:sonucGoster,goster:goster,durum:durum,esle:esle,odakla:odakla,konu:konu,konuGuncelle:konuGuncelle,plSec:plSec,duvarGoster:duvarGoster,yukle:yukle,teklifAc:teklifAc,epostaBak:epostaBak,teklifBitti:teklifBitti,rizaHata:rizaHata,bekleBitti:bekleBitti,hataGoster:hataGoster,hashOku:hashOku,mockKur:function(f){mockFn=f},provKur:function(p){prov=p}};
  var bant=$('#ornek-bant');if(bant)bant.hidden=false;
  var os=d.createElement('script');os.src='/assets/ornek.js';d.body.appendChild(os);
}else{duvarGoster('yakinda',false);esle('limit-yakinda');hashOku()}
window.addEventListener('hashchange',hashOku);
})();
