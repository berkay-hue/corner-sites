/* Stüdyo · Blog (A8-S2): /gen/blog taslağını okuma görünümünde gösterir.
   Taslak: {angle:'blog', title≤90, meta≤160, text: Markdown (##/###, H1 yok, ≤16000)}.
   Markdown güvenli çizilir: yalnız DOM metin düğümleri, innerHTML yok; bağlantılar metin olarak kalır.
   Görselli (25.11): Pexels stok fotoğrafları önizlemeye + HTML/Markdown çıktısına eklenir; Görselsiz çıktı aynen kalır.
   B (26.11): son sonuç + görsel kurgusu kalır (cfg.sonAl/sonVer → kabuk studyo-son-blog + /app/drafts/:id/media, uç yoksa yerel);
   sayfa değişince yarıda kalan görsel işi geri gelince sürer (aynı foto, hak ikinci kez düşmez); üretim yarıda kaldıysa
   (studyo-bekleyen-blog) Geçmiş yoklanır, taslak düştüyse açılır. MP4: SmcMotor ile tarayıcıda, sayfadan çıkmadan. */
(function(){'use strict';
var S=window.Studyo;if(!S)return;
var T=S.T,$=S.$,el=S.el,d=document,EN=S.dil()==='en';
var st={b:null,md:'',html:'',baslik:'',meta:'',B:[],id:null};
/* görseller: is = iş sayacı (yeni üretim eskisini iptal eder), fotolar = tek aramanın listesi,
   yer = [{k:-1 kapak | k:n n. H2, f:foto|null}], tek = deneme (yalnız kapak, Başka görsel yok) */
var secim=null,istGorsel=false,g={is:0,ac:null,fotolar:[],yer:[],sira:0,tek:false,yuklu:false,konu:'',bozuk:{},ist:false,harcandi:false};
/* ist: bu taslakta görsel istendi (iş bitmeden sayfa değişirse geri gelince sürer); harcandi: görseller yerleşti (hak düştü/Pro) */
var devamGorsel=false,BEK='studyo-bekleyen-blog',vid={ac:null};
var PX_IMG=/^https:\/\/images\.pexels\.com\/[^\s"'<>\\]*$/,PX_SAY=/^https:\/\/(www\.)?pexels\.com\/[^\s"'<>\\]*$/;
var BASLIK_RE=/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;

/* ---- Markdown → blok listesi ---- */
function satirlar(t){return String(t||'').replace(/\r\n?/g,'\n').split('\n')}
function ayristir(t){
  var L=satirlar(t),B=[],par=[],liste=null,alinti=[];
  function parBit(){if(par.length){B.push({t:'p',x:par.join(' ')});par=[]}}
  function listeBit(){if(liste){B.push(liste);liste=null}}
  function alintiBit(){if(alinti.length){B.push({t:'q',x:alinti.join(' ')});alinti=[]}}
  function hepsi(){parBit();listeBit();alintiBit()}
  L.forEach(function(s){
    var r=s.replace(/\s+$/,''),m;
    if(!r.trim()){hepsi();return}
    if((m=BASLIK_RE.exec(r))){hepsi();var n=m[1].length;B.push({t:n<=2?'h2':'h3',x:m[2]});return}
    if(/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(r)){hepsi();return}
    if((m=/^\s{0,3}>\s?(.*)$/.exec(r))){parBit();listeBit();alinti.push(m[1]);return}
    if((m=/^\s{0,3}[-*+•]\s+(.*)$/.exec(r))){parBit();alintiBit();if(!liste||liste.t!=='ul'){listeBit();liste={t:'ul',ogeler:[]}}liste.ogeler.push(m[1]);return}
    if((m=/^\s{0,3}(\d{1,3})[.)]\s+(.*)$/.exec(r))){parBit();alintiBit();if(!liste||liste.t!=='ol'){listeBit();liste={t:'ol',ogeler:[],bas:+m[1]}}liste.ogeler.push(m[2]);return}
    if(liste&&/^\s{2,}\S/.test(r)){liste.ogeler[liste.ogeler.length-1]+=' '+r.trim();return}
    listeBit();alintiBit();par.push(r.trim());
  });
  hepsi();return B;
}
/* satır içi: **kalın**, *eğik* / _eğik_, `kod`, [metin](url) → metin */
function satirIci(s){
  var out=[],re=/(\*\*|__)(.+?)\1|`([^`]+)`|\[([^\]]+)\]\(([^)\s]*)[^)]*\)|(\*|_)(?![\s*_])(.*?[^\s\\])\6/g,i=0,m;
  while((m=re.exec(s))){
    if(m.index>i)out.push({t:'x',v:s.slice(i,m.index)});
    if(m[2]!=null)out.push({t:'b',v:m[2]});
    else if(m[3]!=null)out.push({t:'c',v:m[3]});
    else if(m[4]!=null)out.push({t:'a',v:m[4]});
    else out.push({t:'i',v:m[7]});
    i=re.lastIndex;
  }
  if(i<s.length)out.push({t:'x',v:s.slice(i)});
  return out;
}
var ETIKET={b:'strong',i:'em',c:'code'};
function iciDom(hedef,s){
  satirIci(s).forEach(function(p){
    if(p.t==='x')hedef.appendChild(d.createTextNode(p.v));
    else if(p.t==='a')hedef.appendChild(el('span','bl-link',p.v));
    else if(p.t==='b'){var b=el('strong');iciDom(b,p.v);hedef.appendChild(b)}
    else hedef.appendChild(el(ETIKET[p.t],null,p.v));
  });
}
function kac(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function iciHtml(s){return satirIci(s).map(function(p){
  if(p.t==='x'||p.t==='a')return kac(p.v);
  if(p.t==='b')return '<strong>'+iciHtml(p.v)+'</strong>';
  return '<'+ETIKET[p.t]+'>'+kac(p.v)+'</'+ETIKET[p.t]+'>';
}).join('')}
function blokDom(k,B){
  B.forEach(function(b){
    if(b.t==='ul'||b.t==='ol'){var l=el(b.t);if(b.t==='ol'&&b.bas>1)l.setAttribute('start',String(b.bas));b.ogeler.forEach(function(x){var li=el('li');iciDom(li,x);l.appendChild(li)});k.appendChild(l);return}
    var e=el(b.t==='q'?'blockquote':b.t);iciDom(e,b.x);k.appendChild(e);
  });
}
function blokHtml(B){return B.map(function(b){
  if(b.t==='ul'||b.t==='ol')return '<'+b.t+(b.t==='ol'&&b.bas>1?' start="'+b.bas+'"':'')+'>\n'+b.ogeler.map(function(x){return '  <li>'+iciHtml(x)+'</li>'}).join('\n')+'\n</'+b.t+'>';
  var e=b.t==='q'?'blockquote':b.t;return '<'+e+'>'+iciHtml(b.x)+'</'+e+'>';
}).join('\n')}

/* ---- yardımcılar ---- */
function sade(s){return String(s||'').replace(/[*_`#>\[\]]/g,'').replace(/\(([^)]*)\)/g,'').trim()}
function kelime(t){var m=sade(t).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);return m?m.length:0}
function slug(s){
  var h={'ç':'c','ğ':'g','ı':'i','İ':'i','ö':'o','ş':'s','ü':'u','Ç':'c','Ğ':'g','Ö':'o','Ş':'s','Ü':'u','â':'a','î':'i','û':'u'};
  var x=String(s||'').replace(/[çğıİöşüÇĞÖŞÜâîû]/g,function(c){return h[c]}).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  if(x.length>60)x=x.slice(0,61).replace(/-+[^-]*$/,'')||x.slice(0,60);
  return x||'blog-taslagi';
}
function not(m,tur){var n=$('#cubuk-not');if(!n)return;n.textContent=m||'';n.className='st-cubuk-not not'+(m&&tur?' not-'+tur:'')}

