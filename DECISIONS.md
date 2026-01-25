# Architecture Decisions

This document records key architectural and implementation decisions made during the development of FauxDash Homepage.

## Technology Stack

### Frontend Framework: Next.js 14 (App Router)
**Decision**: Use Next.js 14 with App Router instead of Pages Router or other frameworks.

**Rationale**:
- Modern React Server Components for better performance
- Built-in API routes for backend functionality
- Excellent TypeScript support
- Single framework for both frontend and backend
- Active community and ecosystem

**Tradeoffs**:
- Larger bundle size compared to minimal frameworks
- Learning curve for App Router vs Pages Router
- More opinionated structure

### UI Framework: Tailwind CSS + shadcn/ui
**Decision**: Use Tailwind CSS for styling with shadcn/ui component library.

**Rationale**:
- Utility-first approach for rapid development
- shadcn/ui provides high-quality, customizable components
- No external CDN dependencies (fully local)
- Excellent dark mode support
- Modern, clean aesthetic

**Tradeoffs**:
- Larger CSS payload (mitigated by purging)
- Requires learning Tailwind classes
- Component library is copy-paste (not npm package)

### Icons: Heroicons
**Decision**: Use Heroicons for all UI icons.

**Rationale**:
- MIT licensed, free to use
- React components (no SVG imports needed)
- Consistent design language
- Maintained by Tailwind Labs
- Bundled locally (no CDN)

**Tradeoffs**:
- Limited icon set compared to FontAwesome
- Adds to bundle size

### Database: Multi-DB Support (SQLite/PostgreSQL/MySQL)
**Decision**: Support three database backends with abstraction layer using Drizzle ORM.

**Rationale**:
- SQLite for simple, single-file deployment (default)
- PostgreSQL for users wanting robust production DB
- MySQL for existing infrastructure compatibility
- Drizzle ORM provides excellent multi-DB support
- Type-safe queries with TypeScript

**Tradeoffs**:
- More complex schema management
- Need to test against all three databases
- Drizzle ORM less mature than Prisma

### Default Database: SQLite
**Decision**: Use SQLite as the default database in docker-compose.yml.

**Rationale**:
- Zero configuration required
- No separate container needed
- Perfect for self-hosted single-user scenarios
- File-based persistence
- Fast for small to medium datasets

**Tradeoffs**:
- Not ideal for high-concurrency scenarios
- Limited to single-server deployment
- Less features than PostgreSQL

### Authentication: NextAuth.js (Local + OIDC Ready)
**Decision**: Implement NextAuth.js with credentials provider, designed for future OIDC support.

**Rationale**:
- Industry-standard authentication for Next.js
- Built-in session management
- Easy to add OIDC providers later
- JWT-based sessions (no DB queries on every request)
- Secure by default

**Tradeoffs**:
- Heavier than custom auth solution
- OIDC not implemented in v0 (local auth only)
- Requires NEXTAUTH_SECRET management

### Password Hashing: Argon2
**Decision**: Use Argon2id for password hashing.

**Rationale**:
- Winner of Password Hashing Competition (2015)
- More secure than bcrypt
- Resistant to GPU cracking attacks
- Modern algorithm

**Tradeoffs**:
- Slightly slower than bcrypt (good for security)
- Less widespread adoption than bcrypt
- Native dependencies (compiled module)

### Caching: Redis (Optional)
**Decision**: Include Redis as optional caching layer, enabled by default.

**Rationale**:
- Significant performance improvement for homepage data
- Weather API responses can be cached
- Optional - app works without it
- Included in docker-compose for ease of use

**Tradeoffs**:
- Additional service to manage
- More memory usage
- Adds complexity to deployment

### Drag-and-Drop: dnd-kit
**Decision**: Use @dnd-kit for drag-and-drop functionality.

**Rationale**:
- Modern, performant library
- Built for React
- Excellent TypeScript support
- Accessible by default
- Active maintenance

**Tradeoffs**:
- Adds ~40KB to bundle
- More complex API than simpler libraries
- Requires understanding of sensors and contexts

## Implementation Decisions

### SPA-like Behavior with AJAX
**Decision**: Use client-side data fetching with optimistic updates instead of server actions.

**Rationale**:
- No full page reloads for better UX
- Immediate feedback on user actions
- Simpler to implement analytics (click tracking)
- Better perceived performance

**Tradeoffs**:
- More client-side JavaScript
- Need to handle loading and error states
- Potential for stale data (mitigated by cache invalidation)

### Icon Storage: Text Fields (Emoji)
**Decision**: Store icons as emoji text in database, not as uploaded files.

**Rationale**:
- No file storage system required
- Instant availability
- No image optimization needed
- Unicode support is universal
- Easy to manage

**Tradeoffs**:
- Limited to emoji set
- No custom icon uploads in v0
- May not match brand aesthetics

**Future Enhancement**: Custom SVG upload can be added later.

### Weather Provider Abstraction
**Decision**: Create a WeatherProvider interface with multiple implementations.

**Rationale**:
- Users can choose their preferred service
- Easy to add new providers
- No vendor lock-in
- Follows SOLID principles (Open/Closed)

