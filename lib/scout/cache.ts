import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { getCacheAdapter, getScoutCacheBucket, getScoutCacheDir } from "./config";
import { cacheObjectPath, storageReadJson, storageWriteJson } from "./supabase-storage";

/** Windows-forbidden: < > : " / \ | ? * and control chars */
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

export function toCacheFilename(key: string): string {
  const sanitized = key.replace(INVALID_FILENAME_CHARS, "_").replace(/\s+/g, "_").replace(/_+/g, "_");

  if (sanitized.length <= 180) {
    return sanitized;
  }

  const hash = createHash("sha256").update(key).digest("hex").slice(0, 12);
  return `${sanitized.slice(0, 80)}_${hash}`;
}

type CacheEntry<T> = { savedAt: string; data: T };

async function fileCacheRead<T>(key: string, maxAgeMs = 1000 * 60 * 60 * 12): Promise<T | null> {
  const file = join(getScoutCacheDir(), `${toCacheFilename(key)}.json`);
  try {
    const raw = await readFile(file, "utf8");
    const entry = JSON.parse(raw) as CacheEntry<T>;
    const ageMs = Date.now() - new Date(entry.savedAt).getTime();
    if (ageMs > maxAgeMs) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function fileCacheWrite<T>(key: string, data: T): Promise<void> {
  const dir = getScoutCacheDir();
  await mkdir(dir, { recursive: true });
  const entry: CacheEntry<T> = { savedAt: new Date().toISOString(), data };
  await writeFile(join(dir, `${toCacheFilename(key)}.json`), JSON.stringify(entry), "utf8");
}

export async function cacheRead<T>(key: string, maxAgeMs = 1000 * 60 * 60 * 12): Promise<T | null> {
  if (getCacheAdapter() === "supabase") {
    const fromStorage = await storageReadJson<T>(
      getScoutCacheBucket(),
      cacheObjectPath(key),
      maxAgeMs,
    );
    if (fromStorage != null) return fromStorage;
  }

  return fileCacheRead<T>(key, maxAgeMs);
}

export async function cacheWrite<T>(key: string, data: T): Promise<void> {
  if (getCacheAdapter() === "supabase") {
    const ok = await storageWriteJson(getScoutCacheBucket(), cacheObjectPath(key), data);
    if (ok) return;
  }

  await fileCacheWrite(key, data);
}