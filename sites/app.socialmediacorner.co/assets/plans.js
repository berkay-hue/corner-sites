/* A9a · plan hakları (Planlar sayfasındaki sayılarla aynı). Zorlama sunucuda: form-worker/src/plans.js aynı sayıları
   taşır (plans.test.mjs ikisinin eşitliğini denetler); aylık sayaç ve Pexels kilidi (/gen/stock yalnız pro/enterprise)
   oradan gelir, Stüdyo kilidi /gen/quota yanıtındaki plan/stock ile gösterir. Bu dosya yalnız veri: fiyat içermez, ağ isteği atmaz.
   Aylık haklar: linkedin_blog = LinkedIn + blog taslağı, video_gorsel = video + görsel taslağı.
   kuyruk/otomatik_paylasim 'yakinda' = LinkedIn/Meta onayı bekleniyor. Enterprise hakları sözleşmeye göre. */
(function(){'use strict';
function don(o){Object.keys(o).forEach(function(k){if(o[k]&&typeof o[k]==='object')don(o[k])});return Object.freeze(o)}
window.SMC_PLANS=don({
  basic:{linkedin_blog:40,video_gorsel:10,marka_sesi:1,pexels:false,kuyruk:false,otomatik_paylasim:false},
  pro:{linkedin_blog:200,video_gorsel:60,marka_sesi:3,pexels:true,kuyruk:'yakinda',otomatik_paylasim:'yakinda'},
  enterprise:{pro_dahil:true,sozlesme:true,ekip_hazirlar:true}
});
})();
