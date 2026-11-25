// node --test src/cms-yenile.test.mjs — otomatik blog kartı: "Şimdi bir yazı yaz" hatasında durum yenileme + "Durumu yenile" düğmesi.
// Yalnız ön yüz (assets/cms.js); statik denetim (DOM kütüphanesi yok).
// a) run 409 site_state / 403 trial_ended / 402 quota / 429 daily_limit → GET /app/cms ile durum yeniden okunur, kart yeniden çizilir,
//    hata notu kartNot'ta saklandığı için yeni kartta görünür kalır.
// b) "Durumu yenile" / "Refresh status" düğmesi: bosMu + mesgul (çift tık ikinci istek göndermez), tek uçuşta tek GET (tazeP).
// c) L() ile TR/EN, innerHTML ve satır içi stil yok, ORNEK sahte API run hatalarını döner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const APP = fileURLToPath(new URL("../../sites/app.socialmediacorner.co/", import.meta.url));
const JS = readFileSync(join(APP, "assets/cms.js"), "utf8");

// "function ad(" ile başlayan bir sonraki üst düzey "function" ya da dosya sonuna kadar olan gövde
function govde(ad) {
  const i = JS.indexOf("function " + ad + "(");
  assert.ok(i >= 0, ad + " bulunamadı");
  const j = JS.indexOf("\nfunction ", i + 1);
  return JS.slice(i, j < 0 ? JS.length : j);
}

test("TAZELE_HATA dört run hatasını (ve plan/site yok) kapsar", () => {
  const m = JS.match(/var TAZELE_HATA=\{([^}]*)\}/);
  assert.ok(m, "TAZELE_HATA yok");
  for (const k of ["site_state", "trial_ended", "quota", "daily_limit", "plan_required", "not_found"]) {
    assert.match(m[1], new RegExp("\\b" + k + ":1"), k);
  }
});

test("durumTazele: GET /app/cms, aynı anda tek istek, ağ hatası yakalanır, kart yeniden çizilir", () => {
  const g = govde("durumTazele");
  assert.match(g, /cagir\('\/app\/cms','GET'\)/);
  assert.match(g, /if\(tazeP\)return tazeP;/, "süren istek varsa aynı söz dönmeli");
  assert.match(g, /tazeP=null/, "istek bitince tazeP sıfırlanmalı");
  assert.match(g, /\.then\(null,function\(\)\{return \{error:'network',_s:0\}\}\)/, "red ağ hatasına çevrilmeli");
  assert.match(g, /veri=normal\(j\)/);
  assert.match(g, /idler\.forEach\(kartYenile\)/);
  assert.match(g, /odakVer\(o\)/, "odak yeni karta taşınmalı");
});

test("simdiYaz: TAZELE_HATA'da hataTazele; not yenilemeden sonra yeniden yazılır, düğme yenileme bitene kadar meşgul", () => {
  const g = govde("simdiYaz");
  assert.match(g, /if\(api\.bosMu\(b\)\)return;/);
  assert.match(g, /\/app\/cms\/'\+encodeURIComponent\(s\.id\)\+'\/run','POST',\{rid:r\}/);
  assert.match(g, /if\(!TAZELE_HATA\[h\.k\]\)\{bitti\(\);kartNotu\(/);
  assert.match(g, /hataTazele\(anahtar,h,bitti\)/);
  // rid tekrarında hak yerelde ikinci kez sayılmaz
  assert.match(g, /tekrar=!!bekleyenRid\[anahtar\]/);
  assert.match(g, /if\(!tekrar&&veri\.quota\.lb_limit>0/);

  const h = govde("hataTazele");
  const iTaze = h.indexOf("durumTazele(id).then(");
  const iBitti = h.indexOf("bitti();");
  assert.ok(iTaze >= 0 && iBitti > iTaze, "bitti() yenileme bittikten sonra çağrılmalı");
  assert.match(h.slice(iTaze), /kartNotu\(id,h\.m,'hata',h\.bag\)/, "hata notu yeni kartta yeniden yazılmalı");
  assert.match(h, /SITE_YOK/, "site kaldırılmışsa açık not");
});

test("durum (duraklat/aç) TAZELE_HATA'da da durumu yeniler", () => {
  assert.match(govde("durum"), /if\(TAZELE_HATA\[h\.k\]\)\{hataTazele\(String\(s\.id\),h,bitti\);return\}/);
});

test("kart notu yeniden çizimde kalır (kartNot, süre sınırlı)", () => {
  assert.match(govde("kartNotu"), /kartNot\[id\]=\{m:m,tur:tur\|\|'',bag:bag\|\|null,t:Date\.now\(\)\}/);
  const k = govde("siteKart");
  assert.match(k, /var kn=kartNot\[String\(s\.id\)\];/);
  assert.match(k, /Date\.now\(\)-kn\.t<NOT_OMUR\)not\(sn,kn\.m,kn\.tur,kn\.bag\)/);
});

test("Durumu yenile düğmesi: L() metni, mevcut sınıflar, bosMu + mesgul", () => {
  const k = govde("siteKart");
  assert.match(k, /el\('button','btn btn-metin btn-kucuk',L\('Durumu yenile','Refresh status'\),\{type:'button','data-eylem':'tazele'\}\)/);
  assert.match(k, /tazeleTik\(s,tb\)/);
  const t = govde("tazeleTik");
  assert.match(t, /if\(api\.bosMu\(b\)\)return;/);
  assert.match(t, /api\.mesgul\(b,L\('Yenileniyor…','Refreshing…'\)\)/);
  assert.match(t, /durumTazele\(id\)\.then\(function\(j\)\{\s*bitti\(\);/);
  assert.match(t, /L\('Durum güncellendi\.','Status updated\.'\)/);
});

test("CSP: innerHTML yok, satır içi stil yok", () => {
  const kod = JS.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(kod, /\.innerHTML\s*=/);
  assert.doesNotMatch(kod, /\.style\.|['"]style['"]\s*:|setAttribute\(\s*['"]style/);
  assert.doesNotMatch(kod, /\beval\(|new Function\(/);
});

test("ORNEK sahte API run hatalarını döner (yenileme yolu örnekte de çalışır)", () => {
  assert.match(JS, /j=yan\(\{error:'site_state',state:s2\.state\},409\)/);
  assert.match(JS, /j=yan\(\{error:'quota'\},402\)/);
  assert.match(JS, /j=yan\(\{error:'daily_limit'\},429\)/);
});
