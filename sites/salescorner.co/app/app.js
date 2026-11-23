// Sales Corner — SaaS paneli (app.salescorner.co ve salescorner.co/app/)
// Oturum Supabase'de; kota/plan kontrolü sunucuda (Supabase RPC + worker /api/app/*). Bu dosya yalnızca arayüzdür.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

// ---------- Modüller ----------
const MODS = [
  { k: "rakip", ad: "Rakip Analizi", ic: "🎯", bg: "#eef0ff", d: "Rakip sitelerinizi tarar, güçlü/zayıf yönleri karşılaştırır ve hazır bir sunum çıkarır." },
  { k: "sekans", ad: "Sekans Yazarı", ic: "✍️", bg: "#fdf2f8", d: "Hedef firmaya özel cold call senaryosu ve LinkedIn mesaj sekansı yazar." },
  { k: "seo", ad: "SEO Analizi", ic: "📈", bg: "#ecfdf3", d: "SEO puanı, eksikler, anahtar kelime hacimleri ve hazır içerik önerisi." },
  { k: "briefing", ad: "Toplantı Briefingi", ic: "🗂️", bg: "#fffbeb", d: "Görüşme öncesi firma ve kişi araştırması, fırsat puanı ve briefing sunumu." },
  { k: "fireflies", ad: "Toplantı Analizi", ic: "🎙️", bg: "#f0f9ff", d: "Fireflies kayıtlarınızı satış koçu gözüyle puanlar; itirazlar, BANT ve takip e-postası." },
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
const PLAN_FALLBACK = [
  { kod: "deneme", ad: "Deneme (14 gün)", aylik_tl: 0, koltuk: 1, kota: { rakip: 3, sekans: 5, seo: 5, briefing: 5, fireflies: 3 } },
  { kod: "baslangic", ad: "Başlangıç", aylik_tl: 1490, koltuk: 1, kota: { rakip: 10, sekans: 30, seo: 20, briefing: 20 } },
  { kod: "profesyonel", ad: "Profesyonel", aylik_tl: 3490, koltuk: 1, kota: { rakip: 40, sekans: 150, seo: 80, briefing: 100, fireflies: 40 } },
  { kod: "ekip", ad: "Ekip", aylik_tl: 8990, koltuk: 5, kota: { rakip: 150, sekans: 600, seo: 300, briefing: 400, fireflies: 200 } },
  { kod: "ozel", ad: "Özel AI", aylik_tl: null, koltuk: 0, kota: { rakip: -1, sekans: -1, seo: -1, briefing: -1, fireflies: -1 } },
];
const PLAN_META = {
  baslangic: { d: "Tek başına satış yapanlar için temel araçlar." },
  profesyonel: { d: "Aktif satış yapan profesyoneller için tam paket.", hot: true },
  ekip: { d: "Satış ekipleri için yüksek kota.", ek: ["5 kullanıcıya kadar", "Öncelikli destek"] },
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
  ];
  for (const [rx, t] of map) if (rx.test(m)) return t;
  return m || "Beklenmeyen bir hata oluştu.";
}

// "SEO Analizi" → "SEO analizi": kısaltmalar büyük harf kalır
const kucuk = s => s.split(" ").map(w => w.length > 1 && w === w.toLocaleUpperCase("tr-TR") ? w : w.toLocaleLowerCase("tr-TR")).join(" ");

