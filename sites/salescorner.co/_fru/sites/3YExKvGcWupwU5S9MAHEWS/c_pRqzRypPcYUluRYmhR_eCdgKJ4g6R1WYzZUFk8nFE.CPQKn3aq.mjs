import{t as e}from"./rolldown-runtime.2w95L0-c.mjs";import{A as t,C as n,D as r,I as i,M as a,P as o,R as s,g as c,k as l,l as u,s as d,u as ee,v as te}from"./react.TG0jrHTe.mjs";import{S as ne,a as re,r as ie,t as f}from"./motion.DvOws5Jl.mjs";import{A as p,H as m,P as h,T as g,X as _,a as ae,ft as v,gt as oe,ht as se,j as ce,m as y,mt as b,o as le,pt as ue,s as x,ut as de,xt as S}from"./framer.BEkUkV0y.mjs";import{n as fe,r as pe}from"./SgWppKjGo.C8SsMWBm.mjs";var C,w,T=e((()=>{_(),C={position:`relative`,width:`100%`,height:`100%`,display:`flex`,justifyContent:`center`,alignItems:`center`},w={...C,borderRadius:6,background:`rgba(136, 85, 255, 0.3)`,color:`#85F`,border:`1px dashed #85F`,flexDirection:`column`},x.EventHandler,x.EventHandler,x.EventHandler,x.Number,x.Boolean,x.String,x.Enum})),me=e((()=>{_(),n()})),E=e((()=>{n()})),he=e((()=>{_()})),D=e((()=>{_()})),ge=e((()=>{n()})),_e=e((()=>{_()})),ve=e((()=>{i(),n()})),O=e((()=>{n(),D()})),k=e((()=>{n(),_(),D(),E()})),A=e((()=>{_(),n(),T()}));function j(){return t(()=>g.current()===g.canvas,[])}var M=e((()=>{n(),_()})),N=e((()=>{n()})),P=e((()=>{n(),_(),x.FusedNumber,x.FusedNumber})),F=e((()=>{T(),me(),E(),he(),D(),ge(),_e(),ve(),O(),k(),A(),M(),N(),P()})),ye=e((()=>{F()}));function I({type:e,url:t,html:n,zoom:r,radius:i,border:a,style:o={}}){return e===`url`&&t?u(xe,{url:t,zoom:r,radius:i,border:a,style:o}):e===`html`&&n?u(Ce,{html:n,style:o}):u(be,{style:o})}function be({style:e}){return u(`div`,{style:{minHeight:z(e),...w,overflow:`hidden`,...e},children:u(`div`,{style:H,children:`To embed a website or widget, add it to the properties\xA0panel.`})})}function xe({url:e,zoom:t,radius:n,border:r,style:i}){let s=!i.height;/[a-z]+:\/\//.test(e)||(e=`https://`+e);let c=j(),[l,d]=o(c?void 0:!1);return a(()=>{if(!c)return;let t=!0;d(void 0);async function n(){let n=await fetch(`https://api.framer.com/functions/check-iframe-url?url=`+encodeURIComponent(e));if(n.status==200){let{isBlocked:e}=await n.json();t&&d(e)}else{let e=await n.text();console.error(e),d(Error(`This site can’t be reached.`))}}return n().catch(e=>{console.error(e),d(e)}),()=>{t=!1}},[e]),c&&s?u(R,{message:`URL embeds do not support auto height.`,style:i}):e.startsWith(`https://`)?l===void 0?u(De,{}):l instanceof Error?u(R,{message:l.message,style:i}):l===!0?u(R,{message:`Can’t embed ${e} due to its content security policy.`,style:i}):u(`iframe`,{src:e,style:{...B,...i,...r,zoom:t,borderRadius:n,transformOrigin:`top center`},loading:`lazy`,fetchPriority:c?`low`:`auto`,referrerPolicy:`no-referrer`,sandbox:Se(c),allowFullScreen:!0,allow:`presentation; fullscreen; accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; clipboard-write`}):u(R,{message:`Unsupported protocol.`,style:i})}function Se(e){let t=[`allow-same-origin`,`allow-scripts`];return e||t.push(`allow-downloads`,`allow-forms`,`allow-modals`,`allow-orientation-lock`,`allow-pointer-lock`,`allow-popups`,`allow-popups-to-escape-sandbox`,`allow-presentation`,`allow-storage-access-by-user-activation`,`allow-top-navigation-by-user-activation`),t.join(` `)}function Ce({html:e,...t}){if(e.includes(`<\/script>`)){let n=e.includes(`</spline-viewer>`),r=e.includes(`<!-- framer-direct-embed -->`);return u(n||r?Te:we,{html:e,...t})}return u(Ee,{html:e,...t})}function we({html:e,style:t}){let n=r(),[i,c]=o(0);a(()=>{let e=n.current?.contentWindow;function t(t){if(t.source!==e)return;let n=t.data;if(typeof n!=`object`||!n)return;let r=n.embedHeight;typeof r==`number`&&c(r)}return s.addEventListener(`message`,t),e?.postMessage(`getEmbedHeight`,`*`),()=>{s.removeEventListener(`message`,t)}},[]);let l=`
<html>
    <head>
        <style>
            html, body {
                margin: 0;
                padding: 0;
            }

            body {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            :root {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            * {
                box-sizing: border-box;
                -webkit-font-smoothing: inherit;
            }

            h1, h2, h3, h4, h5, h6, p, figure {
                margin: 0;
            }

            body, input, textarea, select, button {
                font-size: 12px;
                font-family: sans-serif;
            }
        </style>
    </head>
    <body>
        ${e}
        <script type="module">
            let height = 0

            function sendEmbedHeight() {
                window.parent.postMessage({
                    embedHeight: height
                }, "*")
            }

            const observer = new ResizeObserver((entries) => {
                if (entries.length !== 1) return
                const entry = entries[0]
                if (entry.target !== document.body) return

                height = entry.contentRect.height
                sendEmbedHeight()
            })

            observer.observe(document.body)

            window.addEventListener("message", (event) => {
                if (event.source !== window.parent) return
                if (event.data !== "getEmbedHeight") return
                sendEmbedHeight()
            })
        <\/script>
    <body>
</html>
`,d={...B,...t};return t.height||(d.height=i+`px`),u(`iframe`,{ref:n,style:d,srcDoc:l})}function Te({html:e,style:t}){let n=r();return a(()=>{let t=n.current;if(t)return t.innerHTML=e,L(t),()=>{t.innerHTML=``}},[e]),u(`div`,{ref:n,style:{...V,...t}})}function Ee({html:e,style:t}){return u(`div`,{style:{...V,...t},dangerouslySetInnerHTML:{__html:e}})}function L(e){if(e instanceof Element&&e.tagName===`SCRIPT`){let t=document.createElement(`script`);t.text=e.innerHTML;for(let{name:n,value:r}of e.attributes)t.setAttribute(n,r);e.parentElement.replaceChild(t,e)}else for(let t of e.childNodes)L(t)}function De(){return u(`div`,{className:`framerInternalUI-componentPlaceholder`,style:{...C,overflow:`hidden`},children:u(`div`,{style:H,children:`Loading…`})})}function R({message:e,style:t}){return u(`div`,{className:`framerInternalUI-errorPlaceholder`,style:{minHeight:z(t),...C,overflow:`hidden`,...t},children:u(`div`,{style:H,children:e})})}function z(e){if(!e.height)return 200}var B,V,H,Oe=e((()=>{i(),d(),n(),_(),ye(),ce(I,{type:{type:x.Enum,defaultValue:`url`,displaySegmentedControl:!0,options:[`url`,`html`],optionTitles:[`URL`,`HTML`]},url:{title:`URL`,type:x.String,description:`Some websites don’t support embedding.`,hidden(e){return e.type!==`url`}},html:{title:`HTML`,type:x.String,displayTextArea:!0,hidden(e){return e.type!==`html`}},border:{title:`Border`,type:x.Border,optional:!0,hidden(e){return e.type!==`url`}},radius:{type:x.BorderRadius,title:`Radius`,hidden(e){return e.type!==`url`}},zoom:{title:`Zoom`,defaultValue:1,type:x.Number,hidden(e){return e.type!==`url`},min:.1,max:1,step:.1,displayStepper:!0}}),B={width:`100%`,height:`100%`,border:`none`},V={width:`100%`,height:`100%`,display:`flex`,flexDirection:`column`,justifyContent:`center`,alignItems:`center`},H={textAlign:`center`,minWidth:140}})),U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{d(),_(),f(),n(),Oe(),fe(),U=m(I),W={},G=[],K=`framer-jWS4P`,q={cCAHxRfFR:`framer-v-ytrtyd`},J=(e,t,n)=>e&&t?`position`:n,Y=({value:e})=>b()?null:u(`style`,{dangerouslySetInnerHTML:{__html:e},"data-framer-html-style":``}),X=({height:e,id:t,width:n,...r})=>({...r}),Z=S(c(function(e,n){let i=r(null),a=n??i,o=te(),{activeLocale:s,setLocale:c}=se();de();let{style:d,className:f,layoutId:p,variant:m,...g}=X(e);oe(t(()=>pe({},s),[s]));let[_,ce]=ue(m,W,!1),b=h(K),x=l(y)?.isLayoutTemplate,S=J(x,!!l(re)?.transition?.layout);return v({}),u(y.Provider,{value:{activeVariantId:_,primaryVariantId:`cCAHxRfFR`,variantClassNames:q},children:ee(ie,{id:p??o,children:[u(Y,{value:`html body { background: rgb(0, 0, 0); }`}),u(ne.div,{...g,className:h(b,`framer-ytrtyd`,f),ref:a,style:{...d},children:u(ae,{children:u(le,{className:`framer-1kqjmht-container`,isAuthoredByUser:!0,isModuleExternal:!0,layout:S,nodeId:`PkCPQzJUn`,scopeId:`SgWppKjGo`,children:u(I,{height:`100%`,html:``,id:`PkCPQzJUn`,layoutId:`PkCPQzJUn`,radius:`0px`,style:{height:`100%`,width:`100%`},type:`url`,url:`https://saascorner.netlify.app`,width:`100%`,zoom:1})})})}),u(`div`,{id:`overlay`})]})})}),[`@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }`,`.framer-jWS4P.framer-hdfyjb, .framer-jWS4P .framer-hdfyjb { display: block; }`,`.framer-jWS4P.framer-ytrtyd { align-content: center; align-items: center; background-color: #000000; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: flex-start; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 1169px; }`,`.framer-jWS4P .framer-1kqjmht-container { flex: none; height: 883px; position: relative; width: 100%; }`],`framer-jWS4P`),Q=Z,Z.displayName=`Page`,Z.defaultProps={height:883,width:1169},p(Z,[{explicitInter:!0,fonts:[]},...U],{supportsExplicitInterCodegen:!0}),$={exports:{Props:{type:`tsType`,annotations:{framerContractVersion:`1`}},default:{type:`reactComponent`,name:`FramerSgWppKjGo`,slots:[],annotations:{framerCanvasComponentVariantDetails:`{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]}}}`,framerContractVersion:`1`,framerIntrinsicWidth:`1169`,framerColorSyntax:`true`,framerImmutableVariables:`true`,framerScrollSections:`false`,framerAcceptsLayoutTemplate:`true`,framerComponentViewportWidth:`true`,framerIntrinsicHeight:`883`,framerResponsiveScreen:`true`,framerLayoutTemplateFlowEffect:`true`,framerDisplayContentsDiv:`false`,framerAutoSizeImages:`true`}},queryParamNames:{type:`variable`,annotations:{framerContractVersion:`1`}},__FramerMetadata__:{type:`variable`}}}}))();export{$ as __FramerMetadata__,Q as default,G as queryParamNames};
//# sourceMappingURL=c_pRqzRypPcYUluRYmhR_eCdgKJ4g6R1WYzZUFk8nFE.CPQKn3aq.mjs.map