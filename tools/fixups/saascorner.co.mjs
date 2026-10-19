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
  html = html
    .replace(/<div[^>]*data-framer-name="slug"[^>]*><p[^>]*>[^<]*<\/p><\/div>/g, "")
    .replace(/<p[^>]*>(?:\*\*)?Makale Başlığı:[^<]*<\/p>/g, "")
    .replace(/<p([^>]*)>(?:\*\*)?(Giriş|Sonuç):(?:\*\*)?\s*/g, (_, a, l) => `<h2${a}>${l}</h2><p${a}>`)
    .replace(/(<h2[^>]*>(?:Giriş|Sonuç)<\/h2>)<p[^>]*>\s*<\/p>/g, "$1")
    // kısa, noktalamasız düz paragraflar ("Bölüm 1: …", "ICP ve Buyer Persona: …") alt başlıktır
    .replace(/<p( dir="auto" class="[^"]*")>([^<]{3,90})<\/p>/g, (m, a, t) =>
      /^Bölüm \d+:/.test(t) || (!/[.!?:;,…]["'”»)]*\s*$/.test(t) && !/^Örnek:/.test(t) && /^[A-ZÇĞİÖŞÜ0-9]/.test(t)) ? `<h2${a}>${t}</h2>` : m)
    .replace(/(<meta[^>]*description[^>]*>|"description":"[^"]*)/g, (m) => m.replace(BOILER, ""));
  // açıklama: başlığın tekrarı yerine gövdenin ilk ~150 karakteri
  const body = html.match(/<h2[^>]*>Giriş<\/h2><p[^>]*>([^<]{40,})/)?.[1];
  if (!body) return html;
  let d = body.replace(/\s+/g, " ").trim();
  if (d.length > 155) d = d.slice(0, 150).replace(/\s+\S*$/, "") + "…";
  const h = d.replace(/&/g, "&amp;").replace(/"/g, "&quot;"), j = d.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const title = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  html = html.replace(/(<meta (?:name|property)="(?:og:|twitter:)?description" content=")[^"]*"/g, `$1${h}"`);
  return title ? html.split(`"description":"${title}"`).join(`"description":"${j}"`) : html;
}

export function fix(html) {
  html = cleanArticle(html);
  if (!html.includes("sc-scope") || html.includes("data-sc-init")) return html;
  return html.replace("</head>", NOSCRIPT + "</head>").replace("</body>", SCRIPT + "</body>");
}

