'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, RefreshCw, Play, Pause } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { AdminPage, AdminSection, AdminLoading } from '@/components/admin/admin-page'

interface LogLine {
  raw: string
  timestamp?: string
  level?: string
  category?: string
  message?: string
}

function parseLogLine(line: string): LogLine {
  // Parse format: [2024-01-27T12:00:00.000Z] [INFO ] [CATEGORY] Message
  const match = line.match(/^\[([^\]]+)\]\s*\[(\w+)\s*\]\s*\[([^\]]+)\]\s*(.*)$/)
  if (match) {
    return {
      raw: line,
      timestamp: match[1],
      level: match[2].trim().toLowerCase(),
      category: match[3],
      message: match[4]
    }
  }
  return { raw: line }
}

function getLevelColor(level?: string): string {
  switch (level) {
    case 'error': return 'text-destructive'
    case 'warn': return 'text-warning'
    case 'info': return 'text-info'
    case 'debug': return 'text-muted-foreground'
    default: return 'text-foreground'
  }
}

function getLevelBgColor(level?: string): string {
  switch (level) {
    case 'error': return 'bg-destructive-soft'
    case 'warn': return 'bg-warning-soft'
    default: return ''
  }
}

export default function LogsPage() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [logs, setLogs] = useState<LogLine[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState('5')
  const [lineCount, setLineCount] = useState('500')
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/logs?lines=${lineCount}`)
      const data = await response.json()

      if (data.success && data.logs) {
        const parsedLogs = data.logs.map((line: string) => parseLogLine(line))
        setLogs(parsedLogs)

        // Auto-scroll to bottom if enabled
        if (autoScroll && logContainerRef.current) {
          setTimeout(() => {
            if (logContainerRef.current) {
              logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
            }
          }, 100)
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }, [lineCount, autoScroll])

  // Initial fetch
  useEffect(() => {
    const run = async () => {
      await fetchLogs()
    }
    run()
  }, [fetchLogs])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchLogs, parseInt(refreshInterval) * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchLogs])

  const handleClearLogs = async () => {
    if (!(await confirm({
      title: 'Clear all logs?',
      description: 'Every log entry is deleted. This cannot be undone.',
      confirmLabel: 'Clear logs',
      destructive: true,
    }))) return
    try {
      const response = await fetch('/api/logs', { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        setLogs([])
        toast({
          variant: 'success',
          title: 'Logs cleared',
          description: 'All log entries were removed.'
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Could not clear logs',
        description: error.message || 'The server did not respond. Try again.'
      })
    }
  }

  const handleManualRefresh = () => {
    setLoading(true)
    fetchLogs()
  }

  return (
    <AdminPage
      title="Logs"
      description="Application logs, colored by severity."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={loading}>
            <RefreshCw aria-hidden="true" className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearLogs}>
            <Trash2 aria-hidden="true" className="h-4 w-4 mr-2" />
            Clear logs
          </Button>
        </>
      }
    >
      <AdminSection>
        <div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="auto-refresh" className="flex items-center gap-1">
                {autoRefresh ? (
                  <Play aria-hidden="true" className="h-4 w-4 text-success" />
                ) : (
                  <Pause aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                )}
                Auto-refresh
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Label>Interval:</Label>
              <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 sec</SelectItem>
                  <SelectItem value="2">2 sec</SelectItem>
                  <SelectItem value="3">3 sec</SelectItem>
                  <SelectItem value="5">5 sec</SelectItem>
                  <SelectItem value="10">10 sec</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>Lines:</Label>
              <Select value={lineCount} onValueChange={setLineCount}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="auto-scroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
              <Label htmlFor="auto-scroll">Auto-scroll</Label>
            </div>
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="Log output"
        description={`${logs.length} log entries loaded`}
        actions={
          autoRefresh ? (
            <span className="text-xs text-success flex items-center gap-1">
              <span className="h-2 w-2 bg-success rounded-full animate-pulse" />
              Live
            </span>
          ) : undefined
        }
      >
        <div
          ref={logContainerRef}
          className="bg-background rounded-lg p-4 h-[600px] overflow-auto font-mono text-sm border border-border"
        >
          {loading && logs.length === 0 ? (
            <AdminLoading rows={5} label="Loading logs" />
          ) : logs.length === 0 ? (
            <div className="text-muted-foreground">No log entries yet. Entries appear here as the application runs.</div>
          ) : (
            <div className="space-y-0.5">
              {logs.map((log, index) => (
                <div key={index} className={`py-0.5 px-1 rounded ${getLevelBgColor(log.level)} hover:bg-muted`}>
                  {log.timestamp ? (
                    <span className="flex flex-wrap gap-x-2">
                      <span className="text-muted-foreground shrink-0">
                        [{new Date(log.timestamp).toLocaleString()}]
                      </span>
                      <span className={`font-semibold shrink-0 ${getLevelColor(log.level)}`}>
                        [{log.level?.toUpperCase().padEnd(5)}]
                      </span>
                      <span className="text-brand shrink-0">[{log.category}]</span>
                      <span className="text-foreground break-all">{log.message}</span>
                    </span>
                  ) : (
                    <span className="text-foreground">{log.raw}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminSection>

      <AdminSection title="Log level legend">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-destructive font-mono">ERROR</span>
            <span className="text-muted-foreground">- Application errors</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-warning font-mono">WARN</span>
            <span className="text-muted-foreground">- Warnings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-info" />
            <span className="text-info font-mono">INFO</span>
            <span className="text-muted-foreground">- Information</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground font-mono">DEBUG</span>
            <span className="text-muted-foreground">- Debug info</span>
          </div>
        </div>
      </AdminSection>
    </AdminPage>
  )
}
