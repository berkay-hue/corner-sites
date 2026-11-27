// Chatbot panel uçları (/gen/bot…) — sözleşme §7. Kural/doğrulama/sabitler chatbot-kural.js'te; bu dosya HTTP + D1 katmanı.
// Bu adımda: yönlendirici, bot CRUD (liste, oluştur, getir, güncelle, sil, anahtar yenile), kota nesnesi (§5.1), botCleanup (§3.1).
// Sonraki adımlar (test sohbeti, kanal/ig, konuşmalar, leadler, istatistik, widget) `botAlt()` içindeki switch'e eklenir.
import { bearerToken, platformSite, sessionUser } from "./platform.js";
import { siteConf } from "./sites.js";
import { genDay, sesResetAt, reserve, keyOf, ipPrefix, DECR } from "./generate.js";
import { llmJson, LlmError } from "./llm.js";
import { BOT_HIZ, botEslestir, botDil, metinAl, eylemButonlari, menuArtiEylem, temiz } from "./chatbot-kural.js";
import { BOT_BODY_MAX, SABLON, botLimits, botDizin, botDogrula } from "./chatbot-kural.js";
import { BOT_LIM, botAiSistem, botAiKullanici, aiKirp, BOT_AI_SCHEMA, botLead, botLeadBul } from "./chatbot-kural.js";
import { botIgWebhook, botKanalIg } from "./chatbot-ig.js"; // §8 (döngüsel import: yalnız fonksiyon gövdelerinde kullanılır)

export * from "./chatbot-kural.js";

// ---------- zarf (§7.1) ----------
const HDR = origin => ({
  "content-type": "application/json", "cache-control": "no-store",
  ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
});
export const botJson = (origin, status, obj) => new Response(JSON.stringify(obj), { status, headers: HDR(origin) });
export const botOk = (origin, data = {}) => botJson(origin, 200, { ok: true, ...data });
export const botFail = (origin, status, error, ek = {}) => botJson(origin, status, { ok: false, error, ...ek });

export const BOT_ID_RE = /^[1-9]\d{0,9}$/;
export const notReadyErr = e => /no such (table|column)/i.test(String(e?.message || e));

// generate.js readBody kopyası (dışa aktarılmıyor): content-length yok/aşım → 413, JSON nesnesi değil → 400 bad_json.
export async function botReadBody(req, max, origin) {
  const len = Number(req.headers.get("content-length"));
  if (!req.headers.has("content-length") || !Number.isFinite(len) || len > max) return { res: botFail(origin, 413, "too_large") };
  let text;
  try { text = await req.text(); } catch { return { res: botFail(origin, 400, "bad_json") }; }
  if (new TextEncoder().encode(text).length > max) return { res: botFail(origin, 413, "too_large") };
  let g;
  try { g = JSON.parse(text); } catch { return { res: botFail(origin, 400, "bad_json") }; }
  if (!g || typeof g !== "object" || Array.isArray(g)) return { res: botFail(origin, 400, "bad_json") };
  return { g };
}

// generate.js account() kopyası. io.rotaAcik(site) testte sites.js rota listesini atlamak için (INTEGRASYON eklenene kadar).
export async function botHesap(req, env, origin, io = {}) {
  const site = platformSite(env, origin);
  if (!site) return { res: botFail(origin, 403, "origin") };
  const acik = io.rotaAcik ? io.rotaAcik(site) : siteConf(site)?.routes?.includes("GET /gen/bot");
  if (!acik) return { res: botFail(origin, 404, "not_found") };
  const user = await sessionUser(env, bearerToken(req), site);
  if (!user) return { res: botFail(origin, 401, "login_required") };
  const limits = botLimits(user, io.now ?? Date.now());
  // users.plan NOT NULL DEFAULT 'basic' (0018): limits yalnız plan sütunu okunamazsa (göç uygulanmamış) null → not_ready doğru
  if (!limits) return { res: botFail(origin, 503, "not_ready") };
  return { user, limits, site };
}

// ---------- kota nesnesi (§5.1) ----------
export const botAy = (now = Date.now()) => "bot:" + genDay(now).slice(0, 7);
export const botKotaKeys = uid => ({ a: `a:u:${uid}`, h: `h:u:${uid}`, t: `t:u:${uid}` });

export async function botKota(env, user, limits, now = Date.now(), botSayisi) {
  const k = botKotaKeys(user.id);
  const { results = [] } = await env.DB.prepare("SELECT key, n FROM gen_usage WHERE day = ? AND key IN (?, ?, ?)")
    .bind(botAy(now), k.a, k.h, k.t).all();
  const n = key => Number(results.find(r => r.key === key)?.n) || 0;
  if (botSayisi === undefined) botSayisi = Number((await env.DB.prepare("SELECT COUNT(*) AS n FROM chatbots WHERE user_id = ?").bind(user.id).first())?.n) || 0;
  const parca = (limit, used) => ({ limit, used, kalan: Math.max(0, limit - used) });
  const ai = parca(limits.ai, n(k.a)), hazir = parca(limits.hazir, n(k.h));
  const uyari = ai.kalan === 0 || hazir.kalan === 0 ? "dolu"
    : ai.used >= 0.8 * ai.limit || hazir.used >= 0.8 * hazir.limit ? "az" : null;
  return {
    plan: limits.plan, ai, hazir, bot: { limit: limits.bot, used: botSayisi }, test: { used: n(k.t) },
    reset_at: sesResetAt(now), uyari, deneme_bitti: !!limits.deneme_bitti,
  };
}

// ---------- BotPanel (§7.2) ----------
const GORUNUM0 = Object.freeze({ renk: "#4f46e5", konum: "sag", baslik: "" });
export const botJsonAl = (s, yedek) => { try { const v = JSON.parse(s); return v ?? yedek; } catch { return yedek; } };

// IG durum bağlamı: bir kez okunur, her bota uygulanır.
export async function botIgBaglam(env, user) {
  if (env.BOT_IG_ENABLED !== "1") return { acik: false };
  const hesap = await env.DB.prepare(
    "SELECT handle, external_id FROM social_accounts WHERE user_id = ? AND platform = 'instagram' AND status = 'connected'"
  ).bind(user.id).first();
  let scope = null;
  if (hesap) scope = (await env.DB.prepare("SELECT scope FROM oauth_tokens WHERE user_id = ? AND platform = 'instagram'").bind(user.id).first())?.scope ?? null;
  const { results: aktifler = [] } = await env.DB.prepare("SELECT id, ad, ig_hesap FROM chatbots WHERE user_id = ? AND ig_aktif = 1").bind(user.id).all();
  return { acik: true, hesap, scope, aktifler };
}

export function botIgDurum(row, b) {
  if (!b?.acik) return { aktif: false, durum: "yakinda", hesap: null, baska_bot: null };
  const h = b.hesap;
  if (row.ig_aktif) return { aktif: true, durum: "aktif", hesap: h?.handle ?? null, baska_bot: null };
  if (!h) return { aktif: false, durum: "bagli_degil", hesap: null, baska_bot: null };
  if (b.scope && !String(b.scope).includes("instagram_business_manage_messages")) return { aktif: false, durum: "izin_yok", hesap: null, baska_bot: null };
  const baska = (b.aktifler || []).find(x => Number(x.id) !== Number(row.id) && (x.ig_hesap == null || x.ig_hesap === h.external_id));
  if (baska) return { aktif: false, durum: "baska_botta", hesap: null, baska_bot: { id: Number(baska.id), ad: baska.ad } };
  return { aktif: false, durum: "hazir", hesap: h.handle ?? null, baska_bot: null };
}

// liste: niyetler [] + ai.bilgi "" + niyet_sayisi; planDisi: plan sınırı dışında kalan bot (id sırasıyla ilk limits.bot dışı).
export function botPanel(row, { liste = false, ig, ozet, planDisi = false } = {}) {
  const niyetler = botJsonAl(row.niyetler, []);
  const o = {
    id: Number(row.id), ad: row.ad, mod: row.mod, aktif: !!row.aktif, dil: row.dil, surum: Number(row.surum),
    created_at: row.created_at, updated_at: row.updated_at,
    karsilama: row.karsilama, geri_donus: row.geri_donus, devir_mesaji: row.devir_mesaji, bulunamazsa: row.bulunamazsa,
    menu: botJsonAl(row.menu, []),
    niyetler: liste ? [] : niyetler,
    ai: { persona: row.persona, ton: Number(row.ton), bilgi: liste ? "" : row.bilgi },
    web: {
      aktif: !!row.web_aktif, anahtar: row.web_anahtar, alanlar: botJsonAl(row.web_alanlar, []),
      gorunum: { ...GORUNUM0, ...botJsonAl(row.web_gorunum, {}) },
    },
    ig: ig || botIgDurum(row, null),
    ozet: ozet || { okunmamis: 0, yeni_lead: 0 },
    plan_disi: !!planDisi,
  };
  if (liste) o.niyet_sayisi = Array.isArray(niyetler) ? niyetler.length : 0;
  return o;
}

