export function parseCommaList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getYouTubeApiKeys(): string[] {
  return parseCommaList(process.env.YOUTUBE_API_KEYS);
}

export function getOpenRouterApiKeys(): string[] {
  return parseCommaList(process.env.OPENROUTER_API_KEYS);
}

export function getOpenRouterModels(): string[] {
  const models = parseCommaList(process.env.OPENROUTER_REMIX_MODELS);
  if (models.length > 0) return models;
  return [
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "qwen/qwen-2-7b-instruct:free",
  ];
}

export function getRemixProvider(): "openrouter" | "template" | "agent" {
  const p = process.env.SCOUT_REMIX_PROVIDER?.toLowerCase();
  if (p === "openrouter" || p === "template" || p === "agent") return p;
  return "openrouter";
}

export function getScoutCacheDir(): string {
  return (
    process.env.SCOUT_CACHE_DIR ??
    "D:/SnowDev/Videos/Youtube/CRAVE & CONQUER/.scout-cache"
  );
}

export function getCacheAdapter(): "file" | "supabase" {
  return process.env.SCOUT_CACHE_ADAPTER === "supabase" ? "supabase" : "file";
}

export function getScoutCacheBucket(): string {
  return process.env.SCOUT_CACHE_BUCKET ?? "scout-cache";
}

export function getScoutBriefsBucket(): string {
  return process.env.SCOUT_BRIEFS_BUCKET ?? "scout-briefs";
}

export function getStoreAdapter(): "prisma" | "file" {
  return process.env.SCOUT_STORE_ADAPTER === "file" ? "file" : "prisma";
}