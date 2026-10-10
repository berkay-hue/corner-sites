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
// spec: "Ad" (data-framer-name), "Ad#1" (n. eşleşme, 0'dan), ".sınıf" (class="sınıf" ile başlayan div)
function region(html, spec, from = 0) {
  if (!spec) return null;
  let [name, nth] = spec.split("#"); nth = +nth || 0;
  const needle = name.startsWith(".") ? `<div class="${name.slice(1)}"` : `data-framer-name="${name}"`;
  let i = from - 1;
  do { i = html.indexOf(needle, i + 1); } while (i >= 0 && nth-- > 0);
  if (i < 0) return null;
  const start = name.startsWith(".") ? i : html.lastIndexOf("<", i), end = elementEnd(html, start);
  const openEnd = html.indexOf(">", i) + 1;
  return { start, end, openEnd, innerEnd: html.lastIndexOf("</", end - 1), outer: html.slice(start, end), inner: html.slice(openEnd, html.lastIndexOf("</", end - 1)) };
}
const setInner = (html, r, inner) => html.slice(0, r.openEnd) + inner + html.slice(r.innerEnd);
const RG = { title: "Title", date: "PublishedAt", banner: "Banner", category: "Category", content: "Content", next: "Next", ...cfg.regions };
const setP = (inner, text) => inner.replace(/(<p\b[^>]*>)[\s\S]*?(<\/p>)/, (_, a, b) => a + esc(text) + b);
const regionText = (html, spec) => { const r = region(html, spec); return r ? fixMojibake(parseHTML(`<div>${r.inner}</div>`).document.querySelector("div").textContent.trim()).replace(/\s+/g, " ") : ""; };
const TR_MONTHS = ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"];
const EN_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function parseDate(inner) {
  const iso = inner.match(/datetime="(\d{4}-\d\d-\d\d)/); if (iso) return iso[1];
  const text = inner.replace(/<[^>]+>/g, " ").toLocaleLowerCase("tr");
  let m = text.match(/(\d{1,2})\s+(\p{L}+)\s+(\d{4})/u), d, mon, y;
  if (m) [, d, mon, y] = m; else if ((m = text.match(/(\p{L}+)\s+(\d{1,2}),?\s+(\d{4})/u))) [, mon, d, y] = m; // "Feb 8, 2024"
  const mi = mon ? Math.max(TR_MONTHS.indexOf(mon), EN_MONTHS.indexOf(mon.slice(0, 3))) : -1;
  return mi < 0 ? null : `${y}-${String(mi + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
}
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
    const title = fixPlaceholders(regionText(html, RG.title));
    const date = parseDate(region(html, RG.date)?.inner || "");
    if (!title || !date) { bad.push(f); continue; }
    const bannerImg = (region(html, RG.banner)?.inner.match(/<img\b[^>]*>/) || [""])[0];
    const image = fixMojibake(bannerImg.match(/\ssrc="([^"]*)"/)?.[1] || "");
    const imageAlt = fixMojibake(bannerImg.match(/\salt="([^"]+)"/)?.[1] || title);
    const category = regionText(html, RG.category);
    const body = htmlToMd(region(html, RG.content).inner);
    const summary = regionText(html, RG.summary);
    const firstP = (summary && summary !== title ? summary : null) || body.split("\n\n").find(b => !/^(#|-|\d+\.)/.test(b)) || title;
    const fm = { title, description: metaDescription(firstP.replace(/\*+|\[|\]\([^)]*\)/g, "")), date, category, image, imageAlt };
    await writeFile(join(CONTENT, f.replace(/\.html$/, ".md")), toMd(fm, body));
    if (!tplSaved && (!RG.next || region(html, RG.next))) { await writeFile(join(TPL, "post.html"), html); tplSaved = true; }
    n++;
  }
  const list = await readFile(join(SITE, "blog.html"), "utf8");
  if (isBuilt(list)) console.warn("blog.html build çıktısı, liste şablonu korunuyor");
  else if (list.includes(cfg.cardSelector)) await writeFile(join(TPL, "blog.html"), list);
  else console.warn("UYARI: blog.html'de kart yok (boş SSR?), liste şablonu kaydedilmedi");
  console.log(`import: ${n} yazı, build çıktısı: ${built}, atlanan (boş SSR/eksik alan): ${bad.length}`, bad.slice(0, 5));
}

// --- Build
const fmtDate = d => new Date(d + "T00:00:00Z").toLocaleDateString(cfg.dateLocale || "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace("Sept", "Sep");
const POST_CSS = `<style data-sk-post>.sk-post h2{font-size:clamp(22px,2.4vw,28px);line-height:1.25;font-weight:600;margin:1.6em 0 .5em}.sk-post h3{font-size:20px;font-weight:600;margin:1.3em 0 .4em}.sk-post ul,.sk-post ol{padding-left:1.3em;margin:.4em 0 1.1em}.sk-post li{margin:.35em 0}.sk-post blockquote{border-left:3px solid currentColor;margin:1.2em 0;padding:.2em 0 .2em 1em;opacity:.85}.sk-post a{text-decoration:underline}</style>`;

// Bir bölgenin tüm eşleşmelerini sırayla dönüştür (ör. her ssr-variant'taki banner)
function eachRegion(html, name, fn) {
  let from = 0, r;
  while ((r = region(html, name, from))) { const before = html.length; html = fn(html, r); from = r.end + (html.length - before); }
  return html;
}
// Yazar her sitede kişi (E-E-A-T): kişisel sitedeki Person düğümüne @id ile bağlanır
const AUTHOR = { "@type": "Person", "@id": "https://www.yalcinberkay.com.tr/#person", name: "Berkay Yalçın", url: "https://www.yalcinberkay.com.tr",
  sameAs: ["https://www.linkedin.com/in/berkayyalcin2/"] };
const swapImg = (tag, p, lazy) => tag.replace(/\s(srcset|sizes)="[^"]*"/g, "").replace(/\ssrc="[^"]*"/, ` src="${esc(p.fm.image)}"${lazy ? ' loading="lazy"' : ""}`)
  .replace(/\salt(="[^"]*")?(?=[\s>])/, "").replace(/^<img\b/, `<img alt="${esc(p.fm.imageAlt || p.fm.title)}"`);
const readTime = body => `${Math.max(1, Math.round(body.split(/\s+/).length / 220))}${cfg.lang === "en" ? " min read" : " dk okuma"}`;
const L = cfg.lang === "en" ? { related: "Related Posts", home: "Home" } : { related: "İlgili Yazılar", home: "Ana Sayfa" };

// Aynı kategoriden başlayıp tarihe en yakın yazılar
function relatedFor(post, posts, n = 4) {
  const t = Date.parse(post.fm.date), d = p => Math.abs(Date.parse(p.fm.date) - t);
  return posts.filter(p => p !== post).sort((a, b) => ((b.fm.category === post.fm.category) - (a.fm.category === post.fm.category)) || d(a) - d(b)).slice(0, n);
}

function renderPost(tpl, post, next, related) {
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

  let r = region(h, RG.title); h = setInner(h, r, r.inner.replace(/(<h1[^>]*>)[\s\S]*?(<\/h1>)/, `$1${esc(fm.title)}$2`));
  r = region(h, RG.date); h = setInner(h, r, /<time\b/.test(r.inner)
    ? r.inner.replace(/<time[^>]*>[^<]*<\/time>/, `<time datetime="${fm.date}T00:00:00.000Z">${fmtDate(fm.date)}</time>`)
    : setP(r.inner, fmtDate(fm.date)));
  h = eachRegion(h, RG.banner, (h, r) => setInner(h, r, r.inner.replace(/<img\b[^>]*>/, tag => swapImg(tag, post))));
  r = region(h, RG.category); if (r) h = setInner(h, r, r.inner.replace(/(<p[^>]*>)[^<]*(<\/p>)/, `$1${esc(fm.category || "")}$2`));
  r = region(h, RG.summary); if (r) h = setInner(h, r, setP(r.inner, fm.description));
  r = region(h, RG.readTime); if (r) h = setInner(h, r, setP(r.inner, readTime(post.body)));
  const relMd = related.length ? `\n\n## ${L.related}\n\n` + related.map(p => `- [${p.fm.title.replace(/[[\]]/g, "")}](/blog/${p.slug})`).join("\n") : "";
  const body = markdown(post.body + relMd)
    .replace(/<(p|li|h2|h3|h4)>/g, (_, t) => `<${t} dir="auto" class="${cfg.pClass}">`)
    .replace(/<blockquote><p dir="auto" class="[^"]*">/g, `<blockquote><p dir="auto" class="${cfg.pClass}">`);
  r = region(h, RG.content); h = setInner(h, r, body);
  h = RG.content.startsWith(".")
    ? h.replace(`<div class="${RG.content.slice(1)}"`, `<div class="${RG.content.slice(1)} sk-post" data-sk-content`)
    : h.replace(`data-framer-name="${RG.content}"`, `data-framer-name="${RG.content}" data-sk-content`).replace(/(<div class=")([^"]*)("[^>]*data-sk-content)/, "$1$2 sk-post$3");
  r = region(h, RG.next);
  if (r) h = next
    ? setInner(h, r, r.inner.replace(/(<a\b[^>]*href=")[^"]*("[^>]*>)[\s\S]*?(<\/a>)/, `$1./${next.slug}$2${esc(next.fm.title)} ›$3`))
    : h.slice(0, r.start) + h.slice(r.end);
  // Şablondaki "son yazılar" kartları: her farklı eski hedef bir ilgili yazıya eşlenir
  if (cfg.relatedCards) {
    const map = new Map();
    h = h.replace(/<a\b[^>]*\shref="\.\/([^"]+)"[^>]*>/g, (tag, old) => {
      if (!map.has(old)) map.set(old, related[map.size % Math.max(related.length, 1)]);
      return tag;
    });
    let from = 0, m; const re = /<a\b[^>]*\shref="\.\/([^"]+)"[^>]*>/g;
    while ((re.lastIndex = from, m = re.exec(h))) {
      const p = map.get(m[1]); const end = elementEnd(h, m.index);
      if (!p) { from = end; continue; }
      let c = h.slice(m.index, end).replace(`href="./${m[1]}"`, `href="./${p.slug}"`).replace(/<img\b[^>]*>/, tag => swapImg(tag, p, true));
      let rr = region(c, "Heading"); if (rr) c = setInner(c, rr, setP(rr.inner, p.fm.title));
      rr = region(c, "Subheading"); if (rr && rr.inner.replace(/<[^>]+>/g, "").trim()) c = setInner(c, rr, setP(rr.inner, p.fm.category || ""));
      h = h.slice(0, m.index) + c + h.slice(end); from = m.index + c.length;
    }
  }
  const ld = [{
    "@context": "https://schema.org", "@type": "BlogPosting", headline: fm.title.slice(0, 110), description: fm.description,
    image: [img], datePublished: fm.date, dateModified: fm.updated || fm.date, mainEntityOfPage: url, inLanguage: cfg.lang,
    author: AUTHOR,
    publisher: { "@type": "Organization", name: cfg.brand, url: cfg.origin },
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [[L.home, cfg.origin + "/"], ["Blog", cfg.origin + "/blog"], [fm.title, url]]
      .map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  }];
  h = h.replace(/<style data-sk-post>[\s\S]*?<\/style>/, "").replace(/<script type="application\/ld\+json" data-sk-post>[\s\S]*?<\/script>/, "");
  return h.replace("</head>", `${POST_CSS}<script type="application/ld+json" data-sk-post>${JSON.stringify(ld).replace(/</g, "\\u003c")}</script></head>`);
}

