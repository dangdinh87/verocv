-- Hồ Sơ Xanh SaaS Schema for Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  doc_json TEXT NOT NULL,
  is_master INTEGER NOT NULL DEFAULT 0,
  parent_cv_id TEXT,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_resumes_user_updated ON resumes(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS resume_versions (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  doc_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_resume_versions_lookup ON resume_versions(user_id, resume_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cover_letters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  doc_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_letters_user_updated ON cover_letters(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  column_id TEXT NOT NULL,
  app_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_apps_user_updated ON job_applications(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public_links (
  slug TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  doc_snapshot_json TEXT NOT NULL,
  hide_phone INTEGER NOT NULL DEFAULT 0,
  hide_email INTEGER NOT NULL DEFAULT 0,
  passcode_hash TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_public_links_user ON public_links(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS link_events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ref_tag TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (slug) REFERENCES public_links(slug) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_link_events_slug ON link_events(slug, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_orders (
  order_code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount_vnd INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_tx_id TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON payment_orders(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id TEXT PRIMARY KEY,
  actor_key TEXT NOT NULL,
  feature TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_actor ON ai_usage_logs(actor_key, created_at DESC);
