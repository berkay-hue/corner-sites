-- app.socialmediacorner.co taslak üretimi (src/generate.js /gen/linkedin, /gen/refine, /gen/event, genCleanup): günlük kişi/IP/global
-- sayaçları (gen_usage) ve kişisel olmayan günlük ölçüm (gen_daily). 0013_linkedin_posts.sql'den sonra uygulanır.
-- Uygula (form-worker/ klasöründen çalıştır): npx wrangler d1 migrations apply corner-forms --remote
-- Deploy'dan ÖNCE uygulayın. Tablolar yoksa /gen/* uçları 503 not_ready döner (sayaç yazılmaz, LLM çağrılmaz).
-- Yalnız CREATE TABLE IF NOT EXISTS: yeniden çalıştırmak zararsızdır (gen-schema.test.mjs bunu doğrular).

-- Günlük sayaç. day 'YYYY-MM-DD' (Europe/Istanbul gece yarısı, sabit UTC+3); key sha256(GEN_SALT|day|kind|değer) ya da 'all'.
-- kind: anon | ip | all (global tavan, birim) | ra | ri (refine anon/IP) | rid (yarıda kalan istek tekrarı) | rf (iade hakkı)
--       | ev (anon olay sayacı) | qc (anon+src teklif tıkı). Ham IP ve anon kimliği saklanmaz.
-- Artış koşullu tek deyimle yapılır: INSERT … ON CONFLICT(day, key) DO UPDATE SET n = gen_usage.n + excluded.n
--   WHERE gen_usage.n + excluded.n <= ? RETURNING n (satır dönmezse sınır dolu). genCleanup 2 günden eski satırları siler.
CREATE TABLE IF NOT EXISTS gen_usage (
  day TEXT NOT NULL,
  key TEXT NOT NULL,
  kind TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, key)
) WITHOUT ROWID;

-- Günde tek satır; kişisel olmayan sayılar, süresiz saklanır. Tek upsert: ON CONFLICT(day) DO UPDATE SET c = c + excluded.c
-- (sütun adları koddaki sabit listeden gelir, kullanıcıdan değil). 429'da yazılmaz.
CREATE TABLE IF NOT EXISTS gen_daily (
  day TEXT PRIMARY KEY,
  -- sonuç
  ok INTEGER NOT NULL DEFAULT 0,          -- başarılı üretim
  fail INTEGER NOT NULL DEFAULT 0,        -- llm_fail
  refused INTEGER NOT NULL DEFAULT 0,     -- refused (stop_reason: refusal)
  busy INTEGER NOT NULL DEFAULT 0,        -- llm_busy / llm_limit
  refine_ok INTEGER NOT NULL DEFAULT 0,   -- başarılı kısalt / uzat / ton değiştir
  tok_in INTEGER NOT NULL DEFAULT 0,      -- giriş token toplamı
  tok_out INTEGER NOT NULL DEFAULT 0,     -- çıkış token toplamı
  -- kullanıcı
  uniq_anon INTEGER NOT NULL DEFAULT 0,   -- o gün ilk üretimini yapan anon
  anon_full INTEGER NOT NULL DEFAULT 0,   -- anon sayacı GEN_PER_DAY'e ulaştı
  ip_full INTEGER NOT NULL DEFAULT 0,     -- IP sayacı GEN_IP_PER_DAY'e ulaştı
  cap_hit INTEGER NOT NULL DEFAULT 0,     -- global tavan (GEN_DAILY_CAP) doldu
  ret0 INTEGER NOT NULL DEFAULT 0,        -- dönüş kovası: ilk gün
  ret1 INTEGER NOT NULL DEFAULT 0,        -- dönüş kovası: 1 gün sonra
  ret2_7 INTEGER NOT NULL DEFAULT 0,      -- dönüş kovası: 2-7 gün sonra
  ret8 INTEGER NOT NULL DEFAULT 0,        -- dönüş kovası: 8+ gün sonra
  -- kart olayları (/gen/event)
  copy_ok INTEGER NOT NULL DEFAULT 0,
  copy_fb INTEGER NOT NULL DEFAULT 0,
  share INTEGER NOT NULL DEFAULT 0,
  -- teklif tıkı (quote_click, src'ye göre)
  qc_limit INTEGER NOT NULL DEFAULT 0,
  qc_result INTEGER NOT NULL DEFAULT 0,
  qc_error INTEGER NOT NULL DEFAULT 0,
  qc_cap INTEGER NOT NULL DEFAULT 0,
  qc_top INTEGER NOT NULL DEFAULT 0,
  qc_footer INTEGER NOT NULL DEFAULT 0,
  qc_calendly INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;
