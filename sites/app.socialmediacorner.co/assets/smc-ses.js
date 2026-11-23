/* A4-2c · Marka sesi (G9): yalnız IG ve Reels sayfalarında, smc-app.js'ten önce defer ile yüklenir.
   Profil yalnız bu tarayıcıda durur: localStorage['smc-ses-v1'] (her okuma/yazma try/catch). Yazılamazsa
   bellekte kalır, sekme kapanınca silinir. Sunucu sözleşmesi form-worker/src/generate.js validateVoice ile aynı:
   name ≤60, audience ≤160, adjectives ≤3 (sabit 12), banned ≤10 × ≤30, sample ≤600, address sen|siz,
   emoji none|few; toplam (name+audience+banned+sample) ≤1200. Kullanıcı metni yalnız textContent/value ile yazılır. */
(function(){'use strict';
var d=document,KEY='smc-ses-v1',
    MAX={name:60,audience:160,adjectives:3,banned:10,bannedItem:30,sample:600,total:1200,sector:40},
    SIFAT=['sicak','esprili','yalin','sakin','enerjik','uzman','oyuncu','zarif','dogrudan','guven_veren','merakli','mutevazi'],
    HITAP=['sen','siz'],EMOJI=['none','few'],
    CTRL=/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g,
    INVIS=/[\u00AD\u034F\u115F\u1160\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\u3164\uFEFF\uFFA0\u{E0000}-\u{E007F}]/gu,
    TRK={'İ':'i','I':'i','ı':'i','Ş':'s','ş':'s','Ç':'c','ç':'c','Ö':'o','ö':'o','Ü':'u','ü':'u','Ğ':'g','ğ':'g'},
    MARKA=/social[\s._-]*media[\s._-]*corner/,
    DEPO_MSJ='Bu tarayıcı saklamaya izin vermiyor; sekme kapanınca silinir.',
    E={name:'Marka adı en çok 60 karakter olabilir.',nameMarka:'Bu ad kullanılamaz. Kendi markanın adını yaz.',
       audience:'Hedef kitle en çok 160 karakter olabilir.',adjectives:'En çok 3 sıfat seç.',
       banned:'En çok 10 yasak kelime yaz.',bannedItem:'Her yasak kelime en çok 30 karakter olabilir.',
       bannedChar:'Yasak kelimelerde | işaretini kullanma.',sample:'Örnek gönderi en çok 600 karakter olabilir.',
       total:'Profil çok uzun. Marka adı, hedef kitle, yasak kelimeler ve örnek gönderi toplamı en çok 1200 karakter olabilir.',
       bos:'Profil boş. En az bir alanı doldur.'};
var depoYok=false,bellek=null,zorla=false;/* zorla: yalnız ÖRNEK ses-saklanamaz durumu */

/* ---- saklama ve doğrulama (DOM'suz) ---- */
function temiz(s){return String(s==null?'':s).normalize('NFC').replace(/\r\n?/g,'\n').replace(/\t/g,' ').replace(CTRL,'').replace(INVIS,'').trim().replace(/\n{3,}/g,'\n\n')}
/* sunucu gen-prompt.js fold ile aynı: U+FE00-FE0F atlanır, harf başına TR → tek kod noktalık NFKC → küçük harf → LOOK */
var LOOK={'а':'a','с':'c','ԁ':'d','е':'e','һ':'h','і':'i','ј':'j','к':'k','о':'o','р':'p','ѕ':'s','у':'y','α':'a','ε':'e','ι':'i','κ':'k','ν':'v','ο':'o','ρ':'p','τ':'t','υ':'u'};
function katla1(c){if(TRK[c])return TRK[c];var n=c.normalize('NFKC');if([...n].length===1)c=n;if(TRK[c])c=TRK[c];else{var l=c.toLowerCase();if([...l].length===1)c=l}return LOOK[c]||c}
function katla(s){var f='';for(var c of String(s)){var k=c.codePointAt(0);if(!(k>=0xFE00&&k<=0xFE0F))f+=katla1(c)}return f}/* görünmezler temiz()'de gitti */
function kopya(p){return JSON.parse(JSON.stringify(p))}
function dizi(v){return Array.isArray(v)?v:typeof v==='string'&&v?v.split(','):[]}
/* tek nokta: sunucuya giden alanlar + yerel sektör; {ok, p, hatalar:{alan:mesaj}, toplam} */
function dogrula(x){
  x=x&&typeof x==='object'?x:{};var h={},p={v:1};
  p.name=temiz(x.name);if(p.name.length>MAX.name)h.name=E.name;else if(MARKA.test(katla(p.name)))h.name=E.nameMarka;
  p.sector=temiz(x.sector).slice(0,MAX.sector);
  p.audience=temiz(x.audience);if(p.audience.length>MAX.audience)h.audience=E.audience;
  p.adjectives=[];dizi(x.adjectives).forEach(function(a){a=String(a).normalize('NFC');if(SIFAT.indexOf(a)>=0&&p.adjectives.indexOf(a)<0)p.adjectives.push(a)});
  if(p.adjectives.length>MAX.adjectives)h.adjectives=E.adjectives;
  p.banned=[];var ham=dizi(x.banned);
  ham.forEach(function(b){if(/[|\n\r\u0085\u2028\u2029]/.test(String(b)))h.banned=E.bannedChar;var s=temiz(b);if(s){if(s.length>MAX.bannedItem&&!h.banned)h.banned=E.bannedItem;p.banned.push(s)}});
  if(!h.banned&&p.banned.length>MAX.banned)h.banned=E.banned;
  p.sample=temiz(x.sample);if(p.sample.length>MAX.sample)h.sample=E.sample;
  p.address=HITAP.indexOf(x.address)>=0?x.address:'';
  p.emoji=EMOJI.indexOf(x.emoji)>=0?x.emoji:'';
  var t=p.name.length+p.audience.length+p.banned.reduce(function(a,s){return a+s.length},0)+p.sample.length;
  if(t>MAX.total)h.total=E.total;
  if(!Object.keys(h).length&&!dolu(p)&&!p.sector)h.bos=E.bos;
  return {ok:!Object.keys(h).length,p:p,hatalar:h,toplam:t};
}
function dolu(p){return !!(p&&(p.name||p.audience||p.adjectives.length||p.banned.length||p.sample||p.address||p.emoji))}
function oku(){
  if(depoYok||zorla)return bellek?kopya(bellek):null;
  var s=null;try{s=localStorage.getItem(KEY)}catch(e){depoYok=true;return bellek?kopya(bellek):null}
  if(!s)return null;var j;try{j=JSON.parse(s)}catch(e){return null}
  var r=dogrula(j);return r.ok?r.p:null;
}
function yaz(x){
  var r=dogrula(x);if(!r.ok)return r;var j=JSON.stringify(r.p);
  try{if(zorla)throw new Error('depo');localStorage.setItem(KEY,j);if(localStorage.getItem(KEY)!==j)throw new Error('depo');depoYok=false;bellek=null;r.saklandi=true}
  catch(e){depoYok=true;bellek=kopya(r.p);r.saklandi=false}
  return r;
}
function sil(){bellek=null;var ok=true;try{localStorage.removeItem(KEY)}catch(e){ok=false}return ok}
/* /gen/instagram ve /gen/refine gövdesindeki voice: yalnız dolu alanlar; boşsa null (gövdeye eklenmez) */
function voice(){
  var p=oku();if(!dolu(p))return null;var o={};
  if(p.name)o.name=p.name.replace(/\s*\n\s*/g,' ');if(p.audience)o.audience=p.audience.replace(/\s*\n\s*/g,' ');
  if(p.adjectives.length)o.adjectives=p.adjectives.slice();if(p.banned.length)o.banned=p.banned.slice();
  if(p.sample)o.sample=p.sample;if(p.address)o.address=p.address;if(p.emoji)o.emoji=p.emoji;
  return o;
}
var API={oku:oku,yaz:yaz,sil:sil,voice:voice,dogrula:dogrula,MAX:MAX,DEPO_MSJ:DEPO_MSJ,depoKapali:function(){return depoYok}};
window.SMCSes=API;

/* ---- arayüz: form satırı + G9 dialog ---- */
function $(s,k){return (k||d).querySelector(s)}
function $$(s,k){return Array.prototype.slice.call((k||d).querySelectorAll(s))}
function kur(){
  var dlg=$('#ses'),f=$('#ses-form'),ac=$('#ses-ac');if(!dlg||!f||!ac)return;
  var adEl=$('#ses-ad'),satirNot=$('#ses-not'),depoNot=$('#ses-depo'),onay=$('#ses-onay'),silB=$('#ses-sil'),
      toplamEl=$('#ses-toplam'),ornekSay=$('#ses-ornek-say'),sifatSay=$('#ses-sifat-say'),genelHata=$('#ses-hata'),acan=null;
  var ALAN={name:'#ses-ad-g',audience:'#ses-kitle',banned:'#ses-yasak',sample:'#ses-ornek'};
  function notYaz(el,m,tur){if(!el)return;el.textContent=m||'';el.hidden=!m;el.classList.toggle('not-ok',tur==='ok');el.classList.toggle('not-uyari',tur==='uyari');el.classList.toggle('not-hata',tur==='hata')}
  function satirYaz(){
    var p=oku(),var_=!!(p&&(dolu(p)||p.sector));
    /* kullanıcı adı çevrilmez (data-sabit); "yok" EN sözlüğünden geçer */
    if(var_&&p.name){adEl.setAttribute('data-sabit','');adEl.textContent=p.name}
    else{adEl.removeAttribute('data-sabit');adEl.textContent=var_?'adsız profil':'yok'}
    ac.textContent=var_?'Düzenle':'Ekle';
    if(depoYok&&var_)notYaz(satirNot,DEPO_MSJ,'uyari');
  }
  function formdan(){
    var o={};o.name=$('#ses-ad-g').value;o.sector=$('#ses-sektor').value;o.audience=$('#ses-kitle').value;
    o.adjectives=$$('input[name="adjectives"]:checked',f).map(function(i){return i.value});
    o.banned=$('#ses-yasak').value;o.sample=$('#ses-ornek').value;
    var a=$('input[name="address"]:checked',f),e=$('input[name="emoji"]:checked',f);o.address=a?a.value:'';o.emoji=e?e.value:'';
    return o;
  }
  function forma(p){
    p=p||{};$('#ses-ad-g').value=p.name||'';$('#ses-kitle').value=p.audience||'';$('#ses-ornek').value=p.sample||'';
    $('#ses-yasak').value=(p.banned||[]).join(', ');
    var s=$('#ses-sektor');s.value=p.sector||'';if(s.value!==(p.sector||''))s.value='';
    $$('input[name="adjectives"]',f).forEach(function(i){i.checked=(p.adjectives||[]).indexOf(i.value)>=0});
    $$('input[name="address"]',f).forEach(function(i){i.checked=i.value===(p.address||'')});
    $$('input[name="emoji"]',f).forEach(function(i){i.checked=i.value===(p.emoji||'')});
    sayac();
  }
  function hataTemizle(){
    Object.keys(ALAN).forEach(function(k){var i=$(ALAN[k]);i.removeAttribute('aria-invalid')});
    $$('.alan-hata',f).forEach(function(x){x.textContent='';x.hidden=true});notYaz(genelHata,'');
  }
  function hataGoster(h){
    var ilk=null;
    Object.keys(h).forEach(function(k){
      var m=h[k];if(k==='total'||k==='bos'){notYaz(genelHata,m,'hata');if(!ilk)ilk=$('#ses-ad-g');return}
      var he=$('#ses-'+k+'-hata');if(he){he.textContent=m;he.hidden=false}
      var i=ALAN[k]?$(ALAN[k]):$('input[name="adjectives"]',f);if(ALAN[k])i.setAttribute('aria-invalid','true');if(!ilk)ilk=i;
    });
    if(ilk)ilk.focus();
  }
  function sayac(){
    var r=dogrula(formdan());toplamEl.textContent=r.toplam+'/'+MAX.total;toplamEl.parentNode.classList.toggle('sayac-uyari',r.toplam>MAX.total);
    var n=temiz($('#ses-ornek').value).length;ornekSay.textContent=n+'/'+MAX.sample;ornekSay.classList.toggle('sayac-uyari',n>MAX.sample);
    sifatSay.textContent=r.p.adjectives.length+'/'+MAX.adjectives;
  }
  function adim(onayda){f.hidden=!!onayda;onay.hidden=!onayda}
  function sesAc(btn){
    acan=btn||null;hataTemizle();adim(false);var p=oku();forma(p);silB.hidden=!p;
    notYaz(depoNot,depoYok?DEPO_MSJ:'','uyari');
    if(dlg.showModal){if(!dlg.open)dlg.showModal()}else dlg.setAttribute('open','');
    /* odak başlıkta: önce ne istendiği okunur (teklif dialog'uyla aynı) */
    $('#ses-baslik').focus();
  }
  function sesKapat(){if(dlg.close){if(dlg.open)dlg.close()}else{dlg.removeAttribute('open');kapandi()}}
  function kapandi(){adim(false);if(acan&&acan.focus)acan.focus()}
  /* sektör çipi: profildeki sektör formdaki çipi seçer; change ile künye özeti güncellenir */
  function sektorUygula(p){
    if(!p||!p.sector)return;var form=$('#form');if(!form)return;
    var hit=$$('input[name="sector"]',form).filter(function(i){return i.value===p.sector})[0];
    if(hit&&!hit.checked){hit.checked=true;hit.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  ac.addEventListener('click',function(){sesAc(ac)});
  /* A4-2c-nav: üst gezintideki "Marka sesi" aynı dialogu açar; odak kapanınca o düğmeye döner */
  var navB=$('#ses-nav');if(navB)navB.addEventListener('click',function(){sesAc(navB)});
  /* #ses derin bağlantısı (LinkedIn sayfasındaki gezinti bağlantısı): diğer anahtarlar (#ornek, #d=, #tema=) korunur, yalnız ses düşer */
  function hashSes(){
    var h=location.hash.replace(/^#/,'');if(!h)return;var p=h.split('&'),k=p.filter(function(x){return x.split('=')[0]!=='ses'});
    if(k.length===p.length)return;
    var y=k.length?'#'+k.join('&'):location.pathname+location.search;
    try{history.replaceState(null,'',y)}catch(e){}
    if(!dlg.open)sesAc(navB||ac);
  }
  /* sayfa yüklemesi bitince açılır: smc-app.js ve ÖRNEK (ornek.js) ilk durumunu kurmuş olur, odak dialogda kalır */
  if(d.readyState==='complete')hashSes();else window.addEventListener('load',hashSes);
  window.addEventListener('hashchange',hashSes);
  $('#ses-kapat').addEventListener('click',sesKapat);
  $('#ses-vazgec').addEventListener('click',sesKapat);
  dlg.addEventListener('close',kapandi);
  /* odak tuzağı: Tab ve Shift+Tab dialog içinde döner (showModal dışarıyı zaten etkisiz kılar; adres çubuğuna kaçışı da önler) */
  dlg.addEventListener('keydown',function(e){
    if(e.key!=='Tab')return;
    var o=$$('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])',dlg).filter(function(x){return !x.disabled&&x.getClientRects().length&&!x.closest('[hidden]')});
    if(!o.length)return;var ilk=o[0],son=o[o.length-1],a=d.activeElement;
    if(e.shiftKey&&(a===ilk||!dlg.contains(a)||a===$('#ses-baslik'))){e.preventDefault();son.focus()}
    else if(!e.shiftKey&&(a===son||!dlg.contains(a))){e.preventDefault();ilk.focus()}
  });
  f.addEventListener('input',sayac);
  f.addEventListener('change',function(e){
    var t=e.target;
    if(t.name==='adjectives'&&t.checked&&$$('input[name="adjectives"]:checked',f).length>MAX.adjectives){
      t.checked=false;var he=$('#ses-adjectives-hata');he.textContent=E.adjectives;he.hidden=false;
    }else if(t.name==='adjectives'){var he2=$('#ses-adjectives-hata');he2.textContent='';he2.hidden=true}
    sayac();
  });
  f.addEventListener('submit',function(e){
    e.preventDefault();hataTemizle();
    var r=yaz(formdan());if(!r.ok){hataGoster(r.hatalar);return}
    satirYaz();sektorUygula(r.p);
    notYaz(satirNot,r.saklandi?'Marka sesi kaydedildi.':DEPO_MSJ,r.saklandi?'ok':'uyari');
    sesKapat();
  });
  silB.addEventListener('click',function(){adim(true);$('#ses-sil-hayir').focus()});
  $('#ses-sil-hayir').addEventListener('click',function(){adim(false);silB.focus()});
  $('#ses-sil-evet').addEventListener('click',function(){
    sil();satirYaz();notYaz(satirNot,'Marka sesi silindi.','ok');sesKapat();
  });
  /* ÖRNEK ve smc-app.js için arayüz kancaları */
  API.ac=sesAc;API.kapat=sesKapat;API.satirYaz=satirYaz;API.forma=forma;API.formdan=formdan;API.hataGoster=hataGoster;API.notYaz=function(m,t){notYaz(satirNot,m,t)};
  API.depoKapat=function(){zorla=true;depoYok=true};API.depoAc=function(){zorla=false;depoYok=false;bellek=null};
  API.sunucuHata=function(){notYaz(satirNot,'Marka sesi kabul edilmedi. Profili düzenleyip tekrar dene.','hata');ac.focus()};
  satirYaz();sektorUygula(oku());
}
/* defer betikleri DOMContentLoaded'dan önce çalışır: smc-app.js'in change dinleyicisi kurulduktan sonra sektör uygulanır */
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',kur);else kur();
})();
