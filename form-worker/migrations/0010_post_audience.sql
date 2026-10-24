-- brandcorner gönderi başına kitle dağılımı (yaş, cinsiyet, ülke), senkronda gönderiyle birlikte yazılır (src/oauth.js
-- syncDue). Şimdilik yalnız YouTube videoları: her senkronda birkaç video sorulur, veri gelmezse eski değer kalır.
-- 0009_audience.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- ALTER TABLE tekrar çalıştırılamaz; wrangler uygulanan migration'ları takip eder, elle ikinci kez çalıştırmayın.
-- Deploy'dan ÖNCE uygulayın: yeni kod gönderileri bu sütunla okur ve yazar; sütun yoksa Gönderiler uçları 503 not_ready döner,
-- senkron da gönderisi olan hesaplarda ölçüm yazamaz (gönderi ve ölçüm aynı toplu yazımda).

-- JSON ya da NULL. metric_snapshots.audience ile aynı biçim: {"viewers": {"age": [["25-34", 61.2], ...],
-- "gender": [["M", 70.4], ...], "country": [["TR", 82.5], ...]}}. NULL: platform gönderi başına vermiyor (Instagram,
-- TikTok, LinkedIn), video YouTube'un eşiğinin altında ya da henüz sorulmadı, gönderi elle girildi.
-- Not: YouTube'da metric_snapshots.audience kitle alınamayınca nedeni taşır: {"reason": "no_scope" | "api_off" | "few" | "error"}.
ALTER TABLE posts ADD COLUMN audience TEXT;
