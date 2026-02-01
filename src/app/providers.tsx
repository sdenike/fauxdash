'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { ThemeSync } from '@/components/theme-sync'
import { Toaster } from '@/components/ui/toaster'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ThemeSync />
        {children}
        <Toaster />
        <PWAInstallPrompt />
      </ThemeProvider>
    </SessionProvider>
  )
}
