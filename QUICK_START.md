# Faux|Dash - Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- **Docker** and **Docker Compose** installed
- **1GB disk space** for Docker images

## Step 1: Get the Files

```bash
# Using pre-built image (recommended)
curl -O https://raw.githubusercontent.com/sdenike/fauxdash/master/docker-compose.sample.yml
mv docker-compose.sample.yml docker-compose.yml
curl -O https://raw.githubusercontent.com/sdenike/fauxdash/master/.env.example
mv .env.example .env

# Or clone the repository
git clone https://github.com/sdenike/fauxdash.git
cd fauxdash
cp .env.example .env
```

## Step 2: Configure Environment

Generate and add a secret to your `.env`:

```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
```

**Optional**: Add a weather API key (free at https://www.weatherapi.com/):

```bash
echo "WEATHERAPI_KEY=your_api_key_here" >> .env
```

## Step 3: Start the Application

```bash
docker compose up -d
```

Wait about 30 seconds for containers to start.

## Step 4: Complete Setup

1. Open http://localhost:8080 in your browser
2. Complete the setup wizard to create your admin account
3. Optionally load demo content to explore features

## Step 5: Add Your Content

1. Click the **gear icon** in the header to access Admin
2. Go to the **Content** tab
3. Create a category (e.g., "Development")
4. Add bookmarks to your category
5. Return to homepage to see your dashboard

## Next Steps

- Configure weather in Admin > Settings > Weather
- Customize appearance in Admin > Settings > Appearance
- Set up OIDC/SSO in Admin > Settings > Auth
- Install as PWA on mobile devices

## Common Issues

### Port 8080 already in use

Edit `docker-compose.yml`:
```yaml
ports:
  - "3000:8080"  # Change 3000 to any available port
```

### Weather widget not showing

1. Add `WEATHERAPI_KEY` to `.env`
2. Restart: `docker compose restart app`

### Container errors

Check logs:
```bash
docker compose logs app
```

## Upgrade

```bash
docker compose pull
docker compose up -d
```

## Backup Your Data

Use the built-in backup feature:
1. Go to Admin > Tools
2. Click "Create Backup"
3. Download the ZIP file

Or backup volumes manually:
```bash
docker run --rm -v fauxdash-data:/data -v $(pwd):/backup alpine tar czf /backup/fauxdash-backup.tar.gz /data
```

## Stop Faux|Dash

```bash
docker compose down
```

## Uninstall

```bash
docker compose down -v  # -v removes data volumes
```

## Full Documentation

See [README.md](README.md) for complete documentation.