// Plan sınırı dışı mı: id sırasıyla ilk limits.bot bot içeride.
export async function botPlanDisi(env, user, limits, botId) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM chatbots WHERE user_id = ? AND id < ?").bind(user.id, botId).first();
  return (Number(r?.n) || 0) >= limits.bot;
}

// ---------- web anahtarı ----------
export function botAnahtar() {
  const b = crypto.getRandomValues(new Uint8Array(18));
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return "wk_" + btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const anahtarCakisma = e => /UNIQUE/i.test(String(e?.message || e)) && /web_anahtar/i.test(String(e?.message || e));

// ---------- uçlar ----------
const BOT_SEC = "SELECT * FROM chatbots WHERE id = ? AND user_id = ?";

async function botListe(env, origin, h, now) {
  const { results: rows = [] } = await env.DB.prepare("SELECT * FROM chatbots WHERE user_id = ? ORDER BY id").bind(h.user.id).all();
  const { results: ok = [] } = await env.DB.prepare(
    "SELECT bot_id, SUM(okunmadi) AS n FROM bot_conversations WHERE bot_id IN (SELECT id FROM chatbots WHERE user_id = ?) GROUP BY bot_id"
  ).bind(h.user.id).all();
  const { results: ld = [] } = await env.DB.prepare(
    "SELECT bot_id, COUNT(*) AS n FROM bot_leads WHERE durum = 'yeni' AND bot_id IN (SELECT id FROM chatbots WHERE user_id = ?) GROUP BY bot_id"
  ).bind(h.user.id).all();
  const say = (arr, id) => Number(arr.find(r => Number(r.bot_id) === Number(id))?.n) || 0;
  const igb = await botIgBaglam(env, h.user);
  const botlar = rows.map((r, i) => botPanel(r, {
    liste: true, ig: botIgDurum(r, igb), planDisi: i >= h.limits.bot,
    ozet: { okunmamis: say(ok, r.id), yeni_lead: say(ld, r.id) },
  }));
  return botOk(origin, { botlar, kota: await botKota(env, h.user, h.limits, now, rows.length), ig_acik: igb.acik });
}

async function botOlustur(req, env, origin, h, now) {
  const { g, res } = await botReadBody(req, BOT_BODY_MAX.olustur, origin);
  if (res) return res;
  const v = botDogrula(g, { olustur: true });
  if (!v.ok) return botFail(origin, 400, "invalid", { alan: v.alan, neden: v.neden });
  if (h.limits.deneme_bitti) return botFail(origin, 403, "deneme_bitti");
  const say = Number((await env.DB.prepare("SELECT COUNT(*) AS n FROM chatbots WHERE user_id = ?").bind(h.user.id).first())?.n) || 0;
  if (say >= h.limits.bot) return botFail(origin, 403, "bot_limit", { limit: h.limits.bot });
  const d = v.deger;
  const sab = d.sablon === "genel" ? (SABLON[d.dil] || SABLON.tr) : { niyetler: [], menu: [] };
  const niyetler = sab.niyetler || [], menu = sab.menu || [];
  const ekle = anahtar => env.DB.prepare(
    "INSERT INTO chatbots (user_id, ad, mod, dil, menu, niyetler, dizin, web_anahtar, web_gorunum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(h.user.id, d.ad, d.mod, d.dil, JSON.stringify(menu), JSON.stringify(niyetler), JSON.stringify(botDizin(niyetler)), anahtar, JSON.stringify(GORUNUM0)).first();
  let row;
  try { row = await ekle(botAnahtar()); }
  catch (e) { if (!anahtarCakisma(e)) throw e; row = await ekle(botAnahtar()); }
  const igb = await botIgBaglam(env, h.user);
  return botOk(origin, { bot: botPanel(row, { ig: botIgDurum(row, igb) }), kota: await botKota(env, h.user, h.limits, now, say + 1) });
}

async function botGetir(env, origin, h, id, now) {
  const row = await env.DB.prepare(BOT_SEC).bind(id, h.user.id).first();
  if (!row) return botFail(origin, 404, "bulunamadi");
  const igb = await botIgBaglam(env, h.user);
  const planDisi = await botPlanDisi(env, h.user, h.limits, id);
  return botOk(origin, { bot: botPanel(row, { ig: botIgDurum(row, igb), planDisi }), kota: await botKota(env, h.user, h.limits, now) });
}

// gövde alanı → sütun(lar). Değer botDogrula'dan normalize gelir.
function botSetler(d, row) {
  const set = [], arg = [];
  const koy = (kol, val) => { set.push(`${kol} = ?`); arg.push(val); };
  for (const k of ["ad", "mod", "dil", "karsilama", "geri_donus", "devir_mesaji", "bulunamazsa"]) if (d[k] !== undefined) koy(k, d[k]);
  if (d.aktif !== undefined) koy("aktif", d.aktif ? 1 : 0);
  if (d.menu !== undefined) koy("menu", JSON.stringify(d.menu));
  if (d.niyetler !== undefined) { koy("niyetler", JSON.stringify(d.niyetler)); koy("dizin", JSON.stringify(botDizin(d.niyetler))); }
  if (d.ai) {
    if (d.ai.persona !== undefined) koy("persona", d.ai.persona);
    if (d.ai.ton !== undefined) koy("ton", d.ai.ton);
    if (d.ai.bilgi !== undefined) koy("bilgi", d.ai.bilgi);
  }
  if (d.web) {
    if (d.web.aktif !== undefined) koy("web_aktif", d.web.aktif ? 1 : 0);
    if (d.web.alanlar !== undefined) koy("web_alanlar", JSON.stringify(d.web.alanlar));
    if (d.web.gorunum !== undefined) koy("web_gorunum", JSON.stringify({ ...GORUNUM0, ...botJsonAl(row.web_gorunum, {}), ...d.web.gorunum }));
  }
  return { set, arg };
}

async function botGuncelle(req, env, origin, h, id) {
  const { g, res } = await botReadBody(req, BOT_BODY_MAX.guncelle, origin);
  if (res) return res;
  const row = await env.DB.prepare(BOT_SEC).bind(id, h.user.id).first();
  if (!row) return botFail(origin, 404, "bulunamadi");
  const kayitliK = botJsonAl(row.niyetler, []).map(n => n?.k).filter(Boolean);
  const v = botDogrula(g, { kayitliK });
  if (!v.ok) return botFail(origin, 400, "invalid", { alan: v.alan, neden: v.neden });
  const d = v.deger;
  if (Number(d.surum) !== Number(row.surum)) return botFail(origin, 409, "cakisma", { surum: Number(row.surum) });
  // web.aktif:true + alanlar gövdede yok → kayıtlı alanlar boş olmamalı (botDogrula bunu bilemez)
  if (d.web?.aktif === true && d.web.alanlar === undefined && !botJsonAl(row.web_alanlar, []).length)
    return botFail(origin, 400, "invalid", { alan: "web.alanlar", neden: "bos" });
  const { set, arg } = botSetler(d, row);
  const yeni = await env.DB.prepare(
    `UPDATE chatbots SET ${set.map(s => s + ", ").join("")}surum = surum + 1, updated_at = datetime('now') WHERE id = ? AND user_id = ? AND surum = ? RETURNING *`
  ).bind(...arg, id, h.user.id, Number(row.surum)).first();
  if (!yeni) {
    const s = await env.DB.prepare("SELECT surum FROM chatbots WHERE id = ? AND user_id = ?").bind(id, h.user.id).first();
    return s ? botFail(origin, 409, "cakisma", { surum: Number(s.surum) }) : botFail(origin, 404, "bulunamadi");
  }
  const igb = await botIgBaglam(env, h.user);
  const planDisi = await botPlanDisi(env, h.user, h.limits, id);
  return botOk(origin, { bot: botPanel(yeni, { ig: botIgDurum(yeni, igb), planDisi }) });
}

async function botSil(req, env, origin, h, id) {
  const { res } = await botReadBody(req, BOT_BODY_MAX.kucuk, origin);
  if (res) return res;
  const row = await env.DB.prepare("SELECT id FROM chatbots WHERE id = ? AND user_id = ?").bind(id, h.user.id).first();
  if (!row) return botFail(origin, 404, "bulunamadi");
  // FK CASCADE'e güvenmeden çocukları da sil (aynı sahiplik koşuluyla).
  const sahip = "bot_id IN (SELECT id FROM chatbots WHERE id = ? AND user_id = ?)";
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM bot_messages WHERE ${sahip}`).bind(id, h.user.id),
    env.DB.prepare(`DELETE FROM bot_leads WHERE ${sahip}`).bind(id, h.user.id),
    env.DB.prepare(`DELETE FROM bot_conversations WHERE ${sahip}`).bind(id, h.user.id),
    env.DB.prepare("DELETE FROM chatbots WHERE id = ? AND user_id = ?").bind(id, h.user.id),
  ]);
  return botOk(origin);
}

async function botAnahtarYenile(req, env, origin, h, id) {
  const { res } = await botReadBody(req, BOT_BODY_MAX.kucuk, origin);
  if (res) return res;
  const yaz = a => env.DB.prepare("UPDATE chatbots SET web_anahtar = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ? RETURNING web_anahtar")
    .bind(a, id, h.user.id).first();
  let r;
  try { r = await yaz(botAnahtar()); }
  catch (e) { if (!anahtarCakisma(e)) throw e; r = await yaz(botAnahtar()); }
  if (!r) return botFail(origin, 404, "bulunamadi");
  return botOk(origin, { anahtar: r.web_anahtar });
}

// /gen/bot/:id/… alt yolları. GENİŞLETME NOKTASI: sonraki adımlar (test, kanal/ig, konusmalar, konusma/:kid…, leadler,
// lead/:lid…, istatistik) bu switch'e `case` ekler; `parca` = id'den sonraki yol parçaları.
async function botAlt(req, env, origin, h, id, parca, url, now, io) {
  const m = req.method, yol = parca.join("/");
  switch (yol) {
    case "": return m === "GET" ? botGetir(env, origin, h, id, now) : botGuncelle(req, env, origin, h, id);
    case "sil": if (m === "POST") return botSil(req, env, origin, h, id); break;
    case "anahtar": if (m === "POST") return botAnahtarYenile(req, env, origin, h, id); break;
    case "test": if (m === "POST") return botTest(req, env, origin, h, id, now, io); break;
    case "konusmalar": if (m === "GET") return botKonusmalar(env, origin, h, id, url); break;
    case "leadler": if (m === "GET") return botLeadler(env, origin, h, id, url); break;
    case "istatistik": if (m === "GET") return botIstatistik(env, origin, h, id, url, now); break;
    case "kanal/ig": if (m === "POST") return botKanalIg(req, env, origin, h, id, now, io); break;
  }
  // :kid / :lid alt yolları
  const [ust, alt, son] = parca;
  if ((ust === "konusma" || ust === "lead") && BOT_ID_RE.test(alt || "") && parca.length <= 3) {
    const nid = Number(alt);
    if (ust === "konusma") {
      if (son === undefined && m === "GET") return botKonusma(env, origin, h, id, nid);
      if (son === "devir" && m === "POST") return botDevir(req, env, origin, h, id, nid);
      if (son === "sil" && m === "POST") return botKonusmaSil(req, env, origin, h, id, nid);
    } else {
      if (son === undefined && m === "POST") return botLeadDurum(req, env, origin, h, id, nid);
      if (son === "sil" && m === "POST") return botLeadSil(req, env, origin, h, id, nid);
    }
  }
  return botFail(origin, 404, "not_found");
}

export async function chatbot(req, url, env, origin, ctx, io = {}) {
  if (url.pathname.startsWith("/bot/w/")) return botWidgetRoute(req, env, ctx, io);
  if (url.pathname === "/bot/ig/webhook") return botIgWebhook(req, env, ctx, io); // §8: Meta sunucusu, Origin yok; imza ile korunur
  if (url.pathname.startsWith("/bot/")) return botFail(null, 404, "not_found");
  const m = req.method;
  if (m !== "GET" && m !== "POST") return botFail(origin, 405, "method");
  if (!(env.BOT_ENABLED === "1" && env.DB && env.GEN_SALT && env.ACCOUNTS_ENABLED === "1")) return botFail(origin, 503, "not_ready");
  if (!origin) return botFail(null, 403, "origin");
  const now = io.now ?? Date.now();
  const rest = url.pathname.slice("/gen/bot".length).replace(/^\/+|\/+$/g, "");
  const parca = rest ? rest.split("/") : [];
  try {
    const h = await botHesap(req, env, origin, { ...io, now });
    if (h.res) return h.res;
    if (!parca.length) return await (m === "GET" ? botListe(env, origin, h, now) : botOlustur(req, env, origin, h, now));
    if (!BOT_ID_RE.test(parca[0])) return botFail(origin, 404, "not_found");
    return await botAlt(req, env, origin, h, Number(parca[0]), parca.slice(1), url, now, io);
  } catch (e) {
    if (notReadyErr(e)) return botFail(origin, 503, "not_ready");
    console.log(`bot ${parca.join("/") || "kok"} ${String(e?.message || e).slice(0, 120)}`);
    return botFail(origin, 500, "server");
  }
}

// /gen/bot ya da /gen/bot/… değilse veya OPTIONS ise null (index.js kendi CORS'unu verir).
// origin: io.origin (index.js allowedOrigin sonucu) verilmezse ham Origin yalnız platformSite tanıyorsa kabul edilir.
export async function chatbotRoute(req, env, ctx, io = {}) {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/bot/w/")) return botWidgetRoute(req, env, ctx, io); // widget kendi CORS'unu verir (OPTIONS dahil)
  if (url.pathname === "/bot/ig/webhook") return botIgWebhook(req, env, ctx, io); // §8 IG webhook (GET doğrulama / POST olay)
  if (req.method === "OPTIONS") return null;
  if (url.pathname !== "/gen/bot" && !url.pathname.startsWith("/gen/bot/")) return null;
  let origin = io.origin;
  if (origin === undefined) {
    const raw = req.headers.get("origin");
    origin = raw && platformSite(env, raw) ? raw : null;
  }
  return chatbot(req, url, env, origin, ctx, io);
}

// ---------- §3.1 saklama temizliği (saatlik cron) ----------
const TEMIZLIK = [
  "DELETE FROM bot_messages WHERE id IN (SELECT id FROM bot_messages WHERE created_at < datetime('now', '-90 days') ORDER BY id LIMIT 2000)",
  "DELETE FROM bot_conversations WHERE id IN (SELECT id FROM bot_conversations WHERE updated_at < datetime('now', '-90 days') LIMIT 500)",
  "DELETE FROM bot_leads WHERE created_at < datetime('now', '-365 days')",
  "DELETE FROM gen_usage WHERE day GLOB 'bot:*' AND day < 'bot:' || strftime('%Y-%m', 'now', '-13 months')",
];
export async function botCleanup(env) {
  if (!env?.DB) return 0;
  let toplam = 0;
  for (const sql of TEMIZLIK) {
    try { toplam += Number((await env.DB.prepare(sql).run())?.meta?.changes) || 0; }
    catch (e) { if (!notReadyErr(e)) console.log(`bot cleanup ${String(e?.message || e).slice(0, 120)}`); }
  }
  return toplam;
}

// =====================================================================================================
// arka-2b: panel uçları — test sohbeti (§7.4), konuşmalar, devir, leadler, istatistik (§7.3, §7.6, §7.7)
// =====================================================================================================

const botSahip = (env, h, id) => env.DB.prepare(BOT_SEC).bind(id, h.user.id).first();
const bulunamadi = origin => botFail(origin, 404, "bulunamadi");
const gecersiz = (origin, alan, neden = "gecersiz") => botFail(origin, 400, "invalid", { alan, neden });
const OFSET_MAX = 1000;

// ?ofset=… → sayı | null (geçersiz). Boş → 0.
function botOfset(url) {
  const s = url.searchParams.get("ofset");
  if (s === null || s === "") return 0;
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return n <= OFSET_MAX ? n : null;
}
const secim = (url, ad, izinli) => {
  const v = url.searchParams.get(ad);
  if (v === null || v === "") return { v: null };
  return izinli.includes(v) ? { v } : { hata: true };
};

// ---------- cevaplama (§6) — arka-3: hazır + AI (§6.2) + IG lead beklemesi + kayıt (adım 6) ----------
const jsonDizi = s => { const v = typeof s === "string" ? botJsonAl(s, []) : s; return Array.isArray(v) ? v : []; };

// Aylık kota ayırma (§5.1). Sınır 0 ise reserve'e gitmez: UPSERT'in ilk INSERT'i max denetlemez.
async function botAyir(env, c, kind) {
  if (c.test && c.kotaAyir === false) return true;
  const k = botKotaKeys(c.user.id), hz = kind === "bh";
  const max = Number(hz ? c.limits.hazir : c.limits.ai) || 0;
  if (max <= 0) return false;
  const it = hz ? { name: "hazir", kind: "bh", key: k.h, inc: 1, max } : { name: "ai", kind: "ba", key: k.a, inc: 1, max };
  return (await reserve(env.DB, botAy(c.now), [it])).ok;
}
// AI hatasında ba iadesi (§6 4b); iade başarısızsa akış sürer.
async function botIade(env, c) {
  if (c.test && c.kotaAyir === false) return;
  try { await env.DB.prepare(DECR).bind(1, botAy(c.now), botKotaKeys(c.user.id).a).run(); }
  catch (e) { console.log(`bot iade ${String(e?.message || e).slice(0, 80)}`); }
}
const botKanarya = () => "K" + [...crypto.getRandomValues(new Uint8Array(6))].map(x => x.toString(16).padStart(2, "0")).join("");
const botSahte = env => env.GEN_PROVIDER === "fake" && !!env.DEV_ORIGINS;
const aiVar = env => !!env.ANTHROPIC_API_KEY || botSahte(env);
const SIZINTI_RE = /<\/?(bilgi|persona|gecmis|soru)>/i;

// §6.2. Dönüş: {ok:true, cevap, devret, dil} | {ok:false, kind, iade}
export async function botAi(c, bot, metin, gecmis, dil0) {
  if (botSahte(c.env)) return { ok: true, cevap: "ÖRNEK AI cevabı: bu metin sahte sağlayıcıdan geldi.", devret: false, dil: dil0 };
  const kanarya = botKanarya();
  const f = c.io?.fetch || ((u, i) => fetch(u, i));
  let obj;
  try {
    ({ obj } = await llmJson(c.env, f, {
      system: botAiSistem(bot, kanarya), user: botAiKullanici(gecmis, metin), schema: BOT_AI_SCHEMA,
      maxTokens: BOT_LIM.AI_MAX_TOKENS, timeout: BOT_LIM.AI_TIMEOUT,
    }));
  } catch (e) {
    const kind = e instanceof LlmError ? e.kind : "fail";
    if (!(e instanceof LlmError)) console.log(`bot ai ${String(e?.message || e).slice(0, 80)}`);
    return { ok: false, kind, iade: true };
  }
  const ham = typeof obj?.cevap === "string" ? obj.cevap.trim() : "";
  if (!ham) return { ok: false, kind: "bos", iade: true };
  if (ham.includes(kanarya) || SIZINTI_RE.test(ham)) { console.log("bot leak"); return { ok: false, kind: "leak", iade: false }; }
  const dil = obj.dil === "tr" || obj.dil === "en" ? obj.dil : botDil(ham, dil0);
  return { ok: true, cevap: aiKirp(ham), devret: obj.devret === true, dil };
}

// AI geçmişi: testte gövdedeki gecmis; canlıda konuşmanın son GECMIS kullanıcı/bot mesajı (eskiden yeniye).
async function botGecmis(c, konusma) {
  if (c.test || !konusma?.id) return Array.isArray(c.gecmis) ? c.gecmis.slice(-BOT_LIM.GECMIS) : [];
  const { results = [] } = await c.env.DB.prepare(
    "SELECT rol, metin FROM bot_messages WHERE konusma_id = ? AND rol != 'sistem' ORDER BY id DESC LIMIT ?")
    .bind(konusma.id, BOT_LIM.GECMIS).all();
  return results.reverse().map(r => ({ rol: r.rol, metin: r.metin }));
}

// Buton hedefinin kullanıcıya görünen etiketi (kullanıcı mesajı metni olarak saklanır).
function butonEtiket(hedef, menu, niyetler, eylem) {
  for (const b of [...menu, ...eylem, ...niyetler.flatMap(n => Array.isArray(n.butonlar) ? n.butonlar : [])])
    if (b && b.hedef === hedef && typeof b.etiket === "string" && b.etiket) return b.etiket;
  const n = hedef.startsWith("n:") && niyetler.find(x => x.k === hedef.slice(2));
  return (n && (n.ad || n.k)) || hedef;
}

// c = {env, user, limits, now, test?, gecmis?, io?, kotaAyir?}; bot = chatbots satırı (taslak bindirilmiş olabilir);
// konusma = bot_conversations satırı | null (test). girdi = {metin?|buton?, dis_mid?}.
// Dönüş (dış): Sonuc = {cevaplar, devir, lead_iste, eslesme, dil}; iç alanlar: eslesmedi, ai_hata, sistem[], devirAc, bekleyen,
// lead, mesajIdler (kayıt yapıldıysa {kullanici, bot[]}). Test değilse ve konusma varsa adım 6 kaydını da yapar.
export async function cevapla(c, bot, konusma, girdi, { kanal = "web", test = false } = {}) {
  c = { ...c, test: !!(c.test || test) };
  const env = c.env;
  const dil0 = konusma?.dil === "tr" || konusma?.dil === "en" ? konusma.dil : (bot.dil || "tr");
  const metin = typeof girdi.metin === "string" ? girdi.metin : "";
  const dil = metin ? botDil(metin, dil0) : dil0;
  const menu = jsonDizi(bot.menu), niyetler = jsonDizi(bot.niyetler).filter(n => n && n.aktif !== false);
  const eylem = eylemButonlari(bot.bulunamazsa || "ikisi", dil);
  const mod = bot.mod || "hazir";
  const s = { cevaplar: [], devir: false, lead_iste: false, eslesme: null, dil, sistem: [], devirAc: false };
  const bitir = async (cevap, ek = {}) => {
    Object.assign(s, ek);
    if (cevap) s.cevaplar.push(cevap);
    if (!c.test && konusma) s.mesajIdler = await botKaydet(env, bot, konusma, girdi, s, { kanal, menu, niyetler, eylem });
    return s;
  };
  const geri = kaynak => {
    if (kaynak === "geri" && kanal === "ig" && konusma && !(Number(konusma.mesaj_sayisi) > 0))
      return bitir({ metin: bot.karsilama || metinAl(dil, "karsilama"), butonlar: menu, kaynak: "karsilama" });
    return bitir({ metin: bot.geri_donus || metinAl(dil, "geri"), butonlar: menuArtiEylem(menu, eylem), kaynak },
      kaynak === "geri" && metin ? { eslesmedi: true } : {});
  };
  const hazir = (n, puan) => bitir({ metin: n.cevap || "", butonlar: Array.isArray(n.butonlar) ? n.butonlar : [], kaynak: "hazir" },
    { eslesme: { k: n.k, ad: n.ad || n.k, puan } });

  // 1. devirde bot susar
  if (konusma && Number(konusma.devir) === 1) return bitir(null, { devir: true });

  // 2. IG lead beklemesi
  if (kanal === "ig" && konusma?.bekleyen === "lead" && metin) {
    s.bekleyen = null;
    const l = botLeadBul(metin);
    if (l) {
      s.lead = { ...l, ad: l.ad || konusma.ad || "" };
      s.sistem.push("lead_alindi");
      return bitir({ metin: metinAl(dil, "lead_tesekkur"), butonlar: [], kaynak: "lead" });
    }
  }

  // 3. butonlar
  if (girdi.buton) {
    const b = String(girdi.buton);
    if (b.startsWith("n:")) {
      const n = niyetler.find(x => x.k === b.slice(2));
      if (!n) return geri("geri");
      return (await botAyir(env, c, "bh")) ? hazir(n, 1) : geri("kota");
    }
    if (b === "menu") {
      if (!(await botAyir(env, c, "bh"))) return geri("kota");
      return bitir({ metin: bot.karsilama || metinAl(dil, "karsilama"), butonlar: menu, kaynak: "menu" });
    }
    if (b === "lead") {
      if (kanal === "ig") return bitir({ metin: metinAl(dil, "lead_istek_ig"), butonlar: [], kaynak: "lead" }, { bekleyen: "lead" });
      return bitir({ metin: metinAl(dil, "lead_istek"), butonlar: [], kaynak: "lead" }, { lead_iste: true });
    }
    if (b === "insan") {
      s.sistem.push("devir_acildi");
      return bitir({ metin: bot.devir_mesaji || metinAl(dil, "devir"), butonlar: [], kaynak: "devir" }, { devir: true, devirAc: true });
    }
    return geri("geri");
  }
  if (!metin) return geri("geri");

  // 4. hazır eşleşme
  const eslestir = () => { const e = botEslestir(jsonDizi(bot.dizin), metin); const n = e && niyetler.find(x => x.k === e.k); return n ? { n, puan: e.puan } : null; };
  let bhDolu = false;
  if (mod === "hazir" || mod === "karma") {
    const e = eslestir();
    if (e) {
      if (await botAyir(env, c, "bh")) return hazir(e.n, e.puan);
      if (mod !== "karma") return geri("kota");
      bhDolu = true;
    }
  }
  // 4b. AI
  if ((mod === "ai" || mod === "karma") && aiVar(env)) {
    const gecmis = await botGecmis(c, konusma);
    if (!(await botAyir(env, c, "ba"))) {
      if (mod === "ai") {
        const e = eslestir();
        if (e && (await botAyir(env, c, "bh"))) return hazir(e.n, e.puan);
      }
      return geri("kota");
    }
    const r = await botAi(c, bot, metin, gecmis, dil);
    if (r.ok) {
      s.dil = r.dil;
      return bitir({ metin: r.cevap, butonlar: r.devret ? eylem : [], kaynak: "ai" });
    }
    if (r.iade) await botIade(env, c);
    s.ai_hata = r.kind;
    // karma'da eşleşme vardı ama bh doluydu: AI da düşerse ziyaretçiye kota metni (eşleşme yok değil)
    return geri(bhDolu ? "kota" : "geri");
  }
  // karma'da eşleşme vardı ama bh doluydu ve AI yok → kota
  return geri(bhDolu ? "kota" : "geri");
}

// Adım 6: tek batch. Kullanıcı mesajı + cevaplar + sistem mesajları (+ lead) + konuşma güncellemesi.
async function botKaydet(env, bot, konusma, girdi, s, { kanal, menu, niyetler, eylem }) {
  const db = env.DB, kid = konusma.id, bid = bot.id;
  const kMetin = girdi.buton ? butonEtiket(String(girdi.buton), menu, niyetler, eylem) : String(girdi.metin || "");
  const ins = "INSERT INTO bot_messages (konusma_id, bot_id, rol, metin, kaynak, niyet, puan, butonlar, dis_mid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const q = [db.prepare(ins).bind(kid, bid, "kullanici", kMetin.slice(0, 2000), s.eslesmedi ? "eslesmedi" : null, null, null, null,
    girdi.dis_mid ? String(girdi.dis_mid) : null)];
  // sistem mesajı (devir_acildi / lead_alindi) cevaptan önce: panel zaman çizelgesinde olayı cevabın üstünde gösterir
  for (const k of s.sistem) q.push(db.prepare(ins).bind(kid, bid, "sistem", k, k, null, null, null, null));
  const botBas = q.length;
  for (const cv of s.cevaplar) {
    const hz = cv.kaynak === "hazir" && s.eslesme;
    q.push(db.prepare(ins).bind(kid, bid, "bot", cv.metin, cv.kaynak, hz ? s.eslesme.k : null, hz ? s.eslesme.puan : null,
      cv.butonlar?.length ? JSON.stringify(cv.butonlar) : null, null));
  }
  if (s.lead) q.push(db.prepare("INSERT INTO bot_leads (bot_id, konusma_id, kanal, ad, eposta, telefon, notu) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(bid, kid, kanal, s.lead.ad || "", s.lead.eposta || "", s.lead.telefon || "", s.lead.notu || ""));
  const sonMetin = (s.cevaplar.length ? s.cevaplar[s.cevaplar.length - 1].metin : kMetin).slice(0, 120);
  const set = ["mesaj_sayisi = mesaj_sayisi + ?", "son_mesaj = ?", "updated_at = datetime('now')", "dil = ?", "okunmadi = okunmadi + 1"];
  const deger = [1 + s.cevaplar.length, sonMetin, s.dil === "en" ? "en" : "tr"];
  if (kanal === "ig") set.push("son_kullanici_at = datetime('now')");
  if (s.devirAc) set.push("devir = 1");
  if (s.bekleyen !== undefined) { set.push("bekleyen = ?"); deger.push(s.bekleyen); }
  if (s.lead?.ad) { set.push("ad = CASE WHEN ad IS NULL OR ad = '' THEN ? ELSE ad END"); deger.push(s.lead.ad); }
  q.push(db.prepare(`UPDATE bot_conversations SET ${set.join(", ")} WHERE id = ?`).bind(...deger, kid));
  const res = await db.batch(q);
  const id = r => { const v = r?.meta?.last_row_id; return v === undefined || v === null ? null : Number(v); };
  return { kullanici: id(res[0]), bot: s.cevaplar.map((_, i) => id(res[botBas + i])) };
}

// Taslağı (botDogrula çıktısı) kayıtlı satırın üzerine bindirir; dizin anında hesaplanır.
function botBindir(row, d) {
  const b = { ...row };
  for (const k of ["ad", "mod", "dil", "karsilama", "geri_donus", "devir_mesaji", "bulunamazsa"]) if (d[k] !== undefined) b[k] = d[k];
  if (d.aktif !== undefined) b.aktif = d.aktif ? 1 : 0;
  if (d.menu !== undefined) b.menu = JSON.stringify(d.menu);
  if (d.niyetler !== undefined) { b.niyetler = JSON.stringify(d.niyetler); b.dizin = JSON.stringify(botDizin(d.niyetler)); }
  if (d.ai) for (const k of ["persona", "ton", "bilgi"]) if (d.ai[k] !== undefined) b[k] = d.ai[k];
  return b;
}

const TEST_METIN_MAX = 1000;

async function botTest(req, env, origin, h, id, now, io = {}) {
  const { g, res } = await botReadBody(req, BOT_BODY_MAX.test, origin);
  if (res) return res;
  const row = await botSahip(env, h, id);
  if (!row) return bulunamadi(origin);
  if (h.limits.deneme_bitti) return botFail(origin, 403, "deneme_bitti");
  const metinVar = g.metin !== undefined && g.metin !== null, butonVar = g.buton !== undefined && g.buton !== null;
  if (metinVar === butonVar) return gecersiz(origin, metinVar ? "buton" : "metin", metinVar ? "fazla" : "bos");
  let girdi;
  if (metinVar) {
    if (typeof g.metin !== "string") return gecersiz(origin, "metin");
    const t = temiz(g.metin).trim();
    if (!t) return gecersiz(origin, "metin", "bos");
    if (t.length > TEST_METIN_MAX) return gecersiz(origin, "metin", "uzun");
    girdi = { metin: t };
  } else {
    if (typeof g.buton !== "string" || !g.buton || g.buton.length > 80) return gecersiz(origin, "buton");
    girdi = { buton: g.buton };
  }
  if (g.gecmis !== undefined && g.gecmis !== null) {
    if (!Array.isArray(g.gecmis)) return gecersiz(origin, "gecmis");
    if (g.gecmis.length > 10) return gecersiz(origin, "gecmis", "fazla");
    for (const [i, x] of g.gecmis.entries())
      if (!x || !["kullanici", "bot"].includes(x.rol) || typeof x.metin !== "string" || x.metin.length > TEST_METIN_MAX * 2)
        return gecersiz(origin, `gecmis.${i}`);
  }
  let bot = row;
  if (g.taslak !== undefined && g.taslak !== null) {
    if (typeof g.taslak !== "object" || Array.isArray(g.taslak)) return gecersiz(origin, "taslak");
    const { surum, ...ts } = g.taslak;
    const kayitliK = botJsonAl(row.niyetler, []).map(n => n?.k).filter(Boolean);
    const v = botDogrula(ts, { taslak: true, kayitliK });
    if (!v.ok) return gecersiz(origin, v.alan, v.neden);
    bot = botBindir(row, v.deger);
  }
  // hız: btp (dakikalık)
  const day = genDay(now), dk = new Date(now + 3 * 3600e3).toISOString().slice(11, 16);
  const hk = await keyOf(env, day, "btp", `${h.user.id}|${dk}`);
  const hz = await reserve(env.DB, day, [{ name: "btp", kind: "tp", key: hk, inc: 1, max: BOT_HIZ.TEST_DAKIKA }]);
  if (!hz.ok) return botJson(origin, 429, { ok: false, error: "hiz", retry_after: 60 });

  const c = { env, user: h.user, limits: h.limits, now, test: true, gecmis: g.gecmis || [], io };
  const s = await cevapla(c, bot, null, girdi, { kanal: "web", test: true });
  const k = botKotaKeys(h.user.id);
  await reserve(env.DB, botAy(now), [{ name: "test", kind: "bt", key: k.t, inc: 1, max: 1000000000 }]);
  const kota = await botKota(env, h.user, h.limits, now);
  // Sonuc (§7.4) + kota; ai_hata yalnız bu uçta. İç alanlar (sistem, devirAc, bekleyen, lead, eslesmedi…) dışarı çıkmaz.
  return botOk(origin, { cevaplar: s.cevaplar, devir: s.devir, lead_iste: s.lead_iste, eslesme: s.eslesme, dil: s.dil, kota,
    ...(s.ai_hata ? { ai_hata: s.ai_hata } : {}) });
}

// ---------- konuşmalar ----------
const KONUSMA_SEC = `SELECT c.id, c.kanal, c.ad, c.dil, c.devir, c.okunmadi, c.mesaj_sayisi, c.son_mesaj, c.created_at, c.updated_at,
  EXISTS (SELECT 1 FROM bot_leads l WHERE l.konusma_id = c.id) AS lead FROM bot_conversations c`;
export const konusmaOzet = r => ({
  id: Number(r.id), kanal: r.kanal, ad: r.ad || null, dil: r.dil, devir: Number(r.devir) === 1, okunmadi: Number(r.okunmadi) || 0,
  mesaj_sayisi: Number(r.mesaj_sayisi) || 0, son_mesaj: r.son_mesaj || "", created_at: r.created_at, updated_at: r.updated_at,
  lead: !!Number(r.lead),
});
export const mesajCikti = r => ({
  id: Number(r.id), rol: r.rol, metin: r.metin, kaynak: r.kaynak ?? null, niyet: r.niyet ?? null,
  puan: r.puan === null || r.puan === undefined ? null : Number(r.puan), butonlar: jsonDizi(r.butonlar), hata: r.hata ?? null,
  created_at: r.created_at,
});
export const leadCikti = r => ({
  id: Number(r.id), kanal: r.kanal, ad: r.ad || "", eposta: r.eposta || "", telefon: r.telefon || "", notu: r.notu || "",
  durum: r.durum, konusma_id: r.konusma_id === null || r.konusma_id === undefined ? null : Number(r.konusma_id), created_at: r.created_at,
});

async function botKonusmalar(env, origin, h, id, url) {
  const kanal = secim(url, "kanal", ["web", "ig"]); if (kanal.hata) return gecersiz(origin, "kanal");
  const filtre = secim(url, "filtre", ["devir", "okunmadi"]); if (filtre.hata) return gecersiz(origin, "filtre");
  const ofset = botOfset(url); if (ofset === null) return gecersiz(origin, "ofset");
  if (!(await botSahip(env, h, id))) return bulunamadi(origin);
  const w = ["c.bot_id = ?"], a = [id];
  if (kanal.v) { w.push("c.kanal = ?"); a.push(kanal.v); }
  if (filtre.v === "devir") w.push("c.devir = 1");
  if (filtre.v === "okunmadi") w.push("c.okunmadi > 0");
  const { results = [] } = await env.DB.prepare(`${KONUSMA_SEC} WHERE ${w.join(" AND ")} ORDER BY c.updated_at DESC, c.id DESC LIMIT 51 OFFSET ?`)
    .bind(...a, ofset).all();
  const devam = results.length > 50 && ofset + 50 <= OFSET_MAX ? ofset + 50 : null;
  return botOk(origin, { konusmalar: results.slice(0, 50).map(konusmaOzet), devam });
}

async function botKonusma(env, origin, h, id, kid) {
  if (!(await botSahip(env, h, id))) return bulunamadi(origin);
  const r = await env.DB.prepare(`${KONUSMA_SEC} WHERE c.id = ? AND c.bot_id = ?`).bind(kid, id).first();
  if (!r) return bulunamadi(origin);
  const [m, l] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM (SELECT * FROM bot_messages WHERE konusma_id = ? ORDER BY id DESC LIMIT 200) ORDER BY id ASC").bind(kid),
    env.DB.prepare("SELECT * FROM bot_leads WHERE konusma_id = ? AND bot_id = ? ORDER BY id DESC LIMIT 1").bind(kid, id),
    env.DB.prepare("UPDATE bot_conversations SET okunmadi = 0 WHERE id = ? AND bot_id = ?").bind(kid, id),
  ]);
  const lead = l?.results?.[0];
  return botOk(origin, {
    konusma: { ...konusmaOzet(r), okunmadi: 0 }, mesajlar: (m?.results || []).map(mesajCikti), lead: lead ? leadCikti(lead) : null,
  });
}

async function botDevir(req, env, origin, h, id, kid) {
  const { g, res } = await botReadBody(req, BOT_BODY_MAX.kucuk, origin);
  if (res) return res;
  if (typeof g.devir !== "boolean") return gecersiz(origin, "devir");
  if (!(await botSahip(env, h, id))) return bulunamadi(origin);
  const r = await env.DB.prepare("SELECT devir FROM bot_conversations WHERE id = ? AND bot_id = ?").bind(kid, id).first();
  if (!r) return bulunamadi(origin);
  const yeni = g.devir ? 1 : 0;
  if (Number(r.devir) !== yeni) {
    const olay = g.devir ? "devir_acildi" : "devir_kapandi";
    await env.DB.batch([
      env.DB.prepare("UPDATE bot_conversations SET devir = ?, updated_at = datetime('now') WHERE id = ? AND bot_id = ?").bind(yeni, kid, id),
      env.DB.prepare("INSERT INTO bot_messages (konusma_id, bot_id, rol, metin, kaynak) VALUES (?, ?, 'sistem', ?, ?)").bind(kid, id, olay, olay),
    ]);
  }
  const s = await env.DB.prepare(`${KONUSMA_SEC} WHERE c.id = ? AND c.bot_id = ?`).bind(kid, id).first();
  return botOk(origin, { konusma: konusmaOzet(s) });
}

async function botKonusmaSil(req, env, origin, h, id, kid) {
  const { res } = await botReadBody(req, BOT_BODY_MAX.kucuk, origin);
  if (res) return res;
  if (!(await botSahip(env, h, id))) return bulunamadi(origin);
  const r = await env.DB.prepare("SELECT id FROM bot_conversations WHERE id = ? AND bot_id = ?").bind(kid, id).first();
  if (!r) return bulunamadi(origin);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM bot_messages WHERE konusma_id = ?").bind(kid),
    env.DB.prepare("UPDATE bot_leads SET konusma_id = NULL WHERE konusma_id = ?").bind(kid),
    env.DB.prepare("DELETE FROM bot_conversations WHERE id = ? AND bot_id = ?").bind(kid, id),
  ]);
  return botOk(origin);
}

// ---------- leadler ----------
async function botLeadler(env, origin, h, id, url) {
  const durum = secim(url, "durum", ["yeni", "islendi"]); if (durum.hata) return gecersiz(origin, "durum");
  const ofset = botOfset(url); if (ofset === null) return gecersiz(origin, "ofset");
  if (!(await botSahip(env, h, id))) return bulunamadi(origin);
  const w = durum.v ? " AND durum = ?" : "", a = durum.v ? [id, durum.v] : [id];
  const [l, t] = await env.DB.batch([
    env.DB.prepare(`SELECT * FROM bot_leads WHERE bot_id = ?${w} ORDER BY id DESC LIMIT 101 OFFSET ?`).bind(...a, ofset),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM bot_leads WHERE bot_id = ?${w}`).bind(...a),
  ]);
  const rows = l?.results || [];
  const devam = rows.length > 100 && ofset + 100 <= OFSET_MAX ? ofset + 100 : null;
  return botOk(origin, { leadler: rows.slice(0, 100).map(leadCikti), toplam: Number(t?.results?.[0]?.n) || 0, devam });
}

