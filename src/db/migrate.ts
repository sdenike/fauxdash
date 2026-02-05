import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import { migrate as migrateMySQL } from 'drizzle-orm/mysql2/migrator';
import { getDb } from './index';
import * as argon2 from 'argon2';
import { users } from './schema';

const dbProvider = process.env.DB_PROVIDER || 'sqlite';

async function runMigrations() {
  const db = getDb();

  console.log('Running migrations for provider:', dbProvider);

  try {
    if (dbProvider === 'postgres') {
      await migratePostgres(db, { migrationsFolder: './drizzle' });
    } else if (dbProvider === 'mysql') {
      await migrateMySQL(db, { migrationsFolder: './drizzle' });
    } else {
      migrate(db, { migrationsFolder: './drizzle' });
    }

    console.log('Migrations completed successfully');

    // Add accordion columns if they don't exist
    await addAccordionColumns(db);

    // Add name fields if they don't exist
    await addNameFields(db);

    // Add description visibility columns if they don't exist
    await addDescriptionVisibilityColumns(db);

    // Add all missing columns (sort_by, is_demo, show_open_all)
    await addMissingColumns(db);

    // Create password reset tokens table if it doesn't exist
    await createPasswordResetTokensTable(db);

    // Create analytics and other tables if they don't exist
    await createMissingTables(db);

    // Create default admin user if none exists
    await createDefaultAdmin(db);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

async function addAccordionColumns(db: any) {
  try {
    console.log('Checking for accordion columns...');

    if (dbProvider === 'sqlite') {
      // Check if columns exist
      const categoriesInfo = db.prepare("PRAGMA table_info(categories)").all();
      const hasItemsToShow = categoriesInfo.some((col: any) => col.name === 'items_to_show');

      if (!hasItemsToShow) {
        db.prepare(`ALTER TABLE categories ADD COLUMN items_to_show INTEGER`).run();
        db.prepare(`ALTER TABLE categories ADD COLUMN show_item_count INTEGER DEFAULT 0 NOT NULL`).run();
        db.prepare(`ALTER TABLE categories ADD COLUMN auto_expanded INTEGER DEFAULT 0 NOT NULL`).run();

        db.prepare(`ALTER TABLE service_categories ADD COLUMN items_to_show INTEGER`).run();
        db.prepare(`ALTER TABLE service_categories ADD COLUMN show_item_count INTEGER DEFAULT 0 NOT NULL`).run();
        db.prepare(`ALTER TABLE service_categories ADD COLUMN auto_expanded INTEGER DEFAULT 0 NOT NULL`).run();

        console.log('Accordion columns added successfully');
      } else {
        console.log('Accordion columns already exist');
      }
    } else if (dbProvider === 'postgres') {
      // PostgreSQL
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS items_to_show INTEGER`);
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_item_count BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS auto_expanded BOOLEAN DEFAULT FALSE NOT NULL`);

      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS items_to_show INTEGER`);
      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS show_item_count BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS auto_expanded BOOLEAN DEFAULT FALSE NOT NULL`);

      console.log('Accordion columns added successfully');
    } else if (dbProvider === 'mysql') {
      // MySQL - need to check if columns exist first
      try {
        await db.execute(`ALTER TABLE categories ADD COLUMN items_to_show INT`);
        await db.execute(`ALTER TABLE categories ADD COLUMN show_item_count BOOLEAN DEFAULT FALSE NOT NULL`);
        await db.execute(`ALTER TABLE categories ADD COLUMN auto_expanded BOOLEAN DEFAULT FALSE NOT NULL`);

        await db.execute(`ALTER TABLE service_categories ADD COLUMN items_to_show INT`);
        await db.execute(`ALTER TABLE service_categories ADD COLUMN show_item_count BOOLEAN DEFAULT FALSE NOT NULL`);
        await db.execute(`ALTER TABLE service_categories ADD COLUMN auto_expanded BOOLEAN DEFAULT FALSE NOT NULL`);

        console.log('Accordion columns added successfully');
      } catch (error: any) {
        if (error.message.includes('Duplicate column')) {
          console.log('Accordion columns already exist');
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Failed to add accordion columns:', error);
  }
}

async function addNameFields(db: any) {
  try {
    console.log('Checking for name fields...');

    if (dbProvider === 'sqlite') {
      // Check if columns exist
      const usersInfo = db.prepare("PRAGMA table_info(users)").all();
      const hasFirstname = usersInfo.some((col: any) => col.name === 'firstname');

      if (!hasFirstname) {
        db.prepare(`ALTER TABLE users ADD COLUMN firstname TEXT`).run();
        db.prepare(`ALTER TABLE users ADD COLUMN lastname TEXT`).run();
        console.log('Name fields added successfully');
      } else {
        console.log('Name fields already exist');
      }
    } else if (dbProvider === 'postgres') {
      // PostgreSQL
      await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname VARCHAR(100)`);
      await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname VARCHAR(100)`);
      console.log('Name fields added successfully');
    } else if (dbProvider === 'mysql') {
      // MySQL - need to check if columns exist first
      try {
        await db.execute(`ALTER TABLE users ADD COLUMN firstname VARCHAR(100)`);
        await db.execute(`ALTER TABLE users ADD COLUMN lastname VARCHAR(100)`);
        console.log('Name fields added successfully');
      } catch (error: any) {
        if (error.message.includes('Duplicate column')) {
          console.log('Name fields already exist');
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Failed to add name fields:', error);
  }
}

async function addDescriptionVisibilityColumns(db: any) {
  try {
    console.log('Checking for description visibility columns...');

    if (dbProvider === 'sqlite') {
      // Check and add show_descriptions to categories
      const categoriesInfo = db.prepare("PRAGMA table_info(categories)").all();
      if (!categoriesInfo.some((col: any) => col.name === 'show_descriptions')) {
        db.prepare(`ALTER TABLE categories ADD COLUMN show_descriptions INTEGER`).run();
        console.log('Added show_descriptions to categories');
      }

      // Check and add show_descriptions to service_categories
      const serviceCategoriesInfo = db.prepare("PRAGMA table_info(service_categories)").all();
      if (!serviceCategoriesInfo.some((col: any) => col.name === 'show_descriptions')) {
        db.prepare(`ALTER TABLE service_categories ADD COLUMN show_descriptions INTEGER`).run();
        console.log('Added show_descriptions to service_categories');
      }

      // Check and add show_description to bookmarks
      const bookmarksInfo = db.prepare("PRAGMA table_info(bookmarks)").all();
      if (!bookmarksInfo.some((col: any) => col.name === 'show_description')) {
        db.prepare(`ALTER TABLE bookmarks ADD COLUMN show_description INTEGER`).run();
        console.log('Added show_description to bookmarks');
      }

      // Check and add show_description to services
      const servicesInfo = db.prepare("PRAGMA table_info(services)").all();
      if (!servicesInfo.some((col: any) => col.name === 'show_description')) {
        db.prepare(`ALTER TABLE services ADD COLUMN show_description INTEGER`).run();
        console.log('Added show_description to services');
      }

      console.log('Description visibility columns ready');
    } else if (dbProvider === 'postgres') {
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_descriptions INTEGER`);
      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS show_descriptions INTEGER`);
      await db.execute(`ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS show_description INTEGER`);
      await db.execute(`ALTER TABLE services ADD COLUMN IF NOT EXISTS show_description INTEGER`);
      console.log('Description visibility columns ready');
    } else if (dbProvider === 'mysql') {
      try {
        await db.execute(`ALTER TABLE categories ADD COLUMN show_descriptions INT`);
      } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try {
        await db.execute(`ALTER TABLE service_categories ADD COLUMN show_descriptions INT`);
      } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try {
        await db.execute(`ALTER TABLE bookmarks ADD COLUMN show_description INT`);
      } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try {
        await db.execute(`ALTER TABLE services ADD COLUMN show_description INT`);
      } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      console.log('Description visibility columns ready');
    }
  } catch (error) {
    console.error('Failed to add description visibility columns:', error);
  }
}

async function addMissingColumns(db: any) {
  try {
    console.log('Checking for missing columns...');

    if (dbProvider === 'sqlite') {
      // Check categories table
      const categoriesInfo = db.prepare("PRAGMA table_info(categories)").all();
      if (!categoriesInfo.some((col: any) => col.name === 'sort_by')) {
        db.prepare(`ALTER TABLE categories ADD COLUMN sort_by TEXT DEFAULT 'order'`).run();
        console.log('Added sort_by to categories');
      }
      if (!categoriesInfo.some((col: any) => col.name === 'is_demo')) {
        db.prepare(`ALTER TABLE categories ADD COLUMN is_demo INTEGER DEFAULT 0 NOT NULL`).run();
        console.log('Added is_demo to categories');
      }
      if (!categoriesInfo.some((col: any) => col.name === 'show_open_all')) {
        db.prepare(`ALTER TABLE categories ADD COLUMN show_open_all INTEGER DEFAULT 0 NOT NULL`).run();
        console.log('Added show_open_all to categories');
      }
      if (!categoriesInfo.some((col: any) => col.name === 'show_descriptions')) {
        db.prepare(`ALTER TABLE categories ADD COLUMN show_descriptions INTEGER`).run();
        console.log('Added show_descriptions to categories');
      }

      // Check bookmarks table
      const bookmarksInfo = db.prepare("PRAGMA table_info(bookmarks)").all();
      if (!bookmarksInfo.some((col: any) => col.name === 'is_demo')) {
        db.prepare(`ALTER TABLE bookmarks ADD COLUMN is_demo INTEGER DEFAULT 0 NOT NULL`).run();
        console.log('Added is_demo to bookmarks');
      }
      if (!bookmarksInfo.some((col: any) => col.name === 'show_description')) {
        db.prepare(`ALTER TABLE bookmarks ADD COLUMN show_description INTEGER`).run();
        console.log('Added show_description to bookmarks');
      }

      // Check service_categories table
      const serviceCategoriesInfo = db.prepare("PRAGMA table_info(service_categories)").all();
      if (!serviceCategoriesInfo.some((col: any) => col.name === 'sort_by')) {
        db.prepare(`ALTER TABLE service_categories ADD COLUMN sort_by TEXT DEFAULT 'order'`).run();
        console.log('Added sort_by to service_categories');
      }
      if (!serviceCategoriesInfo.some((col: any) => col.name === 'is_demo')) {
        db.prepare(`ALTER TABLE service_categories ADD COLUMN is_demo INTEGER DEFAULT 0 NOT NULL`).run();
        console.log('Added is_demo to service_categories');
      }
      if (!serviceCategoriesInfo.some((col: any) => col.name === 'show_open_all')) {
        db.prepare(`ALTER TABLE service_categories ADD COLUMN show_open_all INTEGER DEFAULT 0 NOT NULL`).run();
        console.log('Added show_open_all to service_categories');
      }
      if (!serviceCategoriesInfo.some((col: any) => col.name === 'show_descriptions')) {
        db.prepare(`ALTER TABLE service_categories ADD COLUMN show_descriptions INTEGER`).run();
        console.log('Added show_descriptions to service_categories');
      }

      // Check services table
      const servicesInfo = db.prepare("PRAGMA table_info(services)").all();
      if (!servicesInfo.some((col: any) => col.name === 'is_demo')) {
        db.prepare(`ALTER TABLE services ADD COLUMN is_demo INTEGER DEFAULT 0 NOT NULL`).run();
        console.log('Added is_demo to services');
      }
      if (!servicesInfo.some((col: any) => col.name === 'show_description')) {
        db.prepare(`ALTER TABLE services ADD COLUMN show_description INTEGER`).run();
        console.log('Added show_description to services');
      }

      console.log('All missing columns added');
    } else if (dbProvider === 'postgres') {
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_by VARCHAR(20) DEFAULT 'order'`);
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_open_all BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_descriptions INTEGER`);

      await db.execute(`ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS show_description INTEGER`);

      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS sort_by VARCHAR(20) DEFAULT 'order'`);
      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS show_open_all BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS show_descriptions INTEGER`);

      await db.execute(`ALTER TABLE services ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE NOT NULL`);
      await db.execute(`ALTER TABLE services ADD COLUMN IF NOT EXISTS show_description INTEGER`);

      console.log('All missing columns added');
    } else if (dbProvider === 'mysql') {
      try { await db.execute(`ALTER TABLE categories ADD COLUMN sort_by VARCHAR(20) DEFAULT 'order'`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try { await db.execute(`ALTER TABLE categories ADD COLUMN is_demo BOOLEAN DEFAULT FALSE NOT NULL`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try { await db.execute(`ALTER TABLE categories ADD COLUMN show_open_all BOOLEAN DEFAULT FALSE NOT NULL`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try { await db.execute(`ALTER TABLE categories ADD COLUMN show_descriptions INT`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }

      try { await db.execute(`ALTER TABLE bookmarks ADD COLUMN is_demo BOOLEAN DEFAULT FALSE NOT NULL`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try { await db.execute(`ALTER TABLE bookmarks ADD COLUMN show_description INT`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }

      try { await db.execute(`ALTER TABLE service_categories ADD COLUMN sort_by VARCHAR(20) DEFAULT 'order'`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try { await db.execute(`ALTER TABLE service_categories ADD COLUMN is_demo BOOLEAN DEFAULT FALSE NOT NULL`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try { await db.execute(`ALTER TABLE service_categories ADD COLUMN show_open_all BOOLEAN DEFAULT FALSE NOT NULL`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try { await db.execute(`ALTER TABLE service_categories ADD COLUMN show_descriptions INT`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }

      try { await db.execute(`ALTER TABLE services ADD COLUMN is_demo BOOLEAN DEFAULT FALSE NOT NULL`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }
      try { await db.execute(`ALTER TABLE services ADD COLUMN show_description INT`); } catch (e: any) { if (!e.message.includes('Duplicate column')) throw e; }

      console.log('All missing columns added');
    }
  } catch (error) {
    console.error('Failed to add missing columns:', error);
  }
}

async function createPasswordResetTokensTable(db: any) {
  try {
    console.log('Checking for password_reset_tokens table...');

    if (dbProvider === 'sqlite') {
      // Create table if it doesn't exist
      db.prepare(`
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
    } else if (dbProvider === 'postgres') {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          token VARCHAR(64) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('password_reset_tokens table ready');
    } else if (dbProvider === 'mysql') {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          token VARCHAR(64) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
      console.log('password_reset_tokens table ready');
    }
  } catch (error) {
    console.error('Failed to create password_reset_tokens table:', error);
  }
}

async function createMissingTables(db: any) {
  try {
    console.log('Checking for missing tables...');

    if (dbProvider === 'sqlite') {
      // Create analytics_daily table if it doesn't exist
      db.prepare(`
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

      // Create geo_cache table if it doesn't exist
      db.prepare(`
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

      // Create bookmark_clicks table if it doesn't exist
      db.prepare(`
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

      // Create service_clicks table if it doesn't exist
      db.prepare(`
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
    } else if (dbProvider === 'postgres') {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS analytics_daily (
          id SERIAL PRIMARY KEY,
          date VARCHAR(10) NOT NULL,
          type VARCHAR(20) NOT NULL,
          item_id INTEGER,
          country VARCHAR(2),
          count INTEGER NOT NULL DEFAULT 0,
          unique_visitors INTEGER DEFAULT 0
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS geo_cache (
          id SERIAL PRIMARY KEY,
          ip_hash VARCHAR(64) NOT NULL UNIQUE,
          country VARCHAR(2),
          country_name VARCHAR(100),
          city VARCHAR(100),
          region VARCHAR(100),
          latitude REAL,
          longitude REAL,
          timezone VARCHAR(50),
          provider VARCHAR(20),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          expires_at TIMESTAMP
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS bookmark_clicks (
          id SERIAL PRIMARY KEY,
          bookmark_id INTEGER NOT NULL,
          clicked_at TIMESTAMP DEFAULT NOW() NOT NULL,
          hour_of_day INTEGER NOT NULL,
          day_of_week INTEGER NOT NULL,
          day_of_month INTEGER NOT NULL,
          is_demo BOOLEAN DEFAULT FALSE NOT NULL
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS service_clicks (
          id SERIAL PRIMARY KEY,
          service_id INTEGER NOT NULL,
          clicked_at TIMESTAMP DEFAULT NOW() NOT NULL,
          hour_of_day INTEGER NOT NULL,
          day_of_week INTEGER NOT NULL,
          day_of_month INTEGER NOT NULL,
          is_demo BOOLEAN DEFAULT FALSE NOT NULL
        )
      `);

      console.log('All tables ready');
    } else if (dbProvider === 'mysql') {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS analytics_daily (
          id INT AUTO_INCREMENT PRIMARY KEY,
          date VARCHAR(10) NOT NULL,
          type VARCHAR(20) NOT NULL,
          item_id INT,
          country VARCHAR(2),
          count INT NOT NULL DEFAULT 0,
          unique_visitors INT DEFAULT 0
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS geo_cache (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ip_hash VARCHAR(64) NOT NULL UNIQUE,
          country VARCHAR(2),
          country_name VARCHAR(100),
          city VARCHAR(100),
          region VARCHAR(100),
          latitude DOUBLE,
          longitude DOUBLE,
          timezone VARCHAR(50),
          provider VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          expires_at TIMESTAMP NULL
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS bookmark_clicks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          bookmark_id INT NOT NULL,
          clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          hour_of_day INT NOT NULL,
          day_of_week INT NOT NULL,
          day_of_month INT NOT NULL,
          is_demo BOOLEAN DEFAULT FALSE NOT NULL
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS service_clicks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_id INT NOT NULL,
          clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          hour_of_day INT NOT NULL,
          day_of_week INT NOT NULL,
          day_of_month INT NOT NULL,
          is_demo BOOLEAN DEFAULT FALSE NOT NULL
        )
      `);

      console.log('All tables ready');
    }
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
