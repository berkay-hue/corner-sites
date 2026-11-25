/* Stüdyo · LinkedIn (A8-S2): /gen/linkedin sonucu gerçekçi gönderi kartı, 3 seçenek sekmesi, satır içi düzenleme,
   kopyala, /gen/refine (kısalt/uzat/ton), "Görsele dönüştür" (sessionStorage studyo-kanca → /gorsel).
   Görselli (25.11): #gorsel-secim 'stok' ise taslak gelince konu ile tek Pexels araması; görsel 3 sekmede ortak.
   Kullanıcı metni yalnız textContent/value ile yazılır. */
(function(){'use strict';
var S=window.Studyo;if(!S)return;
var d=document,T=S.T,$=S.$,$$=S.$$,el=S.el,EN=S.dil()==='en';
var KAT=210,LI_MAX=3000;
var ACI={hikaye:T('Hikâye','Story'),liste:T('Liste','List'),gorus:T('Görüş','Opinion')};
var TON={samimi:T('Samimi','Friendly'),profesyonel:T('Profesyonel','Professional'),ogretici:T('Öğretici','Educational'),cesur:T('Cesur','Bold')};
var st={ds:[],i:0,acik:false,duzen:false,onceki:null,mesgul:false,q:null,tids:[],oncekiId:null};
/* görsel işi: no (iş sayacı), ac (AbortController), konu, tek (deneme: 1 görsel), ds (fotoğraflar), i, foto (gösterilen), dr (yuk|hazir|hata|kaldir), hata, kod */
var g={no:0,ac:null,konu:'',tek:false,ds:[],i:0,foto:null,dr:'',hata:'',kod:'',kapsam:'',kirik:0};
var secim=null,gIs=null;

function profil(){try{return window.SMCSes&&SMCSes.oku&&SMCSes.oku()||null}catch(e){return null}}
function basHarf(ad){var p=(ad||'').trim().split(/\s+/).filter(Boolean);if(!p.length)return EN?'YN':'AD';return (p[0].charAt(0)+(p.length>1?p[p.length-1].charAt(0):'')).toLocaleUpperCase(EN?'en':'tr')}
function kartBas(){
  var p=profil(),ad=p&&p.name?p.name:'';
  $('#li-ad').textContent=ad||T('Senin adın','Your name');
  $('#li-av').textContent=basHarf(ad);
}
function metin(){return st.ds[st.i]?st.ds[st.i].text:''}
function katla(t){
  /* LinkedIn akışı ~210 karakterden ya da 3 satırdan sonra keser; kelime sınırında kes */
  var satirlar=t.split('\n'),uc=-1,say=0;
  for(var n=0;n<satirlar.length;n++){if(n>=3){uc=say;break}say+=satirlar[n].length+1;if(say>KAT){uc=KAT;break}}
  if(uc<0||uc>=t.length)return null;
  var k=t.slice(0,uc),b=k.lastIndexOf(' ');if(b>uc*0.6)k=k.slice(0,b);
  return k.replace(/[\s.,;:!?…-]+$/,'');
}
function govdeYaz(){
  var g=$('#li-govde'),t=metin(),k=st.acik?null:katla(t);g.textContent='';
  if(k===null){g.appendChild(d.createTextNode(t));return}
  g.appendChild(d.createTextNode(k));
  var b=el('button','li-devam',T('…devamını gör','…see more'));b.type='button';b.setAttribute('aria-label',T('Gönderinin devamını gör','See the rest of the post'));
  b.addEventListener('click',function(){st.acik=true;govdeYaz();g.focus()});
  g.appendChild(d.createTextNode(' '));g.appendChild(b);
}
function olcuYaz(){
  var o=$('#li-olcu'),t=metin(),n=Array.from(t).length,k=katla(t);o.textContent='';
  o.appendChild(d.createTextNode(T(n+' karakter',n+' characters')+' · '+(k===null?T('katlanmadan tamamı görünür','fully visible without “see more”'):T('ilk '+Array.from(k).length+' karakter katlanmadan görünür','first '+Array.from(k).length+' characters show before “see more”'))));
  if(n>LI_MAX){var u=el('span','uyari',' · '+T('LinkedIn sınırı 3000 karakter; kısalt.','LinkedIn’s limit is 3,000 characters; shorten it.'));o.appendChild(u)}
}
function sekmeYaz(){
  var s=$('#sekmeler');s.textContent='';
  st.ds.forEach(function(x,n){
    var b=el('button',null,ACI[x.angle]||T('Seçenek ','Option ')+(n+1));b.type='button';b.id='sekme-'+n;
    b.setAttribute('role','tab');b.setAttribute('aria-selected',n===st.i?'true':'false');b.setAttribute('aria-controls','li-panel');b.tabIndex=n===st.i?0:-1;
    b.addEventListener('click',function(){sec(n,false)});
    s.appendChild(b);
  });
  s.hidden=st.ds.length<2;
  $('#li-panel').setAttribute('aria-labelledby','sekme-'+st.i);
}
function sec(n,odak){
  if(st.duzen)duzenBitir();
  st.i=n;st.acik=false;st.onceki=null;geriYaz();sekmeYaz();govdeYaz();olcuYaz();not('');S.planlaYaz(st.tids[n]);
  if(odak){var b=$('#sekme-'+n);if(b)b.focus()}
}
function not(m,tur){var e=$('#cubuk-not');e.textContent=m||'';e.className='st-cubuk-not not'+(m&&tur?' not-'+tur:'')}
function geriYaz(){var g=$('#li-geri');if(g)g.hidden=st.onceki===null}

/* düzenleme: kartın içinde textarea; bitince karta geri döner */
function duzenBasla(){
  var ta=$('#li-duzen'),g=$('#li-govde'),b=$('#li-duzenle');
  st.duzen=true;ta.value=metin();ta.hidden=false;g.hidden=true;b.setAttribute('aria-pressed','true');b.lastChild.textContent=T('Bitti','Done');
  ta.focus();
}
function duzenBitir(){
  var ta=$('#li-duzen'),g=$('#li-govde'),b=$('#li-duzenle');
  if(st.ds[st.i])st.ds[st.i].text=ta.value;
  st.duzen=false;ta.hidden=true;g.hidden=false;b.setAttribute('aria-pressed','false');b.lastChild.textContent=T('Düzenle','Edit');
  st.acik=true;govdeYaz();olcuYaz();
}

/* refine: üretim hakkı düşmez; gün içinde 9 düzenleme */
var RMESAJ={
  shorten:[T('Kısaltılıyor…','Shortening…'),T('Kısaltıldı.','Shortened.')],
  lengthen:[T('Uzatılıyor…','Lengthening…'),T('Uzatıldı.','Lengthened.')],
  tone:[T('Ton değiştiriliyor…','Changing the tone…'),T('Ton değişti.','Tone changed.')]
};
function refineHata(h){
  var k=h&&h.kod;
  if(k==='login_required')return S.DUVAR.giris.b;
  if(k==='trial_ended')return S.DUVAR.deneme.h+'.';
  if(k==='limit')return h.scope==='ip'||h.scope==='global'?S.DUVAR[h.scope].b:S.SINIR;
  if(k==='bad_input'&&h.field==='text')return T('Metin düzenlenemedi; 1–3000 karakter olmalı.','The text couldn’t be edited; it must be 1–3,000 characters.');
  if(k==='bad_input'&&h.field==='anon')return T('Düzenleme için önce bugün bir taslak üret.','Write a draft today before editing.');
  if(k==='llm_busy')return T('Yoğunluk var, 1 dakika sonra dene.','It’s busy right now; try again in a minute.');
  if(k==='ag')return T('Bağlantı yok. İnternete bağlanınca tekrar dene.','No connection. Try again once you’re online.');
  if(k==='zaman')return T('Yanıt gelmedi. Biraz sonra tekrar dene.','No response came back. Try again a bit later.');
  if(k==='not_ready')return T('Araç henüz açılmadı.','The tool isn’t open yet.');
  return T('Bu sefer olmadı, tekrar dene. Hakkın düşmedi.','It didn’t work this time; try again. No credit used.');
}
function arMesgul(m){st.mesgul=m;$$('[data-op]').forEach(function(b){if(m)b.setAttribute('aria-disabled','true');else b.removeAttribute('aria-disabled')});var a=$('#li-arac');if(a)a.setAttribute('aria-busy',m?'true':'false')}
function refine(op,ton,btn){
  if(st.mesgul||!st.ds[st.i])return;
  if(st.duzen)duzenBitir();
  var t=metin().trim();
  if(!t){not(T('Düzenlenecek metin yok.','There’s no text to edit.'),'hata');return}
  if(t.length>LI_MAX){not(T('Metin 3000 karakteri aşıyor; önce elle kısalt.','The text is over 3,000 characters; shorten it by hand first.'),'hata');return}
  var q={anon:S.D.anon||'',op:op,text:t,lang:S.dil()};
  var a=st.ds[st.i].angle;if(ACI[a])q.angle=a;if(op==='tone')q.tone=ton;
  if(!q.anon){try{q.anon=localStorage.getItem('smc-anon')||''}catch(e){}}
  arMesgul(true);not(RMESAJ[op][0]);S.durum(RMESAJ[op][0]);
  var tm=$('#li-tm');if(tm)tm.open=false;
  S.refine(q).then(function(r){
    arMesgul(false);
    if(!r.text){not(refineHata({kod:'llm_fail'}),'hata');return}
    st.onceki={i:st.i,text:st.ds[st.i].text};st.ds[st.i].text=r.text;if(op==='tone')st.ton=ton;
    st.acik=true;govdeYaz();olcuYaz();geriYaz();tonYaz();
    not(RMESAJ[op][1]+' '+T('İstersen geri alabilirsin.','You can undo it if you like.'),'ok');S.durum(RMESAJ[op][1]);
    if(btn&&btn.focus)btn.focus();
  },function(h){arMesgul(false);var m=refineHata(h||{});not(m,'hata');S.durum(m)});
}
function tonYaz(){var cur=st.ton||(st.q&&st.q.tone)||'samimi';$$('#li-tm [data-ton]').forEach(function(b){b.setAttribute('aria-current',b.getAttribute('data-ton')===cur?'true':'false')})}

/* kanca: görsel için ilk cümle/satır (≤280) */
function kanca(t){var s=(t||'').split('\n').map(function(x){return x.trim()}).filter(Boolean)[0]||'';var m=s.match(/^(.{20,280}?[.!?…])(\s|$)/);s=m?m[1]:s;return s.slice(0,280)}

/* ---- Görselli: gönderi görseli (Pexels) ---- */
var IK={
  indir:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  baska:'<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>',
  kaldir:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  tekrar:'<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  geri:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'
};
function gBtn(ad,yazi,sinif){
  var b=el('button','btn btn-kucuk '+(sinif||'btn-cizgi'));b.type='button';b.setAttribute('data-g',ad);
  var NS='http://www.w3.org/2000/svg',v=d.createElementNS(NS,'svg');v.setAttribute('class','ikon');v.setAttribute('viewBox','0 0 24 24');v.setAttribute('aria-hidden','true');v.setAttribute('focusable','false');
  v.innerHTML=IK[ad]||'';b.appendChild(v);b.appendChild(el('span',null,yazi));return b;
}
function gIptal(){g.no++;if(g.ac)try{g.ac.abort()}catch(e){}g.ac=null}
function gSifir(){gIptal();g.konu='';g.tek=false;g.ds=[];g.i=0;g.foto=null;g.dr='';g.hata='';g.kod='';g.kapsam='';g.kirik=0;gYaz()}
function gAlt(f){return f&&f.alt?String(f.alt).slice(0,200):T('Gönderi görseli (Pexels stok fotoğrafı)','Post image (Pexels stock photo)')}
function gSrc(f){var s=f&&f.src;return s&&(s.large||s.large2x||s.medium)||S.stokSrc(f)}
/* alanı yaz; odak: işlem sonrası odaklanacak düğme (data-g) */
function gYaz(odak){
  var fg=$('#li-gorsel-alan'),alt=$('#li-gorsel-alt');if(!fg||!alt)return;
  var ic=alt.contains(d.activeElement);
  fg.textContent='';alt.textContent='';fg.hidden=true;alt.hidden=true;fg.removeAttribute('aria-busy');
  if(!g.dr)return;
  if(g.dr==='yuk'){
    var sk=el('span','isk li-gorsel-isk');sk.setAttribute('aria-hidden','true');fg.appendChild(sk);fg.setAttribute('aria-busy','true');fg.hidden=false;
    alt.appendChild(el('p','li-gorsel-bilgi',T('Pexels’ten gönderi görseli aranıyor…','Finding a post image on Pexels…')));alt.hidden=false;
    if(ic)alt.focus();return;
  }
  if(g.dr==='hazir'&&g.foto){
    var f=g.foto,im=d.createElement('img');im.alt=gAlt(f);im.decoding='async';
    if(f.width&&f.height){im.width=f.width;im.height=f.height}
    /* gösterilen görsel kırıldı: Pro'da sıradaki foto (çağrısız), değilse hata + Tekrar dene */
    im.addEventListener('error',function(){if(g.foto!==f||g.dr!=='hazir')return;
      if(!g.tek&&g.ds.length>1&&++g.kirik<g.ds.length){g.i=(g.i+1)%g.ds.length;gIptal();gHarca(g.no);S.durum(T('Görsel yüklenemedi; başka fotoğraf deneniyor.','The image didn’t load; trying another photo.'));return}
      gImgHata()});
    im.src=gSrc(f);fg.appendChild(im);fg.hidden=false;
    alt.appendChild(S.stokKunye(f));
    var ar=el('div','st-arac li-gorsel-arac');
    ar.appendChild(gBtn('indir',T('Görseli indir','Download image')));
    if(!g.tek&&g.ds.length>1)ar.appendChild(gBtn('baska',T('Başka görsel','Another image')));
    ar.appendChild(gBtn('kaldir',T('Kaldır','Remove'),'btn-hafif li-gorsel-kaldir'));
    alt.appendChild(ar);
    if(g.tek)alt.appendChild(el('p','li-gorsel-bilgi',T('Deneme görselin bu gönderide kullanıldı. Pro’da sınırsız görsel ve “Başka görsel” var.','Your trial image is used in this post. Pro has unlimited images and “Another image”.')));
    alt.hidden=false;
  }else if(g.dr==='hata'){
    var p=el('p','not not-uyari li-gorsel-not',T('Görsel eklenemedi: ','No image was added: ')+(g.hata||S.stokHataMetni({}))+' '+T('Gönderi metni hazır.','Your post text is ready.'));
    alt.appendChild(p);
    if(gTekrarVar()){var a2=el('div','st-arac li-gorsel-arac');a2.appendChild(gBtn('tekrar',T('Tekrar dene','Try again')));alt.appendChild(a2)}
    alt.hidden=false;
  }else if(g.dr==='kaldir'){
    var a3=el('div','st-arac li-gorsel-arac');a3.appendChild(el('span','li-gorsel-bilgi',T('Görsel kaldırıldı.','Image removed.')));a3.appendChild(gBtn('geri',T('Geri ekle','Add it back'),'btn-hafif'));alt.appendChild(a3);alt.hidden=false;
  }
  var hb=odak?$('[data-g="'+odak+'"]',alt):null;
  if(hb)hb.focus();else if(ic){var ilk=$('button',alt);(ilk||alt).focus()}
}
/* plan/boş/kapalı ya da günlük kişi limitinde (yarın yenilenir) tekrar denemenin anlamı yok; genel yoğunlukta (global) var */
function gTekrarVar(){
  if(g.kod==='plan'||g.kod==='bos'||g.kod==='bad_input'||g.kod==='not_ready'||g.kod==='login_required')return false;
  if(g.kod==='limit'&&g.kapsam!=='global')return false;
  if(g.ds.length)return true;
  var x=S.stokDurum();return x==='acik'||x==='deneme';
}
/* yeni iş: tek arama → (deneme ise) hakkı harca → göster */
function gBasla(konu){
  gIptal();
  var no=g.no,ac=window.AbortController?new AbortController():null;g.ac=ac;
  g.konu=konu;g.tek=S.stokDurum()==='deneme';g.ds=[];g.i=0;g.foto=null;g.dr='yuk';g.hata='';g.kod='';g.kapsam='';g.kirik=0;gYaz();
  S.stokOtomatik(konu,{yon:'landscape',ac:ac}).then(function(r){
    if(no!==g.no)return;g.ac=null;
    var a=r&&r.photos||[];
    if(!a.length){g.dr='hata';g.hata=r&&r.hata||'';g.kod=r&&r.kod||'genel';g.kapsam=r&&r.scope||'';gYaz();S.durum(T('Görsel eklenemedi.','No image was added.'));return}
    g.ds=g.tek?a.slice(0,1):a;g.i=0;gHarca(no);
  });
}
function gImgHata(odak){g.dr='hata';g.kod='img';g.hata=T('Görsel yüklenemedi.','The image couldn’t load.');gYaz(odak?'tekrar':null);S.durum(T('Görsel eklenemedi.','No image was added.'))}
/* önce görsel yüklenir (yüklenemezse hak harcanmaz; Pro'da sıradaki foto denenir), sonra deneme hakkı harcanır.
   Aynı fotoğraf ikinci kez harcanmaz (S.stokHarca id belleği). odak yalnız kullanıcı tetiklediyse verilir. */
function gHarca(no,odak,den){
  var f=g.ds[g.i];if(!f)return;den=den||0;
  g.dr='yuk';gYaz();
  var im=new Image();
  im.onload=function(){
    if(no!==g.no)return;
    /* hak harcama yoldayken Görselsiz iptal etmez (hak gider, görsel gelmezdi) */
    g.harciyor=true;
    S.stokHarca(f).then(function(ok){
      g.harciyor=false;
      if(no!==g.no)return;
      if(!ok){g.dr='hata';g.hata=S.stokHarcaHata();g.kod=S.stokDurum()==='kilit'?'plan':'harca';gYaz(odak?'tekrar':null);S.durum(T('Görsel eklenemedi.','No image was added.'));return}
      g.foto=f;g.dr='hazir';gYaz(odak);S.durum(T('Gönderi görseli eklendi.','Post image added.'));
    });
  };
  im.onerror=function(){
    if(no!==g.no)return;
    if(!g.tek&&den+1<g.ds.length){g.i=(g.i+1)%g.ds.length;gHarca(no,odak,den+1);return}
    gImgHata(odak);
  };
  im.src=gSrc(f);
}
function gTekrar(){
  if(g.ds.length){
    gIptal();
    /* Pro'da kırık görsel yerine sıradaki foto */
    if(g.kod==='img'&&!g.tek&&g.ds.length>1)g.i=(g.i+1)%g.ds.length;
    gHarca(g.no,'indir');return;
  }
  if(g.konu)gBasla(g.konu);
}
function gBaska(){
  if(g.tek||g.ds.length<2)return;
  g.i=(g.i+1)%g.ds.length;g.foto=g.ds[g.i];g.dr='hazir';gYaz('baska');
  S.durum(T('Başka görsel gösteriliyor ('+(g.i+1)+' / '+g.ds.length+').','Showing another image ('+(g.i+1)+' of '+g.ds.length+').'));
}
/* indir: canvas → JPG; CORS/çizim olmazsa görsel yeni sekmede açılır */
function gIndir(b){
  var f=g.foto;if(!f||b.getAttribute('aria-busy')==='true')return;
  var s=f.src||{},src=s.large2x||s.large||S.stokSrc(f),ad=(EN?'linkedin-image-':'linkedin-gorsel-')+String(f.id).replace(/[^\w-]/g,'')+'.jpg';
  b.setAttribute('aria-busy','true');
  var son=false;/* onload/onerror/toBlob yalnız bir kez sonuçlansın */
  function bitti(){son=true;b.removeAttribute('aria-busy')}
  function yedek(){
    if(son)return;bitti();try{window.open(src,'_blank','noopener')}catch(e){}
    var n=$('#cubuk-not');n.textContent='';n.className='st-cubuk-not not not-uyari';
    n.appendChild(d.createTextNode(T('Görsel doğrudan indirilemedi; yeni sekmede açtık, oradan kaydet. Açılmadıysa: ','The image couldn’t be downloaded directly; we opened it in a new tab, save it from there. If it didn’t open: ')));
    var a=el('a',null,T('görseli aç','open the image'));a.href=src;a.target='_blank';a.rel='noopener noreferrer';n.appendChild(a);
  }
  var im=new Image();im.crossOrigin='anonymous';
  im.onload=function(){
    if(son)return;
    try{
      var c=d.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);
      c.toBlob(function(bl){
        if(son)return;if(!bl){yedek();return}
        var u=URL.createObjectURL(bl),a=d.createElement('a');a.href=u;a.download=ad;a.hidden=true;d.body.appendChild(a);a.click();d.body.removeChild(a);
        setTimeout(function(){URL.revokeObjectURL(u)},4000);bitti();
        not(T('Görsel indirildi. LinkedIn’de gönderiye ekle; künyeyi istersen metne yaz.','Image downloaded. Add it to your LinkedIn post; you can add the credit to the text.'),'ok');S.durum(T('Görsel indirildi.','Image downloaded.'));
      },'image/jpeg',0.92);
    }catch(e){yedek()}
  };
  im.onerror=yedek;im.src=src;
}
function gKur(){
  var fs=$('#gorsel-secim');
  /* eski kabuk önbellekte kalırsa sayfa yine kurulsun (görsel seçeneği çalışmaz) */
  if(fs&&typeof S.gorselSecim==='function')secim=S.gorselSecim(fs,{anahtar:'smc-gorsel-linkedin',birim:T('gönderi görseli','post images'),degis:function(t){
    if(t!=='yok')return;
    /* üretim sürerken Görselsiz seçildi: bu istekte görsel aranmaz; arama/yükleme sürüyorsa iptal */
    if(gIs)gIs.gorselli=false;
    if(g.dr==='yuk'&&!g.harciyor){gSifir();S.durum(T('Görsel araması durduruldu.','Image search stopped.'))}
  }});
  var alt=$('#li-gorsel-alt');if(!alt)return;
  alt.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-g]'):null;if(!b)return;
    var k=b.getAttribute('data-g');
    if(k==='indir')gIndir(b);
    else if(k==='baska')gBaska();
    else if(k==='kaldir'){g.dr='kaldir';not('');gYaz('geri');S.durum(T('Görsel kaldırıldı.','Image removed.'))}
    else if(k==='geri'&&g.foto){g.dr='hazir';gYaz('kaldir');S.durum(T('Görsel geri eklendi.','Image added back.'))}
    else if(k==='tekrar')gTekrar();
  });
}

