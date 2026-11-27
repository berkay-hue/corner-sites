/* Stüdyo · Kurgu (A8-S3b, 23.11): SmcMotor üstünde video / karusel düzenleyici.
   studyo-medya.js'in #studyo-medya üzerinde attığı iptal edilebilir 'studyo:taslak' olayını devralır (preventDefault)
   ve canlı önizleme + tasarım / marka / sahne ayarları + dışa aktarma kurar. Boş durumda "örnek" önizleme oynatır.
   Kurulum hata verirse olay iptal edilmez: studyo-medya.js'in yedek sahne listesi çizilir ve "Tekrar dene" notu çıkar.
   Satır içi stil yok: renk ve oranlar JS'ten CSS değişkeni olarak verilir (style.setProperty; CSP style-src 'self' uyumlu).
   Yüklenen logo / arka plan fotoğrafı yalnız tarayıcıda kalır (blob: URL), hiçbir yere gönderilmez. */
(function(){'use strict';
var S=window.Studyo;if(!S)return;
var T=S.T,$=S.$,el=S.el,d=document,EN=S.dil()==='en';
var kok=$('#studyo-medya');if(!kok)return;
var MOD=kok.getAttribute('data-mod')==='gorsel'?'gorsel':'video',VID=MOD==='video';
var AZ=S.azHareket();
/* E1·G: çerez şeridi (panel.js .ckb, html.ckb-acik) açıkken yapışkan önizleme kartı şeridin üstünde biter; --cerez-h CSS'te düşülür */
(function(){var r=d.documentElement,ro=null,izli=null;
  function olc(){var b=d.querySelector('.ckb'),h=b&&!b.hidden&&r.classList.contains('ckb-acik')?Math.ceil(b.getBoundingClientRect().height+24):0;
    r.style.setProperty('--cerez-h',h+'px');
    if(b&&b!==izli&&window.ResizeObserver){if(ro)ro.disconnect();ro=new ResizeObserver(olc);ro.observe(b);izli=b}}
  if(window.MutationObserver)new MutationObserver(olc).observe(r,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',olc);olc();
})();
var TK='smc-kurgu-'+MOD,TURLER=['image/png','image/jpeg','image/webp'],MAXB=5*1024*1024,MAXS=30,UZ_MET=70,UZ_ALT=120,UZ_ACK=2200;
var NS='http://www.w3.org/2000/svg';
var IK={
  oynat:'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z',
  dur:'M8 5v14M16 5v14',geri:'m15 6-6 6 6 6',ileri:'m9 6 6 6-6 6',yukari:'m6 15 6-6 6 6',asagi:'m6 9 6 6 6-6',
  sil:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',ekle:'M12 5v14M5 12h14',
  indir:'M12 4v11m-5-5 5 5 5-5M5 20h14',yukle:'M12 20V9m-5 5 5-5 5 5M5 4h14',kapat:'M6 6l12 12M18 6 6 18',
  resim:'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01',
  tasarim:'M12 3a9 9 0 1 0 0 18c1 0 1.6-.7 1.6-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.3-4-7.8-9-7.8zM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01',
  marka:'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01',sahne:'M4 6h16M4 12h16M4 18h10',aciklama:'M5 5h14v10H9l-4 4z',
  video:'M3 5h13v14H3zM16 10l5-3v10l-5-3',tekrar:'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  arama:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4.2-4.2',
  kilit:'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2',
  buyut:'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',kucult:'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  ses:'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  sesKapali:'M4 9h4l5-4v14l-5-4H4zM16 9l6 6M22 9l-6 6'
};

function ikon(ad,cls){
  var s=d.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');
  s.setAttribute('class','ikon'+(cls?' '+cls:''));var p=d.createElementNS(NS,'path');p.setAttribute('d',IK[ad]);s.appendChild(p);return s;
}
function dugme(cls,ik,metin,etiket){
  var b=el('button','btn '+cls);b.type='button';
  if(ik)b.appendChild(ikon(ik,ik==='oynat'?'ikon-dolu':''));
  if(metin)b.appendChild(el('span',null,metin));
  if(etiket){b.setAttribute('aria-label',etiket);b.title=etiket}
  return b;
}
function pasif(b,x){if(!b)return;if(x)b.setAttribute('aria-disabled','true');else b.removeAttribute('aria-disabled')}
function pasifMi(b){return b.getAttribute('aria-disabled')==='true'}
function sn(x){var v=Math.round(x*10)/10;return EN?v+' s':String(v).replace('.',',')+' sn'}
function sure(t){t=Math.max(0,Math.floor(t+0.0001));return Math.floor(t/60)+':'+(t%60<10?'0':'')+(t%60)}
function sureSoz(t){t=Math.max(0,Math.round(t));return EN?t+(t===1?' second':' seconds'):t+' saniye'}
function kis(x){x=Number(x)||3.5;return Math.min(15,Math.max(1.5,Math.round(x*2)/2))}
function iki(n){return n<10?'0'+n:''+n}
function oranSayi(a){var x=String(a).split(':');return (+x[0]||1)/(+x[1]||1)}
function nesne(){return EN?'scene':'sahne'}
function birim(n){return VID?(EN?n+(n===1?' scene':' scenes'):n+' sahne'):(EN?n+(n===1?' slide':' slides'):n+' slayt')}
function tekil(i){return VID?T((i+1)+'. sahne','Scene '+(i+1)):T((i+1)+'. slayt','Slide '+(i+1))}

/* ---- tercihler (cihazda) ---- */
function tercihOku(){try{var x=JSON.parse(S.depo(TK)||'{}');return x&&typeof x==='object'?x:{}}catch(e){return {}}}
function tercihYaz(){if(!st)return;try{S.depo(TK,JSON.stringify({template:st.t.template,aspect:st.t.aspect,palette:st.t.paletSecildi?st.t.palette:'',vurgu:st.t.vurgu||'',ad:st.t.ad,kulp:st.t.kulp}))}catch(e){}}

/* ---- motor yardımcıları ---- */
var M=null,st=null,R={};
var marka={logo:null,logoUrl:'',logoAd:'',arka:null,arkaUrl:'',arkaAd:''};
function bul(a,id){for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null}
function tplO(id){return bul(M.templates,id)||M.templates[0]}
function adi(o){return o?(EN?o.name_en:o.name_tr):''}
function paletId(){return st.t.paletSecildi&&bul(M.palettes,st.t.palette)?st.t.palette:tplO(st.t.template).palette}
function proje(ek){
  ek=ek||{};var tp=ek.template||st.t.template,pid=ek.template&&!st.t.paletSecildi?tplO(tp).palette:paletId();
  return {template:tp,aspect:ek.aspect||st.t.aspect,palette:st.t.vurgu?{id:pid,accent:st.t.vurgu}:pid,
    brand:{name:st.t.ad,handle:st.t.kulp},logo:marka.logo,bgImage:marka.arka,lang:EN?'en':'tr',
    scenes:st.sahneler.map(function(s){return {text:s.text,sub:s.sub,secs:VID?s.secs:0,image:s.video&&s.video.hazir?s.video.el:(s.gorsel?s.gorsel.img:null),audio:ek.template?null:sesTampon(s)}})};
}
function baslangiclar(){var a=[],t=0;st.sahneler.forEach(function(s){a.push(t);t+=VID?s.secs:0});st.basla=a;st.toplam=t}
function sahneNo(t){var a=st.basla||[0],i=0;while(i<a.length-1&&t>=a[i+1])i++;return i}
function oturan(i){var b=st.basla[i]||0,s=st.sahneler[i]?st.sahneler[i].secs:3.5;return b+Math.max(0.3,Math.min(s*0.7,s-0.2))}
function boyut(cv,aspect,cssW,tavan){
  var a=M.aspects[aspect]||M.aspects['9:16'],dpr=window.devicePixelRatio||1;
  var w=Math.max(48,Math.min(tavan||a[0],Math.round((cssW||cv.clientWidth||360)*dpr))),h=Math.round(w*a[1]/a[0]);
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
}
function senkron(){
  var t=S.medya&&S.medya.taslak;if(!t||!st)return;
  t.scenes=st.sahneler.map(function(s){var o={text:s.text,sub:s.sub,secs:VID?s.secs:0};if(VID&&s.q)o.q=s.q;return o});
  t.caption=st.aciklama;
}
function slug(){
  var s=String((st.taslak&&st.taslak.title)||(st.sahneler[0]&&st.sahneler[0].text)||'').toLocaleLowerCase('tr');
  var m={'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u','â':'a','î':'i','û':'u'};
  s=s.replace(/[çğıöşüâîû]/g,function(c){return m[c]});
  try{s=s.normalize('NFKD').replace(/[̀-ͯ]/g,'')}catch(e){}
  s=s.replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40).replace(/-+$/,'');
  return s||'taslak';
}
function indir(blob,ad){
  var u=URL.createObjectURL(blob),a=d.createElement('a');a.href=u;a.download=ad;a.rel='noopener';a.hidden=true;
  d.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},1500);
}
function bekle(ms){return new Promise(function(r){setTimeout(r,ms)})}

