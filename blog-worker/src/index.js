// Günlük blog yazarı (n8n "Cornergroup Blog Generator" karşılığı), SITES'taki her site için günde bir yazı.
// Akış: yayındaki _blog-index.json -> konu (Claude Haiku, JSON) -> makale (Claude Opus, markdown, iç linkli)
//       -> Pexels görseli -> content/<host>/blog/<slug>.md GitHub'a commit
//       -> GitHub Action (.github/workflows/blog-deploy.yml) build alıp Pages'e yükler.
// Secret'lar: ANTHROPIC_API_KEY, PEXELS_API_KEY, GITHUB_TOKEN, (opsiyonel) TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID

const TOPIC_TYPES = "araç karşılaştırması, yapay zeka uygulaması, sektör rehberi, vaka çalışması, trend analizi, süreç anlatımı, sık yapılan hatalar";
const TOPIC_TYPES_EN = "tool comparison, applied AI, industry guide, case study, trend analysis, process walkthrough, common mistakes";

// Grup siteleri arasında çapraz link: her yazı, kendi sitesi hariç bu listeden link verebilir
const GROUP = [
  { url: "https://saascorner.co", tr: "SAAS Corner: B2B SaaS için outbound satış ve lead generation hizmeti", en: "SAAS Corner: outbound sales and lead generation for B2B SaaS" },
  { url: "https://salescorner.co", tr: "Sales Corner: veri odaklı B2B satış ve lead generation", en: "Sales Corner: data-driven B2B sales and lead generation" },
  { url: "https://socialmediacorner.co", tr: "Social Media Corner: B2B LinkedIn ve Instagram yönetimi", en: "Social Media Corner: B2B LinkedIn and Instagram management" },
  { url: "https://www.brandcorner.co", tr: "Brand Corner: influencer pazarlama platformu", en: "Brand Corner: influencer marketing platform" },
  { url: "https://cornergroup.co", tr: "Corner Group: grubun çatı şirketi, strateji ve otomasyon", en: "Corner Group: the group's parent company, strategy and automation" },
  { url: "https://www.yalcinberkay.com.tr", tr: "Berkay Yalçın: grubun kurucusunun kişisel blogu", en: "Berkay Yalçın: personal blog of the group's founder" },
];
// Apollo referans linki: yalnızca prospecting / lead verisi / outbound konularında, en fazla bir kez
export const APOLLO = "https://get.apollo.io/679irkzm35ya";
const sisters = cfg => GROUP.filter(g => new URL(g.url).host.replace(/^www\./, "") !== new URL(cfg.siteUrl).host.replace(/^www\./, ""));

export const slugify = s => s.toLocaleLowerCase("tr")
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
export async function claude(env, model, prompt, { json = false, maxTokens = 2048 } = {}) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    // Uzun yazılar 100 sn'yi aşınca akışsız istek 524 ile düşüyor; akış bağlantıyı açık tutar
    body: JSON.stringify({ model, max_tokens: maxTokens, stream: true, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`Claude ${model} ${r.status}: ${(await r.text()).slice(0, 300)}`);
  // Ücretsiz plandaki CPU sınırı için olay başına JSON.parse yerine tek seferde çözülür
  const dec = new TextDecoder();
  let raw = "";
  for await (const chunk of r.body) raw += dec.decode(chunk, { stream: true });
  raw += dec.decode();
  if (raw.includes('"type":"error"')) throw new Error(`Claude ${model} akış hatası: ${raw.slice(raw.indexOf('"type":"error"'), raw.indexOf('"type":"error"') + 300)}`);
  const lits = [];
  for (const m of raw.matchAll(/"type":"text_delta","text":("(?:[^"\\]|\\.)*")/g)) lits.push(m[1]);
  const text = JSON.parse(`[${lits.join(",")}]`).join("");
  const stop = (raw.match(/"stop_reason":"(\w+)"/) || [])[1];
  if (!text) throw new Error(`Claude ${model} boş yanıt`);
  const cut = stop === "max_tokens";
  if (!json) {
    if (cut) throw new Error(`Claude ${model} yanıtı yarıda kesildi (max_tokens)`);
    return text;
  }
  // JSON tamamlandıysa ardından gelen açıklama kesilmiş olsa da kullanılır
  try { return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); }
  catch (e) { throw new Error(`Claude ${model} ${cut ? "yanıtı yarıda kesildi (max_tokens)" : "geçersiz JSON"}: ${text.slice(0, 200)}`); }
}

