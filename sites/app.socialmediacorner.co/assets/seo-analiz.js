/* SEO analizi (/seo-analizi, /en/seo-analysis) — POST /gen/seo (Bearer), günlük hak {check:true} ile.
   CSP: satır içi stil yok; genişlik/halka CSSOM (el.style) ile. */
(function(){'use strict';
var d=document,EN=d.documentElement.lang==='en',S=window.Studyo||{};
function T(tr,en){return EN?en:tr}
function $(s){return d.querySelector(s)}
function el(t,c,x){var e=d.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
var API=((d.querySelector('meta[name="api-base"]')||{}).content||'').replace(/\/+$/,'');
var GIRIS=EN?'/en/hesap/login?r=%2Fen%2Fseo-analysis':'/hesap/giris?r=%2Fseo-analizi';
var PLAN=EN?'/en/pricing':'/fiyatlar',BLOG=EN?'/en/blog':'/blog';
var TAHMIN=60,SURE=145000; // sunucu: ≤12 sn indirme + ≤120 sn model (seo.js LLM_RUN)
var f=$('#sa-form'),inp=$('#sa-url'),btn=$('#sa-uret'),hak=$('#sa-hak'),uHata=$('#sa-url-hata');
var yuk=$('#sa-yuk'),hata=$('#sa-hata'),sonuc=$('#sa-sonuc');
if(!f||!inp||!btn)return;
var mesgul=false,ac=null,zm=null,son=null;

function jeton(){
  if(S.oturumJeton)return S.oturumJeton();
  var ds=[];try{ds.push(sessionStorage)}catch(e){}try{ds.push(localStorage)}catch(e){}
  for(var i=0;i<ds.length;i++){var v=null;try{v=ds[i].getItem('smc-oturum')}catch(e){}if(!v)continue;var t=v;
    if(v.charAt(0)==='{'){try{t=JSON.parse(v).token}catch(e){t=null}}if(typeof t==='string'&&/^[A-Za-z0-9_-]{43}$/.test(t))return t}
  return null}
function azHareket(){return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)}
function sayi(n,k){return (k?Number(n).toFixed(k):String(n)).replace('.',EN?'.':',')}
function kopyala(t,ok){
  var tamam=function(){if(S.toast)S.toast(ok||T('Kopyalandı.','Copied.'));else canli(ok||T('Kopyalandı.','Copied.'))},
      olmadi=function(){if(S.toast)S.toast(T('Kopyalanamadı; metni seçip kopyala.','Couldn’t copy; select the text and copy it.'))};
  if(S.kopyala)return S.kopyala(t,tamam,olmadi);
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(tamam,olmadi);else olmadi()}
function canli(m){var e=$('#sa-canli');if(!e)return;e.textContent='';if(m)setTimeout(function(){e.textContent=m},30)}

/* ---- istek ---- */
function istek(govde,ms,dis){
  if(!window.fetch||!API)return Promise.reject({kod:'ag'});
  var tk=jeton();if(!tk)return Promise.reject({kod:'login_required'});
  var c=dis||(window.AbortController?new AbortController():null),tm=c&&ms?setTimeout(function(){c.abort()},ms):null,
      o={method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tk},body:JSON.stringify(govde),credentials:'omit',cache:'no-store'};
  if(c)o.signal=c.signal;
  return fetch(API+'/gen/seo',o).then(function(r){clearTimeout(tm);
    return r.json().then(function(j){if(r.ok&&j&&j.ok!==false)return j;j=j||{};j.kod=j.error||(r.status===401?'login_required':'genel');j.durum=r.status;throw j},
      function(){throw {kod:r.status===401?'login_required':'genel',durum:r.status}})},
    function(e){clearTimeout(tm);throw {kod:e&&e.name==='AbortError'?(zm==='vazgec'?'vazgec':'zaman'):'ag'}});
}

/* ---- günlük hak ---- */
function hakYaz(q){
  if(!hak)return;hak.textContent='';
  if(!q||typeof q.limit!=='number'){return}
  var kalan=Math.max(0,q.limit-(Number(q.used)||0));
  hak.textContent=kalan>0?T('Bugün '+q.limit+' analizden '+kalan+' hakkın kaldı.','You have '+kalan+' of '+q.limit+' analyses left today.')
    :T('Bugünkü '+q.limit+' analiz hakkının hepsini kullandın; yarın yenilenir.','You’ve used all '+q.limit+' analyses for today; they renew tomorrow.');
  hak.classList.toggle('sa-hak-bitti',kalan<=0)}
function hakAl(){
  if(!jeton()){if(hak){hak.textContent='';var a=el('a',null,T('Analiz için giriş yap.','Sign in to run an analysis.'));a.href=GIRIS;hak.appendChild(a)}return}
  istek({check:true,lang:EN?'en':'tr'},15000).then(function(r){hakYaz(r.seo_quota)},function(e){
    if(e&&e.kod==='login_required'&&hak){hak.textContent='';var a=el('a',null,T('Oturumun kapanmış; yeniden giriş yap.','Your session has ended; sign in again.'));a.href=GIRIS;hak.appendChild(a)}
    else if(e&&e.kod==='trial_ended'&&hak){hak.textContent=T('Deneme süren bitti.','Your trial has ended.')}})}

/* ---- adres ---- */
function adresDuzelt(v){
  v=String(v||'').trim();if(!v)return {h:T('Analiz edilecek sayfanın adresini yaz.','Enter the address of the page to analyse.')};
  if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(v))v='https://'+v.replace(/^\/+/,'');
  var u;try{u=new URL(v)}catch(e){return {h:T('Bu geçerli bir adres değil. Örn. https://ornek.com/sayfa','That isn’t a valid address. E.g. https://example.com/page')}}
  if(!/^https?:$/.test(u.protocol))return {h:T('Adres http:// ya da https:// ile başlamalı.','The address must start with http:// or https://.')};
  if(!/\./.test(u.hostname))return {h:T('Alan adını tam yaz (örn. ornek.com).','Write the full domain (e.g. example.com).')};
  if(u.href.length>2048)return {h:T('Adres çok uzun.','The address is too long.')};
  return {u:u.href}}
