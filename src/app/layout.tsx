import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { DynamicFavicon } from '@/components/dynamic-favicon'
import { getSession, getSettingsMap } from '@/lib/server/start-page'
import { themeColorScript } from '@/lib/theme-color'

export const metadata: Metadata = {
  title: 'Faux|Dash',
  description: 'Self-hosted bookmark dashboard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    // Content runs under the status bar; headers pad themselves with env(safe-area-inset-top).
    statusBarStyle: 'black-translucent',
    title: 'Faux|Dash',
  },
  formatDetection: {
    telephone: false,
  },
}

// theme-color is not set here: it follows the theme the page shows, see src/lib/theme-color.ts.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read on the server so the first paint already knows who is signed in and which theme to use.
  const session = await getSession()
  let defaultTheme: 'light' | 'dark' | 'system' = 'system'
  try {
    const map = await getSettingsMap(session?.user?.id ? parseInt(session.user.id, 10) : null)
    const value = map.defaultTheme || process.env.DEFAULT_THEME
    if (value === 'light' || value === 'dark' || value === 'system') defaultTheme = value
  } catch {
    // Database not ready yet (first boot): fall back to the system theme.
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="icon" type="image/png" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/api/pwa-icons/serve/192" />
        {/* Blocking: the title bar / browser chrome colour is right before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeColorScript(defaultTheme) }} />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow"
        >
          Skip to content
        </a>
        <Providers session={session} defaultTheme={defaultTheme}>
          <DynamicFavicon />
          {children}
        </Providers>
      </body>
    </html>
  )
}
