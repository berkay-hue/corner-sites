// node --test form-worker/src/classify.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { NICHES, fold, classify, resolveNiches, resolveNiche, campaignNiches, fit, analyze } from "./classify.js";

const tags = r => r.niches.map(n => n.tag);

test("fold: Türkçe büyük/küçük harf ve aksanlar", () => {
  assert.equal(fold("İSTANBUL"), "istanbul");
  assert.equal(fold("IŞIK"), "isik");
  assert.equal(fold("Çağrı Öğün"), "cagri ogun");
  assert.equal(fold(null), "");
});

test("classify: boş girdi konu üretmez", () => {
  for (const x of ["", null, undefined, [], "merhaba nasılsınız"]) assert.deepEqual(classify(x), { niches: [], matched: 0 });
});

test("classify: yazım farkı aynı konuya gider", () => {
  for (const s of ["cilt bakımı", "CİLT BAKIMI", "#CiltBakimi", "#ciltbakımı", "skincare", "#SkinCare"])
    assert.deepEqual(tags(classify(s)), ["cilt bakımı"], s);
});

test("classify: hashtag 2, kelime 1 ağırlık; paylar ~100", () => {
  const r = classify("Sabah cilt bakımı rutinim: serum ve güneş kremi #CiltBakimi #skincare");
  assert.deepEqual(r.niches, [{ tag: "cilt bakımı", score: 88 }, { tag: "yaşam tarzı", score: 13 }]);
  assert.equal(r.matched, 8);
  assert.deepEqual(classify("#oyun serum").niches, [{ tag: "oyun", score: 67 }, { tag: "cilt bakımı", score: 33 }]);
});

test("classify: dizi girdi (açıklama + etiketler)", () => {
  const r = classify(["#oyun", "valorant gameplay"]);
  assert.deepEqual(r.niches, [{ tag: "oyun", score: 100 }]);
  assert.equal(r.matched, 4);
});

test("classify: ekli kelimeler ve birleşik hashtag'ler", () => {
  assert.deepEqual(tags(classify("makyajım")), ["güzellik"]);
  assert.deepEqual(tags(classify("tarifleri")), ["yemek"]);
  assert.deepEqual(classify("#sabahrutinim #yemektarifleri").niches, [{ tag: "yaşam tarzı", score: 50 }, { tag: "yemek", score: 50 }]);
});

test("classify: ünsüz yumuşaması (k→ğ, t→d, p→b) ve ekler", () => {
  for (const s of ["bebeğim", "çocuğum", "oyuncağı", "bebekler"]) assert.deepEqual(tags(classify(s)), ["anne-çocuk"], s);
  const one = { "yemeği": "yemek", "cildiniz": "cilt bakımı", "kulaklığı": "teknoloji", "ahşabı": "kendin yap", "gözeneği": "cilt bakımı", "kombinlerimiz": "moda" };
  for (const [s, t] of Object.entries(one)) assert.deepEqual(tags(classify(s)), [t], s);
  // çok uzun ek kökü saymaz
  for (const s of ["makyajlarımızı", "otelcilik"]) assert.deepEqual(classify(s).niches, [], s);
});

test("classify: kısa terimler yalnızca bilinen eklerle", () => {
  for (const s of ["rujum", "ojeler", "saçlarım"]) assert.deepEqual(tags(classify(s)), ["güzellik"], s);
  assert.deepEqual(tags(classify("şefler")), ["yemek"]);
  assert.deepEqual(tags(classify("stilini")), ["moda"]);
  for (const s of ["sefer", "saçma", "still"]) assert.deepEqual(classify(s).niches, [], s);
});

test("classify: köke benzeyen sık kelimeler konu sayılmaz", () => {
  for (const s of ["takip", "takipçi", "takım", "kampanya", "#kampanya", "kampüs", "koşul", "koşulları", "yoğurt", "tarife", "kas", "brown"])
    assert.deepEqual(classify(s).niches, [], s);
  assert.deepEqual(classify("Yaz kampanyası koşulları: takip et, takipçi kazan #kampanya").niches, []);
  for (const s of ["çarşamba", "çarşı", "takıldık", "doğalgaz", "örgüt", "karbonhidrat", "araçlar", "krema", "rotasyon",
    "oyuncu", "salon", "logo", "gebermek", "constructor", "__proto__", "toString"])
    assert.deepEqual(classify(s).niches, [], s);
  // kökün kendisi hâlâ eşleşir
  assert.deepEqual(tags(classify("kamp takı yoga tarif")), ["moda", "seyahat", "yemek", "spor"]);
  assert.deepEqual(tags(classify("takılar")), ["moda"]);
});

