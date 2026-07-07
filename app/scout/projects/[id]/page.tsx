import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ScoutWorkspace } from "@/components/scout/scout-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export default async function ScoutProjectPage({ params }: Params) {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login?next=/scout");

  const { id } = await params;
  const project = await prisma.channelProject.findFirst({
    where: { id, userId: user.id },
    include: { keywords: true },
  });

  if (!project) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 cursor-pointer px-2 text-muted-foreground">
          <Link href="/scout">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            All projects
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">{project.name}</Badge>
          <Badge variant="outline">{project.keywords.length} seed keywords</Badge>
        </div>
      </div>

      <ScoutWorkspace
        projectId={project.id}
        projectName={project.name}
        seedKeywords={project.keywords.map((k) => k.keyword)}
      />
    </div>
  );
}