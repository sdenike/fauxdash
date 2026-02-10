'use client'

import { useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { ImageIconPicker, ImageIconType } from '@/components/image-icon-picker'

interface PwaIconSettingsProps {
  pwaIconPath: string
  pwaIconType: 'upload' | 'library' | 'url' | 'none'
  onChange: (path: string, type: 'upload' | 'library' | 'url' | 'none') => void
}

export function PwaIconSettings({ pwaIconPath, pwaIconType, onChange }: PwaIconSettingsProps) {
  const { toast } = useToast()

  const handleChange = useCallback(async (value: string, type: ImageIconType) => {
    // For library selections, generate PWA icon sizes via the API
    if (type === 'library' && value) {
      try {
        const response = await fetch('/api/pwa-icons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ libraryIcon: value }),
        })
        const data = await response.json()
        if (!data.success) {
          toast({
            variant: 'destructive',
            title: 'Icon generation failed',
            description: data.error || 'Failed to generate PWA icon sizes.',
          })
          return
        }
      } catch {
        toast({
          variant: 'destructive',
          title: 'Icon generation failed',
          description: 'Failed to generate PWA icon sizes.',
        })
        return
      }
    }

    // Save settings immediately
    const settingsResponse = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pwaIconPath: value, pwaIconType: type }),
    })

    if (!settingsResponse.ok) {
      toast({
        variant: 'destructive',
        title: 'Settings save failed',
        description: 'Failed to save PWA icon settings.',
      })
      return
    }

    // For removal, delete generated icons
    if (type === 'none') {
      await fetch('/api/pwa-icons', { method: 'DELETE' })
    }

    onChange(value, type)
    toast({
      variant: 'success',
      title: type === 'none' ? 'PWA icon reset' : 'PWA icon updated',
      description: type === 'none'
        ? 'Using default PWA icons.'
        : 'PWA app icon has been updated.',
    })
  }, [onChange, toast])

  const handleMediaSelect = useCallback(async (filename: string) => {
    toast({ title: 'Processing...', description: 'Generating PWA icon sizes from upload.' })

    try {
      // Fetch the original from media library
      const res = await fetch(`/api/media-library/${encodeURIComponent(filename)}`)
      if (!res.ok) throw new Error('Failed to fetch original')

      const blob = await res.blob()
      const formData = new FormData()
      formData.append('file', blob, filename)
      formData.append('fromMediaLibrary', '1')

      // Re-upload to PWA icons endpoint to generate all sizes
      const uploadRes = await fetch('/api/pwa-icons', {
        method: 'POST',
        body: formData,
      })
      const data = await uploadRes.json()
      if (!data.success) throw new Error(data.error || 'Failed to generate PWA icons')

      // Save settings with media: prefix
      const mediaRef = `media:${filename}`
      const settingsRes = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pwaIconPath: mediaRef, pwaIconType: 'upload' }),
      })

      if (!settingsRes.ok) throw new Error('Failed to save settings')

      onChange(mediaRef, 'upload')
      toast({
        variant: 'success',
        title: 'PWA icon updated',
        description: 'PWA app icon generated from your upload.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed',
        description: error.message || 'Failed to process upload.',
      })
    }
  }, [onChange, toast])

  return (
    <ImageIconPicker
      value={pwaIconPath}
      valueType={pwaIconType === 'none' ? 'none' : pwaIconType as ImageIconType}
      onChange={handleChange}
      uploadEndpoint="/api/pwa-icons"
      serveEndpoint="/api/pwa-icons/serve/192"
      urlFetchEndpoint="/api/pwa-icons"
      maxFileSize={5 * 1024 * 1024}
      acceptedFileTypes=".png,.jpg,.jpeg,.webp,.svg"
      previewHeight={64}
      onMediaSelect={handleMediaSelect}
    />
  )
}
