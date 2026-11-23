/* Stüdyo kabuğu (A8-S2): üst çubuk (hak, tema, hesap), üretim akışı (Turnstile, hak, hata, duvar), teklif ve bekleme listesi.
   Sayfa modülleri (studyo-linkedin.js, studyo-blog.js, studyo-medya.js) Studyo.kaydet(cfg) ile bağlanır.
   Sözleşme: form-worker/src/generate.js (/gen/linkedin|blog|video|refine|quota|event) + /submit. Satır içi stil/betik yok (CSP).
   Metinler T(tr,en) ile iki dilli yazılır; smc-en.js yalnız smc-ses.js metinleri için yüklü kalır. */
(function(){'use strict';
var d=document,root=d.documentElement,EN=root.lang==='en';
function T(tr,en){return EN?en:tr}
function $(s,k){return (k||d).querySelector(s)}
function $$(s,k){return Array.prototype.slice.call((k||d).querySelectorAll(s))}
function el(t,c,x){var e=d.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function metaAl(n){var m=$('meta[name="'+n+'"]');return m?(m.getAttribute('content')||'').trim():''}
var API=metaAl('api-base').replace(/\/+$/,''),TS=metaAl('turnstile-sitekey'),T0=Date.now();
var JETON_YOL=/^\/gen\/(linkedin|instagram|refine|blog|video)$/,GOVDE_MAX=12288,STIL_MAX=3000,KONU_MAX=300;
var D={anon:null,left:null,cap:3,reset:'',hakScope:'anon',hakBilinmez:true,acik:false,rid:null,deneme:0,kartVar:false,
  view:'',hata:'',scope:'',mesgul:false,istek:0,yakinda:false,ac:null,vazgec:false,son:null,sonGovde:null};
var cfg=null;

/* ---- metinler (smc-app.js ile aynı; EN karşılıkları smc-en.js sözlüğünden) ---- */
var HATA={
  bad_input:{b:T('Gönderdiğin bilgi kabul edilmedi.','What you sent wasn’t accepted.'),m:T('Konuyu kontrol edip tekrar dene.','Check the topic and try again.'),e:'duzenle'},
  origin:{b:T('Bir sorun oldu.','Something went wrong.'),m:T('Sayfayı yenileyip tekrar dene.','Refresh the page and try again.'),e:'yenile'},
  bot:{b:T('Doğrulama tamamlanamadı.','The check couldn’t be completed.'),m:T('Doğrulamayı yeniledik; tekrar dene. Bir uygulamanın içindeki tarayıcıdaysan sayfayı Safari ya da Chrome’da aç.','We’ve reset it; try again. If you’re in a browser inside another app, open the page in Safari or Chrome.'),e:'sunucu'},
  refused:{b:T('Bu konuyla taslak üretilemedi, konuyu değiştir.','No drafts could be written for this topic; change the topic.'),m:T('Konuyu başka sözcüklerle ya da başka bir açıdan yaz.','Put it in other words or take another angle.'),e:'duzenle'},
  llm_fail:{b:T('Bu sefer olmadı, tekrar dene.','It didn’t work this time; try again.'),m:'',e:'sunucu'},
  llm_busy:{b:T('Yoğunluk var, 1 dakika sonra dene.','It’s busy right now; try again in a minute.'),m:'',e:'sunucu'},
  ag:{b:T('Bağlantı yok.','No connection.'),m:T('İnternete bağlanınca tekrar dene.','Try again once you’re online.'),e:'istemci'},
  zaman:{b:T('Yanıt gelmedi.','No response came back.'),m:'',e:'istemci'},
  genel:{b:T('Bir sorun oldu.','Something went wrong.'),m:T('Biraz sonra tekrar dene.','Try again a bit later.'),e:'sunucu'}
};
var YEN='{YEN}';
var DUVAR={
  anon:{h:T('Bugünlük bu kadar','That’s it for today'),b:T('Bugünkü 3 hakkını kullandın, gece yarısı yenilenir.','You’ve used today’s 3 credits; they renew at midnight.'),
    m:T('Bir şey yapman gerekmez; yarın 3 hak yeniden açılır. Beklemek istemezsen iki seçenek daha var, ikisi de isteğe bağlı.','You don’t need to do anything; 3 credits open again tomorrow. If you’d rather not wait, there are two more options, both optional.'),
    d:[[T('Kullandığın','Used'),'3 / 3'],[T('Yenilenme','Renews'),YEN],[T('Senden istenen','Asked of you'),T('hiçbir şey','nothing')]]},
  ip:{h:T('Bu bağlantı bugün doldu','This connection is full for today'),b:T('Bu bağlantıdan bugün çok üretim yapıldı (ortak ağlarda olur).','A lot of drafts were made from this connection today (it happens on shared networks).'),
    m:T('Ofis, okul ya da kafe ağında aynı bağlantıyı çok kişi kullanır; sınır kişiye değil bağlantıya aittir. Başka bir ağdan deneyebilir ya da gece yarısını bekleyebilirsin.','In an office, school or café many people share one connection; the limit belongs to the connection, not the person. You can try from another network or wait until midnight.'),
    d:[[T('Sınır','Limit'),T('bağlantıya ait','per connection')],[T('Yenilenme','Renews'),YEN],[T('Senden istenen','Asked of you'),T('hiçbir şey','nothing')]]},
  global:{h:T('Bugünkü kapasite doldu','Today’s capacity is full'),b:T('Bugünkü kapasite doldu.','Today’s capacity is full.'),
    m:T('Bu senin kullanımınla ilgili değil: aracın bugünkü toplam üretim payı bitti. Gece yarısı yenilenir.','This isn’t about your usage: the tool’s total share for today has run out. It renews at midnight.'),
    d:[[T('Sınır','Limit'),T('aracın günlük toplamı','the tool’s daily total')],[T('Yenilenme','Renews'),YEN],[T('Senden istenen','Asked of you'),T('hiçbir şey','nothing')]]},
  kapasite:{h:T('Kapasite doldu','Capacity is full'),b:T('Kapasite doldu.','Capacity is full.'),
    m:T('Araç şu an yeni taslak üretemiyor. Ne zaman açılacağı henüz belli değil; daha sonra yeniden deneyebilirsin.','The tool can’t write new drafts right now. We don’t know yet when it will reopen; you can try again later.'),
    d:[[T('Yenilenme','Renews'),T('belli değil','not known yet')],[T('Senden istenen','Asked of you'),T('hiçbir şey','nothing')]]},
  yakinda:{h:T('Çok yakında','Coming soon'),b:T('Çok yakında.','Coming soon.'),m:T('Araç henüz açılmadı. Açılınca haber verelim mi?','The tool isn’t open yet. Shall we let you know when it opens?'),d:[]}
};
var KAYNAK={top:'top',error:'error',limit:'limit',footer:'footer',result:'result',cap:'cap',calendly:'calendly'};

/* ---- yerel depo, kimlik, gün ---- */
function depo(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
function oturumDepo(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){}return null}
function uuid(){try{if(crypto.randomUUID)return crypto.randomUUID()}catch(e){}var a=new Uint8Array(16);crypto.getRandomValues(a);a[6]=a[6]&15|64;a[8]=a[8]&63|128;var h=Array.prototype.map.call(a,function(x){return(256+x).toString(16).slice(1)}).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)}
function anonAl(){if(D.anon)return D.anon;var a=depo('smc-anon');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a||'')){a=uuid();depo('smc-anon',a)}return(D.anon=a)}
function gunAl(){try{var p={};new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});return p.year+'-'+p.month+'-'+p.day}catch(e){return ''}}
function retAl(){var s=depo('smc-son'),b=gunAl();if(!b)return null;if(!/^\d{4}-\d\d-\d\d$/.test(s||''))return 'ret0';var f=Math.round((Date.parse(b)-Date.parse(s))/864e5);return !(f>0)?null:f===1?'ret1':f<=7?'ret2_7':'ret8'}
function dilAl(){return EN?'en':'tr'}
function oturumJeton(){var ds=[];try{ds.push(window.sessionStorage)}catch(e){}try{ds.push(window.localStorage)}catch(e){}
  for(var i=0;i<ds.length;i++){var v=null;try{v=ds[i]&&ds[i].getItem('smc-oturum')}catch(e){v=null}if(!v)continue;var t=v;
    if(v.charAt(0)==='{'){try{t=JSON.parse(v).token}catch(e){t=null}}if(typeof t==='string'&&/^[A-Za-z0-9_-]{43}$/.test(t))return t}
  return null}
