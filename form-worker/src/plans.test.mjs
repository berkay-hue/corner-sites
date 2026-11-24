// node --test src/plans.test.mjs — A9b: worker PLANS sayıları sitedeki assets/plans.js (window.SMC_PLANS) ile aynı mı.
// plans.js metin olarak okunur, ağ/DOM olmadan yalnız sahte window ile node:vm içinde değerlendirilir.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { PLANS, MONTH_KIND, KIND_NAME, planOf, planLimits } from "./plans.js";

const SRC = readFileSync(new URL("../../sites/app.socialmediacorner.co/assets/plans.js", import.meta.url), "utf8");
const site = () => { const window = {}; vm.runInNewContext(SRC, { window }); return window.SMC_PLANS; };

test("plans.js ↔ PLANS: basic/pro aylık sayılar ve Pexels erişimi aynı", () => {
  const S = site();
  for (const p of ["basic", "pro"]) {
    assert.equal(S[p].linkedin_blog, PLANS[p].linkedin_blog, `${p} linkedin_blog`);
    assert.equal(S[p].video_gorsel, PLANS[p].video_gorsel, `${p} video_gorsel`);
    assert.equal(S[p].pexels, PLANS[p].stock, `${p} pexels`);
  }
  // enterprise: Pro dahil + sözleşme → worker'da plan_limits yoksa pro sayıları, stock açık
  assert.equal(S.enterprise.pro_dahil, true);
  assert.equal(S.enterprise.sozlesme, true);
  assert.equal(PLANS.enterprise.stock, true);
  assert.deepEqual(Object.keys(S).sort(), Object.keys(PLANS).sort());
});

test("plans.js metnindeki sayılar regex ile de aynı (değerlendirme dışı yedek denetim)", () => {
  for (const p of ["basic", "pro"]) {
    const m = SRC.match(new RegExp(`\\b${p}:\\{linkedin_blog:(\\d+),video_gorsel:(\\d+)[^}]*pexels:(true|false)`));
    assert.ok(m, `${p} satırı bulunamadı`);
    assert.deepEqual([Number(m[1]), Number(m[2]), m[3] === "true"], [PLANS[p].linkedin_blog, PLANS[p].video_gorsel, PLANS[p].stock]);
  }
});

test("A13: kotalar ÷5 — basic 8/2, pro 40/12 (worker ve site)", () => {
  const S = site();
  assert.deepEqual([PLANS.basic.linkedin_blog, PLANS.basic.video_gorsel, PLANS.pro.linkedin_blog, PLANS.pro.video_gorsel], [8, 2, 40, 12]);
  assert.deepEqual([S.basic.linkedin_blog, S.basic.video_gorsel, S.pro.linkedin_blog, S.pro.video_gorsel], [8, 2, 40, 12]);
  assert.deepEqual([S.basic.marka_sesi, S.pro.marka_sesi], [1, 3]);
});

test("planOf / planLimits: 0018 yok → null, bilinmeyen → basic, enterprise plan_limits ya da pro sayıları", () => {
  assert.equal(planOf(null), null);
  assert.equal(planOf({ id: 1 }), null);
  assert.equal(planOf({ plan: null }), null);
  assert.equal(planOf({ plan: "gold" }), "basic");
  assert.equal(planOf({ plan: "toString" }), "basic");
  assert.equal(planLimits({ id: 1 }), null);
  assert.deepEqual(planLimits({ plan: "basic" }), { plan: "basic", linkedin_blog: 8, video_gorsel: 2, stock: false });
  assert.deepEqual(planLimits({ plan: "pro" }), { plan: "pro", linkedin_blog: 40, video_gorsel: 12, stock: true });
  assert.deepEqual(planLimits({ plan: "enterprise", plan_limits: '{"linkedin_blog":500,"video_gorsel":120}' }), { plan: "enterprise", linkedin_blog: 500, video_gorsel: 120, stock: true });
  assert.deepEqual(planLimits({ plan: "enterprise", plan_limits: '{"linkedin_blog":0,"video_gorsel":"9"}' }), { plan: "enterprise", linkedin_blog: 40, video_gorsel: 12, stock: true });
  assert.deepEqual(planLimits({ plan: "enterprise", plan_limits: "{bozuk" }), { plan: "enterprise", linkedin_blog: 40, video_gorsel: 12, stock: true });
  assert.deepEqual(planLimits({ plan: "enterprise", plan_limits: null }), { plan: "enterprise", linkedin_blog: 40, video_gorsel: 12, stock: true });
  assert.deepEqual(MONTH_KIND, { linkedin: "lb", blog: "lb", video: "vg", instagram: "vg" });
  assert.deepEqual(KIND_NAME, { lb: "linkedin_blog", vg: "video_gorsel" });
});
