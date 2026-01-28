FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Generate build info file
RUN node -e "const pkg = require('./package.json'); const fs = require('fs'); fs.writeFileSync('build-info.json', JSON.stringify({ version: pkg.version, buildDate: new Date().toISOString(), nodeVersion: process.version }, null, 2));"

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install shadow for usermod/groupmod and su-exec for dropping privileges
RUN apk add --no-cache shadow su-exec

# Remove existing node user/group (UID/GID 1000) and create fauxdash user
# This allows PUID/PGID to work correctly at runtime
RUN deluser --remove-home node 2>/dev/null || true && \
    delgroup node 2>/dev/null || true && \
    addgroup -g 1000 fauxdash && \
    adduser -u 1000 -G fauxdash -s /bin/sh -D fauxdash

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown fauxdash:fauxdash .next

# Automatically leverage output traces to reduce image size
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy initialization scripts
COPY scripts/docker-entrypoint.sh /app/scripts/
COPY scripts/init-db.js /app/scripts/
COPY scripts/migrate-add-description.js /app/scripts/
COPY scripts/migrate-add-columns.js /app/scripts/
COPY scripts/migrate-add-pageviews.js /app/scripts/
COPY scripts/migrate-add-services.js /app/scripts/
COPY scripts/migrate-add-service-categories.js /app/scripts/
COPY scripts/migrate-add-accordion.js /app/scripts/
COPY scripts/migrate-add-sorting-analytics.js /app/scripts/
COPY scripts/migrate-add-uncategorized.js /app/scripts/
COPY scripts/migrate-rename-maincolumns.js /app/scripts/
COPY scripts/migrate-add-open-all.js /app/scripts/
COPY scripts/migrate-add-geo-cache.js /app/scripts/
COPY --from=builder /app/CHANGELOG.md /app/CHANGELOG.md
COPY --from=builder /app/build-info.json /app/build-info.json
RUN chmod +x /app/scripts/docker-entrypoint.sh

# Create data directory for SQLite and logs
RUN mkdir -p /data /data/logs && chown -R fauxdash:fauxdash /data

# Create favicons directory with write permissions
RUN mkdir -p /app/public/favicons && chown -R fauxdash:fauxdash /app/public

EXPOSE 8080

ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

# Default PUID/PGID (can be overridden at runtime)
ENV PUID=1000
ENV PGID=1000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
