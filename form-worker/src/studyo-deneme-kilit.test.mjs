// node --test src/studyo-deneme-kilit.test.mjs — 25.11 "Ufak açıklar" (OTOBLOG-DURUM §1), yalnız ön yüz; statik denetim.
// a) Demo/Basic deneme görseli harcanırken (POST /gen/stock/use sürerken) Görselli/Görselsiz seçimi kilitli:
//    studyo-kabuk.js 'studyo:harca' olayını başta ve sonda yayar; gorselSecim ve studyo-kurgu.js bu olayla iki radyoyu
//    aria-disabled + fieldset aria-busy yapar, change'i geri çevirir ve MESGUL notunu gösterir.
// b) Deneme görseli ilk karta/sahneye düşünce sonraki boş kartlarda kısa not: "Diğer kartlara görsel Pro planda".
// c) Değişen css/js için tüm HTML'lerde (TR + en/) tek ?v= değeri.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const APP = fileURLToPath(new URL("../../sites/app.socialmediacorner.co/", import.meta.url));
const oku = (p) => readFileSync(join(APP, p), "utf8");
const KABUK = oku("assets/studyo-kabuk.js");
const KURGU = oku("assets/studyo-kurgu.js");
const CSS = oku("assets/studyo.css");
const MESGUL_TR = "Görsel ekleniyor… Bitince Görselli/Görselsiz seçimini değiştirebilirsin.";
const MESGUL_EN = "Adding the image… You can switch between with and without images when it’s done.";

function htmller(dir = APP, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) htmller(p, out);
    else if (f.endsWith(".html")) out.push(p);
  }
  return out;
}

test("a) kabuk: harca başında ve sonunda 'studyo:harca' yayılır (başarı + hata yolu), stokHarciyor/GORSEL_MESGUL dışa açık", () => {
  assert.match(KABUK, /function harcaYayinla\(\)\{try\{d\.dispatchEvent\(new CustomEvent\('studyo:harca'/);
  const i = KABUK.indexOf("harcaP=post('/gen/stock/use'");
  assert.ok(i > 0, "stokHarca POST /gen/stock/use bulunamadı");
  const govde = KABUK.slice(i, KABUK.indexOf("\n}", i));
  // then (başarı), catch (hata) ve istek başlarken: üç yayın
  assert.equal((govde.match(/harcaYayinla\(\)/g) || []).length, 3, "harcaYayinla üç kez çağrılmalı");
  assert.match(govde, /harcaP=null;harcaId='';harcaYayinla\(\)/, "başarıda kilit önce kalkmalı, sonra yayın");
  assert.match(KABUK, /stokHarciyor:function\(\)\{return !!harcaP\}/);
  assert.match(KABUK, /GORSEL_MESGUL:MESGUL/);
  assert.ok(KABUK.includes(MESGUL_TR) && KABUK.includes(MESGUL_EN), "MESGUL TR + EN");
});

test("a) kabuk gorselSecim: harca sürerken iki radyo aria-disabled, fieldset aria-busy; change geri çevrilir", () => {
  assert.match(KABUK, /if\(harcaP\)\{yok\.setAttribute\('aria-disabled','true'\);stk\.setAttribute\('aria-disabled','true'\);fs\.setAttribute\('aria-busy','true'\)\}/);
  assert.match(KABUK, /else\{yok\.removeAttribute\('aria-disabled'\);fs\.removeAttribute\('aria-busy'\)\}/);
  assert.match(KABUK, /if\(harcaP\)\{\(r===yok\?stk:yok\)\.checked=true;durum\(MESGUL\);toast\(MESGUL\)/);
  assert.match(KABUK, /d\.addEventListener\('studyo:harca',guncelle\)/);
});

test("a) kurgu (görsel/video): aynı kilit — S.stokHarciyor, aria-busy, change geri çevirme, studyo:harca dinleyicisi", () => {
  assert.match(KURGU, /var G_MESGUL=S\.GORSEL_MESGUL\|\|T\(/);
  assert.ok(KURGU.includes(MESGUL_TR) && KURGU.includes(MESGUL_EN), "kurgu yedek MESGUL TR + EN");
  assert.match(KURGU, /S\.stokHarciyor/);
  assert.match(KURGU, /setAttribute\('aria-busy','true'\)/);
  assert.match(KURGU, /removeAttribute\('aria-busy'\)/);
  assert.match(KURGU, /d\.addEventListener\('studyo:harca',function\(\)\{gYaz\(\)\}\)/);
});

test("b) kurgu: ilk boş kart tam kilit satırı, sonraki boş kartlar kısa 'Pro planda' notu (TR + EN, kart/sahne)", () => {
  assert.match(KURGU, /function kisaKilit\(\)\{/);
  for (const s of ["Diğer kartlara görsel Pro planda.", "Images for other cards on Pro.", "Diğer sahnelere görsel Pro planda.", "Images for other scenes on Pro."])
    assert.ok(KURGU.includes(s), s);
  assert.match(KURGU, /if\(!s\.gorsel&&stokKilit\(\)\)\{if\(!GS\|\|i===ilkBos\(\)\)return kilitSatir\(i\);return denemeDurum\(\)==='bitti'\?kisaKilit\(\):null\}/);
  assert.match(KURGU, /'kr-so-gorsel kr-gorsel-kisa'/);
  assert.match(CSS, /\.kr-gorsel-kisa\{[^}]*color:var\(--ink2\)/);
});

test("a) css: meşgulken seçili çip seçili görünür (dashed disabled kuralını ezer) + forced-colors", () => {
  assert.match(CSS, /\.st-gorsel\[aria-busy="true"\] \.cip input:checked\+label[^{]*\{border-style:solid;background:var\(--accent\)/);
  assert.match(CSS, /\.st-gorsel\[aria-busy="true"\] \.cip input\+label\{cursor:progress\}/);
  assert.match(CSS, /@media \(forced-colors:active\)\{\.st-gorsel\[aria-busy="true"\] \.cip input:checked\+label\{forced-color-adjust:none;background:Highlight/);
});

test("c) ?v=: studyo.css, studyo-kabuk.js, studyo-kurgu.js her HTML'de (TR + en/) tek ve güncel sürüm", () => {
  const beklenen = { "studyo.css": "gs3", "studyo-kabuk.js": "ak1", "studyo-kurgu.js": "gs2" };
  const sayi = {};
  for (const p of htmller()) {
    const h = readFileSync(p, "utf8");
    for (const [ad, v] of Object.entries(beklenen)) {
      const re = new RegExp(`/assets/${ad.replace(/\./g, "\\.")}(\\?v=([A-Za-z0-9._-]+))?["']`, "g");
      for (const m of h.matchAll(re)) {
        assert.equal(m[2], v, `${p.slice(APP.length)}: ${ad}?v=${m[2] || "(yok)"}`);
        sayi[ad] = (sayi[ad] || 0) + 1;
      }
    }
  }
  assert.ok(sayi["studyo.css"] >= 31, `studyo.css ${sayi["studyo.css"]} sayfada`);
  assert.equal(sayi["studyo-kabuk.js"], 12);
  assert.equal(sayi["studyo-kurgu.js"], 4);
});
