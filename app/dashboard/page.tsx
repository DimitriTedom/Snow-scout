import Link from "next/link";
import { ArrowRight, Layers, Radar, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { listUserRemixes } from "@/lib/scout/saved-ideas";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const [projectCount, remixes] = await Promise.all([
    prisma.channelProject.count({ where: { userId: user.id } }),
    listUserRemixes(user.id),
  ]);

  const recentRemixes = remixes.slice(0, 3);
  const inPipeline = remixes.filter(
    (r) => r.status === "SHORTLISTED" || r.status === "APPROVED" || r.status === "IN_PRODUCTION",
  ).length;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Signed in as {user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="snow-panel p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Radar className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">Channel projects</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{projectCount}</p>
          <Button asChild size="sm" className="mt-4 cursor-pointer">
            <Link href="/scout">Open Scout</Link>
          </Button>
        </div>

        <div className="snow-panel p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Layers className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">Saved remixes</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{remixes.length}</p>
          <Button asChild size="sm" variant="outline" className="mt-4 cursor-pointer">
            <Link href="/dashboard/remixes">Remix library</Link>
          </Button>
        </div>

        <div className="snow-panel p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">In pipeline</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{inPipeline}</p>
          <p className="mt-2 text-xs text-muted-foreground">Shortlisted → in production</p>
        </div>

        <div className="snow-panel p-5">
          <p className="font-semibold">Snow Transcriber</p>
          <p className="mt-2 text-sm text-muted-foreground">Voiceover → timestamped scenes</p>
          <Button asChild variant="outline" size="sm" className="mt-4 cursor-pointer">
            <a href="http://localhost:3001" target="_blank" rel="noreferrer">
              Open :3001
            </a>
          </Button>
        </div>
      </div>

      {recentRemixes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Recent remixes</h2>
            <Button asChild variant="ghost" size="sm" className="cursor-pointer">
              <Link href="/dashboard/remixes">View all</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recentRemixes.map((remix) => (
              <Link
                key={remix.id}
                href={`/dashboard/remixes/${remix.id}`}
                className="snow-panel group cursor-pointer p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex gap-3">
                  {remix.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={remix.thumbnailUrl}
                      alt=""
                      className="h-14 w-24 shrink-0 rounded-lg border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background/60">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                      {remix.sourceTitle ?? remix.remixTitle}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{remix.projectName}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {remix.outlierScore != null && (
                        <Badge variant="outline">{(remix.outlierScore).toFixed(2)}</Badge>
                      )}
                      <Badge variant="secondary">{remix.status.toLowerCase()}</Badge>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="snow-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Snow Video Studio pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Scout → Remix library → Script → Transcriber → Assembler → YouTube
          </p>
        </div>
        <Button asChild className="cursor-pointer snow-glow shrink-0">
          <Link href="/scout">
            Continue in Scout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}