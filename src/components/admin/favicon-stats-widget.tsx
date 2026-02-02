'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PhotoIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface FaviconStats {
  totalFiles: number
  totalSize: number
  totalSizeFormatted: string
  originalCount: number
  originalSize: number
  modifiedCount: number
  modifiedSize: number
  breakdown: {
    type: string
    count: number
    size: number
    sizeFormatted: string
  }[]
  recentFiles: {
    name: string
    size: number
    modified: string
  }[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function FaviconStatsWidget() {
  const [stats, setStats] = useState<FaviconStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics/favicon-stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch favicon stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhotoIcon className="h-5 w-5" />
            Favicon Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.totalFiles === 0) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhotoIcon className="h-5 w-5" />
            Favicon Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No favicons stored yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PhotoIcon className="h-5 w-5" />
          Favicon Storage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{stats.totalFiles}</p>
            <p className="text-xs text-muted-foreground">Total Files</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{stats.totalSizeFormatted}</p>
            <p className="text-xs text-muted-foreground">Total Size</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center justify-center gap-1">
              <ArrowDownTrayIcon className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.originalCount}</p>
            </div>
            <p className="text-xs text-muted-foreground">Downloaded</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
            <div className="flex items-center justify-center gap-1">
              <SparklesIcon className="h-4 w-4 text-purple-500" />
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.modifiedCount}</p>
            </div>
            <p className="text-xs text-muted-foreground">Modified</p>
          </div>
        </div>

        {/* Breakdown */}
        {stats.breakdown.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Breakdown</h4>
            <div className="space-y-2">
              {stats.breakdown.map((item) => (
                <div key={item.type} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.type}</span>
                  <span className="font-medium">
                    {item.count} files ({item.sizeFormatted})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
