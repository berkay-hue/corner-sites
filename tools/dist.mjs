// Cloudflare Pages çıktısı: sites/<host> -> dist/<host>
// İç raporlar (_audit, _mirror-report, _orig-*) yayına çıkmaz; robots.txt, sitemap.xml ve _headers yazılır.
// Pages build komutu: node tools/build-blog.mjs build <host> (blogu olan sitelerde) && node tools/dist.mjs <host>
import { cp, readFile, writeFile, access, mkdir, readdir } from "node:fs/promises";
import { join, basename, relative } from "node:path";

const host = process.argv[2];
const root = join(import.meta.dirname, "..");
const SRC = join(root, "sites", host), OUT = join(root, "dist", host);
const has = p => access(p).then(() => true, () => false);
const PRIVATE = /^_(audit|mirror-report|orig-).*|\.log$/;

await mkdir(OUT, { recursive: true });
await cp(SRC, OUT, { recursive: true, force: true, filter: src => !PRIVATE.test(basename(src)) });

// Formlar corner-forms Worker'ına bağlanır (tools/forms-client.js); salescorner rakip analizi ayrı bir araç
const FORMS = `<script data-sk-forms>${await readFile(join(import.meta.dirname, "forms-client.js"), "utf8")}</script>`;
async function* allHtml(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* allHtml(p); else if (e.name.endsWith(".html")) yield p;
  }
}
for await (const f of allHtml(OUT)) {
  let html = await readFile(f, "utf8");
  // Framer runtime'ı taşınan uygulama sayfaları (tools/framer-app.mjs) formlarını kendisi yönetir
  if (!html.includes("<form") || html.includes("data-sk-forms") || html.includes("/_fru/sites/")) continue;
  html = html.replace(/<form>(?=[\s\S]{0,3000}rakip1\.com)/g, "<form data-sk-noform>");
  await writeFile(f, html.replace(/<\/body>/i, FORMS + "</body>"));
}

// Canonical origin (www'lu ya da çıplak) sitemap'ten alınır
const orig = await readFile(join(SRC, "_orig-sitemap.xml"), "utf8").catch(() => "");
const index = await readFile(join(SRC, "index.html"), "utf8").catch(() => "");
const origin = orig.match(/<loc>(https?:\/\/[^/<]+)/)?.[1] || index.match(/<link rel="canonical" href="(https?:\/\/[^/"]+)/)?.[1] || `https://${host}`;

async function* pages(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith("_")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* pages(p); else if (e.name.endsWith(".html") && e.name !== "404.html") yield p;
  }
}
if (!(await has(join(OUT, "sitemap.xml")))) {
  // Orijinal sitemap'ten 404, noindex ya da dosyası olmayan URL'ler düşülür
  let xml = "";
  if (orig) {
    const dropped = [];
    const blocks = [];
    for (const b of orig.match(/<url>[\s\S]*?<\/url>/g) || []) {
      const p = decodeURI(new URL(b.match(/<loc>([^<]+)/)[1].trim()).pathname).replace(/^\/|\/$/g, "");
      const f = p === "" ? join(OUT, "index.html") : (await has(join(OUT, p + ".html"))) ? join(OUT, p + ".html") : join(OUT, p, "index.html");
      const html = (await has(f)) ? await readFile(f, "utf8") : "";
      // canonical'ı başka sayfayı gösteren kopyalar da sitemap'e girmez
      const canon = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      const ok = p !== "404" && html && !/<meta name="robots" content="[^"]*noindex/.test(html) && (!canon || decodeURI(new URL(canon).pathname).replace(/^\/|\/$/g, "") === p);
      if (ok) blocks.push(b); else dropped.push("/" + p);
    }
    if (dropped.length) console.log("sitemap'ten düşen:", dropped);
    xml = orig.replace(/<url>[\s\S]*<\/url>/, blocks.join("\n"));
  }
  if (!xml) {
    const urls = [];
    for await (const f of pages(OUT)) {
      if (/<meta name="robots" content="[^"]*noindex/.test(await readFile(f, "utf8"))) continue;
      urls.push(origin + "/" + relative(OUT, f).replace(/\.html$/, "").replace(/(^|\/)index$/, ""));
    }
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.sort().map(u => `<url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`;
  }
  await writeFile(join(OUT, "sitemap.xml"), xml);
}
// llms.txt (llmstxt.org): yapay zekâ aramaları için site özeti, sitemap'teki sayfalardan üretilir
const NAMES = { "yalcinberkay.com.tr": "Berkay Yalçın" };
const EN = /<html[^>]*\slang="en/i.test(index);
const SECTIONS = EN ? { blog: "Blog", industries: "Industries", solutions: "Solutions", tr: "Türkçe" }
  : { blog: "Blog", "bilgi-merkezi": "Bilgi Merkezi", solutions: "Çözümler", sektor: "Sektörler", "aydinlatma-metni": "Yasal" };
