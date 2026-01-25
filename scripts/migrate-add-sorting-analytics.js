const Database = require('better-sqlite3');
const path = require('path');

function migrateDatabase(dbPath) {
  console.log(`Running sorting and analytics migration on: ${dbPath}`);
  const db = new Database(dbPath);

  try {
    // Check if sort_by column exists in categories table
    const categoriesSortCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('categories')
      WHERE name = 'sort_by'
    `).get();

    if (categoriesSortCheck.count === 0) {
      console.log('Adding sort_by column to categories table...');
      db.prepare("ALTER TABLE categories ADD COLUMN sort_by TEXT DEFAULT 'order'").run();
      console.log('Successfully added sort_by to categories');
    } else {
      console.log('✓ Categories table already has sort_by column');
    }

    // Check if sort_by column exists in service_categories table
    const serviceCategoriesSortCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('service_categories')
      WHERE name = 'sort_by'
    `).get();

    if (serviceCategoriesSortCheck.count === 0) {
      console.log('Adding sort_by column to service_categories table...');
      db.prepare("ALTER TABLE service_categories ADD COLUMN sort_by TEXT DEFAULT 'order'").run();
      console.log('Successfully added sort_by to service_categories');
    } else {
      console.log('✓ Service categories table already has sort_by column');
    }

    // Check if bookmarks click tracking table exists with enhanced analytics
    const bookmarkAnalyticsCheck = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='bookmark_clicks'
    `).get();

    if (!bookmarkAnalyticsCheck) {
      console.log('Creating bookmark_clicks analytics table...');
      db.prepare(`
        CREATE TABLE bookmark_clicks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bookmark_id INTEGER NOT NULL,
          clicked_at INTEGER NOT NULL,
          hour_of_day INTEGER NOT NULL,
          day_of_week INTEGER NOT NULL,
          day_of_month INTEGER NOT NULL,
          FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
        )
      `).run();
      console.log('Successfully created bookmark_clicks table');
    } else {
      console.log('✓ Bookmark clicks table already exists');
    }

    // Check if services click tracking table exists with enhanced analytics
    const serviceAnalyticsCheck = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='service_clicks'
    `).get();

    if (!serviceAnalyticsCheck) {
      console.log('Creating service_clicks analytics table...');
      db.prepare(`
        CREATE TABLE service_clicks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service_id INTEGER NOT NULL,
          clicked_at INTEGER NOT NULL,
          hour_of_day INTEGER NOT NULL,
          day_of_week INTEGER NOT NULL,
          day_of_month INTEGER NOT NULL,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        )
      `).run();
      console.log('Successfully created service_clicks table');
    } else {
      console.log('✓ Service clicks table already exists');
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Get database path from environment or use default
const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';

// Only run if file exists (for SQLite)
const fs = require('fs');
if (fs.existsSync(dbPath)) {
  migrateDatabase(dbPath);
} else {
  console.log('Database does not exist yet, skipping migration');
}
