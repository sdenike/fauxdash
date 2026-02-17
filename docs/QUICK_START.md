# Faux|Dash - Quick Start Guide

Get up and running in under a minute!

## Prerequisites

- **Docker** and **Docker Compose** installed

## Step 1: Get the Compose File

```bash
curl -O https://raw.githubusercontent.com/sdenike/fauxdash/master/docker-compose.sample.yml
mv docker-compose.sample.yml docker-compose.yml
```

Or clone the repository:

```bash
git clone https://github.com/sdenike/fauxdash.git
cd fauxdash
```

## Step 2: Start

```bash
docker compose up -d
```

That's it! No configuration files to edit.

## Step 3: Setup

1. Open http://localhost:8080
2. Complete the setup wizard to create your admin account
3. Optionally load demo content to explore features

## Next Steps

All configuration is done through **Admin > Settings**:

- Configure weather providers
- Customize appearance
- Set up OIDC/SSO authentication
- Configure SMTP for password reset
- Enable Redis caching (requires external Redis)

## Common Issues

### Port 8080 already in use

Edit `docker-compose.yml`:
```yaml
ports:
  - "3000:8080"  # Change 3000 to any available port
```

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

## Backup

Use the built-in backup in **Admin > Tools**, or backup the Docker volume:

```bash
docker run --rm -v fauxdash-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

## Stop

```bash
docker compose down
```

## Full Documentation

See [README.md](../README.md) for complete documentation.
