'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
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
import { SettingsTabProps } from './types'

export function HomepageGraphicSettings({ settings, onSettingsChange }: SettingsTabProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [imageExists, setImageExists] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  // Check if image exists on mount
  useEffect(() => {
    fetch('/api/homepage-graphic/serve', { method: 'HEAD' })
      .then(res => setImageExists(res.ok))
      .catch(() => setImageExists(false))
  }, [])

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

      const response = await fetch('/api/homepage-graphic', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        updateSetting('homepageGraphicPath', data.path)
        setImageExists(true)
        // Save immediately
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ homepageGraphicPath: data.path }),
        })
        toast({
          variant: 'success',
          title: 'Graphic uploaded',
          description: 'Your homepage graphic has been updated.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: data.error || 'Failed to upload graphic.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload graphic. Please try again.',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [toast, updateSetting])

  const handleRemove = useCallback(async () => {
    try {
      await fetch('/api/homepage-graphic', { method: 'DELETE' })
      updateSetting('homepageGraphicPath', '')
      setImageExists(false)
      // Save immediately
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homepageGraphicPath: '' }),
      })
      toast({
        title: 'Graphic removed',
        description: 'Your homepage graphic has been removed.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Remove failed',
        description: 'Failed to remove graphic.',
      })
    }
  }, [toast, updateSetting])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Graphic</CardTitle>
        <CardDescription>
          Display a custom logo or image on your homepage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="homepageGraphicEnabled">Enable Homepage Graphic</Label>
            <p className="text-sm text-muted-foreground">
              Show a custom image on the homepage
            </p>
          </div>
          <Switch
            id="homepageGraphicEnabled"
            checked={settings.homepageGraphicEnabled}
            onCheckedChange={(checked) => updateSetting('homepageGraphicEnabled', checked)}
          />
        </div>

        {settings.homepageGraphicEnabled && (
          <>
            {/* Preview and Upload */}
            <div>
              <Label>Graphic Image</Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preview */}
                <div
                  className="relative h-40 rounded-md border overflow-hidden flex items-center justify-center bg-muted/30"
                  style={{
                    justifyContent: settings.homepageGraphicHAlign === 'left' ? 'flex-start' :
                                    settings.homepageGraphicHAlign === 'right' ? 'flex-end' : 'center',
                    alignItems: settings.homepageGraphicVAlign === 'top' ? 'flex-start' :
                                settings.homepageGraphicVAlign === 'bottom' ? 'flex-end' : 'center',
                  }}
                >
                  {imageExists ? (
                    <>
                      <img
                        src="/api/homepage-graphic/serve"
                        alt="Homepage graphic preview"
                        style={{ maxWidth: `${settings.homepageGraphicMaxWidth}px`, maxHeight: '100%' }}
                        className="object-contain"
                      />
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
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <PhotoIcon className="h-10 w-10 mx-auto mb-2" />
                      <p className="text-sm">No graphic uploaded</p>
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
                    id="graphic-upload"
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

            {/* Display Settings */}
            {imageExists && (
              <>
                {/* Max Width */}
                <div>
                  <Label htmlFor="homepageGraphicMaxWidth">Display Width</Label>
                  <Select
                    value={settings.homepageGraphicMaxWidth.toString()}
                    onValueChange={(value) => updateSetting('homepageGraphicMaxWidth', parseInt(value))}
                  >
                    <SelectTrigger id="homepageGraphicMaxWidth" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100px</SelectItem>
                      <SelectItem value="150">150px</SelectItem>
                      <SelectItem value="200">200px (default)</SelectItem>
                      <SelectItem value="250">250px</SelectItem>
                      <SelectItem value="300">300px</SelectItem>
                      <SelectItem value="400">400px</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum width of the graphic on desktop
                  </p>
                </div>

                {/* Horizontal Alignment */}
                <div>
                  <Label htmlFor="homepageGraphicHAlign">Horizontal Alignment</Label>
                  <Select
                    value={settings.homepageGraphicHAlign}
                    onValueChange={(value: 'left' | 'center' | 'right') => updateSetting('homepageGraphicHAlign', value)}
                  >
                    <SelectTrigger id="homepageGraphicHAlign" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Position relative to content */}
                <div>
                  <Label htmlFor="homepageGraphicPosition">Position</Label>
                  <Select
                    value={settings.homepageGraphicPosition}
                    onValueChange={(value: 'above' | 'below') => updateSetting('homepageGraphicPosition', value)}
                  >
                    <SelectTrigger id="homepageGraphicPosition" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above content</SelectItem>
                      <SelectItem value="below">Below content</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Position relative to description and welcome message
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
