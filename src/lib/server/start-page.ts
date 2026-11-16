import { cache } from 'react'
import { access } from 'fs/promises'
import { join } from 'path'
import { getServerSession, type Session } from 'next-auth'
import { asc, count, eq, inArray, isNull, or } from 'drizzle-orm'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { bookmarks, categories, serviceCategories, services, settings, users } from '@/db/schema'
import { cacheGet, cacheSet } from '@/lib/redis'

/*
  Everything the start page and the root layout need, read once per request on the server, so the
  first paint is already right: the signed-in header, the theme, the background, the columns. Nothing
  here is fetched again from the browser. React cache() dedupes calls between the layout and the page.
*/

export const getSession = cache(async (): Promise<Session | null> => getServerSession(authOptions))

export const needsSetup = cache(async (): Promise<boolean> => {
  try {
    const result = await getDb().select({ count: count() }).from(users)
    return (result[0]?.count || 0) === 0
  } catch {
    return false
  }
})

// Settings that a user row must never override (same list as /api/settings).
const GLOBAL_ONLY_KEYS = new Set([
  'oidcEnabled', 'oidcProviderName', 'oidcClientId', 'oidcClientSecret', 'oidcIssuerUrl',
  'disablePasswordLogin', 'smtpProvider', 'smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword',
  'smtpEncryption', 'smtpFromEmail', 'smtpFromName', 'smtpVerified', 'geoipEnabled', 'geoipProvider',
  'geoipMaxmindPath', 'geoipMaxmindLicenseKey', 'geoipMaxmindAccountId', 'geoipIpinfoToken',
  'geoipCacheDuration',
])

/** Raw key/value settings: global rows, overlaid with the signed-in user's own rows. */
export const getSettingsMap = cache(async (userId: number | null): Promise<Record<string, string>> => {
  const db = getDb()
  const rows = await db
    .select()
    .from(settings)
    .where(userId ? or(isNull(settings.userId), eq(settings.userId, userId)) : isNull(settings.userId))

  const map: Record<string, string> = {}
  for (const row of rows as any[]) if (row.userId === null) map[row.key] = row.value || ''
  for (const row of rows as any[]) {
    if (row.userId !== null && !GLOBAL_ONLY_KEYS.has(row.key)) map[row.key] = row.value || ''
  }
  return map
})

export type ThemeMode = 'light' | 'dark' | 'system'
export type Density = 'compact' | 'comfortable'

export interface StartPageSettings {
  defaultTheme: ThemeMode
  siteTitle: string
  siteTitleEnabled: boolean
  headerLogo: { src: string; position: 'left' | 'right'; height: number } | null
  search: { enabled: boolean; inHeader: boolean; engine: string; customName: string; customUrl: string }
  welcome: {
    enabled: boolean
    message: string
    timeBased: boolean
    morning: string
    afternoon: string
    evening: string
  }
  dateTime: {
    enabled: boolean
    position: 'left' | 'center' | 'right'
    displayMode: 'text' | 'icon'
    dateFormat: string
    timeEnabled: boolean
    timeFormat: '12' | '24'
    showSeconds: boolean
  }
  weather: { enabled: boolean; displayMode: 'icon' | 'temp' | 'both'; showPopup: boolean; locations: string[] }
  sectionOrder: 'services-first' | 'bookmarks-first'
  density: Density
  columns: number
  showDescriptions: boolean
  background: { mode: 'cover' | 'contain' | 'center' | 'tile'; opacity: number; version: string; showLoggedOut: boolean } | null
  homepage: {
    descriptionEnabled: boolean
    description: string
    graphic: { path: string; maxWidth: number; hAlign: 'left' | 'center' | 'right'; position: 'above' | 'below'; hideWhenLoggedIn: boolean } | null
  }
}

const bool = (value: string | undefined, fallback: boolean) =>
  value === undefined || value === '' ? fallback : value === 'true'

const int = (value: string | undefined, fallback: number) => {
  const n = parseInt(value || '', 10)
  return Number.isFinite(n) ? n : fallback
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value || '') ? (value as T) : fallback
}

