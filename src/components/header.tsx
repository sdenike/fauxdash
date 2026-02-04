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
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { SearchBar } from './search-bar'
import { DateTimeDisplay } from './date-time-display'

// Inline compact weather component with hover details and location cycling
function CompactWeather() {
  const [weatherData, setWeatherData] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [enabled, setEnabled] = useState(false)
  const [displayMode, setDisplayMode] = useState<'icon' | 'temp' | 'both'>('both')
  const [showPopup, setShowPopup] = useState(true)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const fetchWeatherSettings = async () => {
      try {
        const settingsRes = await fetch('/api/settings')
        const settings = await settingsRes.json()

        if (settings.weatherEnabled) {
          setEnabled(true)
          setDisplayMode(settings.weatherDisplayMode || 'both')
          setShowPopup(settings.weatherShowPopup !== false)
          const locations = settings.weatherLocations?.split(',').map((l: string) => l.trim()).filter(Boolean) || []
          if (locations.length > 0) {
            // Fetch weather for all locations
            const weatherPromises = locations.map((location: string) =>
              fetch(`/api/weather?location=${encodeURIComponent(location)}`)
                .then(res => res.json())
                .catch(() => null)
            )
            const results = await Promise.all(weatherPromises)
            const validResults = results.filter(r => r && !r.error)
            setWeatherData(validResults)
          }
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      }
    }
    fetchWeatherSettings()
  }, [])

  // Reset to first location when leaving popup
  const handleMouseLeave = () => {
    setIsHovering(false)
    setCurrentIndex(0)
  }

  const handlePrevLocation = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex(prev => (prev === 0 ? weatherData.length - 1 : prev - 1))
  }

  const handleNextLocation = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex(prev => (prev === weatherData.length - 1 ? 0 : prev + 1))
  }

  if (!enabled || weatherData.length === 0) return null

  const weather = weatherData[currentIndex]
  const showIcon = displayMode === 'icon' || displayMode === 'both'
  const showTemp = displayMode === 'temp' || displayMode === 'both'
  const hasMultipleLocations = weatherData.length > 1

  return (
    <div
      className={showPopup ? "relative" : ""}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
        {showIcon && weather.icon && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={weather.icon} alt="" className="w-6 h-6" />
        )}
        {showTemp && (
          <span className="font-medium">{Math.round(weather.temperature)}°</span>
        )}
      </div>
      {/* Hover popup with weather details and navigation */}
      {showPopup && (
        <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-popover border border-border rounded-md shadow-lg transition-all duration-200 whitespace-nowrap z-50 min-w-[200px] ${isHovering ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          {/* Navigation header for multiple locations */}
          {hasMultipleLocations && (
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
              <button
                onClick={handlePrevLocation}
                className="p-1 rounded hover:bg-accent transition-colors"
                title="Previous location"
              >
                <ChevronLeftIcon className="h-4 w-4 text-muted-foreground" />
              </button>
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {weatherData.length}
              </span>
              <button
                onClick={handleNextLocation}
                className="p-1 rounded hover:bg-accent transition-colors"
                title="Next location"
              >
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 mb-2">
            {weather.icon && (
              /* eslint-disable-next-line @next/next/no-img-element */
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

// All special themes (toggle should be hidden for these)
const SPECIAL_THEMES = [
  'Nord Light',
  'Nord Dark',
  'Monokai Light',
  'Monokai Dark',
  'Material Dark',
  'Minimal Kiwi',
  'One Dark Pro',
  'Catppuccin Mocha',
  'Shades of Purple',
  'Dracula',
]

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
  const [themeColor, setThemeColor] = useState('Slate')

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
        if (data.themeColor) {
          console.log('[Theme] Fetched themeColor from settings:', data.themeColor)
          setThemeColor(data.themeColor)
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      }
    }
    if (session) {
      fetchSettings()
    }
  }, [session])

  // Check if theme toggle should be shown
  const shouldShowThemeToggle = () => {
    // Hide toggle for all special themes, only show for standard themes (Slate, Gray, etc.)
    return !SPECIAL_THEMES.includes(themeColor)
  }

  const toggleTheme = async () => {
    console.log('[Theme] Toggle clicked - Current state:', { themeColor, resolvedTheme })

    // Toggle between light and dark mode for standard themes
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    console.log('[Theme] Toggling mode:', { from: resolvedTheme, to: newTheme })

    // Update local state immediately
    setTheme(newTheme)

    // Save to database
    try {
      console.log('[Theme] Saving to database:', { defaultTheme: newTheme })
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultTheme: newTheme }),
      })

      if (!response.ok) {
        console.error('[Theme] Save failed:', response.status)
      } else {
        console.log('[Theme] Saved successfully')
      }
    } catch (error) {
      console.error('[Theme] Failed to save theme preference:', error)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card pt-safe">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          {/* Left section: title, weather, date-time */}
          <div className="flex items-center justify-between md:justify-start md:space-x-6">
            <div className="flex items-center space-x-4 md:space-x-6">
              {siteTitleEnabled && (
                <Link href="/" className="group">
                  <h1 className="text-xl font-bold text-foreground">
                    {siteTitle}
                  </h1>
                </Link>
              )}
              <CompactWeather />
              {session && dateTimeEnabled && dateTimePosition === 'left' && (
                <div className="hidden sm:block">
                  <DateTimeDisplay
                    dateFormat={dateFormat}
                    timeEnabled={timeEnabled}
                    timeFormat={timeFormat}
                    showSeconds={showSeconds}
                    displayMode={dateTimeDisplayMode}
                  />
                </div>
              )}
            </div>

            {/* Mobile action buttons - visible only on mobile */}
            <div className="flex items-center space-x-1 md:hidden">
              {session && shouldShowThemeToggle() && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="touch-target"
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
                        className="touch-target"
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
                    className="touch-target"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="touch-target"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Center section: search bar and/or date-time */}
          <div className="flex-1 flex items-center justify-center gap-4">
            {session && searchEnabled && searchInHeader && (
              <div className="w-full md:flex-1 md:max-w-xl">
                <SearchBar />
              </div>
            )}

            {session && dateTimeEnabled && dateTimePosition === 'center' && (
              <div className="hidden md:block">
                <DateTimeDisplay
                  dateFormat={dateFormat}
                  timeEnabled={timeEnabled}
                  timeFormat={timeFormat}
                  showSeconds={showSeconds}
                  displayMode={dateTimeDisplayMode}
                />
              </div>
            )}
          </div>

          {/* Right section: date-time and action buttons - hidden on mobile */}
          <div className="hidden md:flex items-center space-x-2">
            {session && dateTimeEnabled && dateTimePosition === 'right' && (
              <DateTimeDisplay
                dateFormat={dateFormat}
                timeEnabled={timeEnabled}
                timeFormat={timeFormat}
                showSeconds={showSeconds}
                displayMode={dateTimeDisplayMode}
              />
            )}

            {session && shouldShowThemeToggle() && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="touch-target"
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
                      className="touch-target"
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
                  className="touch-target"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="icon"
                  className="touch-target"
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