/* ---- Google önizleme ölçerleri ---- */
function olcer(id,n,dur){
  var k=$('#'+id);if(!k)return;
  var sinir=id==='bl-olc-baslik'?[30,60,90]:[70,160,160],max=sinir[1],durum;
  if(n<sinir[0])durum='kisa';else if(n<=sinir[1])durum='ok';else if(n<=sinir[2])durum='uzun';else durum='asiri';
  if(id==='bl-olc-meta'&&n>160)durum='asiri';
  k.setAttribute('data-d',durum);
  var say=$('.bl-olc-sayi',k);if(say)say.textContent=n+' / '+max;
  var bar=$('.bl-cubuk span',k);if(bar)bar.style.width=Math.min(100,Math.round(100*n/max))+'%';
  var ds=$('.bl-olc-durum',k);if(ds)ds.textContent=dur[durum];
}
function snipYaz(){
  var ad=(window.SMCSes&&SMCSes.oku&&(SMCSes.oku()||{}).name)||'';
  var u=$('#bl-snip-url');if(u)u.textContent=T('alanadin.com','yourdomain.com')+' › blog › '+slug(st.baslik);
  var i=$('#bl-snip-harf');if(i)i.textContent=(ad.trim().charAt(0)||T('A','Y')).toLocaleUpperCase(EN?'en':'tr');
  var b=$('#bl-snip-baslik');if(b)b.textContent=Array.from(st.baslik).length>60?Array.from(st.baslik).slice(0,58).join('').replace(/\s+\S*$/,'')+' …':st.baslik;
  var m=$('#bl-snip-meta');if(m)m.textContent=Array.from(st.meta).length>158?Array.from(st.meta).slice(0,155).join('').replace(/\s+\S*$/,'')+' …':st.meta;
  olcer('bl-olc-baslik',S.cp(st.baslik),{kisa:T('Kısa; anahtar sözcük ekleyebilirsin.','Short; you could add a keyword.'),ok:T('Arama sonucunda tam görünür.','Shows in full in search results.'),uzun:T('Arama sonucunda kesilebilir.','May be cut off in search results.'),asiri:T('Çok uzun; kısalt.','Too long; shorten it.')});
  olcer('bl-olc-meta',S.cp(st.meta),{kisa:T('Kısa; bir cümle daha ekleyebilirsin.','Short; you could add another sentence.'),ok:T('Uygun uzunlukta.','A good length.'),uzun:T('Uygun uzunlukta.','A good length.'),asiri:T('Arama sonucunda kesilir.','Will be cut off in search results.')});
}

