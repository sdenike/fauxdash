'use client'

import { useCallback, useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SettingsTabProps } from './types'
import { ArrowUpTrayIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface TestResult {
  provider: string
  success: boolean
  message: string
  details?: Record<string, any>
  results?: {
    maxmind: TestResult
    ipinfo: TestResult
  }
}

export function GeoIPTab({ settings, onSettingsChange }: SettingsTabProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Test connection state
  const [testing, setTesting] = useState<'maxmind' | 'ipinfo' | 'chain' | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  // Download state
  const [downloading, setDownloading] = useState(false)
  const [downloadResult, setDownloadResult] = useState<{ success: boolean; message: string; path?: string } | null>(null)

  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  const testConnection = async (provider: 'maxmind' | 'ipinfo' | 'chain') => {
    setTesting(provider)
    setTestResult(null)
    setDownloadResult(null)

    try {
      // Use POST to test with current unsaved settings
      const response = await fetch('/api/geoip/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          maxmindPath: settings.geoipMaxmindPath,
          ipinfoToken: settings.geoipIpinfoToken,
        }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        provider,
        success: false,
        message: 'Failed to test connection',
      })
    } finally {
      setTesting(null)
    }
  }

  const downloadDatabase = async () => {
    setDownloading(true)
    setDownloadResult(null)

    try {
      const response = await fetch('/api/geoip/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edition: 'GeoLite2-City',
          accountId: settings.geoipMaxmindAccountId,
          licenseKey: settings.geoipMaxmindLicenseKey,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setDownloadResult({
          success: true,
          message: result.message,
          path: result.path,
        })
        // Update the path setting to point to the downloaded file
        if (result.path) {
          updateSetting('geoipMaxmindPath', result.path)
        }
        // Clear the test result so user can re-test
        setTestResult(null)
      } else {
        setDownloadResult({
          success: false,
          message: result.message || result.error || 'Download failed',
        })
      }
    } catch (error) {
      setDownloadResult({
        success: false,
        message: 'Failed to download database. Please try again.',
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.mmdb')) {
      setUploadStatus('error')
      setUploadMessage('Invalid file type. Please upload a .mmdb file.')
      return
    }

    setUploading(true)
    setUploadStatus('idle')
    setUploadMessage('')

    try {
      const formData = new FormData()
      formData.append('database', file)

      const response = await fetch('/api/geoip/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUploadStatus('success')
        setUploadMessage(data.message || 'Database uploaded successfully')
        // Update the path setting to point to the uploaded file
        if (data.path) {
          updateSetting('geoipMaxmindPath', data.path)
        }
      } else {
        setUploadStatus('error')
        setUploadMessage(data.error || 'Failed to upload database')
      }
    } catch (error) {
      setUploadStatus('error')
      setUploadMessage('Failed to upload database. Please try again.')
    } finally {
      setUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GeoIP Configuration</CardTitle>
        <CardDescription>
          Configure geographic location lookup for visitor analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="geoipEnabled">Enable GeoIP Lookup</Label>
            <p className="text-sm text-muted-foreground">
              Enrich pageview analytics with geographic location data
            </p>
          </div>
          <Switch
            id="geoipEnabled"
            checked={settings.geoipEnabled}
            onCheckedChange={(checked) => updateSetting('geoipEnabled', checked)}
          />
        </div>

        {settings.geoipEnabled && (
          <>
            <div>
              <Label htmlFor="geoipProvider">GeoIP Provider</Label>
              <Select
                value={settings.geoipProvider}
                onValueChange={(value: 'maxmind' | 'ipinfo' | 'chain') => updateSetting('geoipProvider', value)}
              >
                <SelectTrigger id="geoipProvider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maxmind">MaxMind GeoLite2 (Recommended)</SelectItem>
                  <SelectItem value="ipinfo">ipinfo.io API</SelectItem>
                  <SelectItem value="chain">Chain (MaxMind with ipinfo.io fallback)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                MaxMind uses a local database file. ipinfo.io is an online API service.
              </p>
            </div>

            {(settings.geoipProvider === 'maxmind' || settings.geoipProvider === 'chain') && (
              <>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-base font-semibold text-foreground">MaxMind Settings</h3>
                  </div>
                </div>

                <div>
                  <Label htmlFor="geoipMaxmindPath">Database File Path</Label>
                  <Input
                    id="geoipMaxmindPath"
                    value={settings.geoipMaxmindPath}
                    onChange={(e) => updateSetting('geoipMaxmindPath', e.target.value)}
                    placeholder="./data/GeoLite2-City.mmdb"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Path to the MaxMind database file (.mmdb)
                  </p>
                </div>

                <div>
                  <Label>Upload Database File</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".mmdb"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="mmdb-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="gap-2"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload .mmdb File'}
                    </Button>
                    {uploadStatus === 'success' && (
                      <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>{uploadMessage}</span>
                      </div>
                    )}
                    {uploadStatus === 'error' && (
                      <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        <span>{uploadMessage}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload your own MaxMind database file (GeoLite2 or GeoIP2). Supports both City and Country databases.
                  </p>
                </div>

                {/* MaxMind Test Connection */}
                {settings.geoipProvider === 'maxmind' && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => testConnection('maxmind')}
                        disabled={testing !== null}
                        className="gap-2"
                      >
                        <ArrowPathIcon className={`h-4 w-4 ${testing === 'maxmind' ? 'animate-spin' : ''}`} />
                        {testing === 'maxmind' ? 'Testing...' : 'Test MaxMind Connection'}
                      </Button>
                    </div>
                    {testResult && testResult.provider === 'maxmind' && (
                      <div className={`mt-3 p-3 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                        <div className="flex items-center gap-2">
                          {testResult.success ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                          <span className={`font-medium ${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            {testResult.message}
                          </span>
                        </div>
                        {testResult.details && (
                          <div className="mt-2 text-sm text-muted-foreground space-y-1">
                            {testResult.details.path && (
                              <div>Path: <code className="text-xs bg-muted px-1 py-0.5 rounded">{testResult.details.path}</code></div>
                            )}
                            {testResult.details.fileSize && (
                              <div>Size: {testResult.details.fileSize}</div>
                            )}
                            {testResult.details.modifiedDate && (
                              <div>Last Updated: {testResult.details.modifiedDate}</div>
                            )}
                            {testResult.details.testLookup && (
                              <div>Test Lookup (8.8.8.8): {testResult.details.testLookup.city}, {testResult.details.testLookup.country}</div>
                            )}
                            {testResult.details.hint && (
                              <div className="text-amber-600 dark:text-amber-400">{testResult.details.hint}</div>
                            )}
                          </div>
                        )}
                        {/* Download button when database not found */}
                        {!testResult.success && testResult.message.toLowerCase().includes('not found') && (
                          <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                            <p className="text-sm text-muted-foreground mb-2">
                              {settings.geoipMaxmindAccountId && settings.geoipMaxmindLicenseKey
                                ? 'Click below to download the GeoLite2-City database using your MaxMind credentials.'
                                : 'Enter your MaxMind Account ID and License Key above, then click download.'}
                            </p>
                            <Button
                              variant="outline"
                              onClick={downloadDatabase}
                              disabled={downloading || !settings.geoipMaxmindAccountId || !settings.geoipMaxmindLicenseKey}
                              className="gap-2"
                            >
                              <ArrowDownTrayIcon className={`h-4 w-4 ${downloading ? 'animate-bounce' : ''}`} />
                              {downloading ? 'Downloading...' : 'Download GeoLite2-City Database'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Download result */}
                    {downloadResult && (
                      <div className={`mt-3 p-3 rounded-lg ${downloadResult.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                        <div className="flex items-center gap-2">
                          {downloadResult.success ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                          <span className={`font-medium ${downloadResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            {downloadResult.message}
                          </span>
                        </div>
                        {downloadResult.success && downloadResult.path && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Installed to: <code className="text-xs bg-muted px-1 py-0.5 rounded">{downloadResult.path}</code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="w-1 h-5 bg-muted-foreground/30 rounded-full" />
                    <h4 className="text-sm font-medium text-muted-foreground">Auto-Update Configuration (Optional)</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Enter your MaxMind account credentials to enable automatic database updates.
                  </p>
                </div>

                <div>
                  <Label htmlFor="geoipMaxmindAccountId">Account ID</Label>
                  <Input
                    id="geoipMaxmindAccountId"
                    value={settings.geoipMaxmindAccountId}
                    onChange={(e) => updateSetting('geoipMaxmindAccountId', e.target.value)}
                    placeholder="Your MaxMind account ID"
                  />
                </div>

                <div>
                  <Label htmlFor="geoipMaxmindLicenseKey">License Key</Label>
                  <Input
                    id="geoipMaxmindLicenseKey"
                    type="password"
                    value={settings.geoipMaxmindLicenseKey}
                    onChange={(e) => updateSetting('geoipMaxmindLicenseKey', e.target.value)}
                    placeholder="Your MaxMind license key"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get credentials from{' '}
                    <a
                      href="https://www.maxmind.com/en/geolite2/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      MaxMind GeoLite2
                    </a>
                    {' '}(free) or{' '}
                    <a
                      href="https://www.maxmind.com/en/geoip2-databases"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      MaxMind GeoIP2
                    </a>
                    {' '}(paid, higher accuracy)
                  </p>
                </div>
              </>
            )}

            {(settings.geoipProvider === 'ipinfo' || settings.geoipProvider === 'chain') && (
              <>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-base font-semibold text-foreground">ipinfo.io Settings</h3>
                  </div>
                </div>

                <div>
                  <Label htmlFor="geoipIpinfoToken">API Token</Label>
                  <Input
                    id="geoipIpinfoToken"
                    type="password"
                    value={settings.geoipIpinfoToken}
                    onChange={(e) => updateSetting('geoipIpinfoToken', e.target.value)}
                    placeholder="Your ipinfo.io API token"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get a free API token from{' '}
                    <a
                      href="https://ipinfo.io/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      ipinfo.io
                    </a>
                    {' '}(50,000 lookups/month free)
                  </p>
                </div>

                {/* ipinfo Test Connection */}
                {settings.geoipProvider === 'ipinfo' && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => testConnection('ipinfo')}
                        disabled={testing !== null || !settings.geoipIpinfoToken}
                        className="gap-2"
                      >
                        <ArrowPathIcon className={`h-4 w-4 ${testing === 'ipinfo' ? 'animate-spin' : ''}`} />
                        {testing === 'ipinfo' ? 'Testing...' : 'Test ipinfo.io Connection'}
                      </Button>
                    </div>
                    {testResult && testResult.provider === 'ipinfo' && (
                      <div className={`mt-3 p-3 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                        <div className="flex items-center gap-2">
                          {testResult.success ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                          <span className={`font-medium ${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            {testResult.message}
                          </span>
                        </div>
                        {testResult.details && (
                          <div className="mt-2 text-sm text-muted-foreground space-y-1">
                            {testResult.details.testLookup && (
                              <div>Test Lookup (8.8.8.8): {testResult.details.testLookup.city}, {testResult.details.testLookup.country}</div>
                            )}
                            {testResult.details.usage && testResult.details.usage.limit && (
                              <div className="mt-2 p-2 bg-muted/50 rounded">
                                <div className="font-medium text-foreground mb-1">Monthly Usage</div>
                                {testResult.details.usage.used !== null ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            (testResult.details.usage.used / testResult.details.usage.limit) > 0.9
                                              ? 'bg-red-500'
                                              : (testResult.details.usage.used / testResult.details.usage.limit) > 0.7
                                              ? 'bg-amber-500'
                                              : 'bg-green-500'
                                          }`}
                                          style={{ width: `${Math.min(100, (testResult.details.usage.used / testResult.details.usage.limit) * 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-xs">
                                        {((testResult.details.usage.used / testResult.details.usage.limit) * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="text-xs mt-1">
                                      {testResult.details.usage.used.toLocaleString()} used / {testResult.details.usage.limit.toLocaleString()} limit
                                      {testResult.details.usage.remaining && (
                                        <span className="text-green-600 dark:text-green-400"> ({testResult.details.usage.remaining.toLocaleString()} remaining)</span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs">Limit: {testResult.details.usage.limit.toLocaleString()} lookups/month</div>
                                )}
                              </div>
                            )}
                            {testResult.details.hint && (
                              <div className="text-amber-600 dark:text-amber-400">{testResult.details.hint}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Chain Mode Test */}
            {settings.geoipProvider === 'chain' && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 pb-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-base font-semibold text-foreground">Test Both Providers</h3>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => testConnection('chain')}
                    disabled={testing !== null}
                    className="gap-2"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${testing === 'chain' ? 'animate-spin' : ''}`} />
                    {testing === 'chain' ? 'Testing...' : 'Test Both Providers'}
                  </Button>
                </div>
                {testResult && testResult.provider === 'chain' && testResult.results && (
                  <div className="mt-3 space-y-3">
                    {/* MaxMind Result */}
                    <div className={`p-3 rounded-lg ${testResult.results.maxmind.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center gap-2">
                        {testResult.results.maxmind.success ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`font-medium ${testResult.results.maxmind.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          MaxMind: {testResult.results.maxmind.message}
                        </span>
                      </div>
                      {testResult.results.maxmind.details?.testLookup && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          Test: {testResult.results.maxmind.details.testLookup.city}, {testResult.results.maxmind.details.testLookup.country}
                        </div>
                      )}
                      {/* Download button when MaxMind database not found in chain mode */}
                      {!testResult.results.maxmind.success && testResult.results.maxmind.message.toLowerCase().includes('not found') && (
                        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                          <p className="text-sm text-muted-foreground mb-2">
                            {settings.geoipMaxmindAccountId && settings.geoipMaxmindLicenseKey
                              ? 'Click below to download the GeoLite2-City database using your MaxMind credentials.'
                              : 'Enter your MaxMind Account ID and License Key above, then click download.'}
                          </p>
                          <Button
                            variant="outline"
                            onClick={downloadDatabase}
                            disabled={downloading || !settings.geoipMaxmindAccountId || !settings.geoipMaxmindLicenseKey}
                            className="gap-2"
                          >
                            <ArrowDownTrayIcon className={`h-4 w-4 ${downloading ? 'animate-bounce' : ''}`} />
                            {downloading ? 'Downloading...' : 'Download GeoLite2-City Database'}
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* ipinfo Result */}
                    <div className={`p-3 rounded-lg ${testResult.results.ipinfo.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center gap-2">
                        {testResult.results.ipinfo.success ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`font-medium ${testResult.results.ipinfo.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          ipinfo.io: {testResult.results.ipinfo.message}
                        </span>
                      </div>
                      {testResult.results.ipinfo.details?.usage && testResult.results.ipinfo.details.usage.used !== null && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          Usage: {testResult.results.ipinfo.details.usage.used.toLocaleString()} / {testResult.results.ipinfo.details.usage.limit.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Download result for chain mode */}
                {downloadResult && (
                  <div className={`mt-3 p-3 rounded-lg ${downloadResult.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                    <div className="flex items-center gap-2">
                      {downloadResult.success ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className={`font-medium ${downloadResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {downloadResult.message}
                      </span>
                    </div>
                    {downloadResult.success && downloadResult.path && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Installed to: <code className="text-xs bg-muted px-1 py-0.5 rounded">{downloadResult.path}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="geoipCacheDuration">Cache Duration (seconds)</Label>
              <Input
                id="geoipCacheDuration"
                type="number"
                min="0"
                value={settings.geoipCacheDuration}
                onChange={(e) => updateSetting('geoipCacheDuration', parseInt(e.target.value) || 86400)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long to cache GeoIP lookups (default: 86400 = 24 hours)
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>

    {/* Application Logging */}
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Application Logging</CardTitle>
        <CardDescription>
          Control what gets logged to the Application Log
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="logLevel">Log Level</Label>
          <Select
            value={settings.logLevel}
            onValueChange={(value: 'error' | 'warn' | 'info' | 'debug') => updateSetting('logLevel', value)}
          >
            <SelectTrigger id="logLevel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="error">Error - Only errors</SelectItem>
              <SelectItem value="warn">Warn - Warnings and errors</SelectItem>
              <SelectItem value="info">Info - General info, warnings, and errors (recommended)</SelectItem>
              <SelectItem value="debug">Debug - Everything including debug messages</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Info</strong> is recommended for comprehensive logging of authentication, GeoIP lookups, and API operations.
            Change takes effect immediately without restart.
          </p>
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">What gets logged at each level:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Debug:</strong> All activity including detailed diagnostics</li>
              <li><strong>Info:</strong> Login attempts, GeoIP lookups, API calls, system operations</li>
              <li><strong>Warn:</strong> Failed operations, security warnings, rate limits</li>
              <li><strong>Error:</strong> Critical failures only</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