function hakAl(r){if(!r)return;if(typeof r.left==='number'){D.left=Math.max(0,r.left);D.hakBilinmez=false}if(typeof r.cap==='number'&&r.cap>0)D.cap=r.cap;if(typeof r.reset_at==='string')D.reset=r.reset_at;if(r.scope==='anon'||r.scope==='ip'||r.scope==='global')D.hakScope=r.scope;if(typeof r.stock==='boolean')D.stock=r.stock}

/* ---- istek: jeton yalnız üretim uçlarına; dış AbortController (Vazgeç) verilebilir ---- */
function post(yol,govde,ms,kalici,dis){
  if(!window.fetch||!API)return Promise.reject({kod:'ag'});
  var ac=dis||(window.AbortController?new AbortController():null),tm=ac&&ms?setTimeout(function(){ac.abort()},ms):null,
      o={method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(govde),credentials:'omit',cache:'no-store'};
  if(ac)o.signal=ac.signal;if(kalici)o.keepalive=true;
  if(JETON_YOL.test(yol)){var tk=oturumJeton();if(tk)o.headers.authorization='Bearer '+tk}
  return fetch(API+yol,o).then(function(r){clearTimeout(tm);if(r.status===204)return {};return r.json().then(function(j){if(r.ok&&j&&j.ok!==false)return j;j=j||{};throw {kod:j.error||'genel',scope:j.scope,charged:!!j.charged,left:j.left,cap:j.cap,reset_at:j.reset_at,field:j.field}},function(){throw {kod:'genel'}})},
    function(e){clearTimeout(tm);throw {kod:D.vazgec?'vazgec':e&&e.name==='AbortError'?'zaman':'ag'}});
}
/* GET: yalnız /gen/stock (Pexels araması; hak düşmez, jeton gönderilmez) */
function al(yol,ms,dis){
  if(!window.fetch||!API)return Promise.reject({kod:'ag'});
  var ac=dis||(window.AbortController?new AbortController():null),tm=ac&&ms?setTimeout(function(){ac.abort()},ms):null,o={method:'GET',credentials:'omit',cache:'no-store'};
  if(ac)o.signal=ac.signal;
  return fetch(API+yol,o).then(function(r){clearTimeout(tm);return r.json().then(function(j){if(r.ok&&j&&j.ok!==false)return j;j=j||{};throw {kod:j.error||'genel',scope:j.scope}},function(){throw {kod:'genel'}})},
    function(e){clearTimeout(tm);throw {kod:e&&e.name==='AbortError'?'zaman':'ag'}});
}
function olay(kind,src){if(!D.acik||!API)return;var b={anon:anonAl(),kind:kind};if(src)b.src=src;try{post('/gen/event',b,8000,true).then(null,function(){})}catch(e){}}

/* ---- Turnstile: düğmenin yanında, ilk ihtiyaçta yüklenir; boş sitekey'de ts:'' ---- */
var tsYuklendi=false,tsId=null,tsTok='',tsBek=[];
function tsYukle(){if(!TS||tsYuklendi||!$('#turnstile'))return;tsYuklendi=true;
  window.smcTurnstile=function(){try{tsId=turnstile.render('#turnstile',{sitekey:TS,appearance:'interaction-only',size:'flexible',language:dilAl(),callback:function(t){tsTok=t;tsBek.splice(0).forEach(function(f){f(t)})},'expired-callback':function(){tsTok=''},'error-callback':function(){tsTok='';tsBek.splice(0).forEach(function(f){f('')})}})}catch(e){}};
  var s=d.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=smcTurnstile';s.async=true;s.defer=true;d.head.appendChild(s)}
function tsAl(){if(!TS)return Promise.resolve('');tsYukle();if(tsTok){var t=tsTok;tsTok='';return Promise.resolve(t)}return new Promise(function(ok){var bitti=false;function f(t){if(bitti)return;bitti=true;tsTok='';ok(t||'')}tsBek.push(f);setTimeout(function(){f('')},10000)})}
function tsSifirla(){tsTok='';if(tsId!=null&&window.turnstile)try{turnstile.reset(tsId)}catch(e){}}

/* ---- canlı bölgeler ---- */
function durum(m){var e=$('#durum');if(e){e.textContent='';if(m)setTimeout(function(){e.textContent=m},30)}}
var toastT=null;
function toast(m){var e=$('#toast');if(!e)return;clearTimeout(toastT);e.textContent=m||'';e.classList.toggle('acik',!!m);if(m)toastT=setTimeout(function(){e.classList.remove('acik');e.textContent=''},3600)}
function kopyala(t,ok,fail){
  function yedek(){
    try{var ta=el('textarea','sr');ta.value=t;ta.setAttribute('readonly','');ta.setAttribute('aria-hidden','true');d.body.appendChild(ta);ta.select();var r=d.execCommand('copy');d.body.removeChild(ta);if(r)ok();else fail()}catch(e){fail()}
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,yedek)}else yedek();
}

