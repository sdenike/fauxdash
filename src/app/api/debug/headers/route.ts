import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClientIP } from '@/lib/geoip'

/**
 * Debug endpoint to show incoming headers
 * Only accessible to authenticated admin users
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const headers: Record<string, string> = {}

  // Collect all headers
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  // Get the IP using our standard function
  const detectedIP = getClientIP(request.headers, 'fallback-not-found')

  // Check specific proxy headers
  const proxyHeaders = {
    'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
    'cf-connecting-ipv6': request.headers.get('cf-connecting-ipv6'),
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    'x-real-ip': request.headers.get('x-real-ip'),
    'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    'cf-ray': request.headers.get('cf-ray'),
    'cf-ipcountry': request.headers.get('cf-ipcountry'),
  }

  return NextResponse.json({
    detectedIP,
    proxyHeaders,
    allHeaders: headers,
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    }
  })
}
