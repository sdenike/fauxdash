'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const ENGINES: Record<string, { url: string; name: string }> = {
  duckduckgo: { url: 'https://duckduckgo.com/?q=', name: 'DuckDuckGo' },
  google: { url: 'https://www.google.com/search?q=', name: 'Google' },
  brave: { url: 'https://search.brave.com/search?q=', name: 'Brave' },
  kagi: { url: 'https://kagi.com/search?q=', name: 'Kagi' },
  startpage: { url: 'https://www.startpage.com/do/search?q=', name: 'Startpage' },
}

export interface SearchConfig {
  engine: string
  customName: string
  customUrl: string
}

/** Web search box. Press "/" anywhere on the page to jump to it. */
export function SearchBar({ config, className }: { config: SearchConfig; className?: string }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const custom = config.engine === 'custom' && config.customUrl
  const engine = custom
    ? { url: config.customUrl, name: config.customName }
    : ENGINES[config.engine] || ENGINES.duckduckgo

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    window.open(engine.url + encodeURIComponent(q), '_blank', 'noopener,noreferrer')
    setQuery('')
  }

  return (
    <form role="search" onSubmit={submit} className={cn('w-full', className)}>
      <label htmlFor="start-search" className="sr-only">
        Search {engine.name}
      </label>
      <div className="flex h-10 coarse:h-11 items-center gap-2 rounded-lg border border-input bg-card px-3 transition-colors focus-within:border-ring">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          id="start-search"
          type="search"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={`Search ${engine.name}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        <kbd className="hidden rounded border border-border px-1.5 text-[11px] font-medium text-muted-foreground sm:inline coarse:hidden">
          /
        </kbd>
      </div>
    </form>
  )
}
