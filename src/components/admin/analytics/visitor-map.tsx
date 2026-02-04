'use client'

import { useState, memo, useCallback, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PlusIcon, MinusIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'

interface Location {
  name: string
  country?: string
  code?: string
  count: number
  lat: number
  lng: number
}

interface VisitorMapProps {
  locations: Location[]
  isLoading?: boolean
  onCountryClick?: (countryCode: string) => void
}

// Convert lat/lng to tile coordinates at a given zoom level
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n)
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) }
}

// Convert lat/lng to pixel position within the map viewport
function latLngToPixel(lat: number, lng: number, zoom: number, centerLat: number, centerLng: number, mapWidth: number, mapHeight: number) {
  const scale = Math.pow(2, zoom) * 256

  // Convert center to world coordinates
  const centerX = ((centerLng + 180) / 360) * scale
  const centerLatRad = (centerLat * Math.PI) / 180
  const centerY = (1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2 * scale

  // Convert point to world coordinates
  const pointX = ((lng + 180) / 360) * scale
  const latRad = (lat * Math.PI) / 180
  const pointY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * scale

  // Calculate relative position from center
  const x = (pointX - centerX) + mapWidth / 2
  const y = (pointY - centerY) + mapHeight / 2

  return { x, y }
}

// Convert country code to flag emoji
function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍'

  // Convert country code to regional indicator symbols
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 0x1F1E6 + char.charCodeAt(0) - 65)

  return String.fromCodePoint(...codePoints)
}

