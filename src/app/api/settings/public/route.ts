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

    // Return only non-sensitive settings needed for login page
    return NextResponse.json({
      oidcEnabled: settingsObj.oidcEnabled === 'true' || false,
      oidcProviderName: settingsObj.oidcProviderName || 'OIDC',
      disablePasswordLogin: settingsObj.disablePasswordLogin === 'true' || false,
    });
  } catch (error) {
    console.error('Failed to fetch public settings:', error);
    // Return safe defaults on error
    return NextResponse.json({
      oidcEnabled: false,
      oidcProviderName: 'OIDC',
      disablePasswordLogin: false,
    });
  }
}
