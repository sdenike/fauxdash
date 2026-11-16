import Link from 'next/link'
import { getSession, loadBookmarkCategories, loadServiceCategories } from '@/lib/server/start-page'
import { AdminPage, AdminSection } from '@/components/admin/admin-page'
import { StatsWidget } from '@/components/stats-widget'
import { FaviconStatsWidget } from '@/components/admin/favicon-stats-widget'
import { DashboardVersion } from '@/components/admin/dashboard-version'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const session = await getSession()
  const [bookmarkGroups, serviceGroups] = await Promise.all([
    loadBookmarkCategories(session),
    loadServiceCategories(session),
  ])

  const counts = [
    { label: 'Bookmark categories', value: bookmarkGroups.length },
    { label: 'Bookmarks', value: bookmarkGroups.reduce((n: number, g: any) => n + (g.bookmarks?.length || 0), 0) },
    { label: 'Service categories', value: serviceGroups.length },
    { label: 'Services', value: serviceGroups.reduce((n: number, g: any) => n + (g.services?.length || 0), 0) },
  ]

  return (
    <AdminPage title="Dashboard" actions={<DashboardVersion />}>
      <AdminSection
        title="Content"
        actions={
          <Link href="/admin/content" className="link text-sm">
            Manage content
          </Link>
        }
      >
        <dl className="grid grid-cols-2 divide-border overflow-hidden rounded-lg border border-border lg:grid-cols-4 lg:divide-x [&>div:nth-child(-n+2)]:border-b [&>div:nth-child(-n+2)]:border-border lg:[&>div:nth-child(-n+2)]:border-b-0 [&>div:nth-child(odd)]:border-r [&>div:nth-child(odd)]:border-border lg:[&>div:nth-child(odd)]:border-r-0">
          {counts.map((c) => (
            <div key={c.label} className="px-4 py-3">
              <dt className="text-xs text-muted-foreground">{c.label}</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-foreground">{c.value}</dd>
            </div>
          ))}
        </dl>
      </AdminSection>

      <StatsWidget />

      <FaviconStatsWidget />
    </AdminPage>
  )
}