async function botLeadDurum(req, env, origin, h, id, lid) {
  const { g, res } = await botReadBody(req, BOT_BODY_MAX.kucuk, origin);
  if (res) return res;
  if (!["yeni", "islendi"].includes(g.durum)) return gecersiz(origin, "durum");
  if (!(await botSahip(env, h, id))) return bulunamadi(origin);
  const r = await env.DB.prepare("UPDATE bot_leads SET durum = ? WHERE id = ? AND bot_id = ? RETURNING *").bind(g.durum, lid, id).first();
  return r ? botOk(origin, { lead: leadCikti(r) }) : bulunamadi(origin);
}

async function botLeadSil(req, env, origin, h, id, lid) {
  const { res } = await botReadBody(req, BOT_BODY_MAX.kucuk, origin);
  if (res) return res;
  if (!(await botSahip(env, h, id))) return bulunamadi(origin);
  const r = await env.DB.prepare("DELETE FROM bot_leads WHERE id = ? AND bot_id = ? RETURNING id").bind(lid, id).first();
  return r ? botOk(origin) : bulunamadi(origin);
}

// ---------- istatistik (§7.7) ----------
const sqlZaman = ms => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

export function istatGunler(now, gun) {
  const bugun = genDay(now), t0 = Date.parse(bugun + "T00:00:00Z");
  const gunler = [];
  for (let i = gun - 1; i >= 0; i--) gunler.push(new Date(t0 - i * 864e5).toISOString().slice(0, 10));
  // UTC+3 gün başı → UTC alt sınır
  return { gunler, alt: sqlZaman(Date.parse(gunler[0] + "T00:00:00Z") - 3 * 3600e3) };
}

