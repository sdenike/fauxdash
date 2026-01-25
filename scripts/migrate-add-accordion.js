const Database = require('better-sqlite3');
const path = require('path');

function migrateDatabase(dbPath) {
  console.log(`Running accordion migration on: ${dbPath}`);
  const db = new Database(dbPath);

  try {
    // Check if items_to_show column exists in categories table
    const categoriesCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('categories')
      WHERE name = 'items_to_show'
    `).get();

    if (categoriesCheck.count === 0) {
      console.log('Adding accordion columns to categories table...');
      db.prepare('ALTER TABLE categories ADD COLUMN items_to_show INTEGER').run();
      db.prepare('ALTER TABLE categories ADD COLUMN show_item_count INTEGER NOT NULL DEFAULT 0').run();
      db.prepare('ALTER TABLE categories ADD COLUMN auto_expanded INTEGER NOT NULL DEFAULT 0').run();
      console.log('Successfully added accordion columns to categories');
    } else {
      console.log('✓ Categories table already has accordion columns');
    }

    // Check if items_to_show column exists in service_categories table
    const serviceCategoriesCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('service_categories')
      WHERE name = 'items_to_show'
    `).get();

    if (serviceCategoriesCheck.count === 0) {
      console.log('Adding accordion columns to service_categories table...');
      db.prepare('ALTER TABLE service_categories ADD COLUMN items_to_show INTEGER').run();
      db.prepare('ALTER TABLE service_categories ADD COLUMN show_item_count INTEGER NOT NULL DEFAULT 0').run();
      db.prepare('ALTER TABLE service_categories ADD COLUMN auto_expanded INTEGER NOT NULL DEFAULT 0').run();
      console.log('Successfully added accordion columns to service_categories');
    } else {
      console.log('✓ Service categories table already has accordion columns');
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
