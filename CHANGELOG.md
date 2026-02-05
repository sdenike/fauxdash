# Changelog

All notable changes to Faux|Dash will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.32] - 2026-02-05

### Added
- **Analytics Map Improvements**: Enhanced visitor location visualization
  - **Color-Coded Traffic Markers**:
    - 🔵 Blue markers for Low traffic (1-10 visits)
    - 🟡 Yellow markers for Medium traffic (11-50 visits)
    - 🔴 Red markers for High traffic (51+ visits)
    - All three levels now clearly visible on the map
  - **Complete Location List**:
    - Shows ALL visitor locations (previously limited to 12)
    - Scrollable list with improved layout and styling
    - Color-coded dots matching map markers
    - Header showing total locations and total visits
    - Country flags, names, and visit counts with monospace alignment
    - Hover effects and clickable items
  - **Enhanced Legend**:
    - Distinct colors instead of opacity-only differences
    - Clear labels with visit count ranges
    - Better contrast with white background and border
    - Available both on map and below location list

### Changed
- Map marker sizes increased (10-32px) for better visibility
- Map marker opacity increased to 0.85 for clearer distinction
- Location list now uses grid layout with responsive columns
- Visit counts use monospace font for better alignment

## [0.9.31] - 2026-02-05

### Added
- **Comprehensive Application Logging**: Complete overhaul of logging system
  - **Default log level changed from ERROR to INFO** for comprehensive visibility
  - **GeoIP Logging**: Complete tracking of geo lookups, cache hits/misses, provider operations
    - Logs MaxMind and IPInfo lookups with success/failure details
    - Logs cache operations and database errors
    - Logs private IP detection and enrichment status
  - **Pageview Logging**: Track all pageview operations with IP detection and path info
  - **Database Logging**: Error tracking for failed operations and data integrity issues
  - **Log Level Control UI**: Added dropdown in GeoIP & System settings
    - Four levels: Debug, Info, Warn, Error
    - Inline documentation explaining each level
    - Changes take effect immediately without restart
  - All logs visible in Admin → Application Logs with color-coded severity levels

### Changed
- Logger default changed from 'error' to 'info' for better out-of-box experience
- Settings default changed to 'info' to match logger default
- All fallback values updated to use 'info' instead of 'error'

## [0.9.30] - 2026-02-04

### Fixed
- **Search Bar Duplicate Display**: Resolved race condition causing duplicate search bars
  - Added settingsLoaded flag to prevent rendering before settings are fetched
  - Search bar now only renders after searchInHeader value is properly loaded
  - Eliminates issue where search bar appeared in both header AND page content simultaneously

- **Favicon Display Improvements**: Enhanced favicon update mechanism
  - Added static favicon link in layout for immediate browser display
  - Implemented more aggressive cache-busting with timestamp + random parameter
  - DynamicFavicon now removes all existing favicon links before creating new one
  - Forces browser to recognize favicon changes without hard refresh

## [0.9.29] - 2026-02-04

### Fixed
- **CRITICAL: Favicon Settings Not Returned by API**
  - GET /api/settings was missing siteFavicon and siteFaviconType fields
  - This caused uploaded favicons to disappear after page reload
  - Settings were being saved to database but not read back
  - Now properly returns favicon settings in GET response

## [0.9.28] - 2026-02-04

### Fixed
- **Favicon Upload Persistence**: Critical fix for disappearing uploaded favicons
  - Now validates settings API response before reloading page
  - Shows error if settings save fails instead of silently reloading
  - Prevents data loss when database write fails
  - Applies to all favicon operations (upload, URL, library, transformations)

- **Search Bar Duplicate Display**: Fixed race condition
  - Added loading check to prevent search bar from rendering twice
  - Eliminates brief moment where search bar shows in both header and page

- **Enhanced Application Logging**: Added comprehensive logging system
  - Authentication: Login attempts, failures, OIDC flows
  - Security: Invalid passwords, blocked attempts, suspicious activity
  - GeoIP: Lookups, cache hits/misses, provider errors (coming soon)
  - All logs visible in Admin → Application Log

## [0.9.27] - 2026-02-04

### Fixed
- **Favicon Update Display**: Page now reloads after favicon changes
  - Ensures new favicon shows immediately in browser tab
  - Works around aggressive browser favicon caching
  - Applies to all favicon operations: upload, library selection, URL fetch, color transformations, and reset
  - Users see success toast for 1 second before automatic reload

