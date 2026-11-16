'use client'

import { useCallback, useState } from 'react'
import { AdminSection } from '@/components/admin/admin-page'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { SettingsTabProps } from './types'
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

export function RedisTab({ settings, onSettingsChange }: SettingsTabProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/redis/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: settings.redisHost,
          port: settings.redisPort,
          password: settings.redisPassword,
          database: settings.redisDatabase,
        }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <AdminSection title="Redis Cache" description="Configure an external Redis server for improved performance caching">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="flex items-center justify-between sm:col-span-2">
          <div>
            <Label htmlFor="redisEnabled">Enable Redis cache</Label>
            <p className="text-sm text-muted-foreground">
              Use Redis for caching API responses and session data
            </p>
          </div>
          <Switch
            id="redisEnabled"
            checked={settings.redisEnabled}
            onCheckedChange={(checked) => updateSetting('redisEnabled', checked)}
          />
        </div>

        {settings.redisEnabled && (
          <>
            <div className="rounded-lg bg-muted/50 p-4 sm:col-span-2">
              <p className="text-sm text-muted-foreground">
                Redis is not included with Faux|Dash. You need to provide your own Redis server.
                You can run Redis locally, use a managed service, or deploy with Docker:
              </p>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                docker run -d --name redis -p 6379:6379 redis:7-alpine
              </pre>
            </div>

            <div>
              <Label htmlFor="redisHost">Redis host</Label>
              <Input
                id="redisHost"
                value={settings.redisHost}
                onChange={(e) => updateSetting('redisHost', e.target.value)}
                placeholder="localhost"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hostname or IP address of your Redis server
              </p>
            </div>

            <div>
              <Label htmlFor="redisPort">Redis port</Label>
              <Input
                id="redisPort"
                type="number"
                min="1"
                max="65535"
                value={settings.redisPort}
                onChange={(e) => updateSetting('redisPort', parseInt(e.target.value) || 6379)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default Redis port is 6379
              </p>
            </div>

            <div>
              <Label htmlFor="redisPassword">Redis password (optional)</Label>
              <Input
                id="redisPassword"
                type="password"
                value={settings.redisPassword}
                onChange={(e) => updateSetting('redisPassword', e.target.value)}
                placeholder="Leave empty if no authentication required"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only required if your Redis server has authentication enabled
              </p>
            </div>

            <div>
              <Label htmlFor="redisDatabase">Redis database</Label>
              <Input
                id="redisDatabase"
                type="number"
                min="0"
                max="15"
                value={settings.redisDatabase}
                onChange={(e) => updateSetting('redisDatabase', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Redis database index (0-15). Default is 0.
              </p>
            </div>

            <div className="border-t border-border pt-5 sm:col-span-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={testing}
                  className="gap-2"
                >
                  <RefreshCw aria-hidden="true" className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
              {testResult && (
                <div className={`mt-3 p-3 rounded-lg ${testResult.success ? 'bg-success-soft border border-success/30' : 'bg-destructive-soft border border-destructive/30'}`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle aria-hidden="true" className="h-5 w-5 text-destructive" />
                    )}
                    <span className={`font-medium ${testResult.success ? 'text-success' : 'text-destructive'}`}>
                      {testResult.message}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!settings.redisEnabled && (
          <div className="rounded-lg bg-muted/30 p-4 sm:col-span-2">
            <p className="text-sm text-muted-foreground">
              Redis caching is disabled. The application will use in-memory caching which works fine for most use cases.
              Enable Redis if you need persistent caching or are running multiple instances.
            </p>
          </div>
        )}
      </div>
    </AdminSection>
  )
}
