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
  const [testingAuth, setTestingAuth] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    callbackUrl?: { url: string; format: string; notes: string[] };
    details?: { stage?: string; [key: string]: any };
  } | null>(null)
  const [authTestResult, setAuthTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    userEmail?: string;
  } | null>(null)
  const [callbackUrl, setCallbackUrl] = useState('/api/auth/callback/oidc')

  useEffect(() => {
    // Set callback URL on client side only
    setCallbackUrl(`${window.location.origin}/api/auth/callback/oidc`)
  }, [])

  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  const handleTestAuthFlow = useCallback(() => {
    if (!settings.oidcEnabled || !settings.oidcClientId || !settings.oidcIssuerUrl) {
      toast({
        variant: 'destructive',
        title: 'Missing configuration',
        description: 'Please save OIDC settings first before testing authentication.',
      })
      return
    }

    setTestingAuth(true)
    setAuthTestResult(null)

    // Open authentication test in popup
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      '/api/auth/test-signin',
      'oidc-test',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no`
    )

    // Listen for messages from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oidc-test-result') {
        setTestingAuth(false)
        setAuthTestResult({
          success: event.data.success,
          message: event.data.message,
          error: event.data.error,
          userEmail: event.data.userEmail,
        })

        if (event.data.success) {
          toast({
            variant: 'success',
            title: 'Authentication successful',
            description: `Successfully authenticated as ${event.data.userEmail}`,
          })
        } else {
          toast({
            variant: 'destructive',
            title: 'Authentication failed',
            description: event.data.error || 'OIDC authentication test failed',
          })
        }

        window.removeEventListener('message', handleMessage)
        popup?.close()
      }
    }

    window.addEventListener('message', handleMessage)

    // Cleanup if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        setTestingAuth(false)
        window.removeEventListener('message', handleMessage)
      }
    }, 500)
  }, [settings.oidcEnabled, settings.oidcClientId, settings.oidcIssuerUrl, toast])

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
            <div className="pt-4 border-t bg-muted/50 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Test Configuration</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Validates OIDC settings (issuer URL, scopes, endpoints) without authentication.
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
                    'Test Configuration'
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Test Authentication Flow</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Opens popup to test full OIDC authentication. Save settings first, then test.
                  <span className="block mt-1 text-xs">
                    ⚠️ This will attempt a real authentication with your OIDC provider.
                  </span>
                </p>
                <Button
                  variant="default"
                  onClick={handleTestAuthFlow}
                  disabled={testingAuth || !settings.oidcEnabled || !settings.oidcClientId || !settings.oidcIssuerUrl}
                >
                  {testingAuth ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Testing Authentication...
                    </>
                  ) : (
                    'Test Authentication Flow'
                  )}
                </Button>
              </div>
              {authTestResult && (
                <div className={`mt-2 p-3 rounded-md animate-in fade-in slide-in-from-top-1 duration-200 ${authTestResult.success ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    {authTestResult.success ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                    )}
                    <span className={authTestResult.success ? 'text-green-700 dark:text-green-300 font-medium' : 'text-red-700 dark:text-red-300 font-medium'}>
                      {authTestResult.success ? 'Authentication test passed!' : 'Authentication test failed'}
                    </span>
                  </div>
                  {authTestResult.success && authTestResult.userEmail && (
                    <div className="mt-2 pl-6 text-xs text-green-700 dark:text-green-300">
                      Successfully authenticated as: <span className="font-mono">{authTestResult.userEmail}</span>
                    </div>
                  )}
                  {authTestResult.error && (
                    <div className="mt-2 pl-6 text-xs text-red-700 dark:text-red-300">
                      Error: {authTestResult.error}
                    </div>
                  )}
                </div>
              )}

              {testResult && (
                <div className={`mt-2 p-3 rounded-md animate-in fade-in slide-in-from-top-1 duration-200 ${testResult.success ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                    )}
                    <span className={testResult.success ? 'text-green-700 dark:text-green-300 font-medium' : 'text-red-700 dark:text-red-300 font-medium'}>
                      {testResult.success ? (testResult.message || 'OIDC configuration is valid') : (testResult.error || 'OIDC test failed')}
                    </span>
                  </div>
                  {testResult.success && testResult.callbackUrl && (
                    <div className="mt-2 pl-6 text-xs text-green-700 dark:text-green-300 space-y-1">
                      <div className="font-medium">Callback URL to configure:</div>
                      <code className="block px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded">
                        {testResult.callbackUrl.url}
                      </code>
                    </div>
                  )}
                  {testResult.details && testResult.details.stage && (
                    <div className="mt-2 pl-6 text-xs text-red-700 dark:text-red-300">
                      Failed at stage: {testResult.details.stage}
                    </div>
                  )}
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
            variant="info"
            message="✨ OIDC settings now reload automatically! No container restart needed - changes take effect immediately after saving."
          />
        </div>
      </CardContent>
    </Card>
  )
}
