-- brandcorner kitle dağılımı (yaş, cinsiyet, ülke, şehir), senkronda ölçümle birlikte yazılır (src/oauth.js syncDue).
-- 0007_post_source.sql'den sonra uygulanır (0008 LinkedIn'e ayrıldı; sıra boşluğu sorun değil).
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- ALTER TABLE tekrar çalıştırılamaz; wrangler uygulanan migration'ları takip eder, elle ikinci kez çalıştırmayın.
-- Deploy'dan ÖNCE uygulayın: yeni kod her ölçümde bu sütuna yazar; sütun yoksa ölçüm yazılamaz.

-- JSON ya da NULL. Yüzdeler (bir ondalık): {"followers": {...}, "engaged": {...}} (Instagram) ya da {"viewers": {...}}
-- (YouTube); her biri {"age": [["18-24", 31.5], ...], "gender": [["F", 55.1], ...], "country": [["TR", 80.2], ...],
-- "city": [[...]]}. NULL: platform vermedi (TikTok, LinkedIn, eşiğin altındaki hesap, izni olmayan bağlantı).
ALTER TABLE metric_snapshots ADD COLUMN audience TEXT;
