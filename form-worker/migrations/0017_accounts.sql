-- app.socialmediacorner.co hesap bölümleri (src/platform.js ACCT: /app/voice, /app/drafts, /app/export, /app/account/delete;
-- A5-3). 0016_publish.sql'den sonra uygulanır (0015 Ana'ya ayrıldı; numara PR açılırken o anki origin/main'e göre doğrulanmalı).
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- Uygulanmadan /app/voice ve /app/drafts 503 not_ready döner (arayüz "Bu bölüm yakında" gösterir); export ve hesap silme
-- olmayan tabloyu atlar; diğer uçlar etkilenmez.
-- Yalnız CREATE … IF NOT EXISTS: yeniden çalıştırmak zararsızdır.

-- Marka sesi: kullanıcı başına tek satır. Diziler JSON metin (tones ≤3, samples ≤3 × ≤2200, banned ≤30 × ≤40);
-- sınırları platform.js voiceIn() uygular. site, satırın hangi sitenin hesabına ait olduğunu sorgularda ikinci kez süzer.
CREATE TABLE IF NOT EXISTS brand_voice (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT '',
  tones TEXT NOT NULL DEFAULT '[]',
  samples TEXT NOT NULL DEFAULT '[]',
  banned TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
) WITHOUT ROWID;

-- Taslak geçmişi: üretilen LinkedIn/Instagram taslakları (yazan uç sonraki adımda; bu sürüm okur, siler, dışa aktarır).
-- Sayfalama id imleciyle (before), arama topic/body LIKE ile. meta JSON (tone vb.).
CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  platform TEXT NOT NULL CHECK (platform IN ('linkedin','instagram')),
  topic TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS drafts_user ON drafts (user_id, id DESC);
CREATE INDEX IF NOT EXISTS drafts_age ON drafts (created_at);
