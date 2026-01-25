'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpIcon, ArrowDownIcon, GlobeAltIcon, EyeIcon, CursorArrowRaysIcon, UsersIcon } from '@heroicons/react/24/outline'

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
  const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <span className={`flex items-center gap-1 text-sm ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(trend)}%
    </span>
  )
}

function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  subtitle,
  isLoading,
}: {
  title: string
  value?: number | string
  trend?: number
  icon: React.ComponentType<{ className?: string }>
  subtitle?: string
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        {trend !== undefined ? (
          <TrendIndicator trend={trend} />
        ) : subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Pageviews"
        value={data?.pageviews.value}
        trend={data?.pageviews.trend}
        icon={EyeIcon}
        isLoading={isLoading}
      />
      <StatCard
        title="Unique Visitors"
        value={data?.uniqueVisitors.value}
        trend={data?.uniqueVisitors.trend}
        icon={UsersIcon}
        isLoading={isLoading}
      />
      <StatCard
        title="Total Clicks"
        value={data?.totalClicks.value}
        trend={data?.totalClicks.trend}
        icon={CursorArrowRaysIcon}
        isLoading={isLoading}
      />
      <StatCard
        title="Top Country"
        value={data?.topCountry.name || 'Unknown'}
        subtitle={data?.topCountry.count ? `${formatNumber(data.topCountry.count)} visits` : undefined}
        icon={GlobeAltIcon}
        isLoading={isLoading}
      />
    </div>
  )
}
