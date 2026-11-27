-- 0022 chatbot (27.11): web widget + Instagram DM botu. Ayrıntı: src/chatbot.js
CREATE TABLE IF NOT EXISTS chatbots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad TEXT NOT NULL,
  mod TEXT NOT NULL DEFAULT 'hazir' CHECK (mod IN ('hazir', 'ai', 'karma')),
  aktif INTEGER NOT NULL DEFAULT 1 CHECK (aktif IN (0, 1)),
  dil TEXT NOT NULL DEFAULT 'tr' CHECK (dil IN ('tr', 'en')),
  surum INTEGER NOT NULL DEFAULT 1,              -- iyimser kilit; her güncellemede +1
  karsilama TEXT NOT NULL DEFAULT '',
  geri_donus TEXT NOT NULL DEFAULT '',
  devir_mesaji TEXT NOT NULL DEFAULT '',
  bulunamazsa TEXT NOT NULL DEFAULT 'ikisi' CHECK (bulunamazsa IN ('lead', 'devir', 'ikisi', 'yok')),
  menu TEXT NOT NULL DEFAULT '[]',               -- JSON Buton[]
  niyetler TEXT NOT NULL DEFAULT '[]',           -- JSON Niyet[] (sıra = dizi sırası)
  dizin TEXT NOT NULL DEFAULT '[]',              -- JSON eşleştirme dizini (sunucu üretir, §4.3; panele dönmez)
  persona TEXT NOT NULL DEFAULT '',
  ton INTEGER NOT NULL DEFAULT 50 CHECK (ton BETWEEN 0 AND 100),
  bilgi TEXT NOT NULL DEFAULT '',
  web_aktif INTEGER NOT NULL DEFAULT 0 CHECK (web_aktif IN (0, 1)),
  web_anahtar TEXT NOT NULL UNIQUE,              -- wk_ + 24 base64url
  web_alanlar TEXT NOT NULL DEFAULT '[]',        -- JSON string[] (normalize host)
  web_gorunum TEXT NOT NULL DEFAULT '{}',        -- JSON {renk, konum, baslik}
  ig_aktif INTEGER NOT NULL DEFAULT 0 CHECK (ig_aktif IN (0, 1)),
  ig_hesap TEXT,                                 -- social_accounts.external_id (IG profesyonel hesap kimliği)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS chatbots_user ON chatbots (user_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS chatbots_ig ON chatbots (ig_hesap) WHERE ig_hesap IS NOT NULL;

CREATE TABLE IF NOT EXISTS bot_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_id INTEGER NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  kanal TEXT NOT NULL CHECK (kanal IN ('web', 'ig')),
  dis_id TEXT NOT NULL,                          -- web: oturum (s_…), ig: gönderen IGSID
  ad TEXT,                                       -- lead adı (varsa)
  dil TEXT NOT NULL DEFAULT 'tr' CHECK (dil IN ('tr', 'en')),
  devir INTEGER NOT NULL DEFAULT 0 CHECK (devir IN (0, 1)),
  bekleyen TEXT CHECK (bekleyen IS NULL OR bekleyen IN ('lead')),  -- IG'de lead bilgisi bekleniyor
  okunmadi INTEGER NOT NULL DEFAULT 0,
  mesaj_sayisi INTEGER NOT NULL DEFAULT 0,
  son_mesaj TEXT NOT NULL DEFAULT '',            -- önizleme, en çok 120 karakter
  son_kullanici_at TEXT,                         -- IG 24 saat penceresi
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (bot_id, kanal, dis_id)
);
CREATE INDEX IF NOT EXISTS bot_conv_liste ON bot_conversations (bot_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS bot_conv_eski ON bot_conversations (updated_at);

CREATE TABLE IF NOT EXISTS bot_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  konusma_id INTEGER NOT NULL REFERENCES bot_conversations(id) ON DELETE CASCADE,
  bot_id INTEGER NOT NULL,                       -- istatistik için; silinme konuşma CASCADE'i ile
  rol TEXT NOT NULL CHECK (rol IN ('kullanici', 'bot', 'sistem')),
  metin TEXT NOT NULL,
  kaynak TEXT CHECK (kaynak IS NULL OR kaynak IN ('eslesmedi', 'hazir', 'ai', 'geri', 'kota', 'devir', 'lead', 'karsilama', 'menu',
                                                  'devir_acildi', 'devir_kapandi', 'lead_alindi')),
  niyet TEXT,                                    -- eşleşen niyet k
  puan REAL,
  butonlar TEXT,                                 -- JSON Buton[] (bot mesajında gösterilen)
  dis_mid TEXT,                                  -- IG mid (gelen mesaj); tekrar engeli
  hata TEXT,                                     -- IG gönderim hatası kısa kodu
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS bot_msg_konusma ON bot_messages (konusma_id, id);
CREATE INDEX IF NOT EXISTS bot_msg_istat ON bot_messages (bot_id, created_at);
CREATE INDEX IF NOT EXISTS bot_msg_eski ON bot_messages (created_at);
CREATE UNIQUE INDEX IF NOT EXISTS bot_msg_mid ON bot_messages (dis_mid) WHERE dis_mid IS NOT NULL;

CREATE TABLE IF NOT EXISTS bot_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_id INTEGER NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  konusma_id INTEGER REFERENCES bot_conversations(id) ON DELETE SET NULL,
  kanal TEXT NOT NULL CHECK (kanal IN ('web', 'ig')),
  ad TEXT NOT NULL DEFAULT '',
  eposta TEXT NOT NULL DEFAULT '',
  telefon TEXT NOT NULL DEFAULT '',
  notu TEXT NOT NULL DEFAULT '',
  durum TEXT NOT NULL DEFAULT 'yeni' CHECK (durum IN ('yeni', 'islendi')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS bot_leads_bot ON bot_leads (bot_id, id DESC);
CREATE INDEX IF NOT EXISTS bot_leads_eski ON bot_leads (created_at);
