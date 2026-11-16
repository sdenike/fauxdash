'use client'

import { useState, type ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export type Density = 'compact' | 'comfortable'

export interface LinkItem {
  id: number
  name: string
  url: string
  description: string | null
  icon: ReactNode
}

interface LinkGroupProps {
  kind: 'bookmarks' | 'services'
  title: string
  icon: ReactNode
  items: LinkItem[]
  density: Density
  itemsToShow: number | null
  showItemCount: boolean
  autoExpanded: boolean
  showOpenAll: boolean
}

// Count a click without delaying the navigation. sendBeacon survives the page being left.
function trackClick(kind: LinkGroupProps['kind'], id: number) {
  const url = `/api/${kind}/${id}/click`
  try {
    if (navigator.sendBeacon?.(url)) return
  } catch {
    // fall through to fetch
  }
  fetch(url, { method: 'POST', keepalive: true }).catch(() => {})
}

const ROW: Record<Density, string> = {
  compact: 'gap-2.5 px-2 py-1.5 coarse:min-h-11',
  comfortable: 'gap-3 px-2 py-2 coarse:min-h-12',
}
const NAME: Record<Density, string> = {
  compact: 'text-sm',
  comfortable: 'text-[15px]',
}
const ICON_BOX: Record<Density, string> = {
  compact: 'h-5 w-5',
  comfortable: 'h-7 w-7',
}

/** One titled group of links (a bookmark category or a service category) on the start page. */
export function LinkGroup({
  kind,
  title,
  icon,
  items,
  density,
  itemsToShow,
  showItemCount,
  autoExpanded,
  showOpenAll,
}: LinkGroupProps) {
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(autoExpanded)

  if (items.length === 0) return null

  const limit = itemsToShow && itemsToShow > 0 ? itemsToShow : null
  const canExpand = limit !== null && items.length > limit
  const shown = canExpand && !expanded ? items.slice(0, limit!) : items
  const hidden = items.length - shown.length

  const openAll = () => {
    let blocked = 0
    for (const item of items) {
      trackClick(kind, item.id)
      const win = window.open(item.url, '_blank', 'noopener,noreferrer')
      if (!win) blocked++
    }
    // noopener makes window.open return null in some browsers even when it worked, so only
    // report a block when nothing at all could be opened.
    if (blocked === items.length && items.length > 1) {
      toast({
        title: 'Pop-ups are blocked',
        description: `Allow pop-ups for this site to open all ${items.length} links at once.`,
        variant: 'destructive',
      })
    }
  }

  const headingId = `${kind}-group-${title.replace(/\W+/g, '-').toLowerCase()}`

  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <div className="mb-1.5 flex items-center gap-2 px-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 id={headingId} className="truncate text-sm font-semibold text-foreground">
          {title}
        </h3>
        {showItemCount && (
          <span className="tabular text-xs text-muted-foreground">{items.length}</span>
        )}
        {showOpenAll && items.length > 1 && (
          <button
            type="button"
            onClick={openAll}
            className="ml-auto inline-flex h-7 w-7 coarse:h-10 coarse:w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={`Open all ${items.length} links in ${title}`}
            title="Open all in new tabs"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <ul className="flex flex-col">
        {shown.map((item) => (
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(kind, item.id)}
              className={cn(
                'group flex min-w-0 rounded-md transition-colors hover:bg-accent',
                ROW[density],
                item.description ? 'items-start' : 'items-center',
              )}
            >
              {item.icon && (
                <span className={cn('flex shrink-0 items-center justify-center text-foreground/80', ICON_BOX[density])}>
                  {item.icon}
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className={cn('truncate font-medium leading-snug text-foreground', NAME[density])}>
                  {item.name}
                </span>
                {item.description && (
                  <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{item.description}</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-0.5 rounded-md px-2 py-1 coarse:py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {expanded ? 'Show fewer' : `Show ${hidden} more`}
        </button>
      )}
    </section>
  )
}
