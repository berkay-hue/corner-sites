// Giriş gerektiren Framer uygulama sayfalarını (salescorner panel + araçlar) Framer runtime'ı ile birlikte
// kendi sitemize taşır. mirror.mjs runtime'ı atar; bu sayfalar ise React kod bileşenleriyle çalışır.
//   node tools/framer-app.mjs salescorner.co
// framerusercontent.com'daki her şey (modüller, CMS, fontlar, görseller) sites/<host>/_fru/ altına iner,
// adresler /_fru/... olur. Sayfalar noindex işaretlenir (sitemap/llms dışı kalır).
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";

const APPS = {
  "salescorner.co": ["linkedin-callback"],
};
const host = process.argv[2];
const pages = APPS[host];
if (!pages) throw new Error("bilinmeyen site: " + host);
const SITE = join(import.meta.dirname, "..", "sites", host);
const FRU = "https://framerusercontent.com/";
const ABS = /https:\/\/framerusercontent\.com\/(?:sites|assets|images|modules)\/[^"'`\s)?&,;\\]+/g;
const REL = /["'`](\.\/[^"'`\s]+\.mjs)["'`]/g;
// CMS parçaları modül adresine göre çözülür: new URL(`./x.framercms`, `https://framerusercontent.com/modules/...`)
const CMS = /new URL\(`(\.\/[^`]+\.framercms)`,`(https:\/\/framerusercontent\.com\/modules\/[^`]+)`\)/g;

async function get(url, bin) {
  for (let i = 0; ; i++) {
    const r = await fetch(url);
    if (r.ok) return bin ? Buffer.from(await r.arrayBuffer()) : r.text();
    if (r.status === 404 || i === 2) throw new Error(`${r.status} ${url}`);
  }
}

// Framer editör çubuğu (framer.com/edit) yüklenmez
const rewrite = s => s.replaceAll("await import(`https://framer.com/edit/init.mjs`)", "({createEditorBar:()=>()=>null})").replaceAll("`" + FRU + "modules/", "`${location.origin}/_fru/modules/").replaceAll(FRU, "/_fru/");

const seen = new Set(), queue = [], failed = [];
const add = u => { if (!seen.has(u)) { seen.add(u); queue.push(u); } };

for (const p of pages) {
  let html = await get(`https://${host}/${p}`);
  for (const m of html.matchAll(ABS)) add(m[0]);
  html = html
    .replace(/<link[^>]*href="https:\/\/framer\.com\/edit\/init\.mjs"[^>]*>/g, "")
    .replace(/<script[^>]*src="https:\/\/events\.framer\.com\/[^"]*"[^>]*><\/script>/g, "")
    .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">')
    // Oturum kontrolü login sayfasının kendisinde de çalışıp sonsuz yeniden yükleme yapıyordu (canlıda da)
    .replace(/if \(!data\.session\) \{/g, "if (!data.session && location.pathname !== '/login') {");
  await writeFile(join(SITE, p + ".html"), rewrite(html));
}

let bytes = 0;
async function worker() {
  while (queue.length) {
    const u = queue.shift();
    const isText = /\.(mjs|js)$/.test(u);
    let body;
    try { body = await get(u, !isText); } catch (e) { failed.push(e.message); continue; }
    if (isText) {
      for (const m of body.matchAll(ABS)) add(m[0]);
      for (const m of body.matchAll(REL)) add(new URL(m[1], u).href);
      for (const m of body.matchAll(CMS)) add(new URL(m[1], m[2]).href);
      body = rewrite(body);
    }
    const out = join(SITE, "_fru", new URL(u).pathname);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, body);
    bytes += body.length;
  }
}
// Kuyruk işlenirken yeni adresler eklenir; boşalana kadar dalga dalga çalıştır
while (queue.length) await Promise.all(Array.from({ length: 8 }, worker));
console.log(`${pages.length} sayfa, ${seen.size} dosya, ${(bytes / 1e6).toFixed(1)} MB`);
if (failed.length) console.log("inmeyen:", failed);
