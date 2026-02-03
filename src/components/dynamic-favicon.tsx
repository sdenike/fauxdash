'use client'

import { useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Dynamic favicon using canvas rendering to bypass all browser caching.
 * This is the most aggressive approach - converts any image to PNG via canvas.
 */
export function DynamicFavicon() {
  const pathname = usePathname()
  const initializedRef = useRef(false)

  const updateFavicon = useCallback(async () => {
    try {
      // Fetch favicon with aggressive cache-busting
      const cacheBuster = `${Date.now()}-${Math.random()}`
      const response = await fetch(`/api/site-favicon/serve?_=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })

      if (!response.ok) return

      const blob = await response.blob()
      const contentType = response.headers.get('content-type') || 'image/png'

      // Create image from blob
      const img = new Image()
      img.crossOrigin = 'anonymous'

      const imageUrl = URL.createObjectURL(blob)

      img.onload = () => {
        // Draw to canvas to convert any format to PNG
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const ctx = canvas.getContext('2d')

        if (ctx) {
          // For SVG, we need to handle it specially
          if (contentType.includes('svg')) {
            ctx.fillStyle = '#3b82f6'
            ctx.fillRect(0, 0, 32, 32)
            ctx.drawImage(img, 0, 0, 32, 32)
          } else {
            ctx.drawImage(img, 0, 0, 32, 32)
          }

          // Get as PNG data URL
          const pngDataUrl = canvas.toDataURL('image/png')

          // Remove ALL existing favicon links
          document.querySelectorAll('link[rel*="icon"]').forEach((el) => el.remove())

          // Create new link
          const link = document.createElement('link')
          link.rel = 'icon'
          link.type = 'image/png'
          link.href = pngDataUrl
          document.head.appendChild(link)

          // Also set shortcut icon for older browsers
          const shortcutLink = document.createElement('link')
          shortcutLink.rel = 'shortcut icon'
          shortcutLink.type = 'image/png'
          shortcutLink.href = pngDataUrl
          document.head.appendChild(shortcutLink)
        }

        URL.revokeObjectURL(imageUrl)
      }

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl)
        // Fallback: just use the blob directly
        const reader = new FileReader()
        reader.onloadend = () => {
          document.querySelectorAll('link[rel*="icon"]').forEach((el) => el.remove())
          const link = document.createElement('link')
          link.rel = 'icon'
          link.href = reader.result as string
          document.head.appendChild(link)
        }
        reader.readAsDataURL(blob)
      }

      img.src = imageUrl
    } catch (error) {
      console.error('Failed to update favicon:', error)
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      // Small delay to ensure DOM is ready
      setTimeout(updateFavicon, 100)
    }
  }, [updateFavicon])

  // Update on route changes
  useEffect(() => {
    if (initializedRef.current) {
      updateFavicon()
    }
  }, [pathname, updateFavicon])

  // Listen for manual favicon changes from settings
  useEffect(() => {
    const handleFaviconChange = () => {
      // Delay to ensure database write is complete
      setTimeout(updateFavicon, 500)
    }

    window.addEventListener('favicon-changed', handleFaviconChange)
    return () => window.removeEventListener('favicon-changed', handleFaviconChange)
  }, [updateFavicon])

  return null
}

// Helper function to trigger favicon refresh from other components
export function triggerFaviconRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('favicon-changed'))
  }
}
