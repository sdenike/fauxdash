'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
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

interface Bookmark {
  id: number
  categoryId: number
  name: string
  url: string
  icon: string | null
  order: number
  isVisible: boolean
  requiresAuth: boolean
  clickCount: number
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

function SortableBookmarkItem({ bookmark, onEdit, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: bookmark.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-card border rounded-lg"
    >
      <div className="flex items-center gap-3 flex-1" {...attributes} {...listeners}>
        <div className="cursor-move">☰</div>
        {bookmark.icon && <span className="text-xl">{bookmark.icon}</span>}
        <div className="flex-1">
          <div className="font-medium">{bookmark.name}</div>
          <div className="text-xs text-muted-foreground truncate">{bookmark.url}</div>
        </div>
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
      <div className="flex gap-2">
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

export function BookmarkManager({ categories, onBookmarksChange }: BookmarkManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    icon: '',
    categoryId: 0,
    isVisible: true,
    requiresAuth: false,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!selectedCategoryId || active.id === over.id) return

    const category = categories.find(c => c.id === selectedCategoryId)
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
    setFormData({ name: '', url: '', icon: '', categoryId: 0, isVisible: true, requiresAuth: false })
    onBookmarksChange()
  }

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setFormData({
      name: bookmark.name,
      url: bookmark.url,
      icon: bookmark.icon || '',
      categoryId: bookmark.categoryId,
      isVisible: bookmark.isVisible,
      requiresAuth: bookmark.requiresAuth,
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return

    await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' })
    onBookmarksChange()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bookmarks</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingBookmark(null)
                setFormData({ name: '', url: '', icon: '', categoryId: categories[0]?.id || 0, isVisible: true, requiresAuth: false })
              }}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBookmark ? 'Edit Bookmark' : 'Add Bookmark'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
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
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bm-icon">Icon (emoji)</Label>
                    <Input
                      id="bm-icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="🔗"
                    />
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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bm-isVisible"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    />
                    <Label htmlFor="bm-isVisible">Visible</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bm-requiresAuth"
                      checked={formData.requiresAuth}
                      onChange={(e) => setFormData({ ...formData, requiresAuth: e.target.checked })}
                    />
                    <Label htmlFor="bm-requiresAuth">Requires Authentication</Label>
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
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => (
          <div key={category.id}>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              {category.icon} {category.name}
            </h3>
            {category.bookmarks.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={category.bookmarks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className="space-y-2"
                    onMouseEnter={() => setSelectedCategoryId(category.id)}
                  >
                    {category.bookmarks.map((bookmark) => (
                      <SortableBookmarkItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-sm text-muted-foreground">No bookmarks yet</div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
