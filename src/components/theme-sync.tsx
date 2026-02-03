'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import { getThemeByName, applyTheme, STANDALONE_THEMES } from '@/lib/themes'

export function ThemeSync() {
  const { setTheme, resolvedTheme } = useTheme()
  const { data: session, status } = useSession()
  const [themeApplied, setThemeApplied] = useState(false)

  // Fetch and apply theme mode preference
  // Works for both authenticated and unauthenticated users
  useEffect(() => {
    const fetchThemeMode = async () => {
      try {
        // Use authenticated endpoint if logged in, public endpoint otherwise
        const endpoint = session ? '/api/settings' : '/api/settings/public'
        const response = await fetch(endpoint)
        const data = await response.json()
        if (data.defaultTheme) {
          setTheme(data.defaultTheme)
        }
      } catch (error) {
        console.error('Failed to fetch theme mode:', error)
      }
    }

    // Only fetch when session status is determined (not 'loading')
    if (status !== 'loading') {
      fetchThemeMode()
    }
  }, [session, status, setTheme])

  // Apply theme colors when mode changes
  // Works for both authenticated and unauthenticated users
  useEffect(() => {
    const applyThemeColors = async () => {
      try {
        // Use authenticated endpoint if logged in, public endpoint otherwise
        const endpoint = session ? '/api/settings' : '/api/settings/public'
        const response = await fetch(endpoint)
        const data = await response.json()

        if (data.themeColor && resolvedTheme) {
          // Check if this is a standalone theme (already includes its own colors)
          const isStandalone = STANDALONE_THEMES.some(t => t.name === data.themeColor)
          let selectedTheme = null

          if (isStandalone) {
            // Standalone themes apply directly without "(Dark)" suffix
            selectedTheme = getThemeByName(data.themeColor)
          } else {
            // Standard themes use "(Dark)" variant in dark mode
            const isDark = resolvedTheme === 'dark'
            const themeName = isDark ? `${data.themeColor} (Dark)` : data.themeColor
            selectedTheme = getThemeByName(themeName)
          }

          if (selectedTheme) {
            applyTheme(selectedTheme)
            setThemeApplied(true)
          }
        }
      } catch (error) {
        console.error('Failed to apply theme colors:', error)
      }
    }

    // Only apply when session status is determined and we have a resolved theme
    if (status !== 'loading' && resolvedTheme) {
      applyThemeColors()
    }
  }, [session, status, resolvedTheme])

  return null
}
