# FauxDash Homepage - Feature Backlog

This document tracks planned features and improvements that were deferred from v0.1.0.

## High Priority

### OIDC Authentication
**Status**: Planned for v0.2.0

- [ ] Add OIDC provider configuration
- [ ] Implement OIDC login flow alongside local auth
- [ ] Allow users to choose login method
- [ ] Support admin-only OIDC requirement
- [ ] Support site-wide OIDC requirement

**Technical Notes**:
- NextAuth.js already supports OIDC providers
- Need UI to toggle between local and OIDC login
- Environment variables for issuer, client ID, client secret

### Custom Icon Upload
**Status**: Planned for v0.3.0

- [ ] Add SVG file upload capability
- [ ] Store icons in local filesystem or S3-compatible storage
- [ ] Serve icons through Next.js API route or static files
- [ ] Fallback to emoji if custom icon not set
- [ ] Icon library management in admin panel

**Technical Notes**:
- Need file upload handler
- Image optimization
- Storage abstraction layer

### Bookmark Import/Export
**Status**: Planned for v0.2.0

- [ ] Export bookmarks to JSON
- [ ] Export bookmarks to CSV
- [ ] Import from JSON (FauxDash format)
- [ ] Import from CSV
- [ ] Import from browser bookmark HTML format
- [ ] Validation and error handling for imports

**Technical Notes**:
- Use browser bookmark format for compatibility
- Validate URLs and structure
- Handle duplicate detection

## Medium Priority

### Advanced Analytics
**Status**: Under consideration

- [ ] Time-series click data
- [ ] Chart visualization (daily, weekly, monthly)
- [ ] Popular bookmarks dashboard
- [ ] Category usage statistics
- [ ] Export analytics to CSV
- [ ] Configurable retention period

**Technical Notes**:
- May require additional database table for time-series
- Consider using lightweight charting library
- Privacy implications - document data collection

### Per-User Themes
**Status**: Planned for v0.4.0

- [ ] User-specific theme preferences
- [ ] Custom color palette per user
- [ ] Save theme to user settings table
- [ ] Sync across devices when logged in
- [ ] Admin can set default theme for all users

**Technical Notes**:
- Extend settings table with user_id
- Store theme as JSON in settings
- Apply theme on session load

### Passkey Authentication
**Status**: Experimental

- [ ] Research WebAuthn/FIDO2 implementation
- [ ] Add passkey registration flow
- [ ] Add passkey login flow
- [ ] Fallback to password if passkey fails
- [ ] Manage multiple passkeys per user

**Technical Notes**:
- Browser support varies
- Need to handle fallback gracefully
- Consider using library like @simplewebauthn/server

### Global Search
**Status**: Planned for v0.3.0

- [ ] Search across all bookmarks
- [ ] Filter by category
- [ ] Highlight matching text
- [ ] Keyboard shortcuts (Cmd/Ctrl+K)
- [ ] Recent searches

**Technical Notes**:
- Client-side search for small datasets
- Server-side search for larger datasets
- Full-text search with database

## Low Priority

### Browser Extension
**Status**: Backlog

- [ ] Chrome/Edge extension
- [ ] Firefox extension
- [ ] "Add to FauxDash" context menu
- [ ] Auto-detect current page title and URL
- [ ] Suggest category based on domain

**Technical Notes**:
- Need API endpoint for bookmark creation
- Authentication token handling
- Cross-browser compatibility

### Webhook Notifications
**Status**: Backlog

- [ ] Webhook on bookmark creation
- [ ] Webhook on category changes
- [ ] Configurable webhook URL
- [ ] Retry logic
- [ ] Signature verification

**Technical Notes**:
- Background job queue for reliability
- Standard webhook payload format

### Multi-Language Support
**Status**: Backlog

- [ ] i18n setup with next-intl or similar
- [ ] English (default)
- [ ] Spanish
- [ ] French
- [ ] German
- [ ] User-selected language preference

**Technical Notes**:
- May require significant refactoring
- Translation management process
- RTL language support

### RSS Feed Widget
**Status**: Under consideration

- [ ] Add RSS feed reader widget
- [ ] Display latest N items
- [ ] Configurable feeds
- [ ] Refresh interval
- [ ] Widget positioning

**Technical Notes**:
- Fetch and parse RSS feeds server-side
- Cache results
- Consider using library like rss-parser

### Notes/Widgets System
**Status**: Under consideration