/* ---- tema: ikon düğmesi; aria-label/title hedef eylemi söyler (aria-pressed yok), ikon data-tema-etkin'den ---- */
var mq=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
function etkinTema(){var a=root.getAttribute('data-theme');if(a==='dark'||a==='light')return a;return mq&&mq.matches?'dark':'light'}
function temaYaz(){var b=$('#tema');if(!b)return;var k=etkinTema()==='dark',m=k?T('Açık temaya geç','Switch to light theme'):T('Koyu temaya geç','Switch to dark theme');
  b.removeAttribute('aria-pressed');b.setAttribute('data-tema-etkin',k?'dark':'light');b.setAttribute('aria-label',m);b.setAttribute('title',m)}
function temaKur(){var b=$('#tema');if(!b)return;temaYaz();
  b.addEventListener('click',function(){var t=etkinTema()==='dark'?'light':'dark';root.setAttribute('data-theme',t);depo('smc-tema',t);temaYaz()});
  if(mq){var f=function(){temaYaz()};if(mq.addEventListener)mq.addEventListener('change',f);else if(mq.addListener)mq.addListener(f)}}

/* ---- hesap menüsü: düğme + açılır liste; Esc ve dış tıklama kapatır ---- */
function menuKur(){var b=$('#hesap-dugme'),m=$('#hesap-menu');if(!b||!m)return;
  function ac(ac_){m.hidden=!ac_;b.setAttribute('aria-expanded',ac_?'true':'false');if(ac_){var i=$('a,button',m);if(i)i.focus()}}
  b.addEventListener('click',function(){ac(m.hidden)});
  d.addEventListener('click',function(e){if(!m.hidden&&!m.contains(e.target)&&!b.contains(e.target))ac(false)});
  m.addEventListener('keydown',function(e){
    var o=$$('a,button',m),i=o.indexOf(d.activeElement);
    if(e.key==='Escape'){e.preventDefault();ac(false);b.focus()}
    else if(e.key==='ArrowDown'){e.preventDefault();o[(i+1)%o.length].focus()}
    else if(e.key==='ArrowUp'){e.preventDefault();o[(i-1+o.length)%o.length].focus()}
    else if(e.key==='Tab'&&((!e.shiftKey&&i===o.length-1)||(e.shiftKey&&i===0)))ac(false);
  });
  m.addEventListener('click',function(e){if(e.target.closest('a,button'))setTimeout(function(){ac(false)},0)});
  /* menüdeki "Marka sesi": smc-ses yalnız #ses-ac/#ses-nav bağlar; burada #ses-ac'e yönlendirilir */
  $$('[data-ses]').forEach(function(x){x.addEventListener('click',function(){var a=$('#ses-ac');if(a)setTimeout(function(){a.click()},0)})});
}

/* ---- hak göstergesi (üst çubuktaki hap + balon) ---- */
function yenMetin(){var g=T('gece yarısı (İstanbul saati)','midnight (Istanbul time)');if(!D.reset)return g;var dk=Math.max(1,Math.round((Date.parse(D.reset)-Date.now())/6e4));if(!isFinite(dk))return g;
  return g+T(', yaklaşık '+Math.floor(dk/60)+' sa '+(dk%60)+' dk sonra',', in about '+Math.floor(dk/60)+' h '+(dk%60)+' min')}
function hakYaz(){
  var p=$('#hak'),y=$('#hak-yazi'),bl=$('#hak-balon');if(!p||!y)return;
  var bel=!!D.hakBilinmez||D.view==='hata'&&(HATA[D.hata]||HATA.genel).e==='istemci',sc=D.view==='duvar'?D.scope:'',ust,alt,veri;
  if(sc==='yakinda'){ust=T('Çok yakında','Coming soon');alt=T('Araç henüz açılmadı.','The tool isn’t open yet.');veri='?'}
  else if(sc==='kapasite'){ust=T('Kapasite doldu','Capacity is full');alt=DUVAR.kapasite.m;veri='0'}
  else if(sc==='ip'||sc==='global'){ust=T('Bugünlük kapalı','Closed for today');alt=DUVAR[sc].b+' '+T('Yenilenme: ','Renews: ')+yenMetin()+'.';veri='0'}
  else if(bel||D.left==null){ust=T('Hak: belli değil','Credits: unknown');alt=T('Her üretim 1 hak kullanır. Günde '+D.cap+' hak; yenilenme: ','Each generation uses 1 credit. '+D.cap+' credits a day; renews: ')+yenMetin()+'.';veri='?'}
  else{
    ust=D.left===1?T('1 hak kaldı','1 credit left'):T(D.left+' hak kaldı',D.left+' credits left');
    alt=(D.left<=0?T('Bugünkü '+D.cap+' hakkını kullandın.','You’ve used today’s '+D.cap+' credits.'):T('Her üretim 1 hak kullanır; bugün '+D.cap+' hakkından '+D.left+' kaldı.','Each generation uses 1 credit; '+D.left+' of today’s '+D.cap+' left.'))+' '+T('Yenilenme: ','Renews: ')+yenMetin()+'.';
    veri=D.left<=0?'0':D.left===1?'1':'2';
  }
  y.textContent=ust;p.setAttribute('data-hak',veri);if(bl)bl.textContent=alt;
  var bd=$('.st-bedel');if(bd)bd.textContent=T('1 hak','1 credit');
}
function hakKur(){var k=$('#hak-k'),p=$('#hak');if(!k||!p)return;
  p.addEventListener('click',function(){var a=!k.classList.contains('acik');k.classList.toggle('acik',a);p.setAttribute('aria-expanded',a?'true':'false');if(a)hakYaz()});
  d.addEventListener('click',function(e){if(!k.contains(e.target)){k.classList.remove('acik');p.setAttribute('aria-expanded','false')}});
  p.addEventListener('keydown',function(e){if(e.key==='Escape'){k.classList.remove('acik');p.setAttribute('aria-expanded','false')}});
}

