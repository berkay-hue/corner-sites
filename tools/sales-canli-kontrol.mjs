#!/usr/bin/env node
// Sales Corner günlük canlı kontrol (.github/workflows/sales-canli-kontrol.yml, her sabah 08:00 TR).
// Bağımlılıksız: Node 20+ fetch. Yalnız oturumsuz GET atar; ücretli iş tetikleyen hiçbir uca (POST /api/app/<modül>,
// takip-run, /api/analiz …) istek göndermez.
// Hata varsa `sales-canli-kontrol` etiketli açık issue'ya yorum ekler (yoksa yeni açar); hepsi geçerse açık issue'yu
// "düzeldi" yorumuyla kapatır. GITHUB_TOKEN yoksa ya da --dry verilirse yalnız rapor basar.
//
//   node tools/sales-canli-kontrol.mjs --dry           # yerelde: canlıya karşı dene, GitHub'a dokunma
//   SITE=http://127.0.0.1:8788 node tools/sales-canli-kontrol.mjs --dry
//
// Ortam: SITE (varsayılan https://salescorner.co), APP_SITE (https://app.salescorner.co), GITHUB_TOKEN, GITHUB_REPOSITORY,
// GITHUB_API_URL, GITHUB_SERVER_URL, GITHUB_RUN_ID, GITHUB_STEP_SUMMARY, ZAMAN_ASIMI_MS (20000), YAVAS_MS (5000), TAZELIK_GUN (2).
import { appendFileSync } from "node:fs";

const ARGS = new Set(process.argv.slice(2));
const DRY = ARGS.has("--dry");
const SITE = (process.env.SITE || "https://salescorner.co").replace(/\/+$/, "");
const APP_SITE = (process.env.APP_SITE || "https://app.salescorner.co").replace(/\/+$/, "");
const ZAMAN_ASIMI = Number(process.env.ZAMAN_ASIMI_MS) || 20000;
const YAVAS = Number(process.env.YAVAS_MS) || 5000;
const TAZELIK_GUN = Number(process.env.TAZELIK_GUN) || 2;
const ESZAMANLI = 6;
const ETIKET = "sales-canli-kontrol";
const UA = "SalesCornerCanliKontrol/1.0 (+github-actions)";

// Sitemap'te olmayan ama canlıda açık olması gereken sayfalar. Sitemap'teki her URL ayrıca otomatik denenir.
// ara: sayfada bulunması gereken metinler (CTA, fiyat bölümü, kayıt bağlantısı).
const KRITIK = [
  { yol: "/", ara: ["14 gün ücretsiz", 'id="fiyatlar"', "/#/kayit"] },
  { yol: "/hizmetler", ara: ["14 gün ücretsiz", "/#/kayit"] },
  { yol: "/iletisim", ara: ["14 gün ücretsiz"] },
  { yol: "/hakkimizda", ara: ["14 gün ücretsiz"] },
  { yol: "/blog", ara: ["14 gün ücretsiz"] },
  { yol: "/en/", ara: [/14-day free trial/i, 'id="fiyatlar"', "/#/kayit"] },
  { yol: "/en/contact", ara: [/14-day free trial/i] },
  { yol: "/en/blog", ara: [/14-day free trial/i] },
  // Araç/modül sayfaları (eski hydrate sayfalar, noindex; sitemap'te yoklar)
  { yol: "/briefing" }, { yol: "/sekans-yazari" }, { yol: "/rakip-analizi" }, { yol: "/seo-robotu" },
  { yol: "/rakip-takip" }, { yol: "/cv-analiz" }, { yol: "/web-keyword" }, { yol: "/haftalik-rapor" },
  // Panel
  { yol: "/app/", ara: ["/app/app.js?v=", "/app/app.css?v="] },
  { kok: APP_SITE, yol: "/", ara: ["/app/app.js?v=", "/app/app.css?v="] },
];
// CTA aranmayan sitemap sayfaları (yasal metinler)
const CTA_YOK = /\/(kvkk|kvkk-basvuru-formu|gizlilik-politikasi|kullanim-kosullari|cerez-politikasi|privacy|terms|cookie-policy)$/;
// /api/app/* girişsiz: yalnız GET, gövdesiz. Kod: _worker.js appRoute — köken kontrolü (sameSite) 403, oturum kapısı 401,
// POST dışı modül çağrısı 404 (GET ile hiçbir araç çalışmaz). Hiçbiri dış servis çağırmadan döner.
const API = [
  { yol: "/api/app/ben", beklenen: 403, ad: "Köken yok → 403 (sameSite)" },
  { yol: "/api/app/takip-run", beklenen: 403, ad: "Cron ucu GET → 403" },
  { yol: "/api/app/fireflies/liste", origin: true, beklenen: 401, ad: "Oturumsuz → 401 (oturum kapısı)" },
  { yol: "/api/app/briefing", origin: true, beklenen: 404, ad: "Araç ucu GET → 404 (yalnız POST çalışır)" },
];

