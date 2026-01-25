const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.SQLITE_FILE || path.join(__dirname, '../data/fauxdash.db');
const db = new Database(DB_PATH);

console.log('Fixing category assignments...');

// Define the correct mappings
const bookmarkMappings = [
  { name: 'Bluesky', category: 'Social Media' },
  { name: 'Facebook', category: 'Social Media' },
  { name: 'Instagram', category: 'Social Media' },
  { name: 'Mastodon', category: 'Social Media' },
  { name: 'Reddit', category: 'Social Media' },
  { name: 'Threads', category: 'Social Media' },
  { name: 'Plex', category: 'Streaming' },
  { name: 'YoutubeTV', category: 'Streaming' },
  { name: 'Aither', category: 'Torrents' },
  { name: 'Anthelion', category: 'Torrents' },
  { name: 'Bibliotik', category: 'Torrents' },
  { name: 'Blutopia', category: 'Torrents' },
  { name: 'Broadcastthe.net', category: 'Torrents' },
  { name: 'BrokenStones', category: 'Torrents' },
  { name: 'IPTorrents', category: 'Torrents' },
  { name: 'Immortalseed', category: 'Torrents' },
  { name: 'MoreThanTV', category: 'Torrents' },
  { name: 'MyAnonaMouse', category: 'Torrents' },
  { name: 'OldToons', category: 'Torrents' },
  { name: 'Pass The Popcorn', category: 'Torrents' },
  { name: 'Phoenix Project', category: 'Torrents' },
  { name: 'Redacted', category: 'Torrents' },
  { name: 'RocketHD', category: 'Torrents' },
  { name: 'SceneTime', category: 'Torrents' },
  { name: 'Secret Cinema', category: 'Torrents' },
  { name: 'Seedpool', category: 'Torrents' },
  { name: 'Torrent Day', category: 'Torrents' },
  { name: 'Torrent Leech', category: 'Torrents' },
  { name: 'Brutalist', category: 'News' },
  { name: 'Sparky Fitness', category: 'Misc' },
];

try {
  // Get or create categories
  const categoryIds = new Map();
  let order = 100; // Start at 100 to not conflict with existing

  for (const mapping of bookmarkMappings) {
    const categoryName = mapping.category;

    if (!categoryIds.has(categoryName)) {
      // Check if category exists
      const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(categoryName);

      if (existing) {
        categoryIds.set(categoryName, existing.id);
      } else {
        // Create category
        const result = db.prepare(`
          INSERT INTO categories (name, "order", is_visible, requires_auth, created_at, updated_at)
          VALUES (?, ?, 1, 0, strftime('%s', 'now'), strftime('%s', 'now'))
        `).run(categoryName, order++);

        categoryIds.set(categoryName, result.lastInsertRowid);
        console.log(`Created category: ${categoryName}`);
      }
    }
  }

  // Update bookmarks
  for (const mapping of bookmarkMappings) {
    const categoryId = categoryIds.get(mapping.category);

    const result = db.prepare(`
      UPDATE bookmarks
      SET category_id = ?
      WHERE name = ?
    `).run(categoryId, mapping.name);

    if (result.changes > 0) {
      console.log(`Updated ${mapping.name} -> ${mapping.category}`);
    }
  }

  // Delete empty Misc category if it exists and has no bookmarks
  const miscCategory = db.prepare("SELECT id FROM categories WHERE name = 'Misc'").get();
  if (miscCategory) {
    const bookmarkCount = db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE category_id = ?').get(miscCategory.id);
    if (bookmarkCount.count === 0) {
      db.prepare('DELETE FROM categories WHERE id = ?').run(miscCategory.id);
      console.log('Deleted empty Misc category');
    }
  }

  console.log('\n✓ Category assignments fixed!');
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
} finally {
  db.close();
}
