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

/* ---- PLAN madde 1 · etkin ses: hesap (GET /app/voice) | yerel (smc-ses-v1) | hazır (smc-ses-hazir.js) | yok ----
   Seçim localStorage['smc-ses-secim'] = {tur, id}; bütün stüdyo sayfaları aynı seçimi okur. Seçilen ses #stil kutusuna
   yazılmaz (elle yazılan ezilmesin); kabuk istekKur() gövdeyi kurarken SMCSes.stilAl() çıktısını style'a ekler.
   Hesap sesi: girişliyse bir kez GET; 401/404/503/ağ hatasında seçenek gizli kalır, kullanıcıya hata gösterilmez. */
var EN=d.documentElement.lang==='en',SECIM_KEY='smc-ses-secim',STIL_MAX=3000,TURLER=['hesap','yerel','hazir','yok'],
    /* fw/cms.js SECTOR_MAP istemci kopyası: brand_voice.sector → stüdyo sektör çipi; listede olmayan dolu değer Genel */
    SEKTOR_ESLE={ecom:'E-ticaret',tech:'Yazılım',services:'Danışmanlık',agency:'Danışmanlık',fin:'Danışmanlık',edu:'Eğitim',health:'Sağlık',estate:'Gayrimenkul',industry:'Üretim'},
    SEKTOR_TERS={'E-ticaret':'ecom','Yazılım':'tech','Danışmanlık':'services','Eğitim':'edu','Sağlık':'health','Gayrimenkul':'estate','Üretim':'industry'},
    /* onboarding tonu (fw/platform.js VOICE_TONES) → stüdyo ton çipi */
    TON_ESLE={samimi:'samimi',kurumsal:'profesyonel',net:'profesyonel',veri:'profesyonel',ogretici:'ogretici',esprili:'cesur',ilham:'cesur'},
    TON_AD={samimi:['samimi','friendly'],kurumsal:['kurumsal','corporate'],esprili:['esprili','witty'],ogretici:['öğretici','educational'],ilham:['ilham verici','inspiring'],net:['net ve kısa','clear and brief'],veri:['veri odaklı','data-driven']},
    /* yerel profil sıfatı → stüdyo ton çipi (ilk sıfat) ve → sunucu tonu (PUT) */
    SIFAT_TON={sicak:'samimi',esprili:'cesur',yalin:'profesyonel',sakin:'profesyonel',enerjik:'cesur',uzman:'ogretici',oyuncu:'cesur',zarif:'profesyonel',dogrudan:'profesyonel',guven_veren:'profesyonel',merakli:'ogretici',mutevazi:'samimi'},
    SIFAT_SUNUCU={sicak:'samimi',esprili:'esprili',yalin:'net',sakin:'kurumsal',enerjik:'ilham',uzman:'ogretici',oyuncu:'esprili',zarif:'kurumsal',dogrudan:'net',guven_veren:'kurumsal',merakli:'ogretici',mutevazi:'samimi'},
    SIFAT_AD={sicak:['sıcak','warm'],esprili:['esprili','witty'],yalin:['yalın','plain'],sakin:['sakin','calm'],enerjik:['enerjik','energetic'],uzman:['uzman','expert'],oyuncu:['oyuncu','playful'],zarif:['zarif','elegant'],dogrudan:['doğrudan','direct'],guven_veren:['güven veren','reassuring'],merakli:['meraklı','curious'],mutevazi:['mütevazı','modest']},
    /* fw/platform.js VOICE_MAX ve listeleri (validateVoice) */
    V_SEKTOR=['','agency','ecom','edu','estate','fin','food','health','industry','other','services','tech','travel'],
    V_TON=['samimi','kurumsal','esprili','ogretici','ilham','net','veri'],VMAX={tones:3,samples:3,sample:2200,banned:30,word:40};
