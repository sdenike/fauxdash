# Faux|Dash Deployment Guide

## Quick Deploy (Using Pre-built Image)

The easiest deployment uses the pre-built image from GitHub Container Registry:

```bash
# Download compose file and environment template
curl -O https://raw.githubusercontent.com/sdenike/fauxdash/master/docker-compose.sample.yml
mv docker-compose.sample.yml docker-compose.yml
curl -O https://raw.githubusercontent.com/sdenike/fauxdash/master/.env.example
mv .env.example .env

# Generate and add secret
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env

# Start
docker compose up -d
```

Access at http://localhost:8080 and complete the setup wizard.

## Upgrade

```bash
# Pull latest image
docker compose pull

# Restart with new image
docker compose up -d
```

Migrations run automatically on container start.

## Build from Source

If you need to build locally (for development or custom modifications):

```bash
# Clone repository
git clone https://github.com/sdenike/fauxdash.git
cd fauxdash

# Build and start
docker compose build
docker compose up -d
```

### Rebuild After Code Changes

Code changes require a full rebuild:

```bash
docker compose down
docker compose build
docker compose up -d
```

This is required because Next.js builds the application inside the Docker image.

## Version Management

Version is stored in `package.json` and displayed in Admin Dashboard.

### Versioning

We follow semantic versioning:
- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes

### Creating a Release

```bash
./scripts/release.sh patch "Fix description"
./scripts/release.sh minor "New feature description"
```

This updates version, creates git tag, and triggers automated Docker build.

## CI/CD

GitHub Actions automatically:
1. Builds Docker images on tag push
2. Publishes to `ghcr.io/sdenike/fauxdash`
3. Creates GitHub release with changelog

## Data Volumes

Data persists in Docker volumes:

| Volume | Purpose |
|--------|---------|
| `fauxdash-data` | SQLite database, settings |
| `fauxdash-favicons` | Downloaded favicons |
| `fauxdash-logs` | Application logs |
| `redis-data` | Cache data |

### Backup

```bash
# In-app backup (recommended)
# Admin > Tools > Create Backup

# Manual volume backup
docker run --rm -v fauxdash-data:/data -v $(pwd):/backup alpine tar czf /backup/fauxdash-backup.tar.gz /data
```

### Restore

```bash
# In-app restore
# Admin > Tools > Import/Restore

# Manual volume restore
docker run --rm -v fauxdash-data:/data -v $(pwd):/backup alpine tar xzf /backup/fauxdash-backup.tar.gz -C /
```

## Environment Variables

Key variables (see `.env.example` for all):

```env
NEXTAUTH_SECRET=<required>
NEXTAUTH_URL=http://localhost:8080
REDIS_ENABLED=true
PUID=1000
PGID=1000
```

## Reverse Proxy

When using a reverse proxy (nginx, Caddy, Traefik):

1. Set `NEXTAUTH_URL` to your external URL
2. Ensure proxy passes required headers:
   - `X-Forwarded-For`
   - `X-Forwarded-Proto`
   - `X-Forwarded-Host`

Example nginx:

```nginx
location / {
    proxy_pass http://localhost:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Troubleshooting

### Container won't start

```bash
docker compose logs app
```

### Permission issues

Set `PUID` and `PGID` in your `.env` to match your host user:

```bash
id  # Shows your UID/GID
```

### Database errors

If database is corrupted, restore from backup or reset:

```bash
docker compose down
docker volume rm fauxdash-data
docker compose up -d
```

---

See CHANGELOG.md for version history.
