// brandcorner panel kampanya raporu + başvuru kartı içerik ölçümleri headless testi: sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-campaign-report.mjs [ekranGörüntüsüKlasörü]   (8788 ve 9333 portları boş olmalı)
// Kontroller: app/applications/:id/metrics örnek (label_code sample → rozet), canlı (rozet yok), no_data (veri yok), 404 (kart bozulmaz,
// raporda örnek rozeti); durum sayıları, izlenme/beğeni/yorum toplamı, EN, influencer görünümü, taşma/44px/JS; 2000x924, 390x844, 375x812.
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

// sc: { lang, role, mode: "sample" | "live" | "404", noContent }
const mock = sc => `(() => {
  const SC = ${JSON.stringify(sc)};
  const brand = { id: 9, name: "Marka A.Ş.", email: "x@example.com", role: "brand", lang: SC.lang || "tr", profile: { company: "Marka" } };
  const inf = { id: 41, name: "Deniz A.", email: "y@example.com", role: "influencer", lang: SC.lang || "tr", profile: { city: "İzmir", niches: ["beauty"], platforms: [{ name: "instagram", handle: "deniz", followers: 24000 }], listed: true } };
  const user = SC.role === "influencer" ? inf : brand;
  const camp = { id: 7, title: "Yaz koleksiyonu", status: "open", brief: "Kısa video.", budget_min: 1000, budget_max: 5000, deadline: "2026-12-01", platforms: ["instagram"], niches: ["beauty"], created_at: "2026-10-01T10:00:00Z", owner: "Marka", match: 80 };
  const I = (id, n) => ({ id, name: n, city: "İzmir", match: 70, bio: "", niches: [], platforms: [] });
  const cu = (pl, s) => SC.noContent ? null : (pl === "linkedin" ? "https://www.linkedin.com/posts/" : pl === "youtube" ? "https://www.youtube.com/watch?v=" : "https://www.instagram.com/p/") + s;
  const now = "2026-10-18T10:00:00Z";
  const apps = [
    { id: 1, status: "pending", message: "Merhaba", content_url: null, updated_at: now, influencer: I(1, "Ayşe") },
    { id: 2, status: "submitted", message: "", content_url: cu("instagram", "aa"), updated_at: now, influencer: I(2, "Burak") },
    { id: 3, status: "approved", message: "", content_url: cu("youtube", "bb"), updated_at: now, influencer: I(3, "Cem") },
    { id: 4, status: "accepted", message: "", content_url: cu("linkedin", "cc"), updated_at: now, influencer: I(4, "Derya") }
  ];
  const MET = { 2: [300, 40, 5, "instagram"], 3: [500, 60, 7, "youtube"] };
  const metrics = id => {
    if (SC.mode === "404") return [404, { ok: false, error: "not_found" }];
    const x = MET[id], live = SC.mode === "live";
    if (!x) return { ok: true, metrics: { mode: live ? "live" : "sample", platform: "linkedin", label_code: "no_data", views: null, likes: null, comments: null } };
    return { ok: true, metrics: { mode: live ? "live" : "sample", platform: x[3], label_code: live ? null : "sample", views: x[0], likes: x[1], comments: x[2] } };
  };
  const R = p => {
    if (p === "auth/me") return { ok: true, user };
    let m = /^app\\/applications\\/(\\d+)\\/metrics$/.exec(p); if (m) return metrics(+m[1]);
    if (p === "app/campaigns/7") return SC.role === "influencer" ? { ok: true, campaign: camp, application: apps[1] } : { ok: true, campaign: camp, applications: apps };
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
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bccrep-"))}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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

  const T44 = `[...document.querySelectorAll(".crep a,.crep button,.amets a,.amets button")].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.height&&(r.height<44||r.width<44)}).map(n=>n.tagName+"["+n.textContent.trim().slice(0,20)+"]")`;

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
    ok(!(await ev(`/\\b(null|undefined|NaN)\\b/.test(document.querySelector("main").innerText)`)), `${name}: sayfada null/undefined/NaN metni`);
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

  const vals = s => ev(`[...document.querySelectorAll(${JSON.stringify(s)})].map(n=>n.textContent)`);

  for (const [sz, w, h, mobile] of SIZES) {
    // 1) Örnek mod: rapor rozeti, durum sayıları, toplamlar, kartlarda örnek/veri yok
    await open({ mode: "sample" }, "campaign-7", w, h, mobile);
    ok(await q(".crep") === 1, "rapor kutusu");
    ok((await txt(".crep h2")).startsWith("Kampanya raporu"), "TR başlık");
    ok(await q(".crep h2 .b-sample") === 1, "raporda örnek rozeti");
    const st = await vals(".crep .mets:first-of-type .v");
    ok(st.join() === "4,1,1,1", "durum sayıları " + st.join());
    const tv = await vals(".crep .mets:nth-of-type(2) .v");
    ok(tv.join() === "3,800,100,12", "toplamlar " + tv.join());
    ok(await q(".amets:not([hidden])") === 3, "3 kartta ölçüm");
    ok(await q('[data-app="2"] .amets .b-sample') === 1 && await q('[data-app="2"] .amets .stat') === 3, "kart 2 örnek + 3 ölçüt");
    ok(await q('[data-app="4"] .amets .b-slate') === 1 && await q('[data-app="4"] .amets .mets') === 0, "kart 4 veri yok");
    ok(await q('[data-app="1"] .amets') === 0, "içeriksiz kartta ölçüm yok");
    await shot(`crep-sample-${sz}`, w);

    // 2) Canlı: rozet yok, gerçek toplamlar
    await open({ mode: "live" }, "campaign-7", w, h, mobile);
    ok(await q(".crep .b-sample") === 0 && await q(".amets .b-sample") === 0, "canlıda rozet yok");
    ok((await vals(".crep .mets:nth-of-type(2) .v")).join() === "3,800,100,12", "canlı toplamlar");
    ok((await txt('[data-app="3"] .amets .stat .v')) === "500", "kart 3 izlenme 500");
    await shot(`crep-live-${sz}`, w);

    // 3) Uç yok (404): kartlar bozulmaz, raporda örnek rozeti + veri yok
    await open({ mode: "404" }, "campaign-7", w, h, mobile);
    ok(await q(".amets:not([hidden])") === 0 && await q("[data-app]") === 4, "404: kartlar ölçümsüz, 4 kart");
    ok(await q(".crep h2 .b-sample") === 1, "404: örnek rozeti");
    ok(await q(".crep .mets:nth-of-type(2) .v.na") === 3, "404: 3 veri yok");
    await shot(`crep-404-${sz}`, w);

    // 4) EN, içerik bağlantısı yok
    await open({ mode: "live", lang: "en", noContent: true }, "campaign-7", w, h, mobile);
    ok((await txt(".crep h2")).startsWith("Campaign report"), "EN başlık");
    ok((await txt(".crep .hint")) === "View and engagement totals appear here as content links are submitted.", "EN boş ipucu");
    ok(!(await ev(`(window.__calls||[]).some(c=>c.includes("/metrics"))`)), "içerik yokken ölçüm çağrısı yok");
    await shot(`crep-en-${sz}`, w);

    // 5) Influencer: kendi başvurusunda ölçüm, rapor yok
    await open({ mode: "sample", role: "influencer" }, "campaign-7", w, h, mobile);
    ok(await q(".crep") === 0, "influencer'da rapor yok");
    ok(await q('[data-app="2"] .amets .b-sample') === 1, "influencer kartında örnek ölçüm");
    await shot(`crep-creator-${sz}`, w);
  }
  console.log(fails ? `HATA=${fails}` : "HATA=0");
  done(fails ? 1 : 0);
} catch (e) { console.log("HATA:", e.message); done(2); }
