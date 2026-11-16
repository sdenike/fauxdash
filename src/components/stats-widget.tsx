'use client'

import { useEffect, useState } from 'react'
import { AdminLoading, AdminSection } from '@/components/admin/admin-page'
import Link from 'next/link'

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

const PERIODS: { key: keyof PeriodStats; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'last24h', label: '24 hours' },
  { key: 'lastWeek', label: '7 days' },
  { key: 'lastMonth', label: '30 days' },
]

/** Traffic summary for the admin dashboard: one table instead of twelve cards. */
export function StatsWidget() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setStats)
      .catch(() => setFailed(true))
  }, [])

  const rows: { label: string; data?: PeriodStats }[] = [
    { label: 'Start page views', data: stats?.pageviews },
    { label: 'Bookmark clicks', data: stats?.bookmarkClicks },
    { label: 'Service clicks', data: stats?.serviceClicks },
  ]

  return (
    <AdminSection
      title="Traffic"
      actions={
        <Link href="/admin/analytics" className="link text-sm">
          Open analytics
        </Link>
      }
    >
      {failed ? (
        <p className="text-sm text-muted-foreground">Traffic numbers are unavailable. Check Admin, Logs.</p>
      ) : !stats ? (
        <AdminLoading rows={3} label="Loading traffic" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="px-4 py-2 font-medium">
                  <span className="sr-only">Metric</span>
                </th>
                {PERIODS.map((p) => (
                  <th key={p.key} scope="col" className="px-4 py-2 text-right font-medium">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular">
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium text-foreground">
                    {r.label}
                  </th>
                  {PERIODS.map((p) => (
                    <td key={p.key} className="px-4 py-2.5 text-right text-foreground">
                      {(r.data?.[p.key] ?? 0).toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminSection>
  )
}
