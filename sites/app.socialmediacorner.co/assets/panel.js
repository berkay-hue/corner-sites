/* A11-2 panel ortak davranış (theme.js head'den enjekte eder; her sayfada bir kez çalışır, tekrar çalışması zararsızdır).
   - panel.css yoksa ekler (video sayfaları), favicon = /assets/favicon.svg
   - eski logo kaldıysa yeni logoya çevirir; Corner Group bandı yoksa footer'a ekler; hamburger yoksa ekler
   - hamburger: ≥1024 ray daralt/genişlet (smc-ray), ≤1023 perdeli çekmece; araç sayfalarında <768 nav.araclar aç/kapa */
(function(){
  'use strict';
  if(window.__smcPanel)return;
  window.__smcPanel=1;
  var d=document,r=d.documentElement;
  var EN=/^en/i.test(r.getAttribute('lang')||'');
  var T=EN?{
    menu:'Menu',ac:'Open menu',kapat:'Close menu',daralt:'Collapse sidebar',genislet:'Expand sidebar',
    cg:'Corner Group companies',telif:'© 2026 Social Media Corner — a Corner Group company',urun:'Studio',ev:'home'
  }:{
    menu:'Menü',ac:'Menüyü aç',kapat:'Menüyü kapat',daralt:'Kenar çubuğunu daralt',genislet:'Kenar çubuğunu genişlet',
    cg:'Corner Group şirketleri',telif:'© 2026 Social Media Corner — bir Corner Group şirketi',urun:'Stüdyo',ev:'ana sayfa'
  };
  var CG=[
    ['cg-cg','https://cornergroup.co/','Corner Group','B2B büyüme ekosistemi','B2B growth ecosystem'],
    ['cg-saas','https://saascorner.co/','SaaS Corner','B2B müşteri bulma','B2B lead generation'],
    ['cg-sales','https://salescorner.co/','Sales Corner','Satış operasyonu ve outbound','Sales operations and outbound'],
    ['cg-crm','https://crmcorner.co/','CRM Corner','CRM ve süreç otomasyonu','CRM and process automation'],
    ['cg-brand','https://brandcorner.co/','Brand Corner','Influencer pazarlama platformu','Influencer marketing platform']
  ];
  var SVGNS='http://www.w3.org/2000/svg';

  function el(ad,sinif,metin){var e=d.createElement(ad);if(sinif)e.className=sinif;if(metin!=null)e.textContent=metin;return e}

  /* panel.css: statik bağlantı yoksa ekle; DOM bitince head'in sonuna taşı ki studyo.css'ten sonra gelsin */
  var cssLink=d.querySelector('link[rel="stylesheet"][href="/assets/panel.css"]'),cssEklendi=false;
  if(!cssLink&&d.head){cssLink=el('link');cssLink.rel='stylesheet';cssLink.href='/assets/panel.css';d.head.appendChild(cssLink);cssEklendi=true}

  function favicon(){
    if(d.querySelector('link[rel~="icon"][href="/assets/favicon.svg"]'))return;
    var ic=d.querySelector('link[rel~="icon"]');
    if(!ic){ic=el('link');ic.rel='icon';d.head.appendChild(ic)}
    if(ic.getAttribute('href')!=='/assets/favicon.svg'){ic.setAttribute('href','/assets/favicon.svg');ic.setAttribute('type','image/svg+xml')}
  }

  function lgYap(ters){
    var s=el('span','lg'+(ters?' lg-ters':''));
    [['lg-acik','/assets/logo.svg',109,36],['lg-koyu','/assets/logo-dark.svg',109,36],['lg-isaret','/assets/mark.svg',32,32]].forEach(function(x,i){
      var im=el('img',x[0]);im.src=x[1];im.alt='';im.width=x[2];im.height=x[3];im.decoding='async';
      if(i)im.hidden=true; /* panel.css gelmeden yalnız açık logo görünsün */
      s.appendChild(im);
    });
    /* [hidden] başka dosyalarda !important; panel.css yüklenince gizlemeyi kaldır, gerisini CSS seçer */
    function goster(){var l=s.querySelectorAll('img[hidden]');for(var j=0;j<l.length;j++)l[j].hidden=false}
    if(!cssEklendi||cssLink.sheet)goster();else{cssLink.addEventListener('load',goster);cssLink.addEventListener('error',goster)}
    return s;
  }
  function logo(){
    var a=d.querySelector('a.st-logo,a.au-logo,.ust a.logo');
    if(!a||a.querySelector('.lg'))return;
    var eski=a.querySelector('.st-logo-urun,.au-logo-urun,.logo-urun');
    var urun=(eski&&eski.textContent.trim())||T.urun;
    while(a.firstChild)a.removeChild(a.firstChild);
    a.appendChild(lgYap(a.classList.contains('au-logo')));
    a.appendChild(el('span','lg-urun',urun));
    a.setAttribute('aria-label','Social Media Corner '+urun+', '+T.ev);
  }

  function bant(){
    if(d.querySelector('.cg'))return;
    var hedef=d.querySelector('.st-alt-bilgi')||d.querySelector('footer.alt .alt-ic')||d.querySelector('footer.alt');
    if(!hedef)return;
    var nav=el('nav','cg');nav.setAttribute('aria-label',T.cg);
    nav.appendChild(el('p','cg-bas',T.cg));
    var ul=el('ul','cg-liste');
    CG.forEach(function(c){
      var li=el('li'),a=el('a',c[0]);a.href=c[1];a.target='_blank';a.rel='noopener';
      a.appendChild(el('b',null,c[2]));a.appendChild(el('span',null,EN?c[4]:c[3]));
      li.appendChild(a);ul.appendChild(li);
    });
    nav.appendChild(ul);
    var once=hedef.classList.contains('alt-ic')?hedef.querySelector('.alt-site'):hedef.firstChild;
    hedef.insertBefore(nav,once||null);
    /* telif satırı tek biçim */
    var sp=hedef.querySelectorAll('span');
    for(var i=0;i<sp.length;i++){
      if(/^©\s*2026 Social Media Corner(,|\s—)?\s*(bir Corner Group şirketi|a Corner Group company)?$/.test(sp[i].textContent.trim())){sp[i].textContent=T.telif;break}
    }
  }

  function dugmeYap(hedefId){
    var b=el('button','pn-menu');b.type='button';b.id='pn-menu';
    b.setAttribute('aria-controls',hedefId);b.setAttribute('aria-expanded','false');b.setAttribute('aria-label',T.menu);
    var s=d.createElementNS(SVGNS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');
    var p=d.createElementNS(SVGNS,'path');p.setAttribute('d','M4 7h16M4 12h16M4 17h16');s.appendChild(p);b.appendChild(s);
    return b;
  }
  function dugme(){
    var b=d.getElementById('pn-menu');if(b)return b;
    var rail=d.querySelector('nav.st-rail'),ust=d.querySelector('.st-ust');
    if(rail&&ust){if(!rail.id)rail.id='st-rail';b=dugmeYap(rail.id);ust.insertBefore(b,ust.firstChild);return b}
    var ar=d.querySelector('nav.araclar'),ustIc=d.querySelector('.ust .ust-ic');
    if(ar&&ustIc){if(!ar.id)ar.id='araclar';b=dugmeYap(ar.id);ustIc.insertBefore(b,ustIc.firstChild);return b}
    return null;
  }

  function odaklanabilir(kap){
    var l=kap.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'),o=[];
    for(var i=0;i<l.length;i++){if(l[i].getClientRects().length)o.push(l[i])}
    return o;
  }
  function kaydet(v){try{if(v)localStorage.setItem('smc-ray','dar');else localStorage.removeItem('smc-ray')}catch(e){}}

  function railKur(b,rail){
    var masa=matchMedia('(min-width:1024px)'),genisEkran=matchMedia('(min-width:769px)');
    var perde=el('div','pn-perde');perde.hidden=true;perde.setAttribute('aria-hidden','true');
    d.body.appendChild(perde);
    function cekmece(){return r.classList.contains('pn-cekmece')}
    function basliklar(){
      var dar=masa.matches?r.classList.contains('ray-dar'):(genisEkran.matches&&!cekmece());
      var l=rail.querySelectorAll('.st-link');
      for(var i=0;i<l.length;i++){
        var ad=l[i].querySelector('.st-link-ad');if(!ad)continue;
        if(dar&&!l[i].hasAttribute('title')){l[i].setAttribute('title',ad.textContent.trim());l[i].setAttribute('data-pn-baslik','')}
        else if(!dar&&l[i].hasAttribute('data-pn-baslik')){l[i].removeAttribute('title');l[i].removeAttribute('data-pn-baslik')}
      }
    }
    function durum(){
      var acik=masa.matches?!r.classList.contains('ray-dar'):cekmece();
      b.setAttribute('aria-expanded',acik?'true':'false');
      b.title=masa.matches?(acik?T.daralt:T.genislet):(acik?T.kapat:T.ac);
      basliklar();
    }
    function ac(){
      var ust=b.closest('.st-ust'),alt=ust?Math.max(0,Math.round(ust.getBoundingClientRect().bottom)):0;
      rail.style.top=alt+'px';perde.style.top=alt+'px';
      r.classList.add('pn-cekmece','pn-kilit');perde.hidden=false;
      durum();
      var o=odaklanabilir(rail);if(o.length)o[0].focus();
    }
    function kapat(odak){
      if(!cekmece())return;
      r.classList.remove('pn-cekmece','pn-kilit');perde.hidden=true;
      rail.style.removeProperty('top');perde.style.removeProperty('top');
      durum();
      if(odak)b.focus();
    }
    b.addEventListener('click',function(){
      if(masa.matches){var dar=r.classList.toggle('ray-dar');kaydet(dar);durum();return}
      if(cekmece())kapat(true);else ac();
    });
    perde.addEventListener('click',function(){kapat(true)});
    d.addEventListener('click',function(e){
      if(!cekmece())return;
      if(rail.contains(e.target)){if(e.target.closest&&e.target.closest('a[href],button'))kapat(false);return}
      if(b.contains(e.target)||e.target===perde)return;
      kapat(false);
    });
    d.addEventListener('keydown',function(e){
      if(!cekmece())return;
      if(e.key==='Escape'){e.preventDefault();kapat(true);return}
      if(e.key!=='Tab')return;
      var o=odaklanabilir(rail);if(!o.length)return;
      var ilk=o[0],son=o[o.length-1],a=d.activeElement;
      if(!e.shiftKey&&a===son){e.preventDefault();b.focus()}
      else if(!e.shiftKey&&a===b){e.preventDefault();ilk.focus()}
      else if(e.shiftKey&&a===ilk){e.preventDefault();b.focus()}
      else if(e.shiftKey&&a===b){e.preventDefault();son.focus()}
      else if(!rail.contains(a)&&a!==b){e.preventDefault();ilk.focus()}
    });
    function degisti(){if(masa.matches)kapat(false);durum()}
    if(masa.addEventListener){masa.addEventListener('change',degisti);genisEkran.addEventListener('change',durum)}
    else if(masa.addListener){masa.addListener(degisti);genisEkran.addListener(durum)}
    /* change olayı geç gelebilir; geniş ekranda açık kalan çekmece + kaydırma kilidi resize'da da kapanır */
    window.addEventListener('resize',function(){if(masa.matches&&cekmece())degisti()});
    durum();
  }

  function araclarKur(b,nav){
    var mobil=matchMedia('(max-width:767px)'),acik=false;
    function uygula(){
      if(mobil.matches){nav.classList.toggle('pn-kapali',!acik)}else{acik=false;nav.classList.remove('pn-kapali')}
      var g=!mobil.matches||acik;
      b.setAttribute('aria-expanded',g?'true':'false');
      b.title=g?T.kapat:T.ac;
    }
    function kapat(odak){if(!acik)return;acik=false;uygula();if(odak)b.focus()}
    b.addEventListener('click',function(){
      acik=!acik;uygula();
      if(acik){var o=odaklanabilir(nav);if(o.length)o[0].focus()}
    });
    d.addEventListener('keydown',function(e){
      if(acik&&e.key==='Escape'&&(nav.contains(d.activeElement)||d.activeElement===b)){e.preventDefault();kapat(true)}
    });
    d.addEventListener('click',function(e){
      if(!acik||nav.contains(e.target)||b.contains(e.target))return;
      kapat(false);
    });
    if(mobil.addEventListener)mobil.addEventListener('change',uygula);else if(mobil.addListener)mobil.addListener(uygula);
    uygula();
  }

  /* A11-2 çerez/KVKK bandı (sitedeki .ckb ile aynı davranış). Panel reklam/izleme çerezi kullanmaz; seçim localStorage
     'smc-cerez' ('all' | 'ess'). Depolama kapalıysa bant her sayfada yeniden görünür. Alt bilgiye ve [data-ckb-ac] öğelerine
     "Çerez tercihleri" düğmesi bağlanır. Bant açıkken sayfa sonuna bant boyunda boşluk eklenir ki alt bilgi örtülmesin. */
  var CK='smc-cerez';
  var CT=EN?{
    label:'Cookie notice',
    pre:'The panel only keeps what it needs to work in your browser and uses no advertising or tracking cookies. I have read and understood the ',
    link:'Privacy Notice and Cookie Policy',href:'/en/privacy#cerez',post:' and I accept.',
    yes:'I accept',ess:'Essential only',open:'Cookie preferences',
    simdi:'Your current choice: ',all:'Accepted',essAd:'Essential only'
  }:{
    label:'Çerez bildirimi',
    pre:'Panel, tarayıcında yalnızca çalışması için gerekli bilgileri saklar; reklam ya da izleme çerezi kullanmaz. ',
    link:'KVKK Aydınlatma Metni ve Çerez Politikası',href:'/kvkk#cerez',post:'’nı okudum, anladım, kabul ediyorum.',
    yes:'Kabul ediyorum',ess:'Yalnız zorunlu',open:'Çerez tercihleri',
    simdi:'Şu anki tercihin: ',all:'Kabul edildi',essAd:'Yalnız zorunlu'
  };
  function ckAl(){try{return localStorage.getItem(CK)}catch(e){return null}}
  function ckYaz(v){try{localStorage.setItem(CK,v)}catch(e){/* depolama kapalı */}}
  function cerez(){
    if(d.querySelector('.ckb'))return;
    var bar=null,bosluk=null,simdi=null,donus=null,ro=null;
    function boy(){if(bar&&bosluk&&!bar.hidden)bosluk.style.height=Math.ceil(bar.getBoundingClientRect().height+16)+'px'}
    function kur2(){
      bar=el('section','ckb');bar.hidden=true;
      bar.setAttribute('aria-label',CT.label);
      if(d.querySelector('.st-sekme'))bar.classList.add('ckb-sekme');
      var p=el('p','ckb-metin'),a=el('a',null,CT.link);a.href=CT.href;
      p.appendChild(d.createTextNode(CT.pre));p.appendChild(a);p.appendChild(d.createTextNode(CT.post));
      simdi=el('p','ckb-simdi');simdi.hidden=true;
      var btns=el('div','ckb-dugmeler');
      function mk(txt,cls,val){
        var b=el('button','ckb-btn '+cls,txt);b.type='button';
        b.addEventListener('click',function(){ckYaz(val);gizle(true)});
        return b;
      }
      btns.appendChild(mk(CT.ess,'ckb-ikincil','ess'));
      btns.appendChild(mk(CT.yes,'ckb-birincil','all'));
      var ic=el('div','ckb-ic');ic.appendChild(p);ic.appendChild(simdi);
      bar.appendChild(ic);bar.appendChild(btns);
      bar.addEventListener('keydown',function(e){
        if(e.key==='Escape'&&ckAl()){e.preventDefault();gizle(true)}
      });
      bosluk=el('div','ckb-bosluk');bosluk.setAttribute('aria-hidden','true');bosluk.hidden=true;
      d.body.appendChild(bosluk);d.body.appendChild(bar);
      if(window.ResizeObserver){ro=new ResizeObserver(boy);ro.observe(bar)}else window.addEventListener('resize',boy);
    }
    function goster(odak,kaynak){
      if(!bar)kur2();
      var v=ckAl();
      if(v==='all'||v==='ess'){simdi.textContent=CT.simdi+(v==='all'?CT.all:CT.essAd);simdi.hidden=false}else simdi.hidden=true;
      bar.hidden=false;bosluk.hidden=false;r.classList.add('ckb-acik');boy();
      donus=kaynak||null;
      if(odak){var f=bar.querySelector('.ckb-birincil');if(f)f.focus()}
    }
    function gizle(odakGeri){
      if(!bar||bar.hidden)return;
      var icerde=bar.contains(d.activeElement);
      bar.hidden=true;bosluk.hidden=true;r.classList.remove('ckb-acik');
      if(odakGeri&&icerde&&donus&&d.contains(donus))donus.focus();
      donus=null;
    }
    function dugmeBagla(b){
      if(b.getAttribute('data-ckb-bagli'))return;
      b.setAttribute('data-ckb-bagli','1');b.hidden=false;
      b.addEventListener('click',function(){goster(true,b)});
    }
    /* alt bilgi: KVKK bağlantısının hemen ardına */
    var ft=d.querySelector('.st-alt-bilgi')||d.querySelector('footer.alt');
    if(ft&&!ft.querySelector('.ckb-ac')){
      var kap=ft.querySelector('.alt-site')||ft;
      var o=el('button','ckb-ac',CT.open);o.type='button';
      var kv=null,l=kap.children;
      for(var i=0;i<l.length;i++){var h=l[i].getAttribute&&l[i].getAttribute('href');if(h==='/kvkk'||h==='/en/privacy'){kv=l[i];break}}
      if(kv&&kv.classList.contains('bag'))o.classList.add('bag');
      kap.insertBefore(o,kv?kv.nextSibling:null);
    }
    var dl=d.querySelectorAll('.ckb-ac,[data-ckb-ac]');
    for(var j=0;j<dl.length;j++)dugmeBagla(dl[j]);
    var v=ckAl();
    if(v!=='all'&&v!=='ess'){
      /* video sayfalarında panel.css sonradan eklenir: stilsiz bant görünmesin */
      if(cssEklendi&&!cssLink.sheet){var g=function(){goster(false)};cssLink.addEventListener('load',g);cssLink.addEventListener('error',g)}
      else goster(false);
    }
  }

  function kur(){
    if(cssEklendi&&cssLink.parentNode===d.head&&d.head.lastElementChild!==cssLink)d.head.appendChild(cssLink);
    favicon();logo();bant();cerez();
    var b=dugme();if(!b)return;
    var hedef=d.getElementById(b.getAttribute('aria-controls')||'');
    if(!hedef)return;
    if(hedef.classList.contains('st-rail'))railKur(b,hedef);
    else if(hedef.classList.contains('araclar'))araclarKur(b,hedef);
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',kur);else kur();
})();
