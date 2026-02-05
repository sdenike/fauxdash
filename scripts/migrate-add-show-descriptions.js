// Migration: Add show_descriptions and show_description columns
const Database = require('better-sqlite3');

const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';
console.log('Running show_descriptions migration on:', dbPath);

const db = new Database(dbPath);

try {
  const tables = [
    { table: 'categories', column: 'show_descriptions' },
    { table: 'bookmarks', column: 'show_description' },
    { table: 'service_categories', column: 'show_descriptions' },
    { table: 'services', column: 'show_description' }
  ];

  for (const { table, column } of tables) {
    const columnCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('${table}')
      WHERE name = '${column}'
    `).get();

    if (columnCheck.count === 0) {
      console.log(`Adding ${column} column to ${table} table...`);
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} INTEGER`).run();
      console.log(`✓ Added ${column} to ${table}`);
    } else {
      console.log(`✓ ${table}.${column} already exists`);
    }
  }

  console.log('show_descriptions migration complete!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
