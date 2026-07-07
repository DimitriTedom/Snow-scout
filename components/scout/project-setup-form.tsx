"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const textareaClass =
  "border-input bg-background/60 ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-xl border border-white/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2";

export function ProjectSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [bibleText, setBibleText] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [keywords, setKeywords] = useState("");
  const [outliers, setOutliers] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function autoSlug(value: string) {
    setName(value);
    if (!slug) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      );
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, bibleText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");

      const projectId = data.project.id as string;
      const competitorList = competitors
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((channelUrl) => ({ channelUrl }));
      const keywordList = keywords
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const outlierList = outliers
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((videoUrl) => ({ videoUrl }));

      if (competitorList.length || keywordList.length || outlierList.length) {
        const seedRes = await fetch(`/api/projects/${projectId}/seeds`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            competitors: competitorList,
            keywords: keywordList,
            outliers: outlierList,
            replace: true,
          }),
        });
        if (!seedRes.ok) {
          const seedData = await seedRes.json();
          throw new Error(seedData.error ?? "Seeds save failed");
        }
      }

      router.push(`/scout/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="snow-panel space-y-4 p-6">
        <h2 className="text-lg font-semibold">New channel project</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Channel / project name</Label>
            <Input id="name" value={name} onChange={(e) => autoSlug(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bible">Channel bible (paste markdown)</Label>
          <textarea
            id="bible"
            className={`${textareaClass} min-h-[200px]`}
            value={bibleText}
            onChange={(e) => setBibleText(e.target.value)}
            placeholder="Paste your ghost niche bible, positioning, title formulas…"
            required
          />
        </div>
      </div>

      <div className="snow-panel space-y-4 p-6">
        <h2 className="text-lg font-semibold">Research seeds (optional)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Competitor channel URLs</Label>
            <textarea
              className={textareaClass}
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="One URL per line"
            />
          </div>
          <div className="space-y-2">
            <Label>Seed keywords</Label>
            <textarea
              className={textareaClass}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="One keyword per line"
            />
          </div>
          <div className="space-y-2">
            <Label>Known outlier URLs</Label>
            <textarea
              className={textareaClass}
              value={outliers}
              onChange={(e) => setOutliers(e.target.value)}
              placeholder="One YouTube URL per line"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="cursor-pointer snow-glow">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Create project &amp; open Scout
          </>
        )}
      </Button>
    </form>
  );
}