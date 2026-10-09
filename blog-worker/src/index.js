// Günlük blog yazarı (n8n "Cornergroup Blog Generator" karşılığı).
// Akış: yayındaki _blog-index.json -> konu (Claude Haiku, JSON) -> makale (Claude Opus, markdown)
//       -> Pexels görseli -> content/<host>/blog/<slug>.md GitHub'a commit
//       -> GitHub Action (.github/workflows/blog-deploy.yml) build alıp Pages'e yükler.
// Secret'lar: ANTHROPIC_API_KEY, PEXELS_API_KEY, GITHUB_TOKEN, (opsiyonel) TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID

const CATEGORIES = ["Strateji", "Otomasyon", "Vaka Çalışması", "Trendler", "Rehber"];
const BRANDS = `- SAAS Corner: outbound satış, lead generation, B2B prospecting
- Sales Corner: satış metodolojileri, satış otomasyonu, pipeline yönetimi
- CRM Corner: HubSpot, Pipedrive, Zoho kurulum ve optimizasyonu
- Brand Corner: influencer pazarlama, marka konumlandırma
- Social Media Corner: LinkedIn ve Instagram stratejileri
- Ortak: yapay zeka, n8n otomasyonları, çok markalı büyüme yönetimi`;
const TOPIC_TYPES = "araç karşılaştırması, yapay zeka uygulaması, sektör rehberi, vaka çalışması, trend analizi, süreç anlatımı, sık yapılan hatalar";

const slugify = s => s.toLocaleLowerCase("tr")
  .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");

function metaDescription(md, max = 155) {
  const text = md.split("\n").map(l => l.trim()).find(l => l && !/^[#>*\-\d]/.test(l)) || "";
  const s = text.replace(/\*\*?|\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max), dot = cut.lastIndexOf(". ");
  return dot > 80 ? cut.slice(0, dot + 1) : cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–-]$/, "") + "…";
}

// Anthropic Messages API. JSON istenen çağrılarda yanıttaki ilk "{" ile son "}" arası ayrıştırılır.
async function claude(env, model, prompt, { json = false, maxTokens = 2048 } = {}) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`Claude ${model} ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const d = await r.json();
  const text = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  if (!text) throw new Error(`Claude ${model} boş yanıt: ${JSON.stringify(d).slice(0, 300)}`);
  if (d.stop_reason === "max_tokens") throw new Error(`Claude ${model} yanıtı yarıda kesildi (max_tokens)`);
  if (!json) return text;
  return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
}

async function loadIndex(cfg) {
  const r = await fetch(`${cfg.siteUrl}/_blog-index.json`, { cf: { cacheTtl: 0 } });
  return r.ok ? r.json() : [];
}

async function pickTopic(env, cfg, index) {
  const counts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  index.forEach(p => { if (p.category in counts) counts[p.category]++; });
  const recent = [...index].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 10).map(p => `- ${p.title}`).join("\n");
  const prompt = `Sen ${cfg.brand} için B2B içerik stratejistisin. Bugün yayınlanacak tek bir blog yazısı konusu seç.

Markalar ve odakları:
${BRANDS}

Konu türleri: ${TOPIC_TYPES}
Kategoriler: ${CATEGORIES.join(", ")}
Mevcut kategori dağılımı: ${JSON.stringify(counts)} (az işlenen kategoriye ve markaya öncelik ver)

Son yazılar (bunları ya da çok benzerlerini TEKRARLAMA):
${recent || "- (yok)"}

Yalnızca şu JSON'u döndür: {"topic": "Türkçe başlık, en fazla 60 karakter", "category": "kategorilerden biri", "slug": "basliktan-kisa-slug", "description": "Türkçe meta açıklama, 140-155 karakter, tam cümle", "imageQuery": "konuyu anlatan 2-4 kelimelik İngilizce stok fotoğraf araması (somut sahne: ofis, ekip, ekran, toplantı; kelime oyunu yok)"}`;
  const t = await claude(env, cfg.topicModel, prompt, { json: true });
  if (!t.topic) throw new Error("Konu üretilemedi: " + JSON.stringify(t));
  if (!CATEGORIES.includes(t.category)) t.category = "Rehber";
  return t;
}

