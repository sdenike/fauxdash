import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { isNull } from 'drizzle-orm';

let cache: Record<string, string> | null = null;
let cacheTime = 0;
const TTL = 30_000; // 30 seconds

export async function getGlobalSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && now - cacheTime < TTL) {
    return cache;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(settings)
    .where(isNull(settings.userId));

  const result: Record<string, string> = {};
  rows.forEach((row: any) => {
    result[row.key] = row.value || '';
  });

  cache = result;
  cacheTime = now;
  return result;
}

export function invalidateGlobalSettingsCache(): void {
  cache = null;
  cacheTime = 0;
}
