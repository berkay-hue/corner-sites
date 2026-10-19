// brandcorner panel "Gönderiler" sunucu kaydı (app/posts) headless testi: sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-posts-api.mjs [ekranGörüntüsüKlasörü]   (8788 ve 9333 portları boş olmalı)
// Kontroller: 404/503'te bu cihaz + örnek veri rozeti, boş sunucuda rozet, sunucu gönderileri, elle ekleme ve ölçüm → app/posts/manual,
// 120 satır CSV → 50'lik 3 import isteği, bir kerelik "sunucuya aktar", silme gizli, bağlantı kartı + LinkedIn notu, TR/EN; 2000x924, 390x844, 375x812.
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

// sc: { lang, srv: "posts" | "empty" | "404" | "503" }
const mock = sc => `(() => {
  const SC = ${JSON.stringify(sc)};
  const user = { id: 41, name: "Deniz A.", email: "x@example.com", role: "influencer", lang: SC.lang || "tr", profile: { city: "İzmir", bio: "Günlük yaşam içerikleri.", niches: ["beauty"], platforms: [{ name: "instagram", handle: "deniz", followers: 24000 }], listed: true } };
  const SRV = [
    { id: "101", url: "https://www.instagram.com/p/SRV1/", platform: "instagram", type: "reel", date: "2026-10-01", caption: "Sunucu bir", thumb: "", snaps: [{ at: "2026-10-01", likes: 100, comments: 5, views: 3000, reach: 2000 }, { at: "2026-10-04", likes: 300, comments: 9, views: 8000, reach: 6000 }] },
    { id: "102", url: "https://www.tiktok.com/@deniz/video/77", platform: "tiktok", type: "video", date: "2026-09-28", caption: "Sunucu iki", thumb: "", snaps: [{ at: "2026-09-28", likes: 50, comments: 2, views: 900, reach: null }] }];
  let B = {};
  const R = p => {
    if (p === "auth/me") return { ok: true, user };
    if (p.startsWith("app/connections")) {
      if (SC.conn === "err") return [500, { ok: false, error: "server" }];
      if (SC.conn === "on") return { ok: true, connectable: ["instagram", "tiktok", "youtube"], connections: [{ platform: "instagram", status: "connected" }] };
      return { ok: true, disabled: true, connectable: [], connections: [] };
    }
    if (p.startsWith("app/applications")) return { ok: true, applications: [] };
    if (p === "app/posts") {
      if (SC.srv === "404") return [404, { ok: false, error: "not_found" }];
      if (SC.srv === "503") return [503, { ok: false, error: "not_ready" }];
      return { ok: true, posts: SC.srv === "posts" ? SRV : [] };
    }
    if (p === "app/posts/manual") return { ok: true, post: SRV[0], added: true };
    if (p === "app/posts/import") return { ok: true, added: B.rows.length, updated: 0, skipped: [] };
    if (p.startsWith("app/")) return { ok: true };
    return { ok: true };
  };
  const of = window.fetch.bind(window);
  window.fetch = (u, o = {}) => {
    u = String(u); if (!u.startsWith("http://localhost:8799/")) return of(u, o);
    const p = u.slice(22), m = (o.method || "GET").toUpperCase();
    try { B = o.body ? JSON.parse(o.body) : {}; } catch (e) { B = {}; }
    (window.__bodies = window.__bodies || []).push([m + " " + p, B]);
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
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bcpostsapi-"))}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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

  const T44 = `[...document.querySelectorAll("button,a[href],input,select,textarea,summary")].filter(n=>{const r=n.getBoundingClientRect();if(!r.width||!r.height)return false;const s=getComputedStyle(n);if(s.visibility==="hidden")return false;if(n.tagName==="A"&&s.display==="inline")return false;if(n.matches("a.pl"))return false;return r.height<44||r.width<44&&!/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName)}).map(n=>{const r=n.getBoundingClientRect();return n.tagName.toLowerCase()+"."+(n.className||"")+"["+(n.textContent||n.getAttribute("aria-label")||"").trim().slice(0,20)+"] "+Math.round(r.width)+"x"+Math.round(r.height)})`;
  let scriptId;
  const open = async (sc, hash, w, h, mobile, keep, posts) => {
    if (scriptId) await cmd("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
    scriptId = (await cmd("Page.addScriptToEvaluateOnNewDocument", { source: mock(sc) })).result.identifier;
    await cmd("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
    await cmd("Page.navigate", { url: "about:blank" }); await sleep(150);
    if (!keep) { await cmd("Page.navigate", { url: BASE + "/404" }); await sleep(250); await ev("localStorage.clear()"); if (posts) await ev(`localStorage.setItem("bc-posts-41", ${JSON.stringify(JSON.stringify(posts))})`); }
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

  const calls = pfx => ev(`(window.__calls||[]).filter(c=>c.startsWith(${JSON.stringify(pfx)}))`);
  const bodies = pfx => ev(`(window.__bodies||[]).filter(b=>b[0]===${JSON.stringify(pfx)}).map(b=>b[1])`);
  const hint = () => ev(`[...document.querySelectorAll(".hint")].map(n=>n.textContent).join(" | ")`);
  const conn = async what => { ok(await ev(`[...document.querySelectorAll(".card .pnote")].some(n=>/LinkedIn/.test(n.textContent))`), what + ": LinkedIn notu"); ok(await q(".card h2") >= 2, what + ": bağlantı kartı"); };
  const LOCAL = [{ id: "l1", url: "https://www.instagram.com/p/LOC1/", platform: "instagram", type: "photo", date: "2026-09-10", caption: "Yerel", thumb: "", snaps: [{ at: "2026-09-10", likes: 10, comments: 1, views: null, reach: 100 }, { at: "2026-09-12", likes: 20, comments: 2, views: null, reach: 200 }] }];

  for (const [sz, w, h, mobile] of SIZES) {
    // 1) Sunucu kapalı (404): bu cihaz, örnek veri rozeti, aktarma yok
    await open({ srv: "404" }, "posts", w, h, mobile);
    ok(await q(".banner .b-sample") === 1, "404: örnek veri rozeti");
    ok(/bu cihazda/.test(await hint()), "404: yerel notu");
    ok(await q(".pmove") === 0 && !/Sunucuya aktar/.test(await txt("main")), "404: aktarma yok");
    await conn("404");
    await shot(`posts-api-404-${sz}`, w);

    // 2) 503 (tablolar hazır değil): yine bu cihaz
    await open({ srv: "503" }, "posts", w, h, mobile);
    ok(await q(".banner .b-sample") === 1 && /bu cihazda/.test(await hint()), "503: yerel + rozet");

    // 3) Sunucu boş: rozet kalır, hesap notu
    await open({ srv: "empty" }, "posts", w, h, mobile);
    ok(await q(".banner .b-sample") === 1, "boş sunucu: rozet");
    ok(/hesabında/.test(await hint()), "boş sunucu: hesap notu");

    // 4) Sunucu gönderileri: rozet yok, 2 kart, silme gizli
    await open({ srv: "posts" }, "posts", w, h, mobile);
    ok(await q(".banner .b-sample") === 0, "sunucu: rozet yok");
    ok(await q(".pgrid .pcard, .plist .prow2") === 2, "sunucu: 2 kart");
    await conn("sunucu");
    await shot(`posts-api-srv-${sz}`, w);

    // 5) Elle ekleme → app/posts/manual
    await ev(`document.querySelectorAll("details.pd")[0].open=true`);
    await setv("#pa-url", "https://www.instagram.com/p/NEW9/"); await setv("#pa-cap", "Yeni"); await setv("#pa-likes", "12"); await setv("#pa-reach", "400");
    await ev(`document.querySelector("#pa-url").form.requestSubmit()`); await sleep(600);
    const mb = await bodies("POST app/posts/manual");
    ok(mb.length === 1 && mb[0].url === "https://www.instagram.com/p/NEW9/" && mb[0].likes === 12 && mb[0].reach === 400 && mb[0].views === null, "elle ekleme gövdesi " + JSON.stringify(mb[0] || {}));
    ok(/eklendi/.test(await txt(".ok")), "elle ekleme notu");
    ok(!(await ev(`localStorage.getItem("bc-posts-41")`)), "sunucu modunda yerel yazım yok");

    // 6) 120 satır CSV → 3 import isteği (50/50/20)
    let csv = "url,date,type,likes,comments,views,reach\n";
    for (let i = 0; i < 120; i++) csv += `https://www.instagram.com/p/C${i}/,2026-10-01,photo,${i},1,,${i * 10}\n`;
    await ev(`document.querySelectorAll("details.pd")[1].open=true`);
    await ev(`(()=>{const i=document.querySelector("#pc-file");const dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(csv)}],"p.csv",{type:"text/csv"}));i.files=dt.files;i.form.requestSubmit();return true})()`); await sleep(1200);
    const ib = await bodies("POST app/posts/import");
    ok(ib.map(b => b.rows.length).join() === "50,50,20", "CSV parçaları " + ib.map(b => b.rows.length).join());
    ok(ib.length && ib[0].rows[3].likes === 3 && ib[0].rows[3].views === null && ib[2].rows[19].url.endsWith("/C119/"), "CSV satır alanları");
    ok(/120/.test(await txt(".ok")), "CSV notu: " + await txt(".ok"));

    // 7) Detay: ölçüm → manual (at ile), silme yerine not
    await ev(`location.hash="#post-101"`); await sleep(600);
    ok(await q("table.snaps tbody tr") === 2, "sunucu detay 2 ölçüm");
    ok(await q(".ghost.bad") === 0 && /silme henüz yok/.test(await txt("main")), "silme gizli");
    await setv("#ps-at", "2026-10-06"); await setv("#ps-likes", "500"); await setv("#ps-comments", "11"); await setv("#ps-reach", "7000");
    await ev(`document.querySelector("#ps-at").form.requestSubmit()`); await sleep(600);
    const sb = (await bodies("POST app/posts/manual")).pop() || {};
    ok(sb.url === "https://www.instagram.com/p/SRV1/" && sb.at === "2026-10-06" && sb.likes === 500 && sb.type === "reel", "ölçüm gövdesi " + JSON.stringify(sb));
    await shot(`post-api-detail-${sz}`, w);

    // 8) Bu cihazdaki gönderiler + sunucu: bir kerelik aktarma
    await open({ srv: "empty" }, "posts", w, h, mobile, false, LOCAL);
    ok(/Sunucuya aktar/.test(await txt("main")), "aktar düğmesi");
    await shot(`posts-api-move-${sz}`, w);
    await ev(`[...document.querySelectorAll("button")].find(b=>b.textContent==="Sunucuya aktar").click()`); await sleep(700);
    const mv = await bodies("POST app/posts/import");
    ok(mv.length === 1 && mv[0].rows.length === 2 && mv[0].rows[1].at === "2026-09-12" && mv[0].rows[1].reach === 200, "aktarma gövdesi " + JSON.stringify(mv[0] || {}));
    ok(await ev(`localStorage.getItem("bc-posts-moved-41")`) === "1", "aktarma bayrağı");
    ok(/aktarıldı/.test(await txt(".ok")), "aktarma notu");
    await open({ srv: "empty" }, "posts", w, h, mobile, true);
    ok(!/Sunucuya aktar/.test(await txt("main")), "aktarma bir kez");

    // 9) EN
    await open({ srv: "posts", lang: "en" }, "posts", w, h, mobile);
    ok(/stored in your account/.test(await hint()), "EN hesap notu");
    await open({ srv: "empty", lang: "en" }, "posts", w, h, mobile, false, LOCAL);
    ok(/Move to my account/.test(await txt("main")), "EN aktar");
    await shot(`posts-api-en-${sz}`, w);
  }
  console.log(fails ? `HATA=${fails}` : "HATA=0");
  done(fails ? 1 : 0);
} catch (e) { console.log("HATA:", e.message); done(2); }
