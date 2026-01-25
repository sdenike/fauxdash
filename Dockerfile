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

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy initialization scripts
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh /app/scripts/
COPY --chown=nextjs:nodejs scripts/init-db.js /app/scripts/
COPY --chown=nextjs:nodejs scripts/migrate-add-description.js /app/scripts/
COPY --chown=nextjs:nodejs scripts/migrate-add-columns.js /app/scripts/
COPY --chown=nextjs:nodejs scripts/migrate-add-pageviews.js /app/scripts/
COPY --chown=nextjs:nodejs scripts/migrate-add-services.js /app/scripts/
COPY --chown=nextjs:nodejs scripts/migrate-add-service-categories.js /app/scripts/
COPY --chown=nextjs:nodejs scripts/migrate-add-accordion.js /app/scripts/
COPY --chown=nextjs:nodejs scripts/migrate-add-sorting-analytics.js /app/scripts/
COPY --chown=nextjs:nodejs scripts/migrate-add-uncategorized.js /app/scripts/
COPY --chown=nextjs:nodejs scripts/migrate-rename-maincolumns.js /app/scripts/
COPY --from=builder --chown=nextjs:nodejs /app/CHANGELOG.md /app/CHANGELOG.md
RUN chmod +x /app/scripts/docker-entrypoint.sh

# Create data directory for SQLite
RUN mkdir -p /data && chown nextjs:nodejs /data

# Create favicons directory with write permissions
RUN mkdir -p /app/public/favicons && chown -R nextjs:nodejs /app/public

EXPOSE 8080

ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