function alanHata(m){if(!uHata)return;uHata.textContent=m||'';uHata.hidden=!m;inp.setAttribute('aria-invalid',m?'true':'false')}

/* ---- ilerleme ---- */
var ADIM_SN=[0,3,8,16],t0=0,tik=null;
function goster(k){yuk.hidden=k!=='yuk';hata.hidden=k!=='hata';sonuc.hidden=k!=='sonuc'}
function ilerle(){
  var sn=(Date.now()-t0)/1000,lis=yuk.querySelectorAll('.sa-adimlar li'),aktif=0;
  for(var i=0;i<ADIM_SN.length;i++)if(sn>=ADIM_SN[i])aktif=i;
  for(var j=0;j<lis.length;j++){
    var li=lis[j],dr=j<aktif?'bitti':j===aktif?'aktif':'bekliyor';
    if(li.getAttribute('data-durum')!==dr){li.setAttribute('data-durum',dr);
      if(dr==='aktif'){li.setAttribute('aria-current','step');canli(li.textContent+'…')}else li.removeAttribute('aria-current')}
  }
  var c=$('#sa-cubuk');if(c)c.style.width=Math.min(95,Math.round(sn/TAHMIN*90))+'%';
  var s=$('#sa-sure'),g=Math.floor(sn);
  if(s)s.textContent=sn<TAHMIN?T(g+' sn geçti · genelde ~'+TAHMIN+' sn sürer','~'+TAHMIN+' s usually · '+g+' s so far')
    :T(g+' sn geçti · uzun sayfalarda biraz daha sürebilir','~'+TAHMIN+' s usually · '+g+' s so far; long pages can take a little longer');
}
function yukBasla(){t0=Date.now();goster('yuk');var c=$('#sa-cubuk');if(c)c.style.width='0';
  var lis=yuk.querySelectorAll('.sa-adimlar li');for(var i=0;i<lis.length;i++){lis[i].removeAttribute('data-durum');lis[i].removeAttribute('aria-current')}
  ilerle();clearInterval(tik);tik=setInterval(ilerle,1000);
  var b=$('#sa-yuk-b');if(b)try{b.focus({preventScroll:true})}catch(e){}
  yuk.scrollIntoView&&yuk.scrollIntoView({block:'nearest',behavior:azHareket()?'auto':'smooth'})}
function yukBitir(){clearInterval(tik);tik=null}
function mesgulAyar(m){mesgul=m;btn.setAttribute('aria-busy',m?'true':'false');btn.setAttribute('aria-disabled',m?'true':'false');inp.readOnly=m}

