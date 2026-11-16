'use client'

import { useEffect } from 'react'

/** Records one start-page view for analytics. Renders nothing. */
export function PageviewBeacon() {
  useEffect(() => {
    fetch('/api/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/' }),
      keepalive: true,
    }).catch(() => {})
  }, [])
  return null
}
