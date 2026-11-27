/* SMC Chatbot paneli — assets/chatbot.js (cb1)
 * Sözleşme: SOZLESME.md §7 (panel uçları /gen/bot…), §11 (panel sayfası). smc-hesap.js kancası (INTEGRASYON §12.9):
 *   window.smcBotBasla({istek, bildir, genelHata, mesgul, bosMu, dlgAc, ORNEK, dil, kullanici})
 * Kurallar: yalnız textContent/createElement (HTML dizgesi yorumlayan API YOK); satır içi stil YOK
 *   (CSP style-src 'self'; dinamik değer yalnız el.style.setProperty('--x', …)); localStorage her erişimde try/catch.
 *
 * SÖZLEŞME DIŞI: Otomatik kayıt. §11.2 yalnız "Kaydet" düğmesi tanımlar; en yakın kural (yalnız değişen üst alanlar + surum)
 *   aynen uygulanır: değişiklikten 1500 ms sonra kayıt; yerel doğrulama geçmezse otomatik kayıt atlanır ("Kaydedilmedi: eksik
 *   alanlar var" + Göster), uçuşta kayıt varken yenisi kuyruğa alınır, 409 cakisma'da otomatik kayıt durur. Kaydet düğmesi kalır.
 * SÖZLEŞME DIŞI: İlk kurulum sihirbazı. Hiç bot yokken (ya da "Yeni bot") 3 adım: ad + mod → cevaplar/AI → kanal. Bitişte
 *   POST /gen/bot {ad, mod, dil, sablon}, gerekiyorsa ardından POST /gen/bot/:id {surum, ai, web}.
 * SÖZLEŞME DIŞI: Sayfa tek kaydırma. Test önizlemesi ≥1100px'te yapışkan yan alan, altında alt çekmece (<dialog>); iki ayrı
 *   kayan sütun yok. Gelen kutusunda liste → ayrıntı geçişi her genişlikte.
 */
