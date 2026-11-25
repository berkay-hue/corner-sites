/* Social Media Corner · hesap sayfaları (A5-2)
   CSP yalnız 'self': satır içi betik/stil yok. DOM yalnız textContent ve createElement ile kurulur.
   Mod: api-base boşsa ya da yerel/pages.dev önizlemede adreste #ornek varsa ÖRNEK modu çalışır; hiçbir istek gitmez.
   Oturum: smc-oturum (Beni hatırla işaretliyse localStorage, değilse sessionStorage). */
(function(){
'use strict';
var d=document,root=d.documentElement,body=d.body;
var EN={"Yönetim":"Admin","Gizle":"Hide","Göster":"Show","Şifreyi gizle":"Hide password","Şifreyi göster":"Show password","1 taslak":"1 draft","Karusel":"Carousel","Silinmesine {n} gün":"Deleted in {n} days","Silinmesine 1 gün":"Deleted in 1 day","Bugün silinecek":"Deleted today",
"Demo · {n} gün kaldı":"Demo · {n} days left","Demo · 1 gün kaldı":"Demo · 1 day left","Deneme bitti — plan için iletişime geç":"Trial ended — contact us for a plan","Teklif al":"Get a quote",
"Bağla":"Connect",
"Bağlantı ve kayıtlı yetki burada silinir; {p} tarafındaki izni {p} ayarlarından kaldırırsın. Bu hesaba otomatik paylaşım yapılmaz. Geçmiş’teki taslakların silinmez; istediğin an yeniden bağlarsın.":"The connection and stored access are deleted here; you remove the permission in your {p} settings. Nothing will be shared to this account automatically. Your drafts in History stay; you can reconnect any time.",
"Bağlantılar ya da Panel sayfasında bu hesabın bağlantısını kaldır.":"Remove this account’s connection on the Connections or Panel page.",
"Bağlantıyı kaldır":"Remove connection",
"Bağlantıyı nasıl kaldırırım?":"How do I remove the connection?",
"Bu {p} hesabı başka bir Corner sitesindeki (örneğin Brand Corner) ya da başka bir kullanıcıdaki hesaba bağlı. Önce orada bağlantıyı kaldır, sonra burada yeniden dene.":"This {p} account is linked to an account on another Corner site (for example Brand Corner) or to another user. Remove the connection there first, then try again here.",
"Kaldırılıyor…":"Removing…",
"Otomatik paylaşım Pro planda.":"Auto-sharing is on the Pro plan.",
"Planlanan taslaklar bu hesaba otomatik paylaşılır.":"Scheduled drafts are shared to this account automatically.",
"Planları gör":"See plans",
"Yakında":"Coming soon",
"{p} bağlantısı kaldırıldı.":"The {p} connection was removed.",
"{p} bağlantısı kaldırılsın mı?":"Remove the {p} connection?",
"{p} bağlantısını kaldır":"Remove the {p} connection",
"Ad en fazla 100 karakter olabilir.":"Name can be at most 100 characters.",
"Adım {n} / 3":"Step {n} of 3",
"Adını yaz.":"Enter your name.",
"Bağlanamadı":"Couldn’t connect",
"Bağlantı yeniden gönderildi.":"Link sent again.",
"Bağlantının süresi doldu. Yeniden bağlanmayı dene.":"The connection expired. Try connecting again.",
"Bağlanıyor":"Connecting",
"Bağlı":"Connected",
"Bağlı değil":"Not connected",
"Bağlı olduğu Corner hesabında oturum aç.":"Log in to the Corner account it is linked to.",
"Başka taslak yok.":"No more drafts.",
"Başlıksız taslak":"Untitled draft",
"Bir kelime en fazla 40 karakter olabilir.":"Each word can be at most 40 characters.",
"Bir sorun oldu. Biraz sonra yeniden dene. (Kod: {k})":"Something went wrong. Try again in a little while. (Code: {k})",
"Bu bağlantı başka bir oturumda başlatıldı. Buradan yeniden bağlanmayı dene.":"This connection was started in another session. Try connecting again from here.",
"Bu bölüm yakında.":"This section is coming soon.",
"Bu e-postayla bir hesap var. Giriş yap ya da şifreni sıfırla.":"An account with this email already exists. Log in or reset your password.",
"Bu hesap başka bir Corner hesabına bağlı.":"This account is linked to another Corner account.",
"Bu kelime zaten listede.":"This word is already on the list.",
"Buraya dönüp Yeniden dene düğmesine bas.":"Come back here and press Try again.",
"Deneniyor…":"Trying…",
"Devam":"Continue",
"Devam etmek için kutuyu işaretle.":"Tick the box to continue.",
"Dosya indirilemedi. Başka bir tarayıcıda yeniden dene.":"The file couldn’t be downloaded. Try again in another browser.",
"E-postanı yaz.":"Enter your email.",
"En fazla 3 ton seçebilirsin.":"You can pick up to 3 tones.",
"En fazla 30 kelime ekleyebilirsin.":"You can add up to 30 words.",
"Esprili":"Witty",
"Geçerli bir e-posta yaz, örneğin ad@sirket.com.":"Enter a valid email, for example name@company.com.",
"Giriş yapılıyor…":"Logging in…",
"Gönderiliyor…":"Sending…",
"Hazırlanıyor":"Preparing",
"Hazırlanıyor…":"Preparing…",
"Henüz kelime yok.":"No words yet.",
"Hesabın açıldı. Şimdi marka sesini tanıt.":"Your account is ready. Now introduce your brand voice.",
"Hesabın silindi. Bağların ve kayıtlı yetkiler de silindi.":"Your account was deleted. Your connections and saved permissions were deleted too.",
"Hesap açılıyor…":"Creating account…",
"Instagram bağlantısı Meta’nın uygulama incelemesini bekliyor. İnceleme bitince bu düğme açılır.":"The Instagram connection is waiting for Meta’s app review. This button turns on when the review is done.",
"Kaldır: {k}":"Remove: {k}",
"Kaydediliyor…":"Saving…",
"Kayıt tamamlanamadı. Sayfayı yenileyip yeniden dene.":"Registration couldn’t be completed. Refresh the page and try again.",
"Kod: taken":"Code: taken",
"Kod: {k}":"Code: {k}",
"Kopyala":"Copy",
"Kopyala: {k}":"Copy: {k}",
"Planla":"Schedule",
"Planla: {k}":"Schedule: {k}",
"Kopyalanamadı. Metni seçip elle kopyala.":"Couldn’t copy. Select the text and copy it manually.",
"Kopyalandı.":"Copied.",
"Kurulumu bitir":"Finish setup",
"Kurumsal":"Corporate",
"Kısalt":"Show less",
"Marka sesi kaydedilemedi. Alanları kontrol edip yeniden dene.":"Brand voice couldn’t be saved. Check the fields and try again.",
"Marka sesin kaydedildi. İstediğin zaman Marka sesi sekmesinden değiştirebilirsin.":"Your brand voice is saved. Change it any time from the Brand voice tab.",
"Net ve kısa":"Short and clear",
"Oturumun sona erdi. Yeniden giriş yap.":"Your session has ended. Log in again.",
"Samimi":"Friendly",
"Sektör":"Sector",
"Seçilmedi":"Not chosen",
"Sil":"Delete",
"Sil: {k}":"Delete: {k}",
"Siliniyor…":"Deleting…",
"Son güncelleme: {t}":"Last updated: {t}",
"Bağlanma tarihi: {t}":"Connected on: {t}",
"Sunucuya ulaşılamadı. Bağlantını kontrol edip yeniden dene.":"We couldn’t reach the server. Check your connection and try again.",
"Tamamını göster":"Show all",
"Taslak silindi.":"Draft deleted.",
"Ton":"Tone",
"Ton: {t}":"Tone: {t}",
"Veri odaklı":"Data-driven",
"Verilerin JSON dosyası olarak indirildi.":"Your data was downloaded as a JSON file.",
"Yasaklı kelime":"Banned words",
"Yasaklı kelimede | işaretini kullanma.":"Don't use the | character in banned words.",
"Yeni bağlantılar şu an kapalı. Açıldığında bu düğme çalışır.":"New connections are closed right now. This button will work once they open.",
"Yeniden dene":"Try again",
"Yeniden yetkilendir":"Re-authorise",
"Yeniden yetkilendirince ölçümler kaldığı yerden sürer. Taslakların etkilenmez.":"Re-authorise and metrics pick up where they left off. Your drafts are not affected.",
"Yetki yenilenmeli":"Needs re-authorisation",
"Yönlendiriliyor…":"Redirecting…",
"Yükleniyor…":"Loading…",
"{n} / 3":"{n} / 3",
"{n} / 30":"{n} / 30",
"{n} / {m} taslak gösteriliyor":"Showing {n} of {m} drafts",
"{n} adet":"{n}",
"{n} karakter":"{n} characters",
"{n} taslak":"{n} drafts",
"{p} bağlandı.":"{p} connected.",
"{p} bağlantısı henüz hazır değil. Hazır olunca bu düğme açılır.":"The {p} connection isn’t ready yet. This button turns on once it is.",
"{p} bağlantısı tamamlanamadı. Yeniden bağlanmayı dene.":"The {p} connection couldn’t be completed. Try connecting again.",
"{p} bağlantısı şu an başlatılamadı.":"The {p} connection couldn’t be started right now.",
"{p} bağlantısını onaylamadın. İstediğin zaman yeniden deneyebilirsin.":"You didn’t approve the {p} connection. You can try again any time.",
"{p} hesabını bağla":"Connect {p}",
"{p} yetkisinin süresi doldu.":"{p} access has expired.",
"{p} şu an yanıt vermedi. Biraz sonra yeniden dene.":"{p} didn’t respond just now. Try again in a little while.",
"Çok fazla deneme. Biraz bekleyip yeniden dene.":"Too many attempts. Wait a little and try again.",
"Çok fazla hatalı deneme. 15 dakika bekleyip yeniden dene.":"Too many failed attempts. Wait 15 minutes and try again.",
"Çıkış yaptın.":"You are logged out.",
"Çıkış yapılıyor…":"Logging out…",
"ÖRNEK: Başka taslak yok.":"SAMPLE: No more drafts.",
"ÖRNEK: Hesabın silindi. Bağların ve kayıtlı yetkiler de silindi.":"SAMPLE: Your account was deleted. Your connections and stored access were deleted too.",
"ÖRNEK: Verilerin JSON dosyası olarak indirildi.":"SAMPLE: Your data was downloaded as a JSON file.",
"ÖRNEK: {p} bağlandı.":"SAMPLE: {p} connected.",
"Örnek Ajans":"Sample Agency",
"Örnek gönderi":"Sample posts",
"Öğretici":"Educational",
"İlham verici":"Inspiring",
"Şifre en az 8 karakter olmalı.":"The password must be at least 8 characters.",
"Şifre en fazla 200 karakter olabilir.":"Password can be at most 200 characters.",
"Şifre hatalı.":"Incorrect password.",
"Şifreler aynı değil.":"The passwords don’t match.",
"Şifren yenilendi.":"Your password has been reset.",
"Şifren yenilendi. Yeni şifrenle giriş yap.":"Your password was reset. Log in with the new one.",
"Şifreni yaz.":"Enter your password.",
"Şu an e-posta gönderemiyoruz. Biraz sonra yeniden dene.":"We can’t send email right now. Try again in a little while.",
"Devam etmek için KVKK onay kutusunu işaretle.":"Tick the KVKK consent box to continue.",
"Devam etmek için yapay zekâ onay kutusunu işaretle.":"Tick the AI consent box to continue.",
"Güvenlik doğrulaması yüklenemedi. Sayfayı yenileyip yeniden dene.":"The security check couldn’t load. Refresh the page and try again.",
"Güvenlik doğrulaması bitmedi. Birkaç saniye bekleyip yeniden dene.":"The security check isn’t finished yet. Wait a few seconds and try again.",
"Güvenlik doğrulaması tamamlanamadı. Biraz bekleyip yeniden dene.":"The security check couldn’t be completed. Wait a moment and try again.",
"Güvenlik doğrulaması başarısız oldu. Doğrulamayı yeniden tamamlayıp tekrar dene.":"The security check failed. Complete it again and retry.",
"Bu e-posta zaten kayıtlı.":"This email is already registered.",
"Giriş yap":"Log in",
"Çok fazla deneme yapıldı. Biraz sonra yeniden dene.":"Too many attempts. Try again in a little while.",
"Üyelik çok yakında açılıyor.":"Accounts are opening very soon."};
var dil=root.getAttribute('lang')==='en'?'en':'tr';
var SAYFA=body.getAttribute('data-sayfa')||'';
var KORUMALI=body.hasAttribute('data-korumali');
var T0=Date.now();
var YOL={giris:['/hesap/giris','/en/hesap/login'],kayit:['/hesap/kayit','/en/hesap/register'],kurulum:['/hesap/kurulum','/en/hesap/setup'],baglantilar:['/hesap/baglantilar','/en/hesap/connections'],gecmis:['/hesap/gecmis','/en/hesap/history'],ayarlar:['/hesap/ayarlar','/en/hesap/settings'],kuyruk:['/yayin-kuyrugu','/en/publish-queue'],'blog-otomatik':['/blog-otomatik','/en/blog-autopilot']};
var ACIK_SAYFA=/\/(giris|kayit|sifre-unuttum|sifre-yenile|login|register|forgot-password|reset-password)$/;
var TOKEN_RE=/^[A-Za-z0-9_-]{43}$/,R_RE=/^\/(en\/?)?(hesap\/[a-z-]+|video|gorsel|visual|blog|blog-otomatik|blog-autopilot|yayin-kuyrugu|publish-queue)?$/,EPOSTA=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var meta=d.querySelector('meta[name="api-base"]');
var API=((meta&&meta.getAttribute('content'))||'').trim().replace(/\/+$/,'');
var MOCKHOST=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)||/\.pages\.dev$/.test(location.hostname);
var ORNEK=!API||(MOCKHOST&&/(^|&)ornek(=|&|$)/.test(location.hash.slice(1)));
var TON={samimi:'Samimi',kurumsal:'Kurumsal',esprili:'Esprili',ogretici:'Öğretici',ilham:'İlham verici',net:'Net ve kısa',veri:'Veri odaklı'};
var PAD={linkedin:'LinkedIn',instagram:'Instagram'};
/* A15: geçmiş rozeti; blog/video satırı da gelir, karusel video, Reels instagram satırıdır (meta.kind). Saklama 3 gün (sunucu DRAFT_KEEP_DAYS). */
var SAKLA_GUN=3;
function padAd(x){var k=x.tur;if(x.p==='video')return k==='carousel'?t('Karusel'):'Video';if(x.p==='blog')return 'Blog';if(x.p==='instagram'&&k==='reels')return 'Reels';return PAD[x.p]||String(x.p||'')}
function kalanGun(s){var x=tarihNesne(s),ms=x.getTime()+SAKLA_GUN*864e5-Date.now();if(isNaN(ms)||ms<=0)return '';var n=Math.ceil(ms/864e5);return n<=1&&ms<36e5*12?t('Bugün silinecek'):n===1?t('Silinmesine 1 gün'):t('Silinmesine {n} gün',{n:n})}

/* ---- yardımcılar ---- */
function $(s,k){return (k||d).querySelector(s)}
function $$(s,k){return Array.prototype.slice.call((k||d).querySelectorAll(s))}
function el(tag,cls,txt,ozn){var e=d.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;if(ozn)Object.keys(ozn).forEach(function(k){e.setAttribute(k,ozn[k])});return e}
function zaman(f,ms){return setTimeout(f,ms)}
function t(s,p){var r=(dil==='en'&&Object.prototype.hasOwnProperty.call(EN,s))?EN[s]:s;if(p)r=r.replace(/\{(\w+)\}/g,function(m,k){return p[k]!=null?String(p[k]):m});return r}
function LOC(){return dil==='en'?'en-GB':'tr-TR'}
function sayi(n){return Number(n).toLocaleString(LOC())}
function tarihNesne(s){
  if(typeof s==='number')return new Date(s<1e12?s*1000:s);
  s=String(s||'');
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return new Date(s+'T12:00:00');
  if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s))return new Date(s.replace(' ','T')+'Z');
  return new Date(s);
}
function tarih(s){try{var x=tarihNesne(s);if(isNaN(x.getTime()))return '';return new Intl.DateTimeFormat(LOC(),{day:'numeric',month:'long',year:'numeric'}).format(x)}catch(e){return ''}}
function yol(k){var y=YOL[k];return y?y[dil==='en'?1:0]:'/'}
function gitYol(u){if(ORNEK&&API&&u.indexOf('#')<0)u+='#ornek';location.assign(u)}
function adresTemizle(){try{history.replaceState(null,'',location.pathname+(ORNEK&&API?'#ornek':''))}catch(e){}}

