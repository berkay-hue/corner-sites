// brandcorner.co platformu: üyelik (/auth/*) ve panel (/app/*) API'si.
// Oturum: rastgele 32 baytlık token; D1'de yalnızca SHA-256 özeti tutulur. Ön yüz token'ı
// "Authorization: Bearer <token>" başlığıyla gönderir (site ile worker farklı alan adında, çerez yok).
// Şifre: PBKDF2-SHA256 + 16 bayt tuz. Tur sayısı özetin içinde saklanır; PBKDF2_ITER artırılırsa
// eski özetler bir sonraki girişte yenilenir. Varsayılan 50000: ücretsiz plandaki 10 ms CPU sınırına sığar.
// Şifre sıfırlama: tek kullanımlık, RESET_MINUTES geçerli link; e-posta Gmail SMTP ile (src/smtp.js, SMTP_USER hesabından).
// MAIL binding'i yalnızca MAIL_TO adresine gönderebildiği için o kullanılmaz.

import { OAUTH, LISTED, CONNECTABLE, oauthReady, listConnections, startOAuth, finishOAuth, disconnectOAuth, OAuthFail, returnBase, fetchOlderPosts, OLDER_SYNCED, ProviderError, fetchPostAudience, postAudSkip, MISSING, batchOr } from "./oauth.js";
import { smtpReady, smtpSend, smtpFrom } from "./smtp.js";
import { metricsEnabled, accountMetrics, linkMetrics, parseAudience } from "./metrics.js";
import { NICHE_LIST } from "./classify.js";

const ROLES = ["brand", "influencer", "agency"];
const PLATFORMS = LISTED; // instagram, tiktok, youtube, x, linkedin, twitch (profil ve bağlantı listesi aynı)
const CURRENCIES = ["TRY", "USD", "EUR"];
const SESSION_DAYS = 30, MAX_BODY = 20000, MAX_IMPORT_BODY = 400000, MAX_CAMPAIGNS = 100, DAILY_APPLY = 50;
const RESET_MINUTES = 60;
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const URL_RE = /^https?:\/\/[^\s<>"]+$/;

class Bad extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}

const reply = (body, status, origin) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store", ...(origin && { "access-control-allow-origin": origin, vary: "Origin" }) },
});

// Yalnızca platform sitesi (AUTH_HOSTS, varsayılan brandcorner.co) ve onun pages.dev önizlemeleri
function platformSite(env, origin) {
  if (!origin) return null;
  const hosts = (env.AUTH_HOSTS || "brandcorner.co").split(",");
  if ((env.DEV_ORIGINS || "").split(",").includes(origin)) return hosts[0];
  let h;
  try { h = new URL(origin).hostname; } catch { return null; }
  const site = hosts.find(d => h === d || h === "www." + d);
  if (site) return site;
  return /^(?:[a-z0-9-]+\.)?web-brandcorner\.pages\.dev$/.test(h) ? hosts[0] : null;
}

export async function platform(req, url, env, origin, deliver) {
  const site = platformSite(env, origin);
  if (!site) return reply({ ok: false, error: "origin" }, 403, null);
  const c = { env, origin, api: url.origin, site, deliver, ip:req.headers.get("cf-connecting-ip") || "", body: {}, query: Object.fromEntries(url.searchParams) };
  try {
    if (req.method === "POST" || req.method === "PUT") {
      const text = await req.text();
      // Gönderi aktarımı 50 satır x (2200 karakter açıklama + iki url) taşır; diğer uçlar MAX_BODY
      if (text.length > (url.pathname.replace(/\/+$/, "") === "/app/posts/import" ? MAX_IMPORT_BODY : MAX_BODY)) throw new Bad("size", 413);
      try { c.body = text ? JSON.parse(text) : {}; } catch { throw new Bad("json"); }
      if (!c.body || typeof c.body !== "object" || Array.isArray(c.body)) throw new Bad("json");
    }
    const route = `${req.method} ${url.pathname.replace(/\/+$/, "")}`;
    if (route === "POST /auth/register") return await register(c);
    if (route === "POST /auth/login") return await login(c);
    if (route === "POST /auth/forgot") return await forgot(c);
    if (route === "POST /auth/reset") return await reset(c);

    const token = (req.headers.get("authorization") || "").match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    c.user = token && await env.DB.prepare(
      "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.site = ?",
    ).bind(await sha256(token), site).first();
    if (!c.user) throw new Bad("auth", 401);

    // Yönetici ise admin: true; kendi yetkileri (admin hariç) perms, yoksa alan yok
    if (route === "GET /auth/me") {
      const p = await perms(c) || [], own = p.filter(x => x !== "admin");
      return ok(c, { user: { ...me(c.user), ...(p.includes("admin") && { admin: true }), ...(own.length && { perms: own }) } });
    }
    if (route === "POST /auth/logout") {
      await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
      return ok(c, {});
    }
    const m = route.match(/^(GET|POST|PUT) \/app\/([a-z]+)(?:\/(\d+))?(?:\/([a-z]+))?$/);
    const handler = m && APP[`${m[1]} ${m[2]}${m[3] ? "/:id" : ""}${m[4] ? "/" + m[4] : ""}`];
    if (!handler) throw new Bad("not_found", 404);
    return await handler(c, m[3] && Number(m[3]));
  } catch (e) {
    if (e instanceof Bad) return reply({ ok: false, error: e.code }, e.status, origin);
    console.error(e);
    return reply({ ok: false, error: "server" }, 500, origin);
  }
}

const ok = (c, body) => reply({ ok: true, ...body }, 200, c.origin);

// ---- üyelik ----

async function register(c) {
  const { env, site, ip, body } = c;
  const name = text(body.name, 100), email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? ""), role = body.role, lang = body.lang === "en" ? "en" : "tr";
  if (!name) throw new Bad("name");
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new Bad("email");
  if (password.length < 8 || password.length > 200) throw new Bad("password");
  if (!ROLES.includes(role)) throw new Bad("role");
  if (body.consent !== true) throw new Bad("consent");
  // Bot koruması: gizli alan doluysa ya da form 1,5 sn'den kısa sürede gönderildiyse kayıt, e-posta ve deneme kaydı yok
  if (String(body.hp ?? "") !== "" || !(Number(body.t) >= 1500)) throw new Bad("bad");
  if (await attempts(env, "register", "ip", ip, 60, false) >= 5) throw new Bad("rate", 429);
  await attempt(env, ip, email, "register", 1);

  const user = await env.DB.prepare(
    "INSERT INTO users (site, email, name, role, lang, pass, consent_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT DO NOTHING RETURNING *",
  ).bind(site, email, name, role, lang, await hashPass(env, password)).first();
  if (!user) throw new Bad("exists", 409);

  // Yeni üye bildirimi: form kayıtlarıyla aynı yoldan Berkay'a e-posta (gitmezse cron tekrar dener)
  const fields = [["Ad", name], ["E-posta", email], ["Rol", role], ["Dil", lang]];
  const row = await env.DB.prepare("INSERT INTO submissions (site, page, fields, ip) VALUES (?, '/kayit', ?, ?) RETURNING id, created_at")
    .bind(site, JSON.stringify(fields), ip).first();
  await c.deliver(env, { ...row, site, page: "/kayit", fields });
  return ok(c, { token: await newSession(env, user.id), user: me(user) });
}

async function login(c) {
  const { env, site, ip, body } = c;
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 254), password = String(body.password ?? "").slice(0, 200);
  if (!email || !password) throw new Bad("missing");
  if (await attempts(env, "login", "email", email, 15, true) >= 5 || await attempts(env, "login", "ip", ip, 15, true) >= 20) throw new Bad("rate", 429);
  const user = await env.DB.prepare("SELECT * FROM users WHERE site = ? AND email = ?").bind(site, email).first();
  const good = await checkPass(password, user?.pass);
  await attempt(env, ip, email, "login", good ? 1 : 0);
  if (!good) throw new Bad("invalid", 401);
  if (Number(user.pass.split("$")[1]) < iterations(env))
    await env.DB.prepare("UPDATE users SET pass = ? WHERE id = ?").bind(await hashPass(env, password), user.id).run();
  return ok(c, { token: await newSession(env, user.id), user: me(user) });
}

