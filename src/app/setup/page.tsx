'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  useEffect(() => {
    // Check if setup is needed
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (!data.needsSetup) {
          // Setup already complete, redirect to login
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <SparklesIcon className="h-10 w-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Faux|Dash</h1>
          </div>
          <p className="text-gray-400">Welcome! Let&apos;s get you set up.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                ${step >= s
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400'}
              `}>
                {step > s ? <CheckCircleIcon className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-purple-600' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Welcome to Faux|Dash</CardTitle>
              <CardDescription>
                Your self-hosted bookmark dashboard is almost ready. Let&apos;s create your admin account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                  <BookmarkIcon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <h3 className="text-white font-medium">Organize</h3>
                  <p className="text-sm text-gray-400">Manage bookmarks and services in categories</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                  <Cog6ToothIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <h3 className="text-white font-medium">Customize</h3>
                  <p className="text-sm text-gray-400">Theme colors, icons, and layouts</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                  <ChartBarIcon className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-white font-medium">Analyze</h3>
                  <p className="text-sm text-gray-400">Track usage with built-in analytics</p>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep(2)}
              >
                Get Started
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Create Admin Account */}
        {step === 2 && (
          <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Create Admin Account
              </CardTitle>
              <CardDescription>
                This will be your administrator account for managing Faux|Dash.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstname" className="text-gray-300">First Name</Label>
                    <Input
                      id="firstname"
                      value={formData.firstname}
                      onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                      className="bg-slate-700/50 border-slate-600"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname" className="text-gray-300">Last Name</Label>
                    <Input
                      id="lastname"
                      value={formData.lastname}
                      onChange={(e) => setFormData({...formData, lastname: e.target.value})}
                      className="bg-slate-700/50 border-slate-600"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-slate-700/50 border-slate-600"
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="bg-slate-700/50 border-slate-600"
                    placeholder="admin"
                  />
                  <p className="text-xs text-gray-500">Optional - defaults to email prefix</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="bg-slate-700/50 border-slate-600"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="bg-slate-700/50 border-slate-600"
                    placeholder="Re-enter your password"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="border-slate-600"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating Account...' : 'Create Account'}
                    <KeyIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Demo Choice */}
        {step === 3 && success && (
          <Card className="border-green-500/20 bg-slate-800/50 backdrop-blur">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <CheckCircleIcon className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-white">Account Created!</CardTitle>
              <CardDescription>
                How would you like to get started?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={async () => {
                    setError('')
                    setLoadingDemo(true)
                    try {
                      // First sign in so we have a session
                      const signInRes = await fetch('/api/auth/callback/credentials', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: formData.email,
                          password: formData.password,
                          redirect: false
                        })
                      })

                      // Load demo content
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
                  className="p-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 rounded-lg text-left transition-all disabled:opacity-50"
                >
                  <BeakerIcon className="h-10 w-10 text-purple-400 mb-3" />
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {loadingDemo ? 'Loading Demo...' : 'Load Demo Data'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Explore Faux|Dash with sample bookmarks, services, and 30 days of analytics data
                  </p>
                </button>

                <button
                  onClick={() => router.push('/login')}
                  disabled={loadingDemo}
                  className="p-6 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 rounded-lg text-left transition-all disabled:opacity-50"
                >
                  <DocumentPlusIcon className="h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-white font-semibold text-lg mb-1">Start Fresh</h3>
                  <p className="text-sm text-gray-400">
                    Begin with an empty dashboard and add your own content
                  </p>
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Demo content can be cleared at any time from Admin &gt; Tools
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
