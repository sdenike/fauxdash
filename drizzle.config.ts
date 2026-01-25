import type { Config } from 'drizzle-kit';

const dbProvider = process.env.DB_PROVIDER || 'sqlite';

const getConfig = (): Config => {
  if (dbProvider === 'postgres') {
    return {
      schema: './src/db/schema.ts',
      out: './drizzle',
      driver: 'pg',
      dbCredentials: {
        connectionString: process.env.DB_URL!,
      },
    };
  }

  if (dbProvider === 'mysql') {
    return {
      schema: './src/db/schema.ts',
      out: './drizzle',
      driver: 'mysql2',
      dbCredentials: {
        uri: process.env.DB_URL!,
      },
    };
  }

  // Default to SQLite
  return {
    schema: './src/db/schema.ts',
    out: './drizzle',
    driver: 'better-sqlite',
    dbCredentials: {
      url: process.env.SQLITE_FILE || '/data/fauxdash.db',
    },
  };
};

export default getConfig();
