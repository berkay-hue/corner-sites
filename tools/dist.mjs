// Cloudflare Pages çıktısı: sites/<host> -> dist/<host>
// İç raporlar (_audit, _mirror-report, _orig-*) yayına çıkmaz; robots.txt, sitemap.xml ve _headers yazılır.
// Pages build komutu: node tools/build-blog.mjs build <host> (blogu olan sitelerde) && node tools/dist.mjs <host>
import { cp, readFile, writeFile, access, mkdir, readdir } from "node:fs/promises";
import { join, basename, relative } from "node:path";
import CONFIG from "./blog.config.mjs";

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
  // Bütün formları kendi işini yapan sayfaya (data-sk-noform) istemci eklenmez; satır içi script CSP'ye takılır
  if ((html.match(/<form\b/g) || []).length === (html.match(/<form\b[^>]*data-sk-noform/g) || []).length) continue;
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
// lastmod yalnızca içerik değişikliğinden gelir: yazıda BlogPosting dateModified, blog listesinde en yeni yazı,
// statik sayfada elle tutulan _orig-sitemap değeri. Başka kaynaklı lastmod (araç commit'i, dosya tarihi) silinir.
{
  const ld = h => [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m => { try { const j = JSON.parse(m[1]); return Array.isArray(j) ? j : j["@graph"] || [j]; } catch { return []; } });
  const origLm = new Set([...orig.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => `${m[1].match(/<loc>([^<]+)/)?.[1].trim()} ${m[1].match(/<lastmod>([^<]+)/)?.[1].trim()}`));
  let xml = await readFile(join(OUT, "sitemap.xml"), "utf8");
  const fixed = [];
  for (const b of xml.match(/<url>[\s\S]*?<\/url>/g) || []) {
    const lm = b.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1].trim(), loc = b.match(/<loc>([^<]+)/)[1].trim();
    const p = decodeURI(new URL(loc).pathname).replace(/^\/|\/$/g, "");
    if (!lm || origLm.has(`${loc} ${lm}`) || /^(?:(?:tr|en)\/)?blog$/.test(p)) continue;
    const f = (await has(join(OUT, p + ".html"))) ? join(OUT, p + ".html") : join(OUT, p, "index.html");
    const mod = ld(await readFile(f, "utf8").catch(() => "")).find(n => n["@type"] === "BlogPosting")?.dateModified;
    if (mod === lm) continue;
    xml = xml.replace(b, b.replace(/<lastmod>[^<]*<\/lastmod>/, mod ? `<lastmod>${mod}</lastmod>` : ""));
    fixed.push(`/${p}: ${lm} -> ${mod || "yok"}`);
  }
  if (fixed.length) { console.log("lastmod düzeltildi:", fixed); await writeFile(join(OUT, "sitemap.xml"), xml); }
}
// llms.txt (llmstxt.org): yapay zekâ aramaları için site özeti, sitemap'teki sayfalardan üretilir
const NAMES = { "yalcinberkay.com.tr": "Berkay Yalçın", "wishceo.com": "WishCEO" };
// Dil blog.config'ten; blogu olmayan sitede html lang
const EN = (CONFIG[host]?.lang || index.match(/<html[^>]*\slang="([^"]*)"/i)?.[1] || "").startsWith("en");
const SECTIONS = EN ? { blog: "Blog", industries: "Industries", solutions: "Solutions", tr: "Türkçe" }
  : { blog: "Blog", "bilgi-merkezi": "Bilgi Merkezi", solutions: "Çözümler", sektor: "Sektörler", "aydinlatma-metni": "Yasal", en: "English" };
const PAGES = EN ? "Pages" : "Sayfalar";
const unesc = s => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
const meta = (html, re) => unesc(html.match(re)?.[1] || "");
const homeTitle = meta(index, /<title>([^<]*)/);
const name = NAMES[host] || homeTitle.split(/\s+[|–-]\s+/)[0];
const brands = [...new Set([name, homeTitle.split(/\s+[|–-]\s+/)[0]].filter(Boolean))].map(b => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const BRAND_PRE = new RegExp(`^(${brands})\\s+[|–·-]\\s+`, "iu"), BRAND_SUF = new RegExp(`\\s+[|–·-]\\s+(${brands}).*$`, "iu");
const groups = new Map();
for (const loc of [...(await readFile(join(OUT, "sitemap.xml"), "utf8")).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim())) {
  const p = decodeURI(new URL(loc).pathname).replace(/^\/|\/$/g, "");
  if (!p) continue;
  const f = (await has(join(OUT, p + ".html"))) ? join(OUT, p + ".html") : join(OUT, p, "index.html");
  const html = await readFile(f, "utf8").catch(() => "");
  // Marka ön/son ekleri atılır: "Berkay YALÇIN | X", "X - Corner Group | Satış & Otomasyon", "X | SAAS Corner Blog"
  const title = meta(html, /<title>([^<]*)/).replace(BRAND_PRE, "").replace(BRAND_SUF, "").trim() || p;
  const desc = meta(html, /<meta name="description" content="([^"]*)"/);
  // Blog listesi ve yazılar (dil önekliler dahil) tek Blog bölümünde; dil kök sayfası (/en/, /tr/) kendi dil bölümüne girer
  const seg = /^(?:(?:tr|en)\/)?blog(?:\/|$)/.test(p) ? "blog" : p.includes("/") || /^(tr|en)$/.test(p) ? p.split("/")[0] : "";
  const key = SECTIONS[seg] || (seg ? seg[0].toUpperCase() + seg.slice(1) : PAGES);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(`- [${title.replace(/[[\]]/g, "")}](${loc})${desc ? ": " + desc : ""}`);
}
const order = [...groups.keys()].sort((a, b) => (b === PAGES) - (a === PAGES));
await writeFile(join(OUT, "llms.txt"), `# ${name}\n\n> ${meta(index, /<meta name="description" content="([^"]*)"/)}\n\n- [${EN ? "Home" : "Ana sayfa"}](${origin}/)\n- [Sitemap](${origin}/sitemap.xml)\n` +
  order.map(k => `\n## ${k}\n\n${groups.get(k).join("\n")}\n`).join(""));

await writeFile(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
const DEFAULTS = `/_a/*
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
`;
// Kendi _headers'ı olan site (ör. CSP) onu korur; varsayılanlardan yalnızca sitenin tanımlamadığı yolların blokları sona eklenir
// (aynı yol iki kez yazılırsa Pages aynı başlığı virgülle birleştirir: "nosniff, nosniff")
const own = (await readFile(join(SRC, "_headers"), "utf8").catch(() => "")).trimEnd();
const ownPaths = new Set(own.split("\n").filter(l => /^[^\s#]/.test(l)).map(l => l.trim()));
const blocks = DEFAULTS.split("\n\n").filter(b => !ownPaths.has(b.split("\n").find(l => !l.startsWith("#"))));
await writeFile(join(OUT, "_headers"), [own, ...blocks].filter(Boolean).join("\n\n"));
console.log(`dist: ${host} -> dist/${host} (origin ${origin})`);