/* ---- hata ---- */
var URL_NEDEN={empty:T('Adres boş.','The address is empty.'),too_long:T('Adres çok uzun.','The address is too long.'),invalid:T('Bu geçerli bir adres değil.','That isn’t a valid address.'),
  scheme:T('Adres http:// ya da https:// ile başlamalı.','The address must start with http:// or https://.'),credentials:T('Adreste kullanıcı adı/şifre olamaz.','The address can’t contain a username or password.'),
  port:T('Yalnız standart portlar (80/443) desteklenir.','Only standard ports (80/443) are supported.'),ip:T('IP adresi yerine alan adı kullan.','Use a domain name instead of an IP address.'),
  host:T('Alan adı geçersiz.','The domain name is invalid.'),private:T('Bu adres yerel ya da özel bir ağa ait; herkese açık bir sayfa kullan.','This address points to a local or private network; use a public page.')};
function cekNeden(r){
  r=String(r||'');var m=/^http_(\d{3})$/.exec(r);
  if(m)return m[1]==='404'?T('Sayfa bulunamadı (HTTP 404). Adresi kontrol et.','Page not found (HTTP 404). Check the address.')
    :m[1]==='403'||m[1]==='401'?T('Site sayfayı okumamıza izin vermedi (HTTP '+m[1]+').','The site didn’t let us read the page (HTTP '+m[1]+').')
    :T('Site HTTP '+m[1]+' hatası döndürdü.','The site returned an HTTP '+m[1]+' error.');
  return ({timeout:T('Sayfa 12 saniyede yanıt vermedi.','The page didn’t respond within 12 seconds.'),conn:T('Sayfaya bağlanılamadı.','We couldn’t connect to the page.'),
    redirect_empty:T('Sayfa boş bir adrese yönlendiriyor.','The page redirects to an empty address.'),too_many_redirects:T('Sayfa çok fazla yönlendirme yapıyor.','The page redirects too many times.'),
    redirect_blocked:T('Sayfa izin verilmeyen bir adrese yönlendiriyor.','The page redirects to an address we can’t open.'),not_html:T('Adres bir HTML sayfası değil (örn. PDF ya da görsel).','The address isn’t an HTML page (e.g. a PDF or image).'),
    empty:T('Sayfa boş döndü.','The page came back empty.')})[r]||T('Sayfa okunamadı.','The page couldn’t be read.')}
