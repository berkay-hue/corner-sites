// node --test src/gen-schema.test.mjs — A2-1: migrations/0014_gen.sql yeniden uygulanabilir, schema.sql ile aynı, koşullu artış 3'te durur
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let DatabaseSync = null;
try {
  ({ DatabaseSync } = await import("node:sqlite"));
} catch {
  DatabaseSync = null;
}
const skip = DatabaseSync ? false : "node:sqlite yok (node 22+ gerekir)";

const MIG = readFileSync(new URL("../migrations/0014_gen.sql", import.meta.url), "utf8");
const SCHEMA = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

const DAILY_COLS = [
  "ok", "fail", "refused", "busy", "refine_ok", "tok_in", "tok_out",
  "uniq_anon", "anon_full", "ip_full", "cap_hit", "ret0", "ret1", "ret2_7", "ret8",
  "copy_ok", "copy_fb", "share",
  "qc_limit", "qc_result", "qc_error", "qc_cap", "qc_top", "qc_footer", "qc_calendly",
];

function tables(db) {
  return db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all().map((r) => r.name);
}
function cols(db, t) {
  return db.prepare(`PRAGMA table_info(${t})`).all();
}

test("0014 iki kez çalışır, tablolar ve sütunlar var", { skip }, () => {
  const db = new DatabaseSync(":memory:");
  db.exec(MIG);
  db.exec(MIG);
  const t = tables(db);
  assert.ok(t.includes("gen_usage"));
  assert.ok(t.includes("gen_daily"));
  assert.deepEqual(cols(db, "gen_usage").map((c) => c.name), ["day", "key", "kind", "n"]);
  const daily = cols(db, "gen_daily");
  assert.deepEqual(daily.map((c) => c.name), ["day", ...DAILY_COLS]);
  for (const c of daily.slice(1)) {
    assert.equal(c.type, "INTEGER", c.name);
    assert.equal(c.notnull, 1, c.name);
    assert.equal(c.dflt_value, "0", c.name);
  }
  // WITHOUT ROWID: rowid sütunu yok
  assert.throws(() => db.prepare("SELECT rowid FROM gen_usage").all());
  assert.throws(() => db.prepare("SELECT rowid FROM gen_daily").all());
});

test("schema.sql aynı tabloları içerir ve 0014'ten sonra yeniden çalışır", { skip }, () => {
  const a = new DatabaseSync(":memory:");
  a.exec(MIG);
  const b = new DatabaseSync(":memory:");
  b.exec(SCHEMA);
  b.exec(MIG);
  for (const t of ["gen_usage", "gen_daily"]) {
    assert.deepEqual(cols(b, t), cols(a, t), t);
    // table_info WITHOUT ROWID farkını göstermez (gen_usage'da bileşik PK zaten NOT NULL); wr/strict ayrıca karşılaştırılır
    const kind = (db) => ({ ...db.prepare(`PRAGMA table_list(${t})`).get() });
    assert.deepEqual(kind(b), kind(a), t);
    assert.equal(kind(b).wr, 1, t);
  }
  assert.match(SCHEMA, /0014_gen\.sql/);
  assert.match(SCHEMA, /0003–0014/);
  assert.doesNotMatch(SCHEMA, /0003–0013/);
});

test("ON CONFLICT … WHERE … RETURNING koşullu artış 3'te durur", { skip }, () => {
  const db = new DatabaseSync(":memory:");
  db.exec(MIG);
  const inc = db.prepare(
    `INSERT INTO gen_usage (day, key, kind, n) VALUES (?, ?, ?, ?)
     ON CONFLICT(day, key) DO UPDATE SET n = gen_usage.n + excluded.n
     WHERE gen_usage.n + excluded.n <= ? RETURNING n`,
  );
  const got = [];
  for (let i = 0; i < 20; i++) got.push(inc.get("2026-11-23", "k1", "anon", 1, 3)?.n ?? null);
  assert.deepEqual(got.slice(0, 3), [1, 2, 3]);
  assert.ok(got.slice(3).every((v) => v === null));
  assert.equal(got.filter((v) => v !== null).length, 3);
  assert.equal(db.prepare("SELECT n FROM gen_usage WHERE day = ? AND key = ?").get("2026-11-23", "k1").n, 3);
  // başka gün / başka anahtar ayrı sayılır
  assert.equal(inc.get("2026-11-24", "k1", "anon", 1, 3).n, 1);
  assert.equal(inc.get("2026-11-23", "k2", "anon", 1, 3).n, 1);
  // birim artışı (global: üretim 3 birim): 300 tavanında 100. üretim geçer, 101. durur
  for (let i = 0; i < 100; i++) assert.ok(inc.get("2026-11-23", "all", "all", 3, 300));
  assert.equal(inc.get("2026-11-23", "all", "all", 3, 300), undefined);
  assert.equal(inc.get("2026-11-23", "all", "all", 0, 300).n, 300);
});

