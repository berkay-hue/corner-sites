/* A9a üst çubuk hesap alanı: Giriş yap / Kayıt ol düğmeleri + hesap menüsü (Stüdyo, Planlar ve hesap sayfaları).
   Stüdyo/Planlar (.st-ust[data-hesap]): token yoksa istek atılmaz → misafir görünümü. Token varsa /auth/me ile doğrulanır
   (smc-hesap.js yokla() ile aynı eşleme): 200 → üye · 401 → token silinir, misafir · 403 origin/404/503 not_ready (hesaplar
   kapalı) → misafir, token korunur · ağ hatası → üye görünümü kalır (doğrulanamadı; Çıkış yine çalışır).
   Çıkış mevcut akışın aynısı: POST /auth/logout → token iki depodan silinir → "Çıkış yaptın." notu → giriş sayfası.
   Hesap sayfaları (body[data-sayfa]): istek atılmaz; menü smc-hesap.js'in [data-oturum] açmasıyla görünür, Çıkış #cikis ile
   smc-hesap.js cikisKur'da kalır. Burada yalnız menü klavye/fare davranışı kurulur.
   Menü: aria-expanded, Esc (odak düğmeye döner), dış tıklama, ↑/↓/Home/End, Tab ile çıkınca kapanır.
   Yerel inceleme: localhost/127.0.0.1/*.pages.dev üzerinde #oturum → örnek üye görünümü, hiçbir istek gönderilmez.
   A11-2 "Ücretsiz hesap oluştur" kartı (#uy-kart, Stüdyo ana sayfa): üyeye gizlenir. Misafirde /auth/me (tokensiz) ile üyelik
   durumu okunur: 401 → açık · 403 origin/404/503 not_ready → yakında · diğerleri → nötr (CTA kalır). Sonuç 10 dk sessionStorage'da. */
(function(){'use strict';
var d=document,root=d.documentElement,EN=root.getAttribute('lang')==='en';
function T(tr,en){return EN?en:tr}
function $(s,k){return (k||d).querySelector(s)}
function $$(s,k){return Array.prototype.slice.call((k||d).querySelectorAll(s))}
var TOKEN_RE=/^[A-Za-z0-9_-]{43}$/;
var meta=$('meta[name="api-base"]');
var API=((meta&&meta.getAttribute('content'))||'').trim().replace(/\/+$/,'');
var MOCKHOST=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)||/\.pages\.dev$/.test(location.hostname);
var ORNEK=MOCKHOST&&/(^|&)oturum(=|&|$)/.test(location.hash.slice(1));
var GIRIS=EN?'/en/hesap/login':'/hesap/giris';

/* ---- oturum deposu (smc-hesap.js ile aynı anahtar ve kural) ---- */
function depo(k){try{return k==='l'?window.localStorage:window.sessionStorage}catch(e){return null}}
function tokenAl(){var r=null;['s','l'].some(function(k){try{var s=depo(k),v=s&&s.getItem('smc-oturum');if(v&&TOKEN_RE.test(v)){r=v;return true}}catch(e){}return false});return r}
function tokenSil(){['s','l'].forEach(function(k){try{var s=depo(k);if(s)s.removeItem('smc-oturum')}catch(e){}})}
function istek(yol,yontem){
  var tok=tokenAl(),h={'Accept':'application/json'},o={method:yontem||'GET',headers:h,credentials:'omit',cache:'no-store',mode:'cors'},z=null;
  if(tok)h.Authorization='Bearer '+tok;
  if(yontem==='POST'){h['Content-Type']='application/json';o.body='{}'}
  if(typeof AbortController==='function'){var ac=new AbortController();o.signal=ac.signal;z=setTimeout(function(){ac.abort()},12000)}
  return fetch(API+yol,o).then(function(r){return r.text().then(function(x){var j=null;try{j=x?JSON.parse(x):{}}catch(e){j={}}
    if(!j||typeof j!=='object'||Array.isArray(j))j={};j._s=r.status;return j})})
  .catch(function(){return {_s:0}})
  .then(function(j){if(z)clearTimeout(z);return j});
}

/* ---- menü ---- */
function menuKur(){
  var b=$('#hesap-dugme'),m=$('#hesap-menu');if(!b||!m)return;
  function ogeler(){return $$('a,button',m).filter(function(x){return x.getClientRects().length>0})}
  function ac(v,odak){
    m.hidden=!v;b.setAttribute('aria-expanded',v?'true':'false');
    if(v&&odak!==false){var o=ogeler();if(o.length)o[odak==='son'?o.length-1:0].focus()}
  }
  b.addEventListener('click',function(){ac(m.hidden)});
  b.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();ac(true)}
    else if(e.key==='ArrowUp'){e.preventDefault();ac(true,'son')}
  });
  d.addEventListener('click',function(e){if(!m.hidden&&!m.contains(e.target)&&!b.contains(e.target))ac(false,false)});
  d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!m.hidden){e.preventDefault();ac(false,false);b.focus()}});
  m.addEventListener('keydown',function(e){
    var o=ogeler(),i=o.indexOf(d.activeElement);if(!o.length)return;
    if(e.key==='ArrowDown'){e.preventDefault();o[(i+1)%o.length].focus()}
    else if(e.key==='ArrowUp'){e.preventDefault();o[(i-1+o.length)%o.length].focus()}
    else if(e.key==='Home'){e.preventDefault();o[0].focus()}
    else if(e.key==='End'){e.preventDefault();o[o.length-1].focus()}
  });
  /* odak menü ve düğme dışına çıkınca (Tab/Shift+Tab) kapanır */
  m.addEventListener('focusout',function(e){var h=e.relatedTarget;if(h&&!m.contains(h)&&h!==b)ac(false,false)});
  m.addEventListener('click',function(e){if(e.target.closest('a,button'))setTimeout(function(){ac(false,false)},0)});
}

