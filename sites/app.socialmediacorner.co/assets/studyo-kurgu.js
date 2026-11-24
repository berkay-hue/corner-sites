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
  kilit:'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2'
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
    scenes:st.sahneler.map(function(s){return {text:s.text,sub:s.sub,secs:VID?s.secs:0,image:s.gorsel?s.gorsel.img:null}})};
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
  t.scenes=st.sahneler.map(function(s){return {text:s.text,sub:s.sub,secs:VID?s.secs:0}});
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
  var tr=tercihOku(),t=det.draft||{};
  var tp=tr.template&&bul(M.templates,tr.template)?tr.template:(VID?'kinetik':'kart');
  var as=M.aspects[tr.aspect]?tr.aspect:(VID?'9:16':'4:5');
  var ps=!!(tr.palette&&bul(M.palettes,tr.palette));
  var sah=(Array.isArray(t.scenes)?t.scenes:[]).slice(0,MAXS).map(function(s){s=s||{};return {text:String(s.text||''),sub:String(s.sub||''),secs:VID?kis(s.secs>0?s.secs:3.5):0}});
  if(!sah.length)sah=[{text:'',sub:'',secs:VID?3.5:0}];
  return {taslak:t,sahneler:sah,aciklama:String(t.caption||''),
    t:{template:tp,aspect:as,palette:ps?tr.palette:'',paletSecildi:ps,vurgu:/^#[0-9a-f]{6}$/i.test(tr.vurgu||'')?tr.vurgu.toLowerCase():'',
      ad:typeof tr.ad==='string'&&tr.ad?tr.ad:String((det.marka&&det.marka.name)||'').slice(0,60),kulp:typeof tr.kulp==='string'?tr.kulp.slice(0,40):''},
    oynat:null,slayt:0,iptal:null,mesgul:false,basla:[0],toplam:0,surukle:false};
}

