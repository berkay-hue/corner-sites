// Framer runtime atıldığı için formlar kendi başına gönderilmez (sayfa ?Name=... ile yeniden yüklenir).
// dist.mjs bu dosyayı form içeren her sayfaya satır içi ekler; gönderim corner-forms Worker'ına gider.
// data-sk-noform taşıyan formlara dokunulmaz.
(function () {
  var END = "https://corner-forms.berkay-999.workers.dev/submit";
  var tr = !/^en/i.test(document.documentElement.lang || "");
  var T = tr ? { wait: "Gönderiliyor…", ok: "Teşekkürler! Mesajınız alındı.", err: "Gönderilemedi, tekrar deneyin." }
    : { wait: "Sending…", ok: "Thank you! Message received.", err: "Could not send, please try again." };
  function hidden(el) { return el.getAttribute("tabindex") === "-1" && (el.type === "text" || !el.type); }
  function labelOf(el) {
    var l = el.id && document.querySelector('label[for="' + el.id + '"]') || el.closest("label");
    if (!l && el.parentElement) l = el.parentElement.querySelector("label");
    if (!l) return "";
    // Etiket alanı sarıyorsa seçenek/değer metni karışmasın
    l = l.cloneNode(true);
    [].forEach.call(l.querySelectorAll("select,option,input,textarea"), function (x) { x.remove(); });
    return l ? l.textContent.replace(/\*|virgülle ayırın|rapor linki gönderilir/g, "").replace(/\s+/g, " ").trim() : "";
  }
  function textNode(b) {
    var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (n.data.trim()) return n;
    return b.appendChild(document.createTextNode(""));
  }
  function bind(f) {
    if (f.hasAttribute("data-sk-noform") || f.__sk) return;
    f.__sk = 1;
    f.addEventListener("submit", function (e) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (f.__busy) return;
      if (f.reportValidity && !f.reportValidity()) return;
      var els = [].slice.call(f.querySelectorAll("input,textarea,select")), names = {}, hp = "", fields = [];
      els.forEach(function (el) { if (el.name) names[el.name] = (names[el.name] || 0) + 1; });
      els.forEach(function (el) {
        if (el.type === "submit" || el.type === "button") return;
        if (hidden(el)) { hp += el.value; return; }
        var k = labelOf(el) || (el.name && names[el.name] === 1 ? el.name : "") || (el.type === "email" ? (tr ? "E-posta" : "Email") : "") || el.placeholder || el.name || el.type;
        var v = el.type === "checkbox" ? (el.checked ? (tr ? "Evet" : "Yes") : (tr ? "Hayır" : "No"))
          : el.tagName === "SELECT" ? (el.options[el.selectedIndex] || {}).text || el.value : el.value;
        fields.push([k, v]);
      });
      var b = f.querySelector('button[type=submit],button:not([type]),input[type=submit]'), t = b && textNode(b), orig = t && t.data;
      function say(s, back) { if (t) { t.data = s; if (back) setTimeout(function () { t.data = orig; }, 6000); } }
      f.__busy = 1; say(T.wait);
      fetch(END, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ page: location.pathname, fields: fields, hp: hp }) })
        .then(function (r) { return r.json(); })
        .then(function (r) { if (!r.ok) throw 0; f.reset(); say(T.ok, 1); })
        .catch(function () { say(T.err, 1); })
        .then(function () { f.__busy = 0; });
    }, true);
  }
  function go() { [].forEach.call(document.forms, bind); }
  document.readyState === "loading" ? addEventListener("DOMContentLoaded", go) : go();
})();