/* ---- görsel yardımcıları ---- */
function yerF(k){for(var i=0;i<g.yer.length;i++)if(g.yer[i].k===k)return g.yer[i].f;return null}
function bolumVar(){return g.yer.some(function(y){return y.k>=0&&y.f})}
function gSay(){return g.yer.filter(function(y){return y.f}).length}
function buyuk(f){return (f.src&&f.src.large)||S.stokSrc(f)}
function figDom(y){
  var s=g.yer[y],f=s.f,fig=el('figure','bl-gorsel');fig.setAttribute('data-yer',String(y));
  var im=el('img');im.alt=f.alt||'';im.setAttribute('loading','lazy');im.decoding='async';
  if(f.width>0&&f.height>0){im.width=f.width;im.height=f.height}
  im.addEventListener('error',function(){gImgHata(y,f)});im.src=S.stokSrc(f);
  fig.appendChild(im);
  var cap=el('figcaption');cap.appendChild(S.stokKunye(f));fig.appendChild(cap);
  var ar=el('div','bl-gorsel-arac');ar.setAttribute('role','group');ar.setAttribute('aria-label',s.k<0?T('Kapak görseli','Cover image'):T((s.k+1)+'. bölüm görseli','Section '+(s.k+1)+' image'));
  if(!g.tek){var b1=el('button','btn btn-hafif btn-kucuk',T('Başka görsel','Another image'));b1.type='button';b1.setAttribute('data-is','baska');
    b1.setAttribute('aria-label',s.k<0?T('Kapak için başka görsel','Another image for the cover'):T((s.k+1)+'. bölüm için başka görsel','Another image for section '+(s.k+1)));ar.appendChild(b1)}
  var b2=el('button','btn btn-hafif btn-kucuk bl-gorsel-kaldir',T('Kaldır','Remove'));b2.type='button';b2.setAttribute('data-is','kaldir');
  b2.setAttribute('aria-label',s.k<0?T('Kapak görselini kaldır','Remove the cover image'):T((s.k+1)+'. bölüm görselini kaldır','Remove the section '+(s.k+1)+' image'));ar.appendChild(b2);
  fig.appendChild(ar);return fig;
}
/* kaldırılan görselin yeri: "Geri ekle" (dışa aktarılan HTML/MD'ye girmez) */
function geriDom(y){
  var s=g.yer[y],k=el('div','bl-gorsel-geri');k.setAttribute('data-yer',String(y));k.setAttribute('role','group');
  k.setAttribute('aria-label',s.k<0?T('Kapak görseli','Cover image'):T((s.k+1)+'. bölüm görseli','Section '+(s.k+1)+' image'));
  k.appendChild(el('span',null,T('Görsel kaldırıldı.','Image removed.')));
  var b=el('button','btn btn-hafif btn-kucuk',T('Geri ekle','Add it back'));b.type='button';b.setAttribute('data-is','geri');
  b.setAttribute('aria-label',s.k<0?T('Kapak görselini geri ekle','Add the cover image back'):T((s.k+1)+'. bölüm görselini geri ekle','Add the section '+(s.k+1)+' image back'));
  k.appendChild(b);return k;
}
function yerDom(i){var s=g.yer[i];return s.f?figDom(i):(s.eski?geriDom(i):null)}
/* görsel yüklenmedi: Pro'da listedeki sıradaki foto, yoksa görsel çıkar (hak zaten harcandıysa yeniden harcanmaz) */
function gImgHata(y,f){
  var s=g.yer[y];if(!s||s.f!==f)return;
  g.bozuk[String(f.id)]=1;
  var eski=$('#bl-makale [data-yer="'+y+'"]'),ic=!!(eski&&eski.contains(d.activeElement));
  var yeni=!g.tek&&baska(y);if(!yeni){s.f=null;s.eski=null}
  st.html=htmlTam();
  if(eski&&eski.parentNode){var n=yerDom(y);if(n)eski.parentNode.replaceChild(n,eski);else eski.parentNode.removeChild(eski)}
  if(ic){var b=$('#bl-makale [data-yer="'+y+'"] button');if(b)b.focus();else{var mk=$('#bl-makale');mk.tabIndex=-1;mk.focus()}}
  S.durum(yeni?T('Bir görsel yüklenemedi; yerine başka fotoğraf kondu.','An image didn’t load; another photo was used instead.'):T('Bir görsel yüklenemedi ve çıkarıldı.','An image didn’t load and was removed.'));
  kaydet();
}
function figHtml(f){return '<figure>\n  <img src="'+kac(buyuk(f))+'" alt="'+kac(f.alt||'')+'" loading="lazy">\n  <figcaption>'+S.stokKunyeHtml(f)+'</figcaption>\n</figure>'}
/* Markdown'da ham HTML etkisiz kalsın: < → &lt; (künye kabukta < kaçırmıyor) */
function mdKac(x){return String(x||'').replace(/\s+/g,' ').trim().replace(/[\\\[\]]/g,'\\$&').replace(/</g,'&lt;')}
function mdGorsel(f){return '!['+mdKac(f.alt)+']('+String(buyuk(f)).replace(/ /g,'%20').replace(/\(/g,'%28').replace(/\)/g,'%29')+')\n\n'+String(S.stokKunyeMd(f)).replace(/</g,'&lt;')}

/* ---- çizim ---- */
function makaleCiz(){
  var k=$('#bl-makale');k.textContent='';
  /* sayfanın tek H1'i başlık çubuğunda; makale başlığı önizlemede h2 (dışa aktarılan HTML/Markdown'da H1 kalır) */
  var ok=k.closest?k.closest('.bl-okur'):null;
  if(st.baslik){var h=el('h2','bl-baslik',st.baslik);h.id='bl-baslik';k.appendChild(h);if(ok)ok.setAttribute('aria-labelledby','bl-baslik')}
  else if(ok)ok.removeAttribute('aria-labelledby');
  if(st.meta)k.appendChild(el('p','bl-ozet',st.meta));
  var n=-1;
  g.yer.forEach(function(y,i){if(y.k<0){var x=yerDom(i);if(x)k.appendChild(x)}});
  st.B.forEach(function(b){
    blokDom(k,[b]);
    if(b.t==='h2'){n++;for(var i=0;i<g.yer.length;i++)if(g.yer[i].k===n){var x=yerDom(i);if(x)k.appendChild(x)}}
  });
}
/* Görselsiz: blokHtml(B) ile birebir aynı dizge */
function htmlTam(){
  var p=[],n=-1,kp=yerF(-1);
  st.B.forEach(function(b){p.push(blokHtml([b]));if(b.t==='h2'){n++;var f=yerF(n);if(f)p.push(figHtml(f))}});
  return (st.baslik?'<h1>'+kac(st.baslik)+'</h1>\n':'')+(kp?figHtml(kp)+'\n':'')+p.join('\n')+'\n';
}
function ciz(r,q){
  var x=r.drafts[0]||{};
  st.baslik=String(x.title||'').trim();st.meta=String(x.meta||'').trim();st.md=String(x.text||'').trim();
  var B=st.B=ayristir(st.md);
  /* yeni taslak: eski görsel işini iptal et (geç gelen sonuç yeni yazıya karışmasın) */
  g.is++;if(g.ac)try{g.ac.abort()}catch(e){}
  g.ac=null;g.fotolar=[];g.yer=[];g.sira=0;g.tek=false;g.yuklu=false;g.bozuk={};g.ist=false;g.harcandi=false;g.konu=st.baslik||String(q&&q.topic||'');
  S.mesgulAyar('gorsel',false);vidIptal();
  makaleCiz();
  st.html=htmlTam();
  var kl=kelime(st.md),dk=Math.max(1,Math.round(kl/200)),h2=B.filter(function(b){return b.t==='h2'}).length;
  var bi=$('#bl-bilgi');if(bi){bi.textContent='';[T(kl+' kelime',kl+' words'),T('~'+dk+' dk okuma','~'+dk+' min read'),T(h2+' ara başlık',h2+(h2===1?' section':' sections'))].forEach(function(s){bi.appendChild(el('span',null,s))})}
  snipYaz();not('');gNot('');
}
function mdTam(){
  var md=st.md,kp=yerF(-1);
  if(bolumVar()){
    var L=satirlar(st.md),o=[],n=-1;
    L.forEach(function(s,i){
      o.push(s);var m=BASLIK_RE.exec(s.replace(/\s+$/,''));
      if(m&&m[1].length<=2){n++;var f=yerF(n);if(f){o.push('',mdGorsel(f));if(i+1<L.length&&L[i+1].trim())o.push('')}}
    });
    md=o.join('\n');
  }
  return (st.baslik?'# '+st.baslik+'\n\n':'')+(kp?mdGorsel(kp)+'\n\n':'')+md+'\n';
}