/* ---- durum ---- */
function durumKur(det){
  var tr=tercihOku(),t=det.draft||{},md=det.medya;
  /* C1·3 geri yükleme: kayıtlı medya tercihin önüne geçer (geçersiz alan tercihe düşer) */
  if(md&&typeof md==='object'){
    var pa=typeof md.palette==='string'?md.palette:(md.palette&&typeof md.palette==='object'?md.palette.id:''),br=md.brand&&typeof md.brand==='object'?md.brand:{};
    tr={template:md.template||tr.template,aspect:md.aspect||tr.aspect,palette:pa,vurgu:md.vurgu||(md.palette&&md.palette.accent)||'',
      ad:typeof br.name==='string'&&br.name?br.name.slice(0,60):tr.ad,kulp:typeof br.handle==='string'?br.handle:tr.kulp};
  }
  var tp=tr.template&&bul(M.templates,tr.template)?tr.template:(VID?'kinetik':'kart');
  var as=typeof tr.aspect==='string'&&Object.prototype.hasOwnProperty.call(M.aspects,tr.aspect)?tr.aspect:(VID?'9:16':'4:5');
  var ps=!!(tr.palette&&bul(M.palettes,tr.palette));
  /* kayıtlı medya her zaman bir palet taşır (şablonun varsayılanı dahil): varsayılansa "seçildi" sayma */
  if(ps&&md&&typeof md==='object'&&tr.palette===tplO(tp).palette)ps=false;
  var sah=(Array.isArray(t.scenes)?t.scenes:[]).slice(0,MAXS).map(function(s){s=s||{};return {text:String(s.text||''),sub:String(s.sub||''),secs:VID?kis(s.secs>0?s.secs:3.5):0,q:VID?qOk(s.q):''}});
  if(!sah.length)sah=[{text:'',sub:'',secs:VID?3.5:0}];
  /* F2: seslendirme tercihi yalnız {acik,id} olarak kayıtlı medyadan gelir; ses dosyası hiçbir yere yazılmaz */
  /* B·4: imzalı seslendirme oturumu (rid, 24 sa) da kayıtta durur; süresi geçmişse atılır. Eski ses kimlikleri ALIAS ile yeni yuvaya döner. */
  var sv=md&&typeof md==='object'&&md.ses&&typeof md.ses==='object'?md.ses:null,sid=sv&&typeof sv.id==='string'?(SES_ALIAS[sv.id]||sv.id):'';
  var rid=sv&&typeof sv.rid==='string'&&RID_RE.test(sv.rid)?sv.rid:'',rs=rid&&typeof sv.ridSon==='number'&&sv.ridSon>Date.now()?sv.ridSon:0;
  return {taslak:t,ses:{acik:!!(VID&&sv&&sv.acik===true),id:TTS_ID.test(sid)?sid:sesVarsayilan(),geri:!!(VID&&sv&&sv.acik===true),rid:rs?rid:'',ridSon:rs,yeniden:!!(rid&&!rs)},sahneler:sah,aciklama:String(t.caption||''),
    t:{template:tp,aspect:as,palette:ps?tr.palette:'',paletSecildi:ps,vurgu:/^#[0-9a-f]{6}$/i.test(tr.vurgu||'')?tr.vurgu.toLowerCase():'',
      ad:typeof tr.ad==='string'&&tr.ad?tr.ad:String((det.marka&&det.marka.name)||'').slice(0,60),kulp:typeof tr.kulp==='string'?tr.kulp.slice(0,40):''},
    q:VID?qOk(t.q):'',oynat:null,slayt:0,iptal:null,mesgul:false,basla:[0],toplam:0,surukle:false};
}
/* E5: taslağın İngilizce stok sorgusu (sunucu llm qOk ile aynı süzgeç); ekranda gösterilmez, yalnız aramaya gider */
var Q_RE=/^[A-Za-z0-9 ,'&-]{2,60}$/;
function qOk(v){v=typeof v==='string'?v.replace(/\s+/g,' ').trim():'';return Q_RE.test(v)?v:''}
/* sahne metninden ilk 4 anlamlı kelime (q yoksa seçicinin ön değeri) */
var DURAK={};('ve ile bir bu şu o için da de mi ne çok gibi daha en her ama veya ya hem kadar sonra önce olan olarak nasıl neden artık bile siz sen biz ben size sana bize bizim sizin senin '+
  'the a an and or of to in on for with is are be your you it this that our we how why what from at by as not no more most').split(' ').forEach(function(w){DURAK[w]=1});
function ilk4(t){
  var w=String(t||'').replace(/\*/g,' ').toLocaleLowerCase(EN?'en':'tr').split(/[\s.,;:!?…"“”'’‘()\[\]{}\/|#@+=<>–—-]+/);
  return w.filter(function(x){return x.length>=3&&!DURAK[x]&&!/^\d+$/.test(x)}).slice(0,4).join(' ');
}

/* ================= DÜZENLEYİCİ ================= */
function kur(det){
  M=window.SmcMotor;otoDur();tamBirak();clearTimeout(KAYIT_T);KAYIT_T=null;
  if(DG&&DG.dlg.open){DG.sessiz=true;degisKapat()}
  if(st&&st.oynat){try{st.oynat.stop()}catch(e){}}
  if(st){vidHepsiBirak();st.sahneler.forEach(yerelBirak)}
  if(st&&st.iptal){try{st.iptal.abort()}catch(e){}}
  sesDur();
  if(R.ro){try{R.ro.disconnect()}catch(e){}}
  var eski=kok.querySelector('.kr');if(eski)eski.remove();
  var hn=kok.querySelector('.kr-hata');if(hn)hn.remove();
  st=durumKur(det);st.konu=aramaMetni(det.body&&det.body.topic);R={};baslangiclar();
  var arac=kok.querySelector('.st-arac');

  var kr=el('div','kr');R.kr=kr;
  var iz=el('div','kr-izgara');kr.appendChild(iz);
  iz.appendChild(sahneKur());
  var pn=el('div','kr-panel');iz.appendChild(pn);
  var genis=kok.getBoundingClientRect().width>=600||window.innerWidth>1023;
  if(VID){
    /* video: oynatıcının altında tek sütun — Sahneler (açık) → Ses kartı → Tasarım → Marka → Açıklama; dışa aktarma oynatıcıda */
    pn.appendChild(grup('sahne',T('Sahneler','Scenes'),sahnelerKur(),true));
    var sg=sesKartKur();R.sesGrup=sg;pn.appendChild(sg);seslerAl().then(function(){if(st&&R.sesGrup===sg){sesYaz();if(st.ses.acik&&st.ses.geri)sesOto('geri')}});
    pn.appendChild(grup('tasarim',T('Tasarım','Design'),tasarimKur(),false));
    pn.appendChild(grup('marka',T('Marka','Brand'),markaKur(),false));
  }else{
    pn.appendChild(aktarKur());
    pn.appendChild(grup('tasarim',T('Tasarım','Design'),tasarimKur(),true));
    pn.appendChild(grup('marka',T('Marka','Brand'),markaKur(),genis));
    pn.appendChild(grup('sahne',T('Slaytlar','Slides'),sahnelerKur(),genis));
  }
  var ac=aciklamaKur(arac);pn.appendChild(grup('aciklama',T('Gönderi açıklaması','Post caption'),ac,false));

  var yer=kok.querySelector('.st-motor-yer');if(yer)yer.hidden=true;
  kok.insertBefore(kr,kok.firstChild);

  ozetYaz();oynaticiKur();
  R.ro=new ResizeObserver(function(){if(!st)return;if(st.oynat)st.oynat.resize();else slaytCiz();kucuklerZamanla()});
  R.ro.observe(R.cerceve);
  M.ready().then(function(){hazir()},function(){hazir()});
  setTimeout(hazir,2500);
  kucuklerZamanla();
  oranCipYaz(st.t.aspect);
  if(!det.geri&&!det.medya)kayitZamanla();
}
function hazir(){
  if(!R.cerceve||!R.cerceve.isConnected)return;
  R.cerceve.removeAttribute('aria-busy');R.cerceve.classList.add('hazir');
  if(st.oynat)st.oynat.resize();else slaytCiz();
  kucuklerZamanla();
}

/* ---- önizleme sahnesi ---- */
function sahneKur(){
  var k=el('div','kr-sahne-k');R.sahneK=k;
  var ust=el('div','kr-sahne-ust');
  ust.appendChild(el('h3','kr-baslik',T('Önizleme','Preview')));
  R.meta=el('p','kr-meta');ust.appendChild(R.meta);k.appendChild(ust);

  var cer=el('div','kr-cerceve');cer.setAttribute('aria-busy','true');R.cerceve=cer;
  cer.appendChild(el('span','isk kr-isk'));
  var cv=el('canvas','kr-tuval');cv.tabIndex=0;cv.setAttribute('role','img');R.tuval=cv;
  cv.addEventListener('keydown',tusla);cv.setAttribute('aria-keyshortcuts',VID?'F M':'F');
  cv.addEventListener('click',function(){if(VID)oynatDurdur()});
  cer.appendChild(cv);
  if(VID){
    var b=el('button','kr-buyuk');b.type='button';b.appendChild(ikon('oynat','ikon-dolu'));b.setAttribute('aria-label',T('Önizlemeyi oynat','Play preview'));
    b.addEventListener('click',function(){oynatDurdur();R.tuval.focus({preventScroll:true})});R.buyuk=b;cer.appendChild(b);
  }
  /* C1·6: çerçeve + kontroller tek sarmalda; tam ekran (ya da iPhone'da diyalog) bu sarmalı büyütür, oynatıcı aynı kalır */
  var sar=el('div','kr-oyn-sar');R.sar=sar;sar.appendChild(cer);k.appendChild(sar);
  oranYaz();

  var kn=el('div','kr-kontrol');kn.setAttribute('role','group');kn.setAttribute('aria-label',VID?T('Oynatma','Playback'):T('Slayt gezinme','Slide navigation'));
  if(VID){
    var o=dugme('btn-cizgi kr-ikon-d',null,null,T('Oynat','Play'));o.addEventListener('click',oynatDurdur);R.oyn=o;kn.appendChild(o);
    var r=el('input','kr-kaydir');r.type='range';r.min='0';r.step='0.05';r.value='0';r.max=String(st.toplam||1);r.setAttribute('aria-label',T('Önizleme konumu','Preview position'));
    /* E4: sürüklerken duraklat (ses kaynakları susar), bırakınca oynuyorsa devam */
    r.addEventListener('pointerdown',function(){st.surukle=true;st.surCal=!!(st.oynat&&st.oynat.playing);if(st.surCal){st.oynat.pause();oynatYaz()}});
    var birak=function(){st.surukle=false;if(st.surCal&&st.oynat){st.surCal=false;sesDur2();st.oynat.resume();oynatYaz()}};
    r.addEventListener('pointerup',birak);
    r.addEventListener('pointercancel',birak);
    r.addEventListener('input',function(){if(st.oynat){st.oynat.seek(+r.value);zamanda(+r.value,st.toplam,true)}});
    r.addEventListener('keydown',function(e){if(e.key===' '){e.preventDefault();oynatDurdur()}});
    R.kaydir=r;kn.appendChild(r);
    R.saat=el('span','kr-saat','0:00 / 0:00');R.saat.setAttribute('aria-hidden','true');kn.appendChild(R.saat);
    var sb=dugme('btn-cizgi kr-ikon-d kr-sessiz',null,null,T('Sessiz (M)','Mute (M)'));sb.setAttribute('aria-pressed','false');sb.setAttribute('aria-keyshortcuts','M');
    sb.addEventListener('click',sessizDegis);R.sesB=sb;kn.appendChild(sb);
  }else{
    var g=dugme('btn-cizgi kr-ikon-d','geri',null,T('Önceki slayt','Previous slide'));g.addEventListener('click',function(){if(!pasifMi(g))slaytGit(st.slayt-1)});R.onceki=g;kn.appendChild(g);
    R.noktalar=el('div','kr-noktalar');R.noktalar.setAttribute('role','group');R.noktalar.setAttribute('aria-label',T('Slaytlar','Slides'));kn.appendChild(R.noktalar);
    R.sira=el('span','kr-saat');R.sira.setAttribute('aria-live','polite');kn.appendChild(R.sira);
    var n=dugme('btn-cizgi kr-ikon-d','ileri',null,T('Sonraki slayt','Next slide'));n.addEventListener('click',function(){if(!pasifMi(n))slaytGit(st.slayt+1)});R.sonraki=n;kn.appendChild(n);
  }
  var bt=dugme('btn-cizgi kr-ikon-d kr-buyut-d','buyut',null,T('Tam ekran','Full screen'));bt.setAttribute('aria-keyshortcuts','F');
  bt.addEventListener('click',tamDegis);R.buyutB=bt;kn.appendChild(bt);
  sar.appendChild(kn);
  k.appendChild(eylemKur());

  var sr=el('ol','kr-serit');sr.setAttribute('aria-label',VID?T('Sahnelere git','Go to scene'):T('Slaytlara git','Go to slide'));R.serit=sr;k.appendChild(sr);
  seritKur();if(!VID)noktaKur();
  if(VID)k.appendChild(aktarKur());
  return k;
}
/* oynatıcının hemen altındaki ana eylemler — Medyayı değiştir (birincil), Oran, İndir (video: MP4; görsel: tüm slaytlar) */
var ORAN_AD={'9:16':['Dikey','Vertical'],'1:1':['Kare','Square'],'4:5':['Portre','Portrait'],'16:9':['Yatay','Landscape']};
function eylemKur(){
  var ey=el('div','kr-eylem');ey.setAttribute('role','group');ey.setAttribute('aria-label',VID?T('Video eylemleri','Video actions'):T('Karusel eylemleri','Carousel actions'));R.eylem=ey;
  var db=dugme('btn-ana kr-degis-ac','resim',T('Medyayı değiştir','Swap media'));db.setAttribute('aria-haspopup','dialog');db.setAttribute('aria-controls','kr-degis');
  db.addEventListener('click',function(){degisAc(VID?(st.oynat?sahneNo(st.oynat.time):0):st.slayt,db)});R.degisB=db;ey.appendChild(db);
  var ok=el('div','kr-oran-k'),id='kr-'+MOD+'-oran-sec';
  var ol=el('label','kr-oran-l',T('Oran','Ratio'));ol.htmlFor=id;ok.appendChild(ol);
  var se=el('select','st-girdi kr-oran-sec');se.id=id;
  ORANLAR.forEach(function(a){var o=el('option',null,a+' · '+T(ORAN_AD[a][0],ORAN_AD[a][1]));o.value=a;se.appendChild(o)});
  se.value=st.t.aspect;se.addEventListener('change',function(){if(se.value!==st.t.aspect){oranSec(se.value);S.durum(T('Oran: ','Aspect ratio: ')+se.value)}});
  R.oranSel=se;ok.appendChild(se);ey.appendChild(ok);
  return ey;
}
function oranYaz(){
  var a=M.aspects[st.t.aspect];R.cerceve.style.setProperty('--kr-oran',String(a[0]/a[1]));R.cerceve.setAttribute('data-aspect',st.t.aspect);
  if(R.serit)R.serit.style.setProperty('--kr-oran',String(a[0]/a[1]));
}
function tuvalEtiket(){
  var i=VID?(st.oynat?sahneNo(st.oynat.time):0):st.slayt,s=st.sahneler[i]||{};
  var m=String(s.text||'').replace(/\*/g,'');
  R.tuval.setAttribute('aria-label',(VID?T('Video önizlemesi','Video preview'):T('Karusel önizlemesi','Carousel preview'))+', '+tekil(i)+(m?': '+m:'')+(VID?T('. Boşluk tuşu oynatır ya da duraklatır, oklar 1 saniye kaydırır.','. Space plays or pauses, arrow keys move 1 second.'):T('. Oklarla slayt değiştir.','. Use arrow keys to change slides.')));
}
function tusla(e){
  if((e.key==='f'||e.key==='F')&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();tamDegis();return}
  if(VID&&(e.key==='m'||e.key==='M')&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();sessizDegis();return}
  if(e.key===' '||e.key==='Spacebar'){if(VID){e.preventDefault();oynatDurdur()}return}
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
    e.preventDefault();var y=e.key==='ArrowRight'?1:-1;
    if(VID&&st.oynat){st.oynat.seek(st.oynat.time+y);zamanda(st.oynat.time,st.toplam,true)}else if(!VID)slaytGit(st.slayt+y);
  }
}

/* ---- C1·6 büyüt / tam ekran ----
   Fullscreen API (webkit önekli dahil) sarmalı tam ekran yapar; API yoksa (iPhone Safari) ya da reddedilirse sarmal
   bir <dialog> içine taşınır (yerinde yorum düğümü bırakılır, kapanınca geri konur). Tek oynatıcı: kaydırıcı ve tuşlar aynen çalışır. */
function tamEl(){return d.fullscreenElement||d.webkitFullscreenElement||null}
function tamMi(){return !!R.sar&&(tamEl()===R.sar||!!(R.dlg&&R.dlg.open))}
function tamDegis(){if(tamMi())tamKapat();else tamAc()}
function tamAc(){
  var s=R.sar;if(!s||!s.isConnected)return;
  var f=s.requestFullscreen||s.webkitRequestFullscreen;
  if(f){try{var p=f.call(s);if(p&&typeof p.then==='function')p.then(null,function(){if(R.sar===s&&!tamMi())dlgAc()});return}catch(e){}}
  dlgAc();
}
function tamKapat(){
  if(R.dlg&&R.dlg.open){try{R.dlg.close()}catch(e){}return}
  if(!tamEl())return;var x=d.exitFullscreen||d.webkitExitFullscreen;
  if(x){try{var p=x.call(d);if(p&&typeof p.then==='function')p.then(null,function(){})}catch(e){}}
}
function tamBirak(){if(R.sar&&tamMi())tamKapat()}
function dlgAc(){
  var s=R.sar;if(!s||!s.isConnected||!s.parentNode)return;
  var g=d.createElement('dialog');
  if(typeof g.showModal!=='function'){S.durum(T('Tarayıcın tam ekranı desteklemiyor.','Your browser doesn’t support full screen.'));return}
  g.className='kr-buyut-dlg';g.setAttribute('aria-label',VID?T('Video önizlemesi · tam ekran','Video preview · full screen'):T('Karusel önizlemesi · tam ekran','Carousel preview · full screen'));
  var yer=d.createComment('kr-oyn'),b=R.buyutB;s.parentNode.insertBefore(yer,s);g.appendChild(s);d.body.appendChild(g);R.dlg=g;
  g.addEventListener('close',function(){
    if(yer.parentNode){yer.parentNode.insertBefore(s,yer);yer.parentNode.removeChild(yer)}
    if(g.parentNode)g.parentNode.removeChild(g);
    if(R.dlg===g){R.dlg=null;tamYaz(false);if(b&&b.isConnected)b.focus({preventScroll:true})}
  });
  try{g.showModal()}catch(e){g.close();return}
  tamYaz(true);if(R.tuval)R.tuval.focus({preventScroll:true});
}
function tamYaz(on){
  if(!R.sar)return;R.sar.classList.toggle('kr-tam',on);
  var b=R.buyutB;if(b){b.textContent='';b.appendChild(ikon(on?'kucult':'buyut'));var e=on?T('Tam ekrandan çık','Exit full screen'):T('Tam ekran','Full screen');b.setAttribute('aria-label',e);b.title=e}
  var bu=st;requestAnimationFrame(function(){if(!st||st!==bu)return;if(st.oynat)st.oynat.resize();else slaytCiz()});
}
function tamOlay(){if(R.sar&&!(R.dlg&&R.dlg.open))tamYaz(tamEl()===R.sar)}
d.addEventListener('fullscreenchange',tamOlay);
/* E4: sekme gizlenince önizleme durur (ses arka planda çalmasın) */
d.addEventListener('visibilitychange',function(){if(d.hidden&&st&&st.oynat&&st.oynat.playing){st.oynat.pause();oynatYaz()}});d.addEventListener('webkitfullscreenchange',tamOlay);

/* video oynatıcı */
var sonSn=-1,sonTop=-1,sonI=-1;
function oynaticiKur(){
  sonSn=sonTop=sonI=-1;
  if(!VID){slaytCiz();return}
  /* E4: iOS sessiz anahtarı açıkken de önizleme sesi çalsın */
  if(navigator.audioSession){try{navigator.audioSession.type='playback'}catch(e){}}
  /* ses varken döngü yok: sonda durur, büyük düğme "Tekrar oynat" (motor loop/onEnd'i her karede okur) */
  st.oynOpts={autoplay:!AZ,loop:!sesVarMi(),muted:sessizMi(),onTime:function(t,top){zamanda(t,top)},onEnd:function(){if(R.buyuk)R.buyuk.setAttribute('data-yazi',T('Tekrar oynat','Play again'));oynatYaz()}};
  st.oynat=M.play(R.tuval,proje(),st.oynOpts);
  if(AZ){st.oynat.seek(oturan(0))}
  oynatYaz();sessizYaz();
}
function sesVarMi(){return !!(VID&&st&&st.ses&&st.ses.acik&&st.sahneler.some(function(s){return !!sesTampon(s)}))}
var SESSIZ_K='smc-onz-sessiz';
function sessizMi(){try{return localStorage.getItem(SESSIZ_K)==='1'}catch(e){return false}}
function sessizDegis(){
  if(!st||!st.oynat)return;
  var x=!st.oynat.muted;st.oynat.mute(x);if(st.oynOpts)st.oynOpts.muted=x;
  try{if(x)localStorage.setItem(SESSIZ_K,'1');else localStorage.removeItem(SESSIZ_K)}catch(e){}
  if(!x)sesCtx();
  sessizYaz();S.durum(x?T('Önizleme sessiz.','Preview muted.'):T('Önizleme sesli.','Preview sound on.'));
}
function sessizYaz(){
  var b=R.sesB;if(!b)return;var x=!!(st&&st.oynat&&st.oynat.muted);
  b.textContent='';b.appendChild(ikon(x?'sesKapali':'ses'));b.setAttribute('aria-pressed',x?'true':'false');
  b.title=x?T('Sesi aç (M)','Unmute (M)'):T('Sessiz (M)','Mute (M)');
}
function zamanda(t,top,zorla){
  if(!R.kaydir)return;
  if(top!==sonTop){sonTop=top;R.kaydir.max=String(top)}
  if(!st.surukle||zorla)R.kaydir.value=String(t);
  R.kaydir.style.setProperty('--kr-dolu',(top?Math.min(100,t/top*100):0).toFixed(2)+'%');
  var s=Math.floor(t);
  if(s!==sonSn||zorla){sonSn=s;R.saat.textContent=sure(t)+' / '+sure(top);R.kaydir.setAttribute('aria-valuetext',sureSoz(t)+' / '+sureSoz(top))}
  var i=sahneNo(t);if(i!==sonI){sonI=i;aktifKare(i);tuvalEtiket()}
}
function oynatDurdur(){
  if(!st||!st.oynat||st.mesgul)return;
  if(st.oynat.playing)st.oynat.pause();
  else{
    /* E4: ses bağlamı jest içinde uyanır; hâlâ askıdaysa ipucu */
    sesDur2();var c=sesVarMi()&&!st.oynat.muted?sesCtx():null;
    if(R.buyuk)R.buyuk.removeAttribute('data-yazi');
    st.oynat.resume();
    if(c)setTimeout(function(){if(c.state!=='running'&&st&&st.oynat&&st.oynat.playing){var m=T('Sesi açmak için dokun','Tap to turn on sound');S.toast(m);if(R.sesB)R.sesB.title=m}},350);
  }
  oynatYaz();
}
function oynatYaz(){
  if(!R.oyn)return;var p=!!(st.oynat&&st.oynat.playing);
  R.oyn.textContent='';R.oyn.appendChild(ikon(p?'dur':'oynat',p?'':'ikon-dolu'));
  var e=p?T('Duraklat','Pause'):T('Oynat','Play');R.oyn.setAttribute('aria-label',e);R.oyn.title=e;
  if(R.buyuk)R.buyuk.hidden=p||st.mesgul;
  R.cerceve.classList.toggle('oynuyor',p);
}
function sahneyeGit(i){
  if(!st.oynat)return;sesDur2();
  if(st.oynat.playing)st.oynat.seek(st.basla[i]||0);else st.oynat.seek(oturan(i));
  zamanda(st.oynat.time,st.toplam,true);
}

/* görsel: slayt slayt */
function slaytCiz(){
  if(VID||!R.tuval)return;
  st.slayt=Math.max(0,Math.min(st.sahneler.length-1,st.slayt));
  boyut(R.tuval,st.t.aspect);
  try{M.drawSlide(R.tuval.getContext('2d'),proje(),st.slayt)}catch(e){}
  var n=st.sahneler.length;
  R.sira.textContent=(st.slayt+1)+' / '+n;
  pasif(R.onceki,st.slayt<=0);pasif(R.sonraki,st.slayt>=n-1);
  R.noktalar.querySelectorAll('button').forEach(function(b,i){if(i===st.slayt)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});
  aktifKare(st.slayt);tuvalEtiket();
}
function slaytGit(i){st.slayt=Math.max(0,Math.min(st.sahneler.length-1,i));slaytCiz()}
function noktaKur(){
  if(!R.noktalar)return;R.noktalar.textContent='';
  st.sahneler.forEach(function(s,i){
    var b=el('button','kr-nokta');b.type='button';b.setAttribute('aria-label',tekil(i));
    b.addEventListener('click',function(){slaytGit(i)});R.noktalar.appendChild(b);
  });
  R.noktalar.hidden=st.sahneler.length>12;
}

/* film şeridi */
function seritKur(){
  R.serit.textContent='';R.kareler=[];
  st.sahneler.forEach(function(s,i){
    var li=el('li'),b=el('button','kr-kare');b.type='button';
    var cv=el('canvas');cv.setAttribute('aria-hidden','true');b.appendChild(cv);
    var no=el('span','kr-kare-no',String(i+1));no.setAttribute('aria-hidden','true');b.appendChild(no);
    if(VID){var su=el('span','kr-kare-sn',sn(s.secs));su.setAttribute('aria-hidden','true');b.appendChild(su)}
    b.setAttribute('aria-label',tekil(i)+(s.text?': '+s.text.replace(/\*/g,'').slice(0,60):''));
    b.addEventListener('click',function(){if(VID)sahneyeGit(i);else slaytGit(i)});
    li.appendChild(b);R.serit.appendChild(li);R.kareler.push(b);
  });
  sonI=-1;aktifKare(VID&&st.oynat?sahneNo(st.oynat.time):st.slayt);
}
function aktifKare(i){
  (R.kareler||[]).forEach(function(b,k){if(k===i)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});
}
var kucukT=0;
function kucuklerZamanla(){clearTimeout(kucukT);kucukT=setTimeout(kucukler,200)}
function kucukler(){
  if(!st||!R.serit||!R.serit.isConnected)return;
  if(!R.serit.offsetParent)return;
  var p=proje();
  (R.kareler||[]).forEach(function(b,i){var cv=b.querySelector('canvas');var a=M.aspects[st.t.aspect];boyut(cv,st.t.aspect,Math.min(150,84*a[0]/a[1]));try{M.drawSlide(cv.getContext('2d'),p,i)}catch(e){}});
  (R.sablonCv||[]).forEach(function(x){var pp=proje({template:x.id,aspect:'1:1'});boyut(x.cv,'1:1',72);try{M.drawSlide(x.cv.getContext('2d'),pp,0)}catch(e){}});
}

/* ---- dışa aktarma ---- */
function aktarKur(){
  var k=el('section','kr-aktar');k.setAttribute('aria-labelledby','kr-aktar-h-'+MOD);
  var h=el('h3','kr-aktar-h',T('Diğer indirmeler','More downloads'));h.id='kr-aktar-h-'+MOD;k.appendChild(h);
  var f=M.videoFormat(),dg=el('div','kr-aktar-d');
  if(VID){
    var etk=f&&f.ext==='mp4'?T('İndir (MP4)','Download (MP4)'):T('İndir (WebM)','Download (WebM)');
    var vb=dugme('btn-cizgi kr-indir-d','indir',etk);R.videoB=vb;
    if(!f){pasif(vb,true);vb.hidden=true}
    vb.addEventListener('click',function(){if(!pasifMi(vb))videoAktar()});(R.eylem||dg).appendChild(vb);
    var pb=dugme('btn-cizgi','indir',T('Bu kareyi PNG indir','Download this frame as PNG'));R.pngB=pb;
    pb.addEventListener('click',function(){if(!pasifMi(pb))pngAktar()});dg.appendChild(pb);
  }else{
    var hb=dugme('btn-cizgi kr-indir-d','indir',T('Tüm slaytları indir','Download all slides'));R.hepsiB=hb;hb.addEventListener('click',function(){if(!pasifMi(hb))hepsiAktar()});(R.eylem||dg).appendChild(hb);
    var sb=dugme('btn-cizgi','resim',T('Bu slaytı PNG indir','Download this slide as PNG'));R.pngB=sb;
    sb.addEventListener('click',function(){if(!pasifMi(sb))pngAktar()});dg.appendChild(sb);
  }
  k.appendChild(dg);
  R.aktarBilgi=el('p','ipucu kr-aktar-bilgi');k.appendChild(R.aktarBilgi);
  if(VID&&!f){var u=el('p','not not-uyari',T('Bu tarayıcı video kaydını desteklemiyor; kareleri PNG olarak indirebilirsin.','This browser can’t record video; you can still download frames as PNG.'));k.appendChild(u)}

  /* Görsel kaynakları: sahnelere Pexels fotoğrafı eklenince görünür; künye paylaşırken açıklamaya kopyalanır */
  var kn=el('div','kr-kaynak');kn.hidden=true;R.kaynak=kn;
  var kb=el('div','kr-kaynak-ust');kb.appendChild(el('p','st-etiket',T('Görsel kaynakları','Image credits')));
  var kc=dugme('btn-cizgi kr-kaynak-kopya',null,T('Kopyala','Copy'),T('Görsel kaynaklarını kopyala','Copy image credits'));
  kc.addEventListener('click',function(){var m=kaynakMetni();if(!m)return;S.kopyala(m,function(){var x=T('Görsel kaynakları kopyalandı.','Image credits copied.');S.toast(x);S.durum(x)},function(){S.durum(T('Kopyalanamadı; metni seçip kopyala.','Couldn’t copy; select the text and copy it.'))})});
  kb.appendChild(kc);kn.appendChild(kb);
  R.kaynakMetin=el('p','kr-kaynak-metin');kn.appendChild(R.kaynakMetin);
  kn.appendChild(el('p','ipucu',T('Paylaşırken gönderi açıklamasına eklemen iyi olur.','It’s good practice to add this to your post caption.')));
  k.appendChild(kn);

  var ky=el('div','kr-kayit');ky.hidden=true;R.kayit=ky;
  var ku=el('div','kr-kayit-ust');R.yuzde=el('span','kr-yuzde','');ku.appendChild(el('span','kr-kayit-ad',T('Video kaydediliyor','Recording video')));ku.appendChild(R.yuzde);
  var ip=dugme('btn-hafif btn-kucuk','kapat',T('İptal','Cancel'));ip.addEventListener('click',function(){if(st.iptal)st.iptal.abort()});ku.appendChild(ip);
  ky.appendChild(ku);
  var bar=el('div','st-ilerleme kr-cubuk');bar.setAttribute('role','progressbar');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow','0');
  bar.setAttribute('aria-label',T('Video kaydı','Video recording'));R.cubuk=bar;R.cubukIc=el('span');bar.appendChild(R.cubukIc);ky.appendChild(bar);
  ky.appendChild(el('p','ipucu',T('Kayıt gerçek zamanlı; sekmeyi açık tut.','Recording runs in real time; keep this tab open.')));
  k.appendChild(ky);
  R.aktarNot=el('p','not kr-aktar-not');k.appendChild(R.aktarNot);
  return k;
}
function aktarNot(m,tur){R.aktarNot.textContent=m||'';R.aktarNot.className='not kr-aktar-not'+(m&&tur?' not-'+tur:'')}
function mesgul(x){st.mesgul=x;[R.videoB,R.pngB,R.hepsiB].forEach(function(b){if(b)pasif(b,x)});if(R.videoB&&!M.videoFormat())pasif(R.videoB,true);if(R.kr)R.kr.classList.toggle('kr-mesgul',x);oynatYaz()}
function ilerleYaz(p){var y=Math.round(Math.max(0,Math.min(1,p||0))*100);R.yuzde.textContent='%'+y;if(EN)R.yuzde.textContent=y+'%';R.cubuk.setAttribute('aria-valuenow',String(y));R.cubukIc.style.width=y+'%'}
function hataMetni(e){
  var k=e&&e.message;
  if(k==='video_unsupported')return T('Bu tarayıcı video kaydını desteklemiyor; kareleri PNG olarak indirebilirsin.','This browser can’t record video; you can still download frames as PNG.');
  if(k==='empty_video')return T('Kayıt boş çıktı. Sekmeyi açık tutup tekrar dene.','The recording came out empty. Keep the tab open and try again.');
  return T('Dışa aktarılamadı. Tekrar dene; olmazsa kareleri PNG olarak indir.','Export failed. Try again, or download the frames as PNG.');
}
function videoAktar(){
  if(st.mesgul)return;
  if(!M.videoFormat()){aktarNot(hataMetni({message:'video_unsupported'}),'uyari');return}
  /* F2: seslendirme varsa ortak ses bağlamı bu tıklamada (jest içinde) açılır; Safari yeni bağlamı askıda tutarsa motor onu kullanır */
  var sesli=VID&&st.sahneler.some(function(s){return !!sesTampon(s)});if(sesli)sesCtx();
  var ac=new AbortController();st.iptal=ac;
  if(st.oynat)st.oynat.pause();mesgul(true);aktarNot('');
  R.kayit.hidden=false;ilerleYaz(0);
  S.durum(T('Video kaydı başladı. Yaklaşık '+sureSoz(st.toplam)+' sürer.','Video recording started. It takes about '+sureSoz(st.toplam)+'.'));
  var ad='smc-'+slug()+'.';
  M.exportVideo(proje(),{signal:ac.signal,onProgress:ilerleYaz}).then(function(r){
    indir(r.blob,ad+r.ext);var m=T('Video indirildi ('+r.ext.toUpperCase()+').','Video downloaded ('+r.ext.toUpperCase()+').');
    if(sesli&&r.audio===false){m=T('Video sessiz indirildi ('+r.ext.toUpperCase()+'): tarayıcı seslendirmeyi kayda almadı. Önizlemeyi bir kez oynatıp tekrar indir.','Video downloaded without sound ('+r.ext.toUpperCase()+'): the browser didn’t record the voiceover. Play the preview once, then download again.');aktarNot(m,'uyari');S.durum(m);return}
    aktarNot(m,'ok');S.toast(m);S.durum(m);
  },function(e){
    if(e&&e.name==='AbortError'){aktarNot(T('Kayıt iptal edildi.','Recording cancelled.'));S.durum(T('Kayıt iptal edildi.','Recording cancelled.'))}
    else{var m=hataMetni(e);aktarNot(m,'hata');S.durum(m)}
  }).then(function(){if(st&&st.iptal===ac){st.iptal=null;R.kayit.hidden=true;mesgul(false)}});
}
function pngAktar(){
  if(st.mesgul)return;
  var i=VID?(st.oynat?sahneNo(st.oynat.time):0):st.slayt;
  mesgul(true);aktarNot('');
  M.exportPng(proje(),i).then(function(b){
    indir(b,'smc-'+slug()+'-'+iki(i+1)+'.png');var m=T(tekil(i)+' PNG olarak indirildi.',tekil(i)+' downloaded as PNG.');aktarNot(m,'ok');S.toast(m);S.durum(m);
  },function(){aktarNot(T('PNG oluşturulamadı. Tekrar dene.','Couldn’t create the PNG. Try again.'),'hata')}).then(function(){mesgul(false)});
}
function hepsiAktar(){
  if(st.mesgul)return;
  mesgul(true);aktarNot('');var s=slug(),n=st.sahneler.length;
  S.durum(T(n+' slayt hazırlanıyor…','Preparing '+n+' slides…'));
  M.exportAllPng(proje()).then(function(bl){
    var z=Promise.resolve();
    bl.forEach(function(b,i){z=z.then(function(){indir(b,'smc-'+s+'-'+iki(i+1)+'.png');aktarNot(T((i+1)+' / '+bl.length+' indirildi…',(i+1)+' / '+bl.length+' downloaded…'));return i<bl.length-1?bekle(400):null})});
    return z.then(function(){var m=T(bl.length+' slayt PNG olarak indirildi.',bl.length+' slides downloaded as PNG.');aktarNot(m,'ok');S.toast(m);S.durum(m)});
  }).catch(function(){aktarNot(T('Slaytlar indirilemedi. Tekrar dene.','Couldn’t download the slides. Try again.'),'hata')}).then(function(){mesgul(false)});
}

/* ---- F2 (26.11): AI seslendirme — yalnız video, isteğe bağlı, KAPALI başlar ----
   GET {API}/gen/tts/sesler (oturumsuz) ucu yoksa / yanıt bozuksa grup gizli; acik:false ise kutu kapalı + "yakında".
   Her sahnenin metni POST {API}/gen/tts (Bearer oturum) ile sırayla mp3 alınır, decodeAudioData ile AudioBuffer olur.
   Ses yalnız bu sekmenin belleğinde durur (anahtar: ses|metin); kayda yalnız {acik,id} yazılır. Dönüşte "Sesi yeniden oluştur".
   Sahne süresi sese göre uzar: secs = max(secs, ses + 0,4) (motor sınırı 15 sn). */
var API_T=(function(){var m=d.querySelector('meta[name="api-base"]');return m?String(m.getAttribute('content')||'').replace(/\/+$/,''):''})();
var TTS_MAX=1500,TTS_ID=/^[a-z]{2}-[A-Z]{2}-[A-Za-z]{2,30}$/,RID_RE=/^[A-Za-z0-9_-]{8,160}\.[A-Za-z0-9_-]{22}$/,RID_OM=24*3600*1000-5*60*1000;
/* E3: liste sunucudan gelir (dile göre yuvalar); uç yoksa arayüz dilinin iki varsayılan yuvası. Eski kimlikler yeni yuvaya döner. */
var SES={durum:'bilinmiyor',uretildi:false,P:null,iptal:null,dinle:null,dinleKaynak:null,tampon:{},oto:0,
  liste:EN?[{id:'en-US-Kadin',dil:'en',ad:'Hope',cinsiyet:'kadin',yerel:true},{id:'en-US-Erkek',dil:'en',ad:'Mark',cinsiyet:'erkek',yerel:true}]
          :[{id:'tr-TR-Kadin',dil:'tr',ad:'Derya',cinsiyet:'kadin',yerel:true},{id:'tr-TR-Erkek',dil:'tr',ad:'Adam',cinsiyet:'erkek',yerel:true}]};
var SES_ALIAS={'tr-TR-Sarah':'tr-TR-Kadin','tr-TR-Adam':'tr-TR-Erkek','en-US-Alice':'en-US-Kadin','en-US-George':'en-GB-Erkek','fr-FR-Kadin':'fr-FR-Erkek'};
var SES_GRUP={tr:'Türkçe',en:'English',de:'Deutsch',es:'Español',fr:'Français',ar:'العربية'};
var SES_DIL=EN?{tr:'Turkish',en:'English',de:'German',es:'Spanish',fr:'French',ar:'Arabic'}:{tr:'Türkçe',en:'İngilizce',de:'Almanca',es:'İspanyolca',fr:'Fransızca',ar:'Arapça'};
function sesGecerli(id){return SES.liste.some(function(v){return v.id===id})}
function sesDili(v){return v.dil||String(v.id).slice(0,2)}
function sesAdi(v){return v.ad+' ('+(v.cinsiyet==='erkek'?T('erkek','male'):T('kadın','female'))+(v.yerel===false?T(', çok dilli',', multilingual'):'')+')'}
/* varsayılan: arayüz dilinin kadın sesi → aynı dilden ilk ses → listedeki ilk ses */
function sesVarsayilan(){
  var h=EN?'en-US-Kadin':'tr-TR-Kadin';if(sesGecerli(h))return h;
  var on=EN?'en':'tr';for(var i=0;i<SES.liste.length;i++)if(sesDili(SES.liste[i])===on)return SES.liste[i].id;
  return SES.liste[0].id;
}
function ridGecerli(){return !!(st&&st.ses&&st.ses.rid&&st.ses.ridSon>Date.now())}
/* kalan hak (KB /gen/quota → S.hak().ses); x-ses-kalan gelince önce aylık, sonra ek haktan düşülür */
function sesHakBilgi(){var h=S.hak&&S.hak();return h&&h.ses&&typeof h.ses.kalan==='number'?h.ses:null}
function sesKalanYaz(k){
  var s=sesHakBilgi();if(!s||!(k>=0))return;
  var fark=s.kalan-k;if(fark>0){var ana=Math.max(0,(s.limit||0)-(s.used||0)),al=Math.min(fark,ana);s.used=(s.used||0)+al;s.ek=Math.max(0,(s.ek||0)-(fark-al))}
  s.kalan=k;
}
function sesBul(id){return bul(SES.liste,id)||SES.liste[0]}
/* okunacak metin: ekran metni + alt satır; vurgu yıldızları atılır, boşluklar sadeleşir, 1500 kod noktasına kırpılır */
function sesMetni(s){
  var a=String(s.text||'').replace(/\*/g,'').replace(/\s+/g,' ').trim(),b=String(s.sub||'').replace(/\*/g,'').replace(/\s+/g,' ').trim();
  var t=a&&b?a+(/[.!?…:;]$/.test(a)?' ':'. ')+b:a||b;
  var c=Array.from(t);return c.length>TTS_MAX?c.slice(0,TTS_MAX).join('').trim():t;
}
function sesAnahtar(s){var m=sesMetni(s);return m?st.ses.id+'|'+m:''}
function sesTampon(s){if(!VID||!st||!st.ses||!st.ses.acik)return null;var k=sesAnahtar(s);return k&&SES.tampon[k]||null}
function sesEksik(){var a=[];st.sahneler.forEach(function(s,i){var k=sesAnahtar(s);if(k&&!SES.tampon[k])a.push(i)});return a}
function sesSayi(){var n=0;st.sahneler.forEach(function(s){if(sesMetni(s))n++});return n}
/* bellekte yalnız şu anki sahnelerin (her iki sesle) tamponu kalır */
function sesBuda(){var kul={};st.sahneler.forEach(function(s){var m=sesMetni(s);if(m)SES.liste.forEach(function(v){kul[v.id+'|'+m]=1})});Object.keys(SES.tampon).forEach(function(k){if(!kul[k])delete SES.tampon[k]})}
function seslerAl(){
  if(SES.P)return SES.P;
  if(!window.fetch||!API_T){SES.durum='yok';return SES.P=Promise.resolve()}
  var ac=window.AbortController?new AbortController():null,tm=ac?setTimeout(function(){ac.abort()},8000):0,o={method:'GET',credentials:'omit',cache:'no-store'};
  if(ac)o.signal=ac.signal;
  SES.P=fetch(API_T+'/gen/tts/sesler',o).then(function(r){clearTimeout(tm);return r.ok?r.json().then(null,function(){return null}):null},function(){clearTimeout(tm);return null}).then(function(j){
    if(!j||j.ok===false||typeof j.acik!=='boolean'){SES.durum='yok';return}
    var l=(Array.isArray(j.sesler)?j.sesler:[]).filter(function(v){return v&&typeof v.id==='string'&&TTS_ID.test(v.id)}).slice(0,12)
      .map(function(v){return {id:v.id,dil:v.id.slice(0,2),ad:typeof v.ad==='string'&&v.ad?v.ad.slice(0,30):v.id.split('-')[2],cinsiyet:v.cinsiyet==='erkek'?'erkek':'kadin',yerel:v.yerel===true}});
    if(l.length)SES.liste=l;
    SES.durum=j.acik?'acik':'kapali';
  });
  return SES.P;
}
function sesKur(){
  var ic=el('div','kr-ses'),id='kr-'+MOD+'-ses';
  R.sesHak=el('p','kr-ses-hak');R.sesHak.hidden=true;ic.appendChild(R.sesHak);
  var sat=el('div','kr-ses-ac');
  var cb=el('input','kr-ses-kutu');cb.type='checkbox';cb.id=id+'-ac';cb.checked=!!st.ses.acik;cb.disabled=true;cb.setAttribute('aria-describedby',id+'-not');R.sesAc=cb;
  var lb=el('label','kr-ses-l',T('Sahneleri AI sesiyle seslendir','Read the scenes with an AI voice'));lb.htmlFor=cb.id;
  sat.appendChild(cb);sat.appendChild(lb);ic.appendChild(sat);
  var ay=el('div','kr-ses-ayar');ay.hidden=true;R.sesAyar=ay;
  var sl=el('label','st-etiket kr-ses-etiket',T('Ses','Voice'));sl.htmlFor=id+'-sec';ay.appendChild(sl);
  var ss=el('div','kr-ses-sat');
  var sec=el('select','st-girdi kr-ses-sec');sec.id=id+'-sec';R.sesSec=sec;ss.appendChild(sec);
  var dn=dugme('btn-cizgi btn-kucuk kr-ses-dinle','oynat',T('Dinle (ücretsiz)','Listen (free)'),T('Seçili sesten kısa örnek dinle','Play a short sample of the selected voice'));dn.setAttribute('aria-pressed','false');R.sesDinle=dn;ss.appendChild(dn);
  ay.appendChild(ss);
  var dl=el('p','not not-uyari kr-ses-dilnot');dl.hidden=true;R.sesDilNot=dl;ay.appendChild(dl);
  var kl=el('div','kr-ses-kilit');R.sesKilit=kl;
  var ob=dugme('btn-ana btn-kucuk kr-ses-olustur','ses',T('Seslendir (1 hak)','Voice it (1 credit)'));R.sesOlustur=ob;kl.appendChild(ob);
  R.sesHakNot=el('p','ipucu kr-ses-haknot','');kl.appendChild(R.sesHakNot);ay.appendChild(kl);
  ay.appendChild(sesPanelKur());
  var il=el('div','kr-ses-ilerleme');il.hidden=true;R.sesIl=il;
  var iu=el('div','kr-kayit-ust');R.sesSay=el('span','kr-ses-say','');iu.appendChild(R.sesSay);
  var ip=dugme('btn-hafif btn-kucuk','kapat',T('İptal','Cancel'),T('Seslendirmeyi iptal et','Cancel the voiceover'));ip.addEventListener('click',function(){if(SES.iptal)SES.iptal.abort()});iu.appendChild(ip);il.appendChild(iu);
  var bar=el('div','st-ilerleme kr-cubuk');bar.setAttribute('role','progressbar');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow','0');
  bar.setAttribute('aria-label',T('Seslendirme','Voiceover'));R.sesBar=bar;R.sesBarIc=el('span');bar.appendChild(R.sesBarIc);il.appendChild(bar);ay.appendChild(il);
  ay.appendChild(el('p','ipucu',T('Her sahnenin metni seçtiğin sesle okunur; sahne gerekirse sese göre uzar (en çok 15 sn). Bir video 1 hak kullanır; 24 saat içinde ses ve metin değişiklikleri ek hak harcamaz. Ses MP4’e eklenir, yalnız bu sekmede tutulur.','Each scene’s text is read in the voice you pick; a scene grows to fit its audio if needed (up to 15 s). One video uses 1 credit; voice and text changes within 24 hours don’t use another. The audio goes into the MP4 and stays only in this tab.')));
  ic.appendChild(ay);
  var nt=el('p','not kr-ses-not');nt.id=id+'-not';nt.setAttribute('aria-live','polite');R.sesNot=nt;ic.appendChild(nt);
  cb.addEventListener('change',function(){
    if(SES.durum!=='acik'){cb.checked=false;return}
    st.ses.acik=cb.checked;st.ses.geri=false;
    if(!cb.checked){sesDur();sesNot('');guncelle();S.durum(T('Seslendirme kapatıldı.','Voiceover turned off.'));return}
    sesCtx();guncelle();
    sesOto('ac');
  });
  sec.addEventListener('change',function(){
    if(!sesGecerli(sec.value))return;
    sesDur();st.ses.id=sec.value;sesNot('');guncelle();
    sesOto('ses');
  });
  dn.addEventListener('click',function(){if(!pasifMi(dn))sesDinle()});
  ob.addEventListener('click',function(){if(!pasifMi(ob)){sesCtx();sesOlustur()}});
  return ic;
}
/* B·4: hak bitti paneli — plana göre Pro bağlantısı + herkese ek paket talebi (ödeme akışı yok; hak elle eklenir) */
function sesPanelKur(){
  var p=el('div','kr-ses-panel');p.hidden=true;p.setAttribute('role','status');R.sesPanel=p;
  R.sesPanelB=el('p','kr-ses-panel-b',T('Bu ayın seslendirme hakların bitti.','You’ve used this month’s voiceover credits.'));p.appendChild(R.sesPanelB);
  var sa=el('div','kr-ses-panel-sat');
  var pro=el('a','btn btn-cizgi btn-kucuk kr-ses-pro',T('Pro’ya geç (ayda 6)','Go Pro (6 a month)'));pro.href=EN?'/en/pricing':'/fiyatlar';R.sesPro=pro;sa.appendChild(pro);
  var ek=el('a','btn btn-ana btn-kucuk kr-ses-ek',T('Ek hak al (+6 video · 299 TL)','Get extra credits (+6 videos · $7)'));
  ek.href=EN?'https://socialmediacorner.co/en/contact?konu=Extra%20voiceover%20pack%20(%2B6)#form':'https://socialmediacorner.co/iletisim?konu=Ek%20seslendirme%20paketi%20(%2B6)#form';
  ek.target='_blank';ek.rel='noopener';R.sesEk=ek;sa.appendChild(ek);p.appendChild(sa);
  p.appendChild(R.sesPanelIp=el('p','ipucu',T('Ödeme sonrası hakların 1 iş günü içinde hesabına eklenir. Ses örneklerini dinlemek ücretsiz.','Credits are added to your account within 1 business day of payment. Listening to voice samples is free.')));
  return p;
}
function sesHakYaz(){
  if(!R.sesHak)return;
  var s=sesHakBilgi();
  if(!s||typeof s.limit!=='number'){R.sesHak.hidden=true;R.sesHak.textContent='';return}
  var ana=Math.max(0,s.limit-(s.used||0)),ek=s.ek||0;
  /* F10: planında seslendirme yoksa (demo/ücretsiz, limit 0) "0/0 hak" yerine planı söyle */
  if(s.limit===0&&!ek){R.sesHak.textContent=T('Seslendirme Basic ve Pro planlarda · ses örnekleri ücretsiz','Voiceover comes with Basic and Pro · voice samples are free');R.sesHak.hidden=false;return}
  R.sesHak.textContent=T('Bu ay: '+ana+'/'+s.limit+' seslendirme hakkı'+(ek?' · Ek: '+ek:''),'This month: '+ana+'/'+s.limit+' voiceover credits'+(ek?' · Extra: '+ek:''));
  R.sesHak.hidden=false;
}
/* E2: değişiklikte kendiliğinden yeniden seslendirme — yalnız geçerli rid varsa (hak harcamaz); yoksa düğme + not */
function sesOto(neden){
  clearTimeout(SES.oto);SES.oto=0;
  if(!st||!VID||SES.durum!=='acik'||!st.ses.acik)return;
  if(!sesEksik().length){sesYaz();return}
  /* oturum yoksa otomatik ÜRETME: sesYaz düğmeyi "Seslendir (1 hak)" yapar ve notu yazar */
  if(!ridGecerli()){if(!R.sesNot.classList.contains('not-hata'))sesNot('');sesYaz();return}
  var bu=st;
  SES.oto=setTimeout(function(){SES.oto=0;if(st===bu&&st.ses.acik&&ridGecerli()&&!SES.iptal)sesOlustur()},neden==='metin'?1200:600);
}
/* kullanıcı jesti içinde önizleme ses bağlamını uyandır */
function sesCtx(){var c=M&&M.audioContext&&M.audioContext();if(c&&c.state!=='running'){try{c.resume()}catch(e){}}return c}
function sesNot(m,tur,giris){
  if(!R.sesNot)return;R.sesNot.textContent='';R.sesNot.className='not kr-ses-not'+(m&&tur?' not-'+tur:'');
  if(!m)return;R.sesNot.appendChild(el('span',null,m));
  if(giris){R.sesNot.appendChild(d.createTextNode(' '));var a=el('a',null,T('Giriş yap','Sign in'));a.href=girisYol();R.sesNot.appendChild(a)}
}
function sesIlerle(k,n){
  var y=n?Math.round(k/n*100):0;
  R.sesSay.textContent=T('Seslendiriliyor '+k+'/'+n+'…','Voicing '+k+'/'+n+'…');
  R.sesBar.setAttribute('aria-valuenow',String(y));R.sesBar.setAttribute('aria-valuetext',T(k+' / '+n+' sahne',k+' of '+n+' scenes'));R.sesBarIc.style.width=y+'%';
}
function sesOzet(){
  if(SES.durum==='kapali')return T('yakında','coming soon');
  if(!st.ses.acik)return T('kapalı (sessiz)','off (silent)');
  var v=sesBul(st.ses.id),n=sesSayi(),e=sesEksik().length;
  return v.ad+' · '+(SES.iptal?T('hazırlanıyor','creating'):!n?T('metin yok','no text'):e?T('ses yok','no audio'):T('hazır','ready'));
}
function sesYaz(){
  if(!R.sesAc||!st)return;
  var du=SES.durum,acik=du==='acik';
  if(R.sesGrup)R.sesGrup.hidden=!(acik||du==='kapali');
  if(du!=='bilinmiyor'&&!sesGecerli(st.ses.id))st.ses.id=sesVarsayilan();
  var ank=SES.liste.map(function(v){return v.id+(v.yerel?'+':'')}).join(',');
  if(R.sesSec.getAttribute('data-liste')!==ank){
    /* E3: dile göre gruplu liste; arayüz dili önce */
    R.sesSec.textContent='';R.sesSec.setAttribute('data-liste',ank);
    var gr={},sira=EN?['en','tr','de','es','fr','ar']:['tr','en','de','es','fr','ar'];
    SES.liste.forEach(function(v){var dl=sesDili(v);if(!gr[dl]){gr[dl]=el('optgroup');gr[dl].label=SES_GRUP[dl]||dl;if(sira.indexOf(dl)<0)sira.push(dl)}var o=el('option',null,sesAdi(v));o.value=v.id;gr[dl].appendChild(o)});
    sira.forEach(function(dl){if(gr[dl])R.sesSec.appendChild(gr[dl])});
  }
  R.sesSec.value=st.ses.id;
  sesHakYaz();
  if(R.sesDilNot){
    var sv=sesBul(st.ses.id),vd=sesDili(sv),md=EN?'en':'tr';
    /* F11: metnin dilini bilmiyoruz (arayüz dili ≠ metin dili); yalnız sesin dilini söyle */
    var dm=acik&&st.ses.acik&&vd!==md?T('Bu ses '+(SES_DIL[vd]||vd)+' konuşur; metnin dili farklıysa telaffuz bozulabilir.','This voice speaks '+(SES_DIL[vd]||vd)+'; if your text is in another language, pronunciation may suffer.'):'';
    if(R.sesDilNot.textContent!==dm)R.sesDilNot.textContent=dm;R.sesDilNot.hidden=!dm;
  }
  R.sesAc.disabled=!acik;R.sesAc.checked=acik&&!!st.ses.acik;
  R.sesAyar.hidden=!(acik&&st.ses.acik);
  var is=!!SES.iptal,n=sesSayi(),e=sesEksik().length;
  R.sesSec.disabled=is;pasif(R.sesDinle,is||!acik);
  if(R.sesHizli){R.sesHizli.hidden=!acik;pasif(R.sesHizli,is||!acik)}
  R.sesIl.hidden=!is;
  var ob=R.sesOlustur,sp=ob.querySelector('span'),rg=ridGecerli(),hb=sesHakBilgi();
  /* hak yoksa (ve oturum yoksa) düğme yerine hak bitti paneli */
  var bitti=!rg&&(SES.hakYok||(hb&&hb.kalan<=0));
  if(sp)sp.textContent=rg?T('Sesi güncelle','Update audio'):st.ses.yeniden?T('Yeniden seslendir (1 hak)','Voice again (1 credit)'):T('Seslendir (1 hak)','Voice it (1 credit)');
  ob.hidden=is||!e||bitti;pasif(ob,is||!e||bitti);
  if(R.sesKilit)R.sesKilit.hidden=ob.hidden;
  if(R.sesHakNot){R.sesHakNot.textContent=rg?T('Bu videonun seslendirme oturumu açık; değişiklikler hak harcamaz.','This video’s voiceover session is open; changes don’t use credits.'):T('1 hak kullanır','Uses 1 credit')+(hb?' · '+T('kalan '+hb.kalan,hb.kalan+' left'):'')}
  if(R.sesPanel){
    R.sesPanel.hidden=!(acik&&st.ses.acik&&bitti&&e&&!is);
    if(!R.sesPanel.hidden){
      var pl=(hb&&hb.plan)||SES.hakPlan||(S.hak&&S.hak().plan)||'';
      R.sesPro.hidden=pl==='pro'||pl==='enterprise';
      var plansiz=pl==='demo'||pl==='free';
      R.sesPro.textContent=plansiz?T('Basic ve Pro planlarda (Pro’da ayda 6)','On Basic and Pro (6 a month on Pro)'):T('Pro’ya geç (ayda 6)','Go Pro (6 a month)');
      /* F10: hiç hakkı olmayan planda "hakların bitti" + ek paket yanıltıcı; planı söyle, ek düğmesini gizle */
      if(R.sesPanelB)R.sesPanelB.textContent=plansiz?T('Seslendirme Basic ve Pro planlarda. Ses örneklerini dinlemek ücretsiz.','Voiceover comes with Basic and Pro. Listening to voice samples is free.'):T('Bu ayın seslendirme hakların bitti.','You’ve used this month’s voiceover credits.');
      if(R.sesEk)R.sesEk.hidden=plansiz;
      if(R.sesPanelIp)R.sesPanelIp.hidden=plansiz;
    }
  }
  if(du==='kapali'){if(R.sesNot.textContent!==T('Seslendirme yakında.','Voiceover coming soon.'))sesNot(T('Seslendirme yakında.','Voiceover coming soon.'))}
  else if(acik&&st.ses.acik&&!is&&!R.sesNot.classList.contains('not-hata')&&!R.sesNot.classList.contains('not-uyari')){
    var m=!n?T('Seslendirilecek metin yok; sahnelere metin yaz.','There’s no text to read; add text to your scenes.')
      :st.ses.geri&&e?(rg?T('Ses bu sekmede yok (kaydedilmez); oturum açık, hak harcamadan yeniden hazırlanıyor.','The audio isn’t in this tab (it isn’t saved); the session is open, so it’s being recreated without using a credit.'):T('Ses bu sekmede yok (kaydedilmez). Yeniden seslendirmek 1 hak kullanır.','The audio isn’t in this tab (it isn’t saved). Voicing it again uses 1 credit.'))
      :e&&bitti?''
      :e&&!rg?(st.ses.yeniden?T('Bu videonun seslendirme oturumu bitti; yeniden seslendirme 1 hak kullanır.','This video’s voiceover session has ended; voicing it again uses 1 credit.'):T('Seslendirmek için düğmeye bas — 1 hak kullanır.','Press to voice — uses 1 credit.'))
      :e?T(e+' sahnenin sesi güncel değil.',e===1?'1 scene’s audio is out of date.':e+' scenes’ audio is out of date.')
      :T('Sesli önizleme hazır — ▶ ile dinle. MP4 de sesli iner.','Voiced preview ready — press ▶ to listen. The MP4 includes it too.');
    if(R.sesNot.textContent!==m)sesNot(m,e?'':'ok');
  }
  if(R.oz_ses)R.oz_ses.textContent=sesOzet();
}
function sesHata(e,i){
  var k=e&&e.kod;
  if(k==='tts_kapali')return T('Seslendirme yakında.','Voiceover coming soon.');
  if(k==='not_ready')return T('Seslendirme şu an kullanılamıyor. Biraz sonra tekrar dene.','Voiceover isn’t available right now. Try again a little later.');
  if(k==='login_required')return T('Seslendirme için giriş yap.','Sign in to use voiceover.');
  if(k==='tts_limit')return e.scope==='user'?T('Bugünkü sahne sesi sınırına ulaştın; yarın yenilenir.','You’ve hit today’s scene-audio limit; it renews tomorrow.'):e.scope==='month'?T('Bu ayın toplam seslendirme kotası doldu.','This month’s total voiceover quota is used up.'):e.scope==='ornek'?T('Bugünkü ücretsiz ses örneği sınırına ulaştın; yarın yenilenir.','You’ve hit today’s free voice-sample limit; it renews tomorrow.'):e.scope==='user_month'?T('Bu ayki seslendirme karakter sınırına ulaştın.','You’ve reached this month’s voiceover character limit.'):e.scope==='ornek_global'?T('Ses örnekleri şu an çok yoğun. Biraz sonra tekrar dene.','Voice samples are very busy right now. Try again a little later.'):T('Seslendirme şu an çok yoğun. Biraz sonra tekrar dene.','Voiceover is very busy right now. Try again a little later.');
  if(k==='ses_hak_yok')return e.plan==='demo'||e.plan==='free'?T('Seslendirme Basic ve Pro planlarda.','Voiceover comes with Basic and Pro.'):T('Bu ayın seslendirme hakların bitti.','You’ve used this month’s voiceover credits.');
  if(k==='ses_oturum_bitti'||k==='rid_gecersiz')return T('Bu videonun seslendirme oturumu bitti; yeniden seslendirme 1 hak kullanır.','This video’s voiceover session has ended; voicing it again uses 1 credit.');
  if(k==='tts_hata'){var nd=e.neden;
    if(nd==='ses_yok')return T('Bu ses artık sunulmuyor, başka ses seç.','This voice is no longer offered; pick another one.');
    if(nd==='kredi')return T('Seslendirme servisi bu ay doldu; yöneticiye bildirildi.','The voiceover service is used up for this month; the admin has been notified.');
    if(nd==='anahtar')return T('Seslendirme yapılandırması hatalı (yönetici).','Voiceover is misconfigured (admin).');
    if(nd==='yogun')return T('Servis yoğun, birkaç saniye sonra tekrar dene.','The service is busy; try again in a few seconds.');
    return T('Ses alınamadı, tekrar dene.','Couldn’t get the audio; try again.');
  }
  if(k==='coz')return T('Ses çözülemedi (tarayıcı).','The audio couldn’t be decoded (browser).');
  if(k==='metin_uzun'||k==='too_large')return T((i!=null?tekil(i)+' metni':'Metin')+' seslendirme için çok uzun; kısalt.',(i!=null?tekil(i)+' text':'The text')+' is too long for voiceover; shorten it.');
  if(k==='metin_bos')return T((i!=null?tekil(i)+' için ':'')+'okunacak metin yok.','There’s no text to read'+(i!=null?' for '+tekil(i).toLowerCase():'')+'.');
  if(k==='ses_gecersiz')return T('Bu ses kullanılamıyor; başka bir ses seç.','This voice isn’t available; pick another one.');
  if(k==='ag'||k==='zaman')return T('Seslendirme sunucusuna ulaşılamadı. Bağlantını kontrol edip tekrar dene.','Couldn’t reach the voiceover service. Check your connection and try again.');
  return T('Ses oluşturulamadı. Tekrar dene.','Couldn’t create the audio. Try again.');
}
/* tek istek: mp3 → AudioBuffer; dış iptal + 30 sn zaman aşımı */
function ttsIste(govde,tk,dis){
  var ac=new AbortController(),zm=false,tm=setTimeout(function(){zm=true;ac.abort()},30000),bag=function(){ac.abort()};
  if(dis){if(dis.aborted)ac.abort();else dis.addEventListener('abort',bag)}
  var bit=function(){clearTimeout(tm);if(dis)dis.removeEventListener('abort',bag)};
  return fetch(API_T+'/gen/tts',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tk},body:JSON.stringify(govde),credentials:'omit',cache:'no-store',signal:ac.signal}).then(function(r){
    var ct=String(r.headers.get('content-type')||'');
    if(r.ok&&!/json/i.test(ct)){
      var rid=String(r.headers.get('x-ses-rid')||''),kh=r.headers.get('x-ses-kalan'),kl=kh!=null&&/^\d+$/.test(kh)?+kh:null;
      return r.arrayBuffer().then(function(ab){return {ab:ab,rid:RID_RE.test(rid)?rid:'',kalan:kl}});
    }
    return r.json().then(function(j){j=j||{};throw {kod:String(j.error||j.hata||'genel'),scope:j.scope,max:j.max,neden:j.neden,kalan:j.kalan,ek_paket:j.ek_paket,plan:j.plan,field:j.field}},function(e){if(e&&e.kod)throw e;throw {kod:'genel'}});
  },function(){throw {kod:dis&&dis.aborted?'iptal':zm?'zaman':'ag'}}).then(function(x){bit();if(!x||!x.ab||!x.ab.byteLength)throw {kod:'tts_hata'};return sesCoz(x.ab).then(function(b){return {b:b,rid:x.rid,kalan:x.kalan}})},function(e){bit();if(dis&&dis.aborted)throw {kod:'iptal'};throw e});
}
function sesCoz(ab){
  var c=M.audioContext&&M.audioContext();
  if(!c){var O=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!O)return Promise.reject({kod:'coz'});try{c=new O(1,1,44100)}catch(e){return Promise.reject({kod:'coz'})}}
  return new Promise(function(res,rej){
    var ok=function(b){if(b&&b.duration>0)res(b);else rej({kod:'coz'})},no=function(){rej({kod:'coz'})},p;
    try{p=c.decodeAudioData(ab,ok,no)}catch(e){no();return}
    if(p&&typeof p.then==='function')p.then(ok,no);
  });
}
function sesDur(){
  if(SES.iptal){try{SES.iptal.abort()}catch(e){}SES.iptal=null}
  if(SES.dinleKaynak){try{SES.dinleKaynak.stop()}catch(e){}SES.dinleKaynak=null}
  if(SES.dinle){try{SES.dinle.abort()}catch(e){}SES.dinle=null}
}
/* eksik sahne seslerini sırayla al; her biri gelince sahne süresi uzar ve önizleme güncellenir */
function sesOlustur(){
  if(!st||SES.iptal||SES.durum!=='acik'||!st.ses.acik)return;
  var tk=S.oturumJeton&&S.oturumJeton();
  if(!tk){sesNot(sesHata({kod:'login_required'}),'uyari',true);sesYaz();return}
  var is=sesEksik().map(function(i){var s=st.sahneler[i];return {s:s,m:sesMetni(s)}});
  if(!is.length){sesYaz();return}
  if(st.oynat&&st.oynat.playing){st.oynat.pause();oynatYaz()}
  clearTimeout(SES.oto);SES.oto=0;
  if(!ridGecerli()){st.ses.rid='';st.ses.ridSon=0}
  var ac=new AbortController(),bu=st,id=st.ses.id,n=is.length,k=0,uzun=[],ilkHata=null,denenen={};
  is.forEach(function(x){denenen[id+'|'+x.m]=1});
  SES.iptal=ac;sesNot('');sesIlerle(0,n);sesYaz();
  S.durum(T(n+' sahne seslendiriliyor…','Voicing '+n+(n===1?' scene…':' scenes…')));
  var z=Promise.resolve();
  is.forEach(function(x){z=z.then(function(){
    if(ac.signal.aborted||st!==bu)throw {kod:'iptal'};
    /* B·4: geçerli rid yoksa ilk istek yeni oturum açar (1 hak); sonrakiler aynı rid ile hak harcamaz */
    var yeni=!bu.ses.rid,gv={metin:x.m,ses:id};if(yeni)gv.yeni=true;else gv.rid=bu.ses.rid;
    return ttsIste(gv,tk,ac.signal).then(function(o){
      if(o.kalan!=null){sesKalanYaz(o.kalan);sesHakYaz()}
      if(yeni){
        if(!o.rid)throw {kod:'tts_hata'};
        bu.ses.rid=o.rid;bu.ses.ridSon=Date.now()+RID_OM;bu.ses.yeniden=false;SES.hakYok=false;kayitZamanla();
      }
      if(st!==bu)throw {kod:'iptal'};
      var b=o.b;
      SES.tampon[id+'|'+x.m]=b;SES.uretildi=true;k++;
      var i=st.sahneler.indexOf(x.s);
      if(i>=0&&sesMetni(x.s)===x.m){
        var hd=Math.min(15,Math.max(x.s.secs,Math.ceil((b.duration+0.4)*2)/2));
        if(b.duration+0.4>15.01)uzun.push(i);
        if(hd!==x.s.secs){x.s.secs=hd;var gi=R.liste&&R.liste.querySelector('#kr-'+MOD+'-sn-'+i);if(gi)gi.value=String(hd);var ks=R.kareler&&R.kareler[i]&&R.kareler[i].querySelector('.kr-kare-sn');if(ks)ks.textContent=sn(hd)}
      }
      sesIlerle(k,n);guncelle();
    },function(e){
      if(e&&e.kod==='iptal')throw e;
      var i=st===bu?st.sahneler.indexOf(x.s):-1;
      /* boş/uzun metin yalnız o sahneyi atlar; diğer hatalar döngüyü durdurur */
      if(e&&(e.kod==='metin_bos'||e.kod==='metin_uzun'||e.kod==='too_large')){if(!ilkHata)ilkHata={e:e,i:i<0?null:i};return}
      e.i=i<0?null:i;throw e;
    });
  })});
  z.then(function(){
    if(st!==bu)return;
    st.ses.geri=false;sesBuda();
    var m;
    if(ilkHata){m=sesHata(ilkHata.e,ilkHata.i);sesNot(m,'uyari')}
    else if(uzun.length){m=T(uzun.map(function(i){return tekil(i)}).join(', ')+' sesi 15 sn’yi aşıyor ve sonu kesilir; metni kısalt.',uzun.map(function(i){return tekil(i)}).join(', ')+' audio runs past 15 s and gets cut; shorten the text.');sesNot(m,'uyari')}
    else{m=T('Sesli önizleme hazır — ▶ ile dinle','Voiced preview ready — press ▶ to listen');sesNot('');S.toast(m)}
    S.durum(m);
    /* E4: başa sar, büyük düğme "Sesli oynat ▶" */
    if(st.oynat){try{st.oynat.pause();st.oynat.seek(0)}catch(x){}zamanda(0,st.toplam,true);if(R.buyuk)R.buyuk.setAttribute('data-yazi',T('Sesli oynat ▶','Play with sound ▶'));oynatYaz()}
  },function(e){
    if(st!==bu)return;
    if(e&&e.kod==='iptal'){if(!st.ses.acik)return;sesNot(T('Seslendirme iptal edildi; hazır olan sahnelerin sesi duruyor.','Voiceover cancelled; scenes already voiced keep their audio.'));S.durum(T('Seslendirme iptal edildi.','Voiceover cancelled.'));return}
    if(e&&e.kod==='tts_kapali'){SES.durum='kapali';st.ses.acik=false;sesNot(sesHata(e));guncelle();S.durum(sesHata(e));return}
    if(e&&e.kod==='ses_hak_yok'){SES.hakYok=true;if(e.plan)SES.hakPlan=String(e.plan);if(typeof e.kalan==='number')sesKalanYaz(e.kalan);sesNot('');S.durum(sesHata(e));return}
    if(e&&e.kod==='hak_onay_gerek'){bu.ses.rid='';bu.ses.ridSon=0;sesNot('');S.durum(T('Seslendirmek için düğmeye bas — 1 hak kullanır.','Press to voice — uses 1 credit.'));return}
    if(e&&(e.kod==='ses_oturum_bitti'||e.kod==='rid_gecersiz')){bu.ses.rid='';bu.ses.ridSon=0;bu.ses.yeniden=true;sesNot('');S.durum(sesHata(e));return}
    var m=sesHata(e,e&&e.i);sesNot(m,e&&e.kod==='login_required'?'uyari':'hata',e&&e.kod==='login_required');S.durum(m);
  }).then(function(){
    if(SES.iptal===ac)SES.iptal=null;
    if(st===bu){sesYaz();ozetYaz();kayitZamanla();
      /* üretim sürerken değişen metin/ses: bu turda denenmemiş eksik varsa (oturum açıkken) bir kez daha */
      if(st.ses.acik&&ridGecerli()&&sesEksik().some(function(i){return !denenen[st.ses.id+'|'+sesMetni(st.sahneler[i])]}))sesOto('metin');
    }
  });
}
/* "Dinle": seçili sesten kısa örnek (bellekte saklanır; ikinci basış durdurur) */
function sesDinle(){
  if(!st||SES.durum!=='acik')return;
  if(SES.dinleKaynak||SES.dinle){sesDur2();return}
  var c=sesCtx();if(!c){sesNot(sesHata({kod:'coz'}),'hata');return}
  var id=st.ses.id,v=sesBul(id),k='ornek|'+id;
  var cal=function(b){
    if(st&&st.oynat&&st.oynat.playing){st.oynat.pause();oynatYaz()}
    var src=c.createBufferSource();src.buffer=b;src.connect(c.destination);
    src.onended=function(){if(SES.dinleKaynak===src){SES.dinleKaynak=null;dinleYaz(false)}};
    SES.dinleKaynak=src;dinleYaz(true);try{src.start()}catch(e){SES.dinleKaynak=null;dinleYaz(false)}
  };
  if(SES.tampon[k]){cal(SES.tampon[k]);return}
  var tk=S.oturumJeton&&S.oturumJeton();
  if(!tk){sesNot(sesHata({kod:'login_required'}),'uyari',true);return}
  var ac=new AbortController();SES.dinle=ac;dinleYaz(true);
  /* B·4: örnek ücretsiz — metin gönderilmez, sunucu sabit örnek cümleyi okur */
  ttsIste({ornek:true,ses:id},tk,ac.signal).then(function(o){
    var b=o.b;
    if(SES.dinle!==ac)return;SES.dinle=null;SES.tampon[k]=b;if(st&&st.ses.id===id)cal(b);else dinleYaz(false);
  },function(e){
    if(SES.dinle!==ac)return;SES.dinle=null;dinleYaz(false);if(e&&e.kod==='iptal')return;
    if(e&&e.kod==='tts_kapali'){SES.durum='kapali';st.ses.acik=false;guncelle()}
    sesNot(sesHata(e),e&&e.kod==='login_required'?'uyari':'hata',e&&e.kod==='login_required');
  });
}
function sesDur2(){
  if(SES.dinleKaynak){var s=SES.dinleKaynak;SES.dinleKaynak=null;try{s.stop()}catch(e){}}
  if(SES.dinle){var a=SES.dinle;SES.dinle=null;try{a.abort()}catch(e){}}
  dinleYaz(false);
}
function dinleYaz(x){
  var q=R.sesHizli;if(q){q.textContent='';q.appendChild(ikon(x?'dur':'oynat',x?'':'ikon-dolu'));q.appendChild(el('span',null,x?T('Durdur','Stop'):T('Dinle','Listen')));q.setAttribute('aria-pressed',x?'true':'false')}
  var b=R.sesDinle;if(!b)return;b.textContent='';b.appendChild(ikon(x?'dur':'oynat',x?'':'ikon-dolu'));b.appendChild(el('span',null,x?T('Durdur','Stop'):T('Dinle (ücretsiz)','Listen (free)')));
  var e=x?T('Örneği durdur','Stop the sample'):T('Seçili sesten kısa örnek dinle','Play a short sample of the selected voice');b.setAttribute('aria-label',e);b.title=e;b.setAttribute('aria-pressed',x?'true':'false');
}