const satirlar = []; // { grup, ad, durum: ok|hata|uyari, kod, ms, ayrinti }
const ekle = (grup, ad, durum, kod = "", ms = "", ayrinti = "") => satirlar.push({ grup, ad, durum, kod: String(kod), ms, ayrinti });
const bekle = ms => new Promise(r => setTimeout(r, ms));

// Zaman aşımlı GET; ağ hatası, zaman aşımı ya da 5xx'te bir kez yeniden dener (geçici hatada alarm vermesin)
async function getir(url, { headers = {}, govde = true } = {}) {
  for (let deneme = 0; ; deneme++) {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), ZAMAN_ASIMI), t0 = Date.now();
    let s;
    try {
      const r = await fetch(url, { headers: { "user-agent": UA, ...headers }, redirect: "manual", signal: ac.signal });
      const text = govde ? await r.text() : (await r.arrayBuffer(), "");
      s = { kod: r.status, ms: Date.now() - t0, text, tip: r.headers.get("content-type") || "", yer: r.headers.get("location") || "" };
    } catch (e) {
      s = { kod: 0, ms: Date.now() - t0, text: "", tip: "", yer: "", hata: e?.name === "AbortError" ? `zaman aşımı (${ZAMAN_ASIMI} ms)` : `ağ hatası: ${String(e?.cause?.code || e?.message || e).slice(0, 80)}` };
    } finally { clearTimeout(t); }
    if (deneme === 0 && (s.kod === 0 || s.kod >= 500)) { await bekle(3000); continue; }
    return s;
  }
}
async function havuz(isler, n, f) {
  const out = new Array(isler.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, isler.length) }, async () => { while (i < isler.length) { const k = i++; out[k] = await f(isler[k], k); } }));
  return out;
}
const kodAciklama = s => s.hata || (s.yer ? `${s.kod} → ${s.yer}` : String(s.kod));
const bul = (text, x) => x instanceof RegExp ? x.test(text) : text.includes(x);
const trGun = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const gunFark = (a, b) => Math.round((Date.parse(a + "T00:00:00Z") - Date.parse(b + "T00:00:00Z")) / 86400000);
// Canlı sitemap salescorner.co adresleri içerir; SITE yerel bir adrese çevrildiyse aynı yollar oraya sorulur
const KENDI = new Set(["https://salescorner.co", new URL(SITE).origin]);
const kendiMi = u => { try { return KENDI.has(new URL(u).origin); } catch { return false; } };
const sayfaYolu = u => { try { const x = new URL(u); return KENDI.has(x.origin) ? x.pathname : u; } catch { return u; } };
const yerel = u => { try { const x = new URL(u); return SITE + x.pathname + x.search; } catch { return u; } };

function ctaKontrol(yol, text) {
  const en = yol === "/en" || yol.startsWith("/en/");
  return en ? /14-day free trial/i.test(text) : text.includes("14 gün ücretsiz");
}

