import Link from "next/link";
import { ArrowLeft, FolderKanban, Plug } from "lucide-react";
import { redirect } from "next/navigation";

import { ProjectSetupForm } from "@/components/scout/project-setup-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Workspace",
  description: "Viral outlier search and cross-niche remix for your channel projects.",
};

export default async function ScoutPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login?next=/scout");

  const projects = await prisma.channelProject.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { keywords: true, competitors: true, ideas: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 cursor-pointer px-2 text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Home
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Any niche</Badge>
            <Badge variant="secondary">Engagement-ranked</Badge>
            <Badge variant="outline">OpenRouter remix</Badge>
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Outliers → <span className="text-primary">your angle</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Paste your channel bible, add competitor seeds, search by keyword, and remix viral videos
            into CTR-ready ideas for your niche.
          </p>
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link href="/mcp" className="flex items-center gap-1.5">
              <Plug className="h-3.5 w-3.5" />
              Connect your AI agent (MCP)
            </Link>
          </Button>
        </div>
      </div>

      {projects.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Your channel projects</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="snow-panel flex items-center justify-between gap-4 p-4 transition-colors hover:border-primary/25"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p._count.keywords} keywords · {p._count.competitors} competitors · {p._count.ideas}{" "}
                    ideas
                  </p>
                </div>
                <Button asChild size="sm" className="cursor-pointer shrink-0">
                  <Link href={`/scout/projects/${p.id}`}>Open</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProjectSetupForm />
    </div>
  );
}