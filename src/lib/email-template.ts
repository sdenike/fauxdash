import { getDb } from '@/db'
import { settings } from '@/db/schema'
import { isNull } from 'drizzle-orm'

interface EmailTemplateOptions {
  title: string
  body: string
  buttonText?: string
  buttonUrl?: string
  footerText?: string
}

async function getSiteSettings(): Promise<{ siteTitle: string; headerLogoPath: string; headerLogoEnabled: boolean }> {
  const db = getDb()
  const globalSettings = await db
    .select()
    .from(settings)
    .where(isNull(settings.userId))

  const settingsObj: Record<string, string> = {}
  globalSettings.forEach((setting: any) => {
    settingsObj[setting.key] = setting.value || ''
  })

  return {
    siteTitle: settingsObj.siteTitle || 'Faux|Dash',
    headerLogoPath: settingsObj.headerLogoPath || '',
    headerLogoEnabled: settingsObj.headerLogoEnabled === 'true',
  }
}

export async function buildEmailHtml(options: EmailTemplateOptions): Promise<string> {
  const { title, body, buttonText, buttonUrl, footerText } = options
  const site = await getSiteSettings()

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const logoHtml = site.headerLogoEnabled && site.headerLogoPath
    ? `<img src="${baseUrl}${site.headerLogoPath}" alt="${site.siteTitle}" style="height: 32px; width: auto; margin-right: 12px; vertical-align: middle;" />`
    : ''

  const buttonHtml = buttonText && buttonUrl
    ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${buttonUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">${buttonText}</a>
      </div>
    `
    : ''

  const footer = footerText || `Sent by ${site.siteTitle}`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px;">
          <!-- Header -->
          <tr>
            <td style="padding: 0 0 24px 4px;">
              ${logoHtml}<span style="font-size: 18px; font-weight: 700; color: #18181b; vertical-align: middle;">${site.siteTitle}</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <h1 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #18181b;">${title}</h1>
              <div style="font-size: 14px; line-height: 1.6; color: #3f3f46;">
                ${body}
              </div>
              ${buttonHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 4px 0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">${footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
