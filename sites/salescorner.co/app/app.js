// Sales Corner — SaaS paneli (app.salescorner.co ve salescorner.co/app/)
// Oturum Supabase'de; kota/plan kontrolü sunucuda (Supabase RPC + worker /api/app/*). Bu dosya yalnızca arayüzdür.
import { createClient } from "/_a/vendor/supabase-js-2.49.4.js";

const SB_URL = "https://jqllcrmwjxnuzxbzfydu.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbGxjcm13anhudXp4YnpmeWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0NzE2NzcsImV4cCI6MjExMTA0NzY3N30.kn2IDDNLcI3bjSOXlNWvx9ISHcvN9xkIezFh70xiqiw";
const SITE = "https://salescorner.co";
const initialHash = location.hash;
const sb = createClient(SB_URL, SB_ANON, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

const $app = document.getElementById("app");
const S = { session: null, ben: null, benErr: "", setupErr: false, planlar: null, recovery: /type=recovery/.test(initialHash), authErr: "", yillik: false };
{
  const m = initialHash.match(/error_description=([^&]+)/);
  if (m) S.authErr = decodeURIComponent(m[1].replace(/\+/g, " "));
}

// ---------- İkonlar (tek renk çizgi, currentColor) ----------
const ico = (d, z = 20) => `<svg class="ico" width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const P = {
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trend: '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/>',
  radar: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  head: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="11.5" cy="11.5" r="3.5"/><path d="m16 16-2-2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  up: '<path d="M7 17 17 7M7 7h10v10"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
};
const ic = (k, z) => ico(P[k], z);

// ---------- Modüller ----------
const MODS = [
  { k: "rakip", ad: "Rakip Analizi", ic: ic("target"), bg: "#eef0ff", d: "Rakip sitelerinizi tarar, güçlü/zayıf yönleri karşılaştırır ve hazır bir sunum çıkarır." },
  { k: "sekans", ad: "Sekans Yazarı", ic: ic("pen"), bg: "#fdf2f8", d: "Hedef firmaya özel cold call senaryosu ve LinkedIn mesaj sekansı yazar." },
  { k: "seo", ad: "SEO Analizi", ic: ic("trend"), bg: "#ecfdf3", d: "SEO puanı, eksikler, anahtar kelime hacimleri ve hazır içerik önerisi." },
  { k: "briefing", ad: "Toplantı Briefingi", ic: ic("clip"), bg: "#fffbeb", d: "Görüşme öncesi firma ve kişi araştırması, fırsat puanı ve briefing sunumu." },
  { k: "fireflies", ad: "Toplantı Analizi", ic: ic("mic"), bg: "#f0f9ff", d: "Fireflies kayıtlarınızı satış koçu gözüyle puanlar; itirazlar, BANT ve takip e-postası." },
  { k: "takip", ad: "Rakip Takip", ic: ic("radar"), bg: "#fef3f2", d: "Rakiplerinizin blog, RSS ve LinkedIn paylaşımlarını firma firma haftalık izler; özet ve aksiyon önerisi e-postanıza gelir." },
];
const MOD = Object.fromEntries(MODS.map(m => [m.k, m]));
const STEPS = {
  rakip: ["Siteler taranıyor", "Rakipler analiz ediliyor", "Karşılaştırma yapılıyor", "Sunum hazırlanıyor"],
  sekans: ["Kaynak inceleniyor", "Alıcı profili çıkarılıyor", "Cold call senaryosu yazılıyor", "LinkedIn mesajları yazılıyor", "Sunum hazırlanıyor"],
  seo: ["Sayfa indiriliyor", "Başlık ve meta etiketleri inceleniyor", "Anahtar kelimeler çıkarılıyor", "İçerik önerisi yazılıyor"],
  briefing: ["Firma araştırılıyor", "Kişi profili inceleniyor", "Satış fırsatı puanlanıyor", "Briefing sunumu hazırlanıyor"],
  fireflies: ["Transkript alınıyor", "Konuşma oranları hesaplanıyor", "Satış koçu analizi yapılıyor"],
};
const EST = { rakip: 240, sekans: 150, seo: 45, briefing: 120, fireflies: 60 };
const estDk = k => `${Math.round(EST[k] / 60) || 1}–${Math.ceil((EST[k] * 1.6) / 60)}`;
const PLAN_FALLBACK = [
  { kod: "deneme", ad: "Deneme (14 gün)", aylik_tl: 0, koltuk: 1, kota: { rakip: 1, sekans: 1, seo: 1, briefing: 1, fireflies: 1, takip: 1 } },
  { kod: "baslangic", ad: "Başlangıç", aylik_tl: 1490, koltuk: 1, kota: { rakip: 1, sekans: 3, seo: 2, briefing: 2, takip: 1 } },
  { kod: "profesyonel", ad: "Profesyonel", aylik_tl: 3490, koltuk: 1, kota: { rakip: 4, sekans: 15, seo: 8, briefing: 10, fireflies: 4, takip: 3 } },
  { kod: "ekip", ad: "Ekip", aylik_tl: 8990, koltuk: 5, kota: { rakip: 15, sekans: 60, seo: 30, briefing: 40, fireflies: 20, takip: 10 } },
  { kod: "ozel", ad: "Özel AI", aylik_tl: null, koltuk: 0, kota: { rakip: -1, sekans: -1, seo: -1, briefing: -1, fireflies: -1, takip: -1 } },
];
const PLAN_META = {
  baslangic: { d: "Tek başına satış yapanlar için temel araçlar." },
  profesyonel: { d: "Aktif satış yapan profesyoneller için tam paket.", hot: true, ek: ["Sunumlarda kendi logonuz"] },
  ekip: { d: "Satış ekipleri için yüksek kota.", ek: ["5 kullanıcıya kadar", "Öncelikli destek", "Sunumlarda kendi logonuz"] },
  ozel: { d: "Şirketinize özel kurulan yapay zekâ altyapısı." },
};

// ---------- Yardımcılar ----------
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const safeUrl = u => { try { const x = new URL(String(u)); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };
const fmtN = n => new Intl.NumberFormat("tr-TR").format(n);
const fmtD = d => (d ? new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "—");
const fmtDT = d => (d ? new Date(d).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const daysLeft = d => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 864e5));
const wait = ms => new Promise(r => setTimeout(r, ms));
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const initials = s => (String(s || "?").trim().split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("") || "?").toLocaleUpperCase("tr-TR");
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
function normUrl(s) {
  s = String(s || "").trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try { const u = new URL(s); return u.hostname.includes(".") ? u.href : ""; } catch { return ""; }
}
const store = {
  get(k, d) { try { const v = localStorage.getItem("sc_app_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("sc_app_" + k, JSON.stringify(v)); } catch {} },
};
let toastT;
function toast(t) {
  const el = document.getElementById("toast");
  el.textContent = t; el.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2600);
}
const msg = (kind, html) => `<div class="msg ${kind}" role="${kind === "err" ? "alert" : "status"}">${html}</div>`;
function setMsg(id, kind, html) { const el = document.getElementById(id); if (el) el.innerHTML = html ? msg(kind, html) : ""; }
function busy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.l = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin s"></span>${esc(label || "Lütfen bekleyin…")}`; }
  else { btn.disabled = false; if (btn.dataset.l) btn.innerHTML = btn.dataset.l; }
}
function trErr(e) {
  const m = (e && (e.message || e.error_description || e.msg)) || String(e || "");
  const map = [
    [/invalid login credentials/i, "E-posta ya da şifre hatalı."],
    [/email not confirmed/i, "E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzdaki bağlantıya tıklayın."],
    [/already registered|already been registered|already exists/i, "Bu e-posta ile zaten bir hesap var. Giriş yapın ya da şifrenizi sıfırlayın."],
    [/signups? not allowed|signup.*disabled/i, "Yeni kayıtlar şu an kapalı. Lütfen bizimle iletişime geçin."],
    [/weak.?password|pwned|known to be weak|easy to guess/i, "Bu şifre çok zayıf. Harf, rakam ve sembol içeren daha güçlü bir şifre seçin."],
    [/password should|password.*(short|at least|characters)/i, "Şifre en az 8 karakter olmalı."],
    [/same.?password|different from the old/i, "Yeni şifre eskisinden farklı olmalı."],
    [/rate limit|too many|for security purposes|over_email_send/i, "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin."],
    [/invalid.*email|unable to validate email|email address.*invalid/i, "Geçerli bir e-posta adresi girin."],
    [/expired|invalid.*(link|token|flow)|otp/i, "Bağlantının süresi dolmuş ya da geçersiz. Lütfen yeniden isteyin."],
    [/failed to fetch|networkerror|load failed/i, "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin."],
    [/jwt|not authenticated|oturum yok|auth session missing/i, "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın."],
    [/geçersiz anahtar/i, "Anahtar 10–300 karakter olmalı."],
    [/kullanıcı bulunamadı/i, "Bu e-posta ile kayıtlı kullanıcı yok. Önce kişinin kayıt olması gerekir."],
    [/yetki yok/i, "Bu işlem için yetkiniz yok."],
    [/pro_gerekli/i, "Kendi logonuzu eklemek Profesyonel ve üstü planlarda var."],
    [/gecersiz_logo/i, "Logo okunamadı ya da çok büyük. Daha küçük bir PNG/JPG deneyin."],
    [/gecersiz_oran/i, "Logo çok ince ya da çok uzun. Daha dengeli oranlı bir logo deneyin."],
  ];
  for (const [rx, t] of map) if (rx.test(m)) return t;
  return m || "Beklenmeyen bir hata oluştu.";
}

// "SEO Analizi" → "SEO analizi": kısaltmalar büyük harf kalır
const kucuk = s => s.split(" ").map(w => w.length > 1 && w === w.toLocaleUpperCase("tr-TR") ? w : w.toLocaleLowerCase("tr-TR")).join(" ");

// ---------- Sunucu çağrıları ----------
async function rpc(fn, args) {
  const { data, error, status } = await sb.rpc(fn, args || {});
  if (error) {
    error.status = status;
    if (/PGRST202|could not find the function|does not exist/i.test(`${error.code} ${error.message}`)) S.setupErr = true;
    throw error;
  }
  return data;
}
// Firma profili (Hesabım > Firma profili): briefing/sekans "biz kimiz" bilgisini buradan alır
let FIRMA = { v: undefined, yuk: false, err: "" };
const FIRMA_ALAN = [["firma_adi", "Firma adı"], ["web", "Web sitesi"], ["urunler", "Ürün / hizmetler"], ["hedef", "Hedef müşteri"], ["deger", "Değer önerisi"]];
const firmaEksik = f => FIRMA_ALAN.filter(([k]) => !String(f?.[k] ?? "").trim());
// Sonucu yalnız başladığı FIRMA nesnesine yazar; arada çıkış yapıldıysa (FIRMA yenilendiyse) false döner
async function loadFirma() {
  const o = FIRMA;
  o.yuk = true; o.err = "";
  try { const r = await rpc("app_firma_al"); o.v = r && typeof r === "object" && !Array.isArray(r) ? r : null; }
  catch (e) { o.err = trErr(e); o.v = null; }
  o.yuk = false;
  return o === FIRMA;
}
// Kullanıcı bir alana yazdıysa geç gelen profil yüzünden sayfayı yeniden çizip yazdığını silmeyelim
let yaziSay = 0;
$app.addEventListener("input", () => { yaziSay++; });
// Sayfa ilk açıldığında profil yoksa bir kez çeker, gelince o sayfadaysak yeniden çizer (hata olursa "Tekrar dene" ile yeniden ister)
function firmaIste(sayfa) {
  if (FIRMA.v !== undefined || FIRMA.yuk) return;
  const y = yaziSay;
  loadFirma().then(ok => {
    if (!ok || route !== sayfa) return;
    if (yaziSay === y) return render();
    const el = document.getElementById("firma");
    if (sayfa === "hesap" && el && S.ben) { el.outerHTML = firmaBolum(S.ben); bindFirma(); }
  });
}
async function loadBen() {
  try { S.ben = await rpc("app_ben"); S.benErr = ""; S.setupErr = false; }
  catch (e) {
    S.ben = null; S.benErr = trErr(e);
    // sunucu oturumu reddetti (iptal/silinmiş oturum): hata ekranında bırakma, yerel oturumu kapat → giriş
    if (e?.status === 401 || /PGRST30[123]|jwt/i.test(`${e?.code} ${e?.message}`)) {
      S.session = null; S.authErr = "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.";
      try { await sb.auth.signOut({ scope: "local" }); } catch {}
    }
  }
}
async function loadPlanlar() {
  if (S.planlar) return S.planlar;
  try { const p = await rpc("app_planlar"); S.planlar = Array.isArray(p) && p.length ? p : PLAN_FALLBACK; }
  catch { S.planlar = PLAN_FALLBACK; }
  return S.planlar;
}
async function readJSON(r) {
  const t = await r.text();
  try { const j = JSON.parse(t.trim()); return j && typeof j === "object" ? j : null; } catch { return null; }
}
// Worker /api/app/* — kullanıcının kendi oturum anahtarıyla
async function api(path, body) {
  const { data } = await sb.auth.getSession();
  const tok = data.session?.access_token;
  if (!tok) { go("giris"); return { success: false, message: "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın." }; }
  let r, j;
  try {
    r = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", authorization: "Bearer " + tok, apikey: SB_ANON },
      body: body ? JSON.stringify(body) : undefined,
    });
    j = await readJSON(r);
  } catch { return { success: false, message: "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin." }; }
  if (!j) return { success: false, message: r.status >= 500 ? "Sunucu şu an yanıt veremedi, lütfen tekrar deneyin." : `Beklenmeyen yanıt (${r.status}).` };
  if (j.success !== true) { j.success = false; j.message = j.message || j.error || "İşlem tamamlanamadı."; }
  if (r.status === 401) j.message = "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.";
  return j;
}
function applyKota(k, q) {
  if (!S.ben || !q) return;
  S.ben.kullanim = S.ben.kullanim || {};
  S.ben.kullanim[k] = q.limit > 0 ? q.limit - q.kalan : (S.ben.kullanim[k] || 0) + 1;
}
function durum(k) {
  const b = S.ben;
  if (!b) return { ok: false, neden: "yok", lim: 0, kul: 0 };
  const lim = Number((b.kota || {})[k] ?? 0), kul = Number(k === "takip" ? b.takip_adet || 0 : (b.kullanim || {})[k] || 0);
  if (!b.aktif) return { ok: false, neden: "sure", lim, kul };
  if (!lim) return { ok: false, neden: "plan", lim, kul };
  if (lim > 0 && kul >= lim) return { ok: false, neden: "kota", lim, kul };
  return { ok: true, lim, kul };
}
const NEDEN = {
  sure: () => (S.ben?.plan === "deneme" ? "14 günlük deneme süreniz doldu." : "Plan süreniz doldu."),
  plan: k => `${MOD[k]?.ad || "Bu araç"} mevcut planınıza dahil değil.`,
  kota: k => (k === "takip" ? "Planınızdaki takip edilen firma sınırına ulaştınız." : `Bu ayki ${MOD[k]?.ad || ""} kullanım hakkınız doldu.`),
};