/* ---- oturum ---- */
function depo(k){try{return k==='l'?window.localStorage:window.sessionStorage}catch(e){return null}}
function tokenAl(){var r=null;['s','l'].some(function(k){try{var s=depo(k),v=s&&s.getItem('smc-oturum');if(v&&TOKEN_RE.test(v)){r=v;return true}}catch(e){}return false});return r}
function tokenSil(){['s','l'].forEach(function(k){try{var s=depo(k);if(s)s.removeItem('smc-oturum')}catch(e){}})}
function tokenYaz(tok,kalici){tokenSil();if(!TOKEN_RE.test(tok||''))return;try{var s=depo(kalici?'l':'s');if(s)s.setItem('smc-oturum',tok)}catch(e){}}
function notBirak(tr,tur,p){try{sessionStorage.setItem('smc-hesap-not',JSON.stringify([tr,tur||'ok',p||null]))}catch(e){}}
function notAl(){try{var v=sessionStorage.getItem('smc-hesap-not');if(!v)return;sessionStorage.removeItem('smc-hesap-not');var a=JSON.parse(v);if(Array.isArray(a)&&typeof a[0]==='string')bildir(a[0],a[1],a[2])}catch(e){}}
/* A3: ?r= yalnız aynı kökenli, beyaz listedeki yol olabilir ("/" ile başlar; "//" ve "/\\" R_RE'den geçemez). */
function donusR(){var r='';try{r=new URLSearchParams(location.search).get('r')||''}catch(e){}return (R_RE.test(r)&&!ACIK_SAYFA.test(r)&&r!==location.pathname.replace(/\.html$/,''))?r:''}
function rEk(p){var r=donusR();return r?p+'?r='+encodeURIComponent(r):p}
function girisYolu(){return yol('giris')+'?r='+encodeURIComponent(location.pathname.replace(/\.html$/,'').replace(/\/index$/,'/'))}
function hedefYol(){return donusR()||yol('gecmis')}
function oturumBitti(){tokenSil();notBirak('Oturumun sona erdi. Yeniden giriş yap.','uyari');location.replace(girisYolu())}

/* ---- istek ---- */
function istek(yolu,yontem,govde){
  var h={'Accept':'application/json'},tok=tokenAl(),o={method:yontem||'GET',headers:h,credentials:'omit',cache:'no-store',mode:'cors'},z=null;
  if(tok)h.Authorization='Bearer '+tok;
  if(govde!==undefined){h['Content-Type']='application/json';o.body=JSON.stringify(govde)}
  if(typeof AbortController==='function'){var ac=new AbortController();o.signal=ac.signal;z=zaman(function(){ac.abort()},12000)}
  return fetch(API+yolu,o).then(function(r){return r.text().then(function(x){var j=null;try{j=x?JSON.parse(x):{}}catch(e){j={}}
    if(!j||typeof j!=='object'||Array.isArray(j))j={veri:j};j._s=r.status;return j})})
  .catch(function(){return {error:'network',_s:0}})
  .then(function(j){if(z)clearTimeout(z);return j});
}
function ulasilir(){return fetch(API+'/',{method:'GET',credentials:'omit',cache:'no-store',mode:'no-cors'}).then(function(){return true},function(){return false})}
/* /auth/me: 200 oturum · 401 açık · 403 origin ya da yanıt okunamayıp kök no-cors ile yanıt veriyorsa kapalı · diğerleri hata */
function yokla(){
  return istek('/auth/me').then(function(j){
    if(j._s===200&&j.user)return {d:'oturum',user:j.user};
    if(j._s===401)return {d:'acik'};
    if((j._s===403&&j.error==='origin')||j._s===404||(j._s===503&&j.error==='not_ready'))return {d:'kapali'};
    if(j._s===0)return ulasilir().then(function(v){return v?{d:'kapali'}:{d:'hata',kod:'network'}});
    return {d:'hata',kod:j.error||String(j._s)};
  });
}
function bolumYok(j){return j._s===404||(j._s===503&&j.error==='not_ready')}

