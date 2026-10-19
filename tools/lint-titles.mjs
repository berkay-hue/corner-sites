// Blog front matter'ında CMS bozulması kalıntılarını yakalar (rakam+harf birleşik kelime, "X2'e" eki).
// Kullanım: node tools/lint-titles.mjs [host...]  — kalıntı varsa satırları yazar, çıkış kodu 1
import { readdirSync, readFileSync, existsSync } from "node:fs";
const BAD = /[0-9](?:esil|urturing|o-code|asil)\b|[a-zçğıöşü]2'[a-zçğıöşü]|[0-9][a-zçğıöşü]-zaman/i;
const root = new URL("../content/", import.meta.url);
const hosts = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(root);
let n = 0;
for (const h of hosts) {
  const dir = new URL(`${h}/blog/`, root);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    readFileSync(new URL(f, dir), "utf8").split("\n").forEach((l, i) => {
      if (/^(title|description|imageAlt):/.test(l) && BAD.test(l)) { n++; console.log(`${h}/blog/${f}:${i + 1}: ${l}`); }
    });
  }
}
process.exit(n ? 1 : 0);
