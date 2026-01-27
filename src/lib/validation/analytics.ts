import { z } from 'zod'

/**
 * Validation schemas for Analytics API endpoints
 */

export const ClicksQuerySchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month', 'year', 'custom']).default('week'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['bookmarks', 'services', 'all']).default('all'),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  downsample: z.coerce.number().min(50).max(500).default(150),
})

export type ClicksQuery = z.infer<typeof ClicksQuerySchema>

export const GeoQuerySchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month', 'year', 'custom', 'all']).default('month'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  level: z.enum(['country', 'city']).default('country'),
  limit: z.coerce.number().min(1).max(1000).default(100),
})

export type GeoQuery = z.infer<typeof GeoQuerySchema>

export const TopItemsQuerySchema = z.object({
  type: z.enum(['bookmarks', 'services']),
  period: z.enum(['hour', 'day', 'week', 'month', 'year', 'custom']).default('week'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
})

export type TopItemsQuery = z.infer<typeof TopItemsQuerySchema>

export const HeatmapQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year', 'custom']).default('month'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['bookmarks', 'services', 'pageviews', 'all']).default('all'),
})

export type HeatmapQuery = z.infer<typeof HeatmapQuerySchema>

export const StatsQuerySchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month', 'year', 'custom']).default('week'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type StatsQuery = z.infer<typeof StatsQuerySchema>
