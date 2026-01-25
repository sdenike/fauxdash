# FauxDash Homepage - Project Structure

This document provides a complete overview of the project structure and file organization.

## Directory Tree

```
fauxdash/
├── .dockerignore                 # Docker build exclusions
├── .env.example                  # Production environment template
├── .env.local.example            # Development environment template
├── .eslintrc.json               # ESLint configuration
├── .gitignore                   # Git exclusions
├── BACKLOG.md                   # Feature backlog and future plans
├── CHANGELOG.md                 # Version history and changes
├── DECISIONS.md                 # Architectural decision records
├── Dockerfile                   # Container image definition
├── LICENSE                      # MIT License
├── README.md                    # Main documentation
├── SMOKE_TEST.md                # Manual testing checklist
├── docker-compose.yml           # Multi-container orchestration
├── drizzle.config.ts            # Database ORM configuration
├── next-env.d.ts                # Next.js TypeScript definitions
├── next.config.js               # Next.js configuration
├── package.json                 # Node.js dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript compiler options
│
├── public/                      # Static assets
│   └── favicon.ico              # Browser favicon
│
├── drizzle/                     # Generated database migrations (gitignored)
│   └── [migration files]        # SQL migration files
│
└── src/                         # Source code
    ├── app/                     # Next.js App Router
    │   ├── globals.css          # Global styles and CSS variables
    │   ├── layout.tsx           # Root layout component
    │   ├── page.tsx             # Homepage
    │   ├── providers.tsx        # Client-side providers (session, theme)
    │   │
    │   ├── admin/               # Admin panel
    │   │   └── page.tsx         # Admin dashboard
    │   │
    │   ├── login/               # Authentication
    │   │   └── page.tsx         # Login page
    │   │
    │   └── api/                 # API routes
    │       ├── auth/
    │       │   └── [...nextauth]/
    │       │       └── route.ts # NextAuth handler
    │       │
    │       ├── categories/
    │       │   ├── route.ts     # GET (list), POST (create)
    │       │   └── [id]/
    │       │       └── route.ts # PATCH (update), DELETE
    │       │
    │       ├── bookmarks/
    │       │   ├── route.ts     # POST (create)
    │       │   └── [id]/
    │       │       ├── route.ts # PATCH (update), DELETE
    │       │       └── click/
    │       │           └── route.ts # POST (track click)
    │       │
    │       └── weather/
    │           └── route.ts     # GET (fetch weather)
    │
    ├── components/              # React components
    │   ├── category-section.tsx # Homepage category display
    │   ├── header.tsx           # App header with nav
    │   ├── search-bar.tsx       # Search input
    │   ├── weather-widget.tsx   # Weather display
    │   │
    │   ├── admin/               # Admin-specific components
    │   │   ├── bookmark-manager.tsx  # Bookmark CRUD
    │   │   └── category-manager.tsx  # Category CRUD
    │   │
    │   └── ui/                  # Reusable UI components (shadcn/ui)
    │       ├── button.tsx       # Button component
    │       ├── card.tsx         # Card component
    │       ├── dialog.tsx       # Modal dialog
    │       ├── input.tsx        # Input field
    │       └── label.tsx        # Form label
    │
    ├── db/                      # Database layer
    │   ├── index.ts             # Database connection factory
    │   ├── migrate.ts           # Migration runner
    │   └── schema.ts            # Database schema definitions
    │
    ├── lib/                     # Utility libraries
    │   ├── auth.ts              # NextAuth configuration
    │   ├── redis.ts             # Redis client and cache helpers
    │   ├── utils.ts             # Utility functions (cn)
    │   └── weather.ts           # Weather provider abstraction
    │
    └── types/                   # TypeScript type definitions
        └── next-auth.d.ts       # NextAuth type extensions
```

## File Descriptions

### Root Configuration Files

- **docker-compose.yml**: Defines all services (app, redis, optional postgres/mysql)
- **Dockerfile**: Multi-stage build for production container
- **next.config.js**: Next.js framework configuration (standalone output)
- **tailwind.config.js**: Tailwind CSS theme and plugin configuration
- **tsconfig.json**: TypeScript compiler settings
- **drizzle.config.ts**: Drizzle ORM multi-database configuration

### Documentation

