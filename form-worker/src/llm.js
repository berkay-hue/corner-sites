// Anthropic Messages API çağrısı (ISTEM §5): ham fetch, stream:false, tek JSON yanıt. fetch parametre olarak
// verilir (testlerde sahte). Hata türleri LlmError.kind ile döner; HTTP kodu ve iade kararı generate.js'te:
//   busy    faturalanmamış (bağlantı kurulamadı, denenmez; HTTP 429/5xx/529, 1 yeniden denemeden sonra) → tam iade
//   limit   Console harcama sınırı (429 enforced spend limit) → tam iade, yeniden deneme yok
//   fail    zaman aşımı, max_tokens, diğer 4xx, JSON/şema/sayı hatası → faturalanmış olabilir
//   refusal stop_reason "refusal" ya da bütün text alanları boş (ret işareti) → faturalanmış olabilir
// Sağlayıcının ham hata metni kullanıcıya gitmez; yalnız kısaltılmış log.
import { ANGLES, REELS_ANGLES, STUDIO_MAX } from "./gen-prompt.js";

const API = "https://api.anthropic.com/v1/messages";
const TIMEOUT = 30000; // iki denemenin toplamı dahil; istek timeout verirse o geçerli (A8 blog/video)
const RETRY_IF_UNDER = 10000; // ilk deneme bundan uzun sürdüyse yeniden denenmez
const RETRY_BUDGET = 15000; // geçen süre + bekleme bunu aşarsa yeniden denenmez

