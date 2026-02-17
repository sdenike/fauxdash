import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Redis from 'ioredis'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { host, port, password, database } = await request.json()

    if (!host || !port) {
      return NextResponse.json({
        success: false,
        message: 'Host and port are required',
      })
    }

    // Build Redis URL
    let redisUrl = `redis://`
    if (password) {
      redisUrl += `:${password}@`
    }
    redisUrl += `${host}:${port}/${database || 0}`

    // Create a test connection
    const redis = new Redis(redisUrl, {
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't retry for test
    })

    // Wait for connection or error
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        redis.disconnect()
        reject(new Error('Connection timeout'))
      }, 5000)

      redis.on('ready', () => {
        clearTimeout(timeout)
        resolve()
      })

      redis.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })

    // Test with a PING
    const pong = await redis.ping()

    // Get some info
    const info = await redis.info('server')
    const versionMatch = info.match(/redis_version:([^\r\n]+)/)
    const version = versionMatch ? versionMatch[1] : 'unknown'

    // Clean up
    await redis.quit()

    return NextResponse.json({
      success: true,
      message: `Connected successfully! Redis ${version}`,
    })
  } catch (error: any) {
    console.error('Redis test error:', error)

    let message = 'Failed to connect to Redis'
    if (error.message.includes('ECONNREFUSED')) {
      message = 'Connection refused. Is Redis running?'
    } else if (error.message.includes('ENOTFOUND')) {
      message = 'Host not found. Check the hostname.'
    } else if (error.message.includes('WRONGPASS') || error.message.includes('NOAUTH')) {
      message = 'Authentication failed. Check the password.'
    } else if (error.message.includes('timeout')) {
      message = 'Connection timeout. Check host and port.'
    } else if (error.message) {
      message = error.message
    }

    return NextResponse.json({
      success: false,
      message,
    })
  }
}