/* video: kompakt ses kartı — özet "Ses: <ses> · durum" + hızlı Dinle; ayrıntılar açılınca */
function sesKartKur(){
  var k=el('div','kr-ses-kart');k.hidden=true;
  k.appendChild(grup('ses',T('Ses','Voice'),sesKur(),false));
  var q=dugme('btn-hafif btn-kucuk kr-ses-hizli','oynat',T('Dinle','Listen'));q.title=T('Seçili sesten kısa örnek dinle (ücretsiz)','Play a short sample of the selected voice (free)');
  q.setAttribute('aria-pressed','false');q.hidden=true;R.sesHizli=q;
  q.addEventListener('click',function(){if(!pasifMi(q))sesDinle()});k.appendChild(q);
  return k;
}

/* ---- panel grupları ---- */
function grup(ad,baslik,ic,acik){
  var g=el('details','st-acilir kr-grup');g.setAttribute('data-grup',ad);if(acik)g.open=true;
  var s=el('summary');s.appendChild(ikon(ad));s.appendChild(el('span',null,baslik));
  var oz=el('span','st-ozet');R['oz_'+ad]=oz;s.appendChild(oz);g.appendChild(s);
  ic.classList.add('st-acilir-ic');g.appendChild(ic);
  return g;
}
function ozetYaz(){
  if(!R.oz_tasarim)return;
  R.oz_tasarim.textContent=adi(tplO(st.t.template))+' · '+st.t.aspect+' · '+adi(bul(M.palettes,paletId()));
  var mk=[];if(st.t.ad)mk.push(st.t.ad);if(marka.logo)mk.push(T('logo','logo'));if(marka.arka)mk.push(T('fotoğraf','photo'));
  R.oz_marka.textContent=mk.length?mk.join(' · '):T('ad, logo, fotoğraf','name, logo, photo');
  baslangiclar();
  R.oz_sahne.textContent=birim(st.sahneler.length)+(VID?' · '+sn(st.toplam):'');
  if(R.oz_ses)sesYaz();
  R.oz_aciklama.textContent=st.aciklama?(EN?st.aciklama.length+' chars':st.aciklama.length+' karakter'):T('boş','empty');
  var a=M.aspects[st.t.aspect];
  R.meta.textContent=birim(st.sahneler.length)+(VID?' · '+sn(st.toplam):'')+' · '+st.t.aspect+' · '+a[0]+'×'+a[1];
  if(R.hepsiB){var sp=R.hepsiB.querySelector('span');if(sp)sp.textContent=T('Tüm slaytları indir ('+st.sahneler.length+')','Download all slides ('+st.sahneler.length+')')}
  kaynakYaz();
  if(R.aktarBilgi)R.aktarBilgi.textContent=VID?T(a[0]+'×'+a[1]+' · '+sn(st.toplam)+' · kayıt videonun süresi kadar sürer',a[0]+'×'+a[1]+' · '+sn(st.toplam)+' · recording takes as long as the video'):T(a[0]+'×'+a[1]+' PNG · dosyalar sırayla iner',a[0]+'×'+a[1]+' PNG · files download one by one');
}
function guncelle(o){
  o=o||{};baslangiclar();senkron();
  if(o.yapi){seritKur();noktaKur()}
  if(st.oynat){if(st.oynOpts)st.oynOpts.loop=!sesVarMi();st.oynat.setProject(proje());zamanda(st.oynat.time,st.toplam,true)}else slaytCiz();
  ozetYaz();kucuklerZamanla();
  if(DG&&DG.dlg.open)degisZamanla();
  if(o.tercih)tercihYaz();
  kayitZamanla();
}

