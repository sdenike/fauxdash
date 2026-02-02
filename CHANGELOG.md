# Changelog

All notable changes to Faux|Dash will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-02-01

### Added
- **Weather Location Manager**: New drag-and-drop interface for managing multiple weather locations
  - Add locations by ZIP code or city name
  - Drag to reorder locations
  - Set any location as default (moves to first position)
  - Visual indicators for default location with star icon
  - Remove individual locations with delete button

### Changed
- Simplified weather settings by removing auto-rotate feature
- Weather locations now managed through dedicated UI component instead of comma-separated text input

### Technical
- New `WeatherLocationManager` component with full drag-and-drop support
- Locations stored as comma-separated string for backward compatibility

## [0.7.0] - 2026-01-31

### Added
- **Progressive Web App (PWA) Support**: Install Faux|Dash as a native app on mobile and desktop
  - Service worker for offline caching
  - Web app manifest with app icons (8 sizes: 72px-512px)
  - "Add to Home Screen" install prompt for iOS and Android
  - Offline fallback page when network unavailable
  - Standalone display mode without browser chrome
- **Mobile-Responsive UI**: Full mobile support with adaptive layouts
  - Responsive homepage grid (1 col mobile → 2 col tablet → up to 6 col desktop)
  - Admin sidebar with hamburger menu on mobile (slides in/out with backdrop)
  - Header stacks vertically on mobile with consolidated action buttons
  - Touch-friendly 44px minimum touch targets for accessibility
  - Safe area padding for notched devices (iPhone X+, etc.)
- **PWA Icon Generator**: Script to generate app icons (`scripts/generate-pwa-icons.js`)

### Changed
- Column settings now act as *maximum* columns - responsive design uses fewer columns on smaller screens
- Admin layout mobile header with hamburger button appears below 768px breakpoint
- Header search bar becomes full-width on mobile

### Technical
- Added `@ducanh2912/next-pwa` package for service worker generation
- Added viewport configuration with `viewportFit: 'cover'` for notched devices
- Added `.touch-target`, `.pb-safe`, `.pt-safe`, `.pl-safe`, `.pr-safe` CSS utilities
- PWA disabled in development mode to avoid caching issues
- Added PWA generated files to `.gitignore` (sw.js, workbox files)

## [0.6.0] - 2026-01-28

### Added
- **Demo Content System**: Allow new users to explore Faux|Dash with pre-populated sample data
  - Load demo bookmarks, services, and 30 days of analytics in one click
  - Demo choice offered during setup wizard after account creation
  - "Load Demo Content" button shown on empty dashboard for admins
  - New Demo Content section in Admin > Tools for loading/clearing
  - Demo content marked with `isDemo` flag for selective clearing
  - Clear demo data without affecting real user content
  - Demo items use selfh.st icons for realistic appearance
- **Demo API endpoints**:
  - `POST /api/demo/load` - Load all demo content
  - `DELETE /api/demo/clear` - Remove all demo-flagged content
  - `GET /api/demo/status` - Check if demo content exists

### Changed
- **Performance: N+1 Query Fix**: Categories and service-categories APIs now use single query with memory grouping
  - `/api/categories` reduced from N+1 queries to 2 queries
  - `/api/service-categories` reduced from N+1 queries to 2 queries
  - Sorting now done in memory after single bulk fetch

### Fixed
- Memory audit verified all timer/interval cleanup is correct
- Caching strategy audit confirmed proper Redis TTL and invalidation

## [0.5.37] - 2026-01-28

### Added
- **Release script**: New `scripts/release.sh` for automated version releases
  - Handles patch/minor/major version bumps
  - Validates CHANGELOG.md has entry for new version
  - Creates commit, pushes, and creates GitHub release
  - Usage: `./scripts/release.sh patch "Fix description"`

## [0.5.36] - 2026-01-28

### Added
- **Update notification**: Admin dashboard now shows when a new version is available on GitHub
  - Checks GitHub releases API (cached for 1 hour)
  - Shows animated badge with link to release notes
  - Version comparison handles semantic versioning

## [0.5.35] - 2026-01-28

### Fixed
- **Memory leak in toast system**: Reduced toast removal delay from ~17 minutes to 5 seconds, preventing memory accumulation
- **Toast useEffect dependency**: Fixed listener leak that could cause memory issues over time

## [0.5.34] - 2026-01-28

