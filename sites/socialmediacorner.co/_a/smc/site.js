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
/* A10d iletişim: form[data-sk-form] → corner-forms /submit (JSON). Form data-sk-noform da taşır; dist.mjs genel
   forms-client'ı bu sayfaya eklemez. Alanlar: [data-sk-label] (anahtar = öznitelik değeri), honeypot: [data-sk-hp],
   durum satırı: [data-sk-status]. Metin dili <html lang>'dan. */
(function () {
  var forms = document.querySelectorAll('form[data-sk-form]');
  if (!forms.length) return;
  var END = 'https://corner-forms.berkay-999.workers.dev/submit';
  var en = /^en/i.test(document.documentElement.lang || '');
  var T = en ? {
    sending: 'Sending…',
    rate: 'Too many messages in a short time. Please try again in a few minutes.',
    net: 'We couldn’t reach the server. Check your connection and try again.',
    fail: 'Your message couldn’t be sent. Please try again.',
    mail: function (m) { return ' You can also email us at ' + m + '.'; },
    okTitle: 'Thank you, your message is in.',
    okText: 'We usually reply within one business day, to the email address you gave us.',
    again: 'Send another message'
  } : {
    sending: 'Gönderiliyor…',
    rate: 'Kısa sürede çok fazla gönderim yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.',
    net: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
    fail: 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.',
    mail: function (m) { return ' Dilerseniz ' + m + ' adresine de yazabilirsiniz.'; },
    okTitle: 'Teşekkürler, mesajınız bize ulaştı.',
    okText: 'Genellikle 1 iş günü içinde, verdiğiniz e-posta adresine dönüş yapıyoruz.',
    again: 'Yeni mesaj gönder'
  };
  [].forEach.call(forms, function (f) {
    var btn = f.querySelector('[type=submit]');
    var status = f.querySelector('[data-sk-status]');
    var label = btn ? btn.textContent : '';
    var mail = f.getAttribute('data-sk-mail');
    var busy = false, done = null;
    var say = function (msg, kind) {
      if (!status) return;
      status.textContent = msg;
      status.className = status.className.replace(/\s*is-(err|wait)/g, '') + (kind ? ' is-' + kind : '');
    };
    var reset = function () {
      busy = false;
      f.removeAttribute('aria-busy');
      if (btn) { btn.disabled = false; btn.textContent = label; }
    };
    var thanks = function () {
      f.reset();
      say('');
      if (!done) {
        done = document.createElement('div');
        done.className = 'cform__done';
        done.setAttribute('tabindex', '-1');
        var h = document.createElement('p'); h.className = 'cform__done-t'; h.textContent = T.okTitle;
        var p = document.createElement('p'); p.textContent = T.okText;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn--ghost'; b.textContent = T.again;
        b.addEventListener('click', function () {
          done.hidden = true; f.hidden = false;
          var first = f.querySelector('[data-sk-label]'); if (first) first.focus();
        });
        done.appendChild(h); done.appendChild(p); done.appendChild(b);
        f.parentNode.insertBefore(done, f.nextSibling);
      }
      f.hidden = true; done.hidden = false;
      done.focus();
    };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var els = f.querySelectorAll('[data-sk-label]');
      [].forEach.call(els, function (el) { if (!el.value.trim()) el.value = ''; });
      if (f.reportValidity ? !f.reportValidity() : (f.checkValidity && !f.checkValidity())) return;
      var fields = [];
      [].forEach.call(els, function (el) {
        var v = el.value.trim();
        if (v) fields.push([el.getAttribute('data-sk-label'), v]);
      });
      if (!fields.length) return;
      var hp = f.querySelector('[data-sk-hp]');
      busy = true;
      f.setAttribute('aria-busy', 'true');
      if (btn) { btn.disabled = true; btn.textContent = T.sending; }
      say(T.sending, 'wait');
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, 20000) : 0;
      fetch(END, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ page: location.pathname || '/', fields: fields, hp: hp ? hp.value : '' }),
        signal: ctl ? ctl.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          if (res.status === 429) throw new Error('rate');
          if (!res.ok || !j || !j.ok) throw new Error('fail');
        });
      }, function () { throw new Error('net'); })
        .then(function () { clearTimeout(timer); reset(); thanks(); })
        .catch(function (err) {
          clearTimeout(timer);
          reset();
          var k = err && /^(rate|net|fail)$/.test(err.message) ? err.message : 'fail';
          say(T[k] + (mail && k !== 'rate' ? T.mail(mail) : ''), 'err');
        });
    });
  });
})();
/* A11 çerez/KVKK bandı: site yalnız zorunlu çerez kullanır (analitik/izleyici yok). Seçim localStorage 'smc-ck'
   ('all' | 'ess'); depolama yoksa bant her sayfada yeniden görünür. Alt bilgiye "Çerez tercihleri" düğmesi ekler.
   Çerez Politikası ayrı sayfa değil, KVKK/Privacy sayfasındaki bölüm: /kvkk#cerez, /en/privacy#cookies.
   O bölümdeki [data-ck-open] düğmeleri (JS'siz gizli) bandı yeniden açar. */