/* ---- Stüdyo/Planlar: misafir ↔ üye ---- */
var ust=$('.st-ust[data-hesap]');
var kart=$('#uy-kart');
function durum(s,u){
  if(kart)kart.hidden=s==='uye';
  if(!ust)return;ust.setAttribute('data-hesap',s);
  var av=$('#hesap-dugme .st-av'),kim=$('#hesap-kim'),b=$('#hesap-dugme');
  if(b)b.setAttribute('aria-label',s==='uye'?T('Hesap menüsü','Account menu'):T('Hesap ve menü','Account and menu'));
  if(s!=='uye'||!u)return;
  var ad=String(u.name||u.email||'').trim(),ilk=ad?Array.from(ad)[0].toLocaleUpperCase(EN?'en':'tr'):'';
  if(av&&ilk){av.textContent=ilk;av.classList.add('st-av-harf')}
  if(kim){kim.textContent=String(u.email||u.name||'');kim.hidden=!kim.textContent}
  /* A13: /auth/me admin:true → Geçmiş'in ardına Yönetim (sayfa yalnız TR) */
  var m=$('#hesap-menu');
  if(u.admin===true&&m&&!$('#hesap-admin')){var g=$('a[data-m="uye"][href$="/gecmis"],a[data-m="uye"][href$="/history"]',m),y=d.createElement('a');
    y.href='/hesap/admin';y.id='hesap-admin';y.setAttribute('data-m','uye');y.textContent=T('Yönetim','Admin');m.insertBefore(y,g?g.nextSibling:$('hr',m))}
}
function cikisKur(){
  $$('[data-cikis]').forEach(function(b){b.addEventListener('click',function(){
    if(b.getAttribute('aria-busy')==='true')return;
    b.setAttribute('aria-busy','true');b.setAttribute('aria-disabled','true');b.textContent=T('Çıkış yapılıyor…','Logging out…');
    /* not TR yazılır; giriş sayfasında smc-hesap.js dile göre çevirir */
    var git=function(){tokenSil();try{sessionStorage.setItem('smc-hesap-not',JSON.stringify(['Çıkış yaptın.','ok',null]))}catch(e){}location.assign(GIRIS+(ORNEK?'#ornek':''))};
    if(ORNEK||!API){git();return}
    istek('/auth/logout','POST').then(git);
  })});
}
/* ---- üyelik durumu (kart) ---- */
var UY_ANAHTAR='smc-uyelik',UY_SURE=600000;
function uyelikGoster(s){if(!kart)return;$$('[data-uyelik]',kart).forEach(function(x){x.hidden=x.getAttribute('data-uyelik').split(' ').indexOf(s)<0})}
function uyelikEsle(j){
  if(j._s===401)return 'acik';
  if((j._s===403&&j.error==='origin')||j._s===404||(j._s===503&&j.error==='not_ready'))return 'kapali';
  return '';
}
function uyelikYaz(s){if(!s)return;uyelikGoster(s);try{sessionStorage.setItem(UY_ANAHTAR,JSON.stringify({s:s,z:Date.now()}))}catch(e){}}
function uyelikYokla(){
  if(!kart||!API)return;
  try{var v=JSON.parse(sessionStorage.getItem(UY_ANAHTAR)||'null'),n=Date.now();if(v&&(v.s==='acik'||v.s==='kapali')&&n>=v.z&&n-v.z<UY_SURE){uyelikGoster(v.s);return}}catch(e){}
  istek('/auth/me').then(function(j){uyelikYaz(uyelikEsle(j))});
}
function studyoBasla(){
  if(!ust)return;
  cikisKur();
  if(ORNEK){durum('uye',{name:'Deniz Yılmaz',email:'deniz@ornekajans.com.tr'});return}
  if(!API||!tokenAl()){durum('misafir');uyelikYokla();return}
  durum('uye');
  istek('/auth/me').then(function(j){
    if(j._s===200&&j.user&&typeof j.user==='object'){durum('uye',j.user);return}
    if(j._s===401){tokenSil();
      /* A15: kapılı stüdyo sayfasında süresi dolmuş oturum → girişe, ?r= ile geri */
      if(document.querySelector('script[src="/assets/giris-kapisi.js"]')){var en=/^\/en(\/|$)/.test(location.pathname);location.replace((en?'/en/hesap/login':'/hesap/giris')+'?r='+encodeURIComponent(location.pathname.replace(/\.html$/,'').replace(/\/index$/,'/')));return}
      durum('misafir');uyelikYaz('acik');return}
    if((j._s===403&&j.error==='origin')||j._s===404||(j._s===503&&j.error==='not_ready')){durum('misafir');uyelikYaz('kapali');return}
    /* ağ ya da beklenmeyen hata: üye görünümü kalır, avatar genel ikon */
  });
}

menuKur();studyoBasla();
})();
