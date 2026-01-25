'use client'

import { memo, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
  const dataMap = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(d => {
      map.set(`${d.dayOfWeek}-${d.hour}`, d.value)
    })
    return map
  }, [data])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const hasData = data.some(d => d.value > 0)

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No activity data available for this period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
        <p className="text-sm text-muted-foreground">
          Activity by hour and day of week
        </p>
      </CardHeader>
      <CardContent>
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

                      return (
                        <div
                          key={hour}
                          className={`flex-1 h-6 rounded-sm ${colorClass} transition-colors cursor-pointer hover:ring-1 hover:ring-primary group relative`}
                          title={`${day} ${formatHour(hour)}: ${value} actions`}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                            <div className="bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
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
      </CardContent>
    </Card>
  )
})
