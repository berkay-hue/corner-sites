/* Planlar sayfası: Aylık/Yıllık seçici. JS yoksa seçici gizli kalır; aylık fiyat ve aylık "Satın al" bağlantısı görünür. */
(function () {
  var gruplar = document.querySelectorAll('[data-pl-donem]');
  if (!gruplar.length) return;
  var sec = function (d) {
    [].forEach.call(document.querySelectorAll('[data-donem]'), function (el) { el.hidden = el.getAttribute('data-donem') !== d; });
    [].forEach.call(document.querySelectorAll('[data-pl-donem] [data-secim]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-secim') === d)); });
  };
  [].forEach.call(gruplar, function (g) {
    g.hidden = false;
    g.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-secim]') : null;
      if (b) sec(b.getAttribute('data-secim'));
    });
  });
})();
