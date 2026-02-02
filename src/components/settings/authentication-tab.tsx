'use client'

import { useCallback, useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { AlertMessage } from '@/components/ui/alert-message'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { SettingsTabProps } from './types'

export function AuthenticationTab({ settings, onSettingsChange }: SettingsTabProps) {
  const { toast } = useToast()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [callbackUrl, setCallbackUrl] = useState('/api/auth/callback/oidc')

  useEffect(() => {
    // Set callback URL on client side only
    setCallbackUrl(`${window.location.origin}/api/auth/callback/oidc`)
  }, [])

  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  const handleTestOidc = useCallback(async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/settings/oidc-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: settings.oidcClientId,
          clientSecret: settings.oidcClientSecret || undefined,
          issuerUrl: settings.oidcIssuerUrl,
        }),
      })
      const data = await response.json()
      setTestResult(data)
      if (data.success) {
        toast({
          variant: 'success',
          title: 'Connection successful',
          description: 'OIDC configuration is valid.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection failed',
          description: data.error || 'OIDC test failed.',
        })
      }
    } catch (error) {
      console.error('Failed to test OIDC:', error)
      setTestResult({ success: false, error: 'Failed to test OIDC connection' })
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to test OIDC connection.',
      })
    } finally {
      setTesting(false)
    }
  }, [settings.oidcClientId, settings.oidcClientSecret, settings.oidcIssuerUrl, toast])

  return (
    <Card>
      <CardHeader>
        <CardTitle>OIDC Authentication</CardTitle>
        <CardDescription>
          Configure OpenID Connect (OIDC) authentication provider for single sign-on
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="oidcEnabled">Enable OIDC</Label>
            <p className="text-sm text-muted-foreground">
              Allow users to authenticate with an OIDC provider
            </p>
          </div>
          <Switch
            id="oidcEnabled"
            checked={settings.oidcEnabled}
            onCheckedChange={(checked) => updateSetting('oidcEnabled', checked)}
          />
        </div>

        {settings.oidcEnabled && (
          <>
            <div>
              <Label htmlFor="oidcProviderName">Provider Name</Label>
              <Input
                id="oidcProviderName"
                value={settings.oidcProviderName}
                onChange={(e) => updateSetting('oidcProviderName', e.target.value)}
                placeholder="Authentik, Keycloak, Okta, etc."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Display name for the OIDC provider (shown on login button)
              </p>
            </div>

            <div>
              <Label htmlFor="oidcClientId">Client ID</Label>
              <Input
                id="oidcClientId"
                value={settings.oidcClientId}
                onChange={(e) => updateSetting('oidcClientId', e.target.value)}
                placeholder="your-client-id"
              />
              <p className="text-xs text-muted-foreground mt-1">
                OAuth Client ID from your OIDC provider
              </p>
            </div>

            <div>
              <Label htmlFor="oidcClientSecret">Client Secret</Label>
              <Input
                id="oidcClientSecret"
                type="password"
                value={settings.oidcClientSecret}
                onChange={(e) => updateSetting('oidcClientSecret', e.target.value)}
                placeholder="Enter new secret to change"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground mt-1">
                OAuth Client Secret (leave blank to keep existing)
              </p>
            </div>

            <div>
              <Label htmlFor="oidcIssuerUrl">Issuer URL</Label>
              <Input
                id="oidcIssuerUrl"
                type="url"
                value={settings.oidcIssuerUrl}
                onChange={(e) => updateSetting('oidcIssuerUrl', e.target.value)}
                placeholder="https://auth.example.com/application/o/your-app/"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The issuer URL from your OIDC provider (should end with a trailing slash)
              </p>
            </div>

            <div className="pt-4 border-t">
              <AlertMessage
                variant="info"
                message={`Configure this callback URL in your OIDC provider: ${callbackUrl}`}
              />
            </div>

            {/* Test OIDC Connection */}
            <div className="pt-4 border-t bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Test Configuration</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Test your OIDC connection to verify your settings are working correctly.
                Make sure to save your settings first before testing.
              </p>
              <Button
                variant="outline"
                onClick={handleTestOidc}
                disabled={testing || !settings.oidcClientId || !settings.oidcIssuerUrl}
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Testing...
                  </>
                ) : (
                  'Test OIDC Connection'
                )}
              </Button>
              {testResult && (
                <div className={`mt-2 p-2 rounded-md flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200 ${testResult.success ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  )}
                  <span>{testResult.success ? (testResult.message || 'OIDC configuration is valid') : (testResult.error || 'OIDC test failed')}</span>
                </div>
              )}
            </div>

            {/* Disable Password Login */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="disablePasswordLogin">OIDC-Only Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Disable password login and require OIDC authentication
                  </p>
                  <p className="text-xs text-destructive mt-1">
                    Warning: Make sure OIDC is working before enabling this!
                  </p>
                </div>
                <Switch
                  id="disablePasswordLogin"
                  checked={settings.disablePasswordLogin}
                  onCheckedChange={(checked) => updateSetting('disablePasswordLogin', checked)}
                  disabled={!settings.oidcEnabled}
                />
              </div>
            </div>
          </>
        )}

        <div className="pt-4 border-t">
          <AlertMessage
            variant="warning"
            message="Changes to OIDC settings require an application restart to take effect."
          />
        </div>
      </CardContent>
    </Card>
  )
}