/* ---- ekran ve bildirim ---- */
function ekran(ad,odak){
  $$('[data-ekran]').forEach(function(s){s.hidden=s.getAttribute('data-ekran')!==ad});
  var ic=$('#icerik');if(ic)ic.removeAttribute('aria-busy');
  if(odak){var s=$('[data-ekran="'+ad+'"]'),h=s&&$('h1',s);if(h)h.focus({focusVisible:false})}
}
function hataGoster(kod,odak){$('#hata-kod').textContent=t('Kod: {k}',{k:kod||'network'});ekran('hata',odak)}
function bildir(tr,tur,p){var n=$('#not');if(!n)return;n.className='bildirim'+(tur?' bildirim-'+tur:'');n.textContent='';if(tr)n.appendChild(el('p',null,t(tr,p)))}
function genelHata(j){
  if(j._s===0){bildir('Sunucuya ulaşılamadı. Bağlantını kontrol edip yeniden dene.','hata');return}
  if(j._s===403&&j.error==='origin'){ekran('kapali',true);return}
  if(j._s===401&&KORUMALI&&j.error!=='invalid'){oturumBitti();return}
  if(j._s===429){bildir('Çok fazla deneme. Biraz bekleyip yeniden dene.','hata');return}
  if(bolumYok(j)){bildir('Bu bölüm yakında.','uyari');return}
  bildir('Bir sorun oldu. Biraz sonra yeniden dene. (Kod: {k})','hata',{k:j.error||j._s});
}
function metinDugum(b){var c=b.childNodes;for(var i=0;i<c.length;i++)if(c[i].nodeType===3&&c[i].data.trim())return c[i];var x=d.createTextNode('');b.appendChild(x);return x}
function mesgul(b,tr){var n=metinDugum(b),eski=n.data;b.setAttribute('aria-busy','true');b.setAttribute('aria-disabled','true');n.data=t(tr);return function(){n.data=eski;b.removeAttribute('aria-busy');b.removeAttribute('aria-disabled')}}
function bosMu(b){return b.getAttribute('aria-busy')==='true'||b.getAttribute('aria-disabled')==='true'}
function hataYaz(inp,tr){var h=$('#'+inp.id+'-hata');if(!h)return;if(tr){inp.setAttribute('aria-invalid','true');h.textContent=t(tr)}else{inp.removeAttribute('aria-invalid');h.textContent=''}}
function epostaBak(i){var v=i.value.trim();hataYaz(i,!v?'E-postanı yaz.':(EPOSTA.test(v)&&v.length<=254)?'':'Geçerli bir e-posta yaz, örneğin ad@sirket.com.');return !i.hasAttribute('aria-invalid')}
function ilkHata(f){var x=$('[aria-invalid="true"]',f);if(x)x.focus();return !x}
function btn(cls,tr,p,f){var b=el('button','btn '+cls,t(tr,p),{type:'button'});if(f)b.addEventListener('click',function(){if(!bosMu(b))f(b)});return b}

