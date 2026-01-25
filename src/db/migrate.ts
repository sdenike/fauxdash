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

    // Create password reset tokens table if it doesn't exist
    await createPasswordResetTokensTable(db);

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
