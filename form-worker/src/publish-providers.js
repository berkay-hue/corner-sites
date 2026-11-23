// Yayın kuyruğunun yazma bağdaştırıcıları (A7 TEKNIK-PLAN §4, §7). Her biri tek işi dener ve bir SONUÇ döner, istisna atmaz:
//   { to: "yayinlandi", remote_id, code? }            gönderi oluştu
//   { to: "planlandi", after, code, attempt }         istek işlenmedi (açık ret ya da hazırlık çağrısı); after sn sonra yeniden
//                                                     (null: üstel bekleme), attempt: deneme sayılır mı
//   { to: "basarisiz", code }                         kalıcı ret (403, 400/422, konteyner hatası)
//   { to: "kontrol", code }                           yazma isteği gitmiş olabilir, sonuç bilinmiyor (5xx, zaman aşımı, ağ)
//   { auth: true }                                    401 / geçersiz token: çağıran karar verir (LinkedIn: basarisiz, IG: bir yenileme)
// Yazma çağrısı (LinkedIn POST /rest/posts, IG media_publish) yalnız açık retle (401, 429) tekrar edilir; hazırlık çağrıları
// (yayın sınırı, konteyner, durum) 5xx/ağda tekrar edilebilir: yayınlanmamış konteyner gönderi değildir.
// Gerçek uçlar bu dilimde hiç çağrılmadı; testler fakeProvider ile. Uç, sürüm, alan ve hata kodları DOĞRULANMALI.
// Token yalnız istekte kullanılır; sonuç kodlarına, log'a ve olaylara yazılmaz.

export const LI = "https://api.linkedin.com", LI_VERSION = "202610";
export const IG_API = "https://graph.instagram.com/v23.0";
export const WRITE_TIMEOUT = 15000, PREP_TIMEOUT = 8000;
// En kötü durumda iş başına dış istek (yenileme dahil): LinkedIn 1 (yenileme yok), IG yenileme + sınır + konteyner + 2 yoklama
// + media_publish = 6 (TEKNIK-PLAN §3). publishTick kirayı ve 401 sonrası ikinci denemeyi buna göre sınırlar.
export const COST = { linkedin: 1, instagram: 6 };

