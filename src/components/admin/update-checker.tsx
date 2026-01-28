'use client'

import { useEffect, useState } from 'react'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  releaseUrl?: string
  releaseName?: string
  publishedAt?: string
  error?: string
}

interface UpdateCheckerProps {
  onChangelogClick: () => void
}

export function UpdateChecker({ onChangelogClick }: UpdateCheckerProps) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkForUpdates()
  }, [])

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/version/check')
      const data = await response.json()
      setUpdateInfo(data)
    } catch (error) {
      console.error('Failed to check for updates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !updateInfo) {
    return (
      <button
        onClick={onChangelogClick}
        className="text-sm font-mono px-2 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors cursor-pointer"
        title="View changelog"
      >
        v{updateInfo?.currentVersion || '...'}
      </button>
    )
  }

  if (updateInfo.updateAvailable) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onChangelogClick}
          className="text-sm font-mono px-2 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors cursor-pointer"
          title="View changelog"
        >
          v{updateInfo.currentVersion}
        </button>
        <a
          href={updateInfo.releaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 text-green-700 dark:text-green-400 hover:from-green-500/20 hover:to-emerald-500/20 dark:hover:from-green-500/30 dark:hover:to-emerald-500/30 transition-all border border-green-500/20 dark:border-green-500/30"
          title={`Update available: ${updateInfo.releaseName || `v${updateInfo.latestVersion}`}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          v{updateInfo.latestVersion} available
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    )
  }

  return (
    <button
      onClick={onChangelogClick}
      className="text-sm font-mono px-2 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors cursor-pointer"
      title="View changelog - You're on the latest version"
    >
      v{updateInfo.currentVersion}
    </button>
  )
}
