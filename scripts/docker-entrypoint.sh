#!/bin/sh
set -e

echo "Starting FauxDash initialization..."

# Set database path environment variables
export DATABASE_PATH="/data/fauxdash.db"
export SQLITE_FILE="/data/fauxdash.db"

# Ensure proper permissions for the data directory
chown -R nextjs:nodejs /data 2>/dev/null || true

# Initialize database if it doesn't exist
if [ ! -f "/data/fauxdash.db" ] || [ ! -s "/data/fauxdash.db" ]; then
  echo "Initializing database..."
  su nextjs -s /bin/sh -c "node /app/scripts/init-db.js"
  echo "Database initialized successfully"
fi

# Always run migrations (they are idempotent)
echo "Running migrations..."
su nextjs -s /bin/sh -c "node /app/scripts/migrate-add-description.js"
su nextjs -s /bin/sh -c "node /app/scripts/migrate-add-columns.js"
su nextjs -s /bin/sh -c "node /app/scripts/migrate-add-pageviews.js"
su nextjs -s /bin/sh -c "node /app/scripts/migrate-add-services.js"
su nextjs -s /bin/sh -c "node /app/scripts/migrate-add-service-categories.js"
su nextjs -s /bin/sh -c "node /app/scripts/migrate-add-accordion.js"
su nextjs -s /bin/sh -c "node /app/scripts/migrate-add-sorting-analytics.js"
su nextjs -s /bin/sh -c "node /app/scripts/migrate-add-uncategorized.js"
su nextjs -s /bin/sh -c "node /app/scripts/migrate-rename-maincolumns.js"
echo "Migrations completed"

echo "Starting application..."
exec su nextjs -s /bin/sh -c "exec node /app/server.js"
