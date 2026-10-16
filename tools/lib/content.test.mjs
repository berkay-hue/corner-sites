// node --test tools/lib/content.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { faqItems } from "./content.mjs";

const qa = "### Ne kadar sürer?\nGenelde iki hafta.\n\n### Kimler için?\nB2B SaaS ekipleri için.\n";

test("düz '## Sık sorulan sorular'", () => {
  assert.deepEqual(faqItems(`Giriş.\n\n## Sık sorulan sorular\n\n${qa}`), [["Ne kadar sürer?", "Genelde iki hafta."], ["Kimler için?", "B2B SaaS ekipleri için."]]);
});

test("başlık varyantları", () => {
  for (const h of ["## **SSS**", "## FAQs:", "## Sıkça Sorulan Sorular", "## Frequently Asked Questions", "## FAQ", "## Sık Sorulan Sorular"]) {
    assert.equal(faqItems(`${h}\n\n${qa}`).length, 2, h);
  }
});

test("SSS'den sonraki '## Sonuç' cevaba karışmaz; cevap ilk paragraftır", () => {
  const md = `## Sık sorulan sorular\n\n### Ne kadar sürer?\n**Genelde** iki [hafta](/blog/x).\n\nİkinci paragraf.\n\n## Sonuç\n\nKapanış.`;
  assert.deepEqual(faqItems(md), [["Ne kadar sürer?", "Genelde iki hafta."]]);
});

test("SSS bölümü yoksa ya da başka bir başlığın parçasıysa boş", () => {
  assert.deepEqual(faqItems("## Giriş\n\n### Soru?\nCevap."), []);
  assert.deepEqual(faqItems("## SSS ve ötesi\n\n### Soru?\nCevap."), []);
  assert.deepEqual(faqItems("## Sık sorulan sorular\n\nSoru yok."), []);
});

test("başlık sonunda NBSP/BOM kabul edilir; uzun boşluk dizisi yavaşlatmaz", () => {
  for (const h of ["## FAQ\u00a0", "## SSS\ufeff", "## SSS \r"]) assert.equal(faqItems(`${h}\n\n${qa}`).length, 2, JSON.stringify(h));
  const t0 = performance.now();
  assert.deepEqual(faqItems("## SSS" + " ".repeat(5000) + "x\n\n" + qa), []);
  assert.ok(performance.now() - t0 < 200);
});