/* Tasarım */
function secim(ad,deger,secili,icerik,etiket){
  var k=el('div','kr-sec');var id='kr-'+MOD+'-'+ad+'-'+String(deger).replace(/[^a-z0-9]/gi,'');
  var i=el('input');i.type='radio';i.name='kr-'+MOD+'-'+ad;i.value=deger;i.id=id;i.checked=!!secili;
  var l=el('label');l.htmlFor=id;icerik.forEach(function(x){l.appendChild(x)});
  if(etiket)i.setAttribute('aria-label',etiket);
  k.appendChild(i);k.appendChild(l);return {k:k,i:i,l:l};
}
function alanGrubu(baslik,cls){var f=el('fieldset','kr-alan '+(cls||''));f.appendChild(el('legend','st-etiket',baslik));return f}
function tasarimKur(){
  var ic=el('div');R.sablonCv=[];
  var f1=alanGrubu(T('Şablon','Template'),'kr-sablonlar');var g1=el('div','kr-sablon-izgara');
  M.templates.forEach(function(tp){
    var cv=el('canvas');cv.setAttribute('aria-hidden','true');R.sablonCv.push({id:tp.id,cv:cv});
    var x=secim('sablon',tp.id,tp.id===st.t.template,[cv,el('span','kr-sec-ad',adi(tp))]);
    x.i.addEventListener('change',function(){if(!x.i.checked)return;st.t.template=tp.id;paletRadyoYaz();guncelle({tercih:true});S.durum(T('Şablon: ','Template: ')+adi(tp))});
    g1.appendChild(x.k);
  });
  f1.appendChild(g1);ic.appendChild(f1);

  var f2=alanGrubu(T('Oran','Aspect ratio'),'kr-oranlar');var g2=el('div','kr-oran-izgara');
  var ipucu={'9:16':T('Reels · Hikâye','Reels · Story'),'1:1':T('Kare','Square'),'4:5':T('Akış','Feed'),'16:9':T('Yatay','Landscape')};
  ['9:16','1:1','4:5','16:9'].forEach(function(a){
    if(!M.aspects[a])return;
    var sek=el('span','kr-oran-sekil');sek.setAttribute('aria-hidden','true');sek.style.setProperty('--kr-oran',String(oranSayi(a)));
    var met=el('span','kr-oran-yazi');met.appendChild(el('b',null,a));met.appendChild(el('small',null,ipucu[a]));
    var x=secim('oran',a,a===st.t.aspect,[sek,met]);
    x.i.addEventListener('change',function(){if(!x.i.checked)return;oranSec(a);S.durum(T('Oran: ','Aspect ratio: ')+a)});
    g2.appendChild(x.k);
  });
  f2.appendChild(g2);
  R.kirpNot=el('p','ipucu kr-kirp-not',VID?T('Oran değişti; fotoğraflar yeni orana göre kırpılır. Gerekirse “Medyayı değiştir”den düzelt.','Aspect ratio changed; photos are cropped to fit. Fix any with “Swap media” if needed.'):T('Oran değişti; fotoğraflar yeni orana göre kırpılır. Gerekirse karttan değiştir.','Aspect ratio changed; photos are cropped to fit. Swap one from its card if needed.'));
  R.kirpNot.hidden=true;f2.appendChild(R.kirpNot);ic.appendChild(f2);

  var f3=alanGrubu(T('Renk paleti','Colour palette'),'kr-paletler');var g3=el('div','kr-palet-izgara');R.paletRadyo=[];
  M.palettes.forEach(function(p){
    var sw=el('span','kr-renk');sw.setAttribute('aria-hidden','true');sw.style.setProperty('--p-bg',p.bg);sw.style.setProperty('--p-fg',p.fg);sw.style.setProperty('--p-ac',p.accent);
    sw.appendChild(el('span','kr-renk-ac'));sw.appendChild(el('span','kr-renk-fg'));
    var x=secim('palet',p.id,false,[sw,el('span','kr-sec-ad',adi(p))]);
    x.i.addEventListener('change',function(){if(!x.i.checked)return;st.t.palette=p.id;st.t.paletSecildi=true;sifirYaz();guncelle({tercih:true});S.durum(T('Palet: ','Palette: ')+adi(p))});
    R.paletRadyo.push(x.i);g3.appendChild(x.k);
  });
  f3.appendChild(g3);
  var vk=el('div','kr-vurgu');
  var vid='kr-'+MOD+'-vurgu',vi=el('input','kr-vurgu-g');vi.type='color';vi.id=vid;
  var vl=el('label','kr-vurgu-l',T('Kendi vurgu rengin','Your own accent colour'));vl.htmlFor=vid;
  vi.value=st.t.vurgu||(bul(M.palettes,paletId())||{}).accent||'#8a63f2';
  vi.addEventListener('input',function(){st.t.vurgu=vi.value.toLowerCase();sifirYaz();guncelle()});
  vi.addEventListener('change',function(){tercihYaz();S.durum(T('Vurgu rengi değişti.','Accent colour changed.'))});
  R.vurgu=vi;vk.appendChild(vi);vk.appendChild(vl);
  var sf=dugme('btn-hafif btn-kucuk kr-sifir','tekrar',T('Sıfırla','Reset'),T('Renkleri şablona döndür','Reset colours to the template'));
  sf.addEventListener('click',function(){st.t.vurgu='';st.t.paletSecildi=false;st.t.palette='';paletRadyoYaz();sifirYaz();guncelle({tercih:true});S.durum(T('Renkler şablona döndü.','Colours reset to the template.'));vi.focus()});
  R.sifir=sf;vk.appendChild(sf);
  f3.appendChild(vk);ic.appendChild(f3);
  paletRadyoYaz();sifirYaz();
  return ic;
}
function paletRadyoYaz(){var id=paletId();(R.paletRadyo||[]).forEach(function(i){i.checked=i.value===id});if(R.vurgu&&!st.t.vurgu)R.vurgu.value=(bul(M.palettes,id)||{}).accent||'#8a63f2'}
function sifirYaz(){if(R.sifir)R.sifir.hidden=!(st.t.vurgu||st.t.paletSecildi)}

/* ---- C1·7 oran seçimi: tasarım paneli ve formdaki #oran-secim çipleri aynı yoldan geçer ---- */
var ORANLAR=['9:16','1:1','4:5','16:9'],OC=$('#oran-secim');
function oranSec(a){
  if(ORANLAR.indexOf(a)<0)return;
  if(st&&M&&M.aspects[a]){
    if(st.t.aspect!==a){
      st.t.aspect=a;oranYaz();if(st.oynat)st.oynat.resize();
      var r=kok.querySelector('input[name="kr-'+MOD+'-oran"][value="'+a+'"]');if(r&&!r.checked)r.checked=true;
      guncelle({tercih:true});kirpNot();
    }
  }else{
    var tr=tercihOku();tr.aspect=a;try{S.depo(TK,JSON.stringify(tr))}catch(e){}
  }
  oranCipYaz(a);
}
function oranCipYaz(a){
  if(R&&R.oranSel&&R.oranSel.value!==a)R.oranSel.value=a;
  if(!OC)return;
  OC.querySelectorAll('input[name="kr_oran"]').forEach(function(i){i.checked=i.value===a});
  if(S.brif)S.brif();
}
function kirpNot(){
  if(!R.kirpNot||!st)return;
  R.kirpNot.hidden=!st.sahneler.some(function(s){return s.gorsel||s.bekleyen});
}
if(OC&&VID){
  oranCipYaz(ORANLAR.indexOf(tercihOku().aspect)>=0?tercihOku().aspect:'9:16');
  OC.addEventListener('change',function(e){var i=e.target;if(i&&i.name==='kr_oran'&&i.checked)oranSec(i.value)});
}

/* ---- C1·2/3 medya kaydı: kurgu değişince 1,5 sn sonra taslağın medyası kaydedilir.
   S.medyaKaydet (kabuk, POST /app/drafts/:id/media; 404/ağ hatasında yerel yedek) varsa o; yoksa yalnız yerel yedek:
   studyo-medya-<id> + studyo-son-<kind>.media. Şema W'nin sınırlarına göre: ≤12 foto (yalnız Pexels), ≤30 sahne, metin ≤2000, ~7 KB altı. */
