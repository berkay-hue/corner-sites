-- brandcorner günlük metrik senkronu ve YouTube PKCE. 0002_oauth.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- ALTER TABLE tekrar çalıştırılamaz; wrangler uygulanan migration'ları takip eder, elle ikinci kez çalıştırmayın.
-- Deploy'dan ÖNCE uygulayın: yeni kod bu sütunlara yazar.

-- Bir sonraki senkronun en erken zamanı (cron, src/oauth.js syncDue). Senkron sürerken 15 dakikalık kira:
-- hesap başına aynı anda tek senkron, iki senkron aynı refresh token'ı harcamaz. NULL: hemen senkronlanabilir.
ALTER TABLE social_accounts ADD COLUMN next_sync_at TEXT;
CREATE INDEX IF NOT EXISTS social_accounts_sync ON social_accounts (status, next_sync_at);

-- PKCE (RFC 7636) code_verifier'ı, OAUTH_TOKEN_KEY ile şifreli. Yalnız YouTube (Google) kullanır.
ALTER TABLE oauth_states ADD COLUMN code_verifier TEXT;
