export interface Settings {
  // Search
  searchEnabled: boolean
  searchEngine: string
  customSearchName: string
  customSearchUrl: string
  searchInHeader: boolean
  // GeoIP
  geoipEnabled: boolean
  geoipProvider: 'maxmind' | 'ipinfo' | 'chain'
  geoipMaxmindPath: string
  geoipMaxmindLicenseKey: string
  geoipMaxmindAccountId: string
  geoipIpinfoToken: string
  geoipCacheDuration: number
  // Appearance
  defaultTheme: string
  themeColor: string
  siteTitle: string
  siteTitleEnabled: boolean
  showDescriptions: boolean // Global default for description visibility
  // Background Image
  backgroundImage: string
  backgroundDisplayMode: 'cover' | 'contain' | 'center' | 'tile'
  backgroundOpacity: number
  backgroundShowLoggedOut: boolean
  welcomeMessage: string
  welcomeMessageEnabled: boolean
  welcomeMessageTimeBased: boolean
  welcomeMessageMorning: string
  welcomeMessageAfternoon: string
  welcomeMessageEvening: string
  dateTimeEnabled: boolean
  dateTimePosition: 'left' | 'center' | 'right'
  dateTimeDisplayMode: 'text' | 'icon'
  dateFormat: string
  timeEnabled: boolean
  timeFormat: '12' | '24'
  showSeconds: boolean
  servicesPosition: string
  sectionOrder: string
  servicesIconSize: number
  servicesFontSize: number
  servicesDescriptionSpacing: number
  servicesItemSpacing: number
  bookmarksIconSize: number
  bookmarksFontSize: number
  descriptionSpacing: number
  itemSpacing: number
  servicesColumns: number
  bookmarksColumns: number
  // Weather
  weatherEnabled: boolean
  weatherDisplayMode: 'icon' | 'temp' | 'both'
  weatherShowPopup: boolean
  weatherProvider: string
  weatherLocations: string
  weatherLatitude: string
  weatherLongitude: string
  weatherAutoRotate: number
  tempestApiKey: string
  tempestStationId: string
  weatherapiKey: string
  openweatherKey: string
  // Defaults for new items
  defaultBookmarkCategoryEnabled: boolean
  defaultBookmarkCategoryRequiresAuth: boolean
  defaultBookmarkCategoryItemsToShow: number | null
  defaultBookmarkCategoryShowItemCount: boolean
  defaultBookmarkCategoryAutoExpanded: boolean
  defaultBookmarkCategoryShowOpenAll: boolean
  defaultBookmarkCategorySortBy: string
  defaultServiceCategoryEnabled: boolean
  defaultServiceCategoryRequiresAuth: boolean
  defaultServiceCategoryItemsToShow: number | null
  defaultServiceCategoryShowItemCount: boolean
  defaultServiceCategoryAutoExpanded: boolean
  defaultServiceCategoryShowOpenAll: boolean
  defaultServiceCategorySortBy: string
  defaultBookmarkEnabled: boolean
  defaultBookmarkRequiresAuth: boolean
  defaultServiceEnabled: boolean
  defaultServiceRequiresAuth: boolean
  // SMTP / Email
  smtpProvider: 'none' | 'custom' | 'google'
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpEncryption: 'none' | 'tls' | 'ssl'
  smtpFromEmail: string
  smtpFromName: string
  // Logging
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  // OIDC Authentication
  oidcEnabled: boolean
  oidcProviderName: string
  oidcClientId: string
  oidcClientSecret: string
  oidcIssuerUrl: string
  disablePasswordLogin: boolean
  // Homepage Content
  homepageDescriptionEnabled: boolean
  homepageDescription: string
  // Homepage Graphic
  homepageGraphicEnabled: boolean
  homepageGraphicPath: string
  homepageGraphicMaxWidth: number
  homepageGraphicHAlign: 'left' | 'center' | 'right'
  homepageGraphicVAlign: 'top' | 'center' | 'bottom'
  homepageGraphicPosition: 'above' | 'below'
}

