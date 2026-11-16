'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { AdminSection } from '@/components/admin/admin-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Mail } from 'lucide-react'
import { SettingsTabProps } from './types'

export function EmailTab({ settings, onSettingsChange }: SettingsTabProps) {
  const { toast } = useToast()
  const [testing, setTesting] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Track unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Clear timer on unmount
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [hasUnsavedChanges])

  const saveSmtpSettings = useCallback(async (currentSettings: typeof settings) => {
    try {
      // Only send SMTP-related settings to avoid overwriting other settings
      const smtpSettings = {
        smtpProvider: currentSettings.smtpProvider,
        smtpHost: currentSettings.smtpHost,
        smtpPort: currentSettings.smtpPort,
        smtpUsername: currentSettings.smtpUsername,
        smtpPassword: currentSettings.smtpPassword,
        smtpEncryption: currentSettings.smtpEncryption,
        smtpFromEmail: currentSettings.smtpFromEmail,
        smtpFromName: currentSettings.smtpFromName,
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpSettings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setHasUnsavedChanges(false)
      toast({
        title: 'Settings saved',
        description: 'Your SMTP settings have been saved automatically.',
      })
    } catch (error) {
      console.error('Auto-save failed:', error)
      toast({
        variant: 'destructive',
        title: 'Auto-save failed',
        description: 'Your changes could not be saved automatically. Please try again.',
      })
    }
  }, [toast])

  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setHasUnsavedChanges(true)
    onSettingsChange(newSettings)

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = setTimeout(() => {
      // Pass the new settings directly to avoid stale closure
      saveSmtpSettings(newSettings)
    }, 2000)
  }, [settings, onSettingsChange, saveSmtpSettings])

  const handleProviderChange = useCallback((value: 'none' | 'custom' | 'google') => {
    setHasUnsavedChanges(true)

    let newSettings
    if (value === 'google') {
      newSettings = {
        ...settings,
        smtpProvider: value,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpEncryption: 'tls' as const,
      }
    } else if (value === 'none') {
      newSettings = {
        ...settings,
        smtpProvider: value,
        smtpHost: '',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
      }
    } else {
      newSettings = { ...settings, smtpProvider: value }
    }

    onSettingsChange(newSettings)

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = setTimeout(() => {
      // Pass the new settings directly to avoid stale closure
      saveSmtpSettings(newSettings)
    }, 2000)
  }, [settings, onSettingsChange, saveSmtpSettings])

  const handleTestConnection = useCallback(async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/settings/smtp-test', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Connection test failed')
      }

      const data = await response.json()
      if (data.success) {
        setTestResult({ success: true, message: 'SMTP connection successful!' })
        toast({
          variant: 'success',
          title: 'Connection successful',
          description: 'SMTP settings are configured correctly.',
        })
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed' })
        toast({
          variant: 'destructive',
          title: 'Connection failed',
          description: data.error || 'Failed to connect to SMTP server.',
        })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test connection' })
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to test SMTP connection.',
      })
    } finally {
      setTesting(false)
    }
  }, [toast])

  const handleSendTestEmail = useCallback(async () => {
    setSendingTest(true)
    try {
      const response = await fetch('/api/settings/smtp-send-test', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send test email')
      }

      const data = await response.json()
      toast({
        variant: 'success',
        title: 'Test email sent',
        description: data.message || 'Check your inbox.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send test email',
        description: error.message || 'Could not send test email. Please check your SMTP settings.',
      })
    } finally {
      setSendingTest(false)
    }
  }, [toast])

  return (
    <AdminSection
      title="Email / SMTP Configuration"
      description="Configure email settings for password resets and notifications"
      actions={
        hasUnsavedChanges ? (
          <div className="flex items-center gap-2 text-sm text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span>Unsaved changes (auto-saving...)</span>
          </div>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="smtpProvider">Email provider</Label>
          <Select
            value={settings.smtpProvider}
            onValueChange={handleProviderChange}
          >
            <SelectTrigger id="smtpProvider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Disabled</SelectItem>
              <SelectItem value="google">Google / Gmail</SelectItem>
              <SelectItem value="custom">Custom SMTP</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Select your email provider for sending password reset emails
          </p>
        </div>

        {settings.smtpProvider !== 'none' && (
          <>
            {settings.smtpProvider === 'google' && (
              <div className="rounded-lg border border-info/30 bg-info-soft p-4 sm:col-span-2">
                <h4 className="text-sm font-semibold text-info mb-2">Google / gmail setup</h4>
                <p className="text-xs text-info mb-2">
                  To use Gmail SMTP, you need to create an App Password:
                </p>
                <ol className="text-xs text-info list-decimal list-inside space-y-1">
                  <li>Go to your Google Account settings</li>
                  <li>Navigate to Security → 2-Step Verification (must be enabled)</li>
                  <li>At the bottom, select App passwords</li>
                  <li>Create a new app password for &quot;Mail&quot;</li>
                  <li>Use that 16-character password below</li>
                </ol>
                <p className="text-xs text-info mt-2">
                  <a
                    href="https://support.google.com/accounts/answer/185833"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    Learn more about App Passwords
                  </a>
                </p>
              </div>
            )}

            {settings.smtpProvider === 'custom' && (
              <>
                <>
                  <div>
                    <Label htmlFor="smtpHost">SMTP host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpHost}
                      onChange={(e) => updateSetting('smtpHost', e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => updateSetting('smtpPort', parseInt(e.target.value) || 587)}
                      placeholder="587"
                    />
                  </div>
                </>

                <div>
                  <Label htmlFor="smtpEncryption">Encryption</Label>
                  <Select
                    value={settings.smtpEncryption}
                    onValueChange={(value: 'none' | 'tls' | 'ssl') => updateSetting('smtpEncryption', value)}
                  >
                    <SelectTrigger id="smtpEncryption">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS (Port 587 - Recommended)</SelectItem>
                      <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                      <SelectItem value="none">None (Not Recommended)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="border-t border-border pt-5 sm:col-span-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Authentication</h3>
              </div>
            </div>

            <div>
              <Label htmlFor="smtpUsername">
                {settings.smtpProvider === 'google' ? 'Gmail Address' : 'SMTP Username'}
              </Label>
              <Input
                id="smtpUsername"
                type="email"
                value={settings.smtpUsername}
                onChange={(e) => updateSetting('smtpUsername', e.target.value)}
                placeholder={settings.smtpProvider === 'google' ? 'your-email@gmail.com' : 'username'}
              />
            </div>

            <div>
              <Label htmlFor="smtpPassword">
                {settings.smtpProvider === 'google' ? 'App Password' : 'SMTP Password'}
              </Label>
              <Input
                id="smtpPassword"
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => updateSetting('smtpPassword', e.target.value)}
                placeholder={settings.smtpProvider === 'google' ? '16-character app password' : 'password'}
              />
            </div>

            <div className="border-t border-border pt-5 sm:col-span-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Sender information</h3>
              </div>
            </div>

            <>
              <div>
                <Label htmlFor="smtpFromEmail">From email</Label>
                <Input
                  id="smtpFromEmail"
                  type="email"
                  value={settings.smtpFromEmail}
                  onChange={(e) => updateSetting('smtpFromEmail', e.target.value)}
                  placeholder={settings.smtpUsername || 'noreply@example.com'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use the username
                </p>
              </div>
              <div>
                <Label htmlFor="smtpFromName">From name</Label>
                <Input
                  id="smtpFromName"
                  value={settings.smtpFromName}
                  onChange={(e) => updateSetting('smtpFromName', e.target.value)}
                  placeholder="Faux|Dash"
                />
              </div>
            </>

            {/* Verification Status Banner */}
            {!settings.smtpVerified ? (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-4 sm:col-span-2">
                <XCircle className="h-5 w-5 text-destructive flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-destructive">SMTP Not Verified</p>
                  <p className="text-xs text-destructive">Send a test email and click the verification link to activate.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success-soft p-4 sm:col-span-2">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-success">SMTP Verified</p>
                  <p className="text-xs text-success">Your email configuration is active and working.</p>
                </div>
              </div>
            )}

            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4 sm:col-span-2">
              <div>
                <h4 className="font-medium mb-2">Test connection</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Test your SMTP connection to verify your settings are working correctly.
                </p>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !settings.smtpHost || !settings.smtpUsername || !settings.smtpPassword}
                >
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                {testResult && (
                  <div className={`mt-2 p-2 rounded-md flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200 ${testResult.success ? 'bg-success-soft text-success border border-success/30' : 'bg-destructive-soft text-destructive border border-destructive/30'}`}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-medium mb-2">Send test email & verify</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Send a test email to your admin email address. You must click the verification link in the email to activate SMTP.
                </p>
                <Button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest || !settings.smtpHost || !settings.smtpUsername || !settings.smtpPassword}
                >
                  {sendingTest ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminSection>
  )
}
