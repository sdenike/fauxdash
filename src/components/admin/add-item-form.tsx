'use client'

import { useState, useEffect } from 'react'
import { AdminSection } from './admin-page'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Download, Sparkles, Plus } from 'lucide-react'
import { IconSelector } from '../icon-selector'
import { useToast } from '../ui/use-toast'
import { useTheme } from 'next-themes'

interface Category {
  id: number
  name: string
  icon: string | null
}

export interface AddItemFormProps {
  kind: 'bookmark' | 'service'
  categories: Category[]
  onAdded: () => void
}

const KIND_CONFIG = {
  bookmark: {
    endpoint: '/api/bookmarks',
    prefix: 'bm',
    enabledKey: 'defaultBookmarkEnabled',
    authKey: 'defaultBookmarkRequiresAuth',
    emptyCategory: 0 as number | null,
    defaultTab: undefined,
  },
  service: {
    endpoint: '/api/services',
    prefix: 'svc',
    enabledKey: 'defaultServiceEnabled',
    authKey: 'defaultServiceRequiresAuth',
    emptyCategory: null as number | null,
    defaultTab: 'selfhst' as const,
  },
}

interface Defaults {
  isVisible: boolean
  requiresAuth: boolean
}

export function AddItemForm({ kind, categories, onAdded }: AddItemFormProps) {
  const cfg = KIND_CONFIG[kind]
  const p = cfg.prefix
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
    categoryId: categories[0]?.id || cfg.emptyCategory,
    isVisible: true,
    requiresAuth: false,
  })

  useEffect(() => {
    fetchDefaults()
  }, [])

  useEffect(() => {
    if (categories.length > 0 && formData.categoryId === cfg.emptyCategory) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }))
    }
  }, [categories, formData.categoryId])

  const fetchDefaults = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      const newDefaults = {
        isVisible: data[cfg.enabledKey] !== false,
        requiresAuth: data[cfg.authKey] || false,
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
        description: 'Select a category',
      })
      return
    }

    try {
      const response = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          variant: 'success',
          title: kind === 'bookmark' ? 'Bookmark created' : 'Service created',
          description: `"${formData.name}" has been added successfully`,
        })

        // Reset form
        setFormData({
          name: '',
          url: '',
          description: '',
          icon: '',
          categoryId: categories[0]?.id || cfg.emptyCategory,
          ...defaults,
        })
        setOriginalFavicon(null)
        onAdded()
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || `Failed to create ${kind}`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create ${kind}`,
      })
    }
  }

  const handleFetchFavicon = async () => {
    if (!formData.url) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Enter a URL first',
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
          description: 'Use the Select icon button to choose an icon manually',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Auto-fetch failed',
        description: 'Use the Select icon button to choose an icon manually',
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
    <AdminSection title={`Add ${kind}`} description={`Create a new ${kind} to add to your dashboard`}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${p}-name`}>Name *</Label>
              <Input
                id={`${p}-name`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={kind === 'bookmark' ? 'My bookmark' : 'My service'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${p}-category`}>Category *</Label>
              <Select
                value={formData.categoryId?.toString() ?? ''}
                onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
              >
                <SelectTrigger id={`${p}-category`}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div className="space-y-2">
            <Label htmlFor={`${p}-url`}>URL *</Label>
            <Input
              id={`${p}-url`}
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

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${p}-description`}>Description (optional)</Label>
            <Textarea
              id={`${p}-description`}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={`Brief description of this ${kind}`}
              rows={2}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
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
                  <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                  {fetchingFavicon ? 'Fetching…' : 'Fetch favicon'}
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
                    <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                    {convertingColor ? 'Converting…' : 'Theme color'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleConvertGrayscale}
                    disabled={convertingGrayscale}
                  >
                    <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                    {convertingGrayscale ? 'Converting…' : 'Grayscale'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleInvertColors}
                    disabled={invertingColors}
                  >
                    <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                    {invertingColors ? 'Inverting…' : 'Invert'}
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
                  Remove icon
                </Button>
              )}
            </div>
            <IconSelector
              defaultTab={cfg.defaultTab}
              value={formData.icon?.startsWith('favicon:') || formData.icon?.startsWith('selfhst:') ? '' : formData.icon}
              onChange={(icon) => setFormData({ ...formData, icon })}
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

          <div className="sm:col-span-2 divide-y divide-border">
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
              <div>
                <Label htmlFor={`${p}-isVisible`}>Enabled</Label>
                <p className="text-sm text-muted-foreground">Show this {kind} on the dashboard</p>
              </div>
              <Switch
                id={`${p}-isVisible`}
                checked={formData.isVisible}
                onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
              <div>
                <Label htmlFor={`${p}-requiresAuth`}>Requires authentication</Label>
                <p className="text-sm text-muted-foreground">Only show when logged in</p>
              </div>
              <Switch
                id={`${p}-requiresAuth`}
                checked={formData.requiresAuth}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresAuth: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" size="lg">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add {kind}
            </Button>
          </div>
        </form>
    </AdminSection>
  )
}
