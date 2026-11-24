/* Sales Corner çerez onayı (KVKK).
   Başta her şey reddedilmiş sayılır (sayfa <head> içindeki gtag('consent','default') parçası).
   Google Ads etiketi YALNIZCA "Kabul et" seçildiğinde yüklenir; reddedilirse hiç yüklenmez.
   Tercih tarayıcıda sc_consent anahtarında tutulur. Bandı yeniden açmak için:
   #cerez-ayarlari / #cookie-settings bağlantısı ya da data-cerez-ayar öznitelikli bir öğe. */
(function () {
  var ADS = 'AW-17132829941';
  var KEY = 'sc_consent';
  var EN = /^en/i.test(document.documentElement.lang || '') || location.pathname.indexOf('/en/') === 0;
  var T = EN ? {
    msg: 'We use cookies to measure our ads. Essential storage keeps the site working; anything else runs only if you accept. You can change your choice at any time.',
    pol: 'Cookie Policy', polUrl: '/en/cookie-policy', ok: 'Accept', no: 'Essential only', lbl: 'Cookie preferences'
  } : {
    msg: 'Reklamlarımızı ölçmek için çerez kullanıyoruz. Zorunlu olanlar dışındakiler yalnızca onay verirsen çalışır. Kararını dilediğin zaman değiştirebilirsin.',
    pol: 'Çerez Politikası', polUrl: '/cerez-politikasi', ok: 'Kabul et', no: 'Sadece zorunlu', lbl: 'Çerez tercihleri'
  };

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') window.gtag = function () { window.dataLayer.push(arguments); };

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }

  var loaded = false;
  function loadAds() {
    if (loaded) return; loaded = true;
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ADS;
    document.head.appendChild(s);
    gtag('js', new Date()); gtag('config', ADS);
  }

  var box;
  function build() {
    if (box) return box;
    var st = document.createElement('style');
    st.textContent = '#scCookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483647;max-width:520px;margin:0 auto;background:#0d0e14;color:#ececf1;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:18px 20px;box-shadow:0 12px 40px rgba(0,0,0,.45);font:14px/1.55 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;text-align:left}'
      + '#scCookie p{margin:0 0 14px}#scCookie a{color:#fbbf24;text-decoration:underline}'
      + '#scCookie .b{display:flex;gap:8px;flex-wrap:wrap}#scCookie button{flex:1 1 140px;border-radius:9px;padding:11px 16px;min-height:44px;font:inherit;font-weight:700;cursor:pointer}'
      + '#scCookie .y{background:#fbbf24;color:#0d0e14;border:0}#scCookie .n{background:transparent;color:#ececf1;border:1px solid rgba(255,255,255,.35)}'
      + '#scCookie button:focus-visible{outline:2px solid #fff;outline-offset:2px}#scCookie:focus{outline:none}#scCookie:focus-visible{outline:2px solid #fbbf24;outline-offset:2px}';
    document.head.appendChild(st);
    box = document.createElement('div');
    box.id = 'scCookie'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', T.lbl); box.tabIndex = -1; box.hidden = true;
    box.innerHTML = '<p>' + T.msg + ' <a href="' + T.polUrl + '">' + T.pol + '</a></p>'
      + '<div class="b"><button type="button" class="y" data-c="1">' + T.ok + '</button><button type="button" class="n" data-c="0">' + T.no + '</button></div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-c]');
      if (b) decide(b.getAttribute('data-c') === '1');
    });
    // Escape (odak bandın içindeyken): kayıtlı tercih varsa değiştirmeden kapatır;
    // tercih yoksa "Sadece zorunlu" ile aynı kaydı yapar. Asla kabul sayılmaz.
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && box && !box.hidden && box.contains(document.activeElement)) {
        e.preventDefault(); if (read()) hide(); else decide(false);
      }
    });
    document.body.appendChild(box);
    return box;
  }
  var opener = null;
  // focus=true: kullanıcı açtı (Çerez ayarları bağlantısı / #cerez-ayarlari). Odak bandın kendisine
  // gider (varsayılan olarak "Kabul et"e değil). İlk ziyarette kendiliğinden açılınca odak çalınmaz.
  function show(focus) {
    var b = build();
    if (b.hidden && focus) {
      var a = document.activeElement;
      opener = (a && a !== document.body && a !== document.documentElement && !b.contains(a)) ? a : null;
    }
    b.hidden = false;
    if (focus) { try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }
  }
  function hide() {
    if (!box || box.hidden) return;
    var ae = document.activeElement;
    var had = !ae || ae === document.body || box.contains(ae);
    box.hidden = true;
    var o = opener; opener = null;
    if (had && o && document.contains(o)) { try { o.focus({ preventScroll: true }); } catch (e) { o.focus(); } }
  }

  function decide(ok) {
    var v = ok ? 'granted' : 'denied';
    var c = { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v };
    save(c);
    gtag('consent', 'update', c);
    if (ok) loadAds();
    hide();
  }

  function init() {
    var c = read();
    if (c && c.ad_storage === 'granted') loadAds();
    if (!c) show();
    function hash() { if (location.hash === '#cerez-ayarlari' || location.hash === '#cookie-settings') show(true); }
    hash(); window.addEventListener('hashchange', hash);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-cerez-ayar]');
      if (a) { e.preventDefault(); show(true); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
