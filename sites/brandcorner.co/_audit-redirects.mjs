#!/usr/bin/env node
// _redirects denetimi: dosyayı Cloudflare Pages'in okuduğu gibi ayrıştırır (wrangler pages-shared: parseRedirects,
// statik kurallar önce birebir, sonra dinamikler sırayla; sondaki / eşitlenmez) ve her kaynağı + /'lı ikizini
// yayımlanacak dosyalar (bu klasör + build-blog çıktısı) üzerinde istek gibi çalıştırır.
// Geçme şartı: tek yönlendirme, hedef 200 (zincir, döngü, 404 yok), #çapa hedef sayfada id olarak var.
// Kullanım: node sites/brandcorner.co/_audit-redirects.mjs [başka-_redirects]   (_audit- öneki: dist.mjs bu dosyayı yayımlamaz)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = dirname(fileURLToPath(import.meta.url)), HOST = basename(SITE), ROOT = join(SITE, "..", "..");
const ORIGIN = "https://www." + HOST;
const PRIVATE = /^_(audit|mirror-report|orig-).*|\.log$/; // tools/dist.mjs ile aynı
const CONFIG = new Set(["_redirects", "_headers", "_routes.json"]);
const STATUS = new Set([200, 301, 302, 303, 307, 308]);

// Yayımlanacak dosyalar: klasördekiler + build-blog'un deploy'da ürettikleri (blog.html, blog/<slug>.html, blog/rss.xml)
const files = new Set();
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (PRIVATE.test(e.name) || (d === SITE && CONFIG.has(e.name))) continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p); else files.add("/" + relative(SITE, p).split(sep).join("/"));
  }
})(SITE);
const posts = [], blogDir = join(ROOT, "content", HOST, "blog");
if (existsSync(blogDir)) for (const f of readdirSync(blogDir).filter(f => f.endsWith(".md")).sort()) {
  const fm = readFileSync(join(blogDir, f), "utf8").match(/^---\n([\s\S]*?)\n---/)?.[1] || "";
  if (/^draft:\s*("?true"?|"[^"]+")\s*$/m.test(fm)) continue;
  posts.push(f.slice(0, -3));
}
if (existsSync(join(ROOT, "templates", HOST, "blog.html"))) files.add("/blog.html");
for (const s of posts) files.add(`/blog/${s}.html`);
if (posts.length) files.add("/blog/rss.xml");

// Ayrıştırma (parseRedirects ile aynı kurallar)
const fail = [], statics = new Map(), dynamics = [], seen = new Set();
let canStatic = true;
readFileSync(process.argv[2] || join(SITE, "_redirects"), "utf8").split("\n").forEach((raw, i) => {
  const line = raw.trim(), n = i + 1;
  if (!line || line.startsWith("#")) return;
  const t = line.replace(/\s+#.*$/, "").split(/\s+/);
  if (t.length < 2 || t.length > 3) return fail.push(`satır ${n}: 2 ya da 3 parça olmalı (${t.length})`);
  const [from, to, st = "302"] = t, status = Number(st);
  if (!from.startsWith("/")) return fail.push(`satır ${n}: kaynak / ile başlamalı`);
  const dynamic = !canStatic || from.includes("*") || /:[A-Za-z]\w*/.test(from);
  if (dynamic) canStatic = false;
  if (!STATUS.has(status)) return fail.push(`satır ${n}: geçersiz durum kodu ${st}`);
  if ((from.endsWith("/*") || from.endsWith("/")) && /\/index(\.html)?$/.test(to)) return fail.push(`satır ${n}: /index hedefi döngü yapar`);
  if (seen.has(from)) return fail.push(`satır ${n}: ${from} yineleniyor, Pages ikincisini yok sayar`);
  seen.add(from);
  const rule = { n, from, to, status, dynamic };
  if (dynamic) {
    const re = from.split("*").map(s => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("(?<splat>.*)").replace(/:([A-Za-z]\w*)/g, "(?<$1>[^/]+)");
    dynamics.push({ ...rule, re: new RegExp("^" + re + "$") });
  } else statics.set(from, rule);
});

function match(path) {
  if (statics.has(path)) { const r = statics.get(path); return { r, to: r.to }; }
  for (const r of dynamics) {
    const m = r.re.exec(path);
    if (m) { let to = r.to; for (const [k, v] of Object.entries(m.groups || {})) to = to.replaceAll(":" + k, v); return { r, to }; }
  }
}

// Pages asset sunucusu (generateHandler): sondaki /, .html ve /index için 308'ler
function asset(p) {
  const has = f => files.has(f), go = location => ({ status: 308, location });
  if (p.endsWith("/")) {
    if (has(p + "index.html")) return { status: 200, file: p + "index.html" };
    if (p.endsWith("/index/")) return go(p.slice(0, -"index/".length));
    if (has(p.slice(0, -1) + ".html")) return go(p.slice(0, -1));
    return { status: 404 };
  }
  if (has(p)) {
    if (!p.endsWith(".html")) return { status: 200, file: p };
    const x = p.slice(0, -".html".length);
    if (x.endsWith("/index")) return go(x.replace(/\/index$/, "/"));
    return has(x) || x === "/" ? { status: 200, file: p } : go(x);
  }
  if (p.endsWith("/index")) return go(p.slice(0, -"index".length));
  if (has(p + ".html")) return { status: 200, file: p + ".html" };
  if (has(p + "/index.html")) return go(p + "/");
  return { status: 404 };
}

function request(path) {
  const m = match(path);
  if (!m) return asset(path);
  const u = new URL(m.to, ORIGIN + path);
  if (m.r.status === 200) return { ...asset(u.pathname), rule: m.r };
  return { status: m.r.status, location: u.origin === ORIGIN ? u.pathname + u.search + u.hash : u.href, rule: m.r };
}

// Örnek yollar: dinamik kurallarda :ad ve * yerine gerçek bir yazı slug'ı; uzantısız yolların /'lı ya da /'sız ikizi
const slug = posts[0] || "ornek";
const sample = from => from.replace(/:[A-Za-z]\w*/g, slug).replace(/\*/g, slug);
const twin = p => p === "/" || /\.[a-z0-9]+$/i.test(p) ? null : p.endsWith("/") ? p.slice(0, -1) : p + "/";
const paths = [];
for (const r of [...statics.values(), ...dynamics]) for (const p of [sample(r.from), twin(sample(r.from))]) if (p && !paths.includes(p)) paths.push(p);

const rows = [];
for (const src of paths) {
  const first = request(src);
  if (!first.rule) { fail.push(`${src}: kural yok, ${first.status}${first.location ? " → " + first.location : ""} (ikizi yönleniyor, bu da yönlenmeli)`); continue; }
  const shadow = asset(src);
  if (shadow.status === 200) fail.push(`${src}: var olan ${shadow.file} dosyasını gölgeliyor`);
  if (first.status === 200) { rows.push([src, "200", "(rewrite)", String(first.status)]); continue; }
  const hops = [src], u0 = new URL(first.location, ORIGIN);
  let cur = first, at = u0.pathname;
  if (u0.origin !== ORIGIN) { rows.push([src, String(first.status), first.location, "dış adres"]); continue; }
  for (let i = 0; i < 10 && cur.location; i++) {
    at = new URL(cur.location, ORIGIN).pathname;
    if (hops.includes(at)) { fail.push(`${src}: döngü ${[...hops, at].join(" → ")}`); break; }
    hops.push(at); cur = request(at);
  }
  const end = request(u0.pathname);
  rows.push([src, `${first.status} (satır ${first.rule.n})`, first.location, end.status + (end.location ? " → " + end.location : "")]);
  if (end.status !== 200) fail.push(`${src}: hedef ${u0.pathname} ${end.status}${end.location ? " → " + end.location + " (zincir)" : ""}`);
  else if (u0.hash && end.file?.endsWith(".html") && existsSync(join(SITE, end.file))
    && !new RegExp(`\\sid=["']${u0.hash.slice(1)}["']`).test(readFileSync(join(SITE, end.file), "utf8"))) fail.push(`${src}: ${end.file} içinde id="${u0.hash.slice(1)}" yok`);
}

const w = [0, 1, 2].map(i => Math.max(...rows.map(r => r[i].length)));
for (const r of rows) console.log(r.map((c, i) => i < 3 ? c.padEnd(w[i]) : c).join("  "));
console.log(`\n${statics.size} statik + ${dynamics.length} dinamik kural, ${rows.length} yol denendi (blog: ${posts.length} yazı, örnek slug ${slug})`);
if (fail.length) { console.error("\nHATA:\n" + fail.map(f => "  " + f).join("\n")); process.exit(1); }
console.log("TAMAM: her kaynak ve ikizi tek adımda 200 veren sayfaya gidiyor; zincir/döngü yok");
