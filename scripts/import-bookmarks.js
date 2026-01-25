const Database = require('better-sqlite3');
const path = require('path');

// Determine database path
const DB_PATH = process.env.SQLITE_FILE || path.join(__dirname, '../data/fauxdash.db');

console.log('Starting bookmark import...');
console.log('DB_PATH:', DB_PATH);

const db = new Database(DB_PATH);

// CSV data
const csvData = `Category,Name,URL
Monitoring,"Tracearr

Media Monitoring",https://tracearr.denike.io/settings
Monitoring,"Smokeping

Network uptime monitor",http://10.0.1.100:8084/smokeping/
Monitoring,"Tautulli

Plex Analytics",https://tautulli.denike.io/
Monitoring,"Flight Radar

Flight Radar Status Page",http://10.0.1.124:8754/
Monitoring,"Uptime Kuma

Uptime Monitor",https://uptime.denike.io/dashboard
Monitoring,"Apprise

Apprise API Manager",http://10.0.1.100:8000/
Media,"Agregarr

Plex Poster Art",http://10.0.1.100:7172/
Media,"Radarr

Movie Organization",http://10.0.1.100:7878/
Media,"Sonarr

TV Show Organization",http://10.0.1.100:8989/
Media,"Bazarr

Subtitle Downloader",http://10.0.1.100:6767/
Media,"Overseerr

Plex Requests",https://requests.denike.io/
Media,"Asciinema

Asciinema shell recordings",https://asciinema.denike.io/
Media,"LubeLogger

Vehicle Tracking",https://lubelogger.denike.io/
Media,"Nextcloud

Personal Cloud",https://nextcloud.denike.io/
Services,"Listmonk

Listmonk",https://newsletter.denike.io/
Services,"Pocket ID

Passkey Security",https://id.denike.io/settings/account
Services,"Proxmox

Proxmox Host",https://10.0.1.120:8006/
Services,"Meilisearch

Search system for multiple applications",http://10.0.1.100:7700/
Downloading,"Mousehole

MaM IP Updater",http://10.0.1.100:5010/web
Downloading,"NZBGet

Usenet Downloader",http://10.0.1.100:6789/
Downloading,"ReadMeABook

Audiobook Requests",https://readmeabook.denike.io/
Downloading,"QBittorrent

Torrent Client",http://10.0.1.100:8085/
Downloading,"Prowlarr

Torrent Index Manager",http://10.0.1.100:9696/
Downloading,"Qui

Qui qBittorrent Manager",http://10.0.1.100:7476/
Archiving,"Paperless-AI

AI Tagging for Paperless",http://10.0.1.100:3747/dashboard
Archiving,"Mail-Archiver

eMail Archiver",http://10.0.1.100:5000/
Archiving,"Paperless-NGX

Paperless document browser",https://paperless.denike.io/dashboard
Reading,"FreshRSS

RSS Reader",https://freshrss.denike.io/
Reading,"Hoarder

Hoarder Bookmarking",https://hoarder.denike.io/
Reading,"Audiobookshelf

Audiobooks",https://audiobooks.denike.io/
Home Automation,"Home Assistant

Home Assistant",https://ha.denike.io/
Home Automation,"Govee Controller

Govee HA Controller",http://10.0.1.125:8056/assets/index.html
Misc,"Sparky Fitness

Fitness Tracking",https://sparkyfitness.denike.io/
Social Media,Bluesky,https://bsky.app/
Social Media,Facebook,https://www.facebook.com/
Social Media,Instagram,https://instagram.com/
Social Media,Mastodon,https://mastodon.social/home
Social Media,Reddit,https://reddit.com/
Social Media,Threads,https://threads.net/
Streaming,Plex,https://plex.tv/
Streaming,YoutubeTV,https://tv.youtube.com/
Torrents,Aither,https://aither.cc/
Torrents,Anthelion,https://anthelion.me/
Torrents,Bibliotik,https://bibliotik.me/
Torrents,Blutopia,https://blutopia.cc/
Torrents,Broadcastthe.net,https://broadcasthe.net/index.php
Torrents,BrokenStones,https://brokenstones.is/
Torrents,IPTorrents,https://iptorrents.com/
Torrents,Immortalseed,https://immortalseed.me/
Torrents,MoreThanTV,https://www.morethantv.me/
Torrents,MyAnonaMouse,https://www.myanonamouse.net/
Torrents,OldToons,https://oldtoons.world/pages/1
Torrents,Pass The Popcorn,https://passthepopcorn.me/index.php
Torrents,Phoenix Project,https://phoenixproject.app/index.php
Torrents,Redacted,https://redacted.sh/login.php
Torrents,RocketHD,https://rocket-hd.cc/
Torrents,SceneTime,https://scenetime.com/
Torrents,Secret Cinema,https://secret-cinema.pw/index.php
Torrents,Seedpool,https://seedpool.org/login
Torrents,Torrent Day,https://www.torrentday.com/t
Torrents,Torrent Leech,https://www.torrentleech.me/
News,Brutalist,https://brutalist.report/
Bills,AAA,https://aaa.com/
Bills,Consumers,https://www.consumersenergy.com/
Bills,Granger,https://portal.grangerwasteservices.com/
Bills,Meridian Township,https://www.invoicecloud.com/portal/(S(jpebyr2dv2uag32qa1uzykxp))/2/Site.aspx?g=925c4432-0ae3-4aba-b189-defda5ae2c66
Bills,Stripe,https://stripe.com/
Blogs,Tacoma Hills,https://tacomahills.org/
Blogs,denike.io,https://denike.io/
Work,Helpdesk,https://sdphome.utac.com/app/itdesk/ui/requests
Work,Kronos,https://secure4.saashr.com/ta/6165836.login
Work,MangeEngine,https://endpointcentral.manageengine.com/webclient#/uems/home/summary
Work,PiSignage,http://10.60.1.0:3000/#/dashboard
Usenet,Eweka,https://www.eweka.nl/en/
Usenet,Frugalusenet,https://billing.frugalusenet.com/member
Usenet,NZBGeek,https://nzbgeek.info/dashboard.php
Usenet,NewsHosting,https://controlpanel.newshosting.com/customer/`;

