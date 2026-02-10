import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, clearOidcSettingsCache, reloadOidcProvider } from '@/lib/auth';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq, and, isNull, or, inArray } from 'drizzle-orm';
import { logger, LogLevel } from '@/lib/logger';
import { invalidateGlobalSettingsCache } from '@/lib/settings-cache';

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const userId = (session.user as any).id;

  // Single query: fetch both global (userId IS NULL) and user-specific settings
  const allSettings = await db
    .select()
    .from(settings)
    .where(or(isNull(settings.userId), eq(settings.userId, parseInt(userId))));

  const globalSettings = allSettings.filter((s: any) => s.userId === null);
  const userSettings = allSettings.filter((s: any) => s.userId !== null);

  // Settings that are global-only (user settings should never override these)
  const globalOnlyKeys = new Set([
    'oidcEnabled', 'oidcProviderName', 'oidcClientId', 'oidcClientSecret',
    'oidcIssuerUrl', 'disablePasswordLogin',
    'smtpProvider', 'smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword',
    'smtpEncryption', 'smtpFromEmail', 'smtpFromName', 'smtpVerified',
    'geoipEnabled', 'geoipProvider', 'geoipMaxmindPath', 'geoipMaxmindLicenseKey',
    'geoipMaxmindAccountId', 'geoipIpinfoToken', 'geoipCacheDuration',
  ]);

  // Convert to key-value object, starting with global settings
  const settingsObj: Record<string, string> = {};
  globalSettings.forEach((setting: any) => {
    settingsObj[setting.key] = setting.value || '';
  });
  // User settings override global settings, EXCEPT for global-only keys
  userSettings.forEach((setting: any) => {
    if (!globalOnlyKeys.has(setting.key)) {
      settingsObj[setting.key] = setting.value || '';
    }
  });

  // Sync log level to logger
  const logLevel = settingsObj.logLevel || process.env.LOG_LEVEL || 'error';
  if (['debug', 'info', 'warn', 'error'].includes(logLevel)) {
    logger.setLogLevel(logLevel as LogLevel);
  }

  // Return with defaults
  return NextResponse.json({
    searchEnabled: settingsObj.searchEnabled === 'false' ? false : true,
    searchInHeader: settingsObj.searchInHeader === 'true' || false,
    searchEngine: settingsObj.searchEngine || process.env.DEFAULT_SEARCH_ENGINE || 'duckduckgo',
    customSearchName: settingsObj.customSearchName || '',
    customSearchUrl: settingsObj.customSearchUrl || '',
    defaultTheme: settingsObj.defaultTheme || process.env.DEFAULT_THEME || 'system',
    themeColor: settingsObj.themeColor || 'Slate',
    siteTitle: settingsObj.siteTitle || 'Faux|Dash',
    siteTitleEnabled: settingsObj.siteTitleEnabled === 'false' ? false : true,
    siteTitleUseGradient: settingsObj.siteTitleUseGradient === 'false' ? false : true,
    siteTitleGradientFrom: settingsObj.siteTitleGradientFrom || '#0f172a',
    siteTitleGradientTo: settingsObj.siteTitleGradientTo || '#475569',
    siteTitleColor: settingsObj.siteTitleColor || '#0f172a',
    // Header Logo
    headerLogoEnabled: settingsObj.headerLogoEnabled === 'true' || false,
    headerLogoPath: settingsObj.headerLogoPath || '',
    headerLogoType: (settingsObj.headerLogoType || (settingsObj.headerLogoPath ? 'upload' : 'none')) as 'upload' | 'library' | 'url' | 'none',
    headerLogoPosition: settingsObj.headerLogoPosition || 'left',
    headerLogoHeight: parseInt(settingsObj.headerLogoHeight || '40'),
    showDescriptions: settingsObj.showDescriptions === 'true' || false,
    // Background Image
    backgroundImage: settingsObj.backgroundImage || '',
    backgroundDisplayMode: settingsObj.backgroundDisplayMode || 'cover',
    backgroundOpacity: parseInt(settingsObj.backgroundOpacity || '100'),
    backgroundShowLoggedOut: settingsObj.backgroundShowLoggedOut === 'true',
    welcomeMessage: settingsObj.welcomeMessage || 'Welcome back',
    welcomeMessageEnabled: settingsObj.welcomeMessageEnabled === 'false' ? false : true,
    welcomeMessageTimeBased: settingsObj.welcomeMessageTimeBased === 'true' || false,
    welcomeMessageMorning: settingsObj.welcomeMessageMorning || 'Good Morning',
    welcomeMessageAfternoon: settingsObj.welcomeMessageAfternoon || 'Good Afternoon',
    welcomeMessageEvening: settingsObj.welcomeMessageEvening || 'Good Evening',
    dateTimeEnabled: settingsObj.dateTimeEnabled === 'true' || false,
    dateTimePosition: settingsObj.dateTimePosition || 'left',
    dateTimeDisplayMode: settingsObj.dateTimeDisplayMode || 'text',
    dateFormat: settingsObj.dateFormat || 'EEEE, MMMM d, yyyy',
    timeEnabled: settingsObj.timeEnabled === 'true' || false,
    timeFormat: settingsObj.timeFormat || '12',
    showSeconds: settingsObj.showSeconds === 'true' || false,
    servicesPosition: settingsObj.servicesPosition || 'above',
    servicesIconSize: parseInt(settingsObj.servicesIconSize || '32'),
    servicesFontSize: parseInt(settingsObj.servicesFontSize || '16'),
    servicesDescriptionSpacing: parseInt(settingsObj.servicesDescriptionSpacing || '4'),
    servicesItemSpacing: parseInt(settingsObj.servicesItemSpacing || '8'),
    bookmarksIconSize: parseInt(settingsObj.bookmarksIconSize || '32'),
    bookmarksFontSize: parseInt(settingsObj.bookmarksFontSize || '14'),
    descriptionSpacing: parseInt(settingsObj.descriptionSpacing || '2'),
    itemSpacing: parseInt(settingsObj.itemSpacing || '4'),
    servicesColumns: parseInt(settingsObj.servicesColumns || '4'),
    bookmarksColumns: parseInt(settingsObj.bookmarksColumns || settingsObj.mainColumns || '4'),
    sectionOrder: settingsObj.sectionOrder || 'services-first',
    weatherEnabled: settingsObj.weatherEnabled === 'true' || false,
    weatherDisplayMode: settingsObj.weatherDisplayMode || 'both',
    weatherShowPopup: settingsObj.weatherShowPopup !== 'false',
    weatherProvider: settingsObj.weatherProvider || process.env.WEATHER_PROVIDER || 'weatherapi',
    weatherLocations: settingsObj.weatherLocations || process.env.WEATHER_LOCATIONS || '90210',
    weatherLatitude: settingsObj.weatherLatitude || '',
    weatherLongitude: settingsObj.weatherLongitude || '',
    weatherAutoRotate: parseInt(settingsObj.weatherAutoRotate || process.env.WEATHER_AUTO_ROTATE_SECONDS || '30'),
    tempestApiKey: settingsObj.tempestApiKey || process.env.TEMPEST_API_KEY || '',
    tempestStationId: settingsObj.tempestStationId || process.env.TEMPEST_STATION_ID || '',
    weatherapiKey: settingsObj.weatherapiKey || process.env.WEATHERAPI_KEY || '',
    openweatherKey: settingsObj.openweatherKey || process.env.OPENWEATHER_KEY || '',
    oidcEnabled: settingsObj.oidcEnabled === 'true' || false,
    oidcProviderName: settingsObj.oidcProviderName || '',
    oidcClientId: settingsObj.oidcClientId || process.env.OIDC_CLIENT_ID || '',
    oidcClientSecret: settingsObj.oidcClientSecret || process.env.OIDC_CLIENT_SECRET || '',
    oidcIssuerUrl: settingsObj.oidcIssuerUrl || process.env.OIDC_ISSUER_URL || '',
    disablePasswordLogin: settingsObj.disablePasswordLogin === 'true' || false,
    // GeoIP settings
    geoipEnabled: settingsObj.geoipEnabled === 'true' || false,
    geoipProvider: settingsObj.geoipProvider || 'maxmind',
    geoipMaxmindPath: settingsObj.geoipMaxmindPath || process.env.GEOIP_MAXMIND_PATH || './data/GeoLite2-City.mmdb',
    geoipMaxmindLicenseKey: settingsObj.geoipMaxmindLicenseKey || process.env.GEOIP_MAXMIND_LICENSE_KEY || '',
    geoipMaxmindAccountId: settingsObj.geoipMaxmindAccountId || process.env.GEOIP_MAXMIND_ACCOUNT_ID || '',
    geoipIpinfoToken: settingsObj.geoipIpinfoToken || process.env.GEOIP_IPINFO_TOKEN || '',
    geoipCacheDuration: parseInt(settingsObj.geoipCacheDuration || '86400'),
    // Defaults for new items
    defaultBookmarkCategoryEnabled: settingsObj.defaultBookmarkCategoryEnabled !== 'false',
    defaultBookmarkCategoryRequiresAuth: settingsObj.defaultBookmarkCategoryRequiresAuth === 'true',
    defaultBookmarkCategoryItemsToShow: settingsObj.defaultBookmarkCategoryItemsToShow ? parseInt(settingsObj.defaultBookmarkCategoryItemsToShow) : null,
    defaultBookmarkCategoryShowItemCount: settingsObj.defaultBookmarkCategoryShowItemCount === 'true',
    defaultBookmarkCategoryAutoExpanded: settingsObj.defaultBookmarkCategoryAutoExpanded === 'true',
    defaultBookmarkCategoryShowOpenAll: settingsObj.defaultBookmarkCategoryShowOpenAll === 'true',
    defaultBookmarkCategorySortBy: settingsObj.defaultBookmarkCategorySortBy || 'order',
    defaultServiceCategoryEnabled: settingsObj.defaultServiceCategoryEnabled !== 'false',
    defaultServiceCategoryRequiresAuth: settingsObj.defaultServiceCategoryRequiresAuth === 'true',
    defaultServiceCategoryItemsToShow: settingsObj.defaultServiceCategoryItemsToShow ? parseInt(settingsObj.defaultServiceCategoryItemsToShow) : null,
    defaultServiceCategoryShowItemCount: settingsObj.defaultServiceCategoryShowItemCount === 'true',
    defaultServiceCategoryAutoExpanded: settingsObj.defaultServiceCategoryAutoExpanded === 'true',
    defaultServiceCategoryShowOpenAll: settingsObj.defaultServiceCategoryShowOpenAll === 'true',
    defaultServiceCategorySortBy: settingsObj.defaultServiceCategorySortBy || 'order',
    defaultBookmarkEnabled: settingsObj.defaultBookmarkEnabled !== 'false',
    defaultBookmarkRequiresAuth: settingsObj.defaultBookmarkRequiresAuth === 'true',
    defaultServiceEnabled: settingsObj.defaultServiceEnabled !== 'false',
    defaultServiceRequiresAuth: settingsObj.defaultServiceRequiresAuth === 'true',
    // SMTP settings
    smtpProvider: settingsObj.smtpProvider || process.env.SMTP_PROVIDER || 'none',
    smtpHost: settingsObj.smtpHost || process.env.SMTP_HOST || '',
    smtpPort: parseInt(settingsObj.smtpPort || process.env.SMTP_PORT || '587'),
    smtpUsername: settingsObj.smtpUsername || process.env.SMTP_USERNAME || '',
    smtpPassword: settingsObj.smtpPassword || process.env.SMTP_PASSWORD || '',
    smtpEncryption: settingsObj.smtpEncryption || process.env.SMTP_ENCRYPTION || 'tls',
    smtpFromEmail: settingsObj.smtpFromEmail || process.env.SMTP_FROM_EMAIL || '',
    smtpFromName: settingsObj.smtpFromName || process.env.SMTP_FROM_NAME || 'Faux|Dash',
    smtpVerified: settingsObj.smtpVerified === 'true',
    // Logging settings
    logLevel: settingsObj.logLevel || process.env.LOG_LEVEL || 'info',
    // Homepage content settings
    homepageDescriptionEnabled: settingsObj.homepageDescriptionEnabled === 'true',
    homepageDescription: settingsObj.homepageDescription || '',
    // Homepage graphic settings
    homepageGraphicEnabled: settingsObj.homepageGraphicEnabled === 'true',
    homepageGraphicPath: settingsObj.homepageGraphicPath || '',
    homepageGraphicMaxWidth: parseInt(settingsObj.homepageGraphicMaxWidth || '200'),
    homepageGraphicHAlign: settingsObj.homepageGraphicHAlign || 'center',
    homepageGraphicVAlign: settingsObj.homepageGraphicVAlign || 'center',
    homepageGraphicPosition: settingsObj.homepageGraphicPosition || 'above',
    homepageGraphicHideWhenLoggedIn: settingsObj.homepageGraphicHideWhenLoggedIn === 'true',
    // Site favicon settings
    siteFavicon: settingsObj.siteFavicon || '',
    siteFaviconType: (settingsObj.siteFaviconType || 'default') as 'upload' | 'library' | 'url' | 'default',
    // PWA app icon settings
    pwaIconPath: settingsObj.pwaIconPath || '',
    pwaIconType: (settingsObj.pwaIconType || 'none') as 'upload' | 'library' | 'url' | 'none',
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const db = getDb();
  const userId = (session.user as any).id;

  // Build settings array from provided fields only
  const settingsToSave: { key: string; value: string }[] = [];

  // Add each field if it exists in the body
  if (body.searchEnabled !== undefined) settingsToSave.push({ key: 'searchEnabled', value: body.searchEnabled.toString() });
  if (body.searchInHeader !== undefined) settingsToSave.push({ key: 'searchInHeader', value: body.searchInHeader.toString() });
  if (body.searchEngine !== undefined) settingsToSave.push({ key: 'searchEngine', value: body.searchEngine });
  if (body.customSearchName !== undefined) settingsToSave.push({ key: 'customSearchName', value: body.customSearchName || '' });
  if (body.customSearchUrl !== undefined) settingsToSave.push({ key: 'customSearchUrl', value: body.customSearchUrl || '' });
  if (body.defaultTheme !== undefined) settingsToSave.push({ key: 'defaultTheme', value: body.defaultTheme });
  if (body.themeColor !== undefined) settingsToSave.push({ key: 'themeColor', value: body.themeColor || 'Slate' });
  if (body.siteTitle !== undefined) settingsToSave.push({ key: 'siteTitle', value: body.siteTitle || 'Faux|Dash' });
  if (body.siteTitleEnabled !== undefined) settingsToSave.push({ key: 'siteTitleEnabled', value: body.siteTitleEnabled.toString() });
  if (body.siteTitleUseGradient !== undefined) settingsToSave.push({ key: 'siteTitleUseGradient', value: body.siteTitleUseGradient.toString() });
  if (body.siteTitleGradientFrom !== undefined) settingsToSave.push({ key: 'siteTitleGradientFrom', value: body.siteTitleGradientFrom });
  if (body.siteTitleGradientTo !== undefined) settingsToSave.push({ key: 'siteTitleGradientTo', value: body.siteTitleGradientTo });
  if (body.siteTitleColor !== undefined) settingsToSave.push({ key: 'siteTitleColor', value: body.siteTitleColor });
  // Header Logo
  if (body.headerLogoEnabled !== undefined) settingsToSave.push({ key: 'headerLogoEnabled', value: body.headerLogoEnabled.toString() });
  if (body.headerLogoPath !== undefined) settingsToSave.push({ key: 'headerLogoPath', value: body.headerLogoPath || '' });
  if (body.headerLogoType !== undefined) settingsToSave.push({ key: 'headerLogoType', value: body.headerLogoType || 'none' });
  if (body.headerLogoPosition !== undefined) settingsToSave.push({ key: 'headerLogoPosition', value: body.headerLogoPosition || 'left' });
  if (body.headerLogoHeight !== undefined) settingsToSave.push({ key: 'headerLogoHeight', value: body.headerLogoHeight.toString() });
  if (body.showDescriptions !== undefined) settingsToSave.push({ key: 'showDescriptions', value: body.showDescriptions.toString() });
  // Background Image
  if (body.backgroundImage !== undefined) settingsToSave.push({ key: 'backgroundImage', value: body.backgroundImage || '' });
  if (body.backgroundDisplayMode !== undefined) settingsToSave.push({ key: 'backgroundDisplayMode', value: body.backgroundDisplayMode || 'cover' });
  if (body.backgroundOpacity !== undefined) settingsToSave.push({ key: 'backgroundOpacity', value: body.backgroundOpacity.toString() });
  if (body.backgroundShowLoggedOut !== undefined) settingsToSave.push({ key: 'backgroundShowLoggedOut', value: body.backgroundShowLoggedOut.toString() });
  if (body.welcomeMessage !== undefined) settingsToSave.push({ key: 'welcomeMessage', value: body.welcomeMessage || 'Welcome back' });
  if (body.welcomeMessageEnabled !== undefined) settingsToSave.push({ key: 'welcomeMessageEnabled', value: body.welcomeMessageEnabled.toString() });
  if (body.welcomeMessageTimeBased !== undefined) settingsToSave.push({ key: 'welcomeMessageTimeBased', value: body.welcomeMessageTimeBased.toString() });
  if (body.welcomeMessageMorning !== undefined) settingsToSave.push({ key: 'welcomeMessageMorning', value: body.welcomeMessageMorning || 'Good Morning' });
  if (body.welcomeMessageAfternoon !== undefined) settingsToSave.push({ key: 'welcomeMessageAfternoon', value: body.welcomeMessageAfternoon || 'Good Afternoon' });
  if (body.welcomeMessageEvening !== undefined) settingsToSave.push({ key: 'welcomeMessageEvening', value: body.welcomeMessageEvening || 'Good Evening' });
  if (body.dateTimeEnabled !== undefined) settingsToSave.push({ key: 'dateTimeEnabled', value: body.dateTimeEnabled.toString() });
  if (body.dateTimePosition !== undefined) settingsToSave.push({ key: 'dateTimePosition', value: body.dateTimePosition || 'left' });
  if (body.dateTimeDisplayMode !== undefined) settingsToSave.push({ key: 'dateTimeDisplayMode', value: body.dateTimeDisplayMode || 'text' });
  if (body.dateFormat !== undefined) settingsToSave.push({ key: 'dateFormat', value: body.dateFormat || 'EEEE, MMMM d, yyyy' });
  if (body.timeEnabled !== undefined) settingsToSave.push({ key: 'timeEnabled', value: body.timeEnabled.toString() });
  if (body.timeFormat !== undefined) settingsToSave.push({ key: 'timeFormat', value: body.timeFormat || '12' });
  if (body.showSeconds !== undefined) settingsToSave.push({ key: 'showSeconds', value: body.showSeconds.toString() });
  if (body.servicesPosition !== undefined) settingsToSave.push({ key: 'servicesPosition', value: body.servicesPosition || 'above' });
  if (body.servicesIconSize !== undefined) settingsToSave.push({ key: 'servicesIconSize', value: body.servicesIconSize.toString() });
  if (body.servicesFontSize !== undefined) settingsToSave.push({ key: 'servicesFontSize', value: body.servicesFontSize.toString() });
  if (body.servicesDescriptionSpacing !== undefined) settingsToSave.push({ key: 'servicesDescriptionSpacing', value: body.servicesDescriptionSpacing.toString() });
  if (body.servicesItemSpacing !== undefined) settingsToSave.push({ key: 'servicesItemSpacing', value: body.servicesItemSpacing.toString() });
  if (body.bookmarksIconSize !== undefined) settingsToSave.push({ key: 'bookmarksIconSize', value: body.bookmarksIconSize.toString() });
  if (body.bookmarksFontSize !== undefined) settingsToSave.push({ key: 'bookmarksFontSize', value: body.bookmarksFontSize.toString() });
  if (body.descriptionSpacing !== undefined) settingsToSave.push({ key: 'descriptionSpacing', value: body.descriptionSpacing.toString() });
  if (body.itemSpacing !== undefined) settingsToSave.push({ key: 'itemSpacing', value: body.itemSpacing.toString() });
  if (body.servicesColumns !== undefined) settingsToSave.push({ key: 'servicesColumns', value: body.servicesColumns.toString() });
  if (body.bookmarksColumns !== undefined) settingsToSave.push({ key: 'bookmarksColumns', value: body.bookmarksColumns.toString() });
  if (body.sectionOrder !== undefined) settingsToSave.push({ key: 'sectionOrder', value: body.sectionOrder });
  if (body.weatherEnabled !== undefined) settingsToSave.push({ key: 'weatherEnabled', value: body.weatherEnabled.toString() });
  if (body.weatherDisplayMode !== undefined) settingsToSave.push({ key: 'weatherDisplayMode', value: body.weatherDisplayMode || 'both' });
  if (body.weatherShowPopup !== undefined) settingsToSave.push({ key: 'weatherShowPopup', value: body.weatherShowPopup.toString() });
  if (body.weatherProvider !== undefined) settingsToSave.push({ key: 'weatherProvider', value: body.weatherProvider });
  if (body.weatherLocations !== undefined) settingsToSave.push({ key: 'weatherLocations', value: body.weatherLocations });
  if (body.weatherLatitude !== undefined) settingsToSave.push({ key: 'weatherLatitude', value: body.weatherLatitude || '' });
  if (body.weatherLongitude !== undefined) settingsToSave.push({ key: 'weatherLongitude', value: body.weatherLongitude || '' });
  if (body.weatherAutoRotate !== undefined) settingsToSave.push({ key: 'weatherAutoRotate', value: body.weatherAutoRotate.toString() });
  if (body.tempestApiKey !== undefined) settingsToSave.push({ key: 'tempestApiKey', value: body.tempestApiKey });
  if (body.tempestStationId !== undefined) settingsToSave.push({ key: 'tempestStationId', value: body.tempestStationId });
  if (body.weatherapiKey !== undefined) settingsToSave.push({ key: 'weatherapiKey', value: body.weatherapiKey });
  if (body.openweatherKey !== undefined) settingsToSave.push({ key: 'openweatherKey', value: body.openweatherKey });
  if (body.oidcEnabled !== undefined) settingsToSave.push({ key: 'oidcEnabled', value: body.oidcEnabled.toString() });
  if (body.oidcProviderName !== undefined) settingsToSave.push({ key: 'oidcProviderName', value: body.oidcProviderName || '' });
  if (body.oidcClientId !== undefined) settingsToSave.push({ key: 'oidcClientId', value: body.oidcClientId || '' });
  if (body.oidcClientSecret !== undefined) settingsToSave.push({ key: 'oidcClientSecret', value: body.oidcClientSecret || '' });
  if (body.oidcIssuerUrl !== undefined) settingsToSave.push({ key: 'oidcIssuerUrl', value: body.oidcIssuerUrl || '' });
  if (body.disablePasswordLogin !== undefined) settingsToSave.push({ key: 'disablePasswordLogin', value: body.disablePasswordLogin.toString() });
  // GeoIP settings
  if (body.geoipEnabled !== undefined) settingsToSave.push({ key: 'geoipEnabled', value: body.geoipEnabled.toString() });
  if (body.geoipProvider !== undefined) settingsToSave.push({ key: 'geoipProvider', value: body.geoipProvider || 'maxmind' });
  if (body.geoipMaxmindPath !== undefined) settingsToSave.push({ key: 'geoipMaxmindPath', value: body.geoipMaxmindPath || '' });
  if (body.geoipMaxmindLicenseKey !== undefined) settingsToSave.push({ key: 'geoipMaxmindLicenseKey', value: body.geoipMaxmindLicenseKey || '' });
  if (body.geoipMaxmindAccountId !== undefined) settingsToSave.push({ key: 'geoipMaxmindAccountId', value: body.geoipMaxmindAccountId || '' });
  if (body.geoipIpinfoToken !== undefined) settingsToSave.push({ key: 'geoipIpinfoToken', value: body.geoipIpinfoToken || '' });
  if (body.geoipCacheDuration !== undefined) settingsToSave.push({ key: 'geoipCacheDuration', value: body.geoipCacheDuration.toString() });
  // Defaults for new items
  if (body.defaultBookmarkCategoryEnabled !== undefined) settingsToSave.push({ key: 'defaultBookmarkCategoryEnabled', value: body.defaultBookmarkCategoryEnabled.toString() });
  if (body.defaultBookmarkCategoryRequiresAuth !== undefined) settingsToSave.push({ key: 'defaultBookmarkCategoryRequiresAuth', value: body.defaultBookmarkCategoryRequiresAuth.toString() });
  if (body.defaultBookmarkCategoryItemsToShow !== undefined) settingsToSave.push({ key: 'defaultBookmarkCategoryItemsToShow', value: body.defaultBookmarkCategoryItemsToShow?.toString() || '' });
  if (body.defaultBookmarkCategoryShowItemCount !== undefined) settingsToSave.push({ key: 'defaultBookmarkCategoryShowItemCount', value: body.defaultBookmarkCategoryShowItemCount.toString() });
  if (body.defaultBookmarkCategoryAutoExpanded !== undefined) settingsToSave.push({ key: 'defaultBookmarkCategoryAutoExpanded', value: body.defaultBookmarkCategoryAutoExpanded.toString() });
  if (body.defaultBookmarkCategoryShowOpenAll !== undefined) settingsToSave.push({ key: 'defaultBookmarkCategoryShowOpenAll', value: body.defaultBookmarkCategoryShowOpenAll.toString() });
  if (body.defaultBookmarkCategorySortBy !== undefined) settingsToSave.push({ key: 'defaultBookmarkCategorySortBy', value: body.defaultBookmarkCategorySortBy || 'order' });
  if (body.defaultServiceCategoryEnabled !== undefined) settingsToSave.push({ key: 'defaultServiceCategoryEnabled', value: body.defaultServiceCategoryEnabled.toString() });
  if (body.defaultServiceCategoryRequiresAuth !== undefined) settingsToSave.push({ key: 'defaultServiceCategoryRequiresAuth', value: body.defaultServiceCategoryRequiresAuth.toString() });
  if (body.defaultServiceCategoryItemsToShow !== undefined) settingsToSave.push({ key: 'defaultServiceCategoryItemsToShow', value: body.defaultServiceCategoryItemsToShow?.toString() || '' });
  if (body.defaultServiceCategoryShowItemCount !== undefined) settingsToSave.push({ key: 'defaultServiceCategoryShowItemCount', value: body.defaultServiceCategoryShowItemCount.toString() });
  if (body.defaultServiceCategoryAutoExpanded !== undefined) settingsToSave.push({ key: 'defaultServiceCategoryAutoExpanded', value: body.defaultServiceCategoryAutoExpanded.toString() });
  if (body.defaultServiceCategoryShowOpenAll !== undefined) settingsToSave.push({ key: 'defaultServiceCategoryShowOpenAll', value: body.defaultServiceCategoryShowOpenAll.toString() });
  if (body.defaultServiceCategorySortBy !== undefined) settingsToSave.push({ key: 'defaultServiceCategorySortBy', value: body.defaultServiceCategorySortBy || 'order' });
  if (body.defaultBookmarkEnabled !== undefined) settingsToSave.push({ key: 'defaultBookmarkEnabled', value: body.defaultBookmarkEnabled.toString() });
  if (body.defaultBookmarkRequiresAuth !== undefined) settingsToSave.push({ key: 'defaultBookmarkRequiresAuth', value: body.defaultBookmarkRequiresAuth.toString() });
  if (body.defaultServiceEnabled !== undefined) settingsToSave.push({ key: 'defaultServiceEnabled', value: body.defaultServiceEnabled.toString() });
  if (body.defaultServiceRequiresAuth !== undefined) settingsToSave.push({ key: 'defaultServiceRequiresAuth', value: body.defaultServiceRequiresAuth.toString() });
  // SMTP settings
  if (body.smtpProvider !== undefined) settingsToSave.push({ key: 'smtpProvider', value: body.smtpProvider });
  if (body.smtpHost !== undefined) settingsToSave.push({ key: 'smtpHost', value: body.smtpHost || '' });
  if (body.smtpPort !== undefined) settingsToSave.push({ key: 'smtpPort', value: body.smtpPort.toString() });
  if (body.smtpUsername !== undefined) settingsToSave.push({ key: 'smtpUsername', value: body.smtpUsername || '' });
  if (body.smtpPassword !== undefined) settingsToSave.push({ key: 'smtpPassword', value: body.smtpPassword || '' });
  if (body.smtpEncryption !== undefined) settingsToSave.push({ key: 'smtpEncryption', value: body.smtpEncryption });
  if (body.smtpFromEmail !== undefined) settingsToSave.push({ key: 'smtpFromEmail', value: body.smtpFromEmail || '' });
  if (body.smtpFromName !== undefined) settingsToSave.push({ key: 'smtpFromName', value: body.smtpFromName || 'Faux|Dash' });
  // Logging settings
  if (body.logLevel !== undefined) {
    settingsToSave.push({ key: 'logLevel', value: body.logLevel || 'info' });
    // Update the logger's log level immediately
    logger.setLogLevel(body.logLevel as LogLevel);
  }
  // Homepage content settings
  if (body.homepageDescriptionEnabled !== undefined) settingsToSave.push({ key: 'homepageDescriptionEnabled', value: body.homepageDescriptionEnabled.toString() });
  if (body.homepageDescription !== undefined) settingsToSave.push({ key: 'homepageDescription', value: body.homepageDescription || '' });
  // Homepage graphic settings
  if (body.homepageGraphicEnabled !== undefined) settingsToSave.push({ key: 'homepageGraphicEnabled', value: body.homepageGraphicEnabled.toString() });
  if (body.homepageGraphicPath !== undefined) settingsToSave.push({ key: 'homepageGraphicPath', value: body.homepageGraphicPath || '' });
  if (body.homepageGraphicMaxWidth !== undefined) settingsToSave.push({ key: 'homepageGraphicMaxWidth', value: body.homepageGraphicMaxWidth.toString() });
  if (body.homepageGraphicHAlign !== undefined) settingsToSave.push({ key: 'homepageGraphicHAlign', value: body.homepageGraphicHAlign || 'center' });
  if (body.homepageGraphicVAlign !== undefined) settingsToSave.push({ key: 'homepageGraphicVAlign', value: body.homepageGraphicVAlign || 'center' });
  if (body.homepageGraphicPosition !== undefined) settingsToSave.push({ key: 'homepageGraphicPosition', value: body.homepageGraphicPosition || 'above' });
  if (body.homepageGraphicHideWhenLoggedIn !== undefined) settingsToSave.push({ key: 'homepageGraphicHideWhenLoggedIn', value: body.homepageGraphicHideWhenLoggedIn.toString() });
  // Site favicon settings
  if (body.siteFavicon !== undefined) settingsToSave.push({ key: 'siteFavicon', value: body.siteFavicon || '' });
  if (body.siteFaviconType !== undefined) settingsToSave.push({ key: 'siteFaviconType', value: body.siteFaviconType || 'default' });
  // PWA app icon settings
  if (body.pwaIconPath !== undefined) settingsToSave.push({ key: 'pwaIconPath', value: body.pwaIconPath || '' });
  if (body.pwaIconType !== undefined) settingsToSave.push({ key: 'pwaIconType', value: body.pwaIconType || 'none' });

  // Settings that should be stored globally (userId = null) rather than per-user
  const globalSettingKeys = [
    // Authentication settings
    'oidcEnabled', 'oidcProviderName', 'oidcClientId', 'oidcClientSecret',
    'oidcIssuerUrl', 'disablePasswordLogin',
    // Email settings
    'smtpProvider', 'smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword',
    'smtpEncryption', 'smtpFromEmail', 'smtpFromName',
    // GeoIP settings
    'geoipEnabled', 'geoipProvider', 'geoipMaxmindPath', 'geoipMaxmindLicenseKey',
    'geoipMaxmindAccountId', 'geoipIpinfoToken', 'geoipCacheDuration',
    // Theme settings (shared across all users)
    'defaultTheme', 'themeColor', 'siteTitle', 'siteTitleEnabled',
    'siteTitleUseGradient', 'siteTitleGradientFrom', 'siteTitleGradientTo', 'siteTitleColor',
    // Homepage content settings
    'homepageDescriptionEnabled', 'homepageDescription',
    // Homepage graphic settings
    'homepageGraphicEnabled', 'homepageGraphicPath', 'homepageGraphicMaxWidth',
    'homepageGraphicHAlign', 'homepageGraphicVAlign', 'homepageGraphicPosition',
    'homepageGraphicHideWhenLoggedIn',
    // Site favicon settings
    'siteFavicon', 'siteFaviconType',
    // PWA app icon settings
    'pwaIconPath', 'pwaIconType',
  ];

  // Split into global vs user settings
  const globalToSave = settingsToSave.filter(s => globalSettingKeys.includes(s.key));
  const userToSave = settingsToSave.filter(s => !globalSettingKeys.includes(s.key));

  // Batch upsert in a transaction: DELETE existing keys then INSERT new values
  await db.transaction(async (tx: any) => {
    // Clean up stale user-specific copies of global-only settings
    const globalKeyList = globalSettingKeys;
    if (globalKeyList.length > 0) {
      await tx
        .delete(settings)
        .where(and(
          inArray(settings.key, globalKeyList),
          eq(settings.userId, parseInt(userId))
        ));
    }

    // Batch upsert global settings
    if (globalToSave.length > 0) {
      const globalKeys = globalToSave.map(s => s.key);
      await tx
        .delete(settings)
        .where(and(
          inArray(settings.key, globalKeys),
          isNull(settings.userId)
        ));
      await tx
        .insert(settings)
        .values(globalToSave.map(s => ({
          userId: null,
          key: s.key,
          value: s.value,
        })));
    }

    // Batch upsert user settings
    if (userToSave.length > 0) {
      const userKeys = userToSave.map(s => s.key);
      await tx
        .delete(settings)
        .where(and(
          inArray(settings.key, userKeys),
          eq(settings.userId, parseInt(userId))
        ));
      await tx
        .insert(settings)
        .values(userToSave.map(s => ({
          userId: parseInt(userId),
          key: s.key,
          value: s.value,
        })));
    }
  });

  // Clear caches so changes take effect immediately
  invalidateGlobalSettingsCache();
  clearOidcSettingsCache();

  // Check if any OIDC settings were changed
  const oidcSettingKeys = ['oidcEnabled', 'oidcProviderName', 'oidcClientId', 'oidcClientSecret', 'oidcIssuerUrl', 'disablePasswordLogin'];
  const oidcSettingsChanged = settingsToSave.some(s => oidcSettingKeys.includes(s.key));

  if (oidcSettingsChanged) {
    // Reload OIDC provider configuration without restart
    console.log('SETTINGS API: OIDC settings changed, triggering reload...');
    console.log('SETTINGS API: Changed settings:', settingsToSave
      .filter(s => oidcSettingKeys.includes(s.key))
      .map(s => ({
        key: s.key,
        value: s.key === 'oidcClientSecret' ? '***REDACTED***' : s.value
      }))
    );

    const result = await reloadOidcProvider();

    if (result.success) {
      console.log('SETTINGS API: OIDC reload successful');
    } else {
      console.error('SETTINGS API: OIDC reload failed:', result.error);
    }
  }

  return NextResponse.json({ success: true });
}
