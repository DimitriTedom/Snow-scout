import type { YouTubeVideoStats } from "@/lib/scout/youtube";

import type { RemixSuggestion } from "./openrouter";

const ANGLES = [
  { id: "love", label: "love / relationships", prefix: "How Did", suffix: "Get Married?" },
  { id: "brain", label: "brain / dopamine", prefix: "Why Your Brain", suffix: "Can't Stop" },
  { id: "fear", label: "fear / survival", prefix: "What Killed", suffix: "First?" },
  { id: "empire", label: "empire / manipulation", prefix: "Who Engineered", suffix: "— And Why" },
  { id: "modern", label: "modern parallel", prefix: "Why You Still", suffix: "Today" },
];

function extractTopic(title: string): string {
  return title
    .replace(/[|:—–-].+$/, "")
    .replace(/^(what|why|how|the)\s+/i, "")
    .trim();
}

export function remixWithTemplate(options: {
  source: YouTubeVideoStats;
  channelName: string;
  count?: number;
}): RemixSuggestion[] {
  const topic = extractTopic(options.source.title);
  const n = options.count ?? 3;

  return ANGLES.slice(0, n).map((angle) => ({
    title: `${angle.prefix} ${topic} ${angle.suffix}`.replace(/\s+/g, " ").trim(),
    hook: `A ${options.source.views.toLocaleString()}-view outlier proved demand for "${options.source.title}". Reframe through ${angle.label} for ${options.channelName}.`,
    angle: angle.label,
    thumbnailBrief: `Same focal archetype as source outlier; 3–5 word overlay; ${angle.label} emotional trigger; high contrast.`,
    rationale: `Template angle-shift from source structure without copying title.`,
  }));
}