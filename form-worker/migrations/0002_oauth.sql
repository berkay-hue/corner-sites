-- brandcorner sosyal hesap bağlama: resmi OAuth (Instagram, TikTok, YouTube). Kazıma ve şifre yok.
-- 0001_metrics.sql'den sonra uygulanır; tekrar uygulanabilir (IF NOT EXISTS).
-- Uygula: npx wrangler d1 migrations apply corner-forms --remote
-- Bağlı hesabın tek kaynağı social_accounts (0001): durum, kullanıcı adı, platform kimliği, hata.
-- Bu dosyadaki tablolar yalnızca akış durumu ve şifreli token tutar.

-- Bağlantı akışı. Başlatırken: state'in SHA-256 özeti, 10 dakika. Sağlayıcı döndüğünde aynı satıra
-- panelin bileti (özeti) ve şifreli yetki kodu yazılır, 5 dakika. Token takası bileti getiren
-- oturumun sahibi satırın user_id'siyle aynıysa yapılır (POST /app/connect/finish).
CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  return_to TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  ticket_hash TEXT,
  code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS oauth_states_ticket ON oauth_states (ticket_hash);

-- Kullanıcı ve platform başına bir token. access_token ve refresh_token OAUTH_TOKEN_KEY ile
-- AES-GCM şifreli saklanır ("v1.<iv>.<şifreli>"); düz token D1'e yazılmaz.
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TEXT,
  scope TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, platform)
);

-- Bir platform hesabı en fazla bir kullanıcıya bağlanır. Bağ koparılınca external_id NULL olur
-- (NULL'lar birbirine eşit sayılmaz).
CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_external ON social_accounts (platform, external_id);
