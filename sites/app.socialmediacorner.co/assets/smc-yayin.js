/* smc-yayin.js — Yayın kuyruğu (A7-3): liste + takvim, iş ayrıntısı (LinkedIn/Instagram), kuyruğa al, onayla,
   iptal, yeniden dene, elle yayınlandı. Sunucu sözleşmesi: form-worker/src/publish.js (/publish/jobs…).
   Kurallar: kullanıcı/sunucu metni yalnız textContent ile yazılır; satır içi stil yok; #ornek ya da ?ornek kipinde
   hiçbir ağ isteği yapılmaz (sahte sunucu bellekte çalışır). Oturum anahtarı smc-oturum yalnız okunur, yazılmaz.
   Saatler İstanbul saatidir (GMT+3, yaz saati yok). Metin uzunluğu publish.js gibi kod noktası sayılır. */
(function () {
  'use strict';

  var root = document.documentElement;
  var EN = /^en/i.test(root.getAttribute('lang') || '');
  function L(tr, en) { return EN ? en : tr; }
  function $(s, c) { return (c || document).querySelector(s); }

  /* ---- Tema düğmesi (smc-app.js ile aynı davranış; bu sayfa smc-app.js yüklemez) ---- */
  var temaBtn = $('#tema');
  function etkinTema() {
    var a = root.getAttribute('data-theme');
    if (a === 'dark' || a === 'light') return a;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  /* Hedef eylem etiketi (aria-pressed yok); ikon .tema[data-tema-etkin] ile çizilir. */
  function temaYaz() {
    if (!temaBtn) return;
    var k = etkinTema() === 'dark', m = k ? (EN ? 'Switch to light theme' : 'Açık temaya geç') : (EN ? 'Switch to dark theme' : 'Koyu temaya geç');
    temaBtn.removeAttribute('aria-pressed');
    temaBtn.setAttribute('data-tema-etkin', k ? 'dark' : 'light');
    temaBtn.setAttribute('aria-label', m);
    temaBtn.setAttribute('title', m);
  }
  if (temaBtn) {
    temaBtn.addEventListener('click', function () {
      var t = etkinTema() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', t);
      try { localStorage.setItem('smc-tema', t); } catch (e) { /* depolama kapalı */ }
      temaYaz();
    });
    if (window.matchMedia) {
      var mq = matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', temaYaz);
    }
    temaYaz();
  }

  /* ---- DOM yardımcıları (yalnız textContent ve createElement) ---- */
  function add(el, kids) {
    if (kids == null || kids === false) return el;
    if (!Array.isArray(kids)) kids = [kids];
    kids.forEach(function (k) {
      if (k == null || k === false) return;
      el.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k);
    });
    return el;
  }
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'checked' || k === 'disabled') el[k] = !!v;
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    });
    return add(el, kids);
  }
  function bosalt(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  var canli = $('#yk-canli');
  function duyur(m) {
    if (!canli) return;
    canli.textContent = '';
    setTimeout(function () { canli.textContent = m; }, 60);
  }
  function odakla(el) { if (el) { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus(); } }

  /* ---- Sabitler ---- */
  var LIMITS = { linkedin: 3000, instagram: 2200 }; // publish.js LIMITS ile aynı (kod noktası)
  var MAX_MEDIA = 1000, MAX_GUN = 180, PAY_MS = 5 * 60000, GUN_MS = 86400000, TZ = 3 * 3600000;
  var DURUM_AD = {
    taslak: L('Taslak', 'Draft'), onay_bekliyor: L('Onay bekliyor', 'Awaiting approval'), planlandi: L('Planlandı', 'Scheduled'),
    yayinlaniyor: L('Yayınlanıyor', 'Publishing'), yayinlandi: L('Yayınlandı', 'Published'), basarisiz: L('Başarısız', 'Failed'),
    kontrol: L('Kontrol et', 'Needs check'), iptal: L('İptal edildi', 'Cancelled')
  };
  var DURUM_ROZET = {
    taslak: 'rozet-taslak', onay_bekliyor: 'rozet-uyari', planlandi: 'rozet-bilgi', yayinlaniyor: 'rozet-bilgi',
    yayinlandi: 'rozet-ok', basarisiz: 'rozet-hata', kontrol: 'rozet-uyari', iptal: 'rozet-iptal'
  };
  var KANAL = { linkedin: 'LinkedIn', instagram: 'Instagram' };
  var KANAL_DA = { linkedin: "LinkedIn'de", instagram: "Instagram'da" };
  var BITTI = { yayinlandi: 1, iptal: 1 };
  var YOL = EN
    ? { giris: '/en/hesap/login', baglanti: '/en/hesap/connections', masa: '/en/' }
    : { giris: '/hesap/giris', baglanti: '/hesap/baglantilar', masa: '/' };

  function uzunluk(s) { return Array.from(String(s == null ? '' : s)).length; }
  function rozet(state) { return h('span', { class: 'rozet ' + (DURUM_ROZET[state] || ''), text: DURUM_AD[state] || state }); }
  function ornekRozet() { return ORNEK ? h('span', { class: 'yk-ornek-rozet', text: L('örnek', 'sample') }) : null; }

  /* ---- Zaman (İstanbul, sabit +03:00) ---- */
  var AY_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var AY_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var AYK_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var AYK_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var GUN_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var GUN_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var GUNK_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  var GUNK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var EK_BIR = ['', 'de', 'de', 'te', 'te', 'te', 'da', 'de', 'de', 'da'], EK_ON = ['da', 'da', 'de', 'da', 'ta', 'de'];
  function saatEk(s) { var p = s.split(':').map(Number), n = p[1] || p[0]; return '\'' + (n % 10 ? EK_BIR[n % 10] : EK_ON[n / 10]); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ist(ms) {
    var d = new Date(ms + TZ);
    var o = { y: d.getUTCFullYear(), a: d.getUTCMonth(), g: d.getUTCDate(), hg: d.getUTCDay() };
    o.gun = o.y + '-' + pad(o.a + 1) + '-' + pad(o.g);
    o.saat = pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
    return o;
  }
  function yerelMs(gun, saat) { return Date.parse(gun + 'T' + saat + ':00+03:00'); }
  function gunBasi(gun) { return yerelMs(gun, '00:00'); }
  function isoAl(ms) { return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z'); }
  function msAl(s) { if (!s) return NaN; return Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(s) ? s : String(s).replace(' ', 'T') + '+03:00'); }
  function gunAd(t) { return EN ? GUN_EN[t.hg] + ' ' + t.g + ' ' + AY_EN[t.a] : t.g + ' ' + AY_TR[t.a] + ' ' + GUN_TR[t.hg]; }
  function kisaTarih(ms) {
    if (!isFinite(ms)) return '—';
    var t = ist(ms);
    return EN ? t.g + ' ' + AYK_EN[t.a] + ', ' + t.saat : t.g + ' ' + AYK_TR[t.a] + ' ' + t.saat;
  }
  function zamanMetni(ms) { if (!isFinite(ms)) return L('Tarih yok', 'No date'); var t = ist(ms); return gunAd(t) + ', ' + t.saat; }
  function onayZamani(ms) {
    var t = ist(ms);
    return EN ? 'on ' + gunAd(t) + ' at ' + t.saat + ' (Istanbul)' : gunAd(t) + ' ' + t.saat + saatEk(t.saat) + ' (İstanbul)';
  }
  var SIM_SIMDI = Date.parse('2026-11-23T09:00:00+03:00');
  function simdi() { return ORNEK ? SIM_SIMDI : Date.now(); }
  function gunEtiket(gun) {
    var bugun = ist(simdi()).gun, yarin = ist(simdi() + GUN_MS).gun;
    if (gun === bugun) return L('Bugün', 'Today');
    if (gun === yarin) return L('Yarın', 'Tomorrow');
    return '';
  }

  /* ---- Kip, adres, oturum ---- */
  var meta = $('meta[name="api-base"]');
  var API = ((meta && meta.getAttribute('content')) || '').trim().replace(/\/+$/, '');
  function hashParams() {
    var o = {};
    location.hash.replace(/^#/, '').split('&').forEach(function (p) {
      if (!p) return;
      var i = p.indexOf('='), k = i < 0 ? p : p.slice(0, i), v = i < 0 ? '' : p.slice(i + 1);
      try { v = decodeURIComponent(v); } catch (e) { /* bozuk kodlama */ }
      o[k] = v;
    });
    return o;
  }
  var ORNEK = !API || /[?&]ornek(=|&|$)/.test(location.search) || Object.prototype.hasOwnProperty.call(hashParams(), 'ornek');
  function lnk(q) { return '#' + (ORNEK ? 'ornek' + (q ? '&' : '') : '') + (q || ''); }
  function git(q) { var y = lnk(q); if (location.hash === y) rota(true); else location.hash = y; }

  // Oturum: smc-oturum (önce sessionStorage, sonra localStorage); düz anahtar ya da {"token":…}. Yalnız okunur.
  function oturum() {
    var depolar = [];
    try { depolar.push(window.sessionStorage); } catch (e) { /* kapalı */ }
    try { depolar.push(window.localStorage); } catch (e) { /* kapalı */ }
    for (var i = 0; i < depolar.length; i++) {
      var v = null;
      try { v = depolar[i] && depolar[i].getItem('smc-oturum'); } catch (e) { v = null; }
      if (!v) continue;
      var t = v;
      if (v.charAt(0) === '{') { try { t = JSON.parse(v).token; } catch (e) { t = null; } }
      if (typeof t === 'string' && /^[A-Za-z0-9_-]{43}$/.test(t)) return t;
    }
    return null;
  }
  function rastgeleRid() {
    var b = new Uint8Array(16), s = '';
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(b);
    else for (var i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256);
    for (var j = 0; j < b.length; j++) s += String.fromCharCode(b[j]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /* ---- API ---- */
  function api(method, path, body) {
    if (ORNEK) return sahte.istek(method, path, body);
    var t = oturum();
    if (!t) return Promise.resolve({ status: 401, data: { ok: false, error: 'auth' } }); // anahtarsız istek atılmaz
    var opt = { method: method, headers: { Authorization: 'Bearer ' + t }, credentials: 'omit', cache: 'no-store' };
    if (method !== 'GET') { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body || {}); }
    return fetch(API + path, opt).then(function (r) {
      return r.text().then(function (tx) {
        var d = null;
        try { d = JSON.parse(tx); } catch (e) { d = null; }
        if (!d || typeof d !== 'object') d = { ok: false, error: r.ok ? 'json' : 'server' };
        return { status: r.status, data: d };
      });
    }, function () { return { status: 0, data: { ok: false, error: 'network' } }; });
  }
  function hataKodu(res) {
    var e = res && res.data && res.data.error;
    if (e) return String(e);
    if (res && res.status === 401) return 'auth';
    if (res && res.status === 503) return 'not_ready';
    return 'server';
  }
  var HATA = {
    not_found: L('Bu gönderi bulunamadı. Silinmiş ya da başka bir hesaba ait olabilir.', 'This post was not found. It may have been removed or belong to another account.'),
    state: L('Bu gönderinin durumu bu arada değişti. Güncel hâlini görmek için yenile.', 'The status of this post changed in the meantime. Refresh to see the current version.'),
    limit: L('Kuyrukta en çok 100 açık gönderi olabilir. Önce bazılarını yayınla ya da iptal et.', 'The queue can hold at most 100 open posts. Publish or cancel some first.'),
    rid: L('Bu istek daha önce kullanıldı. Formu yeniden açıp tekrar dene.', 'This request was already used. Reopen the form and try again.'),
    duplicate: L('Bu metin bu hesapta zaten planlı ya da yayınlanmış.', 'This text is already scheduled or published on this account.'),
    not_connected: L('Bu kanal için bağlı hesap yok. Önce hesabını bağla.', 'No account is connected for this channel. Connect your account first.'),
    body: L('Gönderi metni boş olamaz.', 'The post text cannot be empty.'),
    too_long: L('Metin bu kanal için çok uzun.', 'The text is too long for this channel.'),
    media_url: L('Görsel bağlantısı geçersiz ya da eksik. Instagram için https ile başlayan herkese açık bir bağlantı gerekli.', 'The image link is invalid or missing. Instagram needs a public link that starts with https.'),
    run_at: L('Gün ve saat geçmiş ya da 180 günden uzak. Yeni bir gün ve saat seç.', 'The day and time is in the past or more than 180 days away. Pick a new day and time.'),
    platform: L('Bu kanal şu an kullanılamıyor.', 'This channel is not available right now.'),
    auth: L('Oturumun kapanmış. Yeniden giriş yap.', 'Your session has ended. Sign in again.'),
    not_ready: L('Otomatik yayın henüz açık değil.', 'Automatic publishing is not open yet.'),
    network: L('Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.', 'Could not connect. Check your connection and try again.')
  };
  function hataMetni(kod) { return HATA[kod] || L('Bir sorun oldu. Biraz sonra yeniden dene.', 'Something went wrong. Try again in a moment.'); }
  function sonHata(kod) {
    if (!kod) return '';
    var k = String(kod);
    if (k.indexOf('max_attempts:') === 0) return L('Birkaç deneme başarısız oldu', 'Several attempts failed') + ' (' + sonHata(k.slice(13)).replace(/\.$/, '') + ').';
    var m = {
      stale: L('Planlanan saatten sonraki 24 saat içinde yayınlanamadı; süre doldu.', 'It could not be published within 24 hours of the scheduled time; the window expired.'),
      lease_expired: L('Yayın sırasında bağlantı koptu; gönderinin çıkıp çıkmadığı bilinmiyor.', 'The connection dropped while publishing; it is unknown whether the post went out.'),
      account_changed: L('Bağlı hesap değişti; bu yüzden onay düştü.', 'The connected account changed, so the approval was removed.'),
      reconnect: L('Hesap bağlantısının süresi doldu ya da izin geri alındı; hesabı yeniden bağla.', 'The account connection expired or permission was revoked; reconnect the account.'),
      token: L('Hesap bağlantısının süresi doldu ya da izin geri alındı; hesabı yeniden bağla.', 'The account connection expired or permission was revoked; reconnect the account.'),
      ig_refresh: L('Instagram bağlantısı yenilenemedi; hesabı yeniden bağla.', 'The Instagram connection could not be refreshed; reconnect the account.'),
      not_connected: L('Bu kanal için bağlı hesap yok.', 'No account is connected for this channel.'),
      error: L('Platform gönderiyi kabul etmedi.', 'The platform did not accept the post.')
    };
    return m[k] || L('Bilinmeyen hata', 'Unknown error') + ' (' + k + ').';
  }
  function yenidenBaglaGerek(kod) { return /(^|:)(reconnect|token|not_connected|account_changed|ig_refresh)$/.test(String(kod || '')); }

  /* ---- Örnek kip: sahte sunucu (ağ yok) ---- */
  var sahte = (function () {
    var s = { d: null, mod: '', isler: [], olaylar: {}, sira: 1050 };
    var EDITABLE = { taslak: 1, onay_bekliyor: 1, planlandi: 1 };
    function kopya(o) { return JSON.parse(JSON.stringify(o)); }
    function is(id, platform, state, gun, saat, tr, en, ek) {
      var j = {
        id: id, rid: 'ornek-' + id, platform: platform, state: state, body: EN ? en : tr, media_url: null,
        run_at: gun ? isoAl(yerelMs(gun, saat)) : null, approved_at: null, attempts: 0, next_try_at: null, last_error: null,
        remote_id: null, created_at: isoAl(yerelMs('2026-11-20', '14:05') + (id - 1030) * 600000), updated_at: null
      };
      Object.keys(ek || {}).forEach(function (k) { j[k] = ek[k]; });
      j.updated_at = j.updated_at || j.created_at;
      if (state === 'planlandi' || state === 'yayinlaniyor' || state === 'yayinlandi' || state === 'basarisiz' || state === 'kontrol') {
        j.approved_at = j.approved_at || isoAl(msAl(j.created_at) + 3600000);
      }
      return j;
    }
    function gecmis(j) {
      var o = [], c = msAl(j.created_at);
      function e(ms, from, to, note, by) { o.push({ at: isoAl(ms), from_state: from, to_state: to, note: note, by: by || 'user' }); }
      e(c, null, 'taslak', 'created');
      if (j.state === 'taslak') return o.reverse();
      e(c + 1800000, 'taslak', 'onay_bekliyor', 'submitted');
      if (j.state === 'onay_bekliyor') return o.reverse();
      e(c + 3600000, 'onay_bekliyor', 'planlandi', 'approved');
      if (j.state === 'iptal') { e(c + 90000000, 'planlandi', 'iptal', 'cancelled'); return o.reverse(); }
      var r = msAl(j.run_at);
      if (j.state === 'planlandi') return o.reverse();
      e(r, 'planlandi', 'yayinlaniyor', 'claimed', 'system');
      if (j.state === 'yayinlandi') e(r + 40000, 'yayinlaniyor', 'yayinlandi', null, 'system');
      if (j.state === 'basarisiz') e(r + 40000, 'yayinlaniyor', 'basarisiz', j.last_error, 'system');
      if (j.state === 'kontrol') e(r + 900000, 'yayinlaniyor', 'kontrol', 'lease_expired', 'system');
      return o.reverse();
    }
    function kur(d) {
      s.d = d; s.mod = ''; s.isler = []; s.olaylar = {}; s.sira = 1050;
      if (d === 'kapali' || d === 'giris' || d === 'hata') { s.mod = d; return; }
      if (d === 'bos') return;
      s.isler = [
        is(1047, 'linkedin', 'iptal', '2026-11-28', '11:00',
          'Webinar duyurusu: Satış ekipleri için LinkedIn\n\nTarih değişti; yeni tarihi yakında paylaşacağız.',
          'Webinar announcement: LinkedIn for sales teams\n\nThe date has changed; we will share the new date soon.'),
        is(1046, 'instagram', 'planlandi', '2026-11-27', '19:30',
          'Cuma kahve molası\n\nEkipten bu haftanın en iyi fikri: toplantı notlarını toplantı bitmeden paylaşmak.\n\n#ekip #cuma',
          'Friday coffee break\n\nBest idea from the team this week: share meeting notes before the meeting ends.\n\n#team #friday',
          { media_url: 'https://cdn.example.com/ornek/kahve-molasi.jpg' }),
        is(1045, 'linkedin', 'planlandi', '2026-11-26', '10:00',
          'Müşteri hikâyesi: Kuzey Lojistik\n\nKuzey Lojistik, sipariş takibini tek ekranda toplayarak destek çağrılarını üçte bir azalttı.',
          'Customer story: Kuzey Logistics\n\nKuzey Logistics cut support calls by a third by bringing order tracking onto one screen.'),
        is(1044, 'instagram', 'taslak', '2026-11-24', '12:15',
          'Sektör raporu: 5 bulgu\n\nBu yılın raporundan öne çıkan beş bulguyu kaydırarak gör. Tam rapor için bağlantı profilde.\n\n#pazarlama #rapor',
          'Industry report: 5 findings\n\nSwipe to see the five standout findings from this year\'s report. Full report via the link in bio.\n\n#marketing #report'),
        is(1043, 'linkedin', 'onay_bekliyor', '2026-11-23', '18:00',
          'Destek ekibimizle tanışın\n\nBu hafta destek ekibimizin üç üyesi en sık gelen soruları ve nasıl çözdüklerini anlatıyor. İlk konu: fatura adresini değiştirmek.',
          'Meet our support team\n\nThis week three members of our support team share the most common questions and how they solve them. First topic: changing your billing address.'),
        is(1042, 'linkedin', 'planlandi', '2026-11-23', '09:30',
          'Teklif süresini yarıya indiren 3 adım\n\nGeçen çeyrekte teklif hazırlama süremiz 6 günden 3 güne indi. Ne değişti?\n\n1. Şablonları tek yerde topladık.\n2. Fiyat onayını tek kişiye bağladık.\n3. Her teklife 30 dakikalık bir kontrol koyduk.\n\nSizde en çok zamanı hangi adım alıyor?',
          '3 steps that halved our proposal time\n\nLast quarter our proposal prep time dropped from 6 days to 3. What changed?\n\n1. We kept all templates in one place.\n2. One person owns price approval.\n3. Every proposal gets a 30-minute check.\n\nWhich step takes you the longest?'),
        is(1041, 'linkedin', 'yayinlaniyor', '2026-11-23', '09:00',
          'Haftanın sorusu: Toplantısız bir gün işe yarar mı?',
          'Question of the week: would a day with no meetings work?', { attempts: 1 }),
        is(1040, 'linkedin', 'kontrol', '2026-11-22', '09:00',
          'Kasım bülteni çıktı\n\nBu ay: yeni entegrasyonlar, iki müşteri hikâyesi ve ekip haberleri.',
          'The November newsletter is out\n\nThis month: new integrations, two customer stories and team news.',
          { attempts: 1, last_error: 'lease_expired' }),
        is(1039, 'linkedin', 'basarisiz', '2026-11-22', '11:00',
          'Yeni ofisimizden ilk kare\n\nKadıköy\'deki yeni ofisimize taşındık. Kapımız açık, kahve bizden.',
          'First shot from our new office\n\nWe moved to our new office in Kadıköy. Our door is open and the coffee is on us.',
          { attempts: 1, last_error: 'reconnect' }),
        is(1036, 'linkedin', 'yayinlandi', '2026-11-21', '10:00',
          'Ekibimiz büyüyor\n\nSatış ekibimize iki yeni arkadaş katıldı. Hoş geldiniz Deniz ve Mert!',
          'Our team is growing\n\nTwo new colleagues joined our sales team. Welcome, Deniz and Mert!',
          { attempts: 1, remote_id: 'urn:li:share:ornek-1036' })
      ];
      s.isler.forEach(function (j) { s.olaylar[j.id] = gecmis(j); });
    }
    function cevap(status, data) {
      return new Promise(function (ok) { setTimeout(function () { ok({ status: status, data: data }); }, 180); });
    }
    function hata(status, code) { return cevap(status, { ok: false, error: code }); }
    function bul(id) { for (var i = 0; i < s.isler.length; i++) if (s.isler[i].id === id) return s.isler[i]; return null; }
    function olay(j, from, to, note, by) {
      (s.olaylar[j.id] = s.olaylar[j.id] || []).unshift({ at: isoAl(simdi()), from_state: from, to_state: to, note: note, by: by || 'user' });
      j.state = to; j.updated_at = isoAl(simdi());
    }
    function zamanCoz(v) {
      if (v == null || v === '') return { ms: null };
      var m = typeof v === 'string' && v.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/);
      if (!m) return { hata: 'run_at' };
      var t = Date.parse(m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + (m[6] || '00') + (m[7] || '+03:00'));
      return isFinite(t) ? { ms: Math.floor(t / 1000) * 1000 } : { hata: 'run_at' };
    }
    function medyaCoz(v) {
      if (v == null || v === '') return { url: null };
      if (typeof v !== 'string' || v.length > MAX_MEDIA) return { hata: 1 };
      try { var u = new URL(v); return u.protocol === 'https:' ? { url: v } : { hata: 1 }; } catch (e) { return { hata: 1 }; }
    }
    function metinHata(v, platform) {
      if (typeof v !== 'string' || !v.trim()) return 'body';
      if (uzunluk(v) > LIMITS[platform]) return 'too_long';
      return '';
    }
    function onay(j, b, retry) {
      if (retry ? !(j.state === 'basarisiz' || j.state === 'kontrol') : j.state !== 'onay_bekliyor') return hata(409, 'state');
      if (j.platform === 'instagram' && !j.media_url) return hata(400, 'media_url');
      var z = zamanCoz(b && b.run_at);
      if (z.hata) return hata(400, 'run_at');
      var at = z.ms != null ? z.ms : msAl(j.run_at), now = simdi();
      if (retry && z.ms == null) at = isFinite(msAl(j.run_at)) && msAl(j.run_at) > now ? msAl(j.run_at) : now;
      if (!isFinite(at)) return hata(400, 'run_at');
      if (!(at >= now - PAY_MS && at <= now + MAX_GUN * GUN_MS)) return hata(400, 'run_at');
      j.run_at = isoAl(at); j.approved_at = isoAl(now); j.attempts = 0; j.last_error = null; j.next_try_at = null;
      olay(j, j.state, 'planlandi', retry ? 'retry' : 'approved');
      return cevap(200, { ok: true, job: kopya(j) });
    }
    function istek(method, path, b) {
      if (s.mod === 'kapali') return hata(503, 'not_ready');
      if (s.mod === 'giris') return hata(401, 'auth');
      if (s.mod === 'hata') return hata(500, 'server');
      var m = path.match(/^\/publish\/jobs(?:\/(\d{1,12}))?(?:\/(submit|approve|cancel|retry|done))?$/);
      if (!m) return hata(404, 'not_found');
      b = b || {};
      if (!m[1]) {
        if (method === 'GET') return cevap(200, { ok: true, jobs: kopya(s.isler.slice().sort(function (x, y) { return y.id - x.id; })), enabled: true });
        if (method !== 'POST') return hata(404, 'not_found');
        if (typeof b.rid !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(b.rid)) return hata(400, 'rid');
        if (!LIMITS[b.platform]) return hata(400, 'platform');
        var mh = metinHata(b.body, b.platform); if (mh) return hata(400, mh);
        var md = medyaCoz(b.media_url); if (md.hata) return hata(400, 'media_url');
        var zc = zamanCoz(b.run_at); if (zc.hata) return hata(400, 'run_at');
        for (var i = 0; i < s.isler.length; i++) if (s.isler[i].rid === b.rid) return cevap(200, { ok: true, job: kopya(s.isler[i]), dup: true });
        var acik = s.isler.filter(function (x) { return !BITTI[x.state]; }).length;
        if (acik >= 100) return hata(409, 'limit');
        var yeni = {
          id: ++s.sira, rid: b.rid, platform: b.platform, state: 'taslak', body: b.body, media_url: md.url,
          run_at: zc.ms == null ? null : isoAl(zc.ms), approved_at: null, attempts: 0, next_try_at: null, last_error: null,
          remote_id: null, created_at: isoAl(simdi()), updated_at: isoAl(simdi())
        };
        s.isler.push(yeni);
        s.olaylar[yeni.id] = [{ at: isoAl(simdi()), from_state: null, to_state: 'taslak', note: 'created', by: 'user' }];
        return cevap(200, { ok: true, job: kopya(yeni) });
      }
      var j = bul(Number(m[1]));
      if (!j) return hata(404, 'not_found');
      var act = m[2];
      if (!act) {
        if (method === 'GET') return cevap(200, { ok: true, job: kopya(j), events: kopya((s.olaylar[j.id] || []).slice(0, 50)) });
        if (method !== 'PUT') return hata(404, 'not_found');
        if (!EDITABLE[j.state]) return hata(409, 'state');
        var text = 'body' in b ? b.body : j.body;
        var th = metinHata(text, j.platform); if (th) return hata(400, th);
        var media = 'media_url' in b ? medyaCoz(b.media_url) : { url: j.media_url }; if (media.hata) return hata(400, 'media_url');
        var run = 'run_at' in b ? zamanCoz(b.run_at) : { ms: msAl(j.run_at) }; if (run.hata) return hata(400, 'run_at');
        j.body = text; j.media_url = media.url; j.run_at = run.ms == null || !isFinite(run.ms) ? null : isoAl(run.ms);
        j.approved_at = null;
        olay(j, j.state, j.state === 'planlandi' ? 'onay_bekliyor' : j.state, 'edited');
        return cevap(200, { ok: true, job: kopya(j) });
      }
      if (method !== 'POST') return hata(404, 'not_found');
      if (act === 'submit') { if (j.state !== 'taslak') return hata(409, 'state'); olay(j, 'taslak', 'onay_bekliyor', 'submitted'); }
      else if (act === 'approve') return onay(j, b, false);
      else if (act === 'retry') return onay(j, b, true);
      else if (act === 'cancel') { if (!EDITABLE[j.state]) return hata(409, 'state'); olay(j, j.state, 'iptal', 'cancelled'); }
      else if (act === 'done') { if (j.state !== 'kontrol') return hata(409, 'state'); olay(j, 'kontrol', 'yayinlandi', 'user_done'); }
      return cevap(200, { ok: true, job: kopya(j) });
    }
    return { kur: kur, istek: istek, d: function () { return s.d; } };
  })();

  /* ---- Örnek kip: durum gezintisi ---- */
  var DURUMLAR = [
    ['liste', L('Liste', 'List'), {}],
    ['takvim', L('Takvim', 'Calendar'), { takvim: '' }],
    ['bos', L('Boş kuyruk', 'Empty queue'), {}],
    ['kuyruga-al', L('Kuyruğa al', 'Add to queue'), { yeni: '' }],
    ['ayrinti-li', L('Ayrıntı: LinkedIn', 'Detail: LinkedIn'), { is: '1042' }],
    ['ayrinti-ig', L('Ayrıntı: Instagram', 'Detail: Instagram'), { is: '1044' }],
    ['onay-bekliyor', L('Onay bekliyor', 'Awaiting approval'), { is: '1043' }],
    ['basarisiz', L('Başarısız', 'Failed'), { is: '1039' }],
    ['kontrol', L('Kontrol et', 'Needs check'), { is: '1040' }],
    ['yayinlandi', L('Yayınlandı', 'Published'), { is: '1036' }],
    ['kapali', L('Yayın kapalı (503)', 'Publishing off (503)'), {}],
    ['giris', L('Giriş gerekli (401)', 'Sign-in needed (401)'), {}],
    ['hata', L('Hata', 'Error'), {}]
  ];
  var DURUM_HARITA = {};
  DURUMLAR.forEach(function (d) { DURUM_HARITA[d[0]] = d[2]; });
  var durumNav = null;
  function ornekArayuz() {
    var bant = $('#ornek-bant');
    if (bant) bant.hidden = false;
    if (durumNav) return;
    var liste = h('ul', { class: 'yk-durum-liste' });
    DURUMLAR.forEach(function (d) {
      liste.appendChild(h('li', null, h('a', { href: '#ornek&d=' + d[0], 'data-d': d[0], text: d[1] })));
    });
    durumNav = h('nav', { class: 'yk-durumlar', id: 'yk-durumlar', 'aria-labelledby': 'yk-durumlar-b', tabindex: '-1' }, [
      h('p', { class: 'yk-durumlar-b', id: 'yk-durumlar-b', text: L('Örnek durumlar', 'Sample states') }), liste
    ]);
    var kokEl = $('#yk-kok');
    kokEl.parentNode.insertBefore(durumNav, kokEl);
  }
  function durumNavYaz() {
    if (!durumNav) return;
    var d = sahte.d();
    Array.prototype.forEach.call(durumNav.querySelectorAll('a[data-d]'), function (a) {
      if (a.getAttribute('data-d') === d) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  /* ---- Yönlendirme ---- */
  var kok = $('#yk-kok');
  var tur = 0, ilkGorunum = true, bekleyenNot = null;
  function yukleniyor() {
    bosalt(kok);
    kok.setAttribute('aria-busy', 'true');
    kok.appendChild(h('p', { class: 'bildirim', text: L('Yükleniyor…', 'Loading…') }));
  }
  function bitti(baslik) {
    kok.removeAttribute('aria-busy');
    if (!ilkGorunum && baslik) odakla(baslik);
    ilkGorunum = false;
  }
  function rota(zorla) {
    var hs = location.hash.slice(1);
    // Yalnız öğe kimliği olan çapa (#icerik, #yk-durumlar): görünüm değişmez
    if (hs && !/[=&]/.test(hs) && hs !== 'ornek' && document.getElementById(hs) && !zorla) return;
    var p = hashParams();
    if (hs && !/[=&]/.test(hs) && hs !== 'ornek' && document.getElementById(hs)) p = {};
    if (Object.prototype.hasOwnProperty.call(p, 'ornek')) ORNEK = true;
    if (ORNEK) {
      ornekArayuz();
      if (p.d && DURUM_HARITA[p.d] && p.d !== sahte.d()) sahte.kur(p.d);
      else if (sahte.d() === null) sahte.kur(DURUM_HARITA[p.d] ? p.d : 'liste');
      var g = DURUM_HARITA[p.d];
      if (g && !('is' in p || 'yeni' in p || 'duzenle' in p || 'takvim' in p)) Object.keys(g).forEach(function (k) { p[k] = g[k]; });
      durumNavYaz();
    }
    var my = ++tur;
    if ('yeni' in p) return formGoster(null, p.gun || '', my);
    if (p.duzenle) return isYukle(p.duzenle, my, true);
    if (p.is) return isYukle(p.is, my, false);
    return listeYukle('takvim' in p, parseInt(p.hafta, 10) || 0, my);
  }

  function sayfaHata(res, my, yeniden) {
    if (my !== tur) return;
    var kod = hataKodu(res);
    bosalt(kok);
    var b, kutu;
    if (kod === 'not_ready') {
      b = h('h2', { text: L('Otomatik yayın henüz açık değil', 'Automatic publishing is not open yet') });
      kutu = h('section', { class: 'sheet yk-durum-kutu' }, [b,
        h('p', { text: L('Yayın kuyruğu hazırlanıyor. Açıldığında gönderilerini gün ve saatiyle buradan planlayıp onaylayabileceksin. O zamana kadar hiçbir şey otomatik paylaşılmaz.',
          'The publishing queue is being prepared. Once it opens you can schedule and approve your posts here. Until then nothing is shared automatically.') }),
        h('p', { text: L('Şimdilik metnini Stüdyo\'da hazırla ve kendin paylaş.', 'For now, write your text in the Studio and share it yourself.') }),
        h('div', { class: 'yk-dugmeler' }, h('a', { class: 'btn btn-ana', href: YOL.masa, text: L('Stüdyo\'ya dön', 'Back to the Studio') }))
      ]);
    } else if (kod === 'auth') {
      b = h('h2', { text: L('Giriş gerekli', 'Sign-in needed') });
      kutu = h('section', { class: 'sheet yk-durum-kutu' }, [b,
        h('p', { text: L('Yayın kuyruğunu görmek için hesabına giriş yap. Gönderilerin yalnız senin hesabında görünür.', 'Sign in to see your publishing queue. Your posts are visible only in your account.') }),
        h('div', { class: 'yk-dugmeler' }, h('a', { class: 'btn btn-ana', href: YOL.giris, text: L('Giriş yap', 'Sign in') }))
      ]);
    } else if (kod === 'not_found') {
      b = h('h2', { text: L('Gönderi bulunamadı', 'Post not found') });
      kutu = h('section', { class: 'sheet yk-durum-kutu' }, [b, h('p', { text: hataMetni(kod) }),
        h('div', { class: 'yk-dugmeler' }, h('a', { class: 'btn btn-cizgi', href: lnk('liste'), text: L('Kuyruğa dön', 'Back to the queue') }))
      ]);
    } else {
      b = h('h2', { text: L('Kuyruk yüklenemedi', 'The queue could not be loaded') });
      kutu = h('section', { class: 'sheet yk-durum-kutu' }, [b,
        h('p', { class: 'bildirim bildirim-hata', text: kod === 'network' ? hataMetni('network') : L('Sunucuda bir sorun oldu. Biraz sonra yeniden dene.', 'There was a problem on the server. Try again in a moment.') }),
        h('div', { class: 'yk-dugmeler' }, h('button', { type: 'button', class: 'btn btn-ana', text: L('Yeniden dene', 'Try again'), onclick: function () { (yeniden || rota)(true); } }))
      ]);
    }
    b.setAttribute('tabindex', '-1');
    kok.appendChild(kutu);
    bitti(b);
  }

  /* ---- Üst çubuk: görünüm sekmeleri ---- */
  function ustCubuk(aktif) {
    function sekme(ad, q, metin) {
      return h('a', { class: 'yk-sekme', href: lnk(q), 'aria-current': aktif === ad ? 'page' : null, text: metin });
    }
    return h('div', { class: 'yk-ust' }, [
      h('nav', { class: 'yk-sekmeler', 'aria-label': L('Görünüm', 'View') }, [sekme('liste', 'liste', L('Liste', 'List')), sekme('takvim', 'takvim', L('Takvim', 'Calendar'))]),
      h('a', { class: 'btn btn-ana', href: lnk('yeni'), text: L('Gönderi ekle', 'Add a post') })
    ]);
  }

  function isMs(j) { return msAl(j.run_at); }
  function siraFn(a, b) {
    var x = isMs(a), y = isMs(b);
    if (!isFinite(x) && !isFinite(y)) return a.id - b.id;
    if (!isFinite(x)) return 1;
    if (!isFinite(y)) return -1;
    return x === y ? a.id - b.id : x - y;
  }
  function ilkSatir(s) {
    var t = String(s || '').split('\n').filter(function (x) { return x.trim(); })[0] || '';
    return uzunluk(t) > 90 ? Array.from(t).slice(0, 88).join('') + '…' : t;
  }
  function satir(j) {
    var ms = isMs(j);
    return h('li', null, h('a', { class: 'yk-satir', href: lnk('is=' + j.id) }, [
      h('span', { class: 'yk-saat', text: isFinite(ms) ? ist(ms).saat : '—' }),
      h('span', { class: 'yk-kanal yk-kanal-' + j.platform, text: KANAL[j.platform] || j.platform }),
      h('span', { class: 'yk-ozet', text: ilkSatir(j.body) || L('(boş metin)', '(empty text)') }),
      h('span', { class: 'yk-satir-son' }, [ornekRozet(), rozet(j.state)])
    ]));
  }

  /* ---- Liste ve takvim ---- */
  function listeYukle(takvim, hafta, my) {
    yukleniyor();
    api('GET', '/publish/jobs').then(function (res) {
      if (my !== tur) return;
      if (!res.data || !res.data.ok) return sayfaHata(res, my);
      var jobs = Array.isArray(res.data.jobs) ? res.data.jobs : [];
      if (takvim) takvimGoster(jobs, hafta); else listeGoster(jobs);
    });
  }
  function dikkatNotu(jobs) {
    var d = jobs.filter(function (j) { return j.state === 'basarisiz' || j.state === 'kontrol'; }).sort(siraFn);
    if (!d.length) return null;
    var ul = h('ul', { class: 'yk-dikkat-liste' });
    d.forEach(function (j) {
      ul.appendChild(h('li', null, h('a', { href: lnk('is=' + j.id) },
        (DURUM_AD[j.state]) + ': ' + ilkSatir(j.body) + ' (' + kisaTarih(isMs(j)) + ')')));
    });
    return h('div', { class: 'bildirim bildirim-uyari yk-blok', role: 'note' }, [
      h('p', { class: 'yk-kalin', text: d.length === 1 ? L('1 gönderi ilgini bekliyor', '1 post needs your attention') : L(d.length + ' gönderi ilgini bekliyor', d.length + ' posts need your attention') }),
      ul
    ]);
  }
  function bosGoster() {
    var b = h('h2', { tabindex: '-1', text: L('Kuyruk boş', 'The queue is empty') });
    kok.appendChild(h('section', { class: 'sheet yk-bos' }, [b,
      h('p', { text: L('Henüz planlanmış gönderi yok. Bir gönderi ekle, gün ve saatini seç, onayla; zamanı gelince yayınlanır.', 'No posts are scheduled yet. Add a post, pick a day and time and approve it; it is published when the time comes.') }),
      h('div', { class: 'yk-dugmeler' }, [
        h('a', { class: 'btn btn-ana', href: lnk('yeni'), text: L('Gönderi ekle', 'Add a post') }),
        h('a', { class: 'btn btn-cizgi', href: YOL.masa, text: L('Önce metni yaz', 'Write the text first') })
      ])
    ]));
    return b;
  }
  function listeGoster(jobs) {
    bosalt(kok);
    kok.appendChild(ustCubuk('liste'));
    if (!jobs.length) return bitti(bosGoster());
    var b = h('h2', { tabindex: '-1', class: 'yk-h2', text: L('Planlanan gönderiler', 'Scheduled posts') });
    kok.appendChild(b);
    var dn = dikkatNotu(jobs); if (dn) kok.appendChild(dn);
    var acik = jobs.filter(function (j) { return !BITTI[j.state]; }).sort(siraFn);
    var biten = jobs.filter(function (j) { return BITTI[j.state]; }).sort(function (a, c) { return siraFn(c, a); });
    if (!acik.length) kok.appendChild(h('p', { class: 'bildirim', text: L('Açık gönderi yok. Yeni bir gönderi ekleyebilirsin.', 'No open posts. You can add a new one.') }));
    var gruplar = [], son = null;
    acik.forEach(function (j) {
      var ms = isMs(j), k = isFinite(ms) ? ist(ms).gun : '-';
      if (!son || son.k !== k) { son = { k: k, ms: ms, isler: [] }; gruplar.push(son); }
      son.isler.push(j);
    });
    gruplar.forEach(function (g) {
      var et = g.k === '-' ? '' : gunEtiket(g.k);
      var bas = g.k === '-' ? L('Tarihi yok', 'No date') : (et ? et + ' · ' : '') + gunAd(ist(g.ms));
      var ul = h('ul', { class: 'yk-liste' });
      g.isler.forEach(function (j) { ul.appendChild(satir(j)); });
      kok.appendChild(h('section', { class: 'yk-grup' }, [h('h3', { class: 'yk-gun-baslik', text: bas }), ul]));
    });
    if (biten.length) {
      var ul2 = h('ul', { class: 'yk-liste' });
      biten.forEach(function (j) { ul2.appendChild(satir(j)); });
      kok.appendChild(h('details', { class: 'yk-bitti' }, [
        h('summary', { text: L('Yayınlanan ve iptal edilenler', 'Published and cancelled') + ' (' + biten.length + ')' }), ul2
      ]));
    }
    bitti(b);
  }
  function takvimGoster(jobs, hafta) {
    bosalt(kok);
    kok.appendChild(ustCubuk('takvim'));
    var bugun = ist(simdi());
    var bas = gunBasi(bugun.gun) - ((bugun.hg + 6) % 7) * GUN_MS + hafta * 7 * GUN_MS;
    var t0 = ist(bas), t6 = ist(bas + 6 * GUN_MS);
    var aralik = EN
      ? t0.g + ' ' + AY_EN[t0.a] + ' – ' + t6.g + ' ' + AY_EN[t6.a] + ' ' + t6.y
      : t0.g + ' ' + (t0.a === t6.a ? '' : AY_TR[t0.a] + ' ') + '– ' + t6.g + ' ' + AY_TR[t6.a] + ' ' + t6.y;
    var b = h('h2', { tabindex: '-1', class: 'yk-h2', text: L('Haftalık takvim', 'Weekly calendar') });
    kok.appendChild(b);
    kok.appendChild(h('div', { class: 'yk-hafta-bar' }, [
      h('a', { class: 'btn btn-cizgi btn-kucuk', href: lnk('takvim&hafta=' + (hafta - 1)), text: L('Önceki hafta', 'Previous week') }),
      h('p', { class: 'yk-hafta-ad', role: 'status', text: aralik }),
      h('a', { class: 'btn btn-cizgi btn-kucuk', href: lnk('takvim&hafta=' + (hafta + 1)), text: L('Sonraki hafta', 'Next week') }),
      hafta !== 0 ? h('a', { class: 'btn btn-metin btn-kucuk', href: lnk('takvim'), text: L('Bu hafta', 'This week') }) : null
    ]));
    var ol = h('ol', { class: 'yk-hafta' });
    for (var i = 0; i < 7; i++) {
      var gms = bas + i * GUN_MS, t = ist(gms);
      var gunun = jobs.filter(function (j) { var m = isMs(j); return isFinite(m) && ist(m).gun === t.gun; }).sort(siraFn);
      var et = gunEtiket(t.gun);
      var li = h('li', { class: 'yk-gun' + (t.gun === bugun.gun ? ' yk-gun-bugun' : '') }, h('h3', { class: 'yk-gun-ad' }, [
        h('span', { text: (EN ? GUNK_EN : GUNK_TR)[t.hg] + ' ' + t.g + ' ' + (EN ? AYK_EN : AYK_TR)[t.a] }),
        et ? h('span', { class: 'yk-gun-et', text: et }) : null
      ]));
      if (gunun.length) {
        var ul = h('ul', { class: 'yk-cipler' });
        gunun.forEach(function (j) {
          ul.appendChild(h('li', null, h('a', { class: 'yk-cip', href: lnk('is=' + j.id) }, [
            h('span', { class: 'yk-cip-ust' }, [h('span', { class: 'yk-saat', text: ist(isMs(j)).saat }), h('span', { class: 'yk-kanal yk-kanal-' + j.platform, text: KANAL[j.platform] })]),
            h('span', { class: 'yk-ozet', text: ilkSatir(j.body) }),
            rozet(j.state)
          ])));
        });
        li.appendChild(ul);
      } else {
        li.appendChild(h('p', { class: 'yk-bos-gun', text: L('Plan yok', 'Nothing planned') }));
      }
      if (gms + GUN_MS > simdi() && gms <= simdi() + MAX_GUN * GUN_MS) {
        li.appendChild(h('a', { class: 'btn btn-metin btn-kucuk yk-gune-ekle', href: lnk('yeni&gun=' + t.gun), 'aria-label': L(gunAd(t) + ' gününe gönderi ekle', 'Add a post on ' + gunAd(t)), text: L('Bu güne ekle', 'Add to this day') }));
      }
      ol.appendChild(li);
    }
    kok.appendChild(ol);
    var tarihsiz = jobs.filter(function (j) { return !BITTI[j.state] && !isFinite(isMs(j)); }).length;
    if (tarihsiz) kok.appendChild(h('p', { class: 'ipucu' }, [
      L(tarihsiz + ' gönderinin tarihi yok; ', tarihsiz + ' post(s) have no date; '),
      h('a', { href: lnk('liste'), text: L('listede gör', 'see them in the list') }), '.'
    ]));
    bitti(b);
  }

  /* ---- Zaman doğrulama (yalnız yanlış alanı işaretler) ---- */
  function zamanDogrula(gunEl, saatEl, hataEl, zorunlu) {
    [gunEl, saatEl].forEach(function (e) { e.removeAttribute('aria-invalid'); });
    hataEl.textContent = '';
    var g = gunEl.value, s = saatEl.value;
    function yanlis(el, m) { el.setAttribute('aria-invalid', 'true'); hataEl.textContent = m; el.focus(); return false; }
    if (!g && !s) {
      if (!zorunlu) return null;
      saatEl.setAttribute('aria-invalid', 'true');
      return yanlis(gunEl, L('Gün ve saat seç.', 'Pick a day and time.'));
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g)) return yanlis(gunEl, L('Bir gün seç.', 'Pick a day.'));
    if (!/^\d{2}:\d{2}$/.test(s)) return yanlis(saatEl, L('Bir saat seç.', 'Pick a time.'));
    var ms = yerelMs(g, s);
    if (!isFinite(ms)) return yanlis(gunEl, L('Bir gün seç.', 'Pick a day.'));
    if (ms < simdi() + 60000) {
      return yanlis(g === ist(simdi()).gun ? saatEl : gunEl, L('Bu saat geçti; ileri bir gün ve saat seç.', 'This time has passed; pick a later day and time.'));
    }
    if (ms > simdi() + MAX_GUN * GUN_MS) return yanlis(gunEl, L('En çok 180 gün sonrasını seçebilirsin.', 'You can pick at most 180 days ahead.'));
    return ms;
  }
  function zamanAlanlari(onek, ms) {
    var t = isFinite(ms) ? ist(ms) : null;
    var bugun = ist(simdi()).gun, son = ist(simdi() + MAX_GUN * GUN_MS).gun;
    var gun = h('input', { class: 'kutu', type: 'date', id: onek + '-gun', name: 'gun', min: bugun, max: son, value: t ? t.gun : '', 'aria-describedby': onek + '-zh' });
    var saat = h('input', { class: 'kutu', type: 'time', id: onek + '-saat', name: 'saat', step: '300', value: t ? t.saat : '', 'aria-describedby': onek + '-zh' });
    var hata = h('p', { class: 'alan-hata', id: onek + '-zh', role: 'alert' });
    [gun, saat].forEach(function (e) { e.addEventListener('input', function () { e.removeAttribute('aria-invalid'); }); });
    var kap = h('div', { class: 'yk-zaman' }, [
      h('div', { class: 'yk-alanlar' }, [
        h('div', { class: 'alan-k' }, [h('label', { class: 'etiket', for: onek + '-gun', text: L('Gün', 'Day') }), gun]),
        h('div', { class: 'alan-k' }, [h('label', { class: 'etiket', for: onek + '-saat', text: L('Saat (İstanbul)', 'Time (Istanbul)') }), saat])
      ]),
      hata
    ]);
    return { kap: kap, gun: gun, saat: saat, hata: hata };
  }

  /* ---- Form: kuyruğa al / düzenle ---- */
  function formGoster(job, gunOn, my) {
    if (my !== tur) return;
    bosalt(kok);
    var duzenle = !!job;
    var rid = rastgeleRid();
    var platform = job ? job.platform : 'linkedin';
    var b = h('h2', { tabindex: '-1', class: 'yk-h2', text: duzenle ? L('Gönderiyi düzenle', 'Edit post') : L('Kuyruğa gönderi ekle', 'Add a post to the queue') });
    kok.appendChild(h('p', { class: 'yk-geri' }, h('a', { href: lnk(duzenle ? 'is=' + job.id : 'liste'), text: duzenle ? L('← Gönderiye dön', '← Back to the post') : L('← Kuyruğa dön', '← Back to the queue') })));
    kok.appendChild(b);
    if (duzenle && job.state === 'planlandi') {
      kok.appendChild(h('p', { class: 'bildirim bildirim-uyari', text: L('Bu gönderi planlandı. Kaydedersen onay düşer ve gönderi yeniden onayını bekler; onaylamadan yayınlanmaz.', 'This post is scheduled. If you save, the approval is removed and the post waits for your approval again; it is not published without it.') }));
    }
    var form = h('form', { class: 'sheet yk-form', novalidate: true });
    var formHata = h('div', { class: 'yk-form-hata', tabindex: '-1' });

    // Kanal
    var kanalGrup = h('fieldset', { class: 'secim-grup' }, [h('legend', { text: L('Kanal', 'Channel') })]);
    var kanalSira = h('div', { class: 'secim-sira' });
    ['linkedin', 'instagram'].forEach(function (p) {
      var id = 'yk-kanal-' + p;
      kanalSira.appendChild(h('span', { class: 'secim' }, [
        h('input', { type: 'radio', name: 'kanal', id: id, value: p, checked: p === platform, disabled: duzenle && p !== platform }),
        h('label', { for: id, text: KANAL[p] })
      ]));
    });
    kanalGrup.appendChild(kanalSira);
    var kanalHata = h('p', { class: 'alan-hata', id: 'yk-kanal-h', role: 'alert' });
    kanalGrup.appendChild(kanalHata);
    if (duzenle) kanalGrup.appendChild(h('p', { class: 'ipucu', text: L('Kanal sonradan değişmez; başka kanal için yeni gönderi ekle.', 'The channel cannot change later; add a new post for another channel.') }));

    // Metin + sayaç (kod noktası)
    var metin = h('textarea', { class: 'kutu yk-metin-kutu', id: 'yk-metin', name: 'metin', rows: '9', 'aria-describedby': 'yk-sayac yk-metin-h', value: job ? job.body : '' });
    var sayac = h('p', { class: 'yk-sayac', id: 'yk-sayac' });
    var metinHata = h('p', { class: 'alan-hata', id: 'yk-metin-h', role: 'alert' });
    var asimDuyuruldu = false;
    function sayacYaz() {
      var n = uzunluk(metin.value), lim = LIMITS[platform];
      sayac.textContent = n + ' / ' + lim + L(' karakter', ' characters');
      sayac.classList.toggle('yk-asim', n > lim);
      if (n > lim && !asimDuyuruldu) { duyur(L('Metin ' + KANAL[platform] + ' için en çok ' + lim + ' karakter olabilir.', 'The text can be at most ' + lim + ' characters for ' + KANAL[platform] + '.')); asimDuyuruldu = true; }
      if (n <= lim) asimDuyuruldu = false;
    }
    metin.addEventListener('input', function () { metin.removeAttribute('aria-invalid'); metinHata.textContent = ''; sayacYaz(); });

    // Görsel bağlantısı
    var gorsel = h('input', { class: 'kutu', type: 'url', id: 'yk-gorsel', name: 'gorsel', inputmode: 'url', autocomplete: 'off', spellcheck: 'false', maxlength: String(MAX_MEDIA), placeholder: 'https://', 'aria-describedby': 'yk-gorsel-i yk-gorsel-h', value: job && job.media_url ? job.media_url : '' });
    var gorselIpucu = h('p', { class: 'ipucu', id: 'yk-gorsel-i' });
    var gorselHata = h('p', { class: 'alan-hata', id: 'yk-gorsel-h', role: 'alert' });
    var gorselEtiket = h('label', { class: 'etiket', for: 'yk-gorsel' });
    function kanalYaz() {
      gorselEtiket.textContent = platform === 'instagram' ? L('Görsel bağlantısı (gerekli)', 'Image link (required)') : L('Görsel bağlantısı (isteğe bağlı)', 'Image link (optional)');
      gorselIpucu.textContent = platform === 'instagram'
        ? L('Instagram gönderisi görselsiz yayınlanamaz. Herkese açık, https ile başlayan bir görsel bağlantısı yapıştır.', 'An Instagram post cannot be published without an image. Paste a public image link that starts with https.')
        : L('LinkedIn metni görselsiz de yayınlanabilir.', 'A LinkedIn post can be published without an image.');
      sayacYaz();
    }
    gorsel.addEventListener('input', function () { gorsel.removeAttribute('aria-invalid'); gorselHata.textContent = ''; });
    kanalSira.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'kanal') { platform = e.target.value; kanalHata.textContent = ''; kanalYaz(); }
    });

    // Gün ve saat
    var z = zamanAlanlari('yk-form', job ? msAl(job.run_at) : (/^\d{4}-\d{2}-\d{2}$/.test(gunOn) ? yerelMs(gunOn, '10:00') : NaN));
    if (!job && /^\d{4}-\d{2}-\d{2}$/.test(gunOn)) { z.gun.value = gunOn; z.saat.value = ''; }
    var zamanGrup = h('fieldset', { class: 'secim-grup yk-zaman-grup' }, [
      h('legend', { text: L('Ne zaman yayınlansın?', 'When should it be published?') }),
      h('p', { class: 'ipucu', text: L('İstanbul saati. Onaya göndermek için gün ve saat gerekli; taslakta boş kalabilir.', 'Istanbul time. A day and time are needed to send for approval; a draft can leave them empty.') }),
      z.kap
    ]);

    var dugmeler = h('div', { class: 'yk-dugmeler' });
    var anaBtn = h('button', { type: 'submit', class: 'btn btn-ana', 'data-eylem': duzenle ? 'kaydet' : 'onaya', text: duzenle ? L('Kaydet', 'Save') : L('Onaya gönder', 'Send for approval') });
    dugmeler.appendChild(anaBtn);
    var taslakBtn = null;
    if (!duzenle) {
      taslakBtn = h('button', { type: 'submit', class: 'btn btn-cizgi', 'data-eylem': 'taslak', text: L('Taslak olarak kaydet', 'Save as draft') });
      dugmeler.appendChild(taslakBtn);
    }
    dugmeler.appendChild(h('a', { class: 'btn btn-metin', href: lnk(duzenle ? 'is=' + job.id : 'liste'), text: L('Vazgeç', 'Cancel') }));

    add(form, [
      kanalGrup,
      h('div', { class: 'alan-k' }, [h('label', { class: 'etiket', for: 'yk-metin', text: L('Gönderi metni', 'Post text') }), metin, sayac, metinHata]),
      h('div', { class: 'alan-k' }, [gorselEtiket, gorsel, gorselIpucu, gorselHata]),
      zamanGrup,
      h('p', { class: 'ipucu', text: L('Gönder dediğinde gönderi önce onayına düşer. Onaylamadan hiçbir şey yayınlanmaz.', 'When you send it, the post first waits for your approval. Nothing is published without it.') }),
      formHata,
      dugmeler
    ]);
    kok.appendChild(form);
    kanalYaz();

    var sonEylem = null;
    [anaBtn, taslakBtn].forEach(function (bt) { if (bt) bt.addEventListener('click', function () { sonEylem = bt.getAttribute('data-eylem'); }); });
    var mesgul = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (mesgul) return;
      var eylem = sonEylem || anaBtn.getAttribute('data-eylem');
      sonEylem = null;
      bosalt(formHata);
      // Doğrulama: ilk yanlış alan işaretlenir ve odaklanır
      var tx = metin.value, n = uzunluk(tx), lim = LIMITS[platform];
      if (!tx.trim()) { metin.setAttribute('aria-invalid', 'true'); metinHata.textContent = L('Gönderi metnini yaz.', 'Write the post text.'); metin.focus(); return; }
      if (n > lim) { metin.setAttribute('aria-invalid', 'true'); metinHata.textContent = L('Metin ' + n + ' karakter; ' + KANAL[platform] + ' için en çok ' + lim + ' karakter olabilir.', 'The text is ' + n + ' characters; ' + KANAL[platform] + ' allows at most ' + lim + '.'); metin.focus(); return; }
      var url = gorsel.value.trim();
      if (url) {
        var gecerli = false;
        try { gecerli = new URL(url).protocol === 'https:' && url.length <= MAX_MEDIA; } catch (er) { gecerli = false; }
        if (!gecerli) { gorsel.setAttribute('aria-invalid', 'true'); gorselHata.textContent = L('https:// ile başlayan geçerli bir bağlantı gir.', 'Enter a valid link that starts with https://.'); gorsel.focus(); return; }
      } else if (platform === 'instagram' && eylem === 'onaya') {
        gorsel.setAttribute('aria-invalid', 'true'); gorselHata.textContent = L('Instagram için görsel bağlantısı gerekli.', 'Instagram needs an image link.'); gorsel.focus(); return;
      }
      var ms = zamanDogrula(z.gun, z.saat, z.hata, eylem === 'onaya');
      if (ms === false) return;
      var runAt = ms == null ? '' : ist(ms).gun + 'T' + ist(ms).saat + ':00+03:00';

      mesgul = true;
      var btn = eylem === 'taslak' ? taslakBtn : anaBtn;
      btn.setAttribute('aria-busy', 'true');
      var istek = duzenle
        ? api('PUT', '/publish/jobs/' + job.id, { body: tx, media_url: url, run_at: runAt })
        : api('POST', '/publish/jobs', { rid: rid, platform: platform, body: tx, media_url: url || null, run_at: runAt || null });
      istek.then(function (res) {
        if (!res.data || !res.data.ok || !res.data.job) return res;
        var j = res.data.job;
        if (duzenle) {
          bekleyenNot = { tur: 'ok', metin: job.state === 'planlandi' ? L('Kaydedildi. Onay düştü; yayınlanması için yeniden onayla.', 'Saved. The approval was removed; approve again to publish.') : L('Kaydedildi.', 'Saved.') };
          return { git: j.id };
        }
        if (eylem !== 'onaya' || j.state !== 'taslak') {
          bekleyenNot = { tur: 'ok', metin: res.data.dup ? L('Bu gönderi zaten kaydedilmişti.', 'This post was already saved.') : L('Taslak kaydedildi. Hazır olduğunda onaya gönder.', 'Draft saved. Send it for approval when it is ready.') };
          return { git: j.id };
        }
        return api('POST', '/publish/jobs/' + j.id + '/submit', {}).then(function (r2) {
          bekleyenNot = r2.data && r2.data.ok
            ? { tur: 'ok', metin: L('Onaya gönderildi. Şimdi aşağıdan onaylarsan seçtiğin saatte yayınlanır.', 'Sent for approval. Approve it below and it is published at the time you picked.') }
            : { tur: 'hata', metin: L('Taslak kaydedildi ama onaya gönderilemedi: ', 'The draft was saved but could not be sent for approval: ') + hataMetni(hataKodu(r2)) };
          return { git: j.id };
        });
      }).then(function (son) {
        mesgul = false;
        btn.removeAttribute('aria-busy');
        if (son && son.git) { git('is=' + son.git); return; }
        var kod = hataKodu(son);
        if (kod === 'not_ready' || kod === 'auth') return sayfaHata(son, tur);
        var alan = { body: metin, too_long: metin, media_url: gorsel, run_at: z.gun }[kod];
        var hataYer = { body: metinHata, too_long: metinHata, media_url: gorselHata, run_at: z.hata }[kod];
        if (alan) { alan.setAttribute('aria-invalid', 'true'); hataYer.textContent = hataMetni(kod); alan.focus(); return; }
        if (kod === 'rid') rid = rastgeleRid();
        add(formHata, h('p', { class: 'bildirim bildirim-hata' }, [hataMetni(kod), kod === 'not_connected' ? ' ' : null,
          kod === 'not_connected' ? h('a', { href: YOL.baglanti, text: L('Hesap bağla', 'Connect account') }) : null]));
        odakla(formHata);
      });
    });
    bitti(b);
  }

  /* ---- Ayrıntı ---- */
  function isYukle(idStr, my, duzenleKip) {
    var id = parseInt(idStr, 10);
    yukleniyor();
    if (!(id > 0)) return sayfaHata({ status: 404, data: { error: 'not_found' } }, my);
    api('GET', '/publish/jobs/' + id).then(function (res) {
      if (my !== tur) return;
      if (!res.data || !res.data.ok || !res.data.job) return sayfaHata(res, my);
      var j = res.data.job;
      if (duzenleKip) {
        if (j.state === 'taslak' || j.state === 'onay_bekliyor' || j.state === 'planlandi') return formGoster(j, '', my);
        bekleyenNot = { tur: 'uyari', metin: L('Bu durumdaki gönderi düzenlenemez.', 'A post in this status cannot be edited.') };
      }
      ayrintiGoster(j, Array.isArray(res.data.events) ? res.data.events : []);
    });
  }
  function yenile(id) { git('is=' + id); }

  function onizleme(j) {
    var lim = LIMITS[j.platform] || 3000, n = uzunluk(j.body);
    var ust = h('div', { class: 'yk-kimlik' }, [
      h('span', { class: 'yk-avatar', 'aria-hidden': 'true' }),
      h('span', { class: 'yk-kimlik-ad' }, [h('strong', { text: L('Hesabın', 'Your account') }), h('span', { class: 'yk-kimlik-alt', text: KANAL[j.platform] })])
    ]);
    var govde = h('p', { class: 'yk-metin', text: j.body || '' });
    var kart;
    if (j.platform === 'instagram') {
      var gorsel = j.media_url
        ? h('div', { class: 'yk-gorsel' }, [h('span', { class: 'yk-gorsel-et', text: L('Görsel', 'Image') }), h('span', { class: 'yk-gorsel-url', text: j.media_url })])
        : h('div', { class: 'yk-gorsel yk-gorsel-yok' }, h('span', { class: 'rozet rozet-uyari', text: L('Görsel gerekli', 'Image required') }));
      kart = h('div', { class: 'yk-onizleme yk-ig' }, [ust, gorsel, govde]);
    } else {
      kart = h('div', { class: 'yk-onizleme yk-li' }, [ust, govde, j.media_url ? h('div', { class: 'yk-gorsel yk-gorsel-genis' }, [h('span', { class: 'yk-gorsel-et', text: L('Görsel', 'Image') }), h('span', { class: 'yk-gorsel-url', text: j.media_url })]) : null]);
    }
    return h('section', { class: 'sheet yk-onizleme-kap', 'aria-labelledby': 'yk-oniz-b' }, [
      h('h3', { id: 'yk-oniz-b', text: L('Önizleme', 'Preview') }),
      kart,
      h('p', { class: 'yk-sayac' + (n > lim ? ' yk-asim' : ''), text: n + ' / ' + lim + L(' karakter', ' characters') }),
      h('p', { class: 'ipucu', text: L('Önizleme yaklaşıktır; ' + KANAL[j.platform] + ' metni farklı kesebilir. Görsel bu sayfada yüklenmez, yalnız bağlantısı gösterilir.', 'The preview is approximate; ' + KANAL[j.platform] + ' may cut the text differently. The image is not loaded on this page; only its link is shown.') })
    ]);
  }

  function kopyalaDugmesi(j) {
    var not = h('p', { class: 'yk-kopya-not', role: 'status' });
    var bt = h('button', {
      type: 'button', class: 'btn btn-cizgi', text: L('Metni kopyala', 'Copy text'), onclick: function () {
        var bitir = function (ok) {
          not.textContent = ok ? L('Metin kopyalandı.', 'Text copied.') : L('Kopyalanamadı; önizlemedeki metni seçip elle kopyala.', 'Could not copy; select the text in the preview and copy it by hand.');
        };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(j.body || '').then(function () { bitir(true); }, function () { bitir(false); });
          else bitir(false);
        } catch (e) { bitir(false); }
      }
    });
    return h('div', { class: 'yk-kopya' }, [bt, not]);
  }

  // İptal / reddet: onay grubu; Vazgeç odağı açan düğmeye geri verir
  function iptalAkis(j, acKelime, soru, evet) {
    var kap = h('div', { class: 'yk-iptal' });
    var acan = h('button', { type: 'button', class: 'btn btn-cizgi yk-tehlike-cizgi', 'aria-expanded': 'false', text: acKelime });
    var grup = h('div', { class: 'bildirim bildirim-uyari yk-blok', role: 'group', 'aria-label': acKelime, hidden: true });
    var hata = h('p', { class: 'alan-hata', role: 'alert' });
    var vazgec = h('button', { type: 'button', class: 'btn btn-cizgi', text: L('Vazgeç', 'Keep it') });
    var evetBtn = h('button', { type: 'button', class: 'btn btn-tehlike', text: evet });
    add(grup, [h('p', { text: soru }), h('div', { class: 'yk-dugmeler' }, [evetBtn, vazgec]), hata]);
    acan.addEventListener('click', function () { grup.hidden = false; acan.setAttribute('aria-expanded', 'true'); vazgec.focus(); });
    vazgec.addEventListener('click', function () { grup.hidden = true; acan.setAttribute('aria-expanded', 'false'); hata.textContent = ''; acan.focus(); });
    evetBtn.addEventListener('click', function () {
      if (evetBtn.getAttribute('aria-busy') === 'true') return;
      evetBtn.setAttribute('aria-busy', 'true');
      api('POST', '/publish/jobs/' + j.id + '/cancel', {}).then(function (res) {
        evetBtn.removeAttribute('aria-busy');
        if (res.data && res.data.ok) { bekleyenNot = { tur: 'ok', metin: L('İptal edildi. Bu gönderi yayınlanmayacak.', 'Cancelled. This post will not be published.') }; return yenile(j.id); }
        var kod = hataKodu(res);
        if (kod === 'not_ready' || kod === 'auth') return sayfaHata(res, tur);
        hata.textContent = hataMetni(kod);
      });
    });
    add(kap, [acan, grup]);
    return kap;
  }

  // Onay bloğu: kutu asla önceden işaretli değil; cümle seçilen zamana göre yeniden yazılır.
  // secenek.retry: yeniden dene (Hemen / Kayıtlı saat / Yeni gün ve saat); secenek.kontrol: kontrol cümlesi eklenir
  var onaySayac = 0;
  function onayBlok(j, secenek) {
    secenek = secenek || {};
    var no = ++onaySayac, onek = 'yk-onay' + no;
    var kayitli = msAl(j.run_at), now = simdi();
    var kayitliGecerli = isFinite(kayitli) && kayitli >= now - PAY_MS && kayitli <= now + MAX_GUN * GUN_MS;
    var secimler = [];
    if (secenek.retry) {
      if (kayitliGecerli && kayitli > now) secimler.push(['kayitli', L('Kayıtlı saatte', 'At the saved time') + ' (' + zamanMetni(kayitli) + ')']);
      secimler.push(['simdi', L('Hemen', 'Right away')]);
      secimler.push(['yeni', L('Yeni gün ve saat', 'New day and time')]);
    } else {
      secimler.push(kayitliGecerli ? ['kayitli', zamanMetni(kayitli)] : ['yeni', L('Yeni gün ve saat', 'New day and time')]);
      if (kayitliGecerli) secimler.push(['yeni', L('Başka gün ve saat', 'Another day and time')]);
    }
    var secili = secimler[0][0];
    var z = zamanAlanlari(onek, kayitliGecerli ? kayitli : NaN);
    var kutu = h('input', { type: 'checkbox', id: onek + '-k', class: 'yk-onay-kutu', 'aria-describedby': onek + '-h' });
    var cumle = h('label', { for: onek + '-k', class: 'yk-cumle' });
    var hata = h('p', { class: 'alan-hata', id: onek + '-h', role: 'alert' });
    function hedefMs() {
      if (secili === 'kayitli') return kayitli;
      if (secili === 'simdi') return null;
      var g = z.gun.value, s = z.saat.value;
      return /^\d{4}-\d{2}-\d{2}$/.test(g) && /^\d{2}:\d{2}$/.test(s) ? yerelMs(g, s) : NaN;
    }
    function cumleYaz() {
      var ms = hedefMs(), k = KANAL[j.platform];
      var on = secenek.kontrol ? L('Gönderinin ' + KANAL_DA[j.platform] + ' yayında olmadığını kontrol ettim. ', 'I checked that the post is not live on ' + k + '. ') : '';
      var zm;
      if (ms === null) zm = L('hemen', 'right away');
      else if (!isFinite(ms)) zm = L('seçeceğim gün ve saatte (İstanbul)', 'on the day and time I pick (Istanbul)');
      else zm = onayZamani(ms);
      cumle.textContent = on + (EN ? 'I approve publishing this text on the ' + k + ' account ' + zm + '.' : 'Bu metnin ' + k + ' hesabında ' + zm + ' yayınlanmasını onaylıyorum.');
    }
    function degisti() { kutu.checked = false; kutu.removeAttribute('aria-invalid'); hata.textContent = ''; cumleYaz(); }
    var kap = h('div', { class: 'yk-onay' });
    if (secimler.length > 1) {
      var sira = h('div', { class: 'secim-sira' });
      secimler.forEach(function (sc) {
        var id = onek + '-' + sc[0];
        sira.appendChild(h('span', { class: 'secim' }, [h('input', { type: 'radio', name: onek + '-z', id: id, value: sc[0], checked: sc[0] === secili }), h('label', { for: id, text: sc[1] })]));
      });
      sira.addEventListener('change', function (e) {
        if (!e.target || e.target.type !== 'radio') return;
        secili = e.target.value; z.kap.hidden = secili !== 'yeni'; degisti();
      });
      kap.appendChild(h('fieldset', { class: 'secim-grup' }, [h('legend', { text: L('Ne zaman?', 'When?') }), sira]));
    }
    z.kap.hidden = secili !== 'yeni';
    [z.gun, z.saat].forEach(function (e) { e.addEventListener('change', degisti); });
    kap.appendChild(z.kap);
    kap.appendChild(h('div', { class: 'yk-onay-sira' }, [kutu, cumle]));
    kap.appendChild(hata);
    kutu.addEventListener('change', function () { kutu.removeAttribute('aria-invalid'); hata.textContent = ''; });
    var btn = h('button', { type: 'button', class: 'btn btn-ana', text: secenek.retry ? L('Onayla ve yeniden dene', 'Approve and retry') : L('Onayla ve planla', 'Approve and schedule') });
    var sonuc = h('div', { class: 'yk-onay-sonuc' });
    kap.appendChild(h('div', { class: 'yk-dugmeler' }, btn));
    kap.appendChild(sonuc);
    cumleYaz();
    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-busy') === 'true') return;
      bosalt(sonuc);
      var govde = {};
      if (secili === 'yeni') {
        var ms = zamanDogrula(z.gun, z.saat, z.hata, true);
        if (ms === false || ms == null) return;
        govde.run_at = ist(ms).gun + 'T' + ist(ms).saat + ':00+03:00';
      } else if (secili === 'simdi') {
        govde.run_at = isoAl(simdi());
      }
      if (!kutu.checked) {
        kutu.setAttribute('aria-invalid', 'true');
        hata.textContent = L('Önce kutuyu işaretleyerek onayla.', 'Tick the box first to approve.');
        kutu.focus();
        return;
      }
      btn.setAttribute('aria-busy', 'true');
      api('POST', '/publish/jobs/' + j.id + (secenek.retry ? '/retry' : '/approve'), govde).then(function (res) {
        btn.removeAttribute('aria-busy');
        if (res.data && res.data.ok && res.data.job) {
          var ms2 = msAl(res.data.job.run_at);
          bekleyenNot = { tur: 'ok', metin: L('Onaylandı. Gönderi ', 'Approved. The post is scheduled for ') + zamanMetni(ms2) + L(' (İstanbul) için planlandı.', ' (Istanbul).') };
          return yenile(j.id);
        }
        var kod = hataKodu(res);
        if (kod === 'not_ready' || kod === 'auth') return sayfaHata(res, tur);
        var p = h('p', { class: 'bildirim bildirim-hata', tabindex: '-1' }, [hataMetni(kod)]);
        if (kod === 'not_connected') add(p, [' ', h('a', { href: YOL.baglanti, text: L('Hesap bağla', 'Connect account') })]);
        if (kod === 'state') add(p, [' ', h('button', { type: 'button', class: 'btn btn-cizgi btn-kucuk', text: L('Yenile', 'Refresh'), onclick: function () { yenile(j.id); } })]);
        if (kod === 'media_url') add(p, [' ', h('a', { href: lnk('duzenle=' + j.id), text: L('Düzenle', 'Edit') })]);
        if (kod === 'run_at' && secili !== 'yeni') {
          var yeniRadyo = kap.querySelector('input[value="yeni"]');
          if (yeniRadyo) { yeniRadyo.checked = true; secili = 'yeni'; z.kap.hidden = false; degisti(); }
        }
        sonuc.appendChild(p);
        odakla(p);
      });
    });
    return kap;
  }

  function ayrintiGoster(j, events) {
    bosalt(kok);
    var ms = isMs(j), kanal = KANAL[j.platform] || j.platform;
    kok.appendChild(h('p', { class: 'yk-geri' }, h('a', { href: lnk('liste'), text: L('← Kuyruğa dön', '← Back to the queue') })));
    var b = h('h2', { tabindex: '-1', class: 'yk-h2', text: (j.platform === 'instagram' ? L('Instagram gönderisi', 'Instagram post') : L('LinkedIn gönderisi', 'LinkedIn post')) + ' · ' + zamanMetni(ms) });
    kok.appendChild(h('div', { class: 'yk-ayrinti-bas' }, [b, h('span', { class: 'yk-satir-son' }, [ornekRozet(), rozet(j.state)])]));
    var not = null;
    if (bekleyenNot) {
      not = h('p', { class: 'bildirim bildirim-' + bekleyenNot.tur, tabindex: '-1', text: bekleyenNot.metin });
      bekleyenNot = null;
      kok.appendChild(not);
    }

    // Eylemler
    var eylem = h('section', { class: 'sheet yk-eylem', 'aria-labelledby': 'yk-eylem-b' }, [h('h3', { id: 'yk-eylem-b', text: L('Ne yapmalı?', 'What next?') })]);
    var igGorselsiz = j.platform === 'instagram' && !j.media_url;
    var duzenleLink = function (metin) { return h('a', { class: 'btn btn-cizgi', href: lnk('duzenle=' + j.id), text: metin || L('Düzenle', 'Edit') }); };
    if (j.state === 'taslak') {
      eylem.appendChild(h('p', { text: L('Taslak: henüz onaya gönderilmedi. Gönderdiğinde onayını bekler; onaylamadan yayınlanmaz.', 'Draft: not sent for approval yet. Once sent it waits for your approval; it is not published without it.') }));
      var gHata = h('p', { class: 'alan-hata', id: 'yk-gonder-h', role: 'alert' });
      var gonder = h('button', { type: 'button', class: 'btn btn-ana', 'aria-disabled': igGorselsiz ? 'true' : null, 'aria-describedby': igGorselsiz ? 'yk-gonder-h' : null, text: L('Onaya gönder', 'Send for approval') });
      if (igGorselsiz) gHata.textContent = L('Instagram için önce görsel bağlantısı ekle (Düzenle).', 'Add an image link first for Instagram (Edit).');
      gonder.addEventListener('click', function () {
        if (gonder.getAttribute('aria-disabled') === 'true') { gHata.textContent = ''; setTimeout(function () { gHata.textContent = L('Instagram için önce görsel bağlantısı ekle (Düzenle).', 'Add an image link first for Instagram (Edit).'); }, 30); return; }
        if (gonder.getAttribute('aria-busy') === 'true') return;
        gonder.setAttribute('aria-busy', 'true');
        api('POST', '/publish/jobs/' + j.id + '/submit', {}).then(function (res) {
          gonder.removeAttribute('aria-busy');
          if (res.data && res.data.ok) { bekleyenNot = { tur: 'ok', metin: L('Onaya gönderildi. Aşağıdan onaylayabilirsin.', 'Sent for approval. You can approve it below.') }; return yenile(j.id); }
          var kod = hataKodu(res);
          if (kod === 'not_ready' || kod === 'auth') return sayfaHata(res, tur);
          gHata.textContent = hataMetni(kod);
        });
      });
      add(eylem, [h('div', { class: 'yk-dugmeler' }, [gonder, duzenleLink()]), gHata,
        iptalAkis(j, L('Taslağı iptal et', 'Cancel draft'), L('Bu taslak iptal edilsin mi? Geri alınamaz.', 'Cancel this draft? This cannot be undone.'), L('İptal et', 'Cancel draft'))]);
    } else if (j.state === 'onay_bekliyor') {
      if (j.last_error === 'account_changed') eylem.appendChild(h('p', { class: 'bildirim bildirim-uyari', text: sonHata('account_changed') + ' ' + L('Yeniden onayla.', 'Approve again.') }));
      eylem.appendChild(h('p', { text: L('Onayını bekliyor. Onaylarsan seçilen saatte yayınlanır; onaylamazsan hiçbir şey yayınlanmaz.', 'Waiting for your approval. If you approve, it is published at the chosen time; otherwise nothing is published.') }));
      if (igGorselsiz) {
        add(eylem, [h('p', { class: 'bildirim bildirim-uyari', text: L('Instagram için görsel bağlantısı gerekli. Önce gönderiyi düzenle.', 'Instagram needs an image link. Edit the post first.') }), h('div', { class: 'yk-dugmeler' }, duzenleLink())]);
      } else {
        eylem.appendChild(onayBlok(j, {}));
        eylem.appendChild(h('div', { class: 'yk-dugmeler' }, duzenleLink()));
      }
      eylem.appendChild(iptalAkis(j, L('Reddet', 'Reject'), L('Bu gönderi reddedilsin mi? İptal edilir ve yayınlanmaz.', 'Reject this post? It is cancelled and will not be published.'), L('Reddet', 'Reject')));
    } else if (j.state === 'planlandi') {
      add(eylem, [
        h('p', { class: 'bildirim bildirim-ok', text: L('Planlandı: ', 'Scheduled: ') + zamanMetni(ms) + L(' (İstanbul). Onaylandı: ', ' (Istanbul). Approved: ') + kisaTarih(msAl(j.approved_at)) + '.' }),
        h('div', { class: 'yk-dugmeler' }, [kopyalaDugmesi(j), duzenleLink(L('Düzenle (onay düşer)', 'Edit (removes approval)'))]),
        iptalAkis(j, L('Planı iptal et', 'Cancel schedule'), L('Bu plan iptal edilsin mi? Gönderi yayınlanmaz; yeniden planlamak için yeni gönderi eklemen gerekir.', 'Cancel this schedule? The post will not be published; to schedule it again you need to add a new post.'), L('İptal et', 'Cancel schedule'))
      ]);
    } else if (j.state === 'yayinlaniyor') {
      add(eylem, [
        h('p', { class: 'bildirim', text: L('Şu an yayınlanıyor. Sonuç birkaç dakika içinde burada görünür.', 'Publishing now. The result appears here within a few minutes.') }),
        h('div', { class: 'yk-dugmeler' }, h('button', { type: 'button', class: 'btn btn-cizgi', text: L('Yenile', 'Refresh'), onclick: function () { yenile(j.id); } }))
      ]);
    } else if (j.state === 'yayinlandi') {
      var urn = /^urn:li:(share|ugcPost|activity):\d+$/.test(j.remote_id || '') ? j.remote_id : null;
      add(eylem, [
        h('p', { class: 'bildirim bildirim-ok', text: L('Yayınlandı.', 'Published.') + (isFinite(msAl(j.updated_at)) ? ' ' + kisaTarih(msAl(j.updated_at)) + '.' : '') }),
        h('div', { class: 'yk-dugmeler' }, [
          urn ? h('a', { class: 'btn btn-cizgi', href: 'https://www.linkedin.com/feed/update/' + urn + '/', target: '_blank', rel: 'noopener noreferrer', text: L('LinkedIn\'de aç', 'Open on LinkedIn') }) : null,
          kopyalaDugmesi(j)
        ])
      ]);
    } else if (j.state === 'basarisiz') {
      var bagla = yenidenBaglaGerek(j.last_error);
      var adimlar = h('ol', { class: 'yk-adimlar' });
      if (bagla) adimlar.appendChild(h('li', null, [L('Hesabını yeniden bağla: ', 'Reconnect your account: '), h('a', { href: YOL.baglanti, text: L('Bağlantılar', 'Connections') })]));
      adimlar.appendChild(h('li', { text: L('Ne zaman yayınlanacağını seç.', 'Choose when it should be published.') }));
      adimlar.appendChild(h('li', { text: L('Yeniden onayla.', 'Approve again.') }));
      add(eylem, [
        h('div', { class: 'bildirim bildirim-hata yk-blok' }, [h('p', { class: 'yk-kalin', text: L('Yayınlanamadı', 'Not published') }), h('p', { text: sonHata(j.last_error) || L('Neden bilinmiyor.', 'Reason unknown.') })]),
        adimlar,
        j.platform === 'instagram' && !j.media_url ? h('p', { class: 'bildirim bildirim-uyari', text: L('Instagram için görsel bağlantısı gerekli; bu gönderi düzenlenemez, yeni gönderi ekle.', 'Instagram needs an image link; this post cannot be edited, add a new post.') }) : onayBlok(j, { retry: true }),
        h('div', { class: 'yk-dugmeler' }, kopyalaDugmesi(j))
      ]);
    } else if (j.state === 'kontrol') {
      var tekrarKap = h('div', { class: 'yk-tekrar', hidden: true });
      var tekrarAc = h('button', { type: 'button', class: 'btn btn-cizgi', 'aria-expanded': 'false', text: L('Yayında değil, yeniden dene', 'Not live, retry') });
      tekrarAc.addEventListener('click', function () {
        if (!tekrarKap.firstChild) tekrarKap.appendChild(onayBlok(j, { retry: true, kontrol: true }));
        tekrarKap.hidden = false; tekrarAc.setAttribute('aria-expanded', 'true');
        odakla(tekrarKap.querySelector('input'));
      });
      var dHata = h('p', { class: 'alan-hata', role: 'alert' });
      var yayinda = h('button', { type: 'button', class: 'btn btn-ana', text: L('Yayında, işaretle', 'It is live, mark it') });
      yayinda.addEventListener('click', function () {
        if (yayinda.getAttribute('aria-busy') === 'true') return;
        yayinda.setAttribute('aria-busy', 'true');
        api('POST', '/publish/jobs/' + j.id + '/done', {}).then(function (res) {
          yayinda.removeAttribute('aria-busy');
          if (res.data && res.data.ok) { bekleyenNot = { tur: 'ok', metin: L('Yayınlandı olarak işaretlendi.', 'Marked as published.') }; return yenile(j.id); }
          var kod = hataKodu(res);
          if (kod === 'not_ready' || kod === 'auth') return sayfaHata(res, tur);
          dHata.textContent = hataMetni(kod);
        });
      });
      add(eylem, [
        h('div', { class: 'bildirim bildirim-uyari yk-blok' }, [
          h('p', { class: 'yk-kalin', text: L('Sonuç belirsiz', 'Result unclear') }),
          h('p', { text: sonHata(j.last_error) || L('Gönderi yayınlanmış olabilir.', 'The post may have been published.') }),
          h('p', { text: L('Önce ' + kanal + ' hesabını kontrol et. Gönderi oradaysa işaretle; yoksa yeniden dene. Kontrol etmeden yeniden denersen gönderi iki kez çıkabilir.', 'Check your ' + kanal + ' account first. If the post is there, mark it; if not, retry. Retrying without checking may publish it twice.') })
        ]),
        h('div', { class: 'yk-dugmeler' }, [yayinda, tekrarAc]),
        dHata,
        tekrarKap
      ]);
    } else if (j.state === 'iptal') {
      add(eylem, [
        h('p', { class: 'bildirim', text: L('İptal edildi. Bu gönderi yayınlanmayacak.', 'Cancelled. This post will not be published.') }),
        h('div', { class: 'yk-dugmeler' }, [kopyalaDugmesi(j), h('a', { class: 'btn btn-metin', href: lnk('yeni'), text: L('Yeni gönderi ekle', 'Add a new post') })])
      ]);
    }

    // Bilgiler
    var dl = h('dl', { class: 'dokum' });
    function satirEkle(dt, dd) { dl.appendChild(h('div', null, [h('dt', { text: dt }), typeof dd === 'string' ? h('dd', { text: dd }) : h('dd', null, dd)])); }
    satirEkle(L('Durum', 'Status'), rozet(j.state));
    satirEkle(L('Kanal', 'Channel'), kanal);
    satirEkle(L('Gün ve saat', 'Day and time'), isFinite(ms) ? zamanMetni(ms) + L(' (İstanbul)', ' (Istanbul)') : L('Seçilmedi', 'Not chosen'));
    if (j.approved_at) satirEkle(L('Onaylandı', 'Approved'), kisaTarih(msAl(j.approved_at)));
    if (j.attempts) satirEkle(L('Deneme', 'Attempts'), String(j.attempts));
    if (j.last_error) satirEkle(L('Son hata', 'Last error'), sonHata(j.last_error));
    if (j.remote_id) satirEkle(L('Gönderi kimliği', 'Post ID'), String(j.remote_id));
    satirEkle(L('Oluşturuldu', 'Created'), kisaTarih(msAl(j.created_at)));
    satirEkle(L('İş no', 'Job no.'), '#' + j.id);
    var bilgi = h('section', { class: 'sheet yk-bilgi', 'aria-labelledby': 'yk-bilgi-b' }, [h('h3', { id: 'yk-bilgi-b', text: L('Bilgiler', 'Details') }), dl]);

    // Geçmiş
    var NOT = {
      created: L('Oluşturuldu', 'Created'), submitted: L('Onaya gönderildi', 'Sent for approval'), edited: L('Düzenlendi', 'Edited'),
      approved: L('Onaylandı', 'Approved'), retry: L('Yeniden denemeye onaylandı', 'Approved for retry'), cancelled: L('İptal edildi', 'Cancelled'),
      user_done: L('Elle yayınlandı olarak işaretlendi', 'Marked as published by hand'), claimed: L('Yayın başladı', 'Publishing started')
    };
    var gec = h('ol', { class: 'yk-gecmis' });
    events.forEach(function (e) {
      var ne = NOT[e.note] || (e.note && e.to_state !== 'yayinlandi' ? sonHata(e.note) : '') ||
        ((e.from_state ? (DURUM_AD[e.from_state] || e.from_state) + ' → ' : '') + (DURUM_AD[e.to_state] || e.to_state || ''));
      gec.appendChild(h('li', null, [
        h('span', { class: 'yk-gecmis-zaman', text: kisaTarih(msAl(e.at)) }),
        h('span', { text: ne + (e.by === 'system' ? L(' (sistem)', ' (system)') : '') })
      ]));
    });
    var gecmisKap = h('section', { class: 'sheet yk-gecmis-kap', 'aria-labelledby': 'yk-gecmis-b' }, [
      h('h3', { id: 'yk-gecmis-b', text: L('Geçmiş', 'History') }),
      events.length ? gec : h('p', { class: 'ipucu', text: L('Kayıt yok.', 'No entries.') })
    ]);

    kok.appendChild(h('div', { class: 'yk-ayrinti' }, [
      h('div', { class: 'yk-sol' }, [onizleme(j)]),
      h('div', { class: 'yk-sag' }, [eylem, bilgi, gecmisKap])
    ]));
    if (not) { kok.removeAttribute('aria-busy'); ilkGorunum = false; odakla(not); duyur(not.textContent); }
    else bitti(b);
  }

  /* ---- Başlat ---- */
  var yuk = $('#yk-yukleniyor');
  if (yuk) yuk.textContent = L('Kuyruk yükleniyor…', 'Loading the queue…');
  window.addEventListener('hashchange', function () { rota(false); });
  rota(true);
})();
