// A14 — müşteri web sitesine (blog) yazı gönderen CMS adaptörleri. Hepsi aynı arayüz (çekirdek ve arayüz buna göre):
//   PROVIDERS[id] = { id, name, auth:"key"|"oauth", fields, notes_tr?, notes_en?, requires?, probe, push, oauth? }
//   probe(inputs, io)  → { ok:true, account:{name,url}, options:{ key:{label_tr,label_en,required,items:[{id,label,parent?}]} },
//                          config:{gizli olmayan}, creds:{gizli} } | { ok:false, error }
//   push(post, { config, creds, mode:"draft"|"publish" }, io) → { ok:true, remote_id, url, creds? } | { ok:false, error, retry, creds? }
//   io = { fetch, now:()=>ms, log, env? }; post = { title, slug, html, markdown, excerpt, cover?:{url,alt,credit}, lang, tags? }
// Çekirdek kullanıcının seçimlerini probe item'larına karşı yeniden denetler ve config[key]=id yazar; push seçimleri config'ten okur.
// Token yenilenen akışlarda (Shopify client_credentials, IdeaSoft refresh) yeni creds başarısız sonuçta da döner: IdeaSoft refresh
// token'ı her kullanımda değişir, eski olan bir daha çalışmaz; çekirdek creds geldiyse her durumda (atomik) yazmalı.
//
// Güvenlik:
// - Müşteri URL'si alan platformlar (wordpress, ghost, ideasoft) safeUrl + guardedFetch: yalnız https, port yok/443, userinfo yok,
//   IP literal yok (WHATWG URL ondalık/hex/kısa v4 biçimlerini noktalı dörtlüye çevirir; o da reddedilir), iç ad uzantıları ve tek
//   etiketli ad yok. Yönlendirme elle (redirect:"manual", en çok 3), her Location yeniden denetlenir; farklı host'a kimlik başlığı gitmez.
// - Sabit host'lu platformlar allowHosts ile kilitli. Görsel bayt indirme (WordPress media, IdeaSoft attachment) yalnız images.pexels.com.
// - Hiçbir hata metnine/loga anahtar ya da token girmez: hatalar yalnız kısa kod; log yalnız { platform, adım, kod, HTTP durumu }.
// - Ghost newsletter parametresi ASLA gönderilmez. Webflow site publish ASLA çağrılmaz (yalnız koleksiyon item publish).
// - Zaman aşımı: probe 10 sn, push 25 sn (Wix create 30 sn: Wix belgesi tek create'in 25–30 sn sürebildiğini söylüyor).
//   İdempotent olmayan create'te zaman aşımı → unknown_result, retry:false (körlemesine tekrar = çift yazı).
// CPU: ücretsiz plan 10 ms; ağır kütüphane yok, Markdown dönüştürücü küçük ve tek geçişli.

const enc = new TextEncoder();
const dec = new TextDecoder();
export const PROBE_MS = 10_000;
export const PUSH_MS = 25_000;
const WIX_CREATE_MS = 30_000;
const MAX_JSON = 2 * 1024 * 1024;
const MAX_IMG = 4 * 1024 * 1024;
const MAX_IDEASOFT_IMG = 1536 * 1024;
const UA = "SocialMediaCorner-CMS/1.0";
const PEXELS = ["images.pexels.com"];
const SECRET_HEADERS = ["authorization", "proxy-authorization", "cookie", "x-shopify-access-token"];

// ---------------------------------------------------------------- hata kodları
export const ERROR_HELP = {
  auth: {
    tr: "Anahtar ya da kullanıcı bilgisi kabul edilmedi. Anahtarı yeniden oluşturup yapıştırın.",
    en: "The key or login details were rejected. Generate the key again and paste it.",
  },
  forbidden: {
    tr: "Anahtarın izni yetmiyor. Gerekli izinleri (yazma/okuma kapsamları) verip yeniden deneyin.",
    en: "The key does not have enough permission. Grant the required read/write scopes and try again.",
  },
  not_found: {
    tr: "Site, blog, koleksiyon ya da depo bulunamadı. Adresi ve seçimleri kontrol edin.",
    en: "The site, blog, collection or repository was not found. Check the address and your choices.",
  },
  no_api: {
    tr: "Bu sitede gerekli API kapalı ya da yok (örn. WordPress Application Passwords bir güvenlik eklentisiyle kapatılmış olabilir).",
    en: "The required API is disabled or missing on this site (e.g. a security plugin may have disabled WordPress Application Passwords).",
  },
  plan: {
    tr: "Platformdaki planınız bu API'yi içermiyor (örn. Ghost(Pro) Starter'da Admin API yok, Webflow'da CMS planı gerekir).",
    en: "Your plan on the platform does not include this API (e.g. Ghost(Pro) Starter has no Admin API; Webflow needs a CMS plan).",
  },
  header_stripped: {
    tr: "Sunucunuz Authorization başlığını siliyor. Apache'de .htaccess'e şu satırı ekleyin: SetEnvIf Authorization \"(.*)\" HTTP_AUTHORIZATION=$1 — nginx'te: fastcgi_pass_header Authorization;",
    en: "Your server strips the Authorization header. On Apache add this line to .htaccess: SetEnvIf Authorization \"(.*)\" HTTP_AUTHORIZATION=$1 — on nginx: fastcgi_pass_header Authorization;",
  },
  ssrf: {
    tr: "Bu adrese bağlanamayız. Herkese açık bir alan adı ile https:// adres girin (IP adresi, yerel ad ya da özel port olmaz).",
    en: "We cannot connect to this address. Use a public domain name with https:// (no IP address, local name or custom port).",
  },
  timeout: {
    tr: "Site zamanında yanıt vermedi. Biraz sonra yeniden denenecek.",
    en: "The site did not respond in time. It will be retried later.",
  },
  bad_input: {
    tr: "Girilen bilgi geçersiz ya da eksik. Alanları kontrol edin.",
    en: "Some details are invalid or missing. Check the fields.",
  },
  rate: {
    tr: "Platform istek sınırına takıldık. Biraz sonra yeniden denenecek.",
    en: "We hit the platform's rate limit. It will be retried later.",
  },
  unknown_result: {
    tr: "Gönderim yanıtı gelmedi; yazı oluşmuş olabilir. Çift yazı olmasın diye tekrar denemedik. Sitenizde kontrol edin.",
    en: "No response to the send; the post may have been created. We did not retry to avoid a duplicate. Check your site.",
  },
  server: {
    tr: "Platform bir hata döndürdü. Biraz sonra yeniden denenecek.",
    en: "The platform returned an error. It will be retried later.",
  },
  not_ready: {
    tr: "Bu bağlantı henüz hazır değil (yakında).",
    en: "This connection is not ready yet (coming soon).",
  },
  network: {
    tr: "Siteye bağlanılamadı. Adresi kontrol edin; biraz sonra yeniden denenecek.",
    en: "Could not reach the site. Check the address; it will be retried later.",
  },
};

export const UNSUPPORTED = [
  {
    id: "ikas", name: "ikas",
    reason_tr: "ikas Admin API'de blog uç noktası ya da izni yok (canlı şema incelendi).",
    reason_en: "The ikas Admin API has no blog endpoint or scope (live schema checked).",
  },
  {
    id: "ticimax", name: "Ticimax",
    reason_tr: "Ticimax SOAP servislerinde blog işlemi yok.",
    reason_en: "Ticimax SOAP services have no blog operation.",
  },
];

const RETRYABLE = new Set(["rate", "server", "timeout", "network"]);
const fail = (error, extra) => ({ ok: false, error, retry: RETRYABLE.has(error), ...(extra || {}) });
const pfail = error => ({ ok: false, error });

function statusErr(s) {
  if (s === 401) return "auth";
  if (s === 402) return "plan";
  if (s === 403) return "forbidden";
  if (s === 404 || s === 410) return "not_found";
  if (s === 429) return "rate";
  if (s === 400 || s === 409 || s === 413 || s === 415 || s === 422) return "bad_input";
  return "server";
}

function note(io, p, step, code, status) {
  try { io?.log?.(JSON.stringify({ ev: "cms", p, step, code, status: status ?? null })); } catch { /* log hatası akışı bozmaz */ }
}

// ---------------------------------------------------------------- küçük yardımcılar
const str = (v, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : v == null ? "" : String(v).trim().slice(0, max));
const isObj = v => v != null && typeof v === "object" && !Array.isArray(v);

function b64Bytes(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
// UTF-8 güvenli base64 (btoa tek başına Türkçe karakterde hata verir).
export const utf8B64 = s => b64Bytes(enc.encode(String(s)));
const b64u = u8 => b64Bytes(u8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uJson = o => b64u(enc.encode(JSON.stringify(o)));

const TR_MAP = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c" };
export function slugify(s, max = 80) {
  const t = String(s ?? "").replace(/[ıİşŞğĞüÜöÖçÇ]/g, c => TR_MAP[c]).normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return t.slice(0, max).replace(/-+$/g, "") || "yazi";
}

const formBody = o => Object.entries(o).filter(([, v]) => v != null && v !== "").map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
const plainText = s => String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const cap = (s, n) => { const t = String(s ?? ""); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t; };
const isPexels = u => typeof u === "string" && /^https:\/\/images\.pexels\.com\//.test(u);

// ---------------------------------------------------------------- SSRF: URL denetimi
const BLOCKED_SUFFIX = [".local", ".internal", ".lan", ".home", ".arpa", ".localhost", ".localdomain", ".intranet", ".corp", ".home.arpa"];

export function safeUrl(raw) {
  if (typeof raw !== "string") return { ok: false, error: "bad_input" };
  let s = raw.trim();
  if (!s || s.length > 2048 || /[\s\u0000-\u001f\\]/.test(s)) return { ok: false, error: "bad_input" };
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s.replace(/^\/+/, "");
  let u;
  try { u = new URL(s); } catch { return { ok: false, error: "bad_input" }; }
  if (u.protocol !== "https:") return { ok: false, error: u.protocol === "http:" ? "ssrf" : "bad_input" };
  if (u.username || u.password) return { ok: false, error: "ssrf" };
  if (u.port && u.port !== "443") return { ok: false, error: "ssrf" };
  const h = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!h || h.startsWith("[") || h.includes(":")) return { ok: false, error: "ssrf" }; // IPv6 literal
  if (/^[0-9.]+$/.test(h) || /^0x[0-9a-f]+$/i.test(h)) return { ok: false, error: "ssrf" }; // IPv4 (her biçim burada noktalı)
  const labels = h.split(".");
  if (labels.length < 2 || labels.some(l => !l)) return { ok: false, error: "ssrf" }; // tek etiketli ad
  if (!/^[a-z0-9.-]+$/.test(h) || labels.some(l => l.length > 63 || l.startsWith("-") || l.endsWith("-"))) return { ok: false, error: "bad_input" };
  if (/^\d+$/.test(labels[labels.length - 1]) || /^0x[0-9a-f]*$/i.test(labels[labels.length - 1])) return { ok: false, error: "ssrf" };
  if (h === "localhost" || BLOCKED_SUFFIX.some(x => h.endsWith(x))) return { ok: false, error: "ssrf" };
  u.hash = "";
  return { ok: true, url: u.href };
}

function hopUrl(raw, allowHosts) {
  if (!allowHosts) { const r = safeUrl(raw); return r.ok ? new URL(r.url) : null; }
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return null;
  const h = u.hostname.toLowerCase();
  const ok = typeof allowHosts === "function" ? allowHosts(h) : allowHosts.includes(h);
  return ok ? u : null;
}

async function readCapped(res, max) {
  const len = Number(res.headers.get("content-length"));
  if (Number.isFinite(len) && len > max) { try { await res.body?.cancel(); } catch { /* */ } return null; }
  if (!res.body) return new Uint8Array(0);
  const rd = res.body.getReader();
  const parts = [];
  let n = 0;
  for (;;) {
    const { done, value } = await rd.read();
    if (done) break;
    n += value.byteLength;
    if (n > max) { try { await rd.cancel(); } catch { /* */ } return null; }
    parts.push(value);
  }
  if (parts.length === 1) return parts[0];
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.byteLength; }
  return out;
}

