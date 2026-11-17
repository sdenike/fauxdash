'use client'

import { useCallback, useState, useEffect, useSyncExternalStore } from 'react'
import { AdminSection } from '@/components/admin/admin-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { AlertMessage } from '@/components/ui/alert-message'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { SettingsTabProps } from './types'

const subscribeNoop = () => () => {}

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
  // Callback URL needs window.location; server snapshot is the relative path.
  const callbackUrl = useSyncExternalStore(
    subscribeNoop,
    () => `${window.location.origin}/api/auth/callback/oidc`,
    () => '/api/auth/callback/oidc'
  )

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
    <AdminSection title="OIDC Authentication" description="Configure OpenID Connect (OIDC) authentication provider for single sign-on">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="flex items-center justify-between sm:col-span-2">
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
              <Label htmlFor="oidcProviderName">Provider name</Label>
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
              <Label htmlFor="oidcClientSecret">Client secret</Label>
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

            <div className="sm:col-span-2">
              <AlertMessage
                variant="info"
                message={`Configure this callback URL in your OIDC provider: ${callbackUrl}`}
              />
            </div>

            {/* Test OIDC Connection */}
            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4 sm:col-span-2">
              <div>
                <h4 className="font-medium mb-2">Test configuration</h4>
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

              <div className="border-t border-border pt-4">
                <h4 className="font-medium mb-2">Test authentication flow</h4>
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
                <div className={`mt-2 p-3 rounded-md animate-in fade-in slide-in-from-top-1 duration-200 ${authTestResult.success ? 'bg-success-soft border border-success/30' : 'bg-destructive-soft border border-destructive/30'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    {authTestResult.success ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0 text-destructive" aria-hidden="true" />
                    )}
                    <span className={authTestResult.success ? 'text-success font-medium' : 'text-destructive font-medium'}>
                      {authTestResult.success ? 'Authentication test passed!' : 'Authentication test failed'}
                    </span>
                  </div>
                  {authTestResult.success && authTestResult.userEmail && (
                    <div className="mt-2 pl-6 text-xs text-success">
                      Successfully authenticated as: <span className="font-mono">{authTestResult.userEmail}</span>
                    </div>
                  )}
                  {authTestResult.error && (
                    <div className="mt-2 pl-6 text-xs text-destructive">
                      Error: {authTestResult.error}
                    </div>
                  )}
                </div>
              )}

              {testResult && (
                <div className={`mt-2 p-3 rounded-md animate-in fade-in slide-in-from-top-1 duration-200 ${testResult.success ? 'bg-success-soft border border-success/30' : 'bg-destructive-soft border border-destructive/30'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0 text-destructive" aria-hidden="true" />
                    )}
                    <span className={testResult.success ? 'text-success font-medium' : 'text-destructive font-medium'}>
                      {testResult.success ? (testResult.message || 'OIDC configuration is valid') : (testResult.error || 'OIDC test failed')}
                    </span>
                  </div>
                  {testResult.success && testResult.callbackUrl && (
                    <div className="mt-2 pl-6 text-xs text-success space-y-1">
                      <div className="font-medium">Callback URL to configure:</div>
                      <code className="block px-2 py-1 bg-success-soft rounded">
                        {testResult.callbackUrl.url}
                      </code>
                    </div>
                  )}
                  {testResult.details && testResult.details.stage && (
                    <div className="mt-2 pl-6 text-xs text-destructive">
                      Failed at stage: {testResult.details.stage}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Disable Password Login */}
            <div className="border-t border-border pt-5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="disablePasswordLogin">OIDC-only mode</Label>
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

        <div className="border-t border-border pt-5 sm:col-span-2">
          <AlertMessage
            variant="info"
            message="✨ OIDC settings now reload automatically! No container restart needed - changes take effect immediately after saving."
          />
        </div>
      </div>
    </AdminSection>
  )
}
