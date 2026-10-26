-- brandcorner yönetim paneli (src/platform.js /app/admin*): kullanıcı yetkileri ve yetki değişikliği günlüğü, gönderi ölçümlerinin
-- elle değişiklik günlüğü ve Meta'nın deauthorize / veri silme geri çağrılarının kaydı (src/oauth.js metaCallback). 0011_meta_scoped.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- Deploy'dan ÖNCE uygulayın. Tablolar yoksa kod eski davranışa düşer (yetki kapısı açık, yönetici yok, günlük yazılmaz);
-- tablolar varken bağlı hesaptan gelen gönderinin ölçümünü elle değiştirmek edit_metrics ya da admin yetkisi ister.
-- Yönetici API'den atanamaz; ilk yönetici canlıda tek INSERT ile eklenir:
--   INSERT INTO user_perms (user_id, perm) VALUES (<kullanıcı id>, 'admin');

-- Kullanıcı yetkisi: admin (yönetim paneli, yalnız elle eklenir) ya da edit_metrics (bağlı hesaptan gelen ölçümü elle değiştirme;
-- yönetici panelden açar/kapatır). Kullanıcı silinince yetkileri de silinir.
CREATE TABLE IF NOT EXISTS user_perms (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perm TEXT NOT NULL CHECK (perm IN ('admin', 'edit_metrics')),
  granted_by INTEGER,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, perm)
);

-- Elle değişiklik günlüğü: değişen her metrik (likes | comments | views | reach) bir satır, before → after (NULL = ölçülmedi;
-- yeni ölçümde before NULL). source: manual | import | admin. post_id'de yabancı anahtar yok: gönderi silinse de günlük kalır.
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
-- Senkron, elle düzeltilmiş ölçümü (aynı post_id ve snap_at için günlük satırı olanı) ezmez; bu dizin o kontrolü karşılar.
CREATE INDEX IF NOT EXISTS post_edits_post ON post_edits (post_id, snap_at);

-- Yetki değişikliği günlüğü: yalnız gerçek değişiklik (verilmemişi verme, verilmişi alma) bir satır; granted 1 = verildi, 0 = alındı.
-- actor_id işlemi yapan yönetici; kullanıcı silinse de günlük kalır.
CREATE TABLE IF NOT EXISTS perm_log (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  actor_id INTEGER,
  user_id INTEGER NOT NULL,
  perm TEXT NOT NULL,
  granted INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS perm_log_at ON perm_log (at DESC);

-- Meta geri çağrısı: kind deauthorize | delete, code veri silme onay kodu (deauthorize'da NULL), matched eşleşen hesap sayısı.
-- Meta kullanıcı kimliği saklanmaz.
CREATE TABLE IF NOT EXISTS meta_events (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  kind TEXT NOT NULL,
  code TEXT,
  matched INTEGER NOT NULL
);
