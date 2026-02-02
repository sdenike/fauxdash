'use client'

import { useCallback, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { SettingsTabProps } from './types'
import { WeatherLocationManager } from './weather-location-manager'

export function WeatherTab({ settings, onSettingsChange }: SettingsTabProps) {
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
            alert('Geolocation requires HTTPS. Please access the site via HTTPS or manually enter coordinates using latlong.net')
          } else {
            alert('Unable to get location: ' + error.message)
          }
        }
      )
    } else {
      alert('Geolocation is not supported by your browser')
    }
  }, [settings, onSettingsChange])

  return (
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
            onCheckedChange={(checked) => updateSetting('weatherEnabled', checked)}
          />
        </div>

        {settings.weatherEnabled && (
          <>
            <div>
              <Label htmlFor="weatherDisplayMode">Header Display</Label>
              <Select
                value={settings.weatherDisplayMode}
                onValueChange={(value: 'icon' | 'temp' | 'both') => updateSetting('weatherDisplayMode', value)}
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
                onCheckedChange={(checked) => updateSetting('weatherShowPopup', checked)}
              />
            </div>

            <div>
              <Label htmlFor="weatherProvider">Weather Provider</Label>
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
                  <Label htmlFor="tempestApiKey">Tempest API Key</Label>
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
                <Label htmlFor="weatherapiKey">WeatherAPI Key</Label>
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
                <Label htmlFor="openweatherKey">OpenWeather API Key</Label>
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

            <div>
              <WeatherLocationManager
                locations={locations}
                onChange={handleLocationsChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            <div className="text-xs text-muted-foreground">
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

            <div className="pt-4 border-t">
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
                <div className={`mt-3 p-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${testResult.success ? 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800'}`}>
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
      </CardContent>
    </Card>
  )
}