async function botIstatistik(env, origin, h, id, url, now) {
  const gs = url.searchParams.get("gun");
  const gun = gs === null || gs === "" ? 30 : Number(gs);
  if (![7, 30, 90].includes(gun) || (gs && !/^\d+$/.test(gs))) return gecersiz(origin, "gun");
  const row = await botSahip(env, h, id);
  if (!row) return bulunamadi(origin);
  const { gunler, alt } = istatGunler(now, gun);
  const [say, niy, esl] = await env.DB.batch([
    env.DB.prepare(`SELECT date(created_at, '+3 hours') AS g, rol AS r, kaynak AS k, COUNT(*) AS n FROM bot_messages
        WHERE bot_id = ?1 AND created_at >= ?2 GROUP BY g, r, k
      UNION ALL SELECT date(created_at, '+3 hours'), 'lead', NULL, COUNT(*) FROM bot_leads WHERE bot_id = ?1 AND created_at >= ?2
        GROUP BY date(created_at, '+3 hours')
      UNION ALL SELECT NULL, 'konusma', NULL, COUNT(*) FROM bot_conversations WHERE bot_id = ?1 AND created_at >= ?2`).bind(id, alt),
    env.DB.prepare(`SELECT niyet AS k, COUNT(*) AS n FROM bot_messages WHERE bot_id = ? AND rol = 'bot' AND niyet IS NOT NULL
      AND created_at >= ? GROUP BY niyet ORDER BY n DESC, niyet ASC LIMIT 10`).bind(id, alt),
    env.DB.prepare(`SELECT substr(metin, 1, 200) AS metin, created_at FROM bot_messages WHERE bot_id = ? AND rol = 'kullanici'
      AND kaynak = 'eslesmedi' AND created_at >= ? ORDER BY id DESC LIMIT 20`).bind(id, alt),
  ]);
  const bos = () => ({ gelen: 0, hazir: 0, ai: 0, geri: 0, lead: 0 });
  const gunluk = new Map(gunler.map(g => [g, { gun: g, ...bos() }]));
  const toplam = { konusma: 0, gelen: 0, hazir: 0, ai: 0, geri: 0, kota: 0, devir: 0, lead: 0, eslesme_orani: 0 };
  for (const x of say?.results || []) {
    const n = Number(x.n) || 0, gk = x.g ? gunluk.get(x.g) : null;
    let alan = null;
    if (x.r === "konusma") { toplam.konusma += n; continue; }
    if (x.r === "lead") alan = "lead";
    else if (x.r === "kullanici") alan = "gelen";
    else if (x.r === "bot" && ["hazir", "ai", "geri", "kota"].includes(x.k)) alan = x.k;
    else if (x.r === "sistem" && x.k === "devir_acildi") alan = "devir";
    if (!alan) continue;
    toplam[alan] += n;
    if (gk && alan in gk) gk[alan] += n;
  }
  const payda = toplam.hazir + toplam.ai + toplam.geri + toplam.kota;
  toplam.eslesme_orani = payda ? Math.round(((toplam.hazir + toplam.ai) / payda) * 1000) / 1000 : 0;
  const adlar = new Map(botJsonAl(row.niyetler, []).filter(n => n?.k).map(n => [n.k, n.ad || n.k]));
  const niyetler = (niy?.results || []).map(x => ({ k: x.k, ad: adlar.get(x.k) || x.k, n: Number(x.n) || 0 }));
  const eslesmeyen = (esl?.results || []).map(x => ({ metin: x.metin, created_at: x.created_at }));
  const kota = await botKota(env, h.user, h.limits, now);
  return botOk(origin, { gun, gunluk: [...gunluk.values()], toplam, niyetler, eslesmeyen, kota });
}

