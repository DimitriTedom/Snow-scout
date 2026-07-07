import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { saveUserBrief } from "@/lib/scout/brief-storage";
import { buildOutlierBrief } from "@/lib/scout/outlier-brief";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  projectId: z.string(),
  videoUrl: z.string().min(1),
  remixMethod: z.string().optional(),
  includeScoutIdeas: z.boolean().optional(),
  ideaCount: z.number().int().min(1).max(5).optional(),
});

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
      { error: "Add channel bible text to your project before building an outlier brief." },
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
      scoutIdeaCount: parsed.data.ideaCount ?? 3,
    });

    const saved = await saveUserBrief(user.id, project.id, brief);

    return NextResponse.json({
      brief,
      storagePath: saved.storagePath,
      savedIdeaId: saved.savedIdeaId,
      storage: saved.storage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Outlier brief failed" },
      { status: 500 },
    );
  }
}