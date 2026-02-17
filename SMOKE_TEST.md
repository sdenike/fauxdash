# Faux|Dash - Smoke Test Checklist

Manual smoke test checklist to verify Faux|Dash is working correctly after installation or updates.

## Pre-Test Setup

- [ ] Docker and Docker Compose are installed
- [ ] Application is running: `docker compose ps` shows all services as "Up"
- [ ] Application is accessible at http://localhost:8080
- [ ] `.env` file is configured with valid `NEXTAUTH_SECRET`

---

## 1. Initial Setup (First Run Only)

- [ ] Navigate to http://localhost:8080
- [ ] Redirected to `/setup` wizard
- [ ] Create admin account with email and password
- [ ] Password strength meter displays
- [ ] Setup completes successfully
- [ ] Redirected to homepage

---

## 2. Homepage

- [ ] Homepage loads without errors
- [ ] Header displays "Faux|Dash" title (or custom title)
- [ ] Theme toggle button is visible
- [ ] Search bar is visible (if enabled)
- [ ] Weather widget displays (if configured)
- [ ] Login button is visible (if logged out)

---

## 3. Authentication

### Login
- [ ] Click login button
- [ ] Login page displays
- [ ] Enter credentials
- [ ] Click "Sign In"
- [ ] Redirected to homepage
- [ ] Header shows admin icon (gear) and user menu

### Logout
- [ ] Click logout button
- [ ] Successfully logged out
- [ ] Login button appears again

### Remember Me
- [ ] Check "Remember Me" checkbox
- [ ] Select duration (1 week, 1 month, etc.)
- [ ] Login persists after browser restart

---

## 4. Admin Panel

- [ ] Log in as admin
- [ ] Click admin panel button (gear icon)
- [ ] Admin dashboard loads
- [ ] Version number visible in header
- [ ] Update notification appears (if new version available)

### Tabs
- [ ] Content tab loads
- [ ] Settings tab loads
- [ ] Users tab loads
- [ ] Logs tab loads
- [ ] Analytics tab loads
- [ ] Tools tab loads

---

## 5. Content Management

### Categories
- [ ] Create bookmark category with icon
- [ ] Create service category with icon
- [ ] Edit category name and icon
- [ ] Drag-and-drop reorder categories
- [ ] Delete category (items move to Uncategorized)

### Bookmarks
- [ ] Add bookmark to category
- [ ] Auto-fetch favicon from URL
- [ ] Select icon from library
- [ ] Add description
- [ ] Drag-and-drop reorder
- [ ] Edit bookmark
- [ ] Delete bookmark

### Services
- [ ] Add service to category
- [ ] Same operations as bookmarks
- [ ] Services appear in separate section on homepage

---

## 6. Settings

### General
- [ ] Toggle search bar
- [ ] Change search engine
- [ ] Configure welcome message

### Weather
- [ ] Enable/disable weather widget
- [ ] Select weather provider
- [ ] Add weather locations
- [ ] Drag-and-drop reorder locations

### Appearance
- [ ] Change theme (light/dark/system)
- [ ] Change theme color
- [ ] Configure site title
- [ ] Upload header logo
- [ ] Configure site favicon
- [ ] Adjust column counts

### Email/SMTP
- [ ] Configure SMTP settings
- [ ] Send test email
- [ ] Verify SMTP connection

### Authentication
- [ ] Configure OIDC settings
- [ ] Test OIDC connection
- [ ] Enable/disable OIDC-only mode

### GeoIP
- [ ] Configure GeoIP provider
- [ ] Test GeoIP lookup
- [ ] Adjust log level

---

## 7. User Management

- [ ] View user list
- [ ] Create new user
- [ ] Edit user details
- [ ] Delete user (not yourself)
- [ ] Change user role (admin/user)

---

## 8. Backup & Import

### Backup
- [ ] Create backup (ZIP download)
- [ ] Backup contains bookmarks.csv, services.csv, settings.json

### Import
- [ ] Import bookmarks from CSV
- [ ] Import services from CSV
- [ ] Restore from backup ZIP

### Demo Content
- [ ] Load demo content
- [ ] Clear demo content

---

## 9. Analytics

- [ ] View pageview statistics
- [ ] View click statistics
- [ ] Analytics map displays (with GeoIP)
- [ ] Location markers show visitor locations

---

## 10. Tools

- [ ] Repair favicons
- [ ] Prune orphaned files
- [ ] Optimize database
- [ ] Check MaxMind status

---

## 11. PWA Support

- [ ] Install prompt appears on mobile
- [ ] App can be added to home screen
- [ ] App icon displays correctly
- [ ] Standalone mode works (no browser chrome)
- [ ] Offline page displays when offline

---

## 12. Logs

- [ ] View application logs
- [ ] Log levels are color-coded
- [ ] Logs auto-refresh

---

## 13. Search & Navigation

- [ ] Search bar searches external engine
- [ ] Bookmarks open in new tab
- [ ] Services open in new tab
- [ ] Click tracking increments count

---

## 14. Responsive Design

### Desktop
- [ ] All features work on desktop
- [ ] Admin sidebar visible

### Mobile
- [ ] Header is responsive
- [ ] Admin sidebar collapses (hamburger menu)
- [ ] Grid adapts to screen size
- [ ] Touch targets are adequate

---

## 15. Data Persistence

- [ ] Create content
- [ ] Restart containers: `docker compose restart`
- [ ] Data persists after restart

---

## Pass Criteria

**Passes if:**
- Core features (content, auth, settings) work
- No critical errors in logs
- Data persists across restarts
- UI is responsive

**Fails if:**
- Cannot log in
- Cannot create/edit content
- Data is lost after restart
- Critical errors in logs

---

## Report Issues

If a test fails:
1. Note which test failed
2. Check logs: `docker compose logs app`
3. Check browser console
4. Document reproduction steps
5. Report issue on GitHub
