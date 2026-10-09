// yalcinberkay.com.tr'ye özel düzeltmeler (mirror sonrası, asset yeniden yazımından önce)
export function fix(html, path) {
  // Nav ikonlarının hover etiketi (Framer'da JS varyantı)
  html = html.replace("</head>", `<style>nav a .framer-1drsfbq{transition:opacity .2s}nav a:hover .framer-1drsfbq{opacity:1!important}</style></head>`);
  // CMS "Load More" Framer JS olmadan çalışmaz: tam liste /tools'ta
  if (html.includes("Load More")) {
    html = html.replace("</body>", `<script>document.querySelectorAll(".framer-qxdgif-container").forEach(c=>{c.style.cursor="pointer";c.addEventListener("click",()=>location.href="/tools")})</script></body>`);
  }
  return html;
}
