import { getRemixProvider } from "@/lib/scout/config";
import type { YouTubeVideoStats } from "@/lib/scout/youtube";

import { remixWithOpenRouter, type RemixSuggestion } from "./openrouter";
import { remixWithTemplate } from "./template";

export type RemixResult = {
  provider: string;
  model?: string;
  suggestions: RemixSuggestion[];
};

export async function generateRemixIdeas(options: {
  source: YouTubeVideoStats;
  channelName: string;
  bibleText: string;
  count?: number;
}): Promise<RemixResult> {
  const provider = getRemixProvider();

  if (provider === "agent") {
    return {
      provider: "agent",
      suggestions: remixWithTemplate({ ...options, count: options.count ?? 3 }),
    };
  }

  if (provider === "template") {
    return {
      provider: "template",
      suggestions: remixWithTemplate(options),
    };
  }

  try {
    const { suggestions, model } = await remixWithOpenRouter(options);
    return { provider: "openrouter", model, suggestions };
  } catch {
    return {
      provider: "template-fallback",
      suggestions: remixWithTemplate(options),
    };
  }
}

export type { RemixSuggestion };