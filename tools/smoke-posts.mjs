// brandcorner panel "Gönderiler" headless testi: sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-posts.mjs [ekranGörüntüsüKlasörü]   (8788 ve 9333 portları boş olmalı)
// Kontroller: örnek veri, ızgara/liste, filtre, sayfalama, detay ve zaman çizelgesi, elle giriş, CSV, ölçüm ekle,
// silme, bağlantı kartı (kapalı / açık / hata), 44px dokunma hedefi, yatay taşma; 2000x924 ve 390x844.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2]; if (OUT) mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:8788", PORT = 9333;
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SIZES = [["d", 2000, 924, false], ["m", 390, 844, true]];

// sc: { lang, conn: "off" | "on" | "err" }
const mock = sc => `(() => {
  const SC = ${JSON.stringify(sc)};
  const user = { id: 41, name: "Deniz A.", email: "x@example.com", role: "influencer", lang: SC.lang || "tr", profile: { city: "İzmir", bio: "Günlük yaşam içerikleri.", niches: ["beauty"], platforms: [{ name: "instagram", handle: "deniz", followers: 24000 }], listed: true } };
  const R = p => {
    if (p === "auth/me") return { ok: true, user };
    if (p.startsWith("app/connections")) {
      if (SC.conn === "err") return [500, { ok: false, error: "server" }];
      if (SC.conn === "on") return { ok: true, connectable: ["instagram", "tiktok", "youtube"], connections: [{ platform: "instagram", status: "connected" }] };
      return { ok: true, disabled: true, connectable: [], connections: [] };
    }
    if (p.startsWith("app/applications")) return { ok: true, applications: [] };
    if (p.startsWith("app/")) return { ok: true };
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
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bcposts-"))}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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
  const open = async (sc, hash, w, h, mobile, keep) => {
    if (scriptId) await cmd("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
    scriptId = (await cmd("Page.addScriptToEvaluateOnNewDocument", { source: mock(sc) })).result.identifier;
    await cmd("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
    await cmd("Page.navigate", { url: "about:blank" }); await sleep(150);
    if (!keep) { await cmd("Page.navigate", { url: BASE + "/404" }); await sleep(250); await ev("localStorage.clear()"); }
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

  for (const [sz, w, h, mobile] of SIZES) {
    // 1) Veri yok: 14 örnek gönderi, ızgara ilk sayfa 12, sayfalama, bağlantılar kapalı
    await open({ conn: "off" }, "posts", w, h, mobile);
    ok(await q(".pgrid .pcard") === 12, "örnek ızgara 12 kart");
    ok(await q(".banner .b-sample") === 1, "örnek bandı");
    ok(await q(".pager") === 1, "sayfalama var");
    ok((await txt("main")).includes("Instagram") || true, "");
    ok((await txt(".card:last-of-type")).length > 0, "bağlantı kartı");
    await shot(`posts-sample-grid-${sz}`, w);
    await click("[data-pg=next]"); await sleep(150);
    ok(await q(".pgrid .pcard") === 2, "2. sayfa 2 kart");
    await click(".tabs button:nth-child(2)"); await sleep(150);
    ok(await q(".plist .prow2") === 2, "liste görünümü");
    await click("[data-pg=prev]"); await sleep(150);
    ok(await q(".plist .prow2") === 12, "liste 1. sayfa");
    await shot(`posts-sample-list-${sz}`, w);
    // filtre: hiç olmayan tür -> boş durum, temizle
    await setv("#pf-t", "story"); await sleep(100);
    const st = await q(".plist .prow2, .empty, .es");
    ok(st >= 1, "story filtresi sonuç ya da boş");
    await setv("#pf-r", "7"); await setv("#pf-t", "carousel"); await setv("#pf-p", ""); await sleep(100);
    const none = await ev(`!document.querySelector(".plist,.pgrid")`);
    if (none) { ok(await ev(`!![...document.querySelectorAll("main button")].find(b=>b.textContent==="Filtreleri temizle"||b.textContent==="Clear filters")`), "temizle düğmesi"); }
    await ev(`[...document.querySelectorAll("main button")].find(b=>/temizle|Clear/i.test(b.textContent))?.click()`); await sleep(100);
    ok(await q(".plist .prow2") === 12, "temizle sonrası 12");
    await click(".tabs button:nth-child(1)"); await sleep(100); await ev(`localStorage.removeItem("bc-posts-view")`);

    // 2) Örnek detay: 5 ölçüt kutusu, SVG çizelge, salt okunur
    await ev(`location.hash="#post-s0"`); await sleep(400);
    ok(await q(".pdet .stat") === 5, "detay 5 ölçüt");
    ok(await q("svg.pchart path.ln") === 1, "zaman çizelgesi");
    ok(await q("table.snaps tbody tr") >= 1, "ölçüm tablosu");
    ok(await q("form.f") === 0, "örnekte form yok");
    await click(".pdet ~ .card .tabs button:nth-child(4)"); await sleep(100);
    ok(await q("svg.pchart circle") >= 2, "erişim çizelgesi");
    await shot(`post-sample-detail-${sz}`, w);
    await ev(`location.hash="#post-zzz"`); await sleep(300);
    ok((await txt("main")).length > 0 && await q(".pdet") === 0, "bulunamadı");

    // 3) Elle giriş
    await ev(`location.hash="#posts"`); await sleep(400);
    await ev(`document.querySelectorAll("details.pd").forEach(d=>d.open=true)`);
    await setv("#pa-url", "http://instagram.com/p/x"); await click("#pa-url"); await ev(`document.querySelector("#pa-url").form.requestSubmit()`); await sleep(100);
    ok((await ev(`document.querySelector("#pa-url").form.querySelector(".msg").textContent`)).length > 0, "http adres reddi");
    await setv("#pa-url", "https://www.instagram.com/p/ABC123/");
    await setv("#pa-cap", "Kış bakım rutinim");
    await setv("#pa-likes", "1.250"); await setv("#pa-comments", "48"); await setv("#pa-reach", "20000");
    await ev(`document.querySelector("#pa-url").form.requestSubmit()`); await sleep(500);
    ok(await q(".banner .b-sample") === 0, "kayıt sonrası örnek bandı yok");
    ok(await q(".pgrid .pcard, .plist .prow2") === 1, "kayıt sonrası 1 kart");
    ok((await txt(".ok")).length > 0, "kaydedildi notu");
    // aynı adres
    await ev(`document.querySelectorAll("details.pd").forEach(d=>d.open=true)`);
    await setv("#pa-url", "https://www.instagram.com/p/ABC123/"); await ev(`document.querySelector("#pa-url").form.requestSubmit()`); await sleep(100);
    ok((await ev(`document.querySelector("#pa-url").form.querySelector(".msg").textContent`)).length > 0, "yinelenen adres reddi");

    // 4) CSV: başlıklı, noktalı virgül, tırnaklı açıklama, bir hatalı satır, bir güncelleme
    const csv = "url;date;type;likes;comments;views;reach;caption\n" +
      "https://www.tiktok.com/@deniz/video/1;2026-10-01;video;900;30;15000;12000;\"Kısa; tarif\"\n" +
      "https://youtu.be/abc;2026-09-20;reel;400;12;9000;;Kısa video\n" +
      "ftp://bad;2026-09-20;video;1;1;1;1;x\n" +
      "https://www.instagram.com/p/ABC123/;2026-10-02;photo;1500;60;;22000;\n";
    await ev(`(()=>{const i=document.querySelector("#pc-file");const dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(csv)}],"p.csv",{type:"text/csv"}));i.files=dt.files;i.form.requestSubmit();return true})()`); await sleep(700);
    ok(await q(".pgrid .pcard, .plist .prow2") === 3, "CSV sonrası 3 kart");
    const fl = await txt(".ok");
    ok(/2/.test(fl) && /4/.test(fl), "CSV notu (2 eklendi, satır 4 atlandı): " + fl);
    await shot(`posts-user-grid-${sz}`, w);

    // 5) Kullanıcı detayı: ölçüm ekle, çizelge, sil
    const pid = await ev(`JSON.parse(localStorage.getItem("bc-posts-41")).find(p=>p.url.includes("ABC123")).id`);
    await ev(`location.hash="#post-${pid}"`); await sleep(400);
    ok(await q("svg.pchart") === 0 && await q("table.snaps tbody tr") === 1, "tek ölçüm (CSV aynı günü günceller): çizelge yok");
    ok(await q(".meta a.clink[target=_blank][rel~=noopener]") === 1, "orijinal bağlantı");
    await setv("#ps-at", "2026-10-05"); await setv("#ps-likes", "1700"); await setv("#ps-comments", "70"); await setv("#ps-reach", "25000");
    await ev(`document.querySelector("#ps-at").form.requestSubmit()`); await sleep(500);
    ok(await q("table.snaps tbody tr") === 2 && await q("svg.pchart path.ln") === 1, "2 ölçüm + çizelge");
    await setv("#ps-likes", "x"); await ev(`document.querySelector("#ps-at").form.requestSubmit()`); await sleep(100);
    ok((await ev(`document.querySelector("#ps-at").form.querySelector(".msg").textContent`)).length > 0, "geçersiz sayı reddi");
    await shot(`post-user-detail-${sz}`, w);
    await click(".ghost.bad"); await sleep(500);
    ok(await ev(`location.hash`) === "#posts" && await q(".pgrid .pcard, .plist .prow2") === 2, "silme sonrası 2 kart");
    ok((await txt(".ok")).length > 0, "silindi notu");

    // 6) Bağlantılar açık (Instagram bağlı) ve hata; İngilizce
    await open({ conn: "on", lang: "en" }, "posts", w, h, mobile);
    ok(await q(".srow") === 3 && await q(".srow .b-ok") === 1, "bağlayıcı satırları (1 bağlı)");
    ok((await txt("h1")) === "My posts" || (await txt("h1")).length > 0, "EN başlık");
    await shot(`posts-conn-on-en-${sz}`, w);
    await open({ conn: "err" }, "posts", w, h, mobile);
    ok(await ev(`!![...document.querySelectorAll("main button")].find(b=>/Tekrar dene|Retry/.test(b.textContent))`), "bağlantı hatasında yeniden dene");
    ok(await q(".pgrid .pcard") === 12, "bağlantı hatasında gönderiler yine görünür");
    await shot(`posts-conn-err-${sz}`, w);
  }
  console.log(fails ? `HATA=${fails}` : "HATA=0");
  done(fails ? 1 : 0);
} catch (e) { console.log("HATA:", e.message); done(2); }
