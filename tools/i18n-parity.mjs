// i18n eşitlik testi: sites/brandcorner.co/bc-app.js içindeki her {tr:{...}, en:{...}} sözlüğünde TR ve EN anahtar kümeleri aynı mı.
// Eksik anahtarları listeler; fark varsa exit 1. Kullanım: node tools/i18n-parity.mjs [dosya...]
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const files = process.argv.length > 2 ? process.argv.slice(2) : [join(import.meta.dirname, "..", "sites", "brandcorner.co", "bc-app.js")];
// "var X = {" ile başlayan ve tr: anahtarı taşıyan nesne literalini parantez sayarak keser (dizgi içindeki parantezleri atlar)
function literalAt(src, i) {
  let depth = 0, q = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (q) { if (c === "\\") j++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") q = c;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return src.slice(i, j + 1);
  }
  throw new Error("kapanmayan nesne");
}
let bad = 0;
for (const f of files) {
  const src = await readFile(f, "utf8");
  let n = 0;
  for (const m of src.matchAll(/(?:var|let|const)\s+(\w+)\s*=\s*\{\s*tr\s*:/g)) {
    const dict = Function(`"use strict"; return (${literalAt(src, m.index + m[0].indexOf("{"))});`)();
    if (!dict.en) continue;
    n++;
    const tr = new Set(Object.keys(dict.tr)), en = new Set(Object.keys(dict.en));
    const noEn = [...tr].filter(k => !en.has(k)), noTr = [...en].filter(k => !tr.has(k));
    bad += noEn.length + noTr.length;
    console.log(`${noEn.length + noTr.length ? "✗" : "✓"} ${f.split("/").slice(-2).join("/")} ${m[1]}: TR ${tr.size}, EN ${en.size} anahtar`);
    if (noEn.length) console.log("  EN'de eksik: " + noEn.join(", "));
    if (noTr.length) console.log("  TR'de eksik: " + noTr.join(", "));
  }
  if (!n) { bad++; console.log(`✗ ${f}: tr/en sözlüğü bulunamadı`); }
}
process.exit(bad ? 1 : 0);
