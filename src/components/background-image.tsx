'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface BackgroundSettings {
  backgroundImage: string
  backgroundDisplayMode: 'cover' | 'contain' | 'center' | 'tile'
  backgroundOpacity: number
  backgroundShowLoggedOut: boolean
}

const defaultSettings: BackgroundSettings = {
  backgroundImage: '',
  backgroundDisplayMode: 'cover',
  backgroundOpacity: 100,
  backgroundShowLoggedOut: false,
}

export function BackgroundImage() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [settings, setSettings] = useState<BackgroundSettings>(defaultSettings)
  const [imageExists, setImageExists] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Check if background image exists first (no auth required)
    const checkImage = async () => {
      try {
        const response = await fetch('/api/background-image/serve', { method: 'HEAD' })
        setImageExists(response.ok)
      } catch {
        setImageExists(false)
      }
    }

    checkImage()
  }, [])

  useEffect(() => {
    // Only fetch settings when logged in
    if (status === 'loading') return

    if (session) {
      const fetchSettings = async () => {
        try {
          const response = await fetch('/api/settings')
          if (response.ok) {
            const data = await response.json()
            setSettings({
              backgroundImage: data.backgroundImage || '',
              backgroundDisplayMode: data.backgroundDisplayMode || 'cover',
              backgroundOpacity: parseInt(data.backgroundOpacity, 10) || 100,
              backgroundShowLoggedOut: data.backgroundShowLoggedOut === true || data.backgroundShowLoggedOut === 'true',
            })
          }
        } catch (error) {
          console.error('Failed to fetch background settings:', error)
        } finally {
          setLoaded(true)
        }
      }
      fetchSettings()
    } else {
      setLoaded(true)
    }
  }, [session, status])

  // Wait for session check and settings to load
  if (status === 'loading' || !loaded) {
    return null
  }

  // Don't render if image doesn't exist
  if (!imageExists) {
    return null
  }

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // When logged in: show if backgroundImage setting is set
  // When logged out: only show if showLoggedOut was enabled
  if (!session) {
    return null
  }

  if (!settings.backgroundImage) {
    return null
  }

  const modeClass = `bg-mode-${settings.backgroundDisplayMode}`
  // Calculate overlay opacity: at 100% background opacity, overlay is 0 (invisible)
  // at 0% background opacity, overlay is 1 (fully covers background)
  const overlayOpacity = 1 - settings.backgroundOpacity / 100

  return (
    <div
      className={`background-image-container ${modeClass}`}
      style={{
        backgroundImage: `url(/api/background-image/serve?t=${Date.now()})`,
      }}
    >
      {/* Overlay to control opacity */}
      <div
        className="absolute inset-0 bg-background"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  )
}
