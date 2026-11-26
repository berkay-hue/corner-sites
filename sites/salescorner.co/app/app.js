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
  { k: "sekans", ad: "Sekans Yazarı", ic: ic("pen"), bg: "#fdf2f8", d: "Firmanız için cold call senaryosu ve LinkedIn mesaj sekansı yazar." },
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
  { kod: "deneme", ad: "Deneme (14 gün)", aylik_tl: 0, koltuk: 1, kota: { rakip: 0, sekans: 5, seo: 5, briefing: 5, fireflies: 3, takip: 1 } },
  { kod: "baslangic", ad: "Başlangıç", aylik_tl: 1490, koltuk: 1, kota: { rakip: 1, sekans: 3, seo: 2, briefing: 2, takip: 1 } },
  { kod: "profesyonel", ad: "Profesyonel", aylik_tl: 3490, koltuk: 1, kota: { rakip: 4, sekans: 15, seo: 8, briefing: 10, fireflies: 4, takip: 3 } },
  { kod: "ekip", ad: "Ekip", aylik_tl: 8990, koltuk: 5, kota: { rakip: 15, sekans: 60, seo: 30, briefing: 40, fireflies: 20, takip: 10 } },
  { kod: "ozel", ad: "Özel AI", aylik_tl: null, koltuk: 0, kota: { rakip: -1, sekans: -1, seo: -1, briefing: -1, fireflies: -1, takip: -1 } },
];
const PLAN_META = {
  baslangic: { d: "Tek başına satış yapanlar için temel araçlar." },
  profesyonel: { d: "Aktif satış yapan profesyoneller için tam paket.", hot: true, ek: ["Kullanıcı başına fiyat; ekip arkadaşı için ek kullanıcı", "Sunumlarda kendi logonuz"] },
  ekip: { d: "Satış ekipleri için yüksek kota.", ek: ["5 kullanıcı dahil", "Öncelikli destek", "Sunumlarda kendi logonuz"] },
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
  for (const k of Object.keys(STATUS)) if (JOBS[k] && !JOBS[k].sync && !JOBS[k].gecmis) o[k] = JOBS[k];
  store.set("jobs", o);
}
function addHist(e) {
  const h = store.get("hist", []);
  h.unshift({ ...e, at: Date.now() });
  store.set("hist", h.slice(0, 12));
}
// ---------- Geçmiş (son 3 gün, hesaba bağlı) ----------
// Başarılı her çıktı bir kez app_gecmis_kaydet ile saklanır; sunucu son 3 günü listeler.
// Geçmiş içeriği yalnız bellekte tutulur (localStorage'a yazılmaz), çıkışta temizlenir.
const GM_MODS = new Set(["rakip", "sekans", "seo", "briefing", "fireflies", "takip"]);
const GM_MAX = 1.5 * 1024 * 1024;
let GECMIS = {}, GM_OTO = {}, GM_UID = "", GM_TK = null, GM_ACILIYOR = {};
function gecmisSifirla() {
  GECMIS = {}; GM_OTO = {}; GM_UID = ""; GM_TK = null; GM_ACILIYOR = {};
  for (const k of Object.keys(JOBS)) if (JOBS[k] && JOBS[k].gecmis) delete JOBS[k];
}
// Oturum değiştiyse önceki kullanıcının listesi kullanılmaz
function gmUid() { const u = S.session?.user?.id || ""; if (u !== GM_UID) { gecmisSifirla(); GM_UID = u; } return u; }
// Geçmiş uçları henüz yoksa genel "kurulum" ekranı tetiklenmesin
async function gmRpc(fn, args) { const s = S.setupErr; try { return await rpc(fn, args); } finally { S.setupErr = s; } }
const gmBaslik = s => Array.from(String(s ?? "").replace(/\s+/g, " ").trim()).slice(0, 200).join("") || "Çalışma";
async function gecmisKaydet(k, j, veri) {
  if (!GM_MODS.has(k) || !j || j.kaydedildi || j.gecmis || veri == null || !S.session) return;
  j.kaydedildi = true;
  try {
    const boyut = new TextEncoder().encode(JSON.stringify(veri)).length;
    if (boyut > GM_MAX) { console.warn("Geçmiş kaydı atlandı (içerik 1,5 MB üstü)", k, boyut); return; }
    const uid = gmUid();
    await gmRpc("app_gecmis_kaydet", { p_modul: k, p_baslik: gmBaslik(j.title), p_veri: veri });
    if (GM_UID !== uid) return;
  } catch (err) { console.warn("Geçmiş kaydedilemedi", k, err); return; }
  delete GECMIS[k]; delete GECMIS["*"];
  if (route === k) gecmisYukle(k); else if (route === "panel") panelGecmis();
}
// k: modül ya da "*" (tüm modüller). Aynı anda tek istek; hata olursa bir sonraki çağrı yeniden dener.
function gecmisListe(k) {
  gmUid();
  let c = GECMIS[k];
  if (c && !c.err) return c.p;
  c = GECMIS[k] = { list: null, err: false };
  c.p = gmRpc("app_gecmis_liste", { p_modul: k === "*" ? null : k })
    .then(r => { c.list = (Array.isArray(r) ? r : []).filter(x => x && x.id != null && GM_MODS.has(x.modul) && (k === "*" || x.modul === k)); return c; })
    .catch(err => { console.warn("Geçmiş alınamadı", err); c.err = true; return c; });
  return c.p;
}
function gecmisKutu(k) {
  const v = k === "takip" && GM_TK ? `<div class="tk-body" style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px">
    <div class="row" style="margin-bottom:8px"><b>${esc(GM_TK.baslik || "Rakip takibi")} <span class="tk-mute" style="font-weight:400;font-size:13px">· ${esc(fmtDT(GM_TK.olusturma))}</span></b><button type="button" class="linkbtn" data-gecmis-kapat>Kapat</button></div>
    ${tkSonuc(GM_TK.veri)}</div>` : "";
  return `<section class="card pad" id="gecmis" data-gm="${esc(k)}" style="margin-top:18px" aria-label="Geçmiş (son 3 gün)">
    <h3 style="font-size:16px;margin-bottom:10px">Geçmiş (son 3 gün)</h3><div data-gm-list>${gmListeHtml(k, GECMIS[k])}</div>${v}</section>`;
}
function gmListeHtml(k, c) {
  if (!c || (!c.list && !c.err)) return `<div class="spin s" aria-label="Yükleniyor"></div>`;
  if (c.err) return `<p class="tk-mute" style="font-size:13.5px">Geçmiş şu an yüklenemedi. <button type="button" class="linkbtn" data-gecmis-yenile="${esc(k)}">Tekrar dene</button></p>`;
  if (!c.list.length) return `<p class="tk-mute" style="font-size:13.5px">Son 3 günde kayıt yok.</p>`;
  const acik = k === "takip" ? GM_TK && GM_TK.id : JOBS[k]?.gecmis && JOBS[k].gecmisId;
  return `<ul style="list-style:none;margin:0;padding:0;display:grid;gap:8px">${c.list.slice(0, 30).map(x => {
    const on = acik != null && String(acik) === String(x.id);
    return `<li style="display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline"><button type="button" class="linkbtn" data-gecmis-ac="${esc(x.id)}" data-gecmis-mod="${esc(x.modul)}" style="text-align:left${on ? ";font-weight:700" : ""}"${on ? ' aria-current="true"' : ""}>${esc(x.baslik || "Çalışma")}</button><span class="tk-mute" style="font-size:13px">${esc(fmtDT(x.olusturma))}</span></li>`;
  }).join("")}</ul>`;
}
async function gecmisYukle(k) {
  const box = document.getElementById("gecmis");
  if (!box || box.dataset.gm !== k) return;
  const c = await gecmisListe(k);
  if (route !== k || GECMIS[k] !== c || document.getElementById("gecmis") !== box) return;
  const el = box.querySelector("[data-gm-list]");
  if (el) el.innerHTML = gmListeHtml(k, c);
  // İş yokken son kayıt kendiliğinden açılır (sayfa başına bir kez; "Yeni çalışma" sonrası açılmaz)
  if (!c.err && c.list.length && !GM_OTO[k] && !JOBS[k] && k !== "takip" && !(k === "briefing" && BRF_SEKME === "toplu")) {
    GM_OTO[k] = true;
    gecmisAc(k, c.list[0].id, { oto: true });
  }
}
async function gecmisAc(k, id, o = {}) {
  if (!GM_MODS.has(k) || id == null || id === "") return;
  if (JOBS[k]?.state === "run") { if (!o.oto) toast("Süren çalışma bitince geçmişi açabilirsiniz."); return; }
  const x = [...(GECMIS[k]?.list || []), ...(GECMIS["*"]?.list || [])].find(y => String(y.id) === String(id));
  const from = route, uid = gmUid(), tok = {};
  GM_ACILIYOR[k] = tok;
  busy(o.btn, true, "Açılıyor…");
  let v = null;
  try { v = await gmRpc("app_gecmis_getir", { p_id: x ? x.id : id }); } catch (err) { console.warn("Geçmiş kaydı alınamadı", err); v = undefined; }
  if (o.btn && o.btn.isConnected) busy(o.btn, false);
  if (GM_ACILIYOR[k] !== tok || GM_UID !== uid || route !== from) return;
  delete GM_ACILIYOR[k];
  if (!v || typeof v !== "object" || v.modul !== k || v.veri == null) {
    if (!o.oto) toast(v === undefined ? "Kayıt şu an açılamadı. Lütfen tekrar deneyin." : "Bu kayıt artık yok; son 3 günün dışında kalmış olabilir.");
    if (v !== undefined) { delete GECMIS[k]; delete GECMIS["*"]; if (route === k) gecmisYukle(k); else if (route === "panel") panelGecmis(); }
    return;
  }
  // Beklerken kullanıcı yeni bir çalışma başlattıysa ekrandaki iş ezilmez
  if (JOBS[k] && (o.oto || JOBS[k].state === "run")) return;
  GM_OTO[k] = true;
  if (k === "takip") GM_TK = { id: v.id, baslik: v.baslik, olusturma: v.olusturma, veri: v.veri };
  else {
    if (k === "briefing" && BRF_SEKME === "toplu") { BRF_SEKME = "tek"; store.set("brf_sekme", "tek"); }
    JOBS[k] = { state: "done", res: v.veri, title: v.baslik, gecmis: true, gecmisId: v.id, t0: Date.parse(v.olusturma) || Date.now(), kaydedildi: true };
    saveJobs();
  }
  if (from !== k) return go(k);
  render();
  if (!o.oto) document.getElementById(k === "takip" ? "gecmis" : "out")?.scrollIntoView({ block: "start", behavior: "smooth" });
}
// Panel "Son çalışmalarınız": hesaptaki son 3 gün; alınamazsa bu cihazdaki kısa liste gösterilir
function panelGecmisHtml(c) {
  if (!c || (!c.list && !c.err)) return "";
  const bas = `<h2 style="margin:30px 0 12px">Son çalışmalarınız</h2><div class="card scroll-x"><table class="tbl"><thead><tr><th>Araç</th><th>Konu</th><th>Tarih</th><th></th></tr></thead><tbody>`;
  if (c.err) {
    const hist = store.get("hist", []);
    return hist.length ? `${bas}${hist.map(h => `<tr><td>${MOD[h.k] ? esc(MOD[h.k].ad) : ""}</td><td>${esc(h.title)}</td><td>${esc(fmtDT(h.at))}</td><td style="text-align:right">${safeUrl(h.url) ? `<a class="btn btn-g btn-s" href="${esc(safeUrl(h.url))}" target="_blank" rel="noopener">Aç ↗</a>` : ""}</td></tr>`).join("")}</tbody></table></div>` : "";
  }
  return c.list.length ? `${bas}${c.list.slice(0, 12).map(x => `<tr><td>${MOD[x.modul] ? esc(MOD[x.modul].ad) : ""}</td><td>${esc(x.baslik || "Çalışma")}</td><td>${esc(fmtDT(x.olusturma))}</td><td style="text-align:right"><button type="button" class="btn btn-g btn-s" data-gecmis-ac="${esc(x.id)}" data-gecmis-mod="${esc(x.modul)}">Aç</button></td></tr>`).join("")}</tbody></table></div>` : "";
}
async function panelGecmis() {
  const box = document.getElementById("son-gecmis");
  if (!box) return;
  const c = await gecmisListe("*");
  if (route !== "panel" || GECMIS["*"] !== c || document.getElementById("son-gecmis") !== box) return;
  box.innerHTML = panelGecmisHtml(c);
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
      gecmisKaydet(k, j, r);
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
    const { kota, ...veri } = res;
    gecmisKaydet(k, job, veri);
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
// Ekip daveti: e-postadaki /app/#/davet/<jeton> bağlantısı. Jeton adres çubuğunda kalmasın diye hemen
// yerel depoya alınır, adres #/davet olur. Oturum yoksa kayıt/giriş sonrası kabul ekranına dönülür.
const DAVET_RX = /^#\/davet\/([0-9a-f]{48})\/?$/;
function davetYakala() {
  const m = location.hash.match(DAVET_RX);
  if (!m) return;
  store.set("davet", { j: m[1], t: Date.now() });
  history.replaceState(null, "", location.pathname + location.search + "#/davet");
}
function davetBekleyen() {
  const d = store.get("davet", null);
  if (!d || typeof d !== "object" || !/^[0-9a-f]{48}$/.test(String(d.j || "")) || !(Date.now() - Number(d.t) < 14 * 864e5)) return "";
  return d.j;
}
const sonraki = () => (davetBekleyen() ? "davet" : "panel");
function render() {
  davetYakala();
  let n = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || "";
  if (S.recovery && S.session) n = "yeni-sifre";
  else if (!S.session) { if (n === "davet") n = davetBekleyen() ? "kayit" : "giris"; else if (!AUTH_ROUTES.has(n) || n === "yeni-sifre") n = n === "kayit" || n === "sifre" ? n : "giris"; }
  else if (AUTH_ROUTES.has(n) || !PAGES[n]) n = "panel";
  if (location.hash !== "#/" + n) history.replaceState(null, "", location.pathname + location.search + "#/" + n);
  const changed = route !== n;
  route = n;
  if (!AUTH_ROUTES.has(n) && !S.ben) return errorPage();
  if (n === "admin" && !S.ben.admin) return go("panel");
  PAGES[n]();
  if (changed) { window.scrollTo(0, 0); document.title = (TITLES[n] ? TITLES[n] + " · " : "") + "Sales Corner"; }
}
const TITLES = { giris: "Giriş", kayit: "Kayıt ol", sifre: "Şifre sıfırlama", "yeni-sifre": "Yeni şifre", panel: "Panel", rakip: "Rakip Analizi", sekans: "Sekans Yazarı", seo: "SEO Analizi", briefing: "Toplantı Briefingi", fireflies: "Toplantı Analizi", takip: "Rakip Takip", fiyatlar: "Fiyatlar", hesap: "Hesabım", admin: "Yönetim", ozel: "Size özel çözümler", davet: "Ekip daveti", klasor: "Ekip klasörü" };

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
const davetNot = t => (davetBekleyen() ? `<div class="trial-note">${ic("mail", 16)}<span>${t}</span></div>` : "");

function pageGiris() {
  authLayout(`<h2>Tekrar hoş geldiniz</h2><p class="sub">Hesabınıza giriş yapın.</p>${tabs("giris")}
  ${davetNot("Ekip davetiniz hazır. Davetin geldiği e-posta adresiyle giriş yapın; hesabınız yoksa “Ücretsiz dene” ile kayıt olun.")}
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
    go(sonraki());
  };
}
async function resend(email) {
  const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectTo() } });
  setMsg("m", error ? "err" : "ok", esc(error ? trErr(error) : "Doğrulama e-postası tekrar gönderildi. Gelen kutunuzu (ve spam klasörünü) kontrol edin."));
}
function denemeOzet() {
  const deneme = (S.planlar || PLAN_FALLBACK).find(p => p.kod === "deneme") || PLAN_FALLBACK[0];
  const q = deneme.kota || {};
  const acik = MODS.filter(m => q[m.k]).map(m => m.k === "takip" ? `${q[m.k]} firma için rakip takibi` : `${q[m.k]} ${kucuk(m.ad)}`);
  return `Denemede: ${acik.join(", ")}.${q.rakip ? "" : " Rakip Analizi deneme planında yok; Başlangıç ve üstü planlarda."}`;
}
async function pageKayit() {
  authLayout(`<h2>14 gün ücretsiz deneyin</h2><p class="sub">Kredi kartı gerekmez. Dakikalar içinde ilk analizinizi alın.</p>${tabs("kayit")}
  ${davetNot("Ekip davetiniz hazır. Davetin geldiği e-posta adresiyle kayıt olun; hesabınız varsa “Giriş yap” sekmesinden girin.")}
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
      return go(sonraki());
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
    go(sonraki());
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
      ${nav("klasor", klasorAd())}
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
      <div class="plan-box"><b>${esc(b.plan_ad || b.plan)}</b><span>${b.ekip_uye ? `${esc(ekipAd(b.ekip_uye))} ekibi` : !b.aktif ? "Süre doldu" : b.plan === "deneme" ? `Denemede ${kalan} gün kaldı` : `Geçerlilik: ${fmtD(b.bitis)}`}</span>
        ${b.plan !== "ozel" && !b.ekip_uye ? `<a class="btn btn-p btn-s btn-w" href="#/fiyatlar">${b.plan === "deneme" || !b.aktif ? "Plan seç" : "Planı yükselt"}</a>` : ""}</div>
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
  else if (b.plan === "deneme") banner = `<div class="banner trial"><div><b>Ücretsiz denemenizin bitmesine ${kalan} gün kaldı.</b><br><span>Rakip Analizi deneme planında yok; Başlangıç ve üstü planlarda açılır. Devam etmek istediğinizde size uygun planı seçin.</span></div><a class="btn btn-g" href="#/fiyatlar">Planları gör</a></div>`;
  const run = MODS.filter(m => JOBS[m.k]?.state === "run");
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
  <div id="son-gecmis">${panelGecmisHtml(GECMIS["*"])}</div>`);
  panelGecmis();
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
  <div class="tool"><div class="card pad">${form}${quota(k)}</div><section class="card out" id="out" aria-live="polite"></section></div>
  ${gecmisKutu(k)}`);
  renderJob(k);
  gecmisYukle(k);
  const f = document.getElementById("f");
  if (f && !durum(k).ok) f.querySelectorAll("[type=submit]").forEach(b => (b.disabled = true));
  if (f && JOBS[k]?.state === "run") f.querySelectorAll("[type=submit]").forEach(b => { b.disabled = true; b.textContent = "Hazırlanıyor…"; });
}
const EMPTY = {
  rakip: ["", "Rakip analiziniz burada görünecek", "Firmanızı ve 1–5 rakibi girin. Yapay zekâ siteleri tarar; konumlandırma, fiyat, mesaj ve fırsatları karşılaştıran bir Google Slides sunumu hazırlar."],
  sekans: ["", "Sekansınız burada görünecek", "Firmanızın sitesini ya da elinizdeki dokümanı verin; cold call senaryosu ve çok adımlı LinkedIn mesajları hazırlansın."],
  seo: ["", "SEO raporunuz burada görünecek", "Bir sayfa adresi girin; SEO puanı, eksikler, anahtar kelime hacimleri ve yayına hazır içerik önerisi çıkarılsın."],
  briefing: ["", "Briefingeniz burada görünecek", "Görüşeceğiniz firma ve kişiyi girin; toplantıdan önce okuyacağınız araştırma ve fırsat puanı hazırlansın."],
  fireflies: ["", "Toplantı analizi burada görünecek", "Soldan bir toplantı seçip analiz edin: puan, itirazlar, BANT ve takip e-postası."],
};
function renderJob(k) {
  const out = document.getElementById("out");
  if (!out) return;
  if (k === "briefing" && BRF_SEKME === "toplu") return tbCiz();
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
  if (j.gecmis) (out.querySelector(".res-h .row") || out.querySelector(".res-h"))?.insertAdjacentHTML("beforeend", `<span class="pill" title="Geçmişten açıldı">Geçmiş · ${esc(fmtDT(j.t0))}</span>`);
  out.querySelector(".res-h")?.insertAdjacentHTML("beforeend", again);
  out.querySelector(".res-b")?.insertAdjacentHTML("beforeend", paySec(k) + klasorSec(k));
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
    <div class="res-b"><div class="sec">${kv([["Analiz", j.title], ["Öne çıkan rakip", r.rakip_adi], ["Süre", r.elapsed_seconds ? mmss(r.elapsed_seconds) : j.gecmis ? "" : mmss((Date.now() - j.t0) / 1000)]])}</div>
    <div class="sec"><h4>Sunum</h4><div class="row" style="justify-content:flex-start">${linkBtn(r.slides_view_url, "Sunumu aç", "btn-p")}${linkBtn(r.slides_pdf_url, "PDF indir")}${linkBtn(r.slides_url, "Google Slides'ta düzenle")}</div></div>
    <p style="color:var(--mute);font-size:13.5px">Sunum Google Slides'ta oluşturuldu; düzenleyip müşterinizle paylaşabilirsiniz.</p></div>`;
  },
  sekans: j => {
    const r = j.res || {}, pub = safeUrl(r.publicUrl);
    return `${resHead("Sekans hazır", r.company ? `<span class="pill acc">${esc(r.company)}</span>` : "")}
    <div class="res-b"><div class="sec"><h4>Sekans dokümanı</h4><div class="row" style="justify-content:flex-start">${linkBtn(r.presentationViewUrl || r.presentationUrl, "Sekansı aç", "btn-p")}${linkBtn(r.presentationUrl, "Düzenle")}${pub ? `<button class="btn btn-g btn-s" data-copy="${esc(pub)}">Paylaşım linkini kopyala</button>` : ""}</div></div>
    <p style="color:var(--mute);font-size:13.5px">Dokümanda cold call senaryosu, itiraz karşılama cümleleri ve LinkedIn mesaj adımları yer alır.</p>${skExportHtml(r)}</div>`;
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

// ---------- Paylaşım linki (/r/<id>) ----------
// Çıktı yalnız kullanıcı "Paylaşım linki oluştur"a basınca kaydedilir; içerik sade markdown olarak saklanır,
// e-postalar sunucuda maskelenir. Paylaşım kullanım hakkından düşmez (araç çağrısı yok, yalnız app_cikti_paylas).
const PAY_URL = id => `${SITE}/r/${encodeURIComponent(id)}`;
const mdT = s => String(s ?? "").replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
const mdLine = s => String(s ?? "").replace(/\s+/g, " ").trim();
const mdLink = (u, t) => { const x = safeUrl(u); return x && x.startsWith("https://") && x.length <= 2000 ? `[${mdLine(t).replace(/[\[\]]/g, "")}](${x.replace(/\(/g, "%28").replace(/\)/g, "%29")})` : ""; };
const mdList = arr => (Array.isArray(arr) ? arr.map(x => mdLine(asText(x))).filter(Boolean).map(x => "- " + x).join("\n") : "");
const mdKv = rows => rows.filter(r => r[1] !== undefined && r[1] !== null && mdLine(r[1]) !== "").map(([a, v]) => `- **${a}:** ${mdLine(v)}`).join("\n");
const mdSec = (h, body) => (mdT(body) ? `## ${h}\n\n${mdT(body)}` : "");
const mdJoin = (...p) => p.map(mdT).filter(Boolean).join("\n\n");
const mdSkor = (v, ek = "") => (v !== "" && v != null && Number.isFinite(Number(v)) ? `${Number(v)}/100${ek}` : "");
const PAY_MD = {
  rakip: j => {
    const r = j.res || {};
    return { b: `Rakip analizi — ${j.title || r.rakip_adi || ""}`, m: mdJoin(
      mdKv([["Analiz", j.title], ["Öne çıkan rakip", r.rakip_adi], ["Slayt", r.slideCount]]),
      mdSec("Sunum", [mdLink(r.slides_view_url, "Sunumu aç"), mdLink(r.slides_pdf_url, "PDF indir")].filter(Boolean).map(x => "- " + x).join("\n"))) };
  },
  sekans: j => {
    const r = j.res || {}, rep = skData(r);
    const steps = rep ? skSteps(rep) : [];
    // Gönderen yer tutucusu ([Adınız]) olduğu gibi kalır: paylaşılan sayfada hazırlayanın adı yer almaz
    const ctx = rep ? { firma: skCtx(r, rep).firma, yazar: "" } : {};
    const link = String(r.presentationViewUrl || r.presentationUrl || "");
    return { b: `Satış sekansı${r.company ? " — " + r.company : ""}`, m: mdJoin(
      mdKv([["Firma", r.company], ["Adım", steps.length || ""]]),
      ...steps.map((s, i) => `### ${i + 1}. ${mdLine(skHead(s))} (${SK_KANAL[s.kanal] || "Adım"})\n\n${mdJoin(s.konu ? `**Konu:** ${mdLine(skPh(s.konu, "insan", ctx))}` : "", s.amac ? `**Amaç:** ${mdLine(s.amac)}` : "", skPh(s.metin, "insan", ctx))}`),
      !steps.length && !/\/api\/rapor/.test(link) ? mdLink(link, "Sekans dokümanını aç") : "") };
  },
  seo: j => {
    const r = seoTemiz((j.res && j.res.sonuc) || {}) || {}, sc = r.seo_score || {}, pi = r.page_info || {}, g = r.generated_content || {}, c = g.content || {};
    const kw = seoKw(r.keywords);
    let host = ""; try { host = new URL(r.url).hostname; } catch {}
    return { b: `SEO raporu${host ? " — " + host : ""}`, m: mdJoin(
      mdKv([["Adres", r.url], ["SEO puanı", mdSkor(sc.total, sc.level ? " · " + sc.level : "")]]),
      mdSec("Sayfa", mdKv([["Başlık", pi.title || "Başlık yok"], ["Meta açıklama", pi.meta_description || "Meta açıklama yok"], ["H1", pi.h1]])),
      mdSec("Düzeltilmesi gerekenler", mdList(r.issues)),
      mdSec("Anahtar kelimeler", kw.map(t => { const ek = [["hacim", t.volume], ["rekabet", t.competition], ["niyet", t.intent]].filter(x => x[1] != null && mdLine(asText(x[1]))).map(([a, v]) => a + " " + mdLine(asText(v))).join(", "); return `- **${mdLine(asText(t.keyword))}**${ek ? " — " + ek : ""}`; }).join("\n")),
      mdSec("Hazır içerik önerisi", mdKv([["SEO başlığı", g.seo_title], ["Meta açıklama", g.meta_description], ["URL", g.slug ? "/" + String(g.slug).replace(/^\//, "") : ""]])),
      c.intro || (Array.isArray(c.sections) && c.sections.length) ? mdSec("Makale taslağı", mdJoin(c.intro, ...(Array.isArray(c.sections) ? c.sections : []).filter(s => s && (s.h2 || s.content)).map(s => mdJoin(s.h2 ? `### ${mdLine(s.h2)}` : "", mdT(s.content))),
        Array.isArray(c.faq) && c.faq.some(q => q && q.question) ? `### Sık sorulan sorular\n\n${c.faq.filter(q => q && q.question).map(q => mdJoin(`**${mdLine(q.question)}**`, mdT(q.answer))).join("\n\n")}` : "", c.conclusion)) : "") };
  },
  briefing: j => {
    const r = (j.res && j.res.sonuc) || {};
    return { b: `Toplantı briefingi — ${r.firma_adi || r.company || j.title || ""}`, m: mdJoin(
      mdKv([["Firma", r.firma_adi || r.company], ["Kişi", r.kisi_adi || r.person], ["Toplantı", r.toplanti_tarihi], ["En uygun hizmet", r.en_uygun_hizmet], ["Firma skoru", r.f_skor], ["Kişi skoru", r.k_skor], ["Fırsat", r.deal_pct_label]]),
      mdSec("Briefing sunumu", mdLink(r.presentationViewUrl, "Briefingi aç")), r.message) };
  },
  fireflies: j => {
    const a = (j.res && j.res.analiz) || {}, meta = (j.res && j.res.meta) || {}, bant = a.bant || {};
    return { b: `Toplantı analizi — ${meta.title || j.title || ""}`, m: mdJoin(
      mdKv([["Toplantı", meta.title || j.title], ["Tarih", meta.date ? fmtDT(meta.date) : ""], ["Süre", meta.duration ? Math.round(meta.duration) + " dk" : ""], ["Satış aşaması", a.asama], ["Puan", mdSkor(a.skor)]]),
      mdSec("Özet", mdJoin(a.ozet, a.skor_gerekce)),
      mdSec("Konuşma oranı", (Array.isArray(meta.oranlar) ? meta.oranlar : []).map(o => `- ${mdLine(o && o.ad)}: %${Math.round(Number(o && o.pay) || 0)}`).join("\n")),
      mdSec("Güçlü yönler", mdList(a.guclu)), mdSec("Gelişim alanları", mdList(a.gelisim)),
      mdSec("İtirazlar", (Array.isArray(a.itirazlar) ? a.itirazlar : []).map(i => mdJoin(`**“${mdLine(i && i.itiraz)}”**`, i && i.nasil_yanitlandi ? `Verilen yanıt: ${mdLine(i.nasil_yanitlandi)}` : "", i && i.oneri ? `**Öneri:** ${mdLine(i.oneri)}` : "")).join("\n\n")),
      mdSec("BANT", mdKv([["Bütçe", bant.butce], ["Yetki", bant.yetki], ["İhtiyaç", bant.ihtiyac], ["Zamanlama", bant.zamanlama]])),
      mdSec("Sonraki adımlar", (Array.isArray(a.sonraki_adimlar) ? a.sonraki_adimlar : []).map(s => `- ${mdLine(asText(s && (s.adim || s)))}${s && s.sorumlu ? " — " + mdLine(s.sorumlu) : ""}${s && s.tarih ? " (" + mdLine(s.tarih) + ")" : ""}`).join("\n")),
      mdSec("Riskler", mdList(a.riskler)),
      mdSec("Takip e-postası taslağı", a.takip_epostasi)) };
  },
};
function paySec(k) {
  const j = JOBS[k];
  if (!j || j.state !== "done" || !PAY_MD[k]) return "";
  if (j.pay && j.payU === S.session?.user?.id) {
    const u = PAY_URL(j.pay);
    return `<div class="sec" id="pay-sec"><h4>Paylaşım linki</h4>
      <input class="in" readonly value="${esc(u)}" aria-label="Paylaşım linki" data-pay-in style="margin-bottom:10px">
      <div class="row" style="justify-content:flex-start"><button class="btn btn-p btn-s" type="button" data-copy="${esc(u)}">Kopyala</button>${linkBtn(u, "Aç")}</div>
      <p style="color:var(--mute);font-size:13.5px;margin-top:8px">Bağlantıyı bilen herkes bu çıktıyı görebilir. Paylaşımı Hesabım › Paylaşılan çıktılar bölümünden kapatabilirsiniz.</p></div>`;
  }
  return `<div class="sec" id="pay-sec"><h4>Paylaşım linki</h4>
    <p style="color:var(--mute);font-size:13.5px;margin-bottom:10px">Bu çıktının herkese açık, salt okunur bir sayfasını oluşturur. E-posta adresleri maskelenir; kullanım hakkınızdan düşmez.</p>
    <div id="pay-m"></div><button class="btn btn-g btn-s" type="button" data-paylas="${esc(k)}">Paylaşım linki oluştur</button></div>`;
}
function payErr(e) {
  const c = String((e && e.code) || ""), m = String((e && e.message) || "");
  if (c === "54000") return "Bugünkü paylaşım sınırına ulaştınız (günde 30 link). Yarın tekrar deneyin.";
  if (c === "22023") return "Çıktı boş ya da paylaşım için çok uzun.";
  if (c === "P0002") return "Bu paylaşım bulunamadı; liste yenilendi.";
  if (c === "28000" || /jwt|not authenticated|auth session missing/i.test(m)) return "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.";
  if (/failed to fetch|networkerror|load failed/i.test(m)) return "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.";
  return "Paylaşım şu an yapılamadı. Biraz sonra tekrar deneyin.";
}
async function paylas(k, btn) {
  const j = JOBS[k];
  if (!j || j.state !== "done" || !PAY_MD[k]) return;
  let o = null;
  try { o = PAY_MD[k](j); } catch {}
  const m = o ? mdT(o.m) : "";
  if (!m) return setMsg("pay-m", "err", "Bu çıktıda paylaşılacak içerik bulunamadı.");
  if (new TextEncoder().encode(m).length > 204800) return setMsg("pay-m", "err", "Çıktı paylaşım için çok uzun (en fazla 200 KB).");
  const uid = S.session?.user?.id;
  setMsg("pay-m", "", "");
  busy(btn, true, "Link oluşturuluyor…");
  try {
    const id = await rpc("app_cikti_paylas", { p_modul: k, p_baslik: mdLine(o.b).slice(0, 200) || MOD[k].ad, p_icerik: m });
    if (!/^[A-Za-z0-9_-]{22}$/.test(String(id))) throw new Error("gecersiz_yanit");
    if (JOBS[k] !== j || S.session?.user?.id !== uid) return;
    j.pay = id; j.payU = uid; saveJobs();
    PAY = { list: null, err: "", yuk: false };
    if (route === k) renderJob(k);
    toast("Paylaşım linki hazır ✓");
  } catch (e) {
    busy(btn, false);
    if (JOBS[k] === j && route === k) setMsg("pay-m", "err", esc(payErr(e)));
  }
}
// Hesabım › Paylaşılan çıktılar: yalnız bu bölüm yeniden çizilir (formlara yazılanlar silinmez)
let PAY = { list: null, err: "", yuk: false };
function payBolum() {
  if (PAY.list === null && !PAY.err && !PAY.yuk) payYukle();
  const acik = PAY.list ? PAY.list.filter(x => !x.paylasim_iptal).length : 0;
  let body;
  if (PAY.err) body = `${msg("err", esc(PAY.err))}<button class="btn btn-g btn-s" type="button" data-pay-yenile style="margin-top:12px">Tekrar dene</button>`;
  else if (!PAY.list) body = `<div class="empty" style="padding:18px"><div class="spin"></div></div>`;
  else if (!PAY.list.length) body = `<p style="color:var(--mute);font-size:14px">Henüz paylaştığınız bir çıktı yok. Araç sonuçlarındaki "Paylaşım linki oluştur" düğmesiyle bağlantı açabilirsiniz.</p>`;
  else body = `<div>${PAY.list.map(payRow).join("")}</div>`;
  return `<section class="card pad" id="pay-bolum"><div class="row" style="margin-bottom:6px"><h3>Paylaşılan çıktılar</h3>${PAY.list && PAY.list.length ? `<span class="pill ${acik ? "acc" : ""}">${acik} açık</span>` : ""}</div>
    <p style="color:var(--mute);font-size:14px;margin-bottom:14px">Kapattığınız bağlantı hemen geçersiz olur; açan kişi "Bu bağlantı artık geçerli değil" mesajını görür.</p>
    <div id="paym"></div>${body}</section>`;
}
function payRow(x) {
  const acik = !x.paylasim_iptal, u = PAY_URL(x.paylas_id);
  return `<div class="box"><div class="row" style="flex-wrap:nowrap;align-items:flex-start"><div style="min-width:0"><b style="overflow-wrap:anywhere">${esc(x.baslik)}</b>
    <div style="color:var(--mute);font-size:13px;margin-top:2px">${esc(MOD[x.modul]?.ad || x.modul)} · ${esc(fmtDT(x.olusturma))}</div></div><span class="pill ${acik ? "ok" : ""}">${acik ? "Açık" : "Kapalı"}</span></div>
    ${acik ? `<div class="row" style="justify-content:flex-start;margin-top:10px"><button class="btn btn-g btn-s" type="button" data-copy="${esc(u)}">Linki kopyala</button>${linkBtn(u, "Aç")}<button class="btn btn-d btn-s" type="button" data-pay-kapat="${esc(x.id)}">Paylaşımı kapat</button></div>` : ""}</div>`;
}
async function payYukle() {
  const o = PAY;
  o.yuk = true; o.err = "";
  try { const r = await rpc("app_cikti_listem"); o.list = Array.isArray(r) ? r : []; }
  catch (e) { o.list = null; const t = payErr(e); o.err = /^Paylaşım şu an/.test(t) || /^Bu paylaşım/.test(t) ? "Paylaşılan çıktılar yüklenemedi. Biraz sonra tekrar deneyin." : t; }
  o.yuk = false;
  if (o === PAY) payCiz();
}
function payCiz() { const el = document.getElementById("pay-bolum"); if (el) el.outerHTML = payBolum(); }
async function payKapat(id, btn) {
  const o = PAY;
  setMsg("paym", "", "");
  busy(btn, true, "Kapatılıyor…");
  try {
    await rpc("app_cikti_iptal", { p_id: id });
    if (o !== PAY) return;
    const x = (o.list || []).find(r => r.id === id);
    if (x) {
      x.paylasim_iptal = true;
      for (const k of Object.keys(JOBS)) if (JOBS[k] && JOBS[k].pay === x.paylas_id) { delete JOBS[k].pay; delete JOBS[k].payU; }
      saveJobs();
    }
    payCiz();
    toast("Paylaşım kapatıldı");
  } catch (e) {
    if (o !== PAY) return;
    if (String(e && e.code) === "P0002") { toast(payErr(e)); PAY = { list: null, err: "", yuk: false }; payCiz(); return; }
    busy(btn, false);
    setMsg("paym", "err", esc(payErr(e)));
  }
}

// ---------- Ekip ve ekip klasörü ----------
// Yeni RPC'ler doğrudan sb.rpc ile çağrılır: rpc() PGRST202'de bütün paneli "kurulum" ekranına alır
async function erpc(fn, args) {
  const { data, error } = await sb.rpc(fn, args || {});
  if (error) throw error;
  return data;
}
const ekipAd = o => (o && (o.sirket || o.ad || o.email)) || "Ekip";
const klasorEkip = () => Number(S.ben?.koltuk) > 1 || !!S.ben?.ekip_uye;
const klasorAd = () => (klasorEkip() ? "Ekip klasörü" : "Klasörüm");
const klasorA = () => (klasorEkip() ? "Ekip klasörüne" : "Klasörüme");
function ekErr(e, gen) {
  const c = String((e && e.code) || ""), m = String((e && e.message) || "");
  if (c === "54000") return "Bugünkü kayıt sınırına ulaştınız (günde 30; paylaşım linkleriyle ortak). Yarın tekrar deneyin.";
  if (c === "22023") return "Çıktı boş ya da kaydetmek için çok uzun.";
  if (c === "P0002") return "Bu kayıt bulunamadı; liste yenilendi.";
  if (c === "PGRST202" || /could not find the function/i.test(m)) return "Bu özellik şu an hazırlanıyor. Biraz sonra tekrar deneyin.";
  if (c === "28000" || /jwt|not authenticated|auth session missing/i.test(m)) return "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.";
  if (/failed to fetch|networkerror|load failed/i.test(m)) return "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.";
  return gen || "İşlem şu an yapılamadı. Biraz sonra tekrar deneyin.";
}

// --- Davet kabul ekranı (#/davet) ---
const DAVET_NEDEN = {
  gecersiz: ["err", "Bu davet geçersiz ya da süresi dolmuş. Ekip sahibinden yeni bir davet isteyin.", true],
  kendi: ["err", "Bu davet sizin ekibinize ait; kendi davetinizi kabul edemezsiniz.", true],
  onay: ["warn", "Daveti kabul etmeden önce e-posta adresinizi doğrulayın. Gelen kutunuzdaki doğrulama bağlantısına tıklayıp tekrar deneyin.", false],
  eposta: ["warn", "Bu davet başka bir e-posta adresine gönderilmiş. Davetin geldiği e-posta adresiyle giriş yapın.", false],
  baska_ekip: ["err", "Zaten başka bir ekiptesiniz. Bu daveti kabul etmek için önce Hesabım › Ekip bölümünden mevcut ekipten ayrılın.", true],
  sahip: ["err", "Kendi ekibinizde kullanıcılar var; başka bir ekibe katılamazsınız.", true],
  sahip_plan: ["err", "Ekip sahibinin planı şu an etkin değil. Ekip sahibiyle iletişime geçin.", true],
  koltuk: ["err", "Bu ekip dolu. Ekip sahibinin yer açması gerekiyor.", true],
};
let DAVET = { sonuc: null };
function pageDavet() {
  const j = davetBekleyen(), b = S.ben, r = DAVET.sonuc;
  let body;
  if (r && r.ok) {
    body = `${msg("ok", `<b>${esc(ekipAd(r.sahip))}</b> ekibine katıldınız. Araçlardaki kullanımınız ekip planından düşer; ekip klasörünü birlikte kullanırsınız.`)}
      <div class="row" style="justify-content:flex-start;margin-top:14px"><a class="btn btn-p" href="#/panel">Panele git</a><a class="btn btn-g" href="#/klasor">Ekip klasörünü aç</a></div>`;
  } else if (!j) {
    body = `${msg("info", "Bekleyen bir ekip davetiniz yok. Davet bağlantısını e-postanızdan yeniden açabilirsiniz.")}
      <div class="row" style="justify-content:flex-start;margin-top:14px"><a class="btn btn-g" href="#/panel">Panele git</a></div>`;
  } else {
    body = `<p style="margin-bottom:10px">Sales Corner'da bir ekibe davet edildiniz. Daveti <b>${esc(b.email)}</b> hesabıyla kabul ediyorsunuz.</p>
      <ul style="margin:0 0 16px;padding-left:18px;color:var(--mute);font-size:14px;display:grid;gap:4px">
        <li>Araçları kullandığınızda kullanım ekip sahibinin plan hakkından düşer.</li>
        <li>Ekip klasörüne kaydettiğiniz çıktıları ekipteki herkes görür.</li>
        <li>İstediğiniz zaman Hesabım › Ekip bölümünden ayrılabilirsiniz.</li></ul>
      <div id="dvm"></div>
      <div class="row" style="justify-content:flex-start"><button class="btn btn-p" type="button" data-davet-kabul>Daveti kabul et</button><button class="btn btn-g" type="button" data-davet-red>Vazgeç</button></div>`;
  }
  shell(`${ph("Ekip daveti", "Ekip arkadaşlarınızla aynı planı ve klasörü kullanın.")}<section class="card pad" style="max-width:640px">${body}</section>`);
}
async function davetKabul(btn) {
  const j = davetBekleyen();
  if (!j) return render();
  setMsg("dvm", "", "");
  busy(btn, true, "Katılıyorsunuz…");
  let r;
  try { r = await erpc("app_ekip_kabul", { p_jeton: j }); }
  catch (e) { busy(btn, false); return setMsg("dvm", "err", esc(ekErr(e, "Davet şu an kabul edilemedi. Biraz sonra tekrar deneyin."))); }
  if (r && r.ok) {
    store.set("davet", null);
    DAVET = { sonuc: r };
    EKIP = ekipBos(); KLASOR = klasorBos();
    await loadBen();
    if (!S.ben) return render();
    toast(r.zaten ? "Zaten bu ekiptesiniz ✓" : "Ekibe katıldınız ✓");
    if (route === "davet") pageDavet(); else go("davet");
    return;
  }
  const n = DAVET_NEDEN[r && r.neden] || ["err", "Davet şu an kabul edilemedi. Biraz sonra tekrar deneyin.", false];
  busy(btn, false);
  if (n[2]) store.set("davet", null);
  setMsg("dvm", n[0], esc(n[1]) + (n[2] ? "" : `<div class="row" style="justify-content:flex-start;margin-top:10px"><button class="btn btn-g btn-s" type="button" data-logout>Başka hesapla giriş yap</button></div>`));
  if (n[2] && btn) btn.remove();
}

// --- Ekip klasörü (#/klasor) ---
const klasorBos = () => ({ v: null, err: "", yuk: false, acik: "", ic: {}, icErr: "", sil: "" });
let KLASOR = klasorBos();
function pageKlasor() {
  const ekip = klasorEkip();
  shell(`${ph(esc(klasorAd()), ekip ? "Ekipteki herkesin kaydettiği çıktılar burada toplanır." : "Kaydettiğiniz çıktılar burada saklanır. Profesyonel planda ekip arkadaşlarınızla paylaşılır.")}<div id="klasor-ic" style="max-width:820px">${klasorIc()}</div>`);
}
function klasorIc() {
  const o = KLASOR;
  if (o.v === null && !o.err && !o.yuk) klasorYukle();
  if (o.err) return `${msg("err", esc(o.err))}<button class="btn btn-g btn-s" type="button" data-klasor-yenile style="margin-top:12px">Tekrar dene</button>`;
  if (!o.v) return `<div class="empty" style="padding:28px"><div class="spin"></div></div>`;
  const ls = Array.isArray(o.v.liste) ? o.v.liste : [];
  if (!ls.length) return `<div class="card pad"><div class="empty" style="padding:18px 8px">${ic("file", 28)}<p style="margin-top:10px">Klasör henüz boş.</p><p style="color:var(--mute);font-size:14px">Bir aracı çalıştırdıktan sonra sonucun altındaki <b>"${esc(klasorA())} kaydet"</b> düğmesiyle çıktıyı buraya ekleyebilirsiniz.</p></div></div>`;
  return `<div id="klm"></div><div class="card pad">${ls.map(klasorRow).join("")}</div>`;
}
// data-* öznitelikleri metin döner; RPC kimlikleri sayı. Karşılaştırma String ile, gönderim sayı ile.
const ekNum = v => (/^\d+$/.test(String(v)) ? Number(v) : v);
function klasorRow(x) {
  const o = KLASOR, acik = o.acik !== "" && String(o.acik) === String(x.id), id = esc(x.id);
  const kim = o.v && o.v.ekip ? ` · ${x.ben ? "Siz" : esc(x.kaydeden || "")}` : "";
  let icerik = "";
  if (acik) {
    const t = o.ic[x.id];
    icerik = o.icErr ? `<div style="margin-top:10px">${msg("err", esc(o.icErr))}</div>`
      : t === undefined ? `<div class="empty" style="padding:14px"><div class="spin"></div></div>`
      : `<div class="box" id="kic-${id}" style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;margin-top:10px;max-height:520px;overflow:auto">${esc(t)}</div>
        <div class="row" style="justify-content:flex-start;margin-top:8px"><button class="btn btn-g btn-s" type="button" data-copy-el="kic-${id}">Metni kopyala</button></div>`;
  }
  const sil = o.sil !== "" && String(o.sil) === String(x.id)
    ? `<span style="font-size:14px;font-weight:600">Silinsin mi?</span><button class="btn btn-d btn-s" type="button" data-klasor-sil="${id}">Evet, sil</button><button class="btn btn-g btn-s" type="button" data-klasor-vazgec>Vazgeç</button>`
    : x.silinebilir ? `<button class="btn btn-g btn-s" type="button" data-klasor-sor="${id}">Sil</button>` : "";
  return `<div class="box" style="margin-bottom:10px"><div style="min-width:0"><b style="overflow-wrap:anywhere">${esc(x.baslik)}</b>
    <div style="color:var(--mute);font-size:13px;margin-top:2px">${esc(MOD[x.modul]?.ad || x.modul)} · ${esc(fmtDT(x.olusturma))}${kim}</div></div>
    <div class="row" style="justify-content:flex-start;margin-top:10px"><button class="btn btn-g btn-s" type="button" data-klasor-ac="${id}" aria-expanded="${acik}">${acik ? "Kapat" : "Aç"}</button>${sil}</div>${icerik}</div>`;
}
async function klasorYukle() {
  const o = KLASOR;
  o.yuk = true; o.err = "";
  try { const r = await erpc("app_klasor_liste"); o.v = r && typeof r === "object" ? r : { liste: [] }; }
  catch (e) { o.v = null; o.err = ekErr(e, "Klasör yüklenemedi. Biraz sonra tekrar deneyin."); }
  o.yuk = false;
  if (o === KLASOR) klasorCiz();
}
function klasorCiz() { const el = document.getElementById("klasor-ic"); if (el && route === "klasor") el.innerHTML = klasorIc(); }
async function klasorAc(id) {
  id = String(id);
  const o = KLASOR;
  o.sil = "";
  if (o.acik === id) { o.acik = ""; return klasorCiz(); }
  o.acik = id; o.icErr = "";
  klasorCiz();
  if (o.ic[id] !== undefined) return;
  try {
    const r = await erpc("app_klasor_getir", { p_id: ekNum(id) });
    if (o !== KLASOR) return;
    o.ic[id] = String((r && r.icerik) || "");
  } catch (e) {
    if (o !== KLASOR) return;
    if (String(e && e.code) === "P0002") { toast(ekErr(e)); KLASOR = klasorBos(); return klasorCiz(); }
    if (o.acik === id) o.icErr = ekErr(e, "Çıktı açılamadı. Biraz sonra tekrar deneyin.");
  }
  klasorCiz();
}
async function klasorSil(id, btn) {
  id = String(id);
  const o = KLASOR;
  busy(btn, true, "Siliniyor…");
  try {
    await erpc("app_klasor_sil", { p_id: ekNum(id) });
    if (o !== KLASOR) return;
    if (o.v && Array.isArray(o.v.liste)) o.v.liste = o.v.liste.filter(x => String(x.id) !== id);
    delete o.ic[id]; o.sil = ""; if (o.acik === id) o.acik = "";
    for (const k of Object.keys(JOBS)) if (JOBS[k] && String(JOBS[k].klasor) === id) { delete JOBS[k].klasor; delete JOBS[k].klasorU; }
    saveJobs();
    klasorCiz();
    toast("Silindi");
  } catch (e) {
    if (o !== KLASOR) return;
    if (String(e && e.code) === "P0002") { toast(ekErr(e)); KLASOR = klasorBos(); return klasorCiz(); }
    busy(btn, false);
    setMsg("klm", "err", esc(ekErr(e, "Silinemedi. Biraz sonra tekrar deneyin.")));
  }
}
// Araç sonucunun altındaki "Ekip klasörüne kaydet" bölümü
function klasorSec(k) {
  const j = JOBS[k];
  if (!j || j.state !== "done" || !PAY_MD[k]) return "";
  const ad = klasorAd(), ekip = klasorEkip();
  if (j.klasor && j.klasorU === S.session?.user?.id)
    return `<div class="sec" id="klasor-sec"><h4>${esc(ad)}</h4><p style="display:flex;align-items:center;gap:6px;font-size:14px">${ic("check", 16)}Bu çıktı ${ekip ? "ekip klasörüne" : "klasörünüze"} kaydedildi.</p>
      <div class="row" style="justify-content:flex-start;margin-top:10px"><a class="btn btn-g btn-s" href="#/klasor">Klasörü aç</a></div></div>`;
  return `<div class="sec" id="klasor-sec"><h4>${esc(ad)}</h4>
    <p style="color:var(--mute);font-size:13.5px;margin-bottom:10px">${ekip ? "Çıktının bir kopyasını ekip klasörüne ekler; ekipteki herkes görür." : "Çıktının bir kopyasını klasörünüze ekler; menüdeki Klasörüm sayfasından açabilirsiniz."} Kullanım hakkınızdan düşmez.</p>
    <div id="klasor-m"></div><button class="btn btn-g btn-s" type="button" data-klasor="${esc(k)}">${esc(klasorA())} kaydet</button></div>`;
}
async function klasorKaydet(k, btn) {
  const j = JOBS[k];
  if (!j || j.state !== "done" || !PAY_MD[k]) return;
  let o = null;
  try { o = PAY_MD[k](j); } catch {}
  const m = o ? mdT(o.m) : "";
  if (!m) return setMsg("klasor-m", "err", "Bu çıktıda kaydedilecek içerik bulunamadı.");
  if (new TextEncoder().encode(m).length > 204800) return setMsg("klasor-m", "err", "Çıktı kaydetmek için çok uzun (en fazla 200 KB).");
  const uid = S.session?.user?.id;
  setMsg("klasor-m", "", "");
  busy(btn, true, "Kaydediliyor…");
  try {
    const r = await erpc("app_klasor_kaydet", { p_modul: k, p_baslik: mdLine(o.b).slice(0, 200) || MOD[k].ad, p_icerik: m });
    if (!r || !r.ok || !r.id) throw new Error("gecersiz_yanit");
    if (JOBS[k] !== j || S.session?.user?.id !== uid) return;
    j.klasor = r.id; j.klasorU = uid; saveJobs();
    KLASOR = klasorBos();
    if (route === k) renderJob(k);
    toast("Klasöre kaydedildi ✓");
  } catch (e) {
    busy(btn, false);
    if (JOBS[k] === j && route === k) setMsg("klasor-m", "err", esc(ekErr(e, "Kaydedilemedi. Biraz sonra tekrar deneyin.")));
  }
}

// --- Hesabım › Ekip ---
const ekipBos = () => ({ v: null, err: "", yuk: false, sor: "", ayril: false, not: null });
let EKIP = ekipBos();
function ekipBolum() {
  const o = EKIP;
  if (o.v === null && !o.err && !o.yuk) ekipYukle();
  let body, pill = "";
  const not = o.not ? msg(o.not[0], esc(o.not[1])) : "";
  if (o.err) body = `${msg("err", esc(o.err))}<button class="btn btn-g btn-s" type="button" data-ekip-yenile style="margin-top:12px">Tekrar dene</button>`;
  else if (!o.v) body = `<div class="empty" style="padding:18px"><div class="spin"></div></div>`;
  else if (o.v.uye) {
    const u = o.v.uye;
    body = `<p><b>${esc(ekipAd(u))}</b> ekibindesiniz${u.sirket || u.ad ? ` <span style="color:var(--mute)">(${esc(u.email)})</span>` : ""}. Araçlardaki kullanımınız ekip planından düşer; ekip klasörünü birlikte kullanırsınız.</p>
      ${u.etkin ? "" : `<div style="margin-top:10px">${msg("warn", "Ekip sahibinin planı şu an etkin değil; bu sürede kendi planınız geçerli.")}</div>`}
      <div class="row" style="justify-content:flex-start;margin-top:12px">${o.ayril
        ? `<span style="font-size:14px;font-weight:600">Ekipten ayrılınsın mı?</span><button class="btn btn-d btn-s" type="button" data-ekip-ayril>Evet, ayrıl</button><button class="btn btn-g btn-s" type="button" data-ekip-vazgec>Vazgeç</button>`
        : `<a class="btn btn-g btn-s" href="#/klasor">Ekip klasörü</a><button class="btn btn-g btn-s" type="button" data-ekip-ayril-sor>Ekipten ayrıl</button>`}</div>`;
    pill = `<span class="pill acc">Ekip üyesi</span>`;
  } else if (Number(o.v.koltuk) > 1) {
    const ls = Array.isArray(o.v.uyeler) ? o.v.uyeler : [], dolu = 1 + ls.length, k = Number(o.v.koltuk);
    pill = `<span class="pill ${dolu < k ? "acc" : "warn"}">${dolu}/${k} kullanıcı</span>`;
    const satir = x => {
      const akt = x.durum === "aktif";
      const sag = EKIP.sor !== "" && String(EKIP.sor) === String(x.id)
        ? `<span style="font-size:14px;font-weight:600">${akt ? "Ekipten çıkarılsın mı?" : "Davet iptal edilsin mi?"}</span><button class="btn btn-d btn-s" type="button" data-ekip-cikar="${esc(x.id)}">${akt ? "Evet, çıkar" : "Evet, iptal et"}</button><button class="btn btn-g btn-s" type="button" data-ekip-vazgec>Vazgeç</button>`
        : `<button class="btn btn-g btn-s" type="button" data-ekip-sor="${esc(x.id)}">${akt ? "Çıkar" : "Daveti iptal et"}</button>`;
      return `<div class="box" style="margin-bottom:8px"><div class="row" style="flex-wrap:nowrap;align-items:flex-start"><div style="min-width:0"><b style="overflow-wrap:anywhere">${esc(x.ad || x.email)}</b>
        <div style="color:var(--mute);font-size:13px;margin-top:2px;overflow-wrap:anywhere">${x.ad ? esc(x.email) + " · " : ""}${akt ? "Katıldı: " + esc(fmtD(x.kabul || x.olusturma)) : "Davet: " + esc(fmtD(x.olusturma)) + " · 14 gün geçerli"}</div></div>
        <span class="pill ${akt ? "ok" : "warn"}">${akt ? "Aktif" : "Bekliyor"}</span></div>
        <div class="row" style="justify-content:flex-start;margin-top:10px">${sag}</div></div>`;
    };
    const form = o.v.davet_edebilir && dolu < k
      ? `<form id="ekip-f" data-sk-noform style="margin-top:14px"><div class="f"><label for="ekip-em">Ekip arkadaşınızın e-postası</label><input class="in" id="ekip-em" type="email" maxlength="254" autocomplete="off" required></div>
          <button class="btn btn-p btn-s" type="submit">Davet gönder</button></form>`
      : !o.v.aktif ? `<div style="margin-top:12px">${msg("warn", "Planınızın süresi dolduğu için ekip şu an pasif. Planı yenilediğinizde ekip arkadaşlarınız yeniden kullanabilir.")}</div>`
      : dolu >= k ? `<p style="color:var(--mute);font-size:14px;margin-top:12px">${o.v.kisi_basi ? "Tüm kullanıcılarınız dolu. Yeni kullanıcı için ek Profesyonel kullanıcı ekleyin ya da Ekip planına geçin (5 kullanıcı dahil)." : "Ekip dolu. Yeni biri için bir kullanıcıyı çıkarın ya da bekleyen bir daveti iptal edin."}</p>${o.v.kisi_basi ? `<a class="btn btn-g btn-s" href="#/fiyatlar" style="margin-top:10px">Planları gör</a>` : ""}` : "";
    body = `<p style="color:var(--mute);font-size:14px;margin-bottom:12px">${esc(o.v.plan_ad || "Planınız")} ile toplam ${k} kullanıcı (siz + ${k - 1} davet). Ekip arkadaşlarınızın kullanımı planınızın aylık hakkından düşer.</p>
      <div class="box" style="margin-bottom:8px"><div class="row" style="flex-wrap:nowrap"><div style="min-width:0"><b>Siz</b><div style="color:var(--mute);font-size:13px;margin-top:2px;overflow-wrap:anywhere">${esc(S.ben?.email || "")}</div></div><span class="pill acc">Ekip sahibi</span></div></div>
      ${ls.map(satir).join("")}${form}`;
  } else {
    body = `<p style="color:var(--mute);font-size:14px">${o.v.plan === "ozel" ? "Özel planınızda ekip kullanıcıları için bizimle iletişime geçin." : o.v.plan === "profesyonel" ? "Profesyonel planda fiyat kullanıcı başınadır. Ekip arkadaşı eklemek için ek Profesyonel kullanıcı ekleyin ya da Ekip planına geçin (5 kullanıcı dahil). Ekip arkadaşlarınız aynı plan hakkını ve ortak klasörü kullanır." : "Başlangıç ve Profesyonel planlarda fiyat kullanıcı başınadır. Ekip planında 5 kullanıcı dahildir. Ekip arkadaşlarınız aynı plan hakkını ve ortak klasörü kullanır."}</p>
      ${o.v.plan === "ozel" ? "" : `<a class="btn btn-g btn-s" href="#/fiyatlar" style="margin-top:12px">Planları gör</a>`}`;
  }
  return `<section class="card pad" id="ekip-bolum"><div class="row" style="margin-bottom:10px"><h3>Ekip</h3>${pill}</div><div id="ekm">${not}</div>${body}</section>`;
}
async function ekipYukle() {
  const o = EKIP;
  o.yuk = true; o.err = "";
  try { const r = await erpc("app_ekip_liste"); o.v = r && typeof r === "object" ? r : null; if (!o.v) throw new Error("gecersiz_yanit"); }
  catch (e) { o.v = null; o.err = ekErr(e, "Ekip bilgisi yüklenemedi. Biraz sonra tekrar deneyin."); }
  o.yuk = false;
  if (o === EKIP) ekipCiz();
}
function ekipCiz() {
  const el = document.getElementById("ekip-bolum");
  if (!el) return;
  const inp = document.getElementById("ekip-em"), yazi = inp ? inp.value : "", odak = document.activeElement === inp;
  el.outerHTML = ekipBolum();
  const yeni = document.getElementById("ekip-em");
  if (yeni && yazi) { yeni.value = yazi; if (odak) yeni.focus(); }
}
async function ekipCikar(id, btn) {
  const o = EKIP;
  busy(btn, true, "Lütfen bekleyin…");
  let r;
  try { r = await erpc("app_ekip_cikar", { p_id: ekNum(id) }); }
  catch (e) { if (o !== EKIP) return; busy(btn, false); return setMsg("ekm", "err", esc(ekErr(e))); }
  if (o !== EKIP) return;
  EKIP = ekipBos();
  EKIP.not = r && r.ok ? ["ok", "Güncellendi."] : ["info", "Bu kayıt zaten kaldırılmış; liste yenilendi."];
  KLASOR = klasorBos();
  ekipCiz();
}
async function ekipAyril(btn) {
  const o = EKIP;
  busy(btn, true, "Ayrılıyorsunuz…");
  let r;
  try { r = await erpc("app_ekip_ayril"); }
  catch (e) { if (o !== EKIP) return; busy(btn, false); return setMsg("ekm", "err", esc(ekErr(e))); }
  if (o !== EKIP) return;
  EKIP = ekipBos(); KLASOR = klasorBos();
  EKIP.not = r && r.ok ? ["ok", "Ekipten ayrıldınız. Artık kendi planınız geçerli."] : ["info", "Zaten bir ekipte değilsiniz."];
  const not = EKIP.not;
  await loadBen();
  if (!S.ben) return render();
  EKIP.not = not;
  if (route === "hesap") render();
}
const EPOSTA_RX = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
async function ekipDavet(f) {
  const inp = f.querySelector("#ekip-em"), btn = f.querySelector("[type=submit]");
  const email = String(inp.value || "").trim().toLowerCase();
  if (!EPOSTA_RX.test(email) || email.length > 254) return setMsg("ekm", "err", "Geçerli bir e-posta adresi girin.");
  if (email === String(S.ben?.email || "").toLowerCase()) return setMsg("ekm", "err", "Kendinizi davet edemezsiniz.");
  setMsg("ekm", "", "");
  busy(btn, true, "Davet gönderiliyor…");
  const o = EKIP;
  const r = await api("/api/app/ekip-davet", { email });
  if (o !== EKIP) return;
  if (!r.success) { busy(btn, false); return setMsg("ekm", "err", esc(r.message || "Davet gönderilemedi.")); }
  EKIP = ekipBos();
  EKIP.not = r.mail === "gonderildi" ? ["ok", `Davet ${email} adresine gönderildi. Bağlantı 14 gün geçerli.`]
    : ["warn", "Davet oluşturuldu ancak e-posta şu an gönderilemedi. Daveti iptal edip biraz sonra yeniden gönderin."];
  ekipCiz();
}
document.addEventListener("submit", e => {
  if (e.target && e.target.id === "ekip-f") { e.preventDefault(); ekipDavet(e.target); }
});
document.addEventListener("click", e => {
  const t = e.target.closest("[data-klasor],[data-klasor-ac],[data-klasor-sor],[data-klasor-sil],[data-klasor-vazgec],[data-klasor-yenile],[data-ekip-sor],[data-ekip-cikar],[data-ekip-vazgec],[data-ekip-ayril-sor],[data-ekip-ayril],[data-ekip-yenile],[data-davet-kabul],[data-davet-red]");
  if (!t) return;
  const d = t.dataset;
  if (d.klasor) klasorKaydet(d.klasor, t);
  else if (d.klasorAc) klasorAc(d.klasorAc);
  else if (d.klasorSor) { KLASOR.sil = d.klasorSor; klasorCiz(); }
  else if (d.klasorSil) klasorSil(d.klasorSil, t);
  else if (t.hasAttribute("data-klasor-vazgec")) { KLASOR.sil = ""; klasorCiz(); }
  else if (t.hasAttribute("data-klasor-yenile")) { KLASOR = klasorBos(); klasorCiz(); }
  else if (d.ekipSor) { EKIP.sor = d.ekipSor; EKIP.not = null; ekipCiz(); }
  else if (d.ekipCikar) ekipCikar(d.ekipCikar, t);
  else if (t.hasAttribute("data-ekip-vazgec")) { EKIP.sor = ""; EKIP.ayril = false; ekipCiz(); }
  else if (t.hasAttribute("data-ekip-ayril-sor")) { EKIP.ayril = true; EKIP.not = null; ekipCiz(); }
  else if (t.hasAttribute("data-ekip-ayril")) ekipAyril(t);
  else if (t.hasAttribute("data-ekip-yenile")) { EKIP = ekipBos(); ekipCiz(); }
  else if (t.hasAttribute("data-davet-kabul")) davetKabul(t);
  else if (t.hasAttribute("data-davet-red")) { store.set("davet", null); go("panel"); }
});

// ---------- Sekans ----------
function pageSekans() {
  const b = S.ben;
  let src = "website";
  toolShell("sekans", `<form id="f" data-sk-noform>
    <div class="f"><label for="cn">Firmanız</label><input class="in" id="cn" required maxlength="150" placeholder="Firmanızın adı"></div>
    <div class="f"><label>Kaynak</label><div class="tabs" role="tablist" style="margin:0"><button type="button" role="tab" aria-selected="true" data-src="website">Web sitesi</button><button type="button" role="tab" aria-selected="false" data-src="pdf">Metin / doküman</button></div></div>
    <div class="f" data-pane="website"><label for="dm">Firmanızın web sitesi</label><input class="in" id="dm" inputmode="url" placeholder="firmaniz.com"></div>
    <div class="f" data-pane="pdf" hidden><label for="tx">Doküman metni</label><textarea class="in" id="tx" maxlength="6000" placeholder="Sunum, teklif ya da PDF metnini buraya yapıştırın"></textarea><span class="hint"><span id="txn">0</span> / 6000 karakter</span></div>
    <div class="f"><label for="nt">Notlar <span class="hint">(isteğe bağlı)</span></label><textarea class="in" id="nt" maxlength="3000" placeholder="Ne satıyorsunuz, kime ulaşmak istiyorsunuz, ton tercihi…"></textarea><span class="hint"><a href="#/hesap">Firma profilinizdeki</a> bilgiler otomatik eklenir.</span></div>
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
    if (src === "website") { body.domain = normUrl(f.dm.value); if (!body.domain) return setMsg("m", "err", "Firmanızın web sitesini girin (ör. firmaniz.com)."); }
    else { body.pdf_text = f.tx.value.trim(); if (body.pdf_text.length < 80) return setMsg("m", "err", "Doküman metni çok kısa; en az birkaç paragraf yapıştırın."); }
    const btn = f.querySelector("[type=submit]");
    busy(btn, true, "Başlatılıyor…"); setMsg("m");
    const res = await startAsync("sekans", body, body.company_name);
    if (!res.success) { busy(btn, false); return setMsg("m", "err", esc(res.message) + (res.neden ? ` <a href="#/fiyatlar">Planlar →</a>` : "")); }
    render();
  };
}

// ---------- Sekans dışa aktarma (tamamı tarayıcıda; sunucuya istek yok, hak düşmez) ----------
// Sekans verisi rapor bağlantısının # kısmında taşınır: base64url(JSON {t, s, d, sl:[{b başlık, m maddeler, n metin}]})
function skData(r) {
  const u = String((r && (r.presentationUrl || r.presentationViewUrl || r.publicUrl)) || ""), i = u.indexOf("#");
  if (i < 0 || !/\/api\/rapor/.test(u.slice(0, i))) return null;
  try {
    const bin = atob(u.slice(i + 1).replace(/-/g, "+").replace(/_/g, "/"));
    const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    return o && Array.isArray(o.sl) ? o : null;
  } catch { return null; }
}
const SK_KANAL = { email: "E-posta", linkedin: "LinkedIn", call: "Telefon", diger: "Adım" };
const skTrim = s => String(s ?? "").replace(/\r\n?/g, "\n").trim();
const skUnq = s => skTrim(s).replace(/^["“”'‘’«]+|["“”'‘’»]+$/g, "").trim();
function skSteps(rep) {
  const out = [];
  for (const x of (rep && rep.sl) || []) {
    const b = skTrim(x && x.b), m = Array.isArray(x && x.m) ? x.m.map(skTrim).filter(Boolean) : [];
    let metin = skTrim(x && x.n);
    const gm = b.match(/g[üu]n\s*(\d{1,2})/i);
    const kanal = /linked\s*in/i.test(b) ? "linkedin" : /cold\s*call|arama|telefon|çağrı/i.test(b) ? "call" : /e-?\s?posta|e-?mail|\bmail\b/i.test(b) ? "email" : "diger";
    if (!gm && (kanal === "diger" || !metin)) continue; // analiz/değer önerisi slaytları adım değildir
    let konu = "", amac = "";
    const rest = [];
    for (const it of m) {
      const k = it.match(/^(?:konu(?:\s*satırı)?|subject)\s*[:：–-]\s*(.+)$/is), a = it.match(/^(?:amaç|amac|hedef)\s*[:：–-]\s*(.+)$/is);
      if (k && !konu) konu = skUnq(k[1]); else if (a && !amac) amac = skTrim(a[1]); else rest.push(it);
    }
    const ilk = metin.match(/^(?:konu(?:\s*satırı)?|subject)\s*[:：]\s*(.+)\n+/i);
    if (ilk) { if (!konu) konu = skUnq(ilk[1]); metin = metin.slice(ilk[0].length).trim(); }
    if (kanal === "email" && !konu && rest.length) konu = skUnq(rest.shift());
    out.push({ gun: gm ? Number(gm[1]) : null, kanal, baslik: b, konu, amac, metin: metin || rest.join("\n") });
  }
  return out;
}
// Kişiselleştirme yer tutucuları: [Ad], {{ad}}, {Firma Adı}, {{first_name}}… → hedef aracın sözdizimi
const skFold = s => String(s).toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").replace(/[^a-z0-9]/g, "");
const SK_ALIAS = {};
for (const [t, ks] of Object.entries({
  first: "ad adi isim ismi firstname name kisiadi kisininadi aliciadi alici ilgilikisi yetkili yetkiliadi contactfirstname",
  full: "adsoyad adisoyadi adsoyadi isimsoyisim isimsoyad fullname kisiadisoyadi aliciadisoyadi",
  last: "soyad soyadi soyisim lastname contactlastname",
  company: "firma firmaadi firmaismi firmaniz sirket sirketadi sirketismi company companyname organization organizationname kurum kurumadi accountname",
  title: "unvan unvani pozisyon pozisyonu title jobtitle gorev gorevi rol",
  sender: "gonderen gonderenadi adiniz adinizsoyadiniz sizinadiniz imza sendername senderfirstname isminiz",
})) for (const k of ks.split(" ")) SK_ALIAS[k] = t;
const SK_TOK = {
  apollo: { first: "{{first_name}}", last: "{{last_name}}", company: "{{company}}", title: "{{title}}" },
  lemlist: { first: "{{firstName}}", last: "{{lastName}}", company: "{{companyName}}", title: "{{jobTitle}}" },
  csv: { first: "{{first_name}}", last: "{{last_name}}", company: "{{company}}", title: "{{title}}" },
  insan: { first: "[Ad]", last: "[Soyad]", company: "[Firma]", title: "[Unvan]" },
};
function skPh(text, arac, ctx = {}) {
  const T = SK_TOK[arac];
  return String(text ?? "").replace(/\{\{\s*([^{}\n]{1,40}?)\s*\}\}|\{\s*([^{}\n]{1,40}?)\s*\}|\[\s*([^\[\]\n]{1,40}?)\s*\]/g, (all, a, b, c) => {
    const t = SK_ALIAS[skFold(a || b || c)];
    if (!t) return all;
    if (t === "full") return `${T.first} ${T.last}`;
    if (t === "sender") return ctx.yazar || all;
    if (t === "company" && arac === "insan" && ctx.firma) return ctx.firma;
    return T[t];
  });
}
function skCtx(r, rep) {
  const yazar = (String(rep.s || "").match(/^Hazırlayan:\s*(.+)$/) || [])[1] || "";
  return { firma: String(r.company || "").trim(), yazar: yazar.trim() };
}
const skSlug = s => skFold(String(s || "").replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "")).slice(0, 40) || "sekans";
// CSV: RFC 4180 kaçışlama, UTF-8 BOM (Excel'de Türkçe karakterler bozulmasın), formül enjeksiyonuna karşı koruma
const csvCell = v => {
  let s = String(v ?? "").replace(/\r\n?/g, "\n");
  // "-2+3+cmd|…" gibi DDE yükleri de yakalanır; yalnız düz sayı ("-1", "-1,5") ve "- madde" dokunulmaz
  if (/^[=+@\t\r]/.test(s) || (/^-/.test(s) && !/^-\s/.test(s) && !/^-?\d+(?:[.,]\d+)?$/.test(s))) s = "'" + s;
  return /[",\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = rows => "\uFEFF" + rows.map(r => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
function skLeadCsv(arac, r, rep, steps) {
  const ctx = skCtx(r, rep);
  const bas = arac === "apollo" ? ["First Name", "Last Name", "Email", "Title", "Company"] : ["email", "firstName", "lastName", "companyName", "jobTitle"];
  const ornek = arac === "apollo" ? ["", "", "", "", ctx.firma] : ["", "", "", ctx.firma, ""];
  steps.forEach((s, i) => { bas.push(`step${i + 1}_subject`, `step${i + 1}_body`); ornek.push(skPh(s.konu, arac, ctx), skPh(s.metin, arac, ctx)); });
  return toCsv([bas, ornek]);
}
function skStepCsv(r, rep, steps) {
  const ctx = skCtx(r, rep);
  return toCsv([["Adım", "Gün", "Kanal", "Başlık", "Konu", "Amaç", "Metin"], ...steps.map((s, i) => [i + 1, s.gun ?? "", SK_KANAL[s.kanal], s.baslik, skPh(s.konu, "csv", ctx), s.amac, skPh(s.metin, "csv", ctx)])]);
}
// .eml: gönderilmemiş taslak (X-Unsent: 1), konu RFC 2047 encoded-word, gövde UTF-8 base64
const b64Bytes = u8 => { let bin = ""; for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode(...u8.subarray(i, i + 8192)); return btoa(bin); };
function rfc2047(s) {
  s = String(s || "").replace(/[\r\n]+/g, " ").trim();
  if (/^[\x20-\x7e]*$/.test(s) && s.length <= 66 && !/=\?/.test(s)) return s;
  const enc = new TextEncoder(), parts = [];
  let cur = [];
  for (const ch of s) {
    const b = enc.encode(ch);
    if (cur.length + b.length > 39) { parts.push(cur); cur = []; }
    cur.push(...b);
  }
  if (cur.length) parts.push(cur);
  return parts.map(p => `=?UTF-8?B?${b64Bytes(Uint8Array.from(p))}?=`).join("\r\n ");
}
function skEml(r, rep, s) {
  const ctx = skCtx(r, rep);
  const konu = skPh(s.konu || s.baslik, "insan", ctx);
  const govde = skPh(s.metin, "insan", ctx).replace(/\r\n?/g, "\n").replace(/\n/g, "\r\n");
  const b64 = b64Bytes(new TextEncoder().encode(govde)).replace(/.{1,76}/g, "$&\r\n");
  return ["X-Unsent: 1", `Subject: ${rfc2047(konu)}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", b64].join("\r\n");
}
const skHead = s => s.gun && !/g[üu]n\s*\d/i.test(s.baslik) ? `Gün ${s.gun} · ${s.baslik}` : s.baslik;
function skText(r, rep, list) {
  const ctx = skCtx(r, rep);
  return list.map(s => [skHead(s), s.konu ? `Konu: ${skPh(s.konu, "insan", ctx)}` : "", "", skPh(s.metin, "insan", ctx)].filter((x, i) => i !== 1 || x).join("\n")).join("\n\n———\n\n");
}
function dlFile(name, data, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name; a.style.display = "none";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
function skExportHtml(r) {
  const rep = skData(r), steps = rep ? skSteps(rep) : [];
  if (!steps.length) return "";
  const mails = steps.map((s, i) => [s, i]).filter(([s]) => s.kanal === "email");
  const ctx = skCtx(r, rep);
  return `<div class="sec sk-exp"><h4>Dışa aktar</h4><div class="row" style="justify-content:flex-start;gap:8px">
      <button class="btn btn-g btn-s" data-exp="apollo">Apollo CSV</button><button class="btn btn-g btn-s" data-exp="lemlist">Lemlist CSV</button><button class="btn btn-g btn-s" data-exp="csv">CSV</button>${mails.length ? `<button class="btn btn-g btn-s" data-exp="eml:${mails[0][1]}">E-posta taslağı (.eml)</button>` : ""}<button class="btn btn-g btn-s" data-exp="kopya">Tümünü kopyala</button></div>
    <details class="sk-how"><summary>Nasıl içe aktarılır?</summary>
      <p>Apollo ve Lemlist sekans adımlarını CSV'den almaz; bu dosyalar <b>kişi içe aktarma şablonudur</b>. Örnek satırı kendi alıcılarınızla çoğaltın (e-posta zorunlu). Her adımın metni <code>step1_subject</code>, <code>step1_body</code>… sütunlarındadır.</p>
      <p><b>Apollo:</b> kişiler için bu sütun adlarıyla çok satırlı özel alanlar oluşturun, CSV'yi kişi olarak içe aktarırken sütunları bu alanlara eşleyin, sekans adımlarında alanı <code>{ }</code> değişken menüsünden ekleyin.</p>
      <p><b>Lemlist:</b> kampanyaya CSV ile lead ekleyin; email, firstName, lastName, companyName varsayılan alanlara, diğer sütunlar aynı adla özel değişkene dönüşür. Adımlarda <code>{{step1_subject}}</code> gibi kullanın (büyük/küçük harf duyarlı).</p>
      <p>Metinlerdeki ad, firma gibi yer tutucular aracın sözdizimine çevrildi (Apollo <code>{{first_name}}</code>, Lemlist <code>{{firstName}}</code>). Bir değişkenin içindeki değişkeni her araç işlemeyebilir; emin değilseniz metni adım düzenleyicisine doğrudan yapıştırın. <b>.eml</b> dosyası Outlook'ta gönderilmemiş taslak olarak açılır; diğer programlarda metni kopyalayın.</p>
    </details></div>
    <div class="sec"><h4>Sekans adımları (${steps.length})</h4>${steps.map((s, i) => `<div class="box sk-st"><div class="row"><b>${esc(skHead(s))}</b><span class="row" style="gap:6px;justify-content:flex-end"><button class="btn btn-g btn-s" data-exp="kopya:${i}" aria-label="${i + 1}. adımı kopyala">Kopyala</button>${s.kanal === "email" ? `<button class="btn btn-g btn-s" data-exp="eml:${i}" aria-label="${i + 1}. adımı .eml taslağı olarak indir">.eml</button>` : ""}</span></div>
      ${s.konu ? `<p class="sk-k"><span>Konu:</span> ${esc(skPh(s.konu, "insan", ctx))}</p>` : ""}${s.amac ? `<p class="sk-a">${esc(s.amac)}</p>` : ""}
      ${s.metin ? `<details><summary>Metni göster</summary><div class="pre sk-m">${esc(skPh(s.metin, "insan", ctx))}</div></details>` : ""}</div>`).join("")}</div>`;
}
async function skExport(act) {
  const r = JOBS.sekans?.res, rep = skData(r), steps = rep ? skSteps(rep) : [];
  if (!steps.length) return toast("Sekans adımları okunamadı.");
  const [k, n] = act.split(":"), slug = skSlug(r.company || rep.t);
  if (k === "apollo" || k === "lemlist") { dlFile(`sekans-${slug}-${k}.csv`, skLeadCsv(k, r, rep, steps), "text/csv;charset=utf-8"); toast(`${k === "apollo" ? "Apollo" : "Lemlist"} CSV indirildi`); }
  else if (k === "csv") { dlFile(`sekans-${slug}.csv`, skStepCsv(r, rep, steps), "text/csv;charset=utf-8"); toast("CSV indirildi"); }
  else if (k === "eml") { const s = steps[Number(n)]; if (!s) return; dlFile(`sekans-${slug}-adim${Number(n) + 1}.eml`, skEml(r, rep, s), "message/rfc822"); toast("E-posta taslağı indirildi"); }
  else if (k === "kopya") {
    const list = n === undefined ? steps : [steps[Number(n)]].filter(Boolean);
    try { await navigator.clipboard.writeText(skText(r, rep, list)); toast("Kopyalandı ✓"); } catch { toast("Kopyalanamadı; metni seçip kopyalayın."); }
  }
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
// SEO aracında hacim kaynağı yok; yapay zekâ bilinmeyen alanlara "N/A", "-" vb. yazıyor. Bu değerler boş sayılır,
// boş alan/satır/sütun gösterilmez. Asıl veri (j.res) değiştirilmez; temizlenmiş kopya döner.
const seoBos = v => v == null || (typeof v === "string" && /^\s*(n\/?a|-+|—|–|null|undefined)?\s*$/i.test(v));
function seoTemiz(v, d = 0) {
  if (seoBos(v)) return undefined;
  if (d > 8 || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(x => seoTemiz(x, d + 1)).filter(x => x !== undefined && !(x && typeof x === "object" && !Array.isArray(x) && !Object.keys(x).length));
  const o = {};
  for (const [k, x] of Object.entries(v)) { const y = seoTemiz(x, d + 1); if (y !== undefined) o[k] = y; }
  return o;
}
const SEO_KOL = [["keyword", "Anahtar kelime"], ["volume", "Hacim"], ["competition", "Rekabet"], ["intent", "Niyet"]];
const seoKw = kw => (Array.isArray(kw && kw.table) ? kw.table : []).filter(t => t && typeof t === "object" && !seoBos(t.keyword) && String(t.keyword).trim()).slice(0, 25);
function seoResult(r0) {
  const r = seoTemiz(r0) || {};
  const sc = r.seo_score || {}, br = sc.breakdown || {}, pi = r.page_info || {}, kw = r.keywords || {}, g = r.generated_content || {};
  const tot = Number(sc.total);
  const pill = Number.isFinite(tot) ? `<span class="pill ${tot >= 70 ? "ok" : tot >= 45 ? "warn" : "bad"}">${tot}/100${sc.level ? " · " + esc(sc.level) : ""}</span>` : "";
  const lbl = { title_quality: "Başlık", meta_desc_quality: "Meta açıklama", h1_quality: "H1", content_depth: "İçerik derinliği", keyword_density: "Anahtar kelime", bonus_points: "Bonus" };
  const issues = (Array.isArray(r.issues) ? r.issues : []).map(asText).filter(Boolean);
  const table = seoKw(kw);
  const kol = SEO_KOL.filter(([k], i) => !i || table.some(t => t[k] != null && String(asText(t[k])).trim()));
  const c = g.content || {};
  const bolum = (Array.isArray(c.sections) ? c.sections : []).filter(x => x && (x.h2 || x.content));
  const sss = (Array.isArray(c.faq) ? c.faq : []).filter(q => q && q.question);
  const puan = Object.keys(lbl).filter(k => br[k] != null).map(k => [lbl[k], br[k]]);
  const meta = [["SEO başlığı", g.seo_title], ["Meta açıklama", g.meta_description], ["URL", g.slug ? "/" + String(g.slug).replace(/^\//, "") : ""]].filter(x => x[1] != null && String(x[1]).trim());
  return `${resHead("SEO raporu" + (r.url ? " — " + (() => { try { return new URL(r.url).hostname; } catch { return ""; } })() : ""), pill)}
  <div class="res-b">
    ${puan.length ? `<div class="sec"><h4>Puan dağılımı</h4>${kv(puan)}</div>` : ""}
    <div class="sec"><h4>Sayfa</h4><div class="box"><b>${esc(pi.title || "Başlık yok")}</b><p style="color:var(--mute);margin-top:4px">${esc(pi.meta_description || "Meta açıklama yok")}</p>${pi.h1 ? `<p style="margin-top:6px;font-size:13.5px">H1: ${esc(pi.h1)}</p>` : ""}</div></div>
    ${issues.length ? `<div class="sec"><h4>Düzeltilmesi gerekenler (${issues.length})</h4><ul style="margin:0;padding-left:20px;display:grid;gap:6px">${issues.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>` : ""}
    ${table.length ? `<div class="sec"><h4>Anahtar kelimeler</h4><div class="card scroll-x" style="box-shadow:none"><table class="tbl"><thead><tr>${kol.map(([, a]) => `<th>${a}</th>`).join("")}</tr></thead><tbody>${table.map(t => `<tr>${kol.map(([k]) => `<td>${esc(t[k] == null ? "" : asText(t[k]))}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>` : ""}
    ${meta.length || c.intro || bolum.length ? `<div class="sec"><h4>Hazır içerik önerisi</h4>
      ${meta.length ? `<div class="box"><button class="btn btn-g btn-s copy" data-copy-el="seo-meta">Kopyala</button><div id="seo-meta" class="pre">${meta.map(([a, v]) => `<b>${a}:</b> ${esc(asText(v))}`).join("\n")}</div></div>` : ""}
      ${c.intro || bolum.length ? `<details class="box"><summary style="cursor:pointer;font-weight:600">Makale taslağını göster</summary><div id="seo-art" class="md" style="margin-top:12px">${c.intro ? `<p>${esc(c.intro)}</p>` : ""}${bolum.map(s => `${s.h2 ? `<h3>${esc(s.h2)}</h3>` : ""}${s.content ? `<p class="pre">${esc(s.content)}</p>` : ""}`).join("")}${sss.length ? `<h3>Sık sorulan sorular</h3>${sss.map(q => `<p><b>${esc(q.question)}</b>${q.answer ? `<br>${esc(q.answer)}` : ""}</p>`).join("")}` : ""}${c.conclusion ? `<p>${esc(c.conclusion)}</p>` : ""}</div><button class="btn btn-g btn-s" data-copy-el="seo-art" style="margin-top:8px">Taslağı kopyala</button></details>` : ""}
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
  if (BRF_SEKME === "toplu") return pageToplu(fnot);
  toolShell("briefing", `${brfSekme()}${fnot}<form id="f" data-sk-noform>
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
  bindBrfSekme();
  const f = document.getElementById("f");
  if (tbAktif()) f.querySelectorAll("[type=submit]").forEach(b => { b.disabled = true; b.textContent = "Toplu briefing sürüyor…"; });
  f.onsubmit = e => {
    e.preventDefault();
    if (tbAktif()) return setMsg("m", "warn", "Toplu briefing sürerken tekil briefing başlatılamaz.");
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

// ---------- Toplu briefing (CSV) ----------
// Tek briefing akışını (/api/app/briefing) firmalar için sırayla tekrar eder: yeni uç yok, kota sunucuda
// yalnız başarılı işte düşer (başarısız iş "Hakkınızdan düşülmedi"). Kuyruk bu tarayıcıda saklanır,
// sayfa yenilenirse "Devam et" ile kalan firmalar yeniden kredi kontrol edilerek sürdürülür.
const TB_MAX = 20, TB_SATIR = 200, TB_BEKLE = 6 * 60e3, TB_HB = 5e3, TB_TAZE = 15e3, TB_GUN = 7 * 864e5;
const TB_ST = new Set(["bekle", "calis", "ok", "hata", "kredi"]);
const TB_SON = ["firma_adi", "company", "kisi_adi", "person", "toplanti_tarihi", "en_uygun_hizmet", "f_skor", "k_skor", "deal_pct_label", "slideCount", "presentationViewUrl", "presentationUrl", "message"];
let BRF_SEKME = store.get("brf_sekme", "tek") === "toplu" ? "toplu" : "tek";
let TB = null;       // kuyruk (yerel depo "toplu")
let TBP = null;      // önizleme: { rows, ele, fazla, ad, kalan, n }
let TBRUN = null;    // bu sekmede süren çalıştırma
let TB_ONAY = null;  // "Devam et" sonrası onay bekleyen kredi bilgisi
let TB_NOT = null;   // [tür, metin]

const brfSekme = () => `<div class="tabs" role="tablist" aria-label="Briefing türü" style="margin:0 0 16px"><button type="button" role="tab" aria-selected="${BRF_SEKME === "tek"}" data-brf="tek">Tek firma</button><button type="button" role="tab" aria-selected="${BRF_SEKME === "toplu"}" data-brf="toplu">Toplu (CSV)</button></div>`;
function bindBrfSekme() {
  document.querySelectorAll("[data-brf]").forEach(b => (b.onclick = () => {
    if (BRF_SEKME === b.dataset.brf) return;
    BRF_SEKME = b.dataset.brf; store.set("brf_sekme", BRF_SEKME); render();
  }));
}
const tbBaska = () => !TBRUN && !!TB && TB.durum === "calis" && Date.now() - Number(TB.hb) < TB_TAZE;
const tbAktif = () => !!TBRUN || tbBaska();

// --- CSV okuma ---
function tbCsv(txt) {
  txt = String(txt || "").replace(/^﻿/, "");
  const ilk = txt.split(/\r?\n/).find(l => l.trim()) || "";
  const ay = ilk.includes("\t") ? "\t" : ilk.split(";").length > ilk.split(",").length ? ";" : ",";
  const out = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) {
      if (c !== '"') cell += c;
      else if (txt[i + 1] === '"') { cell += '"'; i++; }
      else q = false;
    } else if (c === '"' && !cell.trim()) { cell = ""; q = true; }
    else if (c === ay) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && txt[i + 1] === "\n") i++;
      row.push(cell); out.push(row); row = []; cell = "";
      if (out.length > TB_SATIR + 1) break;
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); out.push(row); }
  return out.map(r => r.map(x => x.replace(/\s+/g, " ").trim())).filter(r => r.some(Boolean));
}
const tbNorm = s => String(s || "").toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
function tbAlan(h) {
  const n = tbNorm(h);
  if (!n) return "";
  if (n.includes("linkedin")) return /kisi|person|contact|yetkili|profil/.test(n) ? "klinkedin" : "flinkedin";
  if (n.includes("mail")) return "eposta";
  if (/web|site|url|domain|alanadi/.test(n)) return "web";
  if (/tarih|date/.test(n)) return "tarih";
  if (/saat|time/.test(n)) return "saat";
  if (/konu|topic|subject|gundem|not/.test(n)) return "konu";
  if (/kisi|contact|person|yetkili|adsoyad|fullname|gorusulecek/.test(n)) return "kisi";
  if (/firma|sirket|company|kurum|marka|organi|isletme|musteri/.test(n) || /^(name|ad|adi|isim)$/.test(n)) return "firma";
  return "";
}
const tbGun = (y, a, g) => { const d = new Date(Date.UTC(y, a - 1, g)); return y > 2000 && d.getUTCMonth() === a - 1 && d.getUTCDate() === g ? d.toISOString().slice(0, 10) : today(); };
function tbTarih(s) {
  s = String(s || "").trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return tbGun(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  return m ? tbGun(+m[3], +m[2], +m[1]) : today();
}
const tbSaat = s => { const m = String(s || "").trim().match(/^(\d{1,2})[:.](\d{2})$/); return m && +m[1] < 24 && +m[2] < 60 ? `${m[1].padStart(2, "0")}:${m[2]}` : "10:00"; };
const tbHost = u => { try { return new URL(u).hostname.replace(/^www\./i, "").toLowerCase(); } catch { return ""; } };
function tbAyikla(txt, ad) {
  const r = tbCsv(txt);
  const o = { rows: [], ele: [], fazla: 0, ad: String(ad || "").slice(0, 120) };
  if (!r.length) return o;
  let map = r[0].map(tbAlan), bas = 1;
  if (!map.includes("firma") && !map.includes("web")) { map = ["firma", "web", "kisi", "eposta"]; bas = 0; }
  const gor = new Set();
  map = map.map(m => (m && !gor.has(m) ? (gor.add(m), m) : ""));
  o.fazla = Math.max(0, r.length - bas - TB_SATIR);
  const hostlar = new Set(), adlar = new Set();
  for (let i = bas; i < r.length && i < bas + TB_SATIR; i++) {
    const x = {};
    map.forEach((m, j) => { if (m) x[m] = r[i][j] || ""; });
    const satir = i + 1, firma = (x.firma || "").slice(0, 150), web = normUrl(x.web);
    if (!firma) { o.ele.push({ satir, ad: x.web || "—", neden: "Firma adı yok" }); continue; }
    if (!web) { o.ele.push({ satir, ad: firma, neden: x.web ? "Web sitesi geçersiz" : "Web sitesi yok" }); continue; }
    const h = tbHost(web), an = tbNorm(firma);
    if (hostlar.has(h) || (an && adlar.has(an))) { o.ele.push({ satir, ad: firma, neden: "Yinelenen firma" }); continue; }
    hostlar.add(h); if (an) adlar.add(an);
    const ep = String(x.eposta || "").trim(), li = v => (String(v || "").trim() ? normUrl(v) : "");
    o.rows.push({ satir, firma, web, kisi: (x.kisi || "").slice(0, 120), eposta: EPOSTA_RX.test(ep) && ep.length <= 254 ? ep : "", flinkedin: li(x.flinkedin), klinkedin: li(x.klinkedin), tarih: tbTarih(x.tarih), saat: tbSaat(x.saat), konu: (x.konu || "").slice(0, 300) });
  }
  return o;
}

// --- Kredi ---
function tbKalan() { const d = durum("briefing"); return d.ok ? (d.lim < 0 ? Infinity : Math.max(0, d.lim - d.kul)) : 0; }
async function tbBenYenile() { try { const b = await rpc("app_ben"); if (b) S.ben = b; return true; } catch { return false; } }
function tbBilgi(n, kalan, aday, fazla) {
  if (!n) {
    const d = durum("briefing");
    return msg("warn", `${ic("alert", 16)}<span>${esc(d.ok ? "Bu ay briefing krediniz kalmadı." : NEDEN[d.neden] ? NEDEN[d.neden]("briefing") : "Briefing kredisi alınamadı.")} Hiçbir firma çalıştırılmaz. <a href="#/fiyatlar">Planları inceleyin →</a></span>`);
  }
  const k = kalan === Infinity ? " · planınız sınırsız" : ` · kalan ${kalan} → ${kalan - n}`;
  const ek = [aday > n ? `${aday - n} firma için kredi yetmedi; bunlar çalıştırılmaz.` : "", fazla ? `${fazla} firma bir seferdeki ${TB_MAX} firma sınırının dışında kaldı.` : ""].filter(Boolean);
  return msg(aday > n ? "warn" : "info", `<span><b data-tb-ozet>${n} firma · ${n} briefing kredisi kullanılacak${k}</b>${ek.map(x => `<br>${esc(x)}`).join("")}<br><span style="font-size:13px">Firmalar sırayla hazırlanır; başarısız olan briefing hakkınızdan düşmez. Her briefing e-postanıza da gelir.</span></span>`);
}

// --- Kuyruk (yerel depo) ---
function tbOku() {
  const uid = S.session?.user?.id, t = store.get("toplu", null);
  if (!uid || !t || typeof t !== "object" || t.v !== 1 || t.uid !== uid || !Array.isArray(t.rows) || !(Date.now() - Number(t.at) < TB_GUN)) return null;
  t.rows = t.rows.filter(r => r && typeof r === "object" && typeof r.firma === "string").slice(0, TB_MAX);
  for (const r of t.rows) if (!TB_ST.has(r.st)) r.st = "hata";
  return t.rows.length ? t : null;
}
function tbYukle() {
  if (TBRUN) return;
  const t = tbOku();
  if (t && t.durum === "calis" && !(Date.now() - Number(t.hb) < TB_TAZE)) {
    for (const r of t.rows) if (r.st === "calis") { r.st = "hata"; r.err = "Sayfa kapandığı için sonucu alınamadı. Briefing tamamlandıysa e-postanıza gelir; kredi yalnız başarılı işte düşer."; }
    t.durum = "durdu";
    store.set("toplu", t);
  }
  TB = t;
}
function tbSakla() { if (!TB) return; if (TBRUN) TB.hb = Date.now(); store.set("toplu", TB); }
const tbSay = (t, st) => (t ? t.rows.filter(r => r.st === st).length : 0);
const tbAdaylar = () => (TB ? TB.rows.filter(r => r.st === "bekle" || r.st === "kredi") : []);

// --- Çalıştırma ---
function tbHata(res) {
  if (res && res.neden && NEDEN[res.neden]) return NEDEN[res.neden]("briefing") + " Hakkınızdan düşülmedi.";
  if (/^Bağlantı kurulamadı/.test(String(res?.message || ""))) return "Bağlantı kurulamadı. Briefing tamamlandıysa e-postanıza gelir; kredi yalnız başarılı işte düşer.";
  return "Briefing hazırlanamadı. Hakkınızdan düşülmedi.";
}
function tbKrediBitti(t, neden) {
  for (const r of t.rows) if (r.st === "bekle") r.st = "kredi";
  TB_NOT = ["warn", (neden && NEDEN[neden] ? NEDEN[neden]("briefing") : "Briefing krediniz bitti.") + " Kalan firmalar çalıştırılmadı."];
}
async function tbKlasor(t, r) {
  if (!t || t.klasorDur || r.kid || r.st !== "ok") return;
  let o = null;
  try { o = PAY_MD.briefing({ res: { sonuc: r.son || {} }, title: r.firma }); } catch {}
  const m = o ? mdT(o.m) : "";
  if (!m) { r.kerr = "Kaydedilecek içerik yok."; return; }
  try {
    const x = await erpc("app_klasor_kaydet", { p_modul: "briefing", p_baslik: mdLine(`${t.grup} · ${r.firma}`).slice(0, 200), p_icerik: m });
    if (!x || !x.ok || !x.id) throw new Error("gecersiz_yanit");
    r.kid = x.id; r.kerr = "";
    KLASOR = klasorBos();
  } catch (e) {
    r.kerr = ekErr(e) || "Klasöre kaydedilemedi.";
    if (String(e && e.code) === "54000") t.klasorDur = true;
  }
}
async function tbBasari(t, r, res) {
  applyKota("briefing", res.kota);
  const s = res.sonuc && typeof res.sonuc === "object" ? res.sonuc : {};
  r.son = {};
  for (const k of TB_SON) {
    const v = s[k];
    if (v === undefined || v === null || v === "" || typeof v === "object") continue;
    r.son[k] = typeof v === "number" ? v : String(v).slice(0, k === "message" ? 600 : 400);
  }
  r.st = "ok"; r.err = "";
  const url = safeUrl(r.son.presentationViewUrl || r.son.presentationUrl);
  if (url) addHist({ k: "briefing", title: `${r.firma}${r.kisi ? " · " + r.kisi : ""}`, url });
  gecmisKaydet("briefing", { title: `${r.firma}${r.kisi ? " · " + r.kisi : ""}` }, { success: true, sonuc: s });
  await tbKlasor(t, r);
}
async function tbCalistir() {
  if (TBRUN || !TB) return;
  const t = TB, uid = t.uid, run = (TBRUN = { dur: false, t });
  const kalp = setInterval(() => { if (TB === t) tbSakla(); }, TB_HB);
  t.durum = "calis"; TB_NOT = null; tbSakla(); tbCiz();
  try {
    while (!run.dur && TB === t && S.session?.user?.id === uid) {
      const r = t.rows.find(x => x.st === "bekle");
      if (!r) break;
      if (!durum("briefing").ok) { tbKrediBitti(t, durum("briefing").neden); break; }
      r.st = "calis"; r.t0 = Date.now(); r.err = ""; tbSakla(); tbCiz();
      const body = { firma_adi: r.firma, firma_website: r.web, firma_linkedin: r.flinkedin || "", kisi_adi: r.kisi || "", kisi_email: r.eposta || "", kisi_linkedin: r.klinkedin || "", toplanti_tarihi: r.tarih || today(), toplanti_saati: r.saat || "10:00", toplanti_konusu: r.konu || "" };
      const p = api("/api/app/briefing", body);
      const res = await Promise.race([p, wait(TB_BEKLE).then(() => null)]);
      if (TB !== t) break;
      r.sure = Math.round((Date.now() - r.t0) / 1000);
      if (res === null) {
        r.st = "hata"; r.err = "Yanıt çok uzun sürdü; sıradaki firmaya geçildi. Briefing tamamlanırsa e-postanıza gelir.";
        p.then(async geç => {
          if (!geç || !geç.success || TB !== t || r.st !== "hata") return;
          await tbBasari(t, r, geç); tbSakla(); tbCiz();
        }).catch(() => {});
      } else if (res.success) await tbBasari(t, r, res);
      else if (/^Oturumunuzun süresi doldu/.test(String(res.message || ""))) {
        r.st = "bekle"; r.err = "";
        TB_NOT = ["err", "Oturumunuzun süresi doldu. Yeniden giriş yapıp kaldığınız yerden devam edin."];
        break;
      } else {
        r.st = "hata"; r.err = tbHata(res);
        if (res.neden) { tbKrediBitti(t, res.neden); break; }
      }
      if (TB === t) { tbSakla(); tbCiz(); }
    }
  } finally {
    clearInterval(kalp);
    TBRUN = null;
    if (TB === t) {
      for (const r of t.rows) if (r.st === "calis") { r.st = "bekle"; r.err = ""; }
      t.durum = t.rows.some(r => r.st === "bekle") ? "durdu" : "bitti";
      store.set("toplu", t);
    }
  }
  if (TB !== t) return;
  await tbBenYenile();
  const ok = tbSay(t, "ok");
  toast(run.dur ? `Toplu briefing durduruldu · ${ok} hazır` : `Toplu briefing bitti · ${ok} hazır ✓`);
  if (route === "briefing" && BRF_SEKME === "toplu") render();
}
// Önizlemeden ya da "Devam et"ten: krediyi tazeleyip yeniden hesaplar; sayı değiştiyse başlatmaz, yeni bildirimi gösterir
async function tbBaslat(btn) {
  if (tbAktif() || JOBS.briefing?.state === "run") return;
  const devam = !!TB && !!TB_ONAY;
  const aday = devam ? tbAdaylar().length : TBP ? Math.min(TBP.rows.length, TB_MAX) : 0;
  if (!aday) return;
  busy(btn, true, "Kredi kontrol ediliyor…");
  const taze = await tbBenYenile();
  busy(btn, false);
  const kalan = tbKalan(), n = Math.min(aday, kalan);
  const eski = devam ? TB_ONAY : TBP;
  if (!taze) { TB_NOT = ["err", "Kredi bilgisi alınamadı. Bağlantınızı kontrol edip tekrar deneyin."]; return tbCiz(); }
  if (!eski || eski.n !== n || eski.kalan !== kalan) {
    if (eski) { eski.n = n; eski.kalan = kalan; }
    TB_NOT = ["warn", "Kredi durumunuz değişti; güncel bilgiyi kontrol edip yeniden başlatın."];
    return tbCiz();
  }
  if (!n) return;
  if (devam) {
    tbAdaylar().forEach((r, i) => { r.st = i < n ? "bekle" : "kredi"; r.err = ""; });
    TB_ONAY = null;
  } else {
    const uid = S.session?.user?.id;
    if (!uid) return;
    TB = { v: 1, uid, at: Date.now(), hb: Date.now(), grup: `Toplu briefing — ${new Date().toLocaleDateString("tr-TR")}`, durum: "calis",
      rows: TBP.rows.slice(0, TB_MAX).map((r, i) => ({ ...r, st: i < n ? "bekle" : "kredi", err: "" })) };
    TBP = null;
  }
  tbCalistir();
}
async function tbDevamSor(btn) {
  if (tbAktif() || !TB) return;
  busy(btn, true, "Kredi kontrol ediliyor…");
  const taze = await tbBenYenile();
  busy(btn, false);
  if (!taze) { TB_NOT = ["err", "Kredi bilgisi alınamadı. Bağlantınızı kontrol edip tekrar deneyin."]; return tbCiz(); }
  const kalan = tbKalan();
  TB_ONAY = { n: Math.min(tbAdaylar().length, kalan), kalan };
  TB_NOT = null;
  tbCiz();
}
async function tbKaydetKalan(btn) {
  const t = TB;
  if (!t || TBRUN) return;
  t.klasorDur = false;
  busy(btn, true, "Kaydediliyor…");
  for (const r of t.rows) if (r.st === "ok" && !r.kid) { await tbKlasor(t, r); if (t.klasorDur) break; }
  busy(btn, false);
  if (TB !== t) return;
  store.set("toplu", t);
  const kalan = t.rows.filter(r => r.st === "ok" && !r.kid).length;
  TB_NOT = kalan ? ["warn", `${kalan} briefing kaydedilemedi. ${t.klasorDur ? "Bugünkü kayıt sınırına ulaştınız (günde 30; paylaşım linkleriyle ortak). Yarın tekrar deneyin." : "Biraz sonra tekrar deneyin."}`] : ["ok", `Tümü ${klasorEkip() ? "ekip klasörüne" : "klasörünüze"} kaydedildi.`];
  tbCiz();
}

// --- İndirme ---
const tbDosyaAd = (t, uz) => { const d = new Date(Number(t.at) || Date.now()); return `toplu-briefing-${new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10)}.${uz}`; };
const TB_DURUM = { bekle: "Sırada", calis: "Hazırlanıyor", ok: "Hazır", hata: "Hata", kredi: "Kredi yetmedi" };
function tbMd(t) {
  const ok = t.rows.filter(r => r.st === "ok"), diger = t.rows.filter(r => r.st !== "ok");
  return mdJoin(`# ${mdLine(t.grup)}`, `${ok.length} briefing hazır${diger.length ? `, ${diger.length} firma hazırlanmadı` : ""}.`,
    ...ok.map(r => { const o = PAY_MD.briefing({ res: { sonuc: r.son || {} }, title: r.firma }); return `## ${mdLine(r.firma)}\n\n${mdT(o.m).replace(/^## /gm, "### ")}`; }),
    diger.length ? `## Hazırlanmayan firmalar\n\n${diger.map(r => `- **${mdLine(r.firma)}** (${mdLine(r.web)}): ${TB_DURUM[r.st]}${r.err ? " — " + mdLine(r.err) : ""}`).join("\n")}` : "") + "\n";
}
function tbHtml(t) {
  const sat = (a, v) => (v === undefined || v === null || v === "" ? "" : `<tr><th>${esc(a)}</th><td>${esc(v)}</td></tr>`);
  const ok = t.rows.filter(r => r.st === "ok"), diger = t.rows.filter(r => r.st !== "ok");
  const bolum = r => {
    const s = r.son || {}, u = safeUrl(s.presentationViewUrl || s.presentationUrl);
    return `<section><h2>${esc(r.firma)}</h2><table>${sat("Web sitesi", r.web)}${sat("Kişi", s.kisi_adi || s.person || r.kisi)}${sat("Toplantı", s.toplanti_tarihi || r.tarih)}${sat("En uygun hizmet", s.en_uygun_hizmet)}${sat("Firma skoru", s.f_skor)}${sat("Kişi skoru", s.k_skor)}${sat("Fırsat", s.deal_pct_label)}${sat("Slayt", s.slideCount)}</table>
      ${u ? `<p><a href="${esc(u)}" target="_blank" rel="noopener">Briefing sunumunu aç →</a></p>` : ""}${s.message ? `<p class="m">${esc(s.message)}</p>` : ""}</section>`;
  };
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t.grup)}</title>
<style>body{font-family:Inter,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#0f172a;background:#f6f7fb;margin:0;padding:24px 16px;line-height:1.55}main{max-width:820px;margin:0 auto}h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:0 0 10px}section{background:#fff;border:1px solid #e5e7ef;border-radius:14px;padding:18px 20px;margin-top:14px}table{border-collapse:collapse;width:100%;font-size:14px}th{text-align:left;color:#64748b;font-weight:600;width:38%;padding:5px 8px 5px 0;vertical-align:top}td{padding:5px 0;overflow-wrap:anywhere}a{color:#5b5bd6}.m{color:#64748b;font-size:13.5px}.ust{color:#64748b;margin:0}ul{padding-left:18px}</style></head>
<body><main><h1>${esc(t.grup)}</h1><p class="ust">${ok.length} briefing hazır${diger.length ? ` · ${diger.length} firma hazırlanmadı` : ""} · Sales Corner</p>
${ok.map(bolum).join("")}
${diger.length ? `<section><h2>Hazırlanmayan firmalar</h2><ul>${diger.map(r => `<li><b>${esc(r.firma)}</b> (${esc(r.web)}): ${esc(TB_DURUM[r.st])}${r.err ? " — " + esc(r.err) : ""}</li>`).join("")}</ul></section>` : ""}
</main></body></html>`;
}
function tbIndir(icerik, ad, tip) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([icerik], { type: tip }));
  a.download = ad; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
const TB_ORNEK = "Firma adı,Web sitesi,Görüşülecek kişi,E-posta,Toplantı tarihi,Saat,Konu\nÖrnek Yazılım A.Ş.,ornekyazilim.com,Ayşe Yılmaz,,,10:00,CRM entegrasyonu demosu\nDemo Lojistik,demolojistik.com.tr,,,,,\n";

// --- Çizim ---
function tbForm() {
  return `<form id="tbf" data-sk-noform>
    <p style="font-size:14px;color:var(--mute);margin-bottom:14px">Bir CSV dosyası yükleyin ya da Excel / Google Sheets'ten kopyalayıp yapıştırın. Her satır bir firma; bir seferde en fazla ${TB_MAX} firma çalışır.</p>
    <div class="f"><label for="tbd">CSV dosyası</label><input class="in" id="tbd" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain"></div>
    <div class="f"><label for="tbt">ya da yapıştırın</label><textarea class="in" id="tbt" rows="7" maxlength="100000" spellcheck="false" placeholder="Firma adı,Web sitesi&#10;Örnek Yazılım A.Ş.,ornekyazilim.com"></textarea>
      <span class="hint">Firma adı ve web sitesi zorunlu; kişi, e-posta, toplantı tarihi, saat ve konu isteğe bağlı. Başlık satırı yoksa sıra: firma, web sitesi, kişi, e-posta.</span></div>
    <div id="tbm"></div>
    <div class="row" style="justify-content:flex-start"><button class="btn btn-p" type="submit">Önizle</button><button class="btn btn-g btn-s" type="button" data-tb="ornek">Örnek CSV indir</button></div>
  </form><div id="tb-onay" style="margin-top:14px"></div>`;
}
function tbOnayHtml() {
  const not = TB_NOT ? msg(TB_NOT[0], esc(TB_NOT[1])) : "";
  if (!TBP) return not;
  const aday = Math.min(TBP.rows.length, TB_MAX);
  if (!aday) return not + msg("err", `${ic("alert", 16)}<span>Çalıştırılabilecek geçerli satır bulunamadı. Her satırda firma adı ve web sitesi olmalı.</span>`);
  const tek = JOBS.briefing?.state === "run";
  return `${not}${tbBilgi(TBP.n, TBP.kalan, aday, Math.max(0, TBP.rows.length - TB_MAX))}
    <div class="row" style="justify-content:flex-start;margin-top:12px">${TBP.n ? `<button class="btn btn-p" type="button" data-tb="baslat"${tek ? " disabled" : ""}>${TBP.n} briefingi başlat</button>` : ""}<button class="btn btn-g btn-s" type="button" data-tb="iptal">Vazgeç</button></div>
    ${tek ? `<p class="hint" style="margin-top:8px;font-size:12.5px;color:var(--mute)">Tek firma briefingi bitince başlatabilirsiniz.</p>` : ""}`;
}
function tbKontrol() {
  const t = TB, not = TB_NOT ? msg(TB_NOT[0], esc(TB_NOT[1])) : "";
  const ok = tbSay(t, "ok"), hata = tbSay(t, "hata"), kredi = tbSay(t, "kredi"), bekle = tbSay(t, "bekle");
  const ozet = `<div class="kv" style="margin-bottom:14px">${[["Hazır", ok], ["Hata", hata], ["Sırada", bekle + tbSay(t, "calis")], ["Kredi yetmedi", kredi]].filter(x => x[1]).map(([a, v]) => `<div><span>${a}</span><b>${v}</b></div>`).join("")}</div>`;
  let alt;
  if (TBRUN) alt = `<button class="btn btn-d btn-w" type="button" data-tb="dur"${TBRUN.dur ? " disabled" : ""}>${TBRUN.dur ? "Durduruluyor… (süren firma bitiyor)" : "Durdur"}</button>
    <p class="hint" style="margin-top:10px;font-size:12.5px;color:var(--mute)">Bu sekme açık kaldığı sürece devam eder; başka sayfalara geçebilirsiniz. Durdurunca o an hazırlanan firma tamamlanır.</p>`;
  else if (tbBaska()) alt = msg("info", "Bu liste başka bir sekmede çalışıyor. İlerleme burada da güncellenir.");
  else {
    const aday = tbAdaylar().length, tek = JOBS.briefing?.state === "run";
    const devam = !aday ? "" : TB_ONAY
      ? `${tbBilgi(TB_ONAY.n, TB_ONAY.kalan, aday, 0)}<div class="row" style="justify-content:flex-start;margin-top:12px">${TB_ONAY.n ? `<button class="btn btn-p" type="button" data-tb="baslat"${tek ? " disabled" : ""}>${TB_ONAY.n} briefingle devam et</button>` : ""}<button class="btn btn-g btn-s" type="button" data-tb="vazgec">Vazgeç</button></div>`
      : `<p style="font-size:14px;margin-bottom:10px">${aday} firma çalıştırılmadı.</p><button class="btn btn-p btn-w" type="button" data-tb="devam"${tek ? " disabled" : ""}>Devam et</button>`;
    alt = `${devam}${tek ? `<p class="hint" style="margin-top:8px;font-size:12.5px;color:var(--mute)">Tek firma briefingi sürüyor; bitince devam edebilirsiniz.</p>` : ""}
      <div class="row" style="justify-content:flex-start;margin-top:14px"><button class="btn btn-g btn-s" type="button" data-tb="yeni">Yeni toplu liste</button></div>`;
  }
  return `<div class="sec" style="margin-bottom:0"><h4>${esc(t.grup)}</h4>${ozet}${not}${alt}</div>`;
}
function tbSatir(r, i, pill) {
  const alt = [tbHost(r.web), r.kisi].filter(Boolean).map(esc).join(" · ");
  return `<li class="tb-li"><span class="tb-n">${i + 1}</span><div class="tb-t"><b>${esc(r.firma)}</b><span>${alt}</span>${r.err ? `<span class="tb-e">${esc(r.err)}</span>` : ""}${r.kerr ? `<span class="tb-e">Klasör: ${esc(r.kerr)}</span>` : ""}</div><div class="tb-s">${pill}</div></li>`;
}
function tbPill(r) {
  if (r.st === "ok") {
    const u = safeUrl(r.son?.presentationViewUrl || r.son?.presentationUrl);
    return `${u ? `<a class="btn btn-g btn-s" href="${esc(u)}" target="_blank" rel="noopener">Aç</a>` : ""}<span class="pill ok">Hazır</span>`;
  }
  if (r.st === "calis") return `<span class="pill acc"><span class="spin s" aria-hidden="true"></span>Hazırlanıyor</span>`;
  if (r.st === "hata") return `<span class="pill bad">Hata</span>`;
  if (r.st === "kredi") return `<span class="pill warn">Kredi yetmedi</span>`;
  return `<span class="pill">Sırada</span>`;
}
function tbSag() {
  if (TB) {
    const t = TB, ok = tbSay(t, "ok"), dl = !TBRUN && ok;
    const kaydedilmedi = t.rows.filter(r => r.st === "ok" && !r.kid).length;
    return `<div class="res-h"><div style="min-width:0;flex:1"><h3>${esc(t.grup)}</h3><p style="color:var(--mute);font-size:13.5px;margin-top:2px" data-tb-eta>${esc(tbEta())}</p></div></div>
      <div class="res-b"><div class="meter tb-m" style="margin-bottom:18px" aria-hidden="true"><i data-tb-bar style="width:${tbYuzde().toFixed(1)}%"></i></div>
      <ol class="tb-list">${t.rows.map((r, i) => tbSatir(r, i, tbPill(r))).join("")}</ol>
      ${ok ? `<div class="sec" style="margin-top:20px"><h4>Çıktılar</h4><p style="color:var(--mute);font-size:13.5px;margin-bottom:10px">Hazır briefingler "${esc(t.grup)}" başlığıyla ${klasorEkip() ? "ekip klasörüne" : "klasörünüze"} kaydedilir.${kaydedilmedi ? ` ${kaydedilmedi} tanesi kaydedilemedi.` : ""}</p>
        <div class="row" style="justify-content:flex-start"><button class="btn btn-p btn-s" type="button" data-tb="html"${dl ? "" : " disabled"}>Tümünü indir (.html)</button><button class="btn btn-g btn-s" type="button" data-tb="md"${dl ? "" : " disabled"}>Markdown (.md)</button><a class="btn btn-g btn-s" href="#/klasor">${esc(klasorAd())}</a>${kaydedilmedi && !TBRUN && !tbBaska() ? `<button class="btn btn-g btn-s" type="button" data-tb="kaydet">Kaydedilemeyenleri kaydet</button>` : ""}</div></div>` : ""}</div>`;
  }
  if (TBP) {
    const aday = Math.min(TBP.rows.length, TB_MAX);
    const pill = i => (i >= TB_MAX ? `<span class="pill">${TB_MAX} sınırı dışında</span>` : i < TBP.n ? `<span class="pill ok">Çalıştırılacak</span>` : `<span class="pill warn">Kredi yetmedi</span>`);
    return `<div class="res-h"><div style="min-width:0;flex:1"><h3>Önizleme</h3><p style="color:var(--mute);font-size:13.5px;margin-top:2px">${TBP.ad ? esc(TBP.ad) + " · " : ""}${TBP.rows.length} geçerli · ${TBP.ele.length} elendi${aday ? ` · ${TBP.n} çalıştırılacak` : ""}</p></div></div>
      <div class="res-b">${TBP.rows.length ? `<ol class="tb-list">${TBP.rows.map((r, i) => tbSatir(r, i, pill(i))).join("")}</ol>` : ""}
      ${TBP.ele.length ? `<div class="sec" style="margin-top:20px"><h4>Elenen satırlar (${TBP.ele.length})</h4><ul class="tb-ele">${TBP.ele.slice(0, 50).map(e => `<li><span>Satır ${e.satir}</span> <b>${esc(String(e.ad).slice(0, 80))}</b> — ${esc(e.neden)}</li>`).join("")}${TBP.ele.length > 50 ? `<li>… ve ${TBP.ele.length - 50} satır daha</li>` : ""}</ul></div>` : ""}
      ${TBP.fazla ? `<p style="color:var(--mute);font-size:13.5px">Dosyadaki ilk ${TB_SATIR} satır okundu; ${TBP.fazla} satır atlandı.</p>` : ""}</div>`;
  }
  return `<div class="empty"><div class="big" aria-hidden="true">${ico(P.clip, 26)}</div><h3>Toplu briefing</h3><p style="max-width:440px">CSV'yi yükleyip önizleyin. Kaç kredi kullanılacağını gördükten sonra başlatırsınız; firmalar sırayla hazırlanır ve klasörünüze kaydedilir.</p></div>`;
}
function tbYuzde() {
  const t = TB;
  if (!t) return 0;
  const top = t.rows.filter(r => r.st !== "kredi").length;
  if (!top) return 0;
  const bitti = tbSay(t, "ok") + tbSay(t, "hata"), c = t.rows.find(r => r.st === "calis");
  const kesir = c ? Math.min(0.95, (Date.now() - Number(c.t0 || Date.now())) / 1000 / tbOrt()) : 0;
  return Math.min(100, ((bitti + kesir) / top) * 100);
}
function tbOrt() { const s = TB ? TB.rows.filter(r => r.st === "ok" && r.sure > 0).map(r => r.sure) : []; return s.length ? s.reduce((a, b) => a + b, 0) / s.length : EST.briefing; }
function tbEta() {
  const t = TB;
  if (!t) return "";
  const ok = tbSay(t, "ok"), top = t.rows.filter(r => r.st !== "kredi").length, bitti = ok + tbSay(t, "hata");
  const c = t.rows.find(r => r.st === "calis");
  if (!c && !TBRUN && !tbBaska()) return `${ok} / ${top} briefing hazır${t.durum === "bitti" ? "" : " · durduruldu"}`;
  const ort = tbOrt(), gec = c ? (Date.now() - Number(c.t0 || Date.now())) / 1000 : 0;
  const sn = tbSay(t, "bekle") * ort + Math.max(0, ort - gec);
  return `${bitti} / ${top} tamamlandı · tahmini kalan süre ${sn < 60 ? "1 dakikadan az" : `~${Math.ceil(sn / 60)} dk`}`;
}
function tbCiz() {
  if (route !== "briefing" || BRF_SEKME !== "toplu") return;
  const sol = document.getElementById("tb-sol"), out = document.getElementById("out");
  if (!sol || !out) return;
  const mod = TB ? "kuyruk" : "form";
  if (sol.dataset.mod !== mod) { sol.dataset.mod = mod; sol.innerHTML = TB ? tbKontrol() : tbForm(); if (!TB) tbFormBagla(); }
  else if (TB) sol.innerHTML = tbKontrol();
  const onay = document.getElementById("tb-onay");
  if (onay) onay.innerHTML = tbOnayHtml();
  out.innerHTML = tbSag();
  const q = sol.closest(".card")?.querySelector(".quota"), qh = quota("briefing");
  if (q && qh && q.outerHTML !== qh) q.outerHTML = qh;
}
async function tbOnizle(metin, ad, btn) {
  const m = String(metin || "");
  if (!m.trim()) return setMsg("tbm", "err", "CSV dosyası seçin ya da listeyi yapıştırın.");
  setMsg("tbm", "", "");
  busy(btn, true, "Kontrol ediliyor…");
  const o = tbAyikla(m, ad);
  const taze = await tbBenYenile();
  busy(btn, false);
  if (TB) return;
  o.kalan = tbKalan(); o.n = Math.min(o.rows.length, TB_MAX, o.kalan);
  TBP = o;
  TB_NOT = taze ? null : ["warn", "Kredi bilgisi tazelenemedi; başlatırken yeniden kontrol edilir."];
  tbCiz();
}
function tbFormBagla() {
  const f = document.getElementById("tbf");
  if (!f) return;
  let ad = "";
  f.tbt.addEventListener("input", () => { ad = ""; });
  f.tbd.onchange = () => {
    const d = f.tbd.files && f.tbd.files[0];
    if (!d) return;
    if (d.size > 512 * 1024) { f.tbd.value = ""; return setMsg("tbm", "err", "Dosya çok büyük (en fazla 512 KB). İlk satırları ayrı bir dosyaya alın."); }
    const fr = new FileReader();
    fr.onload = () => { const s = String(fr.result || ""); f.tbt.value = s.slice(0, 100000); ad = d.name; tbOnizle(s, d.name, f.querySelector("[type=submit]")); };
    fr.onerror = () => setMsg("tbm", "err", "Dosya okunamadı. Tekrar deneyin ya da içeriği yapıştırın.");
    fr.readAsText(d);
  };
  f.onsubmit = e => { e.preventDefault(); tbOnizle(f.tbt.value, ad, f.querySelector("[type=submit]")); };
}
function pageToplu(fnot) {
  tbYukle();
  toolShell("briefing", `${brfSekme()}${fnot}<div id="tb-sol"></div>`);
  bindBrfSekme();
  tbCiz();
}
// Saniyelik: ilerleme çubuğu ve tahmini süre; başka sekmede süren listeyi depodan yeniden okur
let tbOkuT = 0;
setInterval(() => {
  if (route !== "briefing" || BRF_SEKME !== "toplu" || !TB) return;
  if (!TBRUN && TB.durum === "calis" && Date.now() - tbOkuT > 3000) {
    tbOkuT = Date.now();
    const eski = JSON.stringify(TB);
    tbYukle();
    if (JSON.stringify(TB) !== eski) return tbCiz();
  }
  const b = document.querySelector("[data-tb-bar]"); if (b) b.style.width = tbYuzde().toFixed(1) + "%";
  const e = document.querySelector("[data-tb-eta]"); if (e) e.textContent = tbEta();
}, 1000);
document.addEventListener("click", e => {
  const t = e.target.closest("[data-tb]");
  if (!t || t.disabled) return;
  const a = t.dataset.tb;
  if (a === "baslat") tbBaslat(t);
  else if (a === "iptal") { TBP = null; TB_NOT = null; tbCiz(); }
  else if (a === "dur") { if (TBRUN) { TBRUN.dur = true; tbCiz(); } }
  else if (a === "devam") tbDevamSor(t);
  else if (a === "vazgec") { TB_ONAY = null; TB_NOT = null; tbCiz(); }
  else if (a === "yeni") { if (tbAktif()) return; TB = null; TBP = null; TB_ONAY = null; TB_NOT = null; store.set("toplu", null); tbCiz(); }
  else if (a === "kaydet") tbKaydetKalan(t);
  else if (a === "html" && TB) tbIndir(tbHtml(TB), tbDosyaAd(TB, "html"), "text/html;charset=utf-8");
  else if (a === "md" && TB) tbIndir(tbMd(TB), tbDosyaAd(TB, "md"), "text/markdown;charset=utf-8");
  else if (a === "ornek") tbIndir("﻿" + TB_ORNEK, "toplu-briefing-ornek.csv", "text/csv;charset=utf-8");
});
function tbSifirla(sil) {
  if (TBRUN) TBRUN.dur = true;
  TB = null; TBP = null; TB_ONAY = null; TB_NOT = null;
  if (sil) store.set("toplu", null);
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
      <div class="price"><b>₺${fmtN(fiyat)}</b><span>${Number(p.koltuk) > 1 ? `/ay · ${fmtN(p.koltuk)} kullanıcı` : "/kullanıcı/ay"}${y ? " · yıllık" : ""}</span></div>
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
  const fy = loadFY();
  try { const r = await rpc("app_takip_liste"); TK.list = Array.isArray(r) ? r : []; }
  catch (e) { TK.err = trErr(e); TK.list = []; }
  await fy;
}
// ---------- Rakip fiyat alarmı (rakip başına isteğe bağlı fiyat sayfası; kota harcamaz) ----------
// Sunucu işlevi henüz yoksa (göç uygulanmadıysa) bölüm gizlenir; panelin geri kalanı etkilenmez (rpc() yerine doğrudan sb.rpc).
let FY = { list: null, lim: 0, off: false, edit: "", sil: "", m: {} };
async function loadFY() {
  try {
    const { data, error } = await sb.rpc("app_fiyat_liste");
    if (error) { FY.off = /PGRST202|could not find the function|does not exist/i.test(`${error.code} ${error.message}`); FY.list = FY.list || []; return; }
    FY.off = false; FY.list = Array.isArray(data?.fiyatlar) ? data.fiyatlar : []; FY.lim = Number(data?.limit || 0);
  } catch { FY.list = FY.list || []; }
}
// SQL'deki eşleşmeyle aynı: firma adı, yoksa site; kırpılmış, en çok 150 karakter
const fyRakip = r => String((String(r?.firma || "").trim() || r?.site || "")).trim().slice(0, 150);
const FY_HATA = {
  bos: "Sayfa metni okunamadı. Yalnız JavaScript ile çizilen ya da bot korumalı sayfalar okunamaz.",
  zaman: "Sayfa zamanında yanıt vermedi.", baglanti: "Sayfaya ulaşılamadı.", okuma: "Sayfa okunurken bağlantı kesildi.",
  url: "Adres güvenli bulunmadı.", yonlendirme: "Sayfa çok fazla ya da geçersiz yönlendirme yapıyor.", tur: "Adres bir web sayfası değil.",
};
const fyHata = h => FY_HATA[h] || (/^http_\d{3}$/.test(h || "") ? `Sayfa hata döndürdü (${h.slice(5)}).` : "Sayfa kontrol edilemedi.");
function fyFarkHtml(fk) {
  if (!fk || typeof fk !== "object") return "";
  const ek = Array.isArray(fk.eklenen) ? fk.eklenen : [], ck = Array.isArray(fk.cikan) ? fk.cikan : [];
  const n1 = Number(fk.toplam_eklenen ?? ek.length), n2 = Number(fk.toplam_cikan ?? ck.length);
  return `<details class="fy-fark"><summary>Son değişiklik <span class="fy-ek">+${fmtN(n1)}</span> <span class="fy-ck">−${fmtN(n2)}</span>${fk.tarih ? ` <span class="tk-mute">· ${fmtDT(fk.tarih)}</span>` : ""}</summary>
    <ul>${ek.map(x => `<li class="fy-ek"><span aria-hidden="true">+</span> ${esc(x)}</li>`).join("")}${ck.map(x => `<li class="fy-ck"><span aria-hidden="true">−</span> <s>${esc(x)}</s></li>`).join("")}</ul>
    ${n1 > ek.length || n2 > ck.length ? `<p class="tk-mute" style="font-size:12.5px;margin:6px 0 0">İlk ${FY_FARK_N} eklenen ve ${FY_FARK_N} kaldırılan satır gösteriliyor; fiyat içeren satırlar önce.</p>` : ""}</details>`;
}
const FY_FARK_N = 20;
function fyDurum(f) {
  if (f.aktif === false) return `<span class="pill warn">Durduruldu</span>`;
  if (f.son_hata) return `<span class="pill bad">Okunamadı</span>`;
  if (!f.son_kontrol) return `<span class="pill">İlk kontrol bekliyor</span>`;
  if (f.son_degisim) return `<span class="pill acc">Değişti · ${esc(fmtDT(f.son_degisim))}</span>`;
  return `<span class="pill ok">Değişiklik yok</span>`;
}
function fyBolum(t) {
  if (FY.off || FY.list === null) return "";
  const rk = Array.isArray(t.rakipler) ? t.rakipler : [];
  if (!rk.length) return "";
  const kapali = ["sure", "plan"].includes(durum("takip").neden);
  const satir = (r, i) => {
    const ad = fyRakip(r), key = `${t.id}|${i}`, f = FY.list.find(x => x.takip_id === t.id && x.rakip === ad);
    const m = FY.m[key] ? msg(FY.m[key].kind, FY.m[key].html) : "";
    const ust = `<b>${esc(String(r.firma || "").trim() || ad || "Rakip")}</b>`;
    if (FY.edit === key) {
      return `<form class="fy-row fy-form" data-fy-form="${i}" novalidate><label for="fyu-${esc(key)}">${ust} <span class="hint">fiyat sayfası adresi</span></label>
        <div class="fy-in"><input class="in" id="fyu-${esc(key)}" name="u" inputmode="url" maxlength="500" placeholder="rakip.com/fiyatlar" value="${esc(FY.v ?? (f ? f.url : ""))}" required>
        <button class="btn btn-p btn-s" type="submit">Kaydet</button><button class="btn btn-g btn-s" type="button" data-fy-vaz>Vazgeç</button></div>${m}</form>`;
    }
    if (!f) {
      return `<div class="fy-row" data-fy-rk="${i}"><div class="row fy-bas">${ust}${kapali ? "" : `<button type="button" class="linkbtn" data-fy-duz>+ Fiyat sayfası ekle</button>`}</div>${m}</div>`;
    }
    const u = safeUrl(f.url), goster = u ? (new URL(u).hostname.replace(/^www\./, "") + new URL(u).pathname.replace(/\/$/, "")).slice(0, 70) : "";
    const sil = FY.sil === key;
    return `<div class="fy-row" data-fy-rk="${i}">
      <div class="row fy-bas"><span class="row" style="gap:8px;justify-content:flex-start">${ust}${fyDurum(f)}</span>
        ${sil ? `<span class="row" style="gap:8px"><span style="font-size:13.5px">Fiyat alarmı kaldırılsın mı?</span><button type="button" class="btn btn-s" data-fy-silok style="background:var(--bad);color:#fff">Kaldır</button><button type="button" class="btn btn-g btn-s" data-fy-silno>Vazgeç</button></span>`
        : `<span class="row" style="gap:10px">${kapali ? "" : `<button type="button" class="linkbtn" data-fy-duz>Düzenle</button>`}<button type="button" class="linkbtn" data-fy-sil style="color:var(--bad)">Kaldır</button></span>`}</div>
      ${u ? `<a class="fy-url" href="${esc(u)}" target="_blank" rel="noopener nofollow">${esc(goster)}</a>` : ""}
      <div class="tk-meta"><span>Son kontrol: <b>${esc(fmtDT(f.son_kontrol))}</b></span><span>Son değişim: <b>${esc(fmtDT(f.son_degisim))}</b></span></div>
      ${f.son_hata ? `<p class="tk-mute" style="font-size:13px;margin:4px 0 0">${esc(fyHata(f.son_hata))}${f.aktif === false ? " Kontrol durduruldu; adresi düzenleyip kaydederek yeniden başlatabilirsiniz." : ""}</p>` : !f.son_kontrol ? `<p class="tk-mute" style="font-size:13px;margin:4px 0 0">İlk kontrol bir saat içinde yapılır ve sayfanın ilk görüntüsü kaydedilir; değişiklik olursa e-postanıza bildirim gelir.</p>` : ""}
      ${fyFarkHtml(f.son_fark)}${m}</div>`;
  };
  return `<details class="tk-son tk-fy"${FY.edit.startsWith(t.id + "|") || FY.sil.startsWith(t.id + "|") || Object.keys(FY.m).some(k => k.startsWith(t.id + "|")) ? " open" : ""}><summary>Fiyat alarmı <span class="tk-mute" style="font-weight:400;font-size:13px">· ${rk.filter(r => FY.list.some(x => x.takip_id === t.id && x.rakip === fyRakip(r))).length} / ${rk.length} rakip</span></summary>
    <div class="tk-body"><p class="tk-mute" style="font-size:13px;margin:0 0 10px">Rakibin fiyat sayfası her gün kontrol edilir; fiyat ya da paket satırları değişince hemen e-posta alırsınız. Kullanım hakkınızdan düşmez.</p>${rk.map(satir).join("")}</div></details>`;
}
async function fyKaydet(form, t, i) {
  const key = `${t.id}|${i}`, ad = fyRakip((t.rakipler || [])[i]), u = normUrl(form.u.value);
  const btn = form.querySelector("[type=submit]");
  FY.v = form.u.value;
  if (!u) { FY.m[key] = { kind: "err", html: "Geçerli bir adres girin (ör. rakip.com/fiyatlar)." }; return render(); }
  busy(btn, true, "Kaydediliyor…");
  try {
    const { data: r, error } = await sb.rpc("app_fiyat_ekle", { p_takip_id: t.id, p_rakip: ad, p_url: u });
    if (error) throw error;
    if (r && r.ok === false) {
      const m = { sure: NEDEN.sure(), plan: NEDEN.plan("takip"), url: "Bu adres kabul edilmedi. Herkese açık bir web sayfası adresi girin (ör. https://rakip.com/fiyatlar).", yok: "Bu takip bulunamadı; sayfayı yenileyin.", rakip: "Bu rakip takipte bulunamadı; sayfayı yenileyin.", kota: `Planınızla en fazla ${r.limit ?? FY.lim} fiyat sayfası izlenebilir.` };
      FY.m[key] = { kind: "err", html: esc(m[r.neden] || "Kaydedilemedi.") + (r.neden === "kota" || r.neden === "plan" ? ` <a href="#/fiyatlar">Planlar →</a>` : "") };
    } else { FY.edit = ""; FY.v = undefined; delete FY.m[key]; await loadFY(); toast("Fiyat alarmı kaydedildi ✓"); }
  } catch (err) { FY.m[key] = { kind: "err", html: esc(trErr(err)) }; }
  if (route === "takip") render();
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
// Kaynağın insan için açılacak adresi: kayıtlı url yoksa (eski sonuç) takipteki rakip ayarından bulunur
function tkKaynakUrl(r, cfg) {
  const u = safeUrl(r.url);
  if (u) return u;
  const c = (Array.isArray(cfg) ? cfg : []).find(x => x && x.firma === r.firma) || {};
  if (r.kaynak === "LinkedIn") { const l = safeUrl(c.linkedin); return l ? l.replace(/\/?$/, "/") + "posts/" : ""; }
  return safeUrl(c.site) || safeUrl(c.feed);
}
function tkListe(l) {
  return `<ul class="tk-items">${l.slice(0, 8).map(x => { const u = safeUrl(x.link); return `<li>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(x.title || u)}</a>` : esc(x.title || "")}${x.tarih ? ` <span class="tk-mute">· ${fmtD(x.tarih)}</span>` : ""}</li>`; }).join("")}</ul>`;
}
// r.toplam kaynakta taranan kayıt sayısıdır; "yeni içerik" yalnız dönem içindeki items'tan sayılır
function tkSonuc(s, cfg) {
  if (!s) return `<p class="tk-mute">Henüz tarama yapılmadı. İlk tarama planlanan saatte otomatik çalışır.</p>`;
  if (s.hata) return msg("err", `Son tarama tamamlanamadı: ${esc(s.hata)}`);
  const rk = Array.isArray(s.rakipler) ? s.rakipler : [], gun = Number(s.gun) || 7;
  return `${s.yorum_html ? `<div class="tk-yorum">${tkHtml(s.yorum_html)}</div>` : ""}
  ${rk.map(r => {
    const it = Array.isArray(r.items) ? r.items : [], on = Array.isArray(r.onceki) ? r.onceki : [];
    const ku = tkKaynakUrl(r, cfg), n = Number(r.toplam) || 0;
    const bos = `Son ${gun} günde yeni paylaşım yok.`;
    const govde = r.ok === false ? ""
      : it.length ? tkListe(it)
      : on.length ? `<p class="tk-mute" style="font-size:13px">${bos} Kaynaktaki son içerikler:</p>${tkListe(on)}`
      : n ? `<p class="tk-mute" style="font-size:13px">${bos} Kaynakta ${esc(String(n))} içerik tarandı; son içerikler bir sonraki taramadan itibaren burada listelenecek.</p>`
      : `<p class="tk-mute" style="font-size:13px">${bos}</p>`;
    return `<div class="tk-rk"><div class="row" style="justify-content:flex-start;gap:8px;flex-wrap:wrap"><b>${esc(r.firma || "Rakip")}</b>
      ${r.ok === false ? `<span class="pill bad">Okunamadı</span>` : `<span class="pill${it.length ? " ok" : ""}">${it.length ? `${esc(String(it.length))} yeni içerik` : "Yeni içerik yok"}</span>`}${r.kaynak ? `<span class="tk-mute" style="font-size:12.5px">${esc(r.kaynak)}</span>` : ""}${ku ? `<a class="btn btn-g btn-s" style="margin-left:auto" href="${esc(ku)}" target="_blank" rel="noopener">${it.length || on.length ? "Kaynağı aç" : "İçeriklere git"}</a>` : ""}</div>
      ${r.error ? `<p class="tk-mute" style="font-size:13px">${esc(r.error)}</p>` : ""}
      ${govde}</div>`;
  }).join("")}
  ${s.tarih ? `<p class="tk-mute" style="font-size:12.5px">Tarama: ${fmtDT(s.tarih)}${s.mail === "E-posta gönderildi." ? " · Özet e-postanıza gönderildi" : ""}</p>` : ""}`;
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
    <details class="tk-son"><summary>Son tarama sonucu${t.son_sonuc && (t.son_sonuc.tarih || t.son_calisma) ? `<span class="tk-mute" style="float:right;font-weight:400;font-size:12.5px">${fmtDT(t.son_sonuc.tarih || t.son_calisma)}</span>` : ""}</summary><div class="tk-body">${tkSonuc(t.son_sonuc, t.rakipler)}</div></details>
    ${fyBolum(t)}
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
    <p class="tk-mute" style="font-size:13px;margin-top:16px">Her firma haftada bir otomatik taranır. İsterseniz “Şimdi tara” ile elle de başlatabilirsiniz (firma başına 20 saatte bir).</p>
    ${gecmisKutu("takip")}`);
  gecmisYukle("takip");
  const main = document.querySelector(".main");
  main.onclick = async e => {
    const el = e.target.closest("[data-tk-new],[data-tk-edit],[data-tk-sil],[data-tk-silno],[data-tk-silok],[data-tk-run],[data-tk-yenile],[data-fy-duz],[data-fy-vaz],[data-fy-sil],[data-fy-silno],[data-fy-silok]");
    if (!el || el.disabled) return;
    const id = el.closest("[data-tk-id]")?.dataset.tkId;
    const t = id && (TK.list || []).find(x => x.id === id);
    const fyI = el.closest("[data-fy-rk],[data-fy-form]"), fyKey = fyI && id ? `${id}|${fyI.dataset.fyRk ?? fyI.dataset.fyForm}` : "";
    if (fyKey) {
      if (el.hasAttribute("data-fy-duz")) { FY.edit = fyKey; FY.sil = ""; FY.v = undefined; delete FY.m[fyKey]; render(); document.getElementById(`fyu-${fyKey}`)?.focus(); }
      else if (el.hasAttribute("data-fy-vaz")) { FY.edit = ""; FY.v = undefined; delete FY.m[fyKey]; render(); }
      else if (el.hasAttribute("data-fy-sil")) { FY.sil = fyKey; delete FY.m[fyKey]; render(); }
      else if (el.hasAttribute("data-fy-silno")) { FY.sil = ""; render(); }
      else if (el.hasAttribute("data-fy-silok") && t) {
        const f = (FY.list || []).find(x => x.takip_id === t.id && x.rakip === fyRakip((t.rakipler || [])[+fyKey.split("|")[1]]));
        busy(el, true, "Kaldırılıyor…");
        try { if (f) { const { error } = await sb.rpc("app_fiyat_sil", { p_id: f.id }); if (error) throw error; } FY.sil = ""; await loadFY(); toast("Fiyat alarmı kaldırıldı"); }
        catch (err) { FY.sil = ""; FY.m[fyKey] = { kind: "err", html: esc(trErr(err)) }; }
        if (route === "takip") render();
      }
      return;
    }
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
      if (r.success) {
        TK.run[id] = { kind: "ok", html: r.takip && r.takip.mail !== "E-posta gönderildi." ? `Tarama tamamlandı. Sonuç aşağıda${r.takip.count ? "." : "; son 7 günde yeni içerik olmadığı için e-posta gönderilmedi."}` : "Tarama tamamlandı. Sonuç aşağıda; özet e-postanıza da gönderildi." }; await loadTK();
        const tt = (TK.list || []).find(x => x.id === id);
        if (tt && tt.son_sonuc && !tt.son_sonuc.hata) gecmisKaydet("takip", { title: tt.firma }, tt.son_sonuc);
      }
      else TK.run[id] = { kind: r.neden === "erken" ? "warn" : "err", html: esc(r.message || "Tarama başlatılamadı.") + (r.ne_zaman ? ` Bir sonraki elle tarama: <b>${fmtDT(r.ne_zaman)}</b>.` : "") };
      if (route === "takip") { render(); document.querySelector(`[data-tk-id="${CSS.escape(id)}"] details`)?.setAttribute("open", ""); }
    }
  };
  main.onsubmit = e => {
    const fm = e.target.closest?.("[data-fy-form]");
    if (!fm) return;
    e.preventDefault();
    const t = (TK.list || []).find(x => x.id === fm.closest("[data-tk-id]")?.dataset.tkId);
    if (t) fyKaydet(fm, t, +fm.dataset.fyForm);
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
// Deneme hatırlatma e-postaları tercihi (yalnız deneme planında görünür; okunamazsa bölüm gizlenir)
let BILD = { v: undefined, yuk: false };
function bildBolum(b) {
  if (b.plan !== "deneme" || !b.aktif || BILD.v === null) return "";
  return `<section class="card pad" id="bild-sec"><h3 style="margin-bottom:10px">E-posta bildirimleri</h3>
      <label style="display:flex;gap:8px;align-items:center;font-weight:500"><input type="checkbox" id="bild-dh" ${BILD.v !== false ? "checked" : ""} ${BILD.v === undefined ? "disabled" : ""}> Deneme hatırlatma e-postaları</label>
      <p style="color:var(--mute);font-size:14px;margin-top:6px">Denemenizin 1., 7., 12. ve 14. gününde ilk adımlar, henüz denemediğiniz araçlar ve planlar hakkında kısa birer e-posta gönderilir.</p></section>`;
}
function bindBild() {
  const cb = document.getElementById("bild-dh");
  if (!cb) return;
  const uygula = () => {
    const sec = document.getElementById("bild-sec"), c = document.getElementById("bild-dh");
    if (!sec || !c) return;
    if (BILD.v === null) { sec.remove(); return; }
    c.checked = BILD.v !== false; c.disabled = BILD.v === undefined;
  };
  if (BILD.v === undefined && !BILD.yuk) {
    BILD.yuk = true;
    sb.rpc("app_bildirim").then(({ data, error }) => { BILD.v = error || !data ? null : data.deneme_hatirlat !== false; }, () => { BILD.v = null; })
      .finally(() => { BILD.yuk = false; uygula(); });
  }
  cb.onchange = async () => {
    const v = cb.checked;
    cb.disabled = true;
    try {
      const { data, error } = await sb.rpc("app_bildirim", { p_deneme: v });
      if (error || !data) throw error || new Error("yok");
      BILD.v = data.deneme_hatirlat !== false;
      toast(BILD.v ? "Deneme hatırlatmaları açıldı ✓" : "Deneme hatırlatmaları kapatıldı");
    } catch { cb.checked = !v; toast("Tercih kaydedilemedi; biraz sonra tekrar deneyin."); }
    cb.disabled = false;
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
    ${ekipBolum()}
    <section class="card pad"><div class="row" style="margin-bottom:6px"><h3>Fireflies bağlantısı</h3><span class="pill ${b.fireflies ? "ok" : ""}">${b.fireflies ? "Bağlı" : "Bağlı değil"}</span></div>
      ${b.fireflies ? `<p style="color:var(--mute);margin-bottom:14px">Toplantı analizi için Fireflies hesabınız bağlı. Anahtarı değiştirmek için yenisini kaydedin.</p><div id="fkm"></div><div class="row" style="justify-content:flex-start"><button class="btn btn-d btn-s" id="ffdel">Bağlantıyı kaldır</button></div><details style="margin-top:14px"><summary style="cursor:pointer;font-weight:600">Anahtarı değiştir</summary><div style="margin-top:12px">${ffConnect(true)}</div></details>` : ffConnect(true)}
    </section>
    ${payBolum()}
    ${bildBolum(b)}
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
  bindBild();
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
  const tabs = `<div class="tabs adm-tabs" role="tablist"><button type="button" role="tab" aria-selected="${ADM.tab === "kul"}" data-atab="kul">Kullanıcılar${rows ? ` (${fmtN(rows.length)})` : ""}</button><button type="button" role="tab" aria-selected="${ADM.tab === "ilt"}" data-atab="ilt">İletişim formları${yeniSay ? ` <span class="pill bad">${fmtN(yeniSay)} yeni</span>` : ""}</button><button type="button" role="tab" aria-selected="${ADM.tab === "mail"}" data-atab="mail">E-posta kayıtları</button></div>`;
  let body;
  if (ADM.tab === "mail") {
    const ml = ADM.mail, TUR = { d1: "1. gün · hoş geldiniz", d7: "7. gün · yarı yol", d12: "12. gün · 2 gün kaldı", d14: "14. gün · son gün" };
    const turAd = t => TUR[t] || t;
    body = `<section class="card"><div class="res-h adm-bar"><h3>Deneme hatırlatma e-postaları</h3></div>
    ${ADM.mailErr ? `<div class="res-b">${msg("err", esc(ADM.mailErr))}</div>` : !ml ? `<div class="empty"><div class="spin"></div></div>` : `<div class="res-b">
      <p style="color:var(--mute);margin:0 0 12px;font-size:14px">Her gün 07:05 UTC'de (10:05 TSİ) deneme planındaki kullanıcılara 1., 7., 12. ve 14. günde birer e-posta gider; aynı e-posta ikinci kez gönderilmez. Hatırlatmalardan çıkan: <b>${fmtN(ml.cikan || 0)}</b></p>
      <h4 style="margin:0 0 8px">Bugünkü adaylar (${fmtN((ml.aday || []).length)})</h4>
      ${(ml.aday || []).length ? `<div class="scroll-x"><table class="tbl"><thead><tr><th>Kullanıcı</th><th>E-posta</th><th>Deneme günü</th></tr></thead><tbody>${ml.aday.map(a => `<tr><td>${esc(a.email)}</td><td>${esc(turAd(a.tur))}</td><td>${esc(a.gun)}</td></tr>`).join("")}</tbody></table></div>` : `<p style="color:var(--mute);margin:0 0 4px">Bugün gönderilecek hatırlatma yok.</p>`}
      <h4 style="margin:18px 0 8px">Son gönderimler</h4>
      ${(ml.log || []).length ? `<div class="scroll-x"><table class="tbl"><thead><tr><th>Kullanıcı</th><th>E-posta</th><th>Durum</th><th>Zaman</th></tr></thead><tbody>${ml.log.map(l => `<tr><td>${esc(l.email || "Silinmiş hesap")}${l.plan ? `<br><span class="adm-sub">${esc(l.plan)}</span>` : ""}</td><td>${esc(turAd(l.tur))}</td><td><span class="pill ${l.durum === "gonderildi" ? "ok" : "warn"}">${l.durum === "gonderildi" ? "Gönderildi" : "Bekliyor"}</span></td><td style="font-size:13px">${fmtDT(l.gonderim)}</td></tr>`).join("")}</tbody></table></div>` : `<p style="color:var(--mute);margin:0">Henüz gönderilmiş hatırlatma yok.</p>`}
    </div>`}</section>`;
  } else if (ADM.tab === "ilt") {
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
  document.getElementById("ayen").onclick = async e => { busy(e.currentTarget, true, "Yenileniyor…"); ADM.rows = null; ADM.ilt = null; ADM.mail = null; ADM.mailErr = ""; await Promise.all([loadAdm(), loadIlt(), ADM.tab === "mail" ? loadMail() : null]); if (route === "admin") pageAdmin(); };
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
  } else if (ADM.tab !== "mail") {
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
  const mailYukle = ADM.tab === "mail" && !ADM.mail && !ADM.mailErr && !ADM.mailYuk;
  if ((!rows && !ADM.err) || (!ilt && !ADM.iltErr) || mailYukle) {
    await Promise.all([!rows && !ADM.err ? loadAdm() : null, !ilt && !ADM.iltErr ? loadIlt() : null, rows ? null : loadPlanlar(), mailYukle ? loadMail() : null]);
    if (route === "admin") pageAdmin();
  }
}
async function loadMail() {
  ADM.mailYuk = true;
  try {
    const { data, error } = await sb.rpc("app_admin_mail_log");
    if (error) throw error;
    ADM.mail = data || { log: [], aday: [], cikan: 0 }; ADM.mailErr = "";
  } catch (e) { ADM.mailErr = trErr(e); }
  ADM.mailYuk = false;
}
async function loadAdm() {
  try { ADM.rows = (await rpc("app_admin_liste")) || []; ADM.err = ""; }
  catch (e) { ADM.err = trErr(e); }
}
async function loadIlt() {
  try { ADM.ilt = (await rpc("app_admin_iletisim")) || []; ADM.iltErr = ""; }
  catch (e) { ADM.iltErr = trErr(e); }
}

const PAGES = { giris: pageGiris, kayit: pageKayit, sifre: pageSifre, "yeni-sifre": pageYeniSifre, panel: pagePanel, rakip: pageRakip, sekans: pageSekans, seo: pageSeo, briefing: pageBriefing, fireflies: pageFireflies, takip: pageTakip, fiyatlar: pageFiyatlar, hesap: pageHesap, admin: pageAdmin, ozel: pageOzel, davet: pageDavet, klasor: pageKlasor };

// ---------- Genel olaylar ----------
document.addEventListener("focusin", e => { if (e.target.matches?.("[data-pay-in]")) e.target.select(); });
document.addEventListener("click", e => {
  if (e.target.closest("a[data-teklif]")) try { sessionStorage.setItem("sc_app_ret", location.pathname + location.hash); } catch {}
});
document.addEventListener("click", async e => {
  const t = e.target.closest("[data-go],[data-eye],[data-side],[data-menu],[data-logout],[data-firma-yenile],[data-copy],[data-copy-el],[data-reset],[data-exp],[data-paylas],[data-pay-kapat],[data-pay-yenile],[data-gecmis-ac],[data-gecmis-yenile],[data-gecmis-kapat],.nav a,#seo-show,#seo-dl");
  if (!t) return;
  if (t.dataset.go) { e.preventDefault(); go(t.dataset.go); }
  else if (t.dataset.eye) { const i = document.getElementById(t.dataset.eye); const show = i.type === "password"; i.type = show ? "text" : "password"; t.textContent = show ? "Gizle" : "Göster"; t.setAttribute("aria-label", show ? "Şifreyi gizle" : "Şifreyi göster"); }
  else if (t.hasAttribute("data-side")) {
    const sh = document.getElementById("shell");
    if (!sh) return;
    sh.classList.remove("open");
  }
  else if (t.hasAttribute("data-menu")) document.getElementById("shell")?.classList.toggle("open");
  else if (t.hasAttribute("data-logout")) { tbSifirla(true); await sb.auth.signOut(); S.session = null; S.ben = null; FIRMA = { v: undefined, yuk: false, err: "" }; LOGO_YENI = null; BILD = { v: undefined, yuk: false }; ADM = { rows: null, err: "", q: "" }; FF = { list: null, err: "", sel: "" }; TK = { list: null, err: "", edit: null, sil: "", run: {} }; PAY = { list: null, err: "", yuk: false }; EKIP = ekipBos(); KLASOR = klasorBos(); DAVET = { sonuc: null }; gecmisSifirla(); go("giris"); }
  else if (t.hasAttribute("data-firma-yenile")) { FIRMA = { v: undefined, yuk: false, err: "" }; render(); }
  else if (t.dataset.paylas) paylas(t.dataset.paylas, t);
  else if (t.dataset.payKapat) payKapat(t.dataset.payKapat, t);
  else if (t.hasAttribute("data-pay-yenile")) { PAY = { list: null, err: "", yuk: false }; payCiz(); }
  else if (t.dataset.copy || t.dataset.copyEl) {
    const txt = t.dataset.copy || document.getElementById(t.dataset.copyEl)?.innerText || "";
    try { await navigator.clipboard.writeText(txt); toast("Kopyalandı ✓"); } catch { toast("Kopyalanamadı; metni seçip kopyalayın."); }
  }
  else if (t.dataset.exp) skExport(t.dataset.exp);
  else if (t.dataset.reset) { const k = t.dataset.reset; delete JOBS[k]; GM_OTO[k] = true; saveJobs(); render(); }
  else if (t.dataset.gecmisAc) gecmisAc(t.dataset.gecmisMod, t.dataset.gecmisAc, { btn: t });
  else if (t.dataset.gecmisYenile) { const k = t.dataset.gecmisYenile; delete GECMIS[k]; if (k === "*") panelGecmis(); else { const el = document.querySelector("#gecmis [data-gm-list]"); if (el) el.innerHTML = gmListeHtml(k); gecmisYukle(k); } }
  else if (t.hasAttribute("data-gecmis-kapat")) { GM_TK = null; render(); }
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
  if (ev === "SIGNED_OUT") { tbSifirla(false); S.ben = null; FIRMA = { v: undefined, yuk: false, err: "" }; LOGO_YENI = null; BILD = { v: undefined, yuk: false }; PAY = { list: null, err: "", yuk: false }; EKIP = ekipBos(); KLASOR = klasorBos(); DAVET = { sonuc: null }; gecmisSifirla(); if (route &&!AUTH_ROUTES.has(route)) setTimeout(render, 0); }
});
{
  const { data } = await sb.auth.getSession();
  S.session = data.session;
  if (S.session) await loadBen();
  if (/access_token|error_description|[?#&]type=/.test(initialHash))
    history.replaceState(null, "", location.pathname + location.search + "#/" + (S.recovery && S.session ? "yeni-sifre" : S.session ? sonraki() : "giris"));
  window.addEventListener("hashchange", render);
  render();
  for (const k of Object.keys(JOBS)) if (JOBS[k].state === "run") poll(k); else if (S.session && JOBS[k].state === "err" && !JOBS[k].iade) iade(k, JOBS[k]);
}