/* ---- görünümler: bos | yuk | sonuc | hata | duvar ---- */
var GOR=['bos','yuk','sonuc','hata','duvar'];
function goster(v,odak){
  D.view=v;GOR.forEach(function(g){var e=$('#d-'+g);if(e)e.hidden=g!==v});
  var p=$('.st-onizle');if(p)p.setAttribute('data-gorunum',v);
  hakYaz();
  if(odak){var h={sonuc:'#sonuc-baslik',hata:'#hata-baslik',duvar:'#duvar-baslik'}[v];var he=h&&$(h);if(he){he.focus({preventScroll:true});if(window.innerWidth<=1023&&he.scrollIntoView)he.scrollIntoView({block:'start',behavior:azHareket()?'auto':'smooth'})}}
}
function azHareket(){return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)}

/* ---- form ---- */
var form,konu,konuSay,konuHataEl,stil,stilSay,stilHataEl,hedef,hedefHataEl,uretB,formNotEl;
function alanHata(inp,hEl,m){if(!hEl)return;hEl.textContent=m||'';hEl.hidden=!m;if(!inp)return;if(m)inp.setAttribute('aria-invalid','true');else inp.removeAttribute('aria-invalid')}
function formNot(m,tur){if(!formNotEl)return;formNotEl.textContent=m||'';formNotEl.className='not'+(m&&tur?' not-'+tur:'')}
function cp(s){return Array.from(s).length}
function sayacYaz(inp,say,max){if(!inp||!say)return;var n=inp.value.length;say.textContent=n+' / '+max;say.classList.toggle('sayac-uyari',n>max)}
function konuDeger(){return konu.value.replace(/\s+/g,' ').trim()}
function secili(ad){var i=form&&$('input[name="'+ad+'"]:checked',form);return i?i.value:''}
function ozetYaz(){
  $$('[data-ozet]',form).forEach(function(o){
    var parca=o.getAttribute('data-ozet').split(',').map(function(ad){var i=$('input[name="'+ad.trim()+'"]:checked',form);if(!i)return '';var l=$('label[for="'+i.id+'"]',form);return l?(l.getAttribute('data-kisa')||l.firstChild&&l.firstChild.textContent||l.textContent).trim():i.value}).filter(Boolean);
    o.textContent=parca.join(' · ');
  });
  var st=$('#stil-ozet');if(st&&stil)st.textContent=stil.value.trim()?T('açık · ','on · ')+stil.value.trim().length+T(' karakter',' chars'):'';
}
function uretMesgul(m){D.mesgul=m;if(!uretB)return;if(m){uretB.setAttribute('aria-busy','true');uretB.setAttribute('aria-disabled','true')}else{uretB.removeAttribute('aria-busy');uretB.removeAttribute('aria-disabled')}}

/* gövde: ortak alanlar + sayfa modülünün eklediği (kind, length); voice gönderilmez (worker bu uçlarda yok sayar) */
function istekKur(){
  var hp=form?$('input[name="website"]',form):null;
  var q={anon:anonAl(),rid:D.rid||(D.rid=uuid()),t:Date.now()-T0,ts:'',hp:hp?hp.value:'',lang:dilAl(),topic:konuDeger(),sector:secili('sector')||'Genel',tone:secili('tone')||'samimi',ret:retAl()};
  if(hedef&&cfg.hedefMax){var g=hedef.value.replace(/\s+/g,' ').trim();if(g)q.goal=g}
  var ln=secili('length');if(ln)q.length=ln;
  if(stil&&stil.value.trim())q.style=stil.value.trim();
  if(cfg.govde)cfg.govde(q);
  return q;
}
function dogrula(){
  var ilk=null,k=konuDeger();
  alanHata(konu,konuHataEl,'');if(hedef)alanHata(hedef,hedefHataEl,'');if(stil)alanHata(stil,stilHataEl,'');formNot('');
  if(!k){alanHata(konu,konuHataEl,T('Konu boş. Ne hakkında yazacağını bir cümleyle anlat.','The topic is empty. Describe what to write about in one sentence.'));ilk=konu}
  else if(k.length>KONU_MAX){alanHata(konu,konuHataEl,T('Konu en çok '+KONU_MAX+' karakter olabilir.','The topic can be at most '+KONU_MAX+' characters.'));ilk=konu}
  if(hedef&&cfg.hedefMax&&hedef.value.replace(/\s+/g,' ').trim().length>cfg.hedefMax){alanHata(hedef,hedefHataEl,T('Hedef en çok '+cfg.hedefMax+' karakter olabilir.','The goal can be at most '+cfg.hedefMax+' characters.'));ilk=ilk||hedef}
  if(stil&&stil.value.trim().length>STIL_MAX){var dt=$('#stil-acilir');if(dt)dt.open=true;alanHata(stil,stilHataEl,T('Örnek metin en çok '+STIL_MAX+' karakter olabilir; kısalt.','The example can be at most '+STIL_MAX+' characters; shorten it.'));ilk=ilk||stil}
  if(ilk){var a=ilk.closest('details');if(a)a.open=true;ilk.focus();return false}
  return true;
}

/* ---- yükleniyor: döner metin, geçen süre, ilerleme çubuğu (tahmini; gerçek ilerleme değildir) ---- */
var yukT=null,yukBas=0;
function sureYaz(s){var m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x}
function yukBasla(){
  yukBas=Date.now();var me=$('#yuk-metin'),se=$('#yuk-sure'),bar=$('#d-yuk .st-ilerleme span'),liste=cfg.yuk||[],son=-1,beklenen=cfg.sure||20;
  if(bar)bar.style.width='2%';
  function adim(){
    var s=Math.floor((Date.now()-yukBas)/1000),i=-1;
    liste.forEach(function(x,n){if(s>=x[0])i=n});
    if(i!==son&&i>=0&&me){son=i;me.textContent=T(liste[i][1],liste[i][2])}
    if(se)se.textContent=T('Geçen süre ','Elapsed ')+sureYaz(s)+(cfg.sureMetin?' · '+T(cfg.sureMetin[0],cfg.sureMetin[1]):'');
    if(bar)bar.style.width=Math.min(94,Math.round(100*(1-Math.exp(-s/(beklenen*0.75)))))+'%';
  }
  adim();clearInterval(yukT);yukT=setInterval(adim,1000);
}
function durdur(){clearInterval(yukT);yukT=null}