const PAGES = EN ? "Pages" : "Sayfalar";
const unesc = s => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
const meta = (html, re) => unesc(html.match(re)?.[1] || "");
const homeTitle = meta(index, /<title>([^<]*)/);
const name = NAMES[host] || homeTitle.split(/\s+[|–-]\s+/)[0];
const brands = [...new Set([name, homeTitle.split(/\s+[|–-]\s+/)[0]].filter(Boolean))].map(b => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const BRAND_PRE = new RegExp(`^(${brands})\\s+[|–-]\\s+`, "iu"), BRAND_SUF = new RegExp(`\\s+[|–-]\\s+(${brands}).*$`, "iu");
const groups = new Map();
for (const loc of [...(await readFile(join(OUT, "sitemap.xml"), "utf8")).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim())) {
  const p = decodeURI(new URL(loc).pathname).replace(/^\/|\/$/g, "");
  if (!p) continue;
  const f = (await has(join(OUT, p + ".html"))) ? join(OUT, p + ".html") : join(OUT, p, "index.html");
  const html = await readFile(f, "utf8").catch(() => "");
  // Marka ön/son ekleri atılır: "Berkay YALÇIN | X", "X - Corner Group | Satış & Otomasyon", "X | SAAS Corner Blog"
  const title = meta(html, /<title>([^<]*)/).replace(BRAND_PRE, "").replace(BRAND_SUF, "").trim() || p;
  const desc = meta(html, /<meta name="description" content="([^"]*)"/);
  const seg = p.includes("/") ? p.split("/")[0] : "";
  const key = SECTIONS[seg] || (seg ? seg[0].toUpperCase() + seg.slice(1) : PAGES);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(`- [${title.replace(/[[\]]/g, "")}](${loc})${desc ? ": " + desc : ""}`);
}
const order = [...groups.keys()].sort((a, b) => (b === PAGES) - (a === PAGES));
await writeFile(join(OUT, "llms.txt"), `# ${name}\n\n> ${meta(index, /<meta name="description" content="([^"]*)"/)}\n\n- [${EN ? "Home" : "Ana sayfa"}](${origin}/)\n- [Sitemap](${origin}/sitemap.xml)\n` +
  order.map(k => `\n## ${k}\n\n${groups.get(k).join("\n")}\n`).join(""));

await writeFile(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(join(OUT, "_headers"), `/_a/*
  Cache-Control: public, max-age=31536000, immutable

/_fru/*
  Cache-Control: public, max-age=86400

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/llms.txt
  Content-Type: text/plain; charset=utf-8

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

# Test adresi (*.pages.dev) indekslenmez: kopya içerik olmasın. Gerçek alan adını etkilemez.
https://:project.pages.dev/*
  X-Robots-Tag: noindex
`);
console.log(`dist: ${host} -> dist/${host} (origin ${origin})`);
