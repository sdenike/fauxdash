const Database = require('better-sqlite3');

const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';
const db = new Database(dbPath);

console.log('Running migration: Rename mainColumns to bookmarksColumns...');

try {
  db.exec('BEGIN TRANSACTION');

  // Check if mainColumns and bookmarksColumns exist
  const mainColumnsSetting = db.prepare("SELECT * FROM settings WHERE key = 'mainColumns'").get();
  const bookmarksColumnsSetting = db.prepare("SELECT * FROM settings WHERE key = 'bookmarksColumns'").get();

  if (mainColumnsSetting && !bookmarksColumnsSetting) {
    // Rename mainColumns to bookmarksColumns (keeping user_id if present)
    db.prepare("UPDATE settings SET key = 'bookmarksColumns' WHERE key = 'mainColumns'").run();
    console.log('✓ Renamed mainColumns to bookmarksColumns');
  } else if (mainColumnsSetting && bookmarksColumnsSetting) {
    // Both exist - delete mainColumns
    db.prepare("DELETE FROM settings WHERE key = 'mainColumns'").run();
    console.log('✓ Removed duplicate mainColumns setting');
  } else if (mainColumnsSetting) {
    // Just mainColumns exists with user_id - rename it
    db.prepare("UPDATE settings SET key = 'bookmarksColumns' WHERE key = 'mainColumns'").run();
    console.log('✓ Renamed mainColumns to bookmarksColumns');
  } else {
    // Note: We don't create global settings without user_id anymore
    // Defaults are handled by the settings API
    console.log('✓ No mainColumns migration needed');
  }

  // Clean up any orphaned global settings (user_id IS NULL)
  const orphanedCount = db.prepare("DELETE FROM settings WHERE user_id IS NULL").run();
  if (orphanedCount.changes > 0) {
    console.log(`✓ Cleaned up ${orphanedCount.changes} orphaned global settings`);
  }

  db.exec('COMMIT');
  console.log('✓ Migration completed successfully');
} catch (error) {
  db.exec('ROLLBACK');
  console.error('✗ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
