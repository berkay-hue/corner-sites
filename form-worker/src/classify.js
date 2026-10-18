// İçerik konusu (niş) çıkarma ve kampanya uyum skoru. Ücretli yapay zekâ yok: sabit anahtar kelime / etiket sözlüğü.
// Metin Türkçe kurallarıyla küçültülür, sonra ş→s, ı→i gibi harfler sadeleşir; "Cilt Bakımı", "#CiltBakimi", "ciltbakımı" aynı eşleşir.
// Kelime sonu ekleri için 4+ harfli kökler önek olarak eşleşir (makyaj → makyajım, tarif → tarifleri, bebek → bebeğim).
// Hashtag'lerin ağırlığı 2, düz metindeki kelimelerin 1. Çok kelimeli ifadeler önce eşleşir, kelimeleri bir daha sayılmaz.

const DICT = {
  "cilt bakımı": { en: "skincare", terms: ["cilt", "cildim", "ciltbakımı", "cilt bakımı", "skincare", "skin care", "serum", "nemlendirici", "nemlendir", "moisturizer", "spf", "güneş kremi", "sunscreen", "krem", "tonik", "toner", "retinol", "niacinamide", "hyaluronik", "akne", "sivilce", "gözenek", "peeling", "yüz maskesi", "cleanser", "temizleme jeli", "dermatolog", "dermatoloji", "glowy"] },
  "güzellik": { en: "beauty", terms: ["güzellik", "beauty", "makyaj", "makeup", "ruj", "lipstick", "fondöten", "foundation", "rimel", "maskara", "mascara", "far paleti", "eyeshadow", "allık", "blush", "kozmetik", "cosmetics", "parfüm", "perfume", "oje", "nailart", "saç", "saç bakımı", "saç kremi", "şampuan", "haircare", "kirpik", "kaş şekillendirme", "eyebrow"] },
  "yaşam tarzı": { en: "lifestyle", terms: ["yaşam tarzı", "yaşamtarzı", "lifestyle", "vlog", "günlük", "günlük vlog", "dailyvlog", "rutin", "routine", "sabah rutini", "morning routine", "motivasyon", "motivation", "selfcare", "kendine iyi bak", "wellness", "minimalizm", "minimalism", "dayinmylife", "bir günüm"] },
  "teknoloji": { en: "technology", terms: ["teknoloji", "technology", "tech", "telefon", "smartphone", "iphone", "android", "samsung", "laptop", "bilgisayar", "computer", "yazılım", "software", "kodlama", "coding", "yapay zeka", "yapayzeka", "gadget", "kulaklık", "headphones", "akıllı saat", "smartwatch", "unboxing", "kutu açılımı", "tablet", "elektronik"] },
  "oyun": { en: "gaming", terms: ["oyun", "gaming", "gamer", "game", "games", "video game", "playstation", "ps5", "xbox", "nintendo", "steam", "twitch", "valorant", "fortnite", "minecraft", "espor", "esports", "league of legends", "pubg", "cs2", "gameplay", "pro oyuncu"] },
  "moda": { en: "fashion", terms: ["moda", "fashion", "kombin", "outfit", "ootd", "stil", "stilist", "style", "giyim", "elbise", "dress", "ayakkabı", "sneaker", "çanta", "handbag", "streetwear", "sokak modası", "vintage", "aksesuar", "accessories", "lookbook", "takı", "jewelry", "krem rengi"] },
  "otomobil": { en: "automotive", terms: ["otomobil", "araba", "araç", "car", "cars", "otomotiv", "automotive", "test sürüşü", "test drive", "elektrikli araç", "electric car", "motorsiklet", "motorcycle", "motosiklet", "supercar", "otoyol", "lastik", "sedan", "suv"] },
  "anne-çocuk": { en: "parenting", terms: ["anne", "annelik", "anneyim", "bebek", "baby", "çocuk", "kids", "mom", "mother", "motherhood", "parenting", "ebeveyn", "hamile", "hamilelik", "gebe", "gebelik", "pregnancy", "emzirme", "oyuncak", "toys", "kreş", "momlife"] },
  "seyahat": { en: "travel", terms: ["seyahat", "travel", "gezi", "gezgin", "tatil", "vacation", "holiday", "otel", "hotel", "uçuş", "flight", "backpacking", "kamp", "camping", "plaj", "beach", "yurtdışı", "wanderlust", "travelgram", "rota", "itinerary", "balayı", "honeymoon"] },
  "yemek": { en: "food", terms: ["yemek", "food", "tarif", "recipe", "mutfak", "kitchen", "lezzet", "foodie", "restoran", "restaurant", "kahvaltı", "breakfast", "tatlı", "tatlı tarifi", "ev yapımı tatlı", "dessert", "şef", "chef", "baking", "hamur işi", "kahve", "coffee", "atıştırmalık", "snack", "foodporn", "yemektarifi"] },
  "doğal ürünler": { en: "natural products", terms: ["doğal", "natural", "organik", "organic", "bitkisel", "herbal", "katkısız", "zeytinyağı", "olive oil", "bal", "honey", "el yapımı sabun", "doğal ürün", "doğal içerikli", "%100 doğal", "doğal kozmetik", "naturel", "clean beauty", "vegan kozmetik"] },
  "erkek bakımı": { en: "men's grooming", terms: ["erkek bakımı", "erkekbakımı", "grooming", "mensgrooming", "sakal", "beard", "tıraş", "shave", "berber", "barber", "aftershave", "erkek parfümü", "menstyle"] },
  "kendin yap": { en: "DIY", terms: ["kendin yap", "kendinyap", "diy", "el yapımı", "handmade", "craft", "hobi", "hobby", "örgü", "knitting", "tamir", "upcycle", "upcycling", "dekupaj", "maker", "boyama", "ahşap"] },
  "spor": { en: "sports", terms: ["spor", "sport", "sports", "fitness", "gym", "spor salonu", "antrenman", "workout", "koşu", "running", "yoga", "pilates", "futbol", "football", "basketbol", "basketball", "bisiklet", "cycling", "protein", "egzersiz", "exercise", "maraton", "marathon", "crossfit"] },
  "sürdürülebilirlik": { en: "sustainability", terms: ["sürdürülebilir", "sürdürülebilirlik", "sustainability", "sustainable", "çevre", "çevreci", "eco", "ekolojik", "geri dönüşüm", "recycling", "sıfır atık", "zerowaste", "zero waste", "iklim", "climate", "karbon", "ikinci el", "secondhand", "thrift"] },
  "ev": { en: "home", terms: ["ev dekorasyonu", "evdekorasyonu", "dekorasyon", "decor", "homedecor", "home decor", "mobilya", "furniture", "ev düzeni", "ev organizasyonu", "temizlik", "cleaning", "bahçe", "garden", "iç mimari", "interior", "salon dekorasyonu", "mutfak dolabı", "ev turu", "hometour"] },
  "tasarım": { en: "design", terms: ["tasarım", "design", "grafik", "graphic", "illüstrasyon", "illustration", "mimari", "architecture", "logo tasarımı", "tipografi", "typography", "sanat", "art", "artwork", "ui", "ux", "figma", "çizim", "drawing"] },
};

