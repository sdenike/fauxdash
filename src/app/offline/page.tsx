'use client'

import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
          <WifiOff className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          You&apos;re offline
        </h1>

        <p className="text-muted-foreground mb-6">
          It looks like you&apos;ve lost your internet connection. Check your
          connection and try again.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors touch-target"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
