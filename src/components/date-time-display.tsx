'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/datetime'

interface DateTimeDisplayProps {
  dateFormat: string
  timeEnabled: boolean
  timeFormat: '12' | '24'
  showSeconds: boolean
  displayMode?: 'text' | 'icon'
}

export function DateTimeDisplay({
  dateFormat,
  timeEnabled,
  timeFormat,
  showSeconds,
  displayMode = 'text'
}: DateTimeDisplayProps) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  useEffect(() => {
    // Update time regularly (every second if showing seconds, otherwise every minute)
    const interval = setInterval(() => {
      setCurrentDateTime(new Date())
    }, showSeconds && timeEnabled ? 1000 : 60000)

    return () => clearInterval(interval)
  }, [timeEnabled, showSeconds])

  const dateText = formatDate(currentDateTime, dateFormat)
  const timeText = timeEnabled ? formatTime(currentDateTime, timeFormat, showSeconds) : ''
  const fullText = timeEnabled ? `${dateText} ${timeText}` : dateText

  if (displayMode === 'icon') {
    return (
      <div className="relative group">
        <div className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
          <Clock className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 min-w-[180px]">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-10 w-10 text-muted-foreground" />
            <div>
              {timeEnabled && (
                <div className="text-lg font-bold text-popover-foreground">
                  {timeText}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {timeEnabled ? 'Current Time' : 'Date'}
              </div>
            </div>
          </div>
          <div className="text-sm text-popover-foreground font-medium">
            {dateText}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-popover border-l border-t border-border rotate-45" />
        </div>
      </div>
    )
  }

  return (
    <div className="text-sm text-muted-foreground">
      {dateText}
      {timeEnabled && (
        <span className="ml-2">{timeText}</span>
      )}
    </div>
  )
}
