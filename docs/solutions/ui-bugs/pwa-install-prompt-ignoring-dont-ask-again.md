---
title: PWA Install Prompt Dismissal Not Respected After Service Worker Update
category: ui-bugs
tags: [pwa, service-worker, localStorage, event-handler, beforeinstallprompt]
module: src/components/pwa-install-prompt.tsx
symptoms:
  - Admin dashboard keeps showing "Install Faux|Dash" prompt after clicking "Don't ask again"
  - Prompt reappears after service worker update despite permanent dismissal
  - beforeinstallprompt event re-fires and bypasses initial dismiss checks
severity: medium
date_solved: 2026-03-04
version_fixed: 0.12.3
---

# PWA Install Prompt Ignoring "Don't Ask Again"

## Problem

The PWA install prompt kept reappearing on the admin dashboard even after clicking "Don't ask again," which sets `localStorage['pwa-prompt-permanent-dismiss'] = 'true'`.

## Root Cause

The `beforeinstallprompt` event handler unconditionally showed the prompt after a 3-second delay without re-checking dismiss state:

```typescript
// BEFORE (broken) — no dismiss check in event handler
const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault()
  setDeferredPrompt(e as BeforeInstallPromptEvent)
  setTimeout(() => setShowPrompt(true), 3000) // always shows
}
```

The dismiss checks only ran once during the initial `useEffect`. When the service worker updates (`skipWaiting: true` + `clientsClaim`), the browser re-fires `beforeinstallprompt`. The existing event listener picks it up and shows the prompt again, bypassing all localStorage checks.

## Solution

Extracted dismiss checks into a reusable `shouldSuppress()` helper and called it inside the event handler:

```typescript
const shouldSuppress = () => {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if (localStorage.getItem('pwa-prompt-permanent-dismiss') === 'true') return true
  if (sessionStorage.getItem('pwa-prompt-shown')) return true
  const dismissedAt = localStorage.getItem('pwa-prompt-dismissed')
  if (dismissedAt) {
    const dismissedDate = new Date(dismissedAt)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    if (dismissedDate > thirtyDaysAgo) return true
  }
  return false
}

// Used in BOTH the initial useEffect AND the event handler
const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault()
  setDeferredPrompt(e as BeforeInstallPromptEvent)
  if (shouldSuppress()) return // re-check before showing
  setTimeout(() => setShowPrompt(true), 3000)
}
```

Also added `sessionStorage.setItem('pwa-prompt-shown', 'true')` to `handlePermanentDismiss` as a belt-and-suspenders guard.

## Prevention

When registering long-lived event listeners that trigger UI changes, always re-check dismissal/suppression state inside the handler — not just at registration time. Browser events like `beforeinstallprompt` can re-fire due to service worker lifecycle events.

## Related

- [CHANGELOG v0.12.3](../../CHANGELOG.md) — Release notes
- [DECISIONS.md — PWA Support](../DECISIONS.md) — Architecture decision
- [settings-not-persisting.md](./settings-not-persisting.md) — Related localStorage/persistence patterns