## [0.9.26] - 2026-02-04

### Added
- **Site Favicon Customization**: Complete favicon management system
  - Upload custom favicon (PNG, ICO, SVG, JPEG up to 1MB)
  - Select from icon library (HeroIcons, Selfh.st)
  - Fetch from URL (direct links or domain favicon extraction)
  - Advanced color transformations:
    - Convert to theme color
    - Convert to grayscale
    - Invert colors
    - Revert to original
  - Dynamic favicon updates without page refresh
  - Works for both authenticated and public users
  - Integrated into Appearance settings

### Technical Details
- New API routes: `/api/site-favicon`, `/api/site-favicon/serve`, `/favicon.ico`
- New components: `DynamicFavicon`, `SiteFaviconSettings`
- Settings: `siteFavicon`, `siteFaviconType` (global settings)
- Automatic conversion to PNG and resize to 64x64
- Aggressive cache-busting with canvas rendering
- Storage: `/data/site-assets/site-favicon.png` (production)

## [0.9.25] - 2026-02-04

### Changed
- **Theme Toggle Simplification**: Hide toggle for all special themes
  - Toggle now only visible for standard themes (Slate, Gray, Zinc, etc.)
  - Removed complex counterpart logic for paired special themes
  - Special themes (Nord, Monokai, Material Dark, etc.) no longer show toggle
  - Simpler, more predictable behavior for theme switching

## [0.9.24] - 2026-02-04

### Fixed
- **Theme Toggle**: Fixed completely non-functional toggle
  - Removed `resolvedTheme` dependency from useEffect that caused race condition
  - Settings now only fetch on mount, preventing state overwrites during toggle
  - Removed unnecessary ref flag logic that didn't solve the issue
  - Toggle now works reliably for standard themes and special theme counterparts

- **Drag & Drop Persistence**: Fixed changes not being saved
  - Re-added `onContentChange()` call after successful reorder
  - Added 500ms delay to allow visual transition before refresh
  - Changes now persist correctly to database
  - Balance between smooth animation and reliable persistence

## [0.9.23] - 2026-02-04

### Fixed
- **Theme Toggle**: Resolved race condition preventing toggle from working
  - Added ref-based flag to prevent settings refetch during theme toggle
  - Fixed issue where resolvedTheme change triggered premature settings fetch
  - Theme color state now stays synchronized correctly
  - Toggle works reliably for all clicks
  - Added 1-second delay before allowing refetch after toggle

- **Drag & Drop Icon Redraw**: Minimized icon flashing after drag
  - Wrapped SortableContentItem with React.memo to prevent unnecessary re-renders
  - Memoized favicon path calculation to avoid recomputation
  - Memoized selfhst icon path calculation
  - Reduced visual flicker when items are reordered
  - Icons load once and stay loaded during drag operations

## [0.9.22] - 2026-02-04

### Fixed
- **Drag & Drop**: Eliminated refresh delay completely
  - Items stay in place instantly when dropped
  - No page refresh for same-category reordering
  - Database updates happen silently in background
  - Only refreshes on error to restore correct state
  - Truly instant visual feedback

- **Theme Toggle**: Fixed toggle becoming unresponsive after first click
  - Header now refetches settings when theme changes
  - Theme color state stays synchronized with applied theme
  - Added comprehensive console logging for debugging
  - Toggle works reliably for all theme types
  - Counterpart themes switch back and forth correctly

## [0.9.21] - 2026-02-04

### Improved
- **Drag & Drop Animation**: Smooth transitions when reordering items
  - Items now stay in place when dropped (no snap-back)
  - Background database updates don't interrupt animation
  - 300ms delay before refresh for fluid user experience
  - Parallel API updates for better performance

### Fixed
- **Theme Toggle Visibility**: Smart handling of special themes
  - Toggle hidden for standalone themes without counterparts (Material Dark, Dracula, etc.)
  - Toggle switches between theme counterparts (Nord Light ↔ Nord Dark, Monokai Light ↔ Monokai Dark)
  - Standard themes continue to toggle between light/dark modes
  - Tooltip shows counterpart theme name when applicable
  - Fixes issue where toggle didn't work with Nord Dark and similar themes