function hataGoster(e){
  e=e||{};var k=e.kod||'genel',b,m,aks=[],tekrar=true;
  if(k==='login_required'){location.assign(GIRIS);b=T('Giriş yapman gerekiyor','You need to sign in');m=T('SEO analizi hesabınla çalışır. Giriş sayfasına yönlendiriliyorsun.','SEO analysis works with your account. Taking you to the sign-in page.');aks.push(['a',T('Giriş yap','Sign in'),GIRIS,true]);tekrar=false}
  else if(k==='seo_limit'){b=T('Bugünkü analiz hakkın doldu','You’ve used today’s analyses');m=T('Günde '+(e.limit||'')+' SEO analizi yapabilirsin; hakların yarın yenilenir. Daha fazlası için planını yükseltebilirsin.','Your plan includes '+(e.limit||'')+' SEO analyses a day; they renew tomorrow. Upgrade your plan for more.');aks.push(['a',T('Planları gör','See plans'),PLAN,true]);tekrar=false}
  else if(k==='trial_ended'){b=T('Deneme süren bitti','Your trial has ended');m=T('SEO analizine devam etmek için bir plan seç.','Choose a plan to keep using SEO analysis.');aks.push(['a',T('Planları gör','See plans'),PLAN,true]);tekrar=false}
  else if(k==='bad_url'){b=T('Bu adres analiz edilemiyor','This address can’t be analysed');m=URL_NEDEN[e.reason]||T('Adresi kontrol edip tekrar dene.','Check the address and try again.')}
  else if(k==='fetch_failed'){b=T('Sayfa okunamadı','We couldn’t read the page');m=cekNeden(e.reason)+' '+T('Hakkın düşmedi.','This didn’t use up an analysis.')}
  else if(k==='llm_busy'||k==='llm_limit'){b=T('Yapay zekâ şu an yoğun','The AI is busy right now');m=T('Birkaç dakika sonra tekrar dene. Hakkın düşmedi.','Try again in a few minutes. This didn’t use up an analysis.')}
  else if(k==='refused'){b=T('Bu sayfa için öneri üretilemedi','We couldn’t write suggestions for this page');m=T('Yapay zekâ bu içerik için yanıt vermedi. Başka bir sayfa dene. Hakkın düşmedi.','The AI declined this content. Try another page. This didn’t use up an analysis.')}
  else if(k==='zaman'){b=T('Analiz çok uzun sürdü','The analysis took too long');m=T('Bağlantı zaman aşımına uğradı. Tekrar dene.','The connection timed out. Please try again.')}
  else if(k==='ag'){b=T('Bağlantı kurulamadı','Couldn’t connect');m=T('İnternet bağlantını kontrol edip tekrar dene.','Check your internet connection and try again.')}
  else if(k==='too_large'||k==='bad_input'){b=T('İstek geçersiz','Invalid request');m=T('Adresi kontrol edip tekrar dene.','Check the address and try again.')}
  else{b=T('Bir şeyler ters gitti','Something went wrong');m=T('Analiz tamamlanamadı. Biraz sonra tekrar dene.','The analysis couldn’t finish. Please try again shortly.')}
  if(e.seo_quota)hakYaz(e.seo_quota);
  $('#sa-hata-b').textContent=b;$('#sa-hata-m').textContent=m;
  var a=$('#sa-hata-a');a.textContent='';
  if(tekrar){var t=el('button','btn btn-ana',T('Tekrar dene','Try again'));t.type='button';t.addEventListener('click',function(){gonder()});a.appendChild(t)}
  aks.forEach(function(x){var l=el('a','btn '+(x[3]?'btn-ana':'btn-cizgi'),x[1]);l.href=x[2];a.appendChild(l)});
  if(k==='bad_url'){var dz=el('button','btn btn-cizgi',T('Adresi düzelt','Edit the address'));dz.type='button';dz.addEventListener('click',function(){inp.focus();inp.select()});a.appendChild(dz)}
  goster('hata');var h=$('#sa-hata-b');try{h.focus({preventScroll:true})}catch(x){}
  hata.scrollIntoView&&hata.scrollIntoView({block:'nearest',behavior:azHareket()?'auto':'smooth'})}

/* ---- sonuç ---- */
var DOKUM=[['title_quality',T('Başlık etiketi','Title tag')],['meta_desc_quality',T('Meta açıklama','Meta description')],['h1_quality',T('H1 başlığı','H1 heading')],
  ['content_depth',T('İçerik derinliği','Content depth')],['keyword_density',T('Anahtar kelime yoğunluğu','Keyword density')],['bonus_points',T('Teknik etiketler','Technical tags')]];
var RENK={green:'yesil',blue:'mavi',amber:'sari',red:'kirmizi'};
var REKABET={low:T('Düşük','Low'),medium:T('Orta','Medium'),high:T('Yüksek','High')};
var NIYET={informational:T('Bilgi','Informational'),commercial:T('Ticari araştırma','Commercial'),transactional:T('Satın alma','Transactional'),navigational:T('Yön bulma','Navigational')};
function cp(s){return Array.from(String(s||'')).length}
function bos(x){return el('em','sa-yok',x||T('Yok','Missing'))}
function dokumAlt(k,r){var p=r.page_info||{},kw=(r.seo_score||{}).keyword;
  if(k==='title_quality')return p.title?T(cp(p.title)+' karakter · hedef 30–60',cp(p.title)+' chars · target 30–60'):T('Başlık yok','No title');
  if(k==='meta_desc_quality')return p.meta_description?T(cp(p.meta_description)+' karakter · hedef 70–160',cp(p.meta_description)+' chars · target 70–160'):T('Meta açıklama yok','No meta description');
  if(k==='h1_quality'){var n=p.h1s?p.h1s.length:p.h1?1:0;return n===1?T('Tek H1','One H1'):n?T(n+' H1 var · tek olmalı',n+' H1s · use one'):T('H1 yok','No H1')}
  if(k==='content_depth')return T((p.word_count||0)+' kelime · 800+ önerilir',(p.word_count||0)+' words · 800+ recommended');
  if(k==='keyword_density')return kw?'“'+kw.term+'” · '+(EN?sayi(kw.density,2)+'%':'%'+sayi(kw.density,2))+T(' · hedef %0,5–2,5',' · target 0.5–2.5%'):T('Ana anahtar kelime yok','No main keyword');
  return 'canonical, og:title, JSON-LD, viewport'}
