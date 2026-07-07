import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { generateRemixIdeas } from "@/lib/remix";
import { prisma } from "@/lib/prisma";
import { analyzeVideo } from "@/lib/scout/youtube";

const bodySchema = z.object({
  projectId: z.string(),
  videoUrl: z.string().min(1),
  count: z.number().int().min(1).max(5).optional(),
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
  if (!project?.bibleText?.trim()) {
    return NextResponse.json({ error: "Project or bible not found" }, { status: 404 });
  }

  try {
    const source = await analyzeVideo(parsed.data.videoUrl);
    if (!source) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const remix = await generateRemixIdeas({
      source,
      channelName: project.name,
      bibleText: project.bibleText.slice(0, 3500),
      count: parsed.data.count ?? 3,
    });

    return NextResponse.json(remix);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Remix ideas failed" },
      { status: 500 },
    );
  }
}