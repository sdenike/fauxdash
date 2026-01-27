'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { ArrowDownTrayIcon, SparklesIcon, PlusIcon } from '@heroicons/react/24/outline'
import { IconSelector } from '../icon-selector'
import { useToast } from '../ui/use-toast'
import { useTheme } from 'next-themes'

interface ServiceCategory {
  id: number
  name: string
  icon: string | null
}

interface AddServiceFormProps {
  serviceCategories: ServiceCategory[]
  onServiceAdded: () => void
}

interface Defaults {
  isVisible: boolean
  requiresAuth: boolean
}

export function AddServiceForm({ serviceCategories, onServiceAdded }: AddServiceFormProps) {
  const { toast } = useToast()
  const { theme } = useTheme()
  const [fetchingFavicon, setFetchingFavicon] = useState(false)
  const [convertingColor, setConvertingColor] = useState(false)
  const [convertingGrayscale, setConvertingGrayscale] = useState(false)
  const [invertingColors, setInvertingColors] = useState(false)
  const [originalFavicon, setOriginalFavicon] = useState<string | null>(null)
  const [defaults, setDefaults] = useState<Defaults>({
    isVisible: true,
    requiresAuth: false,
  })
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    icon: '',
    categoryId: serviceCategories[0]?.id || null as number | null,
    isVisible: true,
    requiresAuth: false,
  })

  useEffect(() => {
    fetchDefaults()
  }, [])

  useEffect(() => {
    if (serviceCategories.length > 0 && formData.categoryId === null) {
      setFormData(prev => ({ ...prev, categoryId: serviceCategories[0].id }))
    }
  }, [serviceCategories, formData.categoryId])

  const fetchDefaults = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      const newDefaults = {
        isVisible: data.defaultServiceEnabled !== false,
        requiresAuth: data.defaultServiceRequiresAuth || false,
      }
      setDefaults(newDefaults)
      setFormData(prev => ({
        ...prev,
        isVisible: newDefaults.isVisible,
        requiresAuth: newDefaults.requiresAuth,
      }))
    } catch (error) {
      console.error('Failed to fetch defaults:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.categoryId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a category',
      })
      return
    }

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          variant: 'success',
          title: 'Service created',
          description: `"${formData.name}" has been added successfully`,
        })

        // Reset form
        setFormData({
          name: '',
          url: '',
          description: '',
          icon: '',
          categoryId: serviceCategories[0]?.id || null,
          ...defaults,
        })
        setOriginalFavicon(null)
        onServiceAdded()
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to create service',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create service',
      })
    }
  }

  const handleFetchFavicon = async () => {
    if (!formData.url) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a URL first',
      })
      return
    }

    setFetchingFavicon(true)
    try {
      const response = await fetch('/api/favicons/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.url }),
      })

      const data = await response.json()

      if (data.success) {
        const newIcon = `favicon:${data.path}`
        setFormData({ ...formData, icon: newIcon })
        setOriginalFavicon(newIcon)

        toast({
          variant: 'success',
          title: 'Favicon fetched',
          description: `Successfully fetched favicon from ${data.domain}`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Auto-fetch failed',
          description: 'Use the Select Icon button to choose an icon manually',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Auto-fetch failed',
        description: 'Use the Select Icon button to choose an icon manually',
      })
    } finally {
      setFetchingFavicon(false)
    }
  }

  const handleConvertColor = async () => {
    if (!formData.icon?.startsWith('favicon:')) return

    if (!originalFavicon) {
      setOriginalFavicon(formData.icon)
    }

    setConvertingColor(true)
    try {
      const settingsRes = await fetch('/api/settings')
      const settings = await settingsRes.json()
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/convert-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favicon: sourceIcon,
          color: settings.themeColor || 'Slate',
          itemUrl: formData.url,
        }),
      })

      const data = await response.json()

      if (data.success && data.filename) {
        setFormData({ ...formData, icon: `favicon:${data.filename}` })
        toast({
          variant: 'success',
          title: 'Color converted',
          description: 'Successfully converted to theme color',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to convert color',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert color',
      })
    } finally {
      setConvertingColor(false)
    }
  }

  const handleConvertGrayscale = async () => {
    if (!formData.icon?.startsWith('favicon:')) return

    if (!originalFavicon) {
      setOriginalFavicon(formData.icon)
    }

    setConvertingGrayscale(true)
    try {
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/convert-grayscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon: sourceIcon, itemUrl: formData.url }),
      })

      const data = await response.json()

      if (data.success && data.filename) {
        setFormData({ ...formData, icon: `favicon:${data.filename}` })
        toast({
          variant: 'success',
          title: 'Grayscale created',
          description: 'Successfully created black and white versions',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to convert to grayscale',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert to grayscale',
      })
    } finally {
      setConvertingGrayscale(false)
    }
  }

  const handleInvertColors = async () => {
    if (!formData.icon?.startsWith('favicon:')) return

    if (!originalFavicon) {
      setOriginalFavicon(formData.icon)
    }

    setInvertingColors(true)
    try {
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/invert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon: sourceIcon, itemUrl: formData.url }),
      })

      const data = await response.json()

      if (data.success && data.filename) {
        setFormData({ ...formData, icon: `favicon:${data.filename}` })
        toast({
          variant: 'success',
          title: 'Colors inverted',
          description: 'Successfully inverted favicon colors',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to invert colors',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to invert colors',
      })
    } finally {
      setInvertingColors(false)
    }
  }

  const handleRevertFavicon = () => {
    if (originalFavicon) {
      setFormData({ ...formData, icon: originalFavicon })
      toast({
        title: 'Favicon reverted',
        description: 'Reverted to original favicon',
      })
    }
  }

  const handleRemoveIcon = () => {
    setFormData({ ...formData, icon: '' })
    setOriginalFavicon(null)
  }

  // Get favicon preview path with grayscale support
  const getFaviconPreviewPath = () => {
    if (!formData.icon?.startsWith('favicon:')) return null
    let path = formData.icon.replace('favicon:', '')
    if (path.includes('_grayscale')) {
      const suffix = theme === 'dark' ? '_white.png' : '_black.png'
      path = path + suffix
    }
    // Only prepend if not already present
    if (!path.startsWith('/api/favicons/serve/')) {
      return `/api/favicons/serve/${path}`
    }
    return path
  }

  const faviconPreviewPath = getFaviconPreviewPath()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Service</CardTitle>
        <CardDescription>
          Create a new service to add to your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="svc-name">Name *</Label>
              <Input
                id="svc-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Service"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="svc-category">Category *</Label>
              <Select
                value={formData.categoryId?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
              >
                <SelectTrigger id="svc-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="svc-url">URL *</Label>
            <Input
              id="svc-url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              onBlur={async () => {
                if (formData.url && !formData.icon && !fetchingFavicon) {
                  await handleFetchFavicon()
                }
              }}
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="svc-description">Description (optional)</Label>
            <Textarea
              id="svc-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this service"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {!formData.icon && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchFavicon}
                  disabled={!formData.url || fetchingFavicon}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  {fetchingFavicon ? 'Fetching...' : 'Fetch Favicon'}
                </Button>
              )}
              {formData.icon?.startsWith('favicon:') && (
                <>
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
                    {invertingColors ? 'Inverting...' : 'Invert'}
                  </Button>
                  {originalFavicon && formData.icon !== originalFavicon && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRevertFavicon}
                    >
                      Revert
                    </Button>
                  )}
                </>
              )}
              {formData.icon && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveIcon}
                >
                  Remove Icon
                </Button>
              )}
            </div>
            <IconSelector
              value={formData.icon?.startsWith('favicon:') || formData.icon?.startsWith('selfhst:') ? '' : formData.icon}
              onChange={(icon) => setFormData({ ...formData, icon })}
              defaultTab="selfhst"
            />
            {faviconPreviewPath && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={faviconPreviewPath}
                  alt="Favicon"
                  className="h-5 w-5 object-contain"
                />
                <span>Using custom favicon</span>
              </div>
            )}
            {formData.icon?.startsWith('selfhst:') && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${formData.icon.replace('selfhst:', '')}.png`}
                  alt="Selfhst Icon"
                  className="h-5 w-5 object-contain"
                />
                <span>Using selfh.st icon</span>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="svc-isVisible">Enabled</Label>
                <p className="text-sm text-muted-foreground">Show this service on the dashboard</p>
              </div>
              <Switch
                id="svc-isVisible"
                checked={formData.isVisible}
                onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="svc-requiresAuth">Requires Authentication</Label>
                <p className="text-sm text-muted-foreground">Only show when logged in</p>
              </div>
              <Switch
                id="svc-requiresAuth"
                checked={formData.requiresAuth}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresAuth: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="lg">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
