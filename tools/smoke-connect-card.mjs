// brandcorner panel Profil "Sosyal hesaplar" kalıcı bağlantı kartı headless testi (marka/ajans odaklı): sahte API (fetch mock), yerel Chrome (CDP), JS hatası 0.
// Kullanım: node tools/smoke-connect-card.mjs [ekranGörüntüsüKlasörü]   (8789 ve 9334 portları boş olmalı)
// Kontroller: marka ve ajansta kart görünür; sunucunun `connectable` listesine uyar (listede olmayan platformda "Bağla" yok);
// not_configured → "Yapılandırılmadı", no_api → "API yok", bağlı → "Bağlı" + "Bağlantıyı kes", LinkedIn no_data → "Veri yok";
// `connectable` yoksa ya da 403 → "Yakında" (Instagram/TikTok/LinkedIn, düğmeler kapalı); ölçüm kapalıyken marka/ajansta örnek
// influencer sayısı yok, influencer'da "Örnek veri" rozeti kalır; "Bağla" app/connect çağırır; TR/EN, 44px, taşma; 2000x924, 390x844, 375x812.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2]; if (OUT) mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:8789", PORT = 9334;
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SIZES = [["d", 2000, 924, false], ["m390", 390, 844, true], ["m375", 375, 812, true]];
const ALL = ["instagram", "tiktok", "youtube", "linkedin"];

