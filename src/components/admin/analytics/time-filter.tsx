'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type Period = 'day' | 'week' | 'month' | 'year'
export type DataType = 'all' | 'bookmarks' | 'services'

interface TimeFilterProps {
  period: Period
  onPeriodChange: (period: Period) => void
  dataType: DataType
  onDataTypeChange: (type: DataType) => void
}

export function TimeFilter({
  period,
  onPeriodChange,
  dataType,
  onDataTypeChange,
}: TimeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Period:</span>
        <div className="flex gap-1">
          {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
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
