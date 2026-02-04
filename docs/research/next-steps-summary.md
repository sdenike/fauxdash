# Next Steps Summary

**Date:** 2026-02-04
**Current Version:** v0.9.17
**Status:** OIDC Complete, Ready for Next Phase

---

## ✅ Completed: OIDC Authentication (v0.9.16-0.9.17)

### What Was Delivered
- ✅ Hot-reload without container restart
- ✅ Automatic settings reload
- ✅ Enhanced configuration testing
- ✅ Real authentication flow testing
- ✅ Comprehensive error logging
- ✅ Detailed setup documentation

### Documentation Created
- ✅ `docs/OIDC-SETUP-GUIDE.md` - Complete setup guide
- ✅ `docs/research/oidc-hot-reload-implementation.md` - Technical details
- ✅ `docs/research/comprehensive-feature-plan.md` - Full project roadmap

### Testing Status
🟡 **Awaiting User Testing**
- User will test with PocketID after v0.9.17 deployment
- GitHub Issue #10 should be resolved

---

## 🔍 Security Review Complete

### Findings
- **2 Open Vulnerabilities:**
  - 🔴 HIGH: d3-color@2.0.0 ReDoS (affects analytics/charts)
  - 🟡 MEDIUM: esbuild@0.18.20 (dev only, low risk)

- **29 Fixed Vulnerabilities:**
  - All Next.js, tar, and other vulnerabilities resolved

### Recommendation
Address d3-color after OIDC testing (3-5 hours estimated)

**Documentation:** `docs/research/security-vulnerabilities-2026-02-04.md`

---

## 📋 Priority Queue

Based on comprehensive plan review, here's the recommended order:

### 1. 🔥 CRITICAL: Drag & Drop Fixes (Next Up)
**Status:** Not Working
**User Impact:** High (core functionality broken)
**Estimated Time:** 3-4 hours
**Priority:** IMMEDIATE

**Issues:**
- Can't reorder bookmarks within category
- Can't reorder services within category
- Can't move items between categories
- Can't convert between bookmark ↔ service

**Root Causes:**
- Outdated @dnd-kit/sortable (v8.0.0 → v10.0.0)
- Collision detection may need tuning
- Activation constraints may be too sensitive

**Implementation Plan:**
1. Update @dnd-kit libraries to v10.0.0
2. Test different collision detection strategies
3. Adjust activation constraints
4. Enhanced visual feedback
5. Comprehensive testing

**Success Criteria:**
- Items reorder within categories
- Items move between categories
- Items convert by dragging to different type
- Visual feedback is clear
- Changes persist

---

### 2. 🎨 HIGH: Analytics Map Visibility
**Status:** Working but hard to see
**User Impact:** Medium (usability issue)
**Estimated Time:** 2-3 hours

**Issues:**
- City names truncate
- Low/Medium/High legend hard to see
- Small indicator dots (2px)
- Limited to 12 items

**Proposed Fixes:**
- Larger indicator dots (8-16px)
- Badge labels (Low/Med/High) with colors
- No truncation (wrap text instead)
- Show 20+ locations with scroll
- Filtering and sorting options
- Improved legend with percentages

---

### 3. 🔒 MEDIUM: Security Vulnerability Updates
**Status:** 2 open vulnerabilities
**User Impact:** Low (ReDoS requires crafted input)
**Estimated Time:** 3-5 hours

**Actions:**
- Update react-simple-maps (d3-color fix)
- Update recharts (d3-color fix)
- Test analytics and charts
- Monitor drizzle-kit for esbuild update

---

### 4. 🔧 LOW: OIDC Client Secret UI Enhancement
**Status:** Working but could be better
**User Impact:** Low (nice-to-have)
**Estimated Time:** 30 minutes

**Proposed:**
- Show/hide toggle
- Copy button
- Visual indicator when set
- Green border when configured

---