/* ---- tema, dil, ÖRNEK bağlantıları ---- */
function temaKur(){
  var b=$('#tema');if(!b)return;
  function etkin(){var a=root.getAttribute('data-theme');if(a==='dark'||a==='light')return a;return window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
  function yaz(){var k=etkin()==='dark',m=k?(dil==='en'?'Switch to light theme':'Açık temaya geç'):(dil==='en'?'Switch to dark theme':'Koyu temaya geç');b.removeAttribute('aria-pressed');b.setAttribute('data-tema-etkin',k?'dark':'light');b.setAttribute('aria-label',m);b.setAttribute('title',m)}
  b.addEventListener('click',function(){var v=etkin()==='dark'?'light':'dark';root.setAttribute('data-theme',v);try{localStorage.setItem('smc-tema',v)}catch(e){}yaz()});
  if(window.matchMedia){var mq=matchMedia('(prefers-color-scheme: dark)');if(mq.addEventListener)mq.addEventListener('change',yaz)}
  yaz();
}
function dilKur(){$$('a[hreflang]').forEach(function(a){a.addEventListener('click',function(){try{localStorage.setItem('smc-dil',a.getAttribute('hreflang'))}catch(e){}})})}
function ornekKur(){
  var b=$('.bant');if(b)b.hidden=false;
  if(API)$$('a[href^="/hesap/"],a[href^="/en/hesap/"]').forEach(function(a){var h=a.getAttribute('href');if(h.indexOf('#')<0)a.setAttribute('href',h+'#ornek')});
}

/* ---- ortak form davranışı ---- */
function formOrtak(){
  $$('.goster').forEach(function(b){b.addEventListener('click',function(){var i=$('#'+b.getAttribute('aria-controls')),ac=b.getAttribute('aria-pressed')!=='true';if(!i)return;i.type=ac?'text':'password';b.setAttribute('aria-pressed',ac?'true':'false');b.textContent=t(ac?'Gizle':'Göster');b.setAttribute('aria-label',t(ac?'Şifreyi gizle':'Şifreyi göster'))})});
  $$('.kutu').forEach(function(i){i.addEventListener('input',function(){if(i.getAttribute('aria-invalid')==='true')hataYaz(i,'')})});
}

/* ---- diyaloglar ---- */
var donus=new WeakMap();
function dlgAc(x,tetik){if(!x||x.open)return;donus.set(x,tetik);x.showModal();var c=$('[data-kapat]',x);if(c)c.focus()}
function dlgKur(){$$('dialog').forEach(function(x){
  x.addEventListener('close',function(){var tt=donus.get(x);if(tt&&d.body.contains(tt)&&!tt.closest('[hidden]'))tt.focus()});
  x.addEventListener('click',function(e){if(e.target===x)x.close()});
  $$('[data-kapat]',x).forEach(function(b){b.addEventListener('click',function(){x.close()})});
})}

/* ---- giriş ---- */
function girisHata(acik){$('#giris-hata').hidden=!acik;$('#g-sifre').setAttribute('aria-describedby',acik?'giris-hata g-sifre-hata':'g-sifre-hata')}
function girisKur(){
  var f=$('#f-giris');if(!f)return;
  f.addEventListener('submit',function(e){
    e.preventDefault();var b=$('[type=submit]',f);if(bosMu(b))return;
    var ep=$('#g-eposta'),s=$('#g-sifre');epostaBak(ep);hataYaz(s,s.value?'':'Şifreni yaz.');
    if(!ilkHata(f))return;girisHata(false);bildir('');
    var bitir=mesgul(b,'Giriş yapılıyor…');
    if(ORNEK){zaman(function(){bitir();gitYol(hedefYol())},600);return}
    istek('/auth/login','POST',{email:ep.value.trim(),password:s.value}).then(function(j){
      bitir();
      if(j._s===200&&j.token){tokenYaz(j.token,$('#g-hatirla').checked);location.assign(hedefYol());return}
      if(j._s===401){girisHata(true);s.value='';s.focus();return}
      if(j._s===429){bildir('Çok fazla hatalı deneme. 15 dakika bekleyip yeniden dene.','hata');return}
      if(j._s===400&&j.error==='email'){hataYaz(ep,'Geçerli bir e-posta yaz, örneğin ad@sirket.com.');ep.focus();return}
      if(j._s===400){hataYaz(s,'Şifreni yaz.');s.focus();return}
      if(bolumYok(j)){uyelikKapali();return}
      genelHata(j);
    });
  });
}

/* ---- kayıt ---- */
/* ---- üyelik durumu (A11-2): data-uyelik="bekle|acik|kapali" öğeleri /auth durumuna göre görünür ---- */
function uyelikDurum(s){$$('[data-uyelik]').forEach(function(x){x.hidden=x.getAttribute('data-uyelik').split(' ').indexOf(s)<0})}
/* gönderimde üyelik kapalı (503 not_ready) ya da uç yok (404): açılıştaki gibi 'kapalı' ekranına geç, form yeniden gönderilmesin */
function uyelikKapali(){uyelikDurum('kapali');bildir('');ekran('kapali',true)}

/* ---- Turnstile (kayıt): açık render; jeton tek kullanımlık, her başarısız denemeden sonra sıfırlanır ---- */
var TS=(function(){var m=d.querySelector('meta[name="turnstile-sitekey"]');return ((m&&m.getAttribute('content'))||'').trim()})();
var tsId=null,tsTok='',tsHal='';
function tsHataYaz(tr){var h=$('#k-turnstile-hata');if(h)h.textContent=tr?t(tr):''}
function tsSifirla(){tsTok='';if(tsId!==null&&window.turnstile){try{window.turnstile.reset(tsId)}catch(e){}}}
function tsYuklenemedi(){tsHal='yok';tsTok='';tsHataYaz('Güvenlik doğrulaması yüklenemedi. Sayfayı yenileyip yeniden dene.')}
function tsYukle(){
  var k=$('#k-turnstile');if(!k||!TS||ORNEK||tsHal)return;
  tsHal='yukleniyor';
  window.smcKayitTs=function(){
    try{
      tsId=window.turnstile.render(k,{sitekey:TS,appearance:'always',size:'flexible',language:dil,
        callback:function(v){tsTok=typeof v==='string'?v:'';tsHataYaz('')},
        'expired-callback':function(){tsSifirla()},
        'error-callback':function(){tsTok='';tsHataYaz('Güvenlik doğrulaması tamamlanamadı. Biraz bekleyip yeniden dene.');return true}});
      tsHal='hazir';
    }catch(e){tsYuklenemedi()}
  };
  var s=d.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=smcKayitTs';s.async=true;s.defer=true;
  s.onerror=tsYuklenemedi;d.head.appendChild(s);
}
/* odak: widget çizildiyse kutuya, çizilmediyse (kutu boş ve gizli) hata metnine */
function tsOdak(tr){tsHataYaz(tr);var k=$('#k-turnstile'),h=$('#k-turnstile-hata'),o=(k&&k.firstChild)?k:h;if(!o)return;if(o===h)h.setAttribute('tabindex','-1');o.focus()}

/* ---- kayıt ---- */
function kayitKur(){
  var f=$('#f-kayit');if(!f)return;
  var kv=$('#k-kvkk'),ai=$('#k-ai');
  [kv,ai].forEach(function(c){c.addEventListener('change',function(){if(c.checked)hataYaz(c,'')})});
  f.addEventListener('submit',function(e){
    e.preventDefault();var b=$('[type=submit]',f);if(bosMu(b))return;
    var ad=$('#k-ad'),ep=$('#k-eposta'),s=$('#k-sifre');
    var adv=ad.value.trim();hataYaz(ad,!adv?'Adını yaz.':adv.length>100?'Ad en fazla 100 karakter olabilir.':'');epostaBak(ep);
    hataYaz(s,s.value.length<8?'Şifre en az 8 karakter olmalı.':s.value.length>200?'Şifre en fazla 200 karakter olabilir.':'');
    hataYaz(kv,kv.checked?'':'Devam etmek için KVKK onay kutusunu işaretle.');
    hataYaz(ai,ai.checked?'':'Devam etmek için yapay zekâ onay kutusunu işaretle.');
    if(!ilkHata(f))return;bildir('');
    if(TS&&!ORNEK){
      if(tsHal==='yok'){tsOdak('Güvenlik doğrulaması yüklenemedi. Sayfayı yenileyip yeniden dene.');return}
      if(!tsTok){tsOdak('Güvenlik doğrulaması bitmedi. Birkaç saniye bekleyip yeniden dene.');return}
    }
    var bitir=mesgul(b,'Hesap açılıyor…');
    if(ORNEK){zaman(function(){bitir();notBirak('Hesabın açıldı. Şimdi marka sesini tanıt.','ok');gitYol(rEk(yol('kurulum')))},700);return}
    var ts=tsTok;tsTok='';
    istek('/auth/register','POST',{name:adv,email:ep.value.trim(),password:s.value,role:'brand',consent:true,ai_consent:true,ts:ts,hp:$('#k-hp').value,t:Date.now()-T0,lang:dil}).then(function(j){
      bitir();
      if(j._s===200&&j.token){tokenYaz(j.token,false);notBirak('Hesabın açıldı. Şimdi marka sesini tanıt.','ok');location.assign(rEk(yol('kurulum')));return}
      tsSifirla();
      if(j._s===409){
        hataYaz(ep,'Bu e-postayla bir hesap var. Giriş yap ya da şifreni sıfırla.');
        bildir('Bu e-posta zaten kayıtlı.','uyari');var n=$('#not p');if(n){n.appendChild(d.createTextNode(' '));n.appendChild(el('a','bag',t('Giriş yap'),{href:rEk(yol('giris'))}))}
        ep.focus();return;
      }
      if(j._s===400){
        if(j.error==='name'){hataYaz(ad,'Adını yaz.');ad.focus();return}
        if(j.error==='email'){hataYaz(ep,'Geçerli bir e-posta yaz, örneğin ad@sirket.com.');ep.focus();return}
        if(j.error==='password'){hataYaz(s,'Şifre en az 8 karakter olmalı.');s.focus();return}
        if(j.error==='consent'){kv.checked=false;hataYaz(kv,'Devam etmek için KVKK onay kutusunu işaretle.');kv.focus();return}
        if(j.error==='ai_consent'){ai.checked=false;hataYaz(ai,'Devam etmek için yapay zekâ onay kutusunu işaretle.');ai.focus();return}
        bildir('Kayıt tamamlanamadı. Sayfayı yenileyip yeniden dene.','hata');return;
      }
      if(j._s===429){bildir('Çok fazla deneme yapıldı. Biraz sonra yeniden dene.','hata');return}
      if(j._s===403&&j.error==='bot'){bildir('Güvenlik doğrulaması başarısız oldu. Doğrulamayı yeniden tamamlayıp tekrar dene.','hata');tsOdak('');return}
      if(bolumYok(j)){uyelikKapali();return}
      genelHata(j);
    });
  });
}

/* ---- şifre sıfırlama ---- */
function sifreKur(){
  var f=$('#f-sifre');if(!f)return;
  var i=$('#s-eposta');
  function gonder(){return ORNEK?new Promise(function(ok){zaman(function(){ok({_s:200})},600)}):istek('/auth/forgot','POST',{email:i.value.trim(),lang:dil})}
  function sonuc(j){
    if(j._s===200)return true;
    if(j._s===503&&j.error==='mail'){bildir('Şu an e-posta gönderemiyoruz. Biraz sonra yeniden dene.','hata');return false}
    if(j._s===400){hataYaz(i,'Geçerli bir e-posta yaz, örneğin ad@sirket.com.');f.hidden=false;$('#sifre-tamam').hidden=true;i.focus();return false}
    genelHata(j);return false;
  }
  f.addEventListener('submit',function(e){
    e.preventDefault();var b=$('[type=submit]',f);if(bosMu(b))return;
    if(!epostaBak(i)){i.focus();return}
    bildir('');var bitir=mesgul(b,'Gönderiliyor…');
    gonder().then(function(j){bitir();if(!sonuc(j))return;
      f.hidden=true;$('#sifre-adres').textContent=i.value.trim();$('#sifre-tamam').hidden=false;$('#h-sifre-tamam').focus()});
  });
  $('#sifre-tekrar').addEventListener('click',function(){var b=this;if(bosMu(b))return;var bitir=mesgul(b,'Gönderiliyor…');
    gonder().then(function(j){bitir();if(sonuc(j))bildir('Bağlantı yeniden gönderildi.','ok')})});
}

/* ---- yeni şifre (#t=<bilet>) ---- */
function yeniKur(){
  var f=$('#f-sifre-yeni');if(!f)return;
  var bilet='',m=/(?:^|&)t=([A-Za-z0-9_-]{20,128})(?:&|$)/.exec(location.hash.slice(1));
  if(m){bilet=m[1];adresTemizle()}
  function gecersiz(){f.hidden=true;var h=$('#yenile-hata');h.hidden=false}
  if(!bilet&&!ORNEK)gecersiz();
  f.addEventListener('submit',function(e){
    e.preventDefault();var b=$('[type=submit]',f);if(bosMu(b))return;
    var a=$('#y-sifre'),c=$('#y-sifre2');
    hataYaz(a,a.value.length<8?'Şifre en az 8 karakter olmalı.':a.value.length>200?'Şifre en fazla 200 karakter olabilir.':'');
    hataYaz(c,c.value&&c.value===a.value?'':'Şifreler aynı değil.');
    if(!ilkHata(f))return;bildir('');
    var bitir=mesgul(b,'Kaydediliyor…');
    if(ORNEK){zaman(function(){bitir();notBirak('Şifren yenilendi. Yeni şifrenle giriş yap.','ok');gitYol(yol('giris'))},600);return}
    istek('/auth/reset','POST',{token:bilet,password:a.value}).then(function(j){
      bitir();
      if(j._s===200&&j.token){tokenYaz(j.token,false);notBirak('Şifren yenilendi.','ok');location.assign(yol('gecmis'));return}
      if(j._s===200){notBirak('Şifren yenilendi. Yeni şifrenle giriş yap.','ok');location.assign(yol('giris'));return}
      if(j.error==='reset_invalid'){gecersiz();$('#yenile-hata a').focus();return}
      if(j._s===400&&j.error==='password'){hataYaz(a,'Şifre en az 8 karakter olmalı.');a.focus();return}
      genelHata(j);
    });
  });
}

/* ---- oturumlu kabuk ---- */
var KULLANICI=null;
function oturumKur(u){
  KULLANICI=u||{};
  $$('[data-oturum]').forEach(function(x){x.hidden=false});
  $$('.alt-kim .kullanici').forEach(function(x){x.textContent=KULLANICI.email||KULLANICI.name||''});
  /* üst çubuk avatarı: adın/e-postanın ilk harfi (stüdyo ile aynı) */
  var av=$('#hesap-dugme .st-av'),ad=String(KULLANICI.name||KULLANICI.email||'').trim(),ilk=ad?Array.from(ad)[0].toLocaleUpperCase(dil==='en'?'en':'tr'):'';
  if(av&&ilk){av.textContent=ilk;av.classList.add('st-av-harf')}
  var a=$('#a-ad'),e=$('#a-eposta');if(a)a.textContent=KULLANICI.name||'';if(e)e.textContent=KULLANICI.email||'';
  /* A13: yalnız /auth/me admin:true ise menüye Yönetim bağlantısı (sayfa TR; EN menüde "Admin") */
  var m=$('#hesap-menu'),hr=m&&$('hr',m);
  if(KULLANICI.admin===true&&m&&!$('#hesap-admin')){var y=el('a',null,t('Yönetim'),{href:'/hesap/admin',id:'hesap-admin'});if(SAYFA==='admin')y.setAttribute('aria-current','page');m.insertBefore(y,hr||null)}
  /* ray: Hesap grubuna Yönetim (admin.html kendi bağlantısını taşır) */
  var gs=$$('.st-rail .st-grup'),g=gs[gs.length-1];
  if(KULLANICI.admin===true&&g&&!$('.st-link[href="/hesap/admin"]',g)){var ra=el('a','st-link',null,{href:'/hesap/admin'});var sp=el('span','st-link-ad',t('Yönetim'));ra.innerHTML='<svg class="ikon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/></svg>';ra.appendChild(sp);g.appendChild(ra)}
  planRozet();
  planKutu();
}
/* ray altı plan kutusu (ust-hesap.js ile aynı): teklif kartı yerine plan adı + durum + Planı yükselt; Enterprise'da düğme yok */
function planKutu(){
  var k=$('.st-rail .st-teklif-kart'),u=KULLANICI,p=u&&u.plan,en=dil==='en';
  if(!k||!p||typeof p!=='string')return;
  var b=el('b',null,(PLAN_AD[p]||p)+' plan'),dur;
  if(p==='demo'){
    if(u.trial_ended===true)dur=en?'Trial ended':'Deneme süresi bitti';
    else{var z=Date.parse(u.trial_ends_at||''),n=isNaN(z)?0:Math.max(1,Math.ceil((z-Date.now())/864e5));
      dur=!n?(en?'Trial':'Deneme sürümü'):en?n+(n===1?' trial day left':' trial days left'):n+' gün deneme kaldı'}
  }else dur=en?'Active plan':'Aktif plan';
  while(k.firstChild)k.removeChild(k.firstChild);
  k.appendChild(b);k.appendChild(el('p',null,dur));k.classList.add('st-plan');
  if(p!=='enterprise')k.appendChild(el('a','st-plan-btn',en?'Upgrade plan':'Planı yükselt',{href:en?'/en/pricing':'/fiyatlar'}));
}
/* A15 plan rozeti: /auth/me user.plan (yalnız smc, 0018 varsa); demo'da trial_ends_at (ISO) + trial_ended. Plan yoksa rozet yok.
   Hesap menüsünde e-postanın altında, Ayarlar'da Ad/E-posta dökümünde ayrı satır. Deneme bittiyse üst çubuktaki Teklif al adresi. */
var PLAN_AD={demo:'Demo',basic:'Basic',pro:'Pro',enterprise:'Enterprise'};
function teklifAdres(){var a=$('.st-teklif-ust');return (a&&a.getAttribute('href'))||(dil==='en'?'https://socialmediacorner.co/en/contact#form':'https://socialmediacorner.co/iletisim#form')}
function planDurum(u){
  var p=u&&u.plan;if(!p||typeof p!=='string')return null;
  if(p!=='demo')return {m:PLAN_AD[p]||p,c:'rozet'};
  if(u.trial_ended===true)return {m:t('Deneme bitti — plan için iletişime geç'),c:'rozet rozet-uyari',bitti:true};
  var b=Date.parse(u.trial_ends_at||''),n=isNaN(b)?0:Math.max(1,Math.ceil((b-Date.now())/864e5));
  return {m:!n?'Demo':n===1?t('Demo · 1 gün kaldı'):t('Demo · {n} gün kaldı',{n:sayi(n)}),c:'rozet rozet-bilgi'};
}
function planRozet(){
  $$('.smc-plan').forEach(function(x){x.parentNode.removeChild(x)});
  var s=planDurum(KULLANICI);if(!s)return;
  function teklif(cls){return el('a',cls,t('Teklif al'),{href:teklifAdres()})}
  var kim=$('#hesap-menu .st-menu-kim');
  if(kim){var w=el('span','smc-plan');w.appendChild(d.createElement('br'));w.appendChild(el('span',s.c,s.m));kim.appendChild(w);
    if(s.bitti)kim.parentNode.insertBefore(teklif('smc-plan'),kim.nextSibling)}
  var e=$('#a-eposta'),sat=e&&e.parentNode;
  if(sat&&sat.parentNode){var r=el('div','smc-plan'),dd=el('dd');r.appendChild(el('dt',null,'Plan'));dd.appendChild(el('span',s.c,s.m));
    if(s.bitti){dd.appendChild(d.createTextNode(' '));dd.appendChild(teklif('bag'))}
    r.appendChild(dd);sat.parentNode.insertBefore(r,sat.nextSibling)}
}
function cikisKur(){$$('#cikis,#cikis-2').forEach(function(b){b.addEventListener('click',function(){
  if(bosMu(b))return;
  if(ORNEK){notBirak('Çıkış yaptın.','ok');gitYol(yol('giris'));return}
  var bitir=mesgul(b,'Çıkış yapılıyor…');
  istek('/auth/logout','POST',{}).then(function(){bitir();tokenSil();notBirak('Çıkış yaptın.','ok');location.assign(yol('giris'))});
})})}

/* ---- veri indirme ---- */
function indir(veri,ad){try{var u=URL.createObjectURL(new Blob([JSON.stringify(veri,null,2)],{type:'application/json'})),a=el('a',null,null,{href:u,download:ad});d.body.appendChild(a);a.click();a.remove();zaman(function(){URL.revokeObjectURL(u)},1000);return true}catch(e){return false}}
function indirKur(){$$('[data-indir]').forEach(function(b){b.addEventListener('click',function(){
  if(bosMu(b))return;
  if(ORNEK){
    indir({ornek:true,profil:{ad:KULLANICI&&KULLANICI.name,eposta:KULLANICI&&KULLANICI.email,dil:dil},taslaklar:TASLAK.map(function(x){return {tarih:x.tarih,platform:x.p,konu:x.konu,metin:x.metin}})},'smc-verilerim-ORNEK.json');
    bildir('ÖRNEK: Verilerin JSON dosyası olarak indirildi.','ok');return;
  }
  var bitir=mesgul(b,'Hazırlanıyor…');
  istek('/app/export').then(function(j){
    bitir();
    if(j._s===200){delete j._s;if(indir(j,'smc-verilerim.json'))bildir('Verilerin JSON dosyası olarak indirildi.','ok');else bildir('Dosya indirilemedi. Başka bir tarayıcıda yeniden dene.','hata');return}
    genelHata(j);
  });
})})}

/* ---- kurulum: marka sesi ---- */
var adim=1,kelimeler=[],ilkKurulum=true,TONLAR=[];
function secilenTon(){return TONLAR.filter(function(x){return x.checked}).map(function(x){return x.value})}
function tonAd(k){return t(TON[k]||k)}
function kurulumCiz(){
  $('#k-adim').textContent=t('Adım {n} / 3',{n:adim});
  $$('[data-panel]').forEach(function(p){p.hidden=+p.getAttribute('data-panel')!==adim});
  $$('.adimlar li').forEach(function(li){var n=+li.getAttribute('data-adim');li.classList.toggle('bitti',n<adim);if(n===adim)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
  $('#k-geri').hidden=adim===1;$('#k-devam-yazi').textContent=t(adim<3?'Devam':'Kurulumu bitir');
  tonSay();ornekSay();kelimeCiz();
}
function tonSay(){$('#ton-sayac').textContent=t('{n} / 3',{n:secilenTon().length})}
function ornekSay(){[1,2,3].forEach(function(i){$('#ornek-'+i+'-say').textContent=t('{n} / {m}',{n:sayi($('#ornek-'+i).value.length),m:sayi(2200)})});
  var acik=$$('[data-ornek]').filter(function(x){return !x.hidden}).length;$('#ornek-ekle').hidden=acik>=3}
function kelimeCiz(){
  var u=$('#kelimeler');u.textContent='';
  kelimeler.forEach(function(k,i){var li=el('li','kelime');li.appendChild(el('span',null,k));
    var b=el('button',null,'×',{type:'button','aria-label':t('Kaldır: {k}',{k:k})});
    b.addEventListener('click',function(){kelimeler.splice(i,1);kelimeCiz();$('#kelime').focus()});li.appendChild(b);u.appendChild(li)});
  $('#kelime-say').textContent=t('{n} / 30',{n:kelimeler.length});
  if(!kelimeler.length)u.appendChild(el('li','ipucu',t('Henüz kelime yok.')));
  ozetCiz();
}
function kelimeEkle(){
  var i=$('#kelime'),yeni=i.value.split(',').map(function(x){return x.trim().toLocaleLowerCase('tr')}).filter(Boolean),hata='',kalan=[];
  yeni.forEach(function(k){
    if(/[|\n\r\u0085\u2028\u2029]/.test(k)){hata=hata||'Yasaklı kelimede | işaretini kullanma.';kalan.push(k);return}
    if(k.length>40){hata='Bir kelime en fazla 40 karakter olabilir.';kalan.push(k);return}
    if(kelimeler.indexOf(k)>=0){hata=hata||'Bu kelime zaten listede.';kalan.push(k);return}
    if(kelimeler.length>=30){hata='En fazla 30 kelime ekleyebilirsin.';kalan.push(k);return}
    kelimeler.push(k)});
  hataYaz(i,hata);i.value=kalan.join(', ');kelimeCiz();i.focus();
}
function ozetCiz(){
  var dl=$('#ozet');dl.textContent='';var s=$('#sektor'),tn=secilenTon(),n=[1,2,3].filter(function(i){return $('#ornek-'+i).value.trim()}).length;
  [['Sektör',s.value?s.options[s.selectedIndex].textContent:t('Seçilmedi')],['Ton',tn.length?tn.map(tonAd).join(', '):t('Seçilmedi')],['Örnek gönderi',t('{n} adet',{n:n})],['Yasaklı kelime',t('{n} adet',{n:kelimeler.length})]]
  .forEach(function(r){var w=el('div');w.appendChild(el('dt',null,t(r[0])));w.appendChild(el('dd',null,r[1]));dl.appendChild(w)});
}
function sesDoldur(v){
  v=v||{};var s=$('#sektor');
  if(typeof v.sector==='string'&&$$('option',s).some(function(o){return o.value===v.sector}))s.value=v.sector;
  var tn=Array.isArray(v.tones)?v.tones:[];TONLAR.forEach(function(x){x.checked=tn.indexOf(x.value)>=0&&secilenTon().length<3});
  var or=Array.isArray(v.samples)?v.samples.filter(function(x){return typeof x==='string'&&x.trim()}).slice(0,3):[];
  [1,2,3].forEach(function(i){$('#ornek-'+i).value=(or[i-1]||'').slice(0,2200);$('[data-ornek="'+i+'"]').hidden=i>1&&!or[i-1]});
  kelimeler=(Array.isArray(v.banned)?v.banned:[]).filter(function(x){return typeof x==='string'&&x.trim()}).map(function(x){return x.trim().slice(0,40)}).slice(0,30);
  return !!(v.sector||tn.length||or.length||kelimeler.length);
}
function kurulumKur(){
  var f=$('#f-kurulum');if(!f)return;
  TONLAR=$$('#tonlar input');
  TONLAR.forEach(function(x){x.addEventListener('change',function(){var h=$('#ton-hata');
    if(secilenTon().length>3){x.checked=false;h.textContent=t('En fazla 3 ton seçebilirsin.')}else h.textContent='';tonSay();ozetCiz()})});
  [1,2,3].forEach(function(i){$('#ornek-'+i).addEventListener('input',function(){ornekSay();ozetCiz()})});
  $('#ornek-ekle').addEventListener('click',function(){var g=$$('[data-ornek]').filter(function(x){return x.hidden})[0];if(g){g.hidden=false;$('textarea',g).focus()}ornekSay()});
  $('#kelime-ekle').addEventListener('click',kelimeEkle);
  $('#kelime').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();kelimeEkle()}});
  $('#sektor').addEventListener('change',ozetCiz);
  $('#k-geri').addEventListener('click',function(){if(adim>1){adim--;kurulumCiz();var h=$('#h-panel-'+adim);if(h)h.focus()}});
  f.addEventListener('submit',function(e){
    e.preventDefault();var b=$('#k-devam');if(bosMu(b))return;
    if(adim<3){adim++;kurulumCiz();var h=$('#h-panel-'+adim);if(h)h.focus();return}
    var y=$('#k-devam-yazi'),eski=y.textContent;b.setAttribute('aria-busy','true');y.textContent=t('Kaydediliyor…');
    function bitir(){b.removeAttribute('aria-busy');y.textContent=eski}
    function tamam(){bitir();var tr='Marka sesin kaydedildi. İstediğin zaman Marka sesi sekmesinden değiştirebilirsin.';
      if(ilkKurulum){notBirak(tr,'ok');gitYol(donusR()||yol('baglantilar'));return}bildir(tr,'ok');$('#h-kurulum').focus()}
    if(ORNEK){zaman(tamam,600);return}
    var govde={sector:$('#sektor').value,tones:secilenTon(),samples:[1,2,3].map(function(i){return $('#ornek-'+i).value.trim()}).filter(Boolean),banned:kelimeler.slice()};
    istek('/app/voice','PUT',govde).then(function(j){
      if(j._s===200){tamam();return}
      bitir();
      if(j._s===400){bildir('Marka sesi kaydedilemedi. Alanları kontrol edip yeniden dene.','hata');return}
      if(bolumYok(j)){ekran('yakinda',true);return}
      genelHata(j);
    });
  });
}
function kurulumYukle(){
  if(ORNEK){kurulumCiz();ekran('ana');return}
  istek('/app/voice').then(function(j){
    if(j._s===200){ilkKurulum=!sesDoldur(j.voice||j);kurulumCiz();ekran('ana');return}
    if(bolumYok(j)){ekran('yakinda');return}
    if(j._s===401){oturumBitti();return}
    hataGoster(j.error||String(j._s));
  });
}