const BACKGROUND_FILE =
  process.env.NODE_ENV === 'production'
    ? '/data/site-assets/background-image.webp'
    : join(process.cwd(), 'public', 'site-assets', 'background-image.webp')

async function fileExists(path: string) {
  return access(path).then(() => true, () => false)
}

function resolveLogoSrc(path: string, type: string): string {
  if (!path) return ''
  if (type === 'upload') return '/api/header-logo/serve'
  if (path.startsWith('favicon:')) {
    const p = path.replace('favicon:', '')
    return p.startsWith('/api/favicons/serve/') ? p : `/api/favicons/serve/${p}`
  }
  return path
}

/**
 * Density replaced the per-section icon size, font size and spacing settings (v0.14.0). A saved
 * density wins; otherwise the old icon size decides, so an existing install keeps roughly its look.
 */
function resolveDensity(map: Record<string, string>): Density {
  if (map.density === 'compact' || map.density === 'comfortable') return map.density
  const legacyIcon = int(map.bookmarksIconSize, 32)
  return legacyIcon <= 24 ? 'compact' : 'comfortable'
}

export const getStartPageSettings = cache(async (userId: number | null): Promise<StartPageSettings> => {
  const map = await getSettingsMap(userId)

  const logoType = map.headerLogoType || (map.headerLogoPath ? 'upload' : 'none')
  const logoSrc = bool(map.headerLogoEnabled, false) && logoType !== 'none'
    ? resolveLogoSrc(map.headerLogoPath || '', logoType)
    : ''

  const hasBackground = !!map.backgroundImage && (await fileExists(BACKGROUND_FILE))

  return {
    defaultTheme: pick(map.defaultTheme || process.env.DEFAULT_THEME, ['light', 'dark', 'system'] as const, 'system'),
    siteTitle: map.siteTitle || 'Faux|Dash',
    siteTitleEnabled: bool(map.siteTitleEnabled, true),
    headerLogo: logoSrc
      ? {
          src: logoSrc,
          position: pick(map.headerLogoPosition, ['left', 'right'] as const, 'left'),
          height: Math.min(Math.max(int(map.headerLogoHeight, 32), 16), 64),
        }
      : null,
    search: {
      enabled: bool(map.searchEnabled, true),
      inHeader: bool(map.searchInHeader, false),
      engine: map.searchEngine || process.env.DEFAULT_SEARCH_ENGINE || 'duckduckgo',
      customName: map.customSearchName || 'Custom search',
      customUrl: map.customSearchUrl || '',
    },
    welcome: {
      enabled: bool(map.welcomeMessageEnabled, true),
      message: map.welcomeMessage || 'Welcome back',
      timeBased: bool(map.welcomeMessageTimeBased, false),
      morning: map.welcomeMessageMorning || 'Good morning',
      afternoon: map.welcomeMessageAfternoon || 'Good afternoon',
      evening: map.welcomeMessageEvening || 'Good evening',
    },
    dateTime: {
      enabled: bool(map.dateTimeEnabled, false),
      position: pick(map.dateTimePosition, ['left', 'center', 'right'] as const, 'left'),
      displayMode: pick(map.dateTimeDisplayMode, ['text', 'icon'] as const, 'text'),
      dateFormat: map.dateFormat || 'EEEE, MMMM d, yyyy',
      timeEnabled: bool(map.timeEnabled, false),
      timeFormat: pick(map.timeFormat, ['12', '24'] as const, '12'),
      showSeconds: bool(map.showSeconds, false),
    },
    weather: {
      enabled: bool(map.weatherEnabled, false),
      displayMode: pick(map.weatherDisplayMode, ['icon', 'temp', 'both'] as const, 'both'),
      showPopup: bool(map.weatherShowPopup, true),
      locations: (map.weatherLocations || process.env.WEATHER_LOCATIONS || '')
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
    },
    sectionOrder: pick(map.sectionOrder, ['services-first', 'bookmarks-first'] as const, 'services-first'),
    density: resolveDensity(map),
    columns: Math.min(Math.max(int(map.columns || map.bookmarksColumns || map.mainColumns, 4), 1), 6),
    showDescriptions: bool(map.showDescriptions, false),
    background: hasBackground
      ? {
          mode: pick(map.backgroundDisplayMode, ['cover', 'contain', 'center', 'tile'] as const, 'cover'),
          opacity: Math.min(Math.max(int(map.backgroundOpacity, 100), 0), 100),
          // Changes when the image is replaced, so the browser cache is used until then.
          version: map.backgroundImage,
          showLoggedOut: map.backgroundShowLoggedOut === 'true',
        }
      : null,
    homepage: {
      descriptionEnabled: bool(map.homepageDescriptionEnabled, false),
      description: map.homepageDescription || '',
      graphic:
        bool(map.homepageGraphicEnabled, false) && map.homepageGraphicPath
          ? {
              path: map.homepageGraphicPath,
              maxWidth: int(map.homepageGraphicMaxWidth, 200),
              hAlign: pick(map.homepageGraphicHAlign, ['left', 'center', 'right'] as const, 'center'),
              position: pick(map.homepageGraphicPosition, ['above', 'below'] as const, 'above'),
              hideWhenLoggedIn: bool(map.homepageGraphicHideWhenLoggedIn, false),
            }
          : null,
    },
  }
})