## [0.9.20] - 2026-02-04

### Fixed
- **Drag & Drop Reordering**: Fixed items not reordering within categories
  - Added reorderItems function to handle same-category reordering
  - Imported arrayMove utility from @dnd-kit/sortable
  - Added comprehensive drag event logging for debugging
  - Items now properly reorder when dragged within the same category
  - Order field updated correctly for all affected items
  - Works for both bookmarks and services

### Changed
- **@dnd-kit/sortable**: Updated from v8.0.0 to v10.0.0
  - Improved drag and drop performance
  - Better collision detection
  - Enhanced touch support

### Improved
- **PWA Install Prompt**: Reduced prompt frequency
  - Only shows once per browser session (not every page load)
  - Extended dismissal period from 7 days to 30 days
  - Added "Don't ask again" button for permanent dismissal
  - Session storage prevents repeated prompts
  - Better user experience with clear options

### Automated
- **GitHub Releases**: Automated release creation from version tags
  - Workflow automatically creates releases when tags are pushed
  - Extracts changelog entries for release notes
  - Includes Docker pull commands
  - Simplified release titles to version numbers only

## [0.9.19] - 2026-02-04

### Fixed
- **OIDC Test Origin Detection**: Fixed test authentication using internal Docker address (0.0.0.0:8080)
  - Improved origin detection to use x-forwarded-host and x-forwarded-proto headers
  - Prioritizes external URL over internal Docker address
  - Correctly handles reverse proxy configurations
  - Falls back to host header and NEXTAUTH_URL when needed
  - Added logging to track detected origin for debugging

## [0.9.18] - 2026-02-04

### Fixed
- **OIDC Test Flow Redirect**: Fixed popup authentication test showing login screen after success
  - Resolved duplicate redirect callback causing TypeScript compilation error
  - Added proper redirect callback to respect callbackUrl parameter
  - Improved test-signin route to check for existing session
  - Popup now correctly redirects to success page after authentication
  - Enhanced logging for redirect flow debugging

## [0.9.17] - 2026-02-04

### Added
- **Test Authentication Flow Button**: Test actual OIDC authentication from admin panel
  - Opens popup window for full OAuth flow testing
  - Tests real authentication without logging out
  - Reports success/failure with user email
  - Separates config validation from auth testing
  - No impact on current admin session

## [0.9.16] - 2026-02-04

### Added
- **OIDC Hot-Reload**: Configuration changes now apply instantly without container restart
  - Dynamic provider reloading eliminates downtime
  - Automatic detection and reload when OIDC settings change
  - Settings apply in < 100ms after save
- **Enhanced OIDC Testing**: Test endpoint now includes callback URL validation
  - Shows exact callback URL format required
  - Provides configuration guidance
  - Better error messages with failure stage details
- **Improved OIDC UI**: Authentication settings page enhancements
  - Success messages show callback URL with formatting
  - Error messages display specific failure stages
  - Updated info banner: "No restart needed"
  - Better visual feedback for test results

### Changed
- **OIDC Configuration**: Provider config now uses dynamic getter pattern
  - Supports hot-reload without restart
  - Maintains backward compatibility
  - No breaking changes to existing setups

### Fixed
- **OIDC Reliability**: Eliminates "Client id or secret not provided" errors after config changes
  - Settings reload automatically when saved
  - No more container restart requirement
  - Addresses GitHub Issue #10

## [0.9.15] - 2026-02-04

### Added
- **OIDC Debug Logging**: Added detailed logging for OIDC authentication
  - Logs callback details for troubleshooting
  - Shows sign-in events
  - Helps diagnose OAuthCallback errors

## [0.9.14] - 2026-02-04

### Fixed
- **OIDC Authentication**: Fixed session expiration issue causing immediate logout
  - OIDC logins now properly set token expiration (2 days)
  - Prevents redirect loop where user sees green check then gets sent back to login
  - OIDC sessions now persist correctly like password logins

## [0.9.13] - 2026-02-04

### Added
- **Site Title Customization**: Full control over homepage title display
  - Enable/disable site title display
  - Choose between gradient or solid color
  - Customize gradient colors (start and end colors)
  - Choose solid color when not using gradient
  - Live preview in settings
  - Works for logged-out users