**Tradeoffs**:
- More code to maintain
- Need to keep up with API changes from multiple providers

### Analytics: Simple Click Counting
**Decision**: Track bookmark clicks with simple counter in database.

**Rationale**:
- No external analytics service needed
- Privacy-focused (no user tracking)
- Useful for admin to see popular links
- Minimal overhead

**Tradeoffs**:
- Limited analytics (just click count)
- No time-series data
- No user journey tracking

**Future Enhancement**: Can add more detailed analytics later.

### Migration Strategy: Drizzle Kit
**Decision**: Use Drizzle Kit for generating and running migrations.

**Rationale**:
- Automatic migration generation from schema
- Type-safe migrations
- Works across all supported databases
- Version-controlled migration files

**Tradeoffs**:
- Manual migration review needed
- Need to run migrations on deployment

### Default Data: Admin User Only
**Decision**: Create only default admin user on first run, no sample data.

**Rationale**:
- Clean slate for users
- No unnecessary data to clean up
- Users add their own bookmarks
- Reduces initial database size

**Tradeoffs**:
- Empty homepage on first visit
- Need to explain setup in docs

### Session Storage: JWT (Not Database)
**Decision**: Use JWT sessions stored in cookies, not database-backed sessions.

**Rationale**:
- No database query on every request
- Works without Redis
- Stateless authentication
- Easier to scale horizontally

**Tradeoffs**:
- Cannot revoke sessions immediately
- Larger cookie size
- Need to manage secret rotation

### API Design: RESTful with CRUD
**Decision**: Implement RESTful API endpoints for categories and bookmarks.

**Rationale**:
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- Easy to understand and document
- Works with any HTTP client
- Can be consumed by external tools

**Tradeoffs**:
- More endpoints than GraphQL
- Potential for over-fetching
- No built-in query language

### CSRF Protection: NextAuth Built-in
**Decision**: Rely on NextAuth's built-in CSRF protection.

**Rationale**:
- Automatic CSRF token handling
- Same-site cookie policy
- No additional configuration needed

**Tradeoffs**:
- Tied to NextAuth implementation
- Less control over CSRF strategy

## Deferred Features

The following features were considered but deferred to future versions:

### OIDC Authentication
**Status**: Architecture ready, not implemented

**Reason**: Local authentication sufficient for v0. OIDC adds complexity and requires external provider setup.

**Future**: Can be added by implementing additional NextAuth provider.

### Passkeys
**Status**: Not implemented

**Reason**: Experimental browser support, complex implementation, local auth sufficient.

**Future**: May add as alternative to passwords.

### Custom SVG Icon Upload
**Status**: Not implemented

**Reason**: Requires file storage system, emoji sufficient for v0.

**Future**: Can add S3-compatible storage later.

### Advanced Analytics
**Status**: Basic click counting only

**Reason**: Complex analytics require time-series database or external service.

**Future**: Could add chart visualization of click trends.

### Multi-User Themes
**Status**: Single global theme only

**Reason**: User-specific themes require additional database tables and complexity.

**Future**: Can add per-user theme preferences.

### Bookmark Import/Export
**Status**: Not implemented

**Reason**: Low priority for v0, manual entry acceptable.

**Future**: Can add CSV/JSON import/export.

### Mobile App
**Status**: Responsive web only

**Reason**: Progressive Web App sufficient for mobile access.

**Future**: Could create native app or better PWA support.

### Kubernetes Deployment
**Status**: Docker Compose only

**Reason**: Self-hosted use case typically doesn't need K8s.

**Future**: Can provide Helm chart if demand exists.

## Performance Optimizations

### Redis Caching Strategy
- Homepage data: 5 minutes TTL
- Weather data: 10 minutes TTL
- Cache invalidation on admin mutations

### Database Indexes
- Added on frequently queried columns (email, category_id)
- Order columns indexed for sorting

### Bundle Optimization
- Tree-shaking enabled
- Dynamic imports for admin panel
- Image optimization with Next.js

## Security Decisions

### Password Requirements
**Decision**: No password complexity requirements in v0.

**Reason**: Self-hosted, trusted users, avoid user friction.

**Future**: Can add configurable password policy.

### Rate Limiting
**Decision**: Not implemented in v0.

**Reason**: Self-hosted behind firewall, low risk.

**Future**: Can add if needed for public-facing deployments.

### Content Security Policy
**Decision**: Default Next.js CSP.

**Reason**: Sufficient for v0, no user-generated content.

**Future**: Can tighten if security requirements increase.

## Deployment Decisions

### Docker as Primary Deployment
**Decision**: Docker Compose is the official deployment method.

**Rationale**:
- Consistent environment across platforms
- Easy updates (pull and restart)
- Bundled dependencies
- Isolated from host system

**Tradeoffs**:
- Requires Docker knowledge
- Larger disk usage than native
- Potential performance overhead (minimal)

### Data Persistence
**Decision**: Named Docker volumes for data persistence.

**Rationale**:
- Survives container recreation
- Easy to backup
- Docker-managed lifecycle

**Tradeoffs**:
- Less obvious file location than bind mounts
- Requires Docker CLI for direct access

---

This document will be updated as new decisions are made and the project evolves.
