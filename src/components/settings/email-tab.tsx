'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
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

  const handleAutoSave = useCallback(async () => {
    try {
      // Only send SMTP-related settings to avoid overwriting other settings
      const smtpSettings = {
        smtpProvider: settings.smtpProvider,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUsername: settings.smtpUsername,
        smtpPassword: settings.smtpPassword,
        smtpEncryption: settings.smtpEncryption,
        smtpFromEmail: settings.smtpFromEmail,
        smtpFromName: settings.smtpFromName,
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
  }, [settings, toast])

  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setHasUnsavedChanges(true)
    onSettingsChange({ ...settings, [key]: value })

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave()
    }, 2000)
  }, [settings, onSettingsChange, handleAutoSave])

  const handleProviderChange = useCallback((value: 'none' | 'custom' | 'google') => {
    setHasUnsavedChanges(true)

    if (value === 'google') {
      onSettingsChange({
        ...settings,
        smtpProvider: value,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpEncryption: 'tls' as const,
      })
    } else if (value === 'none') {
      onSettingsChange({
        ...settings,
        smtpProvider: value,
        smtpHost: '',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
      })
    } else {
      onSettingsChange({ ...settings, smtpProvider: value })
    }

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave()
    }, 2000)
  }, [settings, onSettingsChange, handleAutoSave])

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
        description: 'Check your inbox for a verification email. Click the link in the email to activate SMTP.',
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email / SMTP Configuration</CardTitle>
            <CardDescription>
              Configure email settings for password resets and notifications
            </CardDescription>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Unsaved changes (auto-saving...)</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="smtpProvider">Email Provider</Label>
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
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Google / Gmail Setup</h4>
                <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                  To use Gmail SMTP, you need to create an App Password:
                </p>
                <ol className="text-xs text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1">
                  <li>Go to your Google Account settings</li>
                  <li>Navigate to Security → 2-Step Verification (must be enabled)</li>
                  <li>At the bottom, select App passwords</li>
                  <li>Create a new app password for &quot;Mail&quot;</li>
                  <li>Use that 16-character password below</li>
                </ol>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpHost}
                      onChange={(e) => updateSetting('smtpHost', e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => updateSetting('smtpPort', parseInt(e.target.value) || 587)}
                      placeholder="587"
                    />
                  </div>
                </div>

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

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 pb-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
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

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 pb-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <h3 className="text-base font-semibold text-foreground">Sender Information</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpFromEmail">From Email</Label>
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
                <Label htmlFor="smtpFromName">From Name</Label>
                <Input
                  id="smtpFromName"
                  value={settings.smtpFromName}
                  onChange={(e) => updateSetting('smtpFromName', e.target.value)}
                  placeholder="Faux|Dash"
                />
              </div>
            </div>

            <div className="pt-4 border-t bg-muted/50 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Test Connection</h4>
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
                  <div className={`mt-2 p-2 rounded-md flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200 ${testResult.success ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Send Test Email & Verify</h4>
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
      </CardContent>
    </Card>
  )
}
