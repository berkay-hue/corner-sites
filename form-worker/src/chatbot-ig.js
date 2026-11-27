// Chatbot Instagram DM kanalı — sözleşme §8. Webhook (GET doğrulama + POST olay), Graph gönderimi, §8.1 kanal açma ucu.
// chatbot.js ile karşılıklı import var (döngü): üst düzeyde yalnız chatbot-kural.js sabitleri kullanılır; chatbot.js
// fonksiyonları yalnız fonksiyon gövdelerinde çağrılır.
import { BOT_LIM, BOT_HIZ, BOT_BODY_MAX, botLimits, temiz } from "./chatbot-kural.js";
import { botFail, botOk, botReadBody, botPanel, botIgBaglam, botIgDurum, botPlanDisi, cevapla } from "./chatbot.js";
import { genDay, reserve, keyOf } from "./generate.js";
import { decrypt } from "./oauth.js";

export const IG_API = "https://graph.instagram.com/v23.0";
export const IG_PENCERE_MS = 24 * 3600e3;
export const IG_METIN_MAX = 1000;
const IG_CEVAP_MAX = 2;
const IZIN = "instagram_business_manage_messages";
const CHALLENGE_RE = /^[A-Za-z0-9_-]{1,128}$/;
const IMZA_RE = /^sha256=([0-9a-f]{64})$/i;
const te = new TextEncoder();

// ---------- saf yardımcılar ----------
// Sabit zamanlı eşitlik: iki değerin SHA-256 özeti XOR ile karşılaştırılır (uzunluk sızmaz).
export async function sabitEsit(a, b) {
  const [x, y] = await Promise.all([a, b].map(v => crypto.subtle.digest("SHA-256", typeof v === "string" ? te.encode(v) : v)));
  const p = new Uint8Array(x), q = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < p.length; i++) d |= p[i] ^ q[i];
  return d === 0;
}

const hexBytes = h => { const u = new Uint8Array(h.length / 2); for (let i = 0; i < u.length; i++) u[i] = parseInt(h.substr(i * 2, 2), 16); return u; };

// X-Hub-Signature-256: "sha256=<64 hex>" = HMAC-SHA256(app secret, ham gövde). crypto.subtle.verify sabit zamanlıdır.
export async function igImzaDogru(secret, buf, header) {
  if (!secret || typeof header !== "string") return false;
  const m = IMZA_RE.exec(header.trim());
  if (!m) return false;
  const key = await crypto.subtle.importKey("raw", te.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, hexBytes(m[1].toLowerCase()), buf);
}

// Gelen olayın 24 saat penceresi içinde olup olmadığı (ts ms; yoksa/bozuksa şimdi sayılır).
export function igPencereAcik(ts, now) {
  const t = Number(ts);
  if (!Number.isFinite(t) || t <= 0) return true;
  return now - t <= IG_PENCERE_MS;
}

// Buton[] → IG quick_replies: url: hedefleri atılır, en çok 13, başlık ≤20 karakter; boşsa null (alan gönderilmez).
export function igQuickReplies(butonlar) {
  const out = [];
  for (const b of Array.isArray(butonlar) ? butonlar : []) {
    if (!b || typeof b.hedef !== "string" || !b.hedef || b.hedef.startsWith("url:")) continue;
    const title = [...String(b.etiket ?? "").trim()].slice(0, BOT_LIM.BUTON_LEN).join("");
    if (!title) continue;
    out.push({ content_type: "text", title, payload: b.hedef.slice(0, 1000) });
    if (out.length >= BOT_LIM.BUTON) break;
  }
  return out.length ? out : null;
}

// Tek Cevap için Graph gövdesi; metin boşsa null (gönderilmez).
export function igGonderGovde(igsid, cevap) {
  const text = [...String(cevap?.metin ?? "")].slice(0, IG_METIN_MAX).join("").trim();
  if (!text) return null;
  const message = { text };
  const qr = igQuickReplies(cevap?.butonlar);
  if (qr) message.quick_replies = qr;
  return { recipient: { id: String(igsid) }, message };
}

// Olay → girdi. Yok sayılacaklar null. Öncelik: quick_reply.payload → postback.payload → message.text (≤500).
export function igGirdi(ev, entryId) {
  if (!ev || typeof ev !== "object") return null;
  const sid = ev.sender?.id != null ? String(ev.sender.id) : "";
  if (!sid || sid === String(entryId)) return null;
  if (ev.read || ev.reaction || ev.message_edit) return null;
  const msg = ev.message, pb = ev.postback;
  if (msg && (msg.is_echo || msg.is_deleted || msg.is_unsupported)) return null;
  if (!msg && !pb) return null;
  const mid = (msg?.mid ?? pb?.mid) != null ? String(msg?.mid ?? pb?.mid) : null;
  const ts = Number(ev.timestamp) || null;
  const qp = msg?.quick_reply?.payload;
  if (typeof qp === "string" && qp) return { sid, mid, ts, girdi: { buton: qp.slice(0, 80) } };
  if (pb && typeof pb.payload === "string" && pb.payload) return { sid, mid, ts, girdi: { buton: pb.payload.slice(0, 80) } };
  if (!msg) return null;
  const t = typeof msg.text === "string" ? [...temiz(msg.text).trim()].slice(0, BOT_LIM.MESAJ).join("") : "";
  return { sid, mid, ts, girdi: { metin: t } }; // yalnız ek → metin "" → geri
}

