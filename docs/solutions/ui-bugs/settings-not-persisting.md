---
title: "Settings Not Persisting After Page Reload"
category: ui-bugs
tags:
  - settings-persistence
  - api-handlers
  - drizzle-orm
  - next-js-api-routes
  - redis-configuration
module: admin-settings
symptoms:
  - Settings reset to defaults after page reload
  - POST handler silently ignoring setting values
  - New settings tab works in UI but values don't save
severity: medium
date: 2026-02-17
version: 0.12.2
---

# Settings Not Persisting After Page Reload

## Problem

When adding new settings to the admin UI (e.g., Redis cache settings), the settings appear to save but reset to defaults after page reload. The UI shows success toast, but values are not actually persisted to the database.

## Symptoms

- Settings can be changed in the UI
- "Settings saved" success message appears
- Page reload shows default values instead of saved values
- No errors in browser console or server logs

## Root Cause

The settings API uses a key-value store pattern where each setting must be explicitly handled in **5 locations**. When new settings are added to the UI, developers often update only 2-3 locations, causing the silent failure.

### The 5 Required Locations

| # | Location | File | Purpose |
|---|----------|------|---------|
| 1 | Type Definition | `src/components/settings/types.ts` | `Settings` interface |
| 2 | Default Values | `src/components/settings/types.ts` | `defaultSettings` object |
| 3 | GET Handler | `src/app/api/settings/route.ts` | Return settings to client |
| 4 | POST Handler | `src/app/api/settings/route.ts` | Save settings to database |
| 5 | Global Keys | `src/app/api/settings/route.ts` | `globalSettingKeys` array (if global) |

In the Redis settings case, locations 1, 2, and the UI component were created, but locations 3, 4, and 5 were missed.

## Solution

### 1. Add to POST Handler

In `src/app/api/settings/route.ts`, add save logic for each new setting:

```typescript
// Redis settings
if (body.redisEnabled !== undefined) settingsToSave.push({ key: 'redisEnabled', value: body.redisEnabled.toString() });
if (body.redisHost !== undefined) settingsToSave.push({ key: 'redisHost', value: body.redisHost || 'localhost' });
if (body.redisPort !== undefined) settingsToSave.push({ key: 'redisPort', value: body.redisPort.toString() });
if (body.redisPassword !== undefined) settingsToSave.push({ key: 'redisPassword', value: body.redisPassword || '' });
if (body.redisDatabase !== undefined) settingsToSave.push({ key: 'redisDatabase', value: body.redisDatabase.toString() });
```

### 2. Add to GET Handler Response

Return the settings with proper type conversion:

```typescript
// Redis settings
redisEnabled: settingsObj.redisEnabled === 'true' || false,
redisHost: settingsObj.redisHost || 'localhost',
redisPort: parseInt(settingsObj.redisPort || '6379'),
redisPassword: settingsObj.redisPassword || '',
redisDatabase: parseInt(settingsObj.redisDatabase || '0'),
```

### 3. Add to globalSettingKeys (if applicable)

If the setting should be shared across all users (not per-user), add to the array:

```typescript
const globalSettingKeys = [
  // ... existing keys ...
  'redisEnabled', 'redisHost', 'redisPort', 'redisPassword', 'redisDatabase',
];
```

## Type Conversion Rules

Settings are stored as strings in SQLite. Apply these conversions:

| Type | Saving (POST) | Loading (GET) |
|------|---------------|---------------|
| boolean | `.toString()` | `=== 'true'` |
| number | `.toString()` | `parseInt(value \|\| 'default')` |
| string | as-is or `\|\| ''` | `\|\| 'default'` |

## Verification

After applying the fix:

1. Change the setting in the UI
2. Click Save
3. Refresh the page
4. Verify the setting persists

## Prevention Checklist

When adding new settings, verify all locations are updated:

```markdown
## Settings PR Checklist

### types.ts
- [ ] Property added to `Settings` interface
- [ ] Default value added to `defaultSettings`

### route.ts GET Handler
- [ ] Setting returned in response object
- [ ] Correct type conversion applied
- [ ] Default value matches `defaultSettings`

### route.ts POST Handler
- [ ] `if (body.settingName !== undefined)` block added
- [ ] Correct serialization (`.toString()` for booleans/numbers)

### Global Settings (if applicable)
- [ ] Key added to `globalSettingKeys` array

### Testing
- [ ] Save/reload cycle verified manually
```

## Related Files

- `src/components/settings/types.ts` - Settings interface and defaults
- `src/app/api/settings/route.ts` - API handlers
- `src/lib/settings-cache.ts` - Settings cache (30s TTL)
- `src/app/admin/settings/page.tsx` - Settings UI page

## See Also

- [PROJECT_STRUCTURE.md](../../PROJECT_STRUCTURE.md) - Database schema details
- [DECISIONS.md](../../DECISIONS.md) - Architecture decisions on settings storage
