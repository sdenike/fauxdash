'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Button } from './ui/button'
import {
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { SearchBar } from './search-bar'
import { DateTimeDisplay } from './date-time-display'

// Inline compact weather component with hover details
function CompactWeather() {
  const [weather, setWeather] = useState<any>(null)
  const [enabled, setEnabled] = useState(false)
  const [displayMode, setDisplayMode] = useState<'icon' | 'temp' | 'both'>('both')
  const [showPopup, setShowPopup] = useState(true)

  useEffect(() => {
    const fetchWeatherSettings = async () => {
      try {
        const settingsRes = await fetch('/api/settings')
        const settings = await settingsRes.json()

        if (settings.weatherEnabled) {
          setEnabled(true)
          setDisplayMode(settings.weatherDisplayMode || 'both')
          setShowPopup(settings.weatherShowPopup !== false)
          const locations = settings.weatherLocations?.split(',').map((l: string) => l.trim()) || []
          if (locations[0]) {
            const weatherRes = await fetch(`/api/weather?location=${encodeURIComponent(locations[0])}`)
            const data = await weatherRes.json()
            if (!data.error) {
              setWeather(data)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      }
    }
    fetchWeatherSettings()
  }, [])

  if (!enabled || !weather) return null

  const showIcon = displayMode === 'icon' || displayMode === 'both'
  const showTemp = displayMode === 'temp' || displayMode === 'both'

  return (
    <div className={showPopup ? "relative group" : ""}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
        {showIcon && weather.icon && (
          <img src={weather.icon} alt="" className="w-6 h-6" />
        )}
        {showTemp && (
          <span className="font-medium">{Math.round(weather.temperature)}°</span>
        )}
      </div>
      {/* Hover popup with weather details */}
      {showPopup && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 min-w-[180px]">
          <div className="flex items-center gap-3 mb-2">
            {weather.icon && (
              <img src={weather.icon} alt={weather.condition} className="w-10 h-10" />
            )}
            <div>
              <div className="text-lg font-bold text-popover-foreground">
                {Math.round(weather.temperature)}°F
              </div>
              <div className="text-xs text-muted-foreground">{weather.condition}</div>
            </div>
          </div>
          <div className="text-sm text-popover-foreground font-medium mb-2">
            {weather.location}
          </div>
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">Humidity:</span>
              <span className="ml-1 font-medium text-popover-foreground">{weather.humidity}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Wind:</span>
              <span className="ml-1 font-medium text-popover-foreground">{Math.round(weather.windSpeed)} mph</span>
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-popover border-l border-t border-border rotate-45" />
        </div>
      )}
    </div>
  )
}

export function Header() {
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const [siteTitle, setSiteTitle] = useState('Faux|Dash')
  const [siteTitleEnabled, setSiteTitleEnabled] = useState(true)
  const [searchEnabled, setSearchEnabled] = useState(false)
  const [searchInHeader, setSearchInHeader] = useState(false)
  const [dateTimeEnabled, setDateTimeEnabled] = useState(false)
  const [dateTimePosition, setDateTimePosition] = useState<'left' | 'center' | 'right'>('left')
  const [dateTimeDisplayMode, setDateTimeDisplayMode] = useState<'text' | 'icon'>('text')
  const [dateFormat, setDateFormat] = useState('EEEE, MMMM d, yyyy')
  const [timeEnabled, setTimeEnabled] = useState(false)
  const [timeFormat, setTimeFormat] = useState<'12' | '24'>('12')
  const [showSeconds, setShowSeconds] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (data.siteTitle) setSiteTitle(data.siteTitle)
        setSiteTitleEnabled(data.siteTitleEnabled !== false)
        setSearchEnabled(data.searchEnabled !== false)
        setSearchInHeader(data.searchInHeader || false)
        setDateTimeEnabled(data.dateTimeEnabled || false)
        setDateTimePosition(data.dateTimePosition || 'left')
        setDateTimeDisplayMode(data.dateTimeDisplayMode || 'text')
        setDateFormat(data.dateFormat || 'EEEE, MMMM d, yyyy')
        setTimeEnabled(data.timeEnabled || false)
        setTimeFormat(data.timeFormat || '12')
        setShowSeconds(data.showSeconds || false)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      }
    }
    if (session) {
      fetchSettings()
    }
  }, [session])

  const toggleTheme = async () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)

    // Save to database
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultTheme: newTheme }),
      })
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            {siteTitleEnabled && (
              <Link href="/" className="group">
                <h1 className="text-xl font-bold text-foreground">
                  {siteTitle}
                </h1>
              </Link>
            )}
            <CompactWeather />
            {session && dateTimeEnabled && dateTimePosition === 'left' && (
              <DateTimeDisplay
                dateFormat={dateFormat}
                timeEnabled={timeEnabled}
                timeFormat={timeFormat}
                showSeconds={showSeconds}
                displayMode={dateTimeDisplayMode}
              />
            )}
          </div>

          {session && dateTimeEnabled && dateTimePosition === 'center' && (
            <DateTimeDisplay
              dateFormat={dateFormat}
              timeEnabled={timeEnabled}
              timeFormat={timeFormat}
              showSeconds={showSeconds}
              displayMode={dateTimeDisplayMode}
            />
          )}

          {session && searchEnabled && searchInHeader && !dateTimeEnabled && (
            <div className="flex-1 max-w-2xl">
              <SearchBar />
            </div>
          )}

          <div className="flex items-center space-x-2">
            {session && dateTimeEnabled && dateTimePosition === 'right' && (
              <DateTimeDisplay
                dateFormat={dateFormat}
                timeEnabled={timeEnabled}
                timeFormat={timeFormat}
                showSeconds={showSeconds}
                displayMode={dateTimeDisplayMode}
              />
            )}

            {session && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {resolvedTheme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </Button>
            )}

            {session ? (
              <>
                {(session.user as any)?.isAdmin && (
                  <Link href="/admin">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Admin Panel"
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                    </Button>
                  </Link>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  title="Sign Out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <UserCircleIcon className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
