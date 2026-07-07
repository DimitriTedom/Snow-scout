import { cacheRead, cacheWrite } from "./cache";
import { getYouTubeApiKeys } from "./config";
import { Rotator } from "./rotation";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

export type YouTubeVideoStats = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  durationSec: number | null;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  outlierScore: number;
};

export type YouTubeSearchResult = YouTubeVideoStats & {
  description: string;
  tags?: string[];
  categoryId?: string | null;
};

export type YouTubeChannelDetails = {
  channelId: string;
  title: string;
  customUrl: string | null;
  description: string;
  country: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  statistics: {
    subscriberCount: number | null;
    viewCount: number | null;
    videoCount: number | null;
  };
};

export type YouTubeCommentHighlight = {
  commentId: string;
  text: string;
  likeCount: number;
  replyCount: number;
  authorDisplayName: string;
  authorChannelUrl: string | null;
  publishedAt: string;
};

let keyRotator: Rotator<string> | null = null;

function youtubeKeys(): Rotator<string> {
  const keys = getYouTubeApiKeys();
  if (!keyRotator || keyRotator.count !== keys.length) {
    keyRotator = new Rotator(keys);
  }
  return keyRotator;
}

function engagementRate(views: number, likes: number, comments: number): number {
  if (views <= 0) return 0;
  return (likes + comments * 3) / views;
}

function parseDuration(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  return h * 3600 + min * 60 + s;
}

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0] ?? null;
    return url.searchParams.get("v");
  } catch {
    return null;
  }
}

function extractChannelId(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.startsWith("UC") && trimmed.length >= 20) return trimmed;
  const handleMatch = trimmed.match(/youtube\.com\/(@[\w.-]+)/);
  if (handleMatch) return handleMatch[1];
  const channelMatch = trimmed.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (channelMatch) return channelMatch[1];
  return null;
}

async function ytFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  return youtubeKeys().withFallback(async (apiKey) => {
    const qs = new URLSearchParams({ ...params, key: apiKey });
    const res = await fetch(`${YT_BASE}${path}?${qs}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`YouTube API ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  });
}

export async function searchOutliers(options: {
  query: string;
  maxResults?: number;
  publishedAfter?: string;
  order?: "viewCount" | "relevance" | "date";
}): Promise<YouTubeSearchResult[]> {
  const cacheKey = `search_${options.query}_${options.maxResults ?? 25}`;
  const cached = await cacheRead<YouTubeSearchResult[]>(cacheKey);
  if (cached) return cached;

  type SearchResp = { items?: { id: { videoId: string } }[] };
  const search = await ytFetch<SearchResp>("/search", {
    part: "snippet",
    type: "video",
    q: options.query,
    maxResults: String(options.maxResults ?? 25),
    order: options.order ?? "viewCount",
    ...(options.publishedAfter ? { publishedAfter: options.publishedAfter } : {}),
  });

  const ids = (search.items ?? []).map((i) => i.id.videoId).filter(Boolean);
  if (ids.length === 0) return [];

  const stats = await fetchVideoStats(ids);
  await cacheWrite(cacheKey, stats);
  return stats;
}

export async function fetchVideoStats(videoIds: string[]): Promise<YouTubeSearchResult[]> {
  type VideoResp = {
    items?: {
      id: string;
      snippet: {
        title: string;
        channelId: string;
        channelTitle: string;
        publishedAt: string;
        description: string;
        tags?: string[];
        categoryId?: string;
        thumbnails?: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } };
      };
      statistics: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
      contentDetails?: { duration?: string };
    }[];
  };

  const data = await ytFetch<VideoResp>("/videos", {
    part: "snippet,statistics,contentDetails",
    id: videoIds.join(","),
  });

  return (data.items ?? []).map((item) => {
    const views = Number(item.statistics.viewCount ?? 0);
    const likes = Number(item.statistics.likeCount ?? 0);
    const comments = Number(item.statistics.commentCount ?? 0);
    const er = engagementRate(views, likes, comments);
    const thumb =
      item.snippet.thumbnails?.maxres?.url ??
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.medium?.url ??
      "";

    return {
      videoId: item.id,
      title: item.snippet.title,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
      tags: item.snippet.tags ?? [],
      categoryId: item.snippet.categoryId ?? null,
      thumbnailUrl: thumb,
      durationSec: parseDuration(item.contentDetails?.duration),
      views,
      likes,
      comments,
      engagementRate: er,
      outlierScore: er * Math.log10(Math.max(views, 10)),
    };
  });
}

