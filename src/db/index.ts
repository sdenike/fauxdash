import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleMySQL } from 'drizzle-orm/mysql2';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const dbProvider = process.env.DB_PROVIDER || 'sqlite';

let db: any;

export const getDb = () => {
  if (db) return db;

  if (dbProvider === 'postgres') {
    const connectionString = process.env.DB_URL!;
    const client = postgres(connectionString);
    db = drizzlePostgres(client, { schema });
    return db;
  }

  if (dbProvider === 'mysql') {
    const connectionString = process.env.DB_URL!;
    const poolConnection = mysql.createPool(connectionString);
    db = drizzleMySQL(poolConnection, { schema, mode: 'default' });
    return db;
  }

  // SQLite
  const sqliteFile = process.env.SQLITE_FILE || '/data/fauxdash.db';
  const sqlite = new Database(sqliteFile);
  sqlite.pragma('journal_mode = WAL');
  db = drizzleSQLite(sqlite, { schema });
  return db;
};

export { schema };
export default getDb;