var hesap={durum:'bilinmez',voice:null},secimBellek=null;/* durum: bilinmez | acik (GET 200) | kapali */
function T(tr,en){return EN?en:tr}
function hazirlar(){var h=window.SMCSesHazir;return Array.isArray(h)?h:[]}
function hazirBul(id){return hazirlar().filter(function(x){return x&&x.id===id})[0]||null}
function dil(o){return o&&typeof o==='object'?(EN?o.en:o.tr):o}
function secimOku(){
  var s=secimBellek;try{var v=localStorage.getItem(SECIM_KEY);if(v)s=JSON.parse(v)}catch(e){}
  if(!s||typeof s!=='object'||TURLER.indexOf(s.tur)<0)return null;
  return {tur:s.tur,id:s.tur==='hazir'&&typeof s.id==='string'?s.id:null};
}
function secimYaz(s){secimBellek={tur:s.tur,id:s.id||null};try{localStorage.setItem(SECIM_KEY,JSON.stringify(secimBellek))}catch(e){}}
function yerelVar(){var p=oku();return !!(p&&(dolu(p)||p.sector))}
function hesapDolu(v){return !!(v&&(v.sector||v.tones.length||v.samples.length||v.banned.length))}
/* sunucu yanıtı güvenilmez veri: yalnız beklenen şekil alınır */
function sesTemiz(v){
  if(!v||typeof v!=='object')return null;
  function liste(a,n,m){return (Array.isArray(a)?a:[]).filter(function(x){return typeof x==='string'&&x.trim()}).map(function(x){return temiz(x).slice(0,m)}).filter(Boolean).slice(0,n)}
  return {sector:typeof v.sector==='string'&&V_SEKTOR.indexOf(v.sector)>=0?v.sector:'',
    tones:liste(v.tones,VMAX.tones,20).filter(function(x){return V_TON.indexOf(x)>=0}),
    samples:liste(v.samples,VMAX.samples,VMAX.sample),banned:liste(v.banned,VMAX.banned,VMAX.word)};
}
/* kayıtlı seçim kullanılamıyorsa (hesap yüklenmedi, profil silindi, hazır ses kalktı) kayıt korunur, yedek seçilir */
function etkin(){
  var s=secimOku();
  if(s){
    if(s.tur==='yok')return {tur:'yok',id:null};
    if(s.tur==='hazir'&&hazirBul(s.id))return s;
    if(s.tur==='yerel'&&yerelVar())return s;
    if(s.tur==='hesap'&&hesapDolu(hesap.voice))return s;
  }
  if(yerelVar())return {tur:'yerel',id:null};
  if(hesapDolu(hesap.voice))return {tur:'hesap',id:null};
  return {tur:'yok',id:null};
}
/* etkin sesin ortak biçimi: {ad, sector (çip değeri), tone (çip değeri), satirlar[], ornekler[], yasak[]} */
function kaynak(e){
  e=e||etkin();var k={ad:'',sector:'',tone:'',satirlar:[],ornekler:[],yasak:[]};
  if(e.tur==='hazir'){var h=hazirBul(e.id);if(!h)return null;
    k.ad=dil(h.ad)||'';k.sector=h.sector||'';k.tone=h.tone||'';var oz=dil(h.ozet);if(oz)k.satirlar.push(T('Ses: ','Voice: ')+oz);
    var o=dil(h.ornek);if(o)k.ornekler.push(o);k.yasak=(dil(h.yasak)||[]).slice();return k}
  if(e.tur==='hesap'){var v=hesap.voice;if(!hesapDolu(v))return null;
    k.ad=T('Hesabımdaki marka sesi','My account’s brand voice');
    k.sector=v.sector?(SEKTOR_ESLE[v.sector]||'Genel'):'';k.tone=v.tones.length?(TON_ESLE[v.tones[0]]||''):'';
    if(v.tones.length)k.satirlar.push(T('Ses: ','Voice: ')+v.tones.map(function(t){var a=TON_AD[t];return a?a[EN?1:0]:t}).join(', '));
    k.ornekler=v.samples.slice();k.yasak=v.banned.slice();return k}
  if(e.tur==='yerel'){var p=oku();if(!p)return null;
    k.ad=p.name||T('Bu tarayıcıdaki profil','This browser’s profile');k.sector=p.sector||'';k.tone=p.adjectives.length?(SIFAT_TON[p.adjectives[0]]||''):'';
    if(p.audience)k.satirlar.push(T('Hedef kitle: ','Audience: ')+p.audience.replace(/\s*\n\s*/g,' '));
    if(p.adjectives.length)k.satirlar.push(T('Ses: ','Voice: ')+p.adjectives.map(function(a){var x=SIFAT_AD[a];return x?x[EN?1:0]:a}).join(', '));
    if(p.address)k.satirlar.push(T('Hitap: ','Address the reader as: ')+(p.address==='sen'?T('sen','informal you'):T('siz','formal you')));
    if(p.emoji)k.satirlar.push(T('Emoji: ','Emoji: ')+(p.emoji==='none'?T('kullanma','none'):T('az','a few')));
    if(p.sample)k.ornekler.push(p.sample);k.yasak=p.banned.slice();return k}
  return null;
}
/* kelime sınırında kes; üç nokta sınıra dahil */
function kes(s,n){if(s.length<=n)return s;if(n<2)return '';var k=s.slice(0,n-1),b=k.search(/\s\S*$/);if(b>n*0.6)k=k.slice(0,b);return k.replace(/\s+$/,'')+'…'}
/* style metni: başlık satırları + "Kaçınılacak kelimeler" önce (kısalınca korunur), örnekler sonra; toplam ≤ max */
function stilMetni(k,max){
  var bas=k.satirlar.slice();if(k.yasak.length)bas.push(T('Kaçınılacak kelimeler: ','Words to avoid: ')+k.yasak.join(', '));
  var b=kes(bas.join('\n'),max),kalan=max-b.length,parca=[];
  k.ornekler.forEach(function(o){
    var ayr=(b||parca.length)?2:0;if(kalan-ayr<40)return;
    var x=kes(o,kalan-ayr);if(x){parca.push(x);kalan-=x.length+ayr}
  });
  return [b].concat(parca).filter(Boolean).join('\n\n');
}
/* {sector?, tone?, style} ya da null (Yok). max: kullanıcının #stil metninden kalan yer */
function stilAl(max){
  max=typeof max==="number"?Math.max(0,Math.min(max,STIL_MAX)):STIL_MAX;
  var k;try{k=kaynak(etkin())}catch(e){k=null}if(!k)return null;
  var o={style:stilMetni(k,max)};if(k.sector)o.sector=k.sector;if(k.tone)o.tone=k.tone;return o;
}
function apiTaban(){var m=d.querySelector('meta[name="api-base"]');return ((m&&m.getAttribute('content'))||'').trim().replace(/\/+$/,'')}
/* studyo-kabuk.js oturumJeton ile aynı okuma (kabuk dışa açmıyor; bu betik kabuktan önce yüklenir) */
function jeton(){var ds=[];try{ds.push(window.sessionStorage)}catch(e){}try{ds.push(window.localStorage)}catch(e){}
  for(var i=0;i<ds.length;i++){var v=null;try{v=ds[i]&&ds[i].getItem('smc-oturum')}catch(e){v=null}if(!v)continue;var t=v;
    if(v.charAt(0)==='{'){try{t=JSON.parse(v).token}catch(e){t=null}}if(typeof t==='string'&&/^[A-Za-z0-9_-]{43}$/.test(t))return t}
  return null}
