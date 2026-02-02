'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DocumentTextIcon,
  TrashIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/use-toast'

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
    case 'error': return 'text-red-500'
    case 'warn': return 'text-yellow-500'
    case 'info': return 'text-blue-400'
    case 'debug': return 'text-gray-500'
    default: return 'text-gray-300'
  }
}

function getLevelBgColor(level?: string): string {
  switch (level) {
    case 'error': return 'bg-red-500/10'
    case 'warn': return 'bg-yellow-500/10'
    default: return ''
  }
}

export default function LogsPage() {
  const { toast } = useToast()
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
    fetchLogs()
  }, [fetchLogs])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchLogs, parseInt(refreshInterval) * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchLogs])

  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/logs', { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        setLogs([])
        toast({
          variant: 'success',
          title: 'Logs cleared',
          description: 'All log entries have been removed'
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to clear logs'
      })
    }
  }

  const handleManualRefresh = () => {
    setLoading(true)
    fetchLogs()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Application Logs
        </h1>
        <p className="text-muted-foreground mt-2">
          View real-time application logs with color-coded severity levels
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="flex items-center gap-1">
                {autoRefresh ? (
                  <PlayIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <PauseIcon className="h-4 w-4 text-muted-foreground" />
                )}
                Auto-refresh
              </Label>
            </div>

            {/* Refresh interval */}
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

            {/* Line count */}
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

            {/* Auto-scroll toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <Label htmlFor="auto-scroll">Auto-scroll</Label>
            </div>

            <div className="flex-1" />

            {/* Action buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearLogs}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5" />
            Log Output
            {autoRefresh && (
              <span className="ml-2 text-xs font-normal text-green-500 flex items-center gap-1">
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {logs.length} log entries loaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={logContainerRef}
            className="bg-background rounded-lg p-4 h-[600px] overflow-auto font-mono text-sm border border-border"
          >
            {loading && logs.length === 0 ? (
              <div className="text-gray-500 animate-pulse">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-gray-500">No log entries found. Logs will appear here as the application runs.</div>
            ) : (
              <div className="space-y-0.5">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`py-0.5 px-1 rounded ${getLevelBgColor(log.level)} hover:bg-white/5`}
                  >
                    {log.timestamp ? (
                      <span className="flex flex-wrap gap-x-2">
                        <span className="text-gray-500 shrink-0">
                          [{new Date(log.timestamp).toLocaleString()}]
                        </span>
                        <span className={`font-semibold shrink-0 ${getLevelColor(log.level)}`}>
                          [{log.level?.toUpperCase().padEnd(5)}]
                        </span>
                        <span className="text-purple-400 shrink-0">
                          [{log.category}]
                        </span>
                        <span className="text-gray-200 break-all">
                          {log.message}
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-300">{log.raw}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Log Level Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-red-500 font-mono">ERROR</span>
              <span className="text-muted-foreground">- Application errors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-yellow-500 font-mono">WARN</span>
              <span className="text-muted-foreground">- Warnings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-400" />
              <span className="text-blue-400 font-mono">INFO</span>
              <span className="text-muted-foreground">- Information</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-gray-500" />
              <span className="text-gray-500 font-mono">DEBUG</span>
              <span className="text-muted-foreground">- Debug info</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