var KAYIT_T=null,KIND=VID?'video':'carousel',MB_HEDEF=7000;
function kayitZamanla(){
  if(!st||st.geri)return;
  clearTimeout(KAYIT_T);KAYIT_T=setTimeout(kayitYap,1500);
}
function taslakNo(){
  var x=S.medya&&S.medya.taslakId;if(x==null)return '';x=String(x);
  return /^[A-Za-z0-9_-]{1,40}$/.test(x)?x:'';
}
function kayitYap(){
  KAYIT_T=null;if(!st)return;
  var id=taslakNo();if(!id)return;
  var m=medyaAl();if(!m)return;
  if(typeof S.medyaKaydet==='function'){try{S.medyaKaydet(id,m);sonMedyaYaz(id,m);return}catch(e){}}
  yerelKaydet(id,m);
}
function yerelKaydet(id,m){
  try{S.depo('studyo-medya-'+id,JSON.stringify(m))}catch(e){}
  sonMedyaYaz(id,m);
}
/* yenilemede sonUygula studyo-son-<kind>.media'yı okur: kurgu değişince o kaydı da güncelle */
function sonMedyaYaz(id,m){
  if(typeof S.sonGuncelle==='function'){try{S.sonGuncelle();return}catch(e){}}
  try{
    var r=JSON.parse(S.depo('studyo-son-'+KIND)||'null');
    if(r&&typeof r==='object'&&r.r&&Array.isArray(r.r.draft_ids)&&String(r.r.draft_ids[0])===id){r.media=m;S.depo('studyo-son-'+KIND,JSON.stringify(r))}
  }catch(e){}
}
window.addEventListener('pagehide',function(){
  if(!KAYIT_T)return;clearTimeout(KAYIT_T);KAYIT_T=null;
  var id=taslakNo(),m=id&&st?medyaAl():null;if(!m)return;
  yerelKaydet(id,m);
  if(typeof S.medyaKaydet==='function'){try{S.medyaKaydet(id,m,{hemen:true})}catch(e){}}
});
function kirp(x,n){x=String(x==null?'':x);return x.length>n?x.slice(0,n):x}
function pxSrc(u){return typeof u==='string'&&u.indexOf('https://images.pexels.com/')===0&&u.length<=600}
function pxSayfa(u){return typeof u==='string'&&(u.indexOf('https://www.pexels.com/')===0||u.indexOf('https://pexels.com/')===0)&&u.length<=600}
/* C2: Videolu klip yalnız videos.pexels.com (worker W2 mediaIn ile aynı sınır) */
function pxVid(u){return typeof u==='string'&&u.indexOf('https://videos.pexels.com/')===0&&u.length<=600&&!/[\s"'<>\\]/.test(u)}
function boyutB(o){var j=JSON.stringify(o);try{return new TextEncoder().encode(j).length}catch(e){return j.length*3}}
function medyaAl(){
  if(!st)return null;
  var foto=[],ids={},vid=[],vids={};
  var sah=st.sahneler.slice(0,30).map(function(s){
    var o={text:kirp(s.text,2000),sub:kirp(s.sub,2000),secs:VID?s.secs:0},g=s.gorsel||s.bekleyen,v=s.video&&s.video.hazir?s.video:s.vbekleyen;
    if(VID&&s.q)o.q=s.q;
    if(v&&pxVid(v.src)){
      var vk=String(v.id!=null?v.id:v.src);
      if(vids[vk]==null&&vid.length<12){
        var kv='v'+(vid.length+1);vids[vk]=kv;
        var y={k:kv,id:v.id!=null?v.id:'',src:v.src,w:+v.w||0,h:+v.h||0,dur:Math.round((+v.dur||0)*10)/10,user:kirp(v.user,120),url:pxSayfa(v.url)?v.url:PX+'/'};
        if(pxSrc(v.poster))y.poster=v.poster;
        if(pxSayfa(v.user_url))y.user_url=v.user_url;
        vid.push(y);
      }
      if(vids[vk]!=null)o.video=vids[vk];
    }
    if(g&&pxSrc(g.src)){
      var key=String(g.id!=null?g.id:g.src);
      if(ids[key]==null&&foto.length<12){
        var k='p'+(foto.length+1);ids[key]=k;
        var f={k:k,id:g.id!=null?g.id:'',src:g.src,w:+g.w||0,h:+g.h||0,alt:kirp(g.alt,300),photographer:kirp(g.photographer,120),url:pxSayfa(g.url)?g.url:PX+'/'};
        if(pxSayfa(g.photographer_url))f.photographer_url=g.photographer_url;
        foto.push(f);
      }
      if(ids[key]!=null)o.foto=ids[key];
    }
    return o;
  });
  var m={template:st.t.template,aspect:st.t.aspect,palette:paletId(),vurgu:st.t.vurgu||'',brand:{name:kirp(st.t.ad,60),handle:kirp(st.t.kulp,40)},
    caption:kirp(st.aciklama,2000),scenes:sah,photos:foto};
  /* C2: üç seçenek (yok | stok | video); videolar yalnız klip varsa yazılır (eski kayıt şeması aynı kalır) */
  if(GS)m.mode=gTercih();
  if(vid.length)m.videos=vid;
  if(marka.logo||marka.arka)m.yerel={logo:!!marka.logo,arka:!!marka.arka};
  /* F2: yalnız tercih (açık mı, hangi ses); ses verisi asla kayda girmez */
  if(VID&&st.ses&&(st.ses.acik||st.ses.id!==sesVarsayilan()||ridGecerli())){m.ses={acik:!!st.ses.acik,id:st.ses.id};if(ridGecerli()){m.ses.rid=st.ses.rid;m.ses.ridSon=st.ses.ridSon}}
  /* küçültme sırası: alt → açıklama → alt yazılar → sondaki sahneler */
  if(boyutB(m)>MB_HEDEF)foto.forEach(function(f){delete f.alt});
  if(boyutB(m)>MB_HEDEF){var fz=boyutB(m)-MB_HEDEF;m.caption=m.caption.slice(0,Math.max(0,m.caption.length-fz))}
  for(var i=sah.length-1;i>=0&&boyutB(m)>MB_HEDEF;i--)sah[i].sub='';
  /* sahne atınca artık kullanılmayan fotoğraf da düşer; ölçüm her adımda süzülmüş hâlde yapılır */
  function fotoSuz(){
    var kul={};sah.forEach(function(x){if(x.foto)kul[x.foto]=1;if(x.video)kul[x.video]=1});m.photos=foto.filter(function(f){return kul[f.k]});
    if(vid.length){m.videos=vid.filter(function(f){return kul[f.k]});if(!m.videos.length)delete m.videos}
  }
  fotoSuz();
  while(sah.length>1&&boyutB(m)>MB_HEDEF){sah.pop();fotoSuz()}
  return m;
}

/* ---- C1·3 geri yükleme: kabuk (B) cfg.sonVer(media) → S.medya.sonVer; taslak önce goster(…,{geri:true}) ile kurulmuş olur ---- */
var sonDet=null;
function sonVer(m){
  if(!m||typeof m!=='object'||Array.isArray(m)||!sonDet||!window.SmcMotor)return;
  var dr={};var t0=sonDet.draft||{};for(var k in t0)if(Object.prototype.hasOwnProperty.call(t0,k))dr[k]=t0[k];
  if(Array.isArray(m.scenes)&&m.scenes.length)dr.scenes=m.scenes.slice(0,MAXS).map(function(x){x=x||{};var o={text:String(x.text||''),sub:String(x.sub||''),secs:Number(x.secs)||0},q=qOk(x.q);if(q)o.q=q;return o});
  /* açıklama yalnız boyut sınırında kırpıldıysa (taslağın başı + kayıt sınıra yakın) taslaktaki tam metin kalır; kullanıcı kısalttıysa kayıttaki geçer */
  if(typeof m.caption==='string'){var dc=String(dr.caption||'');if(!(dc.length>m.caption.length&&dc.indexOf(m.caption)===0&&boyutB(m)>MB_HEDEF-400))dr.caption=m.caption}
  var det2={kind:sonDet.kind,mod:sonDet.mod,draft:dr,body:sonDet.body,lang:sonDet.lang,marka:sonDet.marka,geri:true,medya:m};
  try{kur(det2)}catch(e){if(window.console&&console.warn)console.warn('kurgu geri',e&&e.message);return}
  sonDet=det2;st.geri=true;senkron();st.geri=false;
  var ph={};(Array.isArray(m.photos)?m.photos:[]).forEach(function(f){if(f&&typeof f.k==='string'&&pxSrc(f.src))ph[f.k]=f});
  var bu=st;
  (Array.isArray(m.scenes)?m.scenes:[]).forEach(function(x,i){
    var f=x&&ph[x.foto],s=st.sahneler[i];if(!f||!s)return;
    var ham={id:f.id,photographer:String(f.photographer||''),photographer_url:pxSayfa(f.photographer_url)?f.photographer_url:'',url:pxSayfa(f.url)?f.url:PX,alt:String(f.alt||''),src:f.src,w:+f.w||0,h:+f.h||0};
    s.bekleyen=ham;s.elle=true;
    var im=new Image();im.crossOrigin='anonymous';
    im.onload=function(){
      if(st!==bu||s.gorsel||s.bekleyen!==ham||st.sahneler.indexOf(s)<0)return;
      var th=ham.src;try{var u=new URL(ham.src);th=u.origin+u.pathname+'?auto=compress&cs=tinysrgb&h=350'}catch(e){}
      s.gorsel={img:im,id:ham.id,photographer:ham.photographer,photographer_url:ham.photographer_url,url:ham.url,alt:ham.alt,thumb:th,src:ham.src,w:ham.w,h:ham.h};
      s.bekleyen=null;gorselYenile(st.sahneler.indexOf(s));
      st.geri=true;guncelle();st.geri=false;
    };
    im.src=ham.src;
  });
  /* C2: kayıtlı klipler yeniden açılır (hak harcanmaz); yüklenmeyen klip sahnede yoksa fotoğrafı kalır */
  var vh={};(Array.isArray(m.videos)?m.videos:[]).forEach(function(f){if(f&&typeof f.k==='string'&&pxVid(f.src))vh[f.k]=f});
  (Array.isArray(m.scenes)?m.scenes:[]).forEach(function(x,i){
    var f=x&&vh[x.video],s=st.sahneler[i];if(!f||!s)return;
    var ham={id:f.id,src:f.src,poster:pxSrc(f.poster)?f.poster:'',w:+f.w||0,h:+f.h||0,dur:+f.dur||0,user:String(f.user||''),user_url:pxSayfa(f.user_url)?f.user_url:'',url:pxSayfa(f.url)?f.url:PX};
    s.vbekleyen=ham;s.elle=true;
    vidAc(ham.src,function(ve){
      if(st!==bu||s.vbekleyen!==ham||st.sahneler.indexOf(s)<0){if(ve)vidBirak(ve);return}
      s.vbekleyen=null;if(!ve)return;
      vidKoy(s,ham,ve);st.geri=true;guncelle();st.geri=false;
    });
  });
  if(GS&&(m.mode==='video'||m.mode==='stok'||m.mode==='yok')&&(m.mode!=='video'||gVid)){try{S.depo(GTK,m.mode)}catch(e){}gSec(m.mode)}
  if(m.yerel&&typeof m.yerel==='object'&&((m.yerel.logo&&!marka.logo)||(m.yerel.arka&&!marka.arka)))
    otoNot('',T('Logo / arka plan fotoğrafı yalnız bu tarayıcıda tutuluyordu; Marka bölümünden yeniden ekle.','Your logo / background photo was only kept in this browser; add it again in the Brand section.'));
}
if(S.medya){S.medya.sonAl=function(){return st?medyaAl():null};S.medya.sonVer=sonVer}

/* Marka */
function markaKur(){
  var ic=el('div');
  var sat=el('div','kr-iki');
  sat.appendChild(metinAlani('ad',T('Marka adı','Brand name'),st.t.ad,60,T('Örn. Ayşe Seramik','e.g. Ayse Ceramics'),function(v){st.t.ad=v}));
  sat.appendChild(metinAlani('kulp',T('Hesap adı','Handle'),st.t.kulp,40,'@markan',function(v){st.t.kulp=v}));
  ic.appendChild(sat);
  ic.appendChild(yukleAlani('logo',T('Logo','Logo'),T('Logo yükle','Upload logo'),T('Köşede küçük görünür. Şeffaf PNG en iyisi.','Shown small in the corner. A transparent PNG works best.')));
  ic.appendChild(yukleAlani('arka',T('Arka plan fotoğrafı','Background photo'),T('Fotoğraf yükle','Upload photo'),T('Metin okunsun diye üstüne koyu bir katman eklenir.','A dark layer is added on top so the text stays readable.')));
  ic.appendChild(el('p','ipucu',T('PNG, JPG ya da WebP, en fazla 5 MB. Dosyalar yalnız bu tarayıcıda kalır, sunucuya gönderilmez.','PNG, JPG or WebP, up to 5 MB. Files stay in this browser and are never uploaded.')));
  return ic;
}
function metinAlani(ad,etiket,deger,max,ph,yaz){
  var k=el('div','kr-girdi-k'),id='kr-'+MOD+'-'+ad;
  var l=el('label','st-etiket',etiket);l.htmlFor=id;k.appendChild(l);
  var i=el('input','st-girdi');i.type='text';i.id=id;i.maxLength=max;i.value=deger||'';i.placeholder=ph;i.autocomplete='off';i.spellcheck=false;
  var tz=0;i.addEventListener('input',function(){yaz(i.value.slice(0,max));clearTimeout(tz);tz=setTimeout(function(){guncelle({tercih:true})},120)});
  k.appendChild(i);return k;
}
function yukleAlani(tur,baslik,dugmeM,ipucuM){
  var k=el('div','kr-yukle'),id='kr-'+MOD+'-'+tur+'-dosya',hid=id+'-hata',iid=id+'-ipucu';
  k.appendChild(el('p','st-etiket kr-yukle-ad',baslik));
  var sat=el('div','kr-yukle-sat');
  var i=el('input','sr');i.type='file';i.id=id;i.accept='image/png,image/jpeg,image/webp';i.setAttribute('aria-describedby',iid+' '+hid);
  var l=el('label','btn btn-cizgi btn-kucuk kr-yukle-d');l.htmlFor=id;l.appendChild(ikon('yukle'));var ls=el('span',null,dugmeM);l.appendChild(ls);
  var on=el('div','kr-yukle-on');on.hidden=true;
  var img=el('img','kr-yukle-res');img.alt='';img.width=40;img.height=40;on.appendChild(img);
  var fad=el('span','kr-yukle-dosya');on.appendChild(fad);
  var kal=dugme('btn-hafif btn-kucuk','kapat',T('Kaldır','Remove'),T(baslik+' kaldır','Remove '+baslik.toLowerCase()));on.appendChild(kal);
  sat.appendChild(i);sat.appendChild(l);sat.appendChild(on);k.appendChild(sat);
  var ip=el('p','ipucu',ipucuM);ip.id=iid;k.appendChild(ip);
  var h=el('p','alan-hata');h.id=hid;h.setAttribute('role','alert');k.appendChild(h);
  function hata(m){h.textContent=m||'';if(m)i.setAttribute('aria-invalid','true');else i.removeAttribute('aria-invalid')}
  function yaz(){
    var var_=!!marka[tur];on.hidden=!var_;
    if(var_){img.src=marka[tur+'Url'];fad.textContent=marka[tur+'Ad'];ls.textContent=T('Değiştir','Replace')}else{img.removeAttribute('src');fad.textContent='';ls.textContent=dugmeM}
  }
  i.addEventListener('change',function(){
    var f=i.files&&i.files[0];i.value='';if(!f)return;hata('');
    if(TURLER.indexOf(f.type)<0){hata(T('Yalnız PNG, JPG ya da WebP yükleyebilirsin.','Only PNG, JPG or WebP files.'));return}
    if(f.size>MAXB){hata(T('Dosya 5 MB’tan büyük; daha küçük bir dosya seç.','The file is over 5 MB; pick a smaller one.'));return}
    var u=URL.createObjectURL(f),im=new Image();
    im.onload=function(){
      if(!(im.naturalWidth>0)){URL.revokeObjectURL(u);hata(T('Görsel açılamadı.','Couldn’t open the image.'));return}
      if(marka[tur+'Url'])URL.revokeObjectURL(marka[tur+'Url']);
      marka[tur]=im;marka[tur+'Url']=u;marka[tur+'Ad']=f.name.slice(0,60);yaz();guncelle();
      S.durum(T(baslik+' eklendi.',baslik+' added.'));
    };
    im.onerror=function(){URL.revokeObjectURL(u);hata(T('Görsel açılamadı; başka bir dosya dene.','Couldn’t open the image; try another file.'))};
    im.src=u;
  });
  kal.addEventListener('click',function(){
    if(marka[tur+'Url'])URL.revokeObjectURL(marka[tur+'Url']);
    marka[tur]=null;marka[tur+'Url']='';marka[tur+'Ad']='';hata('');yaz();guncelle();
    S.durum(T(baslik+' kaldırıldı.',baslik+' removed.'));i.focus();
  });
  yaz();
  return k;
}

/* Sahneler */
function sahnelerKur(){
  var ic=el('div');
  ic.appendChild(el('p','ipucu',T('*kelime* yazarsan o kelime vurgulanır. Ekran metni en fazla '+UZ_MET+', alt satır '+UZ_ALT+' karakter önerilir.','Write *word* to highlight it. Keep screen text under '+UZ_MET+' and the sub line under '+UZ_ALT+' characters.')));
  var ol=el('ol','kr-sahneler');R.liste=ol;ic.appendChild(ol);
  var ek=dugme('btn-cizgi btn-kucuk kr-ekle','ekle',VID?T('Sahne ekle','Add scene'):T('Slayt ekle','Add slide'));R.ekle=ek;
  ek.addEventListener('click',function(){
    if(pasifMi(ek))return;
    st.sahneler.push({text:'',sub:'',secs:VID?3:0});listeKur();guncelle({yapi:true});
    var n=st.sahneler.length-1;if(!VID)slaytGit(n);else sahneyeGit(n);
    var t=R.liste.querySelector('[data-i="'+n+'"] textarea');if(t)t.focus();
    S.durum(T(tekil(n)+' eklendi.',tekil(n)+' added.'));
  });
  ic.appendChild(ek);
  listeKur();
  return ic;
}
function sayacYaz(ta,say,max){var n=Array.from(ta.value).length;say.textContent=n+' / '+max;say.classList.toggle('sayac-uyari',n>max)}
function listeKur(){
  var ol=R.liste;ol.textContent='';var n=st.sahneler.length;
  st.sahneler.forEach(function(s,i){
    var li=el('li','kr-sahne-o');li.setAttribute('data-i',String(i));
    var ust=el('div',VID?'kr-so-ust':'kr-so-ust kr-so-ust-tek');
    ust.appendChild(el('span','kr-no',tekil(i)));
    if(VID){
      var sid='kr-'+MOD+'-sn-'+i,sk=el('span','kr-sn-k');var sl=el('label','kr-sn-l',T('Süre','Length'));sl.htmlFor=sid;
      var si=el('input','st-girdi kr-sn');si.type='number';si.id=sid;si.min='1.5';si.max='15';si.step='0.5';si.value=String(s.secs);si.inputMode='decimal';
      si.setAttribute('aria-describedby',sid+'-b');
      var sb=el('span','kr-sn-b',T('sn','s'));sb.id=sid+'-b';
      si.addEventListener('change',function(){var v=kis(si.value);s.secs=v;si.value=String(v);var ks=R.kareler&&R.kareler[i]&&R.kareler[i].querySelector('.kr-kare-sn');if(ks)ks.textContent=sn(v);guncelle()});
      sk.appendChild(sl);sk.appendChild(si);sk.appendChild(sb);ust.appendChild(sk);
    }
    var ar=el('div','kr-so-arac');
    var yu=dugme('btn-hafif kr-ikon-d','yukari',null,T(tekil(i)+' yukarı taşı','Move '+tekil(i).toLowerCase()+' up'));pasif(yu,i===0);
    var as=dugme('btn-hafif kr-ikon-d','asagi',null,T(tekil(i)+' aşağı taşı','Move '+tekil(i).toLowerCase()+' down'));pasif(as,i===n-1);
    var si2=dugme('btn-hafif kr-ikon-d kr-sil','sil',null,T(tekil(i)+' sil','Delete '+tekil(i).toLowerCase()));pasif(si2,n<=1);
    yu.addEventListener('click',function(){if(!pasifMi(yu))tasi(i,-1,'yukari')});
    as.addEventListener('click',function(){if(!pasifMi(as))tasi(i,1,'asagi')});
    si2.addEventListener('click',function(){if(!pasifMi(si2))sil(i)});
    ar.appendChild(yu);ar.appendChild(as);ar.appendChild(si2);ust.appendChild(ar);
    li.appendChild(ust);
    li.appendChild(yaziAlani(i,'m',T('Ekran metni','Screen text'),s.text,UZ_MET,160,2,function(v){s.text=v}));
    li.appendChild(yaziAlani(i,'a',T('Alt satır','Sub line'),s.sub,UZ_ALT,240,2,function(v){s.sub=v}));
    var gs=gorselSatir(s,i);if(gs)li.appendChild(gs);
    li.addEventListener('focusin',function(e){
      if(e.target.tagName==='BUTTON'||e.target.tagName==='A')return;
      if(VID){if(st.oynat&&sahneNo(st.oynat.time)!==i){st.oynat.pause();oynatYaz();sahneyeGit(i)}}
      else if(st.slayt!==i)slaytGit(i);
    });
    ol.appendChild(li);
  });
  pasif(R.ekle,n>=MAXS);
  if(R.ekle)R.ekle.title=n>=MAXS?T('En fazla '+MAXS,'Up to '+MAXS):'';
}
function yaziAlani(i,tur,etiket,deger,oneri,max,satir,yaz){
  var k=el('div','kr-yazi'),id='kr-'+MOD+'-'+tur+'-'+i;
  var bas=el('div','kr-yazi-ust');var l=el('label','kr-yazi-l',etiket);l.htmlFor=id;bas.appendChild(l);
  var say=el('span','sayac');say.id=id+'-say';bas.appendChild(say);k.appendChild(bas);
  var ta=el('textarea','st-girdi kr-ta');ta.id=id;ta.rows=satir;ta.maxLength=max;ta.value=deger||'';ta.setAttribute('aria-describedby',id+'-say');
  var tz=0;
  ta.addEventListener('input',function(){yaz(ta.value);sayacYaz(ta,say,oneri);
    if(tur==='m'&&R.kareler&&R.kareler[i])R.kareler[i].setAttribute('aria-label',tekil(i)+(ta.value?': '+ta.value.replace(/\*/g,'').slice(0,60):''));
    clearTimeout(tz);tz=setTimeout(function(){guncelle();if(VID&&st&&st.ses&&st.ses.acik)sesOto('metin')},60)});
  k.appendChild(ta);sayacYaz(ta,say,oneri);
  return k;
}
function tasi(i,y,odak){
  var j=i+y;if(j<0||j>=st.sahneler.length)return;
  var a=st.sahneler;var x=a[i];a[i]=a[j];a[j]=x;
  listeKur();guncelle({yapi:true});
  if(!VID)slaytGit(j);else sahneyeGit(j);
  var li=R.liste.querySelector('[data-i="'+j+'"]');
  var b=li&&li.querySelector(odak==='yukari'?'.kr-so-arac button:nth-child(1)':'.kr-so-arac button:nth-child(2)');
  if(b&&pasifMi(b))b=li.querySelector(odak==='yukari'?'.kr-so-arac button:nth-child(2)':'.kr-so-arac button:nth-child(1)');
  if(b)b.focus();
  S.durum(T(tekil(i)+' artık '+(j+1)+'. sırada.',tekil(i)+' is now number '+(j+1)+'.'));
}
function sil(i){
  if(st.sahneler.length<=1)return;
  var gs=st.sahneler.splice(i,1)[0];yerelBirak(gs);if(gs&&gs.video){vidBirak(gs.video.el);gs.video=null}
  if(!VID&&st.slayt>=st.sahneler.length)st.slayt=st.sahneler.length-1;
  listeKur();guncelle({yapi:true});
  var j=Math.min(i,st.sahneler.length-1);
  var t=R.liste.querySelector('[data-i="'+j+'"] textarea');if(t)t.focus({preventScroll:false});
  S.durum(T(tekil(i)+' silindi.',tekil(i)+' deleted.'));
}

/* ---- Pexels görselleri (isteğe bağlı; kullanıcı seçmeden hiçbir sahneye görsel eklenmez) ----
   A9b: Pexels yalnız Pro/Enterprise. Quota plan anon|basic dediyse ya da /gen/stock 403 plan döndüyse seçici açılmaz,
   satırda kilit durumu çıkar ("Pro'da var" + kısa açıklama + planlar bağlantısı). Plan bilinmiyorsa (eski worker) eski davranış.
   25.11: Demo/Basic'te ömür boyu 1 deneme görseli (kota stock_trial {limit,used}). Hak varken stock true gelir, seçici açılır;
   fotoğraf seçilince önce POST /gen/stock/use (S.stokKullan) — yalnız ok gelirse sahneye eklenir. Hak bitince kilit
   "Deneme görseli kullanıldı — Pro’da sınırsız" der. */
var PX='https://www.pexels.com',SK=null;
function stokVar(){return !!(S.D&&S.D.stock===true)}
function stokKilit(){var D=S.D||{};return !stokVar()&&(D.stokKilit===true||D.plan==='anon'||D.plan==='basic'||D.plan==='demo')}
/* deneme durumu: 'var' (kalan hak, seçici açık) · 'bitti' (hak kullanıldı) · '' (Pro/Enterprise/anon ya da eski worker) */
function denemeDurum(){var t=S.D&&S.D.stokDeneme;if(!t||!(t.limit>0))return '';return t.used>=t.limit?'bitti':stokVar()?'var':''}
function denemeKalan(){var t=S.D&&S.D.stokDeneme;return t?Math.max(0,t.limit-t.used):0}
var DENEME_BITTI=T('Deneme görseli kullanıldı — Pro’da sınırsız','Trial image used — unlimited on Pro');
function kilitSatir(i){
  var k=el('div','kr-so-gorsel kr-gorsel-kilit'),id='kr-kilit-'+MOD+'-'+i,bt=denemeDurum()==='bitti';
  var r=el('span','kr-pro-rozet');r.appendChild(ikon('kilit'));r.appendChild(el('span',null,T('Pro’da var','In Pro')));k.appendChild(r);
  var m=el('span','ipucu kr-gorsel-ipucu',bt?DENEME_BITTI+'.':T('Sahnelere Pexels fotoğrafı ekleme Pro ve Enterprise planlarında.','Adding Pexels photos to scenes comes with the Pro and Enterprise plans.'));m.id=id;k.appendChild(m);
  var a=el('a','kr-kilit-bag',T('Planları gör','See plans'));a.href=EN?'/en/pricing':'/fiyatlar';a.setAttribute('aria-describedby',id);k.appendChild(a);
  return k;
}
/* yalnız önizlemede görünen kaynak sayılır: klibi olan sahnenin fotoğrafı (klip öne geçer) atlanır */
function kaynakAdlari(){var a=[];st.sahneler.forEach(function(s){var n=!(s.video&&s.video.hazir)&&s.gorsel&&s.gorsel.photographer;if(n&&a.indexOf(n)<0)a.push(n)});return a}
function kaynakVidAdlari(){var a=[];st.sahneler.forEach(function(s){var n=s.video&&s.video.hazir&&(s.video.user||'Pexels');if(n&&a.indexOf(n)<0)a.push(n)});return a}
function kaynakMetni(){
  var a=kaynakAdlari(),v=kaynakVidAdlari(),p=[];
  if(a.length)p.push(EN?(a.length===1?'Photo by ':'Photos by ')+a.join(', ')+' on Pexels':(a.length===1?'Fotoğraf: ':'Fotoğraflar: ')+a.join(', ')+' (Pexels)');
  if(v.length)p.push(EN?(v.length===1?'Video by ':'Videos by ')+v.join(', ')+' on Pexels':(v.length===1?'Video: ':'Videolar: ')+v.join(', ')+' (Pexels)');
  return p.join(' · ');
}
function kaynakYaz(){if(!R.kaynak||!st)return;var m=kaynakMetni();R.kaynak.hidden=!m;R.kaynakMetin.textContent=m}
function dis(a,href,metin){a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=metin;return a}
function kunye(g){
  var p=el('p','kr-gorsel-kunye');
  if(EN){p.appendChild(d.createTextNode('Photo by '));p.appendChild(dis(el('a'),g.photographer_url||g.url||PX,g.photographer||'Pexels'));p.appendChild(d.createTextNode(' on '));p.appendChild(dis(el('a'),g.url||PX,'Pexels'))}
  else{p.appendChild(d.createTextNode('Fotoğraf: '));p.appendChild(dis(el('a'),g.photographer_url||g.url||PX,g.photographer||'Pexels'));p.appendChild(d.createTextNode(' / '));p.appendChild(dis(el('a'),g.url||PX,'Pexels'))}
  return p;
}
/* C2 klip künyesi: TR "Video: <x> / Pexels", EN "Video by <x> on Pexels"; ad videonun sahibine, Pexels videonun sayfasına */
function vidKunye(v){
  var p=el('p','kr-gorsel-kunye');
  if(EN){p.appendChild(d.createTextNode('Video by '));p.appendChild(dis(el('a'),v.user_url||v.url||PX,v.user||'Pexels'));p.appendChild(d.createTextNode(' on '));p.appendChild(dis(el('a'),v.url||PX,'Pexels'))}
  else{p.appendChild(d.createTextNode('Video: '));p.appendChild(dis(el('a'),v.user_url||v.url||PX,v.user||'Pexels'));p.appendChild(d.createTextNode(' / '));p.appendChild(dis(el('a'),v.url||PX,'Pexels'))}
  return p;
}
function videoSatir(s,i){
  var v=s.video,k=el('div','kr-so-gorsel kr-so-gorsel-var kr-so-video');
  if(v.poster){var im=el('img','kr-gorsel-kucuk');im.src=v.poster;im.alt='';im.width=44;im.height=44;im.decoding='async';k.appendChild(im)}
  else k.appendChild(ikon('oynat','ikon-dolu'));
  k.appendChild(vidKunye(v));
  var ar=el('div','kr-gorsel-arac');
  /* E5: elle değiştirme (seçici Video sekmesiyle açılır) ve aynı aramanın sıradaki klibi */
  if(stokVar()){
    var dg=dugme('btn-hafif kr-gorsel-degis','resim',T('Değiştir','Change'));dg.appendChild(el('span','sr',' · '+tekil(i)));dg.setAttribute('aria-haspopup','dialog');
    dg.addEventListener('click',function(){alakasizKapat();secici(i,dg,'video')});ar.appendChild(dg);
  }
  var o=st.oto;if(o&&o.videolar&&o.videolar.length>1&&S.stokDurum&&S.stokDurum()==='acik')ar.appendChild(baskaVideo(s,i));
  var kl=dugme('btn-hafif kr-gorsel-kaldir','kapat',T('Kaldır','Remove'));kl.appendChild(el('span','sr',' · '+tekil(i)));
  kl.addEventListener('click',function(){
    var x=st.sahneler[i];if(!x||!x.video)return;
    vidBirak(x.video.el);x.video=null;x.vbekleyen=null;x.elle=true;
    if(stokVar())gorselYenile(i,'.kr-gorsel-ekle,.kr-gorsel-kaldir');else gorselTumu(i);guncelle();
    S.durum(T(tekil(i)+' videosu kaldırıldı.',tekil(i)+' video removed.'));
  });
  ar.appendChild(kl);k.appendChild(ar);alakasizEkle(k,i);
  return k;
}
/* E5: "Alakasız mı?" notu — otomatik eklenen medyanın ilk sahnesinde bir kez; kapatınca (ya da Değiştir/Başka'ya basınca) bir daha çıkmaz */
var ALAKA_K='smc-alakasiz-not';
function alakasizGoruldu(){try{return localStorage.getItem(ALAKA_K)==='1'}catch(e){return false}}
function alakasizKapat(){try{localStorage.setItem(ALAKA_K,'1')}catch(e){}var n=R.liste&&R.liste.querySelector('.kr-alakasiz');if(n)n.remove()}
function alakasizEkle(k,i){
  if(!VID||!st||alakasizGoruldu())return;
  var ilk=-1;for(var j=0;j<st.sahneler.length;j++){var x=st.sahneler[j];if(x.oto&&(x.video||x.gorsel)){ilk=j;break}}
  if(ilk!==i)return;
  /* tek not: klipler sırasız yüklenir, daha önce başka satıra konmuş not kalmasın */
  var es=R.liste&&R.liste.querySelector('.kr-alakasiz');if(es)es.remove();
  var n=el('div','kr-alakasiz');n.appendChild(el('span',null,T('Alakasız mı? “Medya”ya bas, değiştir.','Not a fit? Press “Media” to swap it.')));
  var b=dugme('btn-hafif kr-ikon-d','kapat',null,T('Notu kapat','Dismiss note'));b.addEventListener('click',function(){var li=b.closest('li,[data-i]');alakasizKapat();var f=li&&li.querySelector('.kr-gorsel-degis');if(f)f.focus()});
  n.appendChild(b);k.insertBefore(n,k.firstChild);
}
/* kilit satırı tek: görselsiz ilk sahnede (deneme görseli 1. sahnedeyse 2. sahne neden eklenemediğini söyler) */
function ilkBos(){for(var k=0;k<st.sahneler.length;k++)if(!st.sahneler[k].gorsel)return k;return -1}
/* 25.11: deneme görseli kullanıldıysa kilit satırından sonraki görselsiz kartlarda/sahnelerde kısa not (bağlantı yalnız kilit satırında, tekrarlanmaz) */
function kisaKilit(){
  var k=el('div','kr-so-gorsel kr-gorsel-kisa');k.appendChild(ikon('kilit'));
  k.appendChild(el('span','ipucu',VID?T('Diğer sahnelere görsel Pro planda.','Images for other scenes on Pro.'):T('Diğer kartlara görsel Pro planda.','Images for other cards on Pro.')));
  return k;
}
function gorselSatir(s,i){
  if(VID)return medyaSatir(s,i);
  if(s.video&&s.video.hazir)return videoSatir(s,i);
  if(!s.gorsel&&stokKilit()){if(!GS||i===ilkBos())return kilitSatir(i);return denemeDurum()==='bitti'?kisaKilit():null}
  if(!s.gorsel&&!stokVar())return null;
  if(!s.gorsel&&gTercih()==='yok')return null;
  var k=el('div','kr-so-gorsel');
  if(!s.gorsel){
    var mv=vidSekmeVar();
    var b=dugme('btn-cizgi kr-gorsel-ekle','resim',mv?T('Medya ekle','Add media'):T('Görsel ekle','Add image'));
    b.appendChild(el('span','sr',T(' · '+tekil(i),' · '+tekil(i))));
    b.setAttribute('aria-haspopup','dialog');
    b.addEventListener('click',function(){secici(i,b)});
    k.appendChild(b);k.appendChild(el('span','ipucu kr-gorsel-ipucu',mv?T('İsteğe bağlı · Pexels video ve fotoğrafları','Optional · videos and photos from Pexels'):T('İsteğe bağlı · Pexels fotoğrafları','Optional · photos from Pexels')));
    return k;
  }
  var g=s.gorsel;k.classList.add('kr-so-gorsel-var');
  var im=el('img','kr-gorsel-kucuk');im.src=g.thumb;im.alt=g.alt||'';im.width=44;im.height=44;im.decoding='async';k.appendChild(im);
  k.appendChild(kunye(g));
  var ar=el('div','kr-gorsel-arac');
  var dg=dugme('btn-hafif kr-gorsel-degis','resim',T('Değiştir','Change'));dg.appendChild(el('span','sr',' · '+tekil(i)));dg.setAttribute('aria-haspopup','dialog');
  dg.addEventListener('click',function(){alakasizKapat();secici(i,dg,'foto')});
  var kl=dugme('btn-hafif kr-gorsel-kaldir','kapat',T('Kaldır','Remove'));kl.appendChild(el('span','sr',' · '+tekil(i)));
  kl.addEventListener('click',function(){
    yerelBirak(st.sahneler[i]);st.sahneler[i].gorsel=null;st.sahneler[i].bekleyen=null;st.sahneler[i].elle=true;if(stokVar())gorselYenile(i,'.kr-gorsel-ekle');else gorselTumu(i);guncelle();
    S.durum(T(tekil(i)+' görseli kaldırıldı.',tekil(i)+' image removed.'));
  });
  /* deneme görseli kullanıldıysa değiştirme yok (yeni fotoğraf yeni hak ister); kaldırma serbest */
  if(stokVar())ar.appendChild(dg);
  /* Pro: otomatik aramanın listesinden sıradaki fotoğraf (çağrı yok); deneme planında yok */
  var o=st.oto;if(o&&o.fotolar&&o.fotolar.length>1&&S.stokDurum&&S.stokDurum()==='acik')ar.appendChild(baskaDugme(s,i));
  ar.appendChild(kl);k.appendChild(ar);alakasizEkle(k,i);
  return k;
}
/* ---- 27.11: Medyayı değiştir penceresi (yalnız video) ----
   Sahne listesindeki satır içi medya düzenlemesinin yerini alır. Tam ekran <dialog> (mobilde tam boy sayfa): üstte sahne şeridi
   (küçük resim + no + kısa metin + ✓), ortada büyük önizleme (yalnız M.drawSlide; oynatma yok), yanda seçenekler:
   stok ara (mevcut seçici, ön değer sahnenin anahtar kelimeleri) · kendi dosyan (yalnız bu sekmede) · görselsiz (renk) · beğendim.
   ←/→ ve Önceki/Sonraki sahne değiştirir; Esc, Kapat, Bitti ve tarayıcının Geri tuşu kapatır; odak açan düğmeye döner. */
var DG=null,DG_T=0,YEREL_N=0;
function medyaTur(s){return s.video&&s.video.hazir?'video':s.gorsel?(s.gorsel.yerel?'yerel':'foto'):(s.bekleyen||s.vbekleyen)?'bekle':'yok'}
function medyaAd(t){return t==='video'?T('Video','Video'):t==='foto'?T('Fotoğraf','Photo'):t==='yerel'?T('Kendi dosyan','Your file'):t==='bekle'?T('Yükleniyor…','Loading…'):T('Görselsiz · renk','No media · colour')}
function kisaMetin(z){var m=String(z.text||z.sub||'').replace(/\*/g,'').replace(/\s+/g,' ').trim();return m.length>42?m.slice(0,40)+'…':m}
function degisTamam(z){var t=medyaTur(z);return !!z.begen||t==='video'||t==='foto'||t==='yerel'}
/* bayat popstate koruması: studyo-kabuk.js'teki geriGit/geriYut ile aynı ortak sayaç (window.smcGeri) */
function geriGit(){window.smcGeri=(window.smcGeri|0)+1;history.back()}
function geriYut(e){if(e.smcYut===undefined){e.smcYut=(window.smcGeri|0)>0;if(e.smcYut)window.smcGeri--}return e.smcYut}
function yerelBirak(s){if(s&&s.gorsel&&s.gorsel.yerel){try{URL.revokeObjectURL(s.gorsel.src)}catch(e){}}}
/* sahne listesinde tek satır: küçük resim (ya da renk) + tür + künye + "Medya" (pencereyi o sahnede açar) */
function medyaSatir(s,i){
  var t=medyaTur(s),k=el('div','kr-so-gorsel kr-so-medya'+(t==='yok'||t==='bekle'?'':' kr-so-gorsel-var'));k.setAttribute('data-tur',t);
  var u=t==='video'?s.video.poster:(t==='foto'||t==='yerel')?s.gorsel.thumb:'';
  if(u){var im=el('img','kr-gorsel-kucuk');im.src=u;im.alt='';im.width=44;im.height=44;im.decoding='async';k.appendChild(im)}
  else{var sw=el('span','kr-medya-renk');sw.setAttribute('aria-hidden','true');if(t==='video')sw.appendChild(ikon('video'));k.appendChild(sw)}
  var bl=el('div','kr-medya-bilgi');bl.appendChild(el('span','kr-medya-tur',medyaAd(t)));
  if(t==='video')bl.appendChild(vidKunye(s.video));else if(t==='foto')bl.appendChild(kunye(s.gorsel));
  k.appendChild(bl);
  var b=dugme('btn-hafif kr-gorsel-degis','resim',T('Medya','Media'));b.appendChild(el('span','sr',' · '+tekil(i)));b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls','kr-degis');
  b.addEventListener('click',function(){alakasizKapat();degisAc(i,b)});k.appendChild(b);
  alakasizEkle(k,i);
  return k;
}
function degisKur(){
  if(DG)return DG;
  var x={},dlg=el('dialog','kr-degis');dlg.id='kr-degis';dlg.setAttribute('aria-labelledby','kr-degis-h');dlg.setAttribute('aria-describedby','kr-degis-ipucu');
  var ic=el('div','kr-degis-ic');dlg.appendChild(ic);
  var bas=el('div','kr-degis-bas');
  var h=el('h2','kr-degis-h',T('Medyayı değiştir','Swap media'));h.id='kr-degis-h';h.tabIndex=-1;bas.appendChild(h);
  x.say=el('span','kr-degis-say');bas.appendChild(x.say);
  x.bitti=dugme('btn-ana kr-degis-bitti',null,T('Bitti','Done'));bas.appendChild(x.bitti);
  var kp=dugme('btn-hafif kr-ikon-d kr-degis-kapat','kapat',null,T('Kapat','Close'));bas.appendChild(kp);ic.appendChild(bas);
  x.serit=el('ol','kr-degis-serit');x.serit.setAttribute('aria-label',T('Sahneler','Scenes'));ic.appendChild(x.serit);
  var gv=el('div','kr-degis-govde');
  x.sahne=el('div','kr-degis-sahne');x.cv=el('canvas','kr-degis-cv');x.cv.setAttribute('role','img');x.sahne.appendChild(x.cv);gv.appendChild(x.sahne);
  var yan=el('div','kr-degis-yan');
  x.no=el('h3','kr-degis-no');yan.appendChild(x.no);
  x.metin=el('p','kr-degis-metin');yan.appendChild(x.metin);
  x.bilgi=el('div','kr-degis-bilgi');yan.appendChild(x.bilgi);
  var sh=el('p','kr-degis-sec-h',T('Bu sahne için','For this scene'));sh.id='kr-degis-sec-h';yan.appendChild(sh);
  x.sec=el('div','kr-degis-sec');x.sec.setAttribute('role','group');x.sec.setAttribute('aria-labelledby','kr-degis-sec-h');yan.appendChild(x.sec);
  x.hata=el('p','alan-hata kr-degis-hata');x.hata.setAttribute('role','alert');yan.appendChild(x.hata);
  yan.appendChild(el('p','ipucu kr-degis-not',T('Yüklediğin dosya yalnız bu sekmede kalır (kaydedilmez); PNG, JPG ya da WebP, en fazla 5 MB.','Your upload stays in this tab only (not saved); PNG, JPG or WebP, up to 5 MB.')));
  gv.appendChild(yan);ic.appendChild(gv);
  var alt=el('div','kr-degis-alt');
  x.onc=dugme('btn-cizgi kr-degis-onc','geri',T('Önceki','Previous'));alt.appendChild(x.onc);
  var ip=el('p','ipucu kr-degis-ipucu',T('← → ile sahneler arasında geç · Esc kapatır','Use ← → to move between scenes · Esc closes'));ip.id='kr-degis-ipucu';alt.appendChild(ip);
  x.snr=dugme('btn-cizgi kr-degis-snr',null,T('Sonraki','Next'));x.snr.appendChild(ikon('ileri'));alt.appendChild(x.snr);ic.appendChild(alt);
  x.durum=el('p','sr');x.durum.setAttribute('role','status');ic.appendChild(x.durum);
  x.dosya=el('input','sr kr-degis-dosya');x.dosya.type='file';x.dosya.accept=TURLER.join(',');x.dosya.tabIndex=-1;x.dosya.setAttribute('aria-hidden','true');ic.appendChild(x.dosya);
  d.body.appendChild(dlg);
  x.dlg=dlg;x.h=h;x.i=0;x.acan=null;x.hist=false;
  function kapandi(){
    clearTimeout(DG_T);d.documentElement.classList.remove('kr-degis-acik');
    if(x.hist){x.hist=false;try{if(history.state&&history.state.krDegis)geriGit()}catch(e){}}
    var o=x.acan;x.acan=null;if(x.sessiz){x.sessiz=false;return}
    if(!(o&&o.isConnected)){var li=R.liste&&R.liste.querySelector('[data-i="'+x.i+'"]');o=li&&li.querySelector('.kr-gorsel-degis')||R.degisB}
    if(o&&o.isConnected&&o.focus)o.focus();
  }
  x.kapandi=kapandi;
  dlg.addEventListener('close',kapandi);
  dlg.addEventListener('cancel',function(e){e.preventDefault();degisKapat()});
  kp.addEventListener('click',degisKapat);x.bitti.addEventListener('click',degisKapat);
  x.onc.addEventListener('click',function(){if(!pasifMi(x.onc))degisGit(x.i-1)});
  x.snr.addEventListener('click',function(){if(!pasifMi(x.snr))degisGit(x.i+1)});
  dlg.addEventListener('keydown',function(e){
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();degisKapat();return}
    var a=d.activeElement;
    if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))){
      var sr=a&&a.classList&&a.classList.contains('kr-degis-kare');e.preventDefault();
      degisGit(x.i+(e.key==='ArrowRight'?1:-1));
      if(sr){var nb=x.serit.querySelector('[data-dg="k'+x.i+'"]');if(nb)nb.focus()}
      return;
    }
    if(e.key!=='Tab')return;
    var o=Array.prototype.filter.call(dlg.querySelectorAll('button,input:not([tabindex="-1"]),a[href],[tabindex]:not([tabindex="-1"])'),function(z){return !z.disabled&&z.getClientRects().length&&!z.closest('[hidden]')});
    if(!o.length)return;var ilk=o[0],son=o[o.length-1];
    if(e.shiftKey&&(a===ilk||a===h||!dlg.contains(a))){e.preventDefault();son.focus()}
    else if(!e.shiftKey&&(a===son||!dlg.contains(a))){e.preventDefault();ilk.focus()}
  });
  x.dosya.addEventListener('change',function(){
    var f=x.dosya.files&&x.dosya.files[0];x.dosya.value='';if(!f||!st)return;
    var i=x.i,s=st.sahneler[i];if(!s)return;degisHata('');
    if(TURLER.indexOf(f.type)<0){degisHata(T('Yalnız PNG, JPG ya da WebP yükleyebilirsin.','Only PNG, JPG or WebP files.'));return}
    if(f.size>MAXB){degisHata(T('Dosya 5 MB’tan büyük; daha küçük bir dosya seç.','The file is over 5 MB; pick a smaller one.'));return}
    var u=URL.createObjectURL(f),im=new Image();
    im.onload=function(){
      if(!(im.naturalWidth>0)){URL.revokeObjectURL(u);degisHata(T('Görsel açılamadı.','Couldn’t open the image.'));return}
      if(!st||st.sahneler[i]!==s){URL.revokeObjectURL(u);return}
      yerelBirak(s);if(s.video){vidBirak(s.video.el);s.video=null}
      s.gorsel={img:im,id:'yerel-'+(++YEREL_N),photographer:'',photographer_url:'',url:'',alt:'',thumb:u,src:u,w:im.naturalWidth,h:im.naturalHeight,yerel:true};
      s.bekleyen=null;s.vbekleyen=null;s.elle=true;s.oto=false;s.begen=true;
      gorselYenile(i);guncelle();degisYaz();
      degisDurum(T(tekil(i)+' için kendi dosyan eklendi; yalnız bu sekmede kalır.','Your file was added to '+tekil(i).toLowerCase()+'; it stays in this tab only.'));
    };
    im.onerror=function(){URL.revokeObjectURL(u);degisHata(T('Görsel açılamadı; başka bir dosya dene.','Couldn’t open the image; try another file.'))};
    im.src=u;
  });
  window.addEventListener('popstate',function(e){if(geriYut(e))return;if(x.hist&&dlg.open){x.hist=false;degisKapat()}});
  window.addEventListener('resize',function(){if(dlg.open)degisZamanla()});
  DG=x;return x;
}
function degisHata(m){if(DG)DG.hata.textContent=m||''}
function degisDurum(m){if(!DG)return;DG.durum.textContent='';var x=DG;setTimeout(function(){x.durum.textContent=m||''},30)}
function degisZamanla(){clearTimeout(DG_T);DG_T=setTimeout(degisYaz,60)}
function degisAc(i,tetik){
  if(!st||!M||!st.sahneler.length)return;var x=degisKur();
  if(st.oynat&&st.oynat.playing){st.oynat.pause();oynatYaz()}
  x.i=Math.max(0,Math.min(st.sahneler.length-1,i|0));x.acan=tetik||R.degisB;degisHata('');x.durum.textContent='';
  if(x.dlg.showModal){if(!x.dlg.open)x.dlg.showModal()}else x.dlg.setAttribute('open','');
  d.documentElement.classList.add('kr-degis-acik');
  if(!x.hist){try{history.pushState({krDegis:1},'');x.hist=true}catch(e){x.hist=false}}
  sahneyeGit(x.i);degisYaz();x.h.focus();
  requestAnimationFrame(function(){if(!x.dlg.open)return;degisYaz();var b=x.serit.querySelector('[aria-current]');if(b&&b.scrollIntoView){try{b.scrollIntoView({block:'nearest',inline:'center'})}catch(e){}}});
}
function degisKapat(){
  var x=DG;if(!x||!x.dlg.open)return;
  if(SK&&SK.dlg.open)SK.kapat();
  if(x.dlg.close)x.dlg.close();else{x.dlg.removeAttribute('open');x.kapandi()}
}
function degisGit(k){
  var x=DG;if(!x||!st)return;k=Math.max(0,Math.min(st.sahneler.length-1,k));
  if(k===x.i){degisYaz();return}
  x.i=k;degisHata('');sahneyeGit(k);degisYaz();
  var b=x.serit.querySelector('[data-dg="k'+k+'"]');if(b&&b.scrollIntoView){try{b.scrollIntoView({block:'nearest',inline:'center',behavior:AZ?'auto':'smooth'})}catch(e){}}
  var s=st.sahneler[k];degisDurum(tekil(k)+(s.text?': '+kisaMetin(s):'')+' · '+medyaAd(medyaTur(s)));
}
/* yeniden çizim: şerit, büyük önizleme, bilgi ve seçenekler; odak data-dg anahtarıyla aynı düğmeye geri konur */
function degisYaz(){
  var x=DG;clearTimeout(DG_T);if(!x||!x.dlg.open||!st||!M)return;
  var n=st.sahneler.length;if(!n){degisKapat();return}
  if(x.i>=n)x.i=n-1;var i=x.i,s=st.sahneler[i],t=medyaTur(s);
  var fo=d.activeElement,fk=fo&&x.dlg.contains(fo)?fo.getAttribute('data-dg'):null;
  var p=proje(),a=M.aspects[st.t.aspect]||M.aspects['9:16'],hz=0;
  x.serit.textContent='';x.serit.setAttribute('data-yon',a[0]>a[1]?'yatay':a[0]<a[1]?'dikey':'kare');
  st.sahneler.forEach(function(z,k){
    var ok=degisTamam(z);if(ok)hz++;
    var li=el('li'),b=el('button','kr-degis-kare');b.type='button';b.setAttribute('data-dg','k'+k);
    if(k===i)b.setAttribute('aria-current','step');
    var cv=el('canvas');cv.setAttribute('aria-hidden','true');boyut(cv,st.t.aspect,Math.round(64*a[0]/a[1]));try{M.drawSlide(cv.getContext('2d'),p,k)}catch(e){}b.appendChild(cv);
    var no=el('span','kr-degis-kno',String(k+1));no.setAttribute('aria-hidden','true');b.appendChild(no);
    var km=el('span','kr-degis-kmet',kisaMetin(z)||'—');km.setAttribute('aria-hidden','true');b.appendChild(km);
    if(ok){var tk=el('span','kr-degis-tik','✓');tk.setAttribute('aria-hidden','true');b.appendChild(tk)}
    b.setAttribute('aria-label',tekil(k)+(z.text?': '+kisaMetin(z):'')+' · '+medyaAd(medyaTur(z))+(ok?T(' · hazır',' · done'):''));
    b.addEventListener('click',function(){degisGit(k)});
    li.appendChild(b);x.serit.appendChild(li);
  });
  x.say.textContent=T(hz+'/'+n+' sahne hazır',hz+'/'+n+(n===1?' scene':' scenes')+' ready');
  /* büyük önizleme: kutuya sığan en büyük boy (yalnız çizim; oynatıcı ayrı) */
  var bw=x.sahne.clientWidth||320,bh=x.sahne.clientHeight||320,w=Math.max(96,Math.floor(Math.min(bw,bh*a[0]/a[1])));
  boyut(x.cv,st.t.aspect,w);x.cv.style.setProperty('--dg-w',w+'px');
  try{M.drawSlide(x.cv.getContext('2d'),p,i)}catch(e){}
  x.cv.setAttribute('aria-label',T(tekil(i)+' önizlemesi','Preview of '+tekil(i).toLowerCase())+(s.text?': '+kisaMetin(s):''));
  x.no.textContent=tekil(i)+' / '+n;
  x.metin.textContent=String(s.text||'').replace(/\*/g,'')||T('(Ekran metni boş)','(No screen text)');
  x.bilgi.textContent='';x.bilgi.appendChild(el('span','kr-medya-tur',medyaAd(t)));
  if(t==='video')x.bilgi.appendChild(vidKunye(s.video));else if(t==='foto')x.bilgi.appendChild(kunye(s.gorsel));
  /* seçenekler */
  /* Başka görsel/video yüklenirken düğme meşgul kalsın: aynı sahnede seçenekler yeniden kurulmaz */
  var mesgul=x.secI===i&&x.sec.querySelector('[aria-busy="true"]');x.secI=i;
  if(!mesgul){
  x.sec.textContent='';
  function ek(b,key){b.setAttribute('data-dg',key);x.sec.appendChild(b);return b}
  if(stokVar()){
    var sb=ek(dugme('btn-cizgi kr-degis-stok','arama',T('Stok ara','Search stock')),'stok');sb.setAttribute('aria-haspopup','dialog');
    var q=VID&&(s.q||ilk4(s.text)||ilk4(s.sub))||st.konu||'';
    if(q){var qs=el('span','kr-degis-q','“'+q+'”');sb.appendChild(qs)}
    sb.addEventListener('click',function(){secici(i,sb,t==='video'?'video':t==='foto'?'foto':undefined)});
    var o=st.oto,ac=S.stokDurum&&S.stokDurum()==='acik';
    if(t==='foto'&&ac&&o&&o.fotolar&&o.fotolar.length>1)ek(baskaDugme(s,i),'baska');
    if(t==='video'&&ac&&o&&o.videolar&&o.videolar.length>1)ek(baskaVideo(s,i),'baska');
  }else if(stokKilit()){var kl=kilitSatir(i);kl.classList.add('kr-degis-kilit');
    /* pencerede yükleme açık: kilit yalnız stok medyayı kapsar */
    var ki=kl.querySelector('.kr-gorsel-ipucu');if(ki)ki.textContent=denemeDurum()==='bitti'
      ?T('Deneme stok görseli kullanıldı — stok fotoğraf ve video Pro’da sınırsız. Kendi dosyanı yine yükleyebilirsin.','Trial stock image used — stock photos and videos are unlimited on Pro. You can still upload your own file.')
      :T('Stok fotoğraf ve video Pro ve Enterprise planlarında. Kendi dosyanı yine yükleyebilirsin.','Stock photos and videos come with the Pro and Enterprise plans. You can still upload your own file.');
    x.sec.appendChild(kl)}
  var yb=ek(dugme('btn-cizgi kr-degis-yukle','yukle',T('Kendi dosyamı yükle','Upload my own file')),'yukle');
  yb.addEventListener('click',function(){degisHata('');x.dosya.click()});
  var rb=ek(dugme('btn-cizgi kr-degis-renk','tasarim',T('Görselsiz (renk)','No media (colour)')),'renk');rb.setAttribute('aria-pressed',t==='yok'?'true':'false');
  rb.addEventListener('click',function(){
    if(!st||st.sahneler[i]!==s)return;
    yerelBirak(s);if(s.video){vidBirak(s.video.el);s.video=null}
    s.gorsel=null;s.bekleyen=null;s.vbekleyen=null;s.elle=true;s.oto=false;s.begen=true;
    gorselYenile(i);guncelle();degisYaz();
    degisDurum(T(tekil(i)+' görselsiz; tema rengi kullanılır.',tekil(i)+' has no media; the theme colour is used.'));
  });
  var gb=ek(dugme('btn-hafif kr-degis-begen',null,s.begen?T('Beğenildi ✓','Kept ✓'):T('Bu sahneyi beğendim','Keep this scene')),'begen');gb.setAttribute('aria-pressed',s.begen?'true':'false');
  gb.addEventListener('click',function(){
    if(!st||st.sahneler[i]!==s)return;s.begen=true;
    if(i<st.sahneler.length-1)degisGit(i+1);else{degisYaz();x.bitti.focus();degisDurum(T('Tüm sahneler gözden geçti. Bitti ile kapat.','All scenes reviewed. Press Done to close.'))}
  });
  }
  pasif(x.onc,i===0);pasif(x.snr,i>=n-1);
  if(fk){var z=x.dlg.querySelector('[data-dg="'+fk+'"]');if(z&&z!==d.activeElement)z.focus({preventScroll:true})}
}
/* seçiciden dönüşte odak: pencere açıksa pencerenin stok düğmesi, değilse sahne satırı */
function odakHedef(i){
  if(DG&&DG.dlg.open){degisYaz();return DG.sec.querySelector('[data-dg="stok"],.kr-kilit-bag')||DG.h}
  var li=R.liste&&R.liste.querySelector('[data-i="'+i+'"]');return li&&(li.querySelector('.kr-gorsel-degis')||li.querySelector('.kr-gorsel-kaldir'));
}
/* tüm görsel satırları; i verilirse odak o satırın eklemesine/kilit bağlantısına (yoksa metnine) */
function gorselTumu(i){
  if(!st||!R.liste)return;st.sahneler.forEach(function(s,k){gorselYenile(k)});if(i==null)return;
  var li=R.liste.querySelector('[data-i="'+i+'"]'),b=li&&(li.querySelector('.kr-gorsel-ekle,.kr-kilit-bag')||li.querySelector('textarea'));if(b)b.focus();
}
function gorselYenile(i,odak){
  var li=R.liste&&R.liste.querySelector('[data-i="'+i+'"]');if(!li)return;
  var es=li.querySelector('.kr-so-gorsel'),y=gorselSatir(st.sahneler[i],i);
  if(es&&y)li.replaceChild(y,es);else if(es)es.remove();else if(y)li.appendChild(y);
  if(odak&&y){var b=y.querySelector(odak);if(b)b.focus()}
  if(DG&&DG.dlg.open)degisZamanla();
}
/* arama kutusunun ön değeri: konu (yoksa başlık, yoksa slayt metni); vurgu yıldızları atılır, 100 karaktere sözcük sınırında kısaltılır */
function aramaMetni(v){
  var t=String(v||'').replace(/\*/g,'').replace(/\s+/g,' ').trim();if(t.length<=100)return t;
  t=t.slice(0,100);var b=t.lastIndexOf(' ');return(b>40?t.slice(0,b):t).replace(/[\s.,;:!?…\-–—]+$/,'');
}
/* giriş sayfası; bu modülün sayfalarından (görsel/video, TR/EN) ?r= ile geri dönülür (kabuktaki hesapYol ile aynı biçim) */
function girisYol(){var y=location.pathname.replace(/\.html$/,''),b=EN?'/en/hesap/login':'/hesap/giris';return /^\/(en\/)?(video|gorsel|visual)$/.test(y)?b+'?r='+encodeURIComponent(y):b}
function stokYonu(){var a=st.t.aspect;return a==='16:9'?'landscape':a==='1:1'?'square':'portrait'}
function stokHata(e){
  var k=e&&e.kod;
  if(k==='not_ready')return T('Görsel arama şu an kullanılamıyor.','Image search isn’t available right now.');
  if(k==='login_required')return T('Görsel aramak için giriş yap.','Sign in to search images.');
  if(k==='plan')return e.trial_used?DENEME_BITTI+'.':T('Görsel arama Pro ve Enterprise planlarında var.','Image search comes with the Pro and Enterprise plans.');
  if(k==='limit'&&e.per==='hour')return T('Bu saatlik görsel arama sınırı doldu; biraz sonra tekrar dene.','This hour’s image search limit is reached; try again a little later.');
  if(k==='limit')return e.scope==='global'?T('Görsel arama bugün çok yoğun. Biraz sonra tekrar dene.','Image search is very busy today. Try again a little later.'):T('Bugünkü görsel arama hakkın doldu; yarın yenilenir.','You’ve used today’s image searches; they renew tomorrow.');
  if(k==='bad_input')return T('Aramayı 1 ile 100 karakter arasında yaz.','Keep the search between 1 and 100 characters.');
  return T('Görseller yüklenemedi. Bağlantını kontrol edip tekrar dene.','Couldn’t load images. Check your connection and try again.');
}
function seciciKur(){
  if(SK)return SK;
  var x={},dlg=el('dialog','kr-stok-dlg');dlg.id='kr-stok';dlg.setAttribute('aria-labelledby','kr-stok-h');dlg.setAttribute('aria-describedby','kr-stok-hedef');
  var ic=el('div','dlg kr-stok');dlg.appendChild(ic);
  var bas=el('div','dlg-bas');var h=el('h2',null,T('Görsel seç','Choose an image'));h.id='kr-stok-h';h.tabIndex=-1;bas.appendChild(h);
  var kp=dugme('btn-hafif kr-ikon-d kr-stok-kapat','kapat',null,T('Kapat','Close'));bas.appendChild(kp);ic.appendChild(bas);
  x.hedef=el('p','ipucu kr-stok-hedef');x.hedef.id='kr-stok-hedef';ic.appendChild(x.hedef);
  /* 25.11: Demo/Basic deneme başlığı; secici() her açılışta doldurur/gizler */
  x.deneme=el('div','kr-stok-deneme');x.deneme.hidden=true;x.denemeB=el('p','kr-stok-deneme-b');x.deneme.appendChild(x.denemeB);
  x.deneme.appendChild(el('p','ipucu',T('Seçtiğin fotoğraf bu hakkı kullanır; Pro’da sınırsız.','The photo you pick uses it; unlimited on Pro.')));ic.appendChild(x.deneme);
  /* E5: Video / Fotoğraf sekmesi (yalnız video sayfasında, Pro) */
  x.sekme=el('div','kr-stok-sekme');x.sekme.setAttribute('role','group');x.sekme.setAttribute('aria-label',T('Medya türü','Media type'));x.sekme.hidden=true;
  x.sV=el('button',null,T('Video','Video'));x.sV.type='button';x.sF=el('button',null,T('Fotoğraf','Photo'));x.sF.type='button';
  x.sekme.appendChild(x.sV);x.sekme.appendChild(x.sF);ic.appendChild(x.sekme);x.tur='foto';x.qEn='';
  x.sV.addEventListener('click',function(){if(x.tur!=='video'){turSec('video');ara(1)}});
  x.sF.addEventListener('click',function(){if(x.tur!=='foto'){turSec('foto');ara(1)}});
  var f=el('form','kr-stok-ara');f.setAttribute('role','search');f.setAttribute('data-sk-noform','');f.noValidate=true;
  var l=el('label','sr',T('Görsel ara','Search images'));l.htmlFor='kr-stok-q';f.appendChild(l);
  var q=el('input','st-girdi kr-stok-q');q.type='search';q.id='kr-stok-q';q.maxLength=100;q.autocomplete='off';q.spellcheck=false;q.placeholder=T('Örn. kahve, ofis, deniz','e.g. coffee, office, sea');f.appendChild(q);
  var ab=dugme('btn-cizgi kr-stok-arab','arama',T('Ara','Search'));ab.type='submit';f.appendChild(ab);ic.appendChild(f);
  x.durum=el('p','sr');x.durum.setAttribute('role','status');ic.appendChild(x.durum);
  x.govde=el('div','kr-stok-govde');ic.appendChild(x.govde);
  x.izgara=el('div','kr-stok-izgara');x.izgara.setAttribute('role','group');x.izgara.setAttribute('aria-label',T('Arama sonuçları','Search results'));x.govde.appendChild(x.izgara);
  x.bos=el('div','kr-stok-bos');x.bos.hidden=true;x.govde.appendChild(x.bos);
  x.hata=el('div','not not-hata kr-stok-hata');x.hata.hidden=true;
  x.hataM=el('span');x.hata.appendChild(x.hataM);
  x.tekrar=dugme('btn-cizgi','tekrar',T('Tekrar dene','Try again'));x.hata.appendChild(x.tekrar);
  /* oturum düştüyse (401 login_required) tekrar yerine giriş bağlantısı; giriş sonrası bu sayfaya döner */
  x.giris=el('a','btn-cizgi',T('Giriş yap','Sign in'));x.giris.hidden=true;x.hata.appendChild(x.giris);x.govde.appendChild(x.hata);
  x.daha=dugme('btn-cizgi kr-stok-daha',null,T('Daha fazla göster','Show more'));x.daha.hidden=true;ic.appendChild(x.daha);
  var alt=el('div','kr-stok-alt');
  x.vazgec=dugme('btn-hafif kr-stok-vazgec',null,T('Görselsiz devam','Continue without an image'));alt.appendChild(x.vazgec);
  var pk=el('p','kr-stok-pexels');x.pkM=el('span',null,T('Fotoğraflar ','Photos provided by '));pk.appendChild(x.pkM);pk.appendChild(dis(el('a'),PX,'Pexels'));if(!EN)pk.appendChild(d.createTextNode(' sağlıyor'));
  alt.appendChild(pk);ic.appendChild(alt);
  d.body.appendChild(dlg);
  x.dlg=dlg;x.h=h;x.q=q;x.f=f;x.ac=null;x.sira=0;x.sonuc=[];x.sayfa=1;x.sonraki=false;x.onbellek={};x.i=0;x.acan=null;x.odak=null;
  function kapat(){if(dlg.close){if(dlg.open)dlg.close()}else{dlg.removeAttribute('open');kapandi()}}
  function kapandi(){
    if(x.ac){try{x.ac.abort()}catch(e){}x.ac=null}x.sira++;if(x.harciyor&&x.harciyor.yukle)x.harciyor=null;
    var o=x.odak||x.acan;x.odak=null;x.acan=null;if(o&&o.isConnected&&o.focus)o.focus();
  }
  x.kapat=kapat;
  kp.addEventListener('click',kapat);
  x.vazgec.addEventListener('click',function(){var sx=st&&st.sahneler[x.i],yok=!(sx&&(sx.gorsel||sx.video&&sx.video.hazir));kapat();if(yok)S.durum(T('Görsel eklenmedi; sahne görselsiz kalır.','No image added; the scene stays without one.'))});
  dlg.addEventListener('close',kapandi);
  /* 27.11: Esc seçiciyi kapatmıyordu (eski koşul yalnız dialog desteklemeyen tarayıcıda çalışıyordu); cancel de aynı yoldan */
  dlg.addEventListener('cancel',function(e){e.preventDefault();kapat()});
  dlg.addEventListener('keydown',function(e){
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();kapat();return}
    if(e.key!=='Tab')return;
    var o=Array.prototype.filter.call(dlg.querySelectorAll('button,input,a[href],[tabindex]:not([tabindex="-1"])'),function(z){return !z.disabled&&z.getClientRects().length&&!z.closest('[hidden]')});
    if(!o.length)return;var ilk=o[0],son=o[o.length-1],a=d.activeElement;
    if(e.shiftKey&&(a===ilk||a===h||!dlg.contains(a))){e.preventDefault();son.focus()}
    else if(!e.shiftKey&&(a===son||!dlg.contains(a))){e.preventDefault();ilk.focus()}
  });
  dlg.addEventListener('click',function(e){if(e.target===dlg)kapat()});
  f.addEventListener('submit',function(e){e.preventDefault();ara(1)});
  x.tekrar.addEventListener('click',function(){ara(x.sayfa>1&&x.sonuc.length?x.sayfa:1)});
  x.daha.addEventListener('click',function(){ara(x.sayfa+1)});
  /* ızgarada oklar: dolaşan tabindex; satır uzunluğu ekrandaki yerleşimden okunur */
  x.izgara.addEventListener('keydown',function(e){
    var b=Array.prototype.slice.call(x.izgara.querySelectorAll('.kr-stok-foto')),n=b.indexOf(d.activeElement);if(n<0)return;
    var sut=1;while(sut<b.length&&b[sut].offsetTop===b[0].offsetTop)sut++;
    var y={ArrowRight:1,ArrowLeft:-1,ArrowDown:sut,ArrowUp:-sut}[e.key],j=n;
    if(y!=null)j=Math.max(0,Math.min(b.length-1,n+y));else if(e.key==='Home')j=0;else if(e.key==='End')j=b.length-1;else return;
    e.preventDefault();odakla(b,j);
  });
  SK=x;return x;
}
function vidSekmeVar(){return !!(VID&&typeof S.stok==='function'&&stokVar()&&denemeDurum()!=='var')}
function turSec(t){
  var x=SK;x.tur=t==='video'?'video':'foto';var v=x.tur==='video';
  x.sV.setAttribute('aria-pressed',v?'true':'false');x.sF.setAttribute('aria-pressed',v?'false':'true');
  x.h.textContent=v?T('Video seç','Choose a video'):T('Görsel seç','Choose an image');
  x.pkM.textContent=v?T('Videolar ','Videos provided by '):T('Fotoğraflar ','Photos provided by ');
  if(x.ac){try{x.ac.abort()}catch(e){}x.ac=null}x.sira++;
  x.izgara.textContent='';x.sonuc=[];x.sayfa=1;x.daha.hidden=true;seciciDurum('');
}
function sure(n){n=Math.round(+n||0);return Math.floor(n/60)+':'+('0'+n%60).slice(-2)}
function odakla(b,j){b.forEach(function(z,k){z.tabIndex=k===j?0:-1});if(b[j])b[j].focus()}
function seciciDurum(tur,m){
  var x=SK;x.hata.hidden=tur!=='hata';x.bos.hidden=tur!=='bos';
  var gir=tur==='hata'&&/giriş yap|Sign in/.test(m);x.giris.hidden=!gir;if(gir)x.giris.href=girisYol();
  if(tur==='hata'){x.hataM.textContent=m;x.tekrar.hidden=/kullanılamıyor|isn’t available|hakkın doldu|renew tomorrow|giriş yap|Sign in/.test(m)}
  if(tur==='bos'){x.bos.textContent='';x.bos.appendChild(el('p','kr-stok-bos-b',m));x.bos.appendChild(el('p','ipucu',T('Daha genel bir kelime dene: “kahve” yerine “kafe”, “toplantı” yerine “ofis” gibi.','Try a broader word, like “cafe” instead of “latte” or “office” instead of “meeting”.')))}
}
function iskelet(){
  var x=SK;x.izgara.textContent='';x.izgara.setAttribute('aria-busy','true');x.izgara.setAttribute('data-yon',stokYonu());
  for(var k=0;k<6;k++){var z=el('span','isk kr-stok-isk');z.setAttribute('aria-hidden','true');x.izgara.appendChild(z)}
}
function ara(sayfa){
  var x=SK,qq=x.q.value.trim();
  if(!qq){x.q.focus();seciciDurum('bos',T('Aramak için bir kelime yaz.','Type a word to search.'));x.izgara.textContent='';x.daha.hidden=true;return}
  var vid=x.tur==='video',lg=x.qEn&&qq===x.qEn?'en':(EN?'en':'tr');
  var yon=stokYonu(),an=(vid?'v|':'')+qq.toLocaleLowerCase(EN?'en':'tr')+'|'+yon+'|'+sayfa+'|'+lg;
  if(x.ac){try{x.ac.abort()}catch(e){}}
  var sira=++x.sira,ac=window.AbortController?new AbortController():null;x.ac=ac;
  seciciDurum('');x.daha.hidden=true;
  if(sayfa===1){x.sonuc=[];iskelet()}else{pasif(x.daha,true);x.daha.hidden=false;x.daha.setAttribute('aria-busy','true')}
  x.durum.textContent=vid?T('Videolar yükleniyor…','Loading videos…'):T('Görseller yükleniyor…','Loading images…');
  var pr=x.onbellek[an]?Promise.resolve(x.onbellek[an]):S.stok((vid?'type=video&':'')+'q='+encodeURIComponent(qq)+'&orientation='+yon+'&page='+sayfa+'&lang='+lg,ac);
  pr.then(function(r){
    if(sira!==x.sira)return;x.ac=null;x.onbellek[an]=r;
    var ph=vid?(Array.isArray(r.videos)?r.videos.filter(vidGecerli):[]):Array.isArray(r.photos)?r.photos:[],ilkYeni=x.sonuc.length;
    x.sonuc=x.sonuc.concat(ph);x.sayfa=sayfa;x.sonraki=!!r.next&&sayfa<100;
    izgaraYaz(ilkYeni,sayfa>1);
    x.daha.hidden=!x.sonraki;pasif(x.daha,false);x.daha.removeAttribute('aria-busy');
    if(!x.sonuc.length){seciciDurum('bos',vid?T('“'+qq+'” için video bulunamadı.','No videos found for “'+qq+'”.'):T('“'+qq+'” için fotoğraf bulunamadı.','No photos found for “'+qq+'”.'));x.durum.textContent=T('Sonuç yok.','No results.')}
    else x.durum.textContent=EN?x.sonuc.length+(vid?' videos':' photos')+' shown. Use the arrow keys to move between them.':x.sonuc.length+(vid?' video':' fotoğraf')+' gösteriliyor. Aralarında oklarla gezinebilirsin.';
  },function(e){
    if(sira!==x.sira)return;x.ac=null;
    if(e&&e.kod==='not_ready'){S.D.stock=false;stokYayin()}
    if(e&&e.kod==='plan'){planKilidi(e);return}
    x.izgara.removeAttribute('aria-busy');if(sayfa===1)x.izgara.textContent='';
    x.daha.hidden=!(sayfa>1&&x.sonraki);pasif(x.daha,false);x.daha.removeAttribute('aria-busy');
    var m=stokHata(e);seciciDurum('hata',m);x.durum.textContent=m;
  });
}
/* 403 plan (arama ya da deneme harcama): seçici kapanır, satırlar kilide döner, odak o satırın planlar bağlantısına gider.
   25.11: trial_used → deneme bitti sayılır, kilit "Deneme görseli kullanıldı — Pro’da sınırsız" der */
