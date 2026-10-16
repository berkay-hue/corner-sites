// brandcorner.co platformu: üyelik (/auth/*) ve panel (/app/*) API'si.
// Oturum: rastgele 32 baytlık token; D1'de yalnızca SHA-256 özeti tutulur. Ön yüz token'ı
// "Authorization: Bearer <token>" başlığıyla gönderir (site ile worker farklı alan adında, çerez yok).
// Şifre: PBKDF2-SHA256 + 16 bayt tuz. Tur sayısı özetin içinde saklanır; PBKDF2_ITER artırılırsa
// eski özetler bir sonraki girişte yenilenir. Varsayılan 50000: ücretsiz plandaki 10 ms CPU sınırına sığar.
// Şifre sıfırlama e-postası yok: MAIL binding'i yalnızca MAIL_TO adresine gönderebiliyor.

const ROLES = ["brand", "influencer", "agency"];
const PLATFORMS = ["instagram", "tiktok", "youtube", "x", "linkedin", "twitch"];
const CURRENCIES = ["TRY", "USD", "EUR"];
const SESSION_DAYS = 30, MAX_BODY = 20000, MAX_CAMPAIGNS = 100, DAILY_APPLY = 50;
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
  const c = { env, origin, site, deliver, ip: req.headers.get("cf-connecting-ip") || "", body: {}, query: Object.fromEntries(url.searchParams) };
  try {
    if (req.method === "POST") {
      const text = await req.text();
      if (text.length > MAX_BODY) throw new Bad("size", 413);
      try { c.body = text ? JSON.parse(text) : {}; } catch { throw new Bad("json"); }
      if (!c.body || typeof c.body !== "object" || Array.isArray(c.body)) throw new Bad("json");
    }
    const route = `${req.method} ${url.pathname.replace(/\/+$/, "")}`;
    if (route === "POST /auth/register") return await register(c);
    if (route === "POST /auth/login") return await login(c);

    const token = (req.headers.get("authorization") || "").match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    c.user = token && await env.DB.prepare(
      "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.site = ?",
    ).bind(await sha256(token), site).first();
    if (!c.user) throw new Bad("auth", 401);

    if (route === "GET /auth/me") return ok(c, { user: me(c.user) });
    if (route === "POST /auth/logout") {
      await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
      return ok(c, {});
    }
    const m = route.match(/^(GET|POST) \/app\/([a-z]+)(?:\/(\d+))?(?:\/([a-z]+))?$/);
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
  if (await attempts(env, "register", "ip", ip, 60, false) >= 5) throw new Bad("rate", 429);
  await attempt(env, ip, email, "register", 1);

  const user = await env.DB.prepare(
    "INSERT INTO users (site, email, name, role, lang, pass) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING RETURNING *",
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

// cron'dan: süresi dolan oturumlar ve eski deneme kayıtları
export async function cleanup(env) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')"),
    env.DB.prepare("DELETE FROM auth_attempts WHERE created_at < datetime('now', '-1 day')"),
  ]);
}

// ---- panel ----

const APP = {
  "GET profile": c => ok(c, { user: me(c.user) }),
  "POST profile": updateProfile,
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
};

const isOwnerRole = u => u.role === "brand" || u.role === "agency";
const need = (cond, code = "forbidden", status = 403) => { if (!cond) throw new Bad(code, status); };

async function updateProfile(c) {
  const { env, user, body } = c;
  const p = body.profile && typeof body.profile === "object" ? body.profile : {};
  const profile = {
    bio: text(p.bio, 500), city: text(p.city, 100), website: link(p.website),
    ...(user.role !== "influencer" && { company: text(p.company, 100), industry: text(p.industry, 60) }),
    ...(user.role === "agency" && { clients: int(p.clients, 0, 10000) }),
    ...(user.role === "influencer" && {
      niches: tags(p.niches),
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

function campaignData(b, old = {}) {
  const pick = (k, f) => (b[k] === undefined ? old[k] : f(b[k]));
  const d = {
    title: pick("title", v => text(v, 120)),
    brief: pick("brief", v => text(v, 3000)),
    niches: pick("niches", tags) || [],
    platforms: pick("platforms", v => (Array.isArray(v) ? [...new Set(v.filter(x => PLATFORMS.includes(x)))] : [])) || [],
    budget_min: pick("budget_min", v => int(v, 0, 1e9)),
    budget_max: pick("budget_max", v => int(v, 0, 1e9)),
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
    const { results } = await env.DB.prepare(
      `SELECT c.*, (SELECT count(*) FROM applications a WHERE a.campaign_id = c.id) applications,
        (SELECT count(*) FROM applications a WHERE a.campaign_id = c.id AND a.status = 'pending') pending
       FROM campaigns c WHERE c.owner_id = ? ORDER BY c.id DESC`,
    ).bind(user.id).all();
    return ok(c, { campaigns: results.map(r => ({ ...campaignOut({ ...r, owner_name: user.name }), applications: r.applications, pending: r.pending })) });
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
const appOut = a => ({ id: a.id, campaign_id: a.campaign_id, status: a.status, message: a.message, content_url: a.content_url, created_at: a.created_at, updated_at: a.updated_at });

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
  const inf = await env.DB.prepare("SELECT id FROM users WHERE id = ? AND site = ? AND role = 'influencer'").bind(int(body.user_id, 1, 1e12) ?? 0, site).first();
  need(inf, "not_found", 404);
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
  return ok(c, { application: appOut(u) });
}

async function influencers(c) {
  const { env, user, site, query: q } = c;
  need(isOwnerRole(user));
  const { results } = await env.DB.prepare("SELECT id, name, profile FROM users WHERE site = ? AND role = 'influencer' ORDER BY id DESC LIMIT 500").bind(site).all();
  let list = results.map(r => ({ ...creator(r.id, r.name, r.profile), listed: JSON.parse(r.profile || "{}").listed === true })).filter(x => x.listed);
  if (q.niche) list = list.filter(x => x.niches.some(n => n.toLowerCase() === q.niche.toLowerCase()));
  if (q.platform) list = list.filter(x => x.platforms.some(p => p.platform === q.platform));
  return ok(c, { influencers: list.slice(0, 100).map(({ listed, ...x }) => x) });
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
