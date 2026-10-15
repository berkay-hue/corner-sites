// Ana sayfadaki "Blog'dan" bölümü: /_blog-index.json'daki son 3 yazı (corner-sites build-blog üretir)
(() => {
  const sec = document.querySelector(".blog-latest"), list = document.getElementById("blog-latest");
  if (!sec || !list) return;
  const fmt = d => { try { return new Date(d + "T00:00:00Z").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); } catch { return d; } };
  fetch("/_blog-index.json", { headers: { accept: "application/json" } })
    .then(r => r.ok ? r.json() : [])
    .then(posts => {
      posts = Array.isArray(posts) ? posts.filter(p => p && /^[a-z0-9-]+$/.test(p.slug) && p.title).slice(0, 3) : [];
      if (!posts.length) return;
      for (const p of posts) {
        const li = document.createElement("li"), a = document.createElement("a"), m = document.createElement("span"), t = document.createElement("span");
        a.href = "/blog/" + p.slug;
        m.className = "bl-m"; m.textContent = [p.category, p.date && fmt(p.date)].filter(Boolean).join(" · ");
        t.className = "bl-t"; t.textContent = p.title;
        a.append(m, t); li.append(a); list.append(li);
      }
      sec.hidden = false;
    })
    .catch(() => {});
})();
