// Corner sitelerinin form alıcısı. Siteler (Cloudflare Pages) formu JSON olarak POST /submit eder:
//   { page: "/iletisim", fields: [["Ad", "..."], ["E-posta", "..."]], hp: "" }
// Kayıt D1'e yazılır; e-posta MAIL binding'i (Email Routing) üzerinden MAIL_TO adresine gider.
import { EmailMessage } from "cloudflare:email";
import { platform, cleanup } from "./platform.js";
import { oauthCallback, syncDue, ytRetention } from "./oauth.js";
import { metricsEnabled } from "./metrics.js";

const MAX_FIELDS = 30, MAX_LEN = 5000, RATE = 5; // 10 dakikada IP başına en fazla RATE gönderim

function allowedOrigin(env, origin) {
  if (!origin) return null;
  // DEV_ORIGINS: yalnızca yerel geliştirme (wrangler dev --var), canlıda tanımlı değil
  if ((env.DEV_ORIGINS || "").split(",").includes(origin)) return origin;
  let h;
  try { h = new URL(origin).hostname; } catch { return null; }
  const ok = env.ALLOWED_HOSTS.split(",").some(d => h === d || h === "www." + d) || /^web-[a-z]+\.pages\.dev$|\.web-[a-z]+\.pages\.dev$/.test(h);
  return ok ? origin : null;
}

const json = (body, status, origin) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", ...(origin && { "access-control-allow-origin": origin, vary: "Origin" }) },
});

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = allowedOrigin(env, req.headers.get("origin"));
    if (req.method === "OPTIONS") return new Response(null, {
      status: origin ? 204 : 403,
      headers: origin ? { "access-control-allow-origin": origin, "access-control-allow-methods": "GET, POST, PUT", "access-control-allow-headers": "content-type, authorization", "access-control-max-age": "86400", vary: "Origin" } : {},
    });
    if (url.pathname.startsWith("/rakip/")) return rakip(req, url, env, origin);
    // Sosyal hesap bağlama dönüşü (src/oauth.js): sağlayıcı yönlendirmesinde Origin yok, platform() dışında
    if (url.pathname.startsWith("/oauth/")) return oauthCallback(req, url, env);
    // brandcorner.co platformu: üyelik ve panel
    if (/^\/(auth|app)\//.test(url.pathname)) return platform(req, url, env, origin, deliver);
    if (url.pathname !== "/submit" || req.method !== "POST") return json({ ok: false }, 404, origin);
    if (!origin) return json({ ok: false, error: "origin" }, 403, null);

    let data;
    try { data = await req.json(); } catch { return json({ ok: false, error: "json" }, 400, origin); }
    // Bal küpü dolduysa bot: sessizce başarılı dön
    if (data.hp) return json({ ok: true }, 200, origin);
    const fields = (Array.isArray(data.fields) ? data.fields : []).slice(0, MAX_FIELDS)
      .map(f => [String(f?.[0] ?? "").slice(0, 100).trim(), String(f?.[1] ?? "").slice(0, MAX_LEN).trim()])
      .filter(([k, v]) => k && v);
    if (!fields.length) return json({ ok: false, error: "empty" }, 400, origin);

    const ip = req.headers.get("cf-connecting-ip") || "";
    const { n } = await env.DB.prepare("SELECT count(*) n FROM submissions WHERE ip = ? AND created_at > datetime('now', '-10 minutes')").bind(ip).first();
    if (n >= RATE) return json({ ok: false, error: "rate" }, 429, origin);

    const site = new URL(origin).hostname.replace(/^www\./, "");
    const page = String(data.page || "/").slice(0, 300);
    const row = await env.DB.prepare("INSERT INTO submissions (site, page, fields, ip, ua) VALUES (?, ?, ?, ?, ?) RETURNING id, created_at")
      .bind(site, page, JSON.stringify(fields), ip, (req.headers.get("user-agent") || "").slice(0, 300)).first();
    await deliver(env, { ...row, site, page, fields });
    return json({ ok: true }, 200, origin);
  },

  // E-postası gitmemiş kayıtları tekrar dene (binding sonradan açılınca eskiler de gelir)
  async scheduled(_, env) {
    const { results } = await env.DB.prepare("SELECT * FROM submissions WHERE emailed = 0 ORDER BY id LIMIT 50").all();
    for (const r of results) await deliver(env, { ...r, fields: JSON.parse(r.fields) });
    try { await cleanup(env); } catch (e) { console.log("cleanup", e?.message?.slice(0, 80)); }
    // YouTube saklama kuralı (src/oauth.js ytRetention): METRICS_ENABLED kapansa da kalan veri süresi dolunca silinir
    try { await ytRetention(env); } catch (e) { console.log("retention", e?.message?.slice(0, 80)); }
    // Günlük metrik senkronu (src/oauth.js syncDue), METRICS_ENABLED "1" ise. Ücretsiz plan çağrı başına 50 alt
    // istek ve 50 D1 sorgusu veriyor; gönderilen her e-postayı bir istek sayıp kalanı senkrona bırakıyoruz. D1'de
    // bekleyen listesi (1), e-posta başına işaret (1), cleanup (4 ifade) ve YouTube saklama (3 ifade) düşülür.
    if (metricsEnabled(env)) {
      const d1 = 50 - 1 - results.length - 4 - 3;
      try { await syncDue(env, fetch, { budget: 40 - results.length, d1 }); } catch (e) { console.log("sync", e?.message?.slice(0, 80)); }
    }
  },
};

