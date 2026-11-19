'use client'

import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { ThemeColor } from '@/components/theme-color'

/*
  session and defaultTheme come from the server (src/app/layout.tsx), so useSession() is 'authenticated'
  on the first render and next-themes' blocking script picks the right theme before paint. The visitor's
  own light/dark choice lives in localStorage ("theme") and wins over the site default.
*/
export function Providers({
  children,
  session,
  defaultTheme,
}: {
  children: React.ReactNode
  session: Session | null
  defaultTheme: 'light' | 'dark' | 'system'
}) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem disableTransitionOnChange>
        <ThemeColor />
        {children}
        <Toaster />
        <PWAInstallPrompt />
      </ThemeProvider>
    </SessionProvider>
  )
}
