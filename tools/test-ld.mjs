// JSON-LD testi (dist.mjs'ten sonra): dist/<host> içindeki her ld+json JSON.parse'tan geçer ve yalnız @id taşıyan
// her referans ({"@id": ...}) aynı sitenin graph'ında, yani herhangi bir sayfada tam ya da satır içi tanımlı bir düğümde çözülür.
// Graf kontrolü: her sitenin kendi Organization düğümü parentOrganization → cornergroup #org, founder → yalcinberkay #person
// göstermeli (cornergroup.co kendi parentOrganization'ı hariç). Varsayılan uyarı (çıkış kodunu etkilemez); STRICT=1 ile hata.
// Kullanım: node tools/test-ld.mjs [host...]  (host verilmezse dist/ altındaki bütün siteler)
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const DIST = join(import.meta.dirname, "..", "dist");
const hosts = process.argv.length > 2 ? process.argv.slice(2) : (await readdir(DIST, { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name);
async function* allHtml(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* allHtml(p); else if (e.name.endsWith(".html")) yield p;
  }
}

const GROUP_ORG = "https://cornergroup.co/#org", FOUNDER = "https://www.yalcinberkay.com.tr/#person";
const STRICT = process.env.STRICT === "1";
const ids = v => (Array.isArray(v) ? v : [v]).map(x => x && typeof x === "object" ? x["@id"] : x).filter(Boolean);
let failed = 0, warned = 0;
for (const host of hosts) {
  const defined = new Set(), refs = [], errors = [], orgs = new Map();
  let blocks = 0;
  const walk = (v, page) => {
    if (Array.isArray(v)) return v.forEach(x => walk(x, page));
    if (!v || typeof v !== "object") return;
    const keys = Object.keys(v);
    if (typeof v["@id"] === "string") { if (keys.length === 1) refs.push([v["@id"], page]); else {
      defined.add(v["@id"]);
      const t = [].concat(v["@type"] || []);
      if (t.some(x => /Organization$/.test(x)) && new URL(v["@id"]).host.replace(/^www\./, "") === host.replace(/^www\./, "")) {
        const o = orgs.get(v["@id"]) || { parent: new Set(), founder: new Set() };
        ids(v.parentOrganization).forEach(x => o.parent.add(x)); ids(v.founder).forEach(x => o.founder.add(x));
        orgs.set(v["@id"], o);
      }
    } }
    for (const k of keys) walk(v[k], page);
  };
  for await (const f of allHtml(join(DIST, host))) {
    const page = "/" + relative(join(DIST, host), f);
    for (const m of (await readFile(f, "utf8")).matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      blocks++;
      try { walk(JSON.parse(m[1]), page); } catch (e) { errors.push(`${page}: JSON.parse: ${e.message}`); }
    }
  }
  for (const [id, page] of refs) if (!defined.has(id)) errors.push(`${page}: çözülmeyen @id ${id}`);
  const graph = [];
  if (!orgs.size) graph.push("kendi Organization düğümü yok");
  for (const [id, o] of orgs) {
    if (id !== GROUP_ORG && !o.parent.has(GROUP_ORG)) graph.push(`${id}: parentOrganization → ${GROUP_ORG} yok`);
    if (!o.founder.has(FOUNDER)) graph.push(`${id}: founder → ${FOUNDER} yok`);
  }
  if (STRICT) errors.push(...graph); else warned += graph.length;
  failed += errors.length;
  console.log(`${errors.length ? "✗" : "✓"} ${host}: ${blocks} ld+json, ${defined.size} tanımlı @id, ${refs.length} referans`);
  for (const e of [...new Set(errors)]) console.log("  " + e);
  if (!STRICT) for (const g of graph) console.log("  ⚠ graf: " + g);
}
if (warned) console.log(`⚠ ${warned} graf uyarısı (STRICT=1 ile hata)`);
process.exit(failed ? 1 : 0);
