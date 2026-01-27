'use client'

import { useState } from 'react'
import { getIconByName } from '@/lib/icons'
import { useTheme } from 'next-themes'
import { ChevronDownIcon, ChevronUpIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

interface Bookmark {
  id: number
  name: string
  url: string
  description: string | null
  icon: string | null
  order: number
}

interface Category {
  id: number
  name: string
  icon: string | null
  columns: number
  bookmarks: Bookmark[]
  itemsToShow: number | null
  showItemCount: boolean
  autoExpanded: boolean
  showOpenAll: boolean
  sortBy: string | null
}

interface CategorySectionProps {
  category: Category
  onBookmarkClick: (bookmarkId: number, url: string) => void
  iconSize?: number
  fontSize?: number
  descriptionSpacing?: number
  itemSpacing?: number
}

export function CategorySection({ category, onBookmarkClick, iconSize = 32, fontSize = 14, descriptionSpacing = 2, itemSpacing = 4 }: CategorySectionProps) {
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(category.autoExpanded)

  if (!category.bookmarks || category.bookmarks.length === 0) {
    return null
  }

  const categoryIconData = category.icon ? getIconByName(category.icon) : null
  const CategoryIcon = categoryIconData?.component
  const containerSize = iconSize + 8
  const descriptionSize = fontSize - 2

  const totalItems = category.bookmarks.length
  const hasItemsToShow = category.itemsToShow && category.itemsToShow > 0
  const shouldShowExpandButton = hasItemsToShow && totalItems > (category.itemsToShow || 0)
  const displayedBookmarks = (shouldShowExpandButton && !isExpanded && category.itemsToShow)
    ? category.bookmarks.slice(0, category.itemsToShow)
    : category.bookmarks

  const handleOpenAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const urls = category.bookmarks.map(b => b.url)
    let blockedCount = 0

    // Open tabs using window.open - browsers allow multiple opens from a single user gesture
    // if done synchronously, though some browsers may still limit this
    for (let i = 0; i < urls.length; i++) {
      const newWindow = window.open(urls[i], '_blank', 'noopener,noreferrer')
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        blockedCount++
      }
    }

    // If tabs were blocked, show a warning
    if (blockedCount > 0) {
      // Create a toast-like notification
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; background: #ef4444; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-family: system-ui, sans-serif; font-size: 14px;">
          ${blockedCount} tab${blockedCount > 1 ? 's' : ''} blocked. Please allow popups for this site.
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => {
        notification.remove()
      }, 4000)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        {CategoryIcon && (
          <CategoryIcon className="h-5 w-5 text-primary" />
        )}
        <h2 className="text-lg font-semibold text-foreground">
          {category.name}
        </h2>
        {category.showItemCount && (
          <span className="text-sm text-muted-foreground opacity-60">
            ({totalItems})
          </span>
        )}
        {category.showOpenAll && category.bookmarks.length > 0 && (
          <button
            onClick={handleOpenAll}
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
            title="Open all in new tabs"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </button>
        )}
        {shouldShowExpandButton && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto p-1 hover:bg-accent rounded transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      <div
        className="flex flex-col relative transition-all duration-500 ease-in-out"
        style={{
          gap: itemSpacing >= 0 ? `${itemSpacing}px` : '0px',
          margin: itemSpacing < 0 ? `${itemSpacing / 2}px` : '0px'
        }}
      >
        {displayedBookmarks.map((bookmark, index) => {
          const isLastVisibleItem = shouldShowExpandButton && !isExpanded && index === displayedBookmarks.length - 1
          const isFavicon = bookmark.icon?.startsWith('favicon:')
          const isSelfhst = bookmark.icon?.startsWith('selfhst:')
          const bookmarkIconData = !isFavicon && !isSelfhst && bookmark.icon ? getIconByName(bookmark.icon) : null
          const BookmarkIcon = bookmarkIconData?.component

          // Handle favicon path with grayscale support
          let faviconPath = isFavicon && bookmark.icon ? bookmark.icon.replace('favicon:', '') : null
          if (faviconPath) {
            // Handle grayscale suffix
            if (faviconPath.includes('_grayscale')) {
              const suffix = theme === 'dark' ? '_white.png' : '_black.png'
              faviconPath = faviconPath + suffix
            }
            // Use API route if it starts with /api, otherwise prepend /api/favicons/serve/
            if (!faviconPath.startsWith('/api/favicons/serve/')) {
              faviconPath = `/api/favicons/serve/${faviconPath}`
            }
          }

          // Handle selfhst icons
          const selfhstId = isSelfhst && bookmark.icon ? bookmark.icon.replace('selfhst:', '') : null
          const selfhstPath = selfhstId ? `https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${selfhstId}.png` : null

          return (
            <div key={bookmark.id} className="relative" style={itemSpacing < 0 ? { margin: `${itemSpacing / 2}px` } : {}}>
              <button
                onClick={() => onBookmarkClick(bookmark.id, bookmark.url)}
                className={`group/item flex gap-3 p-2 hover:bg-accent rounded transition-colors text-left w-full ${bookmark.description ? 'items-start' : 'items-center'}`}
              >
                {(BookmarkIcon || faviconPath || selfhstPath) && (
                  <div
                    className={`flex items-center justify-center flex-shrink-0 text-primary ${bookmark.description ? 'mt-0.5' : ''}`}
                    style={{
                      width: `${containerSize}px`,
                      height: `${containerSize}px`
                    }}
                  >
                    {BookmarkIcon && (
                      <div style={{ width: `${iconSize}px`, height: `${iconSize}px` }}>
                        <BookmarkIcon className="w-full h-full" />
                      </div>
                    )}
                    {(faviconPath || selfhstPath) && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={faviconPath || selfhstPath || ''}
                        alt={bookmark.name}
                        className="object-contain"
                        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                      />
                    )}
                  </div>
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className="font-medium text-foreground"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {bookmark.name}
                  </span>
                  {bookmark.description && (
                    <span
                      className="text-muted-foreground line-clamp-2"
                      style={{
                        fontSize: `${descriptionSize}px`,
                        marginTop: `${descriptionSpacing}px`
                      }}
                    >
                      {bookmark.description}
                    </span>
                  )}
                </div>
              </button>
              {isLastVisibleItem && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80 pointer-events-none rounded" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