/* ---- bağlantılar ---- */
/* Kart: platform ikonu, durum çipi (Bağlı / Bağlı değil / Yakında), neden bağlanır, Pro rozeti + Planlar bağlantısı.
   Uçlar aynı: /app/connections, /app/connect (OAuth başlangıcı), /app/connect/finish, /app/disconnect. */
var ROZET={bagli:['rozet rozet-ok','Bağlı'],yok:['rozet','Bağlı değil'],yenile:['rozet rozet-uyari','Yetki yenilenmeli'],izin:['rozet rozet-uyari','Yakında'],hazir:['rozet rozet-uyari','Yakında'],kapali:['rozet rozet-uyari','Yakında'],taken:['rozet rozet-uyari','Bağlanamadı'],bekliyor:['rozet rozet-bilgi','Bağlanıyor']};
var SVGNS='http://www.w3.org/2000/svg';
/* sade çizgi ikonlar; marka logosu dosyası yok */
var PIKON={linkedin:[['rect',{x:3,y:3,width:18,height:18,rx:3}],['path',{d:'M8 10.5V17M8 7.25v.01M12 17v-6.5M12 13.5a2.5 2.5 0 0 1 5 0V17'}]],
  instagram:[['rect',{x:3,y:3,width:18,height:18,rx:5}],['circle',{cx:12,cy:12,r:4}],['path',{d:'M17.5 6.5v.01'}]]};
