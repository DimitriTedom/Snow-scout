import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { buildOutlierBrief } from "@/lib/scout/outlier-brief";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  projectId: z.string(),
  videoUrl: z.string().min(1),
  remixMethod: z.string().optional(),
  count: z.number().int().min(1).max(5).optional(),
  includeScoutIdeas: z.boolean().optional(),
});

/** Legacy path — returns full Grok-ready outlier brief (same as /api/scout/outlier-brief). */
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.channelProject.findFirst({
    where: { id: parsed.data.projectId, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.bibleText?.trim()) {
    return NextResponse.json(
      { error: "Add channel bible text to your project before remixing." },
      { status: 400 },
    );
  }

  try {
    const brief = await buildOutlierBrief({
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        bibleText: project.bibleText,
      },
      videoUrl: parsed.data.videoUrl,
      userRemixMethod: parsed.data.remixMethod,
      includeScoutIdeas: parsed.data.includeScoutIdeas ?? false,
      scoutIdeaCount: parsed.data.count ?? 3,
    });

    return NextResponse.json({
      brief,
      // Back-compat for older UI expecting remix.suggestions
      source: brief.sourceOutlier,
      remix: {
        provider: brief.scoutRemixProvider,
        suggestions: brief.scoutGeneratedIdeas ?? [],
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Remix failed" },
      { status: 500 },
    );
  }
}