const Database = require('better-sqlite3');
const argon2 = require('argon2');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const dbPath = process.env.DATABASE_PATH || process.env.SQLITE_FILE || path.join(process.cwd(), 'data', 'fauxdash.db');

console.log('FauxDash Password Reset Utility');
console.log('================================\n');
console.log('Database:', dbPath);

const db = new Database(dbPath);

// Get all users
const users = db.prepare('SELECT id, username, email FROM users').all();

if (users.length === 0) {
  console.log('No users found in database.');
  process.exit(1);
}

console.log('\nAvailable users:');
users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.username} (${user.email || 'no email'})`);
});

rl.question('\nEnter user number to reset password: ', async (userNum) => {
  const selectedUser = users[parseInt(userNum) - 1];

  if (!selectedUser) {
    console.log('Invalid user number.');
    rl.close();
    db.close();
    process.exit(1);
  }

  console.log(`\nResetting password for: ${selectedUser.username}`);

  rl.question('Enter new password: ', async (password) => {
    if (!password || password.length < 6) {
      console.log('Password must be at least 6 characters.');
      rl.close();
      db.close();
      process.exit(1);
    }

    try {
      // Hash the password
      const hashedPassword = await argon2.hash(password);

      // Update the database
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, selectedUser.id);

      console.log('\n✓ Password updated successfully!');
      console.log(`You can now log in as "${selectedUser.username}" with your new password.`);

    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      rl.close();
      db.close();
    }
  });
});
