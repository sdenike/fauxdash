const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL?.replace('file:', '') ||
               process.env.DATABASE_PATH ||
               path.join(process.env.DATA_DIR || '/data', 'fauxdash.db');

console.log('Running demo flag migration on:', dbPath);

const db = new Database(dbPath);

// Tables that need is_demo column
const tables = [
  'categories',
  'bookmarks',
  'service_categories',
  'services',
  'pageviews',
  'bookmark_clicks',
  'service_clicks'
];

tables.forEach(table => {
  // Check if column already exists
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const hasIsDemo = columns.some(col => col.name === 'is_demo');

  if (!hasIsDemo) {
    console.log(`Adding is_demo column to ${table}...`);
    db.exec(`ALTER TABLE ${table} ADD COLUMN is_demo INTEGER DEFAULT 0`);
    console.log(`Added is_demo to ${table}`);
  } else {
    console.log(`${table} already has is_demo column`);
  }
});

// Create index for efficient demo content clearing
const indexName = 'idx_categories_is_demo';
const indexExists = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='index' AND name=?
`).get(indexName);

if (!indexExists) {
  console.log('Creating indexes for demo flag queries...');
  db.exec(`CREATE INDEX IF NOT EXISTS idx_categories_is_demo ON categories(is_demo)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookmarks_is_demo ON bookmarks(is_demo)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_service_categories_is_demo ON service_categories(is_demo)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_services_is_demo ON services(is_demo)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_pageviews_is_demo ON pageviews(is_demo)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookmark_clicks_is_demo ON bookmark_clicks(is_demo)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_service_clicks_is_demo ON service_clicks(is_demo)`);
  console.log('Indexes created');
}

db.close();
console.log('Demo flag migration complete!');
