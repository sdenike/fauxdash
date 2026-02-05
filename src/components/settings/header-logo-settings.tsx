'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings } from './types'
import { Upload, Trash2, Eye } from 'lucide-react'
import Image from 'next/image'

interface HeaderLogoSettingsProps {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

export function HeaderLogoSettings({ settings, updateSetting }: HeaderLogoSettingsProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
      setShowPreview(true)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/header-logo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload logo')
      }

      const data = await response.json()

      // Update settings
      updateSetting('headerLogoPath', data.path)
      updateSetting('headerLogoEnabled', true)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload logo')
    } finally {
      setUploading(false)
      setShowPreview(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the header logo?')) return

    try {
      const response = await fetch('/api/header-logo', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete logo')
      }

      updateSetting('headerLogoPath', '')
      updateSetting('headerLogoEnabled', false)
      setPreview(null)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete logo')
    }
  }

  const heightOptions = [
    { value: 24, label: '24px - Small' },
    { value: 32, label: '32px - Medium' },
    { value: 40, label: '40px - Default' },
    { value: 48, label: '48px - Large' },
    { value: 56, label: '56px - Extra Large' },
    { value: 64, label: '64px - Maximum' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Header Logo</CardTitle>
        <CardDescription>
          Add a logo next to your site title in the header
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="header-logo-enabled">Display Logo</Label>
            <div className="text-sm text-muted-foreground">
              Show logo in the header
            </div>
          </div>
          <Switch
            id="header-logo-enabled"
            checked={settings.headerLogoEnabled}
            onCheckedChange={(checked) => updateSetting('headerLogoEnabled', checked)}
          />
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <Label>Logo Image</Label>
          <div className="text-sm text-muted-foreground mb-2">
            Recommended: PNG or SVG with transparent background. Maximum height: 64px.
            Image will be automatically resized while preserving aspect ratio.
          </div>

          {/* Current Logo Preview */}
          {settings.headerLogoPath && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="relative bg-background rounded p-2 border">
                  <Image
                    src={settings.headerLogoPath}
                    alt="Header logo"
                    width={100}
                    height={settings.headerLogoHeight}
                    style={{ height: settings.headerLogoHeight, width: 'auto' }}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  Current logo (Height: {settings.headerLogoHeight}px)
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Upload Preview */}
          {showPreview && preview && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="relative bg-background rounded p-2 border">
                  <img
                    src={preview}
                    alt="Preview"
                    style={{ maxHeight: 64, width: 'auto' }}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  Uploading...
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {settings.headerLogoPath ? 'Replace Logo' : 'Upload Logo'}
            </Button>
          </div>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label htmlFor="header-logo-position">Logo Position</Label>
          <Select
            value={settings.headerLogoPosition}
            onValueChange={(value: 'left' | 'right') => updateSetting('headerLogoPosition', value)}
          >
            <SelectTrigger id="header-logo-position">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left of Site Title</SelectItem>
              <SelectItem value="right">Right of Site Title</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            Position the logo relative to the site title
          </div>
        </div>

        {/* Height */}
        <div className="space-y-2">
          <Label htmlFor="header-logo-height">Logo Height</Label>
          <Select
            value={settings.headerLogoHeight.toString()}
            onValueChange={(value) => updateSetting('headerLogoHeight', parseInt(value))}
          >
            <SelectTrigger id="header-logo-height">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {heightOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            Logo will be resized to this height while maintaining aspect ratio
          </div>
        </div>

        {/* Preview in Context */}
        {settings.headerLogoPath && (
          <div className="space-y-2 pt-4 border-t">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-background">
              <div className={`flex items-center gap-3 ${settings.headerLogoPosition === 'right' ? 'flex-row-reverse justify-end' : ''}`}>
                <Image
                  src={settings.headerLogoPath}
                  alt="Logo preview"
                  width={100}
                  height={settings.headerLogoHeight}
                  style={{ height: settings.headerLogoHeight, width: 'auto' }}
                  className="object-contain"
                />
                <div className="text-2xl font-bold">
                  {settings.siteTitle}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              This is how the logo will appear in the header
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