async function loadIndex(cfg) {
  const r = await fetch(`${cfg.siteUrl}/_blog-index.json`, { cf: { cacheTtl: 0 } });
  return r.ok ? r.json() : [];
}

const byDate = index => [...index].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

// Konuya en yakın mevcut yazılar (başlık/kategori kelime örtüşmesi); iç link adayı olarak yazara verilir
const words = s => new Set(slugify(s || "").split("-").filter(w => w.length > 3));
function relatedPosts(index, topic, n = 25) {
  const t = words(topic.topic + " " + topic.category);
  return byDate(index)
    .map((p, i) => ({ p, score: [...words(p.title)].filter(w => t.has(w)).length * 3 + (p.category === topic.category ? 2 : 0) - i / 1000 }))
    .sort((a, b) => b.score - a.score).slice(0, n).map(x => x.p);
}

// Yalnızca var olan sayfalara giden linkler kalır; uydurma ya da dış linkler düz metne çevrilir
function cleanLinks(md, cfg, index) {
  const ok = new Set([...index.map(p => `/blog/${p.slug}`), ...(cfg.pages || []).map(p => p.path), ...sisters(cfg).map(g => g.url), APOLLO]);
  let kept = 0, apollo = 0;
  const out = md.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, href) => {
    if (href.replace(/\/+$/, "") === APOLLO && apollo++) return text;
    const h = href.replace(cfg.siteUrl, "").replace(/\/+$/, "") || "/";
    if (ok.has(h) || ok.has(href.replace(/\/+$/, ""))) { kept++; return `[${text}](${ok.has(h) ? h : href.replace(/\/+$/, "")})`; }
    return text;
  });
  return { md: out, links: kept };
}

async function pickTopic(env, cfg, index) {
  const cats = cfg.categories;
  const counts = Object.fromEntries(cats.map(c => [c, 0]));
  index.forEach(p => { if (p.category in counts) counts[p.category]++; });
  const titles = byDate(index).slice(0, 250).map(p => `- ${p.title}`).join("\n");
  const prompt = cfg.lang === "en" ? `You are the content strategist for ${cfg.brand} (${cfg.siteUrl}). Pick a single blog post topic to publish today.

Site focus: ${cfg.focus}

Topic types: ${TOPIC_TYPES_EN}
Categories: ${cats.join(", ")}
Current category counts: ${JSON.stringify(counts)} (prefer the least covered category)
The topic must answer a concrete question or problem that B2B decision makers actually search for on Google.

Existing posts on the site (do NOT repeat these or anything very similar):
${titles || "- (none)"}

Return only this JSON: {"topic": "English title, max 60 characters", "category": "one of the categories", "slug": "short-slug-from-title", "description": "English meta description, 140-155 characters, full sentence", "imageQuery": "2-4 word English stock photo search describing the topic (a concrete scene: office, team, screen, meeting; no wordplay)"}` : `Sen ${cfg.brand} (${cfg.siteUrl}) için B2B içerik stratejistisin. Bugün yayınlanacak tek bir blog yazısı konusu seç.

Sitenin odağı: ${cfg.focus}

Konu türleri: ${TOPIC_TYPES}
Kategoriler: ${cats.join(", ")}
Mevcut kategori dağılımı: ${JSON.stringify(counts)} (az işlenen kategoriye öncelik ver)
Konu, Türkiye'deki B2B karar vericilerin Google'da gerçekten arayacağı somut bir soruya ya da probleme cevap versin.

Sitedeki mevcut yazılar (bunları ya da çok benzerlerini TEKRARLAMA):
${titles || "- (yok)"}

Yalnızca şu JSON'u döndür: {"topic": "Türkçe başlık, en fazla 60 karakter", "category": "kategorilerden biri", "slug": "basliktan-kisa-slug", "description": "Türkçe meta açıklama, 140-155 karakter, tam cümle", "imageQuery": "konuyu anlatan 2-4 kelimelik İngilizce stok fotoğraf araması (somut sahne: ofis, ekip, ekran, toplantı; kelime oyunu yok)"}`;
  const t = await claude(env, cfg.topicModel, prompt, { json: true, maxTokens: 4096 });
  if (!t.topic) throw new Error("Konu üretilemedi: " + JSON.stringify(t));
  if (!cats.includes(t.category)) t.category = cats[0];
  return t;
}

