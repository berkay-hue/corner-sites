// Framer sitesini Framer runtime'ı olmadan statik kopyalar.
// Kullanım: node mirror.mjs <origin> <outDir> [yol...]
//   yol verilirse yalnızca o sayfalar yenilenir ("/404" özel 404'ü yeniler), rapor birleştirilir
//   örn. node mirror.mjs https://www.yalcinberkay.com.tr ../sites/yalcinberkay.com.tr
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { openBrowser, closeBrowser, hydrateFill } from "./hydrate.mjs";

const [origin, outDir, ...only] = process.argv.slice(2);
if (!origin || !outDir) { console.error("usage: mirror.mjs <origin> <outDir>"); process.exit(1); }
const ORIGIN = origin.replace(/\/$/, "");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const ASSET_RE = /https:\/\/(framerusercontent\.com|app\.framerstatic\.com|fonts\.gstatic\.com)\/[^"'\s)<>,\\]+/g;

async function get(url, tries = 3) {
  for (let i = 0; ; i++) {
    try {
      // Gövde okuması da bu sinyale bağlı: takılan bağlantı süreci kilitlemez
      const r = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow", signal: AbortSignal.timeout(60000) });
      return r;
    } catch (e) { if (i >= tries) throw e; await new Promise(r => setTimeout(r, 1000 * (i + 1))); }
  }
}

async function pool(items, n, fn) {
  const q = [...items]; const out = [];
  await Promise.all(Array.from({ length: n }, async () => { while (q.length) { const it = q.shift(); out.push(await fn(it)); } }));
  return out;
}

const decode = s => s.replace(/&amp;/g, "&");
function localAssetPath(rawUrl) {
  const u = new URL(decode(rawUrl));
  const host = { "framerusercontent.com": "fr", "app.framerstatic.com": "fs", "fonts.gstatic.com": "gf" }[u.hostname];
  let p = u.pathname;
  if (u.search) {
    const h = createHash("sha1").update(u.search).digest("hex").slice(0, 8);
    const m = p.match(/(\.[a-z0-9]+)$/i);
    p = m ? p.slice(0, -m[1].length) + "_" + h + m[1] : p + "_" + h;
  }
  return `/_a/${host}${p}`;
}

const assets = new Map(); // remote -> local
function rewriteAssets(html, absForMeta) {
  // og/twitter image meta'ları mutlak URL ister
  html = html.replace(/(<meta[^>]+content=")(https:\/\/framerusercontent\.com\/[^"]+)(")/g, (_, a, u, b) => {
    const l = localAssetPath(u); assets.set(decode(u), l); return a + absForMeta + l + b;
  });
  return html.replace(ASSET_RE, u => { const l = localAssetPath(u); assets.set(decode(u), l); return l; });
}

const REVEAL = `<style>.sk-js [data-sk-reveal]:not(.sk-in){opacity:0;transform:var(--sk-from)}[data-sk-reveal]{transition:opacity .6s ease,transform .6s ease}</style>` +
  `<script>document.documentElement.classList.add("sk-js");addEventListener("DOMContentLoaded",()=>{const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("sk-in");o.unobserve(e.target)}}),{rootMargin:"0px 0px -10% 0px"});document.querySelectorAll("[data-sk-reveal]").forEach(el=>o.observe(el))})</script>`;

function stripFramer(html) {
  const kept = [];
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (full, attrs, body) => {
    if (/application\/ld\+json/.test(attrs)) return full;
    const src = (attrs.match(/src="([^"]+)"/) || [])[1];
    if (src) {
      if (/framer(usercontent)?\.com|framerstatic/.test(src)) return "";
      kept.push(src); return full;
    }
    if (/type="framer\//.test(attrs) || /framer|animator|hydrated|Date\.prototype/.test(body)) return "";
    kept.push(body.slice(0, 80)); return full;
  });
  html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, "");
  html = html.replace(/<link\b[^>]*rel="(preconnect|dns-prefetch)"[^>]*>/g, "");
  html = html.replace(/<meta name="(generator|framer-search-index)"[^>]*>/g, "");
  html = html.replace(/<div id="__framer-badge-container">[\s\S]*?<\/div>/g, "");
  // Appear animasyonlarının başlangıç stilleri: JS olmadan görünmez kalır
  html = html.replace(/<[a-z][^>]*data-framer-appear-id[^>]*>/g, tag =>
    tag.replace(/style="([^"]*)"/, (_, s) => {
      s = s.replace(/(^|;)\s*opacity:\s*0(\.\d+)?\s*(?=;|$)/g, "$1")
           .replace(/(^|;)\s*transform:[^;]*(?=;|$)/g, "$1")
           .replace(/(^|;)\s*will-change:[^;]*(?=;|$)/g, "$1")
           .replace(/;;+/g, ";").replace(/^;|;$/g, "");
      return `style="${s}"`;
    }));
  // Kelime kelime beliren metin efekti (her kelime opacity:0.001+blur span'i): JS olmadan görünür bırak
  html = html.replace(/<span style="display:inline-block;opacity:0\.001;[^"]*">/g, '<span style="display:inline-block">');
  // Scroll (whileInView) animasyonları: görünür bırak, küçük IO script'i ile fade-in
  let reveals = 0;
  html = html.replace(/style="will-change:transform;opacity:0;transform:([^"]*)"/g, (_, t) => {
    reveals++; return `data-sk-reveal style="--sk-from:${t}"`;
  });
  if (reveals) html = html.replace("</head>", REVEAL + "</head>");
  return { html, kept };
}

