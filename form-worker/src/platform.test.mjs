// node --test src/platform.test.mjs — PR6 (#201): marka/ajans nişleri, ajans client_names, 5 aşama kampanya sayımı,
// GET /app/niches, GET /app/matches, GET/PUT /app/notify, PUT CORS ve finishOAuth log metni (errText)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "cloudflare:sockets") return { url: "data:text/javascript,export const connect=()=>{throw new Error('sockets')}", shortCircuit: true };
    if (spec === "cloudflare:email") return { url: "data:text/javascript,export class EmailMessage{}", shortCircuit: true };
    return next(spec, ctx);
  },
});

const { platform } = await import("./platform.js");
const { errText } = await import("./oauth.js");

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const SCHEMA = read("../schema.sql");
const MIGRATIONS = ["0001_metrics", "0002_oauth", "0003_sync", "0004_sync_changes"].map(n => read(`../migrations/${n}.sql`));
const NOTIFY_SQL = read("../migrations/0005_notify.sql");

function d1(db) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })) }),
    first: async () => { const r = db.prepare(sql).get(...args); return r ? { ...r } : null; },
    run: async () => { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes), last_row_id: Number(i.lastInsertRowid) } }; },
  });
  const batch = async list => { db.exec("BEGIN"); try { const out = []; for (const s of list) out.push(await s.run()); db.exec("COMMIT"); return out; } catch (e) { db.exec("ROLLBACK"); throw e; } };
  return { prepare: sql => stmt(sql), batch, exec: async sql => db.exec(sql) };
}

// notify=false: 0005 uygulanmamış canlı D1 gibi (users.notify sütunu yok)
function freshDb(notify = true) {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  for (const m of MIGRATIONS) db.exec(m);
  if (notify) db.exec(NOTIFY_SQL);
  return db;
}

