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
// wishceo sayilar/NNN.json: app.js ISSUES'taki açılış tarihi bugünden (Türkiye saati, app.js todayTR gibi) ileri olan sayı yayına çıkmaz;
// hiç açılmış sayı yoksa app.js gibi ISSUES'taki ilk sayı kopyalanır. Dizi, satır başındaki tek "var ISSUES = [" bildiriminden eşleşen "]"e kadar okunur:
// dizgiler korunur, yorumlar atılır (yorum satırına alınmış sayı açılmış sayılmaz). Dizi okunamazsa bütün dosya yorumları atılarak taranır.
// Bu durum, okunamayan kayıt ve tarihi olmayan sayı dosyası uyarı verir
const APP_JS = await readFile(join(SRC, "app.js"), "utf8").catch(() => "");
// i'den itibaren dizgiler korunup yorumlar atılır; depth verilirse eşleşen kapanış parantezinde durulur
const stripJs = (s, i = 0, depth = 0) => {
  let out = "";
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === "/" && s[i + 1] === "/") { const e = s.indexOf("\n", i); if (e < 0) return depth ? null : out; i = e - 1; continue; }
    if (c === "/" && s[i + 1] === "*") { const e = s.indexOf("*/", i + 2); if (e < 0) return null; i = e + 1; out += " "; continue; }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      for (; j < s.length && s[j] !== c && (c === "`" || s[j] !== "\n"); j++) if (s[j] === "\\") j++;
      if (s[j] === c) { out += s.slice(i, j + 1); i = j; continue; }
      // kapanmayan dizgi: dizide okuma bırakılır; bütün dosyada (düzenli ifadedeki tırnak gibi) düz karakter sayılır
      if (depth) return null;
    }
    if (depth) { if ("[{(".includes(c)) depth++; else if ("]})".includes(c) && !--depth) return out; }
    out += c;
  }
  return depth ? null : out;
};
const issuesArray = s => {
  const decl = [...s.matchAll(/^[ \t]*(?:var|let|const)[ \t]+ISSUES[ \t]*=[ \t]*\[/gm)];
  return decl.length === 1 ? stripJs(s, decl[0].index + decl[0][0].length, 1) : null;
};
const ISSUES_ARR = issuesArray(APP_JS), ISSUES_SRC = ISSUES_ARR ?? stripJs(APP_JS) ?? APP_JS;
const ISSUE_DATES = new Map([...ISSUES_SRC.matchAll(/no:\s*"(\d+)",\s*date:\s*"(\d{4}-\d{2}-\d{2})"/g)].map(m => [m[1], m[2]]));
// Intl/saat dilimi verisi yoksa ya da beklenmedik parça dönerse app.js todayTR gibi UTC+3 (Türkiye 2016'dan beri yaz saati uygulamıyor)
const today = (() => {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const d = `${p.year}-${p.month}-${p.day}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch {}
  return new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10);
})();
const issueFiles = (await readdir(join(SRC, "sayilar")).catch(() => [])).filter(n => /^\d+\.json$/.test(n)).sort();
// app.js RELEASED gibi ISSUES sırasıyla
const hasFile = new Set(issueFiles), dated = [...ISSUE_DATES.keys()].map(n => `${n}.json`).filter(n => hasFile.has(n));
const released = dated.filter(n => ISSUE_DATES.get(n.replace(".json", "")) <= today);
const liveIssues = new Set(released.length ? released : dated.length ? dated.slice(0, 1) : issueFiles.slice(0, 1));
// sayi/NNN.html arşiv sayfası da sayilar/NNN.json ile aynı tarih kapısından geçer
const issueOf = src => {
  const dir = basename(join(src, "..")), f = basename(src);
  return dir === "sayilar" && /^\d+\.json$/.test(f) ? f : dir === "sayi" && /^\d+\.html$/.test(f) ? f.replace(".html", ".json") : null;
};
await cp(SRC, OUT, { recursive: true, force: true, filter: src => !PRIVATE.test(basename(src)) && (!issueOf(src) || liveIssues.has(issueOf(src))) });
if (issueFiles.length) console.log(`sayilar: ${liveIssues.size}/${issueFiles.length} yayında (${today})`);
const undated = issueFiles.filter(n => !ISSUE_DATES.has(n.replace(".json", "")));
if (issueFiles.length && (ISSUES_ARR == null || undated.length || (ISSUES_SRC.match(/\bno\s*:/g) || []).length !== ISSUE_DATES.size))
  console.log(`::warning file=${relative(root, join(SRC, "app.js"))}::sayilar: ${ISSUES_ARR == null ? "ISSUES dizisi okunamadı, bütün dosya tarandı; " : ""}ISSUES ${ISSUE_DATES.size} kayıt okundu${undated.length ? `, tarihi yok: ${undated.join(" ")}` : ""}`);

// wishceo index.html'deki sayı alanları (JS çalıştırmayan botlar ve ilk boyama için) yayındaki son sayıdan yazılır; metinler app.js fillPage/init ile aynı.
// Alanlardan biri bulunmazsa, birden çok yerde geçerse ya da içinde etiket varsa index olduğu gibi kalır (app.js sayfayı yine doldurur)
let stamped, stampedDate;
if (released.length) {
  const warn = msg => console.log(`::warning file=${relative(root, join(SRC, "index.html"))}::index: ${msg}`);
  // app.js boot gibi: vaka dizisi dolu olan en yeni açılmış sayı (BOM'lu JSON da okunur, fetch().json() gibi)
  let no, cases;
  for (const n of [...released].reverse()) {
    cases = await readFile(join(SRC, "sayilar", n), "utf8").then(s => JSON.parse(s.replace(/^﻿/, ""))).catch(() => null);
    if (Array.isArray(cases) && cases.length) { no = n.replace(".json", ""); break; }
  }
  // app.js'in okuduğu vaka alanlarından biri yoksa yazılmaz (sayfaya "undefined" çıkmasın)
  if (no && !cases.every(c => c?.title != null && c.area != null && Array.isArray(c.place) && c.place[0] != null)) { warn(`sayı ${no} yazılmadı, vaka alanı eksik`); no = undefined; }
  // place[1] boş olmayan bir metin dışı değerse app.js yearOf çöker: deploy bilerek durur (oyunu açılmayan sayı yayına çıkmasın)
  if (no) cases.forEach((c, i) => { if (c.place[1] && typeof c.place[1] !== "string") throw new Error(`sayı ${no} dosya ${i + 1}: place[1] metin değil`); });
  // tarih app.js gibi taşarak okunur (31 Nisan -> 1 Mayıs); ay ya da gün geçersizse (32 vb.) app.js de tarihi yazamaz, index olduğu gibi kalır
  const [Y, M, D] = no ? ISSUE_DATES.get(no).split("-").map(Number) : [];
  if (no && !(M >= 1 && M <= 12 && D >= 1 && D <= 31)) { warn(`sayı ${no} yazılmadı, tarih geçersiz: ${ISSUE_DATES.get(no)}`); no = undefined; }
  if (no) {
    const N = cases.length, WORDS = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı"], WORDS_LO = ["", "bir", "iki", "üç", "dört", "beş", "altı"];
    const AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    // tr-TR "26 Ekim 2026" elle kurulur (Node'un Intl verisi eksikse de aynı metin)
    const day = new Date(Date.UTC(Y, M - 1, D)), date = `${day.getUTCDate()} ${AY[day.getUTCMonth()]} ${day.getUTCFullYear()}`;
    const items = cases.map((c, i) => {
      const y = (c.place[1] || "").replace(/^\s*·\s*/, "");
      return `<li><a href="#oyun"><span class="n">${String(i + 1).padStart(2, "0")}</span><span class="t">${esc(c.title)}</span><span class="m">${esc(c.area + " · " + c.place[0] + (y ? ", " + y : ""))}</span></a></li>`;
    });
    // Etiketler öznitelik değerleri atlanarak okunur; yorum, <script>, <style>, <textarea> ve <title> aynı uzunlukta boşlukla maskelenir (konumlar asıl HTML'de geçerli)
    const mask = h => h.replace(/<!--(?:-?>|[\s\S]*?(?:--!?>|$))|<(script|style|textarea|title)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, m => " ".repeat(m.length));
    const TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
    const tags = h => [...mask(h).matchAll(TAG)].map(m => ({
      name: m[1].toLowerCase(), start: m.index, end: m.index + m[0].length,
      attrs: new Map([...m[2].matchAll(/\s+([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)].map(a => [a[1].toLowerCase(), a[2] ?? a[3] ?? a[4] ?? ""])),
    }));
    const ids = h => tags(h).map(t => t.attrs.get("id")).filter(v => v != null).sort().join("\n");
    let html = await readFile(join(OUT, "index.html"), "utf8").catch(() => "");
    const before = ids(html), miss = [];
    // Her alanın bütün adayları düz metinli öğe olmalı; öznitelik adı başka bir yerde de geçiyorsa (metinde, değer içinde, bozuk etikette) yazılmaz
    const FIELDS = [["data-issue", null, `Sayı ${no}`], ["id", "today", date], ["id", "hero-meta", `${N} dosya · ${N} karar · 1 CEO karnesi · Üyelik yok`]];
    // app.js gibi: 7 ve üstü rakamla yazılır
    if (N) FIELDS.push(["id", "oyun-intro", `${WORDS[N] || N} şirket, ${WORDS_LO[N] || N} kriz. Hangisinde vakadaki CEO’dan daha iyi iş çıkarırsın?`]);
    for (const [attr, v, val] of FIELDS) {
      const label = v == null ? attr : `${attr}="${v}"`;
      const cands = tags(html).filter(t => t.attrs.has(attr) && (v == null || t.attrs.get(attr) === v));
      const raw = (mask(html).match(new RegExp(v == null ? `\\b${attr}\\b` : `\\b${attr}\\s*=\\s*["']?${v}(?![\\w-])`, "gi")) || []).length;
      const spans = cands.map(t => ({ t, m: html.slice(t.end).match(new RegExp(`^[^<]*(?=</${t.name}\\s*>)`, "i")) }));
      if (!cands.length || raw !== cands.length || spans.some(s => !s.m)) { miss.push(label); continue; }
      for (const { t, m } of spans.reverse()) html = html.slice(0, t.end) + val + html.slice(t.end + m[0].length);
    }
    // vaka listesi: tek bir <ol id="index-list">, içinde yalnız <li>'ler (yorum, <script>, <style> yok); satır düzeni korunur (ilk <li>'den önceki boşluk her satırda tekrarlanır)
    const lists = tags(html).filter(t => t.attrs.get("id") === "index-list");
    // liste sonu, açılış etiketleri de maskelenerek aranır (öznitelik değerindeki "</ol>" sayılmaz)
    const len = lists.length === 1 && lists[0].name === "ol" ? mask(html).slice(lists[0].end).replace(TAG, m => " ".repeat(m.length)).search(/<\/ol\s*>/i) : -1;
    const body = len < 0 ? undefined : html.slice(lists[0].end, lists[0].end + len);
    if (body == null || mask(body) !== body || /<ol\b|<\/?(?:section|aside|main|div|article|header|footer)\b|\sid\s*=/i.test(body) || !/^\s*(?:<li\b(?:(?!<\/?li\b)[\s\S])*<\/li\s*>\s*)*$/i.test(body)) miss.push('id="index-list"');
    else {
      const ws = body.match(/^\s*/)[0], trail = body.slice(ws.length).match(/\s*$/)[0];
      html = html.slice(0, lists[0].end) + ws + items.join(ws) + trail + html.slice(lists[0].end + body.length);
    }
    // footer'daki <p id="sayi-links" hidden></p>: yayındaki sayıların (liveIssues, sayi/NNN.html'i çıktıda olan) arşiv sayfalarına statik bağlantı, yeniden eskiye.
    // Öğe tek, boş ve hidden değilse yazılmaz (sayı alanları yine yazılır; app.js arşiv listesindeki bağlantıyı kendisi ekler)
    const live = [];
    for (const n of [...liveIssues].sort().reverse()) if (await has(join(OUT, "sayi", n.replace(".json", ".html")))) live.push(n.replace(".json", ""));
    const slots = tags(html).filter(t => t.attrs.get("id") === "sayi-links");
    const slotEnd = slots.length === 1 && slots[0].name === "p" && slots[0].attrs.has("hidden") ? html.slice(slots[0].end).match(/^\s*<\/p\s*>/i) : null;
    if (live.length && !slotEnd) warn(`sayı bağlantıları yazılmadı, boş ve hidden tek <p id="sayi-links"> yok`);
    else if (live.length) {
      const open = html.slice(slots[0].start, slots[0].end).replace(/\s+hidden(?:\s*=\s*(?:""|''|hidden))?(?=[\s>\/])/i, "");
      html = html.slice(0, slots[0].start) + open + `Sayı arşivi: ${live.map(n => `<a href="/sayi/${n}">Sayı ${n}</a>`).join(" · ")}</p>` + html.slice(slots[0].end + slotEnd[0].length);
    }
    if (!miss.length && ids(html) !== before) miss.push("id kümesi değişti");
    if (miss.length) warn(`sayı ${no} yazılmadı, bulunamayan alan: ${miss.join(", ")}`);
    else { await writeFile(join(OUT, "index.html"), html); stamped = html; stampedDate = day.toISOString().slice(0, 10); console.log(`index: sayı ${no} yazıldı (${N} dosya, ${date})`); }
  }
}

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
// wishceo'da sayı alanları yazılmış index (llms-full.txt ana sayfa metni yayındaki sayıyı gösterir)
const index = stamped ?? await readFile(join(SRC, "index.html"), "utf8").catch(() => "");
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
// Tarihi gelmemiş sayının arşiv sayfası çıktıda yok: build-blog'un _orig-sitemap'ten taşıdığı /sayi/NNN URL'si düşülür (llms.txt sitemap'ten üretilir)
{
  let xml = await readFile(join(OUT, "sitemap.xml"), "utf8");
  const dropped = [];
  for (const b of xml.match(/<url>[\s\S]*?<\/url>/g) || []) {
    const p = decodeURI(new URL(b.match(/<loc>([^<]+)/)[1].trim()).pathname).replace(/^\/|\/$/g, "").replace(/(\/index)?\.html$|\/index$/, "");
    if (!/^sayi\/\d+$/.test(p) || (await has(join(OUT, p + ".html")))) continue;
    const i = xml.indexOf(b);
    let s = i;
    while (s > 0 && /[ \t]/.test(xml[s - 1])) s--;
    if (xml[s - 1] === "\n") s--;
    xml = xml.slice(0, s) + xml.slice(i + b.length);
    dropped.push("/" + p);
  }
  if (dropped.length) { await writeFile(join(OUT, "sitemap.xml"), xml); console.log(`sitemap: açılmamış ${dropped.length} sayı düşüldü (${dropped[0]}…)`); }
}
// lastmod yalnızca içerik değişikliğinden gelir: yazıda BlogPosting dateModified, blog listesinde en yeni yazı,
// statik sayfada elle tutulan _orig-sitemap değeri (wishceo ana sayfasında yazılan sayının tarihi daha yeniyse o). Başka kaynaklı lastmod (araç commit'i, dosya tarihi) silinir.
{
  const ld = h => [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m => { try { const j = JSON.parse(m[1]); return Array.isArray(j) ? j : j["@graph"] || [j]; } catch { return []; } });
  const origLm = new Set([...orig.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => `${m[1].match(/<loc>([^<]+)/)?.[1].trim()} ${m[1].match(/<lastmod>([^<]+)/)?.[1].trim()}`));
  let xml = await readFile(join(OUT, "sitemap.xml"), "utf8");
  const fixed = [];
  for (const b of xml.match(/<url>[\s\S]*?<\/url>/g) || []) {
    const lm = b.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1].trim(), loc = b.match(/<loc>([^<]+)/)[1].trim();
    const p = decodeURI(new URL(loc).pathname).replace(/^\/|\/$/g, "");
    // wishceo ana sayfası: yazılan sayının açılış tarihi elle tutulan değerden yeniyse lastmod o olur
    if (p === "" && stampedDate && lm && stampedDate > lm) { xml = xml.replace(b, b.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${stampedDate}</lastmod>`)); fixed.push(`/: ${lm} -> ${stampedDate}`); continue; }
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
