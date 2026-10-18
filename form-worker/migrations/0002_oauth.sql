-- brandcorner sosyal hesap bağlama: resmi OAuth (Instagram, TikTok, YouTube). Kazıma ve şifre yok.
-- Tekrar uygulanabilir (IF NOT EXISTS). Uygula: npx wrangler d1 migrations apply corner-forms --remote

-- Bağlantı başlatılırken üretilen tek kullanımlık, 10 dakikalık state'in yalnızca SHA-256 özeti
CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  return_to TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

-- Kullanıcı ve platform başına bir token. access_token ve refresh_token OAUTH_TOKEN_KEY ile
-- AES-GCM şifreli saklanır ("v1.<iv>.<şifreli>"); düz token D1'e yazılmaz.
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  external_id TEXT,
  handle TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TEXT,
  scope TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, platform)
);
