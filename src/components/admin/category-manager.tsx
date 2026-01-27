'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Checkbox } from '../ui/checkbox'
import { IconSelector } from '../icon-selector'
import { getIconByName } from '@/lib/icons'
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

interface Category {
  id: number
  name: string
  icon: string | null
  order: number
  columns: number
  isVisible: boolean
  requiresAuth: boolean
  itemsToShow: number | null
  showItemCount: boolean
  autoExpanded: boolean
  showOpenAll: boolean
  sortBy: string | null
}

interface CategoryManagerProps {
  categories: Category[]
  onCategoriesChange: () => void
}

function SortableCategoryItem({ category, onEdit, onDelete, isSelected, onToggleSelect }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const iconData = category.icon ? getIconByName(category.icon) : null
  const IconComponent = iconData?.component

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(category.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="cursor-move text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
        <span className="font-medium">{category.name}</span>
        <div className="flex gap-2">
          {!category.isVisible && (
            <span className="text-xs bg-muted px-2 py-1 rounded">Hidden</span>
          )}
          {category.requiresAuth && (
            <span className="text-xs bg-primary/20 px-2 py-1 rounded">Auth Required</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)}>
          <TrashIcon className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

interface Defaults {
  isVisible: boolean
  requiresAuth: boolean
  itemsToShow: number | null
  showItemCount: boolean
  autoExpanded: boolean
  showOpenAll: boolean
  sortBy: string
}

export function CategoryManager({ categories, onCategoriesChange }: CategoryManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set())
  const [bulkItemsToShow, setBulkItemsToShow] = useState('')
  const [defaults, setDefaults] = useState<Defaults>({
    isVisible: true,
    requiresAuth: false,
    itemsToShow: null,
    showItemCount: false,
    autoExpanded: false,
    showOpenAll: false,
    sortBy: 'order',
  })
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    columns: 1,
    isVisible: true,
    requiresAuth: false,
    itemsToShow: null as number | null,
    showItemCount: false,
    autoExpanded: false,
    showOpenAll: false,
    sortBy: 'order' as string,
  })

  useEffect(() => {
    fetchDefaults()
  }, [])

  const fetchDefaults = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setDefaults({
        isVisible: data.defaultBookmarkCategoryEnabled !== false,
        requiresAuth: data.defaultBookmarkCategoryRequiresAuth || false,
        itemsToShow: data.defaultBookmarkCategoryItemsToShow || null,
        showItemCount: data.defaultBookmarkCategoryShowItemCount || false,
        autoExpanded: data.defaultBookmarkCategoryAutoExpanded || false,
        showOpenAll: data.defaultBookmarkCategoryShowOpenAll || false,
        sortBy: data.defaultBookmarkCategorySortBy || 'order',
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

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id)
      const newIndex = categories.findIndex((c) => c.id === over.id)

      const newCategories = arrayMove(categories, oldIndex, newIndex)

      await Promise.all(
        newCategories.map((cat, index) =>
          fetch(`/api/categories/${cat.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: index }),
          })
        )
      )

      onCategoriesChange()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingCategory
      ? `/api/categories/${editingCategory.id}`
      : '/api/categories'

    const method = editingCategory ? 'PATCH' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    setIsOpen(false)
    setEditingCategory(null)
    setFormData({ name: '', icon: '', columns: 1, ...defaults })
    onCategoriesChange()
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon || '',
      columns: category.columns || 1,
      isVisible: category.isVisible,
      requiresAuth: category.requiresAuth,
      itemsToShow: category.itemsToShow,
      showItemCount: category.showItemCount,
      autoExpanded: category.autoExpanded,
      showOpenAll: category.showOpenAll || false,
      sortBy: category.sortBy || 'order',
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    onCategoriesChange()
  }

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCategories(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set())
    } else {
      setSelectedCategories(new Set(categories.map(c => c.id)))
    }
  }

  const bulkUpdate = async (updates: Partial<Category>) => {
    await Promise.all(
      Array.from(selectedCategories).map(id =>
        fetch(`/api/categories/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      )
    )
    setSelectedCategories(new Set())
    onCategoriesChange()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bookmark Categories</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Organize your website bookmarks into categories</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCategory(null)
                setFormData({ name: '', icon: '', columns: 1, ...defaults })
              }}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Add Category'}
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
                    <Label>Icon</Label>
                    <IconSelector
                      value={formData.icon}
                      onChange={(icon) => setFormData({ ...formData, icon })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isVisible">Enabled</Label>
                    <Switch
                      id="isVisible"
                      checked={formData.isVisible}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requiresAuth">Requires Authentication</Label>
                    <Switch
                      id="requiresAuth"
                      checked={formData.requiresAuth}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresAuth: checked })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemsToShow">Items to Show (leave empty to show all)</Label>
                    <Input
                      id="itemsToShow"
                      type="number"
                      min="1"
                      placeholder="Show all items"
                      value={formData.itemsToShow || ''}
                      onChange={(e) => setFormData({ ...formData, itemsToShow: e.target.value ? parseInt(e.target.value) : null })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Number of items to display before showing expand button
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showItemCount">Show Item Count</Label>
                      <p className="text-xs text-muted-foreground">Display total count on category header</p>
                    </div>
                    <Switch
                      id="showItemCount"
                      checked={formData.showItemCount}
                      onCheckedChange={(checked) => setFormData({ ...formData, showItemCount: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoExpanded">Auto Expanded</Label>
                      <p className="text-xs text-muted-foreground">Category starts expanded by default</p>
                    </div>
                    <Switch
                      id="autoExpanded"
                      checked={formData.autoExpanded}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoExpanded: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showOpenAll">Show Open All</Label>
                      <p className="text-xs text-muted-foreground">Display button to open all items in new tabs</p>
                    </div>
                    <Switch
                      id="showOpenAll"
                      checked={formData.showOpenAll}
                      onCheckedChange={(checked) => setFormData({ ...formData, showOpenAll: checked })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sortBy">Sort Items By</Label>
                    <Select
                      value={formData.sortBy}
                      onValueChange={(value) => setFormData({ ...formData, sortBy: value })}
                    >
                      <SelectTrigger id="sortBy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Manual Order (Drag & Drop)</SelectItem>
                        <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                        <SelectItem value="clicks_asc">Click Count (Low to High)</SelectItem>
                        <SelectItem value="clicks_desc">Click Count (High to Low)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      How items in this category should be sorted
                    </p>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit">
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bulk Action Toolbar */}
        {selectedCategories.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg mb-4">
            <span className="text-sm font-medium">{selectedCategories.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ isVisible: true })}>Enable</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ isVisible: false })}>Disable</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ requiresAuth: true })}>Require Auth</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ requiresAuth: false })}>No Auth</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ showItemCount: true })}>Show Count</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ showItemCount: false })}>Hide Count</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ autoExpanded: true })}>Auto Expand</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ autoExpanded: false })}>Collapse</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ showOpenAll: true })}>Show Open All</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ showOpenAll: false })}>Hide Open All</Button>
            <Select onValueChange={(v) => bulkUpdate({ sortBy: v })}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order">Manual Order</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="clicks_asc">Clicks (Low)</SelectItem>
                <SelectItem value="clicks_desc">Clicks (High)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Items to show"
              className="w-28 h-8"
              value={bulkItemsToShow}
              onChange={(e) => setBulkItemsToShow(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseInt(bulkItemsToShow) || null
                  bulkUpdate({ itemsToShow: value })
                  setBulkItemsToShow('')
                }
              }}
            />
            <Button size="sm" variant="ghost" onClick={() => setSelectedCategories(new Set())}>Clear</Button>
          </div>
        )}

        {categories.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Button size="sm" variant="outline" onClick={handleSelectAll}>
                {selectedCategories.size === categories.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {categories.map((category) => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isSelected={selectedCategories.has(category.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          </>
        ) : (
          <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
            No bookmark categories yet. Create your first category to organize bookmarks!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