/* ---- üretim ---- */
function hakYok(){duvarGoster(D.hakScope==='ip'||D.hakScope==='global'?D.hakScope:'anon',true)}
function uret(){
  if(!cfg||D.mesgul)return;
  if(!dogrula())return;
  if(D.left===0&&!D.hakBilinmez){hakYok();return}
  var q=istekKur();
  if(cfg.dogrula){var m=cfg.dogrula(q);if(m){formNot(m,'hata');return}}
  var boy=0;try{boy=new Blob([JSON.stringify(q)]).size}catch(e){boy=JSON.stringify(q).length*3}
  if(boy>GOVDE_MAX){var dt=$('#stil-acilir');if(stil&&stil.value.trim()){if(dt)dt.open=true;alanHata(stil,stilHataEl,T('Örnek metni ya da konuyu kısalt.','Shorten the example text or the topic.'));stil.focus()}else{alanHata(konu,konuHataEl,T('Örnek metni ya da konuyu kısalt.','Shorten the example text or the topic.'));konu.focus()}return}
  yukle(q);
}
function yukle(q){
  q=q||D.sonGovde;if(!q)return;D.sonGovde=q;
  var no=++D.istek;D.vazgec=false;D.ac=window.AbortController?new AbortController():null;
  uretMesgul(true);goster('yuk',false);yukBasla();durum(T(cfg.yuk&&cfg.yuk[0]?cfg.yuk[0][1]:'Yazılıyor…',cfg.yuk&&cfg.yuk[0]?cfg.yuk[0][2]:'Writing…'));
  tsAl().then(function(tok){if(no!==D.istek)throw {kod:'vazgec'};q.ts=tok;q.t=Date.now()-T0;return post(cfg.yol,q,cfg.ms,false,D.ac)}).then(function(r){
    if(no!==D.istek)return;
    durdur();tsSifirla();hakAl(r);D.acik=true;depo('smc-acik','1');var g=gunAl();if(g)depo('smc-son',g);
    D.deneme=0;D.rid=null;uretMesgul(false);
    var ds=r&&Array.isArray(r.drafts)?r.drafts:[];
    if(!ds.length){hataGoster('llm_fail',true,false);return}
    D.kartVar=true;D.son={r:r,q:q};
    cfg.goster(r,q);goster('sonuc',true);
    kayitNot(r);
    durum(cfg.hazirMetin?T(cfg.hazirMetin[0],cfg.hazirMetin[1]):T('Taslak hazır.','Draft ready.'));
  },function(h){if(no!==D.istek)return;durdur();tsSifirla();uretMesgul(false);hataIsle(h||{kod:'genel'})});
}
function vazgec(){D.vazgec=true;D.istek++;if(D.ac)try{D.ac.abort()}catch(e){}durdur();uretMesgul(false);goster(D.kartVar?'sonuc':'bos',false);durum(T('Vazgeçildi.','Cancelled.'));quotaSor();konu.focus()}
function kayitNot(r){var n=$('#kayit-not');if(!n)return;n.textContent='';n.hidden=true;
  if(r&&Array.isArray(r.draft_ids)&&r.draft_ids.length){n.appendChild(d.createTextNode(T('Geçmiş’e kaydedildi. ','Saved to History. ')));var a=el('a',null,T('Geçmişi aç','Open History'));a.href=EN?'/en/hesap/history':'/hesap/gecmis';n.appendChild(a);n.hidden=false}}

function hataIsle(h){
  var k=h.kod||'genel';if(k==='vazgec')return;var s=typeof h.left==='number';if(s)hakAl(h);
  if(k==='limit'){duvarGoster(h.scope||'anon',true);return}
  if(k==='not_ready'){D.acik=false;depo('smc-acik',null);duvarGoster('yakinda',true);return}
  if(k==='llm_limit'){duvarGoster('kapasite',true);return}
  if(k==='too_large'||k==='slow_down'||(k==='bad_input'&&/^(topic|goal|style)$/.test(h.field||''))){
    goster(D.kartVar?'sonuc':'bos',false);durum('');
    if(k==='slow_down'){formNot(T('İstek çok hızlı geldi. Birkaç saniye sonra tekrar dene.','The request came in too fast. Try again in a few seconds.'),'uyari');return}
    if(h.field==='goal'&&hedef){alanHata(hedef,hedefHataEl,T('Hedef kabul edilmedi; kısaltıp tekrar dene.','The goal wasn’t accepted; shorten it and try again.'));var ad=hedef.closest('details');if(ad)ad.open=true;hedef.focus();return}
    if((h.field==='style'||k==='too_large')&&stil&&stil.value.trim()){var dt=$('#stil-acilir');if(dt)dt.open=true;alanHata(stil,stilHataEl,T('Örnek metin kabul edilmedi; kısaltıp tekrar dene.','The example text wasn’t accepted; shorten it and try again.'));stil.focus();return}
    alanHata(konu,konuHataEl,k==='too_large'?T('Metin çok uzun. Konuyu kısalt.','The text is too long. Shorten the topic.'):HATA.bad_input.b+' '+HATA.bad_input.m);konu.focus();return}
  hataGoster(k+(h.charged?'-charged':''),true,s);
}
function hataGoster(kod,odak,hakBilgi){
  var ch=/-charged$/.test(kod),k=kod.replace(/-charged$/,''),h=HATA[k]||HATA.genel;D.hata=HATA[k]?k:'genel';
  $('#hata-baslik').textContent=h.b;var hm=$('#hata-metin');hm.textContent=h.m||'';hm.hidden=!h.m;
  var ik=$('#d-hata .st-simge');if(ik){ik.classList.toggle('st-simge-uyari',h.e==='istemci');ik.classList.toggle('st-simge-hata',h.e!=='istemci')}
  var hk=$('#hata-hak');
  hk.textContent=ch&&typeof D.left==='number'?T('Bu deneme 1 hak kullandı. Bugün '+D.cap+' hakkından '+D.left+' kaldı.','This attempt used 1 credit. '+D.left+' of today’s '+D.cap+' left.'):h.e==='istemci'?T('Hakkının düşüp düşmediği henüz belli değil. Tekrar denersen aynı istek gider; hak iki kez düşmez.','We can’t tell yet whether a credit was used. Trying again sends the same request; you won’t be charged twice.'):T('Hakkın düşmedi.','No credit used.');
  var b=$('#hata-tekrar');b.setAttribute('data-e',h.e);b.removeAttribute('aria-label');
  if(h.e==='duzenle')b.textContent=T('Konuyu düzenle','Edit topic');
  else if(h.e==='yenile')b.textContent=T('Sayfayı yenile','Refresh page');
  else if(h.e==='istemci'&&D.deneme<1)b.textContent=T('Tekrar dene','Try again');
  else{b.textContent=T('Tekrar dene · 1 hak','Try again · 1 credit');b.setAttribute('aria-label',T('Tekrar dene, 1 hak','Try again, 1 credit'))}
  $$('#d-hata .sessiz').forEach(function(x){x.hidden=k==='refused'});
  $('#hata-kod').textContent=h.e==='istemci'?T('Kod: ','Code: ')+(k==='zaman'?'timeout':'network'):T('Kod: ','Code: ')+k+(D.rid?T(' · İstek no: ',' · Request ID: ')+D.rid:'');
  goster('hata',odak);durum(h.b);
}
function tekrarKur(){var b=$('#hata-tekrar');if(!b)return;b.addEventListener('click',function(){
  var e=b.getAttribute('data-e');
  if(e==='duzenle'){goster(D.kartVar?'sonuc':'bos',false);konu.focus();konu.select();return}
  if(e==='yenile'){oturumDepo('smc-konu',konu.value);location.reload();return}
  if(D.left!==null&&D.left<=0&&!D.hakBilinmez){hakYok();return}
  if(e==='istemci')D.deneme++;else{D.deneme=0;D.rid=null;if(D.sonGovde)D.sonGovde.rid=D.rid=uuid()}
  yukle(D.sonGovde);
})}