/* ---- görsel akışı: metin hemen görünür → tek arama → (deneme: harca) → dağıt ---- */
function gKutu(){
  var n=$('#bl-gorsel-not');if(n)return n;
  var ok=$('.bl-okur');if(!ok||!ok.parentNode)return null;
  n=el('div','bl-gorsel-not not');n.id='bl-gorsel-not';n.setAttribute('role','status');n.tabIndex=-1;n.hidden=true;
  ok.parentNode.insertBefore(n,ok);return n;
}
function gNot(m,tur,tekrar){
  var n=gKutu();if(!n)return;
  n.textContent='';n.className='bl-gorsel-not not'+(m&&tur?' not-'+tur:'');
  if(!m){n.hidden=true;n.removeAttribute('aria-busy');return}
  n.hidden=false;n.appendChild(el('span',null,m));
  if(tur==='bekle')n.setAttribute('aria-busy','true');else n.removeAttribute('aria-busy');
  if(tekrar){var b=el('button','btn btn-cizgi btn-kucuk',T('Tekrar dene','Try again'));b.type='button';
    b.addEventListener('click',function(){n.focus();tekrar()});n.appendChild(b)}
}
/* günlük kişi limiti (429 scope:user) yarın yenilenir: Tekrar dene yok; genel yoğunlukta (global) var. Eski kabuk scope dönmezse metinden ayırt edilir */
function tekrarOlur(r){var k=r&&r.kod||'';if(/^(plan|login_required|bad_input|bos|not_ready)$/.test(k))return false;
  return !(k==='limit'&&(r.scope==='user'||(r.scope!=='global'&&r.hata===S.stokHataMetni({kod:'limit',scope:'user'}))))}
function gorselBasla(no){
  if(no!==g.is)return;
  g.ist=true;S.mesgulAyar('gorsel',true);
  gNot(T('Görseller ekleniyor…','Adding images…'),'bekle');
  g.ac=window.AbortController?new AbortController():null;
  S.stokOtomatik(g.konu,{yon:'landscape',ac:g.ac}).then(function(r){
    if(no!==g.is)return;g.ac=null;
    /* başarısız arama geri gelişte kendiliğinden yinelenmez (Tekrar dene kullanıcıda) */
    if(!r||!r.photos||!r.photos.length){S.mesgulAyar('gorsel',false);g.ist=false;kaydet();var k=r&&r.kod;gNot(T('Görsel eklenmedi: ','No images added: ')+(r&&r.hata||S.stokHataMetni({kod:k})),'uyari',tekrarOlur(r)?function(){gorselBasla(no)}:null);return}
    /* arama yanıtı deneme sayacını tazeler; harcamadan ÖNCE oku (harcanınca durum kilit olur) */
    g.tek=S.stokDurum()==='deneme';g.fotolar=r.photos;g.yuklu=false;kaydet();gHarca(no);
  });
}
/* deneme: önce fotoğraf tarayıcıda yüklenir (ilk 3'ten yüklenen ilki kapak olur), sonra hak harcanır → yüklenmeyen görsele hak gitmez.
   Kapak (fotolar[0]) harcanır (Pro'da çağrısız true); Tekrar dene aynı nesneyi kullanır → hak ikinci kez düşmez */
function onYukle(f){return new Promise(function(ok){var im=new Image(),bitti=false;function s(v){if(!bitti){bitti=true;im.onload=im.onerror=null;ok(v)}}
  im.onload=function(){s(true)};im.onerror=function(){s(false)};setTimeout(function(){s(false)},8000);im.src=S.stokSrc(f)})}
function ilkYuklenen(l,i){i=i||0;if(i>=l.length)return Promise.resolve(null);return onYukle(l[i]).then(function(v){return v?l[i]:ilkYuklenen(l,i+1)})}
function gHarca(no){
  if(no!==g.is)return;
  S.mesgulAyar('gorsel',true);
  gNot(T('Görseller ekleniyor…','Adding images…'),'bekle');
  (g.tek&&!g.yuklu?ilkYuklenen(g.fotolar.slice(0,3)):Promise.resolve(g.fotolar[0])).then(function(f){
    if(no!==g.is)return;
    if(!f){S.mesgulAyar('gorsel',false);gNot(T('Görsel yüklenemedi; deneme hakkın kullanılmadı.','Couldn’t load the image; your trial wasn’t used.'),'uyari',function(){gHarca(no)});return}
    if(f!==g.fotolar[0]){g.fotolar.splice(g.fotolar.indexOf(f),1);g.fotolar.unshift(f)}
    /* harcamadan önce sıra kaydedilir: sayfa değişirse geri gelişte aynı foto harcanır (aynı id ikinci kez düşmez) */
    g.yuklu=true;g.harciyor=true;kaydet();
    S.stokHarca(f).then(function(ok){
      g.harciyor=false;
      if(no!==g.is)return;
      S.mesgulAyar('gorsel',false);
      if(!ok){var kl=S.stokDurum()==='kilit';if(kl){g.ist=false;kaydet()}gNot(S.stokHarcaHata(),'uyari',!kl?function(){gHarca(no)}:null);return}
      yerlestir();
    });
  });
}
function yerlestir(){
  g.harcandi=true;dagit();makaleCiz();st.html=htmlTam();gNot('');kaydet();
  var n=gSay();S.durum(T(n+' görsel eklendi.',n+(n===1?' image':' images')+' added.'));
}
/* kota henüz gelmediyse (bekle) studyo:hak'ı bekle; gelmezse 13 sn sonra yine dene */
function hakBekle(fn){
  if(S.stokDurum()!=='bekle'){fn();return}
  var bitti=false,t=0;
  function git(){if(bitti)return;bitti=true;clearTimeout(t);d.removeEventListener('studyo:hak',git);fn()}
  d.addEventListener('studyo:hak',git);t=setTimeout(git,13000);
}
/* sayfa değişiminden sonra kalınan yerden: arama bittiyse aynı listeyle harca, bitmediyse yeniden ara.
   Deneme hakkı bu fotoğrafla zaten düştüyse (kilit) aynı id ile /gen/stock/use: worker aynı id'yi ikinci kez saymaz */