// entry[] × messaging[] düzleştirilmiş, en çok IG_OLAY; fazlası sayılır.
export function igOlaylar(govde) {
  const out = [];
  let fazla = 0;
  if (!govde || govde.object !== "instagram" || !Array.isArray(govde.entry)) return { olaylar: out, fazla };
  for (const e of govde.entry) {
    if (!e || e.id == null || !Array.isArray(e.messaging)) continue;
    for (const ev of e.messaging) {
      if (out.length >= BOT_LIM.IG_OLAY) { fazla++; continue; }
      out.push({ entryId: String(e.id), ev });
    }
  }
  return { olaylar: out, fazla };
}

// Graph hata kodu → kısa kod (bot_messages.hata).
export function igHataKodu(status, j) {
  const code = Number(j?.error?.code);
  if (code === 190) return "token";
  if (Number.isFinite(code) && code > 0) return `ig_${code}`;
  return `ig_${Number(status) || 0}`;
}

const zamanli = (f, url, init) => f(url, { ...init, signal: AbortSignal.timeout(BOT_LIM.IG_TIMEOUT) });
const jsonAl = async r => { try { return await r.json(); } catch { return null; } };

// Tek mesaj gönderimi; null = başarı, aksi kısa hata kodu.
export async function igGonder(f, igHesap, token, govde) {
  let r;
  try {
    r = await zamanli(f, `${IG_API}/${encodeURIComponent(igHesap)}/messages`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(govde) });
  } catch (e) {
    console.log(`bot ig gonder ag ${String(e?.name || e).slice(0, 40)}`);
    return "ig_0";
  }
  if (r.ok) return null;
  return igHataKodu(r.status, await jsonAl(r));
}

// ---------- webhook ----------
const metinYanit = (status, body = "") => new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
const dogrulamaTokeni = env => env.BOT_IG_VERIFY_TOKEN || env.IG_WEBHOOK_VERIFY_TOKEN || "";
const imzaSecret = env => env.BOT_IG_APP_SECRET || env.INSTAGRAM_CLIENT_SECRET || "";

// /bot/ig/webhook — GET (hub doğrulama) / POST (olay). io (yalnız test): now, fetch.
export async function botIgWebhook(req, env, ctx, io = {}) {
  const m = req.method;
  if (m === "GET") {
    const u = new URL(req.url), tok = dogrulamaTokeni(env);
    const mode = u.searchParams.get("hub.mode"), vt = u.searchParams.get("hub.verify_token") ?? "", ch = u.searchParams.get("hub.challenge") ?? "";
    if (!tok || mode !== "subscribe" || !CHALLENGE_RE.test(ch)) return metinYanit(403);
    return (await sabitEsit(vt, tok)) ? metinYanit(200, ch) : metinYanit(403);
  }
  if (m !== "POST") return metinYanit(405);
  const len = Number(req.headers.get("content-length"));
  if (!req.headers.has("content-length") || !Number.isFinite(len) || len > BOT_BODY_MAX.webhook) return metinYanit(413);
  let buf;
  try { buf = await req.arrayBuffer(); } catch { return metinYanit(400); }
  if (buf.byteLength > BOT_BODY_MAX.webhook) return metinYanit(413);
  if (!(await igImzaDogru(imzaSecret(env), buf, req.headers.get("x-hub-signature-256")))) return metinYanit(401);
  const tamam = metinYanit(200, "EVENT_RECEIVED");
  if (!(env.BOT_ENABLED === "1" && env.BOT_IG_ENABLED === "1" && env.DB)) return tamam;
  let govde;
  try { govde = JSON.parse(new TextDecoder().decode(buf)); } catch { return tamam; }
  const p = igIsle(env, govde, io).catch(e => console.log(`bot ig isle ${String(e?.message || e).slice(0, 120)}`));
  if (ctx?.waitUntil) ctx.waitUntil(p); else await p;
  return tamam;
}

