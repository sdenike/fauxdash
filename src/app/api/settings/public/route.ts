import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { isNull } from 'drizzle-orm';

// Force dynamic rendering - this route must query the database at request time
export const dynamic = 'force-dynamic';

// Public settings endpoint for login page (unauthenticated access)
// Only returns non-sensitive settings needed for login UI
export async function GET() {
  try {
    const db = getDb();

    // Fetch global settings (userId is null)
    const globalSettings = await db
      .select()
      .from(settings)
      .where(isNull(settings.userId));

    // Convert to key-value object
    const settingsObj: Record<string, string> = {};
    globalSettings.forEach((setting: any) => {
      settingsObj[setting.key] = setting.value || '';
    });

    // Return only non-sensitive settings needed for login page and public display
    return NextResponse.json({
      // Authentication settings
      oidcEnabled: settingsObj.oidcEnabled === 'true' || false,
      oidcProviderName: settingsObj.oidcProviderName || 'OIDC',
      disablePasswordLogin: settingsObj.disablePasswordLogin === 'true' || false,
      // Theme settings (visible to all users)
      defaultTheme: settingsObj.defaultTheme || 'system',
      themeColor: settingsObj.themeColor || 'Slate',
      // Site branding (visible to all users)
      siteTitle: settingsObj.siteTitle || 'Faux|Dash',
      siteTitleEnabled: settingsObj.siteTitleEnabled !== 'false',
      // Homepage content settings (visible to all users)
      homepageDescriptionEnabled: settingsObj.homepageDescriptionEnabled === 'true',
      homepageDescription: settingsObj.homepageDescription || '',
      // Homepage graphic settings (visible to all users)
      homepageGraphicEnabled: settingsObj.homepageGraphicEnabled === 'true',
      homepageGraphicPath: settingsObj.homepageGraphicPath || '',
      homepageGraphicMaxWidth: parseInt(settingsObj.homepageGraphicMaxWidth || '200'),
      homepageGraphicHAlign: settingsObj.homepageGraphicHAlign || 'center',
      homepageGraphicVAlign: settingsObj.homepageGraphicVAlign || 'center',
      homepageGraphicPosition: settingsObj.homepageGraphicPosition || 'above',
    });
  } catch (error) {
    console.error('Failed to fetch public settings:', error);
    // Return safe defaults on error
    return NextResponse.json({
      // Authentication defaults
      oidcEnabled: false,
      oidcProviderName: 'OIDC',
      disablePasswordLogin: false,
      // Theme defaults
      defaultTheme: 'system',
      themeColor: 'Slate',
      // Site branding defaults
      siteTitle: 'Faux|Dash',
      siteTitleEnabled: true,
      // Homepage content defaults
      homepageDescriptionEnabled: false,
      homepageDescription: '',
      // Homepage graphic defaults
      homepageGraphicEnabled: false,
      homepageGraphicPath: '',
      homepageGraphicMaxWidth: 200,
      homepageGraphicHAlign: 'center',
      homepageGraphicVAlign: 'center',
      homepageGraphicPosition: 'above',
    });
  }
}
