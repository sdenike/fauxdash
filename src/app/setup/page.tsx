'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  SparklesIcon,
  UserIcon,
  KeyIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BeakerIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline'

const STRENGTH_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']
const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ color: '#64748b' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '672px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <SparklesIcon style={{ height: '2.5rem', width: '2.5rem', color: '#334155' }} />
            <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Faux|Dash</h1>
          </div>
          <p style={{ color: '#64748b', margin: 0 }}>Welcome! Let&apos;s get you set up.</p>
        </div>

        {/* Progress Steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 600,
                background: step >= s ? '#0f172a' : '#e2e8f0',
                color: step >= s ? '#fff' : '#94a3b8',
              }}>
                {step > s ? <CheckCircleIcon style={{ height: '1.25rem', width: '1.25rem' }} /> : s}
              </div>
              {s < 3 && (
                <div style={{ width: '4rem', height: '0.25rem', margin: '0 0.5rem', borderRadius: '0.25rem', background: step > s ? '#0f172a' : '#e2e8f0' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 1.5rem 0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem' }}>Welcome to Faux|Dash</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                Your self-hosted bookmark dashboard is almost ready. Let&apos;s create your admin account.
              </p>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                  <BookmarkIcon style={{ height: '2rem', width: '2rem', color: '#2563eb', margin: '0 auto 0.5rem' }} />
                  <h3 style={{ color: '#0f172a', fontWeight: 500, margin: '0 0 0.25rem', fontSize: '0.875rem' }}>Organize</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Manage bookmarks and services in categories</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                  <Cog6ToothIcon style={{ height: '2rem', width: '2rem', color: '#16a34a', margin: '0 auto 0.5rem' }} />
                  <h3 style={{ color: '#0f172a', fontWeight: 500, margin: '0 0 0.25rem', fontSize: '0.875rem' }}>Customize</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Theme colors, icons, and layouts</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                  <ChartBarIcon style={{ height: '2rem', width: '2rem', color: '#7c3aed', margin: '0 auto 0.5rem' }} />
                  <h3 style={{ color: '#0f172a', fontWeight: 500, margin: '0 0 0.25rem', fontSize: '0.875rem' }}>Analyze</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Track usage with built-in analytics</p>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                Get Started
                <ArrowRightIcon style={{ height: '1rem', width: '1rem' }} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Create Admin Account */}
        {step === 2 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 1.5rem 0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserIcon style={{ height: '1.25rem', width: '1.25rem' }} />
                Create Admin Account
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                This will be your administrator account for managing Faux|Dash.
              </p>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                  <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label htmlFor="firstname" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', marginBottom: '0.375rem' }}>First Name</label>
                    <input
                      id="firstname"
                      value={formData.firstname}
                      onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                      placeholder="John"
                      style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastname" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', marginBottom: '0.375rem' }}>Last Name</label>
                    <input
                      id="lastname"
                      value={formData.lastname}
                      onChange={(e) => setFormData({...formData, lastname: e.target.value})}
                      placeholder="Doe"
                      style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', marginBottom: '0.375rem' }}>Email *</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="admin@example.com"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label htmlFor="username" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', marginBottom: '0.375rem' }}>Username</label>
                  <input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="admin"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Optional - defaults to email prefix</p>
                </div>

                <div>
                  <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', marginBottom: '0.375rem' }}>Password *</label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimum 8 characters"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {formData.password && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {[0, 1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            style={{
                              height: '4px',
                              flex: 1,
                              borderRadius: '9999px',
                              background: level <= passwordStrength ? STRENGTH_COLORS[passwordStrength] : '#e2e8f0',
                              transition: 'background 0.3s',
                            }}
                          />
                        ))}
                      </div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: STRENGTH_COLORS[passwordStrength], marginTop: '0.25rem' }}>
                        {STRENGTH_LABELS[passwordStrength]}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', marginBottom: '0.375rem' }}>Confirm Password *</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Re-enter your password"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {formData.confirmPassword && (
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, marginTop: '0.25rem', color: passwordsMatch ? '#22c55e' : '#ef4444' }}>
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#fff',
                      color: '#334155',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: '0.5rem 1rem',
                      background: submitting ? '#64748b' : '#0f172a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {submitting ? 'Creating Account...' : 'Create Account'}
                    <KeyIcon style={{ height: '1rem', width: '1rem' }} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Demo Choice */}
        {step === 3 && success && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <CheckCircleIcon style={{ height: '4rem', width: '4rem', color: '#22c55e', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem' }}>Account Created!</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                How would you like to get started?
              </p>
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              {error && (
                <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={async () => {
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
                  }}
                  disabled={loadingDemo}
                  style={{
                    padding: '1.5rem',
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    borderRadius: '0.5rem',
                    textAlign: 'left',
                    cursor: loadingDemo ? 'not-allowed' : 'pointer',
                    opacity: loadingDemo ? 0.5 : 1,
                  }}
                >
                  <BeakerIcon style={{ height: '2.5rem', width: '2.5rem', color: '#7c3aed', marginBottom: '0.75rem' }} />
                  <h3 style={{ color: '#0f172a', fontWeight: 600, fontSize: '1.125rem', margin: '0 0 0.25rem' }}>
                    {loadingDemo ? 'Loading Demo...' : 'Load Demo Data'}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                    Explore with sample bookmarks, services, and analytics data
                  </p>
                </button>

                <button
                  onClick={() => router.push('/login')}
                  disabled={loadingDemo}
                  style={{
                    padding: '1.5rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    textAlign: 'left',
                    cursor: loadingDemo ? 'not-allowed' : 'pointer',
                    opacity: loadingDemo ? 0.5 : 1,
                  }}
                >
                  <DocumentPlusIcon style={{ height: '2.5rem', width: '2.5rem', color: '#94a3b8', marginBottom: '0.75rem' }} />
                  <h3 style={{ color: '#0f172a', fontWeight: 600, fontSize: '1.125rem', margin: '0 0 0.25rem' }}>Start Fresh</h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                    Begin with an empty dashboard and add your own content
                  </p>
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                Demo content can be cleared at any time from Admin &gt; Tools
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
