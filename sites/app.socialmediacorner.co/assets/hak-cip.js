/* Hesap sayfalarında üst çubuktaki hak hapı (stüdyo ile aynı görünüm).
   Girişliyse /gen/quota'dan bu ayın LinkedIn+Blog hakkını gösterir; balon tıklayınca açılır. */
(function(){'use strict';
var d=document,k=d.getElementById('hak-k'),p=d.getElementById('hak'),y=d.getElementById('hak-yazi'),bl=d.getElementById('hak-balon');
if(!k||!p||!y)return;
var EN=(d.documentElement.lang||'').slice(0,2)==='en';function T(a,b){return EN?b:a}
var meta=d.querySelector('meta[name="api-base"]'),API=((meta&&meta.getAttribute('content'))||'').trim().replace(/\/+$/,'');
var MOCK=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)||/\.pages\.dev$/.test(location.hostname);
var ORNEK=!API||(MOCK&&/(^|&)ornek(=|&|$)/.test(location.hash.slice(1)));
var AD={linkedin_blog:T('LinkedIn+Blog','LinkedIn+Blog'),video_gorsel:T('Video+Görsel','Video+Visual')};
function tok(){var r=null;[function(){return sessionStorage},function(){return localStorage}].some(function(f){try{var v=f().getItem('smc-oturum');if(v&&/^[A-Za-z0-9_-]{43}$/.test(v)){r=v;return true}}catch(e){}return false});return r}
function anon(){try{return localStorage.getItem('smc-anon')||''}catch(e){return ''}}
function yaz(ust,alt,veri,tur){y.textContent=ust;if(tur){var s=d.createElement('span');s.className='hak-tur';s.textContent=' · '+tur;y.appendChild(s)}p.setAttribute('data-hak',veri);if(bl)bl.textContent=alt}
function belirsiz(){yaz(T('Hak: belli değil','Credits: unknown'),T('Her üretim 1 hak kullanır; hak ayın ilk günü yenilenir.','Each generation uses 1 credit; credits renew on the 1st of the month.'),'?')}
function goster(r){
  var m=r&&r.month||{},ay=m.linkedin_blog,vg=m.video_gorsel;
  if(r&&r.trial_ended===true){yaz(T('Deneme bitti','Trial ended'),T('14 günlük ücretsiz denemen sona erdi; taslakların hesabında duruyor. Plan için bizimle iletişime geç.','Your 14-day free trial has ended; your drafts stay in your account. Contact us for a plan.'),'0');return}
  if(!ay||ay.limit==null){belirsiz();return}
  if(r.plan==='demo'){
    var dk=Math.max(0,(ay.limit|0)-(ay.used|0)),son='';
    if(typeof r.trial_ends_at==='string'){try{var dt=new Date(r.trial_ends_at);if(!isNaN(dt))son=dt.toLocaleDateString(EN?'en-GB':'tr-TR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Istanbul'})}catch(e){}}
    var da=T('14 gün ücretsiz deneme: '+AD.linkedin_blog+' '+dk+'/'+ay.limit+' kaldı.','14-day free trial: '+AD.linkedin_blog+' '+dk+'/'+ay.limit+' left.');
    if(vg&&vg.limit!=null)da+=' '+AD.video_gorsel+': '+Math.max(0,(vg.limit|0)-(vg.used|0))+'/'+vg.limit+'.';
    da+=' '+T('Deneme hakkı yenilenmez.','Trial credits don’t renew.');if(son)da+=' '+T('Deneme bitişi: '+son+'.','Trial ends: '+son+'.');
    yaz(T('Deneme: '+dk+'/'+ay.limit+' kaldı','Trial: '+dk+'/'+ay.limit+' left'),da,dk<=0?'0':dk===1?'1':'2',AD.linkedin_blog);return;
  }
  var kalan=Math.max(0,(ay.limit|0)-(ay.used|0)),alt=T('Planındaki aylık '+AD.linkedin_blog+' hakkı '+ay.limit+'; '+kalan+' kaldı.','Your plan’s monthly '+AD.linkedin_blog+' allowance is '+ay.limit+'; '+kalan+' left.');
  if(vg&&vg.limit!=null)alt+=' '+T(AD.video_gorsel+': '+Math.max(0,(vg.limit|0)-(vg.used|0))+'/'+vg.limit+'.',AD.video_gorsel+': '+Math.max(0,(vg.limit|0)-(vg.used|0))+'/'+vg.limit+'.');
  alt+=' '+T('Her üretim 1 hak kullanır; hak ayın ilk günü yenilenir.','Each generation uses 1 credit; it renews on the 1st of the month.');
  yaz(T('Bu ay '+kalan+'/'+ay.limit+' kaldı',kalan+'/'+ay.limit+' left this month'),alt,kalan<=0?'0':kalan===1?'1':'2',AD.linkedin_blog);
}
p.addEventListener('click',function(){var a=!k.classList.contains('acik');k.classList.toggle('acik',a);p.setAttribute('aria-expanded',a?'true':'false')});
d.addEventListener('click',function(e){if(!k.contains(e.target)){k.classList.remove('acik');p.setAttribute('aria-expanded','false')}});
d.addEventListener('keydown',function(e){if(e.key==='Escape'){k.classList.remove('acik');p.setAttribute('aria-expanded','false')}});
if(ORNEK){goster({month:{linkedin_blog:{limit:8,used:1},video_gorsel:{limit:2,used:0}}});return}
var t=tok(),h={'Content-Type':'application/json'};if(t)h.Authorization='Bearer '+t;
var ctl=typeof AbortController==='function'?new AbortController():null;if(ctl)setTimeout(function(){ctl.abort()},10000);
fetch(API+'/gen/quota',{method:'POST',headers:h,body:JSON.stringify({anon:anon()}),signal:ctl?ctl.signal:undefined})
  .then(function(r){return r.ok?r.json():null}).then(function(r){if(r&&r.ok!==false)goster(r);else belirsiz()},belirsiz);
})();
