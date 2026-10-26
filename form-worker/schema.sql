-- corner-forms D1 şeması. Tekrar uygulanabilir (IF NOT EXISTS).
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 execute corner-forms --remote --file=schema.sql
-- Ardından migrations/ (dosyanın sonundaki not).

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  site TEXT NOT NULL,
  page TEXT,
  fields TEXT NOT NULL,      -- JSON: [[etiket, değer], ...]
  ip TEXT,
  ua TEXT,
  emailed INTEGER NOT NULL DEFAULT 0,
  error TEXT
);
CREATE INDEX IF NOT EXISTS submissions_ip ON submissions (ip, created_at);
CREATE INDEX IF NOT EXISTS submissions_unsent ON submissions (emailed);

-- brandcorner.co platformu (src/platform.js). Şifre: pbkdf2$<tur>$<tuz>$<özet>; profil JSON.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  site TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,        -- brand | influencer | agency
  lang TEXT NOT NULL DEFAULT 'tr',
  pass TEXT NOT NULL,
  profile TEXT NOT NULL DEFAULT '{}',
  consent_at TEXT,          -- kayıtta KVKK/gizlilik metni okundu ve koşullar kabul edildi onayının zamanı (UTC)
  UNIQUE (site, email)
);
-- Tablo önceden varsa bir kez çalıştırın:
-- ALTER TABLE users ADD COLUMN consent_at TEXT;

-- Oturum token'ının yalnızca SHA-256 özeti tutulur
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);

-- Şifre sıfırlama: tek kullanımlık, 1 saatlik token'ın yalnızca SHA-256 özeti (kullanıcı başına en son istenen geçerli)
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS password_resets_user ON password_resets (user_id);

-- Giriş/kayıt denemeleri (hız sınırı); cron 1 günden eskileri siler
CREATE TABLE IF NOT EXISTS auth_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip TEXT,
  email TEXT,
  kind TEXT NOT NULL,        -- login | register | forgot | reset
  ok INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_attempts_ip ON auth_attempts (ip, kind, created_at);
CREATE INDEX IF NOT EXISTS auth_attempts_email ON auth_attempts (email, kind, created_at);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  owner_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',   -- open | closed
  data TEXT NOT NULL         -- JSON: title, brief, niches, platforms, budget_min, budget_max, currency, deadline
);
CREATE INDEX IF NOT EXISTS campaigns_owner ON campaigns (owner_id);
CREATE INDEX IF NOT EXISTS campaigns_open ON campaigns (status, created_at);

-- Başvuru/davet ve içerik onayı: pending|invited → accepted|rejected|declined → submitted → approved|revision
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  campaign_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  content_url TEXT,
  revision_note TEXT,       -- marka revizyon isterken yazdığı not (en çok 500 karakter)
  UNIQUE (campaign_id, user_id)
);
-- Tablo önceden varsa bir kez çalıştırın:
-- ALTER TABLE applications ADD COLUMN revision_note TEXT;
CREATE INDEX IF NOT EXISTS applications_user ON applications (user_id);

-- Yönetim paneli (migrations/0012_admin.sql ile aynı; yeni kurulumda burada da oluşur)
-- Yetki: admin (yalnız elle eklenir) | edit_metrics (bağlı hesaptan gelen ölçümü elle değiştirme)
CREATE TABLE IF NOT EXISTS user_perms (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perm TEXT NOT NULL CHECK (perm IN ('admin', 'edit_metrics')),
  granted_by INTEGER,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, perm)
);
-- Elle ölçüm değişikliği günlüğü (alan başına bir satır; source: manual | import | admin; gönderi silinse de kalır)
CREATE TABLE IF NOT EXISTS post_edits (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  actor_id INTEGER,
  user_id INTEGER NOT NULL,
  post_id INTEGER,
  url TEXT NOT NULL,
  snap_at TEXT NOT NULL,
  field TEXT NOT NULL,
  before INTEGER,
  after INTEGER,
  source TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS post_edits_at ON post_edits (at DESC);
CREATE INDEX IF NOT EXISTS post_edits_user ON post_edits (user_id, at);
CREATE INDEX IF NOT EXISTS post_edits_post ON post_edits (post_id, snap_at);
-- Yetki değişikliği günlüğü (yalnız gerçek değişiklik; granted 1 = verildi, 0 = alındı)
CREATE TABLE IF NOT EXISTS perm_log (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  actor_id INTEGER,
  user_id INTEGER NOT NULL,
  perm TEXT NOT NULL,
  granted INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS perm_log_at ON perm_log (at DESC);
-- Meta deauthorize / veri silme geri çağrıları (Meta kullanıcı kimliği saklanmaz; code yalnız silmede)
CREATE TABLE IF NOT EXISTS meta_events (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  kind TEXT NOT NULL,
  code TEXT,
  matched INTEGER NOT NULL
);

-- Sosyal metrikler bu dosyada değil, migrations/ altında; bu dosyadan sonra sırayla uygulanır:
--   0001_metrics.sql  sosyal hesaplar ve metrik tabloları
--   0002_oauth.sql    OAuth akışı, şifreli token, social_accounts (platform, external_id) UNIQUE
--   0003_sync.sql     günlük senkron (next_sync_at) ve YouTube PKCE (oauth_states.code_verifier)
--   0004_sync_changes.sql  kalıcı hesap kimliği uyuşmazlığı sayacı (social_accounts.sync_changes)
--   0005_notify.sql   bildirim tercihleri (users.notify, JSON; yalnız saklama, gönderim yok)
--   0006_posts.sql    elle girilen gönderi ölçümleri (posts, post_snaps; POSTS_ENABLED = "1" ile açılır)
--   0007_post_source.sql  bağlı hesaptan aktarılan gönderiler (posts.account_id; bağ koparılınca silinir)
--   0009_audience.sql      hesap kitle dağılımı (yaş, cinsiyet, ülke, şehir)
--   0010_post_audience.sql gönderi başına kitle dağılımı (posts.audience)
--   0011_meta_scoped.sql   Instagram hesabının uygulamaya özel kimliği (Meta deauthorize / veri silme eşleşmesi)
--   0012_admin.sql         yönetim paneli: user_perms, perm_log, post_edits, meta_events (yukarıdakiyle aynı tablolar)
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- 0002 uygulanmadan da bağ koparma çalışır; 0003–0012 yeni kodla deploy'dan ÖNCE uygulanmalı.