async function writeArticle(env, cfg, topic, index) {
  const related = relatedPosts(index, topic).map(p => `- [${p.title}](/blog/${p.slug})`).join("\n");
  const en = cfg.lang === "en";
  const pages = (cfg.pages || []).map(p => `- [${p.label}](${p.path})`).join("\n");
  const group = sisters(cfg).map(g => `- [${en ? g.en : g.tr}](${g.url})`).join("\n");
  const prompt = en ? `Write a professional, original blog article for ${cfg.brand}.

Title: ${topic.topic}
Category: ${topic.category}
Site focus: ${cfg.focus}${cfg.voice ? `\nVoice: ${cfg.voice}` : ""}

Existing posts you may link to:
${related || "- (none)"}

Site pages:
${pages}

Sister companies in the group:
${group}

Apollo.io referral link: ${APOLLO}

Rules:
- English, at least 1500 words, with concrete examples, steps and numbers.
- Use Markdown: subheadings "## " and if needed "### ", lists "- " or "1. ", emphasis **bold**.
- Do NOT write the title (H1); start directly with a 1-2 paragraph introduction.
- Do NOT use scaffolding labels such as "Introduction:", "Section 1:", "Article title:".
- The last section is "## Conclusion" and ends with a short invitation to get in touch.
- Do not invent statistics, sources or customer names; use general statements.
- Where genuinely relevant, add 2-4 internal links from the list above: [meaningful anchor text](/blog/slug). Anchor text describes the target post, never "click here". Link each post at most once.
- Where it fits naturally, link 1-2 sister companies from the list with descriptive anchor text (e.g. lead generation -> SAAS Corner, LinkedIn -> Social Media Corner, influencers -> Brand Corner). Do not force it.
- Only if the topic involves prospecting, B2B contact data, lead lists or outbound email, you may link the Apollo.io referral link ONCE with natural anchor text (e.g. [Apollo.io](${APOLLO})). Otherwise do not mention it.
- In the conclusion's call to action, link one of the site pages (e.g. contact).
- Do not link to any URL that is not in these lists.
- Return only the article text.` : `${cfg.brand} adına profesyonel, özgün bir B2B blog makalesi yaz.

Başlık: ${topic.topic}
Kategori: ${topic.category}
Sitenin odağı: ${cfg.focus}

İç link verilebilecek mevcut yazılar:
${related || "- (yok)"}

Site sayfaları:
${pages}

Gruptaki kardeş şirketler:
${group}

Apollo.io referans linki: ${APOLLO}

Kurallar:
- Türkçe, en az 2000 kelime, somut örnekler, adımlar ve rakamlarla.
- Markdown kullan: ara başlıklar "## " ve gerekirse "### ", listeler "- " veya "1. ", vurgu **kalın**.
- Başlığı (H1) YAZMA; doğrudan 1-2 paragraflık bir girişle başla.
- "Giriş:", "Bölüm 1:", "Makale Başlığı:" gibi iskelet etiketleri KULLANMA.
- Son bölüm "## Sonuç" olsun ve ${cfg.brand} ile iletişime geçmeye davet eden kısa bir çağrıyla bitsin.
- Uydurma istatistik, kaynak ya da müşteri adı verme; genel ifadeler kullan.
- Metnin içine, konuyla gerçekten ilgili olduğu yerlerde yukarıdaki listeden 3-5 iç link ver: [anlamlı bağlam metni](/blog/slug). Bağlantı metni "buraya tıklayın" değil, hedef yazının konusunu anlatan doğal bir ifade olsun. Aynı yazıya bir kez link ver.
- Sonuç bölümündeki çağrıda site sayfalarından birine (ör. iletişim) link ver.
- Konuyla doğal olarak örtüşen yerlerde listeden 1-2 kardeş şirkete açıklayıcı bağlantı metniyle link ver (ör. lead generation -> SAAS Corner, LinkedIn -> Social Media Corner, influencer -> Brand Corner). Zorlama.
- Yalnızca konu prospecting, B2B iletişim verisi, lead listesi ya da outbound e-posta ile ilgiliyse Apollo.io referans linkini doğal bir metinle EN FAZLA BİR KEZ ver (ör. [Apollo.io](${APOLLO})). Aksi halde hiç anma.
- Bu listelerde olmayan hiçbir URL'ye link verme.
- Yalnızca makale metnini döndür.`;
  let md = await claude(env, cfg.writeModel, prompt, { maxTokens: 16000 });
  md = md.replace(/^```(?:markdown)?\s*|\s*```$/g, "").replace(/^#\s+.*\n+/, "").trim();
  if (md.split(/\s+/).length < (en ? 700 : 800)) throw new Error(`Makale çok kısa (${md.split(/\s+/).length} kelime)`);
  return cleanLinks(md, cfg, index);
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
      return { url: p.src.large, alt: topic.topic }; // Pexels açıklaması İngilizce, Türkçe başlık kullanılır
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

const b64 = s => { const b = new TextEncoder().encode(s); let bin = ""; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(bin); };

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
  const { md: body, links } = await writeArticle(env, cfg, topic, index);
  const img = await pickImage(env, topic, index);
  const today = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); // TR saati
  const fm = { title: topic.topic, description: (topic.description || "").length >= 80 && topic.description.length <= 170 ? topic.description : metaDescription(body), date: today, category: topic.category, image: img.url, imageAlt: img.alt };
  const md = `---\n${Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n")}\n---\n\n${body}\n`;
  return { topic, slug, fm, body, md, links };
}

