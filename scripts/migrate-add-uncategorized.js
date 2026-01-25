const Database = require('better-sqlite3');

const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';
const db = new Database(dbPath);

console.log('Running migration: Add uncategorized categories...');

try {
  db.exec('BEGIN TRANSACTION');

  // Check for uncategorized bookmarks
  const uncategorizedBookmarks = db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE category_id IS NULL').get();

  if (uncategorizedBookmarks.count > 0) {
    console.log(`Found ${uncategorizedBookmarks.count} uncategorized bookmarks`);

    // Create Uncategorized category for bookmarks if it doesn't exist
    const existingBookmarkCategory = db.prepare("SELECT id FROM categories WHERE name = 'Uncategorized'").get();

    let bookmarkCategoryId;
    if (!existingBookmarkCategory) {
      const maxOrder = db.prepare('SELECT COALESCE(MAX("order"), 0) as max FROM categories').get();
      const result = db.prepare(`
        INSERT INTO categories (name, icon, "order", columns, is_visible, requires_auth, items_to_show, show_item_count, auto_expanded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('Uncategorized', 'mdi:folder-alert', maxOrder.max + 1, 1, 1, 0, 50, 1, 1);
      bookmarkCategoryId = result.lastInsertRowid;
      console.log('✓ Created Uncategorized category for bookmarks');
    } else {
      bookmarkCategoryId = existingBookmarkCategory.id;
      console.log('✓ Using existing Uncategorized category for bookmarks');
    }

    // Assign uncategorized bookmarks
    db.prepare('UPDATE bookmarks SET category_id = ? WHERE category_id IS NULL').run(bookmarkCategoryId);
    console.log(`✓ Assigned ${uncategorizedBookmarks.count} bookmarks to Uncategorized category`);
  } else {
    console.log('✓ No uncategorized bookmarks found');
  }

  // Check for uncategorized services
  const uncategorizedServices = db.prepare('SELECT COUNT(*) as count FROM services WHERE category_id IS NULL').get();

  if (uncategorizedServices.count > 0) {
    console.log(`Found ${uncategorizedServices.count} uncategorized services`);

    // Create Uncategorized category for services if it doesn't exist
    const existingServiceCategory = db.prepare("SELECT id FROM service_categories WHERE name = 'Uncategorized'").get();

    let serviceCategoryId;
    if (!existingServiceCategory) {
      const maxOrder = db.prepare('SELECT COALESCE(MAX("order"), 0) as max FROM service_categories').get();
      const result = db.prepare(`
        INSERT INTO service_categories (name, icon, "order", columns, is_visible, requires_auth, items_to_show, show_item_count, auto_expanded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('Uncategorized', 'mdi:folder-alert', maxOrder.max + 1, 1, 1, 0, 50, 1, 1);
      serviceCategoryId = result.lastInsertRowid;
      console.log('✓ Created Uncategorized category for services');
    } else {
      serviceCategoryId = existingServiceCategory.id;
      console.log('✓ Using existing Uncategorized category for services');
    }

    // Assign uncategorized services
    db.prepare('UPDATE services SET category_id = ? WHERE category_id IS NULL').run(serviceCategoryId);
    console.log(`✓ Assigned ${uncategorizedServices.count} services to Uncategorized category`);
  } else {
    console.log('✓ No uncategorized services found');
  }

  // Note: Global settings are no longer created here
  // Settings are user-specific and defaults are handled by the settings API

  db.exec('COMMIT');
  console.log('✓ Migration completed successfully');
} catch (error) {
  db.exec('ROLLBACK');
  console.error('✗ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