// ---------- İşler (arka planda süren analizler) ----------
// Rakip ve sekans işi durum sorgulandıkça ilerler: sorgu, sayfa değişse de bu sekmede sürer; sayfa yenilenirse kaldığı yerden devam eder.
const STATUS = { rakip: "/api/rakip-analizi-status?executionId=", sekans: "/api/sekans-status?executionId=" };
const JOBS = {};
{
  const saved = store.get("jobs", {});
  for (const k of Object.keys(STATUS)) if (saved[k] && saved[k].id) JOBS[k] = saved[k];
}
function saveJobs() {
  const o = {};
  for (const k of Object.keys(STATUS)) if (JOBS[k] && !JOBS[k].sync) o[k] = JOBS[k];
  store.set("jobs", o);
}
function addHist(e) {
  const h = store.get("hist", []);
  h.unshift({ ...e, at: Date.now() });
  store.set("hist", h.slice(0, 12));
}
const polling = {};
async function poll(k) {
  const j = JOBS[k];
  if (!j || polling[k] === j) return;
  polling[k] = j;
  let fails = 0;
  await wait(Math.max(0, 5000 - (Date.now() - j.t0)));
  while (JOBS[k] === j && j.state === "run") {
    if (Date.now() - j.t0 > 12 * 60e3) { j.state = "err"; j.err = "İşlem beklenenden uzun sürdü. Lütfen tekrar deneyin."; break; }
    let r = null, http = 0;
    try { const res = await fetch(STATUS[k] + encodeURIComponent(j.id), { headers: { accept: "application/json" } }); http = res.status; r = await readJSON(res); } catch {}
    if (JOBS[k] !== j) break;
    const done = r && (r.status === "completed" || (k === "rakip" ? r.slides_url || r.slides_view_url : r.presentationUrl || r.presentationViewUrl));
    if (done) {
      j.state = "done"; j.res = r;
      const url = safeUrl(k === "rakip" ? r.slides_view_url || r.slides_url : r.presentationViewUrl || r.presentationUrl || r.publicUrl);
      if (url) addHist({ k, title: j.title, url });
    } else if (!r || http >= 500) {
      if (++fails > 4) { j.state = "err"; j.err = (r && (r.message || r.error)) || "Durum bilgisi alınamadı. Lütfen tekrar deneyin."; }
    } else if (r.success === false || r.status === "error" || r.status === "failed") {
      j.state = "err"; j.err = r.error || r.message || "İşlem tamamlanamadı.";
    } else {
      fails = 0;
      if (typeof r.progress === "number") j.prog = Math.max(j.prog || 0, Math.min(99, r.progress));
      if (r.current_step) j.step = String(r.current_step).slice(0, 160);
    }
    saveJobs();
    if (route === k) renderJob(k);
    if (j.state === "run") await wait(8000);
  }
  if (polling[k] === j) polling[k] = null;
  saveJobs();
  if (j.state === "err") await iade(k, j);
  if (JOBS[k] === j) {
    if (j.state === "done") toast(`${MOD[k].ad} hazır ✓`);
    if (route === k) render(); else if (S.ben && $app.querySelector(".shell")) render();
  }
}
// Yarım kalan/başarısız iş için kullanım hakkı bir kez iade edilir (sunucu işin gerçekten başarısız olduğunu doğrular).
async function iade(k, j) {
  if (!j || !j.id || j.iade || j.state !== "err") return;
  j.iade = 1; saveJobs();
  const r = await api("/api/app/iade", { modul: k, executionId: j.id }).catch(() => null);
  if (!r || !r.success) return;
  j.iade = 2;
  if (r.kota) applyKota(k, r.kota);
  j.err = (j.err || "İşlem tamamlanamadı.") + " Kullanım hakkınız iade edildi.";
  saveJobs();
  toast("Kullanım hakkınız iade edildi");
  if (route === k || (S.ben && $app.querySelector(".shell"))) render();
}
async function startAsync(k, body, title) {
  const res = await api("/api/app/" + k, body);
  if (!res.success) return res;
  applyKota(k, res.kota);
  const id = res.sonuc && res.sonuc.executionId;
  if (!id) return { success: false, message: "İşlem başlatılamadı, lütfen tekrar deneyin." };
  JOBS[k] = { id, t0: Date.now(), title, state: "run", prog: 2, step: "" };
  saveJobs(); poll(k);
  return res;
}
async function startSync(k, path, body, title, onDone) {
  const job = (JOBS[k] = { sync: true, t0: Date.now(), title, state: "run" });
  render();
  const res = await api(path, body);
  if (JOBS[k] !== job) return;
  if (res.success) {
    applyKota(k, res.kota);
    job.state = "done"; job.res = res;
    if (onDone) onDone(res);
    toast(`${MOD[k].ad} hazır ✓`);
  } else { job.state = "err"; job.err = res.message; job.neden = res.neden; }
  if (route === k || $app.querySelector(".shell")) render();
}
// Saniyelik sayaç: süren işin geçen süresi, ilerleme çubuğu ve adımları (DOM yeniden çizilmez)
setInterval(() => {
  const j = JOBS[route];
  if (!j || j.state !== "run") return;
  const out = document.getElementById("out");
  if (!out) return;
  const el = (Date.now() - j.t0) / 1000, n = STEPS[route].length;
  const pct = typeof j.prog === "number" && !j.sync ? j.prog : Math.min(95, (el / EST[route]) * 100);
  const idx = Math.min(n - 1, Math.floor((pct / 100) * n));
  const t = out.querySelector("[data-el]"); if (t) t.textContent = mmss(el);
  const b = out.querySelector("[data-bar]"); if (b) b.style.width = Math.max(3, pct).toFixed(1) + "%";
  out.querySelectorAll(".steps li").forEach((li, i) => { li.className = i < idx ? "done" : i === idx ? "on" : ""; });
}, 1000);

// ---------- Yönlendirme ----------
let route = "";
const AUTH_ROUTES = new Set(["giris", "kayit", "sifre", "yeni-sifre"]);
function go(n) { if (location.hash !== "#/" + n) location.hash = "#/" + n; else render(); }
function render() {
  let n = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || "";
  if (S.recovery && S.session) n = "yeni-sifre";
  else if (!S.session) { if (!AUTH_ROUTES.has(n) || n === "yeni-sifre") n = n === "kayit" || n === "sifre" ? n : "giris"; }
  else if (AUTH_ROUTES.has(n) || !PAGES[n]) n = "panel";
  if (location.hash !== "#/" + n) history.replaceState(null, "", location.pathname + location.search + "#/" + n);
  const changed = route !== n;
  route = n;
  if (!AUTH_ROUTES.has(n) && !S.ben) return errorPage();
  if (n === "admin" && !S.ben.admin) return go("panel");
  PAGES[n]();
  if (changed) { window.scrollTo(0, 0); document.title = (TITLES[n] ? TITLES[n] + " · " : "") + "Sales Corner"; }
}
const TITLES = { giris: "Giriş", kayit: "Kayıt ol", sifre: "Şifre sıfırlama", "yeni-sifre": "Yeni şifre", panel: "Panel", rakip: "Rakip Analizi", sekans: "Sekans Yazarı", seo: "SEO Analizi", briefing: "Toplantı Briefingi", fireflies: "Toplantı Analizi", takip: "Rakip Takip", fiyatlar: "Fiyatlar", hesap: "Hesabım", admin: "Yönetim", ozel: "Size özel çözümler" };

// ---------- Giriş ekranları ----------
const LOGO = `<img class="lg" src="/img/sales-corner-logo.png?v=1" width="495" height="178" alt="Sales Corner">`;
const LOGO_D = `<img class="lg" src="/img/sales-corner-logo-dark.png?v=1" width="495" height="178" alt="Sales Corner">`;
function authLayout(inner) {
  $app.innerHTML = `<div class="auth">
  <aside class="auth-art">
    <a class="brand" href="${SITE}/">${LOGO_D}</a>
    <div>
      <h1>Satışın ağır işini yapay zekâya bırakın.</h1>
      <p class="lead">Rakip analizi, kişiye özel sekanslar, SEO raporu, toplantı briefingi ve görüşme analizi tek panelde, dakikalar içinde.</p>
      <ul class="feat">${MODS.filter(m => m.k !== "takip").map(m => `<li><i aria-hidden="true">${m.ic}</i><div><b>${esc(m.ad)}</b><span>${esc(m.d)}</span></div></li>`).join("")}</ul>
    </div>
    <small>© ${new Date().getFullYear()} Sales Corner · <a href="${SITE}/kvkk" style="color:inherit">KVKK</a> · <a href="${SITE}/gizlilik-politikasi" style="color:inherit">Gizlilik</a> · <a href="${SITE}/cerez-politikasi" style="color:inherit">Çerez Politikası</a></small>
  </aside>
  <main class="auth-main"><div class="auth-card">
    <a class="brand" href="${SITE}/">${LOGO}</a>
    ${inner}
    <p class="auth-legal"><a href="${SITE}/kvkk">KVKK</a> · <a href="${SITE}/gizlilik-politikasi">Gizlilik</a> · <a href="${SITE}/cerez-politikasi">Çerez Politikası</a></p>
  </div></main>
</div>`;
}
const tabs = on => `<div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="${on === "giris"}" data-go="giris">Giriş yap</button><button type="button" role="tab" aria-selected="${on === "kayit"}" data-go="kayit">Ücretsiz dene</button></div>`;
const pwField = (id, label, ac, extra = "") => `<div class="f"><label for="${id}">${label}</label><div class="pw"><input class="in" id="${id}" type="password" autocomplete="${ac}" required ${extra}><button type="button" data-eye="${id}" aria-label="Şifreyi göster">Göster</button></div></div>`;
const redirectTo = () => location.origin + location.pathname;

