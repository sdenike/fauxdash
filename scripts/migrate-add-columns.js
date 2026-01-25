const Database = require('better-sqlite3');
const path = require('path');

function migrateDatabase(dbPath) {
  console.log(`Running migration on: ${dbPath}`);
  const db = new Database(dbPath);

  try {
    // Check if columns column exists
    const columnCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('categories')
      WHERE name = 'columns'
    `).get();

    if (columnCheck.count === 0) {
      console.log('Adding columns column to categories table...');
      db.prepare('ALTER TABLE categories ADD COLUMN columns INTEGER NOT NULL DEFAULT 2').run();
      console.log('Successfully added columns column');
    } else {
      console.log('Columns column already exists, skipping migration');
    }
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
