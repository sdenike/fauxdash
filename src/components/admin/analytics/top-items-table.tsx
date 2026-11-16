'use client'

import { memo } from 'react'
import { AdminSection } from '@/components/admin/admin-page'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

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
        <Minus aria-hidden="true" className="h-3 w-3" />
        0%
      </span>
    )
  }

  const isPositive = trend > 0
  const Icon = isPositive ? ArrowUp : ArrowDown
  const bgClass = isPositive ? 'bg-success-soft text-success border border-success/30' : 'bg-destructive-soft text-destructive border border-destructive/30'

  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${bgClass}`}>
      <Icon aria-hidden="true" className="h-3 w-3" />
      {Math.abs(trend)}%
    </span>
  )
}

export const TopItemsTable = memo(function TopItemsTable({
  items,
  type,
  isLoading,
}: TopItemsTableProps) {
  const title = type === 'bookmarks' ? 'Top bookmarks' : 'Top services'

  if (isLoading) {
    return (
      <AdminSection>
        <Skeleton className="h-6 w-32" />
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
        </AdminSection>
    )
  }

  if (!items.length) {
    return (
      <AdminSection title={title}>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No clicks recorded this period
          </div>
        </AdminSection>
    )
  }

  return (
    <AdminSection title={title}>
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
      </AdminSection>
  )
})