// ---------- Sunucu çağrıları ----------
async function rpc(fn, args) {
  const { data, error } = await sb.rpc(fn, args || {});
  if (error) {
    if (/PGRST202|could not find the function|does not exist/i.test(`${error.code} ${error.message}`)) S.setupErr = true;
    throw error;
  }
  return data;
}
async function loadBen() {
  try { S.ben = await rpc("app_ben"); S.benErr = ""; S.setupErr = false; }
  catch (e) { S.ben = null; S.benErr = trErr(e); }
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
  const lim = Number((b.kota || {})[k] ?? 0), kul = Number((b.kullanim || {})[k] || 0);
  if (!b.aktif) return { ok: false, neden: "sure", lim, kul };
  if (!lim) return { ok: false, neden: "plan", lim, kul };
  if (lim > 0 && kul >= lim) return { ok: false, neden: "kota", lim, kul };
  return { ok: true, lim, kul };
}
const NEDEN = {
  sure: () => (S.ben?.plan === "deneme" ? "14 günlük deneme süreniz doldu." : "Plan süreniz doldu."),
  plan: k => `${MOD[k]?.ad || "Bu araç"} mevcut planınıza dahil değil.`,
  kota: k => `Bu ayki ${MOD[k]?.ad || ""} kullanım hakkınız doldu.`,
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
    if (Date.now() - j.t0 > 12 * 60e3) { j.state = "err"; j.err = "İşlem beklenenden uzun sürdü. Lütfen tekrar deneyin; hakkınız iade edilmezse bize yazın."; break; }
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
  if (JOBS[k] === j) {
    if (j.state === "done") toast(`${MOD[k].ad} hazır ✓`);
    if (route === k) render(); else if (S.ben && $app.querySelector(".shell")) render();
  }
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
const TITLES = { giris: "Giriş", kayit: "Kayıt ol", sifre: "Şifre sıfırlama", "yeni-sifre": "Yeni şifre", panel: "Panel", rakip: "Rakip Analizi", sekans: "Sekans Yazarı", seo: "SEO Analizi", briefing: "Toplantı Briefingi", fireflies: "Toplantı Analizi", fiyatlar: "Fiyatlar", hesap: "Hesabım", admin: "Yönetim" };

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
      <ul class="feat">${MODS.map(m => `<li><i aria-hidden="true">${m.ic}</i><div><b>${esc(m.ad)}</b><span>${esc(m.d)}</span></div></li>`).join("")}</ul>
    </div>
    <small>© ${new Date().getFullYear()} Sales Corner · <a href="${SITE}/kvkk" style="color:inherit">KVKK</a> · <a href="${SITE}/gizlilik-politikasi" style="color:inherit">Gizlilik</a> · <a href="${SITE}/cerez-politikasi" style="color:inherit">Çerez Politikası</a></small>
  </aside>
  <main class="auth-main"><div class="auth-card">
    <a class="brand" href="${SITE}/">${LOGO}</a>
    ${inner}
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
async function pageKayit() {
  const deneme = (S.planlar || PLAN_FALLBACK).find(p => p.kod === "deneme") || PLAN_FALLBACK[0];
  const q = deneme.kota || {};
  const ozet = MODS.filter(m => q[m.k]).map(m => `${q[m.k]} ${kucuk(m.ad)}`).join(", ");
  authLayout(`<h2>14 gün ücretsiz deneyin</h2><p class="sub">Kredi kartı gerekmez. Dakikalar içinde ilk analizinizi alın.</p>${tabs("kayit")}
  <div class="trial-note"><span aria-hidden="true">🎁</span><span>Denemede bütün araçlar açık: ${esc(ozet)}.</span></div>
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
  if (!S.planlar) loadPlanlar().then(() => { if (route === "kayit" && !document.getElementById("f").hidden && !document.getElementById("em").value) pageKayit(); });
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
    if (error && /rate|too many|security purposes/i.test(error.message)) return setMsg("m", "err", esc(trErr(error)));
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
const ICON_SIDE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>`;
function shell(content) {
  const b = S.ben, name = b.ad || b.email;
  const nav = (n, ic, ad, extra = "") => `<a href="#/${n}" title="${esc(ad)}"${n === route ? ' aria-current="page"' : ""}><span class="ic" aria-hidden="true">${ic}</span><span class="lb">${esc(ad)}</span>${extra}</a>`;
  const badge = k => (JOBS[k]?.state === "run" ? '<span class="lock" title="Hazırlanıyor"><span class="spin s"></span></span>' : durum(k).neden === "plan" ? '<span class="lock" title="Planınıza dahil değil">🔒</span>' : "");
  const kalan = daysLeft(b.bitis);
  $app.innerHTML = `<div class="shell${store.get("side_mini", false) ? " mini" : ""}" id="shell">
  <aside class="side" aria-label="Menü">
    <div class="side-head"><button class="iconbtn side-tog" type="button" data-side aria-label="Menüyü daralt" title="Menüyü daralt / genişlet">${ICON_SIDE}</button><a class="brand" href="#/panel">${LOGO}</a></div>
    <nav class="nav">
      ${nav("panel", "🏠", "Panel")}
      <div class="nav-h">Araçlar</div>
      ${MODS.map(m => nav(m.k, m.ic, m.ad, badge(m.k))).join("")}
      <div class="nav-h">Hesap</div>
      ${nav("fiyatlar", "💎", "Planlar ve fiyatlar")}
      ${nav("hesap", "⚙️", "Hesabım")}
      ${b.admin ? nav("admin", "🛡️", "Yönetim") : ""}
    </nav>
    <div class="side-foot">
      <div class="plan-box"><b>${esc(b.plan_ad || b.plan)}</b><span>${!b.aktif ? "Süre doldu" : b.plan === "deneme" ? `Denemede ${kalan} gün kaldı` : `Geçerlilik: ${fmtD(b.bitis)}`}</span>
        ${b.plan !== "ozel" ? `<a class="btn btn-p btn-s btn-w" href="#/fiyatlar">${b.plan === "deneme" || !b.aktif ? "Plan seç" : "Planı yükselt"}</a>` : ""}</div>
      <div class="me"><span class="av" aria-hidden="true">${esc(initials(name))}</span><div class="t" title="${esc(b.email)}"><b>${esc(name)}</b><span>${esc(b.email)}</span></div><button class="iconbtn" data-logout title="Çıkış yap" aria-label="Çıkış yap">${ICON_OUT}</button></div>
    </div>
  </aside>
  <div>
    <div class="scrim" data-menu></div>
    <header class="top"><button class="iconbtn" data-menu aria-label="Menüyü aç">☰</button><a class="brand" href="#/panel">${LOGO}</a><span class="av" aria-hidden="true">${esc(initials(name))}</span></header>
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
  let banner = "";
  if (!b.aktif) banner = `<div class="banner end"><div><b>${esc(NEDEN.sure())}</b><br><span>Araçları kullanmaya devam etmek için bir plan seçin; verileriniz ve geçmişiniz korunur.</span></div><a class="btn btn-p" href="#/fiyatlar">Planları gör</a></div>`;
  else if (b.plan === "deneme") banner = `<div class="banner trial"><div><b>Ücretsiz denemenizin bitmesine ${kalan} gün kaldı.</b><br><span>Bütün araçları deneyin; devam etmek istediğinizde size uygun planı seçin.</span></div><a class="btn btn-g" href="#/fiyatlar">Planları gör</a></div>`;
  const run = MODS.filter(m => JOBS[m.k]?.state === "run");
  const hist = store.get("hist", []);
  const card = m => {
    const d = durum(m.k), lim = d.lim, pct = lim > 0 ? Math.min(100, (d.kul / lim) * 100) : 0;
    const foot = d.neden === "plan" ? `<span class="pill">🔒 Planınıza dahil değil</span><span>Planı yükselt →</span>`
      : lim < 0 ? `<span class="pill ok">Sınırsız</span><span>Aç →</span>`
      : `<div class="meter${d.kul >= lim ? " full" : ""}" aria-hidden="true"><i style="width:${pct}%"></i></div><span>${d.kul} / ${lim} bu ay</span>`;
    return `<a class="card mod${d.ok ? "" : " off"}" href="#/${d.neden === "plan" ? "fiyatlar" : m.k}">
      <div class="row" style="justify-content:flex-start"><span class="mi" style="background:${m.bg}" aria-hidden="true">${m.ic}</span><h3>${esc(m.ad)}</h3>${JOBS[m.k]?.state === "run" ? '<span class="pill acc" style="margin-left:auto"><span class="spin s"></span>Hazırlanıyor</span>' : ""}</div>
      <p>${esc(m.d)}</p><div class="foot">${foot}</div></a>`;
  };
  shell(`${ph(`Merhaba${ad ? ", " + esc(ad) : ""} 👋`, "Bugün hangi satış işini hızlandıralım?")}
  ${banner}
  ${b.admin ? msg("info", `🛡️ Yönetici hesabıyla girdiniz. <a href="#/admin">Kullanıcılar ve planlar</a> · <a href="${SITE}/dashboard">Eski panele dön</a>`) : ""}
  ${run.map(m => msg("info", `<span class="spin s"></span><span><b>${esc(m.ad)}</b> arka planda hazırlanıyor. Bu sekme açık kaldığı sürece devam eder. <a href="#/${m.k}">İzle →</a></span>`)).join("")}
  <div class="stats">
    <div class="card stat"><span>Plan</span><b>${esc(b.plan_ad || b.plan)}</b></div>
    <div class="card stat"><span>${b.plan === "deneme" ? "Deneme bitişi" : "Geçerlilik"}</span><b>${b.aktif ? fmtD(b.bitis) : "Süre doldu"}</b></div>
    <div class="card stat"><span>Bu ay yapılan işlem</span><b>${fmtN(toplam)}</b></div>
    <div class="card stat"><span>Fireflies</span><b>${b.fireflies ? "Bağlı ✓" : `<a href="#/fireflies" style="font-size:16px">Bağla →</a>`}</b></div>
  </div>
  <div class="cards">${MODS.map(card).join("")}</div>
  ${hist.length ? `<h2 style="margin:30px 0 12px">Son çalışmalarınız <span class="pill" style="vertical-align:middle">bu cihaz</span></h2>
  <div class="card scroll-x"><table class="tbl"><thead><tr><th>Araç</th><th>Konu</th><th>Tarih</th><th></th></tr></thead><tbody>
  ${hist.map(h => `<tr><td>${MOD[h.k] ? MOD[h.k].ic + " " + esc(MOD[h.k].ad) : ""}</td><td>${esc(h.title)}</td><td>${fmtDT(h.at)}</td><td style="text-align:right">${safeUrl(h.url) ? `<a class="btn btn-g btn-s" href="${esc(safeUrl(h.url))}" target="_blank" rel="noopener">Aç ↗</a>` : ""}</td></tr>`).join("")}
  </tbody></table></div>` : ""}`);
}

// ---------- Araç sayfaları (ortak) ----------
function gate(k) {
  const d = durum(k);
  if (d.ok) return "";
  return msg("warn", `<span aria-hidden="true">⚠️</span><span>${esc(NEDEN[d.neden] ? NEDEN[d.neden](k) : "")} <a href="#/fiyatlar">Planları inceleyin →</a></span>`);
}
function quota(k) {
  const d = durum(k);
  if (d.lim < 0) return `<div class="quota"><span>Bu ay ${d.kul} kullanım</span><span class="pill ok">Sınırsız</span></div>`;
  if (!d.lim) return "";
  return `<div class="quota"><span>Bu ay ${d.kul} / ${d.lim} kullanıldı</span><div class="meter${d.kul >= d.lim ? " full" : ""}" aria-hidden="true"><i style="width:${Math.min(100, (d.kul / d.lim) * 100)}%"></i></div></div>`;
}
function toolShell(k, form, intro) {
  const m = MOD[k];
  shell(`${ph(`<span aria-hidden="true">${m.ic}</span> ${esc(m.ad)}`, esc(intro || m.d))}${gate(k)}
  <div class="tool"><div class="card pad">${form}${quota(k)}</div><section class="card out" id="out" aria-live="polite"></section></div>`);
  renderJob(k);
  const f = document.getElementById("f");
  if (f && !durum(k).ok) f.querySelectorAll("[type=submit]").forEach(b => (b.disabled = true));
  if (f && JOBS[k]?.state === "run") f.querySelectorAll("[type=submit]").forEach(b => { b.disabled = true; b.textContent = "Hazırlanıyor…"; });
}
const EMPTY = {
  rakip: ["🎯", "Rakip analiziniz burada görünecek", "Firmanızı ve 1–5 rakibi girin. Yapay zekâ siteleri tarar; konumlandırma, fiyat, mesaj ve fırsatları karşılaştıran bir Google Slides sunumu hazırlar."],
  sekans: ["✍️", "Sekansınız burada görünecek", "Hedef firmanın sitesini ya da elinizdeki dokümanı verin; cold call senaryosu ve çok adımlı LinkedIn mesajları hazırlansın."],
  seo: ["📈", "SEO raporunuz burada görünecek", "Bir sayfa adresi girin; SEO puanı, eksikler, anahtar kelime hacimleri ve yayına hazır içerik önerisi çıkarılsın."],
  briefing: ["🗂️", "Briefingeniz burada görünecek", "Görüşeceğiniz firma ve kişiyi girin; toplantıdan önce okuyacağınız araştırma ve fırsat puanı hazırlansın."],
  fireflies: ["🎙️", "Toplantı analizi burada görünecek", "Soldan bir toplantı seçip analiz edin: puan, itirazlar, BANT ve takip e-postası."],
};
function renderJob(k) {
  const out = document.getElementById("out");
  if (!out) return;
  const j = JOBS[k];
  if (!j) { const [ic, t, p] = EMPTY[k]; out.innerHTML = `<div class="empty"><div class="big" aria-hidden="true">${ic}</div><h3>${t}</h3><p style="max-width:420px">${p}</p></div>`; return; }
  if (j.state === "run") {
    const el = (Date.now() - j.t0) / 1000;
    out.innerHTML = `<div class="prog"><div class="spin"></div><div><h3>${esc(MOD[k].ad)} hazırlanıyor</h3><p style="color:var(--mute);margin-top:4px">${esc(j.title)}</p></div>
      <div class="meter" style="max-width:320px;width:100%;flex:none"><i data-bar style="width:3%"></i></div>
      <ol class="steps">${STEPS[k].map(s => `<li>${esc(s)}</li>`).join("")}</ol>
      ${j.step ? `<p style="font-size:13.5px;color:var(--mute)">${esc(j.step)}</p>` : ""}
      <p style="font-size:13px;color:var(--soft)">Geçen süre <span data-el>${mmss(el)}</span> · genellikle ${Math.round(EST[k] / 60) || 1}–${Math.ceil((EST[k] * 1.6) / 60)} dk${j.sync ? "" : " · Bu sekme açık kaldığı sürece devam eder; başka sayfalara geçebilirsiniz."}</p></div>`;
    return;
  }
  const again = `<button class="btn btn-g btn-s" data-reset="${k}">Yeni ${k === "fireflies" ? "analiz" : "çalışma"}</button>`;
  if (j.state === "err") {
    out.innerHTML = `<div class="res-b">${msg("err", `<span aria-hidden="true">⚠️</span><span>${esc(j.err || "İşlem tamamlanamadı.")}${j.neden ? ` <a href="#/fiyatlar">Planları inceleyin →</a>` : ""}</span>`)}${again}</div>`;
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
  const b = S.ben;
  toolShell("rakip", `<form id="f" data-sk-noform>
    <div class="f"><label for="cn">Firma adınız</label><input class="in" id="cn" required maxlength="150" value="${esc(b.sirket || "")}"></div>
    <div class="f"><label for="cw">Web siteniz</label><input class="in" id="cw" inputmode="url" placeholder="ornek.com" required></div>
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
  add(); add();
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
    <div class="sec"><h4>Sunum</h4><div class="row" style="justify-content:flex-start">${linkBtn(r.slides_view_url, "▶ Sunumu aç", "btn-p")}${linkBtn(r.slides_pdf_url, "⬇ PDF indir")}${linkBtn(r.slides_url, "✎ Google Slides'ta düzenle")}</div></div>
    <p style="color:var(--mute);font-size:13.5px">Sunum Google Slides'ta oluşturuldu; düzenleyip müşterinizle paylaşabilirsiniz.</p></div>`;
  },
  sekans: j => {
    const r = j.res || {}, pub = safeUrl(r.publicUrl);
    return `${resHead("Sekans hazır", r.company ? `<span class="pill acc">${esc(r.company)}</span>` : "")}
    <div class="res-b"><div class="sec"><h4>Sekans dokümanı</h4><div class="row" style="justify-content:flex-start">${linkBtn(r.presentationViewUrl || r.presentationUrl, "▶ Sekansı aç", "btn-p")}${linkBtn(r.presentationUrl, "✎ Düzenle")}${pub ? `<button class="btn btn-g btn-s" data-copy="${esc(pub)}">🔗 Paylaşım linkini kopyala</button>` : ""}</div></div>
    <p style="color:var(--mute);font-size:13.5px">Dokümanda cold call senaryosu, itiraz karşılama cümleleri ve LinkedIn mesaj adımları yer alır.</p></div>`;
  },
  seo: j => seoResult(j.res.sonuc || {}),
  briefing: j => {
    const r = j.res.sonuc || {};
    return `${resHead("Briefing hazır", r.deal_pct_label ? `<span class="pill ok">${esc(r.deal_pct_label)}</span>` : "")}
    <div class="res-b"><div class="sec">${kv([["Firma", r.firma_adi || r.company], ["Kişi", r.kisi_adi || r.person], ["Toplantı", r.toplanti_tarihi], ["En uygun hizmet", r.en_uygun_hizmet], ["Firma skoru", r.f_skor], ["Kişi skoru", r.k_skor], ["Slayt", r.slideCount]])}</div>
    <div class="sec"><h4>Briefing sunumu</h4><div class="row" style="justify-content:flex-start">${linkBtn(r.presentationViewUrl || r.presentationUrl, "▶ Briefingi aç", "btn-p")}${linkBtn(r.presentationUrl, "✎ Düzenle")}</div></div>
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
    <div class="f"><label for="nt">Notlar <span class="hint">(isteğe bağlı)</span></label><textarea class="in" id="nt" maxlength="3000" placeholder="Ne satıyorsunuz, kime ulaşmak istiyorsunuz, ton tercihi…"></textarea></div>
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
    ${r.html_report ? `<div class="sec"><h4>Tam rapor</h4><div class="row" style="justify-content:flex-start"><button class="btn btn-g btn-s" id="seo-show">Raporu göster</button><button class="btn btn-g btn-s" id="seo-dl">⬇ HTML indir</button></div><div id="seo-frame"></div></div>` : ""}
  </div>`;
}

// ---------- Briefing ----------
function pageBriefing() {
  toolShell("briefing", `<form id="f" data-sk-noform>
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
    <p class="hint" style="margin-top:10px;font-size:12.5px;color:var(--mute)">1–3 dakika sürer; sonuç e-postanıza da gelir.</p>
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
    shell(`${ph(`<span aria-hidden="true">🎙️</span> Toplantı Analizi`, esc(MOD.fireflies.d))}${gate("fireflies")}<div style="max-width:620px">${ffConnect()}</div>`);
    return bindFfKey(render);
  }
  const fmtDur = d => (d ? `${Math.round(Number(d))} dk` : "");
  const items = FF.list === null ? `<div class="empty" style="padding:24px"><div class="spin"></div></div>`
    : FF.err ? msg("err", esc(FF.err) + ` <a href="#/hesap">Anahtarı kontrol edin →</a>`)
    : !FF.list.length ? `<p style="color:var(--mute)">Fireflies hesabınızda henüz kayıtlı toplantı yok.</p>`
    : `<div class="list" role="listbox" aria-label="Toplantılar">${FF.list.map(t => `<button type="button" class="li" data-ff="${esc(t.id)}" aria-pressed="${FF.sel === t.id}"><span aria-hidden="true">🎧</span><span class="t"><b>${esc(t.title || "Adsız toplantı")}</b><span>${fmtDT(t.date)}${t.duration ? " · " + fmtDur(t.duration) : ""}${t.participants?.length ? ` · ${t.participants.length} katılımcı` : ""}</span></span></button>`).join("")}</div>`;
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
  const list = (arr, ic) => (Array.isArray(arr) && arr.length ? `<ul style="margin:0;padding-left:0;list-style:none;display:grid;gap:6px">${arr.map(x => `<li style="display:flex;gap:8px"><span aria-hidden="true">${ic}</span><span>${esc(asText(x))}</span></li>`).join("")}</ul>` : `<p style="color:var(--mute)">—</p>`);
  const oran = Array.isArray(meta.oranlar) ? meta.oranlar : [];
  const bant = a.bant || {};
  const itr = Array.isArray(a.itirazlar) ? a.itirazlar : [];
  const adim = Array.isArray(a.sonraki_adimlar) ? a.sonraki_adimlar : [];
  return `${resHead("Toplantı analizi", Number.isFinite(skor) ? `<span class="pill ${skor >= 70 ? "ok" : skor >= 45 ? "warn" : "bad"}">${skor}/100</span>` : "")}
  <div class="res-b">
    <div class="sec">${kv([["Toplantı", meta.title || j.title], ["Tarih", meta.date ? fmtDT(meta.date) : ""], ["Süre", meta.duration ? Math.round(meta.duration) + " dk" : ""], ["Satış aşaması", a.asama]])}</div>
    ${a.ozet ? `<div class="sec"><h4>Özet</h4><p>${esc(a.ozet)}</p>${a.skor_gerekce ? `<p style="color:var(--mute);margin-top:6px;font-size:14px">${esc(a.skor_gerekce)}</p>` : ""}</div>` : ""}
    ${oran.length ? `<div class="sec"><h4>Konuşma oranı</h4><div style="display:grid;gap:8px">${oran.map(o => `<div class="row" style="flex-wrap:nowrap"><span style="width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(o.ad)}</span><div class="meter" style="max-width:none"><i style="width:${Math.max(0, Math.min(100, Number(o.pay) || 0))}%"></i></div><b style="width:44px;text-align:right">%${Math.round(Number(o.pay) || 0)}</b></div>`).join("")}</div></div>` : ""}
    <div class="sec grid2" style="gap:14px"><div><h4>Güçlü yönler</h4>${list(a.guclu, "✅")}</div><div><h4>Gelişim alanları</h4>${list(a.gelisim, "🎯")}</div></div>
    ${itr.length ? `<div class="sec"><h4>İtirazlar</h4>${itr.map(i => `<div class="box"><h5>“${esc(i.itiraz)}”</h5>${i.nasil_yanitlandi ? `<p style="font-size:14px;color:var(--mute)">Verilen yanıt: ${esc(i.nasil_yanitlandi)}</p>` : ""}${i.oneri ? `<p style="font-size:14px;margin-top:4px"><b>Öneri:</b> ${esc(i.oneri)}</p>` : ""}</div>`).join("")}</div>` : ""}
    ${Object.keys(bant).length ? `<div class="sec"><h4>BANT</h4>${kv([["Bütçe", bant.butce], ["Yetki", bant.yetki], ["İhtiyaç", bant.ihtiyac], ["Zamanlama", bant.zamanlama]])}</div>` : ""}
    ${adim.length ? `<div class="sec"><h4>Sonraki adımlar</h4><div class="card scroll-x" style="box-shadow:none"><table class="tbl"><thead><tr><th>Adım</th><th>Sorumlu</th><th>Tarih</th></tr></thead><tbody>${adim.map(s => `<tr><td>${esc(asText(s.adim || s))}</td><td>${esc(s.sorumlu || "")}</td><td>${esc(s.tarih || "")}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
    ${Array.isArray(a.riskler) && a.riskler.length ? `<div class="sec"><h4>Riskler</h4>${list(a.riskler, "⚠️")}</div>` : ""}
    ${a.takip_epostasi ? `<div class="sec"><h4>Takip e-postası taslağı</h4><div class="box"><button class="btn btn-g btn-s copy" data-copy-el="ff-mail">Kopyala</button><div id="ff-mail" class="pre" style="padding-right:80px">${esc(a.takip_epostasi)}</div></div></div>` : ""}
  </div>`;
}

// ---------- Fiyatlar ----------
async function pageFiyatlar() {
  const planlar = S.planlar || PLAN_FALLBACK;
  const b = S.ben, y = S.yillik;
  const satir = (q, k) => {
    const v = Number((q || {})[k] || 0);
    return v < 0 ? `<li>Sınırsız ${esc(kucuk(MOD[k].ad))}</li>` : v ? `<li>Ayda ${fmtN(v)} ${esc(kucuk(MOD[k].ad))}</li>` : `<li class="no">${esc(MOD[k].ad)}</li>`;
  };
  const card = p => {
    const meta = PLAN_META[p.kod] || {}, cur = b.plan === p.kod && b.aktif;
    const cta = cur ? `<span class="btn btn-g btn-w" aria-disabled="true">Mevcut planınız</span>`
      : `<a class="btn ${meta.hot ? "btn-p" : p.kod === "ozel" ? "btn-g" : "btn-g"} btn-w" href="${SITE}/iletisim" target="_blank" rel="noopener">${p.kod === "ozel" ? "Teklif alın" : "Bu planı seç"}</a>`;
    if (p.kod === "ozel") return `<div class="card plan dark"><h3>${esc(p.ad)}</h3><p>${esc(meta.d)}</p><div class="price"><b>Teklif ile</b></div>
      <ul><li>Bütün araçlar, sınırsız kullanım</li><li>CRM entegrasyonu (HubSpot, Pipedrive, Salesforce…)</li><li>Şirketinize özel kişisel AI asistan</li><li>Kendi süreçlerinize göre iş akışları</li><li>Özel hesap yöneticisi</li></ul>${cta}</div>`;
    const m = Number(p.aylik_tl) || 0, fiyat = y ? Math.round((m * 0.8) / 10) * 10 : m;
    return `<div class="card plan${meta.hot ? " hot" : ""}">${meta.hot ? `<span class="pill acc tag">En çok tercih edilen</span>` : ""}<h3>${esc(p.ad)}</h3><p>${esc(meta.d || "")}</p>
      <div class="price"><b>₺${fmtN(fiyat)}</b><span>/ay${y ? " · yıllık" : ""}</span></div>
      ${y ? `<span style="font-size:12.5px;color:var(--mute);margin-top:-8px">Yıllık ₺${fmtN(fiyat * 12)} (KDV hariç)</span>` : `<span style="font-size:12.5px;color:var(--mute);margin-top:-8px">KDV hariç</span>`}
      <ul>${MODS.map(x => satir(p.kota, x.k)).join("")}${(meta.ek || []).map(t => `<li>${esc(t)}</li>`).join("")}</ul>${cta}</div>`;
  };
  shell(`${ph("Planlar ve fiyatlar", "Ekibinizin büyüklüğüne göre seçin; istediğiniz zaman yükseltin.", `<div class="bill" role="group" aria-label="Faturalama"><button type="button" data-bill="0" aria-pressed="${!y}">Aylık</button><button type="button" data-bill="1" aria-pressed="${y}">Yıllık<em>%20 indirim</em></button></div>`)}
  ${b.plan === "deneme" && b.aktif ? msg("info", `🎁 Ücretsiz denemedesiniz: ${daysLeft(b.bitis)} gün kaldı. Plan seçtiğinizde kalan kullanım haklarınız yeni planınıza göre güncellenir.`) : ""}
  ${!b.aktif ? msg("warn", esc(NEDEN.sure()) + " Bir plan seçerek kaldığınız yerden devam edebilirsiniz.") : ""}
  <div class="plans">${planlar.filter(p => p.kod !== "deneme").map(card).join("")}</div>
  <div class="faq">
    <h2 style="margin-bottom:4px">Sık sorulanlar</h2>
    <details><summary>Plan seçince ne oluyor?</summary><p>“Bu planı seç” ile iletişim formundan talebinizi iletin; ödeme ve fatura bilgisini sizinle netleştirip planınızı hesabınıza tanımlıyoruz. Plan tanımlandığı anda yeni kotalar panelde görünür.</p></details>
    <details><summary>Kullanım hakları nasıl sayılıyor?</summary><p>Her başarılı analiz, sekans, SEO raporu, briefing ya da toplantı analizi o ayın hakkından bir düşer. Haklar her ayın başında (Türkiye saatiyle) yenilenir; kullanılmayan haklar devretmez.</p></details>
    <details><summary>Yıllık ödemede ne kazanırım?</summary><p>Yıllık faturalamada aylık fiyata göre %20 indirim uygulanır.</p></details>
    <details><summary>İptal edebilir miyim?</summary><p>Evet. Aylık planlarda dönem sonunda yenilemeyi durdurursunuz; hesabınız ve geçmiş çalışmalarınız silinmez.</p></details>
    <details><summary>Verilerim güvende mi?</summary><p>Girdiğiniz bilgiler yalnızca istediğiniz çıktıyı üretmek için işlenir. Fireflies anahtarınız hesabınıza bağlı saklanır, sadece sizin toplantılarınızı okumak için kullanılır ve istediğiniz an kaldırabilirsiniz.</p></details>
    <details><summary>Özel AI paketi neleri kapsar?</summary><p>CRM'inize (HubSpot, Pipedrive, Salesforce vb.) bağlanan, şirketinizin satış süreçlerine ve verilerine göre kurulan kişisel AI asistan ve iş akışları. Kapsamı ihtiyacınıza göre birlikte belirleyip teklif hazırlıyoruz.</p></details>
  </div>`);
  document.querySelectorAll("[data-bill]").forEach(x => (x.onclick = () => { S.yillik = x.dataset.bill === "1"; pageFiyatlar(); }));
  if (!S.planlar) { await loadPlanlar(); if (route === "fiyatlar") pageFiyatlar(); }
}

// ---------- Hesabım ----------
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
    <section class="card pad"><div class="row" style="margin-bottom:14px"><h3>Plan ve kullanım</h3><span class="pill ${b.aktif ? "acc" : "warn"}">${esc(b.plan_ad || b.plan)} · ${b.aktif ? fmtD(b.bitis) + "'e kadar" : "süre doldu"}</span></div>
      <div class="scroll-x"><table class="tbl"><thead><tr><th>Araç</th><th>Bu ay (${esc(b.ay || "")})</th><th>Aylık hak</th></tr></thead><tbody>
      ${MODS.map(m => { const d = durum(m.k); return `<tr><td>${m.ic} ${esc(m.ad)}</td><td>${d.kul}</td><td>${d.lim < 0 ? "Sınırsız" : d.lim ? d.lim : "Plana dahil değil"}</td></tr>`; }).join("")}
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
let ADM = { rows: null, err: "", q: "" };
async function pageAdmin() {
  const planlar = S.planlar || PLAN_FALLBACK;
  const rows = ADM.rows;
  const q = ADM.q.toLocaleLowerCase("tr-TR");
  const vis = (rows || []).filter(r => !q || [r.email, r.ad, r.sirket, r.plan].join(" ").toLocaleLowerCase("tr-TR").includes(q));
  const now = Date.now();
  const say = f => (rows || []).filter(f).length;
  const kisa = { rakip: "R", sekans: "S", seo: "SEO", briefing: "B", fireflies: "F" };
  shell(`${ph("Yönetim", "Kullanıcılar, planlar ve bu ayki kullanım.", `<a class="btn btn-g btn-s" href="${SITE}/dashboard">Eski panel ↗</a>`)}
  <div class="stats">
    <div class="card stat"><span>Toplam kullanıcı</span><b>${rows ? fmtN(rows.length) : "…"}</b></div>
    <div class="card stat"><span>Denemede</span><b>${rows ? say(r => r.plan === "deneme" && new Date(r.bitis) > now) : "…"}</b></div>
    <div class="card stat"><span>Ücretli plan</span><b>${rows ? say(r => r.plan !== "deneme" && new Date(r.bitis) > now) : "…"}</b></div>
    <div class="card stat"><span>Süresi dolan</span><b>${rows ? say(r => new Date(r.bitis) <= now) : "…"}</b></div>
  </div>
  <section class="card pad" style="margin-bottom:16px"><h3 style="margin-bottom:12px">Plan ata</h3><div id="am"></div>
    <form id="af" data-sk-noform><div style="display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1.2fr) minmax(0,1fr) auto;gap:10px;align-items:end" class="adm-grid">
      <div class="f" style="margin:0"><label for="ae">Kullanıcı e-postası</label><input class="in" id="ae" type="email" required></div>
      <div class="f" style="margin:0"><label for="ap">Plan</label><select class="in" id="ap">${planlar.map(p => `<option value="${esc(p.kod)}">${esc(p.ad)}</option>`).join("")}</select></div>
      <div class="f" style="margin:0"><label for="ag">Gün</label><input class="in" id="ag" type="number" min="1" max="3660" placeholder="Değişmesin"></div>
      <button class="btn btn-p" type="submit">Ata</button></div>
      <p class="hint" style="font-size:12.5px;color:var(--mute);margin-top:8px">Gün boş bırakılırsa mevcut bitiş tarihi korunur. Ör. aylık plan için 30, yıllık için 365. Kullanıcının önce kayıt olmuş olması gerekir.</p></form></section>
  <section class="card"><div class="res-h"><h3>Kullanıcılar</h3><input class="in" id="aq" placeholder="Ara: e-posta, ad, şirket, plan" style="max-width:280px" value="${esc(ADM.q)}"></div>
  ${ADM.err ? `<div class="res-b">${msg("err", esc(ADM.err))}</div>` : !rows ? `<div class="empty"><div class="spin"></div></div>` : `<div class="scroll-x"><table class="tbl"><thead><tr><th>Kullanıcı</th><th>Plan</th><th>Bitiş</th><th>Bu ay</th><th>Son giriş</th><th></th></tr></thead><tbody>
  ${vis.map(r => { const act = new Date(r.bitis) > now; return `<tr><td><b>${esc(r.email)}</b><br><span style="font-size:12.5px;color:var(--mute)">${esc([r.ad, r.sirket].filter(Boolean).join(" · ") || "—")}</span></td>
    <td><span class="pill ${r.plan === "deneme" ? "" : "acc"}">${esc((planlar.find(p => p.kod === r.plan) || {}).ad || r.plan)}</span></td>
    <td>${act ? `${fmtD(r.bitis)}<br><span style="font-size:12.5px;color:var(--mute)">${daysLeft(r.bitis)} gün</span>` : `<span class="pill warn">Doldu</span>`}</td>
    <td style="font-size:13px">${Object.entries(r.kullanim || {}).map(([k, v]) => `${kisa[k] || esc(k)} ${esc(v)}`).join(" · ") || "—"}</td>
    <td style="font-size:13px">${fmtDT(r.son_giris)}</td>
    <td><button class="btn btn-g btn-s" data-edit="${esc(r.email)}" data-plan="${esc(r.plan)}">Düzenle</button></td></tr>`; }).join("") || `<tr><td colspan="6" style="color:var(--mute)">Sonuç yok.</td></tr>`}
  </tbody></table></div>`}</section>
  <style>@media (max-width:860px){.adm-grid{grid-template-columns:1fr!important}}</style>`);
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
  const aq = document.getElementById("aq");
  aq.oninput = () => { ADM.q = aq.value; const pos = aq.selectionStart; pageAdmin(); const n = document.getElementById("aq"); n.focus(); n.setSelectionRange(pos, pos); };
  document.querySelectorAll("[data-edit]").forEach(x => (x.onclick = () => { af.ae.value = x.dataset.edit; af.ap.value = x.dataset.plan; af.ag.focus(); af.scrollIntoView({ behavior: "smooth", block: "center" }); }));
  if (!rows && !ADM.err) { await Promise.all([loadAdm(), loadPlanlar()]); if (route === "admin") pageAdmin(); }
}
async function loadAdm() {
  try { ADM.rows = (await rpc("app_admin_liste")) || []; ADM.err = ""; }
  catch (e) { ADM.err = trErr(e); }
}

const PAGES = { giris: pageGiris, kayit: pageKayit, sifre: pageSifre, "yeni-sifre": pageYeniSifre, panel: pagePanel, rakip: pageRakip, sekans: pageSekans, seo: pageSeo, briefing: pageBriefing, fireflies: pageFireflies, fiyatlar: pageFiyatlar, hesap: pageHesap, admin: pageAdmin };

// ---------- Genel olaylar ----------
document.addEventListener("click", async e => {
  const t = e.target.closest("[data-go],[data-eye],[data-side],[data-menu],[data-logout],[data-copy],[data-copy-el],[data-reset],.nav a,#seo-show,#seo-dl");
  if (!t) return;
  if (t.dataset.go) { e.preventDefault(); go(t.dataset.go); }
  else if (t.dataset.eye) { const i = document.getElementById(t.dataset.eye); const show = i.type === "password"; i.type = show ? "text" : "password"; t.textContent = show ? "Gizle" : "Göster"; t.setAttribute("aria-label", show ? "Şifreyi gizle" : "Şifreyi göster"); }
  else if (t.hasAttribute("data-side")) {
    const sh = document.getElementById("shell");
    if (!sh) return;
    if (matchMedia("(max-width:860px)").matches) sh.classList.remove("open");
    else { const mini = sh.classList.toggle("mini"); store.set("side_mini", mini); }
  }
  else if (t.hasAttribute("data-menu")) document.getElementById("shell")?.classList.toggle("open");
  else if (t.hasAttribute("data-logout")) { await sb.auth.signOut(); S.session = null; S.ben = null; ADM = { rows: null, err: "", q: "" }; FF = { list: null, err: "", sel: "" }; go("giris"); }
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
  if (ev === "SIGNED_OUT") { S.ben = null; setTimeout(render, 0); }
});
{
  const { data } = await sb.auth.getSession();
  S.session = data.session;
  if (S.session) await loadBen();
  if (/access_token|error_description|[?#&]type=/.test(initialHash))
    history.replaceState(null, "", location.pathname + location.search + "#/" + (S.recovery && S.session ? "yeni-sifre" : S.session ? "panel" : "giris"));
  window.addEventListener("hashchange", render);
  render();
  for (const k of Object.keys(JOBS)) if (JOBS[k].state === "run") poll(k);
}
