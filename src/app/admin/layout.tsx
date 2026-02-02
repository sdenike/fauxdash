'use client'

import { useEffect, useState } from 'react'
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
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

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
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col transform transition-transform duration-200 ease-in-out",
            "md:relative md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div>
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary">
                  Faux|Dash
                </h1>
              </Link>
              <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors touch-target"
            >
              <XMarkIcon className="h-6 w-6 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 touch-target",
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border/50 pb-safe">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors touch-target"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {/* Mobile header with hamburger */}
          <div className="sticky top-0 z-30 md:hidden bg-card/95 backdrop-blur-xl border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors touch-target"
              >
                <Bars3Icon className="h-6 w-6 text-muted-foreground" />
              </button>
              <h1 className="text-lg font-bold text-primary">
                Faux|Dash
              </h1>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6 md:px-8 md:py-8 max-w-7xl pb-safe">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
