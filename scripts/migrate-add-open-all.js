const Database = require('better-sqlite3');
const path = require('path');

function migrateDatabase(dbPath) {
  console.log(`Running showOpenAll migration on: ${dbPath}`);
  const db = new Database(dbPath);

  try {
    // Check if show_open_all column exists in categories table
    const categoriesCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('categories')
      WHERE name = 'show_open_all'
    `).get();

    if (categoriesCheck.count === 0) {
      console.log('Adding show_open_all column to categories table...');
      db.prepare('ALTER TABLE categories ADD COLUMN show_open_all INTEGER NOT NULL DEFAULT 0').run();
      console.log('Successfully added show_open_all column to categories');
    } else {
      console.log('✓ Categories table already has show_open_all column');
    }

    // Check if show_open_all column exists in service_categories table
    const serviceCategoriesCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('service_categories')
      WHERE name = 'show_open_all'
    `).get();

    if (serviceCategoriesCheck.count === 0) {
      console.log('Adding show_open_all column to service_categories table...');
      db.prepare('ALTER TABLE service_categories ADD COLUMN show_open_all INTEGER NOT NULL DEFAULT 0').run();
      console.log('Successfully added show_open_all column to service_categories');
    } else {
      console.log('✓ Service categories table already has show_open_all column');
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