- [ ] Freeform text notes widget
- [ ] To-do list widget
- [ ] Custom HTML widget
- [ ] Widget layout management
- [ ] Drag-and-drop widget positioning

**Technical Notes**:
- Extensible widget system
- Security considerations for custom HTML
- Widget persistence in database

### Backup and Restore
**Status**: Planned for v0.2.0

- [ ] One-click backup download
- [ ] Automated backup scheduling
- [ ] Restore from backup file
- [ ] Backup includes all data (categories, bookmarks, settings)
- [ ] Verify backup integrity

**Technical Notes**:
- Export entire database to JSON
- Include schema version for compatibility
- Validate on restore

### 2FA Support
**Status**: Backlog

- [ ] TOTP (Time-based One-Time Password)
- [ ] QR code for authenticator apps
- [ ] Backup codes
- [ ] Enforce 2FA for admin accounts
- [ ] Recovery flow

**Technical Notes**:
- Use library like otplib
- Store 2FA secrets securely
- Handle recovery carefully

### Public Sharing
**Status**: Under consideration

- [ ] Generate shareable link for category
- [ ] Public view (no auth required)
- [ ] Optional password protection
- [ ] Expiring links
- [ ] Disable/revoke sharing

**Technical Notes**:
- UUID-based sharing links
- Separate public route
- Privacy implications

### Bookmark Tags
**Status**: Under consideration

- [ ] Add tags to bookmarks
- [ ] Filter by tag
- [ ] Tag management
- [ ] Tag cloud visualization
- [ ] Auto-suggest tags

**Technical Notes**:
- Many-to-many relationship
- New database table for tags
- Search by tag

## Performance Improvements

### Image Optimization
**Status**: Backlog

- [ ] Lazy load bookmark icons
- [ ] Optimize custom uploaded icons
- [ ] WebP format support
- [ ] Responsive images

### Code Splitting
**Status**: Partial (admin already split)

- [ ] Further split admin components
- [ ] Lazy load weather widget
- [ ] Dynamic imports for heavy libraries

### Database Optimization
**Status**: Ongoing

- [ ] Add indexes on commonly queried fields
- [ ] Query optimization
- [ ] Connection pooling tuning
- [ ] Prepared statements

### Caching Strategy
**Status**: Implemented (can be improved)

- [ ] Longer TTL for static data
- [ ] Cache warming on startup
- [ ] Smarter cache invalidation
- [ ] Client-side caching with SWR

## DevOps & Infrastructure

### Kubernetes Support
**Status**: Backlog

- [ ] Helm chart
- [ ] Kubernetes manifests
- [ ] Horizontal scaling considerations
- [ ] External database requirement for multi-pod

### Monitoring & Observability
**Status**: Backlog

- [ ] Prometheus metrics endpoint
- [ ] Grafana dashboard
- [ ] Structured logging
- [ ] Error tracking (Sentry integration)

### CI/CD Pipeline
**Status**: Backlog

- [ ] GitHub Actions workflow
- [ ] Automated testing
- [ ] Docker image builds
- [ ] Automated releases

### Documentation
**Status**: Ongoing

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture diagrams
- [ ] Video tutorial
- [ ] FAQ page

## Nice to Have

- [ ] Dark mode color palette customization
- [ ] Bookmark duplicate detection
- [ ] Bulk operations (delete, move, export)
- [ ] Activity log (audit trail)
- [ ] User roles (beyond admin/user)
- [ ] Bookmark descriptions (tooltip on hover)
- [ ] Bookmark preview on hover
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Custom domain support for Docker deployment
- [ ] Email notifications (digest, changes)
- [ ] Collaborative features (share with other users)
- [ ] Version control for bookmarks (history)
- [ ] Trash/recycle bin (soft delete)

## Won't Do (For Now)

These features have been considered but are out of scope:

- Social features (comments, likes)
- Real-time collaboration
- Blockchain integration
- AI-powered recommendations
- Native mobile apps (PWA is sufficient)
- Desktop apps (web is sufficient)
- Plugin/extension system (too complex)

---

## How to Use This Backlog

- Features move from backlog to planned releases
- Priority can change based on user feedback
- Technical notes are initial thoughts, may evolve
- Check CHANGELOG.md for completed features

## Contributing

If you want to work on a backlog item:
1. Check if it's already in progress
2. Open an issue to discuss approach
3. Submit a pull request
4. Update this backlog when completed
