'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { ErrorBoundary } from '@/components/error-boundary'
import { Loader2 } from 'lucide-react'
import { AdminPage, AdminLoading } from '@/components/admin/admin-page'
import {
  GeneralTab,
  GreetingTab,
  DateTimeTab,
  WeatherTab,
  GeoIPTab,
  EmailTab,
  AppearanceTab,
  AuthenticationTab,
  RedisTab,
  Settings,
  defaultSettings,
} from '@/components/settings'

function SettingsContent() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const hasFetchedRef = useRef(false)

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings', { cache: 'no-store' })
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch once. The admin layout has already checked the session on the server.
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchSettings()
    }
  }, [fetchSettings])

  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setSettings(newSettings)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast({
        variant: 'success',
        title: 'Settings saved',
        description: 'The start page uses them on its next load.',
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        variant: 'destructive',
        title: 'Settings not saved',
        description: 'The server did not accept them. Try again, or check Admin, Logs.',
      })
    } finally {
      setSaving(false)
    }
  }, [settings, toast])

  const tabs = [
    { value: 'general', label: 'General', Tab: GeneralTab },
    { value: 'appearance', label: 'Appearance', Tab: AppearanceTab },
    { value: 'greeting', label: 'Greeting', Tab: GreetingTab },
    { value: 'datetime', label: 'Date and time', Tab: DateTimeTab },
    { value: 'weather', label: 'Weather', Tab: WeatherTab },
    { value: 'authentication', label: 'Sign-in', Tab: AuthenticationTab },
    { value: 'email', label: 'Email', Tab: EmailTab },
    { value: 'geoip', label: 'GeoIP', Tab: GeoIPTab },
    { value: 'redis', label: 'Cache', Tab: RedisTab },
  ]

  const saveButton = (
    <Button onClick={handleSave} disabled={saving || loading} aria-busy={saving}>
      {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {saving ? 'Saving' : 'Save changes'}
    </Button>
  )

  return (
    <AdminPage title="Settings" description="Site-wide settings for the start page and the services behind it." actions={saveButton}>
      {loading ? (
        <AdminLoading rows={6} label="Loading settings" />
      ) : (
        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(({ value, Tab }) => (
            <TabsContent key={value} value={value} className="space-y-6">
              <Tab settings={settings} onSettingsChange={handleSettingsChange} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </AdminPage>
  )
}

export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <SettingsContent />
    </ErrorBoundary>
  )
}
