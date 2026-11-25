/* Social Media Corner Stüdyo — Otomatik blog (A14; B3: ayrı sayfa).
   /blog-otomatik ve /en/blog-autopilot sayfalarında yüklenir; smc-hesap.js window.smcCmsBasla(api) çağırır.
   Sıklık: haftada 1/2/3 ya da günde 1 (7); planın üst sınırı limits.per_week_max (yoksa 3).
   Plan kilidi (C2): limits.plan_required doluysa ya da limits.sites 0 ise (demo/basic) sayfa kilitli: bağlanma formu gizli,
   Pro'ya yükselt kutusu; var olan siteler görünür (yalnız Duraklat/Kaldır). last_error "plan_required" = plan nedeniyle duraklatıldı.
   Sağlayıcı adı site.provider'dan (Cloudflare Pages satırı platform "github" + provider "cloudflare").
   Site sınırı (24.11): Pro ve Enterprise tek site (limits.sites; enterprise'a ek site iletişimle). Sınır doluysa platform
   kartları ve form gizlenir, yerine "ek site için bizimle iletişime geç" kutusu (ILETISIM, başlıktaki Teklif al ile aynı adres).
   Yaklaşan yazılar (25.11): yazı yayın saatinden ~24 saat önce hazırlanır ('hazir', publish_at = gönderim anı). Kullanıcı
   önizler (/view), düzenler (/edit), şimdi yayınlar (/now), erteler (/reschedule, en çok 30 gün) ya da atlar (/skip; henüz
   yazılıyorsa hak iade edilir). Açık panel ya da odak bu bölümdeyse yoklama yeniden çizmez (girilenler kaybolmasın).
   Veri yalnız textContent/createElement ile yazılır; innerHTML yok. Satır içi stil yok (CSP style-src 'self'). */
