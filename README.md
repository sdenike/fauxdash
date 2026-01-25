# FauxDash Homepage

A modern, self-hosted bookmark dashboard homepage with admin management, search, and weather widgets.

## Features

- **Bookmark Management**: Organize bookmarks into categories with drag-and-drop reordering
- **Search Integration**: Configurable search engines (DuckDuckGo, Google, Brave, Kagi, Startpage)
- **Weather Widget**: Multi-location weather display with auto-rotation
- **Authentication**: Local user authentication with admin access control
- **Theme Support**: Light/Dark/System theme modes
- **Privacy-Focused**: Optional authentication requirements for categories and bookmarks
- **Multi-Database**: Support for SQLite, PostgreSQL, and MySQL
- **Redis Caching**: Optional Redis for improved performance
- **Analytics**: Track bookmark click counts

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) Node.js 20+ for local development

### Installation

1. **Clone or download this repository**

```bash
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
- `WEATHERAPI_KEY` (get free key from https://www.weatherapi.com/)

5. **Start the application**

```bash
docker compose up -d
```

6. **Access the application**

Open http://localhost:8080 in your browser.

**Default admin credentials:**
- Email: `admin@fauxdash.local`
- Password: `admin`

**⚠️ CHANGE THESE IMMEDIATELY!**

### First Steps

1. Log in with the default admin credentials
2. Click the settings icon to access the Admin Panel
3. Add categories and bookmarks
4. Customize your homepage

## Building & Development

### Build Scripts

Two helper scripts are provided for building the application:

**Fast Build (with cache):**
```bash
./scripts/docker-build.sh
```
Use this for regular development. It uses Docker cache to speed up builds.

**Clean Build (without cache):**
```bash
./scripts/docker-rebuild.sh
```
Use this when you need to ensure a completely fresh build. This clears all Docker build cache and rebuilds from scratch. **Recommended when updating dependencies or experiencing build issues.**

### Manual Build Commands

If you prefer to run commands manually:

```bash
# Regular build
docker-compose down
docker-compose build
docker-compose up -d

# Clean build (recommended for production deployments)
docker-compose down
docker builder prune -f
docker-compose build --no-cache
docker-compose up -d
```

## Configuration

### Database Options

FauxDash supports three database backends:

#### SQLite (Default)
```env
DB_PROVIDER=sqlite
SQLITE_FILE=/data/fauxdash.db
```

#### PostgreSQL
```env
DB_PROVIDER=postgres
DB_URL=postgresql://user:password@postgres:5432/fauxdash
```

Uncomment the postgres service in `docker-compose.yml`.

#### MySQL
```env
DB_PROVIDER=mysql
DB_URL=mysql://user:password@mysql:3306/fauxdash
```

Uncomment the mysql service in `docker-compose.yml`.

### Redis Configuration

Redis is enabled by default for caching. To disable:

```env
REDIS_ENABLED=false
```

### Weather Configuration

Choose a weather provider:

```env
WEATHER_PROVIDER=weatherapi  # or tempest, openweather
WEATHERAPI_KEY=your_key_here
WEATHER_LOCATIONS=90210,10001  # Comma-separated ZIP codes
WEATHER_AUTO_ROTATE_SECONDS=30
```

**Providers:**
- **WeatherAPI.com** (recommended): Free tier available at https://www.weatherapi.com/
- **Tempest Weather**: Requires station ID and API key
- **OpenWeatherMap**: Free tier available at https://openweathermap.org/

### Search Engine

Set your default search engine:

```env
DEFAULT_SEARCH_ENGINE=duckduckgo  # or google, brave, kagi, startpage
```

## Upgrade Guide

### Upgrading to a New Version

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

4. **Run migrations**

Migrations run automatically on container start. Check logs:

```bash
docker compose logs app
```

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

## Project Structure

```
fauxdash/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin panel
│   │   ├── login/          # Login page
│   │   └── page.tsx        # Homepage
│   ├── components/         # React components
│   │   ├── admin/          # Admin-specific components
│   │   └── ui/             # Reusable UI components
│   ├── db/                 # Database layer
│   │   ├── schema.ts       # Database schema
│   │   ├── index.ts        # DB connection
│   │   └── migrate.ts      # Migration runner
│   ├── lib/                # Utility libraries
│   │   ├── auth.ts         # Authentication config
│   │   ├── redis.ts        # Redis client
│   │   ├── weather.ts      # Weather providers
│   │   └── utils.ts        # Utility functions
│   └── types/              # TypeScript types
├── docker-compose.yml      # Docker services
├── Dockerfile              # Container definition
└── README.md               # This file
```

## Admin Panel

Access the admin panel at `/admin` (requires admin privileges).

### Managing Categories

- **Add Category**: Click "Add Category" button
- **Edit Category**: Click pencil icon
- **Delete Category**: Click trash icon
- **Reorder**: Drag and drop categories

### Managing Bookmarks

- **Add Bookmark**: Click "Add Bookmark" button
- **Edit Bookmark**: Click pencil icon
- **Delete Bookmark**: Click trash icon
- **Reorder**: Drag and drop bookmarks within categories

### Visibility & Authentication

- **Visible**: Toggle whether items appear on homepage
- **Requires Auth**: Make items visible only to logged-in users

## Troubleshooting

### Container won't start

Check logs:
```bash
docker compose logs app
```

### Database connection errors

Verify your `DB_PROVIDER` and connection string in `.env`.

### Weather widget not showing

Ensure you've set a valid API key for your chosen provider.

### Can't log in

Reset admin password by connecting to the database and updating the users table, or recreate the container to reinitialize with default credentials.

## Security Notes

- Change default admin credentials immediately
- Use strong, unique `NEXTAUTH_SECRET`
- Keep sensitive data in `.env` (not in version control)
- Consider placing behind a reverse proxy (nginx, Caddy) with HTTPS
- Regularly update to latest version for security patches

## Contributing

This is a self-hosted project. Feel free to fork and customize for your needs.

## License

MIT License - See LICENSE file for details

## Credits

Inspired by [Flame Dashboard](https://github.com/pawelmalak/flame) but built with modern tech stack.

## Support

For issues and questions:
- Check the documentation
- Review existing issues
- Open a new issue with details about your setup and the problem
