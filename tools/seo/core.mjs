// seo.mjs ortak çekirdeği: site başına kurallar tools/seo/hosts/<host>.mjs
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { metaDescription } from "../lib/content.mjs";
export { existsSync, join, metaDescription };

export const host = process.argv[2];
export const SITE = join(import.meta.dirname, "..", "..", "sites", host);

export async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith("_")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else if (e.name.endsWith(".html")) yield p;
  }
}

export const text = s => s.replace(/<br[^>]*>/g, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
export const attr = s => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
export const setMeta = (html, re, value) => html.replace(re, (m, a, _old, b) => `${a}${attr(value)}${b}`);
export const ldTag = obj => `<script type="application/ld+json" data-sk-seo>${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

export const splice = (src, from, to, chunk) => {
  const [a, z] = typeof from === "string" ? [from, null] : [from.from, from.until];
  const i = src.indexOf(a);
  if (i < 0 || src.indexOf(a, i + 1) >= 0) throw new Error(`chunk yaması tek eşleşmeli: ${chunk}: ${a.slice(0, 60)}`);
  const j = z === null ? i + a.length : src.indexOf(z, i + a.length);
  if (j < 0) throw new Error(`chunk yaması bitişi yok: ${chunk}: ${z.slice(0, 60)}`);
  return src.slice(0, i) + to + src.slice(j);
};
