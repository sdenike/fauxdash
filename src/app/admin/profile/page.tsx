'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { PasswordStrength } from '@/components/ui/password-strength'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function ProfilePage() {
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
  }, [session])

  const fetchOidcSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setOidcSettings({
        oidcEnabled: data.oidcEnabled || false,
        oidcProviderName: data.oidcProviderName || '',
        oidcClientId: data.oidcClientId || '',
        oidcClientSecret: data.oidcClientSecret || '',
        oidcIssuerUrl: data.oidcIssuerUrl || '',
      })
    } catch (error) {
      console.error('Failed to fetch OIDC settings:', error)
    } finally {
      setLoadingOidc(false)
    }
  }

  const handleSave = async () => {
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

      // Trigger session refresh to get updated data
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
  }

  const handleSaveOidc = async () => {
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
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New passwords do not match.',
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New password must be at least 8 characters.',
      })
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

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      console.error('Failed to change password:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to change password. Please try again.',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
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

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
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
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Your Name"
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
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                  placeholder="John"
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
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  placeholder="Doe"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for {'{{lastname}}'} template variable
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
              <PasswordStrength password={passwordData.newPassword} />
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className={passwordData.confirmPassword ? (passwordsMatch ? 'pr-10 border-green-500 focus-visible:ring-green-500' : 'pr-10 border-red-500 focus-visible:ring-red-500') : ''}
                />
                {passwordData.confirmPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {passwordsMatch ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 animate-in zoom-in duration-200" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 animate-in zoom-in duration-200" />
                    )}
                  </div>
                )}
              </div>
              {passwordData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  Passwords do not match
                </p>
              )}
              {passwordData.confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  Passwords match
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleChangePassword}
                disabled={savingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordsMatch === false}
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>OIDC Authentication</CardTitle>
            <CardDescription>
              Configure OpenID Connect (OIDC) authentication provider
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
                checked={oidcSettings.oidcEnabled}
                onCheckedChange={(checked) => setOidcSettings({ ...oidcSettings, oidcEnabled: checked })}
              />
            </div>

            {oidcSettings.oidcEnabled && (
              <>
                <div>
                  <Label htmlFor="oidcProviderName">Provider Name</Label>
                  <Input
                    id="oidcProviderName"
                    value={oidcSettings.oidcProviderName}
                    onChange={(e) => setOidcSettings({ ...oidcSettings, oidcProviderName: e.target.value })}
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
                    onChange={(e) => setOidcSettings({ ...oidcSettings, oidcClientId: e.target.value })}
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
                    onChange={(e) => setOidcSettings({ ...oidcSettings, oidcClientSecret: e.target.value })}
                    placeholder="your-client-secret"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    OAuth Client Secret from your OIDC provider
                  </p>
                </div>

                <div>
                  <Label htmlFor="oidcIssuerUrl">Issuer URL</Label>
                  <Input
                    id="oidcIssuerUrl"
                    type="url"
                    value={oidcSettings.oidcIssuerUrl}
                    onChange={(e) => setOidcSettings({ ...oidcSettings, oidcIssuerUrl: e.target.value })}
                    placeholder="https://auth.example.com/application/o/your-app/"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The issuer URL from your OIDC provider (should end with a trailing slash)
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Callback URL</h4>
                    <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                      Configure this callback URL in your OIDC provider:
                    </p>
                    <code className="block bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-3 py-2 rounded text-xs font-mono">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/oidc` : '/api/auth/callback/oidc'}
                    </code>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSaveOidc} disabled={savingOidc || loadingOidc}>
                {savingOidc ? 'Saving...' : 'Save OIDC Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
