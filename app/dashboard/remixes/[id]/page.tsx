import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { RemixDetailActions } from "@/components/remix/remix-detail-actions";
import { RemixDetailPanel } from "@/components/remix/remix-detail-panel";
import { RemixStatusSelect } from "@/components/remix/remix-status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  getUserRemix,
  IDEA_STATUS_LABELS,
  IDEA_STATUS_VARIANT,
} from "@/lib/scout/saved-ideas";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const user = await getAuthUser();
  if (!user) return { title: "Remix detail" };

  const { id } = await params;
  const remix = await getUserRemix(user.id, id);
  return {
    title: remix?.sourceTitle ?? remix?.remixTitle ?? "Remix detail",
  };
}

export default async function RemixDetailPage({ params }: Params) {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login?next=/dashboard/remixes");

  const { id } = await params;
  const remix = await getUserRemix(user.id, id);
  if (!remix) notFound();

  const brief = remix.brief;
  const stats = brief?.sourceOutlier.statistics;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 cursor-pointer px-2 text-muted-foreground">
          <Link href="/dashboard/remixes">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Remix library
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{remix.projectName}</Badge>
              <Badge variant={IDEA_STATUS_VARIANT[remix.status]}>
                {IDEA_STATUS_LABELS[remix.status]}
              </Badge>
              {remix.engagementTier && <Badge variant="success">{remix.engagementTier}</Badge>}
            </div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {remix.sourceTitle ?? remix.remixTitle}
            </h1>
            {remix.sourceUrl && (
              <a
                href={remix.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
              >
                Watch source outlier
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="snow-panel space-y-3 p-4 lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Production status
            </p>
            <RemixStatusSelect ideaId={remix.id} initialStatus={remix.status} />
            <p className="text-xs text-muted-foreground">
              Updated {remix.updatedAt.toLocaleString()}
            </p>
            <Button asChild variant="outline" size="sm" className="w-full cursor-pointer">
              <Link href={`/scout/projects/${remix.projectId}`}>Open Scout project</Link>
            </Button>
          </div>
        </div>
      </div>

      {brief ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="snow-panel overflow-hidden p-0">
              {brief.sourceOutlier.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brief.sourceOutlier.thumbnailUrl}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-background/60 text-muted-foreground">
                  No thumbnail
                </div>
              )}
            </div>
            <div className="snow-panel space-y-4 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Quick stats
              </p>
              {stats && (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Views</dt>
                    <dd className="text-lg font-semibold tabular-nums">{stats.views.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Score</dt>
                    <dd className="text-lg font-semibold tabular-nums">{stats.outlierScore.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Engagement</dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {(stats.engagementRate * 100).toFixed(2)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Likes</dt>
                    <dd className="text-lg font-semibold tabular-nums">{stats.likes.toLocaleString()}</dd>
                  </div>
                </dl>
              )}
              {remix.remixAngle && (
                <div>
                  <p className="text-xs text-muted-foreground">Remix angle</p>
                  <p className="mt-1 text-sm">{remix.remixAngle}</p>
                </div>
              )}
              <RemixDetailActions brief={brief} />
            </div>
          </div>

          <RemixDetailPanel brief={brief} />
        </>
      ) : (
        <div className="snow-panel p-6 text-sm text-muted-foreground">
          Brief JSON is missing for this remix. Rebuild it from the Scout workspace.
        </div>
      )}
    </div>
  );
}