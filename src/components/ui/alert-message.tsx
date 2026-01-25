'use client'

import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

interface AlertMessageProps {
  variant: AlertVariant
  message: string
  className?: string
}

const variantStyles: Record<AlertVariant, { container: string; icon: typeof AlertCircle }> = {
  error: {
    container: 'text-destructive-foreground bg-destructive',
    icon: AlertCircle,
  },
  success: {
    container: 'text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900/50 border border-green-200 dark:border-green-800',
    icon: CheckCircle2,
  },
  warning: {
    container: 'text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800',
    icon: AlertTriangle,
  },
  info: {
    container: 'text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800',
    icon: Info,
  },
}

export function AlertMessage({ variant, message, className }: AlertMessageProps) {
  const { container, icon: Icon } = variantStyles[variant]
  const role = variant === 'error' ? 'alert' : 'status'
  const ariaLive = variant === 'error' ? 'assertive' : 'polite'

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={cn(
        'flex items-center gap-2 p-3 text-sm rounded-md animate-in fade-in slide-in-from-top-1 duration-200',
        container,
        className
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
