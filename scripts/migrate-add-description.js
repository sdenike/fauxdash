// Migration: Add description column to bookmarks table
const Database = require('better-sqlite3');

const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';
console.log('Running migration on:', dbPath);

const db = new Database(dbPath);

try {
  // Check if description column exists
  const columnCheck = db.prepare(`
    SELECT COUNT(*) as count FROM pragma_table_info('bookmarks')
    WHERE name = 'description'
  `).get();

  if (columnCheck.count === 0) {
    console.log('Adding description column to bookmarks table...');
    db.prepare('ALTER TABLE bookmarks ADD COLUMN description TEXT').run();
    console.log('Migration completed successfully');
  } else {
    console.log('Description column already exists, skipping migration');
  }
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