// Map component with zoom controls
function ZoomableMap({ locations }: { locations: Location[] }) {
  const [zoom, setZoom] = useState(2)
  const [center, setCenter] = useState({ lat: 30, lng: 0 }) // Default center
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const mapRef = useRef<HTMLDivElement>(null)

  const mapWidth = 800
  const mapHeight = 400
  const tileSize = 256

  const maxCount = Math.max(...locations.map(l => l.count), 1)

  // Calculate the center based on locations if we have any
  useEffect(() => {
    if (locations.length > 0) {
      const avgLat = locations.reduce((sum, l) => sum + l.lat, 0) / locations.length
      const avgLng = locations.reduce((sum, l) => sum + l.lng, 0) / locations.length
      setCenter({ lat: avgLat, lng: avgLng })
    }
  }, [locations])

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(16, z + 1))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(1, z - 1))
  }, [])

  const handleReset = useCallback(() => {
    setZoom(2)
    if (locations.length > 0) {
      const avgLat = locations.reduce((sum, l) => sum + l.lat, 0) / locations.length
      const avgLng = locations.reduce((sum, l) => sum + l.lng, 0) / locations.length
      setCenter({ lat: avgLat, lng: avgLng })
    } else {
      setCenter({ lat: 30, lng: 0 })
    }
  }, [locations])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    // Convert pixel movement to lat/lng
    const scale = Math.pow(2, zoom) * 256
    const lngPerPixel = 360 / scale
    const latPerPixel = 180 / scale // Approximation

    setCenter(prev => ({
      lat: Math.max(-85, Math.min(85, prev.lat + dy * latPerPixel)),
      lng: prev.lng - dx * lngPerPixel
    }))

    setDragStart({ x: e.clientX, y: e.clientY })
  }, [isDragging, dragStart, zoom])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Generate tile URLs for the current view
  const tiles = []
  const numTiles = Math.pow(2, zoom)
  const centerTile = latLngToTile(center.lat, center.lng, zoom)

  // Calculate how many tiles we need to cover the viewport
  const tilesNeededX = Math.ceil(mapWidth / tileSize) + 2
  const tilesNeededY = Math.ceil(mapHeight / tileSize) + 2

  for (let dx = -Math.floor(tilesNeededX / 2); dx <= Math.floor(tilesNeededX / 2); dx++) {
    for (let dy = -Math.floor(tilesNeededY / 2); dy <= Math.floor(tilesNeededY / 2); dy++) {
      let tileX = centerTile.x + dx
      let tileY = centerTile.y + dy

      // Wrap tile X around the world
      while (tileX < 0) tileX += numTiles
      while (tileX >= numTiles) tileX -= numTiles

      // Skip if Y is out of bounds
      if (tileY < 0 || tileY >= numTiles) continue

      // Calculate tile position relative to center
      const scale = Math.pow(2, zoom) * tileSize
      const centerWorldX = ((center.lng + 180) / 360) * scale
      const centerLatRad = (center.lat * Math.PI) / 180
      const centerWorldY = (1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2 * scale

      const tileWorldX = (centerTile.x + dx) * tileSize
      const tileWorldY = (centerTile.y + dy) * tileSize

      const left = tileWorldX - centerWorldX + mapWidth / 2
      const top = tileWorldY - centerWorldY + mapHeight / 2

      tiles.push({
        key: `${zoom}-${tileX}-${tileY}-${dx}-${dy}`,
        url: `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`,
        left,
        top
      })
    }
  }

  return (
    <div className="relative h-[400px] w-full bg-muted/30 rounded-lg overflow-hidden">
      {/* Map container with drag support */}
      <div
        ref={mapRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Map tiles */}
        {tiles.map(tile => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            className="absolute opacity-60 pointer-events-none"
            style={{
              left: tile.left,
              top: tile.top,
              width: tileSize,
              height: tileSize
            }}
            draggable={false}
          />
        ))}

        {/* Location markers */}
        {locations.slice(0, 50).map((loc, index) => {
          const pos = latLngToPixel(loc.lat, loc.lng, zoom, center.lat, center.lng, mapWidth, mapHeight)
          const size = Math.max(8, Math.min(30, 8 + Math.log10(loc.count) * 8))
          const opacity = 0.3 + (loc.count / maxCount) * 0.7

          // Only render if within viewport
          if (pos.x < -50 || pos.x > mapWidth + 50 || pos.y < -50 || pos.y > mapHeight + 50) {
            return null
          }

          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer pointer-events-auto"
              style={{
                left: pos.x,
                top: pos.y,
                zIndex: 10
              }}
            >
              <div
                className="rounded-full bg-primary transition-transform hover:scale-125 shadow-lg"
                style={{
                  width: size,
                  height: size,
                  opacity,
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                <div className="bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                  <div className="font-medium flex items-center gap-1.5">
                    <span className="text-base">{getCountryFlag(loc.code || loc.country)}</span>
                    <span>{loc.name || loc.code}</span>
                  </div>
                  <div className="text-muted-foreground">{loc.count.toLocaleString()} visits</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 z-20">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 shadow-md"
          onClick={handleZoomIn}
          title="Zoom in"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 shadow-md"
          onClick={handleZoomOut}
          title="Zoom out"
        >
          <MinusIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 shadow-md"
          onClick={handleReset}
          title="Reset view"
        >
          <ArrowsPointingOutIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs z-20">
        Zoom: {zoom}x
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-xs z-20">
        <div className="font-medium mb-2">Visitors by Location</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary opacity-30" />
          <span>Low</span>
          <div className="w-3 h-3 rounded-full bg-primary opacity-70" />
          <span>Medium</span>
          <div className="w-4 h-4 rounded-full bg-primary" />
          <span>High</span>
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 left-1 text-[10px] text-muted-foreground/50 z-20">
        Map data &copy; OpenStreetMap contributors
      </div>
    </div>
  )
}

export const VisitorMap = memo(function VisitorMap({
  locations,
  isLoading,
  onCountryClick,
}: VisitorMapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!locations.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitor Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No geographic data available yet. Visitor locations will appear here once pageviews are recorded with GeoIP enabled.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitor Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <ZoomableMap locations={locations} />
        {/* Location list below map */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
          {locations.slice(0, 12).map((loc, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted cursor-pointer"
              onClick={() => onCountryClick?.(loc.code || '')}
            >
              <div
                className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                style={{ opacity: 0.3 + (loc.count / Math.max(...locations.map(l => l.count))) * 0.7 }}
              />
              <span className="text-sm flex-shrink-0">{getCountryFlag(loc.code || loc.country)}</span>
              <span className="truncate flex-1">{loc.name || loc.code}</span>
              <span className="text-muted-foreground flex-shrink-0">{loc.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