// Yakın konular kısmi puan alır (ör. cilt bakımı içeriği güzellik kampanyasına da uyar)
const RELATED = [
  ["cilt bakımı", "güzellik", 0.6], ["cilt bakımı", "doğal ürünler", 0.5], ["cilt bakımı", "erkek bakımı", 0.5],
  ["güzellik", "moda", 0.4], ["güzellik", "erkek bakımı", 0.4], ["doğal ürünler", "sürdürülebilirlik", 0.5],
  ["doğal ürünler", "yemek", 0.3], ["ev", "tasarım", 0.5], ["ev", "kendin yap", 0.5], ["tasarım", "moda", 0.3],
  ["teknoloji", "oyun", 0.5], ["teknoloji", "otomobil", 0.3], ["spor", "yaşam tarzı", 0.3], ["seyahat", "yaşam tarzı", 0.4],
  ["anne-çocuk", "yaşam tarzı", 0.3], ["moda", "yaşam tarzı", 0.3], ["yemek", "yaşam tarzı", 0.3], ["ev", "yaşam tarzı", 0.3],
];

export const NICHES = Object.keys(DICT);

// Türkçe küçük harf + aksan sadeleştirme: "İ"→"i", "I"→"ı"→"i", "ş"→"s"
export const fold = s => String(s ?? "").toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
const split = s => s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// Prototipsiz sözlük: "constructor", "__proto__" gibi etiketler konuya dönüşmesin
const lookup = pairs => Object.assign(Object.create(null), Object.fromEntries(pairs));
const KEY = lookup(NICHES.map(n => [fold(n), n]));
const EN = lookup(NICHES.map(n => [fold(DICT[n].en), n]));

