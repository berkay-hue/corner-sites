-- app.socialmediacorner.co otomatik blog yazarı: müşteri sitesine (CMS) anahtar/OAuth ile bağlanma (src/cms.js, src/cms-providers.js; A14).
-- 0018_plans.sql'den sonra uygulanır (numara PR açılırken o anki origin/main'e göre doğrulanmalı).
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- Uygulanmadan: /app/cms* uçları 503 not_ready döner, cmsTick tablo yok hatasını yutar (CMS_ENABLED="0" iken hiç sorgu yok).
-- Yalnız CREATE … IF NOT EXISTS; tekrar çalıştırmak zararsız.

-- Bağlı müşteri siteleri. config gizli olmayan JSON (seçilen koleksiyon/blog/yazar, kök URL…). secret_box: oauth.js encrypt ile
-- şifreli JSON (anahtarlar); token_box: kısa ömürlü erişim token önbelleği (şifreli). hint: anahtarın son 4 karakteri (yanıtta tek iz).
-- Bağlantı kaldırılınca secret_box/token_box NULL, state 'kaldirildi' (yazı kayıtları kullanıcıda görünür kalır).
CREATE TABLE IF NOT EXISTS cms_sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('wordpress','webflow','ghost','shopify','hubspot','wix','github','ideasoft','wpcom')),
  label TEXT,
  base_url TEXT,
  config TEXT,
  secret_box TEXT,
  token_box TEXT,
  hint TEXT,
  state TEXT NOT NULL DEFAULT 'aktif' CHECK (state IN ('aktif','duraklatildi','hata','kaldirildi')),
  last_error TEXT,
  auto_publish INTEGER NOT NULL DEFAULT 0,
  per_week INTEGER NOT NULL DEFAULT 1 CHECK (per_week BETWEEN 1 AND 3),
  days TEXT NOT NULL DEFAULT '[2]',
  hour INTEGER NOT NULL DEFAULT 10 CHECK (hour BETWEEN 0 AND 23),
  lang TEXT NOT NULL DEFAULT 'tr',
  length TEXT NOT NULL DEFAULT 'medium',
  tone TEXT,
  brief TEXT,
  topics TEXT,
  next_run_at TEXT,
  lease_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS cms_sites_due ON cms_sites (state, next_run_at);
CREATE INDEX IF NOT EXISTS cms_sites_user ON cms_sites (user_id);

-- Üretilen yazılar. slot: planlanan çalışma zamanı ('YYYY-MM-DD HH:MM:SS' UTC) ya da 'manual:<rid>' → UNIQUE ile çift üretim yok.
-- charged: 1 iken gen_month lb + gen_usage u kotası düşülmüş demektir (LLM hatasında iade edilip 0 yapılır). month: düşülen ay; day: gen_usage u
-- rezervasyonunun İstanbul günü (iade sonraki cron turunda olsa da aynı güne yapılır).
-- markdown 90 gün sonra boşaltılır (cmsPurge). state 'kota': kota dolu olduğu için üretilmedi (kullanıcıya açıklama).
CREATE TABLE IF NOT EXISTS cms_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cms_site_id INTEGER NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  title TEXT,
  slug TEXT,
  markdown TEXT,
  cover_url TEXT,
  cover_credit TEXT,
  state TEXT NOT NULL DEFAULT 'uretiliyor' CHECK (state IN ('uretiliyor','hazir','gonderiliyor','gonderildi','yayinlandi','basarisiz','kota','iptal')),
  mode TEXT NOT NULL DEFAULT 'draft' CHECK (mode IN ('draft','publish')),
  charged INTEGER NOT NULL DEFAULT 0,
  month TEXT,
  day TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_try_at TEXT,
  lease_until TEXT,
  remote_id TEXT,
  remote_url TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (cms_site_id, slot)
);
CREATE INDEX IF NOT EXISTS cms_posts_due ON cms_posts (state, next_try_at);
CREATE INDEX IF NOT EXISTS cms_posts_user ON cms_posts (user_id, created_at);
