'use client'

import { memo, useMemo, useState } from 'react'
import { AdminSection } from '@/components/admin/admin-page'
import { Skeleton } from '@/components/ui/skeleton'

interface HeatmapData {
  hour: number
  dayOfWeek: number
  value: number
}

interface ActivityHeatmapProps {
  data: HeatmapData[]
  maxValue: number
  isLoading?: boolean
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getColorIntensity(value: number, maxValue: number): string {
  if (value === 0) return 'bg-muted'

  const intensity = value / maxValue
  if (intensity < 0.25) return 'bg-primary/20'
  if (intensity < 0.5) return 'bg-primary/40'
  if (intensity < 0.75) return 'bg-primary/60'
  return 'bg-primary/90'
}

function formatHour(hour: number): string {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  if (hour < 12) return `${hour}am`
  return `${hour - 12}pm`
}

export const ActivityHeatmap = memo(function ActivityHeatmap({
  data,
  maxValue,
  isLoading,
}: ActivityHeatmapProps) {
  // Create a map for quick lookup
  // Touch screens have no hover, so a tap pins a cell's tooltip.
  const [picked, setPicked] = useState<string | null>(null)
  const dataMap = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(d => {
      map.set(`${d.dayOfWeek}-${d.hour}`, d.value)
    })
    return map
  }, [data])

  if (isLoading) {
    return (
      <AdminSection>
        <Skeleton className="h-6 w-32" />
          <Skeleton className="h-[200px] w-full" />
        </AdminSection>
    )
  }

  const hasData = data.some(d => d.value > 0)

  if (!hasData) {
    return (
      <AdminSection title="Activity heatmap">
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No activity recorded for this period
          </div>
        </AdminSection>
    )
  }

  return (
    <AdminSection title="Activity heatmap" description="Activity by hour and day of week">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex mb-1 ml-12">
              {HOURS.filter((_, i) => i % 3 === 0).map(hour => (
                <div
                  key={hour}
                  className="text-xs text-muted-foreground"
                  style={{ width: `${(100 / 8)}%` }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="space-y-1">
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center gap-2">
                  {/* Day label */}
                  <div className="w-10 text-xs text-muted-foreground text-right">
                    {day}
                  </div>

                  {/* Hour cells */}
                  <div className="flex-1 flex gap-0.5">
                    {HOURS.map(hour => {
                      const value = dataMap.get(`${dayIndex}-${hour}`) || 0
                      const colorClass = getColorIntensity(value, maxValue)
                      const key = `${dayIndex}-${hour}`

                      return (
                        <div
                          key={hour}
                          className={`flex-1 h-6 coarse:h-8 rounded-sm ${colorClass} transition-colors cursor-pointer hover:ring-1 hover:ring-primary group relative ${picked === key ? 'ring-1 ring-primary' : ''}`}
                          title={`${day} ${formatHour(hour)}: ${value} actions`}
                          onClick={() => setPicked(picked === key ? null : key)}
                        >
                          {/* Tooltip */}
                          <div className={`absolute ${hour < 2 ? 'left-0' : hour > 21 ? 'right-0' : 'left-1/2 -translate-x-1/2'} group-hover:block z-10 pointer-events-none ${dayIndex < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} ${picked === key ? 'block' : 'hidden'}`}>
                            <div className="bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap shadow-sm">
                              <div className="font-medium">{day} {formatHour(hour)}</div>
                              <div className="text-muted-foreground">{value.toLocaleString()} actions</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-4 rounded-sm bg-muted" />
                <div className="w-4 h-4 rounded-sm bg-primary/20" />
                <div className="w-4 h-4 rounded-sm bg-primary/40" />
                <div className="w-4 h-4 rounded-sm bg-primary/60" />
                <div className="w-4 h-4 rounded-sm bg-primary/90" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </AdminSection>
  )
})