/* ---- duvar: hak bitti / bağlantı / kapasite / çok yakında + iki isteğe bağlı çıkış ---- */
function duvarHazirla(sc){
  var v=DUVAR[sc]||DUVAR.anon;D.scope=sc;D.yakinda=sc==='yakinda';if(sc!=='yakinda'&&sc!=='kapasite')D.left=0;
  $('#duvar-baslik').textContent=v.h;$('#duvar-metin').textContent=(v.b+' '+v.m).replace(/\b3\b/g,String(D.cap||3));
  var dl=$('#duvar-dokum');dl.textContent='';dl.hidden=!v.d.length;
  v.d.forEach(function(x){var w=el('div'),dt=el('dt',null,x[0]),dd=el('dd',null,x[1]===YEN?yenMetin():x[0]===T('Kullandığın','Used')?D.cap+' / '+D.cap+T(' hak',' credits'):x[1]);w.appendChild(dt);w.appendChild(dd);dl.appendChild(w)});
  var tsk=$('#duvar-taslak');if(tsk)tsk.hidden=!D.kartVar;
  var ik=$('#d-duvar .st-simge');if(ik)ik.classList.toggle('st-simge-uyari',sc!=='yakinda');
  var cb=$('#c-bekle'),bv=$('#b-vaat'),br=$('#b-riza-yazi');
  if(cb)cb.textContent=D.yakinda?T('Açılış için bekleme listesi','Waitlist for the launch'):T('Hesaplı sürüm için bekleme listesi','Waitlist for the account version');
  if(bv)bv.textContent=D.yakinda?T('Araç açılınca ilk sen haber al.','Be the first to hear when the tool opens.'):T('Hesaplı sürüm açılınca ilk sen haber al: marka sesi, takvim, ekip onayı.','Be the first to hear when the account version opens: brand voice, calendar, team approval.');
  if(br)br.textContent=D.yakinda?T('E-posta adresimin açılış duyurusu için işlenmesini kabul ediyorum.','I agree to my e-mail address being processed for the launch announcement.'):T('E-posta adresimin hesaplı sürüm duyurusu için işlenmesini kabul ediyorum.','I agree to my e-mail address being processed for the account-version announcement.');
  var cz=$('#c-biz'),czs=cz&&cz.closest('section');if(czs)czs.hidden=D.yakinda;
  var tb=czs&&$('[data-teklif]',czs);if(tb)tb.setAttribute('data-teklif',sc==='kapasite'?'cap':'limit');
  if(uretB){if(sc==='yakinda'||sc==='kapasite')uretB.setAttribute('aria-disabled','true');}
}
function duvarGoster(sc,odak){durdur();uretMesgul(false);duvarHazirla(sc);if(sc==='yakinda'||sc==='kapasite')uretB&&uretB.setAttribute('aria-disabled','true');goster('duvar',odak);durum(DUVAR[sc]?DUVAR[sc].h:'')}

/* ---- teklif penceresi + bekleme listesi (/submit) ---- */
var ROL={isletme:'işletme',ajans:'ajans',serbest:'serbest'};
function RIZA(){return 'Evet — metin v1 (https://app.socialmediacorner.co/'+(EN?'en/privacy':'kvkk')+')'}
function gonder(tur,o){var f=tur==='bekleme'?[['E-posta',o.email],['Ad',o.name],['Rol',ROL[o.role]||''],['Açık rıza',o.consent?RIZA():''],['Ticari ileti izni',o.marketing?'Evet — v1':'']]:[['E-posta',o.email],['Ad',o.name],['Şirket',o.company],['Sektör',o.sector],['Kaynak',o.src],['Dil',dilAl()]];
  return post('/submit',{page:tur==='bekleme'?'/bekleme-listesi':'/teklif',fields:f.filter(function(x){return x[1]}),hp:o.website||''},15000)}
function gonderHata(h){var k=h&&h.kod;return k==='rate'?T('Kısa sürede çok gönderim oldu. Birkaç dakika sonra tekrar dene.','Too many submissions in a short time. Try again in a few minutes.'):k==='ag'?T('Bağlantı yok. İnternete bağlanınca tekrar dene.','No connection. Try again once you’re online.'):k==='zaman'?T('Yanıt gelmedi. Biraz sonra tekrar dene.','No response came back. Try again a bit later.'):T('Gönderilemedi. Alanları kontrol edip tekrar dene.','Couldn’t send. Check the fields and try again.')}
function alanlar(f){var o={};$$('input[name],textarea[name],select[name]',f).forEach(function(x){if(x.type==='checkbox')o[x.name]=x.checked;else if(x.type!=='radio'||x.checked)o[x.name]=x.value});return o}
function pasif(b){return b.getAttribute('aria-disabled')==='true'}
function epostaBak(inp,hataEl){var v=inp.value.trim(),ok=v.length>0&&inp.checkValidity();
  if(ok){hataEl.hidden=true;hataEl.textContent='';inp.removeAttribute('aria-invalid')}
  else{hataEl.textContent=v?T('E-posta adresi eksik görünüyor. Örn. ad@sirket.com','That e-mail address looks incomplete. E.g. name@company.com'):T('E-posta yaz; sana buradan ulaşacağız.','Enter your e-mail; that’s how we’ll reach you.');hataEl.hidden=false;inp.setAttribute('aria-invalid','true')}
  return ok}
