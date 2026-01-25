'use client'

import { useState } from 'react'
import { getIconByName } from '@/lib/icons'
import { useTheme } from 'next-themes'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

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

          // Handle favicon path with monotone support
          let faviconPath = isFavicon && bookmark.icon ? bookmark.icon.replace('favicon:', '') : null
          if (faviconPath) {
            // Handle monotone suffix
            if (faviconPath.includes('_monotone')) {
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
