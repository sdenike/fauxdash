'use client'

import { useToast } from '@/components/ui/use-toast'
import { useCallback, useState, useMemo } from 'react'
import { AdminSection } from '@/components/admin/admin-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { SettingsTabProps } from './types'
import { WeatherLocationManager } from './weather-location-manager'

export function WeatherTab({ settings, onSettingsChange }: SettingsTabProps) {
  const { toast } = useToast()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Parse locations from comma-separated string to array
  const locations = useMemo(() => {
    return settings.weatherLocations
      ? settings.weatherLocations.split(',').map((l: string) => l.trim()).filter(Boolean)
      : []
  }, [settings.weatherLocations])

  // Handle location changes from the manager
  const handleLocationsChange = useCallback((newLocations: string[]) => {
    onSettingsChange({ ...settings, weatherLocations: newLocations.join(',') })
  }, [settings, onSettingsChange])

  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  const handleTestConnection = useCallback(async () => {
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
  }, [settings])

  const handleGetLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSettingsChange({
            ...settings,
            weatherLatitude: position.coords.latitude.toFixed(4),
            weatherLongitude: position.coords.longitude.toFixed(4)
          })
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED && window.location.protocol === 'http:') {
            toast({ variant: 'destructive', title: 'Location needs HTTPS', description: 'Open the site over HTTPS, or enter the coordinates by hand (latlong.net finds them).' })
          } else {
            toast({ variant: 'destructive', title: 'Could not get your location', description: error.message })
          }
        }
      )
    } else {
      toast({ variant: 'destructive', title: 'This browser cannot share its location', description: 'Enter the coordinates by hand.' })
    }
  }, [settings, onSettingsChange, toast])

  return (
    <AdminSection title="Weather Widget" description="Configure weather display on your homepage">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="flex items-center justify-between sm:col-span-2">
          <div>
            <Label htmlFor="weatherEnabled">Enable weather widget</Label>
            <p className="text-sm text-muted-foreground">
              Show weather information on your homepage
            </p>
          </div>
          <Switch
            id="weatherEnabled"
            checked={settings.weatherEnabled}
            onCheckedChange={(checked) => updateSetting('weatherEnabled', checked)}
          />
        </div>

        {settings.weatherEnabled && (
          <>
            <div>
              <Label htmlFor="weatherDisplayMode">Header display</Label>
              <Select
                value={settings.weatherDisplayMode}
                onValueChange={(value: 'icon' | 'temp' | 'both') => updateSetting('weatherDisplayMode', value)}
              >
                <SelectTrigger id="weatherDisplayMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Icon & Temperature</SelectItem>
                  <SelectItem value="icon">Icon only</SelectItem>
                  <SelectItem value="temp">Temperature only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between sm:col-span-2">
              <div>
                <Label htmlFor="weatherShowPopup">Show details on hover</Label>
                <p className="text-sm text-muted-foreground">
                  Display detailed weather info when hovering
                </p>
              </div>
              <Switch
                id="weatherShowPopup"
                checked={settings.weatherShowPopup}
                onCheckedChange={(checked) => updateSetting('weatherShowPopup', checked)}
              />
            </div>

            <div>
              <Label htmlFor="weatherProvider">Weather provider</Label>
              <Select
                value={settings.weatherProvider}
                onValueChange={(value) => updateSetting('weatherProvider', value)}
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
                  <Label htmlFor="tempestApiKey">Tempest API key</Label>
                  <Input
                    id="tempestApiKey"
                    type="password"
                    value={settings.tempestApiKey}
                    onChange={(e) => updateSetting('tempestApiKey', e.target.value)}
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
                    onChange={(e) => updateSetting('tempestStationId', e.target.value)}
                    placeholder="Your Tempest station ID"
                  />
                </div>
              </>
            )}

            {settings.weatherProvider === 'weatherapi' && (
              <div>
                <Label htmlFor="weatherapiKey">WeatherAPI key</Label>
                <Input
                  id="weatherapiKey"
                  type="password"
                  value={settings.weatherapiKey}
                  onChange={(e) => updateSetting('weatherapiKey', e.target.value)}
                  placeholder="Your WeatherAPI key"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get a free API key from <a href="https://www.weatherapi.com/signup.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">WeatherAPI.com</a>
                </p>
              </div>
            )}

            {settings.weatherProvider === 'openweather' && (
              <div>
                <Label htmlFor="openweatherKey">OpenWeather API key</Label>
                <Input
                  id="openweatherKey"
                  type="password"
                  value={settings.openweatherKey}
                  onChange={(e) => updateSetting('openweatherKey', e.target.value)}
                  placeholder="Your OpenWeather API key"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get a free API key from <a href="https://home.openweathermap.org/users/sign_up" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenWeatherMap</a>
                </p>
              </div>
            )}

            <div className="sm:col-span-2">
              <WeatherLocationManager
                locations={locations}
                onChange={handleLocationsChange}
              />
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:col-span-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="weatherLatitude">Latitude (Optional)</Label>
                <Input
                  id="weatherLatitude"
                  value={settings.weatherLatitude}
                  onChange={(e) => updateSetting('weatherLatitude', e.target.value)}
                  placeholder="40.7128"
                />
              </div>
              <div>
                <Label htmlFor="weatherLongitude">Longitude (Optional)</Label>
                <Input
                  id="weatherLongitude"
                  value={settings.weatherLongitude}
                  onChange={(e) => updateSetting('weatherLongitude', e.target.value)}
                  placeholder="-74.0060"
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground sm:col-span-2">
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={handleGetLocation}
              >
                Use my current location
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

            <div className="border-t border-border pt-5 sm:col-span-2">
              <Button
                onClick={handleTestConnection}
                disabled={testing}
                variant="outline"
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              {testResult && (
                <div className={`mt-3 p-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${testResult.success ? 'bg-success-soft text-success border border-success/30' : 'bg-destructive-soft text-destructive border border-destructive/30'}`}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  )}
                  <p className="text-sm font-medium">
                    {testResult.message}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminSection>
  )
}
