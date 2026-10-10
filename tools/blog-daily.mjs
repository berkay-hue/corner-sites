// Günlük blog yazısı, GitHub Actions'ta (.github/workflows/blog-daily.yml) çalışır.
// Worker'daki üretim kodunu (blog-worker/src/index.js -> generate) aynen kullanır; Cloudflare'in
// ücretsiz plandaki CPU sınırına (1102) takılmamak için üretim burada yapılır.
// Kullanım: node tools/blog-daily.mjs [--hour 7] [--site saascorner.co] [--dry]
// Yazıyı content/<host>/blog/<slug>.md olarak diske yazar; commit + deploy workflow'da yapılır.
// Env: ANTHROPIC_API_KEY, PEXELS_API_KEY, (opsiyonel) TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "../blog-worker/src/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = name => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? undefined : process.argv[i + 1]; };
const hour = arg("hour") === undefined ? undefined : Number(arg("hour"));
const site = arg("site") || undefined;
const dry = process.argv.includes("--dry");

const toml = fs.readFileSync(path.join(root, "blog-worker/wrangler.toml"), "utf8");
const sites = JSON.parse(toml.match(/SITES = '''([\s\S]*?)'''/)[1])
  .filter(c => (!site || site.split(",").some(x => new URL(c.siteUrl).host.replace(/^www\./, "") === x.trim().replace(/^www\./, ""))) && (site || hour === undefined || c.hour === hour));
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
  } catch (e) {
    failed++;
    console.error(`${cfg.siteUrl}: ${e.message}`);
    await notify(`❌ Blog yazılamadı (${cfg.siteUrl}): ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
