'use client'

import { useConfirm } from '@/components/ui/confirm-dialog'
import { useState, useMemo, memo } from 'react'
import { AdminSection } from './admin-page'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Pencil, Trash2, ArrowLeftRight, Sparkles, ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Circle, GripVertical, AlertTriangle } from 'lucide-react'
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
  arrayMove,
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

const SortableContentItem = memo(function SortableContentItem({ item, onEdit, onDelete, onConvert, isSelected, onToggleSelect }: any) {
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

  // Memoize favicon path to prevent recalculation on every render
  const faviconPath = useMemo(() => {
    if (!isFavicon || !item.icon) return null

    let path = item.icon.replace('favicon:', '')
    // Handle grayscale/monotone suffix
    if (path.includes('_monotone') || path.includes('_grayscale')) {
      const suffix = theme === 'dark' ? '_white.png' : '_black.png'
      path = path + suffix
    }
    // Use API route if it starts with /api, otherwise prepend /api/favicons/serve/
    if (!path.startsWith('/api/favicons/serve/')) {
      return `/api/favicons/serve/${path}`
    }
    return path
  }, [isFavicon, item.icon, theme])

  // Handle selfhst icons
  const selfhstPath = useMemo(() => {
    if (!isSelfhst || !item.icon) return null
    const selfhstId = item.icon.replace('selfhst:', '')
    return `https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${selfhstId}.png`
  }, [isSelfhst, item.icon])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col gap-2 p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Top row: Checkbox, Drag Handle, Icon, Name */}
      <div className="flex items-center gap-3">
        <Checkbox
          aria-label={`Select ${item.name}`}
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(item)}
          onClick={(e) => e.stopPropagation()}
        />

        <div
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${item.name}`}
          className="cursor-move text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-4 h-4" aria-hidden="true" />
        </div>

        {(ItemIcon || faviconPath || selfhstPath) && (
          <div className="flex items-center justify-center flex-shrink-0 text-primary w-8 h-8">
            {ItemIcon && <ItemIcon className="w-6 h-6" aria-hidden="true" />}
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
            ? 'bg-info-soft text-info'
            : 'bg-brand-soft text-brand'
        }`}>
          {item.type === 'bookmark' ? 'Bookmark' : 'Service'}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onConvert(item)}
          title={`Convert to ${item.type === 'bookmark' ? 'service' : 'bookmark'}`}
          aria-label={`Convert ${item.name} to ${item.type === 'bookmark' ? 'service' : 'bookmark'}`}
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(item)}
          title="Edit"
          aria-label={`Edit ${item.name}`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(item)}
          title="Delete"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
})

