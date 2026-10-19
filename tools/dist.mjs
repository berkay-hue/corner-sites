// Cloudflare Pages çıktısı: sites/<host> -> dist/<host>
// İç raporlar (_audit, _mirror-report, _orig-*) yayına çıkmaz; robots.txt, sitemap.xml ve _headers yazılır.
// Pages build komutu: node tools/build-blog.mjs build <host> (blogu olan sitelerde) && node tools/dist.mjs <host>
import { cp, readFile, writeFile, access, mkdir, readdir } from "node:fs/promises";
import { join, basename, relative } from "node:path";
import { execFileSync } from "node:child_process";
import CONFIG from "./blog.config.mjs";

const host = process.argv[2];
const root = join(import.meta.dirname, "..");
const SRC = join(root, "sites", host), OUT = join(root, "dist", host);
const has = p => access(p).then(() => true, () => false);
const PRIVATE = /^_(audit|mirror-report|orig-).*|\.log$/;

await mkdir(OUT, { recursive: true });
// wishceo sayilar/NNN.json: app.js ISSUES'taki açılış tarihi bugünden (UTC) ileri olan sayı yayına çıkmaz;
// hiç açılmış sayı yoksa en yeni JSON kopyalanır
const ISSUE_DATES = new Map([...(await readFile(join(SRC, "app.js"), "utf8").catch(() => "")).matchAll(/no:\s*"(\d+)",\s*date:\s*"(\d{4}-\d{2}-\d{2})"/g)].map(m => [m[1], m[2]]));
const today = new Date().toISOString().slice(0, 10);
const issueFiles = (await readdir(join(SRC, "sayilar")).catch(() => [])).filter(n => /^\d+\.json$/.test(n)).sort();
let liveIssues = new Set(issueFiles.filter(n => (ISSUE_DATES.get(n.replace(".json", "")) || "9999") <= today));
if (issueFiles.length && !liveIssues.size) liveIssues = new Set(issueFiles.slice(-1));
const isIssue = src => basename(join(src, "..")) === "sayilar" && /^\d+\.json$/.test(basename(src));
await cp(SRC, OUT, { recursive: true, force: true, filter: src => !PRIVATE.test(basename(src)) && (!isIssue(src) || liveIssues.has(basename(src))) });
if (issueFiles.length) console.log(`sayilar: ${liveIssues.size}/${issueFiles.length} yayında (${today})`);

// Formlar corner-forms Worker'ına bağlanır (tools/forms-client.js); salescorner rakip analizi ayrı bir araç
const FORMS = `<script data-sk-forms>${await readFile(join(import.meta.dirname, "forms-client.js"), "utf8")}</script>`;
async function* allHtml(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* allHtml(p); else if (e.name.endsWith(".html")) yield p;
  }
}
// font-display'siz @font-face'e font-display:swap (yalnız <style> içi ve .css; script/data-URI'ye dokunulmaz, idempotent)
const swapFaces = css => css.replace(/@font-face\s*\{([^{}]*)\}/g, (m, body) => /font-display\s*:/.test(body) ? m : m.replace(/\{/, "{font-display:swap;"));
async function* allFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* allFiles(p); else if (/\.(html|css)$/.test(e.name)) yield p;
  }
}
for await (const f of allFiles(OUT)) {
  const src = await readFile(f, "utf8");
  if (!src.includes("@font-face")) continue;
  const out = f.endsWith(".css") ? swapFaces(src) : src.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, o, css, c) => o + swapFaces(css) + c);
  if (out !== src) await writeFile(f, out);
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

