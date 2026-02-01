'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  PhotoIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface BackgroundImageSettingsProps {
  backgroundImage: string
  displayMode: 'cover' | 'contain' | 'center' | 'tile'
  opacity: number
  showLoggedOut: boolean
  onChange: (settings: {
    backgroundImage?: string
    backgroundDisplayMode?: 'cover' | 'contain' | 'center' | 'tile'
    backgroundOpacity?: number
    backgroundShowLoggedOut?: boolean
  }) => void
}

export function BackgroundImageSettings({
  backgroundImage,
  displayMode,
  opacity,
  showLoggedOut,
  onChange,
}: BackgroundImageSettingsProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [localOpacity, setLocalOpacity] = useState(opacity)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync local opacity with prop
  useEffect(() => {
    setLocalOpacity(opacity)
  }, [opacity])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPEG, WebP, or GIF file.',
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/background-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        onChange({ backgroundImage: data.path })
        // Save immediately so it takes effect right away
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backgroundImage: data.path }),
        })
        toast({
          variant: 'success',
          title: 'Background uploaded',
          description: 'Your background image has been updated.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: data.error || 'Failed to upload background image.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload background. Please try again.',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [onChange, toast])

  const handleRemove = useCallback(async () => {
    try {
      await fetch('/api/background-image', { method: 'DELETE' })
      onChange({ backgroundImage: '' })
      // Save immediately
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backgroundImage: '' }),
      })
      toast({
        title: 'Background removed',
        description: 'Your background image has been removed.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Remove failed',
        description: 'Failed to remove background image.',
      })
    }
  }, [onChange, toast])

  const handleOpacityChange = useCallback((value: number) => {
    setLocalOpacity(value)
  }, [])

  const handleOpacityCommit = useCallback(() => {
    onChange({ backgroundOpacity: localOpacity })
  }, [localOpacity, onChange])

  return (
    <div className="space-y-6">
      {/* Preview and Upload */}
      <div>
        <Label>Background Image</Label>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview */}
          <div
            className="relative h-40 rounded-md border overflow-hidden"
            style={{
              backgroundImage: backgroundImage ? `url(/api/background-image/serve)` : 'none',
              backgroundColor: backgroundImage ? 'transparent' : 'hsl(var(--muted))',
              backgroundSize: displayMode === 'tile' ? 'auto' : displayMode,
              backgroundRepeat: displayMode === 'tile' ? 'repeat' : 'no-repeat',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay to show opacity effect */}
            <div
              className="absolute inset-0 bg-background"
              style={{ opacity: 1 - localOpacity / 100 }}
            />
            {!backgroundImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <PhotoIcon className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">No background image</p>
                </div>
              </div>
            )}
            {backgroundImage && (
              <div className="absolute bottom-2 right-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  className="h-8"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Upload area */}
          <div className="flex flex-col justify-center items-center p-4 rounded-md border border-dashed bg-muted/30">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.gif"
              onChange={handleFileUpload}
              className="hidden"
              id="background-upload"
            />
            <ArrowUpTrayIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Choose image'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              PNG, JPEG, WebP, or GIF (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Settings (only show if background is set) */}
      {backgroundImage && (
        <>
          {/* Display Mode */}
          <div>
            <Label htmlFor="displayMode">Display Mode</Label>
            <Select
              value={displayMode}
              onValueChange={(value: 'cover' | 'contain' | 'center' | 'tile') =>
                onChange({ backgroundDisplayMode: value })
              }
            >
              <SelectTrigger id="displayMode" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">
                  <div>
                    <span className="font-medium">Cover</span>
                    <span className="text-muted-foreground ml-2">Fill screen, may crop</span>
                  </div>
                </SelectItem>
                <SelectItem value="contain">
                  <div>
                    <span className="font-medium">Contain</span>
                    <span className="text-muted-foreground ml-2">Fit entire image, may have gaps</span>
                  </div>
                </SelectItem>
                <SelectItem value="center">
                  <div>
                    <span className="font-medium">Center</span>
                    <span className="text-muted-foreground ml-2">Original size, centered</span>
                  </div>
                </SelectItem>
                <SelectItem value="tile">
                  <div>
                    <span className="font-medium">Tile</span>
                    <span className="text-muted-foreground ml-2">Repeat pattern</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opacity */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="backgroundOpacity">Content Overlay Transparency</Label>
              <span className="text-sm text-muted-foreground">{localOpacity}%</span>
            </div>
            <input
              type="range"
              id="backgroundOpacity"
              min="0"
              max="100"
              step="5"
              value={localOpacity}
              onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
              onMouseUp={handleOpacityCommit}
              onTouchEnd={handleOpacityCommit}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Higher values make the background more visible
            </p>
          </div>

          {/* Show when logged out */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showLoggedOut">Show When Logged Out</Label>
              <p className="text-sm text-muted-foreground">
                Display background image on the login page
              </p>
            </div>
            <Switch
              id="showLoggedOut"
              checked={showLoggedOut}
              onCheckedChange={(checked) => onChange({ backgroundShowLoggedOut: checked })}
            />
          </div>
        </>
      )}
    </div>
  )
}
