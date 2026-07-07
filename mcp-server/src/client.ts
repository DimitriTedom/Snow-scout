const SCOUT_API_URL = process.env.SCOUT_API_URL ?? "http://localhost:3002";

export async function scoutPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SCOUT_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Scout API ${res.status}`);
  }
  return data as T;
}

export function getScoutApiUrl(): string {
  return SCOUT_API_URL;
}