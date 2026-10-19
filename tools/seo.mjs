// Mirror sonrası SEO düzeltmeleri (idempotent). Kullanım: node tools/seo.mjs <host>
// Şimdilik yalnızca yalcinberkay.com.tr; diğer siteler kendi kurallarıyla eklenecek.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { host, SITE, walk, splice } from "./seo/core.mjs";

const mod = host && existsSync(join(import.meta.dirname, "seo", "hosts", `${host}.mjs`)) ? await import(`./seo/hosts/${host}.mjs`) : {};
const RULES = { [host]: mod.rule }, CHUNK_PATCHES = { [host]: mod.chunks };
const rule = RULES[host];
if (!rule) { console.error(`kural yok: ${host}`); process.exit(1); }
const renames = [];
for (const p of CHUNK_PATCHES[host] || []) {
  const dir = join(SITE, "_next/static/chunks"), ext = p.ext || "js", src = await readFile(join(dir, `${p.chunk}.${ext}`), "utf8");
  const out = p.edits.reduce((s, [from, to]) => splice(s, from, to, p.chunk), src), name = createHash("sha256").update(out).digest("hex").slice(0, 16);
  const left = rule.CLAIMS && out.match(rule.CLAIMS);  // EN + TR sözlük dahil yamalı chunk'ta da iddia kalmasın
  if (left) throw new Error(`${p.chunk}: doğrulanamayan iddia kaldı: ${left[0]}`);
  if (!existsSync(join(dir, `${name}.${ext}`))) await writeFile(join(dir, `${name}.${ext}`), out);
  for (const old of [p.chunk, ...(p.was || [])]) renames.push([`/_next/static/chunks/${old}.${ext}`, `/_next/static/chunks/${name}.${ext}`]);
}
let n = 0;
const used = new Set();
for await (const f of walk(SITE)) {
  const page = "/" + relative(SITE, f).replace(/\.html$/, "").replace(/^index$/, "");  // index -> "/"
  const before = await readFile(f, "utf8");
  let after = rule.fix(before, page);
  for (const [a, b] of renames) after = after.replaceAll(a, b);
  for (const [, b] of renames) if (after.includes(b)) used.add(b);
  if (after !== before) { await writeFile(f, after); n++; }
}
const unused = [...new Set(renames.map(([, b]) => b))].filter(b => !used.has(b));
if (unused.length) throw new Error(`yamalı chunk hiçbir sayfada yok (önceki adı was'a ekle): ${unused.join(", ")}`);
console.log(`seo: ${host} ${n} dosya güncellendi${(CHUNK_PATCHES[host] || []).length ? `, ${CHUNK_PATCHES[host].length} chunk yamalandı` : ""}`);
