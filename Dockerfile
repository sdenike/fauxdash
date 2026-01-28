FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Generate build info file
RUN node -e "const pkg = require('./package.json'); const fs = require('fs'); fs.writeFileSync('build-info.json', JSON.stringify({ version: pkg.version, buildDate: new Date().toISOString(), nodeVersion: process.version }, null, 2));"

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install shadow for usermod/groupmod and su-exec for dropping privileges
# Then set up user in same layer to reduce image size
RUN apk add --no-cache shadow su-exec && \
    deluser --remove-home node 2>/dev/null || true && \
    delgroup node 2>/dev/null || true && \
    addgroup -g 1000 fauxdash && \
    adduser -u 1000 -G fauxdash -s /bin/sh -D fauxdash

# Copy application files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/CHANGELOG.md /app/CHANGELOG.md
COPY --from=builder /app/build-info.json /app/build-info.json
COPY scripts/ /app/scripts/

# Set up directories and permissions in one layer
RUN mkdir -p .next /data /data/logs /app/public/favicons && \
    chown -R fauxdash:fauxdash .next /data /app/public && \
    chmod +x /app/scripts/docker-entrypoint.sh

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Default PUID/PGID (can be overridden at runtime)
ENV PUID=1000
ENV PGID=1000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
