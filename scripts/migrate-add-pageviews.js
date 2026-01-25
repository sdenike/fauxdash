const Database = require('better-sqlite3');

const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';

console.log('Running pageviews migration...');
console.log('DB_PATH:', dbPath);

const db = new Database(dbPath);

try {
  // Check if table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='pageviews'
  `).get();

  if (!tableExists) {
    console.log('Creating pageviews table...');
    db.exec(`
      CREATE TABLE pageviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Create index for faster queries
    db.exec(`
      CREATE INDEX idx_pageviews_timestamp ON pageviews(timestamp);
    `);

    console.log('✓ Pageviews table created successfully');
  } else {
    console.log('✓ Pageviews table already exists');
  }
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}

console.log('Migration complete!');
