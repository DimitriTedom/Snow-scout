import { generateRemixIdeas, type RemixSuggestion } from "@/lib/remix";

import { cacheRead, cacheWrite } from "./cache";
import {
  analyzeVideo,
  fetchChannelDetails,
  fetchTopComments,
  type YouTubeChannelDetails,
  type YouTubeCommentHighlight,
  type YouTubeSearchResult,
} from "./youtube";

export const GROK_AGENT_INSTRUCTIONS = {
  role: "YouTube ghost-niche strategist and outlier remix producer",
  purpose:
    "Use this JSON as INSPIRATION ONLY — understand the emotional struggle, curiosity engine, and structural reasons the source video went viral. Do NOT copy the title, script, or thumbnail verbatim.",
  tasks: [
    "Study sourceOutlier, viralSignals, and topComments to infer why viewers engaged.",
    "Study channelProject.bibleExcerpt — every remix must fit the user's channel lens.",
    "If userRemixMethod is provided, angle-shift the outlier through that method only.",
    "If userRemixMethod is null or empty, generate 3–5 distinct video ideas for the user's channel.",
    "For each idea return: title, hook (spoken cold-open), angle, thumbnailBrief, rationale, pillar (if applicable).",
    "Rank ideas by predicted CTR fit for the channel — not by copying the source.",
    "Wait for the user to pick ONE idea before writing a full script.",
  ],
  rules: [
    "Angle-shift — never plagiarize the source title or hook.",
    "Name the emotional engine (curiosity gap, injustice, identity, fear, status, etc.).",
    "Cite evidence from topComments and statistics — no invented view counts.",
    "One uncomfortable truth or reframe per idea — documentary tone, not hype.",
    "Output markdown the user can paste back into Snow Scout / Grok project chat.",
  ],
  outputFormat: {
    ideasCount: "3–5 when userRemixMethod is empty; 2–3 when userRemixMethod is set",
    fieldsPerIdea: ["title", "hook", "angle", "thumbnailBrief", "rationale", "pillar"],
  },
};

export type OutlierBrief = {
  schemaVersion: "1.0";
  generatedAt: string;
  agentInstructions: typeof GROK_AGENT_INSTRUCTIONS;
  userRemixMethod: string | null;
  channelProject: {
    id: string;
    name: string;
    slug: string;
    bibleExcerpt: string;
  };
  sourceOutlier: {
    videoId: string;
    url: string;
    title: string;
    description: string;
    tags: string[];
    categoryId: string | null;
    publishedAt: string;
    durationSec: number | null;
    durationLabel: string | null;
    thumbnailUrl: string;
    statistics: {
      views: number;
      likes: number;
      comments: number;
      engagementRate: number;
      outlierScore: number;
      likeToViewRatio: number;
      commentToViewRatio: number;
    };
  };
  sourceChannel: YouTubeChannelDetails | null;
  topComments: YouTubeCommentHighlight[];
  topCommentsNote: string;
  viralSignals: {
    engagementTier: "exceptional" | "strong" | "moderate" | "low";
    commentSentimentThemes: string[];
    likelyViralityDrivers: string[];
    remixOpportunities: string[];
  };
  scoutGeneratedIdeas: RemixSuggestion[] | null;
  scoutRemixProvider: string | null;
  grokPastePrompt: string;
};

type BuildBriefOptions = {
  project: {
    id: string;
    name: string;
    slug: string;
    bibleText: string;
  };
  videoUrl: string;
  userRemixMethod?: string | null;
  includeScoutIdeas?: boolean;
  scoutIdeaCount?: number;
};