test("gen_daily tek upsert toplar", { skip }, () => {
  const db = new DatabaseSync(":memory:");
  db.exec(MIG);
  const up = db.prepare(
    `INSERT INTO gen_daily (day, ok, tok_in) VALUES (?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET ok = ok + excluded.ok, tok_in = tok_in + excluded.tok_in`,
  );
  up.run("2026-11-23", 1, 500);
  up.run("2026-11-23", 1, 700);
  const r = db.prepare("SELECT ok, tok_in, fail, qc_calendly FROM gen_daily WHERE day = ?").get("2026-11-23");
  assert.deepEqual({ ...r }, { ok: 2, tok_in: 1200, fail: 0, qc_calendly: 0 });
});

// A9b: migrations/0018_plans.sql — users.plan/plan_limits + gen_month aylık sayaç; schema.sql gen_month'u aynalar
const MIG18 = readFileSync(new URL("../migrations/0018_plans.sql", import.meta.url), "utf8");

test("0018 schema.sql üstüne uygulanır: plan sütunları, gen_month, varsayılan basic", { skip }, () => {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  db.exec(MIG18);
  const u = Object.fromEntries(cols(db, "users").map((c) => [c.name, c]));
  assert.equal(u.plan.type, "TEXT");
  assert.equal(u.plan.notnull, 1);
  assert.equal(u.plan.dflt_value, "'basic'");
  assert.equal(u.plan_limits.type, "TEXT");
  assert.equal(u.plan_limits.notnull, 0);
  assert.deepEqual(cols(db, "gen_month").map((c) => c.name), ["month", "user_id", "kind", "n"]);
  assert.throws(() => db.prepare("SELECT rowid FROM gen_month").all());
  db.prepare("INSERT INTO users (site, email, name, role, pass) VALUES (?, ?, ?, ?, ?)").run("app.socialmediacorner.co", "a@b.co", "A", "brand", "x");
  const row = db.prepare("SELECT plan, plan_limits FROM users").get();
  assert.deepEqual({ ...row }, { plan: "basic", plan_limits: null });
  // kind yalnız lb | vg
  assert.throws(() => db.prepare("INSERT INTO gen_month (month, user_id, kind, n) VALUES ('2026-11', 1, 'xx', 1)").run());
  // ALTER tekrar çalışmaz (wrangler takip eder); CREATE kısmı ise IF NOT EXISTS
  assert.throws(() => db.exec(MIG18));
});

test("schema.sql gen_month'u 0018 ile aynı tanımlar ve 0018'i anar", { skip }, () => {
  const a = new DatabaseSync(":memory:");
  a.exec(SCHEMA.replace(/CREATE TABLE IF NOT EXISTS gen_month[\s\S]*?WITHOUT ROWID;/, ""));
  a.exec(MIG18);
  const b = new DatabaseSync(":memory:");
  b.exec(SCHEMA);
  assert.deepEqual(cols(b, "gen_month"), cols(a, "gen_month"));
  const kind = (db) => ({ ...db.prepare("PRAGMA table_list(gen_month)").get() });
  assert.deepEqual(kind(b), kind(a));
  assert.equal(kind(b).wr, 1);
  assert.match(SCHEMA, /0018_plans\.sql/);
});

test("gen_month koşullu artış sınırda durur, ay/kind ayrı sayılır, kullanıcı silinince gider", { skip }, () => {
  const db = new DatabaseSync(":memory:");
  // CASCADE'i yalın bir users tablosunda dene (schema.sql'deki users'a başka migration'ların tabloları da bağlı)
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT)");
  db.exec(MIG18);
  db.prepare("INSERT INTO users DEFAULT VALUES").run();
  const inc = db.prepare(
    `INSERT INTO gen_month (month, user_id, kind, n) VALUES (?, ?, ?, ?)
     ON CONFLICT(month, user_id, kind) DO UPDATE SET n = gen_month.n + excluded.n
     WHERE gen_month.n + excluded.n <= ? RETURNING n`,
  );
  const got = [];
  for (let i = 0; i < 12; i++) got.push(inc.get("2026-11", 1, "vg", 1, 10)?.n ?? null);
  assert.deepEqual(got, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null, null]);
  assert.equal(inc.get("2026-12", 1, "vg", 1, 10).n, 1);
  assert.equal(inc.get("2026-11", 1, "lb", 1, 40).n, 1);
  db.prepare("DELETE FROM users WHERE id = 1").run();
  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM gen_month").get().c, 0);
});
