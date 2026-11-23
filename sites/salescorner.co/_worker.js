// salescorner.co /api/* uçları (eski n8n webhook'larının yerine). Statik sayfalar env.ASSETS'ten gelir.
// Gereken gizli değer: ANTHROPIC_API_KEY (Pages secret). Google Slides yerine raporlar /api/rapor#<veri> görüntüleyicisinde açılır;
// veri adresin # kısmında taşınır, sunucuda saklanmaz.
const MODEL = "claude-opus-5-5";
const HDR = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" };
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: HDR });
const fail = (m, s = 400) => J({ success: false, status: "error", message: m, error: m }, s);
const str = (v, n = 2000) => String(v ?? "").slice(0, n).trim();
const num = v => { const n = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : 0; };
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const pctTxt = (a, b) => "%" + String(pct(a, b)).replace(".", ",");
const arr = (v, n = 20) => (Array.isArray(v) ? v : []).slice(0, n);
const lines = (s, n = 60) => str(s, 8000).split(/\n+/).map(x => x.trim()).filter(Boolean).slice(0, n);
const readBody = async req => { try { return await req.json(); } catch { return {}; } };

// ---------- base64url + sıkıştırma ----------
const b64uBytes = b => { let bin = ""; for (let i = 0; i < b.length; i += 8192) bin += String.fromCharCode(...b.subarray(i, i + 8192)); return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
const b64u = s => b64uBytes(new TextEncoder().encode(s));
async function packId(o) {
  const st = new Blob([JSON.stringify(o)]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return b64uBytes(new Uint8Array(await new Response(st).arrayBuffer()));
}
async function unpackId(s) {
  const st = new Blob([unb64u(s)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return JSON.parse(await new Response(st).text());
}
// Rapor: {t başlık, s alt başlık, d tarih, sl:[{b başlık, k:[[etiket, değer]], m:[madde], n:not}]}
function reportLinks(origin, rep) {
  const h = b64u(JSON.stringify(rep));
  return { presentationUrl: `${origin}/api/rapor#${h}`, presentationViewUrl: `${origin}/api/rapor?sunum=1#${h}` };
}
// Claude'un {slides:[{baslik, maddeler, not}]} çıktısını rapor slaytına çevirir
const aiSlides = list => arr(list, 14).map(x => ({ b: str(x?.baslik, 160), m: arr(x?.maddeler, 10).map(m => str(m, 600)), n: str(x?.not, 3000) })).filter(x => x.b);

// ---------- Claude ----------
// Akışlı istek (uzun yanıtta 524 olmasın); CPU için olaylar tek seferde çözülür (blog-worker claude() ile aynı yol)
async function claude(env, content, { system, max = 8000, json = true } = {}) {
  if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY tanımlı değil");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: max, stream: true, output_config: { effort: "low" }, ...(system ? { system } : {}), messages: [{ role: "user", content }] }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const dec = new TextDecoder();
  let raw = "";
  for await (const chunk of r.body) raw += dec.decode(chunk, { stream: true });
  raw += dec.decode();
  if (raw.includes('"type":"error"')) throw new Error("Claude akış hatası: " + raw.slice(raw.indexOf('"type":"error"'), raw.indexOf('"type":"error"') + 300));
  const lits = [];
  for (const m of raw.matchAll(/"type":"text_delta","text":("(?:[^"\\]|\\.)*")/g)) lits.push(m[1]);
  const text = JSON.parse(`[${lits.join(",")}]`).join("");
  const stop = (raw.match(/"stop_reason":"(\w+)"/) || [])[1];
  if (!text) throw new Error(stop === "refusal" ? "İstek model tarafından reddedildi" : "Claude boş yanıt");
  if (!json) return text;
  try { return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); }
  catch { throw new Error(`Claude ${stop === "max_tokens" ? "yanıtı yarıda kesildi" : "geçersiz JSON"}`); }
}
const SYS = "Sen Sales Corner'ın (salescorner.co) B2B satış analisti ve yazarı yapay zekâsın. Sales Corner hizmetleri: HubSpot entegrasyonu, AI otomasyonu, lead generation (LinkedIn + cold call + e-posta outbound), rakip analizi ve teklif hazırlama. Türkçe, net ve somut yaz; uydurma rakam verme, tahminleri 'tahmini' diye işaretle. Yalnızca istenen JSON nesnesini döndür, başka metin yazma.";

// ---------- web sayfası okuma ----------
const normUrl = s => {
  s = str(s, 500);
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u.href : ""; } catch { return ""; }
};
const ent = s => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const htmlText = h => ent(h.replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
async function getPage(url, maxText = 12000) {
  const u = normUrl(url);
  if (!u) return { url: "", html: "", text: "", error: "geçersiz adres" };
  try {
    const r = await fetch(u, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; SalesCornerBot/1.0; +https://salescorner.co)", accept: "text/html,*/*" }, signal: AbortSignal.timeout(12000) });
    const html = (await r.text()).slice(0, 400000);
    return { url: r.url || u, status: r.status, html, text: htmlText(html).slice(0, maxText), error: r.ok ? "" : `HTTP ${r.status}` };
  } catch (e) { return { url: u, status: 0, html: "", text: "", error: String(e?.message || e).slice(0, 120) }; }
}
const tag = (html, re) => ent(((html.match(re) || [])[1] || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const metaDesc = html => tag(html, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) || tag(html, /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);

// İstek salescorner.co (veya önizleme / yerel) sayfasından mı?
function sameSite(req) {
  const h = req.headers.get("origin") || req.headers.get("referer");
  if (!h) return req.headers.get("sec-fetch-site") === "same-origin";
  try { const n = new URL(h).hostname; return n === "salescorner.co" || n.endsWith(".salescorner.co") || n.endsWith(".pages.dev") || n === "localhost" || n === "127.0.0.1"; } catch { return false; }
}

// ---------- 1) Haftalık rapor (analiz) ----------
async function analiz(req, env, origin) {
  const b = await readBody(req);
  const t = Number(b._formLoadedAt) || 0;
  if (!b._token || b._token !== ((t >>> 0) ^ 1515870810).toString(36)) return fail("Form doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.");
  const musteri = str(b.musteri_adi, 120) || "Müşteri";
  const li = { baglanti: num(b.linkedin_baglanti), mesaj: num(b.linkedin_mesaj), olumlu: num(b.linkedin_cevap_olumlu), olumsuz: num(b.linkedin_cevap_olumsuz) };
  const cc = { toplam: num(b.cc_toplam), ulasilan: num(b.cc_ulasilan), olumlu: num(b.cc_olumlu) };
  const gercek = lines(b.gerceklesen_gorusmeler), plan = lines(b.planlanan_gorusmeler);
  const liCevap = li.olumlu + li.olumsuz;

  // Herkese açık (bağlantıya sahip herkes görüntüleyebilir) Google Sheet varsa CSV olarak okunur; okunamazsa geçilir
  let sheet = "";
  const id = (str(b.google_sheet_url, 500).match(/\/spreadsheets\/d\/([\w-]{20,})/) || [])[1];
  if (id) {
    try {
      const r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(str(b.sheet_name, 100) || "Sheet1")}`, { signal: AbortSignal.timeout(10000) });
      const ct = r.headers.get("content-type") || "";
      if (r.ok && !ct.includes("html")) sheet = (await r.text()).slice(0, 10000);
    } catch {}
  }

  const slides = [
    { b: "Haftanın Özeti", k: [["LinkedIn bağlantı", li.baglanti], ["LinkedIn mesaj", li.mesaj], ["LinkedIn olumlu cevap", li.olumlu], ["Cold call", cc.toplam], ["Ulaşılan", cc.ulasilan], ["Cold call olumlu", cc.olumlu], ["Gerçekleşen görüşme", gercek.length], ["Planlanan görüşme", plan.length]] },
    { b: "LinkedIn Performansı", k: [["Bağlantı", li.baglanti], ["Mesaj", li.mesaj], ["Cevap oranı", pctTxt(liCevap, li.mesaj)], ["Olumlu cevap oranı", pctTxt(li.olumlu, li.mesaj)], ["Olumlu / toplam cevap", pctTxt(li.olumlu, liCevap)], ["Olumsuz cevap", li.olumsuz]] },
    { b: "Cold Call Performansı", k: [["Toplam arama", cc.toplam], ["Ulaşılan", cc.ulasilan], ["Ulaşma oranı", pctTxt(cc.ulasilan, cc.toplam)], ["Olumlu", cc.olumlu], ["Olumlu / ulaşılan", pctTxt(cc.olumlu, cc.ulasilan)], ["Olumlu / toplam", pctTxt(cc.olumlu, cc.toplam)]] },
    { b: "Huni", k: [["LinkedIn mesaj → olumlu", `${li.mesaj} → ${li.olumlu}`], ["Arama → olumlu", `${cc.toplam} → ${cc.olumlu}`], ["Olumlu temas toplamı", li.olumlu + cc.olumlu], ["Gerçekleşen görüşme", gercek.length], ["Olumlu temas → görüşme", pctTxt(gercek.length, li.olumlu + cc.olumlu)], ["Planlanan görüşme", plan.length]] },
  ];
  if (gercek.length) slides.push({ b: `Gerçekleşen Görüşmeler (${gercek.length})`, m: gercek.map(x => x.split("|").map(s => s.trim()).filter(Boolean).join(" · ")) });
  if (plan.length) slides.push({ b: `Planlanan Görüşmeler (${plan.length})`, m: plan.map(x => x.split("|").map(s => s.trim()).filter(Boolean).join(" · ")) });

  let ozet = "";
  try {
    const ai = await claude(env, `Aşağıdaki haftalık outbound satış verisinden müşteriye sunulacak rapor için yorum slaytları yaz.
Müşteri: ${musteri}
Dönem: ${str(b.rapor_donemi, 100)} (rapor tarihi ${str(b.rapor_tarihi, 40)})
LinkedIn: bağlantı ${li.baglanti}, mesaj ${li.mesaj}, olumlu cevap ${li.olumlu}, olumsuz cevap ${li.olumsuz}
Cold call: toplam ${cc.toplam}, ulaşılan ${cc.ulasilan}, olumlu ${cc.olumlu}
Gerçekleşen görüşmeler (Firma | Kişi | Title | Tarih):
${gercek.join("\n") || "-"}
Planlanan görüşmeler:
${plan.join("\n") || "-"}
${sheet ? `Müşterinin tablo verisi (CSV, kısaltılmış):\n${sheet}` : ""}

JSON biçimi: {"ozet":"2-3 cümlelik yönetici özeti","slides":[{"baslik":"...","maddeler":["..."],"not":"kısa konuşmacı notu"}]}
4-6 slayt: Yönetici özeti, Öne çıkanlar, LinkedIn yorumu, Cold call yorumu, Görüşme kalitesi ve pipeline, Gelecek hafta aksiyon planı. Her slaytta 3-5 kısa madde; oranları verilen sayılardan hesapla.`, { system: SYS, max: 6000 });
    ozet = str(ai.ozet, 800);
    slides.splice(1, 0, ...aiSlides(ai.slides));
  } catch (e) {
    console.log("analiz ai", e.message);
    slides.push({ b: "Not", m: ["Yapay zekâ yorumu bu sefer üretilemedi; yukarıdaki sayılar form verisinden hesaplandı."] });
  }
  if (ozet) slides[0].m = [ozet];
  const rep = { t: `${musteri} · Haftalık Satış Raporu`, s: str(b.rapor_donemi, 100), d: str(b.rapor_tarihi, 40), sl: slides };
  return J({ success: true, ...reportLinks(origin, rep), company: musteri, slideCount: slides.length, message: `${musteri} raporu oluşturuldu! ${slides.length} slide hazır.` });
}

// ---------- 2) Toplantı brifingi ----------
async function briefing(req, env, origin) {
  const b = await readBody(req);
  const firma = str(b.firma_adi, 120), kisi = str(b.kisi_adi, 120);
  if (!firma && !b.firma_website) return fail("Firma adı veya web sitesi gerekli.");
  const site = await getPage(b.firma_website, 10000);
  const ai = await claude(env, `Bir satış toplantısı öncesi brifing hazırla.
Firma: ${firma} · Web: ${site.url || str(b.firma_website, 300)} · LinkedIn: ${str(b.firma_linkedin, 300)}
Kişi: ${kisi} · ${str(b.kisi_email, 200)} · LinkedIn: ${str(b.kisi_linkedin, 300)}
Toplantı: ${str(b.toplanti_tarihi, 40)} ${str(b.toplanti_saati, 20)} · Konu: ${str(b.toplanti_konusu, 500)}
Web sitesi metni (kısaltılmış): ${site.text || "(okunamadı)"}

JSON: {"f_skor":0-100 firma uygunluk puanı,"k_skor":0-100 kişi karar verici puanı,"deal_pct":0-100 kapanış olasılığı,"en_uygun_hizmet":"Sales Corner hizmetlerinden biri","slides":[{"baslik":"...","maddeler":["..."],"not":"..."}]}
7-8 slayt: Firma özeti, Kişi ve rolü, Olası ihtiyaçlar/acılar, SPIN - Situation soruları, SPIN - Problem soruları, SPIN - Implication soruları, SPIN - Need-payoff soruları, Toplantı akışı ve sonraki adım. LinkedIn sayfalarını göremiyorsun; kişi hakkında tahminlerini 'tahmini' diye işaretle.`, { system: SYS, max: 7000 });
  const slides = aiSlides(ai.slides);
  const f = Math.round(num(ai.f_skor)), k = Math.round(num(ai.k_skor)), d = Math.round(num(ai.deal_pct));
  slides.unshift({ b: `${firma || site.url} · Toplantı Brifingi`, k: [["Firma skoru", f], ["Kişi skoru", k], ["Kapanış olasılığı", `%${d}`], ["En uygun hizmet", str(ai.en_uygun_hizmet, 80)], ["Toplantı", `${str(b.toplanti_tarihi, 40)} ${str(b.toplanti_saati, 20)}`.trim()]] });
  const rep = { t: `${firma} · Toplantı Brifingi`, s: kisi, d: str(b.toplanti_tarihi, 40), sl: slides };
  return J({ success: true, firma_adi: firma, kisi_adi: kisi, toplanti_tarihi: str(b.toplanti_tarihi, 40), f_skor: f, k_skor: k, deal_pct_label: `%${d}`, en_uygun_hizmet: str(ai.en_uygun_hizmet, 120), slideCount: slides.length, ...reportLinks(origin, rep), message: `${firma} brifingi hazır (${slides.length} slayt).` });
}

// ---------- 3) SEO robotu ----------
async function seoAnalyze(req, env) {
  const b = await readBody(req);
  const p = await getPage(b.website_url, 8000);
  if (!p.html) return fail(`Sayfa okunamadı: ${p.error || "boş yanıt"}`);
  const h = p.html;
  const title = tag(h, /<title[^>]*>([\s\S]*?)<\/title>/i), md = metaDesc(h);
  const h1s = [...h.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => htmlText(m[1])).filter(Boolean);
  const h2s = [...h.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => htmlText(m[1])).filter(Boolean).slice(0, 20);
  const words = htmlText(h).split(" ").filter(w => w.length > 1).length;
  const issues = [];
  const tq = !title ? (issues.push("Sayfada <title> yok"), 0) : title.length >= 30 && title.length <= 60 ? 20 : (issues.push(`Başlık uzunluğu ${title.length} karakter (önerilen 30-60)`), 12);
  const mq = !md ? (issues.push("Meta açıklama yok"), 0) : md.length >= 70 && md.length <= 160 ? 20 : (issues.push(`Meta açıklama ${md.length} karakter (önerilen 70-160)`), 12);
  const hq = h1s.length === 1 ? 20 : h1s.length ? (issues.push(`${h1s.length} adet H1 var (tek H1 önerilir)`), 12) : (issues.push("H1 başlığı yok"), 0);
  const cd = words >= 1500 ? 20 : words >= 800 ? 15 : words >= 300 ? (issues.push(`İçerik kısa (~${words} kelime)`), 10) : (issues.push(`İçerik çok kısa (~${words} kelime)`), 4);
  const has = re => re.test(h);
  const bonusList = [[/<link[^>]+rel=["']canonical/i, "canonical etiketi"], [/property=["']og:title/i, "Open Graph etiketleri"], [/application\/ld\+json/i, "yapılandırılmış veri (schema)"], [/name=["']viewport/i, "viewport etiketi"]];
  let bonus = 0;
  for (const [re, ad] of bonusList) has(re) ? (bonus += 5) : issues.push(`Eksik: ${ad}`);

  let kw = { primary: [], secondary: [], long_tail: [], table: [] }, gen = { parse_error: "İçerik üretilemedi" }, links = [];
  try {
    const ai = await claude(env, `Bu sayfa için SEO anahtar kelime analizi ve yeniden yazılmış içerik üret.
URL: ${p.url}
Title: ${title}
Meta: ${md}
H1: ${h1s.join(" | ")}
H2: ${h2s.join(" | ")}
Metin: ${p.text}

JSON: {"keywords":{"primary":["3 kelime"],"secondary":["5"],"long_tail":["5"],"table":[{"keyword":"","volume":"tahmini aylık arama aralığı, ör. 1K-10K","competition":"Düşük|Orta|Yüksek","intent":"Ticari|Bilgi|Arastirma|Navigasyon","popularity":"Düşük|Orta|Yüksek","featured_snippet":true}]},
"issues":["en fazla 5 ek içerik sorunu"],
"generated_content":{"seo_title":"≤60 karakter","meta_description":"70-155 karakter","slug":"","content":{"intro":"","sections":[{"h2":"","content":"","h3_subheadings":[""]}],"faq":[{"question":"","answer":""}],"conclusion":""},"internal_link_suggestions":[""]}}
Tabloda 10 satır, içerikte 4-5 bölüm ve 4 SSS olsun.`, { system: SYS, max: 9000 });
    const k = ai.keywords || {};
    kw = { primary: arr(k.primary, 5), secondary: arr(k.secondary, 8), long_tail: arr(k.long_tail, 8), table: arr(k.table, 15).map(x => ({ keyword: str(x?.keyword, 100), volume: str(x?.volume, 30), competition: str(x?.competition, 20), intent: str(x?.intent, 20), popularity: str(x?.popularity, 20), featured_snippet: !!x?.featured_snippet })) };
    issues.push(...arr(ai.issues, 5).map(x => str(x, 300)));
    if (ai.generated_content) { gen = ai.generated_content; links = arr(gen.internal_link_suggestions, 10); }
  } catch (e) { console.log("seo ai", e.message); }

  const prim = String(kw.primary[0] || "").toLowerCase();
  const occ = prim ? p.text.toLowerCase().split(prim).length - 1 : 0;
  const dens = words ? (occ / words) * 100 : 0;
  const kd = !prim ? 10 : dens >= 0.5 && dens <= 2.5 ? 20 : occ ? 12 : 5;
  const sum = tq + mq + hq + cd + kd + bonus, total = Math.round(sum / 1.2);
  const [level, color] = total >= 80 ? ["Mükemmel", "green"] : total >= 60 ? ["İyi", "blue"] : total >= 40 ? ["Orta", "amber"] : ["Zayıf", "red"];
  return J({
    url: p.url, analyzed_at: new Date().toISOString(),
    seo_score: { total, level, color, breakdown: { title_quality: tq, meta_desc_quality: mq, h1_quality: hq, content_depth: cd, keyword_density: kd, bonus_points: bonus } },
    page_info: { title, meta_description: md, h1: h1s[0] || "", h2s },
    keywords: kw, volume_summary: { serper_credits_used: 0 }, issues,
    generated_content: { ...gen, internal_link_suggestions: links },
  });
}

// ---------- 4) CV analizi ----------
async function cvAnaliz(req, env) {
  const b = await readBody(req);
  if (b.website) return J({ success: true, cv: {} }); // bal küpü
  const data = str(b.pdf_base64, 15e6).replace(/^data:[^,]*,/, "");
  if (data.length < 100) return fail("PDF dosyası gerekli.");
  const cv = await claude(env, [
    { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
    { type: "text", text: `Bu CV'yi analiz et. JSON:
{"isim":"","pozisyon":"","ozet":"","deneyim_yili":0,"genel_puan":0-100,"cv_skoru":{"format":0-100,"icerik":0-100,"etki":0-100,"okunaklilik":0-100},
"guclu_yonler":[""],"gelistirilmeli":[""],"teknik_beceriler":[""],"yazilim_araclar":[""],"soft_skills":[""],"diller":[""],"sertifikalar":[""],
"deneyim":[{"pozisyon":"","sirket":"","sure":"","aciklama":""}],
"is_uygunluk":[{"rol":"","sektor":"","puan":0-100,"maas_aralik":"Türkiye için tahmini aylık net TL aralığı","aciklama":"","eslesen_beceriler":[""],"eksik_beceriler":[""]}],
"tavsiyeler":[""]}
is_uygunluk 3-5 rol içersin.` },
  ], { system: SYS, max: 7000 });
  return J({ success: true, cv });
}

// ---------- 5) Fotoğraftan LinkedIn gönderisi ----------
async function photoEnhance(req, env) {
  const b = await readBody(req);
  const photos = arr(b.photos, 4).filter(x => x?.data);
  if (!photos.length) return fail("En az bir fotoğraf gerekli.");
  const lang = /^en|ingilizce|english/i.test(str(b.language, 20)) ? "İngilizce" : "Türkçe";
  const out = await claude(env, [
    ...photos.map(x => ({ type: "image", source: { type: "base64", media_type: /png|webp|gif/.test(x.mimeType || "") ? x.mimeType : "image/jpeg", data: String(x.data).replace(/^data:[^,]*,/, "") } })),
    { type: "text", text: `Bu fotoğraflar için ${lang} bir LinkedIn gönderisi yaz. Konu: ${str(b.topic, 500) || "fotoğraflardan çıkar"} · Ton: ${str(b.tone, 50)} · Gönderi tipi: ${str(b.postType, 50)}.
JSON: {"postText":"satır sonlarıyla gönderi metni","hashtags":["#..."],"imageTitle":"görsel üstü kısa başlık (≤6 kelime)","imageSubtitle":"kısa alt başlık"}` },
  ], { system: SYS, max: 3000 });
  return J({ postText: str(out.postText, 5000), hashtags: arr(out.hashtags, 10), imageTitle: str(out.imageTitle, 100), imageSubtitle: str(out.imageSubtitle, 160) });
}

// ---------- 6) LinkedIn gönderi yazarı (deneme) ----------
async function linkedinPost(req, env) {
  const b = await readBody(req);
  if (!str(b.topic)) return fail("Konu gerekli.");
  const size = { "instagram-post": [1080, 1350], "instagram-story": [1080, 1920] }[b.imageSizePreset] || [1200, 1200];
  const len = { short: "kısa (~400 karakter)", medium: "orta (~900 karakter)", long: "uzun (~1500 karakter)", blog: "blog tadında (~2500 karakter)" }[b.postLength] || "orta";
  const out = await claude(env, `LinkedIn gönderisi yaz. Dil: ${/english|ingilizce|^en/i.test(str(b.language, 20)) ? "İngilizce" : "Türkçe"}
Konu: ${str(b.topic, 800)} · Ton: ${str(b.tone, 50)} · Hedef kitle: ${str(b.audience, 100)} · Uzunluk: ${len}
CTA: ${b.includeCTA ? "ekle" : "ekleme"} · Emoji: ${b.useEmojis ? "kullan" : "kullanma"} · İstatistik: ${b.includeStats ? "genel bilinen ve kaynağı belirtilebilir istatistik ekle" : "ekleme"}
${b.keyword ? `Anahtar kelime: ${str(b.keyword, 100)}` : ""} ${b.linkUrl ? `Link: ${str(b.linkUrl, 300)}` : ""}
${b.infographicTopic ? `İnfografik konusu: ${str(b.infographicTopic, 300)}` : ""}
JSON: {"postText":"","hashtags":["#..."],"imageTitle":"≤6 kelime","imageSubtitle":"kısa","engagementPrediction":{"estimatedLikes":0,"estimatedComments":0,"score":0-100}${b.infographicTopic ? ',"infographicData":{"title":"","items":[{"label":"","value":""}]}' : ""}}`, { system: SYS, max: 4000 });
  return J({ postText: str(out.postText, 6000), hashtags: arr(out.hashtags, 10), imageTitle: str(out.imageTitle, 100), imageSubtitle: str(out.imageSubtitle, 160), canvasWidth: size[0], canvasHeight: size[1], engagementPrediction: out.engagementPrediction || { estimatedLikes: 0, estimatedComments: 0, score: 0 }, ...(out.infographicData ? { infographicData: out.infographicData } : {}) });
}

// ---------- 7) Sayfada anahtar kelime kontrolü ----------
const lc = s => s.toLocaleLowerCase("tr");
const count = (hay, needle) => (needle ? hay.split(needle).length - 1 : 0);
async function keywordCheck(req) {
  const b = await readBody(req);
  const items = arr(b.items, 25).filter(x => x?.url && x?.keyword);
  if (!items.length) return fail("En az bir URL ve anahtar kelime gerekli.");
  const results = await Promise.all(items.map(async it => {
    const kw = lc(str(it.keyword, 200)), p = await getPage(it.url, 200000);
    const base = { url: str(it.url, 500), keyword: str(it.keyword, 200) };
    if (!p.html) return { ...base, found: false, status: "Hata", statusEmoji: "⚠️", confidenceLevel: "—", confidenceEmoji: "⚪", foundLocation: [], count: 0, foundInDomains: false, foundInUrls: false, foundInScripts: false, foundSources: [], error: p.error };
    const h = p.html, text = lc(p.text);
    const hrefs = lc([...h.matchAll(/\bhref=["']([^"']+)["']/gi)].map(m => m[1]).join(" "));
    const scripts = lc([...h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join(" ") + " " + [...h.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)/gi)].map(m => m[1]).join(" "));
    const slug = kw.replace(/\s+/g, "");
    const inText = count(text, kw), inTitle = lc(tag(h, /<title[^>]*>([\s\S]*?)<\/title>/i)).includes(kw), inMeta = lc(metaDesc(h)).includes(kw);
    const inUrls = hrefs.includes(kw) || hrefs.includes(slug), inScripts = scripts.includes(kw) || scripts.includes(slug);
    const inDomains = [...hrefs.matchAll(/https?:\/\/([^/"'\s]+)/g)].some(m => m[1].includes(slug));
    const loc = [inTitle && "Başlık", inMeta && "Meta açıklama", inText && "Sayfa metni", inUrls && "Linkler", inScripts && "Scriptler", inDomains && "Alan adları"].filter(Boolean);
    const found = loc.length > 0;
    const [conf, ce] = inText >= 3 || inTitle ? ["Yüksek", "🟢"] : inText ? ["Orta", "🟡"] : found ? ["Düşük", "🟠"] : ["—", "🔴"];
    return { ...base, found, status: found ? "Bulundu" : "Bulunamadı", statusEmoji: found ? "✅" : "❌", confidenceLevel: conf, confidenceEmoji: ce, foundLocation: loc, count: inText, foundInDomains: inDomains, foundInUrls: inUrls, foundInScripts: inScripts, foundSources: loc };
  }));
  return J({ success: true, results });
}

// ---------- 8) Firma listesinde anahtar kelime taraması ----------
async function keywordScanner(req) {
  const b = await readBody(req);
  const keywords = arr(b.keywords, 30).map(k => str(k, 100)).filter(Boolean);
  const companies = arr(b.companies, 40).filter(c => c?.domain);
  if (!keywords.length || !companies.length) return fail("Anahtar kelime ve firma listesi gerekli.");
  const maxPages = b.deepCrawl ? Math.min(Math.max(num(b.maxPages), 1), 3) : 1;
  const results = [];
  for (let i = 0; i < companies.length; i += 6) {
    results.push(...await Promise.all(companies.slice(i, i + 6).map(async c => {
      const home = await getPage(c.domain, 60000);
      const base = { company: str(c.name, 150) || str(c.domain, 150), domain: str(c.domain, 200), scannedAt: new Date().toISOString(), aiEnhanced: false };
      if (!home.html) return { ...base, found: false, foundKeywords: [], matchRate: 0, overallRelevance: 0, pagesScanned: 0, businessType: "", leadQuality: "Düşük", businessSummary: "", targetMarket: "", keywordDetails: [], error: home.error };
      let text = home.text;
      let pages = 1;
      if (maxPages > 1) {
        const host = new URL(home.url).hostname;
        const links = [...new Set([...home.html.matchAll(/\bhref=["']([^"'#]+)["']/gi)].map(m => { try { const u = new URL(m[1], home.url); return u.hostname === host && !/\.(pdf|jpe?g|png|svg|zip|css|js)$/i.test(u.pathname) ? u.href : ""; } catch { return ""; } }).filter(u => u && u !== home.url))].slice(0, maxPages - 1);
        for (const l of links) { const p = await getPage(l, 30000); if (p.text) { text += " " + p.text; pages++; } }
      }
      const low = lc(text);
      const keywordDetails = keywords.map(k => {
        const n = count(low, lc(k)), at = low.indexOf(lc(k));
        return { keyword: k, found: n > 0, count: n, contexts: at >= 0 ? [text.slice(Math.max(0, at - 80), at + k.length + 80)] : [] };
      });
      const foundKeywords = keywordDetails.filter(d => d.found).map(d => d.keyword);
      const matchRate = Math.round((foundKeywords.length / keywords.length) * 100);
      return { ...base, found: foundKeywords.length > 0, foundKeywords, matchRate, overallRelevance: matchRate, pagesScanned: pages, businessType: "", leadQuality: matchRate >= 60 ? "Yüksek" : matchRate >= 30 ? "Orta" : "Düşük", businessSummary: (metaDesc(home.html) || home.text.slice(0, 200)).slice(0, 300), targetMarket: "", keywordDetails };
    })));
  }
  const ok = results.filter(r => r.found);
  return J({
    success: true, results,
    summary: { totalScanned: results.length, totalFound: ok.length, totalNotFound: results.length - ok.length, averageMatchRate: results.length ? Math.round(results.reduce((a, r) => a + r.matchRate, 0) / results.length) : 0 },
    keywordStats: keywords.map(k => { const n = results.filter(r => r.foundKeywords.includes(k)).length; return { keyword: k, foundInCompanies: n, penetrationRate: results.length ? Math.round((n / results.length) * 100) : 0, totalOccurrences: results.reduce((a, r) => a + (r.keywordDetails?.find(d => d.keyword === k)?.count || 0), 0) }; }),
  });
}

// ---------- 9) Sekans yazarı (başlat + durum) ----------
// executionId isteğin sıkıştırılmış hâlidir; iş durum sorgusunda yapılır (istemci sorguları sırayla atar)
async function sekansStart(req) {
  const b = await readBody(req);
  if (b.token !== "sc_sekans_2026_prod") return fail("Yetkisiz istek.", 403);
  if (!str(b.company_name)) return fail("Firma adı gerekli.");
  const executionId = await packId({ c: str(b.company_name, 150), t: str(b.source_type, 20), d: str(b.domain, 300), p: str(b.pdf_text, 6000), n: str(b.source_notes, 3000), w: str(b.writer_name, 100) });
  return J({ success: true, executionId });
}
async function sekansStatus(req, env, origin) {
  let q;
  try { q = await unpackId(new URL(req.url).searchParams.get("executionId") || ""); } catch { return J({ status: "error", error: "Geçersiz iş kimliği." }); }
  try {
    const site = q.d ? await getPage(q.d, 8000) : { text: "" };
    const ai = await claude(env, `${q.c} firmasına satış yapmak için outbound sekans yaz. Yazar: ${q.w || "Sales Corner"}.
Kaynak tipi: ${q.t}${q.t === "video" ? " (video dökümü bu sistemde yok; notlardan ve web sitesinden çalış)" : ""}
Notlar: ${q.n || "-"}
${q.p ? `PDF metni: ${q.p}` : ""}
${site.text ? `Web sitesi (${q.d}): ${site.text}` : ""}

JSON: {"slides":[{"baslik":"...","maddeler":["..."],"not":"tam metin (e-posta gövdesi vb.)"}]}
Slaytlar: Firma ve alıcı analizi, Değer önerisi ve ana mesaj, sonra 5 adımlık sekans (E-posta 1 – Gün 1, LinkedIn bağlantı notu – Gün 2, E-posta 2 – Gün 4, Cold call senaryosu – Gün 6, E-posta 3 (son) – Gün 9). Adım slaytlarında maddeler: konu satırı + amaç; "not": gönderilecek tam metin.`, { system: SYS, max: 9000 });
    const slides = aiSlides(ai.slides);
    const links = reportLinks(origin, { t: `${q.c} · Satış Sekansı`, s: q.w ? `Hazırlayan: ${q.w}` : "", d: new Date().toISOString().slice(0, 10), sl: slides });
    return J({ status: "completed", company: q.c, ...links, publicUrl: links.presentationViewUrl, slideCount: slides.length });
  } catch (e) { console.log("sekans", e.message); return J({ status: "error", error: "Sekans üretilemedi, lütfen tekrar deneyin." }); }
}

// ---------- 10) Rakip analizi (başlat + durum) ----------
async function rakipStart(req) {
  const b = await readBody(req);
  if (b.website2) return J({ success: true, executionId: "x" }); // bal küpü
  const comps = arr(b.manual_competitor_urls, 5).map(u => str(u, 300)).filter(Boolean);
  if (!b.company_website || !comps.length) return fail("Firma sitesi ve en az bir rakip gerekli.");
  return J({ success: true, executionId: await packId({ w: str(b.company_website, 300), n: str(b.company_name, 150), c: comps, k: str(b.country, 40) }) });
}
async function rakipStatus(req, env, origin) {
  let q;
  try { q = await unpackId(new URL(req.url).searchParams.get("executionId") || ""); } catch { return J({ status: "error", error: "Geçersiz iş kimliği." }); }
  try {
    const pages = await Promise.all([q.w, ...q.c].map(u => getPage(u, 5000)));
    const [own, ...rivals] = pages;
    const ai = await claude(env, `Rakip analizi yap. Ülke/pazar: ${q.k || "Türkiye"}
Bizim firma: ${q.n || ""} ${own.url || q.w}
Bizim site metni: ${own.text || "(okunamadı)"}
${rivals.map((p, i) => `Rakip ${i + 1}: ${p.url || q.c[i]}\nMetin: ${p.text || "(okunamadı: " + p.error + ")"}`).join("\n\n")}

JSON: {"rakip_adi":"rakiplerin kısa adları, virgülle","slides":[{"baslik":"...","maddeler":["..."],"not":"..."}]}
Slaytlar: Pazar ve konumlanma özeti, her rakip için bir slayt (sunduğu, hedef kitle, fiyat sinyali, güçlü/zayıf yön), Karşılaştırma (mesaj, teklif, kanıt), Bizim için fırsatlar, 30 günlük aksiyon planı.`, { system: SYS, max: 9000 });
    const slides = aiSlides(ai.slides);
    const l = reportLinks(origin, { t: `${q.n || own.url} · Rakip Analizi`, s: str(ai.rakip_adi, 200), d: new Date().toISOString().slice(0, 10), sl: slides });
    return J({ status: "completed", rakip_adi: str(ai.rakip_adi, 200), slideCount: slides.length, slides_url: l.presentationUrl, slides_view_url: l.presentationViewUrl, slides_pdf_url: l.presentationViewUrl });
  } catch (e) { console.log("rakip", e.message); return J({ status: "error", error: "Analiz üretilemedi, lütfen tekrar deneyin." }); }
}

// ---------- rapor görüntüleyici ----------
const VIEWER = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Sales Corner Rapor</title>
<style>
:root{--bg:#0D1117;--card:#161b22;--line:#30363d;--tx:#e6edf3;--mut:#8b949e;--acc:#FFB71B}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
header{padding:28px 16px 8px;max-width:1000px;margin:auto}h1{margin:0;font-size:28px}header p{margin:4px 0 0;color:var(--mut)}
.bar{max-width:1000px;margin:8px auto 0;padding:0 16px;display:flex;gap:8px;flex-wrap:wrap}.bar a,.bar button{background:var(--acc);color:#111;border:0;border-radius:8px;padding:8px 14px;font-weight:700;text-decoration:none;cursor:pointer;font-size:14px}
main{max-width:1000px;margin:auto;padding:16px}.s{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px;margin:0 0 18px;break-inside:avoid}
.s h2{margin:0 0 14px;font-size:22px;color:var(--acc)}.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:12px}
.k div{border:1px solid var(--line);border-radius:10px;padding:12px}.k b{display:block;font-size:24px}.k span{color:var(--mut);font-size:13px}
ul{margin:0;padding-left:20px}li{margin:4px 0}.n{white-space:pre-wrap;color:var(--mut);margin-top:12px;font-size:14px;border-left:3px solid var(--line);padding-left:10px}
body.sunum header,body.sunum .bar{display:none}body.sunum main{max-width:none;padding:0}body.sunum .s{display:none;min-height:100vh;margin:0;border-radius:0;border:0;padding:6vh 8vw;font-size:clamp(16px,1.6vw,24px)}
body.sunum .s.on{display:block}body.sunum .s h2{font-size:clamp(24px,3vw,44px)}body.sunum .k b{font-size:clamp(22px,2.4vw,40px)}
#pg{position:fixed;right:16px;bottom:12px;color:var(--mut);font-size:13px;display:none}body.sunum #pg{display:block}
@media print{body{background:#fff;color:#000}.bar{display:none}.s{border-color:#ccc;background:#fff}.s h2{color:#000}.n,.k span{color:#444}}
</style></head><body><header><h1 id="t"></h1><p id="st"></p></header>
<div class="bar"><a id="sm" href="#">🖥 Sunum Modu</a><button onclick="print()">PDF / Yazdır</button><button id="cp">Bağlantıyı kopyala</button></div>
<main id="m"></main><div id="pg"></div>
<script>
(function(){var m=document.getElementById("m"),r;
try{var h=location.hash.slice(1).replace(/-/g,"+").replace(/_/g,"/");r=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(h),function(c){return c.charCodeAt(0)})))}catch(e){m.textContent="Rapor verisi okunamadı. Bağlantının tamamını kopyaladığınızdan emin olun.";return}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
document.title=r.t||"Rapor";document.getElementById("t").textContent=r.t||"";document.getElementById("st").textContent=[r.s,r.d].filter(Boolean).join(" · ");
(r.sl||[]).forEach(function(s){var d=el("section","s");d.appendChild(el("h2",null,s.b||""));
if(s.k&&s.k.length){var k=el("div","k");s.k.forEach(function(p){var c=el("div");c.appendChild(el("b",null,String(p[1])));c.appendChild(el("span",null,p[0]));k.appendChild(c)});d.appendChild(k)}
if(s.m&&s.m.length){var u=el("ul");s.m.forEach(function(x){u.appendChild(el("li",null,x))});d.appendChild(u)}
if(s.n)d.appendChild(el("div","n",s.n));m.appendChild(d)});
var sunum=/[?&]sunum=1/.test(location.search);document.getElementById("sm").href="?sunum=1"+location.hash;
document.getElementById("cp").onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(location.href)};
if(!sunum){m.contentEditable="true";return}
document.body.classList.add("sunum");var ss=m.querySelectorAll(".s"),i=0,pg=document.getElementById("pg");
function go(n){i=Math.max(0,Math.min(ss.length-1,n));ss.forEach(function(s,j){s.classList.toggle("on",j===i)});pg.textContent=(i+1)+" / "+ss.length}
go(0);document.addEventListener("keydown",function(e){if(["ArrowRight","PageDown"," "].indexOf(e.key)>=0)go(i+1);if(["ArrowLeft","PageUp"].indexOf(e.key)>=0)go(i-1)});
document.addEventListener("click",function(e){go(e.clientX>innerWidth/3?i+1:i-1)})})();
</script></body></html>`;

// ---------- yönlendirme ----------
const POST = {
  "/api/analiz": analiz, "/api/briefing": briefing, "/api/seo-analyze": seoAnalyze, "/api/cv-analiz": cvAnaliz,
  "/api/photo-enhance-v2": photoEnhance, "/api/deneme": linkedinPost, "/api/keyword-check": keywordCheck,
  "/api/keyword-scanner-pro": keywordScanner, "/api/sekans": sekansStart, "/api/rakip-analizi-pro-v5": rakipStart,
};
const GET = { "/api/sekans-status": sekansStatus, "/api/rakip-analizi-status": rakipStatus };
const NOT_YET = new Set(["/api/linkedin-oauth", "/api/linkedin-share"]);

export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname.replace(/\/+$/, "");
    if (!path.startsWith("/api/")) return env.ASSETS.fetch(req);
    if (path === "/api/rapor") return new Response(VIEWER, { headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", "cache-control": "public, max-age=300" } });
    if (req.method === "OPTIONS") return new Response(null, { status: 204 });
    if (NOT_YET.has(path)) return fail("LinkedIn bağlantısı yeni sisteme henüz taşınmadı.", 501);
    const fn = (req.method === "POST" ? POST : req.method === "GET" ? GET : {})[path];
    if (!fn) return fail("Bulunamadı.", 404);
    if (!sameSite(req)) return fail("Bu uç yalnızca salescorner.co üzerinden kullanılabilir.", 403);
    try { return await fn(req, env, url.origin); }
    catch (e) { console.log(path, e?.stack || e); return fail("İşlem sırasında hata oluştu, lütfen tekrar deneyin.", 500); }
  },
};