function gorselSur(){
  var no=g.is;
  hakBekle(function(){
    if(no!==g.is||!g.ist||g.harcandi)return;
    if(!g.fotolar.length){gorselBasla(no);return}
    var x=S.stokDurum();
    if(x==='deneme')g.tek=true;
    if(!(g.tek&&x==='kilit')){gHarca(no);return}
    var f=g.fotolar[0];if(typeof S.stokKullan!=='function'||!f){g.ist=false;kaydet();return}
    S.mesgulAyar('gorsel',true);gNot(T('Görseller ekleniyor…','Adding images…'),'bekle');
    S.stokKullan(Number(f.id)).then(function(){
      S.mesgulAyar('gorsel',false);if(no!==g.is)return;yerlestir();
    },function(e){
      S.mesgulAyar('gorsel',false);if(no!==g.is)return;g.ist=false;kaydet();
      gNot(T('Görsel eklenmedi: ','No images added: ')+S.stokHataMetni(e&&e.kod?e:{kod:'plan',trial_used:true}),'uyari');
    });
  });
}
/* Pro: kapak + ilk 3 H2, hepsi farklı fotoğraf; deneme: yalnız kapak */
function dagit(){
  var h2=st.B.filter(function(b){return b.t==='h2'}).length,ks=[-1],i;
  if(!g.tek)for(i=0;i<Math.min(3,h2);i++)ks.push(i);
  g.yer=[];
  for(i=0;i<ks.length&&i<g.fotolar.length;i++)g.yer.push({k:ks[i],f:g.fotolar[i]});
  g.sira=g.yer.length%g.fotolar.length;
}
/* Başka görsel: aynı listeden, şu an kullanılmayan sıradaki fotoğraf (çağrı yok) */
function baska(y){
  var n=g.fotolar.length,kul={},i,f;
  g.yer.forEach(function(s){if(s.f)kul[String(s.f.id)]=1});
  for(i=0;i<n;i++){f=g.fotolar[(g.sira+i)%n];if(!kul[String(f.id)]&&!g.bozuk[String(f.id)]){g.sira=(g.sira+i+1)%n;g.yer[y].f=f;return true}}
  return false;
}
function gorselTik(e){
  var b=e.target&&e.target.closest?e.target.closest('button[data-is]'):null;if(!b)return;
  var fig=b.closest('[data-yer]');if(!fig)return;
  var y=+fig.getAttribute('data-yer'),s=g.yer[y];if(!s)return;
  if(b.getAttribute('data-is')==='geri'){
    if(!s.eski||s.f)return;
    s.f=s.eski;s.eski=null;makaleCiz();st.html=htmlTam();
    var kb=$('#bl-makale figure[data-yer="'+y+'"] button[data-is="kaldir"]');if(kb)kb.focus();
    kaydet();S.durum(T('Görsel geri eklendi.','Image added back.'));return;
  }
  if(!s.f)return;
  if(b.getAttribute('data-is')==='baska'){
    if(g.tek)return;
    if(!baska(y)){var m=T('Listede başka fotoğraf kalmadı.','There are no other photos in the list.');S.durum(m);S.toast(m);return}
    makaleCiz();st.html=htmlTam();
    var yb=$('#bl-makale figure[data-yer="'+y+'"] button[data-is="baska"]');if(yb)yb.focus();
    kaydet();S.durum(T('Görsel değiştirildi.','Image changed.'));return;
  }
  s.eski=s.f;s.f=null;makaleCiz();st.html=htmlTam();
  /* odak: aynı yerdeki "Geri ekle"; yoksa görselin başlığına (kapak → yazı başlığı, bölüm → o H2) */
  var gb=$('#bl-makale [data-yer="'+y+'"] button[data-is="geri"]'),hs=$('#bl-makale').querySelectorAll('h2:not(.bl-baslik)'),hd=gb||(s.k<0?$('#bl-baslik'):hs[s.k]);
  if(!hd)hd=$('#bl-makale');
  if(hd){if(!gb)hd.tabIndex=-1;hd.focus()}
  kaydet();S.durum(T('Görsel kaldırıldı.','Image removed.'));
}
/* ---- B: son sonuç / medya kaydı ---- */
function kaydet(){S.sonGuncelle();if(st.id!=null)S.medyaKaydet(st.id,sonAl())}
function kisa(x,n){return String(x==null?'':x).slice(0,n)}
/* fotoğrafın saklanan özeti (worker mediaIn: src images.pexels.com, url/photographer_url pexels.com sayfası) */
function fotoKisa(f){
  if(!f)return null;var id=Number(f.id),src=S.stokSrc(f);
  if(!(id>0)||typeof src!=='string'||!PX_IMG.test(src))return null;
  var o={id:id,src:src,w:f.width>0?Math.round(f.width):0,h:f.height>0?Math.round(f.height):0,alt:kisa(f.alt,120),photographer:kisa(f.photographer,80)};
  if(typeof f.url==='string'&&PX_SAY.test(f.url))o.url=f.url;
  if(typeof f.photographer_url==='string'&&PX_SAY.test(f.photographer_url))o.photographer_url=f.photographer_url;
  return o;
}
function fotoAc(o){
  if(!o||typeof o!=='object')return null;var id=Number(o.id),s=o.src;
  if(!(id>0)||typeof s!=='string'||!PX_IMG.test(s))return null;
  return {id:id,src:{large2x:s,large:s,medium:s},width:Number(o.w)||0,height:Number(o.h)||0,alt:kisa(o.alt,120),photographer:kisa(o.photographer,80),
    url:typeof o.url==='string'&&PX_SAY.test(o.url)?o.url:'',photographer_url:typeof o.photographer_url==='string'&&PX_SAY.test(o.photographer_url)?o.photographer_url:''};
}
function sonAl(){
  if(!g.fotolar.length&&!g.ist)return null;
  var l=[];g.yer.forEach(function(y){[y.f,y.eski].forEach(function(f){if(f&&l.indexOf(f)<0)l.push(f)})});
  g.fotolar.forEach(function(f){if(l.indexOf(f)<0)l.push(f)});
  var ph=[];l.slice(0,12).forEach(function(f){var o=fotoKisa(f);if(o)ph.push(o)});
  function yap(){var v={};ph.forEach(function(o){v[String(o.id)]=1});
    return {photos:ph.slice(),blog:{ist:!!g.ist,tek:!!g.tek,yuklu:!!g.yuklu,harcandi:!!g.harcandi,sira:g.sira|0,
      yer:g.yer.map(function(y){var o={k:y.k};if(y.f&&v[String(y.f.id)])o.f=Number(y.f.id);if(y.eski&&v[String(y.eski.id)])o.e=Number(y.eski.id);return o})}}}
  /* worker sınırı 8192 bayt (UTF-8) */
  function bayt(x){var j=JSON.stringify(x);try{return new TextEncoder().encode(j).length}catch(e){return j.length*2}}
  var m=yap();while(ph.length>1&&bayt(m)>7600){ph.pop();m=yap()}
  return m;
}
function sonVer(m){
  var b=m&&m.blog;
  if(!b||typeof b!=='object'){if(devamGorsel&&!g.fotolar.length){devamGorsel=false;g.ist=true;gorselSur()}devamGorsel=false;return}
  devamGorsel=false;
  var fs=[],by={};(Array.isArray(m.photos)?m.photos:[]).forEach(function(o){var f=fotoAc(o);if(f&&!by[String(f.id)]){by[String(f.id)]=f;fs.push(f)}});
  g.fotolar=fs;g.tek=!!b.tek;g.yuklu=!!b.yuklu;g.harcandi=!!b.harcandi;g.ist=!!b.ist;g.sira=fs.length?Math.abs(b.sira|0)%fs.length:0;g.bozuk={};
  g.yer=[];(Array.isArray(b.yer)?b.yer:[]).forEach(function(y){
    if(!y||typeof y.k!=='number'||y.k<-1||y.k>40)return;
    var f=y.f!=null?by[String(y.f)]||null:null,e=y.e!=null?by[String(y.e)]||null:null;
    if(f||e)g.yer.push({k:y.k,f:f,eski:f?null:e});
  });
  if(g.harcandi){if(g.yer.length){makaleCiz();st.html=htmlTam()}return}
  if(g.ist)gorselSur();
}
function temizle(){
  g.is++;if(g.ac)try{g.ac.abort()}catch(e){}
  g.ac=null;g.fotolar=[];g.yer=[];g.sira=0;g.tek=false;g.yuklu=false;g.bozuk={};g.ist=false;g.harcandi=false;g.harciyor=false;
  st.md='';st.html='';st.baslik='';st.meta='';st.B=[];st.id=null;devamGorsel=false;
  S.mesgulAyar('gorsel',false);vidIptal();gNot('');not('');
}

