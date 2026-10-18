// saascorner.co'ya özel düzeltmeler (mirror sonrası, asset yeniden yazımından önce)
// Ana sayfa Framer dışı bir kod bileşeni (.sc-scope): menü, .reveal girişleri, sayaçlar, halka grafikleri,
// süreç sekmeleri, SSS, promo/popup JS ile çalışır. stripFramer bu modülü attığı için bileşenin kendi
// başlatma fonksiyonu (Framer modülünden birebir alınmış: saascorner.co.component.js) sayfaya eklenir.
import { readFileSync } from "node:fs";

const F = readFileSync(new URL("./saascorner.co.component.js", import.meta.url), "utf8");
// JS kapalıysa (ya da hata olursa) içerik görünmez kalmasın
const NOSCRIPT = `<noscript><style>.sc-scope .reveal{opacity:1!important;transform:none!important}</style></noscript>`;
const SCRIPT = `<script data-sc-init>(function(){var t=window;${F}function go(){try{F(document.querySelector(".sc-scope")||document)}catch(x){document.querySelectorAll(".reveal").forEach(function(e){e.classList.add("in")})}}document.readyState==="loading"?addEventListener("DOMContentLoaded",go):go()})()</script>`;

// bilgi-merkezi yazılarındaki CMS kalıntıları: görünen slug satırı, "Makale Başlığı:" paragrafı,
// düz metin "Giriş:/Sonuç:" etiketleri (h2'ye) ve meta description'lara eklenmiş ortak kalıp cümleler
const BOILER = / (?:Outsourced Lead Generation için ulaşın!|Tersine mentörlük ile satışınızı(?: geliştirin\.|…))/g;
function cleanArticle(html) {
  if (!html.includes('data-framer-name="slug"') && !html.includes("Makale Başlığı:")) return html;
  return html
    .replace(/<div[^>]*data-framer-name="slug"[^>]*><p[^>]*>[^<]*<\/p><\/div>/g, "")
    .replace(/<p[^>]*>(?:\*\*)?Makale Başlığı:[^<]*<\/p>/g, "")
    .replace(/<p([^>]*)>(?:\*\*)?(Giriş|Sonuç):(?:\*\*)?\s*/g, (_, a, l) => `<h2${a}>${l}</h2><p${a}>`)
    .replace(/(<meta[^>]*description[^>]*>|"description":"[^"]*)/g, (m) => m.replace(BOILER, ""));
}

export function fix(html) {
  html = cleanArticle(html);
  if (!html.includes("sc-scope") || html.includes("data-sc-init")) return html;
  return html.replace("</head>", NOSCRIPT + "</head>").replace("</body>", SCRIPT + "</body>");
}

