import { getOpenRouterApiKeys, getOpenRouterModels } from "@/lib/scout/config";
import { Rotator } from "@/lib/scout/rotation";
import type { YouTubeVideoStats } from "@/lib/scout/youtube";

export type RemixSuggestion = {
  title: string;
  hook: string;
  angle: string;
  thumbnailBrief: string;
  rationale: string;
};

function openRouterKeys(): Rotator<string> {
  return new Rotator(getOpenRouterApiKeys());
}

function openRouterModels(): Rotator<string> {
  return new Rotator(getOpenRouterModels());
}

function buildPrompt(source: YouTubeVideoStats, bibleExcerpt: string, count: number): string {
  return `You are a YouTube ghost-niche strategist. Remix a proven viral outlier into NEW video ideas for a specific channel.

SOURCE OUTLIER:
- Title: ${source.title}
- Channel: ${source.channelTitle}
- Views: ${source.views}
- Engagement rate: ${(source.engagementRate * 100).toFixed(2)}%

CHANNEL BIBLE (excerpt):
${bibleExcerpt.slice(0, 6000)}

RULES:
1. Do NOT copy the source title verbatim — angle-shift for CTR.
2. Keep the curiosity structure (question, contrast, hidden truth).
3. Apply the channel bible lens (positioning, audience, tone).
4. Return exactly ${count} remix options.
5. Output valid JSON only — array of objects with keys: title, hook, angle, thumbnailBrief, rationale.

Example angle shift: "What Ancient Humans Did at Night" → "How Did Ancient Humans Get Married?" (love/mating lens).`;
}

function parseRemixJson(text: string): RemixSuggestion[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("OpenRouter response did not contain JSON array");
  const parsed = JSON.parse(jsonMatch[0]) as RemixSuggestion[];
  return parsed.slice(0, 5);
}

export async function remixWithOpenRouter(options: {
  source: YouTubeVideoStats;
  bibleText: string;
  count?: number;
}): Promise<{ suggestions: RemixSuggestion[]; model: string }> {
  const keys = getOpenRouterApiKeys();
  if (keys.length === 0) {
    throw new Error("OPENROUTER_API_KEYS is empty. Add at least one key or set SCOUT_REMIX_PROVIDER=template");
  }

  const prompt = buildPrompt(options.source, options.bibleText, options.count ?? 3);

  return openRouterKeys().withFallback(async (apiKey) => {
    return openRouterModels().withFallback(async (model) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/DimitriTedom/Snow-scout",
          "X-Title": "Snow Scout",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 1200,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenRouter ${res.status} (${model}): ${body.slice(0, 300)}`);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content ?? "";
      const suggestions = parseRemixJson(content);
      return { suggestions, model };
    });
  });
}