const IG_BOT_SEC = `SELECT b.*, u.plan AS u_plan, u.plan_limits AS u_plan_limits, u.created_at AS u_created_at,
  (SELECT COUNT(*) FROM chatbots x WHERE x.user_id = b.user_id AND x.id < b.id) AS sira_no,
  t.access_token AS ig_tok
  FROM chatbots b JOIN users u ON u.id = b.user_id
  JOIN social_accounts s ON s.user_id = b.user_id AND s.platform = 'instagram' AND s.status = 'connected' AND s.external_id = b.ig_hesap
  LEFT JOIN oauth_tokens t ON t.user_id = b.user_id AND t.platform = 'instagram'
  WHERE b.ig_hesap = ? AND b.ig_aktif = 1 AND b.aktif = 1`;
const KONUSMA_IG = `INSERT INTO bot_conversations (bot_id, kanal, dis_id, dil) VALUES (?, 'ig', ?, ?)
  ON CONFLICT (bot_id, kanal, dis_id) DO UPDATE SET updated_at = updated_at RETURNING *`;
const tekrarMi = e => /UNIQUE/i.test(String(e?.message || e)) && /dis_mid|bot_msg_mid/i.test(String(e?.message || e));

// Olay gövdesini işler (ctx.waitUntil içinde). Dönen özet yalnız test içindir.
export async function igIsle(env, govde, io = {}) {
  const { olaylar, fazla } = igOlaylar(govde);
  if (fazla) console.log(`bot ig fazla ${fazla}`);
  const ozet = [];
  const botlar = new Map();
  for (const { entryId, ev } of olaylar) {
    let r;
    try { r = await igOlay(env, entryId, ev, io, botlar); }
    catch (e) {
      r = { durum: tekrarMi(e) ? "tekrar" : "hata" };
      if (r.durum === "hata") console.log(`bot ig olay ${String(e?.message || e).slice(0, 120)}`);
    }
    ozet.push(r);
  }
  return ozet;
}

async function igOlay(env, entryId, ev, io, botlar) {
  const o = igGirdi(ev, entryId);
  if (!o) return { durum: "yok" };
  const now = io.now ?? Date.now();
  if (!botlar.has(entryId)) botlar.set(entryId, await env.DB.prepare(IG_BOT_SEC).bind(entryId).first());
  const bot = botlar.get(entryId);
  if (!bot) return { durum: "bot_yok" };
  const user = { id: bot.user_id, plan: bot.u_plan, plan_limits: bot.u_plan_limits, created_at: bot.u_created_at };
  const limits = botLimits(user, now);
  if (!limits || limits.deneme_bitti || Number(bot.sira_no) >= Number(limits.bot)) return { durum: "kapali" };
  // tekrar: Meta yeniden denemeleri sırayla gelir → SELECT yeter; eşzamanlı yarışta bot_msg_mid UNIQUE botKaydet batch'ini
  // geri alır (gönderim yapılmaz, igIsle "tekrar" sayar).
  if (o.mid && (await env.DB.prepare("SELECT 1 AS x FROM bot_messages WHERE dis_mid = ?").bind(o.mid).first())) return { durum: "tekrar" };
  const day = genDay(now);
  const hz = await reserve(env.DB, day, [{ name: "gs", kind: "gs", key: await keyOf(env, day, "bgs", o.sid), inc: 1, max: BOT_HIZ.IG_GONDEREN_GUN }]);
  if (!hz.ok) return { durum: "hiz" };
  const konusma = await env.DB.prepare(KONUSMA_IG).bind(bot.id, o.sid, bot.dil === "en" ? "en" : "tr").first();
  const girdi = { ...o.girdi, dis_mid: o.mid };
  const s = await cevapla({ env, user, limits, now, io }, bot, konusma, girdi, { kanal: "ig" });
  const ids = s.mesajIdler?.bot || [];
  if (!s.cevaplar.length) return { durum: "sessiz", s };
  const hatalar = new Array(s.cevaplar.length).fill(null);
  if (!igPencereAcik(o.ts, now)) hatalar.fill("pencere");
  else {
    let token = null;
    try { token = bot.ig_tok ? await decrypt(env, bot.ig_tok) : null; } catch (e) { console.log(`bot ig token ${String(e?.message || e).slice(0, 40)}`); }
    const f = io.fetch || fetch;
    for (let i = 0; i < s.cevaplar.length; i++) {
      if (i >= IG_CEVAP_MAX) { hatalar[i] = "ig_fazla"; continue; }
      const g = igGonderGovde(o.sid, s.cevaplar[i]);
      if (!g) continue;
      if (!token) { hatalar[i] = "token"; continue; }
      hatalar[i] = await igGonder(f, bot.ig_hesap, token, g);
    }
  }
  const yaz = hatalar.map((h, i) => (h && ids[i] != null ? env.DB.prepare("UPDATE bot_messages SET hata = ? WHERE id = ?").bind(h, ids[i]) : null)).filter(Boolean);
  if (yaz.length) await env.DB.batch(yaz);
  return { durum: hatalar.some(Boolean) ? "hata" : "gonderildi", hatalar, s };
}

