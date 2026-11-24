// A14 CMS adaptörleri — yalnız sahte fetch; gerçek anahtar/token yok.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PROVIDERS, UNSUPPORTED, ERROR_HELP, safeUrl, guardedFetch, mdToHtml, mdToRicos, utf8B64, slugify, ghostJwt } from "./cms-providers.js";

const NOW = Date.UTC(2026, 10, 24, 9, 0, 0);

// publish-providers.js'teki fakeProvider'ın yerel kopyası (Headers nesnesi + bayt gövde destekli).
function fakeFetch(responses) {
  const calls = [];
  const f = async (url, init = {}) => {
    const b = init.body;
    const body = b == null ? null : b instanceof Uint8Array ? b : String(b);
    calls.push({ url: String(url), method: init.method || "GET", body, headers: Object.fromEntries(new Headers(init.headers || {})) });
    const r = typeof responses === "function" ? await responses(String(url), init, calls.length - 1) : responses.shift();
    if (!r) throw new Error("fakeFetch: yanıt kalmadı");
    if (r.throw) {
      const e = new Error(r.throw === "timeout" ? "The operation was aborted due to timeout" : "fetch failed");
      e.name = r.throw === "timeout" ? "TimeoutError" : "TypeError";
      throw e;
    }
    const status = r.status ?? 200;
    const text = r.body === undefined || status === 204 || (status >= 300 && status < 400) ? null
      : r.body instanceof Uint8Array ? r.body : typeof r.body === "string" ? r.body : JSON.stringify(r.body);
    return new Response(text, { status, headers: r.headers });
  };
  f.calls = calls;
  return f;
}

function mkIo(routes, env) {
  const f = fakeFetch(routes);
  const logs = [];
  return { io: { fetch: f, now: () => NOW, log: s => logs.push(String(s)), env: env || {} }, calls: f.calls, logs };
}

// Yönlendirici: [ [düzenli ifade | (url,init)=>bool, yanıt | (url,init,i)=>yanıt], ... ]
const router = table => (url, init, i) => {
  const m = (init.method || "GET").toUpperCase();
  for (const [k, v] of table) {
    const hit = typeof k === "function" ? k(url, m) : k.test(`${m} ${url}`);
    if (hit) return typeof v === "function" ? v(url, init, i) : v;
  }
  return { status: 599, body: { unmatched: `${m} ${url}` } };
};
const jbody = c => JSON.parse(c.body);
const noSecret = (secrets, ...things) => {
  const blob = things.map(t => (typeof t === "string" ? t : JSON.stringify(t))).join("\n");
  for (const s of secrets) assert.ok(!blob.includes(s), `sızıntı: ${s.slice(0, 4)}…`);
};
const POST = {
  title: "Şirketler için İçerik Stratejisi", slug: "sirketler-icin-icerik-stratejisi",
  html: "<p>Merhaba</p>", markdown: "# Başlık\n\nİlk **kalın** paragraf [bağlantı](https://ornek.com/a).\n\n- bir\n- iki\n",
  excerpt: "Kısa özet.", cover: { url: "https://images.pexels.com/photos/1/kapak.jpeg", alt: "Kapak", credit: "Pexels" }, lang: "tr", tags: ["b2b"],
};

// ---------------------------------------------------------------- sözleşme şekli
test("PROVIDERS/UNSUPPORTED/ERROR_HELP şekli", () => {
  assert.deepEqual(Object.keys(PROVIDERS), ["wordpress", "webflow", "ghost", "shopify", "hubspot", "wix", "github", "cloudflare", "ideasoft", "wpcom"]);
  assert.equal(PROVIDERS.cloudflare.stored_as, "github");
  for (const [id, p] of Object.entries(PROVIDERS)) if (id !== "cloudflare") assert.equal(p.stored_as, undefined, id);
  for (const [id, p] of Object.entries(PROVIDERS)) {
    assert.equal(p.id, id);
    assert.ok(p.name && (p.auth === "key" || p.auth === "oauth"));
    assert.equal(typeof p.probe, "function");
    assert.equal(typeof p.push, "function");
    for (const f of p.fields) {
      for (const k of ["key", "label_tr", "label_en", "type", "help_tr", "help_en"]) assert.ok(f[k], `${id}.${f.key}.${k}`);
      assert.ok(["url", "text", "secret", "select"].includes(f.type));
      assert.equal(typeof f.required, "boolean");
      if (f.type === "select") assert.ok(f.options.every(o => o.id && o.label_tr && o.label_en));
    }
    if (p.auth === "oauth") { assert.equal(typeof p.oauth.authorizeUrl, "function"); assert.equal(typeof p.oauth.exchange, "function"); }
  }
  assert.deepEqual(PROVIDERS.wpcom.requires, ["WPCOM_CLIENT_ID", "WPCOM_CLIENT_SECRET"]);
  assert.deepEqual(UNSUPPORTED.map(u => u.id), ["ikas", "ticimax"]);
  for (const c of ["auth", "forbidden", "not_found", "no_api", "plan", "header_stripped", "ssrf", "timeout", "bad_input", "rate", "unknown_result", "server", "not_ready", "network"]) {
    assert.ok(ERROR_HELP[c]?.tr && ERROR_HELP[c]?.en, c);
  }
});

// ---------------------------------------------------------------- SSRF
test("safeUrl: IP biçimleri, iç adlar, port, userinfo", () => {
  const bad = {
    "https://127.0.0.1": "ssrf", "https://2130706433": "ssrf", "https://0x7f000001": "ssrf", "https://0x7f.1": "ssrf",
    "https://0177.0.0.1": "ssrf", "https://127.1": "ssrf", "https://169.254.169.254/latest/meta-data": "ssrf",
    "https://[::1]": "ssrf", "https://[::ffff:127.0.0.1]": "ssrf", "https://localhost": "ssrf", "https://LOCALHOST.": "ssrf",
    "https://foo.local": "ssrf", "https://metadata.google.internal": "ssrf", "https://router.lan": "ssrf", "https://intranet": "ssrf",
    "https://user:pw@ornek.com": "ssrf", "https://ornek.com:8443": "ssrf", "http://ornek.com": "ssrf", "https://1.2.3.4.5": "bad_input" /* URL ayrıştırıcı reddeder */,
    "javascript:alert(1)": "bad_input", "ftp://ornek.com": "bad_input", "": "bad_input", "https://or nek.com": "bad_input",
  };
  for (const [u, e] of Object.entries(bad)) assert.deepEqual(safeUrl(u), { ok: false, error: e }, u);
  assert.deepEqual(safeUrl("ornek.com"), { ok: true, url: "https://ornek.com/" });
  assert.deepEqual(safeUrl("https://blog.ornek.com.tr:443/yol?a=1#x"), { ok: true, url: "https://blog.ornek.com.tr/yol?a=1" });
  assert.equal(safeUrl("https://xn--rnek-6qa.com").ok, true);
});

test("guardedFetch: yönlendirme her adımda yeniden denetlenir", async () => {
  const { io, calls } = mkIo(router([[/ornek\.com/, { status: 302, headers: { location: "https://127.0.0.1/admin" } }]]));
  const r = await guardedFetch(io, "https://ornek.com/", { headers: { authorization: "Basic gizli" } });
  assert.deepEqual(r, { ok: false, error: "ssrf" });
  assert.equal(calls.length, 1);
  const { io: io2, calls: c2 } = mkIo(router([[/ornek\.com/, { status: 301, headers: { location: "http://ornek.com/" } }]]));
  assert.equal((await guardedFetch(io2, "https://ornek.com/", {})).error, "ssrf");
  assert.equal(c2.length, 1);
});

test("guardedFetch: farklı host'a Authorization gitmez, aynı host'a gider", async () => {
  const { io, calls } = mkIo(router([
    [/GET https:\/\/ornek\.com\/a/, { status: 302, headers: { location: "/b" } }],
    [/GET https:\/\/ornek\.com\/b/, { status: 302, headers: { location: "https://cdn.baska.com/c" } }],
    [/cdn\.baska\.com/, { body: { ok: 1 } }],
  ]));
  const r = await guardedFetch(io, "https://ornek.com/a", { headers: { authorization: "Bearer GIZLI", cookie: "s=1", "x-shopify-access-token": "t" } });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data, { ok: 1 });
  assert.equal(calls.length, 3);
  assert.equal(calls[1].headers.authorization, "Bearer GIZLI");
  for (const k of ["authorization", "cookie", "x-shopify-access-token"]) assert.equal(calls[2].headers[k], undefined);
  for (const c of calls) assert.ok(c.headers["user-agent"]);
});

