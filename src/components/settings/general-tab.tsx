'use client'

import { useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SettingsTabProps } from './types'

export function GeneralTab({ settings, onSettingsChange }: SettingsTabProps) {
  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  return (
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
            onCheckedChange={(checked) => updateSetting('searchEnabled', checked)}
          />
        </div>

        {settings.searchEnabled && (
          <>
            <div>
              <Label htmlFor="searchEngine">Search Engine</Label>
              <Select
                value={settings.searchEngine}
                onValueChange={(value) => updateSetting('searchEngine', value)}
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
                    onChange={(e) => updateSetting('customSearchName', e.target.value)}
                    placeholder="My Search Engine"
                  />
                </div>
                <div>
                  <Label htmlFor="customSearchUrl">Custom Search URL</Label>
                  <Input
                    id="customSearchUrl"
                    value={settings.customSearchUrl}
                    onChange={(e) => updateSetting('customSearchUrl', e.target.value)}
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
            onCheckedChange={(checked) => updateSetting('searchInHeader', checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
