'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { PasswordStrength } from '@/components/ui/password-strength'
import { PasswordConfirmInput } from '@/components/ui/password-confirm-input'
import { AlertMessage } from '@/components/ui/alert-message'
import { ErrorBoundary } from '@/components/error-boundary'
import { Loader2 } from 'lucide-react'
import { AdminPage, AdminSection, AdminLoading } from '@/components/admin/admin-page'

function ProfileContent() {
  const { data: session, status, update } = useSession()
  const { toast } = useToast()
  const [now] = useState(() => Date.now())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstname: '',
    lastname: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Real-time password match validation
  const passwordsMatch = useMemo(() => {
    if (!passwordData.confirmPassword) return null
    return passwordData.newPassword === passwordData.confirmPassword
  }, [passwordData.newPassword, passwordData.confirmPassword])

  // Populate the form when the session arrives or changes (adjust state during render).
  const [prevSession, setPrevSession] = useState(session)
  if (session && session !== prevSession) {
    setPrevSession(session)
    setFormData({
      email: (session.user as any)?.email || '',
      username: (session.user as any)?.name || '',
      firstname: (session.user as any)?.firstname || '',
      lastname: (session.user as any)?.lastname || '',
    })
    setLoading(false)
  }

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
        description: 'Your profile changes were saved.',
      })
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast({
        variant: 'destructive',
        title: 'Could not update profile',
        description: 'Your changes were not saved. Check your connection and try again.',
      })
    } finally {
      setSaving(false)
    }
  }, [formData, update, toast])

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
        description: 'Your password was changed.',
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
      <AdminPage title="Profile" description="Manage your account settings.">
        <AdminLoading rows={4} label="Loading profile" />
      </AdminPage>
    )
  }

  if (!session) {
    return null
  }

  return (
    <AdminPage title="Profile" description="Manage your account settings.">
      <div className="divide-y divide-border [&>section]:py-8 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
        {/* Account information Form */}
        <AdminSection title="Account information" description="Update your personal information.">
          <form onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
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
                <Label htmlFor="username">Display name</Label>
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

              <div>
                <Label htmlFor="firstname">First name</Label>
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
                <Label htmlFor="lastname">Last name</Label>
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

              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" disabled={saving} aria-busy={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </AdminSection>

        {/* Change Password Form */}
        <AdminSection title="Change password" description="Update your account password.">
          <form onSubmit={handleChangePassword}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {passwordError && (
                <div className="sm:col-span-2">
                  <AlertMessage variant="error" message={passwordError} />
                </div>
              )}

              <div className="sm:col-span-2 sm:max-w-[calc(50%-0.75rem)]">
                <Label htmlFor="currentPassword">Current password</Label>
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
                <Label htmlFor="newPassword">New password</Label>
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
                label="Confirm new password"
                placeholder="Confirm new password"
              />

              <div className="sm:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={savingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordsMatch === false}
                  aria-busy={savingPassword}
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Changing…
                    </>
                  ) : (
                    'Change password'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </AdminSection>

        <AdminSection title="This sign-in" description="A visit to the start page or admin restarts the clock.">
          <p className="text-sm text-foreground">
            {(() => {
              const days = (session as any)?.rememberDays as number | undefined
              if (!days) return 'Unknown. Sign out and in again to set it.'
              const until = new Date(now + days * 86400000).toLocaleDateString(undefined, { dateStyle: 'medium' })
              const label = days === 365 ? '1 year' : days === 90 ? '3 months' : days === 30 ? '1 month' : days === 7 ? '1 week' : `${days} days`
              return `Stays signed in for ${label} without a visit, so at least until ${until}.`
            })()}
          </p>
        </AdminSection>
      </div>
    </AdminPage>
  )
}

export default function ProfilePage() {
  return (
    <ErrorBoundary>
      <ProfileContent />
    </ErrorBoundary>
  )
}
