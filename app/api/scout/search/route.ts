import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { rankByEngagement, searchOutliers } from "@/lib/scout/youtube";

const bodySchema = z.object({
  query: z.string().min(1),
  projectId: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
});

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { query, projectId, maxResults } = parsed.data;

  try {
    const results = rankByEngagement(await searchOutliers({ query, maxResults }));

    if (projectId) {
      const project = await prisma.channelProject.findFirst({
        where: { id: projectId, userId: user.id },
      });
      if (project) {
        await prisma.scoutSearchRun.create({
          data: {
            projectId: project.id,
            query,
            resultJson: results,
          },
        });
      }
    }

    return NextResponse.json({ query, count: results.length, results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 },
    );
  }
}