export async function analyzeVideo(input: string): Promise<YouTubeSearchResult | null> {
  const videoId = extractVideoId(input);
  if (!videoId) return null;
  const rows = await fetchVideoStats([videoId]);
  return rows[0] ?? null;
}

export function rankByEngagement<T extends YouTubeVideoStats>(videos: T[]): T[] {
  return [...videos].sort((a, b) => b.outlierScore - a.outlierScore);
}

export async function fetchChannelDetails(channelId: string): Promise<YouTubeChannelDetails | null> {
  const cacheKey = `channel_${channelId}`;
  const cached = await cacheRead<YouTubeChannelDetails>(cacheKey);
  if (cached) return cached;

  type ChannelResp = {
    items?: {
      id: string;
      snippet?: {
        title?: string;
        description?: string;
        customUrl?: string;
        country?: string;
        publishedAt?: string;
        thumbnails?: { high?: { url: string }; medium?: { url: string } };
      };
      statistics?: {
        subscriberCount?: string;
        viewCount?: string;
        videoCount?: string;
        hiddenSubscriberCount?: boolean;
      };
    }[];
  };

  const data = await ytFetch<ChannelResp>("/channels", {
    part: "snippet,statistics",
    id: channelId,
  });

  const item = data.items?.[0];
  if (!item) return null;

  const stats = item.statistics;
  const hiddenSubs = stats?.hiddenSubscriberCount === true;

  const channel: YouTubeChannelDetails = {
    channelId: item.id,
    title: item.snippet?.title ?? "",
    customUrl: item.snippet?.customUrl ?? null,
    description: (item.snippet?.description ?? "").slice(0, 4000),
    country: item.snippet?.country ?? null,
    publishedAt: item.snippet?.publishedAt ?? null,
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? null,
    statistics: {
      subscriberCount: hiddenSubs ? null : Number(stats?.subscriberCount ?? 0),
      viewCount: Number(stats?.viewCount ?? 0),
      videoCount: Number(stats?.videoCount ?? 0),
    },
  };

  await cacheWrite(cacheKey, channel);
  return channel;
}

export async function fetchTopComments(
  videoId: string,
  limit = 15,
): Promise<YouTubeCommentHighlight[]> {
  const cacheKey = `comments_${videoId}_${limit}`;
  const cached = await cacheRead<YouTubeCommentHighlight[]>(cacheKey);
  if (cached) return cached;

  type ThreadResp = {
    items?: {
      id: string;
      snippet: {
        totalReplyCount?: number;
        topLevelComment: {
          id: string;
          snippet: {
            textDisplay?: string;
            authorDisplayName?: string;
            authorChannelUrl?: string;
            likeCount?: number;
            publishedAt?: string;
          };
        };
      };
    }[];
  };

  try {
    const data = await ytFetch<ThreadResp>("/commentThreads", {
      part: "snippet",
      videoId,
      maxResults: "50",
      order: "relevance",
      textFormat: "plainText",
    });

    const comments = (data.items ?? [])
      .map((thread) => {
        const c = thread.snippet.topLevelComment;
        const s = c.snippet;
        return {
          commentId: c.id,
          text: (s.textDisplay ?? "").slice(0, 400),
          likeCount: Number(s.likeCount ?? 0),
          replyCount: Number(thread.snippet.totalReplyCount ?? 0),
          authorDisplayName: s.authorDisplayName ?? "Anonymous",
          authorChannelUrl: s.authorChannelUrl ?? null,
          publishedAt: s.publishedAt ?? "",
        } satisfies YouTubeCommentHighlight;
      })
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit);

    await cacheWrite(cacheKey, comments);
    return comments;
  } catch {
    return [];
  }
}

export async function resolveChannelUploadsPlaylist(channelUrlOrId: string): Promise<string | null> {
  const hint = extractChannelId(channelUrlOrId);
  if (!hint) return null;

  type ChannelResp = { items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] };

  const params: Record<string, string> = { part: "contentDetails" };
  if (hint.startsWith("@")) {
    params.forHandle = hint.slice(1);
  } else {
    params.id = hint;
  }

  const data = await ytFetch<ChannelResp>("/channels", params);
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

export { extractVideoId, extractChannelId };