## [0.9.12] - 2026-02-04

### Added
- **Analytics Map**: Country flag emojis on markers and location list
  - Flags display next to city names in tooltips and location list
  - Makes it easier to identify countries at a glance

### Changed
- **Analytics Map**: Increased maximum zoom from 8x to 16x
  - Allows for much closer inspection of dense location clusters

## [0.9.11] - 2026-02-03

### Fixed
- **Analytics Map**: Changed default grouping from country to city level
  - Map now shows individual cities as separate markers
  - Previously all locations in the same country were averaged into one marker
  - Indianapolis and Okemos now display as distinct locations

## [0.9.10] - 2026-02-03

### Fixed
- **Pageviews Debug**: Added latitude, longitude, and timezone to debug output
  - Critical for diagnosing analytics map issues

## [0.9.9] - 2026-02-03

### Fixed
- **Debug Endpoints**: Fixed column name mismatch in debug endpoints
  - Changed `createdAt` to `timestamp` to match actual database schema
  - Both `/api/debug/pageviews` and `/api/debug/geoip` now display recent pageviews correctly
  - Recent pageviews list was empty due to incorrect column reference

## [0.9.8] - 2026-02-03

### Fixed
- **Docker Build**: Temporarily disabled ARM64 builds due to argon2 cross-compilation issues
  - AMD64 builds work correctly
  - Will re-enable ARM64 once QEMU emulation issues are resolved

## [0.9.7] - 2026-02-03

### Fixed
- **Pageviews Debug Endpoint**: Rewrote to use SQL aggregation instead of in-memory filtering
  - Prevents "Cannot convert undefined or null to object" errors
  - More efficient query pattern for database statistics
  - Better error handling with proper fallbacks

## [0.9.6] - 2026-02-03

### Fixed
- **TypeScript Build Error**: Fixed type annotations in pageviews debug endpoint

## [0.9.5] - 2026-02-03

### Added
- **Pageviews Debug Endpoint**: New `/api/debug/pageviews` endpoint for troubleshooting analytics tracking
  - Shows recent pageviews with IP addresses and geo data
  - Displays statistics on IP tracking and geo enrichment
  - Helps diagnose why analytics map may show incorrect locations

## [0.9.4] - 2026-02-03

### Fixed
- **GeoIP Debug Endpoint**: Wrapped all database queries in individual try-catch blocks for robust error handling
- Improved error logging and graceful degradation when database queries fail

## [0.9.3] - 2026-02-03

### Fixed
- **GeoIP Debug Endpoint**: Added null checking for settings query to prevent crashes

## [0.9.2] - 2026-02-03

### Fixed
- **GeoIP Debug Endpoint**: Improved error handling and explicit Content-Type headers
- Fixed endpoint returning zero-byte file instead of JSON

## [0.9.1] - 2026-02-03

### Added
- **GeoIP Debug Endpoint**: New `/api/debug/geoip` endpoint for troubleshooting location issues
  - Shows current IP detection from request headers
  - Displays GeoIP configuration and database status
  - Tests live lookup of current IP
  - Lists recent unique IPs and their resolved locations

## [0.9.0] - 2026-02-03

### Changed
- **Centralized Favicon System**: Eliminated code duplication across the codebase
  - All favicon operations now use single `fetchAndSaveFavicon` function
  - Removed ~150 lines of duplicate code from batch and CSV import endpoints
  - Improved performance through code reuse and consistency
  - Single source of truth for favicon fetching logic

### Added
- **Site Favicon Customization**: Upload custom browser tab icon
  - Upload your own favicon or fetch from URL
  - Automatic favicon discovery from domain URLs
  - Real-time favicon updates without page reload
  - Settings UI in Appearance section

## [0.8.7] - 2026-02-03

### Fixed
- **Automatic Favicon Discovery**: When entering domain URLs (e.g., `https://manageengine.com`), system now automatically searches for favicons using multiple sources
- Direct favicon URLs (ending in .ico, .png, etc.) still work as expected
- Applies to both icon selector and site favicon settings

## [0.8.6] - 2026-02-03

### Added
- **Homepage Graphic Visibility Control**: New "Hide When Logged In" setting
  - Show homepage graphic only to logged-out users
  - Perfect for branding the login page without cluttering authenticated dashboard

