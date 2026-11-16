import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bookmark, Server } from 'lucide-react'
import {
  getSession,
  getStartPageSettings,
  loadBookmarkCategories,
  loadServiceCategories,
  needsSetup,
  type StartPageSettings,
} from '@/lib/server/start-page'
import { getTimeBasedWelcomeMessage } from '@/lib/datetime'
import { substituteVariables } from '@/lib/template'
import { cn } from '@/lib/utils'
import { SiteHeader } from '@/components/start/site-header'
import { SearchBar } from '@/components/start/search-bar'
import { LinkGroup, type LinkItem } from '@/components/start/link-group'
import { ItemIcon } from '@/components/start/item-icon'
import { PageviewBeacon } from '@/components/start/pageview-beacon'
import { LoadDemoButton } from '@/components/start/load-demo-button'

// The start page reads the session, settings and links on the server for every request, so the first
// paint is already the right one: signed-in header, theme, background, columns. Nothing is re-fetched.
export const dynamic = 'force-dynamic'

// Static class strings so Tailwind can see them.
const GRID: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6',
}

const ICON_SIZE = { compact: 20, comfortable: 28 } as const

/** Item > category > global, as before: null inherits, 0 hides, 1 shows. */
function showDescription(item: any, category: any, globalDefault: boolean) {
  if (!item.description) return false
  if (item.showDescription === 0 || item.showDescription === 1) return item.showDescription === 1
  if (category.showDescriptions === 0 || category.showDescriptions === 1) return category.showDescriptions === 1
  return globalDefault
}

function Section({
  title,
  kind,
  groups,
  settings,
}: {
  title: string
  kind: 'bookmarks' | 'services'
  groups: any[]
  settings: StartPageSettings
}) {
  const visible = groups.filter((g) => (g[kind] || []).length > 0)
  if (visible.length === 0) return null
  const iconSize = ICON_SIZE[settings.density]
  const Fallback = kind === 'services' ? Server : Bookmark

  return (
    <section aria-labelledby={`${kind}-heading`} className="mt-10 first:mt-0">
      <h2 id={`${kind}-heading`} className="mb-3 border-b border-border pb-2 text-sm font-semibold text-muted-foreground">
        {title}
      </h2>
      <div className={cn('grid gap-x-6 gap-y-6', GRID[settings.columns] || GRID[4])}>
        {visible.map((group) => {
          const items: LinkItem[] = (group[kind] as any[]).map((item) => ({
            id: item.id,
            name: item.name,
            url: item.url,
            description: showDescription(item, group, settings.showDescriptions) ? item.description : null,
            icon: <ItemIcon icon={item.icon} size={iconSize} />,
          }))
          return (
            <LinkGroup
              key={group.id}
              kind={kind}
              title={group.name}
              icon={group.icon ? <ItemIcon icon={group.icon} size={16} /> : <Fallback className="h-4 w-4" aria-hidden="true" />}
              items={items}
              density={settings.density}
              itemsToShow={group.itemsToShow}
              showItemCount={!!group.showItemCount}
              autoExpanded={!!group.autoExpanded}
              showOpenAll={!!group.showOpenAll}
            />
          )
        })}
      </div>
    </section>
  )
}