function planKilidi(e){
  var x=SK;S.D.stock=false;S.D.stokKilit=true;
  if(e&&e.trial_used){var t=S.D.stokDeneme;if(!t||!(t.used>=t.limit))S.D.stokDeneme={limit:t&&t.limit>0?t.limit:1,used:t&&t.limit>0?t.limit:1}}
  x.odak=null;stokYayin();
  if(DG&&DG.dlg.open)x.odak=odakHedef(x.i);else{var li=R.liste&&R.liste.querySelector('[data-i="'+x.i+'"]');x.odak=li&&li.querySelector('.kr-kilit-bag')||R.liste&&R.liste.querySelector('.kr-kilit-bag')}
  var m=stokHata(e);x.kapat();S.durum(m);if(e&&e.trial_used)S.toast(m);
}
/* deneme hakkı harcanamadıysa (ağ, zaman aşımı, oturum, sunucu): görsel eklenmez, seçici açık kalır */
function kullanHata(e){
  var k=e&&e.kod;
  if(k==='login_required')return T('Görsel eklemek için giriş yap.','Sign in to add an image.');
  if(k==='not_ready')return T('Görsel ekleme şu an kullanılamıyor; görsel eklenmedi.','Adding images isn’t available right now; no image was added.');
  if(k==='zaman'||k==='ag')return T('Bağlantı kurulamadı; görsel eklenmedi. Bağlantını kontrol edip tekrar seç.','Couldn’t connect; no image was added. Check your connection and pick again.');
  return T('Deneme görseli şu an eklenemedi; görsel eklenmedi. Biraz sonra tekrar seç.','The trial image couldn’t be added right now; no image was added. Pick again in a moment.');
}
function izgaraYaz(ilkYeni,ekle){
  var x=SK;x.izgara.removeAttribute('aria-busy');if(!ekle)x.izgara.textContent='';
  x.izgara.setAttribute('data-yon',stokYonu());
  x.sonuc.slice(ilkYeni).forEach(function(p,k){
    var j=ilkYeni+k,b=el('button','kr-stok-foto');b.type='button';b.tabIndex=-1;
    if(x.tur==='video'){
      var vu=String(p.user||'Pexels'),du=+(p.duration||p.dur)||0;
      b.setAttribute('aria-label',T('Video · '+sure(du)+' · '+vu,'Video · '+sure(du)+' · by '+vu));
      var vi=el('img');vi.alt='';vi.loading='lazy';vi.decoding='async';if(pxSrc(p.poster))vi.src=p.poster;b.appendChild(vi);
      if(du>0){var sr=el('span','kr-stok-sure',sure(du));sr.setAttribute('aria-hidden','true');b.appendChild(sr)}
      b.appendChild(el('span','kr-stok-ad',vu));
      b.addEventListener('click',function(){vidSec(p,b)});
      x.izgara.appendChild(b);return;
    }
    var ad=String(p.photographer||'Pexels'),alt=String(p.alt||'').trim();
    b.setAttribute('aria-label',(alt||T('Fotoğraf','Photo'))+T(' · Fotoğraf: '+ad,' · Photo by '+ad));
    var im=el('img');im.alt='';im.loading='lazy';im.decoding='async';im.src=(p.src&&(p.src.medium||p.src.large))||'';b.appendChild(im);
    b.appendChild(el('span','kr-stok-ad',ad));
    b.addEventListener('click',function(){sec(p,b)});
    x.izgara.appendChild(b);void j;
  });
  var bt=Array.prototype.slice.call(x.izgara.querySelectorAll('.kr-stok-foto'));
  var akt=bt.filter(function(z){return z.tabIndex===0})[0];
  if(!akt&&bt.length)bt[0].tabIndex=0;
  if(ekle&&bt[ilkYeni])odakla(bt,ilkYeni);
}
function sec(p,b){
  var x=SK,i=x.i,s=st&&st.sahneler[i];if(!s||b.getAttribute('aria-busy')==='true')return;
  /* deneme seçimi sürüyor (fotoğraf yükleniyor ya da /use bekleniyor): ikinci seçim yok sayılır */
  if(x.harciyor||OTO&&OTO.harciyor){x.durum.textContent=T('Deneme görseli ekleniyor; bitince başka fotoğraf seçebilirsin.','Adding the trial image; you can pick another photo when it’s done.');return}
  var u=p.src&&(p.src.large2x||p.src.large||p.src.medium);if(!u)return;
  /* deneme planında kilit seçim anında alınır (yükleme bitmeden ikinci fotoğraf ikinci /use açmasın); Pro'da kilit yok */
  var kt=denemeDurum()==='var'&&S.stokKullan?{yukle:true}:null;if(kt)x.harciyor=kt;
  function birak(){if(kt&&x.harciyor===kt)x.harciyor=null}
  b.setAttribute('aria-busy','true');b.classList.add('kr-stok-yukleniyor');
  x.durum.textContent=T('Fotoğraf yükleniyor…','Loading the photo…');
  var im=new Image();im.crossOrigin='anonymous';im.decoding='async';
  var sira=x.sira;
  function bitir(){b.removeAttribute('aria-busy');b.classList.remove('kr-stok-yukleniyor')}
  /* 25.11: fotoğraf önce yüklenir (bozuk fotoğraf deneme hakkını yakmasın), sonra deneme planında POST /gen/stock/use;
     yalnız ok gelirse sahneye eklenir. Pro/Enterprise'da (stokDeneme yok) çağrı yapılmaz. */
  im.onload=function(){
    if(sira!==x.sira||!st||st.sahneler[i]!==s){birak();bitir();return}
    if(!(im.naturalWidth>0)){im.onerror();return}
    if(!kt){bitir();ekle();return}
    /* yükleme sürerken hak bitti/kilitlendi: harcama yok, eklenmez */
    if(denemeDurum()!=='var'||x.harciyor!==kt){birak();bitir();return}
    kt.yukle=false;x.durum.textContent=T('Deneme görseli ekleniyor…','Adding the trial image…');
    S.stokKullan(typeof p.id==='number'?p.id:0).then(function(){
      /* hak harcandı: seçici bu arada kapandıysa da görsel sahneye eklenir (hak boşa gitmesin) */
      birak();bitir();
      /* sahne silindi ya da taslak değişti: hak yine de harcandı — kilit/form durumu güncellenir */
      if(!st||st.sahneler[i]!==s){stokYayin(true);S.durum(T('Deneme görseli kullanıldı; sahne silindiği için görsel eklenmedi.','Trial image used; the scene was deleted, so no image was added.'));return}
      ekle(sira!==x.sira);
    },function(e){
      birak();bitir();
      if(e&&e.kod==='plan'){if(sira===x.sira)planKilidi(e);else{S.D.stock=false;S.D.stokKilit=true;stokYayin()}return}
      if(sira!==x.sira)return;
      var m=kullanHata(e);x.durum.textContent=m;S.toast(m);
      if(e&&e.kod==='login_required'){seciciDurum('hata',T('Görsel aramak için giriş yap.','Sign in to search images.'))}
    });
  };
  function ekle(sessiz){
    yerelBirak(s);if(s.video){vidBirak(s.video.el);s.video=null}s.gorsel=gorselNesne(p,im);s.elle=true;s.oto=false;
    /* deneme hakkı bittiyse (kabuk stock=false yaptı) tüm satırlar yeniden çizilir: ötekiler kilide döner */
    function satirlar(){if(stokVar())gorselYenile(i);else stokYayin(true)}
    if(sessiz){satirlar();guncelle();S.durum(T(tekil(i)+' için deneme görseli eklendi.','Trial image added to '+tekil(i).toLowerCase()+'.'));return}
    x.odak=null;satirlar();
    x.odak=odakHedef(i);
    x.kapat();guncelle();
    if(VID)sahneyeGit(i);else slaytGit(i);
    S.durum(T(tekil(i)+' için görsel eklendi. Fotoğraf: '+s.gorsel.photographer+' (Pexels).','Image added to '+tekil(i).toLowerCase()+'. Photo by '+s.gorsel.photographer+' on Pexels.')+(denemeDurum()==='bitti'?' '+DENEME_BITTI+'.':''));
  }
  im.onerror=function(){
    birak();b.removeAttribute('aria-busy');b.classList.remove('kr-stok-yukleniyor');if(sira!==x.sira)return;
    var m=T('Bu fotoğraf yüklenemedi; başka birini seç.','This photo couldn’t load; pick another one.');x.durum.textContent=m;S.toast(m);
  };
  im.src=u;
}
/* E5: seçicide video seçimi — klip açılır (CORS/bozuk ise eklenmez), sahneye konur, elle seçildi sayılır */
function vidSec(v,b){
  var x=SK,i=x.i,s=st&&st.sahneler[i];if(!s||b.getAttribute('aria-busy')==='true')return;
  b.setAttribute('aria-busy','true');b.classList.add('kr-stok-yukleniyor');x.durum.textContent=T('Video yükleniyor…','Loading the video…');
  var sira=x.sira;
  vidAc(v.src,function(ve){
    b.removeAttribute('aria-busy');b.classList.remove('kr-stok-yukleniyor');
    if(sira!==x.sira||!st||st.sahneler[i]!==s){vidBirak(ve);return}
    if(!ve){var m=T('Bu video yüklenemedi; başka birini seç.','This video couldn’t load; pick another one.');x.durum.textContent=m;S.toast(m);return}
    yerelBirak(s);s.gorsel=null;s.bekleyen=null;s.vbekleyen=null;s.elle=true;s.oto=false;vidKoy(s,v,ve);
    x.odak=null;x.odak=odakHedef(i);
    x.kapat();guncelle();sahneyeGit(i);
    S.durum(T(tekil(i)+' için video eklendi. Video: '+(v.user||'Pexels')+' (Pexels).','Video added to '+tekil(i).toLowerCase()+'. Video by '+(v.user||'Pexels')+' on Pexels.'));
  });
}
function secici(i,tetik,tur){
  if(!st||!st.sahneler[i])return;
  var x=seciciKur(),s=st.sahneler[i];x.i=i;x.acan=tetik;x.odak=null;
  /* E5: video sayfasında Video/Fotoğraf sekmesi; varsayılan: satırın türü, yoksa formdaki tercih */
  var vs=vidSekmeVar();x.sekme.hidden=!vs;
  turSec(vs?(tur||(s.video&&s.video.hazir?'video':s.gorsel?'foto':gTercih()==='video'?'video':'foto')):'foto');
  /* ön değer: sahnenin İngilizce q'su, yoksa sahne metninin ilk 4 anlamlı kelimesi (video sayfası) */
  x.qEn=VID&&s.q?s.q:'';
  var sq=VID?(s.q||ilk4(s.text)||ilk4(s.sub)):'';
  var on=sq||st.konu||aramaMetni(st.taslak&&st.taslak.title)||aramaMetni(s.text)||aramaMetni(s.sub);
  /* ön değerin kaynağı kipe göre söylenir: konu varsa videonun/karuselin konusu, yoksa içerik; boşsa hiç anılmaz */
  var kay=!on?'':sq?T('Arama kutusu bu sahneden dolduruldu; istersen değiştir. ','The search is prefilled from this scene; change it if you like. '):st.konu?(VID?T('Arama kutusu videonun konusuyla dolu; istersen değiştir. ','The search starts with your video’s topic; change it if you like. '):T('Arama kutusu karuselin konusuyla dolu; istersen değiştir. ','The search starts with your carousel’s topic; change it if you like. ')):T('Arama kutusu içerikten dolduruldu; istersen değiştir. ','The search is prefilled from your content; change it if you like. ');
  x.hedef.textContent=vs?T(tekil(i)+' için arka plan. '+kay+'Sen seçmedikçe değişmez.','Background for '+tekil(i).toLowerCase()+'. '+kay+'Nothing changes unless you pick one.'):T(tekil(i)+' için arka plan. '+kay+'Sen seçmedikçe görsel eklenmez.','Background for '+tekil(i).toLowerCase()+'. '+kay+'Nothing is added unless you pick a photo.');
  x.vazgec.textContent=s.gorsel||s.video&&s.video.hazir?T('Vazgeç','Cancel'):T('Görselsiz devam','Continue without an image');
  var dn=denemeDurum()==='var';x.deneme.hidden=!dn;
  if(dn){var kl=denemeKalan();x.denemeB.textContent=T(kl+' deneme görseli hakkın var','You have '+kl+' trial image'+(kl===1?'':'s'))}
  x.q.value=on;
  if(x.dlg.showModal){if(!x.dlg.open)x.dlg.showModal()}else x.dlg.setAttribute('open','');
  x.q.focus();x.q.select();
  if(x.q.value)ara(1);else seciciDurum('bos',T('Aramak için bir kelime yaz.','Type a word to search.'));
}
/* kota yanıtı stock bilgisini getirir; durum değişince yalnız görsel satırları yeniden çizilir (yazılan metne dokunulmaz).
   zorla: satır içeriği değişti (görsel eklendi/kaldırıldı), durum aynı olsa da satırlar yeniden çizilir */
