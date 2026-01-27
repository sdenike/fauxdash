'use client'

import { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useToast } from '../ui/use-toast'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { IconSelector } from '../icon-selector'
import { Progress } from '../ui/progress'

interface CSVImportProps {
  onImportComplete: () => void
}

interface ImportResults {
  bookmarksCreated: number
  servicesCreated: number
  categoriesCreated: number
  serviceCategoriesCreated: number
  errors: string[]
}

interface FailedFavicon {
  name: string
  url: string
  section: string
  itemId: number
  selectedIcon?: string
}

interface ProgressState {
  current: number
  total: number
  phase: 'favicon' | 'saving'
  item?: { name: string; url: string }
}

export function CSVImport({ onImportComplete }: CSVImportProps) {
  const { toast } = useToast()
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResults | null>(null)
  const [failedFavicons, setFailedFavicons] = useState<FailedFavicon[]>([])
  const [fetchFavicons, setFetchFavicons] = useState(true)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [savingIcons, setSavingIcons] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setResults(null)
    setFailedFavicons([])
    setProgress(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fetchFavicons', fetchFavicons.toString())

      const response = await fetch('/api/import/csv-stream', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line)

            if (data.type === 'start') {
              setProgress({ current: 0, total: data.total, phase: 'favicon' })
            } else if (data.type === 'progress') {
              setProgress({
                current: data.current,
                total: data.total,
                phase: data.phase,
                item: data.item,
              })
            } else if (data.type === 'complete') {
              setResults(data.results)
              setFailedFavicons(data.failedFavicons || [])

              toast({
                variant: 'success',
                title: 'Import Complete',
                description: `Created ${data.results.bookmarksCreated} bookmarks and ${data.results.servicesCreated} services`,
              })
              onImportComplete()
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error.message || 'An error occurred while importing the CSV file',
      })
    } finally {
      setImporting(false)
      setProgress(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleIconChange = (index: number, icon: string) => {
    setFailedFavicons(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], selectedIcon: icon }
      return updated
    })
  }

  const handleSaveIcons = async () => {
    const itemsToUpdate = failedFavicons.filter(item => item.selectedIcon)
    if (itemsToUpdate.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No icons selected',
        description: 'Please select icons for the items you want to update',
      })
      return
    }

    setSavingIcons(true)
    let successCount = 0
    let errorCount = 0

    for (const item of itemsToUpdate) {
      try {
        const endpoint = item.section === 'bookmarks'
          ? `/api/bookmarks/${item.itemId}`
          : `/api/services/${item.itemId}`

        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ icon: item.selectedIcon }),
        })

        if (response.ok) {
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }
    }

    setSavingIcons(false)

    if (successCount > 0) {
      toast({
        variant: 'success',
        title: 'Icons Updated',
        description: `Updated ${successCount} item${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      })
      // Remove successfully updated items from the list
      setFailedFavicons(prev => prev.filter(item => !item.selectedIcon))
      onImportComplete()
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update icons',
      })
    }
  }

  const handleSkipAll = () => {
    setFailedFavicons([])
    toast({
      title: 'Skipped',
      description: 'Skipped icon selection for remaining items',
    })
  }

  const progressPercent = progress ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from CSV</CardTitle>
        <CardDescription>
          Import bookmarks and services from a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* How-to Section */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm">How to Import</h4>
          <p className="text-sm text-muted-foreground">
            Create a CSV file with these columns: <code className="bg-muted px-1 rounded">Section, Category, Name, Description, URL</code>
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Section:</strong> Use &quot;Bookmarks&quot; or &quot;Services&quot; (or &quot;Applications&quot;)</p>
            <p><strong>Category:</strong> Category name - created automatically if it doesn&apos;t exist</p>
            <p><strong>Name:</strong> Display name for the item</p>
            <p><strong>Description:</strong> Optional description (can be empty)</p>
            <p><strong>URL:</strong> Full URL (https:// added automatically if missing)</p>
          </div>
          <div className="bg-background rounded border p-3 text-xs font-mono overflow-x-auto">
            <div className="text-muted-foreground mb-1"># Example CSV (copy and paste into a .csv file):</div>
            <pre className="whitespace-pre-wrap">{`Section,Category,Name,Description,URL
Bookmarks,Social Media,Twitter,Social network,https://twitter.com
Bookmarks,Social Media,Reddit,Front page of the internet,https://reddit.com
Services,Media,Plex,Media server,https://plex.local:32400
Services,Monitoring,Uptime Kuma,Uptime monitor,https://uptime.local`}</pre>
          </div>
        </div>

        {/* Import Options */}
        <div className="flex items-center space-x-2">
          <Switch
            id="fetch-favicons"
            checked={fetchFavicons}
            onCheckedChange={setFetchFavicons}
            disabled={importing}
          />
          <Label htmlFor="fetch-favicons" className="text-sm">
            Automatically fetch favicons for each site
          </Label>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />

          {importing && progress ? (
            <div className="space-y-4 max-w-md mx-auto">
              <Progress value={progressPercent} className="h-2" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">
                  {progress.phase === 'favicon' ? 'Fetching favicon' : 'Saving'}: {progress.current} of {progress.total}
                </p>
                {progress.item && (
                  <p className="truncate mt-1">{progress.item.name}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Select a CSV file to import bookmarks and services
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-file-input"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                Select CSV File
              </Button>
            </>
          )}
        </div>

        {/* Import Results */}
        {results && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-medium">Import Results</h4>
            </div>
            <ul className="text-sm space-y-1 ml-7">
              {results.categoriesCreated > 0 && (
                <li className="text-green-600 dark:text-green-400">
                  Created {results.categoriesCreated} bookmark {results.categoriesCreated === 1 ? 'category' : 'categories'}
                </li>
              )}
              {results.bookmarksCreated > 0 && (
                <li className="text-green-600 dark:text-green-400">
                  Created {results.bookmarksCreated} {results.bookmarksCreated === 1 ? 'bookmark' : 'bookmarks'}
                </li>
              )}
              {results.serviceCategoriesCreated > 0 && (
                <li className="text-green-600 dark:text-green-400">
                  Created {results.serviceCategoriesCreated} service {results.serviceCategoriesCreated === 1 ? 'category' : 'categories'}
                </li>
              )}
              {results.servicesCreated > 0 && (
                <li className="text-green-600 dark:text-green-400">
                  Created {results.servicesCreated} {results.servicesCreated === 1 ? 'service' : 'services'}
                </li>
              )}
              {results.errors.length > 0 && (
                <li className="text-destructive">
                  {results.errors.length} {results.errors.length === 1 ? 'error' : 'errors'}:
                  <ul className="ml-4 mt-1">
                    {results.errors.slice(0, 5).map((error, i) => (
                      <li key={i} className="text-xs">{error}</li>
                    ))}
                    {results.errors.length > 5 && (
                      <li className="text-xs">...and {results.errors.length - 5} more</li>
                    )}
                  </ul>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Failed Favicons - Icon Selection */}
        {failedFavicons.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h4 className="font-medium text-amber-900 dark:text-amber-100">
                  {failedFavicons.length} {failedFavicons.length === 1 ? 'item needs' : 'items need'} an icon
                </h4>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSkipAll}>
                Skip All
              </Button>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              These items could not fetch a favicon automatically. Select an icon for each or skip.
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {failedFavicons.map((item, index) => (
                <div
                  key={`${item.section}-${item.itemId}`}
                  className="flex items-center gap-3 bg-background rounded-lg p-3 border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                    <span className="text-xs text-muted-foreground capitalize">
                      ({item.section.replace('s', '')})
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    <IconSelector
                      value={item.selectedIcon || ''}
                      onChange={(icon) => handleIconChange(index, icon)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleSkipAll}>
                Skip Remaining
              </Button>
              <Button onClick={handleSaveIcons} disabled={savingIcons}>
                {savingIcons ? 'Saving...' : 'Save Selected Icons'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
