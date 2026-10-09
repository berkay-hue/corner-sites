// Next.js (Vercel) sitesinin statik kopyası. Sayfalar sunucuda hazır HTML geldiği için tarayıcı gerekmez.
// Kullanım: node tools/mirror-next.mjs https://www.brandcorner.co sites/brandcorner.co
// Sayfalar <yol>.html olarak, /_next ve /public dosyaları aynı yollarıyla kaydedilir (yol değişmez, istemci geçişi bozulmaz).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const [origin, outDir] = process.argv.slice(2);
const pages = new Set(["/"]), queue = ["/"], assets = new Set(), done = new Set(), report = [];
const ASSET = /\.(js|css|woff2?|ttf|otf|png|jpe?g|gif|webp|avif|svg|ico|mp4|webm|json|txt|xml|pdf)$/i;

const save = async (p, body) => { const f = join(outDir, p); await mkdir(dirname(f), { recursive: true }); await writeFile(f, body); };
const refs = s => [...s.matchAll(/(?:href|src|srcSet|srcset|content)="([^"]+)"|url\(\s*["']?([^"')]+)|["'`](\/_next\/[^"'`\s?#]+)/g)]
  .flatMap(m => (m[1] || m[2] || m[3]).split(",").map(x => x.trim().split(/\s+/)[0]))
  .map(u => u.startsWith(origin) ? u.slice(origin.length) || "/" : u)
  .filter(u => u.startsWith("/") && !u.startsWith("//"))
  .map(u => u.replace(/&amp;/g, "&").split("#")[0]);

while (queue.length) {
  const p = queue.shift();
  const r = await fetch(origin + p, { redirect: "manual" });
  const html = await r.text();
  report.push({ path: p, status: r.status });
  if (r.status !== 200) continue;
  await save(p === "/" ? "index.html" : p.replace(/\/$/, "") + ".html", html);
  for (const u of refs(html)) {
    const clean = u.split("?")[0];
    if (u.startsWith("/_next/image")) assets.add(u);  // aşağıda orijinal görsele çevrilir
    else if (ASSET.test(clean) || clean.startsWith("/_next/")) assets.add(clean);
    else if (!pages.has(clean) && !clean.startsWith("/api/")) { pages.add(clean); queue.push(clean); }
  }
}

// Asset'ler; CSS ve JS içindeki başka asset'ler de takip edilir
const aq = [...assets];
while (aq.length) {
  const a = aq.shift();
  if (done.has(a)) continue;
  done.add(a);
  if (a.startsWith("/_next/image")) { const src = new URL(origin + a).searchParams.get("url"); if (src && !done.has(src)) aq.push(src); continue; }
  const r = await fetch(origin + a);
  if (!r.ok) { report.push({ path: a, status: r.status }); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  await save(a, buf);
  if (/\.(css|js)$/.test(a)) for (const u of refs(buf.toString("utf8"))) {
    const c = u.split("?")[0];
    if ((ASSET.test(c) || c.startsWith("/_next/static/")) && !done.has(c)) aq.push(c);
  }
}
await save("_mirror-report.json", JSON.stringify({ origin, pages: [...pages], report }, null, 1));
console.log(`${pages.size} sayfa, ${done.size} dosya; hatalı: ${report.filter(r => r.status !== 200).map(r => `${r.path} ${r.status}`).join(", ") || "yok"}`);
