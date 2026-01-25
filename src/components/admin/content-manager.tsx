'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { PlusIcon, PencilIcon, TrashIcon, ArrowsRightLeftIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { IconSelector } from '../icon-selector'
import { getIconByName } from '@/lib/icons'
import { useTheme } from 'next-themes'
import { useToast } from '../ui/use-toast'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Bookmark {
  id: number
  categoryId: number | null
  name: string
  url: string
  description: string | null
  icon: string | null
  order: number
  clickCount: number
}

interface Service {
  id: number
  categoryId: number | null
  name: string
  url: string
  description: string | null
  icon: string | null
  order: number
  clickCount: number
}

interface Category {
  id: number
  name: string
  icon: string | null
  columns: number
  bookmarks?: Bookmark[]
}

interface ServiceCategory {
  id: number
  name: string
  icon: string | null
  columns: number
  services?: Service[]
}

interface ContentManagerProps {
  categories: Category[]
  serviceCategories: ServiceCategory[]
  onContentChange: () => void
}

type ContentItem = (Bookmark | Service) & { type: 'bookmark' | 'service' }

function SortableContentItem({ item, onEdit, onDelete, onConvert, isSelected, onToggleSelect }: any) {
  const { theme } = useTheme()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${item.type}-${item.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isFavicon = item.icon?.startsWith('favicon:')
  const isSelfhst = item.icon?.startsWith('selfhst:')
  const itemIconData = !isFavicon && !isSelfhst && item.icon ? getIconByName(item.icon) : null
  const ItemIcon = itemIconData?.component

  // Handle favicon path with monotone support
  let faviconPath = null
  if (isFavicon && item.icon) {
    let path = item.icon.replace('favicon:', '')
    // Handle monotone suffix
    if (path.includes('_monotone')) {
      const suffix = theme === 'dark' ? '_white.png' : '_black.png'
      path = path + suffix
    }
    // Use API route if it starts with /api, otherwise prepend /api/favicons/serve/
    if (!path.startsWith('/api/favicons/serve/')) {
      faviconPath = `/api/favicons/serve/${path}`
    } else {
      faviconPath = path
    }
  }

  // Handle selfhst icons
  const selfhstId = isSelfhst && item.icon ? item.icon.replace('selfhst:', '') : null
  const selfhstPath = selfhstId ? `https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${selfhstId}.png` : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col gap-2 p-3 bg-card border rounded-lg hover:shadow-md transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Top row: Checkbox, Drag Handle, Icon, Name */}
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(item)}
          onClick={(e) => e.stopPropagation()}
        />

        <div
          {...attributes}
          {...listeners}
          className="cursor-move text-muted-foreground hover:text-foreground"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {(ItemIcon || faviconPath || selfhstPath) && (
          <div className="flex items-center justify-center flex-shrink-0 text-primary w-8 h-8">
            {ItemIcon && <ItemIcon className="w-6 h-6" />}
            {(faviconPath || selfhstPath) && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={faviconPath || selfhstPath || ''}
                alt={item.name}
                className="object-contain w-6 h-6"
              />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.name}</p>
        </div>
      </div>

      {/* Bottom row: Type badge, icon-only buttons with tooltips */}
      <div className="flex items-center gap-2 ml-11">
        <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
          item.type === 'bookmark'
            ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
            : 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
        }`}>
          {item.type === 'bookmark' ? 'Bookmark' : 'Service'}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onConvert(item)}
          title={`Convert to ${item.type === 'bookmark' ? 'Service' : 'Bookmark'}`}
        >
          <ArrowsRightLeftIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(item)}
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(item)}
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ContentManager({ categories, serviceCategories, onContentChange }: ContentManagerProps) {
  const { toast } = useToast()
  const { theme } = useTheme()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [fetchingFavicon, setFetchingFavicon] = useState(false)
  const [convertingColor, setConvertingColor] = useState(false)
  const [convertingMonotone, setConvertingMonotone] = useState(false)
  const [invertingColors, setInvertingColors] = useState(false)
  const [originalFavicon, setOriginalFavicon] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [convertingItem, setConvertingItem] = useState<ContentItem | null>(null)
  const [selectedTargetCategory, setSelectedTargetCategory] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    icon: '',
    categoryId: 0 as number | null,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Flatten all bookmarks and services into a single list with category info
  const allItems: ContentItem[] = [
    ...categories.flatMap(cat =>
      (cat.bookmarks || [])
        .map(b => ({ ...b, type: 'bookmark' as const, categoryName: cat.name, categoryType: 'bookmark' }))
    ),
    ...serviceCategories.flatMap(cat =>
      (cat.services || [])
        .map(s => ({ ...s, type: 'service' as const, categoryName: cat.name, categoryType: 'service' }))
    ),
  ]

  // Get uncategorized items
  const uncategorizedItems = allItems.filter(item => item.categoryId === null)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Parse IDs
    const [activeType, activeIdNum] = activeId.split('-')
    const [overType, overIdNum] = overId.split('-')

    // If dropped on another item, we want to move it to that item's category
    if (overType === 'bookmark' || overType === 'service') {
      const targetItem = allItems.find(item => `${item.type}-${item.id}` === overId)
      if (!targetItem || targetItem.categoryId === null) return

      const sourceItem = allItems.find(item => `${item.type}-${item.id}` === activeId)
      if (!sourceItem) return

      // Move to the same category as the target item
      await moveItem(sourceItem, targetItem.categoryId)
    } else if (overType === 'category' || overType === 'service-category') {
      // Dropped directly on a category
      const categoryId = parseInt(overIdNum)
      const sourceItem = allItems.find(item => `${item.type}-${item.id}` === activeId)
      if (!sourceItem) return

      await moveItem(sourceItem, categoryId, overType === 'service-category' ? 'service' : 'bookmark')
    }
  }

  const moveItem = async (item: ContentItem, targetCategoryId: number | null, targetType?: 'bookmark' | 'service') => {
    const convertType = targetType && targetType !== item.type

    if (convertType) {
      // Convert item type
      await convertItem(item, targetType!)
    } else if (item.categoryId !== targetCategoryId) {
      // Just move to different category
      const endpoint = item.type === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: targetCategoryId }),
      })
      onContentChange()
    }
  }

  const convertItem = async (item: ContentItem, toType: 'bookmark' | 'service') => {
    if (item.type === toType) return

    // Create new item of target type
    const newEndpoint = toType === 'bookmark' ? '/api/bookmarks' : '/api/services'
    await fetch(newEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: item.name,
        url: item.url,
        description: item.description,
        icon: item.icon,
        categoryId: item.categoryId,
        order: item.order,
      }),
    })

    // Delete old item
    const deleteEndpoint = item.type === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
    await fetch(deleteEndpoint, { method: 'DELETE' })

    onContentChange()
  }

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      url: item.url,
      description: item.description || '',
      icon: item.icon || '',
      categoryId: item.categoryId ?? 0,
    })

    // Set original favicon if this item has a favicon
    if (item.icon?.startsWith('favicon:') && !item.icon.includes('_themed_') && !item.icon.includes('_monotone') && !item.icon.includes('_inverted')) {
      setOriginalFavicon(item.icon)
    } else {
      setOriginalFavicon(null)
    }

    setIsEditOpen(true)
  }

  const handleDelete = async (item: ContentItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    const endpoint = item.type === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
    await fetch(endpoint, { method: 'DELETE' })
    onContentChange()
  }

  const handleConvert = (item: ContentItem) => {
    setConvertingItem(item)
    setSelectedTargetCategory(null)
    setIsConvertDialogOpen(true)
  }

  const handleConfirmConvert = async () => {
    if (!convertingItem) return

    const toType = convertingItem.type === 'bookmark' ? 'service' : 'bookmark'
    const targetCategoryId = selectedTargetCategory

    try {
      // Create new item of target type
      const newEndpoint = toType === 'bookmark' ? '/api/bookmarks' : '/api/services'
      await fetch(newEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: convertingItem.name,
          url: convertingItem.url,
          description: convertingItem.description,
          icon: convertingItem.icon,
          categoryId: targetCategoryId,
          order: convertingItem.order,
        }),
      })

      // Delete old item
      const deleteEndpoint = convertingItem.type === 'bookmark'
        ? `/api/bookmarks/${convertingItem.id}`
        : `/api/services/${convertingItem.id}`
      await fetch(deleteEndpoint, { method: 'DELETE' })

      // Clear cache to ensure changes show up immediately
      await fetch('/api/cache/clear', { method: 'POST' })

      onContentChange()
      setIsConvertDialogOpen(false)
      setConvertingItem(null)
      toast({
        variant: 'success',
        title: 'Converted',
        description: `Successfully converted "${convertingItem.name}" to ${toType}`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert item',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    const endpoint = editingItem.type === 'bookmark'
      ? `/api/bookmarks/${editingItem.id}`
      : `/api/services/${editingItem.id}`

    await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    setIsEditOpen(false)
    setEditingItem(null)
    onContentChange()
  }

  const handleToggleSelect = (item: ContentItem) => {
    const key = `${item.type}-${item.id}`
    const newSelected = new Set(selectedItems)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === allItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(allItems.map(item => `${item.type}-${item.id}`)))
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

      if (response.ok && data.filename) {
        const iconPath = `favicon:${data.filename}`
        setFormData({ ...formData, icon: iconPath })
        if (!iconPath.includes('_themed_') && !iconPath.includes('_monotone') && !iconPath.includes('_inverted')) {
          setOriginalFavicon(iconPath)
        }
        toast({
          variant: 'success',
          title: 'Favicon fetched',
          description: 'Successfully fetched favicon',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to fetch favicon',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch favicon',
      })
    } finally {
      setFetchingFavicon(false)
    }
  }

  const handleBatchFetch = async (fetchAll: boolean = false) => {
    const itemsToFetch = fetchAll
      ? allItems
      : allItems.filter(item => selectedItems.has(`${item.type}-${item.id}`))

    if (itemsToFetch.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No items selected',
      })
      return
    }

    setFetchingFavicon(true)
    try {
      // Separate by type
      const bookmarkIds = itemsToFetch.filter(i => i.type === 'bookmark').map(i => i.id)
      const serviceIds = itemsToFetch.filter(i => i.type === 'service').map(i => i.id)

      const promises = []

      if (bookmarkIds.length > 0) {
        promises.push(
          fetch('/api/favicons/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: bookmarkIds, type: 'bookmark' }),
          })
        )
      }

      if (serviceIds.length > 0) {
        promises.push(
          fetch('/api/favicons/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: serviceIds, type: 'service' }),
          })
        )
      }

      await Promise.all(promises)
      onContentChange()

      toast({
        variant: 'success',
        title: 'Favicons fetched',
        description: `Successfully fetched favicons for ${itemsToFetch.length} items`,
      })
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

  const handleConvertColor = async () => {
    if (!formData.icon || !formData.icon.startsWith('favicon:')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Only favicon icons can be converted',
      })
      return
    }

    if (formData.icon.includes('_themed_')) {
      toast({
        variant: 'destructive',
        title: 'Already converted',
        description: 'This favicon has already been converted to theme color',
      })
      return
    }

    setConvertingColor(true)
    try {
      // Get current theme color from settings
      const settingsRes = await fetch('/api/settings')
      const settings = await settingsRes.json()
      const primaryColor = settings.find((s: any) => s.key === 'primaryColor')?.value || '#3b82f6'

      // Use original favicon if available, otherwise use current icon
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/convert-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favicon: sourceIcon,
          color: primaryColor,
        }),
      })

      const data = await response.json()

      if (response.ok && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        setFormData({ ...formData, icon: newIconPath })
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
        description: 'Only favicon icons can be converted',
      })
      return
    }

    if (formData.icon.includes('_monotone')) {
      toast({
        variant: 'destructive',
        title: 'Already converted',
        description: 'This favicon has already been converted to monotone',
      })
      return
    }

    setConvertingMonotone(true)
    try {
      // Use original favicon if available, otherwise use current icon
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/convert-monotone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon: sourceIcon }),
      })

      const data = await response.json()

      if (response.ok && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        setFormData({ ...formData, icon: newIconPath })
        toast({
          variant: 'success',
          title: 'Converted to monotone',
          description: data.message || 'Successfully converted to monotone',
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
    if (!formData.icon || !formData.icon.startsWith('favicon:')) return

    setInvertingColors(true)
    try {
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/invert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon: sourceIcon }),
      })

      const data = await response.json()

      if (response.ok && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        setFormData({ ...formData, icon: newIconPath })
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

  const handleRestoreOriginal = () => {
    if (originalFavicon) {
      setFormData({ ...formData, icon: originalFavicon })
      toast({
        variant: 'success',
        title: 'Restored',
        description: 'Restored to original favicon',
      })
    }
  }

  const handleBulkConvertMonotone = async () => {
    const itemsToConvert = allItems.filter(item =>
      selectedItems.has(`${item.type}-${item.id}`) && item.icon?.startsWith('favicon:')
    )

    if (itemsToConvert.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No items with favicons selected',
      })
      return
    }

    setConvertingMonotone(true)
    try {
      const promises = itemsToConvert.map(async (item) => {
        // Get original or use current icon
        const sourceIcon = item.icon!.includes('_themed_') || item.icon!.includes('_monotone') || item.icon!.includes('_inverted')
          ? item.icon!.replace(/_themed_.*\.png|_monotone|_inverted\.png/, '.png')
          : item.icon!

        const response = await fetch('/api/favicons/convert-monotone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favicon: sourceIcon }),
        })

        const data = await response.json()
        if (response.ok && data.filename) {
          const endpoint = item.type === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
          await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ icon: `favicon:${data.filename}` }),
          })
        }
      })

      await Promise.all(promises)
      onContentChange()

      toast({
        variant: 'success',
        title: 'Converted to monotone',
        description: `Successfully converted ${itemsToConvert.length} items`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert some items',
      })
    } finally {
      setConvertingMonotone(false)
    }
  }

  const handleBulkInvert = async () => {
    const itemsToConvert = allItems.filter(item =>
      selectedItems.has(`${item.type}-${item.id}`) && item.icon?.startsWith('favicon:')
    )

    if (itemsToConvert.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No items with favicons selected',
      })
      return
    }

    setInvertingColors(true)
    try {
      const promises = itemsToConvert.map(async (item) => {
        // Get original or use current icon
        const sourceIcon = item.icon!.includes('_themed_') || item.icon!.includes('_monotone') || item.icon!.includes('_inverted')
          ? item.icon!.replace(/_themed_.*\.png|_monotone|_inverted\.png/, '.png')
          : item.icon!

        const response = await fetch('/api/favicons/invert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favicon: sourceIcon }),
        })

        const data = await response.json()
        if (response.ok && data.filename) {
          const endpoint = item.type === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
          await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ icon: `favicon:${data.filename}` }),
          })
        }
      })

      await Promise.all(promises)
      onContentChange()

      toast({
        variant: 'success',
        title: 'Colors inverted',
        description: `Successfully inverted ${itemsToConvert.length} items`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to invert some items',
      })
    } finally {
      setInvertingColors(false)
    }
  }

  const handleBulkConvertTheme = async () => {
    const itemsToConvert = allItems.filter(item =>
      selectedItems.has(`${item.type}-${item.id}`) && item.icon?.startsWith('favicon:')
    )

    if (itemsToConvert.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No items with favicons selected',
      })
      return
    }

    setConvertingColor(true)
    try {
      // Get theme color
      const settingsRes = await fetch('/api/settings')
      const settings = await settingsRes.json()
      const primaryColor = settings.find((s: any) => s.key === 'primaryColor')?.value || '#3b82f6'

      const promises = itemsToConvert.map(async (item) => {
        // Get original or use current icon
        const sourceIcon = item.icon!.includes('_themed_') || item.icon!.includes('_monotone') || item.icon!.includes('_inverted')
          ? item.icon!.replace(/_themed_.*\.png|_monotone|_inverted\.png/, '.png')
          : item.icon!

        const response = await fetch('/api/favicons/convert-color', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favicon: sourceIcon, color: primaryColor }),
        })

        const data = await response.json()
        if (response.ok && data.filename) {
          const endpoint = item.type === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
          await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ icon: `favicon:${data.filename}` }),
          })
        }
      })

      await Promise.all(promises)
      onContentChange()

      toast({
        variant: 'success',
        title: 'Converted to theme color',
        description: `Successfully converted ${itemsToConvert.length} items`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert some items',
      })
    } finally {
      setConvertingColor(false)
    }
  }

  const toggleCategoryCollapse = (categoryId: string) => {
    const newCollapsed = new Set(collapsedCategories)
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId)
    } else {
      newCollapsed.add(categoryId)
    }
    setCollapsedCategories(newCollapsed)
  }

  const convertCategory = async (categoryId: number, fromType: 'bookmark' | 'service') => {
    const toType = fromType === 'bookmark' ? 'service' : 'bookmark'
    const category = fromType === 'bookmark'
      ? categories.find(c => c.id === categoryId)
      : serviceCategories.find(c => c.id === categoryId)

    if (!category) return

    const categoryItems = allItems.filter(item =>
      item.categoryId === categoryId && item.type === fromType
    )

    if (!confirm(`Convert "${category.name}" and all ${categoryItems.length} items to ${toType} category?`)) return

    try {
      // Create new category in target type
      const newCategoryEndpoint = toType === 'bookmark' ? '/api/categories' : '/api/service-categories'
      const newCategoryRes = await fetch(newCategoryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: category.name,
          icon: category.icon,
          columns: category.columns,
        }),
      })
      const newCategory = await newCategoryRes.json()

      // Convert all items to new type in new category
      await Promise.all(categoryItems.map(async (item) => {
        const newItemEndpoint = toType === 'bookmark' ? '/api/bookmarks' : '/api/services'
        await fetch(newItemEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name,
            url: item.url,
            description: item.description,
            icon: item.icon,
            categoryId: newCategory.id,
            order: item.order,
          }),
        })

        // Delete old item
        const deleteEndpoint = fromType === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
        await fetch(deleteEndpoint, { method: 'DELETE' })
      }))

      // Delete old category
      const categoryEndpoint = fromType === 'bookmark' ? `/api/categories/${categoryId}` : `/api/service-categories/${categoryId}`
      await fetch(categoryEndpoint, { method: 'DELETE' })

      // Clear cache to ensure changes show up immediately
      await fetch('/api/cache/clear', { method: 'POST' })

      onContentChange()
      toast({
        variant: 'success',
        title: 'Category converted',
        description: `Successfully converted "${category.name}" and ${categoryItems.length} items to ${toType} category`,
      })
    } catch (error: any) {
      console.error('Category conversion error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to convert category',
      })
    }
  }

  const activeItem = activeId ? allItems.find(item => `${item.type}-${item.id}` === activeId) : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Manager</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop to reorganize or convert between bookmarks and services
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedItems.size === allItems.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchFetch(true)}
              disabled={fetchingFavicon}
            >
              {fetchingFavicon ? 'Fetching...' : 'Fetch All Favicons'}
            </Button>
            {selectedItems.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchFetch(false)}
                  disabled={fetchingFavicon}
                >
                  Fetch Selected ({selectedItems.size})
                </Button>
                <div className="h-6 w-px bg-border" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkConvertMonotone}
                  disabled={convertingMonotone}
                >
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  {convertingMonotone ? 'Converting...' : 'Monotone Selected'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkInvert}
                  disabled={invertingColors}
                >
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  {invertingColors ? 'Inverting...' : 'Invert Selected'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkConvertTheme}
                  disabled={convertingColor}
                >
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  {convertingColor ? 'Converting...' : 'Theme Color Selected'}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Uncategorized Items Section */}
          {uncategorizedItems.length > 0 && (
            <div className="mb-6 p-4 border-2 border-dashed border-amber-500/50 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">Uncategorized Items</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {uncategorizedItems.length} item{uncategorizedItems.length !== 1 ? 's' : ''} without a category - drag them into a category below
                  </p>
                </div>
              </div>
              <SortableContext
                items={uncategorizedItems.map(item => `${item.type}-${item.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {uncategorizedItems.map((item) => (
                    <SortableContentItem
                      key={`${item.type}-${item.id}`}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onConvert={handleConvert}
                      isSelected={selectedItems.has(`${item.type}-${item.id}`)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          )}

          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* Bookmark Categories */}
            {categories.map((category) => {
              const categoryItems = allItems.filter(
                item => item.type === 'bookmark' && item.categoryId !== null && item.categoryId === category.id
              )
              const categoryIconData = category.icon ? getIconByName(category.icon) : null
              const CategoryIcon = categoryIconData?.component
              const categoryKey = `bookmark-category-${category.id}`
              const isCollapsed = collapsedCategories.has(categoryKey)

              return (
                <div
                  key={categoryKey}
                  className="border rounded-lg p-4 bg-accent/5 min-h-[200px]"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -ml-1"
                      onClick={() => toggleCategoryCollapse(categoryKey)}
                      title={isCollapsed ? 'Expand category' : 'Collapse category'}
                    >
                      {isCollapsed ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </Button>
                    {CategoryIcon && <CategoryIcon className="h-5 w-5 text-primary" />}
                    <h3 className="font-semibold">{category.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {category.columns} col{category.columns !== 1 ? 's' : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto"
                      onClick={() => convertCategory(category.id, 'bookmark')}
                      title="Convert to Service Category"
                    >
                      <ArrowsRightLeftIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {!isCollapsed && (
                    <SortableContext
                      items={categoryItems.map(item => `${item.type}-${item.id}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {categoryItems.map((item) => (
                          <SortableContentItem
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onConvert={handleConvert}
                            isSelected={selectedItems.has(`${item.type}-${item.id}`)}
                            onToggleSelect={handleToggleSelect}
                          />
                        ))}
                        {categoryItems.length === 0 && (
                          <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded">
                            Drop items here
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  )}
                </div>
              )
            })}

            {/* Service Categories */}
            {serviceCategories.map((category) => {
              const categoryItems = allItems.filter(
                item => item.type === 'service' && item.categoryId !== null && item.categoryId === category.id
              )
              const categoryIconData = category.icon ? getIconByName(category.icon) : null
              const CategoryIcon = categoryIconData?.component
              const categoryKey = `service-category-${category.id}`
              const isCollapsed = collapsedCategories.has(categoryKey)

              return (
                <div
                  key={categoryKey}
                  className="border rounded-lg p-4 bg-purple-500/5 min-h-[200px]"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -ml-1"
                      onClick={() => toggleCategoryCollapse(categoryKey)}
                      title={isCollapsed ? 'Expand category' : 'Collapse category'}
                    >
                      {isCollapsed ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </Button>
                    {CategoryIcon && <CategoryIcon className="h-5 w-5 text-primary" />}
                    <h3 className="font-semibold">{category.name}</h3>
                    <span className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                      Service
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {category.columns} col{category.columns !== 1 ? 's' : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto"
                      onClick={() => convertCategory(category.id, 'service')}
                      title="Convert to Bookmark Category"
                    >
                      <ArrowsRightLeftIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {!isCollapsed && (
                    <SortableContext
                      items={categoryItems.map(item => `${item.type}-${item.id}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {categoryItems.map((item) => (
                          <SortableContentItem
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onConvert={handleConvert}
                            isSelected={selectedItems.has(`${item.type}-${item.id}`)}
                            onToggleSelect={handleToggleSelect}
                          />
                        ))}
                        {categoryItems.length === 0 && (
                          <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded">
                            Drop items here
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  )}
                </div>
              )
            })}
          </div>

          <DragOverlay>
            {activeItem ? (
              <div className="p-3 bg-card border rounded-lg shadow-lg opacity-90">
                <p className="font-medium text-sm">{activeItem.name}</p>
                <p className="text-xs text-muted-foreground truncate">{activeItem.url}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Convert Dialog */}
        <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Convert {convertingItem?.type === 'bookmark' ? 'Bookmark to Service' : 'Service to Bookmark'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Converting &ldquo;{convertingItem?.name}&rdquo; to a {convertingItem?.type === 'bookmark' ? 'service' : 'bookmark'}.
                Select a category or leave uncategorized.
              </p>
              <div>
                <Label>Target Category</Label>
                <Select
                  value={(selectedTargetCategory ?? 0).toString()}
                  onValueChange={(value) => setSelectedTargetCategory(value === '0' ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Uncategorized</SelectItem>
                    {convertingItem?.type === 'bookmark' && serviceCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    {convertingItem?.type === 'service' && categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmConvert}>
                Convert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit {editingItem?.type === 'bookmark' ? 'Bookmark' : 'Service'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Icon</Label>
                  <div className="space-y-2">
                    <IconSelector
                      value={formData.icon}
                      onChange={(icon) => setFormData({ ...formData, icon })}
                    />

                    {/* Favicon Operations */}
                    {formData.icon?.startsWith('favicon:') && (
                      <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">Favicon Operations</p>
                        <div className="grid grid-cols-2 gap-2">
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
                              onClick={handleRestoreOriginal}
                            >
                              Restore Original
                            </Button>
                          )}
                        </div>

                        {/* Preview */}
                        {(() => {
                          let path = formData.icon.replace('favicon:', '')
                          // Handle monotone suffix
                          if (path.includes('_monotone')) {
                            const suffix = theme === 'dark' ? '_white.png' : '_black.png'
                            path = path + suffix
                          }
                          // Use API route if it starts with /api, otherwise prepend /api/favicons/serve/
                          const previewSrc = path.startsWith('/api/favicons/serve/')
                            ? path
                            : `/api/favicons/serve/${path}`
                          return (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm text-muted-foreground">Preview:</span>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={previewSrc}
                                alt="Favicon preview"
                                className="w-8 h-8 object-contain"
                              />
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFetchFavicon}
                        disabled={fetchingFavicon}
                        className="flex-1"
                      >
                        {fetchingFavicon ? 'Fetching...' : 'Fetch Favicon'}
                      </Button>
                      {formData.icon?.startsWith('favicon:') && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to remove this favicon?')) {
                              setFormData({ ...formData, icon: '' })
                              setOriginalFavicon(null)
                              toast({
                                variant: 'success',
                                title: 'Favicon removed',
                                description: 'Favicon has been removed',
                              })
                            }
                          }}
                          className="flex-shrink-0"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={(formData.categoryId ?? 0).toString()}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {editingItem?.type === 'bookmark' && categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      {editingItem?.type === 'service' && serviceCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
