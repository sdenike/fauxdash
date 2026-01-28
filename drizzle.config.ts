import { defineConfig } from 'drizzle-kit';

const dbProvider = process.env.DB_PROVIDER || 'sqlite';

export default defineConfig(
  dbProvider === 'postgres'
    ? {
        schema: './src/db/schema.ts',
        out: './drizzle',
        dialect: 'postgresql',
        dbCredentials: {
          url: process.env.DB_URL!,
        },
      }
    : dbProvider === 'mysql'
      ? {
          schema: './src/db/schema.ts',
          out: './drizzle',
          dialect: 'mysql',
          dbCredentials: {
            url: process.env.DB_URL!,
          },
        }
      : {
          schema: './src/db/schema.ts',
          out: './drizzle',
          dialect: 'sqlite',
          dbCredentials: {
            url: process.env.SQLITE_FILE || '/data/fauxdash.db',
          },
        }
);