/* ---- B: üretim sürerken sayfadan çıkıldıysa taslak worker'da kaydedilmiş olabilir: Geçmiş yoklanır ---- */
function bekleyenGorselsiz(){var v=S.depo(BEK);if(!v)return;try{var j=JSON.parse(v);if(j&&typeof j==='object'){j.ist=false;S.depo(BEK,JSON.stringify(j))}}catch(e){}}
function konuAyni(a,b){a=String(a||'').trim().toLocaleLowerCase();b=String(b||'').trim().toLocaleLowerCase();if(!a||!b)return false;return a===b||a.indexOf(b)===0||b.indexOf(a)===0}
function bekleyenNot(){var n=$('#aktarim-not');if(!n)return;
  n.textContent=T('Önceki blog taslağın sayfadan ayrıldığın için yarıda kaldı; yeniden üretebilirsin.','Your previous blog draft stopped halfway because you left the page; you can generate it again.');n.hidden=false}
function bekleyenYokla(){
  var v=S.depo(BEK);if(!v)return;S.depo(BEK,null);
  var j=null;try{j=JSON.parse(v)}catch(e){}
  if(!j||typeof j.ts!=='number'||Date.now()-j.ts>6*60000||Date.now()-j.ts<-60000)return;
  if(!S.oturumJeton||!S.oturumJeton()||typeof S.al!=='function'||typeof S.taslakAc!=='function'){bekleyenNot();return}
  var bas=Date.now(),son=S.D&&S.D.son;
  function bitmeli(){return (S.D&&S.D.mesgul)||(S.D&&S.D.son&&S.D.son!==son)}
  function tur(){
    if(bitmeli())return;
    S.al('/app/drafts?platform=blog',12000).then(function(r){
      if(bitmeli())return;
      var ds=r&&Array.isArray(r.drafts)?r.drafts:[],x=null;
      for(var i=0;i<ds.length&&!x;i++){var t=Date.parse(String(ds[i].created_at||'').replace(' ','T')+'Z');
        if(isFinite(t)&&t>=j.ts-60000&&konuAyni(ds[i].topic,j.topic))x=ds[i]}
      if(x){devamGorsel=!!j.ist;S.taslakAc(x.id,true);return}
      sonraki();
    },sonraki);
  }
  function sonraki(){if(bitmeli())return;if(Date.now()-bas>=3*60000){bekleyenNot();return}setTimeout(tur,10000)}
  tur();
}

