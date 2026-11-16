'use client'

import { useCallback } from 'react'
import { useTheme } from 'next-themes'
import { AdminSection } from '@/components/admin/admin-page'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { SettingsTabProps } from './types'
import { BackgroundImageSettings } from './background-image-settings'
import { HomepageContentSettings } from './homepage-content-settings'
import { HomepageGraphicSettings } from './homepage-graphic-settings'
import { SiteFaviconSettings } from './site-favicon-settings'
import { HeaderLogoSettings } from './header-logo-settings'
import { PwaIconSettings } from './pwa-icon-settings'

/*
  Appearance. The palette is fixed (Bear "Red Graphite", see docs/design/bear-red-graphite.css); what an
  admin chooses here is the light/dark default, how dense the start page is, and how many columns it uses.
  The old per-section icon/font/spacing sliders are gone: Density covers them.
*/

function Segmented<T extends string | number>({
  id,
  value,
  options,
  onChange,
}: {
  id: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div id={id} role="radiogroup" className="inline-flex flex-wrap rounded-md border border-border p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-8 min-w-9 rounded-[5px] px-3 text-sm transition-colors',
            value === o.value ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Row({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <Label htmlFor={htmlFor} id={htmlFor ? `${htmlFor}-label` : undefined}>
          {label}
        </Label>
        {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function AppearanceTab({ settings, onSettingsChange }: SettingsTabProps) {
  const { setTheme } = useTheme()

  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  const handleBackgroundChange = useCallback((changes: {
    backgroundImage?: string
    backgroundDisplayMode?: 'cover' | 'contain' | 'center' | 'tile'
    backgroundOpacity?: number
    backgroundShowLoggedOut?: boolean
  }) => {
    onSettingsChange({ ...settings, ...changes })
  }, [settings, onSettingsChange])

  return (
    <div className="divide-y divide-border [&>section]:py-8 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
      <AdminSection title="Theme and layout" description="How the start page looks for every visitor.">
        <div className="space-y-5">
          <Row label="Default theme" htmlFor="defaultTheme" hint="Visitors can still switch with the moon button in the header.">
            <Segmented
              id="defaultTheme"
              value={(settings.defaultTheme || 'system') as 'light' | 'dark' | 'system'}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              onChange={(v) => {
                updateSetting('defaultTheme', v)
                setTheme(v)
              }}
            />
          </Row>
          <Row label="Density" htmlFor="density" hint="Compact fits more links on screen; comfortable gives each one more room.">
            <Segmented
              id="density"
              value={settings.density || 'comfortable'}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'comfortable', label: 'Comfortable' },
              ]}
              onChange={(v) => updateSetting('density', v)}
            />
          </Row>
          <Row label="Columns" htmlFor="columns" hint="On wide screens. Narrow screens use fewer automatically.">
            <Segmented
              id="columns"
              value={settings.columns || 4}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
              onChange={(v) => updateSetting('columns', v)}
            />
          </Row>
          <Row label="Section order" htmlFor="sectionOrder">
            <Segmented
              id="sectionOrder"
              value={(settings.sectionOrder || 'services-first') as 'services-first' | 'bookmarks-first'}
              options={[
                { value: 'services-first', label: 'Services first' },
                { value: 'bookmarks-first', label: 'Bookmarks first' },
              ]}
              onChange={(v) => updateSetting('sectionOrder', v)}
            />
          </Row>
          <Row label="Show descriptions" htmlFor="showDescriptions" hint="The default. A category or link can override it.">
            <Switch
              id="showDescriptions"
              checked={settings.showDescriptions}
              onCheckedChange={(checked) => updateSetting('showDescriptions', checked)}
            />
          </Row>
        
        </div>
      </AdminSection>

      <AdminSection title="Site name">
        <div className="space-y-5">
          <Row label="Show the site name in the header" htmlFor="siteTitleEnabled">
            <Switch
              id="siteTitleEnabled"
              checked={settings.siteTitleEnabled}
              onCheckedChange={(checked) => updateSetting('siteTitleEnabled', checked)}
            />
          </Row>
          <div className="space-y-1.5 sm:w-[calc(50%-0.75rem)]">
            <Label htmlFor="siteTitle">Site name</Label>
            <Input
              id="siteTitle"
              value={settings.siteTitle}
              onChange={(e) => updateSetting('siteTitle', e.target.value)}
              placeholder="Faux|Dash"
            />
            <p className="text-sm text-muted-foreground">Also used as the browser tab title and for screen readers.</p>
          </div>
        
        </div>
      </AdminSection>

      <HeaderLogoSettings settings={settings} onSettingsChange={onSettingsChange} />

      <AdminSection title="Background image" description="Shown behind the start page.">
        <div>
          <BackgroundImageSettings
            backgroundImage={settings.backgroundImage}
            displayMode={settings.backgroundDisplayMode}
            opacity={settings.backgroundOpacity}
            showLoggedOut={settings.backgroundShowLoggedOut}
            onChange={handleBackgroundChange}
          />
        
        </div>
      </AdminSection>

      <HomepageContentSettings settings={settings} onSettingsChange={onSettingsChange} />

      <HomepageGraphicSettings settings={settings} onSettingsChange={onSettingsChange} />

      <AdminSection title="Browser tab icon">
        <div>
          <SiteFaviconSettings
            favicon={settings.siteFavicon}
            faviconType={settings.siteFaviconType}
            onChange={(favicon, faviconType) => {
              onSettingsChange({ ...settings, siteFavicon: favicon, siteFaviconType: faviconType })
            }}
          />
        
        </div>
      </AdminSection>

      <AdminSection title="App icon" description="Used when the start page is installed to a phone or desktop.">
        <div>
          <PwaIconSettings
            pwaIconPath={settings.pwaIconPath}
            pwaIconType={settings.pwaIconType}
            onChange={(path, type) => {
              onSettingsChange({ ...settings, pwaIconPath: path, pwaIconType: type })
            }}
          />
        
        </div>
      </AdminSection>

      <AdminSection title="Defaults for new content" description="Starting values when you add a category, bookmark or service.">
        <div className="space-y-8">
          {/* Bookmark Category Defaults */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <h3 className="text-base font-semibold text-foreground">Bookmark Category Defaults</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultBookmarkCategoryEnabled">Enabled</Label>
                <Switch
                  id="defaultBookmarkCategoryEnabled"
                  checked={settings.defaultBookmarkCategoryEnabled}
                  onCheckedChange={(checked) => updateSetting('defaultBookmarkCategoryEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultBookmarkCategoryRequiresAuth">Requires Auth</Label>
                <Switch
                  id="defaultBookmarkCategoryRequiresAuth"
                  checked={settings.defaultBookmarkCategoryRequiresAuth}
                  onCheckedChange={(checked) => updateSetting('defaultBookmarkCategoryRequiresAuth', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultBookmarkCategoryShowItemCount">Show Item Count</Label>
                <Switch
                  id="defaultBookmarkCategoryShowItemCount"
                  checked={settings.defaultBookmarkCategoryShowItemCount}
                  onCheckedChange={(checked) => updateSetting('defaultBookmarkCategoryShowItemCount', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultBookmarkCategoryAutoExpanded">Auto Expanded</Label>
                <Switch
                  id="defaultBookmarkCategoryAutoExpanded"
                  checked={settings.defaultBookmarkCategoryAutoExpanded}
                  onCheckedChange={(checked) => updateSetting('defaultBookmarkCategoryAutoExpanded', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultBookmarkCategoryShowOpenAll">Show Open All</Label>
                <Switch
                  id="defaultBookmarkCategoryShowOpenAll"
                  checked={settings.defaultBookmarkCategoryShowOpenAll}
                  onCheckedChange={(checked) => updateSetting('defaultBookmarkCategoryShowOpenAll', checked)}
                />
              </div>
              <div>
              <Label htmlFor="defaultBookmarkCategorySortBy">Sort Items By</Label>
              <Select
                value={settings.defaultBookmarkCategorySortBy}
                onValueChange={(value) => updateSetting('defaultBookmarkCategorySortBy', value)}
              >
                <SelectTrigger id="defaultBookmarkCategorySortBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Manual Order (Drag & Drop)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="clicks">Most Clicked</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="defaultBookmarkCategoryItemsToShow">Items to Show</Label>
              <Input
                id="defaultBookmarkCategoryItemsToShow"
                type="number"
                min={1}
                placeholder="All"
                value={settings.defaultBookmarkCategoryItemsToShow ?? ''}
                onChange={(e) => updateSetting('defaultBookmarkCategoryItemsToShow', e.target.value === '' ? null : parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to show all items
              </p>
            </div>
            </div>
          </div>

          {/* Service Category Defaults */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <h3 className="text-base font-semibold text-foreground">Service Category Defaults</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultServiceCategoryEnabled">Enabled</Label>
                <Switch
                  id="defaultServiceCategoryEnabled"
                  checked={settings.defaultServiceCategoryEnabled}
                  onCheckedChange={(checked) => updateSetting('defaultServiceCategoryEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultServiceCategoryRequiresAuth">Requires Auth</Label>
                <Switch
                  id="defaultServiceCategoryRequiresAuth"
                  checked={settings.defaultServiceCategoryRequiresAuth}
                  onCheckedChange={(checked) => updateSetting('defaultServiceCategoryRequiresAuth', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultServiceCategoryShowItemCount">Show Item Count</Label>
                <Switch
                  id="defaultServiceCategoryShowItemCount"
                  checked={settings.defaultServiceCategoryShowItemCount}
                  onCheckedChange={(checked) => updateSetting('defaultServiceCategoryShowItemCount', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultServiceCategoryAutoExpanded">Auto Expanded</Label>
                <Switch
                  id="defaultServiceCategoryAutoExpanded"
                  checked={settings.defaultServiceCategoryAutoExpanded}
                  onCheckedChange={(checked) => updateSetting('defaultServiceCategoryAutoExpanded', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultServiceCategoryShowOpenAll">Show Open All</Label>
                <Switch
                  id="defaultServiceCategoryShowOpenAll"
                  checked={settings.defaultServiceCategoryShowOpenAll}
                  onCheckedChange={(checked) => updateSetting('defaultServiceCategoryShowOpenAll', checked)}
                />
              </div>
              <div>
              <Label htmlFor="defaultServiceCategorySortBy">Sort Items By</Label>
              <Select
                value={settings.defaultServiceCategorySortBy}
                onValueChange={(value) => updateSetting('defaultServiceCategorySortBy', value)}
              >
                <SelectTrigger id="defaultServiceCategorySortBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Manual Order (Drag & Drop)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="clicks">Most Clicked</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="defaultServiceCategoryItemsToShow">Items to Show</Label>
              <Input
                id="defaultServiceCategoryItemsToShow"
                type="number"
                min={1}
                placeholder="All"
                value={settings.defaultServiceCategoryItemsToShow ?? ''}
                onChange={(e) => updateSetting('defaultServiceCategoryItemsToShow', e.target.value === '' ? null : parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to show all items
              </p>
            </div>
            </div>
          </div>

          {/* Bookmark Defaults */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <h3 className="text-base font-semibold text-foreground">Bookmark Defaults</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultBookmarkEnabled">Enabled</Label>
                <Switch
                  id="defaultBookmarkEnabled"
                  checked={settings.defaultBookmarkEnabled}
                  onCheckedChange={(checked) => updateSetting('defaultBookmarkEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultBookmarkRequiresAuth">Requires Auth</Label>
                <Switch
                  id="defaultBookmarkRequiresAuth"
                  checked={settings.defaultBookmarkRequiresAuth}
                  onCheckedChange={(checked) => updateSetting('defaultBookmarkRequiresAuth', checked)}
                />
              </div>
            </div>
          </div>

          {/* Service Defaults */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <h3 className="text-base font-semibold text-foreground">Service Defaults</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultServiceEnabled">Enabled</Label>
                <Switch
                  id="defaultServiceEnabled"
                  checked={settings.defaultServiceEnabled}
                  onCheckedChange={(checked) => updateSetting('defaultServiceEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultServiceRequiresAuth">Requires Auth</Label>
                <Switch
                  id="defaultServiceRequiresAuth"
                  checked={settings.defaultServiceRequiresAuth}
                  onCheckedChange={(checked) => updateSetting('defaultServiceRequiresAuth', checked)}
                />
              </div>
            </div>
          </div>
        
        </div>
      </AdminSection>
    </div>
  )
}
