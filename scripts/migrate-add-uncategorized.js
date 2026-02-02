const Database = require('better-sqlite3');

const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';
const db = new Database(dbPath);

console.log('Running migration: Add uncategorized categories...');

try {
  db.exec('BEGIN TRANSACTION');

  // Helper function to get or create Uncategorized bookmark category
  function getOrCreateBookmarkUncategorized() {
    const existing = db.prepare("SELECT id FROM categories WHERE name = 'Uncategorized'").get();
    if (existing) {
      return existing.id;
    }
    const maxOrder = db.prepare('SELECT COALESCE(MAX("order"), 0) as max FROM categories').get();
    const result = db.prepare(`
      INSERT INTO categories (name, icon, "order", columns, is_visible, requires_auth, items_to_show, show_item_count, auto_expanded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('Uncategorized', 'mdi:folder-alert', maxOrder.max + 1, 1, 1, 0, 50, 1, 1);
    console.log('✓ Created Uncategorized category for bookmarks');
    return result.lastInsertRowid;
  }

  // Helper function to get or create Uncategorized service category
  function getOrCreateServiceUncategorized() {
    const existing = db.prepare("SELECT id FROM service_categories WHERE name = 'Uncategorized'").get();
    if (existing) {
      return existing.id;
    }
    const maxOrder = db.prepare('SELECT COALESCE(MAX("order"), 0) as max FROM service_categories').get();
    const result = db.prepare(`
      INSERT INTO service_categories (name, icon, "order", columns, is_visible, requires_auth, items_to_show, show_item_count, auto_expanded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('Uncategorized', 'mdi:folder-alert', maxOrder.max + 1, 1, 1, 0, 50, 1, 1);
    console.log('✓ Created Uncategorized category for services');
    return result.lastInsertRowid;
  }

  // Check for bookmarks with NULL category_id
  const nullCategoryBookmarks = db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE category_id IS NULL').get();
  if (nullCategoryBookmarks.count > 0) {
    console.log(`Found ${nullCategoryBookmarks.count} bookmarks with NULL category`);
    const bookmarkCategoryId = getOrCreateBookmarkUncategorized();
    db.prepare('UPDATE bookmarks SET category_id = ? WHERE category_id IS NULL').run(bookmarkCategoryId);
    console.log(`✓ Assigned ${nullCategoryBookmarks.count} bookmarks to Uncategorized category`);
  }

  // Check for bookmarks with orphaned category_id (pointing to deleted categories)
  const orphanedBookmarks = db.prepare(`
    SELECT COUNT(*) as count FROM bookmarks
    WHERE category_id IS NOT NULL
    AND category_id NOT IN (SELECT id FROM categories)
  `).get();
  if (orphanedBookmarks.count > 0) {
    console.log(`Found ${orphanedBookmarks.count} bookmarks with orphaned category references`);
    const bookmarkCategoryId = getOrCreateBookmarkUncategorized();
    db.prepare(`
      UPDATE bookmarks SET category_id = ?
      WHERE category_id IS NOT NULL
      AND category_id NOT IN (SELECT id FROM categories)
    `).run(bookmarkCategoryId);
    console.log(`✓ Reassigned ${orphanedBookmarks.count} orphaned bookmarks to Uncategorized category`);
  }

  if (nullCategoryBookmarks.count === 0 && orphanedBookmarks.count === 0) {
    console.log('✓ No uncategorized or orphaned bookmarks found');
  }

  // Check for services with NULL category_id
  const nullCategoryServices = db.prepare('SELECT COUNT(*) as count FROM services WHERE category_id IS NULL').get();
  if (nullCategoryServices.count > 0) {
    console.log(`Found ${nullCategoryServices.count} services with NULL category`);
    const serviceCategoryId = getOrCreateServiceUncategorized();
    db.prepare('UPDATE services SET category_id = ? WHERE category_id IS NULL').run(serviceCategoryId);
    console.log(`✓ Assigned ${nullCategoryServices.count} services to Uncategorized category`);
  }

  // Check for services with orphaned category_id (pointing to deleted categories)
  const orphanedServices = db.prepare(`
    SELECT COUNT(*) as count FROM services
    WHERE category_id IS NOT NULL
    AND category_id NOT IN (SELECT id FROM service_categories)
  `).get();
  if (orphanedServices.count > 0) {
    console.log(`Found ${orphanedServices.count} services with orphaned category references`);
    const serviceCategoryId = getOrCreateServiceUncategorized();
    db.prepare(`
      UPDATE services SET category_id = ?
      WHERE category_id IS NOT NULL
      AND category_id NOT IN (SELECT id FROM service_categories)
    `).run(serviceCategoryId);
    console.log(`✓ Reassigned ${orphanedServices.count} orphaned services to Uncategorized category`);
  }

  if (nullCategoryServices.count === 0 && orphanedServices.count === 0) {
    console.log('✓ No uncategorized or orphaned services found');
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
