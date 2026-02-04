'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CategorySection } from '@/components/category-section'
import { SearchBar } from '@/components/search-bar'
import { WeatherWidget } from '@/components/weather-widget'
import { Header } from '@/components/header'
import { ServicesSection } from '@/components/services-section'
import { HomepageGraphic } from '@/components/homepage-graphic'
import { getTimeBasedWelcomeMessage } from '@/lib/datetime'
import { substituteVariables } from '@/lib/template'
import { BeakerIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

// Generate responsive grid classes based on max columns setting
function getResponsiveGridClasses(maxColumns: number): string {
  const classes = ['grid', 'gap-6', 'grid-cols-1']
  if (maxColumns >= 2) classes.push('sm:grid-cols-2')
  if (maxColumns >= 3) classes.push('md:grid-cols-3')
  if (maxColumns >= 4) classes.push('lg:grid-cols-4')
  if (maxColumns >= 5) classes.push('xl:grid-cols-5')
  if (maxColumns >= 6) classes.push('2xl:grid-cols-6')
  return classes.join(' ')
}

interface Bookmark {
  id: number
  name: string
  url: string
  description: string | null
  icon: string | null
  order: number
  isVisible: boolean
  requiresAuth: boolean
}

interface Category {
  id: number
  name: string
  icon: string | null
  order: number
  columns: number
  isVisible: boolean
  requiresAuth: boolean
  bookmarks: Bookmark[]
  itemsToShow: number | null
  showItemCount: boolean
  autoExpanded: boolean
  showOpenAll: boolean
  sortBy: string | null
}

export default function HomePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<any[]>([])
  const [serviceCategories, setServiceCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingSetup, setCheckingSetup] = useState(true)
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome back')
  const [welcomeMessageEnabled, setWelcomeMessageEnabled] = useState(true)
  const [welcomeMessageTimeBased, setWelcomeMessageTimeBased] = useState(false)
  const [welcomeMessageMorning, setWelcomeMessageMorning] = useState('Good Morning')
  const [welcomeMessageAfternoon, setWelcomeMessageAfternoon] = useState('Good Afternoon')
  const [welcomeMessageEvening, setWelcomeMessageEvening] = useState('Good Evening')
  const [searchEnabled, setSearchEnabled] = useState(true)
  const [searchInHeader, setSearchInHeader] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<'services-first' | 'bookmarks-first'>('services-first')
  const [servicesIconSize, setServicesIconSize] = useState(32)
  const [servicesFontSize, setServicesFontSize] = useState(16)
  const [servicesDescriptionSpacing, setServicesDescriptionSpacing] = useState(4)
  const [servicesItemSpacing, setServicesItemSpacing] = useState(8)
  const [bookmarksIconSize, setBookmarksIconSize] = useState(32)
  const [bookmarksFontSize, setBookmarksFontSize] = useState(14)
  const [descriptionSpacing, setDescriptionSpacing] = useState(2)
  const [itemSpacing, setItemSpacing] = useState(4)
  const [servicesColumns, setServicesColumns] = useState(4)
  const [bookmarksColumns, setBookmarksColumns] = useState(4)
  const [siteTitle, setSiteTitle] = useState('Faux|Dash')
  const [siteTitleEnabled, setSiteTitleEnabled] = useState(true)
  const [siteTitleUseGradient, setSiteTitleUseGradient] = useState(true)
  const [siteTitleGradientFrom, setSiteTitleGradientFrom] = useState('#0f172a')
  const [siteTitleGradientTo, setSiteTitleGradientTo] = useState('#475569')
  const [siteTitleColor, setSiteTitleColor] = useState('#0f172a')
  const [showDescriptions, setShowDescriptions] = useState(false)
  // Homepage customization
  const [homepageDescriptionEnabled, setHomepageDescriptionEnabled] = useState(false)
  const [homepageDescription, setHomepageDescription] = useState('')
  const [homepageGraphicEnabled, setHomepageGraphicEnabled] = useState(false)
  const [homepageGraphicPath, setHomepageGraphicPath] = useState('')
  const [homepageGraphicMaxWidth, setHomepageGraphicMaxWidth] = useState(200)
  const [homepageGraphicHAlign, setHomepageGraphicHAlign] = useState<'left' | 'center' | 'right'>('center')
  const [homepageGraphicPosition, setHomepageGraphicPosition] = useState<'above' | 'below'>('above')
  const [homepageGraphicHideWhenLoggedIn, setHomepageGraphicHideWhenLoggedIn] = useState(false)

  // Check if first-time setup is needed
  useEffect(() => {
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (data.needsSetup) {
          router.push('/setup')
        } else {
          setCheckingSetup(false)
        }
      })
      .catch(err => {
        console.error('Failed to check setup status:', err)
        setCheckingSetup(false)
      })
  }, [router])

  useEffect(() => {
    if (checkingSetup) return

    fetchCategories()
    fetchServices()
    fetchServiceCategories()
    fetchSettings()

    // Track pageview
    fetch('/api/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/' }),
    }).catch(err => console.error('Failed to track pageview:', err))
  }, [session, checkingSetup])

  const fetchSettings = async () => {
    try {
      // Use authenticated endpoint if logged in, public endpoint otherwise
      const endpoint = session ? '/api/settings' : '/api/settings/public'
      const response = await fetch(endpoint)
      const data = await response.json()
      setSiteTitle(data.siteTitle || 'Faux|Dash')
      setSiteTitleEnabled(data.siteTitleEnabled !== false)
      setSiteTitleUseGradient(data.siteTitleUseGradient !== false)
      setSiteTitleGradientFrom(data.siteTitleGradientFrom || '#0f172a')
      setSiteTitleGradientTo(data.siteTitleGradientTo || '#475569')
      setSiteTitleColor(data.siteTitleColor || '#0f172a')
      setWelcomeMessage(data.welcomeMessage || 'Welcome back')
      setWelcomeMessageEnabled(data.welcomeMessageEnabled !== false)
      setWelcomeMessageTimeBased(data.welcomeMessageTimeBased || false)
      setWelcomeMessageMorning(data.welcomeMessageMorning || 'Good Morning')
      setWelcomeMessageAfternoon(data.welcomeMessageAfternoon || 'Good Afternoon')
      setWelcomeMessageEvening(data.welcomeMessageEvening || 'Good Evening')
      setSearchEnabled(data.searchEnabled !== false)
      setSearchInHeader(data.searchInHeader || false)
      setSectionOrder(data.sectionOrder || 'services-first')
      setServicesIconSize(data.servicesIconSize || 32)
      setServicesFontSize(data.servicesFontSize || 16)
      setServicesDescriptionSpacing(data.servicesDescriptionSpacing || 4)
      setServicesItemSpacing(data.servicesItemSpacing || 8)
      setBookmarksIconSize(data.bookmarksIconSize || 32)
      setBookmarksFontSize(data.bookmarksFontSize || 14)
      setDescriptionSpacing(data.descriptionSpacing || 2)
      setItemSpacing(data.itemSpacing || 4)
      setServicesColumns(data.servicesColumns || 4)
      setBookmarksColumns(data.bookmarksColumns || 4)
      setShowDescriptions(data.showDescriptions || false)
      // Homepage customization
      setHomepageDescriptionEnabled(data.homepageDescriptionEnabled || false)
      setHomepageDescription(data.homepageDescription || '')
      setHomepageGraphicEnabled(data.homepageGraphicEnabled || false)
      setHomepageGraphicPath(data.homepageGraphicPath || '')
      setHomepageGraphicMaxWidth(data.homepageGraphicMaxWidth || 200)
      setHomepageGraphicHAlign(data.homepageGraphicHAlign || 'center')
      setHomepageGraphicPosition(data.homepageGraphicPosition || 'above')
      setHomepageGraphicHideWhenLoggedIn(data.homepageGraphicHideWhenLoggedIn || false)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error('Failed to fetch services:', error)
    }
  }

  const fetchServiceCategories = async () => {
    try {
      const response = await fetch('/api/service-categories')
      const data = await response.json()
      setServiceCategories(data)
    } catch (error) {
      console.error('Failed to fetch service categories:', error)
    }
  }

  const handleBookmarkClick = async (bookmarkId: number, url: string) => {
    // Track click
    fetch(`/api/bookmarks/${bookmarkId}/click`, { method: 'POST' })
      .catch(err => console.error('Failed to track click:', err))

    // Open link
    window.open(url, '_blank')
  }

  const handleServiceClick = async (serviceId: number, url: string) => {
    // Track click
    fetch(`/api/services/${serviceId}/click`, { method: 'POST' })
      .catch(err => console.error('Failed to track click:', err))

    // Open link
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome Message - logged in users only */}
        {welcomeMessageEnabled && session && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {welcomeMessageTimeBased
                ? substituteVariables(
                    getTimeBasedWelcomeMessage(welcomeMessageMorning, welcomeMessageAfternoon, welcomeMessageEvening),
                    session.user as any
                  )
                : substituteVariables(welcomeMessage, session.user as any)}
            </h2>
          </div>
        )}

        {/* Search Bar (only if not in header and user is logged in) */}
        {session && searchEnabled && !searchInHeader && !loading && (
          <div className="mb-8">
            <SearchBar />
          </div>
        )}

        {/* Sections rendered based on sectionOrder */}
        {sectionOrder === 'services-first' ? (
          <>
            {/* Services Section */}
            {serviceCategories.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-primary/20">
                  Services
                </h2>
                <div className={getResponsiveGridClasses(servicesColumns)}>
                  {serviceCategories.map((category) => (
                    <ServicesSection
                      key={category.id}
                      serviceCategories={[category]}
                      services={category.services}
                      onServiceClick={handleServiceClick}
                      iconSize={servicesIconSize}
                      fontSize={servicesFontSize}
                      descriptionSpacing={servicesDescriptionSpacing}
                      itemSpacing={servicesItemSpacing}
                      columns={servicesColumns}
                      showDescriptions={showDescriptions}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bookmarks Section */}
            {categories.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-primary/20">
                  Bookmarks
                </h2>
                <div className={getResponsiveGridClasses(bookmarksColumns)}>
                  {categories.map((category) => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      onBookmarkClick={handleBookmarkClick}
                      iconSize={bookmarksIconSize}
                      fontSize={bookmarksFontSize}
                      descriptionSpacing={descriptionSpacing}
                      itemSpacing={itemSpacing}
                      showDescriptions={showDescriptions}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Bookmarks Section */}
            {categories.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-primary/20">
                  Bookmarks
                </h2>
                <div className={getResponsiveGridClasses(bookmarksColumns)}>
                  {categories.map((category) => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      onBookmarkClick={handleBookmarkClick}
                      iconSize={bookmarksIconSize}
                      fontSize={bookmarksFontSize}
                      descriptionSpacing={descriptionSpacing}
                      itemSpacing={itemSpacing}
                      showDescriptions={showDescriptions}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Services Section */}
            {serviceCategories.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-primary/20">
                  Services
                </h2>
                <div className={getResponsiveGridClasses(servicesColumns)}>
                  {serviceCategories.map((category) => (
                    <ServicesSection
                      key={category.id}
                      serviceCategories={[category]}
                      services={category.services}
                      onServiceClick={handleServiceClick}
                      iconSize={servicesIconSize}
                      fontSize={servicesFontSize}
                      descriptionSpacing={servicesDescriptionSpacing}
                      itemSpacing={servicesItemSpacing}
                      columns={servicesColumns}
                      showDescriptions={showDescriptions}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {categories.length === 0 && serviceCategories.length === 0 && (
          <div className="text-center py-20">
            {session ? (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <p className="text-muted-foreground text-lg mb-2">No bookmarks yet</p>
                {(session.user as any)?.isAdmin && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Go to{' '}
                      <a href="/admin" className="text-primary hover:underline font-medium">
                        admin panel
                      </a>{' '}
                      to add your first category
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-muted-foreground">or</span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/demo/load', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                          })
                          if (response.ok) {
                            window.location.reload()
                          } else {
                            const data = await response.json()
                            alert(data.error || 'Failed to load demo content')
                          }
                        } catch (err) {
                          console.error('Failed to load demo:', err)
                          alert('Failed to load demo content')
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors"
                    >
                      <BeakerIcon className="h-5 w-5" />
                      Load Demo Content
                    </button>
                    <p className="text-xs text-muted-foreground">
                      Explore with sample data (can be cleared anytime)
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Homepage Graphic - Above position */}
                {homepageGraphicPosition === 'above' && !(homepageGraphicHideWhenLoggedIn && session) && (
                  <HomepageGraphic
                    enabled={homepageGraphicEnabled}
                    path={homepageGraphicPath}
                    maxWidth={homepageGraphicMaxWidth}
                    hAlign={homepageGraphicHAlign}
                  />
                )}

                {/* Custom description OR default site title */}
                {homepageDescriptionEnabled && homepageDescription ? (
                  <p className="text-2xl text-muted-foreground whitespace-pre-wrap max-w-2xl mx-auto">
                    {homepageDescription}
                  </p>
                ) : siteTitleEnabled ? (
                  <h1
                    className="text-6xl font-bold"
                    style={
                      siteTitleUseGradient
                        ? {
                            background: `linear-gradient(to right, ${siteTitleGradientFrom}, ${siteTitleGradientTo})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }
                        : {
                            color: siteTitleColor,
                          }
                    }
                  >
                    {siteTitle}
                  </h1>
                ) : null}

                {/* Homepage Graphic - Below position */}
                {homepageGraphicPosition === 'below' && !(homepageGraphicHideWhenLoggedIn && session) && (
                  <HomepageGraphic
                    enabled={homepageGraphicEnabled}
                    path={homepageGraphicPath}
                    maxWidth={homepageGraphicMaxWidth}
                    hAlign={homepageGraphicHAlign}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
