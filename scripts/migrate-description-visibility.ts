/**
 * Database migration script for description visibility columns.
 *
 * This migration adds nullable boolean columns for controlling description visibility
 * at the category and item level, enabling a hierarchical visibility system:
 * - Global setting (showDescriptions) sets the default
 * - Category setting (showDescriptions) overrides global
 * - Item setting (showDescription) overrides category
 *
 * Values: null = inherit from parent, 0 = hide, 1 = show
 *
 * Usage: npx tsx scripts/migrate-description-visibility.ts
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.SQLITE_FILE || process.env.DATABASE_URL?.replace('file:', '') || '/data/fauxdash.db'

async function migrate() {
  const dbPath = path.resolve(DB_PATH)

  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found at ${dbPath}`)
    process.exit(1)
  }

  const db = new Database(dbPath)

  console.log('Running description visibility migration...')

  try {
    // Add showDescriptions to categories table
    const categoriesColumns = db.prepare("PRAGMA table_info(categories)").all() as Array<{ name: string }>
    if (!categoriesColumns.some(col => col.name === 'show_descriptions')) {
      db.exec('ALTER TABLE categories ADD COLUMN show_descriptions INTEGER')
      console.log('✓ Added show_descriptions column to categories table')
    } else {
      console.log('- show_descriptions column already exists in categories table')
    }

    // Add showDescriptions to service_categories table
    const serviceCategoriesColumns = db.prepare("PRAGMA table_info(service_categories)").all() as Array<{ name: string }>
    if (!serviceCategoriesColumns.some(col => col.name === 'show_descriptions')) {
      db.exec('ALTER TABLE service_categories ADD COLUMN show_descriptions INTEGER')
      console.log('✓ Added show_descriptions column to service_categories table')
    } else {
      console.log('- show_descriptions column already exists in service_categories table')
    }

    // Add showDescription to bookmarks table
    const bookmarksColumns = db.prepare("PRAGMA table_info(bookmarks)").all() as Array<{ name: string }>
    if (!bookmarksColumns.some(col => col.name === 'show_description')) {
      db.exec('ALTER TABLE bookmarks ADD COLUMN show_description INTEGER')
      console.log('✓ Added show_description column to bookmarks table')
    } else {
      console.log('- show_description column already exists in bookmarks table')
    }

    // Add showDescription to services table
    const servicesColumns = db.prepare("PRAGMA table_info(services)").all() as Array<{ name: string }>
    if (!servicesColumns.some(col => col.name === 'show_description')) {
      db.exec('ALTER TABLE services ADD COLUMN show_description INTEGER')
      console.log('✓ Added show_description column to services table')
    } else {
      console.log('- show_description column already exists in services table')
    }

    console.log('\nMigration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

migrate()
