/* A9a · plan hakları (Planlar sayfasındaki sayılarla aynı). Zorlama sunucuda: form-worker/src/plans.js aynı sayıları
   taşır (plans.test.mjs ikisinin eşitliğini denetler); aylık sayaç ve Pexels kilidi (/gen/stock pro/enterprise'da sınırsız;
   demo/basic'te pexels_deneme kadar ömür boyu deneme görseli, worker stock_trial) oradan gelir, Stüdyo kilidi /gen/quota yanıtındaki plan/stock ile gösterir. Bu dosya yalnız veri: fiyat içermez, ağ isteği atmaz.
   Aylık haklar: linkedin_blog = LinkedIn + blog taslağı, video_gorsel = video + görsel taslağı.
   kuyruk/otomatik_paylasim 'yakinda' = LinkedIn/Meta onayı bekleniyor. Enterprise hakları sözleşmeye göre.
   cms_sites (A14): bağlanabilecek web sitesi (blog) sayısı; demo/basic 0 (otomatik blog Pro'dan itibaren), pro 1,
   enterprise 1 (ek site iletişimle, sözleşmeye göre).
   cms_per_week: otomatik blog sıklığı tavanı (haftada en çok; 7 = günde 1). demo/basic 0, pro 3, günde 1 yalnız enterprise.
   demo (A15): kayıtla gelen 14 günlük deneme (deneme_gun); haklar aylık değil deneme boyunca toplam. */
(function(){'use strict';
function don(o){Object.keys(o).forEach(function(k){if(o[k]&&typeof o[k]==='object')don(o[k])});return Object.freeze(o)}
window.SMC_PLANS=don({
  demo:{linkedin_blog:4,video_gorsel:1,marka_sesi:1,pexels:false,pexels_deneme:1,kuyruk:false,otomatik_paylasim:false,cms_sites:0,cms_per_week:0,deneme_gun:14},
  basic:{linkedin_blog:8,video_gorsel:2,marka_sesi:1,pexels:false,pexels_deneme:1,kuyruk:false,otomatik_paylasim:false,cms_sites:0,cms_per_week:0},
  pro:{linkedin_blog:40,video_gorsel:12,marka_sesi:3,pexels:true,pexels_deneme:0,kuyruk:'yakinda',otomatik_paylasim:'yakinda',cms_sites:1,cms_per_week:3},
  enterprise:{pro_dahil:true,sozlesme:true,ekip_hazirlar:true,cms_sites:1,cms_per_week:7}
});
})();
