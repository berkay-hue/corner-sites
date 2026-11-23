// Anthropic Messages API çağrısı (ISTEM §5): ham fetch, stream:false, tek JSON yanıt. fetch parametre olarak
// verilir (testlerde sahte). Hata türleri LlmError.kind ile döner; HTTP kodu ve iade kararı generate.js'te:
//   busy    faturalanmamış (bağlantı kurulamadı; HTTP 429/5xx/529, 1 yeniden denemeden sonra) → tam iade
//   limit   Console harcama sınırı (429 enforced spend limit) → tam iade, yeniden deneme yok
//   fail    zaman aşımı, max_tokens, diğer 4xx, JSON/şema/sayı hatası → faturalanmış olabilir
//   refusal stop_reason "refusal" ya da bütün text alanları boş (ret işareti) → faturalanmış olabilir
// Sağlayıcının ham hata metni kullanıcıya gitmez; yalnız kısaltılmış log.
import { ANGLES } from "./gen-prompt.js";

const API = "https://api.anthropic.com/v1/messages";
const TIMEOUT = 30000; // iki denemenin toplamı dahil
const RETRY_IF_UNDER = 10000; // ilk deneme bundan uzun sürdüyse yeniden denenmez
const RETRY_BUDGET = 15000; // geçen süre + bekleme bunu aşarsa yeniden denenmez
const MAX_TEXT = 3000;

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
    // zaman aşımında istek sağlayıcıya ulaşmış olabilir; bağlantı hatası faturalanmaz
    return isTimeout(e) ? { err: "fail", why: "timeout" } : { retry: true, wait: 0, why: "conn" };
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
export function parse(data, count, angle) {
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
  if (!Array.isArray(d) || !d.length || d.some(x => !x || typeof x.text !== "string" || typeof x.angle !== "string")) throw new LlmError("fail", "shape", usage);
  const empty = d.map(x => x.text.trim() === "");
  if (empty.every(Boolean)) throw new LlmError("refusal", "empty", usage);
  if (empty.some(Boolean)) throw new LlmError("fail", "partial_empty", usage);
  const drafts = d.map(x => ({ angle: x.angle, text: x.text.trim() }));
  if (drafts.some(x => x.text.length > MAX_TEXT || !ANGLES.includes(x.angle))) throw new LlmError("fail", "length_or_angle", usage);
  if (count === 3) {
    if (drafts.length !== 3 || new Set(drafts.map(x => x.angle)).size !== 3) throw new LlmError("fail", "count", usage);
    drafts.sort((a, b) => ANGLES.indexOf(a.angle) - ANGLES.indexOf(b.angle));
  } else {
    if (drafts.length !== 1) throw new LlmError("fail", "count", usage);
    if (angle && drafts[0].angle !== angle) { console.log("gen refine angle", drafts[0].angle, "->", angle); drafts[0].angle = angle; }
  }
  return { drafts, usage, stop, model: String(data.model || "") };
}

async function call(env, f, { system, user, schema, maxTokens, count, angle }) {
  const body = JSON.stringify({
    model: env.GEN_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    stream: false,
  });
  const t0 = Date.now();
  let r = await attempt(env, f, body, TIMEOUT);
  if (r.retry) {
    const elapsed = Date.now() - t0;
    if (elapsed < RETRY_IF_UNDER && elapsed + r.wait <= RETRY_BUDGET) {
      if (r.wait) await sleep(r.wait);
      r = await attempt(env, f, body, Math.max(1000, TIMEOUT - (Date.now() - t0)));
    }
  }
  const ms = Date.now() - t0;
  if (r.retry) { console.log("gen llm busy", r.why, ms); throw new LlmError("busy", r.why); }
  if (r.err) { console.log("gen llm", r.err, r.why, ms); throw new LlmError(r.err, r.why); }
  const out = parse(r.data, count, angle);
  console.log("gen llm ok", out.model, ms, out.usage.input_tokens, out.usage.output_tokens);
  return out;
}

// Yalnız yerel geliştirme: GEN_PROVIDER=fake, DEV_ORIGINS de tanımlıysa (canlıda DEV_ORIGINS yok).
const fake = {
  async generate({ count, angle }) {
    await sleep(600);
    const a = count === 3 ? ANGLES : [angle || ANGLES[0]];
    return { drafts: a.map(x => ({ angle: x, text: `ÖRNEK taslak (${x}).\n\nBu metin sahte sağlayıcıdan geldi; gerçek model çağrılmadı.` })), usage: { input_tokens: 0, output_tokens: 0 }, stop: "end_turn", model: "fake" };
  },
};

export function makeLlm(env, f = fetch) {
  if (env?.GEN_PROVIDER === "fake" && env?.DEV_ORIGINS) return fake;
  return { generate: opts => call(env, f, opts) };
}
