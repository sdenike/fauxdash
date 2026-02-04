# Comprehensive Feature & Issue Resolution Plan

**Generated:** 2026-02-04
**Version:** 1.0
**Status:** Review Required

---

## Executive Summary

This document provides an in-depth analysis of current issues and a prioritized implementation plan for Faux|Dash. Issues are categorized by severity and impact, with detailed implementation steps for each.

---

## Table of Contents

1. [Critical Issues](#critical-issues)
2. [High Priority Improvements](#high-priority-improvements)
3. [Medium Priority Enhancements](#medium-priority-enhancements)
4. [Dependency Updates](#dependency-updates)
5. [Implementation Timeline](#implementation-timeline)
6. [Risk Assessment](#risk-assessment)

---

## Critical Issues

### 1. OIDC Authentication Reliability (GitHub Issue #10)

**Severity:** Critical
**Impact:** Users cannot authenticate with OIDC providers
**Current Status:** Open issue, callback URL validation failing

#### Problem Analysis
- GitHub Issue #10: "Invalid callback URL" error when using PocketID
- Current callback URL: `https://startpage.denike.io/api/auth/callback/oidc`
- OIDC settings loaded at server startup (line 105 in `src/lib/auth.ts`)
- Container restart required after configuration changes
- No validation of OIDC configuration before save

#### Root Causes
1. **Settings Cache**: OIDC config loaded synchronously at module initialization
2. **No Pre-Flight Validation**: Settings saved without testing connectivity
3. **Poor Error Feedback**: Generic "OAuthCallback" error doesn't indicate root cause
4. **State Management**: Configuration changes don't trigger graceful reload

#### Implementation Plan

##### Phase 1: Immediate Fixes (1-2 hours)
**File:** `src/lib/auth.ts`
- [ ] Add runtime configuration reload capability
- [ ] Implement hot-reload for OIDC settings without container restart
- [ ] Add detailed error logging with specific failure reasons

```typescript
// Add dynamic provider management
let dynamicProviders: any[] = [];

export function reloadOidcProvider() {
  const oidcConfig = getOidcSettingsSync();
  // Rebuild providers array with current settings
  dynamicProviders = buildProviders(oidcConfig);
}

// Modify authOptions to use dynamicProviders getter
export const authOptions: NextAuthOptions = {
  get providers() {
    return dynamicProviders.length ? dynamicProviders : buildProviders(getOidcSettingsSync());
  },
  // ... rest of config
}
```

**File:** `src/app/api/settings/route.ts`
- [ ] Add `POST /api/settings/oidc-reload` endpoint
- [ ] Call `reloadOidcProvider()` after saving OIDC settings
- [ ] Return success/failure status with detailed errors

##### Phase 2: Validation & Testing (2-3 hours)
**File:** `src/app/api/settings/oidc-test/route.ts` (enhance existing)
- [ ] Add comprehensive validation checks:
  - [ ] Well-known configuration endpoint accessibility
  - [ ] Client ID format validation
  - [ ] Callback URL validation against provider requirements
  - [ ] Token endpoint connectivity test
  - [ ] Authorization endpoint accessibility check

**File:** `src/components/settings/authentication-tab.tsx`
- [ ] Show validation results in real-time
- [ ] Display callback URL format requirements from provider
- [ ] Add "Copy Callback URL" button for easy provider configuration
- [ ] Prevent save if validation fails (with override option)

##### Phase 3: Documentation & User Guidance (1 hour)
**New File:** `docs/oidc-setup-guide.md`
- [ ] Step-by-step setup for popular providers (Authentik, Keycloak, PocketID, Okta)
- [ ] Troubleshooting common errors
- [ ] Callback URL formatting requirements
- [ ] Provider-specific configuration notes

**File:** `src/components/settings/authentication-tab.tsx`
- [ ] Add inline help text for each field
- [ ] Link to setup guide
- [ ] Show example configurations

#### Testing Strategy
1. **Unit Tests**: Validation logic for OIDC configuration
2. **Integration Tests**: Full authentication flow with test OIDC provider
3. **Manual Testing**:
   - Test with multiple providers (Authentik, Keycloak, PocketID)
   - Verify hot-reload works without container restart
   - Test error scenarios (invalid client ID, wrong callback URL, unreachable provider)

#### Success Criteria
- [ ] OIDC authentication works with PocketID (Issue #10)
- [ ] No container restart required after configuration changes
- [ ] Clear error messages for all failure scenarios
- [ ] Validation catches configuration errors before save
- [ ] Documentation covers all supported providers

---

### 2. Drag and Drop Issues in Content Manager

**Severity:** High
**Impact:** Core functionality not working as expected
**User Report:** "I can not seem to drag and drop the order of bookmarks in their category or services in their own categories"

#### Problem Analysis
- Current implementation uses `@dnd-kit/sortable` v8.0.0
- Latest version is v10.0.0 (major version behind)
- Drag detection uses `closestCorners` collision detection
- Items should support:
  1. Reordering within category
  2. Moving between categories
  3. Converting bookmark ↔ service by dragging to different category type

#### Root Causes
1. **Outdated Library**: v8.0.0 may have bugs fixed in v10.0.0
2. **Collision Detection**: `closestCorners` may not work well with nested containers
3. **Sorting Strategy**: `verticalListSortingStrategy` may conflict with grid layout
4. **Activation Constraint**: `distance: 8` may be too sensitive or not sensitive enough

#### Implementation Plan

##### Phase 1: Library Updates (30 mins)
**File:** `package.json`
- [ ] Update `@dnd-kit/core` to latest
- [ ] Update `@dnd-kit/sortable` to v10.0.0
- [ ] Update `@dnd-kit/utilities` to latest
- [ ] Run `npm install` and test for breaking changes

##### Phase 2: Debug Current Implementation (1 hour)
**File:** `src/components/admin/content-manager.tsx`
- [ ] Add console logging to drag handlers (lines 308-343)
- [ ] Verify `activeId` is set correctly on drag start
- [ ] Check if `over` is null when dropping
- [ ] Test collision detection with different strategies
- [ ] Verify SortableContext items array is correct

##### Phase 3: Collision Detection Improvements (1-2 hours)
**File:** `src/components/admin/content-manager.tsx`
- [ ] Test alternative collision detection algorithms:
  - `closestCenter` - Better for grid layouts
  - `rectIntersection` - Better for overlapping containers
  - `pointerWithin` - More forgiving for nested containers

```typescript
import {
  DndContext,
  closestCenter, // Try this instead of closestCorners
  rectIntersection,
  pointerWithin,
} from '@dnd-kit/core'

// Test each one:
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter} // or rectIntersection, or pointerWithin
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
```

##### Phase 4: Enhanced Visual Feedback (1 hour)
**File:** `src/components/admin/content-manager.tsx`
- [ ] Make drag handle more prominent
- [ ] Add visual feedback when hovering over drop zones
- [ ] Increase opacity of dragged item (currently 0.5, try 0.7)
- [ ] Add drop zone highlighting

```typescript
// SortableContentItem
const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.7 : 1, // Increase from 0.5
  cursor: isDragging ? 'grabbing' : 'default',
}
```

##### Phase 5: Activation Constraints (30 mins)
**File:** `src/components/admin/content-manager.tsx`
- [ ] Test different activation distances
- [ ] Consider adding delay activation for touch devices
- [ ] Test with both mouse and touch input

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // Reduce from 8 to make it easier to start drag
      tolerance: 5,
      delay: 100, // Add slight delay for accidental drags
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)
```

#### Testing Strategy
1. **Within Category**: Drag bookmark 1 above bookmark 2 in same category
2. **Between Categories**: Drag bookmark from Category A to Category B
3. **Bookmark → Service**: Drag bookmark into service category
4. **Service → Bookmark**: Drag service into bookmark category
5. **Uncategorized Items**: Drag uncategorized items into categories
6. **Order Persistence**: Verify order saves to database
7. **Multiple Selection**: Test with items selected (should it drag all selected?)

#### Success Criteria
- [ ] Items can be reordered within their category
- [ ] Items can be moved between categories
- [ ] Items can be converted by dragging to different category type
- [ ] Visual feedback is clear during drag
- [ ] Order changes persist after page reload
- [ ] Works on both desktop (mouse) and tablet (touch)

---

## High Priority Improvements

### 3. Analytics Map Visibility Enhancements

**Severity:** Medium
**Impact:** User experience degradation
**User Report:** "Its also hard to see the cities with the way they are listed here. And the Low, Medium, High are not the easiest to see"

#### Current State Analysis
**File:** `src/components/admin/analytics/visitor-map.tsx`

**Location List (lines 349-365):**
- Grid layout: `grid-cols-2 md:grid-cols-4`
- Text truncates on small items
- Small colored dot indicator (2px diameter)
- Limited to 12 items visible

**Legend (lines 287-298):**
- Small circles: 2px (Low), 3px (Medium), 4px (High)
- Semi-transparent colors (opacity 0.3-1.0)
- Located in bottom-right corner
- Text may be hard to read in some themes

#### Implementation Plan

##### Phase 1: Improve Location List Visibility (1 hour)
**File:** `src/components/admin/analytics/visitor-map.tsx`

```typescript
{/* Enhanced location list with better visibility */}
<div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
  <div className="flex items-center justify-between px-2 py-1 border-b">
    <span className="text-xs font-semibold text-muted-foreground">TOP LOCATIONS</span>
    <span className="text-xs font-semibold text-muted-foreground">VISITS</span>
  </div>
  {locations.slice(0, 20).map((loc, index) => {
    const intensity = loc.count / Math.max(...locations.map(l => l.count))
    const sizeLabel = intensity > 0.7 ? 'High' : intensity > 0.3 ? 'Med' : 'Low'

    return (
      <div
        key={index}
        className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => onCountryClick?.(loc.code || '')}
      >
        {/* Larger, more visible indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div
            className="rounded-full bg-primary ring-2 ring-primary/20"
            style={{
              width: 8 + intensity * 8, // 8-16px diameter
              height: 8 + intensity * 8,
              opacity: 0.5 + intensity * 0.5
            }}
          />
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            intensity > 0.7
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : intensity > 0.3
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          }`}>
            {sizeLabel}
          </span>
        </div>

        {/* Country flag - larger */}
        <span className="text-xl flex-shrink-0">{getCountryFlag(loc.code || loc.country)}</span>

        {/* Location name - no truncate, wrap instead */}
        <span className="text-sm font-medium flex-1 min-w-0 break-words">
          {loc.name || loc.code}
        </span>

        {/* Visit count - more prominent */}
        <span className="text-sm font-bold text-foreground flex-shrink-0 min-w-[60px] text-right">
          {loc.count.toLocaleString()}
        </span>
      </div>
    )
  })}
</div>
```

##### Phase 2: Improve Map Legend (30 mins)
**File:** `src/components/admin/analytics/visitor-map.tsx`

```typescript
{/* Enhanced legend with better visibility */}
<div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border z-20 min-w-[200px]">
  <div className="font-semibold mb-3 text-sm">Visitor Intensity</div>
  <div className="space-y-2.5">
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary opacity-30 ring-2 ring-primary/20" />
      <div className="flex-1">
        <span className="text-sm font-medium">Low</span>
        <span className="text-xs text-muted-foreground ml-2">(1-33%)</span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-primary opacity-60 ring-2 ring-primary/30" />
      <div className="flex-1">
        <span className="text-sm font-medium">Medium</span>
        <span className="text-xs text-muted-foreground ml-2">(34-66%)</span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-primary ring-2 ring-primary/40" />
      <div className="flex-1">
        <span className="text-sm font-medium">High</span>
        <span className="text-xs text-muted-foreground ml-2">(67-100%)</span>
      </div>
    </div>
  </div>

  {/* Add toggle to switch legend view */}
  <button
    className="mt-3 text-xs text-primary hover:underline"
    onClick={() => setLegendExpanded(!legendExpanded)}
  >
    {legendExpanded ? 'Collapse' : 'Show percentages'}
  </button>
</div>
```

##### Phase 3: Add Filtering and Sorting (1 hour)
**File:** `src/components/admin/analytics/visitor-map.tsx`

```typescript
{/* Add controls above location list */}
<div className="flex items-center gap-2 mb-2">
  <Select value={sortBy} onValueChange={setSortBy}>
    <SelectTrigger className="w-[140px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="count-desc">Most Visits</SelectItem>
      <SelectItem value="count-asc">Least Visits</SelectItem>
      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
    </SelectContent>
  </Select>

  <Input
    placeholder="Filter locations..."
    value={filterText}
    onChange={(e) => setFilterText(e.target.value)}
    className="flex-1"
  />
</div>
```

#### Success Criteria
- [ ] Location names are fully visible (no truncation)
- [ ] Visit counts are prominently displayed
- [ ] Indicator dots are larger and easier to distinguish
- [ ] Legend circles are larger (6px, 7px, 8px minimum)
- [ ] Low/Medium/High labels clearly visible
- [ ] Can sort locations by different criteria
- [ ] Can filter locations by name
- [ ] Show more than 12 locations (expand to 20+)

---

### 4. OIDC Client Secret Field Indicator

**Severity:** Low
**Impact:** User confusion about saved state
**User Report:** "Did you double check the masked box for the OIDC thing I asked?"

#### Current State
**File:** `src/components/settings/authentication-tab.tsx` (lines 122-134)
- Field type is `password` (masks input)
- Placeholder says "Enter new secret to change"
- No visual indicator if secret is already saved
- User can't verify if secret is set without testing

#### Implementation Plan

##### Enhancement (30 mins)
**File:** `src/components/settings/authentication-tab.tsx`

```typescript
<div>
  <div className="flex items-center justify-between mb-1">
    <Label htmlFor="oidcClientSecret">Client Secret</Label>
    {settings.oidcClientSecret && (
      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Secret configured</span>
      </div>
    )}
  </div>
  <div className="relative">
    <Input
      id="oidcClientSecret"
      type="password"
      value={settings.oidcClientSecret}
      onChange={(e) => updateSetting('oidcClientSecret', e.target.value)}
      placeholder={settings.oidcClientSecret ? '••••••••••••••••' : 'Enter client secret'}
      autoComplete="off"
      className={settings.oidcClientSecret ? 'border-green-500/50' : ''}
    />
    {settings.oidcClientSecret && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      </div>
    )}
  </div>
  <p className="text-xs text-muted-foreground mt-1">
    {settings.oidcClientSecret
      ? 'Secret is saved. Enter new value to update, or leave blank to keep existing.'
      : 'OAuth Client Secret from your OIDC provider (required)'}
  </p>
</div>
```

**Additional Features:**
- [ ] "Show/Hide" toggle button to reveal secret temporarily
- [ ] Copy button to copy secret to clipboard (with confirmation)
- [ ] Last updated timestamp
- [ ] Validation indicator (checkmark when valid format)

#### Success Criteria
- [ ] Clear visual indicator when secret is saved
- [ ] User can toggle visibility of secret
- [ ] Help text explains that leaving blank keeps existing secret
- [ ] Green border/icon when secret is configured

---

## Medium Priority Enhancements

### 5. Dependency Updates

**Severity:** Medium
**Impact:** Security, performance, and feature improvements

#### Major Version Updates Required

##### Critical Security Updates
None identified by GitHub security scanning

##### Major Version Updates Available

| Package | Current | Latest | Breaking Changes? |
|---------|---------|--------|-------------------|
| @dnd-kit/sortable | 8.0.0 | 10.0.0 | Yes - API changes |
| better-sqlite3 | 9.6.0 | 12.6.2 | Yes - Node.js version requirements |
| drizzle-orm | 0.29.5 | 0.45.1 | Yes - API changes |
| nodemailer | 7.0.12 | 8.0.0 | Yes - Attachment handling |
| lucide-react | 0.309.0 | 0.563.0 | Possibly - icon names |
| react-markdown | 9.1.0 | 10.1.0 | Possibly - props changes |

##### Minor/Patch Updates (Safe)

| Package | Current | Latest |
|---------|---------|--------|
| @types/react | 19.2.10 | 19.2.11 |
| autoprefixer | 10.4.23 | 10.4.24 |
| lru-cache | 11.2.4 | 11.2.5 |
| maxmind | 5.0.3 | 5.0.5 |
| mysql2 | 3.16.1 | 3.16.3 |
| pg | 8.17.2 | 8.18.0 |
| shadcn | 3.7.0 | 3.8.2 |

#### Implementation Strategy

##### Phase 1: Safe Updates (30 mins)
```bash
npm update @types/react @types/node autoprefixer lru-cache maxmind mysql2 pg shadcn
npm test
```

##### Phase 2: Major Updates - Isolated Testing (2-3 hours each)

**@dnd-kit/sortable v8 → v10:**
1. Create feature branch: `upgrade/dnd-kit-v10`
2. Update package: `npm install @dnd-kit/sortable@10.0.0 @dnd-kit/core@latest @dnd-kit/utilities@latest`
3. Review migration guide: https://docs.dndkit.com/migration-guide
4. Update content-manager.tsx for API changes
5. Test all drag and drop functionality
6. Merge if tests pass

**drizzle-orm v0.29 → v0.45:**
1. Create feature branch: `upgrade/drizzle-v0.45`
2. Review changelog: https://github.com/drizzle-team/drizzle-orm/releases
3. Update imports and query patterns
4. Test all database operations
5. Run migrations
6. Verify GeoIP queries still work

**better-sqlite3 v9 → v12:**
1. Check Node.js version compatibility
2. May require Docker base image update
3. Test on development first
4. Verify performance improvements

**nodemailer v7 → v8:**
1. Review v8 changelog for breaking changes
2. Test email sending functionality
3. Verify attachment handling

#### Migration Testing Checklist
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing of affected features
- [ ] Performance benchmarking (no regressions)
- [ ] Docker build succeeds
- [ ] Production deployment dry-run

---

## Implementation Timeline

### Week 1: Critical Issues
**Days 1-2: OIDC Authentication**
- Implement hot-reload for OIDC settings
- Add comprehensive validation
- Create setup documentation
- Test with multiple providers

**Days 3-4: Drag and Drop**
- Update @dnd-kit libraries
- Debug current implementation
- Improve collision detection
- Enhanced visual feedback
- Comprehensive testing

**Day 5: Testing & Refinement**
- Integration testing
- User acceptance testing
- Bug fixes
- Documentation

### Week 2: High Priority Improvements
**Days 1-2: Analytics Map Visibility**
- Redesign location list
- Improve legend visibility
- Add filtering/sorting
- Testing

**Days 3-4: OIDC UI Enhancements**
- Add secret field indicators
- Show/hide toggle
- Copy functionality
- Testing

**Day 5: Safe Dependency Updates**
- Update minor versions
- Test all functionality
- Document changes

### Week 3: Major Dependency Updates
**One major update per day, with testing**
- Day 1: @dnd-kit/sortable v10
- Day 2: drizzle-orm v0.45
- Day 3: better-sqlite3 v12
- Day 4: nodemailer v8
- Day 5: Integration testing

---

## Risk Assessment

### High Risk Items

#### 1. OIDC Hot-Reload
**Risk:** Breaking existing authentication
**Mitigation:**
- Comprehensive testing with multiple providers
- Rollback plan (keep synchronous loading as fallback)
- Feature flag to enable/disable hot-reload

#### 2. Major Dependency Updates
**Risk:** Breaking changes causing application failures
**Mitigation:**
- Update one dependency at a time
- Test in isolated branches
- Maintain rollback versions in package.json
- Comprehensive test suite execution

#### 3. Drag and Drop Refactor
**Risk:** Introducing new bugs in core functionality
**Mitigation:**
- Thorough manual testing
- Test with different browsers
- Test with touch devices
- Video recording of test scenarios

### Medium Risk Items

#### 4. Analytics Map Redesign
**Risk:** Performance degradation with larger datasets
**Mitigation:**
- Maintain pagination/limiting
- Test with 100+ locations
- Monitor render performance
- Implement virtualization if needed

---

## Testing Strategy

### Automated Testing
1. **Unit Tests**: Core functionality in isolation
2. **Integration Tests**: API endpoints and database operations
3. **E2E Tests**: Critical user workflows

### Manual Testing Scenarios

#### OIDC Authentication Flow
1. Fresh installation → Configure OIDC → Test login
2. Existing installation → Update OIDC settings → Test without restart
3. Invalid configuration → Save → Verify validation errors
4. Multiple providers → Test each → Verify correct routing

#### Drag and Drop
1. Reorder within category → Verify persistence
2. Move between categories → Verify category change
3. Convert bookmark to service → Verify conversion
4. Drag multiple selected items → Verify all move
5. Touch device testing → Verify mobile functionality

#### Analytics Map
1. Load with 1 location → Verify display
2. Load with 50 locations → Verify performance
3. Filter locations → Verify filtering works
4. Sort by different criteria → Verify sorting
5. Click location → Verify zoom/highlight

---

## Success Metrics

### OIDC Authentication
- [ ] 100% success rate with supported providers
- [ ] Zero container restarts required for config changes
- [ ] < 2 seconds validation response time
- [ ] Clear error messages for all failure scenarios

### Drag and Drop
- [ ] 100% success rate for within-category reordering
- [ ] 100% success rate for between-category moves
- [ ] 100% success rate for bookmark ↔ service conversion
- [ ] < 500ms visual feedback delay

### Analytics Map
- [ ] All location names fully visible
- [ ] Legend elements clearly distinguishable
- [ ] < 1 second load time for 100 locations
- [ ] Filter/sort operations < 100ms

### Dependency Updates
- [ ] Zero breaking changes in production
- [ ] All tests passing
- [ ] No performance regressions
- [ ] Docker build < 5 minutes

---

## Rollback Procedures

### OIDC Hot-Reload
1. Revert `src/lib/auth.ts` changes
2. Revert `src/app/api/settings/route.ts` changes
3. Add note in UI: "Restart required after OIDC changes"
4. Deploy rollback
5. Notify users

### Drag and Drop
1. Revert to @dnd-kit/sortable v8.0.0
2. Revert content-manager.tsx changes
3. Test basic functionality
4. Deploy rollback

### Dependency Updates
1. Restore previous package.json
2. Delete node_modules and package-lock.json
3. Run `npm install`
4. Test affected functionality
5. Deploy rollback

---

## Post-Implementation Review

### Week 4: Review & Optimization
1. Gather user feedback
2. Monitor error logs
3. Performance profiling
4. Identify optimization opportunities
5. Plan next iteration

### Documentation Updates
- [ ] Update README.md
- [ ] Update CHANGELOG.md
- [ ] Update deployment documentation
- [ ] Create troubleshooting guide
- [ ] Update API documentation

---

## Appendix

### A. Current Technology Stack
- **Frontend**: React 19, Next.js 16, TypeScript 5
- **UI Components**: Radix UI, Tailwind CSS, Lucide Icons
- **Database**: SQLite (better-sqlite3), Drizzle ORM
- **Authentication**: NextAuth.js v4
- **Drag & Drop**: @dnd-kit v8

### B. Development Environment
- **Node.js**: v20.x
- **Package Manager**: npm
- **Deployment**: Docker
- **CI/CD**: GitHub Actions

### C. Contact & Resources
- **GitHub Issues**: https://github.com/sdenike/fauxdash/issues
- **Documentation**: `/docs` directory
- **Changelog**: `/CHANGELOG.md`

---

**Document Version Control:**
- v1.0 (2026-02-04): Initial comprehensive plan created
- Next Review: After Week 1 completion
