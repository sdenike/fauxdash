---
title: Open All Button Not Tracking Clicks in Analytics
category: logic-errors
tags: [analytics, click-tracking, bookmarks, services, bulk-operations]
module: src/components/category-section.tsx, src/components/services-section.tsx
symptoms:
  - "Open all in new tabs" doesn't count clicks in analytics
  - Individual clicks tracked but bulk open is not
  - Analytics data incomplete for categories using Open All
severity: low
date_solved: 2026-03-04
version_fixed: 0.12.3
---

# Open All Button Not Tracking Clicks in Analytics

## Problem

When using the "Open all in new tabs" button for bookmark or service categories, clicks were not recorded in analytics. Individual link clicks were tracked correctly, but the bulk open feature bypassed tracking entirely.

## Root Cause

The `handleOpenAll` function in both `category-section.tsx` and `services-section.tsx` only called `window.open()` for each URL. It never called the click tracking API endpoints (`/api/bookmarks/{id}/click` and `/api/services/{id}/click`) that the individual click handlers use.

```typescript
// BEFORE (broken) — opens tabs but doesn't track
const handleOpenAll = (e: React.MouseEvent) => {
  const urls = category.bookmarks.map(b => b.url)
  for (let i = 0; i < urls.length; i++) {
    window.open(urls[i], '_blank', 'noopener,noreferrer')
  }
}
```

## Solution

Added fire-and-forget fetch calls for each item before opening tabs:

```typescript
// category-section.tsx — bookmarks
category.bookmarks.forEach(bookmark => {
  fetch(`/api/bookmarks/${bookmark.id}/click`, { method: 'POST' })
    .catch(err => console.error('Failed to track click:', err))
})

// services-section.tsx — services
category.services?.forEach(service => {
  fetch(`/api/services/${service.id}/click`, { method: 'POST' })
    .catch(err => console.error('Failed to track click:', err))
})
```

Tracking calls are non-blocking and don't affect tab opening if they fail.

## Prevention

When adding bulk action variants of individually-tracked operations, ensure the bulk action also triggers tracking for each item. A checklist for new bulk features:

1. Does the individual action have analytics tracking? If yes, the bulk action must too.
2. Are the tracking calls fire-and-forget? They should not block the primary action.
3. Do errors in tracking silently degrade? They should log but not break functionality.

## Related

- [CHANGELOG v0.12.3](../../CHANGELOG.md) — Release notes
- [DECISIONS.md — Analytics](../DECISIONS.md) — Analytics architecture decisions
