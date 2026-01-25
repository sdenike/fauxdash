# FauxDash Homepage - Smoke Test Checklist

This document provides a manual smoke test checklist to verify that FauxDash Homepage is working correctly after installation or updates.

## Pre-Test Setup

- [ ] Docker and Docker Compose are installed
- [ ] Application is running: `docker compose ps` shows all services as "Up"
- [ ] Application is accessible at http://localhost:8080
- [ ] `.env` file is configured with valid `NEXTAUTH_SECRET`

## 1. Initial Access

- [ ] Navigate to http://localhost:8080
- [ ] Homepage loads without errors
- [ ] Empty state message is displayed (no categories yet)
- [ ] Header displays "FauxDash" title
- [ ] Theme toggle button is visible
- [ ] Login button is visible

## 2. Authentication

### Login
- [ ] Click login button (user icon in header)
- [ ] Login page displays
- [ ] Enter default credentials:
  - Email: `admin@fauxdash.local`
  - Password: `admin`
- [ ] Click "Sign In"
- [ ] Successfully redirected to homepage
- [ ] Header now shows admin icon (gear) and logout icon

### Logout
- [ ] Click logout button (arrow icon in header)
- [ ] Successfully logged out
- [ ] Login button appears again

## 3. Theme Switching

- [ ] Click theme toggle button
- [ ] Theme switches between light and dark mode
- [ ] Theme preference persists after page reload
- [ ] All UI elements are visible in both themes

## 4. Admin Panel Access

- [ ] Log in as admin
- [ ] Click admin panel button (gear icon in header)
- [ ] Admin page loads successfully
- [ ] "Categories" section is visible
- [ ] "Bookmarks" section is visible
- [ ] Back button (arrow) is visible

## 5. Category Management

### Create Category
- [ ] Click "Add Category" button
- [ ] Modal dialog opens
- [ ] Fill in form:
  - Name: "Development"
  - Icon: "💻"
  - Visible: checked
  - Requires Auth: unchecked
- [ ] Click "Create"
- [ ] Modal closes
- [ ] Category appears in the list

### Edit Category
- [ ] Click pencil icon on the created category
- [ ] Modal opens with existing data
- [ ] Change name to "Dev Tools"
- [ ] Click "Update"
- [ ] Category name updates in the list

### Reorder Categories
- [ ] Create a second category
- [ ] Drag and drop to reorder categories
- [ ] Order persists after page reload

### Delete Category
- [ ] Click trash icon on a category
- [ ] Confirm deletion dialog appears
- [ ] Click OK
- [ ] Category is removed from the list

## 6. Bookmark Management

### Create Bookmark
- [ ] Create a category first (if not exists)
- [ ] Click "Add Bookmark" button
- [ ] Fill in form:
  - Name: "GitHub"
  - URL: "https://github.com"
  - Icon: "🐙"
  - Category: (select existing category)
  - Visible: checked
  - Requires Auth: unchecked
- [ ] Click "Create"
- [ ] Bookmark appears under the selected category

### Edit Bookmark
- [ ] Click pencil icon on the created bookmark
- [ ] Modal opens with existing data
- [ ] Change name to "GitHub Homepage"
- [ ] Click "Update"
- [ ] Bookmark name updates in the list

### Reorder Bookmarks
- [ ] Create multiple bookmarks in the same category
- [ ] Drag and drop to reorder bookmarks
- [ ] Order persists after page reload

### Delete Bookmark
- [ ] Click trash icon on a bookmark
- [ ] Confirm deletion dialog appears
- [ ] Click OK
- [ ] Bookmark is removed from the list

## 7. Public Homepage

### View Categories and Bookmarks
- [ ] Return to homepage (click back button or navigate to `/`)
- [ ] Categories are displayed
- [ ] Bookmarks are visible under categories
- [ ] Icons (emoji) are displayed correctly

### Click Bookmark
- [ ] Click on a bookmark
- [ ] New tab/window opens with the bookmark URL
- [ ] Click is tracked (verify in admin panel - click count increments)

### Visibility Controls
- [ ] In admin, create a bookmark with "Visible" unchecked
- [ ] Return to homepage
- [ ] Hidden bookmark does not appear
- [ ] Re-enable visibility
- [ ] Bookmark now appears

### Authentication Controls
- [ ] In admin, create a bookmark with "Requires Auth" checked
- [ ] Log out
- [ ] Return to homepage
- [ ] Protected bookmark does not appear
- [ ] Log in
- [ ] Protected bookmark now appears