(function(){
'use strict';
var d=document;
var EN=d.documentElement.getAttribute('lang')==='en';
function L(tr,en){return EN?en:tr}
function $(s,k){return (k||d).querySelector(s)}
function el(tag,cls,txt,ozn){var e=d.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;if(ozn)Object.keys(ozn).forEach(function(k){e.setAttribute(k,ozn[k])});return e}
function ekle(ust){for(var i=1;i<arguments.length;i++){var c=arguments[i];if(c)ust.appendChild(c)}return ust}
var sira=0;function uid(on){sira+=1;return 'cms-'+(on||'x')+'-'+sira}
function dz(x){return Array.isArray(x)?x:[]}
function str(x){return x==null?'':String(x)}
function yerel(o,k){return o?str(EN?(o[k+'_en']||o[k+'_tr']):(o[k+'_tr']||o[k+'_en'])):''}
var PLANLAR=EN?'/en/pricing':'/fiyatlar';
var ILETISIM=EN?'https://socialmediacorner.co/en/contact#form':'https://socialmediacorner.co/iletisim#form';
var GUNLER=[[1,'Pzt','Mon','Pazartesi','Monday'],[2,'Sal','Tue','Salı','Tuesday'],[3,'Çar','Wed','Çarşamba','Wednesday'],[4,'Per','Thu','Perşembe','Thursday'],[5,'Cum','Fri','Cuma','Friday'],[6,'Cmt','Sat','Cumartesi','Saturday'],[7,'Paz','Sun','Pazar','Sunday']];
/* DOĞRULANMALI: gün numarası 1=Pazartesi … 7=Pazar (ISO) varsayıldı; çekirdek next_run_at hesabı aynı ölçeği kullanmalı. */
var VARSAYILAN_GUN={1:[2],2:[2,4],3:[1,3,5],7:[1,2,3,4,5,6,7]};
var SIKLIK=[[1,'Haftada 1','1 a week'],[2,'Haftada 2','2 a week'],[3,'Haftada 3','3 a week'],[7,'Günde 1','Daily']];
function siklikOk(n){return n===1||n===2||n===3||n===7}
var UZUNLUK=[['short','Kısa','Short'],['medium','Orta','Medium'],['long','Uzun','Long']];
var TON=[['samimi','Samimi','Friendly'],['profesyonel','Profesyonel','Professional'],['ogretici','Öğretici','Educational'],['cesur','Cesur','Bold']];
var DIL=[['tr','Türkçe','Turkish'],['en','İngilizce','English']];
var SITE_DURUM={aktif:['Etkin','Active','rozet-ok'],duraklatildi:['Duraklatıldı','Paused','rozet-uyari'],hata:['Sorun var','Needs attention','rozet-hata'],kaldirildi:['Kaldırıldı','Removed','rozet-gri']};
var YAZI_DURUM={uretiliyor:['Yazılıyor','Being written','rozet-bilgi'],hazir:['Hazır, gönderilecek','Ready to send','rozet-bilgi'],gonderiliyor:['Gönderiliyor','Sending','rozet-bilgi'],gonderildi:['Sitene gönderildi','Sent to your site','rozet-ok'],yayinlandi:['Yayınlandı','Published','rozet-ok'],basarisiz:['Gönderilemedi','Failed','rozet-hata'],kota:['Kota doldu','Quota reached','rozet-uyari'],iptal:['İptal edildi','Cancelled','rozet-gri']};
var SURUYOR={uretiliyor:1,hazir:1,gonderiliyor:1};
var HATA={
  auth:['Anahtar ya da kullanıcı bilgisi kabul edilmedi. Yeniden kopyalayıp dene.','The key or user details were not accepted. Copy them again and retry.'],
  forbidden:['Bu hesabın yazı oluşturma izni yok. Yazı oluşturabilen bir kullanıcıyla anahtar oluştur.','This account is not allowed to create posts. Create the key with a user who can.'],
  not_found:['Site ya da API adresi bulunamadı. Adresi kontrol et.','The site or API address was not found. Check the address.'],
  no_api:['Bu sitede gerekli API kapalı ya da yok.','The required API is turned off or missing on this site.'],
  plan:['Platformdaki planın API erişimine izin vermiyor.','Your plan on that platform does not allow API access.'],
  header_stripped:['Sunucun Authorization başlığını siliyor. Barındırma ayarlarında bu başlığın geçmesine izin ver.','Your server strips the Authorization header. Allow it through in your hosting settings.'],
  ssrf:['Bu adrese bağlanamıyoruz. Herkese açık bir https adresi gir.','We can’t connect to this address. Enter a public https address.'],
  timeout:['Site zamanında yanıt vermedi. Biraz sonra yeniden dene.','The site did not respond in time. Try again shortly.'],
  bad_input:['Bazı alanlar eksik ya da hatalı. Kontrol edip yeniden dene.','Some fields are missing or invalid. Check them and retry.'],
  rate:['Çok fazla deneme yaptın. Daha sonra yeniden dene.','Too many attempts. Try again later.'],
  unknown_result:['Gönderimin sonucu belli değil; yazı sitende oluşmuş olabilir. Yeniden göndermeden önce sitende kontrol et.','We couldn’t confirm the result; the post may already exist on your site. Check your site before sending it again.'],
  server:['Sunucuda bir sorun oldu. Biraz sonra yeniden dene.','Something went wrong on our side. Try again shortly.'],
  not_ready:['Bu bölüm yakında açılıyor.','This section opens soon.'],
  network:['Sunucuya ulaşılamadı. Bağlantını kontrol edip yeniden dene.','Couldn’t reach the server. Check your connection and retry.'],
  site_limit:['Planındaki site hakkını kullandın. Ek site için bizimle iletişime geç.','You’ve used your plan’s site allowance. Need more sites? Contact us.'],
  quota:['Bu ayki blog yazısı hakkın bitti. Hakkın gelecek ay yenilenir.','You’ve used this month’s blog posts. Your allowance renews next month.'],
  daily_limit:['Bu site için bugünkü elle yazı hakkını kullandın (günde 1). Yarın yeniden deneyebilirsin; planlı yazılar takvimine göre sürer.','You’ve used today’s on-demand post for this site (1 a day). Try again tomorrow; scheduled posts continue as planned.'],
  site_state:['Bu site etkin değil. Yazı istemek için önce siteyi devam ettir ya da bağlantısını düzelt.','This site isn’t active. Resume it or fix its connection before asking for a post.'],
  trial_ended:['Deneme süren bitti. Otomatik blogu kullanmak için Pro’ya yükselt.','Your trial has ended. Upgrade to Pro to use blog autopilot.'],
  plan_required:['Otomatik blog Pro ve Enterprise planlarda. Kullanmak için Pro’ya yükselt.','Blog autopilot is on the Pro and Enterprise plans. Upgrade to Pro to use it.'],
  plan_frequency:['Bu sıklık planında yok. Günde 1 yazı yalnız Enterprise planda; diğer planlarda haftada en çok 3 yazı seçebilirsin.','This frequency isn’t in your plan. Daily posts are on the Enterprise plan only; other plans allow up to 3 posts a week.']
};
/* sitenin last_error alanı plan_frequency ise: plan düştü, site duraklatıldı */
var PLAN_DUSTU=['Planın bu sıklığa izin vermediği için bu site duraklatıldı. Ayarlardan haftada en çok {max} yazı seçip devam ettir ya da planını yükselt.','This site was paused because your plan doesn’t allow this frequency. Pick up to {max} posts a week in the settings and resume, or upgrade your plan.'];
function siklikMax(){var m=veri&&veri.limits?+veri.limits.per_week_max:0;return siklikOk(m)?m:3}
function planDustuMetni(){return L(PLAN_DUSTU[0],PLAN_DUSTU[1]).replace('{max}',String(siklikMax()))}
/* kilitteyken sitenin last_error alanı plan_required ise: plan nedeniyle duraklatıldı */
var PLAN_KILIT_SITE=['Otomatik blog Pro ve Enterprise planlarda olduğu için bu site duraklatıldı. Yeniden yazı göndermek için Pro’ya yükselt, sonra devam ettir.','This site was paused because blog autopilot is on the Pro and Enterprise plans. Upgrade to Pro, then resume it to send posts again.'];
var PLAN_KILIT_AKTIF=['Planında otomatik blog yok; bu siteye yeni yazı hazırlanmaz ve site sıradaki yazı zamanında duraklatılır. Devam etmek için Pro’ya yükselt.','Your plan doesn’t include blog autopilot; no new posts are prepared for this site and it will be paused at its next scheduled post. Upgrade to Pro to keep it running.'];
/* kilitte plan nedeniyle olmayan (elle duraklatılmış ya da hatalı) site için kısa not */
var PLAN_KILIT_NOT=['Planında otomatik blog yok; bu siteye yazı göndermek için Pro’ya yükselt.','Your plan doesn’t include blog autopilot; upgrade to Pro to send posts to this site.'];
/* plan nedeniyle duraklatılmış site, plan artık otomatik blogu içeriyorsa */
var PLAN_ACILDI_SITE=['Planın artık otomatik blogu içeriyor. Yeniden yazı göndermek için Devam ettir’e bas.','Your plan now includes blog autopilot. Press Resume to start sending posts again.'];
/* Cloudflare Pages: sunucu notu boş gelirse gösterilen açıklama */
var CF_NOT=['Cloudflare Pages projen bir GitHub deposuna bağlı olmalı (Git entegrasyonu). Yazıyı bu depoya commit olarak ekleriz; Pages her commit’te siteni kendisi derleyip yayınlar. Aşağıya deponun GitHub bilgilerini gir.\nDirect Upload (wrangler ya da sürükle-bırak) ile kurulan projeler desteklenmiyor: bu projelerde değiştirebileceğimiz bir depo yok, her yayında sitenin tamamı yeniden yüklenir ve tek yazı eklenemez. Projeni Git’e bağlayıp yeniden dene.\nGitLab’a bağlı Pages projeleri şimdilik desteklenmiyor.','Your Cloudflare Pages project must be connected to a GitHub repository (Git integration). We add each post to that repo as a commit, and Pages builds and deploys your site on every commit. Enter the repo’s GitHub details below.\nDirect Upload projects (wrangler or drag-and-drop) aren’t supported: there is no repo we can change, and every deploy re-uploads the whole site, so a single post can’t be added. Connect the project to Git and try again.\nGitLab-connected Pages projects aren’t supported yet.'];
function kilitli(){return !!(veri&&veri.limits&&veri.limits.kilit)}
function sitePlat(s){return platAd(s.provider||s.platform)}

var api=null,ORNEK=false,kok=null,veri=null,hataYardim={},akis=null,yoklaSay=0,yoklaZ=null,bekleyenRid={},kaldirHedef=null,basladi=false;
/* kart bildirimleri site id'sine göre saklanır; kart yeniden çizilince (yoklama, durum yenileme) not kaybolmaz. NOT_OMUR sonra düşer. */
var kartNot={},NOT_OMUR=10*60000,tazeP=null,tazeIdler={};
/* GET /app/cms anlık görüntüsü eskimesin: surum durum değiştiren her yanıt yerelde işlenince artar (siteKoy/yaziKoy);
   getNo her GET'e sıra verir, sonGet en son uygulanan GET. Yanıt beklerken surum değiştiyse ya da daha sonra başlamış bir GET
   zaten uygulandıysa bu yanıt veriyi ezmez (duraklat/aç, "Şimdi bir yazı yaz" sonucu eski görüntüyle kaybolmaz). */
var surum=0,getNo=0,sonGet=0;
function anlik(){return {no:++getNo,s:surum}}
function guncelMi(a){return a.s===surum&&a.no>sonGet}
/* "Şimdi bir yazı yaz" bu hatalarla dönerse site durumu sunucudan yeniden okunur ve kart yeniden çizilir */
var TAZELE_HATA={site_state:1,trial_ended:1,quota:1,daily_limit:1,plan_required:1,not_found:1};
var SITE_YOK=['Bu site artık bağlı değil; liste yenilendi.','This site is no longer connected; the list has been refreshed.'];

/* ---- yardımcılar ---- */
function hataMetni(kod){
  kod=str(kod);var h=hataYardim[kod];
  if(h&&typeof h==='object'){var m=str(EN?(h.en||h.tr):(h.tr||h.en));if(m)return m}
  var b=HATA[kod];if(b)return L(b[0],b[1]);
  return L('Bir sorun oldu. Biraz sonra yeniden dene.','Something went wrong. Try again shortly.')+(kod?' ('+L('Kod','Code')+': '+kod+')':'');
}
function nedenMetni(r){
  r=str(r);if(!r)return L('Yakında açılıyor.','Opening soon.');
  if(/^[a-z_]+$/.test(r))return (hataYardim[r]||HATA[r])?hataMetni(r):L('Yakında açılıyor.','Opening soon.');
  return r;
}
function zamanCoz(v){
  if(v==null||v==='')return null;
  if(typeof v==='number'){var n=new Date(v<1e12?v*1000:v);return isNaN(n)?null:n}
  var s=String(v).trim(),m=/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if(m)return new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0)));
  var t=new Date(s);return isNaN(t)?null:t;
}
var BICIM=null;
function ist(v){var t=zamanCoz(v);if(!t)return '';try{if(!BICIM)BICIM=new Intl.DateTimeFormat(EN?'en-GB':'tr-TR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Istanbul'});return BICIM.format(t)}catch(e){return t.toISOString().slice(0,16).replace('T',' ')}}
function iki(n){return (n<10?'0':'')+n}
function guvenliUrl(u){u=str(u);if(!/^https?:\/\//i.test(u))return '';try{var x=new URL(u);return (x.protocol==='https:'||x.protocol==='http:')?x.href:''}catch(e){return ''}}
function disBag(u,txt){var a=el('a','bag',txt||u,{href:u,rel:'noopener noreferrer',target:'_blank'});return a}
function gunDizi(v){
  if(typeof v==='string'){var s=v.trim();if(s.charAt(0)==='['){try{v=JSON.parse(s)}catch(e){v=[]}}else v=s?s.split(/[\s,]+/):[]}
  return dz(v).map(Number).filter(function(n){return n>=1&&n<=7&&Math.floor(n)===n}).filter(function(n,i,a){return a.indexOf(n)===i}).sort();
}
function konuDizi(v){
  if(typeof v==='string'){var s=v.trim();if(s.charAt(0)==='['){try{v=JSON.parse(s)}catch(e){v=s.split('\n')}}else v=s.split('\n')}
  return dz(v).map(function(x){return str(x).trim()}).filter(Boolean);
}
function saglayici(id){var p=veri&&veri.providers;for(var i=0;p&&i<p.length;i++)if(p[i].id===id)return p[i];return null}
function platAd(id){var p=saglayici(id);return p?str(p.name):str(id)}
function etiketBul(liste,id){for(var i=0;i<liste.length;i++)if(liste[i][0]===id)return L(liste[i][1],liste[i][2]);return str(id)}

/* ---- istek ---- */
function cagir(yol,yontem,govde){
  if(ORNEK)return ornekIstek(yol,yontem||'GET',govde);
  return api.istek(yol,yontem,govde);
}
function bolumYok(j){return j._s===404||(j._s===503&&j.error==='not_ready')}
function rid(){try{if(window.crypto&&typeof crypto.randomUUID==='function')return crypto.randomUUID()}catch(e){}
  var a=new Uint8Array(16);crypto.getRandomValues(a);a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;var h=Array.prototype.map.call(a,function(b){return (b<16?'0':'')+b.toString(16)}).join('');
  return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)}

/* ---- yerel bildirim ---- */
function not(kutu,metin,tur,bag){
  kutu.className='bildirim'+(tur?' bildirim-'+tur:'');kutu.textContent='';
  if(!metin)return;var p=el('p',null,metin);
  if(bag){p.appendChild(d.createTextNode(' '));p.appendChild(el('a','bag',bag[0],{href:bag[1]}))}
  kutu.appendChild(p);
}
/* hata yanıtı → {k,m,bag}; oturum/köken hatasında genel akışa verilir ve null döner */
function hataBilgi(j){
  var k=j.error||(j._s===0?'network':j._s===429?'rate':j._s>=500?'server':'');
  if(j._s===401||(j._s===403&&j.error==='origin')){api.genelHata(j);return null}
  var bag=k==='site_limit'?[L('İletişime geç','Contact us'),ILETISIM]:(k==='quota'||k==='plan_required'||k==='plan_frequency'||k==='trial_ended')?[L('Planları gör','See plans'),PLANLAR]:null;
  var m=hataMetni(k||String(j._s));
  if(k==='plan_frequency'&&siklikOk(+j.max)&&+j.max<7)m=(EN?'Your plan allows up to '+j.max+' post'+(+j.max>1?'s':'')+' a week. Daily posts are on the Enterprise plan.':'Planın haftada en çok '+j.max+' yazıya izin veriyor. Günde 1 yazı Enterprise planda.');
  return {k:k,m:m,bag:bag};
}
function hataNot(kutu,j){var h=hataBilgi(j);if(h)not(kutu,h.m,'hata',h.bag)}
/* kart bildirimi: saklanır (siteKart yeniden çizerken geri yazar); kart ya da bildirim alanı yoksa (kaldırılmış site) sayfa notuna */
function kartBul(id){return K.siteler?K.siteler.querySelector('[data-site="'+String(id).replace(/"/g,'')+'"]'):null}
function kartNotu(id,m,tur,bag){
  id=String(id);
  if(m)kartNot[id]={m:m,tur:tur||'',bag:bag||null,t:Date.now()};else delete kartNot[id];
  var k=kartBul(id);
  if(k&&k._not)not(k._not,m,tur,bag);else if(m&&K.not)not(K.not,m,tur,bag);
}
function kartHata(id,j){var h=hataBilgi(j);if(h)kartNotu(id,h.m,'hata',h.bag)}

/* ---- veri ---- */
function normal(j){
  var lim=j.limits||{},kota=j.quota||{};
  return {
    providers:dz(j.providers).filter(function(p){return p&&p.id}),
    unsupported:dz(j.unsupported).filter(function(p){return p&&p.id}),
    sites:dz(j.sites).filter(function(s){return s&&s.id!=null}),
    posts:dz(j.posts).filter(function(p){return p&&p.id!=null}),
    limits:{sites:+lim.sites||0,used:+lim.used||0,per_week_max:siklikOk(+lim.per_week_max)?+lim.per_week_max:3,
      kilit:!!lim.plan_required||(lim.sites!=null&&lim.sites!==''&&+lim.sites===0)},
    quota:{lb_used:+kota.lb_used||0,lb_limit:+kota.lb_limit||0}
  };
}
function siteBul(id){for(var i=0;i<veri.sites.length;i++)if(String(veri.sites[i].id)===String(id))return veri.sites[i];return null}
function siteKoy(s){if(!s||s.id==null)return;surum++;for(var i=0;i<veri.sites.length;i++)if(String(veri.sites[i].id)===String(s.id)){veri.sites[i]=s;return}veri.sites.unshift(s)}
function yaziKoy(p){if(!p||p.id==null)return;surum++;for(var i=0;i<veri.posts.length;i++)if(String(veri.posts[i].id)===String(p.id)){veri.posts[i]=p;return}veri.posts.unshift(p)}
function kullanilan(){return veri.sites.filter(function(s){return s.state!=='kaldirildi'}).length}
function dolu(){var lim=veri.limits;return lim.sites>0&&(lim.used||kullanilan())>=lim.sites}
function siteSayisi(n){return EN?n+' site'+(n>1?'s':''):n+' site'}

/* ---- başlangıç ---- */
window.smcCmsBasla=function(a){
  if(basladi)return;basladi=true;api=a||{};ORNEK=!!api.ORNEK;
  kok=$('#cms');if(!kok)return;kok.hidden=false;
  var b=biletBitir();donusNotu();kaldirKur();
  if(b)b.then(function(){yukle(false)});else yukle(false);
};
/* OAuth dönüşü: ?cms_bilet=<bilet> → oturumla POST /app/cmsoauth/finish (site ancak akışı başlatan kullanıcının oturumunda bağlanır) */
function biletBitir(){
  var q;try{q=new URLSearchParams(location.search)}catch(e){return null}
  var b=q.get('cms_bilet');if(!b)return null;
  q.delete('cms_bilet');var s=q.toString();
  try{history.replaceState(history.state,'',location.pathname+(s?'?'+s:'')+location.hash)}catch(e){}
  var g=$('#cms-govde');if(g){g.textContent='';g.appendChild(el('p','ince',L('Site bağlantısı tamamlanıyor…','Finishing the site connection…'),{role:'status'}))}
  function son(j){
    j=j||{_s:0};
    if(j._s===200){api.bildir(L('Siten bağlandı. İlk yazı planladığın gün ve saatte hazırlanır.','Your site is connected. The first post is prepared on the day and time you picked.'),'ok');return}
    if(j._s===401||(j._s===403&&j.error==='origin')){api.genelHata(j);return}
    if(j.error==='forbidden'){api.bildir(L('Bağlantı onayı geçersiz ya da süresi dolmuş. Panelden yeniden bağlanmayı dene.','The connection approval is invalid or has expired. Try connecting again from the panel.'),'uyari');return}
    api.bildir(hataMetni(j.error||(j._s===0?'network':j._s===429?'rate':'server')),'uyari');
  }
  return Promise.resolve(cagir('/app/cmsoauth/finish','POST',{ticket:b})).then(son,function(){son({_s:0})});
}
function donusNotu(){
  var q;try{q=new URLSearchParams(location.search)}catch(e){return}
  var v=q.get('cms');if(!v)return;
  if(v==='ok')api.bildir(L('Siten bağlandı. İlk yazı planladığın gün ve saatte hazırlanır.','Your site is connected. The first post is prepared on the day and time you picked.'),'ok');
  else api.bildir(L('Site bağlantısı tamamlanamadı. Yeniden bağlanmayı dene.','The site connection couldn’t be completed. Try connecting again.'),'uyari');
  q.delete('cms');var s=q.toString();
  try{history.replaceState(history.state,'',location.pathname+(s?'?'+s:'')+location.hash)}catch(e){}
}
function yukle(sessiz){
  var g=$('#cms-govde');if(!g)return;
  if(!sessiz){g.textContent='';g.appendChild(el('p','ince',L('Yükleniyor…','Loading…'),{role:'status'}))}
  var a=anlik();
  return cagir('/app/cms','GET').then(function(j){
    if(j._s===200&&sessiz&&veri&&!guncelMi(a)){yoklaKur();return}
    if(j._s===200){sonGet=a.no;hataYardim=(j.error_help&&typeof j.error_help==='object')?j.error_help:{};veri=normal(j);if(sessiz)yenile();else ciz();yoklaKur();return}
    if(sessiz)return;
    g.textContent='';
    if(bolumYok(j)){var b=el('div','bildirim cms-yakinda');ekle(b,el('p',null,L('Web sitene otomatik blog yazısı gönderme yakında açılıyor.','Automatic blog posts to your website open soon.')));g.appendChild(b);return}
    if(j._s===401||(j._s===403&&j.error==='origin')){api.genelHata(j);return}
    var h=el('div','bildirim bildirim-hata',null,{role:'alert'});
    ekle(h,el('p',null,hataMetni(j.error||(j._s===0?'network':'server'))));
    var t=el('button','btn btn-cizgi btn-kucuk',L('Yeniden dene','Try again'),{type:'button'});
    t.addEventListener('click',function(){yukle(false)});h.appendChild(t);g.appendChild(h);
  });
}
function yoklaKur(){
  if(yoklaZ){clearTimeout(yoklaZ);yoklaZ=null}
  var var_=veri.posts.some(function(p){return SURUYOR[p.state]});
  if(!var_||yoklaSay>=10)return;
  yoklaZ=setTimeout(function(){yoklaZ=null;yoklaSay+=1;yukle(true)},30000);
}
function yoklaBastan(){yoklaSay=0;yoklaKur()}
/* Durumu sunucudan yeniden oku (GET /app/cms, yukle ile aynı uç) ve istenen site kartlarını yeniden çiz.
   Aynı anda tek istek: sürerken gelen çağrılar aynı sözü alır, kartları da istek bitince çizilir. Plan kilidi
   değiştiyse sayfa baştan çizilir. Kart içindeki odak (tıklanan düğme) yeni kartta aynı düğmeye ya da başlığa taşınır.
   İstek sürerken durum değiştiren bir işlem (duraklat/aç, şimdi yaz, ayar...) yerelde işlendiyse yanıt eski olabilir: en çok
   iki kez yeniden okunur; yine eskiyse yerel veri (daha yeni) korunur, yanıt uygulanmaz. */
function durumTazele(id){
  if(id!=null)tazeIdler[String(id)]=1;
  if(tazeP)return tazeP;
  var deneme=0;
  function oku(){
    var a=anlik();
    return Promise.resolve(cagir('/app/cms','GET')).then(null,function(){return {error:'network',_s:0}}).then(function(j){
      if(j&&j._s===200&&veri&&a.s!==surum&&++deneme<3)return oku();
      return {j:j,a:a};
    });
  }
  tazeP=oku().then(function(r){
    var j=r.j,idler=Object.keys(tazeIdler);tazeP=null;tazeIdler={};
    if(!j||j._s!==200||!veri)return j||{_s:0};
    if(!guncelMi(r.a))return j;
    sonGet=r.a.no;
    var o=odakAl(),eskiKilit=kilitli();
    hataYardim=(j.error_help&&typeof j.error_help==='object')?j.error_help:{};veri=normal(j);
    if(kilitli()!==eskiKilit)ciz();
    else{ozetCiz();if(!kilitli())doluCiz();idler.forEach(kartYenile);siraCiz();yakinTazele();if(!icinde(K.yazilar))yazilarCiz()}
    odakVer(o);yoklaKur();
    return j;
  });
  return tazeP;
}
/* açık ayar formu yoksa tüm liste; varsa yalnız bu kart (kendi formu açıksa dokunulmaz, girilenler kaybolmasın) */
function kartYenile(id){
  if(!K.siteler)return;
  var acik=K.siteler.querySelector('.cms-duzen:not([hidden])');
  if(!acik){sitelerCiz();return}
  var eski=kartBul(id);if(!eski||eski.contains(acik))return;
  var s=siteBul(id);
  if(s)K.siteler.replaceChild(siteKart(s),eski);else K.siteler.removeChild(eski);
}
function odakAl(){
  var a=d.activeElement;if(!a||a===d.body||!K.siteler||!K.siteler.contains(a))return null;
  var k=a.closest('.cms-site');return k?{id:k.getAttribute('data-site'),e:a.getAttribute('data-eylem')}:null;
}
function odakVer(o){
  if(!o)return;var a=d.activeElement;if(a&&a!==d.body&&d.contains(a))return;
  var k=kartBul(o.id),x=k&&o.e?k.querySelector('[data-eylem="'+o.e+'"]'):null;
  if(x)x.focus();else if(k){var h=k.querySelector('.bag-ad');if(h)h.focus()}
  else if(K.not&&d.contains(K.not)){K.not.setAttribute('tabindex','-1');K.not.focus()}
}

/* ---- çizim ---- */
var K={};
function ciz(){
  var g=$('#cms-govde');g.textContent='';
  K.ozet=el('div','cms-ozet');
  K.not=el('div','bildirim',null,{role:'status','aria-live':'polite'});
  K.sitelerB=el('h3','cms-h3',L('Bağlı siteler','Connected sites'));
  K.siteler=el('div','cms-siteler');
  K.ekleB=el('h3','cms-h3',L('Site bağla','Connect a site'));
  K.platform=el('div','cms-pl-izgara');
  K.dolu=el('div','bildirim',null,{hidden:''});
  K.form=el('div','cms-form-k');
  K.siraB=el('h3','cms-h3',L('Sıradaki yazılar','Upcoming posts'));
  K.sira=el('div','cms-sira');
  K.yakinB=el('h3','cms-h3',L('Yaklaşan yazılar','Upcoming drafts'));
  K.yakin=el('div','cms-yakin');
  K.yazilarB=el('h3','cms-h3',L('Hazırlanan ve gönderilen yazılar','Prepared and sent posts'));
  K.yazilar=el('div','cms-yazilar');
  if(kilitli()){
    /* plan kilidi: özet, sıradaki, platform kartları ve form eklenmez (ozetCiz/siraCiz bağsız öğelere yazar) */
    akis=null;
    ekle(g,kilitKutu(),K.not,K.sitelerB,K.siteler);
    if(veri.posts.length)ekle(g,K.yazilarB,K.yazilar);
    sitelerCiz();yazilarCiz();
    return;
  }
  ekle(g,K.ozet,K.not,K.sitelerB,K.siteler,K.siraB,K.sira,K.yakinB,K.yakin,K.ekleB,K.dolu,K.platform,K.form,K.yazilarB,K.yazilar);
  ozetCiz();sitelerCiz();platformCiz();doluCiz();yakinCiz();yazilarCiz();
}
function kilitKutu(){
  var k=el('section','sheet cms-plan-kilit',null,{'aria-labelledby':'cms-kilit-b'});
  ekle(k,el('h3','cms-h3',L('Otomatik blog Pro ve Enterprise planlarda','Blog autopilot is on the Pro and Enterprise plans'),{id:'cms-kilit-b'}),
    el('p','ince',L('Web sitene bağlan, blog yazıları planladığın gün ve saatte otomatik hazırlanıp gönderilsin. Pro planda 1 site bağlar, haftada 3 yazıya kadar seçersin; ek site için bizimle iletişime geç.','Connect your website and have blog posts written and sent on the days and times you pick. The Pro plan covers 1 site and up to 3 posts a week; need more sites? Contact us.')),
    ekle(el('div','eylemler'),el('a','btn btn-ink',L('Pro’ya yükselt','Upgrade to Pro'),{href:PLANLAR+'#pl-pro'}),el('a','bag',L('Planları gör','See plans'),{href:PLANLAR})));
  return k;
}
function icinde(k){var a=d.activeElement;return !!(a&&k&&k.contains(a)&&a!==d.body)}
function yenile(){
  ozetCiz();if(!kilitli())doluCiz();
  if(!icinde(K.siteler)&&!K.siteler.querySelector('.cms-duzen:not([hidden])'))sitelerCiz();
  siraCiz();yakinTazele();
  if(!icinde(K.yazilar))yazilarCiz();
}
function ozetCiz(){
  var o=K.ozet;o.textContent='';
  var lim=veri.limits,used=lim.used||kullanilan();
  var s1=el('div','cms-ozet-k');
  ekle(s1,el('span','ince',L('Bağlı site','Connected sites')),el('strong','cms-sayi',used+' / '+lim.sites));
  var q=veri.quota,s2=el('div','cms-ozet-k');
  s2.appendChild(el('span','ince',L('Bu ay kullanılan blog hakkı','Blog credits used this month'),{id:'cms-kota-e'}));
  if(q.lb_limit>0){
    var pr=el('progress','cms-kota',null,{max:String(q.lb_limit),value:String(Math.min(q.lb_used,q.lb_limit)),'aria-labelledby':'cms-kota-e'});
    ekle(s2,pr,el('strong','cms-sayi',q.lb_used+' / '+q.lb_limit));
  }else{
    var p=el('span',null,L('Planında blog yazısı yok. ','Your plan has no blog posts. '));p.appendChild(el('a','bag',L('Planları gör','See plans'),{href:PLANLAR}));s2.appendChild(p);
  }
  ekle(o,s1,s2);
  /* sınır doluysa açıklama K.dolu kutusunda (Site bağla başlığı altında) */
  if(lim.sites>0&&used<lim.sites){
    var u=el('p','ince cms-tam');
    u.textContent=L('Planında '+siteSayisi(lim.sites)+' bağlanabilir. Ek site için ','Your plan includes '+siteSayisi(lim.sites)+'. Need more sites? ');
    u.appendChild(el('a','bag',L('bizimle iletişime geç','Contact us'),{href:ILETISIM}));u.appendChild(d.createTextNode('.'));o.appendChild(u);
  }
}
/* sınır doluysa: platform kartları ve form gizli, yerine iletişim kutusu (K.dolu); bağlı site kaldırılınca kartlar geri gelir */
function doluCiz(){
  var t=dolu();K.dolu.textContent='';K.dolu.hidden=!t;K.platform.hidden=t;
  if(!t)return;
  if(akis)formKapat();
  var lim=veri.limits,p=el('p',null,L('Planındaki '+siteSayisi(lim.sites)+' hakkını kullanıyorsun. Başka bir site bağlamak için bağlı siteyi kaldır ya da ek site için ','Your plan’s site allowance ('+siteSayisi(lim.sites)+') is in use. To connect a different site, remove the connected one; for extra sites, '));
  p.appendChild(el('a','bag',L('bizimle iletişime geç','contact us'),{href:ILETISIM}));p.appendChild(d.createTextNode('.'));
  K.dolu.appendChild(p);
}

/* ---- platform kartları ---- */
function platformCiz(){
  var k=K.platform;k.textContent='';
  veri.providers.forEach(function(p){
    if(p.ready===false){
      var y=el('div','sheet cms-pl cms-pl-kapali');
      ekle(y,ekle(el('div','cms-pl-bas'),el('strong','cms-pl-ad',str(p.name)),el('span','rozet rozet-bilgi',L('Yakında','Soon'))),el('p','ince',nedenMetni(p.reason)));
      k.appendChild(y);return;
    }
    var b=el('button','sheet cms-pl cms-pl-sec',null,{type:'button','aria-pressed':akis&&akis.p.id===p.id?'true':'false','data-pl':p.id});
    ekle(b,el('strong','cms-pl-ad',str(p.name)),el('span','ince',p.auth==='oauth'?L('Hesabınla giriş yaparak bağlan','Connect by signing in'):p.id==='cloudflare'?L('Bağlı GitHub deposuyla bağlan','Connect through its GitHub repo'):L('Anahtarınla bağlan','Connect with your key')));
    b.addEventListener('click',function(){formAc(p)});
    k.appendChild(b);
  });
  veri.unsupported.forEach(function(p){
    var g=el('div','sheet cms-pl cms-pl-gri');
    ekle(g,ekle(el('div','cms-pl-bas'),el('strong','cms-pl-ad',str(p.name)),el('span','rozet rozet-gri',L('Desteklenmiyor','Not supported'))),el('p','ince',yerel(p,'reason')));
    k.appendChild(g);
  });
  if(!veri.providers.length&&!veri.unsupported.length)k.appendChild(el('p','ince',L('Şu an bağlanabilecek platform yok.','No platforms are available right now.')));
}
function platformSecili(){Array.prototype.forEach.call(K.platform.querySelectorAll('[data-pl]'),function(b){b.setAttribute('aria-pressed',akis&&akis.p.id===b.getAttribute('data-pl')?'true':'false')})}

/* ---- alanlar ---- */
function yardimCiz(metin){
  metin=str(metin).trim();if(!metin)return null;
  var dt=el('details','acilir cms-yardim');dt.appendChild(el('summary',null,L('Nereden bulurum?','Where do I find this?')));
  var sat=metin.split(/\n+/).map(function(x){return x.replace(/^\s*(\d+[.)]|[-•*])\s*/,'').trim()}).filter(Boolean);
  if(sat.length>1){var ol=el('ol');sat.forEach(function(s){ol.appendChild(el('li',null,s))});dt.appendChild(ol)}
  else dt.appendChild(el('p','ince',sat[0]||metin));
  return dt;
}
function alanCiz(f){
  var id=uid('a'),k=el('div','alan-k cms-alan'),ad=yerel(f,'label')||str(f.key),g;
  var lb=el('label','etiket',ad,{'for':id});
  if(!f.required)lb.appendChild(el('span','ince',' '+L('(isteğe bağlı)','(optional)')));
  if(f.type==='select'){
    g=el('select','kutu',null,{id:id});
    if(!f.required)g.appendChild(el('option',null,L('Seç (isteğe bağlı)','Choose (optional)'),{value:''}));
    else g.appendChild(el('option',null,L('Seç…','Choose…'),{value:''}));
    dz(f.options).forEach(function(o){g.appendChild(el('option',null,yerel(o,'label')||str(o.id),{value:str(o.id)}))});
    var tek=dz(f.options);if(f.required&&tek.length===1)g.value=str(tek[0].id);
  }else{
    g=el('input','kutu',null,{id:id,name:str(f.key),type:f.type==='secret'?'password':f.type==='url'?'url':'text',spellcheck:'false',autocapitalize:'off'});
    g.setAttribute('autocomplete','off');
    if(f.type==='url')g.setAttribute('inputmode','url');
    if(f.placeholder)g.setAttribute('placeholder',str(f.placeholder));
    g.maxLength=f.type==='secret'?2000:500;
  }
  if(f.required)g.setAttribute('aria-required','true');
  var h=el('p','alan-hata',null,{id:id+'-hata'});g.setAttribute('aria-describedby',h.id);
  ekle(k,lb,g,h,yardimCiz(yerel(f,'help')));
  return {f:f,kok:k,g:g,h:h};
}
function hataYaz(g,h,m){if(m){g.setAttribute('aria-invalid','true');h.textContent=m}else{g.removeAttribute('aria-invalid');h.textContent=''}}
function alanOku(a){
  var v=str(a.g.value);if(a.f.type!=='secret')v=v.trim();
  if(a.f.type==='url'&&v&&!/^[a-z][a-z0-9+.-]*:\/\//i.test(v))v='https://'+v;
  var m='';
  if(a.f.required&&!v.trim())m=L('Bu alanı doldur.','Fill in this field.');
  else if(a.f.type==='url'&&v&&!/^https:\/\//i.test(v))m=L('https:// ile başlayan bir adres gir.','Enter an address starting with https://.');
  else if(a.f.type==='url'&&v){try{new URL(v)}catch(e){m=L('Geçerli bir adres gir.','Enter a valid address.')}}
  hataYaz(a.g,a.h,m);
  if(!m&&a.f.type==='url'&&v&&a.g.value!==v)a.g.value=v;
  return {ok:!m,v:v};
}

/* ---- ayar bloğu (bağlanırken ve düzenlerken) ---- */
function radyoGrup(baslik,ad,liste,deger,cls){
  var fs=el('fieldset','secim-grup'),sg=el('div',cls||'segment');fs.appendChild(el('legend',null,baslik));
  liste.forEach(function(x){var id=uid('r'),sp=el('span','secim'),i=el('input',null,null,{type:'radio',id:id,name:ad,value:String(x[0])});
    if(String(x[0])===String(deger))i.checked=true;ekle(sp,i,el('label',null,L(x[1],x[2]),{'for':id}));sg.appendChild(sp)});
  fs.appendChild(sg);return fs;
}
function radyoDeger(kap,ad){var r=kap.querySelector('input[name="'+ad+'"]:checked');return r?r.value:''}
function ayarBlok(s,onerilenAd){
  s=s||{};var ad=uid('g'),kap=el('div','cms-ayar'),hk;
  var mx=siklikMax(),pw=siklikOk(+s.per_week)?+s.per_week:1,pwIlk=pw;
  if(pw>mx){pw=[3,2,1].filter(function(n){return n<=mx})[0]||1}
  var gunler=pw===pwIlk?gunDizi(s.days):[];if(gunler.length!==pw)gunler=VARSAYILAN_GUN[pw].slice();
  var saat=(s.hour!=null&&s.hour!==''&&+s.hour>=0&&+s.hour<=23)?+s.hour:10;
  var dil=(s.lang==='tr'||s.lang==='en')?s.lang:(EN?'en':'tr');
  var uz=['short','medium','long'].indexOf(s.length)>=0?s.length:'medium';
  var ton=['samimi','profesyonel','ogretici','cesur'].indexOf(s.tone)>=0?s.tone:'samimi';

  var lid=uid('l'),lk=el('div','alan-k'),li=el('input','kutu',null,{id:lid,type:'text',maxlength:'80',autocomplete:'off'});
  li.value=str(s.label||onerilenAd||'');
  var lh=el('p','alan-hata',null,{id:lid+'-hata'});li.setAttribute('aria-describedby',lh.id);
  ekle(lk,el('label','etiket',L('Site adı','Site name'),{'for':lid}),li,el('p','ipucu',L('Yalnız sende görünür; listede siteyi tanıman için.','Only you see this; it helps you spot the site in the list.')),lh);

  var pwG=radyoGrup(L('Ne sıklıkla yazılsın?','How often?'),ad+'-pw',SIKLIK,pw,'segment cms-siklik');
  Array.prototype.forEach.call(pwG.querySelectorAll('input'),function(i){if(+i.value>mx){i.disabled=true;i.parentNode.classList.add('cms-kilitli')}});
  if(mx<7){
    var kid=uid('k'),kl=el('p','ince cms-kilit',null,{id:kid});
    ekle(kl,el('span','rozet rozet-bilgi',L('Enterprise planda','Enterprise plan')),d.createTextNode(L('Günde 1 yazı yalnız Enterprise planda. ','Daily posts are on the Enterprise plan only. ')),el('a','bag',L('Planlar','Plans'),{href:PLANLAR}));
    pwG.appendChild(kl);
    var g7=pwG.querySelector('input[value="7"]');if(g7)g7.setAttribute('aria-describedby',kid);
  }

  var gfs=el('fieldset','secim-grup'),gs=el('div','secim-sira'),gh=el('p','alan-hata',null,{id:uid('gh')});
  gfs.appendChild(el('legend',null,L('Hangi günler?','Which days?')));
  gfs.hidden=pw===7;
  var gunEl=[],gunDokundu=pw===pwIlk&&!!gunDizi(s.days).length&&pw!==7;
  GUNLER.forEach(function(gn){var id=uid('d'),sp=el('span','secim'),i=el('input',null,null,{type:'checkbox',id:id,value:String(gn[0]),'aria-describedby':gh.id});
    i.checked=gunler.indexOf(gn[0])>=0;i.addEventListener('change',function(){gunDokundu=true;gh.textContent=''});
    ekle(sp,i,el('label',null,L(gn[1],gn[2]),{'for':id,title:L(gn[3],gn[4])}));gs.appendChild(sp);gunEl.push(i)});
  ekle(gfs,gs,gh);
  var pwOnce=pw;
  pwG.addEventListener('change',function(){
    var n=+radyoDeger(pwG,ad+'-pw')||1,onceki=pwOnce;pwOnce=n;
    gfs.hidden=n===7;gh.textContent='';
    if(n===7||onceki===7)gunDokundu=false;
    if(gunDokundu)return;
    var v=VARSAYILAN_GUN[n]||VARSAYILAN_GUN[1];gunEl.forEach(function(i){i.checked=v.indexOf(+i.value)>=0});
  });

  var sid=uid('h'),sk=el('div','alan-k'),ss=el('select','kutu cms-saat',null,{id:sid});
  for(var h=0;h<24;h++)ss.appendChild(el('option',null,iki(h)+':00',{value:String(h)}));ss.value=String(saat);
  ekle(sk,el('label','etiket',L('Saat (İstanbul saati)','Time (Istanbul time)'),{'for':sid}),ss);

  var dilG=radyoGrup(L('Yazı dili','Post language'),ad+'-dil',DIL,dil);
  var uzG=radyoGrup(L('Uzunluk','Length'),ad+'-uz',UZUNLUK,uz);
  var tonG=radyoGrup(L('Ton','Tone'),ad+'-ton',TON,ton);

  var bid=uid('b'),bk=el('div','alan-k'),bt=el('textarea','kutu',null,{id:bid,rows:'4',maxlength:'1000'});bt.value=str(s.brief).slice(0,1000);
  var bsay=el('span','sayac',null,{'aria-live':'polite'});function bSay(){bsay.textContent=bt.value.length+' / 1000'}bSay();bt.addEventListener('input',bSay);
  bt.setAttribute('aria-describedby',bid+'-i');
  ekle(bk,ekle(el('label','etiket',L('Siten ve okurun hakkında kısa bilgi','A short note about your site and readers'),{'for':bid}),el('span','ince',' '+L('(isteğe bağlı)','(optional)'))),bt,
    ekle(el('div','alan-alt'),el('span','ipucu',L('Ne sattığın, kime yazdığın, kaçınılacak konular.','What you sell, who you write for, topics to avoid.'),{id:bid+'-i'}),bsay));

  var tid=uid('t'),tk=el('div','alan-k'),ta=el('textarea','kutu',null,{id:tid,rows:'5'});ta.value=konuDizi(s.topics).join('\n');
  var th=el('p','alan-hata',null,{id:tid+'-hata'}),tsay=el('span','sayac');
  function tSay(){var n=konuDizi(ta.value).length;tsay.textContent=n+' / 30';tsay.classList.toggle('sayac-uyari',n>30)}tSay();ta.addEventListener('input',function(){tSay();if(th.textContent)hataYaz(ta,th,'')});
  ta.setAttribute('aria-describedby',tid+'-i '+th.id);
  ekle(tk,ekle(el('label','etiket',L('Konular','Topics'),{'for':tid}),el('span','ince',' '+L('(isteğe bağlı)','(optional)'))),ta,
    ekle(el('div','alan-alt'),el('span','ipucu',L('Her satıra bir konu; en çok 30 satır, satır başına en çok 160 karakter.','One topic per line; up to 30 lines, 160 characters each.'),{id:tid+'-i'}),tsay),th);

  var ok=el('div','onay-k'),oid=uid('o'),ol=el('label','onay',null,{'for':oid}),oi=el('input',null,null,{type:'checkbox',id:oid,'aria-describedby':oid+'-i'});
  oi.checked=!!(+s.auto_publish||s.auto_publish===true);
  ekle(ol,oi,el('span',null,L('Yazıları doğrudan yayınla','Publish posts directly')));
  ekle(ok,ol,el('p','ipucu',L('Kapalıyken (önerilen) yazılar sitene taslak olarak gider; sen okuyup yayınlarsın. Açıkken yazı hazır olur olmaz sitende yayınlanır.','When off (recommended), posts arrive on your site as drafts for you to review and publish. When on, each post goes live as soon as it’s ready.'),{id:oid+'-i'}));

  ekle(kap,lk,pwG,gfs,sk,dilG,uzG,tonG,bk,tk,ok);
  return {kok:kap,oi:oi,oku:function(){
    var gec=true,ilk=null,label=li.value.trim().slice(0,80);
    hataYaz(li,lh,'');
    var per=+radyoDeger(pwG,ad+'-pw')||1;
    var gs2=per===7?[1,2,3,4,5,6,7]:gunEl.filter(function(i){return i.checked}).map(function(i){return +i.value});
    gh.textContent='';
    if(per>siklikMax()){gec=false;ilk=ilk||pwG.querySelector('input:not([disabled])')}
    else if(!gs2.length){gh.textContent=L('En az bir gün seç.','Pick at least one day.');gec=false;ilk=ilk||gunEl[0]}
    else if(gs2.length!==per){gh.textContent=EN?('Pick '+per+' day'+(per>1?'s':'')+' for '+per+' post'+(per>1?'s':'')+' a week.'):('Haftada '+per+' yazı için '+per+' gün seç.');gec=false;ilk=ilk||gunEl[0]}
    var sat=konuDizi(ta.value),uzun=sat.filter(function(x){return x.length>160});
    if(sat.length>30){hataYaz(ta,th,L('En çok 30 konu yazabilirsin.','You can add up to 30 topics.'));gec=false;ilk=ilk||ta}
    else if(uzun.length){hataYaz(ta,th,L('Her konu en çok 160 karakter olabilir.','Each topic can be at most 160 characters.'));gec=false;ilk=ilk||ta}
    else hataYaz(ta,th,'');
    if(ilk)ilk.focus();
    return {ok:gec,settings:{label:label,auto_publish:oi.checked,per_week:per,days:gs2,hour:+ss.value,lang:radyoDeger(dilG,ad+'-dil')||'tr',length:radyoDeger(uzG,ad+'-uz')||'medium',tone:radyoDeger(tonG,ad+'-ton')||'samimi',brief:bt.value.trim().slice(0,1000),topics:sat}};
  }};
}

/* ---- bağlanma akışı ---- */
function formKapat(){akis=null;K.form.textContent='';platformSecili()}
function formAc(p){
  if(akis&&akis.p.id===p.id){var h=K.form.querySelector('h3');if(h)h.focus();return}
  akis={p:p,adim:'giris'};platformSecili();
  var f=K.form;f.textContent='';
  var fr=el('form','sheet form cms-form',null,{novalidate:'',autocomplete:'off'}),bas=el('div','cms-form-bas');
  var h3=el('h3','cms-form-ad',(EN?'Connect ':'')+str(p.name)+(EN?'':' bağla'),{tabindex:'-1'});
  var kapat=el('button','btn btn-metin btn-kucuk',L('Vazgeç','Cancel'),{type:'button'});
  kapat.addEventListener('click',function(){var dn=K.platform.querySelector('[data-pl="'+p.id+'"]');formKapat();if(dn)dn.focus()});
  ekle(bas,h3,kapat);fr.appendChild(bas);
  var notlar=yerel(p,'notes');
  if(!notlar&&p.id==='cloudflare')notlar=L(CF_NOT[0],CF_NOT[1]);
  if(notlar){var nb=el('div','bildirim cms-notlar');notlar.split(/\n+/).filter(function(x){return x.trim()}).forEach(function(x){nb.appendChild(el('p',null,x.trim()))});fr.appendChild(nb)}
  var alanlar=dz(p.fields).map(alanCiz),akap=el('div','cms-alanlar');
  alanlar.forEach(function(a){akap.appendChild(a.kok)});fr.appendChild(akap);
  var fnot=el('div','bildirim',null,{role:'alert'});
  akis.alanlar=alanlar;akis.fr=fr;akis.fnot=fnot;
  if(p.auth==='oauth'){
    var ab=ayarBlok({},'');akis.ayar=ab;
    var ob=el('button','btn btn-ink',(EN?'Continue to ':'')+str(p.name)+(EN?'':' ile devam et'),{type:'submit'});
    ekle(fr,ekle(el('div','cms-ayar-k'),el('h4','cms-h4',L('Yazı ayarları','Post settings')),ab.kok),fnot,ekle(el('div','eylemler'),ob));
    fr.addEventListener('submit',function(e){e.preventDefault();oauthBasla(ob)});
  }else{
    var bb=el('button','btn btn-ink',L('Bağlan ve kontrol et','Connect and check'),{type:'submit'});
    var adim2=el('div','cms-adim2',null,{hidden:''});akis.adim2=adim2;akis.bb=bb;
    ekle(fr,fnot,ekle(el('div','eylemler cms-bagla-e'),bb),adim2,el('p','ipucu',L('Bağlanırken yalnız okuma denemesi yaparız; sitende hiçbir şey değişmez.','When connecting we only run a read-only check; nothing changes on your site.')));
    fr.addEventListener('submit',function(e){e.preventDefault();if(akis.adim==='secim')kaydet(akis.kb);else probe(bb)});
  }
  f.appendChild(fr);h3.focus();
  try{fr.scrollIntoView({block:'start',behavior:'smooth'})}catch(e){}
}
function girdiTopla(){
  var inp={},gec=true,ilk=null;
  akis.alanlar.forEach(function(a){var r=alanOku(a);if(!r.ok){gec=false;ilk=ilk||a.g}else if(r.v!=='')inp[a.f.key]=r.v});
  if(ilk)ilk.focus();return gec?inp:null;
}
function alanKilit(kilit){akis.alanlar.forEach(function(a){if(a.g.tagName==='SELECT')a.g.disabled=kilit;else a.g.readOnly=kilit})}
function probe(b){
  if(api.bosMu(b))return;not(akis.fnot,'');
  var inp=girdiTopla();if(!inp)return;
  var bitti=api.mesgul(b,L('Kontrol ediliyor…','Checking…')),a=akis;
  cagir('/app/cms/probe','POST',{platform:a.p.id,inputs:inp}).then(function(j){
    bitti();if(akis!==a)return;
    if(j._s===200&&j.ok!==false){a.inputs=inp;a.probe=j;adim2Ciz(j);return}
    if(bolumYok(j)){not(a.fnot,hataMetni('not_ready'),'uyari');return}
    if(j.error==='rate'){not(a.fnot,L('Bugünlük bağlantı denemesi sınırına ulaştın. Yarın yeniden dene.','You’ve hit today’s connection-check limit. Try again tomorrow.'),'hata');return}
    hataNot(a.fnot,j);
  });
}
function ebeveynler(opts){
  var keys=Object.keys(opts),m={};
  keys.forEach(function(k){
    var ps=dz(opts[k].items).map(function(i){return i.parent}).filter(function(x){return x!=null&&x!==''}).map(String);
    if(!ps.length)return;
    for(var i=0;i<keys.length;i++){var p=keys[i];if(p===k)continue;
      var ids=dz(opts[p].items).map(function(x){return String(x.id)});
      if(ps.every(function(x){return ids.indexOf(x)>=0})){m[k]=p;break}}
  });
  return m;
}
function adim2Ciz(j){
  var a=akis,k=a.adim2;k.textContent='';a.adim='secim';alanKilit(true);
  a.bb.hidden=true;
  var hesap=j.account||{},hb=el('div','bildirim bildirim-ok cms-hesap'),hp=el('p');
  hp.appendChild(el('strong',null,L('Bağlantı çalışıyor.','Connection works.')));
  hp.appendChild(d.createTextNode((hesap.name?L('Hesap: ','Account: ')+str(hesap.name):'')));
  hb.appendChild(hp);
  var hu=guvenliUrl(hesap.url);if(hu)hb.appendChild(ekle(el('p'),disBag(hu)));
  var degis=el('button','btn btn-cizgi btn-kucuk',L('Bilgileri değiştir','Change details'),{type:'button'});
  degis.addEventListener('click',function(){a.adim='giris';a.probe=null;alanKilit(false);k.textContent='';k.hidden=true;a.bb.hidden=false;not(a.fnot,'');if(a.alanlar[0])a.alanlar[0].g.focus()});
  hb.appendChild(degis);k.appendChild(hb);

  var opts=(j.options&&typeof j.options==='object')?j.options:{},keys=Object.keys(opts),ust=ebeveynler(opts),sec={};
  a.secimler=sec;
  if(keys.length){
    var sk=el('div','cms-secimler');sk.appendChild(el('h4','cms-h4',L('Seçimler','Choices')));
    keys.forEach(function(key){
      var o=opts[key]||{},id=uid('c'),ak=el('div','alan-k'),s=el('select','kutu',null,{id:id}),hh=el('p','alan-hata',null,{id:id+'-hata'});
      s.setAttribute('aria-describedby',hh.id);
      var lb=el('label','etiket',yerel(o,'label')||key,{'for':id});if(!o.required)lb.appendChild(el('span','ince',' '+L('(isteğe bağlı)','(optional)')));
      ekle(ak,lb,s,hh);sk.appendChild(ak);
      sec[key]={o:o,s:s,h:hh,ust:ust[key]||null};
    });
    function doldur(key){
      var c=sec[key],o=c.o,s=c.s,eski=s.value,pv=c.ust?sec[c.ust].s.value:null;
      s.textContent='';
      s.appendChild(el('option',null,o.required?L('Seç…','Choose…'):L('Yok','None'),{value:''}));
      var its=dz(o.items).filter(function(i){return !c.ust||i.parent==null||i.parent===''||String(i.parent)===pv});
      its.forEach(function(i){s.appendChild(el('option',null,str(i.label||i.id),{value:str(i.id)}))});
      if(its.some(function(i){return String(i.id)===eski}))s.value=eski;
      else if(o.required&&its.length===1)s.value=str(its[0].id);
      else s.value='';
      s.disabled=!!(c.ust&&!pv);
      keys.forEach(function(k2){if(sec[k2].ust===key)doldur(k2)});
    }
    keys.forEach(function(key){if(!sec[key].ust)doldur(key)});
    keys.forEach(function(key){sec[key].s.addEventListener('change',function(){hataYaz(sec[key].s,sec[key].h,'');keys.forEach(function(k2){if(sec[k2].ust===key)doldur(k2)})})});
    k.appendChild(sk);
  }
  var ab=ayarBlok({},str(hesap.name));a.ayar=ab;
  ekle(k,ekle(el('div','cms-ayar-k'),el('h4','cms-h4',L('Yazı ayarları','Post settings')),ab.kok));
  var kb=el('button','btn btn-ink',L('Kaydet ve bağla','Save and connect'),{type:'submit'});a.kb=kb;
  k.appendChild(ekle(el('div','eylemler'),kb));
  k.hidden=false;
  var ilk=k.querySelector('select:not([disabled]),input');if(ilk)ilk.focus();
}
function secimTopla(){
  var ch={},gec=true,ilk=null,sec=akis.secimler||{};
  Object.keys(sec).forEach(function(k){var c=sec[k],v=c.s.value;
    if(c.o.required&&!v){hataYaz(c.s,c.h,L('Birini seç.','Choose one.'));gec=false;ilk=ilk||c.s}
    else{hataYaz(c.s,c.h,'');if(v)ch[k]=v}});
  /* DOĞRULANMALI: isteğe bağlı seçim "Yok" bırakılınca anahtar hiç gönderilmiyor (boş string yerine). */
  if(ilk)ilk.focus();return gec?ch:null;
}
function kaydet(b){
  if(!b||api.bosMu(b))return;not(akis.fnot,'');
  var ch=secimTopla();if(!ch)return;
  var ay=akis.ayar.oku();if(!ay.ok)return;
  var a=akis,bitti=api.mesgul(b,L('Kaydediliyor…','Saving…'));
  cagir('/app/cms/connect','POST',{platform:a.p.id,inputs:a.inputs,choices:ch,settings:ay.settings}).then(function(j){
    bitti();if(akis!==a)return;
    if(j._s===200&&j.site){
      siteKoy(j.site);veri.limits.used=Math.max(veri.limits.used,kullanilan());
      a.inputs=null;formKapat();ozetCiz();sitelerCiz();doluCiz();
      var s=j.site,ne=ist(s.next_run_at);
      not(K.not,str(s.label||sitePlat(s))+' '+L('bağlandı.','is connected.')+(ne?' '+L('İlk yazı: ','First post: ')+ne+'.':''),'ok');
      odakSite(s.id);return;
    }
    if(bolumYok(j)){not(a.fnot,hataMetni('not_ready'),'uyari');return}
    hataNot(a.fnot,j);
  });
}
/* OAuth dönüşü bu sayfaya: worker izin listesi /blog-otomatik, /en/blog-autopilot, /hesap/baglantilar, /en/hesap/connections */
function donusYolu(){var p=str(location.pathname).replace(/\.html$/,'').replace(/\/+$/,'');return p||'/'}
function oauthBasla(b){
  if(api.bosMu(b))return;not(akis.fnot,'');
  var inp=girdiTopla();if(!inp)return;
  var ay=akis.ayar.oku();if(!ay.ok)return;
  var a=akis,bitti=api.mesgul(b,L('Yönlendiriliyor…','Redirecting…'));
  cagir('/app/cmsoauth/start','POST',{platform:a.p.id,inputs:inp,settings:ay.settings,back:donusYolu()}).then(function(j){
    if(j._s===200&&j.url){
      var u=str(j.url);
      if(/^https:\/\//i.test(u)){if(ORNEK){bitti();not(a.fnot,L('Örnek modda yönlendirme yapılmaz.','No redirect in sample mode.'),'uyari');return}location.assign(u);return}
      bitti();not(a.fnot,hataMetni('server'),'hata');return;
    }
    bitti();if(akis!==a)return;
    if(bolumYok(j)){not(a.fnot,hataMetni('not_ready'),'uyari');return}
    hataNot(a.fnot,j);
  });
}

/* ---- bağlı siteler ---- */
function odakSite(id){var k=K.siteler.querySelector('[data-site="'+String(id).replace(/"/g,'')+'"] .bag-ad');if(k)k.focus()}
function plan(s){
  var gs=gunDizi(s.days).map(function(n){return L(GUNLER[n-1][1],GUNLER[n-1][2])}).join(', ');
  var h=(s.hour!=null&&s.hour!=='')?iki(+s.hour)+':00':'';
  var n=+s.per_week||1;if(n===7)gs='';
  var p=[(n===7?L('Günde 1','Daily'):EN?n+' a week':'Haftada '+n),gs,h,etiketBul(DIL,s.lang),etiketBul(UZUNLUK,s.length||'medium'),etiketBul(TON,s.tone||'samimi')].filter(Boolean);
  return p.join(' · ');
}
function sitelerCiz(){
  var k=K.siteler;k.textContent='';
  var liste=veri.sites.slice().sort(function(a,b){return (a.state==='kaldirildi')-(b.state==='kaldirildi')});
  K.sitelerB.hidden=!liste.length;k.hidden=!liste.length;
  liste.forEach(function(s){k.appendChild(siteKart(s))});
  siraCiz();
}

/* ---- sıradaki yazılar: next_run_at'tan başlayıp gün/saat planına göre sonraki zamanlar (İstanbul = UTC+3, yaz saati yok) ---- */
var IST_MS=3*36e5;
function slotlar(s,adet){
  var t0=zamanCoz(s.next_run_at);if(!t0)return [];
  var gunler=+s.per_week===7?[1,2,3,4,5,6,7]:gunDizi(s.days);
  var saat=(s.hour!=null&&s.hour!==''&&+s.hour>=0&&+s.hour<=23)?Math.floor(+s.hour):null;
  var out=[t0.getTime()];
  if(!gunler.length||saat==null)return out;
  var y=new Date(t0.getTime()+IST_MS),yil=y.getUTCFullYear(),ay=y.getUTCMonth(),gun=y.getUTCDate();
  for(var i=0;i<7*adet+7&&out.length<adet;i++){
    var iso=(new Date(Date.UTC(yil,ay,gun+i)).getUTCDay()+6)%7+1;
    if(gunler.indexOf(iso)<0)continue;
    var an=Date.UTC(yil,ay,gun+i,saat)-IST_MS;
    if(an>out[0])out.push(an);
  }
  return out;
}
function siraCiz(){
  var k=K.sira;if(!k)return;k.textContent='';
  var aktif=veri.sites.filter(function(s){return s.state==='aktif'});
  if(!aktif.length){
    k.appendChild(el('p','ince',veri.sites.some(function(s){return s.state!=='kaldirildi'})?L('Etkin site yok. Duraklatılmış bir siteyi devam ettirince sıradaki yazılar burada görünür.','No active sites. Resume a paused site to see upcoming posts here.'):L('Site bağladığında sıradaki yazıların tarihi ve saati burada görünür.','Once you connect a site, the dates and times of upcoming posts appear here.')));
    return;
  }
  var q=veri.quota;
  if(q.lb_limit>0&&q.lb_used>=q.lb_limit){var u=el('p','bildirim bildirim-uyari');u.textContent=hataMetni('quota')+' ';u.appendChild(el('a','bag',L('Planları gör','See plans'),{href:PLANLAR}));k.appendChild(u)}
  aktif.forEach(function(s){
    var kutu=el('div','sheet cms-sira-k');
    var bas=el('div','cms-yazi-bas');
    ekle(bas,el('h4','cms-h4',str(s.label||sitePlat(s))),el('span','ince',(+s.auto_publish||s.auto_publish===true)?L('Doğrudan yayınlanır','Published directly'):L('Taslak olarak gider','Sent as a draft')));
    kutu.appendChild(bas);
    var sl=slotlar(s,5);
    if(!sl.length)kutu.appendChild(el('p','ince',L('Sonraki yazı zamanı hesaplanıyor.','Next post time is being scheduled.')));
    else{var ol=el('ol','cms-sira-liste');sl.forEach(function(t){ol.appendChild(el('li','cms-sira-o',ist(t)))});kutu.appendChild(ol)}
    k.appendChild(kutu);
  });
  k.appendChild(el('p','ipucu',L('Saatler İstanbul saatidir. Her yazı yayın saatinden bir gün önce hazırlanır; hazır olunca e-posta gelir. Aşağıdan önizleyip düzenleyebilir, erteleyebilir ya da atlayabilirsin.','Times are Istanbul time. Each post is prepared a day before it goes out and you get an email when it is ready. Below you can preview, edit, reschedule or skip it.')));
}
function siteKart(s){
  var kart=el('article','sheet bag-kart cms-site',null,{'data-site':String(s.id)}),dur=SITE_DURUM[s.state]||[str(s.state),str(s.state),'rozet-gri'];
  var adk=el('div','bag-ad-k');
  ekle(adk,el('h4','bag-ad',str(s.label||sitePlat(s)),{tabindex:'-1'}),el('span','ince cms-pl-et',sitePlat(s)));
  kart.appendChild(ekle(el('div','bag-bas'),adk,el('span','rozet '+dur[2],L(dur[0],dur[1]))));
  var bu=guvenliUrl(s.base_url);
  if(bu)kart.appendChild(ekle(el('p','cms-url'),disBag(bu,bu.replace(/^https?:\/\//i,'').replace(/\/$/,''))));
  else if(s.base_url)kart.appendChild(el('p','ince cms-url',str(s.base_url)));
  if(s.state==='kaldirildi'){kart.appendChild(el('p','ince',L('Bağlantı kaldırıldı; anahtar silindi. Eski yazıların aşağıda kalır.','Connection removed; the key was deleted. Earlier posts stay listed below.')));return kart}
  if(s.hint)kart.appendChild(el('p','ince',L('Anahtar: ','Key: ')+'••••'+str(s.hint)));
  var kl=kilitli();
  if(kl){
    /* kilit: etkin site → yakında duraklar; plan nedeniyle duraklatılmış → yükselt + devam ettir; öteki (elle duraklatılmış/hata) → kısa not, hata metni korunur */
    var pm=s.state==='aktif'?PLAN_KILIT_AKTIF:(s.last_error==='plan_required'?PLAN_KILIT_SITE:PLAN_KILIT_NOT);
    var pk=el('div','bildirim bildirim-uyari'),pq=el('p',null,L(pm[0],pm[1])+' ');pq.appendChild(el('a','bag',L('Planları gör','See plans'),{href:PLANLAR}));pk.appendChild(pq);kart.appendChild(pk);
    if(s.state==='hata'&&s.last_error&&s.last_error!=='plan_required'){var kh=el('div','bildirim bildirim-hata');kh.appendChild(el('p',null,hataMetni(s.last_error)));kart.appendChild(kh)}
  }else if(s.last_error==='plan_required'){
    if(s.state!=='aktif'){var pa=el('div','bildirim bildirim-uyari');pa.appendChild(el('p',null,L(PLAN_ACILDI_SITE[0],PLAN_ACILDI_SITE[1])));kart.appendChild(pa)}
  }else if(s.last_error==='plan_frequency'&&s.state!=='aktif'){
    var pf=el('div','bildirim bildirim-uyari'),pp=el('p',null,planDustuMetni()+' ');pp.appendChild(el('a','bag',L('Planları gör','See plans'),{href:PLANLAR}));pf.appendChild(pp);kart.appendChild(pf);
  }else if(s.last_error&&(s.state==='hata'||s.state==='aktif')){
    var hb=el('div','bildirim '+(s.state==='hata'?'bildirim-hata':'bildirim-uyari'));hb.appendChild(el('p',null,hataMetni(s.last_error)));kart.appendChild(hb);
  }
  if(!kl&&s.state==='aktif'){var ne=ist(s.next_run_at);kart.appendChild(el('p','bag-kim',ne?L('Sonraki yazı: ','Next post: ')+ne+' '+L('(İstanbul)','(Istanbul)'):L('Sonraki yazı zamanı hesaplanıyor.','Next post time is being scheduled.')))}
  else if(!kl&&s.state==='duraklatildi')kart.appendChild(el('p','ince',L('Duraklatıldı: yeni yazı hazırlanmaz.','Paused: no new posts are prepared.')));
  kart.appendChild(el('p','ince',plan(s)));

  /* plan kilidinde: yalnız Duraklat (etkin ya da hatalıysa) ve Kaldır; doğrudan yayın, Şimdi yaz, Ayarlar, Devam ettir yok (sunucu 403 plan_required döner) */
  if(!kl){
  var ok=el('div','onay-k'),oid=uid('ap'),ol=el('label','onay',null,{'for':oid}),oi=el('input',null,null,{type:'checkbox',id:oid,'aria-describedby':oid+'-i'});
  oi.checked=!!(+s.auto_publish||s.auto_publish===true);
  ekle(ol,oi,el('span',null,L('Yazıları doğrudan yayınla','Publish posts directly')));
  ekle(ok,ol,el('p','ipucu',L('Kapalıyken taslak olarak gönderilir.','When off, posts are sent as drafts.'),{id:oid+'-i'}));
  oi.addEventListener('change',function(){otoDegis(s,oi)});
  kart.appendChild(ok);
  }

  var ey=el('div','eylemler'),db=null;
  if(!kl&&s.state==='aktif'){var yb=el('button','btn btn-ink btn-kucuk',L('Şimdi bir yazı yaz','Write a post now'),{type:'button','data-eylem':'yaz'});yb.addEventListener('click',function(){simdiYaz(s,yb)});ey.appendChild(yb)}
  if(!kl){db=el('button','btn btn-cizgi btn-kucuk',L('Ayarları düzenle','Edit settings'),{type:'button','aria-expanded':'false'});ey.appendChild(db)}
  if(s.state==='aktif'||(kl&&s.state==='hata')){var pb=el('button','btn btn-cizgi btn-kucuk',L('Duraklat','Pause'),{type:'button'});pb.addEventListener('click',function(){durum(s,'pause',pb)});ey.appendChild(pb)}
  else if(!kl){var rb=el('button','btn btn-cizgi btn-kucuk',L('Devam ettir','Resume'),{type:'button'});rb.addEventListener('click',function(){durum(s,'resume',rb)});ey.appendChild(rb)}
  var tb=el('button','btn btn-metin btn-kucuk',L('Durumu yenile','Refresh status'),{type:'button','data-eylem':'tazele'});tb.addEventListener('click',function(){tazeleTik(s,tb)});ey.appendChild(tb);
  var kb=el('button','btn btn-metin btn-kucuk cms-kaldir',L('Kaldır','Remove'),{type:'button'});kb.addEventListener('click',function(){kaldirAc(s,kb)});ey.appendChild(kb);
  kart.appendChild(ey);

  var sn=el('div','bildirim',null,{role:'status','aria-live':'polite'});kart.appendChild(sn);
  var kn=kartNot[String(s.id)];
  if(kn&&Date.now()-kn.t<NOT_OMUR)not(sn,kn.m,kn.tur,kn.bag);else if(kn)delete kartNot[String(s.id)];
  var duz=el('form','cms-duzen',null,{hidden:'',novalidate:''});kart.appendChild(duz);
  if(db)db.addEventListener('click',function(){
    if(!duz.hidden){duz.hidden=true;duz.textContent='';db.setAttribute('aria-expanded','false');return}
    duz.textContent='';var ab=ayarBlok(s,'');
    var kay=el('button','btn btn-ink btn-kucuk',L('Ayarları kaydet','Save settings'),{type:'submit'}),vz=el('button','btn btn-cizgi btn-kucuk',L('Vazgeç','Cancel'),{type:'button'});
    vz.addEventListener('click',function(){duz.hidden=true;duz.textContent='';db.setAttribute('aria-expanded','false');db.focus()});
    ekle(duz,el('h5','cms-h4',L('Yazı ayarları','Post settings'),{tabindex:'-1'}),ab.kok,ekle(el('div','eylemler'),kay,vz));
    duz.onsubmit=function(e){e.preventDefault();ayarKaydet(s,ab,kay)};
    duz.hidden=false;db.setAttribute('aria-expanded','true');duz.querySelector('h5').focus();
  });
  kart._not=sn;
  return kart;
}
function ayarGovde(s){return {label:str(s.label).slice(0,80),auto_publish:!!(+s.auto_publish||s.auto_publish===true),per_week:+s.per_week||1,days:gunDizi(s.days),hour:(s.hour!=null&&s.hour!=='')?+s.hour:10,lang:s.lang||'tr',length:s.length||'medium',tone:s.tone||'samimi',brief:str(s.brief),topics:konuDizi(s.topics)}}
function ayarKaydet(s,ab,b){
  if(api.bosMu(b))return;var ay=ab.oku();if(!ay.ok)return;
  var bitti=api.mesgul(b,L('Kaydediliyor…','Saving…'));
  cagir('/app/cms/'+encodeURIComponent(s.id)+'/settings','POST',ay.settings).then(function(j){
    bitti();
    if(j._s===200&&j.ok!==false){
      var yeni=j.site||Object.assign({},s,ay.settings);siteKoy(yeni);sitelerCiz();
      kartNotu(s.id,L('Ayarlar kaydedildi.','Settings saved.'),'ok');odakSite(s.id);return;
    }
    kartHata(s.id,j);
  });
}
function otoDegis(s,oi){
  var yeni=oi.checked,g=ayarGovde(s);g.auto_publish=yeni;oi.disabled=true;
  cagir('/app/cms/'+encodeURIComponent(s.id)+'/settings','POST',g).then(function(j){
    oi.disabled=false;
    if(j._s===200&&j.ok!==false){var y=j.site||Object.assign({},s,{auto_publish:yeni?1:0});siteKoy(y);s.auto_publish=y.auto_publish;
      kartNotu(s.id,yeni?L('Yazılar artık doğrudan yayınlanacak.','Posts will now be published directly.'):L('Yazılar artık taslak olarak gönderilecek.','Posts will now be sent as drafts.'),'ok');return}
    oi.checked=!yeni;kartHata(s.id,j);
  });
}
/* "Şimdi bir yazı yaz": aynı rid ağ hatasında saklanır (yeniden basınca sunucu aynı yazıyı döner, hak iki kez düşmez).
   TAZELE_HATA kodlarında (site etkin değil, deneme bitti, kota, günlük sınır, plan, site yok) site durumu sunucudan yeniden
   okunur ve kart yeniden çizilir; hata notu kartNot'ta saklandığı için yeni kartta görünür kalır. Düğme yenileme bitene kadar meşgul. */
function simdiYaz(s,b){
  if(api.bosMu(b))return;
  var anahtar=String(s.id),tekrar=!!bekleyenRid[anahtar],r=bekleyenRid[anahtar]||(bekleyenRid[anahtar]=rid());
  var bitti=api.mesgul(b,L('Sıraya alınıyor…','Queuing…'));
  kartNotu(anahtar,'');
  cagir('/app/cms/'+encodeURIComponent(s.id)+'/run','POST',{rid:r}).then(function(j){
    if(j._s!==0)delete bekleyenRid[anahtar];
    if(j._s===200&&j.post){
      bitti();yaziKoy(j.post);
      /* tekrar (önceki istek zaman aşımına uğradıysa) sunucu aynı yazıyı döner: hak zaten düşmüş olabilir → yerelde sayma, sunucudan oku */
      if(!tekrar&&veri.quota.lb_limit>0&&j.post.state!=='kota')veri.quota.lb_used=Math.min(veri.quota.lb_used+1,veri.quota.lb_limit);
      ozetCiz();siraCiz();yazilarCiz();
      kartNotu(anahtar,j.post.state==='kota'?hataMetni('quota'):L('Sıraya alındı; birkaç dakika içinde aşağıdaki “Hazırlanan ve gönderilen yazılar” listesinde görünür.','Queued; it shows up in “Prepared and sent posts” below within a few minutes.'),j.post.state==='kota'?'uyari':'ok');
      if(tekrar)durumTazele(anahtar);
      yoklaBastan();return}
    var h=hataBilgi(j);if(!h){bitti();return}
    if(!TAZELE_HATA[h.k]){bitti();kartNotu(anahtar,h.m,'hata',h.bag);return}
    hataTazele(anahtar,h,bitti);
  });
}
/* kart eyleminin hatası TAZELE_HATA'daysa: not yazılır, durum sunucudan yeniden okunur, kart yeniden çizilir, not yeni kartta kalır.
   Site kaldırılmış ya da listede yoksa "API adresi bulunamadı" yerine SITE_YOK. Düğme (bitti) yenileme bitene kadar meşgul. */
function hataTazele(id,h,bitti){
  if(h.k!=='not_found')kartNotu(id,h.m,'hata',h.bag);
  durumTazele(id).then(function(t){
    bitti();
    var y=t&&t._s===200?siteBul(id):null;
    if(t&&t._s===200&&(!y||y.state==='kaldirildi'))kartNotu(id,L(SITE_YOK[0],SITE_YOK[1]),'hata');
    else kartNotu(id,h.m,'hata',h.bag);
  });
}
/* "Durumu yenile": sitenin durumunu, kotayı ve yazıları sunucudan yeniden okur; istek sürerken düğme meşgul (çift tık ikinci istek göndermez) */
function tazeleTik(s,b){
  if(api.bosMu(b))return;
  var id=String(s.id),bitti=api.mesgul(b,L('Yenileniyor…','Refreshing…'));
  durumTazele(id).then(function(j){
    bitti();
    if(j&&j._s===200){var y=siteBul(id);kartNotu(id,(!y||y.state==='kaldirildi')?L(SITE_YOK[0],SITE_YOK[1]):L('Durum güncellendi.','Status updated.'),(!y||y.state==='kaldirildi')?'uyari':'ok');return}
    kartHata(id,j||{_s:0});
  });
}
function durum(s,ne,b){
  if(api.bosMu(b))return;
  var bitti=api.mesgul(b,ne==='pause'?L('Duraklatılıyor…','Pausing…'):L('Açılıyor…','Resuming…'));
  cagir('/app/cms/'+encodeURIComponent(s.id)+'/'+ne,'POST',{}).then(function(j){
    if(j._s===200&&j.site){bitti();siteKoy(j.site);sitelerCiz();kartNotu(s.id,ne==='pause'?L('Duraklatıldı.','Paused.'):L('Yeniden etkin.','Active again.'),'ok');odakSite(s.id);return}
    var h=hataBilgi(j);if(!h){bitti();return}
    if(TAZELE_HATA[h.k]){hataTazele(String(s.id),h,bitti);return}
    bitti();kartNotu(s.id,h.m,'hata',h.bag);
  });
}

/* ---- kaldırma (sayfa içi onay; window.confirm yok) ---- */
function kaldirKur(){
  var x=$('#dlg-cms-kaldir'),ev=$('#cms-kaldir-evet');if(!x||!ev)return;
  ev.addEventListener('click',function(){
    var s=kaldirHedef;if(!s||api.bosMu(ev))return;
    var bitti=api.mesgul(ev,L('Kaldırılıyor…','Removing…'));
    cagir('/app/cms/'+encodeURIComponent(s.id)+'/disconnect','POST',{}).then(function(j){
      bitti();x.close();kaldirHedef=null;
      if(j._s===200&&j.site){siteKoy(j.site);veri.limits.used=kullanilan();ozetCiz();sitelerCiz();if(K.dolu)doluCiz();not(K.not,str(s.label||sitePlat(s))+' '+L('bağlantısı kaldırıldı.','was disconnected.'),'ok');K.not.setAttribute('tabindex','-1');K.not.focus();return}
      hataNot(K.not,j);
    });
  });
}
function kaldirAc(s,tetik){
  var x=$('#dlg-cms-kaldir'),a=$('#dlg-cms-kaldir-a');if(!x)return;
  kaldirHedef=s;
  if(a)a.textContent=(EN?'“'+str(s.label||sitePlat(s))+'” will be disconnected and its key deleted. Posts already on your site stay there.':'“'+str(s.label||sitePlat(s))+'” bağlantısı kaldırılır ve anahtarı silinir. Sitene gönderilmiş yazılar orada kalır.');
  api.dlgAc(x,tetik);
}

/* ---- yazılar ---- */
function yazilarCiz(){
  var k=K.yazilar;k.textContent='';
  if(!veri.posts.length){k.appendChild(el('p','ince',L('Henüz yazı yok. Site bağladığında yazılar burada görünür.','No posts yet. Once you connect a site, posts appear here.')));return}
  var ul=el('ul','cms-yazi-liste');
  veri.posts.forEach(function(p){
    var li=el('li','sheet cms-yazi'),dur=YAZI_DURUM[p.state]||[str(p.state),str(p.state),'rozet-gri'];
    var et=L(dur[0],dur[1]);if(p.state==='gonderildi'&&p.mode==='draft')et+=L(' (taslak)',' (draft)');
    var s=siteBul(p.cms_site_id);
    ekle(li,ekle(el('div','cms-yazi-bas'),el('strong','cms-yazi-ad',str(p.title)||L('(başlıksız)','(untitled)')),el('span','rozet '+dur[2],et)));
    var meta=[s?str(s.label||sitePlat(s)):'',ist(p.created_at)].filter(Boolean).join(' · ');
    if(meta)li.appendChild(el('p','ince',meta));
    if(p.state==='kota'){var kp=el('p','ince cms-yazi-acik',hataMetni('quota')+' ');kp.appendChild(el('a','bag',L('Planları gör','See plans'),{href:PLANLAR}));li.appendChild(kp)}
    else if(p.state==='basarisiz'&&p.last_error)li.appendChild(el('p','alan-hata cms-yazi-acik',hataMetni(p.last_error)));
    if(p.content_deleted)li.appendChild(el('p','ince cms-yazi-acik',L('İçerik 3 gün sonra silindi.','Content deleted after 3 days.')));
    var ey=el('div','eylemler'),u=guvenliUrl(p.remote_url);
    if(u)ey.appendChild(disBag(u,L('Sitede aç','Open on site')));
    if((p.state==='gonderildi'||p.state==='yayinlandi')&&str(p.title).trim()){var kq='?konu='+encodeURIComponent(uyarlaKonu(p));
      ey.appendChild(el('a','bag',L('LinkedIn\'e uyarla','Adapt for LinkedIn'),{href:(EN?'/en/':'/')+kq}));
      ey.appendChild(el('a','bag',L('Instagram\'a uyarla','Adapt for Instagram'),{href:(EN?'/en/visual':'/gorsel')+kq}))}
    if(p.state==='basarisiz'&&!p.content_deleted&&!kilitli()){var rb=el('button','btn btn-cizgi btn-kucuk',L('Yeniden gönder','Send again'),{type:'button'});rb.addEventListener('click',function(){yenidenGonder(p,rb,li)});ey.appendChild(rb)}
    if(ey.childNodes.length)li.appendChild(ey);
    li.appendChild(el('div','bildirim',null,{role:'status','aria-live':'polite'}));
    ul.appendChild(li);
  });
  k.appendChild(ul);
}
/* "LinkedIn'e / Instagram'a uyarla": stüdyonun konu alanına (?konu=, studyo-kabuk.js urlKonu) başlık + adres; üretim kendiliğinden
   başlamaz, hak yalnız kullanıcı yazdırınca düşer. Adres yalnız yayınlanmış yazıda (taslağın adresi herkese açık değil);
   içerik silinmiş (3 gün) yazıda da başlık + adres yeter. Toplam en çok 300 karakter (KONU_MAX). */
function uyarlaKonu(p){
  var t=str(p.title).replace(/\s+/g,' ').trim(),u=p.state==='yayinlandi'?guvenliUrl(p.remote_url):'';if(u.length>200)u='';
  var on=L('Yeni blog yazımızı tanıt: ','Promote our new blog post: '),son=u?' — '+u:'',yer=300-on.length-son.length-2;
  if(t.length>yer)t=t.slice(0,yer-1).trim()+'…';
  return on+'“'+t+'”'+son;
}
function yenidenGonder(p,b,li){
  if(api.bosMu(b))return;
  var sn=li.querySelector('.bildirim'),bitti=api.mesgul(b,L('Gönderiliyor…','Sending…'));
  cagir('/app/cmsposts/'+encodeURIComponent(p.id)+'/retry','POST',{}).then(function(j){
    bitti();
    if(j._s===200&&j.post){yaziKoy(j.post);yazilarCiz();yoklaBastan();return}
    hataNot(sn,j);
  });
}

/* ---- yaklaşan yazılar: hazırlanan (uretiliyor) ve hazır (hazir) yazılar, yayın saatine göre ----
   Hazır yazı önizlenir, düzenlenir, ertelenir, hemen yayınlanır ya da atlanır; hazırlanmakta olan atlanırsa hak geri verilir. */
var YAKIN_MAX=32000;
function yakinListe(){return veri.posts.filter(function(p){return (p.state==='hazir'||p.state==='uretiliyor')&&zamanCoz(p.publish_at)}).sort(function(a,b){return zamanCoz(a.publish_at)-zamanCoz(b.publish_at)})}
function istGun(t){var y=new Date(t+IST_MS);return Date.UTC(y.getUTCFullYear(),y.getUTCMonth(),y.getUTCDate())}
function yakinZaman(v){
  var t=zamanCoz(v);if(!t)return '';t=t.getTime();
  var fark=Math.round((istGun(t)-istGun(Date.now()))/864e5),y=new Date(t+IST_MS),saat=iki(y.getUTCHours())+':'+iki(y.getUTCMinutes());
  if(fark===0)return L('Bugün saat '+saat,'today at '+saat);
  if(fark===1)return L('Yarın saat '+saat,'tomorrow at '+saat);
  return L(ist(t),'on '+ist(t));
}
function yerelGirdi(t){var y=new Date(t+IST_MS);return y.getUTCFullYear()+'-'+iki(y.getUTCMonth()+1)+'-'+iki(y.getUTCDate())+'T'+iki(y.getUTCHours())+':'+iki(y.getUTCMinutes())}
function yakinTazele(){if(!K.yakin||!K.yakin.isConnected||kilitli())return;if(icinde(K.yakin)||K.yakin.querySelector('.cms-duzen:not([hidden])'))return;yakinCiz()}
function yakinCiz(){
  var k=K.yakin;if(!k)return;k.textContent='';
  var liste=yakinListe();
  if(!liste.length){k.appendChild(el('p','ince',L('Şu an hazırlanan yazı yok. Her yazı yayın saatinden bir gün önce burada belirir.','No drafts in preparation right now. Each post appears here a day before it goes out.')));return}
  var ul=el('ul','cms-yazi-liste');
  liste.forEach(function(p){ul.appendChild(yakinOge(p))});
  k.appendChild(ul);
}
function yakinOge(p){
  var li=el('li','sheet cms-yazi cms-yakin-o',null,{'data-yazi':String(p.id)}),hazir=p.state==='hazir',s=siteBul(p.cms_site_id);
  var zm=yakinZaman(p.publish_at),kip=p.mode==='publish'?L('doğrudan','directly'):L('taslak olarak','as a draft');
  ekle(li,ekle(el('div','cms-yazi-bas'),el('strong','cms-yazi-ad',hazir?(str(p.title)||L('(başlıksız)','(untitled)')):L('Hazırlanıyor…','Being written…')),el('span','rozet '+(hazir?'rozet-ok':'rozet-bilgi'),hazir?L('Hazır','Ready'):L('Yazılıyor','Being written'))));
  li.appendChild(el('p','cms-yakin-zaman',L(zm+' '+kip+' yayınlanacak','Goes out '+zm+' '+kip)));
  if(s)li.appendChild(el('p','ince',str(s.label||sitePlat(s))));
  var sn=el('div','bildirim',null,{role:'status','aria-live':'polite'});
  var ey=el('div','eylemler'),panel=el('div','cms-duzen cms-yakin-panel',null,{hidden:''});
  function dugme(tr,en,f,cls){var b=el('button','btn '+(cls||'btn-cizgi')+' btn-kucuk',L(tr,en),{type:'button','aria-expanded':'false'});b.addEventListener('click',function(){if(!api.bosMu(b))f(b)});ey.appendChild(b);return b}
  function panelAc(b,dol){
    var acik=b.getAttribute('aria-expanded')==='true';
    Array.prototype.forEach.call(ey.querySelectorAll('[aria-expanded]'),function(x){x.setAttribute('aria-expanded','false')});
    panel.textContent='';
    if(acik){panel.hidden=true;return}
    b.setAttribute('aria-expanded','true');panel.hidden=false;dol(panel,b);
  }
  if(hazir&&!kilitli()){
    dugme('Önizle','Preview',function(b){panelAc(b,function(pn){yakinOnizle(p,pn,sn)})});
    dugme('Düzenle','Edit',function(b){panelAc(b,function(pn){yakinDuzenle(p,pn,sn)})});
    dugme('Ertele','Reschedule',function(b){panelAc(b,function(pn){yakinErtele(p,pn,sn)})});
    dugme('Şimdi yayınla','Publish now',function(b){yakinCagir(p,'now',{},b,sn,L('Gönderiliyor…','Sending…'))},'btn-ana');
  }
  if(!kilitli())dugme('Atla','Skip',function(b){panelAc(b,function(pn){yakinAtla(p,pn,sn)})});
  ekle(li,ey,panel,sn);
  return li;
}
function yakinYol(p,ne){return '/app/cmsposts/'+encodeURIComponent(p.id)+'/'+ne}
function yakinHata(sn,j){
  if(j.error==='bad_input'&&j.field==='state'){yakinYenile(L('Yazının durumu değişti; liste yenilendi.','This post’s status changed; the list has been refreshed.'));return}
  if(j.error==='not_found'){yakinYenile(L('Bu yazı artık yok; liste yenilendi.','This post no longer exists; the list has been refreshed.'));return}
  if(j.error==='bad_input'&&j.field==='at'){not(sn,L('Seçtiğin zaman geçersiz. Şu andan sonra ve en çok 30 gün içinde bir zaman seç.','That time isn’t valid. Pick a time after now and within 30 days.'),'hata');return}
  if(j.error==='bad_input'&&(j.field==='title'||j.field==='markdown')){not(sn,j.field==='title'?L('Başlık boş olamaz ve en çok 300 karakter olabilir.','The title can’t be empty and can be at most 300 characters.'):L('Yazı boş olamaz ve çok uzun olmamalı.','The post can’t be empty or too long.'),'hata');return}
  hataNot(sn,j);
}
// Eski öğe ekranda kalmasın: açık paneller kapanır, veri yeniden alınır, liste her durumda yeniden çizilir, not listenin başına konur
function yakinYenile(m){
  if(!K.yakin)return;
  Array.prototype.forEach.call(K.yakin.querySelectorAll('.cms-duzen'),function(x){x.hidden=true});
  var son=function(){if(!K.yakin||!K.yakin.isConnected||kilitli())return;yakinCiz();var b=el('div','bildirim',null,{role:'status','aria-live':'polite'});K.yakin.insertBefore(b,K.yakin.firstChild);not(b,m,'uyari')};
  var s=yukle(true);if(s&&s.then)s.then(son,son);else son();
}
function yakinBitti(j,sn,m){
  yaziKoy(j.post);yakinCiz();yazilarCiz();yoklaBastan();
  if(!m||!K.yakin)return;
  var yeni=K.yakin.querySelector('[data-yazi="'+String(j.post.id).replace(/"/g,'')+'"] .bildirim');
  if(!yeni){yeni=el('div','bildirim',null,{role:'status','aria-live':'polite'});K.yakin.insertBefore(yeni,K.yakin.firstChild)}
  not(yeni,m,'ok');
}
function yakinCagir(p,ne,govde,b,sn,mesg,basari){
  if(api.bosMu(b))return;
  var bitti=api.mesgul(b,mesg);not(sn,'');
  cagir(yakinYol(p,ne),'POST',govde).then(function(j){
    bitti();
    if(j._s===200&&j.post){yakinBitti(j,sn,basari);return}
    yakinHata(sn,j);
  });
}
function yakinOnizle(p,pn,sn){
  var y=el('p','ince',L('Yükleniyor…','Loading…'));pn.appendChild(y);
  var no=pn._no=(pn._no||0)+1; // geç gelen eski /view yanıtı sonradan açılan paneli ezmesin
  cagir(yakinYol(p,'view'),'POST',{}).then(function(j){
    if(pn.hidden||pn._no!==no)return;pn.textContent='';
    if(j._s!==200){yakinHata(sn,j);pn.hidden=true;return}
    var kap=guvenliUrl(j.cover_url);
    if(kap&&/^https:\/\/images\.pexels\.com\//.test(kap)){
      var f=el('figure','cms-yakin-kapak');f.appendChild(el('img',null,null,{src:kap,alt:'',loading:'lazy',referrerpolicy:'no-referrer'}));
      if(j.cover_credit)f.appendChild(el('figcaption','ince',str(j.cover_credit)));pn.appendChild(f);
    }
    pn.appendChild(el('h4','cms-h4',str(j.title)||L('(başlıksız)','(untitled)')));
    pn.appendChild(el('pre','cms-yakin-metin',str(j.markdown)));
  });
}
function yakinDuzenle(p,pn,sn){
  var y=el('p','ince',L('Yükleniyor…','Loading…'));pn.appendChild(y);
  var no=pn._no=(pn._no||0)+1; // geç gelen eski /view yanıtı sonradan açılan paneli ezmesin
  cagir(yakinYol(p,'view'),'POST',{}).then(function(j){
    if(pn.hidden||pn._no!==no)return;pn.textContent='';
    if(j._s!==200){yakinHata(sn,j);pn.hidden=true;return}
    var ti=uid('baslik'),mi=uid('metin');
    var bi=el('input','kutu',null,{id:ti,type:'text',maxlength:'300',required:''});bi.value=str(j.title);
    var mt=el('textarea','kutu cms-yakin-alan',null,{id:mi,rows:'14',maxlength:String(YAKIN_MAX),required:''});mt.value=str(j.markdown);
    ekle(pn,el('label','etiket',L('Başlık','Title'),{for:ti}),bi,el('label','etiket',L('Yazı (Markdown)','Post (Markdown)'),{for:mi}),mt);
    var kb=el('button','btn btn-ana btn-kucuk',L('Kaydet','Save'),{type:'button'});
    kb.addEventListener('click',function(){
      var t=bi.value.trim(),m=mt.value;
      if(!t||t.length>300){not(sn,L('Başlık boş olamaz ve en çok 300 karakter olabilir.','The title can’t be empty and can be at most 300 characters.'),'hata');bi.focus();return}
      if(!m.trim()){not(sn,L('Yazı boş olamaz.','The post can’t be empty.'),'hata');mt.focus();return}
      yakinCagir(p,'edit',{title:t,markdown:m},kb,sn,L('Kaydediliyor…','Saving…'),L('Değişiklikler kaydedildi.','Changes saved.'));
    });
    pn.appendChild(ekle(el('div','eylemler'),kb));
  });
}
function yakinErtele(p,pn,sn){
  var su=Date.now(),id=uid('zaman'),t=zamanCoz(p.publish_at);
  var g=el('input','kutu',null,{id:id,type:'datetime-local',min:yerelGirdi(su),max:yerelGirdi(su+30*864e5),step:'60'});
  g.value=yerelGirdi(t?Math.max(t.getTime(),su):su+864e5);
  ekle(pn,el('label','etiket',L('Yeni yayın zamanı (İstanbul saati)','New publish time (Istanbul time)'),{for:id}),g);
  var kb=el('button','btn btn-ana btn-kucuk',L('Zamanı kaydet','Save time'),{type:'button'});
  kb.addEventListener('click',function(){
    var v=str(g.value);
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)){not(sn,L('Bir tarih ve saat seç.','Pick a date and time.'),'hata');g.focus();return}
    var at=v+':00+03:00',ms=Date.parse(at);
    if(!(ms>Date.now()-6e4&&ms<=Date.now()+30*864e5)){not(sn,L('Şu andan sonra ve en çok 30 gün içinde bir zaman seç.','Pick a time after now and within 30 days.'),'hata');g.focus();return}
    yakinCagir(p,'reschedule',{at:at},kb,sn,L('Kaydediliyor…','Saving…'),L('Yayın zamanı güncellendi.','Publish time updated.'));
  });
  pn.appendChild(ekle(el('div','eylemler'),kb));
}
function yakinAtla(p,pn,sn){
  pn.appendChild(el('p',null,p.state==='uretiliyor'?L('Bu yazı atlanacak ve yazı hakkın geri verilecek. Emin misin?','This post will be skipped and the post credit returned to you. Are you sure?'):L('Bu yazı atlanacak ve gönderilmeyecek. Hak geri verilmez. Emin misin?','This post will be skipped and won’t be sent. The credit isn’t returned. Are you sure?')));
  var eb=el('button','btn btn-tehlike btn-kucuk',L('Evet, atla','Yes, skip'),{type:'button'});
  eb.addEventListener('click',function(){yakinCagir(p,'skip',{},eb,sn,L('Atlanıyor…','Skipping…'),L('Yazı atlandı.','Post skipped.'))});
  pn.appendChild(ekle(el('div','eylemler'),eb));
}

/* ---- örnek mod (istek gönderilmez) ---- */
var ORNEK_VERI=null;
function ornekVeri(){
  if(ORNEK_VERI)return ORNEK_VERI;
  var simdi=Date.now(),gun=864e5;
  function dz2(ms){return new Date(ms).toISOString().slice(0,19).replace('T',' ')}
  ORNEK_VERI={ok:true,
    providers:[
      {id:'wordpress',name:'WordPress',auth:'key',ready:true,notes_tr:'Kendi sunucundaki WordPress 5.6 ve üstü. Site https ile açılmalı.',notes_en:'Self-hosted WordPress 5.6 or later. The site must use https.',fields:[
        {key:'site_url',label_tr:'Site adresi',label_en:'Site address',type:'url',required:true,placeholder:'https://ornek.com',help_tr:'Tarayıcıda sitenin açıldığı adres.',help_en:'The address your site opens at.'},
        {key:'username',label_tr:'Kullanıcı adı',label_en:'Username',type:'text',required:true,help_tr:'wp-admin girişinde kullandığın kullanıcı adı.',help_en:'The username you use to sign in to wp-admin.'},
        {key:'app_password',label_tr:'Uygulama şifresi',label_en:'Application password',type:'secret',required:true,help_tr:'wp-admin’e gir.\nKullanıcılar > Profil sayfasını aç.\nUygulama Şifreleri bölümünde bir ad yaz ve Ekle’ye bas.\nGösterilen şifreyi kopyala; yalnız bir kez gösterilir.',help_en:'Sign in to wp-admin.\nOpen Users > Profile.\nIn Application Passwords, enter a name and click Add.\nCopy the password shown; it appears only once.'}]},
      {id:'webflow',name:'Webflow',auth:'key',ready:true,notes_tr:'Webflow’da CMS planı gerekir.',notes_en:'Webflow needs a CMS plan.',fields:[
        {key:'token',label_tr:'Site API anahtarı',label_en:'Site API token',type:'secret',required:true,help_tr:'Site ayarları > Apps & integrations > API access.',help_en:'Site settings > Apps & integrations > API access.'}]},
      {id:'ghost',name:'Ghost',auth:'key',ready:true,notes_tr:'Ghost(Pro) Starter planında Admin API yoktur.',notes_en:'Ghost(Pro) Starter has no Admin API.',fields:[
        {key:'admin_url',label_tr:'Admin API adresi',label_en:'Admin API URL',type:'url',required:true,placeholder:'https://blog.ornek.com'},
        {key:'admin_key',label_tr:'Admin API anahtarı',label_en:'Admin API key',type:'secret',required:true}]},
      {id:'shopify',name:'Shopify',auth:'key',ready:true,fields:[
        {key:'shop',label_tr:'Mağaza alan adı',label_en:'Store domain',type:'text',required:true,placeholder:'magaza.myshopify.com'},
        {key:'token',label_tr:'Admin API anahtarı',label_en:'Admin API token',type:'secret',required:true}]},
      {id:'hubspot',name:'HubSpot',auth:'key',ready:true,fields:[
        {key:'api_key',label_tr:'Service key',label_en:'Service key',type:'secret',required:true}]},
      {id:'wix',name:'Wix',auth:'key',ready:true,fields:[
        {key:'api_key',label_tr:'API anahtarı',label_en:'API key',type:'secret',required:true},
        {key:'site_id',label_tr:'Site ID',label_en:'Site ID',type:'text',required:true}]},
      {id:'github',name:'GitHub (statik site)',auth:'key',ready:true,fields:[
        {key:'owner',label_tr:'Sahip (kullanıcı/kuruluş)',label_en:'Owner (user/org)',type:'text',required:true},
        {key:'repo',label_tr:'Depo',label_en:'Repository',type:'text',required:true},
        {key:'token',label_tr:'Fine-grained token',label_en:'Fine-grained token',type:'secret',required:true}]},
      {id:'cloudflare',name:'Cloudflare Pages',auth:'key',ready:true,stored_as:'github',notes_tr:'',notes_en:'',fields:[
        {key:'owner',label_tr:'Sahip (kullanıcı/kuruluş)',label_en:'Owner (user/org)',type:'text',required:true,help_tr:'github.com/<sahip>/<depo> adresindeki sahip adı.',help_en:'The owner in github.com/<owner>/<repo>.'},
        {key:'repo',label_tr:'Depo',label_en:'Repository',type:'text',required:true,help_tr:'github.com/<sahip>/<depo> adresindeki depo adı.',help_en:'The repository in github.com/<owner>/<repo>.'},
        {key:'token',label_tr:'Fine-grained token',label_en:'Fine-grained token',type:'secret',required:true},
        {key:'branch',label_tr:'Dal',label_en:'Branch',type:'text',required:false,placeholder:'main'},
        {key:'base_url',label_tr:'Pages site adresi',label_en:'Pages site address',type:'text',required:false,placeholder:'https://site.pages.dev'}]},
      {id:'ideasoft',name:'IdeaSoft',auth:'oauth',ready:true,fields:[
        {key:'store',label_tr:'Mağaza adresi',label_en:'Store address',type:'url',required:true,placeholder:'https://magaza.myideasoft.com',help_tr:'Mağazanın açıldığı adres.',help_en:'The address your store opens at.'}]},
      {id:'wpcom',name:'WordPress.com',auth:'oauth',ready:false,reason:'not_ready',fields:[]}
    ],
    unsupported:[
      {id:'ikas',name:'ikas',reason_tr:'ikas API’sinde blog yazısı oluşturma yok.',reason_en:'The ikas API has no way to create blog posts.'},
      {id:'ticimax',name:'Ticimax',reason_tr:'Ticimax servislerinde blog işlemi yok.',reason_en:'Ticimax services have no blog operations.'}],
    error_help:{},
    sites:[{id:1,platform:'wordpress',label:'Örnek Blog',base_url:'https://ornek.com',hint:'a1b2',state:'aktif',last_error:null,auto_publish:0,per_week:2,days:[2,4],hour:9,lang:'tr',length:'medium',tone:'samimi',brief:'',topics:['LinkedIn içerik takvimi','B2B satış'],choices:{},next_run_at:dz2(simdi+gun),created_at:dz2(simdi-5*gun)}],
    posts:[
      {id:13,cms_site_id:1,title:'',state:'uretiliyor',mode:'draft',remote_url:null,last_error:null,created_at:dz2(simdi),publish_at:dz2(simdi+3*gun),has_content:false},
      {id:12,cms_site_id:1,title:'B2B şirketler için LinkedIn sayfası nasıl büyütülür?',state:'hazir',mode:'draft',remote_url:null,last_error:null,created_at:dz2(simdi-36e5),publish_at:dz2(simdi+gun),has_content:true},
      {id:11,cms_site_id:1,title:'LinkedIn içerik takvimi nasıl hazırlanır?',state:'gonderildi',mode:'draft',remote_url:'https://ornek.com/?p=42',last_error:null,created_at:dz2(simdi-2*gun)},
      {id:10,cms_site_id:1,title:'B2B satışta sosyal medya',state:'basarisiz',mode:'draft',remote_url:null,last_error:'timeout',created_at:dz2(simdi-4*gun)},
      {id:9,cms_site_id:1,title:'',state:'kota',mode:'draft',remote_url:null,last_error:null,created_at:dz2(simdi-30*gun)},
      {id:8,cms_site_id:1,title:'Instagram’da B2B hikâye fikirleri',state:'yayinlandi',mode:'publish',remote_url:'https://ornek.com/?p=40',last_error:null,created_at:dz2(simdi-35*gun),content_deleted:true}],
    limits:{sites:1,used:1,per_week_max:3,plan_required:null},quota:{lb_used:2,lb_limit:8}};
  return ORNEK_VERI;
}
function ornekIstek(yol,yontem,govde){
  var v=ornekVeri(),j,m;
  function yan(o,s){o._s=s||200;return o}
  if(yol==='/app/cms'&&yontem==='GET')j=yan(JSON.parse(JSON.stringify(v)));
  else if(yol==='/app/cms/probe')j=govde.platform==='webflow'?yan({ok:true,account:{name:'Örnek Webflow',url:'https://ornek.webflow.io'},options:{
      collection:{label_tr:'Koleksiyon',label_en:'Collection',required:true,items:[{id:'c1',label:'Blog Posts'},{id:'c2',label:'News'}]},
      body_field:{label_tr:'Yazı alanı (Rich text)',label_en:'Body field (Rich text)',required:true,items:[{id:'f1',label:'Post Body',parent:'c1'},{id:'f2',label:'Content',parent:'c2'}]},
      image_field:{label_tr:'Kapak görseli alanı',label_en:'Cover image field',required:false,items:[{id:'i1',label:'Main Image',parent:'c1'}]}}})
    :yan({ok:true,account:{name:'Örnek Blog',url:str(govde.inputs&&govde.inputs.site_url)||'https://ornek.com'},options:{category:{label_tr:'Kategori',label_en:'Category',required:false,items:[{id:'1',label:'Genel'},{id:'5',label:'Pazarlama'}]}}});
  else if((yol==='/app/cms/connect'||yol==='/app/cmsoauth/start'||/\/settings$/.test(yol))&&+((govde&&govde.settings)||govde||{}).per_week>v.limits.per_week_max)j=yan({error:'plan_frequency',max:v.limits.per_week_max},403);
  else if(yol==='/app/cms/connect'){if(v.sites.filter(function(s){return s.state!=='kaldirildi'}).length>=v.limits.sites)j=yan({error:'site_limit'},403);
    else{var st=govde.settings||{},gp=saglayici(govde.platform),gi=govde.inputs||{},s={id:Date.now(),platform:(gp&&gp.stored_as)||govde.platform,provider:govde.platform,label:st.label||platAd(govde.platform),base_url:str(gi.site_url||gi.base_url)||null,hint:'9z8y',state:'aktif',last_error:null,auto_publish:st.auto_publish?1:0,per_week:st.per_week,days:st.days,hour:st.hour,lang:st.lang,length:st.length,tone:st.tone,brief:st.brief,topics:st.topics,choices:govde.choices,next_run_at:new Date(Date.now()+2*864e5).toISOString(),created_at:new Date().toISOString()};
      v.sites.unshift(s);v.limits.used+=1;j=yan({ok:true,site:JSON.parse(JSON.stringify(s))})}}
  else if(yol==='/app/cmsoauth/start')j=yan({ok:true,url:'https://example.com/oauth'});
  else if(yol==='/app/cmsoauth/finish'){if(!/^[A-Za-z0-9_-]{43}$/.test(str(govde&&govde.ticket)))j=yan({error:'forbidden'},403);
    else if(v.sites.filter(function(s){return s.state!=='kaldirildi'}).length>=v.limits.sites)j=yan({error:'site_limit'},403);
    else{var so={id:Date.now(),platform:'wpcom',label:'Örnek WordPress.com',base_url:'https://ornek.wordpress.com',hint:null,state:'aktif',last_error:null,auto_publish:0,per_week:1,days:[2],hour:10,lang:'tr',length:'medium',tone:null,brief:null,topics:[],next_run_at:new Date(Date.now()+2*864e5).toISOString(),created_at:new Date().toISOString()};
      v.sites.unshift(so);v.limits.used+=1;j=yan({ok:true,site:JSON.parse(JSON.stringify(so))})}}
  else if((m=/^\/app\/cmsposts\/([^/]+)\/(view|edit|skip|now|reschedule)$/.exec(yol))){var py=null;v.posts.forEach(function(x){if(String(x.id)===m[1])py=x});
    if(!py)j=yan({error:'not_found'},404);
    else if(m[2]==='skip'){if(py.state!=='hazir'&&py.state!=='uretiliyor')j=yan({error:'bad_input',field:'state'},400);else{if(py.state==='uretiliyor')v.quota.lb_used=Math.max(0,v.quota.lb_used-1);py.state='iptal';j=yan({ok:true,post:JSON.parse(JSON.stringify(py))})}}
    else if(py.state!=='hazir')j=yan({error:'bad_input',field:'state'},400);
    else if(m[2]==='view'){if(!py._md)py._md='## LinkedIn sayfası neden önemli?\n\nB2B alıcılar karar vermeden önce şirket sayfana bakar. Bu örnek yazı, önizleme ve düzenlemenin nasıl göründüğünü gösterir.\n\n## Ne sıklıkla paylaşmalı?\n\nHaftada iki-üç düzenli gönderi çoğu ekip için yeterlidir.';j=yan({ok:true,post:JSON.parse(JSON.stringify(py)),title:py.title,markdown:py._md,cover_url:null,cover_credit:null})}
    else if(m[2]==='edit'){py.title=str(govde.title).slice(0,300);py._md=str(govde.markdown);j=yan({ok:true,post:JSON.parse(JSON.stringify(py))})}
    else if(m[2]==='now'){py.state='gonderildi';py.remote_url='https://ornek.com/?p=44';j=yan({ok:true,post:JSON.parse(JSON.stringify(py))})}
    else{var at=Date.parse(str(govde.at));if(!(at>Date.now()-6e4&&at<=Date.now()+30*864e5))j=yan({error:'bad_input',field:'at'},400);else{py.publish_at=new Date(at).toISOString().slice(0,19).replace('T',' ');j=yan({ok:true,post:JSON.parse(JSON.stringify(py))})}}}
  else if((m=/^\/app\/cmsposts\/([^/]+)\/retry$/.exec(yol))){var p=null;v.posts.forEach(function(x){if(String(x.id)===m[1])p=x});if(p){p.state='gonderildi';p.last_error=null;p.remote_url='https://ornek.com/?p=43'}j=p?yan({ok:true,post:JSON.parse(JSON.stringify(p))}):yan({error:'not_found'},404)}
  else if((m=/^\/app\/cms\/([^/]+)\/(settings|run|pause|resume|disconnect)$/.exec(yol))){
    var s2=null;v.sites.forEach(function(x){if(String(x.id)===m[1])s2=x});
    if(!s2)j=yan({error:'not_found'},404);
    else if(m[2]==='settings'){Object.keys(govde||{}).forEach(function(k){s2[k]=govde[k]});s2.auto_publish=govde.auto_publish?1:0;j=yan({ok:true,site:JSON.parse(JSON.stringify(s2))})}
    else if(m[2]==='run'){var gun=new Date(Date.now()+108e5).toISOString().slice(0,10);
      if(s2.state!=='aktif')j=yan({error:'site_state',state:s2.state},409);
      else if(v.quota.lb_used>=v.quota.lb_limit)j=yan({error:'quota'},402);
      else if(s2._elle===gun)j=yan({error:'daily_limit'},429);
      else{s2._elle=gun;v.quota.lb_used+=1;var np={id:Date.now(),cms_site_id:s2.id,title:'',state:'uretiliyor',mode:s2.auto_publish?'publish':'draft',remote_url:null,last_error:null,created_at:new Date().toISOString()};v.posts.unshift(np);j=yan({ok:true,post:JSON.parse(JSON.stringify(np))})}}
    else{s2.state=m[2]==='pause'?'duraklatildi':m[2]==='resume'?'aktif':'kaldirildi';if(m[2]==='disconnect'){s2.hint=null;v.limits.used=Math.max(0,v.limits.used-1)}j=yan({ok:true,site:JSON.parse(JSON.stringify(s2))})}
  }else j=yan({error:'not_found'},404);
  return new Promise(function(r){setTimeout(function(){r(j)},400)});
}
})();