// Hesap olsun olmasın aynı yanıt; link yalnızca kayıtlı adrese gider. Yeni istek eski linki geçersiz kılar.
async function forgot(c) {
  const { env, site, ip, body } = c;
  if (!smtpReady(env)) throw new Bad("mail", 503);
  const email = String(body.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new Bad("email");
  if (await attempts(env, "forgot", "ip", ip, 60, false) >= 10) throw new Bad("rate", 429);
  // Aynı adrese saatte en çok 3 e-posta; fazlası gönderilmeden yanıtlanır
  if (await attempts(env, "forgot", "email", email, 60, false) >= 3) return ok(c, {});
  await attempt(env, ip, email, "forgot", 1);
  const user = await env.DB.prepare("SELECT * FROM users WHERE site = ? AND email = ?").bind(site, email).first();
  if (!user) return ok(c, {});

  const token = b64u(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.batch([
    env.DB.prepare("DELETE FROM password_resets WHERE user_id = ?").bind(user.id),
    env.DB.prepare(`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+${RESET_MINUTES} minutes'))`)
      .bind(await sha256(token), user.id),
  ]);
  const lang = ["tr", "en"].includes(body.lang) ? body.lang : user.lang;
  // Token URL'nin # kısmında: sunucu loglarına ve Referer'a düşmez. Adres ham Origin'den değil doğrulanmış
  // siteden kurulur: boşluk ya da yol içeren, http ya da başka portlu bir Origin e-postaya başka bir adres sokamaz.
  const link = `${returnBase(env, c.origin, site)}/${lang === "en" ? "reset-password" : "sifre-yenile"}#t=${token}`;
  try {
    await smtpSend(env, resetMail(env, lang, user, link));
  } catch (e) {
    console.error("reset mail", e);
    throw new Bad("mail", 503);
  }
  return ok(c, {});
}

async function reset(c) {
  const { env, site, ip, body } = c;
  const token = String(body.token ?? ""), password = String(body.password ?? "");
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Bad("reset_invalid");
  if (password.length < 8 || password.length > 200) throw new Bad("password");
  if (await attempts(env, "reset", "ip", ip, 15, true) >= 20) throw new Bad("rate", 429);
  // Token tek kullanımlık: kontrol edilirken silinir
  const row = await env.DB.prepare("DELETE FROM password_resets WHERE token_hash = ? AND expires_at > datetime('now') RETURNING user_id")
    .bind(await sha256(token)).first();
  const user = row && await env.DB.prepare("SELECT * FROM users WHERE id = ? AND site = ?").bind(row.user_id, site).first();
  await attempt(env, ip, user ? user.email : null, "reset", user ? 1 : 0);
  if (!user) throw new Bad("reset_invalid");
  // Şifre değişince açık oturumlar kapanır
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET pass = ? WHERE id = ?").bind(await hashPass(env, password), user.id),
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM password_resets WHERE user_id = ?").bind(user.id),
  ]);
  return ok(c, { token: await newSession(env, user.id), user: me(user) });
}

const RESET_TEXT = {
  tr: {
    subject: "Brand Corner şifre sıfırlama",
    hi: "Merhaba",
    body: "Brand Corner hesabınız için şifre sıfırlama isteği aldık. Yeni şifrenizi aşağıdaki linkten belirleyebilirsiniz. Link 1 saat geçerli ve tek kullanımlıktır.",
    button: "Yeni şifre belirle",
    ignore: "Bu isteği siz yapmadıysanız bu e-postayı dikkate almayın; şifreniz değişmez.",
  },
  en: {
    subject: "Reset your Brand Corner password",
    hi: "Hi",
    body: "We received a request to reset the password of your Brand Corner account. You can set a new password with the link below. The link is valid for 1 hour and works once.",
    button: "Set a new password",
    ignore: "If you did not ask for this, you can ignore this email; your password stays the same.",
  },
};

function resetMail(env, lang, user, link) {
  const t = RESET_TEXT[lang] || RESET_TEXT.tr, hi = `${t.hi} ${user.name},`;
  return {
    to: user.email,
    from: { email: smtpFrom(env), name: "Brand Corner" },
    subject: t.subject,
    text: `${hi}\n\n${t.body}\n\n${link}\n\n${t.ignore}\n\nBrand Corner\n`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:520px">
<p>${esc(hi)}</p><p>${esc(t.body)}</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${esc(t.button)}</a></p>
<p style="font-size:13px;color:#555;word-break:break-all">${esc(link)}</p>
<p style="font-size:13px;color:#555">${esc(t.ignore)}</p><p>Brand Corner</p></div>`,
  };
}

const attempts = async (env, kind, col, value, minutes, failedOnly) => (await env.DB.prepare(
  `SELECT count(*) n FROM auth_attempts WHERE kind = ? AND ${col} = ? AND created_at > datetime('now', ?)${failedOnly ? " AND ok = 0" : ""}`,
).bind(kind, value, `-${minutes} minutes`).first()).n;

const attempt = (env, ip, email, kind, good) =>
  env.DB.prepare("INSERT INTO auth_attempts (ip, email, kind, ok) VALUES (?, ?, ?, ?)").bind(ip, email, kind, good).run();

async function newSession(env, userId) {
  const token = b64u(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`)
    .bind(await sha256(token), userId).run();
  return token;
}

const me = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, lang: u.lang, profile: JSON.parse(u.profile || "{}") });

// Yetkiler (migrations/0012_admin.sql user_perms): istek başına tek SELECT, c.perms'te tutulur.
// Tablo yoksa null: yönetici yok, edit_metrics kapısı açık (0012'den önceki davranış).
const noTable = e => /no such table/i.test(String(e && e.message));
async function perms(c) {
  if (c.perms !== undefined) return c.perms;
  try { c.perms = (await c.env.DB.prepare("SELECT perm FROM user_perms WHERE user_id = ? ORDER BY perm").bind(c.user.id).all()).results.map(r => r.perm); }
  catch (e) { if (!noTable(e)) throw e; c.perms = null; }
  return c.perms;
}
const isAdmin = async c => !!(await perms(c))?.includes("admin");
const canEdit = async c => { const p = await perms(c); return !p || p.includes("edit_metrics") || p.includes("admin"); };

// cron'dan: süresi dolan oturumlar ve sıfırlama linkleri, eski deneme kayıtları, süresi dolan OAuth state'leri.
// oauth_states 0002'de; ayrı ifade, tablo yoksa ya da hata verirse diğer temizlik yine yapılır.
export async function cleanup(env) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')"),
    env.DB.prepare("DELETE FROM auth_attempts WHERE created_at < datetime('now', '-1 day')"),
    env.DB.prepare("DELETE FROM password_resets WHERE expires_at < datetime('now')"),
  ]);
  try {
    await env.DB.prepare("DELETE FROM oauth_states WHERE expires_at <= datetime('now')").run();
  } catch (e) {
    console.log("cleanup oauth_states", e?.message?.slice(0, 80));
  }
}

// ---- panel ----

const APP = {
  "GET profile": c => ok(c, { user: me(c.user) }),
  "POST profile": updateProfile,
  "GET connections": connections,
  "POST connect": connect,
  "POST connect/finish": finish,
  "POST disconnect": disconnect,
  "GET stats": stats,
  "GET influencers": influencers,
  "GET campaigns": listCampaigns,
  "POST campaigns": createCampaign,
  "GET campaigns/:id": getCampaign,
  "POST campaigns/:id": updateCampaign,
  "POST campaigns/:id/apply": apply,
  "POST campaigns/:id/invite": invite,
  "GET applications": myApplications,
  "POST applications/:id": updateApplication,
  "GET metrics": c => metrics(c, c.user),
  "GET metrics/:id": influencerMetrics,
  "GET applications/:id/metrics": applicationMetrics,
  "GET niches": c => ok(c, { niches: NICHE_LIST }),
  "GET matches": matches,
  "GET notify": getNotify,
  "PUT notify": putNotify,
  "GET posts": c => listPosts(c),
  "POST posts/manual": c => manualPost(c),
  "POST posts/import": c => importPosts(c),
  "POST posts/older": c => olderPosts(c),
  "POST posts/:id/audience": (c, id) => postAudience(c, id),
  "GET admin": c => adminHome(c),
  "GET admin/:id/posts": (c, id) => adminPosts(c, id),
  "POST admin/:id/perm": (c, id) => adminPerm(c, id),
  "POST admin/:id/snap": (c, id) => adminSnap(c, id),
};

const isOwnerRole = u => u.role === "brand" || u.role === "agency";
const need = (cond, code = "forbidden", status = 403) => { if (!cond) throw new Bad(code, status); };

