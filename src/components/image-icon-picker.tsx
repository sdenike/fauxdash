'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { IconSelector } from '@/components/icon-selector'
import { MediaLibraryPicker } from '@/components/media-library-picker'
import {
  PhotoIcon,
  ArrowUpTrayIcon,
  LinkIcon,
  Squares2X2Icon,
  FolderIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

export type ImageIconType = 'upload' | 'library' | 'url' | 'none'

interface ImageIconPickerProps {
  value: string
  valueType: ImageIconType
  onChange: (value: string, type: ImageIconType) => void

  // Upload config
  uploadEndpoint: string
  uploadFieldName?: string
  acceptedFileTypes?: string
  maxFileSize?: number

  // Serve config
  serveEndpoint?: string
  urlFetchEndpoint?: string

  // Display
  previewHeight?: number
  label?: string
  description?: string

  // Feature flags
  showUpload?: boolean
  showLibrary?: boolean
  showUrl?: boolean
  showMediaLibrary?: boolean

  // Media library
  onMediaSelect?: (filename: string) => void
}

export function ImageIconPicker({
  value,
  valueType,
  onChange,
  uploadEndpoint,
  uploadFieldName = 'file',
  acceptedFileTypes = '.png,.jpg,.jpeg,.webp,.gif',
  maxFileSize = 10 * 1024 * 1024,
  serveEndpoint,
  urlFetchEndpoint,
  previewHeight = 64,
  label,
  description,
  showUpload = true,
  showLibrary = true,
  showUrl = true,
  showMediaLibrary = true,
  onMediaSelect,
}: ImageIconPickerProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [imageExists, setImageExists] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Verify image exists on mount
  useEffect(() => {
    if (serveEndpoint && value) {
      fetch(serveEndpoint, { method: 'HEAD' })
        .then(res => setImageExists(res.ok))
        .catch(() => setImageExists(false))
    } else if (value) {
      setImageExists(true)
    } else {
      setImageExists(false)
    }
  }, [serveEndpoint, value])

  const getPreviewUrl = useCallback(() => {
    if (!value || valueType === 'none') return null
    // Handle media library references
    if (value.startsWith('media:')) {
      const filename = value.replace('media:', '')
      return `/api/media-library/${encodeURIComponent(filename)}?thumb=1`
    }
    if (valueType === 'upload') {
      return serveEndpoint || value
    }
    // library or url — both use favicon: prefix after being saved locally
    if (value.startsWith('favicon:')) {
      const path = value.replace('favicon:', '')
      return path.startsWith('/api/favicons/serve/') ? path : `/api/favicons/serve/${path}`
    }
    return serveEndpoint || value
  }, [value, valueType, serveEndpoint])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file.',
      })
      return
    }

    if (file.size > maxFileSize) {
      const sizeMB = Math.round(maxFileSize / 1024 / 1024)
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `Maximum file size is ${sizeMB}MB.`,
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append(uploadFieldName, file)

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      const path = data.path || data.url || ''
      setImageExists(true)
      onChange(path, 'upload')
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [uploadEndpoint, uploadFieldName, maxFileSize, onChange, toast])

  const handleIconSelect = useCallback((iconName: string) => {
    setImageExists(true)
    onChange(iconName, 'library')
  }, [onChange])

  const handleFetchUrl = useCallback(async () => {
    if (!urlInput.trim()) {
      toast({
        variant: 'destructive',
        title: 'URL required',
        description: 'Please enter an image URL.',
      })
      return
    }

    setFetchingUrl(true)
    try {
      const response = await fetch(urlFetchEndpoint || uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      })

      const data = await response.json()

      if (data.success) {
        setImageExists(true)
        setUrlInput('')
        onChange(data.path, 'url')
      } else {
        toast({
          variant: 'destructive',
          title: 'Fetch failed',
          description: data.error || 'Failed to fetch image from URL.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fetch failed',
        description: 'Failed to fetch image. Please try again.',
      })
    } finally {
      setFetchingUrl(false)
    }
  }, [urlInput, onChange, toast])

  const handleMediaSelect = useCallback((filename: string) => {
    if (onMediaSelect) {
      onMediaSelect(filename)
    } else {
      setImageExists(true)
      onChange(`media:${filename}`, 'upload')
    }
  }, [onMediaSelect, onChange])

  const handleRemove = useCallback(() => {
    setImageExists(false)
    onChange('', 'none')
  }, [onChange])

  const previewUrl = getPreviewUrl()
  const typeLabel = value?.startsWith('media:') ? 'From uploads' :
                    valueType === 'upload' ? 'Custom upload' :
                    valueType === 'library' ? 'From library' :
                    valueType === 'url' ? 'From URL' : 'None'

  // Count visible columns for responsive grid
  const visibleColumns = useMemo(() => {
    let count = 0
    if (showUpload) count++
    if (showLibrary) count++
    if (showUrl) count++
    if (showMediaLibrary) count++
    return count
  }, [showUpload, showLibrary, showUrl, showMediaLibrary])

  const gridClass = visibleColumns <= 2
    ? `grid grid-cols-1 md:grid-cols-2 gap-4`
    : visibleColumns === 3
    ? `grid grid-cols-1 md:grid-cols-3 gap-4`
    : `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`

  return (
    <div className="space-y-4">
      {label && (
        <div>
          <Label>{label}</Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Preview */}
      <div className="flex items-center gap-4 p-3 rounded-md border bg-muted/50">
        {previewUrl && imageExists ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt="Preview"
            style={{ height: previewHeight, width: 'auto', maxWidth: 200 }}
            className="object-contain"
          />
        ) : (
          <div
            className="flex items-center justify-center bg-background rounded border"
            style={{ width: previewHeight, height: previewHeight }}
          >
            <PhotoIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">{typeLabel}</p>
          {value && valueType !== 'none' && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{value}</p>
          )}
        </div>
        {value && valueType !== 'none' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Action grid */}
      <div className={gridClass}>
        {showUpload && (
          <div className="p-4 rounded-md border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpTrayIcon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">Upload</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileUpload}
              className="hidden"
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
              {acceptedFileTypes.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')}
            </p>
          </div>
        )}

        {showLibrary && (
          <div className="p-4 rounded-md border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Squares2X2Icon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">Library</span>
            </div>
            <IconSelector
              value={valueType === 'library' ? value : undefined}
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
        )}

        {showUrl && (
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
              Direct link to an image
            </p>
          </div>
        )}

        {showMediaLibrary && (
          <div className="p-4 rounded-md border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <FolderIcon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">Your Uploads</span>
            </div>
            <MediaLibraryPicker onSelect={handleMediaSelect} />
            <p className="text-xs text-muted-foreground mt-2">
              Reuse a previously uploaded image
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