var teklifAc=function(){};
function teklifKur(){
  var dlg=$('#teklif'),tForm=$('#t-form'),tTamam=$('#t-tamam');if(!dlg||!tForm)return;var tBtn=$('button[type="submit"]',tForm),acan=null;
  teklifAc=function(k,btn){
    acan=btn||null;if(tForm.hidden)tForm.reset();tForm.hidden=false;tTamam.hidden=true;tTamam.textContent='';
    $('#t-eposta-hata').hidden=true;$('#t-eposta').removeAttribute('aria-invalid');
    $('#t-kaynak').value=KAYNAK[k]||'top';$('#t-hata').textContent='';$('#teklif-kapat').hidden=true;
    tBtn.textContent=T('Teklif iste','Request a quote');tBtn.removeAttribute('aria-disabled');
    if(dlg.showModal){if(!dlg.open)dlg.showModal()}else dlg.setAttribute('open','');
    $('#teklif-baslik').focus();
  };
  function kapat(){if(dlg.close)dlg.close();else{dlg.removeAttribute('open');if(acan)acan.focus()}}
  function bos(){return !$$('input:not([type="hidden"]),textarea,select',tForm).some(function(x){return x.type==='checkbox'?x.checked:x.value.trim()})}
  $('#teklif-kapat').addEventListener('click',kapat);$('#teklif-vazgec').addEventListener('click',kapat);
  dlg.addEventListener('click',function(e){if(e.target===dlg&&tForm.hidden===false&&bos())kapat()});
  dlg.addEventListener('close',function(){if(acan&&acan.focus)acan.focus()});
  tForm.addEventListener('submit',function(e){
    e.preventDefault();if(pasif(tBtn))return;$('#t-hata').textContent='';
    if(!epostaBak($('#t-eposta'),$('#t-eposta-hata'))){$('#t-eposta').focus();return}
    tBtn.textContent=T('Gönderiliyor…','Sending…');tBtn.setAttribute('aria-disabled','true');
    gonder('teklif',alanlar(tForm)).then(function(){tBtn.textContent=T('Teklif iste','Request a quote');tBtn.removeAttribute('aria-disabled');
      tForm.hidden=true;tTamam.hidden=false;$('#teklif-kapat').hidden=false;tTamam.textContent=T('Talebin ulaştı. Ekip e-postayla döner; teklif ihtiyaca göre hazırlanır.','We’ve received your request. The team will reply by e-mail; the quote is prepared to fit your needs.');tTamam.focus()},
      function(h){tBtn.textContent=T('Teklif iste','Request a quote');tBtn.removeAttribute('aria-disabled');$('#t-hata').textContent=gonderHata(h)});
  });
  d.addEventListener('click',function(e){
    if(e.target.closest&&e.target.closest('[data-src="calendly"]')){olay('quote_click','calendly');return}
    var b=e.target.closest&&e.target.closest('[data-teklif]');if(!b)return;
    e.preventDefault();var k=b.getAttribute('data-teklif');olay('quote_click',KAYNAK[k]||'top');teklifAc(k,b);
  });
}
function bekleKur(){
  var bForm=$('#b-form'),bRiza=$('#b-riza'),bBtn=$('#b-gonder'),bRizaHata=$('#b-riza-hata'),bTamam=$('#b-tamam'),bEposta=$('#b-eposta');if(!bForm)return;
  function rizaYaz(){bBtn.setAttribute('aria-disabled',bRiza.checked?'false':'true');if(bRiza.checked)alanHata(bRiza,bRizaHata,'')}
  bRiza.addEventListener('change',rizaYaz);
  bForm.addEventListener('submit',function(e){
    e.preventDefault();if(bBtn.getAttribute('data-gidiyor'))return;
    if(!bRiza.checked){alanHata(bRiza,bRizaHata,T('Listeye eklemek için açık rıza kutusunu işaretlemen gerekiyor.','To join the list you need to tick the explicit consent box.'));bRiza.focus();return}
    if(!epostaBak(bEposta,$('#b-eposta-hata'))){bEposta.focus();return}
    var eski=bBtn.textContent;bBtn.textContent=T('Ekleniyor…','Adding…');bBtn.setAttribute('aria-disabled','true');bBtn.setAttribute('data-gidiyor','1');
    gonder('bekleme',alanlar(bForm)).then(function(){bBtn.textContent=eski;bBtn.removeAttribute('data-gidiyor');rizaYaz();bForm.hidden=true;bTamam.hidden=false;
      bTamam.textContent=T('Listeye eklendin. ','You’re on the list. ')+(D.yakinda?T('Araç açılınca haber veririz.','We’ll let you know when the tool opens.'):T('Hesaplı sürüm açılınca haber veririz.','We’ll let you know when the account version opens.'));bTamam.focus()},
      function(h){bBtn.textContent=eski;bBtn.removeAttribute('data-gidiyor');rizaYaz();alanHata(bEposta,$('#b-eposta-hata'),gonderHata(h))});
  });
}

/* ---- hak sorgusu ---- */
function quotaSor(ilk){
  if(!API)return;
  post('/gen/quota',{anon:anonAl()},10000).then(function(r){
    D.acik=true;depo('smc-acik','1');hakAl(r);D.hakBilinmez=false;tsYukle();
    try{d.dispatchEvent(new CustomEvent('studyo:hak'))}catch(e){}
    if(uretB&&D.scope!=='kapasite')uretB.removeAttribute('aria-disabled');
    if(ilk&&D.view==='duvar'&&D.scope==='yakinda')goster(D.kartVar?'sonuc':'bos',false);
    if(ilk&&D.left<=0&&D.view!=='sonuc'){duvarGoster(D.hakScope==='ip'||D.hakScope==='global'?D.hakScope:'anon',false);return}
    hakYaz();
  },function(h){
    if(h&&h.kod==='not_ready'){D.acik=false;depo('smc-acik',null);if(D.view==='bos'&&!D.kartVar||D.view==='duvar')duvarGoster('yakinda',false);return}
    hakYaz();
  });
}

