const Database = require('better-sqlite3');
const crypto = require('crypto');

// Database initialization for SQLite (default)
const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';
console.log('Initializing database at:', dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT,
    firstname TEXT,
    lastname TEXT,
    password_hash TEXT,
    is_admin INTEGER NOT NULL DEFAULT 0,
    oidc_subject TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    columns INTEGER NOT NULL DEFAULT 1,
    is_visible INTEGER NOT NULL DEFAULT 1,
    requires_auth INTEGER NOT NULL DEFAULT 0,
    items_to_show INTEGER DEFAULT 5,
    show_item_count INTEGER NOT NULL DEFAULT 1,
    auto_expanded INTEGER NOT NULL DEFAULT 0,
    sort_by TEXT DEFAULT 'order',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_visible INTEGER NOT NULL DEFAULT 1,
    requires_auth INTEGER NOT NULL DEFAULT 0,
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    key TEXT NOT NULL,
    value TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    palette TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS pageviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_visible INTEGER NOT NULL DEFAULT 1,
    requires_auth INTEGER NOT NULL DEFAULT 0,
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS service_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    columns INTEGER NOT NULL DEFAULT 1,
    is_visible INTEGER NOT NULL DEFAULT 1,
    requires_auth INTEGER NOT NULL DEFAULT 0,
    items_to_show INTEGER DEFAULT 5,
    show_item_count INTEGER NOT NULL DEFAULT 1,
    auto_expanded INTEGER NOT NULL DEFAULT 0,
    sort_by TEXT DEFAULT 'order',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS bookmark_clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id INTEGER NOT NULL,
    clicked_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    hour_of_day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    day_of_month INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS service_clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    clicked_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    hour_of_day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    day_of_month INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS geo_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_hash TEXT NOT NULL UNIQUE,
    country TEXT,
    country_name TEXT,
    city TEXT,
    region TEXT,
    latitude INTEGER,
    longitude INTEGER,
    timezone TEXT,
    provider TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS analytics_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    item_id INTEGER,
    country TEXT,
    count INTEGER NOT NULL DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_pageviews_timestamp ON pageviews(timestamp);
  CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
  CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_geo_cache_ip_hash ON geo_cache(ip_hash);
  CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);
  CREATE INDEX IF NOT EXISTS idx_analytics_daily_type ON analytics_daily(type);
`);

// No default admin user is created here — the browser-based setup wizard
// at /setup handles first-time account creation.
console.log('Database schema initialized');
db.close();