function renderList(tpl, posts) {
  // Kart yuvası: kart kabı, doğrudan bir ssr-variant içindeyse o sarmalayıcı
  const needle = `<div class="${cfg.cardSelector}"`;
  let h = tpl, idx; const variants = [];
  let groupKeys = null, seen = new Set();
  while ((idx = h.indexOf(needle)) >= 0) {
    const w = h.lastIndexOf('<div class="ssr-variant', idx);
    const s = w >= 0 && /^<div class="ssr-variant[^"]*"(?: hidden)?>$/.test(h.slice(w, idx)) ? w : idx;
    const e = elementEnd(h, s), slot = h.slice(s, e), key = slot.slice(0, slot.indexOf(">"));
    if (!groupKeys) { if (seen.has(key)) groupKeys = seen; else { seen.add(key); variants.push(slot); } }
    h = h.slice(0, s) + "\u0000" + h.slice(e);
  }
  const fill = (c, p) => {
    c = c.replace(/(<a\b[^>]*\shref=")\.\/[^"]*/, `$1./blog/${p.slug}`).replace(/<img\b[^>]*>/, tag => swapImg(tag, p, true));
    for (const n of ["Tag", "Subheading"]) {
      const r = region(c, n); if (r && r.inner.replace(/<[^>]+>/g, "").trim()) c = setInner(c, r, setP(r.inner, p.fm.category || "Blog"));
    }
    if (/<h5\b/.test(c)) c = c.replace(/(<h5[^>]*>)[\s\S]*?(<\/h5>)/, `$1${esc(p.fm.title)}$2`);
    else { const r = region(c, "Heading"); if (r) c = setInner(c, r, setP(r.inner, p.fm.title)); }
    const r = region(c, "date &amp; author"); if (r) c = setInner(c, r, r.inner.replace(/(<p[^>]*>)[^<]*(<\/p>)/, `$1${fmtDate(p.fm.date)}$2`));
    // Sınıfla tanımlı kart alanları (ör. yalcinberkay: h3 başlık, özet, tarih, okuma süresi)
    const F = cfg.cardFields || {};
    let f = region(c, F.title); if (f) c = setInner(c, f, f.inner.replace(/(<h\d[^>]*>)[\s\S]*?(<\/h\d>)/, `$1${esc(p.fm.title)}$2`));
    for (const [k, v] of [["summary", p.fm.description], ["date", fmtDate(p.fm.date)], ["readTime", readTime(p.body)]]) {
      f = region(c, F[k]); if (f) c = setInner(c, f, setP(f.inner, v));
    }
    return c;
  };
  const cards = posts.map((p, i) => "<!--$-->" + variants.map(v => {
    const c = fill(v, p);
    return cfg.perPage && i >= cfg.perPage ? c.replace(/^<div class="([^"]*)"/, '<div class="$1 sk-more" hidden') : c;
  }).join("") + "<!--/$-->").join("");
  // Öne çıkan (hero) alanı en yeni yazıya — kartlardan önce, aynı slug kartı ezmesin
  if (cfg.listHero && posts[0]) {
    const p = posts[0], hero = cfg.listHero;
    h = h.split(`href="${hero.href}"`).join(`href="./blog/${p.slug}"`);
    h = eachRegion(h, hero.title, (h, r) => setInner(h, r, r.inner.replace(/(<h1[^>]*>)[\s\S]*?(<\/h1>)/, `$1${esc(p.fm.title)}$2`)));
    h = eachRegion(h, hero.text, (h, r) => setInner(h, r, setP(r.inner, p.fm.description)));
  }
  let first = true;
  h = h.replace(/(?:<!--\$-->)?\u0000+(?:<!--\/\$-->)?/g, () => first ? (first = false, cards) : "");
  h = h.replace(/<script data-sk-list>[\s\S]*?<\/script>/, "").replace(/<style data-sk-list>[\s\S]*?<\/style>/, "");
  if (!cfg.perPage) return h;
  const js = `<script>addEventListener("DOMContentLoaded",()=>{const b=[...document.querySelectorAll("button")].find(x=>/Load More/i.test(x.textContent));if(!b)return;const up=()=>{if(!document.querySelector(".sk-more[hidden]"))b.style.display="none"};up();b.addEventListener("click",()=>{[...document.querySelectorAll(".sk-more[hidden]")].slice(0,${cfg.perPage}).forEach(e=>e.hidden=false);up()})})</script>`;
  // .ssr-variant{display:contents} hidden niteliğini ezer
  const css = `<style data-sk-list>.sk-more[hidden]{display:none!important}</style>`;
  return h.replace("</head>", css + "</head>").replace("</body>", js.replace("<script>", "<script data-sk-list>") + "</body>");
}