/* ---- konu aktarımı (Görsele/Videoya dönüştür) ---- */
function aktarimAl(){
  var anah=cfg&&cfg.aktarim||['studyo-konu','studyo-kanca','smc-konu'],v='';
  anah.concat(['smc-konu']).some(function(k){var x=oturumDepo(k);if(x){oturumDepo(k,null);v=x;return true}return false});
  if(v&&konu&&!konu.value.trim()){konu.value=v.slice(0,KONU_MAX+50);sayacYaz(konu,konuSay,KONU_MAX);var n=$('#aktarim-not');if(n){n.textContent=T('Önceki taslaktan aktarıldı; istersen düzenle.','Carried over from your previous draft; edit it if you like.');n.hidden=false}}
}

/* ---- hash: #tema=…, #teklif ---- */
function hashOku(){var h=location.hash.replace(/^#/,'');if(!h)return;
  h.split('&').forEach(function(kv){var a=kv.split('='),v;try{v=decodeURIComponent(a[1]||'')}catch(e){v=''}
    if(a[0]==='tema'){v=v==='koyu'?'dark':v==='acik'?'light':v;if(v==='dark'||v==='light'){root.setAttribute('data-theme',v);temaYaz()}}
    if(a[0]==='teklif')teklifAc('top',null);
  })}

/* ---- kurulum ---- */
function formKur(){
  form=$('#form');if(!form)return;
  konu=$('#konu');konuSay=$('#konu-sayac');konuHataEl=$('#konu-hata');stil=$('#stil');stilSay=$('#stil-sayac');stilHataEl=$('#stil-hata');
  hedef=$('#hedef');hedefHataEl=$('#hedef-hata');uretB=$('#uret');formNotEl=$('#form-not');
  form.addEventListener('submit',function(e){e.preventDefault();if(uretB&&uretB.getAttribute('aria-disabled')==='true'&&!D.mesgul){if(D.view==='duvar'){var h=$('#duvar-baslik');if(h)h.focus()}return}uret()});
  konu.addEventListener('input',function(){sayacYaz(konu,konuSay,KONU_MAX);if(konuHataEl&&!konuHataEl.hidden)alanHata(konu,konuHataEl,'')});
  form.addEventListener('keydown',function(e){if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();uret()}});
  if(stil)stil.addEventListener('input',function(){sayacYaz(stil,stilSay,STIL_MAX);ozetYaz();if(stilHataEl&&!stilHataEl.hidden&&stil.value.trim().length<=STIL_MAX)alanHata(stil,stilHataEl,'')});
  if(hedef)hedef.addEventListener('input',function(){var s=$('#hedef-sayac');if(s)sayacYaz(hedef,s,cfg&&cfg.hedefMax||200)});
  form.addEventListener('change',ozetYaz);
  /* Turnstile ilk etkileşimde yüklenir (araç açık bilinmiyorsa bile; görünmez kip) */
  var tsIlk=function(){if(D.acik)tsYukle();form.removeEventListener('focusin',tsIlk)};form.addEventListener('focusin',tsIlk);
  $$('[data-konu]').forEach(function(b){b.addEventListener('click',function(){konu.value=b.getAttribute('data-konu');sayacYaz(konu,konuSay,KONU_MAX);alanHata(konu,konuHataEl,'');konu.focus();var s=konu.value.length;try{konu.setSelectionRange(s,s)}catch(e){}})});
  var vz=$('#yuk-vazgec');if(vz)vz.addEventListener('click',vazgec);
  var yd=$('#yeni-taslak');if(yd)yd.addEventListener('click',function(){konu.focus();konu.select()});
  sayacYaz(konu,konuSay,KONU_MAX);if(stil)sayacYaz(stil,stilSay,STIL_MAX);ozetYaz();
}
function basla(){
  temaKur();menuKur();hakKur();teklifKur();bekleKur();formKur();tekrarKur();
  if(!form)return;
  aktarimAl();
  if(API&&depo('smc-acik')==='1'){D.acik=true;D.hakBilinmez=true;goster('bos',false)}
  else if(API){D.hakBilinmez=true;goster('bos',false)}
  else duvarGoster('yakinda',false);
  hashOku();window.addEventListener('hashchange',hashOku);
  quotaSor(true);
  if(cfg&&cfg.basla)cfg.basla();
}

window.Studyo={
  kaydet:function(c){cfg=c;if(c.hedefMax==null)c.hedefMax=0},
  uret:uret,
  refine:function(q){return post('/gen/refine',q,30000).then(function(r){hakAl(r);hakYaz();kayitNot(r);var a=r&&r.drafts&&r.drafts[0];return {text:a&&typeof a.text==='string'?a.text:null}})},
  hak:function(){return {left:D.left,cap:D.cap,reset:D.reset,scope:D.hakScope,bilinmez:D.hakBilinmez}},
  stok:function(q,dis){return al('/gen/stock?'+q,12000,dis)},
  hakYaz:hakYaz,olay:olay,hata:hataIsle,kopyala:kopyala,toast:toast,durum:durum,dil:dilAl,T:T,goster:goster,
  D:D,el:el,$:$,$$:$$,depo:depo,oturumDepo:oturumDepo,yenMetin:yenMetin,cp:cp,azHareket:azHareket,
  DUVAR:DUVAR,SINIR:T('Bugünkü 9 düzenleme hakkın doldu; gece yarısı yenilenir.','You’ve used today’s 9 edits; they renew at midnight.')
};
/* defer sırası: smc-ses.js → studyo-kabuk.js → sayfa modülü; kurulum modül kaydından sonra (DOMContentLoaded).
   S3b: defer betikleri readyState 'interactive' iken çalışır; eski setTimeout(basla,0) yolu sayfa modülü yüklenmeden
   basla'yı koşturabiliyordu (cfg yok → cfg.basla ve aktarım atlanır; blog→video düğmesi dinleyicisiz kalıyordu).
   Artık DOMContentLoaded beklenir; olay kaçtıysa load yedektir; basla bir kez çalışır. */
var basladi=false;function baslaBir(){if(basladi)return;basladi=true;basla()}
if(d.readyState==='complete')setTimeout(baslaBir,0);else{d.addEventListener('DOMContentLoaded',baslaBir);window.addEventListener('load',baslaBir)}
})();
