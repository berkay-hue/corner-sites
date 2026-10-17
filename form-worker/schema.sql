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

-- Giriş/kayıt denemeleri (hız sınırı); cron 1 günden eskileri siler
CREATE TABLE IF NOT EXISTS auth_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip TEXT,
  email TEXT,
  kind TEXT NOT NULL,        -- login | register
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
  UNIQUE (campaign_id, user_id)
);
CREATE INDEX IF NOT EXISTS applications_user ON applications (user_id);
