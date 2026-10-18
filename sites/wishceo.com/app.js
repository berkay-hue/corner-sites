// WishCEO: sayı sayı CEO oyunu, arşiv, CEO karnesi, paylaşım ve yeni sayı bildirimi.
// Vakalar gerçek şirket krizlerinden uyarlanmıştır; şirket, ürün ve kişi adları kurgusaldır, rakamlar yuvarlanmıştır. Dosyalarda dış bağlantı yoktur.
// Sponsorlu vaka: vaka nesnesine isteğe bağlı sponsor: "Ad" ekle; başlığın altında tek sade satır çıkar (logo, görsel, bağlantı yok; şimdilik canlı vakada kullanılmıyor). Önizleme: ?ornek-sponsor
(function () {
  "use strict";

  var FORM_END = "https://corner-forms.berkay-999.workers.dev/submit";
  var LIST_KEY = "wishceo.liste";

  // tag: karnede CEO tipini belirler (cerrah, kalkan, kumar, kasa)
  // ---------- sayılar ----------
  // date: sayının açıldığı gün (Türkiye saati); ileri tarihli sayılar o gün kendiliğinden açılır
  var ISSUES = [
    { no: "001", date: "2026-10-15" },
    { no: "002", date: "2026-10-16" },
    { no: "003", date: "2026-10-19" },
    { no: "004", date: "2026-10-26" },
    { no: "005", date: "2026-11-02" },
    { no: "006", date: "2026-11-09" },
    { no: "007", date: "2026-11-16" },
    { no: "008", date: "2026-11-23" },
    { no: "009", date: "2026-11-30" },
    { no: "010", date: "2026-12-07" },
    { no: "011", date: "2026-12-14" },
    { no: "012", date: "2026-12-21" },
    { no: "013", date: "2026-12-28" },
    { no: "014", date: "2027-01-04" },
    { no: "015", date: "2027-01-11" },
    { no: "016", date: "2027-01-18" }
  ];
  function todayTR() {
    try {
      var p = {};
      new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      if (p.year && p.month && p.day) return p.year + "-" + p.month + "-" + p.day;
    } catch (e) { /* eski tarayıcı */ }
    return new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10);
  }
  var TODAY = todayTR();
  var RELEASED = ISSUES.filter(function (x) { return x.date <= TODAY; });
  if (!RELEASED.length) RELEASED = [ISSUES[0]];
  var CUR = RELEASED[RELEASED.length - 1], LATEST = CUR.no;
  var qs = /[?&]s=(\d{3})\b/.exec(location.search);
  if (qs) RELEASED.forEach(function (x) { if (x.no === qs[1]) CUR = x; });
  // içeriği yayından sonra değişen sayının cevap anahtarı yenilenir; eski cevaplar yeni dosyalara karışmaz.
  // 001: birinci dosya iki kez değişti (v2, sonra v3: Lavenhurst). Bildirim onayı ayrı tutulur, eski "wishceo.s001" kaydından okunmaya devam eder (loadList).
  // Puan ve seçenek metni aynı kalıp yalnız etiket (tag) ya da anlatım değişirse anahtar yenilenmez; karne tipi kayıtlı cevaplardan yeniden hesaplanır (001: Tumla D, Korvala C etiketleri).
  var KEYV = { "001": "v3" };
  function keyOf(no) { return "wishceo.s" + no + (KEYV[no] || ""); }
  var ISSUE = CUR.no, CASES = [], KEY = keyOf(ISSUE);

  var TYPES = {
    cerrah: { name: "Budayıcı", desc: "Neyin bırakılacağını bilirsin. Duygusal bağlara değil, şirketin gerçekte neyle para kazandığına bakarsın ve zor kararı erken alırsın." },
    kalkan: { name: "İnsan Odaklı", desc: "Önce insanlar, sonra rakamlar. Güven bir kez giderse hiçbir bütçenin onu geri getiremeyeceğini bilirsin." },
    kumar: { name: "Kumarbaz", desc: "Masaya bütün fişleri sürersin. Tutarsa kitaplara geçersin. Tutmazsa da geçersin, ama başka bir bölüme." },
    kasa: { name: "Kasa Odaklı", desc: "Bu çeyreği toparlarsın, tablolar temiz görünür. Sorun şu: şirketler çeyrekle değil, on yılla ölçülür." }
  };
  var TAG_ORDER = ["cerrah", "kalkan", "kumar", "kasa"];

  // ---------- durum ----------
  var state = { answers: CASES.map(function () { return null; }), cur: 0, joined: false, consent: "" };
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && Array.isArray(s.answers) && s.answers.length === CASES.length) {
        state.answers = s.answers.map(function (a, i) { return opt(i, a) ? a : null; });
      }
    } catch (e) { /* gizli sekme vb. */ }
    loadList();
    state.cur = firstOpen();
    if (state.cur === -1) state.cur = CASES.length - 1;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ answers: state.answers })); } catch (e) { /* yok say */ }
  }
  // bildirim listesi sayıdan bağımsız; eski "wishceo.s001" kaydındaki onay buraya taşınır
  function loadList() {
    try {
      var l = JSON.parse(localStorage.getItem(LIST_KEY) || "null"), migrate = false;
      if (!l) { l = JSON.parse(localStorage.getItem("wishceo.s001") || "null"); migrate = !!(l && l.joined); }
      if (l) { state.joined = !!l.joined; state.consent = typeof l.consent === "string" ? l.consent : ""; }
      if (migrate) saveList();
    } catch (e) { /* gizli sekme vb. */ }
  }
  function saveList() {
    try { localStorage.setItem(LIST_KEY, JSON.stringify({ joined: state.joined, consent: state.consent })); } catch (e) { /* yok say */ }
  }
  function optOf(c, k) { return c.opts.filter(function (o) { return o.k === k; })[0] || null; }
  function opt(i, k) { return optOf(CASES[i], k); }
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

  var DEMO_SP = /[?&]ornek-sponsor\b/.test(location.search);
  function sponsorOf(c) { return c.sponsor || (DEMO_SP ? "Örnek Sponsor" : ""); }
  function renderCase(focus) {
    var i = state.cur, c = CASES[i], a = state.answers[i];
    var html =
      '<header class="case-head"><span>Dosya ' + pad(i + 1) + " / " + pad(CASES.length) + "</span><span>" + esc(c.area) + "</span></header>" +
      '<div class="case-main">' +
      '<p class="case-meta">' + esc(c.place[0] + c.place[1]) + "</p>" +
      '<h3 class="case-title" tabindex="-1">' + esc(c.title) + "</h3>" +
      (sponsorOf(c) ? '<p class="case-sp">Bu vaka ' + esc(sponsorOf(c)) + " katkısıyla hazırlandı.</p>" : "") +
      '<p class="case-co">' + esc(c.company) + "</p>" +
      '<div class="case-body">' + c.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
      '<dl class="stats">' + c.stats.map(function (s) { return "<div><dt>" + esc(s[0]) + "</dt><dd>" + esc(s[1]) + "</dd></div>"; }).join("") + "</dl>" +
      '<p class="ask">' + esc(c.ask) + "</p>" +
      '<div class="opts" role="group" aria-label="Seçenekler">' +
      c.opts.map(function (o) {
        var cls = "opt" + (a ? (o.k === a ? " is-picked" : " is-dim") : "") + (a && o.k === c.real.k ? " is-real" : "");
        return '<button type="button" class="' + cls + '" data-k="' + o.k + '"' + (a ? ' aria-disabled="true"' : "") + ">" +
          '<span class="opt-k">' + o.k + '</span><span class="opt-t">' + esc(o.t) + "</span>" +
          (a && o.k === c.real.k ? '<span class="opt-real">Vakadaki CEO</span>' : "") + "</button>";
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

  function afterHtml(i) {
    var c = CASES[i], o = opt(i, state.answers[i]), ro = opt(i, c.real.k), diff = o.s - ro.s, last = i === CASES.length - 1;
    var cmp = o.k === c.real.k ? "Vakadaki CEO ile aynı kararı verdin."
      : diff > 0 ? "Vakadaki CEO’dan " + diff + " puan iyi. Yönetim kurulu not aldı."
      : "Vakadaki CEO’nun kararı " + (-diff) + " puan daha iyiydi.";
    return '<div class="after">' +
      '<div class="verdict t-' + tier(o.s) + '" tabindex="-1">' +
      '<div class="stamp' + (reduced() ? "" : " anim") + '" aria-hidden="true"><b>' + o.s + "</b><span>puan</span></div>" +
      '<p class="lbl">Senin kararın · ' + o.k + "</p>" +
      '<p class="verdict-r">' + esc(o.r) + "</p>" +
      '<p class="sr">Puanın: ' + o.s + " / 100</p>" +
      "</div>" +
      '<div class="truth">' +
      '<p class="lbl">Vakada ne oldu</p>' +
      '<p class="truth-who">' + esc(c.real.who) + " <span>" + esc(c.real.role) + " · seçimi " + c.real.k + "</span></p>" +
      c.real.text.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      '<p class="truth-cmp">' + esc(cmp) + "</p>" +
      '<p class="truth-note">Bu dosya gerçek bir olaya dayanıyor; şirket, ürün ve kişi adları değiştirildi.</p>' +
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
      '<p class="vs">Vakadaki CEO’ların ortalaması: ' + r.real + "</p>" +
      "</div></div>" +
      '<table class="rows"><caption class="sr">Dosya dosya kararların</caption>' +
      "<thead><tr><th scope=\"col\">Dosya</th><th scope=\"col\">Sen</th><th scope=\"col\">Vakada</th><th scope=\"col\">Puan</th></tr></thead><tbody>" +
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
      '<a class="report-cta" href="#liste">Yeni sayı çıkınca haber verelim mi? <b>Bildirim al</b> <span aria-hidden="true">↓</span></a>' +
      "</div>";
    var url = site() + "/?s=" + ISSUE, text = shareText();
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
    var text = shareText(), url = site() + "/?s=" + ISSUE, msg = $(".share-msg", elReport);
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
    state.answers = CASES.map(function () { return null; });
    state.cur = 0;
    save();
    elReport.hidden = true;
    elReport.innerHTML = "";
    renderCase(true);
  }

  // ---------- bildirim listesi ----------
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
      say("Listedesin. Yeni sayı çıktığında haber vereceğiz.", "ok");
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
        say("Bildirim almak için e-posta onayı kutusunu işaretle.", "err");
        ok.focus();
        return;
      }
      ok.removeAttribute("aria-invalid");
      var at = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
      var fields = [["E-posta", email], ["Onay", "evet · yeni sayı duyurusu e-postası (6563 md. 6) · " + at],
        ["Liste", "WishCEO yeni sayı bildirimi · Sayı " + ISSUE]];
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
        .then(function () { state.joined = true; state.consent = at; saveList(); joined(); })
        .catch(function (err) {
          btn.disabled = false;
          btn.textContent = label;
          say(err && err.message === "rate" ? "Çok fazla deneme oldu. Birkaç dakika sonra tekrar dene."
            : "Kaydedemedik. Bağlantını kontrol edip tekrar dene.", "err");
        })
        .then(function () { busy = false; });
    });
  }

  // ---------- sayfa: sayı bilgisi ve arşiv ----------
  var WORDS = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı"];
  var WORDS_LO = ["", "bir", "iki", "üç", "dört", "beş", "altı"];
  function yearOf(c) { return (c.place[1] || "").replace(/^\s*·\s*/, ""); }
  function fillPage() {
    var n = CASES.length;
    Array.prototype.forEach.call(document.querySelectorAll("[data-issue]"), function (el) { el.textContent = "Sayı " + ISSUE; });
    var intro = $("#oyun-intro");
    if (intro && WORDS[n]) intro.textContent = WORDS[n] + " şirket, " + WORDS_LO[n] + " kriz. Hangisinde vakadaki CEO’dan daha iyi iş çıkarırsın?";
    var meta = $("#hero-meta");
    if (meta) meta.textContent = n + " dosya · " + n + " karar · 1 CEO karnesi · Üyelik yok";
    var idx = $("#index-list");
    if (idx) idx.innerHTML = CASES.map(function (c, i) {
      var y = yearOf(c);
      return '<li><a href="#oyun"><span class="n">' + pad(i + 1) + '</span><span class="t">' + esc(c.title) +
        '</span><span class="m">' + esc(c.area + " · " + c.place[0] + (y ? ", " + y : "")) + "</span></a></li>";
    }).join("");
    // şerit hep en son açılan sayıyı gösterir (?s= ile eski sayı açılsa da); ileri tarihli sayılar RELEASED'da yok
    var NEWEST = RELEASED[RELEASED.length - 1];
    var tick = '<span>Sayı ' + NEWEST.no + ' · En yeni <b class="up">▲</b></span>' + NEWEST.cases.map(function (c, i) {
      var y = yearOf(c);
      return "<span>Dosya " + pad(i + 1) + " · " + esc(c.place[0] + (y ? ", " + y : "")) + " · " + esc(c.title) + ' <b class="dn">▼</b></span>';
    }).join("") + (RELEASED.length > 1 ? '<span>Arşiv · önceki sayılar açık <b class="up">▲</b></span>' : '<span>Yeni sayılar yolda <b class="up">▲</b></span>');
    Array.prototype.forEach.call(document.querySelectorAll(".ticker-group"), function (g) { g.innerHTML = tick; });
  }
  function avgScore(iss) {
    try {
      var s = JSON.parse(localStorage.getItem(keyOf(iss.no)) || "null");
      if (!s || !Array.isArray(s.answers) || s.answers.length !== iss.cases.length) return null;
      var sum = 0;
      for (var i = 0; i < iss.cases.length; i++) {
        var o = optOf(iss.cases[i], s.answers[i]);
        if (!o) return null;
        sum += o.s;
      }
      return Math.round(sum / iss.cases.length);
    } catch (e) { return null; }
  }
  function renderArchive() {
    var sec = $("#arsiv"), list = $("#arsiv-list");
    if (!sec || !list) return;
    var items = RELEASED.filter(function (x) { return x !== CUR; }).reverse();
    if (!items.length) { sec.hidden = true; return; }
    list.innerHTML = items.map(function (x) {
      var sc = avgScore(x);
      var m = "Sayı " + x.no + (x.no === LATEST ? " · En yeni" : "") + " · " + x.cases.length + " dosya" + (sc === null ? "" : " · Karnen " + sc + "/100");
      return '<li><a href="/?s=' + x.no + '#oyun"><span class="bl-m">' + esc(m) + '</span><span class="bl-t">' +
        esc(x.cases.map(function (c) { return c.company; }).join(", ")) + "</span></a></li>";
    }).join("");
    sec.hidden = false;
  }

  // ---------- başlat ----------
  function init() {
    elSteps = $("#steps");
    elCase = $("#case");
    elReport = $("#report");
    if (elSteps) { elSteps.style.setProperty("--n", CASES.length); elSteps.classList.toggle("many", CASES.length > 3); }
    var d = $("#today");
    if (d) try { d.textContent = new Date(CUR.date + "T12:00:00+03:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" }); } catch (e) { /* sabit tarih kalsın */ }
    var tk = $(".ticker-stop");
    if (tk) {
      tk.hidden = false;
      tk.addEventListener("click", function () {
        var p = tk.getAttribute("aria-pressed") !== "true";
        tk.setAttribute("aria-pressed", String(p));
        tk.textContent = p ? "▶" : "❚❚";
        tk.parentNode.classList.toggle("is-paused", p);
      });
    }
    fillPage();
    renderArchive();
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

  // vakalar sayilar/NNN.json'da; yalnız açılmış (tarihi gelmiş) sayılar istenir, ileri tarihli metin istemciye gelmez
  function boot() {
    Promise.all(RELEASED.map(function (x) {
      return fetch("/sayilar/" + x.no + ".json").then(function (r) { if (!r.ok) throw r.status; return r.json(); })
        .then(function (c) { x.cases = c; }, function () { x.cases = null; });
    })).then(function () {
      var cur = CUR;
      RELEASED = RELEASED.filter(function (x) { return Array.isArray(x.cases) && x.cases.length; });
      if (!RELEASED.length) return;
      if (RELEASED.indexOf(cur) < 0) cur = RELEASED[RELEASED.length - 1];
      LATEST = RELEASED[RELEASED.length - 1].no;
      CUR = cur; ISSUE = CUR.no; CASES = CUR.cases; KEY = keyOf(ISSUE);
      state.answers = CASES.map(function () { return null; });
      init();
    });
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
