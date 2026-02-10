'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TrashIcon } from '@heroicons/react/24/outline'

interface MediaLibraryItem {
  filename: string
  size: number
  createdAt: string
  thumbnailUrl: string
  originalUrl: string
}

interface MediaLibraryPickerProps {
  onSelect: (filename: string) => void
  trigger?: React.ReactNode
}

export function MediaLibraryPicker({ onSelect, trigger }: MediaLibraryPickerProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<MediaLibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{
    filename: string
    usages: string[]
  } | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/media-library')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchItems()
    }
  }, [open, fetchItems])

  const handleSelect = useCallback((filename: string) => {
    onSelect(filename)
    setOpen(false)
  }, [onSelect])

  const handleDelete = useCallback(async (filename: string) => {
    setDeleting(filename)
    try {
      const res = await fetch(`/api/media-library/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })

      if (res.status === 409) {
        // In use — show confirmation
        const data = await res.json()
        setConfirmDelete({ filename, usages: data.usages || [] })
        setDeleting(null)
        return
      }

      if (res.ok) {
        setItems(prev => prev.filter(i => i.filename !== filename))
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(null)
    }
  }, [])

  const handleForceDelete = useCallback(async () => {
    if (!confirmDelete) return
    setDeleting(confirmDelete.filename)
    try {
      const res = await fetch(
        `/api/media-library/${encodeURIComponent(confirmDelete.filename)}?force=1`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setItems(prev => prev.filter(i => i.filename !== confirmDelete.filename))
      }
    } catch {
      // Silently fail
    } finally {
      setConfirmDelete(null)
      setDeleting(null)
    }
  }, [confirmDelete])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm" className="w-full">
            Browse uploads
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Uploads</DialogTitle>
        </DialogHeader>

        {/* Confirmation overlay */}
        {confirmDelete && (
          <div className="p-4 rounded-md border border-destructive bg-destructive/10 space-y-3">
            <p className="text-sm font-medium">
              This image is currently in use:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {confirmDelete.usages.map(u => (
                <li key={u}>{u}</li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Deleting will clear these settings. Continue?
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleForceDelete}
                disabled={deleting === confirmDelete.filename}
              >
                {deleting === confirmDelete.filename ? 'Deleting...' : 'Delete anyway'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No uploads yet. Images you upload as favicons, logos, or PWA icons will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {items.map((item) => (
              <div
                key={item.filename}
                className="group relative rounded-md border bg-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              >
                <button
                  type="button"
                  className="w-full aspect-square flex items-center justify-center p-2 bg-muted/30"
                  onClick={() => handleSelect(item.filename)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnailUrl}
                    alt={item.filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </button>
                <div className="px-2 py-1.5">
                  <p className="text-xs truncate text-muted-foreground" title={item.filename}>
                    {item.filename.replace(/^\d+-/, '')}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {formatSize(item.size)}
                  </p>
                </div>
                {/* Delete button on hover */}
                <button
                  type="button"
                  className="absolute top-1 right-1 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(item.filename)
                  }}
                  disabled={deleting === item.filename}
                >
                  <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
