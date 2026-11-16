'use client'

import { useEffect, useState } from 'react'
import { AdminLoading, AdminSection } from '@/components/admin/admin-page'

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

export function FaviconStatsWidget() {
  const [stats, setStats] = useState<FaviconStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/favicon-stats')
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminSection title="Favicon storage">
      {loading ? (
        <AdminLoading rows={2} label="Loading favicon storage" />
      ) : !stats || stats.totalFiles === 0 ? (
        <p className="text-sm text-muted-foreground">No favicons stored yet. They are saved when you add a link with a favicon.</p>
      ) : (
        <div className="space-y-4">
          <dl className="tabular grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {[
              { label: 'Files', value: stats.totalFiles.toLocaleString() },
              { label: 'Size on disk', value: stats.totalSizeFormatted },
              { label: 'Downloaded', value: stats.originalCount.toLocaleString() },
              { label: 'Converted', value: stats.modifiedCount.toLocaleString() },
            ].map((d) => (
              <div key={d.label}>
                <dt className="text-xs text-muted-foreground">{d.label}</dt>
                <dd className="mt-0.5 text-lg font-semibold text-foreground">{d.value}</dd>
              </div>
            ))}
          </dl>
          {stats.breakdown.length > 0 && (
            <ul className="tabular divide-y divide-border rounded-lg border border-border text-sm">
              {stats.breakdown.map((item) => (
                <li key={item.type} className="flex items-center justify-between px-4 py-2">
                  <span className="text-muted-foreground">{item.type}</span>
                  <span className="text-foreground">
                    {item.count.toLocaleString()} files, {item.sizeFormatted}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AdminSection>
  )
}
