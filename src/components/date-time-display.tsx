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
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // The server rendered its own clock; switch to the browser's straight away (time zone may differ).
    const initial = setTimeout(() => setCurrentDateTime(new Date()), 0)
    // Update time regularly (every second if showing seconds, otherwise every minute)
    const interval = setInterval(() => {
      setCurrentDateTime(new Date())
    }, showSeconds && timeEnabled ? 1000 : 60000)

    return () => {
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [timeEnabled, showSeconds])

  const dateText = formatDate(currentDateTime, dateFormat)
  const timeText = timeEnabled ? formatTime(currentDateTime, timeFormat, showSeconds) : ''
  const fullText = timeEnabled ? `${dateText} ${timeText}` : dateText

  if (displayMode === 'icon') {
    return (
      // iOS Safari does not focus a button on tap, so the details open from state, not :focus.
      <div
        className="relative group"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}
        onBlur={() => setOpen(false)}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={fullText}
          className="inline-flex items-center justify-center h-9 w-9 coarse:h-11 coarse:w-11 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Clock aria-hidden="true" className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
        <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-popover border border-border rounded-md shadow-[0_8px_24px_-6px_rgb(0_0_0/0.18)] transition-opacity duration-200 whitespace-nowrap z-50 min-w-[180px] ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <div>
              {timeEnabled && (
                <div className="tabular text-lg font-semibold text-popover-foreground" suppressHydrationWarning>
                  {timeText}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {timeEnabled ? 'Current time' : 'Date'}
              </div>
            </div>
          </div>
          <div className="text-sm text-popover-foreground font-medium" suppressHydrationWarning>
            {dateText}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-popover border-l border-t border-border rotate-45" />
        </div>
      </div>
    )
  }

  return (
    <div className="tabular text-sm text-muted-foreground" suppressHydrationWarning>
      {dateText}
      {timeEnabled && (
        <span className="ml-2" suppressHydrationWarning>{timeText}</span>
      )}
    </div>
  )
}
