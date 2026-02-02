# Faux|Dash

A modern, self-hosted homepage dashboard for managing bookmarks and services. Built as a replacement for [Flame](https://github.com/pawelmalak/flame) with additional features and a modern tech stack.

---

## About This Project

**This project was entirely programmed with AI assistance and "vibe coded."** It was built as a personal replacement for [Flame Dashboard](https://github.com/pawelmalak/flame), which is outdated and was missing some specific features I wanted.

**Suggestions and contributions are welcome!** If you have ideas for improvements or find bugs, please open an issue or submit a pull request.

---

## Features

### Core Features
- **Bookmarks & Services**: Organize your links into two distinct sections - Bookmarks and Services
- **Categories**: Group items into customizable categories with icons
- **Drag & Drop**: Reorder categories, bookmarks, and services with intuitive drag-and-drop
- **Search Integration**: Built-in search bar with support for DuckDuckGo, Google, Brave, Kagi, Startpage, or custom search engines
- **Weather Widget**: Display weather for multiple locations with auto-rotation
- **Click Analytics**: Track which bookmarks and services you use most

### Mobile & PWA
- **Progressive Web App**: Install as a native app on mobile and desktop devices
- **Offline Support**: Access cached content even without internet connection
- **Mobile-Responsive**: Adaptive layouts that work on phones, tablets, and desktops
- **Touch-Friendly**: 44px minimum touch targets and safe area support for notched devices
- **Add to Home Screen**: Native install prompts for iOS and Android

### Authentication & Privacy
- **User Authentication**: Local user authentication with admin access control
- **OIDC/SSO Support**: Single sign-on with OpenID Connect providers (Authentik, Keycloak, Okta, etc.)
- **Auth-Required Items**: Mark specific bookmarks/services as requiring login to view
- **Password Reset**: Email-based password reset with SMTP configuration

### Customization
- **Theme Support**: Light, Dark, or System-based themes
- **Color Themes**: Multiple color accent options (Slate, Red, Orange, Green, Blue, Purple, Pink)
- **Welcome Messages**: Customizable greeting with time-based variants
- **Date/Time Display**: Configurable date and time formats
- **Layout Options**: Adjustable icon sizes, font sizes, spacing, and column counts

### Data Management
- **Backup & Restore**: Full backup to ZIP file including all data and analytics
- **Import/Export**: CSV import/export for bookmarks, services, and categories
- **Settings Export**: Export and restore all application settings

### Technical Features
- **Multi-Database Support**: SQLite (default), PostgreSQL, or MySQL
- **Redis Caching**: Optional Redis for improved performance
- **GeoIP Lookup**: Optional visitor location analytics with MaxMind or ipinfo.io
- **Favicon Auto-Fetch**: Automatically fetch and store favicons from URLs
- **SVG to PNG Conversion**: Automatic conversion for consistent icon handling
- **Icon Libraries**: 7,000+ Material Design Icons plus selfh.st icon library support
- **Icon Transformations**: Convert icons to theme colors, monotone, or inverted

---

## Screenshots

### Homepage
![Homepage Dark](docs/screenshots/homepage-dark.png)
![Homepage Light](docs/screenshots/homepage-light.png)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

---

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) Node.js 20+ for local development

### Quick Install with Docker

```bash
# Pull the latest image
docker pull ghcr.io/sdenike/fauxdash:latest

# Download the sample compose file
curl -O https://raw.githubusercontent.com/sdenike/fauxdash/master/docker-compose.sample.yml
mv docker-compose.sample.yml docker-compose.yml

# Create environment file
curl -O https://raw.githubusercontent.com/sdenike/fauxdash/master/.env.example
mv .env.example .env

# Generate and add secret to .env
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env

# Start
docker compose up -d

# Access at http://localhost:8080
# Default login: admin@fauxdash.local / admin
# CHANGE PASSWORD IMMEDIATELY after first login!
```

### Installation from Source

1. **Clone the repository**

```bash
git clone https://github.com/sdenike/fauxdash.git
cd fauxdash
```

2. **Create environment file**

```bash
cp .env.example .env
```

3. **Generate a secret for NextAuth**

```bash
openssl rand -base64 32
```

Add this to your `.env` file as `NEXTAUTH_SECRET`.

4. **Configure environment variables**

Edit `.env` and set at minimum:
- `NEXTAUTH_SECRET` (from step 3)
- `NEXTAUTH_URL` (your deployment URL, e.g., `http://localhost:8080`)

5. **Start the application**

```bash
docker compose up -d
```

6. **Access the application**

Open http://localhost:8080 in your browser.

**Default Login Credentials:**
- Email: `admin@fauxdash.local`
- Password: `admin`

**Important:** Change these credentials immediately after first login via Admin > Users.

---

## Docker Configuration

### User/Group Permissions (PUID/PGID)

When running Faux|Dash in Docker with mounted volumes, you may encounter permission issues. Use the `PUID` and `PGID` environment variables to match your host user's permissions.

**Find your user's UID/GID:**
```bash
id
# Output: uid=1000(youruser) gid=1000(youruser) ...
```

**Configure in docker-compose.yml:**
```yaml
services:
  app:
    image: ghcr.io/sdenike/fauxdash:latest
    environment:
      - PUID=1000
      - PGID=1000
    volumes:
      - ./data:/data
```

**Important:** Do NOT use Docker's `user:` directive with this image. Use the `PUID`/`PGID` environment variables instead.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PUID` | `1000` | User ID for file permissions |
| `PGID` | `1000` | Group ID for file permissions |
| `NEXTAUTH_SECRET` | (required) | Secret for session encryption. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:8080` | Your deployment URL |
| `DB_PROVIDER` | `sqlite` | Database type: `sqlite`, `postgres`, or `mysql` |
| `REDIS_ENABLED` | `true` | Enable Redis caching |
| `REDIS_URL` | `redis://redis:6379` | Redis connection URL |

---

## Configuration Guide

All settings can be configured through the Admin Panel at `/admin/settings`. Below is a detailed explanation of each configuration section.

### General Settings

| Setting | Description |
|---------|-------------|
| **Search Enabled** | Enable/disable the search bar on the homepage |
| **Search Engine** | Choose from DuckDuckGo, Google, Brave, Kagi, Startpage, or Custom |
| **Custom Search Name** | Display name for custom search engine |
| **Custom Search URL** | URL template for custom search (use `%s` as query placeholder) |
| **Search in Header** | Show search bar in the header vs. main content area |

### Greeting Settings

| Setting | Description |
|---------|-------------|
| **Welcome Message** | The greeting displayed on the homepage |
| **Welcome Message Enabled** | Show/hide the welcome message |
| **Time-Based Messages** | Use different messages for morning, afternoon, and evening |
| **Morning Message** | Greeting shown before noon (default: "Good morning") |
| **Afternoon Message** | Greeting shown noon to 5 PM (default: "Good afternoon") |
| **Evening Message** | Greeting shown after 5 PM (default: "Good evening") |

### Date & Time Settings

| Setting | Description |
|---------|-------------|
| **Date/Time Enabled** | Show date and time on the homepage |
| **Position** | Left, Center, or Right alignment |
| **Display Mode** | Text or Icon format |
| **Date Format** | Custom date format (e.g., "MMMM d, yyyy" for "January 25, 2026") |
| **Time Enabled** | Show/hide the time display |
| **Time Format** | 12-hour or 24-hour format |
| **Show Seconds** | Include seconds in time display |

### Weather Settings

| Setting | Description |
|---------|-------------|
| **Weather Enabled** | Enable/disable weather widget |
| **Display Mode** | Icon only, Temperature only, or Both |
| **Show Popup** | Show detailed weather on hover |
| **Weather Provider** | WeatherAPI.com, Tempest, or OpenWeatherMap |
| **Locations** | Comma-separated list of ZIP codes or city names |
| **Auto-Rotate** | Seconds between location changes (for multiple locations) |

**Weather Provider Configuration:**

- **WeatherAPI.com** (Recommended): Get a free API key at https://www.weatherapi.com/
- **Tempest Weather**: Requires station ID and API key from your Tempest device
- **OpenWeatherMap**: Get a free API key at https://openweathermap.org/

### GeoIP Settings

GeoIP lookup enriches your pageview analytics with visitor location data.

| Setting | Description |
|---------|-------------|
| **GeoIP Enabled** | Enable/disable geographic location lookup |
| **Provider** | MaxMind (local database), ipinfo.io (API), or Chain (MaxMind with ipinfo fallback) |
| **MaxMind Database Path** | Path to GeoLite2-City.mmdb file |
| **MaxMind Account ID** | For automatic database updates |
| **MaxMind License Key** | Get free at https://www.maxmind.com/en/geolite2/signup |
| **ipinfo.io Token** | Get free at https://ipinfo.io/signup (50,000 lookups/month) |
| **Cache Duration** | How long to cache lookups (default: 86400 seconds / 24 hours) |

### Email / SMTP Settings

Configure email for password reset functionality.

| Setting | Description |
|---------|-------------|
| **Email Provider** | Disabled, Google/Gmail, or Custom SMTP |
| **SMTP Host** | Mail server hostname (auto-filled for Gmail) |
| **SMTP Port** | Mail server port (587 for TLS, 465 for SSL) |
| **Encryption** | TLS (recommended), SSL, or None |
| **Username** | SMTP authentication username |
| **Password** | SMTP authentication password (use App Password for Gmail) |
| **From Email** | Sender email address |
| **From Name** | Sender display name |

**Gmail Setup:**
1. Enable 2-Step Verification on your Google Account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use your Gmail address as username and the 16-character App Password

### Authentication Settings (OIDC/SSO)

Configure Single Sign-On with OpenID Connect providers like Authentik, Keycloak, Okta, Azure AD, etc.

| Setting | Description |
|---------|-------------|
| **Enable OIDC** | Enable/disable OIDC authentication |
| **Provider Name** | Display name shown on login button (e.g., "Authentik", "Okta") |
| **Client ID** | OAuth Client ID from your OIDC provider |
| **Client Secret** | OAuth Client Secret from your OIDC provider |
| **Issuer URL** | The issuer URL from your OIDC provider (usually ends with `/`) |
| **OIDC-Only Mode** | Disable password login and require OIDC authentication |

**OIDC Setup:**
1. Create an application in your OIDC provider (Authentik, Keycloak, etc.)
2. Set the redirect/callback URL to: `https://your-fauxdash-url/api/auth/callback/oidc`
3. Copy the Client ID, Client Secret, and Issuer URL to Faux|Dash settings
4. Use the "Test OIDC Connection" button to verify configuration
5. Save settings and restart the application for changes to take effect

**Important Notes:**
- OIDC settings are global (configured in Admin > Settings > Auth tab)
- Changes to OIDC configuration require an application restart
- Test your OIDC connection before enabling OIDC-Only Mode
- If locked out, you can disable OIDC via environment variables or database

### Appearance Settings

| Setting | Description |
|---------|-------------|
| **Default Theme** | Light, Dark, or System |
| **Theme Color** | Accent color (Slate, Red, Orange, Green, Blue, Purple, Pink) |
| **Site Title** | Browser tab title and header text |
| **Site Title Enabled** | Show/hide the site title |
| **Section Order** | Services First or Bookmarks First |
| **Services Columns** | Number of columns for services section (1-6) |
| **Bookmarks Columns** | Number of columns for bookmarks section (1-6) |
| **Icon Size** | Size of bookmark/service icons in pixels |
| **Font Size** | Size of item text in pixels |
| **Description Spacing** | Gap between title and description |
| **Item Spacing** | Gap between items |

### Default Settings for New Items

Configure default values when creating new categories, bookmarks, and services:

- **Default Enabled State**: Whether new items are visible by default
- **Default Requires Auth**: Whether new items require login by default
- **Items to Show**: Default collapsed view limit for categories
- **Show Item Count**: Display count badge on category headers
- **Auto Expanded**: Whether categories start expanded
- **Sort By**: Default sort order (manual order, name, or click count)

---

## Database Configuration

### SQLite (Default)

```env
DB_PROVIDER=sqlite
SQLITE_FILE=/data/fauxdash.db
```

Best for single-user deployments and simple setups.

### PostgreSQL

```env
DB_PROVIDER=postgres
DB_URL=postgresql://user:password@postgres:5432/fauxdash
```

Uncomment the postgres service in `docker-compose.yml`.

### MySQL

```env
DB_PROVIDER=mysql
DB_URL=mysql://user:password@mysql:3306/fauxdash
```

Uncomment the mysql service in `docker-compose.yml`.

---

## Redis Configuration

Redis caching is enabled by default for improved performance. To disable:

```env
REDIS_ENABLED=false
```

---

## Docker Volumes

Faux|Dash uses several Docker volumes for persistent data:

| Volume | Mount Point | Purpose |
|--------|-------------|---------|
| `fauxdash-data` | `/data` | Database file (SQLite), settings, and configuration |
| `fauxdash-favicons` | `/app/public/favicons` | Downloaded and processed favicon files |
| `fauxdash-logs` | `/data/logs` | Application logs (viewable in Admin > Logs) |
| `redis-data` | `/data` | Redis persistence (if enabled) |

### Backup & Restore

Faux|Dash provides a built-in backup system accessible from **Admin > Tools > Backup & Import**.

**In-App Backup (Recommended):**
- Creates a ZIP file containing:
  - `bookmarks.csv` - All bookmarks with categories
  - `services.csv` - All services with categories
  - `bookmark-categories.csv` - Bookmark category settings
  - `service-categories.csv` - Service category settings
  - `settings.json` - Application settings (excludes sensitive keys)
  - `analytics.json` - Pageviews, clicks, and analytics data
  - `metadata.json` - Backup info and counts
- Shows last backup date
- Supports selective restore (full or individual sections)

**Manual Volume Backup:**

```bash
# Stop containers
docker compose down

# Backup volumes
docker run --rm -v fauxdash-data:/data -v $(pwd):/backup alpine tar cvf /backup/fauxdash-data.tar /data
docker run --rm -v fauxdash-favicons:/favicons -v $(pwd):/backup alpine tar cvf /backup/fauxdash-favicons.tar /favicons

# Restart containers
docker compose up -d
```

### Log Management

Application logs are stored in the `fauxdash-logs` volume and can be viewed through:
- **Admin Panel**: Navigate to Admin > Logs for real-time log viewing with color-coded levels
- **Command Line**: `docker exec fauxdash-app-1 cat /data/logs/fauxdash.log`

Logs are automatically rotated when they exceed 10MB.

### System Tools

Access maintenance tools at **Admin > Tools**:

| Tool | Description |
|------|-------------|
| **Create Backup** | Download complete backup as ZIP file |
| **Restore/Import** | Restore from backup or import CSV files |
| **Reprocess Originals** | Ensure all favicons have original copies saved |
| **Download Remote Icons** | Download selfh.st and HeroIcon icons locally |
| **Repair Favicons** | Fix invalid or corrupted favicon files |
| **Prune Orphans** | Remove unused favicon files to free space |
| **Database Optimization** | Run VACUUM to reclaim space and improve performance |
| **MaxMind Check** | Verify GeoIP database status and get updates |

---

## Development

### Local Development Setup

1. **Install dependencies**

```bash
npm install
```

2. **Set up environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development server**

```bash
npm run dev
```

4. **Generate and run migrations**

```bash
npm run db:generate
npm run db:migrate
```

5. **Access the app**

Open http://localhost:3000

### Build Scripts

**Fast Build (with cache):**
```bash
./scripts/docker-build.sh
```

**Clean Build (without cache):**
```bash
./scripts/docker-rebuild.sh
```

---

## Upgrading

1. **Backup your data**

```bash
docker compose down
cp -r /path/to/docker/volumes/fauxdash-data /path/to/backup/
```

2. **Pull the latest changes**

```bash
git pull origin main
```

3. **Rebuild and restart**

```bash
docker compose build
docker compose up -d
```

Migrations run automatically on container start.

---

## Project Structure

```
fauxdash/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin panel pages
│   │   ├── login/          # Authentication pages
│   │   └── page.tsx        # Homepage
│   ├── components/         # React components
│   │   ├── admin/          # Admin-specific components
│   │   ├── settings/       # Settings tab components
│   │   └── ui/             # Reusable UI components (shadcn/ui)
│   ├── db/                 # Database layer
│   │   ├── schema.ts       # Drizzle ORM schema
│   │   ├── index.ts        # Database connection
│   │   └── migrate.ts      # Migration runner
│   └── lib/                # Utility libraries
│       ├── auth.ts         # NextAuth configuration
│       ├── redis.ts        # Redis client
│       ├── weather.ts      # Weather provider integrations
│       └── icons.ts        # Icon library utilities
├── docker-compose.yml      # Docker services
├── Dockerfile              # Container definition
├── CHANGELOG.md            # Version history
└── README.md               # This file
```

---

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **Database ORM**: Drizzle ORM
- **Authentication**: NextAuth.js
- **Icons**: Heroicons, Material Design Icons, selfh.st
- **Drag & Drop**: dnd-kit

---

## Troubleshooting

### Container won't start

```bash
docker compose logs app
```

### Database connection errors

Verify your `DB_PROVIDER` and connection string in `.env`.

### Weather widget not showing

Ensure you've set a valid API key for your chosen weather provider.

### Can't log in

Default credentials are `admin@fauxdash.local` / `admin`. If you've changed these and forgotten them, you can either:
- Delete the database file and restart the container to reset to defaults
- Connect to your database directly and update the users table

### Favicon fetch fails

Some websites block favicon requests. Use the Icon Selector to manually enter a favicon URL or choose from the icon libraries.

---

## Security Notes

- Change default admin credentials immediately after first login
- Use a strong, unique `NEXTAUTH_SECRET`
- Keep sensitive data in `.env` (never commit to version control)
- Consider placing behind a reverse proxy (nginx, Caddy, Traefik) with HTTPS
- Regularly update to the latest version for security patches

---

## Contributing

Suggestions and contributions are welcome! This project was built for personal use but I'm happy to consider improvements.

- **Bug Reports**: Open an issue with details about your setup and the problem
- **Feature Requests**: Open an issue describing the feature and use case
- **Pull Requests**: Fork the repo, make your changes, and submit a PR

---

## License

MIT License - See LICENSE file for details

---

## Acknowledgments

- Inspired by [Flame Dashboard](https://github.com/pawelmalak/flame)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Heroicons](https://heroicons.com/), [MDI](https://materialdesignicons.com/), and [selfh.st](https://selfh.st/icons/)
- Built with assistance from Claude AI

---

## Support

For issues and questions:
1. Check this documentation
2. Search existing issues
3. Open a new issue with details about your setup and the problem
