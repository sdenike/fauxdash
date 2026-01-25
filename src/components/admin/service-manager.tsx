'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog'
import { PlusIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { IconSelector } from '../icon-selector'
import { getIconByName } from '@/lib/icons'
import { useToast } from '../ui/use-toast'
import { useTheme } from 'next-themes'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Service {
  id: number
  name: string
  url: string
  description: string | null
  icon: string | null
  categoryId: number | null
  order: number
  isVisible: boolean
  requiresAuth: boolean
  clickCount: number
}

interface ServiceCategory {
  id: number
  name: string
}

interface ServiceManagerProps {
  services: Service[]
  serviceCategories: ServiceCategory[]
  onServicesChange: () => void
}

function SortableServiceItem({ service, onEdit, onDelete, isSelected, onToggleSelect }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const { theme } = useTheme()

  const isFavicon = service.icon?.startsWith('favicon:')
  const isSelfhst = service.icon?.startsWith('selfhst:')
  const iconData = !isFavicon && !isSelfhst && service.icon ? getIconByName(service.icon) : null
  const IconComponent = iconData?.component

  // Handle favicon path with monotone support
  let faviconPath = isFavicon && service.icon ? service.icon.replace('favicon:', '') : null
  if (faviconPath) {
    // Handle monotone suffix
    if (faviconPath.includes('_monotone')) {
      const suffix = theme === 'dark' ? '_white.png' : '_black.png'
      faviconPath = faviconPath + suffix
    }
    // Use API route if it starts with /api, otherwise prepend /api/favicons/serve/
    if (!faviconPath.startsWith('/api/favicons/serve/')) {
      faviconPath = `/api/favicons/serve/${faviconPath}`
    }
  }

  // Handle selfhst icons
  const selfhstId = isSelfhst && service.icon ? service.icon.replace('selfhst:', '') : null
  const selfhstPath = selfhstId ? `https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${selfhstId}.png` : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(service.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="cursor-move text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {(faviconPath || selfhstPath) && <img src={faviconPath || selfhstPath || ''} alt="" className="h-5 w-5 object-contain" />}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{service.name}</div>
          {service.description && (
            <div className="text-xs text-muted-foreground truncate">{service.description}</div>
          )}
          <div className="text-xs text-muted-foreground truncate mt-0.5">{service.url}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {service.clickCount} clicks
          </div>
          {!service.isVisible && (
            <span className="text-xs bg-muted px-2 py-1 rounded">Hidden</span>
          )}
          {service.requiresAuth && (
            <span className="text-xs bg-primary/20 px-2 py-1 rounded">Auth</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(service)}>
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(service.id)}>
          <TrashIcon className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

interface Defaults {
  isVisible: boolean
  requiresAuth: boolean
}

export function ServiceManager({ services, serviceCategories, onServicesChange }: ServiceManagerProps) {
  const { toast } = useToast()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set())
  const [fetchingFavicon, setFetchingFavicon] = useState(false)
  const [convertingColor, setConvertingColor] = useState(false)
  const [convertingMonotone, setConvertingMonotone] = useState(false)
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
    categoryId: null as number | null,
    isVisible: true,
    requiresAuth: false,
  })

  useEffect(() => {
    fetchDefaults()
  }, [])

  const fetchDefaults = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setDefaults({
        isVisible: data.defaultServiceEnabled !== false,
        requiresAuth: data.defaultServiceRequiresAuth || false,
      })
    } catch (error) {
      console.error('Failed to fetch defaults:', error)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (active.id === over.id) return

    const oldIndex = services.findIndex((s) => s.id === active.id)
    const newIndex = services.findIndex((s) => s.id === over.id)

    const newServices = arrayMove(services, oldIndex, newIndex)

    await Promise.all(
      newServices.map((service, index) =>
        fetch(`/api/services/${service.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        })
      )
    )

    onServicesChange()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingService
      ? `/api/services/${editingService.id}`
      : '/api/services'

    const method = editingService ? 'PATCH' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    setIsOpen(false)
    setEditingService(null)
    setFormData({ name: '', url: '', description: '', icon: '', categoryId: null, ...defaults })
    onServicesChange()
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      url: service.url,
      description: service.description || '',
      icon: service.icon || '',
      categoryId: service.categoryId,
      isVisible: service.isVisible,
      requiresAuth: service.requiresAuth,
    })

    // Set original favicon if this service has a favicon
    if (service.icon?.startsWith('favicon:') && !service.icon.includes('_themed_') && !service.icon.includes('_monotone') && !service.icon.includes('_inverted')) {
      setOriginalFavicon(service.icon)
    } else {
      setOriginalFavicon(null)
    }

    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/services/${id}`, { method: 'DELETE' })
      onServicesChange()
      toast({
        variant: 'success',
        title: 'Service deleted',
        description: 'The service has been successfully deleted.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete service.',
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

        // Set as original favicon (so conversions can revert to it)
        setOriginalFavicon(newIcon)

        // If editing an existing service, update it immediately
        if (editingService) {
          const updateResponse = await fetch(`/api/services/${editingService.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, icon: newIcon }),
          })

          if (updateResponse.ok) {
            // Refresh the service list to show the new icon immediately
            onServicesChange()
          }
        }

        toast({
          variant: 'success',
          title: 'Favicon fetched',
          description: `Successfully fetched favicon from ${data.domain}`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Auto-fetch failed',
          description: 'Use the Select Icon button and either select an icon from the library OR enter the URL of the favicon',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Auto-fetch failed',
        description: 'Use the Select Icon button and either select an icon from the library OR enter the URL of the favicon',
      })
    } finally {
      setFetchingFavicon(false)
    }
  }

  const handleConvertColor = async () => {
    if (!formData.icon || !formData.icon.startsWith('favicon:')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fetch a favicon first',
      })
      return
    }

    // Store original favicon before converting (if not already stored)
    if (!originalFavicon) {
      setOriginalFavicon(formData.icon)
    }

    setConvertingColor(true)
    try {
      const settingsRes = await fetch('/api/settings')
      const settings = await settingsRes.json()

      // Use original favicon if available, otherwise use current icon
      const sourceIcon = originalFavicon || formData.icon

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
        setFormData({ ...formData, icon: newIconPath })

        // If editing an existing service, update it immediately
        if (editingService) {
          const updateResponse = await fetch(`/api/services/${editingService.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, icon: newIconPath }),
          })

          if (updateResponse.ok) {
            onServicesChange()
          }
        }

        toast({
          variant: 'success',
          title: 'Color converted',
          description: data.message || 'Successfully converted to theme color',
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

  const handleConvertMonotone = async () => {
    if (!formData.icon || !formData.icon.startsWith('favicon:')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fetch a favicon first',
      })
      return
    }

    // Store original favicon before converting (if not already stored)
    if (!originalFavicon) {
      setOriginalFavicon(formData.icon)
    }

    setConvertingMonotone(true)
    try {
      // Use original favicon if available, otherwise use current icon
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/convert-monotone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favicon: sourceIcon,
        }),
      })

      const data = await response.json()

      if (data.success && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        setFormData({ ...formData, icon: newIconPath })

        // If editing an existing service, update it immediately
        if (editingService) {
          const updateResponse = await fetch(`/api/services/${editingService.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, icon: newIconPath }),
          })

          if (updateResponse.ok) {
            onServicesChange()
          }
        }

        toast({
          variant: 'success',
          title: 'Monotone created',
          description: data.message || 'Successfully created black and white versions',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to convert to monotone',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert to monotone',
      })
    } finally {
      setConvertingMonotone(false)
    }
  }

  const handleInvertColors = async () => {
    if (!editingService) return

    setInvertingColors(true)
    try {
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/invert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon: sourceIcon }),
      })

      const data = await response.json()

      if (data.success && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        setFormData({ ...formData, icon: newIconPath })

        // Update the service in the database
        const updateResponse = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, icon: newIconPath }),
        })

        if (updateResponse.ok) {
          onServicesChange()
        }

        toast({
          variant: 'success',
          title: 'Colors inverted',
          description: data.message || 'Successfully inverted favicon colors',
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

  const handleRemoveFavicon = async () => {
    setFormData({ ...formData, icon: '' })
    setOriginalFavicon(null)

    // If editing an existing service, update it immediately
    if (editingService) {
      const updateResponse = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, icon: '' }),
      })

      if (updateResponse.ok) {
        onServicesChange()
      }
    }

    toast({
      title: 'Favicon removed',
      description: 'Custom favicon has been removed',
    })
  }

  const handleRevertFavicon = async () => {
    if (!originalFavicon) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No original favicon to revert to',
      })
      return
    }

    setFormData({ ...formData, icon: originalFavicon })

    // If editing an existing service, update it immediately
    if (editingService) {
      const updateResponse = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, icon: originalFavicon }),
      })

      if (updateResponse.ok) {
        onServicesChange()
      }
    }

    toast({
      title: 'Favicon reverted',
      description: 'Reverted to original favicon',
    })
  }

  const handleBatchFetch = async (fetchAll: boolean = false) => {
    const idsToFetch = fetchAll
      ? services.map(s => s.id)
      : Array.from(selectedServices)

    if (idsToFetch.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No services selected',
      })
      return
    }

    setFetchingFavicon(true)
    try {
      const response = await fetch('/api/favicons/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToFetch, type: 'service' }),
      })

      const data = await response.json()

      if (data.success) {
        onServicesChange()
        setSelectedServices(new Set())
        toast({
          variant: 'success',
          title: 'Favicons fetched',
          description: `Successfully fetched ${data.successful} of ${data.total} favicons`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to fetch favicons',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch favicons',
      })
    } finally {
      setFetchingFavicon(false)
    }
  }

  const toggleServiceSelection = (id: number) => {
    const newSelected = new Set(selectedServices)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedServices(newSelected)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Services</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Manage your self-hosted services</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleBatchFetch(true)}
              disabled={fetchingFavicon}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {fetchingFavicon ? 'Fetching...' : 'Fetch All Favicons'}
            </Button>
            {selectedServices.size > 0 && (
              <Button
                variant="outline"
                onClick={() => handleBatchFetch(false)}
                disabled={fetchingFavicon}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Fetch Selected ({selectedServices.size})
              </Button>
            )}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingService(null)
                  setFormData({ name: '', url: '', description: '', icon: '', categoryId: null, ...defaults })
                }}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Edit Service' : 'Add Service'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div>
                    <Label htmlFor="svc-name">Name</Label>
                    <Input
                      id="svc-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="svc-url">URL</Label>
                    <Input
                      id="svc-url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      onBlur={async () => {
                        // Auto-fetch favicon when URL loses focus (only if no icon is set yet)
                        if (formData.url && !formData.icon && !fetchingFavicon) {
                          await handleFetchFavicon()
                        }
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="svc-description">Description (optional)</Label>
                    <Textarea
                      id="svc-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this service"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="svc-category">Category (optional)</Label>
                    <Select
                      value={formData.categoryId?.toString() || 'none'}
                      onValueChange={(value) => setFormData({ ...formData, categoryId: value === 'none' ? null : parseInt(value) })}
                    >
                      <SelectTrigger id="svc-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {serviceCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
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
                            {convertingColor ? 'Converting...' : 'Convert to Theme Color'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleConvertMonotone}
                            disabled={convertingMonotone}
                          >
                            <SparklesIcon className="h-4 w-4 mr-2" />
                            {convertingMonotone ? 'Converting...' : 'Convert to Monotone'}
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
                              Revert to Original
                            </Button>
                          )}
                        </>
                      )}
                      {formData.icon && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveFavicon}
                        >
                          Remove Icon
                        </Button>
                      )}
                    </div>
                    <IconSelector
                      value={formData.icon?.startsWith('favicon:') || formData.icon?.startsWith('selfhst:') ? '' : formData.icon}
                      onChange={(icon) => setFormData({ ...formData, icon })}
                    />
                    {formData.icon?.startsWith('favicon:') && (() => {
                      // Handle monotone suffix for preview
                      let previewPath = formData.icon.replace('favicon:', '')
                      if (previewPath.includes('_monotone')) {
                        const suffix = theme === 'dark' ? '_white.png' : '_black.png'
                        previewPath = previewPath + suffix
                      }
                      return (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewPath}
                            alt="Favicon"
                            className="h-5 w-5 object-contain"
                          />
                          <span>Using custom favicon</span>
                        </div>
                      )
                    })()}
                    {formData.icon?.startsWith('selfhst:') && (() => {
                      const selfhstId = formData.icon.replace('selfhst:', '')
                      const selfhstPath = `https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${selfhstId}.png`
                      return (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selfhstPath}
                            alt="Selfhst Icon"
                            className="h-5 w-5 object-contain"
                          />
                          <span>Using selfh.st icon: {selfhstId}</span>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="svc-isVisible">Enabled</Label>
                    <Switch
                      id="svc-isVisible"
                      checked={formData.isVisible}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="svc-requiresAuth">Requires Authentication</Label>
                    <Switch
                      id="svc-requiresAuth"
                      checked={formData.requiresAuth}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresAuth: checked })}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit">
                    {editingService ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {services.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={services.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {services.map((service) => (
                  <SortableServiceItem
                    key={service.id}
                    service={service}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isSelected={selectedServices.has(service.id)}
                    onToggleSelect={toggleServiceSelection}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
            No services yet. Add your first self-hosted service!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