function kur(){
  kartBas();gKur();
  var s=$('#sekmeler');
  s.addEventListener('keydown',function(e){var n=st.ds.length;if(!n)return;var i=st.i;
    if(e.key==='ArrowRight')i=(i+1)%n;else if(e.key==='ArrowLeft')i=(i-1+n)%n;else if(e.key==='Home')i=0;else if(e.key==='End')i=n-1;else return;
    e.preventDefault();sec(i,true)});
  $('#li-kopya').addEventListener('click',function(){
    if(st.duzen)duzenBitir();var t=metin(),b=this;
    S.kopyala(t,function(){S.olay('copy_ok');b.lastChild.textContent=T('Kopyalandı','Copied');not(T('Kopyalandı. LinkedIn’de yeni gönderiye yapıştır.','Copied. Paste it into a new LinkedIn post.'),'ok');S.toast(T('Kopyalandı','Copied'));setTimeout(function(){b.lastChild.textContent=T('Kopyala','Copy')},2400)},
      function(){S.olay('copy_fb');duzenBasla();var ta=$('#li-duzen');ta.select();not(T('Otomatik kopyalanamadı. Metin seçili; Ctrl+C / ⌘C ile kopyala.','Couldn’t copy automatically. The text is selected; copy it with Ctrl+C / ⌘C.'),'uyari')});
  });
  $('#li-duzenle').addEventListener('click',function(){if(st.duzen)duzenBitir();else duzenBasla()});
  $('#li-duzen').addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();duzenBitir();$('#li-duzenle').focus()}});
  $('#li-duzen').addEventListener('input',function(){if(st.ds[st.i])st.ds[st.i].text=this.value;olcuYaz()});
  $$('[data-op]').forEach(function(b){if(b.hasAttribute('data-ton'))return;b.addEventListener('click',function(){if(b.getAttribute('aria-disabled')==='true')return;refine(b.getAttribute('data-op'),null,b)})});
  $$('#li-tm [data-ton]').forEach(function(b){b.addEventListener('click',function(){if(b.getAttribute('aria-disabled')==='true')return;refine('tone',b.getAttribute('data-ton'),$('#li-tm summary'))})});
  var tm=$('#li-tm');
  tm.addEventListener('keydown',function(e){if(e.key==='Escape'&&tm.open){e.preventDefault();tm.open=false;$('summary',tm).focus()}});
  d.addEventListener('click',function(e){if(tm.open&&!tm.contains(e.target))tm.open=false});
  $('#li-geri').addEventListener('click',function(){if(!st.onceki)return;st.ds[st.onceki.i].text=st.onceki.text;var i=st.onceki.i;if(st.oncekiId)st.tids[i]=st.oncekiId;st.oncekiId=null;st.onceki=null;sec(i,false);not(T('Geri alındı.','Undone.'),'ok');$('#li-kopya').focus()});
  $('#li-gorsel').addEventListener('click',function(){
    if(st.duzen)duzenBitir();var k=kanca(metin());if(!k)return;
    S.oturumDepo('studyo-kanca',k);location.href=EN?'/en/visual':'/gorsel';
  });
  /* marka sesi kaydedilince karttaki ad güncellenir */
  d.addEventListener('change',function(e){if(e.target&&e.target.closest&&e.target.closest('#ses-form'))setTimeout(kartBas,0)});
  var dlg=$('#ses');if(dlg)dlg.addEventListener('close',kartBas);
}

