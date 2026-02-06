import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDb } from './index';
import * as argon2 from 'argon2';
import { users } from './schema';

async function runMigrations() {
  const db = getDb();

  console.log('Running migrations...');

  try {
    migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');

    // Add accordion columns if they don't exist
    addAccordionColumns(db);

    // Add name fields if they don't exist
    addNameFields(db);

    // Add description visibility columns if they don't exist
    addDescriptionVisibilityColumns(db);

    // Add all missing columns (sort_by, is_demo, show_open_all)
    addMissingColumns(db);

    // Create password reset tokens table if it doesn't exist
    createPasswordResetTokensTable(db);

    // Create analytics and other tables if they don't exist
    createMissingTables(db);

    // Create default admin user if none exists
    await createDefaultAdmin(db);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

function addAccordionColumns(db: any) {
  try {
    console.log('Checking for accordion columns...');

    const rawDb = (db as any).session?.client;
    if (!rawDb) return;

    const catInfo = rawDb.prepare("PRAGMA table_info(categories)").all();
    const hasItemsToShow = catInfo.some((col: any) => col.name === 'items_to_show');

    if (!hasItemsToShow) {
      rawDb.prepare(`ALTER TABLE categories ADD COLUMN items_to_show INTEGER`).run();
      rawDb.prepare(`ALTER TABLE categories ADD COLUMN show_item_count INTEGER DEFAULT 0 NOT NULL`).run();
      rawDb.prepare(`ALTER TABLE categories ADD COLUMN auto_expanded INTEGER DEFAULT 0 NOT NULL`).run();

      rawDb.prepare(`ALTER TABLE service_categories ADD COLUMN items_to_show INTEGER`).run();
      rawDb.prepare(`ALTER TABLE service_categories ADD COLUMN show_item_count INTEGER DEFAULT 0 NOT NULL`).run();
      rawDb.prepare(`ALTER TABLE service_categories ADD COLUMN auto_expanded INTEGER DEFAULT 0 NOT NULL`).run();

      console.log('Accordion columns added successfully');
    } else {
      console.log('Accordion columns already exist');
    }
  } catch (error) {
    console.error('Failed to add accordion columns:', error);
  }
}

function addNameFields(db: any) {
  try {
    console.log('Checking for name fields...');

    const rawDb = (db as any).session?.client;
    if (!rawDb) return;

    const usersInfo = rawDb.prepare("PRAGMA table_info(users)").all();
    const hasFirstname = usersInfo.some((col: any) => col.name === 'firstname');

    if (!hasFirstname) {
      rawDb.prepare(`ALTER TABLE users ADD COLUMN firstname TEXT`).run();
      rawDb.prepare(`ALTER TABLE users ADD COLUMN lastname TEXT`).run();
      console.log('Name fields added successfully');
    } else {
      console.log('Name fields already exist');
    }
  } catch (error) {
    console.error('Failed to add name fields:', error);
  }
}

function addDescriptionVisibilityColumns(db: any) {
  try {
    console.log('Checking for description visibility columns...');

    const rawDb = (db as any).session?.client;
    if (!rawDb) return;

    const categoriesInfo = rawDb.prepare("PRAGMA table_info(categories)").all();
    if (!categoriesInfo.some((col: any) => col.name === 'show_descriptions')) {
      rawDb.prepare(`ALTER TABLE categories ADD COLUMN show_descriptions INTEGER`).run();
      console.log('Added show_descriptions to categories');
    }

    const serviceCategoriesInfo = rawDb.prepare("PRAGMA table_info(service_categories)").all();
    if (!serviceCategoriesInfo.some((col: any) => col.name === 'show_descriptions')) {
      rawDb.prepare(`ALTER TABLE service_categories ADD COLUMN show_descriptions INTEGER`).run();
      console.log('Added show_descriptions to service_categories');
    }

    const bookmarksInfo = rawDb.prepare("PRAGMA table_info(bookmarks)").all();
    if (!bookmarksInfo.some((col: any) => col.name === 'show_description')) {
      rawDb.prepare(`ALTER TABLE bookmarks ADD COLUMN show_description INTEGER`).run();
      console.log('Added show_description to bookmarks');
    }

    const servicesInfo = rawDb.prepare("PRAGMA table_info(services)").all();
    if (!servicesInfo.some((col: any) => col.name === 'show_description')) {
      rawDb.prepare(`ALTER TABLE services ADD COLUMN show_description INTEGER`).run();
      console.log('Added show_description to services');
    }

    console.log('Description visibility columns ready');
  } catch (error) {
    console.error('Failed to add description visibility columns:', error);
  }
}

function addMissingColumns(db: any) {
  try {
    console.log('Checking for missing columns...');

    const rawDb = (db as any).session?.client;
    if (!rawDb) return;

    // Check categories table
    const categoriesInfo = rawDb.prepare("PRAGMA table_info(categories)").all();
    if (!categoriesInfo.some((col: any) => col.name === 'sort_by')) {
      rawDb.prepare(`ALTER TABLE categories ADD COLUMN sort_by TEXT DEFAULT 'order'`).run();
      console.log('Added sort_by to categories');
    }
    if (!categoriesInfo.some((col: any) => col.name === 'is_demo')) {
      rawDb.prepare(`ALTER TABLE categories ADD COLUMN is_demo INTEGER DEFAULT 0 NOT NULL`).run();
      console.log('Added is_demo to categories');
    }
    if (!categoriesInfo.some((col: any) => col.name === 'show_open_all')) {
      rawDb.prepare(`ALTER TABLE categories ADD COLUMN show_open_all INTEGER DEFAULT 0 NOT NULL`).run();
      console.log('Added show_open_all to categories');
    }
    if (!categoriesInfo.some((col: any) => col.name === 'show_descriptions')) {
      rawDb.prepare(`ALTER TABLE categories ADD COLUMN show_descriptions INTEGER`).run();
      console.log('Added show_descriptions to categories');
    }

    // Check bookmarks table
    const bookmarksInfo = rawDb.prepare("PRAGMA table_info(bookmarks)").all();
    if (!bookmarksInfo.some((col: any) => col.name === 'is_demo')) {
      rawDb.prepare(`ALTER TABLE bookmarks ADD COLUMN is_demo INTEGER DEFAULT 0 NOT NULL`).run();
      console.log('Added is_demo to bookmarks');
    }
    if (!bookmarksInfo.some((col: any) => col.name === 'show_description')) {
      rawDb.prepare(`ALTER TABLE bookmarks ADD COLUMN show_description INTEGER`).run();
      console.log('Added show_description to bookmarks');
    }

    // Check service_categories table
    const serviceCategoriesInfo = rawDb.prepare("PRAGMA table_info(service_categories)").all();
    if (!serviceCategoriesInfo.some((col: any) => col.name === 'sort_by')) {
      rawDb.prepare(`ALTER TABLE service_categories ADD COLUMN sort_by TEXT DEFAULT 'order'`).run();
      console.log('Added sort_by to service_categories');
    }
    if (!serviceCategoriesInfo.some((col: any) => col.name === 'is_demo')) {
      rawDb.prepare(`ALTER TABLE service_categories ADD COLUMN is_demo INTEGER DEFAULT 0 NOT NULL`).run();
      console.log('Added is_demo to service_categories');
    }
    if (!serviceCategoriesInfo.some((col: any) => col.name === 'show_open_all')) {
      rawDb.prepare(`ALTER TABLE service_categories ADD COLUMN show_open_all INTEGER DEFAULT 0 NOT NULL`).run();
      console.log('Added show_open_all to service_categories');
    }
    if (!serviceCategoriesInfo.some((col: any) => col.name === 'show_descriptions')) {
      rawDb.prepare(`ALTER TABLE service_categories ADD COLUMN show_descriptions INTEGER`).run();
      console.log('Added show_descriptions to service_categories');
    }

    // Check services table
    const servicesInfo = rawDb.prepare("PRAGMA table_info(services)").all();
    if (!servicesInfo.some((col: any) => col.name === 'is_demo')) {
      rawDb.prepare(`ALTER TABLE services ADD COLUMN is_demo INTEGER DEFAULT 0 NOT NULL`).run();
      console.log('Added is_demo to services');
    }
    if (!servicesInfo.some((col: any) => col.name === 'show_description')) {
      rawDb.prepare(`ALTER TABLE services ADD COLUMN show_description INTEGER`).run();
      console.log('Added show_description to services');
    }

    console.log('All missing columns added');
  } catch (error) {
    console.error('Failed to add missing columns:', error);
  }
}

function createPasswordResetTokensTable(db: any) {
  try {
    console.log('Checking for password_reset_tokens table...');

    const rawDb = (db as any).session?.client;
    if (!rawDb) return;

    rawDb.prepare(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        used INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
      )
    `).run();
    console.log('password_reset_tokens table ready');
  } catch (error) {
    console.error('Failed to create password_reset_tokens table:', error);
  }
}

function createMissingTables(db: any) {
  try {
    console.log('Checking for missing tables...');

    const rawDb = (db as any).session?.client;
    if (!rawDb) return;

    rawDb.prepare(`
      CREATE TABLE IF NOT EXISTS analytics_daily (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        item_id INTEGER,
        country TEXT,
        count INTEGER NOT NULL DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0
      )
    `).run();

    rawDb.prepare(`
      CREATE TABLE IF NOT EXISTS geo_cache (
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
        created_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
        expires_at INTEGER
      )
    `).run();

    rawDb.prepare(`
      CREATE TABLE IF NOT EXISTS bookmark_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookmark_id INTEGER NOT NULL,
        clicked_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
        hour_of_day INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        day_of_month INTEGER NOT NULL,
        is_demo INTEGER DEFAULT 0 NOT NULL
      )
    `).run();

    rawDb.prepare(`
      CREATE TABLE IF NOT EXISTS service_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL,
        clicked_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
        hour_of_day INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        day_of_month INTEGER NOT NULL,
        is_demo INTEGER DEFAULT 0 NOT NULL
      )
    `).run();

    console.log('All tables ready');
  } catch (error) {
    console.error('Failed to create missing tables:', error);
  }
}

async function createDefaultAdmin(db: any) {
  try {
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length === 0) {
      const defaultPassword = 'admin';
      const passwordHash = await argon2.hash(defaultPassword);

      await db.insert(users).values({
        email: 'admin@fauxdash.local',
        username: 'admin',
        passwordHash,
        isAdmin: true,
      });

      console.log('');
      console.log('='.repeat(60));
      console.log('Default admin user created!');
      console.log('Email: admin@fauxdash.local');
      console.log('Password: admin');
      console.log('PLEASE CHANGE THIS PASSWORD IMMEDIATELY!');
      console.log('='.repeat(60));
      console.log('');
    }
  } catch (error) {
    console.error('Failed to create default admin:', error);
  }
}

runMigrations();
