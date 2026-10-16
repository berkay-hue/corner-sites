// Blog içeriği yardımcıları: mojibake onarımı, eski n8n iskeletinin temizlenmesi,
// küçük markdown -> HTML çevirici. build-blog.mjs ve seo.mjs ortak kullanır.

// --- Mojibake: UTF-8 baytlarının GBK olarak okunmasıyla oluşan "k芒rlı", "Corner鈥檇an" vb.
let gbkTable;
function gbkBytes(ch) {
  if (!gbkTable) {
    gbkTable = new Map();
    const d = new TextDecoder("gbk");
    for (let a = 0x81; a <= 0xfe; a++) for (let b = 0x40; b <= 0xfe; b++) {
      const c = d.decode(new Uint8Array([a, b]));
      if (c.length === 1 && !gbkTable.has(c)) gbkTable.set(c, [a, b]);
    }
  }
  return gbkTable.get(ch);
}
const utf8 = new TextDecoder("utf-8", { fatal: true });
export function fixMojibake(s) {
  // CJK koşusu + GBK ikinci baytı ASCII olabildiği için ardından gelen tek harf
  return s.replace(/[㐀-鿿＀-￯]+[A-Za-z]?/g, run => {
    for (const cut of [run.length, run.length - 1]) {
      const head = run.slice(0, cut), tail = run.slice(cut);
      const bytes = [];
      for (const ch of head) {
        const b = /[\x00-\x7f]/.test(ch) ? [ch.charCodeAt(0)] : gbkBytes(ch);
        if (!b) return run;
        bytes.push(...b);
      }
      try {
        const out = utf8.decode(new Uint8Array(bytes));
        if (!/[㐀-鿿]/.test(out)) return out + tail;
      } catch {}
    }
    return run;
  });
}

// --- Şablon yer tutucuları (AGENCY_, TURKEY_ ...) başlıklarda kalmış
export const fixPlaceholders = s => s.replace(/\b[A-Z]{3,}(?:_[A-Z]+)*_(?=[A-Za-zÇĞİÖŞÜçğıöşü])/g, "");

export const slugify = s => s.toLocaleLowerCase("tr")
  .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// --- Markdown (yalnızca yazarın ürettiği alt küme)
function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, (_, t, u) =>
      `<a href="${u}"${u.startsWith("/") ? "" : ` target="_blank" rel="${u.startsWith("https://get.apollo.io/") ? "sponsored nofollow noopener" : "noopener"}"`}>${t}</a>`);
}
export function markdown(md) {
  const out = []; let list = null, para = [];
  const flushP = () => { if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`); para = []; };
  const flushL = () => { if (list) out.push(`<${list.tag}>${list.items.map(i => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`); list = null; };
  for (const raw of md.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    let m;
    if (!line) { flushP(); flushL(); continue; }
    if ((m = line.match(/^(#{2,4})\s+(.+)$/))) { flushP(); flushL(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
    if (/^#\s/.test(line)) { flushP(); flushL(); continue; } // H1 sayfada zaten var
    if ((m = line.match(/^>\s?(.*)$/))) { flushP(); flushL(); out.push(`<blockquote><p>${inline(m[1])}</p></blockquote>`); continue; }
    if ((m = line.match(/^([-*]|\d+[.)])\s+(.+)$/))) {
      flushP();
      const tag = /\d/.test(m[1]) ? "ol" : "ul";
      if (list && list.tag !== tag) flushL();
      (list ||= { tag, items: [] }).items.push(m[2]); continue;
    }
    flushL(); para.push(line);
  }
  flushP(); flushL();
  return out.join("\n");
}

// --- Eski n8n yazılarındaki "Makale Başlığı: / Giriş: / Bölüm N: / Kural N: / Sonuç:" iskeleti.
// Girdi: Content kapsayıcısının <p> listesi (metin). Çıktı: [{tag, text}]
const HEAD_RE = /^(?:Bölüm|Kural|Adım|Strateji|Madde)\s*\d+\s*[:.-]\s*/i;
export function unscaffold(paras) {
  const out = [];
  for (let t of paras) {
    t = t.trim(); if (!t) continue;
    if (/^Makale Başlığı\s*:/i.test(t)) continue;
    let m;
    if ((m = t.match(/^(Giriş|Sonuç)\s*:\s*/i))) {
      const rest = t.slice(m[0].length).trim();
      if (/^sonuç/i.test(m[1])) out.push({ tag: "h2", text: rest && rest.length < 120 ? rest : "Sonuç" });
      if (rest && !(/^sonuç/i.test(m[1]) && rest.length < 120)) out.push({ tag: "p", text: rest });
      continue;
    }
    if (HEAD_RE.test(t)) {
      const rest = t.replace(HEAD_RE, "").trim();
      if (rest.length <= 160) { out.push({ tag: "h2", text: rest }); continue; }
      // Başlık + paragraf tek satırda: ilk cümle başlık
      const cut = rest.search(/[.:!?]\s/);
      if (cut > 10 && cut < 140) { out.push({ tag: "h2", text: rest.slice(0, cut) }, { tag: "p", text: rest.slice(cut + 1).trim() }); continue; }
      out.push({ tag: "p", text: rest }); continue;
    }
    // "Başlık:" tek başına kısa paragraf -> ara başlık
    if (t.length <= 90 && /:$/.test(t) && !/[.!?]/.test(t.slice(0, -1))) { out.push({ tag: "h3", text: t.slice(0, -1) }); continue; }
    // "Etiket: metin..." -> etiketi kalın yap
    if ((m = t.match(/^([^:.!?*]{3,50}):\s+(?=\S)/)) && m[1].split(/\s+/).length <= 6 && t.length > m[0].length + 40)
      t = `**${m[1]}:** ${t.slice(m[0].length)}`;
    out.push({ tag: "p", text: t });
  }
  return out;
}

export function metaDescription(text, max = 155) {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const dot = cut.lastIndexOf(". ");
  return dot > 80 ? cut.slice(0, dot + 1) : cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–-]$/, "") + "…";
}

// "## Sık sorulan sorular" / "## FAQ" bölümündeki "### Soru?" + cevabın ilk paragrafı (FAQPage JSON-LD için; SSS'den sonra gelen kapanış paragrafı karışmasın).
// Başlık toleranslı: "Sıkça Sorulan Sorular", "## **SSS**", "## FAQs:" de sayılır. blog-worker de yazıyı yayımlamadan önce bununla denetler.
export function faqItems(md) {
  const m = md.match(/^##(?=[ \t])[* \t]+(?:Sık(?:ça)? sorulan sorular|SSS|FAQs?|Frequently asked questions)(?:[:*]|[^\S\n])*$([\s\S]*?)(?=^## |(?![\s\S]))/im);
  if (!m) return [];
  const plain = t => t.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`>]/g, "").replace(/\s+/g, " ").trim();
  return m[1].split(/^### /m).slice(1).map(b => { const [q, ...rest] = b.split("\n"); return [plain(q), plain(rest.join("\n").trim().split(/\n\s*\n/)[0])]; }).filter(([q, a]) => q && a);
}