// Yalnızca kendisi eşleşir: kökü sık kelimelere karışır (cars→çarşı/çarşamba, style→styles, araç→araçlar "aletler", gebe→geber-)
const EXACT = new Set(["cars", "style", "arac", "gebe"]);
// Kısa Türkçe terimler yalnızca bu eklerle eşleşir (rujum, saçlarım, şefler, stilini; "still", "saçma", "sefer" eşleşmez)
const SHORT = new Set(["ruj", "oje", "sef", "sac", "stil"]);
const SHORT_SUF = new Set(["i", "u", "im", "um", "in", "un", "ini", "unu", "lar", "ler", "lari", "leri", "larim", "lerim"]);
// Sıfat gibi kullanılan genel kelimeler düz metinde konu sayılmaz (tatlım, doğal olarak, naturally, günlük hayat);
// hashtag (#doğal, #tatlı, #günlük) ya da ifade ("doğal ürün", "tatlı tarifi", "günlük vlog") olarak sayılır
const TAG_ONLY = new Set(["tatli", "dogal", "natural", "naturel", "gunluk"]);
// Sözlük köküyle başlayan ama konuyla ilgisi olmayan sık kelimeler (takı→takip/takım/takıldı, kamp→kampanya, koşu→koşul,
// yoga→yoğurt, tarif→tarife, örgü→örgüt, rota→rotasyon, oyun→oyuncu, krem→krema, doğal→doğalgaz, karbon→karbonhidrat)
const NOT_STEM = ["takip", "takib", "takim", "takild", "takili", "takilm", "takint", "kampanya", "kampus", "kosul", "kosun", "yogurt",
  "tarife", "still", "carsamba", "carsi", "orgut", "rotasyon", "aracil", "oyuncu", "krema", "kremlin", "dogalgaz", "karbonhid", "karbonat"];

// Sözlük: tek kelimelik terimler (çok kelimeli ifadeler bitişik yazımıyla da) + ifadeler (ilk kelimeye göre)
const TERMS = new Map(), PHRASES = new Map();
for (const n of NICHES) {
  for (const t of DICT[n].terms) {
    const words = split(fold(t));
    TERMS.set(words.join(""), n);
    if (words.length > 1) PHRASES.set(words[0], [...(PHRASES.get(words[0]) || []), [words, n]]);
  }
}
for (const list of PHRASES.values()) list.sort((a, b) => b[0].length - a[0].length || b[0].join("").length - a[0].join("").length);

