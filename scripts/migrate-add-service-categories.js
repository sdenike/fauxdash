const Database = require('better-sqlite3');

const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';

console.log('Running service categories migration...');
console.log('DB_PATH:', dbPath);

const db = new Database(dbPath);

try {
  // Check if service_categories table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='service_categories'
  `).get();

  if (!tableExists) {
    console.log('Creating service_categories table...');

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
      );
    `);

    console.log('✓ Service categories table created');
  } else {
    console.log('✓ Service categories table already exists');
  }

  // Check if services table has category_id column
  const columns = db.prepare(`PRAGMA table_info(services)`).all();
  const hasCategoryId = columns.some(col => col.name === 'category_id');

  if (!hasCategoryId) {
    console.log('Adding category_id column to services table...');
    db.exec(`ALTER TABLE services ADD COLUMN category_id INTEGER`);
    console.log('✓ Added category_id column');
  } else {
    console.log('✓ Services table already has category_id column');
  }

  console.log('Migration complete!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
