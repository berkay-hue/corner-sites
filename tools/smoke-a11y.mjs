// brandcorner panel erişilebilirlik taraması (headless): sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-a11y.mjs [ekranGörüntüsüKlasörü]   (8788 ve 9333 portları boş olmalı)
// Kontroller: marka ve içerik üreticisi tüm sekmeler (dolu/boş), 44px dokunma hedefi, erişilebilir ad (aria-label/metin),
// klavye odak halkası, boş durum metni, yatay taşma; 2000x924, 390x844 ve 375x812.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2]; if (OUT) mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:8788", PORT = 9333;
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SIZES = [["d", 2000, 924, false], ["m390", 390, 844, true], ["m375", 375, 812, true]];


// sc: { role, lang, empty }
const mock = sc => `(() => {
  const SC = ${JSON.stringify(sc)};
  const own = SC.role === "brand";
  const user = { id: 41, name: own ? "Marka A.Ş." : "Deniz A.", email: "x@example.com", role: SC.role || "influencer", lang: SC.lang || "tr", profile: { company: "Acme", city: "İzmir", bio: "Günlük yaşam içerikleri.", niches: ["beauty"], platforms: [{ name: "instagram", handle: "deniz", followers: 24000 }], listed: true } };
  const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const camp = (id, title, status) => ({ id, title, status, brief: "Yaz ürünleri için kısa video.", niches: ["beauty"], platforms: ["instagram", "tiktok"], budget_min: 1000, budget_max: 5000, currency: "TRY", deadline: day(10), created_at: day(-5), owner: "Acme", applications: 3, pending: 1, submitted: 1, match: 80 });
  const CS = SC.empty ? [] : [camp(7, "Yaz koleksiyonu", "open"), camp(8, "Kış", "closed")];
  const inf = { id: "12", name: "Ece K.", city: "İstanbul", bio: "Güzellik.", niches: ["beauty"], platforms: [{ platform: "instagram", handle: "ece", followers: 52000 }], match: 70, history: [] };
  const app = (id, st) => ({ id, status: st, updated_at: day(-1), created_at: day(-3), message: "Merhaba", campaign: { id: 7, title: "Yaz koleksiyonu", owner: "Acme" }, influencer: inf });
  const AS = SC.empty ? [] : [app(1, "pending"), app(2, "accepted"), app(3, "submitted")];
  const R = p => {
    if (p === "auth/me") return { ok: true, user };
    if (p.startsWith("app/applications")) return { ok: true, applications: AS };
    if (p === "app/campaigns") return { ok: true, campaigns: CS };
    if (/^app\\/campaigns\\/\\d+$/.test(p)) return SC.empty ? [404, { ok: false }] : { ok: true, campaign: CS[0], applications: own ? AS : [], application: own ? null : AS[0] };
    if (p.startsWith("app/influencers")) return { ok: true, influencers: SC.empty ? [] : [inf] };
    if (p.startsWith("app/matches")) return { ok: true, matches: SC.empty ? [] : [{ ...inf, campaign_id: 7 }] };
    if (p.startsWith("app/creators/")) return { ok: true, creator: inf, influencer: inf };
    if (p === "app/stats") return { ok: true, stats: {} };
    if (p === "app/connections") return { ok: true, connections: [] };
    if (p.startsWith("app/metrics") || p === "app/notify" || p.startsWith("app/posts") || p === "app/export") return [404, { ok: false, error: "not_found" }];
    return { ok: true };
  };
  const of = window.fetch.bind(window);
  window.fetch = (u, o = {}) => {
    u = String(u); if (!u.startsWith("http://localhost:8799/")) return of(u, o);
    const p = u.slice(22).split("?")[0]; let r = R(p), st = 200;
    if (Array.isArray(r)) { st = r[0]; r = r[1]; }
    return Promise.resolve(new Response(JSON.stringify(r), { status: st, headers: { "content-type": "application/json" } }));
  };
  window.confirm = () => true;
  try { localStorage.setItem("bc-token", "fake"); localStorage.setItem("brand-corner-lang", SC.lang || "tr"); } catch (e) {}
})();`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const server = spawn(process.execPath, [join(ROOT, "tools/serve.mjs"), join(ROOT, "sites/brandcorner.co"), "8788"], { stdio: "ignore" });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bcperf-"))}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
let fails = 0;
const done = code => { try { ws && ws.close(); } catch {} chrome.kill(); server.kill(); process.exit(code); };
const ok = (cond, what) => { if (!cond) { fails++; console.log("  FAIL:", what); } };
let ws;
try {
  let ver; for (let i = 0; i < 50 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(200); } }
  if (!ver) throw new Error("chrome başlamadı");
  const tgt = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  ws = new WebSocket(tgt.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  let id = 0; const pend = new Map(), errs = [];
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map(a => a.value ?? a.description).join(" ")); });
  const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await cmd("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error("eval: " + (r.result.exceptionDetails.exception?.description || expr).slice(0, 300)); return r.result?.result?.value; };
  await cmd("Page.enable"); await cmd("Runtime.enable");
  for (let i = 0; i < 25; i++) { try { await fetch(BASE + "/panel.html"); break; } catch { await sleep(200); } }


  // Görünür etkileşimli öğeler: 44px altı (satır içi metin bağlantısı hariç), erişilebilir adı yok, klavye odağında görünür halka yok
  const AUD = `(() => {
    const sel = "a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex='-1'])";
    const vis = n => { const r = n.getBoundingClientRect(), s = getComputedStyle(n); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !n.closest("[hidden],[aria-hidden=true]"); };
    const nm = n => (n.getAttribute("aria-label") || (n.getAttribute("aria-labelledby") || "").split(" ").map(i => (document.getElementById(i) || {}).textContent || "").join(" ") || (n.labels && [...n.labels].map(l => l.textContent).join(" ")) || (/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName) ? "" : n.textContent) || n.getAttribute("title") || (n.querySelector("img[alt]") || {}).alt || (n.type === "submit" || n.type === "button" ? n.value : "") || "").trim();
    const id = n => { const r = n.getBoundingClientRect(); return n.tagName.toLowerCase() + (n.type && n.tagName === "INPUT" ? "[" + n.type + "]" : "") + "." + String(n.className || "").replace(/ /g, ".") + "{" + (nm(n) || n.getAttribute("href") || "").slice(0, 18) + "} " + Math.round(r.width) + "x" + Math.round(r.height); };
    const ring = n => { const s = getComputedStyle(n); if (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) return true; if (s.boxShadow && s.boxShadow !== "none") return true;
      for (let p = n.parentElement; p && p !== document.body; p = p.parentElement) { if (!p.matches(":focus-within")) break; const q = getComputedStyle(p); if (q.outlineStyle !== "none" && parseFloat(q.outlineWidth) > 0 || q.boxShadow !== "none") return true; } return false; };
    const all = [...document.querySelectorAll(sel)].filter(vis), small = [], noname = [], noring = [];
    for (const n of all) {
      const r = n.getBoundingClientRect(), s = getComputedStyle(n), box = /^(checkbox|radio)$/.test(n.type);
      const lab = box && n.closest("label"), lr = lab && lab.getBoundingClientRect();
      if (!(n.tagName === "A" && s.display === "inline") && !(box && lr && lr.height >= 44) && (r.height < 43.5 || r.width < 43.5 && !/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName))) small.push(id(n));
      if (!nm(n) && !(box && lab && lab.textContent.trim())) noname.push(id(n));
    }
    window.__ring = () => { const n = document.activeElement; if (!n || n === document.body) return null; return ring(n) ? "" : id(n); };
    const empty = [...document.querySelectorAll("main .card")].filter(vis).filter(c => ![...c.children].some(k => !/^H[1-3]$/.test(k.tagName) && !k.matches(".ch") && (k.textContent.trim() || k.querySelector("img,svg,input,canvas")))).map(c => "kart{" + c.textContent.trim().slice(0, 20) + "}");
    return { small, noname, noring, empty };
  })()`;

  let scriptId;
  const open = async (sc, hash, w, h, mobile) => {
    if (scriptId) await cmd("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
    scriptId = (await cmd("Page.addScriptToEvaluateOnNewDocument", { source: mock(sc) })).result.identifier;
    await cmd("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
    await cmd("Page.navigate", { url: "about:blank" }); await sleep(150);
    await cmd("Page.navigate", { url: BASE + "/404" }); await sleep(250); await ev("localStorage.clear()");
    errs.length = 0;
    await cmd("Page.navigate", { url: `${BASE}/panel.html#${hash}` }); await sleep(1300);
  };
  const ROUTES = { brand: ["overview", "campaigns", "new", "discover", "profile", "settings", "campaign-7", "creator-12"], influencer: ["overview", "campaigns", "applications", "posts", "profile", "settings", "campaign-7"] };
  const VERBOSE = process.env.V;
  for (const [sz, w, h, mobile] of SIZES) for (const role of ["brand", "influencer"]) for (const empty of [false, true]) for (const r of ROUTES[role]) {
    await open({ role, empty }, r, w, h, mobile);
    const name = `${sz}-${role}-${empty ? "bos" : "dolu"}-${r}`;
    const ov = await ev("document.documentElement.scrollWidth - innerWidth"), a = await ev(AUD);
    // Gerçek klavye: Tab ile sırayla gez, odaktaki öğede görünür halka var mı
    await ev("document.activeElement && document.activeElement.blur(), window.scrollTo(0, 0)");
    for (let i = 0; i < 120; i++) {
      await cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      await cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      const k = await ev("(() => { const n = document.activeElement; if (!n || n === document.body) return null; if (n.__seen) return 'DONE'; n.__seen = 1; return window.__ring(); })()");
      if (k === "DONE") break; if (k) a.noring.push(k);
    }
    ok(ov <= 0, `${name}: yatay taşma ${ov}px`);
    ok(!errs.length, `${name}: JS hatası ${errs.join(" | ").slice(0, 300)}`);
    for (const k of ["small", "noname", "noring", "empty"]) ok(!a[k].length, `${name}: ${k} ${[...new Set(a[k])].slice(0, VERBOSE ? 40 : 6).join(" | ")}`);
    if (OUT && (sz === "d" || sz === "m375")) {
      const fullH = Math.min(await ev("Math.max(document.documentElement.scrollHeight, innerHeight)"), 7000);
      const s = await cmd("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: fullH, scale: 1 } });
      writeFileSync(join(OUT, name + ".png"), Buffer.from(s.result.data, "base64"));
    }
  }
  console.log(fails ? `HATA=${fails}` : "HATA=0");
  done(fails ? 1 : 0);
} catch (e) { console.log("HATA:", e.message); done(2); }
