'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BookmarkIcon, FolderIcon, ServerIcon } from '@heroicons/react/24/outline'
import { StatsWidget } from '@/components/stats-widget'
import { FaviconStatsWidget } from '@/components/admin/favicon-stats-widget'
import { ChangelogDialog } from '@/components/changelog-dialog'
import { UpdateChecker } from '@/components/admin/update-checker'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    categories: 0,
    bookmarks: 0,
    serviceCategories: 0,
    services: 0,
  })
  const [changelogOpen, setChangelogOpen] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [categoriesRes, serviceCategoriesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/service-categories')
      ])

      const categories = await categoriesRes.json()
      const serviceCategories = await serviceCategoriesRes.json()

      const categoryCount = categories.length
      const bookmarkCount = categories.reduce((sum: number, cat: any) => sum + (cat.bookmarks?.length || 0), 0)
      const serviceCategoryCount = serviceCategories.length
      const serviceCount = serviceCategories.reduce((sum: number, cat: any) => sum + (cat.services?.length || 0), 0)

      setStats({
        categories: categoryCount,
        bookmarks: bookmarkCount,
        serviceCategories: serviceCategoryCount,
        services: serviceCount
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <UpdateChecker onChangelogClick={() => setChangelogOpen(true)} />
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Welcome to your Faux|Dash admin panel
        </p>
      </div>

      {/* Pageview Statistics */}
      <StatsWidget />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20">
                <FolderIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Bookmark Categories</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.categories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20">
                <BookmarkIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Bookmarks</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.bookmarks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20">
                <FolderIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Service Categories</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.serviceCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20">
                <ServerIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Services</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.services}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Favicon Storage Stats */}
      <FaviconStatsWidget />

      {/* Changelog Dialog */}
      <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
    </div>
  )
}
