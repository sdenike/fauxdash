const Database = require('better-sqlite3');

const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';

console.log('Running services migration...');
console.log('DB_PATH:', dbPath);

const db = new Database(dbPath);

try {
  // Check if table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='services'
  `).get();

  if (!tableExists) {
    console.log('Creating services table...');
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
      );
    `);

    console.log('✓ Services table created successfully');
  } else {
    console.log('✓ Services table already exists');
  }
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}

console.log('Migration complete!');