async function writeArticle(env, cfg, topic) {
  const prompt = `${cfg.brand} adına profesyonel, özgün bir B2B blog makalesi yaz.

Başlık: ${topic.topic}
Kategori: ${topic.category}

Kurallar:
- Türkçe, en az 2000 kelime, somut örnekler, adımlar ve rakamlarla.
- Markdown kullan: ara başlıklar "## " ve gerekirse "### ", listeler "- " veya "1. ", vurgu **kalın**.
- Başlığı (H1) YAZMA; doğrudan 1-2 paragraflık bir girişle başla.
- "Giriş:", "Bölüm 1:", "Makale Başlığı:" gibi iskelet etiketleri KULLANMA.
- Son bölüm "## Sonuç" olsun ve ${cfg.brand} ile iletişime geçmeye davet eden kısa bir çağrıyla bitsin.
- Uydurma istatistik, kaynak ya da müşteri adı verme; genel ifadeler kullan.
- Yalnızca makale metnini döndür.`;
  let md = await claude(env, cfg.writeModel, prompt, { maxTokens: 16000 });
  md = md.replace(/^```(?:markdown)?\s*|\s*```$/g, "").replace(/^#\s+.*\n+/, "").trim();
  if (md.split(/\s+/).length < 800) throw new Error(`Makale çok kısa (${md.split(/\s+/).length} kelime)`);
  return md;
}

async function pickImage(env, topic, index) {
  const used = new Set(index.map(p => p.image));
  const q = topic.imageQuery || topic.topic.split(/\s+/).slice(0, 3).join(" ") + " business technology";
  for (const query of [q, "business technology"]) {
    const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      { headers: { authorization: env.PEXELS_API_KEY } });
    if (!r.ok) throw new Error(`Pexels ${r.status}`);
    const photos = (await r.json()).photos.filter(p => !used.has(p.src.large));
    if (photos.length) {
      const p = photos[Math.floor(Math.random() * photos.length)];
      return { url: p.src.large, alt: p.alt || topic.topic };
    }
  }
  throw new Error("Uygun Pexels görseli yok");
}

async function gh(env, cfg, path, init = {}) {
  const r = await fetch(`https://api.github.com/repos/${cfg.repo}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: "application/vnd.github+json", "user-agent": "corner-blog-worker", ...(init.body ? { "content-type": "application/json" } : {}) },
  });
  if (!r.ok && r.status !== 404) throw new Error(`GitHub ${path} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 404 ? null : r.json();
}

const b64 = s => { const b = new TextEncoder().encode(s); let bin = ""; for (const x of b) bin += String.fromCharCode(x); return btoa(bin); };

async function commitPost(env, cfg, slug, content, message) {
  let path = `${cfg.contentDir}/${slug}.md`;
  for (let i = 2; await gh(env, cfg, `/contents/${path}?ref=${cfg.branch}`); i++) path = `${cfg.contentDir}/${slug}-${i}.md`;
  const res = await gh(env, cfg, `/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: b64(content), branch: cfg.branch, committer: { name: "Corner Blog Bot", email: "blog-bot@users.noreply.github.com" } }),
  });
  return { path, url: res.content.html_url };
}

async function notify(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  }).catch(() => {});
}

// Bir site için yazı üretir: { topic, slug, fm, body, md }. Commit etmez.
export async function generate(env, cfg) {
  const index = await loadIndex(cfg);
  const topic = await pickTopic(env, cfg, index);
  const slug = slugify(topic.slug || topic.topic) || slugify(topic.topic);
  if (index.some(p => p.slug === slug)) throw new Error(`Slug zaten var: ${slug}`);
  const body = await writeArticle(env, cfg, topic);
  const img = await pickImage(env, topic, index);
  const today = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); // TR saati
  const fm = { title: topic.topic, description: (topic.description || "").length >= 80 && topic.description.length <= 170 ? topic.description : metaDescription(body), date: today, category: topic.category, image: img.url, imageAlt: img.alt };
  const md = `---\n${Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n")}\n---\n\n${body}\n`;
  return { topic, slug, fm, body, md };
}

export async function run(env, { dryRun = false } = {}) {
  const sites = JSON.parse(env.SITES);
  const out = [];
  for (const cfg of sites) {
    try {
      const { topic, slug, fm, body, md } = await generate(env, cfg);
      if (dryRun) { out.push({ site: cfg.siteUrl, slug, fm, words: body.split(/\s+/).length, preview: body.slice(0, 400) }); continue; }
      const c = await commitPost(env, cfg, slug, md, `blog: ${topic.topic}`);
      const postUrl = `${cfg.siteUrl}/blog/${c.path.split("/").pop().replace(/\.md$/, "")}`;
      out.push({ site: cfg.siteUrl, path: c.path, postUrl });
      await notify(env, `✅ Yeni blog (${topic.category}): ${topic.topic}\n${postUrl}\n(yayına çıkması 2-3 dakika sürer)`);
    } catch (e) {
      out.push({ site: cfg.siteUrl, error: e.message });
      await notify(env, `❌ Blog yazılamadı (${cfg.siteUrl}): ${e.message}`);
    }
  }
  return out;
}

export default {
  async scheduled(_event, env, ctx) { ctx.waitUntil(run(env).then(r => console.log(JSON.stringify(r)))); },
  // Elle tetikleme: GET /run?key=<RUN_KEY>[&dry=1]  (dry=1 commit etmez, önizleme döner)
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname !== "/run" || !env.RUN_KEY || u.searchParams.get("key") !== env.RUN_KEY) return new Response("Not found", { status: 404 });
    return Response.json(await run(env, { dryRun: u.searchParams.get("dry") === "1" }));
  },
};