// ---------- §9 web widget — herkese açık uçlar (/bot/w/:key/config|mesaj|lead) ----------
const WK_RE = /^wk_[A-Za-z0-9_-]{24}$/;
const OTURUM_RE = /^s_[A-Za-z0-9_-]{22}$/;
const b64url = u8 => btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const yeniOturum = () => "s_" + b64url(crypto.getRandomValues(new Uint8Array(16)));
const W_HDR = origin => ({ "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": origin, vary: "Origin" });
// Origin doğrulanmadan dönen widget hataları (bilinmeyen anahtar, kapalı servis, izinsiz alan) "*" ile okunabilir olmalı:
// yoksa sohbet.js hatayı göremez, yalnız "ağ hatası" görür. Gövde sır içermez; kimlik bilgisi (cookie) kullanılmaz.
const wHata = (status, error) => new Response(JSON.stringify({ ok: false, error }), { status, headers: W_HDR("*") });

// §9.1: ham Origin, botun web_alanlar listesine göre. localhost/127.0.0.1 http olabilir ama listede olmalı.
export function botOriginIzinli(origin, alanlar) {
  if (typeof origin !== "string" || !origin || !Array.isArray(alanlar) || !alanlar.length) return false;
  let u;
  try { u = new URL(origin); } catch { return false; }
  if (u.origin !== origin) return false;
  const h = u.hostname.toLowerCase();
  const yerel = h === "localhost" || h === "127.0.0.1";
  if (!(u.protocol === "https:" || (yerel && u.protocol === "http:"))) return false;
  for (const a0 of alanlar) {
    if (typeof a0 !== "string" || !a0) continue;
    const a = a0.toLowerCase();
    if (a.startsWith("*.")) { const x = a.slice(2); if (x && (h === x || h.endsWith("." + x))) return true; }
    else if (h === a || h === "www." + a) return true;
  }
  return false;
}

