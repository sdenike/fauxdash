'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { PasswordStrength } from '@/components/ui/password-strength'
import { PasswordConfirmInput } from '@/components/ui/password-confirm-input'
import { AlertMessage } from '@/components/ui/alert-message'
import { ErrorBoundary } from '@/components/error-boundary'
import { Loader2 } from 'lucide-react'

function ProfileContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstname: '',
    lastname: '',
  })
  const [oidcSettings, setOidcSettings] = useState({
    oidcEnabled: false,
    oidcProviderName: '',
    oidcClientId: '',
    oidcClientSecret: '',
    oidcIssuerUrl: '',
  })
  const [loadingOidc, setLoadingOidc] = useState(true)
  const [savingOidc, setSavingOidc] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Client-side only callback URL (avoids hydration mismatch)
  const [callbackUrl, setCallbackUrl] = useState('/api/auth/callback/oidc')

  useEffect(() => {
    // Set callback URL on client side only
    setCallbackUrl(`${window.location.origin}/api/auth/callback/oidc`)
  }, [])

  // Real-time password match validation
  const passwordsMatch = useMemo(() => {
    if (!passwordData.confirmPassword) return null
    return passwordData.newPassword === passwordData.confirmPassword
  }, [passwordData.newPassword, passwordData.confirmPassword])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchOidcSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setOidcSettings({
        oidcEnabled: data.oidcEnabled || false,
        oidcProviderName: data.oidcProviderName || '',
        oidcClientId: data.oidcClientId || '',
        oidcClientSecret: '', // Don't expose secret in UI
        oidcIssuerUrl: data.oidcIssuerUrl || '',
      })
    } catch (error) {
      console.error('Failed to fetch OIDC settings:', error)
    } finally {
      setLoadingOidc(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      setFormData({
        email: (session.user as any)?.email || '',
        username: (session.user as any)?.name || '',
        firstname: (session.user as any)?.firstname || '',
        lastname: (session.user as any)?.lastname || '',
      })
      setLoading(false)
      fetchOidcSettings()
    }
  }, [session, fetchOidcSettings])

  // Form data handlers with useCallback
  const handleFormChange = useCallback((field: keyof typeof formData) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }
  }, [])

  // Password data handlers
  const handlePasswordChange = useCallback((field: keyof typeof passwordData) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordData(prev => ({ ...prev, [field]: e.target.value }))
      setPasswordError('')
    }
  }, [])

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setPasswordData(prev => ({ ...prev, confirmPassword: value }))
    setPasswordError('')
  }, [])

  // OIDC settings handlers
  const handleOidcChange = useCallback((field: keyof typeof oidcSettings) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setOidcSettings(prev => ({ ...prev, [field]: e.target.value }))
    }
  }, [])

  const handleOidcEnabledChange = useCallback((checked: boolean) => {
    setOidcSettings(prev => ({ ...prev, oidcEnabled: checked }))
  }, [])

  const handleSaveProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      await update()

      toast({
        variant: 'success',
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }, [formData, update, toast])

  const handleSaveOidc = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingOidc(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oidcSettings),
      })

      toast({
        variant: 'success',
        title: 'OIDC settings saved',
        description: 'OIDC configuration has been updated. Please restart the application for changes to take effect.',
      })
    } catch (error) {
      console.error('Failed to save OIDC settings:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update OIDC settings. Please try again.',
      })
    } finally {
      setSavingOidc(false)
    }
  }, [oidcSettings, toast])

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    setSavingPassword(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast({
        variant: 'success',
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      })

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      console.error('Failed to change password:', error)
      setPasswordError(error.message || 'Failed to change password. Please try again.')
    } finally {
      setSavingPassword(false)
    }
  }, [passwordData, toast])

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent mb-2">
          Profile
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account settings
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Account Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveProfile}>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange('email')}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your email address for login
                </p>
              </div>

              <div>
                <Label htmlFor="username">Display Name</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={handleFormChange('username')}
                  placeholder="Your Name"
                  autoComplete="name"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for {'{{username}}'} template variable
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstname">First Name</Label>
                  <Input
                    id="firstname"
                    value={formData.firstname}
                    onChange={handleFormChange('firstname')}
                    placeholder="John"
                    autoComplete="given-name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for {'{{firstname}}'} template variable
                  </p>
                </div>

                <div>
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input
                    id="lastname"
                    value={formData.lastname}
                    onChange={handleFormChange('lastname')}
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for {'{{lastname}}'} template variable
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={saving} aria-busy={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        {/* Change Password Form */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your account password
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-6">
              {passwordError && (
                <AlertMessage variant="error" message={passwordError} />
              )}

              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange('currentPassword')}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange('newPassword')}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  aria-describedby="new-password-strength"
                />
                <PasswordStrength password={passwordData.newPassword} id="new-password-strength" />
                <p className="text-xs text-muted-foreground mt-1">
                  Must be at least 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <PasswordConfirmInput
                password={passwordData.newPassword}
                confirmPassword={passwordData.confirmPassword}
                onConfirmPasswordChange={handleConfirmPasswordChange}
                label="Confirm New Password"
                placeholder="Confirm new password"
              />

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={savingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordsMatch === false}
                  aria-busy={savingPassword}
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        {/* OIDC Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>OIDC Authentication</CardTitle>
            <CardDescription>
              Configure OpenID Connect (OIDC) authentication provider
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveOidc}>
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
                  checked={oidcSettings.oidcEnabled}
                  onCheckedChange={handleOidcEnabledChange}
                />
              </div>

              {oidcSettings.oidcEnabled && (
                <>
                  <div>
                    <Label htmlFor="oidcProviderName">Provider Name</Label>
                    <Input
                      id="oidcProviderName"
                      value={oidcSettings.oidcProviderName}
                      onChange={handleOidcChange('oidcProviderName')}
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
                      value={oidcSettings.oidcClientId}
                      onChange={handleOidcChange('oidcClientId')}
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
                      value={oidcSettings.oidcClientSecret}
                      onChange={handleOidcChange('oidcClientSecret')}
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
                      value={oidcSettings.oidcIssuerUrl}
                      onChange={handleOidcChange('oidcIssuerUrl')}
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
                </>
              )}

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={savingOidc || loadingOidc} aria-busy={savingOidc}>
                  {savingOidc ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    'Save OIDC Settings'
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ErrorBoundary>
      <ProfileContent />
    </ErrorBoundary>
  )
}