var sonStok=null;
function stokYayin(zorla){
  gYaz();
  var v=stokVar()?'acik':stokKilit()?'kilit':'yok';if(v===sonStok&&!zorla)return;sonStok=v;
  if(v!=='acik'&&SK&&SK.dlg.open){/* açık seçici hatayı gösterir; kapatınca satırlar güncellenir */}
  gorselTumu();
}
d.addEventListener('studyo:hak',function(){gHak=true;stokYayin();var s=sesHakBilgi();if(s&&s.kalan>0)SES.hakYok=false;if(st&&R.sesAc)sesYaz()});

/* ---- 25.11: Görselli otomatik doldurma (OTO) ----
   Taslak hazır olunca (Görselli + stok 'acik' ya da 'deneme') konuyla tek S.stokOtomatik araması; liste sayfada tutulur
   (deneme bitince durum kilit olur, yeniden arama yapılamaz). Pro: görselsiz ve elle dokunulmamış her karta/sahneye sırayla
   farklı fotoğraf. Deneme: yalnız ilk karta/sahneye 1 fotoğraf — önce yüklenir, sonra S.stokHarca; ok gelirse eklenir.
   Elle seçim/kaldırma (s.elle) kazanır. Yeni taslak (kur) eski işi iptal eder. Sonuç seçicinin önbelleğine de yazılır. */
var OTO=null;
function otoDur(){var o=OTO;OTO=null;if(o&&o.ac){try{o.ac.abort()}catch(e){}o.ac=null}}
function otoGecerli(o){return !!o&&OTO===o&&!!st&&st===o.st}
function gorselNesne(p,im){
  var u=p.src&&(p.src.large2x||p.src.large||p.src.medium)||'';
  return {img:im,id:p.id,photographer:String(p.photographer||''),photographer_url:p.photographer_url||'',url:p.url||PX,alt:String(p.alt||''),thumb:(p.src&&p.src.medium)||u,src:u,w:+p.width||0,h:+p.height||0};
}
function kartAd(n){return VID?T(n+' sahneye',n+(n===1?' scene':' scenes')):T(n+' karta',n+(n===1?' card':' cards'))}
function otoYukMetni(o){return o.tek?T('Deneme görseli ekleniyor…','Adding the trial image…'):T('Görseller ekleniyor…','Adding images…')}
/* panelin üstündeki not; duyurular S.durum ile (not canlı bölge değil) */
function otoNot(tur,m,ek){
  if(!R.kr)return null;var n=R.oto;
  if(!n){var pn=R.kr.querySelector('.kr-panel');if(!pn)return null;n=el('div');n.tabIndex=-1;pn.insertBefore(n,pn.firstChild);R.oto=n}
  /* not gizlenirken odak içindeyse kaybolmasın: ilk görsel düğmesine taşı */
  var od=!m&&n.contains(d.activeElement);
  n.className='not kr-oto'+(tur?' not-'+tur:'');n.textContent='';n.hidden=!m;
  if(od){var hb=R.liste&&R.liste.querySelector('.kr-gorsel-degis,.kr-gorsel-ekle,.kr-kilit-bag');if(hb)hb.focus()}
  if(m){n.appendChild(el('span',null,m));if(ek)n.appendChild(ek)}
  return n;
}
function planBag(){var a=el('a','st-gorsel-bag',T('Planları gör','See plans'));a.href=EN?'/en/pricing':'/fiyatlar';return a}
function otoTekrar(o){
  var b=dugme('btn-cizgi btn-kucuk','tekrar',T('Tekrar dene','Try again'));
  b.addEventListener('click',function(){
    if(!otoGecerli(o)||o.harciyor)return;o.bozuk={};
    var n=o.vid?vidAra(o):otoAra(o);if(n&&n.focus)n.focus();
  });
  return b;
}
function otoKontrol(){
  var tc=GS&&st?gTercih():'yok';
  if(tc!=='stok'&&tc!=='video'||!S.stokOtomatik||!S.stokHarca||!S.stokDurum)return;
  var dr=S.stokDurum();if(dr!=='acik'&&dr!=='deneme')return;
  /* deneme mi: harcamadan önce, iş başında okunur */
  var o={st:st,ac:null,fotolar:null,tek:dr==='deneme',secilen:null,secilenIm:null,sira:0,ayrilan:{},bozuk:{},harciyor:false,
    vid:tc==='video'&&typeof S.stok==='function',videolar:null,vsira:0,vayrilan:{},vbozuk:{},vidNot:''};
  OTO=o;st.oto=o;if(o.vid)vidAra(o);else otoAra(o);
}
/* foto akışı bitince: Videolu'dan düşüldüyse kısa not kalır, yoksa not kapanır */
function otoTemiz(o){otoNot(o&&o.vidNot?'uyari':'',o&&o.vidNot||'')}
/* liste varsa yeniden aramaz (Tekrar dene aynı listeyle); notu döndürür (odak için) */
function otoAra(o){
  if(!otoGecerli(o))return null;
  if(o.fotolar)return otoDagit(o);
  var q=st.konu||aramaMetni(st.taslak&&st.taslak.title),yon=stokYonu(),m=otoYukMetni(o);
  var n=otoNot('',m);S.durum(m);
  o.ac=window.AbortController?new AbortController():null;
  S.stokOtomatik(q,{yon:yon,ac:o.ac}).then(function(r){
    if(!otoGecerli(o))return;o.ac=null;
    if(!r||!r.photos||!r.photos.length){otoHata(o,r||{});return}
    o.fotolar=r.photos.slice();
    /* seçici aynı aramayı yeniden yapmasın */
    var x=seciciKur(),an=aramaMetni(q).toLocaleLowerCase(EN?'en':'tr')+'|'+yon+'|1';
    if(!x.onbellek[an])x.onbellek[an]={photos:r.photos.slice(),next:r.photos.length>=10};
    otoDagit(o);
  });
  return n;
}
function otoHata(o,r){
  if(!otoGecerli(o))return;
  var k=r&&r.kod,m=(r&&r.hata)||S.stokHataMetni(r),ek=null,tur='hata';
  if(k==='plan'){ek=planBag();stokYayin(true)}
  else if(k==='login_required'){ek=el('a','st-gorsel-bag',T('Giriş yap','Sign in'));ek.href=girisYol()}
  else if(k==='bos'||k==='bad_input'){tur='uyari';if(stokVar())m+=' '+(VID?T('Sahnelerde “Görsel ekle” ile kendin arayabilirsin.','You can search yourself with “Add image” on each scene.'):T('Kartlarda “Görsel ekle” ile kendin arayabilirsin.','You can search yourself with “Add image” on each card.'))}
  /* günlük kişi limiti yarın yenilenir: Tekrar dene yok; genel yoğunlukta (scope global) var */
  else if(k!=='not_ready'&&!(k==='limit'&&r.scope!=='global'))ek=otoTekrar(o);
  otoNot(tur,m,ek);S.durum(m);
}
/* sıradaki fotoğraf: bozuk, ayrılmış (yükleniyor), bir sahnede kullanılan ve haric dışında; hepsi kullanıldıysa yinelenebilir */
function siradaki(o,haric){
  var a=o.fotolar||[],n=a.length,kul={},k,j,p,id;
  st.sahneler.forEach(function(s){if(s.gorsel)kul[String(s.gorsel.id)]=1});
  for(k=0;k<n;k++){j=(o.sira+k)%n;p=a[j];id=String(p.id);if(o.bozuk[id]||o.ayrilan[id]||kul[id]||id===haric)continue;o.sira=j+1;return p}
  for(k=0;k<n;k++){j=(o.sira+k)%n;p=a[j];id=String(p.id);if(o.bozuk[id]||id===haric)continue;o.sira=j+1;return p}
  return null;
}
/* fotoğrafı yükler (crossOrigin: tuvale çizilip dışa aktarılabilsin); bozuksa/15 sn'de gelmezse sıradakine geçer.
   cb(p,im) ya da cb(null) (yüklenebilir fotoğraf kalmadı); gecerli() false olursa cb çağrılmaz */
function otoYukle(o,gecerli,cb,haric){
  var p=siradaki(o,haric);if(!p){cb(null);return}
  var id=String(p.id),im=new Image(),bitti=false,z=0;o.ayrilan[id]=true;
  function son(ok){
    if(bitti)return;bitti=true;clearTimeout(z);im.onload=im.onerror=null;
    if(!gecerli()){delete o.ayrilan[id];return}
    if(ok){delete o.ayrilan[id];cb(p,im);return}
    o.bozuk[id]=true;delete o.ayrilan[id];otoYukle(o,gecerli,cb,haric);
  }
  im.crossOrigin='anonymous';im.decoding='async';
  im.onload=function(){son(im.naturalWidth>0)};im.onerror=function(){son(false)};
  z=setTimeout(function(){son(false)},15000);
  im.src=S.stokSrc(p);
}
function otoDagit(o){
  if(o.tek)return otoDeneme(o);
  var hedef=st.sahneler.filter(function(s){return !s.gorsel&&!s.elle&&!s.video});
  if(!hedef.length){otoTemiz(o);return null}
  var m=otoYukMetni(o),n=otoNot('',m);S.durum(m);
  var kalan=hedef.length,eklenen=0,olmadi=0,zam=0;
  function gecerli(){return otoGecerli(o)}
  hedef.forEach(function(s){
    otoYukle(o,gecerli,function(p,im){
      if(!p)olmadi++;
      else{
        var i=st.sahneler.indexOf(s);
        /* bu arada elle seçildi/kaldırıldı ya da sahne silindi: dokunma */
        if(i>=0&&!s.gorsel&&!s.elle&&!s.video){s.gorsel=gorselNesne(p,im);s.oto=true;eklenen++;gorselYenile(i);clearTimeout(zam);zam=setTimeout(function(){if(st===o.st)guncelle()},120)}
      }
      if(--kalan===0)otoBitti(o,eklenen,olmadi);
    });
  });
  return n;
}
function otoBitti(o,eklenen,olmadi){
  if(!otoGecerli(o))return;
  if(!olmadi){otoTemiz(o);if(eklenen)S.durum(T(kartAd(eklenen)+' görsel eklendi. İstersen değiştir ya da kaldır.','Images added to '+kartAd(eklenen)+'. You can change or remove them.'));return}
  var m=eklenen?T(kartAd(olmadi)+' görsel eklenemedi; fotoğraflar yüklenmedi.','Couldn’t add images to '+kartAd(olmadi)+'; the photos didn’t load.')
    :T('Görseller yüklenemedi. Bağlantını kontrol edip tekrar dene.','Couldn’t load images. Check your connection and try again.');
  otoNot(eklenen?'uyari':'hata',m,otoTekrar(o));S.durum(m);
}
/* deneme: yalnız ilk kart/sahne; fotoğraf önce yüklenir (bozuk fotoğraf hakkı yakmasın), sonra S.stokHarca */
function otoDeneme(o){
  var s=st.sahneler[0];
  if(!s||s.gorsel||s.elle||s.video){otoTemiz(o);return null}
  var m=otoYukMetni(o),n=otoNot('',m);S.durum(m);
  function harca(p,im){
    /* bu arada elle seçim başladı/bitti, sahne silindi ya da hak durumu değişti: harcama yok */
    if(!otoGecerli(o)||st.sahneler.indexOf(s)<0||s.gorsel||s.elle||s.video||(SK&&SK.harciyor)||S.stokDurum()!=='deneme'){otoNot('','');return}
    o.harciyor=true;
    S.stokHarca(p).then(function(ok){
      o.harciyor=false;gYaz();
      if(ok){
        var yer=!!st&&st===o.st&&st.sahneler.indexOf(s)>=0&&!s.gorsel;
        if(yer){s.gorsel=gorselNesne(p,im);s.oto=true}
        stokYayin(true);
        if(!otoGecerli(o))return;
        otoTemiz(o);if(yer){guncelle();S.durum(T((VID?'İlk sahneye':'İlk karta')+' deneme görseli eklendi. ','Trial image added to the first '+(VID?'scene':'card')+'. ')+DENEME_BITTI+'.')}
        return;
      }
      if(!otoGecerli(o))return;
      var h=(S.stokHarcaHata&&S.stokHarcaHata())||T('Deneme görseli şu an eklenemedi.','The trial image couldn’t be added right now.');
      if(S.stokDurum()==='kilit'){stokYayin(true);otoNot('hata',h,planBag())}
      else otoNot('hata',h,otoTekrar(o));
      S.durum(h);
    });
  }
  /* Tekrar dene: aynı fotoğraf nesnesi (aynı id yeniden harcanmaz) */
  if(o.secilen&&o.secilenIm){harca(o.secilen,o.secilenIm);return n}
  otoYukle(o,function(){return otoGecerli(o)},function(p,im){
    if(!p){var e=T('Deneme görseli yüklenemedi. Bağlantını kontrol edip tekrar dene.','Couldn’t load the trial image. Check your connection and try again.');otoNot('hata',e,otoTekrar(o));S.durum(e);return}
    o.secilen=p;o.secilenIm=im;harca(p,im);
  });
  return n;
}
/* Pro: aynı listeden sıradaki fotoğraf, çağrı yok */
function baskaDugme(s,i){
  var b=dugme('btn-hafif kr-gorsel-baska','tekrar',T('Başka görsel','Another image'));b.appendChild(el('span','sr',' · '+tekil(i)));
  b.addEventListener('click',function(){
    var o=st&&st.oto;if(!o||pasifMi(b)||!s.gorsel||st.sahneler[i]!==s)return;
    function gecerli(){return !!st&&st.oto===o&&st.sahneler[i]===s}
    pasif(b,true);b.setAttribute('aria-busy','true');S.durum(T('Başka fotoğraf yükleniyor…','Loading another photo…'));
    otoYukle(o,gecerli,function(p,im){
      if(!p){pasif(b,false);b.removeAttribute('aria-busy');S.durum(T('Başka fotoğraf yüklenemedi.','Couldn’t load another photo.'));return}
      yerelBirak(s);if(s.video){vidBirak(s.video.el);s.video=null}s.gorsel=gorselNesne(p,im);s.elle=true;gorselYenile(i,'.kr-gorsel-baska');guncelle();
      S.durum(T(tekil(i)+' için başka görsel eklendi. Fotoğraf: '+s.gorsel.photographer+' (Pexels).','Another image added to '+tekil(i).toLowerCase()+'. Photo by '+s.gorsel.photographer+' on Pexels.'));
    },String(s.gorsel.id));
  });
  return b;
}

/* ---- C2: Videolu (yalnız video sayfası) ----
   Taslak hazır olunca konuyla tek GET /gen/stock?type=video araması (S.stok). Pro: elle dokunulmamış, klibi/görseli olmayan her sahneye
   sırayla farklı mp4 klip; denemede yalnız 1. sahneye 1 klip (önce yüklenir, sonra S.stokHarca — deneme sayacı fotoğrafla ortak).
   Klip <video muted loop playsinline crossorigin=anonymous>; yüklenmez, 15 sn'de gelmez ya da tuvali kirletirse (CORS) sıradaki klip;
   klip kalmazsa o sahneler fotoğraf akışına (otoAra) düşer. Arama hatası / hiç klip yoksa kısa not + fotoğraf. */
function vidGecerli(v){return !!v&&v.id!=null&&pxVid(v.src)}
function vidBirak(v){if(!v)return;try{v.pause();v.removeAttribute('src');v.load()}catch(e){}}
function vidHepsiBirak(){if(!st)return;st.sahneler.forEach(function(s){if(s.video){vidBirak(s.video.el);s.video=null}s.vbekleyen=null})}
/* klibi açar; cb(<video>) ya da cb(null). Tuvale çizilip okunamıyorsa (CORS) null: dışa aktarım bozulmasın */
function vidAc(src,cb){
  var v=d.createElement('video'),bitti=false,z=0;
  function son(ok){
    if(bitti)return;bitti=true;clearTimeout(z);v.removeEventListener('loadeddata',yuk);v.removeEventListener('error',hata);
    if(ok)cb(v);else{vidBirak(v);cb(null)}
  }
  function yuk(){
    if(!(v.videoWidth>0)){son(false);return}
    try{var c=d.createElement('canvas');c.width=2;c.height=2;var x=c.getContext('2d');x.drawImage(v,0,0,2,2);x.getImageData(0,0,1,1);son(true)}catch(e){son(false)}
  }
  function hata(){son(false)}
  v.crossOrigin='anonymous';v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';
  v.addEventListener('loadeddata',yuk);v.addEventListener('error',hata);
  z=setTimeout(function(){son(false)},15000);
  v.src=src;try{v.load()}catch(e){}
}
function vidKoy(s,v,ve){
  if(s.video&&s.video.el!==ve)vidBirak(s.video.el);
  (s.vgor||(s.vgor={}))[String(v.id)]=1;
  s.video={el:ve,hazir:true,id:v.id,src:v.src,poster:pxSrc(v.poster)?v.poster:'',w:+(v.w||v.width)||0,h:+(v.h||v.height)||0,dur:+(v.dur||v.duration)||0,
    user:String(v.user||''),user_url:pxSayfa(v.user_url)?v.user_url:'',url:pxSayfa(v.url)?v.url:PX};
  var i=st?st.sahneler.indexOf(s):-1;if(i>=0)gorselYenile(i);
}
function vidYukMetni(o){return o.tek?T('Deneme videosu ekleniyor…','Adding the trial video…'):T('Video klipleri ekleniyor…','Adding video clips…')}
/* E5: sahnenin aday listesi — kendi q'sunun sonuçları → yedek sorgular (taslak q, konu) → öteki sonuçlar; tekil */
function vidAday(o,s){
  var a=[],gor={},vq=o.vq||{};
  function ek(l){(l||[]).forEach(function(v){var id=String(v.id);if(!gor[id]){gor[id]=1;a.push(v)}})}
  if(s&&s.q)ek(vq[s.q.toLowerCase()]);(o.vyed||[]).forEach(function(k){ek(vq[k])});ek(o.videolar);
  return a;
}
/* sıradaki klip: bozuk, yükleniyor (öteki sahneye ayrıldı), bir sahnede kullanılan ve bu sahnede daha önce gösterilen dışında.
   Süresi sahneden uzun olan klip öne alınır. Tekrar yok: uygun klip kalmadıysa null (sahne fotoğrafa düşer). */
