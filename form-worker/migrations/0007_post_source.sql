-- Bağlı hesaptan aktarılan gönderiler (Instagram senkronu, src/oauth.js syncDue). 0006_posts.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- ALTER TABLE tekrar çalıştırılamaz; wrangler uygulanan migration'ları takip eder, elle ikinci kez çalıştırmayın.
-- Deploy'dan ÖNCE uygulayın: yeni kod bu sütuna yazar ve bağ koparılınca bu sütundan siler.

-- NULL: panelde elle ya da CSV ile girilen gönderi. Dolu: o bağlı hesaptan aktarıldı; bağ koparılınca ya da
-- platformda başka bir hesap bağlanınca gönderi ve ölçümleri silinir. Elle girilen gönderiye senkron dokunmaz.
ALTER TABLE posts ADD COLUMN account_id INTEGER; -- social_accounts.id
CREATE INDEX IF NOT EXISTS posts_account ON posts (account_id);
