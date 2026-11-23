-- app.socialmediacorner.co plan kotaları (src/plans.js PLANS, src/generate.js girişli üretim yolu, /gen/stock, /gen/quota; A9b).
-- 0017_accounts.sql'den sonra uygulanır (0015 Ana'ya ayrıldı; numara PR açılırken o anki origin/main'e göre doğrulanmalı).
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- Uygulanmadan: girişli üretim anonim akışa düşer (users.plan okunamaz → plan yok sayılır; günlük anon/IP hakları geçerli),
-- /gen/quota plan "anon" döner, /gen/stock herkese 403 plan verir (Pexels kapalı). Diğer uçlar etkilenmez.
-- ALTER TABLE tekrar çalıştırılamaz; wrangler uygulanan migration'ları takip eder, elle ikinci kez çalıştırmayın.

-- Kullanıcı planı: basic | pro | enterprise. ALTER ile CHECK eklenemediği için değer kodda doğrulanır (plans.js planOf:
-- bilinmeyen değer basic sayılır). Ödeme akışı yok; plan admin tarafından elle yazılır:
--   UPDATE users SET plan = 'pro' WHERE email = '…';
ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'basic';

-- Enterprise sözleşmeye özel aylık haklar, JSON: {"linkedin_blog":N,"video_gorsel":N}. NULL ya da geçersizse pro sayıları.
-- Yalnız plan = 'enterprise' iken okunur; admin elle yazar.
ALTER TABLE users ADD COLUMN plan_limits TEXT;

-- Aylık üretim sayacı. month 'YYYY-MM' (Europe/Istanbul, sabit UTC+3), kind lb (LinkedIn + blog) | vg (video + görsel/Instagram).
-- Artış koşullu tek deyimle (gen_usage deseni): INSERT … ON CONFLICT(month, user_id, kind) DO UPDATE SET n = gen_month.n + excluded.n
--   WHERE gen_month.n + excluded.n <= ? RETURNING n (satır dönmezse plan dolu). Hesap silinince satırlar gider (CASCADE +
--   platform.js deleteAccount açık DELETE). genCleanup 13 aydan eski ayları siler.
CREATE TABLE IF NOT EXISTS gen_month (
  month TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('lb','vg')),
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (month, user_id, kind)
) WITHOUT ROWID;