function vidSiradaki(o,s){
  var a=vidAday(o,s),kul={},gr=s&&s.vgor||{},sn=s&&+s.secs||0,yedek=null,k,v,id,du;
  st.sahneler.forEach(function(x){if(x.video)kul[String(x.video.id)]=1});
  for(k=0;k<a.length;k++){
    v=a[k];id=String(v.id);if(o.vbozuk[id]||o.vayrilan[id]||kul[id]||gr[id])continue;
    du=+(v.duration||v.dur)||0;if(!(sn>0)||!(du>0)||du>=sn)return v;if(!yedek)yedek=v;
  }
  return yedek;
}
function vidYukle(o,s,cb){
  var v=vidSiradaki(o,s);if(!v){cb(null,null);return}
  var id=String(v.id);o.vayrilan[id]=true;
  vidAc(v.src,function(ve){
    delete o.vayrilan[id];
    if(!otoGecerli(o)){vidBirak(ve);return}
    if(ve){cb(v,ve);return}
    o.vbozuk[id]=true;vidYukle(o,s,cb);
  });
}
/* E5: arama sırası — sahnelerin q'ları (tekil), sonra taslak q'su, sonra konu; taslak başına en çok 6 arama */
function vidSorgular(o){
  var sq=[],yed=[],gor={};
  function ek(a,q,lg){q=String(q||'').trim();if(!q)return;var k=q.toLowerCase();if(gor[k])return;gor[k]=1;a.push({q:q,k:k,lg:lg})}
  (o.tek?st.sahneler.slice(0,1):st.sahneler).forEach(function(s){if(!s.elle&&!s.video&&!s.gorsel)ek(sq,s.q,'en')});
  ek(yed,st.q,'en');ek(yed,st.konu||aramaMetni(st.taslak&&st.taslak.title),EN?'en':'tr');
  return {hep:sq.slice(0,Math.max(0,6-yed.length)).concat(yed),yed:yed.map(function(x){return x.k})};
}
/* Pro: aynı aramaların sıradaki klibi (yeni arama yok); bu sahnede gösterilenler tekrar gelmez */
function baskaVideo(s,i){
  var b=dugme('btn-hafif kr-gorsel-baska','tekrar',T('Başka video','Another video'));b.appendChild(el('span','sr',' · '+tekil(i)));
  b.addEventListener('click',function(){
    var o=st&&st.oto;if(!o||!o.videolar||pasifMi(b)||!s.video||st.sahneler[i]!==s)return;
    alakasizKapat();pasif(b,true);b.setAttribute('aria-busy','true');S.durum(T('Başka video yükleniyor…','Loading another video…'));
    function bitir(m){pasif(b,false);b.removeAttribute('aria-busy');if(m)S.durum(m)}
    (function dene(){
      var v=vidSiradaki(o,s);
      if(!v){bitir(T('Başka uygun video kalmadı; “Stok ara” ile kendin ara.','No other suitable video left; use “Search stock” to look yourself.'));return}
      var id=String(v.id);o.vayrilan[id]=true;
      vidAc(v.src,function(ve){
        delete o.vayrilan[id];
        if(!st||st.oto!==o||st.sahneler[i]!==s){vidBirak(ve);return}
        if(!ve){o.vbozuk[id]=true;dene();return}
        yerelBirak(s);s.gorsel=null;s.bekleyen=null;s.elle=true;vidKoy(s,v,ve);gorselYenile(i,'.kr-gorsel-baska');guncelle();
        S.durum(T(tekil(i)+' için başka video eklendi. Video: '+(v.user||'Pexels')+' (Pexels).','Another video added to '+tekil(i).toLowerCase()+'. Video by '+(v.user||'Pexels')+' on Pexels.'));
      });
    })();
  });
  return b;
}
/* fotoğrafa düşüş: kalan sahneler foto akışıyla dolar; not foto akışı bitince de görünür kalır */
function vidYedek(o,m){
  if(!otoGecerli(o))return null;
  o.vid=false;o.vidNot=m;S.durum(m);
  return otoAra(o);
}
function vidAra(o){
  if(!otoGecerli(o))return null;
  if(o.videolar)return vidDagit(o);
  var sg=vidSorgular(o),m=vidYukMetni(o),n=otoNot('',m);S.durum(m);
  if(!sg.hep.length)return vidYedek(o,T('Konu boş olduğu için video aranmadı; sahnelere fotoğraf ekleniyor.','No topic to search videos for; adding photos to the scenes instead.'));
  var ac=window.AbortController?new AbortController():null,vq={},hata=0;o.ac=ac;
  Promise.all(sg.hep.map(function(x){
    return S.stok('type=video&q='+encodeURIComponent(x.q)+'&orientation='+stokYonu()+'&page=1&lang='+x.lg,ac).then(function(r){
      vq[x.k]=(r&&Array.isArray(r.videos)?r.videos:[]).filter(vidGecerli);
    },function(){hata++});
  })).then(function(){
    if(!otoGecerli(o)||o.ac!==ac)return;o.ac=null;
    var hep=[],gor={};sg.hep.forEach(function(x){(vq[x.k]||[]).forEach(function(v){var id=String(v.id);if(!gor[id]){gor[id]=1;hep.push(v)}})});
    if(!hep.length){
      vidYedek(o,hata===sg.hep.length?T('Video araması şu an yapılamadı; sahnelere fotoğraf eklendi.','Video search isn’t available right now; photos were added to the scenes instead.')
        :T('Bu konu için uygun video bulunamadı; sahnelere fotoğraf eklendi.','No suitable video was found for this topic; photos were added to the scenes instead.'));return}
    o.vq=vq;o.vyed=sg.yed;o.videolar=hep;vidDagit(o);
  });
  return n;
}
function vidDagit(o){
  if(o.tek)return vidDeneme(o);
  var hedef=st.sahneler.filter(function(s){return !s.video&&!s.gorsel&&!s.elle});
  if(!hedef.length){otoTemiz(o);return null}
  var m=vidYukMetni(o),n=otoNot('',m);S.durum(m);
  var kalan=hedef.length,eklenen=0,olmadi=0,zam=0;
  hedef.forEach(function(s){
    vidYukle(o,s,function(v,ve){
      if(!v)olmadi++;
      else if(st.sahneler.indexOf(s)>=0&&!s.video&&!s.gorsel&&!s.elle){s.oto=true;vidKoy(s,v,ve);eklenen++;clearTimeout(zam);zam=setTimeout(function(){if(st===o.st)guncelle()},120)}
      else vidBirak(ve);
      if(--kalan===0)vidBitti(o,eklenen,olmadi);
    });
  });
  return n;
}
function vidBitti(o,eklenen,olmadi){
  if(!otoGecerli(o))return;
  if(!olmadi){otoTemiz(o);if(eklenen)S.durum(T(kartAd(eklenen)+' video klibi eklendi. İstersen kaldır.','Video clips added to '+kartAd(eklenen)+'. You can remove them.'));return}
  vidYedek(o,eklenen?T(kartAd(olmadi)+' video yüklenemedi; bu sahnelere fotoğraf eklendi.','Couldn’t load videos for '+kartAd(olmadi)+'; photos were added to those scenes instead.')
    :T('Videolar yüklenemedi; sahnelere fotoğraf eklendi.','Couldn’t load the videos; photos were added to the scenes instead.'));
}
/* deneme: yalnız 1. sahne; klip önce yüklenir (bozuk klip hakkı yakmasın), sonra S.stokHarca */
function vidDeneme(o){
  var s=st.sahneler[0];
  if(!s||s.gorsel||s.elle||s.video){otoTemiz(o);return null}
  var m=vidYukMetni(o),n=otoNot('',m);S.durum(m);
  function harca(v,ve){
    if(!otoGecerli(o)||st.sahneler.indexOf(s)<0||s.gorsel||s.elle||s.video||(SK&&SK.harciyor)||S.stokDurum()!=='deneme'){vidBirak(ve);otoNot('','');return}
    o.harciyor=true;gYaz();
    S.stokHarca({id:v.id}).then(function(ok){
      o.harciyor=false;gYaz();
      if(ok){
        var yer=!!st&&st===o.st&&st.sahneler.indexOf(s)>=0&&!s.gorsel&&!s.video;
        if(yer){s.oto=true;vidKoy(s,v,ve)}else vidBirak(ve);
        o.secilen=o.secilenIm=null;stokYayin(true);
        if(!otoGecerli(o))return;
        otoTemiz(o);if(yer){guncelle();S.durum(T('İlk sahneye deneme videosu eklendi. ','Trial video added to the first scene. ')+DENEME_BITTI+'.')}
        return;
      }
      if(!otoGecerli(o))return;
      var h=(S.stokHarcaHata&&S.stokHarcaHata())||T('Deneme videosu şu an eklenemedi.','The trial video couldn’t be added right now.');
      if(S.stokDurum()==='kilit'){vidBirak(ve);o.secilen=o.secilenIm=null;stokYayin(true);otoNot('hata',h,planBag())}
      else otoNot('hata',h,otoTekrar(o));
      S.durum(h);
    });
  }
  /* Tekrar dene: aynı klip (aynı id yeniden harcanmaz) */
  if(o.secilen&&o.secilenIm){harca(o.secilen,o.secilenIm);return n}
  vidYukle(o,s,function(v,ve){
    if(!v){vidYedek(o,T('Deneme videosu yüklenemedi; ilk sahneye fotoğraf ekleniyor.','Couldn’t load the trial video; adding a photo to the first scene instead.'));return}
    o.secilen=v;o.secilenIm=ve;harca(v,ve);
  });
  return n;
}

/* ---- A11-4: formdaki "Sahne görselleri" seçimi (Görselsiz / Görselli · Pexels) ----
   Yalnız tarayıcıda: /gen/video gövdesine girmez (worker'da görsel alanı yok; kabuk alanları tek tek okur). Seçim, taslaktaki
   sahne satırlarında "Görsel ekle"yi açar/kapar; taslak geldikten sonra değişirse satırlar hemen yenilenir.
   Durum: bekle (kota yanıtı yok) · acik (stock true) · kilit (anon/basic ya da 403 plan) · yok (anahtar yok / plan bilinmiyor).
   Erişim yoksa "Görselli" gizlenmez: kilit ikonu + nedeni görünür, odaklanabilir kalır (aria-disabled), seçilince geri alınıp
   nedeni duyurulur. Form yoksa eski davranış: stock açıksa her satırda "Görsel ekle".
   25.11: varsayılan Görselsiz. Görselli + stok açık iken taslak hazır olunca otomatik doldurma (aşağıda OTO): tek arama,
   Pro'da her karta/sahneye sırayla farklı fotoğraf, denemede yalnız ilk karta/sahneye 1 fotoğraf. Elle seçim/kaldırma kazanır.
   C2: video sayfasında üçüncü seçenek "Videolu" (value=video): erişim kuralı Görselli ile aynı (stok açık); sahnelere Pexels klibi. */
var GS=$('#gorsel-secim'),GTK='smc-gorsel-'+MOD,gHak=false,gSon='';
var gYok=GS&&GS.querySelector('input[value="yok"]'),gStok=GS&&GS.querySelector('input[value="stok"]'),gNot=GS&&$('#gorsel-not');
var gVid=VID&&GS?GS.querySelector('input[value="video"]'):null,gSecili='yok';
function gTercih(){if(!GS)return 'stok';if(!stokVar())return 'yok';return gVid&&gVid.checked?'video':gStok&&gStok.checked?'stok':'yok'}
function gIsaretli(){return gVid&&gVid.checked?gVid:gStok&&gStok.checked?gStok:gYok}
function gRadyo(k){return k==='video'&&gVid?gVid:k==='stok'?gStok:gYok}
/* kayıttan geri yükleme (sonVer): erişim açık değilse yalnız tercih saklanır, açılınca gYaz uygular */
function gSec(k){if(!GS)return;if(gDurum()==='acik'||k==='yok'){gRadyo(k).checked=true;gSecili=k}gNotYaz()}
function gDurum(){return stokVar()?'acik':stokKilit()?'kilit':gHak?'yok':'bekle'}
/* 25.11: deneme hakkı harcanıyor (POST /gen/stock/use yolda): seçim kısa süre kilitli; eski kabukta OTO bayrağı */
var G_MESGUL=S.GORSEL_MESGUL||T('Görsel ekleniyor… Bitince Görselli/Görselsiz seçimini değiştirebilirsin.','Adding the image… You can switch between with and without images when it’s done.');
function gMesgul(){return typeof S.stokHarciyor==='function'?S.stokHarciyor():!!(OTO&&OTO.harciyor)}
function gUye(){var u=$('.st-ust[data-hesap]');return !!(u&&u.getAttribute('data-hesap')==='uye')}
function gNeden(){
  var dr=gDurum();
  if(dr==='kilit')return denemeDurum()==='bitti'?DENEME_BITTI+'.':T('Görselli seçenek Pro ve Enterprise planlarıyla açılır.','The image option comes with the Pro and Enterprise plans.');
  if(dr==='yok')return T('Görsel arama şu an kullanılamıyor; taslak görselsiz hazırlanır.','Image search isn’t available right now; the draft is made without images.');
  return T('Plan bilgisi alınıyor…','Checking your plan…');
}
function gNotYaz(){
  if(!gNot)return;var dr=gDurum();gNot.textContent='';
  if(gMesgul()){gNot.textContent=G_MESGUL;return}
  if(dr==='acik'){
    if(gVid&&gVid.checked){
      gNot.textContent=denemeDurum()==='var'
        ?T('Taslak hazır olunca ilk sahneye 1 deneme videosu otomatik eklenir; istersen kaldırırsın. Pro’da her sahneye.','When the draft is ready, the first scene gets 1 trial video clip automatically; you can remove it. Every scene on Pro.')
        :T('Taslak hazır olunca her sahneye Pexels’ten otomatik video klibi eklenir; video bulunamayan sahnelere fotoğraf konur.','When the draft is ready, each scene gets a Pexels video clip automatically; scenes without a matching clip get a photo.');
      return;
    }
    if(gStok.checked){
      gNot.textContent=denemeDurum()==='var'
        ?(VID?T('Taslak hazır olunca ilk sahneye 1 deneme görseli otomatik eklenir; istersen kaldırırsın. Pro’da sınırsız.','When the draft is ready, the first scene gets 1 trial image automatically; you can remove it. Unlimited on Pro.')
             :T('Taslak hazır olunca ilk karta 1 deneme görseli otomatik eklenir; istersen kaldırırsın. Pro’da sınırsız.','When the draft is ready, the first card gets 1 trial image automatically; you can remove it. Unlimited on Pro.'))
        :(VID?T('Taslak hazır olunca her sahneye Pexels’ten otomatik fotoğraf eklenir; istersen değiştirir ya da kaldırırsın.','When the draft is ready, each scene gets a Pexels photo automatically; you can change or remove it.')
             :T('Taslak hazır olunca her karta Pexels’ten otomatik fotoğraf eklenir; istersen değiştirir ya da kaldırırsın.','When the draft is ready, each card gets a Pexels photo automatically; you can change or remove it.'));
      return;
    }
    gNot.textContent=VID?T('Sahneler yalnız metin ve renkle hazırlanır. Görsel istersen “Görselli”yi seç.','Scenes use text and color only. Pick “With images” if you want photos.')
      :T('Kartlar yalnız metin ve renkle hazırlanır. Görsel istersen “Görselli”yi seç.','Cards use text and color only. Pick “With images” if you want photos.');
    if(denemeDurum()==='var'){var kl=denemeKalan();gNot.textContent+=' '+T(kl+' deneme görseli hakkın var; Pro’da sınırsız.','You have '+kl+' trial image'+(kl===1?'':'s')+'; unlimited on Pro.')}
    return;
  }
  if(dr==='kilit'&&denemeDurum()==='bitti'){
    gNot.appendChild(d.createTextNode(DENEME_BITTI+'. '));
    var ab=el('a','st-gorsel-bag',T('Planları gör','See plans'));ab.href=EN?'/en/pricing':'/fiyatlar';gNot.appendChild(ab);
    return;
  }
  if(dr==='kilit'){
    gNot.appendChild(d.createTextNode((VID?T('Görselli: her sahneye Pexels stok fotoğrafı. Bu seçenek Pro ve Enterprise planlarıyla açılır','With images: a Pexels stock photo on each scene. This option comes with the Pro and Enterprise plans')
      :T('Görselli: her karta Pexels stok fotoğrafı. Bu seçenek Pro ve Enterprise planlarıyla açılır','With images: a Pexels stock photo on each card. This option comes with the Pro and Enterprise plans'))+
      (gUye()?T('; hesabında şu an bu planlardan biri tanımlı değil. ','; your account isn’t on one of these plans yet. '):'. ')));
    var a=el('a','st-gorsel-bag',T('Planları gör','See plans'));a.href=EN?'/en/pricing':'/fiyatlar';gNot.appendChild(a);
    return;
  }
  gNot.textContent=gNeden();
}
function gYaz(){
  if(!GS)return;var dr=gDurum(),ilk=gSon!==dr&&dr==='acik';
  GS.setAttribute('data-durum',dr);
  var kil=[gStok];if(gVid)kil.push(gVid);
  if(dr==='acik'){
    kil.forEach(function(r){r.removeAttribute('aria-disabled')});
    if(ilk){var k=null;try{k=S.depo(GTK)}catch(e){}gRadyo(k==='video'||k==='stok'?k:'yok').checked=true}
  }else{kil.forEach(function(r){r.setAttribute('aria-disabled','true')});if(gIsaretli()!==gYok)gYok.checked=true}
  /* harcama sürerken tüm seçenekler kilitli (aria-disabled + fieldset aria-busy) */
  if(gMesgul()){gYok.setAttribute('aria-disabled','true');kil.forEach(function(r){r.setAttribute('aria-disabled','true')});GS.setAttribute('aria-busy','true')}
  else{gYok.removeAttribute('aria-disabled');GS.removeAttribute('aria-busy')}
  gSecili=gIsaretli().value;gSon=dr;gNotYaz();
}
if(GS){
  [gYok,gStok,gVid].forEach(function(r){if(r)r.addEventListener('change',function(){
    var once=gSecili;
    if(gMesgul()){gRadyo(once).checked=true;S.durum(G_MESGUL);S.toast(G_MESGUL);gNotYaz();return}
    if(gIsaretli()!==gYok&&gDurum()!=='acik'){gYok.checked=true;gSecili='yok';var m=gNeden();S.durum(m);S.toast(m);gNotYaz();return}
    var yeni=gIsaretli().value;gSecili=yeni;
    try{S.depo(GTK,yeni)}catch(e){}
    /* Görselsiz ya da tür değişti: süren otomatik ekleme durur (deneme hakkı harcanıyorsa bitmesi beklenir) */
    if(yeni!==once&&OTO&&!OTO.harciyor){otoDur();otoNot('','')}
    /* Videolu'dan çıkış: klipler kalkar (Görselli'de fotoğraf, Görselsiz'de metin) */
    var vk=false;if(once==='video'&&yeni!=='video'&&st){st.sahneler.forEach(function(s){if(s.video)vk=true});vidHepsiBirak()}
    gNotYaz();
    if(st&&R.liste)st.sahneler.forEach(function(s,i){gorselYenile(i)});
    if(vk)guncelle();
    var dn=denemeDurum()==='var';
    if(yeni==='video'){S.durum(dn?T('Videolu seçildi: taslak hazır olunca ilk sahneye 1 deneme videosu otomatik eklenir.','With video: the first scene gets 1 trial video clip automatically when the draft is ready.')
      :T('Videolu seçildi: taslak hazır olunca sahnelere Pexels video klibi otomatik eklenir.','With video: scenes get Pexels video clips automatically when the draft is ready.'));return}
    S.durum(gStok.checked
      ?(VID?(dn?T('Görselli seçildi: taslak hazır olunca ilk sahneye 1 deneme görseli otomatik eklenir.','With images: the first scene gets 1 trial image automatically when the draft is ready.'):T('Görselli seçildi: taslak hazır olunca sahnelere Pexels fotoğrafı otomatik eklenir.','With images: scenes get Pexels photos automatically when the draft is ready.'))
           :(dn?T('Görselli seçildi: taslak hazır olunca ilk karta 1 deneme görseli otomatik eklenir.','With images: the first card gets 1 trial image automatically when the draft is ready.'):T('Görselli seçildi: taslak hazır olunca kartlara Pexels fotoğrafı otomatik eklenir.','With images: cards get Pexels photos automatically when the draft is ready.')))
      :(VID?T('Görselsiz seçildi: sahneler yalnız metin ve renkle.','No images: scenes use text and color only.'):T('Görselsiz seçildi: kartlar yalnız metin ve renkle.','No images: cards use text and color only.')));
  })});
  d.addEventListener('studyo:harca',function(){gYaz()});
  setTimeout(function(){if(!gHak){gHak=true;gYaz()}},12000);
  var gU=$('.st-ust[data-hesap]');if(gU&&window.MutationObserver)new MutationObserver(function(){if(gDurum()==='kilit')gNotYaz()}).observe(gU,{attributes:true,attributeFilter:['data-hesap']});
  gYaz();
}

/* Açıklama */
function aciklamaKur(arac){
  var ic=el('div'),id='kr-'+MOD+'-aciklama';
  var bas=el('div','kr-yazi-ust');var l=el('label','kr-yazi-l',T('Açıklama metni','Caption text'));l.htmlFor=id;bas.appendChild(l);
  var say=el('span','sayac');say.id=id+'-say';bas.appendChild(say);ic.appendChild(bas);
  var ta=el('textarea','st-girdi kr-ta kr-ack');ta.id=id;ta.rows=7;ta.maxLength=UZ_ACK+200;ta.value=st.aciklama;ta.setAttribute('aria-describedby',id+'-say');
  ta.addEventListener('input',function(){st.aciklama=ta.value;sayacYaz(ta,say,UZ_ACK);senkron();ozetYaz();kayitZamanla()});
  ic.appendChild(ta);sayacYaz(ta,say,UZ_ACK);
  if(arac){arac.classList.add('kr-arac');ic.appendChild(arac)}
  return ic;
}

/* ---- olay: taslağı devral ---- */
function hataGoster(det,e){
  var n=el('div','not not-hata kr-hata');n.setAttribute('role','alert');
  n.appendChild(el('span',null,T('Önizleme açılamadı; sahneleri aşağıda düz liste olarak görüyorsun.','The preview couldn’t open; the scenes are listed below as plain text.')));
  var b=dugme('btn-cizgi btn-kucuk','tekrar',T('Tekrar dene','Try again'));
  b.addEventListener('click',function(){
    try{kur(det);var y=$('#sb-yer');if(y){y.textContent='';y.hidden=true}n.remove();if(R.tuval)R.tuval.focus({preventScroll:true});otoKontrol()}
    catch(x){var kr=kok.querySelector('.kr');if(kr)kr.remove();var yer=kok.querySelector('.st-motor-yer');if(yer)yer.hidden=true;S.durum(T('Önizleme yine açılamadı.','The preview still couldn’t open.'))}
  });
  n.appendChild(b);
  kok.insertBefore(n,kok.firstChild);
  if(window.console&&console.warn)console.warn('kurgu',e&&e.message);
}
kok.addEventListener('studyo:taslak',function(e){
  var det=e.detail||{};
  if(!window.SmcMotor||!det.draft)return;
  var tm=false;sonDet=det;
  try{kur(det);e.preventDefault();tm=true}
  catch(x){otoDur();
    var kr=kok.querySelector('.kr');if(kr)kr.remove();
    if(st&&st.oynat){try{st.oynat.stop()}catch(z){}}
    var arac=kok.querySelector('.st-arac');if(arac&&arac.parentNode!==kok)kok.appendChild(arac);
    st=null;hataGoster(det,x);
  }
  /* geri yüklemede (detail.geri) otomatik görsel araması yok: deneme hakkı harcanmaz, kayıtlı medya sonVer ile gelir */
  if(tm&&!det.geri)otoKontrol();
});
/* sonuç gizlenince önizlemeyi durdur */
var sonucEl=$('#d-sonuc');
if(sonucEl&&window.MutationObserver){
  new MutationObserver(function(){if(sonucEl.hidden&&st&&st.oynat&&st.oynat.playing){st.oynat.pause();oynatYaz()}}).observe(sonucEl,{attributes:true,attributeFilter:['hidden']});
}

/* ================= BOŞ DURUM: ÖRNEK ================= */
function ornekProje(){
  var sc=VID
    ?(EN?[['Build a morning routine in *3 steps*','Five minutes before coffee',3],['1. Keep your phone *away*','No notifications for 30 minutes',2.5],['2. Write down *one task*','The rest can wait',2.5],['Save it, try it *tomorrow*','',2.5]]
        :[['Sabah rutinini *3 adımda* kur','Kahveden önce 5 dakika',3],['1. Telefonu *uzak tut*','İlk 30 dakika bildirim yok',2.5],['2. Günün *tek işini* yaz','Gerisi bekleyebilir',2.5],['Kaydet, *yarın* dene','',2.5]])
    :(EN?[['What to write in the *first DM*?','Swipe →'],['Use their *name* first','A short, warm opener'],['Ask *one* question','Make it easy to answer'],['Then give *value*','A tip or an example'],['*Save* this list','You’ll need it later']]
        :[['İlk mesaja *ne yazmalı?*','Kaydır →'],['Önce *adıyla* seslen','Kısa ve sıcak bir giriş'],['Tek bir *soru* sor','Cevaplaması kolay olsun'],['Sonra *değer* kat','Bir ipucu ya da örnek'],['Bu listeyi *kaydet*','Sonra lazım olacak']]);
  return {template:VID?'kinetik':'kart',aspect:VID?'9:16':'4:5',palette:VID?'marka':'mercan',lang:EN?'en':'tr',
    brand:{name:T('Örnek Marka','Sample Brand'),handle:EN?'samplebrand':'ornekmarka'},
    scenes:sc.map(function(x){return {text:x[0],sub:x[1],secs:VID?x[2]:0}})};
}
function ornekKur(){
  var bos=$('#d-bos'),Mo=window.SmcMotor;if(!bos||!Mo||bos.querySelector('.kr-ornek'))return;
  if(!M)M=Mo;var p=ornekProje(),a=Mo.aspects[p.aspect];
  bos.classList.add('kr-bos');
  var fig=el('figure','kr-ornek');
  var cer=el('div','kr-ornek-cerceve');cer.style.setProperty('--kr-oran',String(a[0]/a[1]));
  var cv=el('canvas','kr-ornek-tuval');cv.setAttribute('role','img');
  cv.setAttribute('aria-label',VID?T('Örnek video önizlemesi: sabah rutini, 4 sahne.','Sample video preview: a morning routine in 4 scenes.'):T('Örnek karusel önizlemesi: ilk mesaj ipuçları, 5 slayt.','Sample carousel preview: first-message tips, 5 slides.'));
  cer.appendChild(cv);cer.appendChild(el('span','kr-rozet',T('Örnek','Sample')));fig.appendChild(cer);
  var cap=el('figcaption','kr-ornek-alt');
  cap.appendChild(el('span',null,VID?T('Örnek önizleme · taslağın böyle oynar','Sample preview · your draft plays like this'):T('Örnek önizleme · slaytların böyle görünür','Sample preview · your slides look like this')));
  var tg=dugme('btn-hafif btn-kucuk kr-ikon-d',null,null,'');cap.appendChild(tg);fig.appendChild(cap);
  var ornekler=bos.querySelector('.st-ornekler');bos.insertBefore(fig,ornekler||null);

  var oyn=null,zam=0,i=0,calis=!AZ,kullanici=false;
  function ciz(){boyut(cv,p.aspect,cv.clientWidth||220,720);Mo.drawSlide(cv.getContext('2d'),p,i)}
  function dugmeYaz(){tg.textContent='';tg.appendChild(ikon(calis?'dur':'oynat',calis?'':'ikon-dolu'));var e=calis?T('Örneği duraklat','Pause sample'):T('Örneği oynat','Play sample');tg.setAttribute('aria-label',e);tg.title=e}
  function bas(){
    if(VID){if(oyn)oyn.resume()}
    else{clearInterval(zam);zam=setInterval(function(){i=(i+1)%p.scenes.length;ciz()},2400)}
  }
  function dur(){if(VID){if(oyn)oyn.pause()}else clearInterval(zam)}
  if(VID){
    oyn=Mo.play(cv,p,{autoplay:calis,loop:true,width:0});
    if(!calis){var P0=p.scenes[0].secs;oyn.seek(P0*0.7)}
  }else{ciz();Mo.ready().then(ciz,ciz);if(calis)bas()}
  if(window.ResizeObserver)new ResizeObserver(function(){if(oyn)oyn.resize();else ciz()}).observe(cer);
  dugmeYaz();
  tg.addEventListener('click',function(){calis=!calis;kullanici=true;if(calis)bas();else dur();dugmeYaz()});
  if(window.MutationObserver)new MutationObserver(function(){if(bos.hidden)dur();else if(calis)bas()}).observe(bos,{attributes:true,attributeFilter:['hidden']});
  d.addEventListener('visibilitychange',function(){if(d.hidden)dur();else if(calis&&!bos.hidden)bas()});
  void kullanici;
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',ornekKur);else ornekKur();
})();
