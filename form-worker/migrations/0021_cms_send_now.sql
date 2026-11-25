-- Elle "Şimdi paylaş" (26.11): send_now = 1 olan 'hazir' yazı site duraklatılmış (ya da 'hata') olsa da cmsTick tarafından gönderilir.
-- Kullanıcı yazıyı elle gönderdiğinde (POST /app/cmsposts/:id/now) ya da başarısız yazıyı yeniden denediğinde 1 olur;
-- ertelemede 0'a döner. Yeniden başlatmada (resume) vakti geçmiş send_now = 0 yazılar hemen gitmez, sıradaki yuvaya dizilir.
-- Yalnız sütun ekler: eski worker kodu etkilenmez, önce bu göç uygulanır, sonra worker yüklenir.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
ALTER TABLE cms_posts ADD COLUMN send_now INTEGER NOT NULL DEFAULT 0;
