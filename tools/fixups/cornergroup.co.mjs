// cornergroup.co'ya özel düzeltmeler (mirror sonrası, asset yeniden yazımından önce)
// Ana sayfa tek bir Framer kod bileşeni (React); runtime atılınca SSR anındaki durum donar:
// zaman çizelgesi kartları soluk/kaymış kalır, yorum carousel'leri dönmez, çerez bandı kapanmaz.
// Bu durumlar küçük bir vanilla script ile orijinal bileşenin davranışına göre yeniden canlandırılır.
// Ayrıca React SSR <style> içindeki metni HTML-escape etmiş (&#x27; &gt; &amp;): CSS'te bunlar
// literal kalır, Google Fonts @import'u ve "a > b" seçicileri bozulur.
const NOSCRIPT = `<noscript><style>#growth [data-cg-card]{opacity:1!important;transform:none!important}</style></noscript>`;
const SCRIPT = `<script data-cg-init>(function(){
function tl(){var s=document.getElementById("growth");if(!s)return;var rows=[].slice.call(s.querySelectorAll("[data-cg-row]"));if(!rows.length)return;
var bar=s.querySelector("[data-cg-bar]"),n=rows.length;
function up(){var r=s.getBoundingClientRect(),h=innerHeight,p=Math.max(0,Math.min(1,(h-r.top)/(r.height+h)));
if(bar)bar.style.height=p*100+"%";
rows.forEach(function(row,i){var a=Math.max(0,Math.min(1,(p-i/n)*n))>.05,o=i%2==0,d=row.querySelector("[data-cg-dot]"),c=row.querySelector("[data-cg-card]");
if(d){d.style.transform="translate(-50%, -50%) scale("+(a?1:.3)+")";d.style.background=a?"#FFB71B":"rgba(255,255,255,0.1)";d.style.boxShadow=a?"0 0 30px rgba(255,183,27,0.6)":"none"}
if(c){c.style.opacity=a?1:.25;c.style.transform="translateX("+(a?0:o?-30:30)+"px) translateY("+(a?0:20)+"px)";c.style.borderColor=a?"rgba(255,183,27,0.2)":"rgba(255,255,255,0.05)"}})}
addEventListener("scroll",up,{passive:true});addEventListener("resize",up);up()}
function car(){document.querySelectorAll("[data-cg-car]").forEach(function(box){var sl=[].slice.call(box.children).filter(function(e){return e.hasAttribute("data-cg-slide")}),n=sl.length;if(n<2)return;
var mob=box.getAttribute("data-cg-car")==="m",sc=mob?.88:.85,op=mob?0:.25,dots=[],cur=0,t;
var nx=box.parentElement&&box.nextElementSibling;if(nx&&nx.querySelector("button")&&!nx.querySelector("a,svg"))dots=[].slice.call(nx.querySelectorAll("button"));
dots.forEach(function(b,i){if(i>=n)b.style.display="none";else b.addEventListener("click",function(){go(i);rs()})});
function go(k){cur=(k+n)%n;sl.forEach(function(e,i){var d=(i-cur+n)%n,a=d===0;e.style.transform=a?"translateX(0) scale(1)":"translateX("+(d===n-1?-110:110)+"%) scale("+sc+")";e.style.opacity=a?1:op;e.style.pointerEvents=a?"auto":"none"});
dots.forEach(function(b,i){if(i>=n)return;var a=i===cur,w=mob?7:8;b.style.width=(a?w*3:w)+"px";b.style.background=a?"#FFB71B":"rgba(255,255,255,0.15)"})}
function rs(){clearInterval(t);t=setInterval(function(){go(cur+1)},6000)}go(0);rs()})}
function ck(){document.querySelectorAll(".cg-popup-in").forEach(function(p){var b=p.querySelector("button");if(!b||!/Tamam/.test(b.textContent))return;
try{if(localStorage.getItem("cg-ck")){p.style.display="none";return}}catch(x){}
b.addEventListener("click",function(){p.style.display="none";try{localStorage.setItem("cg-ck","1")}catch(x){}})})}
function go(){[tl,car,ck].forEach(function(f){try{f()}catch(x){}})}
document.readyState==="loading"?addEventListener("DOMContentLoaded",go):go()})()</script>`;

const unesc = s => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");

export function fix(html, pathname = "/") {
  if (html.includes("data-cg-init")) return html;
  html = html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/g, (_, a, css, b) => a + unesc(css) + b);
  if (pathname !== "/" || !html.includes('id="growth"')) return html;
  // Zaman çizelgesi: ilerleme çizgisi, satırlar, noktalar ve kartlar işaretlenir
  const g = html.indexOf('id="growth"'), end = html.indexOf("</section>", g);
  let sec = html.slice(g, end);
  sec = sec.replace(/<div style="position:absolute;top:0;left:0;right:0;height:0%;/, '<div data-cg-bar style="position:absolute;top:0;left:0;right:0;height:0%;')
    .replace(/<div style="position:relative;margin-bottom:100px;display:flex;/g, '<div data-cg-row style="position:relative;margin-bottom:100px;display:flex;')
    .replace(/<div style="position:absolute;left:50%;top:50%;transform:translate\(-50%, -50%\) scale/g, '<div data-cg-dot style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%) scale')
    .replace(/<div style="(width:44%;padding:32px;[^"]*)"/g, '<div data-cg-card style="$1"');
  html = html.slice(0, g) + sec + html.slice(end);
  // Carousel'ler: kayan slaytlar (position:absolute;inset:0;transform:translateX) ve kapsayıcıları
  html = html.replace(/<div style="position:absolute;inset:0;transform:translateX\([^"]*"/g, m => m.replace("<div ", "<div data-cg-slide "));
  html = html.replace(/<div style="([^"]*)">(?=<div data-cg-slide style="[^"]*scale\(1\);[^"]*transition:all (\.5s|0\.6s))/g, (m, s, d) => `<div data-cg-car="${d === ".5s" ? "m" : "d"}" style="${s}">`);
  return html.replace("</head>", NOSCRIPT + "</head>").replace("</body>", SCRIPT + "</body>");
}