async function updateProfile(c) {
  const { env, user, body } = c;
  const p = body.profile && typeof body.profile === "object" ? body.profile : {};
  const profile = {
    bio: text(p.bio, 500), city: text(p.city, 100), website: link(p.website),
    // Nişler üç rolde de saklanır (en çok 5); marka/ajans için eşleşme dayanağı ve "Profilini tamamla" kontrolü
    niches: tags(p.niches),
    ...(user.role !== "influencer" && { company: text(p.company, 100), industry: text(p.industry, 60) }),
    ...(user.role === "agency" && agencyClients(p)),
    ...(user.role === "influencer" && {
      platforms: (Array.isArray(p.platforms) ? p.platforms : []).slice(0, PLATFORMS.length)
        .filter(x => PLATFORMS.includes(x?.platform))
        .map(x => ({ platform: x.platform, handle: text(x.handle, 60), followers: int(x.followers, 0, 1e9) })),
      listed: p.listed === true,
    }),
  };
  const name = body.name === undefined ? user.name : text(body.name, 100);
  if (!name) throw new Bad("name");
  const u = await env.DB.prepare("UPDATE users SET name = ?, profile = ? WHERE id = ? RETURNING *").bind(name, JSON.stringify(profile), user.id).first();
  return ok(c, { user: me(u) });
}

// Ajans müşteri adları: en çok 20, her biri kırpılmış (≤80), büyük-küçük harf farkı gözetmeden tekil (ilk yazım kalır;
// i/ı/I/İ aynı sayılır: "Nike" ile "NIKE" tek ad). Ad varsa clients = ad sayısı. client_names dizi değilse eski sayı girişi
// (clients 0..10000) aynen saklanır. Dizide geçerli ad yoksa ve clients > 0 ise de eski giriş sayılır: panel adı olmayan
// ajansta client_names: [] ile eski sayıyı gönderir; client_names anahtarı yazılmaz ki panel sonraki kayıtta da sayıyı göndersin.
// Yalnız sahibinin profil yanıtında (me) döner; kampanya/başvuru/eşleşme yanıtları ajans profilini taşımaz.
function agencyClients(p) {
  const legacy = int(p.clients, 0, 10000);
  if (!Array.isArray(p.client_names)) return { clients: legacy };
  const seen = new Set(), names = [];
  for (const x of p.client_names) {
    const s = text(x, 80), k = s.toLocaleLowerCase("tr").replace(/ı/g, "i");
    if (!s || seen.has(k)) continue;
    seen.add(k);
    names.push(s);
    if (names.length === 20) break;
  }
  if (!names.length && legacy > 0) return { clients: legacy };
  return { client_names: names, clients: names.length };
}

// Sosyal hesap bağlama (resmi OAuth, src/oauth.js): influencer, marka ve ajans. Rolün bağlayabildiği platformlar
// CONNECTABLE'da (üç rolde de instagram, tiktok, youtube, linkedin), yanıtta "connectable". Secret yoksa "yapılandırılmadı".
// METRICS_ENABLED kapalıyken bağlanılamaz (disabled); bağı koparmak her zaman açık. Kapalıyken liste yalnız
// bağlı ve hatalı satırları döner ({disabled: true, connectable, connections}), panel bunlara "Kes" çizebilsin.
async function connections(c) {
  need(ROLES.includes(c.user.role));
  const list = await listConnections(c.env, c.user.id, c.user.role);
  const connectable = CONNECTABLE[c.user.role];
  if (!metricsEnabled(c.env)) return ok(c, { disabled: true, connectable, connections: list.filter(x => x.status === "connected" || x.status === "error") });
  return ok(c, { connectable, connections: list });
}

async function connect(c) {
  need(ROLES.includes(c.user.role));
  need(metricsEnabled(c.env), "disabled", 409);
  const p = c.body.platform;
  need(PLATFORMS.includes(p), "platform", 400);
  need(CONNECTABLE[c.user.role].includes(p), "no_api", 400);
  need(oauthReady(c.env, p), "not_configured", 409);
  return ok(c, { url: await startOAuth(c.env, c.user.id, p, c) });
}

// Panel sağlayıcıdan dönünce #ticket=<bilet>'i buraya Bearer ile gönderir; bağlama burada yapılır.
async function finish(c) {
  need(ROLES.includes(c.user.role));
  need(metricsEnabled(c.env), "disabled", 409);
  try {
    return ok(c, { connection: await finishOAuth(c.env, c.user.id, c.body.ticket, fetch, c.user.role) });
  } catch (e) {
    if (e instanceof OAuthFail) throw new Bad(e.code, e.status);
    throw e;
  }
}

// Rol değişmiş olsa da bağ koparılabilsin: OAuth platformlarının hepsi her rolde kabul edilir.
async function disconnect(c) {
  need(ROLES.includes(c.user.role));
  const p = c.body.platform;
  need(OAUTH.includes(p), "platform", 400);
  await disconnectOAuth(c.env, c.user.id, p);
  return ok(c, {});
}

// null ya da boş: bütçe alanı temizlenir (int(null) 0 döndürürdü)
const money = v => (v == null || v === "" ? null : int(v, 0, 1e9));

function campaignData(b, old = {}) {
  const pick = (k, f) => (b[k] === undefined ? old[k] : f(b[k]));
  const d = {
    title: pick("title", v => text(v, 120)),
    brief: pick("brief", v => text(v, 3000)),
    niches: pick("niches", tags) || [],
    platforms: pick("platforms", v => (Array.isArray(v) ? [...new Set(v.filter(x => PLATFORMS.includes(x)))] : [])) || [],
    budget_min: pick("budget_min", money),
    budget_max: pick("budget_max", money),
    currency: pick("currency", v => (CURRENCIES.includes(v) ? v : "TRY")) || "TRY",
    deadline: pick("deadline", v => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)),
  };
  if (!d.title) throw new Bad("title");
  if (d.budget_min != null && d.budget_max != null && d.budget_min > d.budget_max) throw new Bad("budget");
  return d;
}

const campaignOut = r => ({ id: r.id, created_at: r.created_at, status: r.status, owner: r.owner_name, ...JSON.parse(r.data) });

// Uyum skoru (0-100): kampanyanın konu etiketleri %60, platformları %40
function match(camp, profile) {
  const niches = (profile.niches || []).map(s => s.toLowerCase()), plats = (profile.platforms || []).map(p => p.platform);
  const share = (want, have) => (want.length ? want.filter(x => have.includes(x.toLowerCase())).length / want.length : 1);
  return Math.round(60 * share(camp.niches, niches) + 40 * share(camp.platforms, plats));
}

async function createCampaign(c) {
  const { env, user, body } = c;
  need(isOwnerRole(user));
  const { n } = await env.DB.prepare("SELECT count(*) n FROM campaigns WHERE owner_id = ?").bind(user.id).first();
  if (n >= MAX_CAMPAIGNS) throw new Bad("limit", 429);
  const r = await env.DB.prepare("INSERT INTO campaigns (owner_id, data) VALUES (?, ?) RETURNING *").bind(user.id, JSON.stringify(campaignData(body))).first();
  return ok(c, { campaign: campaignOut({ ...r, owner_name: user.name }) });
}

async function updateCampaign(c, id) {
  const { env, user, body } = c;
  const r = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND owner_id = ?").bind(id, user.id).first();
  need(r, "not_found", 404);
  const status = body.status === undefined ? r.status : body.status;
  if (!["open", "closed"].includes(status)) throw new Bad("status");
  const u = await env.DB.prepare("UPDATE campaigns SET status = ?, data = ? WHERE id = ? RETURNING *")
    .bind(status, JSON.stringify(campaignData(body, JSON.parse(r.data))), id).first();
  return ok(c, { campaign: campaignOut({ ...u, owner_name: user.name }) });
}

async function listCampaigns(c) {
  const { env, user, site } = c;
  if (isOwnerRole(user)) {
    // Aşama çubuğu: 1 Davet = invited, 2 Başvuru = pending, 3 Üretim = active (accepted + revision),
    // 4 İnceleme = submitted, 5 Onaylandı = approved; rejected ve declined çubuk dışı. applications = bütün satırlar.
    const { results } = await env.DB.prepare(
      `SELECT c.*, count(a.id) applications,
        count(CASE WHEN a.status = 'invited' THEN 1 END) invited,
        count(CASE WHEN a.status = 'pending' THEN 1 END) pending,
        count(CASE WHEN a.status = 'accepted' THEN 1 END) accepted,
        count(CASE WHEN a.status = 'revision' THEN 1 END) revision,
        count(CASE WHEN a.status = 'submitted' THEN 1 END) submitted,
        count(CASE WHEN a.status = 'approved' THEN 1 END) approved,
        count(CASE WHEN a.status = 'rejected' THEN 1 END) rejected,
        count(CASE WHEN a.status = 'declined' THEN 1 END) declined
       FROM campaigns c LEFT JOIN applications a ON a.campaign_id = c.id
       WHERE c.owner_id = ? GROUP BY c.id ORDER BY c.id DESC`,
    ).bind(user.id).all();
    return ok(c, { campaigns: results.map(r => ({
      ...campaignOut({ ...r, owner_name: user.name }),
      applications: r.applications, invited: r.invited, pending: r.pending, active: r.accepted + r.revision,
      submitted: r.submitted, approved: r.approved, rejected: r.rejected, declined: r.declined,
    })) });
  }
  const profile = JSON.parse(user.profile || "{}");
  const { results } = await env.DB.prepare(
    `SELECT c.*, u.name owner_name, a.status my_status FROM campaigns c JOIN users u ON u.id = c.owner_id
     LEFT JOIN applications a ON a.campaign_id = c.id AND a.user_id = ?
     WHERE c.status = 'open' AND u.site = ? ORDER BY c.id DESC LIMIT 200`,
  ).bind(user.id, site).all();
  const campaigns = results.map(r => { const k = campaignOut(r); return { ...k, match: match(k, profile), my_status: r.my_status || null }; })
    .sort((a, b) => b.match - a.match || b.id - a.id);
  return ok(c, { campaigns });
}

