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
import { AdminSection } from '@/components/admin/admin-page'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { BarChart3, LineChart as LineChartIcon } from 'lucide-react'

interface ClicksChartProps {
  labels: string[]
  datasets: { label: string; data: number[] }[]
  chartType: 'line' | 'bar'
  onChartTypeChange: (type: 'line' | 'bar') => void
  isLoading?: boolean
}

// Chart colors come from the design tokens (CSS variables resolve in SVG presentation attributes)
const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

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
      <AdminSection>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
          <Skeleton className="h-[300px] w-full" />
        </AdminSection>
    )
  }

  if (!chartData.length) {
    return (
      <AdminSection title="Clicks over time" actions={<ChartTypeToggle chartType={chartType} onChange={onChartTypeChange} />}>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No clicks recorded for this period
          </div>
        </AdminSection>
    )
  }

  return (
    <AdminSection title="Clicks over time" actions={<ChartTypeToggle chartType={chartType} onChange={onChartTypeChange} />}>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
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
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
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
      </AdminSection>
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
        type="button"
        aria-label="Line chart"
        aria-pressed={chartType === 'line'}
        onClick={() => onChange('line')}
      >
        <LineChartIcon aria-hidden="true" className="h-4 w-4" />
      </Button>
      <Button
        variant={chartType === 'bar' ? 'secondary' : 'ghost'}
        size="icon"
        type="button"
        aria-label="Bar chart"
        aria-pressed={chartType === 'bar'}
        onClick={() => onChange('bar')}
      >
        <BarChart3 aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  )
}
