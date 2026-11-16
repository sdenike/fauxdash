'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Weather {
  location: string
  temperature: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
}

interface CompactWeatherProps {
  displayMode: 'icon' | 'temp' | 'both'
  showPopup: boolean
  locations: string[]
}

/**
 * Header weather. Readings come from outside services, so they load after the page; the slot keeps its
 * width meanwhile so nothing beside it moves. Details open on hover, focus or tap.
 */
export function CompactWeather({ displayMode, showPopup, locations }: CompactWeatherProps) {
  const [data, setData] = useState<Weather[] | null>(null)
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)

  // Touch screens open the details with a tap; a tap anywhere else closes them.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  useEffect(() => {
    if (locations.length === 0) return
    let cancelled = false
    Promise.all(
      locations.map((location) =>
        fetch(`/api/weather?location=${encodeURIComponent(location)}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
      ),
    ).then((results) => {
      if (!cancelled) setData(results.filter((r) => r && !r.error))
    })
    return () => {
      cancelled = true
    }
  }, [locations])

  if (locations.length === 0 || (data && data.length === 0)) return null

  const weather = data?.[index]
  const showIcon = displayMode !== 'temp'
  const showTemp = displayMode !== 'icon'

  if (!weather) {
    // Placeholder the size of the loaded reading.
    return <div className="h-7 w-14 rounded-md bg-muted/60" aria-hidden="true" />
  }

  const step = (delta: number) => setIndex((i) => (i + delta + data!.length) % data!.length)

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return
        setOpen(false)
        setIndex(0)
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={showPopup ? open : undefined}
        aria-label={`${weather.location}: ${Math.round(weather.temperature)}°, ${weather.condition}`}
        className="flex h-9 coarse:h-11 items-center gap-1.5 rounded-md px-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {showIcon && weather.icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={weather.icon} alt="" className="h-6 w-6" />
        )}
        {showTemp && <span className="tabular font-medium">{Math.round(weather.temperature)}°</span>}
      </button>

      {showPopup && open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-[0_8px_24px_-6px_rgb(0_0_0/0.18)]">
          {data!.length > 1 && (
            <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
              <button type="button" onClick={() => step(-1)} className="rounded p-1 coarse:p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Previous location">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="tabular text-xs text-muted-foreground">
                {index + 1} of {data!.length}
              </span>
              <button type="button" onClick={() => step(1)} className="rounded p-1 coarse:p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Next location">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            {weather.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={weather.icon} alt="" className="h-10 w-10" />
            )}
            <div>
              <div className="tabular text-lg font-semibold">{Math.round(weather.temperature)}°F</div>
              <div className="text-xs text-muted-foreground">{weather.condition}</div>
            </div>
          </div>
          <div className="mt-2 text-sm font-medium">{weather.location}</div>
          <dl className="tabular mt-1 grid grid-cols-[auto_1fr] gap-x-2 text-xs">
            <dt className="text-muted-foreground">Humidity</dt>
            <dd>{weather.humidity}%</dd>
            <dt className="text-muted-foreground">Wind</dt>
            <dd>{Math.round(weather.windSpeed)} mph</dd>
          </dl>
        </div>
      )}
    </div>
  )
}