test("classify: çok kelimeli terimler önce, kelimelerini tüketir", () => {
  const cases = {
    "elektrikli araçlar": "otomobil", "pro oyuncu": "oyun", "günlük vlog": "yaşam tarzı", "spor salonunda": "spor",
    "mutfak dolabı": "ev", "vegan kozmetik": "doğal ürünler", "%100 doğal": "doğal ürünler", "doğal ürünler": "doğal ürünler",
    "krem rengi elbise": "moda", "tatlı tarifi": "yemek", "ev yapımı tatlı": "yemek", "güneş kremini": "cilt bakımı",
  };
  for (const [s, t] of Object.entries(cases)) assert.deepEqual(tags(classify(s)), [t], s);
});

test("classify: genel sıfatlar yalnızca hashtag olarak sayılır", () => {
  for (const s of ["tatlım", "doğal olarak", "doğallı", "naturally", "günlük hayat"]) assert.deepEqual(classify(s).niches, [], s);
  assert.deepEqual(tags(classify("#tatlı")), ["yemek"]);
  assert.deepEqual(tags(classify("#doğal")), ["doğal ürünler"]);
  assert.deepEqual(tags(classify("#günlük")), ["yaşam tarzı"]);
});

test("classify: sözlükte eksik olan terimler", () => {
  const cases = {
    "krem": "cilt bakımı", "nemlendirdim": "cilt bakımı", "dermatoloji": "cilt bakımı", "şampuan": "güzellik",
    "hamileyim": "anne-çocuk", "gebelik": "anne-çocuk", "games": "oyun", "balayı": "seyahat", "honeymoon": "seyahat",
  };
  for (const [s, t] of Object.entries(cases)) assert.deepEqual(tags(classify(s)), [t], s);
});

test("classify: kısa terimler kelime içinde eşleşmez", () => {
  assert.deepEqual(classify("guide building suit quiet").niches, []);
  assert.deepEqual(tags(classify("ui ux")), ["tasarım"]);
});

test("classify: aynı kelime en çok 3 kez sayılır", () => {
  assert.deepEqual(classify("oyun oyun oyun oyun oyun oyun serum").niches, [{ tag: "oyun", score: 75 }, { tag: "cilt bakımı", score: 25 }]);
  assert.deepEqual(classify("#oyun ".repeat(12) + "serum").niches, [{ tag: "oyun", score: 86 }, { tag: "cilt bakımı", score: 14 }]);
  // farklı etiketler sınıra takılmaz
  assert.deepEqual(classify("#oyun #gaming #gamer #ps5 #xbox #valorant #steam #twitch serum").niches, [{ tag: "oyun", score: 94 }]);
});

test("classify: link ve @kullanıcı adı yok sayılır", () => {
  assert.deepEqual(classify("https://skincare.com/serum @skincare_tr").niches, []);
});

test("classify: en çok 5 konu, %8 altı elenir", () => {
  const r = classify("#oyun #moda #seyahat #yemek #spor #teknoloji #tasarım");
  assert.equal(r.niches.length, 5);
  assert.deepEqual(tags(classify("#oyun #gaming #gamer #ps5 #xbox #valorant #steam #twitch serum")), ["oyun"]);
});

test("classify: girdi 20000 karakterde kesilir", () => {
  assert.deepEqual(classify("a ".repeat(10000) + "#oyun"), { niches: [], matched: 0 });
  assert.deepEqual(classify("a ".repeat(9990) + "#oyun"), { niches: [{ tag: "oyun", score: 100 }], matched: 2 });
});

test("classify: en çok 200 hashtag ve 3000 kelime okunur", () => {
  assert.deepEqual(classify("#aa ".repeat(200) + "#oyun"), { niches: [], matched: 0 });
  assert.deepEqual(classify("#aa ".repeat(199) + "#oyun"), { niches: [{ tag: "oyun", score: 100 }], matched: 2 });
  assert.deepEqual(classify("aa ".repeat(3000) + "oyun"), { niches: [], matched: 0 });
  assert.deepEqual(classify("aa ".repeat(2999) + "oyun"), { niches: [{ tag: "oyun", score: 100 }], matched: 1 });
});