function ikonYap(parca){var v=d.createElementNS(SVGNS,'svg');v.setAttribute('class','ikon');v.setAttribute('viewBox','0 0 24 24');v.setAttribute('aria-hidden','true');v.setAttribute('focusable','false');
  parca.forEach(function(x){var e=d.createElementNS(SVGNS,x[0]);Object.keys(x[1]).forEach(function(k){e.setAttribute(k,String(x[1][k]))});v.appendChild(e)});return v}
var bag={},koparP=null;
function bagDurum(p,r,kapali){
  if(!r)return {s:kapali?'kapali':'hazir'};
  var kul=r.handle||r.label||'';
  if(r.status==='connected')return {s:'bagli',kul:kul,tarih:r.connected_at||r.updated_at};
  if(r.status==='error')return {s:'yenile',kul:kul,tarih:r.connected_at||r.updated_at};
  if(r.status==='available')return {s:'yok'};
  if(p==='instagram'&&(r.status==='not_configured'||r.status==='review'||r.status==='no_api'))return {s:'izin'};
  return {s:'hazir'};
}
function bagCiz(){
  var kap=$('#baglar');kap.textContent='';
  ['linkedin','instagram'].forEach(function(p){
    var B=bag[p]||{s:'hazir'},s=B.s,ad=PAD[p],k=el('article','sheet bag-kart'+(s==='taken'?' sheet-hata':''),null,{'aria-labelledby':'bk-'+p,'aria-describedby':'bn-'+p});
    var bas=el('div','bag-bas'),sim=el('span','bag-simge bag-simge-'+p);sim.appendChild(ikonYap(PIKON[p]));bas.appendChild(sim);
    var adK=el('div','bag-ad-k');adK.appendChild(el('h2','bag-ad',ad,{id:'bk-'+p,tabindex:'-1'}));adK.appendChild(el('span','pl-et pl-et-pro','Pro'));bas.appendChild(adK);
    bas.appendChild(el('span',ROZET[s][0],t(ROZET[s][1])));k.appendChild(bas);
    k.appendChild(el('p','bag-neden',t('Planlanan taslaklar bu hesaba otomatik paylaşılır.'),{id:'bn-'+p}));
    var pl=el('p','ince bag-plan',t('Otomatik paylaşım Pro planda.')+' ');pl.appendChild(el('a','bag',t('Planları gör'),{href:dil==='en'?'/en/pricing':'/fiyatlar'}));k.appendChild(pl);
    var ey=el('div','eylemler');
    function kaldirB(){return btn('btn-cizgi btn-kucuk','Bağlantıyı kaldır',null,function(b){koparAc(p,b)})}
    if(s==='bagli'||s==='yenile'){if(B.kul){var kim=el('p','bag-kim-sira');kim.appendChild(el('span','bag-kim kullanici',B.kul));k.appendChild(kim)}
      var tt=tarih(B.tarih);if(tt)k.appendChild(el('p','ince',t('Bağlanma tarihi: {t}',{t:tt})))}
    if(s==='bagli'){var kb=kaldirB();kb.setAttribute('aria-label',t('{p} bağlantısını kaldır',{p:ad}));ey.appendChild(kb)}
    if(s==='yenile'){var u=el('div','bildirim bildirim-uyari');u.appendChild(el('strong',null,t('{p} yetkisinin süresi doldu.',{p:ad})));u.appendChild(el('p',null,t('Yeniden yetkilendirince ölçümler kaldığı yerden sürer. Taslakların etkilenmez.')));k.appendChild(u);
      ey.appendChild(btn('btn-ink btn-kucuk','Yeniden yetkilendir',null,function(b){baglan(p,b)}));var kb2=kaldirB();kb2.setAttribute('aria-label',t('{p} bağlantısını kaldır',{p:ad}));ey.appendChild(kb2)}
    if(s==='yok'||s==='bekliyor'){
      var bb=btn('btn-ink btn-kucuk','Bağla',null,function(b){baglan(p,b)});bb.setAttribute('aria-label',t('{p} hesabını bağla',{p:ad}));
      if(s==='bekliyor'){bb.textContent=t('Yönlendiriliyor…');bb.setAttribute('aria-busy','true');bb.setAttribute('aria-disabled','true')}ey.appendChild(bb)}
    if(s==='izin'||s==='hazir'||s==='kapali'){
      var acik=s==='izin'?'Instagram bağlantısı Meta’nın uygulama incelemesini bekliyor. İnceleme bitince bu düğme açılır.':s==='kapali'?'Yeni bağlantılar şu an kapalı. Açıldığında bu düğme çalışır.':'{p} bağlantısı henüz hazır değil. Hazır olunca bu düğme açılır.';
      var ib=btn('btn-ink btn-kucuk','Yakında');ib.setAttribute('aria-disabled','true');ib.setAttribute('aria-label',t('{p} hesabını bağla',{p:ad})+' — '+t('Yakında'));ib.setAttribute('aria-describedby','izin-'+p);ey.appendChild(ib);
      k.appendChild(ey);k.appendChild(el('p','ince bag-acik',t(acik,{p:ad}),{id:'izin-'+p}));kap.appendChild(k);return}
    if(s==='taken'){var h=el('div','bildirim bildirim-hata');h.appendChild(el('strong',null,t('Bu hesap başka bir Corner hesabına bağlı.')));
      h.appendChild(el('p',null,t('Bu {p} hesabı başka bir Corner sitesindeki (örneğin Brand Corner) ya da başka bir kullanıcıdaki hesaba bağlı. Önce orada bağlantıyı kaldır, sonra burada yeniden dene.',{p:ad})));
      h.appendChild(el('p','kod',t('Kod: taken')));k.appendChild(h);
      var det=el('details','acilir');det.appendChild(el('summary',null,t('Bağlantıyı nasıl kaldırırım?')));var ol=el('ol');
      ['Bağlı olduğu Corner hesabında oturum aç.','Bağlantılar ya da Panel sayfasında bu hesabın bağlantısını kaldır.','Buraya dönüp Yeniden dene düğmesine bas.'].forEach(function(x){ol.appendChild(el('li',null,t(x)))});det.appendChild(ol);
      ey.appendChild(btn('btn-ink btn-kucuk','Yeniden dene',null,function(b){baglan(p,b)}));k.appendChild(ey);k.appendChild(det);kap.appendChild(k);return}
    k.appendChild(ey);kap.appendChild(k);
  });
}
function odakKart(p){var h=$('#bk-'+p);if(h)h.focus()}
function baglan(p){
  var once=bag[p];bag[p]={s:'bekliyor'};bagCiz();var b=$('#bk-'+p).closest('article').querySelector('[aria-busy]');if(b)b.focus();bildir('');
  if(ORNEK){zaman(function(){bag[p]={s:'bagli',kul:p==='linkedin'?t('Örnek Ajans'):'@ornekajans',tarih:new Date().toISOString()};bagCiz();bildir('ÖRNEK: {p} bağlandı.','ok',{p:PAD[p]});odakKart(p)},900);return}
  istek('/app/connect','POST',{platform:p}).then(function(j){
    if(j._s===200&&typeof j.url==='string'){var ok=false;try{ok=new URL(j.url).protocol==='https:'}catch(e){}
      if(ok){location.assign(j.url);return}}
    bag[p]=once;
    if(j.error==='disabled'){bag[p]={s:'kapali'}}
    else if(j.error==='not_configured'||j.error==='no_api'||j.error==='review'){bag[p]=bagDurum(p,{status:j.error})}
    bagCiz();odakKart(p);
    if(j._s===200||j.error==='disabled'||j.error==='not_configured'||j.error==='no_api'||j.error==='review'){bildir('{p} bağlantısı şu an başlatılamadı.','uyari',{p:PAD[p]});return}
    genelHata(j);
  });
}
function koparAc(p,tetik){koparP=p;var ad=PAD[p];$('#dlg-kopar-b').textContent=t('{p} bağlantısı kaldırılsın mı?',{p:ad});
  $('#dlg-kopar-a').textContent=t('Bağlantı ve kayıtlı yetki burada silinir; {p} tarafındaki izni {p} ayarlarından kaldırırsın. Bu hesaba otomatik paylaşım yapılmaz. Geçmiş’teki taslakların silinmez; istediğin an yeniden bağlarsın.',{p:ad});dlgAc($('#dlg-kopar'),tetik)}