function pageGiris() {
  authLayout(`<h2>Tekrar hoş geldiniz</h2><p class="sub">Hesabınıza giriş yapın.</p>${tabs("giris")}
  <div id="m">${S.authErr ? msg("err", esc(trErr(S.authErr))) : ""}</div>
  <form id="f" data-sk-noform>
    <div class="f"><label for="em">E-posta</label><input class="in" id="em" type="email" autocomplete="email" required></div>
    <div class="f"><div class="row"><label for="pw">Şifre</label><button type="button" class="linkbtn" data-go="sifre">Şifremi unuttum</button></div>
      <div class="pw"><input class="in" id="pw" type="password" autocomplete="current-password" required><button type="button" data-eye="pw" aria-label="Şifreyi göster">Göster</button></div></div>
    <button class="btn btn-p btn-w" type="submit">Giriş yap</button>
  </form>`);
  S.authErr = "";
  const f = document.getElementById("f");
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector("[type=submit]"), email = f.em.value.trim();
    busy(btn, true, "Giriş yapılıyor…"); setMsg("m");
    const { data, error } = await sb.auth.signInWithPassword({ email, password: f.pw.value });
    if (error) {
      busy(btn, false);
      const t = trErr(error);
      setMsg("m", "err", esc(t) + (/doğrulanmadı/.test(t) ? ` <button type="button" class="linkbtn" id="rs">Doğrulama e-postasını tekrar gönder</button>` : ""));
      const rs = document.getElementById("rs");
      if (rs) rs.onclick = () => resend(email);
      return;
    }
    S.session = data.session;
    await loadBen();
    go("panel");
  };
}
async function resend(email) {
  const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectTo() } });
  setMsg("m", error ? "err" : "ok", esc(error ? trErr(error) : "Doğrulama e-postası tekrar gönderildi. Gelen kutunuzu (ve spam klasörünü) kontrol edin."));
}
function denemeOzet() {
  const deneme = (S.planlar || PLAN_FALLBACK).find(p => p.kod === "deneme") || PLAN_FALLBACK[0];
  const q = deneme.kota || {};
  return `Denemede bütün araçlar açık: ${MODS.filter(m => q[m.k]).map(m => m.k === "takip" ? `${q[m.k]} firma için rakip takibi` : `${q[m.k]} ${kucuk(m.ad)}`).join(", ")}.`;
}
async function pageKayit() {
  authLayout(`<h2>14 gün ücretsiz deneyin</h2><p class="sub">Kredi kartı gerekmez. Dakikalar içinde ilk analizinizi alın.</p>${tabs("kayit")}
  <div class="trial-note">${ic("gift", 16)}<span id="trial-ozet">${esc(denemeOzet())}</span></div>
  <div id="m"></div>
  <form id="f" data-sk-noform>
    <div class="grid2">
      <div class="f"><label for="ad">Ad soyad</label><input class="in" id="ad" autocomplete="name" required maxlength="120"></div>
      <div class="f"><label for="sr">Şirket</label><input class="in" id="sr" autocomplete="organization" maxlength="160"></div>
    </div>
    <div class="f"><label for="em">İş e-postası</label><input class="in" id="em" type="email" autocomplete="email" required></div>
    ${pwField("pw", "Şifre", "new-password", 'minlength="8"')}
    <div class="f"><label style="display:flex;gap:8px;align-items:flex-start;font-weight:500;color:var(--mute)"><input type="checkbox" id="ok" required style="margin-top:4px"><span><a href="${SITE}/kullanim-kosullari" target="_blank" rel="noopener">Kullanım koşullarını</a> kabul ediyorum. <a href="${SITE}/kvkk" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okudum.</span></label></div>
    <button class="btn btn-p btn-w" type="submit">Ücretsiz hesap oluştur</button>
  </form>`);
  const f = document.getElementById("f");
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector("[type=submit]"), email = f.em.value.trim();
    if (f.pw.value.length < 8) return setMsg("m", "err", "Şifre en az 8 karakter olmalı.");
    busy(btn, true, "Hesap oluşturuluyor…"); setMsg("m");
    const { data, error } = await sb.auth.signUp({ email, password: f.pw.value, options: { emailRedirectTo: redirectTo(), data: { ad: f.ad.value.trim(), sirket: f.sr.value.trim() } } });
    busy(btn, false);
    if (error) return setMsg("m", "err", esc(trErr(error)));
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
      return setMsg("m", "err", "Bu e-posta ile zaten bir hesap var. <button type=\"button\" class=\"linkbtn\" data-go=\"giris\">Giriş yapın</button> ya da şifrenizi sıfırlayın.");
    if (data.session) {
      S.session = data.session;
      await loadBen();
      if (S.ben && (f.ad.value.trim() || f.sr.value.trim())) { try { S.ben = await rpc("app_profil", { p_ad: f.ad.value.trim(), p_sirket: f.sr.value.trim() }); } catch {} }
      return go("panel");
    }
    f.hidden = true;
    setMsg("m", "ok", `<div><b>Neredeyse hazır!</b><br><b>${esc(email)}</b> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıklayınca paneliniz açılır.<br><button type="button" class="linkbtn" id="rs" style="margin-top:8px">E-posta gelmedi mi? Tekrar gönder</button></div>`);
    document.getElementById("rs").onclick = () => resend(email);
  };
  if (!S.planlar) loadPlanlar().then(() => { const o = document.getElementById("trial-ozet"); if (o) o.textContent = denemeOzet(); });
}
function pageSifre() {
  authLayout(`<h2>Şifrenizi sıfırlayın</h2><p class="sub">E-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.</p>
  <div id="m"></div>
  <form id="f" data-sk-noform>
    <div class="f"><label for="em">E-posta</label><input class="in" id="em" type="email" autocomplete="email" required></div>
    <button class="btn btn-p btn-w" type="submit">Sıfırlama bağlantısı gönder</button>
  </form>
  <p style="margin-top:18px;text-align:center"><button type="button" class="linkbtn" data-go="giris">← Girişe dön</button></p>`);
  const f = document.getElementById("f");
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector("[type=submit]");
    busy(btn, true, "Gönderiliyor…");
    const { error } = await sb.auth.resetPasswordForEmail(f.em.value.trim(), { redirectTo: redirectTo() });
    busy(btn, false);
    // Hesap varlığını sızdırmamak için "kullanıcı yok" türü hatalar başarı gibi gösterilir; ağ/5xx/SMTP/rate-limit hataları gösterilir, form açık kalır.
    if (error && !/not.?found|no user|(does not|doesn't) exist/i.test(error.message || "")) return setMsg("m", "err", esc(trErr(error)));
    f.hidden = true;
    setMsg("m", "ok", "Bu adresle kayıtlı bir hesap varsa sıfırlama bağlantısı birkaç dakika içinde gelecek. Spam klasörünü de kontrol edin.");
  };
}
function pageYeniSifre() {
  authLayout(`<h2>Yeni şifre belirleyin</h2><p class="sub">Hesabınız için yeni bir şifre seçin.</p>
  <div id="m"></div>
  <form id="f" data-sk-noform>
    ${pwField("p1", "Yeni şifre", "new-password", 'minlength="8"')}
    ${pwField("p2", "Yeni şifre (tekrar)", "new-password", 'minlength="8"')}
    <button class="btn btn-p btn-w" type="submit">Şifreyi kaydet</button>
  </form>`);
  const f = document.getElementById("f");
  f.onsubmit = async e => {
    e.preventDefault();
    if (f.p1.value.length < 8) return setMsg("m", "err", "Şifre en az 8 karakter olmalı.");
    if (f.p1.value !== f.p2.value) return setMsg("m", "err", "Şifreler aynı değil.");
    const btn = f.querySelector("[type=submit]");
    busy(btn, true, "Kaydediliyor…");
    const { error } = await sb.auth.updateUser({ password: f.p1.value });
    busy(btn, false);
    if (error) return setMsg("m", "err", esc(trErr(error)));
    S.recovery = false;
    await loadBen();
    toast("Şifreniz güncellendi ✓");
    go("panel");
  };
}

// ---------- Uygulama kabuğu ----------
const ICON_OUT = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`;
const ICON_X = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>`;
const ICON_LOCK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
function shell(content) {
  const b = S.ben, name = b.ad || b.email;
  const nav = (n, ad, extra = "") => `<a href="#/${n}"${n === route ? ' aria-current="page"' : ""}><span class="lb">${esc(ad)}</span>${extra}</a>`;
  const badge = k => (JOBS[k]?.state === "run" ? '<span class="lock" title="Hazırlanıyor"><span class="spin s"></span></span>' : durum(k).neden === "plan" ? `<span class="lock" title="Planınıza dahil değil">${ICON_LOCK}</span>` : "");
  const kalan = daysLeft(b.bitis);
  $app.innerHTML = `<div class="shell" id="shell">
  <aside class="side" aria-label="Menü">
    <div class="side-head"><button class="iconbtn side-tog" type="button" data-side aria-label="Menüyü kapat" title="Menüyü kapat">${ICON_X}</button><a class="brand" href="#/panel">${LOGO}</a></div>
    <nav class="nav">
      ${nav("panel", "Panel")}
      <div class="nav-h">Araçlar</div>
      ${MODS.map(m => nav(m.k, m.ad, badge(m.k))).join("")}
      <div class="nav-h">Size özel</div>
      ${nav("ozel", "Size özel çözümler")}
      <div class="nav-h">Hesap</div>
      ${nav("fiyatlar", "Planlar ve fiyatlar")}
      ${nav("hesap", "Hesabım")}
      ${b.admin ? nav("admin", "Yönetim") : ""}
    </nav>
    <div class="side-foot">
      <div class="plan-box"><b>${esc(b.plan_ad || b.plan)}</b><span>${!b.aktif ? "Süre doldu" : b.plan === "deneme" ? `Denemede ${kalan} gün kaldı` : `Geçerlilik: ${fmtD(b.bitis)}`}</span>
        ${b.plan !== "ozel" ? `<a class="btn btn-p btn-s btn-w" href="#/fiyatlar">${b.plan === "deneme" || !b.aktif ? "Plan seç" : "Planı yükselt"}</a>` : ""}</div>
      <div class="me"><span class="av" aria-hidden="true">${esc(initials(name))}</span><div class="t" title="${esc(b.email)}"><b>${esc(name)}</b><span>${esc(b.email)}</span></div><button class="iconbtn" data-logout title="Çıkış yap" aria-label="Çıkış yap">${ICON_OUT}</button></div>
    </div>
  </aside>
  <div>
    <div class="scrim" data-menu></div>
    <header class="top"><button class="iconbtn" data-menu aria-label="Menüyü aç">${ic("menu")}</button><a class="brand" href="#/panel">${LOGO}</a><span class="av" aria-hidden="true">${esc(initials(name))}</span></header>
    <main class="main"><div class="wrap">${content}</div></main>
  </div>
</div>`;
}
const ph = (t, p, right = "") => `<div class="ph"><div><h1>${t}</h1>${p ? `<p>${p}</p>` : ""}</div>${right}</div>`;
function errorPage() {
  const setup = S.setupErr;
  $app.innerHTML = `<div class="auth-main" style="min-height:100vh"><div class="auth-card" style="text-align:center">
    <a class="brand" href="${SITE}/" style="display:flex;justify-content:center">${LOGO}</a>
    <h2>${setup ? "Panel kurulumu tamamlanıyor" : "Hesap bilgileri alınamadı"}</h2>
    <p class="sub" style="margin-top:8px">${setup ? "Sistem kısa süre içinde hazır olacak. Lütfen biraz sonra tekrar deneyin." : esc(S.benErr || "Lütfen tekrar deneyin.")}</p>
    <div class="row" style="justify-content:center"><button class="btn btn-p" id="re">Tekrar dene</button><button class="btn btn-g" data-logout>Çıkış yap</button></div>
  </div></div>`;
  document.getElementById("re").onclick = async e => { busy(e.currentTarget, true); await loadBen(); render(); };
}

// ---------- Panel ----------
function pagePanel() {
  const b = S.ben, kalan = daysLeft(b.bitis);
  const toplam = Object.values(b.kullanim || {}).reduce((a, n) => a + Number(n || 0), 0);
  const ad = (b.ad || "").split(" ")[0];
  firmaIste("panel");
  const eksik = FIRMA.v !== undefined && !FIRMA.err ? firmaEksik(FIRMA.v) : [];
  const dolu = FIRMA_ALAN.length - eksik.length;
  const profil = eksik.length ? `<div class="banner trial" style="align-items:center"><div style="flex:1;min-width:240px"><b style="display:flex;align-items:center;gap:6px">${ic("user", 16)}Profilinizi doldurun · %${Math.round((dolu / FIRMA_ALAN.length) * 100)}</b><span>Briefing ve sekanslar firmanızı, ürünlerinizi ve hedef müşterinizi bu bilgilerden tanır. Eksik: ${eksik.map(([, a]) => esc(a)).join(", ")}.</span>
    <div class="meter" aria-hidden="true" style="margin-top:10px;max-width:320px"><i style="width:${(dolu / FIRMA_ALAN.length) * 100}%"></i></div></div><a class="btn btn-p" href="#/hesap">Profili doldur</a></div>` : "";
  let banner = "";
  if (!b.aktif) banner = `<div class="banner end"><div><b>${esc(NEDEN.sure())}</b><br><span>Araçları kullanmaya devam etmek için bir plan seçin; verileriniz ve geçmişiniz korunur.</span></div><a class="btn btn-p" href="#/fiyatlar">Planları gör</a></div>`;
  else if (b.plan === "deneme") banner = `<div class="banner trial"><div><b>Ücretsiz denemenizin bitmesine ${kalan} gün kaldı.</b><br><span>Bütün araçları deneyin; devam etmek istediğinizde size uygun planı seçin.</span></div><a class="btn btn-g" href="#/fiyatlar">Planları gör</a></div>`;
  const run = MODS.filter(m => JOBS[m.k]?.state === "run");
  const hist = store.get("hist", []);
  const card = m => {
    const d = durum(m.k), lim = d.lim, pct = lim > 0 ? Math.min(100, (d.kul / lim) * 100) : 0;
    const tk = m.k === "takip";
    const foot = d.neden === "plan" ? `<span class="pill">${ICON_LOCK} Planınıza dahil değil</span><span>Planı yükselt →</span>`
      : lim < 0 ? `<span class="pill ok">Sınırsız</span><span>${tk ? `${d.kul} firma takipte · ` : ""}Aç →</span>`
      : `<div class="meter${d.kul >= lim ? " full" : ""}" aria-hidden="true"><i style="width:${pct}%"></i></div><span>${d.kul} / ${lim} ${tk ? "firma · haftalık" : "bu ay"}</span>`;
    const off = !d.ok && !(tk && d.neden === "kota");
    return `<a class="card mod${off ? " off" : ""}" href="#/${d.neden === "plan" ? "fiyatlar" : m.k}">
      <div class="row" style="justify-content:flex-start"><span class="mi" aria-hidden="true">${m.ic}</span><h3>${esc(m.ad)}</h3>${JOBS[m.k]?.state === "run" ? '<span class="pill acc" style="margin-left:auto"><span class="spin s"></span>Hazırlanıyor</span>' : ""}</div>
      <p>${esc(m.d)}</p><div class="foot">${foot}</div></a>`;
  };
  shell(`${ph(`Merhaba${ad ? ", " + esc(ad) : ""}`, "Bugün hangi satış işini hızlandıralım?")}
  ${banner}
  ${profil}
  ${b.admin ? msg("info", `${ic("shield", 16)}<span>Yönetici hesabıyla girdiniz. <a href="#/admin">Kullanıcılar ve planlar</a></span>`) : ""}
  ${run.map(m => msg("info", `<span class="spin s"></span><span><b>${esc(m.ad)}</b> arka planda hazırlanıyor. Bu sekme açık kaldığı sürece devam eder. <a href="#/${m.k}">İzle →</a></span>`)).join("")}
  <div class="stats">
    <div class="card stat"><span>Plan</span><b>${esc(b.plan_ad || b.plan)}</b></div>
    <div class="card stat"><span>${b.plan === "deneme" ? "Deneme bitişi" : "Geçerlilik"}</span><b>${b.aktif ? fmtD(b.bitis) : "Süre doldu"}</b></div>
    <div class="card stat"><span>Bu ay yapılan işlem</span><b>${fmtN(toplam)}</b></div>
    <div class="card stat"><span>Fireflies</span><b>${b.fireflies ? "Bağlı ✓" : `<a href="#/fireflies" style="font-size:16px">Bağla →</a>`}</b></div>
  </div>
  <div class="cards">${MODS.map(card).join("")}</div>
  <a class="card oz-teaser" href="#/ozel"><div><span class="pill acc">Size özel</span><h3>Hazır araçların ötesine geçin</h3><p>HTML sorgusu, canlı satış destek eklentisi, keyword scanner, CRM entegrasyonu… Ekibinize özel otomasyonları biz geliştirelim.</p></div><div class="oz-mini" aria-hidden="true">${OZ_KAT.slice(0, 4).map(x => `<span><i>${x.ic}</i>${esc(x.ad)}</span>`).join("")}</div><span class="btn btn-p">Paketleri gör →</span></a>
  ${hist.length ? `<h2 style="margin:30px 0 12px">Son çalışmalarınız <span class="pill" style="vertical-align:middle">bu cihaz</span></h2>
  <div class="card scroll-x"><table class="tbl"><thead><tr><th>Araç</th><th>Konu</th><th>Tarih</th><th></th></tr></thead><tbody>
  ${hist.map(h => `<tr><td>${MOD[h.k] ? esc(MOD[h.k].ad) : ""}</td><td>${esc(h.title)}</td><td>${fmtDT(h.at)}</td><td style="text-align:right">${safeUrl(h.url) ? `<a class="btn btn-g btn-s" href="${esc(safeUrl(h.url))}" target="_blank" rel="noopener">Aç ↗</a>` : ""}</td></tr>`).join("")}
  </tbody></table></div>` : ""}`);
}

// ---------- Size özel ----------
const OZ_PAKET = [
  { k: "hiz", ad: "Satış Hızlandırma", ic: ic("zap", 22), d: "Görüşme anında ekibinizin yanında duran araçlar.", li: ["Canlı satış destek Chrome eklentisi", "Görüşmede itiraz cevapları ve konuşma ipuçları", "Toplantı öncesi otomatik briefing", "Görüşme notlarının CRM'e aktarımı"] },
  { k: "veri", ad: "Lead ve Veri", ic: ic("search", 22), hot: true, d: "Hedef pazarınızı tarar, temiz ve kullanılabilir veri çıkarır.", li: ["HTML sorgusu ile web'den düzenli veri", "Keyword scanner ile fırsat ve sinyal takibi", "Rakip fiyat ve içerik izleme", "Google Sheets veya CRM'e otomatik aktarım"] },
  { k: "ai", ad: "Entegrasyon ve Kişisel AI", ic: ic("cpu", 22), d: "Satış sürecinizin tamamına bağlanan, size özel yapay zekâ.", li: ["HubSpot, Pipedrive, Salesforce entegrasyonu", "Şirket verinizle çalışan kişisel AI asistan", "Teklif ve e-posta taslağı üretici", "Slack / Teams bildirim botları"] },
];
const OZ_KAT = [
  { k: "html", ad: "HTML sorgusu", ic: ic("code"), bg: "#eef0ff", d: "Herhangi bir web sayfasından firma, ürün, fiyat ve iletişim bilgisini düzenli tabloya çevirir." },
  { k: "ext", ad: "Canlı satış destek eklentisi", ic: ic("head"), bg: "#fdf2f8", d: "Görüşme sırasında tarayıcıda itiraz cevapları, fiyat bilgisi ve sıradaki adım önerisi gösterir." },
  { k: "kw", ad: "Keyword scanner", ic: ic("scan"), bg: "#ecfdf3", d: "Siteleri, haberleri ve ilanları anahtar kelimelerinize göre tarar; fırsat çıkınca haber verir." },
  { k: "crm", ad: "CRM entegrasyonu", ic: ic("link"), bg: "#f0f9ff", d: "Panel çıktılarını HubSpot, Pipedrive veya Salesforce kayıtlarına otomatik yazar." },
  { k: "rakip", ad: "Rakip izleme", ic: ic("radar"), bg: "#fffbeb", d: "Rakiplerin fiyat, kampanya ve sayfa değişikliklerini takip eder, haftalık özet gönderir." },
  { k: "sekans", ad: "E-posta ve sekans otomasyonu", ic: ic("mail"), bg: "#f5f3ff", d: "Segmentinize göre kişiselleştirilmiş takip e-postalarını hazırlar ve sıraya koyar." },
  { k: "rapor", ad: "Otomatik satış raporu", ic: ic("chart"), bg: "#ecfeff", d: "Pipeline ve aktivite verinizi haftalık rapora çevirip yöneticinize iletir." },
  { k: "bot", ad: "Bildirim botu", ic: ic("bell"), bg: "#fef2f2", d: "Sıcak lead, yeni form ya da fırsat değişikliğinde Slack, Teams veya WhatsApp'a bildirim düşer." },
  { k: "teklif", ad: "Teklif üretici", ic: ic("file"), bg: "#f7fee7", d: "Görüşme notlarından markanıza uygun teklif dokümanı taslağı çıkarır." },
];
const OZ_ADIM = [
  ["Keşif", "30 dakikalık görüşmede sürecinizi ve hedefinizi dinliyoruz."],
  ["Prototip", "İlk çalışan sürümü kısa sürede sizinle birlikte deniyoruz."],
  ["Kurulum", "Ekibinizin araçlarına bağlıyor, kullanımı anlatıyoruz."],
  ["Destek", "Ölçüyor, iyileştiriyor ve yeni ihtiyaçlara göre büyütüyoruz."],
];
const OZ_SEL = new Set();
// Teklif formu aynı origin'de (/iletisim) ve aynı sekmede açılır: Supabase oturumu localStorage'da olduğundan
// iletişim sayfası girişli kullanıcıyı tanır ve "Panele dön" gösterir. Dönüş adresi sessionStorage'a yazılır.
function teklifLink(msj, konu) {
  return `/iletisim?${konu ? `konu=${encodeURIComponent(konu)}&` : ""}mesaj=${encodeURIComponent(msj)}#form`;
}
function ozLink(adlar) {
  const msj = "Panelden size özel çözüm talebi:\n" + adlar.map(a => "- " + a).join("\n") + "\n\nKısaca ihtiyacımız: ";
  return teklifLink(msj, "AI otomasyonu");
}
function ozSecilen() {
  return [...OZ_PAKET.filter(p => OZ_SEL.has("p:" + p.k)).map(p => p.ad + " paketi"), ...OZ_KAT.filter(x => OZ_SEL.has("k:" + x.k)).map(x => x.ad)];
}
function ozBar() {
  const s = ozSecilen(), bar = document.getElementById("oz-bar");
  if (!bar) return;
  bar.querySelector(".oz-sel").innerHTML = s.length ? s.map(a => `<span class="pill acc">${esc(a)}</span>`).join("") : `<span class="oz-hint">Paket veya çözüm seçin; ihtiyacınızı teklif formunda birlikte netleştirelim.</span>`;
  bar.querySelector("b").textContent = s.length ? `${s.length} seçim` : "Size özel teklif";
  document.getElementById("oz-cta").href = ozLink(s.length ? s : ["Size özel çözüm"]);
  document.querySelectorAll("[data-oz]").forEach(x => {
    const on = OZ_SEL.has(x.dataset.oz);
    x.setAttribute("aria-pressed", on);
    const l = x.querySelector(".oz-pick");
    if (l) l.textContent = on ? "✓ Listede" : "+ Listeye ekle";
  });
}
function pageOzel() {
  const paket = p => `<div class="card plan${p.hot ? " hot" : ""}">${p.hot ? `<span class="pill acc tag">En çok istenen</span>` : ""}
    <span class="oz-ic" aria-hidden="true">${p.ic}</span><h3>${esc(p.ad)}</h3><p>${esc(p.d)}</p>
    <div class="price"><b>Teklif ile</b></div>
    <ul>${p.li.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
    <div class="oz-pact"><button type="button" class="btn btn-g btn-w" data-oz="p:${p.k}" aria-pressed="false"><span class="oz-pick">+ Listeye ekle</span></button>
    <a class="btn ${p.hot ? "btn-p" : "btn-g"} btn-w" href="${esc(ozLink([p.ad + " paketi"]))}" data-teklif>Bu paket için teklif al</a></div></div>`;
  const item = x => `<button type="button" class="card mod oz-item" data-oz="k:${x.k}" aria-pressed="false">
    <span class="row" style="justify-content:flex-start"><span class="mi" aria-hidden="true">${x.ic}</span><h3>${esc(x.ad)}</h3></span>
    <p>${esc(x.d)}</p><span class="foot"><span class="pill">Size özel</span><span class="oz-pick">+ Listeye ekle</span></span></button>`;
  shell(`${ph(`Size özel çözümler`, "Hazır araçların ötesinde: satış sürecinize göre geliştirdiğimiz otomasyonlar, eklentiler ve entegrasyonlar.")}
  <section class="oz-hero">
    <div><span class="oz-kick">Sales Corner Özel Geliştirme</span>
      <h2>İhtiyacınız olan satış aracını sizin için geliştirelim.</h2>
      <p>HTML sorgusundan canlı satış destek eklentisine, keyword scanner'dan CRM entegrasyonuna kadar; ekibinizin her gün tekrarladığı işi otomasyona çeviriyoruz.</p>
      <div class="row"><a class="btn oz-btn" href="${esc(ozLink(["Size özel çözüm"]))}" data-teklif>Ücretsiz keşif görüşmesi →</a><button type="button" class="btn oz-btn2" data-oz-to="oz-paket">Hazır paketleri gör</button></div>
    </div>
    <div class="oz-tags" aria-hidden="true">${OZ_KAT.map(x => `<span>${esc(x.ad)}</span>`).join("")}</div>
  </section>
  <div class="oz-h" id="oz-paket"><div><h2>Hazır size özel paketler</h2><p>En sık istenen çözümleri paketledik; kapsamı şirketinize göre uyarlıyoruz.</p></div></div>
  <div class="plans oz-plans">${OZ_PAKET.map(paket).join("")}</div>
  <div class="oz-h"><div><h2>Geliştirebileceklerimiz</h2><p>İhtiyacınız olanları listeye ekleyin, teklifinizi buna göre hazırlayalım.</p></div></div>
  <div class="cards">${OZ_KAT.map(item).join("")}</div>
  <div class="oz-h"><div><h2>Nasıl çalışıyoruz?</h2><p>Fikirden çalışan araca dört adım.</p></div></div>
  <ol class="oz-steps">${OZ_ADIM.map((a, i) => `<li class="card"><span class="oz-n">${i + 1}</span><b>${a[0]}</b><p>${a[1]}</p></li>`).join("")}</ol>
  <div class="card oz-more"><span aria-hidden="true">${ic("chat", 22)}</span><div><b>Listede olmayan bir fikriniz mi var?</b><p>Satış ekibinizin elle yaptığı, tekrar eden her iş otomasyon adayıdır. Anlatın, uygulanabilir mi birlikte bakalım.</p></div></div>
  <div class="oz-bar" id="oz-bar" aria-live="polite"><div class="oz-bt"><b>Size özel teklif</b><div class="oz-sel"></div></div><a class="btn btn-p" id="oz-cta" href="#" data-teklif>Teklif iste →</a></div>`);
  document.querySelectorAll("[data-oz]").forEach(x => (x.onclick = () => { const k = x.dataset.oz; OZ_SEL.has(k) ? OZ_SEL.delete(k) : OZ_SEL.add(k); ozBar(); }));
  document.querySelectorAll("[data-oz-to]").forEach(x => (x.onclick = () => document.getElementById(x.dataset.ozTo)?.scrollIntoView({ behavior: "smooth", block: "start" })));
  ozBar();
}

// ---------- Araç sayfaları (ortak) ----------
function gate(k) {
  const d = durum(k);
  if (d.ok) return "";
  return msg("warn", `${ic("alert", 16)}<span>${esc(NEDEN[d.neden] ? NEDEN[d.neden](k) : "")} <a href="#/fiyatlar">Planları inceleyin →</a></span>`);
}
function quota(k) {
  const d = durum(k);
  if (d.lim < 0) return `<div class="quota"><span>Bu ay ${d.kul} kullanım</span><span class="pill ok">Sınırsız</span></div>`;
  if (!d.lim) return "";
  return `<div class="quota"><span>Bu ay ${d.kul} / ${d.lim} kullanıldı</span><div class="meter${d.kul >= d.lim ? " full" : ""}" aria-hidden="true"><i style="width:${Math.min(100, (d.kul / d.lim) * 100)}%"></i></div></div>`;
}
function toolShell(k, form, intro) {
  const m = MOD[k];
  shell(`${ph(esc(m.ad), esc(intro || m.d))}${gate(k)}
  <div class="tool"><div class="card pad">${form}${quota(k)}</div><section class="card out" id="out" aria-live="polite"></section></div>`);
  renderJob(k);
  const f = document.getElementById("f");
  if (f && !durum(k).ok) f.querySelectorAll("[type=submit]").forEach(b => (b.disabled = true));
  if (f && JOBS[k]?.state === "run") f.querySelectorAll("[type=submit]").forEach(b => { b.disabled = true; b.textContent = "Hazırlanıyor…"; });
}
const EMPTY = {
  rakip: ["", "Rakip analiziniz burada görünecek", "Firmanızı ve 1–5 rakibi girin. Yapay zekâ siteleri tarar; konumlandırma, fiyat, mesaj ve fırsatları karşılaştıran bir Google Slides sunumu hazırlar."],
  sekans: ["", "Sekansınız burada görünecek", "Hedef firmanın sitesini ya da elinizdeki dokümanı verin; cold call senaryosu ve çok adımlı LinkedIn mesajları hazırlansın."],
  seo: ["", "SEO raporunuz burada görünecek", "Bir sayfa adresi girin; SEO puanı, eksikler, anahtar kelime hacimleri ve yayına hazır içerik önerisi çıkarılsın."],
  briefing: ["", "Briefingeniz burada görünecek", "Görüşeceğiniz firma ve kişiyi girin; toplantıdan önce okuyacağınız araştırma ve fırsat puanı hazırlansın."],
  fireflies: ["", "Toplantı analizi burada görünecek", "Soldan bir toplantı seçip analiz edin: puan, itirazlar, BANT ve takip e-postası."],
};
function renderJob(k) {
  const out = document.getElementById("out");
  if (!out) return;
  const j = JOBS[k];
  if (!j) { const [, t, p] = EMPTY[k]; out.innerHTML = `<div class="empty"><div class="big" aria-hidden="true">${ico(P[{ rakip: "target", sekans: "pen", seo: "trend", briefing: "clip", fireflies: "mic" }[k]], 26)}</div><h3>${t}</h3><p style="max-width:420px">${p}</p></div>`; return; }
  if (j.state === "run") {
    const el = (Date.now() - j.t0) / 1000;
    out.innerHTML = `<div class="prog"><div class="spin"></div><div><h3>${esc(MOD[k].ad)} hazırlanıyor</h3><p style="color:var(--mute);margin-top:4px">${esc(j.title)}</p></div>
      <div class="meter" style="max-width:320px;width:100%;flex:none"><i data-bar style="width:3%"></i></div>
      <ol class="steps">${STEPS[k].map(s => `<li>${esc(s)}</li>`).join("")}</ol>
      ${j.step ? `<p style="font-size:13.5px;color:var(--mute)">${esc(j.step)}</p>` : ""}
      <p style="font-size:13px;color:var(--soft)">Geçen süre <span data-el>${mmss(el)}</span> · genellikle ${estDk(k)} dk${j.sync ? "" : " · Bu sekme açık kaldığı sürece devam eder; başka sayfalara geçebilirsiniz."}</p></div>`;
    return;
  }
  const again = `<button class="btn btn-g btn-s" data-reset="${k}">Yeni ${k === "fireflies" ? "analiz" : "çalışma"}</button>`;
  if (j.state === "err") {
    out.innerHTML = `<div class="res-b">${msg("err", `${ic("alert", 16)}<span>${esc(j.err || "İşlem tamamlanamadı.")}${j.neden ? ` <a href="#/fiyatlar">Planları inceleyin →</a>` : ""}</span>`)}${again}</div>`;
    return;
  }
  out.innerHTML = RESULT[k](j) + "";
  out.querySelector(".res-h")?.insertAdjacentHTML("beforeend", again);
}
const linkBtn = (u, t, cls = "btn-g") => (safeUrl(u) ? `<a class="btn ${cls} btn-s" href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${t}</a>` : "");
const kv = rows => `<div class="kv">${rows.filter(r => r[1] !== undefined && r[1] !== null && r[1] !== "").map(([a, v]) => `<div><span>${esc(a)}</span><b>${esc(v)}</b></div>`).join("")}</div>`;
const resHead = (t, pill = "") => `<div class="res-h"><div class="row" style="justify-content:flex-start"><h3>✓ ${esc(t)}</h3>${pill}</div></div>`;
function urlRows(f) {
  return [...f.querySelectorAll("[data-url]")];
}

// ---------- Rakip analizi ----------
function pageRakip() {
  const b = S.ben, fp = FIRMA.v || {};
  firmaIste("rakip");
  toolShell("rakip", `<form id="f" data-sk-noform>
    <div class="f"><label for="cn">Firma adınız</label><input class="in" id="cn" required maxlength="150" value="${esc(fp.firma_adi || b.sirket || "")}"></div>
    <div class="f"><label for="cw">Web siteniz</label><input class="in" id="cw" inputmode="url" placeholder="ornek.com" required value="${esc(fp.web || "")}"></div>
    <div class="f"><label>Rakip siteleri <span class="hint">(1–5)</span></label><div id="urls" style="display:grid;gap:8px"></div>
      <button type="button" class="linkbtn" id="add" style="justify-self:start">+ Rakip ekle</button></div>
    <div class="f"><label style="display:flex;gap:8px;align-items:center;font-weight:500"><input type="checkbox" id="mail" checked> Sunum linkini e-postama da gönder</label></div>
    <div id="m"></div>
    <button class="btn btn-p btn-w" type="submit">Analizi başlat</button>
  </form>`);
  const f = document.getElementById("f"), box = document.getElementById("urls");
  const add = (v = "") => {
    if (box.children.length >= 5) return;
    const i = box.children.length + 1;
    box.insertAdjacentHTML("beforeend", `<div class="row" style="flex-wrap:nowrap"><input class="in" data-url inputmode="url" placeholder="rakip${i}.com" aria-label="Rakip ${i}" value="${esc(v)}"><button type="button" class="iconbtn" data-rm aria-label="Kaldır">✕</button></div>`);
    document.getElementById("add").hidden = box.children.length >= 5;
  };
  const pr = String(fp.rakipler || "").split(/[,;\n]+/).map(x => x.trim()).filter(x => /\.[a-z]{2,}/i.test(x)).slice(0, 5);
  if (pr.length) pr.forEach(u => add(u)); else { add(); add(); }
  document.getElementById("add").onclick = () => { add(); box.lastElementChild.querySelector("input").focus(); };
  box.onclick = e => { if (e.target.closest("[data-rm]") && box.children.length > 1) { e.target.closest(".row").remove(); document.getElementById("add").hidden = false; } };
  f.onsubmit = async e => {
    e.preventDefault();
    const site = normUrl(f.cw.value);
    if (!site) return setMsg("m", "err", "Web sitenizi geçerli bir adres olarak girin (ör. ornek.com).");
    const raw = urlRows(f).map(i => i.value.trim()).filter(Boolean);
    const urls = raw.map(normUrl);
    if (!urls.length) return setMsg("m", "err", "En az bir rakip sitesi girin.");
    if (urls.some(u => !u)) return setMsg("m", "err", "Rakip adreslerinden biri geçersiz görünüyor.");
    const btn = f.querySelector("[type=submit]");
    busy(btn, true, "Başlatılıyor…"); setMsg("m");
    const name = f.cn.value.trim();
    const res = await startAsync("rakip", { company_name: name, company_website: site, manual_competitor_urls: [...new Set(urls)], eposta: f.mail.checked }, `${name} · ${urls.length} rakip`);
    if (!res.success) { busy(btn, false); return setMsg("m", "err", esc(res.message) + (res.neden ? ` <a href="#/fiyatlar">Planlar →</a>` : "")); }
    render();
  };
}
const RESULT = {
  rakip: j => {
    const r = j.res || {};
    return `${resHead("Rakip analizi hazır", r.slideCount ? `<span class="pill acc">${esc(r.slideCount)} slayt</span>` : "")}
    <div class="res-b"><div class="sec">${kv([["Analiz", j.title], ["Öne çıkan rakip", r.rakip_adi], ["Süre", mmss(((j.res && r.elapsed_seconds) || (Date.now() - j.t0) / 1000))]])}</div>
    <div class="sec"><h4>Sunum</h4><div class="row" style="justify-content:flex-start">${linkBtn(r.slides_view_url, "Sunumu aç", "btn-p")}${linkBtn(r.slides_pdf_url, "PDF indir")}${linkBtn(r.slides_url, "Google Slides'ta düzenle")}</div></div>
    <p style="color:var(--mute);font-size:13.5px">Sunum Google Slides'ta oluşturuldu; düzenleyip müşterinizle paylaşabilirsiniz.</p></div>`;
  },
  sekans: j => {
    const r = j.res || {}, pub = safeUrl(r.publicUrl);
    return `${resHead("Sekans hazır", r.company ? `<span class="pill acc">${esc(r.company)}</span>` : "")}
    <div class="res-b"><div class="sec"><h4>Sekans dokümanı</h4><div class="row" style="justify-content:flex-start">${linkBtn(r.presentationViewUrl || r.presentationUrl, "Sekansı aç", "btn-p")}${linkBtn(r.presentationUrl, "Düzenle")}${pub ? `<button class="btn btn-g btn-s" data-copy="${esc(pub)}">Paylaşım linkini kopyala</button>` : ""}</div></div>
    <p style="color:var(--mute);font-size:13.5px">Dokümanda cold call senaryosu, itiraz karşılama cümleleri ve LinkedIn mesaj adımları yer alır.</p></div>`;
  },
  seo: j => seoResult(j.res.sonuc || {}),
  briefing: j => {
    const r = j.res.sonuc || {};
    return `${resHead("Briefing hazır", r.deal_pct_label ? `<span class="pill ok">${esc(r.deal_pct_label)}</span>` : "")}
    <div class="res-b"><div class="sec">${kv([["Firma", r.firma_adi || r.company], ["Kişi", r.kisi_adi || r.person], ["Toplantı", r.toplanti_tarihi], ["En uygun hizmet", r.en_uygun_hizmet], ["Firma skoru", r.f_skor], ["Kişi skoru", r.k_skor], ["Slayt", r.slideCount]])}</div>
    <div class="sec"><h4>Briefing sunumu</h4><div class="row" style="justify-content:flex-start">${linkBtn(r.presentationViewUrl || r.presentationUrl, "Briefingi aç", "btn-p")}${linkBtn(r.presentationUrl, "Düzenle")}</div></div>
    ${r.message ? `<p style="color:var(--mute);font-size:13.5px">${esc(r.message)}</p>` : ""}</div>`;
  },
  fireflies: j => ffResult(j),
};

// ---------- Sekans ----------
function pageSekans() {
  const b = S.ben;
  let src = "website";
  toolShell("sekans", `<form id="f" data-sk-noform>
    <div class="f"><label for="cn">Hedef firma</label><input class="in" id="cn" required maxlength="150" placeholder="Firma adı"></div>
    <div class="f"><label>Kaynak</label><div class="tabs" role="tablist" style="margin:0"><button type="button" role="tab" aria-selected="true" data-src="website">Web sitesi</button><button type="button" role="tab" aria-selected="false" data-src="pdf">Metin / doküman</button></div></div>
    <div class="f" data-pane="website"><label for="dm">Firmanın web sitesi</label><input class="in" id="dm" inputmode="url" placeholder="hedeffirma.com"></div>
    <div class="f" data-pane="pdf" hidden><label for="tx">Doküman metni</label><textarea class="in" id="tx" maxlength="6000" placeholder="Sunum, teklif ya da PDF metnini buraya yapıştırın"></textarea><span class="hint"><span id="txn">0</span> / 6000 karakter</span></div>
    <div class="f"><label for="nt">Notlar <span class="hint">(isteğe bağlı)</span></label><textarea class="in" id="nt" maxlength="3000" placeholder="Ne satıyorsunuz, kime ulaşmak istiyorsunuz, ton tercihi…"></textarea><span class="hint">Hedef firma kendi firmanızsa <a href="#/hesap">firma profilinizdeki</a> bilgiler otomatik eklenir.</span></div>
    <div class="f"><label for="wn">İmzada görünecek ad</label><input class="in" id="wn" maxlength="100" value="${esc(b.ad || "")}" required></div>
    <div class="f"><label style="display:flex;gap:8px;align-items:center;font-weight:500"><input type="checkbox" id="mail" checked> Sonucu e-postama da gönder</label></div>
    <div id="m"></div>
    <button class="btn btn-p btn-w" type="submit">Sekansı yaz</button>
  </form>`);
  const f = document.getElementById("f");
  f.querySelectorAll("[data-src]").forEach(t => (t.onclick = () => {
    src = t.dataset.src;
    f.querySelectorAll("[data-src]").forEach(x => x.setAttribute("aria-selected", String(x === t)));
    f.querySelectorAll("[data-pane]").forEach(p => (p.hidden = p.dataset.pane !== src));
  }));
  f.tx.oninput = () => (document.getElementById("txn").textContent = f.tx.value.length);
  f.onsubmit = async e => {
    e.preventDefault();
    const body = { company_name: f.cn.value.trim(), source_type: src, source_notes: f.nt.value.trim(), writer_name: f.wn.value.trim(), eposta: f.mail.checked };
    if (src === "website") { body.domain = normUrl(f.dm.value); if (!body.domain) return setMsg("m", "err", "Firmanın web sitesini girin (ör. hedeffirma.com)."); }
    else { body.pdf_text = f.tx.value.trim(); if (body.pdf_text.length < 80) return setMsg("m", "err", "Doküman metni çok kısa; en az birkaç paragraf yapıştırın."); }
    const btn = f.querySelector("[type=submit]");
    busy(btn, true, "Başlatılıyor…"); setMsg("m");
    const res = await startAsync("sekans", body, body.company_name);
    if (!res.success) { busy(btn, false); return setMsg("m", "err", esc(res.message) + (res.neden ? ` <a href="#/fiyatlar">Planlar →</a>` : "")); }
    render();
  };
}

// ---------- SEO ----------
function pageSeo() {
  toolShell("seo", `<form id="f" data-sk-noform>
    <div class="f"><label for="u">Sayfa adresi</label><input class="in" id="u" inputmode="url" placeholder="ornek.com/hizmetler" required></div>
    <div id="m"></div>
    <button class="btn btn-p btn-w" type="submit">SEO analizini başlat</button>
    <p class="hint" style="margin-top:10px;font-size:12.5px;color:var(--mute)">Genellikle 30–90 saniye sürer.</p>
  </form>`);
  const f = document.getElementById("f");
  f.onsubmit = e => {
    e.preventDefault();
    const u = normUrl(f.u.value);
    if (!u) return setMsg("m", "err", "Geçerli bir adres girin (ör. ornek.com).");
    startSync("seo", "/api/app/seo", { website_url: u }, new URL(u).hostname + new URL(u).pathname.replace(/\/$/, ""));
  };
}
const asText = v => (v == null ? "" : typeof v === "string" || typeof v === "number" ? String(v) : v.message || v.issue || v.title || v.text || v.description || JSON.stringify(v));
function seoResult(r) {
  const sc = r.seo_score || {}, br = sc.breakdown || {}, pi = r.page_info || {}, kw = r.keywords || {}, g = r.generated_content || {};
  const tot = Number(sc.total);
  const pill = Number.isFinite(tot) ? `<span class="pill ${tot >= 70 ? "ok" : tot >= 45 ? "warn" : "bad"}">${tot}/100${sc.level ? " · " + esc(sc.level) : ""}</span>` : "";
  const lbl = { title_quality: "Başlık", meta_desc_quality: "Meta açıklama", h1_quality: "H1", content_depth: "İçerik derinliği", keyword_density: "Anahtar kelime", bonus_points: "Bonus" };
  const issues = (Array.isArray(r.issues) ? r.issues : []).map(asText).filter(Boolean);
  const table = Array.isArray(kw.table) ? kw.table.slice(0, 25) : [];
  const c = g.content || {};
  return `${resHead("SEO raporu" + (r.url ? " — " + (() => { try { return new URL(r.url).hostname; } catch { return ""; } })() : ""), pill)}
  <div class="res-b">
    <div class="sec"><h4>Puan dağılımı</h4>${kv(Object.keys(lbl).filter(k => br[k] != null).map(k => [lbl[k], br[k]]))}</div>
    <div class="sec"><h4>Sayfa</h4><div class="box"><b>${esc(pi.title || "Başlık yok")}</b><p style="color:var(--mute);margin-top:4px">${esc(pi.meta_description || "Meta açıklama yok")}</p>${pi.h1 ? `<p style="margin-top:6px;font-size:13.5px">H1: ${esc(pi.h1)}</p>` : ""}</div></div>
    ${issues.length ? `<div class="sec"><h4>Düzeltilmesi gerekenler (${issues.length})</h4><ul style="margin:0;padding-left:20px;display:grid;gap:6px">${issues.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>` : ""}
    ${table.length ? `<div class="sec"><h4>Anahtar kelimeler</h4><div class="card scroll-x" style="box-shadow:none"><table class="tbl"><thead><tr><th>Anahtar kelime</th><th>Hacim</th><th>Rekabet</th><th>Niyet</th></tr></thead><tbody>${table.map(t => `<tr><td>${esc(t.keyword)}</td><td>${esc(t.volume)}</td><td>${esc(t.competition)}</td><td>${esc(t.intent)}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
    ${g.seo_title || c.intro ? `<div class="sec"><h4>Hazır içerik önerisi</h4>
      <div class="box"><button class="btn btn-g btn-s copy" data-copy-el="seo-meta">Kopyala</button><div id="seo-meta" class="pre"><b>SEO başlığı:</b> ${esc(g.seo_title)}\n<b>Meta açıklama:</b> ${esc(g.meta_description)}${g.slug ? `\n<b>URL:</b> /${esc(String(g.slug).replace(/^\//, ""))}` : ""}</div></div>
      ${c.intro || (c.sections || []).length ? `<details class="box"><summary style="cursor:pointer;font-weight:600">Makale taslağını göster</summary><div id="seo-art" class="md" style="margin-top:12px">${c.intro ? `<p>${esc(c.intro)}</p>` : ""}${(c.sections || []).map(s => `<h3>${esc(s.h2)}</h3><p class="pre">${esc(s.content)}</p>`).join("")}${(c.faq || []).length ? `<h3>Sık sorulan sorular</h3>${c.faq.map(q => `<p><b>${esc(q.question)}</b><br>${esc(q.answer)}</p>`).join("")}` : ""}${c.conclusion ? `<p>${esc(c.conclusion)}</p>` : ""}</div><button class="btn btn-g btn-s" data-copy-el="seo-art" style="margin-top:8px">Taslağı kopyala</button></details>` : ""}
    </div>` : ""}
    ${r.html_report ? `<div class="sec"><h4>Tam rapor</h4><div class="row" style="justify-content:flex-start"><button class="btn btn-g btn-s" id="seo-show">Raporu göster</button><button class="btn btn-g btn-s" id="seo-dl">HTML indir</button></div><div id="seo-frame"></div></div>` : ""}
  </div>`;
}

// ---------- Briefing ----------
function pageBriefing() {
  firmaIste("briefing");
  const fe = FIRMA.v !== undefined && !FIRMA.err ? firmaEksik(FIRMA.v) : [];
  const fnot = FIRMA.v === undefined || FIRMA.err ? "" : FIRMA.v && fe.length < FIRMA_ALAN.length
    ? msg("info", `${ic("user", 16)}<span>Briefing <b>${esc(FIRMA.v.firma_adi || "firmanız")}</b> adına, profilinizdeki ürünlere göre hazırlanır.${fe.length ? ` Eksik alanlar: ${fe.map(([, a]) => esc(a)).join(", ")}.` : ""} <a href="#/hesap">Profili düzenle →</a></span>`)
    : msg("info", `${ic("user", 16)}<span>Briefing'in sizin ürünlerinize göre öneri vermesi için önce <a href="#/hesap">firma profilinizi doldurun</a>.</span>`);
  toolShell("briefing", `${fnot}<form id="f" data-sk-noform>
    <div class="f"><label for="fa">Firma adı</label><input class="in" id="fa" required maxlength="150"></div>
    <div class="f"><label for="fw">Firma web sitesi</label><input class="in" id="fw" inputmode="url" placeholder="firma.com" required></div>
    <div class="f"><label for="fl">Firma LinkedIn <span class="hint">(isteğe bağlı)</span></label><input class="in" id="fl" inputmode="url" placeholder="linkedin.com/company/…"></div>
    <div class="grid2">
      <div class="f"><label for="ka">Görüşülecek kişi</label><input class="in" id="ka" required maxlength="120"></div>
      <div class="f"><label for="ke">Kişinin e-postası</label><input class="in" id="ke" type="email" placeholder="isteğe bağlı"></div>
    </div>
    <div class="f"><label for="kl">Kişinin LinkedIn profili <span class="hint">(isteğe bağlı)</span></label><input class="in" id="kl" inputmode="url" placeholder="linkedin.com/in/…"></div>
    <div class="grid2">
      <div class="f"><label for="td">Toplantı tarihi</label><input class="in" id="td" type="date" value="${today()}" required></div>
      <div class="f"><label for="ts">Saat</label><input class="in" id="ts" type="time" value="10:00"></div>
    </div>
    <div class="f"><label for="tk">Toplantı konusu</label><input class="in" id="tk" maxlength="300" placeholder="Ör. CRM entegrasyonu demo görüşmesi"></div>
    <div id="m"></div>
    <button class="btn btn-p btn-w" type="submit">Briefing hazırla</button>
    <p class="hint" style="margin-top:10px;font-size:12.5px;color:var(--mute)">${estDk("briefing")} dakika sürer; sonuç e-postanıza da gelir.</p>
  </form>`);
  const f = document.getElementById("f");
  f.onsubmit = e => {
    e.preventDefault();
    const fw = normUrl(f.fw.value);
    if (!fw) return setMsg("m", "err", "Firma web sitesini geçerli bir adres olarak girin.");
    const opt = v => (v.trim() ? normUrl(v) : "");
    const body = { firma_adi: f.fa.value.trim(), firma_website: fw, firma_linkedin: opt(f.fl.value), kisi_adi: f.ka.value.trim(), kisi_email: f.ke.value.trim(), kisi_linkedin: opt(f.kl.value), toplanti_tarihi: f.td.value, toplanti_saati: f.ts.value, toplanti_konusu: f.tk.value.trim() };
    startSync("briefing", "/api/app/briefing", body, `${body.firma_adi} · ${body.kisi_adi}`, res => {
      const r = res.sonuc || {}, url = safeUrl(r.presentationViewUrl || r.presentationUrl);
      if (url) addHist({ k: "briefing", title: `${body.firma_adi} · ${body.kisi_adi}`, url });
    });
  };
}

// ---------- Fireflies ----------
let FF = { list: null, err: "", sel: "" };
function ffConnect(inline) {
  return `<div class="${inline ? "" : "card pad"}">
    ${inline ? "" : `<h3 style="margin-bottom:6px">Fireflies hesabınızı bağlayın</h3>`}
    <ol style="margin:8px 0 16px;padding-left:20px;color:var(--mute);display:grid;gap:4px;font-size:14px">
      <li><a href="https://app.fireflies.ai/settings" target="_blank" rel="noopener">Fireflies → Settings</a> sayfasını açın.</li>
      <li><b>Developer settings</b> bölümündeki <b>API key</b>'i kopyalayın.</li>
      <li>Aşağıya yapıştırıp kaydedin. Anahtar yalnızca sizin hesabınızın toplantılarını okumak için kullanılır.</li>
    </ol>
    <form id="ffk" data-sk-noform><div class="f"><label for="fk">Fireflies API anahtarı</label><input class="in" id="fk" type="password" autocomplete="off" spellcheck="false" required minlength="10" maxlength="300"></div>
    <div id="fkm"></div><button class="btn btn-p" type="submit">Bağla</button></form></div>`;
}
function bindFfKey(after) {
  const f = document.getElementById("ffk");
  if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector("[type=submit]");
    busy(btn, true, "Kaydediliyor…");
    try {
      await rpc("app_fireflies_kaydet", { p_key: f.fk.value.trim() });
      f.fk.value = "";
      await loadBen(); FF = { list: null, err: "", sel: "" };
      toast("Fireflies bağlandı ✓"); after();
    } catch (err) { busy(btn, false); setMsg("fkm", "err", esc(trErr(err))); }
  };
}
async function loadFF(force) {
  if (FF.list && !force) return;
  FF.err = ""; FF.list = null;
  const r = await api("/api/app/fireflies/liste");
  if (r.success) FF.list = Array.isArray(r.toplantilar) ? r.toplantilar : [];
  else { FF.err = r.message; FF.list = []; }
}
function pageFireflies() {
  const b = S.ben;
  if (!b.fireflies) {
    shell(`${ph(`Toplantı Analizi`, esc(MOD.fireflies.d))}${gate("fireflies")}<div style="max-width:620px">${ffConnect()}</div>`);
    return bindFfKey(render);
  }
  const fmtDur = d => (d ? `${Math.round(Number(d))} dk` : "");
  const items = FF.list === null ? `<div class="empty" style="padding:24px"><div class="spin"></div></div>`
    : FF.err ? msg("err", esc(FF.err) + ` <a href="#/hesap">Anahtarı kontrol edin →</a>`)
    : !FF.list.length ? `<p style="color:var(--mute)">Fireflies hesabınızda henüz kayıtlı toplantı yok.</p>`
    : `<div class="list" role="group" aria-label="Toplantılar">${FF.list.map(t => `<button type="button" class="li" data-ff="${esc(t.id)}" aria-pressed="${FF.sel === t.id}"><span class="ff-ic" aria-hidden="true">${ic("mic", 16)}</span><span class="t"><b>${esc(t.title || "Adsız toplantı")}</b><span>${fmtDT(t.date)}${t.duration ? " · " + fmtDur(t.duration) : ""}${t.participants?.length ? ` · ${t.participants.length} katılımcı` : ""}</span></span></button>`).join("")}</div>`;
  toolShell("fireflies", `<form id="f" data-sk-noform>
    <div class="row" style="margin-bottom:12px"><h3>Son toplantılarınız</h3><button type="button" class="iconbtn" id="ffr" title="Yenile" aria-label="Listeyi yenile">↻</button></div>
    <div style="max-height:420px;overflow:auto;margin-bottom:14px">${items}</div>
    <div id="m"></div>
    <button class="btn btn-p btn-w" type="submit"${FF.sel ? "" : " disabled"}>Seçili toplantıyı analiz et</button>
  </form>`, "Fireflies kayıtlarınızı satış koçu gözüyle puanlar; itirazlar, BANT ve takip e-postası.");
  const f = document.getElementById("f");
  document.getElementById("ffr").onclick = async () => { FF.list = null; render(); await loadFF(true); if (route === "fireflies") render(); };
  f.querySelectorAll("[data-ff]").forEach(x => (x.onclick = () => {
    FF.sel = x.dataset.ff;
    f.querySelectorAll("[data-ff]").forEach(y => y.setAttribute("aria-pressed", String(y === x)));
    const sb2 = f.querySelector("[type=submit]");
    if (durum("fireflies").ok && JOBS.fireflies?.state !== "run") sb2.disabled = false;
  }));
  f.onsubmit = e => {
    e.preventDefault();
    const t = (FF.list || []).find(x => x.id === FF.sel);
    if (!t) return setMsg("m", "err", "Önce bir toplantı seçin.");
    startSync("fireflies", "/api/app/fireflies/analiz", { id: t.id }, t.title || "Toplantı");
  };
  if (FF.list === null) loadFF().then(() => { if (route === "fireflies") render(); });
}
function ffResult(j) {
  const a = (j.res && j.res.analiz) || {}, meta = (j.res && j.res.meta) || {};
  const skor = Number(a.skor);
  const list = (arr, ic) => (Array.isArray(arr) && arr.length ? `<ul style="margin:0;padding-left:0;list-style:none;display:grid;gap:6px">${arr.map(x => `<li style="display:flex;gap:8px"><span class="li-ic" aria-hidden="true">${ic}</span><span>${esc(asText(x))}</span></li>`).join("")}</ul>` : `<p style="color:var(--mute)">—</p>`);
  const oran = Array.isArray(meta.oranlar) ? meta.oranlar : [];
  const bant = a.bant || {};
  const itr = Array.isArray(a.itirazlar) ? a.itirazlar : [];
  const adim = Array.isArray(a.sonraki_adimlar) ? a.sonraki_adimlar : [];
  return `${resHead("Toplantı analizi", Number.isFinite(skor) ? `<span class="pill ${skor >= 70 ? "ok" : skor >= 45 ? "warn" : "bad"}">${skor}/100</span>` : "")}
  <div class="res-b">
    <div class="sec">${kv([["Toplantı", meta.title || j.title], ["Tarih", meta.date ? fmtDT(meta.date) : ""], ["Süre", meta.duration ? Math.round(meta.duration) + " dk" : ""], ["Satış aşaması", a.asama]])}</div>
    ${a.ozet ? `<div class="sec"><h4>Özet</h4><p>${esc(a.ozet)}</p>${a.skor_gerekce ? `<p style="color:var(--mute);margin-top:6px;font-size:14px">${esc(a.skor_gerekce)}</p>` : ""}</div>` : ""}
    ${oran.length ? `<div class="sec"><h4>Konuşma oranı</h4><div style="display:grid;gap:8px">${oran.map(o => `<div class="row" style="flex-wrap:nowrap"><span style="width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(o.ad)}</span><div class="meter" style="max-width:none"><i style="width:${Math.max(0, Math.min(100, Number(o.pay) || 0))}%"></i></div><b style="width:44px;text-align:right">%${Math.round(Number(o.pay) || 0)}</b></div>`).join("")}</div></div>` : ""}
    <div class="sec grid2" style="gap:14px"><div><h4>Güçlü yönler</h4>${list(a.guclu, `<b style="color:#16a34a">${ic("check", 16)}</b>`)}</div><div><h4>Gelişim alanları</h4>${list(a.gelisim, `<b style="color:var(--acc)">${ic("up", 16)}</b>`)}</div></div>
    ${itr.length ? `<div class="sec"><h4>İtirazlar</h4>${itr.map(i => `<div class="box"><h5>“${esc(i.itiraz)}”</h5>${i.nasil_yanitlandi ? `<p style="font-size:14px;color:var(--mute)">Verilen yanıt: ${esc(i.nasil_yanitlandi)}</p>` : ""}${i.oneri ? `<p style="font-size:14px;margin-top:4px"><b>Öneri:</b> ${esc(i.oneri)}</p>` : ""}</div>`).join("")}</div>` : ""}
    ${Object.keys(bant).length ? `<div class="sec"><h4>BANT</h4>${kv([["Bütçe", bant.butce], ["Yetki", bant.yetki], ["İhtiyaç", bant.ihtiyac], ["Zamanlama", bant.zamanlama]])}</div>` : ""}
    ${adim.length ? `<div class="sec"><h4>Sonraki adımlar</h4><div class="card scroll-x" style="box-shadow:none"><table class="tbl"><thead><tr><th>Adım</th><th>Sorumlu</th><th>Tarih</th></tr></thead><tbody>${adim.map(s => `<tr><td>${esc(asText(s.adim || s))}</td><td>${esc(s.sorumlu || "")}</td><td>${esc(s.tarih || "")}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
    ${Array.isArray(a.riskler) && a.riskler.length ? `<div class="sec"><h4>Riskler</h4>${list(a.riskler, `<b style="color:#d97706">${ic("alert", 16)}</b>`)}</div>` : ""}
    ${a.takip_epostasi ? `<div class="sec"><h4>Takip e-postası taslağı</h4><div class="box"><button class="btn btn-g btn-s copy" data-copy-el="ff-mail">Kopyala</button><div id="ff-mail" class="pre" style="padding-right:80px">${esc(a.takip_epostasi)}</div></div></div>` : ""}
  </div>`;
}

// ---------- Fiyatlar ----------
async function pageFiyatlar() {
  const planlar = S.planlar || PLAN_FALLBACK;
  const b = S.ben, y = S.yillik;
  const satir = (q, k) => {
    const v = Number((q || {})[k] || 0);
    if (k === "takip") return v < 0 ? `<li>Sınırsız firma için haftalık rakip takibi</li>` : v ? `<li>${fmtN(v)} firma için haftalık rakip takibi</li>` : `<li class="no">${esc(MOD[k].ad)}</li>`;
    return v < 0 ? `<li>Sınırsız ${esc(kucuk(MOD[k].ad))}</li>` : v ? `<li>Ayda ${fmtN(v)} ${esc(kucuk(MOD[k].ad))}</li>` : `<li class="no">${esc(MOD[k].ad)}</li>`;
  };
  const card = p => {
    const meta = PLAN_META[p.kod] || {}, cur = b.plan === p.kod && b.aktif;
    const cta = cur ? `<span class="btn btn-g btn-w" aria-disabled="true">Mevcut planınız</span>`
      : `<a class="btn ${meta.hot ? "btn-p" : p.kod === "ozel" ? "btn-g" : "btn-g"} btn-w" href="${esc(p.kod === "ozel" ? ozLink([p.ad + " paketi"]) : teklifLink(`Panelden plan talebi: ${p.ad} (${y ? "yıllık" : "aylık"} faturalama)\n\nNotumuz: `))}" data-teklif>${p.kod === "ozel" ? "Teklif alın" : "Bu planı seç"}</a>`;
    if (p.kod === "ozel") return `<div class="card plan dark"><h3>${esc(p.ad)}</h3><p>${esc(meta.d)}</p><div class="price"><b>Teklif ile</b></div>
      <ul><li>Bütün araçlar, sınırsız kullanım</li><li>CRM entegrasyonu (HubSpot, Pipedrive, Salesforce…)</li><li>Şirketinize özel kişisel AI asistan</li><li>Kendi süreçlerinize göre iş akışları</li><li>Sunumlarda kendi logonuz</li><li>Özel hesap yöneticisi</li></ul>${cta}</div>`;
    const m = Number(p.aylik_tl) || 0, fiyat = y ? Math.round((m * 0.8) / 10) * 10 : m;
    return `<div class="card plan${meta.hot ? " hot" : ""}">${meta.hot ? `<span class="pill acc tag">En çok tercih edilen</span>` : ""}<h3>${esc(p.ad)}</h3><p>${esc(meta.d || "")}</p>
      <div class="price"><b>₺${fmtN(fiyat)}</b><span>/ay${y ? " · yıllık" : ""}</span></div>
      ${y ? `<span style="font-size:12.5px;color:var(--mute);margin-top:-8px">Yıllık ₺${fmtN(fiyat * 12)} (KDV hariç)</span>` : `<span style="font-size:12.5px;color:var(--mute);margin-top:-8px">KDV hariç</span>`}
      <ul>${MODS.map(x => satir(p.kota, x.k)).join("")}${(meta.ek || []).map(t => `<li>${esc(t)}</li>`).join("")}</ul>${cta}</div>`;
  };
  shell(`${ph("Planlar ve fiyatlar", "Ekibinizin büyüklüğüne göre seçin; istediğiniz zaman yükseltin.", `<div class="bill" role="group" aria-label="Faturalama"><button type="button" data-bill="0" aria-pressed="${!y}">Aylık</button><button type="button" data-bill="1" aria-pressed="${y}">Yıllık<em>%20 indirim</em></button></div>`)}
  ${b.plan === "deneme" && b.aktif ? msg("info", `${ic("gift", 16)}<span>Ücretsiz denemedesiniz: ${daysLeft(b.bitis)} gün kaldı. Plan seçtiğinizde kalan kullanım haklarınız yeni planınıza göre güncellenir.</span>`) : ""}
  ${!b.aktif ? msg("warn", esc(NEDEN.sure()) + " Bir plan seçerek kaldığınız yerden devam edebilirsiniz.") : ""}
  <div class="plans">${planlar.filter(p => p.kod !== "deneme").map(card).join("")}</div>
  <div class="faq">
    <h2 style="margin-bottom:4px">Sık sorulanlar</h2>
    <details><summary>Plan seçince ne oluyor?</summary><p>“Bu planı seç” ile iletişim formundan talebinizi iletin; ödeme ve fatura bilgisini sizinle netleştirip planınızı hesabınıza tanımlıyoruz. Plan tanımlandığı anda yeni kotalar panelde görünür.</p></details>
    <details><summary>Kullanım hakları nasıl sayılıyor?</summary><p>Her başarılı analiz, sekans, SEO raporu, briefing ya da toplantı analizi o ayın hakkından bir düşer. Haklar her ayın başında (Türkiye saatiyle) yenilenir; kullanılmayan haklar devretmez. Rakip takipte ise aylık hak yerine aynı anda takip edebileceğiniz firma sayısı sınırlıdır; her firma haftada bir otomatik taranır.</p></details>
    <details><summary>Yıllık ödemede ne kazanırım?</summary><p>Yıllık faturalamada aylık fiyata göre %20 indirim uygulanır.</p></details>
    <details><summary>İptal edebilir miyim?</summary><p>Evet. Aylık planlarda dönem sonunda yenilemeyi durdurursunuz; hesabınız ve geçmiş çalışmalarınız silinmez.</p></details>
    <details><summary>Verilerim güvende mi?</summary><p>Girdiğiniz bilgiler yalnızca istediğiniz çıktıyı üretmek için işlenir. Fireflies anahtarınız hesabınıza bağlı saklanır, sadece sizin toplantılarınızı okumak için kullanılır ve istediğiniz an kaldırabilirsiniz.</p></details>
    <details><summary>Özel AI paketi neleri kapsar?</summary><p>CRM'inize (HubSpot, Pipedrive, Salesforce vb.) bağlanan, şirketinizin satış süreçlerine ve verilerine göre kurulan kişisel AI asistan ve iş akışları. Kapsamı ihtiyacınıza göre birlikte belirleyip teklif hazırlıyoruz.</p></details>
  </div>`);
  document.querySelectorAll("[data-bill]").forEach(x => (x.onclick = () => { S.yillik = x.dataset.bill === "1"; pageFiyatlar(); }));
  if (!S.planlar) { await loadPlanlar(); if (route === "fiyatlar") pageFiyatlar(); }
}

// ---------- Rakip Takip (firma firma haftalık) ----------
let TK = { list: null, err: "", edit: null, sil: "", run: {} };
async function loadTK() {
  TK.err = "";
  try { const r = await rpc("app_takip_liste"); TK.list = Array.isArray(r) ? r : []; }
  catch (e) { TK.err = trErr(e); TK.list = []; }
}
// Yapay zekâ yorumu: yalnız basit biçim etiketleri kalır, bağlantılar güvenli
function tkHtml(h) {
  const ok = new Set(["P", "UL", "OL", "LI", "B", "STRONG", "I", "EM", "BR", "H3", "H4", "A"]);
  let doc;
  try { doc = new DOMParser().parseFromString(`<div>${String(h || "")}</div>`, "text/html"); } catch { return esc(h); }
  const walk = n => [...n.childNodes].map(c => {
    if (c.nodeType === 3) return esc(c.textContent);
    if (c.nodeType !== 1 || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|IFRAME|OBJECT|SVG|MATH)$/i.test(c.tagName)) return "";
    const inner = walk(c);
    if (!ok.has(c.tagName)) return inner;
    const t = c.tagName.toLowerCase();
    if (t === "br") return "<br>";
    if (t === "a") { const u = safeUrl(c.getAttribute("href")); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${inner}</a>` : inner; }
    return `<${t}>${inner}</${t}>`;
  }).join("");
  return walk(doc.body.firstChild || doc.body);
}
function tkSonuc(s) {
  if (!s) return `<p class="tk-mute">Henüz tarama yapılmadı. İlk tarama planlanan saatte otomatik çalışır.</p>`;
  if (s.hata) return msg("err", `Son tarama tamamlanamadı: ${esc(s.hata)}`);
  const rk = Array.isArray(s.rakipler) ? s.rakipler : [];
  return `${s.yorum_html ? `<div class="tk-yorum">${tkHtml(s.yorum_html)}</div>` : ""}
  ${rk.map(r => {
    const it = Array.isArray(r.items) ? r.items : [];
    return `<div class="tk-rk"><div class="row" style="justify-content:flex-start;gap:8px"><b>${esc(r.firma || "Rakip")}</b>
      ${r.ok === false ? `<span class="pill bad">Okunamadı</span>` : `<span class="pill">${esc(String(r.toplam ?? it.length))} yeni içerik</span>`}${r.kaynak ? `<span class="tk-mute" style="font-size:12.5px">${esc(r.kaynak)}</span>` : ""}</div>
      ${r.error ? `<p class="tk-mute" style="font-size:13px">${esc(r.error)}</p>` : ""}
      ${it.length ? `<ul class="tk-items">${it.slice(0, 8).map(x => { const u = safeUrl(x.link); return `<li>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(x.title || u)}</a>` : esc(x.title || "")}${x.tarih ? ` <span class="tk-mute">· ${fmtD(x.tarih)}</span>` : ""}</li>`; }).join("")}</ul>` : r.ok === false ? "" : `<p class="tk-mute" style="font-size:13px">Bu hafta yeni paylaşım yok.</p>`}</div>`;
  }).join("")}
  ${s.tarih ? `<p class="tk-mute" style="font-size:12.5px">Tarama: ${fmtDT(s.tarih)}${s.mail ? " · Özet e-postanıza gönderildi" : ""}</p>` : ""}`;
}
function tkKart(t) {
  const rk = Array.isArray(t.rakipler) ? t.rakipler : [];
  const sil = TK.sil === t.id, rn = TK.run[t.id];
  return `<article class="card pad tk-card" data-tk-id="${esc(t.id)}">
    <div class="row"><div><h3>${esc(t.firma)}</h3><div class="tk-chips">${rk.map(r => `<span class="pill">${esc(r.firma || (safeUrl(r.site) ? new URL(r.site).hostname : "Rakip"))}</span>`).join("")}</div></div>
      ${t.calisiyor ? `<span class="pill acc"><span class="spin s"></span>Taranıyor</span>` : t.aktif === false ? `<span class="pill warn">Duraklatıldı</span>` : `<span class="pill ok">Haftalık</span>`}</div>
    <div class="tk-meta"><span>Son tarama: <b>${fmtDT(t.son_calisma)}</b></span><span>Sonraki tarama: <b>${fmtDT(t.sonraki)}</b></span></div>
    ${rn ? msg(rn.kind, rn.html) : ""}
    <div class="row tk-acts">
      ${sil ? `<span style="font-size:14px">Bu firmanın takibi silinsin mi?</span><span class="row" style="gap:8px"><button type="button" class="btn btn-s" data-tk-silok style="background:var(--bad);color:#fff">Evet, sil</button><button type="button" class="btn btn-g btn-s" data-tk-silno>Vazgeç</button></span>`
      : `<span class="row" style="gap:8px;justify-content:flex-start"><button type="button" class="btn btn-p btn-s" data-tk-run${durum("takip").neden === "sure" || durum("takip").neden === "plan" || t.calisiyor ? " disabled" : ""}>Şimdi tara</button><button type="button" class="btn btn-g btn-s" data-tk-edit>Düzenle</button></span><button type="button" class="linkbtn" data-tk-sil style="color:var(--bad)">Sil</button>`}
    </div>
    <details class="tk-son"><summary>Son tarama sonucu</summary><div class="tk-body">${tkSonuc(t.son_sonuc)}</div></details>
  </article>`;
}
function tkForm(t) {
  return `<form id="tkf" class="card pad">
    <h3 style="margin-bottom:12px">${t ? "Takibi düzenle" : "Yeni firma takibi"}</h3>
    <div class="f"><label for="tkfirma">Firma adı <span class="hint">(kendi firmanız ya da müşteriniz)</span></label><input class="in" id="tkfirma" required maxlength="150" value="${esc(t ? t.firma : S.ben.sirket || "")}"></div>
    <div class="f"><label>Rakipler <span class="hint">(1–6; her rakip için site, RSS ya da LinkedIn adreslerinden en az biri)</span></label><div id="tkrows" style="display:grid;gap:10px"></div>
      <button type="button" class="linkbtn" id="tkadd" style="justify-self:start">+ Rakip ekle</button></div>
    <div id="tkm"></div>
    <div class="row" style="justify-content:flex-start;gap:8px"><button class="btn btn-p" type="submit">${t ? "Kaydet" : "Takibe al"}</button><button class="btn btn-g" type="button" id="tkvaz">Vazgeç</button></div>
  </form>`;
}
function pageTakip() {
  const d = durum("takip"), lim = d.lim, kul = d.kul;
  const dolu = lim > 0 && kul >= lim, kapali = d.neden === "sure" || d.neden === "plan";
  const sayac = lim < 0 ? `${kul} firma takipte · <span class="pill ok">Sınırsız</span>` : lim ? `${kul} / ${lim} firma takipte` : "";
  const ekleBtn = `<button type="button" class="btn btn-p" data-tk-new${kapali || dolu || TK.edit ? " disabled" : ""}>+ Yeni firma ekle</button>`;
  const liste = TK.list === null ? `<div class="empty" style="padding:24px"><div class="spin"></div></div>`
    : TK.err ? msg("err", esc(TK.err) + ` <button type="button" class="linkbtn" data-tk-yenile>Tekrar dene</button>`)
    : !TK.list.length && !TK.edit ? `<div class="card pad empty"><div class="big" aria-hidden="true">${ic("radar", 26)}</div><h3>Henüz takip edilen firma yok</h3><p class="tk-mute" style="max-width:460px;margin:6px auto 0">Bir firma ve rakiplerini ekleyin. Her hafta rakiplerin blog, RSS ve LinkedIn paylaşımları taranır; özet ve aksiyon önerisi e-postanıza gelir.</p></div>`
    : `<div class="tk-list">${TK.list.filter(t => !TK.edit || TK.edit.id !== t.id).map(tkKart).join("")}</div>`;
  shell(`${ph(`Rakip Takip`, esc(MOD.takip.d), kapali ? "" : ekleBtn)}${kapali ? gate("takip") : ""}
    ${sayac ? `<div class="quota" style="margin-bottom:16px"><span>${sayac}</span>${lim > 0 ? `<div class="meter${dolu ? " full" : ""}" aria-hidden="true"><i style="width:${Math.min(100, (kul / lim) * 100)}%"></i></div>` : ""}</div>` : ""}
    ${dolu && !kapali ? msg("warn", `${ic("info", 16)}<span>${esc(NEDEN.kota("takip"))} Yeni firma eklemek için bir takibi silin ya da <a href="#/fiyatlar">planınızı yükseltin →</a></span>`) : ""}
    ${TK.edit ? tkForm(TK.edit.id ? TK.edit : null) : ""}
    ${liste}
    <p class="tk-mute" style="font-size:13px;margin-top:16px">Her firma haftada bir otomatik taranır. İsterseniz “Şimdi tara” ile elle de başlatabilirsiniz (firma başına 20 saatte bir).</p>`);
  const main = document.querySelector(".main");
  main.onclick = async e => {
    const el = e.target.closest("[data-tk-new],[data-tk-edit],[data-tk-sil],[data-tk-silno],[data-tk-silok],[data-tk-run],[data-tk-yenile]");
    if (!el || el.disabled) return;
    const id = el.closest("[data-tk-id]")?.dataset.tkId;
    const t = id && (TK.list || []).find(x => x.id === id);
    if (el.hasAttribute("data-tk-new")) { TK.edit = { id: null }; TK.sil = ""; render(); document.getElementById("tkfirma")?.focus(); }
    else if (el.hasAttribute("data-tk-yenile")) { TK.list = null; render(); await loadTK(); if (route === "takip") render(); }
    else if (el.hasAttribute("data-tk-edit") && t) { TK.edit = t; TK.sil = ""; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (el.hasAttribute("data-tk-sil")) { TK.sil = id; render(); }
    else if (el.hasAttribute("data-tk-silno")) { TK.sil = ""; render(); }
    else if (el.hasAttribute("data-tk-silok")) {
      busy(el, true, "Siliniyor…");
      try { await rpc("app_takip_sil", { p_id: id }); TK.sil = ""; await Promise.all([loadTK(), loadBen()]); toast("Takip silindi"); }
      catch (err) { TK.run[id] = { kind: "err", html: esc(trErr(err)) }; TK.sil = ""; }
      if (route === "takip") render();
    } else if (el.hasAttribute("data-tk-run")) {
      busy(el, true, "Taranıyor…"); delete TK.run[id];
      const r = await api("/api/app/takip/calistir", { id });
      if (r.success) { TK.run[id] = { kind: "ok", html: "Tarama tamamlandı. Sonuç aşağıda; özet e-postanıza da gönderildi." }; await loadTK(); }
      else TK.run[id] = { kind: r.neden === "erken" ? "warn" : "err", html: esc(r.message || "Tarama başlatılamadı.") + (r.ne_zaman ? ` Bir sonraki elle tarama: <b>${fmtDT(r.ne_zaman)}</b>.` : "") };
      if (route === "takip") { render(); document.querySelector(`[data-tk-id="${CSS.escape(id)}"] details`)?.setAttribute("open", ""); }
    }
  };
  const f = document.getElementById("tkf");
  if (f) {
    const box = document.getElementById("tkrows"), addB = document.getElementById("tkadd");
    const add = (r = {}) => {
      if (box.children.length >= 6) return;
      const i = box.children.length + 1;
      box.insertAdjacentHTML("beforeend", `<div class="tk-row" data-tk-row><div class="row" style="flex-wrap:nowrap;gap:8px"><input class="in" data-k="firma" maxlength="80" placeholder="Rakip ${i} adı" aria-label="Rakip ${i} adı" value="${esc(r.firma || "")}"><button type="button" class="iconbtn" data-tk-rm aria-label="Rakip ${i}'i kaldır">✕</button></div>
        <div class="tk-row3"><input class="in" data-k="site" inputmode="url" maxlength="300" placeholder="Site / blog (rakip.com)" aria-label="Rakip ${i} sitesi" value="${esc(r.site || "")}"><input class="in" data-k="feed" inputmode="url" maxlength="500" placeholder="RSS adresi (isteğe bağlı)" aria-label="Rakip ${i} RSS" value="${esc(r.feed || "")}"><input class="in" data-k="linkedin" inputmode="url" maxlength="300" placeholder="LinkedIn şirket sayfası" aria-label="Rakip ${i} LinkedIn" value="${esc(r.linkedin || "")}"></div></div>`);
      addB.hidden = box.children.length >= 6;
    };
    const ilk = TK.edit && Array.isArray(TK.edit.rakipler) && TK.edit.rakipler.length ? TK.edit.rakipler : [{}];
    ilk.forEach(add);
    addB.onclick = () => { add(); box.lastElementChild.querySelector("input").focus(); };
    box.onclick = e => { const x = e.target.closest("[data-tk-rm]"); if (x && box.children.length > 1) { x.closest("[data-tk-row]").remove(); addB.hidden = false; } };
    document.getElementById("tkvaz").onclick = () => { TK.edit = null; render(); };
    f.onsubmit = async e => {
      e.preventDefault();
      const firma = f.tkfirma.value.trim();
      if (!firma) return setMsg("tkm", "err", "Firma adını girin.");
      const rakipler = [];
      for (const row of box.querySelectorAll("[data-tk-row]")) {
        const v = k => row.querySelector(`[data-k="${k}"]`).value.trim();
        const r = { firma: v("firma") }, bos = !v("site") && !v("feed") && !v("linkedin");
        if (bos && !r.firma) continue;
        if (bos) return setMsg("tkm", "err", `“${esc(r.firma)}” için site, RSS ya da LinkedIn adreslerinden en az birini girin.`);
        for (const k of ["site", "feed", "linkedin"]) {
          if (!v(k)) continue;
          const u = normUrl(v(k));
          if (!u) return setMsg("tkm", "err", `“${esc(v(k))}” geçerli bir adres değil.`);
          if (k === "linkedin" && !/linkedin\.com\//i.test(u)) return setMsg("tkm", "err", "LinkedIn alanına linkedin.com/company/… biçiminde bir adres girin.");
          r[k] = u;
        }
        if (!r.firma) r.firma = new URL(r.site || r.feed || r.linkedin).hostname.replace(/^www\./, "");
        rakipler.push(r);
      }
      if (!rakipler.length) return setMsg("tkm", "err", "En az bir rakip ekleyin.");
      const btn = f.querySelector("[type=submit]");
      busy(btn, true, "Kaydediliyor…"); setMsg("tkm");
      try {
        const r = await rpc("app_takip_kaydet", { p_id: TK.edit?.id || null, p_firma: firma, p_rakipler: rakipler });
        if (r && r.ok === false) {
          const m = { sure: NEDEN.sure(), plan: NEDEN.plan("takip"), kota: `Planınız en fazla ${r.limit ?? lim} firmayı takip etmeye izin veriyor.`, firma: "Firma adını kontrol edin.", rakip: "Rakip bilgilerini kontrol edin (1–6 rakip, her biri için en az bir adres).", yok: "Bu takip bulunamadı; sayfayı yenileyin." };
          busy(btn, false);
          return setMsg("tkm", "err", esc(m[r.neden] || "Kaydedilemedi.") + (r.neden === "kota" || r.neden === "plan" ? ` <a href="#/fiyatlar">Planlar →</a>` : ""));
        }
        const yeni = !TK.edit?.id;
        TK.edit = null;
        await Promise.all([loadTK(), loadBen()]);
        toast(yeni ? "Firma takibe alındı ✓" : "Takip güncellendi ✓");
        if (route === "takip") render();
      } catch (err) { busy(btn, false); setMsg("tkm", "err", esc(trErr(err))); }
    };
  }
  if (TK.list === null && !TK.err) loadTK().then(() => { if (route === "takip") render(); });
}

// ---------- Hesabım ----------
function firmaBolum(b) {
  firmaIste("hesap");
  if (FIRMA.v === undefined) return `<section class="card pad" id="firma"><h3>Firma profili</h3><div class="empty" style="padding:18px"><div class="spin"></div></div></section>`;
  if (FIRMA.err) return `<section class="card pad" id="firma"><h3 style="margin-bottom:10px">Firma profili</h3>${msg("err", `Firma profili yüklenemedi: ${esc(FIRMA.err)}`)}<button class="btn btn-g btn-s" type="button" data-firma-yenile style="margin-top:12px">Tekrar dene</button></section>`;
  const f = FIRMA.v || {}, eksik = firmaEksik(f);
  const ta = (id, lab, n, ph, hint = "") => `<div class="f"><label for="${id}">${lab}${hint ? ` <span class="hint">${hint}</span>` : ""}</label><textarea class="in" id="${id}" maxlength="${n}" rows="3" placeholder="${ph}">${esc(f[id] || "")}</textarea></div>`;
  const inp = (id, lab, n, ph, ex = "", hint = "") => `<div class="f"><label for="${id}">${lab}${hint ? ` <span class="hint">${hint}</span>` : ""}</label><input class="in" id="${id}" maxlength="${n}" placeholder="${ph}" value="${esc(f[id] || (id === "firma_adi" ? b.sirket || "" : ""))}"${ex}></div>`;
  return `<section class="card pad" id="firma"><div class="row" style="margin-bottom:6px"><h3>Firma profili</h3><span class="pill ${eksik.length ? "warn" : "ok"}">${eksik.length ? `${FIRMA_ALAN.length - eksik.length} / ${FIRMA_ALAN.length} dolu` : "Tamam ✓"}</span></div>
    <p style="color:var(--mute);font-size:14px;margin-bottom:14px">Briefing ve sekanslar "biz kimiz, ne satıyoruz" bilgisini buradan alır. Bir kez doldurmanız yeterli.</p>
    <div id="fpm"></div>
    <form id="fpf" data-sk-noform>
      <div class="grid2">${inp("firma_adi", "Firma adı", 160, "Ör. Örnek Yazılım A.Ş.", " required")}${inp("web", "Web sitesi", 300, "ornek.com", ' inputmode="url"')}</div>
      ${inp("sektor", "Sektör", 160, "Ör. B2B SaaS, lojistik, üretim")}
      ${ta("urunler", "Ürün / hizmetler", 800, "Her satıra bir ürün ya da hizmet", "(satır başına bir tane, en fazla 6)")}
      ${ta("hedef", "Hedef müşteri", 600, "Hangi sektör, büyüklük ve roldeki kişilere satıyorsunuz?")}
      ${ta("deger", "Değer önerisi", 800, "Müşteriniz sizi neden seçiyor? Rakiplerden farkınız ne?")}
      <div class="grid2">${inp("rakipler", "Başlıca rakipler", 400, "rakip1.com, rakip2.com", "", "(virgülle)")}${inp("referanslar", "Referans müşteriler", 600, "Firma A, Firma B", "", "(virgülle)")}</div>
      <button class="btn btn-p" type="submit">Firma profilini kaydet</button>
    </form>${logoBolum(b, f)}</section>`;
}
// Sunum logosu: Profesyonel/Ekip/Özel (ve admin) kendi logosunu yükler; diğerlerinde sunumlarda Sales Corner logosu çıkar
const logoPro = b => !!(b && (b.admin || (["profesyonel", "ekip", "ozel"].includes(b.plan) && b.aktif)));
const LOGO_AK = /^[0-9a-f-]{36}$/;
let LOGO_YENI = null; // { veri, oran } — seçilip henüz kaydedilmemiş logo
function logoBolum(b, f) {
  const ak = LOGO_AK.test(String(f.logo_anahtar || "")) ? f.logo_anahtar : "";
  const kutu = src => `<div style="display:flex;align-items:center;justify-content:center;min-height:76px;padding:12px 16px;border:1px solid var(--line);border-radius:12px;background:#fff">${src}</div>`;
  const bas = `<div class="row" style="margin-bottom:6px"><h3>Sunum logosu</h3><span class="pill acc">Pro</span></div>`;
  if (!logoPro(b)) return `<div id="flogo" style="margin-top:22px;padding-top:18px;border-top:1px solid var(--line)">${bas}
    <p style="color:var(--mute);font-size:14px;margin-bottom:12px">Sunum ve raporlarınızda Sales Corner logosu yer alır. Profesyonel ve üstü planlarda kendi firma logonuzu koyabilirsiniz.</p>
    <a class="btn btn-g btn-s" href="#/fiyatlar">Planları gör</a></div>`;
  const yeni = LOGO_YENI;
  const gor = yeni ? `<img src="${yeni.veri}" alt="Yeni logo önizleme" style="max-height:56px;max-width:240px;display:block">`
    : ak ? `<img src="/api/app/logo/${ak}.png" alt="Firma logosu" style="max-height:56px;max-width:240px;display:block">`
    : `<span style="color:var(--mute);font-size:13px">Henüz logo yok. Sunumlarda Sales Corner logosu kullanılır.</span>`;
  return `<div id="flogo" style="margin-top:22px;padding-top:18px;border-top:1px solid var(--line)">${bas}
    <p style="color:var(--mute);font-size:14px;margin-bottom:12px">Logonuz briefing, rakip analizi, sekans ve SEO çıktılarında Sales Corner logosunun yerine çıkar. PNG, JPG ya da WEBP; şeffaf arka planlı PNG en iyi sonucu verir.</p>
    <div id="flm"></div>
    ${kutu(gor)}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <label class="btn btn-g btn-s" style="cursor:pointer">${ak || yeni ? "Başka logo seç" : "Logo seç"}<input type="file" id="flin" accept="image/png,image/jpeg,image/webp" hidden></label>
      ${yeni ? `<button class="btn btn-p btn-s" type="button" data-logo-kaydet>Logoyu kaydet</button><button class="btn btn-g btn-s" type="button" data-logo-vazgec>Vazgeç</button>` : ""}
      ${ak && !yeni ? `<button class="btn btn-g btn-s" type="button" data-logo-kaldir>Logoyu kaldır</button>` : ""}
    </div></div>`;
}
// Seçilen görseli tarayıcıda en fazla 600×300 PNG'ye küçültür (sunucu sınırı 400 bin karakter)
function logoHazirla(file) {
  return new Promise((ok, no) => {
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return no(new Error("PNG, JPG ya da WEBP bir görsel seçin."));
    if (file.size > 8 * 1024 * 1024) return no(new Error("Görsel en fazla 8 MB olabilir."));
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w0 = img.naturalWidth, h0 = img.naturalHeight;
      if (!w0 || !h0) return no(new Error("Görsel okunamadı."));
      const oran = w0 / h0;
      if (oran < 0.2 || oran > 10) return no(new Error("Logo çok ince ya da çok uzun. Daha dengeli oranlı bir logo deneyin."));
      let k = Math.min(1, 600 / w0, 300 / h0), veri = "";
      for (let i = 0; i < 6; i++) {
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        veri = c.toDataURL("image/png");
        if (veri.length <= 390000) return ok({ veri, oran: c.width / c.height });
        k *= 0.75;
      }
      no(new Error("Logo çok büyük. Daha sade ya da küçük bir görsel deneyin."));
    };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error("Görsel okunamadı.")); };
    img.src = url;
  });
}
function logoCiz() {
  const el = document.getElementById("flogo");
  if (el && S.ben) { el.outerHTML = logoBolum(S.ben, FIRMA.v || {}); bindLogo(); }
}
function bindLogo() {
  const el = document.getElementById("flogo"), inp = document.getElementById("flin");
  if (!el || !inp) return;
  inp.onchange = async () => {
    const file = inp.files && inp.files[0];
    if (!file) return;
    try { LOGO_YENI = await logoHazirla(file); logoCiz(); }
    catch (err) { setMsg("flm", "err", esc(err.message || "Görsel okunamadı.")); }
  };
  const kaydet = async (p_logo, p_oran, btn, yazi, tamam) => {
    busy(btn, true, yazi); setMsg("flm");
    const o = FIRMA; // istek sürerken çıkış/hesap değişirse sonucu yeni oturuma yazma
    try {
      const r = await rpc("app_firma_logo_kaydet", { p_logo, p_oran });
      if (o !== FIRMA) return;
      FIRMA = { v: r && typeof r === "object" ? r : o.v, yuk: false, err: "" };
      LOGO_YENI = null; logoCiz(); toast(tamam);
    } catch (err) { if (o !== FIRMA) return; busy(btn, false); setMsg("flm", "err", esc(trErr(err))); }
  };
  const k = el.querySelector("[data-logo-kaydet]");
  if (k) k.onclick = () => LOGO_YENI && kaydet(LOGO_YENI.veri, LOGO_YENI.oran, k, "Kaydediliyor…", "Logo kaydedildi ✓");
  const v = el.querySelector("[data-logo-vazgec]");
  if (v) v.onclick = () => { LOGO_YENI = null; logoCiz(); };
  const d = el.querySelector("[data-logo-kaldir]");
  if (d) d.onclick = () => kaydet(null, null, d, "Kaldırılıyor…", "Logo kaldırıldı");
}
function bindFirma() {
  bindLogo();
  const ff = document.getElementById("fpf");
  if (!ff) return;
  ff.onsubmit = async e => {
    e.preventDefault();
    const v = k => ff[k].value.trim();
    const web = v("web");
    if (web && !normUrl(web)) return setMsg("fpm", "err", "Web sitesini geçerli bir adres olarak girin (ör. ornek.com).");
    const urunler = ff.urunler.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    if (urunler.length > 6) return setMsg("fpm", "err", "En fazla 6 ürün ya da hizmet yazın (satır başına bir tane).");
    if (urunler.some(x => x.length > 120)) return setMsg("fpm", "err", "Her ürün satırı en fazla 120 karakter olabilir.");
    const btn = ff.querySelector("[type=submit]");
    busy(btn, true, "Kaydediliyor…"); setMsg("fpm");
    const o = FIRMA;
    try {
      const r = await rpc("app_firma_kaydet", { p: { firma_adi: v("firma_adi"), web: web ? normUrl(web) : "", sektor: v("sektor"), urunler: urunler.join("\n"), hedef: v("hedef"), deger: v("deger"), rakipler: v("rakipler"), referanslar: v("referanslar") } });
      if (o !== FIRMA) return;
      FIRMA = { v: r && typeof r === "object" ? r : null, yuk: false, err: "" };
      if (S.ben && !S.ben.sirket && FIRMA.v?.firma_adi) S.ben.sirket = FIRMA.v.firma_adi;
      toast("Firma profili kaydedildi ✓"); render();
    } catch (err) { if (o !== FIRMA) return; busy(btn, false); setMsg("fpm", "err", esc(trErr(err))); }
  };
}
function pageHesap() {
  const b = S.ben;
  shell(`${ph("Hesabım", "Profil, plan ve bağlantı ayarlarınız.")}
  <div style="display:grid;gap:16px;max-width:760px">
    <section class="card pad"><h3 style="margin-bottom:14px">Profil</h3><div id="pm"></div>
      <form id="pf" data-sk-noform><div class="grid2">
        <div class="f"><label for="ad">Ad soyad</label><input class="in" id="ad" maxlength="120" value="${esc(b.ad || "")}"></div>
        <div class="f"><label for="sr">Şirket</label><input class="in" id="sr" maxlength="160" value="${esc(b.sirket || "")}"></div></div>
        <div class="f"><label for="em">E-posta</label><input class="in" id="em" value="${esc(b.email)}" disabled></div>
        <button class="btn btn-p" type="submit">Kaydet</button></form></section>
    ${firmaBolum(b)}
    <section class="card pad"><div class="row" style="margin-bottom:14px"><h3>Plan ve kullanım</h3><span class="pill ${b.aktif ? "acc" : "warn"}">${esc(b.plan_ad || b.plan)} · ${b.aktif ? "Geçerlilik: " + fmtD(b.bitis) : "süre doldu"}</span></div>
      <div class="scroll-x"><table class="tbl"><thead><tr><th>Araç</th><th>Bu ay (${esc(b.ay || "")})</th><th>Aylık hak</th></tr></thead><tbody>
      ${MODS.map(m => { const d = durum(m.k); return `<tr><td>${esc(m.ad)}</td><td>${d.kul}${m.k === "takip" ? " firma" : ""}</td><td>${d.lim < 0 ? "Sınırsız" : d.lim ? d.lim + (m.k === "takip" ? " firma (haftalık)" : "") : "Plana dahil değil"}</td></tr>`; }).join("")}
      </tbody></table></div><a class="btn btn-g btn-s" href="#/fiyatlar" style="margin-top:14px">Planları gör</a></section>
    <section class="card pad"><div class="row" style="margin-bottom:6px"><h3>Fireflies bağlantısı</h3><span class="pill ${b.fireflies ? "ok" : ""}">${b.fireflies ? "Bağlı" : "Bağlı değil"}</span></div>
      ${b.fireflies ? `<p style="color:var(--mute);margin-bottom:14px">Toplantı analizi için Fireflies hesabınız bağlı. Anahtarı değiştirmek için yenisini kaydedin.</p><div id="fkm"></div><div class="row" style="justify-content:flex-start"><button class="btn btn-d btn-s" id="ffdel">Bağlantıyı kaldır</button></div><details style="margin-top:14px"><summary style="cursor:pointer;font-weight:600">Anahtarı değiştir</summary><div style="margin-top:12px">${ffConnect(true)}</div></details>` : ffConnect(true)}
    </section>
    <section class="card pad"><h3 style="margin-bottom:14px">Şifre değiştir</h3><div id="sm"></div>
      <form id="sf" data-sk-noform>${pwField("p1", "Yeni şifre", "new-password", 'minlength="8"')}${pwField("p2", "Yeni şifre (tekrar)", "new-password", 'minlength="8"')}<button class="btn btn-g" type="submit">Şifreyi güncelle</button></form></section>
    <section class="card pad row"><div><h3>Oturumu kapat</h3><p style="color:var(--mute);font-size:14px">Bu cihazdaki oturumunuz kapanır.</p></div><button class="btn btn-g" data-logout>Çıkış yap</button></section>
  </div>`);
  const pf = document.getElementById("pf");
  pf.onsubmit = async e => {
    e.preventDefault();
    const btn = pf.querySelector("[type=submit]");
    busy(btn, true, "Kaydediliyor…");
    try { S.ben = await rpc("app_profil", { p_ad: pf.ad.value, p_sirket: pf.sr.value }); toast("Profil kaydedildi ✓"); render(); }
    catch (err) { busy(btn, false); setMsg("pm", "err", esc(trErr(err))); }
  };
  bindFirma();
  bindFfKey(render);
  const del = document.getElementById("ffdel");
  if (del) del.onclick = async () => {
    busy(del, true, "Kaldırılıyor…");
    try { await rpc("app_fireflies_kaydet", { p_key: "" }); await loadBen(); FF = { list: null, err: "", sel: "" }; toast("Fireflies bağlantısı kaldırıldı"); render(); }
    catch (err) { busy(del, false); setMsg("fkm", "err", esc(trErr(err))); }
  };
  const sf = document.getElementById("sf");
  sf.onsubmit = async e => {
    e.preventDefault();
    if (sf.p1.value.length < 8) return setMsg("sm", "err", "Şifre en az 8 karakter olmalı.");
    if (sf.p1.value !== sf.p2.value) return setMsg("sm", "err", "Şifreler aynı değil.");
    const btn = sf.querySelector("[type=submit]");
    busy(btn, true, "Güncelleniyor…");
    const { error } = await sb.auth.updateUser({ password: sf.p1.value });
    busy(btn, false);
    if (error) return setMsg("sm", "err", esc(trErr(error)));
    sf.reset(); setMsg("sm", "ok", "Şifreniz güncellendi.");
  };
}

// ---------- Yönetim (yalnızca admin) ----------
let ADM = { rows: null, err: "", q: "", tab: "kul", ilt: null, iltErr: "", iq: "", yeni: false };
const admDurum = (r, now) => {
  if (!r.onayli) return ["E-posta onaysız", "warn"];
  if (!r.plan) return ["Hesap açılmadı", ""];
  if (new Date(r.bitis) <= now) return ["Süresi doldu", "bad"];
  return r.plan === "deneme" ? ["Denemede", "acc"] : ["Ücretli", "ok"];
};
const admLow = s => String(s ?? "").toLocaleLowerCase("tr-TR");
function admCsv(rows, planlar) {
  const now = Date.now();
  const cell = v => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const head = ["E-posta", "Ad", "Şirket", "Durum", "Plan", "Bitiş", "Kayıt", "Son giriş", "Takip", "Bu ay kullanım", "Admin"];
  const lines = rows.map(r => [r.email, r.ad, r.sirket, admDurum(r, now)[0], r.plan ? ((planlar.find(p => p.kod === r.plan) || {}).ad || r.plan) : "", r.bitis ? new Date(r.bitis).toISOString().slice(0, 10) : "", r.kayit ? new Date(r.kayit).toISOString().slice(0, 10) : "", r.son_giris ? new Date(r.son_giris).toISOString().slice(0, 16).replace("T", " ") : "", r.takip_adet ?? 0, Object.entries(r.kullanim || {}).map(([k, v]) => `${k}:${v}`).join(" "), r.admin ? "evet" : ""].map(cell).join(";"));
  const blob = new Blob(["﻿" + [head.map(cell).join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `salescorner-kullanicilar-${today()}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function pageAdmin() {
  const planlar = S.planlar || PLAN_FALLBACK;
  const rows = ADM.rows, ilt = ADM.ilt;
  const now = Date.now();
  const say = f => (rows || []).filter(f).length;
  const yeniSay = (ilt || []).filter(m => !m.okundu).length;
  const kisa = { rakip: "R", sekans: "S", seo: "SEO", briefing: "B", fireflies: "F", takip: "T" };
  const planAd = r => (planlar.find(p => p.kod === r.plan) || {}).ad || r.plan;
  const aktif = r => r.plan && new Date(r.bitis) > now;
  const tabs = `<div class="tabs adm-tabs" role="tablist"><button type="button" role="tab" aria-selected="${ADM.tab === "kul"}" data-atab="kul">Kullanıcılar${rows ? ` (${fmtN(rows.length)})` : ""}</button><button type="button" role="tab" aria-selected="${ADM.tab === "ilt"}" data-atab="ilt">İletişim formları${yeniSay ? ` <span class="pill bad">${fmtN(yeniSay)} yeni</span>` : ""}</button></div>`;
  let body;
  if (ADM.tab === "ilt") {
    const q = admLow(ADM.iq);
    const vis = (ilt || []).filter(m => (!ADM.yeni || !m.okundu) && (!q || admLow([m.ad, m.email, m.konu, m.telefon, m.mesaj, m.sayfa].join(" ")).includes(q)));
    body = `<section class="card"><div class="res-h adm-bar"><h3>İletişim formları</h3><div class="adm-f"><label class="adm-chk"><input type="checkbox" id="iy" ${ADM.yeni ? "checked" : ""}> Yalnız okunmamış</label><input class="in" id="iq" placeholder="Ara: ad, e-posta, konu, mesaj" value="${esc(ADM.iq)}"></div></div>
    ${ADM.iltErr ? `<div class="res-b">${msg("err", esc(ADM.iltErr))}</div>` : !ilt ? `<div class="empty"><div class="spin"></div></div>` : !ilt.length ? `<div class="res-b"><p style="color:var(--mute);margin:0">Henüz form gönderen yok. salescorner.co/iletisim ve /en/contact formundan gelen yeni mesajlar burada görünür.</p></div>` : `<div class="adm-ilt">${vis.map(m => {
      const tel = String(m.telefon || "").replace(/[^\d+]/g, "");
      const uzun = String(m.mesaj || "").length > 260;
      return `<article class="adm-msg${m.okundu ? "" : " yeni"}"><div class="adm-mh"><div><b>${esc(m.ad || "İsimsiz")}</b>${m.okundu ? "" : ` <span class="pill bad">Yeni</span>`}<div class="adm-sub">${fmtDT(m.olusturma)} · ${esc(m.sayfa || "—")}${m.dil === "en" ? " · EN" : ""}</div></div>
        <button class="btn btn-g btn-s" data-okundu="${esc(m.id)}" data-v="${m.okundu ? "0" : "1"}">${m.okundu ? "Okunmadı yap" : "Okundu ✓"}</button></div>
        <div class="adm-mc">${m.email ? `<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ""}${tel ? `<a href="tel:${esc(tel)}">${esc(m.telefon)}</a>` : m.telefon ? `<span>${esc(m.telefon)}</span>` : ""}${m.konu ? `<span class="pill acc">${esc(m.konu)}</span>` : ""}</div>
        ${m.mesaj ? (uzun ? `<details class="adm-mt"><summary>${esc(String(m.mesaj).slice(0, 220))}… <u>devamı</u></summary><p>${esc(m.mesaj)}</p></details>` : `<p class="adm-mt">${esc(m.mesaj)}</p>`) : ""}</article>`;
    }).join("") || `<p style="color:var(--mute);padding:16px 20px;margin:0">Sonuç yok.</p>`}</div>`}
    <p class="hint adm-not">Bu liste yönetim paneli kurulduktan sonra gelen mesajları gösterir; önceki form gönderimleri ayrı form kayıt sisteminde duruyor.</p></section>`;
  } else {
    const q = admLow(ADM.q);
    const vis = (rows || []).filter(r => !q || admLow([r.email, r.ad, r.sirket, r.plan, admDurum(r, now)[0]].join(" ")).includes(q));
    body = `<section class="card pad" style="margin-bottom:16px"><h3 style="margin-bottom:12px">Plan ata</h3><div id="am"></div>
    <form id="af" data-sk-noform><div class="adm-grid">
      <div class="f" style="margin:0"><label for="ae">Kullanıcı e-postası</label><input class="in" id="ae" type="email" required></div>
      <div class="f" style="margin:0"><label for="ap">Plan</label><select class="in" id="ap">${planlar.map(p => `<option value="${esc(p.kod)}">${esc(p.ad)}</option>`).join("")}</select></div>
      <div class="f" style="margin:0"><label for="ag">Gün</label><input class="in" id="ag" type="number" min="1" max="3660" placeholder="Değişmesin"></div>
      <button class="btn btn-p" type="submit">Ata</button></div>
      <p class="hint" style="font-size:12.5px;color:var(--mute);margin-top:8px">Gün boş bırakılırsa mevcut bitiş tarihi korunur. Ör. aylık plan için 30, yıllık için 365. Kullanıcının önce kayıt olmuş olması gerekir.</p></form></section>
  <section class="card"><div class="res-h adm-bar"><h3>Kullanıcılar</h3><div class="adm-f"><input class="in" id="aq" placeholder="Ara: e-posta, ad, şirket, durum" value="${esc(ADM.q)}"><button class="btn btn-g btn-s" id="acsv" type="button" ${rows && rows.length ? "" : "disabled"}>CSV indir</button></div></div>
  ${ADM.err ? `<div class="res-b">${msg("err", esc(ADM.err))}</div>` : !rows ? `<div class="empty"><div class="spin"></div></div>` : `<div class="scroll-x"><table class="tbl"><thead><tr><th>Kullanıcı</th><th>Durum</th><th>Kayıt</th><th>Bitiş</th><th>Bu ay</th><th>Takip</th><th>Son giriş</th><th></th></tr></thead><tbody>
  ${vis.map(r => { const [dt, dc] = admDurum(r, now); return `<tr><td><b>${esc(r.email)}</b>${r.admin ? ` <span class="pill acc">Admin</span>` : ""}<br><span class="adm-sub">${esc([r.ad, r.sirket].filter(Boolean).join(" · ") || "Ad / şirket girilmemiş")}</span></td>
    <td><span class="pill ${dc}">${esc(dt)}</span>${r.plan ? `<br><span class="adm-sub">${esc(planAd(r))}</span>` : ""}</td>
    <td style="font-size:13px">${fmtD(r.kayit)}</td>
    <td style="font-size:13px">${!r.plan ? "—" : aktif(r) ? `${fmtD(r.bitis)}<br><span class="adm-sub">${daysLeft(r.bitis)} gün kaldı</span>` : fmtD(r.bitis)}</td>
    <td style="font-size:13px">${Object.entries(r.kullanim || {}).map(([k, v]) => `${kisa[k] || esc(k)} ${esc(v)}`).join(" · ") || "—"}</td>
    <td style="font-size:13px">${esc(r.takip_adet ?? 0)}</td>
    <td style="font-size:13px">${fmtDT(r.son_giris)}</td>
    <td><button class="btn btn-g btn-s" data-edit="${esc(r.email)}" data-plan="${esc(r.plan || "deneme")}">Düzenle</button></td></tr>`; }).join("") || `<tr><td colspan="8" style="color:var(--mute)">Sonuç yok.</td></tr>`}
  </tbody></table></div>`}</section>`;
  }
  shell(`${ph("Yönetim", "Kayıtlı kullanıcılar, planları, kullanım ve iletişim formları.", `<button class="btn btn-g btn-s" id="ayen" type="button">Yenile</button>`)}
  <div class="stats adm-stats">
    <div class="card stat"><span>Toplam kullanıcı</span><b>${rows ? fmtN(rows.length) : "…"}</b></div>
    <div class="card stat"><span>Denemede</span><b>${rows ? say(r => aktif(r) && r.plan === "deneme") : "…"}</b></div>
    <div class="card stat"><span>Ücretli plan</span><b>${rows ? say(r => aktif(r) && r.plan !== "deneme") : "…"}</b></div>
    <div class="card stat"><span>Süresi dolan</span><b>${rows ? say(r => r.plan && !aktif(r)) : "…"}</b></div>
    <div class="card stat"><span>Son 7 gün kayıt</span><b>${rows ? say(r => r.kayit && now - new Date(r.kayit) < 7 * 864e5) : "…"}</b></div>
    <div class="card stat"><span>Okunmamış mesaj</span><b>${ilt ? fmtN(yeniSay) : ADM.iltErr ? "—" : "…"}</b></div>
  </div>
  ${tabs}${body}`);
  document.querySelectorAll("[data-atab]").forEach(b => (b.onclick = () => { ADM.tab = b.dataset.atab; pageAdmin(); }));
  document.getElementById("ayen").onclick = async e => { busy(e.currentTarget, true, "Yenileniyor…"); ADM.rows = null; ADM.ilt = null; await Promise.all([loadAdm(), loadIlt()]); if (route === "admin") pageAdmin(); };
  const keepFocus = (id, set) => { const el = document.getElementById(id); if (!el) return; el.oninput = () => { set(el.value); const pos = el.selectionStart; pageAdmin(); const n = document.getElementById(id); n.focus(); n.setSelectionRange(pos, pos); }; };
  if (ADM.tab === "ilt") {
    keepFocus("iq", v => (ADM.iq = v));
    const iy = document.getElementById("iy"); if (iy) iy.onchange = () => { ADM.yeni = iy.checked; pageAdmin(); };
    document.querySelectorAll("[data-okundu]").forEach(b => (b.onclick = async () => {
      const id = Number(b.dataset.okundu), v = b.dataset.v === "1";
      const m = (ADM.ilt || []).find(x => Number(x.id) === id); if (!m) return;
      busy(b, true, "…");
      try { await rpc("app_admin_iletisim_okundu", { p_id: id, p_okundu: v }); m.okundu = v; toast(v ? "Okundu olarak işaretlendi" : "Okunmadı olarak işaretlendi"); }
      catch (err) { toast(trErr(err)); }
      if (route === "admin") pageAdmin();
    }));
  } else {
    const af = document.getElementById("af");
    af.onsubmit = async e => {
      e.preventDefault();
      const btn = af.querySelector("[type=submit]");
      busy(btn, true, "Atanıyor…");
      const gun = af.ag.value ? parseInt(af.ag.value, 10) : null;
      try {
        await rpc("app_admin_ata", { p_email: af.ae.value.trim(), p_plan: af.ap.value, p_gun: gun });
        toast("Plan atandı ✓");
        ADM.rows = null; await loadAdm();
        if (route === "admin") pageAdmin();
      } catch (err) { busy(btn, false); setMsg("am", "err", esc(trErr(err))); }
    };
    keepFocus("aq", v => (ADM.q = v));
    const csv = document.getElementById("acsv"); if (csv) csv.onclick = () => admCsv(ADM.rows || [], planlar);
    document.querySelectorAll("[data-edit]").forEach(x => (x.onclick = () => { af.ae.value = x.dataset.edit; af.ap.value = x.dataset.plan; af.ag.focus(); af.scrollIntoView({ behavior: "smooth", block: "center" }); }));
  }
  if ((!rows && !ADM.err) || (!ilt && !ADM.iltErr)) {
    await Promise.all([!rows && !ADM.err ? loadAdm() : null, !ilt && !ADM.iltErr ? loadIlt() : null, rows ? null : loadPlanlar()]);
    if (route === "admin") pageAdmin();
  }
}
async function loadAdm() {
  try { ADM.rows = (await rpc("app_admin_liste")) || []; ADM.err = ""; }
  catch (e) { ADM.err = trErr(e); }
}
async function loadIlt() {
  try { ADM.ilt = (await rpc("app_admin_iletisim")) || []; ADM.iltErr = ""; }
  catch (e) { ADM.iltErr = trErr(e); }
}

const PAGES = { giris: pageGiris, kayit: pageKayit, sifre: pageSifre, "yeni-sifre": pageYeniSifre, panel: pagePanel, rakip: pageRakip, sekans: pageSekans, seo: pageSeo, briefing: pageBriefing, fireflies: pageFireflies, takip: pageTakip, fiyatlar: pageFiyatlar, hesap: pageHesap, admin: pageAdmin, ozel: pageOzel };

// ---------- Genel olaylar ----------
document.addEventListener("click", e => {
  if (e.target.closest("a[data-teklif]")) try { sessionStorage.setItem("sc_app_ret", location.pathname + location.hash); } catch {}
});
document.addEventListener("click", async e => {
  const t = e.target.closest("[data-go],[data-eye],[data-side],[data-menu],[data-logout],[data-firma-yenile],[data-copy],[data-copy-el],[data-reset],.nav a,#seo-show,#seo-dl");
  if (!t) return;
  if (t.dataset.go) { e.preventDefault(); go(t.dataset.go); }
  else if (t.dataset.eye) { const i = document.getElementById(t.dataset.eye); const show = i.type === "password"; i.type = show ? "text" : "password"; t.textContent = show ? "Gizle" : "Göster"; t.setAttribute("aria-label", show ? "Şifreyi gizle" : "Şifreyi göster"); }
  else if (t.hasAttribute("data-side")) {
    const sh = document.getElementById("shell");
    if (!sh) return;
    sh.classList.remove("open");
  }
  else if (t.hasAttribute("data-menu")) document.getElementById("shell")?.classList.toggle("open");
  else if (t.hasAttribute("data-logout")) { await sb.auth.signOut(); S.session = null; S.ben = null; FIRMA = { v: undefined, yuk: false, err: "" }; LOGO_YENI = null; ADM = { rows: null, err: "", q: "" }; FF = { list: null, err: "", sel: "" }; TK = { list: null, err: "", edit: null, sil: "", run: {} }; go("giris"); }
  else if (t.hasAttribute("data-firma-yenile")) { FIRMA = { v: undefined, yuk: false, err: "" }; render(); }
  else if (t.dataset.copy || t.dataset.copyEl) {
    const txt = t.dataset.copy || document.getElementById(t.dataset.copyEl)?.innerText || "";
    try { await navigator.clipboard.writeText(txt); toast("Kopyalandı ✓"); } catch { toast("Kopyalanamadı; metni seçip kopyalayın."); }
  }
  else if (t.dataset.reset) { const k = t.dataset.reset; delete JOBS[k]; saveJobs(); render(); }
  else if (t.matches(".nav a")) document.getElementById("shell")?.classList.remove("open");
  else if (t.id === "seo-show" || t.id === "seo-dl") {
    const html = JOBS.seo?.res?.sonuc?.html_report;
    if (!html) return;
    if (t.id === "seo-dl") {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      a.download = "seo-raporu.html"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } else {
      const box = document.getElementById("seo-frame");
      if (box.firstChild) { box.innerHTML = ""; t.textContent = "Raporu göster"; return; }
      const fr = document.createElement("iframe");
      fr.setAttribute("sandbox", "allow-popups allow-popups-to-escape-sandbox");
      fr.setAttribute("title", "SEO raporu");
      fr.style.cssText = "width:100%;height:720px;border:1px solid var(--line);border-radius:12px;margin-top:12px;background:#fff";
      fr.srcdoc = html;
      box.appendChild(fr); t.textContent = "Raporu gizle";
    }
  }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") document.getElementById("shell")?.classList.remove("open"); });

// ---------- Başlangıç ----------
sb.auth.onAuthStateChange((ev, session) => {
  S.session = session;
  if (ev === "PASSWORD_RECOVERY") { S.recovery = true; setTimeout(() => go("yeni-sifre"), 0); }
  if (ev === "SIGNED_OUT") { S.ben = null; FIRMA = { v: undefined, yuk: false, err: "" }; LOGO_YENI = null; if (route && !AUTH_ROUTES.has(route)) setTimeout(render, 0); }
});
{
  const { data } = await sb.auth.getSession();
  S.session = data.session;
  if (S.session) await loadBen();
  if (/access_token|error_description|[?#&]type=/.test(initialHash))
    history.replaceState(null, "", location.pathname + location.search + "#/" + (S.recovery && S.session ? "yeni-sifre" : S.session ? "panel" : "giris"));
  window.addEventListener("hashchange", render);
  render();
  for (const k of Object.keys(JOBS)) if (JOBS[k].state === "run") poll(k); else if (S.session && JOBS[k].state === "err" && !JOBS[k].iade) iade(k, JOBS[k]);
}