### 5. 📦 MAINTENANCE: Major Dependency Updates
**Status:** Multiple major versions behind
**User Impact:** Low (if working, don't break)
**Estimated Time:** 2-3 hours per dependency

**Packages:**
- @dnd-kit/sortable: 8.0.0 → 10.0.0 (part of drag fix)
- drizzle-orm: 0.29.5 → 0.45.1
- better-sqlite3: 9.6.0 → 12.6.2
- nodemailer: 7.0.12 → 8.0.0

**Approach:** One at a time, with testing

---

## 🎯 Recommended Next Action

### Option A: Fix Drag & Drop (Recommended)
**Why:**
- Core functionality broken
- User reported issue
- High impact on usability
- Clear implementation path

**Timeline:**
- Research/Update: 1 hour
- Implementation: 2 hours
- Testing: 1 hour
- **Total: 4 hours**

**Deliverable:** v0.9.18 with working drag & drop

---

### Option B: Wait for OIDC Testing
**Why:**
- Verify OIDC works before moving on
- User may find additional OIDC issues
- Could need quick fixes

**Timeline:**
- Wait for user feedback
- Address any OIDC issues
- Then proceed to drag & drop

**Risk:** User may not test immediately

---

### Option C: Parallel Approach
**Why:**
- Fix drag & drop while user tests OIDC
- Efficient use of time
- User tests OIDC, we fix drag & drop

**Timeline:**
- Implement drag & drop fixes
- Release v0.9.18
- User tests both OIDC and drag & drop
- Address any issues found

**Advantage:** Maximum velocity

---

## 🚀 Proposed: Drag & Drop Implementation

### Phase 1: Library Updates (30 mins)
```bash
npm install @dnd-kit/core@latest @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@latest
npm run build
# Check for breaking changes
```

### Phase 2: Debug Current Implementation (1 hour)
**File:** `src/components/admin/content-manager.tsx`

- Add debug logging to drag handlers
- Verify `activeId` is set correctly
- Check `over` is not null on drop
- Test collision detection
- Verify SortableContext items array

### Phase 3: Collision Detection Improvements (1 hour)
Try alternatives to `closestCorners`:
- `closestCenter` - Better for grid layouts
- `rectIntersection` - Better for overlapping
- `pointerWithin` - More forgiving

### Phase 4: Enhanced Visual Feedback (30 mins)
- Increase dragged item opacity (0.5 → 0.7)
- Make drag handle more prominent
- Add drop zone highlighting
- Show cursor feedback

### Phase 5: Testing (1 hour)
- Reorder within category
- Move between categories
- Convert bookmark → service
- Convert service → bookmark
- Test with mouse and touch
- Verify persistence

---

## 📊 Metrics for Success

### Drag & Drop
- [ ] 100% success rate for within-category reordering
- [ ] 100% success rate for between-category moves
- [ ] 100% success rate for type conversion
- [ ] < 500ms visual feedback delay
- [ ] Works on desktop (mouse) and tablet (touch)

### OIDC (Already Complete)
- [x] Zero container restarts required
- [x] Clear error messages
- [x] Test button works
- [x] Comprehensive logging
- [ ] User confirms PocketID works (pending)

---

## 🗓️ Estimated Timeline

### This Week
- **Day 1-2:** User tests OIDC (v0.9.17)
- **Day 2-3:** Fix drag & drop → v0.9.18
- **Day 4:** User tests drag & drop
- **Day 5:** Address any issues found

### Next Week
- **Day 1-2:** Analytics map visibility improvements → v0.9.19
- **Day 3-4:** Security vulnerability updates → v0.9.20
- **Day 5:** Testing and documentation

---

## 💬 User Confirmation Needed

**Question:** Should we proceed with drag & drop fixes now, or wait for your OIDC testing results first?

**Option 1 (Recommended):** Start drag & drop now
- Pro: Efficient, both issues fixed by end of week
- Con: Two things to test at once

**Option 2:** Wait for OIDC feedback first
- Pro: Focus on one thing at a time
- Con: Slower overall progress

**Option 3:** Fix something else first
- What would you prefer as next priority?

---

## 📝 Notes

### Current State
- ✅ All code committed and pushed
- ✅ v0.9.17 tagged and ready
- ✅ Documentation complete
- ✅ Logging enhanced
- 🟡 Awaiting OIDC user testing

### What's Ready
- Docker image: `ghcr.io/sdenike/fauxdash:0.9.17`
- Setup guide: `docs/OIDC-SETUP-GUIDE.md`
- Comprehensive logging for debugging
- Two test buttons (config + auth flow)

### Blockers
None! Ready to proceed with next feature.

---

**Awaiting user direction on next steps! 🎯**
