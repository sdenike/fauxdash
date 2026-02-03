'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface HomepageGraphicProps {
  enabled: boolean
  path: string
  maxWidth: number
  hAlign: 'left' | 'center' | 'right'
}

export function HomepageGraphic({ enabled, path, maxWidth, hAlign }: HomepageGraphicProps) {
  const [imageExists, setImageExists] = useState(false)

  // Check if image exists
  useEffect(() => {
    if (enabled && path) {
      fetch('/api/homepage-graphic/serve', { method: 'HEAD' })
        .then(res => setImageExists(res.ok))
        .catch(() => setImageExists(false))
    } else {
      setImageExists(false)
    }
  }, [enabled, path])

  if (!enabled || !path || !imageExists) {
    return null
  }

  return (
    <div
      className={cn(
        'mb-6 flex',
        hAlign === 'left' && 'justify-start',
        hAlign === 'center' && 'justify-center',
        hAlign === 'right' && 'justify-end'
      )}
    >
      <img
        src="/api/homepage-graphic/serve"
        alt="Homepage graphic"
        style={{ maxWidth: `${maxWidth}px` }}
        className="max-w-full h-auto object-contain"
      />
    </div>
  )
}
