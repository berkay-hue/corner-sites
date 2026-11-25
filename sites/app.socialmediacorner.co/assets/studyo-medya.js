/* Stüdyo · Video / Görsel (A8-S2): /gen/video taslağını (sahneler + açıklama) alır.
   Mod #studyo-medya[data-mod] özniteliğinden okunur: video → kind 'video' (15/30/60 sn), gorsel → kind 'carousel' (5/7/10 kart).
   S3b sözleşmesi: her yeni taslakta #studyo-medya üzerinde iptal edilebilir 'studyo:taslak' olayı (bubbles) atılır:
     detail = {kind, mod, draft:{angle,title,scenes:[{text,sub,secs}],caption}, body:{…istek}, lang:'tr'|'en', marka:{name}}
   Dinleyici e.preventDefault() derse yedek sahne listesi çizilmez; dinleyici yoksa ya da iptal etmezse
   #sb-yer içine sade bir sahne listesi + açıklama çizilir. Son taslak Studyo.medya.taslak'ta durur. */
(function(){'use strict';
var S=window.Studyo;if(!S)return;
var T=S.T,$=S.$,el=S.el,d=document,EN=S.dil()==='en';
var kok=$('#studyo-medya'),MOD=kok&&kok.getAttribute('data-mod')==='gorsel'?'gorsel':'video',KIND=MOD==='gorsel'?'carousel':'video';
var api={mod:MOD,kind:KIND,taslak:null,govde:null,ciz:yedekCiz};
S.medya=api;

function not(m,tur){var n=$('#cubuk-not');if(!n)return;n.textContent=m||'';n.className='st-cubuk-not not'+(m&&tur?' not-'+tur:'')}
function temizle(x){
  var sc=Array.isArray(x.scenes)?x.scenes:[];
  return {angle:String(x.angle||KIND),title:String(x.title||'').trim(),caption:String(x.caption||'').trim(),
    scenes:sc.map(function(s){s=s||{};return {text:String(s.text||'').trim(),sub:String(s.sub||'').trim(),secs:Math.max(0,Number(s.secs)||0)}}).filter(function(s){return s.text||s.sub})};
}

/* ---- yedek görünüm: S3b motoru devralmazsa ---- */
function yedekCiz(t){
  var y=$('#sb-yer');if(!y)return;y.textContent='';y.hidden=false;
  var toplam=t.scenes.reduce(function(a,s){return a+s.secs},0);
  var oz=el('p','sb-ozet');
  oz.appendChild(el('span',null,KIND==='video'?T(t.scenes.length+' sahne',t.scenes.length+(t.scenes.length===1?' scene':' scenes')):T(t.scenes.length+' kart',t.scenes.length+(t.scenes.length===1?' card':' cards'))));
  if(KIND==='video'&&toplam)oz.appendChild(el('span',null,T('toplam ~'+toplam+' sn','~'+toplam+' s total')));
  oz.appendChild(el('span',null,KIND==='video'?'9:16':'4:5'));
  y.appendChild(oz);
  if(t.title){var h=el('h3','sb-baslik',t.title);y.appendChild(h)}
  var ol=el('ol','sb-sahneler');ol.setAttribute('aria-label',KIND==='video'?T('Sahneler','Scenes'):T('Kartlar','Cards'));
  t.scenes.forEach(function(s,i){
    var li=el('li','sb-sahne');
    li.appendChild(el('span','sb-no',(KIND==='video'?T('Sahne ','Scene '):T('Kart ','Card '))+(i+1)));
    if(KIND==='video'&&s.secs){var su=el('span','sb-sure',s.secs+T(' sn',' s'));li.appendChild(su)}
    li.appendChild(el('p','sb-metin',s.text));
    if(s.sub)li.appendChild(el('p','sb-alt',s.sub));
    ol.appendChild(li);
  });
  y.appendChild(ol);
  if(t.caption){
    var ac=el('section','sb-aciklama');ac.setAttribute('aria-labelledby','sb-aciklama-h');
    var hh=el('h3',null,T('Gönderi açıklaması','Post caption'));hh.id='sb-aciklama-h';ac.appendChild(hh);
    var p=el('p',null,t.caption);p.setAttribute('data-sabit','');ac.appendChild(p);
    y.appendChild(ac);
  }
}

function kopya(metin,okM){
  if(!metin)return;
  S.kopyala(metin,function(){not(okM,'ok');S.toast(okM);S.olay('copy_ok')},function(){not(T('Kopyalanamadı; metni seçip elle kopyala.','Couldn’t copy; select the text and copy it by hand.'),'hata');S.olay('copy_fb')});
}
function sahneMetni(t){return t.scenes.map(function(s,i){return (i+1)+'. '+s.text+(s.sub?'\n   '+s.sub:'')}).join('\n')}
function kur(){
  var ka=$('#sb-kopya-aciklama');if(ka)ka.addEventListener('click',function(){if(api.taslak)kopya(api.taslak.caption,T('Açıklama kopyalandı.','Caption copied.'))});
  var ks=$('#sb-kopya-sahne');if(ks)ks.addEventListener('click',function(){if(api.taslak)kopya(sahneMetni(api.taslak),KIND==='video'?T('Sahne metinleri kopyalandı.','Scene text copied.'):T('Kart metinleri kopyalandı.','Card text copied.'))});
}

S.kaydet({
  kind:KIND,yol:'/gen/video',ms:70000,sure:35,hedefMax:0,
  aktarim:MOD==='gorsel'?['studyo-kanca']:['studyo-konu'],
  sureMetin:['genelde 30–45 sn','usually 30–45 s'],
  hazirMetin:MOD==='gorsel'?['Karusel taslağı hazır.','Carousel draft ready.']:['Video taslağı hazır.','Video draft ready.'],
  yuk:MOD==='gorsel'
    ?[[0,'Konunu okuyoruz…','Reading your topic…'],[5,'Kart sırası planlanıyor…','Planning the card order…'],[14,'Kart metinleri yazılıyor…','Writing the card text…'],[30,'Açıklama yazılıyor…','Writing the caption…'],[55,'Biraz uzun sürdü; hâlâ yazıyoruz…','Taking a bit longer; still writing…']]
    :[[0,'Konunu okuyoruz…','Reading your topic…'],[5,'Açılış kancası seçiliyor…','Picking the opening hook…'],[14,'Sahneler ve süreleri yazılıyor…','Writing the scenes and timings…'],[30,'Açıklama yazılıyor…','Writing the caption…'],[55,'Biraz uzun sürdü; hâlâ yazıyoruz…','Taking a bit longer; still writing…']],
  govde:function(q){q.kind=KIND;delete q.goal},
  goster:function(r,q){
    var t=temizle(r.drafts[0]||{});api.taslak=t;api.govde=q;not('');
    var ad=(window.SMCSes&&SMCSes.oku&&(SMCSes.oku()||{}).name)||'';
    var ev;try{ev=new CustomEvent('studyo:taslak',{bubbles:true,cancelable:true,detail:{kind:KIND,mod:MOD,draft:t,body:q,lang:S.dil(),marka:{name:ad}}})}catch(e){ev=null}
    var devraldi=false;if(ev&&kok)devraldi=!kok.dispatchEvent(ev);
    var y=$('#sb-yer');
    if(devraldi){if(y){y.textContent='';y.hidden=true}}else yedekCiz(t);
  },
  /* tek taslak (draft_ids[0]); Planla kuyrukta açıklamayı Instagram metni yapar (studyo-kuyruk.js taslakOn) */
  taslakId:function(ids){return ids[0]},
  basla:kur
});
})();