const W_BOT_SEC = `SELECT b.*, u.plan AS u_plan, u.plan_limits AS u_plan_limits, u.created_at AS u_created_at,
  (SELECT COUNT(*) FROM chatbots x WHERE x.user_id = b.user_id AND x.id < b.id) AS sira_no
  FROM chatbots b JOIN users u ON u.id = b.user_id WHERE b.web_anahtar = ?`;

// §5.2 widget hız sınırları; tek reserve (UTC+3 gün). tur: "mesaj" | "lead" | "yeni" (konuşma açma) | "guncel". oturum yeni ise bwo atlanır.
async function botWidgetHiz(env, bot, ip, oturum, tur, now) {
  const day = genDay(now), dk = new Date(now + 3 * 3600e3).toISOString().slice(11, 16), p = ipPrefix(ip);
  const it = [{ name: "wm", kind: "wm", key: await keyOf(env, day, "bwm", `${bot.id}|${p}|${dk}`), inc: 1, max: BOT_HIZ.W_DAKIKA }];
  if (tur === "lead") it.push({ name: "wl", kind: "wl", key: await keyOf(env, day, "bwl", p), inc: 1, max: BOT_HIZ.W_LEAD_GUN });
  else if (tur === "mesaj") {
    it.push({ name: "wi", kind: "wi", key: await keyOf(env, day, "bwi", p), inc: 1, max: BOT_HIZ.W_IP_GUN });
    it.push({ name: "wb", kind: "wb", key: await keyOf(env, day, "bwb", String(bot.id)), inc: 1, max: BOT_HIZ.W_BOT_GUN });
    if (oturum) it.push({ name: "wo", kind: "wo", key: await keyOf(env, day, "bwo", oturum), inc: 1, max: BOT_HIZ.W_OTURUM_GUN });
  } else if (tur === "yeni") it[0] = { name: "wy", kind: "wy", key: await keyOf(env, day, "bwy", `${bot.id}|${p}`), inc: 1, max: BOT_HIZ.W_YENI_OTURUM_GUN };
  // tur "guncel" (aynı konuşmada lead düzeltme): yalnız dakika sınırı
  const r = await reserve(env.DB, day, it);
  return r.ok ? null : (r.failed.includes("wm") ? 60 : 3600);
}