// LinkedIn "little text" biçiminde ayrılmış karakterler ters bölüyle kaçırılır (#484 kuralı: panel yalnız çözüyordu).
// Tek karakter sınıfı, niceleyici yok: doğrusal, geri izleme yok. DOĞRULANMALI: @ ve # kaçınca anma/etiket bağlantıya
// dönmez, düz metin kalır (bu dilimde bilinçli; anma URN'leri A7-2+).
export const liEscape = s => String(s).replace(/[\\|{}@[\]()<>#*_~]/g, "\\$&");

// Retry-After: saniye ya da HTTP tarihi; [1, 6 sa] aralığına kırpılır, yoksa/okunamazsa null (üstel bekleme)
export function retryAfter(res, now = Date.now()) {
  const v = res?.headers?.get?.("retry-after");
  if (v == null || String(v).trim() === "") return null;
  let s = /^\s*\d+\s*$/.test(v) ? Number(v) : Math.ceil((Date.parse(v) - now) / 1000);
  if (!Number.isFinite(s)) return null;
  return Math.min(Math.max(s, 1), 21600);
}

// Hata yanıtını sonuca çevirir. pre: kod öneki (li/ig), write: yazma çağrısı mı (5xx → kontrol, tekrar yok).
// Graph API (IG) hataları çoğu zaman 400 + error.code ile gelir: 190 geçersiz token, 4/17/32/613 oran sınırı, 9 yayın
// sınırı, 10/200 izin, is_transient geçici. DOĞRULANMALI (Instagram API with Instagram Login hata kodları).
async function classify(res, pre, write) {
  const body = await res.json().catch(() => null);
  const ge = body?.error && typeof body.error === "object" ? body.error : null;
  if (res.status === 401 || ge?.code === 190) return { auth: true };
  if (res.status === 429 || [4, 17, 32, 613].includes(ge?.code)) return { to: "planlandi", after: retryAfter(res), code: `${pre}_429`, attempt: false };
  if (ge?.code === 9) return { to: "planlandi", after: 3600, code: `${pre}_quota`, attempt: false };
  if (res.status >= 500 || ge?.is_transient === true) {
    return write ? { to: "kontrol", code: `${pre}_${res.status}` } : { to: "planlandi", after: null, code: `${pre}_${res.status}`, attempt: true };
  }
  if (res.status === 403 || ge?.code === 10 || ge?.code === 200) return { to: "basarisiz", code: `${pre}_forbidden` };
  return { to: "basarisiz", code: `${pre}_${res.status}` }; // 400/404/422: metin ya da medya reddedildi
}

// ---- LinkedIn: Posts API (Community Management API, Standard Tier) ----
// DOĞRULANMALI: POST https://api.linkedin.com/rest/posts, başlıklar LinkedIn-Version (YYYYMM) ve X-Restli-Protocol-Version
// 2.0.0, gövde alanları ve 201 + x-restli-id yanıtı; kapsam w_member_social (bugün OAuth'ta yok, A7-2). Yazar yalnız üye
// (urn:li:person); kurum yazarı (w_organization_social) sonraki dilim.
export async function linkedin({ job, token, f, onWrite = () => {} }) {
  onWrite();
  let res;
  try {
    res = await f(`${LI}/rest/posts`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "linkedin-version": LI_VERSION, "x-restli-protocol-version": "2.0.0" },
      body: JSON.stringify({
        author: `urn:li:person:${job.account_external_id}`,
        commentary: liEscape(job.body),
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
      signal: AbortSignal.timeout(WRITE_TIMEOUT),
    });
  } catch { return { to: "kontrol", code: "li_network" }; }
  if (res.status === 201 || res.status === 200) {
    const id = res.headers.get("x-restli-id");
    // Gönderi oluştu; kimlik gelmediyse de yeniden denenmez (çift gönderi)
    return id ? { to: "yayinlandi", remote_id: id.slice(0, 200) } : { to: "yayinlandi", remote_id: null, code: "li_no_id" };
  }
  return classify(res, "li", true);
}

// ---- Instagram: content publishing (Instagram API with Instagram Login) ----
// Hazırlık çağrısı: ağ/zaman aşımı → planlandi (deneme sayılır); başarıda gövde
async function prep(f, url, init = {}) {
  let res;
  try { res = await f(url, { ...init, signal: AbortSignal.timeout(PREP_TIMEOUT) }); } catch { return { out: { to: "planlandi", after: null, code: "ig_network", attempt: true } }; }
  if (!res.ok) return { out: await classify(res, "ig", false) };
  const body = await res.json().catch(() => null);
  if (body?.error) return { out: await classify(new Response(JSON.stringify(body), { status: 400 }), "ig", false) };
  return { body };
}
const form = obj => ({ method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(obj) });
const sleep = ms => new Promise(r => setTimeout(r, ms));
export const IG_QUOTA = 50; // DOĞRULANMALI: config.quota_total gelmezse varsayılan 24 saatlik sınır

// saveContainer(id): konteyner kimliğini işe yazar (tekrar yalnız media_publish'i aynı creation_id ile çağırır).
export async function instagram({ job, token, f, saveContainer = async () => {}, pollWait = 3000, onWrite = () => {} }) {
  const ig = job.account_external_id;
  if (!job.media_url) return { to: "basarisiz", code: "ig_no_media" };
  // 1) 24 saatlik yayın sınırı. DOĞRULANMALI: GET /{ig-user-id}/content_publishing_limit?fields=quota_usage,config
  let r = await prep(f, `${IG_API}/${encodeURIComponent(ig)}/content_publishing_limit?${new URLSearchParams({ fields: "quota_usage,config", access_token: token })}`);
  if (r.out) return r.out;
  const q = Array.isArray(r.body?.data) ? r.body.data[0] : null;
  const used = Number(q?.quota_usage), total = Number(q?.config?.quota_total) || IG_QUOTA;
  if (Number.isFinite(used) && used >= total) return { to: "planlandi", after: 3600, code: "ig_quota", attempt: false };

  // 2) Konteyner (yoksa). DOĞRULANMALI: POST /{ig-user-id}/media (image_url, caption) → { id }
  let container = job.container_id;
  if (!container) {
    r = await prep(f, `${IG_API}/${encodeURIComponent(ig)}/media`, form({ image_url: job.media_url, caption: job.body, access_token: token }));
    if (r.out) return r.out;
    container = r.body?.id == null ? "" : String(r.body.id);
    if (!/^[0-9A-Za-z_-]{1,64}$/.test(container)) return { to: "planlandi", after: null, code: "ig_bad_response", attempt: true };
    await saveContainer(container);
  }

  // 3) Durum, en çok 2 yoklama. DOĞRULANMALI: GET /{container-id}?fields=status_code (FINISHED, IN_PROGRESS, ERROR,
  // EXPIRED, PUBLISHED)
  let status = null;
  for (let i = 0; i < 2 && status !== "FINISHED"; i++) {
    if (i && pollWait) await sleep(pollWait);
    r = await prep(f, `${IG_API}/${encodeURIComponent(container)}?${new URLSearchParams({ fields: "status_code", access_token: token })}`);
    if (r.out) return r.out;
    status = String(r.body?.status_code ?? "");
    if (status === "PUBLISHED") return { to: "yayinlandi", remote_id: null, code: "already_published" };
    if (status === "ERROR" || status === "EXPIRED") return { to: "basarisiz", code: `ig_container_${status.toLowerCase()}` };
  }
  if (status !== "FINISHED") return { to: "planlandi", after: 60, code: "ig_in_progress", attempt: false };

  // 4) Yayın (yazma çağrısı). DOĞRULANMALI: POST /{ig-user-id}/media_publish (creation_id) → { id }
  onWrite();
  let res;
  try {
    res = await f(`${IG_API}/${encodeURIComponent(ig)}/media_publish`, { ...form({ creation_id: container, access_token: token }), signal: AbortSignal.timeout(WRITE_TIMEOUT) });
  } catch { return { to: "kontrol", code: "ig_network" }; }
  if (res.ok) {
    const b = await res.json().catch(() => null);
    if (b?.error) return classify(new Response(JSON.stringify(b), { status: 400 }), "ig", true);
    return b?.id != null ? { to: "yayinlandi", remote_id: String(b.id).slice(0, 200) } : { to: "yayinlandi", remote_id: null, code: "ig_no_id" };
  }
  return classify(res, "ig", true);
}

export const PROVIDERS = { linkedin, instagram };

// Test sahtesi: sıralı yanıt listesi ([{status, headers, body} | {throw: "timeout"|"network"}]) ya da (url, init) → yanıt
// işlevi. Her çağrı calls'a yazılır (url, method, body metni). Gerçek ağa hiç çıkmaz.
export function fakeProvider(responses) {
  const calls = [];
  const f = async (url, init = {}) => {
    const body = init.body == null ? null : String(init.body);
    calls.push({ url: String(url), method: init.method || "GET", body, headers: init.headers || {} });
    const r = typeof responses === "function" ? await responses(String(url), init, calls.length - 1) : responses.shift();
    if (!r) throw new Error("fakeProvider: yanıt kalmadı");
    if (r.throw) {
      const e = new Error(r.throw === "timeout" ? "The operation was aborted due to timeout" : "fetch failed");
      e.name = r.throw === "timeout" ? "TimeoutError" : "TypeError";
      throw e;
    }
    const status = r.status ?? 200;
    const text = r.body === undefined || status === 204 ? null : typeof r.body === "string" ? r.body : JSON.stringify(r.body);
    return new Response(text, { status, headers: r.headers });
  };
  f.calls = calls;
  return f;
}