// Taşıma katmanı: { ok:true, status, headers, url, bytes, text, data } | { ok:false, error:"ssrf"|"timeout"|"network"|"server" }.
// ok:true yalnız "yanıt geldi" demek; HTTP durumunu çağıran yorumlar. Yönlendirmeler elle izlenir (en çok 3) ve her Location
// yeniden denetlenir. sameHostAuth (varsayılan) açıkken ilk host'tan farklı host'a kimlik başlıkları gitmez.
export async function guardedFetch(io, url, init = {}, opts = {}) {
  const { timeoutMs = PROBE_MS, maxBytes = MAX_JSON, allowHosts = null, sameHostAuth = true, as = "json" } = opts;
  const f = io?.fetch || ((...a) => fetch(...a));
  let cur = hopUrl(String(url), allowHosts);
  if (!cur) return { ok: false, error: "ssrf" };
  const firstHost = cur.host;
  let method = (init.method || "GET").toUpperCase();
  let body = init.body;
  const headers = new Headers(init.headers || {});
  if (!headers.has("user-agent")) headers.set("user-agent", UA);
  const signal = typeof AbortSignal?.timeout === "function" ? AbortSignal.timeout(timeoutMs) : undefined;
  try {
    for (let hop = 0; ; hop++) {
      if (sameHostAuth && cur.host !== firstHost) for (const k of SECRET_HEADERS) headers.delete(k);
      const res = await f(cur.href, { method, headers, body, redirect: "manual", signal });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        try { await res.body?.cancel(); } catch { /* */ }
        if (hop >= 3) return { ok: false, error: "server" };
        let next;
        try { next = new URL(res.headers.get("location"), cur); } catch { return { ok: false, error: "server" }; }
        const nu = hopUrl(next.href, allowHosts);
        if (!nu) return { ok: false, error: "ssrf" };
        if (res.status === 303 || ((res.status === 301 || res.status === 302) && method !== "GET" && method !== "HEAD")) {
          method = "GET"; body = undefined; headers.delete("content-type");
        }
        cur = nu;
        continue;
      }
      const bytes = method === "HEAD" ? new Uint8Array(0) : await readCapped(res, maxBytes);
      if (!bytes) return { ok: false, error: "server" };
      const out = { ok: true, status: res.status, headers: res.headers, url: cur.href, bytes, text: "", data: null };
      if (as !== "bytes") {
        out.text = dec.decode(bytes);
        const t = out.text.trimStart();
        if (t.startsWith("{") || t.startsWith("[")) { try { out.data = JSON.parse(out.text); } catch { out.data = null; } }
      }
      return out;
    }
  } catch (e) {
    const n = e?.name || "";
    return { ok: false, error: n === "TimeoutError" || n === "AbortError" ? "timeout" : "network" };
  }
}

const jsonInit = (method, headers, body) => ({ method, headers: { "content-type": "application/json", accept: "application/json", ...headers }, body: body == null ? undefined : JSON.stringify(body) });

