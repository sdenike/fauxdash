'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { THEME_COLORS } from '@/lib/theme-color'

/** Keeps the meta tag in step when the theme is toggled or the system setting changes. */
export function ThemeColor() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (resolvedTheme !== 'light' && resolvedTheme !== 'dark') return
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = THEME_COLORS[resolvedTheme]
  }, [resolvedTheme])

  return null
}