### Added
- **Debug endpoint**: `/api/debug/headers` to diagnose Cloudflare/proxy IP detection issues (requires admin login)
- **DEBUG_IP environment variable**: Enable IP detection logging for troubleshooting geolocation

### Fixed
- **Search bar in header**: Now displays correctly even when date/time is enabled
- **Cloudflare IP detection**: Improved header parsing with support for `True-Client-IP` and better handling of X-Forwarded-For chains
- **Private IP filtering**: IP detection now skips private/internal IPs when looking for real client IP

### Changed
- **Docker image optimization**: Consolidated layers and reduced image size
  - Combined RUN commands to reduce layer count
  - Consolidated script COPY into single command
  - Added npm cache cleanup

## [0.5.33] - 2026-01-28

### Added
- **PUID/PGID Support**: Container now supports custom user/group IDs via environment variables
  - Set `PUID` and `PGID` to match your host user (run `id` to check)
  - Default: 1000:1000
  - Fixes permission issues when mounting volumes on Linux/NAS systems
- **GitHub Container Registry**: Docker images now automatically published to `ghcr.io/sdenike/fauxdash`
- **Multi-platform builds**: Docker images available for both `linux/amd64` and `linux/arm64`

### Changed
- Upgraded Next.js from 14.1.0 to 14.2.35 (security fix)
- Upgraded drizzle-kit to 0.31.8 with new config format
- Switched from Google Fonts to system fonts for faster builds and no external dependencies
- Container user renamed from `nextjs` to `fauxdash`
- Default credentials: `admin@fauxdash.local` / `admin` (change immediately after first login)

### Fixed
- Docker build failures due to Google Fonts timeout
- drizzle.config.ts updated for drizzle-kit 0.31+ compatibility
- Container permission issues when running as non-root
- Dockerfile ENV format updated to modern `key=value` syntax

### Security
- Removed development plan files from repository
- Added comprehensive .gitignore for sensitive data

## [0.5.7] - 2026-01-25

### Fixed
- **Critical**: Fixed favicon conversion features (Convert to Theme Color, Monotone, Invert) that were completely broken due to parameter mismatches between frontend and API
- **Security**: Added path traversal protection to all favicon API routes to prevent unauthorized file access
- Fixed API response handling - frontend now correctly uses `data.filename` instead of `data.path`
- Convert-color API now accepts both hex colors and theme color names (Slate, Blue, etc.)
- Added file existence checks to conversion routes to provide better error messages

### Changed
- Standardized favicon conversion API parameters across all components
- Improved error handling in favicon conversion routes

## [0.5.6] - 2026-01-25

### Fixed
- Resolved all ESLint warnings across the codebase
- Added proper ESLint disable comments for external image URLs (CDN icons, weather API icons, favicons)
- Fixed useEffect dependency warnings in weather-widget.tsx and changelog-dialog.tsx with intentional omission comments

### Code Quality
- Cleaned up code consistency across 10 component files
- Improved code documentation with explanatory comments for ESLint suppressions

## [0.5.5] - 2026-01-23

### Added
- Changelog feature: Version number in admin dashboard is now clickable to view changelog
- CHANGELOG.md is now maintained and viewable from the dashboard

### Fixed
- Improved favicon fetching from URLs to handle ICO files better with more detailed error messages
- Fixed Services section layout to match Bookmarks section styling (header size, icon size, spacing)
- Services and Bookmarks sections now have consistent look and feel

## [0.5.4] - 2026-01-23

### Changed
- Removed "Main Page Columns" setting
- Added separate "Services Section Columns" and "Bookmarks Section Columns" settings
- Services and Bookmarks sections can now have independent column configurations

### Added
- Database migration to rename `mainColumns` to `bookmarksColumns`

## [0.5.3] - 2026-01-23

### Added
- URL tab in Icon Selector for manual favicon URL input
- Users can now enter direct favicon URLs when auto-fetch fails
- Integrated manual favicon fetching into icon selection workflow

### Changed
- Updated error messages for failed favicon fetches to guide users to icon selector
- Removed inline favicon URL input from bookmark/service edit forms

## [0.5.2] - 2026-01-23

### Added
- Manual favicon URL input feature (initial implementation, later moved to icon selector)

## [0.5.1] - 2026-01-23

### Fixed
- Removed border from service items to match bookmark styling
- Unified padding and spacing between Services and Bookmarks sections
- Adjusted icon container size to be consistent across sections
- Fixed grid layout issue causing blank column in Services section

## [0.5.0] - 2026-01-23

