(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('smc-tema');if(t==='dark'||t==='light')r.setAttribute('data-theme',t)}catch(e){}
/* ?tema=koyu|acik (ya da #tema=…) ilk boyamadan önce uygulanır; dark/light da geçer */
var m=/[?&#]tema=(koyu|acik|dark|light)(?![\w-])/.exec(location.search+location.hash);if(m)r.setAttribute('data-theme',m[1]==='koyu'||m[1]==='dark'?'dark':'light')})();
