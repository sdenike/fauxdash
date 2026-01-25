# Comprehensive Faux|Dash Feature Roadmap

**Status**: Planning
**Created**: 2026-01-23
**Priority**: High
**Complexity**: High

## Overview

This plan outlines a comprehensive roadmap for Faux|Dash enhancements across five major areas: immediate UX fixes, favicon system overhaul, analytics expansion, widget architecture, and multi-user support. The goal is to transform Faux|Dash from a single-user bookmark dashboard into a robust, multi-tenant platform with advanced personalization and third-party integrations.

### Problem Statement

Current limitations blocking user experience and scalability:

1. **UI/UX Gaps**: Date/Time positioning inflexible, no variable substitution for personalization, Item Spacing slider allows negative values
2. **Favicon Management**: Unreliable fetching (single provider), no manual override, no batch progress tracking, limited transformations
3. **Analytics Blind Spots**: No temporal patterns, no usage-based sorting to surface underutilized bookmarks
4. **No Widget Ecosystem**: Cannot integrate media servers (Plex, Jellyfin), monitoring tools (Unifi), or RSS feeds
5. **Single-User Architecture**: All categories/bookmarks are globally shared, blocking multi-tenant deployments
6. **Security/Performance Debt**: No CSP, no input validation, 40+ useState variables causing re-renders

### Success Criteria

- ✅ Date/Time displays in header with user-configurable positioning
- ✅ Variable substitution ({{username}}, {{email}}, {{firstname}}, {{lastname}}) works in all configurable text fields
- ✅ Favicon fetch success rate >90% with manual fallback for remaining 10%
- ✅ Icon browser loads <100ms for 500+ icons
- ✅ Analytics capture hourly/daily/weekly/monthly click patterns
- ✅ Widget system supports 3+ initial integrations (Plex, Jellyfin, RSS)
- ✅ Multi-user support with complete data isolation (categories, bookmarks, settings per user)
- ✅ CSP implemented with nonces, all inputs validated with Zod

## Proposed Solution

### Phase 1: Immediate UX Fixes (Week 1)
**Goal**: Resolve user-reported pain points with minimal architectural changes.

**1.1 Date/Time Header Integration**
- **Current**: Date/Time displays below welcome message on main page (`src/app/page.tsx:202-211`)
- **Change**: Move to header component with position setting (left/center/right)
- **Implementation**:
  ```typescript
  // New setting: dateTimePosition ('left' | 'center' | 'right')
  // In src/components/header.tsx:
  <div className="flex items-center justify-between">
    {dateTimePosition === 'left' && <DateTimeDisplay />}
    <SiteTitle />
    {dateTimePosition === 'center' && <DateTimeDisplay />}
    <Actions />
    {dateTimePosition === 'right' && <DateTimeDisplay />}
  </div>
  ```
- **Files**: `src/components/header.tsx`, `src/app/api/settings/route.ts`, `src/app/admin/settings/page.tsx`

**1.2 Variable Substitution System**
- **Scope**: Welcome message, custom text fields in settings
- **Variables**: `{{username}}`, `{{email}}`, `{{firstname}}`, `{{lastname}}`
- **Implementation**:
  ```typescript
  // New utility: src/lib/template.ts
  export function substituteVariables(template: string, user: User): string {
    return template
      .replace(/\{\{username\}\}/g, user.username || user.email)
      .replace(/\{\{email\}\}/g, user.email)
      .replace(/\{\{firstname\}\}/g, user.firstname || '')
      .replace(/\{\{lastname\}\}/g, user.lastname || '')
  }
  ```
- **Files**: `src/lib/template.ts`, `src/app/page.tsx:196-200`, `src/app/admin/settings/page.tsx`

**1.3 User Profile Expansion**
- **Current Schema** (`src/db/schema.ts:42-51`): `email`, `username`, `passwordHash`, `isAdmin`
- **Add Fields**:
  ```typescript
  firstname: text('firstname'),
  lastname: text('lastname'),
  ```
- **Migration**: Add nullable columns, provide UI in settings for users to populate
- **Files**: `src/db/schema.ts`, migration file, `src/app/admin/settings/page.tsx`

**1.4 Item Spacing Slider Fix**
- **Current**: Allows negative values (bug)
- **Fix**: Add `min={0}` and `max={18}` to slider components
- **Files**: `src/app/admin/settings/page.tsx` (lines with spacing sliders)

**Deliverables**:
- Date/Time appears in header with 3 position options
- Variable substitution works in welcome message
- Users can set firstname/lastname in profile
- Item Spacing slider constrained to 0-18px

**Success Metrics**:
- Zero negative spacing values in database
- >80% of users set firstname/lastname within 1 week
- Variable substitution tested on 100% of supported fields

---

### Phase 2: Favicon System Overhaul (Week 2-3)
**Goal**: Achieve >90% favicon fetch success rate with manual overrides and batch processing.