async function main() {
  const t0 = Date.now(), tarih = trGun();
  const sayfalar = new Map(); // yol → yanıt (CTA ve tazelik için tekrar istek atmamak)

  // 1) Kritik sayfalar
  await havuz(KRITIK, ESZAMANLI, async k => {
    const url = (k.kok || SITE) + k.yol, ad = k.kok ? url.replace(/^https?:\/\//, "") : k.yol;
    const s = await getir(url);
    if (!k.kok) sayfalar.set(k.yol, s);
    if (s.kod !== 200) return ekle("Kritik sayfa", ad, "hata", kodAciklama(s), s.ms, "200 bekleniyordu");
    const eksik = (k.ara || []).filter(x => !bul(s.text, x)).map(x => String(x));
    if (eksik.length) return ekle("Kritik sayfa", ad, "hata", 200, s.ms, "Sayfada yok: " + eksik.join(", "));
    ekle("Kritik sayfa", ad, s.ms > YAVAS ? "uyari" : "ok", 200, s.ms, s.ms > YAVAS ? `yavaş (> ${YAVAS} ms)` : "");
  });

  // 2) robots.txt + sitemap.xml + sitemap'teki tüm URL'ler
  const rb = await getir(SITE + "/robots.txt");
  if (rb.kod !== 200) ekle("robots/sitemap", "/robots.txt", "hata", kodAciklama(rb), rb.ms, "200 bekleniyordu");
  else if (!/^\s*sitemap:\s*https?:\/\/\S+\/sitemap\.xml\s*$/im.test(rb.text)) ekle("robots/sitemap", "/robots.txt", "hata", 200, rb.ms, "Sitemap: satırı yok");
  else ekle("robots/sitemap", "/robots.txt", "ok", 200, rb.ms, "Sitemap satırı var");

  const sm = await getir(SITE + "/sitemap.xml");
  let girdiler = [];
  if (sm.kod !== 200) ekle("robots/sitemap", "/sitemap.xml", "hata", kodAciklama(sm), sm.ms, "200 bekleniyordu");
  else {
    for (const m of sm.text.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      const loc = (m[1].match(/<loc>\s*([^<\s]+)\s*<\/loc>/) || [])[1];
      if (loc) girdiler.push({ loc: loc.replace(/&amp;/g, "&"), lastmod: ((m[1].match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/) || [])[1] || "").slice(0, 10) });
    }
    const yabanci = girdiler.filter(g => !kendiMi(g.loc));
    for (const g of yabanci.slice(0, 10)) ekle("robots/sitemap", g.loc, "hata", "", "", "Sitemap'te başka alan adı (https://salescorner.co bekleniyordu)");
    girdiler = girdiler.filter(g => kendiMi(g.loc));
    if (!girdiler.length) ekle("robots/sitemap", "/sitemap.xml", "hata", 200, sm.ms, "Sitemap'te URL bulunamadı");
    else ekle("robots/sitemap", "/sitemap.xml", "ok", 200, sm.ms, `${girdiler.length} URL`);
  }
  const smSonuc = await havuz(girdiler, ESZAMANLI, async g => {
    const yol = sayfaYolu(g.loc), s = sayfalar.get(yol) || await getir(yerel(g.loc));
    sayfalar.set(yol, s);
    return { ...g, yol, s };
  });
  if (girdiler.length) {
    const kotu = smSonuc.filter(x => x.s.kod !== 200);
    for (const x of kotu) ekle("Sitemap URL", x.yol, "hata", kodAciklama(x.s), x.s.ms, "Sitemap'teki adres 200 dönmüyor");
    const sure = smSonuc.map(x => x.s.ms), enYavas = smSonuc.reduce((a, b) => (b.s.ms > a.s.ms ? b : a));
    const ort = Math.round(sure.reduce((a, b) => a + b, 0) / sure.length);
    ekle("Sitemap URL", `${smSonuc.length - kotu.length}/${smSonuc.length} URL 200`, kotu.length ? "hata" : enYavas.s.ms > YAVAS ? "uyari" : "ok", "", ort,
      `ort. ${ort} ms; en yavaş ${enYavas.yol} (${enYavas.s.ms} ms)`);
  }

  // 3) "14 gün ücretsiz deneme" CTA: kritik listedekiler yukarıda; burada sitemap'teki her sayfa (yasal metinler hariç)
  if (girdiler.length) {
    const aday = smSonuc.filter(x => x.s.kod === 200 && !CTA_YOK.test(x.yol));
    const yok = aday.filter(x => !ctaKontrol(x.yol, x.s.text));
    for (const x of yok) ekle("Deneme CTA", x.yol, "hata", 200, x.s.ms, x.yol.startsWith("/en") ? "\"14-day free trial\" yok" : "\"14 gün ücretsiz\" yok");
    ekle("Deneme CTA", `${aday.length - yok.length}/${aday.length} sayfada var`, yok.length ? "hata" : "ok", "", "", "Sitemap sayfaları (yasal metinler hariç)");
  }

  // 4) /api/app/* girişsiz: beklenen yetkisiz yanıt
  await havuz(API, ESZAMANLI, async a => {
    const s = await getir(SITE + a.yol, { headers: a.origin ? { origin: SITE } : {} });
    let j = null; try { j = JSON.parse(s.text); } catch {}
    if (s.kod !== a.beklenen) return ekle("API (girişsiz)", `GET ${a.yol}`, "hata", kodAciklama(s), s.ms, `${a.ad}; ${a.beklenen} bekleniyordu`);
    if (!j || j.success !== false) return ekle("API (girişsiz)", `GET ${a.yol}`, "hata", s.kod, s.ms, `${a.ad}; JSON {success:false} bekleniyordu`);
    ekle("API (girişsiz)", `GET ${a.yol}`, "ok", s.kod, s.ms, a.ad);
  });

  // 5) Blog tazeliği: sitemap'teki yazı sayfalarının datePublished'ı (yoksa lastmod); en yenisi ≤ TAZELIK_GUN gün
  for (const [dil, on] of [["TR", "/blog/"], ["EN", "/en/blog/"]]) {
    const yazilar = smSonuc.filter(x => x.yol.startsWith(on) && x.yol.length > on.length && !x.yol.slice(on.length).includes("/"));
    if (!yazilar.length) { if (girdiler.length) ekle("Blog tazeliği", `${dil} blog`, "hata", "", "", "Sitemap'te blog yazısı yok"); continue; }
    for (const x of yazilar) x.tarih = ((x.s.text.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/) || [])[1]) || x.lastmod;
    const enYeni = yazilar.filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x.tarih || "")).sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    if (!enYeni) { ekle("Blog tazeliği", `${dil} blog`, "hata", "", "", "Yazı tarihi okunamadı"); continue; }
    const fark = gunFark(tarih, enYeni.tarih);
    ekle("Blog tazeliği", `${dil}: ${enYeni.yol}`, fark <= TAZELIK_GUN ? "ok" : "hata", "", "", `En yeni yazı ${enYeni.tarih} (${fark} gün önce; sınır ${TAZELIK_GUN} gün)`);
    // Liste sayfası en yeni yazıyı gösteriyor mu (build/deploy takıldıysa yazı var, liste eski kalır)
    const liste = sayfalar.get(on.slice(0, -1));
    const slug = enYeni.yol.slice(on.length);
    if (liste && liste.kod === 200 && !liste.text.includes(slug)) ekle("Blog tazeliği", `${on.slice(0, -1)} listesi`, "hata", 200, liste.ms, `En yeni yazı (${slug}) listede yok`);
  }

  // 6) Panel dosyaları: /app/ ve app.salescorner.co'nun yüklediği app.js?v=N / app.css?v=N
  const panelHtml = [[SITE, sayfalar.get("/app/")], [APP_SITE, null]];
  const panelSayfa = await getir(APP_SITE + "/");
  panelHtml[1][1] = panelSayfa;
  for (const [kok, s] of panelHtml) {
    const ad = kok.replace(/^https?:\/\//, "");
    if (!s || s.kod !== 200) continue; // kritik sayfa satırı hatayı zaten yazdı
    for (const [tur, re, tip] of [["app.js", /\/app\/app\.js\?v=\w+/, /javascript/], ["app.css", /\/app\/app\.css\?v=\w+/, /css/]]) {
      const m = s.text.match(re);
      if (!m) { ekle("Panel dosyası", `${ad} ${tur}`, "hata", "", "", "Sayfada bağlantı yok"); continue; }
      const d = await getir(kok + m[0]);
      if (d.kod !== 200) ekle("Panel dosyası", `${ad}${m[0]}`, "hata", kodAciklama(d), d.ms, "200 bekleniyordu");
      else if (!tip.test(d.tip) || d.text.length < 1000) ekle("Panel dosyası", `${ad}${m[0]}`, "hata", 200, d.ms, `Beklenmeyen içerik (${d.tip || "tip yok"}, ${d.text.length} bayt)`);
      else ekle("Panel dosyası", `${ad}${m[0]}`, d.ms > YAVAS ? "uyari" : "ok", 200, d.ms, `${Math.round(d.text.length / 1024)} kB`);
    }
  }

  return { tarih, sure: Date.now() - t0 };
}

