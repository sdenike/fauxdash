'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, User, KeyRound, CheckCircle2, ArrowRight, Bookmark, Settings, BarChart3, FlaskConical, FilePlus } from 'lucide-react'

const STRENGTH_COLORS = ['bg-destructive', 'bg-warning', 'bg-warning', 'bg-success', 'bg-success']
const STRENGTH_TEXT = ['text-destructive', 'text-warning', 'text-warning', 'text-success', 'text-success']
const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']

function getPasswordStrength(password: string): number {
  if (!password) return -1
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  if (/^[a-zA-Z]+$/.test(password)) score--
  if (/^[0-9]+$/.test(password)) score--
  if (/(.)\\1{2,}/.test(password)) score--
  if (/^(password|123456|qwerty|admin|letmein)/i.test(password)) score -= 2
  return Math.max(0, Math.min(4, Math.floor(score / 2)))
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstname: '',
    lastname: ''
  })

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password])
  const passwordsMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword

  useEffect(() => {
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (!data.needsSetup) {
          router.push('/login')
        } else {
          setLoading(false)
        }
      })
      .catch(err => {
        console.error('Failed to check setup status:', err)
        setLoading(false)
      })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/setup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username || undefined,
          firstname: formData.firstname || undefined,
          lastname: formData.lastname || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Setup failed')
      }

      setSuccess(true)
      setStep(3)
    } catch (err: any) {
      setError(err.message || 'Setup failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div role="status" className="text-muted-foreground">Loading…</div>
      </div>
    )
  }

  const cardCls = 'rounded-lg border border-border bg-card p-6'
  const errorBox = error && (
    <div role="alert" className="rounded-md border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive">
      {error}
    </div>
  )

  const loadDemo = async () => {
    setError('')
    setLoadingDemo(true)
    try {
      await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          redirect: false
        })
      })

      const response = await fetch('/api/demo/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load demo content')
      }

      router.push('/login?demo=loaded')
    } catch (err: any) {
      setError(err.message || 'Failed to load demo content')
    } finally {
      setLoadingDemo(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-brand" aria-hidden="true" />
            <p className="text-xl font-semibold text-foreground">Faux|Dash</p>
          </div>
          <p className="text-sm text-muted-foreground">Welcome. Let&apos;s get you set up.</p>
        </div>

        <ol className="mb-6 flex items-center justify-center gap-2" aria-label="Setup progress">
          {[1, 2, 3].map((s) => (
            <li key={s} className="flex items-center" aria-current={step === s ? 'step' : undefined}>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : s}
                <span className="sr-only">Step {s} of 3</span>
              </span>
              {s < 3 && <span aria-hidden="true" className={`mx-2 h-0.5 w-10 rounded ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </li>
          ))}
        </ol>

        {step === 1 && (
          <div className={cardCls}>
            <h1 className="text-xl font-semibold text-foreground">Welcome to Faux|Dash</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your self-hosted bookmark dashboard is almost ready. Create your admin account to begin.
            </p>
            <ul className="my-5 space-y-3">
              <li className="flex items-start gap-3">
                <Bookmark className="mt-0.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">Organize</p>
                  <p className="text-sm text-muted-foreground">Manage bookmarks and services in categories</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Settings className="mt-0.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">Customize</p>
                  <p className="text-sm text-muted-foreground">Theme colors, icons, and layouts</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <BarChart3 className="mt-0.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">Analyze</p>
                  <p className="text-sm text-muted-foreground">Track usage with built-in analytics</p>
                </div>
              </li>
            </ul>
            <button type="button" onClick={() => setStep(2)} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={cardCls}>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <User className="h-5 w-5" aria-hidden="true" />
              Create admin account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This account manages Faux|Dash.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              {errorBox}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstname" className="mb-1.5 block text-sm font-medium text-foreground">First name</label>
                  <input
                    id="firstname"
                    autoComplete="given-name"
                    value={formData.firstname}
                    onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                    placeholder="John"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="lastname" className="mb-1.5 block text-sm font-medium text-foreground">Last name</label>
                  <input
                    id="lastname"
                    autoComplete="family-name"
                    value={formData.lastname}
                    onChange={(e) => setFormData({...formData, lastname: e.target.value})}
                    placeholder="Doe"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="admin@example.com"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-foreground">Username</label>
                <input
                  id="username"
                  autoComplete="username"
                  aria-describedby="username-hint"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="admin"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p id="username-hint" className="mt-1 text-xs text-muted-foreground">Optional. Defaults to the part of your email before the @.</p>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="At least 8 characters"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {formData.password && (
                  <div className="mt-2" role="status">
                    <div className="flex gap-1" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength ? STRENGTH_COLORS[passwordStrength] : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`mt-1 text-xs font-medium ${STRENGTH_TEXT[passwordStrength]}`}>
                      Password strength: {STRENGTH_LABELS[passwordStrength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-foreground">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Re-enter your password"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {formData.confirmPassword && (
                  <p role="status" className={`mt-1 text-xs font-medium ${passwordsMatch ? 'text-success' : 'text-destructive'}`}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Back
                </button>
                <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? 'Creating account…' : 'Create account'}
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && success && (
          <div className={cardCls}>
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success" aria-hidden="true" />
              <h1 className="text-xl font-semibold text-foreground">Account created</h1>
              <p className="mt-1 text-sm text-muted-foreground">How would you like to get started?</p>
            </div>
            <div className="mt-5 space-y-3">
              {errorBox}
              <button
                type="button"
                onClick={loadDemo}
                disabled={loadingDemo}
                className="w-full rounded-md border border-border bg-card p-4 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FlaskConical className="mb-2 h-6 w-6 text-brand" aria-hidden="true" />
                <span className="block text-sm font-semibold text-foreground">
                  {loadingDemo ? 'Loading demo data…' : 'Load demo data'}
                </span>
                <span className="block text-sm text-muted-foreground">
                  Explore with sample bookmarks, services, and analytics
                </span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                disabled={loadingDemo}
                className="w-full rounded-md border border-border bg-card p-4 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FilePlus className="mb-2 h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <span className="block text-sm font-semibold text-foreground">Start fresh</span>
                <span className="block text-sm text-muted-foreground">
                  Begin with an empty dashboard and add your own content
                </span>
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              You can clear demo content any time from Admin &gt; Tools.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
