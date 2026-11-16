'use client'

import { useCallback } from 'react'
import { AdminSection } from '@/components/admin/admin-page'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SettingsTabProps } from './types'

export function DateTimeTab({ settings, onSettingsChange }: SettingsTabProps) {
  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  return (
    <AdminSection title="Date & Time Display" description="Display current date and time in the header">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="flex items-center justify-between sm:col-span-2">
          <div>
            <Label htmlFor="dateTimeEnabled">Show date & time</Label>
            <p className="text-sm text-muted-foreground">
              Display date and time in header
            </p>
          </div>
          <Switch
            id="dateTimeEnabled"
            checked={settings.dateTimeEnabled}
            onCheckedChange={(checked) => updateSetting('dateTimeEnabled', checked)}
          />
        </div>

        {settings.dateTimeEnabled && (
          <>
            <div>
              <Label htmlFor="dateTimePosition">Position in header</Label>
              <Select
                value={settings.dateTimePosition}
                onValueChange={(value: 'left' | 'center' | 'right') => updateSetting('dateTimePosition', value)}
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
              <Label htmlFor="dateTimeDisplayMode">Display mode</Label>
              <Select
                value={settings.dateTimeDisplayMode}
                onValueChange={(value: 'text' | 'icon') => updateSetting('dateTimeDisplayMode', value)}
              >
                <SelectTrigger id="dateTimeDisplayMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text (Show full date/time)</SelectItem>
                  <SelectItem value="icon">Clock icon (Hover to see details)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFormat">Date format</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value) => updateSetting('dateFormat', value)}
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

            <div className="flex items-center justify-between sm:col-span-2">
              <div>
                <Label htmlFor="timeEnabled">Show time</Label>
                <p className="text-sm text-muted-foreground">
                  Display current time with date
                </p>
              </div>
              <Switch
                id="timeEnabled"
                checked={settings.timeEnabled}
                onCheckedChange={(checked) => updateSetting('timeEnabled', checked)}
              />
            </div>

            {settings.timeEnabled && (
              <>
                <div>
                  <Label htmlFor="timeFormat">Time format</Label>
                  <Select
                    value={settings.timeFormat}
                    onValueChange={(value: '12' | '24') => updateSetting('timeFormat', value)}
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

                <div className="flex items-center justify-between sm:col-span-2">
                  <div>
                    <Label htmlFor="showSeconds">Show seconds</Label>
                    <p className="text-sm text-muted-foreground">
                      Display seconds in time
                    </p>
                  </div>
                  <Switch
                    id="showSeconds"
                    checked={settings.showSeconds}
                    onCheckedChange={(checked) => updateSetting('showSeconds', checked)}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AdminSection>
  )
}
