// Framer'ın yalnızca tarayıcıda çizdiği bileşenleri (ikonlar, embed'ler vb.) doldurur.
// Sayfa her breakpoint genişliğinde headless Chrome'da açılır; boş
// <div style="display:contents"></div> kapsayıcıları, aynı ebeveyn sınıfı + sıra ile
// hidrasyon sonrası içerikleriyle eşleştirilir.
import puppeteer from "puppeteer-core";
import { parseHTML } from "linkedom";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EMPTY = '<div style="display:contents"></div>';
let browser;

const withTimeout = (p, ms, msg) => { let t; return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(msg)), ms); })]).finally(() => clearTimeout(t)); };

export async function openBrowser() {
  browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 90000, args: ["--no-first-run"] });
}
export async function closeBrowser() { await withTimeout(browser?.close(), 15000, "close").catch(() => browser?.process()?.kill("SIGKILL")); }
// Chrome CDP'de kilitlenirse (newPage/close dönmez) tarayıcıyı baştan aç; aynı anda tek yeniden başlatma
let restarting = null;
async function restartBrowser() {
  restarting ||= (async () => { const old = browser; old?.process()?.kill("SIGKILL"); await openBrowser(); })().finally(() => { restarting = null; });
  return restarting;
}

export function breakpoints(raw) {
  const m = raw.match(/<script type="framer\/appear" id="__framer__breakpoints">([\s\S]*?)<\/script>/);
  if (!m) return [];
  return JSON.parse(m[1]).map(b => {
    // Tek breakpoint'li sayfalarda mediaQuery yok
    if (!b.mediaQuery) return { hash: b.hash, width: 1440 };
    const min = b.mediaQuery.match(/min-width:\s*(\d+)/), max = b.mediaQuery.match(/max-width:\s*(\d+)/);
    const width = min ? +min[1] + (max ? Math.min(100, (+max[1] - +min[1]) >> 1) : 0) : Math.min(390, +max[1]);
    return { hash: b.hash, width };
  });
}

async function capture(url, width, hiddenClasses) {
  if (restarting) await restarting;
  const page = await withTimeout(browser.newPage(), 30000, "newPage zaman aşımı").catch(async e => { await restartBrowser(); throw e; });
  let timer;
  // goto'nun kendi süresi var ama evaluate'in yok; sayfa kilitlenirse 120 sn sonra vazgeç
  const limit = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("capture zaman aşımı")), 120000); });
  try { return await Promise.race([limit, (async () => {
    await page.setViewport({ width, height: 900 });
    // Analitik/Turnstile gibi sürekli bağlantılar networkidle'ı hiç bitirmez: load + kısa sessizlik yeter
    // Takılan tek bir kaynak load'u hiç bitirmeyebilir (salescorner): DOM hazırsa devam et
    await page.goto(url, { waitUntil: "load", timeout: 60000 }).catch(async e => {
      if (!/timeout/i.test(e.message) || !(await page.evaluate(() => !!document.querySelector("[data-framer-root], #main > *")).catch(() => false))) throw e;
    });
    await page.waitForNetworkIdle({ idleTime: 800, timeout: 8000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2500));
    return await page.evaluate((hiddenClasses) => {
      // Bu genişlikte display:none olan hidden-* sınıfları (CSS media kurallarından ölçülür)
      const hidden = hiddenClasses.filter(c => {
        const t = document.createElement("div"); t.className = c; document.body.appendChild(t);
        const h = getComputedStyle(t).display === "none"; t.remove(); return h;
      });
      const fills = {};
      document.querySelectorAll('div[style="display:contents"], div[style="display: contents;"]').forEach(d => {
        (fills[d.parentElement.className] ||= []).push(d.innerHTML);
      });
      const css = [];
      for (const s of document.styleSheets) {
        if (s.href || (s.ownerNode?.textContent || "").length) continue;
        try { for (const r of s.cssRules) css.push(r.cssText); } catch {}
      }
      return { fills, css, hidden };
    }, hiddenClasses);
  })()]); } finally { clearTimeout(timer); await withTimeout(page.close(), 10000, "close").catch(() => {}); }
}

