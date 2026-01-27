'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  WrenchScrewdriverIcon,
  PhotoIcon,
  TrashIcon,
  CircleStackIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  WrenchIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface ToolResult {
  success: boolean
  message: string
  details?: Record<string, any>
}

export default function ToolsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, ToolResult | null>>({})
  const [importType, setImportType] = useState<string>('full')
  const [clearExisting, setClearExisting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null)

  useEffect(() => {
    // Fetch last backup date
    fetch('/api/settings?key=lastBackupDate')
      .then(res => res.json())
      .then(data => {
        if (data.value) {
          setLastBackupDate(data.value)
        }
      })
      .catch(() => {})
  }, [])

  const runTool = async (toolName: string, endpoint: string) => {
    setLoading(prev => ({ ...prev, [toolName]: true }))
    setResults(prev => ({ ...prev, [toolName]: null }))

    try {
      const response = await fetch(endpoint, { method: 'POST' })
      const data = await response.json()

      if (response.ok) {
        setResults(prev => ({ ...prev, [toolName]: { success: true, message: data.message, details: data } }))
        toast({
          variant: 'success',
          title: 'Tool completed',
          description: data.message,
        })
      } else {
        setResults(prev => ({ ...prev, [toolName]: { success: false, message: data.error } }))
        toast({
          variant: 'destructive',
          title: 'Tool failed',
          description: data.error,
        })
      }
    } catch (error: any) {
      setResults(prev => ({ ...prev, [toolName]: { success: false, message: error.message } }))
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    } finally {
      setLoading(prev => ({ ...prev, [toolName]: false }))
    }
  }

  const downloadBackup = async () => {
    setLoading(prev => ({ ...prev, backup: true }))

    try {
      const response = await fetch('/api/backup')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `fauxdash-backup-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Update last backup date
        setLastBackupDate(new Date().toISOString())

        toast({
          variant: 'success',
          title: 'Backup Created',
          description: 'Your backup has been downloaded.',
        })
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Backup Failed',
          description: data.error,
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    } finally {
      setLoading(prev => ({ ...prev, backup: false }))
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a file to import.',
      })
      return
    }

    setLoading(prev => ({ ...prev, import: true }))
    setResults(prev => ({ ...prev, import: null }))

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('type', importType)
      formData.append('clearExisting', clearExisting.toString())

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResults(prev => ({ ...prev, import: { success: true, message: data.message, details: data.results } }))
        toast({
          variant: 'success',
          title: 'Import Complete',
          description: data.message,
        })
        setImportFile(null)
      } else {
        setResults(prev => ({ ...prev, import: { success: false, message: data.error } }))
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: data.error,
        })
      }
    } catch (error: any) {
      setResults(prev => ({ ...prev, import: { success: false, message: error.message } }))
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    } finally {
      setLoading(prev => ({ ...prev, import: false }))
    }
  }

  const checkMaxMind = async () => {
    setLoading(prev => ({ ...prev, maxmind: true }))
    setResults(prev => ({ ...prev, maxmind: null }))

    try {
      const response = await fetch('/api/tools/maxmind-check')
      const data = await response.json()

      setResults(prev => ({ ...prev, maxmind: { success: response.ok, message: data.message || data.error, details: data } }))

      if (response.ok) {
        toast({
          variant: 'success',
          title: 'MaxMind Check',
          description: data.message,
        })
      }
    } catch (error: any) {
      setResults(prev => ({ ...prev, maxmind: { success: false, message: error.message } }))
    } finally {
      setLoading(prev => ({ ...prev, maxmind: false }))
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <WrenchScrewdriverIcon className="h-6 w-6" />
          System Tools
        </h1>
        <p className="text-muted-foreground">
          Maintenance and optimization tools for your dashboard
        </p>
      </div>

      {/* Backup & Import Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ArchiveBoxIcon className="h-5 w-5" />
          Backup & Import
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownTrayIcon className="h-5 w-5" />
                Create Backup
              </CardTitle>
              <CardDescription>
                Download a complete backup of your dashboard including bookmarks, services,
                categories, settings, and analytics as a ZIP file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`text-sm p-3 rounded ${lastBackupDate ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'}`}>
                {lastBackupDate ? (
                  <>
                    <span className="font-medium">Last backup:</span>{' '}
                    {new Date(lastBackupDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </>
                ) : (
                  'No backups created yet'
                )}
              </div>
              <Button
                onClick={downloadBackup}
                disabled={loading.backup}
                className="w-full"
              >
                {loading.backup ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Restore/Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpTrayIcon className="h-5 w-5" />
                Restore / Import
              </CardTitle>
              <CardDescription>
                Restore from a backup ZIP file or import individual CSV files for specific sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="import-file">Select File</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".zip,.csv,.json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Accepts: .zip (full backup), .csv (bookmarks/services/categories), .json (settings)
                </p>
              </div>

              <div>
                <Label htmlFor="import-type">Import Type</Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger id="import-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Restore (All Data)</SelectItem>
                    <SelectItem value="bookmarks">Bookmarks Only</SelectItem>
                    <SelectItem value="services">Services Only</SelectItem>
                    <SelectItem value="bookmark-categories">Bookmark Categories Only</SelectItem>
                    <SelectItem value="service-categories">Service Categories Only</SelectItem>
                    <SelectItem value="settings">Settings Only</SelectItem>
                    <SelectItem value="analytics">Analytics Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="clear-existing">Clear Existing Data</Label>
                  <p className="text-xs text-muted-foreground">
                    Delete existing items before importing
                  </p>
                </div>
                <Switch
                  id="clear-existing"
                  checked={clearExisting}
                  onCheckedChange={setClearExisting}
                />
              </div>

              <Button
                onClick={handleImport}
                disabled={loading.import || !importFile}
                className="w-full"
                variant={clearExisting ? "destructive" : "default"}
              >
                {loading.import ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    {clearExisting ? 'Replace & Import' : 'Import Data'}
                  </>
                )}
              </Button>

              {results.import && (
                <div className={`text-sm p-3 rounded ${results.import.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  <p>{results.import.message}</p>
                  {results.import.details && (
                    <div className="mt-2 text-xs space-y-1">
                      {results.import.details.bookmarksCreated > 0 && (
                        <p>Bookmarks imported: {results.import.details.bookmarksCreated}</p>
                      )}
                      {results.import.details.servicesCreated > 0 && (
                        <p>Services imported: {results.import.details.servicesCreated}</p>
                      )}
                      {results.import.details.bookmarkCategoriesCreated > 0 && (
                        <p>Bookmark categories: {results.import.details.bookmarkCategoriesCreated}</p>
                      )}
                      {results.import.details.serviceCategoriesCreated > 0 && (
                        <p>Service categories: {results.import.details.serviceCategoriesCreated}</p>
                      )}
                      {results.import.details.settingsRestored > 0 && (
                        <p>Settings restored: {results.import.details.settingsRestored}</p>
                      )}
                      {results.import.details.analyticsRestored > 0 && (
                        <p>Analytics records restored: {results.import.details.analyticsRestored}</p>
                      )}
                      {results.import.details.errors && results.import.details.errors.length > 0 && (
                        <div className="mt-2 text-red-600">
                          <p className="font-medium">Errors:</p>
                          <ul className="list-disc list-inside">
                            {results.import.details.errors.slice(0, 5).map((err: string, i: number) => (
                              <li key={i} className="truncate">{err}</li>
                            ))}
                            {results.import.details.errors.length > 5 && (
                              <li>...and {results.import.details.errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Maintenance Tools Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <WrenchIcon className="h-5 w-5" />
          Maintenance Tools
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
        {/* Reprocess Originals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhotoIcon className="h-5 w-5" />
              Reprocess Favicon Originals
            </CardTitle>
            <CardDescription>
              Ensure every favicon has an original copy saved for transformations.
              This will scan all favicons and create missing originals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => runTool('reprocess', '/api/tools/reprocess-originals')}
              disabled={loading.reprocess}
              className="w-full"
            >
              {loading.reprocess ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Reprocess Originals
                </>
              )}
            </Button>
            {results.reprocess && (
              <div className={`text-sm p-3 rounded ${results.reprocess.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                <p>{results.reprocess.message}</p>
                {results.reprocess.details && (
                  <div className="mt-2 text-xs">
                    <p>Processed: {results.reprocess.details.processed || 0}</p>
                    <p>Created: {results.reprocess.details.created || 0}</p>
                    <p>Skipped: {results.reprocess.details.skipped || 0}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Download Remote Icons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudArrowDownIcon className="h-5 w-5" />
              Download Remote Icons
            </CardTitle>
            <CardDescription>
              Download all selfh.st and HeroIcon icons locally so they can be
              transformed (theme color, monotone, invert). Creates original backups.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => runTool('downloadIcons', '/api/tools/download-remote-icons')}
              disabled={loading.downloadIcons}
              className="w-full"
            >
              {loading.downloadIcons ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                  Download All Remote Icons
                </>
              )}
            </Button>
            {results.downloadIcons && (
              <div className={`text-sm p-3 rounded ${results.downloadIcons.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                <p>{results.downloadIcons.message}</p>
                {results.downloadIcons.details && (
                  <div className="mt-2 text-xs">
                    <p>Total remote icons: {results.downloadIcons.details.total || 0}</p>
                    <p>Downloaded: {results.downloadIcons.details.downloaded || 0}</p>
                    <p>Skipped: {results.downloadIcons.details.skipped || 0}</p>
                    <p>Failed: {results.downloadIcons.details.failed || 0}</p>
                    {results.downloadIcons.details.errors && results.downloadIcons.details.errors.length > 0 && (
                      <div className="mt-2 text-red-600">
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc list-inside">
                          {results.downloadIcons.details.errors.slice(0, 5).map((err: string, i: number) => (
                            <li key={i} className="truncate">{err}</li>
                          ))}
                          {results.downloadIcons.details.errors.length > 5 && (
                            <li>...and {results.downloadIcons.details.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repair Favicons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WrenchIcon className="h-5 w-5" />
              Repair Invalid Favicons
            </CardTitle>
            <CardDescription>
              Scan all favicons and repair any that have unsupported formats.
              Uses Google&apos;s favicon service to re-fetch problematic icons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => runTool('repair', '/api/tools/repair-favicons')}
              disabled={loading.repair}
              className="w-full"
            >
              {loading.repair ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <WrenchIcon className="h-4 w-4 mr-2" />
                  Repair Invalid Favicons
                </>
              )}
            </Button>
            {results.repair && (
              <div className={`text-sm p-3 rounded ${results.repair.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                <p>{results.repair.message}</p>
                {results.repair.details && (
                  <div className="mt-2 text-xs">
                    <p>Total scanned: {results.repair.details.total || 0}</p>
                    <p>Repaired: {results.repair.details.repaired || 0}</p>
                    <p>Skipped (valid): {results.repair.details.skipped || 0}</p>
                    <p>Failed: {results.repair.details.failed || 0}</p>
                    {results.repair.details.errors && results.repair.details.errors.length > 0 && (
                      <div className="mt-2 text-red-600">
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc list-inside">
                          {results.repair.details.errors.slice(0, 5).map((err: string, i: number) => (
                            <li key={i} className="truncate">{err}</li>
                          ))}
                          {results.repair.details.errors.length > 5 && (
                            <li>...and {results.repair.details.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prune Orphans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrashIcon className="h-5 w-5" />
              Prune Orphan Favicons
            </CardTitle>
            <CardDescription>
              Remove favicon files that are no longer referenced by any bookmark or service.
              This helps free up disk space.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => runTool('prune', '/api/tools/prune-orphans')}
              disabled={loading.prune}
              variant="outline"
              className="w-full"
            >
              {loading.prune ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Prune Orphan Favicons
                </>
              )}
            </Button>
            {results.prune && (
              <div className={`text-sm p-3 rounded ${results.prune.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                <p>{results.prune.message}</p>
                {results.prune.details && (
                  <div className="mt-2 text-xs">
                    <p>Total files scanned: {results.prune.details.totalFiles || 0}</p>
                    <p>Orphans removed: {results.prune.details.removed || 0}</p>
                    <p>Space freed: {results.prune.details.spaceFreed || '0 KB'}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Optimization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleStackIcon className="h-5 w-5" />
              Database Optimization
            </CardTitle>
            <CardDescription>
              Run VACUUM and optimization on the SQLite database to reclaim space
              and improve performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => runTool('vacuum', '/api/tools/vacuum-db')}
              disabled={loading.vacuum}
              variant="outline"
              className="w-full"
            >
              {loading.vacuum ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <CircleStackIcon className="h-4 w-4 mr-2" />
                  Optimize Database
                </>
              )}
            </Button>
            {results.vacuum && (
              <div className={`text-sm p-3 rounded ${results.vacuum.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                <p>{results.vacuum.message}</p>
                {results.vacuum.details && (
                  <div className="mt-2 text-xs">
                    <p>Size before: {results.vacuum.details.sizeBefore || 'N/A'}</p>
                    <p>Size after: {results.vacuum.details.sizeAfter || 'N/A'}</p>
                    <p>Space saved: {results.vacuum.details.spaceSaved || '0 KB'}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MaxMind Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GlobeAltIcon className="h-5 w-5" />
              MaxMind GeoIP Database
            </CardTitle>
            <CardDescription>
              Check the status of your MaxMind GeoIP database and see if updates are available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={checkMaxMind}
              disabled={loading.maxmind}
              variant="outline"
              className="w-full"
            >
              {loading.maxmind ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  Check MaxMind Status
                </>
              )}
            </Button>
            {results.maxmind && (
              <div className={`text-sm p-3 rounded ${
                !results.maxmind.details?.installed
                  ? 'bg-red-500/10 text-red-600'
                  : results.maxmind.details?.isOutdated
                    ? 'bg-yellow-500/10 text-yellow-600'
                    : 'bg-green-500/10 text-green-600'
              }`}>
                <p>{results.maxmind.message}</p>
                {results.maxmind.details && results.maxmind.details.installed && (
                  <div className="mt-2 text-xs space-y-1">
                    <p>Installed version: {results.maxmind.details.installedDate || 'Unknown'}</p>
                    <p>File size: {results.maxmind.details.fileSize || 'Unknown'}</p>
                    <p>Database path: {results.maxmind.details.path || 'Not found'}</p>
                    {results.maxmind.details.updateCommand && (
                      <div className="mt-2 p-2 bg-muted rounded">
                        <p className="font-medium mb-1">Update instructions:</p>
                        <code className="text-xs break-all">{results.maxmind.details.updateCommand}</code>
                      </div>
                    )}
                  </div>
                )}
                {results.maxmind.details && !results.maxmind.details.installed && results.maxmind.details.updateCommand && (
                  <div className="mt-2 p-2 bg-muted rounded">
                    <p className="font-medium mb-1">Installation instructions:</p>
                    <code className="text-xs break-all">{results.maxmind.details.updateCommand}</code>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
