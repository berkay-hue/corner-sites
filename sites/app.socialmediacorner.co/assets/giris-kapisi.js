/* A15: Stüdyo yalnız kayıtlı kullanıcıya. <head>'de theme.js'ten hemen sonra, eşzamanlı yüklenir; geçerli oturum
   (smc-oturum, sessionStorage ya da localStorage) yoksa sayfa boyanmadan kayıt sayfasına gider, ?r= ile geri döner.
   Örnek (mock) modu — localhost / *.pages.dev + #ornek — kapıdan geçer. Sunucu tarafı: GEN_LOGIN_REQUIRED=1. */
(function(){
  var L=location,h=L.hostname;
  if((/^(localhost|127\.0\.0\.1|\[::1\])$/.test(h)||/\.pages\.dev$/.test(h))&&/(^|&)ornek(=|&|$)/.test(L.hash.slice(1)))return;
  var RE=/^[A-Za-z0-9_-]{43}$/,ok=false;
  ['sessionStorage','localStorage'].some(function(k){try{var v=window[k].getItem('smc-oturum')||'';if(v.charAt(0)==='{')v=JSON.parse(v).token;if(typeof v==='string'&&RE.test(v)){ok=true;return true}}catch(e){}return false});
  if(ok)return;
  var en=/^\/en(\/|$)/.test(L.pathname),yol=L.pathname.replace(/\.html$/,'').replace(/\/index$/,'/');
  try{var kq=new URLSearchParams(L.search).get('konu');if(kq){kq=kq.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,300);if(kq)sessionStorage.setItem('smc-konu',kq);}}catch(e){}
  L.replace((en?'/en/hesap/register':'/hesap/kayit')+'?r='+encodeURIComponent(yol));
})();