## 8. Search Functionality

- [ ] Search bar is visible on homepage
- [ ] Type a query (e.g., "test")
- [ ] Press Enter or click search
- [ ] New tab opens with search results from configured search engine
- [ ] Search bar clears after search

## 9. Weather Widget

**Note**: Requires valid API key in `.env`

### With Valid API Key
- [ ] Weather widget appears on homepage
- [ ] Current weather is displayed
- [ ] Location name is shown
- [ ] Temperature, condition, humidity, and wind speed are visible
- [ ] Weather icon is displayed

### Multiple Locations
- [ ] Configure multiple locations in `.env`: `WEATHER_LOCATIONS=90210,10001`
- [ ] Restart application
- [ ] Weather widget shows navigation arrows
- [ ] Click arrows to switch between locations
- [ ] Auto-rotation works (if configured)

### Without API Key
- [ ] Remove weather API key from `.env`
- [ ] Restart application
- [ ] Weather widget does not appear
- [ ] No errors in console

## 10. Database Persistence

### Data Persistence
- [ ] Create categories and bookmarks
- [ ] Restart application: `docker compose restart app`
- [ ] Data persists after restart
- [ ] Categories and bookmarks are still visible

### Migration on Startup
- [ ] Check logs: `docker compose logs app`
- [ ] Look for "Migrations completed successfully" message
- [ ] No migration errors

## 11. Redis Caching

**With Redis Enabled**
- [ ] Redis container is running
- [ ] Homepage loads quickly on subsequent visits
- [ ] Admin changes immediately reflect on homepage
- [ ] No stale data issues

**With Redis Disabled**
- [ ] Set `REDIS_ENABLED=false` in `.env`
- [ ] Restart application
- [ ] Application still works correctly
- [ ] Homepage loads (slightly slower)

## 12. Error Handling

### Invalid Login
- [ ] Try logging in with wrong password
- [ ] Error message is displayed
- [ ] Login form remains accessible

### Network Error Simulation
- [ ] Open browser DevTools
- [ ] Go to Network tab
- [ ] Throttle to "Offline"
- [ ] Try to create a category
- [ ] Appropriate error message or behavior
- [ ] Re-enable network
- [ ] Functionality returns to normal

## 13. Responsive Design

### Desktop
- [ ] All features work on desktop browser
- [ ] Layout is clean and organized

### Mobile
- [ ] Open homepage on mobile device or use DevTools device emulation
- [ ] Header is responsive
- [ ] Bookmarks grid adapts to screen size
- [ ] Admin panel is usable on mobile
- [ ] Drag-and-drop works on touch devices

## 14. Multi-Database Testing (Optional)

### SQLite (Default)
- [ ] Application works with SQLite (default)
- [ ] Data file exists at `/data/fauxdash.db` in container

### PostgreSQL
- [ ] Uncomment postgres service in docker-compose.yml
- [ ] Set `DB_PROVIDER=postgres` in `.env`
- [ ] Set `DB_URL` to postgres connection string
- [ ] Restart application
- [ ] Run migrations
- [ ] Application works with PostgreSQL

### MySQL
- [ ] Uncomment mysql service in docker-compose.yml
- [ ] Set `DB_PROVIDER=mysql` in `.env`
- [ ] Set `DB_URL` to mysql connection string
- [ ] Restart application
- [ ] Run migrations
- [ ] Application works with MySQL

## 15. Logs and Debugging

- [ ] Check application logs: `docker compose logs app`
- [ ] No critical errors or warnings
- [ ] Redis logs (if enabled): `docker compose logs redis`
- [ ] Database logs (if using postgres/mysql)

## Pass Criteria

**The smoke test passes if:**
- All core features (categories, bookmarks, auth) work correctly
- No critical errors in logs
- Data persists across restarts
- UI is responsive and accessible
- Both authenticated and unauthenticated access work as expected

**The smoke test fails if:**
- Cannot log in
- Cannot create or edit categories/bookmarks
- Data is lost after restart
- Critical errors in console or logs
- UI is broken or inaccessible

## Notes

- This is a manual smoke test, not automated tests
- Run this checklist after:
  - Initial installation
  - Major upgrades
  - Configuration changes
  - Database migrations
- Expected duration: 15-20 minutes for full checklist

## Report Issues

If any test fails:
1. Note which test failed
2. Check application logs
3. Check browser console for errors
4. Document steps to reproduce
5. Report issue with details
