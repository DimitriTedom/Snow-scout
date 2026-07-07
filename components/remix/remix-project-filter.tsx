import Link from "next/link";

import { cn } from "@/lib/utils";

export function RemixProjectFilter({
  projects,
  activeProjectId,
}: {
  projects: { id: string; name: string; count: number }[];
  activeProjectId?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by project">
      <Link
        href="/dashboard/remixes"
        className={cn(
          "inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !activeProjectId
            ? "border-primary/40 bg-primary/15 text-primary"
            : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground",
        )}
      >
        All projects
      </Link>
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/dashboard/remixes?project=${p.id}`}
          className={cn(
            "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            activeProjectId === p.id
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground",
          )}
        >
          {p.name}
          <span className="text-xs opacity-70">({p.count})</span>
        </Link>
      ))}
    </div>
  );
}