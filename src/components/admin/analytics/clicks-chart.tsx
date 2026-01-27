'use client'

import { useMemo, memo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChartBarIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline'

interface ClicksChartProps {
  labels: string[]
  datasets: { label: string; data: number[] }[]
  chartType: 'line' | 'bar'
  onChartTypeChange: (type: 'line' | 'bar') => void
  isLoading?: boolean
}

// Chart colors - use actual values since CSS vars don't work in SVG context
const COLORS = [
  '#3b82f6', // Blue (primary)
  '#22c55e', // Green
  '#f59e0b', // Orange/Amber
  '#8b5cf6', // Purple
]

// Memoize to prevent unnecessary re-renders
export const ClicksChart = memo(function ClicksChart({
  labels,
  datasets,
  chartType,
  onChartTypeChange,
  isLoading,
}: ClicksChartProps) {
  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!labels.length) return []

    return labels.map((label, index) => {
      const point: Record<string, any> = { date: label }
      datasets.forEach(ds => {
        point[ds.label] = ds.data[index] || 0
      })
      return point
    })
  }, [labels, datasets])

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clicks Over Time</CardTitle>
          <ChartTypeToggle chartType={chartType} onChange={onChartTypeChange} />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No click data available for this period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Clicks Over Time</CardTitle>
        <ChartTypeToggle chartType={chartType} onChange={onChartTypeChange} />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover, #ffffff)',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              {datasets.map((ds, index) => (
                <Line
                  key={ds.label}
                  type="monotone"
                  dataKey={ds.label}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover, #ffffff)',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              {datasets.map((ds, index) => (
                <Bar
                  key={ds.label}
                  dataKey={ds.label}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

function ChartTypeToggle({
  chartType,
  onChange,
}: {
  chartType: 'line' | 'bar'
  onChange: (type: 'line' | 'bar') => void
}) {
  return (
    <div className="flex gap-1">
      <Button
        variant={chartType === 'line' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onChange('line')}
      >
        <ChartBarSquareIcon className="h-4 w-4" />
      </Button>
      <Button
        variant={chartType === 'bar' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onChange('bar')}
      >
        <ChartBarIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