function outFile(path) {
  if (path === "/" || path === "") return "index.html";
  return decodeURIComponent(path).replace(/^\//, "").replace(/\/$/, "") + ".html";
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

const host = new URL(ORIGIN).hostname;
const fixer = await import(`./fixups/${host}.mjs`).then(m => m.fix, () => (h) => h);

const report = { origin: ORIGIN, pages: [], keptScripts: new Set() };

const smRes = await get(ORIGIN + "/sitemap.xml");
const sm = smRes.ok ? await smRes.text() : "";
let urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
if (!urls.length) urls = [ORIGIN + "/"];
if (only.length) urls = urls.filter(u => only.includes(new URL(u).pathname));
console.log(`${urls.length} url`);

await mkdir(outDir, { recursive: true });
if (sm) await writeFile(join(outDir, "_orig-sitemap.xml"), sm);
const rb = await get(ORIGIN + "/robots.txt");
if (rb.ok) await writeFile(join(outDir, "_orig-robots.txt"), await rb.text());

async function savePage(url, file, expectStatus) {
  let r, raw;
  for (let t = 0; t < 4; t++) {
    r = await get(url); raw = await r.text();
    // Framer ara sıra SSR'sız boş kabuk döner (<div id="main"></div>): tekrar dene
    if (raw.includes("data-framer-root")) break;
    if (t === 3) throw new Error(`SSR boş: ${url}`);
    await new Promise(res => setTimeout(res, 3000 * (t + 1)));
  }
  let { html: stripped, kept } = stripFramer(raw);
  if (expectStatus === 404) {
    // 404 her yolda sunulur: göreli linkleri köke sabitle, Framer'ın link düzeltici script'ini at
    stripped = stripped.replace(/<script>\(\(\)=>\{function P\(e,t\)[\s\S]*?<\/script>/, "")
      .replace(/href="\.\/([^"]*)"/g, 'href="/$1"');
    kept = kept.filter(k => !k.startsWith("(()=>{function P(e,t)"));
  }
  kept.forEach(k => report.keptScripts.add(k));
  const hy = await hydrateFill(url, raw, stripped);
  const html = rewriteAssets(fixer(hy.html, new URL(url).pathname), ORIGIN);
  const fp = join(outDir, file);
  await mkdir(dirname(fp), { recursive: true });
  await writeFile(fp, html);
  report.pages.push({ url, file, status: r.status, finalUrl: r.url, expectStatus, hydrate: hy.stats });
  process.stdout.write(".");
}

await openBrowser();
// Tek sayfanın hatası tüm koşuyu düşürmesin; rapora yazılır
await pool(urls, 4, u => savePage(u, outFile(new URL(u).pathname), 200).catch(e => {
  report.pages.push({ url: u, error: e.message }); console.error(`\nHATA ${u}: ${e.message}`);
}));
if (!only.length || only.includes("/404")) await savePage(ORIGIN + "/__bu-sayfa-yok-404", "404.html", 404).catch(async e => {
  // Sitede özel 404 yok (Framer'ın genel "Page Not Found | Framer" sayfası): sade, markalı bir 404 yaz
  console.error(`\n404 yedeği: ${e.message}`);
  const home = await (await get(ORIGIN + "/")).text();
  const name = (home.match(/<meta property="og:site_name" content="([^"]+)"/) || home.match(/<title>([^<|–-]+)/) || [, host])[1].trim();
  const icon = rewriteAssets((home.match(/<link[^>]*rel="icon"[^>]*>/g) || []).join(""), ORIGIN);
  await writeFile(join(outDir, "404.html"), `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Sayfa bulunamadı | ${name}</title>${icon}<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.5 system-ui,-apple-system,sans-serif;background:#fff;color:#111;text-align:center}h1{font-size:64px;margin:0}a{color:inherit}</style></head><body><main><h1>404</h1><p>Aradığınız sayfa bulunamadı.</p><p><a href="/">${name} ana sayfasına dön</a></p></main></body></html>\n`);
});
await closeBrowser();
console.log(`\n${assets.size} asset`);

let fail = 0;
await pool([...assets], 8, async ([remote, local]) => {
  const fp = join(outDir, local);
  if (await exists(fp)) return;
  const r = await get(remote).catch(e => ({ ok: false, status: e.name }));
  if (!r.ok) { fail++; console.log("ASSET FAIL", r.status, remote); return; }
  let buf = Buffer.from(await r.arrayBuffer());
  await mkdir(dirname(fp), { recursive: true });
  await writeFile(fp, buf);
});
console.log(`asset fail: ${fail}`);

report.keptScripts = [...report.keptScripts];
if (only.length) {
  // Kısmi koşu: önceki rapordaki diğer sayfaları koru
  const prev = JSON.parse(await readFile(join(outDir, "_mirror-report.json"), "utf8").catch(() => "{}"));
  const mine = new Set(report.pages.map(p => p.file || p.url));
  report.pages = [...(prev.pages || []).filter(p => !mine.has(p.file || p.url)), ...report.pages];
  report.keptScripts = [...new Set([...(prev.keptScripts || []), ...report.keptScripts])];
}
await writeFile(join(outDir, "_mirror-report.json"), JSON.stringify(report, null, 2));
const bad = report.pages.filter(p => p.status !== p.expectStatus || p.finalUrl !== p.url);
console.log("kept scripts:", report.keptScripts);
const hs = report.pages.map(p => p.hydrate).filter(Boolean);
console.log("hydrate: boş", hs.reduce((a, h) => a + h.empty, 0), "dolan", hs.reduce((a, h) => a + h.filled, 0), "uyuşmazlık", hs.flatMap(h => h.mismatch).slice(0, 15), "capture hata", hs.flatMap(h => h.errors || []).slice(0, 15));
console.log("status/redirect sorunları:", bad.length, bad.slice(0, 10));
