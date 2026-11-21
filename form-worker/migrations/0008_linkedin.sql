-- LinkedIn üye analitiği (Community Management API, src/oauth.js syncDue). 0007_post_source.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- ALTER TABLE tekrar çalıştırılamaz; wrangler uygulanan migration'ları takip eder, elle ikinci kez çalıştırmayın.
-- Deploy'dan ÖNCE uygulayın: yeni kod bu sütunlara yazar ve panel ölçümü bu sütunlardan okur.

-- Üyenin tüm gönderilerinin toplamı (LinkedIn memberCreatorPostAnalytics, aggregation TOTAL, tarih aralığı yok).
-- Yalnız LinkedIn ölçümünde dolu; diğer platformlarda ve gelmeyen değerde NULL.
ALTER TABLE metric_snapshots ADD COLUMN total_impressions INTEGER; -- gösterim
ALTER TABLE metric_snapshots ADD COLUMN total_reach INTEGER; -- erişilen üye
ALTER TABLE metric_snapshots ADD COLUMN total_reactions INTEGER; -- tepki
ALTER TABLE metric_snapshots ADD COLUMN total_comments INTEGER; -- yorum
ALTER TABLE metric_snapshots ADD COLUMN total_reshares INTEGER; -- yeniden paylaşım
