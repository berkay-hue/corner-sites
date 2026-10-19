// brandcorner panel influencer tam profili (#creator-<id>) headless testi: sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-creator.mjs [ekranGörüntüsüKlasörü]   (8788 ve 9333 portları boş olmalı)
// Kontroller: örnek veri (404), 3x3 ızgara, kampanyaya ekle/çıkar (yerel ve API), açık kampanya yok, bulunamadı,
// çekmeceden profil bağlantısı, 44px dokunma hedefi, yatay taşma; 2000x924, 390x844 ve 375x812.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2]; if (OUT) mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:8788", PORT = 9333;
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SIZES = [["d", 2000, 924, false], ["m", 390, 844, true], ["s", 375, 812, true]];

// sc: { lang, live: gönderi API'si var mı, noOpen: açık kampanya yok }
const mock = sc => `(() => {
  const SC = ${JSON.stringify(sc)};
  const user = { id: 9, name: "Marka A.Ş.", email: "x@example.com", role: "brand", lang: SC.lang || "tr", profile: { company: "Marka" } };
  const inf = { id: "12", name: "Ece K.", city: "İstanbul", bio: "Güzellik ve günlük yaşam.", niches: ["beauty"], platforms: [{ platform: "instagram", handle: "ece", followers: 52000 }, { platform: "tiktok", handle: "ece.k", followers: 81000 }], history: [] };
  const NF = [404, { ok: false, error: "not_found" }];
  const R = (p, m) => {
    if (p === "auth/me") return { ok: true, user };
    if (p.startsWith("app/matches")) return NF;
    if (p.startsWith("app/influencers")) return { ok: true, influencers: [inf] };
    if (p === "app/campaigns") return { ok: true, campaigns: SC.noOpen ? [{ id: 5, title: "Eski", status: "closed" }] : [{ id: 7, title: "Yaz koleksiyonu", status: "open" }, { id: 8, title: "Kış", status: "open" }] };
    if (p === "app/metrics/12") return { ok: true, metrics: { mode: "sample", accounts: [{ platform: "instagram", handle: "ece", source: "sample", followers: 52000, avg_views: 15000, avg_likes: 2100, avg_comments: 80 }, { platform: "tiktok", handle: "ece.k", source: "sample", followers: 81000, avg_views: 40000, avg_likes: 5200, avg_comments: 140 }] } };
    if (p === "app/creators/12/posts") return SC.live ? { ok: true, posts: [
      { id: "a1", url: "https://instagram.com/p/a1", platform: "instagram", type: "reel", date: "2026-10-10", caption: "Sonbahar rutinim", likes: 3000, comments: 120, views: 41000, reach: 30000, verified: true },
      { id: "a2", url: "https://tiktok.com/@ece.k/video/2", platform: "tiktok", type: "video", date: "2026-10-05", caption: "Hızlı makyaj", likes: 6000, comments: 200, views: 90000 },
      { id: "a3", url: "javascript:alert(1)", platform: "instagram", type: "photo", date: "2026-09-30", caption: "<b>kalın</b>", likes: 1500, comments: 40, reach: 20000 }] } : NF;
    if (p.startsWith("app/campaigns/") && p.includes("/posts")) return SC.live ? { ok: true } : NF;
    if (p.startsWith("app/")) return { ok: true };
    return { ok: true };
  };
  const of = window.fetch.bind(window);
  window.fetch = (u, o = {}) => {
    u = String(u); if (!u.startsWith("http://localhost:8799/")) return of(u, o);
    const p = u.slice(22).split("?")[0], m = (o.method || "GET").toUpperCase();
    let r = R(p, m), st = 200;
    if (Array.isArray(r)) { st = r[0]; r = r[1]; }
    (window.__calls = window.__calls || []).push(m + " " + p + " " + st);
    return Promise.resolve(new Response(JSON.stringify(r), { status: st, headers: { "content-type": "application/json" } }));
  };
  try { localStorage.setItem("bc-token", "fake"); localStorage.setItem("brand-corner-lang", SC.lang || "tr"); } catch (e) {}
})();`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const server = spawn(process.execPath, [join(ROOT, "tools/serve.mjs"), join(ROOT, "sites/brandcorner.co"), "8788"], { stdio: "ignore" });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bccreator-"))}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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
  const calls = () => ev("window.__calls||[]");
  const pressed = () => ev(`[...document.querySelectorAll(".cgrid [data-cp]")].filter(b=>b.getAttribute("aria-pressed")==="true").length`);

  for (const [sz, w, h, mobile] of SIZES) {
    // 1) Gönderi API'si yok (404): örnek veri rozeti, 9 kart, yerel ekle/çıkar, yenilemede kalıcılık
    await open({}, "creator-12", w, h, mobile);
    ok((await txt("h1")) === "Ece K.", "başlık influencer adı");
    ok(await q(".cgrid .pcard") === 9, "3x3 = 9 kart");
    ok((await txt(".cb .meta .b-sample")) === "Örnek veri", "Örnek veri rozeti");
    ok(await q(".cacc li") === 2, "2 hesap ölçümü");
    ok(await q("#cr-camp option") === 2, "2 açık kampanya");
    await click('.cgrid [data-cp="c0"]'); await sleep(150);
    ok(await pressed() === 1, "ekle → 1 seçili");
    ok((await txt(".cb .ok")).length > 0, "eklendi notu");
    ok(await ev(`document.activeElement && document.activeElement.getAttribute("data-cp")`) === "c0", "odak düğmede kalır");
    ok(!(await calls()).some(c => c.startsWith("POST")), "örnek modda API'ye yazılmaz");
    const PK = `JSON.parse(localStorage.getItem("bc-posts-9") || "[]")`;
    ok(await ev(`${PK}.some(p => p.creator_id === "12" && p.src_post === "c0" && p.campaigns.length === 1 && p.campaigns[0] === 7 && p.snaps.length === 1)`), "gönderi kaydına yazılır (kampanya alanı)");
    ok(!(await ev(`Object.keys(localStorage).some(k => k.startsWith("bc-cposts-"))`)), "ayrı kampanya anahtarı yok");
    await shot(`creator-sample-${sz}`, w);
    await open({}, "creator-12", w, h, mobile, true);
    ok(await pressed() === 1, "yenilemede ekleme korunur");
    await setv("#cr-camp", "8"); await sleep(100);
    ok(await pressed() === 0, "başka kampanyada seçili yok");
    await setv("#cr-camp", "7"); await sleep(100);
    await click('.cgrid [data-cp="c0"]'); await sleep(150);
    ok(await pressed() === 0, "çıkar → 0 seçili");
    ok(await ev(`${PK}.length`) === 0, "çıkarınca kayıt silinir");
    // Eski bc-cposts anahtarı bir kez gönderi kaydına taşınır
    await ev(`localStorage.setItem("bc-cposts-9-7", JSON.stringify(["12:c1", "12:yok"]))`);
    await open({}, "creator-12", w, h, mobile, true);
    ok(await pressed() === 1, "eski kayıt taşındı → 1 seçili");
    ok(await ev(`document.querySelector('.cgrid [data-cp="c1"]').getAttribute("aria-pressed")`) === "true", "taşınan gönderi c1");
    ok(await ev(`${PK}.some(p => p.src_post === "c1" && p.campaigns[0] === 7)`), "taşınan kayıt gönderi kaydında");
    ok(await ev(`JSON.stringify(JSON.parse(localStorage.getItem("bc-cposts-9-7")))`) === '["12:yok"]', "eşleşmeyen eski kayıt korunur");
    await ev(`localStorage.setItem("bc-cposts-9-7", JSON.stringify(["12:c1"]))`);
    await open({}, "creator-12", w, h, mobile, true);
    ok(await ev(`localStorage.getItem("bc-cposts-9-7")`) === null, "boşalan eski anahtar silinir");
    ok(await ev(`${PK}.filter(p => p.src_post === "c1").length`) === 1, "ikinci taşıma çift kayıt üretmez");

    // 2) Gönderi API'si var: doğrulandı rozeti, güvensiz bağlantı atılır, POST/DELETE çağrıları; İngilizce
    await open({ live: true, lang: "en" }, "creator-12", w, h, mobile);
    ok(await q(".cgrid .pcard") === 3 && await q(".cb .meta .b-sample") === 0, "canlı: 3 kart, örnek rozeti yok");
    ok(await q(".cgrid .b-ok") === 1, "doğrulandı rozeti");
    ok(await q('.cgrid a[href^="javascript"]') === 0 && await q(".cgrid a[target=_blank]") === 2, "yalnız http(s) bağlantı");
    ok(await q(".cgrid b") > 0 && !(await ev(`document.querySelector(".cgrid").innerHTML.includes("<b>kalın")`)), "açıklama metin olarak");
    await click('.cgrid [data-cp="a1"]'); await sleep(200);
    ok((await calls()).includes("POST app/campaigns/7/posts 200"), "POST campaigns/7/posts");
    ok(await pressed() === 1, "canlı ekle");
    await click('.cgrid [data-cp="a1"]'); await sleep(200);
    ok((await calls()).includes("DELETE app/campaigns/7/posts/a1 200"), "DELETE campaigns/7/posts/a1");
    ok(await pressed() === 0, "canlı çıkar");
    await shot(`creator-live-en-${sz}`, w);

    // 3) Açık kampanya yok: düğme yok, yönlendirme notu
    await open({ noOpen: true }, "creator-12", w, h, mobile);
    ok(await q(".cgrid [data-cp]") === 0 && await q("#cr-camp") === 0, "açık kampanya yokken düğme yok");
    ok(await q('.cb a[href="#new"]') === 1, "yeni kampanya bağlantısı");
    await shot(`creator-noopen-${sz}`, w);

    // 4) Bulunamadı
    await open({}, "creator-99", w, h, mobile);
    ok(await q(".box.empty") === 1 && await q(".cgrid") === 0, "bulunamadı kutusu");

    // 5) Keşfet çekmecesinde tam profil bağlantısı
    await open({}, "discover", w, h, mobile);
    await click("[data-inf]"); await sleep(300);
    ok(await q('dialog[open] a[href="#creator-12"]') === 1, "çekmecede tam profil bağlantısı");
    await click('dialog[open] a[href="#creator-12"]'); await sleep(900);
    ok(await ev("location.hash") === "#creator-12" && await q("dialog[open]") === 0 && await q(".cgrid .pcard") === 9, "bağlantı profil sayfasını açar, çekmece kapanır");
  }
  console.log(fails ? `HATA=${fails}` : "HATA=0");
  done(fails ? 1 : 0);
} catch (e) { console.log("HATA:", e.message); done(2); }