function formatDuration(sec: number | null): string | null {
  if (sec == null) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}m ${s}s`;
}

function engagementTier(rate: number): OutlierBrief["viralSignals"]["engagementTier"] {
  if (rate >= 0.08) return "exceptional";
  if (rate >= 0.04) return "strong";
  if (rate >= 0.015) return "moderate";
  return "low";
}

function inferViralDrivers(
  video: YouTubeSearchResult,
  comments: YouTubeCommentHighlight[],
): string[] {
  const drivers: string[] = [];
  const title = video.title.toLowerCase();

  if (/why|how|what|secret|truth|never|can't|stop/.test(title)) {
    drivers.push("Curiosity-gap title framing (question or hidden-truth promise)");
  }
  if (video.views >= 500_000) drivers.push("Proven demand at scale (500K+ views)");
  if (video.engagementRate >= 0.04) drivers.push("High engagement rate — audience emotionally invested");
  if (video.comments >= 1000) drivers.push("Comment volume indicates debate/share impulse");
  if (/ancient|human|brain|history|psychology|evolution/.test(title)) {
    drivers.push("Evergreen intellectual curiosity niche");
  }
  if (comments.some((c) => c.likeCount >= 500)) {
    drivers.push("Top comments with high likes reveal shared emotional pain points");
  }
  if (drivers.length === 0) {
    drivers.push("Outlier score suggests above-average engagement for view tier");
  }
  return drivers;
}

function inferCommentThemes(comments: YouTubeCommentHighlight[]): string[] {
  if (comments.length === 0) return ["Comments disabled or unavailable — infer from title and description"];

  const blob = comments
    .slice(0, 8)
    .map((c) => c.text.toLowerCase())
    .join(" ");
  const themes: string[] = [];
  if (/relat|same|me too|i feel|struggle/.test(blob)) themes.push("Personal relatability / shared struggle");
  if (/wow|mind|blown|never knew|didn't know/.test(blob)) themes.push("Surprise and reframe (I never knew this)");
  if (/scary|dark|creepy|disturb/.test(blob)) themes.push("Dark curiosity / unease");
  if (/love|marriage|relationship|sex|dating/.test(blob)) themes.push("Intimacy / relationship lens");
  if (/evolution|brain|science|study/.test(blob)) themes.push("Science validation seeking");
  if (themes.length === 0) themes.push("Audience debate and story-sharing in comments");
  return themes;
}

function buildGrokPastePrompt(brief: Omit<OutlierBrief, "grokPastePrompt">): string {
  const methodLine = brief.userRemixMethod
    ? `Use this remix method: ${brief.userRemixMethod}`
    : "No remix method provided — generate 3–5 angle-shifted video ideas for my channel.";

  return [
    "I'm pasting a Snow Scout outlier brief. Follow agentInstructions in the JSON.",
    methodLine,
    `Channel: ${brief.channelProject.name}`,
    `Source outlier: ${brief.sourceOutlier.title} (${brief.sourceOutlier.url})`,
    "Study viralSignals and topComments for emotional engine. Angle-shift for my bible — do not copy.",
    "Return numbered ideas with title, hook, angle, thumbnailBrief, rationale. Wait for my pick before script.",
  ].join("\n");
}

const BIBLE_EXCERPT_MAX = 3500;
const DESCRIPTION_MAX = 2500;
const CHANNEL_DESC_MAX = 1200;

export async function buildOutlierBrief(options: BuildBriefOptions): Promise<OutlierBrief> {
  const video = await analyzeVideo(options.videoUrl);
  if (!video) {
    throw new Error("Invalid YouTube URL or video not found");
  }

  const cacheKey = `brief_${options.project.id}_${video.videoId}_${options.userRemixMethod ?? ""}_${options.includeScoutIdeas === true}`;
  const cached = await cacheRead<OutlierBrief>(cacheKey, 1000 * 60 * 60 * 6);
  if (cached) return cached;

  const [channel, topComments] = await Promise.all([
    fetchChannelDetails(video.channelId),
    fetchTopComments(video.videoId, 10),
  ]);

  let scoutGeneratedIdeas: RemixSuggestion[] | null = null;
  let scoutRemixProvider: string | null = null;

  // Scout ideas are optional — Grok generates ideas from agentInstructions when omitted.
  if (options.includeScoutIdeas === true) {
    const remix = await generateRemixIdeas({
      source: video,
      channelName: options.project.name,
      bibleText: options.project.bibleText.slice(0, BIBLE_EXCERPT_MAX),
      count: options.scoutIdeaCount ?? 3,
    });
    scoutGeneratedIdeas = remix.suggestions;
    scoutRemixProvider = remix.provider;
  }

  const views = video.views;
  const briefBase: Omit<OutlierBrief, "grokPastePrompt"> = {
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    agentInstructions: GROK_AGENT_INSTRUCTIONS,
    userRemixMethod: options.userRemixMethod?.trim() || null,
    channelProject: {
      id: options.project.id,
      name: options.project.name,
      slug: options.project.slug,
      bibleExcerpt: options.project.bibleText.slice(0, BIBLE_EXCERPT_MAX),
    },
    sourceOutlier: {
      videoId: video.videoId,
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      title: video.title,
      description: video.description.slice(0, DESCRIPTION_MAX),
      tags: video.tags ?? [],
      categoryId: video.categoryId ?? null,
      publishedAt: video.publishedAt,
      durationSec: video.durationSec,
      durationLabel: formatDuration(video.durationSec),
      thumbnailUrl: video.thumbnailUrl,
      statistics: {
        views: video.views,
        likes: video.likes,
        comments: video.comments,
        engagementRate: video.engagementRate,
        outlierScore: video.outlierScore,
        likeToViewRatio: views > 0 ? video.likes / views : 0,
        commentToViewRatio: views > 0 ? video.comments / views : 0,
      },
    },
    sourceChannel: channel
      ? {
          ...channel,
          description: channel.description.slice(0, CHANNEL_DESC_MAX),
        }
      : null,
    topComments,
    topCommentsNote:
      topComments.length > 0
        ? "Sorted by likeCount descending. Use to detect shared emotional pain and curiosity hooks."
        : "Comments unavailable (disabled, restricted, or API limit). Infer virality from title, description, and stats.",
    viralSignals: {
      engagementTier: engagementTier(video.engagementRate),
      commentSentimentThemes: inferCommentThemes(topComments),
      likelyViralityDrivers: inferViralDrivers(video, topComments),
      remixOpportunities: [
        "Re-point the curiosity engine through channel bible lens",
        "Extract the emotional struggle from top comments — not the surface topic",
        "Keep structural escalation (hook → mechanism → payoff) from source, change the lens",
      ],
    },
    scoutGeneratedIdeas,
    scoutRemixProvider,
  };

  const brief: OutlierBrief = {
    ...briefBase,
    grokPastePrompt: buildGrokPastePrompt(briefBase),
  };

  await cacheWrite(cacheKey, brief);
  return brief;
}