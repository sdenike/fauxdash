// Consolidated migration script — runs all migrations in a single process.
// Each migration is idempotent (checks before altering).

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.SQLITE_FILE ||
               process.env.DATABASE_PATH ||
               '/data/fauxdash.db';

if (!fs.existsSync(dbPath)) {
  console.log('Database does not exist yet, skipping migrations');
  process.exit(0);
}

console.log('Running consolidated migrations on:', dbPath);
const db = new Database(dbPath);

function hasColumn(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some(c => c.name === column);
}

function tableExists(name) {
  return !!db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name);
}

try {
  // 1. Add description column to bookmarks
  if (!hasColumn('bookmarks', 'description')) {
    db.prepare('ALTER TABLE bookmarks ADD COLUMN description TEXT').run();
    console.log('Added description to bookmarks');
  }

  // 2. Add columns column to categories
  if (!hasColumn('categories', 'columns')) {
    db.prepare('ALTER TABLE categories ADD COLUMN columns INTEGER NOT NULL DEFAULT 2').run();
    console.log('Added columns to categories');
  }

  // 3. Create pageviews table + geo columns
  if (!tableExists('pageviews')) {
    db.exec(`
      CREATE TABLE pageviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        ip_hash TEXT,
        country TEXT,
        country_name TEXT,
        city TEXT,
        region TEXT,
        latitude INTEGER,
        longitude INTEGER,
        timezone TEXT,
        geo_enriched INTEGER DEFAULT 0,
        is_demo INTEGER DEFAULT 0 NOT NULL,
        timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_pageviews_timestamp ON pageviews(timestamp)');
    console.log('Created pageviews table');
  } else {
    const pvCols = [
      { name: 'ip_hash', type: 'TEXT' },
      { name: 'country', type: 'TEXT' },
      { name: 'country_name', type: 'TEXT' },
      { name: 'city', type: 'TEXT' },
      { name: 'region', type: 'TEXT' },
      { name: 'latitude', type: 'INTEGER' },
      { name: 'longitude', type: 'INTEGER' },
      { name: 'timezone', type: 'TEXT' },
      { name: 'geo_enriched', type: 'INTEGER DEFAULT 0' },
    ];
    for (const col of pvCols) {
      if (!hasColumn('pageviews', col.name)) {
        db.exec(`ALTER TABLE pageviews ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added ${col.name} to pageviews`);
      }
    }
  }

  // 4. Create services table
  if (!tableExists('services')) {
    db.exec(`
      CREATE TABLE services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      )
    `);
    console.log('Created services table');
  }

  // 5. Create service_categories table + add category_id to services
  if (!tableExists('service_categories')) {
    db.exec(`
      CREATE TABLE service_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        columns INTEGER NOT NULL DEFAULT 1,
        is_visible INTEGER NOT NULL DEFAULT 1,
        requires_auth INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    console.log('Created service_categories table');
  }
  if (!hasColumn('services', 'category_id')) {
    db.exec('ALTER TABLE services ADD COLUMN category_id INTEGER');
    console.log('Added category_id to services');
  }

  // 6. Accordion columns (categories + service_categories)
  for (const table of ['categories', 'service_categories']) {
    if (!hasColumn(table, 'items_to_show')) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN items_to_show INTEGER`).run();
      db.prepare(`ALTER TABLE ${table} ADD COLUMN show_item_count INTEGER NOT NULL DEFAULT 0`).run();
      db.prepare(`ALTER TABLE ${table} ADD COLUMN auto_expanded INTEGER NOT NULL DEFAULT 0`).run();
      console.log(`Added accordion columns to ${table}`);
    }
  }

  // 7. Sorting + click analytics tables
  for (const table of ['categories', 'service_categories']) {
    if (!hasColumn(table, 'sort_by')) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN sort_by TEXT DEFAULT 'order'`).run();
      console.log(`Added sort_by to ${table}`);
    }
  }

  if (!tableExists('bookmark_clicks')) {
    db.exec(`
      CREATE TABLE bookmark_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookmark_id INTEGER NOT NULL,
        clicked_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        hour_of_day INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        day_of_month INTEGER NOT NULL,
        is_demo INTEGER DEFAULT 0 NOT NULL
      )
    `);
    console.log('Created bookmark_clicks table');
  }

  if (!tableExists('service_clicks')) {
    db.exec(`
      CREATE TABLE service_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL,
        clicked_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        hour_of_day INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        day_of_month INTEGER NOT NULL,
        is_demo INTEGER DEFAULT 0 NOT NULL
      )
    `);
    console.log('Created service_clicks table');
  }

  // 8. Uncategorized categories + orphan fix
  db.exec('BEGIN TRANSACTION');
  try {
    function getOrCreateUncategorized(table) {
      const existing = db.prepare(`SELECT id FROM ${table} WHERE name = 'Uncategorized'`).get();
      if (existing) return existing.id;
      const maxOrder = db.prepare(`SELECT COALESCE(MAX("order"), 0) as max FROM ${table}`).get();
      const result = db.prepare(`
        INSERT INTO ${table} (name, icon, "order", columns, is_visible, requires_auth, items_to_show, show_item_count, auto_expanded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('Uncategorized', 'mdi:folder-alert', maxOrder.max + 1, 1, 1, 0, 50, 1, 1);
      return result.lastInsertRowid;
    }

    // Fix bookmarks
    const nullBookmarks = db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE category_id IS NULL').get();
    if (nullBookmarks.count > 0) {
      const catId = getOrCreateUncategorized('categories');
      db.prepare('UPDATE bookmarks SET category_id = ? WHERE category_id IS NULL').run(catId);
      console.log(`Assigned ${nullBookmarks.count} orphaned bookmarks to Uncategorized`);
    }
    const orphanedBookmarks = db.prepare(`SELECT COUNT(*) as count FROM bookmarks WHERE category_id IS NOT NULL AND category_id NOT IN (SELECT id FROM categories)`).get();
    if (orphanedBookmarks.count > 0) {
      const catId = getOrCreateUncategorized('categories');
      db.prepare(`UPDATE bookmarks SET category_id = ? WHERE category_id IS NOT NULL AND category_id NOT IN (SELECT id FROM categories)`).run(catId);
      console.log(`Reassigned ${orphanedBookmarks.count} orphaned bookmarks`);
    }

    // Fix services
    const nullServices = db.prepare('SELECT COUNT(*) as count FROM services WHERE category_id IS NULL').get();
    if (nullServices.count > 0) {
      const catId = getOrCreateUncategorized('service_categories');
      db.prepare('UPDATE services SET category_id = ? WHERE category_id IS NULL').run(catId);
      console.log(`Assigned ${nullServices.count} orphaned services to Uncategorized`);
    }
    const orphanedServices = db.prepare(`SELECT COUNT(*) as count FROM services WHERE category_id IS NOT NULL AND category_id NOT IN (SELECT id FROM service_categories)`).get();
    if (orphanedServices.count > 0) {
      const catId = getOrCreateUncategorized('service_categories');
      db.prepare(`UPDATE services SET category_id = ? WHERE category_id IS NOT NULL AND category_id NOT IN (SELECT id FROM service_categories)`).run(catId);
      console.log(`Reassigned ${orphanedServices.count} orphaned services`);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  // 9. Rename mainColumns to bookmarksColumns
  const mainColumnsSetting = db.prepare("SELECT * FROM settings WHERE key = 'mainColumns'").get();
  const bookmarksColumnsSetting = db.prepare("SELECT * FROM settings WHERE key = 'bookmarksColumns'").get();
  if (mainColumnsSetting && !bookmarksColumnsSetting) {
    db.prepare("UPDATE settings SET key = 'bookmarksColumns' WHERE key = 'mainColumns'").run();
    console.log('Renamed mainColumns to bookmarksColumns');
  } else if (mainColumnsSetting && bookmarksColumnsSetting) {
    db.prepare("DELETE FROM settings WHERE key = 'mainColumns'").run();
    console.log('Removed duplicate mainColumns setting');
  }

  // 10. show_open_all columns
  for (const table of ['categories', 'service_categories']) {
    if (!hasColumn(table, 'show_open_all')) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN show_open_all INTEGER NOT NULL DEFAULT 0`).run();
      console.log(`Added show_open_all to ${table}`);
    }
  }

  // 11. geo_cache table
  if (!tableExists('geo_cache')) {
    db.exec(`
      CREATE TABLE geo_cache (
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
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_geo_cache_ip_hash ON geo_cache(ip_hash)');
    console.log('Created geo_cache table');
  }

  // 12. is_demo flag on all tables
  const demoTables = ['categories', 'bookmarks', 'service_categories', 'services', 'pageviews', 'bookmark_clicks', 'service_clicks'];
  for (const table of demoTables) {
    if (!hasColumn(table, 'is_demo')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN is_demo INTEGER DEFAULT 0`);
      console.log(`Added is_demo to ${table}`);
    }
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_categories_is_demo ON categories(is_demo)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_bookmarks_is_demo ON bookmarks(is_demo)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_service_categories_is_demo ON service_categories(is_demo)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_services_is_demo ON services(is_demo)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_pageviews_is_demo ON pageviews(is_demo)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_bookmark_clicks_is_demo ON bookmark_clicks(is_demo)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_service_clicks_is_demo ON service_clicks(is_demo)');

  // 13. show_descriptions / show_description columns
  const descCols = [
    { table: 'categories', column: 'show_descriptions' },
    { table: 'bookmarks', column: 'show_description' },
    { table: 'service_categories', column: 'show_descriptions' },
    { table: 'services', column: 'show_description' },
  ];
  for (const { table, column } of descCols) {
    if (!hasColumn(table, column)) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} INTEGER`).run();
      console.log(`Added ${column} to ${table}`);
    }
  }

  // 14. password_reset_tokens table
  if (!tableExists('password_reset_tokens')) {
    db.exec(`
      CREATE TABLE password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)');
    console.log('Created password_reset_tokens table');
  }

  // 15. analytics_daily table
  if (!tableExists('analytics_daily')) {
    db.exec(`
      CREATE TABLE analytics_daily (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        item_id INTEGER,
        country TEXT,
        count INTEGER NOT NULL DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_analytics_daily_type ON analytics_daily(type)');
    console.log('Created analytics_daily table');
  }

  console.log('All migrations completed successfully');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