function halka(sc){
  var tot=Math.max(0,Math.min(100,Number(sc.total)||0)),h=$('#sa-halka'),dol=$('#sa-halka-dol'),pn=$('#sa-puan');
  h.setAttribute('data-renk',RENK[sc.color]||'mavi');$('#sa-seviye').textContent=sc.level||'';
  $('#sa-seviye').setAttribute('data-renk',RENK[sc.color]||'mavi');
  $('#sa-puan-sr').textContent=T('SEO puanı 100 üzerinden '+tot+': '+(sc.level||''),'SEO score '+tot+' out of 100: '+(sc.level||''));
  dol.style.strokeDashoffset='100';
  if(azHareket()){dol.style.strokeDashoffset=String(100-tot);pn.textContent=String(tot);return}
  pn.textContent='0';
  requestAnimationFrame(function(){requestAnimationFrame(function(){dol.style.strokeDashoffset=String(100-tot)})});
  var b=performance.now(),dur=1100;
  (function ad(t){var x=Math.min(1,(t-b)/dur),e=1-Math.pow(1-x,3);pn.textContent=String(Math.round(tot*e));if(x<1)requestAnimationFrame(ad)})(b)}
function cubuklar(r){
  var ul=$('#sa-cubuklar'),bd=(r.seo_score||{}).breakdown||{},doldur=[];ul.textContent='';
  DOKUM.forEach(function(x){
    var v=Math.max(0,Math.min(20,Number(bd[x[0]])||0)),li=el('li','sa-cubuk'),ust=el('div','sa-cubuk-ust');
    ust.appendChild(el('span','sa-cubuk-ad',x[1]));
    var s=el('span','sa-cubuk-sayi');s.appendChild(el('b',null,String(v)));s.appendChild(d.createTextNode(' / 20'));ust.appendChild(s);
    var iz=el('div','sa-cubuk-iz'),dl=el('span');iz.appendChild(dl);
    iz.setAttribute('role','meter');iz.setAttribute('aria-valuemin','0');iz.setAttribute('aria-valuemax','20');iz.setAttribute('aria-valuenow',String(v));iz.setAttribute('aria-label',x[1]);
    iz.setAttribute('data-renk',v>=16?'yesil':v>=10?'sari':'kirmizi');
    li.appendChild(ust);li.appendChild(iz);li.appendChild(el('p','sa-cubuk-alt',dokumAlt(x[0],r)));ul.appendChild(li);
    doldur.push([dl,v])});
  var yap=function(){doldur.forEach(function(p){p[0].style.width=(p[1]/20*100)+'%'})};
  if(azHareket())yap();else requestAnimationFrame(function(){requestAnimationFrame(yap)})}
function satir(dl,ad,deger){var dt=el('dt',null,ad),dd=el('dd');if(typeof deger==='string'||deger==null)dd.appendChild(deger?d.createTextNode(deger):bos());else dd.appendChild(deger);dl.appendChild(dt);dl.appendChild(dd)}
function sayfaKutu(r){
  var p=r.page_info||{},dl=$('#sa-sayfa');dl.textContent='';
  var bas=function(s){if(!s)return null;var f=d.createDocumentFragment();f.appendChild(d.createTextNode(s+' '));f.appendChild(el('span','sa-sayac',T(cp(s)+' karakter',cp(s)+' chars')));return f};
  satir(dl,T('Başlık','Title'),bas(p.title));
  satir(dl,T('Meta açıklama','Meta description'),bas(p.meta_description));
  if(p.h1s&&p.h1s.length>1){var ol=el('ol','sa-liste');p.h1s.forEach(function(h){ol.appendChild(el('li',null,h))});satir(dl,'H1 ('+p.h1s.length+')',ol)}
  else satir(dl,'H1',p.h1||null);
  var h2=Array.isArray(p.h2s)?p.h2s:[];
  if(h2.length){var ul=el('ol','sa-liste');h2.forEach(function(h){ul.appendChild(el('li',null,h))});satir(dl,'H2 ('+h2.length+')',ul)}else satir(dl,'H2',null);
  satir(dl,T('Kelime sayısı','Word count'),String(p.word_count||0))}