// sc: { lang, role, conn: app/connections yanıtı ya da [durum, gövde], metrics: app/metrics yanıtı }
const mock = sc => `(() => {
  const SC = ${JSON.stringify(sc)};
  const user = { id: 41, name: "Deniz A.", email: "x@example.com", role: SC.role || "brand", lang: SC.lang || "tr", profile: { company: "Acme", city: "İzmir", bio: "Günlük yaşam içerikleri.", niches: ["beauty"], platforms: [] } };
  const R = (p, m) => {
    if (p === "auth/me") return { ok: true, user };
    if (p.startsWith("app/applications")) return { ok: true, applications: [] };
    if (p.startsWith("app/campaigns")) return { ok: true, campaigns: [] };
    if (p === "app/notifications") return { ok: true, notifications: [] };
    if (p === "app/connections") return SC.conn;
    if (p === "app/metrics") return SC.metrics || [409, { ok: false, error: "disabled" }];
    if (p === "app/connect" && m === "POST") return [409, { ok: false, error: "not_configured" }];
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
  try { localStorage.setItem("bc-token", "fake"); localStorage.setItem("brand-corner-lang", SC.lang || "tr"); localStorage.setItem("bc-onb-41", "1"); } catch (e) {}
})();`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const server = spawn(process.execPath, [join(ROOT, "tools/serve.mjs"), join(ROOT, "sites/brandcorner.co"), "8789"], { stdio: "ignore" });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bccc-"))}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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

  // Kart içindeki dokunma hedefleri 44px; kart sayfadan taşmaz
  const T44 = `[...document.querySelectorAll("section.soc button,section.soc a[href]")].filter(n=>{const r=n.getBoundingClientRect();if(!r.width||!r.height)return false;return r.height<44||r.width<44}).map(n=>{const r=n.getBoundingClientRect();return n.tagName.toLowerCase()+"["+(n.textContent||"").trim().slice(0,20)+"] "+Math.round(r.width)+"x"+Math.round(r.height)})`;
  const BOX = `(()=>{const d=document.querySelector("section.soc");if(!d)return null;const r=d.getBoundingClientRect();return {l:r.left,r:r.right,sw:d.scrollWidth-d.clientWidth}})()`;

  let scriptId;
  const open = async (sc, w, h, mobile) => {
    if (scriptId) await cmd("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
    scriptId = (await cmd("Page.addScriptToEvaluateOnNewDocument", { source: mock(sc) })).result.identifier;
    await cmd("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
    await cmd("Page.navigate", { url: "about:blank" }); await sleep(150);
    await cmd("Page.navigate", { url: BASE + "/404" }); await sleep(250); await ev("localStorage.clear()");
    errs.length = 0;
    await cmd("Page.navigate", { url: `${BASE}/panel.html#profile` }); await sleep(1300);
  };
  const txt = s => ev(`(document.querySelector(${JSON.stringify(s)})||{}).textContent||""`);
  const click = s => ev(`(()=>{const n=document.querySelector(${JSON.stringify(s)});if(!n)return false;n.click();return true})()`);
  // satırlar: ad | rozet | düğmeler (kapalıysa "!" ön ekli)
  const rows = () => ev(`[...document.querySelectorAll("section.soc .srow")].map(r=>[r.querySelector(".tx b").textContent,(r.querySelector(".sa .badge")||{}).textContent||"",[...r.querySelectorAll(".sa button")].map(b=>(b.disabled?"!":"")+b.textContent).join("+")].join("|"))`);
  const shot = async (name, w, h) => {
    const ov = await ev("document.documentElement.scrollWidth - innerWidth"), small = await ev(T44), bx = await ev(BOX);
    ok(ov <= 0, `${name}: yatay taşma ${ov}px`);
    ok(!small.length, `${name}: 44px altı ${small.slice(0, 5).join(" | ")}`);
    ok(bx && bx.l >= 0 && bx.r <= w + 0.5 && bx.sw <= 0, `${name}: kart taşıyor ${JSON.stringify(bx)}`);
    ok(!errs.length, `${name}: JS hatası ${errs.join(" | ").slice(0, 300)}`);
    if (OUT) {
      await ev(`document.querySelector("section.soc").scrollIntoView({block:"start"})`); await sleep(150);
      const r = await cmd("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(OUT, name + ".png"), Buffer.from(r.result.data, "base64"));
    }
    console.log(`${name} overflow=${ov} small44=${small.length} errs=${errs.length}`);
  };

  const mixed = [
    { platform: "instagram", status: "available", configured: true },
    { platform: "tiktok", status: "not_configured", configured: false, label: "yapılandırılmadı", label_code: "not_configured" },
    { platform: "youtube", status: "connected", configured: true, handle: "acme" },
    { platform: "x", status: "no_api", configured: false, label: "veri yok", label_code: "no_data" },
    { platform: "linkedin", status: "connected", configured: true, handle: "Ayşe Yılmaz", label: "veri yok", label_code: "no_data" },
  ];

  for (const [sz, w, h, mobile] of SIZES) {
    // 1) Marka, tüm durumlar: available → Bağla; not_configured → Yapılandırılmadı; bağlı → Bağlı + Kes; no_api; LinkedIn no_data → Veri yok
    await open({ conn: { ok: true, connectable: ALL, connections: mixed } }, w, h, mobile);
    ok((await txt("#soc-h")) === "Sosyal hesaplar", "marka: kart görünür");
    ok((await txt("section.soc .cb > p.muted")) === "Kurumsal sosyal hesaplarını resmî bağlantıyla bağla.", "marka: kurumsal giriş metni");
    const r1 = await rows();
    ok(r1.join("\n") === ["Instagram|Bağlı değil|Bağla", "TikTok|Yapılandırılmadı|", "YouTube|Bağlı|Bağlantıyı kes", "X|Veri yok|", "LinkedIn (kişisel profil)|Veri yok|Bağlantıyı kes"].join("\n"), `marka satırları:\n${r1.join("\n")}`);
    ok((await txt("section.soc .srow:last-child .tx span")).includes("Metrik onayı bekleniyor"), "LinkedIn: metrik onayı bekleniyor");
    ok(!(await ev(`!!document.querySelector("section.soc .b-sample")`)), "marka: örnek veri rozeti yok");
    await shot(`card-brand-${sz}`, w, h);
    ok(await ev(`(()=>{const b=document.querySelector("section.soc .srow .sa button");if(!b||b.textContent!=="Bağla")return false;b.click();return true})()`), "Bağla tıklandı"); await sleep(300);
    ok(await ev(`(window.__calls||[]).some(c=>c.startsWith("POST app/connect 409") && c.includes('"instagram"'))`), "Bağla: app/connect instagram");
    ok(!(await ev(`(window.__calls||[]).some(c=>c.startsWith("GET app/metrics"))`)), "marka: app/metrics çağrılmadı");

    // 2) Ajans, sunucu listesi yalnız instagram+linkedin: listede olmayan tiktok "Bağla" almaz
    await open({ role: "agency", conn: { ok: true, connectable: ["instagram", "linkedin"], connections: ALL.map(p => ({ platform: p, status: "available", configured: true })) } }, w, h, mobile);
    const r2 = await rows();
    ok(r2.join("\n") === ["Instagram|Bağlı değil|Bağla", "TikTok|Bağlı değil|", "YouTube|Bağlı değil|", "LinkedIn (kişisel profil)|Bağlı değil|Bağla"].join("\n"), `ajans connectable:\n${r2.join("\n")}`);

    // 3) `connectable` yok ya da 403: "Yakında", Instagram/TikTok/LinkedIn, düğmeler kapalı, giriş cümlesi yok
    const soon = ["Instagram|Yakında|!Bağla", "TikTok|Yakında|!Bağla", "LinkedIn (kişisel profil)|Yakında|!Bağla"].join("\n");
    for (const [nm, conn] of [["eski", { ok: true, connections: [] }], ["403", [403, { ok: false, error: "forbidden" }]]]) {
      await open({ conn }, w, h, mobile);
      ok((await rows()).join("\n") === soon, `marka yakında (${nm}): ${(await rows()).join(" / ")}`);
      ok((await txt("section.soc .cb > p.muted")) === "Marka ve ajans hesapları için bağlantı yakında", `yakında metni (${nm})`);
      ok(!errs.length, `yakında (${nm}): JS hatası ${errs.join(" | ").slice(0, 300)}`);
    }

    // 4) Ölçüm kapalı (200 disabled): örnek influencer sayısı yok, satırlar kapalı Bağla, bağlı LinkedIn Kes ile kalır
    await open({ conn: { ok: true, disabled: true, connectable: ALL, connections: [{ platform: "linkedin", status: "connected", handle: "Ayşe", label_code: "no_data" }] } }, w, h, mobile);
    const r4 = await rows();
    ok(r4.join("\n") === ["Instagram|Bağlı değil|!Bağla", "TikTok|Bağlı değil|!Bağla", "YouTube|Bağlı değil|!Bağla", "LinkedIn (kişisel profil)|Veri yok|Bağlantıyı kes"].join("\n"), `marka ölçüm kapalı:\n${r4.join("\n")}`);
    ok(!(await ev(`!!document.querySelector("section.soc .sample")`)), "marka ölçüm kapalı: örnek kart yok");
    await shot(`card-brand-off-${sz}`, w, h);

    // 5) Influencer ölçüm kapalı: "Örnek veri" rozeti kalır (API yokken örnek sayı işaretli)
    await open({ role: "influencer", conn: { ok: true, disabled: true, connectable: ALL, connections: [] },
      metrics: { ok: true, metrics: { accounts: [{ platform: "instagram", source: "sample", handle: "ornek", followers: 1200, avg_views: 300, avg_likes: 40, avg_comments: 5 }] } } }, w, h, mobile);
    ok(await ev(`document.querySelectorAll("section.soc .b-sample").length >= 2`), "influencer: örnek veri rozeti");

    // 6) Ajans EN
    await open({ role: "agency", lang: "en", conn: { ok: true, connectable: ALL, connections: mixed } }, w, h, mobile);
    ok((await txt("#soc-h")) === "Social accounts", "EN başlık");
    const r6 = await rows();
    ok(r6.join("\n") === ["Instagram|Not connected|Connect", "TikTok|Not configured|", "YouTube|Connected|Disconnect", "X|No data|", "LinkedIn (personal profile)|No data|Disconnect"].join("\n"), `ajans EN:\n${r6.join("\n")}`);
    await shot(`card-agency-en-${sz}`, w, h);
  }
  console.log(fails ? `HATA=${fails}` : "HATA=0");
  done(fails ? 1 : 0);
} catch (e) { console.log("HATA:", e.message); done(2); }
