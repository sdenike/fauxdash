# Faux|Dash - Project Structure

This document provides an overview of the project structure and file organization.

## Directory Overview

```
fauxdash/
├── .github/                     # GitHub Actions workflows
│   └── workflows/
│       └── docker-build.yml     # Automated Docker builds
│
├── docs/                        # Documentation
│   ├── screenshots/             # UI screenshots
│   ├── plans/                   # Development plans
│   └── OIDC-SETUP-GUIDE.md     # OIDC configuration guide
│
├── drizzle/                     # Database migrations (generated)
│   └── [migration files]        # SQL migration files
│
├── public/                      # Static assets
│   ├── favicons/                # Downloaded bookmark favicons
│   ├── icons/                   # PWA icons
│   └── favicon.ico              # Default browser favicon
│
├── scripts/                     # Utility scripts
│   ├── docker-entrypoint.sh     # Container startup script
│   ├── init-db.js               # Database initialization
│   ├── migrate-all.js           # Consolidated migrations
│   ├── generate-pwa-icons.js    # PWA icon generator
│   └── release.sh               # Version release automation
│
└── src/                         # Source code
    ├── app/                     # Next.js App Router
    ├── components/              # React components
    ├── db/                      # Database layer
    ├── lib/                     # Utility libraries
    └── types/                   # TypeScript definitions
```

## Source Code Structure

### `/src/app` - Next.js App Router

```
app/
├── layout.tsx                   # Root layout with providers
├── page.tsx                     # Homepage
├── globals.css                  # Global styles and CSS variables
├── providers.tsx                # Client-side providers
│
├── admin/page.tsx               # Admin dashboard
├── login/page.tsx               # Login page
├── setup/page.tsx               # First-run setup wizard
├── settings/page.tsx            # User settings page
├── profile/page.tsx             # User profile page
│
└── api/                         # API routes
    ├── auth/[...nextauth]/      # NextAuth handlers
    ├── categories/              # Category CRUD
    ├── service-categories/      # Service category CRUD
    ├── bookmarks/               # Bookmark CRUD
    ├── services/                # Service CRUD
    ├── settings/                # Settings management
    ├── weather/                 # Weather data
    ├── analytics/               # Analytics endpoints
    ├── pageview/                # Pageview tracking
    ├── backup/                  # Backup/restore
    ├── media-library/           # Uploaded images
    ├── site-favicon/            # Site favicon management
    ├── header-logo/             # Header logo management
    ├── pwa-icons/               # PWA icon serving
    ├── demo/                    # Demo content
    └── debug/                   # Debug endpoints
```

### `/src/components` - React Components

```
components/
├── ui/                          # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── switch.tsx
│   ├── tabs.tsx
│   └── [more...]
│
├── admin/                       # Admin panel components
│   ├── category-manager.tsx     # Bookmark categories
│   ├── service-category-manager.tsx
│   ├── bookmark-manager.tsx
│   ├── service-manager.tsx
│   ├── content-manager.tsx      # Unified content management
│   ├── settings-tabs.tsx        # Settings interface
│   ├── user-manager.tsx         # User administration
│   ├── log-viewer.tsx           # Application logs
│   └── analytics-map.tsx        # GeoIP visualization
│
├── settings/                    # Settings tab components
│   ├── general-settings.tsx
│   ├── weather-settings.tsx
│   ├── appearance-settings.tsx
│   ├── email-settings.tsx
│   ├── auth-settings.tsx
│   └── geoip-settings.tsx
│
├── header.tsx                   # App header with navigation
├── search-bar.tsx               # Search input
├── weather-widget.tsx           # Weather display
├── category-section.tsx         # Homepage category display
├── icon-selector.tsx            # Icon picker component
├── pwa-install-prompt.tsx       # PWA install banner
├── dynamic-favicon.tsx          # Dynamic favicon updates
└── changelog-dialog.tsx         # Version changelog viewer
```

### `/src/db` - Database Layer

```
db/
├── index.ts                     # Database connection factory
├── schema.ts                    # Drizzle ORM schema (13 tables)
└── migrate.ts                   # Migration runner
```

**Database Tables**:
- users, categories, bookmarks
- service_categories, services
- settings, pageviews
- bookmark_clicks, service_clicks
- analytics_daily, geo_cache
- password_reset_tokens, themes

### `/src/lib` - Utility Libraries

```
lib/
├── auth.ts                      # NextAuth configuration
├── redis.ts                     # Redis client and cache helpers
├── weather.ts                   # Weather provider abstraction
├── icons.ts                     # Icon library utilities
├── favicon.ts                   # Favicon fetching utilities
├── geoip.ts                     # GeoIP lookup providers
├── email.ts                     # Email template builder
├── logger.ts                    # Application logging
├── utils.ts                     # General utilities
└── version.ts                   # Version from package.json
```

## Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Production multi-container setup |
| `docker-compose.sample.yml` | Template with comments |
| `Dockerfile` | Multi-stage container build |
| `next.config.js` | Next.js configuration |
| `tailwind.config.js` | Tailwind CSS theme |
| `drizzle.config.ts` | Database ORM configuration |
| `tsconfig.json` | TypeScript settings |
| `.env.example` | Environment variable template |

## Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `QUICK_START.md` | 5-minute setup guide |
| `CHANGELOG.md` | Version history |
| `DECISIONS.md` | Architecture decisions |
| `BACKLOG.md` | Feature backlog |
| `SMOKE_TEST.md` | Testing checklist |
| `docs/OIDC-SETUP-GUIDE.md` | OIDC configuration |

## Data Flow

### Homepage Request
```
Browser → GET /
       → Layout (providers, session)
       → Homepage
       → Fetch /api/categories, /api/service-categories
       → Track pageview (/api/pageview)
       → Display categories with bookmarks/services
```

### Admin Panel
```
Browser → GET /admin (auth required)
       → Admin dashboard
       → Content Manager, Settings, Users, Logs, Analytics
       → CRUD operations via API
       → Optimistic updates + cache invalidation
```

### Authentication
```
Browser → POST /api/auth/signin
       → NextAuth (credentials or OIDC)
       → JWT session creation
       → Set session cookie
```

## Build & Deployment

### Development
```bash
npm install
npm run dev
# Access at http://localhost:3000
```

### Production (Docker)
```bash
docker compose up -d
# Access at http://localhost:8080
```

### Database Migrations
```bash
npm run db:generate  # Generate from schema
npm run db:migrate   # Apply migrations
```

## Environment Variables

Key variables (see `.env.example` for full list):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_SECRET` | Yes | Session encryption key |
| `NEXTAUTH_URL` | Yes | Deployment URL |
| `SQLITE_FILE` | No | Database path (default: /data/fauxdash.db) |
| `REDIS_ENABLED` | No | Enable caching (default: true) |
| `REDIS_URL` | No | Redis connection URL |
| `OIDC_ENABLED` | No | Enable OIDC authentication |
| `WEATHER_PROVIDER` | No | Weather API provider |
| `GEOIP_PROVIDER` | No | GeoIP lookup provider |

## Security Measures

- Argon2id password hashing
- JWT session tokens
- CSRF protection (NextAuth)
- Server-side authentication checks
- Secure cookie settings
- Input validation
- Path traversal protection

## Performance Optimizations

- Redis caching for API responses
- Next.js standalone build (smaller image)
- Component code splitting
- Optimistic UI updates
- In-memory settings cache with TTL
- Efficient database queries (N+1 fixes)

---

This structure is designed for simplicity, modularity, and maintainability.
