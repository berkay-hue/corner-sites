-- Elle girilen gönderi ölçümleri (panel "Gönderiler" sekmesi, #217). 0005_notify.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- Deploy'dan ÖNCE uygulayın. Uçlar POSTS_ENABLED = "1" olmadan 404 döner (panel tarayıcıdaki kayda düşer);
-- bayrak açık ama tablolar yoksa GET/POST /app/posts* 503 not_ready döner.

-- Kullanıcının gönderisi; aynı kullanıcıda aynı url bir kez. Alanlar paneldeki kayıtla aynı (url, platform, type, date, caption, thumb).
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  platform TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  thumb TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, url)
);

-- Ölçüm: gönderi başına gün (at, YYYY-MM-DD) başına bir satır; aynı gün yeniden girilirse üzerine yazılır. Boş metrik NULL.
CREATE TABLE IF NOT EXISTS post_snaps (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  at TEXT NOT NULL,
  likes INTEGER,
  comments INTEGER,
  views INTEGER,
  reach INTEGER,
  PRIMARY KEY (post_id, at)
);
