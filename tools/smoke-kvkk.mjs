// brandcorner panel Ayarlar "Verilerin" (KVKK dışa aktarma) headless testi: sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-kvkk.mjs [ekranGörüntüsüKlasörü]   (8788 ve 9333 portları boş olmalı)
// Kontroller: app/export 404 → "Örnek veri" rozeti + cihazdaki verilerle JSON (oturum anahtarı yok), sunucu verisi aynen iner,
// 500'de hata ve indirme yok, EN metinler + silme talebi mailto, kart içinde 44px dokunma hedefi, yatay taşma; 2000x924, 390x844, 375x812.
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


// sc: { lang, role, ex }  ex: undefined = 404, "err" = 500, nesne = sunucu verisi
const mock = sc => `(() => {
  const SC = ${JSON.stringify(sc)};
  const user = { id: 41, name: "Deniz A.", email: "x@example.com", role: SC.role || "influencer", lang: SC.lang || "tr", profile: { company: "Acme", city: "İzmir", bio: "Günlük yaşam içerikleri.", niches: ["beauty"], platforms: [{ name: "instagram", handle: "deniz", followers: 24000 }], listed: true } };
  const R = p => {
    if (p === "auth/me") return { ok: true, user };
    if (p === "app/notify") return { ok: true, notify: {}, sending: true };
    if (p === "app/export") return SC.ex === undefined ? [404, { ok: false, error: "not_found" }] : SC.ex === "err" ? [500, { ok: false, error: "server" }] : { ok: true, export: SC.ex };
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
  const cu = URL.createObjectURL.bind(URL);
  URL.createObjectURL = b => { window.__blob = b; return cu(b); };
  const ck = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.hasAttribute("download")) { (window.__dl = window.__dl || []).push(this.getAttribute("download")); return; } return ck.call(this); };
  window.confirm = () => true;
  try { localStorage.setItem("bc-token", "fake-token-xyz"); localStorage.setItem("brand-corner-lang", SC.lang || "tr"); } catch (e) {}
})();`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const server = spawn(process.execPath, [join(ROOT, "tools/serve.mjs"), join(ROOT, "sites/brandcorner.co"), "8788"], { stdio: "ignore" });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bckvkk-"))}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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

  const T44 = `[...document.querySelectorAll("section.card")].filter(c=>{const h=c.querySelector("h2");return h&&/^(Verilerin|Your data)$/.test(h.textContent)}).flatMap(c=>[...c.querySelectorAll("button,a[href]")]).filter(n=>{const r=n.getBoundingClientRect();if(!r.width||!r.height)return false;return r.height<44||r.width<44}).map(n=>{const r=n.getBoundingClientRect();return n.tagName.toLowerCase()+"["+n.textContent.trim().slice(0,20)+"] "+Math.round(r.width)+"x"+Math.round(r.height)})`;

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
  const KV = `[...document.querySelectorAll("section.card")].find(c=>/^(Verilerin|Your data)$/.test(c.querySelector("h2")?.textContent||""))`;
  const kvBtn = `${KV}.querySelector("button")`;
  const file = async () => JSON.parse(await ev(`window.__blob ? window.__blob.text() : "null"`));
  const POSTS = [{ id: "a1", url: "https://www.instagram.com/p/a1/", platform: "instagram", snaps: [{ at: "2026-10-01", likes: 5, comments: 1, views: null, reach: 90 }] }];

  for (const [sz, w, h, mobile] of SIZES) {
    // 1) Uç yok (404): rozet, cihaz verisiyle dosya, anahtar dosyada yok
    await open({}, "settings", w, h, mobile, POSTS);
    ok(await ev(`!!${KV}`), "Verilerin kartı");
    ok(await ev(`${KV}.querySelectorAll(".b-sample").length`) === 0, "tıklamadan önce rozet yok");
    await ev(`${kvBtn}.click()`); await sleep(300);
    ok(await ev(`(window.__calls||[]).includes("GET app/export 404")`), "GET app/export 404");
    ok(await ev(`${KV}.querySelector(".b-sample")?.textContent`) === "Örnek veri", "Örnek veri rozeti");
    ok(await ev(`${KV}.querySelector(".ok").textContent`) === "Dosya indirildi.", "indirildi notu");
    const dl = await ev(`(window.__dl||[]).join()`);
    ok(/^brandcorner-verilerim-\d{4}-\d{2}-\d{2}\.json$/.test(dl), "dosya adı " + dl);
    const f1 = await file();
    ok(f1 && f1.source === "device" && f1.user.id === 41 && f1.posts.length === 1 && f1.posts[0].id === "a1", "cihaz verisi");
    ok(!(await ev(`window.__blob.text()`)).includes("fake-token-xyz"), "oturum anahtarı dosyada yok");
    await shot(`kvkk-sample-${sz}`, w);

    // 2) Sunucu verisi: aynen iner, rozet yok
    const EX = { user: { id: 41, name: "Deniz A." }, campaigns: [], applications: [{ id: 7 }] };
    await open({ ex: EX }, "settings", w, h, mobile);
    await ev(`${kvBtn}.click()`); await sleep(300);
    ok(JSON.stringify(await file()) === JSON.stringify(EX), "sunucu verisi aynen");
    ok(await ev(`${KV}.querySelectorAll(".b-sample").length`) === 0, "sunucuda rozet yok");
    await shot(`kvkk-server-${sz}`, w);

    // 3) Sunucu hatası: mesaj, indirme yok
    await open({ ex: "err" }, "settings", w, h, mobile);
    await ev(`${kvBtn}.click()`); await sleep(300);
    ok(!!(await ev(`${KV}.querySelector(".msg").textContent`)), "hata mesajı");
    ok(await ev(`(window.__dl||[]).length`) === 0, "hatada indirme yok");
    ok(!(await ev(`${kvBtn}.disabled`)), "düğme yeniden açık");
    await shot(`kvkk-err-${sz}`, w);

    // 4) EN marka: başlık, silme talebi mailto
    await open({ lang: "en", role: "brand" }, "settings", w, h, mobile);
    ok(await ev(`${kvBtn}.textContent`) === "Download my data", "EN düğme");
    const mt = await ev(`${KV}.querySelector('a[href^="mailto:"]').getAttribute("href")`);
    ok(mt === "mailto:info@saascorner.co?subject=" + encodeURIComponent("Brand Corner account and data deletion request"), "mailto " + mt);
    await shot(`kvkk-en-${sz}`, w);
  }
  console.log(fails ? `HATA=${fails}` : "HATA=0");
  done(fails ? 1 : 0);
} catch (e) { console.log("HATA:", e.message); done(2); }
