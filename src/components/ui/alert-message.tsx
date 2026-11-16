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
    container: 'text-destructive bg-destructive-soft border border-destructive/30',
    icon: AlertCircle,
  },
  success: {
    container: 'text-success bg-success-soft border border-success/30',
    icon: CheckCircle2,
  },
  warning: {
    container: 'text-warning bg-warning-soft border border-warning/30',
    icon: AlertTriangle,
  },
  info: {
    container: 'text-info bg-info-soft border border-info/30',
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
