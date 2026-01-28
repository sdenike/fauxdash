#!/bin/sh
set -e

# =============================================================================
# Faux|Dash Docker Entrypoint
# =============================================================================
# Supports PUID/PGID environment variables for custom user/group IDs
# Default: PUID=1000, PGID=1000
# =============================================================================

# Default values
PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Display version and build info
echo ""
echo "============================================"
echo "           Faux|Dash Starting"
echo "============================================"
if [ -f "/app/build-info.json" ]; then
  VERSION=$(node -e "console.log(require('/app/build-info.json').version)")
  BUILD_DATE=$(node -e "console.log(require('/app/build-info.json').buildDate)")
  NODE_VER=$(node -e "console.log(require('/app/build-info.json').nodeVersion)")
  echo "  Version:    ${VERSION}"
  echo "  Built:      ${BUILD_DATE}"
  echo "  Node:       ${NODE_VER}"
else
  echo "  Version:    (build info not available)"
fi
echo "  PUID:       ${PUID}"
echo "  PGID:       ${PGID}"
echo "============================================"
echo ""

# -----------------------------------------------------------------------------
# Handle PUID/PGID - Modify user/group if different from defaults
# -----------------------------------------------------------------------------
echo "Setting up user permissions..."

# Get current UID/GID of fauxdash user
CURRENT_UID=$(id -u fauxdash 2>/dev/null || echo "1000")
CURRENT_GID=$(id -g fauxdash 2>/dev/null || echo "1000")

# Modify group if PGID is different
if [ "$PGID" != "$CURRENT_GID" ]; then
  echo "  Changing group ID from ${CURRENT_GID} to ${PGID}"
  groupmod -g "$PGID" fauxdash 2>/dev/null || true
fi

# Modify user if PUID is different
if [ "$PUID" != "$CURRENT_UID" ]; then
  echo "  Changing user ID from ${CURRENT_UID} to ${PUID}"
  usermod -u "$PUID" fauxdash 2>/dev/null || true
fi

# -----------------------------------------------------------------------------
# Fix ownership of directories
# -----------------------------------------------------------------------------
echo "Fixing directory permissions..."

# Set database path environment variables
export DATABASE_PATH="/data/fauxdash.db"
export SQLITE_FILE="/data/fauxdash.db"

# Fix ownership of data directory
chown -R fauxdash:fauxdash /data 2>/dev/null || true

# Fix ownership of app directories that need write access
chown -R fauxdash:fauxdash /app/.next 2>/dev/null || true
chown -R fauxdash:fauxdash /app/public/favicons 2>/dev/null || true

# -----------------------------------------------------------------------------
# Database initialization and migrations
# -----------------------------------------------------------------------------

# Initialize database if it doesn't exist
if [ ! -f "/data/fauxdash.db" ] || [ ! -s "/data/fauxdash.db" ]; then
  echo "Initializing database..."
  su-exec fauxdash node /app/scripts/init-db.js
  echo "Database initialized successfully"
fi

# Always run migrations (they are idempotent)
echo "Running migrations..."
su-exec fauxdash node /app/scripts/migrate-add-description.js
su-exec fauxdash node /app/scripts/migrate-add-columns.js
su-exec fauxdash node /app/scripts/migrate-add-pageviews.js
su-exec fauxdash node /app/scripts/migrate-add-services.js
su-exec fauxdash node /app/scripts/migrate-add-service-categories.js
su-exec fauxdash node /app/scripts/migrate-add-accordion.js
su-exec fauxdash node /app/scripts/migrate-add-sorting-analytics.js
su-exec fauxdash node /app/scripts/migrate-add-uncategorized.js
su-exec fauxdash node /app/scripts/migrate-rename-maincolumns.js
su-exec fauxdash node /app/scripts/migrate-add-open-all.js
su-exec fauxdash node /app/scripts/migrate-add-geo-cache.js
echo "Migrations completed"

# -----------------------------------------------------------------------------
# Start the application as the fauxdash user
# -----------------------------------------------------------------------------
echo "Starting application..."
exec su-exec fauxdash node /app/server.js