// ---------------------------------------------------------------- Markdown → blok/satır içi ağaç
// Desteklenen: başlık (#), paragraf, - * + ve 1. listeler (düz), > alıntı, ``` kod, ---, **kalın**, *italik*/_italik_, `kod`,
// [metin](http(s)://...). Ham HTML desteklenmez; her metin kaçışlanır.
export function mdBlocks(md) {
  const L = String(md ?? "").replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let para = [], list = null, quote = null;
  const flushP = () => { if (para.length) { out.push({ t: "p", text: para.join(" ") }); para = []; } };
  const flushL = () => { if (list) { out.push(list); list = null; } };
  const flushQ = () => { if (quote) { out.push({ t: "quote", text: quote.join(" ") }); quote = null; } };
  const flush = () => { flushP(); flushL(); flushQ(); };
  for (let i = 0; i < L.length; i++) {
    const line = L[i];
    let m;
    if ((m = /^\s{0,3}(`{3,}|~{3,})/.exec(line))) {
      flush();
      const fence = m[1], code = [];
      for (i++; i < L.length && !L[i].trim().startsWith(fence); i++) code.push(L[i]);
      out.push({ t: "code", text: code.join("\n") });
      continue;
    }
    if (!line.trim()) { flush(); continue; }
    if ((m = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line))) { flush(); out.push({ t: "h", level: m[1].length, text: m[2] }); continue; }
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); out.push({ t: "hr" }); continue; }
    if ((m = /^\s{0,3}>\s?(.*)$/.exec(line))) { flushP(); flushL(); (quote ||= []).push(m[1]); continue; }
    const ul = /^\s*[-*+]\s+(.*)$/.exec(line), ol = ul ? null : /^\s*\d{1,9}[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushP(); flushQ();
      const t = ul ? "ul" : "ol";
      if (list && list.t !== t) flushL();
      (list ||= { t, items: [] }).items.push((ul || ol)[1]);
      continue;
    }
    if (list && /^\s+\S/.test(line)) { list.items[list.items.length - 1] += " " + line.trim(); continue; }
    flushL(); flushQ();
    para.push(line.trim());
  }
  flush();
  return out;
}

function safeHref(raw) {
  const s = String(raw || "").trim();
  if (!/^https?:\/\//i.test(s)) return null;
  try { const u = new URL(s); return u.protocol === "http:" || u.protocol === "https:" ? u.href : null; } catch { return null; }
}

// Satır içi: [{ text, bold?, italic?, code?, link? }]
export function mdSpans(s) {
  const out = [];
  const push = (text, f) => { if (text) out.push({ text, ...f }); };
  const re = /\[([^\]\n]{1,300})\]\(\s*<?([^\s()<>]{1,2000})>?(?:\s+"[^"\n]*")?\s*\)/g;
  let i = 0, m;
  const src = String(s ?? "");
  while ((m = re.exec(src))) {
    emph(src.slice(i, m.index), {}, push);
    const href = safeHref(m[2]);
    emph(m[1], href ? { link: href } : {}, push);
    i = re.lastIndex;
  }
  emph(src.slice(i), {}, push);
  return out;
}

function emph(s, base, push) {
  const re = /`([^`\n]+)`|(\*\*|__)(?=\S)([\s\S]+?)(?<=\S)\2|(\*|_)(?=\S)([\s\S]+?)(?<=\S)\4/g;
  let i = 0, m;
  while ((m = re.exec(s))) {
    if (m[4] === "_" && /\w/.test(s[m.index - 1] || "")) continue; // snake_case içindeki alt çizgi italik değil
    push(s.slice(i, m.index), base);
    if (m[1] != null) push(m[1], { ...base, code: true });
    else if (m[2]) emph(m[3], { ...base, bold: true }, push);
    else emph(m[5], { ...base, italic: true }, push);
    i = re.lastIndex;
  }
  push(s.slice(i), base);
}

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ESC[c]);

function spansHtml(spans, code = true) {
  let out = "";
  for (let i = 0; i < spans.length;) {
    const link = spans[i].link;
    let inner = "";
    for (; i < spans.length && spans[i].link === link; i++) {
      const sp = spans[i];
      let h = escHtml(sp.text);
      if (sp.code) h = code ? `<code>${h}</code>` : h;
      if (sp.italic) h = `<em>${h}</em>`;
      if (sp.bold) h = `<strong>${h}</strong>`;
      inner += h;
    }
    out += link ? `<a href="${escHtml(link)}">${inner}</a>` : inner;
  }
  return out;
}

// opts.code === false: Webflow için <pre>/<code> üretme (Webflow RichText kod bloğunu boş metne çeviriyor).
export function mdToHtml(md, opts = {}) {
  const code = opts.code !== false;
  const inl = t => spansHtml(mdSpans(t), code);
  return mdBlocks(md).map(b => {
    if (b.t === "h") return `<h${b.level}>${inl(b.text)}</h${b.level}>`;
    if (b.t === "p") return `<p>${inl(b.text)}</p>`;
    if (b.t === "quote") return `<blockquote><p>${inl(b.text)}</p></blockquote>`;
    if (b.t === "hr") return "<hr>";
    if (b.t === "code") return code ? `<pre><code>${escHtml(b.text)}</code></pre>` : b.text.split("\n").filter(x => x.trim()).map(x => `<p>${escHtml(x)}</p>`).join("");
    return `<${b.t}>${b.items.map(it => `<li>${inl(it)}</li>`).join("")}</${b.t}>`;
  }).join("\n");
}

const postHtml = post => (post?.markdown ? mdToHtml(post.markdown) : String(post?.html || ""));
const webflowHtml = post => (post?.markdown ? mdToHtml(post.markdown, { code: false })
  : String(post?.html || "").replace(/<pre\b[^>]*>/gi, "<p>").replace(/<\/pre>/gi, "</p>").replace(/<\/?code\b[^>]*>/gi, ""));

// ---------------------------------------------------------------- Markdown → Wix Ricos
// TEXT düğümü asla en üst düzeyde değil: PARAGRAPH/HEADING içinde; liste: LIST → LIST_ITEM → PARAGRAPH → TEXT.
// DOĞRULANMALI: dekorasyon biçimleri (BOLD fontWeightValue, ITALIC italicData, LINK linkData.link) ve bulletedListData/
// orderedListData anahtarları Wix Ricos şema belgesinden doğrulanmadı; araştırma yalnız PARAGRAPH/TEXT örneğini doğruladı.
// Kod bloğu ve alıntı güvenli tarafta kalmak için düz PARAGRAPH (alıntı italik) olarak yazılır; --- atlanır.
export function mdToRicos(md) {
  let n = 0;
  const id = () => `n${++n}`;
  const texts = (t, extra) => mdSpans(t).map(sp => {
    const d = [];
    if (sp.bold) d.push({ type: "BOLD", fontWeightValue: 700 });
    if (sp.italic || extra?.italic) d.push({ type: "ITALIC", italicData: true });
    if (sp.link) d.push({ type: "LINK", linkData: { link: { url: sp.link, target: "BLANK", rel: { noreferrer: true } } } });
    return { type: "TEXT", id: "", nodes: [], textData: { text: sp.text, decorations: d } };
  });
  const para = (t, extra) => ({ type: "PARAGRAPH", id: id(), nodes: texts(t, extra), paragraphData: {} });
  const nodes = [];
  for (const b of mdBlocks(md)) {
    if (b.t === "h") nodes.push({ type: "HEADING", id: id(), nodes: texts(b.text), headingData: { level: Math.min(6, Math.max(1, b.level)) } });
    else if (b.t === "p") nodes.push(para(b.text));
    else if (b.t === "quote") nodes.push(para(b.text, { italic: true }));
    else if (b.t === "code") for (const ln of b.text.split("\n")) { if (ln.trim()) nodes.push({ type: "PARAGRAPH", id: id(), nodes: [{ type: "TEXT", id: "", nodes: [], textData: { text: ln, decorations: [] } }], paragraphData: {} }); }
    else if (b.t === "ul" || b.t === "ol") {
      const items = b.items.map(it => ({ type: "LIST_ITEM", id: id(), nodes: [para(it)] }));
      nodes.push(b.t === "ul"
        ? { type: "BULLETED_LIST", id: id(), nodes: items, bulletedListData: { indentation: 0 } }
        : { type: "ORDERED_LIST", id: id(), nodes: items, orderedListData: { indentation: 0 } });
    }
  }
  return { nodes };
}

// ---------------------------------------------------------------- ortak: görsel baytı (yalnız Pexels)
async function pexelsBytes(io, url, max) {
  if (!isPexels(url)) return null;
  const r = await guardedFetch(io, url, { method: "GET", headers: { accept: "image/*" } }, { timeoutMs: PUSH_MS, maxBytes: max, allowHosts: PEXELS, as: "bytes" });
  if (!r.ok || r.status !== 200) return null;
  const ct = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[ct];
  if (!ext || !r.bytes.length) return null;
  return { bytes: r.bytes, ct, ext };
}

const opt = (label_tr, label_en, required, items) => ({ label_tr, label_en, required, items });
const field = (key, type, required, label_tr, label_en, help_tr, help_en, extra) => ({ key, label_tr, label_en, type, required, help_tr, help_en, ...(extra || {}) });

// ================================================================= WordPress (kendi sunucusu)
function wpUrl(root, route, query) {
  const u = new URL(root);
  if (u.searchParams.has("rest_route")) {
    u.searchParams.set("rest_route", "/" + route.replace(/^\/+/, ""));
  } else {
    if (!u.pathname.endsWith("/")) u.pathname += "/";
    u.pathname += route.replace(/^\/+/, "");
  }
  for (const [k, v] of Object.entries(query || {})) u.searchParams.set(k, v);
  return u.href;
}

function linkRoot(link) {
  if (!link) return null;
  for (const part of link.split(",")) {
    const m = /<([^>]+)>\s*;\s*rel="?https:\/\/api\.w\.org\/"?/i.exec(part);
    if (m) return m[1].trim();
  }
  return null;
}

const wpAuth = (user, pass) => "Basic " + utf8B64(`${user}:${pass}`);

const wordpress = {
  id: "wordpress", name: "WordPress", auth: "key",
  notes_tr: "WordPress 5.6+ ve Application Passwords gerekir. Yazar ya da Editör rolünde ayrı bir kullanıcı önerilir. Sunucu Authorization başlığını siliyorsa hata mesajındaki .htaccess satırını ekleyin.",
  notes_en: "Requires WordPress 5.6+ with Application Passwords. A dedicated Author or Editor user is recommended. If your server strips the Authorization header, add the .htaccess line from the error message.",
  fields: [
    field("site_url", "url", true, "Site adresi", "Site address",
      "Blogunuzun adresi, https:// ile (örn. https://ornek.com).", "Your blog's address with https:// (e.g. https://example.com).", { placeholder: "https://ornek.com" }),
    field("username", "text", true, "Kullanıcı adı", "Username",
      "WordPress giriş kullanıcı adınız (Yazar ya da Editör rolünde ayrı bir kullanıcı önerilir).", "Your WordPress login username (a dedicated Author or Editor user is recommended)."),
    field("app_password", "secret", true, "Uygulama şifresi", "Application Password",
      "WordPress yönetim paneli > Kullanıcılar > Profil > Uygulama Şifreleri > ad verin > Yeni Uygulama Şifresi Ekle. Boşluklu haliyle yapıştırabilirsiniz.",
      "WordPress admin > Users > Profile > Application Passwords > enter a name > Add New Application Password. You can paste it with the spaces.",
      { placeholder: "xxxx xxxx xxxx xxxx xxxx xxxx" }),
  ],

  async probe(inputs, io) {
    const s = safeUrl(inputs?.site_url);
    if (!s.ok) return pfail(s.error);
    const user = str(inputs?.username, 200), pass = String(inputs?.app_password ?? "").replace(/\s+/g, "");
    if (!user || !pass || pass.length > 200) return pfail("bad_input");
    const site = new URL(s.url);
    site.search = ""; site.pathname = site.pathname.replace(/\/+$/, "") + "/";
    const T = { timeoutMs: PROBE_MS };
    // 1) Kök keşfi: Link rel="https://api.w.org/" (HEAD). Kök, yönlendirme sonrası site host'unda olmalı.
    let root = null, finalHost = site.host;
    const head = await guardedFetch(io, site.href, { method: "HEAD" }, T);
    if (head.ok) {
      finalHost = new URL(head.url).host;
      const lr = linkRoot(head.headers.get("link"));
      const ls = lr ? safeUrl(lr) : null;
      if (ls?.ok && new URL(ls.url).host === finalHost) root = ls.url;
    } else if (head.error === "ssrf") return pfail("ssrf");
    const base = `https://${finalHost}${site.pathname}`;
    // 2) Kimliksiz index; /wp-json 404 ise ?rest_route=/
    const tryIndex = async r => ({ r, x: await guardedFetch(io, r, { method: "GET", headers: { accept: "application/json" } }, T) });
    let idx = root ? await tryIndex(root) : await tryIndex(base + "wp-json/");
    if (idx.x.ok && (idx.x.status === 404 || !isObj(idx.x.data))) idx = await tryIndex(base + "?rest_route=/");
    if (!idx.x.ok) { note(io, "wordpress", "index", idx.x.error); return pfail(idx.x.error); }
    if (idx.x.status === 401 || idx.x.status === 403) return pfail("no_api");
    if (idx.x.status !== 200 || !isObj(idx.x.data)) return pfail(idx.x.status === 404 ? "no_api" : statusErr(idx.x.status));
    root = idx.r;
    const index = idx.x.data;
    if (Array.isArray(index.namespaces) && !index.namespaces.includes("wp/v2")) return pfail("no_api");
    const appPw = isObj(index.authentication) && index.authentication["application-passwords"] != null;
    if (!appPw) return pfail("no_api");
    if (new URL(root).host !== finalHost) return pfail("ssrf");
    // 3) Kimlikli: users/me?context=edit
    const auth = wpAuth(user, pass);
    const me = await guardedFetch(io, wpUrl(root, "wp/v2/users/me", { context: "edit" }), { method: "GET", headers: { authorization: auth, accept: "application/json" } }, T);
    if (!me.ok) return pfail(me.error);
    if (me.status === 401) {
      const code = me.data?.code;
      note(io, "wordpress", "me", code === "rest_not_logged_in" ? "header_stripped" : "auth", 401);
      return pfail(code === "rest_not_logged_in" ? "header_stripped" : "auth");
    }
    if (me.status !== 200 || !isObj(me.data)) return pfail(statusErr(me.status));
    const caps = isObj(me.data.capabilities) ? me.data.capabilities : {};
    if (!caps.edit_posts) return pfail("forbidden");
    // 4) İsteğe bağlı kategori listesi (hata olursa boş geçer)
    const items = [];
    const cats = await guardedFetch(io, wpUrl(root, "wp/v2/categories", { per_page: "100", _fields: "id,name" }), { method: "GET", headers: { authorization: auth, accept: "application/json" } }, T);
    if (cats.ok && cats.status === 200 && Array.isArray(cats.data)) for (const c of cats.data.slice(0, 100)) if (c?.id != null) items.push({ id: String(c.id), label: str(c.name, 120) || String(c.id) });
    return {
      ok: true,
      account: { name: str(index.name, 200) || finalHost, url: str(index.home || index.url, 500) || base },
      options: { category: opt("Kategori", "Category", false, items) },
      config: { site_url: base, api_root: root, username: user, can_publish: Boolean(caps.publish_posts), can_upload: Boolean(caps.upload_files) },
      creds: { app_password: pass },
    };
  },

  async push(post, { config, creds, mode }, io) {
    const rs = safeUrl(config?.api_root);
    if (!rs.ok || !config?.username || !creds?.app_password) return fail("bad_input");
    const root = rs.url, T = { timeoutMs: PUSH_MS };
    const auth = wpAuth(config.username, creds.app_password);
    let media = null;
    if (post.cover?.url && config.can_upload !== false) {
      const img = await pexelsBytes(io, post.cover.url, MAX_IMG);
      if (img) {
        const up = await guardedFetch(io, wpUrl(root, "wp/v2/media"), {
          method: "POST", body: img.bytes,
          headers: { authorization: auth, "content-type": img.ct, "content-disposition": `attachment; filename="cover.${img.ext}"`, accept: "application/json" },
        }, T);
        if (up.ok && (up.status === 201 || up.status === 200) && up.data?.id != null) {
          media = up.data.id;
          if (post.cover.alt) await guardedFetch(io, wpUrl(root, `wp/v2/media/${encodeURIComponent(media)}`), jsonInit("POST", { authorization: auth }, { alt_text: str(post.cover.alt, 300) }), T);
        } else note(io, "wordpress", "media", up.ok ? statusErr(up.status) : up.error, up.status);
      }
    }
    const body = { title: str(post.title, 300), content: postHtml(post), status: mode === "publish" ? "publish" : "draft", excerpt: str(post.excerpt, 1000), slug: slugify(post.slug || post.title, 190) };
    if (media != null) body.featured_media = media;
    if (config.category) body.categories = [Number(config.category)].filter(Number.isFinite);
    const r = await guardedFetch(io, wpUrl(root, "wp/v2/posts"), jsonInit("POST", { authorization: auth }, body), T);
    if (!r.ok) { note(io, "wordpress", "create", r.error); return r.error === "timeout" ? fail("unknown_result", { retry: false }) : fail(r.error); }
    if ((r.status === 201 || r.status === 200) && r.data?.id != null) return { ok: true, remote_id: String(r.data.id), url: str(r.data.link, 1000) || null };
    const code = r.status === 401 && r.data?.code === "rest_not_logged_in" ? "header_stripped" : statusErr(r.status);
    note(io, "wordpress", "create", code, r.status);
    return fail(code);
  },
};

// ================================================================= Ghost (Admin API)
const GHOST_KEY = /^([0-9a-f]{8,64}):([0-9a-f]{32,128})$/i;
function hexBytes(h) {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

// Her istek için yeni JWT: header {alg,typ,kid}, payload {iat,exp=iat+300,aud:"/admin/"}, HS256, secret hex→bayt.
export async function ghostJwt(key, nowMs) {
  const m = GHOST_KEY.exec(String(key || ""));
  if (!m || m[2].length % 2) return null;
  const k = await crypto.subtle.importKey("raw", hexBytes(m[2]), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const iat = Math.floor(nowMs / 1000);
  const data = `${b64uJson({ alg: "HS256", typ: "JWT", kid: m[1] })}.${b64uJson({ iat, exp: iat + 300, aud: "/admin/" })}`;
  return `${data}.${b64u(new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data))))}`;
}

function ghostBase(raw) {
  const s = safeUrl(raw);
  if (!s.ok) return s;
  const u = new URL(s.url);
  const p = u.pathname.replace(/\/ghost(\/.*)?$/i, "").replace(/\/+$/, "");
  return { ok: true, url: `${u.origin}${p}` };
}

// Ghost(Pro) Starter'da Admin API yok; 402/403 burada "plan" sayılır. DOĞRULANMALI: Starter'ın tam yanıt kodu belgede yok.
const ghostErr = s => (s === 401 ? "auth" : s === 402 || s === 403 ? "plan" : statusErr(s));

const ghost = {
  id: "ghost", name: "Ghost", auth: "key",
  notes_tr: "Ghost(Pro) Starter planında Admin API yoktur; Publisher ve üstü ya da kendi sunucunuz gerekir. E-posta bülteni asla gönderilmez.",
  notes_en: "Ghost(Pro) Starter has no Admin API; Publisher or higher, or self-hosted, is required. Newsletters are never sent.",
  fields: [
    field("admin_url", "url", true, "Admin API adresi", "Admin API URL",
      "Ghost yönetimi > Ayarlar > Integrations > Add custom integration > ad verin; açılan sayfadaki API URL.",
      "Ghost admin > Settings > Integrations > Add custom integration > name it; the API URL on that page.", { placeholder: "https://blog.ornek.com" }),
    field("admin_key", "secret", true, "Admin API anahtarı", "Admin API key",
      "Aynı özel entegrasyon sayfasındaki Admin API key (id:secret biçiminde).",
      "The Admin API key on the same custom integration page (id:secret format)."),
  ],

  async probe(inputs, io) {
    const b = ghostBase(inputs?.admin_url);
    if (!b.ok) return pfail(b.error);
    const key = str(inputs?.admin_key, 300);
    if (!GHOST_KEY.test(key)) return pfail("bad_input");
    const T = { timeoutMs: PROBE_MS };
    const site = await guardedFetch(io, `${b.url}/ghost/api/admin/site/`, { method: "GET", headers: { accept: "application/json", "accept-version": "v6.0" } }, T);
    if (!site.ok) return pfail(site.error);
    if (site.status !== 200 || !isObj(site.data?.site)) return pfail(site.status === 404 ? "not_found" : ghostErr(site.status));
    const major = parseInt(String(site.data.site.version || "6"), 10);
    if (Number.isFinite(major) && major < 5) return pfail("no_api");
    const ver = Number.isFinite(major) && major >= 6 ? "v6.0" : "v5.0";
    const jwt = await ghostJwt(key, io.now());
    const r = await guardedFetch(io, `${b.url}/ghost/api/admin/posts/?limit=1&fields=id,title`, { method: "GET", headers: { authorization: `Ghost ${jwt}`, accept: "application/json", "accept-version": ver } }, T);
    if (!r.ok) return pfail(r.error);
    if (r.status !== 200) { note(io, "ghost", "probe", ghostErr(r.status), r.status); return pfail(ghostErr(r.status)); }
    return {
      ok: true,
      account: { name: str(site.data.site.title, 200) || new URL(b.url).host, url: str(site.data.site.url, 500) || b.url },
      options: {},
      config: { admin_url: b.url, accept_version: ver },
      creds: { admin_key: key },
    };
  },

  async push(post, { config, creds, mode }, io) {
    const b = ghostBase(config?.admin_url);
    if (!b.ok || !GHOST_KEY.test(String(creds?.admin_key || ""))) return fail("bad_input");
    const jwt = await ghostJwt(creds.admin_key, io.now());
    const p = { title: str(post.title, 255), html: postHtml(post), status: mode === "publish" ? "published" : "draft" };
    // DOĞRULANMALI: create belgesi istemci slug'ını açıkça yazmıyor; Ghost kabul etmezse başlıktan üretir.
    if (post.slug) p.slug = slugify(post.slug, 190);
    if (post.excerpt) p.custom_excerpt = cap(plainText(post.excerpt), 300);
    if (post.cover?.url && safeHref(post.cover.url)) { p.feature_image = post.cover.url; if (post.cover.alt) p.feature_image_alt = str(post.cover.alt, 191); }
    if (Array.isArray(post.tags) && post.tags.length) p.tags = post.tags.slice(0, 10).map(t => str(t, 120)).filter(Boolean);
    // newsletter parametresi YOK: yalnız ?source=html.
    const r = await guardedFetch(io, `${b.url}/ghost/api/admin/posts/?source=html`,
      jsonInit("POST", { authorization: `Ghost ${jwt}`, "accept-version": config.accept_version === "v5.0" ? "v5.0" : "v6.0" }, { posts: [p] }), { timeoutMs: PUSH_MS });
    if (!r.ok) { note(io, "ghost", "create", r.error); return r.error === "timeout" ? fail("unknown_result", { retry: false }) : fail(r.error); }
    const made = r.data?.posts?.[0];
    if ((r.status === 201 || r.status === 200) && made?.id) return { ok: true, remote_id: String(made.id), url: str(made.url, 1000) || null };
    note(io, "ghost", "create", ghostErr(r.status), r.status);
    return fail(ghostErr(r.status));
  },
};

// ================================================================= Webflow (Data API v2)
const WF = "https://api.webflow.com/v2";
const WF_HOSTS = ["api.webflow.com"];
const wfHeaders = t => ({ authorization: `Bearer ${t}`, accept: "application/json" });
const WF_FIELD = { RichText: "body_field", PlainText: "summary_field", Image: "image_field", DateTime: "date_field" };

const webflow = {
  id: "webflow", name: "Webflow", auth: "key",
  notes_tr: "Sitenizde CMS (ya da üstü) planı olmalı. Yazılar seçtiğiniz koleksiyona eklenir; yayında yalnız o yazı yayınlanır, sitenin tamamı asla yayınlanmaz.",
  notes_en: "Your site needs a CMS (or higher) plan. Posts are added to the collection you choose; publishing publishes only that item, never the whole site.",
  fields: [
    field("api_token", "secret", true, "Site API token", "Site API token",
      "Webflow > site ayarları (dişli) > Apps & integrations > en altta API access > Generate API token. İzinler: CMS okuma+yazma, Sites okuma.",
      "Webflow > Site settings (gear) > Apps & integrations > API access at the bottom > Generate API token. Scopes: CMS read+write, Sites read."),
  ],

  async probe(inputs, io) {
    const tok = str(inputs?.api_token, 500);
    if (!tok || /\s/.test(tok)) return pfail("bad_input");
    const T = { timeoutMs: PROBE_MS, allowHosts: WF_HOSTS };
    const get = path => guardedFetch(io, WF + path, { method: "GET", headers: wfHeaders(tok) }, T);
    const intro = await get("/token/introspect");
    if (!intro.ok) return pfail(intro.error);
    if (intro.status !== 200) { note(io, "webflow", "introspect", statusErr(intro.status), intro.status); return pfail(statusErr(intro.status)); }
    const a = intro.data?.authorization || {};
    const scope = String(a.scope || "").split(/[,\s]+/);
    if (!scope.includes("cms:write") && !scope.includes("cms:read")) return pfail("forbidden");
    if (!scope.includes("cms:write")) return pfail("forbidden");
    const siteId = (a.authorizedTo?.siteIds || [])[0];
    if (!siteId || !/^[A-Za-z0-9]{1,64}$/.test(siteId)) return pfail("forbidden");
    let name = siteId, url = null;
    const site = await get(`/sites/${siteId}`);
    if (site.ok && site.status === 200 && isObj(site.data)) {
      name = str(site.data.displayName || site.data.shortName, 200) || siteId;
      const dom = (site.data.customDomains || []).map(d => d?.url).find(Boolean);
      url = dom ? (/^https?:\/\//.test(dom) ? dom : `https://${dom}`) : site.data.shortName ? `https://${site.data.shortName}.webflow.io` : null;
    }
    const cl = await get(`/sites/${siteId}/collections`);
    if (!cl.ok) return pfail(cl.error);
    if (cl.status !== 200) return pfail(cl.status === 402 ? "plan" : statusErr(cl.status));
    const cols = (cl.data?.collections || []).filter(c => c?.id && /^[A-Za-z0-9]{1,64}$/.test(c.id)).slice(0, 10);
    const o = {
      collection: opt("Koleksiyon", "Collection", true, []),
      body_field: opt("İçerik alanı (Rich text)", "Body field (Rich text)", true, []),
      summary_field: opt("Özet alanı", "Summary field", false, []),
      image_field: opt("Kapak görseli alanı", "Cover image field", false, []),
      date_field: opt("Tarih alanı", "Date field", false, []),
    };
    const slugs = {};
    for (const c of cols) {
      const d = await get(`/collections/${c.id}`);
      if (!d.ok || d.status !== 200) continue;
      const fields = Array.isArray(d.data?.fields) ? d.data.fields : [];
      if (!fields.some(f => f?.type === "RichText" && f.slug)) continue;
      o.collection.items.push({ id: c.id, label: str(c.displayName || c.slug, 120) || c.id });
      slugs[c.id] = str(c.slug || d.data.slug, 100);
      for (const f of fields) {
        const k = WF_FIELD[f?.type];
        if (k && f.slug && /^[a-z0-9-_]{1,100}$/i.test(f.slug)) o[k].items.push({ id: f.slug, label: `${str(f.displayName, 100) || f.slug} (${f.slug})`, parent: c.id });
      }
    }
    // RichText alanı olan koleksiyon yoksa yazının gövdesi eşlenemez.
    if (!o.collection.items.length) return pfail("not_found");
    return { ok: true, account: { name, url }, options: o, config: { site_id: siteId, site_url: url, collection_slugs: slugs }, creds: { api_token: tok } };
  },

  async push(post, { config, creds, mode }, io) {
    const cid = config?.collection, body = config?.body_field;
    if (!cid || !/^[A-Za-z0-9]{1,64}$/.test(cid) || !body || !creds?.api_token) return fail("bad_input");
    const T = { timeoutMs: PUSH_MS, allowHosts: WF_HOSTS };
    const slug = slugify(post.slug || post.title, 100);
    const fd = { name: str(post.title, 256), slug, [body]: webflowHtml(post) };
    if (config.summary_field && post.excerpt) fd[config.summary_field] = cap(plainText(post.excerpt), 500);
    if (config.image_field && post.cover?.url && safeHref(post.cover.url)) fd[config.image_field] = { url: post.cover.url, alt: str(post.cover.alt, 200) };
    if (config.date_field) fd[config.date_field] = new Date(io.now()).toISOString();
    const r = await guardedFetch(io, `${WF}/collections/${cid}/items/insert?skipInvalidFiles=true`,
      jsonInit("POST", wfHeaders(creds.api_token), { items: [{ isDraft: mode !== "publish", isArchived: false, fieldData: fd }] }), T);
    if (!r.ok) { note(io, "webflow", "create", r.error); return r.error === "timeout" ? fail("unknown_result", { retry: false }) : fail(r.error); }
    if (r.status !== 200 && r.status !== 201 && r.status !== 202) { note(io, "webflow", "create", statusErr(r.status), r.status); return fail(r.status === 402 ? "plan" : statusErr(r.status)); }
    const id = r.data?.items?.[0]?.id || r.data?.id;
    if (!id) return fail("unknown_result", { retry: false });
    const colSlug = config.collection_slugs?.[cid];
    // DOĞRULANMALI: koleksiyon şablon yolu sitede değiştirilebilir; varsayılan /{koleksiyon-slug}/{item-slug}.
    const url = mode === "publish" && config.site_url && colSlug ? `${String(config.site_url).replace(/\/+$/, "")}/${colSlug}/${slug}` : null;
    if (mode !== "publish") return { ok: true, remote_id: String(id), url: null };
    // Yalnız bu item yayınlanır (asla /sites/{id}/publish).
    const p = await guardedFetch(io, `${WF}/collections/${cid}/items/publish`, jsonInit("POST", wfHeaders(creds.api_token), { itemIds: [id] }), T);
    const errs = p.ok ? p.data?.errors : null;
    if (!p.ok || p.status < 200 || p.status > 299 || (Array.isArray(errs) && errs.length)) {
      // Item taslak olarak oluştu; yeniden push çift item yaratır → unknown_result, kullanıcı sitede kontrol eder.
      note(io, "webflow", "publish", p.ok ? statusErr(p.status) : p.error, p.status);
      return fail("unknown_result", { retry: false, remote_id: String(id) });
    }
    return { ok: true, remote_id: String(id), url };
  },
};

// ================================================================= Shopify (Admin GraphQL 2026-10)
const SHOP_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
const SHOP_API = "2026-10";
function shopHost(raw) {
  let s = str(raw, 200).toLowerCase().replace(/^https?:\/\//, "").replace(/[/?#].*$/, "");
  if (s && !s.includes(".")) s += ".myshopify.com";
  return SHOP_RE.test(s) && s.length <= 120 ? s : null;
}

async function shopMint(io, shop, clientId, secret, timeoutMs) {
  const r = await guardedFetch(io, `https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: formBody({ grant_type: "client_credentials", client_id: clientId, client_secret: secret }), // scope YOK
  }, { timeoutMs, allowHosts: [shop] });
  if (!r.ok) return { error: r.error };
  if (r.status !== 200 || typeof r.data?.access_token !== "string") return { error: r.status === 400 || r.status === 401 || r.status === 403 ? "auth" : statusErr(r.status) };
  const ttl = Number(r.data.expires_in);
  return { token: r.data.access_token, exp: io.now() + (Number.isFinite(ttl) && ttl > 0 ? ttl : 86399) * 1000, scope: String(r.data.scope || "") };
}

const shopGql = (io, shop, token, query, variables, timeoutMs) => guardedFetch(io, `https://${shop}/admin/api/${SHOP_API}/graphql.json`,
  jsonInit("POST", { "x-shopify-access-token": token }, { query, variables }), { timeoutMs, allowHosts: [shop] });

function gqlErr(r) {
  const errs = r.data?.errors;
  if (!Array.isArray(errs) || !errs.length) return null;
  const codes = errs.map(e => e?.extensions?.code);
  if (codes.includes("THROTTLED")) return "rate";
  if (codes.includes("ACCESS_DENIED")) return "forbidden";
  return "bad_input";
}

const SHOP_PROBE = "{ shop { name primaryDomain { url } } blogs(first: 20) { nodes { id title handle } } }";
const SHOP_CREATE = "mutation CreateArticle($article: ArticleCreateInput!) { articleCreate(article: $article) { article { id handle blog { handle } } userErrors { code field message } } }";

const shopify = {
  id: "shopify", name: "Shopify", auth: "key",
  notes_tr: "1 Ocak 2026'dan sonra açılan mağazalarda uygulama Dev Dashboard'da oluşturulur (Client ID + secret). Daha eski özel uygulaması olanlar Admin API token'ını kullanabilir.",
  notes_en: "Stores since 1 Jan 2026 create the app in the Dev Dashboard (Client ID + secret). Stores with an older custom app can use its Admin API token.",
  fields: [
    field("shop", "text", true, "Mağaza alan adı", "Store domain",
      "magazaniz.myshopify.com biçimindeki adres (Shopify yönetimi > Ayarlar > Alan adları'nda görünür).",
      "The magazaniz.myshopify.com address (shown in Shopify admin > Settings > Domains).", { placeholder: "magaza.myshopify.com" }),
    field("auth_mode", "select", true, "Bağlantı türü", "Connection type",
      "Yeni mağazalar: Dev Dashboard uygulaması. 2026 öncesi özel uygulaması olanlar: Admin API token.",
      "New stores: Dev Dashboard app. Stores with a custom app created before 2026: Admin API token.",
      { options: [{ id: "dev", label_tr: "Dev Dashboard (Client ID + secret)", label_en: "Dev Dashboard (Client ID + secret)" }, { id: "legacy", label_tr: "Eski özel uygulama token'ı", label_en: "Legacy custom app token" }] }),
    field("client_id", "text", false, "Client ID", "Client ID",
      "Ayarlar > Uygulamalar > Uygulama geliştir > Build apps in Dev Dashboard > Create app > izin: write_content > Install > uygulama Settings'ten Client ID.",
      "Settings > Apps > Develop apps > Build apps in Dev Dashboard > Create app > scope: write_content > Install > copy the Client ID from the app's Settings."),
    field("client_secret", "secret", false, "Client secret", "Client secret",
      "Aynı Dev Dashboard uygulamasının Settings sayfasındaki Client secret.", "The Client secret on the same Dev Dashboard app's Settings page."),
    field("access_token", "secret", false, "Admin API token (eski)", "Admin API token (legacy)",
      "Ayarlar > Uygulamalar ve satış kanalları > Uygulama geliştir > uygulama > API kimlik bilgileri > Admin API access token (shpat_ ile başlar).",
      "Settings > Apps and sales channels > Develop apps > your app > API credentials > Admin API access token (starts with shpat_).", { placeholder: "shpat_…" }),
    field("author_name", "text", true, "Yazar adı", "Author name",
      "Yazılarda görünecek yazar adı (Shopify makalelerinde zorunlu).", "Author name shown on articles (required by Shopify)."),
  ],

  async probe(inputs, io) {
    const shop = shopHost(inputs?.shop);
    const mode = inputs?.auth_mode === "legacy" ? "legacy" : "dev";
    const author = str(inputs?.author_name, 100);
    if (!shop || !author) return pfail("bad_input");
    let token, creds, config = { shop, mode, author_name: author };
    if (mode === "dev") {
      const id = str(inputs?.client_id, 200), sec = str(inputs?.client_secret, 300);
      if (!id || !sec) return pfail("bad_input");
      const m = await shopMint(io, shop, id, sec, PROBE_MS);
      if (m.error) { note(io, "shopify", "mint", m.error); return pfail(m.error); }
      token = m.token;
      config.client_id = id;
      creds = { client_secret: sec, access_token: m.token, token_exp: m.exp };
      if (m.scope && !/\bwrite_(content|online_store_pages)\b/.test(m.scope)) return pfail("forbidden");
    } else {
      token = str(inputs?.access_token, 300);
      if (!token || /\s/.test(token)) return pfail("bad_input");
      creds = { access_token: token };
    }
    const r = await shopGql(io, shop, token, SHOP_PROBE, {}, PROBE_MS);
    if (!r.ok) return pfail(r.error);
    if (r.status !== 200) { note(io, "shopify", "probe", statusErr(r.status), r.status); return pfail(statusErr(r.status)); }
    const ge = gqlErr(r);
    if (ge) return pfail(ge);
    const blogs = (r.data?.data?.blogs?.nodes || []).filter(b => typeof b?.id === "string" && b.id.startsWith("gid://shopify/Blog/"));
    if (!blogs.length) return pfail("not_found");
    const handles = {};
    for (const b of blogs) handles[b.id] = str(b.handle, 100);
    const dom = r.data.data.shop?.primaryDomain?.url;
    config = { ...config, store_url: safeHref(dom) || `https://${shop}`, blog_handles: handles };
    return {
      ok: true,
      account: { name: str(r.data.data.shop?.name, 200) || shop, url: config.store_url },
      options: { blog: opt("Blog", "Blog", true, blogs.map(b => ({ id: b.id, label: str(b.title, 120) || b.handle }))) },
      config, creds,
    };
  },

  async push(post, { config, creds, mode }, io) {
    const shop = shopHost(config?.shop);
    if (!shop || !config?.blog || !String(config.blog).startsWith("gid://shopify/Blog/")) return fail("bad_input");
    const dev = config.mode !== "legacy";
    let token = creds?.access_token, fresh = null, minted = false;
    const mint = async () => {
      if (!config.client_id || !creds?.client_secret) return { error: "auth" };
      const m = await shopMint(io, shop, config.client_id, creds.client_secret, PUSH_MS);
      if (m.error) return m;
      token = m.token; minted = true;
      fresh = { ...creds, access_token: m.token, token_exp: m.exp };
      return m;
    };
    const withCreds = r => (fresh ? { ...r, creds: fresh } : r);
    if (dev && (!token || !Number(creds?.token_exp) || Number(creds.token_exp) - io.now() < 5 * 60_000)) {
      const m = await mint();
      if (m.error) { note(io, "shopify", "mint", m.error); return fail(m.error); }
    }
    if (!token) return fail("auth");
    const article = { blogId: config.blog, title: str(post.title, 255), author: { name: str(config.author_name, 100) || "Editor" }, body: postHtml(post), handle: slugify(post.slug || post.title, 100), isPublished: mode === "publish" };
    if (post.excerpt) article.summary = `<p>${escHtml(cap(plainText(post.excerpt), 500))}</p>`;
    if (Array.isArray(post.tags) && post.tags.length) article.tags = post.tags.slice(0, 20).map(t => str(t, 100)).filter(Boolean);
    if (post.cover?.url && safeHref(post.cover.url)) article.image = { url: post.cover.url, altText: str(post.cover.alt, 200) };
    let r = await shopGql(io, shop, token, SHOP_CREATE, { article }, PUSH_MS);
    // 401: token düşmüş; bir kez yeni token üret ve tekrar dene (401'de create çalışmamıştır).
    if (r.ok && r.status === 401 && dev && !minted) {
      const m = await mint();
      if (m.error) return withCreds(fail(m.error));
      r = await shopGql(io, shop, token, SHOP_CREATE, { article }, PUSH_MS);
    }
    if (!r.ok) { note(io, "shopify", "create", r.error); return withCreds(r.error === "timeout" ? fail("unknown_result", { retry: false }) : fail(r.error)); }
    if (r.status !== 200) { note(io, "shopify", "create", statusErr(r.status), r.status); return withCreds(fail(statusErr(r.status))); }
    const ge = gqlErr(r);
    if (ge) return withCreds(fail(ge));
    const res = r.data?.data?.articleCreate;
    if (Array.isArray(res?.userErrors) && res.userErrors.length) { note(io, "shopify", "create", "bad_input", 200); return withCreds(fail("bad_input")); }
    const a = res?.article;
    if (!a?.id) return withCreds(fail("unknown_result", { retry: false }));
    const bh = a.blog?.handle || config.blog_handles?.[config.blog];
    const base = safeHref(config.store_url) ? String(config.store_url).replace(/\/+$/, "") : `https://${shop}`;
    return withCreds({ ok: true, remote_id: a.id, url: mode === "publish" && bh && a.handle ? `${base}/blogs/${bh}/${a.handle}` : null });
  },
};

// ================================================================= HubSpot (CMS Blog Posts 2026-09)
const HS = "https://api.hubapi.com";
const HS_HOSTS = ["api.hubapi.com"];
const hsErr = r => (r.status === 403 ? (r.data?.category === "MISSING_SCOPES" ? "forbidden" : "plan") : statusErr(r.status));

const hubspot = {
  id: "hubspot", name: "HubSpot", auth: "key",
  notes_tr: "HubSpot Content Hub (blog) gerekir. Yayın için slug, yazar ve meta açıklama dolu gönderilir.",
  notes_en: "Requires HubSpot Content Hub (blog). For publishing, slug, author and meta description are sent.",
  fields: [
    field("api_key", "secret", true, "Service key", "Service key",
      "HubSpot > Development > Keys > Service keys > Create; kapsam: content. (Eski private app token'ı da olur.)",
      "HubSpot > Development > Keys > Service keys > Create; scope: content. (A legacy private app token also works.)"),
  ],

  async probe(inputs, io) {
    const key = str(inputs?.api_key, 500);
    if (!key || /\s/.test(key)) return pfail("bad_input");
    const T = { timeoutMs: PROBE_MS, allowHosts: HS_HOSTS };
    const h = { authorization: `Bearer ${key}`, accept: "application/json" };
    const s = await guardedFetch(io, `${HS}/cms/blog-settings/2026-09/settings`, { method: "GET", headers: h }, T);
    if (!s.ok) return pfail(s.error);
    if (s.status !== 200) { note(io, "hubspot", "settings", hsErr(s), s.status); return pfail(hsErr(s)); }
    // DOĞRULANMALI: liste yanıtı { results:[...] } varsayıldı (HubSpot liste düzeni); dizi dönerse o da kabul.
    const blogs = (Array.isArray(s.data) ? s.data : s.data?.results || []).filter(b => b?.id != null);
    if (!blogs.length) return pfail("not_found");
    const au = await guardedFetch(io, `${HS}/cms/blogs/2026-09/authors?limit=100`, { method: "GET", headers: h }, T);
    if (!au.ok) return pfail(au.error);
    if (au.status !== 200) return pfail(hsErr(au));
    const authors = (Array.isArray(au.data) ? au.data : au.data?.results || []).filter(a => a?.id != null);
    const paths = {};
    for (const b of blogs) { try { paths[b.id] = new URL(b.absoluteUrl).pathname.replace(/^\/+|\/+$/g, ""); } catch { paths[b.id] = ""; } }
    return {
      ok: true,
      account: { name: str(blogs[0].name, 200) || "HubSpot", url: safeHref(blogs[0].absoluteUrl) },
      options: {
        blog: opt("Blog", "Blog", true, blogs.map(b => ({ id: String(b.id), label: str(b.name || b.absoluteUrl, 120) || String(b.id) }))),
        author: opt("Yazar", "Author", true, authors.map(a => ({ id: String(a.id), label: str(a.displayName || a.fullName || a.name || a.email, 120) || String(a.id) }))),
      },
      config: { blog_paths: paths },
      creds: { api_key: key },
    };
  },

  async push(post, { config, creds, mode }, io) {
    if (!config?.blog || !config?.author || !creds?.api_key) return fail("bad_input");
    const prefix = config.blog_paths?.[config.blog] || "";
    const s = slugify(post.slug || post.title, 100);
    const meta = cap(plainText(post.excerpt || post.title), 155);
    const body = {
      name: str(post.title, 255), contentGroupId: String(config.blog),
      // DOĞRULANMALI: slug alan adına eklenir; blog yolu (örn. "blog/") önek olarak gönderiliyor.
      slug: prefix ? `${prefix}/${s}` : s,
      blogAuthorId: String(config.author), metaDescription: meta, postBody: postHtml(post), postSummary: post.excerpt ? `<p>${escHtml(cap(plainText(post.excerpt), 500))}</p>` : "",
      useFeaturedImage: Boolean(post.cover?.url && safeHref(post.cover.url)),
    };
    if (body.useFeaturedImage) { body.featuredImage = post.cover.url; body.featuredImageAltText = str(post.cover.alt, 200); } // DOĞRULANMALI: dış URL kabulü
    if (post.lang === "tr" || post.lang === "en") body.language = post.lang;
    if (mode === "publish") body.state = "PUBLISHED"; // taslakta state yok (varsayılan taslak)
    const r = await guardedFetch(io, `${HS}/cms/blogs/2026-09/posts`, jsonInit("POST", { authorization: `Bearer ${creds.api_key}` }, body), { timeoutMs: PUSH_MS, allowHosts: HS_HOSTS });
    if (!r.ok) { note(io, "hubspot", "create", r.error); return r.error === "timeout" ? fail("unknown_result", { retry: false }) : fail(r.error); }
    if ((r.status === 201 || r.status === 200) && r.data?.id != null) return { ok: true, remote_id: String(r.data.id), url: safeHref(r.data.url) };
    note(io, "hubspot", "create", hsErr(r), r.status);
    return fail(hsErr(r));
  },
};

// ================================================================= Wix (Blog v3)
const WIX = "https://www.wixapis.com";
const WIX_HOSTS = ["www.wixapis.com"];
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const wixHeaders = (key, site) => ({ authorization: key, "wix-site-id": site, accept: "application/json" }); // Bearer YOK

const wix = {
  id: "wix", name: "Wix", auth: "key",
  notes_tr: "Sitede Wix Blog uygulaması kurulu olmalı. Anahtarı yalnız site sahibi ya da ortak sahip oluşturabilir; yalnız bu siteyi kapsayan bir anahtar önerilir.",
  notes_en: "The Wix Blog app must be installed. Only the site owner or a co-owner can create the key; a key limited to this site is recommended.",
  fields: [
    field("api_key", "secret", true, "API anahtarı", "API key",
      "manage.wix.com/account/api-keys > Generate API Key > site erişimine bu siteyi ekleyin; izinler: Wix Blog (yönetme), Members (okuma), Media Manager (yönetme).",
      "manage.wix.com/account/api-keys > Generate API Key > include this site in site access; permissions: Wix Blog (manage), Members (read), Media Manager (manage)."),
    field("site_id", "text", true, "Site ID", "Site ID",
      "Wix panelini açın; adres çubuğunda /dashboard/ sonrasındaki uzun kimlik (manage.wix.com/dashboard/<SITE_ID>/home).",
      "Open your Wix dashboard; the long ID after /dashboard/ in the address bar (manage.wix.com/dashboard/<SITE_ID>/home).", { placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }),
  ],

  async probe(inputs, io) {
    const key = str(inputs?.api_key, 2000), site = str(inputs?.site_id, 64);
    if (!key || /\s/.test(key) || !GUID.test(site)) return pfail("bad_input");
    const T = { timeoutMs: PROBE_MS, allowHosts: WIX_HOSTS };
    const h = wixHeaders(key, site);
    const c = await guardedFetch(io, `${WIX}/blog/v3/categories?paging.limit=100`, { method: "GET", headers: h }, T);
    if (!c.ok) return pfail(c.error);
    if (c.status !== 200) { const e = c.status === 404 ? "no_api" : statusErr(c.status); note(io, "wix", "categories", e, c.status); return pfail(e); }
    const m = await guardedFetch(io, `${WIX}/members/v1/members?paging.limit=50&fieldsets=PUBLIC`, { method: "GET", headers: h }, T);
    if (!m.ok) return pfail(m.error);
    if (m.status !== 200) return pfail(statusErr(m.status));
    const members = (m.data?.members || []).filter(x => typeof x?.id === "string" && GUID.test(x.id));
    // Yazar (memberId) zorunlu: sitede üye yoksa yazı sahibi atanamaz.
    if (!members.length) return pfail("not_found");
    const cats = (c.data?.categories || []).filter(x => typeof x?.id === "string");
    return {
      ok: true,
      account: { name: `Wix ${site.slice(0, 8)}`, url: null },
      options: {
        author: opt("Yazar (site üyesi)", "Author (site member)", true, members.map(x => ({ id: x.id, label: str(x.profile?.nickname || x.profile?.slug, 120) || x.id }))),
        category: opt("Kategori", "Category", false, cats.map(x => ({ id: x.id, label: str(x.label || x.title, 120) || x.id }))),
      },
      config: { site_id: site },
      creds: { api_key: key },
    };
  },

  async push(post, { config, creds, mode }, io) {
    const site = config?.site_id;
    if (!GUID.test(String(site || "")) || !GUID.test(String(config?.author || "")) || !creds?.api_key) return fail("bad_input");
    const h = wixHeaders(creds.api_key, site);
    let media = null;
    if (post.cover?.url && safeHref(post.cover.url)) {
      const im = await guardedFetch(io, `${WIX}/site-media/v1/files/import`, jsonInit("POST", h, { url: post.cover.url, mediaType: "IMAGE", displayName: "cover.jpg" }), { timeoutMs: PUSH_MS, allowHosts: WIX_HOSTS });
      if (im.ok && im.status === 200 && typeof im.data?.file?.id === "string") media = im.data.file.id.replace(/^wix:image:\/\/v1\//, "");
      else note(io, "wix", "import", im.ok ? statusErr(im.status) : im.error, im.status);
    }
    const dp = {
      title: str(post.title, 200), memberId: config.author,
      richContent: post.markdown ? mdToRicos(post.markdown) : mdToRicos(plainText(post.html)),
      seoSlug: slugify(post.slug || post.title, 100),
    };
    if (post.excerpt) dp.excerpt = cap(plainText(post.excerpt), 500);
    if (config.category) dp.categoryIds = [String(config.category)];
    if (post.lang === "tr" || post.lang === "en") dp.language = post.lang;
    if (media) dp.media = { wixMedia: { image: { id: media } }, displayed: true, custom: true };
    const r = await guardedFetch(io, `${WIX}/blog/v3/draft-posts`, jsonInit("POST", h, { draftPost: dp, publish: mode === "publish", fieldsets: ["URL"] }), { timeoutMs: WIX_CREATE_MS, allowHosts: WIX_HOSTS });
    if (!r.ok) { note(io, "wix", "create", r.error); return r.error === "timeout" ? fail("unknown_result", { retry: false }) : fail(r.error); }
    const d = r.data?.draftPost;
    if (r.status === 200 && d?.id) {
      // DOĞRULANMALI: URL fieldset'inin biçimi ({base,path} ya da düz metin) belgeden doğrulanmadı.
      const u = typeof d.url === "string" ? d.url : d.url?.base && d.url?.path ? `${String(d.url.base).replace(/\/+$/, "")}${d.url.path}` : null;
      return { ok: true, remote_id: String(d.id), url: mode === "publish" ? safeHref(u) : null };
    }
    note(io, "wix", "create", statusErr(r.status), r.status);
    return fail(statusErr(r.status));
  },
};

// ================================================================= GitHub (statik site deposu)
const GH = "https://api.github.com";
const GH_HOSTS = ["api.github.com"];
const ghHeaders = t => ({ authorization: `Bearer ${t}`, accept: "application/vnd.github+json", "x-github-api-version": "2026-03-10", "user-agent": UA });
const SSG = ["jekyll", "hugo", "astro", "eleventy", "other"];
const GH_TEMPLATES = {
  jekyll: "_posts/{yyyy}-{mm}-{dd}-{slug}.md",
  hugo: "content/posts/{slug}.md",
  astro: "src/content/blog/{slug}.md",
  eleventy: "posts/{slug}.md",
  other: "posts/{yyyy}-{mm}-{dd}-{slug}.md",
};
const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const BRANCH_RE = /^(?!.*\.\.)(?!\/)(?!.*\/$)[A-Za-z0-9._\/-]{1,200}$/;
const encPath = p => p.split("/").map(encodeURIComponent).join("/");

function ghTemplate(t, ssg) {
  const s = str(t, 200) || GH_TEMPLATES[ssg] || GH_TEMPLATES.other;
  if (!s.includes("{slug}") || s.startsWith("/") || s.includes("..") || s.includes("//") || !/^[A-Za-z0-9._\/{}-]+$/.test(s)) return null;
  return s;
}

// Europe/Istanbul sabit UTC+3 (2016'dan beri yaz saati yok).
function ymd(ms) {
  const d = new Date(ms + 3 * 3600_000);
  return { yyyy: String(d.getUTCFullYear()), mm: String(d.getUTCMonth() + 1).padStart(2, "0"), dd: String(d.getUTCDate()).padStart(2, "0") };
}

const yq = s => JSON.stringify(String(s ?? "")); // JSON çift tırnaklı metin geçerli YAML'dır
export function frontMatter(ssg, post, nowMs, draftFlag) {
  const iso = new Date(nowMs).toISOString();
  const L = [`title: ${yq(post.title)}`];
  if (ssg === "jekyll") L.unshift("layout: post");
  L.push(ssg === "astro" ? `pubDate: ${yq(iso)}` : `date: ${yq(iso)}`);
  if (post.excerpt) L.push(`description: ${yq(plainText(post.excerpt).slice(0, 300))}`);
  if (Array.isArray(post.tags) && post.tags.length) L.push(`tags: [${post.tags.slice(0, 20).map(yq).join(", ")}]`);
  if (post.cover?.url && safeHref(post.cover.url)) {
    L.push(`image: ${yq(post.cover.url)}`);
    if (post.cover.alt) L.push(`image_alt: ${yq(post.cover.alt)}`);
  }
  if (post.lang) L.push(`lang: ${yq(post.lang)}`);
  if (draftFlag != null && ssg !== "jekyll") L.push(`draft: ${draftFlag ? "true" : "false"}`);
  return `---\n${L.join("\n")}\n---\n\n`;
}

const github = {
  id: "github", name: "GitHub (statik site)", auth: "key",
  notes_tr: "Taslak modunda yeni bir dal + Pull Request açılır (birleştirince yayına girer); yayın modunda doğrudan seçilen dala commit edilir.",
  notes_en: "Draft mode opens a new branch + Pull Request (goes live when merged); publish mode commits straight to the chosen branch.",
  fields: [
    field("owner", "text", true, "Sahip (kullanıcı/kuruluş)", "Owner (user/org)", "github.com/<sahip>/<depo> adresindeki sahip adı.", "The owner in github.com/<owner>/<repo>."),
    field("repo", "text", true, "Depo", "Repository", "github.com/<sahip>/<depo> adresindeki depo adı.", "The repository in github.com/<owner>/<repo>."),
    field("token", "secret", true, "Fine-grained token", "Fine-grained token",
      "GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate; yalnız bu depo; izinler: Contents okuma/yazma, Metadata okuma, Pull requests okuma/yazma.",
      "GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate; only this repo; permissions: Contents read/write, Metadata read, Pull requests read/write."),
    field("branch", "text", false, "Dal", "Branch", "Sitenin yayınlandığı dal; boş bırakılırsa deponun varsayılan dalı.", "The branch your site builds from; empty = the repo's default branch.", { placeholder: "main" }),
    field("ssg", "select", true, "Site üreteci", "Site generator", "Ön bilgi (front matter) biçimi buna göre yazılır.", "Front matter is written for this generator.",
      { options: SSG.map(id => ({ id, label_tr: id === "other" ? "Diğer" : id[0].toUpperCase() + id.slice(1), label_en: id === "other" ? "Other" : id[0].toUpperCase() + id.slice(1) })) }),
    field("path_template", "text", false, "Dosya yolu şablonu", "File path template",
      "Kullanılabilir: {yyyy} {mm} {dd} {slug}. Boşsa üretecin varsayılanı (örn. Jekyll: _posts/{yyyy}-{mm}-{dd}-{slug}.md).",
      "Available: {yyyy} {mm} {dd} {slug}. Empty = the generator's default (e.g. Jekyll: _posts/{yyyy}-{mm}-{dd}-{slug}.md).", { placeholder: "_posts/{yyyy}-{mm}-{dd}-{slug}.md" }),
  ],

  async probe(inputs, io) {
    const owner = str(inputs?.owner, 39), repo = str(inputs?.repo, 100).replace(/\.git$/, ""), token = str(inputs?.token, 300);
    const ssg = SSG.includes(inputs?.ssg) ? inputs.ssg : "other";
    const branch = str(inputs?.branch, 200);
    if (!OWNER_RE.test(owner) || !REPO_RE.test(repo) || repo === "." || repo === ".." || !token || /\s/.test(token)) return pfail("bad_input");
    if (branch && !BRANCH_RE.test(branch)) return pfail("bad_input");
    const tpl = ghTemplate(inputs?.path_template, ssg);
    if (!tpl) return pfail("bad_input");
    const r = await guardedFetch(io, `${GH}/repos/${owner}/${repo}`, { method: "GET", headers: ghHeaders(token) }, { timeoutMs: PROBE_MS, allowHosts: GH_HOSTS });
    if (!r.ok) return pfail(r.error);
    if (r.status !== 200) { const e = r.status === 403 && r.headers.get("x-ratelimit-remaining") === "0" ? "rate" : statusErr(r.status); note(io, "github", "repo", e, r.status); return pfail(e); }
    if (!r.data?.permissions?.push) return pfail("forbidden");
    return {
      ok: true,
      account: { name: str(r.data.full_name, 200) || `${owner}/${repo}`, url: safeHref(r.data.html_url) },
      options: {},
      config: { owner, repo, branch: branch || str(r.data.default_branch, 200) || "main", ssg, path_template: tpl },
      creds: { token },
    };
  },

  async push(post, { config, creds, mode }, io) {
    const { owner, repo, branch } = config || {};
    const ssg = SSG.includes(config?.ssg) ? config.ssg : "other";
    const tpl = ghTemplate(config?.path_template, ssg);
    if (!OWNER_RE.test(String(owner)) || !REPO_RE.test(String(repo)) || !BRANCH_RE.test(String(branch)) || !tpl || !creds?.token) return fail("bad_input");
    const now = io.now();
    const slug = slugify(post.slug || post.title, 80);
    const d = ymd(now);
    const path = tpl.replace(/\{yyyy\}/g, d.yyyy).replace(/\{mm\}/g, d.mm).replace(/\{dd\}/g, d.dd).replace(/\{slug\}/g, slug);
    const pr = mode !== "publish";
    const md = String(post.markdown || plainText(post.html));
    const content = utf8B64(frontMatter(ssg, post, now, pr ? null : false) + md + (md.endsWith("\n") ? "" : "\n"));
    const H = ghHeaders(creds.token), T = { timeoutMs: PUSH_MS, allowHosts: GH_HOSTS };
    const R = `${GH}/repos/${owner}/${repo}`;
    const bad = (step, r) => { const e = r.ok ? statusErr(r.status) : r.error; note(io, "github", step, e, r.status); return fail(e); };
    const unk = (step, r) => (r.ok ? bad(step, r) : r.error === "timeout" ? fail("unknown_result", { retry: false }) : bad(step, r));
    const msg = `${pr ? "Taslak" : "Yazı"}: ${str(post.title, 120)}`;
    if (!pr) {
      const c = await guardedFetch(io, `${R}/contents/${encPath(path)}`, jsonInit("PUT", H, { message: msg, content, branch }), T);
      if (c.ok && (c.status === 201 || c.status === 200)) return { ok: true, remote_id: path, url: safeHref(c.data?.content?.html_url) };
      return unk("put", c);
    }
    // PR modu: 1) taban SHA 2) yeni dal 3) dosya 4) taslak PR (yoksa normal PR)
    const ref = await guardedFetch(io, `${R}/git/ref/heads/${encPath(branch)}`, { method: "GET", headers: H }, T);
    if (!ref.ok || ref.status !== 200 || !ref.data?.object?.sha) return bad("ref", ref);
    let head = `smc/${slug}`;
    let mk = await guardedFetch(io, `${R}/git/refs`, jsonInit("POST", H, { ref: `refs/heads/${head}`, sha: ref.data.object.sha }), T);
    if (mk.ok && mk.status === 422) {
      head = `smc/${slug}-${now.toString(36)}`;
      mk = await guardedFetch(io, `${R}/git/refs`, jsonInit("POST", H, { ref: `refs/heads/${head}`, sha: ref.data.object.sha }), T);
    }
    if (!mk.ok || mk.status !== 201) return bad("branch", mk);
    const put = await guardedFetch(io, `${R}/contents/${encPath(path)}`, jsonInit("PUT", H, { message: msg, content, branch: head }), T);
    if (!put.ok || (put.status !== 201 && put.status !== 200)) return bad("put", put);
    const prBody = { title: str(post.title, 250), head, base: branch, body: "Social Media Corner tarafından hazırlanan yazı taslağı. Birleştirince yayına girer.", draft: true };
    let p = await guardedFetch(io, `${R}/pulls`, jsonInit("POST", H, prBody), T);
    // Taslak PR ücretsiz plandaki özel depolarda yok (422) → normal PR.
    if (p.ok && p.status === 422) p = await guardedFetch(io, `${R}/pulls`, jsonInit("POST", H, { ...prBody, draft: false }), T);
    if (p.ok && p.status === 201 && p.data?.number != null) return { ok: true, remote_id: String(p.data.number), url: safeHref(p.data.html_url) };
    return unk("pull", p);
  },
};

// ================================================================= IdeaSoft (OAuth authorization_code; müşterinin kendi API istemcisi)
function ideaStore(raw) {
  const s = safeUrl(str(raw, 300));
  return s.ok ? new URL(s.url).host : null;
}

async function ideaToken(io, store, params, timeoutMs) {
  const r = await guardedFetch(io, `https://${store}/oauth/v2/token`, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: formBody(params),
  }, { timeoutMs });
  if (!r.ok) return { error: r.error };
  if (r.status !== 200 || typeof r.data?.access_token !== "string") return { error: r.status === 400 || r.status === 401 ? "auth" : statusErr(r.status) };
  const ttl = Number(r.data.expires_in);
  return { access_token: r.data.access_token, refresh_token: typeof r.data.refresh_token === "string" ? r.data.refresh_token : null, token_exp: io.now() + (Number.isFinite(ttl) && ttl > 0 ? ttl : 3600) * 1000 };
}

const ideasoft = {
  id: "ideasoft", name: "IdeaSoft", auth: "oauth",
  notes_tr: "API istemcisini yalnız ID'si 1 olan yönetici oluşturabilir. Yönlendirme adresine bizim callback adresimizi girin; İzin Yönetimi'nde İçerik/Blog okuma-yazma verin.",
  notes_en: "Only the admin with ID 1 can create the API client. Enter our callback as the redirect URL; grant Content/Blog read-write under Permission Management.",
  fields: [
    field("store", "url", true, "Mağaza adresi", "Store address", "Mağazanızın alan adı (örn. https://magaza.com).", "Your store's domain (e.g. https://store.com).", { placeholder: "https://magaza.com" }),
    field("client_id", "text", true, "Client ID", "Client ID",
      "IdeaSoft paneli > Entegrasyonlar > API > API Ekle; yönlendirme adresine bizim callback'i girin; İzin Yönetimi'nde İçerik/Blog okuma+yazma; kaydedince Client ID.",
      "IdeaSoft panel > Integrations > API > Add API; enter our callback as the redirect URL; grant Content/Blog read+write under Permission Management; then copy the Client ID."),
    field("client_secret", "secret", true, "Client secret", "Client secret", "Aynı API kaydındaki Client Secret.", "The Client Secret on the same API entry."),
  ],
  oauth: {
    authorizeUrl(inputs, { redirectUri, state, clientId } = {}) {
      const store = ideaStore(inputs?.store);
      const cid = str(clientId || inputs?.client_id, 200);
      if (!store || !cid || !redirectUri || !state) return null;
      const q = new URLSearchParams({ client_id: cid, response_type: "code", state, redirect_uri: redirectUri });
      return `https://${store}/panel/auth?${q}`;
    },
    // Kod ~30 sn geçerli: callback'te hemen takas edilir.
    async exchange(code, inputs, creds, { redirectUri } = {}, io) {
      const store = ideaStore(inputs?.store);
      const cid = str(creds?.client_id || inputs?.client_id, 200), sec = str(creds?.client_secret || inputs?.client_secret, 300);
      if (!store || !cid || !sec || !code || !redirectUri) return { ok: false, error: "bad_input" };
      const t = await ideaToken(io, store, { grant_type: "authorization_code", client_id: cid, client_secret: sec, code: String(code), redirect_uri: redirectUri }, PROBE_MS);
      if (t.error) { note(io, "ideasoft", "exchange", t.error); return { ok: false, error: t.error }; }
      return { ok: true, creds: { client_secret: sec, ...t }, config: { store, client_id: cid } };
    },
  },

  // inputs: { store, client_id, client_secret, access_token, refresh_token?, token_exp? } (exchange sonrası çekirdek birleştirir)
  async probe(inputs, io) {
    const store = ideaStore(inputs?.store);
    const cid = str(inputs?.client_id, 200);
    let creds = { client_secret: str(inputs?.client_secret, 300), access_token: str(inputs?.access_token, 2000), refresh_token: inputs?.refresh_token ? str(inputs.refresh_token, 2000) : null, token_exp: Number(inputs?.token_exp) || null };
    if (!store || !cid || !creds.access_token) return pfail("bad_input");
    const T = { timeoutMs: PROBE_MS };
    const get = path => guardedFetch(io, `https://${store}${path}`, { method: "GET", headers: { authorization: `Bearer ${creds.access_token}`, accept: "application/json" } }, T);
    const b = await get("/admin-api/blogs?limit=1");
    if (!b.ok) return pfail(b.error);
    if (b.status !== 200) { note(io, "ideasoft", "blogs", statusErr(b.status), b.status); return pfail(statusErr(b.status)); }
    const c = await get("/admin-api/blog_categories?limit=100");
    if (!c.ok) return pfail(c.error);
    if (c.status !== 200) return pfail(statusErr(c.status));
    const cats = (Array.isArray(c.data) ? c.data : c.data?.data || []).filter(x => x?.id != null);
    // Kategori create'te zorunlu: yoksa önce panelde bir blog kategorisi açılmalı.
    if (!cats.length) return pfail("not_found");
    const titles = {};
    for (const x of cats) titles[String(x.id)] = str(x.title || x.name, 120);
    return {
      ok: true,
      account: { name: store, url: `https://${store}` },
      options: { category: opt("Blog kategorisi", "Blog category", true, cats.map(x => ({ id: String(x.id), label: titles[String(x.id)] || String(x.id) }))) },
      config: { store, client_id: cid, category_titles: titles },
      creds,
    };
  },

  async push(post, { config, creds, mode }, io) {
    const store = ideaStore(config?.store);
    if (!store || !config?.category || !creds?.access_token) return fail("bad_input");
    let tok = creds.access_token, fresh = null, refreshed = false;
    const withCreds = r => (fresh ? { ...r, creds: fresh } : r);
    // Refresh token her kullanımda değişir → yeni creds her sonuçta döner (başarısızda da).
    const refresh = async () => {
      if (!creds.refresh_token || !config.client_id || !creds.client_secret) return { error: "auth" };
      const t = await ideaToken(io, store, { grant_type: "refresh_token", client_id: config.client_id, client_secret: creds.client_secret, refresh_token: (fresh || creds).refresh_token }, PUSH_MS);
      if (t.error) return t;
      fresh = { ...creds, ...t, refresh_token: t.refresh_token || (fresh || creds).refresh_token };
      tok = t.access_token; refreshed = true;
      return t;
    };
    if (Number(creds.token_exp) && Number(creds.token_exp) - io.now() < 5 * 60_000) {
      const t = await refresh();
      if (t.error) { note(io, "ideasoft", "refresh", t.error); return withCreds(fail(t.error)); }
    }
    const content = postHtml(post);
    if (content.length > 65535) return withCreds(fail("bad_input"));
    const body = {
      title: str(post.title, 255), slug: slugify(post.slug || post.title, 200), excerpt: cap(plainText(post.excerpt || post.title), 500), content,
      pageTitle: str(post.title, 255), metaDescription: cap(plainText(post.excerpt || post.title), 160),
      blockVisibility: 1, status: mode === "publish" ? 1 : 0,
      categories: [{ id: Number(config.category) || config.category, title: config.category_titles?.[String(config.category)] || "" }],
    };
    // DOĞRULANMALI: blog kapağı yalnız base64 data URI "attachment" alanıyla (ürün görsellerindeki gibi); blog için canlı denenmedi.
    if (post.cover?.url) {
      const img = await pexelsBytes(io, post.cover.url, MAX_IDEASOFT_IMG);
      if (img && img.ext !== "webp") { body.attachment = `data:${img.ct};base64,${b64Bytes(img.bytes)}`; body.imageFileName = `kapak.${img.ext}`; body.imageExtension = img.ext; }
    }
    const create = () => guardedFetch(io, `https://${store}/admin-api/blogs`, jsonInit("POST", { authorization: `Bearer ${tok}` }, body), { timeoutMs: PUSH_MS });
    let r = await create();
    if (r.ok && r.status === 401 && !refreshed) {
      const t = await refresh();
      if (t.error) { note(io, "ideasoft", "refresh", t.error); return withCreds(fail(t.error)); }
      r = await create();
    }
    if (!r.ok) { note(io, "ideasoft", "create", r.error); return withCreds(r.error === "timeout" ? fail("unknown_result", { retry: false }) : fail(r.error)); }
    if ((r.status === 201 || r.status === 200) && r.data?.id != null) {
      // DOĞRULANMALI: IdeaSoft yanıtında herkese açık yazı adresi yok; vitrin yolu belgelenmemiş, bu yüzden url null.
      return withCreds({ ok: true, remote_id: String(r.data.id), url: null });
    }
    note(io, "ideasoft", "create", statusErr(r.status), r.status);
    return withCreds(fail(statusErr(r.status)));
  },
};

// ================================================================= WordPress.com (OAuth2; bizim uygulama kaydımız)
// DOĞRULANMALI: araştırma WordPress.com uçlarını ayrıntılı doğrulamadı. Kullanılanlar (WP.com geliştirici belgesindeki bilinen uçlar):
//   yetki: https://public-api.wordpress.com/oauth2/authorize  · token: https://public-api.wordpress.com/oauth2/token
//   (token yanıtında blog_id/blog_url varsayıldı) · site: GET /rest/v1.1/sites/{id} · yazı: POST /rest/v1.1/sites/{id}/posts/new
const WPC = "https://public-api.wordpress.com";
const WPC_HOSTS = ["public-api.wordpress.com"];
const SITE_ID_RE = /^[0-9]{1,20}$/;

const wpcom = {
  id: "wpcom", name: "WordPress.com", auth: "oauth",
  requires: ["WPCOM_CLIENT_ID", "WPCOM_CLIENT_SECRET"],
  notes_tr: "WordPress.com hesabınızla giriş yapıp blogunuzu seçersiniz; şifre ya da anahtar girmezsiniz.",
  notes_en: "Sign in with your WordPress.com account and pick your blog; no password or key is entered here.",
  fields: [],
  oauth: {
    authorizeUrl(_inputs, { redirectUri, state, clientId } = {}) {
      if (!clientId || !redirectUri || !state) return null;
      const q = new URLSearchParams({ client_id: String(clientId), redirect_uri: redirectUri, response_type: "code", state });
      return `${WPC}/oauth2/authorize?${q}`;
    },
    async exchange(code, _inputs, creds, { redirectUri } = {}, io) {
      const cid = creds?.client_id || io?.env?.WPCOM_CLIENT_ID, sec = creds?.client_secret || io?.env?.WPCOM_CLIENT_SECRET;
      if (!cid || !sec) return { ok: false, error: "not_ready" };
      if (!code || !redirectUri) return { ok: false, error: "bad_input" };
      const r = await guardedFetch(io, `${WPC}/oauth2/token`, {
        method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: formBody({ client_id: cid, client_secret: sec, redirect_uri: redirectUri, code: String(code), grant_type: "authorization_code" }),
      }, { timeoutMs: PROBE_MS, allowHosts: WPC_HOSTS });
      if (!r.ok) return { ok: false, error: r.error };
      if (r.status !== 200 || typeof r.data?.access_token !== "string") { const e = r.status === 400 ? "auth" : statusErr(r.status); note(io, "wpcom", "exchange", e, r.status); return { ok: false, error: e }; }
      const blog = String(r.data.blog_id ?? "");
      return { ok: true, creds: { access_token: r.data.access_token }, config: { blog_id: SITE_ID_RE.test(blog) ? blog : null, blog_url: safeHref(r.data.blog_url) } };
    },
  },

  // inputs: { access_token, blog_id } (exchange sonrası çekirdek birleştirir)
  async probe(inputs, io) {
    const tok = str(inputs?.access_token, 2000), blog = str(inputs?.blog_id, 20);
    if (!tok || !SITE_ID_RE.test(blog)) return pfail("bad_input");
    const r = await guardedFetch(io, `${WPC}/rest/v1.1/sites/${blog}`, { method: "GET", headers: { authorization: `Bearer ${tok}`, accept: "application/json" } }, { timeoutMs: PROBE_MS, allowHosts: WPC_HOSTS });
    if (!r.ok) return pfail(r.error);
    if (r.status !== 200 || !isObj(r.data)) { note(io, "wpcom", "site", statusErr(r.status), r.status); return pfail(statusErr(r.status)); }
    return {
      ok: true,
      account: { name: str(r.data.name, 200) || blog, url: safeHref(r.data.URL) },
      options: {},
      config: { blog_id: blog, blog_url: safeHref(r.data.URL) },
      creds: { access_token: tok },
    };
  },

  async push(post, { config, creds, mode }, io) {
    const blog = String(config?.blog_id || "");
    if (!SITE_ID_RE.test(blog) || !creds?.access_token) return fail("bad_input");
    // Kapak görseli gönderilmiyor: v1.1 featured_image bir ek kimliği bekliyor; URL ile yükleme doğrulanmadı (DOĞRULANMALI).
    const body = { title: str(post.title, 300), content: postHtml(post), excerpt: str(post.excerpt, 1000), slug: slugify(post.slug || post.title, 190), status: mode === "publish" ? "publish" : "draft" };
    if (Array.isArray(post.tags) && post.tags.length) body.tags = post.tags.slice(0, 20).map(t => str(t, 100)).filter(Boolean).join(",");
    const r = await guardedFetch(io, `${WPC}/rest/v1.1/sites/${blog}/posts/new`, jsonInit("POST", { authorization: `Bearer ${creds.access_token}` }, body), { timeoutMs: PUSH_MS, allowHosts: WPC_HOSTS });
    if (!r.ok) { note(io, "wpcom", "create", r.error); return r.error === "timeout" ? fail("unknown_result", { retry: false }) : fail(r.error); }
    if ((r.status === 200 || r.status === 201) && r.data?.ID != null) return { ok: true, remote_id: String(r.data.ID), url: safeHref(r.data.URL) };
    note(io, "wpcom", "create", statusErr(r.status), r.status);
    return fail(statusErr(r.status));
  },
};

export const PROVIDERS = { wordpress, webflow, ghost, shopify, hubspot, wix, github, ideasoft, wpcom };
