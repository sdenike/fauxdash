'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  FileText,
  LayoutDashboard,
  LayoutList,
  Menu,
  SlidersHorizontal,
  UserCircle,
  Wrench,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import { ThemeToggle } from '@/components/start/site-header'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/content', label: 'Content', icon: LayoutList },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: SlidersHorizontal },
  { href: '/admin/tools', label: 'Tools', icon: Wrench },
  { href: '/admin/logs', label: 'Logs', icon: FileText },
  { href: '/admin/profile', label: 'Profile', icon: UserCircle },
]

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/')
}

/** Admin chrome: sidebar on desktop, a drawer on phones. The server layout has already checked the visitor is an admin. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the drawer when the route changes (adjust state during render).
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  // Lock the page behind the drawer so iOS does not scroll it underneath.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const current = NAV.find((n) => isActive(pathname, n.href))

  return (
    <ConfirmProvider>
      <div className="flex min-h-dvh bg-background">
        {open && <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

        <aside
          id="admin-nav"
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-[min(16rem,85vw)] flex-col overscroll-contain border-r border-border bg-background pl-safe pt-safe md:w-60 md:bg-muted/40 md:pl-0 md:pt-0 transition-transform duration-200 ease-out',
            'md:sticky md:top-0 md:h-dvh md:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link href="/admin" className="text-sm font-semibold tracking-tight text-foreground">
              Faux|Dash <span className="font-normal text-muted-foreground">Admin</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Admin" className="flex-1 space-y-0.5 overflow-y-auto p-3">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 coarse:h-11 items-center gap-2.5 rounded-md px-3 text-sm transition-colors',
                    active
                      ? 'bg-accent font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )}
                >
                  <Icon className={cn('h-4 w-4', active && 'text-brand')} aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center justify-between border-t border-border p-3 pb-safe">
            <Link
              href="/"
              className="flex h-9 coarse:h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Start page
            </Link>
            <ThemeToggle />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 border-b border-border bg-background/90 pt-safe backdrop-blur md:hidden">
            <div className="px-gutter flex h-14 items-center gap-2" style={{ paddingLeft: 'max(0.5rem, env(safe-area-inset-left))' }}>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="admin-nav"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="text-sm font-medium text-foreground">{current?.label ?? 'Admin'}</span>
            </div>
          </div>

          <main id="main" className="px-gutter mx-auto max-w-6xl py-6 pb-safe md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </ConfirmProvider>
  )
}
