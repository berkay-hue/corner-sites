-- brandcorner senkronunda kalıcı hesap kimliği uyuşmazlığı sınırı. 0003_sync.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- ALTER TABLE tekrar çalıştırılamaz; wrangler uygulanan migration'ları takip eder, elle ikinci kez çalıştırmayın.
-- Deploy'dan ÖNCE uygulayın: yeni kod bu sütuna yazar (bağlama ve senkron).

-- Sağlayıcının bu token için döndürdüğü hesap kimliği kayıtlı external_id'den art arda kaç senkronda farklı çıktı
-- (src/oauth.js syncAccount). Sınıra ulaşınca hesap 'error' olur ve saatlik yeniden deneme durur; başarılı senkron
-- ve yeniden bağlama sıfırlar.
ALTER TABLE social_accounts ADD COLUMN sync_changes INTEGER NOT NULL DEFAULT 0;