// io (yalnız test): now, fetch (AI), ip. Canlıda ip = cf-connecting-ip.
export async function botWidgetRoute(req, env, ctx, io = {}) {
  const url = new URL(req.url);
  const parca = url.pathname.slice("/bot/w/".length).split("/");
  const key = parca[0] || "", uc = parca.slice(1).join("/");
  const onIstek = req.method === "OPTIONS";
  if (!WK_RE.test(key)) return onIstek ? botFail(null, 404, "bulunamadi") : wHata(404, "bulunamadi");
  if (!(env.BOT_ENABLED === "1" && env.DB && env.GEN_SALT && env.ACCOUNTS_ENABLED === "1")) return onIstek ? botFail(null, 503, "not_ready") : wHata(503, "not_ready");
  const ham = req.headers.get("origin");
  let origin = null;
  try {
    const bot = await env.DB.prepare(W_BOT_SEC).bind(key).first();
    if (!bot) return onIstek ? botFail(null, 404, "bulunamadi") : wHata(404, "bulunamadi");
    // OPTIONS izinsiz alanda ACAO almaz (ön istek düşer); GET/POST yanıtı ise okunabilir hata döner, işlem yapılmaz
    if (!botOriginIzinli(ham, botJsonAl(bot.web_alanlar, []))) return onIstek ? botFail(null, 403, "origin") : wHata(403, "origin");
    origin = ham;
    const m = req.method;
    if (m === "OPTIONS") return new Response(null, { status: 204, headers: { ...W_HDR(origin),
      "access-control-allow-methods": "GET, POST", "access-control-allow-headers": "content-type", "access-control-max-age": "600" } });
    const yer = { config: "GET", mesaj: "POST", lead: "POST" }[uc];
    if (!yer) return botFail(origin, 404, "bulunamadi");
    if (m !== yer) return botFail(origin, 405, "method");
    const now = io.now ?? Date.now();
    const user = { id: bot.user_id, plan: bot.u_plan, plan_limits: bot.u_plan_limits, created_at: bot.u_created_at };
    const limits = botLimits(user, now);
    const kapali = !limits || limits.deneme_bitti || !Number(bot.aktif) || !Number(bot.web_aktif) || Number(bot.sira_no) >= Number(limits.bot);
    if (uc === "config") {
      if (kapali) return botOk(origin, { aktif: false });
      const dil = bot.dil === "en" ? "en" : "tr";
      return botOk(origin, { aktif: true, bot: {
        ad: bot.ad, dil, karsilama: { metin: bot.karsilama || metinAl(dil, "karsilama"), butonlar: jsonDizi(bot.menu) },
        gorunum: { ...GORUNUM0, ...botJsonAl(bot.web_gorunum, {}) }, lead: bot.bulunamazsa === "lead" || bot.bulunamazsa === "ikisi" } });
    }
    if (kapali) return botFail(origin, 409, "kapali");
    const { g, res } = await botReadBody(req, BOT_BODY_MAX.widget, origin);
    if (res) return res;
    const ip = io.ip ?? (req.headers.get("cf-connecting-ip") || "");
    const oturum0 = typeof g.oturum === "string" && OTURUM_RE.test(g.oturum) ? g.oturum : null;
    const c = { env, user, limits, now, io };
    return uc === "mesaj" ? await botWMesaj(env, origin, bot, c, g, ip, oturum0) : await botWLead(env, origin, bot, c, g, ip, oturum0);
  } catch (e) {
    if (notReadyErr(e)) return origin ? botFail(origin, 503, "not_ready") : wHata(503, "not_ready");
    console.log(`bot w ${uc.slice(0, 10)} ${String(e?.message || e).slice(0, 120)}`);
    return origin ? botFail(origin, 500, "server") : wHata(500, "server");
  }
}

