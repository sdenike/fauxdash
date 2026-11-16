'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { LogIn, LogOut, Moon, Settings, Sun } from 'lucide-react'
import { DateTimeDisplay } from '@/components/date-time-display'
import { CompactWeather } from '@/components/start/compact-weather'
import { SearchBar, type SearchConfig } from '@/components/start/search-bar'
import type { StartPageSettings } from '@/lib/server/start-page'

export interface HeaderUser {
  name: string
  isAdmin: boolean
}

interface SiteHeaderProps {
  user: HeaderUser | null
  siteTitle: string
  siteTitleEnabled: boolean
  logo: StartPageSettings['headerLogo']
  search: (SearchConfig & { show: boolean }) | null
  dateTime: StartPageSettings['dateTime'] | null
  weather: StartPageSettings['weather'] | null
}

const iconButton =
  'inline-flex h-9 w-9 coarse:h-11 coarse:w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'

/** Light/dark switch. Both icons are in the markup and CSS shows the right one, so it never flips after load. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={iconButton}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      <Moon className="h-[18px] w-[18px] dark:hidden" aria-hidden="true" />
      <Sun className="hidden h-[18px] w-[18px] dark:block" aria-hidden="true" />
    </button>
  )
}

/**
 * Start-page header. Everything it shows arrives as props from the server, so a signed-in visitor
 * sees the signed-in header on the first paint.
 */
export function SiteHeader({ user, siteTitle, siteTitleEnabled, logo, search, dateTime, weather }: SiteHeaderProps) {
  const clock = (where: 'left' | 'center' | 'right', className?: string) =>
    dateTime && dateTime.position === where ? (
      <div className={className}>
        <DateTimeDisplay
          dateFormat={dateTime.dateFormat}
          timeEnabled={dateTime.timeEnabled}
          timeFormat={dateTime.timeFormat}
          showSeconds={dateTime.showSeconds}
          displayMode={dateTime.displayMode}
        />
      </div>
    ) : null

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 pt-safe backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="px-gutter mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 py-2.5 md:flex-nowrap">
        <div className="flex min-w-0 items-center gap-4">
          {(siteTitleEnabled || logo) && (
            <Link
              href="/"
              className={`flex min-w-0 items-center gap-2.5 rounded-md ${logo?.position === 'right' ? 'flex-row-reverse' : ''}`}
            >
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.src} alt={siteTitleEnabled ? '' : siteTitle} style={{ height: logo.height }} className="w-auto object-contain" />
              )}
              {siteTitleEnabled && (
                <span className="truncate text-base font-semibold tracking-tight text-foreground">{siteTitle}</span>
              )}
            </Link>
          )}
          {weather && <CompactWeather {...weather} />}
          {clock('left', 'hidden sm:block')}
        </div>

        <div className="order-last flex w-full flex-1 items-center justify-center gap-4 md:order-none md:w-auto">
          {search?.show && <SearchBar config={search} className="md:max-w-xl" />}
          {clock('center', 'hidden md:block')}
        </div>

        <nav aria-label="Account" className="ml-auto flex items-center gap-1">
          {clock('right', 'mr-2 hidden md:block')}
          <ThemeToggle />
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className={iconButton} aria-label="Admin" title="Admin">
                  <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className={iconButton}
                aria-label={`Sign out ${user.name}`}
                title="Sign out"
              >
                <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 coarse:h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