test("classify: birleşik hashtag içindeki ilgisiz kelime terim sayılmaz", () => {
  assert.deepEqual(classify("#plastiksizhayat"), { niches: [], matched: 0 }); // lastik değil
  assert.deepEqual(classify("#elastikbant"), { niches: [], matched: 0 });
  assert.deepEqual(classify("#filmmaker"), { niches: [], matched: 0 }); // maker değil
  assert.deepEqual(tags(classify("#coffeemaker")), ["yemek"]); // kahve yine eşleşir
  assert.deepEqual(tags(classify("#makeuplover")), ["güzellik"]);
});

test("classify: deyimler ve kitap cildi konu sayılmaz", () => {
  for (const t of ["art arda", "Art arda üç video", "bal gibi", "2. cilt", "3 ciltlik set", "1.cilt"]) assert.deepEqual(classify(t), { niches: [], matched: 0 }, t);
  assert.deepEqual(tags(classify("bal")), ["doğal ürünler"]);
  assert.deepEqual(tags(classify("cildim kuru")), ["cilt bakımı"]);
  for (const t of ["10 Cilt Bakımı Önerisi", "5 cilt bakımı hatası", "3 cilt tipi için öneriler", "30 Cilt Bakım Ürünü Denedim",
    "Rutinim:\n1. Cilt bakımı", "Bölüm 3\nCilt bakımı rutinim"]) assert.equal(tags(classify(t))[0], "cilt bakımı", t);
});

test("classify: çok uzun girdi hızlı biter", () => {
  const t0 = performance.now();
  for (let i = 0; i < 20; i++) classify("bugün yeni bir kombin denedim #ciltbakımrutini ".repeat(500) + i);
  assert.ok(performance.now() - t0 < 1000);
});

test("classify: rakamdan sonra uzun boşluk dizisi hızlı biter (deyim regex'i geri izlemez)", () => {
  const t0 = performance.now();
  for (const sp of [" ", "\n", "\t", ". "]) classify("1" + sp.repeat(Math.floor(19999 / sp.length)));
  classify("art" + " ".repeat(19997));
  assert.ok(performance.now() - t0 < 250);
});

test("classify: kısa terim stil çoğul ekiyle eşleşir, still eşleşmez", () => {
  assert.deepEqual(tags(classify("stiller")), ["moda"]);
  assert.deepEqual(classify("still"), { niches: [], matched: 0 });
});

test("classify: link içindeki # hashtag sayılmaz", () => {
  assert.deepEqual(classify("https://x.com/a#oyun"), { niches: [], matched: 0 });
  assert.deepEqual(classify("www.x.com/#oyun"), { niches: [], matched: 0 });
  assert.deepEqual(tags(classify("@kullanici #oyun")), ["oyun"]);
});

test("resolveNiche: TR, EN, hashtag ve serbest etiket", () => {
  const got = ["Skincare", "#güzellik", "cilt bakımı", "beauty", "tech", "Men's grooming", "Gaming", "seyahat", "skin care", "Anne & Çocuk", "xyzzy", "", null].map(resolveNiche);
  assert.deepEqual(got, ["cilt bakımı", "güzellik", "cilt bakımı", "güzellik", "teknoloji", "erkek bakımı", "oyun", "seyahat", "cilt bakımı", "anne-çocuk", null, null, null]);
  for (const n of NICHES) assert.equal(resolveNiche(n), n, n);
  for (const s of ["constructor", "__proto__", "toString"]) assert.equal(resolveNiche(s), null, s);
});

test("resolveNiches: birleşik etiketler bölünür", () => {
  assert.deepEqual(resolveNiches("Home & Living"), ["ev"]);
  assert.deepEqual(resolveNiches("Ev & Yaşam"), ["ev"]);
  assert.deepEqual(resolveNiches("Moda & Güzellik"), ["moda", "güzellik"]);
  assert.deepEqual(resolveNiches("Moda, güzellik ve seyahat"), ["moda", "güzellik", "seyahat"]);
  assert.equal(resolveNiche("Moda & Güzellik"), "moda");
  assert.deepEqual(resolveNiches("Moda-Güzellik"), ["moda", "güzellik"]);
  assert.deepEqual(resolveNiches("moda - güzellik"), ["moda", "güzellik"]);
  // Bitişik yazımı terim olan tireli etiket bölünmez
  assert.deepEqual(resolveNiches("self-care"), ["yaşam tarzı"]);
  assert.deepEqual(resolveNiches("e-spor"), ["oyun"]);
  assert.deepEqual(resolveNiches("cilt-bakımı"), ["cilt bakımı"]);
  assert.deepEqual(resolveNiches("xyzzy"), []);
});