// salescorner rakip analizi: n8n webhook'larına sunucudan geçilir (n8n, Origin başlıklı isteklere 500 dönüyor)
async function rakip(req, url, env, origin) {
  if (!origin) return json({ ok: false, error: "origin" }, 403, null);
  const pass = async r => new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") || "application/json", "access-control-allow-origin": origin, vary: "Origin" },
  });
  if (url.pathname === "/rakip/start" && req.method === "POST") {
    const body = await req.text();
    if (body.length > 5000) return json({ ok: false, error: "size" }, 413, origin);
    return pass(await fetch(env.RAKIP_START, { method: "POST", headers: { "content-type": "application/json" }, body }));
  }
  if (url.pathname === "/rakip/status" && req.method === "GET") {
    const id = url.searchParams.get("executionId") || "";
    return pass(await fetch(`${env.RAKIP_STATUS}?executionId=${encodeURIComponent(id.slice(0, 100))}`));
  }
  return json({ ok: false }, 404, origin);
}

async function deliver(env, s) {
  if (!env.MAIL) return;
  try {
    await env.MAIL.send(new EmailMessage(env.MAIL_FROM, env.MAIL_TO, mime(env, s)));
    await env.DB.prepare("UPDATE submissions SET emailed = 1, error = NULL WHERE id = ?").bind(s.id).run();
  } catch (e) {
    await env.DB.prepare("UPDATE submissions SET error = ? WHERE id = ?").bind(String(e?.message || e).slice(0, 500), s.id).run();
  }
}

const b64 = s => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const word = s => `=?UTF-8?B?${b64(s)}?=`;
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function mime(env, s) {
  const email = s.fields.find(([, v]) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v))?.[1];
  const name = s.fields.find(([k]) => /^(name|ad|isim|ad soyad)/i.test(k))?.[1];
  const subject = `[${s.site}] Yeni form: ${name || email || s.page}`;
  const text = `${s.site}${s.page}\n${s.created_at} UTC\n\n` + s.fields.map(([k, v]) => `${k}:\n${v}\n`).join("\n");
  const html = `<p style="color:#666">${esc(s.site + s.page)} · ${esc(s.created_at)} UTC</p><table cellpadding="6" style="border-collapse:collapse;font:14px sans-serif">` +
    s.fields.map(([k, v]) => `<tr><td style="vertical-align:top;color:#666;white-space:nowrap"><b>${esc(k)}</b></td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join("") + "</table>";
  const boundary = "b" + crypto.randomUUID().replace(/-/g, "");
  const wrap = s => b64(s).replace(/.{76}/g, "$&\r\n");
  return [
    `From: ${word(s.site + " form")} <${env.MAIL_FROM}>`,
    `To: <${env.MAIL_TO}>`,
    ...(email ? [`Reply-To: <${email}>`] : []),
    `Subject: ${word(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${env.MAIL_FROM.split("@")[1]}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", wrap(text),
    `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", wrap(html),
    `--${boundary}--`, "",
  ].join("\r\n");
}