// ---------- §8.1 kanal ucu: POST /gen/bot/:id/kanal/ig {aktif} ----------
const ABONE = `${IG_API}/me/subscribed_apps?subscribed_fields=messages,messaging_postbacks`;

export async function botKanalIg(req, env, origin, h, id, now, io = {}) {
  const { g, res } = await botReadBody(req, BOT_BODY_MAX.kucuk, origin);
  if (res) return res;
  if (typeof g.aktif !== "boolean") return botFail(origin, 400, "invalid", { alan: "aktif", neden: "gecersiz" });
  const row = await env.DB.prepare("SELECT * FROM chatbots WHERE id = ? AND user_id = ?").bind(id, h.user.id).first();
  if (!row) return botFail(origin, 404, "bulunamadi");
  const bitir = async yeni => {
    const igb = await botIgBaglam(env, h.user);
    const planDisi = await botPlanDisi(env, h.user, h.limits, id);
    return botOk(origin, { bot: botPanel(yeni, { ig: botIgDurum(yeni, igb), planDisi }) });
  };
  if (!g.aktif) {
    // kapatma bayrak kapalıyken de serbest (kullanıcı kanalı her zaman bırakabilir)
    const yeni = await env.DB.prepare(
      "UPDATE chatbots SET ig_aktif = 0, ig_hesap = NULL, surum = surum + 1, updated_at = datetime('now') WHERE id = ? AND user_id = ? RETURNING *"
    ).bind(id, h.user.id).first();
    return yeni ? bitir(yeni) : botFail(origin, 404, "bulunamadi");
  }
  if (env.BOT_IG_ENABLED !== "1") return botFail(origin, 503, "ig_kapali");
  const hesap = await env.DB.prepare(
    "SELECT external_id, handle FROM social_accounts WHERE user_id = ? AND platform = 'instagram' AND status = 'connected'"
  ).bind(h.user.id).first();
  if (!hesap?.external_id) return botFail(origin, 409, "ig_bagli_degil");
  const tok = await env.DB.prepare("SELECT access_token, scope FROM oauth_tokens WHERE user_id = ? AND platform = 'instagram'").bind(h.user.id).first();
  if (!tok?.access_token) return botFail(origin, 409, "ig_bagli_degil");
  if (tok.scope && !String(tok.scope).includes(IZIN)) return botFail(origin, 409, "ig_izin_yok");
  const baskaBot = async () => {
    const b = await env.DB.prepare("SELECT id, ad, user_id FROM chatbots WHERE ig_hesap = ? AND id != ?").bind(String(hesap.external_id), id).first();
    if (!b) return null;
    // başka hesabın botu: hangi botta olduğu (ve var olduğu) sızmasın diye ayrı, ayrıntısız kod
    if (Number(b.user_id) !== Number(h.user.id)) return botFail(origin, 409, "ig_kullanilamiyor");
    return botFail(origin, 409, "ig_baska_botta", { bot: { id: Number(b.id), ad: b.ad } });
  };
  const cak = await baskaBot();
  if (cak) return cak;
  let token;
  try { token = await decrypt(env, tok.access_token); }
  catch (e) { console.log(`bot ig kanal token ${String(e?.message || e).slice(0, 40)}`); return botFail(origin, 409, "ig_izin_yok"); }
  const f = io.fetch || fetch;
  let r, j = null;
  try {
    r = await zamanli(f, ABONE, { method: "POST", headers: { authorization: `Bearer ${token}` } });
    j = await jsonAl(r);
  } catch (e) {
    console.log(`bot ig abone ag ${String(e?.name || e).slice(0, 40)}`);
    return botFail(origin, 502, "ig_abone_hata");
  }
  if (!(r.ok && j?.success === true)) {
    const code = Number(j?.error?.code);
    if (code === 10 || code === 200 || code === 190) return botFail(origin, 409, "ig_izin_yok");
    return botFail(origin, 502, "ig_abone_hata");
  }
  let yeni;
  try {
    yeni = await env.DB.prepare(
      "UPDATE chatbots SET ig_aktif = 1, ig_hesap = ?, surum = surum + 1, updated_at = datetime('now') WHERE id = ? AND user_id = ? RETURNING *"
    ).bind(String(hesap.external_id), id, h.user.id).first();
  } catch (e) {
    if (/UNIQUE/i.test(String(e?.message || e))) return (await baskaBot()) || botFail(origin, 409, "ig_kullanilamiyor");
    throw e;
  }
  return yeni ? bitir(yeni) : botFail(origin, 404, "bulunamadi");
}