### Added
- Major homepage restructure with distinct "Services" and "Bookmarks" sections
- Section ordering configuration (Services first or Bookmarks first)
- Grid-based category layout with configurable columns (1-6)
- Migration to assign orphaned items to "Uncategorized" category
- `sectionOrder` and `bookmarksColumns` settings

### Changed
- All items must now belong to a category (no orphaned items allowed)
- Categories display with headers showing item count and column width in admin
- Layout refactored to show two distinct sections with headers and borders

## [0.4.1] - 2026-01-23

### Added
- Uncategorized items warning section in ContentManager
- Ability to drag uncategorized items into categories
- Visual amber warning box for items without categories

### Fixed
- Removed filter that hid uncategorized items
- Proper Docker rebuild workflow for code changes

## [0.4.0] - 2026-01-23

### Added
- Version numbering system using semantic versioning
- Version display in admin dashboard header
- `/src/lib/version.ts` to export version from package.json

### Documentation
- Updated DEPLOY.md to clarify Docker rebuild requirements

## [0.3.0] - 2026-01-21

### Added
- **Complete MDI Library**: All 7,000+ Material Design Icons now available
  - Automatic icon loading from @mdi/js package
  - Smart categorization of icons
  - Searchable by name across entire MDI library
- **Services Feature**: New dedicated section for self-hosted services
  - ServiceManager component with drag-and-drop reordering
  - Full CRUD operations (Create, Read, Update, Delete)
  - Icon selector with full MDI + Heroicons support
  - Click tracking and analytics
  - Redis caching for performance
  - Configurable layout position (above or below bookmarks)
  - Separate from bookmarks and categories
  - Auth-based visibility controls
- **Pageview Analytics**: Track visitor statistics
  - Pageview counter on all pages
  - Statistics widget in admin dashboard
  - Today's pageviews
  - Last 24 hours stats
  - Last 7 days stats
  - Last 30 days stats
  - Database storage with automatic migration
- **Services Position Setting**: Admin control for services section placement
  - "Above Bookmarks" option
  - "Below Bookmarks" option
  - Setting saved per-user in database

### Changed
- **Branding Update**: Application renamed from "FauxDash" to "Faux|Dash"
  - Updated in page titles
  - Updated in header component
  - Updated in all admin pages
  - Updated in settings
  - Updated in documentation
- **Stats Widget Location**: Moved from homepage to admin dashboard
- **Icon System**: Complete rewrite to support entire MDI library
  - Dynamic icon generation instead of manual mapping
  - Better categorization logic
  - Improved search performance

### Fixed
- **Dark Mode Icons**: MDI icons now properly adapt to dark mode
  - Icons use `currentColor` CSS property
  - Inherit text color from parent elements
  - No more black icons on dark backgrounds

### Database Changes
- Added `services` table with columns:
  - id, name, url, description, icon, order
  - isVisible, requiresAuth, clickCount
  - createdAt, updatedAt
- Added `pageviews` table with columns:
  - id, path, timestamp, userId
- Migration scripts: `migrate-add-services.js`, `migrate-add-pageviews.js`

### API Changes
- New endpoints:
  - `GET /api/services` - List all services (with caching)
  - `POST /api/services` - Create new service
  - `PATCH /api/services/[id]` - Update service
  - `DELETE /api/services/[id]` - Delete service
  - `POST /api/services/[id]/click` - Track service clicks
  - `POST /api/pageview` - Track page views
  - `GET /api/stats` - Get pageview statistics
- Updated endpoints:
  - `GET /api/settings` - Now includes `servicesPosition`
  - `POST /api/settings` - Now accepts `servicesPosition`

## [0.2.0] - 2026-01-21

### Added
- **Heroicons Integration**: 80+ curated icons with visual picker
- **Icon Selector Component**: Searchable, categorized icon picker for categories and bookmarks
- **Bookmark Descriptions**: Optional description field displays under bookmark name
- **Comprehensive Settings Page**: Three tabs (General, Weather, Appearance)
- **Weather Configuration UI**: Enable/disable toggle with provider-specific fields
- **Tempest Weather First**: Listed as recommended provider (as requested)
- **New shadcn/ui Components**: Select, Switch, Tabs, Textarea
- **Settings API**: GET/POST endpoints for user preferences
- **Database Migration**: Automatic column addition for existing databases

