'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { THEMES, getThemeByName, applyTheme } from '@/lib/themes'

interface Settings {
  // Search
  searchEnabled: boolean
  searchEngine: string
  customSearchName: string
  customSearchUrl: string
  searchInHeader: boolean
  // GeoIP
  geoipEnabled: boolean
  geoipProvider: 'maxmind' | 'ipinfo' | 'chain'
  geoipMaxmindPath: string
  geoipMaxmindLicenseKey: string
  geoipMaxmindAccountId: string
  geoipIpinfoToken: string
  geoipCacheDuration: number
  // Appearance
  defaultTheme: string
  themeColor: string
  siteTitle: string
  siteTitleEnabled: boolean
  welcomeMessage: string
  welcomeMessageEnabled: boolean
  welcomeMessageTimeBased: boolean
  welcomeMessageMorning: string
  welcomeMessageAfternoon: string
  welcomeMessageEvening: string
  dateTimeEnabled: boolean
  dateTimePosition: 'left' | 'center' | 'right'
  dateTimeDisplayMode: 'text' | 'icon'
  dateFormat: string
  timeEnabled: boolean
  timeFormat: '12' | '24'
  showSeconds: boolean
  servicesPosition: string
  sectionOrder: string
  servicesIconSize: number
  servicesFontSize: number
  servicesDescriptionSpacing: number
  servicesItemSpacing: number
  bookmarksIconSize: number
  bookmarksFontSize: number
  descriptionSpacing: number
  itemSpacing: number
  servicesColumns: number
  bookmarksColumns: number
  // Weather
  weatherEnabled: boolean
  weatherDisplayMode: 'icon' | 'temp' | 'both'
  weatherShowPopup: boolean
  weatherProvider: string
  weatherLocations: string
  weatherLatitude: string
  weatherLongitude: string
  weatherAutoRotate: number
  tempestApiKey: string
  tempestStationId: string
  weatherapiKey: string
  openweatherKey: string
  // Defaults for new items
  defaultBookmarkCategoryEnabled: boolean
  defaultBookmarkCategoryRequiresAuth: boolean
  defaultBookmarkCategoryItemsToShow: number | null
  defaultBookmarkCategoryShowItemCount: boolean
  defaultBookmarkCategoryAutoExpanded: boolean
  defaultBookmarkCategorySortBy: string
  defaultServiceCategoryEnabled: boolean
  defaultServiceCategoryRequiresAuth: boolean
  defaultServiceCategoryItemsToShow: number | null
  defaultServiceCategoryShowItemCount: boolean
  defaultServiceCategoryAutoExpanded: boolean
  defaultServiceCategorySortBy: string
  defaultBookmarkEnabled: boolean
  defaultBookmarkRequiresAuth: boolean
  defaultServiceEnabled: boolean
  defaultServiceRequiresAuth: boolean
  // SMTP / Email
  smtpProvider: 'none' | 'custom' | 'google'
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpEncryption: 'none' | 'tls' | 'ssl'
  smtpFromEmail: string
  smtpFromName: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { setTheme: setNextTheme, resolvedTheme } = useTheme()
  const [settings, setSettings] = useState<Settings>({
    searchEnabled: true,
    searchEngine: 'duckduckgo',
    customSearchName: '',
    customSearchUrl: '',
    searchInHeader: true,
    geoipEnabled: false,
    geoipProvider: 'maxmind',
    geoipMaxmindPath: './data/GeoLite2-City.mmdb',
    geoipMaxmindLicenseKey: '',
    geoipMaxmindAccountId: '',
    geoipIpinfoToken: '',
    geoipCacheDuration: 86400,
    defaultTheme: 'system',
    themeColor: 'Slate',
    siteTitle: 'Faux|Dash',
    siteTitleEnabled: true,
    welcomeMessage: 'Welcome back',
    welcomeMessageEnabled: true,
    welcomeMessageTimeBased: false,
    welcomeMessageMorning: 'Good morning',
    welcomeMessageAfternoon: 'Good afternoon',
    welcomeMessageEvening: 'Good evening',
    dateTimeEnabled: false,
    dateTimePosition: 'left',
    dateTimeDisplayMode: 'text',
    dateFormat: 'MMMM d, yyyy',
    timeEnabled: false,
    timeFormat: '12',
    showSeconds: false,
    servicesPosition: 'above',
    sectionOrder: 'services-first',
    servicesIconSize: 32,
    servicesFontSize: 16,
    servicesDescriptionSpacing: 4,
    servicesItemSpacing: 8,
    bookmarksIconSize: 32,
    bookmarksFontSize: 14,
    descriptionSpacing: 2,
    itemSpacing: 4,
    servicesColumns: 4,
    bookmarksColumns: 4,
    weatherEnabled: false,
    weatherDisplayMode: 'both',
    weatherShowPopup: true,
    weatherProvider: 'weatherapi',
    weatherLocations: '90210',
    weatherLatitude: '',
    weatherLongitude: '',
    weatherAutoRotate: 30,
    tempestApiKey: '',
    tempestStationId: '',
    weatherapiKey: '',
    openweatherKey: '',
    // Defaults for new items
    defaultBookmarkCategoryEnabled: true,
    defaultBookmarkCategoryRequiresAuth: false,
    defaultBookmarkCategoryItemsToShow: null,
    defaultBookmarkCategoryShowItemCount: false,
    defaultBookmarkCategoryAutoExpanded: false,
    defaultBookmarkCategorySortBy: 'order',
    defaultServiceCategoryEnabled: true,
    defaultServiceCategoryRequiresAuth: false,
    defaultServiceCategoryItemsToShow: null,
    defaultServiceCategoryShowItemCount: false,
    defaultServiceCategoryAutoExpanded: false,
    defaultServiceCategorySortBy: 'order',
    defaultBookmarkEnabled: true,
    defaultBookmarkRequiresAuth: false,
    defaultServiceEnabled: true,
    defaultServiceRequiresAuth: false,
    // SMTP
    smtpProvider: 'none',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    smtpFromEmail: '',
    smtpFromName: 'Faux|Dash',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchSettings()
    }
  }, [session])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      toast({
        variant: 'success',
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
      })
      setTimeout(() => {
        toast({
          variant: 'default',
          open: false,
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      // Save settings first
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      // Test connection
      const response = await fetch('/api/weather/test', {
        method: 'POST',
      })
      const result = await response.json()

      if (result.success) {
        setTestResult({
          success: true,
          message: `Connection successful! Temperature: ${result.data.temperature}°F, Humidity: ${result.data.humidity}%`
        })
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Connection test failed'
        })
      }
    } catch (error) {
      console.error('Failed to test connection:', error)
      setTestResult({
        success: false,
        message: 'Failed to test connection'
      })
    } finally {
      setTesting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure your dashboard preferences
        </p>
      </div>

      <div className="max-w-4xl">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="greeting">Greeting</TabsTrigger>
            <TabsTrigger value="datetime">Date & Time</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="geoip">GeoIP</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Search</CardTitle>
                <CardDescription>
                  Configure your search preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="searchEnabled">Enable Search Box</Label>
                    <p className="text-sm text-muted-foreground">
                      Show search box on your homepage
                    </p>
                  </div>
                  <Switch
                    id="searchEnabled"
                    checked={settings.searchEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, searchEnabled: checked })}
                  />
                </div>

                {settings.searchEnabled && (
                  <>
                    <div>
                      <Label htmlFor="searchEngine">Search Engine</Label>
                      <Select
                        value={settings.searchEngine}
                        onValueChange={(value) => setSettings({ ...settings, searchEngine: value })}
                      >
                        <SelectTrigger id="searchEngine">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="brave">Brave</SelectItem>
                          <SelectItem value="kagi">Kagi</SelectItem>
                          <SelectItem value="startpage">Startpage</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {settings.searchEngine === 'custom' && (
                      <>
                        <div>
                          <Label htmlFor="customSearchName">Custom Search Engine Name</Label>
                          <Input
                            id="customSearchName"
                            value={settings.customSearchName}
                            onChange={(e) => setSettings({ ...settings, customSearchName: e.target.value })}
                            placeholder="My Search Engine"
                          />
                        </div>
                        <div>
                          <Label htmlFor="customSearchUrl">Custom Search URL</Label>
                          <Input
                            id="customSearchUrl"
                            value={settings.customSearchUrl}
                            onChange={(e) => setSettings({ ...settings, customSearchUrl: e.target.value })}
                            placeholder="https://example.com/search?q="
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Include the URL up to the query parameter. The search term will be appended automatically.
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <Label htmlFor="searchInHeader">Show Search in Header</Label>
                    <p className="text-sm text-muted-foreground">
                      Display search bar in page header instead of main content
                    </p>
                  </div>
                  <Switch
                    id="searchInHeader"
                    checked={settings.searchInHeader}
                    onCheckedChange={(checked) => setSettings({ ...settings, searchInHeader: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weather" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Weather Widget</CardTitle>
                <CardDescription>
                  Configure weather display on your homepage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weatherEnabled">Enable Weather Widget</Label>
                    <p className="text-sm text-muted-foreground">
                      Show weather information on your homepage
                    </p>
                  </div>
                  <Switch
                    id="weatherEnabled"
                    checked={settings.weatherEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, weatherEnabled: checked })}
                  />
                </div>

                {settings.weatherEnabled && (
                  <>
                    <div>
                      <Label htmlFor="weatherDisplayMode">Header Display</Label>
                      <Select
                        value={settings.weatherDisplayMode}
                        onValueChange={(value: 'icon' | 'temp' | 'both') => setSettings({ ...settings, weatherDisplayMode: value })}
                      >
                        <SelectTrigger id="weatherDisplayMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">Icon & Temperature</SelectItem>
                          <SelectItem value="icon">Icon Only</SelectItem>
                          <SelectItem value="temp">Temperature Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weatherShowPopup">Show Details on Hover</Label>
                        <p className="text-sm text-muted-foreground">
                          Display detailed weather info when hovering
                        </p>
                      </div>
                      <Switch
                        id="weatherShowPopup"
                        checked={settings.weatherShowPopup}
                        onCheckedChange={(checked) => setSettings({ ...settings, weatherShowPopup: checked })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="weatherProvider">Weather Provider</Label>
                      <Select
                        value={settings.weatherProvider}
                        onValueChange={(value) => setSettings({ ...settings, weatherProvider: value })}
                      >
                        <SelectTrigger id="weatherProvider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weatherapi">WeatherAPI.com (Recommended)</SelectItem>
                          <SelectItem value="openweather">OpenWeatherMap</SelectItem>
                          <SelectItem value="tempest">Tempest Weather</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {settings.weatherProvider === 'tempest' && (
                      <>
                        <div>
                          <Label htmlFor="tempestApiKey">Tempest API Key</Label>
                          <Input
                            id="tempestApiKey"
                            type="password"
                            value={settings.tempestApiKey}
                            onChange={(e) => setSettings({ ...settings, tempestApiKey: e.target.value })}
                            placeholder="Your Tempest API key"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Get your API key from <a href="https://tempestwx.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Tempest Settings</a>
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="tempestStationId">Station ID</Label>
                          <Input
                            id="tempestStationId"
                            value={settings.tempestStationId}
                            onChange={(e) => setSettings({ ...settings, tempestStationId: e.target.value })}
                            placeholder="Your Tempest station ID"
                          />
                        </div>
                      </>
                    )}

                    {settings.weatherProvider === 'weatherapi' && (
                      <div>
                        <Label htmlFor="weatherapiKey">WeatherAPI Key</Label>
                        <Input
                          id="weatherapiKey"
                          type="password"
                          value={settings.weatherapiKey}
                          onChange={(e) => setSettings({ ...settings, weatherapiKey: e.target.value })}
                          placeholder="Your WeatherAPI key"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Get a free API key from <a href="https://www.weatherapi.com/signup.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">WeatherAPI.com</a>
                        </p>
                      </div>
                    )}

                    {settings.weatherProvider === 'openweather' && (
                      <div>
                        <Label htmlFor="openweatherKey">OpenWeather API Key</Label>
                        <Input
                          id="openweatherKey"
                          type="password"
                          value={settings.openweatherKey}
                          onChange={(e) => setSettings({ ...settings, openweatherKey: e.target.value })}
                          placeholder="Your OpenWeather API key"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Get a free API key from <a href="https://home.openweathermap.org/users/sign_up" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenWeatherMap</a>
                        </p>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="weatherLocations">Locations (ZIP Codes or City Names)</Label>
                      <Input
                        id="weatherLocations"
                        value={settings.weatherLocations}
                        onChange={(e) => setSettings({ ...settings, weatherLocations: e.target.value })}
                        placeholder="90210,10001 or New York,Los Angeles"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Comma-separated list of ZIP codes or city names
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="weatherLatitude">Latitude (Optional)</Label>
                        <Input
                          id="weatherLatitude"
                          value={settings.weatherLatitude}
                          onChange={(e) => setSettings({ ...settings, weatherLatitude: e.target.value })}
                          placeholder="40.7128"
                        />
                      </div>
                      <div>
                        <Label htmlFor="weatherLongitude">Longitude (Optional)</Label>
                        <Input
                          id="weatherLongitude"
                          value={settings.weatherLongitude}
                          onChange={(e) => setSettings({ ...settings, weatherLongitude: e.target.value })}
                          placeholder="-74.0060"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setSettings({
                                  ...settings,
                                  weatherLatitude: position.coords.latitude.toFixed(4),
                                  weatherLongitude: position.coords.longitude.toFixed(4)
                                })
                              },
                              (error) => {
                                if (error.code === error.PERMISSION_DENIED && window.location.protocol === 'http:') {
                                  alert('Geolocation requires HTTPS. Please access the site via HTTPS or manually enter coordinates using latlong.net')
                                } else {
                                  alert('Unable to get location: ' + error.message)
                                }
                              }
                            )
                          } else {
                            alert('Geolocation is not supported by your browser')
                          }
                        }}
                      >
                        📍 Use my current location
                      </Button>
                      {' '}or find coordinates at{' '}
                      <a
                        href="https://www.latlong.net/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        latlong.net
                      </a>
                    </div>

                    <div>
                      <Label htmlFor="weatherAutoRotate">Auto-Rotate Interval (seconds)</Label>
                      <Input
                        id="weatherAutoRotate"
                        type="number"
                        min="0"
                        value={settings.weatherAutoRotate}
                        onChange={(e) => setSettings({ ...settings, weatherAutoRotate: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Set to 0 to disable auto-rotation
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        onClick={handleTestConnection}
                        disabled={testing}
                        variant="outline"
                        className="w-full"
                      >
                        {testing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testing Connection...
                          </>
                        ) : (
                          'Test Connection'
                        )}
                      </Button>
                      {testResult && (
                        <div className={`mt-3 p-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${testResult.success ? 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800'}`}>
                          {testResult.success ? (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 flex-shrink-0" />
                          )}
                          <p className="text-sm font-medium">
                            {testResult.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geoip" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>GeoIP Configuration</CardTitle>
                <CardDescription>
                  Configure geographic location lookup for visitor analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="geoipEnabled">Enable GeoIP Lookup</Label>
                    <p className="text-sm text-muted-foreground">
                      Enrich pageview analytics with geographic location data
                    </p>
                  </div>
                  <Switch
                    id="geoipEnabled"
                    checked={settings.geoipEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, geoipEnabled: checked })}
                  />
                </div>

                {settings.geoipEnabled && (
                  <>
                    <div>
                      <Label htmlFor="geoipProvider">GeoIP Provider</Label>
                      <Select
                        value={settings.geoipProvider}
                        onValueChange={(value: 'maxmind' | 'ipinfo' | 'chain') => setSettings({ ...settings, geoipProvider: value })}
                      >
                        <SelectTrigger id="geoipProvider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maxmind">MaxMind GeoLite2 (Recommended)</SelectItem>
                          <SelectItem value="ipinfo">ipinfo.io API</SelectItem>
                          <SelectItem value="chain">Chain (MaxMind with ipinfo.io fallback)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        MaxMind uses a local database file. ipinfo.io is an online API service.
                      </p>
                    </div>

                    {(settings.geoipProvider === 'maxmind' || settings.geoipProvider === 'chain') && (
                      <>
                        <div className="pt-4 border-t">
                          <div className="flex items-center gap-2 pb-2">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            <h3 className="text-base font-semibold text-foreground">MaxMind Settings</h3>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="geoipMaxmindPath">Database File Path</Label>
                          <Input
                            id="geoipMaxmindPath"
                            value={settings.geoipMaxmindPath}
                            onChange={(e) => setSettings({ ...settings, geoipMaxmindPath: e.target.value })}
                            placeholder="./data/GeoLite2-City.mmdb"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Path to the GeoLite2-City.mmdb database file
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="geoipMaxmindAccountId">Account ID (for auto-updates)</Label>
                          <Input
                            id="geoipMaxmindAccountId"
                            value={settings.geoipMaxmindAccountId}
                            onChange={(e) => setSettings({ ...settings, geoipMaxmindAccountId: e.target.value })}
                            placeholder="Your MaxMind account ID"
                          />
                        </div>

                        <div>
                          <Label htmlFor="geoipMaxmindLicenseKey">License Key (for auto-updates)</Label>
                          <Input
                            id="geoipMaxmindLicenseKey"
                            type="password"
                            value={settings.geoipMaxmindLicenseKey}
                            onChange={(e) => setSettings({ ...settings, geoipMaxmindLicenseKey: e.target.value })}
                            placeholder="Your MaxMind license key"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Get a free license key from{' '}
                            <a
                              href="https://www.maxmind.com/en/geolite2/signup"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              MaxMind GeoLite2
                            </a>
                          </p>
                        </div>
                      </>
                    )}

                    {(settings.geoipProvider === 'ipinfo' || settings.geoipProvider === 'chain') && (
                      <>
                        <div className="pt-4 border-t">
                          <div className="flex items-center gap-2 pb-2">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            <h3 className="text-base font-semibold text-foreground">ipinfo.io Settings</h3>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="geoipIpinfoToken">API Token</Label>
                          <Input
                            id="geoipIpinfoToken"
                            type="password"
                            value={settings.geoipIpinfoToken}
                            onChange={(e) => setSettings({ ...settings, geoipIpinfoToken: e.target.value })}
                            placeholder="Your ipinfo.io API token"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Get a free API token from{' '}
                            <a
                              href="https://ipinfo.io/signup"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              ipinfo.io
                            </a>
                            {' '}(50,000 lookups/month free)
                          </p>
                        </div>
                      </>
                    )}

                    <div className="pt-4 border-t">
                      <Label htmlFor="geoipCacheDuration">Cache Duration (seconds)</Label>
                      <Input
                        id="geoipCacheDuration"
                        type="number"
                        min="0"
                        value={settings.geoipCacheDuration}
                        onChange={(e) => setSettings({ ...settings, geoipCacheDuration: parseInt(e.target.value) || 86400 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        How long to cache IP lookup results. Default: 86400 (24 hours). Set to 0 to disable caching.
                      </p>
                    </div>

                    <div className="pt-4 border-t bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Privacy Note</h4>
                      <p className="text-sm text-muted-foreground">
                        IP addresses are hashed using SHA-256 before storage. Only geographic data (country, city, region) is stored -
                        raw IP addresses are never persisted. This provides analytics while respecting visitor privacy.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="greeting" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Message</CardTitle>
                <CardDescription>
                  Customize the welcome message on your homepage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="welcomeMessageEnabled">Show Welcome Message</Label>
                    <p className="text-sm text-muted-foreground">
                      Display welcome message on homepage
                    </p>
                  </div>
                  <Switch
                    id="welcomeMessageEnabled"
                    checked={settings.welcomeMessageEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, welcomeMessageEnabled: checked })}
                  />
                </div>

                {settings.welcomeMessageEnabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="welcomeMessageTimeBased">Use Time-Based Messages</Label>
                        <p className="text-sm text-muted-foreground">
                          Show different messages based on time of day
                        </p>
                      </div>
                      <Switch
                        id="welcomeMessageTimeBased"
                        checked={settings.welcomeMessageTimeBased}
                        onCheckedChange={(checked) => setSettings({ ...settings, welcomeMessageTimeBased: checked })}
                      />
                    </div>

                    {settings.welcomeMessageTimeBased ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="welcomeMessageMorning">Morning Message (5 AM - 12 PM)</Label>
                          <Input
                            id="welcomeMessageMorning"
                            value={settings.welcomeMessageMorning}
                            onChange={(e) => setSettings({ ...settings, welcomeMessageMorning: e.target.value })}
                            placeholder="Good morning"
                          />
                        </div>
                        <div>
                          <Label htmlFor="welcomeMessageAfternoon">Afternoon Message (12 PM - 5 PM)</Label>
                          <Input
                            id="welcomeMessageAfternoon"
                            value={settings.welcomeMessageAfternoon}
                            onChange={(e) => setSettings({ ...settings, welcomeMessageAfternoon: e.target.value })}
                            placeholder="Good afternoon"
                          />
                        </div>
                        <div>
                          <Label htmlFor="welcomeMessageEvening">Evening Message (5 PM - 5 AM)</Label>
                          <Input
                            id="welcomeMessageEvening"
                            value={settings.welcomeMessageEvening}
                            onChange={(e) => setSettings({ ...settings, welcomeMessageEvening: e.target.value })}
                            placeholder="Good evening"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Use variables: {'{{username}}'}, {'{{email}}'}, {'{{firstname}}'}, {'{{lastname}}'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="welcomeMessage">Welcome Message Text</Label>
                        <Input
                          id="welcomeMessage"
                          value={settings.welcomeMessage}
                          onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                          placeholder="Welcome back"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use variables: {'{{username}}'}, {'{{email}}'}, {'{{firstname}}'}, {'{{lastname}}'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="datetime" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Date & Time Display</CardTitle>
                <CardDescription>
                  Display current date and time in the header
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dateTimeEnabled">Show Date & Time</Label>
                    <p className="text-sm text-muted-foreground">
                      Display date and time in header
                    </p>
                  </div>
                  <Switch
                    id="dateTimeEnabled"
                    checked={settings.dateTimeEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, dateTimeEnabled: checked })}
                  />
                </div>

                {settings.dateTimeEnabled && (
                  <>
                    <div>
                      <Label htmlFor="dateTimePosition">Position in Header</Label>
                      <Select
                        value={settings.dateTimePosition}
                        onValueChange={(value: 'left' | 'center' | 'right') => setSettings({ ...settings, dateTimePosition: value })}
                      >
                        <SelectTrigger id="dateTimePosition">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="dateTimeDisplayMode">Display Mode</Label>
                      <Select
                        value={settings.dateTimeDisplayMode}
                        onValueChange={(value: 'text' | 'icon') => setSettings({ ...settings, dateTimeDisplayMode: value })}
                      >
                        <SelectTrigger id="dateTimeDisplayMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text (Show full date/time)</SelectItem>
                          <SelectItem value="icon">Clock Icon (Hover to see details)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={settings.dateFormat}
                        onValueChange={(value) => setSettings({ ...settings, dateFormat: value })}
                      >
                        <SelectTrigger id="dateFormat">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MMMM d, yyyy">January 21, 2026</SelectItem>
                          <SelectItem value="MMM d, yyyy">Jan 21, 2026</SelectItem>
                          <SelectItem value="M/d/yyyy">1/21/2026</SelectItem>
                          <SelectItem value="MM/dd/yyyy">01/21/2026</SelectItem>
                          <SelectItem value="d/M/yyyy">21/1/2026</SelectItem>
                          <SelectItem value="dd/MM/yyyy">21/01/2026</SelectItem>
                          <SelectItem value="yyyy-MM-dd">2026-01-21</SelectItem>
                          <SelectItem value="EEEE, MMMM d, yyyy">Tuesday, January 21, 2026</SelectItem>
                          <SelectItem value="EEE, MMM d, yyyy">Tue, Jan 21, 2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="timeEnabled">Show Time</Label>
                        <p className="text-sm text-muted-foreground">
                          Display current time with date
                        </p>
                      </div>
                      <Switch
                        id="timeEnabled"
                        checked={settings.timeEnabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, timeEnabled: checked })}
                      />
                    </div>

                    {settings.timeEnabled && (
                      <>
                        <div>
                          <Label htmlFor="timeFormat">Time Format</Label>
                          <Select
                            value={settings.timeFormat}
                            onValueChange={(value: '12' | '24') => setSettings({ ...settings, timeFormat: value })}
                          >
                            <SelectTrigger id="timeFormat">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12-hour (3:45 PM)</SelectItem>
                              <SelectItem value="24">24-hour (15:45)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="showSeconds">Show Seconds</Label>
                            <p className="text-sm text-muted-foreground">
                              Display seconds in time
                            </p>
                          </div>
                          <Switch
                            id="showSeconds"
                            checked={settings.showSeconds}
                            onCheckedChange={(checked) => setSettings({ ...settings, showSeconds: checked })}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Email / SMTP Configuration</CardTitle>
                <CardDescription>
                  Configure email settings for password resets and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="smtpProvider">Email Provider</Label>
                  <Select
                    value={settings.smtpProvider}
                    onValueChange={(value: 'none' | 'custom' | 'google') => {
                      if (value === 'google') {
                        setSettings({
                          ...settings,
                          smtpProvider: value,
                          smtpHost: 'smtp.gmail.com',
                          smtpPort: 587,
                          smtpEncryption: 'tls',
                        })
                      } else if (value === 'none') {
                        setSettings({
                          ...settings,
                          smtpProvider: value,
                          smtpHost: '',
                          smtpPort: 587,
                          smtpUsername: '',
                          smtpPassword: '',
                        })
                      } else {
                        setSettings({ ...settings, smtpProvider: value })
                      }
                    }}
                  >
                    <SelectTrigger id="smtpProvider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Disabled</SelectItem>
                      <SelectItem value="google">Google / Gmail</SelectItem>
                      <SelectItem value="custom">Custom SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select your email provider for sending password reset emails
                  </p>
                </div>

                {settings.smtpProvider !== 'none' && (
                  <>
                    {settings.smtpProvider === 'google' && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Google / Gmail Setup</h4>
                        <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                          To use Gmail SMTP, you need to create an App Password:
                        </p>
                        <ol className="text-xs text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1">
                          <li>Go to your Google Account settings</li>
                          <li>Navigate to Security → 2-Step Verification (must be enabled)</li>
                          <li>At the bottom, select App passwords</li>
                          <li>Create a new app password for &quot;Mail&quot;</li>
                          <li>Use that 16-character password below</li>
                        </ol>
                        <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                          <a
                            href="https://support.google.com/accounts/answer/185833"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:no-underline"
                          >
                            Learn more about App Passwords
                          </a>
                        </p>
                      </div>
                    )}

                    {settings.smtpProvider === 'custom' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="smtpHost">SMTP Host</Label>
                            <Input
                              id="smtpHost"
                              value={settings.smtpHost}
                              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                              placeholder="smtp.example.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="smtpPort">SMTP Port</Label>
                            <Input
                              id="smtpPort"
                              type="number"
                              value={settings.smtpPort}
                              onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                              placeholder="587"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="smtpEncryption">Encryption</Label>
                          <Select
                            value={settings.smtpEncryption}
                            onValueChange={(value: 'none' | 'tls' | 'ssl') => setSettings({ ...settings, smtpEncryption: value })}
                          >
                            <SelectTrigger id="smtpEncryption">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tls">TLS (Port 587 - Recommended)</SelectItem>
                              <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                              <SelectItem value="none">None (Not Recommended)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="w-1 h-5 bg-primary rounded-full" />
                        <h3 className="text-base font-semibold text-foreground">Authentication</h3>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="smtpUsername">
                        {settings.smtpProvider === 'google' ? 'Gmail Address' : 'SMTP Username'}
                      </Label>
                      <Input
                        id="smtpUsername"
                        type="email"
                        value={settings.smtpUsername}
                        onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                        placeholder={settings.smtpProvider === 'google' ? 'your-email@gmail.com' : 'username'}
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtpPassword">
                        {settings.smtpProvider === 'google' ? 'App Password' : 'SMTP Password'}
                      </Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={settings.smtpPassword}
                        onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                        placeholder={settings.smtpProvider === 'google' ? '16-character app password' : 'password'}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="w-1 h-5 bg-primary rounded-full" />
                        <h3 className="text-base font-semibold text-foreground">Sender Information</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpFromEmail">From Email</Label>
                        <Input
                          id="smtpFromEmail"
                          type="email"
                          value={settings.smtpFromEmail}
                          onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                          placeholder={settings.smtpUsername || 'noreply@example.com'}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave empty to use the username
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="smtpFromName">From Name</Label>
                        <Input
                          id="smtpFromName"
                          value={settings.smtpFromName}
                          onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                          placeholder="Faux|Dash"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Test Configuration</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Test your SMTP connection to verify your settings are working correctly.
                        Make sure to save your settings first before testing.
                      </p>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          setTesting(true)
                          setTestResult(null)
                          try {
                            const response = await fetch('/api/settings/smtp-test', {
                              method: 'POST',
                            })
                            const data = await response.json()
                            if (data.success) {
                              setTestResult({ success: true, message: 'SMTP connection successful!' })
                              toast({
                                variant: 'success',
                                title: 'Connection successful',
                                description: 'SMTP settings are configured correctly.',
                              })
                            } else {
                              setTestResult({ success: false, message: data.error || 'Connection failed' })
                              toast({
                                variant: 'destructive',
                                title: 'Connection failed',
                                description: data.error || 'Failed to connect to SMTP server.',
                              })
                            }
                          } catch (error) {
                            setTestResult({ success: false, message: 'Failed to test connection' })
                            toast({
                              variant: 'destructive',
                              title: 'Error',
                              description: 'Failed to test SMTP connection.',
                            })
                          } finally {
                            setTesting(false)
                          }
                        }}
                        disabled={testing || !settings.smtpHost || !settings.smtpUsername || !settings.smtpPassword}
                      >
                        {testing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          'Test Connection'
                        )}
                      </Button>
                      {testResult && (
                        <div className={`mt-2 p-2 rounded-md flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200 ${testResult.success ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                          {testResult.success ? (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span>{testResult.message}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Customize the appearance of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultTheme">Default Theme Mode</Label>
                  <Select
                    value={settings.defaultTheme}
                    onValueChange={(value) => {
                      setSettings({ ...settings, defaultTheme: value })
                      setNextTheme(value)
                      // Save immediately
                      fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ defaultTheme: value }),
                      })
                    }}
                  >
                    <SelectTrigger id="defaultTheme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Changes apply immediately
                  </p>
                </div>

                <div>
                  <Label htmlFor="themeColor">Theme Color</Label>
                  <Select
                    value={settings.themeColor}
                    onValueChange={(value) => {
                      setSettings({ ...settings, themeColor: value })
                      // Apply theme immediately
                      const isDark = resolvedTheme === 'dark'
                      const themeName = isDark ? `${value} (Dark)` : value
                      const selectedTheme = getThemeByName(themeName)
                      if (selectedTheme) {
                        applyTheme(selectedTheme)
                      }
                      // Save immediately
                      fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ themeColor: value }),
                      })
                    }}
                  >
                    <SelectTrigger id="themeColor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEMES.map((theme) => (
                        <SelectItem key={theme.name} value={theme.name}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose from {THEMES.length} color themes. Changes apply immediately.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Site Branding</CardTitle>
                <CardDescription>
                  Customize your site title and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="siteTitleEnabled">Show Site Title</Label>
                    <p className="text-sm text-muted-foreground">
                      Display site title in the top left corner
                    </p>
                  </div>
                  <Switch
                    id="siteTitleEnabled"
                    checked={settings.siteTitleEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, siteTitleEnabled: checked })}
                  />
                </div>

                {settings.siteTitleEnabled && (
                  <div>
                    <Label htmlFor="siteTitle">Site Title</Label>
                    <Input
                      id="siteTitle"
                      value={settings.siteTitle}
                      onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                      placeholder="Faux|Dash"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Services Layout</CardTitle>
                <CardDescription>
                  Configure where the services section appears
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="sectionOrder">Section Order</Label>
                  <select
                    id="sectionOrder"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 mt-2"
                    value={settings.sectionOrder || settings.servicesPosition === 'above' ? 'services-first' : 'bookmarks-first'}
                    onChange={(e) => setSettings({ ...settings, sectionOrder: e.target.value })}
                  >
                    <option value="services-first">Services First</option>
                    <option value="bookmarks-first">Bookmarks First</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Choose whether the Services section appears before or after Bookmarks on the homepage
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grid Layout</CardTitle>
                <CardDescription>
                  Configure the column layout for services and main page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="servicesColumns">Services Section Columns</Label>
                  <Select
                    value={settings.servicesColumns?.toString() || '4'}
                    onValueChange={(value) => setSettings({ ...settings, servicesColumns: parseInt(value) })}
                  >
                    <SelectTrigger id="servicesColumns" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Column</SelectItem>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                      <SelectItem value="5">5 Columns</SelectItem>
                      <SelectItem value="6">6 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total number of columns for the Services section grid. Service categories will flow and wrap based on their column widths.
                  </p>
                </div>

                <div>
                  <Label htmlFor="bookmarksColumns">Bookmarks Section Columns</Label>
                  <Select
                    value={settings.bookmarksColumns?.toString() || '4'}
                    onValueChange={(value) => setSettings({ ...settings, bookmarksColumns: parseInt(value) })}
                  >
                    <SelectTrigger id="bookmarksColumns" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Column</SelectItem>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                      <SelectItem value="5">5 Columns</SelectItem>
                      <SelectItem value="6">6 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total number of columns for the Bookmarks section grid. Bookmark categories will flow and wrap based on their column widths.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Appearance</CardTitle>
                <CardDescription>
                  Customize icon and text sizes for services and bookmarks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Services Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-base font-semibold text-foreground">Services</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="servicesIconSize">Icon Size</Label>
                        <span className="text-sm text-muted-foreground">{settings.servicesIconSize}px</span>
                      </div>
                      <input
                        type="range"
                        id="servicesIconSize"
                        min="16"
                        max="64"
                        step="4"
                        value={settings.servicesIconSize}
                        onChange={(e) => setSettings({ ...settings, servicesIconSize: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="servicesFontSize">Font Size</Label>
                        <span className="text-sm text-muted-foreground">{settings.servicesFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        id="servicesFontSize"
                        min="12"
                        max="24"
                        step="1"
                        value={settings.servicesFontSize}
                        onChange={(e) => setSettings({ ...settings, servicesFontSize: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="servicesDescriptionSpacing">Description Spacing</Label>
                        <span className="text-sm text-muted-foreground">{settings.servicesDescriptionSpacing}px</span>
                      </div>
                      <input
                        type="range"
                        id="servicesDescriptionSpacing"
                        min="-8"
                        max="12"
                        step="1"
                        value={settings.servicesDescriptionSpacing}
                        onChange={(e) => setSettings({ ...settings, servicesDescriptionSpacing: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="servicesItemSpacing">Item Spacing</Label>
                        <span className="text-sm text-muted-foreground">{settings.servicesItemSpacing}px</span>
                      </div>
                      <input
                        type="range"
                        id="servicesItemSpacing"
                        min="0"
                        max="18"
                        step="1"
                        value={settings.servicesItemSpacing}
                        onChange={(e) => setSettings({ ...settings, servicesItemSpacing: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    {/* Services Preview */}
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-3">Preview:</p>
                      <div
                        className="flex flex-col bg-background rounded-lg border border-border p-2"
                        style={{ gap: `${settings.servicesItemSpacing}px` }}
                      >
                        <div className="flex items-start gap-4 p-4 hover:bg-accent rounded transition-colors">
                          <div
                            className="flex items-center justify-center flex-shrink-0 text-primary"
                            style={{
                              width: `${settings.servicesIconSize + 16}px`,
                              height: `${settings.servicesIconSize + 16}px`
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              style={{
                                width: `${settings.servicesIconSize}px`,
                                height: `${settings.servicesIconSize}px`
                              }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                            </svg>
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span
                              className="font-semibold text-foreground"
                              style={{ fontSize: `${settings.servicesFontSize}px` }}
                            >
                              Example Service
                            </span>
                            <span
                              className="text-muted-foreground line-clamp-2"
                              style={{
                                fontSize: `${settings.servicesFontSize - 2}px`,
                                marginTop: `${settings.servicesDescriptionSpacing}px`
                              }}
                            >
                              This is how your service will appear with a description
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 hover:bg-accent rounded transition-colors">
                          <div
                            className="flex items-center justify-center flex-shrink-0 text-primary"
                            style={{
                              width: `${settings.servicesIconSize + 16}px`,
                              height: `${settings.servicesIconSize + 16}px`
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              style={{
                                width: `${settings.servicesIconSize}px`,
                                height: `${settings.servicesIconSize}px`
                              }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                            </svg>
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span
                              className="font-semibold text-foreground"
                              style={{ fontSize: `${settings.servicesFontSize}px` }}
                            >
                              Another Service
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bookmarks Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-base font-semibold text-foreground">Bookmarks</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="bookmarksIconSize">Icon Size</Label>
                        <span className="text-sm text-muted-foreground">{settings.bookmarksIconSize}px</span>
                      </div>
                      <input
                        type="range"
                        id="bookmarksIconSize"
                        min="16"
                        max="64"
                        step="4"
                        value={settings.bookmarksIconSize}
                        onChange={(e) => setSettings({ ...settings, bookmarksIconSize: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="bookmarksFontSize">Font Size</Label>
                        <span className="text-sm text-muted-foreground">{settings.bookmarksFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        id="bookmarksFontSize"
                        min="10"
                        max="20"
                        step="1"
                        value={settings.bookmarksFontSize}
                        onChange={(e) => setSettings({ ...settings, bookmarksFontSize: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="descriptionSpacing">Description Spacing</Label>
                        <span className="text-sm text-muted-foreground">{settings.descriptionSpacing}px</span>
                      </div>
                      <input
                        type="range"
                        id="descriptionSpacing"
                        min="-8"
                        max="12"
                        step="1"
                        value={settings.descriptionSpacing}
                        onChange={(e) => setSettings({ ...settings, descriptionSpacing: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="itemSpacing">Item Spacing</Label>
                        <span className="text-sm text-muted-foreground">{settings.itemSpacing}px</span>
                      </div>
                      <input
                        type="range"
                        id="itemSpacing"
                        min="0"
                        max="18"
                        step="1"
                        value={settings.itemSpacing}
                        onChange={(e) => setSettings({ ...settings, itemSpacing: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    {/* Bookmarks Preview */}
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-3">Preview:</p>
                      <div
                        className="flex flex-col bg-background rounded-lg border border-border p-2"
                        style={{ gap: `${settings.itemSpacing}px` }}
                      >
                        <div className="flex items-start gap-3 p-3 hover:bg-accent rounded transition-colors">
                          <div
                            className="flex items-center justify-center flex-shrink-0 text-primary"
                            style={{
                              width: `${settings.bookmarksIconSize + 8}px`,
                              height: `${settings.bookmarksIconSize + 8}px`
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              style={{
                                width: `${settings.bookmarksIconSize}px`,
                                height: `${settings.bookmarksIconSize}px`
                              }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                            </svg>
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span
                              className="font-medium text-foreground"
                              style={{ fontSize: `${settings.bookmarksFontSize}px` }}
                            >
                              Example Bookmark
                            </span>
                            <span
                              className="text-muted-foreground line-clamp-2"
                              style={{
                                fontSize: `${settings.bookmarksFontSize - 2}px`,
                                marginTop: `${settings.descriptionSpacing}px`
                              }}
                            >
                              This is how your bookmark will appear with a description
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-accent rounded transition-colors">
                          <div
                            className="flex items-center justify-center flex-shrink-0 text-primary"
                            style={{
                              width: `${settings.bookmarksIconSize + 8}px`,
                              height: `${settings.bookmarksIconSize + 8}px`
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              style={{
                                width: `${settings.bookmarksIconSize}px`,
                                height: `${settings.bookmarksIconSize}px`
                              }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                            </svg>
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span
                              className="font-medium text-foreground"
                              style={{ fontSize: `${settings.bookmarksFontSize}px` }}
                            >
                              Another Link
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Defaults for New Items</CardTitle>
                <CardDescription>
                  Set default values when creating new categories, bookmarks, and services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Bookmark Category Defaults */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-base font-semibold text-foreground">Bookmark Category Defaults</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultBookmarkCategoryEnabled">Enabled</Label>
                      <Switch
                        id="defaultBookmarkCategoryEnabled"
                        checked={settings.defaultBookmarkCategoryEnabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultBookmarkCategoryEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultBookmarkCategoryRequiresAuth">Requires Auth</Label>
                      <Switch
                        id="defaultBookmarkCategoryRequiresAuth"
                        checked={settings.defaultBookmarkCategoryRequiresAuth}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultBookmarkCategoryRequiresAuth: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultBookmarkCategoryShowItemCount">Show Item Count</Label>
                      <Switch
                        id="defaultBookmarkCategoryShowItemCount"
                        checked={settings.defaultBookmarkCategoryShowItemCount}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultBookmarkCategoryShowItemCount: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultBookmarkCategoryAutoExpanded">Auto Expanded</Label>
                      <Switch
                        id="defaultBookmarkCategoryAutoExpanded"
                        checked={settings.defaultBookmarkCategoryAutoExpanded}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultBookmarkCategoryAutoExpanded: checked })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="defaultBookmarkCategorySortBy">Sort Items By</Label>
                    <Select
                      value={settings.defaultBookmarkCategorySortBy}
                      onValueChange={(value) => setSettings({ ...settings, defaultBookmarkCategorySortBy: value })}
                    >
                      <SelectTrigger id="defaultBookmarkCategorySortBy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Manual Order (Drag & Drop)</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                        <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                        <SelectItem value="clicks">Most Clicked</SelectItem>
                        <SelectItem value="recent">Recently Added</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Service Category Defaults */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-base font-semibold text-foreground">Service Category Defaults</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultServiceCategoryEnabled">Enabled</Label>
                      <Switch
                        id="defaultServiceCategoryEnabled"
                        checked={settings.defaultServiceCategoryEnabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultServiceCategoryEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultServiceCategoryRequiresAuth">Requires Auth</Label>
                      <Switch
                        id="defaultServiceCategoryRequiresAuth"
                        checked={settings.defaultServiceCategoryRequiresAuth}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultServiceCategoryRequiresAuth: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultServiceCategoryShowItemCount">Show Item Count</Label>
                      <Switch
                        id="defaultServiceCategoryShowItemCount"
                        checked={settings.defaultServiceCategoryShowItemCount}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultServiceCategoryShowItemCount: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultServiceCategoryAutoExpanded">Auto Expanded</Label>
                      <Switch
                        id="defaultServiceCategoryAutoExpanded"
                        checked={settings.defaultServiceCategoryAutoExpanded}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultServiceCategoryAutoExpanded: checked })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="defaultServiceCategorySortBy">Sort Items By</Label>
                    <Select
                      value={settings.defaultServiceCategorySortBy}
                      onValueChange={(value) => setSettings({ ...settings, defaultServiceCategorySortBy: value })}
                    >
                      <SelectTrigger id="defaultServiceCategorySortBy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Manual Order (Drag & Drop)</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                        <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                        <SelectItem value="clicks">Most Clicked</SelectItem>
                        <SelectItem value="recent">Recently Added</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bookmark Defaults */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-base font-semibold text-foreground">Bookmark Defaults</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultBookmarkEnabled">Enabled</Label>
                      <Switch
                        id="defaultBookmarkEnabled"
                        checked={settings.defaultBookmarkEnabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultBookmarkEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultBookmarkRequiresAuth">Requires Auth</Label>
                      <Switch
                        id="defaultBookmarkRequiresAuth"
                        checked={settings.defaultBookmarkRequiresAuth}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultBookmarkRequiresAuth: checked })}
                      />
                    </div>
                  </div>
                </div>

                {/* Service Defaults */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-base font-semibold text-foreground">Service Defaults</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultServiceEnabled">Enabled</Label>
                      <Switch
                        id="defaultServiceEnabled"
                        checked={settings.defaultServiceEnabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultServiceEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="defaultServiceRequiresAuth">Requires Auth</Label>
                      <Switch
                        id="defaultServiceRequiresAuth"
                        checked={settings.defaultServiceRequiresAuth}
                        onCheckedChange={(checked) => setSettings({ ...settings, defaultServiceRequiresAuth: checked })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
