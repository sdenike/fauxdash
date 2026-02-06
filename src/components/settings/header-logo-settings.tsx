'use client'

import { useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Settings, SettingsTabProps } from './types'
import { ImageIconPicker, ImageIconType } from '@/components/image-icon-picker'

export function HeaderLogoSettings({ settings, onSettingsChange }: SettingsTabProps) {
  const { toast } = useToast()

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  const handleLogoChange = useCallback(async (value: string, type: ImageIconType) => {
    const enabled = type !== 'none' && value !== ''
    const newSettings = {
      ...settings,
      headerLogoPath: value,
      headerLogoType: type,
      headerLogoEnabled: enabled,
    }
    onSettingsChange(newSettings)

    // Persist immediately
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headerLogoPath: value,
          headerLogoType: type,
          headerLogoEnabled: enabled,
        }),
      })

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Save failed',
          description: 'Failed to save logo settings.',
        })
        return
      }

      if (type === 'none') {
        // Also delete the file if removing an upload
        if (settings.headerLogoType === 'upload') {
          await fetch('/api/header-logo', { method: 'DELETE' }).catch(() => {})
        }
        toast({
          title: 'Logo removed',
          description: 'Header logo has been removed.',
        })
      } else {
        toast({
          variant: 'success',
          title: 'Logo updated',
          description: 'Header logo has been saved.',
        })
      }
    } catch (error) {
      console.error('Settings save error:', error)
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Failed to save logo settings.',
      })
    }
  }, [settings, onSettingsChange, toast])

  const getPreviewSrc = () => {
    if (!settings.headerLogoPath || settings.headerLogoType === 'none') return null
    if (settings.headerLogoType === 'upload') {
      return '/api/header-logo/serve'
    }
    if (settings.headerLogoPath.startsWith('favicon:')) {
      const path = settings.headerLogoPath.replace('favicon:', '')
      return path.startsWith('/api/favicons/serve/') ? path : `/api/favicons/serve/${path}`
    }
    return settings.headerLogoPath
  }

  const previewSrc = getPreviewSrc()

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

        {/* Image/Icon Picker */}
        <ImageIconPicker
          value={settings.headerLogoPath}
          valueType={settings.headerLogoType}
          onChange={handleLogoChange}
          uploadEndpoint="/api/header-logo"
          uploadFieldName="logo"
          serveEndpoint="/api/header-logo/serve"
          label="Logo Image"
          description="Upload an image, pick from icon libraries, or enter a URL"
          previewHeight={settings.headerLogoHeight}
        />

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
        {previewSrc && (
          <div className="space-y-2 pt-4 border-t">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-background">
              <div className={`flex items-center gap-3 ${settings.headerLogoPosition === 'right' ? 'flex-row-reverse justify-end' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt="Logo preview"
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