### Changed
- **Category Manager**: Now uses Heroicons instead of emoji, modern Switch components
- **Bookmark Manager**: Icon selector, description field, improved layout
- **Homepage Display**: Larger icons (8x8), descriptions with line-clamping
- **Header**: Added settings icon, reorganized navigation
- **Admin UI**: Better shadows, hover effects, drag indicators
- **Form Styling**: Consistent spacing, scrollable dialogs

### Improved
- **Design System**: Better use of shadcn/ui patterns and components
- **Visual Hierarchy**: Proper text sizing, colors, and spacing
- **User Experience**: Smoother interactions, better feedback
- **Type Safety**: All new components fully typed with TypeScript

### Fixed
- **Icon Display**: Proper Heroicon rendering throughout application
- **Mobile Responsiveness**: Better grid layouts for all screen sizes
- **Migration Safety**: Non-destructive column additions

## [0.1.0] - 2024-01-20

### Added
- Initial release of FauxDash Homepage
- Homepage with categories and bookmarks display
- Admin panel for managing categories and bookmarks
- Drag-and-drop reordering for categories and bookmarks
- Local authentication with email and password
- Theme support (Light/Dark/System)
- Search bar with configurable search engines:
  - DuckDuckGo
  - Google
  - Brave
  - Kagi
  - Startpage
- Weather widget with multiple provider support:
  - WeatherAPI.com
  - Tempest Weather API
  - OpenWeatherMap
- Multi-location weather display with auto-rotation
- Multi-database support:
  - SQLite (default)
  - PostgreSQL
  - MySQL
- Redis caching for improved performance (optional)
- Bookmark click tracking and analytics
- Visibility controls for categories and bookmarks
- Authentication requirements per category/bookmark
- Docker and Docker Compose deployment
- Responsive design for mobile and desktop
- Icon support using emoji
- RESTful API for all operations
- SPA-like behavior with minimal page reloads

### Security
- Argon2id password hashing
- JWT-based session management
- CSRF protection via NextAuth
- Secure cookie settings
- Server-side authentication enforcement

### Developer Experience
- TypeScript throughout
- Drizzle ORM for type-safe database queries
- Automated migrations
- Environment-based configuration
- Comprehensive documentation

### Documentation
- README with installation and upgrade guide
- DECISIONS.md documenting architectural choices
- CHANGELOG.md (this file)
- Inline code comments
- Environment variable documentation

## [Unreleased]

### Planned Features
- OIDC authentication support
- Custom SVG icon upload
- Bookmark import/export (CSV/JSON)
- Advanced analytics with charts
- Per-user theme customization
- Passkey authentication
- Browser extension for adding bookmarks
- API documentation (OpenAPI/Swagger)
- Backup and restore functionality
- Multi-language support (i18n)

### Under Consideration
- Custom search engine configuration
- Bookmark folders/subfolders
- Bookmark tags and filtering
- Global search across all bookmarks
- RSS feed widget
- Notes/widgets support
- Public sharing links for categories
- 2FA support
- Webhook notifications
- Kubernetes deployment guide

---

## Version History

- **0.8.0** - Weather location manager with drag-and-drop UI (Current)
- **0.7.0** - Mobile-responsive UI, PWA support, offline mode
- **0.6.0** - Demo content system, N+1 query performance fix
- **0.5.x** - Release automation, update notifications, memory leak fixes
- **0.3.0** - Services feature, complete MDI library, pageview analytics
- **0.2.0** - Heroicons integration, settings UI, weather configuration
- **0.1.0** - Initial release

## Migration Guide

This section will contain migration guides when breaking changes are introduced.

### From 0.2.0 to 0.3.0

No breaking changes. Database migrations run automatically on container start:
- `migrate-add-services.js` creates the services table
- `migrate-add-pageviews.js` creates the pageviews table

Simply rebuild and restart your container to upgrade.

### From 0.1.0 to 0.2.0

No breaking changes. Database migrations run automatically on container start.

## Semantic Versioning

We follow semantic versioning:

- **Major version** (X.0.0): Breaking changes, may require manual migration
- **Minor version** (0.X.0): New features, backward compatible
- **Patch version** (0.0.X): Bug fixes, backward compatible

## Release Process

1. Update CHANGELOG.md with new version and changes
2. Update package.json version
3. Create git tag with version number
4. Build and push Docker image with version tag
5. Create GitHub release with notes

## Support

For questions about changes:
- Check this CHANGELOG
- Review closed issues on GitHub
- Check README for new configuration options
- Open a discussion for clarification
