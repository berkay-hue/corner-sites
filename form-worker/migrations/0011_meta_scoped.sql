-- brandcorner Instagram hesabının uygulamaya özel kimliği (Graph /me "id"), bağlarken ve senkronda yazılır (src/oauth.js
-- finishOAuth, syncDue). Meta'nın deauthorize ve veri silme geri çağrısı (src/oauth.js metaCallback) gelen user_id'yi
-- hem external_id (profesyonel hesap kimliği, /me "user_id") hem bu sütunla eşleştirir; Meta hangisini gönderdiğini yazmıyor.
-- 0010_post_audience.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- ALTER TABLE tekrar çalıştırılamaz; wrangler uygulanan migration'ları takip eder, elle ikinci kez çalıştırmayın.
-- Deploy'dan ÖNCE uygulayın: yeni kod bağlarken ve senkronda bu sütunu yazar; sütun yoksa hiçbir hesap bağlanamaz ve
-- senkron ölçüm yazamaz (bağ koparma yine çalışır).

-- Metin ya da NULL. Yalnız Instagram'da dolu; diğer platformlarda ve bağ koparılınca NULL.
ALTER TABLE social_accounts ADD COLUMN scoped_id TEXT;
CREATE INDEX IF NOT EXISTS social_accounts_scoped ON social_accounts (platform, scoped_id);
