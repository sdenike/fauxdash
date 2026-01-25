'use client'

import { useMemo, useState, memo, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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

// Simple fallback map component using CSS for basic visualization
function SimpleMap({ locations }: { locations: Location[] }) {
  const maxCount = Math.max(...locations.map(l => l.count), 1)

  return (
    <div className="relative h-[400px] w-full bg-muted/30 rounded-lg overflow-hidden">
      {/* World map background (simplified) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full opacity-20"
          fill="currentColor"
        >
          {/* Simplified world continents */}
          <ellipse cx="500" cy="250" rx="480" ry="230" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      {/* Location markers */}
      {locations.slice(0, 50).map((loc, index) => {
        // Convert lat/lng to simple x/y positioning
        const x = ((loc.lng + 180) / 360) * 100
        const y = ((90 - loc.lat) / 180) * 100
        const size = Math.max(8, Math.min(30, 8 + Math.log10(loc.count) * 8))
        const opacity = 0.3 + (loc.count / maxCount) * 0.7

        return (
          <div
            key={index}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
          >
            <div
              className="rounded-full bg-primary transition-transform hover:scale-110"
              style={{
                width: size,
                height: size,
                opacity,
              }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                <div className="font-medium">{loc.name || loc.code}</div>
                <div className="text-muted-foreground">{loc.count.toLocaleString()} visits</div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-xs">
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
        <SimpleMap locations={locations} />
        {/* Location list below map */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
          {locations.slice(0, 12).map((loc, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted cursor-pointer"
              onClick={() => onCountryClick?.(loc.code || '')}
            >
              <div
                className="w-2 h-2 rounded-full bg-primary"
                style={{ opacity: 0.3 + (loc.count / Math.max(...locations.map(l => l.count))) * 0.7 }}
              />
              <span className="truncate flex-1">{loc.name || loc.code}</span>
              <span className="text-muted-foreground">{loc.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
