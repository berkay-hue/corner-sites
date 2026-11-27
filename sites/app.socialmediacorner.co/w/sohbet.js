/* SMC sohbet widget'ı (sözleşme §10). Bağımlılıksız; DOM yalnız createElement + textContent. */
(()=>{'use strict';
const W=window,D=document,AL='aria-label',AD='aria-describedby',AH='aria-hidden',AE='aria-expanded';
if(W.__smcSohbet)return;W.__smcSohbet=1;
const S=D.currentScript||D.querySelector('script[data-bot]');if(!S)return;
const KEY=S.getAttribute('data-bot')||'';if(!/^wk_[A-Za-z0-9_-]{24}$/.test(KEY))return;
const API=S.getAttribute('data-api')||'https://corner-forms.berkay-999.workers.dev';
if(!/^(https:\/\/[^\s/]|http:\/\/(localhost|127\.0\.0\.1)[:/]?)/.test(API))return;
const BASE=API.replace(/\/+$/,'')+'/bot/w/'+KEY,LSK='smc-sohbet:'+KEY;
const RE_OT=/^s_[A-Za-z0-9_-]{22}$/,RE_H=/^(n:[a-z0-9_-]{1,24}|lead|insan|menu)$/;
const str=v=>typeof v=='string'&&v?v:'';
const TX={
tr:{ac:'Sohbeti aç',kapat:'Sohbeti kapat',yaz:'Mesajını yaz…',gonder:'Gönder',yaziyor:'Yazıyor…',hiz:'Çok hızlı yazıyorsun, biraz bekle.',ag:'Bağlantı sorunu, tekrar dene.',devir:'Ekibe aktarıldı',lb:'İletişim bilgilerin',ad:'Adın',eposta:'E-posta',tel:'Telefon',not:'Not (isteğe bağlı)',onay:'Bilgilerimin {ad} ile paylaşılmasını onaylıyorum.',lg:'Bilgilerimi gönder',tesekkur:'Teşekkürler! Bilgilerinizi aldık, en kısa sürede size dönülecek.',guc:'Social Media Corner ile çalışır',bos:'Bu alan gerekli.',bicim:'Biçimi kontrol et.',uzun:'Çok uzun.',ilet:'E-posta ya da telefon gir.',onayh:'Göndermek için onay kutusunu işaretle.',log:'Sohbet mesajları'},
en:{ac:'Open chat',kapat:'Close chat',yaz:'Type your message…',gonder:'Send',yaziyor:'Typing…',hiz:"You're typing too fast, please wait.",ag:'Connection problem, please try again.',devir:'Passed to our team',lb:'Your contact details',ad:'Your name',eposta:'Email',tel:'Phone',not:'Note (optional)',onay:'I agree to share my details with {ad}.',lg:'Send my details',tesekkur:'Thanks! We got your details and will get back to you soon.',guc:'Powered by Social Media Corner',bos:'This field is required.',bicim:'Please check the format.',uzun:'Too long.',ilet:'Enter an email or a phone number.',onayh:'Please tick the consent box to send.',log:'Chat messages'}};
const R='var(--smc-renk)',Y='var(--smc-yazi)';
const CSS=`:host{all:initial}*{box-sizing:border-box}[hidden]{display:none!important}
.k{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;flex-direction:column;align-items:flex-end;gap:12px;font:15px/1.45 system-ui,sans-serif;color:#1a1d21}
.k.sol{right:auto;left:16px;align-items:flex-start}
svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
button,a,textarea,input{font:inherit}button{cursor:pointer}:focus-visible{outline:3px solid #1a73e8;outline-offset:2px}
.a,.g,.ld button,.b,.mk .bl{border:0;background:${R};color:${Y}}
.a,.g,.x{display:grid;place-items:center;flex:none}
.a{width:56px;height:56px;border-radius:50%;box-shadow:0 6px 20px #0004}
.p{display:flex;flex-direction:column;width:min(380px,calc(100vw - 32px));height:min(600px,calc(100vh - 104px));background:#fff;border-radius:16px;box-shadow:0 12px 40px #0004;overflow:hidden}
.b{display:flex;align-items:center;gap:8px;min-height:56px;padding:6px 6px 6px 16px}
.t{flex:1;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rz{padding:2px 8px;border:1px solid;border-radius:99px;font-size:12px;font-weight:700}
.x{width:44px;height:44px;border:0;border-radius:10px;background:none;color:inherit}
.l{flex:1;display:flex;flex-direction:column;gap:10px;padding:16px;overflow-y:auto;overscroll-behavior:contain;background:#f4f5f7}
.m{display:flex;flex-direction:column;align-items:flex-start;gap:6px}.mk{align-items:flex-end}
.bl,.yz{margin:0;max-width:85%;padding:9px 13px;border-radius:16px 16px 16px 4px;background:#fff;white-space:pre-wrap;overflow-wrap:anywhere}
.mk .bl{border-radius:16px 16px 4px}
.bt{display:flex;flex-wrap:wrap;gap:6px}
.q{display:inline-flex;align-items:center;min-height:44px;padding:8px 14px;border:2px solid ${R};border-radius:22px;background:#fff;color:#1a1d21;font-size:14px;font-weight:600;text-decoration:none}.q:hover{background:#eef0f3}
.s{align-self:center;margin:0;padding:4px 12px;border-radius:99px;background:#fde8e8;color:#8a1c1c;font-size:13px}
.yz{display:flex;gap:4px;padding:13px 14px}
.yz i{width:7px;height:7px;border-radius:50%;background:#6b7280;animation:z 1s infinite}.yz i+i{animation-delay:.15s}.yz i+i+i{animation-delay:.3s}
@keyframes z{40%{transform:translateY(-4px)}}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.y{display:flex;align-items:flex-end;gap:8px;padding:8px;border-top:1px solid #e3e5e8}
textarea,.ld input{min-height:44px;padding:10px 12px;border:1px solid #8c939b;border-radius:10px;color:#1a1d21;background:#fff}
.y textarea{flex:1;max-height:120px;border-radius:22px;resize:none;field-sizing:content}
.g{width:44px;height:44px;border-radius:50%}.g:disabled{opacity:.55}
.f{padding:6px;color:#5b6168;font-size:12px;text-align:center}
.ld{display:flex;flex-direction:column;gap:10px;padding:14px;background:#fff;border-radius:14px}
.lb{margin:0;font-weight:700}
.ld label{display:flex;flex-direction:column;gap:4px;color:#3a3f45;font-size:13px;font-weight:600}
.ld .on{flex-direction:row;gap:10px;font-weight:400}
.ld [type=checkbox]{width:22px;height:22px;min-height:0;margin:0;flex:none;accent-color:${R}}
.e{margin:-4px 0 0;color:#b42318;font-size:13px;font-weight:600}.e:empty{display:none}
[aria-invalid=true]{border-color:#b42318}
.ld button{min-height:44px;border-radius:22px;font-weight:700}
@media (max-width:480px){.p{position:fixed;inset:0;width:100%;height:100dvh;border-radius:0}.acik .a{display:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
@media (forced-colors:active){.a,.g,.q,.ld button{border:1px solid}}`;
const IK={sohbet:'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',x:'M6 6l12 12M18 6L6 18',gonder:'M5 12h13M13 6l6 6-6 6'};

const el=(t,a,k)=>{const e=D.createElement(t);
for(const n in a||{}){const v=a[n];if(v==null||v===false)continue;
if(n=='text')e.textContent=v;else if(n=='on')for(const ev in v)e.addEventListener(ev,v[ev]);else e.setAttribute(n,v===true?'':v)}
for(const c of k||[])if(c)e.appendChild(c);return e};
const ikon=n=>{const N='http://www.w3.org/2000/svg',s=D.createElementNS(N,'svg'),p=D.createElementNS(N,'path');
s.setAttribute('viewBox','0 0 24 24');s.setAttribute(AH,'true');s.setAttribute('focusable','false');p.setAttribute('d',IK[n]);s.appendChild(p);return s};
const yaziRengi=hex=>{const m=/^#(..)(..)(..)$/.exec(hex);if(!m)return '#fff';
const c=[1,2,3].map(i=>{const v=parseInt(m[i],16)/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});
return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]>0.55?'#111':'#fff'};
const temizB=b=>Array.isArray(b)?b.filter(x=>x&&str(x.etiket)&&str(x.hedef)).slice(0,13).map(x=>({etiket:x.etiket.slice(0,80),hedef:x.hedef})):[];

const st={oturum:null,mesajlar:[],acik:false,devir:false};
const oku=()=>{try{const v=JSON.parse(localStorage.getItem(LSK)||'null');if(!v||typeof v!='object')return;
if(RE_OT.test(str(v.oturum)))st.oturum=v.oturum;
if(Array.isArray(v.mesajlar))st.mesajlar=v.mesajlar.filter(m=>m&&(m.rol=='k'||m.rol=='b')&&str(m.metin)).slice(-30).map(m=>({rol:m.rol,metin:m.metin.slice(0,4000),butonlar:temizB(m.butonlar)}));
st.acik=v.acik===true;st.devir=v.devir===true}catch(e){}};
const kaydet=()=>{try{st.mesajlar=st.mesajlar.slice(-30);localStorage.setItem(LSK,JSON.stringify(st))}catch(e){}};

const istek=async(yol,govde)=>{
const o=govde?{method:'POST',headers:{'content-type':'text/plain;charset=UTF-8'},body:JSON.stringify(govde)}:{};
o.credentials='omit';o.cache='no-store';
let j=null;try{const r=await fetch(BASE+yol,o);try{j=await r.json()}catch(e){}j=j&&typeof j=='object'?j:{};j._s=r.status}catch(e){j={_s:0}}
return j};

let t,bot,kok,panel,bas,log,yzEl,giris,gBtn,rz,leadF=null,mesgul=false,kapali=false;

const altaKay=()=>{log.scrollTop=log.scrollHeight};
const koy=n=>{log.insertBefore(n,leadF&&leadF.parentNode==log?leadF:null);altaKay()};
const butonlar=bs=>{const k=el('div',{class:'bt'});
for(const b of bs){const h=b.hedef;let e=null;
if(h.startsWith('url:')){const u=h.slice(4);let ok=false;try{ok=new URL(u).protocol=='https:'}catch(x){}
if(ok)e=el('a',{class:'q',href:u,target:'_blank',rel:'noopener noreferrer',text:b.etiket})}
else if(RE_H.test(h))e=el('button',{class:'q',type:'button',text:b.etiket,on:{click:()=>gonder(null,h,b.etiket)}});
if(e)k.appendChild(e)}
return k};
const ekleCiz=m=>{const w=el('div',{class:'m '+(m.rol=='k'?'mk':'mb')},[el('p',{class:'bl',text:m.metin})]);
if(m.rol=='b'&&m.butonlar&&m.butonlar.length)w.appendChild(butonlar(m.butonlar));koy(w)};
const ekle=m=>{st.mesajlar.push(m);ekleCiz(m);kaydet()};
const sistem=m=>koy(el('p',{class:'s',text:m}));
const yaziyor=ac=>{if(ac&&!yzEl){yzEl=el('div',{class:'yz',role:'status'},[0,1,2].map(()=>el('i',{[AH]:'true'})).concat(el('span',{class:'sr',text:t.yaziyor})));log.appendChild(yzEl);altaKay()}
else if(!ac&&yzEl){yzEl.remove();yzEl=null}};
const devirCiz=()=>{rz.hidden=!st.devir};
const hataYanit=j=>{if(j._s==429)sistem(t.hiz);else if(j._s==409||(j._s==403&&j.error=='origin')){kapali=true;kapat(false);kok.hidden=true}else if(!j.ok)sistem(t.ag);else return false;return true};

const gonder=async(metin,hedef,etiket)=>{
if(mesgul||kapali)return;
const g={oturum:st.oturum};if(metin!=null)g.metin=metin;else g.buton=hedef;
ekle({rol:'k',metin:metin!=null?metin:etiket});
mesgul=gBtn.disabled=true;yaziyor(true);
const j=await istek('/mesaj',g);
yaziyor(false);mesgul=gBtn.disabled=false;
if(hataYanit(j))return;
if(RE_OT.test(str(j.oturum)))st.oturum=j.oturum;
for(const c of Array.isArray(j.cevaplar)?j.cevaplar:[])if(c&&str(c.metin))ekle({rol:'b',metin:c.metin,butonlar:temizB(c.butonlar)});
if(typeof j.devir=='boolean'){st.devir=j.devir;devirCiz()}
kaydet();
if(j.lead_iste===true)leadAc()};

const alan=(ad,etiket,tip,ek)=>{const hid='smc-e-'+ad,o=Object.assign({name:ad,[AD]:hid},ek),
g=tip=='textarea'?el('textarea',Object.assign(o,{rows:'2'})):el('input',Object.assign(o,{type:tip}));
return {g,h:el('p',{class:'e',id:hid}),k:el('label',null,[el('span',{text:etiket}),g])}};
const leadAc=()=>{
if(leadF){const i=leadF.querySelector('input');if(i)i.focus();altaKay();return}
const A={ad:alan('ad',t.ad,'text',{maxlength:'80',autocomplete:'name'}),eposta:alan('eposta',t.eposta,'email',{maxlength:'254',autocomplete:'email'}),
telefon:alan('telefon',t.tel,'tel',{maxlength:'20',autocomplete:'tel'}),notu:alan('notu',t.not,'textarea',{maxlength:'500'})};
const on=el('input',{type:'checkbox',name:'onay',[AD]:'smc-e-onay'}),onH=el('p',{class:'e',id:'smc-e-onay'});
A.onay={g:on,h:onH};
const btn=el('button',{type:'submit',text:t.lg});
const hata=(k,m)=>{const x=A[k]||A.eposta;x.h.textContent=m;x.g.setAttribute('aria-invalid','true');x.g.focus()};
const gonderLead=async ev=>{ev.preventDefault();if(btn.disabled)return;
for(const k in A){A[k].h.textContent='';A[k].g.removeAttribute('aria-invalid')}
const v={oturum:st.oturum,onay:true};for(const k of ['ad','eposta','telefon','notu'])v[k]=A[k].g.value.trim();
if(v.eposta&&!/^[^\s@]{1,64}@[^\s@]{1,189}\.[^\s@]{2,24}$/.test(v.eposta))return hata('eposta',t.bicim);
if(v.telefon&&!(/^\+?[\d\s().-]{7,20}$/.test(v.telefon)&&v.telefon.replace(/\D/g,'').length>=7))return hata('telefon',t.bicim);
if(!v.eposta&&!v.telefon)return hata('eposta',t.ilet);
if(!on.checked)return hata('onay',t.onayh);
btn.disabled=true;const j=await istek('/lead',v);btn.disabled=false;
if(j._s==400&&j.alan){const k=A[j.alan]?j.alan:'eposta',n=j.neden;
return hata(k,k=='onay'?t.onayh:n=='uzun'?t.uzun:n=='bos'?(k=='eposta'||k=='telefon'?t.ilet:t.bos):t.bicim)}
if(j._s==404){st.oturum=null;kaydet()}
if(hataYanit(j))return;
leadF.remove();leadF=null;
const c=j.cevap&&str(j.cevap.metin)?j.cevap:{metin:t.tesekkur};
ekle({rol:'b',metin:c.metin,butonlar:temizB(c.butonlar)});giris.focus()};
leadF=el('form',{class:'ld',novalidate:true,[AL]:t.lb,on:{submit:gonderLead}},
[el('p',{class:'lb',text:t.lb}),A.ad.k,A.ad.h,A.eposta.k,A.eposta.h,A.telefon.k,A.telefon.h,A.notu.k,A.notu.h,
el('label',{class:'on'},[on,el('span',{text:t.onay.replace('{ad}',str(bot.ad))})]),onH,btn]);
log.appendChild(leadF);altaKay();A.ad.g.focus()};

const ac=odak=>{if(kapali||!panel)return;st.acik=true;panel.hidden=false;bas.setAttribute(AE,'true');kok.classList.add('acik');kaydet();altaKay();
if(odak!==false)setTimeout(()=>giris.focus(),0)};
const kapat=geri=>{if(!panel)return;st.acik=false;panel.hidden=true;bas.setAttribute(AE,'false');kok.classList.remove('acik');kaydet();
if(geri!==false&&!kapali)bas.focus()};

const kur=()=>{
const host=el('div',{id:'smc-sohbet'});let root;
try{root=host.attachShadow({mode:'open'})}catch(e){return}
try{const ss=new CSSStyleSheet();ss.replaceSync(CSS);root.adoptedStyleSheets=[ss]}catch(e){root.appendChild(el('style',{text:CSS}))}
const g=bot.gorunum||{},renk=/^#[0-9a-f]{6}$/i.test(str(g.renk))?g.renk:'#4f46e5',baslik=str(g.baslik)||str(bot.ad)||'Chat';
host.style.setProperty('--smc-renk',renk);host.style.setProperty('--smc-yazi',yaziRengi(renk));
rz=el('span',{class:'rz',text:t.devir});
log=el('div',{class:'l',role:'log','aria-live':'polite',[AL]:t.log,tabindex:'0'});
const yazGonder=e=>{e.preventDefault();const m=giris.value.trim();if(!m||mesgul)return;giris.value='';gonder(m.slice(0,500))};
giris=el('textarea',{rows:'1',maxlength:'500',[AL]:t.yaz,placeholder:t.yaz,enterkeyhint:'send',on:{keydown:e=>{if(e.key=='Enter'&&!e.shiftKey&&!e.isComposing)yazGonder(e)}}});
gBtn=el('button',{class:'g',type:'submit',[AL]:t.gonder},[ikon('gonder')]);
panel=el('div',{class:'p',id:'smc-p',role:'dialog',[AL]:baslik,hidden:true,on:{keydown:e=>{if(e.key=='Escape'){e.stopPropagation();kapat()}}}},[
el('div',{class:'b'},[el('span',{class:'t',text:baslik}),rz,el('button',{class:'x',type:'button',[AL]:t.kapat,on:{click:()=>kapat()}},[ikon('x')])]),
log,el('form',{class:'y',on:{submit:yazGonder}},[giris,gBtn]),
el('a',{class:'f',href:'https://socialmediacorner.co',target:'_blank',rel:'noopener',text:t.guc})]);
bas=el('button',{class:'a',type:'button',[AL]:t.ac,[AE]:'false','aria-controls':'smc-p',on:{click:()=>st.acik?kapat():ac()}},[ikon('sohbet')]);
kok=el('div',{class:'k'+(g.konum=='sol'?' sol':'')},[panel,bas]);
root.appendChild(kok);D.body.appendChild(host);
const k=bot.karsilama||{};
if(str(k.metin))ekleCiz({rol:'b',metin:k.metin,butonlar:temizB(k.butonlar)});
st.mesajlar.forEach(ekleCiz);devirCiz();
if(st.acik)ac(false);
W.SMCSohbet={ac:()=>ac(),kapat:()=>kapat()}};

(async()=>{
oku();
const j=await istek('/config');
if(j._s==403){console.warn('SMC sohbet: bu alan adı izinli değil');return}
if(!j.ok||j.aktif!==true||!j.bot||typeof j.bot!='object')return;
bot=j.bot;
let dil=S.getAttribute('data-dil');if(dil!='tr'&&dil!='en')dil=bot.dil=='en'?'en':'tr';t=TX[dil];
if(D.body)kur();else D.addEventListener('DOMContentLoaded',kur,{once:true})})();
})();
