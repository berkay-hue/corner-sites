-- LinkedIn ek toplamlar ve gönderi başına ölçüm (src/oauth.js syncDue, API.linkedin). 0012_admin.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- ALTER TABLE tekrar çalıştırılamaz; wrangler uygulanan migration'ları takip eder, elle ikinci kez çalıştırmayın.
-- Deploy'dan ÖNCE uygulayın: yeni kod bu sütunlara yazar ve panel ölçümü bu sütunlardan okur.

-- Üyenin tüm gönderilerinin toplamı (memberCreatorPostAnalytics, aggregation TOTAL), 0008'dekilere ek.
-- Yalnız LinkedIn ölçümünde dolu; diğer platformlarda ve gelmeyen değerde NULL.
ALTER TABLE metric_snapshots ADD COLUMN total_saves INTEGER; -- kaydetme (POST_SAVE)
ALTER TABLE metric_snapshots ADD COLUMN total_sends INTEGER; -- mesajla gönderme (POST_SEND)
ALTER TABLE metric_snapshots ADD COLUMN total_link_clicks INTEGER; -- bağlantı tıklaması (LINK_CLICKS)
ALTER TABLE metric_snapshots ADD COLUMN total_follows INTEGER; -- içerikten gelen takipçi (FOLLOWER_GAINED_FROM_CONTENT)
ALTER TABLE metric_snapshots ADD COLUMN total_profile_views INTEGER; -- içerikten gelen profil görüntüleme (PROFILE_VIEW_FROM_CONTENT)

-- Elle eklenen LinkedIn gönderisinin en son ölçülmeye çalışıldığı an (gönderi başına ölçüm sırası; NULL = hiç denenmedi).
-- Senkron her gün en çok LI_POSTS gönderiyi, en uzun süredir denenmeyenden başlayarak ölçer.
ALTER TABLE posts ADD COLUMN synced_at TEXT;