(function(){
'use strict';
var d=document;

window.smcBotBasla=function(api){
  var kok=d.getElementById('cb-kok');
  if(!kok||kok.getAttribute('data-kuruldu'))return;
  kok.setAttribute('data-kuruldu','1');

  var EN=api.dil==='en',LOC=EN?'en-US':'tr-TR',ORNEK=!!api.ORNEK;
  function T(tr,en){return EN?en:tr}
  function f(s,p){return String(s).replace(/\{(\w+)\}/g,function(m,k){return p&&p[k]!=null?String(p[k]):m})}
  function bildir(m,tur){api.bildir(m,tur)}
  var istek=ORNEK?ornekIstek:api.istek;

  /* ---------- sabitler (SOZLESME §2, §4.1, §7.5) ---------- */
  var SN={AD:60,KARSILAMA:300,GERI:300,DEVIR:300,BASLIK:40,PERSONA:600,BILGI:20000,NIYET:100,MENU:13,ALAN:10,MESAJ:500,
    ETIKET:20,ORNEK:20,ORNEK_UZ:120,ANAHTAR:30,ANAHTAR_UZ:40,CEVAP:1000,NIYET_AD:60,BUTON:13};
  var HEDEF_RE=/^(n:[a-z0-9_-]{1,24}|lead|insan|menu|url:https:\/\/[^\s]{1,300})$/;
  var K_RE=/^[a-z0-9_-]{1,24}$/;
  var ALAN_RE=/^(\*\.)?([a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$|^localhost$|^127\.0\.0\.1$/;
  var RENK_RE=/^#[0-9a-fA-F]{6}$/;
  var METIN={
    tr:{karsilama:'Merhaba! Size nasıl yardımcı olabilirim?',geri:'Bunu tam anlayamadım. Aşağıdan bir konu seçebilir ya da sorunuzu farklı yazabilirsiniz.',
      devir:'Sizi ekibimize aktarıyorum; en kısa sürede buradan dönüş yapacaklar.',lead_istek:'Size dönebilmemiz için iletişim bilgilerinizi bırakır mısınız?',
      btn_lead:'Bilgilerimi bırak',btn_insan:'Bir insanla görüş'},
    en:{karsilama:'Hi! How can I help you?',geri:"I didn't quite get that. Pick a topic below or rephrase your question.",
      devir:"I'm passing you to our team; they'll reply here as soon as possible.",lead_istek:'Could you leave your contact details so we can get back to you?',
      btn_lead:'Leave my details',btn_insan:'Talk to a human'}
  };
  var MODLAR=[
    {d:'hazir',ad:T('Hazır cevap','Quick replies'),acik:T('Yazdığın cevaplarla birebir cevap verir. Kota dostu, öngörülebilir.','Answers only with replies you wrote. Predictable.')},
    {d:'ai',ad:'AI',acik:T('Bilgi tabanına dayanarak kendi cümleleriyle cevap verir.','Answers in its own words from your knowledge base.')},
    {d:'karma',ad:T('Karma','Hybrid'),acik:T('Önce hazır cevaplara bakar, bulamazsa AI devreye girer.','Tries quick replies first, falls back to AI.')}
  ];
  var KAYNAK={hazir:T('Hazır','Quick reply'),ai:'AI',geri:T('Geri dönüş','Fallback'),kota:T('Kota','Quota'),devir:T('Devir','Handoff'),
    lead:'Lead',karsilama:T('Karşılama','Welcome'),menu:T('Menü','Menu'),eslesmedi:T('Eşleşmedi','No match')};
  var SEKMELER=[{d:'cevaplar',ad:T('Cevaplar','Replies')},{d:'ai',ad:'AI'},{d:'kanallar',ad:T('Kanallar','Channels')},
    {d:'gelen',ad:T('Gelen','Inbox')},{d:'istatistik',ad:T('İstatistik','Stats')}];
  var PLANLAR=EN?'/en/pricing':'/fiyatlar';
  var BAGLANTILAR=EN?'/en/hesap/connections':'/hesap/baglantilar';
  var UST=['ad','mod','aktif','dil','karsilama','geri_donus','devir_mesaji','bulunamazsa','menu','niyetler','ai','web'];

  /* ---------- DOM yardımcıları ---------- */
  function h(tag,o){
    var e=d.createElement(tag);
    if(o)for(var k in o){var v=o[k];if(v==null||v===false)continue;
      if(k==='class')e.className=v;else if(k==='text')e.textContent=v;
      else if(k.slice(0,2)==='on'&&typeof v==='function')e.addEventListener(k.slice(2),v);
      else if(k==='value')e.value=v;else if(k==='checked')e.checked=!!v;
      else e.setAttribute(k,v===true?'':String(v));}
    for(var i=2;i<arguments.length;i++)ekle(e,arguments[i]);
    return e;
  }
  function ekle(e,c){if(c==null||c===false)return;if(Array.isArray(c)){c.forEach(function(x){ekle(e,x)});return}
    e.appendChild(typeof c==='object'?c:d.createTextNode(String(c)))}
  function bosalt(e){while(e&&e.firstChild)e.removeChild(e.firstChild);return e}
  var SVGNS='http://www.w3.org/2000/svg';
  function sv(tag,at){var e=d.createElementNS(SVGNS,tag);for(var k in at)e.setAttribute(k,String(at[k]));return e}
  var IK={sohbet:'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',arti:'M12 5v14M5 12h14',
    cop:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',yukari:'M6 15l6-6 6 6',asagi:'M6 9l6 6 6-6',
    tut:'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',kapat:'M6 6l12 12M18 6L6 18',gonder:'M4 12l16-8-6 16-2-7-8-1z',
    uyari:'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',geri:'M15 18l-6-6 6-6',
    kopya:'M8 8h12v12H8zM4 16V4h12',indir:'M12 4v12M6 10l6 6 6-6M4 20h16',tamam:'M5 12l5 5 9-10',ac:'M9 6l6 6-6 6',yenile:'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7'};
  function ikon(ad){var s=sv('svg',{viewBox:'0 0 24 24','class':'cb-ikon','aria-hidden':'true',focusable:'false'});s.appendChild(sv('path',{d:IK[ad]}));return s}
  function sr(t){return h('span',{class:'sr',text:t})}
  var uid=0;function yid(p){return 'cb-'+(p||'x')+'-'+(++uid)}
  function dugme(cls,metin,fn,o){
    var b=h('button',Object.assign({type:'button',class:'btn '+cls},o||{}));
    if(o&&o.ik)b.removeAttribute('ik');
    if(o&&o.ik)b.appendChild(ikon(o.ik));
    if(metin)b.appendChild(d.createTextNode(metin));
    if(fn)b.addEventListener('click',function(e){if(!api.bosMu(b))fn(b,e)});
    return b;
  }
  function ikonDugme(ad,etiket,fn,cls){
    var b=h('button',{type:'button',class:'cb-ikon-d'+(cls?' '+cls:''),'aria-label':etiket,title:etiket},ikon(ad));
    if(fn)b.addEventListener('click',function(e){if(!api.bosMu(b))fn(b,e)});
    return b;
  }
  function kopyala(o){return JSON.parse(JSON.stringify(o))}
  function esit(a,b){return JSON.stringify(a)===JSON.stringify(b)}
  function utc(s){if(!s)return null;s=String(s);var x=new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s)?s:s.replace(' ','T')+'Z');return isNaN(x.getTime())?null:x}
  function zaman(s,uzun){var x=utc(s);if(!x)return '';try{
    if(!uzun&&x.toDateString()===new Date().toDateString())return x.toLocaleTimeString(LOC,{hour:'2-digit',minute:'2-digit'});
    return x.toLocaleString(LOC,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch(e){return s}}
  function gunAd(s){var x=utc(s+' 12:00:00');try{return x?x.toLocaleDateString(LOC,{day:'numeric',month:'short'}):s}catch(e){return s}}
  function sayi(n){try{return Number(n||0).toLocaleString(LOC)}catch(e){return String(n||0)}}
  function lsAl(k){try{return window.localStorage.getItem(k)}catch(e){return null}}
  function lsYaz(k,v){try{window.localStorage.setItem(k,v)}catch(e){}}
  function metinVars(b,ad){var dl=(b&&b.dil==='en')?'en':'tr';return METIN[dl][ad]}
  function botAdi(b){return (b&&b.ad)||T('Adsız bot','Untitled bot')}

  /* ---------- durum ---------- */
  var S={botlar:[],kota:null,igAcik:false,bot:null,tas:null,sekme:'cevaplar',acik:{},
    gelen:{gor:'konusmalar',filtre:'',liste:[],devam:false,yuk:false,secili:null,detay:null,leadDurum:'',leadler:[],leadDevam:false,leadToplam:0},
    ist:{gun:30,veri:null},test:[],testMesgul:false};
  var KZ={t:null,ucuyor:false,tekrar:false,durdu:false,son:'',kayitZaman:0};
  var ALAN={};
  var R={};
  var onayFn=null,onayDlg=d.getElementById('dlg-cb-onay');

  /* ---------- ekran ---------- */
  function ekranGoster(ad){
    var s=d.querySelectorAll('[data-ekran]');
    for(var i=0;i<s.length;i++)s[i].hidden=s[i].getAttribute('data-ekran')!==ad;
    var ic=d.getElementById('icerik');if(ic)ic.removeAttribute('aria-busy');
    var x=d.querySelector('[data-ekran="'+ad+'"] h1');if(x&&ad!=='ana')x.focus();
  }
  function hataEkrani(kod){var k=d.getElementById('hata-kod');if(k)k.textContent=f(T('Kod: {k}','Code: {k}'),{k:kod||'network'});ekranGoster('hata')}
  function bolumYok(j){return j._s===404||(j._s===503&&j.error==='not_ready')}
  function hataMetni(j){
    if(!j)return T('Bir sorun oldu.','Something went wrong.');
    if(j.error==='bot_limit')return f(T('Planında en çok {limit} bot kurabilirsin.','Your plan allows up to {limit} bots.'),{limit:j.limit!=null?j.limit:(S.kota&&S.kota.bot?S.kota.bot.limit:'?')});
    if(j.error==='hiz')return f(T('Biraz yavaşla, {n} sn sonra dene.','Slow down a little, try again in {n} s.'),{n:j.retry_after||5});
    if(j.error==='deneme_bitti')return T('Deneme süren bitti; bot şu an kapalı.','Your trial has ended; the bot is off for now.');
    if(j.error==='cakisma')return T('Bu bot başka bir sekmede değişti. Sayfayı yenile.','This bot changed in another tab. Reload the page.');
    var m={too_large:T('İçerik çok uzun; kısaltıp yeniden dene.','The content is too long; shorten it and try again.'),
      kapali:T('Bot şu an kapalı.','The bot is off for now.'),
      ig_kapali:T('Instagram DM yakında: Meta onayı bekleniyor.','Instagram DMs are coming soon: waiting for Meta approval.'),
      ig_bagli_degil:T('Önce Instagram hesabını bağla.','Connect your Instagram account first.'),
      ig_izin_yok:T('Mesaj izni yok; Instagram\'ı yeniden bağla.','No messaging permission; reconnect Instagram.'),
      ig_abone_hata:T('Instagram bağlantısı kurulamadı; biraz sonra yeniden dene.','Couldn\'t subscribe to Instagram; try again shortly.'),
      ig_baska_botta:T('Bu Instagram hesabı başka bir botta kullanılıyor.','This Instagram account is used by another bot.'),
      ig_kullanilamiyor:T('Bu Instagram hesabı başka bir hesapta kullanılıyor.','This Instagram account is used by another account.')}[j.error];
    if(m)return m;
    return '';
  }
  /* 401/403 origin/ağ → smc-hesap genelHata; tanınan kodlar → kendi metni */
  function hataBildir(j){var m=hataMetni(j);if(m&&j._s!==401){bildir(m,'hata');return}api.genelHata(j)}

  function onayla(baslik,metin,evet,fn,tetik){
    if(!onayDlg){if(window.confirm(baslik+'\n'+metin))fn();return}
    d.getElementById('dlg-cb-onay-b').textContent=baslik;
    d.getElementById('dlg-cb-onay-a').textContent=metin;
    d.getElementById('cb-onay-evet').textContent=evet;
    onayFn=fn;api.dlgAc(onayDlg,tetik);
  }
  if(onayDlg){
    d.getElementById('cb-onay-evet').addEventListener('click',function(){var fn=onayFn;onayFn=null;onayDlg.close();if(fn)fn()});
    onayDlg.addEventListener('close',function(){onayFn=null});
  }

  /* ---------- başlangıç ---------- */
  ekranGoster('ana');
  basla();

  function basla(){
    istek('/gen/bot','GET').then(function(j){
      if(!j.ok){
        if(j._s===401||(j._s===403&&j.error==='origin')){api.genelHata(j);return}
        if(bolumYok(j)){ekranGoster('yakinda');return}
        hataEkrani(j.error||j._s);return;
      }
      S.botlar=(j.botlar||[]).slice().sort(function(a,b){return a.id-b.id});
      S.kota=j.kota||null;S.igAcik=!!j.ig_acik;
      if(!S.botlar.length){sihirbaz(false);return}
      var son=Number(lsAl('smc-cb-bot'));
      var sec=S.botlar.filter(function(b){return b.id===son})[0]||S.botlar[0];
      botYukle(sec.id);
    });
  }
  function yukleniyor(m){bosalt(kok);kok.appendChild(h('p',{class:'cb-yukleniyor',role:'status',text:m||T('Yükleniyor…','Loading…')}))}

  function botYukle(id){
    yukleniyor(T('Bot yükleniyor…','Loading the bot…'));
    istek('/gen/bot/'+id,'GET').then(function(j){
      if(!j.ok){
        if(bolumYok(j)&&j.error!=='bulunamadi'){ekranGoster('yakinda');return}
        if(j.error==='bulunamadi'||j.error==='not_found'){lsYaz('smc-cb-bot','');S.botlar=S.botlar.filter(function(b){return b.id!==id});
          if(S.botlar.length)botYukle(S.botlar[0].id);else sihirbaz(false);return}
        if(j._s===401||(j._s===403&&j.error==='origin')){api.genelHata(j);return}
        hataEkrani(j.error||j._s);return;
      }
      if(j.kota)S.kota=j.kota;
      S.bot=kopyala(j.bot);S.tas=kopyala(j.bot);S.acik={};S.test=[];
      KZ.durdu=false;KZ.son='';KZ.kayitZaman=0;
      S.gelen.secili=null;S.gelen.detay=null;S.gelen.liste=[];S.gelen.leadler=[];S.ist.veri=null;
      lsYaz('smc-cb-bot',String(id));
      listeGuncelle(j.bot);
      editorCiz();
    });
  }
  function listeGuncelle(b){
    var var_=false;S.botlar=S.botlar.map(function(x){if(x.id===b.id){var_=true;return Object.assign({},x,{ad:b.ad,mod:b.mod,aktif:b.aktif,web:b.web,ig:b.ig,ozet:b.ozet})}return x});
    if(!var_)S.botlar.push(b);
    S.botlar.sort(function(a,c){return a.id-c.id});
  }
  function sinirDisi(id){
    if(!S.kota||!S.kota.bot)return false;
    var i=S.botlar.map(function(b){return b.id}).indexOf(id);
    return i>=S.kota.bot.limit;
  }
  function limitDolu(){return !!(S.kota&&S.kota.bot&&S.kota.bot.used>=S.kota.bot.limit)}

  /* =====================================================================
   * SİHİRBAZ (SÖZLEŞME DIŞI): 3 adım
   * ===================================================================== */
  function sihirbaz(vazgecilir){
    var w={adim:1,ad:'',mod:'karma',sablon:'genel',bilgi:'',webAktif:true,alanlar:[]};
    var kutu=h('div',{class:'cb-sihirbaz sheet'});
    bosalt(kok);
    if(S.botlar.length===0)kok.appendChild(h('div',{class:'bos cb-bos'},
      h('p',{class:'ust-etiket',text:T('İlk botunu kur','Set up your first bot')}),
      h('p',{text:T('Üç kısa adımda sitene ve Instagram\'ına cevap veren bir sohbet botu kur. Sonra her şeyi değiştirebilirsin.','Build a chat bot for your site and Instagram in three short steps. You can change everything later.')})));
    kok.appendChild(kutu);
    ciz();
    function adimlar(){
      var ad=[T('Ad ve mod','Name & mode'),w.mod==='ai'?T('Bilgi','Knowledge'):T('Cevaplar','Replies'),T('Kanal','Channel')];
      return h('ol',{class:'cb-adimlar','aria-label':T('Kurulum adımları','Setup steps')},ad.map(function(a,i){
        return h('li',{class:i+1===w.adim?'cb-adim-su':(i+1<w.adim?'cb-adim-bitti':''),'aria-current':i+1===w.adim?'step':null},
          h('span',{class:'cb-adim-no','aria-hidden':'true',text:String(i+1)}),h('span',{text:a}));
      }));
    }
    function ciz(odak){
      bosalt(kutu);
      kutu.appendChild(adimlar());
      var bas=h('h2',{class:'cb-sih-baslik',tabindex:'-1'});kutu.appendChild(bas);
      var hata=h('p',{class:'alan-hata',role:'alert'});
      if(w.adim===1){
        bas.textContent=T('Botuna bir ad ver ve nasıl cevap vereceğini seç','Name your bot and choose how it answers');
        var a=alanKutu({etiket:T('Bot adı','Bot name'),deger:w.ad,max:SN.AD,yer:T('Ör. Mağaza asistanı','e.g. Store assistant'),
          ipucu:T('Yalnız sen görürsün; sohbet başlığını sonra ayrıca seçebilirsin.','Only you see this; you can set the chat title later.'),
          giris:function(v){w.ad=v}});
        kutu.appendChild(a.kok);
        kutu.appendChild(modSecici(w.mod,function(m){w.mod=m},'sih'));
        kutu.appendChild(hata);
        a.inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();ileri()}});
      }else if(w.adim===2){
        bas.textContent=w.mod==='ai'?T('AI neye dayanarak cevap versin?','What should the AI answer from?'):T('Hazır cevaplarla nasıl başlayalım?','How should we start your quick replies?');
        if(w.mod!=='ai'||true){
          var sg=h('fieldset',{class:'secim-grup'},h('legend',{text:w.mod==='ai'?T('Yedek hazır cevaplar','Backup quick replies'):T('Başlangıç','Starting point')}));
          var ss=h('div',{class:'cb-kartlar'});
          [{d:'genel',ad:T('Hazır şablonla başla','Start from a template'),acik:T('Fiyatlar, Çalışma saatleri, İletişim, İade ve kargo için örnek cevaplar. Köşeli parantezli yerleri doldurursun.','Sample replies for Pricing, Opening hours, Contact, Returns & shipping. You fill in the bracketed parts.')},
           {d:'bos',ad:T('Boş başla','Start empty'),acik:T('Cevapları kendin yazarsın.','You write the replies yourself.')}].forEach(function(o){
            ss.appendChild(radyoKart('cb-sih-sablon',o.d,o.ad,o.acik,w.sablon===o.d,function(){w.sablon=o.d}));
          });
          sg.appendChild(ss);kutu.appendChild(sg);
          if(w.mod==='ai')kutu.appendChild(h('p',{class:'ipucu',text:T('AI modunda bu cevaplar, AI kotası dolarsa yedek olarak kullanılır.','In AI mode these replies are used as a backup when your AI quota runs out.')}));
        }
        if(w.mod!=='hazir'){
          var b=alanKutu({etiket:T('Bilgi tabanı','Knowledge base'),tur:'textarea',deger:w.bilgi,max:SN.BILGI,binlik:true,
            yer:T('Ürünlerin, fiyatların, kargo ve iade koşulların, çalışma saatlerin…','Your products, prices, shipping and returns, opening hours…'),
            ipucu:T('AI yalnız buraya yazdıklarına dayanarak cevap verir; emin olmadığında ziyaretçiyi sana yönlendirir. Sonra da ekleyebilirsin.','The AI answers only from what you write here; when unsure it sends the visitor to you. You can add this later too.'),
            giris:function(v){w.bilgi=v}});
          b.inp.classList.add('cb-bilgi');
          kutu.appendChild(b.kok);
        }
      }else{
        bas.textContent=T('Bot nerede konuşsun?','Where should the bot talk?');
        kutu.appendChild(anahtar(T('Web sitemde göster','Show on my website'),w.webAktif,function(v){w.webAktif=v;alanK.kok.hidden=!v}));
        var alanK=cipAlan({etiket:T('Sitenin alan adı','Your site\'s domain'),yer:'ornek.com',max:SN.ALAN,maxUz:253,alanAdi:true,
          ipucu:T('Bot yalnız bu alan adlarında çalışır. Alt alan adları için *.ornek.com yaz. Enter ile ekle.','The bot only runs on these domains. Use *.example.com for subdomains. Press Enter to add.'),
          al:function(){return w.alanlar},yaz:function(l){w.alanlar=l}});
        alanK.kok.hidden=!w.webAktif;
        kutu.appendChild(alanK.kok);
        kutu.appendChild(h('div',{class:'cb-not'},ikon('sohbet'),h('p',{text:T('Instagram DM bağlantısını bot oluştuktan sonra Kanallar sekmesinden açarsın.','You can turn on Instagram DMs from the Channels tab after the bot is created.')})));
        kutu.appendChild(hata);
      }
      var alt=h('div',{class:'cb-sih-alt'});
      if(w.adim>1)alt.appendChild(dugme('btn-cizgi',T('Geri','Back'),function(){w.adim--;ciz(true)}));
      else if(vazgecilir)alt.appendChild(dugme('btn-metin',T('Vazgeç','Cancel'),function(){botYukle(S.bot?S.bot.id:S.botlar[0].id)}));
      var ana=dugme('btn-ana',w.adim<3?T('İleri','Next'):T('Botu oluştur','Create bot'),function(b){ileri(b)});
      alt.appendChild(ana);
      kutu.appendChild(alt);
      if(odak)bas.focus();
      function ileri(btn){
        hata.textContent='';
        if(w.adim===1){
          if(!w.ad.trim()){hata.textContent=T('Botuna bir ad ver.','Give your bot a name.');var i=kutu.querySelector('input');if(i){i.setAttribute('aria-invalid','true');i.focus()}return}
          w.adim=2;ciz(true);return;
        }
        if(w.adim===2){w.adim=3;ciz(true);return}
        if(w.webAktif&&!w.alanlar.length){hata.textContent=T('En az bir alan adı ekle ya da web kanalını kapat.','Add at least one domain or turn off the web channel.');var c=kutu.querySelector('.cb-cip-giris');if(c)c.focus();return}
        olustur(btn||ana);
      }
    }
    function olustur(btn){
      var geri=api.mesgul(btn,T('Oluşturuluyor…','Creating…'));
      istek('/gen/bot','POST',{ad:w.ad.trim(),mod:w.mod,dil:EN?'en':'tr',sablon:w.sablon}).then(function(j){
        if(!j.ok){geri();
          if(j.error==='invalid'){bildir(T('Bot adını kontrol et.','Check the bot name.'),'hata');w.adim=1;ciz(true);return}
          if(j.kota)S.kota=j.kota;hataBildir(j);return}
        if(j.kota)S.kota=j.kota;
        var bot=j.bot,ek={};
        if(w.mod!=='hazir'&&w.bilgi.trim())ek.ai={persona:(bot.ai&&bot.ai.persona)||'',ton:(bot.ai&&bot.ai.ton!=null)?bot.ai.ton:50,bilgi:w.bilgi};
        if(w.alanlar.length)ek.web={aktif:!!w.webAktif,alanlar:w.alanlar,gorunum:(bot.web&&bot.web.gorunum)||{renk:'#4f46e5',konum:'sag',baslik:''}};
        var son=function(b2){geri();listeGuncelle(b2);S.sekme='cevaplar';botYukleHazir(b2);
          bildir(T('Bot hazır. Önizlemeden hemen deneyebilirsin.','Your bot is ready. Try it in the preview.'),'ok')};
        if(!Object.keys(ek).length){son(bot);return}
        istek('/gen/bot/'+bot.id,'POST',Object.assign({surum:bot.surum},ek)).then(function(j2){
          if(j2.ok){son(j2.bot);return}
          son(bot);bildir(T('Bot oluştu ama bazı ayarlar kaydedilemedi; Kanallar ve AI sekmelerinden tamamla.','The bot was created but some settings were not saved; finish them in the Channels and AI tabs.'),'uyari');
        });
      });
    }
  }
  function botYukleHazir(b){
    S.bot=kopyala(b);S.tas=kopyala(b);S.acik={};S.test=[];KZ.durdu=false;KZ.son='';KZ.kayitZaman=0;
    S.gelen.secili=null;S.gelen.detay=null;S.gelen.liste=[];S.gelen.leadler=[];S.ist.veri=null;
    lsYaz('smc-cb-bot',String(b.id));editorCiz();
  }

  /* =====================================================================
   * FORM PARÇALARI
   * ===================================================================== */
  function sayac(n,max,binlik){var t=binlik?sayi(n)+' / '+sayi(max):n+' / '+max;return t}
  /* o: {etiket, tur, deger, max, yer, ipucu, alan, giris(v), binlik, tip, satir} */
  function alanKutu(o){
    var id=yid('a'),hid=id+'-hata',iid=id+'-ip';
    var inp=h(o.tur==='textarea'?'textarea':'input',{class:'kutu',id:id,type:o.tur==='textarea'?null:(o.tip||'text'),
      maxlength:o.max||null,placeholder:o.yer||null,rows:o.satir||null,autocomplete:o.tur==='textarea'?null:'off',
      'aria-describedby':(o.ipucu?iid+' ':'')+hid});
    inp.value=o.deger||'';
    var sy=o.max?h('span',{class:'sayac','aria-hidden':'true'}):null;
    function syGuncelle(){if(!sy)return;var n=inp.value.length;sy.textContent=sayac(n,o.max,o.binlik);sy.classList.toggle('sayac-uyari',n>=o.max*0.9)}
    syGuncelle();
    inp.addEventListener('input',function(){syGuncelle();hataSil(inp);if(o.giris)o.giris(inp.value)});
    var hataEl=h('p',{class:'alan-hata',id:hid});
    var kokE=h('div',{class:'alan-k'},h('label',{class:'etiket','for':id,text:o.etiket}),inp,
      (o.ipucu||sy)?h('div',{class:'alan-alt'},o.ipucu?h('span',{class:'ipucu',id:iid,text:o.ipucu}):h('span'),sy):null,hataEl);
    if(o.alan)kaydetAlan(o.alan,inp,hataEl);
    return {kok:kokE,inp:inp,hata:hataEl};
  }
  function kaydetAlan(yol,inp,hataEl){ALAN[yol]={i:inp,h:hataEl}}
  function hataSil(inp){if(inp.getAttribute('aria-invalid')){inp.removeAttribute('aria-invalid');var x=d.getElementById(inp.id+'-hata');if(x)x.textContent=''}}
  function anahtar(etiket,acik,fn,o){
    o=o||{};
    var inp=h('input',{type:'checkbox',role:'switch',class:'cb-anahtar-g',checked:acik,'aria-describedby':o.tarif||null});
    inp.addEventListener('change',function(){fn(inp.checked,inp)});
    var l=h('label',{class:'cb-anahtar'+(o.kucuk?' cb-anahtar-k':'')},inp,h('span',{class:'cb-anahtar-iz','aria-hidden':'true'}),
      h('span',{class:o.gizliEtiket?'sr':'cb-anahtar-ad',text:etiket}));
    l.girdi=inp;
    return l;
  }
  function radyoKart(ad,deger,baslik,acik,secili,fn){
    var id=yid('r');
    var inp=h('input',{type:'radio',name:ad,id:id,value:deger,checked:secili,'aria-describedby':acik?id+'-a':null});
    inp.addEventListener('change',function(){if(inp.checked)fn(deger)});
    return h('div',{class:'cb-radyo-kart'},inp,h('label',{'for':id},h('strong',{text:baslik}),acik?h('span',{id:id+'-a',text:acik}):null));
  }
  function segment(ad,etiket,secenekler,secili,fn,o){
    o=o||{};
    var lid=yid('s');
    var kap=h('div',{class:'cb-seg-kap'});
    if(etiket)kap.appendChild(h('span',{class:o.gizli?'sr':'etiket',id:lid,text:etiket}));
    var s=h('div',{class:'segment',role:'radiogroup','aria-labelledby':etiket?lid:null});
    secenekler.forEach(function(x){
      var id=yid('g');
      var inp=h('input',{type:'radio',name:ad,id:id,value:x.d,checked:x.d===secili});
      inp.addEventListener('change',function(){if(inp.checked)fn(x.d)});
      var lb=h('label',{'for':id},x.ad);
      if(x.rozet)lb.appendChild(x.rozet);
      s.appendChild(h('span',{class:'secim'},inp,lb));
    });
    kap.appendChild(s);
    return kap;
  }
  function modSecici(secili,fn,onek){
    var kap=h('fieldset',{class:'secim-grup cb-mod'});
    kap.appendChild(h('legend',{text:T('Cevap modu','Answer mode')}));
    var ic=h('div',{class:'cb-kartlar cb-kartlar-3',role:'radiogroup','aria-label':T('Cevap modu','Answer mode')});
    MODLAR.forEach(function(m){ic.appendChild(radyoKart('cb-mod-'+onek,m.d,m.ad,m.acik,secili===m.d,fn))});
    kap.appendChild(ic);
    return kap;
  }
  /* Çip alanı. o:{etiket, yer, ipucu, max, maxUz, al(), yaz(l), alan, alanAdi} */
  function normAlan(v){
    v=String(v||'').trim().toLowerCase().replace(/^https?:\/\//,'');
    v=v.replace(/[/?#].*$/,'').replace(/:\d+$/,'').replace(/\.$/,'');
    var yildiz=v.indexOf('*.')===0;if(yildiz)v=v.slice(2);
    try{if(v&&v!=='localhost'&&!/^[a-z0-9.-]+$/.test(v))v=new URL('https://'+v).hostname}catch(e){}
    return (yildiz?'*.':'')+v;
  }
  function cipAlan(o){
    var id=yid('c'),hid=id+'-hata',iid=id+'-ip';
    var liste=h('ul',{class:'cb-cipler','aria-label':o.etiket});
    var inp=h('input',{class:'kutu cb-cip-giris',id:id,type:'text',maxlength:o.maxUz||null,placeholder:o.yer||'',autocomplete:'off',
      enterkeyhint:'done','aria-describedby':(o.ipucu?iid+' ':'')+hid});
    var ekleB=dugme('btn-cizgi btn-kucuk',T('Ekle','Add'),function(){ekleIt()});
    var sy=h('span',{class:'sayac'});
    var hataEl=h('p',{class:'alan-hata',id:hid});
    function ciz(){
      bosalt(liste);var l=o.al();
      l.forEach(function(v,i){
        liste.appendChild(h('li',{class:'cb-cip'},h('span',{class:'cb-cip-m',text:v}),
          ikonDugme('kapat',f(T('Kaldır: {v}','Remove: {v}'),{v:v}),function(){
            var y=o.al().slice();y.splice(i,1);o.yaz(y);ciz();
            var sonraki=liste.querySelectorAll('button')[Math.min(i,y.length-1)];(sonraki||inp).focus();
          },'cb-cip-x')));
      });
      liste.hidden=!l.length;
      sy.textContent=l.length+' / '+o.max;sy.classList.toggle('sayac-uyari',l.length>=o.max);
      var dolu=l.length>=o.max;inp.disabled=dolu;ekleB.setAttribute('aria-disabled',dolu?'true':'false');
    }
    function ekleIt(){
      var v=o.alanAdi?normAlan(inp.value):inp.value.trim().replace(/\s+/g,' ');
      hataEl.textContent='';inp.removeAttribute('aria-invalid');
      if(!v)return;
      var l=o.al().slice();
      var hata='';
      if(l.length>=o.max)hata=f(T('En çok {n} tane ekleyebilirsin.','You can add up to {n}.'),{n:o.max});
      else if(o.alanAdi&&!ALAN_RE.test(v))hata=T('Geçerli bir alan adı yaz, ör. ornek.com','Enter a valid domain, e.g. example.com');
      else if(l.map(function(x){return x.toLowerCase()}).indexOf(v.toLowerCase())>=0)hata=T('Bu zaten ekli.','Already added.');
      if(hata){hataEl.textContent=hata;inp.setAttribute('aria-invalid','true');return}
      l.push(v);o.yaz(l);inp.value='';ciz();inp.focus();
    }
    inp.addEventListener('keydown',function(e){
      if(e.key==='Enter'||(o.alanAdi&&e.key===',')){e.preventDefault();ekleIt()}
      else if(e.key==='Backspace'&&!inp.value&&o.al().length){var b=liste.querySelectorAll('button');if(b.length)b[b.length-1].focus()}
    });
    inp.addEventListener('input',function(){if(inp.getAttribute('aria-invalid')){inp.removeAttribute('aria-invalid');hataEl.textContent=''}});
    ciz();
    var kokE=h('div',{class:'alan-k cb-cip-alan'},h('label',{class:'etiket','for':id,text:o.etiket}),liste,
      h('div',{class:'cb-cip-sira'},inp,ekleB),
      h('div',{class:'alan-alt'},o.ipucu?h('span',{class:'ipucu',id:iid,text:o.ipucu}):h('span'),sy),hataEl);
    if(o.alan)kaydetAlan(o.alan,inp,hataEl);
    return {kok:kokE,inp:inp,ciz:ciz};
  }

  /* Buton düzenleyici. o:{al(), yaz(l), yol, max, baslik, onIzle} */
  function hedefTur(h_){if(!h_)return 'menu';if(h_.indexOf('n:')===0)return h_;if(h_.indexOf('url:')===0)return 'url';return h_}
  function butonDuzenleyici(o){
    var kap=h('div',{class:'cb-butonlar'});
    var oniz=h('div',{class:'cb-pil-sira','aria-label':T('Önizleme','Preview')});
    function ciz(odakIndex,deg){
      bosalt(kap);
      var l=o.al();
      var ul=h('ul',{class:'cb-buton-liste'});
      l.forEach(function(b,i){
        var eid=yid('be'),sid=yid('bs'),uid2=yid('bu');
        var et=h('input',{class:'kutu',id:eid,type:'text',maxlength:SN.ETIKET,value:b.etiket||'',placeholder:T('Buton yazısı','Button label'),
          'aria-describedby':eid+'-hata'});
        et.addEventListener('input',function(){hataSil(et);var y=o.al();y[i].etiket=et.value;o.yaz(y);pilCiz()});
        var tur=hedefTur(b.hedef);
        var sel=h('select',{class:'kutu',id:sid,'aria-describedby':sid+'-hata'});
        var ng=h('optgroup',{label:T('Cevaba git','Go to reply')});
        (S.tas.niyetler||[]).forEach(function(n){ng.appendChild(h('option',{value:'n:'+n.k,text:n.ad||n.k}))});
        if(tur.indexOf('n:')===0&&!(S.tas.niyetler||[]).some(function(n){return 'n:'+n.k===tur}))ng.appendChild(h('option',{value:tur,text:T('(silinmiş cevap)','(deleted reply)')}));
        if(ng.children.length)sel.appendChild(ng);
        var eg=h('optgroup',{label:T('Eylem','Action')});
        [['lead',T('Bilgi bırak','Leave details')],['insan',T('İnsana bağlan','Talk to a human')],['menu',T('Menüyü göster','Show menu')],['url',T('Bağlantı URL','Link URL')]]
          .forEach(function(x){eg.appendChild(h('option',{value:x[0],text:x[1]}))});
        sel.appendChild(eg);
        sel.value=tur;
        var url=h('input',{class:'kutu',id:uid2,type:'url',inputmode:'url',placeholder:'https://',maxlength:304,
          value:b.hedef&&b.hedef.indexOf('url:')===0?b.hedef.slice(4):'','aria-label':T('Bağlantı adresi','Link address'),'aria-describedby':uid2+'-hata'});
        var urlK=h('div',{class:'cb-buton-url'},url,h('p',{class:'alan-hata',id:uid2+'-hata'}));
        urlK.hidden=tur!=='url';
        sel.addEventListener('change',function(){hataSil(sel);var y=o.al();var v=sel.value;
          if(v==='url'){y[i].hedef='url:'+(url.value.trim()||'');urlK.hidden=false;url.focus()}else{y[i].hedef=v;urlK.hidden=true}
          o.yaz(y);pilCiz()});
        url.addEventListener('input',function(){hataSil(url);var y=o.al();y[i].hedef='url:'+url.value.trim();o.yaz(y);pilCiz()});
        var li=h('li',{class:'cb-buton-sat'},
          h('div',{class:'alan-k cb-be'},h('label',{class:'etiket','for':eid,text:f(T('Buton {n}','Button {n}'),{n:i+1})}),et,h('p',{class:'alan-hata',id:eid+'-hata'})),
          h('div',{class:'alan-k cb-bh'},h('label',{class:'etiket','for':sid,text:T('Ne yapsın?','What it does')}),sel,h('p',{class:'alan-hata',id:sid+'-hata'})),
          ikonDugme('cop',f(T('Butonu kaldır: {e}','Remove button: {e}'),{e:b.etiket||i+1}),function(){
            var y=o.al();y.splice(i,1);o.yaz(y);ciz(Math.min(i,y.length-1));
          },'cb-buton-sil'),
          urlK);
        ul.appendChild(li);
        kaydetAlan(o.yol+'.'+i+'.etiket',et,d.createElement('p'));
        ALAN[o.yol+'.'+i+'.etiket'].h=li.querySelector('#'+eid+'-hata');
        kaydetAlan(o.yol+'.'+i+'.hedef',tur==='url'?url:sel,tur==='url'?urlK.querySelector('.alan-hata'):li.querySelector('#'+sid+'-hata'));
      });
      if(l.length)kap.appendChild(ul);
      var ekleB=dugme('btn-cizgi btn-kucuk',T('Buton ekle','Add button'),function(){
        var y=o.al();if(y.length>=o.max)return;
        var ilk=(S.tas.niyetler||[])[0];
        y.push({etiket:'',hedef:ilk?'n:'+ilk.k:'insan'});o.yaz(y);ciz(y.length-1);
      },{ik:'arti'});
      if(l.length>=o.max){ekleB.setAttribute('aria-disabled','true')}
      var hataG=h('p',{class:'alan-hata',id:yid('bg')});
      kaydetAlan(o.yol,ekleB,hataG);
      kap.appendChild(h('div',{class:'cb-buton-alt'},ekleB,h('span',{class:'sayac',text:l.length+' / '+o.max})));
      kap.appendChild(hataG);
      if(o.onIzle!==false)kap.appendChild(oniz);
      pilCiz(deg);
      if(odakIndex!=null&&odakIndex>=0){var x=kap.querySelectorAll('.cb-buton-sat input[type=text]')[odakIndex];if(x)x.focus()}
      else if(odakIndex===-1)ekleB.focus();
    }
    function pilCiz(deg){
      bosalt(oniz);
      var l=o.al();
      oniz.hidden=!l.length;
      l.forEach(function(b){oniz.appendChild(pil(b))});
      if(deg===false)return;
      if(o.degisti)o.degisti();
      degisti();
    }
    ciz(null,false);
    return {kok:kap,ciz:function(){ciz(null,false)}};
  }
  function pil(b){
    var url=b.hedef&&b.hedef.indexOf('url:')===0;
    return h('span',{class:'cb-pil'+(url?' cb-pil-url':'')},b.etiket||T('(yazısız)','(no label)'),
      url?h('span',{class:'cb-pil-not',text:T("Instagram'da görünmez","Hidden on Instagram")}):null);
  }

  /* =====================================================================
   * DOĞRULAMA (yerel; sunucu botDogrula ile aynı kurallar)
   * ===================================================================== */
  function dogrulaButonlar(l,yol,max,ks,e){
    if(!Array.isArray(l))return;
    if(l.length>max)e(yol,'fazla');
    l.forEach(function(b,i){
      var et=(b.etiket||'').trim();
      if(!et)e(yol+'.'+i+'.etiket','bos');else if(et.length>SN.ETIKET)e(yol+'.'+i+'.etiket','uzun');
      if(!HEDEF_RE.test(b.hedef||''))e(yol+'.'+i+'.hedef',(b.hedef||'')==='url:'?'bos':'bicim');
      else if(b.hedef.indexOf('n:')===0&&ks.indexOf(b.hedef.slice(2))<0)e(yol+'.'+i+'.hedef','baglanti');
    });
  }
  function dogrula(b,anahtarlar){
    var hl=[];function e(a,n){hl.push({alan:a,neden:n})}
    var has=function(k){return !anahtarlar||anahtarlar.indexOf(k)>=0};
    var ks=(b.niyetler||[]).map(function(n){return n.k});
    if(has('ad')){var ad=(b.ad||'').trim();if(!ad)e('ad','bos');else if(ad.length>SN.AD)e('ad','uzun')}
    [['karsilama',SN.KARSILAMA],['geri_donus',SN.GERI],['devir_mesaji',SN.DEVIR]].forEach(function(x){if(has(x[0])&&(b[x[0]]||'').length>x[1])e(x[0],'uzun')});
    if(has('menu'))dogrulaButonlar(b.menu||[],'menu',SN.MENU,ks,e);
    if(has('niyetler')){
      var l=b.niyetler||[];
      if(l.length>SN.NIYET)e('niyetler','fazla');
      var gor={};
      l.forEach(function(n,i){
        var y='niyetler.'+i;
        if(!K_RE.test(n.k||''))e(y+'.k','bicim');else if(gor[n.k])e(y+'.k','tekrar');gor[n.k]=1;
        var ad=(n.ad||'').trim();if(!ad)e(y+'.ad','bos');else if(ad.length>SN.NIYET_AD)e(y+'.ad','uzun');
        var o=n.ornekler||[],a=n.anahtarlar||[];
        if(!o.length&&!a.length)e(y+'.ornekler','bos');
        if(o.length>SN.ORNEK)e(y+'.ornekler','fazla');if(a.length>SN.ANAHTAR)e(y+'.anahtarlar','fazla');
        var c=(n.cevap||'').trim();if(!c)e(y+'.cevap','bos');else if(c.length>SN.CEVAP)e(y+'.cevap','uzun');
        dogrulaButonlar(n.butonlar||[],y+'.butonlar',SN.BUTON,ks,e);
      });
      if(JSON.stringify(l).length>120000)e('niyetler','uzun');
    }
    if(has('ai')){var ai=b.ai||{};
      if((ai.persona||'').length>SN.PERSONA)e('ai.persona','uzun');
      if((ai.bilgi||'').length>SN.BILGI)e('ai.bilgi','uzun');}
    if(has('web')){var w=b.web||{},al=w.alanlar||[],g=w.gorunum||{};
      if(al.length>SN.ALAN)e('web.alanlar','fazla');
      if(w.aktif&&!al.length)e('web.alanlar','bos');
      al.forEach(function(x,i){if(!ALAN_RE.test(x))e('web.alanlar.'+i,'bicim')});
      if(g.renk&&!RENK_RE.test(g.renk))e('web.gorunum.renk','bicim');
      if((g.baslik||'').length>SN.BASLIK)e('web.gorunum.baslik','uzun');}
    return hl;
  }
  function nedenMetni(n,alan){
    if(alan&&/^niyetler\.\d+\.ornekler$/.test(alan)&&n==='bos')return T('En az bir örnek soru ya da anahtar kelime ekle.','Add at least one sample question or keyword.');
    if(alan==='web.alanlar'&&n==='bos')return T('Web kanalı açıkken en az bir alan adı gerekir.','Add at least one domain while the web channel is on.');
    return ({bos:T('Bu alan boş olamaz.','This field can\'t be empty.'),uzun:T('Bu alan çok uzun.','This is too long.'),
      bicim:T('Biçim geçersiz.','Invalid format.'),tekrar:T('Bu değer tekrar ediyor.','This value is duplicated.'),
      fazla:T('Sınırı aştın; birkaçını kaldır.','Over the limit; remove a few.'),bilinmeyen:T('Bilinmeyen değer.','Unknown value.'),
      baglanti:T('Bağlı olduğu cevap yok; başka bir hedef seç.','The linked reply no longer exists; pick another target.')})[n]||T('Bu alan eksik ya da çok uzun.','This field is missing or too long.');
  }
  function alanSekme(a){if(/^ai(\.|$)/.test(a))return 'ai';if(/^web(\.|$)/.test(a))return 'kanallar';if(/^(ad|mod|aktif)$/.test(a))return null;return 'cevaplar'}
  function alanBul(a){
    var p=a.split('.');
    while(p.length){var k=p.join('.');if(ALAN[k]&&ALAN[k].i.isConnected)return ALAN[k];p.pop()}
    return null;
  }
  function hatalariTemizle(){Object.keys(ALAN).forEach(function(k){var x=ALAN[k];if(x.i.getAttribute('aria-invalid')){x.i.removeAttribute('aria-invalid')}if(x.h&&x.h.isConnected)x.h.textContent=''})}
  function hatalariIsle(hl,odakla){
    hatalariTemizle();
    var ilk=null,bulunamayan=[];
    hl.forEach(function(x,idx){
      var m=/^niyetler\.(\d+)/.exec(x.alan);
      if(m&&(odakla||idx===0)){var n=S.tas.niyetler[Number(m[1])];if(n&&!S.acik[n.k]){S.acik[n.k]=true;niyetKartYenile(Number(m[1]))}}
      var y=alanBul(x.alan);
      if(!y){bulunamayan.push(x);return}
      y.i.setAttribute('aria-invalid','true');if(y.h)y.h.textContent=nedenMetni(x.neden,x.alan);
      if(!ilk)ilk={y:y,alan:x.alan};
    });
    if(odakla){
      var hedef=ilk?ilk.alan:(hl[0]&&hl[0].alan);var sk=hedef&&alanSekme(hedef);
      if(sk&&sk!==S.sekme)sekmeSec(sk,false);
      if(ilk){ilk=alanBul(ilk.alan)||ilk.y;setTimeout(function(){ilk.i.focus();if(ilk.i.scrollIntoView)ilk.i.scrollIntoView({block:'center'})},0)}
    }
    if(bulunamayan.length&&odakla)bildir(f(T('Kaydedilemedi: {a} — {n}','Not saved: {a} — {n}'),{a:alanAdi(bulunamayan[0].alan),n:nedenMetni(bulunamayan[0].neden,bulunamayan[0].alan)}),'hata');
  }
  function alanAdi(a){
    var m={ad:T('Bot adı','Bot name'),karsilama:T('Karşılama mesajı','Welcome message'),geri_donus:T('Geri dönüş mesajı','Fallback message'),
      devir_mesaji:T('Devir mesajı','Handoff message'),bulunamazsa:T('Cevap bulunamazsa','When no reply fits'),menu:T('Menü butonları','Menu buttons'),
      niyetler:T('Hazır cevaplar','Quick replies'),'ai.persona':'Persona','ai.bilgi':T('Bilgi tabanı','Knowledge base'),
      'web.alanlar':T('Alan adları','Domains'),'web.gorunum.renk':T('Renk','Colour'),'web.gorunum.baslik':T('Sohbet başlığı','Chat title')};
    var p=a.split('.');while(p.length){var k=p.join('.');if(m[k])return m[k];p.pop()}return a;
  }

  /* =====================================================================
   * KAYIT (+ otomatik kayıt, SÖZLEŞME DIŞI)
   * ===================================================================== */
  function webSec(w){w=w||{};var g=w.gorunum||{};return {aktif:!!w.aktif,alanlar:(w.alanlar||[]).slice(),gorunum:{renk:g.renk||'#4f46e5',konum:g.konum||'sag',baslik:g.baslik||''}}}
  function aiSec(a){a=a||{};return {persona:a.persona||'',ton:a.ton==null?50:Number(a.ton),bilgi:a.bilgi||''}}
  function deger(b,k){return k==='web'?webSec(b.web):k==='ai'?aiSec(b.ai):b[k]}
  function farklar(){var o={};if(!S.bot||!S.tas)return o;UST.forEach(function(k){var a=deger(S.tas,k);if(!esit(a,deger(S.bot,k)))o[k]=kopyala(a)});return o}
  function kirli(){return Object.keys(farklar()).length>0}
  /* sunucudan gelen botu taslağa bindir: taban'dan sonra kullanıcının değiştirdiği üst alanlar korunur */
  function birlestir(b,taban){
    var yeni=S.tas,yeniden=false;
    UST.forEach(function(k){
      if(esit(deger(S.tas,k),deger(taban,k))){
        if(!esit(deger(S.tas,k),deger(b,k))){
          if(k==='web'){var w=webSec(b.web);yeni.web.aktif=w.aktif;yeni.web.alanlar=w.alanlar;yeni.web.gorunum=w.gorunum}
          else if(k==='ai'){yeni.ai=Object.assign({},yeni.ai,aiSec(b.ai))}
          else yeni[k]=kopyala(b[k]);
          yeniden=true;
        }
      }
    });
    yeni.surum=b.surum;yeni.ig=kopyala(b.ig||{});yeni.ozet=kopyala(b.ozet||{});yeni.updated_at=b.updated_at;
    if(!yeni.web)yeni.web={};yeni.web.anahtar=b.web&&b.web.anahtar;
    S.bot=kopyala(b);
    return yeniden;
  }
  function degisti(){
    if(!S.bot)return;
    if(KZ.son==='eksik'||KZ.son==='hata')KZ.son='';
    durumYaz();
    ustGuncelle();
    testKarsilamaYenile();
    if(KZ.durdu)return;
    clearTimeout(KZ.t);
    KZ.t=setTimeout(function(){kaydet(false)},1500);
  }
  function kaydet(elle){
    clearTimeout(KZ.t);
    if(!S.bot)return Promise.resolve(true);
    if(KZ.ucuyor){KZ.tekrar=true;return Promise.resolve(false)}
    var fk=farklar(),ks=Object.keys(fk);
    if(!ks.length){if(elle){KZ.son='kaydedildi';KZ.kayitZaman=Date.now()}durumYaz();return Promise.resolve(true)}
    if(KZ.durdu&&!elle){durumYaz();return Promise.resolve(false)}
    var hl=dogrula(S.tas,ks);
    if(hl.length){KZ.son='eksik';durumYaz();if(elle)hatalariIsle(hl,true);return Promise.resolve(false)}
    var taban=kopyala(S.tas),id=S.bot.id;
    KZ.ucuyor=true;KZ.son='';durumYaz();
    return istek('/gen/bot/'+id,'POST',Object.assign({surum:S.bot.surum},fk)).then(function(j){
      KZ.ucuyor=false;
      if(!S.bot||S.bot.id!==id)return false;
      if(j.ok&&j.bot){
        var yeniden=birlestir(j.bot,taban);
        KZ.son='kaydedildi';KZ.kayitZaman=Date.now();KZ.durdu=false;
        listeGuncelle(j.bot);
        if(R.ust&&R.ust.contains(d.activeElement))ustGuncelle();else ustCiz();
        if(yeniden)sekmeCiz();
        durumYaz();
        if(KZ.tekrar||kirli()){KZ.tekrar=false;if(kirli())KZ.t=setTimeout(function(){kaydet(false)},400)}
        return true;
      }
      KZ.tekrar=false;
      if(j.error==='cakisma'){KZ.durdu=true;KZ.son='cakisma';durumYaz();bildir(hataMetni(j),'hata');return false}
      if(j.error==='invalid'){KZ.son='eksik';durumYaz();hatalariIsle([{alan:j.alan||'',neden:j.neden||'bos'}],elle);
        if(!elle)KZ.durdu=false;return false}
      KZ.son='hata';durumYaz();
      if(elle||j._s===401||(j._s===403&&j.error==='origin'))hataBildir(j);
      return false;
    });
  }
  function durumMetni(){
    if(KZ.ucuyor)return {m:T('Kaydediliyor…','Saving…'),t:'mesgul'};
    if(KZ.son==='cakisma')return {m:T('Kaydedilmedi: bot başka sekmede değişti','Not saved: bot changed in another tab'),t:'hata'};
    if(KZ.son==='eksik')return {m:T('Kaydedilmedi: eksik alanlar var','Not saved: some fields need attention'),t:'hata',goster:true};
    if(KZ.son==='hata'&&kirli())return {m:T('Kaydedilemedi; yeniden dene','Couldn\'t save; try again'),t:'hata'};
    if(kirli())return {m:T('Kaydedilmemiş değişiklik','Unsaved changes'),t:'kirli'};
    if(KZ.kayitZaman)return {m:T('Kaydedildi','Saved'),t:'ok'};
    return {m:T('Tüm değişiklikler kayıtlı','All changes saved'),t:'ok'};
  }
  function durumYaz(){
    var x=durumMetni();
    (R.durumlar||[]).forEach(function(el){
      bosalt(el);el.setAttribute('data-tur',x.t);
      if(x.t==='ok')el.appendChild(ikon('tamam'));
      el.appendChild(d.createTextNode(x.m));
      if(x.goster)el.appendChild(dugme('btn-metin btn-kucuk cb-goster',T('Göster','Show'),function(){kaydet(true)}));
    });
    (R.kaydetler||[]).forEach(function(b){b.setAttribute('aria-disabled',(KZ.ucuyor||!kirli())&&KZ.son!=='eksik'?'true':'false')});
  }
  window.addEventListener('beforeunload',function(e){if(S.bot&&(KZ.ucuyor||kirli())){e.preventDefault();e.returnValue=''}});
  d.addEventListener('visibilitychange',function(){if(d.visibilityState==='hidden'&&S.bot&&kirli()&&!KZ.durdu)kaydet(false)});

  /* =====================================================================
   * EDİTÖR İSKELETİ
   * ===================================================================== */
  var mqGenis=window.matchMedia?window.matchMedia('(min-width:1100px)'):{matches:true,addEventListener:function(){}};
  function editorCiz(){
    ALAN={};R={durumlar:[],kaydetler:[]};
    bosalt(kok);
    var sekmeHash=(location.hash||'').slice(1);
    if(SEKMELER.some(function(s){return s.d===sekmeHash}))S.sekme=sekmeHash;
    else{var ls=lsAl('smc-cb-sekme');if(SEKMELER.some(function(s){return s.d===ls}))S.sekme=ls}

    var duzen=h('div',{class:'cb-duzen'});
    var ana=h('div',{class:'cb-ana'});
    R.ust=h('div',{class:'cb-ust sheet'});
    R.kota=h('div',{class:'cb-kota'});
    R.mod=h('div',{class:'cb-mod-kap'});
    R.sekmeler=h('div',{class:'cb-sekmeler',role:'tablist','aria-label':T('Chatbot bölümleri','Chatbot sections')});
    R.panel=h('div',{class:'cb-panel',role:'tabpanel',tabindex:'-1'});
    ana.appendChild(R.ust);ana.appendChild(R.kota);ana.appendChild(R.mod);ana.appendChild(R.sekmeler);ana.appendChild(R.panel);

    /* alt kayıt çubuğu (≤768 ve <1100 test düğmesi) */
    var d1=h('p',{class:'cb-durum',role:'status'});R.durumlar.push(d1);
    var k1=dugme('btn-ana btn-kucuk',T('Kaydet','Save'),function(){kaydet(true)});R.kaydetler.push(k1);
    R.testAc=dugme('btn-cizgi btn-kucuk cb-test-ac',T('Test et','Test'),function(b){testCekmeceAc(b)},{ik:'sohbet','aria-haspopup':'dialog'});
    R.altCubuk=h('div',{class:'cb-alt-cubuk'},d1,h('div',{class:'cb-alt-d'},R.testAc,k1));
    ana.appendChild(R.altCubuk);

    R.testYan=h('aside',{class:'cb-test-yan','aria-label':T('Test önizlemesi','Test preview')});
    duzen.appendChild(ana);duzen.appendChild(R.testYan);
    kok.appendChild(duzen);

    ustCiz();kotaCiz();modCiz();sekmeBaslikCiz();sekmeCiz();testKur();
    durumYaz();
  }

  function ustCiz(){
    if(!R.ust)return;
    R.durumlar=(R.durumlar||[]).filter(function(e){return !R.ust.contains(e)});
    R.kaydetler=(R.kaydetler||[]).filter(function(e){return !R.ust.contains(e)});
    bosalt(R.ust);
    var b=S.tas;
    var selId=yid('bot');
    var sel=h('select',{class:'kutu cb-bot-sec',id:selId});
    S.botlar.forEach(function(x){sel.appendChild(h('option',{value:x.id,text:botAdi(x.id===b.id?b:x)+(sinirDisi(x.id)?' — '+T('plan sınırı dışında','outside plan limit'):'')}))});
    sel.value=String(b.id);
    sel.addEventListener('change',function(){
      var yeni=Number(sel.value);
      if(kirli()){
        kaydet(true).then(function(ok){if(ok)botYukle(yeni);else sel.value=String(S.bot.id)});
        return;
      }
      botYukle(yeni);
    });
    var dolu=limitDolu()||!!(S.kota&&S.kota.deneme_bitti);
    var limId=yid('lim');
    var yeniB=dugme('btn-cizgi',T('Yeni bot','New bot'),function(){
      if(dolu)return;
      var git=function(){sihirbaz(true)};
      if(kirli())kaydet(true).then(function(ok){if(ok)git()});else git();
    },{ik:'arti','aria-describedby':dolu?limId:null});
    if(dolu)yeniB.setAttribute('aria-disabled','true');
    var satir1=h('div',{class:'cb-ust-1'},
      h('div',{class:'alan-k cb-bot-alan'},h('label',{class:'etiket','for':selId,text:T('Bot','Bot')}),sel),
      h('div',{class:'cb-yeni'},yeniB,dolu&&S.kota&&S.kota.bot?h('span',{class:'ipucu',id:limId,text:f(T('Planında en çok {n} bot','Your plan allows {n} bots'),{n:S.kota.bot.limit})}):null));
    R.ust.appendChild(satir1);
    if(sinirDisi(b.id))R.ust.appendChild(h('p',{class:'cb-uyari-satir'},h('span',{class:'rozet rozet-uyari',text:T('Plan sınırı dışında','Outside plan limit')}),
      h('span',{text:T('Bu bot planının bot sınırını aştığı için çalışmıyor.','This bot is off because it is over your plan\'s bot limit.')}),
      h('a',{href:PLANLAR,text:T('Planlar','Plans')})));
    R.rozetler=h('div',{class:'cb-rozetler'});
    var akt=anahtar(T('Bot açık','Bot on'),!!b.aktif,function(v){S.tas.aktif=v;degisti()});
    var k2=dugme('btn-ana cb-kaydet-ust',T('Kaydet','Save'),function(){kaydet(true)});R.kaydetler.push(k2);
    var d2=h('p',{class:'cb-durum cb-durum-ust',role:'status'});R.durumlar.push(d2);
    R.ust.appendChild(h('div',{class:'cb-ust-2'},R.rozetler,akt,h('div',{class:'cb-ust-kaydet'},d2,k2)));
    ustGuncelle();
    durumYaz();
  }
  function ustGuncelle(){
    if(!R.rozetler)return;
    var b=S.tas;bosalt(R.rozetler);
    var w=b.web||{},ig=b.ig||{};
    R.rozetler.appendChild(h('span',{class:'rozet'+(w.aktif?' rozet-ok':'')},f('Web: {d}',{d:w.aktif?T('açık','on'):T('kapalı','off')})));
    var igD=ig.durum==='aktif'?T('açık','on'):ig.durum==='yakinda'?T('yakında','soon'):T('kapalı','off');
    R.rozetler.appendChild(h('span',{class:'rozet'+(ig.durum==='aktif'?' rozet-ok':ig.durum==='yakinda'?' rozet-bilgi':'')},f('Instagram: {d}',{d:igD})));
  }

  function cubuk(etiket,k){
    var lim=k&&k.limit||0,used=k&&k.used||0,oran=lim?Math.min(1,used/lim):0;
    var c=h('span',{class:'cb-cubuk'+(oran>=1?' cb-cubuk-dolu':oran>=0.8?' cb-cubuk-az':''),'aria-hidden':'true'},h('span',{class:'cb-cubuk-i'}));
    c.firstChild.style.setProperty('--oran',String(oran));
    return h('div',{class:'cb-kota-k'},h('div',{class:'cb-kota-ust'},h('span',{class:'cb-kota-ad',text:etiket}),
      h('span',{class:'cb-kota-n',text:sayi(used)+' / '+sayi(lim)})),c);
  }
  function kotaCiz(){
    if(!R.kota)return;
    bosalt(R.kota);
    var k=S.kota;if(!k){R.kota.hidden=true;return}
    R.kota.hidden=false;
    var ic=h('div',{class:'cb-kota-ic'},cubuk(T('AI cevap','AI replies'),k.ai),cubuk(T('Hazır cevap','Quick replies'),k.hazir));
    var alt=h('p',{class:'ipucu cb-kota-alt'});
    var parca=[];
    if(k.reset_at){try{parca.push(f(T('Yenilenme: {t}','Resets: {t}'),{t:new Date(k.reset_at).toLocaleDateString(LOC,{day:'numeric',month:'long'})}))}catch(e){}}
    if(k.test&&k.test.used)parca.push(f(T('Test: {n}','Test: {n}'),{n:sayi(k.test.used)}));
    alt.textContent=parca.join(' · ');
    R.kota.appendChild(ic);if(parca.length)R.kota.appendChild(alt);
    var uy=null;
    if(k.deneme_bitti)uy=[T('Deneme süren bitti; bot şu an kapalı.','Your trial has ended; the bot is off for now.'),'hata'];
    else if(k.uyari==='dolu')uy=[T('AI cevap hakkın doldu; bot şimdilik hazır cevaplarla ve geri dönüş mesajıyla cevap veriyor.','Your AI replies are used up; the bot answers with quick replies and the fallback message for now.'),'uyari'];
    else if(k.uyari==='az')uy=[T('AI cevap hakkın azalıyor.','You are running low on AI replies.'),'bilgi'];
    if(uy)R.kota.appendChild(h('div',{class:'bildirim bildirim-'+uy[1]+' cb-kota-uyari'},h('p',{text:uy[0]}),
      uy[1]!=='bilgi'||true?h('a',{class:'btn btn-cizgi btn-kucuk',href:PLANLAR,text:T('Planlar','Plans')}):null));
  }
  function modCiz(){
    bosalt(R.mod);
    var acik=h('p',{class:'cb-mod-acik giris-p'});
    function yaz(){var m=MODLAR.filter(function(x){return x.d===S.tas.mod})[0];acik.textContent=m?m.acik:''}
    R.mod.appendChild(segment('cb-mod',T('Cevap modu','Answer mode'),MODLAR,S.tas.mod,function(v){S.tas.mod=v;yaz();modNotlari();degisti()}));
    R.mod.appendChild(acik);yaz();
  }
  function modNotlari(){
    var m=S.tas.mod;
    if(R.notAi)R.notAi.hidden=m!=='ai';
    if(R.notHazir)R.notHazir.hidden=m!=='hazir';
  }

  function sekmeBaslikCiz(){
    bosalt(R.sekmeler);
    SEKMELER.forEach(function(s,i){
      var id='cb-sekme-'+s.d;
      var b=h('button',{type:'button',role:'tab',id:id,class:'cb-sekme','aria-selected':s.d===S.sekme?'true':'false','aria-controls':'cb-panel',
        tabindex:s.d===S.sekme?'0':'-1'},s.ad);
      if(s.d==='gelen'){var n=(S.tas.ozet&&S.tas.ozet.okunmamis)||0;if(n)b.appendChild(h('span',{class:'cb-sayi-rozet','aria-label':f(T('{n} okunmamış','{n} unread'),{n:n}),text:n>99?'99+':String(n)}))}
      b.addEventListener('click',function(){sekmeSec(s.d,true)});
      b.addEventListener('keydown',function(e){
        var j=null;if(e.key==='ArrowRight')j=(i+1)%SEKMELER.length;else if(e.key==='ArrowLeft')j=(i-1+SEKMELER.length)%SEKMELER.length;
        else if(e.key==='Home')j=0;else if(e.key==='End')j=SEKMELER.length-1;
        if(j!=null){e.preventDefault();sekmeSec(SEKMELER[j].d,false);var t=d.getElementById('cb-sekme-'+SEKMELER[j].d);if(t)t.focus()}
      });
      R.sekmeler.appendChild(b);
    });
    R.panel.id='cb-panel';
    R.panel.setAttribute('aria-labelledby','cb-sekme-'+S.sekme);
  }
  function sekmeSec(s,odak){
    if(s===S.sekme&&R.panel.firstChild){if(odak)R.panel.focus();return}
    S.sekme=s;lsYaz('smc-cb-sekme',s);
    if(!ORNEK&&window.history&&history.replaceState){try{history.replaceState(null,'','#'+s)}catch(e){}}
    sekmeBaslikCiz();sekmeCiz();
    if(odak)R.panel.focus({preventScroll:true});
  }
  function sekmeCiz(){
    gelenDurdur();
    bosalt(R.panel);
    R.notAi=null;R.notHazir=null;
    var s=S.sekme;
    if(s==='cevaplar')cevaplarCiz(R.panel);
    else if(s==='ai')aiCiz(R.panel);
    else if(s==='kanallar')kanallarCiz(R.panel);
    else if(s==='gelen')gelenCiz(R.panel);
    else istatistikCiz(R.panel);
    modNotlari();
  }

  /* =====================================================================
   * CEVAPLAR SEKMESİ
   * ===================================================================== */
  function kart(baslik,alt){var k=h('section',{class:'sheet cb-kart'});var id=yid('k');k.setAttribute('aria-labelledby',id);
    k.appendChild(h('div',{class:'cb-kart-bas'},h('h2',{id:id,text:baslik}),alt?h('p',{class:'ipucu',text:alt}):null));return k}
  function cevaplarCiz(p){
    var b=S.tas;
    R.notAi=h('p',{class:'bildirim bildirim-bilgi cb-mod-not'},h('span',{text:T('AI modunda bu cevaplar, AI kotası dolarsa yedek olarak kullanılır.','In AI mode these replies are used as a backup when your AI quota runs out.')}));
    p.appendChild(R.notAi);

    var g=kart(T('Genel','General'),T('Karşılama, menü ve bot cevap bulamadığında ne olacağı.','Welcome, menu and what happens when nothing matches.'));
    var ust=h('div',{class:'cb-iki'});
    ust.appendChild(alanKutu({etiket:T('Bot adı','Bot name'),deger:b.ad,max:SN.AD,alan:'ad',giris:function(v){S.tas.ad=v;degisti()}}).kok);
    var dilId=yid('dil');
    var dilSel=h('select',{class:'kutu',id:dilId},h('option',{value:'tr',text:'Türkçe'}),h('option',{value:'en',text:'English'}));
    dilSel.value=b.dil==='en'?'en':'tr';
    var karsilamaK,geriK,devirK;
    dilSel.addEventListener('change',function(){S.tas.dil=dilSel.value;
      karsilamaK.inp.placeholder=metinVars(S.tas,'karsilama');geriK.inp.placeholder=metinVars(S.tas,'geri');devirK.inp.placeholder=metinVars(S.tas,'devir');
      degisti();karsilamaOnizle()});
    ust.appendChild(h('div',{class:'alan-k'},h('label',{class:'etiket','for':dilId,text:T('Bot dili','Bot language')}),dilSel,
      h('div',{class:'alan-alt'},h('span',{class:'ipucu',text:T('Sistem mesajları ve varsayılan metinler bu dilde.','System messages and defaults use this language.')}))));
    g.appendChild(ust);
    karsilamaK=alanKutu({etiket:T('Karşılama mesajı','Welcome message'),tur:'textarea',satir:2,deger:b.karsilama,max:SN.KARSILAMA,yer:metinVars(b,'karsilama'),alan:'karsilama',
      ipucu:T('Boş bırakırsan yer tutucudaki metin kullanılır.','Leave empty to use the placeholder text.'),giris:function(v){S.tas.karsilama=v;degisti();karsilamaOnizle()}});
    g.appendChild(karsilamaK.kok);
    g.appendChild(h('h3',{class:'cb-alt-baslik',text:T('Menü butonları','Menu buttons')}));
    g.appendChild(h('p',{class:'ipucu',text:T('Karşılama mesajının altında görünür. En çok 13 buton.','Shown under the welcome message. Up to 13 buttons.')}));
    var menuEd=butonDuzenleyici({yol:'menu',max:SN.MENU,onIzle:false,al:function(){return S.tas.menu||(S.tas.menu=[])},yaz:function(l){S.tas.menu=l},degisti:karsilamaOnizle});
    R.menuEd=menuEd;
    g.appendChild(menuEd.kok);
    R.karsOn=h('div',{class:'cb-onizle','aria-label':T('Karşılama önizlemesi','Welcome preview')});
    g.appendChild(h('div',{class:'cb-onizle-kap'},h('p',{class:'ust-etiket',text:T('Önizleme','Preview')}),R.karsOn));
    karsilamaOnizle();
    geriK=alanKutu({etiket:T('Geri dönüş mesajı','Fallback message'),tur:'textarea',satir:2,deger:b.geri_donus,max:SN.GERI,yer:metinVars(b,'geri'),alan:'geri_donus',
      ipucu:T('Bot soruyu eşleştiremezse bunu yazar.','Sent when the bot can\'t match the question.'),giris:function(v){S.tas.geri_donus=v;degisti()}});
    g.appendChild(geriK.kok);
    var bul=h('fieldset',{class:'secim-grup'},h('legend',{text:T('Cevap bulunamazsa','When no reply fits')}));
    var bs=h('div',{class:'secim-sira'});
    [['lead',T('Bilgi topla','Collect details')],['devir',T('İnsana devret','Hand off to a human')],['ikisi',T('İkisi','Both')],['yok',T('Hiçbiri','Neither')]].forEach(function(x){
      var id=yid('bf');var inp=h('input',{type:'radio',name:'cb-bulunamazsa',id:id,value:x[0],checked:(b.bulunamazsa||'ikisi')===x[0]});
      inp.addEventListener('change',function(){if(inp.checked){S.tas.bulunamazsa=x[0];degisti()}});
      bs.appendChild(h('span',{class:'secim'},inp,h('label',{'for':id,text:x[1]})));
    });
    bul.appendChild(bs);
    bul.appendChild(h('p',{class:'ipucu cb-ust-bosluk',text:T('Geri dönüş mesajının altına "Bilgilerimi bırak" ve/veya "Bir insanla görüş" butonları eklenir.','Adds "Leave my details" and/or "Talk to a human" under the fallback message.')}));
    g.appendChild(bul);
    devirK=alanKutu({etiket:T('Devir mesajı','Handoff message'),tur:'textarea',satir:2,deger:b.devir_mesaji,max:SN.DEVIR,yer:metinVars(b,'devir'),alan:'devir_mesaji',
      ipucu:T('Ziyaretçi bir insanla görüşmek istediğinde yazılır.','Sent when the visitor asks for a human.'),giris:function(v){S.tas.devir_mesaji=v;degisti()}});
    g.appendChild(devirK.kok);
    g.appendChild(h('div',{class:'cb-kart-alt'},dugme('btn-metin cb-tehlike-metin',T('Botu sil','Delete bot'),function(btn){
      onayla(f(T('“{a}” botunu sil?','Delete “{a}”?'),{a:botAdi(S.tas)}),T('Bot, konuşmaları ve lead\'leri kalıcı olarak silinir. Sitendeki kod çalışmayı bırakır.','The bot, its conversations and leads are deleted for good. The code on your site stops working.'),T('Sil','Delete'),function(){botSil(btn)},btn);
    })));
    p.appendChild(g);

    /* niyetler */
    var nk=h('section',{class:'cb-niyetler','aria-labelledby':'cb-niyet-b'});
    nk.appendChild(h('div',{class:'cb-bolum-bas'},h('h2',{id:'cb-niyet-b',text:T('Hazır cevaplar','Quick replies')}),
      h('span',{class:'sayac',id:'cb-niyet-say'})));
    nk.appendChild(h('p',{class:'ipucu',text:T('Her cevap; ziyaretçinin yazabileceği örnek sorular ve anahtar kelimelerle eşleşir. Sırayı sürükleyerek ya da oklarla değiştir.','Each reply matches sample questions and keywords visitors might type. Reorder by dragging or with the arrows.')}));
    R.niyetListe=h('ol',{class:'cb-niyet-liste'});
    nk.appendChild(R.niyetListe);
    var hataN=h('p',{class:'alan-hata'});
    R.yeniNiyet=dugme('btn-cizgi cb-yeni-niyet',T('Yeni cevap ekle','Add a reply'),function(){niyetEkle()},{ik:'arti'});
    kaydetAlan('niyetler',R.yeniNiyet,hataN);
    nk.appendChild(R.yeniNiyet);nk.appendChild(hataN);
    p.appendChild(nk);
    niyetListeCiz();
  }
  function karsilamaOnizle(){
    if(!R.karsOn)return;bosalt(R.karsOn);
    var t=(S.tas.karsilama||'').trim()||metinVars(S.tas,'karsilama');
    R.karsOn.appendChild(h('p',{class:'cb-balon cb-balon-bot',text:t}));
    var m=S.tas.menu||[];
    if(m.length){var r=h('div',{class:'cb-pil-sira'});m.forEach(function(b){r.appendChild(pil(b))});R.karsOn.appendChild(r)}
  }
  function botSil(btn){
    var id=S.bot.id;var geri=api.mesgul(btn,T('Siliniyor…','Deleting…'));
    clearTimeout(KZ.t);
    istek('/gen/bot/'+id+'/sil','POST',{}).then(function(j){
      geri();
      if(!j.ok){hataBildir(j);return}
      S.botlar=S.botlar.filter(function(b){return b.id!==id});
      if(S.kota&&S.kota.bot)S.kota.bot.used=Math.max(0,(S.kota.bot.used||1)-1);
      S.bot=null;S.tas=null;lsYaz('smc-cb-bot','');
      bildir(T('Bot silindi.','Bot deleted.'),'ok');
      if(S.botlar.length)botYukle(S.botlar[0].id);else sihirbaz(false);
    });
  }
  function yeniK(){var k;do{k='n'+Date.now().toString(36)+(uid++).toString(36)}while((S.tas.niyetler||[]).some(function(n){return n.k===k}));return k.slice(0,24)}
  function niyetEkle(ornek){
    var l=S.tas.niyetler||(S.tas.niyetler=[]);
    if(l.length>=SN.NIYET){bildir(f(T('En çok {n} hazır cevap ekleyebilirsin.','You can add up to {n} quick replies.'),{n:SN.NIYET}),'uyari');return}
    var k=yeniK();
    var n={k:k,ad:ornek?ornek.slice(0,SN.NIYET_AD):'',ornekler:ornek?[ornek.slice(0,SN.ORNEK_UZ)]:[],anahtarlar:[],cevap:'',butonlar:[],aktif:true};
    l.push(n);S.acik[k]=true;
    niyetListeCiz();degisti();
    var kartE=R.niyetListe.lastChild;
    if(kartE){kartE.scrollIntoView({block:'nearest'});var x=kartE.querySelector(ornek?'textarea':'input.kutu');if(x)x.focus()}
  }
  function niyetListeCiz(){
    if(!R.niyetListe)return;
    bosalt(R.niyetListe);
    var l=S.tas.niyetler||[];
    l.forEach(function(n,i){R.niyetListe.appendChild(niyetKart(i))});
    var say=d.getElementById('cb-niyet-say');if(say)say.textContent=l.length+' / '+SN.NIYET;
    if(!l.length)R.niyetListe.appendChild(h('li',{class:'bos cb-bos-k'},h('p',{text:T('Henüz hazır cevap yok. İlk cevabını ekle; örneğin "Kargo ne zaman gelir?"','No quick replies yet. Add your first one, e.g. "When will my order arrive?"')})));
    if(R.yeniNiyet)R.yeniNiyet.setAttribute('aria-disabled',l.length>=SN.NIYET?'true':'false');
  }
  function niyetKartYenile(i){
    if(!R.niyetListe)return;var eski=R.niyetListe.children[i];if(!eski)return;
    R.niyetListe.replaceChild(niyetKart(i),eski);
  }
  function niyetTasi(i,j,odakSinif){
    var l=S.tas.niyetler;if(j<0||j>=l.length||i===j)return;
    var x=l.splice(i,1)[0];l.splice(j,0,x);
    niyetListeCiz();degisti();
    var k=R.niyetListe.children[j];if(k){var b=k.querySelector(odakSinif||'.cb-tut');if(b&&b.getAttribute('aria-disabled')!=='true')b.focus();else if(k.querySelector('.cb-tut'))k.querySelector('.cb-tut').focus()}
    canliDuyur(f(T('{a}: {n}. sıraya taşındı','{a}: moved to position {n}'),{a:x.ad||T('Adsız cevap','Untitled reply'),n:j+1}));
  }
  function canliDuyur(m){if(!R.canli){R.canli=h('p',{class:'sr',role:'status','aria-live':'polite'});kok.appendChild(R.canli)}R.canli.textContent='';setTimeout(function(){R.canli.textContent=m},30)}
  function niyetOzet(n){return f(T('{o} örnek · {a} anahtar kelime','{o} samples · {a} keywords'),{o:(n.ornekler||[]).length,a:(n.anahtarlar||[]).length})}
  function niyetKart(i){
    var n=S.tas.niyetler[i],y='niyetler.'+i,acik=!!S.acik[n.k],bid=yid('nb'),gid=yid('ng');
    var li=h('li',{class:'cb-niyet sheet'+(n.aktif===false?' cb-niyet-kapali':''),'data-k':n.k});
    var tut=h('button',{type:'button',class:'cb-ikon-d cb-tut','aria-label':f(T('Taşı: {a}. Ok tuşlarıyla sırasını değiştir.','Move: {a}. Use arrow keys to reorder.'),{a:n.ad||T('Adsız cevap','Untitled reply')})},ikon('tut'));
    tut.addEventListener('keydown',function(e){if(e.key==='ArrowUp'){e.preventDefault();niyetTasi(i,i-1)}else if(e.key==='ArrowDown'){e.preventDefault();niyetTasi(i,i+1)}});
    surukleKur(tut,li,i);
    var adSp=h('span',{class:'cb-niyet-ad',text:n.ad||T('Adsız cevap','Untitled reply')});
    var ozSp=h('span',{class:'cb-niyet-oz',text:niyetOzet(n)});
    var ac=h('button',{type:'button',class:'cb-niyet-ac',id:bid,'aria-expanded':acik?'true':'false','aria-controls':gid},
      h('span',{class:'cb-niyet-baslik'},adSp,ozSp),ikon(acik?'yukari':'asagi'));
    ac.addEventListener('click',function(){S.acik[n.k]=!S.acik[n.k];niyetKartYenile(i);var x=R.niyetListe.children[i];if(x)x.querySelector('.cb-niyet-ac').focus()});
    var akt=anahtar(f(T('Açık: {a}','On: {a}'),{a:n.ad||T('Adsız cevap','Untitled reply')}),n.aktif!==false,function(v){S.tas.niyetler[i].aktif=v;li.classList.toggle('cb-niyet-kapali',!v);degisti()},{kucuk:true,gizliEtiket:true});
    var yuk=ikonDugme('yukari',T('Yukarı taşı','Move up'),function(){niyetTasi(i,i-1,'.cb-yukari')},'cb-yukari');
    var asg=ikonDugme('asagi',T('Aşağı taşı','Move down'),function(){niyetTasi(i,i+1,'.cb-asagi')},'cb-asagi');
    if(i===0)yuk.setAttribute('aria-disabled','true');
    if(i===S.tas.niyetler.length-1)asg.setAttribute('aria-disabled','true');
    li.appendChild(h('div',{class:'cb-niyet-ust'},tut,ac,h('div',{class:'cb-niyet-d'},akt,yuk,asg)));
    var kHata=h('p',{class:'alan-hata'});
    kaydetAlan(y,ac,kHata);kaydetAlan(y+'.k',ac,kHata);
    li.appendChild(kHata);
    if(!acik)return li;
    var g=h('div',{class:'cb-niyet-govde',id:gid,role:'group','aria-labelledby':bid});
    var adK=alanKutu({etiket:T('Cevap adı','Reply name'),deger:n.ad,max:SN.NIYET_AD,alan:y+'.ad',yer:T('Ör. Kargo süresi','e.g. Delivery time'),
      giris:function(v){S.tas.niyetler[i].ad=v;adSp.textContent=v||T('Adsız cevap','Untitled reply');degisti()}});
    g.appendChild(adK.kok);
    var nesne=function(){return S.tas.niyetler[i]};
    g.appendChild(h('div',{class:'cb-iki'},
      cipAlan({etiket:T('Örnek sorular','Sample questions'),yer:T('Ör. kargom ne zaman gelir','e.g. when will my order arrive'),max:SN.ORNEK,maxUz:SN.ORNEK_UZ,alan:y+'.ornekler',
        ipucu:T('Ziyaretçinin yazabileceği biçimde. Enter ile ekle.','As a visitor might type it. Press Enter to add.'),
        al:function(){return nesne().ornekler||[]},yaz:function(v){nesne().ornekler=v;ozSp.textContent=niyetOzet(nesne());degisti()}}).kok,
      cipAlan({etiket:T('Anahtar kelimeler','Keywords'),yer:T('Ör. kargo','e.g. shipping'),max:SN.ANAHTAR,maxUz:SN.ANAHTAR_UZ,alan:y+'.anahtarlar',
        ipucu:T('Tek kelime ya da kısa ifade.','A word or short phrase.'),
        al:function(){return nesne().anahtarlar||[]},yaz:function(v){nesne().anahtarlar=v;ozSp.textContent=niyetOzet(nesne());degisti()}}).kok));
    g.appendChild(alanKutu({etiket:T('Cevap','Reply'),tur:'textarea',satir:3,deger:n.cevap,max:SN.CEVAP,alan:y+'.cevap',
      yer:T('Bot bu soruya ne yazsın?','What should the bot reply?'),giris:function(v){S.tas.niyetler[i].cevap=v;degisti()}}).kok);
    g.appendChild(h('h3',{class:'cb-alt-baslik',text:T('Cevabın altındaki butonlar','Buttons under the reply')}));
    g.appendChild(butonDuzenleyici({yol:y+'.butonlar',max:SN.BUTON,al:function(){return nesne().butonlar||(nesne().butonlar=[])},yaz:function(v){nesne().butonlar=v}}).kok);
    g.appendChild(h('div',{class:'cb-kart-alt'},dugme('btn-metin cb-tehlike-metin',T('Bu cevabı sil','Delete this reply'),function(btn){
      onayla(f(T('“{a}” cevabını sil?','Delete “{a}”?'),{a:n.ad||T('Adsız cevap','Untitled reply')}),T('Bu cevaba giden butonlar da kaldırılır.','Buttons that point to this reply are removed too.'),T('Sil','Delete'),function(){niyetSil(i)},btn);
    },{ik:'cop'})));
    li.appendChild(g);
    return li;
  }
  function niyetSil(i){
    var n=S.tas.niyetler[i];if(!n)return;
    S.tas.niyetler.splice(i,1);delete S.acik[n.k];
    var hedef='n:'+n.k,say=0;
    function temizle(l){var y=(l||[]).filter(function(b){if(b.hedef===hedef){say++;return false}return true});return y}
    S.tas.menu=temizle(S.tas.menu);
    S.tas.niyetler.forEach(function(x){x.butonlar=temizle(x.butonlar)});
    niyetListeCiz();if(R.menuEd)R.menuEd.ciz();karsilamaOnizle();degisti();
    bildir(say?f(T('Cevap silindi; ona giden {n} buton da kaldırıldı.','Reply deleted; {n} buttons pointing to it were removed too.'),{n:say}):T('Cevap silindi.','Reply deleted.'),'ok');
    var k=R.niyetListe.children[Math.min(i,S.tas.niyetler.length-1)];
    var odak=k&&k.querySelector('.cb-niyet-ac');(odak||R.yeniNiyet).focus();
  }
  /* Pointer Events ile sürükle-bırak; klavye eşdeğeri ok tuşları + yukarı/aşağı düğmeleri */
  function surukleKur(tut,li,i){
    tut.addEventListener('pointerdown',function(e){
      if(e.button!==0)return;
      e.preventDefault();
      try{tut.setPointerCapture(e.pointerId)}catch(x){}
      var liste=R.niyetListe,hedef=i;
      li.classList.add('cb-surukle');
      function hareket(ev){
        var kids=[].slice.call(liste.children).filter(function(c){return c!==li&&c.classList.contains('cb-niyet')});
        var y=ev.clientY,once=null;
        for(var k=0;k<kids.length;k++){var r=kids[k].getBoundingClientRect();if(y<r.top+r.height/2){once=kids[k];break}}
        if(once!==li.nextSibling||(!once&&li!==liste.lastChild))liste.insertBefore(li,once);
        var sira=[].slice.call(liste.children).indexOf(li);hedef=sira;
      }
      function bitti(){
        tut.removeEventListener('pointermove',hareket);tut.removeEventListener('pointerup',bitti);tut.removeEventListener('pointercancel',bitti);
        li.classList.remove('cb-surukle');
        if(hedef!==i)niyetTasi(i,hedef);else niyetListeCiz();
      }
      tut.addEventListener('pointermove',hareket);tut.addEventListener('pointerup',bitti);tut.addEventListener('pointercancel',bitti);
    });
  }

  /* =====================================================================
   * AI SEKMESİ
   * ===================================================================== */
  function aiCiz(p){
    var ai=S.tas.ai||(S.tas.ai={persona:'',ton:50,bilgi:''});
    R.notHazir=h('p',{class:'bildirim bildirim-bilgi cb-mod-not'},h('span',{text:T('Bu ayarlar AI ve Karma modda kullanılır.','These settings are used in AI and Hybrid modes.')}));
    p.appendChild(R.notHazir);
    var k=kart(T('AI ayarları','AI settings'),T('AI yalnız buraya yazdıklarına dayanarak cevap verir; emin olmadığında ziyaretçiyi sana yönlendirir.','The AI answers only from what you write here; when unsure it sends the visitor to you.'));
    k.appendChild(alanKutu({etiket:'Persona',tur:'textarea',satir:3,deger:ai.persona,max:SN.PERSONA,alan:'ai.persona',
      yer:T('Ör. Güler yüzlü, kısa ve net cevap veren bir mağaza asistanı.','e.g. A friendly store assistant who gives short, clear answers.'),
      ipucu:T('Botun kim olduğu ve nasıl konuştuğu.','Who the bot is and how it talks.'),giris:function(v){S.tas.ai.persona=v;degisti()}}).kok);
    var tid=yid('ton');
    var ton=h('input',{type:'range',id:tid,min:'0',max:'100',step:'5',class:'cb-ton','aria-describedby':tid+'-o'});
    ton.value=String(ai.ton==null?50:ai.ton);
    var tonAd=function(v){return v<34?T('Resmi','Formal'):v<67?T('Dengeli','Balanced'):T('Samimi','Friendly')};
    var cikti=h('output',{'for':tid,id:tid+'-o',class:'cb-ton-o',text:tonAd(Number(ton.value))});
    ton.setAttribute('aria-valuetext',tonAd(Number(ton.value)));
    ton.addEventListener('input',function(){var v=Number(ton.value);S.tas.ai.ton=v;cikti.textContent=tonAd(v);ton.setAttribute('aria-valuetext',tonAd(v));degisti()});
    k.appendChild(h('div',{class:'alan-k'},h('div',{class:'cb-ton-ust'},h('label',{class:'etiket','for':tid,text:T('Ton','Tone')}),cikti),ton,
      h('div',{class:'cb-ton-uclar','aria-hidden':'true'},h('span',{text:T('Resmi','Formal')}),h('span',{text:T('Dengeli','Balanced')}),h('span',{text:T('Samimi','Friendly')}))));
    var bk=alanKutu({etiket:T('Bilgi tabanı','Knowledge base'),tur:'textarea',satir:10,deger:ai.bilgi,max:SN.BILGI,binlik:true,alan:'ai.bilgi',
      yer:T('Ürünlerin, fiyatların, kargo ve iade koşulların, çalışma saatlerin, sık sorulan sorular…','Your products, prices, shipping and returns, opening hours, FAQs…'),
      ipucu:T('Düz metin. Başlıklar ve kısa paragraflar en iyi sonucu verir.','Plain text. Headings and short paragraphs work best.'),giris:function(v){S.tas.ai.bilgi=v;degisti()}});
    bk.inp.classList.add('cb-bilgi');
    k.appendChild(bk.kok);
    k.appendChild(h('div',{class:'cb-yakinda-sira'},h('button',{type:'button',class:'btn btn-cizgi btn-kucuk','aria-disabled':'true','aria-describedby':'cb-cek-y'},T('Web sitemden çek','Import from my website')),
      h('span',{class:'rozet',id:'cb-cek-y',text:T('Yakında','Soon')})));
    p.appendChild(k);
  }

  /* =====================================================================
   * KANALLAR SEKMESİ
   * ===================================================================== */
  function kanallarCiz(p){
    var w=S.tas.web||(S.tas.web={aktif:false,alanlar:[],gorunum:{renk:'#4f46e5',konum:'sag',baslik:''}});
    if(!w.gorunum)w.gorunum={renk:'#4f46e5',konum:'sag',baslik:''};
    if(!w.alanlar)w.alanlar=[];
    var k=kart(T('Web sitesi','Website'),T('Sitenin sağ ya da sol alt köşesinde sohbet balonu.','A chat bubble in the bottom corner of your site.'));
    var hataAkt=h('p',{class:'alan-hata'});
    var akt=anahtar(T('Web sitemde göster','Show on my website'),!!w.aktif,function(v){S.tas.web.aktif=v;degisti();onIzleKanal()});
    k.appendChild(akt);
    kaydetAlan('web',akt.girdi,hataAkt);kaydetAlan('web.aktif',akt.girdi,hataAkt);
    k.appendChild(hataAkt);
    k.appendChild(cipAlan({etiket:T('İzinli alan adları','Allowed domains'),yer:'ornek.com',max:SN.ALAN,maxUz:253,alanAdi:true,alan:'web.alanlar',
      ipucu:T('Bot yalnız bu alan adlarında çalışır (www. kendiliğinden dahil). Alt alan adları için *.ornek.com. Yerel deneme için localhost.','The bot only runs on these domains (www. included). Use *.example.com for subdomains, localhost for local testing.'),
      al:function(){return S.tas.web.alanlar},yaz:function(l){S.tas.web.alanlar=l;degisti()}}).kok);
    var gor=h('div',{class:'cb-gorunum'});
    var rid=yid('renk');
    var renk=h('input',{type:'color',id:rid,class:'cb-renk',value:RENK_RE.test(w.gorunum.renk||'')?w.gorunum.renk:'#4f46e5'});
    var renkHata=h('p',{class:'alan-hata',id:rid+'-hata'});
    renk.addEventListener('input',function(){S.tas.web.gorunum.renk=renk.value.toLowerCase();renkKod.textContent=renk.value.toLowerCase();onIzleKanal();degisti()});
    var renkKod=h('span',{class:'kod',text:renk.value});
    kaydetAlan('web.gorunum.renk',renk,renkHata);
    gor.appendChild(h('div',{class:'alan-k'},h('label',{class:'etiket','for':rid,text:T('Renk','Colour')}),h('div',{class:'cb-renk-sira'},renk,renkKod),renkHata));
    gor.appendChild(segment('cb-konum',T('Konum','Position'),[{d:'sag',ad:T('Sağ','Right')},{d:'sol',ad:T('Sol','Left')}],w.gorunum.konum==='sol'?'sol':'sag',
      function(v){S.tas.web.gorunum.konum=v;onIzleKanal();degisti()}));
    k.appendChild(gor);
    k.appendChild(alanKutu({etiket:T('Sohbet başlığı','Chat title'),deger:w.gorunum.baslik,max:SN.BASLIK,alan:'web.gorunum.baslik',yer:botAdi(S.tas),
      ipucu:T('Boş bırakırsan bot adı görünür.','Leave empty to show the bot name.'),giris:function(v){S.tas.web.gorunum.baslik=v;onIzleKanal();degisti()}}).kok);
    R.kanalOn=h('div',{class:'cb-site-onizle','aria-hidden':'true'});
    k.appendChild(h('div',{class:'cb-onizle-kap'},h('p',{class:'ust-etiket',text:T('Sitende böyle görünür','How it looks on your site')}),R.kanalOn));
    onIzleKanal();
    /* kod */
    k.appendChild(h('h3',{class:'cb-alt-baslik',text:T('Sitene eklenecek kod','Code for your site')}));
    k.appendChild(h('p',{class:'ipucu',text:T('Bu kodu sitendeki her sayfada </body> etiketinden hemen önce yapıştır.','Paste this code right before </body> on every page of your site.')}));
    R.kod=h('code');
    var pre=h('pre',{class:'cb-kod',tabindex:'0','aria-label':T('Kurulum kodu','Install code')},R.kod);
    kodYaz();
    var kop=dugme('btn-cizgi btn-kucuk',T('Kopyala','Copy'),function(b){
      var metin=R.kod.textContent;
      var tamam=function(){var g=api.mesgul(b,T('Kopyalandı','Copied'));setTimeout(g,1500);canliDuyur(T('Kod kopyalandı','Code copied'))};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(metin).then(tamam,function(){secMetin(pre)});else secMetin(pre);
    },{ik:'kopya'});
    var yen=dugme('btn-metin btn-kucuk',T('Anahtarı yenile','Regenerate key'),function(b){
      onayla(T('Anahtarı yenile?','Regenerate the key?'),T('Eski kod çalışmayı bırakır; sitendeki kodu güncellemen gerekir.','The old code stops working; you\'ll need to update the code on your site.'),T('Anahtarı yenile','Regenerate key'),function(){anahtarYenile(b)},b);
    },{ik:'yenile'});
    k.appendChild(pre);
    k.appendChild(h('div',{class:'cb-kod-alt'},kop,yen));
    k.appendChild(h('details',{class:'cb-csp'},h('summary',{text:T('Sitende CSP (içerik güvenlik politikası) varsa','If your site uses a Content Security Policy')}),
      h('p',{class:'ipucu',text:T('Şu kaynakları izinli listeye ekle:','Allow these sources:')}),
      h('pre',{class:'cb-kod cb-kod-k',tabindex:'0'},h('code',{text:'script-src https://app.socialmediacorner.co; connect-src https://corner-forms.berkay-999.workers.dev'}))));
    p.appendChild(k);

    /* Instagram */
    var ig=kart('Instagram DM',T('Instagram\'a gelen mesajlara bot cevap verir.','The bot replies to Instagram messages.'));
    R.igKap=h('div',{class:'cb-ig'});
    ig.appendChild(R.igKap);
    igCiz();
    ig.appendChild(h('p',{class:'ipucu',text:T('Instagram, yalnız son mesajdan sonraki 24 saat içinde cevap vermeye izin verir.','Instagram only allows replies within 24 hours of the last message.')}));
    ig.appendChild(h('p',{class:'ipucu',text:T('Bağlantı butonları Instagram\'da görünmez.','Link buttons are not shown on Instagram.')}));
    p.appendChild(ig);
  }
  function secMetin(el){try{var r=d.createRange();r.selectNodeContents(el);var s=window.getSelection();s.removeAllRanges();s.addRange(r);
    bildir(T('Kod seçildi; kopyalamak için Ctrl+C (Mac\'te ⌘C).','Code selected; press Ctrl+C (⌘C on Mac) to copy.'),'bilgi')}catch(e){}}
  function kodYaz(){
    if(!R.kod)return;
    var a=(S.tas.web&&S.tas.web.anahtar)||'wk_…';
    R.kod.textContent='<!-- Social Media Corner sohbet -->\n<script src="https://app.socialmediacorner.co/w/sohbet.js?v=1" data-bot="'+a+'" async></script>';
  }
  function anahtarYenile(b){
    var geri=api.mesgul(b,T('Yenileniyor…','Regenerating…'));
    istek('/gen/bot/'+S.bot.id+'/anahtar','POST',{}).then(function(j){
      geri();
      if(!j.ok){hataBildir(j);return}
      if(j.anahtar){S.bot.web=S.bot.web||{};S.bot.web.anahtar=j.anahtar;S.tas.web.anahtar=j.anahtar}
      kodYaz();bildir(T('Yeni anahtar hazır. Sitendeki kodu güncelle.','New key ready. Update the code on your site.'),'ok');
    });
  }
  function renkYazi(hex){var m=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex||'');if(!m)return '#fff';
    var c=[m[1],m[2],m[3]].map(function(x){var v=parseInt(x,16)/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});
    return (0.2126*c[0]+0.7152*c[1]+0.0722*c[2])>0.55?'#111':'#fff'}
  function onIzleKanal(){
    if(!R.kanalOn)return;bosalt(R.kanalOn);
    var w=S.tas.web,g=w.gorunum||{},renk=RENK_RE.test(g.renk||'')?g.renk:'#4f46e5';
    R.kanalOn.style.setProperty('--cb-renk',renk);R.kanalOn.style.setProperty('--cb-renk-yazi',renkYazi(renk));
    R.kanalOn.classList.toggle('cb-sol',g.konum==='sol');
    R.kanalOn.classList.toggle('cb-pasif',!w.aktif);
    var pen=h('div',{class:'cb-mini-panel'},h('div',{class:'cb-mini-bas',text:(g.baslik||'').trim()||botAdi(S.tas)}),
      h('p',{class:'cb-balon cb-balon-bot',text:(S.tas.karsilama||'').trim()||metinVars(S.tas,'karsilama')}));
    R.kanalOn.appendChild(pen);
    R.kanalOn.appendChild(h('span',{class:'cb-mini-balon'},ikon('sohbet')));
    if(!w.aktif)R.kanalOn.appendChild(h('span',{class:'rozet cb-mini-kapali',text:T('Kapalı','Off')}));
  }
  function igCiz(){
    if(!R.igKap)return;bosalt(R.igKap);
    var ig=S.tas.ig||{durum:'yakinda'},hes=ig.hesap?'@'+String(ig.hesap).replace(/^@/,''):'';
    var dur=ig.durum||'yakinda';
    if(!S.igAcik&&dur!=='aktif'&&dur!=='hazir')dur=dur==='bagli_degil'||dur==='izin_yok'||dur==='baska_botta'?dur:'yakinda';
    if(dur==='yakinda'){R.igKap.appendChild(h('div',{class:'cb-not'},ikon('uyari'),h('p',{text:T('Instagram DM yakında: Meta onayı bekleniyor.','Instagram DMs are coming soon: waiting for Meta approval.')})));return}
    if(dur==='bagli_degil'){R.igKap.appendChild(h('div',{class:'cb-not'},h('p',{text:T('Önce Instagram hesabını bağla.','Connect your Instagram account first.')}),
      h('a',{class:'btn btn-cizgi btn-kucuk',href:BAGLANTILAR,text:T('Instagram\'ı bağla','Connect Instagram')})));return}
    if(dur==='izin_yok'){R.igKap.appendChild(h('div',{class:'cb-not'},ikon('uyari'),h('p',{text:T('Mesaj izni yok; Instagram\'ı yeniden bağla.','No messaging permission; reconnect Instagram.')}),
      h('a',{class:'btn btn-cizgi btn-kucuk',href:BAGLANTILAR,text:T('Yeniden bağla','Reconnect')})));return}
    if(dur==='baska_botta'){var bb=ig.baska_bot||{};R.igKap.appendChild(h('div',{class:'cb-not'},
      h('p',{text:f(T('{h} şu an “{a}” botunda.','{h} is currently on the “{a}” bot.'),{h:hes||'Instagram',a:bb.ad||'?'})}),
      bb.id?dugme('btn-cizgi btn-kucuk',T('O bota git','Go to that bot'),function(){botYukle(bb.id)}):null));return}
    var hataP=h('p',{class:'alan-hata',role:'alert'});
    var sw=anahtar(f(T('{h} mesajlarına cevap ver','Reply to {h} messages'),{h:hes||'Instagram'}),dur==='aktif',function(v,inp){igDegistir(v,inp,hataP)});
    R.igKap.appendChild(sw);R.igKap.appendChild(hataP);
  }
  function igDegistir(v,inp,hataP){
    inp.disabled=true;hataP.textContent='';
    istek('/gen/bot/'+S.bot.id+'/kanal/ig','POST',{aktif:v}).then(function(j){
      inp.disabled=false;
      if(j.ok&&j.bot){var taban=kopyala(S.bot);birlestir(j.bot,taban);ustGuncelle();igCiz();
        var y=R.igKap.querySelector('input');if(y)y.focus();return}
      inp.checked=!v;
      var m={ig_kapali:T('Instagram DM yakında: Meta onayı bekleniyor.','Instagram DMs are coming soon: waiting for Meta approval.'),
        ig_bagli_degil:T('Önce Instagram hesabını bağla.','Connect your Instagram account first.'),
        ig_izin_yok:T('Mesaj izni yok; Instagram\'ı yeniden bağla.','No messaging permission; reconnect Instagram.'),
        ig_abone_hata:T('Instagram bağlantısı kurulamadı; biraz sonra yeniden dene.','Couldn\'t subscribe to Instagram; try again shortly.'),
        ig_kullanilamiyor:T('Bu Instagram hesabı başka bir hesapta kullanılıyor.','This Instagram account is used by another account.')}[j.error];
      if(j.error==='ig_baska_botta'&&j.bot)m=f(T('Bu hesap şu an “{a}” botunda.','This account is on the “{a}” bot.'),{a:j.bot.ad||'?'});
      if(m){hataP.textContent=m;return}
      hataBildir(j);
    });
  }

  /* =====================================================================
   * GELEN SEKMESİ (konuşmalar + lead'ler)
   * ===================================================================== */
  var anket=null;
  function gelenDurdur(){if(anket){clearInterval(anket);anket=null}}
  function gelenAnket(){gelenDurdur();anket=setInterval(function(){
    if(d.visibilityState!=='visible'||S.sekme!=='gelen')return;
    if(S.gelen.gor==='konusmalar'){if(S.gelen.secili)konusmaAc(S.gelen.secili,true);else konusmaListeYukle(false,true)}
  },20000)}
  function gelenCiz(p){
    var oz=S.tas.ozet||{};
    var r1=oz.okunmamis?h('span',{class:'cb-sayi-rozet',text:String(oz.okunmamis)}):null;
    var r2=oz.yeni_lead?h('span',{class:'cb-sayi-rozet',text:String(oz.yeni_lead)}):null;
    p.appendChild(segment('cb-gelen-gor',T('Görünüm','View'),[{d:'konusmalar',ad:T('Konuşmalar','Conversations'),rozet:r1},{d:'leadler',ad:T("Lead'ler",'Leads'),rozet:r2}],
      S.gelen.gor,function(v){S.gelen.gor=v;S.gelen.secili=null;gelenIcCiz()},{gizli:true}));
    R.gelenIc=h('div',{class:'cb-gelen'});
    p.appendChild(R.gelenIc);
    gelenIcCiz();
    gelenAnket();
  }
  function gelenIcCiz(){
    bosalt(R.gelenIc);
    if(S.gelen.gor==='leadler'){leadlerCiz();return}
    if(S.gelen.secili){konusmaDetayCiz();return}
    var filtreler=[{d:'',ad:T('Tümü','All')},{d:'web',ad:'Web'},{d:'ig',ad:'Instagram'},{d:'devir',ad:T('Devredilen','Handed off')},{d:'okunmamis',ad:T('Okunmamış','Unread')}];
    R.gelenIc.appendChild(segment('cb-filtre',T('Filtre','Filter'),filtreler,S.gelen.filtre,function(v){S.gelen.filtre=v;konusmaListeYukle(false)},{gizli:true}));
    R.konListe=h('ul',{class:'cb-kon-liste','aria-label':T('Konuşmalar','Conversations'),'aria-busy':'true'});
    R.gelenIc.appendChild(R.konListe);
    R.konDaha=h('div',{class:'cb-daha'});
    R.gelenIc.appendChild(R.konDaha);
    if(S.gelen.liste.length)konusmaListeCiz();
    konusmaListeYukle(false);
  }
  function filtreSorgu(){var x=S.gelen.filtre;return x==='web'||x==='ig'?'kanal='+x:x?'filtre='+x:''}
  function konusmaListeYukle(devam,sessiz){
    if(S.gelen.yuk)return;S.gelen.yuk=true;
    var q=filtreSorgu(),of=devam?S.gelen.liste.length:0;
    var yol='/gen/bot/'+S.bot.id+'/konusmalar'+(q||of?'?':'')+q+(of?(q?'&':'')+'ofset='+of:'');
    var id=S.bot.id;
    istek(yol,'GET').then(function(j){
      S.gelen.yuk=false;
      if(!S.bot||S.bot.id!==id||!R.konListe||!R.konListe.isConnected)return;
      R.konListe.removeAttribute('aria-busy');
      if(!j.ok){if(!sessiz)hataBildir(j);return}
      S.gelen.liste=devam?S.gelen.liste.concat(j.konusmalar||[]):(j.konusmalar||[]);
      S.gelen.devam=!!j.devam;
      konusmaListeCiz();
    });
  }
  function kisiAd(k){return k.ad||(k.kanal==='ig'?T('Instagram kullanıcısı','Instagram user'):T('Ziyaretçi','Visitor'))}
  function konusmaListeCiz(){
    bosalt(R.konListe);bosalt(R.konDaha);
    var l=S.gelen.liste;
    if(!l.length){R.konListe.appendChild(h('li',{class:'bos'},h('p',{text:S.gelen.filtre?T('Bu filtrede konuşma yok.','No conversations for this filter.'):
      T('Henüz konuşma yok. Botun sitende ya da Instagram\'da konuşmaya başlayınca burada görünür.','No conversations yet. They show up here once your bot starts talking on your site or Instagram.')})));return}
    l.forEach(function(k){
      var b=h('button',{type:'button',class:'cb-kon'+(k.okunmadi?' cb-kon-yeni':'')},
        h('span',{class:'cb-kon-ust'},h('span',{class:'cb-kon-ad',text:kisiAd(k)}),h('span',{class:'cb-kon-zaman',text:zaman(k.updated_at)})),
        h('span',{class:'cb-kon-son',text:k.son_mesaj||''}),
        h('span',{class:'cb-kon-rozet'},
          h('span',{class:'rozet',text:k.kanal==='ig'?'Instagram':'Web'}),
          k.devir?h('span',{class:'rozet rozet-uyari',text:T('Devredildi','Handed off')}):null,
          k.lead?h('span',{class:'rozet rozet-ok',text:'Lead'}):null,
          k.okunmadi?h('span',{class:'cb-sayi-rozet',text:String(k.okunmadi)},sr(T(' okunmamış',' unread'))):null));
      b.addEventListener('click',function(){S.gelen.secili=k.id;S.gelen.detay=null;gelenIcCiz()});
      R.konListe.appendChild(h('li',null,b));
    });
    if(S.gelen.devam)R.konDaha.appendChild(dugme('btn-cizgi',T('Daha fazla göster','Show more'),function(){konusmaListeYukle(true)}));
  }
  function konusmaDetayCiz(){
    var geri=dugme('btn-metin cb-geri',T('Konuşmalar','Conversations'),function(){S.gelen.secili=null;S.gelen.detay=null;gelenIcCiz();
      var x=R.konListe&&R.konListe.querySelector('button');if(x)x.focus()},{ik:'geri'});
    R.gelenIc.appendChild(geri);
    R.detay=h('div',{class:'cb-detay sheet','aria-busy':'true'},h('p',{class:'cb-yukleniyor',text:T('Yükleniyor…','Loading…')}));
    R.gelenIc.appendChild(R.detay);
    if(S.gelen.detay)detayCiz(S.gelen.detay);
    konusmaAc(S.gelen.secili,false);
    geri.focus();
  }
  function konusmaAc(kid,sessiz){
    var id=S.bot.id;
    istek('/gen/bot/'+id+'/konusma/'+kid,'GET').then(function(j){
      if(!S.bot||S.bot.id!==id||S.gelen.secili!==kid||!R.detay||!R.detay.isConnected)return;
      if(!j.ok){if(!sessiz){if(j.error==='bulunamadi'){S.gelen.secili=null;gelenIcCiz();bildir(T('Konuşma bulunamadı.','Conversation not found.'),'uyari');return}hataBildir(j)}return}
      var once=S.gelen.detay;
      S.gelen.detay=j;
      var l=S.gelen.liste.filter(function(x){return x.id===kid})[0];
      if(l&&l.okunmadi&&S.tas.ozet){S.tas.ozet.okunmamis=Math.max(0,(S.tas.ozet.okunmamis||0)-l.okunmadi);l.okunmadi=0;sekmeRozetYenile()}
      if(!once||!esit(once.mesajlar,j.mesajlar)||!esit(once.konusma,j.konusma))detayCiz(j);
    });
  }
  function sekmeRozetYenile(){var a=d.activeElement;sekmeBaslikCiz();if(a&&a.id&&!a.isConnected){var x=d.getElementById(a.id);if(x)x.focus()}}
  function detayCiz(j){
    var k=j.konusma||{},det=R.detay;bosalt(det);det.removeAttribute('aria-busy');
    var bas=h('div',{class:'cb-detay-bas'},
      h('div',null,h('h3',{text:kisiAd(k)}),h('p',{class:'ipucu',text:(k.kanal==='ig'?'Instagram':'Web')+' · '+zaman(k.created_at,true)+' · '+f(T('{n} mesaj','{n} messages'),{n:k.mesaj_sayisi||(j.mesajlar||[]).length})})));
    var dev=k.devir;
    var devB=dugme(dev?'btn-cizgi btn-kucuk':'btn-ana btn-kucuk',dev?T('Botu geri aç','Turn the bot back on'):T('Ben devralıyorum','I\'ll take over'),function(b){
      var g=api.mesgul(b,T('Kaydediliyor…','Saving…'));
      istek('/gen/bot/'+S.bot.id+'/konusma/'+k.id+'/devir','POST',{devir:!dev}).then(function(r){g();
        if(!r.ok){hataBildir(r);return}
        j.konusma=r.konusma||Object.assign({},k,{devir:!dev});
        S.gelen.liste.forEach(function(x){if(x.id===k.id)x.devir=j.konusma.devir});
        detayCiz(j);var y=R.detay.querySelector('.cb-detay-d .btn');if(y)y.focus();
        canliDuyur(j.konusma.devir?T('Konuşmayı devraldın; bot bu konuşmada susar.','You took over; the bot stays quiet here.'):T('Bot bu konuşmada yeniden cevap veriyor.','The bot is answering this conversation again.'));
      })});
    var silB=dugme('btn-metin btn-kucuk cb-tehlike-metin',T('Sil','Delete'),function(b){
      onayla(T('Konuşmayı sil?','Delete conversation?'),T('Mesajlar kalıcı olarak silinir. Bağlı lead kalır.','Messages are deleted for good. A linked lead is kept.'),T('Sil','Delete'),function(){
        istek('/gen/bot/'+S.bot.id+'/konusma/'+k.id+'/sil','POST',{}).then(function(r){
          if(!r.ok){hataBildir(r);return}
          S.gelen.liste=S.gelen.liste.filter(function(x){return x.id!==k.id});S.gelen.secili=null;S.gelen.detay=null;gelenIcCiz();
          bildir(T('Konuşma silindi.','Conversation deleted.'),'ok');
        })},b)},{ik:'cop'});
    bas.appendChild(h('div',{class:'cb-detay-d'},devB,silB));
    det.appendChild(bas);
    if(dev)det.appendChild(h('p',{class:'bildirim bildirim-uyari'},h('span',{text:T('Bu konuşmayı devraldın; bot burada cevap vermez. Ziyaretçiye kendi kanalından (Instagram uygulaması, e-posta ya da telefon) dön.','You took over this conversation; the bot won\'t reply here. Reach the visitor through your own channel (Instagram app, email or phone).')})));
    var log=h('ol',{class:'cb-thread','aria-label':T('Mesajlar','Messages')});
    (j.mesajlar||[]).forEach(function(m){log.appendChild(mesajLi(m))});
    if(!(j.mesajlar||[]).length)log.appendChild(h('li',{class:'ipucu',text:T('Mesaj yok.','No messages.')}));
    det.appendChild(log);
    if(j.lead){var ld=j.lead;det.appendChild(h('div',{class:'cb-lead-kutu'},h('p',{class:'ust-etiket',text:T('Bıraktığı bilgiler','Contact details')}),
      h('dl',null,ld.ad?[h('dt',{text:T('Ad','Name')}),h('dd',{text:ld.ad})]:null,
        ld.eposta?[h('dt',{text:T('E-posta','Email')}),h('dd',null,h('a',{href:'mailto:'+ld.eposta,text:ld.eposta}))]:null,
        ld.telefon?[h('dt',{text:T('Telefon','Phone')}),h('dd',null,h('a',{href:'tel:'+ld.telefon.replace(/[^\d+]/g,''),text:ld.telefon}))]:null,
        ld.notu?[h('dt',{text:T('Not','Note')}),h('dd',{text:ld.notu})]:null)))}
  }
  function niyetAdi(k){var n=(S.tas.niyetler||[]).filter(function(x){return x.k===k})[0];return n?(n.ad||k):k}
  function mesajLi(m){
    if(m.rol==='sistem'){
      var t={devir_acildi:T('Konuşma ekibe devredildi','Conversation handed to the team'),devir_kapandi:T('Bot yeniden açıldı','Bot turned back on'),lead_alindi:T('İletişim bilgisi bırakıldı','Contact details left')}[m.metin]||m.metin;
      return h('li',{class:'cb-sistem'},h('span',{text:t+' · '+zaman(m.created_at)}));
    }
    var bot=m.rol==='bot';
    var etiketler=h('span',{class:'cb-mesaj-meta'});
    if(m.kaynak&&KAYNAK[m.kaynak])etiketler.appendChild(h('span',{class:'cb-kaynak cb-kaynak-'+m.kaynak,text:KAYNAK[m.kaynak]}));
    if(bot&&m.niyet)etiketler.appendChild(h('span',{class:'cb-eslesme',text:niyetAdi(m.niyet)+(m.puan!=null?' · '+Number(m.puan).toFixed(2):'')}));
    etiketler.appendChild(h('time',{datetime:(utc(m.created_at)||new Date()).toISOString(),text:zaman(m.created_at)}));
    if(m.hata)etiketler.appendChild(h('span',{class:'cb-mesaj-hata',title:m.hata},ikon('uyari'),sr(f(T('İletilemedi: {h}','Not delivered: {h}'),{h:m.hata}))));
    var li=h('li',{class:'cb-mesaj '+(bot?'cb-mesaj-bot':'cb-mesaj-kul')},
      sr(bot?T('Bot: ','Bot: '):T('Ziyaretçi: ','Visitor: ')),
      h('p',{class:'cb-balon '+(bot?'cb-balon-bot':'cb-balon-kul'),text:m.metin||''}));
    if(m.butonlar&&m.butonlar.length){var r=h('div',{class:'cb-pil-sira'});m.butonlar.forEach(function(b){r.appendChild(pil(b))});li.appendChild(r)}
    li.appendChild(etiketler);
    return li;
  }

  /* lead'ler */
  function leadlerCiz(){
    var ust=h('div',{class:'cb-lead-ust'});
    ust.appendChild(segment('cb-lead-d',T('Durum','Status'),[{d:'',ad:T('Tümü','All')},{d:'yeni',ad:T('Yeni','New')},{d:'islendi',ad:T('İşlendi','Done')}],S.gelen.leadDurum,
      function(v){S.gelen.leadDurum=v;leadYukle(false)},{gizli:true}));
    R.leadToplam=h('span',{class:'ipucu'});
    var csv=dugme('btn-cizgi btn-kucuk',T('CSV indir','Download CSV'),function(b){csvIndir(b)},{ik:'indir'});
    ust.appendChild(h('div',{class:'cb-lead-d'},R.leadToplam,csv));
    R.gelenIc.appendChild(ust);
    R.leadKap=h('div',{class:'cb-lead-kap','aria-busy':'true'});
    R.gelenIc.appendChild(R.leadKap);
    R.leadDaha=h('div',{class:'cb-daha'});
    R.gelenIc.appendChild(R.leadDaha);
    if(S.gelen.leadler.length)leadTabloCiz();
    leadYukle(false);
  }
  function leadYol(of){var q=[];if(S.gelen.leadDurum)q.push('durum='+S.gelen.leadDurum);if(of)q.push('ofset='+of);return '/gen/bot/'+S.bot.id+'/leadler'+(q.length?'?'+q.join('&'):'')}
  function leadYukle(devam){
    var id=S.bot.id;
    istek(leadYol(devam?S.gelen.leadler.length:0),'GET').then(function(j){
      if(!S.bot||S.bot.id!==id||!R.leadKap||!R.leadKap.isConnected)return;
      R.leadKap.removeAttribute('aria-busy');
      if(!j.ok){hataBildir(j);return}
      S.gelen.leadler=devam?S.gelen.leadler.concat(j.leadler||[]):(j.leadler||[]);
      S.gelen.leadDevam=!!j.devam;S.gelen.leadToplam=j.toplam||S.gelen.leadler.length;
      leadTabloCiz();
    });
  }
  function leadTabloCiz(){
    bosalt(R.leadKap);bosalt(R.leadDaha);
    R.leadToplam.textContent=f(T('{n} lead','{n} leads'),{n:sayi(S.gelen.leadToplam)});
    var l=S.gelen.leadler;
    if(!l.length){R.leadKap.appendChild(h('div',{class:'bos'},h('p',{text:T('Henüz lead yok. Ziyaretçiler "Bilgilerimi bırak" ile iletişim bilgisi bırakınca burada görünür.','No leads yet. They appear here when visitors leave their details.')})));return}
    var kol=[T('Ad','Name'),T('E-posta','Email'),T('Telefon','Phone'),T('Not','Note'),T('Kanal','Channel'),T('Tarih','Date'),T('Durum','Status'),''];
    var tb=h('tbody');
    l.forEach(function(x){
      var sid=yid('ld');
      var sel=h('select',{class:'kutu cb-lead-sel',id:sid,'aria-label':f(T('Durum: {a}','Status: {a}'),{a:x.ad||x.eposta||x.telefon||'lead'})},
        h('option',{value:'yeni',text:T('Yeni','New')}),h('option',{value:'islendi',text:T('İşlendi','Done')}));
      sel.value=x.durum==='islendi'?'islendi':'yeni';
      sel.addEventListener('change',function(){var v=sel.value,eski=x.durum;sel.disabled=true;
        istek('/gen/bot/'+S.bot.id+'/lead/'+x.id,'POST',{durum:v}).then(function(r){sel.disabled=false;
          if(!r.ok){sel.value=eski;hataBildir(r);return}
          x.durum=v;if(S.tas.ozet){S.tas.ozet.yeni_lead=Math.max(0,(S.tas.ozet.yeni_lead||0)+(v==='yeni'?1:-1))}
          canliDuyur(T('Durum güncellendi','Status updated'))})});
      var sil=ikonDugme('cop',f(T('Lead\'i sil: {a}','Delete lead: {a}'),{a:x.ad||x.eposta||x.telefon||''}),function(b){
        onayla(T('Lead\'i sil?','Delete lead?'),T('Bu kişinin bilgileri kalıcı olarak silinir.','This person\'s details are deleted for good.'),T('Sil','Delete'),function(){
          istek('/gen/bot/'+S.bot.id+'/lead/'+x.id+'/sil','POST',{}).then(function(r){
            if(!r.ok){hataBildir(r);return}
            S.gelen.leadler=S.gelen.leadler.filter(function(y){return y.id!==x.id});S.gelen.leadToplam=Math.max(0,S.gelen.leadToplam-1);
            leadTabloCiz();bildir(T('Lead silindi.','Lead deleted.'),'ok')})},b)},'cb-tehlike-metin');
      tb.appendChild(h('tr',null,
        h('td',{'data-et':kol[0],class:'cb-td-ad',text:x.ad||'—'}),
        h('td',{'data-et':kol[1]},x.eposta?h('a',{href:'mailto:'+x.eposta,text:x.eposta}):'—'),
        h('td',{'data-et':kol[2]},x.telefon?h('a',{href:'tel:'+String(x.telefon).replace(/[^\d+]/g,''),text:x.telefon}):'—'),
        h('td',{'data-et':kol[3],class:'cb-td-not',text:x.notu||'—'}),
        h('td',{'data-et':kol[4],text:x.kanal==='ig'?'Instagram':'Web'}),
        h('td',{'data-et':kol[5],text:zaman(x.created_at,true)}),
        h('td',{'data-et':kol[6]},sel),
        h('td',{class:'cb-td-sil'},sil)));
    });
    var tab=h('table',{class:'cb-tablo'},h('caption',{class:'sr',text:T("Lead'ler",'Leads')}),
      h('thead',null,h('tr',null,kol.map(function(c,i){return h('th',{scope:'col'},i===7?sr(T('İşlem','Action')):c)}))),tb);
    R.leadKap.appendChild(tab);
    if(S.gelen.leadDevam)R.leadDaha.appendChild(dugme('btn-cizgi',T('Daha fazla göster','Show more'),function(){leadYukle(true)}));
  }
  function csvHucre(v){v=v==null?'':String(v);if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'}
  function csvIndir(b){
    var geri=api.mesgul(b,T('Hazırlanıyor…','Preparing…'));
    var tum=S.gelen.leadler.slice(),dongu=0;
    function bitir(){
      geri();
      var satir=[['ad','eposta','telefon','not','kanal','tarih','durum'].map(csvHucre).join(',')];
      tum.forEach(function(x){satir.push([x.ad,x.eposta,x.telefon,x.notu,x.kanal,x.created_at,x.durum].map(csvHucre).join(','))});
      var blob=new Blob(['﻿'+satir.join('\r\n')],{type:'text/csv;charset=utf-8'});
      var url=URL.createObjectURL(blob);
      var gun=new Date().toISOString().slice(0,10);
      var ad=(S.tas.ad||'bot').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'bot';
      var a=h('a',{href:url,download:'leadler-'+ad+'-'+gun+'.csv',class:'sr'});
      d.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(url);a.remove()},1000);
    }
    function devam(){
      if(!S.gelen.leadDevam||dongu>40){bitir();return}
      dongu++;
      istek(leadYol(tum.length),'GET').then(function(j){
        if(!j.ok){geri();hataBildir(j);return}
        tum=tum.concat(j.leadler||[]);if(!j.devam||!(j.leadler||[]).length){bitir();return}
        S.gelen.leadDevam=true;var t=tum.length;if(t>=(j.toplam||0)){bitir();return}devam();
      });
    }
    devam();
  }

  /* =====================================================================
   * İSTATİSTİK SEKMESİ
   * ===================================================================== */
  function istatistikCiz(p){
    p.appendChild(segment('cb-ist-gun',T('Aralık','Range'),[{d:'7',ad:T('7 gün','7 days')},{d:'30',ad:T('30 gün','30 days')},{d:'90',ad:T('90 gün','90 days')}],String(S.ist.gun),
      function(v){S.ist.gun=Number(v);istYukle()},{gizli:true}));
    R.ist=h('div',{class:'cb-ist','aria-busy':'true'});
    p.appendChild(R.ist);
    if(S.ist.veri&&S.ist.veri.gun===S.ist.gun)istCiz(S.ist.veri);else R.ist.appendChild(h('p',{class:'cb-yukleniyor',text:T('Yükleniyor…','Loading…')}));
    istYukle();
  }
  function istYukle(){
    var id=S.bot.id,gun=S.ist.gun;
    R.ist.setAttribute('aria-busy','true');
    istek('/gen/bot/'+id+'/istatistik?gun='+gun,'GET').then(function(j){
      if(!S.bot||S.bot.id!==id||!R.ist||!R.ist.isConnected||gun!==S.ist.gun)return;
      R.ist.removeAttribute('aria-busy');
      if(!j.ok){bosalt(R.ist);R.ist.appendChild(h('div',{class:'bos'},h('p',{text:T('İstatistik şu an alınamadı.','Stats are unavailable right now.')})));hataBildir(j);return}
      if(j.kota){S.kota=j.kota;kotaCiz()}
      S.ist.veri=j;istCiz(j);
    });
  }
  function istCiz(j){
    bosalt(R.ist);
    var t=j.toplam||{};
    var kpi=[[T('Konuşma','Conversations'),sayi(t.konusma)],[T('Gelen mesaj','Incoming messages'),sayi(t.gelen)],[T('Hazır cevap','Quick replies'),sayi(t.hazir)],
      ['AI '+T('cevap','replies'),sayi(t.ai)],[T('Eşleşme oranı','Match rate'),'%'+sayi(Math.round((t.eslesme_orani||0)*1000)/10)],['Lead',sayi(t.lead)],[T('Devir','Handoffs'),sayi(t.devir)]];
    R.ist.appendChild(h('dl',{class:'cb-kpi'},kpi.map(function(x){return h('div',{class:'cb-kpi-k'},h('dt',{text:x[0]}),h('dd',{text:x[1]}))})));
    var gunluk=j.gunluk||[];
    var top=gunluk.reduce(function(a,x){return a+(x.hazir||0)+(x.ai||0)+(x.geri||0)+(x.kota||0)},0);
    var gk=kart(T('Günlük bot cevapları','Daily bot replies'));
    if(!top)gk.appendChild(h('div',{class:'bos'},h('p',{text:T('Bu aralıkta veri yok. Botun konuşmaya başlayınca burada görünür.','No data in this range yet. It shows up once your bot starts talking.')})));
    else gk.appendChild(grafik(gunluk));
    R.ist.appendChild(gk);
    var ik=h('div',{class:'cb-iki cb-ist-iki'});
    var nk=kart(T('En çok eşleşen cevaplar','Top matched replies'));
    var nl=j.niyetler||[];
    if(!nl.length)nk.appendChild(h('p',{class:'ipucu',text:T('Henüz eşleşme yok.','No matches yet.')}));
    else{var mx=nl.reduce(function(a,x){return Math.max(a,x.n||0)},1);var ol=h('ol',{class:'cb-top'});
      nl.slice(0,10).forEach(function(x){var c=h('span',{class:'cb-top-cubuk','aria-hidden':'true'});c.style.setProperty('--oran',String((x.n||0)/mx));
        ol.appendChild(h('li',null,h('span',{class:'cb-top-ad',text:x.ad||x.k}),h('span',{class:'cb-top-n',text:sayi(x.n)}),c))});
      nk.appendChild(ol)}
    ik.appendChild(nk);
    var ek=kart(T('Cevaplanamayan sorular','Unanswered questions'),T('Bunları hazır cevap olarak ekleyip botu güçlendir.','Add these as quick replies to make your bot smarter.'));
    var el=j.eslesmeyen||[];
    if(!el.length)ek.appendChild(h('p',{class:'ipucu',text:T('Hepsine cevap verildi.','Everything was answered.')}));
    else{var ul=h('ul',{class:'cb-eslesmeyen'});
      el.forEach(function(x){ul.appendChild(h('li',null,h('div',null,h('p',{class:'cb-esl-metin',text:x.metin}),h('span',{class:'ipucu',text:zaman(x.created_at,true)})),
        dugme('btn-cizgi btn-kucuk',T('Cevap olarak ekle','Add as reply'),function(){sekmeSec('cevaplar',false);niyetEkle(String(x.metin||'').trim())},{ik:'arti'})))});
      ek.appendChild(ul)}
    ik.appendChild(ek);
    R.ist.appendChild(ik);
  }
  function grafik(gunluk){
    var n=gunluk.length,G=Math.max(n*14,280),Y=160,bw=Math.max(2,Math.min(18,G/n*0.7)),adim=G/n;
    var mx=gunluk.reduce(function(a,x){return Math.max(a,(x.hazir||0)+(x.ai||0)+(x.geri||0)+(x.kota||0))},1);
    var s=sv('svg',{viewBox:'0 0 '+G+' '+(Y+4),'class':'cb-grafik',role:'img',preserveAspectRatio:'none'});
    var tt=sv('title',{});var ozet=f(T('{g} günde {h} hazır, {a} AI, {r} geri dönüş cevabı.','{h} quick, {a} AI, {r} fallback replies over {g} days.'),{g:n,
      h:sayi(gunluk.reduce(function(a,x){return a+(x.hazir||0)},0)),a:sayi(gunluk.reduce(function(a,x){return a+(x.ai||0)},0)),r:sayi(gunluk.reduce(function(a,x){return a+(x.geri||0)+(x.kota||0)},0))});
    tt.textContent=ozet;s.appendChild(tt);
    [0.5,1].forEach(function(o){s.appendChild(sv('line',{x1:0,x2:G,y1:Y-Y*o+2,y2:Y-Y*o+2,'class':'cb-g-izgara'}))});
    gunluk.forEach(function(x,i){
      var g=sv('g',{});var yy=Y+2,xx=i*adim+(adim-bw)/2;
      var tl=sv('title',{});tl.textContent=gunAd(x.gun)+': '+[KAYNAK.hazir+' '+(x.hazir||0),'AI '+(x.ai||0),KAYNAK.geri+' '+((x.geri||0)+(x.kota||0))].join(', ');g.appendChild(tl);
      [['hazir',x.hazir||0],['ai',x.ai||0],['geri',(x.geri||0)+(x.kota||0)]].forEach(function(p){
        if(!p[1])return;var hh=p[1]/mx*Y;yy-=hh;g.appendChild(sv('rect',{x:xx.toFixed(1),y:yy.toFixed(1),width:bw.toFixed(1),height:Math.max(1,hh).toFixed(1),'class':'cb-g-'+p[0]}));
      });
      s.appendChild(g);
    });
    var lej=h('ul',{class:'cb-lejant'},[['hazir',KAYNAK.hazir],['ai','AI'],['geri',KAYNAK.geri]].map(function(x){return h('li',null,h('span',{class:'cb-lej-'+x[0],'aria-hidden':'true'}),x[1])}));
    var ek=h('div',{class:'cb-grafik-eks','aria-hidden':'true'},h('span',{text:gunAd(gunluk[0].gun)}),h('span',{text:gunAd(gunluk[n-1].gun)}));
    return h('figure',{class:'cb-grafik-kap'},s,ek,h('figcaption',null,lej,h('span',{class:'sr',text:ozet})));
  }

  /* =====================================================================
   * TEST ET (telefon önizlemesi)
   * ===================================================================== */
  function testKur(){
    R.test=h('div',{class:'cb-test'});
    var bas=h('div',{class:'cb-test-bas'},h('h2',{id:'cb-test-b',text:T('Test et','Test')}),
      dugme('btn-metin btn-kucuk',T('Sıfırla','Reset'),function(){S.test=[];testCiz();R.testGiris.focus()},{ik:'yenile'}));
    R.testKapat=ikonDugme('kapat',T('Kapat','Close'),function(){if(R.cekmece&&R.cekmece.open)R.cekmece.close()},'cb-test-kapat');
    bas.appendChild(R.testKapat);
    R.test.appendChild(bas);
    R.telBas=h('div',{class:'cb-tel-ust'});
    R.telLog=h('div',{class:'cb-tel-log',role:'log','aria-live':'polite','aria-labelledby':'cb-test-b',tabindex:'0'});
    R.testGiris=h('textarea',{class:'cb-tel-g',rows:'1',maxlength:String(SN.MESAJ),'aria-label':T('Test mesajı','Test message'),placeholder:T('Bir soru yaz…','Type a question…'),enterkeyhint:'send'});
    var gon=h('button',{type:'submit',class:'cb-tel-gonder','aria-label':T('Gönder','Send')},ikon('gonder'));
    var form=h('form',{class:'cb-tel-yaz'},R.testGiris,gon);
    form.addEventListener('submit',function(e){e.preventDefault();var v=R.testGiris.value.trim();if(!v||S.testMesgul)return;R.testGiris.value='';testGonder({metin:v},v)});
    R.testGiris.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit?form.requestSubmit():form.dispatchEvent(new Event('submit',{cancelable:true}))}});
    var tel=h('div',{class:'cb-telefon'},R.telBas,R.telLog,form);
    R.test.appendChild(tel);
    R.test.appendChild(h('p',{class:'ipucu cb-test-not',text:T('Test mesajları kotandan düşer (Test etiketiyle sayılır). Kaydedilmemiş değişiklikler de denenir.','Test messages count toward your quota (tagged as Test). Unsaved changes are tried too.')}));
    yerlestir();
    if(mqGenis.addEventListener)mqGenis.addEventListener('change',yerlestir);else if(mqGenis.addListener)mqGenis.addListener(yerlestir);
    testCiz();
  }
  function yerlestir(){
    if(!R.test)return;
    if(mqGenis.matches){
      if(R.cekmece&&R.cekmece.open)R.cekmece.close();
      R.testYan.appendChild(R.test);R.testKapat.hidden=true;
    }else{
      if(!R.cekmece){
        R.cekmece=h('dialog',{class:'cb-cekmece','aria-labelledby':'cb-test-b'});
        R.cekmece.addEventListener('click',function(e){if(e.target===R.cekmece)R.cekmece.close()});
        R.cekmece.addEventListener('close',function(){if(R.testAc&&R.testAc.isConnected)R.testAc.focus()});
        d.body.appendChild(R.cekmece);
      }
      R.cekmece.appendChild(R.test);R.testKapat.hidden=false;
    }
  }
  function testCekmeceAc(){
    if(mqGenis.matches){R.testGiris.focus();return}
    yerlestir();
    if(!R.cekmece.open){try{R.cekmece.showModal()}catch(e){R.cekmece.setAttribute('open','')}}
    setTimeout(function(){R.testGiris.focus()},30);
  }
  function telBasCiz(){
    bosalt(R.telBas);
    var g=(S.tas.web&&S.tas.web.gorunum)||{},renk=RENK_RE.test(g.renk||'')?g.renk:'#4f46e5';
    R.telBas.style.setProperty('--cb-renk',renk);R.telBas.style.setProperty('--cb-renk-yazi',renkYazi(renk));
    R.telBas.appendChild(h('span',{class:'cb-tel-avatar','aria-hidden':'true'},ikon('sohbet')));
    R.telBas.appendChild(h('span',{class:'cb-tel-ad',text:(g.baslik||'').trim()||botAdi(S.tas)}));
    if(S.testDevir)R.telBas.appendChild(h('span',{class:'cb-tel-devir',text:T('Ekibe aktarıldı','Passed to our team')}));
  }
  function testKarsilamaYenile(){if(R.telLog&&!S.test.length&&!S.testMesgul)testCiz();else if(R.telBas)telBasCiz()}
  function testCiz(){
    if(!R.telLog)return;
    telBasCiz();
    bosalt(R.telLog);
    var kars={rol:'bot',metin:(S.tas.karsilama||'').trim()||metinVars(S.tas,'karsilama'),butonlar:S.tas.menu||[],kaynak:'karsilama',yerel:true};
    var l=[kars].concat(S.test);
    l.forEach(function(m,i){R.telLog.appendChild(testBalon(m,i===l.length-1))});
    if(S.testMesgul)R.telLog.appendChild(h('div',{class:'cb-yaziyor',role:'status'},h('span',{'aria-hidden':'true'}),h('span',{'aria-hidden':'true'}),h('span',{'aria-hidden':'true'}),sr(T('Bot yazıyor…','Bot is typing…'))));
    R.telLog.scrollTop=R.telLog.scrollHeight;
  }
  function testBalon(m,son){
    if(m.rol==='sistem')return h('p',{class:'cb-tel-sistem',text:m.metin});
    var bot=m.rol==='bot';
    var kap=h('div',{class:'cb-tel-m '+(bot?'cb-tel-bot':'cb-tel-kul')});
    kap.appendChild(h('p',{class:'cb-balon '+(bot?'cb-balon-bot':'cb-balon-kul')},bot?null:sr(T('Sen: ','You: ')),bot?sr(T('Bot: ','Bot: ')):null,m.metin));
    if(bot&&!m.yerel){
      var meta=h('span',{class:'cb-mesaj-meta'});
      if(m.kaynak&&KAYNAK[m.kaynak])meta.appendChild(h('span',{class:'cb-kaynak cb-kaynak-'+m.kaynak,text:KAYNAK[m.kaynak]}));
      if(m.eslesme)meta.appendChild(h('span',{class:'cb-eslesme',text:(m.eslesme.ad||m.eslesme.k)+' · '+Number(m.eslesme.puan||0).toFixed(2)}));
      if(m.aiHata)meta.appendChild(h('span',{class:'cb-mesaj-hata',text:T('AI hata verdi','AI error')}));
      kap.appendChild(meta);
    }
    if(bot&&m.butonlar&&m.butonlar.length){
      var r=h('div',{class:'cb-tel-butonlar'});
      m.butonlar.forEach(function(b){
        var url=b.hedef&&b.hedef.indexOf('url:')===0;
        if(url){r.appendChild(h('a',{class:'cb-tel-b',href:b.hedef.slice(4),target:'_blank',rel:'noopener noreferrer',text:b.etiket||b.hedef.slice(4)}));return}
        var x=h('button',{type:'button',class:'cb-tel-b',text:b.etiket||'…'});
        if(!son)x.setAttribute('aria-disabled','true');
        x.addEventListener('click',function(){if(S.testMesgul||x.getAttribute('aria-disabled')==='true')return;testGonder({buton:b.hedef},b.etiket||b.hedef)});
        r.appendChild(x);
      });
      kap.appendChild(r);
    }
    return kap;
  }
  function testGonder(girdi,gosterim){
    if(!S.bot)return;
    S.test.push({rol:'kullanici',metin:gosterim});
    S.testMesgul=true;testCiz();
    var gecmis=S.test.slice(0,-1).filter(function(m){return m.rol!=='sistem'}).slice(-10).map(function(m){return {rol:m.rol==='bot'?'bot':'kullanici',metin:String(m.metin||'').slice(0,SN.MESAJ)}});
    var govde=Object.assign({gecmis:gecmis},girdi);
    var fk=farklar();if(Object.keys(fk).length)govde.taslak=fk;
    istek('/gen/bot/'+S.bot.id+'/test','POST',govde).then(function(j){
      S.testMesgul=false;
      if(!j.ok){
        var m=hataMetni(j);
        if(j.error==='invalid'){m=f(T('Taslakta düzeltilmesi gereken bir alan var: {a}.','A draft field needs fixing: {a}.'),{a:alanAdi(j.alan||'')});hatalariIsle([{alan:j.alan||'',neden:j.neden||'bos'}],false)}
        if(!m)m=j._s===0?T('Sunucuya ulaşılamadı.','Couldn\'t reach the server.'):f(T('Test şu an çalışmadı. (Kod: {k})','Test failed. (Code: {k})'),{k:j.error||j._s});
        S.test.push({rol:'sistem',metin:m});testCiz();
        if(j._s===401||(j._s===403&&j.error==='origin'))api.genelHata(j);
        return;
      }
      if(j.kota){S.kota=j.kota;kotaCiz()}
      (j.cevaplar||[]).forEach(function(c,i){S.test.push({rol:'bot',metin:c.metin,butonlar:c.butonlar||[],kaynak:c.kaynak,eslesme:i===0&&j.eslesme?j.eslesme:null,aiHata:i===0&&j.ai_hata})});
      if(j.devir){S.testDevir=true;S.test.push({rol:'sistem',metin:T('Ekibe aktarıldı (testte konuşma durumu tutulmaz).','Passed to the team (the test keeps no conversation state).')})}
      if(j.lead_iste)S.test.push({rol:'sistem',metin:T('Burada ziyaretçiye iletişim formu açılır (testte kaydedilmez).','A contact form opens here for the visitor (not saved in tests).')});
      if(S.test.length>60)S.test=S.test.slice(-60);
      testCiz();
    });
  }

  /* =====================================================================
   * ÖRNEK MOD (api.ORNEK): istek atılmaz, yerel örnek veri
   * ===================================================================== */
  var OD=null;
  function ornekVeri(){
    if(OD)return OD;
    var dl=EN?'en':'tr';
    var niyet=function(k,ad,o,a,c,b){return {k:k,ad:ad,ornekler:o,anahtarlar:a,cevap:c,butonlar:b||[],aktif:true}};
    var bot={id:1,ad:T('Mağaza asistanı','Store assistant'),mod:'karma',aktif:true,dil:dl,surum:3,created_at:'2026-11-20 09:00:00',updated_at:'2026-11-27 08:30:00',
      karsilama:'',geri_donus:'',devir_mesaji:'',bulunamazsa:'ikisi',
      menu:[{etiket:T('Fiyatlar','Pricing'),hedef:'n:fiyat'},{etiket:T('Kargo','Shipping'),hedef:'n:kargo'},{etiket:T('İletişim','Contact'),hedef:'n:iletisim'}],
      niyetler:[
        niyet('fiyat',T('Fiyatlar','Pricing'),[T('fiyatlarınız ne kadar','how much does it cost'),T('fiyat listesi','price list')],[T('fiyat','price'),T('ücret','cost')],
          T('Fiyatlarımız 299 TL\'den başlar. Tüm paketler için fiyat sayfamıza bakabilirsiniz.','Our prices start at $9. See all plans on our pricing page.'),[{etiket:T('Fiyat sayfası','Pricing page'),hedef:'url:https://ornek.com/fiyatlar'}]),
        niyet('kargo',T('Kargo','Shipping'),[T('kargom ne zaman gelir','when will my order arrive'),T('kargo ücreti','shipping cost')],[T('kargo','shipping'),T('teslimat','delivery')],
          T('Siparişler 1-3 iş gününde teslim edilir. 500 TL üzeri kargo ücretsiz.','Orders arrive in 1-3 business days. Free shipping over $50.'),[{etiket:T('İade','Returns'),hedef:'n:iade'}]),
        niyet('iletisim',T('İletişim','Contact'),[T('size nasıl ulaşırım','how can I reach you')],[T('telefon','phone'),'e-posta'],
          T('Bize hafta içi 09.00-18.00 arasında 0212 000 00 00\'dan ulaşabilirsiniz.','Reach us on weekdays 9am-6pm at +1 555 000 0000.'),[{etiket:T('Bir insanla görüş','Talk to a human'),hedef:'insan'}]),
        niyet('iade',T('İade ve değişim','Returns'),[T('iade etmek istiyorum','I want to return an item')],[T('iade','return'),T('değişim','exchange')],
          T('Ürünü teslimden sonraki 14 gün içinde iade edebilirsiniz.','You can return items within 14 days of delivery.'),[])],
      ai:{persona:T('Güler yüzlü, kısa ve net cevap veren bir mağaza asistanı.','A friendly store assistant who gives short, clear answers.'),ton:60,
        bilgi:T('Kargo 1-3 iş gününde teslim edilir. 500 TL üzeri kargo ücretsizdir. İade süresi 14 gündür.','Orders ship in 1-3 business days. Free shipping over $50. Returns within 14 days.')},
      web:{aktif:true,anahtar:'wk_ORNEKornekORNEKornek1234',alanlar:['ornek.com','*.ornek.com'],gorunum:{renk:'#4f46e5',konum:'sag',baslik:T('Bize yazın','Chat with us')}},
      ig:{aktif:false,durum:'yakinda',hesap:null,baska_bot:null},ozet:{okunmamis:2,yeni_lead:1}};
    var simdi=new Date(),tarih=function(dk){return new Date(simdi.getTime()-dk*60000).toISOString().slice(0,19).replace('T',' ')};
    var kon=[
      {id:31,kanal:'web',ad:'Ayşe Y.',dil:dl,devir:false,okunmadi:2,mesaj_sayisi:5,son_mesaj:T('Teşekkürler, bilgilerimi bıraktım.','Thanks, I left my details.'),created_at:tarih(95),updated_at:tarih(12),lead:true},
      {id:30,kanal:'ig',ad:null,dil:dl,devir:true,okunmadi:0,mesaj_sayisi:4,son_mesaj:T('Bir insanla görüşebilir miyim?','Can I talk to a human?'),created_at:tarih(400),updated_at:tarih(380),lead:false},
      {id:29,kanal:'web',ad:null,dil:dl,devir:false,okunmadi:0,mesaj_sayisi:2,son_mesaj:T('Siparişler 1-3 iş gününde teslim edilir.','Orders arrive in 1-3 business days.'),created_at:tarih(1500),updated_at:tarih(1499),lead:false}];
    var mes={
      31:[{id:1,rol:'kullanici',metin:T('kargom ne zaman gelir','when will my order arrive'),kaynak:null,niyet:null,puan:null,butonlar:[],hata:null,created_at:tarih(95)},
        {id:2,rol:'bot',metin:bot.niyetler[1].cevap,kaynak:'hazir',niyet:'kargo',puan:0.82,butonlar:bot.niyetler[1].butonlar,hata:null,created_at:tarih(95)},
        {id:3,rol:'kullanici',metin:T('toptan alımda indirim var mı','do you offer bulk discounts'),kaynak:'eslesmedi',niyet:null,puan:null,butonlar:[],hata:null,created_at:tarih(20)},
        {id:4,rol:'bot',metin:T('Toptan alımlarda özel fiyat veriyoruz; bilgilerinizi bırakırsanız ekibimiz dönsün.','We offer special pricing for bulk orders; leave your details and our team will get back to you.'),kaynak:'ai',niyet:null,puan:null,butonlar:[{etiket:METIN[dl].btn_lead,hedef:'lead'}],hata:null,created_at:tarih(20)},
        {id:5,rol:'sistem',metin:'lead_alindi',kaynak:null,niyet:null,puan:null,butonlar:[],hata:null,created_at:tarih(12)}],
      30:[{id:6,rol:'kullanici',metin:T('Bir insanla görüşebilir miyim?','Can I talk to a human?'),kaynak:'eslesmedi',niyet:null,puan:null,butonlar:[],hata:null,created_at:tarih(400)},
        {id:7,rol:'bot',metin:METIN[dl].devir,kaynak:'devir',niyet:null,puan:null,butonlar:[],hata:T('24 saat penceresi kapandı','24-hour window closed'),created_at:tarih(399)},
        {id:8,rol:'sistem',metin:'devir_acildi',kaynak:null,niyet:null,puan:null,butonlar:[],hata:null,created_at:tarih(399)}],
      29:[{id:9,rol:'kullanici',metin:T('teslimat süresi','delivery time'),kaynak:null,niyet:null,puan:null,butonlar:[],hata:null,created_at:tarih(1500)},
        {id:10,rol:'bot',metin:bot.niyetler[1].cevap,kaynak:'hazir',niyet:'kargo',puan:0.6,butonlar:[],hata:null,created_at:tarih(1499)}]};
    var leadler=[
      {id:11,kanal:'web',ad:'Ayşe Y.',eposta:'ayse@ornek.com',telefon:'',notu:T('Toptan fiyat istiyorum.','I\'d like bulk pricing.'),durum:'yeni',konusma_id:31,created_at:tarih(12)},
      {id:10,kanal:'web',ad:'Mert K.',eposta:'',telefon:'+90 555 000 00 00',notu:'',durum:'islendi',konusma_id:null,created_at:tarih(3000)}];
    var kota={plan:'demo',ai:{limit:30,used:12,kalan:18},hazir:{limit:300,used:87,kalan:213},bot:{limit:1,used:1},test:{used:4},
      reset_at:new Date(simdi.getFullYear(),simdi.getMonth()+1,1).toISOString(),uyari:null,deneme_bitti:false};
    var bos=/[?&]sihirbaz\b/.test(location.search);
    OD={botlar:bos?[]:[bot],kota:kota,kon:kon,mes:mes,leadler:leadler,sonId:1};
    if(bos)kota.bot.used=0;
    return OD;
  }
  function ornekIst(gun){
    var g=[],t0=Date.now();
    for(var i=gun-1;i>=0;i--){var x=new Date(t0-i*864e5),s=(i*7919)%13;
      g.push({gun:x.toISOString().slice(0,10),gelen:4+s,hazir:2+(s%6),ai:1+(s%3),geri:s%4===0?2:s%2,lead:s%5===0?1:0})}
    var top=function(k){return g.reduce(function(a,x){return a+x[k]},0)};
    var h_=top('hazir'),a=top('ai'),r=top('geri');
    return {ok:true,gun:gun,gunluk:g,toplam:{konusma:Math.round(top('gelen')/3),gelen:top('gelen'),hazir:h_,ai:a,geri:r,kota:0,devir:Math.max(1,Math.round(gun/10)),lead:top('lead'),
      eslesme_orani:Math.round((h_+a)/(h_+a+r)*1000)/1000},
      niyetler:[{k:'kargo',ad:T('Kargo','Shipping'),n:Math.round(h_*0.45)},{k:'fiyat',ad:T('Fiyatlar','Pricing'),n:Math.round(h_*0.3)},{k:'iade',ad:T('İade ve değişim','Returns'),n:Math.round(h_*0.15)},{k:'iletisim',ad:T('İletişim','Contact'),n:Math.round(h_*0.1)}],
      eslesmeyen:[{metin:T('toptan alımda indirim var mı','do you offer bulk discounts'),created_at:new Date(t0-20*60000).toISOString().slice(0,19).replace('T',' ')},
        {metin:T('kapıda ödeme yapabilir miyim','can I pay on delivery'),created_at:new Date(t0-26*3600000).toISOString().slice(0,19).replace('T',' ')}],kota:ornekVeri().kota};
  }
  function ornekIstek(yol,yontem,govde){
    var od=ornekVeri();
    var cevap=function(o){return new Promise(function(r){setTimeout(function(){r(Object.assign({_s:o.ok===false?(o._s||400):200},o))},220)})};
    var m,q=yol.split('?')[1]||'',par={};q.split('&').forEach(function(x){if(x){var p=x.split('=');par[p[0]]=decodeURIComponent(p[1]||'')}});
    yol=yol.split('?')[0];
    var bot=function(id){return od.botlar.filter(function(b){return b.id===Number(id)})[0]};
    if(yol==='/gen/bot'&&yontem==='GET')return cevap({ok:true,botlar:od.botlar.map(function(b){var x=kopyala(b);x.niyet_sayisi=b.niyetler.length;x.niyetler=[];x.ai.bilgi='';return x}),kota:od.kota,ig_acik:false});
    if(yol==='/gen/bot'&&yontem==='POST'){
      if(od.kota.bot.used>=od.kota.bot.limit)return cevap({ok:false,_s:403,error:'bot_limit',limit:od.kota.bot.limit});
      var yeni=kopyala(ornekVeriBot());yeni.id=++od.sonId;yeni.ad=govde.ad;yeni.mod=govde.mod;yeni.surum=1;yeni.ozet={okunmamis:0,yeni_lead:0};
      if(govde.sablon==='bos'){yeni.niyetler=[];yeni.menu=[]}
      od.botlar.push(yeni);od.kota.bot.used++;return cevap({ok:true,bot:kopyala(yeni),kota:od.kota});
    }
    if((m=/^\/gen\/bot\/(\d+)$/.exec(yol))){var b=bot(m[1]);if(!b)return cevap({ok:false,_s:404,error:'bulunamadi'});
      if(yontem==='GET')return cevap({ok:true,bot:kopyala(b),kota:od.kota});
      if(govde.surum!==b.surum)return cevap({ok:false,_s:409,error:'cakisma',surum:b.surum});
      UST.forEach(function(k){if(k in govde){if(k==='web')Object.assign(b.web,govde.web);else b[k]=kopyala(govde[k])}});
      b.surum++;b.updated_at=new Date().toISOString().slice(0,19).replace('T',' ');return cevap({ok:true,bot:kopyala(b)})}
    if((m=/^\/gen\/bot\/(\d+)\/(sil|anahtar|test|kanal\/ig|konusmalar|leadler|istatistik)$/.exec(yol))){
      var bb=bot(m[1]);if(!bb)return cevap({ok:false,_s:404,error:'bulunamadi'});
      if(m[2]==='sil'){od.botlar=od.botlar.filter(function(x){return x!==bb});od.kota.bot.used--;return cevap({ok:true})}
      if(m[2]==='anahtar'){bb.web.anahtar='wk_'+Math.random().toString(36).slice(2,14).padEnd(12,'x')+'ORNEKornek12';bb.web.anahtar=bb.web.anahtar.slice(0,27);return cevap({ok:true,anahtar:bb.web.anahtar})}
      if(m[2]==='test'){od.kota.test.used++;return cevap({ok:true,cevaplar:[{metin:T('ÖRNEK cevap','SAMPLE reply'),butonlar:[],kaynak:'hazir'}],devir:govde.buton==='insan',lead_iste:govde.buton==='lead',
        eslesme:{k:'kargo',ad:T('Kargo','Shipping'),puan:0.6},kota:od.kota})}
      if(m[2]==='kanal/ig')return cevap({ok:false,_s:503,error:'ig_kapali'});
      if(m[2]==='konusmalar'){var l=od.kon.filter(function(k){return (!par.kanal||k.kanal===par.kanal)&&(par.filtre!=='devir'||k.devir)&&(par.filtre!=='okunmamis'||k.okunmadi)});
        return cevap({ok:true,konusmalar:kopyala(l),devam:false})}
      if(m[2]==='leadler'){var ll=od.leadler.filter(function(x){return !par.durum||x.durum===par.durum});return cevap({ok:true,leadler:kopyala(ll),toplam:ll.length,devam:false})}
      if(m[2]==='istatistik')return cevap(ornekIst(Number(par.gun)||30));
    }
    if((m=/^\/gen\/bot\/(\d+)\/konusma\/(\d+)(\/devir|\/sil)?$/.exec(yol))){
      var k=od.kon.filter(function(x){return x.id===Number(m[2])})[0];if(!k)return cevap({ok:false,_s:404,error:'bulunamadi'});
      if(!m[3]){var okun=k.okunmadi;k.okunmadi=0;if(od.botlar[0])od.botlar[0].ozet.okunmamis=Math.max(0,od.botlar[0].ozet.okunmamis-okun);
        return cevap({ok:true,konusma:kopyala(k),mesajlar:kopyala(od.mes[k.id]||[]),lead:kopyala(od.leadler.filter(function(x){return x.konusma_id===k.id})[0]||null)})}
      if(m[3]==='/devir'){k.devir=!!govde.devir;(od.mes[k.id]=od.mes[k.id]||[]).push({id:Date.now(),rol:'sistem',metin:k.devir?'devir_acildi':'devir_kapandi',kaynak:null,niyet:null,puan:null,butonlar:[],hata:null,created_at:new Date().toISOString().slice(0,19).replace('T',' ')});
        return cevap({ok:true,konusma:kopyala(k)})}
      od.kon=od.kon.filter(function(x){return x!==k});return cevap({ok:true});
    }
    if((m=/^\/gen\/bot\/(\d+)\/lead\/(\d+)(\/sil)?$/.exec(yol))){
      var ld=od.leadler.filter(function(x){return x.id===Number(m[2])})[0];if(!ld)return cevap({ok:false,_s:404,error:'bulunamadi'});
      if(m[3]){od.leadler=od.leadler.filter(function(x){return x!==ld});return cevap({ok:true})}
      ld.durum=govde.durum;return cevap({ok:true,lead:kopyala(ld)});
    }
    return cevap({ok:false,_s:404,error:'not_found'});
  }
  function ornekVeriBot(){var od=ornekVeri();if(od.botlar[0])return od.botlar[0];
    /* sihirbaz örneği: şablon botu */
    var b={id:0,ad:'',mod:'karma',aktif:true,dil:EN?'en':'tr',surum:1,created_at:'2026-11-27 10:00:00',updated_at:'2026-11-27 10:00:00',karsilama:'',geri_donus:'',devir_mesaji:'',bulunamazsa:'ikisi',
      menu:[{etiket:T('Fiyatlar','Pricing'),hedef:'n:fiyat'},{etiket:T('Çalışma saatleri','Opening hours'),hedef:'n:saat'},{etiket:T('İletişim','Contact'),hedef:'n:iletisim'},{etiket:T('İade ve kargo','Returns & shipping'),hedef:'n:iade'}],
      niyetler:['fiyat','saat','iletisim','iade'].map(function(k,i){return {k:k,ad:[T('Fiyatlar','Pricing'),T('Çalışma saatleri','Opening hours'),T('İletişim','Contact'),T('İade ve kargo','Returns & shipping')][i],
        ornekler:[k],anahtarlar:[k],cevap:T('[buraya yaz]','[write here]'),butonlar:[],aktif:true}}),
      ai:{persona:'',ton:50,bilgi:''},web:{aktif:false,anahtar:'wk_ORNEKornekORNEKornek5678',alanlar:[],gorunum:{renk:'#4f46e5',konum:'sag',baslik:''}},
      ig:{aktif:false,durum:'yakinda',hesap:null,baska_bot:null},ozet:{okunmamis:0,yeni_lead:0}};
    return b;
  }
};
})();
