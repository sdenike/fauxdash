'use client'

import { useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SettingsTabProps } from './types'

export function GeoIPTab({ settings, onSettingsChange }: SettingsTabProps) {
  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  return (
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
            onCheckedChange={(checked) => updateSetting('geoipEnabled', checked)}
          />
        </div>

        {settings.geoipEnabled && (
          <>
            <div>
              <Label htmlFor="geoipProvider">GeoIP Provider</Label>
              <Select
                value={settings.geoipProvider}
                onValueChange={(value: 'maxmind' | 'ipinfo' | 'chain') => updateSetting('geoipProvider', value)}
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
                    onChange={(e) => updateSetting('geoipMaxmindPath', e.target.value)}
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
                    onChange={(e) => updateSetting('geoipMaxmindAccountId', e.target.value)}
                    placeholder="Your MaxMind account ID"
                  />
                </div>

                <div>
                  <Label htmlFor="geoipMaxmindLicenseKey">License Key (for auto-updates)</Label>
                  <Input
                    id="geoipMaxmindLicenseKey"
                    type="password"
                    value={settings.geoipMaxmindLicenseKey}
                    onChange={(e) => updateSetting('geoipMaxmindLicenseKey', e.target.value)}
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
                    onChange={(e) => updateSetting('geoipIpinfoToken', e.target.value)}
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

            <div>
              <Label htmlFor="geoipCacheDuration">Cache Duration (seconds)</Label>
              <Input
                id="geoipCacheDuration"
                type="number"
                min="0"
                value={settings.geoipCacheDuration}
                onChange={(e) => updateSetting('geoipCacheDuration', parseInt(e.target.value) || 86400)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long to cache GeoIP lookups (default: 86400 = 24 hours)
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