// Çıktı biçimleri. li: A2 (UTF-16, text ≤3000). caption ve reels: ISTEM-IG §1.7, kod noktasıyla
// (Instagram sayacı); reels'te ret işareti ve uzunluk text ile say birlikte. Sınırlar sert (llm_fail);
// reels'in 60/140 hedefi ve long_hook işareti generate.js'te.
const cp = s => [...s].length;
export const SPECS = {
  li: { angles: ANGLES, fields: ["text"], max: { text: 3000 }, len: s => s.length },
  caption: { angles: ANGLES, fields: ["text"], max: { text: 2200 }, len: cp },
  reels: { angles: REELS_ANGLES, fields: ["text", "say"], max: { text: 80, say: 200 }, len: cp },
  // A8 blog: kod noktasıyla. H1 satırı düşürülür (title'ın tekrarı ilk satırdaysa silinir, diğerleri "## " olur);
  // tek satır title ve en az bir "## " ara başlık zorunlu, yoksa llm_fail.
  blog: {
    angles: ["blog"], fields: ["title", "meta", "text"], len: cp,
    max: { title: STUDIO_MAX.title, meta: STUDIO_MAX.meta, text: STUDIO_MAX.blogText },
    check: d => {
      if (/\n/.test(d.title)) return "title_line";
      d.meta = d.meta.replace(/\s*\n\s*/g, " ");
      const lines = d.text.split("\n");
      if (/^#\s/.test(lines[0])) { lines.shift(); while (lines.length && !lines[0].trim()) lines.shift(); }
      d.text = lines.map(l => l.replace(/^#\s+/, "## ")).join("\n").trim();
      if (!d.text) return "partial_empty";
      if (!/^##\s+\S/m.test(d.text)) return "no_heading";
      return null;
    },
  },
};

// A8 video/carousel: sahne sayısı ve secs uzunluğa bağlı olduğu için istek başına üretilir. Video: 15→4-5, 30→6-8,
// 60→10-14 sahne, secs 2..8 tam sayı, toplam uzunluğun ±%25'i içinde. Carousel: slayt sayısı = length, secs 0'a
// sabitlenir. Sahne text'i tek satır ≤70, sub ≤120 kod noktası. Biri tutmazsa llm_fail.
const VIDEO_SCENES = { 15: [4, 5], 30: [6, 8], 60: [10, 14] };
export function videoSpec(kind, length) {
  const L = Number(length);
  const [lo, hi] = kind === "video" ? VIDEO_SCENES[L] : [L, L];
  return {
    angles: [kind], fields: ["title", "caption"], len: cp, scenes: true,
    max: { title: STUDIO_MAX.videoTitle, caption: STUDIO_MAX.caption },
    count: [lo, hi], kind, length: L,
    check: d => {
      if (/\n/.test(d.title)) return "title_line";
      const sc = d.scenes;
      if (sc.length < lo || sc.length > hi) return "scene_count";
      if (sc.some(x => /\n/.test(x.text) || cp(x.text) > STUDIO_MAX.scene || cp(x.sub) > STUDIO_MAX.sub)) return "scene_length";
      if (kind === "carousel") { for (const x of sc) x.secs = 0; return null; }
      if (sc.some(x => x.secs < 2 || x.secs > 8)) return "secs";
      const sum = sc.reduce((a, x) => a + x.secs, 0);
      return Math.abs(sum - L) > Math.ceil(L / 4) ? "secs_sum" : null;
    },
  };
}

// 27.11 E5: sahnenin (ve taslağın yedek) İngilizce stok arama sorgusu q. NFC, boşluklar tekleşir; yalnız ASCII harf/rakam ve
// boşluk , ' & - ile 2–60 karakter, en çok 6 kelime. Geçmezse "" (taslak reddedilmez; istemci taslak q'suna / konuya düşer).
export const qOk = v => {
  if (typeof v !== "string") return "";
  const q = v.normalize("NFC").replace(/\s+/g, " ").trim();
  return /^[A-Za-z0-9 ,'&-]{2,60}$/.test(q) && q.split(" ").length <= 6 ? q : "";
};

export class LlmError extends Error {
  constructor(kind, why, usage) {
    super(`${kind}: ${why}`);
    this.kind = kind;
    this.why = why;
    this.usage = usage || null;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const isTimeout = e => e?.name === "TimeoutError" || e?.name === "AbortError";

// retry-after saniye ya da HTTP tarihi; yoksa kısa bekleme
function retryAfter(h) {
  if (h == null || h === "") return 500;
  const s = Number(h);
  if (Number.isFinite(s)) return Math.max(0, s * 1000);
  const t = Date.parse(h);
  return Number.isFinite(t) ? Math.max(0, t - Date.now()) : 500;
}

async function attempt(env, f, body, ms) {
  let r;
  try {
    r = await f(API, {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(ms),
    });
  } catch (e) {
    // zaman aşımında istek sağlayıcıya ulaşmış olabilir; bağlantı hatası faturalanmaz ama denenmez (çift fatura riski, A0 §7)
    return isTimeout(e) ? { err: "fail", why: "timeout" } : { err: "busy", why: "conn" };
  }
  if (r.status === 200) {
    try { return { data: await r.json() }; } catch (e) { return { err: "fail", why: isTimeout(e) ? "timeout" : "body" }; }
  }
  let text = "";
  try { text = (await r.text()).slice(0, 2000); } catch {}
  if (r.status === 429 && /spend_limit|spend limit/i.test(text)) return { err: "limit", why: "spend_limit" };
  if (r.status === 429 || r.status >= 500) return { retry: true, wait: retryAfter(r.headers.get("retry-after")), why: `http ${r.status}` };
  // parametre hatası: denenmez, alarm logu
  console.log("gen llm alarm", r.status, text.replace(/\s+/g, " ").slice(0, 200));
  return { err: "fail", why: `http ${r.status}` };
}

// ISTEM §5.4 adım 2-4: önce stop_reason, sonra text bloğu, JSON, ret işareti, sayı/açı/uzunluk
export function parse(data, count, angle, spec = SPECS.li) {
  const { angles, fields, max, len, scenes } = spec;
  const usage = { input_tokens: Number(data?.usage?.input_tokens) || 0, output_tokens: Number(data?.usage?.output_tokens) || 0 };
  const stop = data?.stop_reason;
  if (stop === "refusal") {
    console.log("gen refusal", String(data?.stop_details?.category || "-").slice(0, 40));
    throw new LlmError("refusal", "stop_reason", usage);
  }
  if (stop !== "end_turn") throw new LlmError("fail", `stop ${String(stop).slice(0, 30)}`, usage);
  const block = Array.isArray(data.content) ? data.content.find(b => b?.type === "text") : null;
  let obj;
  try { obj = JSON.parse(block.text); } catch { throw new LlmError("fail", "json", usage); }
  const d = obj?.drafts;
  const sceneOk = s => s && typeof s.text === "string" && typeof s.sub === "string" && Number.isInteger(s.secs);
  if (!Array.isArray(d) || !d.length || d.some(x => !x || typeof x.angle !== "string" || fields.some(k => typeof x[k] !== "string")
    || (scenes && (!Array.isArray(x.scenes) || !x.scenes.every(sceneOk))))) throw new LlmError("fail", "shape", usage);
  // sahneli çıktıda ret işareti: alanlar boş ve sahne yok (ya da hepsinin text'i boş); sahne text'i boşsa eksik sayılır
  const blank = d.map(x => [...fields.map(k => x[k].trim() === ""), ...(scenes ? [!x.scenes.length || x.scenes.some(s => s.text.trim() === "")] : [])]);
  const allBlank = x => !scenes || x.scenes.every(s => s.text.trim() === "");
  if (blank.every(b => b.every(Boolean)) && d.every(allBlank)) throw new LlmError("refusal", "empty", usage);
  if (blank.some(b => b.some(Boolean))) throw new LlmError("fail", "partial_empty", usage);
  const drafts = d.map(x => {
    const o = { angle: x.angle };
    for (const k of fields) o[k] = x[k].trim();
    if (scenes) {
      o.scenes = x.scenes.map(s => ({ text: s.text.trim(), sub: s.sub.trim(), secs: s.secs, q: qOk(s.q) }));
      o.q = qOk(x.q);
    }
    return o;
  });
  if (drafts.some(x => fields.some(k => len(x[k]) > max[k]) || !angles.includes(x.angle))) throw new LlmError("fail", "length_or_angle", usage);
  if (spec.check) for (const x of drafts) { const why = spec.check(x); if (why) throw new LlmError("fail", why, usage); }
  if (count === 3) {
    if (drafts.length !== 3 || new Set(drafts.map(x => x.angle)).size !== 3) throw new LlmError("fail", "count", usage);
    drafts.sort((a, b) => angles.indexOf(a.angle) - angles.indexOf(b.angle));
  } else {
    if (drafts.length !== 1) throw new LlmError("fail", "count", usage);
    if (angle && drafts[0].angle !== angle) { console.log("gen refine angle", drafts[0].angle, "->", angle); drafts[0].angle = angle; }
  }
  return { drafts, usage, stop, model: String(data.model || "") };
}

async function call(env, f, { system, user, schema, maxTokens, count, angle, spec, timeout }) {
  const T = timeout || TIMEOUT;
  const body = JSON.stringify({
    model: env.GEN_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    stream: false,
  });
  const t0 = Date.now();
  let r = await attempt(env, f, body, T);
  if (r.retry) {
    const elapsed = Date.now() - t0;
    if (elapsed < RETRY_IF_UNDER && elapsed + r.wait <= RETRY_BUDGET) {
      if (r.wait) await sleep(r.wait);
      r = await attempt(env, f, body, Math.max(1000, T - (Date.now() - t0)));
    }
  }
  const ms = Date.now() - t0;
  if (r.retry) { console.log("gen llm busy", r.why, ms); throw new LlmError("busy", r.why); }
  if (r.err) { console.log("gen llm", r.err, r.why, ms); throw new LlmError(r.err, r.why); }
  const out = parse(r.data, count, angle, spec);
  console.log("gen llm ok", out.model, ms, out.usage.input_tokens, out.usage.output_tokens);
  return out;
}

// Yalnız yerel geliştirme: GEN_PROVIDER=fake, DEV_ORIGINS de tanımlıysa (canlıda DEV_ORIGINS yok).
// A8 blog/video: sahte taslak gerçek yanıt gibi parse'tan geçer (sözleşmeye uyduğu denetlenir).
function fakeStudio(spec) {
  if (spec === SPECS.blog) return {
    angle: "blog", title: "ÖRNEK blog başlığı", meta: "Bu açıklama sahte sağlayıcıdan geldi; gerçek model çağrılmadı. Arayüzü ve kaydı denemek için yeterince uzun bir örnek cümle.",
    text: "ÖRNEK giriş paragrafı. Bu metin sahte sağlayıcıdan geldi; gerçek model çağrılmadı.\n\n## Birinci bölüm\n\nBölüm paragrafı.\n\n### Alt başlık\n\n- Birinci madde\n- İkinci madde\n\n## Sonuç\n\nKapanış paragrafı.",
  };
  const n = spec.count[0], L = spec.length, video = spec.kind === "video";
  const secs = i => (video ? Math.floor(L / n) + (i >= n - (L % n) ? 1 : 0) : 0);
  return {
    angle: spec.kind, title: `ÖRNEK ${video ? "video" : "carousel"} taslağı`,
    q: "office desk laptop",
    scenes: Array.from({ length: n }, (_, i) => ({ text: i === 0 ? "ÖRNEK kanca" : i === n - 1 ? "ÖRNEK çağrı" : `ÖRNEK sahne ${i + 1}`, sub: i === 0 ? "" : "Sahte sağlayıcıdan geldi.", secs: secs(i), q: ["hands typing on keyboard", "team meeting whiteboard", "city skyline at night", "coffee cup on desk"][i % 4] })),
    caption: "ÖRNEK açıklama. Bu metin sahte sağlayıcıdan geldi; gerçek model çağrılmadı.\n\n#örnek #taslak #deneme",
  };
}

const fake = {
  async generate({ count, angle, spec = SPECS.li }) {
    await sleep(600);
    if (spec === SPECS.blog || spec.scenes) {
      const data = { stop_reason: "end_turn", model: "fake", usage: { input_tokens: 0, output_tokens: 0 }, content: [{ type: "text", text: JSON.stringify({ drafts: [fakeStudio(spec)] }) }] };
      return parse(data, count, angle, spec);
    }
    const a = count === 3 ? spec.angles : [angle || spec.angles[0]];
    const one = x => spec.fields.includes("say")
      ? { angle: x, text: `ÖRNEK kanca (${x})`, say: "Bu kanca sahte sağlayıcıdan geldi; gerçek model çağrılmadı." }
      : { angle: x, text: `ÖRNEK taslak (${x}).\n\nBu metin sahte sağlayıcıdan geldi; gerçek model çağrılmadı.` };
    return { drafts: a.map(one), usage: { input_tokens: 0, output_tokens: 0 }, stop: "end_turn", model: "fake" };
  },
};

export function makeLlm(env, f = fetch) {
  if (env?.GEN_PROVIDER === "fake" && env?.DEV_ORIGINS) return fake;
  return { generate: opts => call(env, f, opts) };
}
