'use client'

import { useState, useEffect } from 'react'
import { Input } from './ui/input'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const SEARCH_ENGINES = {
  duckduckgo: { url: 'https://duckduckgo.com/?q=', name: 'DuckDuckGo' },
  google: { url: 'https://www.google.com/search?q=', name: 'Google' },
  brave: { url: 'https://search.brave.com/search?q=', name: 'Brave' },
  kagi: { url: 'https://kagi.com/search?q=', name: 'Kagi' },
  startpage: { url: 'https://www.startpage.com/do/search?q=', name: 'Startpage' },
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [searchEngine, setSearchEngine] = useState<keyof typeof SEARCH_ENGINES | 'custom'>('duckduckgo')
  const [customSearchName, setCustomSearchName] = useState('')
  const [customSearchUrl, setCustomSearchUrl] = useState('')

  useEffect(() => {
    // Fetch user's search engine preference
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (data.searchEngine) {
          setSearchEngine(data.searchEngine)
          if (data.searchEngine === 'custom') {
            setCustomSearchName(data.customSearchName || 'Custom Search')
            setCustomSearchUrl(data.customSearchUrl || '')
          }
        }
      } catch (error) {
        console.error('Failed to fetch search engine setting:', error)
      }
    }
    fetchSettings()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    let searchUrl = ''
    if (searchEngine === 'custom') {
      searchUrl = customSearchUrl + encodeURIComponent(query)
    } else {
      const engine = SEARCH_ENGINES[searchEngine as keyof typeof SEARCH_ENGINES]
      searchUrl = engine.url + encodeURIComponent(query)
    }

    window.open(searchUrl, '_blank')
    setQuery('')
  }

  const engineName = searchEngine === 'custom'
    ? customSearchName
    : SEARCH_ENGINES[searchEngine as keyof typeof SEARCH_ENGINES].name

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative bg-card border rounded-md">
        <div className="flex items-center px-3 py-2">
          <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
          <Input
            type="text"
            placeholder={`Search ${engineName}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0"
          />
        </div>
      </div>
    </form>
  )
}
