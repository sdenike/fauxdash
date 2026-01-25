'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatsCards } from '@/components/admin/analytics/stats-cards'
import { ClicksChart } from '@/components/admin/analytics/clicks-chart'
import { VisitorMap } from '@/components/admin/analytics/visitor-map'
import { TopItemsTable } from '@/components/admin/analytics/top-items-table'
import { ActivityHeatmap } from '@/components/admin/analytics/activity-heatmap'
import { TimeFilter, Period, DataType } from '@/components/admin/analytics/time-filter'
import { ChartBarIcon } from '@heroicons/react/24/outline'

interface StatsData {
  pageviews: { value: number; trend: number }
  uniqueVisitors: { value: number; trend: number }
  totalClicks: { value: number; trend: number }
  topCountry: { name: string; count: number }
}

interface ClicksData {
  labels: string[]
  datasets: { label: string; data: number[] }[]
}

interface GeoData {
  locations: { name: string; code?: string; count: number; lat: number; lng: number }[]
  total: number
}

interface TopItemsData {
  items: { id: number; name: string; clicks: number; trend: number }[]
}

interface HeatmapData {
  data: { hour: number; dayOfWeek: number; value: number }[]
  maxValue: number
}

export default function AnalyticsPage() {
  // Filter state
  const [period, setPeriod] = useState<Period>('week')
  const [dataType, setDataType] = useState<DataType>('all')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  // Data state
  const [stats, setStats] = useState<StatsData | null>(null)
  const [clicks, setClicks] = useState<ClicksData | null>(null)
  const [geo, setGeo] = useState<GeoData | null>(null)
  const [topBookmarks, setTopBookmarks] = useState<TopItemsData | null>(null)
  const [topServices, setTopServices] = useState<TopItemsData | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)

  // Loading state
  const [loading, setLoading] = useState({
    stats: true,
    clicks: true,
    geo: true,
    topBookmarks: true,
    topServices: true,
    heatmap: true,
  })

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }))
    try {
      const res = await fetch(`/api/analytics/stats?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }, [period])

  // Fetch clicks
  const fetchClicks = useCallback(async () => {
    setLoading(prev => ({ ...prev, clicks: true }))
    try {
      const res = await fetch(`/api/analytics/clicks?period=${period}&type=${dataType}`)
      if (res.ok) {
        const data = await res.json()
        setClicks(data)
      }
    } catch (error) {
      console.error('Failed to fetch clicks:', error)
    } finally {
      setLoading(prev => ({ ...prev, clicks: false }))
    }
  }, [period, dataType])

  // Fetch geo
  const fetchGeo = useCallback(async () => {
    setLoading(prev => ({ ...prev, geo: true }))
    try {
      const res = await fetch(`/api/analytics/geo?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setGeo(data)
      }
    } catch (error) {
      console.error('Failed to fetch geo:', error)
    } finally {
      setLoading(prev => ({ ...prev, geo: false }))
    }
  }, [period])

  // Fetch top items
  const fetchTopItems = useCallback(async () => {
    setLoading(prev => ({ ...prev, topBookmarks: true, topServices: true }))
    try {
      const [bookmarksRes, servicesRes] = await Promise.all([
        fetch(`/api/analytics/top-items?type=bookmarks&period=${period}`),
        fetch(`/api/analytics/top-items?type=services&period=${period}`),
      ])

      if (bookmarksRes.ok) {
        const data = await bookmarksRes.json()
        setTopBookmarks(data)
      }
      if (servicesRes.ok) {
        const data = await servicesRes.json()
        setTopServices(data)
      }
    } catch (error) {
      console.error('Failed to fetch top items:', error)
    } finally {
      setLoading(prev => ({ ...prev, topBookmarks: false, topServices: false }))
    }
  }, [period])

  // Fetch heatmap
  const fetchHeatmap = useCallback(async () => {
    setLoading(prev => ({ ...prev, heatmap: true }))
    try {
      const heatmapPeriod = period === 'day' ? 'week' : period
      const res = await fetch(`/api/analytics/heatmap?period=${heatmapPeriod}&type=${dataType}`)
      if (res.ok) {
        const data = await res.json()
        setHeatmap(data)
      }
    } catch (error) {
      console.error('Failed to fetch heatmap:', error)
    } finally {
      setLoading(prev => ({ ...prev, heatmap: false }))
    }
  }, [period, dataType])

  // Fetch all data when filters change
  useEffect(() => {
    fetchStats()
    fetchClicks()
    fetchGeo()
    fetchTopItems()
    fetchHeatmap()
  }, [fetchStats, fetchClicks, fetchGeo, fetchTopItems, fetchHeatmap])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6" />
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your dashboard performance and visitor insights
          </p>
        </div>
        <TimeFilter
          period={period}
          onPeriodChange={setPeriod}
          dataType={dataType}
          onDataTypeChange={setDataType}
        />
      </div>

      {/* Stats cards */}
      <StatsCards data={stats} isLoading={loading.stats} />

      {/* Clicks chart */}
      <ClicksChart
        labels={clicks?.labels || []}
        datasets={clicks?.datasets || []}
        chartType={chartType}
        onChartTypeChange={setChartType}
        isLoading={loading.clicks}
      />

      {/* Two column layout for map and top items */}
      <div className="grid gap-6 lg:grid-cols-2">
        <VisitorMap
          locations={geo?.locations || []}
          isLoading={loading.geo}
        />
        <div className="space-y-6">
          {(dataType === 'all' || dataType === 'bookmarks') && (
            <TopItemsTable
              items={topBookmarks?.items || []}
              type="bookmarks"
              isLoading={loading.topBookmarks}
            />
          )}
          {(dataType === 'all' || dataType === 'services') && (
            <TopItemsTable
              items={topServices?.items || []}
              type="services"
              isLoading={loading.topServices}
            />
          )}
        </div>
      </div>

      {/* Heatmap */}
      <ActivityHeatmap
        data={heatmap?.data || []}
        maxValue={heatmap?.maxValue || 1}
        isLoading={loading.heatmap}
      />
    </div>
  )
}