function sorunlar(r){
  var ul=$('#sa-sorunlar'),seen={},n=0;ul.textContent='';
  (r.issues||[]).forEach(function(s){var k=String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();if(!k||seen[k])return;seen[k]=1;n++;ul.appendChild(el('li',null,s))});
  if(!n){var li=el('li','sa-sorun-yok',T('Belirgin bir sorun bulunmadı.','No obvious issues found.'));ul.appendChild(li)}}
function anahtar(r){
  var k=r.keywords||{},g=$('#sa-kw-gruplar');g.textContent='';
  [['primary',T('Ana','Primary')],['secondary',T('İkincil','Secondary')],['long_tail',T('Uzun kuyruk','Long tail')]].forEach(function(x){
    var a=Array.isArray(k[x[0]])?k[x[0]]:[];if(!a.length)return;
    var grp=el('div','sa-kw-grup');grp.appendChild(el('p','sa-kw-ad',x[1]));
    var ul=el('ul','sa-cipler');ul.setAttribute('aria-label',x[1]);a.forEach(function(w){ul.appendChild(el('li','sa-cip'+(x[0]==='primary'?' sa-cip-ana':''),w))});
    grp.appendChild(ul);g.appendChild(grp)});
  var tb=$('#sa-kw-tablo'),rows=Array.isArray(k.table)?k.table:[];tb.textContent='';$('#sa-tablo-k').hidden=!rows.length;
  rows.forEach(function(x){var tr=el('tr'),th=el('th',null,x.keyword);th.scope='row';tr.appendChild(th);
    tr.appendChild(el('td',null,x.volume||'–'));
    var c=el('td');if(x.competition){var sp=el('span','sa-rekabet',REKABET[x.competition]);sp.setAttribute('data-r',x.competition);c.appendChild(sp)}else c.textContent='–';tr.appendChild(c);
    tr.appendChild(el('td',null,NIYET[x.intent]||'–'));tb.appendChild(tr)})}
function alanKutu(ad,deger,hedef){
  var w=el('div','sa-alan'),ust=el('div','sa-alan-ust');ust.appendChild(el('span','sa-alan-ad',ad));
  var n=cp(deger),sy=el('span','sa-sayac',T(n+' karakter',n+' chars'));
  if(hedef){sy.textContent+=T(' · hedef '+hedef[0]+'–'+hedef[1],' · target '+hedef[0]+'–'+hedef[1]);sy.setAttribute('data-ok',n>=hedef[0]&&n<=hedef[1]?'1':'0')}
  ust.appendChild(sy);w.appendChild(ust);
  var alt=el('div','sa-alan-alt'),p=el('p','sa-alan-deger',deger||'');alt.appendChild(p);
  var b=el('button','btn btn-cizgi btn-kucuk');b.type='button';b.innerHTML='<svg class="ikon ikon-k" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>';
  b.appendChild(el('span',null,T('Kopyala','Copy')));b.setAttribute('aria-label',T(ad+' kopyala','Copy '+ad.toLowerCase()));
  b.disabled=!deger;b.addEventListener('click',function(){kopyala(deger,T(ad+' kopyalandı.',ad+' copied.'))});
  alt.appendChild(b);w.appendChild(alt);return w}
