// Brand Corner hesap ve panel istemcisi (giris, login, kayit, register, panel): API adresi, oturum anahtarı ve hata metinleri tek yerde.
// Sözleşme: form-worker/src/platform.js. Her hata {ok:false, error:"<kod>"} döner; kodların metni aşağıdaki M sözlüğündedir.
(function () {
  // corner-forms Worker'ı; localhost'ta yerel wrangler dev (8799, DEV_ORIGINS http://localhost:8788)
  var LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  var API = LOCAL ? "http://localhost:8799/" : "https://corner-forms.berkay-999.workers.dev/";
  var K = "bc-token", LK = "brand-corner-lang", S = ["localStorage", "sessionStorage"];
  var M = {
    tr: {
      origin: "Bu istek bu siteden kabul edilmedi.",
      size: "Gönderilen metin çok uzun.",
      json: "İstek okunamadı. Sayfayı yenileyip tekrar deneyin.",
      auth: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
      not_found: "Kayıt bulunamadı ya da artık erişilemiyor.",
      server: "Sunucuda bir sorun oluştu. Lütfen biraz sonra tekrar deneyin.",
      name: "Adınızı girin (en fazla 100 karakter).",
      email: "Geçerli bir e-posta adresi girin.",
      password: "Şifre 8–200 karakter olmalı.",
      role: "Hesap türünü seçin: Marka, Influencer ya da Ajans.",
      rate: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.",
      exists: "Bu e-posta adresiyle zaten bir hesap var.",
      missing: "E-posta ve şifrenizi girin.",
      invalid: "E-posta veya şifre hatalı.",
      forbidden: "Bu işlem hesap türünüz için kullanılamıyor.",
      limit: "Bu işlem için sınıra ulaştınız.",
      title: "Kampanya başlığını girin (en fazla 120 karakter).",
      budget: "En düşük bütçe en yüksek bütçeden büyük olamaz.",
      status: "Bu durum değişikliği şu anda yapılamıyor. Sayfayı yenileyin.",
      content_url: "İçerik bağlantısı http:// ya da https:// ile başlamalı.",
      net: "Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.",
      store: "Tarayıcınız oturum bilgisini saklamaya izin vermiyor. Gizli pencere dışında tekrar deneyin.",
      err: "Bir sorun oluştu. Lütfen tekrar deneyin."
    },
    en: {
      origin: "This request was not accepted from this site.",
      size: "The text you sent is too long.",
      json: "The request couldn't be read. Refresh the page and try again.",
      auth: "Your session has ended. Please log in again.",
      not_found: "Not found, or no longer available.",
      server: "Something went wrong on our side. Please try again shortly.",
      name: "Enter your name (up to 100 characters).",
      email: "Enter a valid email address.",
      password: "Password must be 8–200 characters.",
      role: "Choose an account type: Brand, Influencer or Agency.",
      rate: "Too many attempts. Please try again later.",
      exists: "An account with this email already exists.",
      missing: "Enter your email and password.",
      invalid: "Incorrect email or password.",
      forbidden: "This action isn't available for your account type.",
      limit: "You've reached the limit for this action.",
      title: "Enter a campaign title (up to 120 characters).",
      budget: "Minimum budget can't be greater than maximum budget.",
      status: "This status change isn't possible right now. Refresh the page.",
      content_url: "The content link must start with http:// or https://.",
      net: "Couldn't reach the server. Check your connection and try again.",
      store: "Your browser isn't allowing the session to be stored. Try again outside a private window.",
      err: "Something went wrong. Please try again."
    }
  };

  // Dil sitenin geri kalanıyla ortak anahtarda (brand-corner-lang) tutulur. Yalnız dil düğmesi (setLang) kaydeder;
  // sayfa ya da hesap dili (useLang) yalnız bellekte kalır (privacy §9).
  var cur = null;
  function lang() {
    if (cur) return cur;
    try { var v = localStorage.getItem(LK); if (v === "tr" || v === "en") return v; } catch (e) {}
    return "en";
  }
  function useLang(l) { cur = l === "tr" ? "tr" : "en"; }
  function setLang(l) { useLang(l); try { localStorage.setItem(LK, cur); } catch (e) {} }

  // "Beni hatırla" işaretliyse localStorage, değilse sessionStorage
  function token() { for (var i = 0; i < S.length; i++) { try { var v = window[S[i]].getItem(K); if (v) return v; } catch (e) {} } return null; }
  function save(t, keep) {
    try { (keep ? localStorage : sessionStorage).setItem(K, t); (keep ? sessionStorage : localStorage).removeItem(K); } catch (e) {}
    return token() === t;
  }
  function clear() { for (var i = 0; i < S.length; i++) { try { window[S[i]].removeItem(K); } catch (e) {} } }
  function toLogin() { location.replace(lang() === "tr" ? "/giris" : "/login"); }

  // İstek: başarıda yanıt gövdesi, hatada {code, status} taşıyan Error. 401 "auth" oturumu siler; BC.guard açıksa girişe döner.
  function call(method, path, body) {
    var h = {}, t = token(), o = { method: method, headers: h };
    if (t && !/^auth\/(login|register)$/.test(path)) h.authorization = "Bearer " + t;
    if (body !== undefined) { h["content-type"] = "application/json"; o.body = JSON.stringify(body); }
    return fetch(API + path, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.ok && d && d.ok) return d;
        var e = new Error("api");
        e.status = r.status;
        e.code = (d && typeof d.error === "string" && d.error) || (r.status === 401 ? "auth" : r.status >= 500 ? "server" : "err");
        throw e;
      });
    }, function () {
      var e = new Error("net"); e.code = "net"; e.status = 0; throw e;
    }).catch(function (e) {
      if (e.code === "auth") { clear(); if (BC.guard) toLogin(); }
      throw e;
    });
  }

  // Bağlama özel metin (ör. giriş sayfasında "rate") over[kod] ile verilir
  function msg(code, over) { var m = M[lang()]; return (over && over[code]) || m[code] || m.err; }

  // Çıkış: oturum önce tarayıcıdan silinir, sunucu kaydı en çok 4 sn beklenir
  function logout() {
    var t = token();
    clear();
    if (!t) return toLogin();
    var p = fetch(API + "auth/logout", { method: "POST", headers: { authorization: "Bearer " + t } }).catch(function () {});
    Promise.race([p, new Promise(function (r) { setTimeout(r, 4000); })]).then(toLogin);
  }

  var BC = { api: API, guard: false, lang: lang, useLang: useLang, setLang: setLang, token: token, save: save, clear: clear, toLogin: toLogin, call: call, msg: msg, logout: logout };
  window.BC = BC;
})();
