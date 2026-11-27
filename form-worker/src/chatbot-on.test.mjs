// Chatbot ön uç denetimi (sözleşme §10.2, §11): yalnız dosya okur, ağ/DOM yok.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const yol = (p) => new URL('../../sites/app.socialmediacorner.co/' + p, import.meta.url);
const oku = (p) => readFileSync(yol(p), 'utf8');
const YASAK = [/innerHTML/, /outerHTML/, /insertAdjacentHTML/, /\beval\s*\(/, /new\s+Function/, /document\.write/];

test('w/sohbet.js ham boyutu 15360 baytı geçmez', () => {
  assert.ok(statSync(yol('w/sohbet.js')).size <= 15360);
});

for (const p of ['w/sohbet.js', 'assets/chatbot.js']) {
  test(p + ' yasak DOM/kod API’si içermez (yorumlar dahil)', () => {
    const s = oku(p);
    for (const r of YASAK) assert.ok(!r.test(s), p + ' içinde ' + r);
  });
}

test('w/sohbet.js: shadow DOM, korumalı localStorage, sözleşme uçları', () => {
  const s = oku('w/sohbet.js');
  assert.match(s, /attachShadow/);
  assert.match(s, /localStorage/);
  assert.match(s, /try\{/);
  assert.match(s, /'smc-sohbet:'\+KEY/);
  assert.match(s, /\^wk_\[A-Za-z0-9_-\]\{24\}\$/);
  for (const u of ["'/config'", "'/mesaj'", "'/lead'"]) assert.ok(s.includes(u), u);
  assert.match(s, /text\/plain;charset=UTF-8/);
  assert.match(s, /credentials='omit'/);
  assert.match(s, /noopener noreferrer/);
  // localStorage her erişimi try içinde
  for (const m of s.matchAll(/localStorage\.(getItem|setItem)/g)) {
    const once = s.slice(Math.max(0, m.index - 60), m.index);
    assert.match(once, /try\{/, 'try dışında localStorage');
  }
});

test('assets/chatbot.js: localStorage yalnız try içinde, satır içi stil yok', () => {
  const s = oku('assets/chatbot.js');
  assert.ok(!/\.style\.(?!setProperty)[a-zA-Z]+\s*=/.test(s), 'el.style.x = kullanılmış');
  assert.ok(!/setAttribute\(\s*['"]style['"]/.test(s));
  assert.match(s, /smcBotBasla/);
  for (const m of s.matchAll(/localStorage\.(getItem|setItem|removeItem)/g)) {
    const once = s.slice(Math.max(0, m.index - 40), m.index);
    assert.match(once, /try\{/, 'try dışında localStorage');
  }
});

for (const [p, dil, es] of [['chatbot.html', 'tr', '/en/chatbot'], ['en/chatbot.html', 'en', '/chatbot']]) {
  test(p + ' sayfa iskeleti', () => {
    const s = oku(p);
    assert.match(s, new RegExp('<html[^>]*lang="' + dil + '"'));
    assert.match(s, /data-sayfa="chatbot"/);
    assert.match(s, /\/assets\/chatbot\.js\?v=cb1/);
    assert.match(s, /\/assets\/chatbot\.css\?v=cb1/);
    assert.match(s, /hreflang="tr" href="https:\/\/app\.socialmediacorner\.co\/chatbot"/);
    assert.match(s, /hreflang="en" href="https:\/\/app\.socialmediacorner\.co\/en\/chatbot"/);
    assert.ok(s.includes('href="' + es + '"'), 'dil değiştirici');
    assert.ok(!/\sstyle=/.test(s), 'satır içi style=');
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(s), 'satır içi script');
    for (const r of YASAK) assert.ok(!r.test(s), p + ' içinde ' + r);
  });
}

test('assets/chatbot.css dosyası var ve iki ayrı kaydırma sütunu kurmaz', () => {
  const s = oku('assets/chatbot.css');
  assert.ok(s.length > 0);
  assert.match(s, /\.cb-test-yan/);
  assert.match(s, /position:\s*sticky/);
});
