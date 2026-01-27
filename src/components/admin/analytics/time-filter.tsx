'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from '@heroicons/react/24/outline'

export type Period = 'hour' | 'day' | 'week' | 'month' | 'year' | 'custom'
export type DataType = 'all' | 'bookmarks' | 'services'

interface TimeFilterProps {
  period: Period
  onPeriodChange: (period: Period) => void
  dataType: DataType
  onDataTypeChange: (type: DataType) => void
  customStartDate?: string
  customEndDate?: string
  onCustomDateChange?: (start: string, end: string) => void
}

export function TimeFilter({
  period,
  onPeriodChange,
  dataType,
  onDataTypeChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: TimeFilterProps) {
  const [startDate, setStartDate] = useState(customStartDate || '')
  const [endDate, setEndDate] = useState(customEndDate || '')

  const handleCustomApply = () => {
    if (startDate && endDate && onCustomDateChange) {
      onCustomDateChange(startDate, endDate)
      onPeriodChange('custom')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Period:</span>
        <div className="flex gap-1">
          {(['hour', 'day', 'week', 'month', 'year'] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onPeriodChange(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={period === 'custom' ? 'secondary' : 'ghost'}
                size="sm"
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleCustomApply} className="w-full">
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Data type selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show:</span>
        <Select value={dataType} onValueChange={(v) => onDataTypeChange(v as DataType)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="bookmarks">Bookmarks</SelectItem>
            <SelectItem value="services">Services</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
