// Günlük blog yazısı, GitHub Actions'ta (.github/workflows/blog-daily.yml) çalışır.
// Worker'daki üretim kodunu (blog-worker/src/index.js -> generate) aynen kullanır; Cloudflare'in
// ücretsiz plandaki CPU sınırına (1102) takılmamak için üretim burada yapılır.
// Kullanım: node tools/blog-daily.mjs [--hour 7 | --catchup] [--site saascorner.co] [--dry]
// --catchup: GitHub cron'u düşürürse bugün yazısı olmayan tüm siteler (hour: null olanlar hariç) yazılır.
// cfg.translate (ör. { en: { contentDir, prefix, links } }): TR yazı aynı gün o dile çevrilir, alt: ile eşlenir.
// Yazıyı content/<host>/blog/<slug>.md olarak diske yazar; commit + deploy workflow'da yapılır.
// Env: ANTHROPIC_API_KEY, PEXELS_API_KEY, (opsiyonel) TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generate, claude, slugify } from "../blog-worker/src/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = name => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? undefined : process.argv[i + 1]; };
const hour = arg("hour") === undefined ? undefined : Number(arg("hour"));
const site = arg("site") || undefined;
const dry = process.argv.includes("--dry");
const catchup = process.argv.includes("--catchup");

const toml = fs.readFileSync(path.join(root, "blog-worker/wrangler.toml"), "utf8");
const sites = JSON.parse(toml.match(/SITES = '''([\s\S]*?)'''/)[1])
  .filter(c => (!site || site.split(",").some(x => new URL(c.siteUrl).host.replace(/^www\./, "") === x.trim().replace(/^www\./, ""))) && (site || (catchup ? c.hour != null : hour === undefined || c.hour === hour)));
if (!sites.length) { console.log(`Bu çalıştırmada site yok (hour=${hour}, site=${site})`); process.exit(0); }

const env = { ...process.env };
const today = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); // TR saati

async function notify(text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  }).catch(() => {});
}

const LANGS = { en: "English" };
// TR yazıyı çevirir; iç linkler o dildeki eşine, eşi yoksa TR yazının tam adresine gider
async function translatePost(cfg, lang, t, trSlug, trMd) {
  const out = await claude(env, cfg.writeModel, `Translate this Turkish blog post for ${cfg.brand} into natural, fluent ${LANGS[lang] || lang} for a B2B audience. Keep the Markdown structure, headings, bold text, lists and every link URL exactly as they are; translate only the text. Do not add or remove content.

Reply with exactly two parts and nothing else:
<meta>{"title": "...", "description": "120-160 char meta description", "category": "...", "imageAlt": "...", "slug": "short-english-url-slug"}</meta>
<body>
...translated Markdown body...
</body>

${trMd}`, { maxTokens: 12000 });
  const meta = JSON.parse(out.match(/<meta>([\s\S]*?)<\/meta>/)[1]);
  let body = out.match(/<body>\s*([\s\S]*?)\s*<\/body>/)[1];
  const dir = path.join(root, t.contentDir), trDir = path.join(root, cfg.contentDir);
  fs.mkdirSync(dir, { recursive: true });
  const pairs = Object.fromEntries(fs.readdirSync(dir).filter(f => f.endsWith(".md"))
    .map(f => [fs.readFileSync(path.join(dir, f), "utf8").match(/\nalt: "([^"]+)"/)?.[1], f.replace(/\.md$/, "")]).filter(([a]) => a));
  const site = cfg.siteUrl.replace(/\/$/, ""), esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  body = body.replace(new RegExp(`\\]\\((${esc(site)})?(/[^)\\s#]*)?(#[^)\\s]*)?\\)`, "g"), (m, abs, p, hash = "") => {
    if (!abs && !p) return m; // yalnız #çapa
    p ||= "/";
    const b = p.match(/^\/blog\/([^/]+)$/)?.[1];
    if (b) return pairs[b] ? `](/blog/${pairs[b]}${hash})` : `](${site}${p}${hash})`; // build-blog /blog/'u prefix'ler
    return t.links?.[p] ? `](${t.links[p]}${hash})` : m;
  });
  let slug = slugify(meta.slug || meta.title);
  for (let i = 2; fs.existsSync(path.join(dir, `${slug}.md`)); i++) slug = `${slugify(meta.slug || meta.title)}-${i}`;
  const trFm = Object.fromEntries([...trMd.split("\n---\n")[0].matchAll(/^(\w+): (.*)$/gm)].map(m => [m[1], JSON.parse(m[2])]));
  const fm = { title: meta.title, description: meta.description, date: trFm.date, category: meta.category, image: trFm.image, imageAlt: meta.imageAlt, alt: trSlug };
  fs.writeFileSync(path.join(dir, `${slug}.md`), `---\n${Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n")}\n---\n\n${body}\n`);
  // TR yazı da eşini bilsin (dil anahtarı + hreflang)
  const trFile = path.join(trDir, `${trSlug}.md`);
  fs.writeFileSync(trFile, fs.readFileSync(trFile, "utf8").replace(/\n---\n/, `\nalt: ${JSON.stringify(slug)}\n---\n`));
  return `${site}${t.prefix}/blog/${slug}`;
}

let failed = 0;
for (const cfg of sites) {
  const dir = path.join(root, cfg.contentDir);
  try {
    // Aynı gün ikinci yazı olmasın (elle tetikleme / gecikmeli cron tekrarında)
    const done = fs.existsSync(dir) && fs.readdirSync(dir).filter(f => f.endsWith(".md"))
      .find(f => fs.readFileSync(path.join(dir, f), "utf8").includes(`\ndate: "${today}"`));
    if (done && !site) { console.log(`${cfg.siteUrl}: bugün zaten yazı var (${done}), atlandı`); continue; }

    const { topic, slug, fm, body, md, links } = await generate(env, cfg);
    if (dry) { console.log(JSON.stringify({ site: cfg.siteUrl, slug, fm, words: body.split(/\s+/).length, links, preview: body.slice(0, 400) }, null, 1)); continue; }
    let file = path.join(dir, `${slug}.md`);
    for (let i = 2; fs.existsSync(file); i++) file = path.join(dir, `${slug}-${i}.md`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, md);
    const postUrl = `${cfg.siteUrl}/blog/${path.basename(file, ".md")}`;
    console.log(`${postUrl} (${body.split(/\s+/).length} kelime, ${links?.length ?? 0} iç link)`);
    await notify(`✅ Yeni blog (${topic.category}): ${topic.topic}\n${postUrl}\n(yayına çıkması 2-3 dakika sürer)`);
    // Çeviri başarısız olsa da TR yazı yayına çıkar
    for (const [lang, t] of Object.entries(cfg.translate || {})) {
      try { console.log(`${lang}: ${await translatePost(cfg, lang, t, path.basename(file, ".md"), md)}`); }
      catch (e) { console.error(`${cfg.siteUrl} ${lang} çevirisi: ${e.message}`); await notify(`⚠️ ${lang.toUpperCase()} çeviri yazılamadı (${postUrl}): ${e.message}`); }
    }
  } catch (e) {
    failed++;
    console.error(`${cfg.siteUrl}: ${e.message}`);
    await notify(`❌ Blog yazılamadı (${cfg.siteUrl}): ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
