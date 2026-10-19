// brandcorner panel genel bakış "Performans" özeti headless testi: sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-perf.mjs [ekranGörüntüsüKlasörü]   (8788 ve 9333 portları boş olmalı)
// Kontroller: örnek veri rozeti, gerçek gönderilerden son 30 gün toplamı, en çok erişen 3 gönderi, marka "veri yok",
// TR/EN, kart içinde 44px dokunma hedefi, sayfada yatay taşma; 2000x924, 390x844 ve 375x812.
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

// sc: { lang, role }
const mock = sc => `(() => {
  const SC = ${JSON.stringify(sc)};
  const user = { id: 41, name: "Deniz A.", email: "x@example.com", role: SC.role || "influencer", lang: SC.lang || "tr", profile: { company: "Acme", city: "İzmir", bio: "Günlük yaşam içerikleri.", niches: ["beauty"], platforms: [{ name: "instagram", handle: "deniz", followers: 24000 }], listed: true } };
  const R = p => {
    if (p === "auth/me") return { ok: true, user };
    if (p.startsWith("app/applications")) return { ok: true, applications: [] };
    if (p.startsWith("app/campaigns")) return { ok: true, campaigns: [] };
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

  const T44 = `[...document.querySelectorAll(".perf button,.perf a[href],.perf input,.perf select,.perf textarea,.perf summary,.card:has(h2) a.btn")].filter(n=>n.closest(".perf")||n.closest(".card").querySelector("h2").textContent===(document.documentElement.lang==="en"?"Performance":"Performans")).filter(n=>{const r=n.getBoundingClientRect();if(!r.width||!r.height)return false;const s=getComputedStyle(n);if(s.visibility==="hidden")return false;if(n.tagName==="A"&&s.display==="inline")return false;if(n.matches("a.pl"))return false;return r.height<44||r.width<44&&!/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName)}).map(n=>{const r=n.getBoundingClientRect();return n.tagName.toLowerCase()+"."+(n.className||"")+"["+(n.textContent||n.getAttribute("aria-label")||"").trim().slice(0,20)+"] "+Math.round(r.width)+"x"+Math.round(r.height)})`;

  let scriptId;
  const open = async (sc, hash, w, h, mobile, posts) => {
    if (scriptId) await cmd("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
    scriptId = (await cmd("Page.addScriptToEvaluateOnNewDocument", { source: mock(sc) })).result.identifier;
    await cmd("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
    await cmd("Page.navigate", { url: "about:blank" }); await sleep(150);
    await cmd("Page.navigate", { url: BASE + "/404" }); await sleep(250); await ev("localStorage.clear()");
    if (posts) await ev(`localStorage.setItem("bc-posts-41", ${JSON.stringify(JSON.stringify(posts))})`);
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

  const ago = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const P = (id, d, reach, likes, comments, caption) => ({ id, url: "https://www.instagram.com/p/" + id + "/", platform: "instagram", type: "photo", date: ago(d), caption, thumb: "", snaps: [{ at: ago(d), likes: 1, comments: 0, views: null, reach: 1 }, { at: ago(0), likes, comments, views: null, reach }] });
  const REAL = [P("a1", 2, 5000, 300, 20, "Birinci"), P("a2", 10, 12000, 500, 40, "İkinci"), P("a3", 20, 800, 30, 5, "Üçüncü"), P("a4", 25, 3000, 100, 10, "Dördüncü"), P("old", 60, 99999, 9999, 999, "Eski")];

  for (const [sz, w, h, mobile] of SIZES) {
    // 1) Gönderi yok: örnek veri rozeti, 4 ölçüt, en iyi 3, tüm gönderiler bağlantısı
    await open({}, "overview", w, h, mobile);
    ok(await q(".perf .b-sample") === 1, "örnek veri rozeti");
    ok(await q(".perf .mets .stat") === 4, "4 ölçüt");
    ok(await q(".perf ol.ptop li") >= 1 && await q(".perf ol.ptop li") <= 3, "en iyi gönderiler (≤3)");
    ok(await ev(`[...document.querySelectorAll(".perf ol.ptop a")].every(a=>a.getAttribute("href")==="#posts")`), "örnekte bağlantı #posts");
    ok(await q('.perf a[href="#posts"].btn') === 1, "tüm gönderiler düğmesi");
    await shot(`perf-sample-${sz}`, w);

    // 2) Gerçek gönderiler: 30 gün dışı sayılmaz; toplamlar son ölçümden
    await open({}, "overview", w, h, mobile, REAL);
    ok(await q(".perf .b-sample") === 0, "gerçek veride rozet yok");
    const vals = await ev(`[...document.querySelectorAll(".perf .mets .v")].map(n=>n.textContent)`);
    ok(vals[0] === "4", "gönderi sayısı 4 (" + vals[0] + ")");
    ok(/20,8|20\\.8/.test(vals[1]), "erişim 20,8B (" + vals[1] + ")");
    ok(/^1\sB$/u.test(vals[2]), "etkileşim 1005 → 1 B (" + vals[2] + ")");
    ok(await q(".perf .mets .v.na") === 1, "kazanç veri yok");
    const top = await ev(`[...document.querySelectorAll(".perf ol.ptop a")].map(a=>a.getAttribute("href"))`);
    ok(top.join() === "#post-a2,#post-a1,#post-a4", "en iyi sıralama " + top.join());
    await shot(`perf-real-${sz}`, w);

    // 3) 30 günde gönderi yok: boş durum
    await open({ lang: "en" }, "overview", w, h, mobile, [REAL[4]]);
    ok((await txt(".perf .hint")) === "No posts in the last 30 days.", "EN boş durum");
    ok((await txt(".perf h2")) === "Performance", "EN başlık");
    await shot(`perf-empty-en-${sz}`, w);

    // 4) Marka: veri yok, rozet yok
    await open({ role: "brand" }, "overview", w, h, mobile);
    ok(await q(".perf") === 0 && await ev(`[...document.querySelectorAll(".card h2")].some(n=>n.textContent==="Performans")`), "marka kartı");
    ok(await q("main .b-sample") === 0, "markada rozet yok");
    await shot(`perf-brand-${sz}`, w);
  }
  console.log(fails ? `HATA=${fails}` : "HATA=0");
  done(fails ? 1 : 0);
} catch (e) { console.log("HATA:", e.message); done(2); }