/* ================= DÜZENLEYİCİ ================= */
function kur(det){
  M=window.SmcMotor;
  if(st&&st.oynat){try{st.oynat.stop()}catch(e){}}
  if(st&&st.iptal){try{st.iptal.abort()}catch(e){}}
  if(R.ro){try{R.ro.disconnect()}catch(e){}}
  var eski=kok.querySelector('.kr');if(eski)eski.remove();
  var hn=kok.querySelector('.kr-hata');if(hn)hn.remove();
  st=durumKur(det);R={};baslangiclar();
  var arac=kok.querySelector('.st-arac');

  var kr=el('div','kr');R.kr=kr;
  var iz=el('div','kr-izgara');kr.appendChild(iz);
  iz.appendChild(sahneKur());
  var pn=el('div','kr-panel');iz.appendChild(pn);
  pn.appendChild(aktarKur());
  var genis=kok.getBoundingClientRect().width>=600||window.innerWidth>1023;
  pn.appendChild(grup('tasarim',T('Tasarım','Design'),tasarimKur(),true));
  pn.appendChild(grup('marka',T('Marka','Brand'),markaKur(),genis));
  pn.appendChild(grup('sahne',VID?T('Sahneler','Scenes'):T('Slaytlar','Slides'),sahnelerKur(),genis));
  var ac=aciklamaKur(arac);pn.appendChild(grup('aciklama',T('Gönderi açıklaması','Post caption'),ac,false));

  var yer=kok.querySelector('.st-motor-yer');if(yer)yer.hidden=true;
  kok.insertBefore(kr,kok.firstChild);

  ozetYaz();oynaticiKur();
  R.ro=new ResizeObserver(function(){if(!st)return;if(st.oynat)st.oynat.resize();else slaytCiz();kucuklerZamanla()});
  R.ro.observe(R.cerceve);
  M.ready().then(function(){hazir()},function(){hazir()});
  setTimeout(hazir,2500);
  kucuklerZamanla();
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
  cv.addEventListener('keydown',tusla);
  cv.addEventListener('click',function(){if(VID)oynatDurdur()});
  cer.appendChild(cv);
  if(VID){
    var b=el('button','kr-buyuk');b.type='button';b.appendChild(ikon('oynat','ikon-dolu'));b.setAttribute('aria-label',T('Önizlemeyi oynat','Play preview'));
    b.addEventListener('click',function(){oynatDurdur();R.tuval.focus({preventScroll:true})});R.buyuk=b;cer.appendChild(b);
  }
  k.appendChild(cer);
  oranYaz();

  var kn=el('div','kr-kontrol');kn.setAttribute('role','group');kn.setAttribute('aria-label',VID?T('Oynatma','Playback'):T('Slayt gezinme','Slide navigation'));
  if(VID){
    var o=dugme('btn-cizgi kr-ikon-d',null,null,T('Oynat','Play'));o.addEventListener('click',oynatDurdur);R.oyn=o;kn.appendChild(o);
    var r=el('input','kr-kaydir');r.type='range';r.min='0';r.step='0.05';r.value='0';r.max=String(st.toplam||1);r.setAttribute('aria-label',T('Önizleme konumu','Preview position'));
    r.addEventListener('pointerdown',function(){st.surukle=true});
    r.addEventListener('pointerup',function(){st.surukle=false});
    r.addEventListener('pointercancel',function(){st.surukle=false});
    r.addEventListener('input',function(){if(st.oynat){st.oynat.seek(+r.value);zamanda(+r.value,st.toplam,true)}});
    r.addEventListener('keydown',function(e){if(e.key===' '){e.preventDefault();oynatDurdur()}});
    R.kaydir=r;kn.appendChild(r);
    R.saat=el('span','kr-saat','0:00 / 0:00');R.saat.setAttribute('aria-hidden','true');kn.appendChild(R.saat);
  }else{
    var g=dugme('btn-cizgi kr-ikon-d','geri',null,T('Önceki slayt','Previous slide'));g.addEventListener('click',function(){if(!pasifMi(g))slaytGit(st.slayt-1)});R.onceki=g;kn.appendChild(g);
    R.noktalar=el('div','kr-noktalar');R.noktalar.setAttribute('role','group');R.noktalar.setAttribute('aria-label',T('Slaytlar','Slides'));kn.appendChild(R.noktalar);
    R.sira=el('span','kr-saat');R.sira.setAttribute('aria-live','polite');kn.appendChild(R.sira);
    var n=dugme('btn-cizgi kr-ikon-d','ileri',null,T('Sonraki slayt','Next slide'));n.addEventListener('click',function(){if(!pasifMi(n))slaytGit(st.slayt+1)});R.sonraki=n;kn.appendChild(n);
  }
  k.appendChild(kn);

  var sr=el('ol','kr-serit');sr.setAttribute('aria-label',VID?T('Sahnelere git','Go to scene'):T('Slaytlara git','Go to slide'));R.serit=sr;k.appendChild(sr);
  seritKur();if(!VID)noktaKur();
  return k;
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
  if(e.key===' '||e.key==='Spacebar'){if(VID){e.preventDefault();oynatDurdur()}return}
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
    e.preventDefault();var y=e.key==='ArrowRight'?1:-1;
    if(VID&&st.oynat){st.oynat.seek(st.oynat.time+y);zamanda(st.oynat.time,st.toplam,true)}else if(!VID)slaytGit(st.slayt+y);
  }
}

