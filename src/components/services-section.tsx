'use client'

import { useState } from 'react'
import { getIconByName } from '@/lib/icons'
import { ServerIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useTheme } from 'next-themes'

interface Service {
  id: number
  name: string
  url: string
  description: string | null
  icon: string | null
  categoryId: number | null
  order: number
}

interface ServiceCategory {
  id: number
  name: string
  icon: string | null
  order: number
  columns: number
  services?: Service[]
  itemsToShow: number | null
  showItemCount: boolean
  autoExpanded: boolean
  sortBy: string | null
}

interface ServicesSectionProps {
  services: Service[]
  serviceCategories: ServiceCategory[]
  onServiceClick: (serviceId: number, url: string) => void
  iconSize?: number
  fontSize?: number
  descriptionSpacing?: number
  itemSpacing?: number
  columns?: number
}

function ServiceCategoryWithAccordion({
  category,
  renderServiceCard,
  itemSpacing,
  columns
}: {
  category: ServiceCategory
  renderServiceCard: (service: Service, isLastVisibleItem?: boolean) => JSX.Element
  itemSpacing: number
  columns: number
}) {
  const [isExpanded, setIsExpanded] = useState(category.autoExpanded)

  if (!category.services || category.services.length === 0) return null

  const categoryIconData = category.icon ? getIconByName(category.icon) : null
  const CategoryIcon = categoryIconData?.component

  const totalItems = category.services.length
  const hasItemsToShow = category.itemsToShow && category.itemsToShow > 0
  const shouldShowExpandButton = hasItemsToShow && totalItems > (category.itemsToShow || 0)
  const displayedServices = (shouldShowExpandButton && !isExpanded && category.itemsToShow)
    ? category.services.slice(0, category.itemsToShow)
    : category.services

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        {CategoryIcon ? (
          <CategoryIcon className="h-5 w-5 text-primary" />
        ) : (
          <ServerIcon className="h-5 w-5 text-primary" />
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

      <div className="grid relative transition-all duration-500 ease-in-out" style={{
        gridTemplateColumns: '1fr',
        gap: itemSpacing >= 0 ? `${itemSpacing}px` : '0px',
        margin: itemSpacing < 0 ? `${itemSpacing / 2}px` : '0px'
      }}>
        {displayedServices.map((service, index) => {
          const isLastVisibleItem = !!(shouldShowExpandButton && !isExpanded && index === displayedServices.length - 1)
          return renderServiceCard(service, isLastVisibleItem)
        })}
      </div>
    </div>
  )
}

export function ServicesSection({
  services,
  serviceCategories,
  onServiceClick,
  iconSize = 32,
  fontSize = 16,
  descriptionSpacing = 2,
  itemSpacing = 4,
  columns = 4
}: ServicesSectionProps) {
  const { theme } = useTheme()
  const containerSize = iconSize + 8
  const descriptionSize = fontSize - 2

  // Group services by category
  const categorizedServices = serviceCategories.map(category => ({
    ...category,
    services: services.filter(s => s.categoryId === category.id)
  }))

  // Get uncategorized services
  const uncategorizedServices = services.filter(s => !s.categoryId)

  // If no services at all, don't render
  if (!services || services.length === 0) {
    return null
  }

  const renderServiceCard = (service: Service, isLastVisibleItem = false) => {
    const isFavicon = service.icon?.startsWith('favicon:')
    const isSelfhst = service.icon?.startsWith('selfhst:')
    const serviceIconData = !isFavicon && !isSelfhst && service.icon ? getIconByName(service.icon) : null
    const ServiceIcon = serviceIconData?.component

    // Handle favicon path with monotone support
    let faviconPath = isFavicon && service.icon ? service.icon.replace('favicon:', '') : null
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
    const selfhstId = isSelfhst && service.icon ? service.icon.replace('selfhst:', '') : null
    const selfhstPath = selfhstId ? `https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${selfhstId}.png` : null

    return (
      <div key={service.id} className="relative" style={itemSpacing < 0 ? { margin: `${itemSpacing / 2}px` } : {}}>
        <button
          onClick={() => onServiceClick(service.id, service.url)}
          className={`group/item flex gap-3 p-2 hover:bg-accent rounded transition-colors text-left w-full ${service.description ? 'items-start' : 'items-center'}`}
        >
        {(ServiceIcon || faviconPath || selfhstPath) && (
          <div
            className="flex items-center justify-center flex-shrink-0 text-primary"
            style={{
              width: `${containerSize}px`,
              height: `${containerSize}px`
            }}
          >
            {ServiceIcon && (
              <div style={{ width: `${iconSize}px`, height: `${iconSize}px` }}>
                <ServiceIcon className="w-full h-full" />
              </div>
            )}
            {(faviconPath || selfhstPath) && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={faviconPath || selfhstPath || ''}
                alt={service.name}
                className="object-contain"
                style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
              />
            )}
          </div>
        )}
        <div className="flex flex-col flex-1 min-w-0">
          <span
            className="font-semibold text-foreground"
            style={{ fontSize: `${fontSize}px` }}
          >
            {service.name}
          </span>
          {service.description && (
            <span
              className="text-muted-foreground line-clamp-2"
              style={{
                fontSize: `${descriptionSize}px`,
                marginTop: `${descriptionSpacing}px`
              }}
            >
              {service.description}
            </span>
          )}
        </div>
        </button>
        {isLastVisibleItem && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80 pointer-events-none rounded-lg" />
        )}
      </div>
    )
  }

  return (
    <>
      {/* Render categories directly without nested grid since parent handles grid layout */}
      {categorizedServices.length > 0 ? (
        <>
          {categorizedServices.map((category) => (
            <ServiceCategoryWithAccordion
              key={category.id}
              category={category}
              renderServiceCard={renderServiceCard}
              itemSpacing={itemSpacing}
              columns={1}
            />
          ))}

          {/* Uncategorized services */}
          {uncategorizedServices.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <ServerIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Services
                </h2>
              </div>

              <div className="grid relative transition-all duration-500 ease-in-out" style={{
                gridTemplateColumns: '1fr',
                gap: itemSpacing >= 0 ? `${itemSpacing}px` : '0px',
                margin: itemSpacing < 0 ? `${itemSpacing / 2}px` : '0px'
              }}>
                {uncategorizedServices.map((service) => renderServiceCard(service))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* No categories - use simple list */
        <>
          <div className="flex items-center gap-2 mb-3 px-1">
            <ServerIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Services
            </h2>
          </div>

          <div className="grid relative transition-all duration-500 ease-in-out" style={{
            gridTemplateColumns: '1fr',
            gap: itemSpacing >= 0 ? `${itemSpacing}px` : '0px',
            margin: itemSpacing < 0 ? `${itemSpacing / 2}px` : '0px'
          }}>
            {services.map((service) => renderServiceCard(service))}
          </div>
        </>
      )}
    </>
  )
}
