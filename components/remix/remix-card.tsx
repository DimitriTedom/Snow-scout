import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IDEA_STATUS_LABELS,
  IDEA_STATUS_VARIANT,
  type RemixListItem,
} from "@/lib/scout/saved-ideas";

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RemixCard({ remix }: { remix: RemixListItem }) {
  return (
    <article className="snow-panel group flex flex-col overflow-hidden transition-colors hover:border-primary/30">
      <div className="relative aspect-video w-full overflow-hidden bg-background/60">
        {remix.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={remix.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Sparkles className="h-8 w-8 opacity-40" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-3 pt-10">
          <Badge variant={IDEA_STATUS_VARIANT[remix.status]} className="mb-2">
            {IDEA_STATUS_LABELS[remix.status]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="line-clamp-2 font-medium leading-snug">
            {remix.sourceTitle ?? remix.remixTitle}
          </p>
          <p className="text-xs text-muted-foreground">{remix.projectName}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {remix.outlierScore != null && (
            <Badge variant="outline">score {remix.outlierScore.toFixed(2)}</Badge>
          )}
          {remix.engagementRate != null && (
            <Badge variant="secondary">{(remix.engagementRate * 100).toFixed(1)}% eng.</Badge>
          )}
          {remix.engagementTier && <Badge variant="success">{remix.engagementTier}</Badge>}
          {remix.scoutIdeaCount > 0 && (
            <Badge variant="outline">{remix.scoutIdeaCount} ideas</Badge>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">{formatRelative(remix.updatedAt)}</span>
          <Button asChild size="sm" className="cursor-pointer">
            <Link href={`/dashboard/remixes/${remix.id}`}>
              Open
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}