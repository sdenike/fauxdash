import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
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

export const categories = sqliteTable('categories', {
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
  showOpenAll: integer('show_open_all', { mode: 'boolean' }).notNull().default(false),
  sortBy: text('sort_by').default('order'),
  showDescriptions: integer('show_descriptions'), // null = inherit, 0 = hide, 1 = show
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const bookmarks = sqliteTable('bookmarks', {
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
  showDescription: integer('show_description'), // null = inherit, 0 = hide, 1 = show
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id'),
  key: text('key').notNull(),
  value: text('value'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const themes = sqliteTable('themes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id'),
  name: text('name').notNull(),
  palette: text('palette').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const pageviews = sqliteTable('pageviews', {
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
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const serviceCategories = sqliteTable('service_categories', {
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
  showOpenAll: integer('show_open_all', { mode: 'boolean' }).notNull().default(false),
  sortBy: text('sort_by').default('order'),
  showDescriptions: integer('show_descriptions'), // null = inherit, 0 = hide, 1 = show
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const services = sqliteTable('services', {
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
  showDescription: integer('show_description'), // null = inherit, 0 = hide, 1 = show
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const bookmarkClicks = sqliteTable('bookmark_clicks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookmarkId: integer('bookmark_id').notNull(),
  clickedAt: integer('clicked_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  hourOfDay: integer('hour_of_day').notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  dayOfMonth: integer('day_of_month').notNull(),
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
});

export const serviceClicks = sqliteTable('service_clicks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').notNull(),
  clickedAt: integer('clicked_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  hourOfDay: integer('hour_of_day').notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  dayOfMonth: integer('day_of_month').notNull(),
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
});

export const geoCache = sqliteTable('geo_cache', {
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

export const analyticsDaily = sqliteTable('analytics_daily', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  type: text('type').notNull(),
  itemId: integer('item_id'),
  country: text('country'),
  count: integer('count').notNull().default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
});

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});
