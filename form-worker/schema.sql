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

-- app taslak üretimi (0014_gen.sql ile aynı tablolar; src/generate.js). Günlük sayaç: key sha256(salt|day|kind|değer) ya da 'all'
CREATE TABLE IF NOT EXISTS gen_usage (
  day TEXT NOT NULL,
  key TEXT NOT NULL,
  kind TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, key)
) WITHOUT ROWID;
-- Günde tek satır, kişisel olmayan sayılar (sonuç, kullanıcı, kart olayları, teklif tıkı)
CREATE TABLE IF NOT EXISTS gen_daily (
  day TEXT PRIMARY KEY,
  ok INTEGER NOT NULL DEFAULT 0,
  fail INTEGER NOT NULL DEFAULT 0,
  refused INTEGER NOT NULL DEFAULT 0,
  busy INTEGER NOT NULL DEFAULT 0,
  refine_ok INTEGER NOT NULL DEFAULT 0,
  tok_in INTEGER NOT NULL DEFAULT 0,
  tok_out INTEGER NOT NULL DEFAULT 0,
  uniq_anon INTEGER NOT NULL DEFAULT 0,
  anon_full INTEGER NOT NULL DEFAULT 0,
  ip_full INTEGER NOT NULL DEFAULT 0,
  cap_hit INTEGER NOT NULL DEFAULT 0,
  ret0 INTEGER NOT NULL DEFAULT 0,
  ret1 INTEGER NOT NULL DEFAULT 0,
  ret2_7 INTEGER NOT NULL DEFAULT 0,
  ret8 INTEGER NOT NULL DEFAULT 0,
  copy_ok INTEGER NOT NULL DEFAULT 0,
  copy_fb INTEGER NOT NULL DEFAULT 0,
  share INTEGER NOT NULL DEFAULT 0,
  qc_limit INTEGER NOT NULL DEFAULT 0,
  qc_result INTEGER NOT NULL DEFAULT 0,
  qc_error INTEGER NOT NULL DEFAULT 0,
  qc_cap INTEGER NOT NULL DEFAULT 0,
  qc_top INTEGER NOT NULL DEFAULT 0,
  qc_footer INTEGER NOT NULL DEFAULT 0,
  qc_calendly INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;

-- Yayın kuyruğu (0016_publish.sql ile aynı tablolar; src/publish.js). PUBLISH_ENABLED = "1" ile açılır.
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

-- app hesap bölümleri (migrations/0017_accounts.sql ile aynı tablolar).
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

-- Taslak geçmişi: girişli kullanıcının ürettiği LinkedIn/Instagram/blog/video taslakları; 3 gün saklanır (platform.js DRAFT_KEEP_DAYS,
-- saatlik cron siler). Karusel video, Reels instagram satırıdır (meta.kind). CHECK 0020_drafts_3gun.sql ile aynı.
-- Sayfalama id imleciyle (before), arama topic/body LIKE ile. meta JSON (tone vb.).
CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  platform TEXT NOT NULL CHECK (platform IN ('linkedin','instagram','blog','video')),
  topic TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS drafts_user ON drafts (user_id, id DESC);
CREATE INDEX IF NOT EXISTS drafts_age ON drafts (created_at);

-- app plan kotaları (migrations/0018_plans.sql ile aynı tablo; users.plan ve users.plan_limits sütunları yalnız 0018'de).
-- Aylık üretim sayacı: month 'YYYY-MM' (Europe/Istanbul), kind lb (LinkedIn + blog) | vg (video + görsel).
CREATE TABLE IF NOT EXISTS gen_month (
  month TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('lb','vg')),
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (month, user_id, kind)
) WITHOUT ROWID;

-- Sosyal metrikler bu dosyada değil, migrations/ altında; bu dosyadan sonra sırayla uygulanır:
--   0001_metrics.sql  sosyal hesaplar ve metrik tabloları
--   0002_oauth.sql    OAuth akışı, şifreli token, social_accounts (platform, external_id) UNIQUE
--   0003_sync.sql     günlük senkron (next_sync_at) ve YouTube PKCE (oauth_states.code_verifier)
--   0004_sync_changes.sql  kalıcı hesap kimliği uyuşmazlığı sayacı (social_accounts.sync_changes)
--   0005_notify.sql   bildirim tercihleri (users.notify, JSON; yalnız saklama, gönderim yok)
--   0006_posts.sql    elle girilen gönderi ölçümleri (posts, post_snaps; POSTS_ENABLED = "1" ile açılır)
--   0007_post_source.sql  bağlı hesaptan aktarılan gönderiler (posts.account_id; bağ koparılınca silinir)
--   0008_linkedin.sql      LinkedIn üye analitiği toplamları (metric_snapshots.total_*: gösterim, erişim, tepki, yorum, paylaşım)
--   0009_audience.sql      hesap kitle dağılımı (yaş, cinsiyet, ülke, şehir)
--   0010_post_audience.sql gönderi başına kitle dağılımı (posts.audience)
--   0011_meta_scoped.sql   Instagram hesabının uygulamaya özel kimliği (Meta deauthorize / veri silme eşleşmesi)
--   0012_admin.sql         yönetim paneli: user_perms, perm_log, post_edits, meta_events (yukarıdakiyle aynı tablolar)
--   0013_linkedin_posts.sql LinkedIn ek toplamlar (kaydetme, gönderme, bağlantı tıklaması, içerikten takipçi ve profil görüntüleme) ve posts.synced_at
--   0014_gen.sql          app taslak üretimi: gen_usage (günlük sayaçlar), gen_daily (günlük ölçüm) (yukarıdakiyle aynı tablolar)
--   0016_publish.sql      yayın kuyruğu: publish_jobs, publish_events (yukarıdakiyle aynı tablolar; 0015 başka dala ayrıldı)
--   0017_accounts.sql     app marka sesi + taslak geçmişi: brand_voice, drafts (yukarıdakiyle aynı tablolar; 0015 Ana'ya ayrıldı)
--   0018_plans.sql        app plan kotaları: users.plan, users.plan_limits, gen_month (aylık sayaç; tablo yukarıdakiyle aynı)
--   0019_cms.sql          otomatik blog yazarı: cms_sites, cms_posts (yalnız migrations/ altında)
--   0020_drafts_3gun.sql  drafts.platform CHECK'ine blog ve video (tablo yeniden kurulur; tablo yukarıdakiyle aynı)
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- 0002 uygulanmadan da bağ koparma çalışır; 0003–0014 yeni kodla deploy'dan ÖNCE uygulanmalı.
-- 0016 PUBLISH_ENABLED = "1" yapılmadan ÖNCE uygulanmalı; bayrak kapalıyken kod bu tablolara dokunmaz.
-- 0017 uygulanmadan /app/voice ve /app/drafts 503 not_ready döner; /app/export ve /app/account/delete tabloyu atlar.
-- 0018 uygulanmadan girişli üretim anonim akışa düşer ve /gen/stock herkese 403 plan döner (Pexels kapalı).
-- 0020 uygulanmadan blog/video taslağı geçmişe yazılmaz (CHECK reddeder, saveDrafts yutar); LinkedIn/Instagram etkilenmez.
