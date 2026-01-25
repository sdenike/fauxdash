'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { AVAILABLE_ICONS, ICON_CATEGORIES, getIconByName } from '@/lib/icons'
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useToast } from './ui/use-toast'

interface IconSelectorProps {
  value?: string
  onChange: (iconName: string) => void
  trigger?: React.ReactNode
}

interface SelfhstIcon {
  name: string
  id: string
  category: string
  tags: string
}

export function IconSelector({ value, onChange, trigger }: IconSelectorProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTab, setSelectedTab] = useState<'heroicons' | 'selfhst' | 'url'>('heroicons')
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const [selfhstIcons, setSelfhstIcons] = useState<SelfhstIcon[]>([])
  const [loadingSelfhst, setLoadingSelfhst] = useState(false)
  const [faviconUrl, setFaviconUrl] = useState('')
  const [fetchingFavicon, setFetchingFavicon] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Fetch selfh.st icons when tab is selected with caching
  useEffect(() => {
    if (selectedTab === 'selfhst' && selfhstIcons.length === 0 && !loadingSelfhst) {
      setLoadingSelfhst(true)

      // Check cache first (24 hour TTL)
      const CACHE_KEY = 'selfhst_icons_cache'
      const CACHE_TIMESTAMP_KEY = 'selfhst_icons_cache_timestamp'
      const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

      try {
        const cachedData = localStorage.getItem(CACHE_KEY)
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)

        if (cachedData && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp)
          const now = Date.now()

          // Use cache if it's still valid
          if (now - timestamp < CACHE_TTL) {
            const icons: SelfhstIcon[] = JSON.parse(cachedData)
            setSelfhstIcons(icons)
            setLoadingSelfhst(false)
            return
          }
        }
      } catch (err) {
        console.error('Failed to load cached icons:', err)
      }

      // Fetch fresh data
      fetch('https://cdn.jsdelivr.net/gh/selfhst/icons@latest/index-consolidated.json')
        .then(res => res.json())
        .then((data: string[][]) => {
          const icons: SelfhstIcon[] = data.map(item => ({
            name: item[0],
            id: item[1],
            category: item[7],
            tags: item[8] || '',
          }))
          setSelfhstIcons(icons)

          // Cache the data
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(icons))
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
          } catch (err) {
            console.error('Failed to cache icons:', err)
          }
        })
        .catch(err => {
          console.error('Failed to load selfh.st icons:', err)
        })
        .finally(() => {
          setLoadingSelfhst(false)
        })
    }
  }, [selectedTab, selfhstIcons.length, loadingSelfhst])

  const allFilteredIcons = AVAILABLE_ICONS.filter(icon => {
    try {
      const searchLower = search.toLowerCase()
      const matchesSearch = search === '' ||
        icon.name.toLowerCase().includes(searchLower) ||
        (icon.searchTerms && Array.isArray(icon.searchTerms) && icon.searchTerms.some(term => term && term.includes(searchLower)))
      const matchesCategory = selectedCategory === 'All' || icon.category === selectedCategory
      return matchesSearch && matchesCategory
    } catch (error) {
      console.error('Error filtering icon:', icon.name, error)
      return false
    }
  })

  const filteredSelfhstIcons = selfhstIcons.filter(icon => {
    const searchLower = search.toLowerCase()
    return search === '' ||
      icon.name.toLowerCase().includes(searchLower) ||
      icon.id.toLowerCase().includes(searchLower) ||
      icon.tags.toLowerCase().includes(searchLower)
  })

  const totalCount = selectedTab === 'heroicons' ? allFilteredIcons.length : filteredSelfhstIcons.length
  const filteredIcons = allFilteredIcons.slice(0, 500) // Limit to 500 icons for performance
  const displayedSelfhstIcons = filteredSelfhstIcons.slice(0, 500)
  const hasMore = totalCount > 500

  const allCategories = ['All', ...ICON_CATEGORIES].filter(Boolean)

  const handleSelect = (iconName: string) => {
    onChange(iconName)
    setOpen(false)
  }

  const handleFetchFavicon = async () => {
    if (!faviconUrl) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a favicon URL',
      })
      return
    }

    setFetchingFavicon(true)
    try {
      const response = await fetch('/api/favicons/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: faviconUrl, isDirectFaviconUrl: true }),
      })

      const data = await response.json()

      if (data.success) {
        const newIcon = `favicon:${data.path}`
        onChange(newIcon)
        setOpen(false)
        setFaviconUrl('')

        toast({
          variant: 'success',
          title: 'Favicon fetched',
          description: 'Successfully fetched and saved favicon',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to fetch favicon from URL',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch favicon from URL',
      })
    } finally {
      setFetchingFavicon(false)
    }
  }

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1)
  }

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    checkScrollPosition()
    container.addEventListener('scroll', checkScrollPosition)
    window.addEventListener('resize', checkScrollPosition)

    return () => {
      container.removeEventListener('scroll', checkScrollPosition)
      window.removeEventListener('resize', checkScrollPosition)
    }
  }, [allCategories])

  const selectedIcon = value ? getIconByName(value) : null
  const IconComponent = selectedIcon?.component
  const isSelfhstIcon = value?.startsWith('selfhst:')
  const selfhstId = isSelfhstIcon && value ? value.replace('selfhst:', '') : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" className="w-full justify-start">
            {IconComponent ? (
              <>
                <IconComponent className="h-5 w-5 mr-2" />
                {value}
              </>
            ) : isSelfhstIcon && selfhstId ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${selfhstId}.png`}
                  alt={selfhstId}
                  className="h-5 w-5 mr-2"
                />
                {selfhstId}
              </>
            ) : (
              'Select Icon'
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={selectedTab === 'heroicons' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('heroicons')}
            size="sm"
          >
            HeroIcons
          </Button>
          <Button
            variant={selectedTab === 'selfhst' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('selfhst')}
            size="sm"
          >
            Selfh.st Icons
          </Button>
          <Button
            variant={selectedTab === 'url' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('url')}
            size="sm"
          >
            URL
          </Button>
        </div>

        {selectedTab !== 'url' && (
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {selectedTab === 'url' ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-4">
              <div>
                <Label htmlFor="faviconUrl" className="text-base font-semibold">Favicon URL</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Enter the direct URL to a favicon image (PNG, ICO, JPG, etc.)
                </p>
                <Input
                  id="faviconUrl"
                  type="url"
                  placeholder="https://example.com/favicon.png"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && faviconUrl) {
                      handleFetchFavicon()
                    }
                  }}
                  className="text-base"
                />
              </div>
              <Button
                onClick={handleFetchFavicon}
                disabled={!faviconUrl || fetchingFavicon}
                className="w-full"
              >
                {fetchingFavicon ? 'Fetching...' : 'Fetch Favicon'}
              </Button>
            </div>
          </div>
        ) : selectedTab === 'heroicons' ? (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col overflow-hidden">
          <div className="mb-3 border-b border-border pb-3">
            <div className="mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</span>
            </div>
            <div className="relative">
              {showLeftArrow && (
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/95 hover:bg-accent border border-border rounded-full p-1 shadow-md transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              )}
              {showRightArrow && (
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/95 hover:bg-accent border border-border rounded-full p-1 shadow-md transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              )}
              <div ref={scrollContainerRef} className="overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                <TabsList className="inline-flex w-auto gap-1 h-auto p-1 bg-muted/50 rounded-lg min-w-full">
                  {allCategories.map(category => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="text-sm px-4 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium whitespace-nowrap transition-all hover:bg-muted"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
          </div>

          <TabsContent value={selectedCategory} className="flex-1 overflow-y-auto mt-4" forceMount>
            {hasMore && (
              <div className="mb-3 p-2 bg-muted/50 rounded text-sm text-muted-foreground text-center">
                Showing first 500 of {totalCount} icons. Use search to find specific icons.
              </div>
            )}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {filteredIcons.map((icon) => {
                if (!icon || !icon.component || !icon.name) {
                  return null
                }
                const Icon = icon.component
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => handleSelect(icon.name)}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors group min-h-[80px]"
                    title={icon.name}
                  >
                    <div className="flex items-center justify-center h-6 w-6">
                      <Icon className="h-6 w-6 shrink-0" />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground truncate w-full text-center leading-tight">
                      {icon.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {loadingSelfhst ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading selfh.st icons...</div>
              </div>
            ) : (
              <>
                {hasMore && (
                  <div className="mb-3 p-2 bg-muted/50 rounded text-sm text-muted-foreground text-center">
                    Showing first 500 of {totalCount} icons. Use search to find specific icons.
                  </div>
                )}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {displayedSelfhstIcons.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => handleSelect(`selfhst:${icon.id}`)}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors group min-h-[80px]"
                      title={icon.name}
                    >
                      <div className="flex items-center justify-center h-6 w-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${icon.id}.png`}
                          alt={icon.name}
                          className="h-6 w-6 object-contain"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground truncate w-full text-center leading-tight">
                        {icon.name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