### Fixed
- **Image Upload Error Handling**: Better validation and error messages
  - Added magic byte validation for uploaded images
  - Detect HTML/XML error pages when fetching favicons by URL
  - Clear error messages instead of cryptic Sharp errors

## [0.8.5] - 2026-02-03

### Fixed
- **Homepage Description Placement**: Custom homepage description now replaces the centered "Faux|Dash" text instead of appearing above it
- Removed unused `HomepageDescription` component import

## [0.8.4] - 2026-02-02

### Added
- **Homepage Customization**: Three new features for customizing the homepage
  - **Theme Persistence for Logged-Out Users**: Admin's theme settings now visible to all visitors including login page
  - **Homepage Text Customization**: Editable description with enable/disable option that replaces the default "Faux|Dash" text
  - **Homepage Graphic Upload**: Custom image with alignment (left/center/right) and position (above/below content) options
  - Image processing with WebP conversion and automatic resizing

### Changed
- **Database Migrations**: Added automatic column creation for `show_descriptions` field
- **Migration Safety**: Automatic table creation for analytics_daily, geo_cache, bookmark_clicks, service_clicks

## [0.8.3] - 2026-02-02

### Changed
- **Security**: Upgraded Next.js from 14.2.35 to 16.1.6 (addresses security vulnerabilities)
- **Security**: Upgraded React from 18 to 19
- **Security**: Upgraded ESLint from 8 to 9
- Updated all dynamic route handlers to use async params (Next.js 16 requirement)
- Added turbopack config for PWA compatibility

## [0.8.2] - 2026-02-02

### Added
- **Authentication Settings Tab**: New dedicated tab in Admin Settings for OIDC/SSO configuration
  - Moved OIDC settings from Profile page to Admin > Settings > Auth tab
  - OIDC is a global system setting, not a per-user setting
  - Includes Test Connection button to verify OIDC configuration
  - Shows callback URL for easy provider configuration
  - Warning about restart requirement after changes
- **Description Visibility Settings**: Hierarchical control over description display
  - Global "Show Descriptions" toggle in Settings → Appearance
  - Per-category override (Inherit/Show/Hide dropdown)
  - Per-item override (Inherit/Show/Hide dropdown)
  - Hierarchy: Item setting → Category setting → Global default
- **New Standalone Themes**: 10 new pre-configured dark themes
  - Nord Light, Nord Dark, Material Dark, Minimal Kiwi
  - One Dark Pro, Catppuccin Mocha, Shades of Purple
  - Monokai Light, Monokai Dark, Dracula
- **Public Settings API**: New `/api/settings/public` endpoint for unauthenticated access to non-sensitive settings

### Fixed
- **OIDC Login Button Not Appearing**: Fixed multiple issues with OIDC button visibility
  - Login page now correctly fetches OIDC settings via public API endpoint
  - OIDC, SMTP, and GeoIP settings are now saved as global settings (userId = null) instead of user-specific
  - Settings API now correctly queries for global settings and merges with user settings
- **Standalone Theme Application**: Themes like "Nord Dark" and "Dracula" now apply correctly without being mangled by "(Dark)" suffix logic
- **Uncategorized Items Disappearing**: Category deletion now moves items to "Uncategorized" instead of orphaning them
- **Orphaned Items on Container Restart**: Migration now catches items with invalid category references (deleted categories), not just NULL categories
- **Dark Mode Contrast**: Updated dark mode base palette to GitHub Dark Default for better readability
- **Admin Panel Theme Consistency**: Replaced hardcoded Tailwind colors with CSS variables throughout admin pages
- **Backup API Resilience**: Added error handling for missing analytics tables during backup export
- **Service Worker Caching**: Excluded backup/restore API routes from PWA cache to prevent download issues

### Changed
- **Profile Page Simplified**: Now contains only user-specific settings (Account Info, Password Change)
- Dark themes now use GitHub Dark Default as base palette (better contrast)
- Theme selection dropdown now groups standalone themes separately
- Migration script refactored for better maintainability

## [0.8.1] - 2026-02-02

### Added
- **Remember Me**: Extended session duration option on login page
  - Checkbox to enable extended sessions
  - Duration selector: 1 week, 1 month, 3 months, or 1 year
  - Default session remains 2 days when not enabled
  - JWT token expiration dynamically set based on user preference

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
