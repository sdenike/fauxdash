'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Image as ImageIcon, Trash2, Database, Globe, RefreshCw, CloudDownload, Wrench, Download, Upload, FlaskConical } from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { AdminPage, AdminSection } from '@/components/admin/admin-page'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface ToolResult {
  success: boolean
  message: string
  details?: Record<string, any>
}

interface DemoStatus {
  hasDemo: boolean
  stats: {
    bookmarkCategories: number
    bookmarks: number
    serviceCategories: number
    services: number
    pageviews: number
  }
}

interface Settings {
  hideDemoContent: boolean
  geoipMaxmindAccountId: string
  geoipMaxmindLicenseKey: string
}

export default function ToolsPage() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, ToolResult | null>>({})
  const [importType, setImportType] = useState<string>('full')
  const [clearExisting, setClearExisting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null)
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [downloadingMaxmind, setDownloadingMaxmind] = useState(false)

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

    // Fetch demo status
    fetchDemoStatus()

    // Fetch settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          hideDemoContent: data.hideDemoContent || false,
          geoipMaxmindAccountId: data.geoipMaxmindAccountId || '',
          geoipMaxmindLicenseKey: data.geoipMaxmindLicenseKey || '',
        })
      })
      .catch(() => {})
  }, [])

  const fetchDemoStatus = async () => {
    try {
      const response = await fetch('/api/demo/status')
      if (response.ok) {
        const data = await response.json()
        setDemoStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch demo status:', error)
    }
  }

  const loadDemo = async () => {
    setLoading(prev => ({ ...prev, loadDemo: true }))
    setResults(prev => ({ ...prev, loadDemo: null }))

    try {
      const response = await fetch('/api/demo/load', { method: 'POST' })
      const data = await response.json()

      if (response.ok) {
        setResults(prev => ({ ...prev, loadDemo: { success: true, message: data.message, details: data.stats } }))
        toast({
          variant: 'success',
          title: 'Demo content loaded',
          description: data.message,
        })
        fetchDemoStatus()
      } else {
        setResults(prev => ({ ...prev, loadDemo: { success: false, message: data.error } }))
        toast({
          variant: 'destructive',
          title: 'Could not load demo content',
          description: data.error,
        })
      }
    } catch (error: any) {
      setResults(prev => ({ ...prev, loadDemo: { success: false, message: error.message } }))
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: `${error.message || 'The request failed'}. Try again.`,
      })
    } finally {
      setLoading(prev => ({ ...prev, loadDemo: false }))
    }
  }

  const clearDemo = async () => {
    if (!(await confirm({
      title: 'Clear demo content?',
      description: 'The demo bookmarks, services and sample analytics are deleted. Your own data is not affected.',
      confirmLabel: 'Clear demo content',
      destructive: true,
    }))) return
    setLoading(prev => ({ ...prev, clearDemo: true }))
    setResults(prev => ({ ...prev, clearDemo: null }))

    try {
      const response = await fetch('/api/demo/clear', { method: 'DELETE' })
      const data = await response.json()

      if (response.ok) {
        setResults(prev => ({ ...prev, clearDemo: { success: true, message: data.message, details: data.stats } }))
        toast({
          variant: 'success',
          title: 'Demo content cleared',
          description: data.message,
        })
        fetchDemoStatus()
      } else {
        setResults(prev => ({ ...prev, clearDemo: { success: false, message: data.error } }))
        toast({
          variant: 'destructive',
          title: 'Could not clear demo content',
          description: data.error,
        })
      }
    } catch (error: any) {
      setResults(prev => ({ ...prev, clearDemo: { success: false, message: error.message } }))
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: `${error.message || 'The request failed'}. Try again.`,
      })
    } finally {
      setLoading(prev => ({ ...prev, clearDemo: false }))
    }
  }

  const runTool = async (toolName: string, endpoint: string) => {
    if (toolName === 'prune' && !(await confirm({
      title: 'Delete orphan favicons?',
      description: 'Favicon files that no bookmark or service uses are deleted from disk. This cannot be undone.',
      confirmLabel: 'Delete orphans',
      destructive: true,
    }))) return
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
          title: 'Tool did not finish',
          description: data.error,
        })
      }
    } catch (error: any) {
      setResults(prev => ({ ...prev, [toolName]: { success: false, message: error.message } }))
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: `${error.message || 'The request failed'}. Try again.`,
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
          title: 'Backup downloaded',
          description: 'Your backup has been downloaded.',
        })
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Could not create backup',
          description: data.error,
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: `${error.message || 'The request failed'}. Try again.`,
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
        description: 'Choose a .zip, .csv or .json file, then try again.',
      })
      return
    }

    if (clearExisting && !(await confirm({
      title: 'Replace existing data?',
      description: 'Existing items of the selected type are deleted before the import. Download a backup first if you may need them. This cannot be undone.',
      confirmLabel: 'Replace and import',
      destructive: true,
    }))) return

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
          title: 'Import complete',
          description: data.message,
        })
        setImportFile(null)
      } else {
        setResults(prev => ({ ...prev, import: { success: false, message: data.error } }))
        toast({
          variant: 'destructive',
          title: 'Could not import',
          description: data.error,
        })
      }
    } catch (error: any) {
      setResults(prev => ({ ...prev, import: { success: false, message: error.message } }))
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: `${error.message || 'The request failed'}. Try again.`,
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
          title: 'MaxMind status',
          description: data.message,
        })
      }
    } catch (error: any) {
      setResults(prev => ({ ...prev, maxmind: { success: false, message: error.message } }))
    } finally {
      setLoading(prev => ({ ...prev, maxmind: false }))
    }
  }

  const downloadMaxmind = async () => {
    setDownloadingMaxmind(true)

    try {
      const response = await fetch('/api/geoip/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edition: 'GeoLite2-City',
          accountId: settings?.geoipMaxmindAccountId,
          licenseKey: settings?.geoipMaxmindLicenseKey,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          variant: 'success',
          title: 'MaxMind database updated',
          description: data.message,
        })
        // Refresh the MaxMind status
        checkMaxMind()
      } else {
        toast({
          variant: 'destructive',
          title: 'Could not download database',
          description: data.message || data.error,
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Could not download database',
        description: error.message,
      })
    } finally {
      setDownloadingMaxmind(false)
    }
  }

  const toggleHideDemoContent = async () => {
    const newValue = !settings?.hideDemoContent
    setSettings(prev => prev ? { ...prev, hideDemoContent: newValue } : null)

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hideDemoContent: newValue }),
      })
      toast({
        variant: 'success',
        title: newValue ? 'Demo section hidden' : 'Demo section visible',
        description: newValue
          ? 'The demo content section is now hidden from this page'
          : 'The demo content section is now visible',
      })
    } catch (error) {
      // Revert on error
      setSettings(prev => prev ? { ...prev, hideDemoContent: !newValue } : null)
      toast({
        variant: 'destructive',
        title: 'Could not save setting',
        description: 'Your change was reverted. Try again.',
      })
    }
  }

  return (
    <AdminPage title="Tools" description="Backups, imports, demo content and maintenance for your dashboard.">

      {/* Backup & Import Section */}
      <AdminSection title="Backup and import">
        <div className="space-y-8">
          {/* Create Backup */}
          <div className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
<div>
<h3 className="text-sm font-semibold text-foreground">Create backup</h3>
<p className="mt-0.5 text-sm text-muted-foreground">Download a complete backup of your dashboard including bookmarks, services, categories, settings, and analytics as a ZIP file.</p>
</div>
              <div className={`text-sm p-3 rounded ${lastBackupDate ? 'bg-info-soft text-info border border-info/30' : 'bg-warning-soft text-warning border border-warning/30'}`}>
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
                  'No backups downloaded yet'
                )}
              </div>
              <Button
                onClick={downloadBackup}
                disabled={loading.backup}
                className="w-full"
              >
                {loading.backup ? (
                  <>
                    <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                    Creating backup…
                  </>
                ) : (
                  <>
                    <Download aria-hidden="true" className="h-4 w-4 mr-2" />
                    Download backup
                  </>
                )}
              </Button>
            </div>

          {/* Restore/Import */}
          <div className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
