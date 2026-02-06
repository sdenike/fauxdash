'use client'

import { useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { THEMES, STANDALONE_THEMES, getThemeByName, applyTheme } from '@/lib/themes'
import { SettingsTabProps } from './types'
import { BackgroundImageSettings } from './background-image-settings'
import { HomepageContentSettings } from './homepage-content-settings'
import { HomepageGraphicSettings } from './homepage-graphic-settings'
import { SiteTitleSettings } from './site-title-settings'
import { SiteFaviconSettings } from './site-favicon-settings'
import { HeaderLogoSettings } from './header-logo-settings'

export function AppearanceTab({ settings, onSettingsChange }: SettingsTabProps) {
  const { setTheme: setNextTheme, resolvedTheme } = useTheme()

  const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }, [settings, onSettingsChange])

  const handleThemeChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, defaultTheme: value })
    setNextTheme(value)
    // Save immediately
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultTheme: value }),
    })
  }, [settings, onSettingsChange, setNextTheme])

  const handleThemeColorChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, themeColor: value })
    // Apply theme immediately
    // First check if this is a standalone theme (already includes its own dark/light styling)
    let selectedTheme = getThemeByName(value)

    // If not found as standalone, and we're in dark mode, try the "(Dark)" variant
    if (!selectedTheme || !STANDALONE_THEMES.some(t => t.name === value)) {
      const isDark = resolvedTheme === 'dark'
      const themeName = isDark ? `${value} (Dark)` : value
      selectedTheme = getThemeByName(themeName)
    }

    if (selectedTheme) {
      applyTheme(selectedTheme)
    }
    // Save immediately
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeColor: value }),
    })
  }, [settings, onSettingsChange, resolvedTheme])

  const handleBackgroundChange = useCallback((changes: {
    backgroundImage?: string
    backgroundDisplayMode?: 'cover' | 'contain' | 'center' | 'tile'
    backgroundOpacity?: number
    backgroundShowLoggedOut?: boolean
  }) => {
    onSettingsChange({ ...settings, ...changes })
  }, [settings, onSettingsChange])

  return (
    <div className="space-y-4">
      {/* Theme Card */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Customize the appearance of your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="defaultTheme">Default Theme Mode</Label>
            <Select value={settings.defaultTheme} onValueChange={handleThemeChange}>
              <SelectTrigger id="defaultTheme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Changes apply immediately
            </p>
          </div>

          <div>
            <Label htmlFor="themeColor">Theme Color</Label>
            <Select value={settings.themeColor} onValueChange={handleThemeColorChange}>
              <SelectTrigger id="themeColor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Standard Themes</div>
                {THEMES.map((theme) => (
                  <SelectItem key={theme.name} value={theme.name}>
                    {theme.name}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Special Themes</div>
                {STANDALONE_THEMES.map((theme) => (
                  <SelectItem key={theme.name} value={theme.name}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Choose from {THEMES.length + STANDALONE_THEMES.length} color themes. Changes apply immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Site Branding Card */}
      <Card>
        <CardHeader>
          <CardTitle>Site Branding</CardTitle>
          <CardDescription>
            Customize your site title and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="siteTitleEnabled">Show Site Title</Label>
              <p className="text-sm text-muted-foreground">
                Display site title in the top left corner
              </p>
            </div>
            <Switch
              id="siteTitleEnabled"
              checked={settings.siteTitleEnabled}
              onCheckedChange={(checked) => updateSetting('siteTitleEnabled', checked)}
            />
          </div>

          {settings.siteTitleEnabled && (
            <div>
              <Label htmlFor="siteTitle">Site Title</Label>
              <Input
                id="siteTitle"
                value={settings.siteTitle}
                onChange={(e) => updateSetting('siteTitle', e.target.value)}
                placeholder="Faux|Dash"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Homepage Graphic Settings */}
      <HomepageGraphicSettings settings={settings} onSettingsChange={onSettingsChange} />

      {/* Site Favicon Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Site Favicon</CardTitle>
          <CardDescription>
            Customize the favicon that appears in browser tabs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SiteFaviconSettings
            favicon={settings.siteFavicon}
            faviconType={settings.siteFaviconType}
            onChange={(favicon, faviconType) => {
              onSettingsChange({
                ...settings,
                siteFavicon: favicon,
                siteFaviconType: faviconType,
              })
            }}
          />
        </CardContent>
      </Card>

      {/* Site Title Settings */}
      <Card>
        <CardContent className="pt-6">
          <SiteTitleSettings settings={settings} onSettingsChange={onSettingsChange} />
        </CardContent>
      </Card>

      {/* Header Logo Settings */}
      <HeaderLogoSettings settings={settings} onSettingsChange={onSettingsChange} />

      {/* Homepage Content Settings */}
      <HomepageContentSettings settings={settings} onSettingsChange={onSettingsChange} />

      {/* Description Visibility Card */}
      <Card>
        <CardHeader>
          <CardTitle>Description Visibility</CardTitle>
          <CardDescription>
            Control whether descriptions are shown for bookmarks and services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showDescriptions">Show Descriptions</Label>
              <p className="text-sm text-muted-foreground">
                Display descriptions for bookmarks and services by default
              </p>
            </div>
            <Switch
              id="showDescriptions"
              checked={settings.showDescriptions}
              onCheckedChange={(checked) => updateSetting('showDescriptions', checked)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            This is the global default. Individual categories and items can override this setting.
          </p>
        </CardContent>
      </Card>

      {/* Background Image Card */}
      <Card>
        <CardHeader>
          <CardTitle>Background Image</CardTitle>
          <CardDescription>
            Set a custom background image for your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BackgroundImageSettings
            backgroundImage={settings.backgroundImage}
            displayMode={settings.backgroundDisplayMode}
            opacity={settings.backgroundOpacity}
            showLoggedOut={settings.backgroundShowLoggedOut}
            onChange={handleBackgroundChange}
          />
        </CardContent>
      </Card>

      {/* Services Layout Card */}
      <Card>
        <CardHeader>
          <CardTitle>Services Layout</CardTitle>
          <CardDescription>
            Configure where the services section appears
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="sectionOrder">Section Order</Label>
            <select
              id="sectionOrder"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 mt-2"
              value={settings.sectionOrder || (settings.servicesPosition === 'above' ? 'services-first' : 'bookmarks-first')}
              onChange={(e) => updateSetting('sectionOrder', e.target.value)}
            >
              <option value="services-first">Services First</option>
              <option value="bookmarks-first">Bookmarks First</option>
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              Choose whether the Services section appears before or after Bookmarks on the homepage
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout Card */}
      <Card>
        <CardHeader>
          <CardTitle>Grid Layout</CardTitle>
          <CardDescription>
            Configure the column layout for services and main page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="servicesColumns">Services Section Columns</Label>
            <Select
              value={settings.servicesColumns?.toString() || '4'}
              onValueChange={(value) => updateSetting('servicesColumns', parseInt(value))}
            >
              <SelectTrigger id="servicesColumns" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Column</SelectItem>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
                <SelectItem value="5">5 Columns</SelectItem>
                <SelectItem value="6">6 Columns</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Total number of columns for the Services section grid
            </p>
          </div>

          <div>
            <Label htmlFor="bookmarksColumns">Bookmarks Section Columns</Label>
            <Select
              value={settings.bookmarksColumns?.toString() || '4'}
              onValueChange={(value) => updateSetting('bookmarksColumns', parseInt(value))}
            >
              <SelectTrigger id="bookmarksColumns" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Column</SelectItem>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
                <SelectItem value="5">5 Columns</SelectItem>
                <SelectItem value="6">6 Columns</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Total number of columns for the Bookmarks section grid
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Appearance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Appearance</CardTitle>
          <CardDescription>
            Customize icon and text sizes for services and bookmarks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Services Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-semibold text-foreground">Services</h3>
            </div>

            {/* Services Preview */}
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-xs text-muted-foreground mb-3">Preview</p>
              <div
                className="flex flex-col"
                style={{
                  gap: settings.servicesItemSpacing >= 0 ? `${settings.servicesItemSpacing}px` : '0px',
                }}
              >
                {['Sample Service', 'Another Service'].map((name, idx) => (
                  <div
                    key={name}
                    className="flex items-start gap-3 p-2 hover:bg-accent rounded transition-colors"
                    style={settings.servicesItemSpacing < 0 ? { marginTop: idx > 0 ? `${settings.servicesItemSpacing}px` : '0' } : {}}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0 text-primary"
                      style={{
                        width: `${settings.servicesIconSize + 8}px`,
                        height: `${settings.servicesIconSize + 8}px`,
                      }}
                    >
                      <svg
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        style={{
                          width: `${settings.servicesIconSize}px`,
                          height: `${settings.servicesIconSize}px`,
                        }}
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className="font-semibold text-foreground"
                        style={{ fontSize: `${settings.servicesFontSize}px` }}
                      >
                        {name}
                      </span>
                      <span
                        className="text-muted-foreground"
                        style={{
                          fontSize: `${Math.max(settings.servicesFontSize - 2, 10)}px`,
                          marginTop: `${settings.servicesDescriptionSpacing}px`,
                        }}
                      >
                        This is a sample description
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="servicesIconSize">Icon Size</Label>
                  <span className="text-sm text-muted-foreground">{settings.servicesIconSize}px</span>
                </div>
                <input
                  type="range"
                  id="servicesIconSize"
                  min="16"
                  max="64"
                  step="4"
                  value={settings.servicesIconSize}
                  onChange={(e) => updateSetting('servicesIconSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="servicesFontSize">Font Size</Label>
                  <span className="text-sm text-muted-foreground">{settings.servicesFontSize}px</span>
                </div>
                <input
                  type="range"
                  id="servicesFontSize"
                  min="12"
                  max="24"
                  step="1"
                  value={settings.servicesFontSize}
                  onChange={(e) => updateSetting('servicesFontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="servicesDescriptionSpacing">Description Spacing</Label>
                  <span className="text-sm text-muted-foreground">{settings.servicesDescriptionSpacing}px</span>
                </div>
                <input
                  type="range"
                  id="servicesDescriptionSpacing"
                  min="-8"
                  max="12"
                  step="1"
                  value={settings.servicesDescriptionSpacing}
                  onChange={(e) => updateSetting('servicesDescriptionSpacing', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="servicesItemSpacing">Item Spacing</Label>
                  <span className="text-sm text-muted-foreground">{settings.servicesItemSpacing}px</span>
                </div>
                <input
                  type="range"
                  id="servicesItemSpacing"
                  min="-4"
                  max="18"
                  step="1"
                  value={settings.servicesItemSpacing}
                  onChange={(e) => updateSetting('servicesItemSpacing', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Bookmarks Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-semibold text-foreground">Bookmarks</h3>
            </div>

            {/* Bookmarks Preview */}
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-xs text-muted-foreground mb-3">Preview</p>
              <div
                className="flex flex-col"
                style={{
                  gap: settings.itemSpacing >= 0 ? `${settings.itemSpacing}px` : '0px',
                }}
              >
                {['Sample Bookmark', 'Another Bookmark'].map((name, idx) => (
                  <div
                    key={name}
                    className="flex items-start gap-3 p-2 hover:bg-accent rounded transition-colors"
                    style={settings.itemSpacing < 0 ? { marginTop: idx > 0 ? `${settings.itemSpacing}px` : '0' } : {}}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0 text-primary mt-0.5"
                      style={{
                        width: `${settings.bookmarksIconSize + 8}px`,
                        height: `${settings.bookmarksIconSize + 8}px`,
                      }}
                    >
                      <svg
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        style={{
                          width: `${settings.bookmarksIconSize}px`,
                          height: `${settings.bookmarksIconSize}px`,
                        }}
                      >
                        <path d="M5 4h14a2 2 0 012 2v14l-7-3-7 3V6a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className="font-medium text-foreground"
                        style={{ fontSize: `${settings.bookmarksFontSize}px` }}
                      >
                        {name}
                      </span>
                      <span
                        className="text-muted-foreground"
                        style={{
                          fontSize: `${Math.max(settings.bookmarksFontSize - 2, 10)}px`,
                          marginTop: `${settings.descriptionSpacing}px`,
                        }}
                      >
                        A helpful description
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="bookmarksIconSize">Icon Size</Label>
                  <span className="text-sm text-muted-foreground">{settings.bookmarksIconSize}px</span>
                </div>
                <input
                  type="range"
                  id="bookmarksIconSize"
                  min="16"
                  max="64"
                  step="4"
                  value={settings.bookmarksIconSize}
                  onChange={(e) => updateSetting('bookmarksIconSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="bookmarksFontSize">Font Size</Label>
                  <span className="text-sm text-muted-foreground">{settings.bookmarksFontSize}px</span>
                </div>
                <input
                  type="range"
                  id="bookmarksFontSize"
                  min="10"
                  max="20"
                  step="1"
                  value={settings.bookmarksFontSize}
                  onChange={(e) => updateSetting('bookmarksFontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="descriptionSpacing">Description Spacing</Label>
                  <span className="text-sm text-muted-foreground">{settings.descriptionSpacing}px</span>
                </div>
                <input
                  type="range"
                  id="descriptionSpacing"
                  min="-8"
                  max="12"
                  step="1"
                  value={settings.descriptionSpacing}
                  onChange={(e) => updateSetting('descriptionSpacing', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="itemSpacing">Item Spacing</Label>
                  <span className="text-sm text-muted-foreground">{settings.itemSpacing}px</span>
                </div>
                <input
                  type="range"
                  id="itemSpacing"
                  min="-4"
                  max="18"
                  step="1"
                  value={settings.itemSpacing}
                  onChange={(e) => updateSetting('itemSpacing', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defaults for New Items Card */}
      <Card>
        <CardHeader>
          <CardTitle>Defaults for New Items</CardTitle>
          <CardDescription>
            Set default values when creating new categories, bookmarks, and services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Bookmark Category Defaults */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-semibold text-foreground">Bookmark Category Defaults</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
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

          {/* Service Category Defaults */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-semibold text-foreground">Service Category Defaults</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
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

          {/* Bookmark Defaults */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-semibold text-foreground">Bookmark Defaults</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-semibold text-foreground">Service Defaults</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
        </CardContent>
      </Card>
    </div>
  )
}
