# Faux|Dash - Feature Backlog

This document tracks planned features and improvements. See CHANGELOG.md for completed features.

## Implemented Features

The following features from the original backlog have been completed:

- **OIDC Authentication** - Implemented in v0.8.2 (Admin > Settings > Auth)
- **Backup and Restore** - Implemented in v0.5.0 (Admin > Tools)
- **Bookmark Import/Export** - CSV import/export implemented
- **Global Search** - Cmd/Ctrl+K planned, basic search implemented
- **PWA Support** - Implemented in v0.7.0
- **Advanced Analytics** - GeoIP analytics with map visualization implemented
- **Per-User Settings** - Theme and settings persistence implemented

---

## High Priority

### Custom Icon Upload
**Status**: Partially implemented

- [x] SVG rendering from icon libraries
- [x] Favicon auto-fetch from URLs
- [ ] Direct SVG file upload
- [ ] Custom image upload for icons
- [ ] Icon library management

**Notes**: Media Library (v0.11.0) added image upload for logo/favicon. Extending to bookmark icons is the remaining work.

### Global Search (Cmd/Ctrl+K)
**Status**: Planned

- [ ] Keyboard shortcut to open search modal
- [ ] Search across all bookmarks and services
- [ ] Filter by category
- [ ] Recent searches

---

## Medium Priority

### Passkey Authentication
**Status**: Planned

- [ ] WebAuthn/FIDO2 implementation
- [ ] Passkey registration flow
- [ ] Passkey login flow
- [ ] Multiple passkeys per user

### 2FA Support
**Status**: Planned

- [ ] TOTP (Time-based One-Time Password)
- [ ] QR code for authenticator apps
- [ ] Backup codes
- [ ] Enforce 2FA for admin accounts

### Bookmark Tags
**Status**: Under consideration

- [ ] Add tags to bookmarks
- [ ] Filter by tag
- [ ] Tag cloud visualization

---

## Low Priority

### Browser Extension
**Status**: Backlog

- [ ] Chrome/Edge extension
- [ ] Firefox extension
- [ ] "Add to Faux|Dash" context menu

### Public Sharing
**Status**: Under consideration

- [ ] Generate shareable link for category
- [ ] Public view (no auth required)
- [ ] Optional password protection

### Multi-Language Support
**Status**: Backlog

- [ ] i18n setup
- [ ] Translation management

---

## DevOps & Infrastructure

### Kubernetes Support
**Status**: Backlog

- [ ] Helm chart
- [ ] Kubernetes manifests

### Monitoring
**Status**: Partial

- [x] Application logging (Admin > Logs)
- [x] GeoIP analytics
- [ ] Prometheus metrics endpoint
- [ ] Grafana dashboard

### CI/CD
**Status**: Implemented

- [x] GitHub Actions workflow
- [x] Automated Docker builds
- [x] Multi-platform builds (amd64/arm64)
- [x] GitHub Container Registry publishing

---

## Won't Do

These features are out of scope:

- Social features (comments, likes)
- Real-time collaboration
- Blockchain integration
- AI-powered recommendations
- Native mobile apps (PWA is sufficient)
- Desktop apps (web is sufficient)
- Plugin/extension system

---

## Contributing

If you want to work on a backlog item:
1. Check if it's already in progress
2. Open an issue to discuss approach
3. Submit a pull request
4. Update this backlog when completed
