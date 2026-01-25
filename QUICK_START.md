# FauxDash Homepage - Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- **Docker** and **Docker Compose** installed
- **8GB RAM** minimum (4GB for app, rest for system)
- **1GB disk space** for Docker images

## Step 1: Get the Code

```bash
cd fauxdash
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set **two required variables**:

### 1. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output and add to `.env`:

```env
NEXTAUTH_SECRET=your_generated_secret_here
```

### 2. Add Weather API Key (Optional but Recommended)

Get a free API key from https://www.weatherapi.com/

Add to `.env`:

```env
WEATHERAPI_KEY=your_api_key_here
```

That's it! Everything else has sensible defaults.

## Step 3: Start the Application

```bash
docker compose up -d
```

Wait 30 seconds for containers to start and migrations to run.

## Step 4: Access FauxDash

Open http://localhost:8080 in your browser.

## Step 5: Log In

**Default credentials:**
- Email: `admin@fauxdash.local`
- Password: `admin`

**⚠️ CHANGE THESE IMMEDIATELY!**

## Step 6: Add Content

1. Click the **gear icon** (⚙️) in the header
2. Click **"Add Category"**
   - Name: "Development"
   - Icon: 💻
   - Click **Create**
3. Click **"Add Bookmark"**
   - Name: "GitHub"
   - URL: https://github.com
   - Icon: 🐙
   - Category: Development
   - Click **Create**
4. Click the **back arrow** to return to homepage
5. See your first bookmark!

## Next Steps

- Add more categories and bookmarks
- Try the search bar (searches DuckDuckGo by default)
- Toggle dark mode with the theme button
- Check the weather widget (if you added API key)
- Drag and drop to reorder items in admin panel

## Common Issues

### Port 8080 already in use
Edit `docker-compose.yml`:
```yaml
ports:
  - "3000:8080"  # Change 8080 to 3000 or any available port
```

### Weather widget not showing
- Make sure you added `WEATHERAPI_KEY` to `.env`
- Restart: `docker compose restart app`

### Can't log in
- Check logs: `docker compose logs app`
- Verify `NEXTAUTH_SECRET` is set in `.env`

### Database errors
- Delete volume and restart:
  ```bash
  docker compose down -v
  docker compose up -d
  ```

## Upgrade

```bash
git pull
docker compose build
docker compose up -d
```

## Backup Your Data

```bash
docker compose down
cp -r /var/lib/docker/volumes/fauxdash_fauxdash-data /path/to/backup/
docker compose up -d
```

Or use Docker:
```bash
docker run --rm -v fauxdash_fauxdash-data:/data -v $(pwd):/backup alpine tar czf /backup/fauxdash-backup.tar.gz /data
```

## Stop FauxDash

```bash
docker compose down
```

## Uninstall

```bash
docker compose down -v  # -v removes data volumes
```

## Full Documentation

See [README.md](README.md) for complete documentation.

## Getting Help

- Check [SMOKE_TEST.md](SMOKE_TEST.md) for troubleshooting
- Review [DECISIONS.md](DECISIONS.md) for architecture details
- Open an issue on GitHub

---

**Enjoy FauxDash! 🚀**
