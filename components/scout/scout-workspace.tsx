"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Download, ExternalLink, FileJson, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SearchHit = {
  videoId: string;
  title: string;
  channelTitle: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  outlierScore: number;
  thumbnailUrl: string;
};

type RemixSuggestion = {
  title: string;
  hook: string;
  angle: string;
  thumbnailBrief: string;
  rationale: string;
};

type OutlierBrief = {
  schemaVersion: string;
  generatedAt: string;
  grokPastePrompt: string;
  userRemixMethod: string | null;
  channelProject: { name: string; id?: string; slug?: string; bibleExcerpt?: string };
  sourceOutlier: {
    videoId: string;
    url: string;
    title: string;
    statistics: {
      views: number;
      likes: number;
      comments: number;
      outlierScore: number;
      engagementRate: number;
    };
  };
  sourceChannel: {
    title: string;
    customUrl: string | null;
    statistics: { subscriberCount: number | null; videoCount: number | null };
  } | null;
  topComments: { text: string; likeCount: number; authorDisplayName: string }[];
  viralSignals: {
    engagementTier: string;
    likelyViralityDrivers: string[];
    commentSentimentThemes: string[];
  };
  scoutGeneratedIdeas: RemixSuggestion[] | null;
  scoutRemixProvider: string | null;
};

const textareaClass =
  "border-input bg-background/60 ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[72px] w-full rounded-xl border border-white/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2";

function briefStorageKey(projectId: string) {
  return `snow-scout-brief:${projectId}`;
}

function isValidBrief(value: unknown): value is OutlierBrief {
  if (!value || typeof value !== "object") return false;
  const b = value as Partial<OutlierBrief>;
  return (
    typeof b.sourceOutlier?.videoId === "string" &&
    typeof b.sourceOutlier?.title === "string" &&
    typeof b.grokPastePrompt === "string"
  );
}

function normalizeBrief(raw: unknown): OutlierBrief | null {
  if (!isValidBrief(raw)) return null;
  return {
    ...raw,
    topComments: Array.isArray(raw.topComments) ? raw.topComments : [],
    viralSignals: {
      engagementTier: raw.viralSignals?.engagementTier ?? "moderate",
      likelyViralityDrivers: Array.isArray(raw.viralSignals?.likelyViralityDrivers)
        ? raw.viralSignals.likelyViralityDrivers
        : [],
      commentSentimentThemes: Array.isArray(raw.viralSignals?.commentSentimentThemes)
        ? raw.viralSignals.commentSentimentThemes
        : [],
    },
    scoutGeneratedIdeas: Array.isArray(raw.scoutGeneratedIdeas) ? raw.scoutGeneratedIdeas : null,
  };
}

