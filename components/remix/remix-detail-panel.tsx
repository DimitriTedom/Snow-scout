"use client";

import { useState } from "react";
import { Check, MessageSquare, Sparkles, TrendingUp, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OutlierBrief } from "@/lib/scout/outlier-brief";

type Tab = "overview" | "viral" | "comments" | "ideas" | "grok";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "viral", label: "Viral signals", icon: Sparkles },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "ideas", label: "Scout ideas", icon: Wand2 },
  { id: "grok", label: "Grok export", icon: Check },
];

export function RemixDetailPanel({ brief }: { brief: OutlierBrief }) {
  const [tab, setTab] = useState<Tab>("overview");
  const stats = brief.sourceOutlier.statistics;
  const drivers = brief.viralSignals?.likelyViralityDrivers ?? [];
  const comments = brief.topComments ?? [];
  const ideas = brief.scoutGeneratedIdeas ?? [];

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Remix brief sections"
        className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-background/40 p-1"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="snow-panel p-5">
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Views", value: stats.views.toLocaleString() },
                { label: "Outlier score", value: stats.outlierScore.toFixed(2) },
                { label: "Engagement", value: `${(stats.engagementRate * 100).toFixed(2)}%` },
                { label: "Comments", value: stats.comments.toLocaleString() },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-background/40 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>
            {brief.userRemixMethod && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your remix method
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{brief.userRemixMethod}</p>
              </div>
            )}
            {brief.sourceChannel && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{brief.sourceChannel.title}</Badge>
                {brief.sourceChannel.statistics.subscriberCount != null && (
                  <Badge variant="secondary">
                    {brief.sourceChannel.statistics.subscriberCount.toLocaleString()} subs
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "viral" && (
          <div className="space-y-4">
            <Badge variant="success">{brief.viralSignals.engagementTier} engagement</Badge>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Likely virality drivers
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {drivers.map((d) => (
                  <li key={d} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            {brief.viralSignals.commentSentimentThemes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {brief.viralSignals.commentSentimentThemes.map((theme) => (
                  <Badge key={theme} variant="outline">
                    {theme}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "comments" && (
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comment highlights in this brief.</p>
            ) : (
              comments.map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/10 bg-background/40 p-3 text-sm"
                >
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">{c.authorDisplayName}</span>
                    {" · "}
                    {c.likeCount.toLocaleString()} likes
                  </p>
                  <p className="mt-1">{c.text}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "ideas" && (
          <div className="space-y-3">
            {ideas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No Scout starter ideas yet — add them from the Scout workspace.
              </p>
            ) : (
              ideas.map((idea, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-background/40 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="default">Option {i + 1}</Badge>
                    <Badge variant="outline">{idea.angle}</Badge>
                  </div>
                  <p className="font-medium">{idea.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{idea.hook}</p>
                  {idea.rationale && (
                    <p className="mt-2 text-xs text-muted-foreground">{idea.rationale}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "grok" && (
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-background/60 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
            {brief.grokPastePrompt}
          </pre>
        )}
      </div>
    </div>
  );
}