const ORIGIN = "http://localhost:8788";
function api(env, origin = ORIGIN) {
  return async (method, path, { token, body, ip = "10.0.0.1" } = {}) => {
    const headers = { "cf-connecting-ip": ip, "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const req = new Request(`https://forms.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const res = await platform(req, new URL(req.url), env, origin, async () => {});
    return { status: res.status, body: await res.json() };
  };
}

async function setup(db = freshDb()) {
  const env = { DB: d1(db), DEV_ORIGINS: ORIGIN, PBKDF2_ITER: "10000", METRICS_ENABLED: "1" };
  const call = api(env);
  let ip = 0;
  const join = async (role, email, name = email.split("@")[0]) => {
    const r = await call("POST", "/auth/register", { ip: `10.0.1.${++ip}`, body: { name, email, password: "sifre-12345", role, consent: true, hp: "", t: 2000 } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return { token: r.body.token, id: r.body.user.id };
  };
  const profile = async (who, p, name) => {
    const r = await call("POST", "/app/profile", { token: who.token, body: { ...(name && { name }), profile: p } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.body.user.profile;
  };
  const site = id => db.prepare("SELECT site FROM users WHERE id = ?").get(id).site;
  return { db, env, call, join, profile, site };
}

// Doğrudan kayıt: sayım ve sınır testlerinde çok sayıda influencer için (kayıt akışının IP sınırına takılmadan)
function addInfluencer(db, site, email, profile) {
  return Number(db.prepare("INSERT INTO users (site, email, name, role, pass, profile) VALUES (?, ?, ?, 'influencer', 'x', ?)")
    .run(site, email, email.split("@")[0], JSON.stringify(profile)).lastInsertRowid);
}

const ok200 = (r, msg) => assert.equal(r.status, 200, msg || JSON.stringify(r.body));
const fails = (r, status, error) => { assert.equal(r.status, status, JSON.stringify(r.body)); assert.deepEqual(r.body, { ok: false, error }); };

// 1) Nişler üç rolde de saklanır ve profil yanıtlarında döner

const NICHE_IN = ["  moda ", "moda", "", "x".repeat(50), "spor", "oyun", "ev", "tasarım", "seyahat", 7];
const NICHE_OUT = ["moda", "x".repeat(40), "spor", "oyun", "ev"];

for (const role of ["brand", "agency", "influencer"]) {
  test(`profil nişleri (${role}): kırpılır, tekilleşir, en çok 5; profile ve auth/me'de döner`, async () => {
    const { call, join, profile } = await setup();
    const u = await join(role, `${role}@ornek.com`);
    assert.deepEqual((await profile(u, { niches: NICHE_IN })).niches, NICHE_OUT);
    const p = await call("GET", "/app/profile", { token: u.token });
    ok200(p);
    assert.deepEqual(p.body.user.profile.niches, NICHE_OUT);
    const m = await call("GET", "/auth/me", { token: u.token });
    ok200(m);
    assert.deepEqual(m.body.user.profile.niches, NICHE_OUT);
    // Dizi olmayan değer boş listeye iner; alan gönderilmezse de silinir (profil bütün olarak değişir)
    assert.deepEqual((await profile(u, { niches: "moda" })).niches, []);
    await profile(u, { niches: ["spor"] });
    assert.deepEqual((await profile(u, { bio: "x" })).niches, []);
  });
}

// 2) Ajans client_names

test("ajans client_names: kırpma, tr büyük-küçük harf tekilliği, en çok 20, clients türer", async () => {
  const { call, join, profile } = await setup();
  const ag = await join("agency", "ajans@ornek.com");
  const many = Array.from({ length: 30 }, (_, i) => `Müşteri ${i}`);
  const p = await profile(ag, { clients: 999, client_names: ["  Acme Gıda  ", "İSTANBUL A.Ş.", "istanbul a.ş.", "", "   ", { x: 1 }, null, 42, "y".repeat(100), ...many] });
  assert.equal(p.client_names.length, 20);
  assert.deepEqual(p.client_names.slice(0, 4), ["Acme Gıda", "İSTANBUL A.Ş.", "42", "y".repeat(80)]);
  assert.equal(p.client_names[4], "Müşteri 0");
  assert.equal(p.client_names[19], "Müşteri 15");
  assert.equal(p.clients, 20);
  // Sahibinin profil yanıtlarında döner
  const g = await call("GET", "/app/profile", { token: ag.token });
  assert.deepEqual(g.body.user.profile.client_names, p.client_names);
  const me = await call("GET", "/auth/me", { token: ag.token });
  assert.equal(me.body.user.profile.clients, 20);
  // Boş dizi + eski sayı: sayı korunur, client_names anahtarı yazılmaz (eski giriş gibi)
  const e = await profile(ag, { clients: 5, client_names: [] });
  assert.equal(e.clients, 5);
  assert.equal(Object.hasOwn(e, "client_names"), false);
  for (const [input, want] of [[{ clients: 7, client_names: ["", "  ", null] }, 7], [{ clients: "7", client_names: [] }, 7]]) {
    const q = await profile(ag, input);
    assert.equal(q.clients, want, JSON.stringify(input));
    assert.equal(Object.hasOwn(q, "client_names"), false, JSON.stringify(input));
  }
  // Boş dizi, eski sayı yok ya da 0/geçersiz: liste boş, clients 0
  for (const input of [{ clients: 0, client_names: [] }, { client_names: [] }, { clients: "abc", client_names: [] }, { clients: 20000, client_names: [] }]) {
    const q = await profile(ag, input);
    assert.deepEqual([q.client_names, q.clients], [[], 0], JSON.stringify(input));
  }
});

test("ajans client_names: ad varken gelen clients yok sayılır, clients = ad sayısı", async () => {
  const { join, profile } = await setup();
  const ag = await join("agency", "ajans@ornek.com");
  const p = await profile(ag, { clients: 12, client_names: ["Acme", "Beta"] });
  assert.deepEqual([p.client_names, p.clients], [["Acme", "Beta"], 2]);
  const q = await profile(ag, { clients: 0, client_names: ["Acme"] });
  assert.deepEqual([q.client_names, q.clients], [["Acme"], 1]);
});

test("ajans eski sayı main paneliyle art arda kayıtlarda korunur; ad eklenince ad sayısı, adlar silinince 0", async () => {
  const { call, join, profile } = await setup();
  const ag = await join("agency", "ajans@ornek.com");
  // main panel.html profil kaydı: hasNames = Array.isArray(p.client_names); cCount(tags) = tags.length || (hasNames ? 0 : Number(p.clients) || 0)
  const panelSave = async (extra, tags) => {
    const p = (await call("GET", "/app/profile", { token: ag.token })).body.user.profile;
    const hasNames = Array.isArray(p.client_names);
    return { saved: await profile(ag, { ...extra, client_names: tags, clients: tags.length || (hasNames ? 0 : Number(p.clients) || 0) }), hasNames };
  };
  await profile(ag, { clients: 12 });
  for (const bio of ["ilk", "ikinci", "üçüncü"]) {
    const { saved, hasNames } = await panelSave({ bio }, []);
    assert.equal(saved.clients, 12, bio);
    assert.equal(hasNames, false, bio); // panelin "şimdilik sayısı kaydedildi" notu doğru kalır
  }
  const a = (await panelSave({ bio: "ad" }, ["Acme", "Beta", "Gama"])).saved;
  assert.deepEqual([a.client_names, a.clients], [["Acme", "Beta", "Gama"], 3]);
  const z = (await panelSave({ bio: "sil" }, [])).saved;
  assert.deepEqual([z.client_names, z.clients], [[], 0]);
});

test("ajans eski clients girişi bozulmaz: client_names dizi değilse sayı saklanır, client_names anahtarı yok", async () => {
  const { join, profile } = await setup();
  const ag = await join("agency", "ajans@ornek.com");
  for (const [input, want] of [[{ clients: 12 }, 12], [{ clients: "7" }, 7], [{ clients: "abc" }, null], [{ clients: 20000 }, null], [{ clients: -1 }, null], [{ clients: 3, client_names: "Acme" }, 3], [{}, null]]) {
    const p = await profile(ag, input);
    assert.equal(p.clients, want, JSON.stringify(input));
    assert.equal(Object.hasOwn(p, "client_names"), false, JSON.stringify(input));
  }
});

for (const role of ["brand", "influencer"]) {
  test(`${role} client_names ve clients saklamaz`, async () => {
    const { join, profile } = await setup();
    const u = await join(role, `${role}@ornek.com`);
    const p = await profile(u, { clients: 4, client_names: ["Acme"], niches: ["moda"] });
    assert.equal(Object.hasOwn(p, "client_names"), false);
    assert.equal(Object.hasOwn(p, "clients"), false);
  });
}

test("ajans müşteri adları başka rollere sızmaz (kampanya, başvuru, influencer, eşleşme yanıtları)", async () => {
  const { call, join, profile } = await setup();
  const SECRET = "GizliMüşteri-XYZ";
  const ag = await join("agency", "ajans@ornek.com");
  await profile(ag, { niches: ["moda"], company: "Ajans A", client_names: [SECRET] });
  const br = await join("brand", "marka@ornek.com");
  await profile(br, { niches: ["moda"] });
  const inf = await join("influencer", "inf@ornek.com", "Inf Bir");
  await profile(inf, { niches: ["moda"], platforms: [{ platform: "instagram", handle: "inf1", followers: 1000 }], listed: true });
  const c = await call("POST", "/app/campaigns", { token: ag.token, body: { title: "Kış", niches: ["moda"], platforms: ["instagram"] } });
  ok200(c);
  const id = c.body.campaign.id;
  const inv = await call("POST", `/app/campaigns/${id}/invite`, { token: ag.token, body: { user_id: inf.id } });
  ok200(inv);
  const seen = [
    await call("GET", "/app/campaigns", { token: inf.token }),
    await call("GET", `/app/campaigns/${id}`, { token: inf.token }),
    await call("GET", "/app/applications", { token: inf.token }),
    await call("POST", `/app/applications/${inv.body.application.id}`, { token: inf.token, body: { status: "accepted" } }),
    await call("GET", "/app/campaigns", { token: ag.token }),
    await call("GET", `/app/campaigns/${id}`, { token: ag.token }),
    await call("GET", "/app/influencers", { token: br.token }),
    await call("GET", "/app/matches", { token: br.token }),
    await call("GET", "/app/matches", { token: ag.token }),
  ];
  for (const r of seen) {
    ok200(r);
    assert.equal(JSON.stringify(r.body).includes(SECRET), false, JSON.stringify(r.body));
  }
  // Influencer kampanyayı ve ajans adını görür, müşteri listesini görmez
  assert.equal(seen[0].body.campaigns[0].owner, "ajans");
});

// 3) Kampanya sayımı: 5 aşama + çubuk dışı

test("kampanya sayımı gerçek akışla: her durumdan bir başvuru doğru aşamaya düşer", async () => {
  const { call, join, profile } = await setup();
  const br = await join("brand", "marka@ornek.com");
  const c = await call("POST", "/app/campaigns", { token: br.token, body: { title: "Yaz", niches: ["moda"] } });
  const cid = c.body.campaign.id;
  const infs = [];
  for (let i = 1; i <= 8; i++) {
    const u = await join("influencer", `inf${i}@ornek.com`, `Inf ${i}`);
    await profile(u, { niches: ["moda"], listed: true });
    infs.push(u);
  }
  const move = async (who, appId, body) => ok200(await call("POST", `/app/applications/${appId}`, { token: who.token, body }));
  const applyAs = async u => { const r = await call("POST", `/app/campaigns/${cid}/apply`, { token: u.token, body: { message: "merhaba" } }); ok200(r); return r.body.application.id; };
  const inviteTo = async u => { const r = await call("POST", `/app/campaigns/${cid}/invite`, { token: br.token, body: { user_id: u.id } }); ok200(r); return r.body.application.id; };
  const submit = (u, a) => move(u, a, { status: "submitted", content_url: "https://example.com/x" });
  const [invited, pending, accepted, revision, submitted, approved, rejected, declined] = infs;
  await inviteTo(invited);
  await applyAs(pending);
  let a = await applyAs(accepted); await move(br, a, { status: "accepted" });
  a = await applyAs(revision); await move(br, a, { status: "accepted" }); await submit(revision, a); await move(br, a, { status: "revision", note: "renk" });
  a = await applyAs(submitted); await move(br, a, { status: "accepted" }); await submit(submitted, a);
  a = await applyAs(approved); await move(br, a, { status: "accepted" }); await submit(approved, a); await move(br, a, { status: "approved" });
  a = await applyAs(rejected); await move(br, a, { status: "rejected" });
  a = await inviteTo(declined); await move(declined, a, { status: "declined" });
  const l = await call("GET", "/app/campaigns", { token: br.token });
  ok200(l);
  const k = l.body.campaigns[0];
  const pick = ({ applications, invited, pending, active, submitted, approved, rejected, declined }) => ({ applications, invited, pending, active, submitted, approved, rejected, declined });
  assert.deepEqual(pick(k), { applications: 8, invited: 1, pending: 1, active: 2, submitted: 1, approved: 1, rejected: 1, declined: 1 });
  // Ara toplam sütunları dışarı çıkmaz
  assert.equal(Object.hasOwn(k, "accepted"), false);
  assert.equal(Object.hasOwn(k, "revision"), false);
});

test("kampanya sayımı farklı sayılarla: her alan kendi durumunu sayar, boş kampanya 0", async () => {
  const { db, call, join, site } = await setup();
  const br = await join("brand", "marka@ornek.com");
  const other = await join("brand", "marka2@ornek.com");
  const mk = async (who, title) => (await call("POST", "/app/campaigns", { token: who.token, body: { title } })).body.campaign.id;
  const b = await mk(br, "B"), empty = await mk(br, "Boş"), foreign = await mk(other, "Başkası");
  const s = site(br.id);
  const counts = { invited: 1, pending: 2, accepted: 3, revision: 5, submitted: 4, approved: 6, rejected: 7, declined: 9 };
  let n = 0;
  const ins = db.prepare("INSERT INTO applications (campaign_id, user_id, status) VALUES (?, ?, ?)");
  for (const [status, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) ins.run(b, addInfluencer(db, s, `d${++n}@ornek.com`, {}), status);
  }
  // Başka sahibin kampanyasındaki başvurular bu sahibin sayımına girmez
  ins.run(foreign, addInfluencer(db, s, "yabanci@ornek.com", {}), "approved");
  const l = await call("GET", "/app/campaigns", { token: br.token });
  ok200(l);
  const byId = Object.fromEntries(l.body.campaigns.map(x => [x.id, x]));
  assert.deepEqual(Object.keys(byId).map(Number).sort((x, y) => x - y), [b, empty]);
  const pick = ({ applications, invited, pending, active, submitted, approved, rejected, declined }) => ({ applications, invited, pending, active, submitted, approved, rejected, declined });
  assert.deepEqual(pick(byId[b]), { applications: 37, invited: 1, pending: 2, active: 8, submitted: 4, approved: 6, rejected: 7, declined: 9 });
  assert.deepEqual(pick(byId[empty]), { applications: 0, invited: 0, pending: 0, active: 0, submitted: 0, approved: 0, rejected: 0, declined: 0 });
  // Influencer listesi değişmez: sayım alanı yok
  const inf = await join("influencer", "inf@ornek.com");
  const il = await call("GET", "/app/campaigns", { token: inf.token });
  ok200(il);
  for (const x of il.body.campaigns) for (const f of ["applications", "invited", "active", "approved"]) assert.equal(Object.hasOwn(x, f), false);
});

// 4a) GET /app/niches

test("GET /app/niches: üç rol aynı 17 öğeyi alır, anahtarlar panel NICHES ile birebir; token yoksa 401", async () => {
  const { call, join } = await setup();
  let first;
  for (const role of ["brand", "agency", "influencer"]) {
    const u = await join(role, `${role}@ornek.com`);
    const r = await call("GET", "/app/niches", { token: u.token });
    ok200(r);
    assert.equal(r.body.niches.length, 17);
    for (const x of r.body.niches) {
      assert.deepEqual(Object.keys(x), ["key", "en"]);
      assert.equal(typeof x.key, "string");
      assert.ok(x.key && x.en, JSON.stringify(x));
    }
    if (first) assert.deepEqual(r.body.niches, first);
    first = r.body.niches;
  }
  assert.deepEqual(first[0], { key: "cilt bakımı", en: "skincare" });
  const panel = new URL("../../sites/brandcorner.co/panel.html", import.meta.url);
  if (existsSync(panel)) {
    const m = readFileSync(panel, "utf8").match(/var NICHES = (\[[^\]]*\]);/);
    assert.ok(m, "panel.html'de var NICHES bulunamadı");
    assert.deepEqual(first.map(x => x.key), JSON.parse(m[1]));
  }
  fails(await call("GET", "/app/niches"), 401, "auth");
});

// 4b) GET /app/matches

async function matchWorld() {
  const w = await setup();
  const { call, join, profile } = w;
  w.br = await join("brand", "marka@ornek.com");
  await profile(w.br, { niches: ["moda", "Spor"] });
  w.br2 = await join("brand", "marka2@ornek.com");
  await profile(w.br2, { niches: ["moda"] });
  w.ag = await join("agency", "ajans@ornek.com");
  await profile(w.ag, { niches: ["teknoloji"] });
  const inf = async (n, p) => { const u = await join("influencer", `i${n}@ornek.com`, `Inf ${n}`); await profile(u, { bio: `bio ${n}`, city: "İzmir", ...p }); return u; };
  const pl = (platform, n) => [{ platform, handle: `h${n}`, followers: 1000 * n }];
  w.i1 = await inf(1, { niches: ["moda"], platforms: pl("instagram", 1), listed: true });
  w.i2 = await inf(2, { niches: ["Moda", "spor"], platforms: pl("tiktok", 2), listed: true });
  w.i3 = await inf(3, { niches: ["spor"], platforms: pl("instagram", 3), listed: true });
  w.i4 = await inf(4, { niches: ["moda", "spor"], platforms: pl("instagram", 4), listed: false });
  w.i5 = await inf(5, { niches: ["oyun"], platforms: pl("instagram", 5), listed: true });
  w.i6 = await inf(6, { niches: ["teknoloji"], platforms: pl("youtube", 6), listed: true });
  const mk = async (who, body) => { const r = await call("POST", "/app/campaigns", { token: who.token, body }); ok200(r); return r.body.campaign.id; };
  w.c1 = await mk(w.br, { title: "C1", niches: ["moda"], platforms: ["instagram"] });
  w.cBare = await mk(w.br, { title: "Nişsiz", platforms: ["instagram"] });
  w.c2 = await mk(w.br2, { title: "Başka marka", niches: ["moda"] });
  ok200(await call("POST", `/app/campaigns/${w.c1}/invite`, { token: w.br.token, body: { user_id: w.i1.id } }));
  ok200(await call("POST", `/app/campaigns/${w.c2}/invite`, { token: w.br2.token, body: { user_id: w.i2.id } }));
  w.get = (who, qs = "") => call("GET", `/app/matches${qs}`, { token: who && who.token });
  return w;
}

const ids = r => r.body.influencers.map(x => x.id);
const scores = r => r.body.influencers.map(x => x.match);

test("matches (marka, profil nişleri): sıra match↓ sonra id↓, yalnız açık alanlar, kendi geçmişi", async () => {
  const w = await matchWorld();
  const r = await w.get(w.br);
  ok200(r);
  assert.equal(r.body.campaign_id, null);
  assert.equal(r.body.reason, null);
  assert.deepEqual(r.body.basis, { niches: ["moda", "Spor"], platforms: [] });
  assert.deepEqual(ids(r), [w.i2.id, w.i3.id, w.i1.id]);
  assert.deepEqual(scores(r), [100, 70, 70]);
  for (const x of r.body.influencers) assert.deepEqual(Object.keys(x).sort(), ["bio", "city", "history", "id", "match", "name", "niches", "platforms"]);
  const i1 = r.body.influencers.find(x => x.id === w.i1.id);
  assert.deepEqual([i1.name, i1.bio, i1.city, i1.niches, i1.platforms], ["Inf 1", "bio 1", "İzmir", ["moda"], [{ platform: "instagram", handle: "h1", followers: 1000 }]]);
  // Geçmiş yalnız bu sahibin kampanyalarından; başka markanın daveti görünmez
  assert.deepEqual(i1.history, [{ campaign_id: w.c1, status: "invited" }]);
  assert.deepEqual(r.body.influencers.find(x => x.id === w.i2.id).history, []);
  // E-posta, token, listed ya da şifre yok
  const s = JSON.stringify(r.body);
  assert.equal(s.includes("@"), false, s);
  for (const f of ["email", "token", "listed", "pass"]) assert.equal(s.includes(`"${f}"`), false, f);
});

test("matches (marka, ?campaign): kampanya nişleri ve platformları dayanak, platform süzgeci, kapalı kampanya da olur", async () => {
  const w = await matchWorld();
  let r = await w.get(w.br, `?campaign=${w.c1}`);
  ok200(r);
  assert.equal(r.body.campaign_id, w.c1);
  assert.deepEqual(r.body.basis, { niches: ["moda"], platforms: ["instagram"] });
  assert.deepEqual(ids(r), [w.i1.id, w.i2.id]);
  assert.deepEqual(scores(r), [100, 60]);
  r = await w.get(w.br, `?campaign=${w.c1}&platform=tiktok`);
  assert.deepEqual(ids(r), [w.i2.id]);
  r = await w.get(w.br, "?platform=instagram");
  assert.deepEqual(ids(r), [w.i3.id, w.i1.id]);
  ok200(await w.call("POST", `/app/campaigns/${w.c1}`, { token: w.br.token, body: { status: "closed" } }));
  r = await w.get(w.br, `?campaign=${w.c1}`);
  ok200(r);
  assert.deepEqual(ids(r), [w.i1.id, w.i2.id]);
});

test("matches (ajans): kendi profil nişleri", async () => {
  const w = await matchWorld();
  const r = await w.get(w.ag);
  ok200(r);
  assert.deepEqual(ids(r), [w.i6.id]);
  assert.deepEqual(scores(r), [100]);
  assert.deepEqual(r.body.influencers[0].history, []);
});

test("matches hata yolları: influencer 403, token yok 401, başkasının kampanyası 404, bozuk sorgu 400", async () => {
  const w = await matchWorld();
  fails(await w.get(w.i1), 403, "forbidden");
  fails(await w.get(w.i1, "?campaign=abc&limit=0"), 403, "forbidden");
  fails(await w.get(null), 401, "auth");
  fails(await w.get(w.br, `?campaign=${w.c2}`), 404, "not_found");
  fails(await w.get(w.ag, `?campaign=${w.c1}`), 404, "not_found");
  fails(await w.get(w.br, "?campaign=99999"), 404, "not_found");
  for (const v of ["abc", "0", "1.5", "-1", ""]) fails(await w.get(w.br, `?campaign=${v}`), 400, "campaign");
  for (const v of ["myspace", "", "Instagram"]) fails(await w.get(w.br, `?platform=${v}`), 400, "platform");
  for (const v of ["0", "x", "2.5", "", "-3"]) fails(await w.get(w.br, `?limit=${v}`), 400, "limit");
});

test("matches no_niches: profilinde niş olmayan sahip ve nişsiz kampanya boş liste alır", async () => {
  const w = await matchWorld();
  const bare = await w.join("brand", "bos@ornek.com");
  let r = await w.get(bare);
  ok200(r);
  assert.deepEqual(r.body, { ok: true, campaign_id: null, basis: { niches: [], platforms: [] }, reason: "no_niches", influencers: [] });
  r = await w.get(w.br, `?campaign=${w.cBare}`);
  ok200(r);
  assert.deepEqual(r.body, { ok: true, campaign_id: w.cBare, basis: { niches: [], platforms: ["instagram"] }, reason: "no_niches", influencers: [] });
});

test("matches sınırı: varsayılan 20, en çok 50, eşit skorda id↓", async () => {
  const { db, call, join, profile, site } = await setup();
  const br = await join("brand", "marka@ornek.com");
  await profile(br, { niches: ["ev"] });
  const s = site(br.id);
  const made = [];
  for (let i = 0; i < 55; i++) made.push(addInfluencer(db, s, `ev${i}@ornek.com`, { niches: ["ev"], platforms: [], listed: true }));
  // Başka sitedeki influencer aday değildir
  addInfluencer(db, "baska.site", "dis@ornek.com", { niches: ["ev"], listed: true });
  const desc = made.slice().sort((x, y) => y - x);
  const get = qs => call("GET", `/app/matches${qs}`, { token: br.token });
  let r = await get("");
  assert.deepEqual(ids(r), desc.slice(0, 20));
  r = await get("?limit=60");
  assert.deepEqual(ids(r), desc.slice(0, 50));
  r = await get("?limit=3");
  assert.deepEqual(ids(r), desc.slice(0, 3));
  r = await get("?limit=50");
  assert.equal(r.body.influencers.length, 50);
});

// 4c) GET/PUT /app/notify

const OWNER_DEF = { new_application: true, content_submitted: true, weekly_summary: false };
const INF_DEF = { invites: true, status_change: true, new_match: false };

test("notify varsayılanları rol başına; sending her zaman false", async () => {
  const { call, join } = await setup();
  for (const [role, want] of [["brand", OWNER_DEF], ["agency", OWNER_DEF], ["influencer", INF_DEF]]) {
    const u = await join(role, `${role}@ornek.com`);
    const r = await call("GET", "/app/notify", { token: u.token });
    ok200(r);
    assert.deepEqual(r.body, { ok: true, notify: want, sending: false });
  }
});

for (const [role, def, key, key2] of [["brand", OWNER_DEF, "weekly_summary", "new_application"], ["agency", OWNER_DEF, "content_submitted", "weekly_summary"], ["influencer", INF_DEF, "new_match", "invites"]]) {
  test(`notify PUT (${role}): kısmi birleştirir, kalıcıdır, profil kaydı silmez`, async () => {
    const { db, call, join, profile } = await setup();
    const u = await join(role, `${role}@ornek.com`);
    const put = n => call("PUT", "/app/notify", { token: u.token, body: { notify: n } });
    let r = await put({ [key]: !def[key] });
    ok200(r);
    const one = { ...def, [key]: !def[key] };
    assert.deepEqual(r.body, { ok: true, notify: one, sending: false });
    assert.deepEqual((await call("GET", "/app/notify", { token: u.token })).body.notify, one);
    r = await put({ [key2]: !def[key2] });
    const two = { ...one, [key2]: !def[key2] };
    assert.deepEqual(r.body.notify, two);
    // Boş nesne bir şey değiştirmez
    assert.deepEqual((await put({})).body.notify, two);
    // Profil kaydı bildirim ayarlarını silmez; profil yanıtında notify yok
    const p = await profile(u, { bio: "yeni", niches: ["moda"] });
    assert.equal(Object.hasOwn(p, "notify"), false);
    const g = await call("GET", "/app/profile", { token: u.token });
    assert.equal(Object.hasOwn(g.body.user, "notify"), false);
    assert.deepEqual((await call("GET", "/app/notify", { token: u.token })).body.notify, two);
    // Yalnız açıkça seçilen anahtarlar saklanır
    assert.deepEqual(JSON.parse(db.prepare("SELECT notify FROM users WHERE id = ?").get(u.id).notify), { [key]: !def[key], [key2]: !def[key2] });
  });
}

test("notify PUT 400: nesne olmayan notify ya da rol anahtarına boolean olmayan değer; durum değişmez", async () => {
  const { db, call, join } = await setup();
  const inf = await join("influencer", "inf@ornek.com");
  const put = body => call("PUT", "/app/notify", { token: inf.token, body });
  ok200(await put({ notify: { invites: false } }));
  const before = db.prepare("SELECT notify FROM users WHERE id = ?").get(inf.id).notify;
  for (const body of [{}, { notify: null }, { notify: [] }, { notify: [true] }, { notify: "x" }, { notify: true }, { notify: 1 },
    { notify: { invites: "yes" } }, { notify: { invites: 1 } }, { notify: { invites: null } }, { notify: { status_change: false, new_match: "true" } }]) {
    fails(await put(body), 400, "notify");
  }
  assert.equal(db.prepare("SELECT notify FROM users WHERE id = ?").get(inf.id).notify, before);
  assert.deepEqual((await call("GET", "/app/notify", { token: inf.token })).body.notify, { ...INF_DEF, invites: false });
  // Sahip rolü de aynı kuralla
  const br = await join("brand", "marka@ornek.com");
  fails(await call("PUT", "/app/notify", { token: br.token, body: { notify: { weekly_summary: "1" } } }), 400, "notify");
});

test("notify PUT: bilinmeyen ve başka rolün anahtarı yok sayılır, saklanmaz", async () => {
  const { db, call, join } = await setup();
  const inf = await join("influencer", "inf@ornek.com");
  const r = await call("PUT", "/app/notify", { token: inf.token, body: { notify: { invites: false, new_application: "x", weekly_summary: false, foo: 1, __proto__x: true } } });
  ok200(r);
  assert.deepEqual(r.body.notify, { ...INF_DEF, invites: false });
  assert.deepEqual(JSON.parse(db.prepare("SELECT notify FROM users WHERE id = ?").get(inf.id).notify), { invites: false });
  const br = await join("brand", "marka@ornek.com");
  const b = await call("PUT", "/app/notify", { token: br.token, body: { notify: { invites: false, weekly_summary: true } } });
  assert.deepEqual(b.body.notify, { ...OWNER_DEF, weekly_summary: true });
});

test("notify: bozuk saklı değer varsayılana düşer", async () => {
  const { db, call, join } = await setup();
  const inf = await join("influencer", "inf@ornek.com");
  const set = v => db.prepare("UPDATE users SET notify = ? WHERE id = ?").run(v, inf.id);
  for (const v of ["garbage", "[1]", "null", "7", "{\"invites\":\"x\",\"new_match\":1}"]) {
    set(v);
    const r = await call("GET", "/app/notify", { token: inf.token });
    ok200(r);
    assert.deepEqual(r.body.notify, INF_DEF, v);
  }
  set("{\"invites\":false,\"extra\":true}");
  assert.deepEqual((await call("GET", "/app/notify", { token: inf.token })).body.notify, { ...INF_DEF, invites: false });
  // Bozuk değerin üstüne PUT geçerli bir nesne yazar
  set("garbage");
  ok200(await call("PUT", "/app/notify", { token: inf.token, body: { notify: { new_match: true } } }));
  assert.deepEqual(JSON.parse(db.prepare("SELECT notify FROM users WHERE id = ?").get(inf.id).notify), { new_match: true });
  // Nesne olmayan geçerli JSON da {} sayılır
  for (const v of ["[1]", "null", "7"]) {
    set(v);
    ok200(await call("PUT", "/app/notify", { token: inf.token, body: { notify: { invites: false } } }));
    assert.deepEqual(JSON.parse(db.prepare("SELECT notify FROM users WHERE id = ?").get(inf.id).notify), { invites: false }, v);
  }
});

test("notify 0005 uygulanmamışsa: GET varsayılan döner, PUT 503 not_ready; diğer uçlar çalışır", async () => {
  const { call, join, profile } = await setup(freshDb(false));
  for (const [role, def] of [["brand", OWNER_DEF], ["influencer", INF_DEF]]) {
    const u = await join(role, `${role}@ornek.com`);
    const g = await call("GET", "/app/notify", { token: u.token });
    ok200(g);
    assert.deepEqual(g.body, { ok: true, notify: def, sending: false });
    fails(await call("PUT", "/app/notify", { token: u.token, body: { notify: {} } }), 503, "not_ready");
    // Doğrulama hatası yine önce gelir
    fails(await call("PUT", "/app/notify", { token: u.token, body: { notify: null } }), 400, "notify");
    await profile(u, { niches: ["moda"] });
    ok200(await call("GET", "/app/niches", { token: u.token }));
  }
});

test("notify token yoksa 401", async () => {
  const { call } = await setup();
  fails(await call("GET", "/app/notify"), 401, "auth");
  fails(await call("PUT", "/app/notify", { body: { notify: { invites: true } } }), 401, "auth");
  fails(await call("PUT", "/app/notify", { token: "a".repeat(43), body: { notify: {} } }), 401, "auth");
});

// Yönlendirme ve CORS

test("PUT yalnız notify'da: PUT /app/profile 404, dizi gövde 400 json, büyük gövde 413", async () => {
  const { call, join } = await setup();
  const u = await join("brand", "marka@ornek.com");
  fails(await call("PUT", "/app/profile", { token: u.token, body: { profile: {} } }), 404, "not_found");
  fails(await call("PUT", "/app/matches", { token: u.token, body: {} }), 404, "not_found");
  fails(await call("POST", "/app/notify", { token: u.token, body: { notify: {} } }), 404, "not_found");
  fails(await call("PUT", "/app/notify", { token: u.token, body: [1] }), 400, "json");
  fails(await call("PUT", "/app/notify", { token: u.token, body: { notify: {}, pad: "x".repeat(20001) } }), 413, "size");
});

test("CORS ön isteği PUT'a izin verir", async () => {
  const idx = (await import("./index.js")).default;
  const r = await idx.fetch(new Request("https://forms.test/app/notify", { method: "OPTIONS", headers: { origin: ORIGIN } }), { DEV_ORIGINS: ORIGIN, ALLOWED_HOSTS: "brandcorner.co" });
  assert.equal(r.status, 204);
  assert.deepEqual(r.headers.get("access-control-allow-methods").split(/,\s*/), ["GET", "POST", "PUT"]);
  assert.match(r.headers.get("access-control-allow-headers"), /authorization/);
  const bad = await idx.fetch(new Request("https://forms.test/app/notify", { method: "OPTIONS", headers: { origin: "https://kotu.example" } }), { DEV_ORIGINS: ORIGIN, ALLOWED_HOSTS: "brandcorner.co" });
  assert.equal(bad.status, 403);
});

test("Meta geri çağrıları index.js'ten metaCallback'e gider", async () => {
  const idx = (await import("./index.js")).default;
  const env = { INSTAGRAM_CLIENT_SECRET: "ig-gizli-secret", ALLOWED_HOSTS: "brandcorner.co" };
  const bad = await idx.fetch(new Request("https://forms.test/oauth/instagram/deauthorize", { method: "POST", body: new URLSearchParams({ signed_request: "x.y" }) }), env);
  assert.deepEqual([bad.status, await bad.text()], [400, "Geçersiz istek"]);
  const st = await idx.fetch(new Request(`https://forms.test/oauth/instagram/delete?code=${"A".repeat(16)}`), env);
  assert.equal(st.status, 200);
  const get = await idx.fetch(new Request("https://forms.test/oauth/instagram/deauthorize"), env);
  assert.deepEqual([get.status, await get.text()], [405, "İzin verilmeyen yöntem"]);
});

// 5) finishOAuth log metni

test("errText: tek satır, en çok 160 karakter, tırnak içi ve uzun token maskelenir", () => {
  assert.equal(errText(new TypeError('bad "secret-value" here\nline2')), 'TypeError: bad "…" here line2');
  assert.equal(errText(new Error("key 'abc def' bad")), 'Error: key "…" bad');
  assert.equal(errText(new Error("token abcdefghijklmnopqrstuvwxyz0123 failed")), "Error: token … failed");
  assert.equal(errText("plain"), "Error: plain");
  assert.equal(errText(null), "Error: null");
  assert.equal(errText(undefined), "Error: undefined");
  const long = errText(new Error("a b\t".repeat(200)));
  assert.ok(long.length <= 160, String(long.length));
  assert.equal(/[\n\r\t]/.test(long), false);
  assert.ok(long.startsWith("Error: a b a b"));
});

// İnceleme düzeltmeleri: sıkı sayı ayrıştırma, i/ı tekilliği, atomik notify, rol döngüleri

test("matches sıkı sayı: yalnız düz ondalık pozitif tamsayı; çok büyük campaign 404, çok uzun limit 50'ye iner", async () => {
  const w = await matchWorld();
  for (const who of [w.br, w.ag]) {
    for (const v of ["1e1", "0x2", "1.0", "%2B3", "%202", "2%20", "01", "-1", "0", "1_0"]) {
      fails(await w.get(who, `?campaign=${v}`), 400, "campaign");
      fails(await w.get(who, `?limit=${v}`), 400, "limit");
    }
    fails(await w.get(who, "?campaign=99999999999999999999"), 404, "not_found");
    const r = await w.get(who, `?limit=${"9".repeat(25)}`);
    ok200(r);
    assert.deepEqual(ids(r), ids(await w.get(who)));
  }
  // 55 influencer: çok uzun limit tam 50 döner
  const { db, call, join, profile, site } = await setup();
  const br = await join("brand", "marka@ornek.com");
  await profile(br, { niches: ["ev"] });
  for (let i = 0; i < 55; i++) addInfluencer(db, site(br.id), `ev${i}@ornek.com`, { niches: ["ev"], platforms: [], listed: true });
  const r = await call("GET", `/app/matches?limit=${"9".repeat(25)}`, { token: br.token });
  assert.equal(r.body.influencers.length, 50);
});

test("ajans client_names tekilliği i/ı/I/İ'yi aynı sayar; ilk yazım kalır", async () => {
  const { join, profile } = await setup();
  const ag = await join("agency", "ajans@ornek.com");
  const p = await profile(ag, { client_names: ["Nike", "NIKE", "nıke", "ikea", "IKEA", "İstanbul", "Istanbul", "istanbul", "ıstanbul", "ISTANBUL"] });
  assert.deepEqual(p.client_names, ["Nike", "ikea", "İstanbul"]);
  assert.equal(p.clients, 3);
});

test("matches (ajans, ?campaign): kendi kampanyası dayanak, platform süzgeci, kendi geçmişi; aşama sayımı ajansta da çalışır", async () => {
  const w = await matchWorld();
  const { call } = w;
  const c = await call("POST", "/app/campaigns", { token: w.ag.token, body: { title: "Ajans", niches: ["teknoloji", "oyun"], platforms: ["youtube"] } });
  ok200(c);
  const cid = c.body.campaign.id;
  ok200(await call("POST", `/app/campaigns/${cid}/invite`, { token: w.ag.token, body: { user_id: w.i6.id } }));
  let r = await w.get(w.ag, `?campaign=${cid}`);
  ok200(r);
  assert.equal(r.body.campaign_id, cid);
  assert.deepEqual(r.body.basis, { niches: ["teknoloji", "oyun"], platforms: ["youtube"] });
  // i6 (teknoloji, youtube) tam uyum; i5 (oyun, instagram) yalnız niş payı
  assert.deepEqual(ids(r), [w.i6.id, w.i5.id]);
  assert.ok(scores(r)[0] > scores(r)[1]);
  assert.deepEqual(r.body.influencers[0].history, [{ campaign_id: cid, status: "invited" }]);
  // Başka sahibin daveti ajansın geçmişinde görünmez
  for (const x of r.body.influencers) for (const h of x.history) assert.equal(h.campaign_id, cid);
  r = await w.get(w.ag, `?campaign=${cid}&platform=instagram`);
  assert.deepEqual(ids(r), [w.i5.id]);
  // Marka ajansın kampanyasını göremez
  fails(await w.get(w.br, `?campaign=${cid}`), 404, "not_found");
  const list = await call("GET", "/app/campaigns", { token: w.ag.token });
  const row = list.body.campaigns.find(x => x.id === cid);
  assert.deepEqual([row.invited, row.pending, row.active, row.submitted, row.approved, row.rejected, row.declined, row.applications], [1, 0, 0, 0, 0, 0, 0, 1]);
});

test("matches en çok 3 D1 sorgusu (kimlik doğrulama hariç)", async () => {
  const w = await matchWorld();
  let n = 0;
  const prep = w.env.DB.prepare;
  w.env.DB.prepare = sql => { n++; return prep(sql); };
  const count = async (who, path) => { n = 0; ok200(await w.call("GET", path, { token: who.token })); return n; };
  const base = await count(w.br, "/app/niches");
  assert.ok(await count(w.br, `/app/matches?campaign=${w.c1}`) - base <= 3);
  assert.ok(await count(w.ag, "/app/matches") - base <= 3);
});

test("notify atomik: araya giren yazım ezilmez, eşzamanlı iki PUT'un ikisi de kalır", async () => {
  const { db, env, call, join } = await setup();
  const inf = await join("influencer", "inf@ornek.com");
  const stored = () => JSON.parse(db.prepare("SELECT notify FROM users WHERE id = ?").get(inf.id).notify);
  // Kimlik doğrulamadan sonra, UPDATE'ten hemen önce başka bir istek invites'ı yazar
  const prep = env.DB.prepare;
  let once = true;
  env.DB.prepare = sql => {
    if (once && sql.startsWith("UPDATE users SET notify")) { once = false; db.prepare("UPDATE users SET notify = ? WHERE id = ?").run('{"invites":false}', inf.id); }
    return prep(sql);
  };
  let r = await call("PUT", "/app/notify", { token: inf.token, body: { notify: { status_change: false } } });
  ok200(r);
  assert.deepEqual(r.body.notify, { ...INF_DEF, invites: false, status_change: false });
  assert.deepEqual(stored(), { invites: false, status_change: false });
  env.DB.prepare = prep;
  const put = n => call("PUT", "/app/notify", { token: inf.token, body: { notify: n } });
  await Promise.all([put({ new_match: true }), put({ invites: true })]);
  assert.deepEqual(stored(), { invites: true, status_change: false, new_match: true });
  assert.deepEqual((await call("GET", "/app/notify", { token: inf.token })).body.notify, { invites: true, status_change: false, new_match: true });
});

test("notify PUT: kullanıcı istek sırasında silinirse 401 auth", async () => {
  const { db, env, call, join } = await setup();
  const u = await join("brand", "marka@ornek.com");
  const prep = env.DB.prepare;
  env.DB.prepare = sql => {
    if (sql.startsWith("UPDATE users SET notify")) db.prepare("DELETE FROM users WHERE id = ?").run(u.id);
    return prep(sql);
  };
  fails(await call("PUT", "/app/notify", { token: u.token, body: { notify: { weekly_summary: true } } }), 401, "auth");
});

for (const [role, def, key] of [["brand", OWNER_DEF, "weekly_summary"], ["agency", OWNER_DEF, "new_application"], ["influencer", INF_DEF, "status_change"]]) {
  test(`notify (${role}): 400 yolları, yabancı anahtar, 0005'siz 503; gönderim yok`, async () => {
    const { db, call, join } = await setup();
    const u = await join(role, `${role}@ornek.com`);
    const put = body => call("PUT", "/app/notify", { token: u.token, body });
    for (const body of [{}, { notify: null }, { notify: [] }, { notify: "x" }, { notify: { [key]: "true" } }, { notify: { [key]: 0 } }]) fails(await put(body), 400, "notify");
    const other = Object.keys(def === OWNER_DEF ? INF_DEF : OWNER_DEF)[0];
    const r = await put({ notify: { [key]: !def[key], [other]: true, zzz: false } });
    ok200(r);
    assert.deepEqual(r.body, { ok: true, notify: { ...def, [key]: !def[key] }, sending: false });
    assert.deepEqual(JSON.parse(db.prepare("SELECT notify FROM users WHERE id = ?").get(u.id).notify), { [key]: !def[key] });
    const old = await setup(freshDb(false));
    const v = await old.join(role, `${role}@ornek.com`);
    fails(await old.call("PUT", "/app/notify", { token: v.token, body: { notify: { [key]: true } } }), 503, "not_ready");
    assert.deepEqual((await old.call("GET", "/app/notify", { token: v.token })).body, { ok: true, notify: def, sending: false });
  });
}

test("notify hiçbir gönderim yapmaz: deliver ve fetch çağrılmaz", async t => {
  const db = freshDb();
  const { join } = await setup(db);
  const env = { DB: d1(db), DEV_ORIGINS: ORIGIN, PBKDF2_ITER: "10000", METRICS_ENABLED: "1" };
  let delivered = 0, fetched = 0;
  t.mock.method(globalThis, "fetch", async () => { fetched++; throw new Error("ağ yok"); });
  const send = async (method, token, body) => {
    const req = new Request("https://forms.test/app/notify", { method, headers: { "cf-connecting-ip": "10.0.0.9", "content-type": "application/json", authorization: `Bearer ${token}` }, body: body && JSON.stringify(body) });
    const res = await platform(req, new URL(req.url), env, ORIGIN, async () => { delivered++; });
    return res.status;
  };
  for (const role of ["brand", "agency", "influencer"]) {
    const u = await join(role, `${role}@ornek.com`);
    assert.equal(await send("GET", u.token), 200);
    assert.equal(await send("PUT", u.token, { notify: { weekly_summary: true, new_match: true } }), 200);
  }
  assert.deepEqual([delivered, fetched], [0, 0]);
});

test("0005 sonradan uygulanınca var olan kullanıcılar varsayılanla başlar, PUT çalışır", async () => {
  const db = freshDb(false);
  const { call, join } = await setup(db);
  const br = await join("brand", "marka@ornek.com");
  const inf = await join("influencer", "inf@ornek.com");
  db.exec(NOTIFY_SQL);
  assert.equal(db.prepare("SELECT notify FROM users WHERE id = ?").get(br.id).notify, "{}");
  assert.deepEqual((await call("GET", "/app/notify", { token: br.token })).body.notify, OWNER_DEF);
  const r = await call("PUT", "/app/notify", { token: inf.token, body: { notify: { invites: false } } });
  ok200(r);
  assert.deepEqual(r.body.notify, { ...INF_DEF, invites: false });
});

test("gövde sınırı karakterle: tam 20000 karakter geçer, 20001 karakter 413", async () => {
  const { call, join } = await setup();
  const u = await join("brand", "marka@ornek.com");
  const frame = JSON.stringify({ notify: {}, pad: "" }).length;
  // Çok baytlı karakter: sınır bayt değil karakter sayısıdır
  ok200(await call("PUT", "/app/notify", { token: u.token, body: { notify: {}, pad: "ğ".repeat(20000 - frame) } }));
  fails(await call("PUT", "/app/notify", { token: u.token, body: { notify: {}, pad: "ğ".repeat(20001 - frame) } }), 413, "size");
});

test("ajans eski clients sınırları: 0 ve 10000 saklanır, 10001 null; marka DB profilinde client_names yok", async () => {
  const { db, join, profile } = await setup();
  const ag = await join("agency", "ajans@ornek.com");
  for (const [n, want] of [[0, 0], [10000, 10000], [10001, null], [2.5, null]]) assert.equal((await profile(ag, { clients: n })).clients, want, String(n));
  const br = await join("brand", "marka@ornek.com");
  await profile(br, { clients: 4, client_names: ["Acme"] });
  const stored = JSON.parse(db.prepare("SELECT profile FROM users WHERE id = ?").get(br.id).profile);
  assert.equal(Object.hasOwn(stored, "client_names"), false);
  assert.equal(Object.hasOwn(stored, "clients"), false);
});
