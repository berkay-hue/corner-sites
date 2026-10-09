import{t as e}from"./rolldown-runtime.2w95L0-c.mjs";import{A as t,C as n,D as r,I as i,L as a,M as o,P as s,R as c,c as l,g as u,k as d,l as f,s as p,u as m,v as h}from"./react.TG0jrHTe.mjs";import{S as g,a as _,r as v,t as y}from"./motion.DvOws5Jl.mjs";import{A as b,H as x,I as S,P as C,X as w,a as T,ft as E,gt as D,ht as O,j as k,m as A,mt as j,o as M,pt as N,s as P,ut as F,xt as ee}from"./framer.BEkUkV0y.mjs";import{n as te,t as I}from"./XFQRHO3Yk.BQVsUODk.mjs";import{n as L,r as R}from"./ubqk6lYVt.BHKVuW1A.mjs";function ne(){if(a===void 0)return!0;let e=a.userAgent||``;return!!(!e||e.length<10||G.some(t=>t.test(e))||a.webdriver)}function re(e){return(e>>>0^1515870810).toString(36)}function z({allowedEmails:e=``,estimatedSeconds:t=240,accentColor:n=`#FFB71B`,bgColor:i=`#0D1117`}){let[a,u]=s(!1),[d,p]=s(``),[h,g]=s(``),_=r(`form`),[v,y]=s(`form`),b=e=>{_.current=e,y(e)},[x,S]=s(0),[C,w]=s(null),[T,E]=s(``),D=r(null),O=r(null),k=r(Date.now()),[A,j]=s(``),[M,N]=s(``),P=r(0),F=r(!1),[ee,te]=s(0),I=r(``),L=r(``);o(()=>{let e=()=>{F.current=!0},t=()=>{P.current++};return c.addEventListener(`mousemove`,e,{once:!0}),c.addEventListener(`keydown`,t),()=>{c.removeEventListener(`mousemove`,e),c.removeEventListener(`keydown`,t)}},[]);let[R,z]=s({musteri_adi:``,rapor_tarihi:new Date().toISOString().slice(0,10),rapor_donemi:``,sorumlu_email:`berkay@saascorner.co`,google_sheet_url:``,sheet_name:`Sheet1`,linkedin_baglanti:`0`,linkedin_mesaj:`0`,linkedin_cevap_olumlu:`0`,linkedin_cevap_olumsuz:`0`,cc_toplam:`0`,cc_ulasilan:`0`,cc_olumlu:`0`,gerceklesen_gorusmeler:``,planlanan_gorusmeler:``}),V=(e,t)=>z(n=>({...n,[e]:t})),H=!e.trim(),G=e.split(`,`).map(e=>e.trim().toLowerCase()).filter(Boolean),K=()=>{let e=d.trim().toLowerCase();if(!e){g(`Lütfen email adresinizi girin.`);return}G.includes(e)?(u(!0),g(``),z(t=>({...t,sorumlu_email:e}))):g(`Bu email adresi ile erişim yetkiniz yok.`)};o(()=>(v===`loading`?D.current=setInterval(()=>S(e=>e+1),1e3):(clearInterval(D.current),v!==`loading`&&S(0)),()=>clearInterval(D.current)),[v]),o(()=>()=>{clearInterval(D.current),clearTimeout(O.current)},[]);let q=Math.min(x/t*100,99),J=[...U].reverse().find(e=>q>=e.pct)||U[0],Y=()=>{w({company:I.current,waitForEmail:!0,sorumlu_email:L.current}),b(`success`)},X=async()=>{if(A||M){b(`loading`),setTimeout(()=>{E(`İşlem tamamlanamadı.`),b(`error`)},3e3);return}let e=Date.now()-k.current;if(e<3e3||ne()||!F.current&&P.current<2){b(`loading`),setTimeout(()=>{E(`İşlem tamamlanamadı.`),b(`error`)},3e3);return}if(ee>=3){E(`Çok fazla deneme. Sayfayı yenileyip tekrar deneyin.`),b(`error`);return}if(!R.musteri_adi||!R.rapor_tarihi||!R.rapor_donemi||!R.sorumlu_email||!R.google_sheet_url){E(`Lütfen zorunlu alanları (*) doldurun.`);return}E(``),b(`loading`),S(0),te(e=>e+1),I.current=R.musteri_adi,L.current=R.sorumlu_email,O.current=setTimeout(()=>{_.current===`loading`&&Y()},t*1e3);try{let t=new AbortController,n=setTimeout(()=>t.abort(),3e5),r=await fetch(B,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({...R,_formLoadedAt:String(k.current),_submitTime:String(Date.now()),_timeOnPage:String(e),_token:re(k.current),_interactionScore:String((F.current?1:0)+Math.min(P.current,10))}),signal:t.signal});clearTimeout(n);let i,a=await r.text();try{i=JSON.parse(a)}catch{i=r.ok?{success:!0}:null}if(!i)throw Error(`HTTP ${r.status}: ${a}`);if(Array.isArray(i)&&(i=i[0]||{}),i.json&&typeof i.json==`object`&&(i=i.json),i.presentationUrl||i.presentationId){clearTimeout(O.current),w(i),b(`success`);return}if(r.ok||i.success||i.status===`processing`)return;throw Error(i.message||i.error||`Bilinmeyen bir hata oluştu.`)}catch(e){e.name===`AbortError`?(clearTimeout(O.current),_.current===`loading`&&Y()):(clearTimeout(O.current),E(e.message||`Bağlantı hatası.`),b(`error`))}},Z=()=>{clearTimeout(O.current),b(`form`),w(null),E(``),k.current=Date.now()},Q=H||a;return m(`div`,{className:`hr`,children:[f(`style`,{children:ae(n,i)}),m(`div`,{className:`hd`,children:[f(`div`,{className:`hl`,children:`SC`}),m(`div`,{children:[f(`div`,{className:`ht`,children:`Haftalık Multi-Channel Raporu`}),f(`div`,{className:`hs`,children:`V9 PRO — SAAS Corner`})]})]}),!Q&&m(`div`,{className:`auth-box`,children:[f(`div`,{style:{fontSize:36},children:`🔐`}),m(`p`,{children:[`Bu form yalnızca yetkili kullanıcılara açıktır.`,f(`br`,{}),`Devam etmek için email adresinizi girin.`]}),m(`div`,{className:`auth-input-wrap`,children:[f(`input`,{className:`fi`,type:`email`,placeholder:`ornek@sirket.com`,value:d,onChange:e=>{p(e.target.value),g(``)},onKeyDown:e=>e.key===`Enter`&&K()}),f(`button`,{className:`btn`,onClick:K,children:`Giriş`})]}),h&&m(`div`,{className:`auth-err`,children:[`⚠️ `,h]})]}),Q&&v===`success`&&f(`div`,{className:`ok`,children:C?.presentationUrl?m(l,{children:[f(`div`,{className:`ck`,children:`✅`}),f(`h2`,{children:`Rapor Hazır!`}),f(`p`,{children:C?.message||`${C?.company||``} raporu oluşturuldu!${C?.slideCount?` ${C.slideCount} slide hazır.`:``}`}),f(`a`,{href:C.presentationUrl,target:`_blank`,rel:`noopener noreferrer`,className:`lk`,children:`📊 Raporu Düzenle →`}),C?.presentationViewUrl&&f(`a`,{href:C.presentationViewUrl,target:`_blank`,rel:`noopener noreferrer`,className:`lk lk2`,children:`🖥 Sunum Modu →`}),f(`button`,{className:`rb`,onClick:Z,children:`← Yeni Rapor Oluştur`})]}):m(l,{children:[f(`div`,{className:`ck`,children:`📬`}),f(`h2`,{children:`Rapor Hazırlanıyor`}),m(`p`,{children:[f(`strong`,{style:{color:`#F8FAFC`},children:C?.company||``}),` `,`için rapor arka planda oluşturuluyor.`]}),m(`div`,{className:`email-notice`,children:[f(`div`,{className:`en-title`,children:`📋 Süreç adımları`}),[`Google Sheets verisi okundu`,`AI analiz çalışıyor`,`Google Slides oluşturuluyor`,`Email ile gönderilecek`].map((e,t)=>m(`div`,{className:`en-item ${t<1?`done`:t===1?`active`:``}`,children:[t<1?`✓`:t===1?`⟳`:`○`,` `,e]},t))]}),m(`p`,{style:{fontSize:12,color:`#475569`},children:[`Sunum tamamlandığında`,` `,f(`strong`,{style:{color:n},children:C?.sorumlu_email||``}),` `,`adresine gönderilecek.`]}),f(`button`,{className:`rb`,onClick:Z,children:`← Yeni Rapor Oluştur`})]})}),Q&&(v===`form`||v===`error`)&&m(`div`,{children:[f(`div`,{className:`hp-trap`,"aria-hidden":`true`,children:f(`input`,{id:`website_url`,name:`website_url`,type:`text`,tabIndex:-1,autoComplete:`off`,value:A,onChange:e=>j(e.target.value)})}),f(`div`,{className:`hp-trap`,"aria-hidden":`true`,children:f(`input`,{id:`phone_number`,name:`phone_number`,type:`text`,tabIndex:-1,autoComplete:`off`,value:M,onChange:e=>N(e.target.value)})}),f(`div`,{className:`sec`,children:`📋 Genel Bilgiler`}),m(`div`,{className:`fg`,children:[m(`label`,{className:`fl`,children:[f(`span`,{className:`rq`,children:`*`}),` Müşteri`]}),m(`select`,{className:`fs`,value:R.musteri_adi,onChange:e=>V(`musteri_adi`,e.target.value),children:[f(`option`,{value:``,children:`Seçiniz...`}),ie.map(e=>f(`option`,{value:e,children:e},e))]})]}),m(`div`,{className:`rw`,children:[m(`div`,{className:`fg`,children:[m(`label`,{className:`fl`,children:[f(`span`,{className:`rq`,children:`*`}),` Rapor Tarihi`]}),f(`input`,{className:`fi`,type:`date`,value:R.rapor_tarihi,onChange:e=>V(`rapor_tarihi`,e.target.value)})]}),m(`div`,{className:`fg`,children:[m(`label`,{className:`fl`,children:[f(`span`,{className:`rq`,children:`*`}),` Rapor Dönemi`]}),f(`input`,{className:`fi`,placeholder:`10.02.2026 - 17.02.2026`,value:R.rapor_donemi,onChange:e=>V(`rapor_donemi`,e.target.value)})]})]}),m(`div`,{className:`rw`,children:[m(`div`,{className:`fg`,children:[m(`label`,{className:`fl`,children:[f(`span`,{className:`rq`,children:`*`}),` Sorumlu Email`]}),f(`input`,{className:`fi`,type:`email`,placeholder:`berkay@saascorner.co`,value:R.sorumlu_email,onChange:e=>V(`sorumlu_email`,e.target.value)})]}),m(`div`,{className:`fg`,children:[f(`label`,{className:`fl`,children:`Sheet Adı`}),f(`input`,{className:`fi`,placeholder:`Sheet1`,value:R.sheet_name,onChange:e=>V(`sheet_name`,e.target.value)})]})]}),m(`div`,{className:`fg`,children:[m(`label`,{className:`fl`,children:[f(`span`,{className:`rq`,children:`*`}),` Google Sheet URL`]}),f(`input`,{className:`fi`,placeholder:`https://docs.google.com/spreadsheets/d/xxx`,value:R.google_sheet_url,onChange:e=>V(`google_sheet_url`,e.target.value)})]}),f(`div`,{className:`sec`,children:`🔗 LinkedIn`}),m(`div`,{className:`rw`,children:[m(`div`,{className:`fg`,children:[f(`label`,{className:`fl`,children:`Bağlantı İsteği`}),f(`input`,{className:`fi`,type:`number`,placeholder:`200`,value:R.linkedin_baglanti,onChange:e=>V(`linkedin_baglanti`,e.target.value)})]}),m(`div`,{className:`fg`,children:[f(`label`,{className:`fl`,children:`Mesaj`}),f(`input`,{className:`fi`,type:`number`,placeholder:`100`,value:R.linkedin_mesaj,onChange:e=>V(`linkedin_mesaj`,e.target.value)})]})]}),m(`div`,{className:`rw`,children:[m(`div`,{className:`fg`,children:[f(`label`,{className:`fl`,children:`Olumlu Cevap`}),f(`input`,{className:`fi`,type:`number`,placeholder:`5`,value:R.linkedin_cevap_olumlu,onChange:e=>V(`linkedin_cevap_olumlu`,e.target.value)})]}),m(`div`,{className:`fg`,children:[f(`label`,{className:`fl`,children:`Olumsuz Cevap`}),f(`input`,{className:`fi`,type:`number`,placeholder:`2`,value:R.linkedin_cevap_olumsuz,onChange:e=>V(`linkedin_cevap_olumsuz`,e.target.value)})]})]}),f(`div`,{className:`sec`,children:`📞 Cold Call`}),m(`div`,{className:`r3`,children:[m(`div`,{className:`fg`,children:[f(`label`,{className:`fl`,children:`Toplam`}),f(`input`,{className:`fi`,type:`number`,placeholder:`70`,value:R.cc_toplam,onChange:e=>V(`cc_toplam`,e.target.value)})]}),m(`div`,{className:`fg`,children:[f(`label`,{className:`fl`,children:`Ulaşılan`}),f(`input`,{className:`fi`,type:`number`,placeholder:`20`,value:R.cc_ulasilan,onChange:e=>V(`cc_ulasilan`,e.target.value)})]}),m(`div`,{className:`fg`,children:[f(`label`,{className:`fl`,children:`Olumlu`}),f(`input`,{className:`fi`,type:`number`,placeholder:`5`,value:R.cc_olumlu,onChange:e=>V(`cc_olumlu`,e.target.value)})]})]}),f(`div`,{className:`sec`,children:`📅 Görüşmeler`}),m(`div`,{className:`fg`,children:[f(`label`,{className:`fl`,children:`Gerçekleşen Görüşmeler`}),f(`textarea`,{className:`ft`,placeholder:`Firma | Kişi | Title | Tarih
ABC Ltd | Ali Yılmaz | CEO | 12.02.2026`,value:R.gerceklesen_gorusmeler,onChange:e=>V(`gerceklesen_gorusmeler`,e.target.value)})]}),m(`div`,{className:`fg`,children:[f(`label`,{className:`fl`,children:`Planlanan Görüşmeler`}),f(`textarea`,{className:`ft`,placeholder:`Firma | Kişi | Title | Tarih
XYZ A.Ş. | Ayşe Demir | CTO | 20.02.2026`,value:R.planlanan_gorusmeler,onChange:e=>V(`planlanan_gorusmeler`,e.target.value)})]}),T&&m(`div`,{className:`er`,children:[`⚠️ `,T]}),f(`button`,{className:`btn`,onClick:X,children:`🚀 Rapor Oluştur`})]}),Q&&v===`loading`&&m(`div`,{className:`ld`,children:[f(`div`,{className:`sp`}),m(`div`,{className:`pw`,children:[f(`div`,{className:`pt`,children:W(x)}),f(`div`,{className:`pb`,children:f(`div`,{className:`pf`,style:{width:`${q}%`}})}),f(`div`,{className:`ps`,children:J.label}),m(`div`,{className:`pe`,children:[`Tahmini süre: ~`,W(t)]})]})]})]})}var B,ie,V,H,ae,U,W,G,K=e((()=>{i(),p(),n(),w(),B=`https://smcorner.app.n8n.cloud/webhook/analiz`,ie=[`Active`,`Vomsis`,`Alarnova`,`HiRi.ai`,`Seamona`,`Diğer`],V=`'DM Sans', system-ui, sans-serif`,H=`'JetBrains Mono', 'SF Mono', monospace`,ae=(e,t)=>`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');

.hr * { box-sizing: border-box; margin: 0; padding: 0; }
.hr {
    font-family: ${V};
    background: ${t};
    color: #E2E8F0;
    min-height: 100%;
    padding: 28px;
    position: relative;
    overflow-y: auto;
}
.hr::before {
    content: '';
    position: absolute;
    top: -100px; right: -100px;
    width: 360px; height: 360px;
    background: radial-gradient(circle, ${e}15 0%, transparent 70%);
    pointer-events: none;
}
.hd { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; position: relative; }
.hl {
    width: 40px; height: 40px;
    background: ${e};
    border-radius: 10px;
    display: grid; place-items: center;
    font-weight: 700; font-size: 16px;
    color: ${t};
    box-shadow: 0 0 20px ${e}40;
}
.ht { font-size: 18px; font-weight: 700; color: #F8FAFC; letter-spacing: -0.3px; }
.hs { font-size: 11px; color: #64748B; font-weight: 300; margin-top: 1px; letter-spacing: 0.3px; }
.sec {
    display: flex; align-items: center; gap: 10px;
    font-size: 10px; font-weight: 700;
    color: ${e};
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 20px 0 8px;
}
.sec::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, ${e}30, transparent); }
.fg { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
.fl { font-size: 11px; font-weight: 500; color: #94A3B8; display: flex; align-items: center; gap: 3px; }
.fl .rq { color: ${e}; font-size: 13px; }
.fi, .fs, .ft {
    background: #0F172A;
    border: 1px solid #1E293B;
    border-radius: 8px;
    padding: 9px 12px;
    color: #E2E8F0;
    font-family: ${V};
    font-size: 13px;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
    width: 100%;
}
.fi:focus, .fs:focus, .ft:focus { border-color: ${e}; box-shadow: 0 0 0 3px ${e}18; }
.fi::placeholder, .ft::placeholder { color: #334155; font-weight: 300; }
.fs {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 32px;
    cursor: pointer;
}
.fs option { background: #0F172A; color: #E2E8F0; }
.ft { min-height: 72px; resize: vertical; font-family: ${H}; font-size: 12px; line-height: 1.5; }
.rw { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.r3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.btn {
    background: ${e};
    color: ${t};
    border: none;
    border-radius: 10px;
    padding: 13px 24px;
    font-family: ${V};
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.3px;
    margin-top: 12px;
    width: 100%;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px ${e}40; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.auth-box {
    display: flex; flex-direction: column; align-items: center;
    gap: 16px; padding: 48px 20px; text-align: center;
}
.auth-box p { color: #94A3B8; font-size: 13px; line-height: 1.5; }
.auth-input-wrap { display: flex; gap: 8px; width: 100%; max-width: 360px; }
.auth-input-wrap .fi { flex: 1; }
.auth-input-wrap .btn { width: auto; margin-top: 0; padding: 9px 20px; font-size: 13px; }
.auth-err { color: #FCA5A5; font-size: 12px; }
.ld {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 24px; padding: 60px 20px;
}
@keyframes fi { from { opacity: 0; } to { opacity: 1; } }
.sp {
    width: 48px; height: 48px;
    border: 3px solid #1E293B;
    border-top-color: ${e};
    border-radius: 50%;
    animation: sn 0.8s linear infinite;
}
@keyframes sn { to { transform: rotate(360deg); } }
.pw { width: 240px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.pb { width: 100%; height: 4px; background: #1E293B; border-radius: 4px; overflow: hidden; }
.pf { height: 100%; background: linear-gradient(90deg, ${e}, ${e}AA); border-radius: 4px; transition: width 1s linear; }
.pt { font-family: ${H}; font-size: 20px; font-weight: 500; color: ${e}; letter-spacing: 1px; }
.ps { font-size: 10px; color: #64748B; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 500; }
.pe { font-size: 12px; color: #475569; }
.ok {
    display: flex; flex-direction: column;
    align-items: center; gap: 16px;
    padding: 36px 16px; text-align: center;
    animation: fi 0.4s ease;
}
.ck { width: 56px; height: 56px; background: ${e}18; border-radius: 50%; display: grid; place-items: center; font-size: 26px; }
.ok h2 { color: #F8FAFC; font-size: 18px; font-weight: 700; }
.ok p { color: #94A3B8; font-size: 13px; line-height: 1.5; }
.email-notice {
    background: #0F172A;
    border: 1px solid #1E293B;
    border-radius: 10px;
    padding: 14px 18px;
    text-align: left;
    width: 100%;
    max-width: 340px;
}
.email-notice .en-title { font-size: 11px; font-weight: 700; color: ${e}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.email-notice .en-item { font-size: 12px; color: #64748B; padding: 3px 0; display: flex; align-items: center; gap: 6px; }
.email-notice .en-item.done { color: #10B981; }
.email-notice .en-item.active { color: #E2E8F0; }
.lk {
    display: inline-flex; align-items: center; gap: 5px;
    background: ${e}; color: ${t};
    padding: 11px 22px; border-radius: 8px;
    font-weight: 700; font-size: 13px;
    text-decoration: none; transition: all 0.2s;
}
.lk:hover { box-shadow: 0 6px 20px ${e}40; transform: translateY(-1px); }
.lk2 { background: transparent; border: 1px solid ${e}60; color: ${e}; }
.rb {
    background: none; border: 1px solid #1E293B; color: #64748B;
    padding: 9px 18px; border-radius: 8px;
    font-family: ${V}; font-size: 12px; cursor: pointer;
    transition: all 0.2s;
}
.rb:hover { border-color: #334155; color: #94A3B8; }
.er { background: #7F1D1D22; border: 1px solid #7F1D1D; border-radius: 8px; padding: 10px 14px; color: #FCA5A5; font-size: 12px; margin-top: 4px; }
.hp-trap {
    position: absolute; left: -9999px; top: -9999px;
    width: 0; height: 0; overflow: hidden; opacity: 0; pointer-events: none;
}
`,U=[{pct:0,label:`Veri gönderiliyor...`},{pct:8,label:`Google Sheets okunuyor...`},{pct:20,label:`CSV verisi işleniyor...`},{pct:35,label:`AI Rapor Analisti çalışıyor...`},{pct:55,label:`Gemini analiz yapıyor...`},{pct:72,label:`Google Slides oluşturuluyor...`},{pct:85,label:`Slides güncelleniyor...`},{pct:93,label:`Paylaşım ayarlanıyor...`},{pct:97,label:`Email gönderiliyor...`}],W=e=>`${Math.floor(e/60)}:${(e%60).toString().padStart(2,`0`)}`,G=[/bot\b/i,/crawler/i,/spider/i,/headless/i,/phantom/i,/selenium/i,/puppeteer/i,/^curl/i,/^wget/i,/python-requests/i],k(z,{allowedEmails:{type:P.String,title:`Yetkili Email'ler`,defaultValue:``,description:`Virgülle ayırarak girin.`},estimatedSeconds:{type:P.Number,title:`Tahmini Süre (sn)`,defaultValue:240,min:30,max:600,step:10},accentColor:{type:P.Color,title:`Accent Renk`,defaultValue:`#FFB71B`},bgColor:{type:P.Color,title:`Arkaplan Renk`,defaultValue:`#0D1117`}})})),q,J,Y,X,Z,Q,oe,se,ce,le,$,ue,de;e((()=>{p(),w(),y(),n(),te(),K(),L(),q=x(z),J=x(I),Y={},X=[],Z=`framer-KACoq`,Q={nIdvyvqsG:`framer-v-3hdt8m`},oe=(e,t,n)=>e&&t?`position`:n,se=(...e)=>{for(let t of e)if(t&&typeof t==`string`)return t},ce=({value:e})=>j()?null:f(`style`,{dangerouslySetInnerHTML:{__html:e},"data-framer-html-style":``}),le=({height:e,id:t,width:n,...r})=>({...r}),$=ee(u(function(e,n){let i=r(null),a=n??i,o=h(),{activeLocale:s,setLocale:c}=O(),l=F(),{style:u,className:p,layoutId:y,variant:b,...x}=le(e);D(t(()=>R({},s),[s]));let[S,w]=N(b,Y,!1),k=C(Z),j=d(A)?.isLayoutTemplate,P=oe(j,!!d(_)?.transition?.layout);return E({}),f(A.Provider,{value:{activeVariantId:S,primaryVariantId:`nIdvyvqsG`,variantClassNames:Q},children:m(v,{id:y??o,children:[f(ce,{value:`html body { background: rgb(255, 255, 255); }`}),m(g.div,{...x,className:C(k,`framer-3hdt8m`,p),ref:a,style:{...u},children:[f(T,{children:f(M,{className:`framer-15lpn28-container`,isAuthoredByUser:!0,layout:P,nodeId:`Kn4uMQmSX`,scopeId:`ubqk6lYVt`,children:f(z,{accentColor:`rgb(255, 183, 27)`,allowedEmails:``,bgColor:`rgb(13, 17, 23)`,estimatedSeconds:120,height:`100%`,id:`Kn4uMQmSX`,layoutId:`Kn4uMQmSX`,width:`100%`})})}),f(T,{height:64,width:l?.width||`100vw`,y:(l?.y||0)+0,children:f(M,{className:`framer-tpn1b9-container`,layout:P,nodeId:`w7Eg8X5SW`,scopeId:`ubqk6lYVt`,children:f(I,{height:`100%`,id:`w7Eg8X5SW`,layoutId:`w7Eg8X5SW`,style:{width:`100%`},variant:se(`vplCE4OP0`),width:`100%`})})})]}),f(`div`,{id:`overlay`})]})})}),[`@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }`,`.framer-KACoq.framer-vbbopm, .framer-KACoq .framer-vbbopm { display: block; }`,`.framer-KACoq.framer-3hdt8m { background-color: #ffffff; height: 5669px; overflow: var(--overflow-clip-fallback, clip); position: relative; width: 1600px; }`,`.framer-KACoq .framer-15lpn28-container { flex: none; height: auto; left: 50%; position: absolute; top: 142px; transform: translateX(-50%); width: auto; }`,`.framer-KACoq .framer-tpn1b9-container { flex: none; height: auto; left: 0px; position: absolute; right: 0px; top: 0px; }`],`framer-KACoq`),ue=$,$.displayName=`Page 4`,$.defaultProps={height:5669,width:1600},b($,[{explicitInter:!0,fonts:[]},...q,...J],{supportsExplicitInterCodegen:!0}),$.loader={load:(e,t)=>(t.locale,Promise.allSettled([S(I,{},t)]))},de={exports:{default:{type:`reactComponent`,name:`Framerubqk6lYVt`,slots:[],annotations:{framerAutoSizeImages:`true`,framerIntrinsicWidth:`1600`,framerComponentViewportWidth:`true`,framerAcceptsLayoutTemplate:`false`,framerContractVersion:`1`,framerDisplayContentsDiv:`false`,framerIntrinsicHeight:`5669`,framerImmutableVariables:`true`,framerCanvasComponentVariantDetails:`{"propertyName":"variant","data":{"default":{"layout":["fixed","fixed"]}}}`,framerColorSyntax:`true`,framerResponsiveScreen:`true`,framerLayoutTemplateFlowEffect:`true`,framerScrollSections:`false`}},queryParamNames:{type:`variable`,annotations:{framerContractVersion:`1`}},Props:{type:`tsType`,annotations:{framerContractVersion:`1`}},__FramerMetadata__:{type:`variable`}}}}))();export{de as __FramerMetadata__,ue as default,X as queryParamNames};
//# sourceMappingURL=uCHv9Q8K-bG71FqP1PO0ZsoARaGVHg8yBJK-M2HKhgQ.DX1i3Q2B.mjs.map