// ---------- Rapor ----------
const SIRA = { hata: 0, uyari: 1, ok: 2 };
const ROZET = { hata: "❌ Hata", uyari: "⚠️ Uyarı", ok: "✅" };
const hucre = v => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
function tablo(liste) {
  const s = ["| Durum | Grup | Kontrol | Kod | Süre (ms) | Ayrıntı |", "|---|---|---|---|---|---|"];
  for (const r of liste) s.push(`| ${ROZET[r.durum]} | ${hucre(r.grup)} | ${hucre(r.ad)} | ${hucre(r.kod)} | ${hucre(r.ms)} | ${hucre(r.ayrinti)} |`);
  return s.join("\n");
}
function calismaLinki() {
  const { GITHUB_SERVER_URL: s, GITHUB_REPOSITORY: r, GITHUB_RUN_ID: id } = process.env;
  return s && r && id ? `${s}/${r}/actions/runs/${id}` : "";
}

// ---------- GitHub issue ----------
async function gh(yol, { method = "GET", body } = {}) {
  const api = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/+$/, "");
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 20000);
  try {
    const r = await fetch(api + yol, {
      method, signal: ac.signal,
      headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": UA, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const t2 = await r.text(); let j = null; try { j = t2 ? JSON.parse(t2) : null; } catch {}
    return { kod: r.status, ok: r.ok, j };
  } finally { clearTimeout(t); }
}
async function issueGuncelle(hatalar, govde, baslik) {
  const repo = process.env.GITHUB_REPOSITORY;
  const ac = await gh(`/repos/${repo}/issues?state=open&labels=${encodeURIComponent(ETIKET)}&per_page=20&sort=created&direction=asc`);
  if (!ac.ok) throw new Error(`issue listesi alınamadı (${ac.kod})`);
  const acik = (ac.j || []).filter(i => !i.pull_request);
  const mevcut = acik[0];
  if (hatalar.length) {
    if (mevcut) {
      const y = await gh(`/repos/${repo}/issues/${mevcut.number}/comments`, { method: "POST", body: { body: govde } });
      if (!y.ok) throw new Error(`yorum eklenemedi (${y.kod})`);
      await gh(`/repos/${repo}/issues/${mevcut.number}`, { method: "PATCH", body: { title: baslik } });
      return `#${mevcut.number} güncellendi (yorum eklendi)`;
    }
    // Etiket yoksa oluştur (varsa 422 döner, sorun değil)
    await gh(`/repos/${repo}/labels`, { method: "POST", body: { name: ETIKET, color: "d73a4a", description: "Sales Corner günlük canlı kontrol hatası (otomatik)" } });
    const sahip = process.env.GITHUB_REPOSITORY_OWNER;
    const y = await gh(`/repos/${repo}/issues`, { method: "POST", body: { title: baslik, labels: [ETIKET], body: govde + (sahip ? `\n\ncc @${sahip}` : "") } });
    if (!y.ok) throw new Error(`issue açılamadı (${y.kod})`);
    return `#${y.j?.number} açıldı`;
  }
  if (!mevcut) return "açık issue yok";
  const notlar = [];
  for (const i of acik) {
    const y = await gh(`/repos/${repo}/issues/${i.number}/comments`, { method: "POST", body: { body: govde } });
    const k = await gh(`/repos/${repo}/issues/${i.number}`, { method: "PATCH", body: { state: "closed", state_reason: "completed" } });
    if (!y.ok || !k.ok) throw new Error(`#${i.number} kapatılamadı (${y.kod}/${k.kod})`);
    notlar.push(`#${i.number}`);
  }
  return `${notlar.join(", ")} düzeldi, kapatıldı`;
}

const { tarih, sure } = await main().catch(e => { ekle("Betik", "Kontrol çalışmadı", "hata", "", "", String(e?.message || e).slice(0, 200)); return { tarih: trGun(), sure: 0 }; });
satirlar.sort((a, b) => SIRA[a.durum] - SIRA[b.durum]);
const hatalar = satirlar.filter(r => r.durum === "hata"), uyarilar = satirlar.filter(r => r.durum === "uyari");
const link = calismaLinki();
const ozet = `**${SITE.replace(/^https?:\/\//, "")}** · ${tarih} · ${satirlar.length} kontrol · ${hatalar.length} hata · ${uyarilar.length} uyarı · ${Math.round(sure / 1000)} sn${link ? ` · [çalışma](${link})` : ""}`;
const baslik = `Sales Corner canlı kontrol: ${hatalar.length} hata (${tarih})`;
const govde = hatalar.length
  ? `## ${baslik}\n\n${ozet}\n\n### Hatalar\n\n${tablo(hatalar)}\n${uyarilar.length ? `\n### Uyarılar\n\n${tablo(uyarilar)}\n` : ""}\n<details><summary>Tüm kontroller</summary>\n\n${tablo(satirlar)}\n\n</details>\n\n_Kontrol: tools/sales-canli-kontrol.mjs (her gün 08:00 TR). Hepsi geçince bu issue kendiliğinden kapanır._`
  : `## Düzeldi ✅\n\n${ozet}\n\nTüm canlı kontroller geçti; issue kapatılıyor.\n${uyarilar.length ? `\n### Uyarılar\n\n${tablo(uyarilar)}\n` : ""}`;

console.log(ozet + "\n\n" + tablo(satirlar));
const ozetDosya = process.env.GITHUB_STEP_SUMMARY;
let ghNot = "";
if (!DRY && process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
  try { ghNot = await issueGuncelle(hatalar, govde, baslik); }
  catch (e) { ghNot = "GitHub issue güncellenemedi: " + String(e?.message || e).slice(0, 200); console.error(ghNot); process.exitCode = 1; }
} else ghNot = DRY ? "kuru çalıştırma (--dry): issue'ya dokunulmadı" : "GITHUB_TOKEN yok: issue'ya dokunulmadı";
console.log("\nIssue: " + ghNot);
if (ozetDosya) {
  try { appendFileSync(ozetDosya, `## Sales Corner canlı kontrol\n\n${ozet}\n\nIssue: ${ghNot}\n\n${tablo(satirlar)}\n`); }
  catch (e) { console.error("Özet yazılamadı:", e?.message); }
}
if (hatalar.length) process.exitCode = 1;