function HomepageGraphic({ graphic }: { graphic: NonNullable<StartPageSettings['homepage']['graphic']> }) {
  return (
    <div
      className={cn(
        'mb-6 flex',
        graphic.hAlign === 'left' && 'justify-start',
        graphic.hAlign === 'center' && 'justify-center',
        graphic.hAlign === 'right' && 'justify-end',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/api/homepage-graphic/serve" alt="" style={{ maxWidth: graphic.maxWidth }} className="h-auto max-w-full object-contain" />
    </div>
  )
}

export default async function HomePage() {
  if (await needsSetup()) redirect('/setup')

  const session = await getSession()
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null
  const [settings, bookmarkGroups, serviceGroups] = await Promise.all([
    getStartPageSettings(userId),
    loadBookmarkCategories(session),
    loadServiceCategories(session),
  ])

  const user = session?.user
    ? { name: session.user.name || session.user.email || 'you', isAdmin: !!session.user.isAdmin }
    : null

  const searchConfig = { ...settings.search, show: !!user && settings.search.enabled }
  const welcome =
    user && settings.welcome.enabled
      ? substituteVariables(
          settings.welcome.timeBased
            ? getTimeBasedWelcomeMessage(settings.welcome.morning, settings.welcome.afternoon, settings.welcome.evening)
            : settings.welcome.message,
          session!.user as any,
        )
      : null

  const sections = [
    <Section key="services" title="Services" kind="services" groups={serviceGroups} settings={settings} />,
    <Section key="bookmarks" title="Bookmarks" kind="bookmarks" groups={bookmarkGroups} settings={settings} />,
  ]
  if (settings.sectionOrder === 'bookmarks-first') sections.reverse()

  const isEmpty =
    !bookmarkGroups.some((g) => g.bookmarks?.length) && !serviceGroups.some((g) => g.services?.length)
  const graphic = settings.homepage.graphic
  const showGraphic = graphic && !(graphic.hideWhenLoggedIn && user)
  const background = settings.background && (user || settings.background.showLoggedOut) ? settings.background : null

  return (
    <div className="min-h-dvh">
      {background && (
        <div
          aria-hidden="true"
          className={`background-image-container bg-mode-${background.mode}`}
          style={{ backgroundImage: `url(/api/background-image/serve?v=${encodeURIComponent(background.version)})` }}
        >
          <div className="absolute inset-0 bg-background" style={{ opacity: 1 - background.opacity / 100 }} />
        </div>
      )}

      <SiteHeader
        user={user}
        siteTitle={settings.siteTitle}
        siteTitleEnabled={settings.siteTitleEnabled}
        logo={settings.headerLogo}
        search={searchConfig.show && settings.search.inHeader ? searchConfig : null}
        dateTime={user && settings.dateTime.enabled ? settings.dateTime : null}
        weather={settings.weather.enabled && settings.weather.locations.length ? settings.weather : null}
      />

      <main id="main" className="px-gutter mx-auto max-w-7xl pb-[max(4rem,env(safe-area-inset-bottom))] pt-8">
        {welcome ? (
          <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground text-balance">{welcome}</h1>
        ) : (
          <h1 className="sr-only">{settings.siteTitle}</h1>
        )}

        {searchConfig.show && !settings.search.inHeader && (
          <div className="mb-10 max-w-2xl">
            <SearchBar config={searchConfig} />
          </div>
        )}

        {isEmpty ? (
          <div className="mx-auto max-w-xl py-20 text-center">
            {user ? (
              <>
                <p className="text-lg font-medium text-foreground">Nothing here yet</p>
                {user.isAdmin ? (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Add your first category in{' '}
                      <Link href="/admin/content" className="link">
                        Admin, Content
                      </Link>
                      , or start from sample links you can remove later.
                    </p>
                    <div className="mt-6">
                      <LoadDemoButton />
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">An admin has not added any links you can see.</p>
                )}
              </>
            ) : (
              <>
                {showGraphic && graphic.position === 'above' && <HomepageGraphic graphic={graphic} />}
                {settings.homepage.descriptionEnabled && settings.homepage.description ? (
                  <p className="mx-auto max-w-2xl whitespace-pre-wrap text-xl text-muted-foreground">
                    {settings.homepage.description}
                  </p>
                ) : settings.siteTitleEnabled ? (
                  <p aria-hidden="true" className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                    {settings.siteTitle}
                  </p>
                ) : null}
                {showGraphic && graphic.position === 'below' && <HomepageGraphic graphic={graphic} />}
              </>
            )}
          </div>
        ) : (
          sections
        )}
      </main>

      <PageviewBeacon />
    </div>
  )
}
