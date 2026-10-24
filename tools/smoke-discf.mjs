// brandcorner panel Keşfet filtreleri headless testi: sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-discf.mjs [ekranGörüntüsüKlasörü]   (8788 ve 9333 portları boş olmalı)
// Kontroller: şehir filtresi, sıralama (önerilen/takipçi/ad, platforma göre takipçi), "Filtreleri temizle",
// dar ekranda "Filtreler" düğmesi, TR/EN, filtre formunda ve sonuç satırında 44px dokunma hedefi, sayfada yatay taşma;
// 2000x924, 390x844 ve 375x812.
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

const I = (id, name, city, ig, tt, match) => ({ id, name, city, bio: "", niches: ["beauty"], match, platforms: [{ platform: "instagram", handle: "u" + id, followers: ig }].concat(tt ? [{ platform: "tiktok", handle: "t" + id, followers: tt }] : []), history: [] });
const INF = [I(1, "Zeynep K.", "İzmir", 20000, 0, 92), I(2, "Ahmet B.", "Ankara", 90000, 1000, 85), I(3, "Can D.", "İzmir", 5000, 200000, 80), I(4, "Ömer T.", "istanbul", 40000, 0, 70), I(5, "Banu S.", "", 15000, 50000, 65)];
// sc: { lang, role }
const mock = sc => `(() => {
  const SC = ${JSON.stringify(sc)}, INF = ${JSON.stringify(INF)};
  const user = { id: 41, name: "Deniz A.", email: "x@example.com", role: SC.role || "brand", lang: SC.lang || "tr", profile: { company: "Acme", city: "İzmir", bio: "Günlük yaşam içerikleri.", niches: ["beauty"], platforms: [{ name: "instagram", handle: "deniz", followers: 24000 }], listed: true } };
  const R = p => {
    if (p === "auth/me") return { ok: true, user };
    if (p.startsWith("app/applications")) return { ok: true, applications: [] };
    if (p.startsWith("app/campaigns")) return { ok: true, campaigns: [] };
    if (p.startsWith("app/matches")) return { ok: true, influencers: INF };
    return { ok: true };
  };
  const of = window.fetch.bind(window);
  window.fetch = (u, o = {}) => {
    u = String(u); if (!u.startsWith("http://localhost:8799/")) return of(u, o);
    const p = u.slice(22), m = (o.method || "GET").toUpperCase();
    let r = R(p), st = 200;
    if (Array.isArray(r)) { st = r[0]; r = r[1]; }
    (window.__calls = window.__calls || []).push(m + " " + p + " " + st);
    return Promise.resolve(new Response(JSON.stringify(r), { status: st, headers: { "content-type": "application/json" } }));
  };
  window.confirm = () => true;
  try { localStorage.setItem("bc-token", "fake"); localStorage.setItem("brand-corner-lang", SC.lang || "tr"); } catch (e) {}
})();`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const server = spawn(process.execPath, [join(ROOT, "tools/serve.mjs"), join(ROOT, "sites/brandcorner.co"), "8788"], { stdio: "ignore" });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bcdiscf-"))}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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

  const T44 = `[...document.querySelectorAll("form.filter button,form.filter input,form.filter select,.rbar button,.rbar select")].filter(n=>{const r=n.getBoundingClientRect();if(!r.width||!r.height)return false;return r.height<44||r.width<44&&n.tagName==="BUTTON"}).map(n=>{const r=n.getBoundingClientRect();return n.tagName.toLowerCase()+"["+(n.textContent||n.id||"").trim().slice(0,20)+"] "+Math.round(r.width)+"x"+Math.round(r.height)})`;

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
  const shot = async (name, w) => {
    const ov = await ev("document.documentElement.scrollWidth - innerWidth"), small = await ev(T44);
    ok(ov <= 0, `${name}: yatay taşma ${ov}px`);
    ok(!small.length, `${name}: 44px altı ${small.slice(0, 5).join(" | ")}`);
    ok(!errs.length, `${name}: JS hatası ${errs.join(" | ").slice(0, 300)}`);
    if (OUT) {
      const fullH = Math.min(await ev("Math.max(document.documentElement.scrollHeight, innerHeight)"), 7000);
      const r = await cmd("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: fullH, scale: 1 } });
      writeFileSync(join(OUT, name + ".png"), Buffer.from(r.result.data, "base64"));
    }
    console.log(`${name} overflow=${ov} small44=${small.length} errs=${errs.length}`);
  };
  const q = s => ev(`document.querySelectorAll(${JSON.stringify(s)}).length`);
  const txt = s => ev(`(document.querySelector(${JSON.stringify(s)})||{}).textContent||""`);
  const setv = (s, v) => ev(`(()=>{const n=document.querySelector(${JSON.stringify(s)});n.value=${JSON.stringify(v)};n.dispatchEvent(new Event("input",{bubbles:true}));n.dispatchEvent(new Event("change",{bubbles:true}));return true})()`);

  const click = s => ev(`(()=>{const n=document.querySelector(${JSON.stringify(s)});if(!n)return false;n.click();return true})()`);
  const names = () => ev(`[...document.querySelectorAll(".list article h3")].map(n=>n.textContent)`);
  const vis = () => ev(`!document.querySelector(".rbar>.ghost").hidden`);
  const shown = s => ev(`(()=>{const n=document.querySelector(${JSON.stringify(s)});return !!n&&n.getBoundingClientRect().height>0})()`);
  for (const [sz, w, h, mobile] of SIZES) {
    // 1) TR: formda arama + 4 seçim kutusu; sıralama ve temizle (gizli) listenin üstündeki satırda; şehir listesi tekil ve sıralı
    await open({}, "discover", w, h, mobile);
    ok(await q("form.filter select") === 4 && await q(".rbar #ds") === 1, "4 seçim kutusu + sıralama (" + await q("form.filter select") + ")");
    ok(await ev(`[...document.querySelectorAll("#dc option")].map(o=>o.textContent).join("|")`) === "Tüm şehirler|Ankara|istanbul|İzmir", "şehir seçenekleri " + await ev(`[...document.querySelectorAll("#dc option")].map(o=>o.textContent).join("|")`));
    ok(!(await vis()), "temizle başta gizli");
    ok((await names()).join() === "Zeynep K.,Ahmet B.,Can D.,Ömer T.,Banu S.", "önerilen sıra");
    // Dar ekranda arama dışındaki alanlar "Filtreler" düğmesiyle açılır; geniş ekranda düğme yok, alanlar açık
    if (mobile) {
      ok(await shown(".ftog") && !(await shown("#dc")), "dar ekran: Filtreler düğmesi var, alanlar kapalı");
      await click(".ftog");
      ok(await ev(`document.querySelector(".ftog").getAttribute("aria-expanded")`) === "true" && await shown("#dc"), "Filtreler açıldı");
    } else ok(!(await shown(".ftog")) && await shown("#dc"), "geniş ekran: alanlar açık, düğme yok");
    // 2) Şehir İzmir: 2 sonuç, temizle görünür, düğmedeki sayaç 1
    await setv("#dc", "İzmir");
    ok((await names()).join() === "Zeynep K.,Can D.", "İzmir filtresi " + (await names()).join());
    ok(await vis(), "temizle görünür");
    ok(await txt(".ftog .n") === "1", "etkin filtre sayacı " + await txt(".ftog .n"));
    await shot(`discf-city-${sz}`, w);
    // 3) Sıralama: takipçi (tüm platformlar), ad, tiktok takipçisi
    await setv("#dc", ""); await setv("#ds", "fol");
    ok((await names())[0] === "Can D." && (await names())[1] === "Ahmet B.", "takipçi sırası " + (await names()).join());
    await setv("#ds", "name");
    ok((await names()).join() === "Ahmet B.,Banu S.,Can D.,Ömer T.,Zeynep K.", "ad sırası " + (await names()).join());
    await setv("#dp", "tiktok"); await setv("#ds", "fol");
    ok((await names()).join() === "Can D.,Banu S.,Ahmet B.", "tiktok takipçi sırası " + (await names()).join());
    // 4) Temizle: tüm alanlar boş, 5 sonuç, odak aramada
    await click(".rbar>.ghost");
    ok((await names()).length === 5, "temizle → 5 sonuç");
    ok(await ev(`[...document.querySelectorAll("form.filter select,form.filter input,#ds")].every(n=>n.value==="")`), "alanlar boş");
    ok(!(await vis()), "temizle yine gizli");
    ok(await txt(".ftog .n") === "", "sayaç boş");
    ok(await ev(`document.activeElement && document.activeElement.id`) === "dq", "odak arama kutusunda");
    // 5) EN etiketleri
    await open({ lang: "en" }, "discover", w, h, mobile);
    ok(await txt('label[for="dc"]') === "City" && await txt(".sortw span") === "Sort" && await txt(".ftog") === "Filters", "EN etiketler");
    await setv("#ds", "name");
    ok(await txt(".rbar>.ghost") === "Clear filters", "EN temizle");
    await shot(`discf-en-${sz}`, w);
  }
  console.log("HATA=" + fails); done(fails ? 1 : 0);
} catch (e) { console.log("HATA: " + e.message); done(2); }
