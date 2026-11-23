/* Stüdyo · Blog (A8-S2): /gen/blog taslağını okuma görünümünde gösterir.
   Taslak: {angle:'blog', title≤90, meta≤160, text: Markdown (##/###, H1 yok, ≤16000)}.
   Markdown güvenli çizilir: yalnız DOM metin düğümleri, innerHTML yok; bağlantılar metin olarak kalır. */
(function(){'use strict';
var S=window.Studyo;if(!S)return;
var T=S.T,$=S.$,el=S.el,d=document,EN=S.dil()==='en';
var st={b:null,md:'',html:'',baslik:'',meta:''};

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
    if((m=/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(r))){hepsi();var n=m[1].length;B.push({t:n<=2?'h2':'h3',x:m[2]});return}
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

/* ---- çizim ---- */
function ciz(r){
  var x=r.drafts[0]||{};
  st.baslik=String(x.title||'').trim();st.meta=String(x.meta||'').trim();st.md=String(x.text||'').trim();
  var B=ayristir(st.md);
  var k=$('#bl-makale');k.textContent='';
  if(st.baslik)k.appendChild(el('h1',null,st.baslik));
  if(st.meta)k.appendChild(el('p','bl-ozet',st.meta));
  blokDom(k,B);
  st.html=(st.baslik?'<h1>'+kac(st.baslik)+'</h1>\n':'')+blokHtml(B)+'\n';
  var kl=kelime(st.md),dk=Math.max(1,Math.round(kl/200)),h2=B.filter(function(b){return b.t==='h2'}).length;
  var bi=$('#bl-bilgi');if(bi){bi.textContent='';[T(kl+' kelime',kl+' words'),T('~'+dk+' dk okuma','~'+dk+' min read'),T(h2+' ara başlık',h2+(h2===1?' section':' sections'))].forEach(function(s){bi.appendChild(el('span',null,s))})}
  snipYaz();not('');
}
function mdTam(){return (st.baslik?'# '+st.baslik+'\n\n':'')+st.md+'\n'}
function kopyaKur(id,metin,okM){var b=$(id);if(!b)return;b.addEventListener('click',function(){
  if(!st.md)return;
  S.kopyala(metin(),function(){not(okM(),'ok');S.toast(okM());S.olay('copy_ok')},function(){not(T('Kopyalanamadı; metni seçip elle kopyala.','Couldn’t copy; select the text and copy it by hand.'),'hata');S.olay('copy_fb')});
})}
function kur(){
  kopyaKur('#bl-kopya-md',mdTam,function(){return T('Markdown kopyalandı.','Markdown copied.')});
  kopyaKur('#bl-kopya-html',function(){return st.html},function(){return T('HTML kopyalandı.','HTML copied.')});
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
  goster:function(r){ciz(r)},
  basla:kur
});
})();