function sesIstek(yontem,govde){
  var api=apiTaban(),tk=jeton();if(!api||!tk||typeof fetch!=='function')return Promise.resolve({s:0,j:null});
  var o={method:yontem,headers:{'Accept':'application/json',authorization:'Bearer '+tk},credentials:'omit',cache:'no-store',mode:'cors'},z=null;
  if(govde){o.headers['Content-Type']='application/json';o.body=JSON.stringify(govde)}
  if(typeof AbortController==='function'){var ac=new AbortController();o.signal=ac.signal;z=setTimeout(function(){ac.abort()},10000)}
  return fetch(api+'/app/voice',o).then(function(r){return r.text().then(function(x){var j=null;try{j=x?JSON.parse(x):null}catch(e){j=null}return {s:r.status,j:j}})})
    .catch(function(){return {s:0,j:null}}).then(function(r){if(z)clearTimeout(z);return r});
}
function hesapYukle(){
  return sesIstek('GET').then(function(r){
    if(r.s===200&&r.j&&typeof r.j==='object'){hesap.durum='acik';hesap.voice=sesTemiz('voice' in r.j?r.j.voice:r.j)}
    else{hesap.durum='kapali';hesap.voice=null}
    return hesap.voice;
  });
}
/* dialog kaydı → hesap sesi: yalnız GET 200 verdiyse (girişli + uç canlı). Boş yerel alan sunucudakini korur; hata sessiz. */
function hesabaYaz(p){
  if(hesap.durum!=='acik'||!p)return Promise.resolve(false);
  var v=hesap.voice||{sector:'',tones:[],samples:[],banned:[]},g={};
  var sv=SEKTOR_TERS[p.sector];
  g.sector=sv?(SEKTOR_ESLE[v.sector]===p.sector?v.sector:sv):(p.sector==='Genel'?(v.sector&&SEKTOR_ESLE[v.sector]?'other':v.sector):v.sector);
  var tn=[];p.adjectives.forEach(function(a){var t=SIFAT_SUNUCU[a];if(t&&tn.indexOf(t)<0)tn.push(t)});g.tones=(tn.length?tn:v.tones).slice(0,VMAX.tones);
  var or=[];if(p.sample)or.push(p.sample.slice(0,VMAX.sample));v.samples.forEach(function(x){if(or.indexOf(x)<0)or.push(x)});g.samples=or.slice(0,VMAX.samples);
  var ys=[];p.banned.concat(v.banned).forEach(function(x){x=String(x).replace(/[|\n\r\u0085\u2028\u2029]/g,' ').trim().toLocaleLowerCase('tr');if(x&&x.length<=VMAX.word&&ys.indexOf(x)<0)ys.push(x)});g.banned=ys.slice(0,VMAX.banned);
  return sesIstek('PUT',g).then(function(r){
    if(r.s!==200)return false;
    hesap.voice=sesTemiz(r.j&&typeof r.j==='object'&&r.j.voice?r.j.voice:g);return true;
  });
}
API.stilAl=stilAl;API.etkin=etkin;API.kaynak=function(){return kaynak(etkin())};API.hazirlar=hazirlar;
API.secim=secimOku;API.hesapDurum=function(){return hesap.durum};

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
  satirYaz();
  /* stüdyo sayfaları (#ses-sec var): çipler seçimden gelir; IG/Reels: eski davranış, profil sektörü */
  if(!secimKur())sektorUygula(oku());
}
/* ---- PLAN madde 1 · ses seçici (#ses-sec): Hesabımdaki marka sesi | Bu tarayıcıdaki profil | hazır sesler | Yok ---- */
var secEl=null,secOzet=null,secSon='';
function secAnahtar(e){return e.tur+':'+(e.id||'')}
function secenek(deger,metin,sabit){var o=d.createElement('option');o.value=deger;o.textContent=metin;if(sabit)o.setAttribute('data-sabit','');return o}
/* seçenekleri o anki duruma göre kurar: hesap yalnız GET 200 + dolu ses; yerel yalnız profil varsa */
function secDoldur(){
  if(!secEl)return;var e=etkin();while(secEl.firstChild)secEl.removeChild(secEl.firstChild);
  if(hesapDolu(hesap.voice))secEl.appendChild(secenek('hesap:',T('Hesabımdaki marka sesi','My account’s brand voice')));
  if(yerelVar()){var p=oku();secEl.appendChild(secenek('yerel:',T('Bu tarayıcıdaki profil','This browser’s profile')+(p&&p.name?' · '+p.name:''),true))}
  var hz=hazirlar();if(hz.length){var g=d.createElement('optgroup');g.label=T('Hazır sesler','Preset voices');
    hz.forEach(function(h){if(h&&h.id)g.appendChild(secenek('hazir:'+h.id,dil(h.ad)||h.id))});secEl.appendChild(g)}
  secEl.appendChild(secenek('yok:',T('Yok','None')));
  secEl.value=secAnahtar(e);if(secEl.value!==secAnahtar(e))secEl.value='yok:';
}
function cipEtiket(form,ad,deger){
  var i=$$('input[name="'+ad+'"]',form).filter(function(x){return x.value===deger})[0];if(!i)return '';
  var l=i.id?d.querySelector('label[for="'+i.id+'"]'):i.closest('label');return l?l.textContent.replace(/\s+/g,' ').trim():deger;
}
/* seçilen sesi sektör + ton çiplerine uygular (#stil'e dokunmaz); özet satırını yazar */
function secUygula(){
  var k=null;try{k=kaynak(etkin())}catch(e){k=null}var form=$('#form'),parca=[];
  if(k&&form){
    [['sector',k.sector],['tone',k.tone]].forEach(function(x){
      if(!x[1])return;var hit=$$('input[name="'+x[0]+'"]',form).filter(function(i){return i.value===x[1]})[0];
      if(hit&&!hit.checked){hit.checked=true;hit.dispatchEvent(new Event('change',{bubbles:true}))}
    });
    if(k.sector)parca.push(T('Sektör: ','Industry: ')+cipEtiket(form,'sector',k.sector));
    if(k.tone)parca.push(T('Ton: ','Tone: ')+cipEtiket(form,'tone',k.tone));
    if(k.ornekler.length||k.yasak.length||k.satirlar.length)parca.push(T('üslup isteğe eklenir','style is added to the request'));
  }
  if(secOzet){secOzet.setAttribute('data-sabit','');secOzet.textContent=parca.join(' · ')}
  secSon=secAnahtar(etkin());
}
function secimKur(){
  secEl=$('#ses-sec');if(!secEl)return false;secOzet=$('#ses-sec-ozet');
  secEl.setAttribute('data-sabit','');/* smc-en.js sözlüğü seçenekleri çevirmesin; metin zaten sayfa dilinde */
  secDoldur();secUygula();
  secEl.addEventListener('change',function(){
    var v=String(secEl.value||'yok:'),i=v.indexOf(':'),tur=v.slice(0,i),id=v.slice(i+1)||null;
    if(TURLER.indexOf(tur)<0)return;secimYaz({tur:tur,id:tur==='hazir'?id:null});secUygula();
  });
  /* dialog kaydı → bu tarayıcıdaki profil seçilir; hesap sesi açıksa sunucuya da yazılır (sessiz) */
  var f=$('#ses-form');
  if(f)f.addEventListener('submit',function(){
    setTimeout(function(){
      var dl=$('#ses');if(dl&&(dl.open||dl.hasAttribute('open')))return;/* doğrulama hatası: dialog açık kalır, kayıt yok */
      var p=oku();if(!p||!(dolu(p)||p.sector))return;
      secimYaz({tur:'yerel',id:null});secDoldur();secUygula();
      hesabaYaz(p).then(function(ok){if(ok)secDoldur()}).catch(function(){});
    },0);
  });
  var evet=$('#ses-sil-evet');if(evet)evet.addEventListener('click',function(){setTimeout(function(){secDoldur();secUygula()},0)});
  if(jeton())hesapYukle().then(function(){var once=secSon;secDoldur();if(secAnahtar(etkin())!==once)secUygula()}).catch(function(){});
  /* geri/ileri (bfcache) dönüşünde seçim başka sekmede değişmiş olabilir: ekranı istekle aynı tut */
  window.addEventListener('pageshow',function(e){if(e&&e.persisted){if(API.satirYaz)API.satirYaz();var once=secSon;secDoldur();if(secAnahtar(etkin())!==once)secUygula()}});
  return true;
}
/* defer betikleri DOMContentLoaded'dan önce çalışır: smc-app.js'in change dinleyicisi kurulduktan sonra sektör uygulanır */
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',kur);else kur();
})();
