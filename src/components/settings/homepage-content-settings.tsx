'use client'

import { useCallback } from 'react'
import { AdminSection } from '@/components/admin/admin-page'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SettingsTabProps } from './types'

export function HomepageContentSettings({ settings, onSettingsChange }: SettingsTabProps) {
  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  return (
    <AdminSection
      title="Homepage Description"
      description="Display a custom description on your homepage visible to all visitors"
      className="space-y-6"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="homepageDescriptionEnabled">Enable homepage description</Label>
            <p className="text-sm text-muted-foreground">
              Show a custom message on the homepage
            </p>
          </div>
          <Switch
            id="homepageDescriptionEnabled"
            checked={settings.homepageDescriptionEnabled}
            onCheckedChange={(checked) => updateSetting('homepageDescriptionEnabled', checked)}
          />
        </div>

        {settings.homepageDescriptionEnabled && (
          <div>
            <Label htmlFor="homepageDescription">Description text</Label>
            <Textarea
              id="homepageDescription"
              value={settings.homepageDescription}
              onChange={(e) => updateSetting('homepageDescription', e.target.value)}
              placeholder="Welcome to your personal dashboard..."
              rows={3}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              This text is visible to all visitors, including logged-out users.
              For personalized messages that use variables like {'{'}{'{'} username {'}'}{'}'}, use the Welcome Message setting instead.
            </p>
          </div>
        )}
      </div>
    </AdminSection>
  )
}
