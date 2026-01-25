'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

interface Settings {
  searchEngine: string
  defaultTheme: string
  weatherEnabled: boolean
  weatherProvider: string
  weatherLocations: string
  weatherAutoRotate: number
  // Weather API keys
  tempestApiKey: string
  tempestStationId: string
  weatherapiKey: string
  openweatherKey: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [settings, setSettings] = useState<Settings>({
    searchEngine: 'duckduckgo',
    defaultTheme: 'system',
    weatherEnabled: false,
    weatherProvider: 'tempest',
    weatherLocations: '90210',
    weatherAutoRotate: 30,
    tempestApiKey: '',
    tempestStationId: '',
    weatherapiKey: '',
    openweatherKey: '',
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Engine</CardTitle>
                <CardDescription>
                  Choose your default search engine for the search bar
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                  </SelectContent>
                </Select>
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
                      <Label htmlFor="weatherProvider">Weather Provider</Label>
                      <Select
                        value={settings.weatherProvider}
                        onValueChange={(value) => setSettings({ ...settings, weatherProvider: value })}
                      >
                        <SelectTrigger id="weatherProvider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tempest">Tempest Weather (Recommended)</SelectItem>
                          <SelectItem value="weatherapi">WeatherAPI.com</SelectItem>
                          <SelectItem value="openweather">OpenWeatherMap</SelectItem>
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
                      <Label htmlFor="weatherLocations">Locations (ZIP Codes)</Label>
                      <Input
                        id="weatherLocations"
                        value={settings.weatherLocations}
                        onChange={(e) => setSettings({ ...settings, weatherLocations: e.target.value })}
                        placeholder="90210,10001"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Comma-separated list of US ZIP codes
                      </p>
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
                        {testing ? 'Testing Connection...' : 'Test Connection'}
                      </Button>
                      {testResult && (
                        <div className={`mt-3 p-3 rounded-md ${testResult.success ? 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100' : 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100'}`}>
                          <p className="text-sm font-medium">
                            {testResult.success ? '✓ ' : '✗ '}
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

          <TabsContent value="appearance" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Customize the appearance of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="defaultTheme">Default Theme</Label>
                <Select
                  value={settings.defaultTheme}
                  onValueChange={(value) => setSettings({ ...settings, defaultTheme: value })}
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </main>
    </div>
  )
}
