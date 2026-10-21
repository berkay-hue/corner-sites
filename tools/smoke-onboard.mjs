// brandcorner panel ilk giriş sosyal hesap bağlama adımı headless testi: sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-onboard.mjs [ekranGörüntüsüKlasörü]   (8788 ve 9333 portları boş olmalı)
// Kontroller: hiç bağlı hesap yoksa pencere açılır (influencer 4 platform, marka/ajans `connectable` listesi), "Şimdilik geç" / Esc /
// Profil bağlantısı bayrağı yazar ve pencere bir daha açılmaz, bağlı hesap varsa açılmaz, ölçüm kapalı / "yakında" / sağlayıcıdan
// dönüşte açılmaz, "Bağla" app/connect çağırır, TR/EN, 44px dokunma hedefi, taşma; 2000x924, 390x844 ve 375x812.
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
const ALL = ["instagram", "tiktok", "youtube", "linkedin"];

// sc: { lang, role, conn: app/connections yanıtı ya da [durum, gövde] }
const mock = sc => `(() => {
  const SC = ${JSON.stringify(sc)};
  const user = { id: 41, name: "Deniz A.", email: "x@example.com", role: SC.role || "influencer", lang: SC.lang || "tr", profile: { company: "Acme", city: "İzmir", bio: "Günlük yaşam içerikleri.", niches: ["beauty"], platforms: [] } };
  const R = (p, m) => {
    if (p === "auth/me") return { ok: true, user };
    if (p.startsWith("app/applications")) return { ok: true, applications: [] };
    if (p.startsWith("app/campaigns")) return { ok: true, campaigns: [] };
    if (p === "app/notifications") return { ok: true, notifications: [] };
    if (p === "app/connections") return SC.conn;
    if (p === "app/connect" && m === "POST") return [409, { ok: false, error: "disabled" }];
    return { ok: true };
  };
  const of = window.fetch.bind(window);
  window.fetch = (u, o = {}) => {
    u = String(u); if (!u.startsWith("http://localhost:8799/")) return of(u, o);
    const p = u.slice(22), m = (o.method || "GET").toUpperCase();
    let r = R(p, m), st = 200;
    if (Array.isArray(r)) { st = r[0]; r = r[1]; }
    (window.__calls = window.__calls || []).push(m + " " + p + " " + st + (o.body ? " " + o.body : ""));
    return Promise.resolve(new Response(JSON.stringify(r), { status: st, headers: { "content-type": "application/json" } }));
  };
  window.confirm = () => true;
  try { localStorage.setItem("bc-token", "fake"); localStorage.setItem("brand-corner-lang", SC.lang || "tr"); } catch (e) {}
})();`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const server = spawn(process.execPath, [join(ROOT, "tools/serve.mjs"), join(ROOT, "sites/brandcorner.co"), "8788"], { stdio: "ignore" });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bconb-"))}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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
  const ev = async expr => { const r = await cmd("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error("eval: " + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result?.result?.value; };
  await cmd("Page.enable"); await cmd("Runtime.enable");
  for (let i = 0; i < 25; i++) { try { await fetch(BASE + "/panel.html"); break; } catch { await sleep(200); } }

  // Pencere içindeki dokunma hedefleri 44px; pencere ekrandan taşmaz
  const T44 = `[...document.querySelectorAll("dialog.onb button,dialog.onb a[href]")].filter(n=>{const r=n.getBoundingClientRect();if(!r.width||!r.height)return false;return r.height<44||r.width<44}).map(n=>{const r=n.getBoundingClientRect();return n.tagName.toLowerCase()+"["+(n.textContent||"").trim().slice(0,20)+"] "+Math.round(r.width)+"x"+Math.round(r.height)})`;
  const BOX = `(()=>{const d=document.querySelector("dialog.onb");if(!d)return null;const r=d.getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom,sw:d.scrollWidth-d.clientWidth}})()`;

  let scriptId;
  // flag: önceden yazılmış bayrak; hash'e "ticket=..." eklenirse sağlayıcıdan dönüş taklit edilir
  const open = async (sc, url, w, h, mobile, flag) => {
    if (scriptId) await cmd("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
    scriptId = (await cmd("Page.addScriptToEvaluateOnNewDocument", { source: mock(sc) })).result.identifier;
    await cmd("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
    await cmd("Page.navigate", { url: "about:blank" }); await sleep(150);
    await cmd("Page.navigate", { url: BASE + "/404" }); await sleep(250); await ev("localStorage.clear()");
    if (flag) await ev(`localStorage.setItem("bc-onb-41", "1")`);
    errs.length = 0;
    await cmd("Page.navigate", { url: `${BASE}/panel.html${url}` }); await sleep(1300);
  };
  const reload = async () => { errs.length = 0; await cmd("Page.reload"); await sleep(1300); };
  const isOpen = () => ev(`!!document.querySelector("dialog.onb[open]")`);
  const flag = () => ev(`localStorage.getItem("bc-onb-41")`);
  const q = s => ev(`document.querySelectorAll(${JSON.stringify(s)}).length`);
  const txt = s => ev(`(document.querySelector(${JSON.stringify(s)})||{}).textContent||""`);
  const click = s => ev(`(()=>{const n=document.querySelector(${JSON.stringify(s)});if(!n)return false;n.click();return true})()`);
  const plats = () => ev(`[...document.querySelectorAll("dialog.onb [data-p]")].map(b=>b.getAttribute("data-p")).join()`);
  const shot = async (name, w, h) => {
    const ov = await ev("document.documentElement.scrollWidth - innerWidth"), small = await ev(T44), bx = await ev(BOX);
    ok(ov <= 0, `${name}: yatay taşma ${ov}px`);
    ok(!small.length, `${name}: 44px altı ${small.slice(0, 5).join(" | ")}`);
    ok(bx && bx.l >= 0 && bx.r <= w + 0.5 && bx.t >= 0 && bx.b <= h + 0.5 && bx.sw <= 0, `${name}: pencere ekran dışına taşıyor ${JSON.stringify(bx)}`);
    ok(!errs.length, `${name}: JS hatası ${errs.join(" | ").slice(0, 300)}`);
    if (OUT) {
      const r = await cmd("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
      writeFileSync(join(OUT, name + ".png"), Buffer.from(r.result.data, "base64"));
    }
    console.log(`${name} overflow=${ov} small44=${small.length} errs=${errs.length}`);
  };

  const live = (conns, can = ALL) => ({ ok: true, connections: conns, connectable: can });
  const none = ALL.map(p => ({ platform: p, status: "available", configured: true }));

  for (const [sz, w, h, mobile] of SIZES) {
    // 1) Influencer, hiç bağlı hesap yok: pencere açılır, 4 platform, TR metin; "Şimdilik geç" bayrak yazar, yeniden girişte açılmaz
    await open({ conn: live(none) }, "#overview", w, h, mobile);
    ok(await isOpen(), "influencer: pencere açıldı");
    ok((await txt("#onb-t")) === "Hoş geldin! Hesaplarını bağla", "TR başlık");
    ok((await txt("#onb-l")).startsWith("Sosyal hesaplarını"), "influencer giriş metni");
    ok((await plats()) === ALL.join(), "4 platform düğmesi");
    ok((await txt("dialog.onb .srow:last-child b")) === "LinkedIn (kişisel profil)", "LinkedIn adı");
    ok((await txt("dialog.onb .srow:last-child .tx span")).startsWith("Kendi LinkedIn profilin bağlanır."), "linkedin satırında socLiNote metni var");
    ok((await txt("dialog.onb .srow:last-child .tx span")).includes("gönderi ölçümlerini dışarıya vermiyor"), "LinkedIn ölçüm notu");
    ok(!(await txt("dialog.onb .srow:first-child .tx span")), "Instagram'da LinkedIn notu yok");
    ok(await ev(`document.querySelector("dialog.onb").getAttribute("aria-labelledby")==="onb-t"`), "aria-labelledby");
    await shot(`onb-inf-${sz}`, w, h);
    ok(await click("dialog.onb .of button"), "Şimdilik geç düğmesi"); await sleep(200);
    ok(!(await isOpen()) && await q("dialog.onb") === 0, "geç: pencere kapandı");
    ok((await flag()) === "1", "geç: bayrak yazıldı");
    await reload();
    ok(!(await isOpen()), "geç sonrası yeniden girişte açılmadı");
    ok(!(await ev(`(window.__calls||[]).some(c=>c.startsWith("GET app/connections"))`)), "bayrak varken connections çağrılmadı");

    // 2) Esc ile kapatma da bayrak yazar
    await open({ conn: live(none) }, "#overview", w, h, mobile);
    ok(await isOpen(), "Esc: pencere açıldı");
    await cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await sleep(200);
    ok(!(await isOpen()) && (await flag()) === "1", "Esc: kapandı, bayrak yazıldı");

    // 3) "Bağla": app/connect POST, hata metni pencerede, bayrak yazılır
    await open({ conn: live(none) }, "#overview", w, h, mobile);
    ok(await click('dialog.onb [data-p="tiktok"]'), "Bağla tıklandı"); await sleep(300);
    ok(await ev(`(window.__calls||[]).some(c=>c.startsWith("POST app/connect 409") && c.includes('"tiktok"'))`), "app/connect tiktok çağrısı");
    ok((await txt("dialog.onb .msg")) === "Hesap bağlama şu an kapalı.", "hata metni pencerede");
    ok((await flag()) === "1", "Bağla: bayrak yazıldı");

    // 4) Profil bağlantısı: #profile'a gider, pencere kapanır, bayrak yazılır
    await open({ conn: live(none) }, "#overview", w, h, mobile);
    ok(await click('dialog.onb .of a[href="#profile"]'), "Profil bağlantısı"); await sleep(600);
    ok(!(await isOpen()) && (await flag()) === "1" && (await ev("location.hash")) === "#profile", "Profil: kapandı, bayrak, #profile");
    // zaten #profile'dayken de kapanır
    await open({ conn: live(none) }, "#profile", w, h, mobile);
    ok(await isOpen(), "#profile'da pencere açıldı");
    ok(await click('dialog.onb .of a[href="#profile"]'), "aynı sayfa Profil bağlantısı"); await sleep(600);
    ok(!(await isOpen()) && (await flag()) === "1", "#profile'da Profil bağlantısı kapattı");
    ok(!errs.length, `profil: JS hatası ${errs.join(" | ").slice(0, 300)}`);

    // 5) Bağlı hesap var: açılmaz, bayrak yazılır; hatalı bağlantı da bağlı sayılır
    await open({ conn: live([{ platform: "instagram", status: "connected", configured: true, handle: "deniz" }].concat(none.slice(1))) }, "#overview", w, h, mobile);
    ok(!(await isOpen()) && (await flag()) === "1", "bağlı hesap: açılmadı, bayrak yazıldı");
    await open({ conn: live([{ platform: "youtube", status: "error", configured: true }]) }, "#overview", w, h, mobile);
    ok(!(await isOpen()), "hatalı bağlantı: açılmadı");

    // 6) Ölçüm kapalı (200 disabled / 409), 403, ağ hatası: açılmaz, bayrak yazılmaz
    for (const [nm, conn] of [["disabled", { ok: true, disabled: true, connections: [] }], ["409", [409, { ok: false, error: "disabled" }]], ["500", [500, { ok: false, error: "server" }]]]) {
      await open({ conn }, "#overview", w, h, mobile);
      ok(!(await isOpen()) && (await flag()) === null, `${nm}: açılmadı, bayrak yok`);
      ok(!errs.length, `${nm}: JS hatası ${errs.join(" | ").slice(0, 300)}`);
    }

    // 7) Yapılandırılmamış platform listelenmez; hiçbiri yoksa açılmaz
    await open({ conn: live([{ platform: "instagram", status: "not_configured", configured: false }, { platform: "tiktok", status: "available", configured: true }]) }, "#overview", w, h, mobile);
    ok((await plats()) === "tiktok,youtube,linkedin", "yapılandırılmamış instagram listede yok");
    await open({ conn: live(ALL.map(p => ({ platform: p, status: "not_configured", configured: false }))) }, "#overview", w, h, mobile);
    ok(!(await isOpen()) && (await flag()) === null, "hiç yapılandırılmış platform yok: açılmadı");

    // 8) Sağlayıcıdan dönüş (#ticket): açılmaz
    await open({ conn: live(none) }, "?oauth=instagram&result=ok#ticket=abcdefghijklmnop1234", w, h, mobile);
    ok(!(await isOpen()), "OAuth dönüşü: açılmadı");

    // 9) Marka/ajans: `connectable` yoksa ("yakında") açılmaz; varsa kurumsal metin ve sunucunun listesi, EN
    await open({ role: "brand", conn: live([], ["instagram", "tiktok", "youtube", "linkedin"]) }, "#overview", w, h, mobile);
    ok((await plats()) === ALL.join() && (await txt("#onb-l")) === "Kurumsal sosyal hesaplarını resmî bağlantıyla bağla.", "marka: 4 platform, kurumsal metin");
    await shot(`onb-brand-${sz}`, w, h);
    await open({ role: "brand", conn: { ok: true, connections: [] } }, "#overview", w, h, mobile);
    ok(!(await isOpen()), "marka yakında: açılmadı");
    await open({ role: "agency", lang: "en", conn: live([], ["instagram", "linkedin"]) }, "#overview", w, h, mobile);
    ok(await isOpen(), "ajans: pencere açıldı");
    ok((await txt("#onb-t")) === "Welcome! Connect your accounts", "EN başlık");
    ok((await txt("#onb-l")) === "Connect your company's social accounts officially.", "EN kurumsal metin");
    ok((await plats()) === "instagram,linkedin", "ajans: sunucu listesi");
    ok((await txt("dialog.onb .srow:last-child .tx span")).includes("doesn't share personal post metrics"), "EN LinkedIn ölçüm notu");
    ok((await txt("dialog.onb .of button")) === "Skip for now", "EN geç düğmesi");
    await shot(`onb-agency-en-${sz}`, w, h);
  }
  console.log(fails ? `HATA=${fails}` : "HATA=0");
  done(fails ? 1 : 0);
} catch (e) { console.log("HATA:", e.message); done(2); }
