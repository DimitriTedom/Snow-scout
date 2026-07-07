import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { analyzeVideo } from "@/lib/scout/youtube";

const bodySchema = z.object({
  competitors: z
    .array(z.object({ channelUrl: z.string().min(1), label: z.string().optional() }))
    .optional(),
  keywords: z.array(z.string().min(1)).optional(),
  outliers: z
    .array(z.object({ videoUrl: z.string().min(1), notes: z.string().optional() }))
    .optional(),
  replace: z.boolean().default(true),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.channelProject.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { competitors, keywords, outliers, replace } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (replace) {
      if (competitors) await tx.competitorChannel.deleteMany({ where: { projectId: id } });
      if (keywords) await tx.seedKeyword.deleteMany({ where: { projectId: id } });
      if (outliers) await tx.seedOutlier.deleteMany({ where: { projectId: id } });
    }

    if (competitors?.length) {
      await tx.competitorChannel.createMany({
        data: competitors.map((c) => ({
          projectId: id,
          channelUrl: c.channelUrl,
          label: c.label ?? null,
        })),
      });
    }

    if (keywords?.length) {
      await tx.seedKeyword.createMany({
        data: keywords.map((keyword) => ({ projectId: id, keyword })),
      });
    }

    if (outliers?.length) {
      for (const o of outliers) {
        const stats = await analyzeVideo(o.videoUrl);
        await tx.seedOutlier.create({
          data: {
            projectId: id,
            videoUrl: o.videoUrl,
            videoId: stats?.videoId ?? null,
            title: stats?.title ?? null,
            notes: o.notes ?? null,
            views: stats?.views != null ? BigInt(stats.views) : null,
            likes: stats?.likes != null ? BigInt(stats.likes) : null,
            comments: stats?.comments != null ? BigInt(stats.comments) : null,
          },
        });
      }
    }
  });

  const updated = await prisma.channelProject.findFirst({
    where: { id },
    include: { competitors: true, keywords: true, outliers: true },
  });

  return NextResponse.json({ project: updated });
}