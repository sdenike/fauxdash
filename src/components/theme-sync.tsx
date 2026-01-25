'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import { getThemeByName, applyTheme } from '@/lib/themes'

export function ThemeSync() {
  const { setTheme, resolvedTheme } = useTheme()
  const { data: session } = useSession()

  // Fetch and apply theme mode preference
  useEffect(() => {
    const fetchThemeMode = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (data.defaultTheme) {
          setTheme(data.defaultTheme)
        }
      } catch (error) {
        console.error('Failed to fetch theme mode:', error)
      }
    }

    if (session) {
      fetchThemeMode()
    }
  }, [session, setTheme])

  // Apply theme colors when mode changes
  useEffect(() => {
    const applyThemeColors = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()

        if (data.themeColor && resolvedTheme) {
          // Determine which theme variant to use
          const isDark = resolvedTheme === 'dark'
          const themeName = isDark ? `${data.themeColor} (Dark)` : data.themeColor

          const selectedTheme = getThemeByName(themeName)
          if (selectedTheme) {
            applyTheme(selectedTheme)
          }
        }
      } catch (error) {
        console.error('Failed to apply theme colors:', error)
      }
    }

    if (session && resolvedTheme) {
      applyThemeColors()
    }
  }, [session, resolvedTheme])

  return null
}
