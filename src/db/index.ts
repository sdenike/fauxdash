import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (db) return db;

  const sqliteFile = process.env.SQLITE_FILE || '/data/fauxdash.db';
  const sqlite = new Database(sqliteFile);
  sqlite.pragma('journal_mode = WAL');
  db = drizzle(sqlite, { schema });
  return db;
};

export { schema };
export default getDb;
