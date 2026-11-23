-- Yayın kuyruğu (src/publish.js /publish/*, publishTick; A7 TEKNIK-PLAN §1): onaylı LinkedIn/Instagram gönderilerinin
-- zamanlanmış yayını ve denetim izi. 0014_gen.sql'den sonra uygulanır (0015 başka dala ayrıldı; numara PR açılırken
-- o anki origin/main'e göre doğrulanmalı).
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- PUBLISH_ENABLED = "1" yapılmadan ÖNCE uygulayın. Bayrak kapalıyken kod bu tablolara hiç dokunmaz (uçlar 503 not_ready,
-- 5 dakikalık cron dalı 0 D1 sorgusu).
-- Yalnız CREATE … IF NOT EXISTS: yeniden çalıştırmak zararsızdır (publish.test.mjs bunu doğrular).

-- Durumlar: taslak → onay_bekliyor → planlandi → yayinlaniyor → yayinlandi | basarisiz | kontrol; iptal.
-- Geçişi yalnız publish.js move() yapar (koşullu UPDATE + aynı batch'te publish_events). Saatler UTC, SQLite biçimi
-- 'YYYY-MM-DD HH:MM:SS' (datetime('now') ile karşılaştırılır); arayüz Europe/Istanbul gösterir.
-- idem_key = sha256(account_id‖approved_hash‖run_at): onayda yazılır, onay düşünce NULL (aynı hesap + metin + saat iki kez
-- planlanamaz). rid: istemcinin istek kimliği (çift kuyruğa alma). lease_until: cron kirası (syncDue düzeni).
-- body: yayınlanan/iptal işlerde 90 gün sonra boşaltılır. last_error yalnız kısa kod (token ve metin yazılmaz).
CREATE TABLE IF NOT EXISTS publish_jobs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  account_external_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram')),
  body TEXT NOT NULL CHECK (length(body) <= CASE platform WHEN 'instagram' THEN 2200 ELSE 3000 END),
  media_url TEXT,
  body_hash TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'taslak' CHECK (state IN ('taslak', 'onay_bekliyor', 'planlandi', 'yayinlaniyor',
    'yayinlandi', 'basarisiz', 'kontrol', 'iptal')),
  run_at TEXT,
  approved_by INTEGER REFERENCES users(id),
  approved_at TEXT,
  approved_hash TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_try_at TEXT,
  lease_until TEXT,
  idem_key TEXT UNIQUE,
  rid TEXT UNIQUE,
  remote_id TEXT,
  container_id TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS publish_due ON publish_jobs (state, next_try_at);
CREATE INDEX IF NOT EXISTS publish_user ON publish_jobs (user_id, id);

-- Denetim izi: actor NULL = sistem (cron); note kısa neden kodu.
CREATE TABLE IF NOT EXISTS publish_events (
  id INTEGER PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES publish_jobs(id) ON DELETE CASCADE,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  actor INTEGER,
  from_state TEXT,
  to_state TEXT NOT NULL,
  note TEXT
);
CREATE INDEX IF NOT EXISTS publish_events_job ON publish_events (job_id, id);
