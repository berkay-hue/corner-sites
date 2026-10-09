# Corner Blog Writer (Cloudflare Worker)

n8n'deki "Cornergroup Blog Generator" akışının ücretsiz karşılığı. Her gün 12:00'de (TR) bir yazı üretir.

1. Yayındaki `/_blog-index.json` okunur: mevcut slug'lar, son 10 başlık, kategori dağılımı ve kullanılmış görseller.
2. **Claude Haiku** konuyu seçer ve JSON döndürür: `{topic, category, slug}`.
3. **Claude Opus** makaleyi markdown olarak yazar. Eski "Bölüm 1:" iskeleti kullanılmaz.
4. **Pexels**'ten daha önce kullanılmamış yatay bir görsel seçilir.
5. Yazı `content/cornergroup.co/blog/<slug>.md` olarak `berkay-hue/corner-sites` deposuna commit edilir. GitHub Action (`.github/workflows/blog-deploy.yml`) siteyi build edip Cloudflare Pages'e yükler; yazı 2-3 dakikada yayına çıkar. Liste, sitemap ve "Load More" kendiliğinden güncellenir.
6. İstenirse Telegram bildirimi gönderilir.

Airtable, Render ve Framer artık gerekmiyor. Kaynak, GitHub'daki md dosyaları.

## Maliyet
- Cloudflare Workers ücretsiz planı: Cron dahil, günde 100k istek.
- Claude API: günde 1 yazı (Haiku konu + Opus makale), kullanım başına ücretlendirilir.
- GitHub Actions: özel depoda ayda 2000 dakika ücretsiz; her deploy ~2 dk.
- Pexels ücretsiz.

## Kurulum (canlıya alırken, Berkay yapacak)
```bash
cd blog-worker
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY   # console.anthropic.com > API Keys
npx wrangler secret put PEXELS_API_KEY      # YENİ anahtar
npx wrangler secret put GITHUB_TOKEN        # fine-grained token: yalnızca bu repo, Contents: Read & Write
npx wrangler secret put RUN_KEY             # elle tetikleme için rastgele uzun bir parola
# opsiyonel bildirim:
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler deploy
```
GitHub deposunda (Settings > Secrets > Actions) `CLOUDFLARE_API_TOKEN` olmalı: Cloudflare > My Profile > API Tokens > "Cloudflare Pages: Edit" yetkili token. `CLOUDFLARE_ACCOUNT_ID` eklendi.

## Test
- Önizleme (commit etmez): `https://corner-blog-writer.<hesap>.workers.dev/run?key=<RUN_KEY>&dry=1`
- Hemen bir yazı yayınlamak için: aynı adrese `&dry=1` eklemeden gidin.
- Yerelde: `npm run dev`, ardından `curl "http://localhost:8787/__scheduled"`.

## Yeni site eklemek
`wrangler.toml` içindeki `SITES` listesine bir kayıt ekleyin. Sitenin `tools/blog.config.mjs` içinde de kaydı olmalı.

## Canlıya geçişte
n8n'deki workflow'u **kapatın**. Kapatmazsanız aynı gün iki yazı çıkar.
