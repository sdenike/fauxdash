'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { EyeIcon, ClockIcon, CalendarIcon, BookmarkIcon, ServerIcon } from '@heroicons/react/24/outline'

interface PeriodStats {
  today: number
  last24h: number
  lastWeek: number
  lastMonth: number
}

interface Stats {
  pageviews: PeriodStats
  bookmarkClicks: PeriodStats
  serviceClicks: PeriodStats
}

export function StatsWidget() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session && (session.user as any)?.isAdmin) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [session])

  // Only show to admins
  if (!session || !(session.user as any)?.isAdmin || !stats) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse text-muted-foreground">Loading statistics...</div>
        </CardContent>
      </Card>
    )
  }

  const renderStatCards = (title: string, icon: any, data: PeriodStats, description: string) => {
    const Icon = icon
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.today.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Since midnight</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Last 24 Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.last24h.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Rolling 24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.lastWeek.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Past 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.lastMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Past 30 days</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 mb-6">
      {renderStatCards('Pageviews', EyeIcon, stats.pageviews, 'Homepage visits')}
      {renderStatCards('Bookmark Clicks', BookmarkIcon, stats.bookmarkClicks, 'Bookmark link clicks')}
      {renderStatCards('Service Clicks', ServerIcon, stats.serviceClicks, 'Service link clicks')}
    </div>
  )
}