test("guardedFetch: 3'ten çok yönlendirme, allowHosts dışı, zaman aşımı, ağ hatası, boyut sınırı", async () => {
  let n = 0;
  const { io } = mkIo(() => ({ status: 302, headers: { location: `https://ornek.com/r${++n}` } }));
  assert.equal((await guardedFetch(io, "https://ornek.com/", {})).error, "server");
  assert.equal(n, 4);
  const { io: io2, calls: c2 } = mkIo(router([[/api\.webflow\.com/, { status: 302, headers: { location: "https://kotu.com/" } }]]));
  assert.equal((await guardedFetch(io2, "https://api.webflow.com/v2/x", {}, { allowHosts: ["api.webflow.com"] })).error, "ssrf");
  assert.equal(c2.length, 1);
  assert.equal((await guardedFetch(io2, "https://kotu.com/", {}, { allowHosts: ["api.webflow.com"] })).error, "ssrf");
  const { io: io3 } = mkIo([{ throw: "timeout" }, { throw: "network" }, { body: "x".repeat(2000) }]);
  assert.equal((await guardedFetch(io3, "https://ornek.com/", {})).error, "timeout");
  assert.equal((await guardedFetch(io3, "https://ornek.com/", {})).error, "network");
  assert.equal((await guardedFetch(io3, "https://ornek.com/", {}, { maxBytes: 1000 })).error, "server");
});