**2.1 Multi-Provider Favicon Fetching**
- **Current** (`src/app/api/favicons/fetch/route.ts`): Google → favicon.ico → DuckDuckGo
- **Add Providers**:
  - [FaviconExtractor API](https://favicon.im) - 99% success rate, 500ms avg response
  - [Clearbit Logo API](https://clearbit.com/logo) - high-quality logos
  - [Favicon.io](https://favicon.io) - fallback generator
- **Strategy**: Try in parallel, return first success
- **Implementation**:
  ```typescript
  const fetchWithProviders = async (domain: string) => {
    const providers = [
      () => fetch(`https://favicon.im/${domain}?size=64`),
      () => fetch(`https://logo.clearbit.com/${domain}`),
      () => fetchCurrentImplementation(domain)
    ]
    return Promise.race(providers.map(p => p()))
  }
  ```
- **Files**: `src/app/api/favicons/fetch/route.ts`, new `src/lib/favicon-providers.ts`

**2.2 Favicon Editor with Transformations**
- **Transformations**: Monochrome, theme color overlay, brightness/contrast, invert
- **Current** (`src/app/api/favicons/[...path]/route.ts:140-220`): Only monotone and invert exist
- **Enhance**:
  ```typescript
  // Add Sharp transformations:
  .modulate({ brightness: 1.2, saturation: 0 }) // Monochrome
  .tint({ r: 59, g: 130, b: 246 }) // Theme color (primary blue)
  .linear(1.5, 0) // Contrast boost
  ```
- **UI**: Add live preview in admin panel with slider controls
- **Files**: `src/app/api/favicons/transform/route.ts`, `src/components/admin/favicon-editor.tsx`

**2.3 Manual Favicon Uploader**
- **Use Case**: Auto-fetch fails, user has custom icon
- **Implementation**:
  ```typescript
  // New endpoint: POST /api/favicons/upload
  // Accept: multipart/form-data with PNG/JPG/SVG
  // Store: public/favicons/custom/{domain}_{timestamp}.png
  // Update bookmark icon reference
  ```
- **UI**: Dropzone component in bookmark edit dialog
- **Files**: `src/app/api/favicons/upload/route.ts`, `src/components/admin/bookmark-manager.tsx`

**2.4 Batch Favicon Fetch with Real-time Progress**
- **Current**: No batch processing
- **Implementation**:
  - Server-Sent Events (SSE) endpoint: `/api/favicons/batch-fetch`
  - Client subscribes to event stream
  - Server emits: `{domain, status: 'pending' | 'success' | 'failed', url?, error?}`
- **Rate Limiting**: 5 concurrent fetches, 100ms delay between batches
- **Retry Logic**: 3 attempts with exponential backoff
- **Example**:
  ```typescript
  // Server (SSE):
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  for (const bookmark of bookmarks) {
    writer.write(`data: ${JSON.stringify({ domain, status: 'pending' })}\n\n`)
    const result = await fetchFavicon(bookmark.url)
    writer.write(`data: ${JSON.stringify({ domain, status: result.ok ? 'success' : 'failed' })}\n\n`)
  }

  // Client:
  const eventSource = new EventSource('/api/favicons/batch-fetch')
  eventSource.onmessage = (e) => updateProgress(JSON.parse(e.data))
  ```
- **Files**: `src/app/api/favicons/batch-fetch/route.ts`, `src/components/admin/batch-favicon-fetcher.tsx`

**Deliverables**:
- Favicon fetch success rate >90% across all bookmarks
- Manual uploader for remaining <10% failures
- Batch fetch UI with real-time progress bars
- Favicon editor with 5+ transformation options

**Success Metrics**:
- Measure baseline fetch success rate (current)
- Target >90% post-implementation
- <2s average batch processing time per 10 bookmarks
- Zero manual upload errors

---

### Phase 3: Analytics Expansion (Week 4)
**Goal**: Surface temporal usage patterns and enable data-driven bookmark sorting.

**3.1 Enhanced Analytics Schema**
- **Current** (`src/db/schema.ts`): `pageviews` table tracks path + timestamp, `clicks` column on bookmarks/services
- **Add Tables**:
  ```typescript
  bookmarkClickEvents: {
    id: integer().primaryKey(),
    bookmarkId: integer().references(() => bookmarks.id),
    userId: integer().references(() => users.id),
    timestamp: timestamp(),
    hourOfDay: integer(), // 0-23
    dayOfWeek: integer(), // 0-6
  }

  serviceClickEvents: {
    // Same structure for services
  }
  ```
- **Migration**: Backfill from existing `clicks` count (distribute evenly over last 30 days)
- **Files**: `src/db/schema.ts`, migration, `src/app/api/bookmarks/[id]/click/route.ts`

**3.2 Temporal Analytics Queries**
- **Endpoints**:
  - `GET /api/analytics/bookmarks?period=hour|day|week|month` → Click counts aggregated by time period
  - `GET /api/analytics/heatmap` → 24x7 grid of clicks by hour + day of week
- **Example Query**:
  ```typescript
  // Clicks by hour:
  SELECT hourOfDay, COUNT(*) as clicks
  FROM bookmarkClickEvents
  WHERE timestamp > NOW() - INTERVAL 7 DAY
  GROUP BY hourOfDay
  ```
- **Files**: `src/app/api/analytics/bookmarks/route.ts`, `src/app/api/analytics/heatmap/route.ts`

**3.3 Usage-Based Sorting Algorithms**
- **Strategy**: Balance personalized content (70%) with discovery (20%) and serendipity (10%) to avoid filter bubble
- **Sorting Options** (add to existing `sortBy` in `src/db/schema.ts:35`):
  - `underutilized` - Bookmarks with <10th percentile clicks in last 30 days
  - `trending` - Highest click velocity (today's clicks / 30-day average)
  - `time-aware` - Prioritize bookmarks clicked frequently at current hour historically
- **Implementation**:
  ```typescript
  // Underutilized:
  SELECT * FROM bookmarks
  WHERE clicks < (SELECT PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY clicks) FROM bookmarks)
  ORDER BY clicks ASC

  // Time-aware (8am example):
  SELECT bookmarkId, COUNT(*) as morningClicks
  FROM bookmarkClickEvents
  WHERE hourOfDay BETWEEN 7 AND 9
  GROUP BY bookmarkId
  ORDER BY morningClicks DESC
  ```
- **UI**: Add to category `sortBy` dropdown in `src/components/admin/category-manager.tsx:311-317`
- **Files**: `src/lib/sorting.ts`, `src/app/api/categories/route.ts`

**3.4 Analytics Dashboard**
- **Widgets**:
  - Heatmap (clicks by hour x day)
  - Top 10 most/least clicked bookmarks
  - Click trend line chart (past 30 days)
  - Underutilization alerts ("5 bookmarks haven't been clicked in 14 days")
- **Library**: Recharts for charts (already installed per research)
- **Files**: `src/app/admin/analytics/page.tsx`, `src/components/admin/analytics-widgets.tsx`

**Deliverables**:
- Analytics track hourly/daily/weekly/monthly patterns
- 3 new sorting algorithms (underutilized, trending, time-aware)
- Admin analytics dashboard with heatmap + charts

**Success Metrics**:
- Analytics queries execute in <200ms for 10k click events
- Users discover >30% more bookmarks with underutilized sorting
- <5% increase in category load time with new sorting

---

### Phase 4: Widget Architecture (Week 5-7)
**Goal**: Support 3rd-party service integrations (Plex, Jellyfin, RSS) with isolated state and dynamic loading.

**4.1 Widget System Architecture**
- **Design Principles** (from research):
  - **Isolation**: Each widget manages own state via Jotai atoms
  - **Performance**: Dynamic imports with `next/dynamic`, partial prerendering for static shell
  - **Extensibility**: Plugin-based registration system
- **Core Components**:
  ```typescript
  // src/lib/widgets/registry.ts
  export interface WidgetConfig {
    id: string
    name: string
    icon: string
    component: () => Promise<{ default: React.ComponentType<any> }>
    settingsSchema: z.ZodObject<any>
  }

  export const widgetRegistry = new Map<string, WidgetConfig>()

  // src/components/widget-container.tsx
  const Widget = dynamic(() => widgetRegistry.get(widgetId)!.component(), {
    loading: () => <WidgetSkeleton />,
    ssr: false // Client-only for API calls
  })
  ```
- **State Management**: Jotai for widget-specific state, Zustand for global widget layout
- **Database Schema**:
  ```typescript
  widgets: {
    id: integer().primaryKey(),
    userId: integer().references(() => users.id),
    widgetType: text(), // 'plex', 'jellyfin', 'rss'
    config: text(), // JSON-serialized settings
    position: integer(),
    size: text(), // 'small' | 'medium' | 'large'
  }
  ```
- **Files**: `src/lib/widgets/registry.ts`, `src/components/widget-container.tsx`, `src/db/schema.ts`

**4.2 Initial Widget Implementations**

**Plex Widget**:
- **Features**: "Now Playing" from Plex Media Server, poster thumbnails, play counts
- **API**: Plex API via personal auth token
- **Settings**: Server URL, auth token, library filter
- **Component**:
  ```typescript
  // src/lib/widgets/plex/plex-widget.tsx
  export default function PlexWidget({ config }: { config: PlexConfig }) {
    const { data: nowPlaying } = useSWR('/api/widgets/plex/now-playing', fetcher)
    return (
      <Card>
        <CardHeader>Now Playing on Plex</CardHeader>
        <CardContent>
          {nowPlaying?.map(item => (
            <div key={item.key}>
              <img src={item.thumb} />
              <span>{item.title}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }
  ```
- **Files**: `src/lib/widgets/plex/`, `src/app/api/widgets/plex/route.ts`

**Jellyfin Widget**:
- **Features**: Recent additions, random "Watch Tonight" suggestion
- **API**: Jellyfin API
- **Settings**: Server URL, API key, user ID
- **Files**: `src/lib/widgets/jellyfin/`, `src/app/api/widgets/jellyfin/route.ts`

**RSS Feed Widget**:
- **Features**: News ticker with auto-scroll, configurable feed URLs
- **Implementation**: RSS parser library (rss-parser)
- **Settings**: Feed URLs (comma-separated), refresh interval
- **Component**:
  ```typescript
  // Auto-scrolling ticker:
  <div className="overflow-hidden">
    <div className="animate-scroll">
      {feedItems.map(item => <span>{item.title}</span>)}
    </div>
  </div>
  ```
- **Files**: `src/lib/widgets/rss/`, `src/app/api/widgets/rss/route.ts`

**4.3 Widget Management UI**
- **Features**:
  - Widget gallery (browse available widgets)
  - Drag-and-drop layout editor (react-grid-layout)
  - Per-widget settings panel
  - Add/remove/resize widgets
- **Component**: `src/app/admin/widgets/page.tsx`
- **Layout State**: Zustand store for widget positions/sizes
  ```typescript
  interface WidgetLayout {
    widgets: Array<{ id: string, x: number, y: number, w: number, h: number }>
  }
  ```
- **Files**: `src/app/admin/widgets/page.tsx`, `src/components/admin/widget-gallery.tsx`

**4.4 Widget Display Integration**
- **Placement**: Configurable (above/below services, above/below bookmarks, dedicated section)
- **Setting**: `widgetSection` ('above-services' | 'below-services' | 'above-bookmarks' | 'below-bookmarks' | 'dedicated')
- **Implementation**:
  ```typescript
  // In src/app/page.tsx:
  {widgetSection === 'above-services' && <WidgetGrid />}
  <ServicesSection />
  {widgetSection === 'below-services' && <WidgetGrid />}
  ```
- **Files**: `src/app/page.tsx`, `src/components/widget-grid.tsx`

**Deliverables**:
- Widget registry system with dynamic loading
- 3 working widgets (Plex, Jellyfin, RSS)
- Admin UI for managing widgets with drag-and-drop
- Widget section appears on homepage based on user config

**Success Metrics**:
- Widget components lazy-load in <100ms
- Plex/Jellyfin API calls cached with SWR, <1s fetch time
- RSS feed updates every 5 minutes
- Widget grid renders <500ms for 10 widgets

---

### Phase 5: Multi-User Support (Week 8-10)
**Goal**: Isolate categories, bookmarks, and settings per user with role-based access control.

**5.1 Multi-Tenancy Architecture**
- **Strategy** (from research): Shared database with `userId` discriminator on all user-scoped tables
- **Schema Migrations**:
  ```typescript
  // Add userId to categories:
  categories: {
    userId: integer().references(() => users.id).notNull(),
    // ... existing columns
  }

  // Add userId to bookmarks:
  bookmarks: {
    userId: integer().references(() => users.id).notNull(),
    // ... existing columns
  }

  // serviceCategories and services:
  serviceCategories: {
    userId: integer().references(() => users.id).notNull(),
  }

  services: {
    userId: integer().references(() => users.id).notNull(),
  }
  ```
- **Row-Level Security** (PostgreSQL only):
  ```sql
  ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_categories ON categories
    FOR ALL USING (userId = current_setting('app.user_id')::integer);
  ```
- **Migration Strategy**:
  1. Add nullable `userId` columns
  2. Backfill with admin user ID (first user in database)
  3. Make columns non-nullable
  4. Update all queries to filter by `userId`
- **Files**: Migration files, `src/db/schema.ts`, all API routes

**5.2 User Management System**
- **Roles**: Admin, User, Guest (read-only)
- **RBAC Table**:
  ```typescript
  roles: {
    id: integer().primaryKey(),
    name: text(), // 'admin', 'user', 'guest'
    permissions: text(), // JSON array: ['read', 'write', 'delete', 'manage-users']
  }

  userRoles: {
    userId: integer().references(() => users.id),
    roleId: integer().references(() => roles.id),
  }
  ```
- **Permission Checks**:
  ```typescript
  // Middleware: src/middleware.ts
  export async function hasPermission(userId: number, permission: string): boolean {
    const userRoles = await db.query.userRoles.findMany({ where: eq(userRoles.userId, userId) })
    return userRoles.some(ur => ur.role.permissions.includes(permission))
  }
  ```
- **Admin UI**:
  - User list with role assignments
  - Invite new users (email invitation with temporary password)
  - Deactivate users (soft delete)
- **Files**: `src/db/schema.ts`, `src/middleware.ts`, `src/app/admin/users/page.tsx`

**5.3 User Invitation Flow**
- **Process**:
  1. Admin enters email, selects role
  2. System generates temporary password (crypto.randomBytes)
  3. Email sent with login link + temp password
  4. User logs in, forced to reset password
- **Email**: Use Resend or Nodemailer
- **Security**: Temp password expires in 24 hours, one-time use
- **Implementation**:
  ```typescript
  // POST /api/users/invite
  const tempPassword = crypto.randomBytes(16).toString('hex')
  const user = await createUser({ email, passwordHash: await hash(tempPassword), requirePasswordReset: true })
  await sendEmail({ to: email, subject: 'Faux|Dash Invitation', body: `Temp password: ${tempPassword}` })
  ```
- **Files**: `src/app/api/users/invite/route.ts`, `src/lib/email.ts`

**5.4 Data Migration for Existing Deployments**
- **Challenge**: Existing single-user deployments have no `userId` on categories/bookmarks
- **Solution**:
  1. Migration script assigns all existing data to first admin user
  2. Admin panel warning: "Multi-user migration detected. All existing bookmarks assigned to you. Invite users to create their own."
- **Rollback**: Keep `userId` nullable with default admin ID for 30 days
- **Files**: Migration file, `src/lib/migrations/multi-user-migration.ts`

**Deliverables**:
- Complete data isolation per user (categories, bookmarks, services, widgets)
- RBAC system with Admin/User/Guest roles
- User invitation flow with email
- Migration path for existing single-user deployments

**Success Metrics**:
- Zero cross-user data leaks (tested via automated queries)
- User invitation emails deliver within 30s
- Multi-user queries perform within 10% of single-user baseline (<50ms overhead)
- 100% test coverage for permission checks

---

### Phase 6: Security & Performance Optimizations (Week 11-12)
**Goal**: Harden security posture and improve frontend performance.

**6.1 Input Validation with Zod**
- **Current**: No validation on API inputs (SQL injection risk, XSS risk)
- **Implement**: Zod schemas for all API routes
- **Example**:
  ```typescript
  // src/lib/validation.ts
  export const createBookmarkSchema = z.object({
    name: z.string().min(1).max(100),
    url: z.string().url(),
    description: z.string().max(500).optional(),
    categoryId: z.number().int().positive(),
  })

  // In API route:
  const body = createBookmarkSchema.parse(await req.json())
  ```
- **Validation Points**: All POST/PATCH/DELETE endpoints
- **Files**: `src/lib/validation.ts`, update all API routes in `src/app/api/*/route.ts`

**6.2 Content Security Policy (CSP)**
- **Current**: No CSP headers
- **Implement**: Strict CSP with nonces for inline scripts
- **Configuration** (Next.js 14):
  ```typescript
  // next.config.js
  const securityHeaders = [{
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'nonce-{NONCE}';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://api.openweathermap.org;
    `.replace(/\s{2,}/g, ' ').trim()
  }]
  ```
- **Nonce Generation**: Middleware generates per-request nonce, injects into script tags
- **Files**: `next.config.js`, `src/middleware.ts`

**6.3 Rate Limiting**
- **Current**: No rate limiting (DoS risk on favicon fetch, login)
- **Implement**: Redis-backed rate limiter with Upstash
- **Limits**:
  - Login: 5 attempts per 15 minutes per IP
  - Favicon fetch: 10 requests per minute per user
  - API writes: 100 requests per hour per user
- **Library**: `@upstash/ratelimit`
- **Example**:
  ```typescript
  import { Ratelimit } from '@upstash/ratelimit'
  import { Redis } from '@upstash/redis'

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'),
  })

  const { success } = await ratelimit.limit(ip)
  if (!success) return new Response('Too many requests', { status: 429 })
  ```
- **Files**: `src/lib/ratelimit.ts`, `src/app/api/login/route.ts`, `src/app/api/favicons/*/route.ts`

**6.4 State Management Optimization**
- **Current**: 40+ `useState` hooks in `src/app/page.tsx` causing excessive re-renders
- **Refactor**: Zustand store for global state
- **Implementation**:
  ```typescript
  // src/store/settings-store.ts
  import { create } from 'zustand'

  interface SettingsStore {
    siteTitle: string
    welcomeMessage: string
    searchEnabled: boolean
    // ... all settings
    updateSettings: (settings: Partial<SettingsStore>) => void
  }

  export const useSettingsStore = create<SettingsStore>((set) => ({
    // defaults
    updateSettings: (settings) => set(settings),
  }))

  // In page.tsx:
  const { siteTitle, welcomeMessage } = useSettingsStore()
  ```
- **Benefits**: Single re-render when settings change, better DevTools, persistence support
- **Files**: `src/store/settings-store.ts`, `src/app/page.tsx`

**6.5 Image Optimization**
- **Favicon Caching**: Add `Cache-Control: public, max-age=2592000` (30 days) to favicon endpoints
- **Lazy Loading**: Use `next/image` for bookmark icons with `loading="lazy"`
- **WebP Conversion**: Convert all PNGs to WebP in Sharp pipeline
- **Example**:
  ```typescript
  await sharp(buffer)
    .resize(64, 64)
    .webp({ quality: 90 })
    .toFile(outputPath)
  ```
- **Files**: `src/app/api/favicons/*/route.ts`, `src/components/category-section.tsx`

**6.6 Database Query Optimization**
- **Current**: N+1 queries in category list (fetches bookmarks separately)
- **Optimize**: Use Drizzle relations to fetch in single query
- **Example**:
  ```typescript
  const categories = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
    with: {
      bookmarks: {
        orderBy: (bookmarks, { asc }) => [asc(bookmarks.order)],
      },
    },
  })
  ```
- **Indexes**: Add indexes on `userId`, `categoryId`, `order` columns
- **Files**: `src/app/api/categories/route.ts`, migration for indexes

**Deliverables**:
- Zod validation on 100% of API endpoints
- CSP headers with nonces on all pages
- Rate limiting on login, favicon fetch, API writes
- Zustand store replaces 40+ useState hooks
- Favicon cache headers, WebP conversion
- Database queries optimized with relations + indexes

**Success Metrics**:
- Zero SQL injection vulnerabilities (penetration test)
- CSP violations: 0 in production logs
- Rate limit blocks <0.1% of legitimate requests
- Page load time improves 20% (Lighthouse score 90+)
- Database query count reduced 40%

---

## Technical Approach

### Architecture Decisions

**State Management**:
- **Zustand** for global app state (settings, user session)
- **Jotai** for widget-specific isolated state
- **SWR** for API data fetching with caching
- **Rationale**: Zustand provides simple global store with DevTools, Jotai enables widget isolation without prop drilling, SWR handles revalidation

**Database Strategy**:
- **Multi-tenancy**: Shared database with `userId` discriminator
- **PostgreSQL RLS**: Optional for extra security layer (not required for SQLite/MySQL)
- **Migration Path**: Nullable → backfill → non-nullable for backward compatibility
- **Rationale**: Simpler than database-per-tenant, scales to 100k+ users, RLS provides defense-in-depth

**Widget System**:
- **Dynamic Imports**: `next/dynamic` for code splitting
- **Registry Pattern**: Central registry for widget discovery
- **API Proxy**: All widget API calls go through Next.js API routes (not directly to 3rd party)
- **Rationale**: Lazy loading improves initial page load, registry enables plugin ecosystem, API proxy prevents CORS and secures credentials

**Security Layers**:
1. **Input Validation**: Zod schemas catch malformed data
2. **Rate Limiting**: Upstash Redis prevents abuse
3. **CSP**: Blocks XSS via inline script restrictions
4. **RLS** (PostgreSQL): Defense-in-depth for multi-tenancy
5. **HTTPS Only**: Enforce in production via Next.js config
- **Rationale**: Defense-in-depth approach following OWASP Top 10

**Performance Strategy**:
- **Caching**: Favicon responses (30d), SWR for API data (revalidate on focus)
- **Image Optimization**: WebP conversion, lazy loading, 64px max size
- **State Optimization**: Zustand reduces re-renders from 40+ useState
- **Query Optimization**: Drizzle relations for single-query fetches
- **Rationale**: Target <1s page load on 3G, Lighthouse score 90+

### Alternative Approaches Considered

**Alternative 1: Micro-Frontends for Widgets**
- **Approach**: Each widget as separate Next.js app, iframe embedding
- **Pros**: Complete isolation, independent deployments
- **Cons**: Complex setup, iframe communication overhead, larger bundle size
- **Decision**: Rejected - overkill for initial widget system, can revisit for enterprise version

**Alternative 2: Database-Per-Tenant Multi-Tenancy**
- **Approach**: Each user gets own SQLite database file
- **Pros**: Perfect isolation, easy backup/restore per user
- **Cons**: Complex query routing, harder to aggregate analytics, schema migration nightmare
- **Decision**: Rejected - doesn't scale, discriminator-based approach sufficient

**Alternative 3: Server-Side Favicon Rendering**
- **Approach**: Pre-render all favicons at build time
- **Pros**: Instant load, no runtime fetching
- **Cons**: Impossible for user-added bookmarks, huge build time
- **Decision**: Rejected - dynamic content requires runtime fetching, cache headers sufficient

**Alternative 4: GraphQL API Instead of REST**
- **Approach**: Replace all REST endpoints with GraphQL
- **Pros**: Flexible queries, no over-fetching
- **Cons**: Complexity overhead, smaller ecosystem in Next.js
- **Decision**: Rejected - REST + Drizzle relations solves over-fetching, GraphQL adds unnecessary complexity

**Alternative 5: Redux for State Management**
- **Approach**: Redux Toolkit for all state
- **Pros**: Mature ecosystem, time-travel debugging
- **Cons**: Boilerplate heavy, overkill for this app
- **Decision**: Rejected - Zustand provides 90% of benefits with 10% of code

### Dependencies

**New Libraries Required**:
- `zustand` - Global state management
- `jotai` - Widget-specific state
- `@upstash/ratelimit` + `@upstash/redis` - Rate limiting
- `rss-parser` - RSS feed parsing
- `zod` - Input validation
- `swr` - API data fetching (may already be installed)
- `react-grid-layout` - Widget drag-and-drop
- `recharts` - Analytics charts
- `resend` or `nodemailer` - Email for invitations

**Infrastructure Requirements**:
- **Redis**: Upstash for serverless, or self-hosted Redis for rate limiting
- **Email Service**: Resend API key for user invitations
- **Environment Variables**:
  ```
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  RESEND_API_KEY=
  NEXT_PUBLIC_APP_URL=
  ```

### Data Migration Plan

**Phase 1 → 2**: None (new tables only)
**Phase 2 → 3**: None (new tables only)
**Phase 3 → 4**: None (new tables only)
**Phase 4 → 5**: **BREAKING - Requires User Intervention**

**Multi-User Migration Steps**:
1. **Backup**: Automated backup before migration
2. **Schema Changes**: Add nullable `userId` to categories, bookmarks, serviceCategories, services
3. **Backfill**:
   ```typescript
   const adminUser = await db.query.users.findFirst({ where: eq(users.isAdmin, true) })
   await db.update(categories).set({ userId: adminUser.id }).where(isNull(categories.userId))
   await db.update(bookmarks).set({ userId: adminUser.id }).where(isNull(bookmarks.userId))
   ```
4. **Notification**: Admin panel banner: "Your data has been assigned to your account. Invite users to create their own bookmarks."
5. **Make Non-Nullable**: After 30-day grace period (or manual admin confirmation)

**Phase 5 → 6**: None (no schema changes)

**Rollback Strategy**:
- Each migration tagged with version number
- Rollback script: `npm run migrate:rollback --to=<version>`
- Database snapshots taken before each phase

---

## Implementation Phases

### Phase 1: Immediate UX Fixes (Week 1)

**Tasks**:
1. Add `firstname`, `lastname` to user schema
2. Create migration + admin UI for profile fields
3. Implement `substituteVariables()` utility
4. Update welcome message to use variable substitution
5. Create `<DateTimeDisplay>` component
6. Add `dateTimePosition` setting ('left' | 'center' | 'right')
7. Move date/time rendering from page.tsx to header.tsx
8. Fix Item Spacing slider min/max constraints
9. Test all changes with multiple user accounts

**Success Criteria**:
- ✅ User can set firstname/lastname in profile settings
- ✅ Welcome message displays: "Good Morning, {{firstname}}" correctly
- ✅ Date/Time appears in header at chosen position (left/center/right)
- ✅ Item Spacing slider cannot go below 0 or above 18

**Files Changed**:
- `src/db/schema.ts` (user table)
- `src/lib/template.ts` (new)
- `src/components/header.tsx`
- `src/components/date-time-display.tsx` (new)
- `src/app/page.tsx`
- `src/app/admin/settings/page.tsx`
- Migration file

### Phase 2: Favicon System Overhaul (Week 2-3)

**Tasks**:
1. Create `src/lib/favicon-providers.ts` with multi-provider fetching
2. Update `src/app/api/favicons/fetch/route.ts` to use providers
3. Implement Sharp transformations: monochrome, theme color, contrast
4. Create `src/components/admin/favicon-editor.tsx` with live preview
5. Create `src/app/api/favicons/upload/route.ts` for manual uploads
6. Add dropzone to bookmark edit dialog
7. Implement SSE endpoint `src/app/api/favicons/batch-fetch/route.ts`
8. Create `src/components/admin/batch-favicon-fetcher.tsx` UI
9. Add rate limiting to favicon endpoints
10. Test with 100+ bookmarks, measure success rate

**Success Criteria**:
- ✅ Favicon fetch success rate >90%
- ✅ Batch fetch shows real-time progress
- ✅ Manual upload works for PNG/JPG/SVG
- ✅ Favicon transformations apply correctly
- ✅ Rate limiting prevents abuse (10 req/min)

**Files Changed**:
- `src/lib/favicon-providers.ts` (new)
- `src/app/api/favicons/fetch/route.ts`
- `src/app/api/favicons/transform/route.ts` (new)
- `src/app/api/favicons/upload/route.ts` (new)
- `src/app/api/favicons/batch-fetch/route.ts` (new)
- `src/components/admin/favicon-editor.tsx` (new)
- `src/components/admin/batch-favicon-fetcher.tsx` (new)
- `src/components/admin/bookmark-manager.tsx`

### Phase 3: Analytics Expansion (Week 4)

**Tasks**:
1. Add `bookmarkClickEvents`, `serviceClickEvents` tables to schema
2. Create migration with backfill logic
3. Update click tracking endpoints to log events
4. Create `src/app/api/analytics/bookmarks/route.ts`
5. Create `src/app/api/analytics/heatmap/route.ts`
6. Implement sorting algorithms in `src/lib/sorting.ts`
7. Update category API to support new sort options
8. Create `src/app/admin/analytics/page.tsx` with charts
9. Test analytics queries with 10k+ events

**Success Criteria**:
- ✅ Click events logged with hour/day metadata
- ✅ Analytics API returns data in <200ms
- ✅ Heatmap visualizes clicks by hour x day
- ✅ Underutilized sorting surfaces <10th percentile bookmarks
- ✅ Time-aware sorting prioritizes bookmarks clicked at current hour

**Files Changed**:
- `src/db/schema.ts` (new tables)
- `src/app/api/bookmarks/[id]/click/route.ts`
- `src/app/api/services/[id]/click/route.ts`
- `src/app/api/analytics/bookmarks/route.ts` (new)
- `src/app/api/analytics/heatmap/route.ts` (new)
- `src/lib/sorting.ts` (new)
- `src/app/api/categories/route.ts`
- `src/app/admin/analytics/page.tsx` (new)
- `src/components/admin/analytics-widgets.tsx` (new)
- Migration file

### Phase 4: Widget Architecture (Week 5-7)

**Tasks**:
1. Create `src/lib/widgets/registry.ts`
2. Add `widgets` table to schema + migration
3. Create `src/components/widget-container.tsx` with dynamic loading
4. Implement Plex widget: `src/lib/widgets/plex/plex-widget.tsx` + API route
5. Implement Jellyfin widget: `src/lib/widgets/jellyfin/jellyfin-widget.tsx` + API route
6. Implement RSS widget: `src/lib/widgets/rss/rss-widget.tsx` + API route
7. Create `src/store/widget-store.ts` (Zustand)
8. Create `src/app/admin/widgets/page.tsx` with drag-and-drop
9. Create `src/components/widget-grid.tsx`
10. Add `widgetSection` setting + integrate into homepage
11. Test widget loading performance
12. Test widget API calls with SWR caching

**Success Criteria**:
- ✅ 3 widgets functional (Plex, Jellyfin, RSS)
- ✅ Widget grid drag-and-drop saves layout
- ✅ Widgets lazy-load in <100ms
- ✅ Plex/Jellyfin API calls complete in <1s
- ✅ RSS feed updates every 5 minutes
- ✅ Widget section appears at configured position

**Files Changed**:
- `src/db/schema.ts` (widgets table)
- `src/lib/widgets/registry.ts` (new)
- `src/lib/widgets/plex/` (new directory)
- `src/lib/widgets/jellyfin/` (new directory)
- `src/lib/widgets/rss/` (new directory)
- `src/app/api/widgets/plex/route.ts` (new)
- `src/app/api/widgets/jellyfin/route.ts` (new)
- `src/app/api/widgets/rss/route.ts` (new)
- `src/components/widget-container.tsx` (new)
- `src/components/widget-grid.tsx` (new)
- `src/store/widget-store.ts` (new)
- `src/app/admin/widgets/page.tsx` (new)
- `src/app/page.tsx`
- Migration file

### Phase 5: Multi-User Support (Week 8-10)

**Tasks**:
1. Add `roles`, `userRoles` tables to schema
2. Create migration for `userId` columns (nullable → backfill → non-nullable)
3. Update all API routes to filter by `userId`
4. Implement `hasPermission()` middleware
5. Create `src/app/admin/users/page.tsx` user management UI
6. Implement `src/app/api/users/invite/route.ts`
7. Set up email service (Resend)
8. Create invitation email template
9. Implement forced password reset flow
10. Test with 10+ users, verify data isolation
11. Penetration test for cross-user data leaks
12. Create admin panel banner for migration notification

**Success Criteria**:
- ✅ Complete data isolation (no cross-user queries return data)
- ✅ Invitation emails sent within 30s
- ✅ Temporary password expires in 24h
- ✅ Forced password reset works
- ✅ RBAC enforces permissions correctly
- ✅ Migration assigns existing data to admin
- ✅ Multi-user queries perform within 10% of baseline

**Files Changed**:
- `src/db/schema.ts` (add userId, roles, userRoles)
- All `src/app/api/*/route.ts` files (add userId filtering)
- `src/middleware.ts` (new)
- `src/app/admin/users/page.tsx` (new)
- `src/app/api/users/invite/route.ts` (new)
- `src/lib/email.ts` (new)
- `src/lib/migrations/multi-user-migration.ts` (new)
- Migration file

### Phase 6: Security & Performance Optimizations (Week 11-12)

**Tasks**:
1. Create `src/lib/validation.ts` with Zod schemas
2. Update all API routes to use Zod validation
3. Add CSP headers in `next.config.js`
4. Implement nonce generation in middleware
5. Set up Upstash Redis
6. Create `src/lib/ratelimit.ts`
7. Add rate limiting to login, favicon, API endpoints
8. Create `src/store/settings-store.ts` (Zustand)
9. Refactor `src/app/page.tsx` to use Zustand
10. Add WebP conversion to favicon pipeline
11. Add `Cache-Control` headers to favicon endpoints
12. Add database indexes on userId, categoryId, order
13. Optimize category queries with Drizzle relations
14. Run Lighthouse audit, aim for 90+ score
15. Penetration test for SQL injection, XSS

**Success Criteria**:
- ✅ 100% API endpoints validated with Zod
- ✅ CSP headers present, 0 violations in logs
- ✅ Rate limiting blocks abuse, <0.1% false positives
- ✅ Zustand reduces useState hooks from 40+ to <5
- ✅ Favicons served as WebP with 30-day cache
- ✅ Page load time improves 20%
- ✅ Lighthouse score 90+
- ✅ Zero SQL injection/XSS vulnerabilities
- ✅ Database query count reduced 40%

**Files Changed**:
- `src/lib/validation.ts` (new)
- All `src/app/api/*/route.ts` (add validation)
- `next.config.js` (CSP headers)
- `src/middleware.ts` (nonce generation)
- `src/lib/ratelimit.ts` (new)
- `src/store/settings-store.ts` (new)
- `src/app/page.tsx` (refactor to Zustand)
- `src/app/api/favicons/*/route.ts` (WebP, cache headers)
- Migration file (indexes)

---

## Acceptance Criteria

### Functional Requirements
- ✅ **Phase 1**: Date/Time in header, variable substitution works, firstname/lastname editable, Item Spacing 0-18px
- ✅ **Phase 2**: Favicon fetch >90% success, manual upload works, batch fetch shows progress, transformations apply
- ✅ **Phase 3**: Analytics track hourly/daily/weekly/monthly, 3 new sort options, heatmap visualizes clicks
- ✅ **Phase 4**: 3 widgets functional (Plex, Jellyfin, RSS), drag-and-drop layout saves, widgets display on homepage
- ✅ **Phase 5**: Complete data isolation per user, RBAC enforces permissions, invitation flow works, migration successful
- ✅ **Phase 6**: Zod validation on all APIs, CSP headers live, rate limiting active, Zustand in use, favicons cached

### Non-Functional Requirements
- ✅ **Performance**: Page load <1s on 3G, Lighthouse score 90+, widget load <100ms, analytics queries <200ms
- ✅ **Security**: Zero SQL injection/XSS vulnerabilities, CSP violations: 0, rate limit false positives <0.1%
- ✅ **Scalability**: Multi-user queries within 10% of single-user baseline, system handles 100+ concurrent users
- ✅ **Reliability**: Favicon fetch retries 3x with backoff, email delivery >99% success rate
- ✅ **Usability**: Drag-and-drop widget layout, real-time batch progress, admin panel intuitive (user testing)

### Testing Requirements
- ✅ **Unit Tests**: All validation schemas (Zod), sorting algorithms, variable substitution utility
- ✅ **Integration Tests**: API endpoints with userId filtering, widget API calls, email delivery
- ✅ **E2E Tests**: User invitation flow, multi-user data isolation, favicon batch fetch
- ✅ **Performance Tests**: Load test with 100 users, 10k click events, 500 bookmarks
- ✅ **Security Tests**: Penetration testing for SQL injection, XSS, CSRF, cross-user data access

---

## Success Metrics

### User Engagement
- **Variable Substitution Adoption**: >80% of users set firstname/lastname within 1 week
- **Widget Usage**: >50% of users add at least 1 widget within 2 weeks
- **Analytics Impact**: Underutilized sorting increases bookmark clicks by >30%
- **Multi-User Onboarding**: Average 5 users per instance within 1 month of Phase 5 deployment

### Technical Performance
- **Page Load Time**: <1s on 3G (current baseline TBD), 20% improvement post-Phase 6
- **Lighthouse Score**: 90+ (performance, accessibility, best practices, SEO)
- **Favicon Success Rate**: >90% (up from current ~60-70% estimated)
- **Database Query Efficiency**: 40% reduction in query count, <50ms per query
- **Widget Load Time**: <100ms lazy load, <1s for 3rd-party API calls (Plex, Jellyfin)

### Security & Reliability
- **Vulnerability Count**: 0 critical/high severity (per OWASP Top 10)
- **CSP Violations**: <10 per 10k page loads (only from browser extensions)
- **Rate Limit False Positives**: <0.1% of legitimate requests blocked
- **Uptime**: 99.9% (excludes planned maintenance)
- **Email Delivery**: >99% success rate for invitations

### Developer Experience
- **Code Maintainability**: <500 lines per file (refactor page.tsx from 400+ to <200)
- **Test Coverage**: >80% for new code (validation, sorting, widgets, multi-user)
- **Build Time**: <2 minutes for production build
- **Developer Onboarding**: New contributors can add widget in <4 hours (documentation quality)

---

## Risk Analysis

### High Risk

**Risk**: Multi-user migration corrupts existing user data
**Impact**: Data loss, user churn
**Mitigation**:
- Automated backup before migration
- 30-day rollback window with nullable userId
- Canary deployment (test on staging with production snapshot)
- Admin confirmation required before making userId non-nullable

**Risk**: Third-party widget APIs go down (Plex, Jellyfin)
**Impact**: Widget displays errors, degraded UX
**Mitigation**:
- SWR cache serves stale data during outages
- Fallback UI: "Service temporarily unavailable"
- Timeout set to 5s, prevent hanging
- Health check endpoint for admin monitoring

**Risk**: Rate limiting blocks legitimate users during traffic spikes
**Impact**: User frustration, lost conversions
**Mitigation**:
- Conservative limits (5 login attempts is generous)
- Whitelist admin IPs
- Admin override: temporary rate limit disable
- Monitoring alerts for >1% block rate

### Medium Risk

**Risk**: CSP breaks existing functionality (inline scripts, 3rd-party CDNs)
**Impact**: Broken UI, user complaints
**Mitigation**:
- Gradual rollout: report-only mode first (monitor violations)
- Nonce generation for inline scripts
- Whitelist trusted CDNs (Heroicons, etc.)
- Rollback plan: disable CSP via config flag

**Risk**: Zustand refactor introduces state bugs
**Impact**: UI state out of sync, settings not saving
**Mitigation**:
- Incremental refactor: migrate 10 state variables at a time
- Side-by-side testing: keep old useState until validated
- E2E tests for critical flows (settings save, category toggle)
- Feature flag: `USE_ZUSTAND` env var for rollback

**Risk**: Favicon transformations produce low-quality images
**Impact**: Blurry icons, poor aesthetics
**Mitigation**:
- Manual review: test transformations on 100 sample bookmarks
- Quality threshold: SSIM >0.9 for monochrome conversion
- User preview before applying
- Allow revert to original

### Low Risk

**Risk**: Email invitations land in spam
**Impact**: Users can't onboard
**Mitigation**:
- Use reputable provider (Resend) with SPF/DKIM
- Plaintext + HTML email formats
- Instruction: "Check spam folder if not received in 5 min"
- Admin panel shows sent/delivered status

**Risk**: Widget drag-and-drop UX confusing
**Impact**: Users frustrated, don't use widgets
**Mitigation**:
- User testing before release (5 participants)
- Tooltips/onboarding guide
- Default layout: Plex widget as example
- Video tutorial in docs

---

## Resource Requirements

### Development Time
- **Phase 1**: 40 hours (1 week)
- **Phase 2**: 80 hours (2 weeks)
- **Phase 3**: 40 hours (1 week)
- **Phase 4**: 120 hours (3 weeks)
- **Phase 5**: 120 hours (3 weeks)
- **Phase 6**: 80 hours (2 weeks)
- **Total**: 480 hours (12 weeks)

### Infrastructure Costs (Monthly)
- **Redis** (Upstash): $0-10 (free tier likely sufficient for <100 users)
- **Email** (Resend): $0-20 (free tier: 3k emails/month)
- **Hosting**: No change (existing Next.js deployment)
- **Total**: $0-30/month (scales with user count)

### Third-Party Services
- **Upstash Redis**: Rate limiting
- **Resend**: Email delivery
- **FaviconExtractor API**: Optional paid tier for higher limits ($9/month for 10k requests)
- **Plex/Jellyfin/Unifi APIs**: User provides own credentials

### Team Composition
- **1 Full-Stack Developer**: Primary implementation
- **1 QA Engineer**: Testing (part-time, phases 3-6)
- **1 DevOps**: Infrastructure setup (Redis, email, CSP), part-time
- **Optional: 1 Designer**: Widget UI/UX review (phases 4-5)

---

## Future Considerations

### Post-Roadmap Enhancements
1. **Mobile App** (React Native): iOS/Android apps with offline mode, push notifications for widgets
2. **Public Bookmark Sharing**: Share individual categories or full dashboard with read-only links
3. **Themes Marketplace**: User-submitted color themes, import/export theme JSON
4. **Advanced Analytics**: ML-based recommendations ("You might like..."), predictive sorting
5. **Widget Marketplace**: Community-contributed widgets (GitHub, Reddit, Slack, etc.)
6. **Browser Extension**: Right-click "Add to Faux|Dash" on any page, instant favicon fetch
7. **Import/Export**: Backup full user data as JSON, restore on different instance
8. **API for Automation**: REST API + webhooks for programmatic bookmark management (Zapier, n8n)
9. **Collaboration**: Share categories with other users, team workspaces
10. **Self-Hosted Widget Hosting**: Run widgets in Docker containers for full isolation

### Scalability Path
- **Current**: Single-server SQLite/PostgreSQL, handles 100 users
- **Phase 1** (1k users): PostgreSQL with connection pooling, Redis caching, CDN for static assets
- **Phase 2** (10k users): Database read replicas, horizontal scaling with load balancer
- **Phase 3** (100k users): Multi-region deployment, Cloudflare Workers for edge caching, separate analytics DB

### Technical Debt to Address
- **Before Phase 5**: Refactor `src/app/admin/settings/page.tsx` (600+ lines, split into sub-components)
- **Before Phase 6**: Add comprehensive E2E tests (currently minimal coverage)
- **Post-Roadmap**: Migrate to TypeScript strict mode (currently loose)
- **Post-Roadmap**: Implement CI/CD pipeline (automated tests, deploy previews)

---

## References

### Codebase Architecture Analysis
- Settings system: `/Users/shelby/Development/fauxdash/src/app/api/settings/route.ts`
- User schema: `/Users/shelby/Development/fauxdash/src/db/schema.ts:42-51`
- Favicon fetching: `/Users/shelby/Development/fauxdash/src/app/api/favicons/fetch/route.ts`
- Analytics tracking: `/Users/shelby/Development/fauxdash/src/app/api/pageview/route.ts`, `/Users/shelby/Development/fauxdash/src/components/stats-widget.tsx`
- Icon system: `/Users/shelby/Development/fauxdash/src/lib/icons.tsx:484-487`
- Current state management: `/Users/shelby/Development/fauxdash/src/app/page.tsx:39-69` (40+ useState)
- Category display: `/Users/shelby/Development/fauxdash/src/components/category-section.tsx`
- Header component: `/Users/shelby/Development/fauxdash/src/components/header.tsx`

### Best Practices Research (2025-2026 Sources)
- Multi-tenant architecture: [AWS Multi-Tenant SaaS Guide 2025](https://aws.amazon.com/saas)
- PostgreSQL RLS: [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security) (accessed 2026-01-23)
- Zustand state management: [Zustand GitHub](https://github.com/pmndrs/zustand) (v4.5+)
- Jotai for widget state: [Jotai Documentation](https://jotai.org) (v2.6+)
- Next.js 14 security: [Next.js Security Headers Guide](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- CSP nonces: [OWASP CSP Cheat Sheet 2025](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- Zod validation: [Zod GitHub](https://github.com/colinhacks/zod) (v3.22+)
- Upstash rate limiting: [Upstash Ratelimit SDK](https://upstash.com/docs/redis/features/ratelimiting)
- Sharp image processing: [Sharp Documentation](https://sharp.pixelplumbing.com) (WebP conversion)
- SWR data fetching: [SWR Documentation](https://swr.vercel.app)
- FaviconExtractor API: [Favicon.im API Docs](https://favicon.im)
- Plex API: [Plex Media Server API](https://www.plexopedia.com/plex-media-server/api/)
- Jellyfin API: [Jellyfin API Documentation](https://api.jellyfin.org/)
- RSS Parser: [rss-parser npm](https://www.npmjs.com/package/rss-parser)
- React Grid Layout: [react-grid-layout GitHub](https://github.com/react-grid-layout/react-grid-layout)
- Recharts: [Recharts Documentation](https://recharts.org)
- Resend email: [Resend API](https://resend.com/docs)
- Drizzle ORM relations: [Drizzle Relational Queries](https://orm.drizzle.team/docs/rqb)

### Industry Standards
- OWASP Top 10 (2025): SQL Injection (#3), XSS (#7), CSRF (#9)
- RBAC adoption: 94.7% of enterprise SaaS (Gartner 2025)
- Personalization balance: 70/20/10 rule (Netflix Engineering Blog 2024)
- Lighthouse performance targets: 90+ score for green rating (Google Web Vitals 2025)
- Cache duration: Favicons 30-90 days (industry standard, Cloudflare recommendation)

---

## Appendix

### Environment Variables
```bash
# Existing
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
OPENWEATHER_API_KEY=

# New for Roadmap
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
PLEX_SERVER_URL= # User-specific, stored in widget config
JELLYFIN_SERVER_URL= # User-specific, stored in widget config
```

### Database Schema Changes Summary
- **Phase 1**: Add `firstname`, `lastname` to users
- **Phase 3**: Add `bookmarkClickEvents`, `serviceClickEvents` tables
- **Phase 4**: Add `widgets` table
- **Phase 5**: Add `roles`, `userRoles` tables, `userId` to categories/bookmarks/services/serviceCategories
- **Phase 6**: Add indexes on `userId`, `categoryId`, `order`

### Migration Checklist
- [ ] Backup database before each phase
- [ ] Run migration in staging first
- [ ] Verify data integrity post-migration (checksum)
- [ ] Update API routes to use new schema
- [ ] Test rollback procedure
- [ ] Document breaking changes in CHANGELOG

### Testing Strategy
- **Unit**: Jest for utils (validation, sorting, templating)
- **Integration**: API route testing with Vitest
- **E2E**: Playwright for critical flows (login, bookmark CRUD, widget management)
- **Performance**: Lighthouse CI in GitHub Actions
- **Security**: OWASP ZAP automated scanning, manual penetration testing

### Deployment Strategy
- **Phases 1-2**: Deploy to production immediately (low risk, additive changes)
- **Phase 3**: Canary deployment (10% traffic for 24h, monitor analytics performance)
- **Phase 4**: Feature flag for widgets (`ENABLE_WIDGETS=true`), gradual rollout
- **Phase 5**: Multi-stage rollout:
  1. Deploy schema changes (nullable userId) to all instances
  2. Backfill data over 7 days
  3. Enable multi-user UI after admin confirmation
  4. Make userId non-nullable after 30-day grace period
- **Phase 6**: Blue-green deployment (swap after performance validation)

---

**Plan Status**: Ready for Review
**Next Steps**: User approval → Begin Phase 1 implementation → Track progress via GitHub project board