async function getCampaign(c, id) {
  const { env, user, site } = c;
  const r = await env.DB.prepare("SELECT c.*, u.name owner_name FROM campaigns c JOIN users u ON u.id = c.owner_id WHERE c.id = ? AND u.site = ?").bind(id, site).first();
  need(r, "not_found", 404);
  const campaign = campaignOut(r);
  if (r.owner_id === user.id) {
    const { results } = await env.DB.prepare(
      "SELECT a.*, u.name, u.profile FROM applications a JOIN users u ON u.id = a.user_id WHERE a.campaign_id = ? ORDER BY a.id DESC",
    ).bind(id).all();
    return ok(c, { campaign, applications: results.map(a => ({ ...appOut(a), influencer: creator(a.user_id, a.name, a.profile, campaign) })) });
  }
  const mine = user.role === "influencer" && await myApp(env, id, user.id);
  need(user.role === "influencer" && (r.status === "open" || mine), "not_found", 404);
  return ok(c, { campaign: { ...campaign, match: match(campaign, JSON.parse(user.profile || "{}")) }, application: mine ? appOut(mine) : null });
}

const myApp = (env, campaignId, userId) => env.DB.prepare("SELECT * FROM applications WHERE campaign_id = ? AND user_id = ?").bind(campaignId, userId).first();
const appOut = a => ({ id: a.id, campaign_id: a.campaign_id, status: a.status, message: a.message, content_url: a.content_url, revision_note: a.revision_note || null, created_at: a.created_at, updated_at: a.updated_at });

// Influencer'ın markalara görünen kısmı (e-posta yok)
function creator(id, name, profileJson, camp) {
  const p = JSON.parse(profileJson || "{}");
  return { id, name, bio: p.bio || "", city: p.city || "", niches: p.niches || [], platforms: p.platforms || [], ...(camp && { match: match(camp, p) }) };
}

async function apply(c, id) {
  const { env, user, site, body } = c;
  need(user.role === "influencer");
  const camp = await env.DB.prepare("SELECT c.id FROM campaigns c JOIN users u ON u.id = c.owner_id WHERE c.id = ? AND c.status = 'open' AND u.site = ?").bind(id, site).first();
  need(camp, "not_found", 404);
  const { n } = await env.DB.prepare("SELECT count(*) n FROM applications WHERE user_id = ? AND created_at > datetime('now', '-1 day')").bind(user.id).first();
  if (n >= DAILY_APPLY) throw new Bad("limit", 429);
  const a = await env.DB.prepare(
    "INSERT INTO applications (campaign_id, user_id, status, message) VALUES (?, ?, 'pending', ?) ON CONFLICT DO NOTHING RETURNING *",
  ).bind(id, user.id, text(body.message, 1000)).first();
  if (!a) throw new Bad("exists", 409);
  return ok(c, { application: appOut(a) });
}

async function invite(c, id) {
  const { env, user, site, body } = c;
  const camp = await env.DB.prepare("SELECT id FROM campaigns WHERE id = ? AND owner_id = ? AND status = 'open'").bind(id, user.id).first();
  need(camp, "not_found", 404);
  const inf = await env.DB.prepare("SELECT id, profile FROM users WHERE id = ? AND site = ? AND role = 'influencer'").bind(int(body.user_id, 1, 1e12) ?? 0, site).first();
  need(inf && JSON.parse(inf.profile || "{}").listed === true, "not_found", 404);
  const a = await env.DB.prepare(
    "INSERT INTO applications (campaign_id, user_id, status, message) VALUES (?, ?, 'invited', ?) ON CONFLICT DO NOTHING RETURNING *",
  ).bind(id, inf.id, text(body.message, 1000)).first();
  if (!a) throw new Bad("exists", 409);
  return ok(c, { application: appOut(a) });
}

async function myApplications(c) {
  const { env, user } = c;
  need(user.role === "influencer");
  const { results } = await env.DB.prepare(
    "SELECT a.*, c.data, u.name owner_name FROM applications a JOIN campaigns c ON c.id = a.campaign_id JOIN users u ON u.id = c.owner_id WHERE a.user_id = ? ORDER BY a.updated_at DESC",
  ).bind(user.id).all();
  return ok(c, { applications: results.map(a => ({ ...appOut(a), campaign: { id: a.campaign_id, owner: a.owner_name, title: JSON.parse(a.data).title } })) });
}

// Durum akışı. Marka/ajans: pending → accepted | rejected, submitted → approved | revision.
// Influencer: invited → accepted | declined, accepted | revision → submitted (içerik linkiyle).
// revision isteğinde isteğe bağlı "note" (≤500) revision_note olarak saklanır; sonraki gönderimde kalır, influencer görür.
const OWNER_MOVES = { pending: ["accepted", "rejected"], submitted: ["approved", "revision"] };
const CREATOR_MOVES = { invited: ["accepted", "declined"], accepted: ["submitted"], revision: ["submitted"] };

async function updateApplication(c, id) {
  const { env, user, body } = c;
  const a = await env.DB.prepare("SELECT a.*, c.owner_id FROM applications a JOIN campaigns c ON c.id = a.campaign_id WHERE a.id = ?").bind(id).first();
  need(a && (a.owner_id === user.id || a.user_id === user.id), "not_found", 404);
  const moves = (a.owner_id === user.id ? OWNER_MOVES : CREATOR_MOVES)[a.status] || [];
  need(moves.includes(body.status), "status", 400);
  let url = a.content_url;
  if (body.status === "submitted") {
    url = link(body.content_url);
    if (!url) throw new Bad("content_url");
  }
  const u = await env.DB.prepare("UPDATE applications SET status = ?, content_url = ?, updated_at = datetime('now') WHERE id = ? RETURNING *")
    .bind(body.status, url, id).first();
  if (body.status === "revision") {
    // Not ayrı yazılır: revision_note kolonu canlıda henüz yoksa (ALTER çalışmadıysa) durum değişikliği yine geçer
    const n = text(body.note, 500) || null;
    try { await env.DB.prepare("UPDATE applications SET revision_note = ? WHERE id = ?").bind(n, id).run(); u.revision_note = n; }
    catch (e) { if (!/no such column/i.test(String(e && e.message))) throw e; u.revision_note = null; }
  }
  return ok(c, { application: appOut(u) });
}

async function influencers(c) {
  const { env, user, site, query: q } = c;
  need(isOwnerRole(user));
  const { results } = await env.DB.prepare("SELECT id, name, profile FROM users WHERE site = ? AND role = 'influencer' ORDER BY id DESC LIMIT 500").bind(site).all();
  let list = results.map(r => ({ ...creator(r.id, r.name, r.profile), listed: JSON.parse(r.profile || "{}").listed === true })).filter(x => x.listed);
  if (q.niche) list = list.filter(x => x.niches.some(n => n.toLowerCase() === q.niche.toLowerCase()));
  if (q.platform) list = list.filter(x => x.platforms.some(p => p.platform === q.platform));
  // Markanın kendi kampanyalarındaki geçmiş (davet/başvuru durumları); başka markaların verisi dönmez
  const { results: hist } = await env.DB.prepare(
    "SELECT a.user_id, a.campaign_id, a.status FROM applications a JOIN campaigns c ON c.id = a.campaign_id WHERE c.owner_id = ? ORDER BY a.id DESC",
  ).bind(user.id).all();
  const history = id => hist.filter(h => h.user_id === id).map(h => ({ campaign_id: h.campaign_id, status: h.status }));
  return ok(c, { influencers: list.slice(0, 100).map(({ listed, ...x }) => ({ ...x, history: history(x.id) })) });
}