/* ---- B (madde 8): MP4 — SmcMotor ile bu sekmede kaydedilir (gerçek zamanlı), sonra indirilir ---- */
function vidIptal(){if(vid.ac)try{vid.ac.abort()}catch(e){}}
function vidFmt(){try{return window.SmcMotor&&SmcMotor.videoFormat?SmcMotor.videoFormat():null}catch(e){return null}}
function vidEtiket(b){var f=vidFmt(),sp=b.querySelector('span');if(!sp)return;
  sp.textContent=f&&f.ext==='webm'?T('WebM’e dönüştür','Convert to WebM'):T('MP4’e dönüştür','Convert to MP4')}
function kes(s,n){s=sade(s).replace(/\s+/g,' ').trim();if(Array.from(s).length<=n)return s;var x=Array.from(s).slice(0,n).join('');x=x.replace(/\s+\S*$/,'');return (x||Array.from(s).slice(0,n).join(''))+'…'}
function resimYukle(f){return new Promise(function(ok){
  if(!f){ok(null);return}var im=new Image(),bitti=false;function s(v){if(!bitti){bitti=true;im.onload=im.onerror=null;ok(v)}}
  im.crossOrigin='anonymous';im.decoding='async';im.onload=function(){s(im.naturalWidth>0?im:null)};im.onerror=function(){s(null)};
  setTimeout(function(){s(null)},8000);im.src=buyuk(f)})}
/* kapak (başlık + meta) + ilk 7 H2 (her biri ardından gelen ilk paragrafın kısası); görsel: o bölümünki, yoksa kapak */
function blogProje(){
  var sh=[{text:kes(st.baslik,90),sub:kes(st.meta,140),secs:4,f:yerF(-1)}],n=-1,son=null;
  st.B.forEach(function(b){
    if(b.t==='h2'){n++;son=n<7?{text:kes(b.x,90),sub:'',secs:4.5,f:yerF(n)}:null;if(son)sh.push(son);return}
    if(son&&!son.sub&&(b.t==='p'||b.t==='q'))son.sub=kes(b.x,120);
  });
  var kp=yerF(-1),diger=g.yer.filter(function(y){return y.f}).map(function(y){return y.f});
  sh.forEach(function(s,i){if(!s.f)s.f=kp||(diger.length?diger[i%diger.length]:null)});
  return Promise.all(sh.map(function(s){return resimYukle(s.f)})).then(function(ims){
    var p=null;try{p=window.SMCSes&&SMCSes.oku?SMCSes.oku():null}catch(e){}
    return {template:'kinetik',aspect:'9:16',lang:S.dil()==='en'?'en':'tr',brand:{name:p&&p.name?String(p.name).slice(0,60):''},
      scenes:sh.map(function(s,i){var o={text:s.text,sub:s.sub,secs:s.secs};if(ims[i])o.image=ims[i];return o})};
  });
}
function vidKutu(){
  var k=$('#bl-mp4');if(k)return k;
  var ar=$('#bl-video');ar=ar&&ar.closest?ar.closest('.st-arac'):null;if(!ar||!ar.parentNode)return null;
  k=el('div','bl-mp4');k.id='bl-mp4';k.hidden=true;k.setAttribute('role','status');
  var pr=el('progress');pr.max=100;pr.value=0;pr.id='bl-mp4-pr';pr.setAttribute('aria-label',T('Video ilerlemesi','Video progress'));
  var yz=el('span','bl-mp4-yuzde','0%');
  var ip=el('button','btn btn-hafif btn-kucuk',T('İptal','Cancel'));ip.type='button';ip.addEventListener('click',vidIptal);
  var ust=el('div','bl-mp4-ust');ust.appendChild(pr);ust.appendChild(yz);ust.appendChild(ip);k.appendChild(ust);
  k.appendChild(el('p','bl-mp4-bilgi',T('Bu sekmede kal; video gerçek zamanlı kaydediliyor.','Stay on this tab; the video is recorded in real time.')));
  ar.parentNode.insertBefore(k,ar.nextSibling);return k;
}
function mp4Yap(b){
  if(!st.md||vid.ac||b.getAttribute('aria-disabled')==='true')return;
  if(!window.SmcMotor||typeof SmcMotor.exportVideo!=='function'){not(T('Video aracı yüklenemedi; sayfayı yenileyip tekrar dene.','The video tool didn’t load; refresh the page and try again.'),'hata');return}
  var fmt=vidFmt();if(!fmt){not(T('Bu tarayıcı video kaydını desteklemiyor; Chrome, Edge ya da güncel Safari dene.','This browser can’t record video; try Chrome, Edge or a recent Safari.'),'uyari');return}
  if(g.harciyor||S.stokHarciyor&&S.stokHarciyor()){not(T('Görseller ekleniyor; bitince tekrar dene.','Images are being added; try again when they’re done.'),'uyari');return}
  var ac=window.AbortController?new AbortController():{signal:null,abort:function(){}};vid.ac=ac;
  var k=vidKutu(),pr=k&&$('#bl-mp4-pr'),yz=k&&$('.bl-mp4-yuzde',k);
  function yuzde(x){var v=Math.max(0,Math.min(100,Math.round(x*100)));if(pr)pr.value=v;if(yz)yz.textContent=v+'%'}
  function bit(){vid.ac=null;S.mesgulAyar('mp4',false);b.removeAttribute('aria-disabled');b.removeAttribute('aria-busy');if(k)k.hidden=true}
  S.mesgulAyar('mp4',true);b.setAttribute('aria-disabled','true');b.setAttribute('aria-busy','true');yuzde(0);if(k)k.hidden=false;
  not(T('Video hazırlanıyor…','Preparing the video…'));
  blogProje().then(function(p){
    if(ac.signal&&ac.signal.aborted)throw {name:'AbortError'};
    return SmcMotor.exportVideo(p,{signal:ac.signal,onProgress:yuzde});
  }).then(function(r){
    var ad=slug(st.baslik)+'.'+(r&&r.ext||fmt.ext);bit();
    var u=URL.createObjectURL(r.blob),a=el('a');a.href=u;a.download=ad;d.body.appendChild(a);a.click();d.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(u)},60000);
    var m=(r.ext==='webm'?T('WebM indirildi: ','WebM downloaded: '):T('MP4 indirildi: ','MP4 downloaded: '))+ad;not(m,'ok');S.toast(m);
  },function(e){
    bit();
    if(e&&e.name==='AbortError'){not(T('Video iptal edildi.','Video cancelled.'));return}
    var ms=e&&e.message;
    not(ms==='video_unsupported'?T('Bu tarayıcı video kaydını desteklemiyor; Chrome, Edge ya da güncel Safari dene.','This browser can’t record video; try Chrome, Edge or a recent Safari.'):T('Video oluşturulamadı; tekrar dene.','The video couldn’t be created; try again.'),'hata');
  });
}