function baglarKur(){
  if(!$('#baglar'))return;
  $('#kopar-evet').addEventListener('click',function(){var b=this,p=koparP;if(!p||bosMu(b))return;
    function bitti(){$('#dlg-kopar').close();bag[p]={s:'yok'};bagCiz();bildir('{p} bağlantısı kaldırıldı.','ok',{p:PAD[p]});odakKart(p)}
    if(ORNEK){bitti();return}
    var bitir=mesgul(b,'Kaldırılıyor…');
    istek('/app/disconnect','POST',{platform:p}).then(function(j){bitir();if(j._s===200){bitti();baglarGetir();return}$('#dlg-kopar').close();genelHata(j)});
  });
}
function baglarGetir(){
  return istek('/app/connections').then(function(j){
    if(j._s!==200)return j;
    var satir={};(Array.isArray(j.connections)?j.connections:[]).forEach(function(r){if(r&&PAD[r.platform])satir[r.platform]=r});
    ['linkedin','instagram'].forEach(function(p){bag[p]=bagDurum(p,satir[p],!!j.disabled)});
    bagCiz();return j;
  });
}
function donusOku(){
  var q;try{q=new URLSearchParams(location.search)}catch(e){return null}
  var p=q.get('oauth'),r=q.get('result');if(!p||!PAD[p])return null;
  var m=/(?:^|&)ticket=([A-Za-z0-9_-]{43})(?:&|$)/.exec(location.hash.slice(1));
  adresTemizle();
  return {p:p,r:r,bilet:m?m[1]:''};
}
/* A14: "Web siteniz (blog)" bölümü cms.js içinde (B3: ayrı sayfa /blog-otomatik); ortak yardımcılar buradan verilir. */
function cmsBasla(){if(typeof window.smcCmsBasla==='function')window.smcCmsBasla({istek:istek,bildir:bildir,genelHata:genelHata,mesgul:mesgul,bosMu:bosMu,dlgAc:dlgAc,ORNEK:ORNEK,dil:dil})}
function baglarYukle(){
  if(ORNEK){bag={linkedin:{s:'bagli',kul:t('Örnek Ajans'),tarih:'2026-11-12'},instagram:{s:'izin'}};bagCiz();ekran('ana');cmsBasla();return}
  var don=donusOku();
  var once=Promise.resolve(null);
  if(don&&don.r==='pending'&&don.bilet)once=istek('/app/connect/finish','POST',{ticket:don.bilet});
  once.then(function(f){
    return baglarGetir().then(function(j){
      if(j._s!==200){if(bolumYok(j)){ekran('yakinda');return}if(j._s===401){oturumBitti();return}hataGoster(j.error||String(j._s));return}
      ekran('ana');cmsBasla();
      if(!don)return;
      var ad=PAD[don.p];
      if(don.r==='denied'){bildir('{p} bağlantısını onaylamadın. İstediğin zaman yeniden deneyebilirsin.','uyari',{p:ad});return}
      if(!f){bildir('{p} bağlantısı tamamlanamadı. Yeniden bağlanmayı dene.','uyari',{p:ad});return}
      if(f._s===200){bildir('{p} bağlandı.','ok',{p:ad});odakKart(don.p);return}
      if(f.error==='taken'){bag[don.p]={s:'taken'};bagCiz();odakKart(don.p);return}
      if(f.error==='ticket_owner'){bildir('Bu bağlantı başka bir oturumda başlatıldı. Buradan yeniden bağlanmayı dene.','uyari');return}
      if(f.error==='ticket'){bildir('Bağlantının süresi doldu. Yeniden bağlanmayı dene.','uyari');return}
      if(f._s===502){bildir('{p} şu an yanıt vermedi. Biraz sonra yeniden dene.','hata',{p:ad});return}
      genelHata(f);
    });
  });
}

/* ---- geçmiş ---- */
var TASLAK=[
 {id:8,p:'blog',tur:'blog',tarih:'2026-11-22',ton:'Öğretici',konu:'KOBİ’ler için LinkedIn rehberi',metin:'KOBİ’ler için LinkedIn rehberi\n\n## Profil önce gelir\n\nŞirket sayfası, kurucunun profili kadar güven vermez. İlk adım kurucu profilini düzenlemek.\n\n## Haftada iki gönderi yeter\n\nDüzen, sıklıktan önemlidir. Aynı gün ve saatte paylaşmak takipçiye ritim kazandırır.'},
 {id:7,p:'video',tur:'carousel',tarih:'2026-11-22',ton:'',konu:'Müşteri kaybını azaltmanın 5 yolu',metin:'1. İlk 14 gün\n2. Kurulum görüşmesi\n3. Haftalık kullanım listesi\n4. Tek soruluk iptal anketi\n5. Eksik özelliği önceliklendir'},
 {id:6,p:'linkedin',tarih:'2026-11-21',ton:'Samimi',konu:'İlk 100 müşteriye ulaştık',metin:'Bugün 100. müşterimizi karşıladık.\n\nİki yıl önce üç kişilik bir ekiptik ve ilk satışı yapmak dört ay sürdü. Bu sürede öğrendiğimiz en önemli şey şuydu: müşteri ürünü değil, sorununun çözüldüğünü hissetmeyi satın alıyor.\n\nİlk on müşterimizin yedisi bugün hâlâ bizimle. Rakamdan çok bu oran içimi rahatlatıyor.\n\nYolu birlikte yürüdüğümüz herkese teşekkürler.'},
 {id:5,p:'instagram',tarih:'2026-11-20',ton:'Esprili',konu:'Yeni ofisimize taşındık',metin:'Kutular açıldı, kahve makinesi kuruldu, Wi-Fi şifresini hâlâ kimse bilmiyor.\n\nYeni ofisimizden ilk merhaba! Kadıköy’deyiz; uğrarsanız çay bizden.\n\n#yeniofis #ekip #kadıköy'},
 {id:4,p:'linkedin',tarih:'2026-11-18',ton:'Öğretici',konu:'Müşteri kaybını nasıl yarıya indirdik',metin:'Altı ayda müşteri kaybını %8’den %4’e indirdik. Üç adımda:\n\n1. İlk 14 günü yeniden tasarladık. Kurulum görüşmesini isteğe bağlı değil, varsayılan yaptık.\n2. Kullanmayan hesapları haftalık listeyle izledik ve sorun büyümeden aradık.\n3. İptal nedenini tek soruyla sorduk; cevapların yarısı aynı eksik özelliği gösterdi.\n\nEn büyük ders: kayıp iptal gününde değil, ilk hafta başlıyor.'},
 {id:3,p:'instagram',tarih:'2026-11-15',ton:'Samimi',konu:'Ekipten biri: tasarımcımız Ece',metin:'Ekipten biri serisinde bu hafta Ece var.\n\nSabahları ilk iş eskiz defterini açıyor, öğleden sonra müşteriyle masaya oturuyor. En sevdiği iş: karmaşık bir fikri tek görselle anlatmak.\n\nEce’ye sormak istediğin bir şey var mı? Yorumlara yaz.'},
 {id:2,p:'linkedin',tarih:'2026-11-10',ton:'Net ve kısa',konu:'Uzaktan çalışmada toplantıları azalttık',metin:'Haftalık toplantı saatimizi 9’dan 4’e indirdik.\n\nTek kural koyduk: gündem yoksa toplantı yok. Kararlar yazılı, durum güncellemeleri belge üzerinden.\n\nKazandığımız beş saat ürüne gitti.'},
 {id:1,p:'linkedin',tarih:'2026-11-04',ton:'Veri odaklı',konu:'KOBİ’lerde dijital pazarlama: görüşme notları',metin:'Görüştüğümüz 40 KOBİ’den 31’i sosyal medyayı satış kanalı olarak görüyor, ama yalnız 9’u düzenli ölçüm yapıyor.\n\nEn sık duyduğumuz engel zaman. İkinci sırada ne paylaşacağını bilmemek geliyor.\n\nGörüşme notlarının tamamını önümüzdeki hafta paylaşacağız.'}
];
var liste=[],q='',plat='hepsi',dahaVar=false,silHedef=null,araZ=null;
function taslakCevir(x){var m=x.meta&&typeof x.meta==='object'?x.meta:{};return {id:String(x.id),p:x.platform,tur:typeof m.kind==='string'?m.kind:'',tarih:x.created_at,ton:m.tone||'',konu:String(x.topic||''),metin:String(x.body||'')}}
function suzulmus(){if(!ORNEK)return liste;var qq=q.toLocaleLowerCase(LOC());return liste.filter(function(x){return (plat==='hepsi'||x.p===plat)&&(!qq||(x.konu+'\n'+x.metin).toLocaleLowerCase(LOC()).indexOf(qq)>=0)})}
function gecmisCiz(){
  var f=suzulmus(),suz=!!q||plat!=='hepsi',bos=!suz&&(ORNEK?liste.length===0:f.length===0),kap=$('#kayitlar');kap.textContent='';
  $('#f-suzgec').hidden=bos;$('#gecmis-bos').hidden=!bos;$('.saklama').hidden=bos;
  var say=$('#sonuc-say');
  say.textContent=bos?'':(ORNEK&&f.length!==liste.length)?t('{n} / {m} taslak gösteriliyor',{n:f.length,m:liste.length}):(f.length===1?t('1 taslak'):t('{n} taslak',{n:f.length}));
  $('#bulunamadi').hidden=bos||f.length>0;
  f.forEach(function(x){
    var tid=String(x.id).replace(/[^A-Za-z0-9_-]/g,''),a=el('article','sheet kayit',null,{'aria-labelledby':'kt-'+tid}),u=el('p','kayit-ust');
    u.appendChild(el('span','rozet',padAd(x)));var tt=tarih(x.tarih);if(tt)u.appendChild(el('span',null,tt));
    var kg=ORNEK?'':kalanGun(x.tarih);if(kg)u.appendChild(el('span',null,kg));
    if(x.ton)u.appendChild(el('span',null,t('Ton: {t}',{t:tonAd(x.ton)})));u.appendChild(el('span',null,t('{n} karakter',{n:sayi(x.metin.length)})));a.appendChild(u);
    var konu=x.konu||t('Başlıksız taslak');
    a.appendChild(el('h2','kayit-ad',konu,{id:'kt-'+tid,tabindex:'-1'}));
    var m=el('p','metin kisa',x.metin,{id:'km-'+tid});a.appendChild(m);
    if(ORNEK){a.querySelector('.kayit-ad').setAttribute('lang','tr');m.setAttribute('lang','tr')}
    var tb=btn('btn-metin kayit-ac','Tamamını göster');tb.setAttribute('aria-expanded','false');tb.setAttribute('aria-controls','km-'+tid);
    tb.addEventListener('click',function(){var ac=tb.getAttribute('aria-expanded')!=='true';tb.setAttribute('aria-expanded',ac?'true':'false');m.classList.toggle('kisa',!ac);tb.textContent=t(ac?'Kısalt':'Tamamını göster')});a.appendChild(tb);
    var ey=el('div','eylemler'),durumP=el('p','kart-durum ince',null,{role:'status'});
    var kb=btn('btn-ink btn-kucuk','Kopyala',null,function(){kopyala(x,durumP)});kb.setAttribute('aria-label',t('Kopyala: {k}',{k:konu}));ey.appendChild(kb);
    // Planla: yalnız LinkedIn/Instagram taslağı; kuyruk sayfası ?taslak=<id> (EN ?draft=<id>) ile taslağı forma doldurur
    if(PAD[x.p]&&/^[1-9]\d{0,14}$/.test(String(x.id))){ey.appendChild(el('a','btn btn-cizgi btn-kucuk',t('Planla'),{href:yol('kuyruk')+(dil==='en'?'?draft=':'?taslak=')+x.id+(ORNEK&&MOCKHOST?'#ornek':''),'aria-label':t('Planla: {k}',{k:konu})}))}
    ey.appendChild(durumP);
    var sb=btn('btn-cizgi btn-kucuk','Sil',null,function(b){silAc(x,b)});sb.setAttribute('aria-label',t('Sil: {k}',{k:konu}));ey.appendChild(sb);
    a.appendChild(ey);kap.appendChild(a);
  });
  $('#daha').hidden=bos||f.length===0||(!ORNEK&&!dahaVar);
  kisaOlc();
}
function kisaOlc(){$$('#kayitlar .kayit').forEach(function(a){
  var m=$('.metin',a),tb=$('.kayit-ac',a);if(!m.getClientRects().length||tb.getAttribute('aria-expanded')==='true')return;
  m.classList.add('kisa');var tas=m.scrollHeight>m.clientHeight*1.3;m.classList.toggle('kisa',tas);tb.hidden=!tas})}
