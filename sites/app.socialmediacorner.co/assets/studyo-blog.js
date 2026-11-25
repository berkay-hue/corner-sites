/* Stüdyo · Blog (A8-S2): /gen/blog taslağını okuma görünümünde gösterir.
   Taslak: {angle:'blog', title≤90, meta≤160, text: Markdown (##/###, H1 yok, ≤16000)}.
   Markdown güvenli çizilir: yalnız DOM metin düğümleri, innerHTML yok; bağlantılar metin olarak kalır.
   Görselli (25.11): Pexels stok fotoğrafları önizlemeye + HTML/Markdown çıktısına eklenir; Görselsiz çıktı aynen kalır. */
(function(){'use strict';
var S=window.Studyo;if(!S)return;
var T=S.T,$=S.$,el=S.el,d=document,EN=S.dil()==='en';
var st={b:null,md:'',html:'',baslik:'',meta:'',B:[]};
/* görseller: is = iş sayacı (yeni üretim eskisini iptal eder), fotolar = tek aramanın listesi,
   yer = [{k:-1 kapak | k:n n. H2, f:foto|null}], tek = deneme (yalnız kapak, Başka görsel yok) */
var secim=null,istGorsel=false,g={is:0,ac:null,fotolar:[],yer:[],sira:0,tek:false,yuklu:false,konu:'',bozuk:{}};
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
  var out=[],re=/(\*\*|__)(.+?)\1|`([^`]+)`|\[([^\]]+)\]\(([^)\s]*)[^)]*\)|(\*|_)(?![\s*_])(.+?)(?<![\s\\])\6/g,i=0,m;
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
  g.ac=null;g.fotolar=[];g.yer=[];g.sira=0;g.tek=false;g.yuklu=false;g.bozuk={};g.konu=st.baslik||String(q&&q.topic||'');
  makaleCiz();
  st.html=htmlTam();
  var kl=kelime(st.md),dk=Math.max(1,Math.round(kl/200)),h2=B.filter(function(b){return b.t==='h2'}).length;
  var bi=$('#bl-bilgi');if(bi){bi.textContent='';[T(kl+' kelime',kl+' words'),T('~'+dk+' dk okuma','~'+dk+' min read'),T(h2+' ara başlık',h2+(h2===1?' section':' sections'))].forEach(function(s){bi.appendChild(el('span',null,s))})}
  snipYaz();not('');gNot('');
  if(istGorsel)gorselBasla(g.is);
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
  gNot(T('Görseller ekleniyor…','Adding images…'),'bekle');
  g.ac=window.AbortController?new AbortController():null;
  S.stokOtomatik(g.konu,{yon:'landscape',ac:g.ac}).then(function(r){
    if(no!==g.is)return;g.ac=null;
    if(!r||!r.photos||!r.photos.length){var k=r&&r.kod;gNot(T('Görsel eklenmedi: ','No images added: ')+(r&&r.hata||S.stokHataMetni({kod:k})),'uyari',tekrarOlur(r)?function(){gorselBasla(no)}:null);return}
    /* arama yanıtı deneme sayacını tazeler; harcamadan ÖNCE oku (harcanınca durum kilit olur) */
    g.tek=S.stokDurum()==='deneme';g.fotolar=r.photos;g.yuklu=false;gHarca(no);
  });
}
/* deneme: önce fotoğraf tarayıcıda yüklenir (ilk 3'ten yüklenen ilki kapak olur), sonra hak harcanır → yüklenmeyen görsele hak gitmez.
   Kapak (fotolar[0]) harcanır (Pro'da çağrısız true); Tekrar dene aynı nesneyi kullanır → hak ikinci kez düşmez */
function onYukle(f){return new Promise(function(ok){var im=new Image(),bitti=false;function s(v){if(!bitti){bitti=true;im.onload=im.onerror=null;ok(v)}}
  im.onload=function(){s(true)};im.onerror=function(){s(false)};setTimeout(function(){s(false)},8000);im.src=S.stokSrc(f)})}
function ilkYuklenen(l,i){i=i||0;if(i>=l.length)return Promise.resolve(null);return onYukle(l[i]).then(function(v){return v?l[i]:ilkYuklenen(l,i+1)})}
function gHarca(no){
  if(no!==g.is)return;
  gNot(T('Görseller ekleniyor…','Adding images…'),'bekle');
  (g.tek&&!g.yuklu?ilkYuklenen(g.fotolar.slice(0,3)):Promise.resolve(g.fotolar[0])).then(function(f){
    if(no!==g.is)return;
    if(!f){gNot(T('Görsel yüklenemedi; deneme hakkın kullanılmadı.','Couldn’t load the image; your trial wasn’t used.'),'uyari',function(){gHarca(no)});return}
    if(f!==g.fotolar[0]){g.fotolar.splice(g.fotolar.indexOf(f),1);g.fotolar.unshift(f)}
    g.yuklu=true;g.harciyor=true;
    S.stokHarca(f).then(function(ok){
      g.harciyor=false;
      if(no!==g.is)return;
      if(!ok){gNot(S.stokHarcaHata(),'uyari',S.stokDurum()!=='kilit'?function(){gHarca(no)}:null);return}
      dagit();makaleCiz();st.html=htmlTam();gNot('');
      var n=gSay();S.durum(T(n+' görsel eklendi.',n+(n===1?' image':' images')+' added.'));
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
    S.durum(T('Görsel geri eklendi.','Image added back.'));return;
  }
  if(!s.f)return;
  if(b.getAttribute('data-is')==='baska'){
    if(g.tek)return;
    if(!baska(y)){var m=T('Listede başka fotoğraf kalmadı.','There are no other photos in the list.');S.durum(m);S.toast(m);return}
    makaleCiz();st.html=htmlTam();
    var yb=$('#bl-makale figure[data-yer="'+y+'"] button[data-is="baska"]');if(yb)yb.focus();
    S.durum(T('Görsel değiştirildi.','Image changed.'));return;
  }
  s.eski=s.f;s.f=null;makaleCiz();st.html=htmlTam();
  /* odak: aynı yerdeki "Geri ekle"; yoksa görselin başlığına (kapak → yazı başlığı, bölüm → o H2) */
  var gb=$('#bl-makale [data-yer="'+y+'"] button[data-is="geri"]'),hs=$('#bl-makale').querySelectorAll('h2:not(.bl-baslik)'),hd=gb||(s.k<0?$('#bl-baslik'):hs[s.k]);
  if(!hd)hd=$('#bl-makale');
  if(hd){if(!gb)hd.tabIndex=-1;hd.focus()}
  S.durum(T('Görsel kaldırıldı.','Image removed.'));
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
    istGorsel=false;
    var n=$('#bl-gorsel-not');
    /* hak harcama isteği yoldaysa bırakılır (iptal edilirse hak gider, görsel gelmez) */
    if(n&&n.getAttribute('aria-busy')==='true'&&!g.harciyor){g.is++;if(g.ac)try{g.ac.abort()}catch(e){}g.ac=null;gNot('');S.durum(T('Görsel araması durduruldu.','Image search stopped.'))}
  }});
  var mk=$('#bl-makale');if(mk)mk.addEventListener('click',gorselTik);
  kopyaKur('#bl-kopya-md',mdTam,function(){return T('Markdown kopyalandı.','Markdown copied.')});
  kopyaKur('#bl-kopya-html',htmlTam,function(){return T('HTML kopyalandı.','HTML copied.')});
  var ind=$('#bl-indir');if(ind)ind.addEventListener('click',function(){
    if(!st.md)return;
    try{var u=URL.createObjectURL(new Blob([mdTam()],{type:'text/markdown;charset=utf-8'})),a=el('a');a.href=u;a.download=slug(st.baslik)+'.md';d.body.appendChild(a);a.click();d.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(u)},4000);not(T('.md dosyası indirildi.','.md file downloaded.'),'ok')}
    catch(e){not(T('İndirilemedi; Markdown’ı kopyala.','Couldn’t download; copy the Markdown instead.'),'hata')}
  });
  var vb=$('#bl-video');if(vb)vb.addEventListener('click',function(){
    if(!st.baslik)return;S.oturumDepo('studyo-konu',st.baslik.slice(0,300));location.href=EN?'/en/video':'/video';
  });
}

S.kaydet({
  kind:'blog',yol:'/gen/blog',ms:130000,sure:100,hedefMax:300,aktarim:[],
  sureMetin:['blog yaklaşık 2 dakika sürer','a blog post takes about 2 minutes'],
  hazirMetin:['Blog taslağı hazır.','Blog draft ready.'],
  yuk:[[0,'Konunu okuyoruz…','Reading your topic…'],[6,'Okurun soruları çıkarılıyor…','Working out the reader’s questions…'],[18,'Ara başlıklar planlanıyor…','Planning the sections…'],[35,'Bölümler yazılıyor; blog yaklaşık 2 dakika sürer…','Writing the sections; a blog post takes about 2 minutes…'],[80,'Başlık ve meta açıklaması yazılıyor…','Writing the title and meta description…'],[105,'Son okuma yapılıyor…','Doing a final read…'],[125,'Biraz uzun sürdü; hâlâ yazıyoruz…','Taking a bit longer; still writing…']],
  /* görsel tercihi worker'a gitmez; üretim başında okunur (deneme harcanınca fieldset Görselsiz'e döner) */
  govde:function(q){istGorsel=!!(secim&&secim.tercih&&secim.tercih()==='stok');delete q.gorsel},
  goster:function(r,q){ciz(r,q)},
  basla:kur
});
})();
