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
