const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL?.replace('file:', '') ||
               process.env.DATABASE_PATH ||
               path.join(process.env.DATA_DIR || '/data', 'fauxdash.db');

console.log('Running geo_cache migration on:', dbPath);

const db = new Database(dbPath);

// Check if table exists
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='table' AND name='geo_cache'
`).get();

if (!tableExists) {
  console.log('Creating geo_cache table...');
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
  db.exec(`CREATE INDEX IF NOT EXISTS idx_geo_cache_ip_hash ON geo_cache(ip_hash)`);
  console.log('geo_cache table created');
} else {
  console.log('geo_cache table already exists');
}

db.close();
console.log('Migration complete!');
