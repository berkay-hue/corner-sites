/* A13 yönetim sayfası (hesap/admin.html). smc-hesap.js oturumu kurar, kullanıcı admin ise
   window.smcAdminBasla(api) çağırır. Tüm veri textContent ve createElement ile yazılır; HTML dizgisi kullanılmaz. */
(function(){
'use strict';
var d=document;
function $(s,k){return (k||d).querySelector(s)}
function $$(s,k){return Array.prototype.slice.call((k||d).querySelectorAll(s))}
function el(tag,cls,txt){var e=d.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=String(txt);return e}
var PLAN_AD={demo:'Demo',basic:'Basic',pro:'Pro',enterprise:'Enterprise'};
var DURUM={taslak:'Taslak',onay_bekliyor:'Onay bekliyor',planlandi:'Planlandı',yayinlaniyor:'Yayınlanıyor',yayinlandi:'Yayınlandı',basarisiz:'Başarısız',kontrol:'Kontrol',iptal:'İptal'};
var HATA={bad_plan:'Geçersiz plan.',bad_limits:'Enterprise için iki kotayı da 1 ile 100000 arasında tam sayı olarak yaz.',not_found:'Kullanıcı bulunamadı.',bad_n:'1 ile 60 arasında tam sayı yaz.'};
function sayi(n){return (n==null||n==='')?'—':Number(n).toLocaleString('tr-TR')}
/* D1 zamanları "YYYY-MM-DD HH:MM:SS" (UTC); İstanbul saatiyle gösterilir */
function zaman(s){
  if(!s)return '—';
  var x=new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)?s.replace(' ','T')+'Z':s);
  if(isNaN(x.getTime()))return String(s);
  try{return new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Istanbul'}).format(x)}catch(e){return String(s)}
}
function kota(n,l){return sayi(n)+' / '+(typeof l==='number'&&isFinite(l)?sayi(l):'—')}
/* A15 demo: limits.trial_ends_at (ISO) + trial_ended; bitiş günü İstanbul tarihiyle */
function gun(s){var x=new Date(s);if(!s||isNaN(x.getTime()))return '';try{return new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Istanbul'}).format(x)}catch(e){return String(s)}}
function planMetin(u){
  if(!u.plan)return '—';
  var ad=PLAN_AD[u.plan]||u.plan,l=u.limits||{};
  if(u.plan!=='demo')return ad;
  if(l.trial_ended===true)return ad+' · bitti';
  var g=gun(l.trial_ends_at);return g?ad+' · bitiş '+g:ad;
}
/* demo hakkı deneme boyunca toplam; satırdaki sayaç yalnız bu ayı gösterir */
function kotaU(u,k){var t=kota(u.month&&u.month[k],u.limits&&u.limits[k]);return u.plan==='demo'?t+' · bu ay':t}
/* 27.11 seslendirme: ses {used_month, extra, limit_month} → "2/6 · +6 ek" */
function sesMetin(u){var s=u.ses;if(!s)return '—';var t=sayi(s.used_month||0)+'/'+sayi(s.limit_month||0);return Number(s.extra)>0?t+' · +'+sayi(s.extra)+' ek':t}

/* tablo: kolonlar [{b:başlık, s:sınıf, v:function(satır)->metin|Node}] */
function tablo(kap,kol,satirlar,bosMetin){
  kap.textContent='';
  if(!satirlar.length){kap.appendChild(el('p','ad-bos',bosMetin||'Kayıt yok.'));return null}
  var sar=el('div','ad-kaydir'),t=el('table','ad-tablo'),th=el('thead'),tr=el('tr'),tb=el('tbody');
  kol.forEach(function(k){var h=el('th',null,k.b);h.setAttribute('scope','col');tr.appendChild(h)});
  th.appendChild(tr);t.appendChild(th);t.appendChild(tb);sar.appendChild(t);kap.appendChild(sar);
  satirEkle(tb,kol,satirlar);
  return tb;
}
function satirEkle(tb,kol,satirlar){
  satirlar.forEach(function(r){
    var tr=el('tr');
    kol.forEach(function(k){var td=el('td',k.s||null),v=k.v(r);if(v&&v.nodeType)td.appendChild(v);else td.textContent=v==null?'—':String(v);tr.appendChild(td)});
    tb.appendChild(tr);
  });
}

window.smcAdminBasla=function(api){
  var istek=api.istek,ekran=api.ekran,bildir=api.bildir,genelHata=api.genelHata,hataGoster=api.hataGoster,mesgul=api.mesgul,bosMu=api.bosMu;
  var yuklendi={},sonraki={},govde={},kullanicilar={},secili=null;

  function cevapHata(j){
    if(j._s===404){ekran('yok',true);return}
    if(j._s===503&&j.error==='not_ready'){ekran('yakinda',true);return}
    if(j._s===0||j._s>=500){hataGoster(j.error||String(j._s),true);return}
    genelHata(j);
  }

  /* ---- özet ---- */
  function ozetCiz(j){
    var dl=$('#ad-ozet');dl.textContent='';
    var p=j.plans||{},gm=j.gen_month||{},top=0;Object.keys(p).forEach(function(k){top+=Number(p[k])||0});
    var kart=[['Hesap',top],['Demo',p.demo||0],['Basic',p.basic||0],['Pro',p.pro||0],['Enterprise',p.enterprise||0],
      ['LinkedIn ve blog (ay)',gm.linkedin_blog?gm.linkedin_blog.n:0],['Video ve görsel (ay)',gm.video_gorsel?gm.video_gorsel.n:0]];
    kart.forEach(function(k){var w=el('div','sheet ad-kutu');w.appendChild(el('dt',null,k[0]));w.appendChild(el('dd',null,sayi(k[1])));dl.appendChild(w)});
    $('#ad-ay').textContent=j.month||'';
    var ay=Object.keys(gm).map(function(k){return {k:k,n:gm[k].n,u:gm[k].users}});
    tablo($('#ad-ay-tablo'),[
      {b:'Tür',v:function(r){return r.k==='linkedin_blog'?'LinkedIn ve blog':r.k==='video_gorsel'?'Video ve görsel':r.k}},
      {b:'Üretim',s:'ad-sayi',v:function(r){return sayi(r.n)}},
      {b:'Kullanıcı',s:'ad-sayi',v:function(r){return sayi(r.u)}}
    ],ay,'Bu ay hesaplı üretim yok.');
    var S=function(k){return {b:k[1],s:'ad-sayi',v:function(r){return sayi(r[k[0]])}}};
    tablo($('#ad-gunluk'),[{b:'Gün',v:function(r){return r.day}}].concat([
      ['ok','Başarılı'],['fail','Hata'],['refused','Ret'],['busy','Meşgul'],['refine_ok','İyileştirme'],['tok_in','Token giriş'],['tok_out','Token çıkış'],
      ['uniq_anon','Tekil anonim'],['anon_full','Anonim kota'],['ip_full','IP kota'],['cap_hit','Tavan'],['copy_ok','Kopyalama'],['share','Paylaşım']
    ].map(S)),j.gen_daily||[],'Son 30 günde üretim kaydı yok.');
    tablo($('#ad-planlog'),[
      {b:'Zaman',v:function(r){return zaman(r.at)}},
      {b:'Kullanıcı',s:'ad-eposta',v:function(r){return r.email}},
      {b:'Yeni plan',v:function(r){return PLAN_AD[r.plan]||r.plan}},
      {b:'Değiştiren',s:'ad-eposta',v:function(r){return r.actor_email||(r.actor_id==null?'—':'#'+r.actor_id)}}
    ],j.plan_log||[],'Henüz plan değişikliği yok.');
    tablo($('#ad-seslog'),[
      {b:'Zaman',v:function(r){return zaman(r.at)}},
      {b:'Kullanıcı',s:'ad-eposta',v:function(r){return r.email}},
      {b:'Eklenen hak',s:'ad-sayi',v:function(r){return '+'+sayi(r.n)}},
      {b:'Veren',s:'ad-eposta',v:function(r){return r.actor_email||(r.actor_id==null?'—':'#'+r.actor_id)}}
    ],j.ses_log||[],'Henüz ek seslendirme hakkı verilmedi.');
  }

  /* ---- kullanıcılar ---- */
  var KOL_KULLANICI=[
    {b:'E-posta',s:'ad-eposta',v:function(u){var s=el('span',null,u.email);if(u.admin){var f=d.createDocumentFragment();f.appendChild(s);f.appendChild(el('span','ad-rozet','Yönetici'));return f}return s}},
    {b:'Ad',v:function(u){return u.name||'—'}},
    {b:'Plan',v:planMetin},
    {b:'LinkedIn ve blog (ay)',s:'ad-sayi',v:function(u){return kotaU(u,'linkedin_blog')}},
    {b:'Video ve görsel (ay)',s:'ad-sayi',v:function(u){return kotaU(u,'video_gorsel')}},
    {b:'Seslendirme',s:'ad-sayi',v:sesMetin},
    {b:'Taslak',s:'ad-sayi',v:function(u){return sayi(u.drafts)}},
    /* A14: cms {sites,aktif,duraklatildi,hata} (kaldırılanlar hariç); alan yoksa ya da site yoksa boş */
    {b:'Blog sitesi',s:'ad-sayi',v:function(u){var c=u.cms;if(!c||!(Number(c.sites)>0))return '';
      var t='CMS '+sayi(c.sites);if(Number(c.duraklatildi)>0)t+=' · '+sayi(c.duraklatildi)+' duraklatıldı';if(Number(c.hata)>0)t+=' · '+sayi(c.hata)+' hata';return t}},
    {b:'Kayıt',v:function(u){return zaman(u.created_at)}},
    {b:'Son oturum',v:function(u){return zaman(u.last_login)}},
    {b:'İşlem',v:function(u){
      var w=el('div','ad-islem'),b=el('button','btn btn-cizgi btn-kucuk','Planı değiştir');b.type='button';b.setAttribute('aria-label','Planı değiştir: '+u.email);b.addEventListener('click',function(){planAc(u.id,b)});
      var e=el('button','btn btn-cizgi btn-kucuk','Ek hak ver');e.type='button';e.setAttribute('aria-label','Ek seslendirme hakkı ver: '+u.email);e.setAttribute('data-ses-ac',String(u.id));e.addEventListener('click',function(){sesAc(u.id,e)});
      w.appendChild(b);w.appendChild(e);return w}}
  ];
  function kullaniciCiz(liste,ekle){
    liste.forEach(function(u){kullanicilar[u.id]=u});
    if(ekle&&govde.kullanici)satirEkle(govde.kullanici,KOL_KULLANICI,liste);
    else govde.kullanici=tablo($('#ad-kullanicilar'),KOL_KULLANICI,liste,'Henüz hesap yok.');
  }
  function yenidenCiz(){var l=Object.keys(kullanicilar).map(function(k){return kullanicilar[k]}).sort(function(a,b){return b.id-a.id});govde.kullanici=tablo($('#ad-kullanicilar'),KOL_KULLANICI,l,'Henüz hesap yok.')}

  /* ---- plan formu ---- */
  var f=$('#f-plan'),sec=$('#plan-sec'),lb=$('#plan-lb'),vg=$('#plan-vg'),ph=$('#plan-hata');
  function entGoster(){var e=sec.value==='enterprise';$$('[data-ent]',f).forEach(function(x){x.hidden=!e})}
  var planDon=null;
  function planAc(id,tetik){
    var u=kullanicilar[id];if(!u)return;secili=id;planDon=tetik||null;sesKapat(false);
    $('#plan-kim').textContent=u.email;
    sec.value=PLAN_AD[u.plan]?u.plan:'basic';
    var l=u.limits||{};lb.value=u.plan==='enterprise'&&l.linkedin_blog?l.linkedin_blog:'';vg.value=u.plan==='enterprise'&&l.video_gorsel?l.video_gorsel:'';
    ph.textContent='';entGoster();f.hidden=false;$('#plan-baslik').focus();
  }
  function planKapat(odak){f.hidden=true;secili=null;ph.textContent='';if(odak&&planDon&&d.contains(planDon))planDon.focus();planDon=null}
  sec.addEventListener('change',entGoster);
  $('#plan-vazgec').addEventListener('click',function(){planKapat(true)});
  f.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();planKapat(true)}});
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var b=$('button[type="submit"]',f);if(bosMu(b)||secili==null)return;
    var g={plan:sec.value};
    if(g.plan==='enterprise'){
      var a=Number(lb.value),v=Number(vg.value),okA=Number.isInteger(a)&&a>=1&&a<=100000,okV=Number.isInteger(v)&&v>=1&&v<=100000;
      if(!okA||!okV){ph.textContent=HATA.bad_limits;(okA?vg:lb).focus();return}
      g.limits={linkedin_blog:a,video_gorsel:v};
    }
    ph.textContent='';
    var bitir=mesgul(b,'Kaydediliyor…'),id=secili;
    istek('/app/admin/'+encodeURIComponent(id)+'/plan','POST',g).then(function(j){
      bitir();
      if(j._s===200){
        var u=kullanicilar[id];if(u){u.plan=j.plan;u.plan_limits=j.plan_limits;u.limits=j.limits;
          /* seslendirme aylık hakkı plana bağlı (demo bittiyse 0) */
          if(u.ses&&j.limits)u.ses.limit_month=j.limits.trial_ended?0:(Number(j.limits.seslendirme)||0)}
        yenidenCiz();planKapat();delete yuklendi.ozet;
        bildir('Plan güncellendi: {e} → {p}.','ok',{e:u?u.email:'#'+id,p:PLAN_AD[j.plan]||j.plan});
        return;
      }
      if(j._s===400||(j._s===404&&j.error==='not_found')){ph.textContent=HATA[j.error]||('Kaydedilemedi (Kod: '+(j.error||j._s)+').');return}
      if(j._s===503&&j.error==='not_ready'){ph.textContent='Plan sütunları henüz yok (0018 göçü uygulanmalı).';return}
      genelHata(j);
    });
  });

  /* ---- 27.11 ek seslendirme hakkı formu: POST /app/admin/:id/ses-ek {n} (1..60) ---- */
  var fs=$('#f-ses'),sn=$('#ses-n'),sh=$('#ses-hata'),sesId=null,sesDon=null;
  function sesN(){var n=Number(sn.value);return sn.value!==''&&Number.isInteger(n)&&n>=1&&n<=60?n:null}
  function sesNot(){var n=sesN();$('#ses-not').textContent=n?'Bu kullanıcıya '+n+' ek seslendirme hakkı eklenecek (ücretli ek paket: 6 hak = 299 TL / 7 $).':HATA.bad_n}
  function sesAc(id,tetik){
    var u=kullanicilar[id];if(!u)return;
    if(!f.hidden)planKapat(false);
    sesId=id;sesDon=tetik||null;
    $('#ses-kim').textContent=u.email;sn.value='6';sh.textContent='';sesNot();
    fs.hidden=false;$('#ses-baslik').focus();
  }
  /* odak: kapanınca tetikleyen düğmeye; tablo yeniden çizildiyse aynı kullanıcının yeni düğmesine */
  function sesKapat(odak){
    if(fs.hidden)return;
    var id=sesId;fs.hidden=true;sesId=null;sh.textContent='';
    if(odak){var b=sesDon&&d.contains(sesDon)?sesDon:$('[data-ses-ac="'+id+'"]');if(b)b.focus()}
    sesDon=null;
  }
  sn.addEventListener('input',sesNot);
  $$('[data-ses-n]',fs).forEach(function(b){b.addEventListener('click',function(){sn.value=b.getAttribute('data-ses-n');sh.textContent='';sesNot();sn.focus()})});
  $('#ses-vazgec').addEventListener('click',function(){sesKapat(true)});
  fs.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();sesKapat(true)}});
  fs.addEventListener('submit',function(e){
    e.preventDefault();
    var b=$('button[type="submit"]',fs);if(bosMu(b)||sesId==null)return;
    var n=sesN();if(!n){sh.textContent=HATA.bad_n;sn.focus();return}
    sh.textContent='';
    var bitir=mesgul(b,'Ekleniyor…'),id=sesId;
    istek('/app/admin/'+encodeURIComponent(id)+'/ses-ek','POST',{n:n}).then(function(j){
      bitir();
      if(j._s===200){
        var u=kullanicilar[id],s=j.ses||{};
        if(u)u.ses={used_month:s.used_month||0,extra:s.extra||0,limit_month:s.plan||0};
        yenidenCiz();sesKapat(true);delete yuklendi.ozet;
        bildir('Ek hak eklendi: {e} (+{n}, toplam ek {t})','ok',{e:u?u.email:'#'+id,n:String(n),t:String(s.extra||0)});
        return;
      }
      if(j._s===400||(j._s===404&&j.error==='not_found')){sh.textContent=HATA[j.error]||('Eklenemedi (Kod: '+(j.error||j._s)+').');return}
      if(j._s===503&&j.error==='not_ready'){sh.textContent='Seslendirme sayacı tablosu (gen_usage) henüz yok.';return}
      genelHata(j);
    });
  });

  /* ---- formlar, taslaklar, kuyruk ---- */
  var KOL_FORM=[
    {b:'Zaman',v:function(r){return zaman(r.created_at)}},
    {b:'Site / sayfa',v:function(r){return r.site+(r.page?' '+r.page:'')}},
    {b:'Alanlar',s:'ad-uzun',v:function(r){return (Array.isArray(r.fields)?r.fields:[]).map(function(x){return Array.isArray(x)?String(x[0])+': '+String(x[1]):String(x)}).join('\n')||'—'}},
    {b:'IP (maskeli)',v:function(r){return r.ip||'—'}},
    {b:'E-posta gitti',v:function(r){return r.emailed?'Evet':'Hayır'}}
  ];
  var KOL_TASLAK=[
    {b:'Zaman',v:function(r){return zaman(r.created_at)}},
    {b:'Kullanıcı',s:'ad-eposta',v:function(r){return r.email}},
    {b:'Platform',v:function(r){return r.platform}},
    {b:'Konu',v:function(r){return r.topic||'—'}},
    {b:'Metin (başı)',s:'ad-uzun',v:function(r){return (r.body||'')+(r.len>280?'…':'')}},
    {b:'Uzunluk',s:'ad-sayi',v:function(r){return sayi(r.len)}}
  ];
  var KOL_IS=[
    {b:'No',s:'ad-sayi',v:function(r){return r.id}},
    {b:'Kullanıcı',s:'ad-eposta',v:function(r){return r.email}},
    {b:'Platform',v:function(r){return r.platform}},
    {b:'Durum',v:function(r){return DURUM[r.state]||r.state}},
    {b:'Zaman',v:function(r){return zaman(r.run_at)}},
    {b:'Deneme',s:'ad-sayi',v:function(r){return sayi(r.attempts)}},
    {b:'Sonraki deneme',v:function(r){return zaman(r.next_try_at)}},
    {b:'Metin (başı)',s:'ad-uzun',v:function(r){return r.body||'—'}},
    {b:'Son hata',s:'ad-uzun',v:function(r){return r.last_error||'—'}}
  ];
  var KOL_OLAY=[
    {b:'Zaman',v:function(r){return zaman(r.at)}},
    {b:'İş',s:'ad-sayi',v:function(r){return r.job_id}},
    {b:'Kim',v:function(r){return r.actor||'—'}},
    {b:'Geçiş',v:function(r){return (DURUM[r.from_state]||r.from_state||'—')+' → '+(DURUM[r.to_state]||r.to_state||'—')}},
    {b:'Not',s:'ad-uzun',v:function(r){return r.note||'—'}}
  ];
  var BOLUM={
    kullanici:{yol:'/app/admin/users',al:function(j,ekle){kullaniciCiz(j.users||[],ekle)}},
    form:{yol:'/app/admin/submissions',al:function(j,ekle){ciz('form','#ad-formlar',KOL_FORM,j.submissions||[],ekle,'Form gönderisi yok.')}},
    taslak:{yol:'/app/admin/drafts',al:function(j,ekle){ciz('taslak','#ad-taslaklar',KOL_TASLAK,j.drafts||[],ekle,'Taslak yok.')}},
    kuyruk:{yol:'/app/admin/jobs',al:function(j,ekle){ciz('kuyruk','#ad-isler',KOL_IS,j.jobs||[],ekle,'Yayın işi yok.');ciz('olay','#ad-olaylar',KOL_OLAY,j.events||[],ekle,'Olay yok.')}}
  };
  function ciz(ad,sec,kol,liste,ekle,bos){
    if(ekle&&govde[ad]){satirEkle(govde[ad],kol,liste);return}
    govde[ad]=tablo($(sec),kol,liste,bos);
  }
  function dahaAyarla(ad,next){sonraki[ad]=next||null;var b=$('[data-daha="'+ad+'"]');if(b)b.hidden=!next}
  function bolumYukle(ad,ekle,dugme){
    var B=BOLUM[ad];if(!B)return;
    var bitir=dugme?mesgul(dugme,'Yükleniyor…'):null;
    istek(B.yol+(ekle&&sonraki[ad]?'?before='+encodeURIComponent(sonraki[ad]):'')).then(function(j){
      if(bitir)bitir();
      if(j._s!==200){if(j._s===503&&j.error==='not_ready'){bildir('Bu bölümün tabloları henüz yok (not_ready).','uyari');return}cevapHata(j);return}
      yuklendi[ad]=true;B.al(j,ekle);dahaAyarla(ad,j.next);
    });
  }
  $$('[data-daha]').forEach(function(b){b.addEventListener('click',function(){if(!bosMu(b))bolumYukle(b.getAttribute('data-daha'),true,b)})});

  /* ---- sekmeler ---- */
  function sekmeAc(ad){
    $$('[data-sekme]').forEach(function(x){x.hidden=x.getAttribute('data-sekme')!==ad});
    bildir('');
    if(ad==='ozet'&&!yuklendi.ozet)ozetYukle(false);
    else if(ad!=='ozet'&&!yuklendi[ad])bolumYukle(ad,false,null);
  }
  $$('input[name="sekme"]').forEach(function(r){r.addEventListener('change',function(){if(r.checked)sekmeAc(r.value)})});

  /* ---- açılış: /app/admin özet + ilk kullanıcı sayfası ---- */
  function ozetYukle(ilk){
    istek('/app/admin').then(function(j){
      if(j._s!==200){if(ilk)cevapHata(j);else if(j._s===503&&j.error==='not_ready')bildir('Özet tabloları henüz yok (not_ready).','uyari');else cevapHata(j);return}
      yuklendi.ozet=true;ozetCiz(j);
      if(ilk||!yuklendi.kullanici){kullanicilar={};kullaniciCiz(j.users||[],false);dahaAyarla('kullanici',j.next);yuklendi.kullanici=true}
      if(ilk){ekran('ana');var r=$('input[name="sekme"]:checked');if(r&&r.value!=='ozet')sekmeAc(r.value)}
    });
  }
  ozetYukle(true);
};
})();
