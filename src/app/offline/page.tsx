'use client'

import { WifiIcon } from '@heroicons/react/24/outline'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
          <WifiIcon className="w-10 h-10 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          You&apos;re Offline
        </h1>

        <p className="text-muted-foreground mb-6">
          It looks like you&apos;ve lost your internet connection. Check your
          connection and try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors touch-target"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