// Kökler en uzundan kısaya denenir (oyuncağı → oyun değil oyuncak). [kök, konu, yumuşamış mı, terim]
const STEMS = [];
for (const [w, n] of TERMS) {
  if (EXACT.has(w) || (w.length < 4 && !SHORT.has(w))) continue;
  STEMS.push([w, n, false, w]);
  // Ünsüz yumuşaması (bebek→bebeğim, yemek→yemeği, ahşap→ahşabı, cilt→cildi): yalnızca ünlüyle başlayan ekle
  if ((w.length >= 5 || w === "cilt") && /[ktp]$/.test(w)) STEMS.push([w.slice(0, -1) + { k: "g", t: "d", p: "b" }[w.at(-1)], n, true, w]);
}
STEMS.sort((a, b) => b[0].length - a[0].length);
// Birleşik hashtag'lerde aranacak 5+ harfli terimler (#sabahrutinim, #yemektarifleri, #streetstyle)
const INNER = [...TERMS].filter(([w]) => w.length >= 5).sort((a, b) => b[0].length - a[0].length);

const REL = new Map();
for (const [a, b, w] of RELATED) { REL.set(`${a}|${b}`, w); REL.set(`${b}|${a}`, w); }
const sim = (a, b) => (a === b ? 1 : REL.get(`${a}|${b}`) || 0);

// Ek zinciri: en çok 4 harf, "-lar/-ler" ile başlıyorsa 7 harf (tarifleri, kombinlerim, makyajlarımız)
const suffixOk = rest => rest.length <= 4 || (rest.length <= 7 && /^l[ae]r/.test(rest));

function wordNiche(w, hashtag) {
  const n = TERMS.get(w);
  if (n) return !hashtag && TAG_ONLY.has(w) ? null : n;
  if (NOT_STEM.some(p => w.startsWith(p))) return null;
  for (const [stem, niche, soft, term] of STEMS) {
    if (!w.startsWith(stem)) continue;
    const rest = w.slice(stem.length);
    if (SHORT.has(stem) ? !SHORT_SUF.has(rest) : !suffixOk(rest) || (soft && !/^[aeiou]/.test(rest))) continue;
    return !hashtag && TAG_ONLY.has(term) ? null : niche;
  }
  // Birleşik hashtag: içinde 5+ harfli bir terim geçiyorsa
  if (hashtag) for (const [term, niche] of INNER) if (w.includes(term)) return niche;
  return null;
}

// words[i]'den başlayan en uzun ifade; son kelime ekli olabilir ("güneş kremini", "doğal ürünler", "spor salonunda")
function phraseAt(words, i) {
  for (const [p, n] of PHRASES.get(words[i]) || []) {
    const ok = p.every((x, j) => {
      const w = words[i + j];
      if (w === x) return true;
      return j === p.length - 1 && x.length >= 4 && w?.startsWith(x) && suffixOk(w.slice(x.length));
    });
    if (ok) return [p, n];
  }
  return null;
}

