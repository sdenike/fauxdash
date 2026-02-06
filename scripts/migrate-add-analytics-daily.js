const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL?.replace('file:', '') ||
               process.env.DATABASE_PATH ||
               path.join(process.env.DATA_DIR || '/data', 'fauxdash.db');

console.log('Running analytics_daily migration on:', dbPath);

const db = new Database(dbPath);

// Check if table already exists
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='table' AND name='analytics_daily'
`).get();

if (!tableExists) {
  console.log('Creating analytics_daily table...');
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
  db.exec(`CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_analytics_daily_type ON analytics_daily(type)`);
  console.log('analytics_daily table created');
} else {
  console.log('analytics_daily table already exists');
}

db.close();
console.log('Analytics daily migration complete!');
