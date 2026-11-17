'use client'

import { useEffect, useState, useCallback } from 'react'
import { ExternalLink } from 'lucide-react'

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
    checkForUpdates()
  }, [])

  if (loading || !updateInfo) {
    return (
      <button
        type="button"
        onClick={onChangelogClick}
        className="text-sm font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
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
        type="button"
          onClick={onChangelogClick}
          className="text-sm font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
          title="View changelog"
        >
          v{updateInfo.currentVersion}
        </button>
        <a
          href={updateInfo.releaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full bg-success-soft text-success border border-success/30 transition-colors"
          title={`Update available: ${updateInfo.releaseName || `v${updateInfo.latestVersion}`}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          v{updateInfo.latestVersion} available
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      </div>
    )
  }

  return (
    <button
        type="button"
      onClick={onChangelogClick}
      className="text-sm font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
      title="View changelog. You're on the latest version"
    >
      v{updateInfo.currentVersion}
    </button>
  )
}