// Marka/ajans için uyumlu influencer önerisi. Dayanak: ?campaign=<id> verilirse o kampanyanın nişleri ve platformları,
// yoksa sahibin profil nişleri (platform yok). Aday kümesi /app/influencers ile aynı (listed, son 500), en az 1 ortak niş.
// Sıra: match büyükten küçüğe, eşitlikte id büyükten küçüğe. Sınır: varsayılan 20, en çok 50. Alanlar /app/influencers'ınkiler + match.
// campaign ve limit yalnız düz ondalık pozitif tamsayı (1e1, 0x2, 1.0, +3, 01 → 400); çok büyük limit 50'ye iner.
const DIGITS = /^[1-9]\d*$/;
async function matches(c) {
  const { env, user, site, query: q } = c;
  need(isOwnerRole(user));
  let id = null, basis;
  if (q.campaign !== undefined) {
    need(DIGITS.test(q.campaign), "campaign", 400);
    id = Number(q.campaign);
    need(Number.isSafeInteger(id), "not_found", 404);
    const camp = await env.DB.prepare("SELECT data FROM campaigns WHERE id = ? AND owner_id = ?").bind(id, user.id).first();
    need(camp, "not_found", 404);
    const d = JSON.parse(camp.data);
    basis = { niches: Array.isArray(d.niches) ? d.niches : [], platforms: Array.isArray(d.platforms) ? d.platforms : [] };
  } else {
    const p = JSON.parse(user.profile || "{}");
    basis = { niches: Array.isArray(p.niches) ? p.niches : [], platforms: [] };
  }
  need(q.platform === undefined || PLATFORMS.includes(q.platform), "platform", 400);
  need(q.limit === undefined || DIGITS.test(q.limit), "limit", 400);
  const limit = q.limit === undefined ? 20 : Math.min(Number(q.limit), 50);
  if (!basis.niches.length) return ok(c, { campaign_id: id, basis, reason: "no_niches", influencers: [] });
  const want = basis.niches.map(s => String(s).toLowerCase());
  const { results } = await env.DB.prepare("SELECT id, name, profile FROM users WHERE site = ? AND role = 'influencer' ORDER BY id DESC LIMIT 500").bind(site).all();
  const list = results.map(r => ({ ...creator(r.id, r.name, r.profile, basis), listed: JSON.parse(r.profile || "{}").listed === true }))
    .filter(x => x.listed && x.niches.some(n => want.includes(String(n).toLowerCase())))
    .filter(x => q.platform === undefined || x.platforms.some(p => p.platform === q.platform))
    .sort((a, b) => b.match - a.match || b.id - a.id)
    .slice(0, limit);
  let hist = [];
  if (list.length) {
    // Yalnız bu sahibin kendi kampanyalarındaki geçmiş; başka sahiplerin verisi dönmez
    ({ results: hist } = await env.DB.prepare(
      "SELECT a.user_id, a.campaign_id, a.status FROM applications a JOIN campaigns c ON c.id = a.campaign_id WHERE c.owner_id = ? ORDER BY a.id DESC",
    ).bind(user.id).all());
  }
  const history = uid => hist.filter(h => h.user_id === uid).map(h => ({ campaign_id: h.campaign_id, status: h.status }));
  return ok(c, { campaign_id: id, basis, reason: null, influencers: list.map(({ listed, ...x }) => ({ ...x, history: history(x.id) })) });
}

// Bildirim tercihleri: yalnız saklanır, gönderim YOK (SMTP/forms bağlantısı kurulmaz; yanıtta sending: false).
// users.notify sütunu (JSON, 0005_notify.sql); profilden ayrı, profil kaydı silmez. Sütun yoksa GET varsayılanları döner, PUT 503.
const NOTIFY = {
  owner: { new_application: true, content_submitted: true, weekly_summary: false },
  influencer: { invites: true, status_change: true, new_match: false },
};
const notifyDefaults = u => NOTIFY[isOwnerRole(u) ? "owner" : "influencer"];
const savedNotify = u => {
  try { const v = JSON.parse(u.notify || "{}"); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; } catch { return {}; }
};
const notifyOut = (u, saved) => Object.fromEntries(Object.entries(notifyDefaults(u)).map(([k, d]) => [k, typeof saved[k] === "boolean" ? saved[k] : d]));

function getNotify(c) {
  return ok(c, { notify: notifyOut(c.user, savedNotify(c.user)), sending: false });
}

// Gövde {notify: {anahtar: boolean}}: kısmi birleştirme. Rolün anahtarlarına boolean dışı değer 400; bilinmeyen anahtar yok sayılır.
// Yalnız açıkça seçilen anahtarlar saklanır. Birleştirme SQL içinde (json_patch) yapılır: eşzamanlı iki PUT birbirinin anahtarını ezmez.
// Saklı değer bozuksa ya da nesne değilse {} üstüne yazılır.
async function putNotify(c) {
  const { env, user, body } = c;
  const n = body.notify;
  need(n && typeof n === "object" && !Array.isArray(n), "notify", 400);
  const patch = {};
  for (const k of Object.keys(notifyDefaults(user))) {
    if (!Object.hasOwn(n, k)) continue;
    need(typeof n[k] === "boolean", "notify", 400);
    patch[k] = n[k];
  }
  let row;
  try {
    row = await env.DB.prepare(
      "UPDATE users SET notify = json_patch(CASE WHEN json_valid(notify) THEN CASE WHEN json_type(notify) = 'object' THEN notify ELSE '{}' END ELSE '{}' END, ?) WHERE id = ? RETURNING notify",
    ).bind(JSON.stringify(patch), user.id).first();
  } catch (e) { if (/no such column/i.test(String(e && e.message))) throw new Bad("not_ready", 503); throw e; }
  need(row, "auth", 401);
  return ok(c, { notify: notifyOut(user, savedNotify(row)), sending: false });
}

// ---- sosyal metrikler (src/metrics.js) ----

// Markaya giden ölçümde gönderi kitlesi ve kanal kaynakları yok (yalnız içerik üreticisinin kendi panelinde)
const OWN_AUD = ["watch", "sources", "demo", "unlisted", "ig", "comments_off", "mid"];
const forBrand = m => Array.isArray(m?.accounts) ? { ...m, accounts: m.accounts.map(a => a?.audience ? { ...a, audience: Object.fromEntries(Object.entries(a.audience).filter(([k]) => !OWN_AUD.includes(k))) } : a) } : m;
const metrics = async (c, u, brand = false) => {
  const m = await accountMetrics(c.env, u.id, JSON.parse(u.profile || "{}"));
  return ok(c, { metrics: brand ? forBrand(m) : m });
};

// Marka/ajans: listelenen ya da kendi kampanyasına başvurmuş/davet edilmiş influencer'ın metrikleri
async function influencerMetrics(c, id) {
  const { env, user, site } = c;
  need(isOwnerRole(user));
  const inf = await env.DB.prepare("SELECT id, profile FROM users WHERE id = ? AND site = ? AND role = 'influencer'").bind(id, site).first();
  const linked = inf && JSON.parse(inf.profile || "{}").listed !== true
    ? await env.DB.prepare("SELECT 1 FROM applications a JOIN campaigns c ON c.id = a.campaign_id WHERE a.user_id = ? AND c.owner_id = ? LIMIT 1").bind(id, user.id).first()
    : true;
  need(inf && linked, "not_found", 404);
  return metrics(c, inf, true);
}

// İşbirliği içerik linkinin metrikleri: kampanya sahibi ya da başvuran görür
async function applicationMetrics(c, id) {
  const { env, user } = c;
  const a = await env.DB.prepare("SELECT a.id, a.user_id, a.content_url, c.owner_id FROM applications a JOIN campaigns c ON c.id = a.campaign_id WHERE a.id = ?").bind(id).first();
  need(a && (a.owner_id === user.id || a.user_id === user.id), "not_found", 404);
  return ok(c, { metrics: await linkMetrics(env, a) });
}

async function stats(c) {
  const { env, user } = c;
  const count = async (sql, ...args) => (await env.DB.prepare(sql).bind(...args).first()).n;
  if (isOwnerRole(user)) {
    const { results } = await env.DB.prepare(
      "SELECT a.status, count(*) n FROM applications a JOIN campaigns c ON c.id = a.campaign_id WHERE c.owner_id = ? GROUP BY a.status",
    ).bind(user.id).all();
    return ok(c, {
      stats: {
        campaigns: await count("SELECT count(*) n FROM campaigns WHERE owner_id = ?", user.id),
        open_campaigns: await count("SELECT count(*) n FROM campaigns WHERE owner_id = ? AND status = 'open'", user.id),
        applications: Object.fromEntries(results.map(r => [r.status, r.n])),
      },
    });
  }
  const { results } = await env.DB.prepare("SELECT status, count(*) n FROM applications WHERE user_id = ? GROUP BY status").bind(user.id).all();
  return ok(c, {
    stats: {
      open_campaigns: await count("SELECT count(*) n FROM campaigns c JOIN users u ON u.id = c.owner_id WHERE c.status = 'open' AND u.site = ?", c.site),
      applications: Object.fromEntries(results.map(r => [r.status, r.n])),
    },
  });
}

