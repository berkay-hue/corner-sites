-- Bildirim tercihleri (yalnız saklama, e-posta gönderimi yok). 0004_sync_changes.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- ALTER TABLE tekrar çalıştırılamaz; wrangler uygulanan migration'ları takip eder, elle ikinci kez çalıştırmayın.
-- Deploy'dan ÖNCE uygulayın: yeni kod bu sütuna yazar (PUT /app/notify). Uygulanmazsa yalnız PUT /app/notify 503 not_ready döner.

-- Rolün bildirim anahtarları -> boolean, JSON (src/platform.js NOTIFY). Profilden ayrı: profil kaydı bu ayarları silmez.
ALTER TABLE users ADD COLUMN notify TEXT NOT NULL DEFAULT '{}';
