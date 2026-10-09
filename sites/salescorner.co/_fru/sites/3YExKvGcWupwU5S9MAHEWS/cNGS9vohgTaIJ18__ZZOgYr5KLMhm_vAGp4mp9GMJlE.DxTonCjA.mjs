import{t as e}from"./rolldown-runtime.2w95L0-c.mjs";async function t(e,t,i){let a=r[e],o=a?await a(t,i):void 0,s={bodyEnd:[],bodyStart:[],headEnd:[],headStart:[]};for(let t of n){if(t.pageIds&&!t.pageIds.has(e))continue;let n=t.code(o);n&&s[t.placement].push({...t,code:n})}return s}var n,r,i,a;e((()=>{n=[{code:e=>`<!-- Event snippet for Sayfa görüntüleme conversion page -->
<script>
  gtag('event', 'conversion', {
      'send_to': 'AW-17132829941/7TecCKOW1NaAEPX5yOk_',
      'value': 1.0,
      'currency': 'TRY'
  });
<\/script>
`,id:`legacy-headEnd-oj5I4nJZx`,loadMode:`once`,name:`Custom Code (Legacy)`,pageIds:new Set([`oj5I4nJZx`]),placement:`headEnd`},{code:e=>`<script type="module">
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

  const supabase = createClient(
    'https://udhprgrkbdeodokxrdsi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaHByZ3JrYmRlb2Rva3hyZHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTMwMDYsImV4cCI6MjA5MDQ2OTAwNn0.UI2Z8c361AIz7NGhmJpp_7MVl2on0Tx5GivlcPdOibs'
  )

  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    window.location.href = '/login'
  }
<\/script>`,id:`O6knMBCh5`,loadMode:`once`,name:`Dashboard Guard`,pageIds:new Set([`EhOaP0Wda`,`ftCGAWreG`,`OOndN4oxO`,`aq1YSjiaP`,`pJcLa8GKm`,`sorcYSogW`,`rcdPupaZJ`,`czH6vlKBh`,`ubqk6lYVt`,`m3zeoyCse`,`lt09WLPJx`,`xAKCppetE`,`rzylvqZj4`,`I_UcWtIZK`]),placement:`bodyEnd`}],r={},i={bodyEnd:[`GPITHDvM1`,`O6knMBCh5`],bodyStart:[`legacy-bodyStart-plugin-4547ab`],headEnd:[`legacy-headEnd-oj5I4nJZx`],headStart:[`legacy-headStart`]},a={exports:{snippetsSorting:{type:`variable`,annotations:{framerContractVersion:`1`}},getSnippets:{type:`function`,annotations:{framerContractVersion:`1`}},__FramerMetadata__:{type:`variable`}}}}))();export{a as __FramerMetadata__,t as getSnippets,i as snippetsSorting};
//# sourceMappingURL=cNGS9vohgTaIJ18__ZZOgYr5KLMhm_vAGp4mp9GMJlE.DxTonCjA.mjs.map