// ---- yardımcılar ----

const text = (v, max) => (typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, max) : "");
const link = v => { const s = text(v, 300); return URL_RE.test(s) ? s : ""; };
const int = (v, min, max) => { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : null; };
const tags = v => (Array.isArray(v) ? [...new Set(v.map(x => text(x, 40)).filter(Boolean))].slice(0, 5) : []);
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

const enc = new TextEncoder();
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0));
const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)))].map(b => b.toString(16).padStart(2, "0")).join("");

const iterations = env => Math.min(Math.max(Number(env.PBKDF2_ITER) || 50000, 10000), 100000);

async function pbkdf2(password, salt, iter) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, key, 256));
}

async function hashPass(env, password) {
  const iter = iterations(env), salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${iter}$${b64u(salt)}$${b64u(await pbkdf2(password, salt, iter))}`;
}

// Kullanıcı yoksa da aynı iş yapılsın diye sahte özetle karşılaştırılır (süre farkı e-postayı ele vermesin)
const DUMMY = "pbkdf2$50000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
async function checkPass(password, stored) {
  const [, iter, salt, hash] = (stored || DUMMY).split("$");
  const got = await pbkdf2(password, unb64u(salt), Number(iter)), want = unb64u(hash);
  let diff = got.length ^ want.length;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ (want[i] ?? 0);
  return Boolean(stored) && diff === 0;
}

// ---- gönderi ölçümleri (migrations/0006_posts.sql) ----
// Panelin "Gönderiler" sekmesindeki kaydın sunucu karşılığı; alan adları panelle (#217) aynı:
// {id, url, platform, type, date, caption, thumb, snaps: [{at, likes, comments, views, reach}]}.
// POSTS_ENABLED = "1" değilse uçlar 404 döner, panel tarayıcıdaki kayda düşer. Tablolar yoksa 503 not_ready.
const PTYPES = ["photo", "video", "reel", "carousel", "story"], PMETS = ["likes", "comments", "views", "reach"];
const MAX_POSTS = 1000, IMPORT_ROWS = 50;
const postsEnabled = env => env?.POSTS_ENABLED === "1";
const isoDay = d => d.toISOString().slice(0, 10);

// Paneldeki platformOf ile aynı: yalnız https; www., m., vm. atılır
function postPlatform(u) {
  let h;
  try { const x = new URL(u); if (x.protocol !== "https:") return ""; h = x.hostname.toLowerCase().replace(/^(www|m|vm)\./, ""); } catch { return ""; }
  return /(^|\.)instagram\.com$/.test(h) ? "instagram" : /(^|\.)tiktok\.com$/.test(h) ? "tiktok" : /(^|\.)(youtube\.com|youtu\.be)$/.test(h) ? "youtube"
    : /(^|\.)linkedin\.com$/.test(h) ? "linkedin" : /(^|\.)(x\.com|twitter\.com)$/.test(h) ? "x" : "";
}
// Elle girilen bağlantı senkronun yazdığı biçime çevrilir: paylaşım sorgusu (igsh, si, utm) ve # atılır, aynı gönderi iki satır olmaz.
// YouTube: youtu.be, shorts, live, embed, m., music. → watch?v=<kimlik>; TikTok: @ad/(video|photo)/<rakam>; Instagram: p|reel|tv/<kod>/.
// Tanınmayan biçim (vm.tiktok kısa bağlantısı, LinkedIn, X) olduğu gibi kalır.
function canonUrl(u, platform) {
  let x, m;
  try { x = new URL(u); } catch { return u; }
  const h = x.hostname.toLowerCase(), p = x.pathname;
  if (platform === "youtube") {
    const id = /(^|\.)youtu\.be$/.test(h) ? p.split("/")[1] : p === "/watch" ? x.searchParams.get("v") : p.match(/^\/(?:shorts|live|embed|v)\/([^/]+)/)?.[1];
    return /^[\w-]{1,64}$/.test(id || "") ? `https://www.youtube.com/watch?v=${id}` : u;
  }
  if (platform === "tiktok" && /^(www\.|m\.)?tiktok\.com$/.test(h) && (m = p.match(/^\/(@[\w.]{1,64})\/(video|photo)\/(\d{1,30})\/?$/)))
    return `https://www.tiktok.com/${m[1]}/${m[2]}/${m[3]}`;
  if (platform === "instagram" && /^(www\.|m\.)?instagram\.com$/.test(h) && (m = p.match(/^\/(?:[\w.]{1,30}\/)?(p|reels?|tv)\/([\w-]{1,64})\/?$/)))
    return `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/`;
  return u;
}
// YYYY-MM-DD, gerçek bir gün, en geç yarın (saat dilimi payı)
const okDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + "T00:00:00Z"))
  && isoDay(new Date(s + "T00:00:00Z")) === s && s <= isoDay(new Date(Date.now() + 864e5));
