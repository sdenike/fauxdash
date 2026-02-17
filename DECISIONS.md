# Architecture Decisions

This document records key architectural and implementation decisions made during the development of Faux|Dash.

## Technology Stack

### Frontend Framework: Next.js 16 (App Router)
**Decision**: Use Next.js 16 with App Router.

**Rationale**:
- Modern React 19 Server Components for better performance
- Built-in API routes for backend functionality
- Excellent TypeScript support
- Single framework for both frontend and backend
- Active community and ecosystem

**Tradeoffs**:
- Larger bundle size compared to minimal frameworks
- Learning curve for App Router vs Pages Router

### UI Framework: Tailwind CSS + shadcn/ui
**Decision**: Use Tailwind CSS for styling with shadcn/ui component library.

**Rationale**:
- Utility-first approach for rapid development
- shadcn/ui provides high-quality, customizable components
- No external CDN dependencies (fully local)
- Excellent dark mode support
- Modern, clean aesthetic

### Icons: Multiple Libraries
**Decision**: Support Heroicons, Material Design Icons (7,000+), and selfh.st icons.

**Rationale**:
- Wide variety of icon choices
- Heroicons for UI, MDI for categories/bookmarks
- selfh.st for self-hosted service logos
- All bundled locally (no CDN)

### Database: SQLite Only
**Decision**: Use SQLite as the only database (simplified from original multi-DB support in v0.10.0).

**Rationale**:
- Zero configuration required
- No separate container needed
- Perfect for self-hosted single-user scenarios
- File-based persistence
- Fast for small to medium datasets
- Removed ~2,000 lines of multi-database complexity

**Tradeoffs**:
- Not ideal for high-concurrency scenarios
- Limited to single-server deployment

### Authentication: NextAuth.js with Local + OIDC
**Decision**: Implement NextAuth.js with credentials provider and OIDC support.

**Rationale**:
- Industry-standard authentication for Next.js
- Built-in session management
- OIDC support for SSO with Authentik, Keycloak, Okta, etc.
- JWT-based sessions (no DB queries on every request)
- Secure by default

**Implemented Features**:
- Local credential authentication with Argon2id
- OIDC/SSO authentication (configurable in Admin > Settings > Auth)
- Password reset via email
- Remember Me with configurable duration

### Password Hashing: Argon2
**Decision**: Use Argon2id for password hashing.

**Rationale**:
- Winner of Password Hashing Competition (2015)
- More secure than bcrypt
- Resistant to GPU cracking attacks

### Caching: Redis (Optional)
**Decision**: Include Redis as optional caching layer, enabled by default.

**Rationale**:
- Significant performance improvement for homepage data
- Weather API responses can be cached
- Optional - app works without it
- Included in docker-compose for ease of use

### Drag-and-Drop: dnd-kit
**Decision**: Use @dnd-kit for drag-and-drop functionality.

**Rationale**:
- Modern, performant library
- Built for React
- Excellent TypeScript support
- Accessible by default

## Implementation Decisions

### SPA-like Behavior with AJAX
**Decision**: Use client-side data fetching with optimistic updates.

**Rationale**:
- No full page reloads for better UX
- Immediate feedback on user actions
- Better perceived performance

### Icon Storage: Multiple Approaches
**Decision**: Support emoji, Heroicons, MDI, selfh.st, and auto-fetched favicons.

**Implementation**:
- Icons stored as text identifiers in database
- Favicon auto-fetch from URLs with local storage
- SVG rendering for icon libraries
- Color transformations (theme color, monotone, invert)

### Weather Provider Abstraction
**Decision**: Create a WeatherProvider interface with multiple implementations.

**Supported Providers**:
- Tempest Weather (recommended)
- WeatherAPI.com
- OpenWeatherMap

### Analytics: Pageviews + Click Tracking + GeoIP
**Decision**: Comprehensive analytics without external services.

**Implementation**:
- Pageview tracking with path and timestamp
- Click counting for bookmarks and services
- GeoIP lookup (MaxMind or ipinfo.io)
- Analytics map visualization
- 30-day data retention

### Migration Strategy: Drizzle Kit + Custom Scripts
**Decision**: Use Drizzle Kit for schema, custom scripts for Docker.

**Implementation**:
- Drizzle ORM for type-safe queries
- `scripts/migrate-all.js` consolidates 15+ migration scripts
- Automatic migrations on container start
- Idempotent migrations (safe to run repeatedly)

### Default Data: Setup Wizard
**Decision**: Browser-based setup wizard instead of hardcoded defaults.

**Implementation**:
- `/setup` wizard on first run
- User creates admin account
- Optional demo content loading
- No default admin credentials to change

## PWA Support

**Decision**: Full Progressive Web App support (added in v0.7.0).

**Implementation**:
- Service worker for offline caching
- Web app manifest with configurable icons
- "Add to Home Screen" prompts
- Offline fallback page
- Mobile-responsive layouts

## Security Decisions

### Password Requirements
- Password strength meter on setup
- No enforced complexity (self-hosted, trusted users)

### Session Management
- JWT tokens with configurable expiration
- "Remember Me" with extended sessions (up to 1 year)

### SMTP Verification
- Test email required to activate SMTP
- Prevents misconfigured email settings

## Deployment Decisions

### Docker as Primary Deployment
**Decision**: Docker Compose is the official deployment method.

**Rationale**:
- Consistent environment across platforms
- Easy updates (pull and restart)
- Bundled dependencies
- Isolated from host system

### PUID/PGID Support
- Container supports custom user/group IDs
- Fixes permission issues on NAS systems

### Multi-Platform Builds
- Automated builds for linux/amd64 and linux/arm64
- Published to GitHub Container Registry

### Data Persistence
**Decision**: Named Docker volumes for all persistent data.

**Volumes**:
- `fauxdash-data`: Database, settings, site assets
- `fauxdash-favicons`: Downloaded favicons
- `fauxdash-logs`: Application logs
- `redis-data`: Cache persistence

---

This document is updated as architectural decisions evolve. See CHANGELOG.md for version history.
