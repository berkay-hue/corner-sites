-- brandcorner sosyal metrikleri (src/metrics.js). Uygulama (Berkay), form-worker klasöründen:
--   wrangler d1 migrations apply corner-forms --remote
--   (ya da: wrangler d1 execute corner-forms --remote --file=migrations/0001_metrics.sql)
-- Tekrar çalıştırmak güvenli. Veriler yalnızca resmi API'lerden (OAuth) gelir; kazıma ve şifre yok.
-- METRICS_ENABLED = "1" olmadan worker bu tabloları okumaz, panel "örnek" veri gösterir.

-- Influencer'ın bağladığı sosyal hesap (platform başına bir tane)
CREATE TABLE IF NOT EXISTS social_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL,    -- instagram | tiktok | youtube (resmi API'si olanlar)
  handle TEXT,
  external_id TEXT,          -- platformun hesap kimliği
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | connected | revoked | error
  connected_at TEXT,
  error TEXT,
  UNIQUE (user_id, platform)
);

-- Hesap metriklerinin zaman içindeki kopyası; panel en yenisini gösterir
CREATE TABLE IF NOT EXISTS metric_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  taken_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL DEFAULT 'oauth',
  followers INTEGER,
  avg_views INTEGER,         -- son gönderilerin ortalaması
  avg_likes INTEGER,
  avg_comments INTEGER,
  posts_sampled INTEGER,     -- ortalamaya giren gönderi sayısı
  niches TEXT                -- JSON, src/classify.js: [{tag, score}]
);
CREATE INDEX IF NOT EXISTS metric_snapshots_account ON metric_snapshots (account_id, taken_at);

-- İşbirliği içerik linkinin (applications.content_url) metrikleri
CREATE TABLE IF NOT EXISTS link_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  account_id INTEGER,
  url TEXT NOT NULL,
  platform TEXT,
  taken_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL DEFAULT 'oauth',
  views INTEGER,
  likes INTEGER,
  comments INTEGER
);
CREATE INDEX IF NOT EXISTS link_snapshots_application ON link_snapshots (application_id, taken_at);