test("guardedFetch: 303 ve POST'ta 302 → GET, gövde düşer", async () => {
  const { io, calls } = mkIo([{ status: 303, headers: { location: "/son" } }, { body: { ok: true } }]);
  const r = await guardedFetch(io, "https://ornek.com/x", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
  assert.equal(r.status, 200);
  assert.equal(calls[1].method, "GET");
  assert.equal(calls[1].body, null);
});

// ---------------------------------------------------------------- Markdown
test("mdToHtml: kaçış, javascript: bağlantısı düşer, biçimler", () => {
  const h = mdToHtml("# Başlık <b>\n\n<script>alert(1)</script> & \"tırnak\" 'tek'\n\n[tıkla](javascript:alert(1)) [iyi](https://ornek.com/a?b=1&c=2) [veri](data:text/html,x)\n\n**kalın** *italik* _alt_ snake_case_ad `kod<`\n\n- bir\n- iki\n\n1. a\n2. b\n\n```\n<div>\n```");
  assert.ok(!h.includes("<script>"));
  assert.ok(h.includes("&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;tırnak&quot; &#39;tek&#39;"));
  assert.ok(!/href="(javascript|data):/i.test(h));
  assert.ok(h.includes("tıkla") && h.includes("veri"));
  assert.ok(h.includes('<a href="https://ornek.com/a?b=1&amp;c=2">iyi</a>'));
  assert.ok(h.includes("<h1>Başlık &lt;b&gt;</h1>"));
  assert.ok(h.includes("<strong>kalın</strong>") && h.includes("<em>italik</em>") && h.includes("<em>alt</em>"));
  assert.ok(h.includes("snake_case_ad"));
  assert.ok(h.includes("<code>kod&lt;</code>"));
  assert.ok(h.includes("<ul><li>bir</li><li>iki</li></ul>") && h.includes("<ol><li>a</li><li>b</li></ol>"));
  assert.ok(h.includes("<pre><code>&lt;div&gt;</code></pre>"));
  const q = mdToHtml('[x](https://ornek.com/"onmouseover=alert(1))');
  assert.ok(!q.includes('"onmouseover'));
  const nc = mdToHtml("```\nsatır\n```\n\n`k`", { code: false });
  assert.ok(!nc.includes("<pre") && !nc.includes("<code") && nc.includes("<p>satır</p>"));
});

test("mdToRicos: üst düzeyde TEXT yok, listeler LIST_ITEM→PARAGRAPH→TEXT", () => {
  const r = mdToRicos("## Başlık\n\nMetin **kalın** [b](https://ornek.com)\n\n- a\n- b\n\n1. x\n\n> alıntı\n\n```\nkod\n```\n\n---");
  assert.ok(r.nodes.length > 0);
  for (const n of r.nodes) assert.notEqual(n.type, "TEXT");
  const walk = (n, parent) => {
    if (n.type === "TEXT") {
      assert.ok(["PARAGRAPH", "HEADING"].includes(parent), `TEXT ebeveyni ${parent}`);
      assert.equal(typeof n.textData.text, "string");
      assert.ok(Array.isArray(n.textData.decorations));
    }
    for (const c of n.nodes || []) walk(c, n.type);
  };
  r.nodes.forEach(n => walk(n, "ROOT"));
  assert.deepEqual(r.nodes[0].headingData, { level: 2 });
  const ul = r.nodes.find(n => n.type === "BULLETED_LIST");
  assert.equal(ul.nodes[0].type, "LIST_ITEM");
  assert.equal(ul.nodes[0].nodes[0].type, "PARAGRAPH");
  const decos = r.nodes[1].nodes.flatMap(t => t.textData.decorations.map(d => d.type));
  assert.ok(decos.includes("BOLD") && decos.includes("LINK"));
});

test("utf8B64 ve slugify Türkçe", () => {
  const s = "Şirket çağı ığdır ÖÜ – “tırnak”";
  assert.equal(new TextDecoder().decode(Uint8Array.from(atob(utf8B64(s)), c => c.charCodeAt(0))), s);
  assert.equal(slugify("Şirketler İçin Güçlü Öneriler: Çağ!"), "sirketler-icin-guclu-oneriler-cag");
  assert.equal(slugify("!!!"), "yazi");
});

// ---------------------------------------------------------------- WordPress
const WP_PASS = "abcd EFGH ijkl MNOP qrst UVWX";
const wpIndex = { name: "Örnek Blog", home: "https://ornek.com", namespaces: ["oembed/1.0", "wp/v2"], authentication: { "application-passwords": { endpoints: {} } } };
const wpRoutes = over => router([
  ...(over || []),
  [/HEAD https:\/\/ornek\.com\/$/, { headers: { link: '<https://ornek.com/wp-json/>; rel="https://api.w.org/"' } }],
  [/GET https:\/\/ornek\.com\/wp-json\/$/, { body: wpIndex }],
  [/users\/me/, { body: { id: 3, name: "Editör", capabilities: { edit_posts: true, publish_posts: true, upload_files: true } } }],
  [/categories/, { body: [{ id: 1, name: "Genel" }, { id: 7, name: "B2B" }] }],
]);

test("wordpress probe: başarı (Link keşfi, Basic auth, kategoriler)", async () => {
  const { io, calls, logs } = mkIo(wpRoutes());
  const r = await PROVIDERS.wordpress.probe({ site_url: "ornek.com", username: "editor", app_password: WP_PASS }, io);
  assert.equal(r.ok, true);
  assert.deepEqual(r.account, { name: "Örnek Blog", url: "https://ornek.com" });
  assert.equal(r.config.api_root, "https://ornek.com/wp-json/");
  assert.equal(r.config.can_publish, true);
  assert.deepEqual(r.creds, { app_password: WP_PASS.replace(/ /g, "") });
  assert.deepEqual(r.options.category.items.map(i => i.id), ["1", "7"]);
  const me = calls.find(c => c.url.includes("users/me"));
  assert.equal(me.headers.authorization, "Basic " + btoa("editor:" + WP_PASS.replace(/ /g, "")));
  assert.ok(me.url.includes("context=edit"));
  noSecret([WP_PASS.replace(/ /g, "")], logs, r.account, r.config, r.options);
});

test("wordpress probe: auth ve header_stripped ayrımı, no_api, ?rest_route yedeği", async () => {
  const a = mkIo(wpRoutes([[/users\/me/, { status: 401, body: { code: "incorrect_password" } }]]));
  const r1 = await PROVIDERS.wordpress.probe({ site_url: "https://ornek.com", username: "u", app_password: WP_PASS }, a.io);
  assert.deepEqual(r1, { ok: false, error: "auth" });
  const b = mkIo(wpRoutes([[/users\/me/, { status: 401, body: { code: "rest_not_logged_in" } }]]));
  assert.deepEqual(await PROVIDERS.wordpress.probe({ site_url: "https://ornek.com", username: "u", app_password: WP_PASS }, b.io), { ok: false, error: "header_stripped" });
  noSecret([WP_PASS.replace(/ /g, "")], a.logs, b.logs);
  const c = mkIo(wpRoutes([[/GET https:\/\/ornek\.com\/wp-json\/$/, { body: { ...wpIndex, authentication: [] } }]]));
  assert.deepEqual(await PROVIDERS.wordpress.probe({ site_url: "https://ornek.com", username: "u", app_password: WP_PASS }, c.io), { ok: false, error: "no_api" });
  const d = mkIo(router([
    [/HEAD/, { status: 200 }],
    [/\/wp-json\/$/, { status: 404, body: "yok" }],
    [/rest_route=%2F%2F?$|rest_route=\/$|\?rest_route=%2F$/, { body: wpIndex }],
    [/rest_route=.*users/, { body: { capabilities: { edit_posts: true } } }],
    [/rest_route=.*categories/, { body: [] }],
  ]));
  const r4 = await PROVIDERS.wordpress.probe({ site_url: "https://ornek.com", username: "u", app_password: WP_PASS }, d.io);
  assert.equal(r4.ok, true);
  assert.ok(r4.config.api_root.includes("rest_route="));
  assert.ok(d.calls.some(c => c.url.includes("rest_route=%2Fwp%2Fv2%2Fusers%2Fme")));
  assert.deepEqual(await PROVIDERS.wordpress.probe({ site_url: "https://10.0.0.1", username: "u", app_password: "x" }, d.io), { ok: false, error: "ssrf" });
});

test("wordpress probe: Link başka host'a işaret ederse kullanılmaz", async () => {
  const { io, calls } = mkIo(wpRoutes([[/HEAD https:\/\/ornek\.com\/$/, { headers: { link: '<https://kotu.com/wp-json/>; rel="https://api.w.org/"' } }]]));
  const r = await PROVIDERS.wordpress.probe({ site_url: "https://ornek.com", username: "u", app_password: "p" }, io);
  assert.equal(r.ok, true);
  assert.ok(!calls.some(c => c.url.includes("kotu.com")));
});

test("wordpress push: kapak yükleme + yazı, zaman aşımında unknown_result", async () => {
  const cfg = { site_url: "https://ornek.com/", api_root: "https://ornek.com/wp-json/", username: "editor", can_upload: true, category: "7" };
  const { io, calls } = mkIo(router([
    [/images\.pexels\.com/, { body: new Uint8Array([1, 2, 3]), headers: { "content-type": "image/jpeg" } }],
    [/POST .*wp\/v2\/media\/55/, { body: { id: 55 } }],
    [/POST .*wp\/v2\/media$/, { status: 201, body: { id: 55 } }],
    [/POST .*wp\/v2\/posts/, { status: 201, body: { id: 901, link: "https://ornek.com/?p=901" } }],
  ]));
  const r = await PROVIDERS.wordpress.push(POST, { config: cfg, creds: { app_password: "gizlisifre" }, mode: "draft" }, io);
  assert.deepEqual(r, { ok: true, remote_id: "901", url: "https://ornek.com/?p=901" });
  const media = calls.find(c => /wp\/v2\/media$/.test(c.url));
  assert.ok(media.body instanceof Uint8Array);
  assert.ok(media.headers["content-disposition"].includes("cover.jpg"));
  assert.equal(calls.find(c => c.url.includes("pexels")).headers.authorization, undefined);
  const b = jbody(calls.find(c => c.url.includes("wp/v2/posts")));
  assert.equal(b.status, "draft");
  assert.equal(b.featured_media, 55);
  assert.deepEqual(b.categories, [7]);
  assert.ok(b.content.includes("<strong>kalın</strong>"));
  const t = mkIo(router([[/wp\/v2\/posts/, { throw: "timeout" }]]));
  assert.deepEqual(await PROVIDERS.wordpress.push({ ...POST, cover: null }, { config: cfg, creds: { app_password: "p" }, mode: "publish" }, t.io), { ok: false, error: "unknown_result", retry: false });
  const s = mkIo(router([[/wp\/v2\/posts/, { status: 503 }]]));
  assert.deepEqual(await PROVIDERS.wordpress.push({ ...POST, cover: null }, { config: cfg, creds: { app_password: "p" }, mode: "publish" }, s.io), { ok: false, error: "server", retry: true });
});

// ---------------------------------------------------------------- Ghost
const GHOST_ID = "6489a1b2c3d4e5f6a7b8c9d0";
const GHOST_SEC = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const GHOST_KEY = `${GHOST_ID}:${GHOST_SEC}`;
const b64uDec = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const ghostRoutes = over => router([
  ...(over || []),
  [/\/ghost\/api\/admin\/site\//, { body: { site: { title: "Ghost Blog", url: "https://blog.ornek.com/", version: "6.3" } } }],
  [/GET .*\/ghost\/api\/admin\/posts\//, { body: { posts: [] } }],
  [/POST .*\/ghost\/api\/admin\/posts\//, { status: 201, body: { posts: [{ id: "g1", url: "https://blog.ornek.com/yazi/" }] } }],
]);

test("ghost probe: başarı + JWT biçimi ve HMAC doğrulaması", async () => {
  const { io, calls, logs } = mkIo(ghostRoutes());
  const r = await PROVIDERS.ghost.probe({ admin_url: "https://blog.ornek.com/ghost/", admin_key: GHOST_KEY }, io);
  assert.equal(r.ok, true);
  assert.equal(r.config.admin_url, "https://blog.ornek.com");
  assert.equal(r.config.accept_version, "v6.0");
  assert.equal(calls[0].headers.authorization, undefined);
  const auth = calls[1].headers.authorization;
  assert.match(auth, /^Ghost [\w-]+\.[\w-]+\.[\w-]+$/);
  const [h, p, s] = auth.slice(6).split(".");
  assert.deepEqual(JSON.parse(new TextDecoder().decode(b64uDec(h))), { alg: "HS256", typ: "JWT", kid: GHOST_ID });
  const pl = JSON.parse(new TextDecoder().decode(b64uDec(p)));
  assert.deepEqual(pl, { iat: NOW / 1000, exp: NOW / 1000 + 300, aud: "/admin/" });
  const keyBytes = Uint8Array.from(GHOST_SEC.match(/../g), x => parseInt(x, 16));
  const k = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  assert.equal(await crypto.subtle.verify("HMAC", k, b64uDec(s), new TextEncoder().encode(`${h}.${p}`)), true);
  noSecret([GHOST_SEC], logs, r.account, r.config, auth);
  assert.equal(await ghostJwt("bozuk", NOW), null);
});

test("ghost probe: auth, plan, bad_input", async () => {
  const a = mkIo(ghostRoutes([[/GET .*\/admin\/posts\//, { status: 401, body: { errors: [{ type: "UnauthorizedError" }] } }]]));
  assert.deepEqual(await PROVIDERS.ghost.probe({ admin_url: "https://blog.ornek.com", admin_key: GHOST_KEY }, a.io), { ok: false, error: "auth" });
  const b = mkIo(ghostRoutes([[/GET .*\/admin\/posts\//, { status: 403 }]]));
  assert.deepEqual(await PROVIDERS.ghost.probe({ admin_url: "https://blog.ornek.com", admin_key: GHOST_KEY }, b.io), { ok: false, error: "plan" });
  assert.deepEqual(await PROVIDERS.ghost.probe({ admin_url: "https://blog.ornek.com", admin_key: "anahtar" }, b.io), { ok: false, error: "bad_input" });
  noSecret([GHOST_SEC], a.logs, b.logs);
});

test("ghost push: newsletter asla yok, status published, excerpt ≤300", async () => {
  const { io, calls } = mkIo(ghostRoutes());
  const cfg = { admin_url: "https://blog.ornek.com", accept_version: "v6.0" };
  const r = await PROVIDERS.ghost.push({ ...POST, excerpt: "a".repeat(400) }, { config: cfg, creds: { admin_key: GHOST_KEY }, mode: "publish" }, io);
  assert.deepEqual(r, { ok: true, remote_id: "g1", url: "https://blog.ornek.com/yazi/" });
  const c = calls.find(x => x.method === "POST");
  assert.equal(c.url, "https://blog.ornek.com/ghost/api/admin/posts/?source=html");
  for (const x of calls) assert.ok(!/newsletter|email_segment/i.test(x.url + (x.body || "")));
  const p = jbody(c).posts[0];
  assert.equal(p.status, "published");
  assert.ok(p.custom_excerpt.length <= 300);
  assert.equal(p.feature_image, POST.cover.url);
  assert.deepEqual(p.tags, ["b2b"]);
  const t = mkIo(router([[/POST/, { throw: "timeout" }]]));
  assert.deepEqual(await PROVIDERS.ghost.push(POST, { config: cfg, creds: { admin_key: GHOST_KEY }, mode: "draft" }, t.io), { ok: false, error: "unknown_result", retry: false });
});

// ---------------------------------------------------------------- Webflow
const WF_TOK = "wf_tok_0123456789abcdef";
const wfRoutes = over => router([
  ...(over || []),
  [/token\/introspect/, { body: { authorization: { scope: "cms:read,cms:write,sites:read", authorizedTo: { siteIds: ["site1"] } } } }],
  [/GET .*\/v2\/sites\/site1$/, { body: { displayName: "Örnek", shortName: "ornek", customDomains: [{ url: "www.ornek.com" }] } }],
  [/GET .*\/sites\/site1\/collections/, { body: { collections: [{ id: "col1", displayName: "Blog", slug: "blog" }, { id: "col2", displayName: "Ekip", slug: "ekip" }] } }],
  [/GET .*\/collections\/col1$/, { body: { fields: [{ type: "RichText", slug: "post-body", displayName: "Gövde" }, { type: "PlainText", slug: "ozet", displayName: "Özet" }, { type: "Image", slug: "kapak", displayName: "Kapak" }] } }],
  [/GET .*\/collections\/col2$/, { body: { fields: [{ type: "PlainText", slug: "ad" }] } }],
  [/POST .*items\/insert/, { status: 202, body: { items: [{ id: "it1" }] } }],
  [/POST .*items\/publish/, { body: { publishedItemIds: ["it1"], errors: [] } }],
]);

test("webflow probe: başarı, yalnız RichText'li koleksiyonlar", async () => {
  const { io, calls, logs } = mkIo(wfRoutes());
  const r = await PROVIDERS.webflow.probe({ api_token: WF_TOK }, io);
  assert.equal(r.ok, true);
  assert.deepEqual(r.account, { name: "Örnek", url: "https://www.ornek.com" });
  assert.deepEqual(r.options.collection.items.map(i => i.id), ["col1"]);
  assert.deepEqual(r.options.body_field.items, [{ id: "post-body", label: "Gövde (post-body)", parent: "col1" }]);
  assert.equal(r.options.image_field.items[0].id, "kapak");
  assert.deepEqual(r.config, { site_id: "site1", site_url: "https://www.ornek.com", collection_slugs: { col1: "blog" } });
  assert.equal(calls[0].headers.authorization, `Bearer ${WF_TOK}`);
  noSecret([WF_TOK], logs, r.account, r.config, r.options);
});

test("webflow probe: RichText alanı yoksa not_found; auth; eksik kapsam", async () => {
  const a = mkIo(wfRoutes([[/GET .*\/collections\/col1$/, { body: { fields: [{ type: "PlainText", slug: "x" }] } }]]));
  assert.deepEqual(await PROVIDERS.webflow.probe({ api_token: WF_TOK }, a.io), { ok: false, error: "not_found" });
  const b = mkIo(wfRoutes([[/token\/introspect/, { status: 401 }]]));
  assert.deepEqual(await PROVIDERS.webflow.probe({ api_token: WF_TOK }, b.io), { ok: false, error: "auth" });
  const c = mkIo(wfRoutes([[/token\/introspect/, { body: { authorization: { scope: "cms:read,sites:read", authorizedTo: { siteIds: ["site1"] } } } }]]));
  assert.deepEqual(await PROVIDERS.webflow.probe({ api_token: WF_TOK }, c.io), { ok: false, error: "forbidden" });
  noSecret([WF_TOK], a.logs, b.logs, c.logs);
});

test("webflow push: item publish, site publish asla; kısmi hata unknown_result", async () => {
  const cfg = { site_id: "site1", site_url: "https://www.ornek.com", collection_slugs: { col1: "blog" }, collection: "col1", body_field: "post-body", summary_field: "ozet", image_field: "kapak" };
  const { io, calls } = mkIo(wfRoutes());
  const r = await PROVIDERS.webflow.push({ ...POST, markdown: POST.markdown + "\n```\nkod\n```" }, { config: cfg, creds: { api_token: WF_TOK }, mode: "publish" }, io);
  assert.deepEqual(r, { ok: true, remote_id: "it1", url: "https://www.ornek.com/blog/sirketler-icin-icerik-stratejisi" });
  for (const c of calls) assert.ok(!/\/sites\/[^/]+\/publish/.test(c.url), c.url);
  const ins = jbody(calls.find(c => c.url.includes("insert")));
  assert.equal(ins.items[0].isDraft, false);
  assert.ok(!ins.items[0].fieldData["post-body"].includes("<pre"));
  assert.deepEqual(ins.items[0].fieldData.kapak, { url: POST.cover.url, alt: "Kapak" });
  assert.deepEqual(jbody(calls.find(c => c.url.includes("items/publish"))), { itemIds: ["it1"] });
  const d = mkIo(wfRoutes());
  const rd = await PROVIDERS.webflow.push(POST, { config: cfg, creds: { api_token: WF_TOK }, mode: "draft" }, d.io);
  assert.deepEqual(rd, { ok: true, remote_id: "it1", url: null });
  assert.ok(!d.calls.some(c => c.url.includes("publish")));
  assert.equal(jbody(d.calls[0]).items[0].isDraft, true);
  const e = mkIo(wfRoutes([[/POST .*items\/publish/, { body: { publishedItemIds: [], errors: ["x"] } }]]));
  assert.deepEqual(await PROVIDERS.webflow.push(POST, { config: cfg, creds: { api_token: WF_TOK }, mode: "publish" }, e.io), { ok: false, error: "unknown_result", retry: false, remote_id: "it1" });
  const t = mkIo(wfRoutes([[/POST .*items\/insert/, { throw: "timeout" }]]));
  assert.deepEqual(await PROVIDERS.webflow.push(POST, { config: cfg, creds: { api_token: WF_TOK }, mode: "publish" }, t.io), { ok: false, error: "unknown_result", retry: false });
});

// ---------------------------------------------------------------- Shopify
const SH_SEC = "shpss_gizli_0123456789";
let mintN = 0;
const shRoutes = over => router([
  ...(over || []),
  [/POST https:\/\/magaza\.myshopify\.com\/admin\/oauth\/access_token/, () => ({ body: { access_token: `shpat_yeni${++mintN}`, scope: "write_content,read_content", expires_in: 86399 } })],
  [/graphql\.json/, (u, init) => (String(init.body).includes("articleCreate")
    ? { body: { data: { articleCreate: { article: { id: "gid://shopify/Article/9", handle: "yazi", blog: { handle: "news" } }, userErrors: [] } } } }
    : { body: { data: { shop: { name: "Mağaza", primaryDomain: { url: "https://magaza.com" } }, blogs: { nodes: [{ id: "gid://shopify/Blog/1", title: "Haberler", handle: "news" }] } } } })],
]);

test("shopify probe: dev (client_credentials, scope yok) ve legacy", async () => {
  mintN = 0;
  const { io, calls, logs } = mkIo(shRoutes());
  const r = await PROVIDERS.shopify.probe({ shop: "magaza", auth_mode: "dev", client_id: "cid1", client_secret: SH_SEC, author_name: "Ayşe" }, io);
  assert.equal(r.ok, true);
  assert.deepEqual(r.account, { name: "Mağaza", url: "https://magaza.com/" });
  assert.deepEqual(r.options.blog.items, [{ id: "gid://shopify/Blog/1", label: "Haberler" }]);
  assert.deepEqual(r.creds, { client_secret: SH_SEC, access_token: "shpat_yeni1", token_exp: NOW + 86399_000 });
  assert.equal(r.config.client_id, "cid1");
  const mint = calls[0];
  assert.ok(!/scope=/.test(mint.body));
  assert.ok(mint.body.includes("grant_type=client_credentials"));
  assert.equal(calls[1].headers["x-shopify-access-token"], "shpat_yeni1");
  assert.ok(calls[1].url.endsWith("/admin/api/2026-10/graphql.json"));
  noSecret([SH_SEC, "shpat_yeni1"], logs, r.account, r.config, r.options);
  const l = mkIo(shRoutes());
  const rl = await PROVIDERS.shopify.probe({ shop: "magaza.myshopify.com", auth_mode: "legacy", access_token: "shpat_eski", author_name: "A" }, l.io);
  assert.equal(rl.ok, true);
  assert.deepEqual(rl.creds, { access_token: "shpat_eski" });
  assert.equal(l.calls.length, 1);
});

test("shopify probe: auth, GraphQL ACCESS_DENIED, blog yok, geçersiz mağaza", async () => {
  const a = mkIo(shRoutes([[/access_token/, { status: 401, body: { error: "invalid_client" } }]]));
  assert.deepEqual(await PROVIDERS.shopify.probe({ shop: "magaza", auth_mode: "dev", client_id: "c", client_secret: SH_SEC, author_name: "A" }, a.io), { ok: false, error: "auth" });
  noSecret([SH_SEC], a.logs);
  const b = mkIo(shRoutes([[/graphql/, { body: { errors: [{ extensions: { code: "ACCESS_DENIED" } }] } }]]));
  assert.deepEqual(await PROVIDERS.shopify.probe({ shop: "magaza", auth_mode: "legacy", access_token: "t", author_name: "A" }, b.io), { ok: false, error: "forbidden" });
  const c = mkIo(shRoutes([[/graphql/, { body: { data: { shop: { name: "M" }, blogs: { nodes: [] } } } }]]));
  assert.deepEqual(await PROVIDERS.shopify.probe({ shop: "magaza", auth_mode: "legacy", access_token: "t", author_name: "A" }, c.io), { ok: false, error: "not_found" });
  assert.deepEqual(await PROVIDERS.shopify.probe({ shop: "kotu.com", auth_mode: "legacy", access_token: "t", author_name: "A" }, c.io), { ok: false, error: "bad_input" });
});

test("shopify push: süresi dolan token yenilenir; 401'de bir kez yeniden üretilir, yeni creds döner", async () => {
  mintN = 0;
  const cfg = { shop: "magaza.myshopify.com", mode: "dev", client_id: "cid1", author_name: "Ayşe", store_url: "https://magaza.com/", blog_handles: { "gid://shopify/Blog/1": "news" }, blog: "gid://shopify/Blog/1" };
  const a = mkIo(shRoutes());
  const ra = await PROVIDERS.shopify.push(POST, { config: cfg, creds: { client_secret: SH_SEC, access_token: "shpat_eski", token_exp: NOW + 60_000 }, mode: "publish" }, a.io);
  assert.equal(ra.ok, true);
  assert.equal(ra.url, "https://magaza.com/blogs/news/yazi");
  assert.equal(ra.creds.access_token, "shpat_yeni1");
  assert.equal(ra.creds.client_secret, SH_SEC);
  assert.ok(a.calls[0].url.includes("access_token"));
  const art = jbody(a.calls[1]).variables.article;
  assert.equal(art.isPublished, true);
  assert.deepEqual(art.author, { name: "Ayşe" });
  assert.equal(art.blogId, "gid://shopify/Blog/1");
  let g = 0;
  const b = mkIo(shRoutes([[/graphql/, () => (++g === 1 ? { status: 401 } : { body: { data: { articleCreate: { article: { id: "gid://shopify/Article/10", handle: "y", blog: { handle: "news" } }, userErrors: [] } } } })]]));
  const rb = await PROVIDERS.shopify.push(POST, { config: cfg, creds: { client_secret: SH_SEC, access_token: "shpat_gecerli", token_exp: NOW + 3_600_000 }, mode: "draft" }, b.io);
  assert.equal(rb.ok, true);
  assert.equal(rb.url, null);
  assert.equal(rb.creds.access_token, "shpat_yeni2");
  assert.deepEqual(b.calls.map(c => c.url.includes("access_token") ? "mint" : "gql"), ["gql", "mint", "gql"]);
  assert.equal(b.calls[2].headers["x-shopify-access-token"], "shpat_yeni2");
  // userErrors → bad_input (yeni creds yine döner)
  const c = mkIo(shRoutes([[/graphql/, { body: { data: { articleCreate: { article: null, userErrors: [{ code: "BLANK", field: ["title"], message: "x" }] } } } }]]));
  const rc = await PROVIDERS.shopify.push(POST, { config: cfg, creds: { client_secret: SH_SEC, access_token: "e", token_exp: NOW }, mode: "draft" }, c.io);
  assert.equal(rc.error, "bad_input");
  assert.ok(rc.creds?.access_token);
  const t = mkIo(shRoutes([[/graphql/, { throw: "timeout" }]]));
  const rt = await PROVIDERS.shopify.push(POST, { config: { ...cfg, mode: "legacy" }, creds: { access_token: "shpat_eski" }, mode: "draft" }, t.io);
  assert.deepEqual(rt, { ok: false, error: "unknown_result", retry: false });
});

// ---------------------------------------------------------------- HubSpot
const HS_KEY = "pat-eu1-gizli-0000";
const hsRoutes = over => router([
  ...(over || []),
  [/blog-settings\/2026-09\/settings/, { body: { results: [{ id: "111", name: "Şirket Blogu", absoluteUrl: "https://ornek.com/blog", language: "tr" }] } }],
  [/blogs\/2026-09\/authors/, { body: { results: [{ id: "222", displayName: "Ayşe" }] } }],
  [/POST .*blogs\/2026-09\/posts/, { status: 201, body: { id: "333", url: "https://ornek.com/blog/yazi" } }],
]);

test("hubspot probe: başarı ve auth/kapsam/plan", async () => {
  const { io, calls, logs } = mkIo(hsRoutes());
  const r = await PROVIDERS.hubspot.probe({ api_key: HS_KEY }, io);
  assert.equal(r.ok, true);
  assert.deepEqual(r.options.blog.items, [{ id: "111", label: "Şirket Blogu" }]);
  assert.deepEqual(r.options.author.items, [{ id: "222", label: "Ayşe" }]);
  assert.deepEqual(r.config, { blog_paths: { 111: "blog" } });
  assert.equal(calls[0].headers.authorization, `Bearer ${HS_KEY}`);
  noSecret([HS_KEY], logs, r.account, r.config, r.options);
  const a = mkIo(hsRoutes([[/settings/, { status: 401 }]]));
  assert.deepEqual(await PROVIDERS.hubspot.probe({ api_key: HS_KEY }, a.io), { ok: false, error: "auth" });
  const b = mkIo(hsRoutes([[/settings/, { status: 403, body: { category: "MISSING_SCOPES" } }]]));
  assert.deepEqual(await PROVIDERS.hubspot.probe({ api_key: HS_KEY }, b.io), { ok: false, error: "forbidden" });
  const c = mkIo(hsRoutes([[/settings/, { status: 403, body: { category: "FORBIDDEN" } }]]));
  assert.deepEqual(await PROVIDERS.hubspot.probe({ api_key: HS_KEY }, c.io), { ok: false, error: "plan" });
  noSecret([HS_KEY], a.logs, b.logs, c.logs);
});

test("hubspot push: taslakta state yok, yayında PUBLISHED", async () => {
  const cfg = { blog_paths: { 111: "blog" }, blog: "111", author: "222" };
  const d = mkIo(hsRoutes());
  const rd = await PROVIDERS.hubspot.push(POST, { config: cfg, creds: { api_key: HS_KEY }, mode: "draft" }, d.io);
  assert.deepEqual(rd, { ok: true, remote_id: "333", url: "https://ornek.com/blog/yazi" });
  const bd = jbody(d.calls[0]);
  assert.ok(!("state" in bd));
  assert.equal(bd.contentGroupId, "111");
  assert.equal(bd.blogAuthorId, "222");
  assert.equal(bd.slug, "blog/sirketler-icin-icerik-stratejisi");
  assert.ok(bd.metaDescription.length > 0 && bd.metaDescription.length <= 155);
  assert.equal(bd.useFeaturedImage, true);
  const p = mkIo(hsRoutes());
  await PROVIDERS.hubspot.push({ ...POST, cover: null }, { config: cfg, creds: { api_key: HS_KEY }, mode: "publish" }, p.io);
  const bp = jbody(p.calls[0]);
  assert.equal(bp.state, "PUBLISHED");
  assert.equal(bp.useFeaturedImage, false);
  const t = mkIo(hsRoutes([[/POST/, { throw: "timeout" }]]));
  assert.deepEqual(await PROVIDERS.hubspot.push(POST, { config: cfg, creds: { api_key: HS_KEY }, mode: "draft" }, t.io), { ok: false, error: "unknown_result", retry: false });
});

// ---------------------------------------------------------------- Wix
const WIX_KEY = "IST.gizli.wix.anahtar";
const SITE = "12345678-1234-1234-1234-123456789abc";
const MEMBER = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const wixRoutes = over => router([
  ...(over || []),
  [/blog\/v3\/categories/, { body: { categories: [{ id: "cat1", label: "Genel" }] } }],
  [/members\/v1\/members/, { body: { members: [{ id: MEMBER, profile: { nickname: "Ayşe" } }] } }],
  [/site-media\/v1\/files\/import/, { body: { file: { id: "abc_123.jpg" } } }],
  [/POST .*blog\/v3\/draft-posts/, { body: { draftPost: { id: "dp1", url: { base: "https://ornek.com/", path: "/post/yazi" } } } }],
]);

test("wix probe: başarı (Bearer'sız anahtar, wix-site-id), auth, Blog yok", async () => {
  const { io, calls, logs } = mkIo(wixRoutes());
  const r = await PROVIDERS.wix.probe({ api_key: WIX_KEY, site_id: SITE }, io);
  assert.equal(r.ok, true);
  assert.deepEqual(r.options.author.items, [{ id: MEMBER, label: "Ayşe" }]);
  assert.equal(r.options.author.required, true);
  assert.equal(calls[0].headers.authorization, WIX_KEY);
  assert.equal(calls[0].headers["wix-site-id"], SITE);
  noSecret([WIX_KEY], logs, r.account, r.config, r.options);
  const a = mkIo(wixRoutes([[/categories/, { status: 401 }]]));
  assert.deepEqual(await PROVIDERS.wix.probe({ api_key: WIX_KEY, site_id: SITE }, a.io), { ok: false, error: "auth" });
  const b = mkIo(wixRoutes([[/categories/, { status: 404 }]]));
  assert.deepEqual(await PROVIDERS.wix.probe({ api_key: WIX_KEY, site_id: SITE }, b.io), { ok: false, error: "no_api" });
  const c = mkIo(wixRoutes([[/members/, { body: { members: [] } }]]));
  assert.deepEqual(await PROVIDERS.wix.probe({ api_key: WIX_KEY, site_id: SITE }, c.io), { ok: false, error: "not_found" });
  noSecret([WIX_KEY], a.logs, b.logs, c.logs);
});

test("wix push: Ricos yapısı, kapak içe aktarma, 30 sn create zaman aşımı → unknown_result", async () => {
  const cfg = { site_id: SITE, author: MEMBER, category: "cat1" };
  const { io, calls } = mkIo(wixRoutes());
  const r = await PROVIDERS.wix.push(POST, { config: cfg, creds: { api_key: WIX_KEY }, mode: "publish" }, io);
  assert.deepEqual(r, { ok: true, remote_id: "dp1", url: "https://ornek.com/post/yazi" });
  const b = jbody(calls.find(c => c.url.includes("draft-posts")));
  assert.equal(b.publish, true);
  const dp = b.draftPost;
  assert.equal(dp.memberId, MEMBER);
  assert.deepEqual(dp.categoryIds, ["cat1"]);
  assert.deepEqual(dp.media.wixMedia.image, { id: "abc_123.jpg" });
  assert.ok(dp.richContent.nodes.length >= 3);
  for (const n of dp.richContent.nodes) assert.notEqual(n.type, "TEXT");
  assert.equal(dp.richContent.nodes[0].type, "HEADING");
  assert.equal(dp.richContent.nodes[1].type, "PARAGRAPH");
  assert.equal(dp.richContent.nodes[1].nodes[0].type, "TEXT");
  const t = mkIo(wixRoutes([[/draft-posts/, { throw: "timeout" }]]));
  assert.deepEqual(await PROVIDERS.wix.push({ ...POST, cover: null }, { config: cfg, creds: { api_key: WIX_KEY }, mode: "draft" }, t.io), { ok: false, error: "unknown_result", retry: false });
  const f = mkIo(wixRoutes([[/files\/import/, { status: 500 }]]));
  const rf = await PROVIDERS.wix.push(POST, { config: cfg, creds: { api_key: WIX_KEY }, mode: "draft" }, f.io);
  assert.deepEqual(rf, { ok: true, remote_id: "dp1", url: null });
  assert.ok(!("media" in jbody(f.calls.find(c => c.url.includes("draft-posts"))).draftPost));
});

// ---------------------------------------------------------------- GitHub
const GH_TOK = "github_pat_gizli_000";
const ghRoutes = over => router([
  ...(over || []),
  [/GET https:\/\/api\.github\.com\/repos\/acme\/site$/, { body: { full_name: "acme/site", html_url: "https://github.com/acme/site", default_branch: "main", permissions: { push: true } } }],
  [/GET .*git\/ref\/heads\/main/, { body: { object: { sha: "abc123" } } }],
  [/POST .*git\/refs/, { status: 201, body: { ref: "x" } }],
  [/PUT .*contents\//, { status: 201, body: { content: { html_url: "https://github.com/acme/site/blob/main/x.md" }, commit: { sha: "c1" } } }],
  [/POST .*\/pulls/, { status: 201, body: { number: 7, html_url: "https://github.com/acme/site/pull/7" } }],
]);

test("github probe: başarı, push izni yok, auth, kötü şablon", async () => {
  const { io, calls, logs } = mkIo(ghRoutes());
  const r = await PROVIDERS.github.probe({ owner: "acme", repo: "site", token: GH_TOK, ssg: "jekyll" }, io);
  assert.equal(r.ok, true);
  assert.deepEqual(r.config, { owner: "acme", repo: "site", branch: "main", ssg: "jekyll", path_template: "_posts/{yyyy}-{mm}-{dd}-{slug}.md" });
  assert.equal(calls[0].headers.authorization, `Bearer ${GH_TOK}`);
  noSecret([GH_TOK], logs, r.account, r.config);
  const a = mkIo(ghRoutes([[/repos\/acme\/site$/, { body: { full_name: "acme/site", permissions: { push: false } } }]]));
  assert.deepEqual(await PROVIDERS.github.probe({ owner: "acme", repo: "site", token: GH_TOK, ssg: "hugo" }, a.io), { ok: false, error: "forbidden" });
  const b = mkIo(ghRoutes([[/repos\/acme\/site$/, { status: 401 }]]));
  assert.deepEqual(await PROVIDERS.github.probe({ owner: "acme", repo: "site", token: GH_TOK, ssg: "hugo" }, b.io), { ok: false, error: "auth" });
  for (const t of ["../x/{slug}.md", "/abs/{slug}.md", "posts/sabit.md"]) {
    assert.deepEqual(await PROVIDERS.github.probe({ owner: "acme", repo: "site", token: GH_TOK, ssg: "other", path_template: t }, b.io), { ok: false, error: "bad_input" }, t);
  }
  assert.deepEqual(await PROVIDERS.github.probe({ owner: "ac/me", repo: "site", token: GH_TOK }, b.io), { ok: false, error: "bad_input" });
  noSecret([GH_TOK], a.logs, b.logs);
});

test("github push: PR modu (dal, dosya, taslak PR→normal PR), Türkçe UTF-8 base64 gidiş-dönüş", async () => {
  const cfg = { owner: "acme", repo: "site", branch: "main", ssg: "jekyll", path_template: "_posts/{yyyy}-{mm}-{dd}-{slug}.md" };
  const md = "Şirket çağı: ığdır ÖĞÜ – “tırnak” 🚀\n";
  let pulls = 0;
  const { io, calls } = mkIo(ghRoutes([
    [/POST .*git\/refs/, (u, init, i) => (calls.filter(c => c.url.endsWith("git/refs")).length === 1 ? { status: 422 } : { status: 201, body: {} })],
    [/POST .*\/pulls/, () => (++pulls === 1 ? { status: 422, body: { message: "Draft pull requests are not supported" } } : { status: 201, body: { number: 7, html_url: "https://github.com/acme/site/pull/7" } })],
  ]));
  const r = await PROVIDERS.github.push({ ...POST, markdown: md }, { config: cfg, creds: { token: GH_TOK }, mode: "draft" }, io);
  assert.deepEqual(r, { ok: true, remote_id: "7", url: "https://github.com/acme/site/pull/7" });
  const refs = calls.filter(c => c.url.endsWith("git/refs")).map(jbody);
  assert.equal(refs[0].ref, "refs/heads/smc/sirketler-icin-icerik-stratejisi");
  assert.ok(refs[1].ref.startsWith("refs/heads/smc/sirketler-icin-icerik-stratejisi-"));
  assert.equal(refs[1].sha, "abc123");
  const put = calls.find(c => c.method === "PUT");
  assert.ok(put.url.endsWith("/contents/_posts/2026-11-24-sirketler-icin-icerik-stratejisi.md"));
  const pb = jbody(put);
  assert.equal(pb.branch, refs[1].ref.slice("refs/heads/".length));
  const text = new TextDecoder().decode(Uint8Array.from(atob(pb.content), c => c.charCodeAt(0)));
  assert.ok(text.startsWith("---\nlayout: post\ntitle: \"Şirketler için İçerik Stratejisi\"\n"));
  assert.ok(text.endsWith(md));
  const pr = calls.filter(c => c.url.endsWith("/pulls")).map(jbody);
  assert.equal(pr[0].draft, true);
  assert.equal(pr[1].draft, false);
  assert.equal(pr[1].base, "main");
});

test("github push: doğrudan commit (yayın) ve zaman aşımı", async () => {
  const cfg = { owner: "acme", repo: "site", branch: "main", ssg: "astro", path_template: "src/content/blog/{slug}.md" };
  const { io, calls } = mkIo(ghRoutes());
  const r = await PROVIDERS.github.push(POST, { config: cfg, creds: { token: GH_TOK }, mode: "publish" }, io);
  assert.deepEqual(r, { ok: true, remote_id: "src/content/blog/sirketler-icin-icerik-stratejisi.md", url: "https://github.com/acme/site/blob/main/x.md" });
  assert.equal(calls.length, 1);
  const text = new TextDecoder().decode(Uint8Array.from(atob(jbody(calls[0]).content), c => c.charCodeAt(0)));
  assert.ok(text.includes("pubDate: ") && text.includes("draft: false"));
  assert.equal(jbody(calls[0]).branch, "main");
  const t = mkIo(ghRoutes([[/PUT/, { throw: "timeout" }]]));
  assert.deepEqual(await PROVIDERS.github.push(POST, { config: cfg, creds: { token: GH_TOK }, mode: "publish" }, t.io), { ok: false, error: "unknown_result", retry: false });
});

// ---------------------------------------------------------------- Cloudflare Pages (GitHub deposu üstünden)
test("cloudflare probe: github alanları + base_url, config.host, push github ile aynı", async () => {
  const cf = PROVIDERS.cloudflare;
  assert.deepEqual(cf.fields.map(f => f.key), [...PROVIDERS.github.fields.map(f => f.key), "base_url"]);
  assert.equal(cf.fields.at(-1).required, false);
  assert.ok(/Direct Upload/.test(cf.notes_tr) && /Direct Upload/.test(cf.notes_en) && /GitLab/.test(cf.notes_tr) && /GitLab/.test(cf.notes_en));
  const { io, logs } = mkIo(ghRoutes());
  const r = await cf.probe({ owner: "acme", repo: "site", token: GH_TOK, ssg: "astro", base_url: "proje.pages.dev" }, io);
  assert.equal(r.ok, true);
  assert.deepEqual(r.config, { owner: "acme", repo: "site", branch: "main", ssg: "astro", path_template: "src/content/blog/{slug}.md", host: "cloudflare", pages_url: "https://proje.pages.dev/" });
  assert.deepEqual(r.account, { name: "acme/site", url: "https://proje.pages.dev/" });
  noSecret([GH_TOK], logs, r.account, r.config);
  // base_url yok → depo adresi; config.host yine cloudflare
  const b = mkIo(ghRoutes());
  const r2 = await cf.probe({ owner: "acme", repo: "site", token: GH_TOK, ssg: "hugo" }, b.io);
  assert.equal(r2.account.url, "https://github.com/acme/site");
  assert.equal(r2.config.host, "cloudflare");
  assert.equal(r2.config.pages_url, undefined);
  // geçersiz base_url → ağ isteği yok
  const c = mkIo(ghRoutes());
  assert.deepEqual(await cf.probe({ owner: "acme", repo: "site", token: GH_TOK, ssg: "hugo", base_url: "http://127.0.0.1" }, c.io), { ok: false, error: "ssrf" });
  assert.deepEqual(await cf.probe({ owner: "acme", repo: "site", token: GH_TOK, ssg: "hugo", base_url: "javascript:alert(1)" }, c.io), { ok: false, error: "bad_input" });
  assert.equal(c.calls.length, 0);
  // github hatası olduğu gibi döner
  const d = mkIo(ghRoutes([[/repos\/acme\/site$/, { status: 401 }]]));
  assert.deepEqual(await cf.probe({ owner: "acme", repo: "site", token: GH_TOK, ssg: "hugo", base_url: "proje.pages.dev" }, d.io), { ok: false, error: "auth" });
  // push: github ile aynı (yayın modu doğrudan commit)
  const p = mkIo(ghRoutes());
  const pr = await cf.push(POST, { config: { ...r.config }, creds: { token: GH_TOK }, mode: "publish" }, p.io);
  assert.deepEqual(pr, { ok: true, remote_id: "src/content/blog/sirketler-icin-icerik-stratejisi.md", url: "https://github.com/acme/site/blob/main/x.md" });
});

// ---------------------------------------------------------------- IdeaSoft
const IS_SEC = "ideasoft_secret_gizli";
const isInputs = { store: "https://magaza.com", client_id: "cid9", client_secret: IS_SEC };
let tokN = 0;
const isRoutes = over => router([
  ...(over || []),
  [/POST https:\/\/magaza\.com\/oauth\/v2\/token/, () => { tokN++; return { body: { access_token: `acc${tokN}`, refresh_token: `ref${tokN}`, expires_in: 3600 } }; }],
  [/GET .*admin-api\/blogs\?/, { body: [] }],
  [/GET .*admin-api\/blog_categories/, { body: [{ id: 3, title: "Haberler" }] }],
  [/POST .*admin-api\/blogs$/, { status: 201, body: { id: 44 } }],
]);

test("ideasoft oauth: authorizeUrl ve kod takası", async () => {
  const u = PROVIDERS.ideasoft.oauth.authorizeUrl(isInputs, { redirectUri: "https://app.ornek.co/cb", state: "st1", clientId: "cid9" });
  const p = new URL(u);
  assert.equal(p.origin + p.pathname, "https://magaza.com/panel/auth");
  assert.equal(p.searchParams.get("client_id"), "cid9");
  assert.equal(p.searchParams.get("state"), "st1");
  assert.equal(p.searchParams.get("response_type"), "code");
  assert.ok(!u.includes(IS_SEC));
  assert.equal(PROVIDERS.ideasoft.oauth.authorizeUrl({ store: "https://127.0.0.1" }, { redirectUri: "x", state: "s", clientId: "c" }), null);
  tokN = 0;
  const { io, calls, logs } = mkIo(isRoutes());
  const r = await PROVIDERS.ideasoft.oauth.exchange("kod1", isInputs, {}, { redirectUri: "https://app.ornek.co/cb" }, io);
  assert.deepEqual(r, { ok: true, creds: { client_secret: IS_SEC, access_token: "acc1", refresh_token: "ref1", token_exp: NOW + 3_600_000 }, config: { store: "magaza.com", client_id: "cid9" } });
  const body = new URLSearchParams(calls[0].body);
  assert.equal(body.get("grant_type"), "authorization_code");
  assert.equal(body.get("code"), "kod1");
  assert.equal(body.get("redirect_uri"), "https://app.ornek.co/cb");
  noSecret([IS_SEC, "acc1", "ref1"], logs);
  const bad = mkIo(isRoutes([[/oauth\/v2\/token/, { status: 400, body: { error: "invalid_grant" } }]]));
  assert.deepEqual(await PROVIDERS.ideasoft.oauth.exchange("k", isInputs, {}, { redirectUri: "https://app.ornek.co/cb" }, bad.io), { ok: false, error: "auth" });
});

test("ideasoft probe: başarı, auth, kategori yok", async () => {
  const { io, calls, logs } = mkIo(isRoutes());
  const r = await PROVIDERS.ideasoft.probe({ ...isInputs, access_token: "acc1", refresh_token: "ref1", token_exp: NOW + 3_600_000 }, io);
  assert.equal(r.ok, true);
  assert.deepEqual(r.options.category, { label_tr: "Blog kategorisi", label_en: "Blog category", required: true, items: [{ id: "3", label: "Haberler" }] });
  assert.deepEqual(r.config, { store: "magaza.com", client_id: "cid9", category_titles: { 3: "Haberler" } });
  assert.equal(calls[0].headers.authorization, "Bearer acc1");
  noSecret([IS_SEC, "acc1", "ref1"], logs, r.account, r.config, r.options);
  const a = mkIo(isRoutes([[/admin-api\/blogs\?/, { status: 401 }]]));
  assert.deepEqual(await PROVIDERS.ideasoft.probe({ ...isInputs, access_token: "acc1" }, a.io), { ok: false, error: "auth" });
  const b = mkIo(isRoutes([[/blog_categories/, { body: [] }]]));
  assert.deepEqual(await PROVIDERS.ideasoft.probe({ ...isInputs, access_token: "acc1" }, b.io), { ok: false, error: "not_found" });
});

test("ideasoft push: süre dolunca refresh, dönen creds döndürülür (başarısızda da)", async () => {
  const cfg = { store: "magaza.com", client_id: "cid9", category: "3", category_titles: { 3: "Haberler" } };
  tokN = 10;
  const { io, calls } = mkIo(isRoutes([[/images\.pexels\.com/, { body: new Uint8Array([9, 9]), headers: { "content-type": "image/png" } }]]));
  const r = await PROVIDERS.ideasoft.push(POST, { config: cfg, creds: { client_secret: IS_SEC, access_token: "eski", refresh_token: "ref_eski", token_exp: NOW + 60_000 }, mode: "publish" }, io);
  assert.deepEqual(r, { ok: true, remote_id: "44", url: null, creds: { client_secret: IS_SEC, access_token: "acc11", refresh_token: "ref11", token_exp: NOW + 3_600_000 } });
  const rb = new URLSearchParams(calls[0].body);
  assert.equal(rb.get("grant_type"), "refresh_token");
  assert.equal(rb.get("refresh_token"), "ref_eski");
  const create = calls.find(c => /admin-api\/blogs$/.test(c.url));
  assert.equal(create.headers.authorization, "Bearer acc11");
  const b = jbody(create);
  assert.equal(b.status, 1);
  assert.equal(b.blockVisibility, 1);
  assert.deepEqual(b.categories, [{ id: 3, title: "Haberler" }]);
  assert.ok(b.excerpt && b.title);
  assert.equal(b.attachment, "data:image/png;base64,CQk=");
  // 401 → refresh → yeniden create başarısız (500): yine de yeni creds döner
  tokN = 20;
  let n = 0;
  const f = mkIo(isRoutes([[/POST .*admin-api\/blogs$/, () => (++n === 1 ? { status: 401 } : { status: 500 })]]));
  const rf = await PROVIDERS.ideasoft.push({ ...POST, cover: null }, { config: cfg, creds: { client_secret: IS_SEC, access_token: "eski", refresh_token: "ref_eski", token_exp: NOW + 3_600_000 }, mode: "draft" }, f.io);
  assert.equal(rf.ok, false);
  assert.equal(rf.error, "server");
  assert.equal(rf.creds.refresh_token, "ref21");
  assert.equal(jbody(f.calls.find(c => /blogs$/.test(c.url))).status, 0);
  const t = mkIo(isRoutes([[/POST .*admin-api\/blogs$/, { throw: "timeout" }]]));
  assert.deepEqual(await PROVIDERS.ideasoft.push({ ...POST, cover: null }, { config: cfg, creds: { client_secret: IS_SEC, access_token: "a", token_exp: NOW + 3_600_000 }, mode: "draft" }, t.io), { ok: false, error: "unknown_result", retry: false });
});

// ---------------------------------------------------------------- WordPress.com
test("wpcom: env yoksa not_ready; exchange, probe, push", async () => {
  const r0 = await PROVIDERS.wpcom.oauth.exchange("k", {}, {}, { redirectUri: "https://app/cb" }, mkIo([]).io);
  assert.deepEqual(r0, { ok: false, error: "not_ready" });
  assert.equal(PROVIDERS.wpcom.oauth.authorizeUrl({}, { redirectUri: "https://app/cb", state: "s" }), null);
  assert.ok(PROVIDERS.wpcom.oauth.authorizeUrl({}, { redirectUri: "https://app/cb", state: "s", clientId: "123" }).startsWith("https://public-api.wordpress.com/oauth2/authorize?"));
  const env = { WPCOM_CLIENT_ID: "123", WPCOM_CLIENT_SECRET: "wpsec" };
  const { io, calls, logs } = mkIo(router([
    [/oauth2\/token/, { body: { access_token: "wptok", blog_id: "555", blog_url: "https://ornek.wordpress.com" } }],
    [/GET .*sites\/555$/, { body: { name: "Blogum", URL: "https://ornek.wordpress.com" } }],
    [/posts\/new/, { body: { ID: 12, URL: "https://ornek.wordpress.com/yazi" } }],
  ]), env);
  const ex = await PROVIDERS.wpcom.oauth.exchange("kod", {}, {}, { redirectUri: "https://app/cb" }, io);
  assert.deepEqual(ex, { ok: true, creds: { access_token: "wptok" }, config: { blog_id: "555", blog_url: "https://ornek.wordpress.com/" } });
  const pr = await PROVIDERS.wpcom.probe({ access_token: "wptok", blog_id: "555" }, io);
  assert.equal(pr.ok, true);
  assert.equal(pr.account.name, "Blogum");
  const ps = await PROVIDERS.wpcom.push(POST, { config: { blog_id: "555" }, creds: { access_token: "wptok" }, mode: "draft" }, io);
  assert.deepEqual(ps, { ok: true, remote_id: "12", url: "https://ornek.wordpress.com/yazi" });
  assert.equal(jbody(calls.at(-1)).status, "draft");
  noSecret(["wpsec", "wptok"], logs, pr.account, pr.config);
  const a = mkIo(router([[/sites\/555/, { status: 403 }]]));
  assert.deepEqual(await PROVIDERS.wpcom.probe({ access_token: "x", blog_id: "555" }, a.io), { ok: false, error: "forbidden" });
});

// ---------------------------------------------------------------- genel: hatalarda ve loglarda sır yok
test("hiçbir hata sonucunda ve logda anahtar/token yok", async () => {
  const secrets = [WP_PASS.replace(/ /g, ""), GHOST_SEC, WF_TOK, SH_SEC, HS_KEY, WIX_KEY, GH_TOK, IS_SEC, "acc_gizli", "ref_gizli"];
  const all = [];
  const bad = () => ({ status: 401, body: { message: "bad", echo: "yok" } });
  const runs = [
    io => PROVIDERS.wordpress.probe({ site_url: "https://ornek.com", username: "u", app_password: WP_PASS }, io),
    io => PROVIDERS.ghost.probe({ admin_url: "https://blog.ornek.com", admin_key: GHOST_KEY }, io),
    io => PROVIDERS.webflow.probe({ api_token: WF_TOK }, io),
    io => PROVIDERS.shopify.probe({ shop: "magaza", auth_mode: "dev", client_id: "c", client_secret: SH_SEC, author_name: "A" }, io),
    io => PROVIDERS.hubspot.probe({ api_key: HS_KEY }, io),
    io => PROVIDERS.wix.probe({ api_key: WIX_KEY, site_id: SITE }, io),
    io => PROVIDERS.github.probe({ owner: "acme", repo: "site", token: GH_TOK, ssg: "hugo" }, io),
    io => PROVIDERS.ideasoft.probe({ ...isInputs, access_token: "acc_gizli" }, io),
    io => PROVIDERS.wordpress.push(POST, { config: { api_root: "https://ornek.com/wp-json/", username: "u" }, creds: { app_password: WP_PASS }, mode: "draft" }, io),
    io => PROVIDERS.webflow.push(POST, { config: { collection: "col1", body_field: "b" }, creds: { api_token: WF_TOK }, mode: "publish" }, io),
    io => PROVIDERS.hubspot.push(POST, { config: { blog: "1", author: "2" }, creds: { api_key: HS_KEY }, mode: "publish" }, io),
    io => PROVIDERS.wix.push(POST, { config: { site_id: SITE, author: MEMBER }, creds: { api_key: WIX_KEY }, mode: "publish" }, io),
    io => PROVIDERS.github.push(POST, { config: { owner: "acme", repo: "site", branch: "main", ssg: "hugo", path_template: "content/posts/{slug}.md" }, creds: { token: GH_TOK }, mode: "publish" }, io),
  ];
  for (const run of runs) {
    const { io, logs } = mkIo(() => bad());
    const r = await run(io);
    assert.equal(r.ok, false);
    all.push(r, ...logs);
    const t = mkIo(() => ({ throw: "network" }));
    all.push(await run(t.io), ...t.logs);
  }
  // Ghost / IdeaSoft push sırasında oluşan JWT ve token'lar da sonuçta görünmemeli
  const g = mkIo(() => ({ status: 500 }));
  all.push(await PROVIDERS.ghost.push(POST, { config: { admin_url: "https://blog.ornek.com" }, creds: { admin_key: GHOST_KEY }, mode: "draft" }, g.io), ...g.logs);
  const s = mkIo(() => ({ status: 500 }));
  all.push(await PROVIDERS.shopify.push(POST, { config: { shop: "magaza.myshopify.com", mode: "legacy", blog: "gid://shopify/Blog/1" }, creds: { access_token: "acc_gizli" }, mode: "draft" }, s.io), ...s.logs);
  noSecret(secrets, ...all);
  for (const x of all) if (typeof x === "object") assert.ok(Object.keys(ERROR_HELP).includes(x.error), x.error);
});