// SSR'daki ".hidden-x{display:none!important}" media kuralları: bileşen varyantları sayfa
// breakpoint'lerinden farklı aralıklar kullanabilir (örn. 768/1280), canlı DOM'da bu kurallar kalmaz
export function hiddenRules(html) {
  return [...html.matchAll(/@media\s*\(([^{]*)\)\s*\{\s*\.(hidden-[a-z0-9]+)\s*\{\s*display:\s*none/g)].map(m => ({
    cls: m[2], min: +(m[1].match(/min-width:\s*([\d.]+)/)?.[1] ?? 0), max: +(m[1].match(/max-width:\s*([\d.]+)/)?.[1] ?? Infinity),
  }));
}

// html: Framer script'leri temizlenmiş SSR HTML
export async function hydrateFill(url, raw, html) {
  const rules = hiddenRules(html);
  const hiddenAt = w => rules.filter(r => w >= r.min && w <= r.max).map(r => r.cls);
  const bps = breakpoints(raw);
  // Her varyant aralığından da bir genişlik yakala
  const widths = new Map((bps.length ? bps : [{ width: 1440 }]).map(b => [b.width, b]));
  for (const r of rules) {
    const w = r.max === Infinity ? Math.max(r.min + 100, 1440) : r.min === 0 ? Math.min(390, r.max) : Math.round((r.min + r.max) / 2);
    const key = hiddenAt(w).sort().join();
    if (![...widths.keys()].some(k => hiddenAt(k).sort().join() === key)) widths.set(w, { width: w });
  }
  const { document } = parseHTML(html);
  // Yalnızca tek attribute'lu kapsayıcılar: class/tabindex'li display:contents'ler varyant sarmalayıcısıdır
  const empties = [...document.querySelectorAll('div[style="display:contents"]')].filter(e => e.attributes.length === 1);
  const fillAt = new Map(); // empties index -> innerHTML
  const css = new Set();
  const stats = { empty: empties.filter(e => !e.innerHTML).length, filled: 0, mismatch: [], errors: [] };
  const hiddenClasses = [...new Set(html.match(/\bhidden-[a-z0-9]+\b/g) || [])];
  for (const bp of widths.values()) {
    let cap = null;
    for (let t = 0; t < 3 && !cap; t++) cap = await capture(url, bp.width, hiddenClasses).catch(e => (stats.errors.push(`${bp.width}:${e.message.slice(0, 60)}`), null));
    if (!cap) continue;
    cap.css.forEach(c => css.add(c));
    const groups = {};
    empties.forEach((el, i) => {
      const hid = hiddenAt(bp.width);
      if (hid.some(c => el.closest(`.${c}`))) return;
      (groups[el.parentElement.className] ||= []).push(i);
    });
    for (const [key, idxs] of Object.entries(groups)) {
      const got = cap.fills[key] || [];
      if (got.length !== idxs.length) { stats.mismatch.push(`${bp.width}:${key}:${idxs.length}/${got.length}`); continue; }
      idxs.forEach((i, k) => {
        if (!empties[i].innerHTML && !fillAt.has(i) && got[k]) fillAt.set(i, got[k]);
      });
    }
  }
  // Kaynak metinde boş kapsayıcıları sırayla değiştir (yeniden serileştirme yok)
  const all = [];
  html.replace(/<div style="display:contents">/g, (_, off) => { all.push(off); return _; });
  // empties sırası == kaynaktaki <div style="display:contents"> sırası
  if (all.length !== empties.length) { stats.mismatch.push(`count ${all.length}/${empties.length}`); return { html, stats }; }
  let out = "", last = 0;
  all.forEach((off, i) => {
    if (!fillAt.has(i) || html.slice(off, off + EMPTY.length) !== EMPTY) return;
    out += html.slice(last, off) + '<div style="display:contents">' + fillAt.get(i) + "</div>";
    last = off + EMPTY.length; stats.filled++;
  });
  out += html.slice(last);
  if (css.size) out = out.replace("</head>", `<style data-hydrated-css>${[...css].join("\n")}</style></head>`);
  return { html: out, stats };
}