<div>
<h3 className="text-sm font-semibold text-foreground">Restore or import</h3>
<p className="mt-0.5 text-sm text-muted-foreground">Restore from a backup ZIP file or import individual CSV files for specific sections.</p>
</div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="import-file">Select file</Label>
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
                <Label htmlFor="import-type">Import type</Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger id="import-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full restore (all data)</SelectItem>
                    <SelectItem value="bookmarks">Bookmarks only</SelectItem>
                    <SelectItem value="services">Services only</SelectItem>
                    <SelectItem value="bookmark-categories">Bookmark categories only</SelectItem>
                    <SelectItem value="service-categories">Service categories only</SelectItem>
                    <SelectItem value="settings">Settings only</SelectItem>
                    <SelectItem value="analytics">Analytics only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="clear-existing">Clear existing data</Label>
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
                    <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload aria-hidden="true" className="h-4 w-4 mr-2" />
                    {clearExisting ? 'Replace and import' : 'Import data'}
                  </>
                )}
              </Button>

              {results.import && (
                <div className={`text-sm p-3 rounded ${results.import.success ? 'bg-success-soft text-success border border-success/30' : 'bg-destructive-soft text-destructive border border-destructive/30'}`}>
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
                        <div className="mt-2 text-destructive">
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
            </div>
        </div>
      </AdminSection>

      {/* Demo Content Section */}
      <AdminSection
        title="Demo content"
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="hideDemoContent" className="text-sm text-muted-foreground">
              {settings?.hideDemoContent ? 'Hidden' : 'Visible'}
            </Label>
            <Switch
              id="hideDemoContent"
              checked={!settings?.hideDemoContent}
              onCheckedChange={() => toggleHideDemoContent()}
            />
          </div>
        }
      >
        {!settings?.hideDemoContent && (
          <div className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
<div>
<h3 className="text-sm font-semibold text-foreground">Sample bookmarks and services</h3>
<p className="mt-0.5 text-sm text-muted-foreground">Test drive Faux|Dash with pre-populated demo data including bookmarks, services, and 30 days of sample analytics. Demo content is marked and can be cleared without affecting your real data.</p>
</div>
              {demoStatus && (
                <div className={`text-sm p-3 rounded ${
                  demoStatus.hasDemo
                    ? 'bg-brand-soft text-brand border border-brand/30'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {demoStatus.hasDemo ? (
                    <>
                      <span className="font-medium">Demo content loaded:</span>
                      <div className="mt-1 text-xs grid grid-cols-2 gap-1">
                        <span>Bookmark categories: {demoStatus.stats.bookmarkCategories}</span>
                        <span>Bookmarks: {demoStatus.stats.bookmarks}</span>
                        <span>Service categories: {demoStatus.stats.serviceCategories}</span>
                        <span>Services: {demoStatus.stats.services}</span>
                        <span className="col-span-2">Demo pageviews: {demoStatus.stats.pageviews}</span>
                      </div>
                    </>
                  ) : (
                    'No demo content loaded'
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={loadDemo}
                  disabled={loading.loadDemo || loading.clearDemo || demoStatus?.hasDemo}
                  className="w-full"
                >
                  {loading.loadDemo ? (
                    <>
                      <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                      Loading demo…
                    </>
                  ) : (
                    <>
                      <FlaskConical aria-hidden="true" className="h-4 w-4 mr-2" />
                      Load demo content
                    </>
                  )}
                </Button>

                <Button
                  onClick={clearDemo}
                  disabled={loading.loadDemo || loading.clearDemo || !demoStatus?.hasDemo}
                  variant="outline"
                  className="w-full"
                >
                  {loading.clearDemo ? (
                    <>
                      <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                      Clearing demo…
                    </>
                  ) : (
                    <>
                      <Trash2 aria-hidden="true" className="h-4 w-4 mr-2" />
                      Clear demo content
                    </>
                  )}
                </Button>
              </div>

              {(results.loadDemo || results.clearDemo) && (
                <div className={`text-sm p-3 rounded ${
                  (results.loadDemo?.success || results.clearDemo?.success)
                    ? 'bg-success-soft text-success border border-success/30'
                    : 'bg-destructive-soft text-destructive border border-destructive/30'
                }`}>
                  <p>{results.loadDemo?.message || results.clearDemo?.message}</p>
                </div>
              )}
            </div>
        )}
      </AdminSection>

      {/* Maintenance Tools Section */}
      <AdminSection title="Maintenance tools">
        <div className="space-y-8">
        {/* Reprocess Originals */}
        <div className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
<div>
<h3 className="text-sm font-semibold text-foreground">Reprocess favicon originals</h3>
<p className="mt-0.5 text-sm text-muted-foreground">Ensure every favicon has an original copy saved for transformations. This will scan all favicons and create missing originals.</p>
</div>
            <Button
              onClick={() => runTool('reprocess', '/api/tools/reprocess-originals')}
              disabled={loading.reprocess}
              className="w-full"
            >
              {loading.reprocess ? (
                <>
                  <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2" />
                  Reprocess originals
                </>
              )}
            </Button>
            {results.reprocess && (
              <div className={`text-sm p-3 rounded ${results.reprocess.success ? 'bg-success-soft text-success border border-success/30' : 'bg-destructive-soft text-destructive border border-destructive/30'}`}>
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
          </div>

        {/* Download Remote Icons */}
        <div className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
<div>
<h3 className="text-sm font-semibold text-foreground">Download remote icons</h3>
<p className="mt-0.5 text-sm text-muted-foreground">Download all selfh.st and HeroIcon icons locally so they can be transformed (theme color, monotone, invert). Creates original backups.</p>
</div>
            <Button
              onClick={() => runTool('downloadIcons', '/api/tools/download-remote-icons')}
              disabled={loading.downloadIcons}
              className="w-full"
            >
              {loading.downloadIcons ? (
                <>
                  <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                  Downloading…
                </>
              ) : (
                <>
                  <CloudDownload aria-hidden="true" className="h-4 w-4 mr-2" />
                  Download all remote icons
                </>
              )}
            </Button>
            {results.downloadIcons && (
              <div className={`text-sm p-3 rounded ${results.downloadIcons.success ? 'bg-success-soft text-success border border-success/30' : 'bg-destructive-soft text-destructive border border-destructive/30'}`}>
                <p>{results.downloadIcons.message}</p>
                {results.downloadIcons.details && (
                  <div className="mt-2 text-xs">
                    <p>Total remote icons: {results.downloadIcons.details.total || 0}</p>
                    <p>Downloaded: {results.downloadIcons.details.downloaded || 0}</p>
                    <p>Skipped: {results.downloadIcons.details.skipped || 0}</p>
                    <p>Failed: {results.downloadIcons.details.failed || 0}</p>
                    {results.downloadIcons.details.errors && results.downloadIcons.details.errors.length > 0 && (
                      <div className="mt-2 text-destructive">
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
          </div>

        {/* Repair Favicons */}
        <div className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
<div>
<h3 className="text-sm font-semibold text-foreground">Repair invalid favicons</h3>
<p className="mt-0.5 text-sm text-muted-foreground">Scan all favicons and repair any that have unsupported formats. Uses Google&apos;s favicon service to re-fetch problematic icons.</p>
</div>
            <Button
              onClick={() => runTool('repair', '/api/tools/repair-favicons')}
              disabled={loading.repair}
              className="w-full"
            >
              {loading.repair ? (
                <>
                  <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                  Repairing…
                </>
              ) : (
                <>
                  <Wrench aria-hidden="true" className="h-4 w-4 mr-2" />
                  Repair invalid favicons
                </>
              )}
            </Button>
            {results.repair && (
              <div className={`text-sm p-3 rounded ${results.repair.success ? 'bg-success-soft text-success border border-success/30' : 'bg-destructive-soft text-destructive border border-destructive/30'}`}>
                <p>{results.repair.message}</p>
                {results.repair.details && (
                  <div className="mt-2 text-xs">
                    <p>Total scanned: {results.repair.details.total || 0}</p>
                    <p>Repaired: {results.repair.details.repaired || 0}</p>
                    <p>Skipped (valid): {results.repair.details.skipped || 0}</p>
                    <p>Failed: {results.repair.details.failed || 0}</p>
                    {results.repair.details.errors && results.repair.details.errors.length > 0 && (
                      <div className="mt-2 text-destructive">
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
          </div>

        {/* Prune Orphans */}
        <div className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
<div>
<h3 className="text-sm font-semibold text-foreground">Prune orphan favicons</h3>
<p className="mt-0.5 text-sm text-muted-foreground">Remove favicon files that are no longer referenced by any bookmark or service. This helps free up disk space.</p>
</div>
            <Button
              onClick={() => runTool('prune', '/api/tools/prune-orphans')}
              disabled={loading.prune}
              variant="outline"
              className="w-full"
            >
              {loading.prune ? (
                <>
                  <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                  Scanning…
                </>
              ) : (
                <>
                  <Trash2 aria-hidden="true" className="h-4 w-4 mr-2" />
                  Prune orphan favicons
                </>
              )}
            </Button>
            {results.prune && (
              <div className={`text-sm p-3 rounded ${results.prune.success ? 'bg-success-soft text-success border border-success/30' : 'bg-destructive-soft text-destructive border border-destructive/30'}`}>
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
          </div>

        {/* Database Optimization */}
        <div className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
<div>
<h3 className="text-sm font-semibold text-foreground">Database optimization</h3>
<p className="mt-0.5 text-sm text-muted-foreground">Run VACUUM and optimization on the SQLite database to reclaim space and improve performance.</p>
</div>
            <Button
              onClick={() => runTool('vacuum', '/api/tools/vacuum-db')}
              disabled={loading.vacuum}
              variant="outline"
              className="w-full"
            >
              {loading.vacuum ? (
                <>
                  <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing…
                </>
              ) : (
                <>
                  <Database aria-hidden="true" className="h-4 w-4 mr-2" />
                  Optimize database
                </>
              )}
            </Button>
            {results.vacuum && (
              <div className={`text-sm p-3 rounded ${results.vacuum.success ? 'bg-success-soft text-success border border-success/30' : 'bg-destructive-soft text-destructive border border-destructive/30'}`}>
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
          </div>

        {/* MaxMind Check */}
        <div className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
<div>
<h3 className="text-sm font-semibold text-foreground">MaxMind GeoIP database</h3>
<p className="mt-0.5 text-sm text-muted-foreground">Check the status of your MaxMind GeoIP database and download updates.</p>
</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={checkMaxMind}
                disabled={loading.maxmind}
                variant="outline"
                className="w-full"
              >
                {loading.maxmind ? (
                  <>
                    <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    <Globe aria-hidden="true" className="h-4 w-4 mr-2" />
                    Check status
                  </>
                )}
              </Button>
              <Button
                onClick={downloadMaxmind}
                disabled={downloadingMaxmind || !settings?.geoipMaxmindAccountId || !settings?.geoipMaxmindLicenseKey}
                variant="default"
                className="w-full"
              >
                {downloadingMaxmind ? (
                  <>
                    <RefreshCw aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                    Downloading…
                  </>
                ) : (
                  <>
                    <CloudDownload aria-hidden="true" className="h-4 w-4 mr-2" />
                    Update database
                  </>
                )}
              </Button>
            </div>
            {!settings?.geoipMaxmindAccountId || !settings?.geoipMaxmindLicenseKey ? (
              <div className="text-sm p-3 rounded bg-muted text-muted-foreground">
                <p>To enable automatic updates, configure your MaxMind Account ID and License Key in <strong>Settings &gt; GeoIP</strong>.</p>
                <p className="mt-1 text-xs">
                  Get free credentials from{' '}
                  <a href="https://www.maxmind.com/en/geolite2/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    MaxMind GeoLite2
                  </a>
                </p>
              </div>
            ) : null}
            {results.maxmind && (
              <div className={`text-sm p-3 rounded ${
                !results.maxmind.details?.installed
                  ? 'bg-destructive-soft text-destructive border border-destructive/30'
                  : results.maxmind.details?.isOutdated
                    ? 'bg-warning-soft text-warning border border-warning/30'
                    : 'bg-success-soft text-success border border-success/30'
              }`}>
                <p>{results.maxmind.message}</p>
                {results.maxmind.details && results.maxmind.details.installed && (
                  <div className="mt-2 text-xs space-y-1">
                    <p>Installed version: {results.maxmind.details.installedDate || 'Unknown'}</p>
                    <p>File size: {results.maxmind.details.fileSize || 'Unknown'}</p>
                    <p>Database path: {results.maxmind.details.path || 'Not found'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AdminSection>
    </AdminPage>
  )
}
