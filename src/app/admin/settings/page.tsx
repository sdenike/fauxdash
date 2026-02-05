'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { ErrorBoundary } from '@/components/error-boundary'
import { Loader2 } from 'lucide-react'
import {
  GeneralTab,
  GreetingTab,
  DateTimeTab,
  WeatherTab,
  GeoIPTab,
  EmailTab,
  AppearanceTab,
  AuthenticationTab,
  Settings,
  defaultSettings,
} from '@/components/settings'

function SettingsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Only fetch settings ONCE when session is first available
  // Do NOT re-fetch on session refresh (which happens on window focus)
  useEffect(() => {
    if (session && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchSettings()
    }
  }, [session, fetchSettings])

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
        description: 'Your settings have been updated successfully.',
      })
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
  }, [settings, toast])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your dashboard preferences
        </p>
      </div>

      <div className="max-w-4xl">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="greeting">Greeting</TabsTrigger>
            <TabsTrigger value="datetime">Date & Time</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="geoip">GeoIP</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="authentication">Auth</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <GeneralTab settings={settings} onSettingsChange={handleSettingsChange} />
          </TabsContent>

          <TabsContent value="greeting" className="space-y-4 mt-4">
            <GreetingTab settings={settings} onSettingsChange={handleSettingsChange} />
          </TabsContent>

          <TabsContent value="datetime" className="space-y-4 mt-4">
            <DateTimeTab settings={settings} onSettingsChange={handleSettingsChange} />
          </TabsContent>

          <TabsContent value="weather" className="space-y-4 mt-4">
            <WeatherTab settings={settings} onSettingsChange={handleSettingsChange} />
          </TabsContent>

          <TabsContent value="geoip" className="space-y-4 mt-4">
            <GeoIPTab settings={settings} onSettingsChange={handleSettingsChange} />
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <EmailTab settings={settings} onSettingsChange={handleSettingsChange} />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 mt-4">
            <AppearanceTab settings={settings} onSettingsChange={handleSettingsChange} />
          </TabsContent>

          <TabsContent value="authentication" className="space-y-4 mt-4">
            <AuthenticationTab settings={settings} onSettingsChange={handleSettingsChange} />
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving} aria-busy={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <SettingsContent />
    </ErrorBoundary>
  )
}
