// WishCEO tanıtım sayfası: 3 dosyalık oyun, CEO karnesi, paylaşım ve bekleme listesi.
// Vakalar kamuya açık kaynaklarda belgelenmiş gerçek olaylardan uyarlanmıştır; şirket, ürün ve kişi adları kurgusaldır, rakamlar yuvarlanmıştır. Kaynaklar her vakanın `sources` alanında.
(function () {
  "use strict";

  var ISSUE = "001";
  var FORM_END = "https://corner-forms.berkay-999.workers.dev/submit";
  var KEY = "wishceo.s" + ISSUE;

  // tag: karnede CEO tipini belirler (cerrah, kalkan, kumar, kasa)
  // sources: oyuncuya gösterilen kaynaklar; t ve pub Türkçe özet, lang bağlantının dili
  var CASES = [
    {
      area: "Kriz yönetimi",
      place: ["ABD", " · Ekim 1982"],
      company: "Hartwell & Hartwell · Soranol",
      title: "Rafta zehir var",
      body: [
        "Soranol, Amerika’nın en çok satan ağrı kesicisi. Pazarın yaklaşık üçte biri sende ve ürün şirketin en kârlı kalemlerinden biri.",
        "Birkaç gün içinde Chicago bölgesinde yedi kişi ölüyor. Hepsi güçlü formül Soranol kapsülü almış. Biri kapsüllerin içine siyanür koymuş, şişeleri market raflarına geri bırakmış.",
        "Fabrikada sorun yok; zehirli şişeler yalnızca Chicago bölgesinde. Ama haberler her saat ürünün adını veriyor ve ülke panikte."
      ],
      stats: [["Pazar payı", "~%35"], ["Ölü", "7"], ["Zehirli şişeler", "Chicago"]],
      ask: "Hartwell & Hartwell’in başındasın. İlk hamlen ne?",
      opts: [
        { k: "A", t: "Yalnızca Chicago’daki şişeleri toplat. Sorun yerel, fabrikada hata yok.", s: 35, tag: "kasa",
          r: "Mantıklı görünüyor ama “ya başka şehirde de varsa?” sorusuna cevabın yok. Bir vaka daha çıkarsa marka biter." },
        { k: "B", t: "Ülkedeki bütün Soranol kapsüllerini raflardan çek, halka “kullanmayın” de.", s: 95, tag: "kalkan",
          r: "Pahalı, belki yüz milyon dolar. Ama mesaj net: önce insanların güvenliği, sonra satışlar." },
        { k: "C", t: "Hiçbir şey toplatma. “Ürünümüz güvenli, sabotajın sorumlusu biz değiliz” açıklaması yap.", s: 10, tag: "kasa",
          r: "Teknik olarak haklısın. Ama insanlar ölürken “suç bizde değil” diyen bir marka o rafa bir daha çıkamaz." },
        { k: "D", t: "Soranol adını göm, aynı ilacı yeni bir isimle piyasaya sür.", s: 30, tag: "kumar",
          r: "Yıllar içinde kurulmuş güveni kendi elinle siliyorsun. Üstelik insanlar aynı ilacın kılık değiştirdiğini fark eder." }
      ],
      real: {
        who: "Edward Hallam",
        role: "Hartwell & Hartwell CEO’su",
        k: "B",
        text: [
          "Hallam ülke çapındaki bütün Soranol kapsüllerini geri çağırdı: yaklaşık 31 milyon şişe, yaklaşık 100 milyon dolar. O sırada FBI ve FDA bunu gerekli görmüyordu. Halka kapsülleri kullanmamasını, ellerindekini tabletle değiştirmesini söyledi; basına kapıyı kapatmadı.",
          "İki ay içinde Soranol üç katmanlı mühürlü yeni ambalajla rafa döndü. Pazar payı önce %7 civarına düştü, bir yıl içinde büyük ölçüde geri geldi.",
          "Zehirleyen kişi bugüne kadar bulunamadı; cinayetlerden kimse yargılanmadı, dosya hâlâ açık. Bu karar kriz yönetimi derslerinde en çok anlatılan örneklerden biri."
        ]
      },
      sources: [
        { t: "Krizi yöneten CEO’nun kararları ve mirası", pub: "Knowledge at Wharton", year: "2012", lang: "en",
          url: "https://knowledge.wharton.upenn.edu/article/tylenol-and-the-legacy-of-jjs-james-burke/" },
        { t: "Markayı kurtarma mücadelesi, olayların sıcağında", pub: "Fortune", year: "1982", lang: "en",
          url: "https://fortune.com/article/the-fight-to-save-tylenol-fortune-1982/" },
        { t: "Mühürlü ambalaj kuralı: ilaç mevzuatında dönüm noktaları", pub: "ABD FDA", year: "", lang: "en",
          url: "https://www.fda.gov/about-fda/fda-history/milestones-us-food-and-drug-law" },
        { t: "1982 zehirlenmelerinin kronolojisi", pub: "History.com", year: "", lang: "en",
          url: "https://www.history.com/articles/extra-strength-tylenol-poisonings-1982" },
        { t: "Baş şüphelinin ölümü; dosya hâlâ açık", pub: "PBS NewsHour / AP", year: "2023", lang: "en",
          url: "https://www.pbs.org/newshour/nation/james-lewis-suspect-in-the-1982-tylenol-murders-dies-at-76" }
      ]
    },
    {
      area: "Dönüşüm",
      place: ["Danimarka", " · 2004"],
      company: "Tumla Group",
      title: "Her şeye giren oyuncakçı",
      body: [
        "Tumla yetmiş yılı aşkın bir aile şirketi. Son on yılda markasını her yere taşıdı: tema parkları, giyim, takı, video oyunları, bir televizyon dizisi.",
        "Ürün yelpazesi şişti. Yeni setler yalnızca bir kez kullanılan özel parçalarla dolu; kalıplar, depolar, maliyetler patladı. Satışlar düşüyor, şirket zarar ediyor, kasadaki para hızla eriyor.",
        "Aile, otuzlu yaşlarındaki eski bir danışmanı CEO yaptı. O kişi sensin."
      ],
      stats: [["Kuruluş", "1932"], ["Tema parkı", "4"], ["Son bilanço", "Zarar"]],
      ask: "Neyi değiştirirsin?",
      opts: [
        { k: "A", t: "Daha çok yenilik: yeni dijital ürünler, yeni filmler, yeni parklar. Büyüyerek çıkarız.", s: 15, tag: "kumar",
          r: "Şirketi bu hâle getiren tam da buydu. Kasa boşalırken yeni cephe açmak batışı hızlandırır." },
        { k: "B", t: "Küçül ve odaklan: parça çeşidini azalt, parkları sat, ana ürüne, tuğlaya dön.", s: 95, tag: "cerrah",
          r: "Acı bir liste: projeler kapanır, bazı ekipler gider. Ama ilk kez herkes şirketi neyin ayakta tuttuğunu biliyor." },
        { k: "C", t: "Üretimi ucuz bir ülkeye taşı, maliyeti kes. Kalite biraz düşse de idare eder.", s: 40, tag: "kasa",
          r: "Maliyet düşer ama Tumla’yı Tumla yapan şey parçaların milimetrik oturması; kaliteden kısarsan elinde sıradan bir oyuncak kalır. Üretimin bir kısmı gerçekten Macaristan, Çek Cumhuriyeti ve Meksika’ya taşındı, ama şirketi kurtaran bu olmadı." },
        { k: "D", t: "Şirketi büyük bir rakibe sat. Aile hiç değilse parasını alsın.", s: 25, tag: "kasa",
          r: "Belki aile kurtulur ama marka bir rakibin portföyünde sessizce kaybolur. Masadan kalkmak da bir karar, ama CEO’luk değil." }
      ],
      real: {
        who: "Rasmus Lindvang",
        role: "Tumla CEO’su",
        k: "B",
        text: [
          "Lindvang ilk kuralı koydu: önce hayatta kal, sonra büyü. Parça çeşidini ciddi biçimde azalttı, kârsız işleri kapattı ya da sattı; 2005’te tema parklarının çoğunluk hissesini sattı.",
          "Odağı tuğlaya ve sevilen temalara geri çekti, hayran topluluğunu dinlemeye başladı.",
          "On yıl sonra Tumla dünyanın en büyük ve en kârlı oyuncak şirketleri arasındaydı."
        ]
      },
      sources: [
        { t: "Zarardan kâra dönüş", pub: "NBC News / AP", year: "2006", lang: "en",
          url: "https://www.nbcnews.com/id/wbna11367083" },
        { t: "Harvard vaka çalışması: dönüşümün dersleri", pub: "Harvard Business School", year: "2013", lang: "en",
          url: "https://www.library.hbs.edu/working-knowledge/hbs-cases-lego" },
        { t: "Kendini yeniden icat eden marka", pub: "The Guardian", year: "2017", lang: "en",
          url: "https://www.theguardian.com/lifeandstyle/2017/jun/04/how-lego-clicked-the-super-brand-that-reinvented-itself" },
        { t: "Fazla yenilik şirketi nasıl batmanın eşiğine getirdi", pub: "Knowledge at Wharton", year: "2012", lang: "en",
          url: "https://knowledge.wharton.upenn.edu/article/innovation-almost-bankrupted-lego-until-it-rebuilt-with-a-better-blueprint/" }
      ]
    },
    {
      area: "Strateji",
      place: ["Finlandiya", " · Şubat 2011"],
      company: "Korvala",
      title: "Tahttaki telefoncu",
      body: [
        "Korvala dünyada en çok telefon satan şirket. Neredeyse herkesin cebinde bir Korvala var ya da yakın zamana kadar vardı.",
        "Ama 2007’de Amerikalı bir bilgisayar şirketi dokunmatik telefonunu çıkardı, arama motoru devinin ücretsiz sistemi de hızla yayılıyor. Şirketin kendi akıllı telefon sistemi eskidi, uygulama geliştiriciler ilgisini kaybetti. Ortaklıkla geliştirilen yeni sistem ise henüz hazır değil.",
        "Akıllı telefonda pazar payı eriyor, hisse düşüyor. Yeni CEO sensin ve bir platform seçmek zorundasın."
      ],
      stats: [["Telefon satışında", "Dünya 1.si"], ["İşletim sistemi", "Kendi, eski"], ["Rakipler", "ABD’li iki dev"]],
      ask: "Hangi yola girersin?",
      opts: [
        { k: "A", t: "Arama motoru devinin ücretsiz sistemine geç. Herkesin kullandığı yere katıl, farkı donanım ve tasarımla yarat.", s: 75, tag: "cerrah",
          r: "Asyalı dev üreticilerle aynı sistemde yarışmak zor ama uygulamalar ve kullanıcılar hazır. Sonradan bazı yorumcular Korvala’nın bu yolu seçmesi gerektiğini savundu." },
        { k: "B", t: "Yazılım devi Tallbridge’le ortaklık kur, akıllı telefonlarında ana sistem olarak onun telefon sistemini seç.", s: 35, tag: "kumar",
          r: "Tallbridge para ve destek veriyor, sen de en büyük ortağı oluyorsun. Ama şirketin geleceğini pazarın henüz yalnızca %2 kadarını tutan bir sisteme bağlıyorsun." },
        { k: "C", t: "Geliştirmekte olduğumuz yeni sistemi bitir, yolumuza bağımsız devam edelim.", s: 45, tag: "kumar",
          r: "Bağımsız kalırsın ama yarışa yıllar geç girersin. Geliştiriciler üçüncü bir sistemi bekleyecek mi?" },
        { k: "D", t: "Akıllı telefonu bırak; ucuz ve sağlam telefonlarda dünya lideri olarak kal.", s: 25, tag: "kasa",
          r: "Bugünü kurtarır, yarını kaybettirir. Ucuz telefon pazarı da birkaç yıl içinde akıllı telefona dönecek." }
      ],
      real: {
        who: "Gordon Stoddard",
        role: "Korvala CEO’su",
        k: "B",
        text: [
          "Stoddard Şubat 2011’de çalışanlara meşhur “yanan platform” notunu yazdı ve Korvala’yı Tallbridge’in telefon sistemine bağladı. Eski sistem rafa kalkmaya başladı.",
          "Tallbridge’in sistemi beklenen ivmeyi yakalayamadı. Eylül 2013’te Korvala telefon işini Tallbridge’e satmak için anlaştı: patent lisansı dahil yaklaşık 5,4 milyar avro. Satış Nisan 2014’te tamamlandı.",
          "Korvala bugün telekom altyapısı üreten bir şirket olarak yoluna devam ediyor."
        ]
      },
      sources: [
        { t: "Çalışanlara yazılan “yanan platform” notu", pub: "Engadget", year: "2011", lang: "en",
          url: "https://www.engadget.com/2011-02-08-nokia-ceo-stephen-elop-rallies-troops-in-brutally-honest-burnin.html" },
        { t: "Ortaklık duyurusu ve pazar payı rakamları", pub: "Mail & Guardian / Reuters", year: "2011", lang: "en",
          url: "https://mg.co.za/business/2011-02-11-nokia-microsoft-join-forces-in-smartphone-war/" },
        { t: "Telefon işinin satışında 5 detay", pub: "Webrazzi", year: "2013", lang: "tr",
          url: "https://webrazzi.com/2013/09/04/microsoft-nokia-satin-almasinda-5-detay/" },
        { t: "Satışın tamamlandığını bildiren resmî bildirim", pub: "ABD SEC (6-K)", year: "2014", lang: "en",
          url: "https://www.sec.gov/Archives/edgar/data/924613/000110465914030586/a14-11232_16k.htm" }
      ]
    }
  ];

  var TYPES = {
    cerrah: { name: "Cerrah", desc: "Neyin kesileceğini bilirsin. Duygusal bağlara değil, şirketi neyin yaşattığına bakarsın ve zor kararı erken alırsın." },
    kalkan: { name: "Kalkan", desc: "Önce insanlar, sonra rakamlar. Güven bir kez giderse hiçbir bütçenin onu geri getiremeyeceğini bilirsin." },
    kumar: { name: "Kumarbaz", desc: "Masaya bütün fişleri sürersin. Tutarsa kitaplara geçersin. Tutmazsa da geçersin, ama başka bir bölüme." },
    kasa: { name: "Kasa Bekçisi", desc: "Bu çeyreği kurtarırsın, tablolar temiz görünür. Sorun şu: şirketler çeyrek değil, on yıl yaşar." }
  };
  var TAG_ORDER = ["cerrah", "kalkan", "kumar", "kasa"];

  // ---------- durum ----------
  var state = { answers: [null, null, null], cur: 0, joined: false, consent: "" };
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && Array.isArray(s.answers) && s.answers.length === CASES.length) {
        state.answers = s.answers.map(function (a, i) { return opt(i, a) ? a : null; });
        state.joined = !!s.joined;
        state.consent = typeof s.consent === "string" ? s.consent : "";
      }
    } catch (e) { /* gizli sekme vb. */ }
    state.cur = firstOpen();
    if (state.cur === -1) state.cur = CASES.length - 1;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ answers: state.answers, joined: state.joined, consent: state.consent })); } catch (e) { /* yok say */ }
  }
  function opt(i, k) { return CASES[i].opts.filter(function (o) { return o.k === k; })[0] || null; }
  function firstOpen() { for (var i = 0; i < CASES.length; i++) if (!state.answers[i]) return i; return -1; }
  function done() { return firstOpen() === -1; }

  // ---------- yardımcılar ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tier(s) { return s >= 80 ? "hi" : s >= 50 ? "mid" : "lo"; }
  function reduced() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function site() { return /(^|\.)wishceo\.com$/.test(location.hostname) ? "https://wishceo.com" : location.origin; }

  // ---------- oyun ----------
  var elSteps, elCase, elReport;

  function renderSteps() {
    var open = firstOpen();
    elSteps.innerHTML = CASES.map(function (c, i) {
      var a = state.answers[i], o = a && opt(i, a);
      var cls = "step" + (i === state.cur ? " is-cur" : "") + (o ? " is-done t-" + tier(o.s) : "");
      var can = o || i === open;
      return '<li><button type="button" class="' + cls + '" data-i="' + i + '"' + (can ? "" : " disabled") +
        (i === state.cur ? ' aria-current="step"' : "") + '>' +
        '<span class="step-n">' + pad(i + 1) + '</span><span class="step-t">' + esc(c.title) + '</span>' +
        '<span class="step-s">' + (o ? o.s : "—") + '</span></button></li>';
    }).join("");
  }

  function renderCase(focus) {
    var i = state.cur, c = CASES[i], a = state.answers[i];
    var html =
      '<header class="case-head"><span>Dosya ' + pad(i + 1) + " / " + pad(CASES.length) + "</span><span>" + esc(c.area) + "</span></header>" +
      '<div class="case-main">' +
      '<p class="case-meta">' + esc(c.place[0] + c.place[1]) + "</p>" +
      '<h3 class="case-title" tabindex="-1">' + esc(c.title) + "</h3>" +
      '<p class="case-co">' + esc(c.company) + "</p>" +
      '<div class="case-body">' + c.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
      '<dl class="stats">' + c.stats.map(function (s) { return "<div><dt>" + esc(s[0]) + "</dt><dd>" + esc(s[1]) + "</dd></div>"; }).join("") + "</dl>" +
      '<p class="ask">' + esc(c.ask) + "</p>" +
      '<div class="opts" role="group" aria-label="Seçenekler">' +
      c.opts.map(function (o) {
        var cls = "opt" + (a ? (o.k === a ? " is-picked" : " is-dim") : "") + (a && o.k === c.real.k ? " is-real" : "");
        return '<button type="button" class="' + cls + '" data-k="' + o.k + '"' + (a ? ' aria-disabled="true"' : "") + ">" +
          '<span class="opt-k">' + o.k + '</span><span class="opt-t">' + esc(o.t) + "</span>" +
          (a && o.k === c.real.k ? '<span class="opt-real">Gerçek CEO</span>' : "") + "</button>";
      }).join("") +
      "</div></div>";
    if (a) html += afterHtml(i);
    elCase.innerHTML = html;
    renderSteps();
    if (focus) {
      var t = $(".case-title", elCase);
      t.focus({ preventScroll: true });
      var top = elSteps.getBoundingClientRect().top + scrollY - 12;
      if (Math.abs(scrollY - top) > 40) scrollTo({ top: top, behavior: reduced() ? "auto" : "smooth" });
    }
  }

  function srcHtml(c) {
    return '<div class="src"><p class="lbl">Kaynaklar</p><ol role="list">' +
      c.sources.map(function (s) {
        return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer" hreflang="' + s.lang + '">' +
          esc(s.t) + '<span class="ext" aria-hidden="true">↗</span><span class="sr"> (yeni sekmede açılır)</span></a>' +
          "<span>" + esc(s.pub + (s.year ? " · " + s.year : "") + (s.lang === "en" ? " · İngilizce" : "")) + "</span></li>";
      }).join("") +
      '</ol><p class="src-note">Bu dosya gerçek bir olaya dayanıyor; şirket, ürün ve kişi adları değiştirildi.</p></div>';
  }

  function afterHtml(i) {
    var c = CASES[i], o = opt(i, state.answers[i]), ro = opt(i, c.real.k), diff = o.s - ro.s, last = i === CASES.length - 1;
    var cmp = o.k === c.real.k ? "Gerçek CEO ile aynı kararı verdin."
      : diff > 0 ? "Gerçek CEO’dan " + diff + " puan iyi. Yönetim kurulu not aldı."
      : "Gerçek CEO’nun kararı " + (-diff) + " puan daha iyiydi.";
    return '<div class="after">' +
      '<div class="verdict t-' + tier(o.s) + '" tabindex="-1">' +
      '<div class="stamp' + (reduced() ? "" : " anim") + '" aria-hidden="true"><b>' + o.s + "</b><span>puan</span></div>" +
      '<p class="lbl">Senin kararın · ' + o.k + "</p>" +
      '<p class="verdict-r">' + esc(o.r) + "</p>" +
      '<p class="sr">Puanın: ' + o.s + " / 100</p>" +
      "</div>" +
      '<div class="truth">' +
      '<p class="lbl">Gerçekte ne oldu</p>' +
      '<p class="truth-who">' + esc(c.real.who) + " <span>" + esc(c.real.role) + " · seçimi " + c.real.k + "</span></p>" +
      c.real.text.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      '<p class="truth-cmp">' + esc(cmp) + "</p>" +
      srcHtml(c) +
      "</div>" +
      '<div class="after-nav"><button type="button" class="btn btn-ink" data-act="' + (last || done() ? "report" : "next") + '">' +
      (done() ? "CEO karnemi göster" : "Sonraki dosya") + ' <span aria-hidden="true">→</span></button></div>' +
      "</div>";
  }

  function pick(k) {
    var i = state.cur;
    if (state.answers[i] || !opt(i, k)) return;
    state.answers[i] = k;
    save();
    renderCase(false);
    var v = $(".after", elCase);
    if (v) {
      var vd = $(".verdict", v);
      if (vd) vd.focus({ preventScroll: true });
      var r = v.getBoundingClientRect();
      if (r.top > innerHeight * 0.6) scrollTo({ top: scrollY + r.top - innerHeight * 0.25, behavior: reduced() ? "auto" : "smooth" });
    }
    if (done()) renderReport();
  }

  // ---------- karne ----------
  function result() {
    var count = {}, sum = {}, total = 0;
    state.answers.forEach(function (k, i) {
      var o = opt(i, k);
      count[o.tag] = (count[o.tag] || 0) + 1;
      sum[o.tag] = (sum[o.tag] || 0) + o.s;
      total += o.s;
    });
    var type = TAG_ORDER.slice().sort(function (x, y) {
      return (count[y] || 0) - (count[x] || 0) || (sum[y] || 0) - (sum[x] || 0) || TAG_ORDER.indexOf(x) - TAG_ORDER.indexOf(y);
    })[0];
    var score = Math.round(total / CASES.length);
    var board = score >= 80 ? "Yönetim kurulu seni sevdi." : score >= 60 ? "Yönetim kurulu seni izliyor."
      : score >= 40 ? "Yönetim kurulu acil toplantı istedi." : "Yönetim kurulu yeni CEO arıyor.";
    var real = Math.round(CASES.reduce(function (t, c, i) { return t + opt(i, c.real.k).s; }, 0) / CASES.length);
    return { type: type, score: score, board: board, real: real };
  }

  function squares() {
    return state.answers.map(function (k, i) { var t = tier(opt(i, k).s); return t === "hi" ? "🟩" : t === "mid" ? "🟨" : "🟥"; }).join("");
  }
  function shareText() {
    var r = result();
    return "WishCEO · Sayı " + ISSUE + "\n" + squares() + " " + r.score + "/100\nCEO tipim: " + TYPES[r.type].name + "\nSen olsan ne yapardın?";
  }

  function renderReport() {
    if (!done()) { elReport.hidden = true; return; }
    var r = result(), t = TYPES[r.type];
    elReport.innerHTML =
      '<div class="report-card">' +
      '<header class="case-head"><span>CEO karnesi</span><span>Sayı ' + ISSUE + "</span></header>" +
      '<div class="report-grid">' +
      '<div class="report-type">' +
      '<p class="lbl">CEO tipin</p>' +
      '<h3 tabindex="-1">' + esc(t.name) + "</h3>" +
      '<p class="report-desc">' + esc(t.desc) + "</p>" +
      "</div>" +
      '<div class="report-score">' +
      '<p class="lbl">Ortalama puan</p>' +
      '<p class="big"><b>' + r.score + "</b><span>/100</span></p>" +
      '<p class="board">' + esc(r.board) + "</p>" +
      '<p class="vs">Gerçek CEO’ların ortalaması: ' + r.real + "</p>" +
      "</div></div>" +
      '<table class="rows"><caption class="sr">Dosya dosya kararların</caption>' +
      "<thead><tr><th scope=\"col\">Dosya</th><th scope=\"col\">Sen</th><th scope=\"col\">Gerçek</th><th scope=\"col\">Puan</th></tr></thead><tbody>" +
      CASES.map(function (c, i) {
        var o = opt(i, state.answers[i]);
        return '<tr><th scope="row"><span class="n">' + pad(i + 1) + "</span> " + esc(c.title) + "</th><td>" + o.k + "</td><td>" + c.real.k +
          '</td><td><span class="pill t-' + tier(o.s) + '">' + o.s + "</span></td></tr>";
      }).join("") +
      "</tbody></table>" +
      '<div class="share">' +
      '<button type="button" class="btn btn-ink" data-act="share">Sonucumu paylaş</button>' +
      '<a class="btn btn-line" data-net="wa" target="_blank" rel="noopener">WhatsApp</a>' +
      '<a class="btn btn-line" data-net="x" target="_blank" rel="noopener">X</a>' +
      '<a class="btn btn-line" data-net="li" target="_blank" rel="noopener">LinkedIn</a>' +
      '<button type="button" class="btn btn-ghost" data-act="reset">Baştan oyna</button>' +
      "</div>" +
      '<p class="share-msg" role="status" aria-live="polite"></p>' +
      '<a class="report-cta" href="#liste">Yarın yeni dosya gelsin mi? <b>Bekleme listesine yazıl</b> <span aria-hidden="true">↓</span></a>' +
      "</div>";
    var url = site() + "/", text = shareText();
    $('[data-net="wa"]', elReport).href = "https://wa.me/?text=" + encodeURIComponent(text + "\n" + url);
    $('[data-net="x"]', elReport).href = "https://x.com/intent/post?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url);
    $('[data-net="li"]', elReport).href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
    elReport.hidden = false;
  }

  function showReport() {
    renderReport();
    var top = elReport.getBoundingClientRect().top + scrollY - 16;
    scrollTo({ top: top, behavior: reduced() ? "auto" : "smooth" });
    var h = $("h3", elReport);
    if (h) h.focus({ preventScroll: true });
  }

  function share() {
    var text = shareText(), url = site() + "/", msg = $(".share-msg", elReport);
    if (navigator.share) {
      navigator.share({ text: text, url: url }).catch(function (e) { if (e && e.name !== "AbortError") copy(text + "\n" + url, msg); });
      return;
    }
    copy(text + "\n" + url, msg);
  }
  function copy(s, msg) {
    var ok = function () { msg.textContent = "Sonucun panoya kopyalandı. İstediğin yere yapıştır."; };
    var fail = function () { msg.textContent = "Kopyalanamadı. Metni elle seç: " + s.replace(/\n/g, " · "); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, fail);
    else fail();
  }

  function reset() {
    state.answers = [null, null, null];
    state.cur = 0;
    save();
    elReport.hidden = true;
    elReport.innerHTML = "";
    renderCase(true);
  }

  // ---------- bekleme listesi ----------
  function initWaitlist() {
    var f = $("#wl"), input = $("#wl-email"), ok = $("#wl-ok"), btn = $("button", f), msg = $(".wl-status", f), busy = false;
    var label = btn.textContent;
    function say(s, kind) { msg.textContent = s; msg.className = "wl-status" + (kind ? " is-" + kind : ""); }
    function joined() {
      f.classList.add("is-done");
      input.disabled = true;
      btn.disabled = true;
      btn.textContent = "Listedesin";
      // Onay kutusu gelmeden önce yazılanların onay kaydı yok: kutuyu işaretli göstermeyelim
      ok.checked = !!state.consent;
      ok.disabled = true;
      ok.closest(".wl-check").hidden = !state.consent;
      say("Listedesin. WishCEO açıldığında ilk haberi sen alacaksın.", "ok");
    }
    if (state.joined) joined();
    ok.addEventListener("change", function () { if (ok.checked) ok.removeAttribute("aria-invalid"); });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy || state.joined) return;
      var email = input.value.trim();
      if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email)) {
        input.setAttribute("aria-invalid", "true");
        say("Geçerli bir e-posta adresi yaz.", "err");
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      if (!ok.checked) {
        ok.setAttribute("aria-invalid", "true");
        say("Listeye yazılmak için e-posta onayı kutusunu işaretle.", "err");
        ok.focus();
        return;
      }
      ok.removeAttribute("aria-invalid");
      var at = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
      var fields = [["E-posta", email], ["Onay", "evet · tanıtım e-postası (6563 md. 6) · " + at],
        ["Liste", "WishCEO bekleme listesi · Sayı " + ISSUE]];
      if (done()) {
        var r = result();
        fields.push(["CEO tipi", TYPES[r.type].name], ["Puan", r.score + "/100"],
          ["Kararlar", state.answers.map(function (k, i) { return pad(i + 1) + ":" + k; }).join(" ")]);
      } else {
        fields.push(["Oyun", "Bitirmedi (" + state.answers.filter(Boolean).length + "/" + CASES.length + ")"]);
      }
      busy = true;
      btn.disabled = true;
      btn.textContent = "Kaydediliyor…";
      say("", "");
      fetch(FORM_END, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ page: location.pathname || "/", fields: fields, hp: $(".hp", f).value })
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (j) {
            if (res.status === 429) throw new Error("rate");
            if (!res.ok || !j.ok) throw new Error("fail");
          });
        })
        .then(function () { state.joined = true; state.consent = at; save(); joined(); })
        .catch(function (err) {
          btn.disabled = false;
          btn.textContent = label;
          say(err && err.message === "rate" ? "Çok fazla deneme oldu. Birkaç dakika sonra tekrar dene."
            : "Kaydedemedik. Bağlantını kontrol edip tekrar dene.", "err");
        })
        .then(function () { busy = false; });
    });
  }

  // ---------- başlat ----------
  function init() {
    elSteps = $("#steps");
    elCase = $("#case");
    elReport = $("#report");
    var d = $("#today");
    if (d) try { d.textContent = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { /* sabit tarih kalsın */ }
    load();
    renderCase(false);
    renderReport();

    elCase.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.k) return pick(b.dataset.k);
      if (b.dataset.act === "next") { state.cur = firstOpen(); renderCase(true); }
      if (b.dataset.act === "report") showReport();
    });
    elSteps.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      state.cur = +b.dataset.i;
      renderCase(true);
    });
    elReport.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.act === "share") share();
      if (b.dataset.act === "reset") reset();
    });
    initWaitlist();
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
