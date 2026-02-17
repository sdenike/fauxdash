import Redis from 'ioredis';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { isNull } from 'drizzle-orm';

let redis: Redis | null = null;
let lastConfigCheck = 0;
const CONFIG_CHECK_INTERVAL = 30000; // Check config every 30 seconds

interface RedisConfig {
  enabled: boolean;
  host: string;
  port: number;
  password: string;
  database: number;
}

function getRedisConfigFromDb(): RedisConfig {
  try {
    const db = getDb();
    const allSettings = db.select().from(settings).where(isNull(settings.userId)).all();
    const settingsObj: Record<string, string> = {};
    for (const s of allSettings) {
      if (s.key && s.value !== null) {
        settingsObj[s.key] = s.value;
      }
    }

    return {
      enabled: settingsObj.redisEnabled === 'true',
      host: settingsObj.redisHost || 'localhost',
      port: parseInt(settingsObj.redisPort || '6379', 10),
      password: settingsObj.redisPassword || '',
      database: parseInt(settingsObj.redisDatabase || '0', 10),
    };
  } catch (error) {
    // Database might not be ready yet (during startup)
    console.error('Could not read Redis config from DB:', error);
    return {
      enabled: false,
      host: 'localhost',
      port: 6379,
      password: '',
      database: 0,
    };
  }
}

function buildRedisUrl(config: RedisConfig): string {
  let url = 'redis://';
  if (config.password) {
    url += `:${config.password}@`;
  }
  url += `${config.host}:${config.port}/${config.database}`;
  return url;
}

export const getRedis = () => {
  const now = Date.now();

  // Periodically check if config has changed
  if (now - lastConfigCheck > CONFIG_CHECK_INTERVAL) {
    lastConfigCheck = now;
    const config = getRedisConfigFromDb();

    if (!config.enabled) {
      // Redis disabled - disconnect if connected
      if (redis) {
        redis.disconnect();
        redis = null;
      }
      return null;
    }

    // Check if we need to reconnect with new config
    if (!redis) {
      const redisUrl = buildRedisUrl(config);
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 50, 2000);
        },
        lazyConnect: true,
      });

      redis.on('error', (err) => {
        console.error('Redis error:', err);
      });
    }
  }

  // Initial check on first call
  if (redis === null && lastConfigCheck === 0) {
    lastConfigCheck = now;
    const config = getRedisConfigFromDb();

    if (!config.enabled) {
      return null;
    }

    const redisUrl = buildRedisUrl(config);
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 50, 2000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  return redis;
};

export const cacheGet = async (key: string) => {
  const redisClient = getRedis();
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

export const cacheSet = async (key: string, value: any, ttl: number = 300) => {
  const redisClient = getRedis();
  if (!redisClient) return;

  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

export const cacheDel = async (key: string) => {
  const redisClient = getRedis();
  if (!redisClient) return;

  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

// Force reconnect with new settings
export const reconnectRedis = () => {
  if (redis) {
    redis.disconnect();
    redis = null;
  }
  lastConfigCheck = 0; // Force config reload
};
