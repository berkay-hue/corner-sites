// C1 (smc-app-9): video/karusel büyüt + tam ekran, duyarlı önizleme + oran çipleri, kurguda kalıcılık, medya kaydı istemcisi.
// Statik kontroller: istemci dosyalarında sözleşme parçaları ve CSP (satır içi script/style yok) korunuyor mu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const kok = new URL('../../sites/app.socialmediacorner.co/', import.meta.url);
const oku = (p) => readFileSync(new URL(p, kok), 'utf8');
const KURGU = oku('assets/studyo-kurgu.js');
const MEDYA = oku('assets/studyo-medya.js');
const CSS = oku('assets/studyo.css');
const SAYFA = { tr: oku('video.html'), en: oku('en/video.html') };

test('C1·6 büyüt: tam ekran düğmesi, F kısayolu, webkit + <dialog> yedeği tek sarmalı taşır', () => {
  assert.match(KURGU, /kr-buyut-d/);
  assert.match(KURGU, /aria-keyshortcuts','F'/);
  assert.match(KURGU, /e\.key==='f'\|\|e\.key==='F'/);
  assert.match(KURGU, /requestFullscreen\|\|s\.webkitRequestFullscreen/);
  assert.match(KURGU, /webkitfullscreenchange/);
  assert.match(KURGU, /createElement\('dialog'\)/);
  assert.match(KURGU, /showModal/);
  assert.match(KURGU, /T\('Tam ekrandan çık','Exit full screen'\)/);
  // tek oynatıcı: büyütme ikinci bir M.play açmaz
  assert.equal((KURGU.match(/M\.play\(/g) || []).length, 1);
  assert.match(CSS, /\.kr-oyn-sar:fullscreen\{/);
  assert.match(CSS, /\.kr-oyn-sar:-webkit-full-screen\{/);
  assert.match(CSS, /dialog\.kr-buyut-dlg\{/);
});

test('C1·7 oran: formda #oran-secim (TR + en/), kurgu oranSec ile tasarım paneli eşit; 16:9 tam genişlik', () => {
  for (const [dil, h] of Object.entries(SAYFA)) {
    assert.match(h, /<fieldset class="cipler" id="oran-secim">/, dil);
    for (const v of ['9:16', '1:1', '16:9']) assert.ok(h.includes(`name="kr_oran" `) && h.includes(`value="${v}"`), `${dil} ${v}`);
    assert.doesNotMatch(h, /<style[\s>]/, `${dil}: satır içi style yok`);
    assert.doesNotMatch(h, /<script(?![^>]*\bsrc=)[^>]*>/, `${dil}: satır içi script yok`);
  }
  assert.match(SAYFA.tr, /dikey ya da yatay bir video/);
  assert.match(SAYFA.en, /vertical or landscape video/);
  assert.match(KURGU, /function oranSec\(a\)/);
  assert.match(KURGU, /oranSec\(a\);S\.durum/);
  assert.match(KURGU, /kr-kirp-not/);
  assert.match(CSS, /\.kr-cerceve\[data-aspect="16:9"\]\{width:100%;[^}]*calc\(\(100dvh - var\(--kr-pay\)\) \* 16 \/ 9\)\)\}/);
  assert.match(CSS, /\.kr-cerceve\{--kr-oran:\.5625;--kr-pay:330px;/);
  assert.match(CSS, /\.st-izgara:has\(#studyo-medya\)/);
});

test('C1·2/3 kayıt: medyaAl şeması, S.medyaKaydet yoksa yerel yedek, geri yüklemede sonVer + OTO yok', () => {
  assert.match(KURGU, /function medyaAl\(\)/);
  assert.match(KURGU, /typeof S\.medyaKaydet==='function'/);
  assert.match(KURGU, /'studyo-medya-'\+id/);
  assert.match(KURGU, /'studyo-son-'\+KIND/);
  assert.match(KURGU, /https:\/\/images\.pexels\.com\//);
  assert.match(KURGU, /foto\.length<12/);
  assert.match(KURGU, /MB_HEDEF=7000/);
  assert.match(KURGU, /S\.medya\.sonVer=sonVer/);
  assert.match(KURGU, /if\(tm&&!det\.geri\)otoKontrol\(\)/);
  assert.match(MEDYA, /goster:function\(r,q,o\)/);
  assert.match(MEDYA, /geri:!!\(o&&o\.geri\)/);
  assert.match(MEDYA, /api\.taslakId=/);
  assert.match(MEDYA, /sonAl:function\(\)/);
  assert.match(MEDYA, /sonVer:function\(m\)/);
});

test('C1: Safari — istemci dosyalarında regex lookbehind yok', () => {
  for (const [ad, s] of Object.entries({ KURGU, MEDYA })) assert.doesNotMatch(s, /\(\?<[=!]/, ad);
});

test('C1 inceleme: kurgu değişince studyo-son kaydı da güncellenir, sahne atınca foto süzülür, oran/palet geri yükleme', () => {
  // yenilemede sonUygula studyo-son-<kind>.media'yı okur: kayıt S.medyaKaydet varken de güncellenmeli
  assert.match(KURGU, /S\.medyaKaydet\(id,m\);sonMedyaYaz\(id,m\)/);
  assert.match(KURGU, /function sonMedyaYaz\(id,m\)\{\s*if\(typeof S\.sonGuncelle==='function'\)/);
  // küçültmede her sahne atımından sonra kullanılmayan foto düşer (gereğinden çok sahne atılmaz)
  assert.match(KURGU, /while\(sah\.length>1&&boyutB\(m\)>MB_HEDEF\)\{sah\.pop\(\);fotoSuz\(\)\}/);
  // __proto__ / toString gibi oran adları kabul edilmez
  assert.match(KURGU, /Object\.prototype\.hasOwnProperty\.call\(M\.aspects,tr\.aspect\)/);
  // kayıtlı medyadaki şablon varsayılan paleti "seçildi" sayılmaz
  assert.match(KURGU, /tr\.palette===tplO\(tp\)\.palette\)ps=false/);
});