function kopyala(x,p){
  $$('#kayitlar .kart-durum').forEach(function(e){if(e!==p)e.textContent=''});
  var ok=function(){p.textContent=t('Kopyalandı.')},no=function(){p.textContent=t('Kopyalanamadı. Metni seçip elle kopyala.')};
  try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(x.metin).then(ok,no);else no()}catch(e){no()}
}
function silAc(x,tetik){silHedef=x;$('#dlg-sil-konu').textContent='“'+(x.konu||t('Başlıksız taslak'))+'”';dlgAc($('#dlg-sil'),tetik)}
function taslakGetir(ekle){
  var s=new URLSearchParams();if(q)s.set('q',q);if(plat!=='hepsi')s.set('platform',plat);
  if(ekle&&liste.length)s.set('before',liste[liste.length-1].id);
  var qs=s.toString();
  return istek('/app/drafts'+(qs?'?'+qs:'')).then(function(j){
    if(j._s!==200)return j;
    var gelen=(Array.isArray(j.drafts)?j.drafts:[]).filter(function(x){return x&&x.id!=null}).map(taslakCevir);
    liste=ekle?liste.concat(gelen):gelen;dahaVar=!!j.next||gelen.length>=50;return j;
  });
}
function gecmisKur(){
  if(!$('#kayitlar'))return;
  window.addEventListener('resize',kisaOlc);
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(kisaOlc);
  $('#sil-evet').addEventListener('click',function(){var b=this,x=silHedef;if(!x||bosMu(b))return;
    function bitti(){$('#dlg-sil').close();liste=liste.filter(function(y){return y!==x});gecmisCiz();bildir('Taslak silindi.','ok');$('#h-gecmis').focus()}
    if(ORNEK){bitti();return}
    var bitir=mesgul(b,'Siliniyor…');
    istek('/app/drafts/'+encodeURIComponent(x.id)+'/delete','POST',{}).then(function(j){bitir();if(j._s===200){bitti();return}$('#dlg-sil').close();genelHata(j)});
  });
  function yenile(){
    if(ORNEK){gecmisCiz();return}
    clearTimeout(araZ);araZ=zaman(function(){taslakGetir(false).then(function(j){if(j._s===200)gecmisCiz();else genelHata(j)})},ORNEK?0:300);
  }
  $('#ara').addEventListener('input',function(){q=this.value.trim().slice(0,100);yenile()});
  $('#f-suzgec').addEventListener('submit',function(e){e.preventDefault()});
  $$('input[name=plat]').forEach(function(r){r.addEventListener('change',function(){plat=r.value;yenile()})});
  $('#temizle').addEventListener('click',function(){q='';plat='hepsi';$('#ara').value='';$('#p-hepsi').checked=true;yenile();$('#ara').focus()});
  $('#daha-btn').addEventListener('click',function(){var b=this;if(bosMu(b))return;var bitir=mesgul(b,'Yükleniyor…');
    function son(tr){b.hidden=true;var n=$('#daha-not');n.textContent=t(tr);n.focus()}
    if(ORNEK){zaman(function(){bitir();son('ÖRNEK: Başka taslak yok.')},500);return}
    taslakGetir(true).then(function(j){bitir();if(j._s!==200){genelHata(j);return}gecmisCiz();if(!dahaVar)son('Başka taslak yok.')});
  });
}
function gecmisYukle(){
  if(ORNEK){liste=TASLAK.map(function(x){return {id:String(x.id),p:x.p,tur:x.tur||'',tarih:x.tarih,ton:x.ton,konu:x.konu,metin:x.metin}});ekran('ana');gecmisCiz();return}
  taslakGetir(false).then(function(j){
    if(j._s===200){ekran('ana');gecmisCiz();return}
    if(bolumYok(j)){ekran('yakinda');return}
    if(j._s===401){oturumBitti();return}
    hataGoster(j.error||String(j._s));
  });
}

/* ---- ayarlar: hesabı sil ---- */
function ayarKur(){
  var f=$('#f-hesap');if(!f)return;
  $('#hesap-sil-ac').addEventListener('click',function(){dlgAc($('#dlg-hesap'),this)});
  f.addEventListener('submit',function(e){
    e.preventDefault();var b=$('[type=submit]',f),s=$('#hs-sifre');if(bosMu(b))return;
    hataYaz(s,s.value?'':'Şifreni yaz.');if(!s.value){s.focus();return}
    var bitir=mesgul(b,'Siliniyor…');
    if(ORNEK){zaman(function(){bitir();notBirak('ÖRNEK: Hesabın silindi. Bağların ve kayıtlı yetkiler de silindi.','ok');gitYol(yol('giris'))},700);return}
    istek('/app/account/delete','POST',{password:s.value}).then(function(j){
      bitir();
      if(j._s===200){tokenSil();notBirak('Hesabın silindi. Bağların ve kayıtlı yetkiler de silindi.','ok');location.assign(yol('giris'));return}
      if(j._s===401&&j.error==='invalid'){hataYaz(s,'Şifre hatalı.');s.focus();return}
      $('#dlg-hesap').close();genelHata(j);
    });
  });
}

/* ---- başlangıç ---- */
function hataTekrarKur(){var b=$('#hata-tekrar');if(b)b.addEventListener('click',function(){if(bosMu(b))return;mesgul(b,'Deneniyor…');location.reload()})}
function yukle(){
  if(SAYFA==='kurulum')kurulumYukle();
  else if(SAYFA==='baglantilar'){if(/[?&]cms(_bilet)?=/.test(location.search)){location.replace(yol('blog-otomatik')+location.search);return}baglarYukle()}
  else if(SAYFA==='gecmis')gecmisYukle();
  else if(SAYFA==='blog-otomatik'){ekran('ana');cmsBasla()}
  else if(SAYFA==='admin'){if(ORNEK||!KULLANICI||KULLANICI.admin!==true||typeof window.smcAdminBasla!=='function'){ekran('yok',true);return}
    window.smcAdminBasla({istek:istek,ekran:ekran,bildir:bildir,genelHata:genelHata,hataGoster:hataGoster,mesgul:mesgul,bosMu:bosMu})}
  else ekran('ana');
}
function korumaliBasla(){
  /* ÖRNEK: demo planı, 10 gün kaldı; adreste #ornek&bitti varsa deneme bitmiş görünür */
  if(ORNEK){var bt=/(^|&)bitti(=|&|$)/.test(location.hash.slice(1));oturumKur({name:'Deniz Yılmaz',email:'deniz@ornekajans.com.tr',plan:'demo',trial_ends_at:new Date(Date.now()+(bt?-1:10)*864e5).toISOString(),trial_ended:bt});yukle();return}
  if(!tokenAl()){location.replace(girisYolu());return}
  yokla().then(function(r){
    if(r.d==='acik'){oturumBitti();return}
    if(r.d==='kapali'){ekran('kapali');return}
    if(r.d==='hata'){hataGoster(r.kod);return}
    oturumKur(r.user);yukle();
  });
}
function acikBasla(){
  if(ORNEK){uyelikDurum('acik');ekran('ana');return}
  var tok=tokenAl();
  yokla().then(function(r){
    if(r.d==='oturum'&&(SAYFA==='giris'||SAYFA==='kayit')){location.replace(hedefYol());return}
    if(r.d==='kapali'){uyelikDurum('kapali');ekran('kapali');return}
    if(r.d==='hata'){hataGoster(r.kod);return}
    if(r.d==='acik'){uyelikDurum('acik');if(tok)tokenSil()}
    ekran('ana');
    if(SAYFA==='kayit')tsYukle();
  });
}
temaKur();dilKur();dlgKur();formOrtak();hataTekrarKur();
if(ORNEK)ornekKur();
girisKur();kayitKur();sifreKur();yeniKur();cikisKur();indirKur();kurulumKur();baglarKur();gecmisKur();ayarKur();
notAl();
// Giriş ↔ kayıt geçişinde ?r= dönüş yolu korunur (stüdyo kapısı kayda ?r= ile yollar).
(function(){var r=donusR();if(!r)return;[yol('giris'),yol('kayit')].forEach(function(p){var l=document.querySelectorAll('a[href="'+p+'"]');for(var i=0;i<l.length;i++)l[i].setAttribute('href',p+'?r='+encodeURIComponent(r))})})();
if(KORUMALI)korumaliBasla();else acikBasla();
})();