function paragraflar(kap,metin){String(metin||'').split(/\n{2,}/).forEach(function(s){s=s.trim();if(s)kap.appendChild(el('p',null,s))})}
function taslakMd(g){
  var c=g.content||{},o=['# '+g.seo_title,''];
  if(c.intro)o.push(c.intro,'');
  (c.sections||[]).forEach(function(s){o.push('## '+s.h2,'',s.content,'');if(s.h3_subheadings&&s.h3_subheadings.length){s.h3_subheadings.forEach(function(h){o.push('### '+h,'')})}});
  if(c.faq&&c.faq.length){o.push('## '+T('Sık sorulan sorular','Frequently asked questions'),'');c.faq.forEach(function(x){o.push('### '+x.q,'',x.a,'')})}
  if(c.conclusion)o.push('## '+T('Sonuç','Conclusion'),'',c.conclusion,'');
  if(g.internal_link_suggestions&&g.internal_link_suggestions.length){o.push('## '+T('İç bağlantı önerileri','Internal link suggestions'),'');g.internal_link_suggestions.forEach(function(x){o.push('- '+x.anchor+(x.topic?' → '+x.topic:''))});o.push('')}
  return o.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n'}
function oneri(r){
  var g=r.generated_content||{},c=g.content||{},al=$('#sa-alanlar');al.textContent='';
  al.appendChild(alanKutu(T('SEO başlığı','SEO title'),g.seo_title||'',[30,60]));
  al.appendChild(alanKutu(T('Meta açıklama','Meta description'),g.meta_description||'',[70,160]));
  al.appendChild(alanKutu(T('URL kısaltması (slug)','URL slug'),g.slug||'',null));
  var m=$('#sa-makale');m.textContent='';
  m.appendChild(el('h4','sa-m-baslik',g.seo_title||''));
  paragraflar(m,c.intro);
  (c.sections||[]).forEach(function(s){m.appendChild(el('h5',null,s.h2));paragraflar(m,s.content);
    if(s.h3_subheadings&&s.h3_subheadings.length){var ul=el('ul','sa-h3');s.h3_subheadings.forEach(function(h){ul.appendChild(el('li',null,h))});m.appendChild(ul)}});
  if(c.faq&&c.faq.length){m.appendChild(el('h5',null,T('Sık sorulan sorular','Frequently asked questions')));var dl=el('dl','sa-sss');
    c.faq.forEach(function(x){dl.appendChild(el('dt',null,x.q));var dd=el('dd');paragraflar(dd,x.a);dl.appendChild(dd)});m.appendChild(dl)}
  if(c.conclusion){m.appendChild(el('h5',null,T('Sonuç','Conclusion')));paragraflar(m,c.conclusion)}
  var ls=g.internal_link_suggestions||[];
  if(ls.length){m.appendChild(el('h5',null,T('İç bağlantı önerileri','Internal link suggestions')));var ul=el('ul','sa-ic-bag');
    ls.forEach(function(x){var li=el('li');li.appendChild(el('b',null,x.anchor));if(x.topic)li.appendChild(d.createTextNode(' → '+x.topic));ul.appendChild(li)});m.appendChild(ul)}
  $('#sa-taslak').open=false;
  var konu=String(g.seo_title||(((r.keywords||{}).primary||[])[0])||'').slice(0,300);
  $('#sa-blog').href=BLOG+(konu?'?konu='+encodeURIComponent(konu):'')}
function sonucGoster(r){
  son=r;var a=$('#sa-adres');a.textContent='';
  var u=String(r.url||'');a.appendChild(d.createTextNode(T('Analiz edilen sayfa: ','Analysed page: ')));
  var l=el('a',null,u);l.href=/^https?:\/\//.test(u)?u:'#';l.target='_blank';l.rel='noopener noreferrer nofollow';a.appendChild(l);
  goster('sonuc');
  halka(r.seo_score||{});cubuklar(r);sayfaKutu(r);sorunlar(r);anahtar(r);oneri(r);
  hakYaz(r.seo_quota);
  var h=$('#sa-sonuc-b');try{h.focus({preventScroll:true})}catch(x){}
  sonuc.scrollIntoView&&sonuc.scrollIntoView({block:'start',behavior:azHareket()?'auto':'smooth'});
  canli(T('Analiz tamamlandı. SEO puanı '+((r.seo_score||{}).total||0)+'.','Analysis complete. SEO score '+((r.seo_score||{}).total||0)+'.'))}

/* ---- gönder ---- */
function gonder(){
  if(mesgul)return;
  var a=adresDuzelt(inp.value);if(a.h){alanHata(a.h);inp.focus();return}
  alanHata('');inp.value=a.u;
  if(!jeton()){hataGoster({kod:'login_required'});return}
  mesgulAyar(true);yukBasla();zm=null;
  ac=window.AbortController?new AbortController():null;
  istek({url:a.u,lang:EN?'en':'tr'},SURE,ac).then(function(r){yukBitir();mesgulAyar(false);sonucGoster(r)},
    function(e){yukBitir();mesgulAyar(false);hataGoster(e)})}
f.addEventListener('submit',function(e){e.preventDefault();gonder()});
inp.addEventListener('input',function(){if(uHata&&!uHata.hidden)alanHata('')});
$('#sa-yeni').addEventListener('click',function(){goster('');inp.focus();inp.select()});
$('#sa-kopya-hepsi').addEventListener('click',function(){if(son&&son.generated_content)kopyala(taslakMd(son.generated_content),T('Makale taslağı Markdown olarak kopyalandı.','Article draft copied as Markdown.'))});
try{var q=new URLSearchParams(location.search).get('url');if(q&&!inp.value)inp.value=q.slice(0,2048)}catch(e){}
hakAl();
})();