- **README.md**: Installation, usage, and configuration guide
- **DECISIONS.md**: Architectural decisions and rationale
- **CHANGELOG.md**: Version history and changes
- **SMOKE_TEST.md**: Manual testing checklist
- **BACKLOG.md**: Future features and improvements
- **PROJECT_STRUCTURE.md**: This file

### Source Code Organization

#### `/src/app`
Next.js App Router directory with file-based routing.

- **layout.tsx**: Root layout with providers
- **page.tsx**: Homepage (public view)
- **globals.css**: Global styles, CSS variables, Tailwind directives
- **providers.tsx**: Client-side context providers

#### `/src/app/api`
API routes for backend functionality.

- **categories**: CRUD operations for categories
- **bookmarks**: CRUD operations for bookmarks
- **weather**: Weather data fetching
- **auth**: NextAuth authentication handlers

#### `/src/components`
React components organized by feature.

- **UI components**: Reusable primitives from shadcn/ui
- **Feature components**: Category sections, search, weather
- **Admin components**: Category and bookmark management

#### `/src/db`
Database abstraction layer.

- **schema.ts**: Table definitions for all databases
- **index.ts**: Connection factory (SQLite/Postgres/MySQL)
- **migrate.ts**: Migration runner and default user creation

#### `/src/lib`
Utility libraries and helpers.

- **auth.ts**: Authentication configuration
- **redis.ts**: Cache helpers (get, set, delete)
- **weather.ts**: Weather provider interface and implementations
- **utils.ts**: General utilities (cn for classnames)

### Database Schema

The application uses 5 main tables:

1. **users**: User accounts and authentication
2. **categories**: Bookmark categories
3. **bookmarks**: Individual bookmarks
4. **settings**: User and system settings
5. **themes**: Custom color themes

See `src/db/schema.ts` for full schema definition.

## Data Flow

### Public Homepage
```
Browser → GET /
       → Layout (providers)
       → Homepage
       → Fetch /api/categories (SSR or client-side)
       → Display categories and bookmarks
```

### Admin Panel
```
Browser → GET /admin (auth required)
       → Admin page
       → Category Manager & Bookmark Manager components
       → CRUD operations via API
       → Optimistic updates + cache invalidation
```

### Authentication
```
Browser → POST /api/auth/signin
       → NextAuth credentials provider
       → Argon2 password verification
       → JWT session creation
       → Set session cookie
```

### Weather Widget
```
Browser → GET /api/weather?location=90210
       → Check Redis cache
       → If miss: fetch from weather provider
       → Cache result (10 min TTL)
       → Return weather data
```

## Build & Deployment

### Development
```bash
npm install
npm run dev
```

### Production (Docker)
```bash
docker compose build
docker compose up -d
```

### Database Migrations
```bash
npm run db:generate  # Generate migrations from schema
npm run db:migrate   # Apply migrations to database
```

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `DB_PROVIDER`: Database type (sqlite, postgres, mysql)
- `REDIS_ENABLED`: Enable/disable Redis caching
- `NEXTAUTH_SECRET`: Authentication secret
- `WEATHER_PROVIDER`: Weather API provider

## Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Next.js config
- **Formatting**: Follow Next.js conventions
- **Components**: Functional components with hooks
- **API Routes**: Async/await, proper error handling

## Testing

Currently manual testing via smoke test checklist.

Future: Jest + React Testing Library for unit tests.

## Performance Optimizations

- Redis caching for API responses
- Next.js standalone build (smaller image)
- Component code splitting (admin lazy loaded)
- Database connection pooling
- Optimistic UI updates

## Security Measures

- Argon2id password hashing
- JWT session tokens
- CSRF protection (NextAuth)
- Server-side authentication checks
- Secure cookie settings
- Input validation

## Scaling Considerations

- **Horizontal scaling**: Requires external database (Postgres/MySQL)
- **Database**: Connection pooling handles concurrent requests
- **Redis**: Single instance sufficient for self-hosted use
- **Static assets**: Served by Next.js (can use CDN later)

## Future Architecture

Potential improvements documented in DECISIONS.md:

- OIDC authentication providers
- S3-compatible storage for custom icons
- Time-series analytics database
- Job queue for background tasks
- API documentation with OpenAPI

---

This structure is designed for:
- **Simplicity**: Easy to understand and navigate
- **Modularity**: Components and features are isolated
- **Scalability**: Can grow with additional features
- **Maintainability**: Clear separation of concerns
