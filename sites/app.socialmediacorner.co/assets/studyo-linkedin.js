/* Stüdyo · LinkedIn (A8-S2): /gen/linkedin sonucu gerçekçi gönderi kartı, 3 seçenek sekmesi, satır içi düzenleme,
   kopyala, /gen/refine (kısalt/uzat/ton), "Görsele dönüştür" (sessionStorage studyo-kanca → /gorsel).
   Kullanıcı metni yalnız textContent/value ile yazılır. */
(function(){'use strict';
var S=window.Studyo;if(!S)return;
var d=document,T=S.T,$=S.$,$$=S.$$,el=S.el,EN=S.dil()==='en';
var KAT=210,LI_MAX=3000;
var ACI={hikaye:T('Hikâye','Story'),liste:T('Liste','List'),gorus:T('Görüş','Opinion')};
var TON={samimi:T('Samimi','Friendly'),profesyonel:T('Profesyonel','Professional'),ogretici:T('Öğretici','Educational'),cesur:T('Cesur','Bold')};
var st={ds:[],i:0,acik:false,duzen:false,onceki:null,mesgul:false,q:null,tids:[],oncekiId:null};

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

function kur(){
  kartBas();
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
  },
  /* Planla: üretimde 3 kimlik sekmelerle aynı sırada; düzenleme (refine) seçili sekmeye yeni kimlik yazar, geri al eskisine döner */
  taslakId:function(ids,tek){if(tek){st.oncekiId=st.tids[st.i]||null;st.tids[st.i]=ids[0]}else{st.tids=ids.slice(0,3);st.oncekiId=null}return st.tids[st.i]},
  basla:kur
});
})();
