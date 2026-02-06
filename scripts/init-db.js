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

  CREATE INDEX IF NOT EXISTS idx_pageviews_timestamp ON pageviews(timestamp);
  CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
  CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
`);

// Check if admin user exists and create if needed
// Note: Default settings are not created here - they are handled by the settings API
// which returns hardcoded defaults when no user-specific settings exist
async function createAdminUser() {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();

  if (existingUsers.count === 0) {
    const argon2 = require('argon2');
    const passwordHash = await argon2.hash('admin');

    db.prepare(`
      INSERT INTO users (email, username, password_hash, is_admin)
      VALUES (?, ?, ?, ?)
    `).run('admin@fauxdash.local', 'admin', passwordHash, 1);

    console.log('');
    console.log('='.repeat(60));
    console.log('Default admin user created!');
    console.log('Email: admin@fauxdash.local');
    console.log('Password: admin');
    console.log('PLEASE CHANGE THIS PASSWORD IMMEDIATELY!');
    console.log('='.repeat(60));
    console.log('');
  } else {
    console.log('Database already initialized with users');
  }

  db.close();
}

createAdminUser().catch(err => {
  console.error('Failed to create admin user:', err);
  db.close();
  process.exit(1);
});
