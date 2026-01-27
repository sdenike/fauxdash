'use client'

import { useState, useEffect, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertMessage } from '@/components/ui/alert-message'
import { ErrorBoundary } from '@/components/error-boundary'
import { Loader2, Mail } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oidcEnabled, setOidcEnabled] = useState(false)
  const [oidcProviderName, setOidcProviderName] = useState('OIDC')
  const [smtpConfigured, setSmtpConfigured] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotError, setForgotError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    // Check if setup is needed first
    fetch('/api/setup/status', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.needsSetup) {
          router.push('/setup')
          return
        }

        // Fetch settings in parallel
        Promise.all([
          fetch('/api/settings', { signal: controller.signal }).then(res => res.json()),
          fetch('/api/auth/smtp-status', { signal: controller.signal }).then(res => res.json()),
        ])
          .then(([settingsData, smtpData]) => {
            setOidcEnabled(settingsData.oidcEnabled || false)
            setOidcProviderName(settingsData.oidcProviderName || 'OIDC')
            setSmtpConfigured(smtpData.configured || false)
          })
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch settings:', err)
        }
      })

    return () => controller.abort()
  }, [router])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }, [])

  const handleForgotEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForgotEmail(e.target.value)
  }, [])

  const resetForgotPasswordState = useCallback(() => {
    setForgotEmail('')
    setForgotError('')
    setForgotMessage('')
  }, [])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setShowForgotPassword(open)
    if (!open) {
      resetForgotPasswordState()
    }
  }, [resetForgotPasswordState])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email, password, router])

  const handleOidcLogin = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      await signIn('oidc', { callbackUrl: '/' })
    } catch {
      setError('OIDC login failed. Please try again.')
      setLoading(false)
    }
  }, [])

  const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotMessage('')
    setForgotLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        setForgotError(data.error || 'An error occurred')
      } else {
        setForgotMessage(data.message)
        setForgotEmail('')
      }
    } catch {
      setForgotError('An error occurred. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }, [forgotEmail])

  const handleCloseDialog = useCallback(() => {
    setShowForgotPassword(false)
    resetForgotPasswordState()
  }, [resetForgotPasswordState])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access Faux|Dash
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} aria-busy={loading}>
          <CardContent className="space-y-4">
            {error && <AlertMessage variant="error" message={error} />}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@fauxdash.local"
                value={email}
                onChange={handleEmailChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                required
                autoComplete="current-password"
              />
            </div>

            {smtpConfigured && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {oidcEnabled && (
              <>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleOidcLogin}
                  disabled={loading}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  Sign in with {oidcProviderName}
                </Button>
              </>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword}>
            <div className="space-y-4 py-4">
              {forgotError && <AlertMessage variant="error" message={forgotError} />}
              {forgotMessage && <AlertMessage variant="success" message={forgotMessage} />}

              {!forgotMessage && (
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail">Email</Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={handleForgotEmailChange}
                    required
                    autoComplete="email"
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-3 sm:gap-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                {forgotMessage ? 'Close' : 'Cancel'}
              </Button>
              {!forgotMessage && (
                <Button type="submit" disabled={forgotLoading} aria-busy={forgotLoading}>
                  {forgotLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LoginPage() {
  return (
    <ErrorBoundary>
      <LoginContent />
    </ErrorBoundary>
  )
}