const okThumb = s => typeof s === "string" && /^https:\/\/[^\s"'<>]{4,2000}$/.test(s);
// Metrik: yok/boş = ölçülmedi (null); 0+ tam sayı en çok 12 hane (sayı ya da rakam metni); başka her şey undefined (geçersiz)
function pInt(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isInteger(v) && v >= 0 && v < 1e12 ? v : undefined;
  return typeof v === "string" && /^\d{1,12}$/.test(v.trim()) ? Number(v.trim()) : undefined;
}

// Tek satırı doğrular: {row} ya da {error: alan}. type geçersizse platforma göre varsayılan (paneldeki CSV aktarımı gibi).
// row.url tek biçimli bağlantı, row.raw girilen hali (bu değişiklikten önce o haliyle kaydedilmiş satırı bulmak için).
function postIn(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return { error: "row" };
  const raw = typeof o.url === "string" ? o.url.trim() : "";
  const platform = raw.length <= 2000 ? postPlatform(raw) : "";
  if (!platform) return { error: "url" };
  const today = isoDay(new Date());
  const date = o.date == null || o.date === "" ? today : o.date;
  if (!okDay(date)) return { error: "date" };
  const at = o.at == null || o.at === "" ? today : o.at;
  if (!okDay(at)) return { error: "at" };
  const snap = { at };
  for (const k of PMETS) { const n = pInt(o[k]); if (n === undefined) return { error: k }; snap[k] = n; }
  if (PMETS.every(k => snap[k] == null)) return { error: "metrics" };
  const type = PTYPES.includes(o.type) ? o.type : platform === "tiktok" || platform === "youtube" ? "video" : "photo";
  const caption = typeof o.caption === "string" ? o.caption.slice(0, 2200) : "";
  const thumb = okThumb(o.thumb) ? o.thumb : "";
  return { row: { url: canonUrl(raw, platform), raw, platform, type, date, caption, thumb, snap } };
}

// Gönderi ve ölçümü tek batch'te: gönderi varsa bilgileri korunur, yalnız o günün ölçümü eklenir ya da üzerine yazılır
const postWrite = (env, uid, r) => [
  env.DB.prepare("INSERT INTO posts (user_id, url, platform, type, date, caption, thumb) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id, url) DO NOTHING")
    .bind(uid, r.url, r.platform, r.type, r.date, r.caption, r.thumb),
  env.DB.prepare(`INSERT INTO post_snaps (post_id, at, likes, comments, views, reach)
    VALUES ((SELECT id FROM posts WHERE user_id = ? AND url = ?), ?, ?, ?, ?, ?)
    ON CONFLICT (post_id, at) DO UPDATE SET likes = excluded.likes, comments = excluded.comments, views = excluded.views, reach = excluded.reach`)
    .bind(uid, r.url, r.snap.at, r.snap.likes, r.snap.comments, r.snap.views, r.snap.reach),
];

// Elle değişiklik günlüğü (0012 post_edits): yazılacak (url, gün) ölçümlerinin önceki hali tek SELECT'le (json_each) okunur
async function snapsBefore(env, uid, rows) {
  const keys = [...new Set(rows.map(r => JSON.stringify([r.url, r.snap.at])))], cur = new Map();
  if (!keys.length) return cur;
  const got = (await env.DB.prepare(`SELECT p.url, s.at, s.likes, s.comments, s.views, s.reach FROM post_snaps s JOIN posts p ON p.id = s.post_id
    WHERE p.user_id = ? AND (p.url, s.at) IN (SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?))`).bind(uid, `[${keys}]`).all()).results;
  for (const s of got) cur.set(JSON.stringify([s.url, s.at]), s);
  return cur;
}
// Değişen her ölçüm alanı bir satır (yeni ölçümde before null); yazımla aynı batch'te tek INSERT … SELECT (D1 ifade sınırı).
// post_id ifadenin içinde bulunur (yeni gönderi de kimliğini alır). post_edits yoksa yazım bir kez günlüksüz tekrarlanır, sonra bu
// isolate'te (MISSING) doğrudan günlüksüz yapılır. Dönüş: yazılan günlük satırı sayısı; tablo yoksa null (bilinmiyor).
async function writeLogged(env, writes, { actor, uid, rows, source, cur }) {
  if (MISSING.post_edits) { await env.DB.batch(writes); return null; }
  cur = cur || await snapsBefore(env, uid, rows);
  const log = [];
  for (const r of rows) {
    const k = JSON.stringify([r.url, r.snap.at]), was = cur.get(k);
    for (const f of PMETS) { const b = was?.[f] ?? null, n = r.snap[f] ?? null; if (b !== n) log.push({ u: r.url, a: r.snap.at, f, b, n }); }
    cur.set(k, r.snap);
  }
  if (!log.length) { await env.DB.batch(writes); return 0; }
  const ins = env.DB.prepare(`INSERT INTO post_edits (actor_id, user_id, post_id, url, snap_at, field, before, after, source)
    SELECT ?, ?, (SELECT id FROM posts WHERE user_id = ? AND url = json_extract(value, '$.u')), json_extract(value, '$.u'), json_extract(value, '$.a'),
    json_extract(value, '$.f'), json_extract(value, '$.b'), json_extract(value, '$.n'), ? FROM json_each(?)`).bind(actor, uid, uid, source, JSON.stringify(log));
  await batchOr(env, "post_edits", ed => ed ? [...writes, ins] : writes);
  return MISSING.post_edits ? null : log.length;
}

async function postRows(env, uid, where = "", args = []) {
  const posts = (await env.DB.prepare(`SELECT id, url, platform, type, date, caption, thumb, audience, account_id FROM posts WHERE user_id = ?${where} ORDER BY date DESC, id DESC`)
    .bind(uid, ...args).all()).results;
  if (!posts.length) return [];
  const snaps = (await env.DB.prepare(`SELECT s.post_id, s.at, s.likes, s.comments, s.views, s.reach FROM post_snaps s JOIN posts p ON p.id = s.post_id
    WHERE p.user_id = ?${where.replace(/\burl\b/g, "p.url")} ORDER BY s.at`).bind(uid, ...args).all()).results;
  // synced: bağlı hesaptan gelen gönderi (0007 account_id); ölçümü elle değiştirmek edit_metrics ister
  const by = new Map(posts.map(({ account_id, ...p }) => [p.id, { ...p, id: String(p.id), audience: parseAudience(p.audience), ...(account_id != null && { synced: true }), snaps: [] }]));
  for (const s of snaps) by.get(s.post_id)?.snaps.push({ at: s.at, likes: s.likes, comments: s.comments, views: s.views, reach: s.reach });
  return [...by.values()];
}

// Bayrak kapalıysa 404 (panel tarayıcı kaydına düşer); tablo (0006) ya da kitle sütunu (0010) yoksa 503
const postsRoute = fn => async (c, id) => {
  need(postsEnabled(c.env), "not_found", 404);
  try { return await fn(c, id); } catch (e) { if (/no such (table|column)/i.test(String(e && e.message))) throw new Bad("not_ready", 503); throw e; }
};

const postCount = async (env, uid) => (await env.DB.prepare("SELECT COUNT(*) AS n FROM posts WHERE user_id = ?").bind(uid).first()).n;

const listPosts = postsRoute(async c => ok(c, { posts: await postRows(c.env, c.user.id) }));

// Gövde: tek gönderi + ölçüm {url, type, date, caption, thumb, likes, comments, views, reach, at?}
const manualPost = postsRoute(async c => {
  const { env, user } = c;
  const { row, error } = postIn(c.body);
  need(row, error, 400);
  // Girilen haliyle kayıtlı satır varsa ölçüm ona yazılır
  const known = await env.DB.prepare("SELECT url, account_id FROM posts WHERE user_id = ? AND url IN (?, ?) ORDER BY url = ? DESC").bind(user.id, row.url, row.raw, row.raw).first();
  if (known) row.url = known.url;
  // Bağlı hesaptan gelen gönderinin ölçümü edit_metrics (ya da admin) yetkisi ister
  if (known?.account_id != null) need(await canEdit(c), "no_perm", 403);
  need(known || await postCount(env, user.id) < MAX_POSTS, "posts_full", 409);
  await writeLogged(env, postWrite(env, user.id, row), { actor: user.id, uid: user.id, rows: [row], source: "manual" });
  const [post] = await postRows(env, user.id, " AND url = ?", [row.url]);
  return ok(c, { post, added: !known });
});

// Gövde: {rows: [...]} en çok IMPORT_ROWS satır. Geçersiz satırlar atlanır ve sırasıyla bildirilir; geçerliler tek batch'te yazılır.
const importPosts = postsRoute(async c => {
  const { env, user } = c;
  const rows = c.body.rows;
  need(Array.isArray(rows) && rows.length >= 1 && rows.length <= IMPORT_ROWS, "rows", 400);
  let good = [], skipped = [];
  rows.forEach((o, i) => { const { row, error } = postIn(o); if (row) good.push(Object.assign(row, { i })); else skipped.push({ i, error }); });
  // Tek biçimli ve girilen haller birlikte aranır (100 parametre sınırına takılmasın diye tek JSON); girilen haliyle kayıtlı satır öncelikli
  const known = new Map(good.length ? (await env.DB.prepare("SELECT url, account_id FROM posts WHERE user_id = ? AND url IN (SELECT value FROM json_each(?))")
    .bind(user.id, JSON.stringify([...new Set(good.flatMap(r => [r.url, r.raw]))])).all()).results.map(r => [r.url, r.account_id]) : []);
  for (const r of good) if (known.has(r.raw)) r.url = r.raw;
  // Bağlı hesaptan gelen gönderiye yazan satır yetki yoksa "perm" ile atlanır, diğerleri yazılır
  const synced = r => known.get(r.url) != null;
  if (good.some(synced) && !await canEdit(c)) {
    skipped = [...skipped, ...good.filter(synced).map(r => ({ i: r.i, error: "perm" }))].sort((a, b) => a.i - b.i);
    good = good.filter(r => !synced(r));
  }
  const urls = [...new Set(good.map(r => r.url))];
  const added = urls.filter(u => !known.has(u)).length;
  need(!added || await postCount(env, user.id) + added <= MAX_POSTS, "posts_full", 409);
  if (good.length) await writeLogged(env, good.flatMap(r => postWrite(env, user.id, r)), { actor: user.id, uid: user.id, rows: good, source: "import" });
  return ok(c, { added, updated: good.length - added, skipped });
});

// Gövde: {platform}. Bağlı hesaptan senkronun almadığı daha eski en çok OLDER gönderiyi getirir (oauth.js fetchOlderPosts).
// Saatte OLDER_RATE istek (her biri platforma 30'a kadar çağrı). Dönüş: {added, more, full}; panel listeyi GET posts ile yeniler.
const OLDER_RATE = 10;
const OLDER_FAIL = { busy: ["busy", 409], changed: ["busy", 409], not_connected: ["not_connected", 409], full: ["posts_full", 409],
  not_configured: ["not_configured", 409], account_changed: ["account_changed", 409] };
const olderPosts = postsRoute(async c => {
  const { env, user } = c;
  need(ROLES.includes(user.role));
  need(metricsEnabled(env), "disabled", 409);
  const p = c.body.platform;
  need(OLDER_SYNCED.includes(p), "platform", 400);
  if (await attempts(env, "older", "email", user.email, 60, false) >= OLDER_RATE) throw new Bad("rate", 429);
  await attempt(env, c.ip, user.email, "older", 1);
  let r;
  try {
    r = await fetchOlderPosts(env, user.id, p);
  } catch (e) {
    if (!(e instanceof ProviderError)) throw e;
    const [code, status] = OLDER_FAIL[e.code] || ["provider", 502];
    throw new Bad(code, status);
  }
  return ok(c, r);
});

// Gövde: {}. Gönderinin kendi kitlesini sağlayıcıdan tazeler (oauth.js fetchPostAudience); taze, desteklenmeyen ya da yeni
// gönderide çağrı yapılmaz. Saatte POST_AUD_RATE istek. Dönüş: {audience, fetched, reason?}; sağlayıcı hatasında da 200 (kayıtlı kitle)
const POST_AUD_RATE = 40;
const POST_AUD_FAIL = { busy: "busy", changed: "busy", not_connected: "not_connected", account_changed: "not_connected", not_configured: "not_connected", no_api: "not_connected" };
const postAudience = postsRoute(async (c, id) => {
  const { env, user } = c;
  need(ROLES.includes(user.role));
  need(metricsEnabled(env), "disabled", 409);
  need(Number.isInteger(id) && id > 0, "not_found", 404);
  const post = await env.DB.prepare("SELECT id, url, platform, type, date, account_id, audience FROM posts WHERE id = ? AND user_id = ?").bind(id, user.id).first();
  need(post, "not_found", 404);
  const audience = parseAudience(post.audience), skip = postAudSkip(post, audience);
  if (skip) return ok(c, { audience, fetched: false, reason: skip });
  if (await attempts(env, "post_aud", "email", user.email, 60, false) >= POST_AUD_RATE) throw new Bad("rate", 429);
  await attempt(env, c.ip, user.email, "post_aud", 1);
  try { return ok(c, { audience: await fetchPostAudience(env, user.id, post), fetched: true }); }
  catch (e) { if (!(e instanceof ProviderError)) throw e; return ok(c, { audience, fetched: false, reason: POST_AUD_FAIL[e.code] || "upstream" }); }
});

// ---- yönetim paneli (migrations/0012_admin.sql) ----
// Yalnız user_perms'te admin satırı olana açık; diğerlerine (tablo yoksa da) 404, uçların varlığı belli olmaz.
// Sosyal hesaplardan yalnız durum sütunları okunur (token sütunları ve scope asla). Tablo/sütun yoksa 503 not_ready.
const adminRoute = fn => async (c, id) => {
  need(await isAdmin(c), "not_found", 404);
  need(id === undefined || Number.isSafeInteger(id), "not_found", 404);
  try { return await fn(c, id); } catch (e) { if (/no such (table|column)/i.test(String(e && e.message))) throw new Bad("not_ready", 503); throw e; }
};
// Panelin tek isteği. Günlükler (edits, perm_log, meta) tablosu yoksa boş döner; kullanıcı ve hesap listesindeki hata 503 not_ready.
const listAll = async (env, sql, ...args) => (await env.DB.prepare(sql).bind(...args).all()).results;
const listOr = (env, sql, ...args) => listAll(env, sql, ...args).catch(e => { if (noTable(e)) return []; throw e; });
const adminHome = adminRoute(async c => {
  const { env, site } = c;
  const [users, edits, syncs, meta, permLog] = await Promise.all([
    listAll(env, `SELECT u.id, u.created_at, u.email, u.name, u.role, u.lang, (SELECT COUNT(*) FROM posts WHERE user_id = u.id) posts,
      (SELECT COUNT(*) FROM social_accounts WHERE user_id = u.id AND status = 'connected') conns, (SELECT group_concat(perm) FROM user_perms WHERE user_id = u.id) perms,
      (SELECT MAX(created_at) FROM sessions WHERE user_id = u.id) last_login FROM users u WHERE u.site = ? ORDER BY u.created_at DESC, u.id DESC`, site),
    // Gönderi silindiyse post_id ve platform null (posts.id yeniden kullanılabilir; eşleşme kullanıcı ve url ile de denetlenir)
    listOr(env, `SELECT e.id, e.at, e.actor_id, a.email actor_email, e.user_id, o.email owner_email, p.id post_id, p.platform, e.url, e.snap_at, e.field, e.before, e.after, e.source
      FROM post_edits e JOIN users o ON o.id = e.user_id AND o.site = ? LEFT JOIN users a ON a.id = e.actor_id
      LEFT JOIN posts p ON p.id = e.post_id AND p.user_id = e.user_id AND p.url = e.url ORDER BY e.id DESC LIMIT 200`, site),
    listAll(env, `SELECT s.id, s.user_id, u.email, s.platform, s.handle, s.status, s.connected_at, s.updated_at, s.next_sync_at, s.error, s.sync_changes
      FROM social_accounts s JOIN users u ON u.id = s.user_id AND u.site = ? ORDER BY s.updated_at DESC, s.id DESC`, site),
    listOr(env, "SELECT id, at, kind, code, matched FROM meta_events ORDER BY id DESC LIMIT 100"),
    // Yetki geçmişi: hedef kullanıcının sitesinden, en yeni önce
    listOr(env, `SELECT l.id, l.at, l.actor_id, a.email actor_email, l.user_id, u.email, l.perm, l.granted
      FROM perm_log l JOIN users u ON u.id = l.user_id AND u.site = ? LEFT JOIN users a ON a.id = l.actor_id ORDER BY l.id DESC LIMIT 100`, site),
  ]);
  return ok(c, {
    users: users.map(u => { const p = (u.perms || "").split(",").filter(Boolean); return { ...u, perms: p.filter(x => x !== "admin").sort(), ...(p.includes("admin") && { admin: true }) }; }),
    edits, syncs, meta, perm_log: permLog,
  });
});

const siteUser = (c, id) => c.env.DB.prepare("SELECT id FROM users WHERE id = ? AND site = ?").bind(id, c.site).first();

// Kullanıcının gönderileri (GET posts ile aynı biçim); yönetici düzeltecek gönderiyi buradan seçer
const adminPosts = adminRoute(async (c, id) => {
  need(await siteUser(c, id), "not_found", 404);
  return ok(c, { posts: await postRows(c.env, id) });
});

// Gövde: {perm: "edit_metrics", on: bool}. API yalnız edit_metrics'i açar/kapatır; admin yalnız elle eklenir (0012 başlığı).
const adminPerm = adminRoute(async (c, id) => {
  const { env } = c;
  need(c.body.perm === "edit_metrics" && typeof c.body.on === "boolean", "bad_perm", 400);
  need(await siteUser(c, id), "not_found", 404);
  // Durum gerçekten değişiyorsa perm_log'a bir satır (değişiklikten önce, aynı batch'te); perm_log yoksa değişiklik günlüksüz yapılır
  const on = c.body.on ? 1 : 0;
  const log = env.DB.prepare(`INSERT INTO perm_log (actor_id, user_id, perm, granted) SELECT ?, ?, 'edit_metrics', ?
    WHERE ? <> EXISTS (SELECT 1 FROM user_perms WHERE user_id = ? AND perm = 'edit_metrics')`).bind(c.user.id, id, on, on, id);
  const change = on ? env.DB.prepare("INSERT INTO user_perms (user_id, perm, granted_by) VALUES (?, 'edit_metrics', ?) ON CONFLICT DO NOTHING").bind(id, c.user.id)
    : env.DB.prepare("DELETE FROM user_perms WHERE user_id = ? AND perm = 'edit_metrics'").bind(id);
  await batchOr(env, "perm_log", ed => ed ? [log, change] : [change]);
  const perms = (await env.DB.prepare("SELECT perm FROM user_perms WHERE user_id = ? AND perm <> 'admin' ORDER BY perm").bind(id).all()).results.map(r => r.perm);
  return ok(c, { user_id: id, perms });
});

// Gönderi (bu sitede) önce aranır: yoksa gövdeye bakılmadan 404. Gövde: {at, likes?, comments?, views?, reach?} (postIn kuralları
// ve hata kodları, en az bir ölçüm). O günün ölçümüne yazılır, gövdede olmayan (ya da boş) alan korunur; değişen alanlar günlüğe
// source admin ile yazılır, o gün senkronla ezilmez (oauth.js postWrites). Dönüş: {snap, changed}; post_edits yoksa changed null.
const adminSnap = adminRoute(async (c, id) => {
  const { env } = c, b = c.body;
  const post = await env.DB.prepare("SELECT p.id, p.user_id, p.url FROM posts p JOIN users u ON u.id = p.user_id AND u.site = ? WHERE p.id = ?").bind(c.site, id).first();
  need(post, "not_found", 404);
  const at = b.at == null || b.at === "" ? isoDay(new Date()) : b.at;
  need(okDay(at), "at", 400);
  const set = {};
  for (const k of PMETS) { set[k] = pInt(b[k]); need(set[k] !== undefined, k, 400); }
  need(PMETS.some(k => set[k] != null), "metrics", 400);
  const cur = await snapsBefore(env, post.user_id, [{ url: post.url, snap: { at } }]), was = cur.get(JSON.stringify([post.url, at])), snap = { at };
  for (const k of PMETS) snap[k] = set[k] ?? was?.[k] ?? null;
  const changed = await writeLogged(env, [env.DB.prepare(`INSERT INTO post_snaps (post_id, at, likes, comments, views, reach) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (post_id, at) DO UPDATE SET likes = COALESCE(excluded.likes, likes), comments = COALESCE(excluded.comments, comments),
    views = COALESCE(excluded.views, views), reach = COALESCE(excluded.reach, reach)`).bind(post.id, at, set.likes, set.comments, set.views, set.reach)],
  { actor: c.user.id, uid: post.user_id, rows: [{ url: post.url, snap }], source: "admin", cur });
  return ok(c, { snap: { post_id: String(post.id), ...snap }, changed });
});