type SortBy = 'name_asc' | 'name_desc' | 'clicks_asc' | 'clicks_desc' | 'order'

export function sortItems<T extends { name?: string | null; clickCount?: number | null; order?: number | null }>(
  items: T[],
  sortBy: string | null | undefined,
): T[] {
  const sorted = [...items]
  switch ((sortBy || 'order') as SortBy) {
    case 'name_asc':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    case 'name_desc':
      return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    case 'clicks_asc':
      return sorted.sort((a, b) => (a.clickCount || 0) - (b.clickCount || 0))
    case 'clicks_desc':
      return sorted.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
    default:
      return sorted.sort((a, b) => (a.order || 0) - (b.order || 0))
  }
}

/** Visible bookmark categories with their visible bookmarks. Shared with GET /api/categories. */
export async function loadBookmarkCategories(session: Session | null): Promise<any[]> {
  const cacheKey = session ? `categories:auth:${session.user?.email}` : 'categories:public'
  const cached = await cacheGet(cacheKey)
  if (cached) return cached as any[]

  const db = getDb()
  const visible = (row: any) => row.isVisible && (session || !row.requiresAuth)

  const cats = (await db.select().from(categories).orderBy(asc(categories.order))).filter(visible)
  const ids = cats.map((c: any) => c.id)
  const items = ids.length
    ? (await db.select().from(bookmarks).where(inArray(bookmarks.categoryId, ids))).filter(visible)
    : []

  const byCategory = new Map<number, any[]>()
  for (const item of items as any[]) {
    const list = byCategory.get(item.categoryId) || []
    list.push(item)
    byCategory.set(item.categoryId, list)
  }

  const result = cats.map((cat: any) => ({ ...cat, bookmarks: sortItems(byCategory.get(cat.id) || [], cat.sortBy) }))
  await cacheSet(cacheKey, result, 300)
  return result
}

/** Visible service categories with their visible services. Shared with GET /api/service-categories. */
export async function loadServiceCategories(session: Session | null): Promise<any[]> {
  const cacheKey = session ? `service-categories:auth:${session.user?.email}` : 'service-categories:public'
  const cached = await cacheGet(cacheKey)
  if (cached) return cached as any[]

  const db = getDb()
  const visible = (row: any) => row.isVisible && (session || !row.requiresAuth)

  const cats = (await db.select().from(serviceCategories).orderBy(asc(serviceCategories.order))).filter(visible)
  const ids = cats.map((c: any) => c.id)
  const items = ids.length
    ? (await db.select().from(services).where(inArray(services.categoryId, ids))).filter(visible)
    : []

  const byCategory = new Map<number, any[]>()
  for (const item of items as any[]) {
    const list = byCategory.get(item.categoryId) || []
    list.push(item)
    byCategory.set(item.categoryId, list)
  }

  const result = cats.map((cat: any) => ({ ...cat, services: sortItems(byCategory.get(cat.id) || [], cat.sortBy) }))
  await cacheSet(cacheKey, result, 300)
  return result
}

