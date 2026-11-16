'use client'

import { useConfirm } from '@/components/ui/confirm-dialog'
import { useState, useEffect } from 'react'
import { AdminSection } from './admin-page'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
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

interface ServiceCategory {
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

interface ServiceCategoryManagerProps {
  categories: ServiceCategory[]
  onCategoriesChange: () => void
}

function SortableServiceCategoryItem({ category, onEdit, onDelete, isSelected, onToggleSelect }: any) {
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
      className={`flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          aria-label={`Select ${category.name}`}
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(category.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="cursor-move text-muted-foreground hover:text-foreground" aria-label={`Reorder ${category.name}`} {...attributes} {...listeners}>
          <GripVertical className="w-5 h-5" aria-hidden="true" />
        </div>
        {IconComponent && <IconComponent className="h-5 w-5 text-primary" aria-hidden="true" />}
        <span className="font-medium">{category.name}</span>
        <div className="flex gap-2">
          {!category.isVisible && (
            <span className="text-xs bg-muted px-2 py-1 rounded">Hidden</span>
          )}
          {category.requiresAuth && (
            <span className="text-xs bg-muted px-2 py-1 rounded">Auth required</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${category.name}`} onClick={() => onEdit(category)}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${category.name}`} onClick={() => onDelete(category.id)}>
          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
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

export function ServiceCategoryManager({ categories, onCategoriesChange }: ServiceCategoryManagerProps) {
  const confirm = useConfirm()
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
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
        isVisible: data.defaultServiceCategoryEnabled !== false,
        requiresAuth: data.defaultServiceCategoryRequiresAuth || false,
        itemsToShow: data.defaultServiceCategoryItemsToShow || null,
        showItemCount: data.defaultServiceCategoryShowItemCount || false,
        autoExpanded: data.defaultServiceCategoryAutoExpanded || false,
        showOpenAll: data.defaultServiceCategoryShowOpenAll || false,
        sortBy: data.defaultServiceCategorySortBy || 'order',
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
          fetch(`/api/service-categories/${cat.id}`, {
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
      ? `/api/service-categories/${editingCategory.id}`
      : '/api/service-categories'

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

  const handleEdit = (category: ServiceCategory) => {
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
    if (!(await confirm({ title: 'Delete this service category?', description: 'Its services move to Uncategorized.', confirmLabel: 'Delete category', destructive: true }))) return

    await fetch(`/api/service-categories/${id}`, { method: 'DELETE' })
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

  const bulkUpdate = async (updates: Partial<ServiceCategory>) => {
    await Promise.all(
      Array.from(selectedCategories).map(id =>
        fetch(`/api/service-categories/${id}`, {
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
    <AdminSection
      title="Service categories"
      description="Organize your services into categories"
      actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCategory(null)
                setFormData({ name: '', icon: '', columns: 1, ...defaults })
              }}>
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Add category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit category' : 'Add category'}
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
                      defaultTab="selfhst"
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
                    <Label htmlFor="requiresAuth">Requires authentication</Label>
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
                      <Label htmlFor="showItemCount">Show item count</Label>
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
                      <Label htmlFor="autoExpanded">Auto expanded</Label>
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
                      <Label htmlFor="showOpenAll">Show open all</Label>
                      <p className="text-xs text-muted-foreground">Display button to open all items in new tabs</p>
                    </div>
                    <Switch
                      id="showOpenAll"
                      checked={formData.showOpenAll}
                      onCheckedChange={(checked) => setFormData({ ...formData, showOpenAll: checked })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sortBy">Sort items by</Label>
                    <Select
                      value={formData.sortBy}
                      onValueChange={(value) => setFormData({ ...formData, sortBy: value })}
                    >
                      <SelectTrigger id="sortBy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Manual order (drag and drop)</SelectItem>
                        <SelectItem value="name_asc">Name (A to Z)</SelectItem>
                        <SelectItem value="name_desc">Name (Z to A)</SelectItem>
                        <SelectItem value="clicks_asc">Click count (low to high)</SelectItem>
                        <SelectItem value="clicks_desc">Click count (high to low)</SelectItem>
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
      }
    >
      <div>
        {/* Bulk Action Toolbar */}
        {selectedCategories.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg mb-4">
            <span className="text-sm font-medium">{selectedCategories.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ isVisible: true })}>Enable</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ isVisible: false })}>Disable</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ requiresAuth: true })}>Require auth</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ requiresAuth: false })}>No auth</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ showItemCount: true })}>Show count</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ showItemCount: false })}>Hide count</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ autoExpanded: true })}>Auto expand</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ autoExpanded: false })}>Collapse</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ showOpenAll: true })}>Show open all</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ showOpenAll: false })}>Hide open all</Button>
            <Select onValueChange={(v) => bulkUpdate({ sortBy: v })}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Sort by…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order">Manual order</SelectItem>
                <SelectItem value="name_asc">Name (A to Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z to A)</SelectItem>
                <SelectItem value="clicks_asc">Clicks (low)</SelectItem>
                <SelectItem value="clicks_desc">Clicks (high)</SelectItem>
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
                {selectedCategories.size === categories.length ? 'Deselect all' : 'Select all'}
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
                  <SortableServiceCategoryItem
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
            No service categories yet. Create your first category to organize services!
          </div>
        )}
      </div>
    </AdminSection>
  )
}
