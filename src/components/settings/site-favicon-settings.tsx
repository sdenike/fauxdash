'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { IconSelector } from '@/components/icon-selector'
import {
  PhotoIcon,
  ArrowUpTrayIcon,
  LinkIcon,
  Squares2X2Icon,
  TrashIcon,
  SparklesIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline'
import { triggerFaviconRefresh } from '@/components/dynamic-favicon'

interface SiteFaviconSettingsProps {
  favicon: string
  faviconType: 'upload' | 'library' | 'url' | 'default'
  onChange: (favicon: string, faviconType: 'upload' | 'library' | 'url' | 'default') => void
}

export function SiteFaviconSettings({ favicon, faviconType, onChange }: SiteFaviconSettingsProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [convertingColor, setConvertingColor] = useState(false)
  const [convertingGrayscale, setConvertingGrayscale] = useState(false)
  const [invertingColors, setInvertingColors] = useState(false)
  const [originalFavicon, setOriginalFavicon] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/jpeg']
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a PNG, ICO, SVG, or JPEG file.',
      })
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 1MB.',
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/site-favicon', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        // Save immediately so it takes effect right away
        const settingsResponse = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteFavicon: data.path, siteFaviconType: 'upload' }),
        })

        console.log('[Favicon Upload] Settings API response:', {
          ok: settingsResponse.ok,
          status: settingsResponse.status,
          statusText: settingsResponse.statusText,
        })

        if (!settingsResponse.ok) {
          const errorText = await settingsResponse.text()
          console.error('[Favicon Upload] Settings save failed:', errorText)
          toast({
            variant: 'destructive',
            title: 'Settings save failed',
            description: `Status: ${settingsResponse.status}. Check console for details.`,
          })
          return
        }

        const settingsData = await settingsResponse.json()
        console.log('[Favicon Upload] Settings saved successfully:', settingsData)

        onChange(data.path, 'upload')
        triggerFaviconRefresh()
        toast({
          variant: 'success',
          title: 'Favicon uploaded',
          description: 'Your site favicon has been updated. Reloading page...',
        })
        // Reload page after a short delay to ensure the new favicon shows
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: data.error || 'Failed to upload favicon.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload favicon. Please try again.',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [onChange, toast])

  const handleFetchUrl = useCallback(async () => {
    if (!urlInput.trim()) {
      toast({
        variant: 'destructive',
        title: 'URL required',
        description: 'Please enter a favicon URL.',
      })
      return
    }

    setFetchingUrl(true)
    try {
      const response = await fetch('/api/site-favicon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      })

      const data = await response.json()

      if (data.success) {
        // Save immediately
        const settingsResponse = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteFavicon: data.path, siteFaviconType: 'url' }),
        })

        if (!settingsResponse.ok) {
          toast({
            variant: 'destructive',
            title: 'Settings save failed',
            description: 'Failed to save favicon settings to database.',
          })
          return
        }

        onChange(data.path, 'url')
        setUrlInput('')
        triggerFaviconRefresh()
        toast({
          variant: 'success',
          title: 'Favicon fetched',
          description: 'Your site favicon has been updated. Reloading page...',
        })
        // Reload page after a short delay to ensure the new favicon shows
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          variant: 'destructive',
          title: 'Fetch failed',
          description: data.error || 'Failed to fetch favicon from URL.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fetch failed',
        description: 'Failed to fetch favicon. Please try again.',
      })
    } finally {
      setFetchingUrl(false)
    }
  }, [urlInput, onChange, toast])

  const handleIconSelect = useCallback(async (iconName: string) => {
    // Save immediately
    const settingsResponse = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteFavicon: iconName, siteFaviconType: 'library' }),
    })

    if (!settingsResponse.ok) {
      toast({
        variant: 'destructive',
        title: 'Settings save failed',
        description: 'Failed to save favicon settings to database.',
      })
      return
    }

    onChange(iconName, 'library')
    triggerFaviconRefresh()
    toast({
      variant: 'success',
      title: 'Favicon updated',
      description: 'Reloading page...',
    })
    // Reload page after a short delay to ensure the new favicon shows
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }, [onChange, toast])

  const handleClear = useCallback(async () => {
    // Save immediately
    const settingsResponse = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteFavicon: '', siteFaviconType: 'default' }),
    })

    if (!settingsResponse.ok) {
      toast({
        variant: 'destructive',
        title: 'Settings save failed',
        description: 'Failed to save favicon settings to database.',
      })
      return
    }

    onChange('', 'default')
    setOriginalFavicon(null)
    triggerFaviconRefresh()
    toast({
      title: 'Favicon reset',
      description: 'Using default Faux|Dash favicon. Reloading page...',
    })
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }, [onChange, toast])

  const handleConvertColor = useCallback(async () => {
    if (!favicon || !favicon.startsWith('favicon:')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a favicon from the library first.',
      })
      return
    }

    // Store original favicon before converting
    if (!originalFavicon) {
      setOriginalFavicon(favicon)
    }

    setConvertingColor(true)
    try {
      const settingsRes = await fetch('/api/settings')
      const settings = await settingsRes.json()
      const sourceIcon = originalFavicon || favicon

      const response = await fetch('/api/favicons/convert-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favicon: sourceIcon,
          color: settings.themeColor || 'Slate',
        }),
      })

      const data = await response.json()

      if (data.success && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        const settingsResponse = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteFavicon: newIconPath, siteFaviconType: 'library' }),
        })

        if (!settingsResponse.ok) {
          toast({
            variant: 'destructive',
            title: 'Settings save failed',
            description: 'Failed to save favicon settings to database.',
          })
          return
        }

        onChange(newIconPath, 'library')
        triggerFaviconRefresh()
        toast({
          variant: 'success',
          title: 'Color converted',
          description: 'Favicon converted to theme color. Reloading page...',
        })
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          variant: 'destructive',
          title: 'Conversion failed',
          description: data.error || 'Failed to convert favicon color.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Conversion failed',
        description: 'Failed to convert favicon. Please try again.',
      })
    } finally {
      setConvertingColor(false)
    }
  }, [favicon, originalFavicon, onChange, toast])

  const handleConvertGrayscale = useCallback(async () => {
    if (!favicon || !favicon.startsWith('favicon:')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a favicon from the library first.',
      })
      return
    }

    if (!originalFavicon) {
      setOriginalFavicon(favicon)
    }

    setConvertingGrayscale(true)
    try {
      const sourceIcon = originalFavicon || favicon

      const response = await fetch('/api/favicons/convert-grayscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon: sourceIcon }),
      })

      const data = await response.json()

      if (data.success && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        const settingsResponse = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteFavicon: newIconPath, siteFaviconType: 'library' }),
        })

        if (!settingsResponse.ok) {
          toast({
            variant: 'destructive',
            title: 'Settings save failed',
            description: 'Failed to save favicon settings to database.',
          })
          return
        }

        onChange(newIconPath, 'library')
        triggerFaviconRefresh()
        toast({
          variant: 'success',
          title: 'Grayscale applied',
          description: 'Favicon converted to grayscale. Reloading page...',
        })
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          variant: 'destructive',
          title: 'Conversion failed',
          description: data.error || 'Failed to convert to grayscale.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Conversion failed',
        description: 'Failed to convert favicon. Please try again.',
      })
    } finally {
      setConvertingGrayscale(false)
    }
  }, [favicon, originalFavicon, onChange, toast])

  const handleInvertColors = useCallback(async () => {
    if (!favicon || !favicon.startsWith('favicon:')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a favicon from the library first.',
      })
      return
    }

    if (!originalFavicon) {
      setOriginalFavicon(favicon)
    }

    setInvertingColors(true)
    try {
      const sourceIcon = originalFavicon || favicon

      const response = await fetch('/api/favicons/invert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon: sourceIcon }),
      })

      const data = await response.json()

      if (data.success && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        const settingsResponse = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteFavicon: newIconPath, siteFaviconType: 'library' }),
        })

        if (!settingsResponse.ok) {
          toast({
            variant: 'destructive',
            title: 'Settings save failed',
            description: 'Failed to save favicon settings to database.',
          })
          return
        }

        onChange(newIconPath, 'library')
        triggerFaviconRefresh()
        toast({
          variant: 'success',
          title: 'Colors inverted',
          description: 'Favicon colors have been inverted. Reloading page...',
        })
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          variant: 'destructive',
          title: 'Inversion failed',
          description: data.error || 'Failed to invert colors.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Inversion failed',
        description: 'Failed to invert favicon. Please try again.',
      })
    } finally {
      setInvertingColors(false)
    }
  }, [favicon, originalFavicon, onChange, toast])

  const handleRevertFavicon = useCallback(async () => {
    if (originalFavicon) {
      const settingsResponse = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteFavicon: originalFavicon, siteFaviconType: 'library' }),
      })

      if (!settingsResponse.ok) {
        toast({
          variant: 'destructive',
          title: 'Settings save failed',
          description: 'Failed to save favicon settings to database.',
        })
        return
      }

      onChange(originalFavicon, 'library')
      setOriginalFavicon(null)
      triggerFaviconRefresh()
      toast({
        title: 'Reverted',
        description: 'Favicon restored to original. Reloading page...',
      })
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }, [originalFavicon, onChange, toast])

  // Compute the preview URL
  const getPreviewUrl = () => {
    if (!favicon) return null
    if (favicon.startsWith('favicon:')) {
      const path = favicon.replace('favicon:', '')
      return path.startsWith('/api/favicons/serve/') ? path : `/api/favicons/serve/${path}`
    }
    return `/api/site-favicon/serve`
  }

  const previewUrl = getPreviewUrl()

  return (
    <div className="space-y-4">
      <div>
        <Label>Current Favicon</Label>
        <div className="flex items-center gap-4 mt-2 p-3 rounded-md border bg-muted/50">
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt="Site favicon"
              className="w-8 h-8 object-contain"
            />
          ) : (
            <div className="w-8 h-8 flex items-center justify-center bg-background rounded border">
              <PhotoIcon className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {faviconType === 'default' ? 'Default' : faviconType === 'upload' ? 'Custom upload' : faviconType === 'url' ? 'From URL' : 'From library'}
            </p>
            {favicon && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{favicon}</p>
            )}
          </div>
          {favicon && faviconType !== 'default' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Transformation buttons - only show for library icons */}
        {favicon && faviconType === 'library' && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleConvertColor}
              disabled={convertingColor}
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              {convertingColor ? 'Converting...' : 'Theme Color'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleConvertGrayscale}
              disabled={convertingGrayscale}
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              {convertingGrayscale ? 'Converting...' : 'Grayscale'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleInvertColors}
              disabled={invertingColors}
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              {invertingColors ? 'Inverting...' : 'Invert Colors'}
            </Button>
            {originalFavicon && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRevertFavicon}
              >
                <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
                Revert
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upload option */}
        <div className="p-4 rounded-md border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpTrayIcon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">Upload</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.ico,.svg,.jpg,.jpeg"
            onChange={handleFileUpload}
            className="hidden"
            id="favicon-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Choose file'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            PNG, ICO, SVG, or JPEG (max 1MB)
          </p>
        </div>

        {/* Icon library option */}
        <div className="p-4 rounded-md border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Squares2X2Icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">Library</span>
          </div>
          <IconSelector
            value={faviconType === 'library' ? favicon : undefined}
            onChange={handleIconSelect}
            trigger={
              <Button type="button" variant="outline" size="sm" className="w-full">
                Select icon
              </Button>
            }
          />
          <p className="text-xs text-muted-foreground mt-2">
            Choose from HeroIcons or Selfh.st
          </p>
        </div>

        {/* URL option */}
        <div className="p-4 rounded-md border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">From URL</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
              className="text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFetchUrl}
              disabled={fetchingUrl || !urlInput.trim()}
            >
              {fetchingUrl ? '...' : 'Fetch'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Direct link to favicon image
          </p>
        </div>
      </div>
    </div>
  )
}