function kopyaKur(id,metin,okM){var b=$(id);if(!b)return;b.addEventListener('click',function(){
  if(!st.md)return;
  S.kopyala(metin(),function(){not(okM(),'ok');S.toast(okM());S.olay('copy_ok')},function(){not(T('Kopyalanamadı; metni seçip elle kopyala.','Couldn’t copy; select the text and copy it by hand.'),'hata');S.olay('copy_fb')});
})}
function kur(){
  /* eski kabuk önbellekte kalırsa sayfa yine kurulsun (görsel seçeneği çalışmaz) */
  if(typeof S.gorselSecim==='function')secim=S.gorselSecim($('#gorsel-secim'),{anahtar:'smc-gorsel-blog',birim:T('kapak ve bölüm görselleri','cover and section images'),degis:function(t){
    if(t!=='yok')return;
    /* üretim sürerken Görselsiz seçildi: bu taslakta görsel aranmaz; arama sürüyorsa iptal (eklenmiş görsellere dokunulmaz) */
    istGorsel=false;bekleyenGorselsiz();
    var n=$('#bl-gorsel-not');
    /* hak harcama isteği yoldaysa bırakılır (iptal edilirse hak gider, görsel gelmez) */
    if(n&&n.getAttribute('aria-busy')==='true'&&!g.harciyor){g.is++;if(g.ac)try{g.ac.abort()}catch(e){}g.ac=null;g.ist=false;S.mesgulAyar('gorsel',false);kaydet();gNot('');S.durum(T('Görsel araması durduruldu.','Image search stopped.'))}
  }});
  var mk=$('#bl-makale');if(mk)mk.addEventListener('click',gorselTik);
  kopyaKur('#bl-kopya-md',mdTam,function(){return T('Markdown kopyalandı.','Markdown copied.')});
  kopyaKur('#bl-kopya-html',htmlTam,function(){return T('HTML kopyalandı.','HTML copied.')});
  var ind=$('#bl-indir');if(ind)ind.addEventListener('click',function(){
    if(!st.md)return;
    try{var u=URL.createObjectURL(new Blob([mdTam()],{type:'text/markdown;charset=utf-8'})),a=el('a');a.href=u;a.download=slug(st.baslik)+'.md';d.body.appendChild(a);a.click();d.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(u)},4000);not(T('.md dosyası indirildi.','.md file downloaded.'),'ok')}
    catch(e){not(T('İndirilemedi; Markdown’ı kopyala.','Couldn’t download; copy the Markdown instead.'),'hata')}
  });
  var vb=$('#bl-video');if(vb){vidEtiket(vb);vb.addEventListener('click',function(){mp4Yap(vb)})}
  setTimeout(bekleyenYokla,0);
}

S.kaydet({
  kind:'blog',yol:'/gen/blog',ms:130000,sure:100,hedefMax:300,aktarim:[],
  sureMetin:['blog yaklaşık 2 dakika sürer','a blog post takes about 2 minutes'],
  hazirMetin:['Blog taslağı hazır.','Blog draft ready.'],
  yuk:[[0,'Konunu okuyoruz…','Reading your topic…'],[6,'Okurun soruları çıkarılıyor…','Working out the reader’s questions…'],[18,'Ara başlıklar planlanıyor…','Planning the sections…'],[35,'Bölümler yazılıyor; blog yaklaşık 2 dakika sürer…','Writing the sections; a blog post takes about 2 minutes…'],[80,'Başlık ve meta açıklaması yazılıyor…','Writing the title and meta description…'],[105,'Son okuma yapılıyor…','Doing a final read…'],[125,'Biraz uzun sürdü; hâlâ yazıyoruz…','Taking a bit longer; still writing…']],
  /* görsel tercihi worker'a gitmez; üretim başında okunur (deneme harcanınca fieldset Görselsiz'e döner) */
  govde:function(q){istGorsel=!!(secim&&secim.tercih&&secim.tercih()==='stok');
    S.depo(BEK,JSON.stringify({ts:Date.now(),topic:String(q&&q.topic||'').slice(0,300),ist:istGorsel}));delete q.gorsel},
  uretBitti:function(){S.depo(BEK,null)},
  /* geri getirilen sonuçta görsel kurgusu sonVer'den gelir; yeni üretimde Görselli seçildiyse arama burada başlar */
  goster:function(r,q,o){
    st.id=r&&Array.isArray(r.draft_ids)&&r.draft_ids[0]!=null?r.draft_ids[0]:null;
    ciz(r,q);
    if(o&&o.geri)return;
    devamGorsel=false;g.ist=istGorsel;
    /* kota geç gelip kilit/yok çıktıysa (Görselli 'bekle'de seçilmişti) eski davranış: sessizce görselsiz */
    if(g.ist){var no=g.is;hakBekle(function(){if(no!==g.is)return;var x=S.stokDurum();if(x!=='acik'&&x!=='deneme'){g.ist=false;kaydet();return}gorselBasla(no)})}
  },
  sonAl:sonAl,sonVer:sonVer,temizle:temizle,
  basla:kur
});
})();
