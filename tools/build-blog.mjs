// Markdown blog yazılarından Framer görünümlü statik sayfalar üretir.
// Kullanım (corner-sites kökünden):
//   node tools/build-blog.mjs import <host>  # bir kez: mirror'daki yazıları content/<host>/blog/*.md'ye taşır,
//                                           # şablonları templates/<host>/ altına kaydeder
//   node tools/build-blog.mjs build <host>   # her deploy: md -> sites/<host>/blog/*.html, blog.html, sitemap.xml
import { readFile, writeFile, readdir, mkdir, copyFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";
import CONFIG from "./blog.config.mjs";
import { fixMojibake, fixPlaceholders, unscaffold, markdown, metaDescription, esc } from "./lib/content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [cmd, host] = process.argv.slice(2);
const cfg = CONFIG[host];
if (!cfg || !["import", "build"].includes(cmd)) { console.error("usage: build-blog.mjs import|build <host>"); process.exit(1); }
const SITE = join(ROOT, "sites", host), CONTENT = join(ROOT, "content", host, "blog"), TPL = join(ROOT, "templates", host);

// --- HTML parça yardımcıları (yeniden serileştirmeden, kaynak metin üzerinde)
function elementEnd(html, start) {
  const tag = html.slice(start + 1).match(/^[a-z0-9]+/i)[0];
  const re = new RegExp(`<${tag}\\b|</${tag}>`, "gi");
  re.lastIndex = start + 1; let depth = 1, m;
  while ((m = re.exec(html))) { depth += m[0][1] === "/" ? -1 : 1; if (!depth) return m.index + m[0].length; }
  throw new Error("kapanmayan etiket");
}
function region(html, name) {
  const i = html.indexOf(`data-framer-name="${name}"`);
  if (i < 0) return null;
  const start = html.lastIndexOf("<", i), end = elementEnd(html, start);
  const openEnd = html.indexOf(">", i) + 1;
  return { start, end, openEnd, innerEnd: html.lastIndexOf("</", end - 1), outer: html.slice(start, end), inner: html.slice(openEnd, html.lastIndexOf("</", end - 1)) };
}
const setInner = (html, r, inner) => html.slice(0, r.openEnd) + inner + html.slice(r.innerEnd);
const setMeta = (html, key, val) => html.replace(new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*(")`), `$1${esc(val)}$2`);

// --- Front matter
function parseMd(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fm = {};
  for (const line of m[1].split("\n")) {
    const k = line.match(/^(\w+):\s*(.*)$/); if (!k) continue;
    try { fm[k[1]] = JSON.parse(k[2]); } catch { fm[k[1]] = k[2]; }
  }
  return { fm, body: m[2] };
}
const toMd = (fm, body) => "---\n" + Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n") + "\n---\n\n" + body.trim() + "\n";

// --- Eski Framer RichText -> markdown
function htmlToMd(inner) {
  const { document } = parseHTML(`<div id="r">${inner}</div>`);
  const inl = el => [...el.childNodes].map(n => {
    if (n.nodeType === 3) return n.textContent;
    const t = n.tagName?.toLowerCase(), s = inl(n);
    if (t === "strong" || t === "b") return s.trim() ? `**${s}**` : s;
    if (t === "em" || t === "i") return s.trim() ? `*${s}*` : s;
    if (t === "a") { const h = n.getAttribute("href") || ""; return /^(https?:|\/)/.test(h) ? `[${s}](${h})` : s; }
    if (t === "br") return " ";
    return s;
  }).join("");
  const blocks = []; // {tag, text}
  for (const el of document.getElementById("r").children) {
    const t = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(t)) blocks.push({ tag: "h2", text: inl(el) });
    else if (t === "ul" || t === "ol") [...el.querySelectorAll("li")].forEach((li, i) => blocks.push({ tag: t === "ul" ? "-" : `${i + 1}.`, text: inl(li) }));
    else if (t === "p") blocks.push({ tag: "p", text: inl(el) });
    else if (el.textContent.trim()) blocks.push({ tag: "p", text: inl(el) });
  }
  // İskeleti yalnızca düz paragraflarda temizle
  const out = [];
  let buf = [];
  const flush = () => { out.push(...unscaffold(buf.map(b => b.text))); buf = []; };
  for (const b of blocks) { if (b.tag === "p") buf.push(b); else { flush(); out.push(b); } }
  flush();
  let md = "", prevList = false;
  for (const b of out) {
    const text = fixMojibake(b.text).replace(/\s+/g, " ").trim(); if (!text) continue;
    const list = b.tag === "-" || /\d\./.test(b.tag);
    md += (list && prevList ? "\n" : "\n\n") + (b.tag === "h2" || b.tag === "h3" ? `${b.tag === "h2" ? "##" : "###"} ${text.replace(/[:.]$/, "")}` : list ? `${b.tag} ${text}` : text);
    prevList = list;
  }
  return md.trim();
}

// build çıktısı tekrar import edilirse şablon/içerik kendi üstüne katlanır (kart çiftlenmesi)
const isBuilt = html => /data-sk-list|class="[^"]*\bsk-post\b/.test(html);

async function importSite() {
  await mkdir(CONTENT, { recursive: true }); await mkdir(TPL, { recursive: true });
  const files = (await readdir(join(SITE, "blog"))).filter(f => f.endsWith(".html"));
  let n = 0, built = 0, tplSaved = false; const bad = [];
  for (const f of files) {
    const html = await readFile(join(SITE, "blog", f), "utf8");
    if (!html.includes("data-framer-root")) { bad.push(f); continue; }
    if (isBuilt(html)) { built++; continue; } // bizim build çıktımız: içerik md'de zaten
    const { document } = parseHTML(region(html, "Title").outer + region(html, "Banner").outer + (region(html, "Category")?.outer || ""));
    const title = fixPlaceholders(fixMojibake(document.querySelector("h1").textContent.trim())).replace(/\s+/g, " ");
    const date = (region(html, "PublishedAt").inner.match(/datetime="([^"]+)"/) || [])[1]?.slice(0, 10);
    const image = document.querySelector('[data-framer-name="Banner"] img')?.getAttribute("src") || "";
    const category = fixMojibake(document.querySelector('[data-framer-name="Category"]')?.textContent.trim() || "");
    const body = htmlToMd(region(html, "Content").inner);
    const firstP = body.split("\n\n").find(b => !/^(#|-|\d+\.)/.test(b)) || title;
    const fm = { title, description: metaDescription(firstP.replace(/\*+|\[|\]\([^)]*\)/g, "")), date, category, image, imageAlt: title };
    await writeFile(join(CONTENT, f.replace(/\.html$/, ".md")), toMd(fm, body));
    if (!tplSaved && region(html, "Next")) { await writeFile(join(TPL, "post.html"), html); tplSaved = true; }
    n++;
  }
  const list = await readFile(join(SITE, "blog.html"), "utf8");
  if (isBuilt(list)) console.warn("blog.html build çıktısı, liste şablonu korunuyor");
  else if (list.includes(cfg.cardSelector)) await writeFile(join(TPL, "blog.html"), list);
  else console.warn("UYARI: blog.html'de kart yok (boş SSR?), liste şablonu kaydedilmedi");
  console.log(`import: ${n} yazı, build çıktısı: ${built}, atlanan (boş SSR): ${bad.length}`, bad.slice(0, 5));
}

// --- Build
const fmtDate = d => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace("Sept", "Sep");
const POST_CSS = `<style data-sk-post>.sk-post h2{font-size:clamp(22px,2.4vw,28px);line-height:1.25;font-weight:600;margin:1.6em 0 .5em}.sk-post h3{font-size:20px;font-weight:600;margin:1.3em 0 .4em}.sk-post ul,.sk-post ol{padding-left:1.3em;margin:.4em 0 1.1em}.sk-post li{margin:.35em 0}.sk-post blockquote{border-left:3px solid currentColor;margin:1.2em 0;padding:.2em 0 .2em 1em;opacity:.85}.sk-post a{text-decoration:underline}</style>`;

function renderPost(tpl, post, next) {
  const { fm, slug } = post;
  const url = `${cfg.origin}/blog/${slug}`;
  const img = fm.image.startsWith("http") ? fm.image : cfg.origin + fm.image;
  // <title> 60 karakteri aşmasın: tam başlık, ya da iki noktadan önceki kısım, ya da kelime sınırında kısaltma
  const head = fm.title.split(/[:?!]/)[0].trim();
  const pageTitle = [fm.title + cfg.titleSuffix, fm.title, head + cfg.titleSuffix, head].find(t => t.length <= 60) || metaDescription(fm.title, 60).replace(/…$/, "");
  let h = tpl;
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(pageTitle)}</title>`);
  for (const k of ["og:title", "twitter:title"]) h = setMeta(h, k, fm.title);
  for (const k of ["description", "og:description", "twitter:description"]) h = setMeta(h, k, fm.description);
  for (const k of ["og:image", "twitter:image"]) h = setMeta(h, k, img);
  h = setMeta(h, "og:url", url).replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`);
  h = setMeta(h, "og:type", "article");
  h = h.replace(/<meta name="framer-search-index[^>]*>\s*/g, "");

  let r = region(h, "Title"); h = setInner(h, r, r.inner.replace(/(<h1[^>]*>)[\s\S]*?(<\/h1>)/, `$1${esc(fm.title)}$2`));
  r = region(h, "PublishedAt"); h = setInner(h, r, r.inner.replace(/<time[^>]*>[^<]*<\/time>/, `<time datetime="${fm.date}T00:00:00.000Z">${fmtDate(fm.date)}</time>`));
  r = region(h, "Banner"); h = setInner(h, r, r.inner.replace(/<img\b[^>]*>/, tag => tag
    .replace(/\s(srcset|sizes)="[^"]*"/g, "").replace(/\ssrc="[^"]*"/, ` src="${esc(fm.image)}"`)
    .replace(/\salt(="[^"]*")?(?=[\s>])/, ` alt="${esc(fm.imageAlt || fm.title)}"`)));
  r = region(h, "Category"); if (r) h = setInner(h, r, r.inner.replace(/(<p[^>]*>)[^<]*(<\/p>)/, `$1${esc(fm.category || "")}$2`));
  const body = markdown(post.body)
    .replace(/<(p|li|h2|h3|h4)>/g, (_, t) => `<${t} dir="auto" class="${cfg.pClass}">`)
    .replace(/<blockquote><p dir="auto" class="[^"]*">/g, `<blockquote><p dir="auto" class="${cfg.pClass}">`);
  r = region(h, "Content"); h = setInner(h, r, body);
  h = h.replace(`data-framer-name="Content"`, `data-framer-name="Content" data-sk-content`).replace(/(<div class=")([^"]*)("[^>]*data-sk-content)/, "$1$2 sk-post$3");
  r = region(h, "Next");
  if (r) h = next
    ? setInner(h, r, r.inner.replace(/(<a\b[^>]*href=")[^"]*("[^>]*>)[\s\S]*?(<\/a>)/, `$1./${next.slug}$2${esc(next.fm.title)} ›$3`))
    : h.slice(0, r.start) + h.slice(r.end);
  const ld = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: fm.title.slice(0, 110), description: fm.description,
    image: [img], datePublished: fm.date, dateModified: fm.updated || fm.date, mainEntityOfPage: url, inLanguage: cfg.lang,
    author: { "@type": "Organization", name: cfg.author, url: cfg.origin },
    publisher: { "@type": "Organization", name: cfg.brand, url: cfg.origin },
  };
  h = h.replace(/<style data-sk-post>[\s\S]*?<\/style>/, "").replace(/<script type="application\/ld\+json" data-sk-post>[\s\S]*?<\/script>/, "");
  return h.replace("</head>", `${POST_CSS}<script type="application/ld+json" data-sk-post>${JSON.stringify(ld).replace(/</g, "\\u003c")}</script></head>`);
}

function renderList(tpl, posts) {
  const first = tpl.indexOf(`<div class="${cfg.cardSelector}"`);
  const wrapStart = tpl.lastIndexOf('<div class="ssr-variant">', first);
  const cardTpl = tpl.slice(wrapStart, elementEnd(tpl, wrapStart));
  // Tüm mevcut kart sarmalayıcılarını kaldır (+ çevresindeki <!--$--> yorumları)
  let h = tpl, idx, slots = [];
  const slotRe = new RegExp(`<div class="ssr-variant[^"]*"(?: hidden)?><div class="${cfg.cardSelector}"`);
  while ((idx = h.search(slotRe)) >= 0) {
    let s = idx, e = elementEnd(h, idx);
    if (h.slice(s - 8, s) === "<!--$-->" && h.slice(e, e + 9) === "<!--/$-->") { s -= 8; e += 9; }
    slots.push(s); h = h.slice(0, s) + "\u0000" + h.slice(e);
  }
  const cards = posts.map((p, i) => {
    let c = cardTpl.replace(/(data-framer-name="Blog Card" href=")[^"]*/, `$1./blog/${p.slug}`)
      .replace(/<img\b[^>]*>/, tag => tag.replace(/\s(srcset|sizes)="[^"]*"/g, "").replace(/\ssrc="[^"]*"/, ` src="${esc(p.fm.image)}" loading="lazy"`).replace(/\salt(="[^"]*")?(?=[\s>])/, ` alt="${esc(p.fm.imageAlt || p.fm.title)}"`));
    let r = region(c, "Tag"); if (r) c = setInner(c, r, r.inner.replace(/(<p[^>]*>)[^<]*(<\/p>)/, `$1${esc(p.fm.category || "Blog")}$2`));
    c = c.replace(/(<h5[^>]*>)[\s\S]*?(<\/h5>)/, `$1${esc(p.fm.title)}$2`);
    r = region(c, "date &amp; author"); if (r) c = setInner(c, r, r.inner.replace(/(<p[^>]*>)[^<]*(<\/p>)/, `$1${fmtDate(p.fm.date)}$2`));
    if (i >= cfg.perPage) c = c.replace('<div class="ssr-variant">', '<div class="ssr-variant sk-more" hidden>');
    return `<!--$-->${c}<!--/$-->`;
  }).join("");
  h = h.replace("\u0000", () => cards).replace(/\u0000/g, "");
  const js = `<script>addEventListener("DOMContentLoaded",()=>{const b=[...document.querySelectorAll("button")].find(x=>/Load More/i.test(x.textContent));if(!b)return;const up=()=>{if(!document.querySelector(".sk-more[hidden]"))b.style.display="none"};up();b.addEventListener("click",()=>{[...document.querySelectorAll(".sk-more[hidden]")].slice(0,${cfg.perPage}).forEach(e=>e.hidden=false);up()})})</script>`;
  // .ssr-variant{display:contents} hidden niteliğini ezer
  const css = `<style data-sk-list>.sk-more[hidden]{display:none!important}</style>`;
  return h.replace(/<script data-sk-list>[\s\S]*?<\/script>/, "").replace(/<style data-sk-list>[\s\S]*?<\/style>/, "")
    .replace("</head>", css + "</head>").replace("</body>", js.replace("<script>", "<script data-sk-list>") + "</body>");
}

async function buildSite() {
  const tplPost = await readFile(join(TPL, "post.html"), "utf8");
  const tplList = await readFile(join(TPL, "blog.html"), "utf8").catch(() => null);
  const posts = [];
  for (const f of (await readdir(CONTENT)).filter(f => f.endsWith(".md"))) {
    const { fm, body } = parseMd(await readFile(join(CONTENT, f), "utf8"));
    if (fm.draft) continue;
    posts.push({ slug: f.replace(/\.md$/, ""), fm, body });
  }
  posts.sort((a, b) => b.fm.date.localeCompare(a.fm.date) || a.slug.localeCompare(b.slug));
  await mkdir(join(SITE, "blog"), { recursive: true });
  for (const [i, p] of posts.entries()) await writeFile(join(SITE, "blog", p.slug + ".html"), renderPost(tplPost, p, posts[i + 1] || posts[0]));
  if (tplList) await writeFile(join(SITE, "blog.html"), renderList(tplList, posts));
  // Worker'ın konu seçimi için özet
  await writeFile(join(SITE, "_blog-index.json"), JSON.stringify(posts.map(p => ({ slug: p.slug, title: p.fm.title, category: p.fm.category, date: p.fm.date, image: p.fm.image }))));
  // Sitemap: blog dışı sayfalar orijinalden, yazılar içerikten
  const orig = await readFile(join(SITE, "_orig-sitemap.xml"), "utf8").catch(() => "");
  const keep = [...orig.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()).filter(u => !/\/blog\/./.test(new URL(u).pathname));
  const urls = [...keep.map(u => `<url><loc>${u}</loc></url>`), ...posts.map(p => `<url><loc>${cfg.origin}/blog/${p.slug}</loc><lastmod>${p.fm.updated || p.fm.date}</lastmod></url>`)];
  await writeFile(join(SITE, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  console.log(`build: ${posts.length} yazı${tplList ? " + liste" : ""}, sitemap ${urls.length} url`);
}

await (cmd === "import" ? importSite() : buildSite());