S.kaydet({
  kind:'linkedin',yol:'/gen/linkedin',ms:46000,sure:25,hedefMax:200,aktarim:[],
  sureMetin:['genelde 20–30 sn','usually 20–30 s'],
  hazirMetin:['3 taslak hazır.','3 drafts ready.'],
  yuk:[[0,'Konunu okuyoruz…','Reading your topic…'],[4,'Üç farklı açı seçiliyor…','Picking three different angles…'],[10,'Hikâye, liste ve görüş taslakları yazılıyor…','Writing story, list and opinion drafts…'],[22,'Son kontroller yapılıyor…','Running final checks…'],[36,'Biraz uzun sürdü; hâlâ yazıyoruz…','Taking a bit longer; still writing…']],
  goster:function(r,q){
    st.q=q;st.ton=q.tone;st.ds=r.drafts.slice(0,3).map(function(x){return {angle:x.angle,text:typeof x.text==='string'?x.text:''}});
    st.i=0;st.acik=false;st.onceki=null;st.tids=[];st.oncekiId=null;if(st.duzen)duzenBitir();
    kartBas();sekmeYaz();govdeYaz();olcuYaz();geriYaz();tonYaz();not('');
    /* görsel: yalnız bu formdan üretilen istekte Görselli seçildiyse (geçmişten açılan/Görselsiz → çağrı yok) */
    var gl=!!(gIs&&gIs.q===q&&gIs.gorselli);
    if(gl&&q.topic)gBasla(q.topic);else gSifir();
  },
  /* tercih worker'a gitmez: q'ya alan eklenmez, yalnız bu isteğe not düşülür */
  govde:function(q){gIs={q:q,gorselli:!!(secim&&secim.tercih()==='stok')}},
  /* Planla: üretimde 3 kimlik sekmelerle aynı sırada; düzenleme (refine) seçili sekmeye yeni kimlik yazar, geri al eskisine döner */
  taslakId:function(ids,tek){if(tek){st.oncekiId=st.tids[st.i]||null;st.tids[st.i]=ids[0]}else{st.tids=ids.slice(0,3);st.oncekiId=null}return st.tids[st.i]},
  basla:kur
});
})();
