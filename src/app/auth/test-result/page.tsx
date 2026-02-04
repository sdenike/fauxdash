'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function AuthTestResultPage() {
  const { data: session, status } = useSession()
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (status === 'loading' || sent) return

    // Send result to parent window
    if (window.opener && !window.opener.closed) {
      if (status === 'authenticated' && session?.user) {
        window.opener.postMessage({
          type: 'oidc-test-result',
          success: true,
          message: 'Authentication successful',
          userEmail: session.user.email,
        }, window.location.origin)
      } else {
        window.opener.postMessage({
          type: 'oidc-test-result',
          success: false,
          error: 'Authentication failed - no session created',
        }, window.location.origin)
      }
      setSent(true)

      // Close window after short delay
      setTimeout(() => {
        window.close()
      }, 2000)
    } else {
      // No opener, just show result
      setSent(true)
    }
  }, [session, status, sent])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h1 className="text-2xl font-bold">Verifying authentication...</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your OIDC authentication.
            </p>
          </>
        )}

        {status === 'authenticated' && (
          <>
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <h1 className="text-2xl font-bold text-green-700 dark:text-green-300">
              Authentication Successful!
            </h1>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Successfully authenticated with OIDC.
              </p>
              {session.user?.email && (
                <p className="text-sm font-mono bg-muted p-2 rounded">
                  {session.user.email}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This window will close automatically...
              </p>
            </div>
          </>
        )}

        {status === 'unauthenticated' && (
          <>
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <h1 className="text-2xl font-bold text-red-700 dark:text-red-300">
              Authentication Failed
            </h1>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                OIDC authentication test failed. Please check your configuration.
              </p>
              <p className="text-xs text-muted-foreground">
                You can close this window.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
