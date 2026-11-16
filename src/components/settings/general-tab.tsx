'use client'

import { useCallback } from 'react'
import { AdminSection } from '@/components/admin/admin-page'
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
    <div className="divide-y divide-border [&>section]:py-8 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
    <AdminSection title="Search" description="Configure your search preferences">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="flex items-center justify-between sm:col-span-2">
          <div>
            <Label htmlFor="searchEnabled">Enable search box</Label>
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
              <Label htmlFor="searchEngine">Search engine</Label>
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
                  <Label htmlFor="customSearchName">Custom search engine name</Label>
                  <Input
                    id="customSearchName"
                    value={settings.customSearchName}
                    onChange={(e) => updateSetting('customSearchName', e.target.value)}
                    placeholder="My Search Engine"
                  />
                </div>
                <div>
                  <Label htmlFor="customSearchUrl">Custom search URL</Label>
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

        <div className="flex items-center justify-between border-t border-border pt-5 sm:col-span-2">
          <div>
            <Label htmlFor="searchInHeader">Show search in header</Label>
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
      </div>
    </AdminSection>

    <AdminSection title="Logging" description="Configure application logging verbosity">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="logLevel">Log level</Label>
          <Select
            value={settings.logLevel}
            onValueChange={(value: 'error' | 'warn' | 'info' | 'debug') => updateSetting('logLevel', value)}
          >
            <SelectTrigger id="logLevel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="error">Errors only</SelectItem>
              <SelectItem value="warn">Warnings & Errors</SelectItem>
              <SelectItem value="info">Info, Warnings & Errors</SelectItem>
              <SelectItem value="debug">Debug (All Messages)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Controls which messages are written to the application log file. More verbose levels include all less verbose levels.
          </p>
        </div>
      </div>
    </AdminSection>
    </div>
  )
}