// Metinden konu puanları: { niches: [{ tag, score (0-100, paylar toplamı ~100) }], matched }
export function classify(input) {
  const raw = Array.isArray(input) ? input.join("\n") : String(input ?? "");
  const text = fold(raw.slice(0, 20000));
  const score = {};
  // Aynı kelime, ifade ya da hashtag metin boyunca en çok 3 kez sayılır (tekrar tek başına konuyu belirlemesin)
  const counted = new Map();
  const add = (key, n, w) => {
    const c = (counted.get(key) || 0) + 1;
    counted.set(key, c);
    if (c <= 3) score[n] = (score[n] || 0) + w;
  };
  const hashtags = [...text.matchAll(/#([\p{L}\p{N}_]{2,60})/gu)].map(m => m[1].replace(/_/g, ""));
  for (const h of hashtags.slice(0, 200)) { const n = wordNiche(h, true); if (n) add(`#${h}`, n, 2); }
  const plain = text.replace(/#[\p{L}\p{N}_]+/gu, " ").replace(/https?:\/\/\S+|@[\w.]+/g, " ");
  const words = plain.split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 2).slice(0, 3000);
  for (let i = 0; i < words.length; i++) {
    const hit = phraseAt(words, i);
    if (hit) { add(hit[0].join(" "), hit[1], 1); i += hit[0].length - 1; continue; }
    const n = wordNiche(words[i], false);
    if (n) add(words[i], n, 1);
  }
  const total = Object.values(score).reduce((a, b) => a + b, 0);
  const niches = Object.entries(score).map(([tag, s]) => ({ tag, score: Math.round((100 * s) / total) }))
    .filter(x => x.score >= 8).sort((a, b) => b.score - a.score || NICHES.indexOf(a.tag) - NICHES.indexOf(b.tag)).slice(0, 5);
  return { niches, matched: total };
}

// Kampanyanın serbest metin etiketini sözlükteki konulara bağlar ("Skincare", "#güzellik", "Moda & Güzellik", "Home & Living")
export function resolveNiches(tag) {
  const f = fold(tag).replace(/#/g, " ").replace(/\s+/g, " ").trim();
  if (!f) return [];
  const known = KEY[f] || EN[f];
  if (known) return [known];
  const parts = f.split(/\s*[&,/+|]\s*|\s+(?:ve|and)\s+/).filter(Boolean);
  if (parts.length > 1) return [...new Set(parts.flatMap(resolveNiches))];
  if (!f.includes(" ")) { const n = wordNiche(f, true); return n ? [n] : []; }
  // Çok kelimeli etiket: bitişik yazımı bir terimse o, değilse metinden çıkan bütün konular
  const joined = TERMS.get(f.replace(/ /g, ""));
  return joined ? [joined] : classify(f).niches.map(x => x.tag);
}
export const resolveNiche = tag => resolveNiches(tag)[0] ?? null;

// Kampanyanın konu ağırlıkları: etiketler (her biri 1) + başlık/brief'ten çıkan konular (etiket varsa yarım ağırlık)
export function campaignNiches(camp) {
  const w = {};
  const list = Array.isArray(camp?.niches) ? camp.niches : typeof camp?.niches === "string" ? [camp.niches] : [];
  for (const t of list) for (const n of resolveNiches(t)) w[n] = 1;
  const k = Object.keys(w).length ? 0.5 : 1;
  for (const { tag, score } of classify(`${camp?.title || ""}\n${camp?.brief || ""}`).niches) w[tag] = Math.max(w[tag] || 0, (k * score) / 100);
  return w;
}

// Uyum (0-100): içeriğin ne kadarı kampanyanın konularında (%70) + kampanyanın konularının ne kadarı içerikte var (%30).
// İçerik kampanyanın ana konusundaysa tam, yalnızca yarım ağırlıklı (brief'ten çıkan) konusundaysa kısmi puan alır.
// Konu çıkmazsa null ("veri yok").
export function fit(contentNiches, camp) {
  const want = campaignNiches(camp), keys = Object.keys(want);
  const have = (contentNiches || []).filter(x => x.score > 0);
  if (!keys.length || !have.length) return { fit: null, label: "veri yok" };
  const total = have.reduce((a, x) => a + x.score, 0);
  const maxW = Math.max(...keys.map(k => want[k]));
  const precision = have.reduce((a, x) => a + (x.score / total) * Math.max(...keys.map(k => (sim(x.tag, k) * want[k]) / maxW)), 0);
  const wsum = keys.reduce((a, k) => a + want[k], 0);
  const recall = keys.reduce((a, k) => a + want[k] * Math.max(0, ...have.filter(x => x.score >= 10).map(x => sim(x.tag, k))), 0) / wsum;
  const value = Math.round(100 * (0.7 * precision + 0.3 * recall));
  return { fit: value, label: `%${value} uyum` };
}

// Tek çağrı: metin (açıklama + hashtag'ler) → konular + kampanyaya uyum
export function analyze(text, camp) {
  const { niches } = classify(text);
  return { niches, ...(camp ? fit(niches, camp) : { fit: null, label: "veri yok" }) };
}