/* video oynatıcı */
var sonSn=-1,sonTop=-1,sonI=-1;
function oynaticiKur(){
  sonSn=sonTop=sonI=-1;
  if(!VID){slaytCiz();return}
  st.oynat=M.play(R.tuval,proje(),{autoplay:!AZ,loop:true,onTime:function(t,top){zamanda(t,top)}});
  if(AZ){st.oynat.seek(oturan(0))}
  oynatYaz();
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
  if(st.oynat.playing)st.oynat.pause();else st.oynat.resume();
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
  if(!st.oynat)return;
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
  var h=el('h3','kr-aktar-h',T('Dışa aktar','Export'));h.id='kr-aktar-h-'+MOD;k.appendChild(h);
  var f=M.videoFormat(),dg=el('div','kr-aktar-d');
  if(VID){
    var etk=f&&f.ext==='mp4'?T('MP4 indir','Download MP4'):T('WebM indir','Download WebM');
    var vb=dugme('btn-ana kr-aktar-ana','video',etk);R.videoB=vb;
    if(!f){pasif(vb,true);vb.hidden=true}
    vb.addEventListener('click',function(){if(!pasifMi(vb))videoAktar()});dg.appendChild(vb);
    var pb=dugme('btn-cizgi','indir',T('Bu kareyi PNG indir','Download this frame as PNG'));R.pngB=pb;
    pb.addEventListener('click',function(){if(!pasifMi(pb))pngAktar()});dg.appendChild(pb);
  }else{
    var hb=dugme('btn-ana kr-aktar-ana','indir',T('Tüm slaytları indir','Download all slides'));R.hepsiB=hb;hb.addEventListener('click',function(){if(!pasifMi(hb))hepsiAktar()});dg.appendChild(hb);
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
  var ac=new AbortController();st.iptal=ac;
  if(st.oynat)st.oynat.pause();mesgul(true);aktarNot('');
  R.kayit.hidden=false;ilerleYaz(0);
  S.durum(T('Video kaydı başladı. Yaklaşık '+sureSoz(st.toplam)+' sürer.','Video recording started. It takes about '+sureSoz(st.toplam)+'.'));
  var ad='smc-'+slug()+'.';
  M.exportVideo(proje(),{signal:ac.signal,onProgress:ilerleYaz}).then(function(r){
    indir(r.blob,ad+r.ext);var m=T('Video indirildi ('+r.ext.toUpperCase()+').','Video downloaded ('+r.ext.toUpperCase()+').');aktarNot(m,'ok');S.toast(m);S.durum(m);
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
  if(st.oynat){st.oynat.setProject(proje());zamanda(st.oynat.time,st.toplam,true)}else slaytCiz();
  ozetYaz();kucuklerZamanla();
  if(o.tercih)tercihYaz();
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
    x.i.addEventListener('change',function(){if(!x.i.checked)return;st.t.aspect=a;oranYaz();if(st.oynat)st.oynat.resize();guncelle({tercih:true});S.durum(T('Oran: ','Aspect ratio: ')+a)});
    g2.appendChild(x.k);
  });
  f2.appendChild(g2);ic.appendChild(f2);

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
    clearTimeout(tz);tz=setTimeout(function(){guncelle()},60)});
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
  st.sahneler.splice(i,1);
  if(!VID&&st.slayt>=st.sahneler.length)st.slayt=st.sahneler.length-1;
  listeKur();guncelle({yapi:true});
  var j=Math.min(i,st.sahneler.length-1);
  var t=R.liste.querySelector('[data-i="'+j+'"] textarea');if(t)t.focus({preventScroll:false});
  S.durum(T(tekil(i)+' silindi.',tekil(i)+' deleted.'));
}

/* ---- Pexels görselleri (isteğe bağlı; kullanıcı seçmeden hiçbir sahneye görsel eklenmez) ----
   A9b: Pexels yalnız Pro/Enterprise. Quota plan anon|basic dediyse ya da /gen/stock 403 plan döndüyse seçici açılmaz,
   satırda kilit durumu çıkar ("Pro'da var" + kısa açıklama + planlar bağlantısı). Plan bilinmiyorsa (eski worker) eski davranış. */
