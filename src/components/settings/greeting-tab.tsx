'use client'

import { useCallback } from 'react'
import { AdminSection } from '@/components/admin/admin-page'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SettingsTabProps } from './types'

export function GreetingTab({ settings, onSettingsChange }: SettingsTabProps) {
  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  return (
    <AdminSection title="Welcome Message" description="Customize the welcome message on your homepage">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="welcomeMessageEnabled">Show Welcome message</Label>
            <p className="text-sm text-muted-foreground">
              Display welcome message on homepage
            </p>
          </div>
          <Switch
            id="welcomeMessageEnabled"
            checked={settings.welcomeMessageEnabled}
            onCheckedChange={(checked) => updateSetting('welcomeMessageEnabled', checked)}
          />
        </div>

        {settings.welcomeMessageEnabled && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="welcomeMessageTimeBased">Use Time-Based messages</Label>
                <p className="text-sm text-muted-foreground">
                  Show different messages based on time of day
                </p>
              </div>
              <Switch
                id="welcomeMessageTimeBased"
                checked={settings.welcomeMessageTimeBased}
                onCheckedChange={(checked) => updateSetting('welcomeMessageTimeBased', checked)}
              />
            </div>

            {settings.welcomeMessageTimeBased ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="welcomeMessageMorning">Morning message (5 AM - 12 PM)</Label>
                  <Input
                    id="welcomeMessageMorning"
                    value={settings.welcomeMessageMorning}
                    onChange={(e) => updateSetting('welcomeMessageMorning', e.target.value)}
                    placeholder="Good morning"
                  />
                </div>
                <div>
                  <Label htmlFor="welcomeMessageAfternoon">Afternoon message (12 PM - 5 PM)</Label>
                  <Input
                    id="welcomeMessageAfternoon"
                    value={settings.welcomeMessageAfternoon}
                    onChange={(e) => updateSetting('welcomeMessageAfternoon', e.target.value)}
                    placeholder="Good afternoon"
                  />
                </div>
                <div>
                  <Label htmlFor="welcomeMessageEvening">Evening message (5 PM - 5 AM)</Label>
                  <Input
                    id="welcomeMessageEvening"
                    value={settings.welcomeMessageEvening}
                    onChange={(e) => updateSetting('welcomeMessageEvening', e.target.value)}
                    placeholder="Good evening"
                  />
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Use variables: {'{{username}}'}, {'{{email}}'}, {'{{firstname}}'}, {'{{lastname}}'}
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="welcomeMessage">Welcome message text</Label>
                <Input
                  id="welcomeMessage"
                  value={settings.welcomeMessage}
                  onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
                  placeholder="Welcome back"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use variables: {'{{username}}'}, {'{{email}}'}, {'{{firstname}}'}, {'{{lastname}}'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminSection>
  )
}
