// salescorner.co'ya özel düzeltmeler (mirror sonrası, asset yeniden yazımından önce)
// İçerik Framer dışı bir kod bileşeni: girişte inline "opacity:0;transform:..." ile başlar ve JS ile
// görünür olur. JS olmadan sayfa siyah kalır: mirror'ın data-sk-reveal kalıbına çevrilir.
// Framer öğeleri (kapalı menü vb. varyant durumu) ve hover parıltı katmanları ("transition:opacity")
// bilerek görünmezdir: dokunulmaz.
const REVEAL = `<style>.sk-js [data-sk-reveal]:not(.sk-in){opacity:0;transform:var(--sk-from)}[data-sk-reveal]{transition:opacity .6s ease,transform .6s ease}</style>` +
  `<script>document.documentElement.classList.add("sk-js");addEventListener("DOMContentLoaded",()=>{const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("sk-in");o.unobserve(e.target)}}),{rootMargin:"0px 0px -10% 0px"});document.querySelectorAll("[data-sk-reveal]").forEach(el=>o.observe(el))})</script>`;

export function fix(html) {
  let n = 0;
  html = html.replace(/<[a-z][a-z0-9]*\b[^<>]*>/g, tag => {
    if (/\bclass="framer-/.test(tag) || tag.includes("data-sk-reveal")) return tag;
    return tag.replace(/style="([^"]*)"/, (full, s) => {
      if (!/(^|;)opacity:0(;|$)/.test(s) || /(^|;)transition:opacity/.test(s)) return full;
      const t = s.match(/(?:^|;)transform:([^;]*)/)?.[1] || "none";
      s = s.replace(/(^|;)opacity:0(?=;|$)/, "$1").replace(/(^|;)transform:[^;]*/, "$1").replace(/;;+/g, ";").replace(/^;|;$/g, "");
      n++; return `data-sk-reveal style="${s ? s + ";" : ""}--sk-from:${t}"`;
    });
  });
  if (n && !html.includes(".sk-js [data-sk-reveal]")) html = html.replace("</head>", REVEAL + "</head>");
  return html;
}
