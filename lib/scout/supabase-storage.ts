import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { toCacheFilename } from "./cache";

type StorageEntry<T> = { savedAt: string; data: T };

export async function storageReadJson<T>(
  bucket: string,
  objectPath: string,
  maxAgeMs?: number,
): Promise<T | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.storage.from(bucket).download(objectPath);
  if (error || !data) return null;

  try {
    const raw = await data.text();
    const entry = JSON.parse(raw) as StorageEntry<T>;
    if (maxAgeMs != null) {
      const ageMs = Date.now() - new Date(entry.savedAt).getTime();
      if (ageMs > maxAgeMs) return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function storageWriteJson<T>(bucket: string, objectPath: string, data: T): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  const entry: StorageEntry<T> = { savedAt: new Date().toISOString(), data };
  const body = JSON.stringify(entry);

  const { error } = await admin.storage.from(bucket).upload(objectPath, body, {
    contentType: "application/json",
    upsert: true,
  });

  return !error;
}

export async function storageListPrefixes(bucket: string, prefix: string): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  const { data, error } = await admin.storage.from(bucket).list(prefix, {
    limit: 100,
    sortBy: { column: "updated_at", order: "desc" },
  });

  if (error || !data) return [];
  return data.filter((item) => item.name.endsWith(".json")).map((item) => item.name);
}

export function cacheObjectPath(key: string): string {
  return `api-cache/${toCacheFilename(key)}.json`;
}