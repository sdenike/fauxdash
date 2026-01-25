import Redis from 'ioredis';

let redis: Redis | null = null;

export const getRedis = () => {
  if (process.env.REDIS_ENABLED !== 'true') {
    return null;
  }

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 50, 2000);
      },
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
