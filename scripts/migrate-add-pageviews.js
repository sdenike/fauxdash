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
        ip_hash TEXT,
        country TEXT,
        country_name TEXT,
        city TEXT,
        region TEXT,
        latitude INTEGER,
        longitude INTEGER,
        timezone TEXT,
        geo_enriched INTEGER DEFAULT 0,
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

    // Check for and add missing columns
    const columns = db.prepare("PRAGMA table_info(pageviews)").all();
    const columnNames = columns.map(c => c.name);

    const columnsToAdd = [
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

    for (const col of columnsToAdd) {
      if (!columnNames.includes(col.name)) {
        console.log(`Adding column ${col.name}...`);
        db.exec(`ALTER TABLE pageviews ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✓ Added ${col.name} column`);
      }
    }
  }
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}

console.log('Migration complete!');
