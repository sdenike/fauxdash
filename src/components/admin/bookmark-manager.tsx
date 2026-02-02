'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
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
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Bookmark {
  id: number
  categoryId: number
  name: string
  url: string
  description: string | null
  icon: string | null
  order: number
  isVisible: boolean
  requiresAuth: boolean
  clickCount: number
  showDescription: number | null // null = inherit, 0 = hide, 1 = show
}

interface Category {
  id: number
  name: string
  icon: string | null
  bookmarks: Bookmark[]
}

interface BookmarkManagerProps {
  categories: Category[]
  onBookmarksChange: () => void
}

function SortableBookmarkItem({ bookmark, onEdit, onDelete, isSelected, onToggleSelect }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const { theme } = useTheme()

  // Check if icon is a favicon, selfhst, or MDI icon
  const isFavicon = bookmark.icon?.startsWith('favicon:')
  const isSelfhst = bookmark.icon?.startsWith('selfhst:')
  const iconData = !isFavicon && !isSelfhst && bookmark.icon ? getIconByName(bookmark.icon) : null
  const IconComponent = iconData?.component

  // Handle favicon path with grayscale support
  let faviconPath = isFavicon && bookmark.icon ? bookmark.icon.replace('favicon:', '') : null
  if (faviconPath) {
    // Handle grayscale suffix
    if (faviconPath.includes('_grayscale')) {
      const suffix = theme === 'dark' ? '_white.png' : '_black.png'
      faviconPath = faviconPath + suffix
    }
    // Use API route if it starts with /api, otherwise prepend /api/favicons/serve/
    if (!faviconPath.startsWith('/api/favicons/serve/')) {
      faviconPath = `/api/favicons/serve/${faviconPath}`
    }
  }

  // Handle selfhst icons
  const selfhstId = isSelfhst && bookmark.icon ? bookmark.icon.replace('selfhst:', '') : null
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
          onCheckedChange={() => onToggleSelect(bookmark.id)}
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
          <div className="font-medium truncate">{bookmark.name}</div>
          {bookmark.description && (
            <div className="text-xs text-muted-foreground truncate">{bookmark.description}</div>
          )}
          <div className="text-xs text-muted-foreground truncate mt-0.5">{bookmark.url}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {bookmark.clickCount} clicks
          </div>
          {!bookmark.isVisible && (
            <span className="text-xs bg-muted px-2 py-1 rounded">Hidden</span>
          )}
          {bookmark.requiresAuth && (
            <span className="text-xs bg-primary/20 px-2 py-1 rounded">Auth</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(bookmark)}>
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(bookmark.id)}>
          <TrashIcon className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

function DroppableCategory({ category, children }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: `category-${category.id}`,
    data: { categoryId: category.id },
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-4 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-transparent'
      }`}
    >
      {children}
    </div>
  )
}

interface Defaults {
  isVisible: boolean
  requiresAuth: boolean
}

export function BookmarkManager({ categories, onBookmarksChange }: BookmarkManagerProps) {
  const { toast } = useToast()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<number>>(new Set())
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
    categoryId: 0,
    isVisible: true,
    requiresAuth: false,
    showDescription: null as number | null, // null = inherit, 0 = hide, 1 = show
  })

  useEffect(() => {
    fetchDefaults()
  }, [])

  const fetchDefaults = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setDefaults({
        isVisible: data.defaultBookmarkEnabled !== false,
        requiresAuth: data.defaultBookmarkRequiresAuth || false,
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

    if (!over) return

    const activeBookmarkId = active.id
    const overId = over.id

    // Find which category the active bookmark is in
    let sourceCategoryId = null
    let activeBookmark = null
    for (const cat of categories) {
      const bookmark = cat.bookmarks.find(b => b.id === activeBookmarkId)
      if (bookmark) {
        sourceCategoryId = cat.id
        activeBookmark = bookmark
        break
      }
    }

    if (!sourceCategoryId || !activeBookmark) return

    // Determine target category
    let targetCategoryId = sourceCategoryId
    if (typeof overId === 'string' && overId.startsWith('category-')) {
      // Dropped on a category droppable zone
      targetCategoryId = parseInt(overId.replace('category-', ''))
    } else {
      // Dropped on another bookmark - find which category it belongs to
      for (const cat of categories) {
        if (cat.bookmarks.find(b => b.id === overId)) {
          targetCategoryId = cat.id
          break
        }
      }
    }

    // Handle cross-category move
    if (sourceCategoryId !== targetCategoryId) {
      const targetCategory = categories.find(c => c.id === targetCategoryId)
      if (!targetCategory) return

      // Update bookmark's category
      await fetch(`/api/bookmarks/${activeBookmarkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: targetCategoryId,
          order: targetCategory.bookmarks.length // Add to end of target category
        }),
      })

      onBookmarksChange()
      return
    }

    // Handle same-category reordering
    if (active.id === over.id) return

    const category = categories.find(c => c.id === sourceCategoryId)
    if (!category) return

    const oldIndex = category.bookmarks.findIndex((b) => b.id === active.id)
    const newIndex = category.bookmarks.findIndex((b) => b.id === over.id)

    const newBookmarks = arrayMove(category.bookmarks, oldIndex, newIndex)

    await Promise.all(
      newBookmarks.map((bm, index) =>
        fetch(`/api/bookmarks/${bm.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        })
      )
    )

    onBookmarksChange()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingBookmark
      ? `/api/bookmarks/${editingBookmark.id}`
      : '/api/bookmarks'

    const method = editingBookmark ? 'PATCH' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    setIsOpen(false)
    setEditingBookmark(null)
    setFormData({ name: '', url: '', description: '', icon: '', categoryId: categories[0]?.id || 0, showDescription: null, ...defaults })
    onBookmarksChange()
  }

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setFormData({
      name: bookmark.name,
      url: bookmark.url,
      description: bookmark.description || '',
      icon: bookmark.icon || '',
      categoryId: bookmark.categoryId,
      isVisible: bookmark.isVisible,
      requiresAuth: bookmark.requiresAuth,
      showDescription: bookmark.showDescription,
    })

    // Set original favicon if this bookmark has a favicon
    if (bookmark.icon?.startsWith('favicon:') && !bookmark.icon.includes('_themed_') && !bookmark.icon.includes('_grayscale') && !bookmark.icon.includes('_inverted')) {
      setOriginalFavicon(bookmark.icon)
    } else {
      setOriginalFavicon(null)
    }

    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' })
      onBookmarksChange()
      toast({
        variant: 'success',
        title: 'Bookmark deleted',
        description: 'The bookmark has been successfully deleted.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete bookmark.',
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

        // If editing an existing bookmark, update it immediately
        if (editingBookmark) {
          const updateResponse = await fetch(`/api/bookmarks/${editingBookmark.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, icon: newIcon }),
          })

          if (updateResponse.ok) {
            // Refresh the bookmark list to show the new icon immediately
            onBookmarksChange()
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
      // Get current theme color from settings
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
          itemUrl: formData.url,
        }),
      })

      const data = await response.json()

      if (data.success && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        setFormData({ ...formData, icon: newIconPath })

        // If editing an existing bookmark, update it immediately
        if (editingBookmark) {
          const updateResponse = await fetch(`/api/bookmarks/${editingBookmark.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, icon: newIconPath }),
          })

          if (updateResponse.ok) {
            onBookmarksChange()
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

  const handleConvertGrayscale = async () => {
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

    setConvertingGrayscale(true)
    try {
      // Use original favicon if available, otherwise use current icon
      const sourceIcon = originalFavicon || formData.icon

      const response = await fetch('/api/favicons/convert-grayscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favicon: sourceIcon,
          itemUrl: formData.url,
        }),
      })

      const data = await response.json()

      if (data.success && data.filename) {
        const newIconPath = `favicon:${data.filename}`
        setFormData({ ...formData, icon: newIconPath })

        // If editing an existing bookmark, update it immediately
        if (editingBookmark) {
          const updateResponse = await fetch(`/api/bookmarks/${editingBookmark.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, icon: newIconPath }),
          })

          if (updateResponse.ok) {
            onBookmarksChange()
          }
        }

        toast({
          variant: 'success',
          title: 'Grayscale created',
          description: data.message || 'Successfully created black and white versions',
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
    if (!editingBookmark) return

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
        const newIconPath = `favicon:${data.filename}`
        setFormData({ ...formData, icon: newIconPath })

        // Update the bookmark in the database
        const updateResponse = await fetch(`/api/bookmarks/${editingBookmark.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, icon: newIconPath }),
        })

        if (updateResponse.ok) {
          onBookmarksChange()
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

    // If editing an existing bookmark, update it immediately
    if (editingBookmark) {
      const updateResponse = await fetch(`/api/bookmarks/${editingBookmark.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, icon: '' }),
      })

      if (updateResponse.ok) {
        onBookmarksChange()
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

    // If editing an existing bookmark, update it immediately
    if (editingBookmark) {
      const updateResponse = await fetch(`/api/bookmarks/${editingBookmark.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, icon: originalFavicon }),
      })

      if (updateResponse.ok) {
        onBookmarksChange()
      }
    }

    toast({
      title: 'Favicon reverted',
      description: 'Reverted to original favicon',
    })
  }

  const handleBatchFetch = async (fetchAll: boolean = false) => {
    const idsToFetch = fetchAll
      ? categories.flatMap(c => c.bookmarks.map(b => b.id))
      : Array.from(selectedBookmarks)

    if (idsToFetch.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No bookmarks selected',
      })
      return
    }

    setFetchingFavicon(true)
    try {
      const response = await fetch('/api/favicons/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToFetch, type: 'bookmark' }),
      })

      const data = await response.json()

      if (data.success) {
        onBookmarksChange()
        setSelectedBookmarks(new Set())
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

  const toggleBookmarkSelection = (id: number) => {
    const newSelected = new Set(selectedBookmarks)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedBookmarks(newSelected)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bookmarks</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleBatchFetch(true)}
              disabled={fetchingFavicon}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {fetchingFavicon ? 'Fetching...' : 'Fetch All Favicons'}
            </Button>
            {selectedBookmarks.size > 0 && (
              <Button
                variant="outline"
                onClick={() => handleBatchFetch(false)}
                disabled={fetchingFavicon}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Fetch Selected ({selectedBookmarks.size})
              </Button>
            )}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingBookmark(null)
                  setFormData({ name: '', url: '', description: '', icon: '', categoryId: categories[0]?.id || 0, showDescription: null, ...defaults })
                }}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Bookmark
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingBookmark ? 'Edit Bookmark' : 'Add Bookmark'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div>
                    <Label htmlFor="bm-name">Name</Label>
                    <Input
                      id="bm-name"
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
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this bookmark"
                      rows={2}
                    />
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
                            onClick={handleConvertGrayscale}
                            disabled={convertingGrayscale}
                          >
                            <SparklesIcon className="h-4 w-4 mr-2" />
                            {convertingGrayscale ? 'Converting...' : 'Convert to Grayscale'}
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
                      // Handle grayscale suffix for preview
                      let previewPath = formData.icon.replace('favicon:', '')
                      if (previewPath.includes('_grayscale')) {
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
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bm-isVisible">Enabled</Label>
                    <Switch
                      id="bm-isVisible"
                      checked={formData.isVisible}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bm-requiresAuth">Requires Authentication</Label>
                    <Switch
                      id="bm-requiresAuth"
                      checked={formData.requiresAuth}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresAuth: checked })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bm-showDescription">Show Description</Label>
                    <Select
                      value={formData.showDescription === null ? 'inherit' : formData.showDescription.toString()}
                      onValueChange={(value) => setFormData({ ...formData, showDescription: value === 'inherit' ? null : parseInt(value) })}
                    >
                      <SelectTrigger id="bm-showDescription">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inherit">Inherit (Use Category/Global Setting)</SelectItem>
                        <SelectItem value="1">Show</SelectItem>
                        <SelectItem value="0">Hide</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Whether to show the description for this bookmark
                    </p>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit">
                    {editingBookmark ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {categories.map((category) => {
            const catIconData = category.icon ? getIconByName(category.icon) : null
            const CategoryIcon = catIconData?.component
            const allBookmarkIds = categories.flatMap(c => c.bookmarks.map(b => b.id))

            return (
              <div key={category.id}>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  {CategoryIcon && <CategoryIcon className="h-5 w-5" />}
                  {category.name}
                </h3>
                <DroppableCategory category={category}>
                  {category.bookmarks.length > 0 ? (
                    <SortableContext
                      items={category.bookmarks.map(b => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {category.bookmarks.map((bookmark) => (
                          <SortableBookmarkItem
                            key={bookmark.id}
                            bookmark={bookmark}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isSelected={selectedBookmarks.has(bookmark.id)}
                            onToggleSelect={toggleBookmarkSelection}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                      Drop bookmarks here or create a new one
                    </div>
                  )}
                </DroppableCategory>
              </div>
            )
          })}
        </DndContext>
      </CardContent>
    </Card>
  )
}
