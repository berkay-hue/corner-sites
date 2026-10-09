// SEO denetimi + canlı/yerel karşılaştırma.
// Kullanım: node audit.mjs <origin> <siteDir>
//   Canlı sitemap'teki her URL'yi hem canlıdan hem yerel dosyadan okur, SEO alanlarını
//   karşılaştırır; <siteDir>/_audit.json ve özet yazar.
import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { parseHTML } from "linkedom";

const [origin, dir] = process.argv.slice(2);
if (!origin || !dir) { console.error("usage: audit.mjs <origin> <siteDir>"); process.exit(1); }
const ORIGIN = origin.replace(/\/$/, "");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

export function seoFields(html) {
  const { document } = parseHTML(html);
  const meta = n => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.getAttribute("content") || "";
  const uniq = sel => [...new Set([...document.querySelectorAll(sel)].map(e => e.textContent.trim().replace(/\s+/g, " ")))].filter(Boolean);
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(s => {
    try { const j = JSON.parse(s.textContent); return [].concat(j["@graph"] || j).map(x => x["@type"]); } catch { return ["INVALID"]; }
  });
  document.querySelectorAll("script,style,noscript,template").forEach(e => e.remove());
  return {
    title: document.querySelector("title")?.textContent.trim() || "",
    description: meta("description"),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
    robots: meta("robots"),
    ogTitle: meta("og:title"), ogImage: meta("og:image").split("/").pop().replace(/_[0-9a-f]{8}(?=\.)|\?.*$/, ""),
    h1: uniq("h1"), h2: uniq("h2").length,
    ld,
    words: (document.body?.textContent || "").split(/\s+/).filter(Boolean).length,
  };
}

function outFile(path) {
  if (path === "/" || path === "") return "index.html";
  return decodeURIComponent(path).replace(/^\//, "").replace(/\/$/, "") + ".html";
}

async function pool(items, n, fn) {
  const q = [...items]; const out = [];
  await Promise.all(Array.from({ length: n }, async () => { while (q.length) { const it = q.shift(); out.push(await fn(it)); } }));
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sm = await readFile(join(dir, "_orig-sitemap.xml"), "utf8");
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  const rows = await pool(urls, 8, async url => {
    const r = await fetch(url, { headers: { "user-agent": UA } });
    const live = seoFields(await r.text());
    const fp = join(dir, outFile(new URL(url).pathname));
    let local = null;
    try { await access(fp); local = seoFields(await readFile(fp, "utf8")); } catch {}
    const diff = local ? Object.keys(live).filter(k => k !== "words" && JSON.stringify(live[k]) !== JSON.stringify(local[k])) : ["MISSING"];
    if (local && Math.abs(live.words - local.words) > Math.max(20, live.words * 0.05)) diff.push(`words ${live.words}->${local.words}`);
    return { url, status: r.status, live, local, diff };
  });

  // Site geneli bulgular (canlı)
  const L = rows.map(r => r.live);
  const dup = k => { const m = {}; L.forEach((x, i) => (m[x[k]] ||= []).push(rows[i].url)); return Object.values(m).filter(v => v.length > 1); };
  const summary = {
    pages: rows.length,
    nonOk: rows.filter(r => r.status !== 200).map(r => [r.url, r.status]),
    missingLocal: rows.filter(r => !r.local).map(r => r.url),
    diffs: rows.filter(r => r.local && r.diff.length).map(r => [r.url, r.diff]),
    noH1: L.filter(x => !x.h1.length).length,
    multiH1: L.filter(x => x.h1.length > 1).length,
    titleOver60: L.filter(x => x.title.length > 60).length,
    descMissing: L.filter(x => !x.description).length,
    descOver160: L.filter(x => x.description.length > 160).length,
    dupTitles: dup("title").length, dupDescriptions: dup("description").map(v => v.length),
    canonicalMismatch: rows.filter(r => r.live.canonical && r.live.canonical.replace(/\/$/, "") !== r.url.replace(/\/$/, "")).map(r => [r.url, r.live.canonical]),
    noLd: L.filter(x => !x.ld.length).length,
    noindex: rows.filter(r => /noindex/.test(r.live.robots)).map(r => r.url),
  };
  await writeFile(join(dir, "_audit.json"), JSON.stringify({ summary, rows }, null, 2));
  console.log(JSON.stringify({ ...summary, diffs: summary.diffs.slice(0, 10), diffCount: summary.diffs.length }, null, 1));
}