export interface SettingsTabProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
}

export const defaultSettings: Settings = {
  searchEnabled: true,
  searchEngine: 'duckduckgo',
  customSearchName: '',
  customSearchUrl: '',
  searchInHeader: true,
  geoipEnabled: false,
  geoipProvider: 'maxmind',
  geoipMaxmindPath: './data/GeoLite2-City.mmdb',
  geoipMaxmindLicenseKey: '',
  geoipMaxmindAccountId: '',
  geoipIpinfoToken: '',
  geoipCacheDuration: 86400,
  defaultTheme: 'system',
  themeColor: 'Slate',
  siteTitle: 'Faux|Dash',
  siteTitleEnabled: true,
  showDescriptions: false, // Default: descriptions are hidden
  // Background Image
  backgroundImage: '',
  backgroundDisplayMode: 'cover',
  backgroundOpacity: 100,
  backgroundShowLoggedOut: false,
  welcomeMessage: 'Welcome back',
  welcomeMessageEnabled: true,
  welcomeMessageTimeBased: false,
  welcomeMessageMorning: 'Good morning',
  welcomeMessageAfternoon: 'Good afternoon',
  welcomeMessageEvening: 'Good evening',
  dateTimeEnabled: false,
  dateTimePosition: 'left',
  dateTimeDisplayMode: 'text',
  dateFormat: 'MMMM d, yyyy',
  timeEnabled: false,
  timeFormat: '12',
  showSeconds: false,
  servicesPosition: 'above',
  sectionOrder: 'services-first',
  servicesIconSize: 32,
  servicesFontSize: 16,
  servicesDescriptionSpacing: 4,
  servicesItemSpacing: 8,
  bookmarksIconSize: 32,
  bookmarksFontSize: 14,
  descriptionSpacing: 2,
  itemSpacing: 4,
  servicesColumns: 4,
  bookmarksColumns: 4,
  weatherEnabled: false,
  weatherDisplayMode: 'both',
  weatherShowPopup: true,
  weatherProvider: 'weatherapi',
  weatherLocations: '90210',
  weatherLatitude: '',
  weatherLongitude: '',
  weatherAutoRotate: 30,
  tempestApiKey: '',
  tempestStationId: '',
  weatherapiKey: '',
  openweatherKey: '',
  defaultBookmarkCategoryEnabled: true,
  defaultBookmarkCategoryRequiresAuth: false,
  defaultBookmarkCategoryItemsToShow: null,
  defaultBookmarkCategoryShowItemCount: false,
  defaultBookmarkCategoryAutoExpanded: false,
  defaultBookmarkCategoryShowOpenAll: false,
  defaultBookmarkCategorySortBy: 'order',
  defaultServiceCategoryEnabled: true,
  defaultServiceCategoryRequiresAuth: false,
  defaultServiceCategoryItemsToShow: null,
  defaultServiceCategoryShowItemCount: false,
  defaultServiceCategoryAutoExpanded: false,
  defaultServiceCategoryShowOpenAll: false,
  defaultServiceCategorySortBy: 'order',
  defaultBookmarkEnabled: true,
  defaultBookmarkRequiresAuth: false,
  defaultServiceEnabled: true,
  defaultServiceRequiresAuth: false,
  smtpProvider: 'none',
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  smtpEncryption: 'tls',
  smtpFromEmail: '',
  smtpFromName: 'Faux|Dash',
  logLevel: 'error',
  // OIDC Authentication
  oidcEnabled: false,
  oidcProviderName: '',
  oidcClientId: '',
  oidcClientSecret: '',
  oidcIssuerUrl: '',
  disablePasswordLogin: false,
  // Homepage Content
  homepageDescriptionEnabled: false,
  homepageDescription: '',
  // Homepage Graphic
  homepageGraphicEnabled: false,
  homepageGraphicPath: '',
  homepageGraphicMaxWidth: 200,
  homepageGraphicHAlign: 'center',
  homepageGraphicVAlign: 'center',
  homepageGraphicPosition: 'above',
}