(function () {
  var KEY = 'smc-ck';
  var en = /^en/i.test(document.documentElement.lang || '');
  var T = en ? {
    label: 'Cookie notice',
    pre: 'Our site uses only the cookies strictly necessary for it to work. I have read and understood the ',
    links: [['Privacy Notice', '/en/privacy'], ' and the ', ['Cookie Policy', '/en/privacy#cookies']], post: ', and I accept.',
    yes: 'I accept', ess: 'Essential only', open: 'Cookie preferences'
  } : {
    label: 'Çerez bildirimi',
    pre: 'Sitemiz yalnızca çalışması için gerekli zorunlu çerezleri kullanır. ',
    links: [['KVKK Aydınlatma Metni', '/kvkk'], ' ve ', ['Çerez Politikası', '/kvkk#cerez']], post: '’nı okudum, anladım, kabul ediyorum.',
    yes: 'Kabul ediyorum', ess: 'Yalnız zorunlu', open: 'Çerez tercihleri'
  };
  var get = function () { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } };
  var set = function (v) { try { window.localStorage.setItem(KEY, v); } catch (e) { /* depolama kapalı */ } };
  var bar = null;
  var build = function () {
    bar = document.createElement('div');
    bar.className = 'ckb';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', T.label);
    var p = document.createElement('p');
    p.appendChild(document.createTextNode(T.pre));
    T.links.forEach(function (l) {
      if (typeof l === 'string') { p.appendChild(document.createTextNode(l)); return; }
      var a = document.createElement('a'); a.href = l[1]; a.textContent = l[0]; p.appendChild(a);
    });
    p.appendChild(document.createTextNode(T.post));
    var btns = document.createElement('div'); btns.className = 'ckb__btns';
    var mk = function (txt, cls, val) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls; b.textContent = txt;
      b.addEventListener('click', function () { set(val); bar.hidden = true; });
      return b;
    };
    btns.appendChild(mk(T.ess, 'btn--ghost', 'ess'));
    btns.appendChild(mk(T.yes, 'btn--primary', 'all'));
    bar.appendChild(p); bar.appendChild(btns);
    document.body.appendChild(bar);
  };
  var show = function () { if (!bar) build(); bar.hidden = false; };
  if (!get()) show();
  var reopen = function () { show(); var f = bar.querySelector('button'); if (f) f.focus(); };
  var meta = document.querySelector('.ftr__meta');
  if (meta) {
    var o = document.createElement('button'); o.type = 'button'; o.className = 'ckb-open'; o.textContent = T.open;
    o.addEventListener('click', reopen);
    meta.appendChild(o);
  }
  [].forEach.call(document.querySelectorAll('[data-ck-open]'), function (b) {
    b.hidden = false;
    b.addEventListener('click', reopen);
  });
})();