var PX='https://www.pexels.com',SK=null;
function stokVar(){return !!(S.D&&S.D.stock===true)}
function stokKilit(){var D=S.D||{};return !stokVar()&&(D.stokKilit===true||D.plan==='anon'||D.plan==='basic')}
function kilitSatir(i){
  var k=el('div','kr-so-gorsel kr-gorsel-kilit'),id='kr-kilit-'+MOD+'-'+i;
  var r=el('span','kr-pro-rozet');r.appendChild(ikon('kilit'));r.appendChild(el('span',null,T('Pro’da var','In Pro')));k.appendChild(r);
  var m=el('span','ipucu kr-gorsel-ipucu',T('Sahnelere Pexels fotoğrafı ekleme Pro ve Enterprise planlarında.','Adding Pexels photos to scenes comes with the Pro and Enterprise plans.'));m.id=id;k.appendChild(m);
  var a=el('a','kr-kilit-bag',T('Planları gör','See plans'));a.href=EN?'/en/pricing':'/fiyatlar';a.setAttribute('aria-describedby',id);k.appendChild(a);
  return k;
}
function kaynakAdlari(){var a=[];st.sahneler.forEach(function(s){var n=s.gorsel&&s.gorsel.photographer;if(n&&a.indexOf(n)<0)a.push(n)});return a}
function kaynakMetni(){
  var a=kaynakAdlari();if(!a.length)return '';
  return EN?(a.length===1?'Photo by ':'Photos by ')+a.join(', ')+' on Pexels':(a.length===1?'Fotoğraf: ':'Fotoğraflar: ')+a.join(', ')+' (Pexels)';
}
function kaynakYaz(){if(!R.kaynak||!st)return;var m=kaynakMetni();R.kaynak.hidden=!m;R.kaynakMetin.textContent=m}
function dis(a,href,metin){a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=metin;return a}
function kunye(g){
  var p=el('p','kr-gorsel-kunye');
  if(EN){p.appendChild(d.createTextNode('Photo by '));p.appendChild(dis(el('a'),g.photographer_url||g.url||PX,g.photographer||'Pexels'));p.appendChild(d.createTextNode(' on '));p.appendChild(dis(el('a'),g.url||PX,'Pexels'))}
  else{p.appendChild(d.createTextNode('Fotoğraf: '));p.appendChild(dis(el('a'),g.photographer_url||g.url||PX,g.photographer||'Pexels'));p.appendChild(d.createTextNode(' · '));p.appendChild(dis(el('a'),g.url||PX,'Pexels'))}
  return p;
}
function gorselSatir(s,i){
  if(!s.gorsel&&stokKilit())return GS&&i>0?null:kilitSatir(i);
  if(!s.gorsel&&!stokVar())return null;
  if(!s.gorsel&&gTercih()==='yok')return null;
  var k=el('div','kr-so-gorsel');
  if(!s.gorsel){
    var b=dugme('btn-cizgi kr-gorsel-ekle','resim',T('Görsel ekle','Add image'));
    b.appendChild(el('span','sr',T(' · '+tekil(i),' · '+tekil(i))));
    b.setAttribute('aria-haspopup','dialog');
    b.addEventListener('click',function(){secici(i,b)});
    k.appendChild(b);k.appendChild(el('span','ipucu kr-gorsel-ipucu',T('İsteğe bağlı · Pexels fotoğrafları','Optional · photos from Pexels')));
    return k;
  }
  var g=s.gorsel;k.classList.add('kr-so-gorsel-var');
  var im=el('img','kr-gorsel-kucuk');im.src=g.thumb;im.alt=g.alt||'';im.width=44;im.height=44;im.decoding='async';k.appendChild(im);
  k.appendChild(kunye(g));
  var ar=el('div','kr-gorsel-arac');
  var dg=dugme('btn-hafif kr-gorsel-degis','resim',T('Değiştir','Change'));dg.appendChild(el('span','sr',' · '+tekil(i)));dg.setAttribute('aria-haspopup','dialog');
  dg.addEventListener('click',function(){secici(i,dg)});
  var kl=dugme('btn-hafif kr-gorsel-kaldir','kapat',T('Kaldır','Remove'));kl.appendChild(el('span','sr',' · '+tekil(i)));
  kl.addEventListener('click',function(){
    st.sahneler[i].gorsel=null;gorselYenile(i,'.kr-gorsel-ekle');guncelle();
    S.durum(T(tekil(i)+' görseli kaldırıldı.',tekil(i)+' image removed.'));
  });
  ar.appendChild(dg);ar.appendChild(kl);k.appendChild(ar);
  return k;
}
function gorselYenile(i,odak){
  var li=R.liste&&R.liste.querySelector('[data-i="'+i+'"]');if(!li)return;
  var es=li.querySelector('.kr-so-gorsel'),y=gorselSatir(st.sahneler[i],i);
  if(es&&y)li.replaceChild(y,es);else if(es)es.remove();else if(y)li.appendChild(y);
  if(odak&&y){var b=y.querySelector(odak);if(b)b.focus()}
}
function stokYonu(){var a=st.t.aspect;return a==='16:9'?'landscape':a==='1:1'?'square':'portrait'}
function stokHata(e){
  var k=e&&e.kod;
  if(k==='not_ready')return T('Görsel arama şu an kullanılamıyor.','Image search isn’t available right now.');
  if(k==='plan')return T('Görsel arama Pro ve Enterprise planlarında var.','Image search comes with the Pro and Enterprise plans.');
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
  x.tekrar=dugme('btn-cizgi','tekrar',T('Tekrar dene','Try again'));x.hata.appendChild(x.tekrar);x.govde.appendChild(x.hata);
  x.daha=dugme('btn-cizgi kr-stok-daha',null,T('Daha fazla göster','Show more'));x.daha.hidden=true;ic.appendChild(x.daha);
  var alt=el('div','kr-stok-alt');
  x.vazgec=dugme('btn-hafif kr-stok-vazgec',null,T('Görselsiz devam','Continue without an image'));alt.appendChild(x.vazgec);
  var pk=el('p','kr-stok-pexels');pk.appendChild(d.createTextNode(T('Fotoğraflar ','Photos provided by ')));pk.appendChild(dis(el('a'),PX,'Pexels'));if(!EN)pk.appendChild(d.createTextNode(' sağlıyor'));
  alt.appendChild(pk);ic.appendChild(alt);
  d.body.appendChild(dlg);
  x.dlg=dlg;x.h=h;x.q=q;x.f=f;x.ac=null;x.sira=0;x.sonuc=[];x.sayfa=1;x.sonraki=false;x.onbellek={};x.i=0;x.acan=null;x.odak=null;
  function kapat(){if(dlg.close){if(dlg.open)dlg.close()}else{dlg.removeAttribute('open');kapandi()}}
  function kapandi(){
    if(x.ac){try{x.ac.abort()}catch(e){}x.ac=null}x.sira++;
    var o=x.odak||x.acan;x.odak=null;x.acan=null;if(o&&o.isConnected&&o.focus)o.focus();
  }
  x.kapat=kapat;
  kp.addEventListener('click',kapat);
  x.vazgec.addEventListener('click',function(){var yok=!(st&&st.sahneler[x.i]&&st.sahneler[x.i].gorsel);kapat();if(yok)S.durum(T('Görsel eklenmedi; sahne görselsiz kalır.','No image added; the scene stays without one.'))});
  dlg.addEventListener('close',kapandi);
  dlg.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&!dlg.close){e.preventDefault();kapat();return}
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
function odakla(b,j){b.forEach(function(z,k){z.tabIndex=k===j?0:-1});if(b[j])b[j].focus()}
function seciciDurum(tur,m){
  var x=SK;x.hata.hidden=tur!=='hata';x.bos.hidden=tur!=='bos';
  if(tur==='hata'){x.hataM.textContent=m;x.tekrar.hidden=/kullanılamıyor|isn’t available|hakkın doldu|renew tomorrow/.test(m)}
  if(tur==='bos'){x.bos.textContent='';x.bos.appendChild(el('p','kr-stok-bos-b',m));x.bos.appendChild(el('p','ipucu',T('Daha genel bir kelime dene: “kahve” yerine “kafe”, “toplantı” yerine “ofis” gibi.','Try a broader word, like “cafe” instead of “latte” or “office” instead of “meeting”.')))}
}
function iskelet(){
  var x=SK;x.izgara.textContent='';x.izgara.setAttribute('aria-busy','true');x.izgara.setAttribute('data-yon',stokYonu());
  for(var k=0;k<6;k++){var z=el('span','isk kr-stok-isk');z.setAttribute('aria-hidden','true');x.izgara.appendChild(z)}
}
function ara(sayfa){
  var x=SK,qq=x.q.value.trim();
  if(!qq){x.q.focus();seciciDurum('bos',T('Aramak için bir kelime yaz.','Type a word to search.'));x.izgara.textContent='';x.daha.hidden=true;return}
  var yon=stokYonu(),an=qq.toLocaleLowerCase(EN?'en':'tr')+'|'+yon+'|'+sayfa;
  if(x.ac){try{x.ac.abort()}catch(e){}}
  var sira=++x.sira,ac=window.AbortController?new AbortController():null;x.ac=ac;
  seciciDurum('');x.daha.hidden=true;
  if(sayfa===1){x.sonuc=[];iskelet()}else{pasif(x.daha,true);x.daha.hidden=false;x.daha.setAttribute('aria-busy','true')}
  x.durum.textContent=T('Görseller yükleniyor…','Loading images…');
  var pr=x.onbellek[an]?Promise.resolve(x.onbellek[an]):S.stok('q='+encodeURIComponent(qq)+'&orientation='+yon+'&page='+sayfa,ac);
  pr.then(function(r){
    if(sira!==x.sira)return;x.ac=null;x.onbellek[an]=r;
    var ph=Array.isArray(r.photos)?r.photos:[],ilkYeni=x.sonuc.length;
    x.sonuc=x.sonuc.concat(ph);x.sayfa=sayfa;x.sonraki=!!r.next&&sayfa<100;
    izgaraYaz(ilkYeni,sayfa>1);
    x.daha.hidden=!x.sonraki;pasif(x.daha,false);x.daha.removeAttribute('aria-busy');
    if(!x.sonuc.length){seciciDurum('bos',T('“'+qq+'” için fotoğraf bulunamadı.','No photos found for “'+qq+'”.'));x.durum.textContent=T('Sonuç yok.','No results.')}
    else x.durum.textContent=EN?x.sonuc.length+' photos shown. Use the arrow keys to move between them.':x.sonuc.length+' fotoğraf gösteriliyor. Aralarında oklarla gezinebilirsin.';
  },function(e){
    if(sira!==x.sira)return;x.ac=null;
    if(e&&e.kod==='not_ready'){S.D.stock=false;stokYayin()}
    if(e&&e.kod==='plan'){
      /* 403 plan: seçici kapanır, satırlar kilide döner, odak o satırın planlar bağlantısına gider */
      S.D.stock=false;S.D.stokKilit=true;x.odak=null;stokYayin();
      var li=R.liste&&R.liste.querySelector('[data-i="'+x.i+'"]');x.odak=li&&li.querySelector('.kr-kilit-bag');
      x.kapat();S.durum(stokHata(e));return}
    x.izgara.removeAttribute('aria-busy');if(sayfa===1)x.izgara.textContent='';
    x.daha.hidden=!(sayfa>1&&x.sonraki);pasif(x.daha,false);x.daha.removeAttribute('aria-busy');
    var m=stokHata(e);seciciDurum('hata',m);x.durum.textContent=m;
  });
}
function izgaraYaz(ilkYeni,ekle){
  var x=SK;x.izgara.removeAttribute('aria-busy');if(!ekle)x.izgara.textContent='';
  x.izgara.setAttribute('data-yon',stokYonu());
  x.sonuc.slice(ilkYeni).forEach(function(p,k){
    var j=ilkYeni+k,b=el('button','kr-stok-foto');b.type='button';b.tabIndex=-1;
    var ad=String(p.photographer||'Pexels'),alt=String(p.alt||'').trim();
    b.setAttribute('aria-label',(alt||T('Fotoğraf','Photo'))+T(' · Fotoğraf: '+ad,' · Photo by '+ad));
    var im=el('img');im.alt='';im.loading='lazy';im.decoding='async';im.src=(p.src&&(p.src.medium||p.src.small||p.src.tiny))||'';b.appendChild(im);
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
  var u=p.src&&(p.src.large2x||p.src.large||p.src.original);if(!u)return;
  b.setAttribute('aria-busy','true');b.classList.add('kr-stok-yukleniyor');
  x.durum.textContent=T('Fotoğraf yükleniyor…','Loading the photo…');
  var im=new Image();im.crossOrigin='anonymous';im.decoding='async';
  var sira=x.sira;
  im.onload=function(){
    b.removeAttribute('aria-busy');b.classList.remove('kr-stok-yukleniyor');
    if(sira!==x.sira||!st||st.sahneler[i]!==s)return;
    if(!(im.naturalWidth>0)){im.onerror();return}
    s.gorsel={img:im,id:p.id,photographer:String(p.photographer||''),photographer_url:p.photographer_url||'',url:p.url||PX,alt:String(p.alt||''),thumb:(p.src&&(p.src.tiny||p.src.small))||u};
    x.odak=null;gorselYenile(i);
    var li=R.liste.querySelector('[data-i="'+i+'"]');x.odak=li&&li.querySelector('.kr-gorsel-degis');
    x.kapat();guncelle();
    if(VID)sahneyeGit(i);else slaytGit(i);
    S.durum(T(tekil(i)+' için görsel eklendi. Fotoğraf: '+s.gorsel.photographer+' (Pexels).','Image added to '+tekil(i).toLowerCase()+'. Photo by '+s.gorsel.photographer+' on Pexels.'));
  };
  im.onerror=function(){
    b.removeAttribute('aria-busy');b.classList.remove('kr-stok-yukleniyor');if(sira!==x.sira)return;
    var m=T('Bu fotoğraf yüklenemedi; başka birini seç.','This photo couldn’t load; pick another one.');x.durum.textContent=m;S.toast(m);
  };
  im.src=u;
}
function secici(i,tetik){
  if(!st||!st.sahneler[i])return;
  var x=seciciKur(),s=st.sahneler[i];x.i=i;x.acan=tetik;x.odak=null;
  x.hedef.textContent=T(tekil(i)+' için arka plan. Sen seçmedikçe görsel eklenmez.','Background for '+tekil(i).toLowerCase()+'. Nothing is added unless you pick a photo.');
  x.vazgec.textContent=s.gorsel?T('Vazgeç','Cancel'):T('Görselsiz devam','Continue without an image');
  var on=String(s.text||'').replace(/\*/g,'').replace(/\s+/g,' ').trim();
  if(!on)on=String(s.sub||(st.taslak&&st.taslak.title)||'').replace(/\*/g,'').replace(/\s+/g,' ').trim();
  x.q.value=on.slice(0,100);
  x.izgara.textContent='';x.sonuc=[];x.sayfa=1;x.daha.hidden=true;seciciDurum('');
  if(x.dlg.showModal){if(!x.dlg.open)x.dlg.showModal()}else x.dlg.setAttribute('open','');
  x.q.focus();x.q.select();
  if(x.q.value)ara(1);else seciciDurum('bos',T('Aramak için bir kelime yaz.','Type a word to search.'));
}
/* kota yanıtı stock bilgisini getirir; durum değişince yalnız görsel satırları yeniden çizilir (yazılan metne dokunulmaz) */
var sonStok=null;
function stokYayin(){
  gYaz();
  var v=stokVar()?'acik':stokKilit()?'kilit':'yok';if(v===sonStok)return;sonStok=v;
  if(v!=='acik'&&SK&&SK.dlg.open){/* açık seçici hatayı gösterir; kapatınca satırlar güncellenir */}
  if(!st||!R.liste)return;st.sahneler.forEach(function(s,i){gorselYenile(i)});
}
d.addEventListener('studyo:hak',function(){gHak=true;stokYayin()});

/* ---- A11-4: formdaki "Sahne görselleri" seçimi (Görselsiz / Görselli · Pexels) ----
   Yalnız tarayıcıda: /gen/video gövdesine girmez (worker'da görsel alanı yok; kabuk alanları tek tek okur). Seçim, taslaktaki
   sahne satırlarında "Görsel ekle"yi açar/kapar; taslak geldikten sonra değişirse satırlar hemen yenilenir.
   Durum: bekle (kota yanıtı yok) · acik (stock true) · kilit (anon/basic ya da 403 plan) · yok (anahtar yok / plan bilinmiyor).
   Erişim yoksa "Görselli" gizlenmez: kilit ikonu + nedeni görünür, odaklanabilir kalır (aria-disabled), seçilince geri alınıp
   nedeni duyurulur. Form yoksa (görsel/karusel sayfası) eski davranış: stock açıksa her satırda "Görsel ekle". */
var GS=$('#gorsel-secim'),GTK='smc-gorsel-'+MOD,gHak=false,gSon='';
var gYok=GS&&GS.querySelector('input[value="yok"]'),gStok=GS&&GS.querySelector('input[value="stok"]'),gNot=GS&&$('#gorsel-not');
function gTercih(){if(!GS)return 'stok';return gStok&&gStok.checked&&stokVar()?'stok':'yok'}
function gDurum(){return stokVar()?'acik':stokKilit()?'kilit':gHak?'yok':'bekle'}
function gUye(){var u=$('.st-ust[data-hesap]');return !!(u&&u.getAttribute('data-hesap')==='uye')}
function gNeden(){
  var dr=gDurum();
  if(dr==='kilit')return T('Görselli seçenek Pro ve Enterprise planlarıyla açılır.','The image option comes with the Pro and Enterprise plans.');
  if(dr==='yok')return T('Görsel arama şu an kullanılamıyor; taslak görselsiz hazırlanır.','Image search isn’t available right now; the draft is made without images.');
  return T('Plan bilgisi alınıyor…','Checking your plan…');
}
function gNotYaz(){
  if(!gNot)return;var dr=gDurum();gNot.textContent='';
  if(dr==='acik'){
    gNot.textContent=gStok.checked
      ?T('Taslak gelince her sahnede “Görsel ekle” çıkar; fotoğrafı Pexels’ten sen seçersin, seçmediğin sahne görselsiz kalır.','When the draft arrives, each scene gets “Add image”; you pick the Pexels photo, and scenes you skip stay image-free.')
      :T('Sahneler yalnız metin ve renkle hazırlanır. Görsel istersen “Görselli”yi seç.','Scenes use text and color only. Pick “With images” if you want photos.');
    return;
  }
  if(dr==='kilit'){
    gNot.appendChild(d.createTextNode(T('Görselli: her sahneye Pexels stok fotoğrafı. Bu seçenek Pro ve Enterprise planlarıyla açılır','With images: a Pexels stock photo on each scene. This option comes with the Pro and Enterprise plans')+
      (gUye()?T('; hesabında şu an bu planlardan biri tanımlı değil. ','; your account isn’t on one of these plans yet. '):'. ')));
    var a=el('a','st-gorsel-bag',T('Planları gör','See plans'));a.href=EN?'/en/pricing':'/fiyatlar';gNot.appendChild(a);
    return;
  }
  gNot.textContent=gNeden();
}
function gYaz(){
  if(!GS)return;var dr=gDurum(),ilk=gSon!==dr&&dr==='acik';
  GS.setAttribute('data-durum',dr);
  if(dr==='acik'){
    gStok.removeAttribute('aria-disabled');
    if(ilk){var k=null;try{k=S.depo(GTK)}catch(e){}(k==='yok'?gYok:gStok).checked=true}
  }else{gStok.setAttribute('aria-disabled','true');if(gStok.checked)gYok.checked=true}
  gSon=dr;gNotYaz();
}
if(GS){
  [gYok,gStok].forEach(function(r){r.addEventListener('change',function(){
    if(gStok.checked&&gDurum()!=='acik'){gYok.checked=true;var m=gNeden();S.durum(m);S.toast(m);gNotYaz();return}
    try{S.depo(GTK,gStok.checked?'stok':'yok')}catch(e){}
    gNotYaz();
    if(st&&R.liste)st.sahneler.forEach(function(s,i){gorselYenile(i)});
    S.durum(gStok.checked?T('Görselli seçildi: sahnelere Pexels fotoğrafı ekleyebilirsin.','With images: you can add Pexels photos to scenes.'):T('Görselsiz seçildi: sahneler yalnız metin ve renkle.','No images: scenes use text and color only.'));
  })});
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
  ta.addEventListener('input',function(){st.aciklama=ta.value;sayacYaz(ta,say,UZ_ACK);senkron();ozetYaz()});
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
    try{kur(det);var y=$('#sb-yer');if(y){y.textContent='';y.hidden=true}n.remove();if(R.tuval)R.tuval.focus({preventScroll:true})}
    catch(x){var kr=kok.querySelector('.kr');if(kr)kr.remove();var yer=kok.querySelector('.st-motor-yer');if(yer)yer.hidden=true;S.durum(T('Önizleme yine açılamadı.','The preview still couldn’t open.'))}
  });
  n.appendChild(b);
  kok.insertBefore(n,kok.firstChild);
  if(window.console&&console.warn)console.warn('kurgu',e&&e.message);
}
kok.addEventListener('studyo:taslak',function(e){
  var det=e.detail||{};
  if(!window.SmcMotor||!det.draft)return;
  try{kur(det);e.preventDefault()}
  catch(x){
    var kr=kok.querySelector('.kr');if(kr)kr.remove();
    if(st&&st.oynat){try{st.oynat.stop()}catch(z){}}
    var arac=kok.querySelector('.st-arac');if(arac&&arac.parentNode!==kok)kok.appendChild(arac);
    st=null;hataGoster(det,x);
  }
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