export function ContentManager({ categories, serviceCategories, onContentChange }: ContentManagerProps) {
  const confirm = useConfirm()
  const { toast } = useToast()
  const { theme } = useTheme()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [fetchingFavicon, setFetchingFavicon] = useState(false)
  const [convertingColor, setConvertingColor] = useState(false)
  const [convertingGrayscale, setConvertingGrayscale] = useState(false)
  const [invertingColors, setInvertingColors] = useState(false)
  const [revertingOriginal, setRevertingOriginal] = useState(false)
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

  // Helper function to ensure an icon is a local favicon (converts selfh.st if needed)
  const ensureLocalFavicon = async (icon: string, itemId: number, itemType: 'bookmark' | 'service'): Promise<string | null> => {
    if (icon.startsWith('favicon:')) {
      return icon
    }

    if (icon.startsWith('selfhst:')) {
      // Need to save selfh.st icon locally first
      const iconId = icon.replace('selfhst:', '')
      try {
        const response = await fetch('/api/icons/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            iconType: 'selfhst',
            iconId,
            iconName: iconId,
          }),
        })

        const data = await response.json()
        if (data.success) {
          // Update the item in database with the new local path
          const endpoint = itemType === 'bookmark' ? `/api/bookmarks/${itemId}` : `/api/services/${itemId}`
          await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ icon: `favicon:${data.path}` }),
          })
          return `favicon:${data.path}`
        }
      } catch (error) {
        console.error('Failed to save selfh.st icon locally:', error)
      }
      return null
    }

    // For HeroIcons or other component-based icons, they can't be converted
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    console.log('[Drag] Start:', event.active.id)
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    console.log('[Drag] End:', { active: active.id, over: over?.id })

    if (!over) {
      console.log('[Drag] No drop target')
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // If dragging onto itself, no action needed
    if (activeId === overId) {
      console.log('[Drag] Dropped on self, no action')
      return
    }

    // Parse IDs
    const [activeType, activeIdNum] = activeId.split('-')
    const [overType, overIdNum] = overId.split('-')

    console.log('[Drag] Parsed:', { activeType, activeIdNum, overType, overIdNum })

    const sourceItem = allItems.find(item => `${item.type}-${item.id}` === activeId)
    if (!sourceItem) {
      console.log('[Drag] Source item not found')
      return
    }

    // If dropped on another item, check if it's a reorder or move
    if (overType === 'bookmark' || overType === 'service') {
      const targetItem = allItems.find(item => `${item.type}-${item.id}` === overId)
      if (!targetItem) {
        console.log('[Drag] Target item not found')
        return
      }

      // Check if this is a reorder within the same category and type
      if (sourceItem.type === targetItem.type && sourceItem.categoryId === targetItem.categoryId) {
        console.log('[Drag] Reordering within same category')
        await reorderItems(sourceItem, targetItem)
      } else if (targetItem.categoryId !== null) {
        // Move to different category or convert type
        console.log('[Drag] Moving to different category')
        await moveItem(sourceItem, targetItem.categoryId)
      }
    } else if (overType === 'category' || overType === 'service-category') {
      // Dropped directly on a category
      console.log('[Drag] Dropped on category')
      const categoryId = parseInt(overIdNum)
      await moveItem(sourceItem, categoryId, overType === 'service-category' ? 'service' : 'bookmark')
    }
  }

  const reorderItems = async (sourceItem: ContentItem, targetItem: ContentItem) => {
    // Get all items in the same category
    const categoryItems = allItems.filter(
      item => item.type === sourceItem.type && item.categoryId === sourceItem.categoryId
    ).sort((a, b) => a.order - b.order)

    const oldIndex = categoryItems.findIndex(item => item.id === sourceItem.id)
    const newIndex = categoryItems.findIndex(item => item.id === targetItem.id)

    console.log('[Drag] Reorder:', { oldIndex, newIndex, totalItems: categoryItems.length })

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder the items
    const reorderedItems = arrayMove(categoryItems, oldIndex, newIndex)

    // Update order for all items
    const endpoint = sourceItem.type === 'bookmark' ? '/api/bookmarks' : '/api/services'
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      order: index,
    }))

    console.log('[Drag] Updating order for', updates.length, 'items')

    // Update each item's order in parallel
    Promise.all(
      updates.map(update =>
        fetch(`${endpoint}/${update.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: update.order }),
        })
      )
    ).then(() => {
      console.log('[Drag] Order updated successfully')
      // Refresh after a delay to allow drag animation to complete
      setTimeout(() => {
        console.log('[Drag] Triggering content refresh')
        onContentChange()
      }, 500)
    }).catch(error => {
      console.error('[Drag] Failed to update order:', error)
      // On error, refresh immediately to restore correct state
      onContentChange()
    })
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
    if (item.icon?.startsWith('favicon:') && !item.icon.includes('_themed_') && !(item.icon.includes('_monotone') || item.icon.includes('_grayscale')) && !item.icon.includes('_grayscale') && !item.icon.includes('_inverted')) {
      setOriginalFavicon(item.icon)
    } else {
      setOriginalFavicon(null)
    }

    setIsEditOpen(true)
  }

  const handleDelete = async (item: ContentItem) => {
    if (!(await confirm({ title: `Delete "${item.name}"?`, description: 'This cannot be undone.', confirmLabel: item.type === 'bookmark' ? 'Delete bookmark' : 'Delete service', destructive: true }))) return

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

  const handleSelectCategory = (categoryType: 'bookmark' | 'service', categoryId: number | null) => {
    const categoryItems = allItems.filter(item => {
      if (categoryId === null) {
        // Uncategorized items
        return item.type === categoryType && item.categoryId === null
      }
      return item.type === categoryType && item.categoryId === categoryId
    })

    const categoryItemIds = categoryItems.map(item => `${item.type}-${item.id}`)
    const allSelected = categoryItemIds.every(id => selectedItems.has(id))

    const newSelected = new Set(selectedItems)
    if (allSelected) {
      // Deselect all in this category
      categoryItemIds.forEach(id => newSelected.delete(id))
    } else {
      // Select all in this category
      categoryItemIds.forEach(id => newSelected.add(id))
    }
    setSelectedItems(newSelected)
  }

  const isCategoryFullySelected = (categoryType: 'bookmark' | 'service', categoryId: number | null) => {
    const categoryItems = allItems.filter(item => {
      if (categoryId === null) {
        return item.type === categoryType && item.categoryId === null
      }
      return item.type === categoryType && item.categoryId === categoryId
    })
    if (categoryItems.length === 0) return false
    return categoryItems.every(item => selectedItems.has(`${item.type}-${item.id}`))
  }

  const getCategorySelectedCount = (categoryType: 'bookmark' | 'service', categoryId: number | null) => {
    const categoryItems = allItems.filter(item => {
      if (categoryId === null) {
        return item.type === categoryType && item.categoryId === null
      }
      return item.type === categoryType && item.categoryId === categoryId
    })
    return categoryItems.filter(item => selectedItems.has(`${item.type}-${item.id}`)).length
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
        if (!iconPath.includes('_themed_') && !iconPath.includes('_monotone') && !iconPath.includes('_grayscale') && !iconPath.includes('_inverted')) {
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
      // Settings returns an object with themeColor (e.g., 'Slate', 'Blue', etc.)
      const themeColor = settings.themeColor || 'Slate'

      // Use original favicon if available, otherwise use current icon
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/convert-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favicon: sourceIcon,
          color: themeColor,
          itemUrl: formData.url,
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

  const handleConvertGrayscale = async () => {
    if (!formData.icon || !formData.icon.startsWith('favicon:')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Only favicon icons can be converted',
      })
      return
    }

    if (formData.icon.includes('_grayscale')) {
      toast({
        variant: 'destructive',
        title: 'Already converted',
        description: 'This favicon has already been converted to grayscale',
      })
      return
    }

    setConvertingGrayscale(true)
    try {
      // Use original favicon if available, otherwise use current icon
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/convert-grayscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon: sourceIcon, itemUrl: formData.url }),
      })

      const data = await response.json()

      if (response.ok && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        setFormData({ ...formData, icon: newIconPath })
        toast({
          variant: 'success',
          title: 'Converted to grayscale',
          description: data.message || 'Successfully converted to grayscale',
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
    if (!formData.icon || !formData.icon.startsWith('favicon:')) return

    setInvertingColors(true)
    try {
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/invert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon: sourceIcon, itemUrl: formData.url }),
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

  const handleBulkConvertGrayscale = async () => {
    // Include both favicon: and selfhst: icons
    const itemsToConvert = allItems.filter(item =>
      selectedItems.has(`${item.type}-${item.id}`) &&
      (item.icon?.startsWith('favicon:') || item.icon?.startsWith('selfhst:'))
    )

    if (itemsToConvert.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No items with convertible icons selected. Select items with favicons or selfh.st icons.',
      })
      return
    }

    setConvertingGrayscale(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const item of itemsToConvert) {
        try {
          // Ensure we have a local favicon (convert selfh.st if needed)
          let sourceIcon = item.icon!
          if (sourceIcon.startsWith('selfhst:')) {
            const localIcon = await ensureLocalFavicon(sourceIcon, item.id, item.type)
            if (!localIcon) {
              failCount++
              continue
            }
            sourceIcon = localIcon
          }

          // Get original or use current icon - strip any transformation suffixes
          const cleanedIcon = sourceIcon.includes('_themed_') || sourceIcon.includes('_monotone') || sourceIcon.includes('_grayscale') || sourceIcon.includes('_inverted')
            ? sourceIcon.replace(/_themed_[^.]+\.png|_monotone(_black|_white)?\.png|_grayscale(_black|_white)?\.png|_inverted\.png/, '.png')
            : sourceIcon

          const response = await fetch('/api/favicons/convert-grayscale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ favicon: cleanedIcon, itemUrl: item.url }),
          })

          const data = await response.json()
          if (response.ok && data.filename) {
            const endpoint = item.type === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
            await fetch(endpoint, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ icon: `favicon:${data.filename}` }),
            })
            successCount++
          } else {
            console.error('Grayscale conversion failed:', data.error)
            failCount++
          }
        } catch (error) {
          console.error('Error converting item:', error)
          failCount++
        }
      }

      onContentChange()

      if (failCount === 0) {
        toast({
          variant: 'success',
          title: 'Converted to grayscale',
          description: `Successfully converted ${successCount} items`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Partial conversion',
          description: `Converted ${successCount} items, ${failCount} failed. Some formats may not be supported.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert items',
      })
    } finally {
      setConvertingGrayscale(false)
    }
  }

  const handleBulkInvert = async () => {
    // Include both favicon: and selfhst: icons
    const itemsToConvert = allItems.filter(item =>
      selectedItems.has(`${item.type}-${item.id}`) &&
      (item.icon?.startsWith('favicon:') || item.icon?.startsWith('selfhst:'))
    )

    if (itemsToConvert.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No items with convertible icons selected. Select items with favicons or selfh.st icons.',
      })
      return
    }

    setInvertingColors(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const item of itemsToConvert) {
        try {
          // Ensure we have a local favicon (convert selfh.st if needed)
          let sourceIcon = item.icon!
          if (sourceIcon.startsWith('selfhst:')) {
            const localIcon = await ensureLocalFavicon(sourceIcon, item.id, item.type)
            if (!localIcon) {
              failCount++
              continue
            }
            sourceIcon = localIcon
          }

          // Get original or use current icon - strip any transformation suffixes
          const cleanedIcon = sourceIcon.includes('_themed_') || sourceIcon.includes('_monotone') || sourceIcon.includes('_grayscale') || sourceIcon.includes('_inverted')
            ? sourceIcon.replace(/_themed_[^.]+\.png|_monotone(_black|_white)?\.png|_grayscale(_black|_white)?\.png|_inverted\.png/, '.png')
            : sourceIcon

          const response = await fetch('/api/favicons/invert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ favicon: cleanedIcon, itemUrl: item.url }),
          })

          const data = await response.json()
          if (response.ok && data.filename) {
            const endpoint = item.type === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
            await fetch(endpoint, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ icon: `favicon:${data.filename}` }),
            })
            successCount++
          } else {
            console.error('Invert conversion failed:', data.error)
            failCount++
          }
        } catch (error) {
          console.error('Error inverting item:', error)
          failCount++
        }
      }

      onContentChange()

      if (failCount === 0) {
        toast({
          variant: 'success',
          title: 'Colors inverted',
          description: `Successfully inverted ${successCount} items`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Partial conversion',
          description: `Inverted ${successCount} items, ${failCount} failed. Some formats may not be supported.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to invert items',
      })
    } finally {
      setInvertingColors(false)
    }
  }

  const handleBulkDelete = async () => {
    const itemsToDelete = allItems.filter(item =>
      selectedItems.has(`${item.type}-${item.id}`)
    )

    if (itemsToDelete.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No items selected',
      })
      return
    }

    if (!(await confirm({ title: `Delete ${itemsToDelete.length} item${itemsToDelete.length !== 1 ? 's' : ''}?`, description: 'This cannot be undone.', confirmLabel: 'Delete', destructive: true }))) {
      return
    }

    try {
      const deletePromises = itemsToDelete.map(async (item) => {
        const endpoint = item.type === 'bookmark'
          ? `/api/bookmarks/${item.id}`
          : `/api/services/${item.id}`
        return fetch(endpoint, { method: 'DELETE' })
      })

      await Promise.all(deletePromises)

      // Clear selection
      setSelectedItems(new Set())

      onContentChange()
      toast({
        variant: 'success',
        title: 'Items deleted',
        description: `Successfully deleted ${itemsToDelete.length} item${itemsToDelete.length !== 1 ? 's' : ''}`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete some items',
      })
    }
  }

  const handleBulkConvertTheme = async () => {
    // Include both favicon: and selfhst: icons
    const itemsToConvert = allItems.filter(item =>
      selectedItems.has(`${item.type}-${item.id}`) &&
      (item.icon?.startsWith('favicon:') || item.icon?.startsWith('selfhst:'))
    )

    if (itemsToConvert.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No items with convertible icons selected. Select items with favicons or selfh.st icons.',
      })
      return
    }

    setConvertingColor(true)
    let successCount = 0
    let failCount = 0

    try {
      // Get theme color
      const settingsRes = await fetch('/api/settings')
      const settings = await settingsRes.json()
      // Settings returns an object with themeColor (e.g., 'Slate', 'Blue', etc.)
      const themeColor = settings.themeColor || 'Slate'

      for (const item of itemsToConvert) {
        try {
          // Ensure we have a local favicon (convert selfh.st if needed)
          let sourceIcon = item.icon!
          if (sourceIcon.startsWith('selfhst:')) {
            const localIcon = await ensureLocalFavicon(sourceIcon, item.id, item.type)
            if (!localIcon) {
              failCount++
              continue
            }
            sourceIcon = localIcon
          }

          // Get original or use current icon - strip any transformation suffixes
          const cleanedIcon = sourceIcon.includes('_themed_') || sourceIcon.includes('_monotone') || sourceIcon.includes('_grayscale') || sourceIcon.includes('_inverted')
            ? sourceIcon.replace(/_themed_[^.]+\.png|_monotone(_black|_white)?\.png|_grayscale(_black|_white)?\.png|_inverted\.png/, '.png')
            : sourceIcon

          const response = await fetch('/api/favicons/convert-color', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ favicon: cleanedIcon, color: themeColor, itemUrl: item.url }),
          })

          const data = await response.json()
          if (response.ok && data.filename) {
            const endpoint = item.type === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
            await fetch(endpoint, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ icon: `favicon:${data.filename}` }),
            })
            successCount++
          } else {
            console.error('Theme color conversion failed:', data.error)
            failCount++
          }
        } catch (error) {
          console.error('Error converting item:', error)
          failCount++
        }
      }

      onContentChange()

      if (failCount === 0) {
        toast({
          variant: 'success',
          title: 'Converted to theme color',
          description: `Successfully converted ${successCount} items`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Partial conversion',
          description: `Converted ${successCount} items, ${failCount} failed. Some formats may not be supported.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert items',
      })
    } finally {
      setConvertingColor(false)
    }
  }

  const handleBulkRevertOriginal = async () => {
    // Only items with transformed favicons can be reverted
    const itemsToRevert = allItems.filter(item =>
      selectedItems.has(`${item.type}-${item.id}`) &&
      item.icon?.startsWith('favicon:') &&
      (item.icon.includes('_themed_') || (item.icon.includes('_monotone') || item.icon.includes('_grayscale')) || item.icon.includes('_inverted'))
    )

    if (itemsToRevert.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No transformed favicons selected. Select items that have been converted to theme color, grayscale, or inverted.',
      })
      return
    }

    setRevertingOriginal(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const item of itemsToRevert) {
        // Extract the base name and construct original path
        let iconPath = item.icon!.replace('favicon:', '')
        if (iconPath.startsWith('/api/favicons/serve/')) {
          iconPath = iconPath.replace('/api/favicons/serve/', '')
        }

        // Strip transformation suffixes to get base name
        const baseName = iconPath
          .replace(/_themed_[^.]+\.png$/, '')
          .replace(/_monotone_black\.png$/, '')
          .replace(/_monotone_white\.png$/, '')
          .replace(/_monotone$/, '')
          .replace(/_grayscale_black\.png$/, '')
          .replace(/_grayscale_white\.png$/, '')
          .replace(/_grayscale$/, '')
          .replace(/_inverted\.png$/, '')
          .replace(/\.png$/, '')

        // The original should be baseName.png (the active copy) or baseName_original.png
        const originalPath = `favicon:/api/favicons/serve/${baseName}.png`

        try {
          const endpoint = item.type === 'bookmark' ? `/api/bookmarks/${item.id}` : `/api/services/${item.id}`
          const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ icon: originalPath }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (e) {
          failCount++
        }
      }

      onContentChange()

      if (failCount === 0) {
        toast({
          variant: 'success',
          title: 'Reverted to original',
          description: `Successfully reverted ${successCount} items to original`,
        })
      } else {
        toast({
          variant: 'default',
          title: 'Partially completed',
          description: `Reverted ${successCount} items, ${failCount} failed`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to revert some items',
      })
    } finally {
      setRevertingOriginal(false)
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

    if (!(await confirm({ title: `Convert "${category.name}" to a ${toType} category?`, description: `Its ${categoryItems.length} item${categoryItems.length !== 1 ? 's move' : ' moves'} with it.`, confirmLabel: 'Convert' }))) return

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
    <AdminSection
      title="Content manager"
      description="Drag and drop to reorganize or convert between bookmarks and services"
      actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedItems.size === allItems.length ? 'Deselect all' : 'Select all'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchFetch(true)}
              disabled={fetchingFavicon}
            >
              {fetchingFavicon ? 'Fetching…' : 'Fetch all favicons'}
            </Button>
            {selectedItems.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchFetch(false)}
                  disabled={fetchingFavicon}
                >
                  Fetch selected ({selectedItems.size})
                </Button>
                <div className="h-6 w-px bg-border" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkConvertGrayscale}
                  disabled={convertingGrayscale}
                >
                  <Sparkles className="h-4 w-4 mr-1" aria-hidden="true" />
                  {convertingGrayscale ? 'Converting…' : 'Grayscale selected'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkInvert}
                  disabled={invertingColors}
                >
                  <Sparkles className="h-4 w-4 mr-1" aria-hidden="true" />
                  {invertingColors ? 'Inverting…' : 'Invert selected'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkConvertTheme}
                  disabled={convertingColor}
                >
                  <Sparkles className="h-4 w-4 mr-1" aria-hidden="true" />
                  {convertingColor ? 'Converting…' : 'Theme color selected'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkRevertOriginal}
                  disabled={revertingOriginal}
                >
                  <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
                  {revertingOriginal ? 'Reverting…' : 'Revert to original'}
                </Button>
                <div className="h-6 w-px bg-border" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                  Delete selected ({selectedItems.size})
                </Button>
              </>
            )}
          </div>
      }
    >
      <div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Uncategorized Items Section */}
          {uncategorizedItems.length > 0 && (
            <div className="mb-6 p-4 border-2 border-dashed border-warning/30 rounded-lg bg-warning-soft">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-warning-soft">
                  <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Uncategorized items</h3>
                  <p className="text-sm text-muted-foreground">
                    {uncategorizedItems.length} item{uncategorizedItems.length !== 1 ? 's' : ''} without a category. Drag them into a category below.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    const uncategorizedIds = uncategorizedItems.map(item => `${item.type}-${item.id}`)
                    const allSelected = uncategorizedIds.every(id => selectedItems.has(id))
                    const newSelected = new Set(selectedItems)
                    if (allSelected) {
                      uncategorizedIds.forEach(id => newSelected.delete(id))
                    } else {
                      uncategorizedIds.forEach(id => newSelected.add(id))
                    }
                    setSelectedItems(newSelected)
                  }}
                  title={uncategorizedItems.every(item => selectedItems.has(`${item.type}-${item.id}`)) ? 'Deselect all uncategorized' : 'Select all uncategorized'}
                  aria-label={uncategorizedItems.every(item => selectedItems.has(`${item.type}-${item.id}`)) ? 'Deselect all uncategorized' : 'Select all uncategorized'}
                >
                  {uncategorizedItems.every(item => selectedItems.has(`${item.type}-${item.id}`)) ? (
                    <CheckCircle2 className="h-4 w-4 text-warning" aria-hidden="true" />
                  ) : (
                    <Circle className="h-4 w-4 text-warning" aria-hidden="true" />
                  )}
                </Button>
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
                  className="border border-border rounded-lg p-4 bg-muted/30 min-h-[200px]"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -ml-1"
                      onClick={() => toggleCategoryCollapse(categoryKey)}
                      title={isCollapsed ? 'Expand category' : 'Collapse category'}
                      aria-label={isCollapsed ? 'Expand category' : 'Collapse category'}
                    >
                      {isCollapsed ? (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                    {CategoryIcon && <CategoryIcon className="h-5 w-5 text-primary" aria-hidden="true" />}
                    <h3 className="font-semibold">{category.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {category.columns} col{category.columns !== 1 ? 's' : ''}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      {categoryItems.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleSelectCategory('bookmark', category.id)}
                          title={isCategoryFullySelected('bookmark', category.id) ? 'Deselect all in category' : 'Select all in category'}
                          aria-label={isCategoryFullySelected('bookmark', category.id) ? 'Deselect all in category' : 'Select all in category'}
                        >
                          {isCategoryFullySelected('bookmark', category.id) ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                          ) : (
                            <Circle className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => convertCategory(category.id, 'bookmark')}
                        title="Convert to service category"
                        aria-label="Convert to service category"
                      >
                        <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
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
                  className="border border-border rounded-lg p-4 bg-muted/30 min-h-[200px]"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -ml-1"
                      onClick={() => toggleCategoryCollapse(categoryKey)}
                      title={isCollapsed ? 'Expand category' : 'Collapse category'}
                      aria-label={isCollapsed ? 'Expand category' : 'Collapse category'}
                    >
                      {isCollapsed ? (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                    {CategoryIcon && <CategoryIcon className="h-5 w-5 text-primary" aria-hidden="true" />}
                    <h3 className="font-semibold">{category.name}</h3>
                    <span className="text-xs bg-brand-soft text-brand px-2 py-0.5 rounded">
                      Service
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {category.columns} col{category.columns !== 1 ? 's' : ''}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      {categoryItems.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleSelectCategory('service', category.id)}
                          title={isCategoryFullySelected('service', category.id) ? 'Deselect all in category' : 'Select all in category'}
                          aria-label={isCategoryFullySelected('service', category.id) ? 'Deselect all in category' : 'Select all in category'}
                        >
                          {isCategoryFullySelected('service', category.id) ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                          ) : (
                            <Circle className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => convertCategory(category.id, 'service')}
                        title="Convert to bookmark category"
                        aria-label="Convert to bookmark category"
                      >
                        <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
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
              <div className="p-3 bg-card border border-border rounded-lg opacity-90">
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
                Convert {convertingItem?.type === 'bookmark' ? 'bookmark to service' : 'service to bookmark'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Converting &ldquo;{convertingItem?.name}&rdquo; to a {convertingItem?.type === 'bookmark' ? 'service' : 'bookmark'}.
                Select a category or leave uncategorized.
              </p>
              <div>
                <Label>Target category</Label>
                <Select
                  value={(selectedTargetCategory ?? 0).toString()}
                  onValueChange={(value) => setSelectedTargetCategory(value === '0' ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category…" />
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
                Edit {editingItem?.type === 'bookmark' ? 'bookmark' : 'service'}
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
                      defaultTab={editingItem?.type === 'service' ? 'selfhst' : 'heroicons'}
                    />

                    {/* Favicon operations */}
                    {formData.icon?.startsWith('favicon:') && (
                      <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">Favicon operations</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleConvertColor}
                            disabled={convertingColor}
                          >
                            <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                            {convertingColor ? 'Converting…' : 'Convert to theme color'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleConvertGrayscale}
                            disabled={convertingGrayscale}
                          >
                            <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                            {convertingGrayscale ? 'Converting…' : 'Convert to grayscale'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleInvertColors}
                            disabled={invertingColors}
                          >
                            <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                            {invertingColors ? 'Inverting…' : 'Invert colors'}
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
                          // Handle grayscale/monotone suffix
                          if (path.includes('_monotone') || path.includes('_grayscale')) {
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
                        {fetchingFavicon ? 'Fetching…' : 'Fetch favicon'}
                      </Button>
                      {formData.icon?.startsWith('favicon:') && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (await confirm({ title: 'Remove this favicon?', confirmLabel: 'Remove', destructive: true })) {
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
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminSection>
  )
}