async function buildSite() {
  const tplPost = await readFile(join(TPL, "post.html"), "utf8");
  const tplList = await readFile(join(TPL, "blog.html"), "utf8").catch(() => null);
  const posts = [];
  for (const f of (await readdir(CONTENT)).filter(f => f.endsWith(".md"))) {
    const { fm, body } = parseMd(await readFile(join(CONTENT, f), "utf8"));
    if (fm.draft) continue;
    if (!fm.image && cfg.defaultImage) fm.image = cfg.defaultImage;
    posts.push({ slug: f.replace(/\.md$/, ""), fm, body });
  }
  posts.sort((a, b) => b.fm.date.localeCompare(a.fm.date) || a.slug.localeCompare(b.slug));
  await mkdir(join(SITE, "blog"), { recursive: true });
  for (const [i, p] of posts.entries()) await writeFile(join(SITE, "blog", p.slug + ".html"), renderPost(tplPost, p, posts[i + 1] || posts[0], relatedFor(p, posts)));
  if (tplList) await writeFile(join(SITE, "blog.html"), renderList(tplList, posts));
  // Worker'ın konu seçimi ve iç linkleme için özet
  await writeFile(join(SITE, "_blog-index.json"), JSON.stringify(posts.map(p => ({ slug: p.slug, title: p.fm.title, category: p.fm.category, date: p.fm.date, image: p.fm.image }))));
  // Sitemap: blog dışı sayfalar orijinalden, yazılar içerikten
  const orig = await readFile(join(SITE, "_orig-sitemap.xml"), "utf8").catch(() => "");
  const keep = [...orig.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()).filter(u => !/\/blog\/./.test(new URL(u).pathname));
  if (!keep.some(u => new URL(u).pathname === "/blog")) keep.push(`${cfg.origin}/blog`);
  const urls = [...keep.map(u => `<url><loc>${u}</loc></url>`), ...posts.map(p => `<url><loc>${cfg.origin}/blog/${encodeURIComponent(p.slug)}</loc><lastmod>${p.fm.updated || p.fm.date}</lastmod></url>`)];
  await writeFile(join(SITE, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  console.log(`build: ${posts.length} yazı${tplList ? " + liste" : ""}, sitemap ${urls.length} url`);
}

await (cmd === "import" ? importSite() : buildSite());
