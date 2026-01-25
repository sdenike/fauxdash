import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
} from 'drizzle-orm/sqlite-core';

// We'll use a factory pattern to create the right schema based on DB provider
const dbProvider = process.env.DB_PROVIDER || 'sqlite';

// Common column definitions
const createUsersTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, text, timestamp, boolean } = require('drizzle-orm/pg-core');
    return pgTable('users', {
      id: serial('id').primaryKey(),
      email: varchar('email', { length: 255 }).notNull().unique(),
      username: varchar('username', { length: 100 }),
      firstname: varchar('firstname', { length: 100 }),
      lastname: varchar('lastname', { length: 100 }),
      passwordHash: text('password_hash'),
      isAdmin: boolean('is_admin').notNull().default(false),
      oidcSubject: varchar('oidc_subject', { length: 255 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar, text, timestamp, boolean } = require('drizzle-orm/mysql-core');
    return mysqlTable('users', {
      id: int('id').primaryKey().autoincrement(),
      email: varchar('email', { length: 255 }).notNull().unique(),
      username: varchar('username', { length: 100 }),
      firstname: varchar('firstname', { length: 100 }),
      lastname: varchar('lastname', { length: 100 }),
      passwordHash: text('password_hash'),
      isAdmin: boolean('is_admin').notNull().default(false),
      oidcSubject: varchar('oidc_subject', { length: 255 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  // SQLite
  return sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    username: text('username'),
    firstname: text('firstname'),
    lastname: text('lastname'),
    passwordHash: text('password_hash'),
    isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
    oidcSubject: text('oidc_subject'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  });
};

const createCategoriesTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, text, integer, boolean, timestamp } = require('drizzle-orm/pg-core');
    return pgTable('categories', {
      id: serial('id').primaryKey(),
      name: varchar('name', { length: 255 }).notNull(),
      icon: text('icon'),
      order: integer('order').notNull().default(0),
      columns: integer('columns').notNull().default(2),
      isVisible: boolean('is_visible').notNull().default(true),
      requiresAuth: boolean('requires_auth').notNull().default(false),
      itemsToShow: integer('items_to_show'),
      showItemCount: boolean('show_item_count').notNull().default(false),
      autoExpanded: boolean('auto_expanded').notNull().default(false),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar, text, boolean, timestamp } = require('drizzle-orm/mysql-core');
    return mysqlTable('categories', {
      id: int('id').primaryKey().autoincrement(),
      name: varchar('name', { length: 255 }).notNull(),
      icon: text('icon'),
      order: int('order').notNull().default(0),
      columns: int('columns').notNull().default(2),
      isVisible: boolean('is_visible').notNull().default(true),
      requiresAuth: boolean('requires_auth').notNull().default(false),
      itemsToShow: int('items_to_show'),
      showItemCount: boolean('show_item_count').notNull().default(false),
      autoExpanded: boolean('auto_expanded').notNull().default(false),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  return sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    icon: text('icon'),
    order: integer('order').notNull().default(0),
    columns: integer('columns').notNull().default(1),
    isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    requiresAuth: integer('requires_auth', { mode: 'boolean' }).notNull().default(false),
    itemsToShow: integer('items_to_show').default(5),
    showItemCount: integer('show_item_count', { mode: 'boolean' }).notNull().default(true),
    autoExpanded: integer('auto_expanded', { mode: 'boolean' }).notNull().default(false),
    sortBy: text('sort_by').default('order'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  });
};

const createBookmarksTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, text, integer, boolean, timestamp } = require('drizzle-orm/pg-core');
    return pgTable('bookmarks', {
      id: serial('id').primaryKey(),
      categoryId: integer('category_id').notNull(),
      name: varchar('name', { length: 255 }).notNull(),
      url: text('url').notNull(),
      description: text('description'),
      icon: text('icon'),
      order: integer('order').notNull().default(0),
      isVisible: boolean('is_visible').notNull().default(true),
      requiresAuth: boolean('requires_auth').notNull().default(false),
      clickCount: integer('click_count').notNull().default(0),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar, text, boolean, timestamp } = require('drizzle-orm/mysql-core');
    return mysqlTable('bookmarks', {
      id: int('id').primaryKey().autoincrement(),
      categoryId: int('category_id').notNull(),
      name: varchar('name', { length: 255 }).notNull(),
      url: text('url').notNull(),
      description: text('description'),
      icon: text('icon'),
      order: int('order').notNull().default(0),
      isVisible: boolean('is_visible').notNull().default(true),
      requiresAuth: boolean('requires_auth').notNull().default(false),
      clickCount: int('click_count').notNull().default(0),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  return sqliteTable('bookmarks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id').notNull(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    description: text('description'),
    icon: text('icon'),
    order: integer('order').notNull().default(0),
    isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    requiresAuth: integer('requires_auth', { mode: 'boolean' }).notNull().default(false),
    clickCount: integer('click_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  });
};

const createSettingsTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, text, integer, timestamp } = require('drizzle-orm/pg-core');
    return pgTable('settings', {
      id: serial('id').primaryKey(),
      userId: integer('user_id'),
      key: varchar('key', { length: 255 }).notNull(),
      value: text('value'),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar, text, timestamp } = require('drizzle-orm/mysql-core');
    return mysqlTable('settings', {
      id: int('id').primaryKey().autoincrement(),
      userId: int('user_id'),
      key: varchar('key', { length: 255 }).notNull(),
      value: text('value'),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  return sqliteTable('settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id'),
    key: text('key').notNull(),
    value: text('value'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  });
};

const createThemesTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, text, integer, boolean, timestamp } = require('drizzle-orm/pg-core');
    return pgTable('themes', {
      id: serial('id').primaryKey(),
      userId: integer('user_id'),
      name: varchar('name', { length: 255 }).notNull(),
      palette: text('palette').notNull(),
      isDefault: boolean('is_default').notNull().default(false),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar, text, boolean, timestamp } = require('drizzle-orm/mysql-core');
    return mysqlTable('themes', {
      id: int('id').primaryKey().autoincrement(),
      userId: int('user_id'),
      name: varchar('name', { length: 255 }).notNull(),
      palette: text('palette').notNull(),
      isDefault: boolean('is_default').notNull().default(false),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  return sqliteTable('themes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id'),
    name: text('name').notNull(),
    palette: text('palette').notNull(),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  });
};

const createPageviewsTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, text, real, boolean, timestamp } = require('drizzle-orm/pg-core');
    return pgTable('pageviews', {
      id: serial('id').primaryKey(),
      path: varchar('path', { length: 255 }).notNull(),
      userAgent: varchar('user_agent', { length: 500 }),
      ipAddress: varchar('ip_address', { length: 45 }),
      ipHash: varchar('ip_hash', { length: 64 }),
      country: varchar('country', { length: 2 }),
      countryName: varchar('country_name', { length: 100 }),
      city: varchar('city', { length: 100 }),
      region: varchar('region', { length: 100 }),
      latitude: real('latitude'),
      longitude: real('longitude'),
      timezone: varchar('timezone', { length: 50 }),
      geoEnriched: boolean('geo_enriched').default(false),
      timestamp: timestamp('timestamp').notNull().defaultNow(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar, text, double, boolean, timestamp } = require('drizzle-orm/mysql-core');
    return mysqlTable('pageviews', {
      id: int('id').primaryKey().autoincrement(),
      path: varchar('path', { length: 255 }).notNull(),
      userAgent: varchar('user_agent', { length: 500 }),
      ipAddress: varchar('ip_address', { length: 45 }),
      ipHash: varchar('ip_hash', { length: 64 }),
      country: varchar('country', { length: 2 }),
      countryName: varchar('country_name', { length: 100 }),
      city: varchar('city', { length: 100 }),
      region: varchar('region', { length: 100 }),
      latitude: double('latitude'),
      longitude: double('longitude'),
      timezone: varchar('timezone', { length: 50 }),
      geoEnriched: boolean('geo_enriched').default(false),
      timestamp: timestamp('timestamp').notNull().defaultNow(),
    });
  }

  return sqliteTable('pageviews', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    path: text('path').notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    ipHash: text('ip_hash'),
    country: text('country'),
    countryName: text('country_name'),
    city: text('city'),
    region: text('region'),
    latitude: integer('latitude'),
    longitude: integer('longitude'),
    timezone: text('timezone'),
    geoEnriched: integer('geo_enriched', { mode: 'boolean' }).default(false),
    timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  });
};

const createServiceCategoriesTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, text, integer, boolean, timestamp } = require('drizzle-orm/pg-core');
    return pgTable('service_categories', {
      id: serial('id').primaryKey(),
      name: varchar('name', { length: 255 }).notNull(),
      icon: text('icon'),
      order: integer('order').notNull().default(0),
      columns: integer('columns').notNull().default(1),
      isVisible: boolean('is_visible').notNull().default(true),
      requiresAuth: boolean('requires_auth').notNull().default(false),
      itemsToShow: integer('items_to_show'),
      showItemCount: boolean('show_item_count').notNull().default(false),
      autoExpanded: boolean('auto_expanded').notNull().default(false),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar, text, boolean, timestamp } = require('drizzle-orm/mysql-core');
    return mysqlTable('service_categories', {
      id: int('id').primaryKey().autoincrement(),
      name: varchar('name', { length: 255 }).notNull(),
      icon: text('icon'),
      order: int('order').notNull().default(0),
      columns: int('columns').notNull().default(1),
      isVisible: boolean('is_visible').notNull().default(true),
      requiresAuth: boolean('requires_auth').notNull().default(false),
      itemsToShow: int('items_to_show'),
      showItemCount: boolean('show_item_count').notNull().default(false),
      autoExpanded: boolean('auto_expanded').notNull().default(false),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  return sqliteTable('service_categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    icon: text('icon'),
    order: integer('order').notNull().default(0),
    columns: integer('columns').notNull().default(1),
    isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    requiresAuth: integer('requires_auth', { mode: 'boolean' }).notNull().default(false),
    itemsToShow: integer('items_to_show').default(5),
    showItemCount: integer('show_item_count', { mode: 'boolean' }).notNull().default(true),
    autoExpanded: integer('auto_expanded', { mode: 'boolean' }).notNull().default(false),
    sortBy: text('sort_by').default('order'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  });
};

const createServicesTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, text, integer, boolean, timestamp } = require('drizzle-orm/pg-core');
    return pgTable('services', {
      id: serial('id').primaryKey(),
      categoryId: integer('category_id'),
      name: varchar('name', { length: 255 }).notNull(),
      url: text('url').notNull(),
      description: text('description'),
      icon: text('icon'),
      order: integer('order').notNull().default(0),
      isVisible: boolean('is_visible').notNull().default(true),
      requiresAuth: boolean('requires_auth').notNull().default(false),
      clickCount: integer('click_count').notNull().default(0),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar, text, boolean, timestamp } = require('drizzle-orm/mysql-core');
    return mysqlTable('services', {
      id: int('id').primaryKey().autoincrement(),
      categoryId: int('category_id'),
      name: varchar('name', { length: 255 }).notNull(),
      url: text('url').notNull(),
      description: text('description'),
      icon: text('icon'),
      order: int('order').notNull().default(0),
      isVisible: boolean('is_visible').notNull().default(true),
      requiresAuth: boolean('requires_auth').notNull().default(false),
      clickCount: int('click_count').notNull().default(0),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    });
  }

  return sqliteTable('services', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id'),
    name: text('name').notNull(),
    url: text('url').notNull(),
    description: text('description'),
    icon: text('icon'),
    order: integer('order').notNull().default(0),
    isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    requiresAuth: integer('requires_auth', { mode: 'boolean' }).notNull().default(false),
    clickCount: integer('click_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  });
};

const createBookmarkClicksTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, integer, timestamp } = require('drizzle-orm/pg-core');
    return pgTable('bookmark_clicks', {
      id: serial('id').primaryKey(),
      bookmarkId: integer('bookmark_id').notNull(),
      clickedAt: timestamp('clicked_at').notNull().defaultNow(),
      hourOfDay: integer('hour_of_day').notNull(),
      dayOfWeek: integer('day_of_week').notNull(),
      dayOfMonth: integer('day_of_month').notNull(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, timestamp } = require('drizzle-orm/mysql-core');
    return mysqlTable('bookmark_clicks', {
      id: int('id').primaryKey().autoincrement(),
      bookmarkId: int('bookmark_id').notNull(),
      clickedAt: timestamp('clicked_at').notNull().defaultNow(),
      hourOfDay: int('hour_of_day').notNull(),
      dayOfWeek: int('day_of_week').notNull(),
      dayOfMonth: int('day_of_month').notNull(),
    });
  }

  return sqliteTable('bookmark_clicks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    bookmarkId: integer('bookmark_id').notNull(),
    clickedAt: integer('clicked_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    hourOfDay: integer('hour_of_day').notNull(),
    dayOfWeek: integer('day_of_week').notNull(),
    dayOfMonth: integer('day_of_month').notNull(),
  });
};

const createServiceClicksTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, integer, timestamp } = require('drizzle-orm/pg-core');
    return pgTable('service_clicks', {
      id: serial('id').primaryKey(),
      serviceId: integer('service_id').notNull(),
      clickedAt: timestamp('clicked_at').notNull().defaultNow(),
      hourOfDay: integer('hour_of_day').notNull(),
      dayOfWeek: integer('day_of_week').notNull(),
      dayOfMonth: integer('day_of_month').notNull(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, timestamp } = require('drizzle-orm/mysql-core');
    return mysqlTable('service_clicks', {
      id: int('id').primaryKey().autoincrement(),
      serviceId: int('service_id').notNull(),
      clickedAt: timestamp('clicked_at').notNull().defaultNow(),
      hourOfDay: int('hour_of_day').notNull(),
      dayOfWeek: int('day_of_week').notNull(),
      dayOfMonth: int('day_of_month').notNull(),
    });
  }

  return sqliteTable('service_clicks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    serviceId: integer('service_id').notNull(),
    clickedAt: integer('clicked_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    hourOfDay: integer('hour_of_day').notNull(),
    dayOfWeek: integer('day_of_week').notNull(),
    dayOfMonth: integer('day_of_month').notNull(),
  });
};

const createGeoCacheTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, real, timestamp } = require('drizzle-orm/pg-core');
    return pgTable('geo_cache', {
      id: serial('id').primaryKey(),
      ipHash: varchar('ip_hash', { length: 64 }).notNull().unique(),
      country: varchar('country', { length: 2 }),
      countryName: varchar('country_name', { length: 100 }),
      city: varchar('city', { length: 100 }),
      region: varchar('region', { length: 100 }),
      latitude: real('latitude'),
      longitude: real('longitude'),
      timezone: varchar('timezone', { length: 50 }),
      provider: varchar('provider', { length: 20 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      expiresAt: timestamp('expires_at'),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar, double, timestamp } = require('drizzle-orm/mysql-core');
    return mysqlTable('geo_cache', {
      id: int('id').primaryKey().autoincrement(),
      ipHash: varchar('ip_hash', { length: 64 }).notNull().unique(),
      country: varchar('country', { length: 2 }),
      countryName: varchar('country_name', { length: 100 }),
      city: varchar('city', { length: 100 }),
      region: varchar('region', { length: 100 }),
      latitude: double('latitude'),
      longitude: double('longitude'),
      timezone: varchar('timezone', { length: 50 }),
      provider: varchar('provider', { length: 20 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      expiresAt: timestamp('expires_at'),
    });
  }

  return sqliteTable('geo_cache', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ipHash: text('ip_hash').notNull().unique(),
    country: text('country'),
    countryName: text('country_name'),
    city: text('city'),
    region: text('region'),
    latitude: integer('latitude'),
    longitude: integer('longitude'),
    timezone: text('timezone'),
    provider: text('provider'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
  });
};

const createAnalyticsDailyTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, integer } = require('drizzle-orm/pg-core');
    return pgTable('analytics_daily', {
      id: serial('id').primaryKey(),
      date: varchar('date', { length: 10 }).notNull(),
      type: varchar('type', { length: 20 }).notNull(),
      itemId: integer('item_id'),
      country: varchar('country', { length: 2 }),
      count: integer('count').notNull().default(0),
      uniqueVisitors: integer('unique_visitors').default(0),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar } = require('drizzle-orm/mysql-core');
    return mysqlTable('analytics_daily', {
      id: int('id').primaryKey().autoincrement(),
      date: varchar('date', { length: 10 }).notNull(),
      type: varchar('type', { length: 20 }).notNull(),
      itemId: int('item_id'),
      country: varchar('country', { length: 2 }),
      count: int('count').notNull().default(0),
      uniqueVisitors: int('unique_visitors').default(0),
    });
  }

  return sqliteTable('analytics_daily', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    type: text('type').notNull(),
    itemId: integer('item_id'),
    country: text('country'),
    count: integer('count').notNull().default(0),
    uniqueVisitors: integer('unique_visitors').default(0),
  });
};

const createPasswordResetTokensTable = () => {
  if (dbProvider === 'postgres') {
    const { pgTable, serial, varchar, integer, timestamp, boolean } = require('drizzle-orm/pg-core');
    return pgTable('password_reset_tokens', {
      id: serial('id').primaryKey(),
      userId: integer('user_id').notNull(),
      token: varchar('token', { length: 64 }).notNull().unique(),
      expiresAt: timestamp('expires_at').notNull(),
      used: boolean('used').notNull().default(false),
      createdAt: timestamp('created_at').notNull().defaultNow(),
    });
  }

  if (dbProvider === 'mysql') {
    const { mysqlTable, int, varchar, timestamp, boolean } = require('drizzle-orm/mysql-core');
    return mysqlTable('password_reset_tokens', {
      id: int('id').primaryKey().autoincrement(),
      userId: int('user_id').notNull(),
      token: varchar('token', { length: 64 }).notNull().unique(),
      expiresAt: timestamp('expires_at').notNull(),
      used: boolean('used').notNull().default(false),
      createdAt: timestamp('created_at').notNull().defaultNow(),
    });
  }

  return sqliteTable('password_reset_tokens', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    used: integer('used', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  });
};

export const users = createUsersTable();
export const categories = createCategoriesTable();
export const bookmarks = createBookmarksTable();
export const settings = createSettingsTable();
export const themes = createThemesTable();
export const pageviews = createPageviewsTable();
export const serviceCategories = createServiceCategoriesTable();
export const services = createServicesTable();
export const bookmarkClicks = createBookmarkClicksTable();
export const serviceClicks = createServiceClicksTable();
export const geoCache = createGeoCacheTable();
export const analyticsDaily = createAnalyticsDailyTable();
export const passwordResetTokens = createPasswordResetTokensTable();
