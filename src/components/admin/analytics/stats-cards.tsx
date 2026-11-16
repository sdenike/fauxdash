'use client'

import { AdminSection } from '@/components/admin/admin-page'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUp, ArrowDown } from 'lucide-react'

interface StatsData {
  pageviews: { value: number; trend: number }
  uniqueVisitors: { value: number; trend: number }
  totalClicks: { value: number; trend: number }
  topCountry: { name: string; count: number }
}

interface StatsCardsProps {
  data: StatsData | null
  isLoading?: boolean
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

function TrendIndicator({ trend }: { trend: number }) {
  if (trend === 0) {
    return <span className="text-muted-foreground text-sm">No change</span>
  }

  const isPositive = trend > 0
  const Icon = isPositive ? ArrowUp : ArrowDown
  const colorClass = isPositive ? 'text-success' : 'text-destructive'

  return (
    <span className={`flex items-center gap-1 text-sm ${colorClass}`}>
      <Icon aria-hidden="true" className="h-3 w-3" />
      {Math.abs(trend)}%
    </span>
  )
}

function StatCard({
  title,
  value,
  trend,
  subtitle,
  isLoading,
}: {
  title: string
  value?: number | string
  trend?: number
  subtitle?: string
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-1 h-8 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="truncate text-2xl font-semibold tabular-nums text-foreground">
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      {trend !== undefined ? (
        <TrendIndicator trend={trend} />
      ) : subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  )
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  return (
    <AdminSection>
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      <StatCard
        title="Total pageviews"
        value={data?.pageviews.value}
        trend={data?.pageviews.trend}
        isLoading={isLoading}
      />
      <StatCard
        title="Unique visitors"
        value={data?.uniqueVisitors.value}
        trend={data?.uniqueVisitors.trend}
        isLoading={isLoading}
      />
      <StatCard
        title="Total clicks"
        value={data?.totalClicks.value}
        trend={data?.totalClicks.trend}
        isLoading={isLoading}
      />
      <StatCard
        title="Top country"
        value={data?.topCountry.name || 'Unknown'}
        subtitle={data?.topCountry.count ? `${formatNumber(data.topCountry.count)} visits` : undefined}
        isLoading={isLoading}
      />
    </div>
    </AdminSection>
  )
}
