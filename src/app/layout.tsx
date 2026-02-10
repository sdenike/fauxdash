import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { DynamicFavicon } from '@/components/dynamic-favicon'

export const metadata: Metadata = {
  title: 'Faux|Dash',
  description: 'Self-hosted bookmark dashboard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Faux|Dash',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/api/pwa-icons/serve/192" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <DynamicFavicon />
          {children}
        </Providers>
      </body>
    </html>
  )
}
