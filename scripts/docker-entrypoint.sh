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

# Set database path environment variables
export DATABASE_PATH="/data/fauxdash.db"
export SQLITE_FILE="/data/fauxdash.db"

# -----------------------------------------------------------------------------
# Check if running as root - determines how we handle permissions
# -----------------------------------------------------------------------------
if [ "$(id -u)" = "0" ]; then
  echo "Running as root, setting up user permissions..."

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

  echo "Fixing directory permissions..."
  # Ensure site-assets directory exists for favicon and background
  mkdir -p /data/site-assets 2>/dev/null || true
  chown -R fauxdash:fauxdash /data 2>/dev/null || true
  chown -R fauxdash:fauxdash /app/.next 2>/dev/null || true
  chown -R fauxdash:fauxdash /app/public/favicons 2>/dev/null || true

  # Run as fauxdash user using su-exec
  RUN_CMD="su-exec fauxdash"
else
  echo "Running as non-root user (UID: $(id -u)), skipping permission setup..."
  # Run directly without su-exec
  RUN_CMD=""
fi

# -----------------------------------------------------------------------------
# Database initialization and migrations
# -----------------------------------------------------------------------------

# Initialize database if it doesn't exist
if [ ! -f "/data/fauxdash.db" ] || [ ! -s "/data/fauxdash.db" ]; then
  echo "Initializing database..."
  $RUN_CMD node /app/scripts/init-db.js
  echo "Database initialized successfully"
fi

# Always run migrations (they are idempotent)
echo "Running migrations..."
$RUN_CMD node /app/scripts/migrate-add-description.js
$RUN_CMD node /app/scripts/migrate-add-columns.js
$RUN_CMD node /app/scripts/migrate-add-pageviews.js
$RUN_CMD node /app/scripts/migrate-add-services.js
$RUN_CMD node /app/scripts/migrate-add-service-categories.js
$RUN_CMD node /app/scripts/migrate-add-accordion.js
$RUN_CMD node /app/scripts/migrate-add-sorting-analytics.js
$RUN_CMD node /app/scripts/migrate-add-uncategorized.js
$RUN_CMD node /app/scripts/migrate-rename-maincolumns.js
$RUN_CMD node /app/scripts/migrate-add-open-all.js
$RUN_CMD node /app/scripts/migrate-add-geo-cache.js
$RUN_CMD node /app/scripts/migrate-add-demo-flag.js
$RUN_CMD node /app/scripts/migrate-add-show-descriptions.js
$RUN_CMD node /app/scripts/migrate-add-password-reset-tokens.js
echo "Migrations completed"

# -----------------------------------------------------------------------------
# Start the application
# -----------------------------------------------------------------------------
echo "Starting application..."
exec $RUN_CMD node /app/server.js
