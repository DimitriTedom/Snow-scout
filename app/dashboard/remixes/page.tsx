import Link from "next/link";
import { ArrowLeft, Layers, Radar, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { RemixCard } from "@/components/remix/remix-card";
import { RemixProjectFilter } from "@/components/remix/remix-project-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth/get-user";
import { listUserRemixes } from "@/lib/scout/saved-ideas";

export const metadata = {
  title: "Remix library",
  description: "Every outlier brief you have built — stats, viral signals, and Grok exports.",
};

type SearchParams = Promise<{ project?: string }>;

export default async function RemixLibraryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login?next=/dashboard/remixes");

  const { project: projectFilter } = await searchParams;

  const allRemixes = await listUserRemixes(user.id);
  const remixes = projectFilter
    ? allRemixes.filter((r) => r.projectId === projectFilter)
    : allRemixes;

  const projectChips = Array.from(
    allRemixes.reduce((map, r) => {
      const entry = map.get(r.projectId) ?? { id: r.projectId, name: r.projectName, count: 0 };
      entry.count += 1;
      map.set(r.projectId, entry);
      return map;
    }, new Map<string, { id: string; name: string; count: number }>()),
  )
    .map(([, value]) => value)
    .sort((a, b) => a.name.localeCompare(b.name));

  const shortlisted = remixes.filter((r) => r.status === "SHORTLISTED" || r.status === "APPROVED").length;
  const inProduction = remixes.filter((r) => r.status === "IN_PRODUCTION").length;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 cursor-pointer px-2 text-muted-foreground">
          <Link href="/dashboard">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Dashboard
          </Link>
        </Button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">Remix library</Badge>
              <Badge variant="outline">{remixes.length} briefs</Badge>
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Your <span className="text-primary">outlier remixes</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every brief you build in Scout is saved here — source stats, viral signals, top comments,
              Scout starter ideas, and the Grok paste prompt.
            </p>
          </div>
          <Button asChild className="cursor-pointer snow-glow shrink-0">
            <Link href="/scout">
              <Radar className="mr-2 h-4 w-4" />
              Build new brief
            </Link>
          </Button>
        </div>
      </div>

      {remixes.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="snow-panel flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total briefs</p>
              <p className="text-2xl font-semibold tabular-nums">{remixes.length}</p>
            </div>
          </div>
          <div className="snow-panel flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Shortlisted / approved</p>
              <p className="text-2xl font-semibold tabular-nums">{shortlisted}</p>
            </div>
          </div>
          <div className="snow-panel flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Radar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In production</p>
              <p className="text-2xl font-semibold tabular-nums">{inProduction}</p>
            </div>
          </div>
        </div>
      )}

      {projectChips.length > 1 && (
        <RemixProjectFilter projects={projectChips} activeProjectId={projectFilter} />
      )}

      {remixes.length === 0 ? (
        <div className="snow-panel flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">No remixes yet</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Search for outliers in Scout and hit <strong>Build brief</strong> — each one lands here
              automatically with full viral analysis.
            </p>
          </div>
          <Button asChild className="cursor-pointer snow-glow">
            <Link href="/scout">Open Scout workspace</Link>
          </Button>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {remixes.map((remix) => (
            <RemixCard key={remix.id} remix={remix} />
          ))}
        </section>
      )}
    </div>
  );
}