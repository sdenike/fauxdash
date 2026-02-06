const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL?.replace('file:', '') ||
               process.env.DATABASE_PATH ||
               path.join(process.env.DATA_DIR || '/data', 'fauxdash.db');

console.log('Running password_reset_tokens migration on:', dbPath);

const db = new Database(dbPath);

// Check if table already exists
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='table' AND name='password_reset_tokens'
`).get();

if (!tableExists) {
  console.log('Creating password_reset_tokens table...');
  db.exec(`
    CREATE TABLE password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
  db.exec(`CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token)`);
  db.exec(`CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)`);
  console.log('password_reset_tokens table created');
} else {
  console.log('password_reset_tokens table already exists');
}

db.close();
console.log('Password reset tokens migration complete!');
