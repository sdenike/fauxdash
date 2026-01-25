'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { CategorySection } from '@/components/category-section'
import { SearchBar } from '@/components/search-bar'
import { WeatherWidget } from '@/components/weather-widget'
import { Header } from '@/components/header'
import { ServicesSection } from '@/components/services-section'
import { getTimeBasedWelcomeMessage } from '@/lib/datetime'
import { substituteVariables } from '@/lib/template'

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
  sortBy: string | null
}

export default function HomePage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<any[]>([])
  const [serviceCategories, setServiceCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
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
  }, [session])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSiteTitle(data.siteTitle || 'Faux|Dash')
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
        {/* Welcome Message */}
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
        {session && searchEnabled && !searchInHeader && (
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
                <div
                  className="grid gap-6"
                  style={{
                    gridTemplateColumns: `repeat(${servicesColumns}, 1fr)`
                  }}
                >
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
                <div
                  className="grid gap-6"
                  style={{
                    gridTemplateColumns: `repeat(${bookmarksColumns}, 1fr)`
                  }}
                >
                  {categories.map((category) => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      onBookmarkClick={handleBookmarkClick}
                      iconSize={bookmarksIconSize}
                      fontSize={bookmarksFontSize}
                      descriptionSpacing={descriptionSpacing}
                      itemSpacing={itemSpacing}
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
                <div
                  className="grid gap-6"
                  style={{
                    gridTemplateColumns: `repeat(${bookmarksColumns}, 1fr)`
                  }}
                >
                  {categories.map((category) => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      onBookmarkClick={handleBookmarkClick}
                      iconSize={bookmarksIconSize}
                      fontSize={bookmarksFontSize}
                      descriptionSpacing={descriptionSpacing}
                      itemSpacing={itemSpacing}
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
                <div
                  className="grid gap-6"
                  style={{
                    gridTemplateColumns: `repeat(${servicesColumns}, 1fr)`
                  }}
                >
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
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {categories.length === 0 && (
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
                  <p className="text-sm text-muted-foreground">
                    Go to{' '}
                    <a href="/admin" className="text-primary hover:underline font-medium">
                      admin panel
                    </a>{' '}
                    to add your first category
                  </p>
                )}
              </>
            ) : (
              <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                {siteTitle}
              </h1>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