async function copyText(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function downloadJson(brief: OutlierBrief, quiet = false) {
  const slug = brief.sourceOutlier.videoId;
  const blob = new Blob([JSON.stringify(brief, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scout-outlier-brief_${slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
  if (!quiet) toast.success("JSON downloaded");
}

function BriefPanel({
  brief,
  onAddScoutIdeas,
  addingIdeas,
  projectId,
  cloudStoragePath,
  embedded = false,
}: {
  brief: OutlierBrief;
  onAddScoutIdeas: () => void;
  addingIdeas: boolean;
  projectId: string;
  cloudStoragePath: string | null;
  embedded?: boolean;
}) {
  const drivers = brief.viralSignals?.likelyViralityDrivers ?? [];
  const comments = brief.topComments ?? [];
  const stats = brief.sourceOutlier?.statistics;

  return (
    <section
      id="scout-outlier-brief-panel"
      className={
        embedded
          ? "space-y-4"
          : "space-y-4 rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 shadow-lg shadow-primary/10"
      }
    >
      {!embedded && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-primary">
              Outlier brief ready
            </h2>
            <p className="text-sm text-muted-foreground">Grok-ready JSON — copy or download below</p>
          </div>
          <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => copyText(JSON.stringify(brief, null, 2), "Full JSON")}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => copyText(brief.grokPastePrompt, "Grok prompt")}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy Grok prompt
          </Button>
          <Button size="sm" className="cursor-pointer snow-glow" onClick={() => downloadJson(brief)}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download .json
          </Button>
        </div>
      </div>
      )}

      {embedded && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => copyText(JSON.stringify(brief, null, 2), "Full JSON")}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => copyText(brief.grokPastePrompt, "Grok prompt")}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy Grok prompt
          </Button>
          <Button size="sm" className="cursor-pointer snow-glow" onClick={() => downloadJson(brief)}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download .json
          </Button>
        </div>
      )}

      <div className="snow-panel space-y-4 p-5">
        <div>
          <p className="text-sm font-medium">{brief.sourceOutlier.title}</p>
          <a
            href={brief.sourceOutlier.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            {brief.sourceOutlier.url}
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {(stats?.views ?? 0).toLocaleString()} views
          </Badge>
          <Badge variant="outline">
            score {(stats?.outlierScore ?? 0).toFixed(2)}
          </Badge>
          <Badge variant="success">{brief.viralSignals?.engagementTier ?? "moderate"} engagement</Badge>
          {brief.sourceChannel && (
            <Badge variant="outline">
              {brief.sourceChannel.title}
              {brief.sourceChannel.statistics.subscriberCount != null
                ? ` · ${brief.sourceChannel.statistics.subscriberCount.toLocaleString()} subs`
                : ""}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Why it likely went viral
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {drivers.map((d) => (
              <li key={d} className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        {comments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top liked comments ({comments.length})
            </p>
            {comments.slice(0, 3).map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/10 bg-background/40 p-3 text-sm"
              >
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{c.authorDisplayName}</span>
                  {" · "}
                  {c.likeCount.toLocaleString()} likes
                </p>
                <p className="mt-1 line-clamp-3">{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {(!brief.scoutGeneratedIdeas || brief.scoutGeneratedIdeas.length === 0) && (
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={addingIdeas}
          onClick={onAddScoutIdeas}
        >
          {addingIdeas ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Add Scout starter ideas (optional)
        </Button>
      )}

      {brief.scoutGeneratedIdeas && brief.scoutGeneratedIdeas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">
            Scout starter ideas{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({brief.scoutRemixProvider})
            </span>
          </h3>
          {brief.scoutGeneratedIdeas.map((idea, i) => (
            <div key={i} className="snow-panel space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Option {i + 1}</Badge>
                <Badge variant="outline">{idea.angle}</Badge>
              </div>
              <p className="font-medium">{idea.title}</p>
              <p className="text-sm text-muted-foreground">{idea.hook}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Paste JSON + Grok prompt into your channel Grok project. Pick one idea, then request the
        script.{" "}
        {cloudStoragePath ? (
          <>
            Saved to Supabase Storage{" "}
            <span className="font-mono text-xs text-primary/80">{cloudStoragePath}</span>
          </>
        ) : (
          <>Brief cached in browser for project {projectId.slice(0, 8)}…</>
        )}
      </p>
    </section>
  );
}

export function ScoutWorkspace({
  projectId,
  projectName,
  seedKeywords,
}: {
  projectId: string;
  projectName: string;
  seedKeywords: string[];
}) {
  const briefPanelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(seedKeywords[0] ?? "");
  const [remixMethod, setRemixMethod] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [addingIdeas, setAddingIdeas] = useState(false);
  const [buildingVideoId, setBuildingVideoId] = useState<string | null>(null);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [brief, setBrief] = useState<OutlierBrief | null>(null);
  const [cloudStoragePath, setCloudStoragePath] = useState<string | null>(null);
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null);
  const [briefDialogOpen, setBriefDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheBriefLocally = useCallback(
    (next: OutlierBrief | null) => {
      try {
        if (next) {
          const payload = JSON.stringify(next);
          sessionStorage.setItem(briefStorageKey(projectId), payload);
          localStorage.setItem(briefStorageKey(projectId), payload);
        } else {
          sessionStorage.removeItem(briefStorageKey(projectId));
          localStorage.removeItem(briefStorageKey(projectId));
        }
      } catch {
        // storage quota — in-memory brief still works
      }
    },
    [projectId],
  );

  const saveBriefToCloud = useCallback(
    async (next: OutlierBrief): Promise<string | null> => {
      try {
        const res = await fetch("/api/scout/briefs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, brief: next }),
        });
        const data = (await res.json()) as { storagePath?: string; error?: string };
        if (!res.ok) return null;
        return data.storagePath ?? null;
      } catch {
        return null;
      }
    },
    [projectId],
  );

  const persistBrief = useCallback(
    (
      next: OutlierBrief | null,
      options?: {
        openDialog?: boolean;
        autoDownload?: boolean;
        storagePath?: string | null;
        savedIdeaId?: string | null;
        skipCloudSave?: boolean;
      },
    ) => {
      setBrief(next);
      if (next) {
        if (options?.openDialog) setBriefDialogOpen(true);
        if (options?.autoDownload) downloadJson(next, true);
        cacheBriefLocally(next);
        if (options?.savedIdeaId) setSavedIdeaId(options.savedIdeaId);
        if (options?.storagePath) {
          setCloudStoragePath(options.storagePath);
        } else if (!options?.skipCloudSave) {
          void saveBriefToCloud(next).then((path) => {
            if (path) setCloudStoragePath(path);
          });
        }
      } else {
        setBriefDialogOpen(false);
        setCloudStoragePath(null);
        setSavedIdeaId(null);
        cacheBriefLocally(null);
      }
    },
    [cacheBriefLocally, saveBriefToCloud],
  );

  useEffect(() => {
    let cancelled = false;

    async function restoreBrief() {
      try {
        const res = await fetch(`/api/scout/briefs?projectId=${encodeURIComponent(projectId)}`);
        if (res.ok) {
          const data = (await res.json()) as {
            brief?: unknown;
            meta?: { storagePath?: string; savedIdeaId?: string };
          };
          const fromCloud = normalizeBrief(data.brief);
          if (!cancelled && fromCloud) {
            setBrief(fromCloud);
            setCloudStoragePath(data.meta?.storagePath ?? null);
            setSavedIdeaId(data.meta?.savedIdeaId ?? null);
            cacheBriefLocally(fromCloud);
            return;
          }
        }
      } catch {
        // fall through to browser cache
      }

      try {
        const raw =
          sessionStorage.getItem(briefStorageKey(projectId)) ??
          localStorage.getItem(briefStorageKey(projectId));
        if (!raw || cancelled) return;
        const restored = normalizeBrief(JSON.parse(raw));
        if (restored) setBrief(restored);
      } catch {
        sessionStorage.removeItem(briefStorageKey(projectId));
        localStorage.removeItem(briefStorageKey(projectId));
      }
    }

    void restoreBrief();
    return () => {
      cancelled = true;
    };
  }, [projectId, cacheBriefLocally]);

  useEffect(() => {
    if (!brief) return;
    const t = window.setTimeout(() => {
      briefPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(t);
  }, [brief]);

  async function runSearch(searchQuery = query) {
    setSearchLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scout/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, projectId, maxResults: 15 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
      setQuery(searchQuery);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }

  async function runRemix(videoId: string) {
    setBriefLoading(true);
    setBuildingVideoId(videoId);
    setError(null);
    try {
      const res = await fetch("/api/scout/outlier-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          remixMethod: remixMethod.trim() || undefined,
          includeScoutIdeas: false,
        }),
      });
      const raw = await res.text();
      let data: {
        brief?: unknown;
        error?: string;
        storagePath?: string | null;
        savedIdeaId?: string | null;
        storage?: string;
      };
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        throw new Error("Server returned invalid JSON — try refreshing the page");
      }
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Brief failed",
        );
      }

      const normalized = normalizeBrief(data.brief);
      if (!normalized) {
        throw new Error("Brief response was empty or malformed — check Network tab for /api/scout/outlier-brief");
      }

      persistBrief(normalized, {
        openDialog: true,
        autoDownload: true,
        storagePath: data.storagePath ?? null,
        savedIdeaId: data.savedIdeaId ?? null,
        skipCloudSave: true,
      });

      const savedMsg =
        data.storage === "supabase"
          ? "Outlier brief ready — saved to cloud"
          : "Outlier brief ready — saved to your remix library";
      toast.success(savedMsg);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Brief failed";
      setError(message);
      toast.error(message);
    } finally {
      setBriefLoading(false);
      setBuildingVideoId(null);
    }
  }

  async function addScoutIdeas() {
    if (!brief) return;
    setAddingIdeas(true);
    setError(null);
    try {
      const res = await fetch("/api/scout/remix-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          videoUrl: brief.sourceOutlier.url,
          count: 3,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ideas failed");
      const updated: OutlierBrief = {
        ...brief,
        scoutGeneratedIdeas: data.suggestions ?? [],
        scoutRemixProvider: data.provider ?? null,
      };
      persistBrief(updated);
      toast.success("Scout starter ideas added to brief");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ideas failed");
    } finally {
      setAddingIdeas(false);
    }
  }

  const loading = searchLoading || briefLoading;

  return (
    <div className="space-y-6">
      {brief && (
        <>
          <div
            ref={briefPanelRef}
            className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 p-4 shadow-lg shadow-emerald-500/10"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-emerald-300">Outlier brief ready</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{brief.sourceOutlier.title}</p>
                {(cloudStoragePath || savedIdeaId) && (
                  <p className="text-xs text-emerald-400/80">
                    {cloudStoragePath ? "Saved to cloud" : "Saved to remix library"}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {savedIdeaId && (
                  <Button asChild size="sm" variant="outline" className="cursor-pointer">
                    <Link href={`/dashboard/remixes/${savedIdeaId}`}>
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      View in library
                    </Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  className="cursor-pointer snow-glow"
                  onClick={() => setBriefDialogOpen(true)}
                >
                  <FileJson className="mr-1.5 h-3.5 w-3.5" />
                  Open brief
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => downloadJson(brief)}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download .json
                </Button>
              </div>
            </div>
          </div>

          <Dialog open={briefDialogOpen} onOpenChange={setBriefDialogOpen}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-primary/30">
              <DialogHeader>
                <DialogTitle>Outlier brief ready</DialogTitle>
                <DialogDescription>
                  Grok-ready JSON for {brief.channelProject?.name ?? projectName}
                </DialogDescription>
              </DialogHeader>
              <BriefPanel
                brief={brief}
                onAddScoutIdeas={addScoutIdeas}
                addingIdeas={addingIdeas}
                projectId={projectId}
                cloudStoragePath={cloudStoragePath}
                embedded
              />
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            size="sm"
            className="fixed bottom-6 right-6 z-50 cursor-pointer shadow-lg snow-glow"
            onClick={() => setBriefDialogOpen(true)}
          >
            <FileJson className="mr-1.5 h-4 w-4" />
            Brief ready
          </Button>
        </>
      )}

      <div className="snow-panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="query">Search keyword</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ancient humans night"
              className="cursor-text"
            />
          </div>
          <Button
            onClick={() => runSearch()}
            disabled={loading || !query.trim()}
            className="cursor-pointer snow-glow min-w-[120px]"
          >
            {searchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>
        {seedKeywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {seedKeywords.map((kw) => (
              <Button
                key={kw}
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => runSearch(kw)}
                disabled={searchLoading || briefLoading}
              >
                {kw}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="snow-panel space-y-2 p-6">
        <Label htmlFor="remix-method">Your remix method (optional)</Label>
        <textarea
          id="remix-method"
          className={textareaClass}
          value={remixMethod}
          onChange={(e) => setRemixMethod(e.target.value)}
          placeholder="e.g. evolutionary mismatch lens… Leave empty and Grok will propose 3–5 ideas from the JSON."
        />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Ranked outliers <span className="text-muted-foreground">({projectName})</span>
          </h2>
          {results.map((v) => (
            <div
              key={v.videoId}
              className="snow-panel flex flex-col gap-4 p-4 transition-colors hover:border-primary/25 sm:flex-row sm:items-center"
            >
              {v.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.thumbnailUrl}
                  alt={`Thumbnail for ${v.title}`}
                  width={144}
                  height={80}
                  className="h-20 w-36 shrink-0 rounded-lg border border-white/10 object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="line-clamp-2 font-medium leading-snug">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.channelTitle}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{v.views.toLocaleString()} views</Badge>
                  <Badge variant="outline">score {v.outlierScore.toFixed(2)}</Badge>
                  <Badge variant="success">{(v.engagementRate * 100).toFixed(2)}% eng.</Badge>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="cursor-pointer shrink-0"
                onClick={() => runRemix(v.videoId)}
                disabled={briefLoading}
              >
                {buildingVideoId === v.videoId ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                )}
                {buildingVideoId === v.videoId ? "Building…" : "Build brief"}
              </Button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}