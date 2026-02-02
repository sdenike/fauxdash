'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  PlusIcon,
  TrashIcon,
  Bars3Icon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface WeatherLocationManagerProps {
  locations: string[]
  onChange: (locations: string[]) => void
}

export function WeatherLocationManager({ locations, onChange }: WeatherLocationManagerProps) {
  const [newLocation, setNewLocation] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleAddLocation = useCallback(() => {
    const trimmed = newLocation.trim()
    if (trimmed && !locations.includes(trimmed)) {
      onChange([...locations, trimmed])
      setNewLocation('')
    }
  }, [newLocation, locations, onChange])

  const handleRemoveLocation = useCallback((index: number) => {
    const newLocations = locations.filter((_, i) => i !== index)
    onChange(newLocations)
  }, [locations, onChange])

  const handleSetDefault = useCallback((index: number) => {
    if (index === 0) return
    const newLocations = [...locations]
    const [removed] = newLocations.splice(index, 1)
    newLocations.unshift(removed)
    onChange(newLocations)
  }, [locations, onChange])

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = draggedIndex
    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newLocations = [...locations]
    const [removed] = newLocations.splice(dragIndex, 1)
    newLocations.splice(dropIndex, 0, removed)
    onChange(newLocations)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [draggedIndex, locations, onChange])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddLocation()
    }
  }, [handleAddLocation])

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="addLocation">Add Location</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="addLocation"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ZIP code or city name"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddLocation}
            disabled={!newLocation.trim()}
            size="icon"
            variant="outline"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Enter a ZIP code (e.g., 90210) or city name (e.g., New York)
        </p>
      </div>

      {locations.length > 0 && (
        <div className="space-y-1">
          <Label>Locations</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Drag to reorder. First location is the default.
          </p>
          <div className="space-y-2">
            {locations.map((location, index) => (
              <div
                key={`${location}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-2 p-2 rounded-md border bg-card
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  ${dragOverIndex === index ? 'border-primary border-2' : 'border-border'}
                  transition-colors cursor-move
                `}
              >
                <Bars3Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-sm truncate">{location}</span>
                {index === 0 ? (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <StarIconSolid className="h-4 w-4" />
                    Default
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(index)}
                    className="h-7 px-2 text-xs"
                    title="Set as default"
                  >
                    <StarIcon className="h-3 w-3 mr-1" />
                    Set Default
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLocation(index)}
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {locations.length === 0 && (
        <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">
          <p className="text-sm">No locations added yet</p>
          <p className="text-xs mt-1">Add a location above to get started</p>
        </div>
      )}
    </div>
  )
}
