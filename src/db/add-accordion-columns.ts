import { getDb } from './index';

const dbProvider = process.env.DB_PROVIDER || 'sqlite';

async function addAccordionColumns() {
  const db = getDb();

  console.log('Adding accordion columns for provider:', dbProvider);

  try {
    if (dbProvider === 'postgres') {
      // PostgreSQL
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS items_to_show INTEGER`);
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_item_count BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS auto_expanded BOOLEAN DEFAULT FALSE NOT NULL`);

      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS items_to_show INTEGER`);
      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS show_item_count BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS auto_expanded BOOLEAN DEFAULT FALSE NOT NULL`);
    } else if (dbProvider === 'mysql') {
      // MySQL
      await db.execute(`ALTER TABLE categories ADD COLUMN items_to_show INT`);
      await db.execute(`ALTER TABLE categories ADD COLUMN show_item_count BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE categories ADD COLUMN auto_expanded BOOLEAN DEFAULT FALSE NOT NULL`);

      await db.execute(`ALTER TABLE service_categories ADD COLUMN items_to_show INT`);
      await db.execute(`ALTER TABLE service_categories ADD COLUMN show_item_count BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE service_categories ADD COLUMN auto_expanded BOOLEAN DEFAULT FALSE NOT NULL`);
    } else {
      // SQLite
      const sql = await import('better-sqlite3');
      const database = db as any;

      // Check if columns exist
      const categoriesInfo = database.prepare("PRAGMA table_info(categories)").all();
      const hasItemsToShow = categoriesInfo.some((col: any) => col.name === 'items_to_show');

      if (!hasItemsToShow) {
        database.prepare(`ALTER TABLE categories ADD COLUMN items_to_show INTEGER`).run();
        database.prepare(`ALTER TABLE categories ADD COLUMN show_item_count INTEGER DEFAULT 0 NOT NULL`).run();
        database.prepare(`ALTER TABLE categories ADD COLUMN auto_expanded INTEGER DEFAULT 0 NOT NULL`).run();

        database.prepare(`ALTER TABLE service_categories ADD COLUMN items_to_show INTEGER`).run();
        database.prepare(`ALTER TABLE service_categories ADD COLUMN show_item_count INTEGER DEFAULT 0 NOT NULL`).run();
        database.prepare(`ALTER TABLE service_categories ADD COLUMN auto_expanded INTEGER DEFAULT 0 NOT NULL`).run();

        console.log('Accordion columns added successfully');
      } else {
        console.log('Accordion columns already exist');
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addAccordionColumns();
