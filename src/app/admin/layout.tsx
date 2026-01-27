'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  HomeIcon,
  RectangleStackIcon,
  WrenchScrewdriverIcon,
  UserCircleIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session && !(session.user as any)?.isAdmin) {
      router.push('/')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!session || !(session.user as any)?.isAdmin) {
    return null
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: HomeIcon },
    { href: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
    { href: '/admin/content', label: 'Content', icon: RectangleStackIcon },
    { href: '/admin/settings', label: 'Configuration', icon: WrenchScrewdriverIcon },
    { href: '/admin/tools', label: 'Tools', icon: Cog6ToothIcon },
    { href: '/admin/logs', label: 'Logs', icon: DocumentTextIcon },
    { href: '/admin/profile', label: 'Profile', icon: UserCircleIcon },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Faux|Dash
              </h1>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Admin Panel</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-8 py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
