'use client'

import { memo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/outline'

interface TopItem {
  id: number
  name: string
  clicks: number
  trend: number
}

interface TopItemsTableProps {
  items: TopItem[]
  type: 'bookmarks' | 'services'
  isLoading?: boolean
}

function TrendBadge({ trend }: { trend: number }) {
  if (trend === 0) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-xs">
        <MinusIcon className="h-3 w-3" />
        0%
      </span>
    )
  }

  const isPositive = trend > 0
  const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon
  const bgClass = isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'

  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${bgClass}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(trend)}%
    </span>
  )
}

export const TopItemsTable = memo(function TopItemsTable({
  items,
  type,
  isLoading,
}: TopItemsTableProps) {
  const title = type === 'bookmarks' ? 'Top Bookmarks' : 'Top Services'

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No clicks recorded this period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-2 rounded hover:bg-muted transition-colors"
            >
              {/* Rank */}
              <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                {index + 1}
              </span>

              {/* Name */}
              <span className="flex-1 font-medium truncate">{item.name}</span>

              {/* Clicks */}
              <span className="text-sm text-muted-foreground tabular-nums">
                {item.clicks.toLocaleString()} clicks
              </span>

              {/* Trend */}
              <TrendBadge trend={item.trend} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