// site: yalnız o host (ör. "saascorner.co"); hour: cron saatinde "hour" alanı eşleşen siteler
export async function run(env, { dryRun = false, site, hour } = {}) {
  const sites = JSON.parse(env.SITES).filter(c => (!site || site.split(",").some(x => new URL(c.siteUrl).host.replace(/^www\./, "") === x.trim().replace(/^www\./, ""))) && (hour === undefined || c.hour === hour));
  const out = [];
  for (const cfg of sites) {
    try {
      // Claude'a para harcamadan önce yazma izni denenir: referanssız blob zararsızdır, GitHub temizler
      if (!dryRun) await gh(env, cfg, "/git/blobs", { method: "POST", body: JSON.stringify({ content: "izin-testi", encoding: "utf-8" }) });
      const { topic, slug, fm, body, md, links } = await generate(env, cfg);
      if (dryRun) { out.push({ site: cfg.siteUrl, slug, fm, words: body.split(/\s+/).length, links, preview: body.slice(0, 400) }); continue; }
      const c = await commitPost(env, cfg, slug, md, `blog: ${topic.topic}`);
      const postUrl = `${cfg.siteUrl}/blog/${c.path.split("/").pop().replace(/\.md$/, "")}`;
      out.push({ site: cfg.siteUrl, path: c.path, postUrl, links });
      await notify(env, `✅ Yeni blog (${topic.category}): ${topic.topic}\n${postUrl}\n(yayına çıkması 2-3 dakika sürer)`);
    } catch (e) {
      out.push({ site: cfg.siteUrl, error: e.message });
      await notify(env, `❌ Blog yazılamadı (${cfg.siteUrl}): ${e.message}`);
    }
  }
  return out;
}

export default {
  async scheduled(event, env, ctx) {
    const hour = new Date(event.scheduledTime).getUTCHours();
    ctx.waitUntil(run(env, { hour }).then(r => r.length && console.log(JSON.stringify(r))));
  },
  // Elle tetikleme: GET /run?key=<RUN_KEY>[&site=saascorner.co][&dry=1]  (dry=1 commit etmez, önizleme döner)
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname !== "/run" || !env.RUN_KEY || u.searchParams.get("key") !== env.RUN_KEY) return new Response("Not found", { status: 404 });
    return Response.json(await run(env, { dryRun: u.searchParams.get("dry") === "1", site: u.searchParams.get("site") || undefined }));
  },
};
