(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('smc-tema');if(t==='dark'||t==='light')r.setAttribute('data-theme',t)}catch(e){}
/* A11-2: masaüstünde daraltılmış ray tercihi ilk boyamadan önce */
try{if(localStorage.getItem('smc-ray')==='dar')r.classList.add('ray-dar')}catch(e){}
/* ?tema=koyu|acik (ya da #tema=…) ilk boyamadan önce uygulanır; dark/light da geçer */
var m=/[?&#]tema=(koyu|acik|dark|light)(?![\w-])/.exec(location.search+location.hash);if(m)r.setAttribute('data-theme',m[1]==='koyu'||m[1]==='dark'?'dark':'light');
/* A11-2: ortak panel davranışı (logo, hamburger, Corner Group bandı) — tek kez */
if(!document.querySelector('script[src="/assets/panel.js"]')){var s=document.createElement('script');s.src='/assets/panel.js';s.defer=true;(document.head||r).appendChild(s)}})();
