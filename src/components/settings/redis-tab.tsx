'use client'

import { useCallback, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { SettingsTabProps } from './types'
import { CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

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
    <Card>
      <CardHeader>
        <CardTitle>Redis Cache</CardTitle>
        <CardDescription>
          Configure an external Redis server for improved performance caching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="redisEnabled">Enable Redis Cache</Label>
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
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Redis is not included with Faux|Dash. You need to provide your own Redis server.
                You can run Redis locally, use a managed service, or deploy with Docker:
              </p>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                docker run -d --name redis -p 6379:6379 redis:7-alpine
              </pre>
            </div>

            <div>
              <Label htmlFor="redisHost">Redis Host</Label>
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
              <Label htmlFor="redisPort">Redis Port</Label>
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
              <Label htmlFor="redisPassword">Redis Password (Optional)</Label>
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
              <Label htmlFor="redisDatabase">Redis Database</Label>
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

            <div className="pt-4 border-t">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={testing}
                  className="gap-2"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
              {testResult && (
                <div className={`mt-3 p-3 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <span className={`font-medium ${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {testResult.message}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!settings.redisEnabled && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Redis caching is disabled. The application will use in-memory caching which works fine for most use cases.
              Enable Redis if you need persistent caching or are running multiple instances.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