// Bilgi merkezi makaleleri birbirine bağlanmaz (Framer kopyası); başlık kelime benzerliğiyle 4 ilgili makale eklenir
{
  const KB = join(OUT, "bilgi-merkezi");
  const files = (await has(KB)) ? (await readdir(KB)).filter(n => n.endsWith(".html")) : [];
  const kb = [];
  for (const n of files) {
    const html = await readFile(join(KB, n), "utf8");
    const title = html.match(/<h1[^>]*>([^<]+)/)?.[1].trim() || html.match(/<title>([^<|]+)/)?.[1].trim();
    if (!title || !html.includes('data-framer-name="Custom Solution"') || html.includes("data-sk-related")) continue;
    const words = new Set(title.toLocaleLowerCase("tr").split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 3));
    kb.push({ n, html, title, words, slug: n.replace(/\.html$/, "") });
  }
  for (const a of kb) {
    const rel = kb.filter(b => b !== a && b.title !== a.title)
      .map(b => ({ b, s: [...a.words].filter(w => b.words.has(w)).length }))
      .sort((x, y) => y.s - x.s || x.b.slug.localeCompare(y.b.slug)).slice(0, 4).map(x => x.b);
    const nav = `<nav data-sk-related style="max-width:880px;margin:48px auto;padding:0 24px;font-family:Inter,sans-serif"><h2 style="font-size:24px;margin:0 0 16px">İlgili makaleler</h2><ul style="margin:0;padding-left:20px;line-height:1.9">` +
      rel.map(b => `<li><a href="/bilgi-merkezi/${encodeURI(b.slug)}">${b.title}</a></li>`).join("") + `</ul></nav>`;
    await writeFile(join(KB, a.n), a.html.replace(/<div class="[^"]*" data-framer-name="Custom Solution"/, m => nav + m));
  }
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
  if (fixed.length) console.log("lastmod düzeltildi:", fixed);
  // lastmod'u kalmayan URL'ye kaynak dosyanın son commit tarihi yazılır (aynı commit'te her build aynı sitemap)
  for (const b of xml.match(/<url>[\s\S]*?<\/url>/g) || []) {
    if (b.includes("<lastmod>")) continue;
    const p = decodeURI(new URL(b.match(/<loc>([^<]+)/)[1].trim()).pathname).replace(/^\/|\/$/g, "");
    const cands = p === "" ? ["index.html"] : [p + ".html", join(p, "index.html")];
    const src = (await Promise.all(cands.map(async c => (await has(join(SRC, c))) && c))).find(Boolean);
    let d = "";
    try { if (src) d = execFileSync("git", ["log", "-1", "--format=%cs", "--", join(SRC, src)], { cwd: root, encoding: "utf8" }).trim(); } catch {}
    if (d) xml = xml.replace(b, b.replace(/<\/loc>/, `</loc><lastmod>${d}</lastmod>`));
  }
  await writeFile(join(OUT, "sitemap.xml"), xml);
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
const groups = new Map(), full = [];
const text = h => unesc(h.replace(/<(script|style|noscript|svg|nav|header|footer)\b[\s\S]*?<\/\1>/gi, " ").replace(/<\/(p|h[1-6]|li|div|section|br|tr)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")).split("\n").map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
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
  full.push(`## ${title}\n\nURL: ${loc}\n\n${text(html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html)}\n`);
  groups.get(key).push(`- [${title.replace(/[[\]]/g, "")}](${loc})${desc ? ": " + desc : ""}`);
}
const order = [...groups.keys()].sort((a, b) => (b === PAGES) - (a === PAGES));
// Key facts: ana sayfa JSON-LD'sindeki kuruluş/kişi düğümünden
const ldNodes = [...index.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m => { try { const j = JSON.parse(m[1]); return Array.isArray(j) ? j : j["@graph"] || [j]; } catch { return []; } });
const org = ldNodes.find(n => /Organization|Person|Corporation/.test([].concat(n["@type"]).join(" "))) || {};
const nm = v => typeof v === "string" ? v : v?.name;
const facts = [[EN ? "Name" : "Ad", nm(org) || name], ["URL", origin + "/"], [EN ? "Language" : "Dil", EN ? "English" : "Türkçe"],
  [EN ? "Founded" : "Kuruluş", org.foundingDate], [EN ? "Founder" : "Kurucu", [].concat(org.founder || []).map(nm).filter(Boolean).join(", ")],
  [EN ? "Location" : "Konum", nm(org.address?.addressLocality) || org.address?.addressLocality], ["E-posta", org.email],
  [EN ? "Profiles" : "Profiller", [].concat(org.sameAs || []).join(", ")], [EN ? "Pages" : "Sayfa sayısı", String(full.length + 1)],
  [EN ? "Full text" : "Tam metin", `${origin}/llms-full.txt`]].filter(([, v]) => v);
const KEY = `## Key facts\n\n${facts.map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\n`;
const desc0 = meta(index, /<meta name="description" content="([^"]*)"/);
await writeFile(join(OUT, "llms-full.txt"), `# ${name}\n\n> ${desc0}\n\n${KEY}## ${EN ? "Home" : "Ana sayfa"}\n\nURL: ${origin}/\n\n${text(index.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || "")}\n\n` + full.join("\n"));
await writeFile(join(OUT, "llms.txt"), `# ${name}\n\n> ${desc0}\n\n${KEY}- [${EN ? "Home" : "Ana sayfa"}](${origin}/)\n- [Sitemap](${origin}/sitemap.xml)\n` +
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

/llms-full.txt
  Content-Type: text/plain; charset=utf-8

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()
  X-Frame-Options: SAMEORIGIN
  Content-Security-Policy: frame-ancestors 'self'

# Test adresi (*.pages.dev) indekslenmez: kopya içerik olmasın. Gerçek alan adını etkilemez.
https://:project.pages.dev/*
  X-Robots-Tag: noindex
`;
// Kendi _headers'ı olan site (ör. CSP) onu korur; varsayılanlardan yalnızca sitenin tanımlamadığı yolların blokları sona eklenir
// (aynı yol iki kez yazılırsa Pages aynı başlığı virgülle birleştirir: "nosniff, nosniff")
let own = (await readFile(join(SRC, "_headers"), "utf8").catch(() => "")).trimEnd();
// Sitenin kendi /* bloğu varsa varsayılan güvenlik başlıklarından eksik olanlar o bloğa eklenir (var olan tekrar yazılmaz)
{
  const sec = DEFAULTS.split("\n\n").find(b => b.startsWith("/*\n")).split("\n").slice(1);
  own = own.replace(/^\/\*\n((?:[ \t]+\S.*\n?)*)/m, (blk, body) => {
    const names = new Set(body.split("\n").map(l => l.trim().split(":")[0].toLowerCase()));
    const add = sec.filter(l => !names.has(l.trim().split(":")[0].toLowerCase()));
    return add.length ? blk.replace(/\n?$/, "\n" + add.join("\n") + (blk.endsWith("\n") ? "\n" : "")) : blk;
  });
}
const ownPaths = new Set(own.split("\n").filter(l => /^[^\s#]/.test(l)).map(l => l.trim()));
const blocks = DEFAULTS.split("\n\n").filter(b => !ownPaths.has(b.split("\n").find(l => !l.startsWith("#"))));
await writeFile(join(OUT, "_headers"), [own, ...blocks].filter(Boolean).join("\n\n"));
console.log(`dist: ${host} -> dist/${host} (origin ${origin})`);