test("campaignNiches: etiket tam, başlık/brief yarım ağırlık", () => {
  assert.deepEqual(campaignNiches({ niches: ["skincare"], title: "Yeni serum lansmanı", brief: "Nemlendirici ve güneş kremi" }), { "cilt bakımı": 1 });
  assert.deepEqual(campaignNiches({ niches: ["oyun"], title: "Serum" }), { oyun: 1, "cilt bakımı": 0.5 });
  assert.deepEqual(campaignNiches({ title: "Serum ve oyun", brief: "cilt serum nemlendirici oyun valorant ps5" }), { "cilt bakımı": 0.5, oyun: 0.5 });
  assert.deepEqual(campaignNiches({ niches: "Moda & Güzellik" }), { moda: 1, "güzellik": 1 });
  assert.deepEqual(campaignNiches({ niches: ["Moda, güzellik ve seyahat"] }), { moda: 1, "güzellik": 1, seyahat: 1 });
  for (const s of ["constructor", "__proto__", "toString"]) assert.deepEqual(campaignNiches({ niches: [s] }), {}, s);
  assert.deepEqual(campaignNiches({}), {});
  assert.deepEqual(campaignNiches(null), {});
});

test("fit: aynı konu 100, yakın konu kısmi, ilgisiz 0", () => {
  const skin = classify("#skincare serum").niches;
  assert.deepEqual(fit(skin, { niches: ["cilt bakımı"] }), { fit: 100, label: "%100 uyum", label_code: "fit" });
  assert.deepEqual(fit(classify("cilt bakımı serum nemlendirici #skincare #makyaj").niches, { niches: ["güzellik"] }), { fit: 80, label: "%80 uyum", label_code: "fit" });
  assert.deepEqual(fit(classify("#oyun valorant").niches, { niches: ["cilt bakımı"] }), { fit: 0, label: "%0 uyum", label_code: "fit" });
  const r = fit(skin, { niches: ["güzellik"] }).fit;
  assert.ok(r > 0 && r < 100);
});

test("fit: kampanyanın ana konusu yan konudan ağır basar", () => {
  const camp = { niches: ["oyun"], title: "Serum" }; // oyun 1, cilt bakımı 0.5
  assert.deepEqual(fit(classify("#skincare serum").niches, camp), { fit: 45, label: "%45 uyum", label_code: "fit" });
  assert.equal(fit(classify("#oyun valorant").niches, camp).fit, 90);
});

test("fit: veri yoksa skor yok", () => {
  const none = { fit: null, label: "veri yok", label_code: "no_data" };
  assert.deepEqual(fit([], { niches: ["oyun"] }), none);
  assert.deepEqual(fit(null, { niches: ["oyun"] }), none);
  assert.deepEqual(fit(classify("#oyun").niches, {}), none);
  assert.deepEqual(fit(classify("#oyun").niches, { niches: ["xyzzy"] }), none);
});

test("fit: geçersiz konu öğeleri yok sayılır", () => {
  const none = { fit: null, label: "veri yok", label_code: "no_data" }, camp = { niches: ["oyun"] };
  for (const n of [[{ tag: "oyun", score: "100" }], [null, 5, { tag: 3, score: 50 }], [{ tag: "oyun", score: NaN }],
    [{ tag: "oyun", score: Infinity }], "oyun", { tag: "oyun", score: 1 }]) assert.deepEqual(fit(n, camp), none);
  assert.deepEqual(fit([{ tag: "oyun", score: 40 }, { score: 60 }], camp), { fit: 100, label: "%100 uyum", label_code: "fit" });
});

test("analyze: metin + kampanya tek çağrı", () => {
  assert.deepEqual(analyze("#travel otel plaj", { niches: ["seyahat"] }), { niches: [{ tag: "seyahat", score: 100 }], fit: 100, label: "%100 uyum", label_code: "fit" });
  assert.deepEqual(analyze("#travel otel plaj"), { niches: [{ tag: "seyahat", score: 100 }], fit: null, label: "veri yok", label_code: "no_data" });
  assert.deepEqual(analyze("", { niches: ["seyahat"] }), { niches: [], fit: null, label: "veri yok", label_code: "no_data" });
});