// Simple CSV parser (handles quoted fields with newlines)
function parseCSV(csv) {
  const lines = [];
  const rows = csv.split('\n');

  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < rows.length; i++) {
    const line = rows[i];

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          j++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // End of line
    if (inQuotes) {
      // Continue to next line (multi-line field)
      currentField += '\n';
    } else {
      // End of row
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    }
  }

  return lines;
}

try {
  const rows = parseCSV(csvData);

  // Skip header
  const dataRows = rows.slice(1);

  console.log(`Parsed ${dataRows.length} bookmarks`);

  // Track categories
  const categoryMap = new Map();
  let categoryOrder = 0;
  let bookmarkOrder = 0;

  // Process each row
  for (const [categoryName, nameField, url] of dataRows) {
    if (!categoryName || !nameField || !url) {
      console.log('Skipping invalid row:', { categoryName, nameField, url });
      continue;
    }

    // Get or create category
    let categoryId = categoryMap.get(categoryName);

    if (!categoryId) {
      // Check if category exists
      const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(categoryName);

      if (existing) {
        categoryId = existing.id;
      } else {
        // Create new category
        const result = db.prepare(`
          INSERT INTO categories (name, "order", is_visible, requires_auth, created_at, updated_at)
          VALUES (?, ?, 1, 0, strftime('%s', 'now'), strftime('%s', 'now'))
        `).run(categoryName, categoryOrder);

        categoryId = result.lastInsertRowid;
        console.log(`Created category: ${categoryName} (ID: ${categoryId})`);
        categoryOrder++;
      }

      categoryMap.set(categoryName, categoryId);
    }

    // Parse name and description
    let name = nameField;
    let description = null;

    // Check if there's a newline in the name field
    if (nameField.includes('\n')) {
      const parts = nameField.split('\n').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 2) {
        name = parts[0];
        description = parts.slice(1).join(' ');
      } else if (parts.length === 1) {
        name = parts[0];
      }
    }

    // Insert bookmark
    try {
      db.prepare(`
        INSERT INTO bookmarks (category_id, name, url, description, "order", is_visible, requires_auth, click_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, 0, 0, strftime('%s', 'now'), strftime('%s', 'now'))
      `).run(categoryId, name, url, description, bookmarkOrder);

      console.log(`  Added bookmark: ${name} ${description ? `(${description})` : ''}`);
      bookmarkOrder++;
    } catch (error) {
      console.error(`  Error adding bookmark ${name}:`, error.message);
    }
  }

  console.log('\n✓ Import complete!');
  console.log(`  Created ${categoryMap.size} categories`);
  console.log(`  Imported ${bookmarkOrder} bookmarks`);

} catch (error) {
  console.error('Import failed:', error);
  process.exit(1);
} finally {
  db.close();
}