const KONUSMA_W = "SELECT * FROM bot_conversations WHERE bot_id = ? AND kanal = 'web' AND dis_id = ?";

async function botWMesaj(env, origin, bot, c, g, ip, oturum0) {
  const metinVar = g.metin !== undefined && g.metin !== null, butonVar = g.buton !== undefined && g.buton !== null;
  if (metinVar === butonVar) return gecersiz(origin, metinVar ? "buton" : "metin", metinVar ? "fazla" : "bos");
  let girdi;
  if (metinVar) {
    if (typeof g.metin !== "string") return gecersiz(origin, "metin");
    const t = temiz(g.metin).trim();
    if (!t) return gecersiz(origin, "metin", "bos");
    if (t.length > BOT_LIM.MESAJ) return gecersiz(origin, "metin", "uzun");
    girdi = { metin: t };
  } else {
    if (typeof g.buton !== "string" || !g.buton || g.buton.length > 80) return gecersiz(origin, "buton");
    girdi = { buton: g.buton };
  }
  const ra = await botWidgetHiz(env, bot, ip, oturum0, "mesaj", c.now);
  if (ra) return botJson(origin, 429, { ok: false, error: "hiz", retry_after: ra });
  let konusma = oturum0 ? await env.DB.prepare(KONUSMA_W).bind(bot.id, oturum0).first() : null;
  if (!konusma) {
    // oturumsuz (ya da bilinmeyen oturumlu) her mesaj yeni konuşma açar: bot|IP öneki başına günlük sınır
    const ry = await botWidgetHiz(env, bot, ip, null, "yeni", c.now);
    if (ry) return botJson(origin, 429, { ok: false, error: "hiz", retry_after: ry });
    const dil = girdi.metin ? botDil(girdi.metin, bot.dil === "en" ? "en" : "tr") : (bot.dil === "en" ? "en" : "tr");
    konusma = await env.DB.prepare("INSERT INTO bot_conversations (bot_id, kanal, dis_id, dil) VALUES (?, 'web', ?, ?) RETURNING *")
      .bind(bot.id, yeniOturum(), dil).first();
  }
  const s = await cevapla(c, bot, konusma, girdi, { kanal: "web" });
  return botOk(origin, { oturum: konusma.dis_id, cevaplar: s.cevaplar, devir: s.devir, lead_iste: s.lead_iste });
}

async function botWLead(env, origin, bot, c, g, ip, oturum0) {
  if (g.onay !== true) return gecersiz(origin, "onay", "bos");
  const v = botLead(g);
  if (!v.ok) return gecersiz(origin, v.alan, v.neden);
  if (!oturum0) return bulunamadi(origin);
  const konusma = await env.DB.prepare(KONUSMA_W).bind(bot.id, oturum0).first();
  if (!konusma) return bulunamadi(origin);
  // aynı konuşmada 10 dk içinde yeniden gönderim (çift tık, ağ yeniden denemesi, düzeltme): yeni satır/mesaj yok, son lead güncellenir
  const onceki = await env.DB.prepare("SELECT id FROM bot_leads WHERE konusma_id = ? AND created_at >= datetime('now', '-10 minutes') ORDER BY id DESC LIMIT 1")
    .bind(konusma.id).first();
  const ra = await botWidgetHiz(env, bot, ip, oturum0, onceki ? "guncel" : "lead", c.now);
  if (ra) return botJson(origin, 429, { ok: false, error: "hiz", retry_after: ra });
  const d = v.deger, dil = konusma.dil === "en" ? "en" : "tr";
  const cevap = { metin: metinAl(dil, "lead_tesekkur"), butonlar: [], kaynak: "lead" };
  if (onceki) {
    await env.DB.prepare("UPDATE bot_leads SET ad = ?, eposta = ?, telefon = ?, notu = ? WHERE id = ?")
      .bind(d.ad || "", d.eposta || "", d.telefon || "", d.notu || "", onceki.id).run();
    return botOk(origin, { cevap });
  }
  const ins = "INSERT INTO bot_messages (konusma_id, bot_id, rol, metin, kaynak) VALUES (?, ?, ?, ?, ?)";
  await env.DB.batch([
    env.DB.prepare("INSERT INTO bot_leads (bot_id, konusma_id, kanal, ad, eposta, telefon, notu) VALUES (?, ?, 'web', ?, ?, ?, ?)")
      .bind(bot.id, konusma.id, d.ad || "", d.eposta || "", d.telefon || "", d.notu || ""),
    env.DB.prepare(ins).bind(konusma.id, bot.id, "sistem", "lead_alindi", "lead_alindi"),
    env.DB.prepare(ins).bind(konusma.id, bot.id, "bot", cevap.metin, "lead"),
    env.DB.prepare(`UPDATE bot_conversations SET mesaj_sayisi = mesaj_sayisi + 1, son_mesaj = ?, updated_at = datetime('now'),
      okunmadi = okunmadi + 1, ad = CASE WHEN (ad IS NULL OR ad = '') AND ? != '' THEN ? ELSE ad END WHERE id = ?`)
      .bind(cevap.metin.slice(0, 120), d.ad || "", d.ad || "", konusma.id),
  ]);
  return botOk(origin, { cevap });
}
