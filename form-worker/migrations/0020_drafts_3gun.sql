-- app taslak geçmişi 3 gün (A15): drafts.platform CHECK'i blog ve video satırlarını da kabul edecek şekilde genişletilir.
-- 0017'deki CHECK (platform IN ('linkedin','instagram')) generate.js'in blog/video taslağını reddediyordu; SQLite CHECK'i
-- ALTER ile değiştiremez, tablo yeniden kurulur (yeni tablo, satır kopyası, eskiyi düşür, ad değiştir, dizinleri yeniden kur).
-- Karusel video satırıdır (meta.kind 'carousel'), Reels instagram satırıdır (meta.kind 'reels'); platform değeri bu dört taneyle sınırlı.
-- Saklama süresi kodda: platform.js DRAFT_KEEP_DAYS (3). Saatlik cron eski satırları siler; listDrafts 3 günden eskisini zaten göstermez.
-- 0019_cms.sql'den sonra uygulanır (numara PR açılırken o anki origin/main'e göre doğrulanmalı).
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- Uygulanmadan: blog/video taslak INSERT'i CHECK'e takılır, saveDrafts hatayı yutar (üretim yanıtı gider, draft_ids olmaz).
-- drafts'a başvuran tablo yok; defer_foreign_keys users(id) başvurusu tablo düşerken anlık denetime takılmasın diye.
PRAGMA defer_foreign_keys = true;

CREATE TABLE drafts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  platform TEXT NOT NULL CHECK (platform IN ('linkedin','instagram','blog','video')),
  topic TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '{}'
);

INSERT INTO drafts_new (id, user_id, site, created_at, platform, topic, body, meta)
  SELECT id, user_id, site, created_at, platform, topic, body, meta FROM drafts;

-- sqlite_sequence'e yazılmaz (D1 iç tablosu; uzakta reddedilirse göç yarıda kalır). 25.11 canlıda drafts hiç satır
-- almamıştı (sqlite_sequence'te kaydı yok), taşınacak sayaç yoktu; kimlikler kopyadaki en büyük kimlikten sürer.

DROP TABLE drafts;
ALTER TABLE drafts_new RENAME TO drafts;

CREATE INDEX IF NOT EXISTS drafts_user ON drafts (user_id, id DESC);
CREATE INDEX IF NOT EXISTS drafts_age ON drafts (created_at);
