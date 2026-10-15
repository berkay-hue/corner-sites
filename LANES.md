# Corner Sites: şeritler

Claude Code sidebar'ındaki **"Corner Sites"** grubunda her site için ayrı bir oturum (şerit) açılır. Koordinatör şerit **"Corner Sites: Ana"** oturumudur.

| Şerit | Site | Günlük blog (UTC) | Dil |
|---|---|---|---|
| Corner Sites: Ana | koordinasyon, ortak dosyalar | – | – |
| Corner Sites A | saascorner.co | 07 | tr |
| Corner Sites B | socialmediacorner.co | 08 | tr |
| Corner Sites C | cornergroup.co | 09 | tr |
| Corner Sites D | salescorner.co | 11 | tr |
| Corner Sites E | yalcinberkay.com.tr | 10 (en), 12 (`/tr`) | en, tr |
| Corner Sites F | brandcorner.co | 14 | en |
| Corner Sites G | wishceo.com | 13 | tr |

## Yeni şerit açma

1. Yeni bir oturum aç ve klasör olarak `/Users/berkayyalcin/corner-sites` seç.
2. Aşağıdaki mesajı ilk mesaj olarak yapıştır. Harf ve site adını değiştir.
3. Oturumu "Corner Sites" grubuna taşı. Ana'dan da taşımasını isteyebilirsin.

## İlk mesaj şablonu

```
Bu oturumun adı "Corner Sites <HARF>: <SITE>". Sadece bu site üzerinde çalışırsın.
Repo: /Users/berkayyalcin/corner-sites (berkay-hue/corner-sites).
Dosyalar: sites/<SITE>, templates/<SITE>, content/<SITE>/blog.
Blog düzeni: blog-worker/wrangler.toml SITES içindeki "hour" ayarına göre blog-daily.yml her gün yazı üretiyor, sonra blog-deploy.yml host bazında Cloudflare Pages'e (web-<ad>) deploy ediyor.
Push etmeden önce: git -C /Users/berkayyalcin/corner-sites pull -q --rebase --autostash (bot da commit atıyor).
Kurallar:
- API key, token veya şifre kullanmak ve girmek yasak. Secret gerekirse komutu hazırla, Berkay çalıştırır.
- rm ve cd && zinciri kullanma. Docker açma.
- saascorner-sdr, saascorner-crm ve "deneme" hesabına dokunma.
- Başka sitenin dosyalarını değiştirme. Ortak dosyalarda (tools/, blog-worker/, .github/) değişiklik gerekirse önce Ana'ya sor.
Şimdilik sadece bekle. Görevi Berkay ya da Ana verecek.
```

## Site notları

- **brandcorner.co (F):** Günlük yazılar açık (14 UTC). Domain'in DNS kaydı GoDaddy'de ve Vercel'e yönleniyor. Bu yüzden yazılar şimdilik sadece web-brandcorner.pages.dev adresinde görünüyor.
- **yalcinberkay.com.tr (E):** Kanonik adres `https://www.yalcinberkay.com.tr`. Yazılar İngilizce.
- **wishceo.com (G):** Tüketici oyunu (`audience: "consumer"`). Yazılarda `GROUP` firma linkleri ve Apollo linki yok. Yayın sadece corner-sites main + CI ile yapılır, Cloudflare dashboard'dan elle yükleme yapılmaz. `app.js` değişince index.html'deki `?v=` numarasını artır.
- **Firmalar arası linkler:** blog-worker/src/index.js içindeki `GROUP` listesinde tanımlı. Apollo referans linki her yazıda en fazla bir kez geçer ve sadece prospecting/outbound konularında kullanılır.
