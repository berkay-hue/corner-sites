/* Social Media Corner — site.js (A10a): yapışkan başlık gölgesi + mobil menü. */
(function () {
  var hdr = document.querySelector('.hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 4); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  // Blog sayfaları: derleyicinin eklediği dil kutusundaki karşılık sayfayı başlık/menü/alt bilgi anahtarlarına taşı
  var alt = document.querySelector('.sk-lang a[hreflang]:not([aria-current])');
  if (alt) {
    var href = alt.getAttribute('href');
    [].forEach.call(document.querySelectorAll('.hdr__end>.lang,.mnav__lang a,.ftr__lang a'), function (a) { a.setAttribute('href', href); });
  }
  var menu = document.querySelector('.mnav');
  if (!menu) return;
  var sum = menu.querySelector('summary');
  var sync = function () { sum.setAttribute('aria-expanded', menu.open ? 'true' : 'false'); };
  var close = function () { if (menu.open) { menu.open = false; } };
  sync();
  menu.addEventListener('toggle', sync);
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.open) { close(); sum.focus(); }
  });
  document.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) close(); });
  var mq = window.matchMedia('(min-width: 1140px)');
  var onMq = function () { if (mq.matches) close(); };
  if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
})();
