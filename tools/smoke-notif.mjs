// brandcorner panel bildirim listesi (#notifications) headless testi: sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-notif.mjs [ekranGörüntüsüKlasörü]   (8788 ve 9333 portları boş olmalı)
// Kontroller: 404 → örnek liste + rozet (marka/influencer), sunucu listesi, okundu say (localStorage), menü sayısı,
// güvensiz bağlantı yok sayılır, boş durum, TR/EN, 44px dokunma hedefi, yatay taşma; 2000x924, 390x844 ve 375x812.
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
    if (p === "app/notifications") return SC.nf === undefined ? [404, { ok: false, error: "not_found" }] : { ok: true, notifications: SC.nf };
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
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bcnotif-"))}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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

  const T44 = `[...document.querySelectorAll("main button,main a[href],main input,main select,main textarea,main summary,#ntf,#ntf2")].filter(n=>{const r=n.getBoundingClientRect();if(!r.width||!r.height)return false;const s=getComputedStyle(n);if(s.visibility==="hidden")return false;if(n.tagName==="A"&&s.display==="inline")return false;return r.height<44||r.width<44&&!/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName)}).map(n=>{const r=n.getBoundingClientRect();return n.tagName.toLowerCase()+"."+(n.className||"")+"["+(n.textContent||n.getAttribute("aria-label")||"").trim().slice(0,20)+"] "+Math.round(r.width)+"x"+Math.round(r.height)})`;


  let scriptId;
  const open = async (sc, hash, w, h, mobile, read) => {
    if (scriptId) await cmd("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
    scriptId = (await cmd("Page.addScriptToEvaluateOnNewDocument", { source: mock(sc) })).result.identifier;
    await cmd("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
    await cmd("Page.navigate", { url: "about:blank" }); await sleep(150);
    await cmd("Page.navigate", { url: BASE + "/404" }); await sleep(250); await ev("localStorage.clear()");
    if (read) await ev(`localStorage.setItem("bc-notif-read-41", ${JSON.stringify(JSON.stringify(read))})`);
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


  const hr = n => new Date(Date.now() - n * 36e5).toISOString().slice(0, 19).replace("T", " ");
  const LIST = [
    { id: 1, kind: "apply", text: "Yeni başvuru: Ayşe", link: "#campaign-7", at: hr(1) },
    { id: 2, kind: "content", text: "İçerik onay bekliyor", link: "javascript:alert(1)", at: hr(30) },
    { id: 3, kind: "other", text: "Eski bildirim", link: "#campaigns", at: hr(24 * 20), read: true }];
  const menuCnt = () => ev(`(document.querySelector(${JSON.stringify("#ntf .cnt")})||{}).textContent||""`);

  for (const [sz, w, h, mobile] of SIZES) {
    // 1) 404: influencer örnek liste, rozet, 3 okunmamış, bağlantılar
    await open({}, "notifications", w, h, mobile);
    ok((await txt("main h1")) === "Bildirimler", "başlık");
    ok(await q("main .b-sample") === 1, "örnek veri rozeti");
    ok(await q(".nf li") === 3 && await q(".nf li.un") === 3, "3 örnek, hepsi okunmamış");
    ok(await ev(`[...document.querySelectorAll(".nf a.nfa")].map(a=>a.getAttribute("href")).join()`) === "#applications,#applications,#posts", "influencer bağlantıları");
    ok((await menuCnt()) === "3", "menü sayısı 3");
    ok(await ev(`document.querySelector("#ntf").getAttribute("aria-current")`) === "page", "menü aria-current");
    await shot(`notif-sample-${sz}`, w);
    ok(await click(".nfhead button"), "tümünü okundu düğmesi");
    ok(await q(".nf li.un") === 0 && await q(".nf .dot") === 0, "okundu sonrası nokta yok");
    ok((await txt(".nfhead .meta")) === "Hepsi okundu." && await q(".nfhead button") === 0, "hepsi okundu metni");
    ok((await menuCnt()) === "", "menü sayısı silindi");
    ok(await ev(`Object.keys(JSON.parse(localStorage.getItem("bc-notif-read-41"))).join()`) === "s1,s2,s3", "okundu bilgisi kaydedildi");

    // 2) Marka örneği, önceden okunmuş s1
    await open({ role: "brand" }, "notifications", w, h, mobile, { s1: 1 });
    ok(await q(".nf li") === 3 && await q(".nf li.un") === 2, "marka: 2 okunmamış");
    ok(await ev(`[...document.querySelectorAll(".nf a.nfa")].every(a=>a.getAttribute("href")==="#campaigns")`), "marka bağlantıları");
    ok((await txt(".nfhead .meta")) === "2 okunmamış", "okunmamış sayısı metni");
    await shot(`notif-brand-${sz}`, w);

    // 3) Sunucu listesi: rozet yok, güvensiz bağlantı satır olur, read:true sayılır, tıklayınca okundu
    await open({ nf: LIST }, "notifications", w, h, mobile);
    ok(await q("main .b-sample") === 0, "gerçek veride rozet yok");
    ok(await q(".nf a.nfa") === 2 && await q(".nf div.nfa") === 1, "güvensiz bağlantı yok sayıldı");
    ok(await q('a[href^="javascript"]') === 0, "javascript: bağlantısı yok");
    ok(await q(".nf li.un") === 2, "read:true okunmuş sayıldı");
    ok(/önce|saat/.test(await txt(".nf li .tx span")), "göreli zaman");
    ok(await ev(`document.querySelectorAll(".nf .ic")[2].innerHTML.includes("path")`), "bilinmeyen tür simgesi");
    await shot(`notif-real-${sz}`, w);
    await click('.nf a[href="#campaign-7"]'); await sleep(400);
    ok(await ev(`!!JSON.parse(localStorage.getItem("bc-notif-read-41"))["1"]`), "tıklanan okundu");

    // 4) Boş liste, EN
    await open({ lang: "en", nf: [] }, "notifications", w, h, mobile);
    ok((await txt("main h1")) === "Notifications" && (await txt(".nfhead .meta")) === "All caught up.", "EN başlık");
    ok((await txt("main .empty p")) === "No notifications yet.", "EN boş durum");
    ok((await txt("#ntf span")) === "Notifications", "EN menü");
    await shot(`notif-empty-en-${sz}`, w);
  }
  console.log(fails ? `HATA=${fails}` : "HATA=0");
  done(fails ? 1 : 0);
} catch (e) { console.log("HATA:", e.message); done(2); }
